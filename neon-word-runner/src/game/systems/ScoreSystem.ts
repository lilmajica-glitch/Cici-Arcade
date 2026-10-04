export class ScoreSystem {
  private clearBonus = 0;

  get bonusScore(): number {
    return this.clearBonus;
  }

  awardObstacle(combo: number, feverActive: boolean): number {
    const comboMultiplier = combo >= 10 ? 2 : combo >= 5 ? 1.5 : 1;
    const feverMultiplier = feverActive ? 2 : 1;
    const points = Math.round(100 * comboMultiplier * feverMultiplier);
    this.clearBonus += points;
    return points;
  }

  total(distancePx: number): number {
    return Math.max(0, Math.round(distancePx / 8) + this.clearBonus);
  }

  reset(): void {
    this.clearBonus = 0;
  }
}
