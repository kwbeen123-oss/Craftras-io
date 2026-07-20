const ARENA_SIZE_COMMAND = 2000;
const ARENA_UNIT = 30;
const WORLD_SIZE = ARENA_SIZE_COMMAND * ARENA_UNIT;
const WALL_SIZE = 80;
const BLOCK_GAP = 2;
const BLOCK_SIZE = WALL_SIZE + BLOCK_GAP;
const BLOCKS_X = Math.ceil(WORLD_SIZE / BLOCK_SIZE);
const BLOCKS_Y = Math.ceil(WORLD_SIZE / BLOCK_SIZE);
const MANUAL_CAVE_FILE = "manualCaves.json";
const outsideScoreCache = new Map();

const FLOORS = Object.freeze({
    GRASS: "grass_floor",
    DIRT: "dirt_floor",
    STONE: "stone_floor",
    WATER: "water_floor",
    MAGMA: "magma_floor",
});

const BLOCKS = Object.freeze({
    AIR: "air",
    TREE: "tree",
    LEAF: "leaf",
    GRASS_WALL: "grass_wall",
    DIRT_WALL: "dirt_wall",
    DIRT_PATH: "dirt_path",
    ROCK: "rock",
    COAL_ORE: "coal_ore",
    IRON_ORE: "iron_ore",
    GOLD_ORE: "gold_ore",
    CRYSTAL_ORE: "crystal_ore",
    CAVE_ENTRANCE: "cave_entrance",
    CORE_ROCK: "core_rock",
    PLANK: "plank",
    CRAFTING_TABLE: "crafting_table",
    FURNACE: "furnace",
    TORCH: "torch",
    STEEL_TORCH: "steel_torch",
    CHEST: "chest",
    BEDROCK: "bedrock",
    COAL_BLOCK: "coal_block",
    IRON_BLOCK: "iron_block",
    GOLD_BLOCK: "gold_block",
    DIAMOND_BLOCK: "diamond_block",
    CHALLENGE_START: "challenge_start",
    CHALLENGE_SPAWN: "challenge_spawn",
    TRANSPARENT_BLOCK: "transparent_block",
    ROUTE_MARKER: "route_marker",
});

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function hash01(x, y, seed) {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (seed | 0) * 1442695041;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967295;
}

function gradientDot(ix, iy, x, y, seed) {
    const angle = hash01(ix, iy, seed) * Math.PI * 2;
    const gx = Math.cos(angle);
    const gy = Math.sin(angle);
    return (x - ix) * gx + (y - iy) * gy;
}

function perlin2D(x, y, seed) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const sx = fade(x - x0);
    const sy = fade(y - y0);

    const n00 = gradientDot(x0, y0, x, y, seed);
    const n10 = gradientDot(x1, y0, x, y, seed);
    const n01 = gradientDot(x0, y1, x, y, seed);
    const n11 = gradientDot(x1, y1, x, y, seed);

    return lerp(lerp(n00, n10, sx), lerp(n01, n11, sx), sy);
}

function fbm2D(x, y, seed, octaves = 4) {
    let total = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let max = 0;

    for (let i = 0; i < octaves; i++) {
        total += perlin2D(x * frequency, y * frequency, seed + i * 1013) * amplitude;
        max += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }

    return total / max;
}

function normalizedPerlin(x, y, seed, scale, octaves = 4) {
    return clamp(fbm2D(x / scale, y / scale, seed, octaves) * 0.5 + 0.5, 0, 1);
}

function getOutsideScore(x, y, seed) {
    const key = `${seed}:${x}:${y}`;
    const cached = outsideScoreCache.get(key);
    if (cached != null) return cached;

    const land = normalizedPerlin(x, y, seed + 1000, 180, 5);
    const broad = normalizedPerlin(x, y, seed + 1100, 520, 3);
    const score = land * 0.7 + broad * 0.3;
    outsideScoreCache.set(key, score);
    return score;
}

function getWaterScore(x, y, seed, outsideScore) {
    const water = normalizedPerlin(x, y, seed + 2000, 130, 4);
    return water * smoothstep(0.50, 0.72, outsideScore);
}

function getOreVein(x, y, seed, scale) {
    const vein = normalizedPerlin(x, y, seed, scale, 5);
    return 1 - Math.abs(vein - 0.5) * 2;
}

