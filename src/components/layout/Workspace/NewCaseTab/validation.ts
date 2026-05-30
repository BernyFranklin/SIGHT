import type { CaseField } from './schema';

export const CASE_ID_MAX = 50;
export const CUSTOM_TEXT_MAX = 200;
const CASE_ID_RE = /^[A-Za-z0-9_-]+$/;

export interface CaseValidationInput {
  caseId: string;
  file: File | null;
  demographics: Record<string, string | number | null>;
  fields: CaseField[];
  /** Existing case identifiers in this project, for uniqueness. */
  existingCaseIds: string[];
}

export interface CaseValidationResult {
  caseIdError?: string;
  fileError?: string;
  /** Keyed by demographic key (or `gender_other`). */
  fieldErrors: Record<string, string>;
}

function isBlank(value: string | number | null | undefined): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

export function validateCase(input: CaseValidationInput): CaseValidationResult {
  const { caseId, file, demographics, fields, existingCaseIds } = input;
  const result: CaseValidationResult = { fieldErrors: {} };

  // Case identifier
  const trimmed = caseId.trim();
  if (!trimmed) {
    result.caseIdError = 'Case ID is required.';
  } else if (trimmed.length > CASE_ID_MAX) {
    result.caseIdError = `Case ID must be ${CASE_ID_MAX} characters or fewer.`;
  } else if (!CASE_ID_RE.test(trimmed)) {
    result.caseIdError = 'Only letters, numbers, hyphens, and underscores are allowed.';
  } else if (existingCaseIds.some((id) => id.trim().toLowerCase() === trimmed.toLowerCase())) {
    result.caseIdError = 'A case with this ID already exists in this project.';
  }

  // Gaze data file
  if (!file) {
    result.fileError = 'A gaze data file is required.';
  } else if (!file.name.toLowerCase().endsWith('.csv')) {
    result.fileError = 'Only .csv files are accepted.';
  }

  // Demographic fields (all enabled fields are required)
  for (const field of fields) {
    switch (field.kind) {
      case 'age': {
        const err = validateInt(demographics[field.key], 'Age', 5, 120);
        if (err) result.fieldErrors[field.key] = err;
        break;
      }
      case 'gender': {
        const g = demographics[field.key];
        if (isBlank(g)) {
          result.fieldErrors[field.key] = 'Gender is required.';
        } else if (g === 'Other' && isBlank(demographics[field.otherKey])) {
          result.fieldErrors[field.otherKey] = 'Please specify.';
        }
        break;
      }
      case 'asrs': {
        const iErr = validateInt(demographics[field.inattentionKey], 'Inattention', 0, 36);
        if (iErr) result.fieldErrors[field.inattentionKey] = iErr;
        const hErr = validateInt(demographics[field.hyperactivityKey], 'Hyperactivity', 0, 36);
        if (hErr) result.fieldErrors[field.hyperactivityKey] = hErr;
        break;
      }
      case 'custom-number': {
        const v = demographics[field.key];
        if (isBlank(v)) result.fieldErrors[field.key] = `${field.label} is required.`;
        else if (typeof v !== 'number' || !Number.isFinite(v)) {
          result.fieldErrors[field.key] = `${field.label} must be a number.`;
        }
        break;
      }
      case 'custom-text': {
        const v = demographics[field.key];
        if (isBlank(v)) result.fieldErrors[field.key] = `${field.label} is required.`;
        else if (String(v).length > CUSTOM_TEXT_MAX) {
          result.fieldErrors[field.key] = `${field.label} must be ${CUSTOM_TEXT_MAX} characters or fewer.`;
        }
        break;
      }
      case 'custom-dropdown': {
        if (isBlank(demographics[field.key])) {
          result.fieldErrors[field.key] = `${field.label} is required.`;
        }
        break;
      }
    }
  }

  return result;
}

function validateInt(
  value: string | number | null | undefined,
  label: string,
  min: number,
  max: number,
): string | undefined {
  if (isBlank(value)) return `${label} is required.`;
  if (typeof value !== 'number' || !Number.isInteger(value)) return `${label} must be a whole number.`;
  if (value < min || value > max) return `${label} must be between ${min} and ${max}.`;
  return undefined;
}
