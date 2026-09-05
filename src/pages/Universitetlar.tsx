import React, { useState, useMemo } from "react";
import { Buildings2Icon } from "@solar-icons/react/bold-duotone/buildings-2";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { MapPointIcon } from "@solar-icons/react/bold-duotone/map-point";
import { PhoneCallingIcon } from "@solar-icons/react/bold-duotone/phone-calling";
import { CalendarIcon } from "@solar-icons/react/bold-duotone/calendar";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { GlobalIcon } from "@solar-icons/react/bold-duotone/global";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { MedalRibbonStarIcon } from "@solar-icons/react/bold-duotone/medal-ribbon-star";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { ChatRoundUnreadIcon } from "@solar-icons/react/bold-duotone/chat-round-unread";
import { CameraMinimalisticIcon } from "@solar-icons/react/bold-duotone/camera-minimalistic";
import { AltArrowDownIcon } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { AltArrowUpIcon } from "@solar-icons/react/bold-duotone/alt-arrow-up";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { SquareAcademicCapIcon } from "@solar-icons/react/bold-duotone/square-academic-cap";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "@/components/SEO";
import TopBar from "@/components/layout/TopBar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import universitiesData from "./universitetlar.json";

interface University {
  slug: string;
  name: string;
  url: string;
  yonalish_soni: string | number;
  kontrakt: string;
  qabul: string;
  logo_url: string;
  tavsif: string;
  telefon: string;
  website: string;
  manzil?: string;
  telegram: string;
  instagram: string;
  qs_rank?: string;
  grant_type?: string;
  talaba_soni?: string;
  bitiruvchi_soni?: string;
  tajriba_yili?: string;
  boglanish?: string;
  yonalishlar: {
    nomi: string;
    til: string;
    shakl: string;
    otish_bali: string;
    kontrakt: string;
    talablar: string;
  }[];
}

const MONTHS = [
  { id: 1, name: "Yanvar", short: "Jan", icon: "❄️" },
  { id: 2, name: "Fevral", short: "Feb", icon: "🌨️" },
  { id: 3, name: "Mart", short: "Mar", icon: "🌱" },
  { id: 4, name: "Aprel", short: "Apr", icon: "🌸" },
  { id: 5, name: "May", short: "May", icon: "🌿" },
  { id: 6, name: "Iyun", short: "Jun", icon: "☀️" },
  { id: 7, name: "Iyul", short: "Jul", icon: "🏖️" },
  { id: 8, name: "Avgust", short: "Aug", icon: "🌻" },
  { id: 9, name: "Sentabr", short: "Sep", icon: "🍂" },
  { id: 10, name: "Oktabr", short: "Oct", icon: "🍁" },
  { id: 11, name: "Noyabr", short: "Nov", icon: "🌧️" },
  { id: 12, name: "Dekabr", short: "Dec", icon: "🎄" }
];

const getMonthNumber = (dateStr: string): number | null => {
  if (!dateStr) return null;
  const isoMatch = dateStr.match(/\d{4}-(\d{2})-\d{2}/);
  if (isoMatch) {
    return parseInt(isoMatch[1], 10);
  }
  const str = dateStr.toLowerCase();
  if (str.includes("yanvar") || str.includes("january")) return 1;
  if (str.includes("fevral") || str.includes("february")) return 2;
  if (str.includes("mart") || str.includes("march")) return 3;
  if (str.includes("aprel") || str.includes("april")) return 4;
  if (str.includes("may")) return 5;
  if (str.includes("iyun") || str.includes("june")) return 6;
  if (str.includes("iyul") || str.includes("july")) return 7;
  if (str.includes("avgust") || str.includes("august")) return 8;
  if (str.includes("sentabr") || str.includes("september")) return 9;
  if (str.includes("oktabr") || str.includes("october")) return 10;
  if (str.includes("noyabr") || str.includes("november")) return 11;
  if (str.includes("dekabr") || str.includes("december")) return 12;
  return null;
};

