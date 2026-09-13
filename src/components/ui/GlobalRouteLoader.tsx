import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageLoader from "./PageLoader";

const GlobalRouteLoader = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show loader on route change
    setIsVisible(true);
    
    // Hide after 0.5 seconds for a snappy "academic" transition
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return <PageLoader isVisible={isVisible} />;
};

export default GlobalRouteLoader;
