import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Calendar, Trash2, ExternalLink, CheckCircle2, Clock, Award } from "lucide-react";

const TeacherPortfolioSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newAchievement, setNewAchievement] = useState({
    category: "ochiq_dars",
    title: "",
    description: "",
    event_date: new Date().toISOString().split('T')[0],
  });

  const { data: achievements, refetch } = useQuery({
    queryKey: ["teacher-portfolio", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_portfolio" as any)
        .select("*")
        .eq("user_id", user?.id)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data as any;
    },
    enabled: !!user,
  });

  const handleAdd = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("teacher_portfolio" as any).insert({
        user_id: user.id,
        category: newAchievement.category,
        title: newAchievement.title,
        description: newAchievement.description,
        event_date: newAchievement.event_date,
      } as any);

      if (error) throw error;
      toast({ title: "Muvaffaqiyatli!", description: "Yutuq portfolioga qo'shildi." });
      setIsAddOpen(false);
      setNewAchievement({ category: "ochiq_dars", title: "", description: "", event_date: new Date().toISOString().split('T')[0] });
      refetch();
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("teacher_portfolio" as any).delete().eq("id", id);
      if (error) throw error;
      toast({ title: "O'chirildi", description: "Ma'lumot portfoliodan olib tashlandi." });
      refetch();
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  };

  const categoriesMap: Record<string, string> = {
    "ochiq_dars": "Ochiq dars",
    "maqola": "Ilmiy maqola/Nashr",
    "tanlov": "Kasbiy tanlov",
    "ikt_foydalanish": "AKT vositalari",
    "student_achievements": "O'quvchilar yutug'i"
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pedagogik Mahorat Portfoliosi</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Attestatsiya uchun ballar</p>
          </div>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-10 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold">
              <Plus className="mr-2 w-4 h-4" />
              Yutuq qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-[32px] p-8">
            <DialogHeader>
              <DialogTitle className="text-xl font-black mb-4">Portfolioga qo'shish</DialogTitle>
              <DialogDescription className="sr-only">
                Yutuqlaringizni portfolioga qo'shish uchun ma'lumotlarni to'ldiring.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Kategoriya</Label>
                <Select value={newAchievement.category} onValueChange={(v) => setNewAchievement({...newAchievement, category: v})}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Object.entries(categoriesMap).map(([id, label]) => (
                      <SelectItem key={id} value={id}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Sarlavha</Label>
                <Input 
                  placeholder="Masalan: Ochiq dars..." 
                  value={newAchievement.title}
                  onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Sana</Label>
                <Input 
                  type="date"
                  value={newAchievement.event_date}
                  onChange={(e) => setNewAchievement({...newAchievement, event_date: e.target.value})}
                  className="h-11 rounded-xl"
                />
              </div>

              <Button onClick={handleAdd} disabled={loading || !newAchievement.title} className="w-full h-12 rounded-xl bg-blue-500 text-white font-bold">
                {loading ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements?.map((ach: any) => (
          <div key={ach.id} className="p-5 rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{categoriesMap[ach.category]}</p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{ach.title}</h4>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                <Calendar className="w-3 h-3" />
                {new Date(ach.event_date).toLocaleDateString()}
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                {ach.is_verified ? (
                   <span className="text-emerald-500 font-bold">Tasdiqlangan</span>
                ) : (
                   <span className="text-amber-500 font-bold">Kutilmoqda</span>
                )}
              </div>
            </div>
            <button onClick={() => handleDelete(ach.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {achievements?.length === 0 && (
          <div className="col-span-full py-10 text-center space-y-3">
             <FileText className="w-10 h-10 text-slate-200 mx-auto" />
             <p className="text-xs text-slate-400 font-medium">Hali yutuqlar qo'shilmagan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherPortfolioSection;
