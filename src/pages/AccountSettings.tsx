import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { Link, useParams, useNavigate } from "react-router-dom";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { CameraIcon } from "@solar-icons/react/bold-duotone/camera";
import { ShieldIcon } from "@solar-icons/react/bold-duotone/shield";
import { LockIcon } from "@solar-icons/react/bold-duotone/lock";
import { BellIcon } from "@solar-icons/react/bold-duotone/bell";
import { HelpIcon } from "@solar-icons/react/bold-duotone/help";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { StarIcon } from "@solar-icons/react/bold-duotone/star";
import { WalletIcon } from "@solar-icons/react/bold-duotone/wallet";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { SettingsIcon } from "@solar-icons/react/bold-duotone/settings";
import { ArrowRightUpIcon } from "@solar-icons/react/bold-duotone/arrow-right-up";
import { ArrowLeftDownIcon } from "@solar-icons/react/bold-duotone/arrow-left-down";
import { AddSquareIcon } from "@solar-icons/react/bold-duotone/add-square";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { EyeClosedIcon } from "@solar-icons/react/bold-duotone/eye-closed";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { DisketteIcon as SaveIcon } from "@solar-icons/react/bold-duotone/diskette";
import { CardIcon as CreditCardIcon } from "@solar-icons/react/bold-duotone/card";
import { RocketIcon as LogicalMergeIcon } from "@solar-icons/react/bold-duotone/rocket";
import { HistoryIcon } from "@solar-icons/react/bold-duotone/history";
import { LogoutIcon } from "@solar-icons/react/bold-duotone/logout";
import { ShieldWarningIcon } from "@solar-icons/react/bold-duotone/shield-warning";
import { SquareAcademicCapIcon as GraduationCapIcon } from "@solar-icons/react/bold-duotone/square-academic-cap";
import { Book2Icon } from "@solar-icons/react/bold-duotone/book-2";
import { UserIdIcon as FingerprintIcon } from "@solar-icons/react/bold-duotone/user-id";
import { GlobeIcon } from "@solar-icons/react/bold-duotone/globe";
import { MedalStarIcon as AwardIcon } from "@solar-icons/react/bold-duotone/medal-star";
import { TicketIcon } from "@solar-icons/react/bold-duotone/ticket";
import { SmartphoneIcon } from "@solar-icons/react/bold-duotone/smartphone";
import { Menu, X } from "lucide-react";
import { SendSquareIcon as SendIcon } from "@solar-icons/react/bold-duotone/send-square";
import { LetterIcon as MailIcon } from "@solar-icons/react/bold-duotone/letter";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { CupIcon } from "@solar-icons/react/bold-duotone/cup";
import { ShieldCheckIcon } from "@solar-icons/react/bold-duotone/shield-check";
import { CardIcon as SolarCardIcon } from "@solar-icons/react/bold-duotone/card";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { UserIdIcon } from "@solar-icons/react/bold-duotone/user-id";
import { CameraMinimalisticIcon } from "@solar-icons/react/bold-duotone/camera-minimalistic";
import { LetterIcon } from "@solar-icons/react/bold-duotone/letter";
import { PhoneIcon } from "@solar-icons/react/bold-duotone/phone";
import { CalendarIcon } from "@solar-icons/react/bold-duotone/calendar";
import { DisketteIcon } from "@solar-icons/react/bold-duotone/diskette";
import { GlobalIcon } from "@solar-icons/react/bold-duotone/global";
import ReferralSection from "@/components/ReferralSection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PaymentModal } from "@/components/PaymentModal";
import { CardLinkingModal } from "@/components/CardLinkingModal";
import { TelegramAdminCard } from "@/components/TelegramAdminCard";
import { ArrowUpRight, Send, Copy, Check } from "lucide-react";
import SEO from "@/components/SEO";
import { getStoragePublicUrl } from "@/lib/storage";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";

const RED = "#E8192C";

type SectionId = "profil" | "obuna" | "hamyon" | "bildirishnoma" | "referal";

