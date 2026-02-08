const { listFiles } = require('./server/r2.cjs');

async function checkResources() {
    console.log('Listing files in R2 Books/ folder...');
    try {
        const { files } = await listFiles('Books/');
        console.log('Files in Books/:');
        files.forEach(f => console.log(`- ${f.name} (${f.fullName})`));

        console.log('\nListing files in R2 uploads/ folder...');
        const { files: uploadFiles } = await listFiles('uploads/');
        console.log('Files in uploads/:');
        uploadFiles.forEach(f => console.log(`- ${f.name} (${f.fullName})`));
    } catch (e) {
        console.error('Error listing R2 files:', e.message);
    }
}

checkResources();
