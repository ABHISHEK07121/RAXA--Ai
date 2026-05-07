"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  DownloadCloud,
  ShieldCheck,
  Sparkles,
  FileText,
  HeartPulse,
  Thermometer,
  AlertCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { HealthReportData, loadHealthReport } from "../utils/reportStorage";

const sampleReport: HealthReportData = {
  source: "sample",
  title: "Example Health Report",
  generatedAt: "2026-01-01T00:00:00.000Z",
  summary:
    "This sample report shows how your latest screening result will appear once you complete either screening flow.",
  possibleConditions: [
    {
      name: "Dengue",
      confidence: 72,
      severity: "High confidence",
      evidence: ["Fever", "Joint pain", "Headache"],
      recommendedTests: ["CBC (Complete Blood Count)", "NS1 Antigen Test"],
    },
    {
      name: "Viral Fever",
      confidence: 24,
      severity: "Moderate confidence",
      evidence: ["Fatigue", "Body aches"],
      recommendedTests: ["General clinician review"],
    },
  ],
  why: ["Fever", "Joint pain", "Headache"],
  riskFactors: ["Age: 22", "Weather exposure: Monsoon humidity"],
  urgency: "Moderate - arrange a clinician follow-up soon",
  nextSteps: [
    "Stay hydrated and rest.",
    "Review symptoms with a clinician if they persist.",
    "Consider CBC testing if fever continues.",
  ],
  doctorAdvice:
    "Bring your latest screening result to a clinician for confirmation before making treatment decisions.",
  diseaseDetails: {
    description:
      "RAXA combines symptom patterns and clinical context to rank possible conditions and surface useful follow-up actions.",
    recommendation:
      "Use the adaptive screening or detailed screening flow to generate a personalized report from your own inputs.",
    lifestyle:
      "Keep tracking symptoms, maintain hydration, and seek timely medical attention when red-flag symptoms appear.",
  },
  patientProfile: {
    age: 22,
    gender: "Male",
    primaryConcern: "Fever, Joint pain, Headache",
  },
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

function formatLabel(label: string) {
  return label
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (char) => char.toUpperCase())
    .trim();
}

