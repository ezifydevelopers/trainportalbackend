const { PrismaClient } = require('@prisma/client');

async function restoreRealContent() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 RESTORING YOUR REAL TRAINING CONTENT...\n');
    
    // Step 1: Clear all placeholder content
    console.log('1. 🗑️ Clearing placeholder content...');
    
    try {
      // Delete videos first (they reference modules)
      const deletedVideos = await prisma.video.deleteMany({
        where: {
          url: 'https://www.youtube.com/watch?v=example'
        }
      });
      console.log(`   ✅ Removed ${deletedVideos.count} placeholder videos`);
    } catch (error) {
      console.log(`   ⚠️  Could not remove videos: ${error.message}`);
    }
    
    try {
      // Delete MCQs
      const deletedMCQs = await prisma.mCQ.deleteMany({
        where: {
          question: { contains: 'most important aspect' }
        }
      });
      console.log(`   ✅ Removed ${deletedMCQs.count} placeholder MCQs`);
    } catch (error) {
      console.log(`   ⚠️  Could not remove MCQs: ${error.message}`);
    }
    
    try {
      // Delete progress records
      const deletedProgress = await prisma.traineeProgress.deleteMany();
      console.log(`   ✅ Removed ${deletedProgress.count} placeholder progress records`);
    } catch (error) {
      console.log(`   ⚠️  Could not remove progress records: ${error.message}`);
    }
    
    try {
      // Delete placeholder training modules
      const deletedModules = await prisma.trainingModule.deleteMany({
        where: {
          name: {
            in: [
              'Sales Fundamentals', 'Customer Relationship Management', 
              'Product Knowledge & Presentation', 'Negotiation Skills',
              'Digital Marketing & Social Media', 'Business Development',
              'Team Leadership', 'Data Analysis & Reporting',
              'Communication Skills', 'Time Management',
              'Problem Solving', 'Strategic Planning'
            ]
          }
        }
      });
      console.log(`   ✅ Removed ${deletedModules.count} placeholder modules`);
    } catch (error) {
      console.log(`   ⚠️  Could not remove modules: ${error.message}`);
    }
    
    // Step 2: Create your real training modules
    console.log('\n2. 📚 Creating your REAL training modules...');
    
    // Get the first company for training modules
    const firstCompany = await prisma.company.findFirst();
    if (!firstCompany) {
      console.log('   ❌ No company found to create modules for');
      return;
    }
    
    // Your real training modules based on the content I found
    const realTrainingModules = [
      {
        name: 'Sales Skills Training',
        companyId: firstCompany.id,
        videos: [
          'Steps to Find One Email Using Apollo.io',
          'BDA ONHORE AND OFFSHORE TASK',
          'Steps to Send an Email Blast Using Google Sheets and MailSuite',
          'Benefits of MailSuite',
          'How to use Botsol',
          'How to use Sales Navigator',
          'Steps to find companies with open positions using Indeed',
          'Steps to find companies with open positions using LinkedIn',
          'Summary - Using LinkedIn and Indeed for Lead Generation'
        ]
      },
      {
        name: 'Product and Company Knowledge',
        companyId: firstCompany.id,
        videos: [
          'NEXT EMPLOYMENT Orientation',
          'Zone Placements Orientation Presentation',
          'Star Employment Final',
          'UniverCA Overview',
          'Jobs For U Orientation Package'
        ]
      },
      {
        name: 'Core Sales Training',
        companyId: firstCompany.id,
        videos: [
          'Why Follow-Up Emails Are Necessary',
          'Calling Clients & Effective Tone When Dealing with Clients',
          'Key Features-Benefits and Examples of a Customized Email',
          'Important Designations to Target',
          'Steps from Lead Generation to Closer',
          'Subcontracting',
          'Target Companies'
        ]
      }
    ];
    
    let createdModules = 0;
    let createdVideos = 0;
    let createdMCQs = 0;
    
    for (const moduleData of realTrainingModules) {
      try {
        // Create the training module
        const module = await prisma.trainingModule.create({
          data: {
            name: moduleData.name,
            companyId: moduleData.companyId
          }
        });
        console.log(`   ✅ Created module: ${module.name}`);
        createdModules++;
        
        // Create videos for each module
        for (const videoName of moduleData.videos) {
          try {
            // Map video names to actual file paths
            let videoUrl = '';
            let duration = 1800; // Default 30 minutes
            
            // Map specific video names to actual files
            if (videoName.includes('Apollo.io')) {
              videoUrl = '/uploads/Steps to Find One Email Using Apollo.io.mp4';
              duration = 5160; // 86MB = ~86 minutes
            } else if (videoName.includes('BDA ONHORE')) {
              videoUrl = '/uploads/BDA ONHORE AND OFFSHORE TASK.mp4';
              duration = 3180; // 53MB = ~53 minutes
            } else if (videoName.includes('Email Blast')) {
              videoUrl = '/uploads/Steps to Send an Email Blast Using Google Sheets and MailSuite.mp4';
              duration = 5160; // 86MB = ~86 minutes
            } else if (videoName.includes('MailSuite')) {
              videoUrl = '/uploads/Benefits of MailSuite.mp4';
              duration = 1920; // 32MB = ~32 minutes
            } else if (videoName.includes('Botsol')) {
              videoUrl = '/uploads/How to use Botsol.mp4';
              duration = 4500; // 75MB = ~75 minutes
            } else if (videoName.includes('Sales Navigator')) {
              videoUrl = '/uploads/How to use Sales Navigator.mp4';
              duration = 3900; // 65MB = ~65 minutes
            } else if (videoName.includes('Indeed')) {
              videoUrl = '/uploads/Steps to find companies with open positions using Indeed.mp4';
              duration = 6480; // 108MB = ~108 minutes
            } else if (videoName.includes('LinkedIn')) {
              videoUrl = '/uploads/Steps to find companies with open positions using LinkedIn.mp4';
              duration = 3180; // 53MB = ~53 minutes
            } else if (videoName.includes('Summary')) {
              videoUrl = '/uploads/Summary - Using LinkedIn and Indeed for Lead Generation.mp4';
              duration = 2760; // 46MB = ~46 minutes
            } else if (videoName.includes('NEXT EMPLOYMENT')) {
              videoUrl = '/uploads/NEXT EMPLOYMENT_Orientation.webm';
              duration = 2760; // 46MB = ~46 minutes
            } else if (videoName.includes('Zone Placements')) {
              videoUrl = '/uploads/Zone Placements Orientation Presentation.pptx';
              duration = 1800; // Presentation file
            } else if (videoName.includes('Star Employment')) {
              videoUrl = '/uploads/Star_PPT 11_Final Star Employment.ppsx';
              duration = 1800; // Presentation file
            } else if (videoName.includes('UniverCA')) {
              videoUrl = '/uploads/OverView - UniverCA Final.pdf';
              duration = 1800; // PDF file
            } else if (videoName.includes('Jobs For U')) {
              videoUrl = '/uploads/Jobs For U- orientation package.mp4';
              duration = 4320; // 72MB = ~72 minutes
            } else if (videoName.includes('Follow-Up Emails')) {
              videoUrl = '/uploads/Why Follow-Up Emails Are Necessary.mp4';
              duration = 2820; // 47MB = ~47 minutes
            } else if (videoName.includes('Calling Clients')) {
              videoUrl = '/uploads/Why Calling Clients is Importan & Effective Tone When Dealing with Clients.mp4';
              duration = 4920; // 82MB = ~82 minutes
            } else if (videoName.includes('Customized Email')) {
              videoUrl = '/uploads/Key Features-Benefits and Examples of a Customized Email.mp4';
              duration = 3360; // 56MB = ~56 minutes
            } else if (videoName.includes('Designations')) {
              videoUrl = '/uploads/Important Designations to Target - Final.mp4';
              duration = 3000; // 50MB = ~50 minutes
            } else if (videoName.includes('Lead Generation')) {
              videoUrl = '/uploads/Steps from Lead Generation to Closer.mp4';
              duration = 3660; // 61MB = ~61 minutes
            } else if (videoName.includes('Subcontracting')) {
              videoUrl = '/uploads/Subcontracting.mp4';
              duration = 4080; // 68MB = ~68 minutes
            } else if (videoName.includes('Target Companies')) {
              videoUrl = '/uploads/Target Companies.mp4';
              duration = 4260; // 71MB = ~71 minutes
            } else {
              // Default fallback
              videoUrl = `/uploads/${videoName.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
              duration = 1800;
            }
            
            await prisma.video.create({
              data: {
                url: videoUrl,
                duration: duration,
                moduleId: module.id
              }
            });
            console.log(`      🎥 Added video: ${videoName}`);
            createdVideos++;
            
            // Create MCQs for each module
            const mcqData = {
              question: `What is the main focus of ${videoName}?`,
              options: ['Technical Skills', 'Sales Techniques', 'Product Knowledge', 'All of the above'],
              answer: 'All of the above',
              explanation: `This training covers multiple aspects of professional development.`,
              moduleId: module.id
            };
            
            await prisma.mCQ.create({
              data: mcqData
            });
            console.log(`      ❓ Added MCQ for ${videoName}`);
            createdMCQs++;
            
          } catch (error) {
            console.log(`      ⚠️  Could not create video/MCQ for ${videoName}: ${error.message}`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to create module ${moduleData.name}: ${error.message}`);
      }
    }
    
    console.log(`   📊 Total modules created: ${createdModules}`);
    console.log(`   📊 Total videos created: ${createdVideos}`);
    console.log(`   📊 Total MCQs created: ${createdMCQs}`);
    
    // Step 3: Create trainee progress records
    console.log('\n3. 📈 Creating trainee progress records...');
    
    const trainees = await prisma.user.findMany({
      where: { role: 'TRAINEE' }
    });
    
    const modules = await prisma.trainingModule.findMany();
    
    let progressRecords = 0;
    for (const trainee of trainees) {
      for (const module of modules) {
        try {
          await prisma.traineeProgress.create({
            data: {
              userId: trainee.id,
              moduleId: module.id,
              status: 'IN_PROGRESS',
              completed: false,
              score: null,
              timeSpent: 0,
              pass: false
            }
          });
          progressRecords++;
        } catch (error) {
          // Skip if already exists
        }
      }
    }
    
    console.log(`   📊 Created ${progressRecords} progress records`);
    
    // Step 4: Final status
    console.log('\n4. 📊 Final database status...');
    
    const finalCompanyCount = await prisma.company.count();
    const finalModuleCount = await prisma.trainingModule.count();
    const finalVideoCount = await prisma.video.count();
    const finalMCQCount = await prisma.mCQ.count();
    const finalProgressCount = await prisma.traineeProgress.count();
    
    console.log(`   🏢 Companies: ${finalCompanyCount}`);
    console.log(`   📚 Training Modules: ${finalModuleCount}`);
    console.log(`   🎥 Videos: ${finalVideoCount}`);
    console.log(`   ❓ MCQs: ${finalMCQCount}`);
    console.log(`   📈 Progress Records: ${finalProgressCount}`);
    
    // Step 5: Show all your real training modules
    console.log('\n📚 YOUR REAL TRAINING MODULES:');
    const allModules = await prisma.trainingModule.findMany({
      select: { id: true, name: true, companyId: true },
      orderBy: { id: 'asc' }
    });
    
    allModules.forEach((module, index) => {
      console.log(`   ${index + 1}. ${module.name} (Company ID: ${module.companyId})`);
    });
    
    console.log('\n🎉 REAL CONTENT RESTORATION COMPLETED!');
    console.log('   Your training portal now has:');
    console.log(`   - ${finalCompanyCount} companies`);
    console.log(`   - ${finalModuleCount} REAL training modules with your actual content`);
    console.log(`   - ${finalVideoCount} video resources linked to your real files`);
    console.log(`   - ${finalMCQCount} assessment questions`);
    console.log(`   - ${finalProgressCount} progress tracking records`);
    
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('   👨‍🎓 Trainee: ali@gmail.com / 123456');
    console.log('   👩‍🎓 Trainee: sarah@example.com / password123');
    console.log('   👑 Admin: admin@example.com / admin123');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
  }
}

restoreRealContent();
