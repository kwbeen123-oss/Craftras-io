// Log startup messages
console.log("Starting up...");
console.log("Importing modules...\n");

const path = require("path");
const fs = require("fs");
const http = require("http");
const net = require("net");
const crypto = require("crypto");
const pjson = require('../package.json')

const { Worker } = require("worker_threads");

// Increase the stack trace limit for better debugging
Error.stackTraceLimit = Infinity;

// Load optional local secrets without requiring them in public checkouts.
const dotenv = require("./lib/dotenv.js");
const envPath = path.join(__dirname, "./.env");
const environment = fs.existsSync(envPath) ? dotenv(fs.readFileSync(envPath).toString()) : {};

// Set each environment variable in process.env
for (const key in environment) {
    process.env[key] = environment[key];
}

// Load all necessary modules and files via the loader
const GLOBAL = require("./loaders/loader.js");

// Load definitions and tile definitions
new definitionCombiner(
    {
        groups: path.join(__dirname, './lib/definitions/groups'),
        addonsFolder: path.join(__dirname, './lib/definitions/entityAddons')
    }
).loadDefinitions();
GLOBAL.loadRooms(true);

// Optionally load all mockups if enabled in configuration
if (Config.load_all_mockups) global.loadAllMockups();

// Log loader information including creation date and time
console.log(`Successfully loaded all files.`);
console.log(`Created on date ${GLOBAL.creationDate} at timestamp ${GLOBAL.creationTime}`);

// Define the public directory for static files
const publicRoot = path.join(__dirname, "../public/"),
CraftrasSteelTorchMapFile = path.join(__dirname, "game/craftras/steelTorchMap.json"),
CraftrasManualCavesFile = path.join(__dirname, "game/craftras/manualCaves.json"),
CraftrasCustomItemsDir = path.join(__dirname, "../Craftras Item"),
CraftrasCustomItemImagesDir = path.join(publicRoot, "img/custom-items"),
mimeSet = {
    js: "application/javascript",
    json: "application/json",
    css: "text/css",
    html: "text/html",
    md: "text/markdown",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    svg: "image/svg+xml",
    gif: "image/gif",
    bmp: "image/bmp",
    avif: "image/avif",
};

const isLocalEditorRequest = req => {
    const address = String(req.socket?.remoteAddress || "").toLowerCase();
    const host = String(req.headers.host || "").split(":")[0].replace(/^\[|\]$/g, "").toLowerCase();
    return (address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1")
        && (host === "localhost" || host === "127.0.0.1" || host === "::1");
};

const clampCustomNumber = (value, fallback, min, max) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
};

