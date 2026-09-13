import { useNavigate } from "react-router-dom";
import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { DocumentTextIcon } from "@solar-icons/react/bold-duotone/document-text";
import { ShieldCheckIcon } from "@solar-icons/react/bold-duotone/shield-check";
import { ShieldWarningIcon } from "@solar-icons/react/bold-duotone/shield-warning";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { CardIcon } from "@solar-icons/react/bold-duotone/card";
import { DangerTriangleIcon } from "@solar-icons/react/bold-duotone/danger-triangle";
import { ChatDotsIcon } from "@solar-icons/react/bold-duotone/chat-dots";
import { LetterIcon } from "@solar-icons/react/bold-duotone/letter";
import { ScaleIcon } from "@solar-icons/react/bold-duotone/scale";
import SEO from "@/components/SEO";

interface TermSection {
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

const sections: TermSection[] = [
  {
    icon: ScaleIcon,
    title: "1. Umumiy Qoidalar va Shartnomaning Yuridik Maqomi",
    content: [
      "Ushbu Foydalanish Shartlari va Yakuniy Foydalanuvchi Litsenziyasi Shartnomasi (bundan buyon matnda \"Shartlar\" yoki \"Litsenziya\") EduContest elektron ta'lim platformasi (educontest.uz, api.educontest.uz) va uning barcha tegishli xizmatlaridan foydalanish tartibini belgilaydi.",
      "EduContest platformasiga kirish, ro'yxatdan o'tish, Telegram Bot orqali tasdiqlash, testlarni ishlash, AI imkoniyatlaridan foydalanish yoki hamyonni to'ldirish orqali siz ushbu Shartlarni, shuningdek platformaning Maxfiylik Siyosatini (Privacy Policy) to'liq, so'zsiz va cheklovlarsiz qabul qilgan (aksept qilgan) hisoblanasiz.",
      "Agar siz ushbu shartlarning biron bir bandiga rozi bo'lmasangiz, platformadan va uning xizmatlaridan foydalanishni darhol to'xtatishingiz shart.",
      "Ushbu hujjat O'zbekiston Respublikasining Fuqarolik Kodeksi, \"Elektron tijorat to'g'risida\"gi, \"Iste'molchilar huquqlarini himoya qilish to'g'risida\"gi hamda \"Mualliflik huquqi va turdosh huquqlar to'g'risida\"gi Qonunlariga muvofiq ommaviy yuridik bitim hisoblanadi."
    ]
  },
  {
    icon: DocumentTextIcon,
    title: "2. Foydalanuvchi Litsenziyasi (EULA) va Intellektual Mulk",
    content: [
      "EduContest platformasidagi barcha dasturiy kodlar, ma'lumotlar bazasi tuzilmasi, test savollari bazasi, yechimlar va tushuntirishlar, videodarslar, matnlar, grafik dizayn, Rasch modeli psixometrik algoritmlari va savdo belgilari EduContest-ning mutlaq intellektual mulki hisoblanadi va qonun bilan himoyalanadi."
    ],
    subsections: [
      {
        subtitle: "2.1. Taqdim etiladigan litsenziya hajmi",
        bullets: [
          "EduContest foydalanuvchiga platforma imkoniyatlaridan faqat shaxsiy, ta'limiy va notijorat maqsadlarda foydalanish uchun cheklangan, noeksklyuziv, boshqa shaxsga o'tkazilmaydigan (non-transferable) va qaytarib olinadigan litsenziya huquqini beradi;",
          "Foydalanuvchi testlarni ishlashi, natijalarini shaxsiy o'rganish uchun saqlashi va o'z o'quv jarayonini tahlil qilishi mumkin."
        ]
      },
      {
        subtitle: "2.2. Qat'iyan taqiqlangan harakatlar (Litsenziya buzilishi)",
        bullets: [
          "Savollar bazasini ko'chirish, ruxsatsiz skrinshot qilish, elektron yoki bosma tarzda ko'paytirish;",
          "Platforma materiallari va testlarini tijorat maqsadida qayta sotish, pullik guruhlar yoki Telegram kanallarda ruxsatsiz tarqatish;",
          "Avtomatlashtirilgan vositalar (skriptlar, parserlar, botlar, scraping vositalari) yordamida platforma ma'lumotlarini yuklab olish;",
          "Platformaning dasturiy ta'minot kodini dekompilyatsiya qilish, teskari muhandislik (reverse engineering) qilish yoki manba kodini olishga urinish;",
          "EduContest brendi, logotipi va dizaynidan ruxsatsiz o'z loyihalarida foydalanish."
        ],
        extra: "Mualliflik huquqi va litsenziya shartlari buzilgan taqdirda, huquqbuzarning hisobi darhol ogohlantirishsiz o'chiriladi va O'zbekiston Respublikasi qonunchiligiga binoan moddiy hamda ma'muriy/jinoiy javobgarlikka tortish choralari ko'riladi."
      }
    ]
  },
  {
    icon: ShieldCheckIcon,
    title: "3. Hisob Yaratish, Autentifikatsiya va Qurilma Nazorati",
    subsections: [
      {
        subtitle: "3.1. Ro'yxatdan o'tish talablari",
        bullets: [
          "Foydalanuvchi platformada ro'yxatdan o'tishda o'zining haqiqiy telefon raqami, Telegram profili yoki Google akkauntidan foydalanishi shart;",
          "Bir foydalanuvchi faqat bitta asosiy hisobga ega bo'lishi mumkin (multi-account taqiqlanadi);",
          "Foydalanuvchi o'z login ma'lumotlari, Telegram tasdiqlash kodlari va sessiya xavfsizligi uchun shaxsan javobgardir."
        ]
      },
      {
        subtitle: "3.2. Qurilma xavfsizlik nazorati (Device Block Guard)",
        bullets: [
          "Platformada akkaunt xavfsizligi va testlarning adolatli o'tishini ta'minlash uchun qurilma barmoq izi (fingerprint) va IP-manzil tekshiruv tizimi faoliyat yuritadi;",
          "Bitta hisobdan bir vaqtda ko'plab turli qurilmalarda shubhali kirishlar aniqlanganda, hisob vaqtinchalik xavfsizlik tekshiruviga yopiladi;",
          "Kiberhujumlar, exploit skanerlari yoki firibgarlik harakatlarida ishtirok etgan qurilma va IP-manzillar tizim tomonidan (blocked_devices) avtomatik tarzda bloklanadi."
        ]
      }
    ]
  },
  {
    icon: DocumentTextIcon,
    title: "4. Testlar, Mock Imtihonlar va Akademik Halollik (Anti-Cheat)",
    content: [
      "EduContest ta'lim sifatini va adolatli raqobatni ta'minlash uchun qat'iy akademik halollik standartlarini qo'llaydi:"
    ],
    bullets: [
      "Mock test reglamenti: Milliy sertifikat va DTM formati testlari qat'iy belgilangan vaqt (masalan, 150 daqiqa) va ruxsat etilgan urinishlar soni (max attempts) asosida topshiriladi;",
      "Imtihon yaxlitligi: Test jarayonida brauzer oynasini yopmaslik, boshqa ilovalarga o'tmaslik yoki brauzer tabini almashtirmaslik tavsiya etiladi. Tizim test paytidagi g'ayritabiiy uzilishlar va harakatlarni qayd etib boradi;",
      "Ko'chirish va yordam olishning taqiqlanishi: Test topshirish vaqtida uchinchi shaxslar yordamidan foydalanish, javoblarni avtomatlashtirilgan kengaytmalar orqali yechish yoki test javoblarini boshqa foydalanuvchilar bilan bo'lishish qat'iyan taqiqlanadi;",
      "Olimpiada natijalari: Rasmiy online olimpiadalarda qoidabuzarlik yoki g'ayritabiiy faollik (masalan, inson imkoniyatidan tez yechish) aniqlangan ishtirokchilarning natijalari hakamlar tomonidan bekor qilinadi va sertifikat berilmaydi."
    ]
  },
  {
    icon: DangerTriangleIcon,
    title: "5. Sun'iy Intellekt (AI) Xizmatlaridan Foydalanish Qoidalari",
    content: [
      "Platformadagi EduAI Chat, AI Mentor, Math Solver (matematik yechgich), Essay Checker (insho tekshirgich) va AI Savol Generatori ta'limiy ko'makchi vositalardir:"
    ],
    bullets: [
      "Konsultatsion xarakter: Sun'iy intellekt tomonidan berilgan yechimlar, formulalar tahlili va insho baholari tavsiyaviy xarakterga ega bo'lib, davlat ta'lim inspeksiyasi yoki rasmiy ekspertlar xulosasining o'rnini bosmaydi;",
      "Javobgarlikning cheklanishi: EduContest AI modellarining 100% xatosiz ishlashiga, matematik hisoblashlardagi yuzaga kelishi mumkin bo'lgan mexanik noaniqliklarga kafolat bermaydi;",
      "Foydalanish etikasi: AI modellariga haqoratomuz, qonunga zid, milliy yoki diniy adovatni qo'zg'atuvchi, xakerlik kodlarini o'z ichiga olgan promptlar (so'rovlar) yuborish taqiqlanadi. Bunday so'rovlar yuborgan foydalanuvchining AI xizmatlariga kirishi bloklanadi."
    ]
  },
  {
    icon: CardIcon,
    title: "6. EduCoin Virtual Birligi va Gamifikatsiya Qoidalari",
    content: [
      "EduCoin — bu platforma foydalanuvchilarining o'quv faolligini rag'batlantirish uchun joriy qilingan ichki virtual ball tizimidir:"
    ],
    bullets: [
      "Olinishi: Foydalanuvchilar har kungi tizimga kirish (Daily login streak), testlarni a'lo baholarga topshirish, Forest Timer-da o'quv vaqtini muvaffaqiyatli yakunlash orqali EduCoin yig'ishlari mumkin;",
      "Faqat virtual xususiyat: EduCoin hech qanday sharoitda haqiqiy pul, chet el valyutasi, elektron pul yoki investitsiya vositasi hisoblanmaydi;",
      "Almashtirish va sotish taqiqlanishi: EduCoinlarni naqd pulga almashtirish, bank kartasiga yechib olish, boshqa foydalanuvchilarga sotish yoki platformadan tashqariga o'tkazish qat'iyan man etiladi;",
      "Sarflash: EduCoin faqat EduContest platformasi ichidagi virtual imkoniyatlar (masalan, qo'shimcha testlar yoki virtual sovrinlar) uchun ishlatilishi mumkin;",
      "Bekor qilish huquqi: Tizimdagi xatolik, texnik nosozlik yoki firibgarlik yo'li bilan asossiz to'plangan EduCoinlar ma'muriyat tomonidan ogohlantirishsiz hisobdan chiqariladi."
    ]
  },
  {
    icon: CardIcon,
    title: "7. To'lovlar, Hamyon Balansi va Qaytarib Bermaslik Sharti (Refund Policy)",
    subsections: [
      {
        subtitle: "7.1. To'lov tartibi va Hamyon (Wallet)",
        bullets: [
          "Barcha xizmatlar narxi O'zbekiston so'mida (UZS) ko'rsatiladi;",
          "Foydalanuvchi o'z hamyon balansini InPay rasmiy to'lov shlyuzi (Uzcard, Humo, Visa, Mastercard) yoki P2P karta o'tkazmasi chekini yuklash orqali to'ldirishi mumkin;",
          "To'ldirilgan mablag'lar faqat EduContest platformasidagi pullik testlar, kurslar yoki obunalarni xarid qilish uchun mo'ljallangan."
        ]
      },
      {
        subtitle: "7.2. Raqamli xizmatlar xususiyati va Mablag'ni qaytarish shartlari (No-Refund)",
        bullets: [
          "O'zbekiston Respublikasining \"Elektron tijorat to'g'risida\"gi va \"Iste'molchilar huquqlarini himoya qilish to'g'risida\"gi qonunlariga muvofiq, raqamli xizmatlar (test sessiyasiga kirish, savollar bazasini ochish, kurs darslarini ko'rish) foydalanuvchi xizmatdan foydalanishni boshlagan paytdan boshlab to'liq ko'rsatilgan hisoblanadi;",
          "Foydalanuvchi tomonidan boshlangan yoki yakunlangan testlar, ochilgan kurslar, shuningdek hisobga kiritilgan va sarflangan mablag'lar qaytarib berilmaydi;",
          "Mablag'ni qaytarish faqat to'lov tizimida texnik xatolik yuz berib, mablag' yechib olingan ammo hamyon balansiga tushmagan yoki platformaning tasdiqlangan global texnik nosozligi tufayli xizmatdan mutlaqo foydalana olinmagan holatlarda, arizani 14 ish kuni ichida ko'rib chiqish orqali amalga oshiriladi."
        ]
      }
    ]
  },
  {
    icon: DocumentTextIcon,
    title: "8. Foydalanuvchi Tomonidan Yaratilgan Kontent (Contributor / Test Builder)",
    content: [
      "Pedagoglar, repetitorlar va mualliflar o'z testlarini platformaga (Builder Test yoki Contributor bo'limi orqali) yuklashlari mumkin:"
    ],
    bullets: [
      "Muallif yuklayotgan test savollari, tushuntirishlar va illyustratsiyalar uchinchi shaxslarning mualliflik huquqlarini buzmasligini kafolatlaydi;",
      "Mualliflik huquqini buzuvchi yoki plagiat materiallar aniqlanganda, ular ogohlantirishsiz o'chirib tashlanadi;",
      "Yuklangan ochiq test materiallaridan platforma o'quvchilarga ta'lim berish maqsadida bepul, muddatsiz va noeksklyuziv litsenziya asosida foydalanish huquqiga ega bo'ladi."
    ]
  },
  {
    icon: ShieldWarningIcon,
    title: "9. Qat'iyan Taqiqlangan Harakatlar",
    content: ["Platformadan foydalanishda quyidagi harakatlar qat'iyan taqiqlanadi:"],
    bullets: [
      "EduContest serverlariga DDoS hujumlari, SQL injection, XSS va boshqa kiberhujumlarni uyushtirish yoki ularda ishtirok etish;",
      "Saytning xavfsizlik qalqoni (DDoSProtectionShield) va qurilma bloklash filtrlarini aylanib o'tishga urinish;",
      "Boshqa foydalanuvchilarning shaxsiy ma'lumotlarini ruxsatsiz yig'ish, tarqatish yoki ularga tahdid solish;",
      "Soxta to'lov cheklarini yuklash orqali hamyonni noqonuniy to'ldirishga urinish;",
      "Platforma chatlari, e'lonlari yoki sharhlarida nojo'ya so'zlar, behayo materiallar, ekstremizm yoki qonunga zid ma'lumotlarni tarqatish."
    ]
  },
  {
    icon: DangerTriangleIcon,
    title: "10. Javobgarlikning Cheklanishi (Disclaimer)",
    content: [
      "EduContest xizmatlari \"QANDAY BO'LSA SHUNDAY\" (\"AS IS\") va \"MAVJUD BO'LGANIDEK\" (\"AS AVAILABLE\") asosida taqdim etiladi:"
    ],
    bullets: [
      "EduContest foydalanuvchining davlat OTMlariga kirish imtihonlarida, Milliy sertifikat yoki malaka attestatsiyasida muayyan ball olishiga kafolat bermaydi. Natija o'quvchining o'z iqtidori va mehnatiga bog'liq;",
      "Platforma internet-provayderlar, mobil aloqa operatorlari yoki to'lov tizimlaridagi nosozliklar sababli yuzaga kelgan vaqtinchalik uzilishlar uchun moddiy javobgar bo'lmaydi;",
      "Rejali texnik profilaktika ishlari vaqtida sayt faoliyati vaqtinchalik to'xtatilishi mumkin, bu haqda oldindan xabar beriladi."
    ]
  },
  {
    icon: ChatDotsIcon,
    title: "11. Nizolarni Hal Qilish va Amaldagi Qonunchilik",
    content: [
      "EduContest va foydalanuvchi o'rtasida yuzaga keladigan barcha kelishmovchiliklar muzokaralar va o'zaro tushunish yo'li bilan hal qilinadi:",
      "Foydalanuvchi e'tiroz va shikoyatlarini support@educontest.uz manziliga yozma ravishda yuboradi. Murojaat 5 ish kuni ichida ko'rib chiqiladi.",
      "Kelishuvga erishilmagan taqdirda, barcha nizolar O'zbekiston Respublikasining moddiy va protsessual huquqiga binoan, Toshkent shahridagi tegishli vakolatli sudlarda hal qilinadi."
    ]
  },
  {
    icon: LetterIcon,
    title: "12. Shartlarning Yangilanishi va Bog'lanish",
    content: [
      "EduContest ushbu Foydalanish Shartlarini istalgan vaqtda bir tomonlama yangilash huquqini saqlab qoladi. Yangilangan shartlar educontest.uz/terms sahifasida e'lon qilingan paytdan boshlab kuchga kiradi.",
      "Yuridik va texnik masalalar bo'yicha bog'lanish rekvizitlari:"
    ],
    bullets: [
      "Platforma: educontest.uz (BFF: api.educontest.uz)",
      "Mijozlarni qo'llab-quvvatlash xizmati: support@educontest.uz",
      "Yuridik va litsenziya bo'limi: legal@educontest.uz",
      "Rasmiy aloqa: educontest.uz/contact",
      "Hudud: Toshkent shahri, O'zbekiston Respublikasi"
    ]
  }
];

const Terms = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Foydalanish shartlari va Litsenziya — EduContest"
        description="EduContest platformasining rasmiy foydalanish shartlari, foydalanuvchi litsenziyasi (EULA), akademik halollik, to'lov va xavfsizlik qoidalari."
        canonical={`${window.location.origin}/terms`}
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
                Foydalanish Shartlari va Litsenziya
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
                Qabul qilaman
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;
