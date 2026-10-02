import { afterEach, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

afterEach(() => vi.unstubAllGlobals());
it('B04-09 api.decks usa el transporte existente, respuesta segura y errores', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response('{"decks":[]}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
  vi.stubGlobal('fetch', fetch);
  expect(await api.decks()).toEqual({ decks: [] });
  expect(fetch).toHaveBeenCalledWith('/api/decks', expect.objectContaining({ credentials: 'same-origin' }));
  fetch.mockResolvedValueOnce(new Response('{"error":{"code":"INTERNAL_ERROR","message":"Fallo"}}', { status: 500 }));
  await expect(api.decks()).rejects.toMatchObject({ code: 'INTERNAL_ERROR', message: 'Fallo' });
  fetch.mockRejectedValueOnce(new TypeError());
  await expect(api.decks()).rejects.toBeInstanceOf(ApiError);
});
