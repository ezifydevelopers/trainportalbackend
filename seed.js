const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with sample companies...');

  // Sample companies
  const companies = [
    { name: 'Acme Corporation' },
    { name: 'Tech Solutions Inc.' },
    { name: 'Global Industries Ltd.' },
    { name: 'Innovation Systems' },
    { name: 'Digital Dynamics' },
    { name: 'Future Technologies' },
    { name: 'Smart Solutions' },
    { name: 'Enterprise Solutions' },
    { name: 'Creative Studios' },
    { name: 'Advanced Systems' }
  ];

  for (const company of companies) {
    try {
      const existingCompany = await prisma.company.findUnique({
        where: { name: company.name }
      });

      if (!existingCompany) {
        await prisma.company.create({
          data: company
        });
        console.log(`Created company: ${company.name}`);
      } else {
        console.log(`Company already exists: ${company.name}`);
      }
    } catch (error) {
      console.error(`Error creating company ${company.name}:`, error);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 