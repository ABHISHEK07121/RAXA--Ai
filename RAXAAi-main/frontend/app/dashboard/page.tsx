"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Activity, Heart, Download } from "lucide-react";
import { motion } from "framer-motion";
import MedicalTwin from "../components/MedicalTwin";
import ExplainabilityPanel from "../components/ExplainabilityPanel";
import { useLanguage } from "../context/LanguageContext";
import { getFollowUp } from "../utils/followUp";
import { getBackendBaseUrl } from "../../utils/apiBase";

interface DashboardResult {
  diabetes_risk: number;
  hypertension_risk: number;
  overall_risk: "High" | "Medium" | "Low";
  prevention_advice: string[];
  explanations?: {
    diabetes_factors?: Array<{
      feature: string;
      impact: string;
      contribution_score: number;
    }>;
    hypertension_factors?: Array<{
      feature: string;
      impact: string;
      contribution_score: number;
    }>;
  };
}

type DashboardInputs = Record<string, string | number>;

export default function Dashboard() {
  const { t } = useLanguage();
  const [result, setResult] = useState<DashboardResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [inputData, setInputData] = useState<DashboardInputs | null>(null);
  const backendBaseUrl = getBackendBaseUrl();

  useEffect(() => {
    // Retrieve from local storage
    const stored = localStorage.getItem("raxa_result");
    const inputs = localStorage.getItem("raxa_inputs");
    if (stored) {
      setResult(JSON.parse(stored));
    }
    if (inputs) {
      setInputData(JSON.parse(inputs));
    }
  }, []);

  const downloadReport = async () => {
    if (!result) {
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(
        `${backendBaseUrl}/generate-report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputs: inputData || {},
            diabetes_risk: Math.round(result.diabetes_risk * 100),
            hypertension_risk: Math.round(result.hypertension_risk * 100),
            overall_risk: result.overall_risk,
            advice: result.prevention_advice,
          }),
        },
      );

      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RAXA_Health_Report_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!result)
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            {t["no_data_title"] || "No assessment data found"}
          </h2>
          <p className="text-slate-600 mb-6">{t["no_data_desc"] || "Please complete a screening first."}</p>
          <a href="/assessment" className="text-emerald-600 underline">
            {t["go_to_assessment"]}
          </a>
        </div>
      </div>
    );

  const riskColor =
    result.overall_risk === "High"
      ? "bg-red-500"
      : result.overall_risk === "Medium"
        ? "bg-yellow-500"
        : "bg-emerald-500";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-50"
    >
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          {t["result_title"]}
        </h1>

        {/* TOP SUMMARY CARD */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
          >
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {t["overall_risk_label"]}
            </h2>
            <div className="flex items-center gap-4">
              <div className={`h-16 w-3 rounded-full ${riskColor}`}></div>
              <div>
                <span
                  className={`text-4xl font-extrabold ${
                    result.overall_risk === "High"
                      ? "text-red-900"
                      : result.overall_risk === "Medium"
                        ? "text-yellow-700"
                        : "text-emerald-900"
                  }`}
                >
                  {result.overall_risk} Risk
                </span>
                <p className="text-slate-600 mt-1">{t["ai_inference_note"]}</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center"
            >
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <Activity className="h-5 w-5" />{" "}
                <span className="font-semibold">{t["diabetes_label"] || "Diabetes"}</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {(result.diabetes_risk * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400">{t["prob_score"]}</div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center"
            >
              <div className="flex items-center gap-2 mb-2 text-rose-600">
                <Heart className="h-5 w-5" />{" "}
                <span className="font-semibold">{t["hypertension_label"] || "Hypertension"}</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {(result.hypertension_risk * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400">{t["prob_score"]}</div>
            </motion.div>
          </div>
        </div>

        {/* 3D MEDICAL TWIN */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <MedicalTwin riskLevel={result.overall_risk} />
        </motion.div>

        {/* EXPLAINABILITY PANEL - NEW! */}
        {result.explanations && (
          <ExplainabilityPanel explanations={result.explanations} />
        )}

        {/* DOWNLOAD REPORT BUTTON */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                📄 {t["download_title"]}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {t["download_desc"]}
              </p>
            </div>
            <motion.button
              onClick={downloadReport}
              disabled={isDownloading}
              whileHover={{ scale: isDownloading ? 1 : 1.05 }}
              whileTap={{ scale: isDownloading ? 1 : 0.95 }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                isDownloading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
              }`}
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t["generating_btn"] || "Generating..."}
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  {t["download_btn"]}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* RECOMMENDATIONS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-12"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6">
            {t["prevention_title"]}
          </h3>
          <div className="space-y-4">
            {result.prevention_advice.map((tip: string, i: number) => (
              <div
                key={i}
                className="flex gap-4 items-start p-4 bg-slate-50 rounded-xl"
              >
                <div className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-slate-700 pt-1 font-medium">{tip}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* NEXT STEPS / FOLLOW-UP CARD (TIER 2 FEATURE) */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-12"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              {t["next_steps"]}
            </h3>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <p className="text-slate-600 mb-1 font-medium">
                  📅 {t["follow_up_label"]}
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {getFollowUp(result.overall_risk).followUpDate}
                </p>
                <p className="text-slate-700 mt-2">
                  {t[getFollowUp(result.overall_risk).messageKey]}
                </p>
              </div>

              <button
                onClick={() => {
                  alert(
                    `✅ SMS Sent to Patient!\n\n"RAXA Alert: Your health screening is complete. Follow-up recommended by ${getFollowUp(result.overall_risk).followUpDate}. View report: raxa.ai/r/${Math.floor(Math.random() * 10000)}"`,
                  );
                }}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 self-start hover:bg-blue-100 transition-colors"
              >
                <span>📲 {t["send_sms_btn"] || "Send Result via SMS"}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* TRUST & ETHICS FOOTER */}
        <div className="border-t border-slate-200 pt-8 text-center text-slate-500 text-sm pb-20">
          <div className="flex justify-center gap-6 mb-4">
            <span>🔒 {t["footer_privacy"]}</span>
            <span>⚖️ {t["footer_logic"]}</span>
            <span>🛡️ {t["footer_secure"]}</span>
          </div>
          <p className="max-w-2xl mx-auto">
            ⚠️ <strong>{t["footer_disclaimer_title"]}</strong>{" "}
            {t["footer_disclaimer_text"]}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
