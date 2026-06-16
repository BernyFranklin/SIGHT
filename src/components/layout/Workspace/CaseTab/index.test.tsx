import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QaReport } from '@app/api/cleaning';
import type { SaccadeReport } from '@app/api/saccade';
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
    invalid_runs: {
      count: 3,
      total_frames: 110,
      max_length: 74,
      mean_length: 36.7,
    },
    sentinel_replacements: {
      focus_distance_sentinel: 0,
      focus_out_of_bounds: 13,
      pupil_left_out_of_bounds: 26,
      pupil_right_out_of_bounds: 26,
    },
    blinks: { left: 22, right: 22 },
    pupil_asymmetry_exceeded: 0,
    focus_unstable: 212,
    interpolation: {
      method: 'linear',
      left_interpolated: 65,
      right_interpolated: 65,
      left_pct: 16,
      right_pct: 16,
    },
    excluded: 112,
    excluded_pct: 28,
    warnings: [],
    status: 'pass',
    config: {} as QaReport['config'],
    ...overrides,
  };
}

function fakeSaccadeReport(
  overrides: Partial<SaccadeReport> = {},
): SaccadeReport {
  const dist = {
    min: 1,
    max: 40,
    mean: 12.5,
    median: 10,
    p10: 2,
    p50: 10,
    p90: 30,
    std: 8,
  };
  return {
    recording_id: RECORD.id,
    generated_at: '2026-06-09T00:00:00.000Z',
    sampling_rate_hz: 199.3,
    detection: {
      samplingRate: 199.3,
      velocityThresholdDegPerSec: 100,
      minDurationMs: 10,
      maxDurationMs: 150,
      minInterSaccadeMs: 50,
      includeExtended: true,
    },
    total_frames: 400,
    analyzed_frames: 288,
    excluded_frames: 112,
    saccade_count: 7,
    amplitude_deg: dist,
    peak_velocity_deg_s: { ...dist, min: 120, max: 540 },
    duration_ms: dist,
    warnings: [],
    status: 'ok',
    ...overrides,
  };
}

const run = vi.fn();
const readReport = vi.fn();
const saccadeRun = vi.fn();
const saccadeReadReport = vi.fn();

beforeEach(() => {
  run.mockResolvedValue(fakeReport());
  readReport.mockResolvedValue(null);
  saccadeRun.mockResolvedValue(fakeSaccadeReport());
  saccadeReadReport.mockResolvedValue(null);
  // Mutate the namespaces captured by the api clients at module load (don't replace window.api).
  Object.assign(
    (window as unknown as { api: { cleaning: object } }).api.cleaning,
    {
      run,
      readReport,
      hasReport: vi.fn().mockResolvedValue(false),
    },
  );
  Object.assign(
    (window as unknown as { api: { saccade: object } }).api.saccade,
    {
      run: saccadeRun,
      readReport: saccadeReadReport,
      hasReport: vi.fn().mockResolvedValue(false),
    },
  );
  useProjectStore.setState({
    cases: { [PROJECT]: [RECORD] },
    projectConfigs: { [PROJECT]: null },
    cleaningReports: {},
    cleaningBusy: {},
    saccadeReports: {},
    saccadeBusy: {},
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('CaseTab — Data Quality panel', () => {
  it('shows a clean button when no report exists', async () => {
    render(<CaseTab tab={TAB} />);
    expect(
      await screen.findByRole('button', { name: 'Clean gaze data' }),
    ).toBeInTheDocument();
  });

  it('calls cleaningApi.run when the clean button is clicked', async () => {
    render(<CaseTab tab={TAB} />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Clean gaze data' }),
    );
    await waitFor(() => expect(run).toHaveBeenCalledWith(PROJECT, RECORD.id));
  });

  it('renders the report summary when a report is present', () => {
    useProjectStore.setState({
      cleaningReports: { [PROJECT]: { [RECORD.id]: fakeReport() } },
    });
    render(<CaseTab tab={TAB} />);
    expect(screen.getByText('pass')).toBeInTheDocument();
    expect(screen.getByText('72.0')).toBeInTheDocument();
    expect(screen.getByText('3 gaps / 110 frames')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Re-clean' }),
    ).toBeInTheDocument();
  });
});

describe('CaseTab — Saccade Analysis panel', () => {
  it('gates analysis until the case is cleaned', async () => {
    render(<CaseTab tab={TAB} />);
    expect(
      await screen.findByText(
        /Clean this case.s gaze data first to run saccade analysis/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Run saccade analysis' }),
    ).not.toBeInTheDocument();
  });

  it('offers a run button once the case is cleaned but not yet analyzed', () => {
    useProjectStore.setState({
      cleaningReports: { [PROJECT]: { [RECORD.id]: fakeReport() } },
    });
    render(<CaseTab tab={TAB} />);
    expect(
      screen.getByRole('button', { name: 'Run saccade analysis' }),
    ).toBeInTheDocument();
  });

  it('calls saccadeApi.run when the run button is clicked', () => {
    useProjectStore.setState({
      cleaningReports: { [PROJECT]: { [RECORD.id]: fakeReport() } },
    });
    render(<CaseTab tab={TAB} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Run saccade analysis' }),
    );
    return waitFor(() =>
      expect(saccadeRun).toHaveBeenCalledWith(PROJECT, RECORD.id),
    );
  });

  it('renders the saccade summary when a report is present', () => {
    useProjectStore.setState({
      cleaningReports: { [PROJECT]: { [RECORD.id]: fakeReport() } },
      saccadeReports: { [PROJECT]: { [RECORD.id]: fakeSaccadeReport() } },
    });
    render(<CaseTab tab={TAB} />);
    expect(screen.getByText('ok')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('288 / 400')).toBeInTheDocument();
    expect(screen.getByText('120 – 540')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Re-run' })).toBeInTheDocument();
  });
});
