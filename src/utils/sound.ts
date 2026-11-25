class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', delay = 0, gainVal = 0.08) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(gainVal, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch {
      // Ignore audio failures when autoplay is blocked
    }
  }

  playCoin() {
    this.tone(880, 0.09, 'triangle', 0, 0.07);
    this.tone(1174.66, 0.14, 'triangle', 0.06, 0.07);
  }

  playBuy() {
    this.tone(523.25, 0.08, 'sine', 0, 0.06);
    this.tone(659.25, 0.12, 'sine', 0.05, 0.06);
  }

  playSell() {
    this.tone(659.25, 0.08, 'sine', 0, 0.06);
    this.tone(783.99, 0.12, 'sine', 0.05, 0.06);
  }

  playMonthAdvance() {
    this.tone(440, 0.09, 'sine', 0, 0.06);
    this.tone(554.37, 0.11, 'sine', 0.07, 0.06);
  }

  playUpgrade() {
    this.tone(523.25, 0.1, 'triangle', 0, 0.08);
    this.tone(659.25, 0.1, 'triangle', 0.08, 0.08);
    this.tone(783.99, 0.18, 'triangle', 0.16, 0.08);
  }

  playAlert() {
    this.tone(240, 0.14, 'sawtooth', 0, 0.04);
    this.tone(185, 0.18, 'sawtooth', 0.09, 0.04);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => this.tone(n, 0.22, 'triangle', i * 0.09, 0.08));
  }

  playGameOver() {
    const notes = [329.63, 293.66, 246.94, 196.0];
    notes.forEach((n, i) => this.tone(n, 0.22, 'sine', i * 0.11, 0.07));
  }
}

export const soundEngine = new SoundEngine();
