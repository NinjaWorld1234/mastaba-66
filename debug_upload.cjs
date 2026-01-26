const fetch = require('node-fetch'); // Needs node-fetch or node 18+ (using global fetch)

// We'll use the running server URL
const API_URL = 'http://localhost:5000/api/r2/upload-url';

async function testUpload() {
    console.log('1. Testing POST to ' + API_URL);

    const fileName = 'test-debug-' + Date.now() + '.txt';
    const fileType = 'text/plain';

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName, fileType })
        });

        if (!res.ok) {
            console.error('❌ Failed to get upload URL:', res.status, res.statusText);
            const text = await res.text();
            console.error('Response:', text);
            return;
        }

        const data = await res.json();
        console.log('✅ Got upload URL:', data.uploadUrl);
        console.log('   Key:', data.key);
        console.log('   Public:', data.publicUrl);

        console.log('2. Testing PUT to Upload URL...');

        const putRes = await fetch(data.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': fileType },
            body: 'This is a test file content.'
        });

        if (!putRes.ok) {
            console.error('❌ PUT Upload Failed:', putRes.status, putRes.statusText);
            const putText = await putRes.text();
            console.error('PUT Response:', putText);
            return;
        }

        console.log('✅ PUT Upload Successful!');

    } catch (e) {
        console.error('❌ Exception:', e);
    }
}

// Check if fetch available (Node 18+)
if (!global.fetch) {
    console.log('Polyfilling fetch...');
    // Minimal polyfll or just warn. 
    // Assuming Node environment has fetch or we can use http module.
    // Let's assume the user has node 18+ (since they have "node server.cjs" running successfully presumably recently).
}

testUpload();
