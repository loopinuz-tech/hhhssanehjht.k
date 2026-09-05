import { 
  LayoutDashboard, BookOpen, AlertTriangle, 
  CalendarCheck, FolderOpen, Target, Sparkles,
  Swords, Brain, Zap, Shield, Microscope,
  Trophy, Ghost, Lightbulb, Compass, Command as LucideCommand,
  Rocket, Trees, Leaf, Moon
} from 'lucide-react';

export interface VibeConfig {
  id: string;
  name: string;
  labels: {
    dashboard: string;
    mockTests: string;
    questionBank: string;
    vocabulary: string;
    errors: string;
    planner: string;
    materials: string;
    vibe: string;
    profile: string;
  };
  icons: {
    dashboard: any;
    mockTests: any;
    questionBank: any;
    vocabulary: any;
    errors: any;
    planner: any;
    materials: any;
    vibe: any;
    profile: any;
  };
  colors?: {
    primary: string;
    accent: string;
  }
}

export const VIBES: Record<string, VibeConfig> = {
  default: {
    id: 'default',
    name: 'Akademik Standart',
    labels: {
      dashboard: 'Asosiy Sahifa',
      mockTests: 'Mock Testlar',
      questionBank: 'Savollar Bazasi',
      vocabulary: 'Lug\'at Boyligi',
      errors: 'Natijalar va Tahlil',
      planner: 'Kunlik Reja',
      materials: 'Materiallar',
      vibe: 'Vibe Board',
      profile: 'Profil'
    },
    icons: {
      dashboard: LayoutDashboard,
      mockTests: BookOpen,
      questionBank: Target,
      vocabulary: BookOpen,
      errors: Trophy, // Changed to Trophy for Natijalar
      planner: CalendarCheck,
      materials: FolderOpen,
      vibe: Sparkles,
      profile: Target
    }
  },
  chess: {
    id: 'chess',
    name: 'Grandmaster (Shaxmat)',
    labels: {
      dashboard: 'Strategiya Markazi',
      mockTests: 'Death Match',
      questionBank: 'Arsenal',
      vocabulary: 'Opening Gambits',
      errors: 'Yurishlar Tahlili',
      planner: 'Tournament Prep',
      materials: 'Arxivlar',
      vibe: 'Grandmaster Vibe',
      profile: 'Qirollik Maqomi'
    },
    icons: {
      dashboard: Swords,
      mockTests: Trophy,
      questionBank: Shield,
      vocabulary: BookOpen,
      errors: Trophy, // Results/Analytics icon
      planner: CalendarCheck,
      materials: FolderOpen,
      vibe: Sparkles,
      profile: Target
    }
  },
  zen: {
    id: 'zen',
    name: 'Zen Minimalizmi',
    labels: {
      dashboard: 'Focus',
      mockTests: 'Mashqlar',
      questionBank: 'Omborxona',
      vocabulary: 'So\'zlar',
      errors: 'Natijalar',
      planner: 'Flow (Oqim)',
      materials: 'Arxiv',
      vibe: 'Aura',
      profile: 'Men'
    },
    icons: {
      dashboard: LayoutDashboard,
      mockTests: BookOpen,
      questionBank: Lightbulb,
      vocabulary: BookOpen,
      errors: Trophy,
      planner: CalendarCheck,
      materials: FolderOpen,
      vibe: Sparkles,
      profile: Target
    }
  },
  cyber: {
    id: 'cyber',
    name: 'Kiberpank (Cyber)',
    labels: {
      dashboard: 'Mainframe',
      mockTests: 'Neural Sync',
      questionBank: 'Core Data',
      vocabulary: 'Data Nodes',
      errors: 'Tizim Tahlili',
      planner: 'Ijro (Execution)',
      materials: 'Resurslar',
      vibe: 'Glow Up',
      profile: 'Avatar'
    },
    icons: {
      dashboard: Zap,
      mockTests: Microscope,
      questionBank: LucideCommand,
      vocabulary: BookOpen,
      errors: Trophy,
      planner: CalendarCheck,
      materials: FolderOpen,
      vibe: Sparkles,
      profile: Target
    }
  },
  royal: {
    id: 'royal',
    name: 'Royal Heritage',
    labels: {
      dashboard: 'Palace',
      mockTests: 'Grand Trial',
      questionBank: 'Royal Codex',
      vocabulary: 'Scriptorium',
      errors: 'Royal Scribe',
      planner: 'Edict',
      materials: 'Library',
      vibe: 'Legacy',
      profile: 'Honor'
    },
    icons: {
      dashboard: Shield,
      mockTests: BookOpen,
      questionBank: Trophy,
      vocabulary: BookOpen,
      errors: AlertTriangle,
      planner: FolderOpen,
      materials: FolderOpen,
      vibe: Sparkles,
      profile: Target
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Deep Sea',
    labels: {
      dashboard: 'Abyss',
      mockTests: 'Deep Dive',
      questionBank: 'Oceanic Logs',
      vocabulary: 'Coral Knowledge',
      errors: 'Wave Correction',
      planner: 'Tide Schedule',
      materials: 'Sunken Vault',
      vibe: 'Surface',
      profile: 'Diver'
    },
    icons: {
      dashboard: Compass,
      mockTests: BookOpen,
      questionBank: Zap,
      vocabulary: BookOpen,
      errors: AlertTriangle,
      planner: CalendarCheck,
      materials: FolderOpen,
      vibe: Sparkles,
      profile: Target
    }
  },
  mars: {
    id: 'mars',
    name: 'Mars Explorer',
    labels: {
      dashboard: 'Base Station',
      mockTests: 'Survival Test',
      questionBank: 'Rover Data',
      vocabulary: 'Alien Lexicon',
      errors: 'System Repair',
      planner: 'Mission Log',
      materials: 'Cargo Bay',
      vibe: 'Atmosphere',
      profile: 'Astronaut'
    },
    icons: {
      dashboard: Rocket,
      mockTests: Target,
      questionBank: Zap,
      vocabulary: BookOpen,
      errors: AlertTriangle,
      planner: CalendarCheck,
      materials: FolderOpen,
      vibe: Sparkles,
      profile: Target
    }
  },
  forest: {
    id: 'forest',
    name: 'Deep Forest',
    labels: {
      dashboard: 'The Clearing',
      mockTests: 'Hunt',
      questionBank: 'Roots',
      vocabulary: 'Spells',
      errors: 'Thorns',
      planner: 'Growth',
      materials: 'Leaves',
      vibe: 'Nature',
      profile: 'Druid'
    },
    icons: {
      dashboard: Trees,
      mockTests: BookOpen,
      questionBank: Leaf,
      vocabulary: BookOpen,
      errors: AlertTriangle,
      planner: CalendarCheck,
      materials: FolderOpen,
      vibe: Sparkles,
      profile: Target
    }
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight OLED',
    labels: {
      dashboard: 'The Void',
      mockTests: 'Eclipse',
      questionBank: 'Stars',
      vocabulary: 'Lunar Code',
      errors: 'Shadows',
      planner: 'Nightfall',
      materials: 'Nebula',
      vibe: 'Space',
      profile: 'Stargazer'
    },
    icons: {
      dashboard: Moon,
      mockTests: Zap,
      questionBank: Sparkles,
      vocabulary: BookOpen,
      errors: AlertTriangle,
      planner: CalendarCheck,
      materials: FolderOpen,
      vibe: Sparkles,
      profile: Target
    }
  }
};
