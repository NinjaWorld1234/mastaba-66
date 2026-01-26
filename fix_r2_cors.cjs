const { s3Client, R2_BUCKET_NAME } = require('./server/r2.cjs');
const { PutBucketCorsCommand } = require('@aws-sdk/client-s3');

async function setCors() {
    console.log(`Setting CORS for bucket: ${R2_BUCKET_NAME}...`);

    const command = new PutBucketCorsCommand({
        Bucket: R2_BUCKET_NAME,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["PUT", "POST", "GET", "HEAD", "DELETE"],
                    AllowedOrigins: ["*"], // Allow all for now to ensure it works
                    ExposeHeaders: ["ETag"],
                    MaxAgeSeconds: 3000
                }
            ]
        }
    });

    try {
        await s3Client.send(command);
        console.log('✅ Successfully set CORS configuration!');
    } catch (e) {
        console.error('❌ Failed to set CORS:', e);
        if (e.name === 'AccessDenied') {
            console.error('Reason: usage of PutBucketCors might be restricted by your API Token permissions.');
        }
    }
}

setCors();
