const parseHexWKB = (hex) => {
    try {
        if (!hex || typeof hex !== 'string') return null;
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
        // Pad if odd length (shouldn't happen for valid WKB but good safety)
        const updatedHexString = cleanHex.length % 2 !== 0 ? '0' + cleanHex : cleanHex;

        const buffer = new Uint8Array(updatedHexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))).buffer;
        const view = new DataView(buffer);

        const littleEndian = view.getUint8(0) === 1;
        const type = view.getUint32(1, littleEndian);

        console.log("Endian:", littleEndian ? "Little" : "Big");
        console.log("Type:", type.toString(16));

        let offset = 5;

        // Check for SRID flag (0x20000000)
        if (type & 0x20000000) {
            console.log("SRID Flag detected");
            const srid = view.getUint32(5, littleEndian);
            console.log("SRID:", srid);
            offset += 4;
        }

        const x = view.getFloat64(offset, littleEndian);
        const y = view.getFloat64(offset + 8, littleEndian);

        return [x, y];
    } catch (e) {
        console.error("Error:", e);
        return null;
    }
};

const hex = "0101000020E6100000A137DCB44721C0BF7A0E25E0F0C04940";
console.log("Parsing:", hex);
const coords = parseHexWKB(hex); // From user logs
console.log("Result:", coords);

// Test coordinate values roughly:
// A137DCB44721C0BF -> approx -0.1255...
// 7A0E25E0F0C04940 -> approx 51.507...
// Looks like London.
