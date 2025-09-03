const http = require('http');

function testAPI() {
  console.log('Testing API endpoints...');
  
  // Test 1: Check if server is running
  console.log('\n1. Testing server connection...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/test',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ Server response:', jsonData);
      } catch (e) {
        console.log('❌ Invalid JSON response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.log('❌ Connection failed:', e.message);
  });

  req.end();
}

testAPI(); 