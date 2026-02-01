import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { Sidebar } from "./_components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // For MVP, use a placeholder facility name
  // In production, this would come from the user's facility relationship
  const facilityName = "Mi Centro de Padel";

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        facilityName={facilityName}
        userEmail={session.user.email}
        userName={session.user.name}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
