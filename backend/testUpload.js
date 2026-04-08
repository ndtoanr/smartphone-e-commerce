const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testUpload() {
    try {
        // 1. Get token
        const loginRes = await axios.post('http://localhost:9000/api/auth/login', {
            email: 'admin@example.com',
            password: 'password' // Assuming this is the admin password
        });
        const token = loginRes.data.token;
        console.log('Got token');

        // 2. Upload file
        const formData = new FormData();
        // Create a dummy image file if not exists
        const dummyPath = path.join(__dirname, 'dummy.png');
        if (!fs.existsSync(dummyPath)) {
            fs.writeFileSync(dummyPath, 'fake image content');
        }

        formData.append('image', fs.createReadStream(dummyPath));

        const uploadRes = await axios.post('http://localhost:9000/api/upload', formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Upload success:', uploadRes.data);
    } catch (error) {
        if (error.response) {
            console.error('Upload failed:', error.response.status, error.response.data);
        } else {
            console.error('Upload failed with error:', error.message);
        }
    }
}

testUpload();
