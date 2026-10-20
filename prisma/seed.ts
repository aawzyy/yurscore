import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USERS = [
  { name: "Reza", email: "reza@yurscore.com", gender: "MALE" },
  { name: "Ardhi", email: "ardhi@yurscore.com", gender: "MALE" },
  { name: "Ibad", email: "ibad@yurscore.com", gender: "MALE" },
  { name: "Savira", email: "savira@yurscore.com", gender: "FEMALE" },
  { name: "Jojo", email: "jojo@yurscore.com", gender: "MALE" },
  { name: "Oji", email: "oji@yurscore.com", gender: "MALE" },
  { name: "Dini", email: "dini@yurscore.com", gender: "FEMALE" },
  { name: "Shana", email: "shana@yurscore.com", gender: "FEMALE" },
  { name: "Fabian", email: "fabian@yurscore.com", gender: "MALE" },
  { name: "Andreas", email: "andreas@yurscore.com", gender: "MALE" },
  { name: "Ocan", email: "ocan@yurscore.com", gender: "MALE" },
  { name: "Ardian", email: "ardian@yurscore.com", gender: "MALE" },
];

async function main() {
  console.log("Seeding YurScore database...");

  // 1. Create or update users
  const createdUsers = [];
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, gender: u.gender },
      create: {
        name: u.name,
        email: u.email,
        password: "password123",
        gender: u.gender,
      },
    });
    createdUsers.push(user);
  }
  console.log(`✅ 12 Users ready.`);

  // 2. Create or ensure Jakarta Padel Masters club
  const reza = createdUsers.find((u) => u.email === "reza@yurscore.com")!;
  const club = await prisma.club.upsert({
    where: { code: "JPM-PADEL" },
    update: {
      name: "Jakarta Padel Masters",
      description:
        "Komunitas Padel & Racket Sports Jakarta Selatan. Turnamen Americano, Mexicano, dan Social Games.",
      ownerId: reza.id,
    },
    create: {
      name: "Jakarta Padel Masters",
      description:
        "Komunitas Padel & Racket Sports Jakarta Selatan. Turnamen Americano, Mexicano, dan Social Games.",
      code: "JPM-PADEL",
      ownerId: reza.id,
    },
  });

  // 3. Register all 12 users as members of the club
  for (const u of createdUsers) {
    const isOwner = u.id === reza.id;
    await prisma.clubMember.upsert({
      where: {
        clubId_invitedEmail: {
          clubId: club.id,
          invitedEmail: u.email,
        },
      },
      update: {
        userId: u.id,
        role: isOwner ? "ADMIN" : "MEMBER",
        status: "ACTIVE",
      },
      create: {
        clubId: club.id,
        userId: u.id,
        invitedEmail: u.email,
        role: isOwner ? "ADMIN" : "MEMBER",
        status: "ACTIVE",
      },
    });
  }

  console.log(`✅ Jakarta Padel Masters club ready with 12 members.`);
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