function sanitizeCustomItemProject(project) {
    if (project?.format !== "craftras-item" || ![1, 2].includes(Number(project.version))) throw new Error("Unsupported item project.");
    const item = project.item || {};
    const id = String(item.id || "").trim().toLowerCase();
    if (!/^[a-z0-9_]{2,48}$/.test(id)) throw new Error("Item ID must use 2-48 lowercase letters, numbers, or underscores.");
    const weapon = project.weapon || {};
    const fallbackLayer = {
        id: "main", name: "Main weapon", primary: true, priority: 0,
        image: project.image || project.hitbox?.image,
        anchor: project.hitbox?.runtime?.anchor || { x: 0.5, y: 0.5 },
        polygons: project.hitbox?.runtime?.polygons || [], damageEnabled: true,
    };
    const sourceLayers = Array.isArray(project.layers) && project.layers.length ? project.layers : [fallbackLayer];
    const seenLayerIds = new Set();
    let totalImageBytes = 0;
    const layers = sourceLayers.slice(0, 12).map((source, layerIndex) => {
        const primary = !!source.primary || layerIndex === 0;
        let layerId = primary ? "main" : String(source.id || `layer_${layerIndex}`).trim().toLowerCase();
        layerId = layerId.replace(/[^a-z0-9_]/g, "_").slice(0, 40) || `layer_${layerIndex}`;
        while (seenLayerIds.has(layerId)) layerId = `${layerId}_${layerIndex}`.slice(0, 40);
        seenLayerIds.add(layerId);
        const imageDataUrl = String(source.image?.dataUrl || (primary ? project.image?.dataUrl : "") || "");
        const imageMatch = /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=]+)$/i.exec(imageDataUrl);
        if (!imageMatch) throw new Error(`Layer ${layerIndex + 1} must contain a PNG, JPG, or WEBP image.`);
        const mimeType = imageMatch[1].toLowerCase();
        const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
        const imageBuffer = Buffer.from(imageMatch[2], "base64");
        if (!imageBuffer.length || imageBuffer.length > 12_000_000) throw new Error(`Layer ${layerIndex + 1} image is empty or larger than 12 MB.`);
        totalImageBytes += imageBuffer.length;
        const polygons = (source.polygons || []).slice(0, 32).map((polygon, polygonIndex) => ({
            id: String(polygon.id || `${layerId}-hitbox-${polygonIndex + 1}`).slice(0, 64),
            name: String(polygon.name || `Hitbox ${polygonIndex + 1}`).slice(0, 64),
            points: (polygon.points || []).slice(0, 64).map(point => [
                clampCustomNumber(point?.[0], 0, -20, 20),
                clampCustomNumber(point?.[1], 0, -20, 20),
            ]),
        })).filter(polygon => polygon.points.length >= 3);
        return {
            id: layerId,
            name: String(source.name || `Layer ${layerIndex + 1}`).slice(0, 64),
            primary,
            priority: clampCustomNumber(source.priority, layerIndex, -100, 100),
            scale: clampCustomNumber(source.scale, 1, 0.05, 20),
            offsetX: clampCustomNumber(source.offsetX, 0, -50, 50),
            offsetY: clampCustomNumber(source.offsetY, 0, -50, 50),
            rotation: clampCustomNumber(source.rotation, 0, -1080, 1080),
            flipX: !!source.flipX,
            anchorMode: source.anchorMode === "body" ? "body" : source.anchorMode === "main" && !primary ? "main" : "weapon",
            anchorModeExplicit: !!source.anchorModeExplicit,
            opacity: clampCustomNumber(source.opacity, 1, 0, 1),
            anchor: {
                x: clampCustomNumber(source.anchor?.x, 0.5, 0, 1),
                y: clampCustomNumber(source.anchor?.y, 0.5, 0, 1),
            },
            damageEnabled: source.damageEnabled !== false,
            polygons,
            image: `./img/custom-items/${id}-${layerId}.${extension}`,
            imageSize: {
                width: clampCustomNumber(source.image?.width, 1, 1, 16384),
                height: clampCustomNumber(source.image?.height, 1, 1, 16384),
            },
            imageBuffer,
            extension,
        };
    });
    if (totalImageBytes > 48_000_000) throw new Error("All layer images together must be smaller than 48 MB.");
    if (!layers.some(layer => layer.damageEnabled && layer.polygons.length)) {
        throw new Error("At least one damage-enabled layer needs a hitbox polygon.");
    }
    const validLayerIds = new Set(layers.map(layer => layer.id));
    const animation = project.animation || {};
    const sanitizeKeyframes = source => (source || []).slice(0, 64).map(frame => {
        const layerMotions = {};
        for (const [layerId, motion] of Object.entries(frame.layers || {})) {
            if (!validLayerIds.has(layerId)) continue;
            layerMotions[layerId] = {
                angle: clampCustomNumber(motion?.angle, 0, -1080, 1080),
                x: clampCustomNumber(motion?.x, 0, -50, 50),
                y: clampCustomNumber(motion?.y, 0, -50, 50),
                scale: clampCustomNumber(motion?.scale, 1, 0.05, 20),
            };
        }
        return {
            time: clampCustomNumber(frame.time, 0, 0, 1),
            angle: clampCustomNumber(frame.angle, -45, -1080, 1080),
            gripAngle: clampCustomNumber(frame.gripAngle, 0, -1080, 1080),
            gripOffset: clampCustomNumber(frame.gripOffset, 10, -100, 100),
            size: clampCustomNumber(frame.size, 20, 1, 200),
            layers: layerMotions,
        };
    }).sort((a, b) => a.time - b.time);
    const legacyKeyframes = sanitizeKeyframes(animation.keyframes);
    const comboSource = Array.isArray(animation.combo?.attacks) ? animation.combo.attacks.slice(0, 100) : [];
    const comboAttacks = [];
    for (const source of comboSource) {
        const keyframes = sanitizeKeyframes(source?.keyframes);
        const type = source?.type === "sheathe" ? "sheathe" : "slash";
        if (keyframes.length < 2) continue;
        comboAttacks.push({
            type,
            duration: clampCustomNumber(source?.duration ?? animation.duration, 700, 80, 10000),
            cooldown: source?.cooldown === undefined || source?.cooldown === null || source?.cooldown === ""
                ? 0
                : clampCustomNumber(source.cooldown, 0, 0, 60000),
            dash: !!source?.dash,
            dashDistance: clampCustomNumber(source?.dashDistance, 3, 1, 20),
            damage: source?.damage === undefined || source?.damage === null || source?.damage === ""
                ? null
                : clampCustomNumber(source.damage, 0, 0, 1e15),
            anchorMode: ["body", "main"].includes(source?.anchorMode) ? source.anchorMode : "weapon",
            screenCut: type !== "sheathe" && !!source?.screenCut,
            keyframes,
        });
        // A sheath animation explicitly closes the combo; do not accept trailing attacks.
        if (type === "sheathe") break;
    }
    const validActionKeys = new Set(["z", "x", "c", "v", "b", "n", "m"]);
    const specialActions = [];
    for (const source of (Array.isArray(animation.combo?.specialActions) ? animation.combo.specialActions : []).slice(0, 2)) {
        const key = String(source?.key || "").toLowerCase();
        const keyframes = sanitizeKeyframes(source?.keyframes);
        if (!validActionKeys.has(key) || specialActions.some(action => action.key === key) || keyframes.length < 2) continue;
        specialActions.push({
            type: "emote",
            key,
            name: String(source?.name || `Special ${key.toUpperCase()}`).slice(0, 40),
            duration: clampCustomNumber(source?.duration, 900, 80, 10000),
            cooldown: clampCustomNumber(source?.cooldown, 0, 0, 60000),
            anchorMode: ["body", "main"].includes(source?.anchorMode) ? source.anchorMode : "weapon",
            keyframes,
        });
    }
    const keyframes = comboAttacks[0]?.keyframes || legacyKeyframes;
    if (keyframes.length < 2) throw new Error("Create at least two animation keyframes.");
    const trail = weapon.trail || {};
    const storedLayers = layers.map(layer => {
        const stored = { ...layer };
        delete stored.imageBuffer;
        delete stored.extension;
        return stored;
    });
    const primaryLayer = storedLayers.find(layer => layer.primary) || storedLayers[0];
    return {
        id,
        name: String(item.name || id).trim().slice(0, 64),
        description: String(item.description || "Custom Craftras weapon.").trim().slice(0, 240),
        damage: clampCustomNumber(item.damage, 20, 0, 1e15),
        image: primaryLayer.image,
        layerFiles: layers.map(layer => ({
            id: layer.id,
            path: layer.image,
            imageBuffer: layer.imageBuffer,
            extension: layer.extension,
        })),
        weapon: {
            renderScale: clampCustomNumber(weapon.renderScale, 3.25, 0.2, 20),
            rotationOffset: clampCustomNumber(weapon.rotationOffset, -45, -1080, 1080),
            attackDuration: comboAttacks[0]?.duration
                ?? clampCustomNumber(animation.duration ?? weapon.attackDuration, 700, 80, 10000),
            hitStart: clampCustomNumber(weapon.hitStart, 0.2, 0, 1),
            hitEnd: clampCustomNumber(weapon.hitEnd, 0.7, 0, 1),
            anchor: primaryLayer.anchor,
            imageSize: primaryLayer.imageSize,
            polygons: primaryLayer.polygons,
            layers: storedLayers,
            keyframes,
            combo: comboAttacks.length ? {
                resetMs: clampCustomNumber(animation.combo?.resetMs, 850, 150, 5000),
                attacks: comboAttacks,
            } : null,
            specialActions,
            trail: {
                enabled: !!trail.enabled,
                color: /^#[0-9a-f]{6}$/i.test(trail.color || "") ? trail.color : "#ff4fb8",
                opacity: clampCustomNumber(trail.opacity, 0.55, 0, 1),
                size: clampCustomNumber(trail.size, 1, 0.1, 8),
                duration: clampCustomNumber(trail.duration, 300, 30, 3000),
                interval: clampCustomNumber(trail.interval, 40, 16, 1000),
            },
            damageWalls: weapon.damageWalls !== false,
        },
    };
}

