import { HomeScreen, WaitingScreen } from './screens';
import { useRoomFlow } from './useRoomFlow';
import { GameScreen } from './GameScreen';
import { ResultsScreen } from './ResultsScreen';
import './style.css';

export default function App() {
  const flow = useRoomFlow();
  if (flow.loading) return <main className="shell"><p role="status">Cargando tu sala…</p></main>;
  if (!flow.room) return <HomeScreen
    busy={flow.busy} joining={flow.joining} notice={flow.notice} code={flow.code} joinName={flow.joinName} joinError={flow.joinError}
    onCreate={() => void flow.createRoom()} onRefresh={() => void flow.refresh()} onJoin={() => void flow.joinRoom()}
    onCodeChange={flow.setCode} onJoinNameChange={flow.setJoinName}
    lastResult={flow.lastResult} onViewResult={(gameId) => void flow.openResult(gameId)}
  />;

  if (flow.room.status === 'IN_GAME') return <GameScreen room={flow.room} connected={flow.connected} activity={flow.activity} onRoom={flow.applyRoom} onCurrent={(result) => flow.applyCurrent(result, flow.room!.id)} />;
  if (flow.room.status === 'RESULTS') return <ResultsScreen room={flow.room} activity={flow.activity} error={flow.resultError} busy={flow.busy} onHome={() => void flow.returnHome()} />;
  return <WaitingScreen
    room={flow.room}
    connected={flow.connected}
    onRoom={flow.applyRoom}
    onCurrent={(result) => flow.applyCurrent(result, flow.room!.id)}
    onConfirmExpiry={flow.confirmExpiry}
    busy={flow.busy}
    notice={flow.notice}
    activity={flow.activity}
    name={flow.name}
    nameError={flow.nameError}
    copyMessage={flow.copyMessage}
    confirmClose={flow.confirmClose}
    confirmLeave={flow.confirmLeave}
    onNameChange={flow.editName}
    onSaveName={() => void flow.saveName()}
    onCopyCode={() => void flow.copyCode()}
    onAskClose={() => flow.setConfirmClose(true)}
    onCancelClose={() => flow.setConfirmClose(false)}
    onClose={() => void flow.closeRoom()}
    onAskLeave={() => flow.setConfirmLeave(true)}
    onCancelLeave={() => flow.setConfirmLeave(false)}
    onLeave={() => void flow.leaveRoom()}
  />;
}
