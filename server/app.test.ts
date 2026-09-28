import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { RoomStore } from './roomStore.js';

function token(setCookie: string[] | undefined): string {
  const value = setCookie?.[0]?.split(';')[0];
  if (!value) throw new Error('Cookie ausente');
  return value;
}

describe('HTTP sala propia', () => {
  it('E1/E3 establece sesión y serializa creaciones casi simultáneas de dos sesiones', async () => {
    const app = createApp();
    const a = token((await request(app).get('/api/rooms/current')).headers['set-cookie']);
    const b = token((await request(app).get('/api/rooms/current')).headers['set-cookie']);
    const [first, second] = await Promise.all([
      request(app).post('/api/rooms').set('Cookie', a).send({}),
      request(app).post('/api/rooms').set('Cookie', a).send({})
    ]);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.room.id).toBe(second.body.room.id);
    expect((await request(app).get('/api/rooms/current').set('Cookie', a)).body.room.id).toBe(first.body.room.id);
    const other = await request(app).post('/api/rooms').set('Cookie', b).send({});
    expect(other.body.room.id).not.toBe(first.body.room.id);
    expect(other.body.room.code).not.toBe(first.body.room.code);
  });

  it('E4/E5 mantiene nombre al recuperar y deniega lectura, edición y cierre ajenos', async () => {
    const app = createApp();
    const a = token((await request(app).get('/api/rooms/current')).headers['set-cookie']);
    const b = token((await request(app).get('/api/rooms/current')).headers['set-cookie']);
    const room = (await request(app).post('/api/rooms').set('Cookie', a).send({})).body.room;
    const path = `/api/rooms/${room.id}`;
    expect((await request(app).patch(`${path}/name`).set('Cookie', a).send({ name: ' Ana María ' })).body.room.participant.name).toBe('Ana María');
    expect((await request(app).get('/api/rooms/current').set('Cookie', a)).body.room.participant.name).toBe('Ana María');
    for (const name of ['', 'a'.repeat(17), 'A\nB']) {
      const invalid = await request(app).patch(`${path}/name`).set('Cookie', a).send({ name });
      expect(invalid.status).toBe(400);
      expect(invalid.body.error.code).toBe('INVALID_INPUT');
    }
    expect((await request(app).get(path).set('Cookie', a)).body.room.participant.name).toBe('Ana María');
    expect((await request(app).get(path).set('Cookie', b)).status).toBe(403);
    expect((await request(app).patch(`${path}/name`).set('Cookie', b).send({ name: 'intruso' })).status).toBe(403);
    expect((await request(app).delete(path).set('Cookie', b)).status).toBe(403);
    expect((await request(app).get(path).set('Cookie', a)).body.room.participant.name).toBe('Ana María');
  });

  it('E6/E7 cierra una vez, no recupera y devuelve errores estables sin trazas', async () => {
    const app = createApp();
    const a = token((await request(app).get('/api/rooms/current')).headers['set-cookie']);
    const room = (await request(app).post('/api/rooms').set('Cookie', a).send({})).body.room;
    const path = `/api/rooms/${room.id}`;
    expect((await request(app).delete(path).set('Cookie', a)).status).toBe(204);
    expect((await request(app).get('/api/rooms/current').set('Cookie', a)).body.room).toBeNull();
    const repeated = await request(app).delete(path).set('Cookie', a);
    expect(repeated.status).toBe(404);
    expect(repeated.body.error).toEqual({ code: 'ROOM_NOT_AVAILABLE', message: 'La sala ya no está disponible.' });
    expect((await request(app).post('/api/rooms').set('Cookie', a).send({})).body.room.id).not.toBe(room.id);
    const missingSession = await request(app).post('/api/rooms').send({});
    expect(missingSession.status).toBe(401);
    expect(missingSession.body.error.code).toBe('SESSION_REQUIRED');
  });

  it('emite cookie de desarrollo y producción con atributos adecuados', async () => {
    for (const production of [false, true]) {
      const res = await request(createApp({ production })).get('/api/rooms/current');
      const header = res.headers['set-cookie'][0] as string;
      expect(header).toContain('HttpOnly');
      expect(header).toContain('SameSite=Strict');
      expect(header).not.toContain('Domain=');
      expect(header.includes('Secure')).toBe(production);
    }
  });

  it('E7 muestra estado perdido tras reiniciar memoria y valida solicitudes', async () => {
    const app = createApp({ rooms: new RoomStore(() => 1) });
    const a = token((await request(app).get('/api/rooms/current')).headers['set-cookie']);
    const room = (await request(app).post('/api/rooms').set('Cookie', a).send({})).body.room;
    const restarted = createApp();
    expect((await request(restarted).get(`/api/rooms/${room.id}`).set('Cookie', a)).status).toBe(401);
    expect((await request(restarted).get('/api/rooms/current').set('Cookie', a)).body.room).toBeNull();
    const bad = await request(app).post('/api/rooms').set('Cookie', a).send({ name: 'Intruso' });
    expect(bad.status).toBe(400);
    expect((await request(app).patch(`/api/rooms/${room.id}/name`).set('Cookie', a).set('Origin', 'https://evil.example').send({ name: 'X' })).status).toBe(403);
  });
});