function isTreeClusterCell(x, y, seed) {
    const sectorSize = 18;
    const sectorX = Math.floor(x / sectorSize);
    const sectorY = Math.floor(y / sectorSize);

    for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
            const sx = sectorX + ox;
            const sy = sectorY + oy;
            if (hash01(sx, sy, seed + 3400) < 0.18) continue;

            const centerX = sx * sectorSize + 4 + Math.floor(hash01(sx, sy, seed + 3401) * (sectorSize - 8));
            const centerY = sy * sectorSize + 4 + Math.floor(hash01(sx, sy, seed + 3402) * (sectorSize - 8));
            if (!isSurfaceByScore(centerX, centerY, seed)) continue;

            const treeCount = 3 + Math.floor(hash01(sx, sy, seed + 3403) * 8);
            for (let i = 0; i < treeCount; i++) {
                const angle = hash01(sx * 31 + i, sy * 31 - i, seed + 3404) * Math.PI * 2;
                const distance = 2 + Math.floor(hash01(sx * 17 - i, sy * 17 + i, seed + 3405) * 7);
                const jitterX = Math.floor(hash01(sx + i, sy - i, seed + 3406) * 3) - 1;
                const jitterY = Math.floor(hash01(sx - i, sy + i, seed + 3407) * 3) - 1;
                const treeX = centerX + Math.round(Math.cos(angle) * distance) + jitterX;
                const treeY = centerY + Math.round(Math.sin(angle) * distance) + jitterY;
                if (x === treeX && y === treeY) return true;
            }
        }
    }

    return false;
}

function getSmallPathScore(x, y, seed) {
    const a = normalizedPerlin(x, y, seed + 8000, 30, 4);
    const b = normalizedPerlin(x + 91, y - 37, seed + 8100, 46, 3);
    const c = normalizedPerlin(x - 52, y + 113, seed + 8200, 72, 3);

    const ridgeA = 1 - Math.abs(a - 0.5) * 2;
    const ridgeB = 1 - Math.abs(b - 0.5) * 2;
    const ridgeC = 1 - Math.abs(c - 0.5) * 2;

    return Math.max(ridgeA, ridgeB * 0.97, ridgeC * 0.94);
}

const cavePathCache = new Map();
const CAVE_WORM_MIN_LENGTH = 4500;
const CAVE_WORM_TARGET_LENGTH = 5600;
let manualCaveSet = null;
let manualBedrockSet = null;
const oreLayoutCache = new Map();

const ORE_GROUPS = [
    { block: BLOCKS.CRYSTAL_ORE, targetCount: 498, minDepth: 30, maxDepth: Infinity, spacing: 48, sector: 20, chance: 1, minCount: 4, maxCount: 8, salt: 12400 },
    { block: BLOCKS.GOLD_ORE, targetCount: 1103, minDepth: 10, maxDepth: Infinity, spacing: 40, sector: 20, chance: 1, minCount: 5, maxCount: 8, salt: 12300 },
    { block: BLOCKS.IRON_ORE, targetCount: 1549, minDepth: 10, maxDepth: Infinity, spacing: 39, sector: 20, chance: 1, minCount: 7, maxCount: 10, salt: 12200 },
    { block: BLOCKS.COAL_ORE, targetCount: 2555, minDepth: 1, maxDepth: 6, spacing: 25, sector: 4, chance: 1, minCount: 13, maxCount: 21, salt: 12100 },
];

// Row bounds copied from the green area in terrain2.png. Filling each row
// removes tiny paint gaps while preserving the marked silhouette.
const BROKEN_KINGDOM_ROW_BOUNDS = Object.freeze([
    [0,142], [0,143], [0,144], [0,145], [0,146], [0,146], [0,147], [0,148], [0,148], [0,148], [0,148], [0,148],
    [0,148], [0,148], [0,148], [0,148], [0,148], [0,148], [0,147], [0,146], [0,145], [0,144], [0,143], [0,142],
    [0,142], [0,142], [0,142], [0,143], [0,143], [0,143], [0,144], [0,144], [0,144], [0,144], [0,144], [0,144],
    [0,144], [0,144], [0,144], [0,144], [0,144], [0,144], [0,144], [0,144], [0,144], [0,144], [0,144], [0,143],
    [0,142], [0,142], [0,141], [0,140], [0,140], [0,139], [0,139], [0,139], [0,139], [0,139], [0,139], [0,139],
    [0,139], [0,139], [0,139], [0,138], [0,138], [0,137], [0,135], [0,134], [0,134], [0,133], [0,133], [0,133],
    [0,132], [0,131], [0,130], [0,129], [0,127], [0,126], [0,125], [0,124], [0,124], [0,123], [0,123], [0,123],
    [0,122], [0,122], [0,122], [0,121], [0,121], [0,120], [0,119], [0,119], [0,118], [0,118], [0,117], [0,117],
    [0,116], [0,115], [0,115], [0,114], [0,114], [0,113], [0,113], [0,112], [0,112], [0,112], [0,112], [0,112],
    [0,112], [0,111], [0,109], [0,108], [0,107], [0,106], [0,105], [0,104], [0,103], [0,102], [0,101], [0,99],
    [0,98], [0,97], [0,95], [0,93], [0,91], [0,90], [0,87], [1,76], [3,21],
]);

