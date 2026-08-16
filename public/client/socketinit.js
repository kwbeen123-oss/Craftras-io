import { global } from "./global.js?v=20260815-play-fix1";
import { util } from "./util.js?v=20260815-play-fix1";
import { config, resetScreenShake } from "./config.js?v=20260815-play-fix1";
import { protocol } from "./protocol.js?v=20260719-challenge-instance1";
window.fakeLagMS = 0;
var sync = [];
var clockDiff = 0;
var serverStart = 0;
let levelscore = 0;
let deduction = 0;
let level = 1;
let kills = [0, 0, 0];
let sscore = util.AdvancedSmoothBar(0, 2);
const CRAFTRAS_INVENTORY_SAVE_KEY = "craftrasInventorySave:v1";
const CRAFTRAS_ADMIN_SESSION_KEY = "craftrasAdminSession:v1";
let craftrasPersistenceBlocked = false;
const CRAFTRAS_ADMIN_ITEM_IDS = new Set([
    "steel_torch", "bedrock", "challenge_start_block", "world2_challenge_block", "challenge_spawn_block", "transparent_block", "route_marker_block", "admin_pickaxe", "worldedit_axe", "destroyer", "m134", "rocket_launcher", "laser_test", "blue_laser_beam", "screen_cut_test",
    "creative_24h", "creative_1h", "cleric_hat", "pope_hat", "pope_staff", "blesser_hat", "blesser_staff",
    "jane_hat", "jane_sword",
]);
const getCraftrasScoreForLevel = rawLevel => {
    const targetLevel = Math.max(1, Math.trunc(Number(rawLevel) || 1));
    let score = 0;
    let tierStart = 1;
    let cost = 10_000;
    while (tierStart < targetLevel) {
        const tierEnd = Math.min(targetLevel, tierStart + 100);
        score += (tierEnd - tierStart) * cost;
        tierStart += 100;
        cost *= 10;
    }
    return score;
};
const sanitizeCraftrasBrowserStack = (stack, maxCount = 64) => {
    if (!stack?.id || typeof stack.id !== "string" || CRAFTRAS_ADMIN_ITEM_IDS.has(stack.id)) return null;
    const count = Math.max(1, Math.min(maxCount, Math.floor(Number(stack.count) || 1)));
    return { id: stack.id, name: typeof stack.name === "string" ? stack.name : stack.id, count };
};
const saveCraftrasInventoryToBrowser = () => {
    if (craftrasPersistenceBlocked || !global.craftrasInventory?.active || global.craftrasChallengeInventoryTemporary) return false;
    try {
        const save = {
            version: 1,
            savedAt: Date.now(),
            inventory: {
                slots: Array.from({ length: 40 }, (_, index) => sanitizeCraftrasBrowserStack(global.craftrasInventory.slots?.[index])),
                cursor: sanitizeCraftrasBrowserStack(global.craftrasInventory.cursor),
                helmet: sanitizeCraftrasBrowserStack(global.craftrasInventory.helmet, 1),
                offhand: sanitizeCraftrasBrowserStack(global.craftrasInventory.offhand, 1),
            },
            hotbarSelected: Math.max(0, Math.min(9, Math.floor(Number(global.craftrasHotbar?.selected) || 0))),
        };
        localStorage.setItem(CRAFTRAS_INVENTORY_SAVE_KEY, JSON.stringify(save));
        return true;
    } catch {
        return false;
    }
};
const loadCraftrasInventoryFromBrowser = () => {
    try {
        const raw = localStorage.getItem(CRAFTRAS_INVENTORY_SAVE_KEY);
        if (!raw) return null;
        const save = JSON.parse(raw);
        if (!save?.inventory || !Array.isArray(save.inventory.slots)) return null;
        return save;
    } catch {
        return null;
    }
};
const sendCraftrasInventorySaveToServer = socket => {
    if (craftrasPersistenceBlocked || global.craftrasChallengeInventoryTemporary) return false;
    const save = loadCraftrasInventoryFromBrowser();
    if (!socket?.talk || !save) return false;
    try {
        socket.talk("IS", JSON.stringify(save));
        return true;
    } catch {
        return false;
    }
};
const loadCraftrasAdminSession = () => {
    try {
        const session = JSON.parse(localStorage.getItem(CRAFTRAS_ADMIN_SESSION_KEY) || "null");
        if (!session?.token || Number(session.expiresAt) <= Date.now()) {
            localStorage.removeItem(CRAFTRAS_ADMIN_SESSION_KEY);
            return null;
        }
        return session;
    } catch {
        localStorage.removeItem(CRAFTRAS_ADMIN_SESSION_KEY);
        return null;
    }
};
const sendCraftrasAdminSessionToServer = socket => {
    const session = loadCraftrasAdminSession();
    if (!socket?.talk || !session) return false;
    socket.talk("AU", session.token);
    return true;
};
let getNow = () => {
    return Date.now() - clockDiff - serverStart;
},
startSettings = {
    allowtostartgame: true,
    neededtoresync: false,
},
gui = {
    getStatNames: data => {
        return [
            data?.body_damage ?? 'Body Damage',
            data?.max_health ?? 'Max Health',
            data?.bullet_speed ?? 'Bullet Speed',
            data?.bullet_health ?? 'Bullet Health',
            data?.bullet_pen ?? 'Bullet Penetration',
            data?.bullet_damage ?? 'Bullet Damage',
            data?.reload ?? 'Reload',
            data?.move_speed ?? 'Movement Speed',
            data?.shield_regen ?? 'Shield Regeneration',
            data?.shield_cap ?? 'Shield Capacity',
        ]
    },
    skills: [
        { amount: 0, color: 'purple', cap: 1, softcap: 1 },
        { amount: 0, color: 'pink'  , cap: 1, softcap: 1 },
        { amount: 0, color: 'blue'  , cap: 1, softcap: 1 },
        { amount: 0, color: 'lgreen', cap: 1, softcap: 1 },
        { amount: 0, color: 'red'   , cap: 1, softcap: 1 },
        { amount: 0, color: 'yellow', cap: 1, softcap: 1 },
        { amount: 0, color: 'green' , cap: 1, softcap: 1 },
        { amount: 0, color: 'teal'  , cap: 1, softcap: 1 },
        { amount: 0, color: 'gold'  , cap: 1, softcap: 1 },
        { amount: 0, color: 'orange', cap: 1, softcap: 1 }
    ],
    points: 0,
    upgrades: [],
    playerid: -1,
    __s: {
        setScore: d => {
            d ? (sscore.set(d), deduction > sscore.get() && (deduction = 0, level = 1)) : (levelscore = getCraftrasScoreForLevel(2), deduction = 0, level = 1, sscore = util.AdvancedSmoothBar(0, 2))
        },
        setKills: (solo, assists, bosses) => {
            kills = [solo, assists, bosses];
        },
        update: () => {
            const score = sscore.get();
            while (score >= getCraftrasScoreForLevel(level + 1) && level < 10000) level++;
            while (level > 1 && score < getCraftrasScoreForLevel(level)) level--;
            deduction = getCraftrasScoreForLevel(level);
            levelscore = getCraftrasScoreForLevel(level + 1) - deduction;
        },  
        getProgress: () => levelscore ? Math.min(1, Math.max(0, (sscore.get() - deduction) / levelscore)) : 0,
        getScore: () => sscore.get(),
        getLevel: () => level,
        getKills: () => kills
    },
    type: 0,
    root: "",
    class: "",
    visibleEntities: false,
    dailyTank: {tank: null, ads: false},
    fps: 0,
    color: 0,
    accel: 0,
    topspeed: 1,
};
let xx = 0,
    yy = 0,
    _vx = 0,
    _vy = 0;
var moveCompensation = {
    reset: () => {
        xx = 0;
        yy = 0;
    },
    get: () => {
        if (config.lag.unresponsive) {
            return {
                x: 0,
                y: 0,
            };
        }
        return {
            x: xx,
            y: yy,
        };
    },
    iterate: (g) => {
        if (global.died || global.gameStart) return 0;
        // Add motion
        let damp = gui.accel / gui.topSpeed,
            len = Math.sqrt(g.x * g.x + g.y * g.y);
        _vx += gui.accel * g.x / len;
        _vy += gui.accel * g.y / len;
        // Dampen motion
        let motion = Math.sqrt(_vx * _vx + _vy * _vy);
        if (motion > 0 && damp) {
            let finalvelocity = motion / (damp / config.roomSpeed + 1);
            _vx = finalvelocity * _vx / motion;
            _vy = finalvelocity * _vy / motion;
        }
        xx += _vx;
        yy += _vy;
    },
};
const Integrate = class {
    constructor(dataLength) {
        this.dataLength = dataLength;
        this.elements = {};
    }
    reset() {
        this.elements = {};
    }
    update(delta, index = 0) {
        let deletedLength = delta[index++]
        for (let i = 0; i < deletedLength; i++) delete this.elements[delta[index++]]
        let updatedLength = delta[index++]
        for (let i = 0; i < updatedLength; i++) {
            let id = delta[index++]
            let data = delta.slice(index, index + this.dataLength)
            index += this.dataLength
            this.elements[id] = data
        }
        return index
    }
    entries() {
        return Object.entries(this.elements).map(([id, data]) => ({
            id: +id,
            data
        }))
    }
}
const Minimap = class {
    constructor(speed = 250) {
        this.speed = speed
        this.map = {};
        this.lastUpdate = Date.now();
    }
    update(elements) {
        this.lastUpdate = Date.now()
        for (let [key, value] of Object.entries(this.map))
            if (value.now) {
                value.old = value.now
                value.now = null
            } else {
                delete this.map[key]
            }
        for (let element of elements)
            if (this.map[element.id]) {
                this.map[element.id].now = element
            } else {
                this.map[element.id] = {
                    old: null,
                    now: element
                }
            }
    }
    get() {
        let state = Math.min(1, (Date.now() - this.lastUpdate) / this.speed)
        let stateOld = 1 - state
        return Object.values(this.map).map(({ old, now }) => {
            if (!now) return {
                type: old.type,
                id: old.id,
                x: old.x,
                y: old.y,
                color: old.color,
                size: old.size,
                alpha: stateOld,
                width: old.width,
                height: old.height
            }
            if (!old) return {
                type: now.type,
                id: now.id,
                x: now.x,
                y: now.y,
                color: now.color,
                size: now.size,
                alpha: state,
                width: now.width,
                height: now.height
            }
            return {
                type: now.type,
                id: now.id,
                x: state * now.x + stateOld * old.x,
                y: state * now.y + stateOld * old.y,
                color: now.color,
                size: state * now.size + stateOld * old.size,
                alpha: 1,
                width: state * now.width + stateOld * old.width,
                height: state * now.height + stateOld * old.height
            }
        })
    }
}
// Build the leaderboard object
const Entry = class {
    constructor(to) {
        this.score = util.Smoothbar(0, 10, 3, .03);
        this.isNew = true;
        this.update(to);
    }
    update(to) {
        this.name = to.name;
        this.bar = to.bar;
        if (typeof to.bar === "string" && to.bar.includes(", ")) this.bar = +to.bar.split(", ")[0];
        this.color = to.color;
        this.index = to.index;
        if (this.isNew) {
            this.isNew = false;
            this.score.force(to.score);
        } else this.score.set(to.score);
        this.old = false;
        this.nameColor = to.nameColor;
        this.id = to.id;
        this.label = to.label;
        this.renderEntity = to.renderEntity;
    }
    publish() {
        let indexes = this.index.split("-"),
            ref = global.mockups[parseInt(indexes[0])];
            if (!ref) ref = global.missingno[0];

        return {
            id: this.id,
            color: this.color,
            image: util.requestEntityImage(this.index, this.color),
            position: ref.position,
            barColor: this.bar,
            label: this.name ? this.name + " - " + this.label : this.label,
            score: this.score.get(),
            nameColor: this.nameColor,
            renderEntity: this.renderEntity,
        };
    }
};
const Leaderboard = class {
    constructor() {
        this.entries = {};
    }
    get() {
        let out = [];
        let max = 1;
        for (let value of Object.values(this.entries)) {
            let data = value.publish();
            out.push(data);
            if (data.score > max) max = data.score;
        }
        out.sort((a, b) => b.score - a.score);
        return {
            data: out,
            max
        };
    }
    update(elements) {
        elements.sort((a, b) => b.score - a.score);
        for (let value of Object.values(this.entries)) value.old = true;
        for (let element of elements)
            if (this.entries[element.id]) this.entries[element.id].update(element);
            else this.entries[element.id] = new Entry(element);
        for (let [id, value] of Object.entries(this.entries))
            if (value.old) delete this.entries[id];
    }
};
let minimapAllInt = new Integrate(5),
    minimapTeamInt = new Integrate(3),
    leaderboardInt = new Integrate(8),
    leaderboard = new Leaderboard(),
    minimap = new Minimap(200);
