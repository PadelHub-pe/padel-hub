"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@wifo/ui/button";
import { Card, CardContent } from "@wifo/ui/card";
import { Form } from "@wifo/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  createDefaultOperatingHours,
  StepCourts,
  StepIndicator,
  StepSchedule,
} from "~/components/facility-setup";
import type {
  CourtsFormValues,
  ScheduleFormValues,
  SetupStep,
} from "~/components/facility-setup";
import { useTRPC } from "~/trpc/react";

// Setup steps
const SETUP_STEPS: SetupStep[] = [
  { number: 1, label: "Canchas" },
  { number: 2, label: "Horarios" },
];

// Step 1: Courts Schema
const courtsSchema = z.object({
  courts: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Nombre requerido"),
        type: z.enum(["indoor", "outdoor"]),
      }),
    )
    .min(1, "Debe agregar al menos una cancha")
    .max(6, "Máximo 6 canchas"),
});

// Step 2: Schedule Schema
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
  defaultPriceInSoles: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 1;
    },
    { message: "El precio debe ser al menos S/ 1.00" },
  ),
});

interface SetupWizardProps {
  facilityId: string;
  facilityName: string;
  orgSlug: string;
}

export function SetupWizard({ facilityId, facilityName, orgSlug }: SetupWizardProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [currentStep, setCurrentStep] = useState(1);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Form instances for each step
  const courtsForm = useForm<CourtsFormValues>({
    resolver: standardSchemaResolver(courtsSchema),
    defaultValues: { courts: [] },
  });

  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: standardSchemaResolver(scheduleSchema),
    defaultValues: {
      operatingHours: createDefaultOperatingHours(),
      defaultDurationMinutes: "90",
      defaultPriceInSoles: "",
    },
  });

  // tRPC mutations
  const saveCourts = useMutation(trpc.facility.saveCourts.mutationOptions());
  const saveSchedule = useMutation(trpc.facility.saveSchedule.mutationOptions());
  const completeSetup = useMutation(
    trpc.facility.completeSetup.mutationOptions({
      onSuccess: () => {
        router.push(`/org/${orgSlug}/facilities/${facilityId}`);
      },
    }),
  );

  const isLoading =
    saveCourts.isPending || saveSchedule.isPending || completeSetup.isPending;

  async function handleCourtsSubmit(values: CourtsFormValues) {
    setGeneralError(null);
    try {
      await saveCourts.mutateAsync({
        facilityId,
        courts: values.courts.map((c) => ({
          name: c.name,
          type: c.type,
        })),
      });
      setCurrentStep(2);
    } catch (error) {
      setGeneralError(
        error instanceof Error ? error.message : "Ocurrió un error. Intenta nuevamente.",
      );
    }
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
        defaultPriceInCents: Math.round(parseFloat(values.defaultPriceInSoles) * 100),
      });
      await completeSetup.mutateAsync({ facilityId });
    } catch (error) {
      setGeneralError(
        error instanceof Error ? error.message : "Ocurrió un error. Intenta nuevamente.",
      );
    }
  }

  async function handleNext() {
    if (currentStep === 1) {
      await courtsForm.handleSubmit(handleCourtsSubmit)();
    } else if (currentStep === 2) {
      await scheduleForm.handleSubmit(handleScheduleSubmit)();
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Configurar {facilityName}</h1>
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
            <Form {...courtsForm}>
              <form onSubmit={courtsForm.handleSubmit(handleCourtsSubmit)}>
                <StepCourts control={courtsForm.control} />
              </form>
            </Form>
          )}
          {currentStep === 2 && (
            <Form {...scheduleForm}>
              <form onSubmit={scheduleForm.handleSubmit(handleScheduleSubmit)}>
                <StepSchedule control={scheduleForm.control} />
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          {currentStep === 1 ? (
            <Button type="button" variant="outline" onClick={handleSkip} disabled={isLoading}>
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
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : currentStep === 2 ? (
            <>
              Finalizar configuración
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
