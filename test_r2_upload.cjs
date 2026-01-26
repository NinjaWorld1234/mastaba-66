
const { generateUploadUrl, s3Client, R2_BUCKET_NAME } = require('./server/r2.cjs');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');

async function testR2() {
    console.log("Testing R2 Integration...");
    try {
        const fileName = "test-video-" + Date.now() + ".txt";
        const fileType = "text/plain";

        console.log(`Generating upload URL for ${fileName}...`);
        const { uploadUrl, key, publicUrl } = await generateUploadUrl(fileName, fileType);

        console.log("Upload URL:", uploadUrl);
        console.log("Public URL:", publicUrl);
        console.log("Key:", key);

        // Test Upload by actually using the signed URL (simulating frontend)
        console.log("Attempting upload via Signed URL...");

        const uploadReq = https.request(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': fileType,
                'Content-Length': 12
            }
        }, (res) => {
            console.log(`Upload Response Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log("Upload Successful!");
                console.log(`Verify at: ${publicUrl}`);
            } else {
                console.error("Upload Failed Status:", res.statusCode);
            }
        });

        uploadReq.on('error', (e) => {
            console.error("Upload Request Error:", e);
        });

        uploadReq.write("Hello World!");
        uploadReq.end();

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

testR2();
