import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, name: 'Parcelle' },
  { id: 2, name: 'Propriétaire' },
  { id: 3, name: 'Bien' },
  { id: 4, name: 'Synthèse' },
  { id: 5, name: 'Gestion' },
  { id: 6, name: 'Validation' }
];

export default function StepIndicator({ currentStep, onStepClick, completedSteps = [] }) {
  return (
    <div className="w-full py-2 sm:py-4 px-1 sm:px-2">
      <div className="flex items-center justify-between gap-0.5 sm:gap-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => onStepClick(step.id)}
              className="flex flex-col items-center gap-1 sm:gap-2 group flex-shrink-0"
            >
              <div
                className={cn(
                  "rounded-full flex items-center justify-center font-semibold transition-all duration-300 w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm",
                  currentStep === step.id
                    ? "bg-blue-800 text-white shadow-lg shadow-blue-800/30 scale-100 sm:scale-110"
                    : completedSteps.includes(step.id)
                    ? "bg-amber-600 text-white"
                    : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                )}
              >
                {completedSteps.includes(step.id) ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  "font-medium transition-colors text-[0.65rem] sm:text-xs line-clamp-1 max-w-12 sm:max-w-16",
                  currentStep === step.id
                    ? "text-blue-800"
                    : completedSteps.includes(step.id)
                    ? "text-amber-600"
                    : "text-slate-400"
                )}
              >
                {step.name}
              </span>
            </button>
            {/* Connector lines removed for compact mobile view */}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}