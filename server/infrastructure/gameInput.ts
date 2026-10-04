import type { OpeningDirectionRequest, PlayCardRequest } from '../../shared/contracts/game.js';
import { RoomError } from '../application/roomError.js';
import { exactObject } from './configurationInput.js';

export function gameInput(value: unknown, play: false): OpeningDirectionRequest;
export function gameInput(value: unknown, play: true): PlayCardRequest;
export function gameInput(value: unknown, play: boolean): OpeningDirectionRequest | PlayCardRequest {
  const keys = ['requestId', 'roomId', 'gameId', 'roundNumber', 'turnId', 'direction', ...(play ? ['cardId'] : [])];
  if (!exactObject(value, keys) || ['requestId', 'roomId', 'gameId', 'turnId', ...(play ? ['cardId'] : [])].some((key) => typeof value[key] !== 'string' || !(value[key] as string).length || (value[key] as string).length > 100)
    || !Number.isSafeInteger(value.roundNumber) || (value.roundNumber as number) <= 0
    || !(value.direction === 'HIGH' || value.direction === 'LOW' || play && value.direction === null)) {
    throw new RoomError('INVALID_INPUT', 'Los datos de la jugada no son válidos.');
  }
  return value as OpeningDirectionRequest | PlayCardRequest;
}