function staticHeaders(extension) {
    const headers = { "Content-Type": mimeSet[extension] || "text/html" };
    if (extension === "js" || extension === "html") {
        headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
        headers.Pragma = "no-cache";
        headers.Expires = "0";
    }
    return headers;
}

const CraftrasImageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".avif"]);

function getCraftrasAssetManifest() {
    const imageRoot = path.join(publicRoot, "img");
    const assets = [];
    const visit = directory => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const absolutePath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(absolutePath);
                continue;
            }
            if (!entry.isFile() || !CraftrasImageExtensions.has(path.extname(entry.name).toLowerCase())) continue;
            const stat = fs.statSync(absolutePath);
            const relativePath = path.relative(publicRoot, absolutePath);
            const url = "/" + relativePath.split(path.sep).map(encodeURIComponent).join("/");
            assets.push({ url, bytes: stat.size, modified: Math.trunc(stat.mtimeMs) });
        }
    };
    visit(imageRoot);
    assets.sort((a, b) => a.url.localeCompare(b.url));
    const revisionSource = assets.map(asset => `${asset.url}:${asset.bytes}:${asset.modified}`).join("|");
    return {
        revision: crypto.createHash("sha1").update(revisionSource).digest("hex").slice(0, 16),
        count: assets.length,
        totalBytes: assets.reduce((total, asset) => total + asset.bytes, 0),
        assets,
    };
}

let wsServer; // WebSocket server instance
let WebSocketClient;
let server; // HTTP server instance

// Attempt to create a WebSocket server instance using the 'ws' package
try {
    const ws = require("ws");
    const WebSocketServer = ws.WebSocketServer;
    WebSocketClient = ws.WebSocket;
    wsServer = new WebSocketServer({ noServer: true });
} catch (err) {
    throw new Error(
        "Package 'ws' is not installed! To install it, run 'npm install ws' in the terminal."
    );
}

const CRAFTRAS_CHALLENGE_PORT_START = 3100;
const CRAFTRAS_CHALLENGE_INSTANCE_LIMIT = 8;
const CRAFTRAS_CHALLENGE_EMPTY_TTL = 120_000;
const CRAFTRAS_CHALLENGE_RESERVATION_TTL = 180_000;
const challengeInstances = new Map();
const reservedChallengePorts = new Set((Config.servers || []).map(entry => Number(entry?.port)).filter(Number.isFinite));
let nextChallengePort = CRAFTRAS_CHALLENGE_PORT_START;

const canListenOnChallengePort = port => new Promise(resolve => {
    const probe = net.createServer();
    probe.unref();
    probe.once("error", () => resolve(false));
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
});

async function reserveChallengePort() {
    for (let attempts = 0; attempts < 2_000; attempts++) {
        const port = nextChallengePort++;
        if (nextChallengePort > 5099) nextChallengePort = CRAFTRAS_CHALLENGE_PORT_START;
        if (reservedChallengePorts.has(port) || !await canListenOnChallengePort(port)) continue;
        reservedChallengePorts.add(port);
        return port;
    }
    throw new Error("No free challenge instance port is available.");
}

function clearChallengeInstanceTimers(instance) {
    clearTimeout(instance?.emptyTimer);
    clearTimeout(instance?.reservationTimer);
    if (instance) {
        instance.emptyTimer = null;
        instance.reservationTimer = null;
    }
}

