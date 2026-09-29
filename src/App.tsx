import { HomeScreen, WaitingScreen } from './screens';
import { useRoomFlow } from './useRoomFlow';
import './style.css';

export default function App() {
  const flow = useRoomFlow();
  if (flow.loading) return <main className="shell"><p role="status">Cargando tu sala…</p></main>;
  if (!flow.room) return <HomeScreen busy={flow.busy} notice={flow.notice} onCreate={() => void flow.createRoom()} onRefresh={() => void flow.refresh()} />;

  return <WaitingScreen
    room={flow.room}
    busy={flow.busy}
    notice={flow.notice}
    name={flow.name}
    nameError={flow.nameError}
    copyMessage={flow.copyMessage}
    confirmClose={flow.confirmClose}
    onNameChange={flow.editName}
    onSaveName={() => void flow.saveName()}
    onCopyCode={() => void flow.copyCode()}
    onAskClose={() => flow.setConfirmClose(true)}
    onCancelClose={() => flow.setConfirmClose(false)}
    onClose={() => void flow.closeRoom()}
  />;
}
