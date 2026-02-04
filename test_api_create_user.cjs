const fetch = require('node-fetch'); // You might need to install this or use built-in fetch if node version > 18
// Assuming Node 18+ has built-in fetch, otherwise we might need to use dynamic import or just standard http

async function testApiCreateUser() {
    console.log('Testing User Creation via API...');

    // Admin login usually required for this endpoint? 
    // The route in users.cjs doesn't seem to have 'isAdmin' middleware applied at the router level in index.cjs?
    // Let's check index.cjs first. If it's protected, we need a token.
    // Based on previous code, usersRoutes is mounted at /users. 
    // Usually POST /users is for Admin creating users.

    // Start by trying to login as admin to get a token (if needed)
    // Or just try calling it unchecked if middleware isn't strict yet.

    const newUser = {
        name: 'API Test Student',
        email: 'api_test_' + Date.now() + '@example.com',
        password: 'password123',
        role: 'student'
    };

    try {
        const response = await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // 'Authorization': 'Bearer ...' // We might need this
            },
            body: JSON.stringify(newUser)
        });

        const status = response.status;
        const data = await response.text();

        console.log(`Response Status: ${status}`);
        console.log(`Response Body: ${data}`);

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testApiCreateUser();
