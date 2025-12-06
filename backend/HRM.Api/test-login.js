const http = require('http');

function postRequest(email, password) {
    const data = JSON.stringify({
        email: email,
        password: password
    });

    const options = {
        hostname: 'localhost',
        port: 5204,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Testing ${email}: Status Code: ${res.statusCode}`);

        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });

        res.on('end', () => {
            console.log(`Response: ${body}`);
        });
    });

    req.on('error', (error) => {
        console.error(`Error testing ${email}:`, error.message);
    });

    req.write(data);
    req.end();
}

console.log('Starting login tests...');
// Try a few common emails
postRequest('admin@hrm.com', '123456');
postRequest('test@example.com', '123456');
postRequest('nguyenvana@example.com', '123456');
postRequest('user@hrm.com', '123456');
