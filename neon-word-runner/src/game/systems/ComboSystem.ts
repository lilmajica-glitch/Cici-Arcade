export interface ComboState {
  combo: number;
  maxCombo: number;
  feverActive: boolean;
  feverRemainingMs: number;
  feverStarted: boolean;
  comboMultiplier: number;
}

const FEVER_DURATION_MS = 12_000;

export class ComboSystem {
  private comboValue = 0;
  private maxComboValue = 0;
  private feverRemaining = 0;

  get combo(): number {
    return this.comboValue;
  }

  get maxCombo(): number {
    return this.maxComboValue;
  }

  get feverActive(): boolean {
    return this.feverRemaining > 0;
  }

  get feverRemainingMs(): number {
    return this.feverRemaining;
  }

  success(): ComboState {
    this.comboValue += 1;
    this.maxComboValue = Math.max(this.maxComboValue, this.comboValue);
    const feverStarted = this.comboValue === 10;
    if (feverStarted) this.feverRemaining = FEVER_DURATION_MS;
    return this.snapshot(feverStarted);
  }

  failure(): ComboState {
    this.comboValue = 0;
    this.feverRemaining = 0;
    return this.snapshot(false);
  }

  update(deltaMs: number): boolean {
    if (this.feverRemaining <= 0) return false;
    this.feverRemaining = Math.max(0, this.feverRemaining - deltaMs);
    return this.feverRemaining === 0;
  }

  reset(): void {
    this.comboValue = 0;
    this.maxComboValue = 0;
    this.feverRemaining = 0;
  }

  snapshot(feverStarted = false): ComboState {
    return {
      combo: this.comboValue,
      maxCombo: this.maxComboValue,
      feverActive: this.feverActive,
      feverRemainingMs: this.feverRemaining,
      feverStarted,
      comboMultiplier: this.comboValue >= 10 ? 2 : this.comboValue >= 5 ? 1.5 : 1,
    };
  }
}
