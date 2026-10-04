import { AUTO, Game as PhaserGame, Scale } from 'phaser';
import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GAME_HEIGHT, GAME_WIDTH } from './world/Background';

export function startGame(parent: HTMLElement): PhaserGame {
  return new PhaserGame({
    type: AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#080b15',
    scale: {
      mode: Scale.FIT,
      autoCenter: Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    render: {
      antialias: true,
      roundPixels: false,
      powerPreference: 'high-performance',
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 1900 },
        debug: false,
      },
    },
    scene: [Boot, Game],
  });
}
