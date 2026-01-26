const { s3Client, R2_BUCKET_NAME } = require('./server/r2.cjs');
const { PutBucketPolicyCommand } = require('@aws-sdk/client-s3');

async function setPublicPolicy() {
    console.log(`Setting Public Policy for bucket: ${R2_BUCKET_NAME}...`);

    const policy = {
        Version: "2012-10-17",
        Statement: [
            {
                Sid: "PublicReadGetObject",
                Effect: "Allow",
                Principal: "*",
                Action: "s3:GetObject",
                Resource: `arn:aws:s3:::${R2_BUCKET_NAME}/*`
            }
        ]
    };

    const command = new PutBucketPolicyCommand({
        Bucket: R2_BUCKET_NAME,
        Policy: JSON.stringify(policy)
    });

    try {
        await s3Client.send(command);
        console.log('✅ Successfully set Public Read Policy!');
    } catch (e) {
        console.error('❌ Failed to set Policy:', e);
        console.error('This is expected if using R2 API Tokens without Admin permissions.');
        console.error('Please ensure the R2 bucket allows public access via Cloudflare Dashboard if this fails.');
    }
}

setPublicPolicy();
