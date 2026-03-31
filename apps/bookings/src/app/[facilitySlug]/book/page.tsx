import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ facilitySlug: string }>;
  searchParams: Promise<{ date?: string }>;
}

/**
 * Redirect /book to the landing page which now shows availability directly.
 * Preserves the date param for backwards compatibility with existing links.
 */
export default async function BookPage({ params, searchParams }: PageProps) {
  const { facilitySlug } = await params;
  const { date } = await searchParams;

  const target = date ? `/${facilitySlug}?date=${date}` : `/${facilitySlug}`;

  redirect(target);
}
