"use client";

import { useState } from "react";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@wifo/ui";

import { usePermission } from "~/hooks/use-permission";
import { useTRPC } from "~/trpc/react";

interface SetupBannerProps {
  facilityId: string;
  orgSlug: string;
  userRole: "org_admin" | "facility_manager" | "staff";
}

const DISMISS_KEY_PREFIX = "setup-banner-dismissed-";

interface StepItem {
  label: string;
  completed: boolean;
}

function getNextIncompleteStep(steps: {
  hasCourts: boolean;
  hasPricing: boolean;
  hasSchedule: boolean;
}): number {
  if (!steps.hasCourts || !steps.hasPricing) return 1;
  if (!steps.hasSchedule) return 2;
  return 3;
}

export function SetupBanner({
  facilityId,
  orgSlug,
  userRole,
}: SetupBannerProps) {
  const trpc = useTRPC();
  const { canConfigureFacility } = usePermission(userRole);

  const { data: setupStatus } = useSuspenseQuery(
    trpc.facility.getSetupStatus.queryOptions({ facilityId }),
  );

  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      sessionStorage.getItem(`${DISMISS_KEY_PREFIX}${facilityId}`) === "true"
    );
  });

  // Don't show for staff
  if (!canConfigureFacility) return null;

  // Don't show if setup is complete
  if (setupStatus.isComplete) return null;

  // Don't show if dismissed this session
  if (isDismissed) return null;

  const steps: StepItem[] = [
    { label: "Canchas", completed: setupStatus.hasCourts },
    { label: "Horarios", completed: setupStatus.hasSchedule },
    { label: "Precios", completed: setupStatus.hasPricing },
  ];

  const { completedSteps, totalSteps } = setupStatus;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);
  const nextStep = getNextIncompleteStep(setupStatus);
  const setupUrl = `/org/${orgSlug}/facilities/${facilityId}/setup?step=${nextStep}`;

  function handleDismiss() {
    sessionStorage.setItem(`${DISMISS_KEY_PREFIX}${facilityId}`, "true");
    setIsDismissed(true);
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <SetupIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-amber-800">
              Configuración pendiente
            </h3>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded p-0.5 text-amber-400 hover:bg-amber-100 hover:text-amber-600"
              aria-label="Ocultar banner"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-1 text-sm text-amber-700">
            Tu local está inactivo. Completa la configuración para activarlo y
            empezar a recibir reservas.
          </p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-amber-700">
              <span>Progreso</span>
              <span>
                {completedSteps} de {totalSteps} pasos
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-amber-200">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Step checklist */}
          <ul className="mt-3 space-y-1">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-2 text-sm">
                {step.completed ? (
                  <CheckIcon className="h-4 w-4 flex-shrink-0 text-green-600" />
                ) : (
                  <CrossIcon className="h-4 w-4 flex-shrink-0 text-amber-500" />
                )}
                <span
                  className={cn(
                    step.completed ? "text-green-700" : "text-amber-700",
                  )}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ul>

          <Link
            href={setupUrl}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Continuar configuración
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function SetupIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
