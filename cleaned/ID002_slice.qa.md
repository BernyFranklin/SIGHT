# Gaze Cleaning QA Report — ID002_slice

- **Status:** WARN
- **Generated:** 2026-06-09T05:06:02.551Z
- **Total frames:** 400
- **Duration:** 2.797 s
- **Inferred sample rate:** 199.5 Hz

## Validity

| Signal | Valid | Ratio |
| --- | ---: | ---: |
| Gaze | 288 | 72.0% |
| Left eye | 287 | 71.8% |
| Right eye | 284 | 71.0% |

## Data gaps (INVALID runs)

- **Count:** 3
- **Frames in gaps:** 110
- **Longest gap:** 74 frames
- **Mean gap length:** 36.7 frames

## Sentinel & out-of-bounds replacements

- **Focus distance == 0 (sentinel):** 0
- **Focus out of bounds:** 13
- **Left pupil out of bounds:** 26
- **Right pupil out of bounds:** 26

## Blinks & quality flags

- **Blinks (left / right):** 22 / 26
- **L/R asymmetry exceeded:** 0
- **Focus unstable:** 212

## Interpolation

- **Method:** linear
- **Left interpolated:** 65 (16.3%)
- **Right interpolated:** 50 (12.5%)

## Exclusions

- **Excluded under gate:** 112 (28.0%)

## Warnings

- ⚠️ overall valid-frame ratio 72.0% is below the 75.0% threshold

## Config used

```json
{
  "min_valid_frame_ratio": 0.75,
  "max_consecutive_invalid_for_gap": 5,
  "max_gap_for_velocity_ms": 25,
  "eye_openness_blink_threshold": 0.5,
  "pupil_min_diameter_mm": 1.5,
  "pupil_max_diameter_mm": 9,
  "pupil_lr_asymmetry_tolerance_mm": 0.5,
  "pupil_interpolation_method": "linear",
  "pupil_blink_max_gap_ms": 150,
  "focus_min_distance_m": 0.2,
  "focus_max_distance_m": 10,
  "focus_min_stability": 0.3,
  "derive_gaze_angles": true,
  "inclusion_gate": {
    "exclude_invalid_gaze": true,
    "exclude_invalid_runs": true,
    "exclude_blinks": false,
    "exclude_pupil_out_of_bounds": false,
    "exclude_asymmetry": false,
    "exclude_focus_out_of_bounds": false
  }
}
```
