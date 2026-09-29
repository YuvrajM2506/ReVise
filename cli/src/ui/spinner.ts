import { c, colors } from './colors';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export class Spinner {
  private timer: NodeJS.Timeout | null = null;
  private frameIndex = 0;
  private message: string;
  private isSpinning = false;

  constructor(message: string = '') {
    this.message = message;
  }

  start(message?: string): this {
    if (message) this.message = message;
    if (this.isSpinning) return this;

    // Check if terminal is interactive
    if (!process.stdout.isTTY) {
      if (this.message) {
        process.stdout.write(`... ${this.message}\n`);
      }
      return this;
    }

    this.isSpinning = true;
    process.stdout.write('\x1B[?25l'); // Hide cursor

    this.timer = setInterval(() => {
      const frame = SPINNER_FRAMES[this.frameIndex];
      process.stdout.write(`\r${colors.teal}${frame}${c.reset} ${this.message}`);
      this.frameIndex = (this.frameIndex + 1) % SPINNER_FRAMES.length;
    }, 80);

    return this;
  }

  update(message: string): this {
    this.message = message;
    if (!this.isSpinning && process.stdout.isTTY) {
      this.start();
    }
    return this;
  }

  stop(): this {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.isSpinning && process.stdout.isTTY) {
      process.stdout.write('\r\x1B[K\x1B[?25h'); // Clear line and show cursor
    }
    this.isSpinning = false;
    return this;
  }

  succeed(message?: string): this {
    this.stop();
    const text = message || this.message;
    console.log(`${c.brightGreen}✔${c.reset} ${text}`);
    return this;
  }

  fail(message?: string): this {
    this.stop();
    const text = message || this.message;
    console.log(`${c.brightRed}✖${c.reset} ${text}`);
    return this;
  }

  warn(message?: string): this {
    this.stop();
    const text = message || this.message;
    console.log(`${c.brightYellow}⚠${c.reset} ${text}`);
    return this;
  }

  info(message?: string): this {
    this.stop();
    const text = message || this.message;
    console.log(`${colors.lightTeal}ℹ${c.reset} ${text}`);
    return this;
  }
}

export function createSpinner(message: string): Spinner {
  return new Spinner(message);
}
