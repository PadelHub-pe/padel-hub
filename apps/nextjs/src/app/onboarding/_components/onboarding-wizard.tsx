"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@wifo/ui/button";
import { Card, CardContent } from "@wifo/ui/card";

import type { FacilityInfoData } from "./step-facility-info";
import type { PhotosData } from "./step-photos";
import type { CourtsData } from "./step-courts";
import type { ScheduleData } from "./step-schedule";

import { useTRPC } from "~/trpc/react";
import { StepIndicator } from "./step-indicator";
import { StepFacilityInfo } from "./step-facility-info";
import { StepPhotos } from "./step-photos";
import { StepCourts } from "./step-courts";
import { StepSchedule } from "./step-schedule";

// Initial data for all steps
const INITIAL_FACILITY_INFO: FacilityInfoData = {
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

const INITIAL_COURTS: CourtsData = {
  courts: [],
};

const INITIAL_SCHEDULE: ScheduleData = {
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
  const [facilityInfo, setFacilityInfo] =
    useState<FacilityInfoData>(INITIAL_FACILITY_INFO);
  const [photos, setPhotos] = useState<PhotosData>(INITIAL_PHOTOS);
  const [courts, setCourts] = useState<CourtsData>(INITIAL_COURTS);
  const [schedule, setSchedule] = useState<ScheduleData>(INITIAL_SCHEDULE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

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
    })
  );

  function validateStep1(): boolean {
    const newErrors: Record<string, string> = {};

    if (!facilityInfo.name.trim() || facilityInfo.name.length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    }
    if (!facilityInfo.address.trim() || facilityInfo.address.length < 5) {
      newErrors.address = "La dirección debe tener al menos 5 caracteres";
    }
    if (!facilityInfo.district.trim()) {
      newErrors.district = "El distrito es requerido";
    }
    if (!facilityInfo.phone.trim() || facilityInfo.phone.length < 6) {
      newErrors.phone = "El teléfono debe tener al menos 6 caracteres";
    }
    if (
      facilityInfo.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(facilityInfo.email)
    ) {
      newErrors.email = "Email inválido";
    }
    if (
      facilityInfo.website &&
      !/^https?:\/\/.+/.test(facilityInfo.website)
    ) {
      newErrors.website = "URL inválida (debe comenzar con http:// o https://)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep3(): boolean {
    const newErrors: Record<string, string> = {};

    if (courts.courts.length === 0) {
      newErrors.courts = "Debe agregar al menos una cancha";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep4(): boolean {
    const newErrors: Record<string, string> = {};

    const price = parseFloat(schedule.defaultPriceInSoles);
    if (!schedule.defaultPriceInSoles || isNaN(price) || price < 1) {
      newErrors.price = "El precio debe ser mayor a S/ 1.00";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleNext() {
    setErrors({});
    setIsLoading(true);

    try {
      if (currentStep === 1) {
        if (!validateStep1()) {
          setIsLoading(false);
          return;
        }
        await saveFacilityInfo.mutateAsync({
          name: facilityInfo.name,
          description: facilityInfo.description || undefined,
          address: facilityInfo.address,
          district: facilityInfo.district,
          city: facilityInfo.city,
          phone: facilityInfo.phone,
          email: facilityInfo.email || undefined,
          website: facilityInfo.website || undefined,
          amenities: facilityInfo.amenities,
        });
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Photos are optional, just save whatever we have
        await savePhotos.mutateAsync({ photos: photos.photos });
        setCurrentStep(3);
      } else if (currentStep === 3) {
        if (!validateStep3()) {
          setIsLoading(false);
          return;
        }
        await saveCourts.mutateAsync({
          courts: courts.courts.map((c) => ({
            name: c.name,
            type: c.type,
          })),
        });
        setCurrentStep(4);
      } else if (currentStep === 4) {
        if (!validateStep4()) {
          setIsLoading(false);
          return;
        }
        // Save schedule
        await saveSchedule.mutateAsync({
          operatingHours: schedule.operatingHours.map((oh) => ({
            dayOfWeek: oh.dayOfWeek,
            openTime: oh.openTime,
            closeTime: oh.closeTime,
            isClosed: oh.isClosed,
          })),
          defaultDurationMinutes: schedule.defaultDurationMinutes,
          defaultPriceInCents: Math.round(
            parseFloat(schedule.defaultPriceInSoles) * 100
          ),
        });
        // Complete onboarding
        await completeOnboarding.mutateAsync();
      }
    } catch (error) {
      console.error("Error saving step:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Ocurrió un error. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleBack() {
    setErrors({});
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
          {errors.general && (
            <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          {currentStep === 1 && (
            <StepFacilityInfo
              data={facilityInfo}
              onChange={setFacilityInfo}
              errors={errors}
            />
          )}
          {currentStep === 2 && (
            <StepPhotos data={photos} onChange={setPhotos} />
          )}
          {currentStep === 3 && (
            <StepCourts data={courts} onChange={setCourts} errors={errors} />
          )}
          {currentStep === 4 && (
            <StepSchedule
              data={schedule}
              onChange={setSchedule}
              errors={errors}
            />
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
