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
        });

        proc.stderr.on('data', (data) => {
            const msg = data.toString();
            if (msg.toLowerCase().includes('password:')) {
                proc.stdin.write('@Qqaazz2222##\n');
            }
        });

        proc.on('close', (code) => {
            resolve({ code, output });
        });
    });
}

async function check() {
    const res = await runSSH('ls -lh /tmp/deploy_production_latest.zip');
    console.log(res.output);
    if (res.code === 0) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

check();
