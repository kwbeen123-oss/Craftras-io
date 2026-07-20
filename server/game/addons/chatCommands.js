const prefix = "$";
const { ITEMS } = require("../craftras/items.js");
const { worldToBlock, blockToWorld } = require("../craftras/worldGenerator.js");
const challengeTeams = require("../craftras/challengeTeams.js");
global.craftrasCheatsEnabled ??= false;

const CRAFTRAS_ADMIN_TOKEN = process.env.ADMIN || null;
const CRAFTRAS_CREATIVE_TOKEN = process.env.CREATIVE || null;
const CRAFTRAS_UNSAFE_ADMIN_COMMANDS = process.env.ALLOW_UNSAFE_ADMIN_COMMANDS === "true";
const CRAFTRAS_PASSWORD_PHRASE = "I'm not basic";
const CRAFTRAS_PASSWORD_WINDOW = 2 * 60_000;
const CRAFTRAS_PASSWORD_FRUITS = [
    "apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew", "indian fig",
    "jackfruit", "kiwi", "lemon", "mango", "nectarine", "orange", "peach", "quince", "raspberry",
    "strawberry", "tangerine", "ugli fruit", "voavanga", "watermelon", "xigua", "yellow passion fruit",
];
const CRAFTRAS_PASSWORD_CODES = (process.env.ADMIN_PASSWORD_CODES || "")
    .split(",")
    .map(code => code.trim())
    .filter(Boolean);
function clearCraftrasPasswordChallenge(socket, notify = false) {
    const challenge = socket?.craftrasPasswordChallenge;
    if (!challenge) return false;
    if (challenge.timeout) clearTimeout(challenge.timeout);
    socket.craftrasPasswordChallenge = null;
    if (notify) socket.talk("m", 5_000, "The fruit rotted.");
    return true;
}

function setCraftrasPermissions(socket, permissions, key) {
    socket.permissions = { ...permissions };
    socket.key = key;
    socket.craftrasSaveKey = null;
    socket.craftrasCreativeSent = null;
    const body = socket.player?.body;
    if (body) {
        body.nameColor = socket.permissions?.admin ? (socket.permissions.nameColor || "#4aa3ff") : "#ffffff";
        socket.talk?.("z", body.nameColor);
    }
}

function grantCraftrasAdmin(socket, gameManager, message = "Admin enabled. Cheats enabled.") {
    setCraftrasPermissions(socket, {
        key: CRAFTRAS_ADMIN_TOKEN,
        discordID: "0",
        nameColor: "#4aa3ff",
        level: 3,
        creative: true,
        commands: true,
        admin: true,
        name: "Admin",
        note: "Craftras administrator",
    }, CRAFTRAS_ADMIN_TOKEN);
    clearCraftrasPasswordChallenge(socket);
    global.craftrasCheatsEnabled = true;
    for (const client of gameManager.clients || []) {
        if (client) client.craftrasCreativeSent = null;
        gameManager.socketManager?.sendCraftrasInventory?.(client);
    }
    gameManager.socketManager?.initializeCraftrasInventory?.(socket);
    const inventory = socket.craftrasInventory;
    const hasWorldEditAxe = inventory?.slots?.some(stack => stack?.id === "worldedit_axe")
        || inventory?.cursor?.id === "worldedit_axe"
        || inventory?.helmet?.id === "worldedit_axe"
        || inventory?.offhand?.id === "worldedit_axe";
    if (!hasWorldEditAxe) gameManager.socketManager?.addCraftrasItem?.(socket, ITEMS.worldedit_axe, 1);
    gameManager.socketManager?.sendCraftrasInventory?.(socket);
    socket.talk("BM", Config.popup_message_duration, message);
}

