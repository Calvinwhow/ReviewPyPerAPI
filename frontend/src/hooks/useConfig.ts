import { createContext, useContext } from 'react';

export interface EndpointConfig { url: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE'; description: string; }
export interface AppSettings { defaultModel: string; defaultReviewType: string; defaultArticleType: string; defaultPageThreshold: number; defaultSummaryType: string; }
export interface AppConfig { testMode: boolean; settings: AppSettings; endpoints: Record<string, EndpointConfig>; }

const ConfigContext = createContext<AppConfig | null>(null);
export const ConfigProvider = ConfigContext.Provider;

export function useConfig(): AppConfig {
  const config = useContext(ConfigContext);
  if (!config) throw new Error('useConfig must be used within a ConfigProvider');
  return config;
}

export function resolveEndpoint(config: AppConfig, name: string, params?: Record<string, string>): string {
  const endpoint = config.endpoints[name];
  if (!endpoint) throw new Error(`Unknown endpoint: "${name}"`);
  let url = endpoint.url;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`{${key}}`, encodeURIComponent(value));
    }
  }
  if (config.testMode && url.includes('/pipeline/')) {
    url += (url.includes('?') ? '&' : '?') + 'test=true';
  }
  return url;
}

export async function loadConfig(): Promise<AppConfig> {
  const response = await fetch('/config.json');
  if (!response.ok) throw new Error(`Failed to load config.json: ${response.status}`);
  return response.json();
}
