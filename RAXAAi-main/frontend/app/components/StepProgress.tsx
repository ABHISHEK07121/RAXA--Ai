"use client";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

export default function StepProgress({
  steps,
  currentStep,
}: StepProgressProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="w-full mb-6">
      {/* Labels */}
      <div className="flex justify-between mb-2 text-sm font-medium text-slate-600">
        <span>
          Step {currentStep + 1} of {steps.length}
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Labels */}
      <div className="flex justify-between mt-2 text-xs text-slate-400 overflow-x-auto gap-2">
        {steps.map((step, index) => (
          <span
            key={index}
            className={`whitespace-nowrap ${
              index === currentStep
                ? "text-cyan-600 font-semibold"
                : ""
            }`}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}