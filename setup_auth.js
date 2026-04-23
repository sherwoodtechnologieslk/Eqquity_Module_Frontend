// Quick authentication setup for frontend
// Run this in your browser console to set up authentication

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
console.log('🔄 Refresh your page to see the dashboard working');

// Test API call
fetch(`${process.env.REACT_APP_API_URL || 'http://98.91.201.168/api'}/portfolios/active`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => {
    console.log('✅ API test successful:', data);
})
.catch(error => {
    console.error('❌ API test failed:', error);
});
