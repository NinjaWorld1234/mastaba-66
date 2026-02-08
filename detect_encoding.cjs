const fs = require('fs');

function decode(filePath) {
    const buffer = fs.readFileSync(filePath);

    // Common encodings
    const encodings = ['utf8', 'utf16le', 'latin1'];

    console.log(`Analyzing: ${filePath}`);

    for (const enc of encodings) {
        try {
            const content = buffer.toString(enc);
            // Check if it looks like JSON and has Arabic hints
            if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
                // Look for "مدخل" or common Arabic characters
                if (content.includes('مدخل') || content.includes('الدرس')) {
                    console.log(`Found likely encoding: ${enc}`);
                    const sample = content.substring(0, 500);
                    console.log('Sample Content:');
                    console.log(sample);
                    return content;
                }
            }
        } catch (e) {
            // Ignore errors
        }
    }

    // Fallback: manually check for common corruption patterns
    const utf8Content = buffer.toString('utf8');
    if (utf8Content.includes('Ïº┘äÏ»Ï▒Ï│')) {
        console.log('Detected likely UTF-8 interpreted as something else (corruption).');
        // This often happens if the source was actually UTF-8 but PowerShell read it as ANSI then wrote as UTF-8.
    }

    console.log('Could not automatically determine correct encoding.');
}

decode('full_prod_courses.json');
