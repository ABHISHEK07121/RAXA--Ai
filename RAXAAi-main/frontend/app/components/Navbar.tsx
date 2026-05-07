"use client";
import Image from "next/image";
import Link from "next/link";
import { Bot, Brain, ClipboardList, FileText, Home, Stethoscope } from "lucide-react";
import LanguageToggle from "./LanguageToggle";
import { useChat } from "../context/ChatContext";
import { useLanguage } from "../context/LanguageContext";
import { motion } from "framer-motion";

export default function Navbar() {
  const { toggleChat } = useChat();
  const { t } = useLanguage();
  const navItems = [
    { href: "/", label: t.nav_home || "Home", icon: Home },
    {
      href: "/multi-disease",
      label: t.nav_detailed_screening || "Detailed Screening",
      icon: ClipboardList,
    },
    {
      href: "/adaptive-screening",
      label: t.nav_smart_screening || "Smart Screening",
      icon: Brain,
    },
    {
      href: "/health-report",
      label: t.nav_health_report || "Health Report",
      icon: FileText,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-6">
          <div className="flex shrink-0 items-center gap-4">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-slate-100 shadow-premium transition-transform group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="RAXA Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 whitespace-nowrap text-2xl font-black tracking-tight text-slate-900">
                  Raxa
                  <span className="text-white text-[10px] font-bold bg-slate-900 px-2 py-0.5 rounded-full">
                    AI
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                  {t.nav_subtitle || "Health Intelligence"}
                </p>
              </div>
            </Link>
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-5 xl:flex 2xl:gap-8">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex h-11 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-primary"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <LanguageToggle />

            <motion.button
              type="button"
              onClick={toggleChat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group flex h-12 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white shadow-premium transition-all hover:bg-primary"
            >
              <Bot className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              {t.nav_ask_ai || "Ask AI"}
            </motion.button>

            <Link
              href="/adaptive-screening"
              className="hidden h-12 items-center gap-2 rounded-xl bg-primary/10 px-6 text-sm font-black text-primary transition-all hover:bg-primary hover:text-white md:flex"
            >
              <Stethoscope className="h-4 w-4" />
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
