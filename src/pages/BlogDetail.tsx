import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar, Clock, ArrowLeft, Copy, Check, Eye, User, Send, Link2,
  ArrowRight, BookOpen, X, Share2, Tag, ChevronLeft, Sparkles, TrendingUp
} from "lucide-react";
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

function readTime(content: string) {
  const words = content?.replace(/<[^>]+>/g, "").split(/\s+/).length || 0;
  return Math.max(2, Math.round(words / 180));
}

// Share Buttons Component
function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center flex-wrap gap-2 pt-2">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Ulashish:</span>

      <a
        href={`https://t.me/share/url?url=${encoded}&text=${encodedTitle}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 h-8 px-3 bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc] hover:text-white rounded-xl text-[11px] font-extrabold transition-all"
      >
        <Send className="w-3.5 h-3.5" /> Telegram
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 h-8 px-3 bg-[#1877f2]/10 text-[#1877f2] hover:bg-[#1877f2] hover:text-white rounded-xl text-[11px] font-extrabold transition-all"
      >
        Facebook
      </a>

      <button
        onClick={handleCopy}
        className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-extrabold transition-all ${
          copied
            ? "bg-emerald-500 text-white"
            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
        }`}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? "Nusxalandi!" : "Link nusxalash"}
      </button>
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [coverImgError, setCoverImgError] = useState(false);
  const [recImgErrorMap, setRecImgErrorMap] = useState<Record<string, boolean>>({});

  // Scroll to top when slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  // Fetch target post strictly from DB (full content needed for reading)
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post-detail-v5", slug],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("blog_posts")
          .select("*")
          .eq("slug", slug)
          .eq("is_published", true)
          .maybeSingle();

        if (error || !data) return null;
        return data;
      } catch (err) {
        return null;
      }
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  // Fetch related posts from DB (light columns, cached 30 mins)
  const { data: relatedPosts } = useQuery({
    queryKey: ["blog-related-posts-v5", slug],
    queryFn: async () => {
      try {
        const { data } = await (supabase as any)
          .from("blog_posts")
          .select("id, slug, title, cover_image, category, published_at")
          .eq("is_published", true)
          .neq("slug", slug)
          .limit(6);
        return data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const pageUrl = window.location.href;

  const contentParts = useMemo(() => {
    if (!post?.content) return { firstPart: "", secondPart: "" };
    const matches = [...post.content.matchAll(/<\/p>/gi)];
    if (matches.length >= 2) {
      const splitIndex = matches[1].index! + 4;
      return {
        firstPart: post.content.slice(0, splitIndex),
        secondPart: post.content.slice(splitIndex),
      };
    }
    return { firstPart: post.content, secondPart: "" };
  }, [post?.content]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-[#E8192C] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-400">Maqola yuklanmoqda...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Maqola Topilmadi</h2>
          <p className="text-xs text-slate-400">Ushbu maqola serverda mavjud emas yoki o'chirilgan bo'lishi mumkin.</p>
        </div>
        <button
          onClick={() => navigate("/blog")}
          className="px-6 py-2.5 rounded-2xl bg-[#E8192C] text-white text-xs font-extrabold shadow-md hover:bg-[#C8001A] transition-all"
        >
          Blogga Qaytish
        </button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${post.title} — EduContest Blog`}
        description={post.excerpt || post.title}
        canonical={pageUrl}
      />

      {/* FULL-WIDTH CANVAS */}
      <div className="w-full min-h-screen bg-slate-50/60 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors pb-24">
        
        {/* MAIN CONTAINER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

          {/* NAV BACK BAR */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <button
              onClick={() => navigate("/blog")}
              className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300 hover:text-[#E8192C] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Barcha Maqolalarga Qaytish</span>
            </button>

            <span className="text-[11px] font-bold text-slate-400">
              {readTime(post.content)} daqiqa o'qish
            </span>
          </div>

          {/* 2-COLUMN GRID (LEFT: ARTICLE (8 cols), RIGHT: SIDEBAR RECOMMENDATIONS (4 cols)) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN — MAIN ARTICLE (8 COLS) */}
            <article className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              
              {/* TAG & META ROW */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#E8192C]/10 text-[#E8192C] text-[10px] font-black uppercase tracking-wider">
                    {post.tag || "Maqola"}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">•</span>
                  <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {timeAgo(post.published_at)}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">•</span>
                  <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {post.views || 1} ta ko'rilgan
                  </span>
                </div>

                {/* TITLE */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                  {post.title}
                </h1>

                {/* AUTHOR BADGE */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-9 h-9 rounded-full bg-[#E8192C]/10 text-[#E8192C] font-black flex items-center justify-center text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">{post.author_name || "EduContest Tahririyati"}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">EduContest Rasmiy Nashri</p>
                  </div>
                </div>
              </div>

              {/* COVER IMAGE */}
              {(post.cover_image || post.cover_image_url) && !coverImgError ? (
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-md">
                  <img
                    src={rewriteStorageUrl(post.cover_image || post.cover_image_url)}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    onError={() => setCoverImgError(true)}
                  />
                </div>
              ) : null}

              {/* EXCERPT CALLOUT */}
              {post.excerpt && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-l-4 border-[#E8192C] text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "{post.excerpt}"
                </div>
              )}

              {/* MAIN HTML CONTENT WITH IN-ARTICLE ADSENSE */}
              {contentParts.secondPart ? (
                <>
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-4 pt-2 text-slate-800 dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: contentParts.firstPart }}
                  />
                  <AdSense layout="in-article" format="fluid" className="my-6" />
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-4 pt-2 text-slate-800 dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: contentParts.secondPart }}
                  />
                </>
              ) : (
                <>
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-4 pt-2 text-slate-800 dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: contentParts.firstPart }}
                  />
                  <AdSense layout="in-article" format="fluid" className="my-6" />
                </>
              )}

              {/* ARTICLE END ADSENSE */}
              <AdSense className="my-6" />

              {/* SHARE FOOTER */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <ShareButtons title={post.title} url={pageUrl} />
              </div>
            </article>

            {/* RIGHT COLUMN — RECOMMENDED ARTICLES SIDEBAR ON PC (4 COLS) */}
            <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
              
              {/* RECOMMENDED CARD BOX */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#E8192C]" />
                    Tavsiya Etilgan Maqolalar
                  </h3>
                </div>

                {relatedPosts && relatedPosts.length > 0 ? (
                  <div className="space-y-3">
                    {relatedPosts.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          navigate(`/blog/${item.slug}`);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="group p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-[#E8192C]/40 hover:bg-white dark:hover:bg-slate-800 shadow-2xs hover:shadow-md transition-all cursor-pointer flex gap-3 items-center"
                      >
                        {(item.cover_image || item.cover_image_url) && !recImgErrorMap[item.id] ? (
                          <img
                            src={rewriteStorageUrl(item.cover_image || item.cover_image_url)}
                            alt={item.title}
                            loading="lazy"
                            className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                            onError={() => setRecImgErrorMap(prev => ({ ...prev, [item.id]: true }))}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shrink-0 border border-slate-700">
                            <BookOpen className="w-6 h-6 text-[#E8192C]" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="text-[9px] font-extrabold text-[#E8192C] uppercase tracking-wider">
                            {item.category || item.tag || "Maqola"}
                          </span>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#E8192C] transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                            <span>{timeAgo(item.published_at)}</span>
                            <span>•</span>
                            <span>{readTime(item.title)} daq</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    Hozircha boshqa tavsiyalar yo'q.
                  </div>
                )}
              </div>

              {/* NEWSLETTER / PLATFORM INFO BOX */}
              <div className="bg-gradient-to-br from-[#E8192C] to-[#B01018] rounded-3xl p-6 text-white space-y-3 shadow-lg">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-base font-black">EduContest Yangiliklaridan Xabardor Bo'ling</h4>
                <p className="text-xs text-white/80 font-medium leading-relaxed">
                  Eng so'nggi attestatsiya testlari va metodik qo'llanmalar haqida birinchilardan bo'lib bilib boring.
                </p>
                <button
                  onClick={() => navigate("/tests")}
                  className="w-full py-3 rounded-2xl bg-white text-[#E8192C] text-xs font-black hover:bg-slate-100 transition-all shadow-md active:scale-95"
                >
                  Testlarni Boshlash
                </button>
              </div>

            </aside>

          </div>

        </div>

      </div>
    </>
  );
}
