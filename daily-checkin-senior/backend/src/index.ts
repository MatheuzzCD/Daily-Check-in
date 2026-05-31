import express from 'express';
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
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));