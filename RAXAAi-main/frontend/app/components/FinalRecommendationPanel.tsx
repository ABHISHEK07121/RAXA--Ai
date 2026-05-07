/**
 * FinalRecommendationPanel Component
 * Displays the final recommendation with top disease, tests, actions, and doctor visit guidance
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Stethoscope,
  FlaskConical,
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
  ArrowRight,
  FileText,
  Activity,
  HeartPulse,
  ShieldAlert
} from 'lucide-react';

interface RecommendedTest {
  test: string;
  reason?: string;
  priority?: string;
}

interface ImmediateAction {
  action: string;
  priority?: string;
  timeframe?: string;
}

interface FinalRecommendationPanelProps {
  topDisease: string;
  probability: number;
  confidence: number;
  recommendedTests?: RecommendedTest[];
  immediateActions?: ImmediateAction[];
  showDoctorVisit?: boolean;
  doctorVisitGuidance?: string;
  emergencyWarning?: string;
}

const FinalRecommendationPanel: React.FC<FinalRecommendationPanelProps> = ({
  topDisease,
  probability,
  confidence,
  recommendedTests = [],
  immediateActions = [],
  showDoctorVisit = true,
  doctorVisitGuidance,
  emergencyWarning
}) => {
  // Get timeframe guidance
  const getTimeframeGuidance = () => {
    if (probability >= 80) {
      return { label: 'Within 24 hours', description: 'Seek medical attention promptly' };
    }
    if (probability >= 60) {
      return { label: 'Within 2-3 days', description: 'Schedule a doctor appointment soon' };
    }
    if (probability >= 40) {
      return { label: 'Within 1 week', description: 'Consider scheduling a checkup' };
    }
    return { label: 'Routine', description: 'No immediate action needed' };
  };

  const timeframe = getTimeframeGuidance();

  // Default doctor visit guidance
  const defaultDoctorGuidance = doctorVisitGuidance || `Based on your ${probability}% probability of ${topDisease}, consider consulting a healthcare provider for proper diagnosis and treatment.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-lg"
    >
      {/* Emergency Warning (if any) */}
      {emergencyWarning && (
        <div className="bg-rose-50 p-4 border-b border-rose-100 flex items-center gap-3">
          <div className="p-2 bg-rose-500 rounded-xl">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-rose-700">{emergencyWarning}</p>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header - Top Disease */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <Stethoscope className="h-4 w-4" />
            AI Assessment Result
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
            Most Likely Condition
          </h2>

          <div className="inline-flex items-center gap-4 px-6 py-4 bg-slate-900 rounded-2xl">
            <Stethoscope className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnosis</p>
              <p className="text-xl font-black text-white">{topDisease}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-primary">{probability}%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Confidence</p>
            </div>
          </div>
        </div>

        {/* Confidence Level Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full">
            <Activity className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600">AI Confidence:</span>
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full ${
                  confidence >= 80 ? 'bg-emerald-500' : confidence >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                }`}
              />
            </div>
            <span className={`text-xs font-black ${
              confidence >= 80 ? 'text-emerald-600' : confidence >= 50 ? 'text-amber-600' : 'text-slate-500'
            }`}>
              {confidence}%
            </span>
          </div>
        </div>

        {/* Recommended Tests */}
        {recommendedTests.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                Recommended Tests
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendedTests.map((test, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{test.test}</p>
                    {test.reason && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{test.reason}</p>
                    )}
                  </div>
                  {test.priority && (
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase shrink-0 ${
                      test.priority === 'High' ? 'bg-rose-100 text-rose-600' :
                      test.priority === 'Medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {test.priority}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Immediate Actions */}
        {immediateActions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                Immediate Actions
              </h3>
            </div>

            <div className="space-y-2">
              {immediateActions.map((action, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100"
                >
                  <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">{action.action}</p>
                    {action.timeframe && (
                      <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {action.timeframe}
                      </p>
                    )}
                  </div>
                  {action.priority === 'EMERGENCY' && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[8px] font-bold uppercase shrink-0">
                      Emergency
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* When to See a Doctor */}
        {showDoctorVisit && (
          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                When to See a Doctor
              </h3>
            </div>

            <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <HeartPulse className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  {defaultDoctorGuidance}
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-600">
                    Recommended: {timeframe.label}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    • {timeframe.description}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ArrowRight className="h-3 w-3" />
              <span>RAXA AI provides estimates only. Always consult a healthcare professional.</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FinalRecommendationPanel;
