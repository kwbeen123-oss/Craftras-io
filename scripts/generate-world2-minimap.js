const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const {
    BLOCKS_X,
    BLOCKS_Y,
    WORLD2_BLOCK_OFFSET,
    FLOORS,
    generateCell,
    hash01,
} = require("../server/game/craftras/worldGenerator.js");

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
}

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
    const name = Buffer.from(type, "ascii");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
    return Buffer.concat([length, name, data, checksum]);
}

const minX = -Math.floor(BLOCKS_X / 2);
const minY = -Math.floor(BLOCKS_Y / 2);

function generateMinimap(blockOffset, fileName) {
    const stride = BLOCKS_X * 4 + 1;
    const pixels = Buffer.alloc(stride * BLOCKS_Y);
    const world2 = blockOffset === WORLD2_BLOCK_OFFSET;

    for (let y = 0; y < BLOCKS_Y; y++) {
        const row = y * stride;
        pixels[row] = 0;
        for (let x = 0; x < BLOCKS_X; x++) {
            const worldX = minX + blockOffset + x;
            const worldY = minY + y;
            const cell = generateCell(worldX, worldY, 1337);
            const noise = hash01(x, y, 28_411 + blockOffset) - 0.5;
            let color;
            if (cell.worldConnector) color = [73 + noise * 8, 78 + noise * 8, 82 + noise * 8];
            else if (world2 && cell.floor === FLOORS.SAND) color = [218 + noise * 18, 187 + noise * 14, 111 + noise * 10];
            else if (!world2 && cell.region === "surface") color = [31 + noise * 18, 177 + noise * 20, 72 + noise * 16];
            else color = [world2 ? 113 : 145, world2 ? 116 : 147, world2 ? 119 : 148].map(value => value + noise * 12);
            const offset = row + 1 + x * 4;
            pixels[offset] = Math.max(0, Math.min(255, color[0]));
            pixels[offset + 1] = Math.max(0, Math.min(255, color[1]));
            pixels[offset + 2] = Math.max(0, Math.min(255, color[2]));
            pixels[offset + 3] = 255;
        }
    }

    const header = Buffer.alloc(13);
    header.writeUInt32BE(BLOCKS_X, 0);
    header.writeUInt32BE(BLOCKS_Y, 4);
    header[8] = 8;
    header[9] = 6;
    const output = Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        pngChunk("IHDR", header),
        pngChunk("IDAT", zlib.deflateSync(pixels, { level: 9 })),
        pngChunk("IEND", Buffer.alloc(0)),
    ]);
    const outputPath = path.join(__dirname, `../public/img/${fileName}`);
    fs.writeFileSync(outputPath, output);
    console.log(`Generated ${outputPath} (${BLOCKS_X}x${BLOCKS_Y}).`);
}

generateMinimap(0, "craftras-world1-world2-linked.png");
generateMinimap(WORLD2_BLOCK_OFFSET, "craftras-world2-minimap-linked.png");
