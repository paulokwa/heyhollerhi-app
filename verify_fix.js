
const locs = [
    "POINT(-63.5859 44.6486)",
    "POINT (-63.5859 44.6486)", // With space
    "POINT(-63.585900 44.648600)",
    "Point (-63.585900 44.648600)" // Case insensitive check
];

function test(loc) {
    // This regex must match the one in mapUtils.jsx
    const match = loc.match(/POINT\s*\(([-\d\.]+) ([-\d\.]+)\)/i);
    if (match) {
        console.log(`PASS: Parsed '${loc}': [${parseFloat(match[1])}, ${parseFloat(match[2])}]`);
    } else {
        console.error(`FAIL: Failed to parse '${loc}'`);
    }
}

locs.forEach(test);
