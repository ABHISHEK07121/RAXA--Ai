"use client";

import { Activity, AlertTriangle, HeartPulse } from "lucide-react";

interface TwinProps {
  riskLevel: string;
}

export default function MedicalTwin({ riskLevel }: TwinProps) {
  const normalizedRisk = riskLevel === "High" || riskLevel === "Low" ? riskLevel : "Medium";
  const riskStyles = {
    Low: {
      label: "Low Risk",
      color: "text-emerald-300",
      border: "border-emerald-400/30",
      glow: "shadow-emerald-500/20",
      fill: "bg-emerald-400",
      ring: "border-emerald-300/50",
    },
    Medium: {
      label: "Moderate Risk",
      color: "text-amber-300",
      border: "border-amber-400/30",
      glow: "shadow-amber-500/20",
      fill: "bg-amber-400",
      ring: "border-amber-300/50",
    },
    High: {
      label: "High Risk",
      color: "text-rose-300",
      border: "border-rose-400/30",
      glow: "shadow-rose-500/20",
      fill: "bg-rose-400",
      ring: "border-rose-300/50",
    },
  }[normalizedRisk];

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.22),transparent_55%)]" />
      <div className="absolute inset-0 bg-linear-to-br from-primary via-transparent to-medical-teal opacity-20" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className={`relative mb-8 flex h-44 w-44 items-center justify-center rounded-full border ${riskStyles.border} shadow-2xl ${riskStyles.glow}`}>
          <div className={`absolute inset-4 animate-pulse rounded-full border ${riskStyles.ring}`} />
          <div className={`absolute h-24 w-24 rounded-full ${riskStyles.fill} opacity-15 blur-2xl`} />
          <HeartPulse className={`h-20 w-20 ${riskStyles.color}`} />
          <Activity className="absolute right-8 top-8 h-6 w-6 text-sky-300" />
          {normalizedRisk === "High" && (
            <AlertTriangle className="absolute bottom-8 left-8 h-6 w-6 text-rose-300" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Medical Twin
          </p>
          <h3 className={`text-3xl font-black ${riskStyles.color}`}>
            {riskStyles.label}
          </h3>
          <p className="mx-auto max-w-sm text-sm font-medium leading-6 text-slate-300">
            A local risk visualization based on the current screening result.
          </p>
        </div>

        <div className="mt-8 grid w-full max-w-sm grid-cols-3 gap-3 text-left">
          <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Vitals</p>
            <p className="text-sm font-black text-white">Tracked</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Risk</p>
            <p className="text-sm font-black text-white">{normalizedRisk}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Mode</p>
            <p className="text-sm font-black text-white">Local</p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-20 text-center">
        <span className="inline-block rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
          Visualization of Internal Risk - Not a Medical Diagnosis
        </span>
      </div>
    </div>
  );
}
