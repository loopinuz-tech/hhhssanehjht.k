import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import { useThemeCustomizer } from "@/components/ThemeCustomizerProvider";

const PublicLayout = () => {
  const location = useLocation();
  const { contentWidth, navbarType } = useThemeCustomizer();

  const isTestSession = (location.pathname.includes("/tests/builder/") && location.pathname.endsWith("/take")) || (location.pathname === "/tests/builder" && location.search.includes("testId="));
  const isAIGenerate = location.pathname === "/tests/contributor/ai-generate";

  const isFloating = navbarType === "floating";
  const ptClass = navbarType === "hidden" ? "" : isFloating ? "pt-20" : "pt-[48px] sm:pt-[56px]";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050B10]">
      {!isTestSession && !isAIGenerate && <TopBar />}

      <main className={`${isTestSession || isAIGenerate ? "w-full" : `${ptClass} w-full ${contentWidth === "boxed" ? "max-w-[1200px] mx-auto" : ""}`}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