export default function HealthReportPage() {
  const [report, setReport] = useState<HealthReportData | null>(null);
  const [downloadMessage, setDownloadMessage] = useState("");

  useEffect(() => {
    setReport(loadHealthReport());
  }, []);

  const activeReport = report ?? sampleReport;
  const isSampleReport = report === null;

  const patientProfileEntries = useMemo(
    () =>
      Object.entries(activeReport.patientProfile).filter(([, value]) => {
        return value !== "" && value !== "Not provided" && value !== "Not calculated";
      }),
    [activeReport.patientProfile],
  );

  const downloadReport = () => {
    const content = [
      `${activeReport.title} - ${formatTimestamp(activeReport.generatedAt)}`,
      `Source: ${activeReport.source}`,
      "",
      "Summary:",
      activeReport.summary,
      "",
      "Possible Conditions:",
      ...activeReport.possibleConditions.map(
        (condition) => `- ${condition.name}: ${condition.confidence}% (${condition.severity})`,
      ),
      "",
      "Supporting Signals:",
      ...activeReport.why.map((item) => `- ${item}`),
      "",
      "Risk Factors:",
      ...activeReport.riskFactors.map((item) => `- ${item}`),
      "",
      "Urgency:",
      activeReport.urgency,
      "",
      "Next Steps:",
      ...activeReport.nextSteps.map((item) => `- ${item}`),
      "",
      "Doctor Advice:",
      activeReport.doctorAdvice,
      "",
      "Detailed Insight:",
      activeReport.diseaseDetails.description,
      "",
      "Recommendations:",
      activeReport.diseaseDetails.recommendation,
      "",
      "Lifestyle Guidance:",
      activeReport.diseaseDetails.lifestyle,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RAXA_Health_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadMessage("Report is ready to download.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="rounded-4xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/40">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <Sparkles className="h-4 w-4" />
                  {isSampleReport ? "Sample Report" : "Latest Screening Report"}
                </p>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                  {activeReport.title}
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  {activeReport.summary}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/15">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Report status</p>
                <p className="mt-4 text-3xl font-semibold">{isSampleReport ? "Waiting for live data" : "Ready"}</p>
                <p className="mt-2 text-slate-300">Generated {formatTimestamp(activeReport.generatedAt)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {isSampleReport && (
          <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">No recent screening result was found.</p>
                <p className="mt-1 text-sm leading-6">
                  Complete the adaptive screening or detailed screening flow to generate a real report here.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <section className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid gap-6 sm:grid-cols-2"
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-3 text-slate-900">
                  <Thermometer className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold">Possible Conditions</h2>
                </div>
                <div className="mt-5 space-y-4">
                  {activeReport.possibleConditions.map((condition) => (
                    <div key={condition.name} className="rounded-3xl bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{condition.name}</p>
                          <p className="mt-1 text-slate-500">{condition.severity}</p>
                        </div>
                        <p className="text-lg font-bold text-slate-900">{condition.confidence}%</p>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(condition.confidence, 100)}%` }}
                        />
                      </div>
                      {condition.evidence.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {condition.evidence.slice(0, 3).map((item) => (
                            <span
                              key={`${condition.name}-${item}`}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-3 text-slate-900">
                  <ShieldCheck className="h-5 w-5 text-sky-600" />
                  <h2 className="text-lg font-semibold">Urgency & Next Steps</h2>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="rounded-3xl bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">Urgency</p>
                    <p className="mt-2 font-semibold text-slate-700">{activeReport.urgency}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Next steps</p>
                    <ul className="mt-3 space-y-2 text-slate-700">
                      {activeReport.nextSteps.map((step) => (
                        <li key={step} className="leading-6">
                          • {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <div className="flex items-center gap-3 text-slate-900">
                <HeartPulse className="h-5 w-5 text-rose-600" />
                <h2 className="text-lg font-semibold">Supporting Signals</h2>
              </div>
              <p className="mt-4 text-slate-600 leading-7">
                These are the main symptoms, evidence points, and context signals that influenced the screening result.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {activeReport.why.length > 0 ? (
                  activeReport.why.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No supporting signals were stored for this report.</p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <div className="flex items-center gap-3 text-slate-900">
                <FileText className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-semibold">Detailed Disease Insight</h2>
              </div>
              <div className="mt-5 space-y-4 text-slate-700 leading-7">
                <p>{activeReport.diseaseDetails.description}</p>
                <p>
                  <strong>Recommendations:</strong> {activeReport.diseaseDetails.recommendation}
                </p>
                <p>
                  <strong>Lifestyle:</strong> {activeReport.diseaseDetails.lifestyle}
                </p>
                <p>
                  <strong>Doctor advice:</strong> {activeReport.doctorAdvice}
                </p>
              </div>
            </motion.div>
          </section>

          <aside className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">Patient Profile</h2>
              <div className="mt-5 space-y-4 text-slate-700">
                {patientProfileEntries.length > 0 ? (
                  patientProfileEntries.map(([label, value]) => (
                    <div key={label} className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">{formatLabel(label)}</p>
                      <p className="mt-1 font-semibold">{String(value)}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">
                    No patient profile details were stored with this report.
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">Report Metadata</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Source</p>
                  <p className="mt-1 font-semibold text-slate-800">{formatLabel(activeReport.source)}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Generated</p>
                  <p className="mt-1 font-semibold text-slate-800">{formatTimestamp(activeReport.generatedAt)}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Risk factors captured</p>
                  <div className="mt-2 space-y-2">
                    {activeReport.riskFactors.length > 0 ? (
                      activeReport.riskFactors.map((factor) => (
                        <p key={factor} className="text-sm text-slate-700">
                          • {factor}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No explicit risk factors were stored.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Download Report</h2>
                  <p className="mt-2 text-sm text-slate-600">Save a text copy of the latest report and guidance.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadReport}
                  className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <DownloadCloud className="h-5 w-5" />
                  Download
                </button>
              </div>
              {downloadMessage && <p className="mt-4 text-sm text-emerald-700">{downloadMessage}</p>}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">Generate a Fresh Report</h2>
              <p className="mt-3 text-slate-600 leading-7">
                Run either screening flow again to replace this report with a new set of patient inputs and results.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/adaptive-screening"
                  className="rounded-3xl bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Open Adaptive Screening
                </Link>
                <Link
                  href="/multi-disease"
                  className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Open Detailed Screening
                </Link>
              </div>
            </motion.div>
          </aside>
        </div>
      </main>
    </div>
  );
}
