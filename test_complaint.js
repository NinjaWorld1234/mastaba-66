const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testSendComplaint() {
    const loginRes = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });

    let token = '';
    if (loginRes.ok) {
        const data = await loginRes.json();
        token = data.access_token;
    }

    if (!token) {
        console.error('Failed to login. Check if server is on port 5000 and credentials match.');
        const text = await loginRes.text();
        console.log('Response:', text);
        return;
    }

    console.log('LoggedIn. Sending complaint...');
    const res = await fetch('http://localhost:5000/api/social/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            receiverId: '2',
            content: 'TEST COMPLAINT FROM ADMIN TO SELF AT PORT 5000',
            isComplaint: true
        })
    });

    if (res.ok) {
        console.log('SUCCESS: Complaint sent');
        const data = await res.json();
        console.log('Response:', data);
    } else {
        console.error('FAILED: Status', res.status);
        console.log(await res.text());
    }
}

testSendComplaint();
