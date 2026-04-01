// ═══════════════════════════════════════════════════════════
// RtR Control Tower — useAIAdvisor React Hook
// Lazy-loads AI advisory when issue is selected
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAIAdvisory } from "../services/aiAdvisorService";

export function useAIAdvisor(issue, context, lang = "vi") {
  const [advisory, setAdvisory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  const load = useCallback(async () => {
    if (!issue?.id) {
      setAdvisory(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      const result = await fetchAIAdvisory(issue, context, lang);
      if (abortRef.current) return;

      if (result?.error) {
        setError(result.error);
        setAdvisory(null);
      } else {
        setAdvisory(result);
        setError(null);
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(err.message);
        setAdvisory(null);
      }
    }

    if (!abortRef.current) setIsLoading(false);
  }, [issue?.id, issue?.status, issue?.sev, issue?.updates?.length, lang]);

  // Auto-fetch when issue changes
  useEffect(() => {
    if (issue?.id) {
      load();
    } else {
      setAdvisory(null);
      setError(null);
    }
    return () => {
      abortRef.current = true;
    };
  }, [issue?.id, load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { advisory, isLoading, error, refresh };
}
