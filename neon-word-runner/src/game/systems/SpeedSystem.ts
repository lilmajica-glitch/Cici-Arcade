export class SpeedSystem {
  private baseSpeed = 390;
  private stumbleRemaining = 0;
  private dashRemaining = 0;
  private comboMultiplier = 1;
  private feverMultiplier = 1;

  setBaseSpeed(speed: number): void {
    this.baseSpeed = Math.max(0, speed);
  }

  beginStumble(durationMs = 900): void {
    this.stumbleRemaining = Math.max(this.stumbleRemaining, durationMs);
  }

  beginDash(durationMs = 650): void {
    this.dashRemaining = Math.max(this.dashRemaining, durationMs);
  }

  setCombo(combo: number): void {
    this.comboMultiplier = 1 + Math.min(Math.max(0, combo), 10) * 0.003;
  }

  setFever(active: boolean): void {
    this.feverMultiplier = active ? 1.03 : 1;
  }

  update(deltaMs: number): number {
    this.stumbleRemaining = Math.max(0, this.stumbleRemaining - deltaMs);
    this.dashRemaining = Math.max(0, this.dashRemaining - deltaMs);
    const multiplier = this.stumbleRemaining > 0
      ? 0.7
      : (this.dashRemaining > 0 ? 1.35 : 1) * this.comboMultiplier * this.feverMultiplier;
    return this.baseSpeed * multiplier;
  }

  reset(): void {
    this.baseSpeed = 390;
    this.stumbleRemaining = 0;
    this.dashRemaining = 0;
    this.comboMultiplier = 1;
    this.feverMultiplier = 1;
  }
}
