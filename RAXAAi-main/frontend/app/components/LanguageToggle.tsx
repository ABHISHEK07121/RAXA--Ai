"use client";

import { Languages } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageToggle() {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <motion.button
      onClick={toggleLanguage}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex h-12 items-center gap-2 rounded-xl border-2 border-emerald-600 px-4 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-50"
      title="Switch Language"
      aria-label="Switch language"
    >
      <Languages className="h-4 w-4" />
      <span>{lang === "en" ? "\u0939\u093f\u0902\u0926\u0940" : "EN"}</span>
    </motion.button>
  );
}
