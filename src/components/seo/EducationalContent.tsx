import React from 'react';
import { BookOpen, Target, Clock, Brain, AlertTriangle, CheckCircle, ArrowRight, GraduationCap, Lightbulb, Star } from 'lucide-react';

interface EducationalContentProps {
  subject: string;
  topicName: string;
  questionCount: number;
  duration: number;
  difficulty?: 'oson' | 'o\'rta' | 'qiyin';
}

const normalizeSubject = (s: string) => {
  const n = (s || '').toLowerCase().trim();
  if (n.includes('ingliz') || n.includes('english')) return 'Ingliz tili';
  if (n.includes('matemat') || n.includes('algebra') || n.includes('geometr')) return 'Matematika';
  if (n.includes('ona tili') || n.includes('o\'zbek')) return 'Ona tili';
  if (n.includes('tarix') || n.includes('history')) return 'Tarix';
  if (n.includes('biolog') || n.includes('bio')) return 'Biologiya';
  if (n.includes('adabiyot') || n.includes('literature')) return 'Adabiyot';
  return 'Matematika';
};

const getSubjectContent = (subject: string, topicName: string) => {
  const normalized = normalizeSubject(subject);
  const contentMap: Record<string, {
    intro: string;
    importance: string;
    usage: string;
    mistakes: string[];
    tips: string[];
    examRelevance: string;
  }> = {
    'Matematika': {
      intro: `${topicName} — matematikaning asosiy tushunchalaridan biri bo'lib, bu mavzu bo'yicha testlar o'quvchilarning mantiqiy fikrlash va hisoblash qobiliyatlarini baholashda muhim rol o'ynaydi. Milliy Sertifikat imtihonlarida matematika bo'limi har yili o'zgarib turadigan savollar bilan boyitiladi va ${topicName} mavzusi ko'pincha uchrash savollari qatoriga kiradi.`,
      importance: 'Bu mavzuni egallash nafaqat imtihonda yuqori ball olish, balki kunlik hayotda ham qo\'llaniladigan amaliy ko\'nikmalarni rivojlantirishga yordam beradi.',
      usage: 'Matematika testlari universitetlarga kirish imtihonlari, Milliy Sertifikat, SAT va boshqa xalqaro imtihonlarda keng qo\'llaniladi.',
      mistakes: [
        'Shartni noto\'g\'ri tushunish va tezda javob yozishga urinish',
        'Formulalarni yodlab o\'rniga tushunmaslik',
        'Hisoblash xatolariga e\'tibor bermaslik',
        'Javob variantlarini diqqat bilan tekshirmaslik'
      ],
      tips: [
        'Avval shartni diqqat bilan o\'qing',
        'Formulalarni tushunib yodlang',
        'Hisoblashlardan keyin javobni tekshiring',
        'Vaqt managementini to\'g\'ri bajaring',
        'Mashq testlarini muntazam bajaring'
      ],
      examRelevance: 'Milliy Sertifikat, SAT Math, DTM Matematika imtihonlarida bu mavzu bo\'yicha 5-10 ta savol kelishi mumkin.'
    },
    'Ona tili': {
      intro: `${topicName} — ona tili grammatikasining muhim qismi bo'lib, bu mavzu bo'yicha testlar o'quvchilarning til bilimini va grammatik tushunchalarini baholashda muhim hisoblanadi. Ona tili testlari grammatika, imlo, syntaktika va matn tahlilini qamrab oladi.`,
      importance: 'Ona tilini yaxshi bilish boshqa fanlarni ham o\'qishda yordam beradi, chunki matnlarni to\'g\'ri tushunish akademik muvaffaqiyatning asosidir.',
      usage: 'Milliy Sertifikat, CEFR, IELTS Writing va boshqa til sertifikatlari imtihonlarida keng qo\'llaniladi.',
      mistakes: [
        'Imlo xatolariga e\'tibor bermaslik',
        'Gap tuzilishini noto\'g\'ri aniqlash',
        'Ko\'plik va yegalik qoidalarini aralashtirish',
        'Bog\'lovchi so\'zlarni noto\'g\'ri ishlatish'
      ],
      tips: [
        'Ko\'p o\'qing va yangi so\'zlarni yodlang',
        'Grammatika qoidalarini muntazam takrorlang',
        'Matn yozish mashqlarini bajaring',
        'Xatolaringizni tahlil qiling'
      ],
      examRelevance: 'Milliy Sertifikat Ona Tili, CEFR B2/C1, IELTS Writing imtihonlarida bu mavzu muhim ahamiyat kasb etadi.'
    },
    'Tarix': {
      intro: `${topicName} — tarix fanining muhim mavzularidan biri bo'lib, bu bo'yicha testlar o'quvchilarning tarixiy voqealarni bilish va tahlil qilish qobiliyatlarini baholashga qaratilgan. Tarix testlari O'zbekiston va jahon tarixini qamrab oladi.`,
      importance: 'Tarixni bilish milliy o\'zlikni anglash va fuqarolik ongini shakllantirishda muhim rol o\'ynaydi.',
      usage: 'Milliy Sertifikat Tarix, DTM va boshqa akademik imtihonlarda qo\'llaniladi.',
      mistakes: [
        'Sanalarni noto\'g\'ri eslab qolish',
        'Voqealar ketma-ketligini aralashtirish',
        'Tarixiy shaxslarni adashtirish',
        'Sabab-oqibat munosabatlarini noto\'g\'ri tushunish'
      ],
      tips: [
        'Tarixiy voqealarni xronologik tartibda o\'rganing',
        'Vaqtlar jadvalini tuzing',
        'Asosiy manbalar bilan tanishib chiqing',
        'Muntazam takrorlang'
      ],
      examRelevance: 'Milliy Sertifikat Tarix imtihonida bu mavzu bo\'yicha 3-7 ta savol berilishi mumkin.'
    },
    'Biologiya': {
      intro: `${topicName} — biologiya fanining asosiy tushunchalaridan biri bo'lib, bu bo'yicha testlar o'quvchilarning biologik bilimlarini va ilmiy fikrlash qobiliyatlarini baholashga qaratilgan.`,
      importance: 'Biologiya bilimi tibbiyot, ekologiya, qishloq xo\'jaligi va boshqa sohalarda qo\'llaniladi.',
      usage: 'Milliy Sertifikat Biologiya, DTM Biologiya va tibbiyot yo\'nalishidagi imtihonlarda qo\'llaniladi.',
      mistakes: [
        'Atamalarni noto\'g\'ri tushunish',
        'Tizimlarni aralashtirish',
        'Jarayonlarni ketma-ketlikda tushunmaslik',
        'Ilmiy terminologiyani chalkashtirish'
      ],
      tips: [
        'Atamalarni yodlang va tushuning',
        'Jarayonlarni rasmlar orqali o\'rganing',
        'Muntazam laboratoriya mashqlarini bajaring',
        'Video darsliklarni ko\'ring'
      ],
      examRelevance: 'Milliy Sertifikat Biologiya imtihonida bu mavzu bo\'yicha 4-8 ta savol berilishi mumkin.'
    },
    'Adabiyot': {
      intro: `${topicName} — adabiyot fanining muhim mavzularidan biri bo'lib, bu bo'yicha testlar o'quvchilarning adabiy asarlarni tahlil qilish va tushunish qobiliyatlarini baholashga qaratilgan.`,
      importance: 'Adabiyotni tushunish madaniy boylik va estetik didni rivojlantirishga yordam beradi.',
      usage: 'Milliy Sertifikat Adabiyot va boshqa humanitar fanlar bo\'yicha imtihonlarda qo\'llaniladi.',
      mistakes: [
        'Asar mualliflarini adashtirish',
        'Asar qahramonlarini noto\'g\'ri aniqlash',
        'Davrlarni aralashtirish',
        'Asar mavzusini noto\'g\'ri tushunish'
      ],
      tips: [
        'Asarlarni to\'liq o\'qing',
        'Mualliflar haqida ma\'lumot to\'plang',
        'Asar tahlilini muntazam bajaring',
        'Adabiy atamalarni yodlang'
      ],
      examRelevance: 'Milliy Sertifikat Adabiyot imtihonida bu mavzu bo\'yicha 3-6 ta savol berilishi mumkin.'
    },
    'Ingliz tili': {
      intro: `${topicName} — ingliz tili grammatikasining muhim qismi bo'lib, CEFR standartlari asosida tuzilgan. Ushbu mavzu bo'yicha testlar o'quvchilarning ingliz tili bilimini, grammatik qoidalarini qo'llash va matnlarni to'g'ri tushunish qobiliyatlarini baholashga qaratilgan.`,
      importance: 'Ingliz tilini yaxshi bilish CEFR sertifikatini olish, xalqaro imtihonlarda yuqori ball olish va kasbiy rivojlanish uchun zarur. Grammatika — ingliz tilining asosi, unisiz gap tuzish va yozish mumkin emas.',
      usage: 'CEFR A1-C2, IELTS, TOEFL, SAT Reading va boshqa xalqaro sertifikat imtihonlarida keng qo\'llaniladi. Har bir daraja (A1 dan C2 gacha) o\'z grammatik qoidalarini talab qiladi.',
      mistakes: [
        'Grammar qoidalarini yodlab, lekin amalda qo\'llay olmaslik',
        'Tenses (vaqt) larini aralashtirish — present, past, future',
        'Articles (a, an, the) ni noto\'g\'ri ishlatish',
        'Prepositions (in, on, at) ni chalkashtirish',
        'Singular/Plural (yakka/ko\'plik) shakllarni noto\'g\'ri yasash'
      ],
      tips: [
        'Har kuni kamida 15 daqiqa inglizcha matn o\'qing',
        'Grammar qoidalarini misollar bilan birga o\'rganing',
        'Speaking (gapirish) mashqlarini muntazam bajaring',
        'IELTS/CEFR mock testlarini sinab ko\'ring',
        'Inglizcha podcast va video ko\'rib tinglang'
      ],
      examRelevance: 'CEFR B1/B2, IELTS 6.0+, TOEFL 80+ imtihonlarida grammatika bo\'limi umumiy bahoning 25-30% ini tashkil etadi. Har bir mavzu (Nouns, Verbs, Tenses, Articles) uchun alohida savollar beriladi.'
    }
  };

  return contentMap[normalized] || contentMap['Matematika'];
};