const getCountryBadge = (manzil: string = "") => {
  const m = manzil.toLowerCase();
  if (m.includes("aqsh") || m.includes("usa")) return { code: "us", flag: "🇺🇸", name: "AQSh", bg: "bg-blue-600 text-white" };
  if (m.includes("britaniya") || m.includes("uk") || m.includes("london")) return { code: "gb", flag: "🇬🇧", name: "UK", bg: "bg-[#155dfc] text-white" };
  if (m.includes("germaniya") || m.includes("munich")) return { code: "de", flag: "🇩🇪", name: "Germaniya", bg: "bg-slate-900 text-white" };
  if (m.includes("kanada") || m.includes("canada")) return { code: "ca", flag: "🇨🇦", name: "Kanada", bg: "bg-red-600 text-white" };
  if (m.includes("avstraliya") || m.includes("sydney")) return { code: "au", flag: "🇦🇺", name: "Avstraliya", bg: "bg-blue-800 text-white" };
  if (m.includes("singapur") || m.includes("singapore")) return { code: "sg", flag: "🇸🇬", name: "Singapur", bg: "bg-red-500 text-white" };
  if (m.includes("yaponiya") || m.includes("tokyo")) return { code: "jp", flag: "🇯🇵", name: "Yaponiya", bg: "bg-rose-600 text-white" };
  if (m.includes("gonkong") || m.includes("hong kong")) return { code: "hk", flag: "🇭🇰", name: "Hong Kong", bg: "bg-red-600 text-white" };
  if (m.includes("xitoy") || m.includes("beijing") || m.includes("china")) return { code: "cn", flag: "🇨🇳", name: "China", bg: "bg-red-700 text-white" };
  if (m.includes("shveytsariya") || m.includes("zurich")) return { code: "ch", flag: "🇨🇭", name: "Shveytsariya", bg: "bg-red-600 text-white" };
  if (m.includes("janubiy koreya") || m.includes("seoul") || m.includes("korea")) return { code: "kr", flag: "🇰🇷", name: "South Korea", bg: "bg-blue-600 text-white" };
  if (m.includes("fransiya") || m.includes("paris")) return { code: "fr", flag: "🇫🇷", name: "Fransiya", bg: "bg-[#155dfc] text-white" };
  if (m.includes("niderlandiya") || m.includes("amsterdam")) return { code: "nl", flag: "🇳🇱", name: "Niderlandiya", bg: "bg-orange-600 text-white" };
  if (m.includes("malayziya") || m.includes("kuala")) return { code: "my", flag: "🇲🇾", name: "Malayziya", bg: "bg-blue-800 text-white" };
  if (m.includes("belgiya") || m.includes("leuven")) return { code: "be", flag: "🇧🇪", name: "Belgiya", bg: "bg-slate-800 text-white" };
  if (m.includes("tayvan") || m.includes("taipei")) return { code: "tw", flag: "🇹🇼", name: "Tayvan", bg: "bg-blue-600 text-white" };
  if (m.includes("yangi zelandiya") || m.includes("auckland")) return { code: "nz", flag: "🇳🇿", name: "Yangi Zelandiya", bg: "bg-blue-700 text-white" };
  if (m.includes("saudiya")) return { code: "sa", flag: "🇸🇦", name: "Saudiya", bg: "bg-emerald-700 text-white" };
  if (m.includes("shvetsiya") || m.includes("stockholm")) return { code: "se", flag: "🇸🇪", name: "Shvetsiya", bg: "bg-blue-600 text-white" };
  if (m.includes("irlandiya") || m.includes("dublin")) return { code: "ie", flag: "🇮🇪", name: "Irlandiya", bg: "bg-emerald-600 text-white" };
  if (m.includes("argentina") || m.includes("buenos")) return { code: "ar", flag: "🇦🇷", name: "Argentina", bg: "bg-sky-600 text-white" };
  if (m.includes("daniya") || m.includes("copenhagen") || m.includes("aarhus")) return { code: "dk", flag: "🇩🇰", name: "Daniya", bg: "bg-red-600 text-white" };
  if (m.includes("finlandiya") || m.includes("helsinki") || m.includes("espoo")) return { code: "fi", flag: "🇫🇮", name: "Finlandiya", bg: "bg-blue-600 text-white" };
  if (m.includes("norvegiya") || m.includes("oslo")) return { code: "no", flag: "🇳🇴", name: "Norvegiya", bg: "bg-indigo-600 text-white" };
  if (m.includes("avstriya") || m.includes("vienna")) return { code: "at", flag: "🇦🇹", name: "Avstriya", bg: "bg-red-600 text-white" };
  if (m.includes("qatar") || m.includes("doha")) return { code: "qa", flag: "🇶🇦", name: "Qatar", bg: "bg-amber-900 text-white" };
  if (m.includes("italiya") || m.includes("italy") || m.includes("rome") || m.includes("bologna")) return { code: "it", flag: "🇮🇹", name: "Italiya", bg: "bg-emerald-700 text-white" };
  if (m.includes("rossiya") || m.includes("russia") || m.includes("moscow")) return { code: "ru", flag: "🇷🇺", name: "Rossiya", bg: "bg-blue-700 text-white" };
  if (m.includes("hindiston") || m.includes("india") || m.includes("delhi") || m.includes("mumbai")) return { code: "in", flag: "🇮🇳", name: "Hindiston", bg: "bg-orange-600 text-white" };
  if (m.includes("chili") || m.includes("santiago")) return { code: "cl", flag: "🇨🇱", name: "Chili", bg: "bg-red-600 text-white" };
  if (m.includes("braziliya") || m.includes("brazil") || m.includes("paulo")) return { code: "br", flag: "🇧🇷", name: "Braziliya", bg: "bg-emerald-600 text-white" };
  if (m.includes("meksika") || m.includes("mexico")) return { code: "mx", flag: "🇲🇽", name: "Meksika", bg: "bg-emerald-700 text-white" };
  if (m.includes("baa") || m.includes("uae") || m.includes("abu dhabi") || m.includes("dubai")) return { code: "ae", flag: "🇦🇪", name: "BAA", bg: "bg-red-600 text-white" };
  if (m.includes("qozog'iston") || m.includes("kazakhstan") || m.includes("almaty")) return { code: "kz", flag: "🇰🇿", name: "Qozog'iston", bg: "bg-sky-500 text-white" };
  if (m.includes("indoneziya") || m.includes("indonesia") || m.includes("depok")) return { code: "id", flag: "🇮🇩", name: "Indoneziya", bg: "bg-red-600 text-white" };
  if (m.includes("janubiy afrika") || m.includes("south africa") || m.includes("cape town")) return { code: "za", flag: "🇿🇦", name: "Janubiy Afrika", bg: "bg-emerald-700 text-white" };
  if (m.includes("ispaniya") || m.includes("spain") || m.includes("barcelona") || m.includes("madrid")) return { code: "es", flag: "🇪🇸", name: "Ispaniya", bg: "bg-amber-600 text-white" };
  return { code: "uz", flag: "🇺🇿", name: "O'zbekiston", bg: "bg-emerald-600 text-white" };
};

