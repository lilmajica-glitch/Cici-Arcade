import Phaser from 'phaser';
import type { VocabularyQuestion } from '../systems/VocabularySystem';

type ChoiceHandler = (index: number) => void;

const READING_PARALLAX = 0.04;
const GATE_CENTERS = [650, 900, 1_150] as const;
const GATE_WIDTH = 210;
const GATE_HEIGHT = 188;
const GATE_COLORS = [0x42e8f0, 0xa66cff, 0xff55bd] as const;
const INPUT_HINTS = ['A · ← · 1', 'S · ↓ · 2', 'D · → · 3'] as const;

export class WorldAnswerGates {
  private readonly scene: Phaser.Scene;
  private readonly onChoice: ChoiceHandler;
  private containers: Phaser.GameObjects.Container[] = [];
  private zones: Phaser.GameObjects.Zone[] = [];
  private choiceFrames: Phaser.GameObjects.Rectangle[] = [];
  private readonly feedback: Phaser.GameObjects.Text;
  private readonly timer: Phaser.GameObjects.Graphics;
  private active = false;
  private feedbackRemaining = 0;
  private durationMs = 1;
  private question?: VocabularyQuestion;

  constructor(scene: Phaser.Scene, onChoice: ChoiceHandler) {
    this.scene = scene;
    this.onChoice = onChoice;
    this.feedback = scene.add.text(0, 0, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: '#90f5d3',
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(9).setScrollFactor(READING_PARALLAX).setVisible(false);
    this.timer = scene.add.graphics().setDepth(9).setScrollFactor(READING_PARALLAX).setVisible(false);
  }

  present(
    question: VocabularyQuestion,
    index: number,
    total: number,
    durationMs: number,
    camera: Phaser.Cameras.Scene2D.Camera,
  ): void {
    this.clearQuestion();
    this.active = true;
    this.question = question;
    this.durationMs = durationMs;
    this.feedbackRemaining = 0;
    this.feedback.setText('').setVisible(true);
    this.createPromptBoard(question, index, total, camera);
    this.createAnswerGates(question, camera);
    this.drawTimer(1);
  }

  resolve(correct: boolean, chosenIndex: number | null, correctIndex: number): void {
    if (!this.question) return;
    this.active = false;
    this.feedbackRemaining = 1_300;
    this.zones.forEach((zone) => zone.disableInteractive());
    this.choiceFrames.forEach((frame, index) => {
      if (index === correctIndex) frame.setStrokeStyle(3, 0x49e2bc, 1).setFillStyle(0x123b3b, 0.98);
      else if (index === chosenIndex) frame.setStrokeStyle(3, 0xf07b63, 1).setFillStyle(0x4b2527, 0.98);
    });
    const answer = this.question.choices[correctIndex];
    this.feedback
      .setColor(correct ? '#90f5d3' : '#ff9279')
      .setText(correct
        ? `GOOD · ${this.question.action.replace('_', ' ')} LOCKED · ${this.question.pronunciation}`
        : `${chosenIndex === null ? 'TIME UP' : 'MISS'} · STUMBLE · ANSWER: ${answer}`)
      .setVisible(true);
    this.timer.clear();
  }

  update(deltaMs: number, remainingMs: number): void {
    if (this.feedbackRemaining > 0) {
      this.feedbackRemaining -= deltaMs;
      if (this.feedbackRemaining <= 0) this.clearQuestion();
      return;
    }
    if (this.active) this.drawTimer(Phaser.Math.Clamp(remainingMs / this.durationMs, 0, 1));
  }

  reset(): void {
    this.clearQuestion();
  }

  destroy(): void {
    this.clearQuestion();
    this.feedback.destroy();
    this.timer.destroy();
  }

  private createPromptBoard(
    question: VocabularyQuestion,
    index: number,
    total: number,
    camera: Phaser.Cameras.Scene2D.Camera,
  ): void {
    const width = 620;
    const height = 144;
    const centerX = 640;
    const centerY = 150;
    const board = this.scene.add.container(
      this.worldX(centerX - width / 2, camera),
      this.worldY(centerY - height / 2, camera),
    ).setDepth(8).setScrollFactor(READING_PARALLAX).setExclusive(true);
    board.add([
      this.scene.add.rectangle(width / 2, height / 2, width, height, 0x07101f, 0.96)
        .setStrokeStyle(2, 0x42e8f0, 0.95),
      this.scene.add.rectangle(width / 2, 12, width - 12, 3, 0x42e8f0, 0.9),
      this.scene.add.text(width / 2, 30,
        `STREET SIGN  ·  WORD ${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}  ·  ${question.action.replace('_', ' ')}`,
        { fontFamily: 'Consolas, monospace', fontSize: '12px', color: '#42e8f0', letterSpacing: 1.5 },
      ).setOrigin(0.5),
      this.scene.add.text(width / 2, 83, question.prompt, {
        fontFamily: 'Segoe UI, Microsoft YaHei, Arial, sans-serif',
        fontSize: question.prompt.length > 14 ? '24px' : '30px',
        color: '#f1f6ff',
        wordWrap: { width: width - 48 },
        align: 'center',
      }).setOrigin(0.5),
    ]);
    this.containers.push(board);
    this.feedback.setPosition(
      this.worldX(centerX, camera),
      this.worldY(centerY + 108, camera),
    );
    this.timer.setPosition(0, 0);
    this.timer.setVisible(true);
    this.timer.setScrollFactor(READING_PARALLAX);
    this.timer.setDepth(9);
    this.timer.setPosition(this.worldX(centerX - 270, camera), this.worldY(centerY + 62, camera));
  }

  private createAnswerGates(question: VocabularyQuestion, camera: Phaser.Cameras.Scene2D.Camera): void {
    question.choices.forEach((choice, index) => {
      const color = GATE_COLORS[index];
      const centerX = GATE_CENTERS[index];
      const centerY = 360;
      const container = this.scene.add.container(
        this.worldX(centerX - GATE_WIDTH / 2, camera),
        this.worldY(centerY - GATE_HEIGHT / 2, camera),
      ).setDepth(4).setScrollFactor(READING_PARALLAX).setExclusive(true);
      const frame = this.scene.add.rectangle(GATE_WIDTH / 2, GATE_HEIGHT / 2, GATE_WIDTH - 12, GATE_HEIGHT - 16, 0x091423, 0.92)
        .setStrokeStyle(2, color, 0.96);
      this.choiceFrames.push(frame);
      container.add([
        this.scene.add.rectangle(GATE_WIDTH / 2, 13, GATE_WIDTH - 10, 20, color, 0.2)
          .setStrokeStyle(1, color, 1),
        this.scene.add.rectangle(11, GATE_HEIGHT / 2, 5, GATE_HEIGHT - 20, color, 0.95),
        this.scene.add.rectangle(GATE_WIDTH - 11, GATE_HEIGHT / 2, 5, GATE_HEIGHT - 20, color, 0.95),
        frame,
        this.scene.add.text(28, 34, `GATE 0${index + 1}`, {
          fontFamily: 'Consolas, monospace', fontSize: '11px', color: '#a6b8d0', letterSpacing: 1,
        }).setOrigin(0, 0.5),
        this.scene.add.text(GATE_WIDTH - 28, 34, INPUT_HINTS[index], {
          fontFamily: 'Consolas, monospace', fontSize: '10px', color: '#d4e9f7',
        }).setOrigin(1, 0.5),
        this.scene.add.text(GATE_WIDTH / 2, 101, choice, {
          fontFamily: 'Segoe UI, Microsoft YaHei, Arial, sans-serif',
          fontSize: choice.length > 11 ? '16px' : choice.length > 7 ? '18px' : '22px',
          color: '#f1f6ff',
          wordWrap: { width: GATE_WIDTH - 38 },
          align: 'center',
        }).setOrigin(0.5),
        this.scene.add.rectangle(GATE_WIDTH / 2, GATE_HEIGHT - 14, 62, 3, color, 1),
      ]);
      const zone = this.scene.add.zone(
        this.worldX(centerX, camera),
        this.worldY(centerY, camera),
        GATE_WIDTH,
        GATE_HEIGHT,
      )
        .setInteractive({ useHandCursor: true });
      zone.setDepth(9).setScrollFactor(READING_PARALLAX);
      zone.on('pointerdown', () => {
        if (this.active) this.onChoice(index);
      });
      this.containers.push(container);
      this.zones.push(zone);
    });
  }

  private drawTimer(ratio: number): void {
    const width = 540;
    this.timer.clear();
    this.timer.fillStyle(0x172238, 1).fillRoundedRect(0, 0, width, 5, 2);
    if (ratio > 0) {
      this.timer.fillStyle(ratio > 0.35 ? 0x42e8f0 : 0xf07b63, 1)
        .fillRoundedRect(0, 0, width * ratio, 5, 2);
    }
  }

  private worldX(screenX: number, camera: Phaser.Cameras.Scene2D.Camera): number {
    const originX = camera.width * camera.originX;
    return (screenX - camera.x - originX) / camera.zoomX
      + originX + camera.scrollX * READING_PARALLAX;
  }

  private worldY(screenY: number, camera: Phaser.Cameras.Scene2D.Camera): number {
    const originY = camera.height * camera.originY;
    return (screenY - camera.y - originY) / camera.zoomY
      + originY + camera.scrollY * READING_PARALLAX;
  }

  private clearQuestion(): void {
    this.containers.forEach((container) => container.destroy());
    this.containers = [];
    this.zones = [];
    this.choiceFrames = [];
    this.timer.clear().setVisible(false);
    this.feedback.setText('').setVisible(false);
    this.active = false;
    this.feedbackRemaining = 0;
    this.question = undefined;
  }
}
