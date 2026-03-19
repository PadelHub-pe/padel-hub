"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { parse } from "date-fns";

import { useFacilityContext } from "~/hooks";
import { useTRPC } from "~/trpc/react";
import { BookingDetailDrawer } from "./booking-detail-drawer";
import { BookingsFilters } from "./bookings-filters";
import { BookingsHeader } from "./bookings-header";
import { BookingsPagination } from "./bookings-pagination";
import { BookingsTable } from "./bookings-table";
import { CreateBookingDialog } from "./create-booking-dialog";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "open_match";

type SortBy = "date" | "time" | "court" | "price" | "status";
type SortOrder = "asc" | "desc";

const validStatuses = new Set<BookingStatus>([
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "open_match",
]);

const validSortBy = new Set<SortBy>([
  "date",
  "time",
  "court",
  "price",
  "status",
]);

function parseStatuses(value: string | null): BookingStatus[] {
  if (!value) return [];
  return value
    .split(",")
    .filter((s): s is BookingStatus => validStatuses.has(s as BookingStatus));
}

function parseSortBy(value: string | null): SortBy | undefined {
  return value && validSortBy.has(value as SortBy)
    ? (value as SortBy)
    : undefined;
}

function parseSortOrder(value: string | null): SortOrder | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isNaN(d.getTime()) ? undefined : d;
}

function formatDateParam(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

export function BookingsView() {
  const trpc = useTRPC();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { facilityId, basePath } = useFacilityContext();

  // Read filters from URL
  const search = searchParams.get("q") ?? "";
  const courtId = searchParams.get("court") ?? undefined;
  const statuses = parseStatuses(searchParams.get("status"));
  const dateFrom = parseDateParam(searchParams.get("from"));
  const dateTo = parseDateParam(searchParams.get("to"));
  const sortBy = parseSortBy(searchParams.get("sortBy"));
  const sortOrder = parseSortOrder(searchParams.get("sortOrder"));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = 10;

  // Build date range for API
  const dateRange =
    dateFrom && dateTo ? { start: dateFrom, end: dateTo } : undefined;

  // Selected booking for detail drawer
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );

  // Create booking dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const { data: courts } = useSuspenseQuery(
    trpc.court.list.queryOptions({ facilityId }),
  );
  const {
    data: bookingsData,
    refetch,
    isFetching,
  } = useQuery({
    ...trpc.booking.list.queryOptions({
      facilityId,
      search: search || undefined,
      courtId,
      status: statuses.length > 0 ? statuses : undefined,
      dateRange,
      sortBy,
      sortOrder,
      page,
      limit,
    }),
    placeholderData: keepPreviousData,
  });

  const handleSearchChange = useCallback(
    (value: string) => {
      updateParams({ q: value || undefined, page: undefined });
    },
    [updateParams],
  );

  const handleCourtChange = useCallback(
    (value: string | undefined) => {
      updateParams({ court: value, page: undefined });
    },
    [updateParams],
  );

  const handleStatusChange = useCallback(
    (values: BookingStatus[]) => {
      updateParams({
        status: values.length > 0 ? values.join(",") : undefined,
        page: undefined,
      });
    },
    [updateParams],
  );

  const handleDateRangeChange = useCallback(
    (from: Date | undefined, to: Date | undefined) => {
      updateParams({
        from: from ? formatDateParam(from) : undefined,
        to: to ? formatDateParam(to) : undefined,
        page: undefined,
      });
    },
    [updateParams],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage > 1 ? String(newPage) : undefined });
    },
    [updateParams],
  );

  const handleClearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const handleBookingClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
  };

  const handleCloseDrawer = () => {
    setSelectedBookingId(null);
  };

  const handleBookingUpdated = () => {
    void refetch();
  };

  return (
    <div className="p-8">
      <BookingsHeader onAddBooking={() => setShowCreateDialog(true)} />

      <div className="mt-6">
        <BookingsFilters
          search={search}
          onSearchChange={handleSearchChange}
          courtId={courtId}
          onCourtChange={handleCourtChange}
          statuses={statuses}
          onStatusChange={handleStatusChange}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateRangeChange={handleDateRangeChange}
          courts={courts}
          onClearFilters={handleClearFilters}
        />
      </div>

      <div className={`mt-6 ${isFetching && bookingsData ? "opacity-60" : ""}`}>
        <BookingsTable
          bookings={bookingsData?.bookings ?? []}
          onBookingClick={handleBookingClick}
          onBookingUpdated={handleBookingUpdated}
          basePath={basePath}
          hasActiveFilters={
            statuses.length > 0 ||
            Boolean(courtId) ||
            Boolean(search) ||
            Boolean(dateFrom)
          }
        />
      </div>

      <div className="mt-4">
        <BookingsPagination
          page={page}
          totalPages={bookingsData?.totalPages ?? 1}
          total={bookingsData?.total ?? 0}
          limit={limit}
          onPageChange={handlePageChange}
        />
      </div>

      <BookingDetailDrawer
        bookingId={selectedBookingId}
        open={selectedBookingId !== null}
        onClose={handleCloseDrawer}
        onBookingUpdated={handleBookingUpdated}
      />

      <CreateBookingDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onBookingCreated={handleBookingUpdated}
      />
    </div>
  );
}
