const { spawn } = require('child_process');

async function runInteractive(command, args, password) {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { shell: true });
        let passwordSent = false;

        const handleOutput = (data) => {
            const msg = data.toString();
            process.stdout.write(msg);
            // Check for password prompt in output
            if (!passwordSent && msg.toLowerCase().includes('password')) {
                passwordSent = true;
                setTimeout(() => {
                    proc.stdin.write(password + '\n');
                }, 100);
            }
        };

        proc.stdout.on('data', handleOutput);
        proc.stderr.on('data', handleOutput);

        proc.on('close', (code) => {
            resolve(code);
        });
    });
}

async function main() {
    const password = '@Qqaazz2222##';
    const server = 'root@72.61.88.213';

    console.log('\n>>> Step 1: Uploading fix package...');
    const scpCode = await runInteractive('scp', [
        '-o', 'StrictHostKeyChecking=no',
        'deploy_production_latest.zip',
        `${server}:/tmp/`
    ], password);

    if (scpCode !== 0) {
        console.error('>>> Error: Upload failed with code ' + scpCode);
        return;
    }

    console.log('\n>>> Step 2: Executing deployment on server...');
    const deployCommand = [
        'mkdir -p /var/www/apps/scientific-bench',
        'mv /tmp/deploy_production_latest.zip /var/www/apps/scientific-bench/',
        'cd /var/www/apps/scientific-bench',
        'unzip -o deploy_production_latest.zip',
        'docker compose up -d --build'
    ].join(' && ');

    const sshCode = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        server,
        `"${deployCommand}"`
    ], password);

    if (sshCode === 0) {
        console.log('\n>>> SUCCESS: Project deployed successfully!');
    } else {
        console.error('\n>>> Error: Deployment failed with code ' + sshCode);
    }
}

main();
