export default function FacilitySchedulePage() {
  return (
    <div className="p-8">
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <ClockIcon className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Horarios
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Próximamente podrás gestionar los horarios de operación aquí.
        </p>
      </div>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
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
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
