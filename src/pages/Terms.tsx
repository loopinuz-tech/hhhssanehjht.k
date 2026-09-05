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

const sections = [
  {
    icon: ScaleIcon,
    title: "1. Umumiy Qoidalar",
    content: [
      "EduContest — O'zbekiston o'quvchilari va talabalari uchun mo'ljallangan onlayn ta'lim va test platformasidir. Ushbu Foydalanish Shartlari educontest.uz saytiga kirish va undan foydalanish qoidalarini belgilaydi.",
      "Platformadan foydalanishni boshlash orqali siz ushbu shartlarni to'liq o'qib chiqqan, tushungan va qabul qilgan hisoblanasiz. Agar siz bu shartlarga rozi bo'lmasangiz, platformadan foydalanmang."
    ]
  },
  {
    icon: DocumentTextIcon,
    title: "2. Xizmatlar Tavsifi",
    content: [
      "EduContest platformasi quyidagi asosiy xizmatlarni taqdim etadi:"
    ],
    bullets: [
      "Fanlar bo'yicha onlayn testlar (Matematika, Fizika, Kimyo, Biologiya, Ona tili, Tarix, Ingliz tili va boshqalar)",
      "Mock test — imtihon simulyatsiyasi",
      "Kurslar va video darslar",
      "Qo'llanmalar va o'quv materiallari",
      "AI yordam — sun'iy intellekt yordamchi (EduAI)",
      "Ball hisoblash va statistika tizimi",
      "Essay Check — insholar tekshiruvi",
      "Tezkor lug'at",
      "Foydalanuvchilar reytingi va seriya tizimi",
      "Premium obuna — kengaytirilgan imkoniyatlar"
    ]
  },
  {
    icon: CheckCircleIcon,
    title: "3. Ro'yxatdan O'tish va Hisob",
    subsections: [
      {
        subtitle: "3.1. Hisob yaratish",
        text: "Platformadan to'liq foydalanish uchun ro'yxatdan o'tish talab etiladi. Ro'yxatdan o'tishda:",
        bullets: [
          "To'g'ri va haqiqiy ma'lumotlar kiritilishi shart",
          "Bir kishi bir nechta hisob yaratishi taqiqlanadi",
          "14 yoshga to'lmagan foydalanuvchilar ota-ona roziligi bilan ro'yxatdan o'tishi lozim",
          "Hisob ma'lumotlarining maxfiyligini saqlash foydalanuvchining javobgarligi hisoblanadi"
        ]
      },
      {
        subtitle: "3.2. Hisob bloklash",
        text: "EduContest quyidagi hollarda hisobingizni ogohlantirmasdan bloklash huquqini saqlaydi:",
        bullets: [
          "Qoidalarni buzish yoki firibgarlik aniqlanganda",
          "Boshqa foydalanuvchilarni bezovta qilish yoki tahdid solishda",
          "Platformani noto'g'ri maqsadlarda ishlatishda",
          "Qonunni buzuvchi harakatlar amalga oshirilganda"
        ]
      }
    ]
  },
  {
    icon: CardIcon,
    title: "4. To'lovlar va Premium Obuna",
    subsections: [
      {
        subtitle: "4.1. Bepul xizmatlar",
        text: "EduContest platformasining asosiy xizmatlari (cheklangan test, qo'llanmalar ko'rish) bepul taqdim etiladi."
      },
      {
        subtitle: "4.2. Premium obuna",
        text: "Premium obuna quyidagi qo'shimcha imkoniyatlarni beradi:",
        bullets: [
          "Cheksiz testlar va mashqlar",
          "Barcha fanlardagi to'liq kurs materiallari",
          "AI yordamchi kengaytirilgan funksiyalari",
          "Batafsil statistika va tahlil",
          "Reklama yo'q",
          "Ustuvor texnik yordam"
        ]
      },
      {
        subtitle: "4.3. To'lov shartlari",
        bullets: [
          "Barcha narxlar O'zbekiston so'mida (UZS) ko'rsatiladi",
          "To'lov Payme, Click, Uzum Bank va boshqa ruxsat etilgan tizimlar orqali qabul qilinadi",
          "Oylik va yillik obuna rejalari mavjud",
          "Obuna to'liq to'langandan so'ng darhol faollashadi"
        ]
      },
      {
        subtitle: "4.4. Qaytarish siyosati",
        text: "Quyidagi hollarda to'lov qaytarilishi mumkin:",
        bullets: [
          "Birinchi 7 kun ichida xizmatdan foydalanilmagan bo'lsa",
          "Texnik nosozlik sababli xizmat ko'rsatilmagan bo'lsa"
        ],
        extra: "Qaytarish talabi support@educontest.uz manziliga yuborilishi kerak. 14 ish kuni ichida ko'rib chiqiladi."
      }
    ]
  },
  {
    icon: ShieldWarningIcon,
    title: "5. Foydalanuvchi Majburiyatlari",
    content: ["Platforma foydalanuvchisi quyidagilarga rioya qilishi shart:"],
    bullets: [
      "Boshqa foydalanuvchilarning huquqlarini hurmat qilish",
      "Saytga zarar yetkazuvchi dasturlar yuklashdan saqlanish",
      "Test javoblarini boshqalar bilan bo'lishish taqiqlanadi",
      "Platformaning texnik tizimlariga ruxsatsiz kirishga urinish taqiqlanadi",
      "Spam, fishing, soxta ma'lumot tarqatish taqiqlanadi",
      "Qonunni buzuvchi kontentlar joylashtirish taqiqlanadi",
      "Hisob ma'lumotlarini uchinchi shaxslarga berish taqiqlanadi"
    ]
  },
  {
    icon: DocumentTextIcon,
    title: "6. Intellektual Mulk Huquqlari",
    content: [
      "EduContest platformasidagi barcha kontent (testlar, savollar, video darslar, qo'llanmalar, dasturiy ta'minot, dizayn elementlari) EduContest-ga tegishli bo'lib, mualliflik huquqi bilan himoyalangan."
    ],
    subsections: [
      {
        subtitle: "Ruxsat etilgan holda:",
        bullets: [
          "Shaxsiy o'quv maqsadlarida platformadagi materiallardan foydalanish",
          "Test natijalarini shaxsiy foydalanish uchun saqlash"
        ]
      },
      {
        subtitle: "Qat'iyan taqiqlanadi:",
        bullets: [
          "Platformadagi savollar va materiallarni tijorat maqsadida ko'paytirish, sotish",
          "Platformaning dasturiy kodini nusxalash yoki o'zgartirish",
          "Platforma nomidan ruxsatsiz materiallar tarqatish"
        ]
      }
    ]
  },
  {
    icon: DangerTriangleIcon,
    title: "7. AI Xizmatlari (EduAI) Shartlari",
    content: ["EduContest platformasidagi AI yordamchi (EduAI) xizmatlaridan foydalanishda:"],
    bullets: [
      "AI tomonidan berilgan javoblar ma'lumot maqsadida bo'lib, kafolatlanmaydi",
      "Muhim qarorlar uchun AI javoblarini yagona manba sifatida qabul qilmang",
      "AI xizmatidan noto'g'ri maqsadlarda foydalanish taqiqlanadi",
      "AI bilan suhbat ma'lumotlari xizmat sifatini yaxshilash uchun ishlatilishi mumkin"
    ]
  },
  {
    icon: DangerTriangleIcon,
    title: "8. Javobgarlikning Cheklanishi",
    content: ["EduContest quyidagi holatlarda javobgar bo'lmaydi:"],
    bullets: [
      "Internet aloqasi muammolari sababli yo'qolgan ma'lumotlar",
      "Foydalanuvchi harakati natijasida yetkazilgan zararlar",
      "Uchinchi tomon xizmatlaridan (to'lov tizimlari, ijtimoiy tarmoqlar) kelib chiqadigan muammolar",
      "Force majeure (tabiiy ofatlar, energiya uzilishi) holatlar"
    ],
    extra: "Platforma texnik xizmat ishlari vaqtida (maintenance) vaqtincha ishlamasligi mumkin. Bunday holatlarda foydalanuvchilar oldindan xabardor qilinadi."
  },
  {
    icon: DocumentTextIcon,
    title: "9. Shartlar O'zgarishlari",
    content: ["EduContest Foydalanish Shartlarini o'zgartirish huquqini saqlaydi. O'zgarishlar haqida foydalanuvchilarga:"],
    bullets: [
      "Elektron pochta orqali xabarnoma yuboriladi",
      "Platforma ichida bildirish (notification) ko'rsatiladi",
      "O'zgarishlar saytda e'lon qilinadi"
    ],
    extra: "Yangilangan shartlar e'lon qilinganidan 14 kun o'tgach kuchga kiradi. Ushbu muddatdan keyin platformadan foydalanishni davom ettirish yangi shartlarni qabul qilish deb hisoblanadi."
  },
  {
    icon: ChatDotsIcon,
    title: "10. Nizolarni Hal Qilish",
    content: ["EduContest va foydalanuvchi o'rtasida yuzaga keladigan nizolar quyidagi tartibda hal qilinadi:"],
    bullets: [
      "Avval muammo support@educontest.uz manziliga yoziladi",
      "EduContest 5 ish kuni ichida javob beradi va muammoni hal qilishga harakat qiladi",
      "Munosib hal topilmasa, O'zbekiston Respublikasi qonunlariga muvofiq sud tartibida ko'rib chiqiladi"
    ],
    extra: "Ushbu shartlar O'zbekiston Respublikasi qonunlari asosida tartibga solinadi."
  },
  {
    icon: LetterIcon,
    title: "11. Bog'lanish",
    content: ["Foydalanish shartlari bo'yicha savollar uchun:"],
    bullets: [
      "Email: support@educontest.uz",
      "Huquqiy masalalar: legal@educontest.uz",
      "Veb-sayt: educontest.uz",
      "Manzil: Toshkent shahar, O'zbekiston Respublikasi"
    ]
  },
];

const Terms = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO title="Foydalanish shartlari" description="EduContest foydalanish shartlari — platformadan foydalanish qoidalari va foydalanuvchi majburiyatlari." canonical={`${window.location.origin}/terms`} />
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
              <ScaleIcon className="w-7 h-7 text-[#E8192C]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Foydalanish Shartlari</h1>
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

export default Terms;
