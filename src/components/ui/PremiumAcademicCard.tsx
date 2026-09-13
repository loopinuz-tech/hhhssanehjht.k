import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { rewriteStorageUrl } from "@/lib/storage";

interface PremiumAcademicCardProps {
  name: string;
  count: number;
  colorFrom: string;
  colorTo: string;
  imageUrl?: string;
  icon?: (props: { className?: string }) => React.ReactNode;
  onClick: () => void;
}

export const PremiumAcademicCard: React.FC<PremiumAcademicCardProps> = ({
  name,
  count,
  colorFrom,
  colorTo,
  imageUrl,
  onClick,
}) => {
  return (
    <motion.div
      onClick={onClick}
      className="relative group cursor-pointer overflow-hidden rounded-[32px] h-[180px] w-full transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`,
      }}
    >
      {/* Background Illustration */}
      <div className="absolute top-0 right-0 h-full w-1/2 overflow-hidden pointer-events-none">
        <img 
          src={rewriteStorageUrl(imageUrl || "/subject.png")} 
          alt="" 
          className="w-full h-full object-contain object-right opacity-80 transition-transform duration-700" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent opacity-50" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full p-8 flex flex-col justify-between z-10">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-white leading-tight drop-shadow-sm">
            {name}
          </h3>
          <p className="text-white/80 text-[13px] font-bold tracking-wide">
            {count} savol to'plami
          </p>
        </div>

        <div>
          <button className="h-10 px-6 bg-white rounded-full flex items-center gap-2 text-slate-900 text-[11px] font-black uppercase tracking-widest group/btn transition-all">
            <span>KIRISH</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 blur-[80px] rounded-full pointer-events-none" />
    </motion.div>
  );
};
