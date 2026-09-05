import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { TrashBinMinimalisticIcon } from "@solar-icons/react/bold-duotone/trash-bin-minimalistic";
import { CheckReadIcon } from "@solar-icons/react/bold-duotone/check-read";
import { CloseSquareIcon } from "@solar-icons/react/bold-duotone/close-square";
import { FileTextIcon } from "@solar-icons/react/bold-duotone/file-text";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { SendSquareIcon } from "@solar-icons/react/bold-duotone/send-square";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { CloseCircleIcon } from "@solar-icons/react/bold-duotone/close-circle";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { ArchiveIcon } from "@solar-icons/react/bold-duotone/archive";
import { AltArrowDownIcon } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { AltArrowUpIcon } from "@solar-icons/react/bold-duotone/alt-arrow-up";
import { UploadMinimalisticIcon } from "@solar-icons/react/bold-duotone/upload-minimalistic";
import { CpuIcon } from "@solar-icons/react/bold-duotone/cpu";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { Image as ImageIcon, File, ListCheck as CheckListIcon } from "lucide-react";
import { DocumentIcon } from "@solar-icons/react/bold-duotone/document";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import SEO from "@/components/SEO";
import mammoth from "mammoth";
import "mathlive";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type TestStatus = "draft" | "pending" | "active" | "archived" | "rejected";
type AnswerType = "variants" | "written" | "truefalse" | "matching" | "listening" | "reading" | "fillblank";
type ShowResult = "immediate" | "after_review" | "hidden";

interface TestData {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  time_limit_min: number;
  shuffle_order: boolean;
  show_result: ShowResult;
  fullscreen_mode: boolean;
  max_attempts: number;
  cover_image_url: string;
  opens_at: string;
  closes_at: string;
  status: TestStatus;
  approved_by: string;
  approved_at: string;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
  questions_count?: number;
}

interface QuestionData {
  id: string;
  test_id: string;
  order_index: number;
  question_text: string;
  question_image: string;
  answer_type: AnswerType;
  explanation: string;
  points: number;
  options?: AnswerOption[];
}