function isBrokenKingdomSurfaceCell(x, y) {
    return isNearBrokenKingdomSurfaceCell(x, y, 0);
}

function isNearBrokenKingdomSurfaceCell(x, y, padding = 0) {
    const minX = -Math.floor(BLOCKS_X / 2);
    const minY = -Math.floor(BLOCKS_Y / 2);
    const safePadding = Math.max(0, Math.floor(Number(padding) || 0));
    const column = x - minX;
    const centerRow = y - minY;
    for (let row = centerRow - safePadding; row <= centerRow + safePadding; row++) {
        const bounds = BROKEN_KINGDOM_ROW_BOUNDS[row];
        if (!bounds) continue;
        if (column >= bounds[0] - safePadding && column <= bounds[1] + safePadding) return true;
    }
    return false;
}

function cellKey(x, y) {
    return `${x},${y}`;
}

function loadManualCaves() {
    if (manualCaveSet) return manualCaveSet;

    manualCaveSet = new Set();
    manualBedrockSet = new Set();
    if (typeof require !== "function" || typeof __dirname !== "string") return manualCaveSet;

    try {
        const fs = require("fs");
        const path = require("path");
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, MANUAL_CAVE_FILE), "utf8"));
        for (const key of data.caves || []) {
            manualCaveSet.add(Array.isArray(key) ? cellKey(key[0], key[1]) : key);
        }
        for (const key of data.bedrock || []) {
            manualBedrockSet.add(Array.isArray(key) ? cellKey(key[0], key[1]) : key);
        }
    } catch {
        // Manual caves are optional; the generator should still work without the overlay file.
    }

    return manualCaveSet;
}

function loadManualBedrock() {
    if (!manualBedrockSet) loadManualCaves();
    return manualBedrockSet;
}

function isInsideGeneratedWorld(x, y) {
    const minX = -Math.floor(BLOCKS_X / 2);
    const minY = -Math.floor(BLOCKS_Y / 2);
    return x >= minX && y >= minY && x < minX + BLOCKS_X && y < minY + BLOCKS_Y;
}

function buildOpenDistanceMap(seed) {
    const minX = -Math.floor(BLOCKS_X / 2);
    const minY = -Math.floor(BLOCKS_Y / 2);
    const total = BLOCKS_X * BLOCKS_Y;
    const distances = new Uint16Array(total);
    distances.fill(0xffff);
    const queue = new Int32Array(total);
    const caves = loadManualCaves();
    let head = 0;
    let tail = 0;

    for (let iy = 0; iy < BLOCKS_Y; iy++) {
        const y = minY + iy;
        for (let ix = 0; ix < BLOCKS_X; ix++) {
            const x = minX + ix;
            if (!isSurfaceByScore(x, y, seed) && !caves.has(cellKey(x, y))) continue;
            const index = iy * BLOCKS_X + ix;
            distances[index] = 0;
            queue[tail++] = index;
        }
    }

    while (head < tail) {
        const index = queue[head++];
        const x = index % BLOCKS_X;
        const y = Math.floor(index / BLOCKS_X);
        const nextDistance = distances[index] + 1;

        if (x > 0) visit(index - 1, nextDistance);
        if (x + 1 < BLOCKS_X) visit(index + 1, nextDistance);
        if (y > 0) visit(index - BLOCKS_X, nextDistance);
        if (y + 1 < BLOCKS_Y) visit(index + BLOCKS_X, nextDistance);
    }

    function visit(index, distance) {
        if (distances[index] <= distance) return;
        distances[index] = distance;
        queue[tail++] = index;
    }

    return {
        get(x, y) {
            const ix = x - minX;
            const iy = y - minY;
            if (ix < 0 || iy < 0 || ix >= BLOCKS_X || iy >= BLOCKS_Y) return 0;
            return distances[iy * BLOCKS_X + ix];
        },
    };
}

