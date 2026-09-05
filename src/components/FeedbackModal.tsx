import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ThumbsUp, Bug, Lightbulb, MessageSquare, ImagePlus, X, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStoragePublicUrl } from "@/lib/storage";

const FEEDBACK_TYPES = [
  { id: "positive", label: "Hammasi zo'r", icon: ThumbsUp },
  { id: "bug_report", label: "Xatolik topdim", icon: Bug },
  { id: "feature_request", label: "Taklif bildiraman", icon: Lightbulb },
  { id: "general", label: "Umumiy fikr", icon: MessageSquare },
];

const CATEGORIES = [
  { id: "ui_ux", label: "Design / UX" },
  { id: "content", label: "Kontent" },
  { id: "performance", label: "Tezlik / Ishlash" },
  { id: "bug", label: "Xato / Bug" },
  { id: "payment", label: "To'lov tizimi" },
  { id: "other", label: "Boshqa" },
];

export function FeedbackModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("bug_report");
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ctrl+V Clipboard Paste Handler
  useEffect(() => {
    if (!open) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            toast.success("Screenshot nusxalindi! 📸");
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (message.trim().length < 5) {
      toast.error("Iltimos, kamida 5 ta belgi kiriting");
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | null = null;

      // 1. Upload screenshot image if attached/pasted
      if (imageFile) {
        const rawName = imageFile.name || "screenshot.jpg";
        const ext = rawName.includes(".") ? rawName.split('.').pop() || 'jpg' : 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("feedback_images")
          .upload(fileName, imageFile, {
            upsert: true,
            contentType: imageFile.type || "image/jpeg"
          });

        if (uploadError) {
          console.error("Image upload error:", uploadError);
          toast.error(`Rasm yuklashda xatolik: ${uploadError.message}`);
          setLoading(false);
          return;
        }

        imageUrl = getStoragePublicUrl("feedback_images", fileName);
      }

      // 2. Get current user session
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id || null;

      // 3. Save to database
      const { error: insertError } = await (supabase as any)
        .from("platform_feedback")
        .insert({
          user_id: currentUserId,
          feedback_type: type,
          category: category,
          message: message.trim(),
          image_url: imageUrl,
        });

      if (insertError) {
        console.error("Database insert error:", insertError);
        toast.error(`Xatolik: ${insertError.message}`);
        setLoading(false);
        return;
      }

      toast.success("Fikringiz uchun rahmat!");
      setOpen(false);
      setMessage("");
      removeImage();
    } catch (err: any) {
      console.error("Unexpected feedback error:", err);
      toast.error("Fikr yuborishda kutilmagan xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-24px)] sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none rounded-3xl z-50 flex flex-col shadow-2xl">
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 scrollbar-thin">
          <DialogHeader className="mb-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              <span className="w-6 h-6 rounded-full bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-500 font-bold text-xs">!</span>
              Fikr qoldirish
            </DialogTitle>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Batafsil ma'lumot bering, biz esa xatoni to'g'rilaymiz!
            </p>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-5">
            {/* Types */}
            <div>
              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                Nima haqida yozmoqchisiz?
              </p>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {FEEDBACK_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isActive = type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`flex items-center gap-2 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                        isActive 
                          ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 shadow-xs" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categories */}
            <div>
              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                Kategoriya
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs font-bold transition-all ${
                      category === c.id
                        ? "bg-[#1B223C] text-white border-[#1B223C] dark:bg-white dark:text-[#1B223C] dark:border-white shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                Xabaringiz
              </p>
              <Textarea
                placeholder="Muammoni yoki taklifni batafsil yozing... (Ctrl+V orqali screenshot joylashingiz mumkin)"
                className="resize-none h-24 sm:h-28 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 rounded-2xl focus-visible:ring-1 focus-visible:ring-purple-500 text-xs sm:text-sm font-medium"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={300}
              />
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                {message.length}/300 belgi (min: 5)
              </p>
            </div>

            {/* Upload & Ctrl+V preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Rasm / Screenshot (Ixtiyoriy)
                </p>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                  Ctrl+V orqali rasm joylang
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-2 flex items-center gap-3">
                  <img src={imagePreview} alt="Screenshot" className="w-16 h-16 object-cover rounded-xl shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {imageFile?.name || "Clipboard Screenshot"}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3" /> Rasm biriktirildi
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 hover:border-purple-300 dark:hover:border-purple-800 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all text-xs sm:text-sm font-semibold w-full"
                >
                  <ImagePlus className="w-4 h-4 text-purple-500" />
                  <span>Screenshot yuklash yoki Ctrl+V bosing</span>
                </button>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="button"
              className={`w-full h-11 sm:h-12 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
                message.trim().length >= 5 && !loading
                  ? "bg-[#1B223C] hover:bg-slate-900 text-white dark:bg-white dark:text-[#1B223C] dark:hover:bg-slate-100 shadow-md active:scale-[0.99]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
              }`}
              onClick={handleSubmit}
              disabled={message.trim().length < 5 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Yuborilmoqda...</span>
                </>
              ) : (
                <span>Yuborish</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
