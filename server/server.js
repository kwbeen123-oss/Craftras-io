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
mimeSet = {
    js: "application/javascript",
    json: "application/json",
    css: "text/css",
    html: "text/html",
    md: "text/markdown",
    png: "image/png",
    svg: "image/svg+xml",
};

function staticHeaders(extension) {
    const headers = { "Content-Type": mimeSet[extension] || "text/html" };
    if (extension === "js" || extension === "html") {
        headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
        headers.Pragma = "no-cache";
        headers.Expires = "0";
    }
    return headers;
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
    const id = `world1-challenge-${Date.now().toString(36)}-${suffix}`;
    const instance = {
        id,
        port,
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
            ["craftras_world1_challenge"],
            `World 1 Challenge - ${instance.teamName}`,
            { id, maxPlayers: Math.max(8, instance.memberCount) },
            {
                hidden: true,
                unlisted: true,
                private: true,
                craftras_challenge_instance: true,
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
        console.log(`[Craftras Challenge] Instance ${id} ready on port ${port} for ${instance.teamName} (${instance.memberCount} player(s)).`);
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
                            let { id, name, definition, score, level, skillcap, skill, points, killCount } = json;
                            global.travellingPlayers.push({ id, name, definition, score, level, skillcap, skill, points, killCount });
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
            const flag = message.shift();
            switch (flag) {
                case false:
                    // Initial load: store server details
                    global.servers[index] = message.shift();
                    break;
                case true:
                    // Update: change the server's player count
                    if (global.servers[index]) global.servers[index].players = message[0];
                    options.onPlayers?.(message.shift());
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
        wsServer.handleUpgrade(req, socket, head, client => {
            const upstream = new WebSocketClient(`ws://127.0.0.1:${instance.port}`);
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
