import prisma from "@/lib/prisma";

// Base class with common methods
export class BaseRepository {
  protected get prisma() {
    return prisma;
  }

  async transaction<T>(callback: (tx: typeof prisma) => Promise<T>): Promise<T> {
    return prisma.$transaction(callback as any) as Promise<T>;
  }
}

export type PaginationOptions = {
  page?: number;
  limit?: number;
  orderBy?: Record<string, "asc" | "desc">;
};

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}