function disposeChallengeInstance(instance, reason = "closed", terminateWorker = true) {
    if (!instance || instance.closed) return;
    instance.closed = true;
    clearChallengeInstanceTimers(instance);
    challengeInstances.delete(instance.id);
    reservedChallengePorts.delete(instance.port);
    if (global.servers[instance.serverIndex]?.id === instance.id) global.servers[instance.serverIndex] = null;
    if (terminateWorker) instance.worker?.terminate?.().catch?.(() => {});
    console.log(`[Craftras Challenge] Instance ${instance.id} closed (${reason}).`);
}

function scheduleChallengeInstanceCleanup(instance) {
    if (!instance || instance.closed || instance.emptyTimer) return;
    instance.emptyTimer = setTimeout(() => {
        instance.emptyTimer = null;
        if (!instance.closed && instance.players === 0) disposeChallengeInstance(instance, "empty");
    }, CRAFTRAS_CHALLENGE_EMPTY_TTL);
    instance.emptyTimer.unref?.();
}

global.createCraftrasChallengeInstance = async metadata => {
    if (challengeInstances.size >= CRAFTRAS_CHALLENGE_INSTANCE_LIMIT) {
        throw new Error("All private challenge slots are currently in use.");
    }
    const port = await reserveChallengePort();
    if (challengeInstances.size >= CRAFTRAS_CHALLENGE_INSTANCE_LIMIT) {
        reservedChallengePorts.delete(port);
        throw new Error("All private challenge slots are currently in use.");
    }
    const suffix = crypto.randomBytes(5).toString("hex");
    const challengeWorld = Number(metadata?.challengeWorld) === 2 ? 2 : 1;
    const challengeConfig = challengeWorld === 2 ? "craftras_world2_challenge" : "craftras_world1_challenge";
    const challengeTitle = `World ${challengeWorld} Challenge`;
    const id = `world${challengeWorld}-challenge-${Date.now().toString(36)}-${suffix}`;
    const instance = {
        id,
        port,
        challengeWorld,
        players: 0,
        hadPlayers: false,
        closed: false,
        teamName: String(metadata?.teamName || "Solo"),
        hostName: String(metadata?.hostName || "Unknown"),
        memberCount: Math.max(1, Math.floor(Number(metadata?.memberCount) || 1)),
        createdAt: Date.now(),
    };
    challengeInstances.set(id, instance);
    try {
        const loaded = loadGameServer(
            false,
            "localhost",
            port,
            [challengeConfig],
            `${challengeTitle} - ${instance.teamName}`,
            { id, maxPlayers: Math.max(8, instance.memberCount) },
            {
                hidden: true,
                unlisted: true,
                private: true,
                craftras_challenge_instance: true,
                craftras_challenge_world: challengeWorld,
                craftras_challenge_instance_id: id,
                craftras_challenge_team_name: instance.teamName,
            },
            false,
            {
                dynamic: true,
                onPlayers(players) {
                    instance.players = Math.max(0, Math.floor(Number(players) || 0));
                    if (instance.players > 0) {
                        instance.hadPlayers = true;
                        clearChallengeInstanceTimers(instance);
                    } else if (instance.hadPlayers) scheduleChallengeInstanceCleanup(instance);
                },
                onExit() {
                    disposeChallengeInstance(instance, "worker exit", false);
                },
            },
        );
        instance.worker = loaded.worker;
        instance.serverIndex = loaded.index;
        await loaded.ready;
        if (instance.closed) throw new Error("Challenge instance closed while starting.");
        instance.reservationTimer = setTimeout(() => {
            instance.reservationTimer = null;
            if (!instance.hadPlayers) disposeChallengeInstance(instance, "unused reservation");
        }, CRAFTRAS_CHALLENGE_RESERVATION_TTL);
        instance.reservationTimer.unref?.();
        console.log(`[Craftras Challenge] ${challengeTitle} instance ${id} ready on port ${port} for ${instance.teamName} (${instance.memberCount} player(s)).`);
        return {
            id,
            port,
            apiDestination: `http://127.0.0.1:${port}`,
            clientDestination: `/challenge-instance/${id}`,
        };
    } catch (error) {
        disposeChallengeInstance(instance, "startup failure");
        throw error;
    }
};

global.disposeCraftrasChallengeInstance = (id, reason = "cancelled") => {
    const instance = challengeInstances.get(String(id || ""));
    if (!instance) return false;
    disposeChallengeInstance(instance, reason);
    return true;
};

// Log a warning if Access-Control-Allow-Origin is enabled
if (Config.allow_ACAO && Config.startup_logs) {
    util.warn("Access-Control-Allow-Origin is enabled, which allows any server/client to access data from the WebServer.");
}

