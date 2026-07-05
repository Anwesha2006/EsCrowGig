import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { analytics } from "../lib/analytics";

export const PageTracker = () => {
  const location = useLocation();
  useEffect(() => {
    analytics.pageViewed(location.pathname);
  }, [location.pathname]);
  return null;
};
