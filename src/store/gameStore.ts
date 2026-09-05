import { create } from 'zustand';
import { soundManager } from '@/lib/soundManager';

export interface VocabWord {
  id: string;
  word: string;
  meaning: string;
  memory_level?: number;
  learned?: boolean;
}

export interface GateData {
  id: string;
  lane: number; // 0: Left (-4.8), 1: Center (0), 2: Right (+4.8)
  text: string;
  isCorrect: boolean;
  isClosedWall?: boolean; // Closed barrier for non-gate lanes (no open lane cheating)
}

export interface HurdlePos {
  lane: number;
  z: number;
  hasArc: boolean;
}

export interface ParticleBurstEvent {
  id: number;
  x: number;
  y: number;
  z: number;
  color: string;
}

export type TimeOfDayMode = 'auto' | 'day' | 'sunset' | 'night';

export interface GameState {
  // Word & Queue State
  currentWord: VocabWord | null;
  wordQueue: VocabWord[];
  gates: GateData[];
  gateZ: number; // Current Z coordinate of approaching gate (-90 to 0)
  activeHurdles: HurdlePos[]; // Synced hurdle positions for 100% aligned mid-air coin arcs

  // Runner & Gameplay Stats
  lives: number;
  streak: number;
  distance: number;
  coins: number;
  speed: number;
  baseSpeed: number;
  speedMultiplier: number;
  status: 'playing' | 'paused' | 'gameover';
  timeOfDayMode: TimeOfDayMode; // 'auto', 'day', 'sunset', 'night'
  isFocusMode: boolean; // Clean minimalistic view toggle (hides decorative city buildings/trees)

  // Feedback, Player position & FX
  playerLane: number; // 0, 1, 2
  isJumping: boolean;
  isStumbling: boolean;
  heartDamaged: boolean;
  selectedLane: number | null;
  feedbackState: 'correct' | 'wrong' | null;
  particleBursts: ParticleBurstEvent[];
  correctCount: number;
  totalAnswered: number;
  soundEnabled: boolean;
  isShieldActive: boolean;
  shieldCount: number;
  magnetCount: number;
  isMagnetActive: boolean;
  magnetTimeRemaining: number;
  streakBonusAlert: string | null;

  // Actions
  initGame: (words: VocabWord[]) => void;
  setPlayerLane: (lane: number) => void;
  moveLeft: () => void;
  moveRight: () => void;
  setGateZ: (z: number) => void;
  setActiveHurdles: (hurdles: HurdlePos[]) => void;
  triggerJump: () => void;
  takeObstacleDamage: () => void;
  evaluateCollision: (lane: number) => void;
  nextQuestion: () => void;
  setSpeedMultiplier: (multiplier: number) => void;
  togglePause: () => void;
  toggleSound: () => void;
  toggleTimeOfDayMode: () => void;
  toggleFocusMode: () => void;
  restart: () => void;
  activateMagnet: () => void;
  updateMagnetTimer: (delta: number) => void;
  updateDistanceAndCoins: (deltaDist: number, addCoins?: number) => void;
  triggerParticleBurst: (x: number, y: number, z: number, color?: string) => void;
}

const DEFAULT_SAMPLE_WORDS: VocabWord[] = [
  { id: '1', word: 'happy', meaning: 'baxtli', memory_level: 1 },
  { id: '2', word: 'brave', meaning: 'jasur', memory_level: 2 },
  { id: '3', word: 'curious', meaning: 'qiziquvchan', memory_level: 1 },
  { id: '4', word: 'strong', meaning: 'kuchli', memory_level: 3 },
  { id: '5', word: 'ambitious', meaning: 'intiluvchan', memory_level: 1 },
  { id: '6', word: 'generous', meaning: 'saxiy', memory_level: 2 },
  { id: '7', word: 'reluctant', meaning: 'ikkilanuvchan', memory_level: 0 },
  { id: '8', word: 'persevere', meaning: 'matonat ko\'rsatmoq', memory_level: 1 },
  { id: '9', word: 'efficient', meaning: 'samarali', memory_level: 2 },
  { id: '10', word: 'meticulous', meaning: 'sinchkov', memory_level: 0 },
  { id: '11', word: 'patient', meaning: 'sabrli', memory_level: 3 },
  { id: '12', word: 'honest', meaning: 'halol, ro\'stgo\'y', memory_level: 2 },
];

const LANE_X = [-4.8, 0, 4.8];

