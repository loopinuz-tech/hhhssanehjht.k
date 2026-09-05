import { useState } from "react";
import { BookIcon } from "@solar-icons/react/bold-duotone/book";
import { AltArrowDownIcon } from "@solar-icons/react/bold-duotone/alt-arrow-down";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { FileTextIcon } from "@solar-icons/react/bold-duotone/file-text";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { SettingsIcon } from "@solar-icons/react/bold-duotone/settings";
import { ChartIcon } from "@solar-icons/react/bold-duotone/chart";
import { ShieldCheckIcon } from "@solar-icons/react/bold-duotone/shield-check";
import { BellIcon } from "@solar-icons/react/bold-duotone/bell";
import { SpeakerIcon } from "@solar-icons/react/bold-duotone/speaker";
import { MedalStarCircleIcon } from "@solar-icons/react/bold-duotone/medal-star-circle";
import { ChatDotsIcon } from "@solar-icons/react/bold-duotone/chat-dots";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { WalletIcon } from "@solar-icons/react/bold-duotone/wallet";
import { FeedIcon } from "@solar-icons/react/bold-duotone/feed";
import { AddCircleIcon as PlusCircleIcon } from "@solar-icons/react/bold-duotone/add-circle";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { MagnifierIcon } from "@solar-icons/react/bold-duotone/magnifier";
import { LinkMinimalisticIcon } from "@solar-icons/react/bold-duotone/link-minimalistic";
import { CopyIcon } from "@solar-icons/react/bold-duotone/copy";
import { CheckReadIcon } from "@solar-icons/react/bold-duotone/check-read";
import { Grid3X3 } from "lucide-react";
import { BuildingsIcon } from "@solar-icons/react/bold-duotone/buildings";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  content: GuideItem[];
}

interface GuideItem {
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
}

