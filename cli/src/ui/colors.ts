/**
 * Rich ANSI Color and Typography Utilities for ReVise Terminal UI
 */

const ESC = '\x1b[';

export const c = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  italic: `${ESC}3m`,
  underline: `${ESC}4m`,
  
  // Foreground colors
  black: `${ESC}30m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,
  
  // Bright colors
  brightBlack: `${ESC}90m`,
  brightRed: `${ESC}91m`,
  brightGreen: `${ESC}92m`,
  brightYellow: `${ESC}93m`,
  brightBlue: `${ESC}94m`,
  brightMagenta: `${ESC}95m`,
  brightCyan: `${ESC}96m`,
  brightWhite: `${ESC}97m`,
  
  // Background colors
  bgBlack: `${ESC}40m`,
  bgRed: `${ESC}41m`,
  bgGreen: `${ESC}42m`,
  bgYellow: `${ESC}43m`,
  bgBlue: `${ESC}44m`,
  bgMagenta: `${ESC}45m`,
  bgCyan: `${ESC}46m`,
  bgWhite: `${ESC}47m`,
  
  // 24-bit Truecolor RGB support
  rgb: (r: number, g: number, b: number) => `${ESC}38;2;${r};${g};${b}m`,
  bgRgb: (r: number, g: number, b: number) => `${ESC}48;2;${r};${g};${b}m`,
};

// ReVise Palette (Teal / Amber / Dark Slate)
export const colors = {
  teal: c.rgb(20, 184, 166),       // #14b8a6
  lightTeal: c.rgb(94, 234, 212),  // #5eead4
  darkTeal: c.rgb(15, 32, 39),     // #0f2027
  amber: c.rgb(245, 158, 11),      // #f59e0b
  emerald: c.rgb(16, 185, 129),    // #10b981
  rose: c.rgb(244, 63, 94),        // #f43f5e
  purple: c.rgb(168, 85, 247),     // #a855f7
  slate: c.rgb(148, 163, 184),     // #94a3b8
  dim: c.dim,
  bold: c.bold,
  reset: c.reset,
};

export function banner(): string {
  const brand = `${colors.lightTeal}${c.bold}ReVise${c.reset}`;
  const subtitle = `${colors.slate}Engineering-Memory Code Review Agent${c.reset}`;
  return `
${colors.teal}   ____       _    ___          ${c.reset}
${colors.teal}  / __ \\___  | |  / (_)_______  ${c.reset}  ${brand}
${colors.teal} / /_/ / _ \\ | | / / / ___/ _ \\ ${c.reset}  ${subtitle}
${colors.teal}/ _, _/  __/ | |/ / (__  )  __/ ${c.reset}  ${colors.dim}Hindsight Memory + Groq LPU${c.reset}
${colors.teal}/_/ |_|\\___/  |___/_/____/\\___/  ${c.reset}
`;
}

export function badge(label: string, type: 'teal' | 'amber' | 'green' | 'red' | 'purple' | 'slate' = 'teal'): string {
  switch (type) {
    case 'red':
      return `${c.bgRed}${c.brightWhite}${c.bold} ${label.toUpperCase()} ${c.reset}`;
    case 'amber':
      return `${c.bgYellow}${c.black}${c.bold} ${label.toUpperCase()} ${c.reset}`;
    case 'green':
      return `${c.bgGreen}${c.black}${c.bold} ${label.toUpperCase()} ${c.reset}`;
    case 'purple':
      return `${c.bgMagenta}${c.brightWhite}${c.bold} ${label.toUpperCase()} ${c.reset}`;
    case 'slate':
      return `${c.bgBlack}${c.brightWhite}${c.bold} ${label.toUpperCase()} ${c.reset}`;
    case 'teal':
    default:
      return `${c.bgCyan}${c.black}${c.bold} ${label.toUpperCase()} ${c.reset}`;
  }
}

export function riskMeter(score: number, level: string): string {
  const width = 20;
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  
  let barColor = colors.emerald;
  let levelBadge = badge(level, 'green');
  
  if (score >= 70 || level === 'High' || level === 'HIGH RISK') {
    barColor = colors.rose;
    levelBadge = badge('HIGH RISK', 'red');
  } else if (score >= 40 || level === 'Medium' || level === 'MEDIUM RISK') {
    barColor = colors.amber;
    levelBadge = badge('MEDIUM RISK', 'amber');
  } else {
    levelBadge = badge('RESOLVED / SAFE', 'green');
  }

  const bar = `${barColor}${'█'.repeat(filled)}${c.dim}${'░'.repeat(empty)}${c.reset}`;
  return `${bar} ${c.bold}${score}/100${c.reset} ${levelBadge}`;
}

export function formatSeverity(severity: string): string {
  const sev = (severity || 'LOW').toUpperCase();
  if (sev === 'HIGH' || sev === 'CRITICAL' || sev.includes('SEV-1')) {
    return `${c.brightRed}${c.bold}[HIGH]${c.reset}`;
  }
  if (sev === 'MEDIUM' || sev.includes('SEV-2')) {
    return `${c.brightYellow}${c.bold}[MED]${c.reset}`;
  }
  return `${c.brightGreen}[LOW]${c.reset}`;
}
