import { useNavigate } from "react-router-dom";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { ShieldCheckIcon } from "@solar-icons/react/bold-duotone/shield-check";
import { LockIcon } from "@solar-icons/react/bold-duotone/lock";
import { EyeIcon } from "@solar-icons/react/bold-duotone/eye";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { DatabaseIcon } from "@solar-icons/react/bold-duotone/database";
import { GlobalIcon } from "@solar-icons/react/bold-duotone/global";
import { LetterIcon } from "@solar-icons/react/bold-duotone/letter";
import SEO from "@/components/SEO";

const sections = [
  {
    icon: LockIcon,
    title: "1. Kirish",
    content: [
      "EduContest platformasi (bundan keyin \"Platforma\" deb ataladi) foydalanuvchilarining shaxsiy ma'lumotlarini himoya qilishni o'z zimmasiga oladi. Ushbu Maxfiylik Siyosati educontest.uz veb-sayti va uning barcha xizmatlaridan foydalanganda shaxsiy ma'lumotlaringiz qanday to'planishi, ishlatilishi va himoya qilinishi haqida to'liq ma'lumot beradi.",
      "Platforma xizmatlaridan foydalanish orqali siz ushbu siyosat shartlariga rozilik bildirasiz."
    ]
  },
  {
    icon: EyeIcon,
    title: "2. To'planadigan Ma'lumotlar",
    subsections: [
      {
        subtitle: "2.1. Ro'yxatdan o'tishda beriladigan ma'lumotlar",
        text: "Platformaga ro'yxatdan o'tayotganda quyidagi ma'lumotlar to'planadi:",
        bullets: [
          "To'liq ism va familiya",
          "Elektron pochta manzili",
          "Telefon raqami",
          "Tug'ilgan sana",
          "O'qish sinfi yoki kursi (IX, X, XI va boshqalar)",
          "Maktab yoki o'quv muassasasi nomi",
          "Viloyat va shahar"
        ]
      },
      {
        subtitle: "2.2. Foydalanish jarayonida avtomatik to'planadigan ma'lumotlar",
        text: "Platformadan foydalanishingiz davomida quyidagi texnik ma'lumotlar avtomatik tarzda qayd etiladi:",
        bullets: [
          "IP-manzil va qurilma turi",
          "Brauzer nomi va versiyasi",
          "Sahifalarni ko'rish tarixi va vaqt belgilari",
          "Test natijalari va javob vaqtlari",
          "Platforma ichidagi harakatlar (bosgan tugmalar, o'tgan sahifalar)",
          "Cookie fayllar va shunga o'xshash texnologiyalar orqali to'plangan ma'lumotlar"
        ]
      },
      {
        subtitle: "2.3. To'lov ma'lumotlari",
        text: "Premium obuna xarid qilganingizda to'lov tizimi (Payme, Click, Uzum Bank yoki boshqa ruxsat etilgan to'lov tizimlari) orqali to'lov amalga oshiriladi. EduContest to'lov karta ma'lumotlarini (karta raqami, CVV) to'g'ridan-to'g'ri saqlamaydi — bu ma'lumotlar faqat sertifikatlangan to'lov provayderlarida saqlanadi."
      }
    ]
  },
  {
    icon: DocumentTextIcon,
    title: "3. Ma'lumotlardan Foydalanish Maqsadlari",
    content: ["To'plangan ma'lumotlar quyidagi maqsadlarda ishlatiladi:"],
    bullets: [
      "Foydalanuvchi hisobini yaratish va boshqarish",
      "Test va mashqlar natijalarini hisoblash va saqlash",
      "Foydalanuvchiga shaxsiylashtirilgan o'quv tavsiyalari berish",
      "Reyting va statistika tizimlarini yuritish",
      "Seriya (streak) va gamifikatsiya elementlarini ishlash",
      "Texnik yordam va murojaat bo'yicha xizmat ko'rsatish",
      "Platforma xizmatlari haqida bildirishnomalar yuborish (faqat ruxsat bergan holda)",
      "Xizmat sifatini yaxshilash va tahlil qilish",
      "Qonuniy majburiyatlarni bajarish"
    ]
  },
  {
    icon: GlobalIcon,
    title: "4. Ma'lumotlarni Uchinchi Taraflarga Berish",
    subsections: [
      {
        subtitle: "4.1. Biz ma'lumotlaringizni quyidagi hollarda uchinchi taraflarga berishimiz mumkin:",
        bullets: [
          "Qonun hujjatlari talabiga binoan (sud qarorlari, hukumat so'rovlari)",
          "Platforma texnik xizmatlarini ta'minlovchi sherik kompaniyalarga (faqat zarur hajmda)",
          "To'lov xizmatlarini amalga oshiruvchi sertifikatlangan provayderlariga",
          "Platformani boshqa kompaniyaga sotish yoki birlashtirish jarayonida"
        ]
      },
      {
        subtitle: "4.2. Biz HECH QACHON quyidagilarni amalga oshirmaymiz:",
        bullets: [
          "Shaxsiy ma'lumotlaringizni reklama maqsadida sotish",
          "Ruxsatsiz uchinchi taraflarga ma'lumot uzatish",
          "Bolalar (14 yoshdan kichik) ma'lumotlarini qonunga zid ravishda to'plash"
        ]
      }
    ]
  },
  {
    icon: DatabaseIcon,
    title: "5. Cookie Fayllar",
    content: [
      "EduContest quyidagi cookie fayllardan foydalanadi:",
    ],
    bullets: [
      "Zaruriy cookie'lar — platformaning to'g'ri ishlashi uchun",
      "Funksional cookie'lar — foydalanuvchi sozlamalarini eslab qolish uchun",
      "Tahlil cookie'lari — platforma foydalanishini tushunish va yaxshilash uchun"
    ],
    extra: "Brauzer sozlamalaringizdan cookie fayllarni o'chirib qo'yishingiz mumkin, ammo bu platformaning ba'zi funksiyalarini cheklashi mumkin."
  },
  {
    icon: DocumentTextIcon,
    title: "6. Ma'lumotlarni Saqlash Muddati",
    content: ["Shaxsiy ma'lumotlaringiz quyidagi muddatlarda saqlanadi:"],
    bullets: [
      "Faol hisob — hisobingiz mavjud bo'lgan barcha davr",
      "Hisobni o'chirgandan keyin — 30 kun ichida ma'lumotlar arxivlanadi, 12 oy ichida to'liq o'chiriladi",
      "Test natijalari va o'quv tarixi — 5 yil",
      "Moliyaviy operatsiyalar tarixi — 7 yil (qonuniy talab)"
    ]
  },
  {
    icon: UsersGroupTwoRoundedIcon,
    title: "7. Foydalanuvchi Huquqlari",
    content: ["O'zbekiston Respublikasi qonunlari va xalqaro standartlar asosida sizda quyidagi huquqlar mavjud:"],
    bullets: [
      "Ma'lumotlaringizga kirish huquqi — saqlanayotgan ma'lumotlaringizni ko'rish",
      "To'g'rilash huquqi — noto'g'ri ma'lumotlarni o'zgartirish",
      "O'chirish huquqi — ma'lumotlaringizni o'chirishni so'rash",
      "Cheklash huquqi — ma'lumotlaringizni qayta ishlashni to'xtatish",
      "Ko'chirish huquqi — ma'lumotlaringizni boshqa xizmatga o'tkazish",
      "E'tiroz bildirish huquqi — marketing aloqalarini bekor qilish"
    ],
    extra: "Ushbu huquqlardan foydalanish uchun privacy@educontest.uz manziliga murojaat qiling."
  },
  {
    icon: LockIcon,
    title: "8. Ma'lumotlar Xavfsizligi",
    content: ["Shaxsiy ma'lumotlaringizni himoya qilish uchun quyidagi choralar ko'rilgan:"],
    bullets: [
      "SSL/TLS shifrlash — barcha ma'lumotlar uzatishda",
      "AES-256 shifrlash — ma'lumotlar bazasida saqlashda",
      "Ikki faktorli autentifikatsiya (2FA) imkoniyati",
      "Muntazam xavfsizlik tekshiruvlari va penetratsion testlar",
      "Xodimlar uchun ma'lumot maxfiyligi bo'yicha trening",
      "Kirish huquqlarini minimal zarurat tamoyiliga asoslangan boshqarish"
    ]
  },
  {
    icon: ShieldCheckIcon,
    title: "9. Bolalar Maxfiyligi",
    content: [
      "EduContest 14 yoshdan kichik foydalanuvchilardan ota-ona yoki qonuniy vakilning roziligisiz ma'lumot to'plamaydi. Agar 14 yoshdan kichik farzandingiz platformadan foydalanayotganini bilsangiz, privacy@educontest.uz manziliga murojaat qiling."
    ]
  },
  {
    icon: DocumentTextIcon,
    title: "10. Siyosat O'zgarishlari",
    content: [
      "EduContest ushbu Maxfiylik Siyosatini vaqti-vaqti bilan yangilashi mumkin. Muhim o'zgarishlar haqida foydalanuvchilar email orqali xabardor qilinadi. Yangilangan siyosat e'lon qilinganidan 30 kun o'tgach kuchga kiradi."
    ]
  },
  {
    icon: LetterIcon,
    title: "11. Bog'lanish",
    content: ["Maxfiylik siyosatiga oid savollar yoki shikoyatlar uchun:"],
    bullets: [
      "Email: privacy@educontest.uz",
      "Veb-sayt: educontest.uz/contact",
      "Manzil: Toshkent shahar, O'zbekiston"
    ]
  },
];

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO title="Maxfiylik siyosati" description="EduContest maxfiylik siyosati — shaxsiy ma'lumotlarni qayta ishlash va himoya qilish qoidalari." canonical={`${window.location.origin}/privacy`} />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider cursor-pointer"
            >
              <AltArrowLeftIcon className="w-3.5 h-3.5" /> Bosh sahifaga qaytish
            </button>
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xs">
              <ShieldCheckIcon className="w-7 h-7 text-[#E8192C]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Maxfiylik Siyosati</h1>
              <p className="text-[13px] text-slate-500 font-medium mt-1">educontest.uz — Oxirgi yangilanish: 14 Iyun 2025</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-2xs">
            {sections.map((section, si) => (
              <section key={si} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <section.icon className="w-4 h-4 text-[#E8192C]" />
                  </div>
                  <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white uppercase tracking-wider">{section.title}</h2>
                </div>
                <div className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-3 ml-11">
                  {section.content?.map((p, i) => <p key={i}>{p}</p>)}
                  {section.bullets && (
                    <ul className="space-y-2">
                      {section.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-[#E8192C] mt-0.5 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.extra && <p>{section.extra}</p>}
                  {section.subsections?.map((sub, i) => (
                    <div key={i} className="space-y-2 pt-2">
                      {sub.subtitle && <h3 className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{sub.subtitle}</h3>}
                      {sub.text && <p>{sub.text}</p>}
                      {sub.bullets && (
                        <ul className="space-y-2">
                          {sub.bullets.map((b, j) => (
                            <li key={j} className="flex items-start gap-2">
                              <CheckCircleIcon className="w-4 h-4 text-[#E8192C] mt-0.5 shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {sub.extra && <p>{sub.extra}</p>}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center space-y-3 text-center">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Yangilangan: 14-iyun, 2025</p>
              <button
                onClick={() => navigate("/")}
                className="bg-[#E8192C] text-white px-8 py-2.5 rounded-xl font-medium text-[13px] hover:bg-[#D41524] transition-colors cursor-pointer"
              >
                Qabul qilaman
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
