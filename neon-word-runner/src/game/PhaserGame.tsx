import { useEffect, useRef } from 'react';
import type { Game as PhaserGameInstance } from 'phaser';
import { EventBus } from './EventBus';
import { startGame } from './main';

interface PhaserGameProps {
  onReady: () => void;
}

export function PhaserGame({ onReady }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    let mounted = true;
    const unsubscribeReady = EventBus.on('game:ready', () => {
      if (mounted) onReady();
    });
    const game: PhaserGameInstance = startGame(parent);

    return () => {
      mounted = false;
      unsubscribeReady();
      game.destroy(true);
      parent.replaceChildren();
    };
  }, [onReady]);

  return <div className="phaser-host" ref={containerRef} aria-label="Neon Word Runner game world" />;
}
