import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Send,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import SEO from "@/components/SEO";
import { toast } from "sonner";

const contactMethods = [
  {
    title: "Elektron Pochta",
    value: "info@educontest.uz",
    desc: "Umumiy va rasmiy murojaatlar uchun",
    link: "mailto:info@educontest.uz",
    icon: Mail,
  },
  {
    title: "Texnik Qo'llab-quvvatlash",
    value: "support@educontest.uz",
    desc: "Sayt va test bo'yicha yordam",
    link: "mailto:support@educontest.uz",
    icon: Headphones,
  },
  {
    title: "Telegram Kanal & Bot",
    value: "@educontest / @educontesttbot",
    desc: "Tezkor yangiliklar va savol-javob",
    link: "https://t.me/educontest",
    icon: Send,
  },
  {
    title: "Manzil",
    value: "Toshkent shahar, O'zbekiston",
    desc: "Bosh offis va rivojlantirish markazi",
    link: "#",
    icon: MapPin,
  },
];

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Xabaringiz muvaffaqiyatli yuborildi! Tez orada siz bilan bog'lanamiz.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  return (
    <>
      <SEO
        title="Bog'lanish va Aloqa — EduContest.uz"
        description="EduContest.uz bilan bog'lanish: Email, Telegram, texnik yordam va murojaatlar markazi."
        canonical={`${window.location.origin}/contact`}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 font-sans">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">

          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Bosh sahifaga qaytish
            </button>
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-md">
              <Mail className="w-8 h-8 text-[#E8192C]" />
            </div>
            <div className="max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                Bog'lanish va Aloqa
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Savollaringiz, takliflaringiz yoki texnik murojaatlaringiz bo'lsa, biz bilan bog'laning.
              </p>
            </div>
          </div>

          {/* Contact Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactMethods.map((c, i) => (
              <a
                key={i}
                href={c.link}
                target={c.link.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-start gap-4 hover:border-[#E8192C]/40 transition-all shadow-xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <c.icon className="w-5 h-5 text-[#E8192C]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{c.title}</h3>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{c.value}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.desc}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Murojaat Yuborish
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Quyidagi forma orqali yozib qoldiring. 24 soat ichida javob beramiz.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ismingiz *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masalan: Sardor Rahimov"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E8192C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email manzilingiz *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="masalan@domain.uz"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E8192C]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mavzu</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Masalan: Hamkorlik yoki Testdagi xatolik"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E8192C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Xabar matni *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Murojaatingiz matnini batafsil yozing..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#E8192C] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-[#E8192C] text-white font-bold px-8 py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-[#D41524] transition-colors shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? "Yuborilmoqda..." : "Xabarni Yuborish"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
};

export default Contact;
