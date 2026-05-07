"use client";
import { Lightbulb, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface ExplanationProps {
  explanations: {
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

export default function ExplainabilityPanel({
  explanations,
}: ExplanationProps) {
  if (
    !explanations ||
    (!explanations.diabetes_factors && !explanations.hypertension_factors)
  ) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="premium-card p-8 md:p-10 mb-12 overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
          <Lightbulb className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI Signal Analysis</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Explainability Engine</p>
        </div>
      </div>

      <p className="text-slate-500 font-medium mb-10 max-w-2xl leading-relaxed">
        Our clinical intelligence engine has isolated the primary biomarkers contributing to your health profile. 
        Focusing on these areas can significantly improve your risk scores.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Diabetes Factors */}
        {explanations.diabetes_factors &&
          explanations.diabetes_factors.length > 0 && (
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Metabolic Risk Signals
              </h4>
              <div className="space-y-4">
                {explanations.diabetes_factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-hover hover:border-primary/20"
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${factor.impact.includes("increases") ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                      {factor.impact.includes("increases") ? (
                        <TrendingUp className="h-4 w-4 text-rose-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm tracking-tight mb-1">
                        {factor.feature}
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-normal">
                        {factor.impact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Hypertension Factors */}
        {explanations.hypertension_factors &&
          explanations.hypertension_factors.length > 0 && (
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                Vascular Risk Signals
              </h4>
              <div className="space-y-4">
                {explanations.hypertension_factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-hover hover:border-rose-200"
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${factor.impact.includes("increases") ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                      {factor.impact.includes("increases") ? (
                        <TrendingUp className="h-4 w-4 text-rose-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm tracking-tight mb-1">
                        {factor.feature}
                      </p>
                      <p className="text-xs font-medium text-slate-500 leading-normal">
                        {factor.impact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      <div className="mt-12 p-6 bg-slate-900 text-white rounded-2xl flex gap-4 items-center overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="text-xl">ℹ️</div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed">
          <span className="text-white">Guidance:</span> These signals are calculated using Logistic Regression coefficients. 
          They represent mathematical probability weighting, not clinical advice.
        </p>
      </div>
    </motion.div>
  );
}
