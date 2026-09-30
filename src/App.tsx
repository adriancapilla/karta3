import { HomeScreen, WaitingScreen } from './screens';
import { useRoomFlow } from './useRoomFlow';
import './style.css';

export default function App() {
  const flow = useRoomFlow();
  if (flow.loading) return <main className="shell"><p role="status">Cargando tu sala…</p></main>;
  if (!flow.room) return <HomeScreen
    busy={flow.busy} joining={flow.joining} notice={flow.notice} code={flow.code} joinName={flow.joinName} joinError={flow.joinError}
    onCreate={() => void flow.createRoom()} onRefresh={() => void flow.refresh()} onJoin={() => void flow.joinRoom()}
    onCodeChange={flow.setCode} onJoinNameChange={flow.setJoinName}
  />;

  return <WaitingScreen
    room={flow.room}
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
