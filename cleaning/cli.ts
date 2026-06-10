/**
 * Command-line entry point for the gaze cleaning module.
 *
 *   node --import tsx cleaning/cli.ts clean --input <csv> --out <dir> [--config <json>]
 *   npm run clean -- --input <csv> --out <dir> [--config <json>]
 *
 * Cleans one raw Varjo recording and writes the master frame, the three views,
 * and the QA report into the output directory. With no `--config`, the spec §6
 * defaults are used.
 */

import { pathToFileURL } from 'node:url';

import { loadConfigFile, resolveConfig, type CleaningConfig } from './config';
import { cleanRecording } from './pipeline/cleanRecording';

interface CleanArgs {
  input?: string;
  out: string;
  config?: string;
}

const USAGE = `Usage:
  clean --input <raw.csv> --out <dir> [--config <config.json>]

Options:
  --input, -i   Path to the raw Varjo CSV export (required)
  --out, -o     Output directory (default: ./cleaned)
  --config, -c  JSON config file; omitted = spec defaults
  --help, -h    Show this help`;

function parseArgs(argv: string[]): CleanArgs {
  const args: CleanArgs = { out: './cleaned' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--input':
      case '-i':
        args.input = argv[++i];
        break;
      case '--out':
      case '-o':
        args.out = argv[++i];
        break;
      case '--config':
      case '-c':
        args.config = argv[++i];
        break;
      default:
        throw new Error(`unknown argument: ${a}`);
    }
  }
  return args;
}

/** Run the CLI. Returns a process exit code (0 = success). */
export async function runCli(argv: string[]): Promise<number> {
  const command = argv[0];
  if (!command || command === '--help' || command === '-h') {
    console.log(USAGE);
    return command ? 0 : 1;
  }
  if (command !== 'clean') {
    console.error(`unknown command "${command}"\n\n${USAGE}`);
    return 1;
  }

  let args: CleanArgs;
  try {
    args = parseArgs(argv.slice(1));
  } catch (err) {
    console.error(`${(err as Error).message}\n\n${USAGE}`);
    return 1;
  }
  if (!args.input) {
    console.error(`--input is required\n\n${USAGE}`);
    return 1;
  }

  const config: CleaningConfig = args.config
    ? await loadConfigFile(args.config)
    : resolveConfig();

  console.log(`Cleaning ${args.input} …`);
  const result = await cleanRecording(args.input, config);
  const files = await result.save(args.out);

  const r = result.report;
  console.log(
    [
      `  recording:   ${r.recording_id}`,
      `  frames:      ${r.total_frames}  (${r.duration_s.toFixed(1)} s @ ~${r.inferred_sample_rate_hz.toFixed(0)} Hz)`,
      `  gaze valid:  ${(r.validity.gaze_valid_ratio * 100).toFixed(1)}%`,
      `  data gaps:   ${r.invalid_runs.count}  (${r.invalid_runs.total_frames} frames)`,
      `  excluded:    ${r.excluded} (${r.excluded_pct.toFixed(1)}%)`,
      `  status:      ${r.status.toUpperCase()}`,
      `  written to:  ${args.out}`,
    ].join('\n'),
  );
  for (const w of r.warnings) console.warn(`  ⚠️ ${w}`);
  console.log(`  master:      ${files.master}`);
  return 0;
}

// Run only when invoked directly (not when imported by tests).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runCli(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(err);
      process.exit(1);
    },
  );
}
