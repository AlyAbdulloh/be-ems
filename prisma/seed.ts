import { PrismaClient, RoleName } from '@internal/prisma/ems';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  console.log('Seeding roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: { name: RoleName.ADMIN },
  });
  console.log('Role ADMIN seeded successfully.');

  const adminEmail = 'admin@danain.com';

  console.log('Seeding admin user...');
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { roles: true },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin Danain',
        phone: '081234567890',
        passwordHash: hashedPassword,
        roles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    const hasRole = existingAdmin.roles.some((r) => r.roleId === adminRole.id);
    if (!hasRole) {
      await prisma.userRole.create({
        data: {
          userId: existingAdmin.id,
          roleId: adminRole.id,
        },
      });
      console.log(`Assigned ADMIN role to existing user ${adminEmail}`);
    } else {
      console.log(`Admin user ${adminEmail} already exists, skipping.`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


