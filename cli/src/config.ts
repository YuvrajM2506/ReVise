import fs from 'fs';
import path from 'path';
import os from 'os';

export interface CliConfig {
  apiUrl?: string;
  groqApiKey?: string;
  groqPrimaryModel?: string;
  groqFallbackModel?: string;
  hindsightApiKey?: string;
  hindsightBankId?: string;
  hindsightBaseUrl?: string;
  githubToken?: string;
  aiderServiceUrl?: string;
  defaultService?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.config', 'revise');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Parses simple KEY=VALUE or KEY="VALUE" format from .env files.
 */
function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  } catch {
    // Ignore unreadable env files
  }
  return result;
}

/**
 * Loads environment variables from:
 * 1. Global config file (~/.config/revise/config.json)
 * 2. Repository .env.local, .env, frontend/.env.local, ../.env.local
 * 3. Existing process.env takes precedence over file defaults.
 */
export function loadEnvironment(): void {
  const cwd = process.cwd();
  const envCandidates = [
    path.join(cwd, '.env.local'),
    path.join(cwd, '.env'),
    path.join(cwd, 'frontend', '.env.local'),
    path.join(cwd, 'frontend', '.env'),
    path.join(cwd, '..', '.env.local'),
    path.join(cwd, '..', '.env'),
    path.join(cwd, '..', 'frontend', '.env.local'),
  ];

  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      const parsed = parseEnvFile(envPath);
      for (const [k, v] of Object.entries(parsed)) {
        if (!process.env[k] && v) {
          process.env[k] = v;
        }
      }
    }
  }

  // Load from ~/.config/revise/config.json if present
  const userConfig = readUserConfig();
  if (userConfig.groqApiKey && !process.env.GROQ_API_KEY) process.env.GROQ_API_KEY = userConfig.groqApiKey;
  if (userConfig.groqPrimaryModel && !process.env.GROQ_PRIMARY_MODEL) process.env.GROQ_PRIMARY_MODEL = userConfig.groqPrimaryModel;
  if (userConfig.hindsightApiKey && !process.env.HINDSIGHT_API_KEY) process.env.HINDSIGHT_API_KEY = userConfig.hindsightApiKey;
  if (userConfig.hindsightBankId && !process.env.HINDSIGHT_BANK_ID) process.env.HINDSIGHT_BANK_ID = userConfig.hindsightBankId;
  if (userConfig.hindsightBaseUrl && !process.env.HINDSIGHT_BASE_URL) process.env.HINDSIGHT_BASE_URL = userConfig.hindsightBaseUrl;
  if (userConfig.githubToken && !process.env.GITHUB_TOKEN) process.env.GITHUB_TOKEN = userConfig.githubToken;
  if (userConfig.aiderServiceUrl && !process.env.AIDER_SERVICE_URL) process.env.AIDER_SERVICE_URL = userConfig.aiderServiceUrl;
}

export function readUserConfig(): CliConfig {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeUserConfig(config: CliConfig): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err: any) {
    throw new Error(`Failed to save config to ${CONFIG_FILE}: ${err.message}`);
  }
}

export function setConfigValue(key: string, value: string): void {
  const current = readUserConfig();
  const map: Record<string, keyof CliConfig> = {
    'groq_api_key': 'groqApiKey',
    'groq-api-key': 'groqApiKey',
    'groqApiKey': 'groqApiKey',
    'groq_model': 'groqPrimaryModel',
    'groqPrimaryModel': 'groqPrimaryModel',
    'hindsight_api_key': 'hindsightApiKey',
    'hindsight-api-key': 'hindsightApiKey',
    'hindsightApiKey': 'hindsightApiKey',
    'hindsight_bank_id': 'hindsightBankId',
    'hindsightBankId': 'hindsightBankId',
    'hindsight_base_url': 'hindsightBaseUrl',
    'hindsightBaseUrl': 'hindsightBaseUrl',
    'github_token': 'githubToken',
    'github-token': 'githubToken',
    'githubToken': 'githubToken',
    'api_url': 'apiUrl',
    'apiUrl': 'apiUrl',
    'aider_service_url': 'aiderServiceUrl',
    'aiderServiceUrl': 'aiderServiceUrl',
    'default_service': 'defaultService',
    'defaultService': 'defaultService',
  };

  const targetKey = map[key] || (key as keyof CliConfig);
  (current as any)[targetKey] = value;
  writeUserConfig(current);
}

export function getConfigValue(key: string): string | undefined {
  const current = readUserConfig();
  const map: Record<string, keyof CliConfig> = {
    'groq_api_key': 'groqApiKey',
    'groq-api-key': 'groqApiKey',
    'groqApiKey': 'groqApiKey',
    'groq_model': 'groqPrimaryModel',
    'groqPrimaryModel': 'groqPrimaryModel',
    'hindsight_api_key': 'hindsightApiKey',
    'hindsight-api-key': 'hindsightApiKey',
    'hindsightApiKey': 'hindsightApiKey',
    'hindsight_bank_id': 'hindsightBankId',
    'hindsightBankId': 'hindsightBankId',
    'hindsight_base_url': 'hindsightBaseUrl',
    'hindsightBaseUrl': 'hindsightBaseUrl',
    'github_token': 'githubToken',
    'github-token': 'githubToken',
    'githubToken': 'githubToken',
    'api_url': 'apiUrl',
    'apiUrl': 'apiUrl',
    'aider_service_url': 'aiderServiceUrl',
    'aiderServiceUrl': 'aiderServiceUrl',
    'default_service': 'defaultService',
    'defaultService': 'defaultService',
  };

  const targetKey = map[key] || (key as keyof CliConfig);
  return (current as any)[targetKey] || process.env[key.toUpperCase().replace(/-/g, '_')];
}
