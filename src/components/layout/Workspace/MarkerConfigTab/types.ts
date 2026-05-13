export type Fps = 30 | 60;

export type Event = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
};

export type Status = 'new' | 'dirty' | 'clean';

export type EventError = {
  startTime?: string;
  endTime?: string;
  overlap?: string;
};

export type MarkerConfig = {
  markerSetName: string;
  fps: Fps;
  events: Event[];
};
