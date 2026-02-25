import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { isSupabaseConnected } from "../lib/supabase";
import { logAudit, fetchAuditLogs, clearAuditLogs, exportAuditCSV } from "../services/auditService";

const STORAGE_KEY = "rtr_audit_log";
const MAX_ENTRIES = 500;

const AuditContext = createContext(null);

function loadLogs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    const trimmed = logs.slice(0, Math.floor(MAX_ENTRIES / 2));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
}

let logCounter = 0;

export function AuditProvider({ children }) {
  const [logs, setLogs] = useState(loadLogs);
  const { user } = useAuth();
  const online = isSupabaseConnected();

  // On mount: if online, fetch audit logs from Supabase
  useEffect(() => {
    if (online) {
      fetchAuditLogs().then(({ data }) => {
        if (data?.length) {
          // Transform Supabase rows → local shape
          const transformed = data.map(row => ({
            id: row.id,
            timestamp: row.created_at,
            userId: row.user_id,
            userName: row.user_name,
            userRole: row.user_role,
            action: row.action,
            entityType: row.entity_type,
            entityId: row.entity_id,
            entityTitle: row.entity_title,
            oldValue: row.old_value,
            newValue: row.new_value,
            metadata: row.metadata || {},
          }));
          setLogs(transformed);
        }
      });
    }
  }, [online]);

  // Persist to localStorage (always, as backup)
  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  const log = useCallback((action, entityType, entityId, entityTitle, oldValue = null, newValue = null, metadata = {}) => {
    const asUser = metadata._asUser;
    const entry = {
      id: `AUD-${Date.now()}-${++logCounter}`,
      timestamp: new Date().toISOString(),
      userId: asUser?.id || user?.id || "system",
      userName: asUser?.name || user?.name || "System",
      userRole: asUser?.role || user?.role || "system",
      action,
      entityType,
      entityId,
      entityTitle,
      oldValue,
      newValue,
      metadata,
    };

    // Local state update (optimistic)
    setLogs((prev) => {
      const next = [entry, ...prev];
      return next.length > MAX_ENTRIES ? next.slice(0, MAX_ENTRIES) : next;
    });

    // Persist to Supabase (fire & forget)
    logAudit(entry);

    return entry;
  }, [user]);

  const getLogs = useCallback((filters = {}) => {
    let result = logs;
    if (filters.action) result = result.filter((l) => l.action === filters.action);
    if (filters.userId) result = result.filter((l) => l.userId === filters.userId);
    if (filters.entityType) result = result.filter((l) => l.entityType === filters.entityType);
    if (filters.entityId) result = result.filter((l) => l.entityId === filters.entityId);
    return result;
  }, [logs]);

  const getLogsByEntity = useCallback((entityType, entityId) => {
    return logs.filter((l) => l.entityType === entityType && l.entityId === entityId);
  }, [logs]);

  const getLogsByUser = useCallback((userId) => {
    return logs.filter((l) => l.userId === userId);
  }, [logs]);

  const exportCSV = useCallback(() => {
    return exportAuditCSV(logs);
  }, [logs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    clearAuditLogs();
  }, []);

  return (
    <AuditContext.Provider value={{ logs, log, getLogs, getLogsByEntity, getLogsByUser, exportCSV, clearLogs }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAuditLog() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAuditLog must be used within AuditProvider");
  return ctx;
}
