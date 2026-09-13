import { useNavigate } from "react-router-dom";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { ShieldCheckIcon } from "@solar-icons/react/bold-duotone/shield-check";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { CardIcon } from "@solar-icons/react/bold-duotone/card";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { ChatDotsIcon } from "@solar-icons/react/bold-duotone/chat-dots";
import { LetterIcon } from "@solar-icons/react/bold-duotone/letter";
import { ScaleIcon } from "@solar-icons/react/bold-duotone/scale";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import SEO from "@/components/SEO";

interface OffertaSection {
  icon: any;
  title: string;
  content?: string[];
  bullets?: string[];
  extra?: string;
  subsections?: {
    subtitle?: string;
    text?: string;
    bullets?: string[];
    extra?: string;
  }[];
}

const sections: OffertaSection[] = [
  {
    icon: ScaleIcon,
    title: "1. Umumiy Qoidalar va Atamalar",
    content: [
      "Ushbu hujjat O'zbekiston Respublikasi Fuqarolik Kodeksining 367, 369 va 370-moddalariga muvofiq, EduContest elektron ta'lim platformasining (educontest.uz, api.educontest.uz) elektron ta'limiy xizmatlarni ko'rsatish bo'yicha rasmiy Ommaviy Ofertasi (shartnomasi) hisoblanadi.",
      "Ushbu Ofertada qo'llaniladigan asosiy atamalar quyidagi ma'nolarni anglatadi:"
    ],
    bullets: [
      "Ijrochi — EduContest platformasi ma'muriyati (educontest.uz), platforma infratuzilmasi va xizmatlari egasi;",
      "Buyurtmachi (Foydalanuvchi) — Platformadan ro'yxatdan o'tgan, o'quv xizmatlaridan foydalanayotgan va/yoki to'lovni amalga oshirgan jismoniy yoki yuridik shaxs;",
      "Ommaviy Oferta — Mazkur hujjatdagi barcha shartlar bo'yicha shartnoma tuzish haqidagi ommaga yo'naltirilgan rasmiy taklif;",
      "Aksept — Foydalanuvchi tomonidan ushbu Oferta shartlarini to'liq va so'zsiz qabul qilish. Ro'yxatdan o'tish, Telegram bot orqali autentifikatsiyadan o'tish, Hamyonni to'ldirish yoki xizmatlardan foydalanish Aksept hisoblanadi;",
      "Hamyon (Wallet) — Foydalanuvchining shaxsiy kabinetida aks etadigan, platforma ichidagi pullik xizmatlarni xarid qilish uchun mo'ljallangan ichki hisob balansi;",
      "EduCoin — O'quv faolligini rag'batlantirish uchun beriladigan ichki virtual o'quv balli (haqiqiy pul yoki valyuta hisoblanmaydi)."
    ]
  },
  {
    icon: DocumentTextIcon,
    title: "2. Shartnoma Predmeti",
    content: [
      "Ijrochi Buyurtmachiga EduContest platformasi orqali masofaviy elektron ta'lim xizmatlarini ko'rsatish va platforma funksiyalaridan foydalanish imkoniyatini taqdim etadi, Buyurtmachi esa tanlangan xizmatlar uchun to'lovni amalga oshirish va platforma qoidalariga qat'iy rioya qilish majburiyatini oladi.",
      "Platforma doirasida taqdim etiladigan ta'limiy xizmatlar turlari:"
    ],
    bullets: [
      "Fanlar bo'yicha testlar bazasidan foydalanish (Matematika, Fizika, Ona tili, Biologiya, Kimyo, Tarix, Ingliz tili va boshqalar);",
      "Milliy sertifikat va DTM imtihonlari simulyatori (Mock testlar, Rasch psixometrik modeli bo'yicha tahlil, A va B qism savollari, vaqt nazorati);",
      "Onlayn olimpiadalar va tanlovlarda ishtirok etish, elektron sertifikatlar olish;",
      "Sun'iy intellekt (AI) vositalaridan foydalanish: EduAI Chat, AI Mentor, Math Solver (matematik masalalarni yechish), Essay Checker (insholarni baholash) va AI Savol Generatori;",
      "Shaxsiy o'quv rejasi (Planner), o'quv taymeri (Forest Timer 3D) va xatolar ustida ishlash (MyErrors) tizimi."
    ]
  },
  {
    icon: UsersGroupTwoRoundedIcon,
    title: "3. Xizmatlardan Foydalanish va Aksept Tartibi",
    content: [
      "Buyurtmachi platformadan ro'yxatdan o'tgan yoki xizmatga to'lov qilgan lahzadan boshlab ushbu shartnoma yuridik kuchga kiradi va yozma shartnoma tuzilgan deb hisoblanadi."
    ],
    bullets: [
      "Autentifikatsiya: Buyurtmachi ro'yxatdan o'tishda faqat o'ziga tegishli telefon raqami, Telegram boti (@educontesttbot) kodi yoki Google akkauntidan foydalanishi lozim;",
      "Shaxsiy kabinet xavfsizligi: Buyurtmachi o'z login ma'lumotlari va akkaunt xavfsizligi uchun to'liq javobgardir. Akkauntni uchinchi shaxslarga foydalanish uchun berish taqiqlanadi;",
      "Qurilma nazorati: Platformada akkauntlarni bir nechta shaxslar o'rtasida noqonuniy ulashishni oldini olish maqsadida qurilma barmoq izi (fingerprint) va IP tekshiruv tizimi faoliyat yuritadi."
    ]
  },
  {
    icon: CardIcon,
    title: "4. Narxlar, To'lov Tizimlari va Hamyon Balansi",
    subsections: [
      {
        subtitle: "4.1. Narxlar va hisob-kitoblar",
        bullets: [
          "Barcha xizmatlar, pullik testlar va tariflar narxlari O'zbekiston so'mida (UZS) ko'rsatiladi va qo'shilgan qiymat solig'isiz (agar amaldagi qonunchilikda boshqacha nazarda tutilmagan bo'lsa) hisoblanadi;",
          "Ijrochi xizmatlar narxlarini istalgan vaqtda bir tomonlama o'zgartirish huquqiga ega. Xarid qilingan xizmatlar yoki avval to'ldirilgan balans uchun narxlar o'zgarmaydi."
        ]
      },
      {
        subtitle: "4.2. To'lov usullari",
        bullets: [
          "Avtomatik onlayn to'lov: Rasmiy InPay to'lov shlyuzi orqali milliy bank kartalari (Uzcard, Humo) hamda xalqaro kartalar (Visa, Mastercard) yordamida;",
          "P2P karta o'tkazmasi: Karta rekvizitlariga mablag' o'tkazib, to'lov cheki fotosuratini platformaga yuklash orqali (ma'murlar tekshiruvidan so'ng balansga kiritiladi);",
          "Hamyon balansi: Foydalanuvchi hamyonini oldindan to'ldirib, istalgan pullik test yoki kursni qoldiq mablag'dan lahzalik sotib olishi mumkin."
        ]
      },
      {
        subtitle: "4.3. Xavfsizlik kafolati",
        text: "Ijrochi foydalanuvchining to'lov kartasi maxfiy ma'lumotlarini (PIN-kod, CVV/CVC, amal qilish muddati) o'z serverida saqlamaydi. Barcha to'lovlar xalqaro PCI DSS xavfsizlik sertifikatlariga ega InPay to'lov tizimi orqali himoyalangan kanallarda amalga oshiriladi."
      }
    ]
  },
  {
    icon: DangerTriangleIcon,
    title: "5. Raqamli Xizmatlar Yetkazib Berilishi va Qaytarish Siyosati (Refund Policy)",
    content: [
      "O'zbekiston Respublikasining \"Elektron tijorat to'g'risida\"gi hamda \"Iste'molchilar huquqlarini himoya qilish to'g'risida\"gi qonunlariga muvofiq, raqamli elektron xizmatlarning o'ziga xos xususiyatlari belgilanadi:"
    ],
    bullets: [
      "Xizmatning ko'rsatilganligi: Raqamli xizmat (pullik test sessiyasini boshlash, savollar bazasini ochish, kurs darsiga kirish, EduCoin orqali funksiyani faollashtirish) Buyurtmachi tizimda 'Boshlash' yoki 'Xarid qilish' tugmasini bosgan paytdan e'tiboran to'liq hajmda yetkazib berilgan hisoblanadi;",
      "Qaytarib bermaslik sharti (No-Refund): Boshlangan yoki yakunlangan testlar, ochilgan kurslar, shuningdek hisobga tushgan va sarflangan mablag'lar qaytarib berilmaydi;",
      "Istisno holatlar: Agar to'lov tizimi orqali pul yechilgan bo'lsa-yu, biroq tizimdagi texnik nuqson sababli balansga tushmagan bo'lsa yoki platformaning to'liq ishlamay qolganligi Ijrochi tomonidan rasman tasdiqlansa, to'langan mablag' Buyurtmachining yozma arizasi (support@educontest.uz) asosida 14 ish kuni ichida ko'rib chiqiladi va hisob balansiga qaytariladi."
    ]
  },
  {
    icon: ShieldCheckIcon,
    title: "6. Tomonlarning Huquq va Majburiyatlari",
    subsections: [
      {
        subtitle: "6.1. Ijrochining majburiyatlari va huquqlari:",
        bullets: [
          "Platformaning uzluksiz va sifatli ishlashini ta'minlash choralarini ko'rish;",
          "Buyurtmachining shaxsga doir ma'lumotlari maxfiyligini Maxfiylik Siyosatiga muvofiq saqlash;",
          "Qoidalarni buzgan, kiberhujum uyushtirgan, test savollarini o'g'irlagan yoki firibgarlik qilgan foydalanuvchilarning akkauntlarini ogohlantirishsiz bloklash;",
          "Platformada profilaktika va texnik yangilash ishlarini olib borish (bu haqda oldindan xabardor qilish)."
        ]
      },
      {
        subtitle: "6.2. Buyurtmachining majburiyatlari va huquqlari:",
        bullets: [
          "Platforma qoidalariga, ushbu Ofertaga va akademik halollik talablariga qat'iy rioya qilish;",
          "Platformadagi test savollari, yechimlar va o'quv materiallarini ruxsatsiz ko'chirmaslik, Telegram/ijtimoiy tarmoqlarda tarqatmaslik va sotmaslik;",
          "Xizmatlardan faqat shaxsiy, qonuniy va ta'limiy maqsadlarda foydalanish;",
          "Xizmatlar yuzasidan savol va texnik nosozliklar vujudga kelganda qo'llab-quvvatlash xizmatiga murojaat qilish."
        ]
      }
    ]
  },
  {
    icon: DocumentTextIcon,
    title: "7. Intellektual Mulk Huquqlari",
    content: [
      "EduContest platformasidagi barcha dasturiy kodlar, test savollari, tushuntirishlar, interfeys dizayni, Rasch modeli algoritmlari va audiovizual kontent Ijrochining mutlaq intellektual mulki hisoblanadi.",
      "Ushbu materiallarni ruxsatsiz tijoriy ko'paytirish, skanerlash, scraping vositalari yordamida o'g'irlash yoki tarqatish O'zbekiston Respublikasining \"Mualliflik huquqi va turdosh huquqlar to'g'risida\"gi Qonunini qo'pol ravishda buzish hisoblanadi va fuqarolik, ma'muriy hamda jinoiy javobgarlikka sabab bo'ladi."
    ]
  },
  {
    icon: DangerTriangleIcon,
    title: "8. Javobgarlikning Cheklanishi va Fors-Major",
    content: [
      "Tomonlar ushbu shartnoma bo'yicha o'z majburiyatlarini bajarmaganlik yoki lozim darajada bajarmaganlik uchun qonunchilikka muvofiq javobgar bo'ladilar:",
      "Ijrochi Buyurtmachining davlat imtihonlarida (OTMga kirish, attestatsiya, sertifikat) muayyan natijaga erishishiga kafolat bermaydi. Sinov natijalari Buyurtmachining shaxsiy iqtidori va tayyorgarlik darajasiga bog'liq;",
      "Tomonlar o'z majburiyatlarini fors-major holatlari (tabiiy ofatlar, urush harakatlari, davlat organlarining cheklovchi normativ hujjatlari, respublika miqyosidagi internet yoki elektr energiyasi uzilishlari) davrida bajara olmaganliklari uchun javobgarlikdan ozod etiladilar."
    ]
  },
  {
    icon: ChatDotsIcon,
    title: "9. Nizolarni Hal Qilish Tartibi",
    content: [
      "Ushbu Oferta yuzasidan kelib chiqadigan barcha nizolar dastlab muzokaralar va o'zaro tushunish yo'li bilan hal etiladi.",
      "Buyurtmachi o'z e'tirozlarini support@educontest.uz manziliga yozma ravishda yo'llaydi. Ijrochi murojaatni 5 ish kuni ichida ko'rib chiqadi.",
      "Muzokaralar natija bermagan taqdirda, nizo O'zbekiston Respublikasining amaldagi qonunchiligiga muvofiq Ijrochi joylashgan hududdagi (Toshkent shahri) vakolatli sudda ko'rib chiqiladi."
    ]
  },
  {
    icon: LetterIcon,
    title: "10. Ofertaning Amal Qilish Muddati va Rekvizitlar",
    content: [
      "Ushbu Oferta educontest.uz/offerta sahifasida e'lon qilingan paytdan boshlab doimiy amal qiladi va yangi tahriri qabul qilingunga qadar o'z kuchini saqlab qoladi.",
      "Ijrochining rasmiy aloqa rekvizitlari:"
    ],
    bullets: [
      "Platforma: EduContest elektron ta'lim platformasi (educontest.uz)",
      "BFF / API server: api.educontest.uz",
      "Elektron pochta: support@educontest.uz",
      "Moliyaviy va huquqiy masalalar: legal@educontest.uz",
      "Rasmiy aloqa bo'limi: educontest.uz/contact",
      "Manzil: Toshkent shahri, O'zbekiston Respublikasi"
    ]
  }
];