// Create an HTTP server to handle both API and static file requests
server = http.createServer((req, res) => {
    let query = {};
    let pathname = req.url.split("?")[0];
    if (req.url.includes("?")) req.url.split("?")[1].split("&").map(i => {
        let key = i.split("=")[0];
        let value = i.split("=")[1];
        query[key] = value;
    });
    let readString = ""; // Response content for API endpoints
    let ok = true; // Flag to indicate whether we use default API response
    let serversIP = [];
    let clientHeaders = ["/ext/custom-shape"];
    let selectedHeader = null;

    // Set CORS headers if enabled in the configuration or allow only the children servers.
    for (let server of global.servers) if (server && server.ip !== Config.host && server.ip) {
        let http = server.ip.startsWith("localhost") ? `http://${server.ip}` : `https://${server.ip}`;
        serversIP.push(http);
    };
    if (Config.allow_ACAO || serversIP.includes(req.headers.origin)) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    }
    for (let i = 0; i < clientHeaders.length; i++) {
        if (clientHeaders[i] == req.url) {
            selectedHeader = clientHeaders[i];
        }
    }
    // Handle specific API endpoints based on the request URL
    switch (pathname) {
        case "/getServers.json": {
            // Serve a list of active servers (excluding hidden ones)
            readString = JSON.stringify(servers.filter((s) => s?.id && !s.hidden).map((server) => ({
                ip: server.ip,
                players: server.players,
                maxPlayers: server.maxPlayers,
                id: server.id,
                featured: server.featured,
                region: server.region,
                gameMode: server.gameMode,
            })));
        } break;
        case "/getTotalPlayers": {
            let countPlayers = 0;
            servers.forEach((s) => {
                if (s) countPlayers += s.players;
            });
            readString = JSON.stringify(countPlayers);
        } break;
        case "/api/craftras/player-location": {
            ok = false;
            const remoteAddress = String(req.socket?.remoteAddress || "");
            const isLocalRequest = remoteAddress === "127.0.0.1"
                || remoteAddress === "::1"
                || remoteAddress === "::ffff:127.0.0.1";
            if (!isLocalRequest) {
                res.writeHead(403, staticHeaders("json"));
                res.end(JSON.stringify({ ok: false, reason: "forbidden" }));
                break;
            }
            const normalize = value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
            let requestedName = "";
            try {
                requestedName = decodeURIComponent(String(query.name || "").replace(/\+/g, " ")).trim();
            } catch {
                requestedName = String(query.name || "").trim();
            }
            const requestedNormalized = normalize(requestedName);
            if (!requestedNormalized) {
                res.writeHead(400, staticHeaders("json"));
                res.end(JSON.stringify({ ok: false, reason: "missing-name" }));
                break;
            }
            const candidates = [];
            for (const serverInfo of global.servers || []) {
                if (!serverInfo?.id) continue;
                for (const playerName of Array.isArray(serverInfo.playerNames) ? serverInfo.playerNames : []) {
                    const normalizedName = normalize(playerName);
                    if (!normalizedName || !normalizedName.includes(requestedNormalized)) continue;
                    candidates.push({
                        serverInfo,
                        playerName,
                        exact: normalizedName === requestedNormalized,
                    });
                }
            }
            const exactMatches = candidates.filter(candidate => candidate.exact);
            const matches = exactMatches.length ? exactMatches : candidates;
            if (matches.length !== 1) {
                res.writeHead(200, staticHeaders("json"));
                res.end(JSON.stringify({
                    ok: false,
                    reason: matches.length ? "ambiguous" : "not-found",
                    matches: matches.slice(0, 8).map(candidate => candidate.playerName),
                }));
                break;
            }
            const match = matches[0];
            const configuredServer = (Config.servers || []).find(entry => entry.id === match.serverInfo.id);
            const challengeInstance = challengeInstances.get(match.serverInfo.id);
            const port = Number(match.serverInfo.port || configuredServer?.port);
            const apiDestination = Number.isFinite(port)
                ? `http://127.0.0.1:${port}`
                : `http://${match.serverInfo.ip}`;
            const clientDestination = challengeInstance
                ? `/challenge-instance/${match.serverInfo.id}`
                : configuredServer?.id === "server1"
                    ? `http://${configuredServer.host}`
                    : configuredServer
                        ? `/server/${configuredServer.id}`
                        : `http://${match.serverInfo.ip}`;
            res.writeHead(200, staticHeaders("json"));
            res.end(JSON.stringify({
                ok: true,
                playerName: match.playerName,
                serverId: match.serverInfo.id,
                region: match.serverInfo.region || match.serverInfo.id,
                apiDestination,
                clientDestination,
            }));
        } break;
        case "/api/craftras/bring-player": {
            ok = false;
            const remoteAddress = String(req.socket?.remoteAddress || "");
            const isLocalRequest = remoteAddress === "127.0.0.1"
                || remoteAddress === "::1"
                || remoteAddress === "::ffff:127.0.0.1";
            if (!isLocalRequest || req.method !== "POST") {
                res.writeHead(isLocalRequest ? 405 : 403, staticHeaders("json"));
                res.end(JSON.stringify({ ok: false, reason: isLocalRequest ? "method" : "forbidden" }));
                break;
            }
            let body = "";
            req.on("data", chunk => {
                body += chunk;
                if (body.length > 16_384) req.destroy();
            });
            req.on("end", () => {
                try {
                    const parsed = JSON.parse(body || "{}");
                    const normalize = value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
                    const targetName = normalize(parsed.playerName);
                    const localGameManager = (global.servers || []).find(serverInfo => serverInfo?.gameManager)?.gameManager;
                    const targetSocket = (localGameManager?.clients || []).find(client => (
                        client?.player?.body && normalize(client.player.body.name) === targetName
                    ));
                    if (!targetSocket) {
                        res.writeHead(404, staticHeaders("json"));
                        res.end(JSON.stringify({ ok: false, reason: "not-found" }));
                        return;
                    }
                    const apiDestination = String(parsed.apiDestination || "");
                    const clientDestination = String(parsed.clientDestination || "");
                    if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(apiDestination) || !clientDestination) {
                        res.writeHead(400, staticHeaders("json"));
                        res.end(JSON.stringify({ ok: false, reason: "destination" }));
                        return;
                    }
                    localGameManager.socketManager.sendToServer(targetSocket, apiDestination, clientDestination);
                    res.writeHead(200, staticHeaders("json"));
                    res.end(JSON.stringify({ ok: true }));
                } catch (error) {
                    res.writeHead(400, staticHeaders("json"));
                    res.end(JSON.stringify({ ok: false, reason: "invalid-json" }));
                }
            });
        } break;
        case "/version": {
            readString = JSON.stringify({ver: 'v' + pjson.version, devBuild: Config.devBuild});
        } break;
        
        case "/api/getAddonAuthors": {
            if (!query.token || query.token !== process.env.DEVELOPER) {
                res.writeHead(403);
                res.end("Forbidden");
                return;
            }
            readString = JSON.stringify(global.addonAuthorInfos);
        } break;

        case "/api/craftras/assets": {
            ok = false;
            try {
                res.writeHead(200, {
                    ...staticHeaders("json"),
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                });
                res.end(JSON.stringify(getCraftrasAssetManifest()));
            } catch (error) {
                res.writeHead(500, staticHeaders("json"));
                res.end(JSON.stringify({ error: error.message }));
            }
        } break;

        case "/api/sendPlayer": {
            ok = false;
            let body = "";
            req.on("data", c => body += c);
            req.on("end", () => {
                let json = null;
                try {
                    json = JSON.parse(body);
              } catch { }
                  if (json) {
                      if (json.key === process.env.API_KEY) {
                            let { id, name, definition, score, level, skillcap, skill, points, killCount, craftrasEconomy } = json;
                            global.travellingPlayers.push({ id, name, definition, score, level, skillcap, skill, points, killCount, craftrasEconomy });
                            res.writeHead(200);
                            res.end("OK");
                        } else {
                            res.writeHead(403);
                            res.end("Access Denied");
                        }
                    } else {
                        res.writeHead(400);
                        res.end("Invalid JSON body");
                    }
            });
        } break;
        case "/api/craftras/manualCaves": {
            ok = false;
            try {
                res.writeHead(200, staticHeaders("json"));
                fs.createReadStream(CraftrasManualCavesFile).pipe(res);
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        } break;
        case "/api/craftras/steelTorchMap": {
            ok = false;
            if (req.method === "GET") {
                try {
                    if (!fs.existsSync(CraftrasSteelTorchMapFile)) {
                        res.writeHead(200, staticHeaders("json"));
                        res.end(JSON.stringify({ savedAt: null, torches: [] }));
                        break;
                    }
                    res.writeHead(200, staticHeaders("json"));
                    fs.createReadStream(CraftrasSteelTorchMapFile).pipe(res);
                } catch (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: error.message }));
                }
                break;
            }
            if (req.method !== "POST") {
                res.writeHead(405);
                res.end("Method Not Allowed");
                break;
            }
            let body = "";
            req.on("data", chunk => {
                body += chunk;
                if (body.length > 2_000_000) req.destroy();
            });
            req.on("end", () => {
                try {
                    const parsed = JSON.parse(body || "{}");
                    const source = Array.isArray(parsed) ? parsed : parsed.torches;
                    if (!Array.isArray(source)) throw new Error("Expected a torches array.");
                    const seen = new Set();
                    const torches = [];
                    for (const entry of source) {
                        const x = Number(entry?.x);
                        const y = Number(entry?.y);
                        if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
                        const key = `${x},${y}`;
                        if (seen.has(key)) continue;
                        seen.add(key);
                        torches.push({ x, y });
                    }
                    torches.sort((a, b) => a.y - b.y || a.x - b.x);
                    const data = {
                        savedAt: new Date().toISOString(),
                        block: "steel_torch",
                        torches,
                    };
                    const temporaryFile = `${CraftrasSteelTorchMapFile}.tmp`;
                    fs.writeFileSync(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
                    fs.renameSync(temporaryFile, CraftrasSteelTorchMapFile);
                    res.writeHead(200, staticHeaders("json"));
                    res.end(JSON.stringify({ ok: true, count: torches.length }));
                } catch (error) {
                    res.writeHead(400, staticHeaders("json"));
                    res.end(JSON.stringify({ ok: false, error: error.message }));
                }
            });
        } break;
        case "/api/craftras/custom-items": {
            ok = false;
            if (!isLocalEditorRequest(req)) {
                res.writeHead(403, staticHeaders("json"));
                res.end(JSON.stringify({ ok: false, error: "Custom items can only be installed from this PC." }));
                break;
            }
            if (req.method === "GET") {
                fs.mkdirSync(CraftrasCustomItemsDir, { recursive: true });
                const items = fs.readdirSync(CraftrasCustomItemsDir)
                    .filter(filename => filename.endsWith(".json"))
                    .map(filename => {
                        try {
                            const item = JSON.parse(fs.readFileSync(path.join(CraftrasCustomItemsDir, filename), "utf8"));
                            return { id: item.id, name: item.name, image: item.image };
                        } catch { return null; }
                    })
                    .filter(Boolean);
                res.writeHead(200, staticHeaders("json"));
                res.end(JSON.stringify({ ok: true, items }));
                break;
            }
            if (req.method !== "POST") {
                res.writeHead(405, staticHeaders("json"));
                res.end(JSON.stringify({ ok: false, error: "Method Not Allowed" }));
                break;
            }
            let body = "";
            let tooLarge = false;
            req.on("data", chunk => {
                body += chunk;
                if (body.length > 66_000_000) {
                    tooLarge = true;
                    req.destroy();
                }
            });
            req.on("end", () => {
                if (tooLarge) return;
                try {
                    const project = JSON.parse(body || "{}");
                    const item = sanitizeCustomItemProject(project);
                    fs.mkdirSync(CraftrasCustomItemsDir, { recursive: true });
                    fs.mkdirSync(CraftrasCustomItemImagesDir, { recursive: true });
                    const configFile = path.join(CraftrasCustomItemsDir, `${item.id}.json`);
                    for (const layerFile of item.layerFiles) {
                        const imageFile = path.join(CraftrasCustomItemImagesDir, `${item.id}-${layerFile.id}.${layerFile.extension}`);
                        fs.writeFileSync(`${imageFile}.tmp`, layerFile.imageBuffer);
                        fs.renameSync(`${imageFile}.tmp`, imageFile);
                    }
                    const stored = { ...item };
                    delete stored.layerFiles;
                    fs.writeFileSync(`${configFile}.tmp`, `${JSON.stringify(stored, null, 2)}\n`, "utf8");
                    fs.renameSync(`${configFile}.tmp`, configFile);
                    res.writeHead(200, staticHeaders("json"));
                    res.end(JSON.stringify({
                        ok: true,
                        id: item.id,
                        config: `Craftras Item/${item.id}.json`,
                        images: item.layerFiles.map(layer => `public/img/custom-items/${item.id}-${layer.id}.${layer.extension}`),
                        restartRequired: true,
                    }));
                } catch (error) {
                    res.writeHead(400, staticHeaders("json"));
                    res.end(JSON.stringify({ ok: false, error: error.message }));
                }
            });
        } break;
        case "/portalPermission": {
            ok = false;
            let sserver = [];
            if (Config.allow_server_travel && global.launchedOnMainServer) {
                for (let i = 0; i < global.servers.length; i++) {
                    let server = global.servers[i];
                    if (!server) continue;
                    if (server.gameManager) sserver.push(server);
                }
                res.writeHead(200);
                res.end(JSON.stringify(sserver.map((server) => ({
                    ip: server.ip,
                    players: server.players,
                    gameMode: server.gameMode,
                }))));
            } else {
                res.writeHead(404);
                res.end("Denied.");
            }
        } break;
        case "/isOnline": {
            readString = "true";
        } break;
        case selectedHeader: {
            // For all other routes, serve static files from the public directory
            ok = false;
            let fileToGet = path.join(publicRoot, req.url);

            // If the requested file doesn't exist or isn't a file, default to the INDEX_HTML file
            if (!fs.existsSync(fileToGet) || !fs.lstatSync(fileToGet).isFile()) {
                fileToGet = path.join(publicRoot, `${selectedHeader}/index.html`);
            }

            // Determine the file's MIME type based on its extension and serve the file stream
            const extension = fileToGet.split(".").pop();
            res.writeHead(200, staticHeaders(extension));
            fs.createReadStream(fileToGet).pipe(res);
        } break;

        default: {
            // For all other routes, serve static files from the public directory
            ok = false;
            let fileToGet = path.join(publicRoot, pathname);

            // If the requested file doesn't exist or isn't a file, default to the main_menu file
            if (!fs.existsSync(fileToGet) || !fs.lstatSync(fileToGet).isFile()) {
                fileToGet = path.join(publicRoot, Config.main_menu);
            }

            // Determine the file's MIME type based on its extension and serve the file stream
            const extension = fileToGet.split(".").pop();
            res.writeHead(200, staticHeaders(extension));
            fs.createReadStream(fileToGet).pipe(res);
        } break;
    }

    // If an API endpoint was handled, send the JSON response
    if (ok) {
        res.writeHead(200);
        res.end(readString);
    }
});

