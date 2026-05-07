/**
 * DiseaseProbabilityCard Component
 * Displays disease probability with animated progress bar, confidence level, and change indicators
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';

interface Evidence {
  positive: number;
  negative: number;
  net_score: number;
  details: Array<{
    question: string;
    type: string;
    value: unknown;
    weight: number;
    reason?: string;
  }>;
}

interface DiseaseProbabilityCardProps {
  disease: string;
  probability: number;
  previousProbability?: number;
  confidence: number;
  confidence_level?: string;
  risk_level?: string;
  evidence?: Evidence;
  isTop?: boolean;
  maxProbability?: number;
}

const DiseaseProbabilityCard: React.FC<DiseaseProbabilityCardProps> = ({
  disease,
  probability,
  previousProbability,
  confidence,
  confidence_level = 'Medium',
  risk_level = 'Medium',
  evidence,
  isTop = false,
  maxProbability = 100
}) => {
  const displayProbability = probability;
  const changeDirection: 'up' | 'down' | 'same' =
    previousProbability === undefined || probability === previousProbability
      ? 'same'
      : probability > previousProbability
        ? 'up'
        : 'down';
  const showChange = previousProbability !== undefined && previousProbability !== probability;

  const getRiskColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-rose-500',
          light: 'bg-rose-50',
          text: 'text-rose-600',
          border: 'border-rose-100',
          gradient: 'from-rose-500 to-rose-600'
        };
      case 'medium':
        return {
          bg: 'bg-amber-500',
          light: 'bg-amber-50',
          text: 'text-amber-600',
          border: 'border-amber-100',
          gradient: 'from-amber-500 to-amber-600'
        };
      default:
        return {
          bg: 'bg-emerald-500',
          light: 'bg-emerald-50',
          text: 'text-emerald-600',
          border: 'border-emerald-100',
          gradient: 'from-emerald-500 to-emerald-600'
        };
    }
  };

  const getConfidenceColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-emerald-100 text-emerald-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const colors = getRiskColor(risk_level);
  const confidenceColor = getConfidenceColor(confidence_level);

  // Calculate bar width relative to max probability
  const barWidth = maxProbability > 0 ? (displayProbability / maxProbability) * 100 : displayProbability;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        relative overflow-hidden
        ${isTop ? 'ring-2 ring-primary/30' : ''}
        bg-white rounded-3xl border border-slate-100 
        shadow-sm hover:shadow-md transition-all duration-300
      `}
    >
      {/* Background gradient effect */}
      <div className={`absolute inset-0 opacity-5 ${colors.bg}`} />

      <div className="relative p-5 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h4 className="font-black text-slate-900 text-lg tracking-tight">
              {disease}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.light} ${colors.text}`}>
                {risk_level} Risk
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${confidenceColor}`}>
                {confidence_level} Confidence
              </span>
            </div>
          </div>

          {/* Probability Display */}
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <AnimatePresence mode="wait">
                {showChange && changeDirection !== 'same' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className={`
                      flex items-center justify-center w-6 h-6 rounded-full
                      ${changeDirection === 'up' ? 'bg-emerald-500' : 'bg-rose-500'}
                    `}
                  >
                    {changeDirection === 'up' ? (
                      <TrendingUp className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-white" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <span className={`text-3xl font-black ${colors.text}`}>
                {displayProbability}
              </span>
              <span className="text-sm font-bold text-slate-400">%</span>
            </div>

            {/* Change indicator */}
            <AnimatePresence mode="wait">
              {showChange && previousProbability !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`
                    text-[10px] font-bold uppercase tracking-wider text-right mt-0.5
                    ${changeDirection === 'up' ? 'text-emerald-600' : changeDirection === 'down' ? 'text-rose-600' : 'text-slate-400'}
                  `}
                >
                  {changeDirection === 'up' ? '↑ +' : changeDirection === 'down' ? '↓ -' : ''}
                  {Math.abs(probability - (previousProbability || 0))}%
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-4">
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ 
                duration: 0.8, 
                ease: [0.4, 0, 0.2, 1]
              }}
              className={`h-full ${colors.bg} rounded-full relative overflow-hidden`}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  repeatDelay: 2,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Confidence</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-full bg-slate-400 rounded-full"
              />
            </div>
          </div>
          <span className="text-xs font-black text-slate-500">{confidence}%</span>
        </div>

        {/* Evidence Summary (if available) */}
        {evidence && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4 text-xs">
              {evidence.positive > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-bold text-emerald-600">+{evidence.positive}</span>
                  <span className="text-slate-400">positive</span>
                </div>
              )}
              {evidence.negative > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                  <span className="font-bold text-rose-600">-{evidence.negative}</span>
                  <span className="text-slate-400">negative</span>
                </div>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-400">Net: </span>
                <span className={`font-bold ${evidence.net_score >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {evidence.net_score >= 0 ? '+' : ''}{evidence.net_score}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DiseaseProbabilityCard;
