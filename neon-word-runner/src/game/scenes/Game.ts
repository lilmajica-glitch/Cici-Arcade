import Phaser, { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import type { RunOptions, RunResult } from '../../types/game';
import { Player } from '../entities/Player';
import { Background, GAME_HEIGHT, GAME_WIDTH } from '../world/Background';
import { Ground } from '../world/Ground';
import { TEST_ROUTE, TestCourse, type TestObstacle } from '../world/TestCourse';
import { ParkourController } from '../systems/ParkourController';
import { TEST_VOCABULARY } from '../../data/vocabulary';
import { VocabularySystem, type VocabularyQuestion } from '../systems/VocabularySystem';
import { QUESTION_ACTIONS, QUESTION_START_TIMES_MS, buildVocabularyRoute, questionWindowMs } from '../systems/runSchedule';
import type { ParkourAction } from '../systems/PlayerStateMachine';
import { SpeedSystem } from '../systems/SpeedSystem';
import { ComboSystem } from '../systems/ComboSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { AudioManager } from '../systems/AudioManager';
import { SpeedFeedbackSystem } from '../systems/SpeedFeedbackSystem';
import { WorldAnswerGates } from '../ui/WorldAnswerGates';
import { RunHud } from '../ui/RunHud';

type RunState = 'ready' | 'running' | 'finished';
const RUNNER_ANIMATIONS = [
  { key: 'runner-run', prefix: 'run/', frameRate: 12, repeat: -1 },
  { key: 'runner-jump', prefix: 'jump/', frameRate: 10, repeat: -1 },
  { key: 'runner-long-jump', prefix: 'long-jump/', frameRate: 9, repeat: -1 },
  { key: 'runner-vault', prefix: 'vault/', frameRate: 10, repeat: -1 },
  { key: 'runner-slide', prefix: 'slide/', frameRate: 10, repeat: -1 },
  { key: 'runner-wall-run', prefix: 'wall-run/', frameRate: 10, repeat: -1 },
  { key: 'runner-roll', prefix: 'roll/', frameRate: 11, repeat: -1 },
  { key: 'runner-dash', prefix: 'dash/', frameRate: 12, repeat: -1 },
  { key: 'runner-stumble', prefix: 'stumble/', frameRate: 9, repeat: -1 },
  { key: 'runner-land', prefix: 'land/', frameRate: 18, repeat: 0 },
] as const;
type RunnerDebugWindow = Window & {
  __nwrDebugSetZoom?: (zoom: number) => void;
  __nwrDebugForceStumble?: () => void;
  __nwrDebugFinishRun?: () => void;
  __nwrDebugState?: () => {
    runState: RunState;
    playerState: string;
    animation: string | undefined;
    x: number;
    y: number;
    bodyBottom: number;
    velocityY: number;
    elapsedMs: number;
    route: string;
    question: null | {
      id: string;
      action: ParkourAction;
      choices: readonly string[];
      correctIndex: number;
      remainingMs: number;
    };
    stats: { correct: number; wrong: number; accuracy: number; wordsReviewed: number };
    combo: number;
    maxCombo: number;
    fever: boolean;
    score: number;
    successfulObstacles: number;
    parkourEvents: readonly string[];
  };
};

export class Game extends Scene {
  private background!: Background;
  private ground!: Ground;
  private player!: Player;
  private course!: TestCourse;
  private parkour!: ParkourController;
  private route: readonly TestObstacle[] = [];
  private worldAnswerGates?: WorldAnswerGates;
  private vocabulary?: VocabularySystem;
  private nextQuestionIndex = 0;
  private activeQuestion: VocabularyQuestion | null = null;
  private activeQuestionDeadline = 0;
  private readonly speed = new SpeedSystem();
  private readonly combo = new ComboSystem();
  private readonly score = new ScoreSystem();
  private audio!: AudioManager;
  private speedFeedback!: SpeedFeedbackSystem;
  private runHud!: RunHud;
  private currentSpeed = 390;
  private footstepRemaining = 0;
  private previousPlayerState = 'RUN';
  private successfulObstacles = 0;
  private parkourEvents: string[] = [];
  private runState: RunState = 'ready';
  private elapsedMs = 0;
  private debugText?: Phaser.GameObjects.Text;
  private readonly actionDebugEnabled = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('debug') === 'actions';
  private currentOptions: RunOptions = {
    questionDirection: 'zh-en',
    soundVolume: 0.7,
    reducedMotion: false,
  };
  private unsubscribeStart?: () => void;
  private unsubscribeSettings?: () => void;

  constructor() {
    super('Game');
  }

  create(): void {
    this.runState = 'ready';
    RUNNER_ANIMATIONS.forEach(({ key, prefix, frameRate, repeat }) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNames('runner-atlas', {
          prefix,
          start: 0,
          end: 3,
          zeroPad: 3,
        }),
        frameRate,
        repeat,
      });
    });

    this.background = new Background(this);
    this.route = this.actionDebugEnabled ? TEST_ROUTE : buildVocabularyRoute();
    const gaps = this.actionDebugEnabled ? [] : this.route
      .filter((obstacle) => obstacle.action === 'LONG_JUMP')
      .map((obstacle) => ({ startX: obstacle.triggerX + 110, endX: obstacle.triggerX + 520 }));
    this.ground = new Ground(this, gaps);
    this.course = new TestCourse(this, this.route);
    this.player = new Player(this, GAME_WIDTH - 230);
    this.player.setReducedMotion(this.currentOptions.reducedMotion);
    this.audio = new AudioManager();
    this.audio.setVolume(this.currentOptions.soundVolume);
    this.speedFeedback = new SpeedFeedbackSystem(this, this.cameras.main);
    this.speedFeedback.setReducedMotion(this.currentOptions.reducedMotion);
    this.runHud = new RunHud(this);
    this.parkour = new ParkourController(this.player, this.speed, this.route, {
      onActionStart: this.onActionStart,
      onActionSuccess: this.onActionSuccess,
      onFailure: this.onRunFailure,
    });
    if (!this.actionDebugEnabled) this.worldAnswerGates = new WorldAnswerGates(this, this.answerQuestion);
    this.physics.add.collider(this.player.sprite, this.ground.group);
    this.physics.add.overlap(this.player.sprite, this.course.obstacles, this.onObstacleContact, undefined, this);
    this.physics.world.setBounds(-200000, 0, 400000, GAME_HEIGHT);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, 200000, GAME_HEIGHT);
    camera.setScroll(0, 0);

    this.unsubscribeStart = EventBus.on('game:start', this.startRun);
    this.unsubscribeSettings = EventBus.on('settings:change', this.applySettings);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.bindDebugInput();
    this.bindQuestionInput();
    if (import.meta.env.DEV) this.exposeDebugState();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    EventBus.emit('game:ready', undefined);
  }

  update(_time: number, delta: number): void {
    if (this.runState !== 'running') return;

    const frameDelta = Math.min(delta, 100);
    this.elapsedMs = Math.min(this.elapsedMs + frameDelta, 85_000);
    const elapsed = this.elapsedMs;
    if (elapsed >= 85_000) {
      this.finishRun();
      return;
    }
    this.speed.setBaseSpeed(Phaser.Math.Clamp(390 + elapsed * 0.0012, 390, 470));
    this.currentSpeed = this.speed.update(frameDelta);
    this.player.setRunSpeed(this.currentSpeed);
    this.player.update(frameDelta);
    if (this.player.state === 'LAND' && this.previousPlayerState !== 'LAND') {
      this.speedFeedback.pulse('land');
    }
    this.previousPlayerState = this.player.state;
    this.parkour.update(this.player.sprite.x);
    const scrollX = this.cameras.main.scrollX;
    this.background.update(scrollX);
    this.ground.update(scrollX);
    if (!this.actionDebugEnabled) this.updateQuestions(elapsed);
    this.worldAnswerGates?.update(frameDelta, this.activeQuestionDeadline - elapsed);
    if (this.combo.update(frameDelta)) this.onFeverEnded();
    this.speedFeedback.update(frameDelta, this.currentSpeed);
    this.runHud.update(
      this.score.total(this.player.sprite.x - 190),
      this.combo.combo,
      this.combo.feverActive,
      this.combo.feverRemainingMs,
      frameDelta,
    );
    this.updateFootsteps(frameDelta);
    this.updateDebugText();
  }

  private readonly startRun = (options: RunOptions): void => {
    if (this.runState === 'running') return;
    this.currentOptions = options;
    this.speed.reset();
    this.combo.reset();
    this.score.reset();
    this.successfulObstacles = 0;
    this.parkourEvents = [];
    this.currentSpeed = 390;
    this.footstepRemaining = 0;
    this.previousPlayerState = 'RUN';
    this.runHud.reset();
    this.speedFeedback.setFever(false);
    this.audio.setVolume(options.soundVolume);
    this.audio.resume();
    this.audio.setMusicLayer('normal');
    this.vocabulary = this.actionDebugEnabled
      ? undefined
      : new VocabularySystem(TEST_VOCABULARY, options.questionDirection, QUESTION_ACTIONS);
    this.nextQuestionIndex = 0;
    this.activeQuestion = null;
    this.activeQuestionDeadline = 0;
    this.elapsedMs = 0;
    this.worldAnswerGates?.reset();
    this.player.reset();
    this.player.setReducedMotion(options.reducedMotion);
    this.ground.reset();
    this.parkour.reset();
    this.cameras.main.setZoom(1);
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setFollowOffset(-290, 0);
    this.runState = 'running';
    this.player.start();
  };

  private readonly applySettings = (options: RunOptions): void => {
    this.currentOptions = options;
    this.player?.setReducedMotion(options.reducedMotion);
    this.audio?.setVolume(options.soundVolume);
    this.speedFeedback?.setReducedMotion(options.reducedMotion);
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      if (this.runState === 'running') {
        this.audio?.suspend();
        this.scene.pause();
      }
      return;
    }
    if (this.scene.isPaused()) this.scene.resume();
    if (this.runState === 'running') {
      this.audio.resume();
      this.audio.setMusicLayer(this.combo.feverActive ? 'fever' : this.combo.combo >= 3 ? 'combo' : 'normal');
    }
  };

  private readonly onObstacleContact = (): void => {
    if (this.runState !== 'running') return;
    this.parkour.forceStumble();
  };

  private readonly debugJump = (): void => this.queueDebugAction('JUMP');
  private readonly debugVault = (): void => this.queueDebugAction('VAULT');
  private readonly debugSlide = (): void => this.queueDebugAction('SLIDE');
  private readonly debugStumble = (): void => {
    if (this.runState === 'running') this.parkour.forceStumble();
  };

  private readonly finishRun = (): void => {
    if (this.runState !== 'running') return;
    this.runState = 'finished';
    this.player.finish();
    this.worldAnswerGates?.reset();
    this.activeQuestion = null;
    this.audio.playSfx('finish');
    this.audio.setMusicLayer('off');
    this.runHud.showFeedback('FINISH', 'good', 1_500);
    const stats = this.vocabulary?.stats;
    const result: RunResult = {
      score: this.score.total(this.player.sprite.x - 190),
      accuracy: stats?.accuracy ?? 0,
      correct: stats?.correct ?? 0,
      wrong: stats?.wrong ?? 0,
      maxCombo: this.combo.maxCombo,
      wordsReviewed: stats?.wordsReviewed ?? 0,
      durationMs: Math.min(this.elapsedMs, 85_000),
      wrongAnswers: [...(this.vocabulary?.wrongAnswers ?? [])],
    };
    EventBus.emit('game:end', result);
  };

  private bindDebugInput(): void {
    if (!this.actionDebugEnabled) return;
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    keyboard.on('keydown-J', this.debugJump);
    keyboard.on('keydown-V', this.debugVault);
    keyboard.on('keydown-S', this.debugSlide);
    keyboard.on('keydown-H', this.debugStumble);
    this.debugText = this.add.text(22, 68, 'ACTION TEST', {
      fontFamily: 'Consolas, monospace',
      fontSize: '14px',
      color: '#b9eff6',
      backgroundColor: '#0a1220cc',
      padding: { x: 12, y: 9 },
    }).setScrollFactor(0).setDepth(20);
  }

  private bindQuestionInput(): void {
    if (this.actionDebugEnabled) return;
    this.input.keyboard?.on('keydown', this.onQuestionKey);
  }

  private readonly onQuestionKey = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    const choiceIndex = key === 'a' || key === '1' || key === 'arrowleft'
      ? 0
      : key === 's' || key === '2' || key === 'arrowdown'
        ? 1
        : key === 'd' || key === '3' || key === 'arrowright'
          ? 2
          : -1;
    if (choiceIndex >= 0) this.answerQuestion(choiceIndex);
  };

  private updateQuestions(elapsed: number): void {
    if (this.activeQuestion) {
      if (elapsed >= this.activeQuestionDeadline) {
        const decision = this.vocabulary?.timeout(this.activeQuestion.id);
        if (decision) this.resolveQuestion(decision);
      }
      return;
    }

    if (this.nextQuestionIndex >= QUESTION_START_TIMES_MS.length
      || elapsed < QUESTION_START_TIMES_MS[this.nextQuestionIndex]) return;

    const question = this.vocabulary?.presentNext();
    if (!question) return;
    const index = this.nextQuestionIndex;
    const duration = questionWindowMs(index);
    this.nextQuestionIndex += 1;
    this.activeQuestion = question;
    this.activeQuestionDeadline = QUESTION_START_TIMES_MS[index] + duration;
    this.worldAnswerGates?.present(question, index, this.vocabulary?.questionCount ?? 0, duration, this.cameras.main);
  }

  private readonly answerQuestion = (choiceIndex: number): void => {
    if (this.runState !== 'running' || !this.activeQuestion) return;
    const decision = this.vocabulary?.submit(this.activeQuestion.id, choiceIndex);
    if (decision) {
      if (decision.correct) {
        this.audio.playSfx('correct');
        this.audio.speakWord(decision.question.english);
      }
      this.resolveQuestion(decision);
    }
  };

  private resolveQuestion(decision: { correct: boolean; correctIndex: number; chosenIndex: number | null; question: VocabularyQuestion }): void {
    this.parkour.resolveQuestion(decision.question.action, decision.correct);
    this.worldAnswerGates?.resolve(decision.correct, decision.chosenIndex, decision.correctIndex);
    this.activeQuestion = null;
  }

  private exposeDebugState(): void {
    (window as RunnerDebugWindow).__nwrDebugSetZoom = (zoom: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.75, 1.5));
    };
    (window as RunnerDebugWindow).__nwrDebugForceStumble = () => this.parkour.forceStumble();
    (window as RunnerDebugWindow).__nwrDebugFinishRun = this.finishRun;
    (window as RunnerDebugWindow).__nwrDebugState = () => {
      const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
      const elapsedMs = Math.round(this.elapsedMs);
      return {
        runState: this.runState,
        playerState: this.player.state,
        animation: this.player.animationKey,
        x: Math.round(this.player.sprite.x),
        y: Math.round(this.player.sprite.y),
        bodyBottom: Math.round(body.bottom),
        velocityY: Math.round(body.velocity.y),
        elapsedMs,
        route: this.parkour.status,
        question: this.activeQuestion ? {
          id: this.activeQuestion.id,
          action: this.activeQuestion.action,
          choices: this.activeQuestion.choices,
          correctIndex: this.activeQuestion.correctIndex,
          remainingMs: Math.max(0, Math.round(this.activeQuestionDeadline - elapsedMs)),
        } : null,
        stats: this.vocabulary?.stats ?? { correct: 0, wrong: 0, accuracy: 0, wordsReviewed: 0 },
        combo: this.combo.combo,
        maxCombo: this.combo.maxCombo,
        fever: this.combo.feverActive,
        score: this.score.total(this.player.sprite.x - 190),
        successfulObstacles: this.successfulObstacles,
        parkourEvents: [...this.parkourEvents],
      };
    };
  }

  private queueDebugAction(action: ParkourAction): void {
    if (this.runState === 'running') this.parkour.queueAction(action);
  }

  private updateDebugText(): void {
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const platform = this.ground.group.getChildren()
      .map((object) => (object as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.StaticBody)
      .find((candidate) => this.player.sprite.x >= candidate.left && this.player.sprite.x <= candidate.right);
    const floor = platform ? `G ${Math.round(platform.top)}-${Math.round(platform.bottom)}` : 'NO GROUND';
    const contact = body.blocked.down || body.touching.down ? ' · TOUCH' : '';
    const next = `PLAYER ${this.player.state} · X ${Math.round(this.player.sprite.x)} Y ${Math.round(this.player.sprite.y)} B ${Math.round(body.bottom)} · ${floor}${contact} · ${this.parkour.status}`;
    if (this.debugText && this.debugText.text !== next) this.debugText.setText(next);
  }

  private cleanup(): void {
    this.unsubscribeStart?.();
    this.unsubscribeSettings?.();
    this.unsubscribeStart = undefined;
    this.unsubscribeSettings = undefined;
    const keyboard = this.input.keyboard;
    keyboard?.off('keydown-J', this.debugJump);
    keyboard?.off('keydown-V', this.debugVault);
    keyboard?.off('keydown-S', this.debugSlide);
    keyboard?.off('keydown-H', this.debugStumble);
    keyboard?.off('keydown', this.onQuestionKey);
    delete (window as RunnerDebugWindow).__nwrDebugSetZoom;
    delete (window as RunnerDebugWindow).__nwrDebugForceStumble;
    delete (window as RunnerDebugWindow).__nwrDebugFinishRun;
    delete (window as RunnerDebugWindow).__nwrDebugState;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.worldAnswerGates?.destroy();
    this.worldAnswerGates = undefined;
    this.runHud.destroy();
    this.speedFeedback.destroy();
    this.audio.destroy();
  }

  private readonly onActionStart = (action: ParkourAction): void => {
    this.recordParkourEvent(`START ${action}`);
    const sound = action === 'VAULT' ? 'vault'
      : action === 'SLIDE' || action === 'ROLL' ? 'slide'
        : action === 'DASH' ? 'dash' : 'jump';
    this.audio.playSfx(sound);
    if (action === 'DASH') this.speedFeedback.pulse('action');
  };

  private readonly onActionSuccess = (_action: ParkourAction): void => {
    this.successfulObstacles += 1;
    this.recordParkourEvent(`CLEAR ${_action}`);
    const state = this.combo.success();
    this.speed.setCombo(state.combo);
    this.speed.setFever(state.feverActive);
    this.speedFeedback.setFever(state.feverActive);
    this.player.setFever(state.feverActive);
    const points = this.score.awardObstacle(state.combo, state.feverActive);

    if (state.feverStarted) {
      this.runHud.showFeedback('FEVER · 12 SECONDS · ×2 SCORE', 'fever', 1_700);
      this.audio.playSfx('fever');
      this.audio.setMusicLayer('fever');
      this.speedFeedback.pulse('fever');
    } else if (state.combo >= 5 && (state.combo === 5 || state.combo % 5 === 0)) {
      this.runHud.showFeedback(`PERFECT · COMBO ×${state.combo} · +${points}`, 'perfect', 1_350);
      this.audio.playSfx('combo');
      this.audio.setMusicLayer(state.feverActive ? 'fever' : 'combo');
      this.speedFeedback.pulse('combo');
    } else {
      this.runHud.showFeedback(`GOOD · CLEAR · +${points}`, 'good', 850);
      if (state.combo >= 3) this.audio.setMusicLayer(state.feverActive ? 'fever' : 'combo');
    }
  };

  private readonly onRunFailure = (reason: string): void => {
    this.recordParkourEvent(`FAIL ${reason}`);
    this.combo.failure();
    this.speed.setCombo(0);
    this.speed.setFever(false);
    this.speedFeedback.setFever(false);
    this.player.setFever(false);
    this.audio.playSfx('wrong');
    this.audio.setMusicLayer('normal');
    this.speedFeedback.pulse('failure');
    this.runHud.showFeedback('MISS · COMBO RESET', 'miss');
  };

  private onFeverEnded(): void {
    this.speed.setFever(false);
    this.speedFeedback.setFever(false);
    this.player.setFever(false);
    this.audio.setMusicLayer(this.combo.combo >= 3 ? 'combo' : 'normal');
    this.runHud.showFeedback('FEVER ENDED', 'neutral', 850);
  }

  private updateFootsteps(deltaMs: number): void {
    if (this.currentOptions.reducedMotion || this.player.state !== 'RUN' || this.runState !== 'running') return;
    this.footstepRemaining -= deltaMs;
    if (this.footstepRemaining <= 0) {
      this.audio.playSfx('footstep');
      this.footstepRemaining = 620;
    }
  }

  private recordParkourEvent(event: string): void {
    const elapsed = Math.max(0, Math.round(this.elapsedMs));
    this.parkourEvents.push(`${elapsed}ms ${event}`);
    if (this.parkourEvents.length > 20) this.parkourEvents.shift();
  }
}
