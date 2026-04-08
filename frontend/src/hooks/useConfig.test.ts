import { describe, it, expect } from 'vitest';
import { resolveEndpoint } from './useConfig';
import { testConfig } from '../test/fixtures';

describe('resolveEndpoint', () => {
  it('returns endpoint url unchanged when no params', () => {
    expect(resolveEndpoint(testConfig, 'listProjects')).toBe('/api/files/projects');
  });

  it('substitutes path params and url-encodes them', () => {
    expect(resolveEndpoint(testConfig, 'deleteProject', { projectId: 'abc/def' }))
      .toBe('/api/files/projects/abc%2Fdef');
  });

  it('throws on unknown endpoint', () => {
    expect(() => resolveEndpoint(testConfig, 'doesNotExist')).toThrow(/Unknown endpoint/);
  });

  it('appends ?test=true for pipeline endpoints when testMode is on', () => {
    const cfg = { ...testConfig, testMode: true };
    expect(resolveEndpoint(cfg, 'screenTitles')).toBe('/api/pipeline/titles/screen?test=true');
  });

  it('does not append ?test=true to non-pipeline endpoints in testMode', () => {
    const cfg = { ...testConfig, testMode: true };
    expect(resolveEndpoint(cfg, 'listProjects')).toBe('/api/files/projects');
  });
});
