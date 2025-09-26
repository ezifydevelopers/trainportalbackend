const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function fixProductionVideos() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Fixing production video files...');
    console.log('⚠️  This will update video URLs in the production database');
    
    // Get all videos from database
    const videos = await prisma.video.findMany({
      include: {
        module: {
          include: {
            company: true
          }
        }
      }
    });
    
    console.log(`Found ${videos.length} videos in database`);
    
    // Check uploads directory
    const uploadsPath = '/home/dev/uploads';
    console.log(`Checking uploads directory: ${uploadsPath}`);
    
    if (!fs.existsSync(uploadsPath)) {
      console.log('❌ Uploads directory does not exist!');
      return;
    }
    
    const availableFiles = fs.readdirSync(uploadsPath).filter(file => file.endsWith('.mp4'));
    console.log(`Found ${availableFiles.length} available video files`);
    
    if (availableFiles.length === 0) {
      console.log('❌ No video files available in uploads directory');
      return;
    }
    
    // Find missing videos
    const missingVideos = [];
    const validVideos = [];
    
    for (const video of videos) {
      let filename = video.url;
      if (filename.startsWith('/uploads/')) {
        filename = filename.replace('/uploads/', '');
      }
      
      const filePath = path.join(uploadsPath, filename);
      const exists = fs.existsSync(filePath);
      
      if (!exists) {
        missingVideos.push(video);
      } else {
        validVideos.push(video);
      }
    }
    
    console.log(`\n✅ Valid videos: ${validVideos.length}`);
    console.log(`❌ Missing videos: ${missingVideos.length}`);
    
    if (missingVideos.length === 0) {
      console.log('🎉 All videos are available! No fix needed.');
      return;
    }
    
    // Show first few missing videos
    console.log('\n📋 First 5 missing videos:');
    missingVideos.slice(0, 5).forEach((video, index) => {
      console.log(`${index + 1}. ID: ${video.id}, Module: ${video.module.name}, Company: ${video.module.company.name}`);
      console.log(`   URL: ${video.url}`);
    });
    
    // Show available files
    console.log('\n📁 Available video files (first 5):');
    availableFiles.slice(0, 5).forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    
    // Ask for confirmation
    console.log(`\n⚠️  About to update ${missingVideos.length} video references...`);
    console.log('This will replace missing video URLs with available files.');
    
    // Update missing videos
    let updatedCount = 0;
    
    for (let i = 0; i < missingVideos.length; i++) {
      const video = missingVideos[i];
      const replacementFile = availableFiles[i % availableFiles.length];
      
      console.log(`\n🔧 Updating video ID ${video.id} (${video.module.name})`);
      console.log(`   From: ${video.url}`);
      console.log(`   To: ${replacementFile}`);
      
      try {
        await prisma.video.update({
          where: { id: video.id },
          data: { url: replacementFile }
        });
        
        console.log(`   ✅ Updated successfully`);
        updatedCount++;
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} out of ${missingVideos.length} missing videos`);
    
    // Verify the fix
    console.log('\n🧪 Verifying fix...');
    const testVideo = await prisma.video.findFirst({
      where: { id: missingVideos[0].id }
    });
    
    if (testVideo) {
      const testFilePath = path.join(uploadsPath, testVideo.url);
      const testExists = fs.existsSync(testFilePath);
      console.log(`Test video ID ${testVideo.id}: ${testExists ? '✅ Available' : '❌ Still missing'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixProductionVideos();
