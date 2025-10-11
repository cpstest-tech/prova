// Script di debug per testare l'API
const axios = require('axios');

async function testAPI() {
  console.log('🔍 Testing API endpoints...\n');
  
  const baseURL = 'http://localhost:3000';
  
  try {
    // Test health check
    console.log('1. Testing /api/health...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Health check:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  try {
    // Test builds endpoint
    console.log('\n2. Testing /api/builds...');
    const buildsResponse = await axios.get(`${baseURL}/api/builds`);
    console.log('✅ Builds response:', {
      status: buildsResponse.status,
      dataKeys: Object.keys(buildsResponse.data),
      buildsCount: buildsResponse.data.builds?.length || 0
    });
    
    if (buildsResponse.data.builds?.length > 0) {
      console.log('First build:', buildsResponse.data.builds[0]);
    }
  } catch (error) {
    console.log('❌ Builds endpoint failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
  
  try {
    // Test test endpoint
    console.log('\n3. Testing /test...');
    const testResponse = await axios.get(`${baseURL}/test`);
    console.log('✅ Test endpoint:', testResponse.data);
  } catch (error) {
    console.log('❌ Test endpoint failed:', error.message);
  }
}

testAPI();

