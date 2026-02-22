"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { RulesContent } from "@/components/rules/RulesContent";

interface RulesModalProps {
  onClose: () => void;
}

export function RulesModal({ onClose }: RulesModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/80 px-3 py-4 sm:px-6 sm:py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <RulesContent mode="modal" onClose={onClose} />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
