# Daily Check-in Sênior - Monitoramento Passivo de Idosos

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
```
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Frontend
```
cd frontend
npm install
npm run dev
```

### Credenciais de teste (criar via seed ou registro manual)

Para testar, primeiro crie um usuário com role RESPONDENTE (via POST /api/auth/register) e depois faça login.

## Tecnologias

- Backend: Node.js, TypeScript, Express, Prisma (SQLite), node-cron, Nodemailer
- Frontend: React, Vite, Tailwind, IndexedDB (idb)
- Notificações: Twilio (placeholder), Nodemailer

## Regras de Negócio Implementadas (RN1 a RN6) e F1

Todo o código está comentado apontando cada regra.
