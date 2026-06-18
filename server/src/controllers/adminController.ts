
import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

export async function getOverview(_req: Request, res: Response) {
  const users = await prisma.user.count();
  const orders = await prisma.order.count();
  const revenueData = await prisma.order.findMany({ select: { total: true } });
  const revenue = revenueData.reduce((sum: number, order: { total: number }) => sum + order.total, 0).toFixed(2);
  const traffic = [
    { day: 'Mon', visitors: 150 },
    { day: 'Tue', visitors: 190 },
    { day: 'Wed', visitors: 210 },
    { day: 'Thu', visitors: 180 },
    { day: 'Fri', visitors: 220 },
    { day: 'Sat', visitors: 240 },
    { day: 'Sun', visitors: 260 }
  ];
  res.json({ users, revenue, traffic, orders });
}