// Generate gates for all 3 lanes
const generateGates = (targetWord: VocabWord, pool: VocabWord[]): GateData[] => {
  const targetMeaning = targetWord.meaning.split('—')[0].trim();
  const others = pool.filter(w => w.id !== targetWord.id);
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

  const wrongOpt1 = shuffledOthers[0] ? shuffledOthers[0].meaning.split('—')[0].trim() : 'boshqa ma\'no';
  const wrongOpt2 = shuffledOthers[1] ? shuffledOthers[1].meaning.split('—')[0].trim() : 'farqli so\'z';

  const numGates = Math.random() < 0.45 ? 2 : 3;
  const availableLanes = [0, 1, 2].sort(() => Math.random() - 0.5);

  const chosenLanes = availableLanes.slice(0, numGates);
  const correctLane = chosenLanes[Math.floor(Math.random() * chosenLanes.length)];

  const gates: GateData[] = [];
  let wrongIdx = 0;
  const wrongArr = [wrongOpt1, wrongOpt2];

  for (let lane = 0; lane < 3; lane++) {
    if (chosenLanes.includes(lane)) {
      if (lane === correctLane) {
        gates.push({
          id: `gate-${lane}-${Date.now()}`,
          lane,
          text: targetMeaning,
          isCorrect: true
        });
      } else {
        gates.push({
          id: `gate-${lane}-${Date.now()}`,
          lane,
          text: wrongArr[wrongIdx] || 'noto\'g\'ri',
          isCorrect: false
        });
        wrongIdx++;
      }
    } else {
      gates.push({
        id: `gate-closed-${lane}-${Date.now()}`,
        lane,
        text: '🚫 YO\'L YOPILGAN',
        isCorrect: false,
        isClosedWall: true
      });
    }
  }

  return gates;
};

