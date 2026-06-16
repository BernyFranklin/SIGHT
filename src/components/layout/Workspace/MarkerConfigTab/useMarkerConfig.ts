import { useEffect, useMemo, useRef, useState } from 'react';

import { markersApi, type MarkersFile } from '@app/api/markers';
import { useProjectStore } from '@app/store/useProjectStore';

import { DEFAULT_FPS } from './constants';
import { framesToTs, tsToFrames } from './timestamp';
import type { Event, Fps, MarkerConfig, Status } from './types';
import {
  eventsEqual,
  hasAnyTimestamp,
  isEventComplete,
  sortByStart,
  validateEvents,
} from './validation';

const blankEvent = (id: string): Event => ({
  id,
  name: '',
  startTime: '',
  endTime: '',
});

export type PendingRemove = { id: string; index: number };

export function useMarkerConfig(projectPath: string) {
  const idCounter = useRef(0);
  const nextId = () => {
    idCounter.current += 1;
    return `e${idCounter.current}`;
  };

  const [markerSetName, setMarkerSetNameRaw] = useState('');
  const [fps, setFpsRaw] = useState<Fps>(DEFAULT_FPS);
  const [events, setEvents] = useState<Event[]>(() => [blankEvent('e0')]);
  const [saved, setSaved] = useState<MarkerConfig | null>(null);
  const [touched, setTouched] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!projectPath) return;
    let cancelled = false;
    (async () => {
      const file = await markersApi.read(projectPath);
      if (cancelled || !file) return;
      const loadedFps: Fps = file.fps === 60 ? 60 : 30;
      const loaded: Event[] = file.markers.map((m) => ({
        id: `e${++idCounter.current}`,
        name: m.name,
        startTime: framesToTs(m.startFrame, loadedFps),
        endTime: framesToTs(m.endFrame, loadedFps),
      }));
      const seed: Event[] =
        loaded.length > 0 ? loaded : [blankEvent(`e${++idCounter.current}`)];
      setMarkerSetNameRaw(file.name);
      setFpsRaw(loadedFps);
      setEvents(seed);
      setSaved({
        markerSetName: file.name,
        fps: loadedFps,
        events: seed.map((e) => ({ ...e })),
      });
      setTouched(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectPath]);

  const status: Status = useMemo(() => {
    if (!saved) return touched ? 'dirty' : 'new';
    if (
      saved.markerSetName === markerSetName &&
      saved.fps === fps &&
      eventsEqual(saved.events, events)
    )
      return 'clean';
    return 'dirty';
  }, [saved, touched, markerSetName, fps, events]);

  const errors = useMemo(() => validateEvents(events, fps), [events, fps]);
  const hasErrors = Object.keys(errors).length > 0;
  const allEventsComplete = events.every((e) => isEventComplete(e, fps));

  const canSave =
    status === 'dirty' && !hasErrors && allEventsComplete && !saving;
  const fpsLocked = hasAnyTimestamp(events);

  const markTouched = () => setTouched(true);

  const setMarkerSetName = (value: string) => {
    setMarkerSetNameRaw(value);
    markTouched();
  };

  const setFps = (value: Fps) => {
    if (fpsLocked) return;
    setFpsRaw(value);
    markTouched();
  };

  const addEvent = () => {
    setEvents((prev) => [...prev, blankEvent(nextId())]);
    markTouched();
  };

  const updateEvent = (id: string, patch: Partial<Event>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
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

  const handleSave = async () => {
    if (!canSave || !projectPath) return;
    const sorted = sortByStart(events, fps);
    // canSave gates this on allEventsComplete, so every timestamp converts;
    // guard anyway rather than asserting non-null.
    const toFrame = (ts: string): number => {
      const frame = tsToFrames(ts, fps);
      if (frame == null) throw new Error(`invalid timestamp: "${ts}"`);
      return frame;
    };
    const payload: MarkersFile = {
      name: markerSetName,
      fps,
      markers: sorted.map((e, i) => ({
        id: i + 1,
        name: e.name,
        startFrame: toFrame(e.startTime),
        endFrame: toFrame(e.endTime),
      })),
    };
    setSaving(true);
    try {
      await markersApi.write(projectPath, payload);
      setEvents(sorted);
      setSaved({ markerSetName, fps, events: sorted.map((e) => ({ ...e })) });
      setTouched(false);
      await useProjectStore.getState().refreshMarkers(projectPath);
    } catch (err) {
      console.error('[useMarkerConfig] failed to save markers', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (saved) {
      setMarkerSetNameRaw(saved.markerSetName);
      setFpsRaw(saved.fps);
      setEvents(saved.events.map((e) => ({ ...e })));
    } else {
      setMarkerSetNameRaw('');
      setFpsRaw(DEFAULT_FPS);
      setEvents([blankEvent(nextId())]);
    }
    setTouched(false);
  };

  return {
    markerSetName,
    fps,
    fpsLocked,
    events,
    status,
    errors,
    canSave,
    pendingRemove,
    setMarkerSetName,
    setFps,
    addEvent,
    updateEvent,
    requestRemove,
    confirmRemove,
    cancelRemove,
    handleSave,
    handleCancel,
  };
}