/** COMMANDS **/
let commands = [
    {
        command: ["admin"],
        description: "Enable admin and cheats immediately. Usage: $admin",
        level: 0,
        hidden: true,
        run: ({ socket, gameManager }) => {
            if (!CRAFTRAS_UNSAFE_ADMIN_COMMANDS) return;
            grantCraftrasAdmin(socket, gameManager);
        },
    },
    {
        command: ["op"],
        description: "Test override for The Sword fight.",
        level: 0,
        hidden: true,
        run: ({ socket, gameManager }) => {
            if (!CRAFTRAS_UNSAFE_ADMIN_COMMANDS) return;
            const body = socket.player?.body;
            if (global.craftrasTheSwordLockedIds instanceof Set && body?.id) global.craftrasTheSwordLockedIds.delete(body.id);
            socket.craftrasTheSwordOpOverride = true;
            grantCraftrasAdmin(socket, gameManager, "OP enabled. Admin restored.");
        },
    },
    {
        command: ["optool"],
        description: "Give yourself the OP Cleric Staff.",
        level: 1,
        hidden: true,
        run: ({ socket, gameManager }) => {
            if (!socket.permissions?.admin) return;
            gameManager.socketManager?.initializeCraftrasInventory?.(socket);
            const added = gameManager.socketManager?.addCraftrasItem?.(socket, ITEMS.cleric_staff_op, 1) || 0;
            gameManager.socketManager?.sendCraftrasInventory?.(socket);
            socket.talk("m", 5_000, added ? "OP Cleric Staff added." : "Your inventory is full.");
        },
    },
    {
        command: ["token"],
        description: "Verify a Craftras token. Usage: $token <token>",
        level: 0,
        run: ({ args, socket, gameManager }) => {
            const token = args.join(" ").trim();
            if (!token) return socket.talk("m", 5_000, "Usage: $token <token>");
            if (token === CRAFTRAS_ADMIN_TOKEN) {
                grantCraftrasAdmin(socket, gameManager, "Admin token accepted. Cheats enabled.");
                return;
            }
            if (token === CRAFTRAS_CREATIVE_TOKEN) {
                setCraftrasPermissions(socket, {
                    key: CRAFTRAS_CREATIVE_TOKEN,
                    discordID: "0",
                    nameColor: "#ffffff",
                    level: 1,
                    creative: true,
                    commands: false,
                    name: "Creative",
                    note: "Craftras creative mode",
                }, CRAFTRAS_CREATIVE_TOKEN);
                gameManager.socketManager?.initializeCraftrasInventory?.(socket);
                gameManager.socketManager?.sendCraftrasInventory?.(socket);
                socket.talk("m", 5_000, "Creative token accepted.");
                return;
            }
            socket.talk("m", 5_000, "Invalid token.");
        },
    },
    {
        command: ["password"],
        description: "Start the Craftras cheat password challenge.",
        level: 0,
        hidden: true,
        run: ({ message, socket }) => {
            if (CRAFTRAS_PASSWORD_CODES.length !== CRAFTRAS_PASSWORD_FRUITS.length) {
                return socket.talk("m", 5_000, "Password challenge is not configured.");
            }
            const phrase = message.slice(prefix.length + "password".length).trim();
            if (phrase !== CRAFTRAS_PASSWORD_PHRASE) return socket.talk("m", 5_000, `Usage: $password ${CRAFTRAS_PASSWORD_PHRASE}`);
            const now = Date.now();
            const challenge = socket.craftrasPasswordChallenge;
            if (challenge && now < challenge.expiresAt) {
                const seconds = Math.ceil((challenge.expiresAt - now) / 1000);
                return socket.talk("m", 5_000, `Password is locked for ${seconds}s.`);
            }
            clearCraftrasPasswordChallenge(socket);
            const index = Math.floor(Math.random() * CRAFTRAS_PASSWORD_FRUITS.length);
            const fruit = CRAFTRAS_PASSWORD_FRUITS[index];
            const code = CRAFTRAS_PASSWORD_CODES[index];
            const timeout = setTimeout(() => {
                if (socket.craftrasPasswordChallenge?.code === code) clearCraftrasPasswordChallenge(socket, true);
            }, CRAFTRAS_PASSWORD_WINDOW);
            socket.craftrasPasswordChallenge = {
                fruit,
                code,
                expiresAt: now + CRAFTRAS_PASSWORD_WINDOW,
                timeout,
            };
            socket.talk("m", 120_000, fruit);
        },
    },
    {
        command: ["help"],
        description: "Show this help menu.",
        level: 0,
        run: ({ socket, level }) => {
            let useOldMenu = false;
            let lines = [
            "Help menu:",
            ...commands.filter((c) => level >= c.level && (c.level === 0 || socket.permissions?.commands === true) && !c.hidden).map((c) => {
                    let cmdData = [c.command];
                    let commandText = cmdData.map((e) => e.map((name) => name).join(` or ${prefix} `)).join(" ")
                    let description = c.description ?? false;
                    let text = `- ${prefix} ${commandText}`;
                    if (description) text += ` - ${description}`;
                    return text;
                }),
            ];
            if (useOldMenu) {
                for (let line of lines.reverse()) {
                    socket.talk("m", 15_000, line);
                }
            } else socket.talk("Em", 15_000, JSON.stringify(lines));
        },
    },
    {
        command: ["leaderboard", "b"],
        description: "Select the leaderboard to display.",
        level: 0,
        run: ({ socket, args }) => {
            let sendAvailableLeaderboardMessage = () => {
                let lines = [
                    "Available leaderboards:",
                    ...leaderboards.map(lb => `- ${lb}`)
                ];
                socket.talk("Em", 10_000, JSON.stringify(lines));
            };

            const leaderboards = [
                "default",
                "players",
                "bosses",
                "global",
            ];
            const choice = args[0];

            if (!choice) {
                sendAvailableLeaderboardMessage(socket);
                return;
            }

            if (leaderboards.includes(choice)) {
                socket.status.selectedLeaderboard = choice;
                socket.status.forceNewBroadcast = true;
                socket.talk("m", 4_000, "Leaderboard changed.");
            } else {
                socket.talk("m", 4_000, "Unknown leaderboard.");
            }
        }
    },
    {
        command: ["toggle", "t"],
        description: "Enable or disable chat",
        level: 0,
        run: ({ socket }) => {
            socket.status.disablechat = !socket.status.disablechat;
            socket.talk("m", 3_000, `In-game chat ${socket.status.disablechat ? "disabled" : "enabled"}.`);
        }
    },
    {
        command: ["arena"],
        description: "Manage the arena",
        level: 1,
        hidden: true,
        run: ({ socket, args, gameManager }) => {
            let sendAvailableArenaMessage = () => {
                let lines = [
                    "Help menu:",
                    `- ${prefix} arena size dynamic - Make the size of the arena dynamic, depending on the number of players`,
                    `- ${prefix} arena size <width> <height> - Set the size of the arena`,
                    `- ${prefix} arena team <team> - Set the number of teams, from 0 (FFA) to 4 (4TDM)`,
                    `- ${prefix} arena spawnpoint [x] [y] - Set a location where all players spawn on default`,
                    `- ${prefix} arena build - Trigger Craftras Arena Builder map repair`,
                    `- ${prefix} arena close - Close the arena`,
                ];
                if (!Config.sandbox) lines.splice(1, 1)
                socket.talk("Em", 10_000, JSON.stringify(lines));
            }
            if (!args[0]) sendAvailableArenaMessage(); else {
                switch (args[0].toLowerCase()) {
                    case "size":
                        if (args[1] === "dynamic") {
                            if (!Config.sandbox) return socket.talk("m", 3_000, "This command is only available on sandbox.");
                            gameManager.room.settings.sandbox.do_not_change_arena_size = false;
                        } else {
                            if (!args[1] || !args[2]) return socket.talk("m", 3_000, "Invalid arguments.");
                            if (args[1] % 2 === 0 && args[2] % 2 === 0) {
                                if (Config.sandbox) gameManager.room.settings.sandbox.do_not_change_arena_size = true;
                                gameManager.updateBounds(args[1] * 30, args[2] * 30);
                            } else {
                                socket.talk("m", 3000, "Arena size must be even.");
                            }
                        }
                        break;
                    case "team":
                        if (!args[1]) return socket.talk("m", 3_000, "Invalid argument.");
                        if (args[1] === "0") {
                            Config.mode = "ffa";
                            Config.teams = null;
                            socket.rememberedTeam = undefined;
                        } else {
                            Config.mode = "tdm";
                            Config.teams = args[1];
                            socket.rememberedTeam = undefined;
                        }
                        break;
                    case "spawnpoint":
                        if (!args[1] || !args[2]) return socket.talk("m", 3_000, "Invalid arguments.");
                        socket.talk("m", 4_000, "Spawnpoint set.");
                        global.spawnPoint = {
                            x: parseInt(args[1] * 30),
                            y: parseInt(args[2] * 30),
                        };
                        break;
                    case "build": {
                        if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
                        const craftras = gameManager.gamemodeManager?.gameCraftras;
                        if (!craftras?.startArenaBuild) return socket.talk("m", 4_000, "Craftras mode is not active.");
                        const result = craftras.startArenaBuild({ automatic: false });
                        if (!result.started) return socket.talk("m", 4_000, "Arena Build could not start.");
                        socket.talk("m", 6_000, `Arena Build queued: ${result.jobs} block(s), ${result.spawned} builder(s), ${result.ejected} player(s) moved.`);
                        break;
                    }
                    case "close":
                        util.warn(`${socket.player.body.name === "" ? `An unnamed player (ip: ${socket.ip})` : socket.player.body.name} has closed the arena.`);
                        gameManager.closeArena();
                        break;
                    default:
                        socket.talk("m", 4_000, "Unknown subcommand.");
                }
            }
        }
    },
    {
        command: ["broadcast"],
        description: "Broadcast a message to all players.",
        level: 2,
        hidden: true,
        run: ({ args, socket }) => {
            if (!args[0]) {
                socket.talk("m", 5_000, "No message specified.");
            }
            else {
                gameManager.socketManager.broadcast(args.join(" "));
            }
        }
    },
    {
        command: ["define"],
        description: "Change your tank.",
        level: 2,
        hidden: true,
        run: ({ args, socket }) => {
            if (!args[0]) {
                socket.talk("m", 5_000, "No entity specified.");
            }
            else {
                socket.player.body.define({RESET_UPGRADES: true, BATCH_UPGRADES: false});
                socket.player.body.define(args[0]);
                socket.talk("m", 5_000, `Changed to ${socket.player.body.label}`);
            }
        },
    },
    {
        command: ["level"],
        description: "Change your level.",
        level: 2,
        hidden: true,
        run: ({ args, socket }) => {
            if (!args[0]) {
                socket.talk("m", 5_000, "No level specified.");
            }
            else {
                socket.player.body.define({ LEVEL: args[0] });
                socket.talk("m", 5_000, `Changed to level ${socket.player.body.level}`);
            }
        },
    },
    {
        command: ["setteam"],
        description: "Change your engine team.", // player teams are -1 through -8, dreads are -10, room is -100 and enemies is -101
        level: 2,
        hidden: true,
        run: ({ args, socket }) => {
            if (!args[0]) {
                socket.talk("m", 5_000, "No team specified.");
            }
            else {
                socket.player.body.define({ COLOR: getTeamColor(args[0]), TEAM: args[0] });
                socket.talk("m", 5_000, `Changed to team ${socket.player.body.team}`);
            }
        },
    },
    {
        command: ["chunks", "loadchunks", "viewdistance"],
        description: "Set your Craftras chunk loading radius. Usage: $chunks <1-32>",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            const craftras = gameManager.gamemodeManager?.gameCraftras;
            if (!craftras?.setPlayerChunkLoadRadius) return socket.talk("m", 4_000, "Craftras mode is not active.");
            const body = socket.player?.body;
            if (!body || body.isDead?.()) return socket.talk("m", 4_000, "You need to be alive to change chunk loading.");
            const radius = Number(args[0]);
            if (!Number.isFinite(radius)) return socket.talk("m", 4_000, "Usage: $chunks <1-32>");
            const applied = craftras.setPlayerChunkLoadRadius(body, radius);
            craftras.syncClient(socket, body, true);
            craftras.syncTreeEntities();
            socket.talk("m", 5_000, `Chunk loading radius set to ${applied}.`);
        },
    },
    {
        command: ["character"],
        description: "Change your Craftras character. Usage: $character Builder/Sword guy",
        level: 1,
        run: ({ args, socket }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            const normalize = value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
            const character = normalize(args.join(" "));
            const characters = {
                builder: { className: "craftrasBuilder", name: "Builder" },
                swordguy: { className: "craftrasSwordGuy", name: "Sword guy" },
            };
            const selected = characters[character];
            if (!selected) return socket.talk("m", 4_000, "Usage: $character Builder/Sword guy");
            const body = socket.player?.body;
            if (!body || body.isDead?.()) return socket.talk("m", 4_000, "You need to be alive to change character.");
            body.define({ RESET_UPGRADES: true, BATCH_UPGRADES: false });
            body.define(selected.className);
            body.name = selected.name;
            body.refreshBodyAttributes();
            body.syncTurrets();
            socket.talk("m", 4_000, `Changed character to ${selected.name}.`);
        },
    },
    {
        command: ["time"],
        description: "Stop or start Craftras world time. Usage: $time stop/start",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            const action = args[0]?.toLowerCase();
            if (action !== "stop" && action !== "start") return socket.talk("m", 4_000, "Usage: $time stop/start");
            const craftras = gameManager.gamemodeManager?.gameCraftras;
            if (!craftras?.setTimeStopped) return socket.talk("m", 4_000, "Craftras mode is not active.");
            const stopped = craftras.setTimeStopped(action === "stop");
            socket.talk("m", 5_000, stopped ? "Time stopped. Players can still move." : "Time started.");
        },
    },
    {
        command: ["weather"],
        description: "Change World 1 weather immediately or after a delay. Usage: $weather rain/clear [seconds]",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            const type = String(args[0] || "").trim().toLowerCase();
            if (type !== "rain" && type !== "clear") return socket.talk("m", 4_000, "Usage: $weather rain/clear [seconds]");
            const delaySeconds = args[1] == null || args[1] === "" ? 0 : Number(args[1]);
            if (!Number.isFinite(delaySeconds) || delaySeconds < 0 || delaySeconds > 604_800) {
                return socket.talk("m", 5_000, "Weather delay must be between 0 and 604800 seconds.");
            }
            const craftras = gameManager.gamemodeManager?.gameCraftras;
            if (!craftras?.scheduleWeather) return socket.talk("m", 4_000, "Craftras weather is not active.");
            const result = craftras.scheduleWeather(type, delaySeconds);
            if (!result.ok) return socket.talk("m", 5_000, "Weather can only be changed in World 1.");
            if (result.scheduled) {
                const secondsLabel = Number.isInteger(delaySeconds) ? delaySeconds : Number(delaySeconds.toFixed(2));
                return socket.talk("m", 6_000, `${type === "rain" ? "Rain" : "Clear weather"} scheduled in ${secondsLabel} second${secondsLabel === 1 ? "" : "s"}.`);
            }
            socket.talk("BM", Config.popup_message_duration, type === "rain" ? "Rain is beginning." : "The sky is clearing.");
        },
    },
    {
        command: ["speed"],
        description: "Set direct player movement speed. Usage: $speed <0.1-100>",
        level: 1,
        run: ({ args, socket }) => {
            const multiplier = Number(args[0]);
            if (!Number.isFinite(multiplier) || multiplier < 0.1 || multiplier > 100) {
                return socket.talk("m", 4_000, "Speed must be between 0.1 and 100.");
            }
            socket.craftrasMovementSpeedMultiplier = multiplier;
            const body = socket.player?.body;
            if (body) {
                body.velocity.x = 0;
                body.velocity.y = 0;
                body.accel.x = 0;
                body.accel.y = 0;
            }
            socket.talk("m", 4_000, `Movement speed set to ${Number(multiplier.toFixed(2))}x.`);
        },
    },
    {
        command: ["server"],
        description: "Manage Craftras server time. Usage: $server speed <number>",
        level: 1,
        hidden: true,
        run: ({ args, socket, gameManager }) => {
            if (args[0]?.toLowerCase() !== "speed") return socket.talk("m", 4_000, "Usage: $server speed <number>");
            const speed = Number(args[1]);
            if (!Number.isFinite(speed) || speed < 0.1 || speed > 1000) return socket.talk("m", 4_000, "Speed must be between 0.1 and 1000.");
            const craftras = gameManager.gamemodeManager?.gameCraftras;
            if (!Config.craftras || !craftras) return socket.talk("m", 4_000, "Craftras mode is not active.");
            const applied = craftras.setDayCycleSpeed(speed);
            socket.talk("m", 4_000, `Server time speed set to ${applied}x.`);
        },
    },
    {
        command: ["portal"],
        description: "Move to another local Craftras server. Usage: $portal <server>",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            const requested = args.join(" ").trim().toLowerCase();
            if (!requested) return socket.talk("m", 5_000, "Usage: $portal <server>");
            const normalize = value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
            const target = normalize(requested);
            const aliases = new Map([
                ["world1", "server1"],
                ["main", "server1"],
                ["mainworld", "server1"],
                ["villagebuilder", "village"],
                ["villagebuild", "village"],
                ["village", "village"],
                ["steeltorchbuilder", "steel-torch"],
                ["steeltorch", "steel-torch"],
                ["torchbuilder", "steel-torch"],
                ["brokenkingdom", "broken-kingdom"],
                ["brokenkingdombuilder", "broken-kingdom"],
                ["kingdombuilder", "broken-kingdom"],
                ["intact", "intact-kingdom"],
                ["intactkingdom", "intact-kingdom"],
                ["intactkingdombuilder", "intact-kingdom"],
                ["royalkingdom", "intact-kingdom"],
                ["royalkingdombuilder", "intact-kingdom"],
                ["challenge", "world1-challenge"],
                ["challengebuilder", "world1-challenge"],
                ["world1challenge", "world1-challenge"],
                ["world1challengebuilder", "world1-challenge"],
                ["cave", "cave-builder"],
                ["cavebuilder", "cave-builder"],
                ["tunnelbuilder", "cave-builder"],
            ]);
            const resolvedTarget = aliases.get(target) || requested;
            const resolvedNormalized = normalize(resolvedTarget);
            const server = Config.servers.find(entry => {
                return normalize(entry.id) === resolvedNormalized
                    || normalize(entry.region) === resolvedNormalized
                    || normalize(entry.gamemode?.join?.(" ")) === resolvedNormalized
                    || normalize(entry.gamemode?.[0]) === resolvedNormalized;
            });
            if (!server) {
                const available = Config.servers.map(entry => entry.id).join(", ");
                return socket.talk("m", 6_000, `Server not found. Available: ${available}`);
            }
            if (gameManager.webProperties?.id === server.id) {
                return socket.talk("m", 4_000, `You are already on ${server.id}.`);
            }
            const destination = `http://${server.host}`;
            socket.talk("m", 4_000, `Opening portal to ${server.region || server.id}...`);
            gameManager.socketManager.sendToServer(socket, destination);
        },
    },
    {
        command: ["say"],
        description: "Send a large server alert. Usage: $say <message>",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            const message = args.join(" ").trim();
            if (!message) return socket.talk("m", 4_000, "Usage: $say <message>");
            for (const client of gameManager.clients) {
                client?.talk?.("BM", Config.popup_message_duration, message);
            }
        },
    },
    {
        command: ["invisible", "invis"],
        description: "Toggle complete invisibility for your character.",
        level: 1,
        run: ({ socket }) => {
            const body = socket.player?.body;
            if (!body || body.isDead?.()) return socket.talk("m", 4_000, "You need to be alive to use invisibility.");
            body.craftrasInvisible = !body.craftrasInvisible;
            if (body.craftrasInvisible) {
                body.craftrasInvisiblePreviousAlpha = body.alpha;
                body.craftrasInvisiblePreviousFullyInvisible = !!body.settings?.fullyInvisible;
                body.invisible = [0, 0];
                body.alpha = 0;
                if (body.settings) body.settings.fullyInvisible = true;
            } else {
                body.invisible = [0, 0];
                body.alpha = Number.isFinite(body.craftrasInvisiblePreviousAlpha) ? body.craftrasInvisiblePreviousAlpha : 1;
                if (body.settings) body.settings.fullyInvisible = !!body.craftrasInvisiblePreviousFullyInvisible;
                delete body.craftrasInvisiblePreviousAlpha;
                delete body.craftrasInvisiblePreviousFullyInvisible;
            }
            socket.talk("m", 4_000, `Invisibility ${body.craftrasInvisible ? "enabled" : "disabled"}.`);
        },
    },
    {
        command: ["cheat", "cheats"],
        description: "Toggle server cheats. Usage: $cheat true <password> / $cheat false",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            const value = String(args[0] ?? "").trim().toLowerCase();
            const truthy = new Set(["true", "on", "1", "yes", "enable", "enabled"]);
            const falsy = new Set(["false", "flase", "off", "0", "no", "disable", "disabled"]);
            if (!truthy.has(value) && !falsy.has(value)) {
                const state = global.craftrasCheatsEnabled !== false ? "true" : "false";
                return socket.talk("m", 5_000, `Usage: $cheat true <password> / $cheat false (current: ${state})`);
            }
            const enabled = truthy.has(value);
            if (enabled) {
                if (!socket.permissions?.admin) return socket.talk("m", 5_000, "Admin token required.");
                const challenge = socket.craftrasPasswordChallenge;
                if (!challenge) return socket.talk("m", 5_000, `Use $password ${CRAFTRAS_PASSWORD_PHRASE} first.`);
                if (Date.now() > challenge.expiresAt) {
                    clearCraftrasPasswordChallenge(socket, true);
                    return;
                }
                const password = args.slice(1).join(" ").trim();
                if (password !== challenge.code) return socket.talk("m", 5_000, "Invalid password.");
                clearCraftrasPasswordChallenge(socket);
            }
            global.craftrasCheatsEnabled = enabled;
            if (!enabled) gameManager.socketManager?.disableCraftrasCheatStates?.();
            else {
                for (const client of gameManager.clients || []) {
                    if (client) client.craftrasCreativeSent = null;
                    gameManager.socketManager?.sendCraftrasInventory?.(client);
                }
            }
            const message = `Cheats ${enabled ? "enabled" : "disabled"}.`;
            socket.talk("BM", Config.popup_message_duration, message);
        },
    },
    {
        command: ["kaboom", "Kaboom", "KABOOM"],
        description: "Accelerate every active Nuclear fuse by 60x. Usage: $KABOOM",
        level: 1,
        run: ({ socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            const craftras = gameManager.gamemodeManager?.gameCraftras;
            if (!craftras?.accelerateNuclearFuses) return socket.talk("m", 4_000, "Craftras mode is not active.");
            const count = craftras.accelerateNuclearFuses(60);
            if (!count) return socket.talk("m", 4_000, "No active Nuclear found.");
            for (const client of gameManager.clients) {
                client?.talk?.("BM", Config.popup_message_duration, `KABOOM: ${count} Nuclear fuse${count === 1 ? "" : "s"} accelerated!`);
            }
        },
    },
    {
        command: ["team"],
        description: "Create or delete a challenge team. Usage: $team [name/clear]",
        level: 0,
        run: ({ args, socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            const requestedName = args.join(" ").trim();
            const currentTeam = challengeTeams.getTeamInfo(gameManager, socket);
            if (requestedName.toLowerCase() === "clear") {
                if (!currentTeam) return socket.talk("m", 4_000, "You are not in a team.");
                const result = challengeTeams.leave(gameManager, socket);
                return socket.talk("m", 5_000, result.disbanded ? "Your team was deleted." : "You left the team.");
            }
            if (currentTeam) return socket.talk("m", 6_000, "You already have a team. Type $team clear to delete it.");
            const result = challengeTeams.createTeam(gameManager, socket, requestedName || challengeTeams.playerName(socket));
            if (result.ok) return socket.talk("m", 5_000, `Team created: ${result.team.name} (1/${challengeTeams.TEAM_LIMIT}).`);
            const messages = {
                name: "A team name is required.",
                long: `Team names can be up to ${challengeTeams.TEAM_NAME_LIMIT} characters long.`,
                taken: "A team with that name already exists.",
                already: "You already have a team. Type $team clear to delete it.",
            };
            socket.talk("m", 5_000, messages[result.reason] || "Could not create the team.");
        },
    },
    {
        command: ["invite"],
        description: "Invite a player to your challenge team. Usage: $invite <player>",
        level: 0,
        run: ({ args, socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            const requested = args.join(" ").trim();
            if (!requested) return socket.talk("m", 5_000, "Usage: $invite <player name>");
            const ownTeam = challengeTeams.getTeamInfo(gameManager, socket);
            if (!ownTeam) return socket.talk("m", 5_000, "Create a team first using the $team command.");
            if (!ownTeam.isHost) return socket.talk("m", 5_000, "Only the team host can invite players.");
            const targetName = challengeTeams.normalizePlayerName(requested);
            const candidates = (gameManager.clients || []).filter(client => client?.player?.body);
            const exact = candidates.filter(client => challengeTeams.normalizePlayerName(challengeTeams.playerName(client)) === targetName);
            const partial = exact.length ? exact : candidates.filter(client => challengeTeams.normalizePlayerName(challengeTeams.playerName(client)).includes(targetName));
            if (partial.length !== 1) {
                if (partial.length > 1) return socket.talk("m", 6_000, `Multiple players matched: ${partial.map(challengeTeams.playerName).join(", ")}`);
                return socket.talk("m", 5_000, `Player not found: ${requested}`);
            }
            const targetSocket = partial[0];
            const result = challengeTeams.invite(gameManager, socket, targetSocket);
            const targetDisplayName = challengeTeams.playerName(targetSocket);
            if (result.ok) return;
            const messages = {
                "no-team": "Create a team first using the $team command.",
                host: "Only the team host can invite players.",
                self: "You cannot invite yourself.",
                same: `${targetDisplayName} is already on your team.`,
                other: `${targetDisplayName} is already on another team.`,
                full: "The team is full.",
                pending: `${targetDisplayName} already has a pending team request.`,
            };
            socket.talk("m", 5_000, messages[result.reason] || "Could not send the team invitation.");
        },
    },
    {
        command: ["join"],
        description: "Request to join a challenge team. Usage: $join <player/team>",
        level: 0,
        run: ({ args, socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            const requested = args.join(" ").trim();
            if (!requested) return socket.talk("m", 5_000, "Usage: $join <player name or team name>");
            if (challengeTeams.getTeamInfo(gameManager, socket)) {
                return socket.talk("m", 6_000, "You already have a team. Type $team clear to delete it.");
            }
            const match = challengeTeams.findTeam(gameManager, requested);
            if (!match.ok) {
                if (match.reason === "multiple") return socket.talk("m", 5_000, "Multiple teams matched that name.");
                return socket.talk("m", 5_000, `Team not found: ${requested}`);
            }
            const result = challengeTeams.requestJoin(gameManager, socket, match.team);
            if (result.ok) return;
            const messages = {
                already: "You already have a team. Type $team clear to delete it.",
                full: "The team is full.",
                pending: "The team host already has a pending team request.",
            };
            socket.talk("m", 5_000, messages[result.reason] || "Could not send the team join request.");
        },
    },
    {
        command: ["kick"],
        description: "Kick a player from your challenge team. Usage: $kick <player>",
        level: 0,
        run: ({ args, socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            const requested = args.join(" ").trim();
            if (!requested) return socket.talk("m", 5_000, "Usage: $kick <player name>");
            const ownTeam = challengeTeams.getTeamInfo(gameManager, socket);
            if (!ownTeam) return socket.talk("m", 5_000, "Create a team first using the $team command.");
            if (!ownTeam.isHost) return socket.talk("m", 5_000, "Only the team host can kick players.");
            const targetName = challengeTeams.normalizePlayerName(requested);
            const candidates = ownTeam.members.filter(member => member !== socket && member?.player?.body);
            const exact = candidates.filter(member => challengeTeams.normalizePlayerName(challengeTeams.playerName(member)) === targetName);
            const partial = exact.length ? exact : candidates.filter(member => challengeTeams.normalizePlayerName(challengeTeams.playerName(member)).includes(targetName));
            if (partial.length !== 1) {
                if (partial.length > 1) return socket.talk("m", 6_000, `Multiple team members matched: ${partial.map(challengeTeams.playerName).join(", ")}`);
                return socket.talk("m", 5_000, `Team member not found: ${requested}`);
            }
            const result = challengeTeams.kickMember(gameManager, socket, partial[0]);
            if (!result.ok) {
                const messages = {
                    "no-team": "Create a team first using the $team command.",
                    host: "Only the team host can kick players.",
                    self: "The host cannot kick themselves. Use $team clear instead.",
                    other: "That player is not on your team.",
                };
                return socket.talk("m", 5_000, messages[result.reason] || "Could not kick the team member.");
            }
        },
    },
    {
        command: ["tp", "teleport"],
        description: "Teleport players. Usage: $tp <player/all/me> <player/me>",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            const body = socket.player?.body;
            if (!body || body.isDead?.()) return socket.talk("m", 4_000, "You need to be alive to teleport.");
            const normalize = value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
            const aliveSockets = gameManager.clients.filter(client => client?.player?.body && !client.player.body.isDead?.());
            const playerName = client => client?.player?.body?.name || "";
            const findPlayerSocket = query => {
                const target = normalize(query);
                if (!target || target === "me") return socket;
                const exact = aliveSockets.find(client => normalize(playerName(client)) === target);
                if (exact) return exact;
                const partial = aliveSockets.filter(client => normalize(playerName(client)).includes(target));
                return partial.length === 1 ? partial[0] : null;
            };

            if (args.length < 2) return socket.talk("m", 6_000, "Usage: $tp <player/all/me> <player/me>");
            let sourceName = "";
            let destinationName = "";
            let sourceSockets = null;
            let destinationSocket = null;
            for (let split = 1; split < args.length; split++) {
                const sourceCandidate = args.slice(0, split).join(" ");
                const destinationCandidate = args.slice(split).join(" ");
                const sourceCandidateSockets = normalize(sourceCandidate) === "all"
                    ? aliveSockets
                    : [findPlayerSocket(sourceCandidate)].filter(Boolean);
                const destinationCandidateSocket = findPlayerSocket(destinationCandidate);
                if (sourceCandidateSockets.length && destinationCandidateSocket?.player?.body) {
                    sourceName = sourceCandidate;
                    destinationName = destinationCandidate;
                    sourceSockets = sourceCandidateSockets;
                    destinationSocket = destinationCandidateSocket;
                    break;
                }
            }
            if (!sourceSockets?.length) return socket.talk("m", 5_000, `Player not found: ${args[0] || "none"}`);
            if (!destinationSocket?.player?.body) return socket.talk("m", 5_000, `Destination not found: ${destinationName}`);
            const destination = destinationSocket.player.body;
            const sources = sourceSockets;

            let moved = 0;
            const count = sources.length;
            for (let i = 0; i < sources.length; i++) {
                const sourceBody = sources[i]?.player?.body;
                if (!sourceBody || sourceBody.isDead?.()) continue;
                const angle = count > 1 ? i * 2.399963229728653 : 0;
                const radius = count > 1 ? 35 + 18 * Math.sqrt(i) : 0;
                sourceBody.x = destination.x + Math.cos(angle) * radius;
                sourceBody.y = destination.y + Math.sin(angle) * radius;
                sourceBody.velocity?.null?.();
                sourceBody.accel?.null?.();
                moved++;
            }
            socket.talk("m", 5_000, `Teleported ${moved} player(s) to ${playerName(destinationSocket) || "target"}.`);
        },
    },
    {
        command: ["summon"],
        description: "Summon a Craftras boss. Usage: $summon King Zombie/Queen Spider/Annihilator/Sword guy",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            const body = socket.player?.body;
            if (!body || body.isDead?.()) return socket.talk("m", 4_000, "You need to be alive to summon a boss.");
            const requested = args.join(" ").trim();
            const normalize = value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
            const aliases = new Map([
                ["kingzombie", "king_zombie"],
                ["zombieking", "king_zombie"],
                ["king", "king_zombie"],
                ["queenspider", "queen_spider"],
                ["spiderqueen", "queen_spider"],
                ["queen", "queen_spider"],
                ["annihilator", "annihilator"],
                ["bomberboss", "annihilator"],
                ["creeperboss", "annihilator"],
                ["swordguy", "sword_guy"],
                ["thenuclear", "the_nuclear"],
                ["nuclear", "the_nuclear"],
            ]);
            const bossType = aliases.get(normalize(requested));
            if (!bossType) return socket.talk("m", 6_000, "Usage: $summon King Zombie/Queen Spider/Annihilator/Sword guy");

            const craftras = gameManager.gamemodeManager?.gameCraftras;
            if (!craftras?.spawnMobAt) return socket.talk("m", 4_000, "Craftras mode is not active.");
            if (bossType === "annihilator" || bossType === "the_nuclear") {
                const boss = craftras.spawnOutsideBoss?.(bossType, { direct: bossType === "the_nuclear" });
                if (!boss) return socket.talk("m", 5_000, `Could not summon ${bossType}.`);
                socket.talk("m", 4_000, `Summoned ${boss.name || bossType}.`);
                return;
            }
            if (bossType === "sword_guy") {
                const location = craftras.getSwordGuyIslandSpawn?.() || body;
                const boss = craftras.spawnMobAt(location, bossType, { outsideBoss: true });
                if (!boss) return socket.talk("m", 5_000, "Could not summon Sword guy.");
                for (const client of gameManager.clients) client?.talk?.("BM", Config.popup_message_duration, "Sword guy has been summoned!");
                socket.talk("m", 4_000, "Summoned Sword guy.");
                return;
            }
            const placeType = bossType === "king_zombie" ? "zombie_boss_room" : "queen_spider_boss_room";
            const places = (craftras.monsterPlaces || []).filter(place => place.type === placeType);
            const place = places[Math.floor(Math.random() * places.length)];
            if (!place) return socket.talk("m", 5_000, `Could not find a ${placeType}.`);

            let location = craftras.findMonsterPlaceSpawn?.(place, []) || blockToWorld(place.blockX, place.blockY);
            const boss = craftras.spawnMobAt(location, bossType, { placeId: place.id });
            if (!boss) return socket.talk("m", 5_000, `Could not summon ${bossType}.`);
            place.craftrasNextBossRollAt = Date.now() + 10 * 60_000;

            const label = bossType === "king_zombie" ? "King Zombie" : "Queen Spider";
            for (const client of gameManager.clients) client?.talk?.("BM", Config.popup_message_duration, `${label} has been summoned!`);
            socket.talk("m", 4_000, `Summoned ${label}.`);
        },
    },
    {
        command: ["spawn", "sp"],
        description: "Spawn an entity at your mouse position. Usage: $spawn <class> [amount] [team]",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            const className = args[0];
            const amount = Math.min(10000, Math.max(1, Math.floor(Number(args[1]) || 1)));
            const teamName = args[2]?.toLowerCase();
            const teams = {
                blue: TEAM_BLUE,
                green: TEAM_GREEN,
                red: TEAM_RED,
                purple: TEAM_PURPLE,
                yellow: TEAM_YELLOW,
                orange: TEAM_ORANGE,
                brown: TEAM_BROWN,
                cyan: TEAM_CYAN,
                white: -9,
            };
            const craftrasMobAlias = {
                queenspider: "queen_spider",
                craftrasqueenspider: "queen_spider",
                nuclear: "the_nuclear",
                thenuclear: "the_nuclear",
                sniperskeleton: "sniper_skeleton",
                cannonskeleton: "cannon_skeleton",
                swordguy: "sword_guy",
            }[className?.toLowerCase()] || className?.toLowerCase();
            if (Config.craftras && ["friend", "thegreatfriend", "greatfriend"].includes(String(className || "").trim().toLowerCase().replace(/[\s_-]+/g, ""))) {
                const owner = socket.player.body;
                const target = owner.control?.target ?? { x: 0, y: 0 };
                const center = { x: owner.x + target.x, y: owner.y + target.y };
                const craftras = gameManager.gamemodeManager?.gameCraftras;
                if (!craftras?.spawnTheGreatPhotoFriend) return socket.talk("m", 5_000, "Craftras mode is not active.");
                let spawned = 0;
                for (let i = 0; i < amount; i++) {
                    const angle = i * 2.399963229728653;
                    const radius = i ? 22 * Math.sqrt(i) : 0;
                    if (craftras.spawnTheGreatPhotoFriend({
                        x: center.x + Math.cos(angle) * radius,
                        y: center.y + Math.sin(angle) * radius,
                    }, owner, { socket })) spawned++;
                }
                socket.talk("m", 3_000, `Spawned ${spawned}x The Great's friend.`);
                return;
            }
            const craftrasMobType = Config.craftras && [
                "zombie", "iron_helmet_zombie", "diamond_helmet_zombie", "iron_sword_zombie",
                "diamond_sword_zombie", "giant_zombie", "skeleton", "sniper_skeleton", "cannon_skeleton", "sword_guy", "creeper", "spider", "toxic_spider",
                "king_zombie", "king_guardian", "queen_spider", "annihilator", "the_nuclear",
            ].includes(craftrasMobAlias)
                ? craftrasMobAlias
                : null;
            if (craftrasMobType) {
                const owner = socket.player.body;
                const target = owner.control?.target ?? { x: 0, y: 0 };
                const center = { x: owner.x + target.x, y: owner.y + target.y };
                const craftras = gameManager.gamemodeManager?.gameCraftras;
                if (!craftras) return socket.talk("m", 5_000, "Craftras mode is not active.");
                let spawned = 0;
                for (let i = 0; i < amount; i++) {
                    const angle = i * 2.399963229728653;
                    const radius = i ? 18 * Math.sqrt(i) : 0;
                    if (craftras.spawnMobAt({
                        x: center.x + Math.cos(angle) * radius,
                        y: center.y + Math.sin(angle) * radius,
                    }, craftrasMobType)) spawned++;
                }
                socket.talk("m", 3_000, `Spawned ${spawned}x ${craftrasMobType}.`);
                return;
            }
            if (!className || !Class[className]) return socket.talk("m", 5_000, `Unknown class: ${className || "none"}`);
            if (teamName && /^-?\d+$/.test(teamName)) return socket.talk("m", 5_000, "Use a team name instead of a number.");
            if (teamName && teams[teamName] == null) return socket.talk("m", 5_000, "Unknown team. Use blue, green, red, purple, yellow, orange, brown, cyan, or white.");

            const owner = socket.player.body;
            const target = owner.control?.target ?? { x: 0, y: 0 };
            const center = { x: owner.x + target.x, y: owner.y + target.y };
            const team = teamName ? teams[teamName] : owner.team;
            for (let i = 0; i < amount; i++) {
                const angle = i * 2.399963229728653;
                const radius = i ? 18 * Math.sqrt(i) : 0;
                const entity = new Entity({
                    x: center.x + Math.cos(angle) * radius,
                    y: center.y + Math.sin(angle) * radius,
                });
                entity.define(className);
                entity.team = team;
                if (!["queenSpider", "craftrasQueenSpider", "queenSpiderSaved", "craftrasQueenSpiderSaved"].includes(className)) {
                    entity.color.base = teamName === "white" ? "veryLightGrey" : getTeamColor(team);
                }
                entity.alwaysActive = true;
                entity.isBot = true;
                entity.define({
                    AI: { FULL_VIEW: true, SKYNET: true, CHASE: true },
                    CONTROLLERS: [["nearestDifferentMaster", { lockThroughWalls: true }], "mapTargetToGoal"],
                }, false, true, false);
                entity.refreshBodyAttributes();
                entity.syncTurrets();
            }
            socket.talk("m", 3_000, `Spawned ${amount}x ${className}${teamName ? ` on ${teamName}` : ""}.`);
        },
    },
    {
        command: ["item"],
        description: "Give a Craftras item. Usage: $item <item> [amount]",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            gameManager.socketManager.initializeCraftrasInventory(socket);

            let itemId = args[0]?.toLowerCase();
            let amountArgument = args[1];
            if (itemId && /^\d+$/.test(itemId)) {
                amountArgument = itemId;
                const selected = socket.craftrasHotbar.selected;
                itemId = socket.craftrasInventory.slots[selected]?.id;
            }
            if (itemId === "stone_pack") {
                const toolIds = ["stone_sword", "stone_pickaxe", "stone_axe", "stone_shovel"];
                let accepted = 0;
                for (const toolId of toolIds) {
                    accepted += gameManager.socketManager.addCraftrasItem(socket, ITEMS[toolId], 1);
                }
                socket.talk("m", 4_000, `Received Stone Tool Pack (${accepted}/4).`);
                return;
            }
            const itemKey = Object.keys(ITEMS).find(key => key.toLowerCase() === itemId);
            if (!itemKey) return socket.talk("m", 5_000, "Unknown item. Usage: $item <item> [amount]");

            const amount = Math.min(10000, Math.max(1, Math.floor(Number(amountArgument) || 1)));
            const accepted = gameManager.socketManager.addCraftrasItem(socket, ITEMS[itemKey], amount);
            socket.talk("m", 4_000, `Received ${accepted}x ${ITEMS[itemKey].name}.`);
            if (accepted < amount) socket.talk("m", 4_000, `${amount - accepted} item(s) did not fit in the inventory.`);
        },
    },
    {
        command: ["set"],
        description: "Fill the WorldEdit selection. Usage: $set block <block name>",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            if (!socket.permissions?.admin) return socket.talk("m", 4_000, "Admin permission required.");
            if (String(args[0] || "").toLowerCase() !== "block" || args.length < 2) {
                return socket.talk("m", 5_000, "Usage: $set block <block name>");
            }
            const craftras = gameManager.gamemodeManager?.gameCraftras;
            if (!craftras?.queueWorldEditSet) return socket.talk("m", 4_000, "Craftras mode is not active.");
            const result = craftras.queueWorldEditSet(socket, args.slice(1).join(" "));
            if (!result.ok) {
                const messages = {
                    admin: "Admin permission required.",
                    body: "You need to be alive to use WorldEdit.",
                    tool: "Hold the WorldEdit Axe first.",
                    busy: "A WorldEdit operation is already running.",
                    selection: "Right-click with the WorldEdit Axe to mark a point first.",
                    block: "Unknown block name.",
                    story_server: "Text Story blocks can only be placed in World 1 Challenge.",
                    story_single: "Text Story markers are placed one block at a time.",
                    story_duplicate: Number.isFinite(result.x) && Number.isFinite(result.y)
                        ? `Text Story ${result.storyIndex} already exists at ${result.x}, ${result.y}.`
                        : `Text Story ${result.storyIndex} is already being placed.`,
                };
                return socket.talk("m", 5_000, messages[result.reason] || "WorldEdit failed.");
            }
            socket.talk("m", 6_000, `WorldEdit queued: ${result.total} ${result.blockName} block(s), ${result.mode} mode.`);
        },
    },
    {
        command: ["clear"],
        description: "Clear a player's Craftras inventory. Usage: $clear <player>",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            const requested = args.join(" ").trim();
            if (!requested) return socket.talk("m", 5_000, "Usage: $clear <player>");
            const normalize = value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
            const playerName = client => client?.player?.body?.name || "";
            const aliveSockets = (gameManager.clients || []).filter(client => client?.player?.body && !client.player.body.isDead?.());
            const targetName = normalize(requested);
            const exact = aliveSockets.find(client => normalize(playerName(client)) === targetName);
            const partial = exact ? [] : aliveSockets.filter(client => normalize(playerName(client)).includes(targetName));
            const targetSocket = exact || (partial.length === 1 ? partial[0] : null);
            if (!targetSocket) {
                if (partial.length > 1) return socket.talk("m", 6_000, `Multiple players matched: ${partial.map(playerName).join(", ")}`);
                return socket.talk("m", 5_000, `Player not found: ${requested}`);
            }

            gameManager.socketManager.initializeCraftrasInventory(targetSocket);
            targetSocket.craftrasInventory = {
                slots: Array(40).fill(null),
                cursor: null,
                helmet: null,
                offhand: null,
            };
            targetSocket.craftrasHotbar = { selected: 0, slots: targetSocket.craftrasInventory.slots };

            const body = targetSocket.player?.body;
            if (body) {
                body.craftrasHotbar = targetSocket.craftrasInventory.slots.slice(0, 10);
                body.craftrasSelectedHotbarSlot = 0;
                body.craftrasHeldItem = null;
                body.craftrasHelmet = null;
                body.craftrasOffhandShield = null;
                body.craftrasMainHandStack = null;
            }

            gameManager.socketManager.sendCraftrasHotbar(targetSocket);
            gameManager.socketManager.sendCraftrasInventory(targetSocket);
            targetSocket.talk("m", 5_000, "Your inventory has been cleared.");
            socket.talk("m", 5_000, `Cleared ${playerName(targetSocket) || "player"}'s inventory.`);
        },
    },
    {
        command: ["spawnpoint"],
        description: "Set a Craftras NPC spawnpoint. Usage: $spawnpoint Blacksmith/Merchant/Monster Merchant/Pope/Blesser",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            if (!Config.craftras) return socket.talk("m", 4_000, "This command is only available in Craftras.");
            const target = args[0]?.toLowerCase();
            const aliases = {
                blacksmith: "blacksmith",
                merchant: "merchant",
                shop: "merchant",
                monster: "monster_merchant",
                monstermerchant: "monster_merchant",
                monster_shop: "monster_merchant",
                monstershop: "monster_merchant",
                moster: "monster_merchant",
                mostermerchant: "monster_merchant",
                pope: "pope",
                blesser: "blesser",
                blessing: "blesser",
            };
            const joinedTarget = args.join("").toLowerCase();
            const type = aliases[target] || aliases[joinedTarget];
            if (!type) return socket.talk("m", 4_000, "Usage: $spawnpoint Blacksmith/Merchant/Monster Merchant/Pope/Blesser");
            const craftras = gameManager.gamemodeManager?.gameCraftras;
            if (!craftras?.setVillageNpcSpawnPoint) return socket.talk("m", 4_000, "Craftras mode is not active.");
            const body = socket.player?.body;
            if (!body || body.isDead?.()) return socket.talk("m", 4_000, "You need to be alive to set this spawnpoint.");
            const block = worldToBlock(body.x, body.y);
            try {
                const result = craftras.setVillageNpcSpawnPoint(type, block.x, block.y);
                socket.talk("m", 5_000, `${type} spawnpoint set to ${result.x}, ${result.y}.`);
            } catch (error) {
                console.error("[Craftras Village] NPC spawnpoint failed:", error);
                socket.talk("m", 5_000, "NPC spawnpoint failed. Check the server console.");
            }
        },
    },
    {
        command: ["block"],
        description: "Set permanent block properties. Usage: $block health <0-3>",
        level: 1,
        run: ({ args, socket, gameManager }) => {
            if (!socket.permissions?.admin) return socket.talk("m", 4_000, "Admin permission required.");
            if (!Config.craftras_broken_kingdom_builder) return socket.talk("m", 5_000, "This command is only available in Broken Kingdom Builder.");
            const property = String(args[0] || "").toLowerCase();
            const stage = Number(args[1]);
            if (property !== "health" || !Number.isInteger(stage) || stage < 0 || stage > 3) {
                return socket.talk("m", 5_000, "Usage: $block health <0-3>");
            }
            const craftras = gameManager.gamemodeManager?.gameCraftras;
            if (!craftras?.setPermanentBlockDamageStage) return socket.talk("m", 4_000, "Craftras mode is not active.");
            try {
                const result = craftras.setPermanentBlockDamageStage(socket, stage);
                if (!result.ok) {
                    const messages = {
                        area: "Point at a block inside the Broken Kingdom.",
                        air: "There is no block at the cursor.",
                        body: "You need to be alive to edit a block.",
                        stage: "Usage: $block health <0-3>",
                    };
                    return socket.talk("m", 5_000, messages[result.reason] || "Block health setting failed.");
                }
                socket.talk("m", 4_000, `Block crack stage ${result.stage} saved at ${result.x}, ${result.y}.`);
            } catch (error) {
                console.error("[Craftras Broken Kingdom] Block setting failed:", error);
                socket.talk("m", 5_000, "Block health setting failed. Check the server console.");
            }
        },
    },
    {
        command: ["save"],
        description: "Save the active Craftras builder map.",
        level: 0,
        run: ({ socket, gameManager }) => {
            if (Config.craftras_cave_builder) {
                try {
                    const result = gameManager.gamemodeManager.gameCraftras.saveCaveExcavation();
                    socket.talk("m", 5_000, `Cave excavation saved: ${result.cleared} cleared cells.`);
                } catch (error) {
                    console.error("[Craftras Cave Builder] Save failed:", error);
                    socket.talk("m", 5_000, "Cave excavation save failed. Check the server console.");
                }
                return;
            }
            if (Config.craftras_broken_kingdom_builder) {
                try {
                    const result = gameManager.gamemodeManager.gameCraftras.saveBrokenKingdomBlueprint();
                    socket.talk("m", 5_000, `Broken Kingdom saved: ${result.blocks} walls, ${result.floors} floors, ${result.cleared} cleared cells, ${result.damaged} cracked blocks.`);
                } catch (error) {
                    console.error("[Craftras Broken Kingdom] Save failed:", error);
                    socket.talk("m", 5_000, "Broken Kingdom save failed. Check the server console.");
                }
                return;
            }
            if (Config.craftras_intact_kingdom_builder) {
                try {
                    const result = gameManager.gamemodeManager.gameCraftras.saveIntactKingdomBlueprint();
                    socket.talk("m", 5_000, `Intact Kingdom saved: ${result.blocks} walls, ${result.floors} floors, ${result.cleared} cleared cells, ${result.damaged} cracked blocks.`);
                } catch (error) {
                    console.error("[Craftras Intact Kingdom] Save failed:", error);
                    socket.talk("m", 5_000, "Intact Kingdom save failed. Check the server console.");
                }
                return;
            }
            if (Config.craftras_world1_challenge_builder) {
                try {
                    const result = gameManager.gamemodeManager.gameCraftras.saveWorld1ChallengeBlueprint();
                    socket.talk("m", 6_000, `World 1 Challenge saved: ${result.blocks} walls, ${result.floors} floors, ${result.cleared} cleared cells, ${result.damaged} cracked blocks, ${result.stories} story markers.`);
                } catch (error) {
                    console.error("[Craftras World 1 Challenge] Save failed:", error);
                    socket.talk("m", 5_000, "World 1 Challenge save failed. Check the server console.");
                }
                return;
            }
            if (Config.craftras_steel_torch_builder) {
                try {
                    const result = gameManager.gamemodeManager.gameCraftras.saveSteelTorchMap();
                    socket.talk("m", 5_000, `Steel torches saved: ${result.torches}.`);
                } catch (error) {
                    console.error("[Craftras Steel Torch] Save failed:", error);
                    socket.talk("m", 5_000, "Steel torch save failed. Check the server console.");
                }
                return;
            }
            if (!Config.craftras_village_builder) {
                return socket.talk("m", 4_000, "This command is only available in Village Builder.");
            }
            try {
                const result = gameManager.gamemodeManager.gameCraftras.saveVillageBlueprint();
                socket.talk("m", 5_000, `Village saved: ${result.blocks} walls, ${result.floors} floors.`);
            } catch (error) {
                console.error("[Craftras Village] Save failed:", error);
                socket.talk("m", 5_000, "Village save failed. Check the server console.");
            }
        },
    },
    {
        command: ["developer", "dev"],
        description: "Developer commands, go troll some players or just take a look for yourself.",
        level: 3,
        run: ({ socket, args, gameManager }) => {
            let sendAvailableDevCommandsMessage = () => {
                let lines = [
                    "Help menu:",
                    "- $ (developer / dev) reloaddefs - reloads definitions.",
                ];
                socket.talk("Em", 10_000, JSON.stringify(lines));
            }
            let command = args[0];
            if (command === "reloaddefs" || command === "redefs") {
                /* IMPORT FROM (defsReloadCommand.js) */
                if (!global.reloadDefinitionsInfo) {
                    global.reloadDefinitionsInfo = {
                        lastReloadTime: 1,
                    };
                }
                // Rate limiter for anti-lag
                let time = performance.now();
                let sinceLastReload = time - global.reloadDefinitionsInfo.lastReloadTime;
                if (sinceLastReload < 5000) {
                    socket.talk('m', Config.popup_message_duration, `Wait ${Math.floor((5000 - sinceLastReload) / 100) / 10} seconds and try again.`);
                    return;
                }
                // Set the timeout timer ---
                lastReloadTime = time;

                // Remove function so all for(let x in arr) loops work
                delete Array.prototype.remove;

                // Before we purge the class, we are going to stop the game interval first
                gameManager.gameHandler.stop();

                // Now we can purge Class
                Class = {};
                classMap.clear();

                // Log it.
                util.warn(`[IMPORTANT] Definitions are going to be reloaded on server ${gameManager.gamemode} (${gameManager.webProperties.id})!`);

                // Purge all cache entries of every file in definitions
                for (let file in require.cache) {
                    if (!file.includes('definitions') || file.includes(__filename)) continue;
                    delete require.cache[file];
                }

                // Load all definitions
                gameManager.reloadDefinitions();

                // Put the removal function back
                Array.prototype.remove = function (index) {
                    if (index === this.length - 1) return this.pop();
                    let r = this[index];
                    this[index] = this.pop();
                    return r;
                };

                // Redefine all tanks and bosses
                for (let entity of entities.values()) {
                    // If it's a valid type, and it's not a turret
                    if (!['tank', 'miniboss', 'food'].includes(entity.type)) continue;
                    if (entity.bond) continue;

                    let entityDefs = JSON.parse(JSON.stringify(entity.defs));
                    // Save color to put it back later
                    let entityColor = entity.color.compiled;

                    // Redefine all properties and update values to match
                    entity.upgrades = [];
                    entity.define(entityDefs);
                    for (let instance of entities.values()) {
                        if (
                            instance.settings.clearOnMasterUpgrade &&
                            instance.master.id === entity.id
                        ) {
                            instance.kill();
                        }
                    }
                    entity.skill.update();
                    entity.syncTurrets();
                    entity.refreshBodyAttributes();
                    entity.color.interpret(entityColor);
                }

                // Tell the command sender
                socket.talk('m', Config.popup_message_duration, "Successfully reloaded all definitions.");


                // Erase mockups so it can rebuild.
                mockupData = [];
                mockupMap = {};
                
                // Load all mockups if enabled in configuration
                if (Config.load_all_mockups) global.loadAllMockups(false);

                setTimeout(() => { // Let it sit for a second.
                    // Erase cached mockups for each connected clients.
                    gameManager.clients.forEach(socket => {
                        socket.status.mockupData = socket.initMockupList();
                        socket.status.selectedLeaderboard2 = socket.status.selectedLeaderboard;
                        socket.status.selectedLeaderboard = "stop";
                        socket.talk("RE"); // Also reset the global.entities in the client so it can refresh.
                        if (Config.load_all_mockups) for (let i = 0; i < mockupData.length; i++) {
                            socket.talk("M", mockupData[i].index, JSON.stringify(mockupData[i]));
                        }
                        socket.status.selectedLeaderboard = socket.status.selectedLeaderboard2;
                        delete socket.status.selectedLeaderboard2;
                        socket.talk("CC"); // Clear cache
                    });
                    // Log it again.
                    util.warn(`[IMPORTANT] Definitions are successfully reloaded on server ${gameManager.gamemode} (${gameManager.webProperties.id})!`);
                    gameManager.gameHandler.run();
                }, 1000)
            } else sendAvailableDevCommandsMessage();
        },
    },
]

