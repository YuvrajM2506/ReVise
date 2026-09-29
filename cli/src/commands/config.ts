import { c, colors, banner } from '../ui/colors';
import { readUserConfig, setConfigValue, getConfigValue } from '../config';

export function configListCommand(options: { json?: boolean } = {}): void {
  const config = readUserConfig();

  if (options.json) {
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  console.log(banner());
  console.log(`${c.bold}ReVise CLI Configuration (~/.config/revise/config.json)${c.reset}\n`);

  const keys: Array<{ key: string; label: string; secret?: boolean }> = [
    { key: 'groqApiKey', label: 'Groq API Key (GROQ_API_KEY)', secret: true },
    { key: 'groqPrimaryModel', label: 'Groq Primary Model' },
    { key: 'hindsightApiKey', label: 'Hindsight API Key (HINDSIGHT_API_KEY)', secret: true },
    { key: 'hindsightBankId', label: 'Hindsight Bank ID' },
    { key: 'hindsightBaseUrl', label: 'Hindsight Base URL' },
    { key: 'githubToken', label: 'GitHub Personal Token', secret: true },
    { key: 'aiderServiceUrl', label: 'Aider Service URL' },
    { key: 'defaultService', label: 'Default Service / Repo' },
  ];

  keys.forEach(({ key, label, secret }) => {
    const val = (config as any)[key] || process.env[key.toUpperCase().replace(/([A-Z])/g, '_$1')];
    let display = val || `${c.dim}(not set)${c.reset}`;
    if (secret && val) {
      display = `${val.slice(0, 6)}...${val.slice(-4)}`;
    }
    console.log(`  ${c.bold}${label}:${c.reset} ${display}`);
  });

  console.log(`\n${c.dim}To update a setting: \`revise config set <key> <value>\`${c.reset}\n`);
}

export function configSetCommand(key: string, value: string): void {
  try {
    setConfigValue(key, value);
    console.log(`${c.brightGreen}✔ Configuration updated:${c.reset} ${key} = ${value.slice(0, 8)}...`);
  } catch (err: any) {
    console.error(`${c.brightRed}✖ Failed to save configuration:${c.reset} ${err.message}`);
  }
}

export function configGetCommand(key: string): void {
  const val = getConfigValue(key);
  if (val) {
    console.log(val);
  } else {
    console.log(`${c.dim}(not set)${c.reset}`);
  }
}
