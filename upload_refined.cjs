const { spawn } = require('child_process');

async function runScp() {
    console.log('>>> Starting SCP (Refined)...');
    // Using spawn without shell often helps with piping
    const scp = spawn('scp', [
        '-o', 'ConnectTimeout=15',
        '-o', 'StrictHostKeyChecking=no',
        'deploy_production_latest.zip',
        'naser123@147.93.62.42:/tmp/'
    ]);

    scp.stdout.on('data', (data) => {
        console.log('[SCP STDOUT]', data.toString());
    });

    scp.stderr.on('data', (data) => {
        const msg = data.toString();
        console.log('[SCP STDERR]', msg);
        if (msg.toLowerCase().includes('password')) {
            console.log('[Script] Password prompt detected. Waiting 2s before sending...');
            setTimeout(() => {
                console.log('[Script] Sending password now.');
                scp.stdin.write('@Qqaazz2222##\n');
                // Don't end stdin yet, sometimes it closes the whole pipe
            }, 2000);
        }
    });

    return new Promise((resolve) => {
        scp.on('close', (code) => {
            console.log('[Script] SCP exited with code:', code);
            resolve(code);
        });

        // Timeout after 3 minutes
        setTimeout(() => {
            console.log('[Script] Timeout reached. Killing process.');
            scp.kill();
            resolve(-1);
        }, 180000);
    });
}

runScp();
