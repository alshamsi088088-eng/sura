import { prisma } from './prisma.js';
import { Prisma } from '@prisma/client';

export interface AuditLogInput {
  actorId?: string | null;
  action: string;
  target?: string | null;
  targetId?: string | null;
  details?: Prisma.InputJsonValue | null;
}

/**
 * Write a single audit log entry. Never throws — audit logging must not
 * break the primary request flow.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const auditLog = (prisma as any).auditLog;

    await auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        target: input.target ?? null,
        targetId: input.targetId ?? null,
        details: input.details ?? null,
      },
    });
  } catch (error) {
    console.error('[auditLogService] writeAuditLog error:', error);
  }
}

export interface AuditLogFilter {
  action?: string;
  target?: string;
  actorId?: string;
  search?: string;
}

export async function listAuditLogs(filter: AuditLogFilter, page = 1, limit = 50) {
  const where: Prisma.AuditLogWhereInput = {};

  if (filter.action) {
    where.action = { contains: filter.action, mode: 'insensitive' };
  }

  if (filter.target) {
    where.target = filter.target;
  }

  if (filter.actorId) {
    where.actorId = filter.actorId;
  }

  if (filter.search) {
    where.OR = [
      { action: { contains: filter.search, mode: 'insensitive' } },
      { target: { contains: filter.search, mode: 'insensitive' } },
      { targetId: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
