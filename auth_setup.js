// Authentication Setup Script
// Copy and paste this into your browser console (F12 -> Console tab)

console.log('🔐 Setting up authentication...');

// Test user credentials and token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsImlhdCI6MTc2MDA0MDUzMiwiZXhwIjoxNzYwMTI2OTMyfQ.hBWMfo9TLXyBl23cbYkwq9C20m4reLJaqyTeWFCqZo0';

const user = {
    id: 7,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User'
};

// Set authentication data in localStorage
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

console.log('✅ Authentication token set successfully!');
console.log('👤 User:', user);
console.log('🔑 Token:', token.substring(0, 50) + '...');

// Test API call to verify authentication
console.log('🧪 Testing API call...');

fetch('http://localhost:8080/api/portfolios/active', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log('📡 API Response Status:', response.status);
    return response.json();
})
.then(data => {
    console.log('✅ API test successful:', data);
    console.log('🎉 Ready to use! Refresh your page to see the dashboard working.');
})
.catch(error => {
    console.error('❌ API test failed:', error);
    console.log('💡 Make sure your backend server is running on port 8080');
});

// Additional test for portfolio overview
fetch('http://localhost:8080/api/portfolios/overview', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => {
    console.log('📊 Portfolio Overview API:', data);
})
.catch(error => {
    console.error('❌ Portfolio Overview API failed:', error);
});
