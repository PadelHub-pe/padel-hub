import { authRouter } from "./router/auth";
import { dashboardRouter } from "./router/dashboard";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  dashboard: dashboardRouter,
  post: postRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