const EducationalContent: React.FC<EducationalContentProps> = ({
  subject,
  topicName,
  questionCount,
  duration,
  difficulty = "o'rta"
}) => {
  const content = getSubjectContent(subject, topicName);

  const difficultyConfig = {
    'oson': { label: 'Oson', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle },
    "o'rta": { label: "O'rta", color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Target },
    'qiyin': { label: 'Qiyin', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', icon: AlertTriangle }
  };

  const diffCfg = difficultyConfig[difficulty];
  const DiffIcon = diffCfg.icon;

  const faqItems = [
    {
      question: `${topicName} testi qancha vaqt davom etadi?`,
      answer: `Ushbu test ${duration} daqiqa davom etadi. Testda ${questionCount} ta savol mavjud. Har bir savolga o'rtacha ${Math.round(duration / questionCount)} daqiqa vaqt ajratish tavsiya etiladi.`
    },
    {
      question: `${topicName} testi qaysi darajada?`,
      answer: `Ushbu test "${difficulty}" darajada tuzilgan. ${content.examRelevance}`
    },
    {
      question: `Testni qanday boshlash mumkin?`,
      answer: `"Testni boshlash" tugmasini bosganingizdan so'ng, sizga berilgan vaqt ichida barcha savollarga javob berishingiz kerak. Vaqt tugaganda test avtomatik yakunlanadi.`
    },
    {
      question: `Natijalarni qanday ko'rish mumkin?`,
      answer: `Testni tugatganingizdan so'ng, natijalaringiz ko'rsatiladi. To'g'ri va noto'g'ri javoblar soni, ball foiz va har bir savolning tushuntirishi ko'rsatiladi.`
    },
    {
      question: `AI tushuntirish nima?`,
      answer: `Har bir savol uchun AI yordamchisi tomonidan tayyorlangan batafsil tushuntirish mavjud. Bu tushuntirish to'g'ri javobning nega to'g'riligini va boshqa variantlarning nima uchun noto'g'riligini tushuntiradi.`
    }
  ];

  return (
    <div className="space-y-5">
      {/* Educational Introduction */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <h2 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {topicName} haqida
          </h2>
        </div>

        <div className="space-y-3">
          <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {content.intro}
          </p>
          <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {content.importance}
          </p>
          <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {content.usage}
          </p>
        </div>

        {/* Exam Relevance */}
        <div className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-500/5 dark:to-violet-500/5 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <GraduationCap className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] font-medium text-blue-700 dark:text-blue-300 mb-1">Imtihonlarda qo'llanilishi</p>
              <p className="text-[12px] text-blue-600 dark:text-blue-400 leading-relaxed">{content.examRelevance}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What you should know before taking this test */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <h2 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Testdan oldin bilishingiz kerak narsalar
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <Target className="w-4 h-4 text-[#E8192C] mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">O'quv maqsadlari</p>
              <p className="text-[11px] text-slate-500">{topicName} bo'yicha bilimlaringizni mustahkamlash</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <DiffIcon className={`w-4 h-4 mt-0.5 shrink-0 ${diffCfg.color}`} />
            <div>
              <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Qiyinlik darajasi</p>
              <p className={`text-[11px] ${diffCfg.color}`}>{diffCfg.label}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Taxminiy vaqt</p>
              <p className="text-[11px] text-slate-500">{duration} daqiqa</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <Brain className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">O'lchov ko'nikmalari</p>
              <p className="text-[11px] text-slate-500">Mantiqiy fikrlash, esda saqlash, tahlil qilish</p>
            </div>
          </div>
        </div>

        {/* Common Mistakes */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Ko'p uchraydigan xatolar</p>
          <ul className="space-y-1.5">
            {content.mistakes.map((mistake, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                {mistake}
              </li>
            ))}
          </ul>
        </div>

        {/* Tips */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Maslahatlar</p>
          <ul className="space-y-1.5">
            {content.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                <Star className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default EducationalContent;
