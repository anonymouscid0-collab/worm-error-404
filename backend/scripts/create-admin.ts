import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'anonymouscid0@gmail.com';
  const password = 'cid_error404';
  const hash = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      role: 'ADMIN', 
      plan: 'PRO', 
      passwordHash: hash,
      name: 'CID Admin',
      freeLimit: 999999,
      messagesUsed: 0,
    },
    create: {
      email,
      name: 'CID Admin',
      passwordHash: hash,
      role: 'ADMIN',
      plan: 'PRO',
      freeLimit: 999999,
      messagesUsed: 0,
    },
  });
  
  console.log('✅ Admin créé/mis à jour:', user.email);
  console.log('   Role:', user.role);
  console.log('   Plan:', user.plan);
  console.log('   ID:', user.id);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
