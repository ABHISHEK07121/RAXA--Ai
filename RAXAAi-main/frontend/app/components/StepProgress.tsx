"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface StepProgressProps {
    steps: string[];
    currentStep: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep }) => {
    return (
        <div className="w-full py-8">
            <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 -z-10" />
                
                {/* Progress Line */}
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 -z-10"
                />

                {steps.map((step, index) => {
                    const isActive = index <= currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <div key={step} className="flex flex-col items-center gap-3">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: isActive ? 'var(--color-primary)' : 'white',
                                    borderColor: isActive ? 'var(--color-primary)' : '#E2E8F0',
                                    scale: index === currentStep ? 1.2 : 1
                                }}
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center relative z-10 transition-colors shadow-sm`}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5 text-white" />
                                ) : (
                                    <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                        {index + 1}
                                    </span>
                                )}
                            </motion.div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StepProgress;
