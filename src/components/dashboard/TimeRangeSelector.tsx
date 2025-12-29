"use client";

import { useQueryStates, parseAsIsoDateTime, parseAsStringEnum } from "nuqs";
import { Calendar, X } from "lucide-react";
import { TimeRange, getTimeRangeFromParams, formatTimeRange } from "@/lib/url-params";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "now-6h", label: "Last 6 hours" },
  { value: "now-12h", label: "Last 12 hours" },
  { value: "now-24h", label: "Last 24 hours" },
  { value: "now-7d", label: "Last 7 days" },
  { value: "now-30d", label: "Last 30 days" },
  { value: "now-90d", label: "Last 90 days" },
  { value: "now-1y", label: "Last year" },
];

export default function TimeRangeSelector() {
  const [params, setParams] = useQueryStates({
    from: parseAsIsoDateTime,
    to: parseAsIsoDateTime,
    range: parseAsStringEnum<TimeRange>([
      "now-6h",
      "now-12h",
      "now-24h",
      "now-7d",
      "now-30d",
      "now-90d",
      "now-1y",
    ]),
  });

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { from, to } = getTimeRangeFromParams(params.range || undefined, params.from || undefined, params.to || undefined);

  const handleRangeSelect = (range: TimeRange) => {
    setParams({ range, from: null, to: null });
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setParams({ range: null, from: null, to: null });
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isFiltered = params.range || params.from || params.to;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
          isFiltered
            ? "bg-orange-600 border-orange-600 text-white"
            : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        )}
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">{formatTimeRange(from, to)}</span>
        {isFiltered && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              handleClearFilter();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                handleClearFilter();
              }
            }}
            className="ml-1 hover:bg-orange-700 rounded p-0.5 inline-flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-1001">
          <div className="p-2 space-y-1">
            <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Quick Ranges
            </div>
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => handleRangeSelect(range.value)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                  params.range === range.value
                    ? "bg-orange-600 text-white"
                    : "text-zinc-300 hover:bg-zinc-800"
                )}
              >
                {range.label}
              </button>
            ))}

            {isFiltered && (
              <>
                <div className="border-t border-zinc-800 my-2" />
                <button
                  onClick={handleClearFilter}
                  className="w-full text-left px-3 py-2 rounded text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                >
                  Clear Filter
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
