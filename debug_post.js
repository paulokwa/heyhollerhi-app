import http from 'http';

const postData = JSON.stringify({
    category: 'general',
    content: 'Debug Post Content',
    location: { lat: 20, lng: 0 }
});

const options = {
    hostname: 'localhost',
    port: 8888,
    path: '/.netlify/functions/createPost',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('BODY:', data);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
