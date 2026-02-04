const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function runTest() {
    try {
        console.log('Step 1: Logging in as Student (ahmed@example.com)...');
        const studLoginRes = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'ahmed@example.com', password: '123456' })
        });

        if (!studLoginRes.ok) {
            console.error('Student login failed:', studLoginRes.status, await studLoginRes.text());
            return;
        }

        const loginData = await studLoginRes.json();
        const studToken = loginData.accessToken; // FIXED: accessToken (not access_token)
        console.log('Student login success. Token obtained.');

        console.log('Step 2: Sending complaint to Admin (ID 2)...');
        const complaintRes = await fetch('http://localhost:5000/api/social/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${studToken}`
            },
            body: JSON.stringify({
                receiverId: '2',
                content: 'REAL COMPLAINT TEST: IS COMPLAINT FLAG SET?',
                isComplaint: true
            })
        });

        if (complaintRes.ok) {
            console.log('SUCCESS: Complaint sent');
            const data = await complaintRes.json();
            console.log('Response:', data);
        } else {
            console.error('FAILED: Status', complaintRes.status, await complaintRes.text());
        }
    } catch (err) {
        console.error('Error during test:', err);
    }
}

runTest();
