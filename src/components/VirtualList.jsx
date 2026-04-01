import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * Generic virtual scrolling wrapper.
 * Renders only visible items for performance with large lists.
 *
 * Props:
 *   items: array of data items
 *   renderItem: (item, index, virtualRow) => JSX
 *   estimateSize: estimated row height in px (default 60)
 *   maxHeight: container max height (default "calc(100vh - 300px)")
 *   overscan: number of items to render outside viewport (default 5)
 *   gap: gap between items in px (default 0)
 */
export default function VirtualList({
  items,
  renderItem,
  estimateSize = 60,
  maxHeight = "calc(100vh - 300px)",
  overscan = 5,
  gap = 0,
}) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    gap,
  });

  if (items.length === 0) return null;

  // For small lists (<50 items), render normally without virtualization
  if (items.length < 50) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap }}>
        {items.map((item, index) => (
          <div key={index}>{renderItem(item, index, null)}</div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      style={{
        maxHeight,
        overflow: "auto",
        contain: "strict",
      }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index, virtualRow)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Virtual grid for Kanban-style columns.
 */
export function VirtualColumn({
  items,
  renderItem,
  estimateSize = 80,
  maxHeight = "calc(100vh - 320px)",
  overscan = 3,
}) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  if (items.length < 30) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", maxHeight, padding: 8 }}>
        {items.map((item, i) => (
          <div key={i}>{renderItem(item, i)}</div>
        ))}
      </div>
    );
  }

  return (
    <div ref={parentRef} style={{ overflowY: "auto", maxHeight, padding: 8 }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((vr) => (
          <div
            key={vr.key}
            ref={virtualizer.measureElement}
            data-index={vr.index}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vr.start}px)` }}
          >
            {renderItem(items[vr.index], vr.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
