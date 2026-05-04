/**
 * Admin Audit Logger
 * Logs all admin actions to the database for compliance and tracking
 */

import prisma from "@/lib/prisma";

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

export async function logAudit(data: AuditLogInput) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: data.adminId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        oldValue: data.oldValue ? data.oldValue as any : undefined,
        newValue: data.newValue ? data.newValue as any : undefined,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        details: data.details || null,
      },
    });
    return true;
  } catch (error) {
    console.error("Audit log error:", error);
    // Don't throw - audit logging should not break main flow
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
    newValue: data as object,
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
    oldValue: oldData as object,
    newValue: newData as object,
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
