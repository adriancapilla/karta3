import type { RoomView } from '../shared/contracts/room';
export function suffixes(room: RoomView): Map<string, number> {
  const counts = new Map<string, number>();
  for (const person of room.participants) counts.set(person.name, (counts.get(person.name) ?? 0) + 1);
  const positions = new Map<string, number>(); const labels = new Map<string, number>();
  for (const person of room.participants) {
    const next = (positions.get(person.name) ?? 0) + 1; positions.set(person.name, next);
    if (counts.get(person.name)! > 1) labels.set(person.id, next);
  }
  return labels;
}
