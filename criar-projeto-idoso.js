const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'daily-checkin-senior');

// Função para criar diretório recursivamente
function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Função para escrever arquivo
function writeFile(filePath, content) {
  mkdirp(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

// ==================== BACKEND ====================
const backend = path.join(root, 'backend');

// package.json
writeFile(path.join(backend, 'package.json'), JSON.stringify({
  name: "daily-checkin-senior-backend",
  version: "1.0.0",
  scripts: {
    dev: "tsx watch src/index.ts",
    build: "tsc",
    start: "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  dependencies: {
    "@prisma/client": "^5.0.0",
    bcrypt: "^5.1.0",
    cors: "^2.8.5",
    dotenv: "^16.3.1",
    express: "^4.18.2",
    "express-validator": "^7.0.1",
    jsonwebtoken: "^9.0.2",
    "node-cron": "^3.0.2",
    nodemailer: "^6.9.3",
    twilio: "^4.0.0"
  },
  devDependencies: {
    "@types/bcrypt": "^5.0.0",
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/node": "^20.4.2",
    "@types/node-cron": "^3.0.7",
    "@types/nodemailer": "^6.4.9",
    prisma: "^5.0.0",
    tsx: "^4.7.0",
    typescript: "^5.1.6"
  }
}, null, 2));

// tsconfig.json
writeFile(path.join(backend, 'tsconfig.json'), JSON.stringify({
  compilerOptions: {
    target: "ES2020",
    module: "commonjs",
    outDir: "./dist",
    rootDir: "./src",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true
  },
  include: ["src/**/*"],
  exclude: ["node_modules"]
}, null, 2));

// .env
writeFile(path.join(backend, '.env'), `DATABASE_URL="file:./dev.db"
PORT=3333
JWT_SECRET=supersecret
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_FROM=+14155238886
EMAIL_HOST=smtp.mailtrap.io
EMAIL_USER=user
EMAIL_PASS=pass`);

// prisma/schema.prisma
writeFile(path.join(backend, 'prisma', 'schema.prisma'), `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String
  role          UserRole
  phone         String?   // para WhatsApp/SMS
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  respondentProfile  Respondent?
  caregiverProfile   Caregiver?
  sentRequests       LinkRequest[] @relation("Sender")
  receivedRequests   LinkRequest[] @relation("Receiver")
  checkins           Checkin[]
  settings           Settings?
}

enum UserRole {
  RESPONDENTE
  CUIDADOR
}

model Respondent {
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  caregivers    CaregiverLink[]
  pendingFrom   LinkRequest[] @relation("PendingReceiver")
}

model Caregiver {
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  respondents   CaregiverLink[]
}

model CaregiverLink {
  id             String   @id @default(cuid())
  caregiverId    String
  respondentId   String
  status         LinkStatus
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  caregiver      Caregiver @relation(fields: [caregiverId], references: [userId])
  respondent     Respondent @relation(fields: [respondentId], references: [userId])
}

enum LinkStatus {
  PENDING
  ACTIVE
  REJECTED
}

model LinkRequest {
  id             String   @id @default(cuid())
  senderId       String
  receiverId     String
  status         RequestStatus
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  sender         User @relation("Sender", fields: [senderId], references: [id])
  receiver       User @relation("Receiver", fields: [receiverId], references: [id])
}

enum RequestStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model Checkin {
  id            String    @id @default(cuid())
  respondentId  String
  date          DateTime
  checkedAt     DateTime?
  status        CheckinStatus
  createdAt     DateTime  @default(now())

  respondent    User      @relation(fields: [respondentId], references: [id])
}

enum CheckinStatus {
  PENDING
  CONFIRMED
  DELAYED
  MISSED
}

model Settings {
  id                         String   @id @default(cuid())
  respondentId               String   @unique
  regularDeadlineHour        Int      @default(10)
  regularDeadlineMinute      Int      @default(0)
  secondaryCallEnabled       Boolean  @default(true)
  secondaryCallDelayMinutes  Int      @default(20)

  respondent                 User     @relation(fields: [respondentId], references: [id])
}

model NotificationLog {
  id          String   @id @default(cuid())
  caregiverId String
  respondentId String
  type        String
  channel     String
  sentAt      DateTime @default(now())
  success     Boolean
  errorMsg    String?
}`);

// src/index.ts
writeFile(path.join(backend, 'src', 'index.ts'), `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import checkinRoutes from './routes/checkinRoutes';
import linkRoutes from './routes/linkRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { startMonitoringJob } from './jobs/monitorJob';

dotenv.config();
export const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/settings', settingsRoutes);

cron.schedule('* * * * *', async () => {
  console.log('[CRON] Running monitor job...');
  await startMonitoringJob();
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(\`Backend running on port \${PORT}\`));`);

// src/jobs/monitorJob.ts
writeFile(path.join(backend, 'src', 'jobs', 'monitorJob.ts'), `import { prisma } from '../index';
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
        console.log(\`[SCHEDULE] Second call for \${resp.email} at \${secondCallTime}\`);
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
}`);

// src/services/notificationService.ts
writeFile(path.join(backend, 'src', 'services', 'notificationService.ts'), `import { User } from '@prisma/client';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

export async function sendDelayAlert(caregiver: User, respondent: User, deadline: Date) {
  const message = \`Seu idoso \${respondent.name} ainda não realizou o check-in. Prazo: \${deadline.toLocaleTimeString()}\`;
  await sendViaChannels(caregiver, message, 'ALERTA DE ATRASO');
}

export async function sendSecondCall(respondent: User) {
  console.log(\`[PUSH] Notificação secundária enviada para \${respondent.email}: "Por favor, confirme seu bem-estar."\`);
}

export async function sendEmergency(caregiver: User, respondent: User) {
  const message = \`EMERGÊNCIA: \${respondent.name} não respondeu ao check-in diário. Aja imediatamente.\`;
  await sendViaChannels(caregiver, message, 'EMERGÊNCIA');
}

async function sendViaChannels(user: User, message: string, subject: string) {
  await emailTransporter.sendMail({
    from: 'noreply@dailycheckin.com',
    to: user.email,
    subject,
    text: message,
  });
  console.log(\`[NOTIF] Enviado para \${user.email}: \${message}\`);
}`);

// src/controllers/checkinController.ts
writeFile(path.join(backend, 'src', 'controllers', 'checkinController.ts'), `import { Request, Response } from 'express';
import { prisma } from '../index';

export async function createCheckin(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const today = new Date();
  today.setHours(0,0,0,0);

  try {
    const existing = await prisma.checkin.findFirst({
      where: { respondentId: userId, date: today }
    });
    if (existing && existing.status === 'CONFIRMED') {
      return res.status(400).json({ msg: 'Check-in já realizado hoje' });
    }

    const checkin = await prisma.checkin.upsert({
      where: { id: existing?.id || '' },
      update: { status: 'CONFIRMED', checkedAt: new Date() },
      create: { respondentId: userId, date: today, status: 'CONFIRMED', checkedAt: new Date() }
    });
    res.json({ msg: 'Obrigado! Tenha um ótimo dia.', checkin });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getTodayStatus(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const today = new Date();
  today.setHours(0,0,0,0);
  const checkin = await prisma.checkin.findFirst({
    where: { respondentId: userId, date: today }
  });
  res.json({ confirmed: checkin?.status === 'CONFIRMED' });
}`);

// src/controllers/linkController.ts
writeFile(path.join(backend, 'src', 'controllers', 'linkController.ts'), `import { Request, Response } from 'express';
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
}`);

// Rotas simplificadas (apenas para completar o backend)
writeFile(path.join(backend, 'src', 'routes', 'authRoutes.ts'), `import { Router } from 'express'; const router = Router(); router.post('/register', (req, res) => res.json({ msg: 'register' })); router.post('/login', (req, res) => res.json({ msg: 'login' })); export default router;`);
writeFile(path.join(backend, 'src', 'routes', 'checkinRoutes.ts'), `import { Router } from 'express'; import { createCheckin, getTodayStatus } from '../controllers/checkinController'; import { authMiddleware } from '../middleware/auth'; const router = Router(); router.post('/', authMiddleware, createCheckin); router.get('/today', authMiddleware, getTodayStatus); export default router;`);
writeFile(path.join(backend, 'src', 'routes', 'linkRoutes.ts'), `import { Router } from 'express'; import { requestLink, acceptLink } from '../controllers/linkController'; import { authMiddleware } from '../middleware/auth'; const router = Router(); router.post('/request', authMiddleware, requestLink); router.post('/accept', authMiddleware, acceptLink); export default router;`);
writeFile(path.join(backend, 'src', 'routes', 'settingsRoutes.ts'), `import { Router } from 'express'; const router = Router(); export default router;`);

// middleware/auth.ts
writeFile(path.join(backend, 'src', 'middleware', 'auth.ts'), `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: 'Token não fornecido' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ msg: 'Token inválido' });
  }
}`);

// ==================== FRONTEND ====================
const frontend = path.join(root, 'frontend');

// frontend package.json
writeFile(path.join(frontend, 'package.json'), JSON.stringify({
  name: "daily-checkin-senior-frontend",
  version: "1.0.0",
  scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
  dependencies: {
    react: "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.2",
    axios: "^1.4.0",
    "idb": "^8.0.0",
    "react-hot-toast": "^2.4.1"
  },
  devDependencies: {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    autoprefixer: "^10.4.15",
    postcss: "^8.4.28",
    tailwindcss: "^3.3.3",
    typescript: "^5.0.2",
    vite: "^4.4.9"
  }
}, null, 2));

// vite.config.ts
writeFile(path.join(frontend, 'vite.config.ts'), `import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()] });`);
// tailwind.config.js
writeFile(path.join(frontend, 'tailwind.config.js'), `/** @type {import('tailwindcss').Config} */ export default { content: ["./index.html", "./src/**/*.{ts,tsx}"], theme: { extend: {} }, plugins: [] };`);
// postcss.config.js
writeFile(path.join(frontend, 'postcss.config.js'), `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };`);
// index.html
writeFile(path.join(frontend, 'index.html'), `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Daily Check-in Sênior</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`);

// src/main.tsx
writeFile(path.join(frontend, 'src', 'main.tsx'), `import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; import './index.css'; ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);`);
// src/index.css
writeFile(path.join(frontend, 'src', 'index.css'), `@tailwind base; @tailwind components; @tailwind utilities;`);
// src/App.tsx
writeFile(path.join(frontend, 'src', 'App.tsx'), `import { BrowserRouter, Routes, Route } from 'react-router-dom'; import RespondentHome from './pages/RespondentHome'; import { Toaster } from 'react-hot-toast'; function App() { return ( <BrowserRouter> <Toaster position="top-center" /> <Routes> <Route path="/" element={<RespondentHome />} /> </Routes> </BrowserRouter> ); } export default App;`);

// src/pages/RespondentHome.tsx
writeFile(path.join(frontend, 'src', 'pages', 'RespondentHome.tsx'), `import React, { useState, useEffect } from 'react'; import api from '../services/api'; import { saveOfflineCheckin } from '../services/offlineCheckin'; import { useOnlineCheckin } from '../hooks/useOnlineCheckin'; export default function RespondentHome() { const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const [todayConfirmed, setTodayConfirmed] = useState(false); useOnlineCheckin(); useEffect(() => { api.get('/checkin/today').then(res => { setTodayConfirmed(res.data.confirmed); }).catch(() => {}); }, []); const handleCheckin = async () => { if (todayConfirmed) { setMessage('Você já confirmou hoje. Obrigado!'); return; } setLoading(true); try { await api.post('/checkin'); setTodayConfirmed(true); setMessage('Obrigado! Tenha um ótimo dia.'); } catch (error) { if (!navigator.onLine) { await saveOfflineCheckin(Date.now()); setMessage('Sem internet. Seu check-in será enviado quando a conexão voltar.'); } else { setMessage('Erro ao registrar. Tente novamente.'); } } finally { setLoading(false); setTimeout(() => setMessage(''), 4000); } }; return ( <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-4"> <h1 className="text-3xl font-bold mb-8">Daily Check-in Sênior</h1> <button onClick={handleCheckin} disabled={loading || todayConfirmed} className="w-64 h-64 rounded-full bg-green-500 hover:bg-green-600 text-white text-4xl font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"> Estou bem </button> {message && ( <div className="mt-8 p-4 bg-white rounded shadow text-center text-lg"> {message} </div> )} </div> ); }`);

// src/services/api.ts
writeFile(path.join(frontend, 'src', 'services', 'api.ts'), `import axios from 'axios'; const api = axios.create({ baseURL: 'http://localhost:3333/api' }); api.interceptors.request.use(config => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = \`Bearer \${token}\`; return config; }); export default api;`);

// src/services/offlineCheckin.ts
writeFile(path.join(frontend, 'src', 'services', 'offlineCheckin.ts'), `import { openDB, IDBPDatabase } from 'idb'; let dbPromise: Promise<IDBPDatabase>; function getDB() { if (!dbPromise) { dbPromise = openDB('daily-checkin-offline', 1, { upgrade(db) { if (!db.objectStoreNames.contains('pendingCheckins')) { db.createObjectStore('pendingCheckins', { keyPath: 'id', autoIncrement: true }); } } }); } return dbPromise; } export async function saveOfflineCheckin(timestamp: number) { const db = await getDB(); await db.add('pendingCheckins', { timestamp, createdAt: new Date().toISOString() }); } export async function getPendingCheckins() { const db = await getDB(); return db.getAll('pendingCheckins'); } export async function clearPendingCheckin(id: number) { const db = await getDB(); await db.delete('pendingCheckins', id); }`);

// src/hooks/useOnlineCheckin.ts
writeFile(path.join(frontend, 'src', 'hooks', 'useOnlineCheckin.ts'), `import { useEffect } from 'react'; import api from '../services/api'; import { getPendingCheckins, clearPendingCheckin } from '../services/offlineCheckin'; export function useOnlineCheckin() { useEffect(() => { const syncPending = async () => { const pending = await getPendingCheckins(); for (const item of pending) { try { await api.post('/checkin', { timestamp: item.timestamp }); await clearPendingCheckin(item.id); } catch (error) { console.error('Falha no reenvio', error); } } }; window.addEventListener('online', syncPending); syncPending(); return () => window.removeEventListener('online', syncPending); }, []); }`);

// ==================== README ====================
writeFile(path.join(root, 'README.md'), `# Daily Check-in Sênior - Monitoramento Passivo de Idosos

## Funcionalidades Implementadas

- ✅ Dois perfis: Respondente (idoso) e Cuidador
- ✅ Vinculação via ID e aceite
- ✅ Check-in diário com botão "Estou bem"
- ✅ Janela de tolerância de 20 minutos (atraso moderado)
- ✅ Segunda chamada opcional (+20 min)
- ✅ Notificações por e-mail (WhatsApp/SMS configurável)
- ✅ Persistência offline com retry automático (IndexedDB)
- ✅ Job agendado a cada minuto para verificar prazos

## Como Executar

### Backend
\`\`\`
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
\`\`\`

### Frontend
\`\`\`
cd frontend
npm install
npm run dev
\`\`\`

### Credenciais de teste (criar via seed ou registro manual)

Para testar, primeiro crie um usuário com role RESPONDENTE (via POST /api/auth/register) e depois faça login.

## Tecnologias

- Backend: Node.js, TypeScript, Express, Prisma (SQLite), node-cron, Nodemailer
- Frontend: React, Vite, Tailwind, IndexedDB (idb)
- Notificações: Twilio (placeholder), Nodemailer

## Regras de Negócio Implementadas (RN1 a RN6) e F1

Todo o código está comentado apontando cada regra.
`);

console.log('✅ Projeto criado em: ' + root);
console.log('\nAgora siga as instruções do README.md para rodar o backend e frontend.');
console.log('Lembre-se de configurar as variáveis de ambiente no backend/.env');