import type { Aggregate, UsageConfiguration, UsageEvent, UsageReportName } from './contracts.js';
import type { AppearanceValue } from '../../../shared/contracts/appearance.js';

export type Subject = { key: string; at: number; traffic: string; boot: string; detectedAt?: number } & (
  | { kind: 'view' }
  | { kind: 'create-intent' | 'join-intent'; matched: boolean; outcome?: 'NEW_JOIN' | 'EXISTING_PARTICIPATION' | 'REJECTED' }
  | { kind: 'room'; state: string; linked: boolean }
  | { kind: 'join'; outcome: string; reason: string | null; linked: boolean }
  | { kind: 'game'; state: string; configuration: UsageConfiguration; people: string[]; automatic: string[];
      appearance?: Record<string, { start?: AppearanceValue; end?: AppearanceValue }> }
  | { kind: 'end'; reason: string; duration: number }
);
export type Contribution = Aggregate & { at: number; traffic: string };
export function contributions(subject: Subject): Contribution[] {
  const rows: Contribution[] = [];
  const add = (report: UsageReportName, metric: string, count = 1, dimension = '', sum = 0, min: number | null = null, max: number | null = null) =>
    rows.push({ report, metric, count, dimension, sum, min, max, at: subject.at, traffic: subject.traffic });
  switch (subject.kind) {
    case 'view': add('access', 'views'); break;
    case 'create-intent': add('creation', 'intentions'); add('creation', subject.matched ? 'confirmed-intentions' : 'unconfirmed-intentions'); break;
    case 'join-intent': add('joining', 'intentions'); add('joining', subject.matched ? 'resolved-intentions' : 'unresolved-intentions');
      if (subject.outcome === 'NEW_JOIN') add('joining', 'confirmed-intentions'); break;
    case 'room': add('creation', 'created'); add('creation', subject.linked ? 'linked-creations' : 'unlinked-creations');
      add('room-conversion', 'rooms'); add('room-conversion', subject.state); break;
    case 'join': add('joining', subject.outcome, 1, subject.reason ?? ''); add('joining', subject.linked ? 'linked-results' : 'unlinked-results'); break;
    case 'game': {
      add('configuration', 'games');
      for (const [key, value] of Object.entries(subject.configuration)) {
        if (key === 'botsByDifficulty') {
          for (const [level, n] of Object.entries(subject.configuration.botsByDifficulty)) add('configuration', `botsByDifficulty.${level}`, 1, String(n));
        } else add('configuration', key, 1, String(value));
      }
      add('completion', subject.state); add('automatic', 'human-players', subject.people.length);
      add('automatic', 'automatic', subject.automatic.length);
      if (subject.state === 'OBSERVATION_CENSORED') { add('automatic', subject.state); add('duration', subject.state); }
      if (!subject.appearance) add('appearance', 'notInstrumented', subject.people.length);
      else {
        const category = (value: AppearanceValue) => [value.theme, value.origin];
        for (const person of subject.people) {
          const { start, end } = subject.appearance[person] ?? {};
          add('appearance', 'eligible');
          if (start) { add('appearance', 'withStart'); add('appearance', 'START', 1, JSON.stringify(category(start))); }
          if (end) { add('appearance', 'withEnd'); add('appearance', 'END', 1, JSON.stringify(category(end))); }
          if (start && end) { add('appearance', 'paired'); add('appearance', 'PAIR', 1, JSON.stringify([...category(start), ...category(end)])); }
          else if (start) add('appearance', 'onlyStart');
          else if (end) add('appearance', 'onlyEnd');
          else add('appearance', 'neither');
          if (!end && subject.state === 'ACTIVE') add('appearance', 'pending');
        }
        if (/CENSORED|AT_BACKUP|UNRESOLVED|LOST_ON_RESTART/.test(subject.state)) add('appearance', subject.state);
      }
      break;
    }
    case 'end': add('duration', 'durationMs', 1, subject.reason, subject.duration, subject.duration, subject.duration); break;
  }
  return rows;
}
export function logicalKey(event: UsageEvent): string {
  switch (event.name) {
    case 'home_viewed': return `view:${event.visitId}:${event.data.viewId}`;
    case 'room_create_intended': case 'room_join_attempted': return `${event.name}:${event.visitId}:${event.data.intentId}`;
    case 'room_created': case 'room_waiting_closed': return `${event.name}:${event.data.roomRef}`;
    case 'room_join_resolved': return `join:${event.data.intentRef}`;
    case 'game_started': case 'game_ended': return `${event.name}:${event.data.gameRef}`;
    case 'human_became_automatic': return `automatic:${event.data.gameRef}:${event.data.participationRef}`;
    case 'appearance_snapshot': return `appearance:${event.data.gameRef}:${event.data.participationRef}:${event.data.moment}`;
  }
}
