import Link from "next/link";
import { Button } from "@wifo/ui/button";

export function FacilityHeader() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Perfil del Local
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Información de tu local visible para los jugadores
        </p>
      </div>
      <Button asChild>
        <Link href="/facility/edit">
          <PencilIcon className="h-4 w-4" />
          Editar Perfil
        </Link>
      </Button>
    </header>
  );
}

function PencilIcon({ className }: { className?: string }) {
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
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}
