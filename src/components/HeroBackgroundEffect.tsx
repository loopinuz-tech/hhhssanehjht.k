import { motion } from "framer-motion";
import { Star } from "lucide-react";
import ParticleBackground from "./ParticleBackground";

export default function HeroBackgroundEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">

      {/* 0. Constellation Node-Network Canvas (Pure Ambient Motion) */}
      <div className="absolute inset-0 z-0 opacity-80 dark:opacity-60 pointer-events-none">
        <ParticleBackground />
      </div>

      {/* 1. Subtle Tech Dot-Matrix Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.3] dark:opacity-[0.15] z-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(100, 116, 139, 0.28) 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* 2. Subtle Grid Lines Overlay */}
      <div
        className="absolute inset-0 opacity-[0.18] dark:opacity-[0.08] z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(148, 163, 184, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.15) 1px, transparent 1px)`,
          backgroundSize: '72px 72px'
        }}
      />

      {/* 3. Animated Glowing Ambient Mesh Orbs */}
      <motion.div
        animate={{
          x: [0, 60, -40, 50, 0],
          y: [0, -50, 30, -20, 0],
          scale: [1, 1.2, 0.9, 1.1, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full opacity-50 dark:opacity-30 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(232,25,44,0.18) 0%, rgba(232,25,44,0) 70%)",
          filter: "blur(90px)"
        }}
      />

      <motion.div
        animate={{
          x: [0, -80, 50, -40, 0],
          y: [0, 60, -50, 30, 0],
          scale: [1, 0.85, 1.15, 0.95, 1]
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-50 dark:opacity-25 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(2,132,199,0.16) 0%, rgba(2,132,199,0) 70%)",
          filter: "blur(100px)"
        }}
      />

      {/* 4. Sparkling Floating Glowing Stars */}
      {[
        { top: '15%', left: '25%', size: 16, delay: 0 },
        { top: '28%', right: '22%', size: 20, delay: 1.2 },
        { top: '65%', left: '10%', size: 14, delay: 2.4 },
        { top: '75%', right: '12%', size: 18, delay: 0.8 },
      ].map((star, idx) => (
        <motion.div
          key={idx}
          style={{ top: star.top, left: star.left, right: star.right }}
          animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.4, 0.9, 0.4], rotate: [0, 45, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: star.delay }}
          className="absolute pointer-events-none"
        >
          <Star className="text-amber-400 fill-amber-400/30 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" style={{ width: star.size, height: star.size }} />
        </motion.div>
      ))}

    </div>
  );
}
