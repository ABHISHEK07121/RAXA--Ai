"use client";
import Link from "next/link";
import { Activity, Brain, Shield, ArrowRight, Heart } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "./components/Navbar";
import { useLanguage } from "./context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-48 md:pb-32 bg-slate-50">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-medical-teal/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            {/* Small Label */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 text-sm font-semibold mb-8 shadow-sm backdrop-blur-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
              {t.hero_badge || "AI-Powered Diagnostics"}
            </motion.div>

            {/* BIG HEADLINE */}
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
              {t.hero_title || "Predict Chronic Diseases"}
              <span className="block text-gradient">
                {t.hero_subtitle || "Before Symptoms Appear"}
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              {t.hero_desc || "AI-powered personalized screening for early detection. Fast, accurate, and designed for proactive health management."}
            </p>

            {/* CTA BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <Link href="/adaptive-screening">
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 flex items-center gap-3 text-lg transition-all"
                >
                  <Brain className="h-6 w-6" />
                  {t.nav_smart_screening || "Smart Screening"}
                  <ArrowRight className="h-5 w-5 opacity-70" />
                </motion.button>
              </Link>

              <Link href="/multi-disease">
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-800 font-bold rounded-2xl flex items-center gap-3 text-lg transition-all hover:border-primary hover:text-primary"
                >
                  <Activity className="h-6 w-6" />
                  {t.nav_full_assessment || "Full Assessment"}
                </motion.button>
              </Link>
            </div>

            {/* Floating Icons (Animated) */}
            <div className="absolute top-20 left-10 md:left-20 animate-bounce transition-all duration-1000 hidden md:block opacity-40">
              <div className="p-4 bg-white rounded-2xl shadow-premium border border-slate-100">
                <Heart className="h-8 w-8 text-rose-500" />
              </div>
            </div>
            <div className="absolute bottom-20 right-10 md:right-20 animate-pulse transition-all duration-1000 hidden md:block opacity-40">
              <div className="p-4 bg-white rounded-2xl shadow-premium border border-slate-100">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-3 gap-10"
        >
          {/* Card 1: Explainable AI */}
          <motion.div
            whileHover={{ translateY: -8 }}
            className="premium-card p-10 group"
          >
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:bg-primary transition-colors">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              {t.feature_1_title || "Explainable AI"}
            </h3>
            <p className="text-slate-500 leading-relaxed">
              {t.feature_1_desc || "Understand the 'Why' behind every prediction with our clinical reasoning engine."}
            </p>
          </motion.div>

          {/* Card 2: Multi-Disease Scan */}
          <motion.div
            whileHover={{ translateY: -8 }}
            className="premium-card p-10 group"
          >
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:bg-medical-teal transition-colors">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              {t.feature_2_title || "Multi-Disease Scan"}
            </h3>
            <p className="text-slate-500 leading-relaxed">
              {t.feature_2_desc || "Simultaneously screen for 25+ chronic and infectious diseases in one session."}
            </p>
          </motion.div>

          {/* Card 3: Privacy First */}
          <motion.div
            whileHover={{ translateY: -8 }}
            className="premium-card p-10 group"
          >
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:bg-accent transition-colors">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              {t.feature_3_title || "Privacy First"}
            </h3>
            <p className="text-slate-500 leading-relaxed">
              {t.feature_3_desc || "Your health data is processed securely and never stored without your explicit consent."}
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER CTA */}
      <section className="max-w-7xl mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white shadow-2xl relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          
          <h2 className="text-4xl md:text-5xl font-black mb-6 relative z-10">
            {t.footer_cta_title || "Ready to prioritize your health?"}
          </h2>
          <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">
            {t.footer_cta_desc || "Join thousands of users who trust RAXA for early disease detection and personalized health insights."}
          </p>
          <Link href="/adaptive-screening" className="relative z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 bg-white text-slate-900 font-black rounded-2xl shadow-xl text-lg hover:bg-primary hover:text-white transition-all"
            >
              {t.nav_smart_screening || "Start Smart Screening"}
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* DISCLAIMER & TRUST */}
      <footer className="max-w-7xl mx-auto px-4 py-16 border-t border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="max-w-2xl">
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              <span className="font-bold text-slate-600 block mb-1">Medical Disclaimer:</span>
              {t.disclaimer || "RAXA is an AI-powered screening tool designed to assist in early detection and health monitoring. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition."}
            </p>
            <p className="text-xs text-slate-300">
              © 2026 RAXA AI. Data privacy is our priority. Your clinical data is encrypted and secure. 🔒
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center opacity-50">
              <Shield className="h-6 w-6 text-slate-400 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Secure</span>
            </div>
            <div className="flex flex-col items-center opacity-50">
              <Activity className="h-6 w-6 text-slate-400 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clinical</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
