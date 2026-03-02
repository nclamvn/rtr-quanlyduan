import { useState, useRef, useEffect } from "react";
import { ResponsiveContainer } from "recharts";

/**
 * Drop-in replacement for Recharts ResponsiveContainer.
 * Defers rendering of children until the container has been measured
 * by the browser, eliminating "width(-1) height(-1)" console warnings
 * that occur when charts render before layout (e.g. hidden tabs, initial paint).
 */
export default function SafeResponsiveContainer({ children, ...props }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if already has valid dimensions
    const { width, height } = el.getBoundingClientRect();
    if (width > 0 && height > 0) {
      setReady(true);
      return;
    }

    // Wait for valid dimensions via ResizeObserver
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          setReady(true);
          ro.disconnect();
          break;
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: props.width || "100%", height: props.height || "100%", minWidth: 0, minHeight: 0 }}>
      {ready ? (
        <ResponsiveContainer {...props} minWidth={0} minHeight={0}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
