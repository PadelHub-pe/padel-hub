import { authRouter } from "./router/auth";
import { bookingRouter } from "./router/booking";
import { calendarRouter } from "./router/calendar";
import { courtRouter } from "./router/court";
import { dashboardRouter } from "./router/dashboard";
import { facilityRouter } from "./router/facility";
import { ownerRouter } from "./router/owner";
import { postRouter } from "./router/post";
import { publicFacilityRouter } from "./router/public-facility";
import { publicLeadRouter } from "./router/public-lead";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  booking: bookingRouter,
  calendar: calendarRouter,
  court: courtRouter,
  dashboard: dashboardRouter,
  facility: facilityRouter,
  owner: ownerRouter,
  post: postRouter,
  publicFacility: publicFacilityRouter,
  publicLead: publicLeadRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
