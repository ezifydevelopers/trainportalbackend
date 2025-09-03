const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if TrainingModule table exists and has order field
    const modules = await prisma.trainingModule.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        order: true,
        companyId: true
      }
    });
    
    console.log('✅ TrainingModule table accessible');
    console.log('Sample modules:', modules);
    
    // Test if we can update a module order
    if (modules.length > 0) {
      const testModule = modules[0];
      console.log(`Testing order update for module ${testModule.id}...`);
      
      const updated = await prisma.trainingModule.update({
        where: { id: testModule.id },
        data: { order: testModule.order || 0 }
      });
      
      console.log('✅ Order field update successful');
      console.log('Updated module:', updated);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
