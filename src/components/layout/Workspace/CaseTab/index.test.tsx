import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QaReport } from '@app/api/cleaning';
import { type CaseRecord, useProjectStore } from '@app/store/useProjectStore';
import type { Tab } from '@app/store/useWorkspaceStore';

import { CaseTab } from './index';

const PROJECT = 'C:/proj';
const RECORD: CaseRecord = {
  id: 'rec-1',
  caseId: 'Subject 001',
  fileName: 'gaze.csv',
  fileSize: 2048,
  demographics: {},
};

const TAB: Tab = {
  id: `case:${PROJECT}:${RECORD.id}`,
  title: RECORD.caseId,
  kind: 'case',
  closable: true,
  projectPath: PROJECT,
  caseRecordId: RECORD.id,
};

function fakeReport(overrides: Partial<QaReport> = {}): QaReport {
  return {
    recording_id: RECORD.id,
    generated_at: '2026-06-09T00:00:00.000Z',
    total_frames: 400,
    duration_s: 2,
    inferred_sample_rate_hz: 199.3,
    validity: {
      gaze_valid: 288,
      gaze_valid_ratio: 0.72,
      left_eye_valid: 288,
      left_eye_valid_ratio: 0.72,
      right_eye_valid: 288,
      right_eye_valid_ratio: 0.72,
    },
    invalid_runs: { count: 3, total_frames: 110, max_length: 74, mean_length: 36.7 },
    sentinel_replacements: {
      focus_distance_sentinel: 0,
      focus_out_of_bounds: 13,
      pupil_left_out_of_bounds: 26,
      pupil_right_out_of_bounds: 26,
    },
    blinks: { left: 22, right: 22 },
    pupil_asymmetry_exceeded: 0,
    focus_unstable: 212,
    interpolation: { method: 'linear', left_interpolated: 65, right_interpolated: 65, left_pct: 16, right_pct: 16 },
    excluded: 112,
    excluded_pct: 28,
    warnings: [],
    status: 'pass',
    config: {} as QaReport['config'],
    ...overrides,
  };
}

const run = vi.fn();
const readReport = vi.fn();

beforeEach(() => {
  run.mockResolvedValue(fakeReport());
  readReport.mockResolvedValue(null);
  // Mutate the namespace captured by cleaningApi at module load (don't replace window.api).
  Object.assign((window as unknown as { api: { cleaning: object } }).api.cleaning, {
    run,
    readReport,
    hasReport: vi.fn().mockResolvedValue(false),
  });
  useProjectStore.setState({
    cases: { [PROJECT]: [RECORD] },
    projectConfigs: { [PROJECT]: null },
    cleaningReports: {},
    cleaningBusy: {},
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('CaseTab — Data Quality panel', () => {
  it('shows a clean button when no report exists', async () => {
    render(<CaseTab tab={TAB} />);
    expect(await screen.findByRole('button', { name: 'Clean gaze data' })).toBeInTheDocument();
  });

  it('calls cleaningApi.run when the clean button is clicked', async () => {
    render(<CaseTab tab={TAB} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Clean gaze data' }));
    await waitFor(() => expect(run).toHaveBeenCalledWith(PROJECT, RECORD.id));
  });

  it('renders the report summary when a report is present', () => {
    useProjectStore.setState({ cleaningReports: { [PROJECT]: { [RECORD.id]: fakeReport() } } });
    render(<CaseTab tab={TAB} />);
    expect(screen.getByText('pass')).toBeInTheDocument();
    expect(screen.getByText('72.0')).toBeInTheDocument();
    expect(screen.getByText('3 gaps / 110 frames')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Re-clean' })).toBeInTheDocument();
  });
});
