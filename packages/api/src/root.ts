import { authRouter } from "./router/auth";
import { courtRouter } from "./router/court";
import { dashboardRouter } from "./router/dashboard";
import { facilityRouter } from "./router/facility";
import { ownerRouter } from "./router/owner";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  court: courtRouter,
  dashboard: dashboardRouter,
  facility: facilityRouter,
  owner: ownerRouter,
  post: postRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
