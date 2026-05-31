import { prisma } from '../index';
import { sendDelayAlert, sendSecondCall, sendEmergency } from '../services/notificationService';

export async function startMonitoringJob() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const respondents = await prisma.user.findMany({
    where: { role: 'RESPONDENTE' },
    include: {
      settings: true,
      checkins: { where: { date: today }, take: 1 },
      caregiverLinks: { where: { status: 'ACTIVE' }, include: { caregiver: { include: { user: true } } } }
    }
  });

  for (const resp of respondents) {
    const settings = resp.settings;
    if (!settings) continue;

    const deadline = new Date(today);
    deadline.setHours(settings.regularDeadlineHour, settings.regularDeadlineMinute, 0);

    const checkin = resp.checkins[0];
    const alreadyConfirmed = checkin && checkin.status === 'CONFIRMED';
    if (alreadyConfirmed) continue;

    const nowDate = new Date();
    const isAfterDeadline = nowDate > deadline;
    if (!isAfterDeadline) continue;

    if (!checkin || checkin.status === 'PENDING') {
      await prisma.checkin.upsert({
        where: { id: checkin?.id || '' },
        update: { status: 'DELAYED' },
        create: { respondentId: resp.id, date: today, status: 'DELAYED', checkedAt: null }
      });

      for (const link of resp.caregiverLinks) {
        await sendDelayAlert(link.caregiver.user, resp, deadline);
      }

      if (settings.secondaryCallEnabled) {
        const secondCallTime = new Date(deadline.getTime() + settings.secondaryCallDelayMinutes * 60000);
        console.log(`[SCHEDULE] Second call for ${resp.email} at ${secondCallTime}`);
      }
    } else if (checkin.status === 'DELAYED') {
      const firstDelayStart = checkin.createdAt;
      const elapsed = (nowDate.getTime() - firstDelayStart.getTime()) / 60000;
      const secondDelay = settings.secondaryCallEnabled ? settings.secondaryCallDelayMinutes : 0;

      if (settings.secondaryCallEnabled && elapsed >= secondDelay && elapsed < secondDelay + 1) {
        await sendSecondCall(resp);
      } else if (elapsed >= (secondDelay + 20)) {
        await prisma.checkin.update({
          where: { id: checkin.id },
          data: { status: 'MISSED' }
        });
        for (const link of resp.caregiverLinks) {
          await sendEmergency(link.caregiver.user, resp);
        }
      }
    }
  }
}