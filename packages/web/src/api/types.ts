import type { auth } from './auth';

type Session = typeof auth.$Infer.Session.session;
type User    = typeof auth.$Infer.Session.user;

export type AppEnv = {
  Variables: {
    user:    User    | null;
    session: Session | null;
  };
};