// Loads a game server
function loadGameServer(loadViaMain = false, host, port, gamemode, region, webProperties, properties, isFeatured, options = {}) {
    // Determine the new server index and initialize an empty object in the global servers array
    if (!loadViaMain) {
        let index = global.servers.findIndex(entry => entry == null);
        if (index === -1) {
            index = global.servers.length;
            global.servers.push({});
        } else global.servers[index] = {};

        let resolveReady;
        let rejectReady;
        const ready = new Promise((resolve, reject) => {
            resolveReady = resolve;
            rejectReady = reject;
        });

        // Create a new worker thread to load the game server asynchronously
        let worker = new Worker("./server/serverLoader.js", {
            workerData: {
                host,
                port: port, // Increment port for each server
                gamemode,
                region,
                webProperties,
                properties,
                isFeatured,
                index,
            }
        });

        // Listen for messages from the worker to update the server's status
        worker.on("message", message => {
            if (!Array.isArray(message)) return;
            const flag = message.shift();
            switch (flag) {
                case false:
                    // Initial load: store server details
                    global.servers[index] = message.shift();
                    break;
                case true:
                    // Update: change the server's player count
                    const players = message.shift();
                    const playerNames = message.shift();
                    if (global.servers[index]) {
                        global.servers[index].players = players;
                        global.servers[index].playerNames = Array.isArray(playerNames) ? playerNames : [];
                    }
                    options.onPlayers?.(players);
                    break;
                case "doneLoading":
                    // Once loading is complete, trigger the server loaded callback
                    if (options.dynamic) resolveReady(global.servers[index]);
                    else onServerLoaded();
                    break;
            }
        });
        worker.once("error", error => {
            rejectReady(error);
            if (!options.dynamic) console.error(error);
        });
        worker.once("exit", code => {
            if (code !== 0) rejectReady(new Error(`Game server worker exited with code ${code}.`));
            options.onExit?.(code);
        });
        return { worker, index, ready };
    } else {
        global.servers.push({ loadedViaMainServer: true });
        setTimeout(() => { // Space it a little out.
            if (global.launchedOnMainServer) {
                console.warn("Only one server can be loaded via through the main server!\nProcess terminated.");
                process.exit(1);
            }
            global.launchedOnMainServer = true;
            new (require("./game.js").gameServer)(Config.host, Config.port, gamemode, region, webProperties, properties, isFeatured, false);
        }, 10)
    }
}

