/**
 * Local development seed. Creates accounts you can actually sign in with.
 * Safe to re-run: everything is upserted.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@assetsandcapitalltd.com" },
    update: {},
    create: { email: "admin@assetsandcapitalltd.com", name: "Platform Admin", passwordHash, role: "SUPER_ADMIN" },
  });

  const investor = await prisma.user.upsert({
    where: { email: "investor@example.com" },
    update: {},
    create: { email: "investor@example.com", name: "Demo Investor", passwordHash, role: "INVESTOR" },
  });

  const business = await prisma.user.upsert({
    where: { email: "business@example.com" },
    update: {},
    create: { email: "business@example.com", name: "Demo Business", passwordHash, role: "BUSINESS" },
  });

  // A subscribed investor who has expressed interest and signed the NDA, so the
  // full access ladder is visible immediately after seeding.
  const slug = "sahara-solar-grid";
  await prisma.investorSubscription.upsert({
    where: { userId: investor.id },
    update: { plan: "Investor Pro", active: true },
    create: { userId: investor.id, plan: "Investor Pro", active: true },
  });
  await prisma.listingInterest.upsert({
    where: { userId_slug: { userId: investor.id, slug } },
    update: {},
    create: { userId: investor.id, slug },
  });
  await prisma.ndaSignature.upsert({
    where: { userId_slug: { userId: investor.id, slug } },
    update: {},
    create: { userId: investor.id, slug },
  });
  await prisma.kycRecord.upsert({
    where: { userId: investor.id },
    update: {},
    create: {
      userId: investor.id,
      status: "VERIFIED",
      accredited: true,
      sanctionsClear: true,
      legalName: "Demo Investor",
      country: "United Kingdom",
      reviewedAt: new Date(),
    },
  });

  console.log("Seeded accounts (password: %s)", PASSWORD);
  console.table([
    { role: "SUPER_ADMIN", email: admin.email },
    { role: "INVESTOR (subscribed, NDA signed)", email: investor.email },
    { role: "BUSINESS", email: business.email },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