function buildOreLayout(seed) {
    const cached = oreLayoutCache.get(seed);
    if (cached) return cached;

    const minX = -Math.floor(BLOCKS_X / 2);
    const minY = -Math.floor(BLOCKS_Y / 2);
    const maxX = minX + BLOCKS_X;
    const maxY = minY + BLOCKS_Y;
    const openDistance = buildOpenDistanceMap(seed);
    const ores = new Map();
    const occupied = new Set();

    const isNormalRock = (x, y, config) => {
        if (!isInsideGeneratedWorld(x, y) || isSurfaceByScore(x, y, seed) || isCavePathCell(x, y, seed)) return false;
        const depth = openDistance.get(x, y);
        return depth >= config.minDepth && depth <= config.maxDepth && getOutsideWallDepth(x, y, seed) === 0;
    };

    for (const config of ORE_GROUPS) {
        const centers = [];
        let placedForBlock = 0;
        const sectorMinX = Math.floor(minX / config.sector);
        const sectorMinY = Math.floor(minY / config.sector);
        const sectorMaxX = Math.ceil(maxX / config.sector);
        const sectorMaxY = Math.ceil(maxY / config.sector);

        sectorLoop: for (let sectorY = sectorMinY; sectorY < sectorMaxY; sectorY++) {
            for (let sectorX = sectorMinX; sectorX < sectorMaxX; sectorX++) {
                if (placedForBlock >= config.targetCount) break sectorLoop;
                if (hash01(sectorX, sectorY, seed + config.salt) > config.chance) continue;

                const x = sectorX * config.sector + Math.floor(hash01(sectorX, sectorY, seed + config.salt + 1) * config.sector);
                const y = sectorY * config.sector + Math.floor(hash01(sectorX, sectorY, seed + config.salt + 2) * config.sector);
                if (!isNormalRock(x, y, config)) continue;
                if (centers.some(center => Math.hypot(center.x - x, center.y - y) < config.spacing)) continue;

                const remaining = config.targetCount - placedForBlock;
                const targetCount = Math.min(remaining, config.minCount + Math.floor(hash01(x, y, seed + config.salt + 3) * (config.maxCount - config.minCount + 1)));
                const cells = [];
                const local = new Set();

                for (let attempt = 0; attempt < 160 && cells.length < targetCount; attempt++) {
                    const angle = hash01(x + attempt * 17, y - attempt * 13, seed + config.salt + 4) * Math.PI * 2;
                    const radius = attempt === 0 ? 0 : 1 + Math.floor(hash01(x - attempt * 11, y + attempt * 19, seed + config.salt + 5) * 3);
                    const oreX = x + Math.round(Math.cos(angle) * radius);
                    const oreY = y + Math.round(Math.sin(angle) * radius);
                    const key = cellKey(oreX, oreY);
                    if (local.has(key) || occupied.has(key) || !isNormalRock(oreX, oreY, config)) continue;
                    local.add(key);
                    cells.push({ x: oreX, y: oreY, key });
                }

                if (cells.length < Math.min(config.minCount, remaining)) continue;
                centers.push({ x, y });
                for (const cell of cells) {
                    occupied.add(cell.key);
                    ores.set(cell.key, config.block);
                }
                placedForBlock += cells.length;
            }
        }

        // A new surface can erase old veins. Refill only the missing cells from
        // evenly ranked sectors so the total stays fixed without enlarging veins.
        for (let pass = 0; placedForBlock < config.targetCount && pass < 4; pass++) {
            const candidates = [];
            for (let sectorY = sectorMinY; sectorY < sectorMaxY; sectorY++) {
                for (let sectorX = sectorMinX; sectorX < sectorMaxX; sectorX++) {
                    const salt = config.salt + 100 + pass * 17;
                    const x = sectorX * config.sector + Math.floor(hash01(sectorX, sectorY, seed + salt + 1) * config.sector);
                    const y = sectorY * config.sector + Math.floor(hash01(sectorX, sectorY, seed + salt + 2) * config.sector);
                    const key = cellKey(x, y);
                    if (occupied.has(key) || !isNormalRock(x, y, config)) continue;
                    candidates.push({ x, y, key, rank: hash01(sectorX, sectorY, seed + salt + 3) });
                }
            }
            candidates.sort((a, b) => a.rank - b.rank);
            const fallbackSpacing = config.spacing * Math.max(0.2, 0.65 - pass * 0.15);
            for (const candidate of candidates) {
                if (placedForBlock >= config.targetCount) break;
                if (centers.some(center => Math.hypot(center.x - candidate.x, center.y - candidate.y) < fallbackSpacing)) continue;
                centers.push({ x: candidate.x, y: candidate.y });
                occupied.add(candidate.key);
                ores.set(candidate.key, config.block);
                placedForBlock++;
            }
        }
    }

    oreLayoutCache.set(seed, ores);
    return ores;
}

