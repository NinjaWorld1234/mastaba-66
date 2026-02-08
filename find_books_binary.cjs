const fs = require('fs');

function findJson() {
    const buffer = fs.readFileSync('database.sqlite');
    // Try to find strings that look like JSON or book data
    const content = buffer.toString('utf8');

    // Search for book-like patterns
    const searchPatterns = [
        /course_aqeeda/,
        /course_madkhal/,
        /lib_/,
        /\.pdf/
    ];

    searchPatterns.forEach(pattern => {
        const match = content.match(pattern);
        console.log(`Pattern ${pattern}: ${match ? 'Found' : 'Not Found'}`);
    });

    // Try to find the books table content
    // It usually looks like a series of strings: id, title, path, courseId
    const parts = content.split('\0').filter(p => p.length > 5);
    console.log(`Found ${parts.length} potential strings in database.`);

    // Look for strings containing .pdf and a course_id
    const books = [];
    parts.forEach((p, i) => {
        if (p.includes('.pdf')) {
            // Check neighbors for courseId
            const context = parts.slice(Math.max(0, i - 5), i + 5);
            console.log('PDF Found:', p);
            console.log('Context:', context);
        }
    });
}

findJson();
