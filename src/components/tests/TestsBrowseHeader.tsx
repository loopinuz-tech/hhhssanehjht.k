import { BarChart3, BookOpen, Layers, Target } from "lucide-react";
import { PageHeader } from "@/components/platform";

type CategoryPill = { id: string; label: string };

type TestsBrowseHeaderProps = {
  subject: string;
  folderCount: number;
  totalQuestions: number;
  masteryPercent: number;
  categories: CategoryPill[];
  activeCategory: string;
  onBack: () => void;
  onCategoryChange: (id: string) => void;
};

export function TestsBrowseHeader(props: TestsBrowseHeaderProps) {
  const {
    subject,
    folderCount,
    totalQuestions,
    masteryPercent,
    categories,
    activeCategory,
    onBack,
    onCategoryChange,
  } = props;

  return (
    <PageHeader
      title={subject}
      subtitle={`${folderCount} ta to'plam · ${totalQuestions} savol`}
      onBack={onBack}
      compact
      stats={[
        { icon: BookOpen, label: "To'plamlar", value: folderCount },
        { icon: Layers, label: "Savollar", value: totalQuestions },
        { icon: Target, label: "O'zlashtirish", value: `${masteryPercent}%` },
        { icon: BarChart3, label: "Holat", value: masteryPercent >= 60 ? "Yaxshi" : "Davom" },
      ]}
      tabs={categories}
      activeTab={activeCategory}
      onTabChange={onCategoryChange}
    />
  );
}
