import { useEffect, useReducer, useRef } from 'react';
import type { ConfigurationChange, RoomView } from '../shared/contracts/room';
import { ApiError } from './api';
import { configurationState, UNCONFIRMED } from './configurationState';
import { sendConfiguration, socket } from './socket';

export function useRoomConfiguration(room: RoomView, acceptRoom: (room: RoomView) => boolean) {
  const [attempts, dispatch] = useReducer(configurationState, {});
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    const disconnect = () => dispatch({ type: 'disconnect' });
    socket.on('disconnect', disconnect);
    return () => { active.current = false; socket.off('disconnect', disconnect); };
  }, []);

  async function change(change: ConfigurationChange) {
    const requestId = crypto.randomUUID();
    dispatch({ type: 'start', requestId, change });
    try {
      const result = await sendConfiguration({ requestId, roomId: room.id, change });
      if (!active.current) return;
      acceptRoom(result.room);
      dispatch({ type: 'finish', field: change.field, requestId, status: 'ACCEPTED', message: 'Cambio aceptado' });
    } catch (error) {
      if (!active.current) return;
      dispatch({ type: 'finish', field: change.field, requestId, status: 'ERROR',
        message: error instanceof ApiError && error.code !== 'NETWORK_ERROR' ? error.message : UNCONFIRMED });
    }
  }
  return { attempts, change };
}
