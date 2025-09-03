const fetch = require('node-fetch');

async function testFeedbackEndpoint() {
  try {
    console.log('Testing feedback endpoint...');
    
    const response = await fetch('http://localhost:5000/api/admin/feedback', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

async function testFeedbackStats() {
  try {
    console.log('\nTesting feedback stats endpoint...');
    
    const response = await fetch('http://localhost:5000/api/admin/feedback/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

// Run tests
testFeedbackEndpoint().then(() => {
  return testFeedbackStats();
}).catch(console.error);
