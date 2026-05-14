import { StatusBar } from '../MarkerConfigTab/components/StatusBar';

import { FieldRow } from './components/FieldRow';
import { Group } from './components/Group';
import { NumberInput } from './components/NumberInput';
import { RadioGroup } from './components/RadioGroup';
import { RangePair } from './components/RangePair';
import { RangeSlider } from './components/RangeSlider';
import { ToggleSwitch } from './components/ToggleSwitch';
import { GROUPS, STATUS_MESSAGES } from './constants';
import type { DependencyRule, FieldSpec, ProjectConfig, ProjectConfigKey } from './types';
import { useProjectConfig } from './useProjectConfig';

function evalDependency(rule: DependencyRule | undefined, config: ProjectConfig): {
  hidden: boolean;
  dimmed: boolean;
} {
  if (!rule) return { hidden: false, dimmed: false };
  const match = config[rule.key] === rule.equals;
  if (rule.mode === 'hidden') return { hidden: !match, dimmed: false };
  return { hidden: false, dimmed: !match };
}

export function ProjectConfigTab() {
  const { config, status, canSave, errors, warnings, setField, handleSave, handleCancel } =
    useProjectConfig();

  const renderField = (field: FieldSpec, groupId: string) => {
    const { hidden, dimmed } = evalDependency(field.dependsOn, config);
    if (hidden) return null;

    const key = `${groupId}:${field.type === 'range-pair' ? `${field.minKey}__${field.maxKey}` : field.key}`;

    let input: React.ReactNode;
    let message: { text: string; tone: 'error' | 'warning' } | undefined;
    switch (field.type) {
      case 'number-input': {
        const v = config[field.key] as number;
        const err = errors[field.key];
        const warn = warnings[field.key];
        if (err) message = { text: err, tone: 'error' };
        else if (warn) message = { text: warn, tone: 'warning' };
        input = (
          <NumberInput
            value={v}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(n) => setField(field.key, n as ProjectConfig[ProjectConfigKey])}
            invalid={Boolean(err)}
          />
        );
        break;
      }
      case 'range-slider': {
        const v = config[field.key] as number;
        const err = errors[field.key];
        const warn = warnings[field.key];
        if (err) message = { text: err, tone: 'error' };
        else if (warn) message = { text: warn, tone: 'warning' };
        input = (
          <RangeSlider
            value={v}
            min={field.min}
            max={field.max}
            step={field.step}
            decimals={field.decimals}
            onChange={(n) => setField(field.key, n as ProjectConfig[ProjectConfigKey])}
          />
        );
        break;
      }
      case 'range-pair': {
        const minV = config[field.minKey] as number;
        const maxV = config[field.maxKey] as number;
        const err = errors[field.minKey] ?? errors[field.maxKey];
        if (err) message = { text: err, tone: 'error' };
        input = (
          <RangePair
            minValue={minV}
            maxValue={maxV}
            minBounds={field.minBounds}
            maxBounds={field.maxBounds}
            step={field.step}
            onMinChange={(n) => setField(field.minKey, n as ProjectConfig[ProjectConfigKey])}
            onMaxChange={(n) => setField(field.maxKey, n as ProjectConfig[ProjectConfigKey])}
            invalid={Boolean(err)}
          />
        );
        break;
      }
      case 'radio-group': {
        const v = config[field.key] as string;
        input = (
          <RadioGroup
            name={field.key}
            value={v}
            options={field.options}
            onChange={(s) => setField(field.key, s as ProjectConfig[ProjectConfigKey])}
          />
        );
        break;
      }
      case 'toggle-switch': {
        const v = config[field.key] as boolean;
        input = (
          <ToggleSwitch
            value={v}
            onChange={(b) => setField(field.key, b as ProjectConfig[ProjectConfigKey])}
          />
        );
        break;
      }
    }

    return (
      <FieldRow key={key} label={field.label} units={field.units} dimmed={dimmed} message={message}>
        {input}
      </FieldRow>
    );
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <StatusBar
        status={status}
        canSave={canSave}
        onSave={handleSave}
        onCancel={handleCancel}
        messages={STATUS_MESSAGES}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex max-w-2xl flex-col gap-6">
          {GROUPS.map((group) => (
            <Group key={group.id} title={group.title}>
              {group.fields.map((f) => renderField(f, group.id))}
            </Group>
          ))}
        </div>
      </div>
    </div>
  );
}
