import React, { useEffect } from 'react';
import GameCanvas from '@/components/game/GameCanvas';
import HUD from '@/components/game/HUD';
import { useGameStore, VocabWord } from '@/store/gameStore';
import { soundManager } from '@/lib/soundManager';

interface Props {
  words: VocabWord[];
  onBack: () => void;
  onUpdateMemory?: (id: string, correct: boolean, currentLevel: number) => void;
}

export default function VocabRunnerGame({ words, onBack }: Props) {
  const initGame = useGameStore(s => s.initGame);
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const status = useGameStore(s => s.status);

  useEffect(() => {
    // Immediately initialize game words, gates and audio
    initGame(words);
    soundManager.initBgMusic('/Neon Sprint.mp3');
    soundManager.setMute(!soundEnabled);
    soundManager.playBgMusic();

    return () => {
      soundManager.stopBgMusic();
    };
  }, [words, initGame]);

  // Update soundManager volume according to soundEnabled state and game status
  useEffect(() => {
    soundManager.setMute(!soundEnabled || status === 'paused' || status === 'gameover');
  }, [soundEnabled, status]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-950 select-none z-50">
      {/* 3D WebGL Canvas Viewport - 100% Full Bleed */}
      <GameCanvas />

      {/* 2D HUD & Control Overlay - Positioned Directly On Top */}
      <HUD onBack={onBack} />
    </div>
  );
}
