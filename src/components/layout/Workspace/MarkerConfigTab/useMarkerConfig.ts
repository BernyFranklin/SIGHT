import { useMemo, useRef, useState } from 'react';

import type { Event, MarkerConfig, Status } from './types';
import { eventsEqual, isEventComplete, sortByStart, validateEvents } from './validation';

const blankEvent = (id: string): Event => ({ id, name: '', startTime: '', endTime: '' });

export type PendingRemove = { id: string; index: number };

export function useMarkerConfig() {
  const idCounter = useRef(0);
  const nextId = () => {
    idCounter.current += 1;
    return `e${idCounter.current}`;
  };

  const [markerSetName, setMarkerSetNameRaw] = useState('');
  const [events, setEvents] = useState<Event[]>(() => [blankEvent(`e${++idCounter.current}`)]);
  const [saved, setSaved] = useState<MarkerConfig | null>(null);
  const [touched, setTouched] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null);

  const status: Status = useMemo(() => {
    if (!saved) return touched ? 'dirty' : 'new';
    if (saved.markerSetName === markerSetName && eventsEqual(saved.events, events)) return 'clean';
    return 'dirty';
  }, [saved, touched, markerSetName, events]);

  const errors = useMemo(() => validateEvents(events), [events]);
  const hasErrors = Object.keys(errors).length > 0;
  const allEventsComplete = events.every(isEventComplete);

  const canSave = status === 'dirty' && !hasErrors && allEventsComplete;

  const markTouched = () => setTouched(true);

  const setMarkerSetName = (value: string) => {
    setMarkerSetNameRaw(value);
    markTouched();
  };

  const addEvent = () => {
    setEvents((prev) => [...prev, blankEvent(nextId())]);
    markTouched();
  };

  const updateEvent = (id: string, patch: Partial<Event>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    markTouched();
  };

  const requestRemove = (id: string) => {
    const idx = events.findIndex((e) => e.id === id);
    if (idx < 0) return;
    setPendingRemove({ id, index: idx + 1 });
  };

  const confirmRemove = () => {
    if (!pendingRemove) return;
    const { id } = pendingRemove;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setPendingRemove(null);
    markTouched();
  };

  const cancelRemove = () => setPendingRemove(null);

  const handleSave = () => {
    if (!canSave) return;
    const sorted = sortByStart(events);
    setEvents(sorted);
    setSaved({
      markerSetName,
      events: sorted.map((e) => ({ ...e })),
    });
    setTouched(false);
  };

  const handleCancel = () => {
    if (saved) {
      setMarkerSetNameRaw(saved.markerSetName);
      setEvents(saved.events.map((e) => ({ ...e })));
    } else {
      setMarkerSetNameRaw('');
      setEvents([blankEvent(nextId())]);
    }
    setTouched(false);
  };

  return {
    markerSetName,
    events,
    status,
    errors,
    canSave,
    pendingRemove,
    setMarkerSetName,
    addEvent,
    updateEvent,
    requestRemove,
    confirmRemove,
    cancelRemove,
    handleSave,
    handleCancel,
  };
}
