import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  lineColor: string;
  alpha: number;
  pulseSpeed: number;
}

const PARTICLE_SPECS = [
  { color: "rgba(232, 25, 44, ", line: "rgba(232, 25, 44, " },   // Brand Red
  { color: "rgba(0, 136, 204, ", line: "rgba(0, 136, 204, " },   // Cyan
  { color: "rgba(124, 58, 237, ", line: "rgba(124, 58, 237, " }, // Deep Violet
  { color: "rgba(245, 158, 11, ", line: "rgba(245, 158, 11, " }, // Amber Gold
];

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = parent.clientWidth || window.innerWidth);
    let height = (canvas.height = parent.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !parent) return;
      width = canvas.width = parent.clientWidth || window.innerWidth;
      height = canvas.height = parent.clientHeight || 600;
    };

    window.addEventListener("resize", handleResize);

    // Mouse tracking active
    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Reduced particle count for a clean, subtle minimal look (25 to 42 particles max)
    const particleCount = Math.max(25, Math.min(Math.floor((width * height) / 38000), 42));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const spec = PARTICLE_SPECS[Math.floor(Math.random() * PARTICLE_SPECS.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 3 + 2, // 2px to 5px
        color: spec.color,
        lineColor: spec.line,
        alpha: Math.random() * 0.45 + 0.3,
        pulseSpeed: Math.random() * 0.015 + 0.005,
      });
    }

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw connecting mesh lines between nodes
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const lineAlpha = (1 - dist / 140) * 0.25;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `${particles[i].lineColor}${lineAlpha})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }
      }

      // 2. Particle motion & interactive mouse connection lines
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Container bounce
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Subtle pulse
        p.alpha += p.pulseSpeed;
        if (p.alpha > 0.85 || p.alpha < 0.25) p.pulseSpeed *= -1;

        // Mouse connection line
        const mdx = mouseX - p.x;
        const mdy = mouseY - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 150) {
          const mAlpha = (1 - mdist / 150) * 0.38;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(232, 25, 44, ${mAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.2, p.alpha)})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${p.color}0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block pointer-events-none"
    />
  );
}
