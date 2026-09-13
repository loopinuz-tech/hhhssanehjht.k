import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { WidgetAddIcon } from "@solar-icons/react/bold-duotone/widget-add";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { ChartSquareIcon } from "@solar-icons/react/bold-duotone/chart-square";
import { SettingsIcon } from "@solar-icons/react/bold-duotone/settings";
import { HamburgerMenuIcon } from "@solar-icons/react/bold-duotone/hamburger-menu";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { CalendarMarkIcon } from "@solar-icons/react/bold-duotone/calendar-mark";

interface BottomNavProps {
  isMobileMenuOpen: boolean;
  onToggleMenu: () => void;
  showHamburger?: boolean;
}

export default function BottomNav({ isMobileMenuOpen, onToggleMenu, showHamburger = true }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tabs = [
    { path: "/dashboard", icon: WidgetAddIcon, label: t("bottom_nav.home"), match: "/dashboard" },
    { path: "/tests", icon: BookBookmarkIcon, label: t("bottom_nav.tests"), match: "/tests" },
    { path: "/results", icon: ChartSquareIcon, label: t("bottom_nav.results"), match: "/results" },
    { path: "/profile", icon: SettingsIcon, label: t("bottom_nav.profile"), match: "/profile" },
  ];

  const isActive = (match: string) => location.pathname.startsWith(match);

  const isTestSession =
    location.pathname.startsWith("/tests/builder") ||
    location.pathname.includes("/mashq/") ||
    location.pathname.includes("/imtixon/") ||
    location.pathname.startsWith("/ai");

  if (isTestSession) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
      <div className="relative mx-0 mb-0 sm:mx-3 sm:mb-3">
        <div className="relative bg-white dark:bg-[#0A0A0A] rounded-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_20px_rgba(0,0,0,0.4)] border border-gray-200/60 dark:border-white/[0.06] backdrop-blur-xl overflow-visible">
          <div className="flex items-center justify-around h-[62px] px-2">
            {tabs.slice(0, 2).map((tab) => {
              const active = isActive(tab.match);
              return (
                <motion.button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-4 z-10"
                  whileTap={{ scale: 0.9 }}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-[#E8192C]/10 dark:bg-[#E8192C]/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div
                    animate={{
                      scale: active ? 1.08 : 1,
                      y: active ? -1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <tab.icon
                      size={25}
                      className={`transition-colors duration-200 ${
                        active
                          ? "text-[#E8192C]"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    />
                  </motion.div>
                  <span
                    className={`text-[11px] font-extrabold transition-colors duration-200 ${
                      active ? "text-[#E8192C]" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}

            {/* Center Menu Button */}
            {showHamburger && (
              <motion.button
                onClick={onToggleMenu}
                className="relative flex flex-col items-center justify-center z-20 -mt-6"
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E8192C] to-[#C41420] flex items-center justify-center p-2.5 shadow-lg shadow-[#E8192C]/30"
                  animate={{
                    rotate: isMobileMenuOpen ? 180 : 0,
                    scale: isMobileMenuOpen ? 0.95 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isMobileMenuOpen ? (
                      <CloseCircleIcon size={25} className="text-white" />
                    ) : (
                      <HamburgerMenuIcon size={25} className="text-white" />
                    )}
                  </motion.div>
                </motion.div>
                <span className="text-[11px] font-extrabold text-[#E8192C] mt-1">
                  {t("bottom_nav.menu")}
                </span>
              </motion.button>
            )}

            {tabs.slice(2).map((tab) => {
              const active = isActive(tab.match);
              return (
                <motion.button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-4 z-10"
                  whileTap={{ scale: 0.9 }}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-[#E8192C]/10 dark:bg-[#E8192C]/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div
                    animate={{
                      scale: active ? 1.08 : 1,
                      y: active ? -1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <tab.icon
                      size={25}
                      className={`transition-colors duration-200 ${
                        active
                          ? "text-[#E8192C]"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    />
                  </motion.div>
                  <span
                    className={`text-[11px] font-extrabold transition-colors duration-200 ${
                      active ? "text-[#E8192C]" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
