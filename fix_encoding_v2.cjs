const fs = require('fs');

function convert() {
    const buffer = fs.readFileSync('full_prod_courses.json');
    // Buffer starts with fffe -> UTF-16 LE
    const content = buffer.toString('utf16le');
    // Strip BOM if it persisted as a character
    const cleanContent = content.replace(/^\uFEFF/, '').replace(/^\uFFFE/, '');

    try {
        const data = JSON.parse(cleanContent);
        console.log(`Success! Decoded ${data.length} courses.`);
        console.log('Sample Title:', data[0].title);

        // Write as clean UTF-8
        fs.writeFileSync('full_prod_courses_fixed.json', JSON.stringify(data, null, 2), 'utf8');
        console.log('Saved to full_prod_courses_fixed.json');

        // Check for any book references
        const hasBooks = cleanContent.includes('.pdf') || cleanContent.toLowerCase().includes('book');
        console.log('Contains PDF/Book references:', hasBooks);
    } catch (e) {
        console.error('Failed to parse clean content as JSON:', e.message);
        console.log('Start of content:', cleanContent.substring(0, 100));
    }
}

convert();