// Server Loaded Callback
let loadedServers = 0;
global.onServerLoaded = () => {
    loadedServers++;
    // Once all servers are loaded, log the status and routing table
    if (loadedServers >= global.servers.length) {
        util.saveToLog("Servers up", "All servers booted up.", 0x37F554);
        if (Config.startup_logs) {
            util.log("Dumping endpoint -> gamemode routing table");
            for (const game of global.servers) {
                if (!game) continue;
                console.log("> " + `${Config.host}/#${game.id}`.padEnd(40, " ") + " -> " + game.gameMode);
            }
            console.log("\n");
        }
        let serverStartEndTime = performance.now();
        console.log("Server loaded in " + util.rounder(serverStartEndTime, 4) + " milliseconds.");
        console.log("[WEB SERVER]: Server listening on port", Config.port);
    }
};

// Start the HTTP Server & Load Game Servers
server.listen(Config.port, () => {
    Config.servers.forEach(server => {
        // Load all of the servers.
        loadGameServer(
            server.share_client_server,
            server.host,
            server.port,
            server.gamemode,
            server.region,
            { id: server.id, maxPlayers: server.player_cap },
            {
                ...server.properties,
                hidden: server.hidden,
                unlisted: server.unlisted,
                private: server.private,
            },
            server.featured
        );
    })
});

