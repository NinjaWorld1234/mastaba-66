const { spawn } = require('child_process');
const path = require('path');

const SSH_PASS = '@Qqaazz2222##';
const SSH_USER = 'root';
const SSH_HOST = '72.61.88.213';
const FILE_TO_UPLOAD = 'deploy_full_restoration_v1.zip';
const DEST_PATH = '/tmp/';

function runSCP() {
    return new Promise((resolve, reject) => {
        console.log(`>>> Uploading ${FILE_TO_UPLOAD} to ${SSH_USER}@${SSH_HOST}:${DEST_PATH}...`);
        const scp = spawn('scp', [
            '-o', 'StrictHostKeyChecking=no',
            FILE_TO_UPLOAD,
            `${SSH_USER}@${SSH_HOST}:${DEST_PATH}`
        ]);

        // Increase timeout to 30s before sending password to be safe

        scp.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        scp.stderr.on('data', (data) => {
            const str = data.toString();
            process.stderr.write(data);

            if (str.includes('password:')) {
                console.log('>>> Sending password with delay...');
                setTimeout(() => {
                    scp.stdin.write(SSH_PASS + '\n');
                }, 500);
            }
        });

        scp.on('close', (code) => {
            if (code === 0) {
                console.log('>>> SCP successful!');
                resolve();
            } else {
                reject(new Error(`SCP exited with code ${code}`));
            }
        });

        // Timeout after 5 minutes
        setTimeout(() => {
            console.error('>>> Upload timed out!');
            scp.kill();
            reject(new Error('Upload timed out'));
        }, 300000);
    });
}

runSCP().catch(err => {
    console.error('Upload failed:', err);
    process.exit(1);
});
