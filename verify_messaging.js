
async function verifyMessaging() {
    console.log('--- Starting Messaging Verification (Using Ahmed) ---');

    try {
        const senderEmail = 'ahmed@example.com';
        const receiverId = '2'; // Admin
        const password = 'password123';

        // Login Sender
        console.log(`1. Login as Sender: ${senderEmail}...`);
        const senderLoginRes = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: senderEmail, password })
        });

        if (!senderLoginRes.ok) throw new Error(`Login Failed: ${senderLoginRes.status} ${await senderLoginRes.text()}`);

        const senderData = await senderLoginRes.json();
        const senderToken = senderData.accessToken;
        console.log('   Sender Logged In.');

        // 2. Send Message
        console.log('2. Sending Message to Admin (ID: 2)...');
        const sendRes = await fetch('http://localhost:5000/api/social/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${senderToken}`
            },
            body: JSON.stringify({
                receiverId: receiverId,
                content: 'Hello from Final Verification Script!'
            })
        });

        if (!sendRes.ok) throw new Error(`Send Failed: ${sendRes.status} ${await sendRes.text()}`);
        console.log('   Message Sent.');

        const msgData = await sendRes.json();
        console.log('--- SUCCESS: Message sent! ---');
        console.log(JSON.stringify(msgData, null, 2));

    } catch (error) {
        console.error('Verification Error:', error);
    }
}

verifyMessaging();