const sectionAccents: Record<string, { color: string; bg: string }> = {
  profil: { color: "#E8192C", bg: "rgba(232, 25, 44, 0.1)" },
  obuna: { color: "#7c3aed", bg: "rgba(124, 58, 237, 0.1)" },
  hamyon: { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
  bildirishnoma: { color: "#0891b2", bg: "rgba(8, 145, 178, 0.1)" },
  referal: { color: "#db2777", bg: "rgba(219, 39, 119, 0.1)" },
};

const useNav = () => {
  const { t } = useTranslation();
  return [
    { id: "profil" as SectionId, label: t("settings.sections.profil.label", "Shaxsiy profil"), icon: UserIcon, description: t("settings.sections.profil.desc", "Profil, xavfsizlik va platforma qoidalari") },
    { id: "obuna" as SectionId, label: t("settings.sections.obuna.label", "Obunalar"), icon: UserIdIcon, description: t("settings.sections.obuna.desc", "Tariflar va obuna boshqaruvi") },
    { id: "hamyon" as SectionId, label: t("settings.sections.hamyon.label", "Moliya markazi"), icon: WalletIcon, description: t("settings.sections.hamyon.desc", "To'lovlar va tranzaksiyalar") },
    { id: "bildirishnoma" as SectionId, label: t("settings.sections.bildirishnoma.label", "Ogohlantirishlar"), icon: BellIcon, description: t("settings.sections.bildirishnoma.desc", "Bildirishnoma sozlamalari") },
    { id: "referal" as SectionId, label: t("settings.sections.referal.label", "Do'stlarim"), icon: UsersGroupTwoRoundedIcon, description: t("settings.sections.referal.desc", "Do'stlarni taklif qiling va bepul Premium yutib oling") },
  ];
};

export default function AccountSettings() {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const [active, setActive] = useState<SectionId>((tab as SectionId) || "profil");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const NAV = useNav();

  useEffect(() => {
    if (tab && NAV.find(n => n.id === tab)) {
      setActive(tab as SectionId);
    }
  }, [tab]);

  const handleSetActive = (id: SectionId) => {
    setActive(id);
    setMobileMenuOpen(false);
    navigate(`/settings/${id}`);
  };

  const activeItem = NAV.find(n => n.id === active) || NAV[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 w-full overflow-x-hidden">
      <SEO title={t('settings.title')} description="EduContest - Sozlamalar" />

      <div className="flex min-h-screen w-full">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden md:flex flex-col w-[260px] shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] sticky top-[56px] overflow-hidden select-none">

          {/* Sidebar header */}
          <div className="px-5 pt-5 pb-4 shrink-0 border-b border-slate-100 dark:border-slate-800/60">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('settings.title', 'SOZLAMALAR')}</p>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
            {NAV.map((item) => {
              const isActive = active === item.id;
              const accent = sectionAccents[item.id] || { color: RED, bg: "#fff0f0" };
              const IconComponent = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSetActive(item.id as SectionId)}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors group relative ${
                    isActive
                      ? 'bg-slate-50 dark:bg-slate-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-[0.5px] rounded-full" style={{ background: accent.color }} />
                  )}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? '' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                  }`}
                    style={isActive ? { background: accent.bg } : {}}
                  >
                    {IconComponent && (
                      <IconComponent
                        size={18}
                        className={`shrink-0 ${
                          isActive ? '' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`}
                        style={isActive ? { color: accent.color } : {}}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[13px] font-medium leading-tight capitalize ${
                      isActive ? '' : 'text-slate-600 dark:text-slate-400'
                    }`}
                      style={isActive ? { color: accent.color } : {}}>
                      {item.label}
                    </p>
                    <p className={`text-[11px] mt-0.5 leading-tight font-medium ${
                      isActive ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Help box - raised 50px higher from the bottom */}
          <div className="p-3 pb-[52px] shrink-0 border-t border-slate-100 dark:border-slate-800/80 mt-auto bg-white dark:bg-slate-900">
            <a
              href="https://t.me/educontestadmin"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all group border border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <HelpIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400 truncate">Yordam kerakmi?</p>
                <p className="text-[11px] text-slate-400 truncate">@educontestadmin</p>
              </div>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: RED }}>
                <AltArrowRightIcon className="w-3.5 h-3.5 text-white" />
              </div>
            </a>
          </div>
        </aside>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 min-w-0">

          {/* Content header with Hamburger button */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Hamburger Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: sectionAccents[activeItem.id]?.bg || '#f8fafc' }}>
                {(() => {
                  const ActiveIcon = activeItem.icon;
                  return ActiveIcon ? <ActiveIcon size={20} className="shrink-0" style={{ color: sectionAccents[activeItem.id]?.color || '#94a3b8' }} /> : null;
                })()}
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold sm:font-semibold text-slate-900 dark:text-white">
                  {activeItem.label}
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-0.5">{activeItem.description}</p>
              </div>
            </div>
          </div>

          {/* Mobile Hamburger Drawer Overlay */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40"
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 250 }}
                  className="md:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 z-50 flex flex-col shadow-2xl border-r border-slate-200 dark:border-slate-800"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">SOZLAMALAR</p>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {NAV.map((item) => {
                      const isActive = active === item.id;
                      const accent = sectionAccents[item.id] || { color: RED, bg: "#fff0f0" };
                      const IconComponent = item.icon;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSetActive(item.id as SectionId)}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all ${
                            isActive
                              ? 'bg-slate-100 dark:bg-slate-800 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: isActive ? accent.bg : '#f1f5f9' }}
                          >
                            {IconComponent && (
                              <IconComponent
                                size={18}
                                style={{ color: isActive ? accent.color : '#64748b' }}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.label}</p>
                            <p className="text-[10px] text-slate-400 truncate">{item.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Mobile nav (horizontal scroll with sticky top) */}
          <div className="md:hidden sticky top-[56px] z-30 bg-white/95 backdrop-blur-md dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 flex overflow-x-auto scrollbar-none gap-2 px-3 py-2.5 shadow-2xs">
            {NAV.map((item) => {
              const IconComponent = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSetActive(item.id as SectionId)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#E8192C] text-white shadow-xs shadow-red-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {IconComponent && <IconComponent size={16} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-140px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="p-3 sm:p-6 lg:p-10"
              >
                <ProfileRenderer
                  active={active}
                  setActive={handleSetActive}
                  profile={profile}
                  setIsPaymentOpen={setIsPaymentOpen}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} amount={0} profile={profile} />
    </div>
  );
}

function ProfileRenderer({ active, setActive, profile, setIsPaymentOpen }: any) {
  const { user } = useAuth();

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["wallet-settings-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as any)
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  if (active === "profil") return <ProfileSection />;
  if (active === "obuna") return <SubscriptionSection profile={profile} setActive={setActive} />;
  if (active === "hamyon") return <WalletSection profile={profile} history={history} historyLoading={historyLoading} onTopUp={() => setIsPaymentOpen(true)} />;
  if (active === "bildirishnoma") return <NotificationsSection />;
  if (active === "referal") return <ReferralSection />;
  return <ProfileSection />;
}

/* ═══════════════════════════════════════════
   PROFIL (CONSOLIDATED: INFO + SECURITY + RULES)
═══════════════════════════════════════════ */
function ProfileSection() {
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [pinfl, setPinfl] = useState("");
  const [subject, setSubject] = useState("");
  const [qualification, setQualification] = useState("");

  // Password change state
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const parts = profile.full_name?.split(" ") || [];
    setFirstName(parts[0] || "");
    setLastName(parts[1] || "");
    setMiddleName((profile as any).middle_name || "");
    setBirthDate((profile as any).birth_date || "");
    setPinfl((profile as any).pinfl || "");
    setAvatarUrl(profile.avatar_url || "");
    setSubject((profile as any).subject || "");
    setQualification((profile as any).qualification_category || "");
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await (supabase as any).from("profiles").update({
        full_name: `${firstName} ${lastName}`.trim(),
        middle_name: middleName,
        birth_date: birthDate || null,
        pinfl, subject,
        qualification_category: qualification,
      }).eq("user_id", user.id);
      toast({ title: t('settings.sections.profil.success_save') });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const savePassword = async (e: any) => {
    e.preventDefault();
    if (!password || password.length < 8) return toast({ title: "Parol kamida 8ta belgi bo'lishi shart!", variant: "destructive" });
    if (password !== confirm) return toast({ title: "Parollar mos emas!", variant: "destructive" });

    setPwdLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await (supabase as any).from("profiles").update({ has_password: true }).eq("user_id", user?.id);
      toast({ title: "Sizning parolingiz muvaffaqiyatli o'zgartirildi!" });
      setPassword(""); setConfirm("");
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally { setPwdLoading(false); }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);
    try {
      const path = `${user.id}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file);
      if (error) throw error;
      const publicUrl = getStoragePublicUrl("avatars", path);
      await (supabase as any).from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      setAvatarUrl(publicUrl);
      toast({ title: t('settings.sections.profil.success_avatar') });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const email = profile?.email || '';

  return (
    <div className="space-y-6 max-w-5xl">

      {/* 1. Profile Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 p-5 sm:p-8 lg:p-10">
          <div className="relative shrink-0">
            <div className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img src="/logo.png" className="w-full h-full object-contain" alt="EduContest" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-10 shadow-xs"
            >
              <CameraMinimalisticIcon size={18} style={{ color: RED }} />
            </button>
            <input type="file" ref={fileRef} onChange={uploadAvatar} className="hidden" accept="image/*" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{`${firstName} ${lastName}`.trim() || 'Foydalanuvchi'}</h2>
            
            {profile?.subscription_tier === 'premium' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full">
                <StarIcon size={14} className="text-amber-500" />
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider whitespace-nowrap">PREMIUM</span>
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-8 mt-4 sm:mt-6">
              <span className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-500 font-medium">
                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                  <CalendarIcon size={14} />
                </span>
                {birthDate || 'Sana belgilanmagan'}
              </span>
              <span className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-500 font-medium">
                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                  <GlobalIcon size={14} />
                </span>
                {(profile as any)?.region || 'Hudud belgilanmagan'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-200 dark:divide-slate-800">
          {[
            { label: 'REYTING', value: (profile as any)?.rating || 0, icon: CupIcon, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
            { label: 'BALANS', value: `${(profile?.balance || 0).toLocaleString()} UZS`, icon: WalletIcon, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
            { label: "TESTLAR", value: (profile as any)?.total_tests || 0, icon: CheckCircleIcon, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
            { label: 'SAVOLLAR', value: (profile as any)?.total_questions || 0, icon: HelpIcon, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
          ].map((stat) => {
            const IconComp = stat.icon;
            return (
              <div key={stat.label} className="p-4 sm:px-6 sm:py-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: stat.bg }}>
                  <IconComp size={20} style={{ color: stat.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-none">{stat.value}</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-1 sm:mt-1.5">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Asosiy ma'lumotlar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 sm:mb-6">Asosiy ma'lumotlar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileField label="Ism" value={firstName} onChange={setFirstName} placeholder="Ismingiz" icon={UserIcon} />
          <ProfileField label="Familiya" value={lastName} onChange={setLastName} placeholder="Familiyangiz" icon={UserIcon} />
          <ProfileField label="Otasining ismi" value={middleName} onChange={setMiddleName} placeholder="Otangizning ismi" icon={UserIcon} />
          <ProfileField label="Tug'ilgan sana" value={birthDate} onChange={setBirthDate} placeholder="KK.OO.YYYY" type="date" icon={CalendarIcon} />
          <ProfileField label="Email manzil" value={email} onChange={() => {}} placeholder="email@example.com" icon={LetterIcon} readOnly />
          <ProfileField label="Telefon raqam" value={(profile as any)?.phone || ''} onChange={() => {}} placeholder="+998 90 123 45 67" icon={PhoneIcon} readOnly />
        </div>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-5 mt-5 sm:pt-6 sm:mt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            disabled={loading}
            onClick={save}
            className="w-full sm:w-auto px-6 h-11 rounded-xl text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60 shadow-xs"
            style={{ background: RED }}
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <DisketteIcon size={18} />}
            Ma'lumotlarni Saqlash
          </button>
        </div>
      </div>

      {/* 3. Parol va Xavfsizlik (Merged directly here) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
            <LockIcon size={22} className="text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Parol va Xavfsizlik</h3>
            <p className="text-xs text-slate-400 font-medium">Hisobingiz uchun yangi maxfiy parol belgilang</p>
          </div>
        </div>

        <form onSubmit={savePassword} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 ml-1">Yangi parol</label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Kamida 8 ta belgi"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 pr-10 text-[13px]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeClosedIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 ml-1">Parolni tasdiqlash</label>
              <Input
                type={showPwd ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Parolni qayta kiriting"
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[13px]"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full sm:w-auto px-6 h-11 rounded-xl text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60 shadow-xs"
              style={{ background: RED }}
            >
              {pwdLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheckIcon size={18} />}
              Parolni O'zgartirish
            </button>
          </div>
        </form>
      </div>

      {/* 4. Platforma Qoidalari (Merged directly here) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8 space-y-4">
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
            <DocumentTextIcon size={22} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">Platforma Qoidalari va Shartlar</h3>
            <p className="text-xs text-slate-400 font-medium">Hujjatlar va shartnoma talablari bilan tanishing</p>
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <AcademixNavRow label="Foydalanish shartlari" href="/terms" />
          <AcademixNavRow label="Maxfiylik siyosati" href="/privacy" />
          <AcademixNavRow label="Oferta shartnomasi" href="/offerta" />
          <AcademixNavRow label="Litsenziya shartlari" href="/license" />
        </div>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════
   OBUNA
 ═══════════════════════════════════════════ */
function SubscriptionSection({ profile, setActive }: { profile: any; setActive?: (val: SectionId) => void }) {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponData, setCouponData] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const { data: settings } = useQuery({
    queryKey: ["admin-settings-pricing"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("admin_settings").select("*");
      const map: Record<string, string> = {};
      data?.forEach((s: any) => { map[s.key] = s.value || ""; });
      return map;
    },
  });

  const checkCoupon = async () => {
    if (!couponCode) return;
    setIsApplying(true);
    try {
      const { data, error } = await supabase
        .from("coupons" as any)
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();
      if (error || !data) throw new Error("Kupon topilmadi yoki muddati o'tgan");
      setCouponData(data as any);
      setDiscount((data as any).discount_percent);
      toast({ title: "Kupon qo'llanildi!", description: `${(data as any).discount_percent}% chegirma berildi.` });
    } catch (err: any) {
      setDiscount(0); setCouponData(null);
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally { setIsApplying(false); }
  };

  const getPrice = (base: number) => discount > 0 ? Math.round(base * (1 - discount / 100)) : base;

  const updateSubscription = async (tier: string, cost: number) => {
    setIsApplying(true);
    try {
      if (cost > 0) {
        const { error: txErr } = await (supabase as any).from("wallet_transactions").insert({
          user_id: user?.id, amount: -cost, type: 'withdrawal',
          description: `${tier.toUpperCase()} obuna - 1 oylik${couponData?.code ? ` (kupon: ${couponData.code})` : ''}`,
          status: 'success',
        });
        if (txErr) throw txErr;
      }
      const exp = new Date(); exp.setMonth(exp.getMonth() + 1);
      const { error: profErr } = await (supabase as any).from("profiles")
        .update({ subscription_tier: tier, subscription_expires_at: exp.toISOString(), balance: (profile?.balance || 0) - cost })
        .eq("user_id", user?.id);
      if (profErr) throw profErr;
      if (couponData) {
        await (supabase as any).from("coupons").update({ used_count: (couponData.used_count || 0) + 1 }).eq("id", couponData.id);
      }
      toast({ title: "Tabriklaymiz!", description: `${tier.toUpperCase()} obuna faollashtirildi!` });
      setIsPaymentOpen(false);
      await refreshProfile();
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally { setIsApplying(false); }
  };

  const handlePayGateway = async (method: 'click' | 'payme' | 'xazna') => {
    if (!selectedPlan || !user) return;
    const amt = getPrice(selectedPlan.price);
    const inPayMethod = method === 'xazna' ? 'cardsystem' : method;
    try {
      const res = await fetch('/api/payments/inpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          amount: amt,
          payment_method: inPayMethod,
          description: `${selectedPlan.title} Obuna Xaridi (${amt.toLocaleString()} UZS)`,
          notes: `${selectedPlan.title} Obuna Xaridi (${amt.toLocaleString()} UZS)`,
          return_url: window.location.href
        })
      });
      const data = await res.json();
      const url = data?.pay_url || data?.checkout_url;
      if (url) {
        toast({ title: "InPay to'lov sahifasiga yo'naltirilmoqda...", description: "To'lov sahifasiga o'tilmoqda..." });
        window.location.href = url;
      } else {
        toast({ title: "Xatolik", description: "InPay to'lov havolasini olib bo'lmadi", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Xatolik", description: "To'lov jarayonida xatolik yuz berdi", variant: "destructive" });
    }
  };

  const currentTier = profile?.subscription_tier || (profile?.is_lifetime ? "pro" : "standart");
  const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;
  const balance = profile?.balance || 0;

  const plans = [
    {
      id: "standart", title: "Standart", price: Number(settings?.standart_price || 0),
      desc: "Platformani sinab ko'rish va o'rganishni boshlash uchun", icon: LogicalMergeIcon, badge: null,
      accent: '#64748b', accentBg: 'rgba(100, 116, 139, 0.12)',
      features: [
        "AI yordamchi bilan suhbat — kuniga 5 ta savol",
        "Insho va yozma ish tekshirish — kuniga 1 ta",
        "Bepul test ishlash — kuniga 3 ta",
        "Shaxsiy natijalar va umumiy reyting",
        "EduCoin yig'ish: har bir faollik uchun coin olasiz",
        "Do'st taklif qilsangiz — coin bonusi ikkalangizga ham",
        "✗ Rasmdan masala yechish yo'q",
        "✗ SAT, IELTS, Milliy sertifikat mock testlari yo'q",
        "✗ Jonli olimpiada va musobaqalar yo'q",
        "✗ Kurs va test yaratib, pul ishlash yo'q",
      ]
    },
    {
      id: "premium", title: "Premium", price: Number(settings?.premium_price || 100000),
      isRecommended: true, desc: "Jiddiy tayyorlanib, yuqori ball olmoqchi bo'lganlar uchun", icon: AwardIcon, badge: "Mashhur",
      accent: RED, accentBg: 'rgba(232, 25, 44, 0.12)',
      features: [
        "AI yordamchi bilan suhbat — kuniga 200 ta savol",
        "Insho va yozma ish tekshirish — kuniga 30 ta",
        "Rasmni yuborib masala yechish (OCR) — kuniga 50 ta",
        "Barcha mavzular bo'yicha testlar — cheksiz",
        "SAT, IELTS va Milliy sertifikat mock testlari — to'liq",
        "Jonli olimpiadalar va naqd sovrinli musobaqalar",
        "Kuchli va zaif tomonlaringizni ko'rsatuvchi tahlil",
        "EduCoin 2x tezroq yig'ish — har bir faollik uchun ko'proq",
        "✗ O'z kurs va testlaringizni yaratib, pul ishlash yo'q",
        "✗ O'quvchilar guruhini boshqarish yo'q",
      ]
    },
    {
      id: "pro", title: "Pro", price: Number(settings?.pro_price || 200000),
      desc: "O'qituvchilar, repetitorlar va ta'lim biznesi uchun", icon: BoltIcon, badge: "Pro",
      accent: '#d97706', accentBg: 'rgba(217, 119, 6, 0.12)',
      features: [
        "AI yordamchi bilan suhbat — kuniga 500 ta savol",
        "Insho va yozma ish tekshirish — kuniga 100 ta",
        "Rasmni yuborib masala yechish (OCR) — kuniga 200 ta",
        "Barcha testlar, mock testlar va olimpiadalar — to'liq",
        "O'z kurslaringizni yaratib, platformada soting (10 tagacha)",
        "O'quvchilar guruhini boshqaring — 100 kishigacha",
        "Har bir o'quvchining taraqqiyotini kuzating",
        "Kursdan tushgan daromadni to'g'ridan-to'g'ri kartangizga oling",
        "EduCoin 3x tezroq yig'ish — maxsus bonus koeffitsient",
        "Ustuvor qo'llab-quvvatlash va shaxsiy menejer",
      ]
    }
  ];

  return (
    <div className="space-y-8">

      {/* Current plan card */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Joriy obuna</p>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold capitalize">{currentTier}</h3>
              {(currentTier !== 'standart') && !isExpired && (
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-medium border border-slate-700">Faol</span>
              )}
              {isExpired && (
                <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-medium border border-slate-700">Muddati o'tgan</span>
              )}
            </div>
            {expiresAt && !isExpired && (
              <p className="text-[11px] text-slate-400 mt-1">Muddat: <span className="text-white font-medium">{expiresAt.toLocaleDateString('uz-UZ')}</span></p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Balans</p>
            <p className="text-xl font-semibold">{balance.toLocaleString()} <span className="text-sm text-slate-400">so'm</span></p>
            {setActive && (
              <button onClick={() => setActive("hamyon")} className="text-[11px] text-slate-400 font-medium mt-1 hover:text-white transition-colors">Balans to'ldirish →</button>
            )}
          </div>
        </div>
      </div>

      {/* Coupon */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <TicketIcon className="w-5 h-5 text-slate-500" />
        </div>
        <div className="flex-1">
          <h4 className="text-[13px] font-medium text-slate-800 dark:text-slate-200">Promo-kod</h4>
          <p className="text-[11px] text-slate-400">Chegirma kodingiz bo'lsa kiriting</p>
        </div>
        {discount > 0 && (
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[11px] font-medium border border-slate-200 dark:border-slate-700">-{discount}%</div>
        )}
        <div className="flex gap-2 w-full sm:w-auto">
          <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && checkCoupon()}
            placeholder="PROMO2025"
            className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium uppercase tracking-wider focus:outline-none focus:border-[#E8192C]/50 w-full sm:w-36 dark:text-white placeholder:text-slate-400 transition-colors"
          />
          <button onClick={checkCoupon} disabled={isApplying || !couponCode}
            className="h-10 px-5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[11px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >{isApplying ? "..." : "Qo'llash"}</button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map(plan => {
          const isActive = plan.id === currentTier && !isExpired;
          const finalPrice = getPrice(plan.price);
          return (
            <TarifCard key={plan.id} {...plan} finalPrice={finalPrice} isActive={isActive} accent={plan.accent} accentBg={plan.accentBg}
              canAfford={balance >= finalPrice} discount={discount}
              onSelect={() => {
                if (isActive) return;
                if (plan.price === 0) { updateSubscription(plan.id, 0); return; }
                setSelectedPlan(plan); setIsPaymentOpen(true);
              }}
            />
          );
        })}
      </div>

      {/* Payment Modal */}
      {isPaymentOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsPaymentOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <selectedPlan.icon className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedPlan.title} Obuna</h3>
                <p className="text-slate-500 text-[13px] mt-1">1 oylik • {getPrice(selectedPlan.price).toLocaleString()} so'm</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Narx</span>
                  <span className="font-medium text-slate-900 dark:text-white">{selectedPlan.price.toLocaleString()} so'm</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-500">Chegirma ({discount}%)</span>
                    <span className="font-medium text-slate-500">-{(selectedPlan.price - getPrice(selectedPlan.price)).toLocaleString()} so'm</span>
                  </div>
                )}
                <div className="flex justify-between text-[13px] pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Balans</span>
                  <span className={`font-medium ${balance >= getPrice(selectedPlan.price) ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{balance.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-900 dark:text-white">Jami</span>
                  <span className="text-[#E8192C] text-lg">{getPrice(selectedPlan.price).toLocaleString()} so'm</span>
                </div>
              </div>

              {balance >= getPrice(selectedPlan.price) ? (
                <button onClick={() => updateSubscription(selectedPlan.id, getPrice(selectedPlan.price))} disabled={isApplying}
                  className="w-full h-14 rounded-xl text-white font-medium text-[13px] transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: RED }}
                >
                  {isApplying
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <>Balansdan to'lash — {getPrice(selectedPlan.price).toLocaleString()} so'm</>
                  }
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Official Telegram Admin Contact Box */}
                  <TelegramAdminCard showCopyButton={true} planName={selectedPlan?.title} />

                  <button
                    onClick={() => {
                      setIsPaymentOpen(false);
                      setIsTopUpOpen(true);
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl text-white font-extrabold text-[13.5px] flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.98] shadow-lg shadow-emerald-600/20 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border border-emerald-400/30 cursor-pointer"
                  >
                    <BoltIcon className="w-4 h-4 text-amber-300" />
                    <span>InPay orqali Balansni to'ldirish ➔</span>
                  </button>
                </div>
              )}

              <button onClick={() => setIsPaymentOpen(false)} className="w-full py-2 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TopUp Payment Modal */}
      <PaymentModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        amount={selectedPlan ? getPrice(selectedPlan.price) : 0}
        profile={profile}
      />
    </div>
  );
}

function TarifCard({ title, finalPrice, price, desc, icon: Icon, features, isRecommended, badge, isActive, canAfford, discount, onSelect, accent, accentBg }: any) {
  return (
    <div className={`relative bg-white dark:bg-slate-900 border rounded-2xl p-6 transition-colors flex flex-col ${isActive ? 'border-[#E8192C]' : 'border-slate-200 dark:border-slate-800'}`}>
      {(isRecommended || isActive) && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className={`px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider text-white ${isActive ? 'bg-slate-900' : ''}`}
            style={!isActive ? { background: RED } : {}}>
            {isActive ? 'Faol' : `✦ ${badge || 'Tavsiya'}`}
          </span>
        </div>
      )}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: accentBg }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">{title}</h4>
      <div className="flex items-baseline gap-1.5 mb-1">
        {discount > 0 && price > 0 && <span className="text-sm text-slate-400 line-through">{price.toLocaleString()}</span>}
        <span className="text-2xl font-semibold text-slate-900 dark:text-white">{finalPrice.toLocaleString()}</span>
        <span className="text-[11px] text-slate-400 font-medium uppercase">so'm/oy</span>
      </div>
      <p className="text-[13px] text-slate-500 leading-relaxed mb-5">{desc}</p>
      <div className="space-y-2 mb-6 flex-1">
        {features.map((f: string) => {
          const isUnavailable = f.startsWith('✗') || f.toLowerCase().includes('mavjud emas') || f.toLowerCase().includes('not included');
          const cleanText = f.replace(/^[✓✗]\s*/, '');

          return (
            <div key={f} className={`flex items-start gap-2 text-[12.5px] ${isUnavailable ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
              <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isUnavailable ? 'bg-red-50 dark:bg-red-500/10 text-red-500 font-bold text-[9px]' : ''}`} style={!isUnavailable ? { background: accentBg } : {}}>
                {isUnavailable ? (
                  <span>✕</span>
                ) : (
                  <CheckCircleIcon className="w-2.5 h-2.5" style={{ color: accent }} />
                )}
              </div>
              <span className={isUnavailable ? 'line-through opacity-70 text-slate-400 dark:text-slate-500' : ''}>
                {cleanText}
              </span>
            </div>
          );
        })}
      </div>
      <button onClick={onSelect} disabled={isActive}
        className={`w-full h-11 rounded-xl font-medium text-[13px] transition-opacity active:scale-[0.98] ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default' : 'text-white hover:opacity-90'}`}
        style={!isActive ? { background: RED } : {}}
      >
        {isActive ? 'Joriy reja' : price === 0 ? 'Bepul boshlash' : canAfford ? "Balansdan to'lash" : "Obuna bo'lish"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HAMYON
═══════════════════════════════════════════ */
function WalletSection({ profile, history, historyLoading, onTopUp }: any) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCards();
    }
  }, [user]);

  const fetchCards = async () => {
    try {
      const data = await api.cards.get();
      setCards(data || []);
    } catch (err) {
      console.error("Cards fetch error:", err);
    } finally {
      setCardsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Balance Card */}
      <div className="rounded-2xl p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #065f46, #0d9488)' }}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-200">{t('settings.sections.hamyon.balance_label')}</p>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-semibold tracking-tight">{(profile?.balance || 0).toLocaleString()}</h2>
              <span className="text-sm font-medium text-emerald-200 uppercase tracking-wider">{t('common.currency').toUpperCase()}</span>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={onTopUp}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-white text-emerald-900 font-medium text-[13px] hover:opacity-90 transition-opacity active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <AddSquareIcon className="w-3.5 h-3.5" /> {t('settings.sections.hamyon.btn_topup')}
            </button>
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-white/10 text-white font-medium text-[13px] border border-white/20 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRightUpIcon className="w-3.5 h-3.5" /> {t('settings.sections.hamyon.btn_withdraw')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card Management */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[13px] font-medium text-slate-800 dark:text-slate-200">{t('settings.sections.hamyon.cards_title')}</h3>
            <button
              onClick={() => setIsCardOpen(true)}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <AddSquareIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {cardsLoading ? (
              <div className="py-10 flex justify-center">
                <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 border-t-rose-500 rounded-full animate-spin" />
              </div>
            ) : cards.length > 0 ? (
              cards.map((card) => (
                <div key={card.id} className="p-5 rounded-2xl bg-slate-900 text-white relative border border-slate-800 cursor-pointer transition-colors hover:bg-slate-800">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CreditCardIcon className="w-10 h-10" />
                  </div>
                  <p className="text-[11px] font-medium uppercase tracking-wider opacity-60 mb-6">{card.card_type} • Uzcard</p>
                  <p className="text-lg font-medium tracking-[0.2em] mb-1">•••• {card.last_four}</p>
                  <div className="flex justify-between items-end">
                    <p className="text-[11px] font-medium opacity-80 uppercase tracking-wider truncate max-w-[120px]">{card.card_holder || profile?.full_name || 'Ism Familiya'}</p>
                    <div className="w-6 h-4 bg-white/10 rounded-sm" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t('settings.sections.hamyon.no_cards')}</p>
              </div>
            )}

            <button
              onClick={() => setIsCardOpen(true)}
              className="w-full py-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <AddSquareIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{t('settings.sections.hamyon.btn_add_card')}</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="text-[13px] font-medium text-slate-800 dark:text-slate-200 mb-6">{t('settings.sections.hamyon.history_title')}</h3>

          <div className="space-y-1">
            {historyLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 border-t-rose-500 rounded-full animate-spin" />
              </div>
            ) : history && history.length > 0 ? (
              history.slice(0, 4).map((tx: any) => (
                <div key={tx.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === 'deposit' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'
                    }`}>
                      {tx.type === 'deposit'
                        ? <ArrowLeftDownIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        : <ArrowRightUpIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 leading-none mb-1">{tx.description || (tx.type === 'deposit' ? t('settings.sections.hamyon.tx_deposit') : t('settings.sections.hamyon.tx_payment'))}</p>
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{format(new Date(tx.created_at), "d MMM, HH:mm", { locale: i18n.language === 'uz' ? uz : undefined })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[13px] font-medium ${
                      tx.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {tx.type === 'deposit' ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center space-y-2">
                <HistoryIcon className="w-6 h-6 text-slate-200 dark:text-slate-700 mx-auto" />
                <p className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">{t('settings.sections.hamyon.no_history')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        amount={0}
        profile={profile}
        isWithdraw={true}
      />
      <CardLinkingModal
        isOpen={isCardOpen}
        onClose={() => {
          setIsCardOpen(false);
          fetchCards();
        }}
      />
    </div>
  );
}

function NotificationsSection() {
  const { t, i18n } = useTranslation();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [settings, setSettings] = useState({
    push_notifications: (profile as any)?.push_notifications ?? true,
    telegram_bot: (profile as any)?.telegram_bot ?? true,
    email_notifications: (profile as any)?.email_notifications ?? true,
    marketing_emails: (profile as any)?.marketing_emails ?? true,
  });

  useEffect(() => {
    if (profile) {
      setSettings({
        push_notifications: (profile as any)?.push_notifications ?? true,
        telegram_bot: (profile as any)?.telegram_bot ?? true,
        email_notifications: (profile as any)?.email_notifications ?? true,
        marketing_emails: (profile as any)?.marketing_emails ?? true,
      });
    }
  }, [profile]);

  const { data: notifications = [], isLoading: isNotifLoading } = useQuery({
    queryKey: ["user-notifications-settings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const updatePreference = async (key: string, val: boolean, label: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    if (user) {
      try {
        await (supabase as any).from("profiles").update({ [key]: val }).eq("user_id", user.id);
      } catch (err) {
        console.error("Preference update error:", err);
      }
    }
    toast({
      title: val ? `${label} yoqildi` : `${label} o'chirildi`,
      description: "Sozlamalaringiz muvaffaqiyatli saqlandi.",
    });
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      qc.invalidateQueries({ queryKey: ["user-notifications-settings"] });
      toast({ title: "Barcha bildirishnomalar o'qilgan deb belgilandi" });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 1. Bildirishnoma sozlamalari */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center shrink-0">
            <BellIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bildirishnoma sozlamalari</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">Qaysi kanallar orqali xabar olishni tanlang</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {[
            { id: 'push_notifications', label: 'Push xabarlar', desc: t('settings.sections.bildirishnoma.push_desc', 'Platformadagi muhim voqealar bo\'yicha brauzer/ilova xabarlari'), icon: SmartphoneIcon },
            { id: 'telegram_bot', label: 'Telegram bot', desc: t('settings.sections.bildirishnoma.tg_desc', 'Telegram bot orqali tezkor bildirishnomalar'), icon: SendIcon },
            { id: 'email_notifications', label: 'Email xabarlari', desc: t('settings.sections.bildirishnoma.email_desc', 'Elektron pochtangizga muhim xatlarni yuborish'), icon: MailIcon },
            { id: 'marketing_emails', label: 'AI & Tizim Tavsiyalari', desc: t('settings.sections.bildirishnoma.ai_desc', 'Shaxsiy tavsiyalar va platforma yangiliklari'), icon: StarsIcon }
          ].map((item, idx) => (
            <div key={item.id} className={`flex items-center justify-between py-4 ${idx !== 3 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
              <div className="space-y-0.5">
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
                <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
              </div>
              <Switch
                checked={(settings as any)[item.id]}
                onCheckedChange={v => updatePreference(item.id, v, item.label)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Telegram Bot Ulash Card */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <SendIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-base font-bold">Telegram bot orqali bildirishnomalar</h4>
            <p className="text-xs text-sky-100 mt-0.5">Test natijalari va balans to'lovlarini Telegram'da tezkor oling</p>
          </div>
        </div>
        <a
          href="https://t.me/educontestadmin"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl bg-white text-blue-600 font-bold text-xs hover:bg-sky-50 transition-colors shrink-0 shadow-sm"
        >
          @educontestadmin bilan bog'lanish →
        </a>
      </div>

      {/* 3. So'nggi Bildirishnomalar Ro'yxati */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">So'nggi bildirishnomalar</h3>
            <p className="text-xs text-slate-400 font-medium">Platformadagi oxirgi xabarlaringiz</p>
          </div>
          {notifications.some((n: any) => !n.is_read) && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
            >
              Barchasini o'qilgan deb belgilash
            </button>
          )}
        </div>

        {isNotifLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notif: any) => (
              <div key={notif.id} className="py-3.5 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  notif.is_read ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'
                }`}>
                  <BellIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[13px] font-bold ${notif.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                      {notif.title || 'Bildirishnoma'}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {format(new Date(notif.created_at || Date.now()), "d MMM, HH:mm", { locale: i18n.language === 'uz' ? uz : undefined })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {notif.message || notif.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <BellIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hozircha sizda bildirishnomalar mavjud emas</p>
            <p className="text-[11px] text-slate-400">Yangi bildirishnomalar kelganda shu yerda aks etadi</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Primitives
═══════════════════════════════════════════ */
function ProfileField({ label, value, onChange, placeholder, type = "text", icon: Icon, readOnly = false }: any) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 ml-1">{label}</label>
      <div className="relative group">
        <input
          type={type}
          value={value}
          onChange={e => !readOnly && onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-900 dark:text-white transition-colors focus:outline-none focus:border-[#E8192C]/50 ${readOnly ? 'bg-slate-50 dark:bg-slate-800 cursor-not-allowed opacity-70' : ''}`}
        />
        {Icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {React.isValidElement(Icon) ? (
              Icon
            ) : typeof Icon === "function" || (typeof Icon === "object" && Icon !== null) ? (
              <Icon size={16} className="text-slate-300 group-focus-within:text-[#E8192C] transition-colors" />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function AcademixNavRow({ label, href }: any) {
  return (
    <Link to={href} className="flex items-center justify-between py-4 group border-b last:border-b-0 border-slate-200 dark:border-slate-800">
      <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 group-hover:text-[#E8192C] transition-colors">{label}</span>
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-[#E8192C] group-hover:text-white transition-colors">
        <AltArrowRightIcon className="w-4 h-4" />
      </div>
    </Link>
  );
}
