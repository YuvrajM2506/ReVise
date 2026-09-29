import { c, colors } from './colors';

export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
}

/**
 * Strips ANSI escape sequences to compute real visible character width.
 */
export function visibleLength(str: string): number {
  return str.replace(/\x1b\[[0-9;]*m/g, '').length;
}

/**
 * Pads a string with ANSI formatting to a target visible width.
 */
export function padVisible(str: string, targetWidth: number, align: 'left' | 'right' | 'center' = 'left'): string {
  const len = visibleLength(str);
  if (len >= targetWidth) return str;
  const diff = targetWidth - len;
  if (align === 'right') {
    return ' '.repeat(diff) + str;
  }
  if (align === 'center') {
    const left = Math.floor(diff / 2);
    const right = diff - left;
    return ' '.repeat(left) + str + ' '.repeat(right);
  }
  return str + ' '.repeat(diff);
}

/**
 * Renders a clean Unicode box table for terminal display.
 */
export function renderTable(columns: TableColumn[], data: Record<string, any>[]): string {
  // Determine column widths
  const colWidths: number[] = columns.map(col => {
    let max = visibleLength(col.header);
    for (const row of data) {
      const val = row[col.key] !== undefined ? String(row[col.key]) : '';
      const len = visibleLength(val);
      if (len > max) max = len;
    }
    return Math.max(max, col.width || 0);
  });

  const horizontalBorder = (left: string, mid: string, right: string, char: string = '─') =>
    left + colWidths.map(w => char.repeat(w + 2)).join(mid) + right;

  const topBorder = `${c.dim}${horizontalBorder('┌', '┬', '┐')}${c.reset}`;
  const headerSeparator = `${c.dim}${horizontalBorder('├', '┼', '┤')}${c.reset}`;
  const bottomBorder = `${c.dim}${horizontalBorder('└', '┴', '┘')}${c.reset}`;

  // Header row
  const headerRow =
    `${c.dim}│${c.reset}` +
    columns
      .map((col, i) => {
        const padded = padVisible(`${c.bold}${col.header}${c.reset}`, colWidths[i], col.align || 'left');
        return ` ${padded} `;
      })
      .join(`${c.dim}│${c.reset}`) +
    `${c.dim}│${c.reset}`;

  // Body rows
  const bodyRows = data.map(row => {
    return (
      `${c.dim}│${c.reset}` +
      columns
        .map((col, i) => {
          const val = row[col.key] !== undefined ? String(row[col.key]) : '';
          const padded = padVisible(val, colWidths[i], col.align || 'left');
          return ` ${padded} `;
        })
        .join(`${c.dim}│${c.reset}`) +
      `${c.dim}│${c.reset}`
    );
  });

  return [topBorder, headerRow, headerSeparator, ...bodyRows, bottomBorder].join('\n');
}

/**
 * Renders a bordered panel with title.
 */
export function renderCard(title: string, content: string, borderColor = colors.teal): string {
  const lines = content.split('\n');
  const maxLineLen = Math.max(
    visibleLength(title) + 4,
    ...lines.map(l => visibleLength(l))
  );
  const width = Math.min(Math.max(maxLineLen, 40), 90);

  const titlePadded = ` ${title} `;
  const topDashTotal = width - visibleLength(titlePadded) - 2;
  const leftDash = '─'.repeat(2);
  const rightDash = '─'.repeat(Math.max(0, topDashTotal - 2));

  const top = `${borderColor}┌${leftDash}${c.bold}${titlePadded}${c.reset}${borderColor}${rightDash}┐${c.reset}`;
  const bottom = `${borderColor}└${'─'.repeat(width)}┘${c.reset}`;

  const body = lines.map(line => {
    const padded = padVisible(line, width - 2);
    return `${borderColor}│${c.reset} ${padded} ${borderColor}│${c.reset}`;
  });

  return [top, ...body, bottom].join('\n');
}
