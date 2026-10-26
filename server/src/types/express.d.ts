type StaffRole = "ADMIN" | "MANAGER" | "CASHIER";

declare global {
  namespace Express {
    interface Request {
      authenticatedStaff?: {
        id: string;
        name: string;
        role: StaffRole;
      };
    }
  }
}

export {};
