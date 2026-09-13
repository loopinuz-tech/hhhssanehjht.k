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
import { Plus, FileText, Calendar, Trash2, ExternalLink, CheckCircle2, Clock } from "lucide-react";

const Portfolio = () => {
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
    <div className="w-full space-y-10 pb-20 pr-4 md:pr-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">O'qituvchi Portfoliosi</h1>
          <p className="text-slate-500 font-medium">Barcha pedagogik mahorat yutuqlaringizni shu yerda boshqaring.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20">
              <Plus className="mr-2 w-5 h-5" />
              Yutuq qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black mb-4">Yangi yutuq qo'shish</DialogTitle>
              <DialogDescription className="text-slate-500">
                O'zingizning pedagogik yutuqlaringizni portfolioga qo'shing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Kategoriya</Label>
                <Select value={newAchievement.category} onValueChange={(v) => setNewAchievement({...newAchievement, category: v})}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Object.entries(categoriesMap).map(([id, label]) => (
                      <SelectItem key={id} value={id}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Sarlavha</Label>
                <Input 
                  placeholder="Masalan: 'Matematika fani bo'yicha ochiq dars'" 
                  value={newAchievement.title}
                  onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Sana</Label>
                <Input 
                  type="date"
                  value={newAchievement.event_date}
                  onChange={(e) => setNewAchievement({...newAchievement, event_date: e.target.value})}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tavsif (Ixtiyoriy)</Label>
                <Input 
                  placeholder="Batafsil ma'lumot..." 
                  value={newAchievement.description}
                  onChange={(e) => setNewAchievement({...newAchievement, description: e.target.value})}
                  className="h-12 rounded-xl"
                />
              </div>

              <Button onClick={handleAdd} disabled={loading || !newAchievement.title} className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg">
                {loading ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements?.map((ach: any) => (
          <Card key={ach.id} className="group overflow-hidden border-slate-100 dark:border-slate-800 rounded-[32px] hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-none transition-all duration-500">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${(ach as any).is_verified ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                  {(ach as any).is_verified ? (
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Tasdiqlangan</span>
                  ) : (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Kutilmoqda</span>
                  )}
                </div>
                <button onClick={() => handleDelete(ach.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{categoriesMap[(ach as any).category]}</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight line-clamp-2">{(ach as any).title}</h3>
                {(ach as any).description && <p className="text-sm text-slate-500 font-medium line-clamp-2">{(ach as any).description}</p>}
              </div>

              <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold">{new Date((ach as any).event_date).toLocaleDateString()}</span>
                </div>
                {(ach as any).file_url ? (
                  <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-blue-500 font-bold hover:bg-blue-50">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Hujjat
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-slate-400 font-bold hover:bg-slate-50">
                    Hujjat yo'q
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {achievements?.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 rounded-[40px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hali yutuqlar qo'shilmagan</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Portfoliongizni to'ldirishni boshlang va attestatsiya ballarini yig'ing.</p>
            </div>
            <Button onClick={() => setIsAddOpen(true)} variant="outline" className="rounded-full px-8 font-bold">
              Birinchi yutuqni qo'shish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
