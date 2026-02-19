import { Suspense } from "react";

import { GateForm } from "./_components/gate-form";

export default function GatePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense>
        <GateForm />
      </Suspense>
    </div>
  );
}
