import { useEffect, useRef } from "react";
import gsap from "gsap";

const TeacherAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const teacherRef = useRef<HTMLImageElement>(null);
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current || !teacherRef.current) return;

    const ctx = gsap.context(() => {
      // Floating animation for the teacher
      gsap.to(teacherRef.current, {
        y: -15,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      // Entry animation
      gsap.from(teacherRef.current, {
        x: 100,
        opacity: 0,
        duration: 1.2,
        ease: "back.out(1.7)",
      });

      // Animate extra elements (circles/blobs)
      elementsRef.current.forEach((el, index) => {
        if (!el) return;
        gsap.to(el, {
          x: "random(-20, 20)",
          y: "random(-20, 20)",
          duration: "random(2, 4)",
          repeat: -1,
          yoyo: true,
          ease: "none",
          delay: index * 0.5,
        });
        
        gsap.from(el, {
          scale: 0,
          opacity: 0,
          duration: 1,
          delay: 0.5 + index * 0.2,
          ease: "elastic.out(1, 0.5)",
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[320px] flex items-center justify-center overflow-visible">
      {/* Background Decorative Elements */}
      <div 
        ref={(el) => (elementsRef.current[0] = el)}
        className="absolute top-10 right-10 w-24 h-24 bg-blue-400/10 rounded-full blur-xl"
      />
      <div 
        ref={(el) => (elementsRef.current[1] = el)}
        className="absolute bottom-10 left-10 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl"
      />
      <div 
        ref={(el) => (elementsRef.current[2] = el)}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[100px]"
      />

      {/* Mini floating cards often seen in premium SaaS landing pages */}
      <div 
        ref={(el) => (elementsRef.current[3] = el)}
        className="absolute top-12 left-0 z-20 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-xl shadow-blue-500/10"
      >
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Pedagogika</p>
        <p className="text-xs font-bold text-slate-800 dark:text-white mt-1">100% Sifat</p>
      </div>

      <div 
        ref={(el) => (elementsRef.current[4] = el)}
        className="absolute bottom-12 right-0 z-20 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-xl shadow-purple-500/10"
      >
        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest leading-none">Attestatsiya</p>
        <p className="text-xs font-bold text-slate-800 dark:text-white mt-1">Tayyorlanish</p>
      </div>

      {/* Main Teacher Image */}
      <img
        ref={teacherRef}
        src="/teacher_avatar.png"
        alt="Teacher Animation"
        className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
      />
    </div>
  );
};

export default TeacherAnimation;
