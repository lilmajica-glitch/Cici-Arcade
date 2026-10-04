import Phaser from 'phaser';

export type FeedbackTone = 'good' | 'perfect' | 'miss' | 'fever' | 'neutral';

export class RunHud {
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly feverText: Phaser.GameObjects.Text;
  private readonly feedbackText: Phaser.GameObjects.Text;
  private feedbackRemaining = 0;
  private lastScore = -1;
  private lastCombo = -1;

  constructor(scene: Phaser.Scene) {
    this.scoreText = scene.add.text(26, 22, 'SCORE 000000', {
      fontFamily: 'Consolas, monospace', fontSize: '14px', color: '#d8e7f6', letterSpacing: 1,
      backgroundColor: '#07101fcc', padding: { x: 10, y: 7 },
    }).setScrollFactor(0).setDepth(30);
    this.comboText = scene.add.text(1_254, 22, 'COMBO ×00', {
      fontFamily: 'Consolas, monospace', fontSize: '14px', color: '#d8e7f6', letterSpacing: 1,
      backgroundColor: '#07101fcc', padding: { x: 10, y: 7 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(30);
    this.feverText = scene.add.text(640, 29, '', {
      fontFamily: 'Consolas, monospace', fontSize: '13px', color: '#ff89eb', letterSpacing: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30);
    this.feedbackText = scene.add.text(640, 66, '', {
      fontFamily: 'Consolas, monospace', fontSize: '20px', fontStyle: 'bold',
      color: '#90f5d3', letterSpacing: 2, backgroundColor: '#07101dbb',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31).setVisible(false);
  }

  update(score: number, combo: number, feverActive: boolean, feverRemainingMs: number, deltaMs: number): void {
    if (score !== this.lastScore) {
      this.lastScore = score;
      this.scoreText.setText(`SCORE ${score.toString().padStart(6, '0')}`);
    }
    if (combo !== this.lastCombo) {
      this.lastCombo = combo;
      this.comboText.setText(`COMBO ×${String(combo).padStart(2, '0')}`);
      this.comboText.setColor(combo >= 10 ? '#ff89eb' : combo >= 5 ? '#77f4e0' : '#d8e7f6');
    }
    this.feverText.setText(feverActive ? `FEVER  ${Math.ceil(feverRemainingMs / 1_000)}s` : '');
    if (this.feedbackRemaining > 0) {
      this.feedbackRemaining -= deltaMs;
      if (this.feedbackRemaining <= 0) this.feedbackText.setVisible(false);
    }
  }

  showFeedback(message: string, tone: FeedbackTone, durationMs = 1_150): void {
    const color: Record<FeedbackTone, string> = {
      good: '#90f5d3',
      perfect: '#77f4e0',
      miss: '#ff9279',
      fever: '#ff89eb',
      neutral: '#cbd8e7',
    };
    this.feedbackRemaining = durationMs;
    this.feedbackText.setText(message).setColor(color[tone]).setVisible(true);
  }

  reset(): void {
    this.lastScore = -1;
    this.lastCombo = -1;
    this.feedbackRemaining = 0;
    this.feverText.setText('');
    this.feedbackText.setText('').setVisible(false);
  }

  destroy(): void {
    this.scoreText.destroy();
    this.comboText.destroy();
    this.feverText.destroy();
    this.feedbackText.destroy();
  }
}
