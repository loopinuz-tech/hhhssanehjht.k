import { Trophy, Medal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { rewriteStorageUrl } from "@/lib/storage";
import SEO from "@/components/SEO";

const EmptyLeaderboard = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mb-6">
      <Trophy className="w-10 h-10 text-slate-300" />
    </div>
    <p className="text-slate-500 font-bold">Hozircha ma'lumotlar mavjud emas</p>
    <p className="text-slate-400 text-sm mt-1">Reyting shakllantirilmoqda...</p>
  </div>
);

const Leaderboard = () => {
  const { user } = useAuth();

  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ["leaderboard-full"],
    queryFn: () => api.leaderboard.get()
  });

  const { data: myRank } = useQuery({
    queryKey: ["my-rank-leaderboard", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const data = await api.dashboard.get();
      return data.myRank;
    }
  });

  return (
    <>
      <SEO title="Reyting" description="EduContest reyting jadvali — eng yaxshi o'quvchilar, eng ko'p test ishlaganlar va eng yuqori natijalar." />
      <div className="w-full space-y-8 pb-20 animate-fade-in pr-4 md:pr-10">
      {/* Premium Leaderboard Header */}
      <div className="bg-gradient-to-br from-amber-50/50 via-white to-amber-100/30 dark:from-slate-900 dark:via-slate-900/50 dark:to-slate-800 border border-white dark:border-slate-800 rounded-[32px] p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex-1 text-center md:text-left space-y-3">
          <div className="space-y-2">
            <p className="text-[9px] md:text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] mb-1">G'oliblar shaharchasi</p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9]">
              Liderlar Jadvali
            </h1>
            <p className="text-xs md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-xl">
              Platformaning eng faol va bilimdon foydalanuvchilari reytingi.
            </p>
          </div>
        </div>

        <div className="relative z-10 w-32 md:w-[35%] max-w-[350px] aspect-square animate-float flex items-center justify-center">
          <img 
            src="/card_test.png" 
            alt="Leaderboard Illustration" 
            className="w-full h-full object-contain filter hue-rotate-[45deg] saturate-150 drop-shadow-[0_20px_50px_rgba(245,158,11,0.15)] group-hover:scale-105 transition-transform duration-700"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {leaders && leaders.length > 0 ? (
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-left text-slate-400">
                  <th className="pb-5 font-black uppercase tracking-widest text-[10px] w-16">O'rin</th>
                  <th className="pb-5 font-black uppercase tracking-widest text-[10px]">Ism Familiya</th>
                  <th className="pb-5 font-black uppercase tracking-widest text-[10px]">Urinishlar</th>
                  <th className="pb-5 font-black uppercase tracking-widest text-[10px]">To'g'ri javoblar</th>
                  <th className="pb-5 font-black uppercase tracking-widest text-[10px]">Jami savollar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                {leaders.map((l: any) => (
                  <tr key={l.rank} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-5">
                      {Number(l.rank) <= 3 ? (
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm ${
                          Number(l.rank) === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 ring-2 ring-amber-500/20" :
                          Number(l.rank) === 2 ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" :
                          "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        }`}>
                          {l.rank}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-bold ml-3 text-xs leading-none">{l.rank}</span>
                      )}
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                          <img 
                            src={rewriteStorageUrl(l.avatar_url || "/logo.png")} 
                            alt={l.full_name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/logo.png";
                            }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-base">
                          {l.full_name || "Noma'lum"}
                        </span>
                      </div>
                    </td>
                    <td className="py-5">
                      <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 font-bold text-xs">
                        {l.total_attempts} ta
                      </span>
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">{l.total_correct}</span>
                      </div>
                    </td>
                    <td className="py-5 text-slate-400 font-medium">
                      {l.total_questions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyLeaderboard />
        )}
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {leaders?.map((l: any) => (
          <div key={l.rank} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[28px] p-5 shadow-sm active:scale-[0.98] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black ${
                  Number(l.rank) === 1 ? "bg-amber-100 text-amber-700 ring-2 ring-amber-500/20" :
                  Number(l.rank) === 2 ? "bg-slate-100 text-slate-700" :
                  Number(l.rank) === 3 ? "bg-orange-50 text-orange-700" :
                  "bg-slate-50 text-slate-400"
                }`}>
                  {l.rank}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-none">{l.full_name || "Noma'lum"}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{l.total_attempts} urinish</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-600 dark:text-emerald-400 font-black text-lg leading-none">{l.total_correct}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">To'g'ri</p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-50 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-bold">
               <span className="uppercase tracking-widest">Jami: {l.total_questions} savol</span>
               <div className="flex gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-emerald-500" : "bg-slate-100"}`} />
                  ))}
               </div>
            </div>
          </div>
        ))}
        {(!leaders || leaders.length === 0) && <EmptyLeaderboard />}
      </div>
    </div>
    </>
  );
};

export default Leaderboard;
