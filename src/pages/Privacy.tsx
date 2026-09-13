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
import { ScaleIcon } from "@solar-icons/react/bold-duotone/scale";
import SEO from "@/components/SEO";

interface PrivacySection {
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

const sections: PrivacySection[] = [
  {
    icon: ScaleIcon,
    title: "1. Umumiy Qoidalar va Huquqiy Asos",
    content: [
      "EduContest elektron ta'lim platformasi (bundan buyon matnda \"Platforma\" yoki \"Biz\" deb yuritiladi, rasmiy veb-sayt: educontest.uz, api.educontest.uz) foydalanuvchilarining (o'quvchilar, abituriyentlar, pedagoglar va boshqa qatnashchilar) shaxsiy daxlsizligi hamda shaxsga doir ma'lumotlarini qat'iy himoya qilishni o'zining ustuvor vazifasi deb biladi.",
      "Ushbu Maxfiylik Siyosati (Privacy Policy) O'zbekiston Respublikasining 2019-yil 2-iyuldagi \"Shaxsga doir ma'lumotlar to'g'risida\"gi O'RQ-547-son Qonuni, \"Elektron tijorat to'g'risida\"gi Qonuni, shuningdek xalqaro axborot xavfsizligi va axborot maxfiyligi standartlari (jumladan, GDPR umumiy tamoyillari) talablariga muvofiq ishlab chiqilgan.",
      "Platformadan ro'yxatdan o'tish, Telegram Bot orqali tizimga kirish, testlar, mock imtihonlar, AI xizmatlari yoki pullik funksiyalardan foydalanish orqali siz ushbu Maxfiylik Siyosati shartlarini to'liq va so'zsiz qabul qilganingizni tasdiqlaysiz."
    ]
  },
  {
    icon: EyeIcon,
    title: "2. To'planadigan Shaxsga Doir Ma'lumotlar Toifalari",
    content: [
      "EduContest o'quv jarayonini sifatli tashkil qilish, test natijalarini hisoblash, hisoblarni himoyalash va qonuniy majburiyatlarni bajarish uchun quyidagi toifadagi ma'lumotlarni to'playdi va qayta ishlaydi:"
    ],
    subsections: [
      {
        subtitle: "2.1. Foydalanuvchi tomonidan taqdim etiladigan ma'lumotlar",
        bullets: [
          "Identifikatsiya ma'lumotlari: Ism, familiya va otasining ismi, foydalanuvchi taxallusi (username);",
          "Aloqa ma'lumotlari: Telefon raqami, rasmiy Telegram identifikatori (Telegram Chat ID, username), elektron pochta manzili;",
          "Profil va ta'limiy so'rovnoma ma'lumotlari: Tug'ilgan sana, yashash viloyati va tumani, o'qiyotgan yoki dars berayotgan ta'lim muassasasi (maktab, litsey, kollej, OTM), sinf yoki o'quv bosqichi, maqsad qilingan OTM va ta'lim yo'nalishi;",
          "Ijtimoiy autentifikatsiya ma'lumotlari: Google akkaunti orqali tizimga kirilganda Google tomonidan taqdim etilgan ochiq profil ma'lumotlari (ism, email, profil rasmi avatar URL)."
        ]
      },
      {
        subtitle: "2.2. O'quv, imtihon va test jarayonida to'planadigan ma'lumotlar",
        bullets: [
          "Test va Mock imtihon sessiyalari: Tanlangan fanlar, savollarga berilgan javob variantlari, har bir savolga sarflangan vaqt, to'g'ri va noto'g'ri javoblar ko'rsatkichi, umumiy ball, Rasch psixometrik tahlili parametrlari, testni boshlash va yakunlash vaqti;",
          "Olimpiada va tanlovlar: Ro'yxatdan o'tish, ishtirok etish vaqti, onlayn imtihon monitoringi qaydlari, egallangan o'rinlar va berilgan sertifikatlar rekvizitlari;",
          "Shaxsiy xatolar bazasi (MyErrors): Foydalanuvchi testlarda yo'l qo'ygan xatolari, qayta ishlash davriyligi va xatolar ustida ishlash darajasi;",
          "Gamifikatsiya va odatlar: Kunlik kirish seriyasi (Daily streak), to'plangan va sarflangan virtual tangalar (EduCoin), o'quv vaqti taymeri (Forest Timer 3D) sessiyalari davomiyligi, lug'at boyligi (Vocabulary) ko'rsatkichlari;",
          "Umumiy reyting (Leaderboard): Foydalanuvchining umumiy reytingdagi o'rni, to'plagan ballari va sovrinli nishonlari (platformaning boshqa foydalanuvchilariga ochiq ko'rinadigan qismi)."
        ]
      },
      {
        subtitle: "2.3. Sun'iy Intellekt (AI) xizmatlaridan foydalanish ma'lumotlari",
        bullets: [
          "EduAI Chat va AI Mentor bilan muloqot matnlari, o'quvchining savollari va olingan tushuntirishlar;",
          "Insholar tahlili (Essay Checker) uchun yuklangan insho va mustaqil yozma ishlar matni;",
          "Matematik yechgich (Math Solver) uchun kiritilgan formulalar yoki yuklangan/skanerlangan formula rasmlari;",
          "Savol generatori (AI Question Generator) uchun yuklangan PDF/Docx o'quv materiallari va kiritilgan mavzular."
        ],
        extra: "Eslatma: AI so'rovlari shaxsiy identifikatsiya ma'lumotlaridan ajratilgan holda, faqat o'quv ko'magini taqdim etish va model sifatini yaxshilash maqsadida qayta ishlanadi."
      },
      {
        subtitle: "2.4. Texnik, kiberxavfsizlik va qurilma ma'lumotlari (Avtomatik)",
        bullets: [
          "Tarmoq ma'lumotlari: Foydalanuvchining IP-manzili, mamlakati, kirish vaqtlari va so'rovlar chastotasi (DDoS himoyasi va shubhali urinishlarni aniqlash uchun);",
          "Qurilma barmoq izi (Browser Fingerprint): Brauzer nomi va versiyasi, operatsion tizim, ekran o'lchami, til sozlamalari, Canvas/WebGL identifikatorlari (bu ma'lumotlar imtihonlarda aldash (anti-cheat) va hisobni ko'p shaxslar o'rtasida noqonuniy tarqatishni oldini olish uchun xizmat qiladi);",
          "Xavfsizlik holati: Qurilmaning bloklangan qurilmalar bazasidagi (blocked_devices) holati, soxta akkaunt ochishga urinishlar soni;",
          "Sessiya fayllari: Xavfsiz HTTP-Only cookie ma'lumotlari."
        ]
      },
      {
        subtitle: "2.5. Moliyaviy va to'lov ma'lumotlari",
        bullets: [
          "Platformadagi tranzaksiyalar tarixi: Hamyon (Wallet) balansi, kiritilgan to'lovlar miqdori, sarflangan mablag'lar, sana va to'lov holati;",
          "InPay tizimi orqali to'lovlar: InPay order ID, tranzaksiya ID va to'lov maomi (status);",
          "Karta o'tkazmasi (P2P) kvitansiyalari: Foydalanuvchi tomonidan hisobni to'ldirish uchun yuklangan bank to'lov cheki fotosuratlari va izohlari."
        ],
        extra: "MUHIM XAVFSIZLIK KAFOLATI: EduContest foydalanuvchilarning bank kartalari to'liq raqamini, amal qilish muddatini yoki CVV/CVC maxfiy kodlarini o'z serverlarida SAQLAMAYDI va QAYTA ISHLAMAYDI. Barcha karta orqali to'lovlar xalqaro PCI DSS xavfsizlik standartlariga ega rasmiy litsenziyalangan to'lov shlyuzlari (InPay va hamkor banklar) tomonidan himoyalangan kanallar orqali amalga oshiriladi."
      }
    ]
  },
  {
    icon: DocumentTextIcon,
    title: "3. Shaxsiy Ma'lumotlarni Qayta Ishlash Maqsadlari",
    content: [
      "Platforma foydalanuvchilarning shaxsiy ma'lumotlarini faqat aniq belgilangan, qonuniy va ta'limiy maqsadlarda qayta ishlaydi:"
    ],
    bullets: [
      "Foydalanuvchini autentifikatsiya qilish, uning hisobini yaratish va xavfsizligini ta'minlash (SMS / Telegram OTP va Google OAuth orqali);",
      "Ta'limiy xizmatlarni ko'rsatish: Testlar, milliy sertifikat va DTM simulyatorlarini o'tkazish, natijalarni ballarga aylantirish;",
      "O'quvchining bilim darajasini psixometrik (Rasch modeli) va statistik tahlil qilish, shaxsiy zaif mavzularni aniqlab berish;",
      "Sun'iy intellekt (EduAI, Math Solver, Essay Checker) orqali savollarni tushuntirish va o'quv jarayoniga individual ko'maklashish;",
      "Olimpiada va tanlovlar g'oliblarini aniqlash, ularga rasmiy elektron sertifikatlar generatsiya qilish;",
      "EduCoin virtual ballarini hisoblash, mukofotlash va gamifikatsiya vositalarini yuritish;",
      "Kiberxavfsizlik va tizim yaxlitligini ta'minlash: Serverlarga DDoS va xakerlik hujumlarini bartaraf etish, imtihonlarda firibgarlik (anti-cheat) holatlarini aniqlash, qoidabuzar qurilmalarni bloklash;",
      "Moliya va buxgalteriya hisobini yuritish, to'lovlar to'g'ri o'tganligini tekshirish va tasdiqlash;",
      "Texnik qo'llab-quvvatlash xizmati orqali foydalanuvchi murojaatlari va shikoyatlarini ko'rib chiqish;",
      "Platforma xizmatlari, yangi testlar va muhim yangilanishlar haqida xabarnomalar (email, Telegram yoki veb-push) yuborish (foydalanuvchi xohishiga ko'ra)."
    ]
  },
  {
    icon: GlobalIcon,
    title: "4. Ma'lumotlarni Uchinchi Shaxslarga Berish va Tashqi Integratsiyalar",
    content: [
      "EduContest foydalanuvchilarning shaxsiy ma'lumotlarini hech qanday tijorat tashkilotlariga reklama qilish maqsadida SOTMAYDI va IJARAGA BERMAYDI.",
      "Ma'lumotlar faqat quyidagi zaruriy xizmat provayderlariga xizmat ko'rsatish doirasida uzatiladi:"
    ],
    subsections: [
      {
        subtitle: "4.1. Rasmiy xizmat hamkorlari",
        bullets: [
          "To'lov provayderlari (InPay va hamkor banklar): Faqat to'lovni rasmiylashtirish, tasdiqlash va hisobni to'ldirish uchun zarur bo'lgan hajmda;",
          "Sun'iy intellekt infratuzilmasi (Mistral AI): Foydalanuvchi yuborgan o'quv so'rovi yoki insho matnini tahlil qilish uchun (shaxsiy identifikatorlarsiz anonim tarzda uzatiladi);",
          "Web-push xabarnoma xizmati (OneSignal): Foydalanuvchi brauzeriga muhim o'quv eslatmalari va yangiliklarni yetkazish uchun;",
          "Tahliliy tizimlar (Google Analytics, Yandex.Metrika): Saytning texnik barqarorligi, yuklanish tezligi va tashriflar statistikasini yuritish uchun anonim ma'lumotlar."
        ]
      },
      {
        subtitle: "4.2. Qonuniy talablar asosida berish",
        bullets: [
          "O'zbekiston Respublikasi qonun hujjatlariga muvofiq, sud qarori, huquqni muhofaza qiluvchi organlarning qonuniy rasmiy so'rovlari bo'yicha;",
          "Platforma foydalanuvchilarining xavfsizligini, mualliflik huquqlarini va tizimga qilingan noqonuniy kiberhujumlarni tergov qilish maqsadida."
        ]
      }
    ]
  },
  {
    icon: DatabaseIcon,
    title: "5. Cookie Fayllar, Tahlil Tizimlari va Google AdSense Reklama Siyosati",
    content: [
      "educontest.uz veb-sayti o'z xizmatlarini taqdim etish, sayt faoliyatini tahlil qilish hamda tegishli reklamalarni ko'rsatish uchun Cookie fayllari va zamonaviy veb-texnologiyalardan foydalanadi:"
    ],
    bullets: [
      "Tizimli va Xavfsizlik Cookie'lari: Foydalanuvchining kirish sessiyasini xavfsiz saqlash (HttpOnly sb-access-token), tizimdan ruxsatsiz foydalanishni oldini olish va CSRF himoyasi uchun;",
      "Funksional Cookie'lar: Tanlangan interfeys mavzusi (yorug'/qorong'i rejim), til sozlamalari va o'quv sahifasidagi holatni eslab qolish uchun;",
      "Statistika va Audit Cookie'lari (Google Analytics, Yandex.Metrika): Sayt sahifalarining ko'rilishi, foydalanuvchilar harakati va tizimdagi yuklanishlarni o'rganish uchun."
    ],
    subsections: [
      {
        subtitle: "5.1. Google AdSense va Uchinchi Tomon Reklama Cookie'lari",
        text: "Platformada ta'limiy xizmatlarni bepul va arzon taqdim etishni qo'llab-quvvatlash maqsadida Google AdSense reklama tarmog'idan foydalaniladi. Google va uning hamkorlari quyidagi qoidalarga tayanadi:",
        bullets: [
          "Google uchinchi tomon sotuvchisi sifatida educontest.uz saytida reklama ko'rsatish uchun cookie fayllaridan (jumladan, DoubleClick va DART cookie fayllaridan) foydalanadi;",
          "Google'ning reklama cookie fayllaridan foydalanishi unga va uning hamkorlariga foydalanuvchilarning educontest.uz va/yoki Internetdagi boshqa veb-saytlarga tashriflariga asoslangan holda shaxsiylashtirilgan reklamalarni taklif qilish imkonini beradi;",
          "Foydalanuvchilar shaxsiylashtirilgan reklamalarni ko'rishni istamasalar, Google Reklama Sozlamalari (https://www.google.com/settings/ads) sahifasiga tashrif buyurib, qiziqishlarga asoslangan reklamalarni o'chirib qo'yishlari (opt-out) mumkin;",
          "Shuningdek, uchinchi tomon reklama tarmoqlarining cookie fayllaridan foydalanishini www.aboutads.info yoki www.youronlinechoices.com sahifalari orqali bekor qilish imkoniyati mavjud."
        ],
        extra: "Siz o'z veb-brauzeringiz sozlamalari orqali istalgan vaqtda cookie fayllarni tozalashingiz yoki ularni qabul qilishni butunlay taqiqlashingiz mumkin. Biroq bu holda saytning ba'zi avtorizatsiya va xavfsizlik funksiyalari to'g'ri ishlamasligi mumkin."
      }
    ]
  },
  {
    icon: LockIcon,
    title: "6. Kiberxavfsizlik va Ma'lumotlarni Himoya Qilish Choralari",
    content: [
      "EduContest foydalanuvchilar ma'lumotlarini ruxsatsiz kirish, yo'qotish, o'g'irlash yoki o'zgartirishdan himoyalash uchun ko'p pog'onali zamonaviy kiberxavfsizlik arxitekturasini qo'llaydi:"
    ],
    bullets: [
      "Kriptografik shifrlash: Sayt bilan foydalanuvchi o'rtasidagi barcha axborot almashinuvi yuqori darajadagi SSL/TLS (HTTPS) shifrlash protokollari orqali himoyalangan;",
      "Parollarni shifrlash: Ma'lumotlar bazasida saqlanadigan barcha parollar pgcrypto (bcrypt/blowfish) xesh-algoritmlari orqali bir tomonlama shifrlangan bo'lib, ularni hatto platforma ma'murlari ham ko'ra olmaydi;",
      "DDoS va Botlarga qarshi qalqon (DDoSProtectionShield): Server darajasida o'rnatilgan aqlli xavfsizlik qalqoni har bir IP-manzildan kelayotgan so'rovlar tezligini nazorat qiladi, zararli exploit-skanerlar (SQL-injection, directory traversal, botnetlar) aniqlanganda darhol IP-manzilni avtomatik bloklaydi;",
      "Qurilma nazorati va Anti-Cheat: Bir hisobdan shubhali ko'p sonli qurilmalarda bir vaqtda foydalanilganda yoki g'ayritabiiy harakatlar aniqlanganda, hisob va qurilma avtomatik xavfsizlik tekshiruviga yo'naltiriladi;",
      "Xavfsiz sessiyalar: Foydalanuvchi sessiya tokenlari HttpOnly, Secure va SameSite bayroqlari bilan himoyalangan bo'lib, XSS (Cross-Site Scripting) hujumlari orqali o'g'irlanishdan saqlangan;",
      "Ma'lumotlar bazasi zaxira nusxalari: Tizim ma'lumotlari muntazam ravishda xavfsiz serverlarda zaxiralanadi (backup)."
    ]
  },
  {
    icon: UsersGroupTwoRoundedIcon,
    title: "7. Foydalanuvchining Qonuniy Huquqlari",
    content: [
      "O'zbekiston Respublikasining \"Shaxsga doir ma'lumotlar to'g'risida\"gi Qonuniga muvofiq, siz o'zingizning shaxsiy ma'lumotlaringiz bo'yicha quyidagi huquqlarga egasiz:"
    ],
    bullets: [
      "Ma'lumotlar bilan tanishish huquqi: Platformada siz haqingizda qanday ma'lumotlar saqlanayotgani va ulardan qanday foydalanilayotgani haqida axborot olish;",
      "Tahrirlash va to'ldirish huquqi: O'z shaxsiy profilingizdagi (ism, ta'lim muassasasi, viloyat va h.k.) noto'g'ri yoki eskirgan ma'lumotlarni sozlamalar bo'limi orqali mustaqil o'zgartirish;",
      "O'chirish huquqi (\"Unutilish huquqi\"): O'z hisobingizni va unga biriktirilgan shaxsiy ma'lumotlarni butunlay o'chirishni talab qilish (Sozlamalar bo'limi yoki privacy@educontest.uz orqali);",
      "Qayta ishlashni cheklash huquqi: Shaxsiy ma'lumotlaringizdan marketing yoki reklama maqsadlarida foydalanishga berilgan rozilikni istalgan payt qaytarib olish;",
      "Shikoyat qilish huquqi: Shaxsga doir ma'lumotlaringiz noqonuniy qayta ishlanayotgan deb hisoblagan taqdirda, vakolatli davlat organlariga yoki sudga murojaat qilish."
    ],
    extra: "O'z huquqlaringizni amalga oshirish uchun privacy@educontest.uz elektron pochta manziliga yoki @educontest rasmiy qo'llab-quvvatlash xizmatiga murojaat qilishingiz mumkin. Murojaatingiz 7 ish kuni ichida ko'rib chiqiladi."
  },
  {
    icon: ShieldCheckIcon,
    title: "8. Voyaga Yetmaganlar (Bolalar) Maxfiyligi",
    content: [
      "EduContest platformasi maktab o'quvchilari (jumladan 14 yoshga to'lmagan shaxslar) tomonidan ham bilim olish maqsadida foydalaniladi.",
      "14 yoshga to'lmagan shaxslarning platformadan ro'yxatdan o'tishi va pullik xizmatlardan (InPay orqali hisob to'ldirish) foydalanishi ularning ota-onalari, vasiylari yoki qonuniy vakillarining xabardorligi va roziligi asosida amalga oshirilishi shart.",
      "Agar ota-ona yoki qonuniy vakil o'z farzandi ularning ruxsatisiz shaxsiy ma'lumot taqdim etganini aniqlasa, darhol privacy@educontest.uz manziliga murojaat qilishi mumkin — bunday hisob va ma'lumotlar tekshiruvdan so'ng zudlik bilan o'chirib tashlanadi."
    ]
  },
  {
    icon: DatabaseIcon,
    title: "9. Ma'lumotlarni Saqlash Muddatlari va Yo'q Qilish Tartibi",
    content: [
      "Shaxsiy ma'lumotlar faqat ularni to'plash maqsadlariga erishish uchun zarur bo'lgan muddat davomida saqlanadi:"
    ],
    bullets: [
      "Faol hisob ma'lumotlari: Foydalanuvchi hisobi mavjud bo'lgan butun vaqt davomida saqlanadi;",
      "O'chirilgan hisoblar: Foydalanuvchi hisobini o'chirishni so'raganda, uning shaxsiy ma'lumotlari 30 kun ichida faol bazadan arxivga olinadi va to'liq yo'q qilinadi;",
      "Moliyaviy tranzaksiyalar va to'lov kvitansiyalari: O'zbekiston Respublikasining soliq va buxgalteriya hisobi qonunchiligi talablariga binoan kamida 5 yil muddat davomida arxivda saqlanadi;",
      "Anonimlashtirilgan o'quv statistikasi: Testlarning qiyinlik darajasini aniqlash (Rasch modeli) va ilmiy tahlil uchun anonimlashtirilgan (shaxsga bog'lanmagan) test natijalari platforma bazasida saqlanishi mumkin."
    ]
  },
  {
    icon: DocumentTextIcon,
    title: "10. Maxfiylik Siyosatiga O'zgartirishlar Kiritish",
    content: [
      "EduContest yangi funksiyalar qo'shilishi, qonunchilikdagi yangilanishlar yoki xavfsizlik talablarining o'zgarishi munosabati bilan ushbu Maxfiylik Siyosatiga bir tomonlama o'zgartirish va qo'shimchalar kiritish huquqiga ega.",
      "Siyosatning yangi tahriri educontest.uz/privacy sahifasida e'lon qilingan paytdan boshlab kuchga kiradi.",
      "Muhim va jiddiy o'zgarishlar yuz berganda, foydalanuvchilar veb-saytdagi bildirishnoma, Telegram-bot yoki ro'yxatdan o'tgan telefon raqami orqali oldindan xabardor qilinadi."
    ]
  },
  {
    icon: LetterIcon,
    title: "11. Bog'lanish va Rekvizitlar",
    content: [
      "Ushbu Maxfiylik Siyosati, shaxsiy ma'lumotlarni qayta ishlash yoki xavfsizlik masalalari bo'yicha savol, taklif va shikoyatlaringizni quyidagi aloqa vositalari orqali yuborishingiz mumkin:"
    ],
    bullets: [
      "Veb-sayt: educontest.uz va api.educontest.uz",
      "Maxfiylik va ma'lumotlar himoyasi bo'yicha aloqa: privacy@educontest.uz",
      "Umumiy texnik qo'llab-quvvatlash xizmati: support@educontest.uz",
      "Aloqa sahifasi: educontest.uz/contact",
      "Joylashuv: Toshkent shahri, O'zbekiston Respublikasi"
    ]
  }
];

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Maxfiylik siyosati — EduContest"
        description="EduContest platformasining rasmiy Maxfiylik Siyosati (Privacy Policy) — shaxsga doir ma'lumotlarni to'plash, saqlash, qayta ishlash va kiberxavfsizlik choralari."
        canonical={`${window.location.origin}/privacy`}
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
              <ShieldCheckIcon className="w-8 h-8 text-[#E8192C]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Maxfiylik Siyosati
              </h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                educontest.uz — Rasmiy nashr | Oxirgi tahrir: 6-sentabr, 2026-yil
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
                Tushundim va Qabul qilaman
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
