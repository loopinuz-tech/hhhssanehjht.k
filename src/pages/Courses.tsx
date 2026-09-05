import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, BookOpen, Play, ChevronRight, CheckCircle2, AlertCircle, Clock,
  Plus, Filter, Grid3X3, List, SlidersHorizontal, Star, LayoutDashboard
} from "lucide-react";
import SEO from "@/components/SEO";
import { rewriteStorageUrl } from "@/lib/storage";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { Widget4Icon } from "@solar-icons/react/bold-duotone/widget-4";
import { ChecklistIcon } from "@solar-icons/react/bold-duotone/checklist";
import { FilterIcon } from "@solar-icons/react/bold-duotone/filter";
import { AddCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";

const slugify = (text: string) => {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/['']/g, '').replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-').replace(/--+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '');
};

const categories = [
  { id: "all", label: "Barchasi" },
  { id: "matematika", label: "Matematika" },
  { id: "ona-tili", label: "Ona tili" },
  { id: "fizika", label: "Fizika" },
  { id: "kimyo", label: "Kimyo" },
  { id: "biologiya", label: "Biologiya" },
  { id: "tarix", label: "Tarix" },
  { id: "chet-tili", label: "Chet tili" },
];

const LEVEL_STYLES: Record<string, { label: string; }> = {
  beginner: { label: "Boshlang'ich" },
  intermediate: { label: "O'rtacha" },
  advanced: { label: "Murakkab" },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Tekshiruvda", className: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" },
  approved: { label: "Tasdiqlangan", className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
  rejected: { label: "Bekor qilingan", className: "text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" },
};

