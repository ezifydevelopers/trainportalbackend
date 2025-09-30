const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Create a test file
const testFilePath = path.join(__dirname, 'test-resource.txt');
fs.writeFileSync(testFilePath, 'This is a test resource file for debugging');

// Create FormData exactly like the frontend does
const formData = new FormData();
formData.append('moduleId', '1');
formData.append('type', 'DOCUMENT');
formData.append('resourceFile', fs.createReadStream(testFilePath));

console.log('🔍 Testing resource upload endpoint...');
console.log('FormData headers:', formData.getHeaders());

// Test with local server first
// Use built-in fetch (Node 18+) or require node-fetch v2
const fetch = globalThis.fetch || require('node-fetch');

async function testLocalEndpoint() {
  try {
    console.log('\n🚀 Testing local endpoint: http://localhost:7001/api/admin/resources');
    
    const response = await fetch('http://localhost:7001/api/admin/resources', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token', // This will fail auth but we can see the error
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testProductionEndpoint() {
  try {
    console.log('\n🚀 Testing production endpoint: https://ezifytraining.com/api/admin/resources');
    
    const response = await fetch('https://ezifytraining.com/api/admin/resources', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token', // This will fail auth but we can see the error
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testLocalEndpoint();
  await testProductionEndpoint();
  
  // Clean up
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
}

runTests();
