import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const exists = await prisma.user.findUnique({
    where: { email: "admin@omnix.dev" },
  });
  if (!exists) {
    await prisma.user.create({
      data: { email: "admin@omnix.dev", name: "OMNIX Admin", role: "admin" },
    });
    console.log("✓ seeded admin@omnix.dev");
  } else {
    console.log("✓ admin already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
