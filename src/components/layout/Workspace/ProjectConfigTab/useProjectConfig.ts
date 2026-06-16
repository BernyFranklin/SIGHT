import { useEffect, useMemo, useState } from 'react';

import {
  projectConfigApi,
  type ProjectConfigFile,
} from '@app/api/projectConfig';
import { useProjectStore } from '@app/store/useProjectStore';

import { DEFAULT_CONFIG } from './constants';
import type {
  CustomAttribute,
  FixationAlgorithm,
  ProjectConfig,
  ProjectConfigKey,
  PupilBaselineCorrection,
  PupilBlinkInterpolation,
  Status,
} from './types';
import { validate } from './validation';

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => valuesEqual(v, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    return ka.every((k) =>
      valuesEqual(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      ),
    );
  }
  return false;
}

function configsEqual(a: ProjectConfig, b: ProjectConfig): boolean {
  const keys = Object.keys(DEFAULT_CONFIG) as ProjectConfigKey[];
  for (const k of keys) {
    if (!valuesEqual(a[k], b[k])) return false;
  }
  return true;
}

function cloneConfig(c: ProjectConfig): ProjectConfig {
  return {
    ...c,
    demographics_custom_attributes: c.demographics_custom_attributes.map(
      (a) => ({
        ...a,
        options: [...a.options],
      }),
    ),
  };
}

function newAttributeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `attr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fromFile(file: ProjectConfigFile): ProjectConfig {
  const base = cloneConfig(DEFAULT_CONFIG);
  return {
    ...base,
    ...(file as unknown as Partial<ProjectConfig>),
    fixation_algorithm:
      (file.fixation_algorithm as FixationAlgorithm) ?? base.fixation_algorithm,
    pupil_baseline_correction_method:
      (file.pupil_baseline_correction_method as PupilBaselineCorrection) ??
      base.pupil_baseline_correction_method,
    pupil_blink_interpolation_method:
      (file.pupil_blink_interpolation_method as PupilBlinkInterpolation) ??
      base.pupil_blink_interpolation_method,
    demographics_custom_attributes: Array.isArray(
      file.demographics_custom_attributes,
    )
      ? file.demographics_custom_attributes.map((a) => ({
          ...a,
          options: Array.isArray(a.options) ? [...a.options] : [],
        }))
      : [],
  };
}

export function useProjectConfig(projectPath: string) {
  const [config, setConfig] = useState<ProjectConfig>(() =>
    cloneConfig(DEFAULT_CONFIG),
  );
  const [saved, setSaved] = useState<ProjectConfig | null>(null);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!projectPath) return;
    let cancelled = false;
    (async () => {
      const file = await projectConfigApi.read(projectPath);
      if (cancelled || !file) return;
      const loaded = fromFile(file);
      setConfig(cloneConfig(loaded));
      setSaved(cloneConfig(loaded));
      setTouched(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectPath]);

  const status: Status = useMemo(() => {
    if (!saved) return touched ? 'dirty' : 'new';
    return configsEqual(saved, config) ? 'clean' : 'dirty';
  }, [saved, touched, config]);

  const { errors, warnings, customAttributeErrors } = useMemo(
    () => validate(config),
    [config],
  );
  const hasErrors =
    Object.keys(errors).length > 0 ||
    Object.keys(customAttributeErrors).length > 0;

  const canSave = status === 'dirty' && !hasErrors && !saving;

  const setField = <K extends ProjectConfigKey>(
    key: K,
    value: ProjectConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setTouched(true);
  };

  const addCustomAttribute = () => {
    setConfig((prev) => ({
      ...prev,
      demographics_custom_attributes: [
        ...prev.demographics_custom_attributes,
        { id: newAttributeId(), label: '', type: 'number', options: [] },
      ],
    }));
    setTouched(true);
  };

  const updateCustomAttribute = (
    id: string,
    patch: Partial<CustomAttribute>,
  ) => {
    setConfig((prev) => ({
      ...prev,
      demographics_custom_attributes: prev.demographics_custom_attributes.map(
        (a) => (a.id === id ? { ...a, ...patch } : a),
      ),
    }));
    setTouched(true);
  };

  const deleteCustomAttribute = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      demographics_custom_attributes:
        prev.demographics_custom_attributes.filter((a) => a.id !== id),
    }));
    setTouched(true);
  };

  const reorderCustomAttributes = (next: CustomAttribute[]) => {
    setConfig((prev) => ({ ...prev, demographics_custom_attributes: next }));
    setTouched(true);
  };

  const handleSave = async () => {
    if (!canSave || !projectPath) return;
    const snapshot = cloneConfig(config);
    setSaving(true);
    try {
      await projectConfigApi.write(
        projectPath,
        snapshot as unknown as ProjectConfigFile,
      );
      setSaved(snapshot);
      setTouched(false);
      await useProjectStore.getState().refreshProjectConfig(projectPath);
    } catch (err) {
      console.error('[useProjectConfig] failed to save project config', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (saved) {
      setConfig(cloneConfig(saved));
    } else {
      setConfig(cloneConfig(DEFAULT_CONFIG));
    }
    setTouched(false);
  };

  return {
    config,
    status,
    canSave,
    saving,
    errors,
    warnings,
    customAttributeErrors,
    setField,
    handleSave,
    handleCancel,
    addCustomAttribute,
    updateCustomAttribute,
    deleteCustomAttribute,
    reorderCustomAttributes,
  };
}
