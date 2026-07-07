"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Download, FileText } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { GeneratedContent } from "@/types";
import { cn } from "@/lib/utils";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,3}\s/, "")
    .trim();
}

function cleanTitle(title: string): string {
  // Extract just the heading part before " - " or ":"
  const stripped = stripMarkdown(title);
  const dashIdx = stripped.indexOf(" - ");
  return dashIdx > 0 ? stripped.slice(0, dashIdx).trim() : stripped;
}

function renderInline(text: string, key: number) {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return (
    <span key={key}>
      {parts.map((part, i) =>
        /^\*\*.+\*\*$/.test(part)
          ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
          : part
      )}
    </span>
  );
}

function ContentCard({ item, index }: { item: GeneratedContent; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border border-white/8 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        aria-expanded={open}
        aria-controls={`content-${index}`}
      >
        <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-400 text-[10px] leading-none">✓</span>
        </span>
        <span className="flex-1 text-xs font-medium text-slate-200 truncate">{cleanTitle(item.title ?? "")}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-slate-500 transition-transform flex-shrink-0",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`content-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
              {(item.content ?? item.output ?? "").split(/\n+/).map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                if (/^#{1,3}\s/.test(trimmed))
                  return <p key={i} className="text-xs font-semibold text-white mt-2">{renderInline(trimmed.replace(/^#{1,3}\s/, ""), i)}</p>;
                if (/^[-*•]\s/.test(trimmed))
                  return (
                    <div key={i} className="flex gap-2">
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span>
                      <span className="text-xs text-slate-300 leading-relaxed break-words">{renderInline(trimmed.replace(/^[-*•]\s/, ""), i)}</span>
                    </div>
                  );
                if (/^\*\*.+\*\*/.test(trimmed))
                  return <p key={i} className="text-xs font-semibold text-white mt-2">{renderInline(trimmed, i)}</p>;
                return <p key={i} className="text-xs text-slate-300 leading-relaxed break-words">{renderInline(trimmed, i)}</p>;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ResultSection({
  generatedContent,
  documentUrl,
}: {
  generatedContent: GeneratedContent[];
  documentUrl: string | null;
}) {
  // Validate URL before rendering the download link
  const safeDocumentUrl = (() => {
    if (!documentUrl) return null;
    try {
      const url = new URL(documentUrl);
      return url.protocol === "https:" || url.protocol === "http:"
        ? documentUrl
        : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="space-y-4">
      {/* Download */}
      {safeDocumentUrl && (
        <GlassCard className="p-5" glow="green">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-green-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Report Ready</p>
              <p className="text-xs text-slate-400">Your document has been generated</p>
            </div>
          </div>
          <a
            href={safeDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/50"
            aria-label="Download Final Report"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Download Final Report
          </a>
        </GlassCard>
      )}

      {/* Generated Content */}
      {generatedContent.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Generated Content
          </h3>
          <div className="space-y-2">
            {generatedContent.map((item, i) => (
              // Use title as key — stable identity, not array index
              <ContentCard key={item.title ?? i} item={item} index={i} />
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
