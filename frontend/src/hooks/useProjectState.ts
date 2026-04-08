import { useState, useCallback } from 'react';
import type { Project, PipelineState, LLMConfig } from '../types';

const STORAGE_KEY = 'reviewpyper_projects';

function loadProjects(): Record<string, Project> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProjects(projects: Record<string, Project>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function useProjectState() {
  const [projects, setProjects] = useState<Record<string, Project>>(loadProjects);

  const getProject = useCallback((id: string): Project | undefined => projects[id], [projects]);

  const createProject = useCallback((id: string, name: string, researchQuestion: string, reviewType: Project['review_type']) => {
    const project: Project = { id, name, research_question: researchQuestion, review_type: reviewType, created_at: new Date().toISOString(), pipeline_state: {} };
    setProjects(prev => {
      const updated = { ...prev, [id]: project };
      saveProjects(updated);
      return updated;
    });
    return project;
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const updated = { ...prev };
      delete updated[id];
      saveProjects(updated);
      return updated;
    });
  }, []);

  const setLLMConfig = useCallback((id: string, config: LLMConfig) => {
    setProjects(prev => {
      const project = prev[id];
      if (!project) return prev;
      const updated = { ...prev, [id]: { ...project, llm_config: config } };
      saveProjects(updated);
      return updated;
    });
  }, []);

  const updatePipelineState = useCallback((id: string, patch: Partial<PipelineState>) => {
    setProjects(prev => {
      const project = prev[id];
      if (!project) return prev;
      const updated = { ...prev, [id]: { ...project, pipeline_state: { ...project.pipeline_state, ...patch } } };
      saveProjects(updated);
      return updated;
    });
  }, []);

  const getPipelineState = useCallback((id: string): PipelineState => projects[id]?.pipeline_state ?? {}, [projects]);

  return { projects: Object.values(projects), getProject, createProject, deleteProject, setLLMConfig, updatePipelineState, getPipelineState };
}
