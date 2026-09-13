import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useTheme } from "next-themes";

type Skin = "light" | "bordered" | "dark" | "semi-dark";
type ContentWidth = "full" | "boxed";
type NavbarType = "floating" | "sticky" | "static" | "hidden";
type FooterType = "sticky" | "static" | "hidden";

interface ThemeCustomizerState {
  skin: Skin;
  contentWidth: ContentWidth;
  navbarColor: string;
  navbarType: NavbarType;
  footerType: FooterType;
  menuCollapsed: boolean;
  menuHidden: boolean;
  isNavbarDark: boolean;
  setSkin: (s: Skin) => void;
  setContentWidth: (w: ContentWidth) => void;
  setNavbarColor: (c: string) => void;
  setNavbarType: (t: NavbarType) => void;
  setFooterType: (t: FooterType) => void;
  setMenuCollapsed: (v: boolean) => void;
  setMenuHidden: (v: boolean) => void;
}

const defaults: ThemeCustomizerState = {
  skin: "light",
  contentWidth: "full",
  navbarColor: "#FFFFFF",
  navbarType: "sticky",
  footerType: "hidden",
  menuCollapsed: false,
  menuHidden: false,
  isNavbarDark: false,
  setSkin: () => {},
  setContentWidth: () => {},
  setNavbarColor: () => {},
  setNavbarType: () => {},
  setFooterType: () => {},
  setMenuCollapsed: () => {},
  setMenuHidden: () => {},
};

const ThemeCustomizerContext = createContext<ThemeCustomizerState>(defaults);

export const useThemeCustomizer = () => useContext(ThemeCustomizerContext);

const STORAGE_KEY = "ec-theme-customizer";

function loadState(): Partial<ThemeCustomizerState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function hexToRgb(hex: string): string {
  const cleanHex = hex.startsWith("#") ? hex : "#FFFFFF";
  const r = parseInt(cleanHex.slice(1, 3), 16) || 255;
  const g = parseInt(cleanHex.slice(3, 5), 16) || 255;
  const b = parseInt(cleanHex.slice(5, 7), 16) || 255;
  return `${r}, ${g}, ${b}`;
}

export function ThemeCustomizerProvider({ children }: { children: ReactNode }) {
  const saved = loadState();
  const { setTheme } = useTheme();

  const [skin, setSkinState] = useState<Skin>(saved.skin || "light");
  const [contentWidth, setContentWidthState] = useState<ContentWidth>(saved.contentWidth || "full");
  const [navbarColor, setNavbarColorState] = useState<string>(
    saved.navbarColor && saved.navbarColor !== "#C8001A" && saved.navbarColor !== "#181e29" && saved.navbarColor !== "#1e293b" && saved.navbarColor !== "#0f172a"
      ? saved.navbarColor
      : "#FFFFFF"
  );
  const [navbarType, setNavbarTypeState] = useState<NavbarType>(saved.navbarType || "sticky");
  const [footerType, setFooterTypeState] = useState<FooterType>(saved.footerType || "hidden");
  const [menuCollapsed, setMenuCollapsedState] = useState(saved.menuCollapsed || false);
  const [menuHidden, setMenuHiddenState] = useState(saved.menuHidden || false);

  const isNavbarDark = (() => {
    const c = navbarColor.startsWith("#") ? navbarColor : "#FFFFFF";
    const r = parseInt(c.slice(1, 3), 16) || 255;
    const g = parseInt(c.slice(3, 5), 16) || 255;
    const b = parseInt(c.slice(5, 7), 16) || 255;
    return r * 0.299 + g * 0.587 + b * 0.114 < 150;
  })();

  // Persist to localStorage
  useEffect(() => {
    const state = { skin, contentWidth, navbarColor, navbarType, footerType, menuCollapsed, menuHidden };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [skin, contentWidth, navbarColor, navbarType, footerType, menuCollapsed, menuHidden]);

  // Apply skin → theme + border
  const setSkin = (s: Skin) => {
    setSkinState(s);
    if (s === "dark" || s === "semi-dark") setTheme("dark");
    else setTheme("light");

    const root = document.documentElement;
    root.classList.remove("skin-bordered", "skin-semi-dark");
    if (s === "bordered") root.classList.add("skin-bordered");
    if (s === "semi-dark") root.classList.add("skin-semi-dark");
  };

  // Apply navbar color as CSS variable
  useEffect(() => {
    const root = document.documentElement;
    const c = navbarColor.startsWith("#") ? navbarColor : "#FFFFFF";
    root.style.setProperty("--navbar-color", c);
    root.style.setProperty("--navbar-color-rgb", hexToRgb(c));
    // Auto text color: white for dark colors, dark for light colors
    const brightness = (parseInt(c.slice(1, 3), 16) || 255) * 0.299
      + (parseInt(c.slice(3, 5), 16) || 255) * 0.587
      + (parseInt(c.slice(5, 7), 16) || 255) * 0.114;
    root.style.setProperty("--navbar-text", brightness < 150 ? "#FFFFFF" : "#111111");
    root.style.setProperty("--navbar-border", brightness < 150 ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)");
  }, [navbarColor]);

  // Apply content width
  useEffect(() => {
    document.documentElement.setAttribute("data-content-width", contentWidth);
  }, [contentWidth]);

  return (
    <ThemeCustomizerContext.Provider value={{
      skin, contentWidth, navbarColor, navbarType, footerType, menuCollapsed, menuHidden, isNavbarDark,
      setSkin,
      setContentWidth: setContentWidthState,
      setNavbarColor: setNavbarColorState,
      setNavbarType: setNavbarTypeState,
      setFooterType: setFooterTypeState,
      setMenuCollapsed: setMenuCollapsedState,
      setMenuHidden: setMenuHiddenState,
    }}>
      {children}
    </ThemeCustomizerContext.Provider>
  );
}
