import React, { useRef, useState } from "react";

export function ResizableTh({ header, idx, sortField, sortDirection, handleSort }: any) {
  const [width, setWidth] = useState<number | undefined>(undefined);
  const thRef = useRef<HTMLTableCellElement>(null);
  const isSortable = ["Description", "Short URL", "Destination URL", "Campaign", "Total Clicks", "Created At"].includes(header);
  const fieldMap: Record<string, string> = {
    "Description": "description",
    "Short URL": "shorturl",
    "Destination URL": "longurl",
    "Campaign": "campaign",
    "Total Clicks": "clicks",
    "Created At": "createdAt"
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = thRef.current ? thRef.current.offsetWidth : 0;
    function onMouseMove(ev: MouseEvent) {
      setWidth(Math.max(80, startWidth + (ev.clientX - startX)));
    }
    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <th
      ref={thRef}
      style={width ? { width } : undefined}
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 relative group"
      onClick={isSortable ? () => handleSort(fieldMap[header]) : undefined}
    >
      <span className="select-none">
        {header}
        {isSortable && sortField === fieldMap[header] && (
          <span className="ml-1 text-blue-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
      <span
        className="absolute right-0 top-0 h-full w-2 cursor-col-resize group-hover:bg-blue-200"
        onMouseDown={onMouseDown}
        style={{ zIndex: 10 }}
      />
    </th>
  );
}