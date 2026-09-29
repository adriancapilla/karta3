import { randomBytes, randomUUID } from 'node:crypto';

export class MemorySessions {
  private readonly tokens = new Map<string, string>();

  get(token: string | undefined): string | undefined {
    return token ? this.tokens.get(token) : undefined;
  }

  establish(): { token: string; id: string } {
    const token = randomBytes(32).toString('base64url');
    const id = randomUUID();
    this.tokens.set(token, id);
    return { token, id };
  }
}