let lags = [];
var lag = {
    get: () => lags.length ? lags.reduce((a, b) => a + b) / lags.length : 0,
    add: l => {
        lags.push(l);
        if (lags.length > config.lag.memory) {
            lags.splice(0, 1);
        }
    }
};
// Inital setup stuff
window.WebSocket = window.WebSocket || window.MozWebSocket;
// Make a data crawler
let crawlIndex = 0,
    crawlData = [];
const get = {
    next: () => {
        if (crawlIndex >= crawlData.length) {
            console.log(crawlData);
            throw new Error('Trying to crawl past the end of the provided data!');
        } else {
            return crawlData[crawlIndex++];
        }
    },
    set: (data) => {
        crawlData = data;
        crawlIndex = 0;
    },
    all: () => crawlData.slice(crawlIndex),
    take: amount => {
        crawlIndex += amount;
        if (crawlIndex > crawlData.length) {
            console.error(crawlData);
            throw new Error("Trying to crawl past the end of the provided data!");
        }
    }
};
function physics(g) {
    g.isUpdated = true;
    if (g.motion || g.position) {
        const targetFrameTime = 33.33;
        const actualFrameTime = global.metrics.rendergap || targetFrameTime;
        const dt = actualFrameTime / targetFrameTime;
        const baseDecay = 0.2;
        g.motion -= (baseDecay * g.position) * dt;
        g.position += g.motion * dt;
        if (g.position < 0) {
            g.position = 0;
            g.motion = -g.motion;
        }
        if (g.motion > 0) {
            g.motion *= Math.pow(0.5, dt);
        }
    }
}
// Some status manager constructors
const GunContainer = n => {
    let a = [];
    for (let i = 0; i < n; i++) {
        a.push({
            motion: 0,
            position: 0,
            isUpdated: true,
            configLoaded: false,
            color: "",
            borderless: false, 
            drawFill: true, 
            drawAbove: false,
            length: 0,
            width: 0,
            aspect: 0,
            angle: 0,
            direction: 0,
            offset: 0,
        });
    }
    return {
        getPositions: () => a.map(g => {
            return g.position;
        }),
        getConfig: () => a.map(g => {
            return {
                color: g.color,
                borderless: g.borderless,
                alpha: g.alpha,
                strokeWidth: g.strokeWidth,
                drawFill: g.drawFill,
                drawAbove: g.drawAbove,
                length: g.length,
                width: g.width,
                aspect: g.aspect,
                angle: g.angle,
                direction: g.direction,
                offset: g.offset,
            };
        }),
        setConfig: (ind, c) => {
            let g = a[ind];
            if (!g.configLoaded) {
                g.configLoaded = true;
                g.color = c.color;
                g.borderless = c.borderless; 
                g.alpha = c.alpha;
                g.strokeWidth = c.strokeWidth;
                g.drawFill = c.drawFill;
                g.drawAbove = c.drawAbove;
                g.length = c.length;
                g.width = c.width;
                g.aspect = c.aspect;
                g.angle = c.angle;
                g.direction = c.direction;
                g.offset = c.offset;
            }
        },
        update: () => {
            for (let instance of a) {
                physics(instance);
            }
        },
        fire: (i, power) => {
            if (a[i].isUpdated) a[i].motion += Math.sqrt(power) / 20;
            a[i].isUpdated = false;
        },
        length: a.length,
    };
};
function Status() {
    let statState = 'normal',
        statTime = getNow();
    return {
        set: val => {
            if (val !== statState || statState === 'injured') {
                if (statState !== 'dying') statTime = getNow();
                statState = val;
            }
        },
        getState: () => statState,
        getFade: () => {
            return (statState === 'dying' || statState === 'killed') ? 1 - Math.min(1, (getNow() - statTime) / 300) : 1;
        },
        getColor: () => {
            return '#FFFFFF';
        },
        getBlend: () => {
            let o = (statState === 'normal' || statState === 'dying') ? 0 : 1 - Math.min(1, (getNow() - statTime) / 80);
            if (getNow() - statTime > 500 && statState === 'injured') {
                statState = 'normal';
            }
            return o;
        }
    };
}
// Make a converter
const process = (z = {}) => {
    let isNew = z.facing == null; // For whatever reason arguments.length is uglified poorly...
    // Figure out what kind of data we're looking at
    let type = get.next();
    // Handle it appropiately
    if (type & 0x01) { // issa turret
        z.facing = get.next();
        z.layer = get.next();
        z.index = get.next();
        z.color = get.next();
        z.size = get.next();
        z.realSize = get.next();
        z.sizeFactor = get.next();
        z.angle = get.next();
        z.direction = get.next();
        z.offset = get.next();
        z.mirrorMasterAngle = get.next();
    } else { // issa something real
        z.interval = global.metrics.rendergap;
        z.id = get.next();
        // Determine if this is an new entity or if we already know about it
        let i = global.entities.findIndex(x => x.id === z.id);
        if (i !== -1) {
            // remove it if needed (this way we'll only be left with the dead/unused entities)
            z = global.entities.splice(i, 1)[0];
        }
        // Change the use of the variable
        isNew = i === -1;
        // If it's not new, save the memory data
        if (!isNew) {
            z.render.lastx = z.x;
            z.render.lasty = z.y;
            z.render.lastvx = z.vx;
            z.render.lastvy = z.vy;
            z.render.lastf = z.facing;
            z.render.lastRender = global.player.time;
        }
        // Either way, keep pulling information
        // For limited entities only by only pulling their limited information.
        if (type & 0x10) {
            z.index = get.next();
            z.x = get.next();
            z.y = get.next();
            z.vx = get.next();
            z.vy = get.next();
            z.size = get.next();
            let oldFacing = z.facing;
            z.facing = get.next();
            z.vfacing = isNew ? z.facing : z.facing - oldFacing;
            z.vfacing = get.next();
            z.layer = get.next();
            z.color = get.next();
        } else { // Else pull all information.
            z.index = get.next();
            z.x = get.next();
            z.y = get.next();
            z.vx = get.next();
            z.vy = get.next();
            z.size = get.next();
            let oldFacing = z.facing;
            z.facing = get.next();
            z.vfacing = isNew ? z.facing : z.facing - oldFacing;
            z.vfacing = get.next();
            z.twiggle = get.next();
            z.layer = get.next();
            z.color = get.next();
            z.borderless = get.next();
            z.drawFill = get.next();
        }
        let invuln = type & 0x10 ? 0 : get.next();
        z.invuln = invuln ? z.invuln || Date.now() : 0;
        // Update health, flagging as injured if needed
        if (isNew) {
            z.health = get.next() / 65535;
            z.shield = get.next() / 65535;
        } else {
            let hh = z.health,
                ss = z.shield;
            z.health = get.next() / 65535;
            z.shield = get.next() / 65535;
            // Update stuff
            if (z.health < hh || z.shield < ss) {
                z.render.status.set('injured');
            } else if (z.render.status.getFade() !== 1) {
                // If it turns out that we thought it was dead and it wasn't
                z.render.status.set('normal');
            }
        }
        z.alpha = get.next() / 255;
        z.drawsHealth = !!(type & 0x02); // force to boolean
        // Nameplates
        if (type & 0x04) { // has a nameplate
            z.name = get.next();
            z.score = get.next();
        }
        z.nameplate = type & 0x04;
        // If it's new, give it rendering information
        if (isNew) {
            z.render = {
                draws: true,
                expandsWithDeath: z.drawsHealth,
                lastRender: global.player.time,
                x: z.x,
                y: z.y,
                lastx: z.x - global.metrics.rendergap * config.roomSpeed * (1000 / 40) * z.vx,
                lasty: z.y - global.metrics.rendergap * config.roomSpeed * (1000 / 40) * z.vy,
                lastvx: z.vx,
                lastvy: z.vy,
                lastf: z.facing,
                f: z.facing,
                h: z.health,
                s: z.shield,
                interval: global.metrics.rendergap,
                slip: 0,
                status: Status(),
                size: new util.animBar(),
                health: util.AdvancedSmoothBar(z.health, 0.06, 1),
                shield: util.AdvancedSmoothBar(z.shield, 0.06, 1),
                xAnim: new util.animBar(),
                yAnim: new util.animBar(),
                faceAnim: new util.animBar(!0),
            };
        }
        if (invuln) {
            z.render.status.set('invuln');
        } else if (z.render.status.getState() === 'invuln') {
            z.render.status.set('normal');
        }
        // Update the rendering healthbars and size
        z.render.health.set(z.health);
        z.render.shield.set(z.shield);
        z.render.size.add(z.size);
        z.render.xAnim.add(z.x);
        z.render.yAnim.add(z.y);
        z.render.faceAnim.add(z.facing);
        // Figure out if the class changed (and if so, refresh the guns and turrets)
        if (!isNew && z.oldIndex !== z.index) isNew = true;
        z.oldIndex = z.index;
    }
    // If it needs to have a gun container made, make one
    let gunnumb = get.next();
    if (isNew) {
        z.guns = GunContainer(gunnumb);
    } else if (gunnumb !== z.guns.length) {
        throw new Error('Mismatch between data gun number and remembered gun number!');
    }
    // Decide if guns need to be fired one by one
    for (let i = 0; i < gunnumb; i++) {
        let time = get.next(),
            power = get.next(),
            color = get.next(),
            alpha = get.next(),
            strokeWidth = get.next(),
            borderless = get.next(),
            drawFill = get.next(),
            drawAbove = get.next(),
            length = get.next(),
            width = get.next(),
            aspect = get.next(),
            angle = get.next(),
            direction = get.next(),
            offset = get.next();
        z.guns.setConfig(i, {color, alpha, strokeWidth, borderless, drawFill, drawAbove, length, width, aspect, angle, direction, offset}); // Load gun config into container
        if (time > global.player.lastUpdate - global.metrics.rendergap) z.guns.fire(i, power); // Shoot it
    }
    // Update turrets
    let turnumb = get.next();
    if (isNew || z.turrets.length !== turnumb) {
        z.turrets = [];
        for (let i = 0; i < turnumb; i++) {
            z.turrets.push(process());
        }
    } else {
        if (z.turrets.length !== turnumb) {
            throw new Error('Mismatch between data turret number and remembered turret number!');
        }
        for (let tur of z.turrets) {
            tur = process(tur);
        }
    }
    // Return our monsterous creation
    return z;
};
// This is what we use to figure out what the hell the server is telling us to look at
const convert = {
    begin: data => get.set(data),
    // Make a data convertor
    data: () => {
        // Set up the output thingy+
        let output = [];
        // Get the number of entities and work through them
        for (let i = 0, len = get.next(); i < len; i++) {
            output.push(process());
        }
        // Handle the dead/leftover entities
        for (let e of global.entities) {
            // Kill them
            e.render.status.set(e.health === 1 ? 'dying' : 'killed');
            // And only push them if they're not entirely dead and still visible
            if (e.render.status.getFade() !== 0 && util.isInView(e.render.x - global.player.renderx, e.render.y - global.player.rendery, e.size, true)) {
                output.push(e);
            } else {
                if (global.chats[e.id]) {
                    for (let o of global.chats[e.id]) {
                        util.remove(global.chats[e.id], global.chats[e.id].indexOf(o)); // Remove it properly
                    };
                    delete global.chats[e.id]; // Now we can delete it entirely
                };
                if (e.render.textobjs != null) {
                    for (let o of e.render.textobjs) {
                        o.remove();
                    }
                }
            }
        }
        // Save the new entities list
        global.entities = output;
        global.entities.sort((a, b) => {
            let sort = a.layer - b.layer;
            if (!sort) sort = b.id - a.id;
            if (!sort) throw new Error('tha fuq is up now');
            return sort;
        });
    },
    // Define our gui convertor
    gui: () => {
        let index = get.next(),
            // Translate the encoded index
            indices = {
                dailyTank: index & 0x1000,
                visibleName: index & 0x0800,
                class: index & 0x0400,
                root: index & 0x0200,
                topspeed: index & 0x0100,
                accel: index & 0x0080,
                skills: index & 0x0040,
                statsdata: index & 0x0020,
                upgrades: index & 0x0010,
                points: index & 0x0008,
                score: index & 0x0004,
                label: index & 0x0002,
                fps: index & 0x0001,
            };
        // Operate only on the values provided
        if (indices.fps) {
            gui.fps = get.next();
        }
        if (indices.label) {
            gui.type = get.next();
            gui.color = get.next();
            gui.playerid = get.next();
        }
        if (indices.score) {
            let score = JSON.parse(get.next());
            gui.__s.setScore(score[0]);
            gui.__s.setKills(score[1], score[2], score[3]);
        }
        if (indices.points) {
            gui.points = get.next();
        }
        if (indices.upgrades) {
            gui.upgrades = [];
            for (let i = 0, len = get.next(); i < len; i++) {
                gui.upgrades.push(get.next().split("_"));
                gui.upgrades[i][2] = util.requestEntityImage(gui.upgrades[i][2], gui.color);
            }
        }
        if (indices.statsdata) {
            for (let i = 9; i >= 0; i--) {
                gui.skills[i].name = get.next();
                gui.skills[i].cap = get.next();
                gui.skills[i].softcap = get.next();
            }
        }
        if (indices.skills) {
            let skk = get.next();
            gui.skills[0].amount = parseInt(skk.slice( 0,  2), 16);
            gui.skills[1].amount = parseInt(skk.slice( 2,  4), 16);
            gui.skills[2].amount = parseInt(skk.slice( 4,  6), 16);
            gui.skills[3].amount = parseInt(skk.slice( 6,  8), 16);
            gui.skills[4].amount = parseInt(skk.slice( 8, 10), 16);
            gui.skills[5].amount = parseInt(skk.slice(10, 12), 16);
            gui.skills[6].amount = parseInt(skk.slice(12, 14), 16);
            gui.skills[7].amount = parseInt(skk.slice(14, 16), 16);
            gui.skills[8].amount = parseInt(skk.slice(16, 18), 16);
            gui.skills[9].amount = parseInt(skk.slice(18, 20), 16);
        }
        if (indices.accel) {
            gui.accel = get.next();
        }
        if (indices.topspeed) {
            gui.topspeed = get.next();
        }
        if (indices.root) {
            gui.root = get.next();
        }
        if (indices.class) {
            gui.class = get.next();
        }
        if (indices.visibleName) {
            gui.visibleEntities = get.next();
        }
        if (indices.dailyTank) {
            let dailyTank = JSON.parse(get.next());
            if (!dailyTank[0]) gui.dailyTank = {tank: null, ads: false};
            else {
                gui.dailyTank.tank = dailyTank[0];
                gui.dailyTank.ads = dailyTank[1];
            }
        }
    },
    broadcast: () => {
        let all = get.all();
        let by = minimapAllInt.update(all);
        by = minimapTeamInt.update(all, by);
        by = leaderboardInt.update(all, by);
        get.take(by);
        let map = [];
        for (let {
            id,
            data
        } of minimapAllInt.entries()) {
            map.push({
                id,
                type: data[0],
                x: (data[1] * global.gameWidth) / 255,
                y: (data[2] * global.gameHeight) / 255,
                color: data[3],
                size: data[4]
            });
        }
        for (let {
            id,
            data
        } of minimapTeamInt.entries()) {
            map.push({
                id,
                type: 0,
                x: (data[0] * global.gameWidth) / 255,
                y: (data[1] * global.gameHeight) / 255,
                color: data[2],
                size: 0
            });
        }
        minimap.update(map);
        let entries = [];
        for (let {
            id,
            data
        } of leaderboardInt.entries()) {
            entries.push({
                id,
                score: data[0],
                index: data[1],
                name: data[2],
                color: data[3],
                bar: data[4],
                nameColor: data[5],
                label: data[6],
                renderEntity: data[7],
            })
        }
        leaderboard.update(entries);
    }
};

