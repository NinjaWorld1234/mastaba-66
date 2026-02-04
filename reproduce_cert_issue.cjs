const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function reproduce() {
    try {
        // 1. Login as Admin
        console.log('Logging in as admin...');
        const loginRes = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123'
            })
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.error('Login failed:', loginData);
            return;
        }

        console.log('Login successful. Token:', loginData.accessToken ? 'Present' : 'Missing');
        const token = loginData.accessToken;

        // 2. Try to Issue Certificate
        console.log('Attempting to issue certificate...');
        const issueRes = await fetch(`${BASE_URL}/api/certificates/issue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                studentName: "Test Student",
                courseTitle: "Test Course",
                grade: "Excellent",
                userId: "manual-1",
                courseId: "manual-course-1"
            })
        });

        const issueData = await issueRes.json();
        console.log('Issue Response Status:', issueRes.status);
        console.log('Issue Response Body:', JSON.stringify(issueData, null, 2));

    } catch (e) {
        console.error('An error occurred:', e);
    }
}

reproduce();
