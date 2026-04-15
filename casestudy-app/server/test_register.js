// USING NATIVE FETCH

async function testRegister() {
    try {
        const id = Math.random().toString(36).substring(7);
        const res = await fetch('http://localhost:4000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `Test User ${id}`,
                email: `test${id}@example.com`,
                password: 'password123',
                role: 'learner'
            })
        });

        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', data);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testRegister();