interface AnswerOption {
  id: string;
  label: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

interface BuilderTestProps {
  isAdmin?: boolean;
}

const BuilderTest = ({ isAdmin = true }: BuilderTestProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedTestId, setSelectedTestId] = useState<string | null>(searchParams.get("testId"));
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TestStatus>("all");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingTestId, setRejectingTestId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [formDraft, setFormDraft] = useState<Partial<TestData>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState("");
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<any[]>([]);
  const [aiRawText, setAiRawText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectSourceTestId, setCollectSourceTestId] = useState<string | null>(null);
  const [collectSourceQuestions, setCollectSourceQuestions] = useState<any[]>([]);
  const [collectSelected, setCollectSelected] = useState<Set<string>>(new Set());
  const [collectLoading, setCollectLoading] = useState(false);
  const [collectImporting, setCollectImporting] = useState(false);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTestId, setAssignTestId] = useState<string | null>(null);
  const [assignSearchTerm, setAssignSearchTerm] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const { data: tests = [], isLoading: testsLoading } = useQuery({
    queryKey: ["builder-tests", statusFilter, searchTerm, isAdmin, user?.id],
    queryFn: async () => {
      let testIds: string[] | null = null;

      // For non-admin users, fetch their assigned test IDs first
      if (!isAdmin && user?.id) {
        const { data: myTests } = await (supabase as any)
          .from("builder_tests")
          .select("id")
          .eq("creator_id", user.id);
        const { data: assignedTests } = await (supabase as any)
          .from("builder_test_assignments")
          .select("test_id")
          .eq("user_id", user.id);
        const { data: activeTests } = await (supabase as any)
          .from("builder_tests")
          .select("id")
          .eq("status", "active");

        const idSet = new Set<string>();
        (myTests || []).forEach((t: any) => idSet.add(t.id));
        (assignedTests || []).forEach((a: any) => idSet.add(a.test_id));
        (activeTests || []).forEach((t: any) => idSet.add(t.id));
        testIds = Array.from(idSet);
        if (testIds.length === 0) return [];
      }

      let query = (supabase as any).from("builder_tests").select("*");
      if (testIds) query = query.in("id", testIds);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (searchTerm) query = query.ilike("title", `%${searchTerm}%`);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      const testsWithCount = await Promise.all(
        (data || []).map(async (t: any) => {
          const { count } = await (supabase as any)
            .from("builder_questions")
            .select("*", { count: "exact", head: true })
            .eq("test_id", t.id);
          return { ...t, questions_count: count || 0 };
        })
      );
      return testsWithCount as TestData[];
    },
  });

  const { data: selectedTest } = useQuery({
    queryKey: ["builder-test", selectedTestId],
    queryFn: async () => {
      if (!selectedTestId) return null;
      const { data, error } = await (supabase as any)
        .from("builder_tests")
        .select("*")
        .eq("id", selectedTestId)
        .single();
      if (error) throw error;
      return data as TestData;
    },
    enabled: !!selectedTestId,
  });

  // Sync form draft when selectedTest loads/changes
  useEffect(() => {
    if (selectedTest) {
      setFormDraft({ ...selectedTest });
      setHasChanges(false);
    }
  }, [selectedTest?.id]);

  const updateDraft = (patch: Partial<TestData>) => {
    setFormDraft((prev) => ({ ...prev, ...patch }));
    setHasChanges(true);
  };

  const handleSaveTest = () => {
    if (!formDraft.id) return;
    saveTestMutation.mutate(formDraft);
    setHasChanges(false);
  };

  // Fetch test attempts for owner/admin view
  const { data: testAttempts = [], refetch: refetchAttempts } = useQuery({
    queryKey: ["builder-test-attempts", selectedTestId],
    queryFn: async () => {
      if (!selectedTestId) return [];
      const { data: attempts, error } = await (supabase as any)
        .from("builder_test_attempts")
        .select("*")
        .eq("test_id", selectedTestId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Attempts fetch error:", error);
        return [];
      }
      if (!attempts || attempts.length === 0) return [];

      const attemptIds = attempts.map((a: any) => a.id);
      const { data: allAnswers } = await (supabase as any)
        .from("builder_attempt_answers")
        .select("*")
        .in("attempt_id", attemptIds);

      const answersByAttempt: Record<string, any[]> = {};
      (allAnswers || []).forEach((ans: any) => {
        if (!answersByAttempt[ans.attempt_id]) answersByAttempt[ans.attempt_id] = [];
        answersByAttempt[ans.attempt_id].push(ans);
      });

      const { data: questionsData } = await (supabase as any)
        .from("builder_questions")
        .select("id, question_text, order_index, points")
        .eq("test_id", selectedTestId)
        .order("order_index");

      const questionsMap: Record<string, any> = {};
      (questionsData || []).forEach((q: any) => { questionsMap[q.id] = q; });

      const questionIds = (questionsData || []).map((q: any) => q.id);
      let optionsMap: Record<string, any[]> = {};
      if (questionIds.length > 0) {
        const { data: allOptions } = await (supabase as any)
          .from("builder_answer_options")
          .select("id, question_id, label, option_text, is_correct, order_index")
          .in("question_id", questionIds)
          .order("order_index");
        if (allOptions) {
          (allOptions as any[]).forEach((opt: any) => {
            if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
            optionsMap[opt.question_id].push(opt);
          });
        }
      }

      const userIds = [...new Set(attempts.map((a: any) => a.student_id).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesByUserId } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, avatar_url, email")
          .in("user_id", userIds);
        if (profilesByUserId) {
          profilesByUserId.forEach((p: any) => { profilesMap[p.user_id] = p; });
        }
        const missingIds = userIds.filter((id: string) => !profilesMap[id]);
        if (missingIds.length > 0) {
          const { data: profilesById } = await (supabase as any)
            .from("profiles")
            .select("id, user_id, full_name, avatar_url, email")
            .in("id", missingIds);
          if (profilesById) {
            profilesById.forEach((p: any) => {
              const key = p.user_id || p.id;
              if (!profilesMap[key]) profilesMap[key] = p;
            });
          }
        }
      }

      return attempts.map((a: any) => {
        const attemptAnswers = answersByAttempt[a.id] || [];
        const details = attemptAnswers.map((ans: any) => {
          const q = questionsMap[ans.question_id];
          const opts = optionsMap[ans.question_id] || [];
          const selectedOpt = opts.find((o: any) => o.id === ans.selected_option_id);
          const correctOpt = opts.find((o: any) => o.is_correct);
          return {
            question_text: q?.question_text || "Savol",
            order_index: q?.order_index || 0,
            is_correct: ans.is_correct,
            points_earned: ans.points_earned || 0,
            max_points: q?.points || 5,
            selected_option_id: ans.selected_option_id,
            selected_label: selectedOpt?.label || "—",
            selected_text: selectedOpt?.option_text || "Javob berilmagan",
            correct_label: correctOpt?.label || "—",
            correct_text: correctOpt?.option_text || "",
            all_options: opts,
            written_answer: ans.written_answer || null,
          };
        }).sort((x: any, y: any) => x.order_index - y.order_index);

        const totalQ = a.correct_count + a.wrong_count;
        const accuracy = totalQ > 0 ? Math.round((a.correct_count / totalQ) * 100) : 0;
        const min = Math.floor((a.time_spent_sec || 0) / 60);
        const sec = (a.time_spent_sec || 0) % 60;

        return {
          ...a,
          student_name: profilesMap[a.student_id]?.full_name || "Noma'lum",
          student_avatar: profilesMap[a.student_id]?.avatar_url || null,
          details,
          accuracy,
          time_formatted: `${min}:${sec.toString().padStart(2, "0")}`,
          attempt_answers: attemptAnswers,
        };
      });
    },
    enabled: !!selectedTestId,
  });

  // LIVE: Subscribe to realtime changes on builder_test_attempts (Scoped to INSERT & UPDATE)
  useEffect(() => {
    if (!selectedTestId) return;
    const channel = supabase
      .channel(`live-attempts-${selectedTestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "builder_test_attempts", filter: `test_id=eq.${selectedTestId}` },
        () => {
          refetchAttempts();
          refetchLiveAttempts();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "builder_test_attempts", filter: `test_id=eq.${selectedTestId}` },
        () => {
          refetchAttempts();
          refetchLiveAttempts();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTestId]);

  // LIVE: Fetch active attempts (finished_at IS NULL) — users currently taking the test
  const { data: liveAttempts = [], refetch: refetchLiveAttempts } = useQuery({
    queryKey: ["builder-live-attempts", selectedTestId],
    queryFn: async () => {
      if (!selectedTestId) return [];
      const { data: attempts, error } = await (supabase as any)
        .from("builder_test_attempts")
        .select("*")
        .eq("test_id", selectedTestId)
        .is("finished_at", null)
        .order("started_at", { ascending: false });
      if (error || !attempts || attempts.length === 0) return [];

      const userIds = [...new Set(attempts.map((a: any) => a.student_id).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesByUserId } = await (supabase as any)
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        if (profilesByUserId) {
          profilesByUserId.forEach((p: any) => { profilesMap[p.user_id] = p; });
        }
        const missingIds = userIds.filter((id: string) => !profilesMap[id]);
        if (missingIds.length > 0) {
          const { data: profilesById } = await (supabase as any)
            .from("profiles")
            .select("id, user_id, full_name, avatar_url")
            .in("id", missingIds);
          if (profilesById) {
            profilesById.forEach((p: any) => {
              const key = p.user_id || p.id;
              if (!profilesMap[key]) profilesMap[key] = p;
            });
          }
        }
      }

      const answerCounts: Record<string, number> = {};
      const attemptIds = attempts.map((a: any) => a.id);
      if (attemptIds.length > 0) {
        const { data: answers } = await (supabase as any)
          .from("builder_attempt_answers")
          .select("attempt_id")
          .in("attempt_id", attemptIds);
        (answers || []).forEach((a: any) => {
          answerCounts[a.attempt_id] = (answerCounts[a.attempt_id] || 0) + 1;
        });
      }

      const totalQuestionsResult = await (supabase as any)
        .from("builder_questions")
        .select("id", { count: "exact", head: true })
        .eq("test_id", selectedTestId);
      const totalQuestions = totalQuestionsResult.count || 0;

      return attempts.map((a: any) => {
        const elapsed = Math.floor((Date.now() - new Date(a.started_at).getTime()) / 1000);
        return {
          ...a,
          student_name: profilesMap[a.student_id]?.full_name || "Noma'lum",
          student_avatar: profilesMap[a.student_id]?.avatar_url || null,
          answered_count: answerCounts[a.id] || 0,
          total_questions: totalQuestions,
          elapsed_sec: elapsed,
        };
      });
    },
    enabled: !!selectedTestId,
    refetchInterval: 10000,
  });

  const { data: questions = [], refetch: refetchQuestions } = useQuery({
    queryKey: ["builder-questions", selectedTestId],
    queryFn: async () => {
      if (!selectedTestId) return [];
      const { data, error } = await (supabase as any)
        .from("builder_questions")
        .select("*")
        .eq("test_id", selectedTestId)
        .order("order_index");
      if (error) throw error;
      const questionsWithOptions = await Promise.all(
        (data || []).map(async (q: any) => {
          const { data: options } = await (supabase as any)
            .from("builder_answer_options")
            .select("*")
            .eq("question_id", q.id)
            .order("order_index");
          return { ...q, options: options || [] };
        })
      );
      return questionsWithOptions as QuestionData[];
    },
    enabled: !!selectedTestId,
  });

  const createTestMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any)
        .from("builder_tests")
        .insert({
          title: "Yangi test",
          description: "",
          subject: "",
          grade: "",
          time_limit_min: 30,
          shuffle_order: false,
          show_result: "immediate",
          fullscreen_mode: false,
          max_attempts: 1,
          cover_image_url: "",
          opens_at: null,
          closes_at: null,
          status: isAdmin ? "active" : "draft",
          creator_id: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["builder-tests"] });
      setSelectedTestId(data.id);
      setIsEditing(true);
      toast({ title: "Test yaratildi" });
    },
  });

  const saveTestMutation = useMutation({
    mutationFn: async (test: Partial<TestData>) => {
      const { error } = await (supabase as any)
        .from("builder_tests")
        .update(test)
        .eq("id", test.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["builder-tests"] });
      queryClient.invalidateQueries({ queryKey: ["builder-test", selectedTestId] });
      setIsEditing(false);
      toast({ title: "Saqlandi" });
    },
  });

  const submitForApprovalMutation = useMutation({
    mutationFn: async (testId: string) => {
      const { error } = await (supabase as any)
        .from("builder_tests")
        .update({ status: "pending" })
        .eq("id", testId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["builder-tests"] });
      queryClient.invalidateQueries({ queryKey: ["builder-test", selectedTestId] });
      toast({ title: "Tekshirishga yuborildi" });
    },
  });

  const approveTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const { error } = await (supabase as any)
        .from("builder_tests")
        .update({
          status: "active",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", testId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["builder-tests"] });
      queryClient.invalidateQueries({ queryKey: ["builder-test", selectedTestId] });
      toast({ title: "Test tasdiqlandi" });
    },
  });

  const rejectTestMutation = useMutation({
    mutationFn: async ({ testId, reason }: { testId: string; reason: string }) => {
      const { error } = await (supabase as any)
        .from("builder_tests")
        .update({ status: "rejected", rejection_reason: reason })
        .eq("id", testId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["builder-tests"] });
      queryClient.invalidateQueries({ queryKey: ["builder-test", selectedTestId] });
      setShowRejectModal(false);
      setRejectReason("");
      setRejectingTestId(null);
      toast({ title: "Test rad etildi" });
    },
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (id: string) => {
      // builder_answer_options has ON DELETE CASCADE from builder_questions
      // builder_attempt_answers.question_id has ON DELETE SET NULL
      // So we just delete the test and everything cascades
      const { error } = await (supabase as any)
        .from("builder_tests")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["builder-tests"] });
      setSelectedTestId(null);
      setIsEditing(false);
      toast({ title: "O'chirildi" });
    },
  });

  const saveQuestionMutation = useMutation({
    mutationFn: async (question: Partial<QuestionData> & { test_id: string }) => {
      if (question.id) {
        const { error } = await (supabase as any)
          .from("builder_questions")
          .update({
            question_text: question.question_text,
            question_image: question.question_image,
            answer_type: question.answer_type,
            explanation: question.explanation,
            points: question.points,
          })
          .eq("id", question.id);
        if (error) throw error;
        if (question.options) {
          for (const opt of question.options) {
            await (supabase as any)
              .from("builder_answer_options")
              .upsert({
                id: opt.id || undefined,
                question_id: question.id,
                label: opt.label,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                order_index: opt.order_index,
              });
          }
        }
      } else {
        const { data, error } = await (supabase as any)
          .from("builder_questions")
          .insert({
            test_id: question.test_id,
            order_index: question.order_index || 1,
            question_text: question.question_text || "",
            question_image: question.question_image || "",
            answer_type: question.answer_type || "variants",
            explanation: question.explanation || "",
            points: question.points || 5,
          })
          .select()
          .single();
        if (error) throw error;
        if (question.answer_type === "variants" && data) {
          const defaultOptions = ["A", "B", "C", "D"].map((label, idx) => ({
            question_id: data.id,
            label,
            option_text: "",
            is_correct: idx === 0,
            order_index: idx,
          }));
          await (supabase as any).from("builder_answer_options").insert(defaultOptions);
        }
        return data;
      }
    },
    onSuccess: () => refetchQuestions(),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      // builder_answer_options cascades from builder_questions
      // builder_attempt_answers.question_id ON DELETE SET NULL
      const { error } = await (supabase as any)
        .from("builder_questions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchQuestions();
      toast({ title: "Savol o'chirildi" });
    },
  });

  const deleteAllQuestionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTestId) return;
      // builder_answer_options cascades; builder_attempt_answers.question_id SET NULL
      const { error } = await (supabase as any)
        .from("builder_questions")
        .delete()
        .eq("test_id", selectedTestId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchQuestions();
      toast({ title: "Barcha savollar o'chirildi" });
    },
  });

  // Assignment queries
  const { data: assignments = [], refetch: refetchAssignments } = useQuery({
    queryKey: ["builder-test-assignments", assignTestId],
    queryFn: async () => {
      if (!assignTestId) return [];
      const { data, error } = await (supabase as any)
        .from("builder_test_assignments")
        .select("*")
        .eq("test_id", assignTestId);
      if (error) {
        console.error("Assignments fetch error:", error);
        return [];
      }
      if (!data || data.length === 0) return [];

      const userIds = data.map((a: any) => a.user_id);
      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("user_id, full_name, avatar_url, email")
        .in("user_id", userIds);

      const profilesMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });

      return data.map((a: any) => ({
        ...a,
        user_name: profilesMap[a.user_id]?.full_name || profilesMap[a.user_id]?.email || "Noma'lum",
        user_avatar: profilesMap[a.user_id]?.avatar_url || null,
      }));
    },
    enabled: !!assignTestId,
  });

  const { data: searchUsers = [], isLoading: searchUsersLoading } = useQuery({
    queryKey: ["search-users-for-assign", assignSearchTerm],
    queryFn: async () => {
      if (!assignSearchTerm || assignSearchTerm.length < 2) return [];
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("user_id, full_name, avatar_url, email")
        .or(`full_name.ilike.%${assignSearchTerm}%,email.ilike.%${assignSearchTerm}%`)
        .limit(20);
      if (error) {
        console.error("User search error:", error);
        return [];
      }
      return data || [];
    },
    enabled: assignSearchTerm.length >= 2,
  });

  const assignUserMutation = useMutation({
    mutationFn: async ({ testId, userId }: { testId: string; userId: string }) => {
      const { error } = await (supabase as any)
        .from("builder_test_assignments")
        .insert({ test_id: testId, user_id: userId, assigned_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["builder-test-assignments"] });
      toast({ title: "Foydalanuvchi tayinlandi" });
      setAssignSearchTerm("");
    },
    onError: (err: any) => {
      toast({ title: "Xato", description: err.message || "Tayinlashda xato yuz berdi", variant: "destructive" });
    },
  });

  const unassignUserMutation = useMutation({
    mutationFn: async ({ testId, userId }: { testId: string; userId: string }) => {
      const { error } = await (supabase as any)
        .from("builder_test_assignments")
        .delete()
        .eq("test_id", testId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["builder-test-assignments"] });
      toast({ title: "Tayinlash bekor qilindi" });
    },
  });

  const handleAddQuestion = () => {
    if (!selectedTestId) return;
    saveQuestionMutation.mutate({
      test_id: selectedTestId,
      order_index: questions.length + 1,
      answer_type: "variants",
      points: 5,
      options: [
        { id: "", label: "A", option_text: "", is_correct: true, order_index: 0 },
        { id: "", label: "B", option_text: "", is_correct: false, order_index: 1 },
        { id: "", label: "C", option_text: "", is_correct: false, order_index: 2 },
        { id: "", label: "D", option_text: "", is_correct: false, order_index: 3 },
      ],
    });
  };

  const getStatusBadge = (status: TestStatus) => {
    const map: Record<TestStatus, { bg: string; text: string; label: string; icon: any }> = {
      active: { bg: "#DCFCE7", text: "#16A34A", label: "Faol", icon: CheckCircleIcon },
      pending: { bg: "#FEF3C7", text: "#D97706", label: "Kutilmoqda", icon: ClockCircleIcon },
      draft: { bg: "#F3F4F6", text: "#6B7280", label: "Qoralama", icon: FileTextIcon },
      archived: { bg: "#E0E7FF", text: "#4F46E5", label: "Arxiv", icon: ArchiveIcon },
      rejected: { bg: "#FEE2E2", text: "#DC2626", label: "Rad etilgan", icon: CloseCircleIcon },
    };
    return map[status];
  };

  const canEdit = !selectedTest || selectedTest.status === "draft" || selectedTest.status === "rejected";
  const canSubmit = selectedTest?.status === "draft" || selectedTest?.status === "rejected";
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const handleBack = () => {
    setSelectedTestId(null);
    setIsEditing(false);
    setExpandedQuestion(null);
    setMobileSidebarOpen(false);
  };

  const parseFileContent = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    setAiProgress(`${file.name} o'qilmoqda...`);

    if (ext === "txt" || ext === "md" || ext === "csv") {
      return await file.text();
    }
    if (ext === "docx") {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }
    if (ext === "pdf") {
      const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
      GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
      const buffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: buffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      return text;
    }
    if (ext === "json") {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return JSON.stringify(data, null, 2);
      }
      return JSON.stringify(data, null, 2);
    }
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
      return "[IMAGE_UPLOAD]";
    }
    throw new Error(`"${ext}" formati qo'llab-quvvatlanmaydi. PDF, DOCX, TXT, JSON, yoki rasm faylini yuklang.`);
  };

  const handleAiFileSelect = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Fayl juda katta", description: "Maksimal hajm: 15 MB", variant: "destructive" });
      return;
    }
    setAiFile(file);
    setAiGeneratedQuestions([]);
    setAiRawText("");
  };

  const processWithAI = async () => {
    if (!aiFile) return;
    setAiProcessing(true);
    setAiGeneratedQuestions([]);
    try {
      const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(aiFile.name.split(".").pop()?.toLowerCase() || "");

      if (isImage) {
        setAiProgress("Rasm AIga yuborilmoqda...");
        const reader = new FileReader();
        const imageDataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(aiFile);
        });
        const response = await api.ai.chat([
          { role: "system", content: "Sen test savololarini yaratuvchi AI'san. Rasmdagi test savololarini aniqlab, ularni JSON formatida chiqar. Har bir savol: {question_text: string, answer_type: 'variants'|'truefalse'|'written', options: [{text: string, is_correct: boolean}], points: number}. Faqat JSON array chiqar, boshqa matn yozma." },
          { role: "user", content: [
            { type: "image_url", image_url: { url: imageDataUrl } },
            { type: "text", text: "Bu rasmdagi test savolalarini JSON formatida chiqar. Har bir savol uchun to'g'ri javobni belgilagin." }
          ]}
        ]);
        const content = response.choices?.[0]?.message?.content || "[]";
        setAiRawText(content);
        const parsed = parseAIResponse(content);
        setAiGeneratedQuestions(parsed);
        setAiProgress(`${parsed.length} ta savol aniqlandi!`);
      } else {
        setAiProgress("Fayl matni o'qilmoqda...");
        const text = await parseFileContent(aiFile);
        setAiRawText(text);
        if (text.trim().length < 10) {
          toast({ title: "Faylda matn topilmadi", variant: "destructive" });
          setAiProcessing(false);
          return;
        }
        setAiProgress("AI savollarni tahlil qilmoqda...");
        const truncated = text.length > 8000 ? text.substring(0, 8000) + "\n...(kesilgan)" : text;
        const response = await api.ai.chat([
          { role: "system", content: "Sen test savollarini yaratuvchi AI'san. Berilgan matndan test savolalarini yarat. Har bir savol: {question_text: string, answer_type: 'variants'|'truefalse'|'written', options: [{text: string, is_correct: boolean}], points: number}. Faqat JSON array chiqar, boshqa matn yozma. 3-5 variantli savollar, to'g'ri javobni belgilagin. Savollar xilma-xil bo'lsin: oson, o'rta, qiyin." },
          { role: "user", content: `Quyidagi matndan test savolalarini yarat:\n\n${truncated}` }
        ]);
        const content = response.choices?.[0]?.message?.content || "[]";
        setAiRawText(content);
        const parsed = parseAIResponse(content);
        setAiGeneratedQuestions(parsed);
        setAiProgress(`${parsed.length} ta savol yaratildi!`);
      }
    } catch (err: any) {
      toast({ title: "AI xatosi", description: err.message || "AI bilan muammo yuz berdi", variant: "destructive" });
      setAiProgress("");
    } finally {
      setAiProcessing(false);
    }
  };

  const parseAIResponse = (content: string): any[] => {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any, idx: number) => ({
          id: `ai_${Date.now()}_${idx}`,
          question_text: item.question_text || item.question || item.savol || "",
          answer_type: item.answer_type || (item.options?.length === 2 && item.options.every((o: any) => ["ha", "yo'q", "true", "false", "to'g'ri", "noto'g'ri"].includes((o.text || o).toLowerCase())) ? "truefalse" : "variants"),
          options: (item.options || item.javoblar || []).map((opt: any, oidx: number) => ({
            id: `opt_${oidx}`,
            text: opt.text || opt.javob || opt,
            is_correct: opt.is_correct || opt.to_gri || oidx === 0,
          })),
          points: item.points || item.ball || 5,
        }));
      }
    } catch {}
    return [];
  };

  const addAiQuestionsToTest = async () => {
    if (!selectedTestId || aiGeneratedQuestions.length === 0 || aiProcessing) return;
    setAiProcessing(true);
    let added = 0;
    const allowedTypes = ["variants", "written", "truefalse", "matching", "listening", "reading"];
    for (const q of aiGeneratedQuestions) {
      try {
        const sanitizedType = allowedTypes.includes(q.answer_type) ? q.answer_type : "variants";
        const { data: qData, error: qErr } = await (supabase as any)
          .from("builder_questions")
          .insert({
            test_id: selectedTestId,
            question_text: q.question_text || "",
            answer_type: sanitizedType,
            points: Number(q.points) || 5,
            order_index: questions.length + added,
          })
          .select()
          .single();
        if (qErr) {
          console.error("Savol qo'shishda xato:", qErr);
          continue;
        }
        if (!qData) {
          console.error("Savol muvaffaqiyatli qo'shildi, lekin data qaytmadi");
          continue;
        }

        const optionsToInsert = (q.options || []).slice(0, 6);
        for (let optIdx = 0; optIdx < optionsToInsert.length; optIdx++) {
          const opt = optionsToInsert[optIdx];
          const { error: optErr } = await (supabase as any)
            .from("builder_answer_options")
            .insert({
              question_id: qData.id,
              label: String.fromCharCode(65 + optIdx),
              option_text: opt.text || "",
              is_correct: !!opt.is_correct,
              order_index: optIdx,
            });
          if (optErr) {
            console.error("Javob varianti qo'shishda xato:", optErr);
          }
        }
        added++;
      } catch (err) {
        console.error("Savol qo'shishda kutilmagan xato:", err);
      }
    }
    toast({ title: `${added} ta savol qo'shildi` });
    setShowAiModal(false);
    setAiFile(null);
    setAiGeneratedQuestions([]);
    setAiRawText("");
    setAiProcessing(false);
    queryClient.invalidateQueries({ queryKey: ["builder-questions", selectedTestId] });
  };

  const handleBulkFileSelect = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      toast({ title: "Faqat JSON fayl qabul qilinadi", variant: "destructive" });
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        toast({ title: "JSON massiv bo'lishi kerak", variant: "destructive" });
        return;
      }
      setBulkFile(file);
      setBulkPreview(data);
    } catch {
      toast({ title: "JSON formati noto'g'ri", variant: "destructive" });
    }
  };

  const handleBulkImport = async () => {
    if (!selectedTestId || bulkPreview.length === 0) return;
    setBulkImporting(true);
    let added = 0;
    const allowedTypes = ["variants", "written", "truefalse", "matching", "listening", "reading"];
    for (const q of bulkPreview) {
      try {
        const sanitizedType = allowedTypes.includes(q.answer_type) ? q.answer_type : "variants";
        const { data: qData, error: qErr } = await (supabase as any)
          .from("builder_questions")
          .insert({
            test_id: selectedTestId,
            question_text: q.question_text || q.question || "",
            answer_type: sanitizedType,
            points: Number(q.points) || 5,
            order_index: questions.length + added,
            explanation: q.explanation || "",
            question_image: q.question_image || "",
          })
          .select()
          .single();
        if (qErr || !qData) continue;

        if (sanitizedType === "variants" || sanitizedType === "truefalse") {
          const optionsToInsert = (q.options || []).slice(0, 6);
          for (let optIdx = 0; optIdx < optionsToInsert.length; optIdx++) {
            const opt = optionsToInsert[optIdx];
            await (supabase as any)
              .from("builder_answer_options")
              .insert({
                question_id: qData.id,
                label: String.fromCharCode(65 + optIdx),
                option_text: opt.text || opt.option_text || "",
                is_correct: !!opt.is_correct,
                order_index: optIdx,
              });
          }
        }
        added++;
      } catch (err) {
        console.error("Import error:", err);
      }
    }
    toast({ title: `${added} ta savol import qilindi` });
    setShowBulkModal(false);
    setBulkFile(null);
    setBulkPreview([]);
    setBulkImporting(false);
    queryClient.invalidateQueries({ queryKey: ["builder-questions", selectedTestId] });
  };

  const handleLoadSourceTestQuestions = async (testId: string) => {
    setCollectSourceTestId(testId);
    setCollectLoading(true);
    setCollectSelected(new Set());
    try {
      const { data: qData } = await (supabase as any)
        .from("builder_questions")
        .select("*")
        .eq("test_id", testId)
        .order("order_index", { ascending: true });
      const questionsWithOpts = await Promise.all(
        (qData || []).map(async (q: any) => {
          const { data: opts } = await (supabase as any)
            .from("builder_answer_options")
            .select("*")
            .eq("question_id", q.id)
            .order("order_index", { ascending: true });
          return { ...q, options: opts || [] };
        })
      );
      setCollectSourceQuestions(questionsWithOpts);
    } catch (err) {
      console.error("Load error:", err);
    }
    setCollectLoading(false);
  };

  const handleCollectImport = async () => {
    if (!selectedTestId || collectSelected.size === 0) return;
    setCollectImporting(true);
    let added = 0;
    for (const qId of collectSelected) {
      const q = collectSourceQuestions.find((x) => x.id === qId);
      if (!q) continue;
      try {
        const { data: qData, error: qErr } = await (supabase as any)
          .from("builder_questions")
          .insert({
            test_id: selectedTestId,
            question_text: q.question_text,
            question_image: q.question_image || "",
            answer_type: q.answer_type,
            explanation: q.explanation || "",
            points: q.points || 5,
            order_index: questions.length + added,
          })
          .select()
          .single();
        if (qErr || !qData) continue;
        for (const opt of (q.options || []).slice(0, 6)) {
          await (supabase as any)
            .from("builder_answer_options")
            .insert({
              question_id: qData.id,
              label: opt.label,
              option_text: opt.option_text,
              is_correct: opt.is_correct,
              order_index: opt.order_index,
            });
        }
        added++;
      } catch (err) {
        console.error("Collect import error:", err);
      }
    }
    toast({ title: `${added} ta savol yig'ildi` });
    setShowCollectModal(false);
    setCollectSourceTestId(null);
    setCollectSourceQuestions([]);
    setCollectSelected(new Set());
    setCollectImporting(false);
    queryClient.invalidateQueries({ queryKey: ["builder-questions", selectedTestId] });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl">
      <SEO title="Tests Builder" description="Test yaratish va boshqarish" />

      <header className="h-14 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {selectedTestId ? (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <AltArrowLeftIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          ) : (
            <button
              onClick={() => navigate(isAdmin ? "/admin/tests" : "/tests")}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <AltArrowLeftIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">Tests Builder</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {selectedTestId ? selectedTest?.title || "" : `${tests.length} ta test`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedTestId && selectedTest && isAdmin && (
            <button
              onClick={() => {
                setAssignTestId(selectedTest.id);
                setShowAssignModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <UsersGroupTwoRoundedIcon className="w-3.5 h-3.5" />
              Tayinlash
            </button>
          )}
          {selectedTestId && selectedTest && !isAdmin && canSubmit && (
            <button
              onClick={() => submitForApprovalMutation.mutate(selectedTest.id)}
              disabled={questions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SendSquareIcon className="w-3.5 h-3.5" />
              Yuborish
            </button>
          )}
          {selectedTestId && selectedTest && isAdmin && selectedTest.status === "pending" && (
            <>
              <button
                onClick={() => approveTestMutation.mutate(selectedTest.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckReadIcon className="w-3.5 h-3.5" />
                Tasdiqlash
              </button>
              <button
                onClick={() => {
                  setRejectingTestId(selectedTest.id);
                  setShowRejectModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <CloseSquareIcon className="w-3.5 h-3.5" />
                Rad etish
              </button>
            </>
          )}
        </div>
      </header>

      {!selectedTestId ? (
        <div className="p-4">
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Test qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <button
                onClick={() => createTestMutation.mutate()}
                disabled={createTestMutation.isPending}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[12px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
              >
                <PlusCircleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Yangi test</span>
                <span className="sm:hidden">Yangi</span>
              </button>
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {(["all", "draft", "pending", "active", "archived", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
                    statusFilter === s
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {s === "all" ? "Barchasi" : getStatusBadge(s).label}
                </button>
              ))}
            </div>
          </div>

          {testsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-slate-100 dark:bg-white/[0.03] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-20">
              <FileTextIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-[13px] text-slate-400">Testlar topilmadi</p>
            </div>
          ) : (
            <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.06]">
                    <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Test nomi
                    </th>
                    <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Fan
                    </th>
                    <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Sinf
                    </th>
                    <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Savollar
                    </th>
                    <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Holat
                    </th>
                    <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Sana
                    </th>
                    <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => {
                    const badge = getStatusBadge(test.status);
                    const Icon = badge.icon;
                    return (
                      <tr
                        key={test.id}
                        className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedTestId(test.id);
                          setIsEditing(false);
                        }}
                      >
                        <td className="py-3 pr-4">
                          <div className="text-[13px] font-semibold text-slate-900 dark:text-white truncate max-w-[240px]">
                            {test.title}
                          </div>
                          {test.status === "rejected" && test.rejection_reason && (
                            <div className="text-[10px] text-red-500 mt-0.5 truncate max-w-[240px]">
                              {test.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-[12px] text-slate-600 dark:text-slate-400">
                          {test.subject || "—"}
                        </td>
                        <td className="py-3 pr-4 text-[12px] text-slate-600 dark:text-slate-400">
                          {test.grade || "—"}
                        </td>
                        <td className="py-3 pr-4 text-[12px] text-slate-600 dark:text-slate-400">
                          {test.questions_count}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold"
                            style={{ background: badge.bg, color: badge.text }}
                          >
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(test.created_at).toLocaleDateString("uz-UZ")}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isAdmin && test.status === "pending" && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    approveTestMutation.mutate(test.id);
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-green-50 dark:hover:bg-green-500/10 text-green-500 hover:text-green-600 transition-colors"
                                  title="Tasdiqlash"
                                >
                                  <CheckReadIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRejectingTestId(test.id);
                                    setShowRejectModal(true);
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors"
                                  title="Rad etish"
                                >
                                  <CloseCircleIcon className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {isAdmin && test.status === "rejected" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveTestMutation.mutate(test.id);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-green-50 dark:hover:bg-green-500/10 text-green-500 hover:text-green-600 transition-colors"
                                title="Tasdiqlash"
                              >
                                <CheckReadIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTestId(test.id);
                                setIsEditing(true);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("O'chirishni xohlaysizmi?")) deleteTestMutation.mutate(test.id);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {tests.map((test) => {
                const badge = getStatusBadge(test.status);
                const Icon = badge.icon;
                return (
                  <div
                    key={test.id}
                    onClick={() => {
                      setSelectedTestId(test.id);
                      setIsEditing(false);
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0f1419] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{test.title}</p>
                        {test.status === "rejected" && test.rejection_reason && (
                          <p className="text-[10px] text-red-500 mt-0.5 truncate">{test.rejection_reason}</p>
                        )}
                      </div>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold flex-shrink-0"
                        style={{ background: badge.bg, color: badge.text }}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      <span>{test.subject || "Fan yo'q"}</span>
                      <span>·</span>
                      <span>{test.grade || "—"}</span>
                      <span>·</span>
                      <span>{test.questions_count} savol</span>
                      <span>·</span>
                      <span>{new Date(test.created_at).toLocaleDateString("uz-UZ")}</span>
                    </div>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {isAdmin && test.status === "pending" && (
                        <>
                          <button
                            onClick={() => approveTestMutation.mutate(test.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckReadIcon className="w-3 h-3" />
                            Tasdiqlash
                          </button>
                          <button
                            onClick={() => {
                              setRejectingTestId(test.id);
                              setShowRejectModal(true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <CloseCircleIcon className="w-3 h-3" />
                            Rad etish
                          </button>
                        </>
                      )}
                      {isAdmin && test.status === "rejected" && (
                        <button
                          onClick={() => approveTestMutation.mutate(test.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckReadIcon className="w-3 h-3" />
                          Qayta tasdiqlash
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTestId(test.id);
                          setIsEditing(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("O'chirishni xohlaysizmi?")) deleteTestMutation.mutate(test.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex h-[calc(100vh-56px)]">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          >
            {mobileSidebarOpen ? <CloseSquareIcon className="w-5 h-5" /> : <AltArrowDownIcon className="w-5 h-5" />}
          </button>
          <aside className={`${mobileSidebarOpen ? "fixed inset-0 z-30 bg-white dark:bg-[#080C14] md:relative md:inset-auto md:z-auto" : "hidden md:block"} w-full md:w-[320px] border-r border-slate-200 dark:border-white/[0.06] overflow-y-auto`}>
            {/* Sticky Save Bar */}
            {hasChanges && (
              <div className="sticky top-0 z-10 bg-white dark:bg-[#080C14] border-b border-slate-200 dark:border-white/[0.06] p-4">
                <button
                  onClick={handleSaveTest}
                  disabled={saveTestMutation.isPending}
                  className="w-full py-2.5 rounded-xl bg-[#E8192C] text-white text-[13px] font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {saveTestMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            )}

            <div className="p-4 space-y-4">

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                Test nomi
              </label>
              <input
                type="text"
                value={formDraft.title || ""}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                Tavsif
              </label>
              <textarea
                value={formDraft.description || ""}
                onChange={(e) => updateDraft({ description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Fan
                </label>
                <input
                  type="text"
                  value={formDraft.subject || ""}
                  onChange={(e) => updateDraft({ subject: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Sinf
                </label>
                <input
                  type="text"
                  value={formDraft.grade || ""}
                  onChange={(e) => updateDraft({ grade: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Vaqt (daqiqa)
                </label>
                <input
                  type="number"
                  value={formDraft.time_limit_min || 0}
                  onChange={(e) => updateDraft({ time_limit_min: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Urinishlar
                </label>
                <input
                  type="number"
                  value={formDraft.max_attempts || 1}
                  onChange={(e) => updateDraft({ max_attempts: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                Rasm URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formDraft.cover_image_url || ""}
                  onChange={(e) => updateDraft({ cover_image_url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                {formDraft.cover_image_url && (
                  <img
                    src={formDraft.cover_image_url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-white/[0.06]"
                  />
      )}

      {/* COLLECT QUESTIONS MODAL */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { if (!collectImporting) { setShowCollectModal(false); setCollectSourceTestId(null); setCollectSourceQuestions([]); setCollectSelected(new Set()); } }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#1e1e2e] rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <CheckListIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Savollarni yig'ish</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Boshqa testlardan savollarni tanlab olish</p>
                </div>
              </div>
              <button onClick={() => { if (!collectImporting) { setShowCollectModal(false); setCollectSourceTestId(null); setCollectSourceQuestions([]); setCollectSelected(new Set()); } }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                <CloseSquareIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!collectSourceTestId ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Testni tanlang</p>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {tests.filter((t) => t.id !== selectedTestId).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleLoadSourceTestQuestions(t.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/[0.06] hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          <FileTextIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{t.title}</p>
                          <p className="text-[10px] text-slate-400">{t.questions_count || 0} savol · {t.subject || "Umumiy"}</p>
                        </div>
                      </button>
                    ))}
                    {tests.filter((t) => t.id !== selectedTestId).length === 0 && (
                      <p className="text-center text-[12px] text-slate-400 py-6">Boshqa testlar topilmadi</p>
                    )}
                  </div>
                </div>
              ) : collectLoading ? (
                <div className="text-center py-8">
                  <RefreshIcon className="w-8 h-8 mx-auto mb-2 text-emerald-500 animate-spin" />
                  <p className="text-[12px] text-slate-500">Savollar yuklanmoqda...</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {collectSourceQuestions.length} ta savol topildi ({collectSelected.size} tanlangan)
                    </p>
                    <button
                      onClick={() => {
                        if (collectSelected.size === collectSourceQuestions.length) {
                          setCollectSelected(new Set());
                        } else {
                          setCollectSelected(new Set(collectSourceQuestions.map((q) => q.id)));
                        }
                      }}
                      className="text-[11px] text-emerald-600 hover:underline font-bold"
                    >
                      {collectSelected.size === collectSourceQuestions.length ? "Hammasini bekor qilish" : "Hammasini tanlash"}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {collectSourceQuestions.map((q) => {
                      const isSelected = collectSelected.has(q.id);
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCollectSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(q.id)) next.delete(q.id);
                              else next.add(q.id);
                              return next;
                            });
                          }}
                          className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                              : "border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12]"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-white/[0.06] text-slate-400"
                          }`}>
                            {isSelected ? <CheckReadIcon className="w-3 h-3" /> : <span className="text-[10px]">{q.order_index}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-slate-900 dark:text-white line-clamp-2">{q.question_text || "Bo'sh savol"}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{q.answer_type} · {q.points} ball · {q.options?.length || 0} ta variant</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-white/[0.06]">
              <button
                onClick={() => {
                  if (collectSourceTestId) {
                    setCollectSourceTestId(null);
                    setCollectSourceQuestions([]);
                    setCollectSelected(new Set());
                  } else {
                    setShowCollectModal(false);
                  }
                }}
                className="px-4 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
              >
                {collectSourceTestId ? "Orqaga" : "Bekor qilish"}
              </button>
              {collectSourceTestId && !collectLoading && collectSelected.size > 0 && (
                <button
                  onClick={handleCollectImport}
                  disabled={collectImporting}
                  className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {collectImporting ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : <CheckListIcon className="w-3.5 h-3.5" />}
                  Yig'ish ({collectSelected.size})
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
            </div>

            {/* ASSIGNMENT MODAL */}
            {showAssignModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { if (!assignLoading) { setShowAssignModal(false); setAssignTestId(null); setAssignSearchTerm(""); } }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-[#1e1e2e] rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                        <UsersGroupTwoRoundedIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Testni tayinlash</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Foydalanuvchilarni tanlang</p>
                      </div>
                    </div>
                    <button onClick={() => { if (!assignLoading) { setShowAssignModal(false); setAssignTestId(null); setAssignSearchTerm(""); } }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                      <CloseSquareIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Search users */}
                    <div className="relative">
                      <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Foydalanuvchi qidirish (ism yoki email)..."
                        value={assignSearchTerm}
                        onChange={(e) => setAssignSearchTerm(e.target.value)}
                        className="w-full h-10 pl-10 pr-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>

                    {/* Search results */}
                    {assignSearchTerm.length >= 2 && (
                      <div className="border border-slate-200 dark:border-white/[0.06] rounded-lg max-h-48 overflow-y-auto">
                        {searchUsersLoading ? (
                          <div className="p-3 text-center">
                            <RefreshIcon className="w-5 h-5 mx-auto animate-spin text-slate-400" />
                          </div>
                        ) : searchUsers.length === 0 ? (
                          <div className="p-3 text-center text-[12px] text-slate-400">
                            Foydalanuvchi topilmadi
                          </div>
                        ) : (
                          searchUsers.map((u: any) => {
                            const isAssigned = assignments.some((a: any) => a.user_id === u.user_id);
                            return (
                              <div
                                key={u.user_id}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/[0.03] border-b border-slate-100 dark:border-white/[0.04] last:border-0"
                              >
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-[10px] font-bold text-purple-600 flex-shrink-0">
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    (u.full_name || u.email || "?").charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-semibold text-slate-900 dark:text-white truncate">{u.full_name || "Noma'lum"}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{u.email || ""}</p>
                                </div>
                                {isAssigned ? (
                                  <button
                                    onClick={() => assignTestId && unassignUserMutation.mutate({ testId: assignTestId, userId: u.user_id })}
                                    disabled={unassignUserMutation.isPending}
                                    className="px-2.5 py-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex-shrink-0"
                                  >
                                    O'chirish
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => assignTestId && assignUserMutation.mutate({ testId: assignTestId, userId: u.user_id })}
                                    disabled={assignUserMutation.isPending}
                                    className="px-2.5 py-1 text-[10px] font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex-shrink-0"
                                  >
                                    Tayinlash
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Assigned users list */}
                    {assignments.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Tayinlangan foydalanuvchilar ({assignments.length})
                        </p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {assignments.map((a: any) => (
                            <div
                              key={a.id}
                              className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]"
                            >
                              <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center text-[9px] font-bold text-purple-600 flex-shrink-0">
                                {a.user_avatar ? (
                                  <img src={a.user_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                                ) : (
                                  (a.user_name || "?").charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium text-slate-900 dark:text-white truncate">{a.user_name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString("uz-UZ") : ""}
                                </p>
                              </div>
                              <button
                                onClick={() => assignTestId && unassignUserMutation.mutate({ testId: assignTestId, userId: a.user_id })}
                                disabled={unassignUserMutation.isPending}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                              >
                                <CloseSquareIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {assignments.length === 0 && assignSearchTerm.length < 2 && (
                      <div className="text-center py-6">
                        <UsersGroupTwoRoundedIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-[12px] text-slate-400">Hozircha hech kim tayinlanmagan</p>
                        <p className="text-[10px] text-slate-400 mt-1">Ism yoki email orqali qidiring</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end p-4 border-t border-slate-200 dark:border-white/[0.06]">
                    <button
                      onClick={() => { setShowAssignModal(false); setAssignTestId(null); setAssignSearchTerm(""); }}
                      className="px-4 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                    >
                      Yopish
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Boshlanish
                </label>
                <input
                  type="datetime-local"
                  value={(() => {
                    if (!formDraft.opens_at) return "";
                    const d = new Date(formDraft.opens_at);
                    if (isNaN(d.getTime())) return "";
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    const h = String(d.getHours()).padStart(2, "0");
                    const min = String(d.getMinutes()).padStart(2, "0");
                    return `${y}-${m}-${day}T${h}:${min}`;
                  })()}
                  onChange={(e) => updateDraft({ opens_at: e.target.value ? e.target.value + ":00" : null })}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Tugash
                </label>
                <input
                  type="datetime-local"
                  value={(() => {
                    if (!formDraft.closes_at) return "";
                    const d = new Date(formDraft.closes_at);
                    if (isNaN(d.getTime())) return "";
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    const h = String(d.getHours()).padStart(2, "0");
                    const min = String(d.getMinutes()).padStart(2, "0");
                    return `${y}-${m}-${day}T${h}:${min}`;
                  })()}
                  onChange={(e) => updateDraft({ closes_at: e.target.value ? e.target.value + ":00" : null })}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                Natija ko'rsatish
              </label>
              <select
                value={formDraft.show_result || "immediate"}
                onChange={(e) => updateDraft({ show_result: e.target.value as ShowResult })}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="immediate">Darhol</option>
                <option value="after_review">Tekshirgandan keyin</option>
                <option value="hidden">Ko'rsatmaslik</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                Holat
              </label>
              <select
                value={formDraft.status || "draft"}
                onChange={(e) => updateDraft({ status: e.target.value as TestStatus })}
                disabled={!isAdmin}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
              >
                <option value="draft">Qoralama</option>
                <option value="pending">Kutilmoqda</option>
                <option value="active">Faol</option>
                <option value="archived">Arxiv</option>
                <option value="rejected">Rad etilgan</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-[12px] text-slate-700 dark:text-slate-300">Tasodifiy tartib</span>
              <button
                onClick={() => updateDraft({ shuffle_order: !formDraft.shuffle_order })}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  formDraft.shuffle_order ? "bg-[#E8192C]" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5 ${
                    formDraft.shuffle_order ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-[12px] text-slate-700 dark:text-slate-300">To'liq ekran</span>
              <button
                onClick={() => updateDraft({ fullscreen_mode: !formDraft.fullscreen_mode })}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  formDraft.fullscreen_mode ? "bg-[#E8192C]" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5 ${
                    formDraft.fullscreen_mode ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            </div>
          </aside>

          <main className={`${mobileSidebarOpen ? "hidden md:block" : "block"} flex-1 overflow-y-auto p-4`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] font-bold text-slate-900 dark:text-white">
                  Savollar ({questions.length})
                </h2>
                <span className="text-[12px] text-slate-500 dark:text-slate-400">
                  Jami: {totalPoints} ball
                </span>
              </div>
              <div className="flex items-center gap-2">
                {questions.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Barcha savollarni o'chirishni xohlaysizmi? Bu amalni ortga qaytarib bo'lmaydi!")) {
                        deleteAllQuestionsMutation.mutate();
                      }
                    }}
                    disabled={deleteAllQuestionsMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <TrashBinMinimalisticIcon className="w-4 h-4" />
                    Barchasini o'chirish
                  </button>
                )}
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <DocumentIcon className="w-4 h-4" />
                  Ommaviy yuklash
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  Savol qo'shish
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    isExpanded={expandedQuestion === question.id}
                    onToggle={() =>
                      setExpandedQuestion(expandedQuestion === question.id ? null : question.id)
                    }
                    onSave={(q) =>
                      saveQuestionMutation.mutate({ ...q, test_id: selectedTestId! })
                    }
                    onDelete={() => deleteQuestionMutation.mutate(question.id)}
                  />
                ))}
              </AnimatePresence>

              {questions.length === 0 && (
                <div className="text-center py-16">
                  <FileTextIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-[13px] text-slate-400 mb-3">Savollar yo'q</p>
                  <button
                    onClick={handleAddQuestion}
                    className="px-4 py-2 text-[12px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Savol qo'shish
                  </button>
                </div>
              )}
            </div>

            {/* LIVE: Hozir test yechayotganlar */}
            {liveAttempts.length > 0 && (
              <div className="mt-6 border-t border-slate-200 dark:border-white/[0.06] pt-6">
                <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  LIVE — Hozir ishlayotganlar ({liveAttempts.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {liveAttempts.map((att: any) => {
                    const initials = (att.student_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];
                    const colorClass = colors[Math.abs((att.student_name || "A").charCodeAt(0)) % colors.length];
                    const progress = att.total_questions > 0 ? Math.round((att.answered_count / att.total_questions) * 100) : 0;
                    return (
                      <div key={att.id} className="relative rounded-xl border-2 border-red-200 dark:border-red-500/30 bg-white dark:bg-white/[0.03] p-3 overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 dark:bg-red-500/5 rounded-bl-[40px]"></div>
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white ${colorClass}`}>
                              {att.student_avatar ? (
                                <img src={att.student_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : initials}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0f1419]"></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{att.student_name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1 font-mono font-bold text-red-500">
                                <ClockCircleIcon className="w-3 h-3" />
                                <LiveTimer startedAt={att.started_at} />
                              </span>
                              <span>·</span>
                              <span>{att.answered_count}/{att.total_questions} javob</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[18px] font-black text-red-500">{progress}%</p>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ishlatgan foydalanuvchilar */}
            {testAttempts.length > 0 && (
              <div className="mt-6 border-t border-slate-200 dark:border-white/[0.06] pt-6">
                <h2 className="text-[14px] font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <EyeIcon className="w-4 h-4" />
                  Ishlatgan foydalanuvchilar ({testAttempts.length})
                </h2>
                <div className="space-y-3">
                  {testAttempts.map((att: any) => {
                    const initials = (att.student_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                    const colors = ["bg-blue-100 text-blue-600", "bg-green-100 text-green-600", "bg-purple-100 text-purple-600", "bg-orange-100 text-orange-600", "bg-pink-100 text-pink-600"];
                    const colorClass = colors[Math.abs((att.student_name || "A").charCodeAt(0)) % colors.length];
                    const isExpanded = expandedAttempt === att.id;
                    return (
                      <div key={att.id} className="rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-hidden bg-white dark:bg-white/[0.03]">
                        <div
                          onClick={() => setExpandedAttempt(isExpanded ? null : att.id)}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${colorClass}`}>
                            {att.student_avatar ? (
                              <img src={att.student_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{att.student_name}</p>
                            <p className="text-[10px] text-slate-400">
                              {att.finished_at ? new Date(att.finished_at).toLocaleDateString("uz-UZ", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                              {" · "}{att.time_formatted}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            <div className="text-center">
                              <p className={`text-[15px] font-bold ${att.score_percent >= 50 ? "text-green-600" : "text-red-600"}`}>
                                {att.score_percent}%
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-green-600">{att.correct_count}</span>
                              <span className="text-[10px] text-slate-300">/</span>
                              <span className="text-[11px] font-bold text-red-600">{att.wrong_count}</span>
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              att.score_percent >= 50
                                ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                            }`}>
                              {att.score_percent >= 50 ? "O'tdi" : "O'tmadi"}
                            </div>
                            <AltArrowDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {isExpanded && att.details && att.details.length > 0 && (
                          <div className="border-t border-slate-100 dark:border-white/[0.06] px-3 py-2 space-y-2">
                            <div className="flex items-center gap-4 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <span className="w-6 text-center">#</span>
                              <span className="flex-1">Savol</span>
                              <span className="w-16 text-center">Natija</span>
                              <span className="w-12 text-center">Ball</span>
                            </div>
                            {att.details.map((d: any, i: number) => (
                              <div
                                key={i}
                                className={`rounded-xl border overflow-hidden ${
                                  d.is_correct
                                    ? "border-green-200 dark:border-green-500/20"
                                    : "border-red-200 dark:border-red-500/20"
                                }`}
                              >
                                <div className={`flex items-center gap-2 px-3 py-2 ${
                                  d.is_correct
                                    ? "bg-green-50 dark:bg-green-500/5"
                                    : "bg-red-50 dark:bg-red-500/5"
                                }`}>
                                  <span className="w-6 text-center font-bold text-slate-500 text-[11px]">{d.order_index}</span>
                                  <span className="flex-1 truncate text-[12px] font-medium text-slate-700 dark:text-slate-300">{d.question_text}</span>
                                  <span className={`w-16 text-center font-bold text-[11px] ${d.is_correct ? "text-green-600" : "text-red-600"}`}>
                                    {d.is_correct ? "To'g'ri" : "Xato"}
                                  </span>
                                  <span className="w-12 text-center font-medium text-[11px] text-slate-500">
                                    {d.points_earned}/{d.max_points}
                                  </span>
                                </div>
                                {/* Tanlangan va to'g'ri javob */}
                                <div className="px-3 py-2 bg-white dark:bg-white/[0.02] space-y-1.5">
                                  <div className="flex items-center gap-2 text-[11px]">
                                    <span className="font-bold text-slate-500 w-16 shrink-0">Tanlagan:</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      d.is_correct
                                        ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                                    }`}>
                                      {d.selected_label}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400 truncate">{d.selected_text}</span>
                                  </div>
                                  {!d.is_correct && (
                                    <div className="flex items-center gap-2 text-[11px]">
                                      <span className="font-bold text-slate-500 w-16 shrink-0">To'g'ri:</span>
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                                        {d.correct_label}
                                      </span>
                                      <span className="text-slate-600 dark:text-slate-400 truncate">{d.correct_text}</span>
                                    </div>
                                  )}
                                  {d.all_options && d.all_options.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {d.all_options.map((opt: any) => (
                                        <span
                                          key={opt.id}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                                            opt.is_correct
                                              ? "border-green-300 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400"
                                              : opt.id === d.selected_option_id
                                              ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                                              : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-400"
                                          }`}
                                        >
                                          {opt.label}) {opt.option_text?.slice(0, 30)}{opt.option_text?.length > 30 ? "..." : ""}
                                          {opt.is_correct ? " ✓" : ""}
                                          {opt.id === d.selected_option_id && !opt.is_correct ? " ✗" : ""}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0f1419] rounded-xl p-5 sm:p-6 w-full max-w-[400px] border border-slate-200 dark:border-white/[0.06]">
            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white mb-3">Rad etish sababi</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Sababni kiriting..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRejectingTestId(null);
                }}
                className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  if (rejectingTestId && rejectReason.trim()) {
                    rejectTestMutation.mutate({ testId: rejectingTestId, reason: rejectReason });
                  }
                }}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-[12px] font-bold text-white bg-red-600 rounded-lg disabled:opacity-50 hover:bg-red-700 transition-colors"
              >
                Rad etish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI FILE UPLOAD MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { if (!aiProcessing) { setShowAiModal(false); setAiFile(null); setAiGeneratedQuestions([]); } }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#1e1e2e] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#E8192C" }}>
                  <CpuIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">AI orqali savol yaratish</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Faylni yuklang, AI savollarni avtomatik yaratadi</p>
                </div>
              </div>
              <button onClick={() => { if (!aiProcessing) { setShowAiModal(false); setAiFile(null); setAiGeneratedQuestions([]); } }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                <CloseSquareIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Drop zone */}
              {!aiFile && (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    dragOver ? "border-[#E8192C] bg-red-50 dark:bg-red-500/10" : "border-slate-300 dark:border-white/10 hover:border-[#E8192C]/50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleAiFileSelect(f); }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.md,.csv,.json,.jpg,.jpeg,.png,.gif,.webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAiFileSelect(f); }} />
                  <UploadMinimalisticIcon className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-white mb-1">Faylni shu yerga tashlang</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">PDF, DOCX, TXT, MD, CSV, JSON, JPG, PNG — 15 MB gacha</p>
                </div>
              )}

              {/* Selected file */}
              {aiFile && !aiProcessing && aiGeneratedQuestions.length === 0 && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                  {["jpg", "jpeg", "png", "gif", "webp"].includes(aiFile.name.split(".").pop() || "") ? (
                    <ImageIcon className="w-8 h-8 text-purple-500 flex-shrink-0" />
                  ) : aiFile.name.endsWith(".pdf") ? (
                    <FileTextIcon className="w-8 h-8 text-red-500 flex-shrink-0" />
                  ) : aiFile.name.endsWith(".docx") ? (
                    <DocumentIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                  ) : (
                    <File className="w-8 h-8 text-slate-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{aiFile.name}</p>
                    <p className="text-[11px] text-slate-500">{(aiFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setAiFile(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded">
                    <CloseSquareIcon className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}

              {/* Processing indicator */}
              {aiProcessing && (
                <div className="text-center py-6">
                  <RefreshIcon className="w-10 h-10 mx-auto mb-3 text-[#E8192C] animate-spin" />
                  <p className="text-sm font-bold text-slate-700 dark:text-white">{aiProgress || "AI ishlamoqda..."}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Bu bir oz vaqt olishi mumkin</p>
                </div>
              )}

              {/* Raw text preview */}
              {aiRawText && !aiProcessing && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">AI xulosasi:</p>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg max-h-32 overflow-y-auto">
                    <pre className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono">{aiRawText}</pre>
                  </div>
                </div>
              )}

              {/* Generated questions */}
              {aiGeneratedQuestions.length > 0 && !aiProcessing && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Yaratilgan savollar ({aiGeneratedQuestions.length})
                    </p>
                    <button onClick={() => { setAiGeneratedQuestions([]); setAiRawText(""); }} className="text-[11px] text-red-500 hover:underline">Qayta yaratish</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {aiGeneratedQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{idx + 1}. {q.question_text}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {q.options?.map((opt: any, oidx: number) => (
                            <span key={oidx} className={`text-[10px] px-2 py-0.5 rounded-full ${opt.is_correct ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
                              {opt.text} {opt.is_correct ? "✓" : ""}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{q.points} ball · {q.answer_type === "truefalse" ? "Ha/Yo'q" : q.answer_type === "variants" ? `${q.options?.length || 0} ta variant` : "Yozma"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-white/[0.06]">
              <button onClick={() => { setShowAiModal(false); setAiFile(null); setAiGeneratedQuestions([]); setAiRawText(""); }} className="px-4 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                Bekor qilish
              </button>
              {!aiProcessing && aiFile && aiGeneratedQuestions.length === 0 && (
                <button onClick={processWithAI} className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white rounded-lg" style={{ background: "#E8192C" }}>
                  <CpuIcon className="w-3.5 h-3.5" />
                  Tekshirish
                </button>
              )}
              {!aiProcessing && aiGeneratedQuestions.length > 0 && (
                <button onClick={addAiQuestionsToTest} className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white bg-green-600 rounded-lg hover:bg-green-700">
                  <CheckReadIcon className="w-3.5 h-3.5" />
                  Hammasini qo'shish ({aiGeneratedQuestions.length})
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* BULK JSON UPLOAD MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { if (!bulkImporting) { setShowBulkModal(false); setBulkFile(null); setBulkPreview([]); } }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#1e1e2e] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                  <DocumentIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Ommaviy yuklash</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">JSON fayl orqali savollarni to'plam import qilish</p>
                </div>
              </div>
              <button onClick={() => { if (!bulkImporting) { setShowBulkModal(false); setBulkFile(null); setBulkPreview([]); } }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                <CloseSquareIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!bulkFile && (
                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer border-slate-300 dark:border-white/10 hover:border-purple-400/50"
                  onClick={() => bulkFileRef.current?.click()}
                >
                  <input ref={bulkFileRef} type="file" className="hidden" accept=".json" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBulkFileSelect(f); }} />
                  <DocumentIcon className="w-10 h-10 mx-auto mb-3 text-purple-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-white mb-1">JSON faylni shu yerga tashlang</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Faqat .json formatidagi fayllar qabul qilinadi</p>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 text-left max-w-md mx-auto">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">JSON formati namuna:</p>
                    <pre className="text-[10px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono">{`[
  {
    "question_text": "Poyezd qaysi yo'nalishda harakatlanadi?",
    "answer_type": "variants",
    "options": [
      {"text": "Chapga", "is_correct": false},
      {"text": "O'ngga", "is_correct": true},
      {"text": "Orqaga", "is_correct": false},
      {"text": "Oldinga", "is_correct": false}
    ],
    "points": 5,
    "explanation": "Poyezd doimo oldinga harakatlanadi"
  }
]`}</pre>
                  </div>
                </div>
              )}

              {bulkFile && bulkPreview.length === 0 && !bulkImporting && (
                <div className="text-center py-6">
                  <RefreshIcon className="w-8 h-8 mx-auto mb-2 text-red-500 animate-spin" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">Fayl o'qilmoqda...</p>
                </div>
              )}

              {bulkFile && bulkPreview.length > 0 && !bulkImporting && (
                <div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl mb-3">
                    <DocumentIcon className="w-8 h-8 text-purple-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{bulkFile.name}</p>
                      <p className="text-[11px] text-slate-500">{bulkPreview.length} ta savol topildi · {(bulkFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => { setBulkFile(null); setBulkPreview([]); }} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded">
                      <CloseSquareIcon className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Oldindan ko'rish ({bulkPreview.length} ta savol)
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {bulkPreview.map((q: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{idx + 1}. {q.question_text || q.question || "Savol matni yo'q"}</p>
                        {q.options && q.options.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {q.options.map((opt: any, oidx: number) => (
                              <span key={oidx} className={`text-[10px] px-2 py-0.5 rounded-full ${opt.is_correct ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
                                {opt.text || opt.option_text || opt} {opt.is_correct ? "✓" : ""}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">{q.points || 5} ball · {q.answer_type || "variants"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bulkImporting && (
                <div className="text-center py-6">
                  <RefreshIcon className="w-10 h-10 mx-auto mb-3 text-purple-600 animate-spin" />
                  <p className="text-sm font-bold text-slate-700 dark:text-white">Import qilinmoqda...</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Savollar bazaga yuklanmoqda</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-white/[0.06]">
              <button onClick={() => { setShowBulkModal(false); setBulkFile(null); setBulkPreview([]); }} className="px-4 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                Bekor qilish
              </button>
              {!bulkImporting && bulkPreview.length > 0 && (
                <button onClick={handleBulkImport} className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700">
                  <UploadMinimalisticIcon className="w-3.5 h-3.5" />
                  Import qilish ({bulkPreview.length})
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const normalizeMath = (text: string) => {
  if (!text) return "";
  return text
    .replace(/\\\(/g, "$").replace(/\\\)/g, "$")
    .replace(/\\\[/g, "$$").replace(/\\\]/g, "$$");
};

const MathPreview = ({ text }: { text: string }) => {
  if (!text || !text.trim()) return null;
  const hasMath = text.includes("$") || text.includes("\\") || text.includes("^") || text.includes("_");
  if (!hasMath) return null;
  return (
    <div className="mt-2 p-3 bg-slate-50 dark:bg-white/[0.03] rounded-lg border border-slate-100 dark:border-white/[0.06]">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Ko'rinish</p>
      <div className="text-[13px] text-slate-800 dark:text-slate-200">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
          {normalizeMath(text)}
        </ReactMarkdown>
      </div>
    </div>
  );
};

const LiveTimer = ({ startedAt }: { startedAt: string }) => {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  return <span>{min}:{sec.toString().padStart(2, "0")}</span>;
};

const MathFormulaDialog = ({ onClose, onInsert, mathFieldRef }: {
  onClose: () => void;
  onInsert: (formula: string) => void;
  mathFieldRef: React.MutableRefObject<any>;
}) => {
  const [latex, setLatex] = useState("");

  const snippets = [
    { label: "x²", value: "x^{2}" },
    { label: "xⁿ", value: "x^{n}" },
    { label: "√x", value: "\\sqrt{x}" },
    { label: "a/b", value: "\\frac{a}{b}" },
    { label: "∑", value: "\\sum_{i=1}^{n}" },
    { label: "∫", value: "\\int_{a}^{b}" },
    { label: "π", value: "\\pi" },
    { label: "∞", value: "\\infty" },
    { label: "≤", value: "\\leq" },
    { label: "≥", value: "\\geq" },
    { label: "≠", value: "\\neq" },
    { label: "Δ", value: "\\Delta" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#0f1419] rounded-2xl border border-slate-200 dark:border-white/[0.06] w-full max-w-lg p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Formula kiritish</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center">
            <CloseSquareIcon className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <math-field
          ref={mathFieldRef}
          onInput={(e: any) => setLatex(e.target.value)}
          virtual-keyboard-mode="onfocus"
          smart-fence
          smart-superscript
          style={{
            width: '100%',
            minHeight: '50px',
            fontSize: '16px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgb(226 232 240)',
            outline: 'none',
          }}
          className="dark:border-white/[0.06] dark:bg-white/[0.03]"
        />

        <div className="flex flex-wrap gap-1.5">
          {snippets.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                if (mathFieldRef.current) {
                  mathFieldRef.current.executeCommand("insert", s.value);
                  setLatex(mathFieldRef.current.value);
                }
              }}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded-md text-[12px] font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-white/[0.03] rounded-lg border border-slate-100 dark:border-white/[0.06]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Oldindan ko'rish</p>
          <div className="text-[14px] text-slate-800 dark:text-slate-200">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {normalizeMath(`$${latex}$`)}
            </ReactMarkdown>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Bekor qilish
          </button>
          <button
            onClick={() => onInsert(latex)}
            disabled={!latex.trim()}
            className="px-4 py-2 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-white/[0.06] text-white rounded-lg transition-colors"
          >
            Qo'shish
          </button>
        </div>
      </div>
    </div>
  );
};

interface QuestionCardProps {
  question: QuestionData;
  isExpanded: boolean;
  onToggle: () => void;
  onSave: (q: Partial<QuestionData>) => void;
  onDelete: () => void;
}

const QuestionCard = ({ question, isExpanded, onToggle, onSave, onDelete }: QuestionCardProps) => {
  const [text, setText] = useState(question.question_text || "");
  const [answerType, setAnswerType] = useState<AnswerType>(question.answer_type || "variants");
  const [options, setOptions] = useState<AnswerOption[]>(question.options || []);
  const [points, setPoints] = useState(question.points || 5);
  const [explanation, setExplanation] = useState(question.explanation || "");
  const [imageUrl, setImageUrl] = useState(question.question_image || "");
  const [showMathDialog, setShowMathDialog] = useState(false);
  const [mathTarget, setMathTarget] = useState<{ type: 'question' | 'option' | 'explanation'; index?: number }>({ type: 'question' });
  const mathFieldRef = useRef<any>(null);

  // Matching type state
  const [matchLeft, setMatchLeft] = useState<string[]>(() => {
    try { const d = JSON.parse(question.explanation || "{}"); return d.match_left || ["", ""]; } catch { return ["", ""]; }
  });
  const [matchRight, setMatchRight] = useState<string[]>(() => {
    try { const d = JSON.parse(question.explanation || "{}"); return d.match_right || ["", ""]; } catch { return ["", ""]; }
  });
  const [matchCorrect, setMatchCorrect] = useState<Record<number, number>>(() => {
    try { const d = JSON.parse(question.explanation || "{}"); return d.match_correct || {}; } catch { return {}; }
  });

  // Reading type state
  const [readingPassage, setReadingPassage] = useState<string>(() => {
    try { const d = JSON.parse(question.explanation || "{}"); return d.reading_passage || ""; } catch { return ""; }
  });
  const [readingSubQuestions, setReadingSubQuestions] = useState<{question_text: string, options: {text: string, is_correct: boolean}[]}[]>(() => {
    try { const d = JSON.parse(question.explanation || "{}"); return d.reading_sub_questions || []; } catch { return []; }
  });

  // Fill-blank type state
  const [blankSentence, setBlankSentence] = useState<string>(() => {
    try { const d = JSON.parse(question.explanation || "{}"); return d.blank_sentence || ""; } catch { return ""; }
  });
  const [blankAnswers, setBlankAnswers] = useState<string[]>(() => {
    try { const d = JSON.parse(question.explanation || "{}"); return d.blank_answers || []; } catch { return []; }
  });

  useEffect(() => {
    setText(question.question_text || "");
    setAnswerType(question.answer_type || "variants");
    setOptions(question.options || []);
    setPoints(question.points || 5);
    setExplanation(question.explanation || "");
    setImageUrl(question.question_image || "");
  }, [question]);

  const handleSave = () => {
    let extraData: any = {};
    if (answerType === "matching") {
      extraData = { match_left: matchLeft, match_right: matchRight, match_correct: matchCorrect };
    } else if (answerType === "reading") {
      extraData = { reading_passage: readingPassage, reading_sub_questions: readingSubQuestions };
    } else if (answerType === "fillblank") {
      extraData = { blank_sentence: blankSentence, blank_answers: blankAnswers };
    }
    const finalExplanation = Object.keys(extraData).length > 0
      ? JSON.stringify(extraData)
      : explanation;

    onSave({
      id: question.id,
      question_text: text,
      question_image: imageUrl,
      answer_type: answerType,
      options,
      points,
      explanation: finalExplanation,
    });
  };

  const handleOptionChange = (idx: number, field: keyof AnswerOption, value: any) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === idx
          ? { ...opt, [field]: value }
          : field === "is_correct"
            ? { ...opt, is_correct: false }
            : opt
      )
    );
  };

  const addOption = () => {
    if (options.length >= 6) return;
    const label = String.fromCharCode(65 + options.length);
    setOptions((prev) => [...prev, { id: "", label, option_text: "", is_correct: false, order_index: prev.length }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((opt, i) => ({ ...opt, label: String.fromCharCode(65 + i), order_index: i }))
    );
  };

  const answerTypes: { key: AnswerType; label: string; desc: string }[] = [
    { key: "variants", label: "Variantli", desc: "A/B/C/D variantlardan birini tanlash" },
    { key: "truefalse", label: "To'g'ri/Noto'g'ri", desc: "Ha/Yo'q yoki To'g'ri/Noto'g'ri" },
    { key: "matching", label: "Moslashtirish", desc: "2 ustunni bir-biriga bog'lash" },
    { key: "reading", label: "Matn asosida", desc: "1 ta matn + bir nechta savol" },
    { key: "fillblank", label: "Bo'sh joy", desc: "Gapdagi bo'sh joylarni to'ldirish" },
    { key: "written", label: "Yozma", desc: "Erkin javob yozish" },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white dark:bg-[#0f1419] rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-hidden"
    >
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[11px] font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
            {question.order_index}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">
              {text || "Bo'sh savol"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {answerTypes.find((t) => t.key === answerType)?.label || answerType} · {points} ball
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
          >
            <TrashBinMinimalisticIcon className="w-3.5 h-3.5" />
          </button>
          {isExpanded ? (
            <AltArrowUpIcon className="w-4 h-4 text-slate-400" />
          ) : (
            <AltArrowDownIcon className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-200 dark:border-white/[0.06]"
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
                  Savol turi
                </label>
                <div className="flex flex-wrap gap-2">
                  {answerTypes.map((type) => (
                    <button
                      key={type.key}
                      onClick={() => {
                        setAnswerType(type.key);
                        if (type.key === "variants" && options.length < 2) {
                          setOptions([
                            { id: "", label: "A", option_text: "", is_correct: true, order_index: 0 },
                            { id: "", label: "B", option_text: "", is_correct: false, order_index: 1 },
                            { id: "", label: "C", option_text: "", is_correct: false, order_index: 2 },
                            { id: "", label: "D", option_text: "", is_correct: false, order_index: 3 },
                          ]);
                        }
                        if (type.key === "truefalse" && options.length < 2) {
                          setOptions([
                            { id: "", label: "A", option_text: "To'g'ri", is_correct: true, order_index: 0 },
                            { id: "", label: "B", option_text: "Noto'g'ri", is_correct: false, order_index: 1 },
                          ]);
                        }
                        if (type.key === "matching") {
                          if (matchLeft.length < 2) { setMatchLeft(["", ""]); setMatchRight(["", ""]); setMatchCorrect({}); }
                        }
                        if (type.key === "reading" && readingSubQuestions.length === 0) {
                          setReadingPassage("");
                          setReadingSubQuestions([{
                            question_text: "",
                            options: [
                              { text: "", is_correct: true },
                              { text: "", is_correct: false },
                              { text: "", is_correct: false },
                              { text: "", is_correct: false },
                            ]
                          }]);
                        }
                        if (type.key === "fillblank") {
                          if (!blankSentence) { setBlankSentence(""); setBlankAnswers([]); }
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                        answerType === type.key
                          ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10"
                      }`}
                      title={type.desc}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                {answerType && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {answerTypes.find(t => t.key === answerType)?.desc}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Savol matni
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMathTarget({ type: 'question' });
                      setShowMathDialog(true);
                    }}
                    className="text-[11px] font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <span className="text-sm">∑</span> Formula qo'shish
                  </button>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Savol matnini kiriting... (formula uchun $...$ yoki \(\) ishlating)"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
                <MathPreview text={text} />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
                  Savol rasmi
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-white/[0.06]"
                    />
                  )}
                </div>
              </div>

              {answerType === "variants" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Variantlar
                    </label>
                    {options.length < 6 && (
                      <button
                        onClick={addOption}
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                      >
                        + Qo'shish
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                            opt.is_correct
                              ? "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-2 border-green-400"
                              : "bg-slate-100 dark:bg-white/[0.06] text-slate-400"
                          }`}
                        >
                          {opt.label}
                        </span>
                        <input
                          type="text"
                          value={opt.option_text}
                          onChange={(e) => handleOptionChange(idx, "option_text", e.target.value)}
                          placeholder={`Variant ${opt.label}`}
                          className="flex-1 h-9 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setMathTarget({ type: 'option', index: idx });
                            setShowMathDialog(true);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-50 dark:hover:bg-purple-500/10 text-slate-400 hover:text-purple-500 transition-colors flex-shrink-0"
                          title="Formula qo'shish"
                        >
                          <span className="text-[11px] font-bold">∑</span>
                        </button>
                        <button
                          onClick={() => handleOptionChange(idx, "is_correct", true)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            opt.is_correct
                              ? "bg-green-100 dark:bg-green-500/10 text-green-600"
                              : "bg-slate-100 dark:bg-white/[0.06] text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          <CheckReadIcon className="w-4 h-4" />
                        </button>
                        {options.length > 2 && (
                          <button
                            onClick={() => removeOption(idx)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <CloseSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching type editor */}
              {answerType === "matching" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Moslashtirish juftliklari
                  </label>
                  <p className="text-[10px] text-slate-400">Chap va o'ng ustundagi elementlarni kiriting. To'g'ri bog'lanishni belgilang.</p>
                  <div className="grid grid-cols-[1fr_40px_1fr_40px] gap-2 items-center">
                    <span className="text-[10px] font-semibold text-slate-500">Chap ustun</span>
                    <span></span>
                    <span className="text-[10px] font-semibold text-slate-500">O'ng ustun</span>
                    <span></span>
                    {matchLeft.map((_, idx) => (
                      <>
                        <input key={`l-${idx}`} type="text" value={matchLeft[idx]} onChange={(e) => { const n = [...matchLeft]; n[idx] = e.target.value; setMatchLeft(n); }}
                          placeholder={`${idx + 1}-chi element`} className="h-8 px-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[11px]" />
                        <span className="text-center text-slate-400">↔</span>
                        <input key={`r-${idx}`} type="text" value={matchRight[idx]} onChange={(e) => { const n = [...matchRight]; n[idx] = e.target.value; setMatchRight(n); }}
                          placeholder={`${idx + 1}-chi javob`} className="h-8 px-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[11px]" />
                        <button onClick={() => {
                          setMatchCorrect(prev => {
                            const next = { ...prev };
                            next[idx] = (next[idx] || 0) + 1;
                            if (next[idx] >= matchRight.length) next[idx] = 0;
                            return next;
                          });
                        }} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          matchCorrect[idx] !== undefined ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                        }`} title="To'g'ri javobni belgilang">
                          {matchCorrect[idx] !== undefined ? String.fromCharCode(65 + matchCorrect[idx]) : "?"}
                        </button>
                      </>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setMatchLeft([...matchLeft, ""]); setMatchRight([...matchRight, ""]); }}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-700">+ Qator qo'shish</button>
                    {matchLeft.length > 2 && (
                      <button onClick={() => { setMatchLeft(matchLeft.slice(0, -1)); setMatchRight(matchRight.slice(0, -1)); }}
                        className="text-[11px] font-medium text-red-500 hover:text-red-600">- O'chirish</button>
                    )}
                  </div>
                </div>
              )}

              {/* Reading comprehension type editor */}
              {answerType === "reading" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
                      Matn (Passage)
                    </label>
                    <textarea value={readingPassage} onChange={(e) => setReadingPassage(e.target.value)}
                      placeholder="O'qish uchun matnni kiriting..."
                      rows={6} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] resize-none" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Savollar (matn asosida)
                      </label>
                      <button onClick={() => setReadingSubQuestions([...readingSubQuestions, {
                        question_text: "",
                        options: [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }]
                      }])} className="text-[11px] font-medium text-blue-600 hover:text-blue-700">+ Savol qo'shish</button>
                    </div>
                    {readingSubQuestions.map((sq, sIdx) => (
                      <div key={sIdx} className="p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-blue-600">{sIdx + 1}.</span>
                          <input type="text" value={sq.question_text} onChange={(e) => {
                            const n = [...readingSubQuestions]; n[sIdx] = { ...n[sIdx], question_text: e.target.value }; setReadingSubQuestions(n);
                          }} placeholder="Savol matni..." className="flex-1 h-8 px-2 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[11px]" />
                          {readingSubQuestions.length > 1 && (
                            <button onClick={() => setReadingSubQuestions(readingSubQuestions.filter((_, i) => i !== sIdx))}
                              className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:text-red-600"><CloseSquareIcon className="w-3 h-3" /></button>
                          )}
                        </div>
                        {sq.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2 ml-6">
                            <button onClick={() => {
                              const n = [...readingSubQuestions]; const opts = n[sIdx].options.map((o, i) => ({ ...o, is_correct: i === oIdx })); n[sIdx] = { ...n[sIdx], options: opts }; setReadingSubQuestions(n);
                            }} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${opt.is_correct ? "bg-green-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500"}`}>
                              {String.fromCharCode(65 + oIdx)}
                            </button>
                            <input type="text" value={opt.text} onChange={(e) => {
                              const n = [...readingSubQuestions]; const opts = [...n[sIdx].options]; opts[oIdx] = { ...opts[oIdx], text: e.target.value }; n[sIdx] = { ...n[sIdx], options: opts }; setReadingSubQuestions(n);
                            }} placeholder={`Variant ${String.fromCharCode(65 + oIdx)}`} className="flex-1 h-7 px-2 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded text-[11px]" />
                            {sq.options.length > 2 && (
                              <button onClick={() => {
                                const n = [...readingSubQuestions]; n[sIdx] = { ...n[sIdx], options: sq.options.filter((_, i) => i !== oIdx) }; setReadingSubQuestions(n);
                              }} className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-500"><CloseSquareIcon className="w-3 h-3" /></button>
                            )}
                          </div>
                        ))}
                        {sq.options.length < 6 && (
                          <button onClick={() => {
                            const n = [...readingSubQuestions]; n[sIdx] = { ...n[sIdx], options: [...sq.options, { text: "", is_correct: false }] }; setReadingSubQuestions(n);
                          }} className="ml-6 text-[10px] text-blue-500">+ Variant</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fill in the blank type editor */}
              {answerType === "fillblank" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 block">
                      Gap (bo'sh joylarni ___ bilan belgilang)
                    </label>
                    <textarea value={blankSentence} onChange={(e) => setBlankSentence(e.target.value)}
                      placeholder="Masalan: O'zbekiston ___ da joylashgan. Poytaxti ___ ."
                      rows={3} className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px] resize-none" />
                    <p className="text-[10px] text-slate-400 mt-1">Bo'sh joy uchun ___ (3 ta pastki chiziq) ishlating</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">
                      To'g'ri javoblar (bo'sh joylar tartibida)
                    </label>
                    {blankSentence.split("___").slice(1).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {idx + 1}
                        </span>
                        <input type="text" value={blankAnswers[idx] || ""} onChange={(e) => {
                          const n = [...blankAnswers]; n[idx] = e.target.value; setBlankAnswers(n);
                        }} placeholder={`${idx + 1}-chi bo'sh joyning javobi`}
                          className="flex-1 h-8 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[12px]" />
                      </div>
                    ))}
                    {blankSentence.split("___").length <= 1 && (
                      <p className="text-[10px] text-amber-500">Gapda ___ belgisi topilmadi. Gapga ___ qo'shing.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                    Ball
                  </label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                    Izoh
                  </label>
                  <input
                    type="text"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="To'g'ri javob izohi..."
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-[12px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showMathDialog && (
        <MathFormulaDialog
          onClose={() => setShowMathDialog(false)}
          onInsert={(formula) => {
            if (mathTarget.type === 'question') {
              setText((prev) => prev ? `${prev} $${formula}$` : `$${formula}$`);
            } else if (mathTarget.type === 'option' && mathTarget.index !== undefined) {
              const opt = options[mathTarget.index];
              handleOptionChange(mathTarget.index, "option_text", opt.option_text ? `${opt.option_text} $${formula}$` : `$${formula}$`);
            } else if (mathTarget.type === 'explanation') {
              setExplanation((prev) => prev ? `${prev} $${formula}$` : `$${formula}$`);
            }
            setShowMathDialog(false);
          }}
          mathFieldRef={mathFieldRef}
        />
      )}
    </motion.div>
  );
};

export default BuilderTest;
