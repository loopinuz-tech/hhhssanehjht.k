import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Check } from "lucide-react";
import { useThemeCustomizer } from "@/components/ThemeCustomizerProvider";

const SKINS = [
  { id: "light" as const, label: "Light" },
  { id: "bordered" as const, label: "Bordered" },
  { id: "dark" as const, label: "Dark" },
  { id: "semi-dark" as const, label: "Semi Dark" },
];

const NAVBAR_COLORS = [
  { color: "#FFFFFF", label: "Oq" },
  { color: "#5B5FC7", label: "Binafsha" },
  { color: "#7B8794", label: "Kulrang" },
  { color: "#16A34A", label: "Yashil" },
  { color: "#C8001A", label: "Qizil" },
  { color: "#EA580C", label: "To'q sariq" },
  { color: "#06B6D4", label: "Ko'k" },
  { color: "#1E293B", label: "Qora" },
];

const NAVBAR_TYPES = [
  { id: "floating" as const, label: "Floating" },
  { id: "sticky" as const, label: "Sticky" },
  { id: "static" as const, label: "Static" },
  { id: "hidden" as const, label: "Hidden" },
];

const FOOTER_TYPES = [
  { id: "sticky" as const, label: "Sticky" },
  { id: "static" as const, label: "Static" },
  { id: "hidden" as const, label: "Hidden" },
];

const TRANSITIONS = [
  { id: "zoom" as const, label: "Zoom" },
  { id: "fade" as const, label: "Fade" },
  { id: "slide" as const, label: "Slide" },
  { id: "none" as const, label: "None" },
];

const RadioGroup = ({ options, value, onChange, columns = 2 }: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  columns?: number;
}) => (
  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
    {options.map((opt) => (
      <button
        key={opt.id}
        onClick={() => onChange(opt.id)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all ${
          value === opt.id
            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
        }`}
      >
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          value === opt.id ? "border-blue-500" : "border-slate-300 dark:border-slate-600"
        }`}>
          {value === opt.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
        </div>
        {opt.label}
      </button>
    ))}
  </div>
);

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">{title}</p>
    {children}
  </div>
);

export default function ThemeCustomizer() {
  const [open, setOpen] = useState(false);
  const ctx = useThemeCustomizer();

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-[9990] w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
      >
        <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {/* Backdrop + Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[320px] max-w-[90vw] bg-white dark:bg-slate-900 z-[9999] shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-extrabold text-blue-600 dark:text-blue-400">THEME CUSTOMIZER</h2>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Customize & Preview in Real Time</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-5 py-5">
                {/* Skin */}
                <Section title="Skin">
                  <RadioGroup
                    options={SKINS}
                    value={ctx.skin}
                    onChange={ctx.setSkin}
                    columns={2}
                  />
                </Section>

                {/* Content Width */}
                <Section title="Content Width">
                  <RadioGroup
                    options={[
                      { id: "full", label: "Full Width" },
                      { id: "boxed", label: "Boxed" },
                    ]}
                    value={ctx.contentWidth}
                    onChange={ctx.setContentWidth}
                    columns={2}
                  />
                </Section>

                {/* Router Transition */}
                <Section title="Router transition">
                  <div className="relative">
                    <select
                      value={ctx.routerTransition}
                      onChange={(e) => ctx.setRouterTransition(e.target.value as any)}
                      className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-colors"
                    >
                      {TRANSITIONS.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </Section>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-5" />

                {/* Menu toggles */}
                <div className="space-y-1">
                  <Toggle label="Menu Collapsed" checked={ctx.menuCollapsed} onChange={ctx.setMenuCollapsed} />
                  <Toggle label="Menu Hidden" checked={ctx.menuHidden} onChange={ctx.setMenuHidden} />
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-5" />

                {/* Navbar Color */}
                <Section title="Navbar Color">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {NAVBAR_COLORS.map((c) => (
                      <button
                        key={c.color}
                        onClick={() => ctx.setNavbarColor(c.color)}
                        className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${
                          ctx.navbarColor === c.color
                            ? "border-blue-500 scale-110"
                            : "border-slate-200 dark:border-slate-700 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      >
                        {ctx.navbarColor === c.color && (
                          <Check className="w-4 h-4" style={{ color: c.color === "#FFFFFF" || c.color === "#06B6D4" ? "#333" : "#fff" }} />
                        )}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Navbar Type */}
                <Section title="Navbar Type">
                  <RadioGroup
                    options={NAVBAR_TYPES}
                    value={ctx.navbarType}
                    onChange={ctx.setNavbarType}
                    columns={2}
                  />
                </Section>

                {/* Footer Type */}
                <Section title="Footer Type">
                  <RadioGroup
                    options={FOOTER_TYPES}
                    value={ctx.footerType}
                    onChange={ctx.setFooterType}
                    columns={3}
                  />
                </Section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
