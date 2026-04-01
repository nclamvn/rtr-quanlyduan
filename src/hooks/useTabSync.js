import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TAB_ROUTES, PATH_TO_TAB } from "../router";

/**
 * Syncs React Router location with the legacy tab state.
 * - On mount: reads URL path → sets tab
 * - On tab change: navigates to the corresponding URL
 */
export function useTabSync(tab, setTab) {
  const location = useLocation();
  const navigate = useNavigate();

  // URL → tab (on mount and browser back/forward)
  useEffect(() => {
    const tabFromPath = PATH_TO_TAB[location.pathname];
    if (tabFromPath) {
      setTab((prev) => (prev !== tabFromPath ? tabFromPath : prev));
    }
  }, [location.pathname, setTab]);

  // tab → URL (when tab changes via code)
  useEffect(() => {
    const expectedPath = TAB_ROUTES[tab];
    if (expectedPath && location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: false });
    }
  }, [tab, navigate, location.pathname]);
}
