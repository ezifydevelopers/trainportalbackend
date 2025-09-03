const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAPIEndpoints() {
  try {
    console.log('Testing API endpoints...');
    
    // Test 1: Check if server is running
    console.log('\n1. Testing server connectivity...');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/test`);
      console.log('Server response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Server response:', data);
      } else {
        console.log('Server error:', response.statusText);
      }
    } catch (error) {
      console.error('Server connection failed:', error.message);
      return;
    }
    
    // Test 2: Check companies endpoint
    console.log('\n2. Testing companies endpoint...');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/companies`);
      console.log('Companies endpoint status:', response.status);
      if (response.ok) {
        const companies = await response.json();
        console.log('Companies found:', companies.length);
        if (companies.length > 0) {
          console.log('First company:', companies[0]);
        }
      } else {
        const error = await response.json();
        console.log('Companies endpoint error:', error);
      }
    } catch (error) {
      console.error('Companies endpoint failed:', error.message);
    }
    
    // Test 3: Check modules endpoint
    console.log('\n3. Testing modules endpoint...');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/modules`);
      console.log('Modules endpoint status:', response.status);
      if (response.ok) {
        const modules = await response.json();
        console.log('Modules found:', modules.length);
      } else {
        const error = await response.json();
        console.log('Modules endpoint error:', error);
      }
    } catch (error) {
      console.error('Modules endpoint failed:', error.message);
    }
    
    console.log('\n✅ API endpoint tests completed.');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

testAPIEndpoints(); 