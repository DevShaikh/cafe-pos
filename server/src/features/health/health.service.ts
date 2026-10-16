import { AppError } from "../../errors/app-error.js";

export interface DatabaseHealthRepository {
  checkConnection(): Promise<void>;
}

export interface HealthServiceContract {
  checkDatabase(): Promise<void>;
}

export class HealthService implements HealthServiceContract {
  constructor(private readonly database: DatabaseHealthRepository) {}

  async checkDatabase(): Promise<void> {
    try {
      await this.database.checkConnection();
    } catch (error) {
      throw new AppError(
        503,
        "DATABASE_UNAVAILABLE",
        "The database is unavailable.",
        { cause: error },
      );
    }
  }
}