function getOreBlock(x, y, seed) {
    return buildOreLayout(seed).get(cellKey(x, y)) || null;
}

function isSurfaceByScore(x, y, seed) {
    return isBrokenKingdomSurfaceCell(x, y) || getOutsideScore(x, y, seed) > 0.56;
}

function getOutsideWallDepth(x, y, seed, maxDepth = 6) {
    const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
    ];

    for (let depth = 1; depth <= maxDepth; depth++) {
        for (const [dx, dy] of directions) {
            if (isSurfaceByScore(x + dx * depth, y + dy * depth, seed)) return depth;
        }
    }

    return 0;
}

function findCaveEntrance(seed) {
    const minX = -Math.floor(BLOCKS_X / 2);
    const minY = -Math.floor(BLOCKS_Y / 2);
    let best = null;

    for (let y = minY + 1; y < minY + BLOCKS_Y - 1; y++) {
        for (let x = minX + 1; x < minX + BLOCKS_X - 1; x++) {
            if (isSurfaceByScore(x, y, seed)) continue;

            let surfaceTouch = 0;
            let strongestSurface = 0;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const score = getOutsideScore(x + dx, y + dy, seed);
                if (score > 0.56) {
                    surfaceTouch++;
                    strongestSurface = Math.max(strongestSurface, score);
                }
            }
            if (!surfaceTouch) continue;

            const score = strongestSurface + hash01(x, y, seed + 8300) * 0.04;
            if (!best || score > best.score) best = { x, y, score };
        }
    }

    return best || { x: 0, y: 0 };
}

function getCaveWormRadius(x, y, seed) {
    const widthNoise = normalizedPerlin(x, y, seed + 8700, 85, 3);
    const pinchNoise = normalizedPerlin(x + 17, y - 23, seed + 8750, 34, 2);

    if (pinchNoise > 0.76) return 1;
    return 2 + Math.floor(widthNoise * 4);
}

function addCavePathCell(path, x, y, seed) {
    if (!isInsideGeneratedWorld(x, y)) return;
    const radius = getCaveWormRadius(x, y, seed);
    const radiusSq = radius * radius;

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy > radiusSq) continue;
            const px = x + dx;
            const py = y + dy;
            if (!isInsideGeneratedWorld(px, py)) continue;
            if (isSurfaceByScore(px, py, seed)) continue;
            path.add(cellKey(px, py));
        }
    }
}

function findSurfaceComponents(seed) {
    const minX = -Math.floor(BLOCKS_X / 2);
    const minY = -Math.floor(BLOCKS_Y / 2);
    const visited = new Uint8Array(BLOCKS_X * BLOCKS_Y);
    const components = [];

    function index(ix, iy) {
        return iy * BLOCKS_X + ix;
    }

    for (let sy = 0; sy < BLOCKS_Y; sy++) {
        for (let sx = 0; sx < BLOCKS_X; sx++) {
            const startIndex = index(sx, sy);
            if (visited[startIndex]) continue;

            const wx = minX + sx;
            const wy = minY + sy;
            if (!isSurfaceByScore(wx, wy, seed)) {
                visited[startIndex] = 1;
                continue;
            }

            const queue = [[sx, sy]];
            const boundary = new Map();
            let size = 0;
            let sumX = 0;
            let sumY = 0;
            let head = 0;
            visited[startIndex] = 1;

            while (head < queue.length) {
                const [ix, iy] = queue[head++];
                const x = minX + ix;
                const y = minY + iy;
                size++;
                sumX += x;
                sumY += y;

                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nx = ix + dx;
                    const ny = iy + dy;
                    if (nx < 0 || ny < 0 || nx >= BLOCKS_X || ny >= BLOCKS_Y) continue;

                    const nIndex = index(nx, ny);
                    const nWorldX = minX + nx;
                    const nWorldY = minY + ny;
                    if (isSurfaceByScore(nWorldX, nWorldY, seed)) {
                        if (!visited[nIndex]) {
                            visited[nIndex] = 1;
                            queue.push([nx, ny]);
                        }
                    } else {
                        boundary.set(cellKey(nWorldX, nWorldY), { x: nWorldX, y: nWorldY });
                    }
                }
            }

            components.push({
                size,
                centerX: sumX / size,
                centerY: sumY / size,
                boundary: [...boundary.values()],
            });
        }
    }

    return components;
}

