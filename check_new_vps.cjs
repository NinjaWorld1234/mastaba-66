const { spawn } = require('child_process');

const SSH_PASS = '@Qqaazz2222##';
const SSH_USER = 'srv1299296';
const SSH_HOST = '72.61.88.213';

function runSSHCommand(command) {
    return new Promise((resolve, reject) => {
        const ssh = spawn('ssh', [
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'UserKnownHostsFile=/dev/null',
            `${SSH_USER}@${SSH_HOST}`,
            command
        ]);

        let output = '';
        let errorOutput = '';

        ssh.stdout.on('data', (data) => {
            output += data.toString();
            process.stdout.write(data);
        });

        ssh.stderr.on('data', (data) => {
            const str = data.toString();
            errorOutput += str;
            process.stderr.write(data);

            if (str.includes('password:')) {
                ssh.stdin.write(SSH_PASS + '\n');
            }
        });

        ssh.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`SSH exited with code ${code}`));
            }
        });
    });
}

(async () => {
    try {
        console.log('>>> Checking connection...');
        await runSSHCommand('echo "Connection Successful"');

        console.log('\n>>> Checking Docker...');
        try {
            await runSSHCommand('docker --version');
        } catch (e) {
            console.log('Docker not found or error checking version');
        }

        console.log('\n>>> Checking Directory...');
        await runSSHCommand('ls -la /var/www/apps');

    } catch (error) {
        console.error('Script failed:', error.message);
    }
})();