const Universities = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "intl" | "grant" | "local">("all");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [sortField, setSortField] = useState<"name" | "qs_rank" | "country" | "grant" | "qabul" | "programs">("qs_rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Record<string, any>>({});

  const handleAiAnalysis = async (uni: University) => {
    setAiLoading(uni.slug);

    try {
      const res = await fetch("/api/ai/university-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uni.name,
          website: uni.website,
          country: getCountryBadge(uni.manzil).name,
          qs_rank: uni.qs_rank,
          grant_type: uni.grant_type,
          tavsif: uni.tavsif
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAiResults((prev) => ({ ...prev, [uni.slug]: json.data }));
      }
    } catch (err) {
      console.error("AI fetch error:", err);
    } finally {
      setAiLoading(null);
    }
  };

  const getHighlightSolarIcon = (item: string) => {
    const text = item.toLowerCase();
    if (text.includes("reyting") || text.includes("nufuz") || text.includes("jahon")) {
      return <SquareAcademicCapIcon size={14} className="text-[#E8192C] shrink-0 mt-0.5" />;
    }
    if (text.includes("grant") || text.includes("moliya") || text.includes("stipendiya") || text.includes("bepul")) {
      return <MedalRibbonStarIcon size={14} className="text-emerald-500 shrink-0 mt-0.5" />;
    }
    if (text.includes("talab") || text.includes("ielts") || text.includes("toefl") || text.includes("insho")) {
      return <BookBookmarkIcon size={14} className="text-blue-500 shrink-0 mt-0.5" />;
    }
    if (text.includes("viza") || text.includes("kampus") || text.includes("imkoniyat") || text.includes("turar")) {
      return <Buildings2Icon size={14} className="text-indigo-500 shrink-0 mt-0.5" />;
    }
    return <StarsIcon size={14} className="text-amber-500 shrink-0 mt-0.5" />;
  };

  const renderAiSection = (uni: University) => {
    const result = aiResults[uni.slug];
    if (!result) return null;

    return (
      <div className="mt-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-slate-800 dark:text-purple-100 text-xs space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-800/60 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <StarsIcon size={16} className="text-purple-600 dark:text-purple-400 animate-pulse" />
            <span className="font-extrabold text-[#E8192C] dark:text-purple-300 uppercase tracking-wider text-[11px]">
              Eduly AI Real-Time Web Tahlil ({uni.name})
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-700">
            <BoltIcon size={12} className="text-amber-500" /> Eduly AI Engine
          </span>
        </div>

        <p className="font-semibold text-slate-900 dark:text-white leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-purple-100 dark:border-purple-800/40">
          {result.summary}
        </p>

        <div className="space-y-2">
          {result.highlights?.map((item: string, i: number) => {
            const cleanText = item.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
            return (
              <div key={i} className="flex items-start gap-2 bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                {getHighlightSolarIcon(item)}
                <span
                  className="text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: cleanText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 dark:text-white font-bold">$1</strong>')
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-purple-200 dark:border-purple-800/60 flex-wrap gap-1">
          <span className="inline-flex items-center gap-1">
            <CheckCircleIcon size={12} className="text-emerald-500 shrink-0" /> Manbalar: Rasmiy portal ({uni.website || 'EduContest'}) & Google Index
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
            <BoltIcon size={12} className="text-emerald-500 shrink-0" /> Jonli tahlil tayyor
          </span>
        </div>
      </div>
    );
  };

  const renderYandexMap = (uni: University) => {
    const mapSearchQuery = encodeURIComponent(`${uni.name} ${uni.manzil}`);

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 my-4 shadow-2xs">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
              <MapPointIcon size={18} />
            </div>
            <div>
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Yandex Xarita — Joylashuv</span>
                <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-300 dark:border-amber-800">
                  Jonli Xarita
                </span>
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {uni.manzil}
              </p>
            </div>
          </div>

          <a
            href={`https://yandex.com/maps/?text=${mapSearchQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/20 transition-all shrink-0 shadow-2xs"
          >
            <MapPointIcon size={14} /> Yandex Kartada Ochiq Ko'rish <AltArrowRightIcon size={12} />
          </a>
        </div>

        <div className="w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative bg-slate-100 dark:bg-slate-950">
          <iframe
            title={`Yandex Map - ${uni.name}`}
            src={`https://yandex.com/map-widget/v1/?text=${mapSearchQuery}&z=14`}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen={true}
          ></iframe>
        </div>
      </div>
    );
  };

  const { data: dbUniversities = [] } = useQuery({
    queryKey: ["public-universities"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("universities").select("*").order("created_at", { ascending: false });
      return (data || []) as University[];
    },
  });

  const universities = useMemo(() => {
    const combined = [...dbUniversities, ...(universitiesData as University[])];
    const seen = new Set<string>();
    return combined.filter((u) => {
      const key = u.slug || u.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dbUniversities]);

  // Calculate count per month
  const monthCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    MONTHS.forEach((m) => (counts[m.id] = 0));
    universities.forEach((u) => {
      const m = getMonthNumber(u.qabul);
      if (m && counts[m] !== undefined) {
        counts[m] += 1;
      }
    });
    return counts;
  }, [universities]);

  const filtered = useMemo(() => {
    return universities.filter((u) => {
      // 1. Month Deadline Filter
      if (selectedMonth !== null) {
        const m = getMonthNumber(u.qabul);
        if (m !== selectedMonth) return false;
      }

      // 2. Category Tab Filter
      const isLocal = u.manzil?.includes("O'zbekiston") || u.qs_rank === "Mahalliy OTM" || u.qs_rank?.includes("Mahalliy");
      const isIntl = !isLocal;
      const hasGrant = u.grant_type || u.tavsif?.toLowerCase().includes("grant") || u.yonalishlar?.some(y => y.kontrakt.toLowerCase().includes("grant"));
      
      if (activeTab === "intl" && !isIntl) return false;
      if (activeTab === "grant" && !hasGrant) return false;
      if (activeTab === "local" && !isLocal) return false;

      // 3. Search Query Filter
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.tavsif?.toLowerCase().includes(q) ||
        u.manzil?.toLowerCase().includes(q) ||
        u.grant_type?.toLowerCase().includes(q) ||
        u.yonalishlar?.some(y => y.nomi.toLowerCase().includes(q) || y.talablar?.toLowerCase().includes(q))
      );
    });
  }, [universities, search, activeTab, selectedMonth]);

  // Interactive Table Column Sorting
  const sortedAndFiltered = useMemo(() => {
    const list = [...filtered];

    list.sort((a, b) => {
      let result = 0;
      if (sortField === "name") {
        result = a.name.localeCompare(b.name);
      } else if (sortField === "qs_rank") {
        const rA = a.qs_rank ? parseInt(a.qs_rank.replace("#", ""), 10) : 999;
        const rB = b.qs_rank ? parseInt(b.qs_rank.replace("#", ""), 10) : 999;
        result = rA - rB;
      } else if (sortField === "country") {
        const cA = getCountryBadge(a.manzil).name;
        const cB = getCountryBadge(b.manzil).name;
        result = cA.localeCompare(cB);
      } else if (sortField === "grant") {
        const gA = a.grant_type ? 1 : 0;
        const gB = b.grant_type ? 1 : 0;
        result = gB - gA;
      } else if (sortField === "qabul") {
        const mA = getMonthNumber(a.qabul) || 99;
        const mB = getMonthNumber(b.qabul) || 99;
        result = mA - mB;
      } else if (sortField === "programs") {
        result = (Number(b.yonalish_soni) || 0) - (Number(a.yonalish_soni) || 0);
      }

      return sortOrder === "asc" ? result : -result;
    });

    return list;
  }, [filtered, sortField, sortOrder]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggle = (slug: string) => {
    setExpanded(expanded === slug ? null : slug);
  };

  const selectedMonthObj = MONTHS.find((m) => m.id === selectedMonth);
  const activeMonthTitle = selectedMonthObj
    ? `${selectedMonthObj.name.toUpperCase()} 2027`
    : "GRANT TAQVIMI 2027";

  const hasActiveFilters = selectedMonth !== null || activeTab !== "all" || search !== "";

  const resetAllFilters = () => {
    setSelectedMonth(null);
    setActiveTab("all");
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A]">
      <SEO
        title={`Universitetlar va Grantlar Taqvimi (${universities.length} ta OTM) — EduContest`}
        description={`Jahondagi ${universities.length} ta nufuzli universitetlar va grantlar kalendari: 12 oylik deadline taqvimi, QS reytingi va qabul talablari.`}
        canonical="https://educontest.uz/universitetlar"
      />

      <TopBar />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pt-20">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8192C]/10 dark:bg-[#E8192C]/20 border border-[#E8192C]/20 flex items-center justify-center shrink-0">
              <SquareAcademicCapIcon size={24} className="text-[#E8192C]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Universitetlar va Grantlar Taqvimi
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                12 Oylik Qabul Deadline Kalendari ({filtered.length} / {universities.length} ta OTM)
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative sm:w-80 shrink-0">
            <MagnifierIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Universitet, grant yoki mamlakat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-[#E8192C]/50 dark:text-white placeholder:text-slate-400 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* 1. Category Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "all"
                ? "bg-[#E8192C] text-white shadow-md shadow-red-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Buildings2Icon size={16} /> Barcha OTMlar ({universities.length})
          </button>
          <button
            onClick={() => setActiveTab("intl")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "intl"
                ? "bg-[#E8192C] text-white shadow-md shadow-red-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            <GlobalIcon size={16} /> Xalqaro Top OTMlar
          </button>
          <button
            onClick={() => setActiveTab("grant")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "grant"
                ? "bg-[#E8192C] text-white shadow-md shadow-red-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            <MedalRibbonStarIcon size={16} /> 100% To'liq Grantlar
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "local"
                ? "bg-[#E8192C] text-white shadow-md shadow-red-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            <BookBookmarkIcon size={16} /> Mahalliy OTMlar
          </button>
        </div>

        {/* 2. 12-Month Calendar Selector Bar (Top Slider/Tabs) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarIcon size={18} className="text-[#E8192C]" />
              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                12 Oylik Qabul Deadline Kalendari
              </span>
            </div>
            {selectedMonth !== null && (
              <button
                onClick={() => setSelectedMonth(null)}
                className="text-[11px] font-bold text-[#E8192C] hover:underline"
              >
                Barchasini ko'rsatish ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedMonth(null)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedMonth === null
                  ? "bg-[#E8192C] text-white shadow-md shadow-red-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <CalendarIcon size={14} className={selectedMonth === null ? "text-white" : "text-[#E8192C]"} />
              Barcha Oylar ({universities.length})
            </button>
            {MONTHS.map((m) => {
              const isSel = selectedMonth === m.id;
              const count = monthCounts[m.id] || 0;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMonth(isSel ? null : m.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isSel
                      ? "bg-[#E8192C] text-white shadow-md shadow-red-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <CalendarIcon size={14} className={isSel ? "text-white" : "text-[#E8192C]"} />
                  <span>{m.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSel ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 font-extrabold"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Main Unified Table Container with Left Solid Red Vertical Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[400px]">
          {/* Elegant Left Vertical Month Banner (Light: Red gradient, Dark: Sleek wine-slate gradient) */}
          <div className="w-full md:w-12 lg:w-14 shrink-0 bg-gradient-to-r md:bg-gradient-to-b from-[#E8192C] via-[#c41223] to-[#8a0916] dark:from-[#1E293B] dark:via-[#881337]/60 dark:to-[#0F172A] border-b md:border-b-0 md:border-r border-red-700/30 dark:border-rose-900/40 flex items-center justify-between md:justify-center p-3 md:p-2 relative select-none transition-all">
            <div className="md:[writing-mode:vertical-lr] md:rotate-180 text-white dark:text-rose-200 font-extrabold text-xs sm:text-sm tracking-wider md:tracking-widest uppercase whitespace-nowrap drop-shadow-sm flex items-center gap-2 md:gap-3">
              <CalendarIcon size={15} className="text-white dark:text-rose-400 shrink-0" />
              <span>{activeMonthTitle}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 dark:bg-rose-400 animate-pulse"></span>
            </div>
            <span className="md:hidden text-[11px] font-bold text-white/80 dark:text-rose-200/80 bg-white/10 dark:bg-rose-500/20 px-2 py-0.5 rounded-full border border-white/10 dark:border-rose-500/30">
              {sortedAndFiltered.length} OTM
            </span>
          </div>

          {/* Container Body (Mobile Cards vs Desktop Table) */}
          <div className="flex-1 min-w-0">
            {sortedAndFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                  <CalendarIcon size={26} className="text-slate-400" />
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white mb-1">
                  Ushbu oy uchun grantlar topilmadi
                </h2>
                <p className="text-xs text-slate-500">Boshqa oy yoki qidiruv filterini tanlang</p>
              </div>
            ) : (
              <>
                {/* 1. Mobile Responsive Card List (Visible on screens < 768px) */}
                <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Mobile Quick Sort Selector */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">Saralash:</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                      <button
                        onClick={() => handleSort("qs_rank")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          sortField === "qs_rank"
                            ? "bg-[#E8192C] text-white"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        QS Reyting {sortField === "qs_rank" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                      </button>
                      <button
                        onClick={() => handleSort("name")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          sortField === "name"
                            ? "bg-[#E8192C] text-white"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        Nomi {sortField === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                      </button>
                      <button
                        onClick={() => handleSort("grant")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          sortField === "grant"
                            ? "bg-[#E8192C] text-white"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        Grant {sortField === "grant" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                      </button>
                    </div>
                  </div>

                  {sortedAndFiltered.map((uni) => {
                    const isOpen = expanded === uni.slug;
                    const hasGrant = uni.grant_type || uni.tavsif?.toLowerCase().includes("grant") || uni.yonalishlar?.some(y => y.kontrakt.toLowerCase().includes("grant"));
                    const badge = getCountryBadge(uni.manzil);

                    return (
                      <div key={uni.slug} className="p-4 space-y-3 bg-white dark:bg-slate-900 transition-colors relative overflow-hidden">
                        {/* Subtle University Logo Background Watermark */}
                        {uni.logo_url && (
                          <div
                            className="absolute -right-6 -bottom-6 w-36 h-36 opacity-[0.06] dark:opacity-[0.08] pointer-events-none select-none bg-no-repeat bg-contain bg-right-bottom filter grayscale"
                            style={{ backgroundImage: `url(${uni.logo_url})` }}
                          />
                        )}
                        {/* Mobile Card Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 p-1 overflow-hidden shadow-2xs">
                              <img
                                src={uni.logo_url}
                                alt={uni.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const t = e.target as HTMLImageElement;
                                  t.style.display = "none";
                                  t.parentElement!.innerHTML = `<span class="text-base font-extrabold text-[#E8192C]">${uni.name.charAt(0)}</span>`;
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                                {uni.name}
                              </h3>
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bg}`}>
                                  <img
                                    src={`https://flagcdn.com/w40/${badge.code}.png`}
                                    alt={badge.name}
                                    className="w-3.5 h-2.5 object-cover rounded-2xs shrink-0"
                                    loading="lazy"
                                  />
                                  <span>{badge.name}</span>
                                </span>
                                {uni.qs_rank && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-500/20">
                                    <StarsIcon size={10} /> QS {uni.qs_rank}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Info Badges */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-0.5">Grant / Kontrakt</span>
                            {hasGrant && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] mb-1">
                                <MedalRibbonStarIcon size={10} /> {uni.grant_type || "100% Grant"}
                              </span>
                            )}
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                              {uni.kontrakt || "Ma'lumot yo'q"}
                            </p>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-0.5">Qabul Deadline</span>
                            <div className="flex items-center gap-1 font-bold text-[#E8192C] text-[11px]">
                              <CalendarIcon size={12} className="shrink-0" />
                              <span className="truncate">{uni.qabul || "Ochiq"}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                              <BookBookmarkIcon size={12} className="text-[#E8192C]" /> {uni.yonalish_soni} ta yo'nalish
                            </span>
                          </div>
                        </div>

                        {/* Mobile Action Button */}
                        <button
                          onClick={() => toggle(uni.slug)}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                            isOpen
                              ? "bg-[#E8192C] text-white shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {isOpen ? (
                            <>Yopish <AltArrowUpIcon size={14} /></>
                          ) : (
                            <>Batafsil ma'lumot va Yo'nalishlar <AltArrowDownIcon size={14} /></>
                          )}
                        </button>

                        {/* Mobile Expanded Accordion */}
                        {isOpen && (
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4">
                            <div>
                              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                                Universitet tavsifi
                              </h4>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {uni.tavsif}
                              </p>
                            </div>

                            {/* AI Web Intelligence Card */}
                            {renderAiSection(uni)}

                            {/* Yandex Map Interactive Location Card */}
                            {renderYandexMap(uni)}

                            {uni.yonalishlar && uni.yonalishlar.length > 0 && (
                              <div>
                                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                                  Ta'lim yo'nalishlari ({uni.yonalishlar.length})
                                </h4>
                                <div className="space-y-2">
                                  {uni.yonalishlar.map((y, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs">
                                      <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <h5 className="font-bold text-slate-900 dark:text-white">{y.nomi}</h5>
                                        <span className="shrink-0 text-[10px] font-extrabold text-[#E8192C] bg-[#E8192C]/10 px-1.5 py-0.5 rounded">
                                          {y.otish_bali}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                                        <span className="inline-flex items-center gap-1 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                          <ChatRoundUnreadIcon size={12} className="text-[#E8192C]" /> {y.til}
                                        </span>
                                        <span className="inline-flex items-center gap-1 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                          <ClockCircleIcon size={12} className="text-[#E8192C]" /> {y.shakl}
                                        </span>
                                        <span className="inline-flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                                          <MedalRibbonStarIcon size={12} className="text-emerald-500" /> {y.kontrakt}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-2 flex-wrap">
                              <button
                                disabled
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-85"
                                title="Eduly AI Tahlil xizmati tez orada ishga tushadi"
                              >
                                <StarsIcon size={14} className="text-purple-400 opacity-70" />
                                <span>Eduly AI Tahlil</span>
                                <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-1.5 py-0.2 rounded-md font-extrabold border border-purple-200 dark:border-purple-800">
                                  Tez orada...
                                </span>
                              </button>
                              {uni.website && (
                                <a
                                  href={uni.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                                >
                                  <GlobalIcon size={14} /> Veb-sayt
                                </a>
                              )}
                              {uni.url && (
                                <a
                                  href={uni.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#E8192C] text-white text-xs font-bold"
                                >
                                  <SquareAcademicCapIcon size={14} /> Qabul Portali
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 2. Desktop Standard Table View (Visible on screens >= 768px) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                        {/* Mamlakat Header */}
                        <th
                          onClick={() => handleSort("country")}
                          className="py-3.5 px-4 min-w-[140px] cursor-pointer hover:text-[#E8192C] transition-colors"
                          title="Mamlakat bo'yicha saralash (A-Z / Z-A)"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Mamlakat</span>
                            <span className="text-[#E8192C] font-extrabold">
                              {sortField === "country" ? (sortOrder === "asc" ? "↑ A-Z" : "↓ Z-A") : "⇅"}
                            </span>
                          </div>
                        </th>

                        {/* Universitet Header */}
                        <th className="py-3.5 px-4 min-w-[240px]">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              onClick={() => handleSort("name")}
                              className="cursor-pointer hover:text-[#E8192C] transition-colors flex items-center gap-1.5"
                              title="Universitet nomi bo'yicha saralash (A-Z / Z-A)"
                            >
                              <span>Universitet</span>
                              {sortField === "name" && (
                                <span className="text-[#E8192C] font-extrabold">{sortOrder === "asc" ? "↑ A-Z" : "↓ Z-A"}</span>
                              )}
                            </span>

                            <button
                              onClick={() => handleSort("qs_rank")}
                              className={`text-[10px] px-2 py-0.5 rounded-md border font-bold transition-all ${
                                sortField === "qs_rank"
                                  ? "bg-[#E8192C] text-white border-[#E8192C]"
                                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-[#E8192C]"
                              }`}
                              title="QS Reyting bo'yicha saralash"
                            >
                              QS Reyting {sortField === "qs_rank" ? (sortOrder === "asc" ? "↑ #1" : "↓ #100") : "⇅"}
                            </button>
                          </div>
                        </th>

                        {/* Grant va Kontrakt Header */}
                        <th
                          onClick={() => handleSort("grant")}
                          className="py-3.5 px-4 min-w-[180px] cursor-pointer hover:text-[#E8192C] transition-colors"
                          title="Grant turi bo'yicha saralash"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Grant va Kontrakt</span>
                            <span className="text-[#E8192C] font-extrabold">
                              {sortField === "grant" ? (sortOrder === "asc" ? "↑ Grant" : "↓ Kontrakt") : "⇅"}
                            </span>
                          </div>
                        </th>

                        {/* Qabul Deadline Header */}
                        <th
                          onClick={() => handleSort("qabul")}
                          className="py-3.5 px-4 min-w-[150px] cursor-pointer hover:text-[#E8192C] transition-colors"
                          title="Deadline oyi bo'yicha saralash"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Qabul (Deadline)</span>
                            <span className="text-[#E8192C] font-extrabold">
                              {sortField === "qabul" ? (sortOrder === "asc" ? "↑ Yan" : "↓ Dek") : "⇅"}
                            </span>
                          </div>
                        </th>

                        {/* Yo'nalishlar Header */}
                        <th
                          onClick={() => handleSort("programs")}
                          className="py-3.5 px-4 min-w-[120px] cursor-pointer hover:text-[#E8192C] transition-colors"
                          title="Dasturlar soni bo'yicha saralash"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Yo'nalishlar</span>
                            <span className="text-[#E8192C] font-extrabold">
                              {sortField === "programs" ? (sortOrder === "asc" ? "↑ Ko'p" : "↓ Oz") : "⇅"}
                            </span>
                          </div>
                        </th>

                        {/* Amallar Header */}
                        <th className="py-3.5 px-4 text-right min-w-[120px]">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      {sortedAndFiltered.map((uni) => {
                        const isOpen = expanded === uni.slug;
                        const hasGrant = uni.grant_type || uni.tavsif?.toLowerCase().includes("grant") || uni.yonalishlar?.some(y => y.kontrakt.toLowerCase().includes("grant"));
                        const badge = getCountryBadge(uni.manzil);

                        return (
                          <React.Fragment key={uni.slug}>
                            <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${isOpen ? 'bg-slate-50/90 dark:bg-slate-800/70' : ''}`}>
                              {/* Column 1: Solid Country Pill Badge */}
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-white/20 dark:border-slate-700/80 shadow-2xs ${badge.bg}`}>
                                  <img
                                    src={`https://flagcdn.com/w40/${badge.code}.png`}
                                    alt={badge.name}
                                    className="w-4 h-3 object-cover rounded-2xs shrink-0 shadow-2xs"
                                    loading="lazy"
                                  />
                                  <span>{badge.name}</span>
                                </span>
                              </td>

                              {/* Column 2: University Logo & Name */}
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 p-1 overflow-hidden shadow-2xs">
                                    <img
                                      src={uni.logo_url}
                                      alt={uni.name}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        const t = e.target as HTMLImageElement;
                                        t.style.display = "none";
                                        t.parentElement!.innerHTML = `<span class="text-base font-extrabold text-[#E8192C]">${uni.name.charAt(0)}</span>`;
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug line-clamp-1">
                                      {uni.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {uni.qs_rank && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-500/20">
                                          <StarsIcon size={10} /> QS {uni.qs_rank}
                                        </span>
                                      )}
                                      {uni.tajriba_yili && (
                                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                                          {uni.tajriba_yili}-yildan
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Column 3: Grant & Tuition */}
                              <td className="py-4 px-4">
                                <div className="space-y-1">
                                  {hasGrant && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                      <MedalRibbonStarIcon size={12} /> {uni.grant_type || "100% Grant"}
                                    </span>
                                  )}
                                  <p className="font-semibold text-slate-900 dark:text-slate-200">
                                    {uni.kontrakt || "Kontrakt ma'lumoti yo'q"}
                                  </p>
                                </div>
                              </td>

                              {/* Column 4: Admission Deadline */}
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-1.5 font-bold text-[#E8192C]">
                                  <CalendarIcon size={14} className="shrink-0 text-[#E8192C]" />
                                  <span>{uni.qabul || "Arizalar ochiq"}</span>
                                </div>
                              </td>

                              {/* Column 5: Faculty count */}
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                                  <BookBookmarkIcon size={14} className="text-[#E8192C]" />
                                  {uni.yonalish_soni} dastur
                                </span>
                              </td>

                              {/* Column 6: Actions */}
                              <td className="py-4 px-4 text-right">
                                <button
                                  onClick={() => toggle(uni.slug)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                                    isOpen
                                      ? "bg-[#E8192C] text-white shadow-sm"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                                  }`}
                                >
                                  {isOpen ? (
                                    <>Yopish <AltArrowUpIcon size={14} /></>
                                  ) : (
                                    <>Batafsil <AltArrowDownIcon size={14} /></>
                                  )}
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Drawer Row */}
                            {isOpen && (
                              <tr className="bg-slate-50/90 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <td colSpan={6} className="p-6 relative overflow-hidden">
                                  {/* Subtle University Logo Background Watermark */}
                                  {uni.logo_url && (
                                    <div
                                      className="absolute -right-10 -bottom-10 w-72 h-72 opacity-[0.05] dark:opacity-[0.08] pointer-events-none select-none bg-no-repeat bg-contain bg-right-bottom filter grayscale"
                                      style={{ backgroundImage: `url(${uni.logo_url})` }}
                                    />
                                  )}
                                  <div className="space-y-6 relative z-10">
                                    {/* Description */}
                                    <div>
                                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                                        To'liq universitet ma'lumotlari
                                      </h4>
                                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {uni.tavsif}
                                      </p>
                                    </div>

                                    {/* AI Web Intelligence Card */}
                                    {renderAiSection(uni)}

                                    {/* Yandex Map Interactive Location Card */}
                                    {renderYandexMap(uni)}

                                    {/* Programs Table */}
                                    {uni.yonalishlar && uni.yonalishlar.length > 0 && (
                                      <div>
                                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                                          Ta'lim yo'nalishlari va Kirish talablari ({uni.yonalishlar.length})
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {uni.yonalishlar.map((y, idx) => (
                                            <div
                                              key={idx}
                                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-2xs"
                                            >
                                              <div className="flex items-start justify-between gap-2 mb-2">
                                                <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                                  {y.nomi}
                                                </h5>
                                                <span className="shrink-0 text-[10px] font-extrabold text-[#E8192C] bg-[#E8192C]/10 px-2 py-0.5 rounded-md">
                                                  {y.otish_bali}
                                                </span>
                                              </div>
                                              <div className="flex flex-wrap gap-2 text-[11px] mb-2">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                                                  <ChatRoundUnreadIcon size={14} className="text-[#E8192C]" /> {y.til}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                                                  <ClockCircleIcon size={14} className="text-[#E8192C]" /> {y.shakl}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                                                  <MedalRibbonStarIcon size={14} className="text-emerald-500" /> {y.kontrakt}
                                                </span>
                                              </div>
                                              {y.talablar && (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                  <strong className="text-slate-700 dark:text-slate-300">Talablar:</strong> {y.talablar}
                                                </p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Links and Contacts */}
                                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex-wrap">
                                      <div className="flex items-center gap-2.5 flex-wrap">
                                        <button
                                          disabled
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-85"
                                          title="Eduly AI Tahlil xizmati tez orada ishga tushadi"
                                        >
                                          <StarsIcon size={14} className="text-purple-400 opacity-70" />
                                          <span>Eduly AI Tahlil</span>
                                          <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-1.5 py-0.2 rounded-md font-extrabold border border-purple-200 dark:border-purple-800">
                                            Tez orada...
                                          </span>
                                        </button>
                                        {uni.website && (
                                          <a
                                            href={uni.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#E8192C] transition-colors"
                                          >
                                            <GlobalIcon size={14} /> Veb-sayt <AltArrowRightIcon size={12} />
                                          </a>
                                        )}
                                        {uni.url && (
                                          <a
                                            href={uni.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8192C] text-white text-xs font-bold transition-colors hover:bg-red-700"
                                          >
                                            <SquareAcademicCapIcon size={14} /> Rasmiy Qabul Portali <AltArrowRightIcon size={12} />
                                          </a>
                                        )}
                                      </div>
                                      {uni.boglanish && (
                                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                          <PhoneCallingIcon size={14} /> {uni.boglanish}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
</div>
  );
};

export default Universities;
