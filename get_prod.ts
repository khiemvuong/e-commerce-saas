import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.products.findMany({ select: { title: true, category: true, brand: true, price: true }});
  console.log(JSON.stringify(products, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
