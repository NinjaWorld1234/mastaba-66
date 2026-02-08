const fs = require('fs');

function merge() {
    // 1. Load Healthy Titles
    const healthyCourses = JSON.parse(fs.readFileSync('courses_data.json', 'utf8'));

    // 2. Load Episodes from the other file (interpreting as UTF-16 LE)
    const buffer = fs.readFileSync('full_prod_courses.json');
    const content = buffer.toString('utf16le').replace(/^\uFEFF/, '').replace(/^\uFFFE/, '');
    const fullData = JSON.parse(content);

    // 3. Merge
    const merged = healthyCourses.map(hc => {
        const fullCourse = fullData.find(fc => fc.id === hc.id);
        if (fullCourse && fullCourse.episodes) {
            // Need to fix episode titles if they are broken
            const episodes = fullCourse.episodes.map(ep => {
                // If title looks like mojibake, use a generic one
                if (ep.title.includes('Ïº┘ä')) {
                    return { ...ep, title: `الدرس ${ep.orderIndex || ''}`.trim() };
                }
                return ep;
            });
            return { ...hc, episodes };
        }
        return hc;
    });

    fs.writeFileSync('courses_merged_safe.json', JSON.stringify(merged, null, 2), 'utf8');
    console.log(`Merged ${merged.length} courses with episodes.`);
}

merge();
