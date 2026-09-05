import { useState, createContext, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Subject {
  id: string;
  name: string;
  is_active: boolean;
  order_number: number;
  icon?: string;
}

interface SubjectContextType {
  activeSubject: string | null;
  setActiveSubject: (subject: string | null) => void;
  subjects: Subject[];
  isLoading: boolean;
}

const SubjectContext = createContext<SubjectContextType>({
  activeSubject: null,
  setActiveSubject: () => { },
  subjects: [],
  isLoading: true,
});

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "Matematika", name: "Matematika", is_active: true, order_number: 1 },
  { id: "Ingliz tili", name: "Ingliz tili", is_active: true, order_number: 2 },
  { id: "Rus tili", name: "Rus tili", is_active: true, order_number: 3 },
  { id: "Informatika", name: "Informatika", is_active: true, order_number: 4 },
  { id: "Fizika", name: "Fizika", is_active: true, order_number: 5 },
  { id: "Kimyo", name: "Kimyo", is_active: true, order_number: 6 },
  { id: "Biologiya", name: "Biologiya", is_active: true, order_number: 7 },
  { id: "Tarix", name: "Tarix", is_active: true, order_number: 8 },
  { id: "O'zbek tili", name: "O'zbek tili", is_active: true, order_number: 9 },
  { id: "Ona tili va adabiyot", name: "Ona tili va adabiyot", is_active: true, order_number: 10 },
  { id: "Geografiya", name: "Geografiya", is_active: true, order_number: 11 },
];

function normalizeName(name: string): string {
  if (!name) return "";
  const n = name.toLowerCase().trim();
  if (n.includes('ingliz') || n.includes('ingiliz')) return 'Ingliz tili';
  if (n.includes('rus')) return 'Rus tili';
  if (n.includes('matematik')) return 'Matematika';
  if (n.includes('tarix')) return 'Tarix';
  if (n.includes('biolog')) return 'Biologiya';
  if (n.includes('fizik')) return 'Fizika';
  if (n.includes('informat')) return 'Informatika';
  if (n.includes('kimyo')) return 'Kimyo';
  if (n.includes('geograf')) return 'Geografiya';
  if (n.includes('ona') || n.includes('adabiyot')) return 'Ona tili va adabiyot';
  if (n.includes('o\'zbek')) return "O'zbek tili";
  return name;
}

export const SubjectProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useAuth();
  const [activeSubject, setActiveSubjectState] = useState<string | null>(() => {
    return localStorage.getItem("selected_subject");
  });
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from("subjects" as any)
          .select("*")
          .eq("is_active", true)
          .order("order_number");

        if (error) throw error;
        
        let resultList: Subject[] = [];
        if (data && data.length > 0) {
          const normMap = new Map<string, Subject>();
          (data as any[]).forEach(s => {
            const norm = normalizeName(s.name);
            if (!normMap.has(norm)) {
              normMap.set(norm, {
                id: norm,
                name: norm,
                is_active: s.is_active ?? true,
                order_number: s.order_number || 99
              });
            }
          });

          DEFAULT_SUBJECTS.forEach(d => {
            const norm = normalizeName(d.name);
            if (!normMap.has(norm)) {
              normMap.set(norm, {
                id: norm,
                name: norm,
                is_active: true,
                order_number: d.order_number
              });
            }
          });

          resultList = Array.from(normMap.values()).sort((a, b) => a.order_number - b.order_number);
        } else {
          resultList = DEFAULT_SUBJECTS;
        }

        setSubjects(resultList);

        if (!activeSubject && profile?.target_subject && resultList.some(s => s.name === profile.target_subject)) {
          setActiveSubjectState(profile.target_subject);
        } else if (!activeSubject && resultList.length > 0) {
          setActiveSubjectState(resultList[0].name);
          localStorage.setItem("selected_subject", resultList[0].name);
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setSubjects(DEFAULT_SUBJECTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [profile?.target_subject]);

  const setActiveSubject = (subject: string | null) => {
    setActiveSubjectState(subject);
    if (subject) {
      localStorage.setItem("selected_subject", subject);
    } else {
      localStorage.removeItem("selected_subject");
    }
    // Optional: update profile target_subject in DB if user is logged in
  };

  return (
    <SubjectContext.Provider value={{ activeSubject, setActiveSubject, subjects, isLoading }}>
      {children}
    </SubjectContext.Provider>
  );
};

export const useSubject = () => useContext(SubjectContext);
