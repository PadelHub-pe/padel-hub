"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@wifo/ui/button";
import { Card, CardContent } from "@wifo/ui/card";
import { Form } from "@wifo/ui/form";

import type {
  ScheduleFormValues,
  SetupStep,
} from "~/components/facility-setup";
import {
  createDefaultOperatingHours,
  SetupComplete,
  StepCourts,
  StepIndicator,
  StepPhotos,
  StepSchedule,
} from "~/components/facility-setup";
import { useTRPC } from "~/trpc/react";

// Setup steps
const SETUP_STEPS: SetupStep[] = [
  { number: 1, label: "Canchas" },
  { number: 2, label: "Horarios" },
  { number: 3, label: "Fotos" },
];

// Step 2: Schedule Schema (no duration — kept as default 90 min)
const scheduleSchema = z.object({
  operatingHours: z.array(
    z.object({
      dayOfWeek: z.number(),
      openTime: z.string(),
      closeTime: z.string(),
      isClosed: z.boolean(),
    }),
  ),
});

interface SetupWizardProps {
  facilityId: string;
  facilityName: string;
  orgSlug: string;
  requestedStep?: number;
}

/**
 * Compute the first incomplete step based on setup progress.
 * Step 1 = Courts + Pricing, Step 2 = Schedule, Step 3 = Photos (optional).
 */
function getInitialStep(
  setupStatus: {
    hasCourts: boolean;
    hasPricing: boolean;
    hasSchedule: boolean;
  },
  requestedStep?: number,
): number {
  // Determine the first incomplete step
  let autoStep = 1;
  if (setupStatus.hasCourts && setupStatus.hasPricing) {
    autoStep = setupStatus.hasSchedule ? 3 : 2;
  }

  // If a step was requested (e.g. from banner ?step=N), use it only if reachable
  if (requestedStep && requestedStep >= 1 && requestedStep <= 3) {
    // Can navigate to any step up to the auto-detected one
    if (requestedStep <= autoStep) {
      return requestedStep;
    }
  }

  return autoStep;
}