function pickBoundaryPoint(component, target, seed, salt) {
    if (!component.boundary.length) return { x: Math.round(component.centerX), y: Math.round(component.centerY) };

    let best = null;
    const stride = Math.max(1, Math.floor(component.boundary.length / 96));
    for (let i = 0; i < component.boundary.length; i += stride) {
        const point = component.boundary[i];
        const dx = point.x - target.x;
        const dy = point.y - target.y;
        const distance = dx * dx + dy * dy;
        const noise = hash01(point.x, point.y, seed + salt) * 400;
        const score = distance - noise;
        if (!best || score < best.score) best = { ...point, score };
    }

    return { x: best.x, y: best.y };
}

function getCaveConnectionTargets(seed) {
    const components = findSurfaceComponents(seed)
        .filter(component => component.size >= 500 && component.boundary.length)
        .sort((a, b) => b.size - a.size);

    const targets = components.slice(0, 8);
    const topLarge = components
        .filter(component => component.size >= 1000)
        .sort((a, b) => a.centerY - b.centerY)[0];

    if (topLarge && !targets.includes(topLarge)) targets.push(topLarge);
    return targets;
}

function carveWormBetween(path, centerline, from, to, seed, salt) {
    let x = from.x;
    let y = from.y;
    let dirX = Math.sign(to.x - from.x) || 1;
    let dirY = Math.sign(to.y - from.y) || 0;
    const maxSteps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) * 4) + 600;

    const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
    ];

    for (let step = 0; step < maxSteps; step++) {
        centerline.add(cellKey(x, y));
        addCavePathCell(path, x, y, seed);

        if (Math.hypot(to.x - x, to.y - y) <= 3) break;

        let best = null;
        const currentDistance = Math.hypot(to.x - x, to.y - y);
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (!isInsideGeneratedWorld(nx, ny)) continue;

            const nextDistance = Math.hypot(to.x - nx, to.y - ny);
            const progress = currentDistance - nextDistance;
            const turnScore = (dx * dirX + dy * dirY) * 0.35;
            const unvisitedScore = centerline.has(cellKey(nx, ny)) ? -1.4 : 0.6;
            const caveNoise = getSmallPathScore(nx, ny, seed + salt) * 0.8;
            const randomNoise = hash01(nx, ny, seed + salt + step) * 0.45;
            const surfacePenalty = isSurfaceByScore(nx, ny, seed) ? -0.45 : 0;
            const score = progress * 3.8 + turnScore + unvisitedScore + caveNoise + randomNoise + surfacePenalty;

            if (!best || score > best.score) best = { x: nx, y: ny, dx, dy, score };
        }

        if (!best) break;
        x = best.x;
        y = best.y;
        dirX = best.dx;
        dirY = best.dy;
    }
}

