import type { ReactNode, MouseEventHandler } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4 md:p-5",
  lg: "p-6 md:p-8",
};

export function Surface({
  children,
  className,
  interactive,
  onClick,
  padding = "md",
}: SurfaceProps) {
  const Comp = interactive ? motion.div : "div";
  const motionProps = interactive
    ? { whileHover: { y: -2 }, transition: { type: "spring", stiffness: 400, damping: 28 } }
    : {};

  return (
    <Comp
      {...motionProps}
      onClick={onClick}
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
        interactive && "cursor-pointer",
        paddingMap[padding],
        className
      )}
    >
      {children}
    </Comp>
  );
}
