export type DairyRole = "OWNER" | "MANAGER" | "DRIVER" | "SELLER";

export interface AuthContext {
  sessionId: string;
  userId: string;
  email: string;
  displayName: string;
  dairyId: string;
  role: DairyRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}
