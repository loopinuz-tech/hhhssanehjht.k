import { createRoot } from "react-dom/client";
import "@lottiefiles/dotlottie-wc";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initDataFast } from 'datafast';

initDataFast({
  websiteId: 'dfid_PXTAEEROB92zPTMZXpVjZ',
}).catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
