const fetch = require('node-fetch');

async function testApiGetUsers() {
    console.log('Testing GET /api/users...');
    try {
        const response = await fetch('http://localhost:5000/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
                // Add Authorization if needed later, usually required but let's see what happens without or with a mocked one if we had one.
                // The current api.getUsers() uses a token. 
                // In server/index.cjs, is /api/users protected globally?
                // I need to check if middleware is applied.
            }
        });

        const status = response.status;
        console.log(`Response Status: ${status}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`Users found: ${data.length}`);
            console.log(data);
        } else {
            console.log('Response:', await response.text());
        }

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testApiGetUsers();
