import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  Search, FileText, Clock, ArrowRight, Plus, BookOpen, Target,
  Layers, Compass, Zap, Filter, TrendingUp, Brain, FlaskConical,
  History, Code2, X, Users, Award, ChevronRight, LayoutGrid, List, Calculator, Pen,
  Calendar, Timer, Info, Lock
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubject } from "@/hooks/useSubject";
import SEO from "@/components/SEO";
import { CompassBigIcon } from "@solar-icons/react/bold-duotone/compass-big";
import { CodeSquareIcon } from "@solar-icons/react/bold-duotone/code-square";
import { DnaIcon } from "@solar-icons/react/bold-duotone/dna";
import { Book2Icon } from "@solar-icons/react/bold-duotone/book-2";
import { HistoryIcon } from "@solar-icons/react/bold-duotone/history";
import { AtomIcon } from "@solar-icons/react/bold-duotone/atom";
import { BookBookmarkIcon } from "@solar-icons/react/bold-duotone/book-bookmark";
import { GlobalIcon } from "@solar-icons/react/bold-duotone/global";
import { EarthIcon } from "@solar-icons/react/bold-duotone/earth";
import { CalculatorMinimalisticIcon } from "@solar-icons/react/bold-duotone/calculator-minimalistic";
import { DiplomaIcon } from "@solar-icons/react/bold-duotone/diploma";
import { StarsIcon } from "@solar-icons/react/bold-duotone/stars";
import { UserIcon } from "@solar-icons/react/bold-duotone/user";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { GraphNewUpIcon } from "@solar-icons/react/bold-duotone/graph-new-up";
import { FilterIcon } from "@solar-icons/react/bold-duotone/filter";
import { BoltIcon } from "@solar-icons/react/bold-duotone/bolt";
import { TargetIcon } from "@solar-icons/react/bold-duotone/target";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { WidgetAddIcon } from "@solar-icons/react/bold-duotone/widget-add";
import { ChecklistIcon } from "@solar-icons/react/bold-duotone/checklist";
import { AddCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";

import { slugify } from "@/lib/utils";
import { buildMockTestSlug } from "@/lib/testRoutes";

const CATEGORIES = [
  { id: "mavzulashtirilgan", label: "Mavzulashtirilgan", icon: BookBookmarkIcon, color: "#0891b2" },
  { id: "mock-tests", label: "Mock testlar", icon: CalculatorMinimalisticIcon, color: "#ea580c" },
  { id: "attestatsiya", label: "Attestatsiya", icon: DiplomaIcon, color: "#7c3aed" },
  { id: "pedagogik", label: "Pedagogik", icon: StarsIcon, color: "#10b981" },
  { id: "user-tests", label: "O'qituvchi testlari", icon: UserIcon, color: "#f59e0b" },
];

const ICON_MAP: Record<string, any> = {
  Compass: CompassBigIcon,
  FlaskConical: AtomIcon,
  Brain: DnaIcon,
  BookOpen: Book2Icon,
  History: HistoryIcon,
  Layers: BookBookmarkIcon,
  Code2: CodeSquareIcon,
  Calculator: CalculatorMinimalisticIcon,
  Award: DiplomaIcon,
  TrendingUp: GraphNewUpIcon,
  Filter: FilterIcon,
  Zap: BoltIcon,
  Target: TargetIcon,
  Users: UserIcon,
  FileText: DocumentTextIcon,
  X: CloseCircleIcon,
  ChevronRight: AltArrowRightIcon,
  LayoutGrid: WidgetAddIcon,
  List: ChecklistIcon,
  Plus: AddCircleIcon,
  Search: MagnifierIcon
};

function normalizeSubjectName(name: string | null | undefined): string {
  if (!name) return "";
  const n = name.toLowerCase().trim();
  if (n.includes('ingliz') || n.includes('ingiliz')) return 'Ingliz tili';
  if (n.includes('rus')) return 'Rus tili';
  if (n.includes('ona') || n.includes('o\'zbek')) return 'Ona tili';
  if (n.includes('matematik')) return 'Matematika';
  if (n.includes('tarix')) return 'Tarix';
  if (n.includes('biolog')) return 'Biologiya';
  if (n.includes('fizik')) return 'Fizika';
  if (n.includes('informat')) return 'Informatika';
  if (n.includes('kimyo')) return 'Kimyo';
  if (n.includes('geograf')) return 'Geografiya';
  return name;
}

const getCategoryFromParam = (param: string | null): string => {
  if (!param) return "mavzulashtirilgan";
  const p = param.toLowerCase().trim();
  if (p === "mock" || p === "mock-tests" || p === "mocktest" || p === "mocktests") return "mock-tests";
  if (p === "attestatsiya" || p === "attestation") return "attestatsiya";
  if (p === "pedagogik" || p === "pedagogic") return "pedagogik";
  if (p === "user-tests" || p === "user" || p === "teacher") return "user-tests";
  if (p === "mavzulashtirilgan" || p === "topic") return "mavzulashtirilgan";
  return CATEGORIES.some(c => c.id === p) ? p : "mavzulashtirilgan";
};

const Tests = () => {
  const navigate = useNavigate();
  const { subjectSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, isAdmin } = useAuth();
  const { setActiveSubject: setContextSubject } = useSubject();

  const paramSubject = searchParams.get("subject");
  const paramType = searchParams.get("type") || searchParams.get("category") || searchParams.get("tab");
  
  const routeKeywords = ["builder", "contributor", "folder", "details"];
  const isRouteKeyword = subjectSlug && routeKeywords.includes(subjectSlug.toLowerCase());

  const matchedSubject = useMemo(() => {
    if (!subjectSlug || isRouteKeyword) return null;
    return normalizeSubjectName(subjectSlug) || null;
  }, [subjectSlug, isRouteKeyword]);

  const activeSubject = paramSubject || matchedSubject || null;

  const setActiveSubject = (sub: string | null) => {
    setContextSubject(sub);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (sub) {
        next.set("subject", sub);
      } else {
        next.delete("subject");
      }
      return next;
    });
  };

  // Check if user is a question contributor (only for logged-in users, cached 30 mins)
  const { data: isContributor = false } = useQuery({
    queryKey: ["is-contributor", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "question_contributor")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const canAddQuestions = isAdmin || isContributor;

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(() => getCategoryFromParam(paramType));

  // Fetch category visibility setting set by Admin in AdminCatalog (cached 30 mins)
  const { data: categoryVisibilitySetting } = useQuery({
    queryKey: ["catalog-category-visibility"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_settings")
        .select("value")
        .eq("key", "catalog_category_visibility")
        .maybeSingle();
      if (error || !data?.value) return null;
      try {
        return JSON.parse(data.value) as Record<string, boolean>;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const visibleCategories = useMemo(() => {
    if (!categoryVisibilitySetting) return CATEGORIES;
    return CATEGORIES.filter((cat) => categoryVisibilitySetting[cat.id] !== false);
  }, [categoryVisibilitySetting]);

  useEffect(() => {
    if (categoryVisibilitySetting && categoryVisibilitySetting[activeCategory] === false) {
      const fallback = visibleCategories[0]?.id || "mavzulashtirilgan";
      setActiveCategory(fallback);
    }
  }, [categoryVisibilitySetting, activeCategory, visibleCategories]);

  useEffect(() => {
    const cat = getCategoryFromParam(paramType);
    if (cat !== activeCategory) {
      setActiveCategory(cat);
    }
  }, [paramType]);

  useEffect(() => {
    setVisibleCount(10);
  }, [activeSubject, searchTerm]);

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setActiveSubject(null);
    setVisibleCount(10);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const typeVal = catId === "mock-tests" ? "mock" : catId;
      next.set("type", typeVal);
      return next;
    });
  };
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [diagramModal, setDiagramModal] = useState<{ open: boolean; svg: string; title: string }>({ open: false, svg: "", title: "" });
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  // Fetch subjects from database (cached 30 mins)
  const { data: dbSubjects = [] } = useQuery({
    queryKey: ["admin-subjects-public"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("subjects")
        .select("id, name, color_from, color_to, icon_name, order_number, is_active")
        .eq("is_active", true)
        .order("order_number", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

function getSubjectIcon(name: string): any {
  if (!name) return CompassBigIcon;
  const n = name.toLowerCase().trim();
  if (n.includes('ingliz') || n.includes('ingiliz') || n.includes('rus')) return GlobalIcon;
  if (n.includes('ona') || n.includes('o\'zbek')) return Book2Icon;
  if (n.includes('adabiyot')) return BookBookmarkIcon;
  if (n.includes('matematik')) return CompassBigIcon;
  if (n.includes('tarix')) return HistoryIcon;
  if (n.includes('biolog')) return DnaIcon;
  if (n.includes('fizik') || n.includes('kimyo')) return AtomIcon;
  if (n.includes('informat')) return CodeSquareIcon;
  if (n.includes('geograf')) return EarthIcon;
  return CompassBigIcon;
}

  // Map db subjects to SUBJECTS format
  const SUBJECTS = useMemo(() => {
    return dbSubjects.map((s: any) => {
      const IconComp = getSubjectIcon(s.name) || ICON_MAP[s.icon_name] || CompassBigIcon;
      return {
        id: s.name,
        icon: IconComp,
        color: s.color_from || "#0891b2",
        bg: (s.color_from || "#0891b2") + "18",
        title: `${s.name} testlari`,
        description: `${s.name} fanidan mavzulashtirilgan testlar.`,
        color_from: s.color_from,
        color_to: s.color_to,
      };
    });
  }, [dbSubjects]);

  // Fetch test folders (direct fast query, cached 15 mins)
  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ["test-folders-all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("test_folders")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: activeCategory === "mavzulashtirilgan" || activeCategory === "all",
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
  });

  // Fetch real question counts from questions table
  const { data: questionCountsData = [] } = useQuery({
    queryKey: ["question-counts-by-folder"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("folder_id");
      if (error || !data) return [];
      return data;
    },
    enabled: activeCategory === "mavzulashtirilgan" || activeCategory === "all",
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
  });

  // Build counts map
  const questionCountsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    questionCountsData.forEach((q: any) => {
      if (q.folder_id) {
        counts[q.folder_id] = (counts[q.folder_id] || 0) + 1;
      }
    });
    return counts;
  }, [questionCountsData]);

  // Fetch user-created tests (builder_tests) — Lazy loaded ONLY when user-tests tab is active
  const { data: userTests = [], isLoading: isLoadingUserTests } = useQuery({
    queryKey: ["builder-tests-all-published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("builder_tests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data || []).filter((t: any) => t.status !== "draft" && t.status !== "archived" && t.status !== "inactive");
    },
    enabled: activeCategory === "user-tests" || activeCategory === "all",
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
  });

  // Fetch question counts for builder tests — Lazy loaded ONLY when user-tests tab is active
  const { data: builderQuestionCounts = {} } = useQuery({
    queryKey: ["builder-question-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("builder_questions" as any)
        .select("test_id");
      if (!data) return {};
      const counts: Record<string, number> = {};
      data.forEach((q: any) => {
        counts[q.test_id] = (counts[q.test_id] || 0) + 1;
      });
      return counts;
    },
    enabled: activeCategory === "user-tests" || activeCategory === "all",
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
  });

  // Fetch mock tests — Lazy loaded ONLY when mock-tests tab is active
  const { data: mockTests = [], isLoading: isLoadingMockTests } = useQuery({
    queryKey: ["mock-tests-all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("mock_tests")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: activeCategory === "mock-tests" || activeCategory === "all",
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
  });

  // Category loading indicator
  const isCategoryLoading = useMemo(() => {
    if (activeCategory === "user-tests") return isLoadingUserTests;
    if (activeCategory === "mock-tests") return isLoadingMockTests;
    return isLoadingFolders;
  }, [activeCategory, isLoadingFolders, isLoadingUserTests, isLoadingMockTests]);

  // User purchased tests — Lazy loaded ONLY when mock-tests tab is active and user is logged in
  const { data: purchasedMockTestIds = new Set() } = useQuery({
    queryKey: ["user-purchased-mock-test-ids", user?.id, (profile as any)?.user_id, (profile as any)?.id],
    queryFn: async () => {
      const set = new Set<string>();
      const uIds = [...new Set([user?.id, (profile as any)?.user_id, (profile as any)?.id].filter(Boolean))];
      if (uIds.length === 0) return set;

      const [subRes, purRes, txRes, eduRes] = await Promise.all([
        (supabase as any).from("mock_test_submissions").select("test_id").in("user_id", uIds),
        (supabase as any).from("test_purchases").select("folder_id, test_id").in("user_id", uIds),
        (supabase as any).from("wallet_transactions").select("reference_id").in("user_id", uIds),
        (supabase as any).from("educoin_transactions").select("reference_id").in("user_id", uIds),
      ]);

      subRes.data?.forEach((s: any) => { if (s.test_id) set.add(s.test_id); });
      purRes.data?.forEach((p: any) => { if (p.test_id) set.add(p.test_id); if (p.folder_id) set.add(p.folder_id); });
      txRes.data?.forEach((t: any) => { if (t.reference_id) set.add(t.reference_id); });
      eduRes.data?.forEach((e: any) => { if (e.reference_id) set.add(e.reference_id); });

      return set;
    },
    enabled: !!(user?.id || (profile as any)?.user_id || (profile as any)?.id) && (activeCategory === "mock-tests" || activeCategory === "all"),
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
  });

  // User stats
  const { data: userStats } = useQuery({
    queryKey: ["user-test-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from("test_sessions")
        .select("score, folder_id")
        .eq("user_id", user.id)
        .not("finished_at", "is", null);
      const total = data?.length || 0;
      const avgScore = total > 0 ? Math.round((data as any[]).reduce((sum, s) => sum + (s.score || 0), 0) / total) : 0;
      return { total, avgScore };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Filter logic
  const filteredItems = useMemo(() => {
    let items: any[] = [];

    if (activeCategory === "user-tests") {
      items = userTests.map((t: any) => ({
        ...t,
        _type: "user-test",
        questions_count: builderQuestionCounts[t.id] || t.questions_count || 0,
        duration_minutes: t.time_limit_min || 30,
      }));
    } else if (activeCategory === "mock-tests") {
      items = mockTests.map((t: any) => ({
        ...t,
        _type: "mock-test",
        name: t.title,
        questions_count: t.questions_count || 0,
        duration_minutes: t.duration_minutes || 30,
        isPurchased: purchasedMockTestIds.has(t.id) || (profile as any)?.is_lifetime,
      }));
    } else {
      items = folders
        .filter((f: any) => f.category === activeCategory)
        .map((f: any) => ({
          ...f,
          _type: "folder",
          questions_count: questionCountsMap[f.id] || 0,
        }));
    }

    // Subject filter (for all categories)
    if (activeSubject) {
      const normalizedActive = normalizeSubjectName(activeSubject).toLowerCase();
      items = items.filter((i: any) => {
        if (!i.subject) return true;
        const itemSub = normalizeSubjectName(i.subject).toLowerCase();
        const rawSub = (i.subject || "").toLowerCase();
        const actSub = activeSubject.toLowerCase();
        return itemSub === normalizedActive || rawSub === actSub || rawSub.includes(actSub) || actSub.includes(rawSub);
      });
    }

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter((i: any) =>
        i.name?.toLowerCase().includes(q) ||
        i.title?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [folders, userTests, activeCategory, activeSubject, searchTerm, questionCountsMap]);

  // Helper to check if test is free
  const checkIsFree = (item: any): boolean => {
    if (item._type === "user-test") return true;
    if (item._type === "mock-test") {
      if (item.is_free !== undefined && item.is_free !== null) return !!item.is_free;
      return (!item.price_educoin || item.price_educoin === 0) && (!item.price || item.price === 0);
    }
    if (item.is_free !== undefined && item.is_free !== null) return !!item.is_free;
    if (item.is_paid !== undefined && item.is_paid !== null) return !item.is_paid;
    if (item.price && item.price > 0) return false;
    if (item.price_educoin && item.price_educoin > 0) return false;
    return true;
  };

  // Sort: 1) Items with questions (>0) first, 2) FREE tests first, PAID tests at the END, 3) Topic number or question count
  const sortedItems = useMemo(() => {
    const items = [...filteredItems];

    return items.sort((a: any, b: any) => {
      const countA = a.questions_count || 0;
      const countB = b.questions_count || 0;

      const hasA = countA > 0;
      const hasB = countB > 0;

      // 1. Items with questions come FIRST, empty ones ('Tez orada') LAST
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;

      // 2. FREE tests come FIRST, PAID tests come AT THE END (before empty ones)
      const freeA = checkIsFree(a);
      const freeB = checkIsFree(b);
      if (freeA && !freeB) return -1;
      if (!freeA && freeB) return 1;

      // 3. If both free or both paid, sort by topic / # number if present
      const nameA = a.name || a.title || "";
      const nameB = b.name || b.title || "";
      const matchA = nameA.match(/#(\d+)/) || nameA.match(/^([\d.]+)\s/);
      const matchB = nameB.match(/#(\d+)/) || nameB.match(/^([\d.]+)\s/);
      const numA = matchA ? parseFloat(matchA[1]) : null;
      const numB = matchB ? parseFloat(matchB[1]) : null;

      if (numA !== null && numB !== null) {
        if (numA !== numB) return numA - numB;
      }
      if (numA !== null && numB === null) return -1;
      if (numA === null && numB !== null) return 1;

      // 4. Fallback: sort by questions count descending
      return countB - countA;
    });
  }, [filteredItems, activeCategory]);

  // Subject counts for all categories
  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let items: any[] = [];

    if (activeCategory === "mock-tests") {
      items = mockTests;
    } else if (activeCategory === "user-tests") {
      items = userTests;
    } else {
      items = folders.filter((f: any) => f.category === activeCategory).map((f: any) => ({
        ...f,
        questions_count: questionCountsMap[f.id] || 0,
      }));
    }

    items.forEach((item: any) => {
      if (item.subject) {
        const normalized = normalizeSubjectName(item.subject);
        counts[normalized] = (counts[normalized] || 0) + 1;
      }
    });
    return counts;
  }, [folders, mockTests, userTests, activeCategory]);

  const activeSubjectData = SUBJECTS.find(s => s.id === activeSubject);
  const activeCategoryData = CATEGORIES.find(c => c.id === activeCategory);

  const categoryTitle = activeCategoryData
    ? activeCategoryData.label.toLowerCase().includes("testlar")
      ? activeCategoryData.label
      : `${activeCategoryData.label} testlari`
    : "Testlar";

  const seoTitle = activeSubject && activeCategory === "mavzulashtirilgan"
    ? `${activeSubjectData?.title || activeSubject + " testlari"} — EduContest`
    : `${categoryTitle} — EduContest`;

  const seoDescription = activeSubject && activeCategory === "mavzulashtirilgan"
    ? (activeSubjectData?.description || `${activeSubject} fanidan testlar. EduContest orqali bilimlaringizni sinang.`)
    : `EduContest testlari — ${activeCategoryData?.label || 'barcha'} kategoriyasidagi testlar. Bilimlaringizni sinang.`;

  const generateDiagram = async (topicName: string) => {
    setIsGeneratingDiagram(true);
    setDiagramModal({ open: true, svg: "", title: topicName });
    try {
      const prompt = `"${topicName}" mavzusiga tegishli geometrik SVG diagramma yarating.

JARAYON:
1. Geometrik elementlarni aniqlang (nuqtalar, chiziqlar, doiralar).
2. viewBox="0 0 600 500" ichida har bir nuqta uchun x,y koordinatalarini belgilang.
3. SVG yozing.

QOIDALAR:
- viewBox="0 0 600 500" width="600" height="500".
- Label'larni faqat nuqtalarga qo'ying (A, B, C...). Har bir label o'z nuqtasidan 20px uzoqda.
- Bitta joyda ikki label BOLMASIN.
- Label'larga qo'shimcha harflar QO'SHMANG.
- Chiziqlar ustiga label YOZMANG.
- Doirani <circle> bilan chizing.
- ORTIQCHA DEKORATIV ELEMENT QO'SHMANG.
- Gradient, opacity, filter, defs, style ISHLATMANG.

Faqat <svg> dan </svg> gacha chiqaring.`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            { role: "system", content: "Siz geometrik SVG chizuvchi dasturchisiz. Faqat SVG chiqaring. Birinchi belgi < bo'lishi kerak." },
            { role: "user", content: prompt }
          ],
        }),
      });
      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || "";
      content = content.replace(/```svg\s*/gi, "").replace(/```\s*/g, "").trim();
      const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
      if (svgMatch) {
        setDiagramModal({ open: true, svg: svgMatch[0], title: topicName });
      } else {
        setDiagramModal({ open: true, svg: "", title: topicName });
      }
    } catch {
      setDiagramModal({ open: true, svg: "", title: topicName });
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0f1a]">
      <SEO title={seoTitle} description={seoDescription} canonical={`https://educontest.uz/tests`} />

      {/* Header */}
      <div className="bg-white dark:bg-[#0f1419] border-b border-slate-100 dark:border-white/[0.06]">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Testlar</h1>
              <p className="text-[11px] sm:text-[12px] font-bold text-slate-600 dark:text-slate-300">{filteredItems.length} ta test</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setViewMode(viewMode === "card" ? "table" : "card")}
                className="w-9 h-9 sm:w-auto sm:px-3 sm:py-2 flex items-center justify-center sm:gap-1.5 border-2 border-slate-300 dark:border-white/[0.12] text-slate-700 dark:text-slate-300 rounded-xl text-[13px] font-bold hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
              >
                {viewMode === "card" ? <ChecklistIcon size={18} /> : <WidgetAddIcon size={18} />}
              </button>
              {canAddQuestions && (
                <button
                  onClick={() => navigate("/tests/contributor")}
                  className="hidden sm:flex items-center gap-2 px-3.5 py-2 border-2 border-purple-500 text-purple-600 dark:text-purple-400 rounded-xl text-[13px] font-bold bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-500 hover:text-white transition-all"
                >
                  <DocumentTextIcon size={18} />
                  Savol qo'shish
                </button>
              )}
              <button
                onClick={() => navigate("/tests/builder")}
                className="flex items-center gap-2 px-3 sm:px-3.5 py-2 border-2 border-green-500 text-green-600 dark:text-green-400 rounded-xl text-[12px] sm:text-[13px] font-bold bg-green-50 dark:bg-green-500/10 hover:bg-green-500 hover:text-white transition-all"
              >
                <AddCircleIcon size={18} />
                <span className="hidden sm:inline">Test yaratish / Pul ishlash</span>
                <span className="sm:hidden">Yaratish</span>
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 sm:gap-2.5 mb-3 sm:mb-4 overflow-x-auto pb-1.5 scrollbar-hide">
            {visibleCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-[12px] font-extrabold transition-all whitespace-nowrap flex-shrink-0 ${isActive
                      ? "text-white shadow-sm"
                      : "bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1]"
                    }`}
                  style={isActive ? { background: cat.color } : {}}
                >
                  <Icon size={20} className="shrink-0" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative mt-3 sm:mt-4">
            <MagnifierIcon size={24} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-11 pr-10 bg-white dark:bg-[#121824] border-2 border-slate-200 dark:border-white/10 rounded-2xl text-[14px] font-extrabold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#E8192C] shadow-xs transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <CloseCircleIcon size={20} className="text-slate-400 dark:text-slate-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        {isCategoryLoading ? (
          viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-40 bg-white dark:bg-[#0f1419] rounded-2xl border border-slate-100 dark:border-white/[0.06] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-white dark:bg-[#0f1419] rounded-xl border border-slate-100 dark:border-white/[0.06] animate-pulse" />
              ))}
            </div>
          )
        ) : !activeSubject && !searchTerm && activeCategory !== "user-tests" ? (
          /* Step 1: Subject Selection Grid when no subject is selected yet */
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {SUBJECTS.map((sub) => {
                const Icon = sub.icon;
                const count = subjectCounts[sub.id] || 0;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubject(sub.id)}
                    className="group relative flex flex-col justify-between p-4 rounded-2xl border-2 border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0f1419] hover:border-[#E8192C] dark:hover:border-[#E8192C] hover:shadow-md transition-all duration-200 text-left overflow-hidden cursor-pointer"
                  >
                    <div
                      className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none"
                      style={{ background: sub.color_from || sub.color }}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${sub.color_from || sub.color}, ${sub.color_to || sub.color})`,
                          }}
                        >
                          <Icon size={22} />
                        </div>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
                          {count} test
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-[#E8192C] transition-colors">
                        {sub.id}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {sub.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-[11.5px] font-extrabold text-[#E8192C] group-hover:translate-x-1 transition-transform">
                      <span>Testlarni ochish</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Testlar topilmadi</p>
          </div>
        ) : (
          <div>
            {/* Active Subject Banner when a subject is selected */}
            {activeSubject && activeSubject !== "all" && (
              <div className="flex items-center justify-between mb-4 bg-white dark:bg-[#0f1419] p-3.5 rounded-2xl border border-slate-100 dark:border-white/[0.06] shadow-xs">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${activeSubjectData?.color_from || activeSubjectData?.color || '#E8192C'}, ${activeSubjectData?.color_to || activeSubjectData?.color || '#E8192C'})`,
                    }}
                  >
                    {activeSubjectData?.icon ? <activeSubjectData.icon size={20} /> : <BookOpen size={20} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {activeSubject} testlari
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Jami {sortedItems.length} ta test topildi
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubject(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Barcha fanlar</span>
                </button>
              </div>
            )}

            {viewMode === "card" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  <AnimatePresence>
                    {sortedItems.slice(0, visibleCount).map((item: any, idx: number) => (
                      <TestCard
                        key={item.id}
                        item={item}
                        index={idx}
                        subjects={SUBJECTS}
                        onClick={() => {
                          if (item.questions_count <= 0) {
                            toast.info("Tez orada! Ushbu bo'limga savollar tez orada joylanadi.");
                            return;
                          }
                          if (item._type === "user-test") {
                            navigate(`/tests/builder/${item.id}/take`);
                          } else if (item._type === "mock-test") {
                            navigate(`/mock-tests/${item.slug || buildMockTestSlug(item) || item.id}/info`);
                          } else {
                            setSelectedItem(item);
                          }
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                {visibleCount < sortedItems.length && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setVisibleCount(v => v + 10)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <AltArrowRightIcon className="w-4 h-4 rotate-90" />
                      Ko'proq yuklash ({sortedItems.length - visibleCount} ta qoldi)
                    </button>
                  </div>
                )}
              </div>
            ) : (
          <div className="bg-white dark:bg-[#0f1419] rounded-2xl border border-slate-100 dark:border-white/[0.06] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-4 py-3.5 text-[12px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Nomi</th>
                  <th className="px-4 py-3.5 text-[12px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Fan</th>
                  <th className="px-4 py-3.5 text-[12px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Savollar</th>
                  <th className="px-4 py-3.5 text-[12px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Vaqt</th>
                  <th className="px-4 py-3.5 text-[12px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Narx</th>
                  <th className="px-4 py-3.5 text-[12px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item: any) => {
                  const subject = SUBJECTS.find(s => s.id === item.subject);
                  const isFree = item._type === "user-test" 
                    ? true 
                    : item._type === "mock-test" 
                      ? (item.is_free || (!item.price_educoin || item.price_educoin === 0)) 
                      : (!item.price || item.price === 0);
                  const hasNoQuestions = !item.questions_count || item.questions_count <= 0;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                      onClick={() => {
                        if (hasNoQuestions) {
                          toast.info("Tez orada! Ushbu bo'limga savollar tez orada joylanadi.");
                          return;
                        }
                        if (item._type === "user-test") {
                          navigate(`/tests/builder/${item.id}/take`);
                          return;
                        }
                        if (item._type === "mock-test") {
                          navigate(`/mock-tests/${item.slug || buildMockTestSlug(item) || item.id}/info`);
                          return;
                        } else {
                          setSelectedItem(item);
                        }
                      }}
                    >
                      <td className="px-4 py-3.5 text-[13.5px] font-medium text-slate-900 dark:text-white">
                        {item.name || item.title}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-[11.5px] font-extrabold px-2.5 py-1 rounded-md"
                          style={{ background: subject?.bg || "#f1f5f9", color: subject?.color || "#334155" }}
                        >
                          {item.subject || "Umumiy"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-extrabold text-slate-800 dark:text-slate-200">
                        {hasNoQuestions ? (
                          <span className="flex items-center gap-1 text-[#0284C7] dark:text-sky-300 font-extrabold text-[12px]">
                            <Lock className="w-3.5 h-3.5 text-[#0284C7] dark:text-sky-300" /> Tez orada
                          </span>
                        ) : (
                          item.questions_count
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-extrabold text-slate-800 dark:text-slate-200">{item.duration_minutes || 30} daqiqa</td>
                      <td className="px-4 py-3.5">
                        {isFree ? (
                          <span className="text-[11.5px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md">Bepul</span>
                        ) : (
                          <span className="text-[13px] font-extrabold text-slate-900 dark:text-white">
                            {item._type === "mock-test" ? `${item.price_educoin || 0} EC` : `${item.price} so'm`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {hasNoQuestions ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info("Tez orada! Ushbu bo'limga savollar tez orada joylanadi.");
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#0284C7] text-white rounded-xl text-[11.5px] font-extrabold shadow-xs hover:bg-[#0369A1] transition-all"
                          >
                            <Lock className="w-3.5 h-3.5 text-white" /> Tez orada
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item._type === "user-test") {
                                navigate(`/tests/builder/${item.id}/take`);
                              } else if (item._type === "mock-test") {
                                navigate(`/mock-tests/${item.slug || buildMockTestSlug(item) || item.id}/info`);
                              } else {
                                setSelectedItem(item);
                              }
                            }}
                            className="flex items-center justify-center px-3.5 py-1.5 bg-[#E8192C] text-white rounded-xl text-[12px] font-extrabold hover:bg-red-700 transition-all shadow-sm"
                          >
                            Ko'rish
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}
      </div>

      {/* Action Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white dark:bg-[#0f1419] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">{selectedItem.name || selectedItem.title}</h3>
                <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <CloseCircleIcon size={22} className="text-slate-600 dark:text-slate-300" />
                </button>
              </div>
              <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mt-1.5">{selectedItem.questions_count || 0} ta savol</p>
            </div>
            <div className="p-4 space-y-2.5">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  if (selectedItem._type === "mock-test") {
                    navigate(`/mock-tests/${selectedItem.slug || buildMockTestSlug(selectedItem) || selectedItem.id}/info`);
                  } else if (selectedItem._type === "user-test") {
                    navigate(`/tests/builder/${selectedItem.id}/take`);
                  } else {
                    navigate(`/tests/folder/${selectedItem.id || slugify(selectedItem.name)}?mode=imtixon`);
                  }
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0 group-hover:bg-red-500 transition-colors shadow-xs">
                  <TargetIcon size={24} className="text-red-600 dark:text-red-400 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-extrabold text-slate-900 dark:text-white">Imtihon rejimi</p>
                  <p className="text-[12px] text-slate-600 dark:text-slate-300 font-semibold mt-0.5">Vaqt cheklovi bilan test ishlash</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  if (selectedItem._type === "mock-test") {
                    navigate(`/mock-tests/${selectedItem.slug || buildMockTestSlug(selectedItem) || selectedItem.id}/info`);
                  } else if (selectedItem._type === "user-test") {
                    navigate(`/tests/builder/${selectedItem.id}/take`);
                  } else {
                    navigate(`/tests/folder/${selectedItem.id || slugify(selectedItem.name)}?mode=mashq`);
                  }
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center shrink-0 group-hover:bg-blue-500 transition-colors shadow-xs">
                  <BoltIcon size={24} className="text-blue-600 dark:text-blue-400 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-extrabold text-slate-900 dark:text-white">Mashq qilish</p>
                  <p className="text-[12px] text-slate-600 dark:text-slate-300 font-semibold mt-0.5">Vaqtsiz mashq qilish imkoniyati</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI DIAGRAM MODAL ── */}
      {diagramModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDiagramModal({ open: false, svg: "", title: "" })}>
          <div className="bg-white dark:bg-[#0f1419] rounded-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                  <Pen className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">AI Chizma</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{diagramModal.title}</p>
                </div>
              </div>
              <button onClick={() => setDiagramModal({ open: false, svg: "", title: "" })}>
                <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center min-h-[300px] bg-white dark:bg-slate-900">
              {isGeneratingDiagram ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
                  <p className="text-[12px] text-slate-400">Diagramma yaratilmoqda...</p>
                </div>
              ) : diagramModal.svg ? (
                <div
                  className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: diagramModal.svg }}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-12">
                  <p className="text-[12px] text-slate-400">Diagramma yaratib bo'lmadi. Qaytadan urinib ko'ring.</p>
                  <button
                    onClick={() => generateDiagram(diagramModal.title)}
                    className="px-4 py-2 rounded-xl text-[12px] font-medium text-white"
                    style={{ background: "#E8192C" }}
                  >
                    Qaytadan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Test Card ────────────────────────────────────────
const TestCard = ({ item, index, onClick, subjects }: { item: any; index: number; onClick: () => void; subjects: any[] }) => {
  const isUserTest = item._type === "user-test";
  const subject = subjects.find((s: any) => s.id === item.subject);
  const Icon = subject?.icon || BookOpen;
  const isPurchased = item.isPurchased;
  const isFree = isUserTest 
    ? true 
    : item._type === "mock-test" 
      ? (item.is_free || (!item.price_educoin || item.price_educoin === 0)) 
      : (!item.price || item.price === 0);
  const hasNoQuestions = !item.questions_count || item.questions_count <= 0;

  const now = new Date();
  const opensAt = item.opens_at || null;
  const closesAt = item.closes_at || null;

  const parseStoredDate = (val: string): Date | null => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const opensDate = parseStoredDate(opensAt);
  const closesDate = parseStoredDate(closesAt);
  const isActive = (!opensDate || now >= opensDate) && (!closesDate || now <= closesDate);
  const isUpcoming = opensDate && now < opensDate;
  const isEnded = closesDate && now > closesDate;
  const minutesUntilStart = opensDate ? Math.max(0, Math.ceil((opensDate.getTime() - now.getTime()) / 60000)) : 0;
  const minutesUntilEnd = closesDate ? Math.max(0, Math.ceil((closesDate.getTime() - now.getTime()) / 60000)) : 0;

  const toLocalDatetimeString = (val: string): string => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -4 }}
      onClick={() => {
        if (hasNoQuestions) {
          toast.info("Tez orada! Ushbu bo'limga savollar tez orada joylanadi.");
          return;
        }
        onClick();
      }}
      className={`rounded-2xl border p-3.5 sm:p-5 cursor-pointer hover:shadow-lg transition-all group ${
        hasNoQuestions
          ? "bg-[#EAF5FF]/90 dark:bg-sky-950/30 border-sky-200/80 dark:border-sky-800/60 hover:border-sky-300 dark:hover:border-sky-700"
          : isPurchased
          ? "bg-gradient-to-br from-green-50/90 via-emerald-50/40 to-green-100/70 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-green-900/40 border-green-300/80 dark:border-green-700/60 hover:border-green-400 dark:hover:border-green-500 shadow-xs hover:shadow-green-200/50"
          : !isFree
          ? "bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-100/70 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/40 border-amber-300/80 dark:border-amber-700/60 hover:border-amber-400 dark:hover:border-amber-500 shadow-xs hover:shadow-amber-200/50 dark:hover:shadow-amber-950/50"
          : "bg-white dark:bg-[#0f1419] border-slate-100 dark:border-white/[0.06] hover:border-slate-200 dark:hover:border-white/[0.12]"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2.5 sm:mb-3 gap-1.5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs shrink-0"
            style={{
              background: hasNoQuestions
                ? "#dbeafe"
                : !isFree
                ? "#fef3c7"
                : (subject?.bg || (isUserTest ? "#fff7ed" : "#f1f5f9"))
            }}
          >
            <Icon
              className="w-5 h-5 sm:w-7 sm:h-7"
              style={{
                color: hasNoQuestions
                  ? "#0284C7"
                  : !isFree
                  ? "#d97706"
                  : (subject?.color || (isUserTest ? "#f59e0b" : "#64748b"))
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {hasNoQuestions ? (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold bg-sky-100 dark:bg-sky-500/20 text-[#0284C7] dark:text-sky-300 flex items-center gap-1">
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284C7] dark:text-sky-300" /> Tez orada
            </span>
          ) : (
            <>
              {isUserTest && (
                <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold ${isActive ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" :
                    isUpcoming ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                      "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400"
                  }`}>
                  {isActive ? "Faol" : isUpcoming ? "Kutilmoqda" : "Tugagan"}
                </span>
              )}
              <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold ${
                isPurchased
                  ? "bg-green-500 text-white shadow-xs"
                  : isFree
                  ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-amber-500 text-white shadow-xs"
              }`}>
                {isPurchased ? "Sotib olingan" : isFree ? "Bepul" : item._type === "mock-test" ? `${item.price_educoin || 0} EC` : "Pullik"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[13.5px] sm:text-[16px] font-bold sm:font-medium text-slate-900 dark:text-white mb-2 line-clamp-2 transition-colors leading-tight sm:leading-snug min-h-[36px] sm:min-h-[44px]">
        {item.name || item.title}
      </h3>

      {/* Description for user tests */}
      {isUserTest && item.description && (
        <p className="text-[11.5px] sm:text-[12.5px] text-slate-400 dark:text-slate-500 mb-2.5 line-clamp-2 leading-relaxed font-medium">
          {item.description}
        </p>
      )}

      {/* Creator for user tests */}
      {isUserTest && item.creator_name && (
        <p className="text-[10.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 mb-2 font-semibold truncate">
          O'qituvchi: {item.creator_name}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center flex-wrap gap-2 sm:gap-3.5 text-[11px] sm:text-[13px] font-bold text-slate-700 dark:text-slate-200 mb-2">
        {hasNoQuestions ? (
          <span className="flex items-center gap-1 text-[#0284C7] dark:text-sky-300 font-bold">
            <Lock className="w-3.5 h-3.5 text-[#0284C7] dark:text-sky-300" /> Tez orada
          </span>
        ) : (
          <span className="flex items-center gap-1 sm:gap-1.5">
            <DocumentTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-600 dark:text-slate-300" />
            {item.questions_count} savol
          </span>
        )}
        <span className="flex items-center gap-1 sm:gap-1.5">
          <ClockCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-600 dark:text-slate-300" />
          {item.duration_minutes || item.time_limit_min || 30} daq
        </span>
      </div>

      {/* Teacher test time details */}
      {isUserTest && (
        <div className="mt-2 pt-2 border-t border-slate-50 dark:border-white/[0.04] space-y-1.5">
          {opensAt && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 dark:text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Boshlanish: {toLocalDatetimeString(opensAt)}</span>
            </div>
          )}
          {closesAt && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 dark:text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tugash: {toLocalDatetimeString(closesAt)}</span>
            </div>
          )}
          {isUpcoming && minutesUntilStart > 0 && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-amber-500 dark:text-amber-400 font-bold">
              <Timer className="w-3.5 h-3.5" />
              <span>{Math.floor(minutesUntilStart / 60)} soat {minutesUntilStart % 60} daqiqa dan keyin boshlanadi</span>
            </div>
          )}
          {isActive && closesAt && minutesUntilEnd > 0 && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-green-500 dark:text-green-400 font-bold">
              <Timer className="w-3.5 h-3.5" />
              <span>{Math.floor(minutesUntilEnd / 60)} soat {minutesUntilEnd % 60} daqiqa qoldi</span>
            </div>
          )}
          {isEnded && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 dark:text-slate-500">
              <Timer className="w-3.5 h-3.5" />
              <span>Vaqt tugagan</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom */}
      <div className="flex items-center justify-between gap-1 mt-2.5 pt-2.5 sm:mt-3 sm:pt-3 border-t border-slate-200/60 dark:border-white/[0.06] min-w-0">
        {item.subject ? (
          <span className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold truncate max-w-[50%]">
            {item.subject}
          </span>
        ) : <div />}
        {hasNoQuestions ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.info("Tez orada! Ushbu bo'limga savollar tez orada joylanadi.");
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-[#0284C7] text-white rounded-xl text-[11px] sm:text-[12px] font-bold hover:bg-[#0369A1] transition-all shadow-xs shrink-0"
          >
            <Lock className="w-3 h-3 text-white" /> Tez orada
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11.5px] sm:text-[13px] font-extrabold transition-all shadow-xs shrink-0 ${
              isPurchased
                ? "bg-[#10b981] text-white hover:bg-[#059669]"
                : !isFree
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                : "bg-[#E8192C] text-white hover:bg-[#C8001A]"
            }`}
          >
            {isPurchased ? "Boshlash" : isFree ? "Ko'rish" : "Sotib olish"}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Tests;
