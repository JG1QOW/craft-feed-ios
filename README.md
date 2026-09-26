# Craft Feed iOS

[Craft Feed](https://craft-feed.com) の iOS クライアント（Expo / React Native）。
サーバーは既存の Laravel アプリ（[JG1QOW/craft-feed](https://github.com/JG1QOW/craft-feed)）の `/api/v1` をそのまま利用します。このリポジトリに独自のバックエンドはありません。

## 機能（v1）

- ログイン / アカウント作成 / パスワード再設定メール送信（Sanctum トークン、Keychain に保存）
- My Items：未読のみ/すべての切替、無限スクロール、タップで SFSafariView 表示 + 既読化、長押しで既読/未読切替
- My Feeds：一覧、停止/再開、削除、ソースサイトを開く
- 設定：言語（English / 日本語、サーバー側 `users.language` と同期）、ログアウト、アカウント削除（App Store 5.1.1(v) 対応）

フィードの新規作成・パターン編集は Web 側で行う前提です。

## 開発

```bash
npm install
npx expo start          # 開発サーバー。iPhone の Expo Go で QR を読み込む
npm run typecheck       # tsc --noEmit
npm run lint            # expo lint
npm test                # jest
```

### API の接続先

既定は `https://craft-feed.com`（`app.json` の `extra.apiUrl`）。
ローカルの Laravel に向ける場合は環境変数で上書きします：

```bash
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000 npx expo start
```

（実機からは `localhost` ではなく PC の LAN IP を指定してください。）

## ビルド / 配布（EAS）

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile production   # クラウドで .ipa を作成
eas submit --platform ios                       # TestFlight / App Store Connect へ提出
```

EAS プロジェクトは expo.dev の `craft-feed-ios`（`app.json` の `extra.eas.projectId`）に紐づいています。初回の `eas build` では Apple Developer アカウントでのログインを求められ、証明書と Provisioning Profile が自動生成されます。

Apple Developer Program のアカウントと、`app.json` の `ios.bundleIdentifier`（現在は仮の `com.craftfeed.app`）の確定が必要です。

## 構成

```
App.tsx                     Provider 構成（Query / Auth / i18n）
src/config.ts               API ベース URL
src/api/                    型付き API クライアント（/api/v1）
src/auth/                   トークン保存（expo-secure-store）と AuthContext
src/i18n/                   en / ja 辞書
src/navigation/             Auth スタック / メインタブ
src/screens/                Login, Register, Items, Feeds, Settings, DeleteAccount
```