function proxyGameWebSocket(req, socket, head, targetPort) {
    wsServer.handleUpgrade(req, socket, head, client => {
        const upstream = new WebSocketClient(`ws://127.0.0.1:${targetPort}`);
        const pending = [];
        let pendingBytes = 0;
        const terminate = () => {
            if (client.readyState === client.OPEN || client.readyState === client.CONNECTING) client.terminate();
            if (upstream.readyState === WebSocketClient.OPEN || upstream.readyState === WebSocketClient.CONNECTING) upstream.terminate();
        };
        client.on("message", (data, isBinary) => {
            if (upstream.readyState === WebSocketClient.OPEN) upstream.send(data, { binary: isBinary });
            else {
                pendingBytes += data.length || 0;
                if (pendingBytes > 2_000_000) return terminate();
                pending.push([data, isBinary]);
            }
        });
        upstream.on("open", () => {
            for (const [data, isBinary] of pending) upstream.send(data, { binary: isBinary });
            pending.length = 0;
            pendingBytes = 0;
        });
        upstream.on("message", (data, isBinary) => {
            if (client.readyState === client.OPEN) client.send(data, { binary: isBinary });
        });
        client.on("close", () => {
            if (upstream.readyState === WebSocketClient.OPEN) upstream.close();
            else if (upstream.readyState === WebSocketClient.CONNECTING) upstream.terminate();
        });
        upstream.on("close", () => {
            if (client.readyState === client.OPEN) client.close();
        });
        client.on("error", terminate);
        upstream.on("error", terminate);
    });
}

// Upgrade HTTP connections to WebSocket connections if applicable
server.on("upgrade", (req, socket, head) => {
    const pathname = new URL(req.url || "/", "http://localhost").pathname;
    const match = /^\/challenge-instance\/([a-z0-9-]+)$/i.exec(pathname);
    if (match) {
        const instance = challengeInstances.get(match[1]);
        if (!instance || instance.closed) {
            socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
            socket.destroy();
            return;
        }
        proxyGameWebSocket(req, socket, head, instance.port);
        return;
    }
    const configuredMatch = /^\/server\/([a-z0-9-]+)$/i.exec(pathname);
    if (configuredMatch) {
        const configuredServer = (Config.servers || []).find(entry => (
            entry.id === configuredMatch[1] && !entry.share_client_server
        ));
        if (!configuredServer) {
            socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
            socket.destroy();
            return;
        }
        proxyGameWebSocket(req, socket, head, configuredServer.port);
        return;
    }
    wsServer.handleUpgrade(req, socket, head, (ws) => {
        if (global.launchedOnMainServer) {
            for (let i = 0; i < global.servers.length; i++) {
                let server = global.servers[i];
                if (!server) continue;
                if (server.gameManager) server.gameManager.socketManager.connect(ws, req);
            }
        } else {
            ws.close();
        }
    });
});

// Set up a loop to periodically call Bun's garbage collector if available
let bunLoop = setInterval(() => {
    try {
        Bun.gc(true);
    } catch (e) {
        // If Bun.gc fails, clear the interval
        clearInterval(bunLoop);
    }
}, 1000);

// Log that the web server has been initialized if logging is enabled
if (Config.startup_logs) console.log("Web Server initialized.");