const guideSections: GuideSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: ChartIcon,
    color: "text-violet-500",
    content: [
      {
        title: "Umumiy ko'rinish",
        description: "Dashboard bosh sahifasi platformaning umumiy holatini ko'rsatadi.",
        steps: [
          "Foydalanuvchilar soni va faolligi",
          "Test ishlash statistikasi",
          "Oxirgi faoliyat haqida ma'lumot",
          "Tezda kirish havolalari"
        ]
      }
    ]
  },
  {
    id: "tests",
    title: "Testlar boshqaruvi",
    icon: FileTextIcon,
    color: "text-blue-500",
    content: [
      {
        title: "Testlar ro'yxati",
        description: "Barcha testlarni ko'rish, tahrirlash va boshqarish.",
        steps: [
          "Test nomini kiriting",
          "Fanni tanlang (Matematika, Fizika va boshqalar)",
          "Savollar sonini belgilang",
          "Davomiylikni (daqiqa) kiriting",
          "Narxni belgilang (0 = bepul)",
          "Faol/NoFaol holatini o'zgartiring"
        ],
        tips: [
          "Har bir test uchun kamida 5 ta savol qo'shing",
          "Test nomini aniq va tushunarli yozing",
          "Narxni bozorga mos belgilang"
        ]
      },
      {
        title: "Test yaratish (Builder)",
        description: "Yangi test yaratish uchun builder dan foydalaning.",
        steps: [
          "/admin/tests/builder ga o'ting",
          "Test nomini va fanini kiriting",
          "Savollarni bitta-bitta qo'shing",
          "Har bir javob variantini kiriting",
          "To'g'ri javobni belgilang",
          "Saqlang va sinovdan o'tkazing"
        ]
      }
    ]
  },
  {
    id: "mock_tests",
    title: "Mock testlar",
    icon: MedalStarCircleIcon,
    color: "text-indigo-500",
    content: [
      {
        title: "Mock test yaratish",
        description: "Sinov testlarini yaratish va boshqarish.",
        steps: [
          "Mock test nomini kiriting",
          "Savollar tanlang (test bankidan)",
          "Davomiylik belgilang",
          "Narxni kiriting",
          "Natijalarni ko'ring"
        ]
      }
    ]
  },
  {
    id: "moderation",
    title: "Moderatsiya",
    icon: CheckCircleIcon,
    color: "text-amber-500",
    content: [
      {
        title: "Kontentni tekshirish",
        description: "Foydalanuvchilar tomonidan yuborilgan kontentni tasdiqlash yoki rad etish.",
        steps: [
          "Tekshirilishi kerak bo'lgan kontentlar ro'yxati",
          "Kontentni ko'rib chiqing",
          "Tasdiqlang yoki rad eting",
          "Foydalanuvchiga xabar yuboring"
        ]
      }
    ]
  },
  {
    id: "blog",
    title: "Blog boshqaruvi",
    icon: FeedIcon,
    color: "text-cyan-500",
    content: [
      {
        title: "Maqolalar yaratish",
        description: "Blog uchun yangi maqolalar yaratish va tahrirlash.",
        steps: [
          "Sarlavha kiriting",
          " kontentni yozing (rich text editor)",
          "Rasm qo'shing",
          "Kategoriyani tanlang",
          "SEO sozlamalarini kiriting",
          "Chiqarish yoki qoralama saqlang"
        ],
        tips: [
          "Sarlavha 60 ta belgidan oshmasin",
          "Asosiy rasm 1200x630 px bo'lsin",
          "Kalit so'zlarni kiriting"
        ]
      }
    ]
  },
  {
    id: "catalog",
    title: "Katalog",
    icon: Grid3X3,
    color: "text-teal-500",
    content: [
      {
        title: "Fanlar boshqaruvi",
        description: "Platformadagi fanlarni boshqarish.",
        steps: [
          "Yangi fan qo'shing",
          "Rang tanlang (gradient)",
          "Ikonka belgilang",
          "Tartib raqamini kiriting",
          "Faol/NoFaol holatini o'zgartiring"
        ]
      },
      {
        title: "Test papkalar",
        description: "Test papkalarini tashkil etish va boshqarish.",
        steps: [
          "Papka nomini kiriting",
          "Fanni tanlang",
          "Kategoriyani belgilang",
          "Narxni kiriting",
          "Savollar sonini kiriting"
        ]
      }
    ]
  },
  {
    id: "universities",
    title: "Universitetlar",
    icon: BuildingsIcon,
    color: "text-orange-500",
    content: [
      {
        title: "Universitet ma'lumotlari",
        description: "Universitetlar ro'yxatini boshqarish.",
        steps: [
          "Universitet nomini kiriting",
          "Manzilni kiriting",
          "Yo'nalishlarni qo'shing",
          "Kirish ballarini belgilang",
          "Rasm/qo'shimcha ma'lumot qo'shing"
        ]
      }
    ]
  },
  {
    id: "users",
    title: "Foydalanuvchilar",
    icon: UsersGroupTwoRoundedIcon,
    color: "text-emerald-500",
    content: [
      {
        title: "Foydalanuvchilar ro'yxati",
        description: "Barcha foydalanuvchilarni ko'rish va boshqarish.",
        steps: [
          "Foydalanuvchi qidirish",
          "Profilni ko'rish",
          "Obuna holatini o'zgartirish",
          "Bloklash/Ochish",
          "Rolni o'zgartirish (admin, sub-admin)"
        ],
        tips: [
          "Foydalanuvchini bloklashdan oldin ogohlantiring",
          "Sub-admin huquqlarini diqqat bilan bering"
        ]
      }
    ]
  },
  {
    id: "complaints",
    title: "Shikoyatlar",
    icon: DangerTriangleIcon,
    color: "text-amber-500",
    content: [
      {
        title: "Shikoyatlarni ko'rib chiqish",
        description: "Foydalanuvchilarning shikoyatlarini hal qilish.",
        steps: [
          "Shikoyatlar ro'yxatini ko'ring",
          "Shikoyat tafsilotlarini o'qing",
          "Javob yozing",
          "Holatini o'zgartiring (ochiq/yopiq)"
        ]
      }
    ]
  },
  {
    id: "feedback",
    title: "Fikr-mulohaza",
    icon: ChatDotsIcon,
    color: "text-blue-500",
    content: [
      {
        title: "Foydalanuvchi fikrlari",
        description: "Foydalanuvchilarning fikr-mulohazalarini ko'rish.",
        steps: [
          "Fikrlar ro'yxatini ko'ring",
          "Bahoni belgilang",
          "Javob yozing",
          "Umumiy trendlarni tahlil qiling"
        ]
      }
    ]
  },
  {
    id: "finance",
    title: "Moliya",
    icon: WalletIcon,
    color: "text-amber-500",
    content: [
      {
        title: "Moliyaviy hisobotlar",
        description: "Platformaning moliyaviy holatini kuzatish.",
        steps: [
          "Umumiy daromad",
          "Obuna daromadlari",
          "EduCoin operatsiyalari",
          "To'lov tizimlari holati"
        ]
      }
    ]
  },
  {
    id: "announcements",
    title: "E'lonlar",
    icon: SpeakerIcon,
    color: "text-pink-500",
    content: [
      {
        title: "E'lon yaratish",
        description: "Foydalanuvchilarga e'lonlar yuborish.",
        steps: [
          "E'lon sarlavhasini kiriting",
          "Matnni yozing",
          "Maqsadli auditoriyani tanlang",
          "Chiqarish sanasini belgilang",
          "Bildirishnoma sifatida yuboring"
        ]
      }
    ]
  },
  {
    id: "analytics",
    title: "Analitika",
    icon: ChartIcon,
    color: "text-rose-500",
    content: [
      {
        title: "Statistika ko'rinishi",
        description: "Platforma faoliyatini tahlil qilish.",
        steps: [
          "Foydalanuvchilar soni (kunlik/haftalik/oylik)",
          "Test ishlash statistikasi",
          "Eng mashhur fanlar",
          "Obuna statistikasi",
          "Sahifalar ko'rish soni"
        ]
      }
    ]
  },
  {
    id: "settings",
    title: "Sozlamalar",
    icon: SettingsIcon,
    color: "text-slate-500",
    content: [
      {
        title: "Platforma sozlamalari",
        description: "Umumiy platforma sozlamalarini boshqarish.",
        steps: [
          "Obuna narxlarini o'zgartirish",
          "EduCoin narxlarini sozlash",
          "To'lov tizimlarini boshqarish",
          "Bildirishnoma sozlamalari",
          "Til sozlamalari"
        ]
      }
    ]
  }
];

