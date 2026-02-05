"use client";

import type { PhotosData } from "./onboarding-wizard";

interface StepPhotosProps {
  data: PhotosData;
  onChange: (data: PhotosData) => void;
}

export function StepPhotos({ data: _data, onChange: _onChange }: StepPhotosProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Fotos del Local
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Agrega fotos de tus canchas e instalaciones para atraer más jugadores.
        </p>
      </div>

      {/* Placeholder for photo upload */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <CameraIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          Subir fotos
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Arrastra y suelta fotos aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-gray-400">
          PNG, JPG hasta 5MB cada una
        </p>
      </div>

      {/* Skip message */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <InfoIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Este paso es opcional
            </p>
            <p className="mt-1 text-sm text-blue-700">
              Puedes agregar fotos más tarde desde tu perfil. Haz clic en
              &quot;Siguiente&quot; para continuar sin fotos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
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
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
