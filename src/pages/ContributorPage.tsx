import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Search, Plus, Trash2, Save, FileText, CheckCircle,
  XCircle, Loader2, Edit3, X, ChevronRight, BookOpen, Filter, FolderPlus,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ContributorPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);
  const [questionLevel, setQuestionLevel] = useState("bilish");
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ["contributor-subjects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subjects")
        .select("id, name, color_from, color_to, icon_name")
        .eq("is_active", true)
        .order("order_number");
      return data || [];
    },
  });

  // Fetch folders for selected subject
  const { data: folders = [] } = useQuery({
    queryKey: ["contributor-folders", selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const { data } = await supabase
        .from("test_folders")
        .select("*")
        .eq("subject", selectedSubject)
        .eq("category", "mavzulashtirilgan")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    enabled: !!selectedSubject,
  });

  // Fetch questions for selected folder
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["contributor-questions", selectedFolder?.id],
    queryFn: async () => {
      if (!selectedFolder?.id) return [];
      const { data } = await supabase
        .from("questions")
        .select("*")
        .eq("folder_id", selectedFolder.id)
        .order("order_number");
      return data || [];
    },
    enabled: !!selectedFolder?.id,
  });

  // Add question mutation
  const addQuestion = useMutation({
    mutationFn: async (question: any) => {
      const payload: any = {
        folder_id: selectedFolder.id,
        question_text: question.question_text,
        options: question.options,
        correct_option: question.correct_option,
        level: question.level,
        order_number: questions.length,
        submitted_by: user?.id,
      };
      if (isAdmin) {
        payload.status = "active";
        payload.approved_by = user?.id;
        payload.approved_at = new Date().toISOString();
      } else {
        payload.status = "pending";
      }
      const { error } = await supabase.from("questions").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contributor-questions", selectedFolder?.id] });
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectOption(0);
      setQuestionLevel("bilish");
    },
  });

  // Update question mutation
  const updateQuestion = useMutation({
    mutationFn: async (question: any) => {
      const { error } = await supabase
        .from("questions")
        .update({
          question_text: question.question_text,
          options: question.options,
          correct_option: question.correct_option,
          level: question.level,
        })
        .eq("id", question.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contributor-questions", selectedFolder?.id] });
      setEditingQuestion(null);
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectOption(0);
      setQuestionLevel("bilish");
    },
  });

  // Delete question mutation
  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contributor-questions", selectedFolder?.id] });
    },
  });

  // Bulk add mutation
  const bulkAdd = useMutation({
    mutationFn: async (questionsText: string) => {
      const lines = questionsText.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        const parts = line.split("|").map((p) => p.trim());
        if (parts.length < 6) continue;
        const [qText, optA, optB, optC, optD, correct] = parts;
        const correctIdx = ["a", "b", "c", "d"].indexOf(correct.toLowerCase());
        const payload: any = {
          folder_id: selectedFolder.id,
          question_text: qText,
          options: [
            { label: "A", option_text: optA, is_correct: correctIdx === 0 },
            { label: "B", option_text: optB, is_correct: correctIdx === 1 },
            { label: "C", option_text: optC, is_correct: correctIdx === 2 },
            { label: "D", option_text: optD, is_correct: correctIdx === 3 },
          ],
          correct_option: correctIdx >= 0 ? correctIdx : 0,
          level: "bilish",
          order_number: questions.length,
          submitted_by: user?.id,
        };
        if (isAdmin) {
          payload.status = "active";
          payload.approved_by = user?.id;
          payload.approved_at = new Date().toISOString();
        } else {
          payload.status = "pending";
        }
        await supabase.from("questions").insert(payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contributor-questions", selectedFolder?.id] });
      setBulkText("");
      setBulkMode(false);
    },
  });

  const filteredFolders = useMemo(() => {
    if (!searchTerm) return folders;
    return folders.filter((f: any) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [folders, searchTerm]);

  // Create folder mutation
  const createFolder = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { data, error } = await supabase
        .from("test_folders")
        .insert({
          name,
          description,
          category: "mavzulashtirilgan",
          subject: selectedSubject,
          price: 0,
          duration_minutes: 30,
          questions_count: 0,
          is_active: true,
          difficulty: "oson",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Papka yaratildi!", description: "Papka faol holatda" });
      qc.invalidateQueries({ queryKey: ["contributor-folders", selectedSubject] });
      setShowCreateFolder(false);
      setNewFolderName("");
      setNewFolderDesc("");
    },
    onError: (err: any) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!questionText.trim() || options.some((o) => !o.trim())) return;
    const question = {
      question_text: questionText,
      options: options.map((o, i) => ({
        label: String.fromCharCode(65 + i),
        option_text: o,
        is_correct: i === correctOption,
      })),
      correct_option: correctOption,
      level: questionLevel,
    };
    if (editingQuestion) {
      updateQuestion.mutate({ ...question, id: editingQuestion.id });
    } else {
      addQuestion.mutate(question);
    }
  };

  const startEdit = (q: any) => {
    setEditingQuestion(q);
    setQuestionText(q.question_text);
    const opts = q.options || [];
    setOptions([
      opts[0]?.option_text || "",
      opts[1]?.option_text || "",
      opts[2]?.option_text || "",
      opts[3]?.option_text || "",
    ]);
    setCorrectOption(q.correct_option || 0);
    setQuestionLevel(q.level || "bilish");
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectOption(0);
    setQuestionLevel("bilish");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0f1a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0f1419] border-b border-slate-100 dark:border-white/[0.06] sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (selectedFolder) {
                setSelectedFolder(null);
                setEditingQuestion(null);
              } else if (selectedSubject) {
                setSelectedSubject(null);
              } else {
                navigate("/tests");
              }
            }}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[14px] font-bold text-slate-900 dark:text-white">
              {selectedFolder
                ? selectedFolder.name
                : selectedSubject
                ? `${selectedSubject} — Papkalar`
                : "Savol qo'shish"}
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {selectedFolder
                ? `${questions.length} ta savol`
                : selectedSubject
                ? `${filteredFolders.length} ta papka`
                : "Fan tanlang"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4">
        {/* Step 1: Subject Selection */}
        {!selectedSubject && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {subjects.map((s: any) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.name)}
                className="bg-white dark:bg-[#0f1419] rounded-xl border border-slate-100 dark:border-white/[0.06] p-4 text-left hover:border-slate-200 dark:hover:border-white/[0.12] hover:shadow-md transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: (s.color_from || "#0891b2") + "18" }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: s.color_from || "#0891b2" }} />
                </div>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-[#E8192C] transition-colors">
                  {s.name}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Folder Selection */}
        {selectedSubject && !selectedFolder && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Papka qidirish..."
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Create folder button */}
            <button
              onClick={() => setShowCreateFolder(true)}
              className="w-full mb-4 py-3 border-2 border-dashed border-purple-300 dark:border-purple-500/30 rounded-xl text-[12px] font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Yangi papka yaratish
            </button>

            {/* Create folder form */}
            <AnimatePresence>
              {showCreateFolder && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="bg-white dark:bg-[#0f1419] rounded-xl border border-purple-200 dark:border-purple-500/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[13px] font-bold text-slate-900 dark:text-white">Yangi papka</h3>
                      <button onClick={() => { setShowCreateFolder(false); setNewFolderName(""); setNewFolderDesc(""); }}>
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Papka nomi *"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                    <textarea
                      value={newFolderDesc}
                      onChange={(e) => setNewFolderDesc(e.target.value)}
                      placeholder="Papka tavsifi (ixtiyoriy)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400 resize-none h-16"
                    />
                    <button
                      onClick={() => {
                        if (!newFolderName.trim()) return;
                        createFolder.mutate({ name: newFolderName, description: newFolderDesc });
                      }}
                      disabled={!newFolderName.trim() || createFolder.isPending}
                      className="w-full py-2 bg-purple-500 text-white rounded-xl text-[12px] font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {createFolder.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Yaratish
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFolders.map((f: any) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolder(f)}
                  className="bg-white dark:bg-[#0f1419] rounded-xl border border-slate-100 dark:border-white/[0.06] p-4 text-left hover:border-slate-200 dark:hover:border-white/[0.12] hover:shadow-md transition-all group flex items-center justify-between"
                >
                  <div>
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-[#E8192C] transition-colors">
                      {f.name}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {f.questions_count || 0} savol
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </button>
              ))}
              {filteredFolders.length === 0 && (
                <div className="col-span-full text-center py-8 text-[12px] text-slate-400">
                  Papkalar topilmadi
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 3: Question Editor */}
        {selectedFolder && (
          <div className="space-y-4">
            {/* AI Generate + Bulk mode toggles */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/tests/contributor/ai-generate?folderId=${selectedFolder.id}&folderName=${encodeURIComponent(selectedFolder.name)}&subject=${encodeURIComponent(selectedFolder.subject || "")}`)}
                className="px-3 py-2 rounded-xl text-[11px] font-bold transition-all bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Test Yaratish
              </button>
              <button
                onClick={() => { setBulkMode(!bulkMode); cancelEdit(); }}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  bulkMode
                    ? "bg-purple-500 text-white"
                    : "bg-white dark:bg-[#0f1419] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                }`}
              >
                <Filter className="w-3.5 h-3.5 inline mr-1" />
                Ommaviy qo'shish
              </button>
            </div>

            {/* Bulk add mode */}
            {bulkMode && (
              <div className="bg-white dark:bg-[#0f1419] rounded-xl border border-slate-100 dark:border-white/[0.06] p-4 space-y-3">
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white">Ommaviy qo'shish</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Har bir satr: Savol | A variant | B variant | C variant | D variant | To'g'ri javob (a/b/c/d)
                </p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Savol matni | Variant A | Variant B | Variant C | Variant D | a\n\nMasalan:\n2+2=? | 3 | 4 | 5 | 6 | b\n3+5=? | 6 | 7 | 8 | 9 | c`}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[11px] text-slate-900 dark:text-white placeholder:text-slate-400 font-mono h-40 resize-none"
                />
                <button
                  onClick={() => {
                    if (!bulkText.trim()) return;
                    bulkAdd.mutate(bulkText);
                  }}
                  disabled={!bulkText.trim() || bulkAdd.isPending}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl text-[12px] font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {bulkAdd.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Qo'shish
                </button>
              </div>
            )}

            {/* Single question form */}
            {!bulkMode && (
              <div className="bg-white dark:bg-[#0f1419] rounded-xl border border-slate-100 dark:border-white/[0.06] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-bold text-slate-900 dark:text-white">
                    {editingQuestion ? "Savolni tahrirlash" : "Yangi savol"}
                  </h3>
                  {editingQuestion && (
                    <button onClick={cancelEdit} className="text-[10px] text-slate-400 hover:text-slate-600">
                      Bekor qilish
                    </button>
                  )}
                </div>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Savol matnini kiriting..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400 resize-none h-20"
                />
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        onClick={() => setCorrectOption(idx)}
                        className={`w-7 h-7 rounded-lg text-[11px] font-bold flex-shrink-0 transition-all ${
                          correctOption === idx
                            ? "bg-green-500 text-white"
                            : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[idx] = e.target.value;
                          setOptions(newOpts);
                        }}
                        placeholder={`Variant ${String.fromCharCode(65 + idx)}`}
                        className="flex-1 px-3 py-2 bg-white dark:bg-[#0a0f1a] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12px] text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">To'g'ri javobni belgilash uchun variant tugmasini bosing</p>
                <div className="flex gap-2">
                  <select
                    value={questionLevel}
                    onChange={(e) => setQuestionLevel(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-[#0a0f1a] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[12px] text-slate-900 dark:text-white"
                  >
                    <option value="bilish">Bilish</option>
                    <option value="qollash">Qo'llash</option>
                    <option value="mulohaza">Mulohaza</option>
                  </select>
                  <button
                    onClick={handleSubmit}
                    disabled={!questionText.trim() || options.some((o) => !o.trim()) || addQuestion.isPending || updateQuestion.isPending}
                    className="flex-1 py-2 bg-green-500 text-white rounded-xl text-[12px] font-bold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {addQuestion.isPending || updateQuestion.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : editingQuestion ? (
                      <Save className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    {editingQuestion ? "Saqlash" : "Qo'shish"}
                  </button>
                </div>
              </div>
            )}

            {/* Questions list */}
            <div className="space-y-3">
              <h3 className="text-[13px] font-extrabold text-slate-800 dark:text-slate-200">
                Savollar ({questions.length})
              </h3>
              {questionsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-violet-600 animate-spin mx-auto" />
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8 text-[12.5px] font-extrabold text-slate-400">
                  Hali savollar yo'q
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                  {questions.map((q: any, idx: number) => (
                    <div
                      key={q.id}
                      className={`bg-white dark:bg-[#0f1419] rounded-2xl border p-4 shadow-2xs ${
                        editingQuestion?.id === q.id
                          ? "border-purple-300 dark:border-purple-500/30"
                          : "border-slate-100 dark:border-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-extrabold text-slate-900 dark:text-white leading-relaxed">
                            {idx + 1}. {q.question_text}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(q.options || []).map((o: any, i: number) => (
                              <span
                                key={i}
                                className={`text-[10px] px-2 py-0.5 rounded-md ${
                                  i === q.correct_option
                                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold"
                                    : "bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-bold"
                                }`}
                              >
                                {o.label}: {o.option_text}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-2.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-extrabold">
                              {q.level || "bilish"}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                              q.status === "active"
                                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                : q.status === "pending"
                                ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300"
                            }`}>
                              {q.status === "active" ? "Faol" : q.status === "pending" ? "Kutilmoqda" : "Rad etilgan"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(q)}
                            className="w-7.5 h-7.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Savol o'chirilsinmi?")) {
                                deleteQuestion.mutate(q.id);
                              }
                            }}
                            className="w-7.5 h-7.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContributorPage;
