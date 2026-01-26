
async function testLogin() {
    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'ahmed@example.com',
                password: '123456'
            })
        });

        const status = response.status;
        const text = await response.text();

        console.log(`Status: ${status}`);
        console.log(`Body: ${text}`);

        if (response.ok) {
            console.log("Login SUCCESS");
        } else {
            console.log("Login FAILED");
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testLogin();
