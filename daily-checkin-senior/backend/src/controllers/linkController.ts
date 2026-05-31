import { Request, Response } from 'express';
import { prisma } from '../index';

export async function requestLink(req: Request, res: Response) {
  const { respondentId } = req.body;
  const caregiverId = (req as any).user.id;
  const existing = await prisma.linkRequest.findFirst({
    where: { senderId: caregiverId, receiverId: respondentId, status: 'PENDING' }
  });
  if (existing) return res.status(400).json({ msg: 'Solicitação já enviada' });
  const request = await prisma.linkRequest.create({
    data: { senderId: caregiverId, receiverId: respondentId, status: 'PENDING' }
  });
  res.json(request);
}

export async function acceptLink(req: Request, res: Response) {
  const { requestId } = req.body;
  const respondentId = (req as any).user.id;
  const request = await prisma.linkRequest.findUnique({ where: { id: requestId } });
  if (!request || request.receiverId !== respondentId) return res.status(403).json({ msg: 'Não autorizado' });
  await prisma.linkRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } });
  await prisma.caregiverLink.create({
    data: { caregiverId: request.senderId, respondentId, status: 'ACTIVE' }
  });
  res.json({ msg: 'Vínculo aceito' });
}