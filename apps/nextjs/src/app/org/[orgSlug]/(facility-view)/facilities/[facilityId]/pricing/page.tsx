export default function FacilityPricingPage() {
  return (
    <div className="p-8">
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <CurrencyIcon className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Precios
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Próximamente podrás configurar los precios de las canchas aquí.
        </p>
      </div>
    </div>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
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
        d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
