"use client";

import Link from "next/link";
import { Activity, Brain, Shield, ArrowRight, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-48 md:pb-32 bg-slate-50">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-700 text-sm font-semibold mb-8 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              AI-Powered Disease Prediction
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
              Predict Diseases
              <span className="block bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                Before Symptoms Become Serious
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed">
              RAXA AI helps users identify potential chronic and infectious
              diseases using clinical data, symptoms, AI analysis, and adaptive
              screening workflows.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <Link href="/adaptive-screening">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl flex items-center gap-3 text-lg"
                >
                  <Brain className="h-6 w-6" />
                  Start Smart Screening
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>

              <Link href="/multi-disease">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-800 font-bold rounded-2xl flex items-center gap-3 text-lg"
                >
                  <Activity className="h-6 w-6" />
                  Full Disease Assessment
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Card 1 */}
          <motion.div
            whileHover={{ translateY: -8 }}
            className="bg-white rounded-3xl p-10 shadow-lg border border-slate-100"
          >
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-8">
              <Brain className="h-8 w-8 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Explainable AI
            </h3>

            <p className="text-slate-500 leading-relaxed">
              Understand why the AI predicts a disease with confidence scoring,
              clinical reasoning, and symptom mapping.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ translateY: -8 }}
            className="bg-white rounded-3xl p-10 shadow-lg border border-slate-100"
          >
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-8">
              <Heart className="h-8 w-8 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Multi-Disease Detection
            </h3>

            <p className="text-slate-500 leading-relaxed">
              Screen for 25+ common diseases including diabetes, dengue,
              hypertension, malaria, heart disease, thyroid disorders, and more.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ translateY: -8 }}
            className="bg-white rounded-3xl p-10 shadow-lg border border-slate-100"
          >
            <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center mb-8">
              <Shield className="h-8 w-8 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Secure & Private
            </h3>

            <p className="text-slate-500 leading-relaxed">
              Your health data remains protected with encrypted workflows and
              secure healthcare-oriented architecture.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white text-center shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Start Your Health Analysis
          </h2>

          <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            AI-powered disease prediction and intelligent clinical analysis for
            early healthcare insights.
          </p>

          <Link href="/adaptive-screening">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 bg-white text-slate-900 font-black rounded-2xl shadow-xl text-lg"
            >
              Start Screening
            </motion.button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-10 text-center text-slate-500 text-sm">
        <p>
          © 2026 RAXA AI — AI-Powered Early Disease Detection Platform
        </p>

        <p className="mt-3 max-w-3xl mx-auto text-xs text-slate-400 leading-relaxed px-4">
          Medical Disclaimer: RAXA AI is designed for educational and early
          screening assistance only. It is not a substitute for professional
          medical advice, diagnosis, or treatment.
        </p>
      </footer>
    </div>
  );
}