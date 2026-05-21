import { useMemo, useState } from 'react';

import { DEFAULT_CONFIG } from './constants';
import type { CustomAttribute, ProjectConfig, ProjectConfigKey, Status } from './types';
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
      valuesEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
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
    demographics_custom_attributes: c.demographics_custom_attributes.map((a) => ({
      ...a,
      options: [...a.options],
    })),
  };
}

function newAttributeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `attr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useProjectConfig() {
  const [config, setConfig] = useState<ProjectConfig>(() => cloneConfig(DEFAULT_CONFIG));
  const [saved, setSaved] = useState<ProjectConfig | null>(null);
  const [touched, setTouched] = useState(false);

  const status: Status = useMemo(() => {
    if (!saved) return touched ? 'dirty' : 'new';
    return configsEqual(saved, config) ? 'clean' : 'dirty';
  }, [saved, touched, config]);

  const { errors, warnings, customAttributeErrors } = useMemo(() => validate(config), [config]);
  const hasErrors =
    Object.keys(errors).length > 0 || Object.keys(customAttributeErrors).length > 0;

  const canSave = status === 'dirty' && !hasErrors;

  const setField = <K extends ProjectConfigKey>(key: K, value: ProjectConfig[K]) => {
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

  const updateCustomAttribute = (id: string, patch: Partial<CustomAttribute>) => {
    setConfig((prev) => ({
      ...prev,
      demographics_custom_attributes: prev.demographics_custom_attributes.map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      ),
    }));
    setTouched(true);
  };

  const deleteCustomAttribute = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      demographics_custom_attributes: prev.demographics_custom_attributes.filter(
        (a) => a.id !== id,
      ),
    }));
    setTouched(true);
  };

  const reorderCustomAttributes = (next: CustomAttribute[]) => {
    setConfig((prev) => ({ ...prev, demographics_custom_attributes: next }));
    setTouched(true);
  };

  const handleSave = () => {
    if (!canSave) return;
    setSaved(cloneConfig(config));
    setTouched(false);
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
