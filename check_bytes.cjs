const fs = require('fs');

function check(filePath) {
    const buffer = fs.readFileSync(filePath);
    console.log(`Buffer length: ${buffer.length}`);
    console.log('First 20 bytes:', buffer.slice(0, 20).toString('hex'));

    // Try to see if it's already corrupted UTF-8
    const content = buffer.toString('utf8');
    if (content.includes('Ïº┘äÏ»Ï▒Ï│')) {
        console.log('Confirmed: content is corrupted UTF-8 (interpreted as ANSI then saved as UTF-8)');
    } else {
        console.log('Content looks different. Trying sample...');
        console.log(content.substring(0, 100));
    }
}

check('full_prod_courses.json');
check('full_prod_courses_utf8.json');
