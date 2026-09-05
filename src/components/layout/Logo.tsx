interface LogoProps {
  collapsed?: boolean;
  className?: string;
  hideTextOnMobile?: boolean;
  variant?: "light" | "dark" | "black";
}

const Logo = ({ collapsed, className = "", hideTextOnMobile = false, variant = "dark" }: LogoProps) => {
  const getTextColor = () => {
    if (variant === "light") return "text-white";
    if (variant === "black") return "text-black dark:text-white";
    return "text-slate-900 dark:text-white font-extrabold";
  };

  return (
    <div className={`flex items-center group cursor-pointer ${collapsed ? "justify-center" : "gap-1.5 sm:gap-2"} ${className}`}>
      <img
        src="/logo.png"
        alt="EduContest"
        className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform duration-300 group-hover:scale-105 shrink-0"
      />
      {!collapsed && (
        <div className={`flex flex-col ${hideTextOnMobile ? "hidden xs:flex" : ""}`}>
          <span className={`font-extrabold text-base sm:text-lg leading-none tracking-tight ${getTextColor()}`}>
            EduContest
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
