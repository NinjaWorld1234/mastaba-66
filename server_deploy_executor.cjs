const { spawn } = require('child_process');

function runSSH(command) {
    return new Promise((resolve, reject) => {
        const ssh = spawn('ssh', [
            '-o', 'StrictHostKeyChecking=no',
            'naser123@147.93.62.42',
            command
        ], { shell: true });

        let output = '';
        let errorOutput = '';

        ssh.stdout.on('data', (data) => {
            output += data.toString();
            process.stdout.write(data);
        });

        ssh.stderr.on('data', (data) => {
            const msg = data.toString();
            errorOutput += msg;
            process.stderr.write(msg);
            if (msg.toLowerCase().includes('password:')) {
                ssh.stdin.write('@Qqaazz2222##\n');
            }
        });

        ssh.on('close', (code) => {
            if (code === 0) resolve(output);
            else reject(new Error(`Command failed with code ${code}. Error: ${errorOutput}`));
        });
    });
}

async function deploy() {
    try {
        console.log('>>> Verifying file in /tmp...');
        await runSSH('ls -l /tmp/deploy_production_latest.zip');

        console.log('>>> Moving file to app directory...');
        // Using sudo because /var/www/apps might require it, or just path if nasaer123 has perms
        // deploy.sh assumes APP_DIR="/var/www/apps/scientific-bench"
        await runSSH('sudo mv /tmp/deploy_production_latest.zip /var/www/apps/scientific-bench/ || mv /tmp/deploy_production_latest.zip /var/www/apps/scientific-bench/');

        console.log('>>> Running deploy.sh...');
        await runSSH('cd /var/www/apps/scientific-bench && sudo bash deploy.sh || bash deploy.sh');

        console.log('>>> Deployment completed successfully!');
    } catch (err) {
        console.error('>>> Deployment failed:', err.message);
        process.exit(1);
    }
}

deploy();
