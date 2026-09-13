import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * LeafEntranceIntro
 *
 * Smooth, premium landing-page entrance animation sequence:
 * 0.0s         → Pure white screen (#FFFFFF)
 * 0.2s - 1.5s  → Large autumn leaf (barg.png) flies in from upper-right
 * 1.5s - 2.0s  → Leaf hovers in center, dominating the viewport
 * 2.0s - 4.5s  → Leaf slides/falls downward, clean leaf-wipe reveals landing page
 * 4.5s+        → Leaf exits bottom, landing page fully visible and interactive
 */
export interface LeafEntranceIntroProps {
  onIntroRevealStart?: () => void;
  onIntroComplete?: () => void;
}

export const LeafEntranceIntro: React.FC<LeafEntranceIntroProps> = ({
  onIntroRevealStart,
  onIntroComplete,
}) => {
  const [isFinished, setIsFinished] = useState(false);
  const curtainRef = useRef<HTMLDivElement>(null);
  const leafRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsFinished(true);
      onIntroRevealStart?.();
      onIntroComplete?.();
      return;
    }

    // Lock body scrolling during the intro sequence
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Preload image to ensure seamless frame-1 playback
    const img = new Image();
    img.src = "/barg.png";

    const startAnimation = () => {
      if (!curtainRef.current || !leafRef.current) return;

      const tl = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = originalOverflow;
          setIsFinished(true);
          onIntroComplete?.();
        },
      });
      timelineRef.current = tl;

      // Initial state: Pure white background, leaf positioned offscreen top-right
      gsap.set(leafRef.current, {
        x: "65vw",
        y: "-75vh",
        rotation: 36,
        scale: 0.68,
        opacity: 0,
        transformOrigin: "center center",
        force3D: true,
      });

      gsap.set(curtainRef.current, {
        clipPath: "inset(0% 0% 0% 0%)",
        backgroundColor: "#FFFFFF",
      });

      // 0.2s: Leaf opacity fades in as it enters the air stream
      tl.to(
        leafRef.current,
        {
          opacity: 1,
          duration: 0.15,
          ease: "power1.out",
        },
        0.2
      );

      // 0.2s -> 1.5s: Wind-blown entrance from upper-right into center
      tl.to(
        leafRef.current,
        {
          x: "0vw",
          y: "0vh",
          rotation: -4,
          scale: 1.0,
          duration: 1.3,
          ease: "power2.out",
        },
        0.2
      );

      // 1.5s -> 2.0s: Floating air-cushion hover in the center
      tl.to(
        leafRef.current,
        {
          x: "-1vw",
          y: "1.5vh",
          rotation: 3,
          scale: 1.025,
          duration: 0.5,
          ease: "sine.inOut",
        },
        1.5
      );

      // 2.0s -> 4.5s: Leaf glides and falls smoothly downward out of view
      tl.to(
        leafRef.current,
        {
          x: "1.5vw",
          y: "135vh",
          rotation: -12,
          scale: 0.98,
          duration: 2.5,
          ease: "power2.in",
        },
        2.0
      );

      // 2.0s -> 4.5s: White curtain wipes downward in lockstep with the falling leaf
      tl.to(
        curtainRef.current,
        {
          clipPath: "inset(100% 0% 0% 0%)",
          duration: 2.5,
          ease: "power2.in",
        },
        2.0
      );

      // At 2.2s (as the wipe reveals the top of the landing page), notify listeners
      tl.call(
        () => {
          onIntroRevealStart?.();
        },
        undefined,
        2.2
      );
    };

    if (img.complete) {
      startAnimation();
    } else {
      img.onload = startAnimation;
      img.onerror = startAnimation;
    }

    // Skip on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onIntroRevealStart?.();
        onIntroComplete?.();
        if (timelineRef.current) {
          timelineRef.current.progress(1);
        } else {
          setIsFinished(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [onIntroRevealStart, onIntroComplete]);

  if (isFinished) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] pointer-events-auto select-none overflow-hidden"
      onClick={() => {
        // Clicking anywhere allows instant skip to revealed page
        onIntroRevealStart?.();
        onIntroComplete?.();
        if (timelineRef.current) {
          timelineRef.current.progress(1);
        } else {
          setIsFinished(true);
        }
      }}
      aria-hidden="true"
    >
      {/* Pure White Background Curtain with Downward Wipe Transition */}
      <div
        ref={curtainRef}
        className="absolute inset-0 bg-white w-full h-full will-change-[clip-path]"
      />

      {/* Centered Large Leaf Layer */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          ref={leafRef}
          src="/barg.png"
          alt=""
          className="w-[90vmin] max-w-[960px] max-h-[88vh] object-contain select-none pointer-events-none will-change-transform"
          style={{
            filter: "drop-shadow(0 20px 35px rgba(0, 0, 0, 0.05))",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default LeafEntranceIntro;
