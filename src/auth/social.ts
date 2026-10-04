import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import type { SocialProvider } from '../api/types';
import { GOOGLE_IOS_CLIENT_ID } from '../config';

export interface SocialIdentity {
  provider: SocialProvider;
  idToken: string;
  nonce?: string;
  name?: string;
}

export class SocialSignInCancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'SocialSignInCancelled';
  }
}

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export const isGoogleConfigured = (): boolean => !!GOOGLE_IOS_CLIENT_ID;

/** iOS OAuth clients use the reversed client ID as their redirect scheme. */
function googleRedirectUri(clientId: string): string {
  const reversed = clientId.replace(/\.apps\.googleusercontent\.com$/, '');
  return `com.googleusercontent.apps.${reversed}:/oauthredirect`;
}

export async function signInWithGoogle(): Promise<SocialIdentity> {
  const clientId = GOOGLE_IOS_CLIENT_ID;
  if (!clientId) throw new Error('Google sign-in is not configured');

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri: googleRedirectUri(clientId),
    scopes: ['openid', 'email', 'profile'],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY);
  if (result.type !== 'success') throw new SocialSignInCancelled();

  const tokens = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: result.params.code,
      redirectUri: request.redirectUri,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    GOOGLE_DISCOVERY,
  );

  if (!tokens.idToken) throw new Error('Google did not return an ID token');
  return { provider: 'google', idToken: tokens.idToken };
}

export async function isAppleAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

export async function signInWithApple(): Promise<SocialIdentity> {
  const nonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') throw new SocialSignInCancelled();
    throw e;
  }

  if (!credential.identityToken) throw new Error('Apple did not return an identity token');

  const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ') || undefined;
  return { provider: 'apple', idToken: credential.identityToken, nonce, name };
}
