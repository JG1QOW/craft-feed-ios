import { ApiError, auth, feeds, items, request, setUnauthorizedHandler } from '../client';
import { API_V1 } from '../../config';

const mockFetch = jest.fn();

function jsonResponse(status: number, body: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

describe('request', () => {
  it('sends bearer token and JSON body', async () => {
    mockFetch.mockReturnValue(jsonResponse(200, { ok: true }));
    await request('/x', { method: 'POST', token: 'tok', body: { a: 1 } });

    expect(mockFetch).toHaveBeenCalledWith(`${API_V1}/x`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer tok',
      },
      body: JSON.stringify({ a: 1 }),
    });
  });

  it('serialises query params', async () => {
    mockFetch.mockReturnValue(jsonResponse(200, { items: [] }));
    await items.list('tok', { offset: 50, limit: 25, showOnlyUnread: true });
    expect(mockFetch.mock.calls[0][0]).toBe(`${API_V1}/items?offset=50&limit=25&show_only_unread=true`);
  });

  it('throws ApiError with Laravel validation errors', async () => {
    mockFetch.mockReturnValue(
      jsonResponse(422, { message: 'The given data was invalid.', errors: { email: ['Invalid credentials'] } }),
    );
    await expect(auth.login('a@b.c', 'x')).rejects.toMatchObject<Partial<ApiError>>({
      status: 422,
      message: 'The given data was invalid.',
      errors: { email: ['Invalid credentials'] },
    });
  });

  it('invokes the unauthorized handler on 401 for authenticated calls only', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);

    mockFetch.mockReturnValue(jsonResponse(401, { message: 'Unauthenticated.' }));
    await expect(feeds.list('expired')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);

    await expect(auth.login('a@b.c', 'bad')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);

    setUnauthorizedHandler(null);
  });

  it('includes device_name on login', async () => {
    mockFetch.mockReturnValue(jsonResponse(201, { token: 't', token_type: 'Bearer', user: {} }));
    await auth.login('a@b.c', 'pw');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({ email: 'a@b.c', password: 'pw', device_name: expect.any(String) });
  });
});
