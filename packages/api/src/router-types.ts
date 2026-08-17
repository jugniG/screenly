import type { RouterClient } from '@orpc/server'
import type router from './router/index.ts'
export type AppRouter = RouterClient<typeof router>