export default function AdminGuide() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSections = guideSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.some(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full min-h-screen pb-20">
      <AdminPageHeader
        icon={BookIcon}
        label="Qo'llanma"
        title="Admin Panel Qo'llanmasi"
        description="Platformani boshqarish bo'yicha to'liq qo'llanma"
      />

      <div className="space-y-5">
        {/* Search */}
        <div className="relative">
          <MagnifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Qidirish... (masalan: testlar, foydalanuvchilar, blog)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl text-[13px] text-slate-900 dark:text-white focus:border-[#E8192C] focus:outline-none transition-colors placeholder:text-slate-400"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Bo'limlar", value: guideSections.length, color: "bg-violet-50 text-violet-600" },
            { label: "Savollar", value: guideSections.reduce((acc, s) => acc + s.content.length, 0), color: "bg-blue-50 text-blue-600" },
            { label: "Qo'llanmalar", value: guideSections.reduce((acc, s) => acc + s.content.reduce((a, c) => a + (c.steps?.length || 0), 0), 0), color: "bg-emerald-50 text-emerald-600" },
            { label: "Maslahatlar", value: guideSections.reduce((acc, s) => acc + s.content.reduce((a, c) => a + (c.tips?.length || 0), 0), 0), color: "bg-amber-50 text-amber-600" },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
              <p className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.value}</p>
              <p className="text-[11px] text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Guide Sections */}
        <div className="space-y-3">
          {filteredSections.map((section) => (
            <div
              key={section.id}
              className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-white/[0.04]`}>
                  <section.icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
                    {section.title}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {section.content.length} ta bo'lim
                  </p>
                </div>
                {expandedSection === section.id ? (
                  <AltArrowDownIcon className="w-5 h-5 text-slate-400" />
                ) : (
                  <AltArrowRightIcon className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {/* Section Content */}
              {expandedSection === section.id && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-white/[0.04]">
                  {section.content.map((item, idx) => (
                    <div key={idx} className="pt-4">
                      <h4 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-2">
                        {item.title}
                      </h4>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-3">
                        {item.description}
                      </p>

                      {/* Steps */}
                      {item.steps && item.steps.length > 0 && (
                        <div className="bg-slate-50 dark:bg-white/[0.02] rounded-lg p-4 space-y-2">
                          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                            Qadamlar
                          </p>
                          {item.steps.map((step, stepIdx) => (
                            <div key={stepIdx} className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-[#E8192C] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {stepIdx + 1}
                              </span>
                              <span className="text-[12px] text-slate-600 dark:text-slate-400">
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tips */}
                      {item.tips && item.tips.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4 space-y-2 mt-3">
                          <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wider mb-2">
                            Maslahatlar
                          </p>
                          {item.tips.map((tip, tipIdx) => (
                            <div key={tipIdx} className="flex items-start gap-2.5">
                              <span className="text-amber-500 mt-0.5">💡</span>
                              <span className="text-[12px] text-amber-700 dark:text-amber-400">
                                {tip}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSections.length === 0 && (
          <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl py-16 text-center">
            <BookIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-[14px] font-medium text-slate-500">Hech narsa topilmadi</p>
            <p className="text-[12px] text-slate-400 mt-1">Boshqa kalit so'z bilan qidirib ko'ring</p>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
          <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-slate-500" />
            Tez-tez beriladigan savollar
          </h3>
          <div className="space-y-3">
            {[
              {
                q: "Test qanday qilib yaratiladi?",
                a: "Admin panel > Testlar > Builder bo'limiga o'ting. Yangi test yaratish uchun 'Qo'shish' tugmasini bosing."
              },
              {
                q: "Foydalanuvchini qanday bloklash mumkin?",
                a: "Admin panel > Foydalanuvchilar bo'limidan foydalanuvchini topib, uning yonidagi 'Bloklash' tugmasini bosing."
              },
              {
                q: "Obuna narxlarini qanday o'zgartirish mumkin?",
                a: "Admin panel > Sozlamalar > Obuna bo'limidan narxlarni tahrirlash mumkin."
              },
              {
                q: "Blog maqolasini qanday chiqarish mumkin?",
                a: "Admin panel > Blog bo'limidan maqola yarating va 'Chiqarish' tugmasini bosing."
              }
            ].map((faq, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-lg">
                <p className="text-[12px] font-semibold text-slate-900 dark:text-white mb-1">
                  {faq.q}
                </p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
