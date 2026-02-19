import { accountRouter } from "./router/account";
import { authRouter } from "./router/auth";
import { bookingRouter } from "./router/booking";
import { calendarRouter } from "./router/calendar";
import { courtRouter } from "./router/court";
import { dashboardRouter } from "./router/dashboard";
import { facilityRouter } from "./router/facility";
import { inviteRouter } from "./router/invite";
import { orgRouter } from "./router/org";
import { postRouter } from "./router/post";
import { pricingRouter } from "./router/pricing";
import { scheduleRouter } from "./router/schedule";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  account: accountRouter,
  auth: authRouter,
  booking: bookingRouter,
  calendar: calendarRouter,
  court: courtRouter,
  dashboard: dashboardRouter,
  facility: facilityRouter,
  invite: inviteRouter,
  org: orgRouter,
  post: postRouter,
  pricing: pricingRouter,
  schedule: scheduleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
