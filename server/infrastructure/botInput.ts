import type { BotOperation } from '../../shared/contracts/room.js';
import { RoomError } from '../application/roomError.js';
import { exactObject } from './configurationInput.js';

export function botInput(value: unknown, type: BotOperation['type']): { requestId: string; roomId: string; operation: BotOperation } {
  const keys = ['requestId', 'roomId', ...(type === 'ADD' ? [] : ['botId']), ...(type === 'RENAME' ? ['name'] : type === 'DIFFICULTY' ? ['difficulty'] : [])];
  const id = (input: unknown): input is string => typeof input === 'string' && input.length > 0 && input.length <= 100;
  const invalid = () => new RoomError('INVALID_INPUT', 'Los datos de gestión del bot no son válidos.');
  if (!exactObject(value, keys) || !id(value.requestId) || !id(value.roomId) || type !== 'ADD' && !id(value.botId)) throw invalid();
  let operation: BotOperation;
  if (type === 'ADD') operation = { type };
  else if (type === 'REMOVE') operation = { type, botId: value.botId as string };
  else if (type === 'DIFFICULTY') {
    if (value.difficulty !== 'EASY' && value.difficulty !== 'NORMAL') throw invalid();
    operation = { type, botId: value.botId as string, difficulty: value.difficulty };
  } else {
    if (typeof value.name !== 'string' || value.name.length > 128) throw invalid();
    operation = { type, botId: value.botId as string, name: value.name };
  }
  return { requestId: value.requestId, roomId: value.roomId, operation };
}
