"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

/**
 * 전역 로딩 인디케이터
 */
export default function GlobalLoading() {
  const { isGlobalLoading, loadingMessage } = useUIStore();

  return (
    <AnimatePresence>
      {isGlobalLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-slate-800 rounded-xl p-8 shadow-2xl border border-slate-600 flex flex-col items-center gap-4"
          >
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
            {loadingMessage && (
              <p className="text-slate-300 text-lg font-medium">
                {loadingMessage}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

