"use client";

import { cn } from "@wifo/ui";

interface Step {
  number: number;
  label: string;
}

const steps: Step[] = [
  { number: 1, label: "Info" },
  { number: 2, label: "Fotos" },
  { number: 3, label: "Canchas" },
  { number: 4, label: "Horarios" },
];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                currentStep === step.number
                  ? "border-blue-600 bg-blue-600 text-white"
                  : currentStep > step.number
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-500"
              )}
            >
              {currentStep > step.number ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={cn(
                "mt-2 text-xs font-medium",
                currentStep >= step.number ? "text-blue-600" : "text-gray-500"
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 h-0.5 w-12 sm:w-16 md:w-24",
                currentStep > step.number ? "bg-blue-600" : "bg-gray-300"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
