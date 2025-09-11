const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testResourceUpload() {
  try {
    console.log('Testing resource upload...');
    
    // Create a test file
    const testContent = 'This is a test PDF content';
    fs.writeFileSync('test-resource.pdf', testContent);
    
    // Create form data
    const formData = new FormData();
    formData.append('resourceFile', fs.createReadStream('test-resource.pdf'));
    formData.append('moduleId', '44'); // Use the module ID from our test
    formData.append('type', 'pdf');
    
    // Make the request
    const response = await fetch('http://localhost:7001/api/admin/resources', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token' // We'll need a real token
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    // Clean up
    fs.unlinkSync('test-resource.pdf');
    
  } catch (error) {
    console.error('Error testing resource upload:', error);
  }
}

testResourceUpload();
