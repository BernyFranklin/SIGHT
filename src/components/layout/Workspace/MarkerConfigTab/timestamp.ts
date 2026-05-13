import type { Fps } from './types';

export function formatTimestamp(raw: string, fps: Fps): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const pairs: string[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    pairs.push(digits.slice(i, i + 2));
  }
  const caps = [99, 59, 59, fps - 1];
  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i].length === 2) {
      const n = Math.min(parseInt(pairs[i], 10), caps[i]);
      pairs[i] = n.toString().padStart(2, '0');
    }
  }
  return pairs.join(':');
}

export function tsToFrames(ts: string, fps: Fps): number | null {
  const parts = ts.split(':');
  if (parts.length !== 4 || parts.some((p) => p.length !== 2)) return null;
  const nums = parts.map((p) => parseInt(p, 10));
  if (nums.some((n) => Number.isNaN(n))) return null;
  const [h, m, s, f] = nums;
  if (f >= fps) return null;
  return ((h * 60 + m) * 60 + s) * fps + f;
}

export function framesToTs(total: number, fps: Fps): string {
  const safe = Math.max(0, Math.floor(total));
  const f = safe % fps;
  const totalSeconds = Math.floor(safe / fps);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}