export const useGameStore = create<GameState>((set, get) => ({
  currentWord: null,
  wordQueue: [],
  gates: [],
  gateZ: -90,
  activeHurdles: [],
  lives: 3,
  streak: 0,
  distance: 0,
  coins: 0,
  speed: 12,
  baseSpeed: 12,
  speedMultiplier: 1.0,
  status: 'playing',
  timeOfDayMode: 'auto',
  isFocusMode: false,
  playerLane: 1,
  isJumping: false,
  isStumbling: false,
  heartDamaged: false,
  selectedLane: null,
  feedbackState: null,
  particleBursts: [],
  correctCount: 0,
  totalAnswered: 0,
  soundEnabled: true,
  isShieldActive: true,
  shieldCount: 1,
  magnetCount: 1,
  isMagnetActive: false,
  magnetTimeRemaining: 0,
  streakBonusAlert: null,

  initGame: (words: VocabWord[]) => {
    const queue = (words && words.length >= 3) ? words : DEFAULT_SAMPLE_WORDS;
    const firstWord = queue[Math.floor(Math.random() * queue.length)];
    const gates = generateGates(firstWord, queue);

    soundManager.speakWord(firstWord.word);

    set({
      wordQueue: queue,
      currentWord: firstWord,
      gates,
      gateZ: -50,
      activeHurdles: [],
      lives: 3,
      streak: 0,
      distance: 0,
      coins: 0,
      speed: 12,
      baseSpeed: 12,
      speedMultiplier: 1.0,
      status: 'playing',
      playerLane: 1,
      isJumping: false,
      isStumbling: false,
      heartDamaged: false,
      selectedLane: null,
      feedbackState: null,
      particleBursts: [],
      correctCount: 0,
      totalAnswered: 0,
      shieldCount: 1,
      magnetCount: 1,
      isMagnetActive: false,
      magnetTimeRemaining: 0,
      streakBonusAlert: null
    });
  },

  setPlayerLane: (lane: number) => {
    const bounded = Math.max(0, Math.min(2, lane));
    soundManager.playSwipe();
    set({ playerLane: bounded });
  },

  moveLeft: () => {
    set(s => {
      const nextLane = Math.max(0, s.playerLane - 1);
      if (s.playerLane !== nextLane) {
        soundManager.playSwipe();
      }
      return { playerLane: nextLane };
    });
  },

  moveRight: () => {
    set(s => {
      const nextLane = Math.min(2, s.playerLane + 1);
      if (s.playerLane !== nextLane) {
        soundManager.playSwipe();
      }
      return { playerLane: nextLane };
    });
  },

  setGateZ: (z: number) => {
    set({ gateZ: z });
  },

  setActiveHurdles: (hurdles: HurdlePos[]) => {
    set({ activeHurdles: hurdles });
  },

  triggerJump: () => {
    if (get().isJumping || get().status !== 'playing') return;
    soundManager.playJump();
    set({ isJumping: true });
    setTimeout(() => {
      set({ isJumping: false });
    }, 650);
  },

  takeObstacleDamage: () => {
    const state = get();
    if (state.status !== 'playing') return;

    soundManager.playWrongGate();

    if (state.shieldCount > 0) {
      set({ shieldCount: state.shieldCount - 1, heartDamaged: true, isStumbling: true });
    } else {
      const nextLives = state.lives - 1;
      set({ lives: nextLives, streak: 0, heartDamaged: true, isStumbling: true });
      if (nextLives <= 0) {
        setTimeout(() => {
          set({ status: 'gameover' });
        }, 500);
      }
    }

    setTimeout(() => {
      set({ heartDamaged: false, isStumbling: false });
    }, 800);
  },

  triggerParticleBurst: (x: number, y: number, z: number, color: string = '#10b981') => {
    const newEvent: ParticleBurstEvent = {
      id: Date.now() + Math.random(),
      x, y, z, color
    };
    set(s => ({
      particleBursts: [...s.particleBursts.slice(-4), newEvent]
    }));
  },

  evaluateCollision: (lane: number) => {
    const state = get();
    if (state.feedbackState !== null || state.status !== 'playing') return;

    const gateHit = state.gates.find(g => g.lane === lane);
    const isCorrect = gateHit ? gateHit.isCorrect : false;

    set({ selectedLane: lane, totalAnswered: state.totalAnswered + 1 });

    const gateX = LANE_X[lane];
    const gateZ = state.gateZ;

    if (isCorrect) {
      soundManager.playCorrectGate();
      get().triggerParticleBurst(gateX, 3.2, gateZ, '#10b981');

      const newStreak = state.streak + 1;
      const newCorrect = state.correctCount + 1;
      const distBonus = 60 * Math.min(newStreak, 5);

      if (state.currentWord) {
        soundManager.speakWord(state.currentWord.word);
      }

      let nextMagnetCount = state.magnetCount;
      let alertMsg = state.streakBonusAlert;
      if (newStreak > 0 && newStreak % 3 === 0) {
        nextMagnetCount += 1;
        alertMsg = `🧲 STREAK ${newStreak}x! +1 MAGNIT QO'SHILDI!`;
        setTimeout(() => {
          set({ streakBonusAlert: null });
        }, 2500);
      }

      set({
        feedbackState: 'correct',
        streak: newStreak,
        correctCount: newCorrect,
        distance: state.distance + distBonus,
        coins: state.coins + 10,
        magnetCount: nextMagnetCount,
        streakBonusAlert: alertMsg
      });

      setTimeout(() => {
        get().nextQuestion();
      }, 900);

    } else {
      soundManager.playWrongGate();
      get().triggerParticleBurst(gateX, 3.2, gateZ, '#f43f5e');

      if (state.shieldCount > 0) {
        set({
          feedbackState: 'wrong',
          shieldCount: state.shieldCount - 1,
          streak: 0,
          heartDamaged: true,
          isStumbling: true
        });

        setTimeout(() => {
          get().nextQuestion();
          set({ heartDamaged: false, isStumbling: false });
        }, 1100);
      } else {
        const nextLives = state.lives - 1;
        set({
          feedbackState: 'wrong',
          lives: nextLives,
          streak: 0,
          heartDamaged: true,
          isStumbling: true
        });

        if (nextLives <= 0) {
          setTimeout(() => {
            set({ status: 'gameover' });
          }, 700);
        } else {
          setTimeout(() => {
            get().nextQuestion();
            set({ heartDamaged: false, isStumbling: false });
          }, 1000);
        }
      }
    }
  },

  nextQuestion: () => {
    const state = get();
    const remaining = state.wordQueue.filter(w => w.id !== state.currentWord?.id);
    const next = remaining[Math.floor(Math.random() * remaining.length)] || state.wordQueue[0];
    const gates = generateGates(next, state.wordQueue);

    soundManager.speakWord(next.word);

    set({
      currentWord: next,
      gates,
      gateZ: -90,
      feedbackState: null,
      selectedLane: null
    });
  },

  setSpeedMultiplier: (mult: number) => {
    set({ speedMultiplier: mult });
  },

  togglePause: () => {
    const status = get().status;
    if (status === 'playing') {
      soundManager.stopBgMusic();
      set({ status: 'paused' });
    } else if (status === 'paused') {
      soundManager.playBgMusic();
      set({ status: 'playing' });
    }
  },

  toggleSound: () => {
    const nextSound = !get().soundEnabled;
    soundManager.setMute(!nextSound);
    set({ soundEnabled: nextSound });
  },

  toggleTimeOfDayMode: () => {
    const modes: TimeOfDayMode[] = ['auto', 'day', 'sunset', 'night'];
    const current = get().timeOfDayMode;
    const nextIdx = (modes.indexOf(current) + 1) % modes.length;
    set({ timeOfDayMode: modes[nextIdx] });
  },

  toggleFocusMode: () => {
    set(s => ({ isFocusMode: !s.isFocusMode }));
  },

  updateDistanceAndCoins: (deltaDist: number, addCoins = 0) => {
    if (addCoins > 0) {
      soundManager.playCoin();
    }
    set(s => {
      const newDistance = s.distance + deltaDist;
      const dynamicSpeed = Math.min(24, s.baseSpeed + (newDistance / 100) * 0.15);
      return {
        distance: newDistance,
        coins: s.coins + addCoins,
        speed: dynamicSpeed
      };
    });
  },

  activateMagnet: () => {
    const state = get();
    if (state.magnetCount > 0 && !state.isMagnetActive && state.status === 'playing') {
      set({
        magnetCount: state.magnetCount - 1,
        isMagnetActive: true,
        magnetTimeRemaining: 10.0
      });
    }
  },

  updateMagnetTimer: (delta: number) => {
    const state = get();
    if (!state.isMagnetActive || state.status !== 'playing') return;

    const remaining = state.magnetTimeRemaining - delta;
    if (remaining <= 0) {
      set({ isMagnetActive: false, magnetTimeRemaining: 0 });
    } else {
      set({ magnetTimeRemaining: remaining });
    }
  },

  restart: () => {
    const state = get();
    soundManager.playBgMusic();
    state.initGame(state.wordQueue);
  }
}));