function CourseCard({ course, isEnrolled, isOwner, onOpen }: {
  course: any; isEnrolled: boolean; isOwner: boolean; onOpen: () => void;
}) {
  const navigate = useNavigate();
  const level = LEVEL_STYLES[course.level] ?? LEVEL_STYLES.beginner;
  const lessonCount = course.lesson_count ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col cursor-pointer transition-colors hover:border-slate-300 dark:hover:border-slate-700"
      onClick={onOpen}
    >
      {/* Owner edit button */}
      {isOwner && (
        <button
          onClick={e => { e.stopPropagation(); navigate(`/courses/edit/${course.id}`); }}
          className="absolute top-3 right-3 z-10 w-7 h-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#E8192C] transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
      )}

      {/* Thumbnail */}
      <div className="w-full h-28 rounded-xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
        {course.cover_image ? (
          <img src={rewriteStorageUrl(course.cover_image)} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
        )}
      </div>

      {/* Category label */}
      {course.category && (
        <span className="mb-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          {course.category}
        </span>
      )}

      {/* Title */}
      <h3 className="line-clamp-2 text-[15px] font-semibold text-slate-900 dark:text-white mb-3 flex-1 leading-snug">
        {course.title}
      </h3>

      {/* Instructor */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
          {course.teacher?.avatar_url
            ? <img src={rewriteStorageUrl(course.teacher.avatar_url)} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[8px] font-medium text-slate-400">
                {course.teacher?.full_name?.[0] || "M"}
              </div>
          }
        </div>
        <span className="text-[13px] text-slate-500 font-medium truncate">{course.teacher?.full_name || "Muallif"}</span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-500">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />{lessonCount}
        </span>
        {course.level && (
          <span className="text-[13px] font-medium text-slate-500">
            {level.label}
          </span>
        )}
      </div>

      {/* Bottom row: rating + price */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[13px] font-medium text-slate-500">{Number(course.average_rating || 0).toFixed(1)}</span>
        </div>
        <span className="text-[15px] font-semibold text-slate-900 dark:text-white">
          {course.price > 0 ? `${course.price.toLocaleString()} so'm` : "Bepul"}
        </span>
      </div>

      {/* Enrolled badge */}
      {isEnrolled && (
        <div className="flex items-center gap-1 mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#E8192C]" />
          <span className="text-[11px] font-medium text-[#E8192C] uppercase tracking-wider">A'zo</span>
        </div>
      )}

      {/* Status badge (for owner) */}
      {isOwner && course.status && course.status !== 'approved' && (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium mb-2 ${STATUS_CONFIG[course.status]?.className || ''}`}>
          {course.status === 'pending' && <Clock className="w-3 h-3" />}
          {course.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
          {STATUS_CONFIG[course.status]?.label || course.status}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={onOpen}
        className="mt-auto w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
        style={{ background: "#E8192C" }}
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        {isEnrolled ? "Davom etish" : isOwner && course.status !== 'approved' ? "Tahrirlash" : "Ko'rish"}
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

function CourseListRow({ course, isEnrolled, isOwner, onOpen }: {
  course: any; isEnrolled: boolean; isOwner: boolean; onOpen: () => void;
}) {
  const navigate = useNavigate();
  const level = LEVEL_STYLES[course.level] ?? LEVEL_STYLES.beginner;
  const lessonCount = course.lesson_count ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onOpen}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-colors hover:border-slate-300 dark:hover:border-slate-700"
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
        {course.cover_image ? (
          <img src={rewriteStorageUrl(course.cover_image)} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {course.category && (
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{course.category}</span>
          )}
          {isOwner && course.status && course.status !== 'approved' && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${STATUS_CONFIG[course.status]?.className || ''}`}>
              {STATUS_CONFIG[course.status]?.label || course.status}
            </span>
          )}
        </div>
        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">{course.title}</h3>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-[13px] text-slate-500">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />{lessonCount}
          </span>
          <span className="flex items-center gap-1 text-[13px] text-slate-500">
            <Star className="w-3.5 h-3.5 text-slate-300" />{Number(course.average_rating || 0).toFixed(1)}
          </span>
          {course.level && (
            <span className="text-[13px] text-slate-500">{level.label}</span>
          )}
          {isEnrolled && (
            <span className="flex items-center gap-1 text-[13px] font-medium text-[#E8192C]">
              <CheckCircle2 className="w-3.5 h-3.5" />A'zo
            </span>
          )}
        </div>
      </div>

      {/* Price + Arrow */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-[15px] font-semibold text-slate-900 dark:text-white">
          {course.price > 0 ? `${course.price.toLocaleString()}` : "Bepul"}
        </span>
        {isOwner && (
          <button
            onClick={e => { e.stopPropagation(); navigate(`/courses/edit/${course.id}`); }}
            className="w-7 h-7 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#E8192C] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
        )}
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
    </motion.div>
  );
}

const Courses = () => {
  const { category: categoryParam } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'price'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    if (categoryParam) setActiveCategory(categoryParam);
  }, [categoryParam]);

  const { data: courses, isLoading, isError, error } = useQuery({
    queryKey: ["courses-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const courses = data || [];

      const enriched = await Promise.all(courses.map(async (course: any) => {
        if (course.teacher_id) {
          const { data: teacher } = await supabase.from("profiles")
            .select("full_name, avatar_url, user_id")
            .eq("user_id", course.teacher_id)
            .maybeSingle();
          return { ...course, teacher };
        }
        return { ...course, teacher: null };
      }));

      return enriched;
    },
    retry: 2,
    staleTime: 30000,
  });

  const { data: myCourses } = useQuery({
    queryKey: ["my-courses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("courses")
        .select("*")
        .eq("teacher_id", user.id)
        .in("status", ["pending", "approved", "rejected"])
        .order("created_at", { ascending: false });
      if (error) throw error;

      const enriched = await Promise.all((data || []).map(async (course: any) => {
        const { data: teacher } = await supabase.from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", course.teacher_id)
          .maybeSingle();
        return { ...course, teacher };
      }));

      return enriched;
    },
    enabled: !!user,
    retry: 2,
  });

  const { data: enrolledIds } = useQuery({
    queryKey: ["my-enrollments", user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase.from("course_enrollments").select("course_id").eq("user_id", user.id);
      return new Set((data || []).map((e: any) => e.course_id));
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    const c = courses || [];
    return {
      total: c.length,
      free: c.filter((c: any) => !c.price || c.price === 0).length,
      enrolled: enrolledIds?.size || 0,
    };
  }, [courses, enrolledIds]);

  const filtered = useMemo(() => {
    const c = courses || [];
    return c.filter((c: any) => {
      if (user && c.teacher_id === user.id) return false;
      const catSlug = slugify(c.category || '');
      if (activeCategory !== 'all' && catSlug !== activeCategory) return false;
      if (levelFilter !== 'all' && c.level !== levelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.title?.toLowerCase().includes(q) || c.teacher?.full_name?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q);
      }
      return true;
    }).sort((a: any, b: any) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'rating') return (b.average_rating || 0) - (a.average_rating || 0);
      if (sortBy === 'price') return (a.price || 0) - (b.price || 0);
      return (b.student_count || 0) - (a.student_count || 0);
    });
  }, [courses, activeCategory, levelFilter, search, sortBy, user]);

  const goToCourse = (course: any) =>
    navigate(`/courses/${slugify(course.category || 'general')}/${slugify(course.title)}`);

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    navigate(id === 'all' ? '/courses' : `/courses/${id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEO title="Kurslar — EduContest" description="EduContest platformasidagi barcha professional kurslar" />

      {/* Header */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Kurslar</h1>
          <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400 mt-1">Barcha kurslarni ko'ring va o'rganishni boshlang</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <MagnifierIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-40 sm:w-52 pl-9 pr-3 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#E8192C] text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-[#E8192C] border border-slate-200 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              <Widget4Icon size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-[#E8192C] border border-slate-200 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              <ChecklistIcon size={16} />
            </button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#E8192C] transition-colors"
          >
            <option value="popular">Ommabop</option>
            <option value="newest">Yangi</option>
            <option value="rating">Reyting</option>
            <option value="price">Narx</option>
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-3 rounded-xl border text-[13px] font-medium flex items-center gap-1.5 transition-colors ${showFilters ? 'text-white border-transparent' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
            style={showFilters ? { background: "#E8192C" } : {}}
          >
            <FilterIcon size={16} />
            <span className="hidden sm:inline">Filtr</span>
          </button>

          {/* Action buttons */}
          {user && (
            <>
              <Link
                to="/courses/create"
                className="h-9 px-4 rounded-xl text-[13px] font-medium flex items-center gap-1.5 text-white transition-opacity hover:opacity-90 active:scale-[0.98] flex-shrink-0 shadow-sm"
                style={{ background: "#E8192C" }}
              >
                <AddCircleIcon size={16} />
                <span className="hidden sm:inline">Kurs yaratish</span>
              </Link>
              {isTeacher && (
                <Link
                  to="/tests"
                  className="h-9 px-4 rounded-xl text-[13px] font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Boshqaruv paneli</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[13px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          <BookBookmarkIcon size={16} className="text-slate-400 shrink-0" />{stats.total} ta kurs
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[13px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          {stats.free} ta bepul
        </span>
        {user && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[13px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            <CheckCircleIcon size={16} className="text-slate-400 shrink-0" />{stats.enrolled} ta a'zo
          </span>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto custom-scrollbar pb-1.5">
        {categories.map(cat => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`h-8 px-3.5 rounded-xl text-[13px] font-medium flex items-center gap-1.5 transition-colors border flex-shrink-0 ${active
                ? 'text-white border-transparent shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              style={active ? { background: "#E8192C" } : {}}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Level filter */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" />Daraja
              </span>
              {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`h-7 px-3 rounded-lg text-[13px] font-medium transition-colors border ${levelFilter === lvl
                    ? 'text-white border-transparent'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  style={levelFilter === lvl ? { background: "#E8192C" } : {}}
                >
                  {lvl === 'all' ? 'Barchasi' : LEVEL_STYLES[lvl]?.label || lvl}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Courses (teacher) */}
      {user && myCourses && myCourses.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">Mening kurslarim</h2>
            <Link to="/courses/create" className="text-[13px] font-medium text-[#E8192C] hover:opacity-90 transition-opacity">
              + Yangi kurs
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {myCourses.map((course: any) => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={false}
                isOwner={true}
                onOpen={() => {
                  if (course.status === 'approved') {
                    navigate(`/courses/${slugify(course.category || 'general')}/${slugify(course.title)}`);
                  } else {
                    navigate(`/courses/edit/${course.id}`);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#E8192C] rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white mb-1">Kurslarni yuklab bo'lmadi</h3>
          <p className="text-[13.5px] font-extrabold text-slate-700 dark:text-slate-200 mb-4">{(error as any)?.message || "Server bilan bog'lanishda xatolik"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl text-[13.5px] font-extrabold text-white transition-opacity hover:opacity-90 active:scale-[0.98] shadow-md"
            style={{ background: "#E8192C" }}
          >
            Qayta yuklash
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/60 rounded-2xl flex items-center justify-center mb-4 border border-slate-200/60 dark:border-slate-700/60">
            <BookBookmarkIcon size={34} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white mb-1">Kurs topilmadi</h3>
          <p className="text-[13.5px] font-extrabold text-slate-700 dark:text-slate-200 mb-5">Boshqa kategoriyani tanlang yoki qidiruvni o'zgartiring</p>
          <button
            onClick={() => { handleCategoryChange('all'); setSearch(''); setLevelFilter('all'); }}
            className="px-6 py-3 rounded-xl text-[13.5px] font-extrabold text-white transition-opacity hover:opacity-90 active:scale-[0.98] shadow-md"
            style={{ background: "#E8192C" }}
          >
            Hammasini ko'rish
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((course: any) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledIds?.has(course.id) || false}
              isOwner={course.teacher_id === user?.id || course.teacher?.user_id === user?.id}
              onOpen={() => goToCourse(course)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {filtered.map((course: any) => (
            <CourseListRow
              key={course.id}
              course={course}
              isEnrolled={enrolledIds?.has(course.id) || false}
              isOwner={course.teacher_id === user?.id || course.teacher?.user_id === user?.id}
              onOpen={() => goToCourse(course)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;
