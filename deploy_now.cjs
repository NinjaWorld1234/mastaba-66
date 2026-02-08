const { spawn } = require('child_process');

async function runInteractive(command, args, password) {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { shell: true });

        proc.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        proc.stderr.on('data', (data) => {
            const msg = data.toString();
            process.stderr.write(msg);
            if (msg.toLowerCase().includes('password:')) {
                proc.stdin.write(password + '\n');
            }
        });

        proc.on('close', (code) => {
            resolve(code);
        });
    });
}

async function main() {
    const password = '@Qqaazz2222##';

    console.log('\n>>> Step 1: Uploading fix package...');
    const scpCode = await runInteractive('scp', [
        '-o', 'StrictHostKeyChecking=no',
        'deploy_production_latest.zip',
        'root@72.61.88.213:/tmp/'
    ], password);

    if (scpCode !== 0) {
        console.error('>>> Error: Upload failed with code ' + scpCode);
        return;
    }

    console.log('\n>>> Step 2: Executing deployment on server...');
    const deployCommand = [
        'sudo mv /tmp/deploy_production_latest.zip /var/www/apps/scientific-bench/',
        'cd /var/www/apps/scientific-bench',
        'sudo bash deploy.sh'
    ].join(' && ');

    const sshCode = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        'root@72.61.88.213',
        `"${deployCommand}"`
    ], password);

    if (sshCode === 0) {
        console.log('\n>>> SUCCESS: Fix deployed successfully!');
    } else {
        console.error('\n>>> Error: Deployment failed with code ' + sshCode);
    }
}

main();
