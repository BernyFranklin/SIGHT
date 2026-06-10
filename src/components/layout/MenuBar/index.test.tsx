import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';

import { MenuBar } from './index';

beforeEach(() => {
  (window as unknown as { api: unknown }).api = {
    windowControls: {
      minimize: () => Promise.resolve(),
      toggleMaximize: () => Promise.resolve(),
      close: () => Promise.resolve(),
      toggleDevTools: () => Promise.resolve(),
      onMaximizedChanged: () => () => undefined,
    },
  };
});

describe('MenuBar', () => {
  it('renders all five sections', () => {
    render(<MenuBar />);
    for (const label of ['File', 'View', 'Analysis', 'Visualize', 'Help']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('renders window controls', () => {
    render(<MenuBar />);
    expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('opens a dropdown on click', () => {
    render(<MenuBar />);
    fireEvent.click(screen.getByRole('button', { name: 'File' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'New Project' })).toBeInTheDocument();
  });
});