export function SetupWizard({
  facilityId,
  facilityName,
  orgSlug,
  requestedStep,
}: SetupWizardProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [userStep, setUserStep] = useState<number | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [courtCount, setCourtCount] = useState(0);
  const [setupResult, setSetupResult] = useState<{
    courtCount: number;
    warnings: { type: string; message: string }[];
  } | null>(null);

  // Fetch setup status to determine initial step
  const { data: setupStatus } = useQuery(
    trpc.facility.getSetupStatus.queryOptions({ facilityId }),
  );

  // Fetch current court count for "Siguiente" button gating
  const { data: courts } = useQuery(
    trpc.court.list.queryOptions({ facilityId }),
  );

  // Fetch existing operating hours to pre-fill form
  const { data: existingHours } = useQuery(
    trpc.schedule.getOperatingHours.queryOptions({ facilityId }),
  );

  // Derive initial step from setup status (computed, not set via effect)
  const initialStep = useMemo(
    () => (setupStatus ? getInitialStep(setupStatus, requestedStep) : null),
    [setupStatus, requestedStep],
  );

  // Current step: user-driven overrides the derived initial
  const currentStep = userStep ?? initialStep;
  const setCurrentStep = setUserStep;

  // Keep courtCount in sync with query data
  const effectiveCourtCount = courts?.length ?? courtCount;

  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: standardSchemaResolver(scheduleSchema),
    defaultValues: {
      operatingHours: createDefaultOperatingHours(),
    },
  });

  // Pre-fill form with existing operating hours when fetched
  useEffect(() => {
    if (existingHours) {
      scheduleForm.reset({
        operatingHours: existingHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        })),
      });
    }
  }, [existingHours, scheduleForm]);

  // tRPC mutations
  const updateOperatingHours = useMutation(
    trpc.schedule.updateOperatingHours.mutationOptions(),
  );
  const completeSetup = useMutation(
    trpc.facility.completeSetup.mutationOptions({
      onSuccess: (data) => {
        setSetupResult({
          courtCount: data.courtCount,
          warnings: data.warnings,
        });
      },
    }),
  );

  const isLoading = updateOperatingHours.isPending || completeSetup.isPending;

  function handleCourtsNext() {
    setGeneralError(null);
    if (effectiveCourtCount < 1) {
      setGeneralError("Debe agregar al menos una cancha para continuar.");
      return;
    }
    setCurrentStep(2);
  }

  async function handleScheduleSubmit(values: ScheduleFormValues) {
    setGeneralError(null);

    // Validate close > open for all open days
    const invalidDay = values.operatingHours.find(
      (h) => !h.isClosed && h.closeTime <= h.openTime,
    );
    if (invalidDay) {
      const dayName =
        DAYS_OF_WEEK.find((d) => d.value === invalidDay.dayOfWeek)?.label ??
        "un día";
      setGeneralError(
        `La hora de cierre debe ser posterior a la de apertura (${dayName}).`,
      );
      return;
    }

    try {
      await updateOperatingHours.mutateAsync({
        facilityId,
        hours: values.operatingHours.map((oh) => ({
          dayOfWeek: oh.dayOfWeek,
          openTime: oh.openTime,
          closeTime: oh.closeTime,
          isClosed: oh.isClosed,
        })),
      });
      setCurrentStep(3);
    } catch (error) {
      setGeneralError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error. Intenta nuevamente.",
      );
    }
  }

  async function handleCompleteSetup() {
    setGeneralError(null);
    try {
      await completeSetup.mutateAsync({ facilityId });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error. Intenta nuevamente.";

      // Route user to the relevant step based on the error
      if (message.includes("cancha")) {
        setCurrentStep(1);
      } else if (message.includes("precio")) {
        setCurrentStep(1);
      } else if (message.includes("horarios")) {
        setCurrentStep(2);
      }

      setGeneralError(message);
    }
  }

  async function handleNext() {
    if (currentStep === 1) {
      handleCourtsNext();
    } else if (currentStep === 2) {
      await scheduleForm.handleSubmit(handleScheduleSubmit)();
    } else if (currentStep === 3) {
      await handleCompleteSetup();
    }
  }

  function handleBack() {
    setGeneralError(null);
    if (currentStep !== null && currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleSkip() {
    router.push(`/org/${orgSlug}/facilities`);
  }

  function handleStepClick(step: number) {
    setGeneralError(null);
    setCurrentStep(step);
  }

  const isNextDisabled =
    isLoading || (currentStep === 1 && effectiveCourtCount < 1);

  const basePath = `/org/${orgSlug}/facilities/${facilityId}`;

  // Show loading state while determining initial step
  if (currentStep === null) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Configurar {facilityName}
          </h1>
          <p className="mt-1 text-gray-500">Cargando progreso...</p>
        </div>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Show completion screen after successful setup
  if (setupResult) {
    return (
      <SetupComplete
        facilityName={facilityName}
        courtCount={setupResult.courtCount}
        warnings={setupResult.warnings}
        dashboardUrl={basePath}
        photosUrl={`${basePath}/settings`}
        settingsUrl={`${basePath}/settings`}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Configurar {facilityName}
        </h1>
        <p className="mt-1 text-gray-500">
          Completa la configuración para activar tu local
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        steps={SETUP_STEPS}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {generalError && (
            <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {generalError}
            </div>
          )}

          {currentStep === 1 && (
            <StepCourts
              facilityId={facilityId}
              onCourtCountChange={setCourtCount}
            />
          )}
          {currentStep === 2 && (
            <Form {...scheduleForm}>
              <form onSubmit={scheduleForm.handleSubmit(handleScheduleSubmit)}>
                <StepSchedule
                  control={scheduleForm.control}
                  facilityId={facilityId}
                />
              </form>
            </Form>
          )}
          {currentStep === 3 && <StepPhotos facilityId={facilityId} />}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          {currentStep === 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Configurar más tarde
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
            >
              <ChevronLeftIcon className="mr-1 h-4 w-4" />
              Atrás
            </Button>
          )}
        </div>

        <Button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : currentStep === 3 ? (
            <>
              Completar Configuración
              <CheckIcon className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              Siguiente
              <ChevronRightIcon className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Helper for day labels in validation error messages
const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
