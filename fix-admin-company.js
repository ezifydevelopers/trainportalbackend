const prisma = require('./src/prismaClient');

async function fixAdminCompany() {
  try {
    console.log('🔧 Fixing Admin User Company Assignment...\n');

    // First, let's see what companies exist
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true
      }
    });

    console.log('📋 Available companies:');
    companies.forEach(company => {
      console.log(`   - ${company.name} (ID: ${company.id})`);
    });

    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true
      }
    });

    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    console.log(`\n👤 Admin User: ${adminUser.name} (${adminUser.email})`);
    console.log(`   Current Company ID: ${adminUser.companyId || 'None'}`);

    // Find "Jobs For You" company specifically
    const jobsForYouCompany = companies.find(c => c.name === 'Jobs For You');
    
    if (jobsForYouCompany) {
      console.log(`\n🏢 Moving admin to company: ${jobsForYouCompany.name} (ID: ${jobsForYouCompany.id})`);
      
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { companyId: jobsForYouCompany.id }
      });

      console.log('✅ Admin user company updated successfully!');
      
      // Verify the update
      const updatedAdmin = await prisma.user.findUnique({
        where: { id: adminUser.id },
        select: {
          id: true,
          name: true,
          email: true,
          companyId: true,
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log(`\n✅ Verification:`);
      console.log(`   - User: ${updatedAdmin.name}`);
      console.log(`   - Company: ${updatedAdmin.company?.name || 'None'}`);
      console.log(`   - Company ID: ${updatedAdmin.companyId || 'None'}`);
      
    } else {
      console.log('❌ Jobs For You company not found');
    }

  } catch (error) {
    console.error('❌ Error fixing admin company:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminCompany();
