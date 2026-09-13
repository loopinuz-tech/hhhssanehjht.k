import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GlobalIcon } from "@solar-icons/react/bold-duotone/global";

interface LanguageSwitcherProps {
  isNavbarDark?: boolean;
}

const LanguageSwitcher = ({ isNavbarDark = false }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('appLang', lng);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-2 rounded-lg sm:rounded-xl transition-all cursor-pointer outline-none border border-transparent ${
            isNavbarDark 
              ? "text-white/80 hover:text-white hover:bg-white/10" 
              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-200 dark:hover:border-white/10"
          }`}
          title="Tilni o'zgartirish"
        >
          <GlobalIcon size={17} className="shrink-0 text-[#E8192C] sm:hidden" />
          <GlobalIcon size={22} className="shrink-0 text-[#E8192C] hidden sm:block" />
          <span className="text-[11px] sm:text-[13px] font-extrabold uppercase tracking-wide">{i18n.language}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1419] shadow-xl z-[250]" align="end" sideOffset={6}>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => changeLanguage('uz')}
            className={`px-3.5 py-2.5 text-left text-[13px] font-extrabold rounded-xl transition-colors ${
              i18n.language === 'uz' 
                ? 'text-[#E8192C] bg-red-50 dark:bg-red-500/10' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            O'zbek
          </button>
          <button
            onClick={() => changeLanguage('ru')}
            className={`px-3.5 py-2.5 text-left text-[13px] font-extrabold rounded-xl transition-colors ${
              i18n.language === 'ru' 
                ? 'text-[#E8192C] bg-red-50 dark:bg-red-500/10' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            Русский
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={`px-3.5 py-2.5 text-left text-[13px] font-extrabold rounded-xl transition-colors ${
              i18n.language === 'en' 
                ? 'text-[#E8192C] bg-red-50 dark:bg-red-500/10' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            English
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSwitcher;
