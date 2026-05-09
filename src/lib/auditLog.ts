/**
 * Admin Audit Logger
 * Logs all admin actions to the database for compliance and tracking
 * Falls back to file logging if database is unavailable
 */

import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "VIEW" | "EXPORT";

interface AuditLogInput {
  adminId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValue?: object;
  newValue?: object;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

interface AuditLogEntry {
  timestamp: string;
  adminId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: string;
}

// Fallback file path for audit logs
const FALLBACK_LOG_PATH = path.join(process.cwd(), "logs", "audit.log");

function ensureLogDir(): void {
  const logDir = path.dirname(FALLBACK_LOG_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function writeFallbackLog(entry: AuditLogEntry): void {
  try {
    ensureLogDir();
    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(FALLBACK_LOG_PATH, line);
  } catch {
    // Silently fail if we can't write to fallback
  }
}

// Sanitize sensitive fields from objects
function sanitizeData(obj: object | undefined): object | undefined {
  if (!obj) return undefined;

  const sensitiveFields = [
    "password", "token", "secret", "apiKey", "authorization",
    "bearer", "credential", "creditCard", "ssn", "accessToken",
    "refreshToken", "privateKey", "midtransServerKey"
  ];

  const sanitized = { ...obj } as Record<string, unknown>;

  for (const field of sensitiveFields) {
    if (field in sanitized && typeof sanitized[field] === "string") {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}

export async function logAudit(data: AuditLogInput) {
  const sanitizedData = {
    ...data,
    oldValue: sanitizeData(data.oldValue),
    newValue: sanitizeData(data.newValue),
  };

  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: sanitizedData.adminId,
        action: sanitizedData.action,
        entityType: sanitizedData.entityType,
        entityId: sanitizedData.entityId || null,
        oldValue: sanitizedData.oldValue as any,
        newValue: sanitizedData.newValue as any,
        ipAddress: sanitizedData.ipAddress || null,
        userAgent: sanitizedData.userAgent || null,
        details: sanitizedData.details || null,
      },
    });
    return true;
  } catch (error) {
    // Fallback to file logging
    writeFallbackLog({
      timestamp: new Date().toISOString(),
      adminId: sanitizedData.adminId,
      action: sanitizedData.action,
      entityType: sanitizedData.entityType,
      entityId: sanitizedData.entityId,
      details: sanitizedData.details,
    });

    // Still log error to console for monitoring
    console.error("Audit log DB error, logged to fallback:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}

// Helper for CRUD operations with automatic logging
export async function auditedCreate<T>(
  adminId: string,
  entityType: string,
  data: T,
  createFn: () => Promise<T>
) {
  const result = await createFn();
  const id = (result as any).id || (result as any).id;

  await logAudit({
    adminId,
    action: "CREATE",
    entityType,
    entityId: id,
    newValue: sanitizeData(data as object) as object,
    details: `Created ${entityType}`,
  });

  return result;
}

export async function auditedUpdate<T>(
  adminId: string,
  entityType: string,
  entityId: string,
  oldData: T,
  newData: T,
  updateFn: () => Promise<T>
) {
  const result = await updateFn();

  await logAudit({
    adminId,
    action: "UPDATE",
    entityType,
    entityId,
    oldValue: sanitizeData(oldData as object) as object,
    newValue: sanitizeData(newData as object) as object,
    details: `Updated ${entityType}`,
  });

  return result;
}

export async function auditedDelete(
  adminId: string,
  entityType: string,
  entityId: string,
  deleteFn: () => Promise<void>
) {
  await deleteFn();

  await logAudit({
    adminId,
    action: "DELETE",
    entityType,
    entityId,
    details: `Deleted ${entityType}`,
  });
}

// Get audit logs with filters
export async function getAuditLogs(params: {
  adminId?: string;
  entityType?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  take?: number;
  skip?: number;
}) {
  const { adminId, entityType, action, startDate, endDate, take = 50, skip = 0 } = params;

  const where: any = {};

  if (adminId) where.adminId = adminId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return { logs, total };
}

// Import fallback logs (for recovery after DB outage)
export async function importFallbackLogs(): Promise<number> {
  if (!fs.existsSync(FALLBACK_LOG_PATH)) {
    return 0;
  }

  const content = fs.readFileSync(FALLBACK_LOG_PATH, "utf-8");
  const lines = content.split("\n").filter(Boolean);
  let imported = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as AuditLogEntry & {
        oldValue?: object;
        newValue?: object;
        ipAddress?: string;
        userAgent?: string;
      };

      await prisma.adminAuditLog.create({
        data: {
          adminId: entry.adminId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId || null,
          oldValue: entry.oldValue as any,
          newValue: entry.newValue as any,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
          details: entry.details || null,
        },
      });
      imported++;
    } catch {
      // Skip invalid entries
    }
  }

  if (imported > 0) {
    // Backup and clear fallback log after successful import
    const backupPath = FALLBACK_LOG_PATH + ".backup";
    fs.renameSync(FALLBACK_LOG_PATH, backupPath);

    // Keep last 100 lines of backup
    const backupContent = fs.readFileSync(backupPath, "utf-8");
    const backupLines = backupContent.split("\n").filter(Boolean);
    if (backupLines.length > 100) {
      fs.writeFileSync(backupPath, backupLines.slice(-100).join("\n"));
    }
  }

  return imported;
}
