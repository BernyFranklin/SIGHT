import { tsToFrames } from './timestamp';
import type { Event, EventError, Fps } from './types';

export function validateEvents(events: Event[], fps: Fps): Record<string, EventError> {
  const errors: Record<string, EventError> = {};
  const ranges: { id: string; start: number; end: number }[] = [];

  for (const e of events) {
    const err: EventError = {};
    const start = tsToFrames(e.startTime, fps);
    const end = tsToFrames(e.endTime, fps);
    if (e.startTime !== '' && start === null) err.startTime = 'Incomplete timestamp.';
    if (e.endTime !== '' && end === null) err.endTime = 'Incomplete timestamp.';
    if (start !== null && end !== null) {
      if (end <= start) err.endTime = 'End time must be after start time.';
      else ranges.push({ id: e.id, start, end });
    }
    if (Object.keys(err).length) errors[e.id] = err;
  }

  ranges.sort((a, b) => a.start - b.start);
  for (let i = 1; i < ranges.length; i += 1) {
    if (ranges[i].start < ranges[i - 1].end) {
      const id = ranges[i].id;
      errors[id] = { ...(errors[id] ?? {}), overlap: 'Overlaps another event.' };
    }
  }

  return errors;
}

export function sortByStart(events: Event[], fps: Fps): Event[] {
  return [...events].sort(
    (a, b) => (tsToFrames(a.startTime, fps) ?? 0) - (tsToFrames(b.startTime, fps) ?? 0),
  );
}

export function eventsEqual(a: Event[], b: Event[]): boolean {
  return (
    a.length === b.length
    && a.every((e, i) =>
      e.name === b[i].name
      && e.startTime === b[i].startTime
      && e.endTime === b[i].endTime)
  );
}

export function isEventComplete(e: Event, fps: Fps): boolean {
  return tsToFrames(e.startTime, fps) !== null && tsToFrames(e.endTime, fps) !== null;
}

export function hasAnyTimestamp(events: Event[]): boolean {
  return events.some((e) => e.startTime !== '' || e.endTime !== '');
}