function carveWanderingBranch(path, centerline, seed, salt, maxSteps) {
    const starts = [...centerline].map(key => {
        const [x, y] = key.split(",").map(Number);
        return { x, y };
    });
    if (!starts.length) return;

    let start = starts[Math.floor(hash01(salt, starts.length, seed + 8800) * starts.length) % starts.length];
    let x = start.x;
    let y = start.y;
    let dirX = hash01(x, y, seed + salt + 8810) > 0.5 ? 1 : -1;
    let dirY = hash01(x, y, seed + salt + 8820) > 0.5 ? 1 : -1;
    const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
    ];

    for (let step = 0; step < maxSteps; step++) {
        centerline.add(cellKey(x, y));
        addCavePathCell(path, x, y, seed);

        let best = null;
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (!isInsideGeneratedWorld(nx, ny)) continue;

            const turnScore = (dx * dirX + dy * dirY) * 0.7;
            const unvisitedScore = centerline.has(cellKey(nx, ny)) ? -2.0 : 1.0;
            const depthScore = isSurfaceByScore(nx, ny, seed) ? -0.8 : 0.5;
            const pathScore = getSmallPathScore(nx, ny, seed + salt) * 1.2;
            const score = turnScore + unvisitedScore + depthScore + pathScore + hash01(nx, ny, seed + salt + step) * 0.4;

            if (!best || score > best.score) best = { x: nx, y: ny, dx, dy, score };
        }

        if (!best) break;
        x = best.x;
        y = best.y;
        dirX = best.dx;
        dirY = best.dy;
    }
}

function buildCavePathSet(seed) {
    let cached = cavePathCache.get(seed);
    if (cached) return cached;

    const path = new Set();
    const centerline = new Set();
    const targets = getCaveConnectionTargets(seed);

    if (targets.length) {
        let currentComponent = targets[0];
        let current = pickBoundaryPoint(currentComponent, { x: currentComponent.centerX, y: currentComponent.centerY }, seed, 8900);
        const remaining = targets.slice(1);

        while (remaining.length) {
            let bestIndex = 0;
            let bestTarget = null;
            for (let i = 0; i < remaining.length; i++) {
                const entry = pickBoundaryPoint(remaining[i], current, seed, 9000 + i);
                const distance = Math.hypot(entry.x - current.x, entry.y - current.y);
                if (!bestTarget || distance < bestTarget.distance) {
                    bestTarget = { entry, distance };
                    bestIndex = i;
                }
            }

            carveWormBetween(path, centerline, current, bestTarget.entry, seed, 9100 + remaining.length);
            current = bestTarget.entry;
            remaining.splice(bestIndex, 1);
        }
    }

    let branchSalt = 0;
    while (centerline.size < CAVE_WORM_TARGET_LENGTH && branchSalt < 12) {
        carveWanderingBranch(path, centerline, seed, 9200 + branchSalt * 97, 900);
        branchSalt++;
    }

    if (centerline.size < CAVE_WORM_MIN_LENGTH) {
        console.warn(`[Craftras] Cave worm generated only ${centerline.size} centerline cells, expected at least ${CAVE_WORM_MIN_LENGTH}.`);
    }

    cavePathCache.set(seed, path);
    return path;
}

function isCavePathCell(x, y, seed) {
    return loadManualCaves().has(cellKey(x, y));
}

function isManualBedrockCell(x, y) {
    return loadManualBedrock().has(cellKey(x, y));
}

function generateSurfaceCell(x, y, seed, outsideScore) {
    let floor = FLOORS.GRASS;
    let block = BLOCKS.AIR;

    const waterScore = getWaterScore(x, y, seed, outsideScore);
    const dirt = normalizedPerlin(x, y, seed + 3000, 70, 3);
    const stone = normalizedPerlin(x, y, seed + 3100, 85, 3);
    const detail = hash01(x, y, seed + 3300);

    if (waterScore > 0.69) floor = FLOORS.WATER;
    else if (stone > 0.72) floor = FLOORS.STONE;
    else if (dirt > 0.64) floor = FLOORS.DIRT;

    if (floor !== FLOORS.WATER) {
        if (isTreeClusterCell(x, y, seed)) block = BLOCKS.TREE;
        else if (stone > 0.76 && detail > 0.84) block = BLOCKS.ROCK;
        else if (outsideScore < 0.56 && detail > 0.995) block = BLOCKS.CAVE_ENTRANCE;
    }

    return { region: "surface", floor, block };
}

function generateUndergroundCell(x, y, seed, outsideScore) {
    let floor = FLOORS.STONE;
    let block = BLOCKS.ROCK;

    if (isManualBedrockCell(x, y)) {
        return { region: "underground", floor: FLOORS.STONE, block: BLOCKS.BEDROCK, manualBedrock: true };
    }

    if (isCavePathCell(x, y, seed)) {
        return { region: "underground", floor: FLOORS.STONE, block: BLOCKS.AIR, cavePath: true, manualCave: true };
    }

    const outsideWallDepth = getOutsideWallDepth(x, y, seed);
    if (outsideWallDepth === 1) {
        return { region: "underground", floor, block: BLOCKS.GRASS_WALL, outsideWallDepth };
    }
    if (outsideWallDepth >= 2) {
        return { region: "underground", floor, block: BLOCKS.DIRT_WALL, outsideWallDepth };
    }

    block = getOreBlock(x, y, seed) || BLOCKS.ROCK;

    return { region: "underground", floor, block };
}

