/**
 * useCaseData.js – Custom hook: fetch a case from MongoDB by ID.
 *
 * Falls back to localStorage if the backend is unreachable.
 */
import { useEffect, useState } from "react";
import { getCaseById, saveCase } from "../services/api";

export function useCaseData(id) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCaseById(id);
        if (!cancelled) setCaseData(data);
      } catch (err) {
        // Fallback: try localStorage
        try {
          const local = JSON.parse(localStorage.getItem("ai_border_cases") || "[]");
          const found = local.find((c) => c.id === id);
          if (found && !cancelled) {
            setCaseData(found);
          } else if (!cancelled) {
            setError(err.message);
          }
        } catch {
          if (!cancelled) setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  return { caseData, loading, error };
}
