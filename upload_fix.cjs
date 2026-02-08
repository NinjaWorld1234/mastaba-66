const { spawn } = require('child_process');

const scp = spawn('scp', [
    '-o', 'StrictHostKeyChecking=no',
    'deploy_production_latest.zip',
    'naser123@147.93.62.42:/tmp/'
], {
    shell: true
});

scp.stdout.on('data', (data) => {
    process.stdout.write(data);
});

scp.stderr.on('data', (data) => {
    const msg = data.toString();
    process.stderr.write(msg);
    if (msg.toLowerCase().includes('password:')) {
        console.log('\n[Script] Sending password...');
        scp.stdin.write('@Qqaazz2222##\n');
    }
});

scp.on('close', (code) => {
    console.log(`\n[Script] scp process exited with code ${code}`);
    process.exit(code);
});