function generateCell(blockX, blockY, seed) {
    const x = blockX | 0;
    const y = blockY | 0;

    const outsideScore = getOutsideScore(x, y, seed);
    if (isBrokenKingdomSurfaceCell(x, y)) {
        return { ...generateSurfaceCell(x, y, seed, outsideScore), brokenKingdom: true };
    }
    if (outsideScore > 0.56) return generateSurfaceCell(x, y, seed, outsideScore);
    return generateUndergroundCell(x, y, seed, outsideScore);
}

function generateMap(seed = 1337) {
    return {
        width: BLOCKS_X,
        height: BLOCKS_Y,
        worldSize: WORLD_SIZE,
        blockSize: BLOCK_SIZE,
        seed,
        getCell: (x, y) => generateCell(x, y, seed),
    };
}

function worldToBlock(worldX, worldY) {
    return {
        x: Math.floor(worldX / BLOCK_SIZE),
        y: Math.floor(worldY / BLOCK_SIZE),
    };
}

function blockToWorld(blockX, blockY) {
    return {
        x: blockX * BLOCK_SIZE + BLOCK_SIZE / 2,
        y: blockY * BLOCK_SIZE + BLOCK_SIZE / 2,
    };
}

function blockToIndex(x, y) {
    return y * BLOCKS_X + x;
}

function indexToBlock(index) {
    return {
        x: index % BLOCKS_X,
        y: Math.floor(index / BLOCKS_X),
    };
}

function summarizeMap(map) {
    const summary = { surface: 0, underground: 0, border: 0, floors: {}, blocks: {}, wallBlocks: 0 };
    const sampleStep = Math.max(1, Math.floor(Math.max(map.width, map.height) / 160));

    for (let y = 0; y < map.height; y += sampleStep) {
        for (let x = 0; x < map.width; x += sampleStep) {
            const cell = map.getCell(x, y);
            summary[cell.region] = (summary[cell.region] ?? 0) + 1;
            summary.floors[cell.floor] = (summary.floors[cell.floor] ?? 0) + 1;
            summary.blocks[cell.block] = (summary.blocks[cell.block] ?? 0) + 1;
            if (cell.block !== BLOCKS.AIR) summary.wallBlocks++;
        }
    }

    summary.sampleStep = sampleStep;
    return summary;
}

function logMapDemo(seed = 1337) {
    const map = generateMap(seed);
    const summary = summarizeMap(map);
    console.log(`[Craftras] Perlin map ${map.width}x${map.height}. arenaCommand=${ARENA_SIZE_COMMAND}x${ARENA_SIZE_COMMAND}, arenaInternal=${WORLD_SIZE}x${WORLD_SIZE}, wallSize=${WALL_SIZE}, blockStep=${BLOCK_SIZE}, seed=${seed}`);
    console.log("[Craftras] Summary:", summary);
    return { map, summary };
}

const craftrasWorldApi = {
    WORLD_SIZE,
    ARENA_SIZE_COMMAND,
    ARENA_UNIT,
    WALL_SIZE,
    BLOCK_GAP,
    BLOCK_SIZE,
    BLOCKS_X,
    BLOCKS_Y,
    FLOORS,
    BLOCKS,
    clamp,
    lerp,
    smoothstep,
    fade,
    hash01,
    perlin2D,
    fbm2D,
    normalizedPerlin,
    getOutsideScore,
    isBrokenKingdomSurfaceCell,
    isNearBrokenKingdomSurfaceCell,
    getWaterScore,
    getOutsideWallDepth,
    getOreBlock,
    buildOreLayout,
    isTreeClusterCell,
    getSmallPathScore,
    isCavePathCell,
    generateCell,
    generateMap,
    worldToBlock,
    blockToWorld,
    blockToIndex,
    indexToBlock,
    summarizeMap,
    logMapDemo,
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = craftrasWorldApi;
}

if (typeof window !== "undefined") {
    window.CraftrasWorld = craftrasWorldApi;
}
