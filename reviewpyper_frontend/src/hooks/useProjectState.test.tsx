import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectState } from './useProjectState';

describe('useProjectState', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useProjectState());
    expect(result.current.projects).toEqual([]);
  });

  it('creates and retrieves a project, persists to localStorage', () => {
    const { result } = renderHook(() => useProjectState());
    act(() => {
      result.current.createProject('p1', 'My Review', 'Does X work?', 'standard');
    });
    expect(result.current.projects).toHaveLength(1);
    expect(result.current.getProject('p1')?.name).toBe('My Review');
    const raw = localStorage.getItem('reviewpyper_projects');
    expect(raw && JSON.parse(raw).p1.name).toBe('My Review');
  });

  it('updates pipeline state via patch', () => {
    const { result } = renderHook(() => useProjectState());
    act(() => { result.current.createProject('p1', 'r', 'q', 'rapid'); });
    act(() => { result.current.updatePipelineState('p1', { csv_path: '/data/p1/refs.csv' }); });
    expect(result.current.getPipelineState('p1').csv_path).toBe('/data/p1/refs.csv');
  });

  it('deletes a project', () => {
    const { result } = renderHook(() => useProjectState());
    act(() => { result.current.createProject('p1', 'r', 'q', 'standard'); });
    act(() => { result.current.deleteProject('p1'); });
    expect(result.current.projects).toHaveLength(0);
  });

  it('updatePipelineState on missing project is a no-op', () => {
    const { result } = renderHook(() => useProjectState());
    act(() => result.current.updatePipelineState('ghost', { csv_path: '/x' }));
    expect(result.current.projects).toHaveLength(0);
  });
});