const protocols = {
    "http:": "ws://",
    "https:": "wss://"
};
const localServerPattern = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::(\d+))?$/;
const craftrasLocalServerIdsByPort = Object.freeze({
    "3000": "server1",
    "3001": "village",
    "3002": "steel-torch",
    "3003": "broken-kingdom",
    "3004": "cave-builder",
    "3005": "intact-kingdom",
    "3006": "world1-challenge",
    "3007": "world2-village",
    "3008": "world2-challenge",
});
const normalizeServerAddress = serverAdd => {
    if (!serverAdd) return location.host || "localhost:3000";
    serverAdd = String(serverAdd).replace(/^wss?:\/\//, "");
    if (serverAdd.startsWith("/")) return `${location.host || "localhost:3000"}${serverAdd}`;
    const match = localServerPattern.exec(serverAdd || "");
    if (!match) return serverAdd;
    const advertisedPort = match[1];
    const serverId = craftrasLocalServerIdsByPort[advertisedPort || location.port || "3000"];
    if (!advertisedPort || serverId === "server1" || advertisedPort === location.port) return location.host;
    if (serverId) return `${location.host}/server/${serverId}`;
    return `${location.hostname}:${advertisedPort}`;
};
const getCraftrasLocalServerId = serverAdd => {
    const normalized = String(serverAdd || "").replace(/^https?:\/\//, "").replace(/^wss?:\/\//, "");
    const proxied = /\/server\/([a-z0-9-]+)$/i.exec(normalized);
    if (proxied) return proxied[1];
    const match = localServerPattern.exec(normalized);
    if (!match) return "";
    return craftrasLocalServerIdsByPort[match[1] || location.port || "3000"] || "";
};
const buildCraftrasChunkEntries = cells => {
    const chunkSize = global.craftrasWorld.chunkSize;
    const entries = [];
    for (let index = 0; index < cells.length; index++) {
        const code = cells[index];
        if ((code & 31) === 0) continue;
        entries.push({
            localX: index % chunkSize,
            localY: Math.floor(index / chunkSize),
            code,
        });
    }
    return entries;
};
const rebuildCraftrasChunkEntries = (entryMap, key, cells) => {
    if (!entryMap || !cells) return;
    entryMap.set(key, buildCraftrasChunkEntries(cells));
    if (entryMap !== global.craftrasWorld?.chunkEntries) return;
    global.craftrasWorld.torchChunkEntries ??= new Map();
    const torchEntries = [];
    const chunkSize = global.craftrasWorld.chunkSize;
    for (let index = 0; index < cells.length; index++) {
        const code = cells[index];
        const blockCode = code & 31;
        if (blockCode !== 20 && blockCode !== 21) continue;
        torchEntries.push({
            localX: index % chunkSize,
            localY: Math.floor(index / chunkSize),
            code,
        });
    }
    if (torchEntries.length) global.craftrasWorld.torchChunkEntries.set(key, torchEntries);
    else global.craftrasWorld.torchChunkEntries.delete(key);
};
let incoming = async function(message, socket) {
    if (window.fakeLagMS > 0) {
        await new Promise(resolve => setTimeout(resolve, window.fakeLagMS));
    }
    // Make sure it looks legit.
    global.bandwidth.currentFa += message.data.byteLength;
    let m = protocol.decode(message.data);
    if (m === -1) {
        throw new Error('Malformed packet.');
    }
    // Decide how to interpret it
    switch (m.shift()) {
        case 'W': {
            if (m[0]) {
                global.message = '';
                socket.talk('k', global.playerKey);
                // define a pinging function
                socket.ping = (payload) => {
                    socket.talk('p', payload);
                };
                socket.commandCycle = setInterval(() => {
                    if (socket.cmd.check()) socket.cmd.talk();
                });
            }
        }; break;


            case 'w': { // welcome to the game
                if (m[0]) { // Ask to get the room data first
                    socket.talk('s', "", 1, 0, false, 0);
                }
            }; break;
            case 'R': { // room setup
                global.craftrasWorld.active = false;
                global.craftrasWorld.chunks.clear();
                global.gameWidth = m[0];
                global.gameHeight = m[1];
                global.player.roomAnim.x.add(m[0]);
                global.player.roomAnim.y.add(m[1]);
                global.roomSetup = JSON.parse(m[2]);
                serverStart = JSON.parse(m[3]);
                global.serverStart = serverStart;
                config.roomSpeed = m[4];
                let blackoutData = JSON.parse(m[5]);
                global.advanced.blackout.active = blackoutData.active;
                global.advanced.blackout.color = blackoutData.color;
                global.advanced.roundMap = m[6] == "circle" ? true : false;
                // Start syncing
                socket.talk('S', getNow());
            } break;
            case "r": {
                global.gameWidth = m[0];
                global.gameHeight = m[1];
                global.player.roomAnim.x.add(m[0]);
                global.player.roomAnim.y.add(m[1]);
                global.roomSetup = JSON.parse(m[2]);
            } break;
            case "temporaryban": {
                global.message = "You have been temporarily banned from the game. You will be able to rejoin after a server restart.";
            } break;
            case "permanentban": {
                global.message = "You have been banned from the game.";
            } break;
            case "svInfo": {
                // For debugging.
                global.serverStats.serverGamemodeName = m[0];
                if (/craftras/i.test(m[0] || "")) global.craftrasHotbar.active = true;
                global.serverStats.mspt = m[1];
                if (global.showDebug) console.log(`mspt: ${global.serverStats.mspt} total entities on screen: ${global.entities.length} Player X: ${(global.player.renderx).toFixed(1)} Player Y: ${(global.player.rendery).toFixed(1)}`);
            } break;
            case "gSvInfo": {
                global.serverStats.players = m[1];
            } break;
            case 'c': { // force camera move
                global.player.renderx = global.player.cx.x = m[0];
                global.player.rendery = global.player.cy.y = m[1];
                global.player.renderv = global.player.view = m[2];
                global.player.animX.add(m[0]);
                global.player.animY.add(m[1]);
            } break;
            case 'S': { // clock syncing
                let clientTime = m[0],
                    serverTime = m[1],
                    laten = (getNow() - clientTime) / 2,
                    delta = getNow() - laten - serverTime;
                // Add the datapoint to the syncing data
                sync.push({
                    delta: delta,
                    latency: laten,
                });
                // Do it again a couple times
                if (sync.length < 10) {
                    // Erase entities if resync is needed.
                    if (startSettings.neededtoresync) global.entities = [];
                    // Wait a bit just to space things out
                    setTimeout(() => socket.talk('S', getNow()), 10);
                } else {
                    // Calculate the clock error
                    sync.sort((e, f) => e.latency - f.latency);
                    let median = sync[Math.floor(sync.length / 2)].latency;
                    let sd = 0,
                        sum = 0,
                        valid = 0;
                    for (let e of sync) {
                        sd += Math.pow(e.latency - median, 2);
                    }
                    sd = Math.sqrt(sd / sync.length);
                    for (let e of sync) {
                        if (Math.abs(e.latency - median) < sd) {
                            sum += e.delta;
                            valid++;
                        }
                    }
                    clockDiff = Math.round(sum / valid);
                    if (startSettings.neededtoresync) {
                        startSettings.neededtoresync = false;
                        startSettings.allowtostartgame = true;
                        global.pullSkillBar = false;
                        global.pullUpgradeMenu = false;
                        socket.talk("NWB"); // Ask for new broadcast.
                    }
                    global.metrics.rendertimes = 1;
                    util.pullTotalPlayers();
                    global.gameUpdate = true;
                    // Now we can ask for spawn.
                    sendCraftrasInventorySaveToServer(socket);
                    sendCraftrasAdminSessionToServer(socket);
                    socket.talk('s', global.playerName, 0, 1 * config.game.autoLevelUp, global.bodyID ? global.bodyID : false, 1 * config.game.incognitoMode);
                    global.bodyID = undefined;
                }
            } break;
        case 'm': { // message
            global.createMessage(m[1], m[0]);
        } break;
        case "BM": { // Craftras boss message
            global.createMessage(m[1], m[0], false, 2, m[2] || null, m[3] || null);
        } break;
        case "CBH": { // Craftras boss health bar
            if (!m[0]) {
                global.craftrasBossHealth.active = false;
                global.craftrasBossHealth.expiresAt = 0;
                break;
            }
            const previousId = global.craftrasBossHealth.id;
            const amount = Math.max(0, Number(m[3]) || 0);
            const max = Math.max(1, Number(m[4]) || 1);
            global.craftrasBossHealth = {
                active: true,
                id: Number(m[1]) || 0,
                name: String(m[2] || "Boss"),
                amount,
                max,
                displayAmount: previousId === (Number(m[1]) || 0)
                    ? Math.max(0, Number(global.craftrasBossHealth.displayAmount) || amount)
                    : amount,
                expiresAt: Date.now() + Math.max(0, Number(m[5]) || 0),
            };
        } break;
        case "SDH": { // Sword Guy 2 duo health bars
            if (!m[0]) {
                global.craftrasSwordGuy2DuoHealth = { active: false, expiresAt: 0, bosses: [] };
                break;
            }
            const previous = global.craftrasSwordGuy2DuoHealth?.bosses || [];
            const bosses = [0, 1].map(index => {
                const offset = 1 + index * 4;
                const id = Number(m[offset]) || 0;
                const amount = Math.max(0, Number(m[offset + 2]) || 0);
                const max = Math.max(1, Number(m[offset + 3]) || 1);
                const old = previous.find(entry => entry.id === id);
                return {
                    id,
                    name: String(m[offset + 1] || "Boss"),
                    amount,
                    max,
                    displayAmount: old ? old.displayAmount : amount,
                };
            });
            global.craftrasSwordGuy2DuoHealth = {
                active: true,
                bosses,
                expiresAt: Date.now() + Math.max(0, Number(m[9]) || 0),
            };
        } break;
        case "BIF": { // Bominik entrance Inferno
            global.craftrasBominikInferno = {
                active: true,
                startedAt: Date.now(),
                holdDuration: Math.max(0, Number(m[0]) || 350),
                fadeDuration: Math.max(100, Number(m[1]) || 1_250),
            };
        } break;
        case "JSC": { // Jane phase-two screen cut
            global.craftrasJaneScreenCut = {
                active: true,
                startedAt: Date.now(),
                duration: Math.max(300, Number(m[0]) || 3_000),
                warningDuration: Math.max(100, Number(m[1]) || 200),
                parryWindow: Math.max(100, Number(m[2]) || 200),
                maxShift: Math.max(20, Number(m[3]) || 72),
            };
        } break;
        case "SCT": { // Instant screen-cut test effect
            global.craftrasJaneScreenCut = {
                active: true,
                instant: true,
                colorMode: "white",
                startedAt: Date.now(),
                duration: Math.max(300, Number(m[0]) || 2_000),
                warningDuration: 0,
                parryWindow: 0,
                maxShift: Math.max(20, Number(m[1]) || 92),
                cutAngle: Number(m[2]) || 0,
            };
        } break;
        case "CSC": { // Custom weapon combo finisher screen cut (visual only)
            global.craftrasJaneScreenCut = {
                active: true,
                instant: true,
                colorMode: "pink",
                startedAt: Date.now(),
                duration: Math.max(300, Number(m[0]) || 720),
                warningDuration: 0,
                parryWindow: 0,
                maxShift: Math.max(20, Number(m[1]) || 58),
                cutAngle: Number(m[2]) || 0,
            };
        } break;
        case "J2S": { // Jane phase-two rotating prison screen split
            global.craftrasJanePhaseTwoSkillTwoScreen = {
                active: true,
                startedAt: Date.now(),
                duration: Math.max(1_000, Number(m[0]) || 18_000),
                maxShift: Math.max(16, Number(m[1]) || 54),
            };
        } break;
        case "CD": { // Craftras curse darkness
            const duration = Math.max(0, Number(m[0]) || 0);
            global.craftrasWorld.curseDarknessUntil = Math.max(global.craftrasWorld.curseDarknessUntil || 0, Date.now() + duration);
        } break;
        case "CIV": {
            global.craftrasChallengeInventoryTemporary = !!m[0];
            if (global.craftrasChallengeInventoryTemporary) {
                global.craftrasInventory.open = false;
                global.craftrasInventory.drag = null;
            }
        } break;
        case "CTI": {
            const active = !!m[0];
            global.craftrasTeamInvite = active ? {
                active: true,
                inviter: String(m[1] || "Player"),
                expiresAt: Date.now() + Math.max(0, Number(m[2]) || 0),
                kind: m[3] === "join" ? "join" : "invite",
            } : { active: false, inviter: "", kind: "invite", expiresAt: 0 };
            if (!active) global.clickables?.teamInvite?.hide?.();
        } break;
        case "CTH": {
            const count = Math.max(0, Math.trunc(Number(m[0]) || 0));
            const labels = new Map();
            for (let i = 0; i < count; i++) {
                const id = Number(m[1 + i * 2]);
                const label = String(m[2 + i * 2] || "");
                if (Number.isFinite(id) && label) labels.set(id, label);
            }
            global.craftrasTeamHostLabels = labels;
        } break;
        case "CSG": {
            const open = !!m[0];
            global.craftrasChallengeEntry = open ? {
                open: true,
                teamName: String(m[1] || ""),
                memberCount: Math.max(1, Math.trunc(Number(m[2]) || 1)),
                isHost: !!m[3],
                kind: m[4] === "world2" ? "world2" : "world1",
            } : { open: false, teamName: "", memberCount: 1, isHost: true, kind: "world1" };
            if (!open) global.clickables?.challengeEntry?.hide?.();
        } break;
        case "CTR": {
            const transition = global.craftrasServerTransition;
            if (!transition) break;
            const duration = Math.max(300, Math.trunc(Number(m[1]) || 2400));
            if (m[0]) {
                transition.active = true;
                transition.phase = "out";
                transition.startedAt = Date.now();
                transition.duration = duration;
                transition.alpha = 0;
            } else if (transition.active) {
                transition.phase = "in";
                transition.startedAt = Date.now();
                transition.duration = duration;
                transition.alpha = Math.max(transition.alpha || 0, 1);
            }
        } break;
        case "CSE": {
            const effect = global.craftrasChallengeStoryEffect;
            if (!effect) break;
            effect.active = true;
            effect.startedAt = Date.now();
            effect.whiteoutDuration = Math.max(800, Math.trunc(Number(m[0]) || 3000));
            effect.fogDuration = Math.max(effect.whiteoutDuration, Math.trunc(Number(m[1]) || 8000));
        } break;
        case "CBP": {
            const effect = global.craftrasChallengeBlueParry;
            if (!effect) break;
            effect.active = true;
            effect.startedAt = Date.now();
            effect.numberDuration = Math.max(200, Math.trunc(Number(m[0]) || 500));
            effect.bangDuration = Math.max(100, Math.trunc(Number(m[1]) || 200));
            effect.flashDuration = Math.max(500, Math.trunc(Number(m[2]) || 2000));
        } break;
        case "SGP": {
            const effect = global.craftrasSwordGuy2Parry ??= {};
            effect.active = true;
            effect.startedAt = Date.now();
            effect.stepDuration = Math.max(100, Math.trunc(Number(m[0]) || 500));
            effect.nowDuration = Math.max(100, Math.trunc(Number(m[1]) || 200));
            effect.flashDuration = Math.max(200, Math.trunc(Number(m[2]) || 500));
        } break;
        case "MZW": {
            const effect = global.craftrasWorld2MagicWarning ??= {};
            effect.active = true;
            effect.startedAt = Date.now();
            effect.stepDuration = Math.max(100, Math.trunc(Number(m[0]) || 500));
            effect.flashDuration = Math.max(200, Math.trunc(Number(m[1]) || 500));
        } break;
        case "SGO": {
            const effect = global.craftrasSwordGuy2Opening ??= {};
            effect.active = true;
            effect.startedAt = Date.now();
            effect.chargeDuration = Math.max(1500, Math.trunc(Number(m[0]) || 3000));
            effect.stepDuration = Math.max(200, Math.trunc(Number(m[1]) || 500));
            effect.nowDuration = Math.max(100, Math.trunc(Number(m[2]) || 200));
        } break;
        case "SG3": {
            const effect = global.craftrasSwordGuy2DashCountdown ??= {};
            effect.active = true;
            effect.startedAt = Date.now();
            effect.stepDuration = Math.max(100, Math.trunc(Number(m[0]) || 500));
            effect.bangDuration = Math.max(100, Math.trunc(Number(m[1]) || 200));
        } break;
        case "JPF": {
            const effect = global.craftrasJanePinkFlash ??= {};
            effect.active = true;
            effect.startedAt = Date.now();
            effect.duration = Math.max(120, Math.trunc(Number(m[0]) || 420));
            effect.alpha = Math.max(0.05, Math.min(0.5, Number(m[1]) || 0.24));
        } break;
        case "J4C": {
            const effect = global.craftrasJaneSkillFourCountdown ??= {};
            effect.active = true;
            effect.startedAt = Date.now();
            effect.stepDuration = Math.max(100, Math.trunc(Number(m[0]) || 500));
            effect.impactDuration = Math.max(100, Math.trunc(Number(m[1]) || 200));
        } break;
        case "LZR": {
            const beams = global.craftrasLaserBeams ??= new Map();
            const id = Number(m[0]);
            beams.set(id, {
                id,
                x: Number(m[1]) || 0,
                y: Number(m[2]) || 0,
                angle: Number(m[3]) || 0,
                length: Math.max(1, Number(m[4]) || 2400),
                width: Math.max(1, Number(m[5]) || 450),
                duration: Math.max(1, Number(m[6]) || 700),
                activeDelay: Math.max(0, Number(m[7]) || 0),
                angularVelocity: Number(m[8]) || 0,
                fadeOutStart: Math.max(0, Math.min(0.99, Number(m[9]) || 0.72)),
                colorMode: String(m[10] || "pink"),
                alphaScale: Math.max(0.02, Math.min(1, Number(m[11]) || 1)),
                visualVariant: String(m[12] || "default"),
                startedAt: Date.now(),
                stoppingAt: 0,
                stopDuration: 0,
            });
        } break;
        case "LZU": {
            const beam = global.craftrasLaserBeams?.get(Number(m[0]));
            if (!beam) break;
            beam.trackedFromAngle = Number.isFinite(beam.renderAngle)
                ? beam.renderAngle
                : Number(beam.angle) || 0;
            beam.trackedTargetAngle = Number(m[1]) || 0;
            beam.trackedUpdatedAt = Date.now();
            if (Number.isFinite(Number(m[2]))) beam.x = Number(m[2]);
            if (Number.isFinite(Number(m[3]))) beam.y = Number(m[3]);
        } break;
        case "LZS": {
            const beam = global.craftrasLaserBeams?.get(Number(m[0]));
            if (!beam) break;
            beam.stoppingAt = Date.now();
            beam.stopDuration = Math.max(1, Number(m[1]) || 140);
        } break;
        case "BLG": {
            global.craftrasBlueLaser = {
                gauge: Math.max(0, Math.min(100, Number(m[0]) || 0)),
                overheatedUntil: Date.now() + Math.max(0, Number(m[1]) || 0),
                equipped: !!m[2],
                firing: !!m[3],
            };
        } break;
        case "Em": {
            global.createMessage(m[1], m[0], true);
        } break;
        case 'RE': {
            global.mockups = [];
            global.entities = [];
        } break;
        case 'CC': {
            global.cached = {};
        } break;
        case 'M': {
            if (!m[1]) return;
            global.mockups[m[0]] = JSON.parse(m[1]);
        } break;
        case 'u': { // uplink
            // Pull the camera info
            if (m[0] == true) { // Update camera only if we want to.
                let camx = m[1],
                    camy = m[2];
                global.player.cx.x = camx;
                global.player.cy.y = camy;
                global.player.loc = { x: camx, y: camy };
                global.player.animX.add(m[1]);
                global.player.animY.add(m[2]);
                return;
            }
            let camtime = m[0],
                camx = m[1],
                camy = m[2],
                camfov = m[3],
                camvx = m[4],
                camvy = m[5],
                camscoping = m[6],
                // We'll have to do protocol decoding on the remaining data
                theshit = m.slice(7);
                // More stuff
                let defaultFov = 2000;
            if (!global.gameStart && startSettings.allowtostartgame) {
                // Start the game
                global.gameStart = true;
                global.gameConnecting = false;
                const transition = global.craftrasServerTransition;
                if (transition?.active && transition.phase === "hold") {
                    transition.phase = "in";
                    transition.startedAt = Date.now();
                    transition.duration = 2400;
                    transition.alpha = 1;
                }
            };
            // Process the data
            if (camtime > global.player.lastUpdate) { // Don't accept out-of-date information.
                if (startSettings.neededtoresync) return; // Do not update anything when the client is out of sync.
                // Time shenanigans
                lag.add(getNow() - camtime);
                global.player.time = camtime + lag.get();
                global.metrics.rendergap = camtime - global.player.lastUpdate;
                if (global.metrics.rendergap <= 0) {
                    console.log('yo some bullshit is up wtf');
                }
                global.player.lastUpdate = camtime;
                // Convert the gui and entities
                convert.begin(theshit);
                convert.gui();
                convert.data();
                // Save old physics values
                global.player.lastx = global.player.cx.x;
                global.player.lasty = global.player.cy.y;
                global.player.lastvx = global.player.vx;
                global.player.lastvy = global.player.vy;
                global.player.cx.x = camx;
                global.player.cy.y = camy;
                global.player.loc = { x: camx, y: camy };
                global.player.vx = global.died ? 0 : camvx;
                global.player.vy = global.died ? 0 : camvy;
                // For centered camera
                global.player.isScoping = camscoping;
                moveCompensation.reset();
                // Animation stuff
                global.player.animX.add(m[1]);
                global.player.animY.add(m[2]);
                // Fov stuff
                global.player.view = camfov;
                global.player.animv.add(global.player.view);
                if (isNaN(global.player.renderv) || global.player.renderv === 0) {
                    global.player.renderv = defaultFov;
                }
                // Metrics
                global.metrics.lastlag = global.metrics.lag;
                global.metrics.lastuplink = getNow();
            } else {
                console.log("Old data! Last given time: " + global.player.time + "; offered packet timestamp: " + camtime + ".");
            }
            // Send the downlink and the target
            socket.talk('d', Math.max(global.player.lastUpdate, camtime));
            socket.cmd.talk();
            global.updateTimes++; // metrics
        } break;
        case "CR": {
            const active = !!m[0];
            const wasChallengeMode = !!global.craftrasWorld.challengeMode;
            global.craftrasWorld.active = active;
            global.craftrasWorld.challengeMode = active && !!m[5];
            global.craftrasWorld.world2ChallengeMode = active && !!m[9];
            if (global.craftrasWorld.challengeMode) {
                if (!wasChallengeMode) global.craftrasWorld.challengeStoryEightReached = false;
                global.craftrasWorld.weatherRainAlpha = 1;
                global.craftrasWorld.weatherStormAlpha = 1;
                global.craftrasWorld.weatherSurfaceAlpha = 1;
                global.craftrasWorld.weatherVisualAlpha = 1;
                global.craftrasWorld.weatherStormVisualAlpha = 1;
                global.craftrasWorld.kingdomFogPresenceAlpha = 1;
            } else if (!active || wasChallengeMode) {
                global.craftrasWorld.challengeStoryEightReached = false;
                global.craftrasWorld.weatherRainAlpha = 0;
                global.craftrasWorld.weatherStormAlpha = 0;
                global.craftrasWorld.weatherSurfaceAlpha = 0;
                global.craftrasWorld.weatherVisualAlpha = 0;
                global.craftrasWorld.weatherStormVisualAlpha = 0;
                global.craftrasWorld.kingdomFogPresenceAlpha = 0;
                global.craftrasWorld.whiteInfernoAlpha = 0;
            }
            global.craftrasHotbar.active = active;
            global.craftrasInventory.active = active;
            if (!active) {
                global.craftrasWorld.curseDarknessUntil = 0;
                global.craftrasWorld.curseDarknessAlpha = 0;
                if (global.craftrasWorldEdit) global.craftrasWorldEdit.active = false;
                global.craftrasRouteMarkers = [];
                global.craftrasTextStoryMarkers = new Map();
                global.craftrasCreative.active = false;
                global.craftrasCreative.items = [];
                global.craftrasInventory.open = false;
                global.craftrasInventory.drag = null;
                global.craftrasInventory.cursor = null;
                global.craftrasInventory.helmet = null;
                global.craftrasInventory.offhand = null;
                global.craftrasInventory.rightDrag = null;
                global.craftrasCrafting.mode = 0;
                global.craftrasCrafting.slots = Array(9).fill(null);
                global.craftrasCrafting.output = null;
                global.craftrasBlacksmith = { open: false, slot: null, offer: null, playerLevel: 0 };
                global.craftrasCleric = { open: false, mode: "token", rebirths: 0, playerLevel: 0, levelCap: 100, canRebirth: false, nextLevelCap: 0, healthBonus: 0, requirements: [], slots: Array(4).fill(null), canToken: false };
                global.craftrasMerchant = { open: false, points: 0, refreshIn: 0, refreshReceivedAt: Date.now(), offers: [], sellSlot: null };
                global.craftrasBlesser = { open: false, points: 0, offers: [] };
                global.craftrasUnlockedRecipes = [];
                global.craftrasFurnace = { open: false, key: null, slots: [null, null, null], progress: 0 };
                global.craftrasChest = { open: false, key: null, slots: Array(27).fill(null) };
            }
            global.craftrasWorld.chunks.clear();
            global.craftrasWorld.chunkEntries ??= new Map();
            global.craftrasWorld.chunkEntries.clear();
            global.craftrasWorld.floorChunks ??= new Map();
            global.craftrasWorld.floorChunks.clear();
            global.craftrasWorld.floorChunkEntries ??= new Map();
            global.craftrasWorld.floorChunkEntries.clear();
            global.craftrasWorld.hitEffects ??= new Map();
            global.craftrasWorld.hitEffects.clear();
            global.craftrasWorld.blockUpdateVersions ??= new Map();
            global.craftrasWorld.blockUpdateVersions.clear();
            global.craftrasWorld.cavePrewarmSeenChunks?.clear?.();
            global.craftrasWorld.cavePrewarmQueue = [];
            global.craftrasWorld.cavePrewarmCursor = 0;
            global.craftrasWorld.caveNextPrewarmAt = performance.now() + 250;
            global.craftrasWorld.cavePrewarmChunksDirty = true;
            if (active) {
                global.craftrasWorld.worldSize = m[1];
                global.craftrasWorld.regionSize = m[1];
                global.craftrasWorld.blockSize = m[2];
                global.craftrasWorld.wallSize = m[3];
                global.craftrasWorld.chunkSize = m[4];
                global.craftrasWorld.world2Enabled = !!m[6];
                global.craftrasWorld.world2MinX = Number(m[7]) || m[1] / 2;
                global.craftrasWorld.world2CenterX = Number(m[8]) || m[1];
                global.craftrasWorld.displayRegion = 0;
                global.craftrasWorld.pendingRegion = 0;
            }
        } break;
        case "HB": {
            global.craftrasHotbar.active = true;
            global.craftrasHotbar.selected = Math.max(0, Math.min(9, Number(m[0]) || 0));
            try {
                const slots = JSON.parse(m[1]);
                global.craftrasHotbar.slots = Array.isArray(slots)
                    ? Array.from({ length: 10 }, (_, index) => slots[index] ?? null)
                    : Array(10).fill(null);
            } catch {
                global.craftrasHotbar.slots = Array(10).fill(null);
            }
            global.craftrasFriendSkill ??= { cooldownEndsAt: 0 };
            global.craftrasFriendSkill.cooldownEndsAt = Date.now() + Math.max(0, Number(m[2]) || 0);
            try {
                const keys = JSON.parse(m[3]);
                global.craftrasCustomWeaponKeys = Array.isArray(keys) ? keys.map(key => String(key).toLowerCase()) : [];
            } catch {
                global.craftrasCustomWeaponKeys = [];
            }
            saveCraftrasInventoryToBrowser();
        } break;
        case "FC": {
            global.craftrasFriendSkill ??= { cooldownEndsAt: 0 };
            global.craftrasFriendSkill.cooldownEndsAt = Date.now() + Math.max(0, Number(m[0]) || 0);
        } break;
        case "BFR": {
            const active = !!m[0];
            let cooldowns = [];
            try {
                const parsed = JSON.parse(m[2]);
                if (Array.isArray(parsed)) cooldowns = parsed.map(value => Math.max(0, Number(value) || 0));
            } catch {}
            global.craftrasBossForm = {
                active,
                type: active ? String(m[1] || "world1_basic") : null,
                activeSkill: active ? Math.max(-1, Math.min(7, Number(m[3]) || 0)) : -1,
                cooldownEndsAt: cooldowns.map(value => Date.now() + value),
            };
        } break;
        case "HP": {
            global.craftrasHealth = {
                amount: Math.max(0, Number(m[0]) || 0),
                max: Math.max(1, Number(m[1]) || 100),
            };
        } break;
        case "PY": {
            global.craftrasParry = {
                ...(global.craftrasParry || {}),
                reduction: Math.max(0, Math.min(100, Number(m[0]) || 0)),
                counter: Math.max(0, Math.min(1000, Number(m[1]) || 0)),
                equipped: !!m[2],
            };
        } break;
        case "MG": {
            global.craftrasMagicBook = {
                gauge: Math.max(0, Math.min(5000, Number(m[0]) || 0)),
                regenLockedUntil: Date.now() + Math.max(0, Number(m[1]) || 0),
                slashCooldownUntil: Date.now() + Math.max(0, Number(m[2]) || 0),
                barrageCooldownUntil: Date.now() + Math.max(0, Number(m[3]) || 0),
                charge: Math.max(0, Math.min(100, Number(m[4]) || 0)),
                equipped: !!m[5],
                shifting: !!m[6],
            };
        } break;
        case "PF": {
            global.craftrasParry ??= {};
            global.craftrasParry.flashStartedAt = Date.now();
            global.craftrasParry.flashDuration = Math.max(1, Number(m[0]) || 200);
        } break;
        case "DF": {
            try {
                const debuffs = JSON.parse(m[0]);
                global.craftrasDebuffs = Array.isArray(debuffs) ? debuffs : [];
            } catch {
                global.craftrasDebuffs = [];
            }
        } break;
        case "DY": {
            global.craftrasDayCycle = {
                virtualTime: Math.max(0, Number(m[0]) || 0),
                speed: Math.max(0.1, Number(m[1]) || 1),
                receivedAt: Date.now(),
            };
        } break;
        case "WE": {
            const weatherType = String(m[0] || "clear").toLowerCase() === "rain" ? "rain" : "clear";
            const whiteInfernoState = ["warning", "active"].includes(String(m[4] || "").toLowerCase())
                ? String(m[4]).toLowerCase()
                : "clear";
            global.craftrasWeather = {
                type: weatherType,
                remaining: Math.max(0, Number(m[1]) || 0),
                rainChance: Math.max(0, Math.min(1, Number(m[2]) || 0.05)),
                whiteInfernoState,
                whiteInfernoRemaining: Math.max(0, Number(m[5]) || 0),
                whiteInfernoChance: Math.max(0, Math.min(1, Number(m[6]) || 0.10)),
                receivedAt: Date.now(),
            };
            global.craftrasWorld.challengeStoryEightReached = !!global.craftrasWorld.challengeMode && !!m[3];
            if (global.craftrasWorld.challengeStoryEightReached && weatherType === "clear") {
                global.craftrasWorld.weatherRainAlpha = 0;
                global.craftrasWorld.weatherStormAlpha = 0;
                global.craftrasWorld.weatherSurfaceAlpha = 0;
                global.craftrasWorld.weatherVisualAlpha = 0;
                global.craftrasWorld.weatherStormVisualAlpha = 0;
            }
        } break;
        case "KW": {
            global.craftrasKingdomWeather = {
                state: m[0] === "intact" ? "intact" : "ruined",
                target: m[1] === "intact" || m[1] === "ruined" ? m[1] : "",
                duration: Math.max(1, Number(m[2]) || 60_000),
                elapsed: Math.max(0, Number(m[3]) || 0),
                paused: !!m[4],
                receivedAt: Date.now(),
            };
        } break;
        case "IV": {
            global.craftrasInventory.active = true;
            try {
                const slots = JSON.parse(m[0]);
                global.craftrasInventory.slots = Array.isArray(slots)
                    ? Array.from({ length: 40 }, (_, index) => slots[index] ?? null)
                    : Array(40).fill(null);
            } catch {
                global.craftrasInventory.slots = Array(40).fill(null);
            }
            try {
                global.craftrasInventory.cursor = m.length > 1 ? JSON.parse(m[1]) : null;
            } catch {
                global.craftrasInventory.cursor = null;
            }
            try {
                global.craftrasInventory.helmet = m.length > 2 ? JSON.parse(m[2]) : null;
            } catch {
                global.craftrasInventory.helmet = null;
            }
            try {
                global.craftrasInventory.offhand = m.length > 3 ? JSON.parse(m[3]) : null;
            } catch {
                global.craftrasInventory.offhand = null;
            }
            saveCraftrasInventoryToBrowser();
        } break;
        case "RC": {
            try {
                const recipes = JSON.parse(m[0]);
                global.craftrasRecipeBookRecipes = Array.isArray(recipes) ? recipes : [];
            } catch {
                global.craftrasRecipeBookRecipes = [];
            }
            try {
                const unlocked = JSON.parse(m[1]);
                global.craftrasUnlockedRecipes = Array.isArray(unlocked) ? unlocked : [];
            } catch {
                global.craftrasUnlockedRecipes = [];
            }
            global.craftrasRecipeScroll = 0;
        } break;
        case "RN": {
            try {
                const items = JSON.parse(m[0]);
                if (Array.isArray(items) && items.length) {
                    global.craftrasRecipeUnlockQueue ??= [];
                    global.craftrasRecipeUnlockQueue.push({ items, startedAt: 0 });
                }
            } catch {}
        } break;
        case "CI": {
            global.craftrasCreative.active = !!m[0];
            try {
                const items = JSON.parse(m[1]);
                global.craftrasCreative.items = Array.isArray(items) ? items : [];
            } catch {
                global.craftrasCreative.items = [];
            }
        } break;
        case "PB": {
            craftrasPersistenceBlocked = !!m[0];
        } break;
        case "AU": {
            const token = typeof m[0] === "string" ? m[0] : "";
            const expiresAt = Math.floor(Number(m[1]) || 0);
            try {
                if (token && expiresAt > Date.now()) {
                    localStorage.setItem(CRAFTRAS_ADMIN_SESSION_KEY, JSON.stringify({ token, expiresAt }));
                } else {
                    localStorage.removeItem(CRAFTRAS_ADMIN_SESSION_KEY);
                }
            } catch {}
        } break;
        case "EC": {
            global.craftrasEconomy = {
                points: Math.max(0, Math.floor(Number(m[0]) || 0)),
                tokens: Math.max(0, Math.floor(Number(m[1]) || 0)),
                status: ["Admin", "Creative", "Spectator", "Survival"].includes(m[2]) ? m[2] : "Survival",
            };
        } break;
        case "CV": {
            global.craftrasCrafting.mode = Number(m[0]) || 0;
            global.craftrasCrafting.size = Number(m[1]) || 2;
            try {
                const slots = JSON.parse(m[2]);
                global.craftrasCrafting.slots = Array.isArray(slots)
                    ? Array.from({ length: 9 }, (_, index) => slots[index] ?? null)
                    : Array(9).fill(null);
            } catch {
                global.craftrasCrafting.slots = Array(9).fill(null);
            }
            try {
                global.craftrasCrafting.output = JSON.parse(m[3]);
            } catch {
                global.craftrasCrafting.output = null;
            }
            if (global.craftrasCrafting.mode) {
                global.craftrasInventory.open = true;
                if (global.craftrasBlacksmith) global.craftrasBlacksmith.open = false;
                if (global.craftrasCleric) global.craftrasCleric.open = false;
                if (global.craftrasMerchant) global.craftrasMerchant.open = false;
                if (global.craftrasBlesser) global.craftrasBlesser.open = false;
            }
        } break;
        case "BV": {
            let slot = null, offer = null;
            try { slot = m.length > 1 ? JSON.parse(m[1]) : null; } catch { slot = null; }
            try { offer = m.length > 2 ? JSON.parse(m[2]) : null; } catch { offer = null; }
            try {
                const unlocked = m.length > 4 ? JSON.parse(m[4]) : [];
                global.craftrasUnlockedRecipes = Array.isArray(unlocked) ? unlocked : [];
            } catch {
                global.craftrasUnlockedRecipes = [];
            }
            global.craftrasBlacksmith = {
                open: !!m[0],
                slot,
                offer,
                playerLevel: Number(m[3]) || 0,
            };
            if (global.craftrasBlacksmith.open) {
                global.craftrasInventory.open = true;
                global.craftrasCrafting.mode = 0;
                global.craftrasFurnace.open = false;
                global.craftrasChest.open = false;
                if (global.craftrasCleric) global.craftrasCleric.open = false;
                if (global.craftrasMerchant) global.craftrasMerchant.open = false;
                if (global.craftrasBlesser) global.craftrasBlesser.open = false;
            }
        } break;
        case "MV": {
            let offers = [], sellSlot = null;
            try { offers = m.length > 3 ? JSON.parse(m[3]) : []; } catch { offers = []; }
            try { sellSlot = m.length > 4 ? JSON.parse(m[4]) : null; } catch { sellSlot = null; }
            global.craftrasMerchant = {
                open: !!m[0],
                points: Number(m[1]) || 0,
                refreshIn: Number(m[2]) || 0,
                refreshReceivedAt: Date.now(),
                offers: Array.isArray(offers) ? offers : [],
                sellSlot,
                kind: m[5] === "monster" ? "monster" : m[5] === "miner" ? "miner" : "normal",
            };
            if (global.craftrasMerchant.open) {
                global.craftrasInventory.open = true;
                global.craftrasCrafting.mode = 0;
                global.craftrasFurnace.open = false;
                global.craftrasChest.open = false;
                if (global.craftrasBlacksmith) global.craftrasBlacksmith.open = false;
                if (global.craftrasCleric) global.craftrasCleric.open = false;
                if (global.craftrasBlesser) global.craftrasBlesser.open = false;
            }
        } break;
        case "SV": {
            let offers = [];
            try { offers = m.length > 2 ? JSON.parse(m[2]) : []; } catch { offers = []; }
            global.craftrasBlesser = {
                open: !!m[0],
                points: Number(m[1]) || 0,
                offers: Array.isArray(offers) ? offers : [],
                kind: m[3] === "healer" ? "healer" : "blesser",
            };
            if (global.craftrasBlesser.open) {
                global.craftrasInventory.open = true;
                global.craftrasCrafting.mode = 0;
                global.craftrasFurnace.open = false;
                global.craftrasChest.open = false;
                if (global.craftrasBlacksmith) global.craftrasBlacksmith.open = false;
                if (global.craftrasCleric) global.craftrasCleric.open = false;
                if (global.craftrasMerchant) global.craftrasMerchant.open = false;
            }
        } break;
        case "RV": {
            let requirements = [], slots = [];
            try { requirements = m.length > 8 ? JSON.parse(m[8]) : []; } catch { requirements = []; }
            try { slots = m.length > 9 ? JSON.parse(m[9]) : []; } catch { slots = []; }
            global.craftrasCleric = {
                open: !!m[0],
                mode: m[1] === "pope" ? "pope" : "token",
                rebirths: Number(m[2]) || 0,
                playerLevel: Number(m[3]) || 0,
                levelCap: Number(m[4]) || 100,
                canRebirth: !!m[5],
                nextLevelCap: Number.isFinite(Number(m[6])) ? Number(m[6]) : 0,
                healthBonus: Number(m[7]) || 0,
                requirements: Array.isArray(requirements) ? requirements : [],
                slots: Array.from({ length: 4 }, (_, index) => Array.isArray(slots) ? slots[index] ?? null : null),
                canToken: !!m[10],
            };
            if (global.craftrasCleric.open) {
                global.craftrasInventory.open = true;
                global.craftrasCrafting.mode = 0;
                global.craftrasFurnace.open = false;
                global.craftrasChest.open = false;
                if (global.craftrasBlacksmith) global.craftrasBlacksmith.open = false;
                if (global.craftrasMerchant) global.craftrasMerchant.open = false;
                if (global.craftrasBlesser) global.craftrasBlesser.open = false;
            }
        } break;
        case "FV": {
            global.craftrasFurnace ??= { open: false, key: null, slots: [null, null, null], progress: 0 };
            global.craftrasFurnace.key = m[0] || null;
            global.craftrasFurnace.open = !!global.craftrasFurnace.key;
            try {
                const slots = JSON.parse(m[1]);
                global.craftrasFurnace.slots = Array.isArray(slots)
                    ? Array.from({ length: 3 }, (_, index) => slots[index] ?? null)
                    : [null, null, null];
            } catch {
                global.craftrasFurnace.slots = [null, null, null];
            }
            global.craftrasFurnace.progress = Math.max(0, Math.min(1, Number(m[2]) || 0));
            if (global.craftrasFurnace.open) {
                global.craftrasCrafting.mode = 0;
                global.craftrasBlacksmith.open = false;
                if (global.craftrasCleric) global.craftrasCleric.open = false;
                if (global.craftrasBlesser) global.craftrasBlesser.open = false;
                global.craftrasInventory.open = true;
            }
        } break;
        case "XV": {
            global.craftrasChest ??= { open: false, key: null, slots: Array(27).fill(null) };
            global.craftrasChest.key = m[0] || null;
            global.craftrasChest.open = !!global.craftrasChest.key;
            try {
                const slots = JSON.parse(m[1]);
                global.craftrasChest.slots = Array.isArray(slots)
                    ? Array.from({ length: 27 }, (_, index) => slots[index] ?? null)
                    : Array(27).fill(null);
            } catch {
                global.craftrasChest.slots = Array(27).fill(null);
            }
            if (global.craftrasChest.open) {
                global.craftrasCrafting.mode = 0;
                global.craftrasFurnace.open = false;
                global.craftrasBlacksmith.open = false;
                if (global.craftrasCleric) global.craftrasCleric.open = false;
                if (global.craftrasBlesser) global.craftrasBlesser.open = false;
                global.craftrasInventory.open = true;
            }
        } break;
        case "PV": {
            global.craftrasPlacement.active = !!m[0];
            global.craftrasPlacement.x = Number(m[1]) || 0;
            global.craftrasPlacement.y = Number(m[2]) || 0;
            global.craftrasPlacement.valid = !!m[3];
            global.craftrasPlacement.mode = m[4] ? "floor" : "block";
            global.craftrasPlacement.adminLayerTools = !!m[5];
        } break;
        case "WV": {
            const active = !!m[0];
            global.craftrasWorldEdit ??= { active: false, anchorX: 0, anchorY: 0, cursorX: 0, cursorY: 0, mode: "outline" };
            global.craftrasWorldEdit.active = active;
            if (active) {
                global.craftrasWorldEdit.anchorX = Number(m[1]) || 0;
                global.craftrasWorldEdit.anchorY = Number(m[2]) || 0;
                global.craftrasWorldEdit.cursorX = Number(m[3]) || 0;
                global.craftrasWorldEdit.cursorY = Number(m[4]) || 0;
                global.craftrasWorldEdit.mode = m[5] ? "fill" : "outline";
            }
        } break;
        case "MR": {
            try {
                const markers = JSON.parse(m[0]);
                global.craftrasRouteMarkers = Array.isArray(markers)
                    ? markers
                        .filter(point => Array.isArray(point) && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1])))
                        .map(point => [Number(point[0]), Number(point[1])])
                    : [];
            } catch {
                global.craftrasRouteMarkers = [];
            }
        } break;
        case "TSM": {
            try {
                const markers = JSON.parse(m[0]);
                global.craftrasTextStoryMarkers = new Map(
                    (Array.isArray(markers) ? markers : [])
                        .filter(marker => Number.isInteger(marker?.x) && Number.isInteger(marker?.y) && Number.isInteger(marker?.index))
                        .map(marker => [`${marker.x},${marker.y}`, marker.index]),
                );
            } catch {
                global.craftrasTextStoryMarkers = new Map();
            }
        } break;
        case "CH": {
            const chunkX = m.shift();
            const chunkY = m.shift();
            const chunkSize = global.craftrasWorld.chunkSize;
            const cells = new Uint8Array(chunkSize * chunkSize);
            let writeIndex = 0;
            for (let i = 0; i + 1 < m.length && writeIndex < cells.length; i += 2) {
                const runLength = m[i];
                const code = m[i + 1];
                cells.fill(code, writeIndex, Math.min(cells.length, writeIndex + runLength));
                writeIndex += runLength;
            }
            const key = `${chunkX},${chunkY}`;
            global.craftrasWorld.chunks.set(key, cells);
            global.craftrasWorld.chunkEntries ??= new Map();
            rebuildCraftrasChunkEntries(global.craftrasWorld.chunkEntries, key, cells);
            global.craftrasWorld.cavePrewarmChunksDirty = true;
        } break;
        case "FH": {
            const chunkX = m.shift();
            const chunkY = m.shift();
            const chunkSize = global.craftrasWorld.chunkSize;
            const cells = new Uint8Array(chunkSize * chunkSize);
            let writeIndex = 0;
            for (let i = 0; i + 1 < m.length && writeIndex < cells.length; i += 2) {
                const runLength = m[i];
                const code = m[i + 1];
                cells.fill(code, writeIndex, Math.min(cells.length, writeIndex + runLength));
                writeIndex += runLength;
            }
            const key = `${chunkX},${chunkY}`;
            global.craftrasWorld.floorChunks ??= new Map();
            global.craftrasWorld.floorChunks.set(key, cells);
            global.craftrasWorld.floorChunkEntries ??= new Map();
            rebuildCraftrasChunkEntries(global.craftrasWorld.floorChunkEntries, key, cells);
        } break;
        case "CU": {
            const key = `${m[0]},${m[1]}`;
            global.craftrasWorld.chunks.delete(key);
            global.craftrasWorld.chunkEntries?.delete(key);
            global.craftrasWorld.torchChunkEntries?.delete(key);
            global.craftrasWorld.floorChunks?.delete(key);
            global.craftrasWorld.floorChunkEntries?.delete(key);
            global.craftrasWorld.cavePrewarmSeenChunks?.delete?.(key);
        } break;
        case "CB": {
            const blockX = m[0];
            const blockY = m[1];
            const chunkSize = global.craftrasWorld.chunkSize;
            const chunkX = Math.floor(blockX / chunkSize);
            const chunkY = Math.floor(blockY / chunkSize);
            const chunkKey = `${chunkX},${chunkY}`;
            const cells = global.craftrasWorld.chunks.get(chunkKey);
            if (cells) {
                const localX = blockX - chunkX * chunkSize;
                const localY = blockY - chunkY * chunkSize;
                const index = localY * chunkSize + localX;
                const key = `${blockX},${blockY}`;
                global.craftrasWorld.blockUpdateVersions ??= new Map();
                const versions = global.craftrasWorld.blockUpdateVersions;
                const version = (versions.get(key) || 0) + 1;
                versions.set(key, version);
                if (m[2] === 0 && !m[3]) {
                    global.craftrasWorld.hitEffects ??= new Map();
                    global.craftrasWorld.hitEffects.set(key, performance.now());
                    setTimeout(() => {
                        if (versions.get(key) !== version) return;
                        const current = global.craftrasWorld.chunks.get(chunkKey);
                        if (current) {
                            current[index] = 0;
                            rebuildCraftrasChunkEntries(global.craftrasWorld.chunkEntries, chunkKey, current);
                        }
                        global.craftrasWorld.hitEffects?.delete(key);
                    }, 260);
                } else {
                    cells[index] = m[2];
                    rebuildCraftrasChunkEntries(global.craftrasWorld.chunkEntries, chunkKey, cells);
                }
            }
        } break;
        case "FB": {
            const blockX = m[0];
            const blockY = m[1];
            const chunkSize = global.craftrasWorld.chunkSize;
            const chunkX = Math.floor(blockX / chunkSize);
            const chunkY = Math.floor(blockY / chunkSize);
            const chunkKey = `${chunkX},${chunkY}`;
            const cells = global.craftrasWorld.floorChunks?.get(chunkKey);
            if (cells) {
                const localX = blockX - chunkX * chunkSize;
                const localY = blockY - chunkY * chunkSize;
                cells[localY * chunkSize + localX] = m[2] || 0;
                rebuildCraftrasChunkEntries(global.craftrasWorld.floorChunkEntries, chunkKey, cells);
            }
        } break;
        case "CS": {
            global.craftrasWorld.hitEffects ??= new Map();
            global.craftrasWorld.hitEffects.set(`${m[0]},${m[1]}`, performance.now());
        } break;
        case "CSPEC": {
            global.craftrasSpectator = !!m[0];
            resetScreenShake();
            if (global.craftrasSpectator) {
                global.died = false;
                global.cannotRespawn = false;
                global.showChat = false;
                const canvas = global.canvas;
                canvas?.chatInput?.blur?.();
                canvas?.chatInput?.remove?.();
                canvas?.chatBox?.remove?.();
                if (canvas) {
                    canvas.chatInput = null;
                    canvas.chatBox = false;
                    canvas.cv?.focus?.();
                }
                if (global.craftrasInventory) {
                    global.craftrasInventory.open = false;
                    global.craftrasInventory.drag = null;
                    global.craftrasInventory.cursor = null;
                    global.craftrasInventory.rightDrag = null;
                }
            }
            if (!global.craftrasSpectator) global.craftrasSpectatorRespawnBounds = null;
        } break;
        case "b": {
            if (startSettings.neededtoresync) return;
            convert.begin(m);
            convert.broadcast();
        } break;
        case 'p': { // ping
            setTimeout(() => {
                try {
                    global.socket.ping(Date.now() - clockDiff - serverStart);
                } catch (e) { };
            }, 50);
            16 <= global.metrics.latency.length && global.metrics.latency.shift();
            let c = Date.now() - clockDiff - serverStart - m[0];
            0 < c && global.metrics.latency.push(c);
        } break;
        case 'F': { // to pay respects
            resetScreenShake();
            global.craftrasSpectator = false;
            global.deathAnimation = util.AdvancedSmoothBar(0, 4, 1);
            global.deathAnimation.set(4);
            global.finalScore = util.AdvancedSmoothBar(0, 1.5);
            global.finalScore.set(m[0]);
            global.finalLifetime = util.AdvancedSmoothBar(0, 3);
            global.finalLifetime.set(m[1]);
            global.finalKills = [util.AdvancedSmoothBar(0, 4), util.AdvancedSmoothBar(0, 5.5), util.AdvancedSmoothBar(0, 2.5), util.AdvancedSmoothBar(0, 6)];
            global.respawnTimeout = m[2];
            if (global.respawnTimeout > 0) {
                global.cannotRespawn = true;
                setTimeout(() => {
                    let respawnTimeoutloop = setInterval(() => {
                        if (global.respawnTimeout <= 1) {
                            global.cannotRespawn = false;
                            global.respawnTimeout = false;
                            clearInterval(respawnTimeoutloop);
                        } else {
                            global.respawnTimeout--;
                        }
                    }, 1000); // One second.
                }, 3000)
            }
            global.finalKills[0].set(m[3]);
            global.finalKills[1].set(m[4]);
            global.finalKills[2].set(m[5]);
            global.finalKills[3].set(m[6]);
            global.finalKillers = [];
            for (let i = 0; i < m[7]; i++) {
                global.finalKillers.push(m[8 + i]);
            }
            global.canvas.reverseDirection = false;
            global.died = true;
            if (global.craftrasInventory) {
                global.craftrasInventory.open = false;
                global.craftrasInventory.drag = null;
                global.craftrasInventory.cursor = null;
                global.craftrasInventory.rightDrag = null;
            }
            if (global.canvas) {
                global.canvas.craftrasPointerDrag = null;
                if (global.canvas.craftrasDropTimer) {
                    clearTimeout(global.canvas.craftrasDropTimer);
                    clearInterval(global.canvas.craftrasDropTimer);
                    global.canvas.craftrasDropTimer = null;
                }
            }
            global.autoSpin = false;
            global.syncingWithTank = false;
            global.clickables.mobileButtons.active = false;
        } break;
        case 'I': { // sync with the tank
            if (m[0]) {
                global.syncingWithTank = true;
            } else {
                global.syncingWithTank = false;
            }
        } break;
        case 'DTA': {
            let data = JSON.parse(m[0]);
            if (data.waitTime == "isVideo") {
                let renderDoc = document.createElement("video");
                renderDoc.onloadeddata = function() {
                    renderDoc.muted = false;
                    renderDoc.volume = 1;
                    global.dailyTankAd.isVideo = true;
                    global.dailyTankAd.render = renderDoc;
                    global.dailyTankAd.orginWidth = global.dailyTankAd.width;
                    global.dailyTankAd.orginHeight = global.dailyTankAd.height;
                    if (!data.normalAdSize) {
                        global.dailyTankAd.width = this.videoWidth;
                        global.dailyTankAd.height = this.videoHeight;
                    }
                    socket.talk("DTAST", renderDoc.duration);
                };
                renderDoc.onerror = () => {
                    global.dailyTankAd.renderUI = false;
                    global.createMessage("Failed to load the ad!");
                }
                renderDoc.src = `./img/ads/${data.src}`;
            } else {
                let renderDoc = new Image();
                renderDoc.onload = () => {
                    global.dailyTankAd.render = renderDoc;
                    global.dailyTankAd.orginWidth = global.dailyTankAd.width;
                    global.dailyTankAd.orginHeight = global.dailyTankAd.height;
                    if (!data.normalAdSize) {
                        global.dailyTankAd.width = renderDoc.width;
                        global.dailyTankAd.height = renderDoc.height;
                    }
                    global.dailyTankAd.readyToRender = true;
                    setTimeout(() => {
                        global.dailyTankAd.closeable = true;
                    }, `${data.waitTime}000`);
                }
                renderDoc.onerror = () => {
                    global.dailyTankAd.renderUI = false;
                    global.createMessage("Failed to load the ad!");
                }
                renderDoc.src = `./img/ads/${data.src}`;
            }
            global.dailyTankAd.renderUI = true;
        } break;
        case 'DTAD': {
            if (global.dailyTankAd.requestInterval) clearInterval(global.dailyTankAd.requestInterval)
            global.dailyTankAd.exit();
        } break;
        case 'DTAST': {
            global.dailyTankAd.render.onended = () => {
                global.dailyTankAd.requestInterval = setInterval(() => {
                    socket.talk("DTAD");
                }, 2000)
                socket.talk("DTAD");
            }
            global.dailyTankAd.render.play();
            global.dailyTankAd.readyToRender = true;
        } break;
        case 'SH': {
            let data = JSON.parse(m[0]);
            if (global.died || global.craftrasSpectator || global.disconnected) {
                resetScreenShake();
                break;
            }
            if (data.type == "camera") { // If the server wants to shake our camera...
                let set = config.graphical.shakeProperties.CameraShake; // Quick define
                if (data.push) {
                    const resetRevision = set.resetRevision || 0;
                    set.shakeDuration += data.duration; // add duration
                    set.shakeAmount += data.amount; // Add amount the shake
                    setTimeout(() => {
                        if ((set.resetRevision || 0) !== resetRevision) return;
                        set.shakeDuration -= data.duration;
                        set.shakeAmount -= data.amount;
                    }, 500);
                } else {
                    set.shakeDuration = data.duration; // Duration
                    set.shakeAmount = data.amount; // Amount the shake
                }
                set.keepShake = data.keepShake; // Keep the shake so it never ends
                // Now trigger it!
                set.shakeStartTime = Date.now();
            }
            if (data.type == "gui") { // If the server wants to shake our GUI...
                let set = config.graphical.shakeProperties.UIShake; // Quick define
                if (data.push) {
                    const resetRevision = set.resetRevision || 0;
                    set.shakeDuration += data.duration; // add duration
                    set.shakeAmount += data.amount; // Add amount the shake
                    setTimeout(() => {
                        if ((set.resetRevision || 0) !== resetRevision) return;
                        set.shakeDuration -= data.duration;
                        set.shakeAmount -= data.amount;
                    }, 500);
                } else {
                    set.shakeDuration = data.duration; // Duration
                    set.shakeAmount = data.amount; // Amount the shake
                }
                set.keepShake = data.keepShake; // Keep the shake so it never ends
                // Now trigger it!
                set.shakeStartTime = Date.now();
            }
        } break;
        case "t": {
            const transition = global.craftrasServerTransition;
            if (transition?.active) {
                transition.phase = "hold";
                transition.startedAt = Date.now();
                transition.alpha = 1;
            }
            // Close the socket
            socket.onclose = () => { };
            socket.close();
            global.dailyTankAd.exit();
            socket.open = false;
            clearInterval(socket.commandCycle);
            global.gameStart = false;
    
            // Reset the player
            global.player = global.initPlayer();
    
            // Setup
            global.gameLoading = true;
            const rawDestination = m[0];
            global.serverAdd = normalizeServerAddress(rawDestination === "/" ? (location.host || "localhost:3000") : rawDestination);
            window.__craftrasServerAdd = global.serverAdd;
            global.bodyID = m[1];
            if (global.serverMap[global.serverAdd]) global.serverMap[global.serverAdd].onclick();

            // Update the location hash
            let server = global.servers.find(s => normalizeServerAddress(s.ip) === global.serverAdd);
            const transferredServerId = server?.id || getCraftrasLocalServerId(rawDestination);
            if (transferredServerId) location.hash = "#" + transferredServerId;
            else if (rawDestination === "/") location.hash = "#server1";
            else if (rawDestination.startsWith("/challenge-instance/")) location.hash = "#world1-challenge";
            global.locationHash = location.hash;
            global.craftrasServerTransferPending = true;

            // Reconnect server
            global.reconnect();
        } break;
        case 'T': {
            global.generateTankTree = true;
            global.renderTankTree = true;
        } break;
        
        case 'K': { // kicked
            // Put your code while being kicked from the server. 
        } break;
        case 'z': { // name color
            global.nameColor = m[0];
        } break;
        case 'RM': { // Reset minimap teams if needed
            minimapTeamInt.reset();
            minimapAllInt.elements = {};
        } break;
        case 'RL': { // Reset leaderboard if needed
            leaderboardInt.reset();
        } break;
        case 'message': {
            global.message = m[0];
        } break;
        case 'AS': { // Activating smooth camera if needed.
            config.graphical.smoothcamera2 = config.graphical.smoothcamera;
            config.graphical.smoothcamera = true;
        } break;
        case 'DS': { // Deactivate smooth camera if needed.
            if (!config.graphical.smoothcamera2) config.graphical.smoothcamera = false;
            delete config.graphical.smoothcamera2;
        } break;
        case 'CHAT_MESSAGE_ENTITY': {
            if (!global.chats) global.chats = {};
            for (let data of JSON.parse(m[0])) {
                if (!global.chats[data.id]) global.chats[data.id] = [];
                for (let e of data.messages) {
                    const alreadyExists = global.chats[data.id].find(msg => msg.id === e.id);
                    if (!alreadyExists) {
                        let alpha = util.AdvancedSmoothBar(0, 0.3, 1.5);
                        global.chats[data.id].push({
                            text: e.text,
                            id: e.id,
                            alpha: alpha
                        })
                        alpha.set(1);
                    }
                }
                for (let i = 0; i < global.chats[data.id].length; i++) {
                    let e = global.chats[data.id][i];
                    const existing = data.messages.find(o => o.id === e.id);
                    if (!existing && !e.erased) {
                        e.erased = true;
                        e.alpha.set(0);
                    };
                }
            }
        } break;
    };
}
const socketInit = () => {
    craftrasPersistenceBlocked = false;
    window.resizeEvent();
    const transferPending = !!global.craftrasServerTransferPending;
    global.craftrasServerTransferPending = false;
    const requestedServerId = location.hash.slice(1);
    const requestedServer = global.servers?.find(server => server.id === requestedServerId);
    const requestedServerAddress = requestedServer?.ip
        || (requestedServerId === getCraftrasLocalServerId(window.__craftrasServerAdd) ? window.__craftrasServerAdd : "");
    if (requestedServerId === "server1" && !transferPending) {
        global.serverAdd = location.host || "localhost:3000";
    } else if (!transferPending && requestedServerAddress) {
        global.serverAdd = requestedServerAddress;
    } else if (!global.serverAdd) {
        global.serverAdd = window.__craftrasServerAdd || location.host || "localhost:3000";
    }
    global.serverAdd = normalizeServerAddress(global.serverAdd);
    window.__craftrasServerAdd = global.serverAdd;
    let socket;
    try {
        socket = new WebSocket(protocols[location.protocol] + global.serverAdd);
    } catch (error) {
        global.serverAdd = location.host || "localhost:3000";
        socket = new WebSocket(protocols[location.protocol] + global.serverAdd);
    }
    // Set up our socket
    socket.binaryType = 'arraybuffer';
    socket.open = false;
    // Handle commands
    let flag = false;
    let commands = [
        false, // up
        false, // down
        false, // left
        false, // right
        false, // lmb
        false, // mmb
        false, // rmb
        false,
    ];
    socket.cmd = {
        set: (index, value) => {
            if (commands[index] !== value) {
                commands[index] = value;
                flag = true;
            }
        },
        talk: () => {
            flag = false;
            let o = 0;
            for (let i = 0; i < 8; i++) {
                if (commands[i]) o += Math.pow(2, i);
            }
            let ratio = util.getRatio();
            socket.talk('C', Math.round(global.target.x / ratio), Math.round(global.target.y / ratio), global.reverseTank, o);
        },
        check: () => flag,
        getMotion: () => ({
            x: commands[3] - commands[2],
            y: commands[1] - commands[0],
        }),
        reactNow: () => {
            flag = true;
            return flag;
        }
    };
    // Learn how to talk
    socket.talk = async (...message) => {
        if (window.fakeLagMS > 0) {
            await new Promise(resolve => setTimeout(resolve, window.fakeLagMS));
        }
        // Make sure the socket is open before we do anything
        if (!socket.open) return 1;
        message = protocol.encode(message)
        socket.send(message);
        global.bandwidth.currentHa += message.byteLength;
    };
    // Websocket functions for when stuff happens
    // This is for when the socket first opens
    socket.onopen = function socketOpen() {
        socket.open = true;
        // define a pinging function
        socket.ping = payload => socket.talk('p', payload);
    };
    
    // Handle incoming messages
    socket.onmessage = (msg) => incoming(msg, socket);

    // Handle closing
    socket.onclose = () => {
        if (!global.gameLoading) return;
        clearInterval(socket.commandCycle);
        clearInterval(global.socketMotionCycle);
        if (global.dailyTankAd.render) global.dailyTankAd.exit();
        if (!socket.open) global.gameLoading = false;
        socket.open = false;
        global.disconnected = true;
    };
    // Notify about errors
    socket.onerror = error => {
        clearInterval(socket.commandCycle);
        clearInterval(global.socketMotionCycle);
        if (!socket.open) global.gameLoading = false;
        global.message = 'Socket error. Maybe another server will work.';
    };
    // Gift it to the rest of the world
    return socket;
};

