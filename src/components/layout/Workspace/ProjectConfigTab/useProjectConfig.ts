import { useMemo, useState } from 'react';

import { DEFAULT_CONFIG } from './constants';
import type { ProjectConfig, ProjectConfigKey, Status } from './types';

function configsEqual(a: ProjectConfig, b: ProjectConfig): boolean {
  const keys = Object.keys(DEFAULT_CONFIG) as ProjectConfigKey[];
  for (const k of keys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

function cloneConfig(c: ProjectConfig): ProjectConfig {
  return { ...c };
}

export function useProjectConfig() {
  const [config, setConfig] = useState<ProjectConfig>(() => cloneConfig(DEFAULT_CONFIG));
  const [saved, setSaved] = useState<ProjectConfig | null>(null);
  const [touched, setTouched] = useState(false);

  const status: Status = useMemo(() => {
    if (!saved) return touched ? 'dirty' : 'new';
    return configsEqual(saved, config) ? 'clean' : 'dirty';
  }, [saved, touched, config]);

  const canSave = status === 'dirty';

  const setField = <K extends ProjectConfigKey>(key: K, value: ProjectConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
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
    setField,
    handleSave,
    handleCancel,
  };
}
