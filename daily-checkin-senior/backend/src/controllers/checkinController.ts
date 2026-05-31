import { Request, Response } from 'express';
import { prisma } from '../index';

export async function createCheckin(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const existing = await prisma.checkin.findFirst({
      where: { respondentId: userId, date: today, status: 'CONFIRMED' }
    });
    if (existing) {
      return res.status(400).json({ msg: 'Check-in já realizado hoje' });
    }

    const checkin = await prisma.checkin.create({
      data: {
        respondentId: userId,
        date: today,
        status: 'CONFIRMED',
        checkedAt: new Date()
      }
    });
    res.status(201).json({ msg: 'Obrigado! Tenha um ótimo dia.', checkin });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function getTodayStatus(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const checkin = await prisma.checkin.findFirst({
      where: { respondentId: userId, date: today, status: 'CONFIRMED' }
    });
    res.json({ confirmed: !!checkin });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}