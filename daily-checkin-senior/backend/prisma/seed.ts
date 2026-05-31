import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'idoso@teste.com' },
    update: {},
    create: {
      name: 'Idoso Teste',
      email: 'idoso@teste.com',
      passwordHash,
      role: 'RESPONDENTE',
      respondentProfile: { create: {} },
      settings: {
        create: {
          regularDeadlineHour: 10,
          regularDeadlineMinute: 0,
          secondaryCallEnabled: true,
          secondaryCallDelayMinutes: 20
        }
      }
    }
  });
  console.log('Usuário respondente criado:', user.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());