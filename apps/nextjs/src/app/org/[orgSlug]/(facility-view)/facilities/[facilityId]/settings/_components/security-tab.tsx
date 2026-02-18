"use client";

import { Badge } from "@wifo/ui/badge";
import { Button } from "@wifo/ui/button";

export function SecurityTab() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>
          <Badge variant="secondary">Próximamente</Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Administra la seguridad de tu cuenta
        </p>
      </div>

      <div className="space-y-4">
        {/* Password */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
              <LockIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Contraseña</p>
              <p className="text-xs text-gray-500">
                Última actualización hace 30 días
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            Cambiar Contraseña
          </Button>
        </div>

        {/* 2FA */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
              <ShieldIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Autenticación de Dos Factores
              </p>
              <p className="text-xs text-gray-500">
                Agrega una capa extra de seguridad a tu cuenta
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            Activar 2FA
          </Button>
        </div>

        {/* Sessions */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
              <DevicesIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Sesiones Activas
              </p>
              <p className="text-xs text-gray-500">
                1 dispositivo conectado actualmente
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            Gestionar Sesiones
          </Button>
        </div>
      </div>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
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
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
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
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    </svg>
  );
}

function DevicesIcon({ className }: { className?: string }) {
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
        d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z"
      />
    </svg>
  );
}
