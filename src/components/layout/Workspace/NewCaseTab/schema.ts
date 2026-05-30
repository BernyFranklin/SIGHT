import type { ProjectConfigFile } from '@app/api/projectConfig';
import type { CaseRecord } from '@app/store/useProjectStore';

import { GENDER_OPTIONS } from '../ProjectConfigTab/constants';
import type { DropdownOption } from '../ProjectConfigTab/types';

/** Stable keys used in `CaseRecord.demographics`. */
export const AGE_KEY = 'age';
export const GENDER_KEY = 'gender';
export const GENDER_OTHER_KEY = 'gender_other';
export const ASRS_INATTENTION_KEY = 'asrs_inattention';
export const ASRS_HYPERACTIVITY_KEY = 'asrs_hyperactivity';

/**
 * Descriptor for a single demographic field to render in the Add Case form,
 * derived from the project's saved demographic schema.
 */
export type CaseField =
  | { kind: 'age'; key: typeof AGE_KEY; label: string; units: string }
  | {
      kind: 'gender';
      key: typeof GENDER_KEY;
      otherKey: typeof GENDER_OTHER_KEY;
      label: string;
      options: DropdownOption[];
    }
  | {
      kind: 'asrs';
      inattentionKey: typeof ASRS_INATTENTION_KEY;
      hyperactivityKey: typeof ASRS_HYPERACTIVITY_KEY;
      label: string;
    }
  | { kind: 'custom-number'; key: string; label: string }
  | { kind: 'custom-text'; key: string; label: string }
  | { kind: 'custom-dropdown'; key: string; label: string; options: DropdownOption[] };

/**
 * Build the ordered list of demographic fields to render, based on which
 * built-ins are enabled and which custom attributes are defined in the schema.
 * Returns an empty array when no demographic fields are enabled.
 */
export function deriveCaseFields(config: ProjectConfigFile | null): CaseField[] {
  if (!config) return [];
  const fields: CaseField[] = [];

  if (config.demographics_age_enabled) {
    fields.push({ kind: 'age', key: AGE_KEY, label: 'Age', units: 'years' });
  }
  if (config.demographics_gender_enabled) {
    fields.push({
      kind: 'gender',
      key: GENDER_KEY,
      otherKey: GENDER_OTHER_KEY,
      label: 'Gender',
      options: GENDER_OPTIONS,
    });
  }
  if (config.demographics_asrs_enabled) {
    fields.push({
      kind: 'asrs',
      inattentionKey: ASRS_INATTENTION_KEY,
      hyperactivityKey: ASRS_HYPERACTIVITY_KEY,
      label: 'ASRS v1.1',
    });
  }

  for (const attr of config.demographics_custom_attributes ?? []) {
    if (attr.type === 'number') {
      fields.push({ kind: 'custom-number', key: attr.id, label: attr.label });
    } else if (attr.type === 'text') {
      fields.push({ kind: 'custom-text', key: attr.id, label: attr.label });
    } else if (attr.type === 'dropdown') {
      fields.push({
        kind: 'custom-dropdown',
        key: attr.id,
        label: attr.label,
        options: attr.options.map((o) => ({ value: o, label: o })),
      });
    }
  }

  return fields;
}

/**
 * Schema-level list of demographic keys that must hold a value. All enabled
 * fields are required (per product decision); ASRS contributes both subscales.
 */
export function requiredKeys(config: ProjectConfigFile | null): string[] {
  if (!config) return [];
  const keys: string[] = [];
  if (config.demographics_age_enabled) keys.push(AGE_KEY);
  if (config.demographics_gender_enabled) keys.push(GENDER_KEY);
  if (config.demographics_asrs_enabled) {
    keys.push(ASRS_INATTENTION_KEY, ASRS_HYPERACTIVITY_KEY);
  }
  for (const attr of config.demographics_custom_attributes ?? []) {
    keys.push(attr.id);
  }
  return keys;
}

function isMissing(value: string | number | null | undefined): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

/**
 * A case is incomplete when, against the project's *current* schema, any
 * required field is missing or null in the case's stored values. This makes
 * the flag reactive: enabling a new field later marks existing cases incomplete.
 */
export function isCaseIncomplete(record: CaseRecord, config: ProjectConfigFile | null): boolean {
  return requiredKeys(config).some((key) => isMissing(record.demographics[key]));
}
