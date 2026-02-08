const { spawn } = require('child_process');

function runSSH(command) {
    return new Promise((resolve, reject) => {
        const ssh = spawn('ssh', [
            '-o', 'StrictHostKeyChecking=no',
            'naser123@147.93.62.42',
            command
        ], { shell: true });

        let output = '';
        ssh.stdout.on('data', (data) => {
            output += data.toString();
            process.stdout.write(data);
        });

        ssh.stderr.on('data', (data) => {
            const msg = data.toString();
            process.stderr.write(msg);
            if (msg.toLowerCase().includes('password:')) {
                ssh.stdin.write('@Qqaazz2222##\n');
            }
        });

        ssh.on('close', (code) => {
            if (code === 0) resolve(output);
            else reject(new Error(`Exit code ${code}`));
        });
    });
}

async function checkLogs() {
    try {
        console.log('>>> Checking Docker container logs (recent 50 lines)...');
        await runSSH('cd /var/www/apps/scientific-bench && sudo docker-compose logs --tail=50');
    } catch (err) {
        console.error('>>> Error:', err.message);
    }
}

checkLogs();
