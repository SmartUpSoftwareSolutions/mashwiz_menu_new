import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const exists = await prisma.bucket.findFirst({
    where: { name: "default" },
  });

  if (!exists) {
    await prisma.bucket.create({
      data: {
        name: "default",
        public: true,
        file_size_limit: null,
      },
    });
    console.log("Created default bucket");
  } else {
    console.log("Default bucket already exists");
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
