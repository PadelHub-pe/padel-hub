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

import { useTRPC } from "~/trpc/react";
import { StepIndicator } from "./step-indicator";
import { StepFacilityInfo } from "./step-facility-info";
import { StepPhotos } from "./step-photos";
import { StepCourts } from "./step-courts";
import { StepSchedule } from "./step-schedule";

// Step 1: Facility Info Schema
const facilityInfoSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  district: z.string().min(1, "El distrito es requerido"),
  city: z.string().default("Lima"),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
  email: z.string().email("Email inválido").or(z.literal("")),
  website: z
    .string()
    .regex(/^https?:\/\/.+/, "Debe comenzar con http:// o https://")
    .or(z.literal("")),
  amenities: z.array(z.string()),
});

export type FacilityInfoFormValues = z.infer<typeof facilityInfoSchema>;

// Step 3: Courts Schema
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

export type CourtsFormValues = z.infer<typeof courtsSchema>;

// Step 4: Schedule Schema
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

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;

// Photos data type (no validation needed - optional step)
export interface PhotosData {
  photos: string[];
}

// Initial data
const INITIAL_FACILITY_INFO: FacilityInfoFormValues = {
  name: "",
  description: "",
  address: "",
  district: "",
  city: "Lima",
  phone: "",
  email: "",
  website: "",
  amenities: [],
};

const INITIAL_PHOTOS: PhotosData = {
  photos: [],
};

const INITIAL_COURTS: CourtsFormValues = {
  courts: [],
};

const INITIAL_SCHEDULE: ScheduleFormValues = {
  operatingHours: [
    { dayOfWeek: 0, openTime: "09:00", closeTime: "21:00", isClosed: false },
    { dayOfWeek: 1, openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 2, openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 3, openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 4, openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 5, openTime: "07:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 6, openTime: "08:00", closeTime: "22:00", isClosed: false },
  ],
  defaultDurationMinutes: "90",
  defaultPriceInSoles: "",
};

export function OnboardingWizard() {
  const router = useRouter();
  const trpc = useTRPC();
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<PhotosData>(INITIAL_PHOTOS);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Form instances for each step
  const step1Form = useForm<FacilityInfoFormValues>({
    resolver: standardSchemaResolver(facilityInfoSchema),
    defaultValues: INITIAL_FACILITY_INFO,
  });

  const step3Form = useForm<CourtsFormValues>({
    resolver: standardSchemaResolver(courtsSchema),
    defaultValues: INITIAL_COURTS,
  });

  const step4Form = useForm<ScheduleFormValues>({
    resolver: standardSchemaResolver(scheduleSchema),
    defaultValues: INITIAL_SCHEDULE,
  });

  // tRPC mutations
  const saveFacilityInfo = useMutation(trpc.owner.saveFacilityInfo.mutationOptions());
  const savePhotos = useMutation(trpc.owner.savePhotos.mutationOptions());
  const saveCourts = useMutation(trpc.owner.saveCourts.mutationOptions());
  const saveSchedule = useMutation(trpc.owner.saveSchedule.mutationOptions());
  const completeOnboarding = useMutation(
    trpc.owner.completeOnboarding.mutationOptions({
      onSuccess: () => {
        router.push("/dashboard");
      },
    }),
  );

  const isLoading =
    saveFacilityInfo.isPending ||
    savePhotos.isPending ||
    saveCourts.isPending ||
    saveSchedule.isPending ||
    completeOnboarding.isPending;

  async function handleStep1Submit(values: FacilityInfoFormValues) {
    setGeneralError(null);
    try {
      await saveFacilityInfo.mutateAsync({
        name: values.name,
        description: values.description ?? undefined,
        address: values.address,
        district: values.district,
        city: values.city,
        phone: values.phone,
        email: values.email || undefined,
        website: values.website || undefined,
        amenities: values.amenities,
      });
      setCurrentStep(2);
    } catch (error) {
      setGeneralError(
        error instanceof Error ? error.message : "Ocurrió un error. Intenta nuevamente.",
      );
    }
  }

  async function handleStep2Submit() {
    setGeneralError(null);
    try {
      await savePhotos.mutateAsync({ photos: photos.photos });
      setCurrentStep(3);
    } catch (error) {
      setGeneralError(
        error instanceof Error ? error.message : "Ocurrió un error. Intenta nuevamente.",
      );
    }
  }

  async function handleStep3Submit(values: CourtsFormValues) {
    setGeneralError(null);
    try {
      await saveCourts.mutateAsync({
        courts: values.courts.map((c) => ({
          name: c.name,
          type: c.type,
        })),
      });
      setCurrentStep(4);
    } catch (error) {
      setGeneralError(
        error instanceof Error ? error.message : "Ocurrió un error. Intenta nuevamente.",
      );
    }
  }

  async function handleStep4Submit(values: ScheduleFormValues) {
    setGeneralError(null);
    try {
      await saveSchedule.mutateAsync({
        operatingHours: values.operatingHours.map((oh) => ({
          dayOfWeek: oh.dayOfWeek,
          openTime: oh.openTime,
          closeTime: oh.closeTime,
          isClosed: oh.isClosed,
        })),
        defaultDurationMinutes: values.defaultDurationMinutes,
        defaultPriceInCents: Math.round(parseFloat(values.defaultPriceInSoles) * 100),
      });
      await completeOnboarding.mutateAsync();
    } catch (error) {
      setGeneralError(
        error instanceof Error ? error.message : "Ocurrió un error. Intenta nuevamente.",
      );
    }
  }

  async function handleNext() {
    if (currentStep === 1) {
      await step1Form.handleSubmit(handleStep1Submit)();
    } else if (currentStep === 2) {
      await handleStep2Submit();
    } else if (currentStep === 3) {
      await step3Form.handleSubmit(handleStep3Submit)();
    } else if (currentStep === 4) {
      await step4Form.handleSubmit(handleStep4Submit)();
    }
  }

  function handleBack() {
    setGeneralError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {generalError && (
            <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {generalError}
            </div>
          )}

          {currentStep === 1 && (
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)}>
                <StepFacilityInfo control={step1Form.control} />
              </form>
            </Form>
          )}
          {currentStep === 2 && (
            <StepPhotos data={photos} onChange={setPhotos} />
          )}
          {currentStep === 3 && (
            <Form {...step3Form}>
              <form onSubmit={step3Form.handleSubmit(handleStep3Submit)}>
                <StepCourts control={step3Form.control} />
              </form>
            </Form>
          )}
          {currentStep === 4 && (
            <Form {...step4Form}>
              <form onSubmit={step4Form.handleSubmit(handleStep4Submit)}>
                <StepSchedule control={step4Form.control} />
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isLoading}
        >
          <ChevronLeftIcon className="mr-1 h-4 w-4" />
          Atrás
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : currentStep === 4 ? (
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
