import { motion } from "framer-motion";
import type { ReactNode, MouseEventHandler } from "react";
import { cn } from "@/lib/utils";

type ContentCardProps = {
  children: ReactNode;
  className?: string;
  accentColor?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  footer?: ReactNode;
};

/** Premium interactive card — tests, courses, resources */
export function ContentCard({
  children,
  className,
  accentColor = "hsl(var(--primary))",
  onClick,
  footer,
}: ContentCardProps) {
  return (
    <motion.article
      layout
      whileHover={onClick ? { y: -3 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={onClick}
      className={cn(
        "platform-content-card group relative flex flex-col",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex-1">{children}</div>
      {footer && <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">{footer}</div>}
    </motion.article>
  );
}
