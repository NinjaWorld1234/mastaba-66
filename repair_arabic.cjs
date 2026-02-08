const fs = require('fs');

function repair(str) {
    try {
        // Convert the string (which is UTF-8 characters that look like Latin-1)
        // back to bytes using Latin-1, then interpret those bytes as UTF-8.
        return Buffer.from(str, 'binary').toString('utf8');
    } catch (e) {
        return str;
    }
}

function process() {
    const buffer = fs.readFileSync('full_prod_courses.json');
    // It's UTF-16 LE but the content inside is the corrupted string
    let content = buffer.toString('utf16le');
    // Strip BOM
    content = content.replace(/^\uFEFF/, '').replace(/^\uFFFE/, '');

    const data = JSON.parse(content);

    data.forEach(course => {
        course.title = repair(course.title);
        course.description = repair(course.description);
        course.category = repair(course.category);
        course.instructor = repair(course.instructor);

        if (course.episodes) {
            course.episodes.forEach(ep => {
                ep.title = repair(ep.title);
            });
        }
    });

    console.log('Repaired Sample Title:', data[0].title);
    console.log('Repaired Sample Episode:', data[0].episodes[0].title);

    fs.writeFileSync('full_prod_courses_repaired.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('Saved to full_prod_courses_repaired.json');
}

process();
