import { randomInt, randomUUID } from 'node:crypto';

export const createId = (): string => randomUUID();
export const drawCodeCandidate = (): number => randomInt(1_000_000);
export const drawChoiceRevision = (): number => randomInt(1, 2 ** 48 - 1024);
