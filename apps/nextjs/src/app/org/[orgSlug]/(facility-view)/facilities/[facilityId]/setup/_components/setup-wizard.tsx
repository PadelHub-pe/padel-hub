"use client";

import { useState } from "react";
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

// Step 2: Schedule Schema (no longer includes defaultPriceInSoles — pricing is per-court)
const scheduleSchema = z.object({
  operatingHours: z.array(
    z.object({
      dayOfWeek: z.number(),
      openTime: z.string(),
      closeTime: z.string(),
      isClosed: z.boolean(),
    }),
  ),
  defaultDurationMinutes: z.enum(["60", "90", "120"]),
});

interface SetupWizardProps {
  facilityId: string;
  facilityName: string;
  orgSlug: string;
}

export function SetupWizard({
  facilityId,
  facilityName,
  orgSlug,
}: SetupWizardProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [currentStep, setCurrentStep] = useState(1);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [courtCount, setCourtCount] = useState(0);

  // Fetch current court count for "Siguiente" button gating
  const { data: courts } = useQuery(
    trpc.court.list.queryOptions({ facilityId }),
  );

  // Keep courtCount in sync with query data
  const effectiveCourtCount = courts?.length ?? courtCount;

  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: standardSchemaResolver(scheduleSchema),
    defaultValues: {
      operatingHours: createDefaultOperatingHours(),
      defaultDurationMinutes: "90",
    },
  });

  // tRPC mutations
  const saveSchedule = useMutation(
    trpc.facility.saveSchedule.mutationOptions(),
  );
  const completeSetup = useMutation(
    trpc.facility.completeSetup.mutationOptions({
      onSuccess: () => {
        router.push(`/org/${orgSlug}/facilities/${facilityId}`);
      },
    }),
  );

  const isLoading = saveSchedule.isPending || completeSetup.isPending;

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
    try {
      await saveSchedule.mutateAsync({
        facilityId,
        operatingHours: values.operatingHours.map((oh) => ({
          dayOfWeek: oh.dayOfWeek,
          openTime: oh.openTime,
          closeTime: oh.closeTime,
          isClosed: oh.isClosed,
        })),
        defaultDurationMinutes: values.defaultDurationMinutes,
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
      setGeneralError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error. Intenta nuevamente.",
      );
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
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleSkip() {
    router.push(`/org/${orgSlug}/facilities`);
  }

  const isNextDisabled =
    isLoading || (currentStep === 1 && effectiveCourtCount < 1);

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
      <StepIndicator steps={SETUP_STEPS} currentStep={currentStep} />

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
                <StepSchedule control={scheduleForm.control} />
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
