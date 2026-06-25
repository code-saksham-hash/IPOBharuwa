import { prisma } from '../src/index'
import bcrypt from 'bcryptjs'

async function main() {
  const hash = await bcrypt.hash('test1234', 12)
  const user = await prisma.user.upsert({
    where: { email: 'test@ipobaje.dev' },
    update: { hashedPassword: hash },
    create: {
      email: 'test@ipobaje.dev',
      name: 'Test User',
      hashedPassword: hash,
    },
  })
  console.log('User seeded:', user.email, 'id:', user.id)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
