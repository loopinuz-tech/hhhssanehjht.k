import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Link2, BookOpen, Calculator, Brain, FlaskConical, History, Globe } from 'lucide-react';

interface RelatedTopic {
  name: string;
  slug: string;
  subject: string;
  icon?: any;
}

interface RelatedTopicsProps {
  currentSubject: string;
  currentTopic: string;
  relatedFolders?: RelatedTopic[];
}

const SUBJECT_ICONS: Record<string, any> = {
  'Matematika': Calculator,
  'Ona tili': BookOpen,
  'Tarix': History,
  'Biologiya': FlaskConical,
  'Adabiyot': Brain,
  'Ingliz tili': Globe,
};

const RELATED_SUBJECTS: Record<string, string[]> = {
  'Matematika': ['Algebra', 'Geometriya', 'Funksiyalar', 'Tenglamalar', 'Noto\'g\'ri tenglamalar'],
  'Ona tili': ['Grammatika', 'Imlo', 'Syntaktika', 'Matn tahlili', 'Leksika'],
  'Tarix': ['O\'zbekiston tarixi', 'Jahon tarixi', 'Madaniyat', 'Davlat tuzilishi', 'Siyosat'],
  'Biologiya': ['Tuzilish', 'Genetika', 'Ekologiya', 'Evolutsiya', 'Fiziologiya'],
  'Adabiyot': ['She\'riyat', 'Proza', 'Drama', 'Adabiy tahlil', 'Mualliflar'],
  'Ingliz tili': ['Grammar', 'Vocabulary', 'Reading', 'Writing', 'Speaking'],
};

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

const RelatedTopics: React.FC<RelatedTopicsProps> = ({
  currentSubject,
  currentTopic,
  relatedFolders = []
}) => {
  const navigate = useNavigate();
  const normalized = normalizeSubject(currentSubject);

  const relatedSubjects = RELATED_SUBJECTS[normalized] || RELATED_SUBJECTS['Matematika'];
  const SubjectIcon = SUBJECT_ICONS[normalized] || BookOpen;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
          <Link2 className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <h2 className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
          Bog'liq mavzular
        </h2>
      </div>

      {/* Related subjects */}
      <div>
        <p className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
          {normalized} bo'yicha boshqa mavzular
        </p>
        <div className="flex flex-wrap gap-2">
          {relatedSubjects.map((topic, i) => (
            <button
              key={i}
              onClick={() => navigate(`/tests/${encodeURIComponent(normalized.toLowerCase())}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <SubjectIcon className="w-3.5 h-3.5" />
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Related folders */}
      {relatedFolders.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
            O'xshash testlar
          </p>
          <div className="space-y-2">
            {relatedFolders.slice(0, 5).map((folder, i) => {
              const FolderIcon = SUBJECT_ICONS[folder.subject] || BookOpen;
              return (
                <button
                  key={i}
                  onClick={() => navigate(`/tests/folder/${folder.slug}`)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-[#E8192C]/10 flex items-center justify-center">
                      <FolderIcon className="w-3.5 h-3.5 text-[#E8192C]" />
                    </div>
                    <span className="text-[12.5px] font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                      {folder.name}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Continue learning */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
          Davom etish
        </p>
        <div className="space-y-1.5">
          <button
            onClick={() => navigate('/tests')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
          >
            <span className="text-[12.5px] font-extrabold text-slate-800 dark:text-slate-200">Barcha testlar</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => navigate('/courses')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
          >
            <span className="text-[12.5px] font-extrabold text-slate-800 dark:text-slate-200">Kurslar</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => navigate('/qollanmalar')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
          >
            <span className="text-[12.5px] font-extrabold text-slate-800 dark:text-slate-200">Qo'llanmalar</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default RelatedTopics;