const resync = () => {
    let socket = global.socket;
    startSettings.neededtoresync = true;
    startSettings.allowtostartgame = false;
    sync = [];
    clockDiff = 0;
    serverStart = 0;
    minimapAllInt.elements = {};
    minimapTeamInt.elements = {};
    leaderboardInt.elements = {};
    leaderboard.entries = {};
    minimap.map = {};
    socket.talk('S', Date.now() - clockDiff - serverStart);
};

global.resetSocket = () => {
    sync = [];
    clockDiff = 0;
    serverStart = 0;
    sscore.set(0);
    gui.points = 0,
    gui.playerid = -1,
    gui.class = "";
    gui.root = "";
    minimap.map = {};
    minimapAllInt.elements = {};
    minimapTeamInt.elements = {};
    leaderboard.entries = {};
    leaderboardInt.reset();
    global.socket = [];
};

global.reconnectSocket = () => {
    sync = [];
    clockDiff = 0;
    serverStart = 0;
    sscore.set(0);
    gui.points = 0,
    gui.playerid = -1,
    gui.class = "";
    gui.root = "";
    gui.upgrades = [];
    minimap.map = {};
    minimapAllInt.elements = {};
    minimapTeamInt.elements = {};
    leaderboard.entries = {};
    leaderboardInt.reset();
    global.socket = [];
    global.socket = socketInit();
}

export { socketInit, resync, gui, leaderboard, minimap, moveCompensation, lag, getNow, clockDiff, serverStart, sendCraftrasInventorySaveToServer }
