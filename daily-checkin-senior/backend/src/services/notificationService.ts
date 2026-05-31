import { User } from '@prisma/client';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Condicional: só inicializa o Twilio se as credenciais estiverem presentes
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'xxx' &&
    process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_AUTH_TOKEN !== 'xxx') {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('[Twilio] Cliente inicializado');
} else {
  console.log('[Twilio] Credenciais não configuradas, notificações WhatsApp/SMS desabilitadas');
}

const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

export async function sendDelayAlert(caregiver: User, respondent: User, deadline: Date) {
  const message = `Seu idoso ${respondent.name} ainda não realizou o check-in. Prazo: ${deadline.toLocaleTimeString()}`;
  await sendViaChannels(caregiver, message, 'ALERTA DE ATRASO');
}

export async function sendSecondCall(respondent: User) {
  console.log(`[PUSH] Notificação secundária enviada para ${respondent.email}: "Por favor, confirme seu bem-estar."`);
}

export async function sendEmergency(caregiver: User, respondent: User) {
  const message = `EMERGÊNCIA: ${respondent.name} não respondeu ao check-in diário. Aja imediatamente.`;
  await sendViaChannels(caregiver, message, 'EMERGÊNCIA');
}

async function sendViaChannels(user: User, message: string, subject: string) {
  // E-mail (sempre, desde que configurado)
  try {
    await emailTransporter.sendMail({
      from: 'noreply@dailycheckin.com',
      to: user.email,
      subject,
      text: message,
    });
    console.log(`[EMAIL] Enviado para ${user.email}: ${message}`);
  } catch (err) {
    console.error(`[EMAIL] Falha ao enviar para ${user.email}:`, err);
  }

  // WhatsApp/SMS (apenas se Twilio configurado)
  if (twilioClient && user.phone) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${user.phone}`
      });
      console.log(`[WHATSAPP] Enviado para ${user.phone}`);
    } catch (err) {
      console.error(`[WHATSAPP] Falha:`, err);
    }
  }
}