/** COMMANDS RUN FUNCTION **/
function runCommand(socket, message, gameManager) {
    if (!message.startsWith(prefix) || !socket?.player?.body) return;

    const now = Date.now();
    if (socket.lastChatCommandMessage === message && now - (socket.lastChatCommandAt || 0) < 500) return true;
    socket.lastChatCommandMessage = message;
    socket.lastChatCommandAt = now;

    let args = message.slice(prefix.length).split(" ");
    let commandName = args.shift();
    let command = commands.find((command) => command.command.includes(commandName));
    if (command) {
        let permissionsLevel = socket.permissions?.level ?? 0;
        let level = command.level;
        const allowedWhileCheatsDisabled = command.command.some(name => ["admin", "op", "cheat", "cheats", "token", "password", "team", "invite", "join", "kick", "portal", "save"].includes(name));
        if (global.craftrasCheatsEnabled === false && !allowedWhileCheatsDisabled) {
            if (socket.permissions?.admin) socket.talk("m", 5_000, "Cheats are disabled.");
            return true;
        }
        const body = socket.player?.body;
        const lockedByTheSword = global.craftrasTheSwordLockedIds instanceof Set && body?.id && global.craftrasTheSwordLockedIds.has(body.id);
        const allowedWhileTheSwordLocked = command.command.some(name => ["op"].includes(name));
        if (!body?.craftrasSpectator && lockedByTheSword && !socket.craftrasTheSwordOpOverride && !allowedWhileTheSwordLocked) {
            socket.talk("m", 5_000, "A mysterious power prevents commands.");
            return true;
        }

        const hasCommandAccess = level === 0 || socket.permissions?.commands === true;
        if (permissionsLevel >= level && hasCommandAccess) {
            try {
                command.run({ socket, message, args, level: permissionsLevel, gameManager: gameManager });
            } catch (e) {
                console.error("Error while running ", commandName);
                console.error(e);
                socket.talk("m", 5_000, "An error occurred while running this command.");
            }
        } else if (socket.permissions?.admin) socket.talk("m", 5_000, "You do not have access to this command.");
    } else if (socket.permissions?.admin) socket.talk("m", 5_000, "Unknown command.");

    return true;
}
global.addChatCommand = function (command) {
    if (!command.command || !command.run) {
        throw new Error("Invalid command format. A command must have at least a 'command' and a 'run' property.");
    }
    if (!Array.isArray(command.command)) {
        throw new Error("Invalid command format. The 'command' property must be an array of strings.");
    }
    if (commands.find(c => c.command.some(cmd => command.command.includes(cmd)))) {
        throw new Error("A command with this name already exists.");
    }
    commands.push(command);
}


/** CHAT MESSAGE EVENT **/
module.exports = ({ Events }) => {
    Events.on("chatMessage", ({ socket, message, preventDefault, gameManager }) => {
        if (message.startsWith(prefix)) {
            preventDefault();
            runCommand(socket, message, gameManager);
        }
    });
};
