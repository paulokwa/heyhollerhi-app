
const locs = [
    "POINT(-63.5859 44.6486)",
    "POINT (-63.5859 44.6486)", // With space
    "POINT(-63.585900 44.648600)",
    "POINT (-63.585900 44.648600)"
];

function test(loc) {
    const match = loc.match(/POINT\(([-\d\.]+) ([-\d\.]+)\)/);
    if (match) {
        console.log(`Parsed '${loc}': [${parseFloat(match[1])}, ${parseFloat(match[2])}]`);
    } else {
        console.log(`Failed to parse '${loc}'`);
    }
}

locs.forEach(test);
