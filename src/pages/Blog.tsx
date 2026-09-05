import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DocumentTextIcon as NewspaperIcon } from "@solar-icons/react/bold-duotone/document-text";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { Book2Icon } from "@solar-icons/react/bold-duotone/book-2";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { CalendarIcon } from "@solar-icons/react/bold-duotone/calendar";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import SEO from "@/components/SEO";
import { rewriteStorageUrl } from "@/lib/storage";
import AdSense from "@/components/AdSense";

function timeAgo(dateStr: string) {
  if (!dateStr) return "Yaqinda";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "Bugun";
  if (d === 1) return "Kecha";
  if (d < 30) return `${d} kun oldin`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} oy oldin`;
  return `${Math.floor(m / 12)} yil oldin`;
}

function readTime(text: string) {
  if (!text) return 3;
  const words = text.replace(/<[^>]+>/g, "").split(/\s+/).length || 0;
  return Math.max(2, Math.round(words / 150) || 3);
}

const Blog = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string>("Barchasi");
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const handleImgError = (id: string) => {
    setImgErrorMap(prev => ({ ...prev, [id]: true }));
  };

  const { data: dbPosts, isLoading } = useQuery({
    queryKey: ["blog-posts-public-v3"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("blog_posts")
          .select("id, slug, title, excerpt, cover_image, category, author, views, published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false });

        if (error || !data) return [];
        return data;
      } catch (err) {
        console.error("Blog fetch error:", err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const allPosts = useMemo(() => {
    return dbPosts || [];
  }, [dbPosts]);

  const tagsList = useMemo(() => {
    const set = new Set<string>(["Barchasi"]);
    allPosts.forEach((p: any) => {
      const tagStr = p.category || p.tag;
      if (tagStr) {
        tagStr.split(",").forEach((t: string) => set.add(t.trim()));
      }
    });
    return Array.from(set);
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    return allPosts.filter((p: any) => {
      const tagStr = p.category || p.tag;
      if (activeTag !== "Barchasi" && (!tagStr || !tagStr.includes(activeTag))) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          tagStr?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allPosts, activeTag, search]);

  const featuredPost = filteredPosts[0];
  const otherPosts = filteredPosts.slice(1);

  return (
    <>
      <SEO
        title="Blog — EduContest Maqolalar va Yangiliklar"
        description="EduContest rasmiy ta'lim va metodika blogi"
      />

      <div className="w-full min-h-screen bg-slate-50/60 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors pb-24">
        
        {/* CONTAINER */}
        <div className="w-full px-4 sm:px-6 pt-6 space-y-6">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8192C]/10 text-[#E8192C] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <NewspaperIcon size={14} /> EduContest Jurnal
                </span>
                <span className="text-xs text-slate-400 font-bold">• {filteredPosts.length} maqola</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Maqolalar va Yangiliklar Portali
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Attestatsiya, milliy sertifikat va ta'lim metodikasi bo'yicha foydali materiallar
              </p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full sm:w-72">
              <MagnifierIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 h-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8192C]/20 shadow-2xs"
              />
            </div>
          </div>

          {/* CATEGORY TAG PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {tagsList.map((tag) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 border ${
                    active
                      ? "bg-[#E8192C] text-white border-[#E8192C] shadow-sm shadow-[#E8192C]/20"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* EMPTY STATE */}
          {filteredPosts.length === 0 && !isLoading && (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
              <NewspaperIcon size={48} className="text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Hozircha maqolalar mavjud emas</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Tez orada yangi qiziqarli maqolalar va ta'limiy yangiliklar joylanadi.</p>
            </div>
          )}

          {/* FEATURED MAIN ARTICLE */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/blog/${featuredPost.slug}`)}
              className="group relative w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer grid grid-cols-1 md:grid-cols-12"
            >
              <div className="md:col-span-6 relative aspect-[16/9] md:aspect-auto overflow-hidden bg-slate-100 dark:bg-slate-800">
                {(featuredPost.cover_image || featuredPost.cover_image_url) && !imgErrorMap[featuredPost.id] ? (
                  <img
                    src={rewriteStorageUrl(featuredPost.cover_image || featuredPost.cover_image_url)}
                    alt={featuredPost.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={() => handleImgError(featuredPost.id)}
                  />
                ) : (
                  <div className="w-full h-full min-h-[220px] bg-gradient-to-br from-slate-900 via-slate-800 to-[#E8192C]/20 flex flex-col items-center justify-center text-white/50 p-6 text-center">
                    <StarsIcon size={40} className="text-[#E8192C] mb-2 animate-pulse" />
                    <span className="text-sm font-black tracking-widest uppercase text-white/80">EduContest Maqola</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-[#E8192C] text-white text-[10px] font-black uppercase tracking-wider">
                    Asosiy Maqola
                  </span>
                </div>
              </div>

              <div className="md:col-span-6 p-6 sm:p-7 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                    <span className="text-[#E8192C]">{featuredPost.category || featuredPost.tag || "Dolzarb"}</span>
                    <span>•</span>
                    <span>{timeAgo(featuredPost.published_at)}</span>
                    <span>•</span>
                    <span>{readTime(featuredPost.excerpt || featuredPost.title)} daq o'qish</span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-[#E8192C] transition-colors">
                    {featuredPost.title}
                  </h2>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#E8192C]/10 text-[#E8192C] flex items-center justify-center font-bold text-xs">
                      <UserIcon size={14} />
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">EduContest Tahririyat</span>
                  </div>

                  <span className="text-xs font-black text-[#E8192C] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Maqolani O'qish <AltArrowRightIcon size={14} />
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ADSENSE RESPONSIVE BANNER */}
          <AdSense className="my-4" />

          {/* OTHER ARTICLES GRID */}
          {otherPosts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
              {otherPosts.map((post: any) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="group flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {(post.cover_image || post.cover_image_url) && !imgErrorMap[post.id] ? (
                      <img
                        src={rewriteStorageUrl(post.cover_image || post.cover_image_url)}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={() => handleImgError(post.id)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-[#E8192C]/20 flex flex-col items-center justify-center text-white/50 p-4 text-center">
                        <Book2Icon size={32} className="text-[#E8192C] mb-1 opacity-80" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-white/70">EduContest Blog</span>
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-white text-[10px] font-bold">
                        {readTime(post.excerpt || post.title)} daq
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <span className="text-[#E8192C]">{post.category || post.tag || "Maqola"}</span>
                        <span>•</span>
                        <span>{timeAgo(post.published_at)}</span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#E8192C] transition-colors">
                        {post.title}
                      </h3>

                      {post.excerpt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <EyeIcon size={14} /> {post.views || 850}
                      </span>
                      <span className="text-[#E8192C] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Batafsil <AltArrowRightIcon size={14} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>

      </div>
    </>
  );
};

export default Blog;
