import { authRouter } from "./router/auth";
import { dashboardRouter } from "./router/dashboard";
import { facilityRouter } from "./router/facility";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  dashboard: dashboardRouter,
  facility: facilityRouter,
  post: postRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
