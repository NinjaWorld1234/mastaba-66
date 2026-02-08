const { spawn } = require('child_process');

async function runInteractive(command, args, password) {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { shell: true });
        let passwordSent = false;
        let output = '';

        const handleOutput = (data) => {
            const msg = data.toString();
            output += msg;
            process.stdout.write(msg);
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
            resolve({ code, output });
        });
    });
}

async function main() {
    const password = '@Qqaazz2222##';
    const server = 'root@72.61.88.213';

    console.log('\n>>> Checking server files...');
    const checkCommand = [
        'ls -lh /tmp/deploy_production_latest.zip',
        'ls -lh /var/www/apps/scientific-bench/dist/index.html',
        'grep "assets/index" /var/www/apps/scientific-bench/dist/index.html | head -n 5'
    ].join(' && ');

    const result = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        server,
        `"${checkCommand}"`
    ], password);

    if (result.code === 0) {
        console.log('\n>>> Check completed successfully.');
    } else {
        console.error('\n>>> Check failed with code ' + result.code);
    }
}

main();
