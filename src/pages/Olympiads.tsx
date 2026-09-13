import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/utils";
import {
  Trophy, Calendar, Clock, Users,
  ArrowRight, Search, Timer, Target,
  Sparkles, BookOpen, Zap, Medal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };
    };
    setTimeLeft(calc());
    const timer = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
}

const STATUS_TABS = [
  { id: "all", label: "Barchasi" },
  { id: "active", label: "Faol" },
  { id: "upcoming", label: "Yaqinda" },
  { id: "completed", label: "Tugagan" },
];

function CountdownBadge({ startTime }: { startTime: string }) {
  const { days, hours, minutes, seconds } = useCountdown(startTime);
  if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) return null;
  return (
    <div className="flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1">
      <Timer className="w-3 h-3" />
      {days > 0 && <span>{days}k</span>}
      <span>{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
    </div>
  );
}

const Olympiads = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  const { data: olympiads, isLoading } = useQuery({
    queryKey: ["student-olympiads"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("olympiads")
        .select(`*, subjects(*), olympiad_registrations(id)`)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: totalRegistrations } = useQuery({
    queryKey: ["olympiad-total-reg"],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("olympiad_registrations")
        .select("*", { count: "exact", head: true });
      if (error) return 0;
      return count || 0;
    },
  });

  const filtered = olympiads?.filter((ol: any) => {
    const matchesSearch = ol.title?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === "active") return ol.status === "active";
    if (activeTab === "upcoming") return ol.status === "upcoming";
    if (activeTab === "completed") return ol.status === "completed";
    return true;
  });

  const totalPrizePool = olympiads?.reduce((acc: number, ol: any) => acc + (ol.prize_pool_uzs || 0), 0) || 0;
  const activeCount = olympiads?.filter((ol: any) => ol.status === "active").length || 0;

  const stats = [
    { label: "Jami olimpiadalar", value: olympiads?.length || 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Faol olimpiadalar", value: activeCount, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Ishtirokchilar", value: totalRegistrations || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Jami mukofot", value: `${(totalPrizePool / 1000000).toFixed(1)}M`, icon: Medal, color: "text-violet-500", bg: "bg-violet-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <SEO title="Olimpiadalar" description="EduContest olimpiadalarida ishtirok eting" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-semibold text-slate-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Olimpiadani qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-300 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#E8192C] text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Olympiad Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-72 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100" />
                    <div className="h-5 w-20 rounded bg-slate-100" />
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-5 w-3/4 rounded bg-slate-100" />
                    <div className="h-4 w-full rounded bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="h-16 rounded-xl bg-slate-100" />
                    <div className="h-16 rounded-xl bg-slate-100" />
                  </div>
                </div>
              ))
            : filtered?.map((ol: any) => (
                <motion.div
                  whileHover={{ y: -4 }}
                  key={ol.id}
                  onClick={() => navigate(`/olympiads/${ol.id}/${slugify(ol.title)}`)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-slate-300 transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <Badge
                          className={`border-none px-2 py-0 text-[10px] font-medium ${
                            ol.status === "active"
                              ? "bg-emerald-50 text-emerald-600"
                              : ol.status === "upcoming"
                              ? "bg-blue-50 text-blue-600"
                              : ol.status === "completed"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {ol.status === "active"
                            ? "Faol"
                            : ol.status === "upcoming"
                            ? "Yaqinda"
                            : ol.status === "completed"
                            ? "Tugagan"
                            : ol.status}
                        </Badge>
                      </div>
                    </div>
                    {ol.status === "upcoming" && (
                      <CountdownBadge startTime={ol.start_time} />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] font-semibold text-slate-900 mb-1 group-hover:text-[#E8192C] transition-colors">
                    {ol.title}
                  </h3>
                  <p className="text-[13px] text-slate-500 font-medium line-clamp-2 mb-4">
                    {ol.description || "Olimpiada haqida batafsil ma'lumot olish uchun bosing."}
                  </p>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[11px] font-medium">Sana</span>
                      </div>
                      <p className="text-[13px] font-medium text-slate-900">
                        {new Date(ol.start_time).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Timer className="w-3 h-3" />
                        <span className="text-[11px] font-medium">Davomiylik</span>
                      </div>
                      <p className="text-[13px] font-medium text-slate-900">{ol.duration_minutes} daqiqa</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <BookOpen className="w-3 h-3" />
                        <span className="text-[11px] font-medium">Savollar</span>
                      </div>
                      <p className="text-[13px] font-medium text-slate-900">{ol.questions_count} ta</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <Users className="w-3 h-3" />
                        <span className="text-[11px] font-medium">Ishtirokchilar</span>
                      </div>
                      <p className="text-[13px] font-medium text-slate-900">{ol.olympiad_registrations?.length || 0}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    {ol.prize_pool_uzs > 0 ? (
                      <span className="text-[13px] font-medium text-emerald-600">
                        {ol.prize_pool_uzs?.toLocaleString()} so'm
                      </span>
                    ) : (
                      <span className="text-[13px] font-medium text-slate-400">Bepul</span>
                    )}
                    <span className="text-[13px] font-medium text-[#E8192C] flex items-center gap-1 group-hover:gap-2 transition-all">
                      Batafsil <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              ))}

          {!filtered?.length && !isLoading && (
            <div className="col-span-full py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="text-[15px] font-semibold text-slate-900 mb-1">Olimpiadalar topilmadi</h4>
              <p className="text-[13px] text-slate-500 font-medium">Yaqin orada yangi olimpiadalar e'lon qilinadi.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Olympiads;
