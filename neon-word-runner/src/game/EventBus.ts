import { Events } from 'phaser';
import type { RunOptions, RunResult } from '../types/game';

type GameEventMap = {
  'game:ready': undefined;
  'game:start': RunOptions;
  'game:end': RunResult;
  'settings:change': RunOptions;
};

class TypedEventBus {
  private readonly emitter = new Events.EventEmitter();

  on<K extends keyof GameEventMap>(
    event: K,
    listener: (payload: GameEventMap[K]) => void,
  ): () => void {
    this.emitter.on(event, listener);
    return () => this.emitter.off(event, listener);
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    this.emitter.emit(event, payload);
  }
}

export const EventBus = new TypedEventBus();
