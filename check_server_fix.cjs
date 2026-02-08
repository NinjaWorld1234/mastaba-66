const { spawn } = require('child_process');

async function runSSH(command) {
    return new Promise((resolve) => {
        const proc = spawn('ssh', [
            '-o', 'StrictHostKeyChecking=no',
            'naser123@147.93.62.42',
            command
        ], { shell: true });

        let output = '';
        proc.stdout.on('data', (data) => {
            output += data.toString();
            process.stdout.write(data);
        });

        proc.stderr.on('data', (data) => {
            const msg = data.toString();
            if (msg.toLowerCase().includes('password:')) {
                proc.stdin.write('@Qqaazz2222##\n');
            } else {
                process.stderr.write(msg);
            }
        });

        proc.on('close', (code) => {
            resolve({ code, output });
        });
    });
}

async function check() {
    console.log('>>> Checking auth.cjs on server for fix...');
    await runSSH('grep -n "sendVerificationEmail" /var/www/apps/scientific-bench/server/routes/auth.cjs');

    console.log('\n>>> Checking Docker container status...');
    await runSSH('sudo docker ps');

    console.log('\n>>> Checking Docker logs (last 30 lines)...');
    await runSSH('cd /var/www/apps/scientific-bench && sudo docker-compose logs --tail=30');
}

check();
