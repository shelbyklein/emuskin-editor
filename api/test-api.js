// Simple API test script
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TOKEN = process.env.TEST_TOKEN || 'your-jwt-token-here';

async function testAPI() {
  console.log('🧪 Testing Emulator Skin API...\n');
  
  // Test health endpoint
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    const health = await healthRes.json();
    console.log('✅ Health Check:', health);
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
  }
  
  // Test authenticated endpoints
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  // Test GET projects
  try {
    const projectsRes = await fetch(`${API_URL}/api/projects`, { headers });
    if (projectsRes.ok) {
      const projects = await projectsRes.json();
      console.log(`✅ GET Projects: Found ${projects.length} projects`);
    } else {
      console.log('❌ GET Projects Failed:', projectsRes.status, await projectsRes.text());
    }
  } catch (error) {
    console.error('❌ GET Projects Error:', error.message);
  }
  
  // Test CREATE project
  try {
    const newProject = {
      name: 'Test Project',
      identifier: 'com.test.project',
      console: null,
      device: null,
      hasBeenConfigured: false
    };
    
    const createRes = await fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newProject)
    });
    
    if (createRes.ok) {
      const created = await createRes.json();
      console.log('✅ CREATE Project:', created.id);
      
      // Test UPDATE
      const updateRes = await fetch(`${API_URL}/api/projects/${created.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: 'Updated Test Project' })
      });
      
      if (updateRes.ok) {
        console.log('✅ UPDATE Project: Success');
      }
      
      // Test DELETE
      const deleteRes = await fetch(`${API_URL}/api/projects/${created.id}`, {
        method: 'DELETE',
        headers
      });
      
      if (deleteRes.ok) {
        console.log('✅ DELETE Project: Success');
      }
    }
  } catch (error) {
    console.error('❌ CRUD Operations Error:', error.message);
  }
  
  console.log('\n🏁 API Test Complete!');
}

// Run test
testAPI();