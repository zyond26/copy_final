const prisma = require('./src/config/prisma');

async function main() {
  console.log('--- ROLES ---');
  const roles = await prisma.roles.findMany({
    include: {
      role_permissions: {
        include: {
          permission: true
        }
      }
    }
  });
  
  for (const role of roles) {
    console.log(`Role: ${role.name}`);
    console.log('Permissions:', role.role_permissions.map(rp => rp.permission.name).join(', '));
  }

  console.log('\n--- USERS ---');
  const users = await prisma.users.findMany({
    include: {
      role_ref: true
    }
  });
  for (const user of users) {
    console.log({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role_ref?.name,
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