const Offerta = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Ommaviy Oferta — EduContest"
        description="EduContest platformasining rasmiy ommaviy ofertasi — masofaviy ta'lim xizmatlari ko'rsatish shartnomasi, to'lovlar, hamyon va qaytarish qoidalari."
        canonical={`${window.location.origin}/offerta`}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          {/* Yuqori sarlavha */}
          <div className="flex flex-col items-center text-center space-y-4">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
            >
              <AltArrowLeftIcon className="w-3.5 h-3.5" /> Bosh sahifaga qaytish
            </button>
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs">
              <ScaleIcon className="w-8 h-8 text-[#E8192C]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Ommaviy Oferta
              </h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                educontest.uz — Elektron ta'lim xizmatlari ko'rsatish shartnomasi | Oxirgi tahrir: 6-sentabr, 2026-yil
              </p>
            </div>
          </div>

          {/* Asosiy hujjat konteyneri */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 space-y-10 shadow-xs">
            {sections.map((section, si) => (
              <section key={si} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/30 flex items-center justify-center shrink-0">
                    <section.icon className="w-5 h-5 text-[#E8192C]" />
                  </div>
                  <h2 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    {section.title}
                  </h2>
                </div>

                <div className="text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 sm:ml-12">
                  {section.content?.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}

                  {section.bullets && (
                    <ul className="space-y-2 pt-1">
                      {section.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircleIcon className="w-4 h-4 text-[#E8192C] mt-1 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.extra && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[13px] text-slate-600 dark:text-slate-400 font-medium">
                      {section.extra}
                    </div>
                  )}

                  {section.subsections?.map((sub, i) => (
                    <div key={i} className="space-y-2.5 pt-3">
                      {sub.subtitle && (
                        <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          {sub.subtitle}
                        </h3>
                      )}
                      {sub.text && <p>{sub.text}</p>}
                      {sub.bullets && (
                        <ul className="space-y-2">
                          {sub.bullets.map((b, j) => (
                            <li key={j} className="flex items-start gap-2.5">
                              <CheckCircleIcon className="w-4 h-4 text-[#E8192C] mt-1 shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {sub.extra && (
                        <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100/50 dark:border-red-900/30 text-[12.5px] text-red-900 dark:text-red-300">
                          {sub.extra}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Quyi qism */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[12px] font-medium text-slate-400">
                Kuchga kirish sanasi: 6-sentabr, 2026-yil
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full sm:w-auto bg-[#E8192C] text-white px-8 py-3 rounded-xl font-medium text-[13px] hover:bg-[#D41524] active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                Ofertani Qabul qilaman
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Offerta;
