import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, Send, AlertTriangle, History, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SUPPORT_TABS = ["messages", "complaints"] as const;
type SupportTab = (typeof SUPPORT_TABS)[number];

const Support = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SupportTab>("messages");

  useEffect(() => {
    const hash = location.hash.replace(/^#/, "");
    if (SUPPORT_TABS.includes(hash as SupportTab)) {
      setActiveTab(hash as SupportTab);
    }
  }, [location.hash]);

  const handleTabChange = (tab: string) => {
    const next = tab as SupportTab;
    setActiveTab(next);
    navigate(`/support#${next}`, { replace: true });
  };
  
  // Message state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch messages
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["my-messages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch complaints
  const { data: complaints, isLoading: loadingComplaints } = useQuery({
    queryKey: ["my-complaints", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        user_id: user.id,
        subject,
        message,
        is_from_admin: false,
      });
      if (error) throw error;
      toast({ title: "Xabar yuborildi!", description: "Admin tez orada javob beradi." });
      setSubject("");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["my-messages"] });
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-20 animate-fade-in pr-4 md:pr-10">
      {/* Premium Support Header */}
      <div className="bg-white dark:bg-slate-900 border border-[#F3F4F6] dark:border-slate-800 rounded-[32px] p-8 md:p-10 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex-1 text-center md:text-left space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Yordam va qo'llab-quvvatlash</p>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1]">
              Yordam Markazi
            </h1>
            <p className="text-sm md:text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-2xl">
              Savollaringiz bormi yoki muammoga duch keldingizmi? Bizning jamoamiz sizga yordam berishga tayyor.
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full md:w-[40%] max-w-[350px] md:max-w-[400px] aspect-square animate-float flex items-center justify-center">
          <img 
            src="/support_help.png" 
            alt="Support Illustration" 
            className="w-full h-full object-contain filter drop-shadow-[0_20px_60px_rgba(59,130,246,0.15)] transition-transform duration-700"
          />
        </div>
      </div>

      <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
        <TabsList className="bg-muted p-1 rounded-2xl w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="messages" className="rounded-xl flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Xabarlar
          </TabsTrigger>
          <TabsTrigger value="complaints" className="rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Shikoyatlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6 space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-secondary" /> Yangi murojaat
                </h2>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="text-[13px] font-semibold text-slate-500 ml-1">Mavzu (ixtiyoriy)</label>
                    <Input 
                      value={subject} 
                      onChange={(e) => setSubject(e.target.value)} 
                      placeholder="Murojaat mavzusi" 
                      className="mt-1 bg-muted/50 border-border rounded-xl focus:ring-secondary/20" 
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-slate-500 ml-1">Xabar</label>
                    <Textarea 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      placeholder="Savolingiz yoki taklifingizni yozing..." 
                      className="mt-1 bg-muted/50 border-border rounded-xl min-h-[140px] focus:ring-secondary/20" 
                      required 
                    />
                  </div>
                  <Button type="submit" disabled={sending} className="bg-secondary text-secondary-foreground shadow-glow hover:opacity-90 w-full rounded-xl py-6 font-bold">
                    {sending ? "Yuborilmoqda..." : "Xabarni yuborish"}
                  </Button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-3 order-1 lg:order-2">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border h-full flex flex-col">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-secondary" /> Yozishmalar tarixi
                </h2>
                <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-2 custom-scrollbar">
                  {loadingMessages ? (
                    <div className="flex justify-center py-10"><Clock className="animate-spin text-muted-foreground" /></div>
                  ) : messages && messages.length > 0 ? (
                    messages.map((m) => (
                      <div 
                        key={m.id} 
                        className={`p-4 rounded-2xl max-w-[90%] ${
                          m.is_from_admin 
                            ? "bg-muted self-start mr-auto border border-border" 
                            : "bg-secondary/10 self-end ml-auto border border-secondary/20"
                        }`}
                      >
                        {m.subject && <p className="text-[11px] font-bold text-secondary uppercase mb-1">{m.subject}</p>}
                        <p className="text-sm text-foreground whitespace-pre-wrap">{m.message}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-2 opacity-50">
                          <span className="text-[10px] font-medium">{new Date(m.created_at).toLocaleString("uz", { hour: "2-digit", minute: "2-digit" })}</span>
                          {!m.is_from_admin && <CheckCircle className="w-3 h-3 text-secondary" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto opacity-10 mb-2" />
                      <p className="text-sm">Hali xabarlar yuborilmagan</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="complaints" className="mt-6 animate-fade-in">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" /> Mening shikoyatlarim
            </h2>
            <div className="space-y-4">
              {loadingComplaints ? (
                <div className="flex justify-center py-10"><Clock className="animate-spin text-muted-foreground" /></div>
              ) : complaints && complaints.length > 0 ? (
                complaints.map((c) => (
                  <div key={c.id} className="p-5 rounded-2xl bg-muted/30 border border-border hover:border-warning/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.status === "pending" ? "bg-warning/10 text-warning" :
                        c.status === "reviewed" ? "bg-info/10 text-info" :
                        "bg-green-500/10 text-green-500"
                      }`}>
                        {c.status === "pending" ? "Kutilmoqda" : c.status === "reviewed" ? "Ko'rib chiqilmoqda" : "Hal qilindi"}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">{new Date(c.created_at).toLocaleDateString("uz")}</span>
                    </div>
                    <p className="text-sm text-foreground font-medium leading-relaxed">{c.message}</p>
                    {c.admin_reply && (
                      <div className="mt-4 p-4 bg-white/50 dark:bg-slate-900/50 border border-dashed border-border rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-secondary" />
                          <span className="text-xs font-bold text-secondary uppercase">Admin javobi:</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic">{c.admin_reply}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-muted rounded-2xl">
                  <AlertTriangle className="w-12 h-12 mx-auto opacity-10 mb-2" />
                  <p className="text-sm">Sizda hozircha shikoyatlar mavjud emas</p>
                  <p className="text-xs mt-1">Test yechish jarayonida xatolik topsangiz shikoyat yuborishingiz mumkin.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Support;
