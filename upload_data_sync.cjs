const { spawn } = require('child_process');
const path = require('path');

const SSH_PASS = '@Qqaazz2222##';
const SSH_USER = 'root';
const SSH_HOST = '72.61.88.213';

function runSCP() {
    return new Promise((resolve, reject) => {
        const scp = spawn('scp', [
            '-o', 'StrictHostKeyChecking=no',
            'data_sync.zip',
            `${SSH_USER}@${SSH_HOST}:/tmp/`
        ]);

        scp.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        scp.stderr.on('data', (data) => {
            const str = data.toString();
            process.stderr.write(data);

            if (str.includes('password:')) {
                scp.stdin.write(SSH_PASS + '\n');
            }
        });

        scp.on('close', (code) => {
            if (code === 0) {
                console.log('SCP successful!');
                resolve();
            } else {
                reject(new Error(`SCP exited with code ${code}`));
            }
        });
    });
}

runSCP().catch(err => {
    console.error('Upload failed:', err);
    process.exit(1);
});
