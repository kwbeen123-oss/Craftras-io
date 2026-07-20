import { util } from "./util.js?v=20260702-7";
import { global } from "./global.js?v=20260702-7";
import { config } from "./config.js?v=20260702-7";
import { Canvas } from "./canvas.js?v=20260702-7";
import { color as colors } from "./color.js?v=20260612-2";
import { gameDraw } from "./gameDraw.js?v=20260702-7";
import * as socketStuff from "./socketinit.js?v=20260702-7";

const craftrasBlockBreakImages = [null, 1, 2, 3].map(stage => {
    if (stage == null) return null;
    const image = new Image();
    image.src = `./img/craftras-block-break-${stage}.png?v=20260612-1`;
    return image;
});
const craftrasDebuffImages = Object.fromEntries([
    ["knight_target", "craftras-debuff-knight-target.png"],
    ["poison", "craftras-debuff-poison.png"],
].map(([id, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260618-1`;
    return [id, image];
}));
const craftrasFireFrames = Array.from({ length: 5 }, (_, index) => {
    const image = new Image();
    image.src = `./img/craftras-fire-${index}.png?v=20260618-1`;
    return image;
});
const craftrasPlacedBlockImages = Object.fromEntries([
    [9, "craftras-plank.png"],
    [10, "craftras-crafting-table.png"],
    [11, "craftras-furnace-off.png"],
    [12, "craftras-furnace-on.png"],
].map(([code, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260614-2`;
    return [code, image];
}));
const craftrasHelmetImages = Object.fromEntries([
    ["iron_helmet", "craftras-iron-helmet.png"],
    ["diamond_helmet", "craftras-diamond-helmet.png"],
    ["zombie_crown", "craftras-zombie-crown.png"],
].map(([id, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260618-1`;
    return [id, image];
}));
const drawCraftrasHelmetImage = (context, image, helmetId, x, y, size) => {
    if (!image || !((image.complete && image.naturalWidth) || image.width)) return false;
    context.drawImage(image, x, y, size, size);
    if (helmetId === "gold_helmet") {
        context.globalCompositeOperation = "source-atop";
        context.globalAlpha *= 0.72;
        context.fillStyle = "#f1c84a";
        context.fillRect(x, y, size, size);
        context.globalCompositeOperation = "source-over";
        context.globalAlpha /= 0.72;
    }
    return true;
};
craftrasHelmetImages.gold_helmet = craftrasHelmetImages.iron_helmet;
const craftrasM134Image = new Image();
craftrasM134Image.src = "./img/craftras-m134.png?v=20260615-1";
const craftrasRocketLauncherImage = new Image();
craftrasRocketLauncherImage.src = "./img/craftras-rocket-launcher.png?v=20260618-1";
const craftrasCowPatternImage = new Image();
craftrasCowPatternImage.src = "./img/craftras-cow-pattern.png?v=20260621-1";
const craftrasChickenCombImage = new Image();
craftrasChickenCombImage.src = "./img/craftras-chicken-comb.png?v=20260621-1";
const craftrasLootImages = Object.fromEntries([
    ["rotten_flesh", "craftras-rotten-flesh.png"],
    ["bone", "craftras-bone.png"],
    ["gunpowder", "craftras-gunpowder.png"],
    ["crown_fragment", "craftras-crown-fragment.png"],
    ["royal_key", "craftras-royal-key.png"],
    ["spider_eye", "craftras-spider-eye.png"],
    ["toxic_spider_eye", "craftras-toxic-spider-eye.png"],
    ["spider_leg", "craftras-spider-leg.png"],
    ["string", "craftras-string.png"],
    ["spider_venom", "craftras-spider-venom.png"],
    ["venom_sword_recipe", "craftras-venom-sword-recipe.png"],
    ["knight_shield_fragment", "craftras-knight-shield-fragment.png"],
    ["iron_shield", "craftras-iron-shield.png"],
    ["gold_shield", "craftras-gold-shield.png"],
    ["diamond_shield", "craftras-diamond-shield.png"],
    ["knight_shield", "craftras-knight-shield.png"],
    ["raw_beef", "craftras-raw-beef.png"],
    ["cooked_beef", "craftras-cooked-beef.png"],
    ["raw_pork", "craftras-raw-pork.png"],
    ["cooked_pork", "craftras-cooked-pork.png"],
    ["raw_chicken", "craftras-raw-chicken.png"],
    ["cooked_chicken", "craftras-cooked-chicken.png"],
    ["blacksmith_hammer", "craftras-blacksmith-hammer.png"],
].map(([id, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260621-3`;
    return [id, image];
}));
const craftrasM134HeatedImage = document.createElement("canvas");
craftrasM134Image.addEventListener("load", () => {
    craftrasM134HeatedImage.width = craftrasM134Image.naturalWidth;
    craftrasM134HeatedImage.height = craftrasM134Image.naturalHeight;
    const imageContext = craftrasM134HeatedImage.getContext("2d");
    imageContext.drawImage(craftrasM134Image, 0, 0);
    imageContext.globalCompositeOperation = "source-atop";
    imageContext.fillStyle = "#ff1e12";
    imageContext.fillRect(0, 0, craftrasM134HeatedImage.width, craftrasM134HeatedImage.height);
});
const craftrasItemImages = {
    plank: craftrasPlacedBlockImages[9],
    crafting_table: craftrasPlacedBlockImages[10],
    furnace: craftrasPlacedBlockImages[11],
    m134: craftrasM134Image,
    rocket_launcher: craftrasRocketLauncherImage,
    ...craftrasLootImages,
};
const craftrasFlatItemIds = new Set([
    "m134", "rocket_launcher", "rotten_flesh", "bone", "gunpowder",
    "crown_fragment", "royal_key", "spider_eye", "toxic_spider_eye",
    "spider_leg", "string", "spider_venom", "venom_sword_recipe",
    "knight_shield_fragment", "iron_shield", "gold_shield", "diamond_shield", "knight_shield",
    "raw_beef", "cooked_beef", "raw_pork", "cooked_pork", "raw_chicken", "cooked_chicken",
    "blacksmith_hammer",
    "creative_24h", "creative_1h",
]);
global.craftrasRecipeBookOpen ??= false;
const craftrasMobHeadStyles = {
    zombie_head: { body: "#48a84f", border: "#28652d" },
    skeleton_head: { body: "#eeeeee", border: "#8a8e94", gun: true },
    creeper_head: { body: "#78d66c", border: "#397c34" },
    spider_head: { body: "#20141f", border: "#090609" },
    toxic_spider_head: { body: "#452066", border: "#1d0d2c" },
};
const craftrasHeldItemClasses = {
    craftrasHeldItemRottenFlesh: "rotten_flesh",
    craftrasHeldItemZombieHead: "zombie_head",
    craftrasHeldItemBone: "bone",
    craftrasHeldItemSkeletonHead: "skeleton_head",
    craftrasHeldItemGunpowder: "gunpowder",
    craftrasHeldItemCreeperHead: "creeper_head",
    craftrasHeldItemCrownFragment: "crown_fragment",
    craftrasHeldItemRoyalKey: "royal_key",
    craftrasHeldItemSpiderEye: "spider_eye",
    craftrasHeldItemSpiderHead: "spider_head",
    craftrasHeldItemToxicSpiderEye: "toxic_spider_eye",
    craftrasHeldItemToxicSpiderHead: "toxic_spider_head",
    craftrasHeldItemSpiderLeg: "spider_leg",
    craftrasHeldItemString: "string",
    craftrasHeldItemSpiderVenom: "spider_venom",
    craftrasHeldItemVenomSwordRecipe: "venom_sword_recipe",
    craftrasHeldItemKnightShieldFragment: "knight_shield_fragment",
    craftrasHeldItemIronShield: "iron_shield",
    craftrasHeldItemGoldShield: "gold_shield",
    craftrasHeldItemDiamondShield: "diamond_shield",
    craftrasHeldItemKnightShield: "knight_shield",
    craftrasHeldItemRawBeef: "raw_beef",
    craftrasHeldItemCookedBeef: "cooked_beef",
    craftrasHeldItemRawPork: "raw_pork",
    craftrasHeldItemCookedPork: "cooked_pork",
    craftrasHeldItemRawChicken: "raw_chicken",
    craftrasHeldItemCookedChicken: "cooked_chicken",
    craftrasHeldItemCreative24h: "creative_24h",
    craftrasHeldItemCreative1h: "creative_1h",
};
const craftrasOffhandShieldClasses = {
    craftrasOffhandIronShield: "iron_shield",
    craftrasOffhandGoldShield: "gold_shield",
    craftrasOffhandDiamondShield: "diamond_shield",
    craftrasOffhandKnightShield: "knight_shield",
};
const craftrasShieldHealth = {
    iron_shield: 100,
    gold_shield: 50,
    diamond_shield: 150,
    knight_shield: 250,
};
const craftrasBrokenShieldImages = Object.fromEntries(Object.keys(craftrasShieldHealth).map(id => {
    const canvas = document.createElement("canvas");
    const source = craftrasItemImages[id];
    const rebuild = () => {
        if (!source?.naturalWidth) return;
        canvas.width = source.naturalWidth;
        canvas.height = source.naturalHeight;
        const imageContext = canvas.getContext("2d");
        imageContext.drawImage(source, 0, 0);
        imageContext.globalCompositeOperation = "source-atop";
        imageContext.fillStyle = "#ff3030";
        imageContext.fillRect(0, 0, canvas.width, canvas.height);
    };
    if (source?.complete) rebuild();
    else source?.addEventListener("load", rebuild, { once: true });
    return [id, canvas];
}));
function drawCraftrasMobHeadIcon(context, itemId, x, y, size) {
    const style = craftrasMobHeadStyles[itemId];
    if (!style) return false;
    context.save();
    const centerX = x + size * 0.5;
    const centerY = y + size * 0.52;
    const radius = size * 0.28;
    context.lineWidth = Math.max(1.5, size * 0.045);
    context.strokeStyle = style.border;
    context.fillStyle = style.body;
    if (style.gun) {
        context.fillRect(centerX + radius * 0.6, centerY - radius * 0.18, radius * 0.75, radius * 0.36);
        context.strokeRect(centerX + radius * 0.6, centerY - radius * 0.18, radius * 0.75, radius * 0.36);
    }
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
    return true;
}
const craftrasToolImageFiles = {
    admin_pickaxe: "craftras-wooden-pickaxe.png",
    wooden_pickaxe: "craftras-wooden-pickaxe.png",
    stone_pickaxe: "craftras-stone-pickaxe.png",
    iron_pickaxe: "craftras-iron-pickaxe.png",
    gold_pickaxe: "craftras-gold-pickaxe.png",
    diamond_pickaxe: "craftras-diamond-pickaxe.png",
    wooden_axe: "craftras-wooden-axe.png",
    stone_axe: "craftras-stone-axe.png",
    iron_axe: "craftras-iron-axe.png",
    gold_axe: "craftras-gold-axe.png",
    diamond_axe: "craftras-diamond-axe.png",
    wooden_shovel: "craftras-wooden-shovel.png",
    stone_shovel: "craftras-stone-shovel.png",
    iron_shovel: "craftras-iron-shovel.png",
    gold_shovel: "craftras-gold-shovel.png",
    diamond_shovel: "craftras-diamond-shovel.png",
    wooden_sword: "craftras-wooden-sword.png",
    stone_sword: "craftras-stone-sword.png",
    iron_sword: "craftras-iron-sword.png",
    gold_sword: "craftras-gold-sword.png",
    diamond_sword: "craftras-diamond-sword.png",
    venom_sword: "craftras-venom-sword.png",
    blacksmith_hammer: "craftras-blacksmith-hammer.png",
    sword: "craftras-iron-sword.png",
};
const craftrasToolImages = Object.fromEntries(Object.entries(craftrasToolImageFiles).map(([id, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260702-1`;
    return [id, image];
}));
const craftrasPlacedBlockCrops = {
    11: { x: 32, y: 30, width: 436, height: 438 },
    12: { x: 27, y: 26, width: 446, height: 448 },
};

const craftrasToolColors = {
    wooden: { fill: "#b7834f", stroke: "#68472b" },
    stone: { fill: "#858a92", stroke: "#4f5359" },
    iron: { fill: "#d9dde2", stroke: "#777e87" },
    gold: { fill: "#f0c83d", stroke: "#9f7918" },
    diamond: { fill: "#42cddd", stroke: "#187e91" },
    venom: { fill: "#55e047", stroke: "#173b16" },
};

function getCraftrasToolStyle(itemId) {
    if (itemId === "sword") return { material: "iron", type: "sword" };
    if (itemId === "admin_pickaxe") return { material: "wooden", type: "pickaxe", rainbow: true };
    if (itemId === "blacksmith_hammer") return { material: "iron", type: "hammer" };
    if (itemId === "venom_sword") return { material: "venom", type: "sword" };
    const match = /^(wooden|stone|iron|gold|diamond)_(pickaxe|axe|shovel|sword)$/.exec(itemId || "");
    return match ? { material: match[1], type: match[2] } : null;
}

function drawCraftrasToolIcon(context, itemId, x, y, size) {
    const style = getCraftrasToolStyle(itemId);
    if (!style) return false;
    const image = craftrasToolImages[itemId];
    if (image?.complete && image.naturalWidth) {
        context.save();
        context.imageSmoothingEnabled = true;
        if (style.rainbow) {
            context.filter = `hue-rotate(${Math.floor(Date.now() / 8) % 360}deg) saturate(2.4) brightness(1.25)`;
        }
        context.drawImage(image, x + size * 0.06, y + size * 0.06, size * 0.88, size * 0.88);
        context.restore();
        return true;
    }
    const colors = craftrasToolColors[style.material];
    context.save();
    context.translate(x + size * 0.52, y + size * 0.52);
    context.rotate(-Math.PI / 4);
    context.lineJoin = "round";
    context.lineCap = "round";
    context.lineWidth = Math.max(1, size * 0.045);

    context.fillStyle = "#8b5a35";
    context.strokeStyle = "#53351f";
    const handleTop = style.type === "pickaxe" ? -size * 0.22 : -size * 0.08;
    const handleHeight = size * 0.35 - handleTop;
    context.fillRect(-size * 0.055, handleTop, size * 0.11, handleHeight);
    context.strokeRect(-size * 0.055, handleTop, size * 0.11, handleHeight);

    context.fillStyle = colors.fill;
    context.strokeStyle = colors.stroke;
    context.beginPath();
    if (style.type === "sword") {
        context.moveTo(-size * 0.075, size * 0.02);
        context.lineTo(-size * 0.075, -size * 0.29);
        context.lineTo(0, -size * 0.42);
        context.lineTo(size * 0.075, -size * 0.29);
        context.lineTo(size * 0.075, size * 0.02);
        context.closePath();
        context.fill();
        context.stroke();
        context.fillStyle = "#d8b14c";
        context.strokeStyle = "#765d20";
        context.fillRect(-size * 0.19, -size * 0.005, size * 0.38, size * 0.075);
        context.strokeRect(-size * 0.19, -size * 0.005, size * 0.38, size * 0.075);
    } else if (style.type === "pickaxe") {
        context.moveTo(-size * 0.36, -size * 0.25);
        context.quadraticCurveTo(0, -size * 0.43, size * 0.36, -size * 0.25);
        context.lineTo(size * 0.23, -size * 0.17);
        context.quadraticCurveTo(0, -size * 0.28, -size * 0.23, -size * 0.17);
        context.closePath();
        context.fill();
        context.stroke();
    } else if (style.type === "axe") {
        context.moveTo(-size * 0.03, -size * 0.31);
        context.quadraticCurveTo(size * 0.22, -size * 0.38, size * 0.34, -size * 0.22);
        context.lineTo(size * 0.25, size * 0.02);
        context.quadraticCurveTo(size * 0.12, size * 0.11, -size * 0.04, size * 0.02);
        context.closePath();
        context.fill();
        context.stroke();
    } else {
        context.moveTo(-size * 0.16, -size * 0.25);
        context.quadraticCurveTo(0, -size * 0.43, size * 0.16, -size * 0.25);
        context.lineTo(size * 0.13, -size * 0.08);
        context.quadraticCurveTo(0, size * 0.04, -size * 0.13, -size * 0.08);
        context.closePath();
        context.fill();
        context.stroke();
    }
    context.restore();
    return true;
}

global.craftrasFurnace ??= { open: false, key: null, slots: [null, null, null], progress: 0 };
global.craftrasChest ??= { open: false, key: null, slots: Array(27).fill(null) };

(async function (util, global, config, Canvas, color, gameDraw, socketStuff) {
    let { socketInit, resync, gui, leaderboard, minimap, moveCompensation, lag, getNow } = socketStuff;

    // Get the changelog
    fetch("changelog.md", { cache: "no-cache" }).then(response => response.text()).then(response => {
        let a = [];
        for (let c of response.split("\n")) {
            0 !== c.length && (response = c.charAt(0), "#" === response ? (initalizeChangelog(a, !0), a = [c.slice(1).trim()]) : "-" === response ? a.push(c.slice(1).trim()) : a[a.length - 1] += " " + c.trim());
        }
    });

    let controls = document.getElementById("controlSettings"),
        resetButton = document.getElementById("resetControls"),
        selectedElement = null,
        controlsArray = [],
        defaultKeybinds = {},
        keybinds = {};

    global.clearUpgrades = (clearNow = false) => {
        if (clearNow) gui.upgrades = [];
        else {
            global.pullUpgradeMenu = true;
            let loop = setInterval(() => {
                if (upgradeMenu.get() < (-global.columnCount * 3) * 0.9999) {
                    global.pullUpgradeMenu = false;
                    gui.upgrades = [];
                    clearInterval(loop);
                }
            }, 10)
        }
    }

    // Build the leaderboard object
    let leaderboardEntries = {};
    let leaderboardUpdate = 0;
    global.canUpgrade = false;
    global.canSkill = false;
    global.showTree = false;
    global.message = "";
    global.time = 0;
    global.guntime = 0;

    var upgradeSpin = 0,
        lastPing = 0,
        lasttick = 0,
        fovlasttick = 0;

    // Tips setup :D
    let tips = global.tips[Math.floor(Math.random() * global.tips.length)];
    global.tips = tips[Math.floor(Math.random() * tips.length)];
    // Window setup <3
    global.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    global.mobile && document.body.classList.add("mobile");
    if (!global.mobile) {
        document.getElementById("tabAppearance").classList.remove("shadowScroll");
        document.getElementById("tabOptions").classList.remove("shadowScroll");
    };

    function getKeybinds() {
        let kb = localStorage.getItem("keybinds");
        keybinds = typeof kb === "string" && kb.startsWith("{") ? JSON.parse(kb) : {};
    }

    function setKeybinds() {
        localStorage.setItem("keybinds", JSON.stringify(keybinds));
    }

    function unselectElement() {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
        selectedElement.element.parentNode.parentNode.classList.remove("editing");
        selectedElement = null;
    }

    function selectElement(element) {
        selectedElement = element;
        selectedElement.element.parentNode.parentNode.classList.add("editing");
        if (selectedElement.keyCode !== -1 && window.getSelection) {
            let selection = window.getSelection();
            selection.removeAllRanges();
            let range = document.createRange();
            range.selectNodeContents(selectedElement.element);
            selection.addRange(range);
        }
    }

    function setKeybind(key, keyCode) {
        selectedElement.element.parentNode.parentNode.classList.remove("editing");
        resetButton.classList.add("active");
        if (keyCode !== selectedElement.keyCode) {
            let otherElement = controlsArray.find(c => c.keyCode === keyCode);
            if (keyCode !== -1 && otherElement) {
                otherElement.keyName = selectedElement.keyName;
                otherElement.element.innerText = selectedElement.keyName;
                otherElement.keyCode = selectedElement.keyCode;
                global[otherElement.keyId] = selectedElement.keyCode;
                keybinds[otherElement.keyId] = [selectedElement.keyName, selectedElement.keyCode];
            }
        }
        selectedElement.keyName = key;
        selectedElement.element.innerText = key;
        selectedElement.keyCode = keyCode;
        global[selectedElement.keyId] = keyCode;
        keybinds[selectedElement.keyId] = [key, keyCode];
        setKeybinds();
    }

    function getElements(kb, storeInDefault) {
        for (let row of controls.rows) {
            for (let cell of row.cells) {
                let element = cell.firstChild.firstChild;
                if (!element) continue;
                let key = element.dataset.key;
                if (storeInDefault) defaultKeybinds[key] = [element.innerText, global[key]];
                if (kb[key]) {
                    element.innerText = kb[key][0];
                    global[key] = kb[key][1];
                    resetButton.classList.add("active");
                }
                let obj = {
                    element,
                    keyId: key,
                    keyName: element.innerText,
                    keyCode: global[key]
                };
                controlsArray.push(obj);
            }
        }
    }

    window.onload = async () => {
        // Prepare the server selector
        global.serverMap = {};
        global.servers = [];
        // Set up the socket
        global.loadServerSelector(false, "Connecting..."); // The code is at ./serverSelectorHandler.js

        fetch("/getServers.json").then(response => response.json()).then(json => {
            global.servers = json;
            global.loadServerSelector(json); // The code is at ./serverSelectorHandler.js
        }).catch(error => {
            console.error(error);
        })

        // Retrieve forms
        util.retrieveFromLocalStorage("playerNameInput");
        util.retrieveFromLocalStorage("playerKeyInput");
        util.retrieveFromLocalStorage("optSharpEdges");
        util.retrieveFromLocalStorage("optSlowerFOV");
        util.retrieveFromLocalStorage("optPredictive");
        util.retrieveFromLocalStorage("optFancy");
        util.retrieveFromLocalStorage("optLowResolution");
        util.retrieveFromLocalStorage("coloredHealthbars");
        util.retrieveFromLocalStorage("smoothCamera");
        util.retrieveFromLocalStorage("optColors");
        util.retrieveFromLocalStorage("optPointy");
        util.retrieveFromLocalStorage("optCurvyTraps");
        util.retrieveFromLocalStorage("optInterpolation");
        util.retrieveFromLocalStorage("optLerpAnim");
        util.retrieveFromLocalStorage("optOptimizeMode");
        util.retrieveFromLocalStorage("optCenterMinimap");
        util.retrieveFromLocalStorage("optBorders");
        util.retrieveFromLocalStorage("optNoGrid");
        util.retrieveFromLocalStorage("optColoredNest");
        util.retrieveFromLocalStorage("optRenderKillbar");
        util.retrieveFromLocalStorage("separatedHealthbars");
        util.retrieveFromLocalStorage("autoLevelUp");
        util.retrieveFromLocalStorage("optMobile");
        // GUI
        util.retrieveFromLocalStorage("optRenderGui");
        util.retrieveFromLocalStorage("optRenderLeaderboard");
        util.retrieveFromLocalStorage("optRenderUpgrades");
        util.retrieveFromLocalStorage("optRenderMinimap");
        util.retrieveFromLocalStorage("optRenderNames");
        util.retrieveFromLocalStorage("optRenderHealth");
        util.retrieveFromLocalStorage("optRenderScores");
        util.retrieveFromLocalStorage("optRenderPlayerBars");
        util.retrieveFromLocalStorage("optReducedInfo");
        util.retrieveFromLocalStorage("showCrosshair");
        util.retrieveFromLocalStorage("showJoystick");
        util.retrieveFromLocalStorage("optFullHD");
        util.retrieveFromLocalStorage("optUiScale");
        // Game
        util.retrieveFromLocalStorage("optIncognitoMode");
        // Set default theme
        if (document.getElementById("optColors").value === "") {
            document.getElementById("optColors").value = "normal";
        }
        if (document.getElementById("optBorders").value === "") {
            document.getElementById("optBorders").value = "normal";
        }
        // Mobile Selection stuff
        if (document.getElementById("optMobile").value === "") {
            document.getElementById("optMobile").value = "mobile";
        }
        // If we are loaded for the first time then load the default options settings.
        if (!localStorage.getItem("loadedForFirstTime")) {
            document.getElementById("optRenderGui").checked = true;
            document.getElementById("optRenderLeaderboard").checked = true;
            document.getElementById("optRenderUpgrades").checked = true;
            document.getElementById("optRenderMinimap").checked = true;
            document.getElementById("optRenderNames").checked = true;
            document.getElementById("optRenderHealth").checked = true;
            document.getElementById("optRenderScores").checked = true;
            document.getElementById("optRenderPlayerBars").checked = true;
            document.getElementById("optFancy").checked = true;
            document.getElementById("optInterpolation").checked = true;
            document.getElementById("optFancy").checked = true;
            document.getElementById("autoLevelUp").checked = true;
            if (global.mobile) document.getElementById("showCrosshair").checked = true, document.getElementById("showJoystick").checked = true;
            // Dont forget to save it.
            util.submitToLocalStorage("optRenderGui");
            util.submitToLocalStorage("optRenderLeaderboard");
            util.submitToLocalStorage("optRenderUpgrades");
            util.submitToLocalStorage("optRenderMinimap");
            util.submitToLocalStorage("optRenderNames");
            util.submitToLocalStorage("optRenderHealth");
            util.submitToLocalStorage("optRenderScores");
            util.submitToLocalStorage("optRenderPlayerBars");
            util.submitToLocalStorage("showCrosshair");
            util.submitToLocalStorage("showJoystick");
            util.submitToLocalStorage("optInterpolation");
            util.submitToLocalStorage("optFancy");
            util.submitToLocalStorage("autoLevelUp");
            localStorage.setItem("loadedForFirstTime", "true");
            localStorage.setItem("uiScaleSettings", null);
        }
        if (!localStorage.getItem("uiScaleSettings") || document.getElementById("optUiScale").value === "") {
            document.getElementById("optUiScale").value = global.mobile ? "mobile" : "normal";
            util.submitToLocalStorage("optUiScale");
            localStorage.setItem("uiScaleSettings", "true");
        }
        loadSettings();
        // Keybinds stuff
        getKeybinds();
        getElements(keybinds, true);
        document.addEventListener("click", event => {
            if (!global.gameStart) {
                if (selectedElement) {
                    unselectElement();
                } else {
                    let element = controlsArray.find(({ element }) => element === event.target);
                    if (element) selectElement(element);
                }
            }
        });
        resetButton.addEventListener("click", () => {
            keybinds = {};
            setKeybinds();
            controlsArray = [];
            getElements(defaultKeybinds);
            resetButton.classList.add("spin");
            setTimeout(() => {
                resetButton.classList.remove("active");
                resetButton.classList.remove("spin");
            }, 400);
        });

        // Tab menu creater
        global.createTabMenu = (text, type, addDismissButton = false) => {
            let allowedType = [
                "warning",
                "critical",
                "discord",
                "stat",
                "achieve",
            ];
            if (allowedType.includes(type)) {
                let b = document.getElementById("menuTabs");
                b.style.textAlign = "center";
                let d = document.createElement("span");
                d.classList.add("menuTab");
                d.classList.add(type);
                d.appendChild(document.createTextNode(`${text}${addDismissButton ? "\xa0\xa0\xa0" : ""}`));
                if (addDismissButton) {
                    text = document.createElement("text");
                    text.style.textDecoration = "underline";
                    text.href = "javascript:;";
                    text.appendChild(document.createTextNode("Dismiss"));
                    text.addEventListener("click", () => d.remove());
                    d.appendChild(text);
                }
                b.appendChild(d);
                return d;
            } else throw new Error("Invalid menu tab type.");
        };
        try {
            fetch("/version").then(json => json.json()).then(ve => {
                global.version = ve.ver;
                if (ve.devBuild) {
                    global.devBuild = true;
                    global.createTabMenu(`This server is running a development build of Open Source Arras. (${global.version})`, "warning");
                }
                // Addon info handler
                let keyValue = localStorage.getItem('playerKeyInputValue');
                (async function() {
                    let A_response = await fetch(`/api/getAddonAuthors?token=${keyValue}`);
                    let A_data = await A_response.json().catch(() => false);
                    if (A_data && Array.isArray(A_data)) initalizeAddonAuthors(A_data);
                })();
            });
        } catch { };
        // Warn the users to turn their phones into landscape.
        if (global.mobile && window.innerHeight > 1.1 * window.innerWidth) {
            let tabMenu = global.createTabMenu("Please turn your device to landscape mode.", "warning", true);
            window.addEventListener("orientationchange", () => {
                window.innerHeight > 1.1 * window.innerWidth || tabMenu.remove();
            });
        };

        // Game start stuff
        document.getElementById("startButton").onclick = () => startGame();
        document.onkeydown = (e) => {
            if (!(global.gameStart || e.shiftKey || e.ctrlKey || e.altKey)) {
                let key = e.which || e.keyCode;
                if (selectedElement) {
                    if (1 !== e.key.length /*|| /[0-9]/.test(e.key) // this code prevents numbers */ || 3 === e.location) {
                        if (!("Backspace" !== e.key && "Delete" !== e.key)) {
                            setKeybind("", -1);
                        }
                    } else {
                        setKeybind(e.key.toUpperCase(), e.keyCode);
                    }
                } else if (key === global.KEY_ENTER) {
                    startGame();
                }
            }
        };
        window.addEventListener("resize", resizeEvent);
        // Resizing stuff
        resizeEvent();
    };

    // Sliding between options menu.
    function toggleOptionsMenu() {
        let clicked = false,
            a = document.getElementById("startMenuSlidingTrigger"), // Trigger ID
            c = document.getElementById("optionArrow"), // Arrow
            h = document.getElementById("viewOptionText"), // Text (view options)
            u = document.getElementsByClassName("sliderHolder")[0], // Sliding.
            y = document.getElementsByClassName("slider"), // For animations things.
            toggle = () => {
                c.style.transform = c.style.webkitTransform = clicked // Rotate the arrow.
                    ? "translate(2px, -2px) rotate(45deg)"
                    : "rotate(-45deg)";
                h.innerText = clicked ? "close options" : "view options"; // Change the text.
                clicked ? u.classList.add("slided") : u.classList.remove("slided"); // Slide it up.
                y[0].style.opacity = clicked ? 0 : 1; // Fade it away.
                y[2].style.opacity = clicked ? 1 : 0; // same for this.
            };
        a.onclick = () => { // When the button is triggered, This code runs.
            clicked = !clicked;
            toggle();
        };
        return () => {
            clicked || ((clicked = !0), toggle());
        };
    };

    // Tab options
    function tabOptionsMenuSwitcher() {
        let buttonTabs = document.getElementById("optionMenuTabs"),
            tabOptions = [
                document.getElementById("tabAppearance"),
                document.getElementById("tabOptions"),
                document.getElementById("tabControls"),
                document.getElementById("tabLinks"),
                document.getElementById("tabAddons"),
            ];
        for (let g = 1; g < tabOptions.length; g++) tabOptions[g].style.display = "none";
        let e = 0;
        for (let g = 0; g < buttonTabs.children.length; g++)
            buttonTabs.children[g].addEventListener("click", () => {
                e !== g &&
                    (buttonTabs.children[e].classList.remove("active"), // Remove the active class
                        buttonTabs.children[g].classList.add("active"), // Add the clicked active class
                        (tabOptions[e].style.display = "none"), // Dont display the old menu.
                        (tabOptions[g].style.display = "block"), // Display the menu.
                        (e = g))
            });
    }
    function initalizeAddonAuthors(data) {
        let mainDoc = document.getElementById("tabAddons");
        mainDoc.innerHTML = "";
        for (let doc of document.getElementById("optionMenuTabs").children) {
            if (doc.textContent.toLowerCase() === "addons") doc.style.display = "";
        }
        // OSA info
        let i_div = document.createElement("div");
        i_div.classList.add("optionsHeader");
        i_div.textContent = `Open Source Arras ${global.version}` + `${global.devBuild ? "-dev" : ""}`;
        mainDoc.appendChild(i_div);

        // Addon stuff
        for (let e of data) {
            let warnDoc = null;
            if (e["osa-version"].target !== global.version) {
                warnDoc = document.createElement("ul3");
                warnDoc.textContent = "This addon may be incompatible with your version";
            }
            let divDoc = document.createElement("div");
            divDoc.classList.add("optionsHeader");
            let name = document.createElement("ul");
            let addonVer = document.createElement("ul");
            let versionValue = document.createElement("ul2");
            let author = document.createElement("ul");
            let authorValue = document.createElement("ul2");
            let targetVer = document.createElement("ul");
            let targetVerValue = document.createElement("ul2");

            name.textContent = e.name;
            addonVer.textContent = 'Version: ';
            versionValue.textContent = `${e["addon-version"]}`;
            addonVer.appendChild(versionValue);
            author.textContent = "Author(s): ";
            authorValue.textContent = "";
            for (let i = 0; i < e.authors.length; i++) {
                let auth = e.authors[i];
                authorValue.textContent += `${i !== 0 ? ", " : ""}${auth}`;
            }
            author.appendChild(authorValue);
            targetVer.textContent = `Made for OSA version ${e["osa-version"].target}`;

            divDoc.appendChild(name);
            divDoc.appendChild(author);
            divDoc.appendChild(addonVer);
            if (warnDoc) divDoc.appendChild(warnDoc);
            divDoc.appendChild(targetVer);

            mainDoc.appendChild(divDoc);
        }
    }
    // Custom theme display handler
    function customThemeDisplayHandler() {
        // Custom theme handler
        util.retrieveFromLocalStorage("optCustom");
        let themeValue = document.getElementById("optCustom");
        let customPlate;
        for (let e of document.getElementById("optColors").children) {
            if (e.value === "custom") customPlate = e;
        }
        let {name, author} = getThemeDisplayName(themeValue);
        if (name !== null && author !== null) customPlate.textContent = `Custom - ${name} ${author}`;
        themeValue.addEventListener("input", () => {
            let {name, author} = getThemeDisplayName(themeValue);
            if (name !== null && author !== null) customPlate.textContent = `Custom - ${name} ${author}`; else customPlate.textContent = "Custom - Unable to pull name or author.";
        });
    }

    function snowAndFireworkEffects() {
        let currentDate = new Date(),
        snowAmount = global.mobile
        ? 0
        : Math.max(
            0,
            1 -
                Math.abs(
                currentDate.getTime() -
                    new Date(currentDate.getFullYear() - (6 > currentDate.getMonth() ? 1 : 0), 11, 25)
                ) / 20736e5
            );
        if (snowAmount) {
            let snowCanvas = document.createElement("canvas");
            snowCanvas.style.position = "absolute";
            snowCanvas.style.top = "0";
            document.body.insertBefore(snowCanvas, document.body.firstChild);
            let b = snowCanvas.getContext("2d"),
            snows = [],
            updateSnow = () => {
                snowCanvas.width !== window.innerWidth && (snowCanvas.width = window.innerWidth);
                snowCanvas.height !== window.innerHeight && (snowCanvas.height = window.innerHeight);
                b.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
                b.fillStyle = "#ffffff";
                for (let snow of snows) {
                snow.x += 5 / snow.speed + Math.random();
                snow.y += 12.5 / snow.speed + Math.random();
                let fade = 2 * Math.min(0.4, 1 - snow.y / snowCanvas.height);
                0 < fade
                    ? ((b.globalAlpha = fade),
                    b.beginPath(),
                    b.arc(snow.x, snow.y, snow.speed, 0, 2 * Math.PI),
                    b.fill())
                    : (snow.vanished = !0);
                }
                0.001 * snowCanvas.width * snowAmount > Math.random() &&
                snows.push({
                    x: snowCanvas.width * (1.5 * Math.random() - 0.5),
                    y: -50 - 100 * Math.random(),
                    speed: 2 + Math.random() * Math.random() * 7,
                });
                if (global.gameStart) snowCanvas.remove();
                else requestAnimationFrame(updateSnow);
            };
            setInterval(() => {
                snows = snows.filter((g) => !g.vanished);
            }, 2e3);
            updateSnow();
        }
        // Firework event for new year
            let Gd = "en-US" === navigator.language && -7 <= global.timezoneLocation && -4 >= global.timezoneLocation,
            Hd = 6 === currentDate.getMonth() && 4 === currentDate.getDate(),
            Id =
            (11 === currentDate.getMonth() && 31 === currentDate.getDate()) ||
            (0 === currentDate.getMonth() && 3 >= currentDate.getDate());
        if (!global.mobile && ((Hd && Gd) || Id)) {
            let fireworkCanvas = document.createElement("canvas");
            fireworkCanvas.style.position = "absolute";
            fireworkCanvas.style.top = "0";
            document.body.insertBefore(fireworkCanvas, document.body.firstChild);
            let b = fireworkCanvas.getContext("2d"),
            d = () => {
                let k =
                "164,14,14 230,80,0 230,119,0 47,127,51 23,78,166 123,31,163".split(
                    " "
                );
                return k[Math.floor(Math.random() * k.length)];
            },
            fireworks = [],
            updateFireworks = () => {
                if (fireworkCanvas.width !== window.innerWidth || fireworkCanvas.height !== window.innerHeight)
                (fireworkCanvas.width = window.innerWidth),
                    (fireworkCanvas.height = window.innerHeight),
                    (fireworks = []),
                    b.clearRect(0, 0, fireworkCanvas.width, fireworkCanvas.height),
                    (b.fillStyle = "rgba(255,255,255,0.01)"),
                    b.fillRect(0, 0, fireworkCanvas.width, fireworkCanvas.height),
                    (b.lineWidth = 2.5),
                    (b.lineCap = "round");
                b.globalCompositeOperation = "destination-out";
                b.fillStyle = "rgba(0,0,0,0.15)";
                b.fillRect(0, 0, fireworkCanvas.width, fireworkCanvas.height);
                b.globalCompositeOperation = "lighter";
                for (var firework of fireworks) {
                    var l = firework.x,
                        t = firework.y;
                    firework.H += 0.2;
                    firework.x += firework.M;
                    firework.y += firework.H;
                    firework.H *= 0.99;
                    firework.M *= 0.99;
                    firework.time--;
                    var f = 0 < firework.time ? (firework.Oa ? 1 : 10 <= firework.time ? 1 : firework.time / 10) : 0;
                    if (0 < f) {
                        b.strokeStyle = `rgba(${firework.color},${f})`;
                        b.beginPath();
                        b.moveTo(l, t);
                        b.lineTo(firework.x, firework.y);
                        b.stroke();
                    } else {
                        if (firework.Oa && !firework.vanished) {
                            l = Math.floor(5 * Math.random()) + 30;
                            t = 0.5 * Math.random() + 3;
                            f = 25 + 5 * Math.random();
                            for (var h = 0; 2 > h; h++) {
                                let p = d();
                                for (let r = 0; r < l; r++) {
                                let v = ((r + Math.random()) / l) * Math.PI * 2,
                                    P = t + 0.5 * Math.random();
                                fireworks.push({
                                    color: p,
                                    x: firework.x,
                                    y: firework.y,
                                    M: Math.cos(v) * P,
                                    H: -0.8 + Math.sin(v) * P,
                                    time: f + 2 * Math.random(),
                                    Oa: !1,
                                    vanished: !1,
                                });
                                }
                            }
                        }
                        firework.vanished = !0;
                    }
                }
                3e-5 * fireworkCanvas.width > Math.random() &&
                ((firework = fireworkCanvas.width * Math.random()),
                (l = fireworkCanvas.height - 10),
                (t = 4 * Math.random() - 2),
                (f = 5 * Math.random() - 15),
                (h = 30 + 10 * Math.random()),
                fireworks.push({
                    color: d(),
                    x: firework,
                    y: l,
                    M: t,
                    H: f,
                    time: h,
                    Oa: !0,
                    vanished: !1,
                }));
                if (global.gameStart) a.remove();
                else requestAnimationFrame(updateFireworks);
            };
            setInterval(() => {
                fireworks = fireworks.filter((k) => !k.vanished);
            }, 2e3);
            updateFireworks();
        }
    }

    // Important functions
    toggleOptionsMenu();
    tabOptionsMenuSwitcher();
    customThemeDisplayHandler();
    snowAndFireworkEffects();

    // Prepare canvas
    function resizeEvent() {
        let scale = window.devicePixelRatio;
        if (config.graphical.lowResolution) {
            scale *= 0.5;
        }
        global.screenWidth = global.vscreenSize = window.innerWidth * scale;
        global.screenHeight = global.vscreenSizey = window.innerHeight * scale;
        c.resize(global.screenWidth, global.screenHeight);
        global.ratio = scale;
        global.screenSize = Math.min(1920, Math.max(window.innerWidth, 1280));
    }

    window.resizeEvent = resizeEvent;
    global.canvas = new Canvas();
    var c = global.canvas.cv;
    var ctx = [
        document.getElementById("gameCanvas-background").getContext("2d"),
        document.getElementById("gameCanvas-gameplay").getContext("2d"),
        document.getElementById("gameCanvas-gui").getContext("2d"),
    ];
    var c2 = document.createElement("canvas");
    var ctx2 = c2.getContext("2d");
    ctx2.imageSmoothingEnabled = false;

    // Animation things
    function Smoothbar(value, speed, sharpness = 3, lerpValue = 0.025, syncWithfps = false) {
        let time = Date.now();
        let display = value;
        let oldvalue = value;
        return {
            set: (val) => {
                if (value !== val) {
                    oldvalue = display;
                    value = val;
                    time = Date.now();
                }
            },
            get: (round = false) => {
                display = util.lerp(display, value, lerpValue, syncWithfps);
                if (Math.abs(value - display) < 0.1 && round) display = value;
                return display;
            },
            force: (val) => {
                display = value = val;
            },
        };
    };

    function AdvancedSmoothBar(a, b, d = 3) {
        let value = a;
        let speed = b;
        let h = d;
        let time = Date.now();
        let display;
        let S = display = a;
        let set = (a) => {
            value !== a &&
                ((S = get()), (value = a), (time = Date.now()));
        };
        let get = () => {
            let a = (Date.now() - time) / 1e3;
            return (display =
                a >= speed ? value : S + (value - S) * Math.pow(a / speed, 1 / h));
        };
        return {
            set: (a) => set(a),
            get: () => get(),
            force: (val) => {
                display = value = val;
            },
        }
    };

    // Prepare the player
    global.player = global.initPlayer();
    function calculateTarget() {
        if (!global.canvas.mouseMoved) return;
        global.target.x = global.mouse.x - (global.player.screenx / global.screenWidth * global.canvas.width + global.canvas.width / 2);
        global.target.y = global.mouse.y - (global.player.screeny / global.screenHeight * global.canvas.height + global.canvas.height / 2);
        if (global.canvas.reverseDirection) global.reverseTank = -1;
        else global.reverseTank = 1;
        global.target.x *= global.screenWidth / global.canvas.width;
        global.target.y *= global.screenHeight / global.canvas.height;
        return global.target;
    };

    let CalcScreenSize = () => Math.max(global.vscreenSize, (16 / 9) * global.vscreenSizey) / global.player.renderv,
        handleScreenDistance = (alpha, instance, fade = true) => {
            let indexes = instance.index.split("-"),
            m = global.mockups[parseInt(indexes[0])] ?? global.missingno[0];
            switch (fade) {
                case true: 
                    GetScreenDistance(instance.render.x - global.player.loc.x, instance.render.y - global.player.loc.y, instance.size) ||
                    (alpha *= GetScreenDistanceF(instance.render.x - global.player.loc.x, instance.size));
                    (alpha *= GetScreenDistanceV(instance.render.y - global.player.loc.y, instance.size));
                    break;
                case false:
                    let size = instance.size;
                    size *= m.position.axis;
                    let realSize = size.toFixed(0);
                    alpha *= GetScreenDistance(instance.render.x - global.player.loc.x, instance.render.y - global.player.loc.y, parseInt(realSize));
                    break;
            }
            return alpha;
        },
        GetScreenDistance = (a, b, d) => {
            d += 6;
            let e = 2 * CalcScreenSize();
            return (
                (a + d) * e > -global.vscreenSize &&
                (a - d) * e < global.vscreenSize &&
                (b + d) * e > -global.vscreenSizey &&
                (b - d) * e < global.vscreenSizey
            );
        },
        GetScreenDistanceF = (a, b) => {
            b += 6;
            let d = 2 * CalcScreenSize();
            return Math.max(
                0,
                Math.min(1, 2 + (-a + global.vscreenSize / d) / b, 2 + (a + global.vscreenSize / d) / b)
            );
        },
        GetScreenDistanceV = (a, b) => {
            b += 6;
            let d = 2 * CalcScreenSize();
            return Math.max(
                0,
                Math.min(1, 2 + (a + global.vscreenSizey / d) / b, 2 + (-a + global.vscreenSizey / d) / b)
            );
        };

    function parseTheme(string, logError = true) {
        // Decode from base64
        try {
            var stripped = string.replace(/\s+/g, "");
            2 == stripped.length % 4 ? (stripped += "==") : 3 == stripped.length % 4 && (stripped += "=");
            let data = atob(stripped);
            let name = 'Unknown Theme',
                author = '';
            let index = data.indexOf('\x00');
            if (index === -1) return null;
            name = data.slice(0, index) || name;
            data = data.slice(index + 1);
            index = data.indexOf('\x00');
            if (index === -1) return null;
            author = data.slice(0, index) || author;
            data = data.slice(index + 1);
            let border = data.charCodeAt(0) / 0xff;
            data = data.slice(1);
            let paletteSize = Math.floor(data.length / 3);
            if (paletteSize < 2) return null;
            let colorArray = [];
            for (let i = 0; i < paletteSize; i++) {
                let red = data.charCodeAt(i * 3)
                let green = data.charCodeAt(i * 3 + 1)
                let blue = data.charCodeAt(i * 3 + 2)
                let color = (red << 16) | (green << 8) | blue
                colorArray.push('#' + color.toString(16).padStart(6, '0'))
            }
            let content = {
                teal: colorArray[0],
                lgreen: colorArray[1],
                orange: colorArray[2],
                yellow: colorArray[3],
                aqua: colorArray[4],
                pink: colorArray[5],
                vlgrey: colorArray[6],
                lgrey: colorArray[7],
                guiwhite: colorArray[8],
                black: colorArray[9],

                blue: colorArray[10],
                green: colorArray[11],
                red: colorArray[12],
                gold: colorArray[13],
                purple: colorArray[14],
                magenta: colorArray[15],
                grey: colorArray[16],
                dgrey: colorArray[17],
                white: colorArray[18],
                guiblack: colorArray[19],

                paletteSize,
                border,
            }
            return { name, author, content };
        } catch { }
        // Decode from JSON
        try {
            let output = JSON.parse(string);
            if (typeof output !== 'object')
                return null;
            let { name = 'Unknown Theme', author = '', content } = output;
            for (let colorHex of [
                content.teal,
                content.lgreen,
                content.orange,
                content.yellow,
                content.aqua,
                content.lavender,
                content.pink,
                content.vlgrey,
                content.lgrey,
                content.guiwhite,
                content.black,

                content.blue,
                content.green,
                content.red,
                content.gold,
                content.purple,
                content.magenta,
                content.grey,
                content.dgrey,
                content.white,
                content.guiblack,
            ]) {
                if (!/^#[0-9a-fA-F]{6}$/.test(colorHex)) {
                    if (!content.aqua) { // old themes don't have aqua, so just warn the user
                        alert("Your theme does not an entry for \"aqua\" (the color used by Hexagons). A fallback has been provided.");
                        content.aqua = content.teal;
                    } else if (!content.lavender) { // same for lavender.
                        alert("Your theme does not an entry for \"lavender\" (the color used by the nest). A fallback has been provided.");
                        content.lavender = "#b58efd";
                    } else {
                        if (logError) { 
                            throw new Error("Unable to read the theme"); 
                        } else return {
                            name: 'Unknown Theme',
                            author: '?',
                            content: null,
                        }
                    }
                };
            }
            return {
                name: (typeof name === 'string' && name) || 'Unnamed Theme',
                author: (typeof author === 'string' && author) || '',
                content,
            }
        } catch (e) { logError && alert("An error has accoured while reading your theme, it may be corrupted or outdated."); }

        return {
            name: 'Unknown Theme',
            author: '?',
            content: null,
        };
    }
    function getThemeDisplayName(doc) {
        if (doc.value !== "") {
            let {name, author, content} = parseTheme(doc.value);
            if (content !== null) {
                let displayName = name;
                let displayAuthor = author === "" ? "" : author === "fan-made" || author === "Fan-made" || author === "Fan-Made" ? "(Fan-Made)" : `(by ${author})`;
                return {
                    name: displayName,
                    author: displayAuthor
                }
            }
        } else return {
            name: null,
            author: null,
        }
    }
    function initalizeChangelog(b, a) { // From CX Client (Modified) + decoded;
        let triggerChangelog = ( () => {
            let a = document.getElementById("changelogTabs")
            , b = a.firstElementChild
            , d = document.getElementById("patchNotes")
            , e = {};
            for (let g = 0; g < a.children.length; g++) {
                let k = a.children[g]
                , l = k.dataset.type;
                e[l] = () => {
                    if (k !== b) {
                        var u = b.dataset.type;
                        b.classList.remove("active");
                        k.classList.add("active");
                        d.classList.remove(u);
                        d.classList.add(l);
                        b = k
                    }
                }
                ;
                k.addEventListener("click", e[l])
            }
            return e
        }
        )()
        var sa = document.getElementById("patchNotes");
        var c = b.shift();
        if (c) {
            c = c.match(/^([A-Za-z ]+[A-Za-z])\s*\[([0-9\-]+)\]\s*(.+)?$/) || [c, c, null];
            var h = c[1] ? {
                    "Announcement": "announcement",
                    "Balance": "balance",
                    "Balance Update": "balance-update",
                    "Balance Update Details": "balance",
                    "Event": "event",
                    "Event Poll": "poll",
                    "Gamemode": "event",
                    "Gamemode Poll": "poll",
                    "Patch": "patch",
                    "Poll": "poll",
                    "Update": "update",
                } [c[1]] : null,
                d = document.createElement("div");
            h && d.classList.add(h);
            var y = document.createElement("b"),
                f = [c[1]];
            if (c[2]) {
                var e = new Date(c[2] + "T00:00:00Z");
                if (e > Date.now()) return;
                f.push(e.toLocaleDateString("default", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC"
                }))
            }
            c[3] && f.push(c[3]);
            y.innerHTML = f.join(" - ");
            d.appendChild(y);
            let g = document.createElement("ul");
            let l;
            for (let n of b) l = document.createElement("li"), l.innerHTML = n, g.appendChild(l);
            l = g.getElementsByTagName("a");
            for (a = 0; a < l.length; a++) {
                let u = l[a];
                if (!u.href) continue;
                let p = u.href.lastIndexOf("#");
                -1 !== p && (p = u.href.slice(p + 1),
                "options-menu" === p ? h[a].addEventListener("click", r => {
                    r.preventDefault();
                    tc()
                }
                ) : triggerChangelog[p] && h[a].addEventListener("click", r => {
                    r.preventDefault();
                    triggerChangelog[p]()
                }
                ))
            }
            d.appendChild(g)
            a && d.appendChild(document.createElement("hr"));
            sa.appendChild(d)
        }
    }

    function loadSettings() {
        config.graphical.fancyAnimations = document.getElementById("optFancy").checked;
        config.graphical.interpolation = document.getElementById("optInterpolation").checked;
        config.graphical.lerpAnimations = document.getElementById("optLerpAnim").checked;
        config.graphical.smoothcamera = document.getElementById("smoothCamera").checked;
        config.graphical.pointy = document.getElementById("optPointy").checked;
        config.graphical.curvyTraps = document.getElementById("optCurvyTraps").checked;
        config.game.autoLevelUp = document.getElementById("autoLevelUp").checked;
        config.game.centeredMinimap = document.getElementById("optCenterMinimap").checked;
        config.lag.unresponsive = document.getElementById("optPredictive").checked;
        config.graphical.sharpEdges = document.getElementById("optSharpEdges").checked;
        config.graphical.coloredHealthbars = document.getElementById("coloredHealthbars").checked;
        config.graphical.separatedHealthbars = document.getElementById("separatedHealthbars").checked;
        config.graphical.lowResolution = document.getElementById("optLowResolution").checked;
        config.graphical.showGrid = !document.getElementById("optNoGrid").checked;
        config.graphical.coloredNest = document.getElementById("optColoredNest").checked;
        config.graphical.slowerFOV = document.getElementById("optSlowerFOV").checked;
        config.graphical.optimizeMode = document.getElementById("optOptimizeMode").checked;
        // GUI
        global.GUIStatus.renderGUI = document.getElementById("optRenderGui").checked;
        global.GUIStatus.renderLeaderboard = document.getElementById("optRenderLeaderboard").checked;
        global.GUIStatus.renderUpgrades = document.getElementById("optRenderUpgrades").checked;
        global.GUIStatus.renderMinimap = document.getElementById("optRenderMinimap").checked;
        global.GUIStatus.renderPlayerNames = document.getElementById("optRenderNames").checked;
        global.GUIStatus.renderPlayerScores = document.getElementById("optRenderScores").checked;
        global.GUIStatus.renderPlayerBars = document.getElementById("optRenderPlayerBars").checked;
        global.GUIStatus.renderPlayerKillbar = document.getElementById("optRenderKillbar").checked;
        global.GUIStatus.renderhealth = document.getElementById("optRenderHealth").checked;
        global.GUIStatus.minimapReducedInfo = document.getElementById("optReducedInfo").checked;
        global.GUIStatus.fullHDMode = document.getElementById("optFullHD").checked;
        global.mobileStatus.enableCrosshair = document.getElementById("showCrosshair").checked;
        global.mobileStatus.showJoysticks = document.getElementById("showJoystick").checked;
        // Game
        config.game.incognitoMode = document.getElementById("optIncognitoMode").checked;
        switch (document.getElementById("optBorders").value) {
            case "normal":
                config.graphical.darkBorders = config.graphical.neon = false;
                break;
            case "dark":
                config.graphical.darkBorders = true;
                config.graphical.neon = false;
                break;
            case "glass":
                config.graphical.darkBorders = false;
                config.graphical.neon = true;
                break;
            case "neon":
                config.graphical.darkBorders = config.graphical.neon = true;
                break;
        }
        switch (document.getElementById("optMobile").value) {
            case "desktop":
                global.mobile = false;
                break;
            case "mobileWithBigJoysticks":
                global.mobileStatus.useBigJoysticks = true;
                break;
        }
        global.autoScale = false;
        switch (document.getElementById("optUiScale").value) {
            case "auto":
                global.autoScale = true;
                break;
            case "small":
                global.UIscale = 2560;
                break;
            case "normal":
                global.UIscale = 1920;
                break;
            case "large":
                global.UIscale = 1536;
                break;
            case "mobile":
                global.UIscale = 1280;
                break;
        }
        util.submitToLocalStorage("optColors");
        let a = document.getElementById("optColors").value;
        color = colors[a === "" ? "normal" : a];
        if (a == "custom") {
            let customTheme = document.getElementById("optCustom").value;
            color = parseTheme(customTheme).content;
            util.submitToLocalStorage("optCustom");
        }
        gameDraw.color = color;
        gameDraw.colorCache = {};
        global.refreshMonitorColoring(gameDraw);
    }

    function startGame() {
        // Set flag
        if (global.gameLoading) return;
        global.gameLoading = true;
        if (global.mobile) {
            var d = document.body;
            d.requestFullscreen ? d.requestFullscreen()
                : d.msRequestFullscreen ? d.msRequestFullscreen()
                    : d.mozRequestFullScreen ? d.mozRequestFullScreen()
                        : d.webkitRequestFullscreen && d.webkitRequestFullscreen();
        }

        // Save forms and get options
        util.submitToLocalStorage("optFancy");
        util.submitToLocalStorage("optLowResolution");
        util.submitToLocalStorage("smoothCamera");
        util.submitToLocalStorage("optBorders");
        util.submitToLocalStorage("optPointy");
        util.submitToLocalStorage("optCurvyTraps");
        util.submitToLocalStorage("optInterpolation");
        util.submitToLocalStorage("optLerpAnim");
        util.submitToLocalStorage("optOptimizeMode");
        util.submitToLocalStorage("optCenterMinimap");
        util.submitToLocalStorage("autoLevelUp");
        util.submitToLocalStorage("optMobile");
        util.submitToLocalStorage("optPredictive");
        util.submitToLocalStorage("optSharpEdges");
        util.submitToLocalStorage("optSlowerFOV");
        util.submitToLocalStorage("optRenderKillbar");
        util.submitToLocalStorage("coloredHealthbars");
        util.submitToLocalStorage("separatedHealthbars");
        util.submitToLocalStorage("optColoredNest");
        util.submitToLocalStorage("optNoGrid");
        // GUI
        util.submitToLocalStorage("optRenderGui");
        util.submitToLocalStorage("optRenderLeaderboard");
        util.submitToLocalStorage("optRenderUpgrades");
        util.submitToLocalStorage("optRenderMinimap");
        util.submitToLocalStorage("optRenderNames");
        util.submitToLocalStorage("optRenderHealth");
        util.submitToLocalStorage("optRenderScores");
        util.submitToLocalStorage("optRenderPlayerBars");
        util.submitToLocalStorage("optReducedInfo");
        util.submitToLocalStorage("showCrosshair");
        util.submitToLocalStorage("showJoystick");
        util.submitToLocalStorage("optFullHD");
        util.submitToLocalStorage("optUiScale");
        // Game
        util.submitToLocalStorage("optIncognitoMode");
        loadSettings();
        global.optionsCheckboxes = undefined;
        // Other more important stuff
        let playerNameInput = document.getElementById("playerNameInput");
        let playerKeyInput = document.getElementById("playerKeyInput");
        let autolevelUpInput = document.getElementById("autoLevelUp").checked;
        global.autolvlUp = autolevelUpInput;
        // Name and keys
        util.submitToLocalStorage("playerNameInput");
        util.submitToLocalStorage("playerKeyInput");
        global.playerName = global.player.name = playerNameInput.value;
        global.playerKey = playerKeyInput.value.replace(/(<([^>]+)>)/gi, "").substring(0, 64);
        // Change the screen
        global.screenWidth = window.innerWidth;
        global.screenHeight = window.innerHeight;
        document.getElementById("startMenuWrapper").style.top = "-700px";
        setTimeout(() => {
            document.getElementById("startMenuWrapper").style.display = "none";
        }, 1e3);

        global.gameConnecting = true;
        // Connect to the server.
        global.socket = socketInit();
        // initialize canvas.
        global.canvas.socket = global.socket;
        global.socketMotionCycle = setInterval(() => moveCompensation.iterate(global.socket.cmd.getMotion()), 1e3 / 40);
        if (!global.playerTotalInterval) global.playerTotalInterval = setInterval(() => util.pullTotalPlayers(), 20000);
        if (!global.canvas.initalized) global.canvas.init();
        document.getElementById("gameAreaWrapper").style.display = "block";
        document.getElementById("gameCanvas").focus();
        window.onbeforeunload = () => (global.gameStart && !global.died && !global.disconnected ? !0 : null);
        // Start client if it didnt start yet
        !global.clientStarted && startClient();
    }
    global.startGame = () => startGame();
    function startClient() {
        animloop(); // Start the client
        global.clientStarted = true; // Set flag
    }

    // Start animation
    window.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || (callback => setTimeout(callback, 1000 / 60));
    window.cancelAnimFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
    // Drawing states
    const statMenu = Smoothbar(0, 2, 0.1, 0.08, 0.025, true);
    const upgradeMenu = Smoothbar(0, 2, 3, 0.08, 0.025, true);
    const mobileUpgradeGlide = Smoothbar(0, 2, 3, 0.08, 0.025, true);
    const lbGlide = AdvancedSmoothBar(0, 0.3, 1.5);
    const chatInput = Smoothbar(0, 2, 0.1, 0.07, 0.025, true);

    // Define the graph constructor
    function graph() {
        var data = [];
        return (point, x, y, w, h, col) => {
            // Add point and push off old ones
            data.push(point);
            while (data.length > w) {
                data.splice(0, 1);
            }
            // Get scale
            let min = Math.min(...data),
                max = Math.max(...data),
                range = max - min;
            // Draw zero
            if (max > 0 && min < 0) {
                drawBar(x, x + w, y + (h * max) / range, 2, color.guiwhite);
            }
            // Draw points
            ctx[2].beginPath();
            let i = -1;
            for (let p of data) {
                if (!++i) {
                    ctx[2].moveTo(x, y + (h * (max - p)) / range);
                } else {
                    ctx[2].lineTo(x + i, y + (h * (max - p)) / range);
                }
            }
            ctx[2].lineWidth = 1;
            ctx[2].strokeStyle = col;
            ctx[2].stroke();
        };
    }

    // Protected functions
    function interpolate(p1, p2, v1, v2, ts, tt) {
        let k = Math.cos((1 + tt) * Math.PI);
        return 0.5 * (((1 + tt) * v1 + p1) * (k + 1) + (-tt * v2 + p2) * (1 - k));
    }

    function extrapolate(p1, p2, v1, v2, ts, tt) {
        return p2 + (p2 - p1) * tt;
    }

    // Useful thing
    let modulo = function (a, n) {
        return ((a % n) + n) % n;
    };
    function angleDifference(sourceA, targetA) {
        let a = targetA - sourceA;
        return modulo(a + Math.PI, 2 * Math.PI) - Math.PI;
    }

    // Lag compensation functions
    const compensation = () => {
        // Protected vars
        let t = 0,
            tt = 0,
            ts = 0;
        // Methods
        return {
            set: (
                time = global.player.time,
                interval = global.metrics.rendergap
            ) => {
                t = Math.max(getNow() - time - 80, -interval);
                if (t > 150 && t < 1000) {
                    t = 150;
                }
                if (t > 1000) {
                    t = (1000 * 1000 * Math.sin(t / 1000 - 1)) / t + 1000;
                }
                tt = t / interval;
                ts = 30 * config.roomSpeed * t / 1E3;
            },
            predict: (p1, p2, v1, v2) => {
                return t >= 0
                    ? extrapolate(p1, p2, v1, v2, ts, tt)
                    : interpolate(p1, p2, v1, v2, ts, tt);
            },
            predictFacing: (f1, f2) => {
                return f1 + (1 + tt) * angleDifference(f1, f2);
            },
            getPrediction: () => {
                return t;
            },
        };
    };

    // Make graphs
    const timingGraph = graph(),
        lagGraph = graph(),
        gapGraph = graph();

    // The skill bar dividers
    let skas = [];
    for (let i = 1; i <= 256; i++) { //if you want to have more skill levels than 255, then update this
        skas.push((i - 2) * 0.01 + Math.log(4 * (i / 9) + 1) / 1.513);
    }
    const ska = (x) => skas[x];
    var getClassUpgradeKey = function (number) {
        switch (number) {
            case 0:
                return "Y";
            case 1:
                return "U";
            case 2:
                return "I";
            case 3:
                return "H";
            case 4:
                return "J";
            case 5:
                return "K";
            default:
                return null;
        }
    };

    let tiles,
        branches,
        tankTree,
        measureSize = (x, y, colorIndex, { index, tier = 0 }) => {
            tiles.push({ x, y, colorIndex, index });
            let { upgrades } = global.mockups[parseInt(index)],
                xStart = x,
                cumulativeWidth = 1,
                maxHeight = 1,
                hasUpgrades = [],
                noUpgrades = [];
            for (let i = 0; i < upgrades.length; i++) {
                let upgrade = upgrades[i];
                if (global.mockups[upgrade.index].upgrades.length) {
                    hasUpgrades.push(upgrade);
                } else {
                    noUpgrades.push(upgrade);
                }
            }
            for (let i = 0; i < hasUpgrades.length; i++) {
                let upgrade = hasUpgrades[i],
                    spacing = 2 * Math.max(1, upgrade.tier - tier),
                    measure = measureSize(x, y + spacing, upgrade.upgradeColor ?? i, upgrade);
                branches.push([{ x, y: y + Math.sign(i) }, { x, y: y + spacing + 1 }]);
                if (i === hasUpgrades.length - 1 && !noUpgrades.length) {
                    branches.push([{ x: xStart, y: y + 1 }, { x, y: y + 1 }]);
                }
                x += measure.width;
                cumulativeWidth += measure.width;
                if (maxHeight < measure.height) maxHeight = measure.height;
            }
            y++;
            for (let i = 0; i < noUpgrades.length; i++) {
                let upgrade = noUpgrades[i],
                    height = 2 + upgrades.length;
                measureSize(x, y + 1 + i + Math.sign(hasUpgrades.length) * 2, upgrade.upgradeColor ?? i, upgrade);
                if (i === noUpgrades.length - 1) {
                    if (hasUpgrades.length > 1) cumulativeWidth++;
                    branches.push([{ x: xStart, y }, { x, y }]);
                    branches.push([{ x, y }, { x, y: y + noUpgrades.length + Math.sign(hasUpgrades.length) * 2 }]);
                }
                if (maxHeight < height) maxHeight = height;
            }
            return {
                width: cumulativeWidth,
                height: 2 + maxHeight,
            };
        };

    function generateTankTree(indexes) {
        tiles = [];
        branches = [];
        tankTree = { width: 0, height: 0 };
        let rightmostSoFar = 0;
        if (!Array.isArray(indexes)) indexes = [indexes];
        for (let index of indexes) {
            rightmostSoFar += 3 + measureSize(rightmostSoFar, 0, 0, { index }).width;
        }
        for (let { x, y } of tiles) {
            tankTree.width = Math.max(tankTree.width, x);
            tankTree.height = Math.max(tankTree.height, y);
        }
    };

    // Background clearing
    function clearScreen(clearColor, alpha, context) {
        context.fillStyle = clearColor;
        context.globalAlpha = alpha;
        context.fillRect(0, 0, global.screenWidth, global.screenHeight);
        context.globalAlpha = 1;
    }

    // Text functions
    const fontWidth = "bold";
    function measureText(text, fontSize, withHeight = false) {
        fontSize += config.graphical.fontSizeBoost;
        ctx[2].font = fontWidth + " " + fontSize + "px Ubuntu";
        let measurement = ctx[2].measureText(arrayifyText(text).reduce((a, b, i) => (i & 1) ? a : a + b, ''));
        return withHeight ? { width: measurement.width, height: fontSize } : measurement.width;
    }

    // Init stuff
    function arrayifyText(rawText) {
        //we want people to be able to use the section sign in writing too
        // string with double §           txt   col   txt                      txt
        // "...§text§§text§..." => [..., "text", "", "text", ...] => [..., "text§text", ...]
        // this code is balanced on tight threads, holy shit
        let textArrayRaw = rawText.split('§'),
            textArray = [];
        if (!(textArrayRaw.length & 1)) {
            textArrayRaw.unshift('');
        }
        while (textArrayRaw.length) {
            let first = textArrayRaw.shift();
            if (!textArrayRaw.length) {
                textArray.push(first);
            } else if (textArrayRaw[1]) {
                textArray.push(first, textArrayRaw.shift());
            } else {
                textArrayRaw.shift();
                textArray.push(first + '§' + textArrayRaw.shift(), textArrayRaw.shift());
            }
        }
        return textArray;
    }

    function drawText(rawText, x, y, size, defaultFillStyle, align = "left", center = false, fade = 1, stroke = true, context = ctx[2]) {
        size += config.graphical.fontSizeBoost;
        // Get text dimensions and resize/reset the canvas
        let offset = size / 5,
            ratio = 1,
            textArray = arrayifyText(rawText),
            renderedFullText = textArray.reduce((a, b, i) => (i & 1) ? a : a + b, '');

        if (ratio !== 1) {
            size *= ratio;
        }
        context.font = "bold " + size + "px Ubuntu";

        let Xoffset = offset,
            Yoffset = (size + 2 * offset) / 2,
            alignMultiplier = 0;

        switch (align) {
            //case "left":
            //    //do nothing.
            //    break;
            case "center":
                alignMultiplier = 0.5;
                break;
            case "right":
                alignMultiplier = 1;
        }
        if (alignMultiplier) {
            Xoffset -= context.measureText(renderedFullText).width * alignMultiplier;
        }

        // Draw it
        let strokeRatio = typeof stroke === "number" ? stroke : config.graphical.fontStrokeRatio;
        context.lineWidth = (size + 1) / strokeRatio;
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.strokeStyle = color.black;
        context.fillStyle = defaultFillStyle;
        context.save();
        context.lineCap = "round";
        context.lineJoin = "round";
        if (ratio !== 1) {
            context.scale(1 / ratio, 1 / ratio);
        }

        Xoffset += x * ratio - size / 4; //this extra size-dependant margin is a guess lol // apparently this guess worked out to be a hella good one
        Yoffset += y * ratio - Yoffset * (center ? 1.05 : 1.5);
        if (stroke) {
            context.strokeText(renderedFullText, Xoffset, Yoffset);
        }
        for (let i = 0; i < textArray.length; i++) {
            let str = textArray[i];

            // odd index = this is a color to set the fill style to
            if (i & 1) {

                //reset color to default
                if (str === "reset") {
                    context.fillStyle = defaultFillStyle;
                } else {
                    str = gameDraw.getColor(str) ?? str;
                }
                context.fillStyle = str;

            } else {
                // move forward a bit taking the width of the last piece of text + "kerning" between
                // the last letter of last text and the first letter of current text,
                // making it align perfectly with what we drew with strokeText earlier
                if (i) {
                    Xoffset += context.measureText(textArray[i - 2] + str).width - context.measureText(str).width;
                }
                context.fillText(str, Xoffset, Yoffset);
            }
        }
        context.restore();
    }

    // Gui drawing functions
    function scaleScreenRatio(by, unset) {
        global.screenWidth /= by;
        global.screenHeight /= by;
        ctx[0].scale(by, by);
        ctx[1].scale(by, by);
        ctx[2].scale(by, by);
        if (!unset) ratio *= by;
    };

    function drawGuiRect(x, y, length, height, stroke = false) {
        switch (stroke) {
            case true:
                ctx[2].strokeRect(x, y, length, height);
                break;
            case false:
                ctx[2].fillRect(x, y, length, height);
                break;
        }
    }

    function drawGuiCircle(x, y, radius, stroke = false) {
        ctx[2].beginPath();
        ctx[2].arc(x, y, radius, 0, Math.PI * 2);
        stroke ? ctx[2].stroke() : ctx[2].fill();
    }

    function drawGuiLine(x1, y1, x2, y2) {
        ctx[2].beginPath();
        ctx[2].lineTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
        ctx[2].lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
        ctx[2].closePath();
        ctx[2].stroke();
    }

    function drawBar(x1, x2, y, width, color, context = ctx[2]) {
        context.beginPath();
        context.lineTo(x1, y);
        context.lineTo(x2, y);
        context.lineWidth = width;
        if (color) context.strokeStyle = color;
        context.closePath();
        context.stroke();
    }


    function drawBarStroke(x1, y, width, color, h2) {
        ctx[2].lineWidth = 2.5;
        ctx[2].strokeStyle = color;
        ctx[2].beginPath();
        ctx[2].moveTo(x1, y);
        ctx[2].lineTo(x1 + width, y);
        ctx[2].arc(x1 + width, y + h2 / 2, h2 / 2, -Math.PI / 2, Math.PI / 2);
        ctx[2].lineTo(x1, y + h2);
        ctx[2].arc(x1, y + h2 / 2, h2 / 2, Math.PI / 2, -Math.PI / 2);
        ctx[2].stroke();
    }

    function drawBarAdvanced(x1, x2, y, width, color, h2) {
        ctx[2].beginPath();
        ctx[2].roundRect(x1 - width / 2, y - width / 2, x2 - x1 + width, h2 + width, [width / 2]);
        ctx[2].fillStyle = color;
        ctx[2].fill();
    }

    function drawButton(x, y, width, height, alpha, type = "rect", text, textSize, color1, color2, color3, clickable = false, clickType, clickableRatio, index) {
        // If width is set to true, that means we want to calculate it on the text's length.
        if (width == true) width = measureText(text, height);
        // Set the clickable's position
        if (clickable) {
            switch (index) {
                case false:
                    global.clickables[clickType].set((x - width / 2) * clickableRatio, y * clickableRatio, width * clickableRatio, height * clickableRatio);
                    break;
                default:
                    global.clickables[clickType].place(index, (x - width / 2) * clickableRatio, y * clickableRatio, width * clickableRatio, height * clickableRatio);
                    break;
            }
        }
        let hover = false;
        if (clickable) hover = global.clickables[clickType].check({ x: global.mouse.x, y: global.mouse.y });
        // Draw boxes
        ctx[2].globalAlpha = 0.5 * alpha;
        ctx[2].fillStyle = color1 ? color1 : color.grey;
        if (type == "rect") drawGuiRect(x - width / 2, y, width, height);
        else if (type == "bar") drawBar(x - width / 2, x + width / 2, y + height / 2, height, color1 ? color1 : color.grey);
        ctx[2].globalAlpha = 0.1 * alpha;
        // Shaders
        if (clickable && (index !== false && hover == index) || hover === true) {
            if (global.clickables.clicked) {
                ctx[2].globalAlpha = 0.2 * alpha;
                ctx[2].fillStyle = color.black;
            } else {
                ctx[2].globalAlpha = 0.15 * alpha;
                ctx[2].fillStyle = color.guiwhite;
            }
            if (type == "rect") drawGuiRect(x - width / 2, y, width, height);
            else if (type == "bar") drawBar(x - width / 2, x + width / 2, y + height / 2, height, false)
            
        }
        ctx[2].fillStyle = color2 ? color2 : color.black;
        if (type == "rect") drawGuiRect(x - width / 2, y + height * 0.6, width, height * 0.4);
        else if (type == "bar") drawBar(x - width / 1.9, x + width / 1.9, y + height * 0.7, height * 0.6, color2 ? color2 : color.black);
        ctx[2].globalAlpha = 1 * alpha;
        ctx[2].fillStyle = color.guiwhite;
        ctx[2].strokeStyle = color.black;

        // Draw text
        if (text) drawText(text, x, y + height * 0.5, textSize ? textSize : height * 0.6, color.guiwhite, "center", true);

        // Draw the borders
        ctx[2].strokeStyle = color3 ? color3 : color.black;
        ctx[2].lineWidth = 3;
        if (type == "rect") drawGuiRect(x - width / 2, y, width, height, true);
        else if (type == "bar") drawBarStroke(x - width / 2, y, width, color3 ? color3 : color.black, height);
    }
    // Entity drawing (this is a function that makes a function)
    const drawEntity = (() => {
        let drawPolyImgs = [],
        drawPoly3D = new Map(),
        drawPoly4D = new Map(),
        cameraFor3dProjection = { x: 0, y: 0, z: -1 },
        cameraFor4dProjection = { x: 0, y: 0, z: 0, w: -1 },
        projectPoint3d = p => {
            if (p.z == 0) return p;
            p.x /= p.z - cameraFor3dProjection.z;
            p.y /= p.z - cameraFor3dProjection.z;
            p.z = 0;
            return p;
        },
        projectPoint4d = p => {
            if (p.w == 0) return projectPoint3d(p);
            p.x /= p.w - cameraFor4dProjection.w;
            p.y /= p.w - cameraFor4dProjection.w;
            p.z /= p.w - cameraFor4dProjection.w;
            p.w = 0;
            return projectPoint3d(p);
        },
        rotatePointXY = (p, angle) => {
            let q = {
                x: 0,
                y: 0,
                z: 0
            };
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            q.x = p.x * cos + p.z * sin;
            q.z = -p.x * sin + p.z * cos;
            q.y = p.y * cos - q.z * sin;
            q.z = p.y * sin + q.z * cos;
            return q;
        },
        rotatePointXYZ = (p, angle) => {
            let q = {
                x: 0,
                y: 0,
                z: 0,
                w: 0
            };
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            q.x = p.x * cos + p.z * sin;
            q.z = -p.x * sin + p.z * cos;
            q.y = p.y * cos - q.z * sin;
            q.z = p.y * sin + q.z * cos;
            let y = q.y;
            q.y = y * cos - p.w * sin;
            q.w = y * sin + p.w * cos;
            let z = q.z;
            q.z = z * cos - p.w * sin;
            q.w = z * sin + p.w * cos;
            return q;
        },
        distanceBetweenPointsSquared3d = (a, b) => {
            let dx = b.x - a.x,
                dy = b.y - a.y,
                dz = b.z - a.z;
            return dx * dx + dy * dy + dz * dz;
        },
        distanceBetweenPointsSquared4d = (a, b) => {
            let dx = b.x - a.x,
                dy = b.y - a.y,
                dz = b.z - a.z,
                dw = b.w - a.w;
            return dx * dx + dy * dy + dz * dz + dw * dw;
        },
        sortSides3d = (arr, a, b) => {
            let aAvgZ = 0,
                bAvgZ = 0,
                aDist = 0,
                bDist = 0;
            for (let i = 0; i < a.length; ++i) {
                aAvgZ += arr[a[i]].z;
                aDist += distanceBetweenPointsSquared3d(
                    cameraFor3dProjection,
                    arr[a[i]]
                );
            }
            for (let i = 0; i < b.length; ++i) {
                bAvgZ += arr[b[i]].z;
                bDist += distanceBetweenPointsSquared3d(
                    cameraFor3dProjection,
                    arr[b[i]]
                );
            }
            aAvgZ /= a.length;
            bAvgZ /= b.length;
            aDist /= a.length * a.length;
            bDist /= b.length * b.length;
            return (bAvgZ - aAvgZ) * 1e3 + (bDist - aDist);
        },
        sortSides4d = (arr, a, b) => {
            let aAvgW = 0,
                bAvgW = 0,
                aDist = 0,
                bDist = 0;
            for (let i = 0; i < a.length; ++i) {
                aAvgW += arr[a[i]].w;
                aDist += distanceBetweenPointsSquared4d(
                    cameraFor4dProjection,
                    arr[a[i]]
                );
            }
            for (let i = 0; i < b.length; ++i) {
                bAvgW += arr[b[i]].w;
                bDist += distanceBetweenPointsSquared4d(
                    cameraFor4dProjection,
                    arr[b[i]]
                );
            }
            aAvgW /= a.length;
            bAvgW /= b.length;
            aDist /= a.length * a.length;
            bDist /= b.length * b.length;
            return (
                ((bAvgW - aAvgW) * 1e3 + (bDist - aDist)) * 1e3 +
                sortSides3d(arr, a, b)
            );
        },
        DEAIC = (assignedContext, Alpha, shape, glow, gunLength, turretsLength) => { // AKA: Draw entity as image check
            if (global.gameUpdate && config.graphical.fancyAnimations && Alpha < 1 && assignedContext != ctx2) {
                if (config.graphical.optimizeMode) {
                    if (gunLength > 0 || turretsLength > 0 || glow.radius) return true;
                    return false;
                } else if (shape !== 0 || gunLength > 0 || turretsLength > 0 || glow.radius) {
                    return true;
                }
            }
            return false;   
        },
        // Draw body function, (AKA: drawPoly)
        drawBody = (context, centerX, centerY, radius, sides, angle = 0, borderless, fill, imageInterpolation, hasGlow = false) => {
            try {
                // Start drawing
                context.beginPath();
                if (sides instanceof Array) {
                    let dx = Math.cos(angle);
                    let dy = Math.sin(angle);
                    for (let [x, y] of sides)
                        context.lineTo(
                            centerX + radius * (x * dx - y * dy),
                            centerY + radius * (y * dx + x * dy)
                        );
                } else {
                    if ("string" === typeof sides) {
                        if (sides.startsWith('image=')) {
                            const defaultDirectory = sides.startsWith("image=/");
                            const clientRootDirectory = sides.startsWith("image=./");
                            const onlineDirectory = sides.startsWith("image=https");
                            drawPolyImgs[sides] = new Image();
                            drawPolyImgs[sides].src = 
                            defaultDirectory ? 
                            `img${sides.slice(6)}` : 
                            clientRootDirectory || onlineDirectory ?
                            `${onlineDirectory ? sides.slice(6) : sides.slice(7)}` : 
                            "img/missingno.png";
                            drawPolyImgs[sides].onerror = function() {
                                drawPolyImgs[sides].src = "img/missingno.png";
                            }
        
                            let img = drawPolyImgs[sides];
                            context.translate(centerX, centerY);
                            context.rotate(angle);
                            context.imageSmoothingEnabled = imageInterpolation;
                            const imageSize = radius / 1.09;
                            context.drawImage(img, -imageSize, -imageSize, imageSize * 2, imageSize * 2);
                            context.imageSmoothingEnabled = true;
                            context.rotate(-angle);
                            context.translate(-centerX, -centerY);
                            return;
                        }
                        if (sides.startsWith('3d=')) {
                            let polygon3d = drawPoly3D.get(sides);
                            if (!polygon3d) {
                                let dividedParts = sides.slice(3).split('/');
                                let vertexesRaw = dividedParts[0].split(',').map(Number);
                                if (vertexesRaw.length % 3 != 0) {
                                    throw new Error(
                                        '3D Shape cannot be rendered. Vertexes count: ' +
                                            vertexesRaw.length / 3
                                    );
                                }
                                let vertexes = Array(vertexesRaw.length / 3);
                                for (let i = 0; i < vertexesRaw.length; i += 3) {
                                    vertexes[i / 3] = {
                                        x: vertexesRaw[i],
                                        y: vertexesRaw[i + 1],
                                        z: vertexesRaw[i + 2]
                                    };
                                }
                                let indicesRaw = dividedParts[1].split(';');
                                let indices = [];
                                for (let i = 0; i < indicesRaw.length; ++i) {
                                    indices.push(indicesRaw[i].split(',').map(Number));
                                }
                                polygon3d = {
                                    vertexes,
                                    indices,
                                    multiplier: Number(dividedParts[2])
                                };
                                drawPoly3D.set(sides, polygon3d);
                            }
                            const rotated = polygon3d.vertexes
                                .slice()
                                .map(p => rotatePointXY(p, angle));
                            const sortedSides = polygon3d.indices
                                .slice()
                                .sort((a, b) => sortSides3d(rotated, a, b));
                            context.lineWidth /= 2;
                            const size = radius * polygon3d.multiplier;
                            for (const sides of sortedSides) {
                                context.beginPath();
                                for (let i = 0; i < sides.length; ++i) {
                                    const a = projectPoint3d(rotated[sides[i]]);
                                    const b = projectPoint3d(
                                        rotated[sides[(i + 1) % sides.length]]
                                    );
                                    context.lineTo(
                                        centerX + a.x * size,
                                        centerY + a.y * size,
                                        centerX + b.x * size,
                                        centerY + b.y * size
                                    );
                                }
                                context.closePath();
                                context.fill();
                                context.stroke();
                            }
                            return;
                        }
                        if (sides.startsWith('4d=')) {
                            let polygon4d = drawPoly4D.get(sides);
                            if (!polygon4d) {
                                let dividedParts = sides.slice(3).split('/');
                                let vertexesRaw = dividedParts[0].split(',').map(Number);
                                if (vertexesRaw.length % 4 != 0) {
                                    throw new Error(
                                        '4D Shape cannot be rendered. Vertexes count: ' +
                                            vertexesRaw.length / 4
                                    );
                                }
                                let vertexes = Array(vertexesRaw.length / 4);
                                for (let i = 0; i < vertexesRaw.length; i += 4) {
                                    vertexes[i / 4] = {
                                        x: vertexesRaw[i],
                                        y: vertexesRaw[i + 1],
                                        z: vertexesRaw[i + 2],
                                        w: vertexesRaw[i + 3]
                                    };
                                }
                                let indicesRaw = dividedParts[1].split(';');
                                let indices = [];
                                for (let i = 0; i < indicesRaw.length; ++i) {
                                    indices.push(indicesRaw[i].split(',').map(Number));
                                }
                                polygon4d = {
                                    vertexes,
                                    indices,
                                    multiplier: Number(dividedParts[2])
                                };
                                drawPoly4D.set(sides, polygon4d);
                            }
                            const rotated = polygon4d.vertexes
                                .slice()
                                .map(p => rotatePointXYZ(p, angle));
                            const sortedSides = polygon4d.indices
                                .slice()
                                .sort((a, b) => sortSides4d(rotated, a, b));
                            context.lineWidth /= 2;
                            const size = radius * polygon4d.multiplier;
                            for (const sides of sortedSides) {
                                context.beginPath();
                                for (let i = 0; i < sides.length; ++i) {
                                    const a = projectPoint4d(rotated[sides[i]]);
                                    const b = projectPoint4d(
                                        rotated[sides[(i + 1) % sides.length]]
                                    );
                                    context.lineTo(
                                        centerX + a.x * size,
                                        centerY + a.y * size,
                                        centerX + b.x * size,
                                        centerY + b.y * size
                                    );
                                }
                                context.closePath();
                                context.fill();
                                context.stroke();
                            }
                            return;
                        }
                        let path = new Path2D(sides);
                        context.save();
                        context.translate(centerX, centerY);
                        context.scale(radius, radius);
                        context.lineWidth /= radius;
                        context.rotate(angle);
                        context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
                        if (!borderless) context.stroke(path);
                        if (fill) context.fill(path);
                        context.restore();
                        return;
                    }
                    angle += sides % 2 ? 0 : Math.PI / sides;
                }
                if (!sides) {
                    // Circle
                    let fillcolor = context.fillStyle;
                    let strokecolor = context.strokeStyle;
                    let borderRadius = context.globalAlpha < 1 ? 4 : 2;
                    switch (hasGlow) {
                        case true:
                            context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                            context.fillStyle = strokecolor;
                            context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
                            if (!borderless) context.stroke();
                            break;
                        default:
                            context.arc(centerX, centerY, radius + context.lineWidth / borderRadius, 0, 2 * Math.PI);
                            context.fillStyle = strokecolor;
                            context.lineWidth /= 2; // Maintain constant border width
                            if (!borderless) {
                                switch (context.globalAlpha) {
                                    case 1:
                                        context.fill();
                                        break;
                                    default:
                                        context.stroke();
                                        break;
                                }
                            }
                            break;
                    }
                    context.closePath();
                    context.beginPath();
                    context.fillStyle = fillcolor;
                    context.arc(centerX, centerY, radius * fill, 0, 2 * Math.PI);
                    if (fill) context.fill();
                    context.closePath();
                    return;
                } else if (0 > sides) {
                    // Star
                    if (config.graphical.pointy) context.lineJoin = "miter";
                    sides = -sides;
                    angle += (sides % 1) * Math.PI * 2;
                    sides = Math.floor(sides);
                    let dip = 1 - 6 / (sides ** 2);
                    context.moveTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
                    context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
                    for (let i = 0; i < sides; i++) {
                        let htheta = ((i + 0.5) / sides) * 2 * Math.PI + angle,
                            theta = ((i + 1) / sides) * 2 * Math.PI + angle,
                            cx = centerX + radius * dip * Math.cos(htheta),
                            cy = centerY + radius * dip * Math.sin(htheta),
                            px = centerX + radius * Math.cos(theta),
                            py = centerY + radius * Math.sin(theta);
                        if (config.graphical.curvyTraps) {
                            context.quadraticCurveTo(cx, cy, px, py);
                        } else {
                            context.lineTo(cx, cy);
                            context.lineTo(px, py);
                        }
                    }
                } else if (0 < sides) {
                    // Polygon
                    angle += (sides % 1) * Math.PI * 2;
                    sides = Math.floor(sides);
                    context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
                    for (let i = 0; i < sides; i++) {
                        let theta = (i / sides) * 2 * Math.PI + angle;
                        context.lineTo(centerX + radius * Math.cos(theta), centerY + radius * Math.sin(theta));
                    }
                }
                context.closePath();
                if (!borderless) context.stroke();
                if (fill) context.fill();
                context.lineJoin = "round";
            } catch (e) { // this actually prevents to panic the client. so we will just call "resizeEvent()".
                resizeEvent();
                console.error("Uh oh, 'CanvasRenderingContext2D' has gotton an error! Error: " + e);
            }
        },
        // Draw gun function, (AKA: drawTrapezoid)
        drawGun = (context, x, y, length, height, aspect, angle, borderless, fill, alpha, strokeWidth, position) => {
            let h = [];
            h = aspect > 0 ? [height * aspect, height] : [height, -height * aspect];
    
            // Construct a trapezoid at angle 0
            let points = [],
                sinT = Math.sin(angle),
                cosT = Math.cos(angle);
            points.push([-position, h[1]]);
            points.push([length * 2 - position, h[0]]);
            points.push([length * 2 - position, -h[0]]);
            points.push([-position, -h[1]]);
            context.globalAlpha = alpha;
    
            // Rotate it to the new angle via vector rotation
            context.beginPath();
            for (let point of points) {
                let newX = point[0] * cosT - point[1] * sinT + x,
                    newY = point[0] * sinT + point[1] * cosT + y;
                context.lineTo(newX, newY);
            }
            context.closePath();
            context.lineWidth *= strokeWidth
            context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
            if (!borderless) context.stroke();
            context.lineWidth /= fill ? 1 : 0.5; // Maintain constant border width
            if (fill) context.fill();
            context.globalAlpha = 1;
        };
        // The actual drawEntity function
        return (baseColor, x, y, instance, ratio, alpha = 1, scale = 1, lineWidthMult = 1, rot = 0, turretsObeyRot = false, assignedContext = false, turretInfo = false, render = instance.render, smoothsize = false) => {
            // --- Fast early exit for invisible objects ---
            const fade = turretInfo ? 1 : render.status.getFade();
            if (fade === 0 || alpha === 0) return;
            
            const alphaFade = fade * alpha;
            if (!global.gameUpdate && alphaFade < 0.5) return;
        
            // --- Context setup with minimal state changes ---
            let context = assignedContext || ctx[1];
            const indexStr = instance.index;
            const indexes = indexStr.split("-");
            const mockupIndex = +indexes[0];
            const m = global.mockups[mockupIndex] || global.missingno[0];
            const source = turretInfo === false ? instance : turretInfo;
            
            // --- Size calculations with cached values ---
            const instSize = instance.size;
            let drawSize = smoothsize ? scale * ratio * smoothsize : scale * ratio * instSize;
            
            if (global.gameUpdate && fade !== 1) {
                drawSize *= config.graphical.fancyAnimations ? 
                    (1 + 0.5 * (1 - fade)) : 
                    (1 - 2 * (1 - fade));
                    
                if (drawSize < 0) drawSize = scale * ratio * instSize;
            }
            
            // --- Early optimization for small or distant objects ---
            if (drawSize < 0.1) return;

            // --- Find upper turrets and props with optimized loop ---
            const turrets = instance.isImage ? source.turrets : [...source.turrets, ...m.props];
            if (m.props) turrets.sort((a, b) => a.layer - b.layer);
            const craftrasDisplayName = instance.name ? instance.name.substring(7) : "";
            const craftrasBurning = craftrasDisplayName.startsWith("[FIRE] ");
            let craftrasHelmetId = m.className === "craftrasBuilder"
                ? "gold_helmet"
                : craftrasDisplayName.includes("King Zombie") || craftrasDisplayName.includes("Zombie Crown")
                ? "zombie_crown"
                : craftrasDisplayName.includes("Gold Helmet")
                ? "gold_helmet"
                : craftrasDisplayName.includes("Diamond Helmet")
                ? "diamond_helmet"
                : craftrasDisplayName.includes("Iron Helmet") ? "iron_helmet" : null;
            let craftrasM134Turret = null;
            let craftrasRocketLauncherTurret = null;
            let craftrasHeldToolTurret = null;
            let craftrasHeldToolId = null;
            let craftrasHeldItemTurret = null;
            let craftrasHeldItemId = null;
            let craftrasOffhandShieldTurret = null;
            let craftrasOffhandShieldId = null;
            const getCraftrasHelmetIdFromTurretClass = turretClass => {
                if (turretClass === "craftrasHelmetFront") return "iron_helmet";
                if (turretClass === "craftrasHelmetSide") return "diamond_helmet";
                if (turretClass === "craftrasHelmetCrown") return "zombie_crown";
                if (turretClass === "craftrasMobIronHelmet" || turretClass === "craftrasMobIronHelmetSide") return "iron_helmet";
                if (turretClass === "craftrasMobDiamondHelmet" || turretClass === "craftrasMobDiamondHelmetSide") return "diamond_helmet";
                return null;
            };
            const getCraftrasHeldToolIdFromTurretClass = turretClass => {
                if (turretClass === "craftrasHeldSword") return "sword";
                if (turretClass === "craftrasHeldAdminPickaxe") return "admin_pickaxe";
                if (turretClass === "craftrasHeldBlacksmithHammer") return "blacksmith_hammer";
                if (turretClass === "craftrasHeldVenomSword") return "venom_sword";
                const match = /^craftrasHeld(Wooden|Stone|Iron|Gold|Diamond)(Pickaxe|Axe|Shovel|Sword)$/.exec(turretClass || "");
                return match ? `${match[1].toLowerCase()}_${match[2].toLowerCase()}` : null;
            };
            if (!instance.isImage) {
                for (const turret of turrets) {
                    if (turret.isProp) continue;
                    const turretIndex = +String(turret.index).split("-")[0];
                    const turretClass = global.mockups[turretIndex]?.className;
                    if (turretClass === "craftrasM134Mount" && turret.sizeFactor > 0.01) craftrasM134Turret = turret;
                    if (turretClass === "craftrasRocketLauncherMount" && turret.sizeFactor > 0.01) craftrasRocketLauncherTurret = turret;
                    if (turret.sizeFactor <= 0.01) continue;
                    if (craftrasHeldItemClasses[turretClass]) {
                        craftrasHeldItemTurret = turret;
                        craftrasHeldItemId = craftrasHeldItemClasses[turretClass];
                    }
                    if (craftrasOffhandShieldClasses[turretClass]) {
                        craftrasOffhandShieldTurret = turret;
                        craftrasOffhandShieldId = craftrasOffhandShieldClasses[turretClass];
                    }
                    const heldToolId = getCraftrasHeldToolIdFromTurretClass(turretClass);
                    if (heldToolId) {
                        craftrasHeldToolTurret = turret;
                        craftrasHeldToolId = heldToolId;
                    }
                    craftrasHelmetId = getCraftrasHelmetIdFromTurretClass(turretClass) || craftrasHelmetId;
                }
            }
            const isCraftrasHelmetTurret = turret => {
                if (turret.isProp) return false;
                const turretIndex = +String(turret.index).split("-")[0];
                const turretClass = global.mockups[turretIndex]?.className;
                return !!getCraftrasHelmetIdFromTurretClass(turretClass);
            };
            const isCraftrasM134Turret = turret => {
                if (turret.isProp) return false;
                const turretIndex = +String(turret.index).split("-")[0];
                return global.mockups[turretIndex]?.className === "craftrasM134Mount";
            };
            const isCraftrasRocketLauncherTurret = turret => {
                if (turret.isProp) return false;
                const turretIndex = +String(turret.index).split("-")[0];
                return global.mockups[turretIndex]?.className === "craftrasRocketLauncherMount";
            };
            const isCraftrasHeldToolTurret = turret => {
                if (turret.isProp) return false;
                const turretIndex = +String(turret.index).split("-")[0];
                return !!getCraftrasHeldToolIdFromTurretClass(global.mockups[turretIndex]?.className);
            };
            const isCraftrasHeldItemTurret = turret => {
                if (turret.isProp) return false;
                const turretIndex = +String(turret.index).split("-")[0];
                return !!craftrasHeldItemClasses[global.mockups[turretIndex]?.className];
            };
            const isCraftrasOffhandShieldTurret = turret => {
                if (turret.isProp) return false;
                const turretIndex = +String(turret.index).split("-")[0];
                return !!craftrasOffhandShieldClasses[global.mockups[turretIndex]?.className];
            };

            // --- Gun positions with single update ---
            source.guns.update();
        
            // --- Fancy canvas with reduced state setup ---
            let xx = x, yy = y;
            const useFancyCanvas = DEAIC(assignedContext, alphaFade, m.shape, m.glow, source.guns.length, turrets.length);
        
            if (useFancyCanvas) {
                context = ctx2;
                context.canvas.width = context.canvas.height = drawSize * m.position.axis + ratio * 20 * m.position.axis;
                xx = context.canvas.width / 2 - (drawSize * m.position.axis * m.position.middle.x * Math.cos(rot)) / 4;
                yy = context.canvas.height / 2 - (drawSize * m.position.axis * m.position.middle.x * Math.sin(rot)) / 4;
                context.translate(0.5, 0.5);
            } else if (alphaFade < 0.5 && !config.graphical.fancyAnimations) {
                return;
            }
        
            // --- Batch context property settings ---
            const sharp = config.graphical.sharpEdges;
            const minBorder = config.graphical.mininumBorderChunk;
            const borderChunk = config.graphical.borderChunk;
            const initStrokeWidth = lineWidthMult * Math.max(minBorder, ratio * borderChunk);
            
            context.lineCap = sharp ? "miter" : "round";
            context.lineJoin = sharp ? "miter" : "round";
            context.lineWidth = initStrokeWidth;
        
            // --- Size ratio cached for body drawing ---
            const sizeRatio = (drawSize / m.size) * m.realSize;
        
            // --- Draw turrets beneath with cached values ---
            for (let i = 0; i < turrets.length; i++) {
                let t = turrets[i];
                if (isCraftrasHelmetTurret(t) || isCraftrasM134Turret(t) || isCraftrasRocketLauncherTurret(t) || isCraftrasHeldToolTurret(t) || isCraftrasHeldItemTurret(t) || isCraftrasOffhandShieldTurret(t)) continue;
                if (t.isProp) t = util.requestEntityImage(t);
                // Cache facing calculation
                if (t.lerpedFacing === undefined) {
                    t.lerpedFacing = t.facing;
                } else {
                    t.lerpedFacing = util.lerpAngle(t.lerpedFacing, t.facing, 0.1, true);
                }
                t.invuln = instance.invuln;
                if (!t.layer) {
                    const ang = t.direction + t.angle + rot;
                    const len = t.offset * drawSize;
                    const facing = t.forceAngle === null || t.forceAngle === undefined ? (t.mirrorMasterAngle || turretsObeyRot) ? rot + t.angle : t.lerpedFacing : t.angle;
                    const cosAng = Math.cos(ang);
                    const sinAng = Math.sin(ang);
                    
                    context.lineWidth = initStrokeWidth * t.strokeWidth;
                    
                    drawEntity(
                        baseColor,
                        xx + len * cosAng,
                        yy + len * sinAng,
                        t,
                        ratio,
                        1,
                        (drawSize / ratio / t.size) * t.sizeFactor,
                        lineWidthMult,
                        facing,
                        turretsObeyRot,
                        context,
                        t,
                        render
                    );
                }
            }
        
            // --- Gun positions/config with minimal property access ---
            const positions = source.guns.getPositions();
            const gunConfig = source.guns.getConfig();
            const sourceGuns = source.guns;
            const gunLength = sourceGuns.length;
            const queenSpiderModel = [
                "queen_spider", "queenSpider", "craftrasQueenSpider",
                "queenSpiderSaved", "craftrasQueenSpiderSaved",
                "craftrasSpider", "craftrasToxicSpider",
            ].includes(m.className);
            const queenSpiderBoss = ["queen_spider", "queenSpider", "craftrasQueenSpider"].includes(m.className);
            const queenSpiderMoving = queenSpiderModel && Math.hypot(instance.vx || 0, instance.vy || 0) > 0.02;
            const queenSpiderTime = Date.now() / 1000;
            const queenSpiderLegPhases = [0.31, 2.47, 4.82, 1.26, 5.61, 3.38, 0.94, 4.11];
            const queenSpiderLegSpeeds = [8.3, 6.7, 9.1, 7.4, 5.9, 8.8, 6.2, 7.9];
            const queenSpiderLegAmplitudes = [0.105, 0.137, 0.092, 0.126, 0.116, 0.098, 0.142, 0.109];
            const queenSpiderSegmentsPerLeg = queenSpiderModel ? Math.max(1, gunLength / 8) : 1;
            const statusColor = render.status.getColor();
            const blend = render.status.getBlend();

            const drawCraftrasShield = (turret, shieldId) => {
                const shieldImage = craftrasItemImages[shieldId];
                if (!turret || !shieldImage?.complete || !shieldImage.naturalWidth) return;
                const shieldSize = drawSize * 3.2;
                const blocking = Math.cos((turret.direction || 0) + (turret.angle || 0)) > 0;
                const shieldX = blocking
                    ? xx + Math.cos(rot) * drawSize * 1.05
                    : xx + Math.cos(rot) * drawSize * 0.3 - Math.sin(rot) * drawSize * 1.32;
                const shieldY = blocking
                    ? yy + Math.sin(rot) * drawSize * 1.05
                    : yy + Math.sin(rot) * drawSize * 0.3 + Math.cos(rot) * drawSize * 1.32;
                // Bound turret alpha is not sent to other clients. Carry this
                // state in an imperceptible direction offset instead.
                let broken = Math.abs(turret.direction || 0) >= 0.0005;
                if (instance.id === gui.playerid) {
                    const localStack = turret === craftrasOffhandShieldTurret
                        ? global.craftrasInventory?.offhand
                        : global.craftrasHotbar?.slots?.[global.craftrasHotbar.selected];
                    broken = localStack?.id === shieldId && localStack.brokenUntil > Date.now();
                }
                context.save();
                context.translate(shieldX, shieldY);
                context.rotate(blocking ? rot - Math.PI : rot + Math.PI / 2);
                context.imageSmoothingEnabled = true;
                context.globalAlpha = broken ? 0.6 : 1;
                const renderedShield = broken && craftrasBrokenShieldImages[shieldId]?.width
                    ? craftrasBrokenShieldImages[shieldId]
                    : shieldImage;
                context.drawImage(renderedShield, -shieldSize / 2, -shieldSize / 2, shieldSize, shieldSize);
                context.restore();
            };

            for (let drawAbove = 0; drawAbove < 2; ++drawAbove) {
                // Draw guns for current layer
                for (let i = 0; i < gunLength; ++i) {
                    const g = gunConfig[i];
                    
                    // Skip guns not in current drawing pass
                    if ((drawAbove === 0 && g.drawAbove) || (drawAbove === 1 && !g.drawAbove)) {
                        continue;
                    }
                    
                    context.lineWidth = initStrokeWidth;
                    
                    // Cache angle calculations
                    const queenSpiderLeg = Math.floor(i / queenSpiderSegmentsPerLeg);
                    const legPhase = queenSpiderLegPhases[queenSpiderLeg] || 0;
                    const legSpeed = queenSpiderLegSpeeds[queenSpiderLeg] || 7;
                    const legAmplitude = queenSpiderLegAmplitudes[queenSpiderLeg] || 0.11;
                    const queenSpiderSwing = queenSpiderMoving ? (
                        Math.sin(queenSpiderTime * legSpeed + legPhase) * legAmplitude +
                        Math.sin(queenSpiderTime * (legSpeed * 0.43) + legPhase * 2.7) * legAmplitude * 0.32
                    ) : 0;
                    let queenSpiderClawSwing = 0;
                    if (queenSpiderBoss && instance.alpha > 0.965 && instance.alpha < 0.999) {
                        const leftClaw = instance.alpha < 0.985;
                        const clawProgress = Math.max(0, Math.min(1, (instance.alpha - (leftClaw ? 0.97 : 0.985)) / 0.009));
                        const activeLeg = leftClaw ? 0 : 7;
                        const clawFrames = [0.18, 0.52, 1, 0.38];
                        const clawFrame = Math.min(3, Math.floor(clawProgress * 4));
                        if (queenSpiderLeg === activeLeg) queenSpiderClawSwing = clawFrames[clawFrame] * (leftClaw ? -0.95 : 0.95);
                    }
                    const gAngle = g.angle + rot + queenSpiderSwing + queenSpiderClawSwing;
                    const gunAngle = g.direction + gAngle;
                    const cosGunAngle = Math.cos(gunAngle);
                    const sinGunAngle = Math.sin(gunAngle);
                    
                    const gx = g.offset * cosGunAngle;
                    const gy = g.offset * sinGunAngle;
                    
                    // Minimize color calculations
                    let gunColor = g.color == null ? color.grey : gameDraw.modifyColor(g.color, baseColor);
                    const gunAlpha = g.alpha === undefined ? 1 : g.alpha;
                    let mixedColor = gameDraw.mixColors(gunColor, statusColor, blend);
                    global.gameUpdate && instance.invuln !== 0 && 100 > (Date.now() - instance.invuln) % 200 && ((mixedColor = gameDraw.mixColors(gunColor, gameDraw.getColor(6), 0.3)));
                    gameDraw.setColor(context, mixedColor);
                    
                    // Draw gun with precalculated values
                    drawGun(
                        context,
                        xx + drawSize * gx,
                        yy + drawSize * gy,
                        drawSize * g.length / 2,
                        drawSize * g.width / 2,
                        g.aspect,
                        gAngle,
                        g.borderless,
                        g.drawFill,
                        gunAlpha,
                        g.strokeWidth,
                        drawSize * positions[i]
                    );
                }
        
                // Draw body between gun layers
                if (drawAbove === 0) {
                    context.globalAlpha = !useFancyCanvas && alphaFade < 1 && config.graphical.fancyAnimations ? alphaFade : 1;
                    context.lineWidth = initStrokeWidth * m.strokeWidth;
                    
                    // Precalculate body color
                    let bodyColor = gameDraw.mixColors(
                        gameDraw.modifyColor(instance.color, baseColor),
                        statusColor,
                        blend
                    );
                    global.gameUpdate && instance.invuln !== 0 && 100 > (Date.now() - instance.invuln) % 200 && ((bodyColor = gameDraw.mixColors(gameDraw.modifyColor(instance.color, baseColor), gameDraw.getColor(6), 0.3)));
                    gameDraw.setColor(context, bodyColor);
        
                    // Optimized glow effect
                    const glow = m.glow;
                    const glowRadius = glow.radius;
                    
                    if (glowRadius > 0) {
                        // Calculate glow color once
                        context.shadowColor = glow.color != null
                            ? gameDraw.modifyColor(glow.color)
                            : gameDraw.mixColors(
                                gameDraw.modifyColor(instance.color),
                                statusColor,
                                0
                            );
                            
                        const glowSize = glowRadius * sizeRatio;
                        context.shadowBlur = glowSize;
                        context.shadowOffsetX = 0;
                        context.shadowOffsetY = 0;
                        context.globalAlpha = glow.alpha;
                        
                        const recursion = glow.recursion;
                        const shape = m.shape;
                        
                        // Draw glow with minimal state changes
                        for (let i = 0; i < recursion; ++i) {
                            drawBody(context, xx, yy, sizeRatio, shape, rot, true, m.drawFill, false, true);
                        }
                        
                        context.globalAlpha = 1;
                    }
        
                    // Reset shadow properties in bulk
                    if (glowRadius > 0) {
                        context.shadowBlur = 0;
                        context.shadowOffsetX = 0;
                        context.shadowOffsetY = 0;
                    }
                    
                    // Draw body once
                    drawBody(context, xx, yy, sizeRatio, m.shape, rot, m.borderless, m.drawFill, m.imageInterpolation);

                    if (m.className === "craftrasCow" && craftrasCowPatternImage.complete && craftrasCowPatternImage.naturalWidth) {
                        context.save();
                        context.beginPath();
                        context.arc(xx, yy, drawSize, 0, Math.PI * 2);
                        context.clip();
                        context.globalAlpha = 0.9;
                        context.drawImage(craftrasCowPatternImage, xx - drawSize, yy - drawSize, drawSize * 2, drawSize * 2);
                        context.restore();
                    }
                    if (m.className === "craftrasChicken" && craftrasChickenCombImage.complete && craftrasChickenCombImage.naturalWidth) {
                        const combSize = drawSize * 2.1;
                        context.save();
                        context.translate(xx, yy);
                        context.rotate(rot + Math.PI / 2);
                        context.drawImage(craftrasChickenCombImage, -combSize / 2, -combSize * 0.92, combSize, combSize);
                        context.restore();
                    }

                    // Keep the helmet attached to the body layer so held tools,
                    // blocks, guns, and upper turrets are always drawn above it.
                    const helmetImage = craftrasHelmetImages[craftrasHelmetId];
                    if (helmetImage?.complete && helmetImage.naturalWidth) {
                        context.save();
                        context.translate(xx, yy);
                        context.rotate(rot + Math.PI / 2);
                        context.imageSmoothingEnabled = true;
                        const helmetSize = drawSize * 3;
                        const helmetLift = craftrasHelmetId === "zombie_crown" ? 0.73 : 0.16;
                        drawCraftrasHelmetImage(context, helmetImage, craftrasHelmetId, -helmetSize / 2, -helmetSize / 2 - drawSize * helmetLift, helmetSize);
                        context.restore();
                    }

                    if (craftrasHeldItemId?.endsWith("_shield")) {
                        drawCraftrasShield(craftrasHeldItemTurret, craftrasHeldItemId);
                    }
                    drawCraftrasShield(craftrasOffhandShieldTurret, craftrasOffhandShieldId);

                    if (craftrasM134Turret && craftrasM134Image.complete && craftrasM134Image.naturalWidth) {
                        craftrasM134Turret.guns.update();
                        const gunConfig = craftrasM134Turret.guns.getConfig();
                        const heat = Math.max(0, Math.min(1, gunConfig[0]?.alpha || 0));
                        const weaponWidth = drawSize * 6.3;
                        const weaponHeight = weaponWidth * craftrasM134Image.naturalHeight / craftrasM134Image.naturalWidth;
                        context.save();
                        context.translate(xx, yy);
                        context.rotate(rot);
                        context.scale(-1, 1);
                        context.imageSmoothingEnabled = true;
                        context.drawImage(craftrasM134Image, -weaponWidth * 0.72, -weaponHeight / 2, weaponWidth, weaponHeight);
                        if (heat > 0 && craftrasM134HeatedImage.width) {
                            context.globalAlpha = heat * 0.95;
                            context.drawImage(craftrasM134HeatedImage, -weaponWidth * 0.72, -weaponHeight / 2, weaponWidth, weaponHeight);
                        }
                        context.restore();
                    }

                    if (craftrasRocketLauncherTurret && craftrasRocketLauncherImage.complete && craftrasRocketLauncherImage.naturalWidth) {
                        const weaponWidth = drawSize * 6.6;
                        const weaponHeight = weaponWidth * craftrasRocketLauncherImage.naturalHeight / craftrasRocketLauncherImage.naturalWidth;
                        context.save();
                        context.translate(xx, yy);
                        context.rotate(rot);
                        context.imageSmoothingEnabled = true;
                        context.drawImage(craftrasRocketLauncherImage, -weaponWidth * 0.46, -weaponHeight / 2, weaponWidth, weaponHeight);
                        context.restore();
                    }

                    const heldToolImage = craftrasToolImages[craftrasHeldToolId];
                    if (craftrasHeldToolTurret && heldToolImage?.complete && heldToolImage.naturalWidth) {
                        const t = craftrasHeldToolTurret;
                        const ang = t.direction + t.angle + rot;
                        const len = t.offset * drawSize;
                        const facing = t.forceAngle === null || t.forceAngle === undefined
                            ? (t.mirrorMasterAngle || turretsObeyRot) ? rot + t.angle : t.facing
                            : t.angle;
                        const isSwordTool = craftrasHeldToolId === "sword" || craftrasHeldToolId?.endsWith("_sword");
                        const isHammerTool = craftrasHeldToolId === "blacksmith_hammer";
                        const toolSize = drawSize * (isSwordTool ? 3.25 : isHammerTool ? 3.45 : 3.05);
                        context.save();
                        context.translate(xx + len * Math.cos(ang), yy + len * Math.sin(ang));
                        context.rotate(facing + Math.PI / 4);
                        context.imageSmoothingEnabled = true;
                        if (craftrasHeldToolId === "admin_pickaxe") {
                            context.filter = `hue-rotate(${Math.floor(Date.now() / 8) % 360}deg) saturate(2.4) brightness(1.25)`;
                        }
                        if (isSwordTool) {
                            context.drawImage(heldToolImage, -toolSize * 0.28, -toolSize * 0.72, toolSize, toolSize);
                        } else if (isHammerTool) {
                            context.drawImage(heldToolImage, -toolSize * 0.46, -toolSize * 0.58, toolSize, toolSize);
                        } else {
                            context.drawImage(heldToolImage, -toolSize / 2, -toolSize / 2, toolSize, toolSize);
                        }
                        context.restore();
                    }

                    if (craftrasHeldItemTurret && craftrasHeldItemId) {
                        const heldImage = craftrasItemImages[craftrasHeldItemId];
                        const shield = craftrasHeldItemId.endsWith("_shield");
                        if (!shield) {
                            const heldSize = drawSize * 1.7;
                            const heldAngle = rot + (craftrasHeldItemTurret.angle || 0);
                            const heldDistance = (craftrasHeldItemTurret.offset || 1) * drawSize * 1.15;
                            const heldX = xx + Math.cos(heldAngle) * heldDistance;
                            const heldY = yy + Math.sin(heldAngle) * heldDistance;
                            context.save();
                            context.translate(heldX, heldY);
                            context.rotate(heldAngle + Math.PI / 4);
                            context.imageSmoothingEnabled = true;
                            if (heldImage?.complete && heldImage.naturalWidth) {
                                const imageWidth = heldSize * 0.84;
                                context.drawImage(heldImage, -imageWidth / 2, -heldSize * 0.42, imageWidth, heldSize * 0.84);
                            } else if (craftrasHeldItemId === "creative_24h" || craftrasHeldItemId === "creative_1h") {
                                const tokenSize = heldSize * 0.62;
                                context.fillStyle = craftrasHeldItemId === "creative_24h" ? "#f3d34a" : "#7bdff2";
                                context.strokeStyle = "rgba(20, 23, 28, 0.8)";
                                context.lineWidth = Math.max(1.5, heldSize * 0.05);
                                context.fillRect(-tokenSize / 2, -tokenSize / 2, tokenSize, tokenSize);
                                context.strokeRect(-tokenSize / 2, -tokenSize / 2, tokenSize, tokenSize);
                            } else {
                                drawCraftrasMobHeadIcon(context, craftrasHeldItemId, -heldSize / 2, -heldSize / 2, heldSize);
                            }
                            context.restore();
                        }
                    }

                    const fireImage = craftrasFireFrames[Math.floor(Date.now() / 200) % craftrasFireFrames.length];
                    if (!turretInfo && craftrasBurning && fireImage.complete && fireImage.naturalWidth) {
                        const fireSize = drawSize * 7.2;
                        context.save();
                        context.globalAlpha = 0.4;
                        context.imageSmoothingEnabled = true;
                        context.drawImage(fireImage, xx - fireSize / 2, yy - fireSize * 0.62, fireSize, fireSize);
                        context.restore();
                    }
                }
            }
        
            // --- Draw turrets above with cached trig values ---
            for (let i = 0; i < turrets.length; i++) {
                let t = turrets[i];
                if (isCraftrasHelmetTurret(t) || isCraftrasM134Turret(t) || isCraftrasRocketLauncherTurret(t) || isCraftrasHeldToolTurret(t) || isCraftrasHeldItemTurret(t) || isCraftrasOffhandShieldTurret(t)) continue;
                if (t.isProp) t = util.requestEntityImage(t);
                // Cache facing calculation
                if (t.lerpedFacing === undefined) {
                    t.lerpedFacing = t.facing;
                } else {
                    t.lerpedFacing = util.lerpAngle(t.lerpedFacing, t.facing, 0.1, true);
                }
                t.invuln = instance.invuln;
                if (t.layer) {
                    const ang = t.direction + t.angle + rot;
                    const len = t.offset * drawSize;
                    const facing = t.forceAngle === null || t.forceAngle === undefined ? (t.mirrorMasterAngle || turretsObeyRot) ? rot + t.angle : t.lerpedFacing : t.angle;
                    const cosAng = Math.cos(ang);
                    const sinAng = Math.sin(ang);
                    
                    context.lineWidth = initStrokeWidth * t.strokeWidth;
                    
                    drawEntity(
                        baseColor,
                        xx + len * cosAng,
                        yy + len * sinAng,
                        t,
                        ratio,
                        1,
                        (drawSize / ratio / t.size) * t.sizeFactor,
                        lineWidthMult,
                        facing,
                        turretsObeyRot,
                        context,
                        t,
                        render
                    );
                }
            }

            // --- Optimized fancy canvas drawing ---
            if (!assignedContext && context !== ctx[1] && context.canvas.width > 0 && context.canvas.height > 0) {
                ctx[1].save();
                
                // Apply alpha in one operation
                ctx[1].globalAlpha = alphaFade;
                ctx[1].imageSmoothingEnabled = false;
                
                // Draw in one operation
                ctx[1].drawImage(context.canvas, x - xx, y - yy);
                ctx[1].restore();
            }
        
            // --- Minimal context reset ---
            if (sharp) {
                context.lineCap = "round";
                context.lineJoin = "round";
            }
        }
    })();

    const iconColorOrder = [10, 11, 12, 15, 13, 2, 14, 4, 5, 1, 0, 3];
    function getIconColor(colorIndex) {
        return iconColorOrder[colorIndex % 12].toString();
    }

    function drawEntityIcon(model, x, y, len, height, lineWidthMult, angle, alpha, colorIndex, upgradeKey, hover = false, extraScale = 1) {
        let picture = (typeof model == "object") ? model : util.getEntityImageFromMockup(model, gui.color),
            position = picture.position,
            scale = (0.6 * len * extraScale) / position.axis,
            entityX = x + 0.5 * len,
            entityY = y + 0.5 * height,
            baseColor = picture.color;

        // Find x and y shift for the entity image
        let xShift = position.middle.x * Math.cos(angle) - position.middle.y * Math.sin(angle),
            yShift = position.middle.x * Math.sin(angle) + position.middle.y * Math.cos(angle);
        entityX -= scale * xShift;
        entityY -= scale * yShift;

        // Draw box
        ctx[2].globalAlpha = alpha;
        ctx[2].fillStyle = picture.upgradeColor != null
            ? gameDraw.modifyColor(picture.upgradeColor)
            : gameDraw.getColor(getIconColor(colorIndex));
        drawGuiRect(x, y, len, height);
        // Shading for hover
        if (hover) {
            if (global.clickables.clicked) {
                ctx[2].globalAlpha = 0.2;
                ctx[2].fillStyle = color.black;
            } else {
                ctx[2].globalAlpha = 0.15;
                ctx[2].fillStyle = color.guiwhite;
            }
            drawGuiRect(x, y, len, height);
        }
        ctx[2].globalAlpha = 0.25 * alpha;
        ctx[2].fillStyle = color.black;
        drawGuiRect(x, y + height * 0.6, len, height * 0.4);
        ctx[2].globalAlpha = 1;

        // Draw Tank
        drawEntity(baseColor, entityX, entityY, picture, 1, 1, scale / picture.size, lineWidthMult, angle, true, ctx[2]);

        // Tank name
        drawText(picture.upgradeName ?? picture.name, x + (upgradeKey ? 0.9 * len : len) / 2, y + height * 0.94, height / 10, color.guiwhite, "center");

        // Upgrade key
        if (upgradeKey) {
            drawText("[" + upgradeKey + "]", x + len - 4, y + height - 6, height / 8 - 5, color.guiwhite, "right");
        }
        ctx[2].strokeStyle = color.black;
        ctx[2].lineWidth = 3 * lineWidthMult;
        drawGuiRect(x, y, len, height, true); // Border
    }

    // Draw Game functions
    function drawFloor(px, py, ratio, tick) {
        // Clear the background + draw grid
        clearScreen(color.white, 1, ctx[0]);
        clearScreen(color.guiblack, 0.1, ctx[0]);

        let gameWidth = global.gameWidth = global.player.roomAnim.x.get(tick);
        let gameHeight = global.gameHeight = global.player.roomAnim.y.get(tick);

        //loop through the entire room setup
        ctx[0].globalAlpha = 1;
        ctx[0].fillStyle = color.white;
        // Draw the room
        let roomX = -px + global.screenWidth / 2 - ratio * gameWidth / 2,
            roomY = -py + global.screenHeight / 2 - ratio * gameHeight / 2,
            roomWidth = ratio * gameWidth,
            roomHeight = ratio * gameHeight;
        if (global.advanced.roundMap) {
            ctx[0].save();
            ctx[0].beginPath();
            ctx[0].arc(
                -px + global.screenWidth / 2 - (ratio * gameWidth) * 0,
                -py + global.screenHeight / 2 - (ratio * gameHeight) * 0,
                (ratio * global.gameWidth) / 2,
                0,
                Math.PI * 2
            );
            ctx[0].clip();
        }
        ctx[0].fillRect(roomX, roomY, roomWidth, roomHeight);
        if (global.roomSetup.length) {
            let W = global.roomSetup[0].length,
                H = global.roomSetup.length;

            for (let f = 0; f < H; f++) {
                let e = global.roomSetup[f];
                for (let h = 0; h < W; h++) {
                    let tile = e[h];
                    let top = ratio * h * gameWidth / W - px + global.screenWidth / 2 - ratio * gameWidth / 2,
                        bottom = ratio * f * gameHeight / H - py + global.screenHeight / 2 - ratio * gameHeight / 2,
                        left = ratio * (h + 1) * gameWidth / W - px + global.screenWidth / 2 - ratio * gameWidth / 2,
                        right = ratio * (f + 1) * gameHeight / H - py + global.screenHeight / 2 - ratio * gameHeight / 2;
                    if (tile.image) { // if a tile is a image, then get the image and render it.
                        ctx[0].globalAlpha = 1;
                        if (!tile.renderImage) {
                            tile.renderImage = new Image();
                            const imageCacheBust = window.__tileImageCacheBust || (window.__tileImageCacheBust = Date.now());
                            tile.renderImage.src = `img/${tile.image}?v=${imageCacheBust}`;
                            tile.renderImage.onerror = () => {
                                console.warn(`Failed to get ${tile.image}! If you are the developer of this game, make sure that you typed the path correctly. Using unknown image.`)
                                tile.renderImage.src = `img/missingno.png`;
                            }
                        };
                        ctx[0].drawImage(tile.renderImage, top, bottom, left - top, right - bottom);
                    }

                    ctx[0].globalAlpha = 0.3;
                    if (tile.color == 'none') tile.color = 'border';
                    let tileColor = gameDraw.getColor(tile.color, true);
                    // If not default tile color, draw that tile!
                    if (tileColor !== color.white) {
                        ctx[0].fillStyle = tileColor;
                        ctx[0].fillRect(top, bottom, left - top, right - bottom);
                    }
                }
            }
        }
        global.advanced.roundMap && ctx[0].restore();
        let gridsize = 30 * ratio;
        if (config.graphical.showGrid && 2.5 < gridsize) { // Draw grid if the user wants to.
            ctx[0].save();
            ctx[0].lineWidth = ratio;
            ctx[0].strokeStyle = color.guiblack;
            ctx[0].globalAlpha = 0.04;
            ctx[0].beginPath();
            for (let x = (global.screenWidth / 2 - px) % gridsize; x < global.screenWidth; x += gridsize) {
                ctx[0].moveTo(x, 0);
                ctx[0].lineTo(x, global.screenHeight);
            }
            for (let y = (global.screenHeight / 2 - py) % gridsize; y < global.screenHeight; y += gridsize) {
                ctx[0].moveTo(0, y);
                ctx[0].lineTo(global.screenWidth, y);
            }
            ctx[0].stroke();
            ctx[0].globalAlpha = 1;
            ctx[0].restore();
        }
    }

    function drawCraftrasPolygon(context, x, y, radius, sides, rotation, fill, stroke) {
        context.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = rotation + i * Math.PI * 2 / sides;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) context.moveTo(px, py);
            else context.lineTo(px, py);
        }
        context.closePath();
        context.fillStyle = fill;
        context.fill();
        if (stroke) {
            context.strokeStyle = stroke;
            context.stroke();
        }
    }

    function drawCraftrasBlocks(px, py, ratio) {
        const world = global.craftrasWorld;
        if (!world?.active || !world.chunks.size) return;

        const blockSize = world.blockSize;
        const wallSize = world.wallSize;
        const chunkSize = world.chunkSize;
        const halfScreenWorldX = global.screenWidth / ratio / 2;
        const halfScreenWorldY = global.screenHeight / ratio / 2;
        const minBlockX = Math.floor((global.player.renderx - halfScreenWorldX) / blockSize) - 1;
        const maxBlockX = Math.floor((global.player.renderx + halfScreenWorldX) / blockSize) + 1;
        const minBlockY = Math.floor((global.player.rendery - halfScreenWorldY) / blockSize) - 1;
        const maxBlockY = Math.floor((global.player.rendery + halfScreenWorldY) / blockSize) + 1;
        const size = Math.max(1, wallSize * ratio);
        const halfSize = size / 2;
        const outlineWidth = Math.max(0.6, Math.min(2.5, ratio * 2));

        const getBlockCode = (blockX, blockY) => {
            const chunkX = Math.floor(blockX / chunkSize);
            const chunkY = Math.floor(blockY / chunkSize);
            const cells = world.chunks.get(`${chunkX},${chunkY}`);
            if (!cells) return 0;
            const localX = blockX - chunkX * chunkSize;
            const localY = blockY - chunkY * chunkSize;
            return cells[localY * chunkSize + localX] || 0;
        };
        const getFloorCode = (blockX, blockY) => {
            const chunkX = Math.floor(blockX / chunkSize);
            const chunkY = Math.floor(blockY / chunkSize);
            const cells = world.floorChunks?.get(`${chunkX},${chunkY}`);
            if (!cells) return 0;
            const localX = blockX - chunkX * chunkSize;
            const localY = blockY - chunkY * chunkSize;
            return cells[localY * chunkSize + localX] || 0;
        };
        const getBlockStyle = code => {
            let fill = "#96999f", stroke = "#676a70";
            if (code === 1) { fill = "#8a6748"; stroke = "#60452f"; }
            else if (code === 2) { fill = "#79bd63"; stroke = "#4d8643"; }
            else if (code === 3) { fill = "#b48761"; stroke = "#7c5b42"; }
            else if (code === 9 || code === 10) { fill = "#c99b68"; stroke = "#805d3c"; }
            else if (code === 13) { fill = "#a46b32"; stroke = "#573719"; }
            else if (code === 14) { fill = "#111318"; stroke = "#030405"; }
            else if (code === 15) { fill = "#252a30"; stroke = "#090b0e"; }
            else if (code === 16) { fill = "#d9dde2"; stroke = "#858b93"; }
            else if (code === 17) { fill = "#efc83c"; stroke = "#9f791b"; }
            else if (code === 18) { fill = "#4bd7e8"; stroke = "#237f91"; }
            else if (code === 19) { fill = "#9a7045"; stroke = "#6c492c"; }
            return { fill, stroke };
        };

        // Blocks are terrain. drawEntities copies ctx[0] onto ctx[1], so drawing
        // them on ctx[1] here would immediately hide them behind the floor.
        const context = ctx[0];
        context.save();
        context.lineWidth = outlineWidth;
        context.lineJoin = "round";

        const floorSize = Math.max(1, blockSize * ratio);
        const floorHalfSize = floorSize / 2;
        for (let blockY = minBlockY; blockY <= maxBlockY; blockY++) {
            for (let blockX = minBlockX; blockX <= maxBlockX; blockX++) {
                const floorRenderCode = getFloorCode(blockX, blockY);
                const code = floorRenderCode & 31;
                const damageStage = (floorRenderCode >> 5) & 3;
                if (!code) continue;
                const worldX = blockX * blockSize + blockSize / 2;
                const worldY = blockY * blockSize + blockSize / 2;
                const screenX = ratio * worldX - px + global.screenWidth / 2;
                const screenY = ratio * worldY - py + global.screenHeight / 2;
                const style = getBlockStyle(code);
                context.save();
                context.globalAlpha = 1;
                context.fillStyle = style.fill;
                context.fillRect(
                    Math.round(screenX - floorHalfSize),
                    Math.round(screenY - floorHalfSize),
                    Math.ceil(floorSize),
                    Math.ceil(floorSize),
                );
                if (code === 19) {
                    context.fillStyle = "rgba(73, 45, 25, 0.22)";
                    const fleck = Math.max(1, floorSize * 0.045);
                    context.fillRect(screenX - floorSize * 0.30, screenY - floorSize * 0.17, fleck * 2.2, fleck);
                    context.fillRect(screenX + floorSize * 0.12, screenY + floorSize * 0.20, fleck * 2.6, fleck);
                    context.fillRect(screenX + floorSize * 0.25, screenY - floorSize * 0.28, fleck, fleck);
                }
                const placedImage = craftrasPlacedBlockImages[code];
                if (placedImage?.complete && placedImage.naturalWidth) {
                    context.globalAlpha = 1;
                    context.imageSmoothingEnabled = false;
                    context.drawImage(placedImage, screenX - floorHalfSize, screenY - floorHalfSize, floorSize, floorSize);
                }
                const breakImage = craftrasBlockBreakImages[damageStage];
                if (breakImage?.complete && breakImage.naturalWidth) {
                    context.globalAlpha = 0.7;
                    context.imageSmoothingEnabled = false;
                    context.drawImage(breakImage, screenX - floorHalfSize, screenY - floorHalfSize, floorSize, floorSize);
                }
                context.restore();
            }
        }

        for (let blockY = minBlockY; blockY <= maxBlockY; blockY++) {
            for (let blockX = minBlockX; blockX <= maxBlockX; blockX++) {
                const renderCode = getBlockCode(blockX, blockY);
                const code = renderCode & 31;
                const damageStage = (renderCode >> 5) & 3;
                const direction = (renderCode >> 7) & 3;
                if (!code) continue;
                const worldX = blockX * blockSize + blockSize / 2;
                const worldY = blockY * blockSize + blockSize / 2;
                let screenX = ratio * worldX - px + global.screenWidth / 2;
                let screenY = ratio * worldY - py + global.screenHeight / 2;
                const hit = world.hitEffects?.get(`${blockX},${blockY}`);
                if (hit) {
                    const age = performance.now() - hit;
                    if (age < 260) {
                        const strength = (1 - age / 260) * Math.max(5, ratio * 11);
                        screenX += Math.sin(age * 0.42) * strength;
                        screenY += Math.cos(age * 0.37) * strength * 0.35;
                    } else {
                        world.hitEffects.delete(`${blockX},${blockY}`);
                    }
                }
                const left = Math.round(screenX - halfSize);
                const top = Math.round(screenY - halfSize);

                if (code === 1) {
                    context.save();
                    context.globalAlpha = 0.3;
                    drawCraftrasPolygon(context, screenX, screenY, size, 9, -Math.PI / 2, "#166b35", "#0e4c25");
                    context.restore();
                } else {
                    const { fill, stroke } = getBlockStyle(code);
                    context.globalAlpha = 1;
                    context.fillStyle = fill;
                    context.strokeStyle = stroke;
                    context.fillRect(left, top, size, size);
                    context.strokeRect(left, top, size, size);
                }

                const placedImage = craftrasPlacedBlockImages[code];
                if (placedImage?.complete && placedImage.naturalWidth) {
                    context.save();
                    context.translate(screenX, screenY);
                    context.rotate(direction * Math.PI / 2);
                    context.imageSmoothingEnabled = false;
                    const crop = craftrasPlacedBlockCrops[code];
                    if (crop) context.drawImage(placedImage, crop.x, crop.y, crop.width, crop.height, -halfSize, -halfSize, size, size);
                    else context.drawImage(placedImage, -halfSize, -halfSize, size, size);
                    context.restore();
                }

                if (code === 13) {
                    context.save();
                    context.strokeStyle = "#573719";
                    context.lineWidth = Math.max(1, outlineWidth);
                    context.beginPath();
                    context.moveTo(left, screenY - size * 0.12);
                    context.lineTo(left + size, screenY - size * 0.12);
                    context.stroke();
                    context.fillStyle = "#e4bd54";
                    context.fillRect(screenX - size * 0.08, screenY - size * 0.05, size * 0.16, size * 0.24);
                    context.restore();
                }

                if (code >= 5) {
                    const markerRadius = size * 0.42;
                    if (code === 5) {
                        drawCraftrasPolygon(context, screenX, screenY, markerRadius, 3, -Math.PI / 2, "#16181c", "#050607");
                    } else if (code === 6) {
                        drawCraftrasPolygon(context, screenX, screenY, markerRadius, 5, -Math.PI / 2, "#f1f3f5", "#aeb3b9");
                    } else if (code === 7) {
                        drawCraftrasPolygon(context, screenX, screenY, markerRadius, 4, Math.PI / 4, "#ffd84d", "#b88a13");
                    } else if (code === 8) {
                        drawCraftrasPolygon(context, screenX, screenY, markerRadius, 6, 0, "#4cc9f0", "#177d9d");
                        context.strokeStyle = "rgba(255,255,255,0.8)";
                        context.beginPath();
                        context.moveTo(screenX - markerRadius * 0.55, screenY);
                        context.lineTo(screenX + markerRadius * 0.55, screenY);
                        context.stroke();
                    }
                }

                const breakImage = craftrasBlockBreakImages[damageStage];
                if (breakImage?.complete && breakImage.naturalWidth) {
                    context.save();
                    context.imageSmoothingEnabled = false;
                    context.drawImage(breakImage, left, top, size, size);
                    context.restore();
                }
            }
        }

        const placement = global.craftrasPlacement;
        if (placement?.active) {
            const worldX = placement.x * blockSize + blockSize / 2;
            const worldY = placement.y * blockSize + blockSize / 2;
            const screenX = ratio * worldX - px + global.screenWidth / 2;
            const screenY = ratio * worldY - py + global.screenHeight / 2;
            const left = Math.round(screenX - halfSize);
            const top = Math.round(screenY - halfSize);
            context.save();
            const floorMode = placement.mode === "floor";
            context.globalAlpha = floorMode ? 0.42 : 0.6;
            context.fillStyle = placement.valid ? (floorMode ? "#42bfe8" : "#36d35b") : "#e44343";
            context.strokeStyle = placement.valid ? (floorMode ? "#176b8a" : "#16772d") : "#841f1f";
            context.lineWidth = Math.max(2, outlineWidth * 1.5);
            context.setLineDash(floorMode ? [Math.max(3, ratio * 5), Math.max(2, ratio * 3)] : []);
            context.fillRect(left, top, size, size);
            context.strokeRect(left, top, size, size);
            context.restore();
        }

        context.restore();
    }

    function drawEntities(px, py, ratio, tick) {
        if (global.advanced.blackout.active) {
            document.getElementById("gameCanvas-background").style.display = "none";
            ctx[1].drawImage(ctx[0].canvas, 0, 0, global.screenWidth, global.screenHeight);
            if (global.glCanvas) ctx[1].drawImage(global.glCanvas, 0, 0, global.screenWidth, global.screenHeight);
        } else if (document.getElementById("gameCanvas-background").style.display === "none") document.getElementById("gameCanvas-background").style.display = "block";
        // Draw things
        for (let instance of global.entities) {
            if (!instance.render.draws) {
                continue;
            }
            let motion = compensation();
            let rst = instance.render.status.getFade();
            if (rst === 1) {
                motion.set();
            } else {
                if (config.graphical.lerpAnimations) {
                    instance.x += instance.vx * global.metrics.updatetime / global.metrics.rendertime;
                    instance.y += instance.vy * global.metrics.updatetime / global.metrics.rendertime;
                    instance.facing += instance.vfacing * global.metrics.updatetime / global.metrics.rendertime;
                }
                motion.set(instance.render.lastRender, instance.render.interval);
            }
            let isize = instance.render.size.get(tick, 1 !== rst);
            instance.render.x = !config.graphical.interpolation ?
                motion.predict(instance.render.lastx, instance.x, instance.render.lastvx, instance.vx) :
                config.graphical.lerpAnimations ?
                util.lerp(instance.render.x, Math.round(instance.x + instance.vx), 0.1, true) :
                instance.render.xAnim.get(tick, 1 !== rst);

            instance.render.y = !config.graphical.interpolation ?
                motion.predict(instance.render.lasty, instance.y, instance.render.lastvy, instance.vy) :
                config.graphical.lerpAnimations ?
                util.lerp(instance.render.y, Math.round(instance.y + instance.vy), 0.1, true) :
                instance.render.yAnim.get(tick, 1 !== rst);

            instance.render.f = !config.graphical.interpolation ?
                motion.predictFacing(instance.render.lastf, instance.facing) :
                instance.render.faceAnim.get(tick, 1 !== rst);

            instance.id === gui.playerid &&
                !global.autoSpin &&
                !global.syncingWithTank &&
                !instance.twiggle &&
                !global.died ?
                instance.render.f = Math.atan2(global.target.y * global.reverseTank, global.target.x * global.reverseTank) : 0

            let x = ratio * instance.render.x - px,
                y = ratio * instance.render.y - py,
                baseColor = instance.color;
            if (instance.id === gui.playerid) {
                x = !config.graphical.smoothcamera && !global.player.isScoping && config.graphical.shakeProperties.CameraShake.shakeStartTime == -1 && !global.died ? 0 : x;
                y = !config.graphical.smoothcamera && !global.player.isScoping && config.graphical.shakeProperties.CameraShake.shakeStartTime == -1 && !global.died ? 0 : y;
                global.player.screenx = x;
                global.player.screeny = y;
                global.player.name = instance.name ?? "";
            }
            x += global.screenWidth / 2;
            y += global.screenHeight / 2;
            let alpha = instance.id === gui.playerid ? 1 : instance.alpha;
            alpha = handleScreenDistance(alpha, instance, false);
            drawEntity(baseColor, x, y, instance, ratio, instance.alpha * alpha, 1, 1, instance.render.f, false, false, false, instance.render, isize);
        }
        for (let instance of global.entities) {
            let alpha = instance.id === gui.playerid ? 1 : instance.alpha;
            alpha = handleScreenDistance(alpha, instance);
            let x = instance.id === gui.playerid ? global.player.screenx : ratio * instance.render.x - px,
                y = instance.id === gui.playerid ? global.player.screeny : ratio * instance.render.y - py;
            drawHealth(x, y, instance, ratio, gui.visibleEntities ? 1 : alpha, instance.size);
            drawName(x, y, instance, ratio, gui.visibleEntities ? alpha * 0.75 + 0.25 : alpha, instance.size);
        }
        for (let instance of global.entities) {
            let alpha = instance.id === gui.playerid ? 1 : instance.alpha;
            alpha = handleScreenDistance(alpha, instance);
            let x = instance.id === gui.playerid ? global.player.screenx : ratio * instance.render.x - px,
                y = instance.id === gui.playerid ? global.player.screeny : ratio * instance.render.y - py;
            drawChatMessages(x, false, py, instance, ratio, gui.visibleEntities ? 1 : alpha, instance.size, px, py);
            drawChatInput(x, y, instance, ratio, instance.size);
        }
        if (global.advanced.blackout.active) {
            let entity = global.entities.find((u) => u.id === gui.playerid);
            if (entity) {
                ctx[1].beginPath();
                let x = global.screenWidth / 2 - px + ratio * 0,
                    y = global.screenHeight / 2 - py + ratio * 0,
                    kt = ratio * global.gameWidth,
                    ky = ratio * global.gameHeight,
                    G = global.roomSetup[0].length,
                    L = global.roomSetup.length

                for (let S = 0; S < L; S++) for (let ea = 0; ea < G; ea++) {
                    let Pc = x + ((ea + 0.5) / G) * kt - kt / 2,
                        Qc = y + ((S + 0.5) / L) * ky - ky / 2,
                        tile = global.roomSetup[S][ea];

                    if (tile.visibleOnBlackout) {
                        ctx[1].moveTo(Pc + ((0.5) / G) * kt, Qc);
                        ctx[1].arc(Pc, Qc, ((0.5) / G) * kt, 0, 2 * Math.PI);
                    }
                }
                for (let entity of global.entities) {
                    let x = ratio * entity.render.x - px,
                        y = ratio * entity.render.y - py,
                        indexes = entity.index.split("-"),
                        m = global.mockups[parseInt(indexes[0])] ?? global.missingno[0];

                    x += global.screenWidth / 2;
                    y += global.screenHeight / 2;
                    if (entity.id === gui.playerid || (m.visibleOnBlackout && entity.alpha < 0.1)) {
                        ctx[1].moveTo(x, y);
                        ctx[1].arc(x, y, entity.size * ratio * 4, 0, 2 * Math.PI);
                    }
                    if (entity.id === gui.playerid) {
                        if (!global.died) {
                            ctx[1].moveTo(x, y);
                            let na = Math.atan2(global.target.y * global.reverseTank, global.target.x * global.reverseTank);
                            ctx[1].arc(x, y, entity.size * ratio * 24, na - 0.3, na + 0.3);
                        }
                        for (let gun of m.guns) {
                            let facing = entity.render.f,
                                tx = x + gun.offset * Math.cos(gun.direction + gun.angle + facing) + (gun.length / 2) * Math.cos(gun.angle + facing),
                                ty = y + gun.offset * Math.sin(gun.direction + gun.angle + facing) + (gun.length / 2) * Math.sin(gun.angle + facing);
                            ctx[1].moveTo(tx, ty);
                            let Ia = facing + gun.angle;
                            ctx[1].arc(tx, ty, entity.size * ratio * gun.length * 6, Ia - 0.3, Ia + 0.3);
                        }
                    }
                }
                ctx[1].globalAlpha = 1;
                ctx[1].fillStyle = global.advanced.blackout.color;
                ctx[1].globalCompositeOperation = "destination-in";
                ctx[1].fill();
                ctx[1].globalCompositeOperation = "destination-over";
                ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
                ctx[1].globalCompositeOperation = "source-over";
            } else {
                ctx[1].globalAlpha = 1;
                ctx[1].fillStyle = global.advanced.blackout.color;
                ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
            }
        }
    }

    global.scrollX = global.scrollY = global.fixedScrollX = global.fixedScrollY = -1;
    global.scrollVelocityY = global.scrollVelocityX = 0;
    let lastGuiType = null;
    let classTreeDrag = {
        isDragging: false,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        momentum: { x: 0, y: 0 }
    };

    // Search functionality - OPTIMIZED
    let searchResults = [];
    let filteredTiles = null;
    let searchCache = new Map(); // Cache search results

    // Optimize rendering with culling
    const SHOW_NAMES_ZOOM_THRESHOLD = 1.5;
    const CULL_MARGIN = 200;

    let tankNameCache = new Map();
    global.searchQuery = '';
    function searchTankByName(query) {
        if (!query || query.trim() === '') {
            searchResults = [];
            filteredTiles = null;
            tankNameCache.clear();
            global.searchQuery = ''; // Update global
            return;
        }

        const lowerQuery = query.toLowerCase().trim();
        global.searchQuery = query; // Update global
        
        // Check cache first
        if (searchCache.has(lowerQuery)) {
            const cached = searchCache.get(lowerQuery);
            searchResults = cached.results;
            filteredTiles = cached.tiles;
            return;
        }

        // Build name cache if empty
        if (tankNameCache.size === 0) {
            for (let i = 0; i < global.mockups.length; i++) {
                const m = global.mockups[i];
                if (m && m.name) {
                    tankNameCache.set(i, m.name.toLowerCase());
                }
            }
        }

        // Search using cache
        searchResults = [];
        const matchingIndexes = new Set();
        
        for (let [index, name] of tankNameCache) {
            if (name.includes(lowerQuery)) {
                searchResults.push(global.mockups[index]);
                matchingIndexes.add(index);
            }
        }

        if (searchResults.length > 0) {
            // FIXED: Find all tiles in the upgrade path to matching tanks
            filteredTiles = [];
            
            // Helper function to check if a tank leads to any search result
            const leadsToSearchResult = (tankIndex, visited = new Set()) => {
                if (visited.has(tankIndex)) return false;
                visited.add(tankIndex);
                
                // Check if this tank is in search results
                if (matchingIndexes.has(parseInt(tankIndex))) return true;
                
                // Check if any of its upgrades lead to search results
                const mockup = global.mockups[parseInt(tankIndex)];
                if (mockup && mockup.upgrades) {
                    for (let upgrade of mockup.upgrades) {
                        if (leadsToSearchResult(upgrade.index, visited)) {
                            return true;
                        }
                    }
                }
                return false;
            };
            
            // Include all tiles that either match or lead to matching tanks
            for (let tile of tiles) {
                const tileIndex = parseInt(tile.index);
                if (matchingIndexes.has(tileIndex) || leadsToSearchResult(tile.index)) {
                    filteredTiles.push(tile);
                }
            }
        } else {
            // Show only basic if no results found
            filteredTiles = tiles.filter(tile => {
                const mockup = global.mockups[parseInt(tile.index)];
                return mockup && mockup.className === 'basic';
            });
        }
        
        // Cache the results
        searchCache.set(lowerQuery, {
            results: searchResults,
            tiles: filteredTiles
        });
    }
    global.searchTankByName = searchTankByName;

    function drawUpgradeTree(spacing, alcoveSize) {
        if (global.died) {
            // Hide the tree on death
            global.tankTree("exit");
            return;
        }

        if (lastGuiType != gui.type || global.generateTankTree) {
            try {
                let m = util.requestEntityImage(gui.type),
                    rootName = m.rerootUpgradeTree,
                    rootIndex = [];
                for (let name of rootName) {
                    let mockup = global.mockups.find(i => i && i.className === name);
                    let ind = name == undefined || !mockup ? -1 : mockup.index;
                    rootIndex.push(ind);
                }
                if (!rootIndex.includes(-1)) {
                    generateTankTree(rootIndex);
                }
                lastGuiType = gui.type;
                global.generateTankTree = false;
                // Clear search when tree regenerates
                global.searchQuery = ''; // Use global
                searchResults = [];
                filteredTiles = null;
                searchCache.clear();
            } catch { }
        }

        if (!tankTree) {
            console.log('No class tree rendered yet.');
            return;
        }
        // Draw semi-transparent overlay
        ctx[2].globalAlpha = 0.5;
        ctx[2].fillStyle = color.guiwhite;
        ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
        ctx[2].globalAlpha = 1;

        // Render the class tree if ready.
        if (global.renderTankTree) {
            let tileSize = alcoveSize / 2,
                size = tileSize - 4,
                spaceBetween = 10,
                screenDivisor = (spaceBetween + tileSize) * 2 * global.treeScale,
                padding = tileSize / screenDivisor,
                dividedWidth = global.screenWidth / screenDivisor,
                dividedHeight = global.screenHeight / screenDivisor,
                treeFactor = 1 + spaceBetween / tileSize;

            // Apply momentum decay with optimization
            if (!classTreeDrag.isDragging) {
                const friction = 0.92;
                classTreeDrag.momentum.x *= friction;
                classTreeDrag.momentum.y *= friction;
                
                // Stop momentum if very small
                if (Math.abs(classTreeDrag.momentum.x) < 0.1) classTreeDrag.momentum.x = 0;
                if (Math.abs(classTreeDrag.momentum.y) < 0.1) classTreeDrag.momentum.y = 0;
            }

            // Update scroll position with momentum
            global.scrollVelocityX = classTreeDrag.momentum.x;
            global.scrollVelocityY = classTreeDrag.momentum.y;

            global.fixedScrollX = Math.max(
                dividedWidth - padding,
                Math.min(
                    tankTree.width * treeFactor + padding - dividedWidth,
                    global.fixedScrollX + global.scrollVelocityX
                )
            );
            global.fixedScrollY = Math.max(
                dividedHeight - padding,
                Math.min(
                    tankTree.height * treeFactor + padding - dividedHeight,
                    global.fixedScrollY + global.scrollVelocityY
                )
            );
            if (Math.abs(global.targetTreeScale - global.treeScale) > 0.001) {
                global.treeScale += (global.targetTreeScale - global.treeScale) * 0.15;
                if (Math.abs(global.targetTreeScale - global.treeScale) < 0.001) {
                    global.treeScale = global.targetTreeScale;
                }
            }
            // Smooth scroll interpolation
            global.scrollX = util.lerp(global.scrollX, global.fixedScrollX, 0.10, true);
            global.scrollY = util.lerp(global.scrollY, global.fixedScrollY, 0.10, true);

            // Determine which tiles to render based on search
            const tilesToRender = filteredTiles || tiles;

            // OPTIMIZED: Pre-calculate values
            const halfWidth = global.screenWidth / 2;
            const halfHeight = global.screenHeight / 2;
            const tileSpacing = tileSize + spaceBetween;
            const scaledSpacing = tileSpacing * global.treeScale;
            const halfSize = 0.5 * size;

            // Draw branches (optimized with culling)
            ctx[2].strokeStyle = color.black;
            ctx[2].lineWidth = 2 * global.treeScale;
            ctx[2].beginPath();
            
            for (let [start, end] of branches) {
                let sx = ((start.x - global.scrollX) * tileSpacing + 1 + halfSize) * global.treeScale + halfWidth,
                    sy = ((start.y - global.scrollY) * tileSpacing + 1 + halfSize) * global.treeScale + halfHeight,
                    ex = ((end.x - global.scrollX) * tileSpacing + 1 + halfSize) * global.treeScale + halfWidth,
                    ey = ((end.y - global.scrollY) * tileSpacing + 1 + halfSize) * global.treeScale + halfHeight;
                
                // Culling check with margin
                if (ex < -CULL_MARGIN || sx > global.screenWidth + CULL_MARGIN || 
                    ey < -CULL_MARGIN || sy > global.screenHeight + CULL_MARGIN) continue;
                
                ctx[2].moveTo(sx, sy);
                ctx[2].lineTo(ex, ey);
            }
            ctx[2].stroke();

            // Draw tank icons (optimized with culling)
            let angle = -Math.PI / 4;
            const scaledTileSize = tileSize * global.treeScale;
            
            for (let { x, y, colorIndex, index } of tilesToRender) {
                let ax = (x - global.scrollX) * scaledSpacing + halfWidth,
                    ay = (y - global.scrollY) * scaledSpacing + halfHeight;
                
                // Culling check with margin
                if (ax < -scaledTileSize - CULL_MARGIN || ax > global.screenWidth + CULL_MARGIN || 
                    ay < -scaledTileSize - CULL_MARGIN || ay > global.screenHeight + CULL_MARGIN) continue;
                
                drawEntityIcon(index.toString(), ax, ay, scaledTileSize, scaledTileSize, global.treeScale, angle, 1, colorIndex, false, false, 1);
            }
        }


        // Draw UI elements
        drawClassTreeUI(spacing);

        ctx[2].globalAlpha = 1;
    }
    global.targetTreeScale = 1;
    global.classTreeDrag = classTreeDrag;
    function drawClassTreeUI(spacing) {
        if (!global.renderTankTree) {
            //drawText("Loading class tree...", global.screenWidth / 2, global.screenHeight / 2, 25, color.guiwhite, "center");
            return;
        }
        const uiY = spacing + 20;
        const buttonSize = 40;
        const buttonSpacing = 10;

        // Draw text for a tip
        drawText("Arrow keys or mouse to navigate the class tree. Shift to navigate faster. Scroll wheel, (+/- keys) or zoom buttons to zoom in/out.", global.screenWidth / 2, spacing + 10, 17, color.guiwhite, "center");
        
        // Draw search bar (centered)
        const searchBarWidth = 300;
        const searchBarHeight = 35;
        const searchBarX = global.screenWidth / 2 - searchBarWidth / 2;
        const searchBarY = uiY;
        
        // Highlight if active
        ctx[2].globalAlpha = global.searchBarActive ? 0.95 : 0.8;
        ctx[2].fillStyle = global.searchBarActive ? color.vlgrey : color.white;
        ctx[2].fillRect(searchBarX, searchBarY, searchBarWidth, searchBarHeight);
        ctx[2].strokeStyle = global.searchBarActive ? color.blue : color.black;
        ctx[2].lineWidth = global.searchBarActive ? 3 : 2;
        ctx[2].strokeRect(searchBarX, searchBarY, searchBarWidth, searchBarHeight);
        ctx[2].globalAlpha = 1;
        
        const displayText = global.searchBarActive && !global.searchQuery 
            ? "Type to search..." 
            : global.searchQuery || "Click to search tanks...";
        const textColor = color.white;
        const showCursor = global.searchBarActive && Date.now() % 1000 < 500;
        
        drawText(
            displayText + (showCursor ? "|" : ""),
            searchBarX + 10,
            searchBarY + searchBarHeight / 2,
            14,
            textColor,
            "left",
            true
        );
        
        // Draw zoom buttons (moved to accommodate search bar position)
        const zoomInX = searchBarX + searchBarWidth + buttonSpacing + 20;
        const zoomOutX = zoomInX + buttonSize + buttonSpacing;
        
        // Zoom In button
        drawButton(
            zoomInX,
            searchBarY,
            buttonSize,
            searchBarHeight,
            1,
            "rect",
            "+",
            20,
            color.grey,
            color.black,
            color.black,
            true,
            "classTreeZoomIn",
            global.canvas.height / global.screenHeight / global.ratio,
            0
        );
        
        // Zoom Out button
        drawButton(
            zoomOutX,
            searchBarY,
            buttonSize,
            searchBarHeight,
            1,
            "rect",
            "-",
            20,
            color.grey,
            color.black,
            color.black,
            true,
            "classTreeZoomOut",
            global.canvas.height / global.screenHeight / global.ratio,
            1
        );

        // Draw close button (X) on the left
        const closeButtonSize = 35;
        const closeButtonX = searchBarX - buttonSpacing * 2.6;
        const closeButtonY = uiY;
        // Draw close button
        drawButton(
            closeButtonX,
            closeButtonY,
            closeButtonSize,
            closeButtonSize,
            1,
            "rect",
            "??,
            24,
            color.red,
            color.black,
            color.black,
            true,
            "classTreeClose",
            global.canvas.height / global.screenHeight / global.ratio,
            0
        );
        
        // Draw search results info
        const instructionY = searchBarY + searchBarHeight + 5;
        if (global.searchQuery) {
            const resultsText = searchResults.length > 0 
                ? `Found ${searchResults.length} tank${searchResults.length !== 1 ? 's' : ''} (showing upgrade paths)`
                : "No tanks found - showing Basic";
            drawText(
                resultsText,
                global.screenWidth / 2,
                instructionY + 10,
                11,
                searchResults.length > 0 ? color.green : color.orange,
                "center"
            );
        }
    }

    function drawMessages(spacing, alcoveSize) {
        // Draw messages
        let height = 18;
        let x = global.screenWidth / 2;
        let y = spacing + 5;
        if (global.mobile) {
            if (global.canUpgrade) {
                mobileUpgradeGlide.set(0 + (global.canUpgrade || global.upgradeHover));
                y += (alcoveSize / 1.4 /*+ spacing * 2*/) * mobileUpgradeGlide.get();
            }
            y += global.canSkill || global.showSkill ? (alcoveSize / 2.2 /*+ spacing * 2*/) * statMenu.get() : 0;
        }

        // Draw each message
        var Bd = Date.now();
        var yy = config.animationSettings.ScaleBar;
        for (let i = global.messages.length - 1; i >= 0; i--) {
            let msg = global.messages[i],
                txt = msg.text,
                time = Bd - msg.time,
                duration = msg.duration - time,
                text = txt;

            if (0 >= duration) {
                 global.messages.splice(i, 1);
                 continue;
            }

            let K = Math.max(0, Math.min(1, time / 300, duration / 300));
            if (msg.textJSON) { // If a message is like a big ass box then draw this instead.
                let len = 0;
                // Give it a textobj if it doesn't have one
                msg.textJSON.forEach((txt) => {
                    if (len < measureText(txt, height - 4.25, false)) len = measureText(txt, height - 4.25, false)
                })
                ctx[2].globalAlpha = 0.5 * K;
                // Draw the background
                drawBarAdvanced(x - len / 2, x + len / 2, y + yy / 2, height, color.black, 17.5 * (msg.textJSON.length) - 17.5 + 1);
                ctx[2].globalAlpha = K;
                // Draw the text
                msg.textobjs = [];
                msg.textJSON.forEach((txt) => {
                    msg.textobjs[msg.textobjs.length] = function () { }; // For some reason this fixes the text's location i guess.
                    drawText(txt, x - len / 2 + 2, y + 16 + 17.5 * (msg.textobjs.length - 1), height - 4.3, color.guiwhite, "left", false, 1, 5.5);
                })
                y += 23 * K + 17.5 * (3 - 2 * K) * (msg.textJSON.length - 1) * K * K;
            } else {
                // Give it a textobj if it doesn't have one
                if (msg.len == null) msg.len = measureText(text, height - 4.3);
                // Draw the background
                ctx[2].globalAlpha = 0.5 * K;
                drawBar(x - msg.len / 2, x + msg.len / 2, y + yy / 2, height + 2, color.black);
                // Draw the text
                ctx[2].globalAlpha = K;
                drawText(text, x, y + yy / 1.3, height - 4.3, color.guiwhite, "center", false, 1, 5.5);
                y += 23 * (3 - 2 * K) * K * K;
            }
        }
        ctx[2].globalAlpha = 1;
    }

    function drawChatMessages(x, y, py, instance, ratio, alpha, isize) {
        if (!(instance.id === gui.playerid) && instance.alpha < 0.25) return;
        let size = isize * ratio,
            g = Math.max(20, size);
    
        if (!y) y = instance.id === gui.playerid
            ? global.player.screeny - 1 * global.showChatGlide * g
            : ratio * instance.render.y - py;
        //put chat msg above name
        let fade = instance.render.status.getFade();
        fade *= fade;
        ctx[1].globalAlpha = fade;
    
        x += global.screenWidth / 2;
        y += global.screenHeight / 2;
        if (instance.id !== gui.playerid && instance.nameplate) y -= 8 * ratio;
        let messages = global.chats[instance.id];
        if (!messages) return;
        
        const messageSpacing = 25 * 0.04 * g;
        
        // Draw all the messages
        for (let i = 0; i < messages.length; i++) {
            let chatIndex = messages.length - 1 - i;
            let chat = messages[chatIndex],
                text = chat.text,
                msgLengthHalf = measureText(text, 0.5 * g) / 2,
                barScale = global.GUIStatus.renderPlayerScores ? 2.66 : 2.26,
                textScale = global.GUIStatus.renderPlayerScores ? 2.45 : 2.05,
                valpha = chat.alpha.get();
            
            if (chat.erased && valpha === 0) {
                util.remove(global.chats[instance.id], chatIndex); // Remove the chat object
                messages.sort((a, b) => a.id - b.id); // Sort the messages or else the order will get messed up
            }
            if (chat.targetY === undefined) {
                chat.targetY = i * messageSpacing;
                chat.currentY = i === 0 ? 0 : (i-1) * messageSpacing;
            }
            chat.targetY = i * messageSpacing;
            const animationSpeed = 10;
            chat.currentY += (chat.targetY - chat.currentY) * animationSpeed / global.metrics.rendertime;
            let slideOffset = chat.currentY;
            
            // Skip rendering if completely faded out
            if (valpha <= 0) continue;
            
            ctx[1].globalAlpha = 0.5 * valpha * alpha * alpha * fade;
            drawBar(x - msgLengthHalf, x + msgLengthHalf, y - g * (instance.id === gui.playerid ? 2.26 : barScale) - slideOffset, 0.75 * g, gameDraw.getColorDark(gameDraw.getColor(instance.color.split(" ")[0])), ctx[1]);
            ctx[1].globalAlpha = valpha * alpha * fade;
            config.graphical.fontStrokeRatio *= 1.2;
            drawText(text, x, y - g * (instance.id === gui.playerid ? 2.05 : textScale) - slideOffset, 0.50 * g, color.guiwhite, "center", false, 1, true, ctx[1]);
            config.graphical.fontStrokeRatio /= 1.2;
        }
    }
    

    function drawHealth(x, y, instance, ratio, alpha, isize) {
        if (!(0.02 > alpha)) {
            let fade = instance.render.status.getFade();
            fade *= fade;
            ctx[1].globalAlpha = fade;

            let size = isize * ratio,
                indexes = instance.index.split("-"),
                m = global.mockups[parseInt(indexes[0])];
            if (!m) m = global.missingno[0];
            let realSize = (size / m.size) * m.realSize;

            if (instance.drawsHealth) {
                let health = instance.render.health.get(),
                    shield = instance.render.shield.get();
                const displayName = instance.name ? instance.name.substring(7) : "";
                const forceHealthbar = displayName.endsWith("Zombie") || [
                    "Skeleton", "Creeper", "Spider", "Cave Spider",
                ].includes(displayName);

                x += global.screenWidth / 2;
                y += global.screenHeight / 2;

                if (forceHealthbar || health < 0.99 || shield < 0.99 && global.GUIStatus.renderhealth) {
                    let col = config.graphical.coloredHealthbars ? gameDraw.mixColors(gameDraw.modifyColor(instance.color), color.guiwhite, 0.5) : color.lgreen;
                    let yy = y + realSize + 14.3 * ratio;
                    let barWidth = 1 * ratio;
                    let barChunk = (config.graphical.barChunk || 0) * ratio;
                    let seperated = config.graphical.separatedHealthbars;

                    ctx[1].globalAlpha = alpha * alpha * fade;

                    // Background bar
                    drawBar(x - size, x + size, yy, seperated ? barWidth + barChunk * 1.6 : barWidth + barChunk, color.black, ctx[1])

                    // HP bar
                    drawBar(x - size, x - size + 2 * size * health, seperated ? yy + barWidth * 1.45 : yy, barWidth + barChunk * 0.35, col, ctx[1])

                    if (shield || seperated) {
                        if (!seperated) ctx[1].globalAlpha *= 0.7;
                        ctx[1].globalAlpha *= 0.3 + 0.3 * shield;
                        drawBar(x - size, x - size + 2 * size * shield, seperated ? yy - barWidth * 1.45 : yy, barWidth + barChunk * 0.35, config.graphical.coloredHealthbars ? gameDraw.mixColors(col, color.guiblack, 0.25) : color.teal, ctx[1])
                    }
                    if (gui.showhealthtext) drawText(Math.round(instance.healthN) + "/" + Math.round(instance.maxHealthN), x, yy + barWidth * 2 + barWidth * config.graphical.separatedHealthbars * 2 + 10, 12 * ratio, color.guiwhite, "center");
                    ctx[1].globalAlpha = alpha;
                }
            }
        }
    }

    function drawName(x, y, instance, ratio, alpha, isize) {
        if (!(0.02 > alpha)) {
            let fade = instance.render.status.getFade();
            fade *= fade;
            ctx[2].globalAlpha = fade;

            let size = isize * ratio;
            x += global.screenWidth / 2;
            y += global.screenHeight / 2;

            if (instance.id !== gui.playerid && instance.nameplate) {
                var name = instance.name.substring(7, instance.name.length + 1);
                var namecolor = instance.name.substring(0, 7);
                if (name.startsWith("[FIRE] ")) name = name.slice(7);
                const isCraftrasItem = name.startsWith("[ITEM] ");
                const isCraftrasMob = name.endsWith("Zombie") || [
                    "Skeleton", "Creeper", "Spider", "Cave Spider",
                ].includes(name);
                if (isCraftrasItem) name = name.slice(7);
                ctx[1].globalAlpha = alpha * alpha * fade;
                let g = Math.max(20, size);
                if (global.GUIStatus.renderPlayerNames || isCraftrasItem || isCraftrasMob) drawText(name, x, y - g * (global.GUIStatus.renderPlayerScores ? 1.9 : 1.45), 0.55 * g, namecolor == "#ffffff" ? color.guiwhite : namecolor, "center", false, 1, true, ctx[1]);
                if (global.GUIStatus.renderPlayerScores || typeof instance.score === "string") drawText(typeof instance.score === "string" ? instance.score : util.handleLargeNumber(instance.score, 1), x, y - 1.45 * g, 0.3 * g, namecolor == "#ffffff" ? color.guiwhite : namecolor, "center", false, 1, true, ctx[1]);
                ctx[1].globalAlpha = 1;
            }
        }
    }

    function drawSkillBars(spacing, alcoveSize) {
        // Draw skill bars
        if (global.mobile) return drawMobileSkillUpgrades(spacing, alcoveSize);
        statMenu.set(0 + (global.died || global.statHover || (global.canSkill && !gui.skills.every(skill => skill.cap === skill.amount))));
        global.clickables.stat.hide();

        let vspacing = 5;
        let height = 14;
        let gap = 44.5;
        let len = alcoveSize - 10; // * global.screenWidth; // The 30 is for the value modifiers
        let save = len;
        let x = spacing + 3 + (statMenu.get() - 1) * (height + 50 + len * ska(gui.skills.reduce((largest, skill) => Math.max(largest, skill.cap), 0)));
        let y = global.screenHeight - spacing - 5.5 - height;
        let ticker = 11;
        let namedata;
        try {
            namedata = gui.getStatNames(global.mockups[parseInt(gui.type.split("-")[0])].statnames);
        } catch (e) {
            namedata = gui.getStatNames(global.missingno[0].statnames);
        }
        let clickableRatio = global.canvas.height / global.screenHeight / global.ratio;

        for (let i = 0; i < gui.skills.length; i++) {
            ticker--;
            //information about the bar
            let skill = gui.skills[i],
                name = namedata[ticker - 1],
                level = skill.amount,
                col = color[skill.color],
                cap = skill.softcap,
                maxLevel = skill.cap;

            if (!cap) continue;

            len = save;
            let max = 0,
                extension = cap > max,
                blocking = cap < maxLevel;
            if (extension) {
                max = cap;
            }

            //bar fills
            drawBar(x + height / 2, x - height / 2 + len * ska(cap) - 14, y + height / 2, height - 2.8 + config.graphical.barChunk, color.black);
            drawBar(x + height / 2, x + height / 2 + len * ska(cap) - gap, y + height / 2, height - 3, color.grey);
            drawBar(x + height / 2, x + height / 2 + len * ska(level) - gap, y + height / 2, height - 5.5 + config.graphical.barChunk, color.black);
            drawBar(x + height / 2, x + height / 2 + len * ska(level) - gap, y + height / 2, height - 3.5, col);

            // Blocked-off area
            if (blocking) {
                ctx[2].lineWidth = 1;
                ctx[2].strokeStyle = color.grey;
                for (let j = cap + 1; j < max; j++) {
                    drawGuiLine(x + len * ska(j) - gap, y + 1.5, x + len * ska(j) - gap, y - 3 + height);
                }
            }

            // Vertical dividers
            ctx[2].strokeStyle = color.black;
            ctx[2].lineWidth = 1;
            for (let j = 1; j < level + 1; j++) {
                drawGuiLine(x + len * ska(j) - gap, y + 1.5, x + len * ska(j) - gap, y - 3 + height);
            }

            // Skill name
            len = save * ska(max);
            let textcolor = level == maxLevel ? col : !gui.points || (cap !== maxLevel && level == cap) ? color.grey : color.guiwhite;
            drawText(name, Math.round(x + len / 2) - 5.5, y + height / 2, height - 4.1, textcolor, "center", true);

            // Skill key
            drawText("[" + (ticker % 10) + "]", Math.round(x + len - height * 0.25) - 14.5, y + height / 2, height - 6, textcolor, "right", true);
            if (textcolor === color.guiwhite) {
                // If it's active
                global.clickables.stat.place(ticker - 1, x * clickableRatio, y * clickableRatio, len * clickableRatio, height * clickableRatio);
            }

            // Skill value
            if (level) {
                drawText("+" + level, Math.round(x + len + 4) - 5.5, y + height / 2, height - 5, col, "left", true);
            }

            // Move on
            y -= height + vspacing;
        }

        global.clickables.hover.place(0, 0, y * clickableRatio, 0.8 * len * clickableRatio, (global.screenHeight - y) * clickableRatio);
        if (gui.points !== 0) {
            // Draw skillpoints to spend
            drawText("x" + gui.points, Math.round(x + len - 2) - 13, Math.round(y + height - 4) + 2, 18.5, color.guiwhite, "right");
        }
    }

    function drawSelfInfo(max) {
        //rendering information
        let width = 440,
            scorewidth = 70,
            scorelength = 0,
            height = 25.5,
            x = (global.screenWidth - width) / 2,
            y = global.screenHeight - 22 - height;
        ctx[2].lineWidth = 10;
        drawBar(x, x + width, y + height / 2, height - 3 + config.graphical.barChunk, color.black);
        drawBar(x, x + width, y + height / 2, height - 3, color.grey);
        drawBar(x, x + width * gui.__s.getProgress(), y + height / 2, height - 3.5, color.gold);
        drawText("Level " + gui.__s.getLevel() + " " + gui.class, x + width / 2 + 1, y + height / 2 + 9, 21, color.guiwhite, "center", false, 6);
        height = 17;
        y -= height + 5;
        if (global.GUIStatus.renderPlayerKillbar) {
            scorelength = -112.2;
            scorewidth = 160;
            drawBar(x + scorewidth - scorelength, x + width - scorewidth - scorelength, y + height / 2, height - 3 + config.graphical.barChunk, color.black);
            drawBar(x + scorewidth - scorelength, x + width - scorewidth - scorelength, y + height / 2, height - 3, color.grey);
            drawBar(x + scorewidth - scorelength, x - scorelength + width * ((scorewidth / width) + ((width - scorewidth * 2) / width) * (1 ? Math.min(1, gui.__s.getKills()[0] / 1) : 1)), y + height / 2, height - 3.5, color.teal);
            drawText("Kills: " + util.formatKills(...gui.__s.getKills()), x + width / 2 + 0.5 - scorelength, y + height / 2 + 6, 13, color.guiwhite, "center");
            scorelength = 72.5;
            scorewidth = 120;
        }
        drawBar(x + scorewidth - scorelength, x + width - scorewidth - scorelength, y + height / 2, height - 3 + config.graphical.barChunk, color.black);
        drawBar(x + scorewidth - scorelength, x + width - scorewidth - scorelength, y + height / 2, height - 3, color.grey);
        drawBar(x + scorewidth - scorelength, x - scorelength + width * ((scorewidth / width) + ((width - scorewidth * 2) / width) * (max ? Math.min(1, gui.__s.getScore() / max) : 1)), y + height / 2, height - 3.5, color.green);
        drawText("Score: " + util.formatLargeNumber(Math.round(gui.__s.getScore())), x + width / 2 + 0.5 - scorelength, y + height / 2 + 6, 13, color.guiwhite, "center");
        ctx[2].lineWidth = 4;
        var name = global.player.name.substring(7, global.player.name.length + 1);
        drawText(name, Math.round(x + width / 2) + 1.5, Math.round(y - 10 - 4) - 1, 31, global.nameColor == "#ffffff" ? color.guiwhite : global.nameColor, "center");
    }

    function handleSpeedMonitor() {
        if ((100 * gui.fps) < 100) global.serverStats.lag_color = color.orange; else global.serverStats.lag_color = color.guiwhite;
        if (global.metrics.rendertime < 10) global.metrics.rendertime_color = color.orange; else global.metrics.rendertime_color = color.guiwhite;
        if (global.serverStats.mspt > 28.0) {
            global.serverStats.mspt_color = color.red;
        } else if (global.serverStats.mspt > 20.0) {
            global.serverStats.mspt_color = color.orange;
        } else global.serverStats.mspt_color = color.guiwhite;
    }
    const xc = { cc: 0, dc: 0 };
    function drawMinimapAndDebug(spacing, alcoveSize, GRAPHDATA) {
        // Draw minimap and FPS monitors
        // Minimap stuff starts here
        let len = alcoveSize; // * global.screenWidth;
        let height = (len / global.gameWidth) * global.gameHeight;
        let upgradeColumns = Math.ceil(gui.upgrades.length / 9);
        let x = global.mobile ? spacing : global.screenWidth - spacing - len - 5;
        let y = global.mobile ? spacing : global.screenHeight - height - spacing - 5;
        if (global.GUIStatus.renderMinimap) {
            if (global.mobile) {
                y += global.canUpgrade ? (alcoveSize / 1.5) * mobileUpgradeGlide.get() * upgradeColumns / 1.5 + spacing * (upgradeColumns + 1.55) + 9 : 0;
                y += global.canSkill || global.showSkill ? statMenu.get() * alcoveSize / 2.6 + spacing / 0.75 : 0;
            }

            // Calculate minimap center if needed
            let centerX = x + len / 2;
            let centerY = y + height / 2;
        
            ctx[2].globalAlpha = 0.4;
            ctx[2].save();
            ctx[2].fillStyle = color.white;
            global.advanced.roundMap ? drawGuiCircle(x + len / 2, y + height / 2, len / 2) : drawGuiRect(x, y, len, height);
            ctx[2].beginPath(); // We will not allow to draw outside of the minimap so we are only allowing minimap entities to draw INSIDE the minimap only
            global.advanced.roundMap ? ctx[2].arc(x + len / 2, y + height / 2, len / 2, 0, 2 * Math.PI) : ctx[2].rect(x, y, len, height); // Draw everything inside the minimap
            ctx[2].clip();

            if (global.roomSetup.length) {
                let W = global.roomSetup[0].length,
                    H = global.roomSetup.length,
                    i = 0;

                // Calculate player's position in game world
                let playerWorldX = global.player.cx.animX;
                let playerWorldY = global.player.cy.animY;

                for (let ycell = 0; ycell < H; ycell++) {
                    let j = 0;
                    for (let xcell = 0; xcell < W; xcell++) {
                        let cell = global.roomSetup[ycell][xcell];
                        // Calculate cell world position
                        let cellWorldX = (xcell / W - 0.5) * global.gameWidth;
                        let cellWorldY = (ycell / H - 0.5) * global.gameHeight;
                        
                        // Calculate relative position to player
                        let relX = cellWorldX - playerWorldX;
                        let relY = cellWorldY - playerWorldY;
                        
                        // Convert to minimap coordinates
                        let minimapX = config.game.centeredMinimap ? centerX + (relX / global.gameWidth) * len : x + (j * len) / W;
                        let minimapY = config.game.centeredMinimap ? centerY + (relY / global.gameHeight) * height : y + (i * height) / H;
                        let cellWidth = len / W;
                        let cellHeight = height / H;
                        if (!cell) {
                            ctx[2].fillStyle = gameDraw.getColor("border", true);
                            drawGuiRect(minimapX, minimapY, cellWidth, cellHeight);
                        } else {
                            let color = cell.color;
                            if (color == 'none') cell.color = 'pureBlack';
                            if (cell.renderImage) {
                                ctx[2].globalAlpha = 1;
                                const previousSmoothing = ctx[2].imageSmoothingEnabled;
                                ctx[2].imageSmoothingEnabled = false;
                                ctx[2].drawImage(cell.renderImage, minimapX, minimapY, cellWidth, cellHeight);
                                ctx[2].imageSmoothingEnabled = previousSmoothing;
                            }
                            ctx[2].globalAlpha = 0.4;
                            ctx[2].fillStyle = gameDraw.getColor(color);
                            if (gameDraw.getColor(color) !== color.white) {
                                drawGuiRect(minimapX, minimapY, cellWidth, cellHeight);
                            }
                        };
                        j++;
                    }
                    i++;
                }
            }
            ctx[2].globalAlpha = 1;
            for (let entity of minimap.get()) {
                ctx[2].fillStyle = gameDraw.mixColors(gameDraw.modifyColor(entity.color), color.black, 0.3);
                ctx[2].globalAlpha = entity.alpha;
                
                // Calculate entity position relative to player
                let relX = entity.x - global.player.cx.animX;
                let relY = entity.y - global.player.cy.animY;
                
                // Convert to minimap coordinates
                let minimapX = config.game.centeredMinimap ? centerX + (relX / global.gameWidth) * len : x + (entity.x / global.gameWidth + 0.5) * len;
                let minimapY = config.game.centeredMinimap ? centerY + (relY / global.gameHeight) * height : y + (entity.y / global.gameHeight + 0.5) * height;
                
                switch (entity.type) {
                    case 2:
                        // Draw wall entities
                        let trueSize = (entity.size + 2) / 1.1283791671;
                        let sizeOnMap = (trueSize / global.gameWidth) * len;
                        drawGuiRect(minimapX - sizeOnMap, minimapY - sizeOnMap, sizeOnMap * 2, sizeOnMap * 2);
                        break;
                    case 1:
                        // Draw rock/other entities
                        let entitySize = (entity.size / global.gameWidth) * len;
                        drawGuiCircle(minimapX, minimapY, entitySize);
                        break;
                    case 0:
                        // Draw other players
                        if (entity.id !== gui.playerid) {
                            drawGuiCircle(minimapX, minimapY, !global.mobile ? 2 : 3.5);
                        }
                        break;
                }
            }

            ctx[2].globalAlpha = 1;
            ctx[2].lineWidth = 1;
            ctx[2].strokeStyle = color.guiblack;
            ctx[2].fillStyle = color.guiblack;
            // Draw yourself in the minimap
            drawGuiCircle(config.game.centeredMinimap ? centerX : x + (global.player.cx.animX / global.gameWidth + 0.5) * len, config.game.centeredMinimap ? centerY : y + (global.player.cy.animY / global.gameHeight + 0.5) * height, !global.mobile ? 2 : 3.5, false);
            ctx[2].restore();
            ctx[2].globalAlpha = 1;
            ctx[2].fillStyle = color.black;
            // Draw border of the minimap
            ctx[2].lineWidth = 3;
            global.advanced.roundMap ? drawGuiCircle(x + len / 2, y + height / 2, len / 2, true) : drawGuiRect(x, y, len, height, true); // Border
        }
        if (global.mobile || !global.GUIStatus.renderMinimap) {
            x = global.screenWidth - spacing - len;
            y = global.screenHeight - spacing;
        }
        if (global.showDebug) {
            drawGuiRect(x, y - 40, len, 30);
            lagGraph(lag.get(), x, y - 40, len, 30, color.teal);
            gapGraph(global.metrics.rendergap, x, y - 40, len, 30, color.pink);
            timingGraph(GRAPHDATA, x, y - 40, len, 30, color.yellow);
        }
        // Minimap stuff ends here
        // Debug stuff
        if (!global.showDebug) y += 13 * 3;
        // Text
        handleSpeedMonitor();

        if (!global.metrics.latency.length) global.metrics.latency.push(0);
        let ping = global.metrics.latency.reduce((b, a) => b + a, 1) / global.metrics.latency.length - 1;
        let xloc = global.player.renderx / 30;
        let yloc = global.player.rendery / 30;
        let watermarkText = "Open Source Arras";
        let versionLength = (measureText(global.version ?? "v?", 32)) / 2;
        let length = Math.max(measureText(watermarkText, 32)) / 16;
        let gradientTransition = global.showDebug ? 4.1 : 2;
        let watermarkTextPos1 = Math.round(x + len / gradientTransition) + 0.5;
        let watermarkColor = gameDraw.getColor({gradient: true, asset: [{color: `${color.blue}`}, {color: `${color.green}`}]}, ctx[2], watermarkTextPos1 - length, length * 0.085, watermarkTextPos1 + length, 0);
        if (global.showDebug) {
            let getRenderingInfo = (data, isTurret) => {
                isTurret ? global.renderingInfo.turretEntities += data.length : global.renderingInfo.entities += data.length;
                for (let instance of data) { 
                    if (instance.name && instance.id !== gui.playerid) global.renderingInfo.entitiesWithName++;
                    if (instance.turrets.length) getRenderingInfo(instance.turrets, true);
                };
            };
            getRenderingInfo(global.entities, false);
            if (!global.tankSpeedHistory) global.tankSpeedHistory = [];
            const HISTORY_LENGTH = 5;
            let rawSpeed = Math.sqrt(global.player.vx * global.player.vx + global.player.vy * global.player.vy) * config.roomSpeed;
            rawSpeed = rawSpeed * 0.765;
            global.tankSpeedHistory.push(rawSpeed);
            if (global.tankSpeedHistory.length > HISTORY_LENGTH) global.tankSpeedHistory.shift();
            let tankSpeed = global.tankSpeedHistory.reduce((sum, val) => sum + val, 0) / global.tankSpeedHistory.length;
            drawText(watermarkText, x + len - versionLength - 4, y - 50 - 10 * 14 - 2, 15, watermarkColor, "right");
            drawText(global.version ?? "v?", x + len, y - 50 - 10 * 14 - 2, 15, color.guiwhite, "right");
            drawText(`§${global.serverStats.lag_color}§ ${(100 * gui.fps).toFixed(2)}% §reset§/ ` + global.serverStats.players + ` player${global.serverStats.players == 1 ? "" : "s"}`, x + len, y - 50 - 9 * 14, 10, color.guiwhite, "right");
            drawText(`Coordinates: (${xloc.toFixed(2)}, ${yloc.toFixed(2)})`, x + len, y - 50 - 8 * 14, 10, color.guiwhite, "right");
            drawText("Speed: " + tankSpeed.toFixed(2) + " gu/s", x + len, y - 50 - 7 * 14, 10, color.guiwhite, "right");
            drawText("Memory: " + global.metrics.rendergap.toFixed(1) + " Mib", x + len, y - 50 - 6 * 14, 10, color.guiwhite, "right");
            drawText(`Rendering: e ${global.renderingInfo.entities} t: ${global.renderingInfo.turretEntities} n: ${global.renderingInfo.entitiesWithName}`, x + len, y - 50 - 5 * 14, 10, color.guiwhite, "right");
            drawText(`Bandwidth: tx ${global.bandwidth.finalHa} rx ${global.bandwidth.finalFa}`, x + len, y - 50 - 4 * 14, 10, color.guiwhite, "right");
            drawText("Update Rate: " + global.metrics.updatetime + "Hz", x + len, y - 50 - 3 * 14, 10, color.guiwhite, "right");
            drawText("Prediction: " + Math.round(GRAPHDATA) + "ms", x + len, y - 50 - 2 * 14, 10, color.guiwhite, "right");
            drawText(`§${global.metrics.rendertime_color}§ ${global.metrics.rendertime} FPS §reset§/` + `§${global.serverStats.mspt_color}§ ${global.serverStats.mspt} mspt : ${global.metrics.mspt.toFixed(1)} gmspt`, x + len, y - 50 - 1 * 14, 10, color.guiwhite, "right");
            drawText(ping.toFixed(1) + " ms / " + global.serverStats.serverGamemodeName + " " + global.locationHash, x + len, y - 50, 10, color.guiwhite, "right");
        } else if (!global.GUIStatus.minimapReducedInfo) {
            drawText(watermarkText, x + len, y - 50 - 3 * 14 - 2, 15, watermarkColor, "right");
            drawText(`§${global.serverStats.lag_color}§ ${(100 * gui.fps).toFixed(2)}% §reset§/ ` + global.serverStats.players + ` player${global.serverStats.players == 1 ? "" : "s"}`, x + len, y - 50 - 2 * 14, 10, color.guiwhite, "right");
            drawText(`§${global.metrics.rendertime_color}§ ${global.metrics.rendertime} FPS §reset§/` + `§${global.serverStats.mspt_color}§ ${global.serverStats.mspt} mspt`, x + len, y - 50 - 1 * 14, 10, color.guiwhite, "right");
            drawText(ping.toFixed(1) + " ms / " + global.serverStats.serverGamemodeName + " " + global.locationHash, x + len, y - 50, 10, color.guiwhite, "right");
        } else drawText(watermarkText, x + len, y - 22 - 2 * 14 - 2, 15, watermarkColor, "right");
    }

    function drawLeaderboard(spacing, alcoveSize, max) {
        // Draw leaderboard
        let lb = leaderboard.get();
        let vspacing = 4;
        let len = alcoveSize; // * global.screenWidth;
        let height = 14;
        let x = global.screenWidth - spacing - 10;
        let y = spacing + height + 13;
        lbGlide.set(0 + lb.data.length > 0);
        let glide = lbGlide.get();
        x -= lb.data.length ? len * glide : len * glide;

        // Animation things
        let mobileGlide = mobileUpgradeGlide.get();
        if (global.mobile) {
            if (global.canUpgrade && 2 * 20 + gui.upgrades.length * (6.5 * 23 + 17) > 1.4 * x) {
                y += (alcoveSize / 1.4) * mobileGlide;
            }
            y += global.canSkill || global.showSkill ? (alcoveSize / 2.2 /*+ spacing * 2*/) * statMenu.get() : 0;
        }
        drawText("Leaderboard", Math.round(x + len / 2) + 0.5, Math.round(y - 6) + 0.5, height + 3.5, color.guiwhite, "center", false, 1, 5.5);
        y += 7;

        for (let i = 0; i < lb.data.length; i++) {
            let entry = lb.data[i];
            let lbEntry = leaderboardEntries[entry.id];
            if (!lbEntry) {
                lbEntry = leaderboardEntries[entry.id] = {
                    ...entry,
                    leaderboardUpdate,
                    animX: Smoothbar(0, 0.30, 1.5, 0.045, true),
                    animY: Smoothbar(0, 0.30, 1.5, 0.045, true),
                    x: 0,
                    y: i,
                    targetX: 1,
                    targetY: i
                };
            }
            if (lbEntry.y !== i && lbEntry.targetY !== i) lbEntry.targetY = i;

            lbEntry.image = entry.image;
            lbEntry.position = entry.position;
            lbEntry.barColor = entry.barColor;
            lbEntry.label = entry.label;
            lbEntry.score = entry.score;
            lbEntry.nameColor = entry.nameColor;
            lbEntry.visible = true;
            lbEntry.update = leaderboardUpdate;
        }
        for (let id in leaderboardEntries) {
            let entry = leaderboardEntries[id];
            if (entry.update !== leaderboardUpdate && entry.targetX !== 0) entry.targetX = 0;
            if (entry.update === leaderboardUpdate && entry.targetX === 0) entry.targetX = 1;
            if (entry.animX.get() > 0.999) {
                entry.animX.force(0);
                entry.x = entry.targetX;
                if (entry.x === 0) { 
                    entry.visible = false;
                    delete leaderboardEntries[id];
                };
            }
            if (entry.animY.get() > 0.999) {
                entry.animY.force(0);
                entry.y = entry.targetY;
            }
            if (entry.x !== entry.targetX) entry.animX.set(1);
            if (entry.y !== entry.targetY) entry.animY.set(1);

            if (entry.visible) {
                let scale = height / entry.position.axis;
                let fullX = global.screenWidth + 1.5 * height + scale * entry.position.middle.x * Math.SQRT1_2 + 10;
                let entryX = entry.x ? x : fullX;
                if (entry.x !== entry.targetX) entryX = entryX + entry.animX.get() * ((entry.targetX ? x : fullX) - entryX);
                let entryPos = entry.y;
                if (entry.y !== entry.targetY) entryPos = entry.y + entry.animY.get() * (entry.targetY - entry.y);
                let entryY = y + (vspacing + height) * entryPos;

                drawBar(entryX, entryX + len, entryY + height / 2 - .7, height - 3 + config.graphical.barChunk, color.black);
                drawBar(entryX, entryX + len, entryY + height / 2 - .7, height - 3, color.grey);
                let shift = Math.min(1, entry.score / max);
                drawBar(entryX, entryX + len * shift, entryY + height / 2 - .7, height - 3.5, gameDraw.modifyColor(entry.barColor, "mirror 0 1 0 false"));

                // Leadboard name + score
                let nameColor = entry.nameColor || "#FFFFFF";
                let overwritelabel = entry.label.includes("#")
                    ? entry.label.replace("##", Math.round(entry.score).toString()).replace("#s", 1 === Math.round(entry.score) ? "" : "s")
                    : false;
                drawText(overwritelabel ? overwritelabel : entry.label + (": " + util.handleLargeNumber(Math.round(entry.score))), entryX + len / 2, entryY + height / 2, height - 4.5, nameColor == "#ffffff" ? color.guiwhite : nameColor, "center", true);

                // Mini-image
                if (entry.renderEntity) {
                    let xx = entryX - 1.5 * height - scale * entry.position.middle.x * Math.SQRT1_2,
                        yy = entryY + 0.5 * height - scale * entry.position.middle.y * Math.SQRT1_2,
                        baseColor = entry.color;
                    drawEntity(baseColor, xx, yy, entry.image, 1 / scale, 1, (scale * scale) / entry.image.size, (scale * scale) / entry.image.size / 8.5, -Math.PI / 4, true, ctx[2], false, entry.image.render, false, true);
                }
            }
        }
        leaderboardUpdate++;
    }

    function drawAvailableUpgrades(spacing, alcoveSize) {
        // Draw upgrade menu
        if (global.optionsMenu_Anim.isOpened) global.clickables.upgrade.hide();
        if (gui.upgrades.length > 0) {
            let internalSpacing = 15;
            let len = alcoveSize / 2;
            let height = len;

            // Animation processing
            global.columnCount = Math.max(global.mobile ? 9 : 3, Math.floor(gui.upgrades.length ** 0.55));
            if (!global.canUpgrade) {
                upgradeMenu.force(-global.columnCount * 3)
                global.canUpgrade = true;
            } else
                if (global.pullUpgradeMenu) {
                    upgradeMenu.set(-global.columnCount * 3);
                } else upgradeMenu.set(0);
            let glide = upgradeMenu.get();

            upgradeSpin = Date.now() * 0.0005;
            upgradeSpin = upgradeSpin - (Math.floor(upgradeSpin / Math.PI / 2) * Math.PI * 2);

            let x = glide * 2 * spacing + spacing + 5;
            let y = spacing - height - internalSpacing + 5;
            let xStart = x;
            let initialX = x;
            let rowWidth = 0;
            let initialY = y;
            let ticker = 0;
            let upgradeNum = 0;
            let colorIndex = 0;
            let clickableRatio = global.canvas.height / global.screenHeight / global.ratio;
            let lastBranch = -1;
            let upgradeHoverIndex = global.clickables.upgrade.check({ x: global.mouse.x, y: global.mouse.y });

            for (let i = 0; i < gui.upgrades.length; i++) {
                let upgrade = gui.upgrades[i];
                let upgradeBranch = upgrade[0];
                let upgradeBranchLabel = upgrade[1] == "undefined" ? "" : upgrade[1];
                let model = upgrade[2];

                // Draw either in the next row or next column
                if (ticker === global.columnCount || upgradeBranch != lastBranch) {
                    x = xStart;
                    y += height + internalSpacing;
                    if (upgradeBranch != lastBranch) {
                        if (upgradeBranchLabel.length > 0) {
                            drawText(" " + upgradeBranchLabel, xStart, y + internalSpacing * 2, internalSpacing * 2.3, color.guiwhite, "left", false);
                            y += 3 * internalSpacing;
                        }
                        colorIndex = 0;
                    }
                    lastBranch = upgradeBranch;
                    ticker = 0;
                } else {
                    x += len + internalSpacing;
                }

                if (y > initialY) initialY = y;
                rowWidth = x;
                !global.optionsMenu_Anim.isOpened && global.clickables.upgrade.place(i, x * clickableRatio, y * clickableRatio, len * clickableRatio, height * clickableRatio);
                let upgradeKey = getClassUpgradeKey(upgradeNum);

                drawEntityIcon(model, x, y, len, height, 1, upgradeSpin, 0.6, colorIndex++, !global.mobile ? upgradeKey : false, !global.mobile ? upgradeNum == upgradeHoverIndex : false);

                ticker++;
                upgradeNum++;
            }

            // Draw dont upgrade button
            let h = 19.1,
                textScale = h - 6,
                msg = "Don't Upgrade",
                m = measureText(msg, textScale),
                buttonX = initialX + (rowWidth + len - initialX) / 2,
                buttonY = initialY + height + internalSpacing - 5;

            drawButton(buttonX, buttonY, m, h, 1, "rect", msg, textScale - 3.3, false, false, false, true, "skipUpgrades", clickableRatio, 0);

            if (gui.dailyTank && gui.dailyTank.tank) {
                let image = util.requestEntityImage(gui.dailyTank.tank, gui.color);
                let hover = global.clickables.dailyTankUpgrade.check({ x: global.mouse.x, y: global.mouse.y });
                image.upgradeColor = "36 0 1 0 false";
                drawEntityIcon(image, xStart, initialY + height + internalSpacing + 50, len, height, 1, upgradeSpin, 0.4, 10, false, hover);
                drawText("Daily Tank!", xStart + 50, initialY + height + internalSpacing + 67, 12, gameDraw.getColor(36), "center");
                global.clickables.dailyTankUpgrade.set(xStart * clickableRatio, (initialY + height + internalSpacing + 50) * clickableRatio, len * clickableRatio, height * clickableRatio);
                gui.dailyTank.ads && drawButton(xStart + 50, initialY + height + internalSpacing + 160, m, h, 1, "rect", "Watch An Ad", textScale - 3.3, false, false, false, true, "dailyTankAd", clickableRatio, false);
            }

            // Upgrade tooltip
            if (upgradeHoverIndex > -1 && upgradeHoverIndex < gui.upgrades.length && !global.mobile) {
                let picture = gui.upgrades[upgradeHoverIndex][2];
                if (picture.upgradeTooltip.length > 0) {
                    let boxWidth = measureText(picture.name, alcoveSize / 10),
                        boxX = global.mouse.x * global.screenWidth / global.canvas.width + 2,
                        boxY = global.mouse.y * global.screenHeight / global.canvas.height + 2,
                        boxPadding = 6,
                        splitTooltip = picture.upgradeTooltip.split("\n"),
                        textY = boxY + boxPadding + alcoveSize / 10;

                    // Tooltip box width
                    for (let line of splitTooltip) boxWidth = Math.max(boxWidth, measureText(line, alcoveSize / 15));

                    // Draw tooltip box
                    gameDraw.setColor(ctx[2], color.dgrey);
                    ctx[2].lineWidth /= 1.5;
                    drawGuiRect(boxX, boxY, boxWidth + boxPadding * 3, alcoveSize * (splitTooltip.length + 1) / 10 + boxPadding * 3, false);
                    drawGuiRect(boxX, boxY, boxWidth + boxPadding * 3, alcoveSize * (splitTooltip.length + 1) / 10 + boxPadding * 3, true);
                    ctx[2].lineWidth *= 1.5;
                    drawText(picture.name, boxX + boxPadding * 1.5, textY, alcoveSize / 10, color.guiwhite);

                    for (let t of splitTooltip) {
                        textY += boxPadding + alcoveSize / 15
                        drawText(t, boxX + boxPadding * 1.5, textY, alcoveSize / 15, color.guiwhite);
                    }
                }
            }
        } else {
            global.canUpgrade = false;
            upgradeMenu.force(0);
            global.clickables.upgrade.hide();
            global.clickables.skipUpgrades.hide();
        }
    }

    // MOBILE UI FUNCTIONS
    function drawMobileJoysticks() {
        // Draw the joysticks.
        let radius = Math.min(
            global.mobileStatus.useBigJoysticks ? global.screenWidth * 0.8 : global.screenWidth * 0.6,
            global.mobileStatus.useBigJoysticks ? global.screenHeight * 0.16 : global.screenHeight * 0.12
        );

        ctx[2].globalAlpha = 0.3;
        ctx[2].fillStyle = "#ffffff";
        ctx[2].beginPath();
        ctx[2].arc(
            (global.screenWidth * 1) / 6,
            (global.screenHeight * 2) / 3,
            radius,
            0,
            2 * Math.PI
        );
        ctx[2].arc(
            (global.screenWidth * 5) / 6,
            (global.screenHeight * 2) / 3,
            radius,
            0,
            2 * Math.PI
        );
        ctx[2].fill();
        ctx[2].globalAlpha = 0.5;
        ctx[2].fillStyle = "#ffffff";
        ctx[2].beginPath();
        if (global.mobileStatus.showJoysticks && global.canvas.movementTouchPos) {
            ctx[2].arc(
                global.canvas.movementTouchPos.x + (global.screenWidth * 1) / 6,
                global.canvas.movementTouchPos.y + (global.screenHeight * 2) / 3,
                radius / 2.5,
                0,
                2 * Math.PI
            );
            ctx[2].arc(
                global.canvas.controlTouchPos.x + (global.screenWidth * 5) / 6,
                global.canvas.controlTouchPos.y + (global.screenHeight * 2) / 3,
                radius / 2.5,
                0,
                2 * Math.PI
            );
        }
        ctx[2].fill();

        // crosshair
        drawCrosshair();
    };

    function drawCrosshair() {
        if (global.mobileStatus.showCrosshair && (global.mobileStatus.enableCrosshair || global.gamepadMode)) {
            const crosshairpos = {
                x: global.screenWidth / 2 + global.player.target.x,
                y: global.screenHeight / 2 + global.player.target.y
            };
            ctx[2].lineWidth = 1;
            ctx[2].globalAlpha = 1;
            gameDraw.setColor(ctx[2], color.black);
            ctx[2].beginPath();
            ctx[2].moveTo(crosshairpos.x, crosshairpos.y - 20);
            ctx[2].lineTo(crosshairpos.x, crosshairpos.y + 20);
            ctx[2].moveTo(crosshairpos.x - 20, crosshairpos.y);
            ctx[2].lineTo(crosshairpos.x + 20, crosshairpos.y);
            ctx[2].closePath();
            ctx[2].stroke();
        }
    }

    function drawMobileButtons(spacing, alcoveSize) {
        let makeButton = (index, x, y, width, height, text, clickableRatio) => {
            // Set the clickable's position
            global.clickables.mobileButtons.place(index, x * clickableRatio, y * clickableRatio, width * clickableRatio, height * clickableRatio);

            // Draw boxes
            ctx[2].globalAlpha = 0.5;
            ctx[2].fillStyle = color.grey;
            drawGuiRect(x, y, width, height);
            ctx[2].globalAlpha = 0.1;
            ctx[2].fillStyle = color.black;
            drawGuiRect(x, y + height * 0.6, width, height * 0.4);
            ctx[2].globalAlpha = 1;

            // Draw text
            drawText(text, x + width / 2, y + height * 0.5, height * 0.6, color.guiwhite, "center", true);

            // Draw the borders
            ctx[2].strokeStyle = color.black;
            ctx[2].lineWidth = 3;
            drawGuiRect(x, y, width, height, true);
        }

        let makeButtons = (buttons, startX, startY, baseSize, clickableRatio, spacing) => {
            let x = startX, y = startY, index = 0;

            for (let row = 0; row < buttons.length; row++) {
                for (let col = 0; col < buttons[row].length; col++) {
                    makeButton(buttons[row][col][3] ?? index, x, y, baseSize * (buttons[row][col][1] ?? 1), baseSize * (buttons[row][col][2] ?? 1), buttons[row][col][0], clickableRatio);
                    x += baseSize * (buttons[row][col][1] ?? 1) + spacing;
                    index++;
                }

                x = startX;
                y += Math.max(...buttons[row].map(b => baseSize * (b[2] ?? 1))) + spacing;
            }
        }
        if (global.clickables.mobileButtons.active == null) global.clickables.mobileButtons.active = false;
        if (global.clickables.mobileButtons.altFire == null) global.clickables.mobileButtons.altFire = false;

        // Hide the buttons
        global.clickables.mobileButtons.hide();

        // Some animations.
        mobileUpgradeGlide.set(0 + (global.canUpgrade || global.upgradeHover));

        // Some sizing variables
        let clickableRatio = global.canvas.height / global.screenHeight / global.ratio;
        let upgradeColumns = Math.ceil(gui.upgrades.length / 9);
        let yOffset = 0;
        if (global.mobile) {
            yOffset += global.canUpgrade ? (alcoveSize / 1.5 /*+ spacing * 2*/) * mobileUpgradeGlide.get() * upgradeColumns / 1.5 + spacing * (upgradeColumns + 1.55) + -17.5 : 0;
            yOffset += global.canSkill || global.showSkill ? statMenu.get() * alcoveSize / 2.6 + spacing / 0.75 : 0;
        }
        let buttons;
        let baseSize = (alcoveSize - spacing * 2) / 3;

        if (global.mobile) {
            buttons = global.clickables.mobileButtons.active ? [
                [[global.clickables.mobileButtons.active ? "-" : "+"], [`Alt ${global.clickables.mobileButtons.altFire ? "Manual" : "Disabled"}`, 6], [`${!document.fullscreenElement ? "Full" : "Exit Full"} Screen`, 5]],
                [["Autofire", 3.5], ["Reverse", 3.5], ["Self-Destruct", 5]],
                [["Autospin", 3.5], ["Override", 3.5], ["Level Up", 5]],
                [["Action", 3.5], ["Special", 3.5], ["Chat", 5]],
            ] : [
                [[global.clickables.mobileButtons.active ? "-" : "+"]],
            ];
        }
        if (global.clickables.mobileButtons.altFire) buttons.push([["\u2756", 2, 2]]);

        let len = alcoveSize;
        makeButtons(buttons, len + spacing * 2, yOffset + spacing, baseSize, clickableRatio, spacing);
    }

    function drawMobileSkillUpgrades(spacing, alcoveSize) {
        global.canSkill = gui.points > 0 && gui.skills.some(s => s.amount < s.cap) && !global.canUpgrade;
        global.showSkill = !global.canUpgrade && !global.canSkill && global.died;
        statMenu.set(global.canSkill || global.showSkill || global.disconnected ? 1 : 0);
        let n = statMenu.get();
        global.clickables.stat.hide();
        let t = alcoveSize / 2,
            q = alcoveSize / 3,
            x = 2 * n * spacing - spacing,
            statNames,
            clickableRatio = global.canvas.height / global.screenHeight / global.ratio;

            try {
                statNames = gui.getStatNames(global.mockups[parseInt(gui.type.split("-")[0])].statnames);
            } catch (e) {
                statNames = gui.getStatNames(global.missingno[0].statnames);
            }

        if (global.canSkill || global.showSkill) {
            for (let i = 0; i < gui.skills.length; i++) {
                let skill = gui.skills[i],
                    softcap = skill.softcap;

                if (softcap <= 0) continue;

                let amount = skill.amount,
                    skillColor = color[skill.color],
                    cap = skill.cap,
                    name = statNames[9 - i].split(/\s+/),
                    halfNameLength = Math.floor(name.length / 2),
                    [name1, name2] = name.length === 1 ? [name[0], null] : [name.slice(0, halfNameLength).join(" "), name.slice(halfNameLength).join(" ")];

                ctx[2].globalAlpha = 0.5;
                ctx[2].fillStyle = skillColor;
                drawGuiRect(x, spacing, t, 2 * q / 3);

                ctx[2].globalAlpha = 0.1;
                ctx[2].fillStyle = color.black;
                drawGuiRect(x, spacing + q * 2 / 3 * 2 / 3, t, q * 2 / 3 / 3);

                ctx[2].globalAlpha = 1;
                ctx[2].fillStyle = color.guiwhite;
                drawGuiRect(x, spacing + q * 2 / 3, t, q / 3);

                ctx[2].fillStyle = skillColor;
                drawGuiRect(x, spacing + q * 2 / 3, t * amount / softcap, q / 3);

                ctx[2].strokeStyle = color.black;
                ctx[2].lineWidth = 1;
                for (let j = 1; j < cap; j++) {
                    let width = x + j / softcap * t;
                    drawGuiLine(width, spacing + q * 2 / 3, width, spacing + q);
                }

                cap === 0 || !gui.points || softcap !== cap && amount === softcap || global.clickables.stat.place(9 - i, x * clickableRatio, spacing * clickableRatio, t * clickableRatio, q * clickableRatio);

                if (name2) {
                    drawText(name2, x + t / 2, spacing + q * 0.55, q / 5, color.guiwhite, "center");
                    drawText(name1, x + t / 2, spacing + q * 0.3, q / 5, color.guiwhite, "center");
                } else {
                    drawText(name1, x + t / 2, spacing + q * 0.425, q / 5, color.guiwhite, "center");
                }

                if (amount > 0) {
                    drawText(`+${amount}`, x + t / 2, spacing + q * 1.3, q / 4, skillColor, "center");
                }

                ctx[2].strokeStyle = color.black;
                ctx[2].globalAlpha = 1;
                ctx[2].lineWidth = 3;
                drawGuiLine(x, spacing + q * 2 / 3, x + t, spacing + q * 2 / 3);
                drawGuiRect(x, spacing, t, q, true);

                x += n * (t + 14);
            }

            if (gui.points > 1) {
                drawText(`x${gui.points}`, x, spacing + 20, 20, color.guiwhite, "left");
            }
        }
    }; // END OF MOBILE FUNCTIONS

    let ichatInput = 0;
    function drawChatInput(x, y, instance, ratio, isize) {
        if (global.showChat === 0 || !global.canvas.chatBox) return;
        if (instance.id === gui.playerid) {
            let size = isize * ratio,
                g = Math.max(20, size);

            if (!global.showChat) {
                if (ichatInput === 0) chatInput.force(0);
                if (ichatInput >= 200) return;
                ichatInput++;
            } else if (ichatInput) {
                ichatInput = 0;
                chatInput.force(0);
            }
            if (global.died && global.showChat) {
                global.canvas.chatBox.blur();
                global.canvas.cv.focus();
                global.showChat = false;
                if (global.canvas.chatBox.value) global.canvas.chatBox.value = "";
            }

            chatInput.set(1);
            global.showChatGlide = global.showChat ? chatInput.get() : 1 - chatInput.get();
            x += global.screenWidth / 2;
            y += global.screenHeight / 2;
            let boxLengthHalf = (10.49 * g) / 2;
            global.canvas.chatBox.loadedProperly = true;
            // Box drawing
            global.canvas.chatBox.style.color = color.black;
            global.canvas.chatBox.style.backgroundColor = color.guiwhite;
            global.canvas.chatBox.style.borderColor = color.black;
            global.canvas.chatBox.style.borderWidth = 0.1 * g + 'px';
            global.canvas.chatBox.style.opacity = global.showChatGlide;
            global.canvas.chatBox.style.width = (boxLengthHalf * 2 + 0.75 * g) / global.screenWidth * 100 + `%`;
            global.canvas.chatBox.style.height = 0.95 * g + `px`;
            global.canvas.chatBox.style.left = (x - boxLengthHalf - 0.75 * g / 2) / global.screenWidth * 100 + `%`;
            global.canvas.chatBox.style.top =  (y - g * (2.26) - 0.55 * g) / global.screenWidth * window.innerWidth + `px`;
            // Input 
            global.canvas.chatInput.style.opacity = global.showChatGlide;
            global.canvas.chatInput.style["font-size"] = 0.5 * g + 'px';
            global.canvas.chatInput.style.color = color.black;
            global.canvas.chatInput.style.width = (boxLengthHalf * 2 + 0.35 * g) / global.screenWidth * 100 + `%`;
            global.canvas.chatInput.style.height = 0.95 * g + `px`;
            global.canvas.chatInput.style.left = (x - boxLengthHalf - 0.35 * g / 2) / global.screenWidth * 100 + `%`;
            global.canvas.chatInput.style.top =  (y - g * (2.26) - 0.55 * g) / global.screenWidth * window.innerWidth + `px`;
            if (global.canvas.chatBox && global.showChatGlide < 0.005 && !global.showChat) chatInput.force(0), global.canvas.chatInput.remove(), global.canvas.chatBox.remove(), global.canvas.chatBox = false;
        }
    }
    let drawAdScreen = () => {
        gameDraw.setColor(ctx[2], "#000");
        ctx[2].globalAlpha = 0.8;
        drawGuiRect(0, 0, global.screenWidth, global.screenHeight);
        let width = global.dailyTankAd.width;
        let height = global.dailyTankAd.height;
        let x = (global.screenWidth - width) / 2;
        let y = (global.screenHeight - height) / 2;
        ctx[2].globalAlpha = 1;
        gameDraw.setColor(ctx[2], "#000");
        drawGuiRect(x, y, width, height);
        gameDraw.setColor(ctx[2], color.grey);
        ctx[2].lineWidth = 3;
        drawGuiRect(x, y, width, height, true);
        if (global.dailyTankAd.readyToRender) {
            ctx[2].imageSmoothingEnabled = true;
            ctx[2].drawImage(global.dailyTankAd.render, x + 1.7, y + 1.7, width - 3.5, height - 3.6);
            ctx[2].imageSmoothingEnabled = false;
            if (global.dailyTankAd.isVideo) {
                if (!global.dailyTankAd.videoBar) {
                    global.dailyTankAd.videoBar = AdvancedSmoothBar(0, 4, 1);
                    global.dailyTankAd.videoBar.set(0);
                }
                const duration = global.dailyTankAd.render.duration;
                global.dailyTankAd.videoBar.set(global.dailyTankAd.render.currentTime);
                gameDraw.setColor(ctx[2], "#eafc47");
                drawGuiRect(x + 1.8, y + height - 22, (Math.min(width, global.dailyTankAd.render.currentTime * width / duration - 4)), 20.2);
            }
            if (global.dailyTankAd.closeable) {
                if (!global.dailyTankAd.closebtnAnim) {
                    global.dailyTankAd.closebtnAnim = AdvancedSmoothBar(0, 0.3, 1);
                    setTimeout(() => {
                        global.dailyTankAd.closebtnAnim.set(1);
                    }, 1000)
                }
                drawButton(x + width - 25, y + 7, 35, 35, global.dailyTankAd.closebtnAnim.get(), "rect", "??, 24, color.red, color.red, false, true, "dailyTankCloseAd", global.canvas.height / global.screenHeight / global.ratio, false);
            }
        } else {
            drawText("Loading...", global.screenWidth / 2, global.screenHeight / 2, 40, "#fff", "center", false, 1, false);
        }
        let wwidth = global.dailyTankAd.width + 2;
        let hheight = 35;
        gameDraw.setColor(ctx[2], "#828282");
        ctx[2].globalAlpha = 0.5;
        drawGuiRect(x - 1.5, y + height + 10, wwidth, hheight);
        ctx[2].globalAlpha = 1;
        drawText("Watch this ad to get your reward!", x + wwidth / 2, y + height + 34, 20, "#fff", "center", false, 1, false);
    }

    let getKills = () => {
        let finalKills = {
            " kills": [Math.round(global.finalKills[0].get()), 1],
            " assists": [Math.round(global.finalKills[1].get()), 0.5],
            " visitors defeated": [Math.round(global.finalKills[2].get()), 3],
            " polygons destroyed": [Math.round(global.finalKills[3].get()), 0.05],
        }, killCountTexts = [];
        let destruction = 0;
        for (let key in finalKills) {
            if (finalKills[key][0]) {
                destruction += finalKills[key][0] * finalKills[key][1];
                killCountTexts.push(finalKills[key][0] + key);
            }
        }
        return (
            (destruction === 0 ? "Peaceful"
                : destruction < 4 ? "Scratched"
                    : destruction < 8 ? "Bruised"
                        : destruction < 15 ? "Battered"
                            : destruction < 25 ? "Dangerous"
                                : destruction < 50 ? "Destructive"
                                    : destruction < 75 ? "Catastrophic"
                                        : destruction < 100 ? "Apocalyptic" : "World-ending"
            ) + " " + (!killCountTexts.length ? "A true pacifist" :
                killCountTexts.length == 1 ? killCountTexts.join(" and ") :
                    killCountTexts.slice(0, -1).join(", ") + " and " + killCountTexts[killCountTexts.length - 1])
        );
    };

    let getDeath = () => {
        let txt = "";
        if (global.finalKillers.length) {
            txt = "Defeated by";
            for (let e of global.finalKillers) {
                txt += " " + util.addArticle(util.getEntityImageFromMockup(e).name) + " and";
            }
            txt = txt.slice(0, -4);
        } else {
            txt += "Well that was kinda dumb huh";
        }
        return txt;
    };

    let getTips = () => {
        let txt = "??";
        if (global.finalKillers.length) {
            txt += "lol you died";
        } else if (!global.autolvlUp) {
            txt += "Enable auto-level up in the options menu to get level 45";
        } else {
            txt += "Kill players and polygons to get more score";
        }
        return txt;
    };

    const gameDrawDead = () => {
        let glide = global.deathAnimation.get();
        let x = global.screenWidth / 2,
            y = Math.min(global.screenHeight / 2 - 60, global.screenHeight - 500) - 800 * (1 - global.lerp(0, 1, glide)),
            len = 140,
            position = global.mockups[parseInt(gui.type.split("-")[0])].position,
            scale = len / position.axis,
            xx = global.screenWidth / 2 - scale * position.middle.x * 0.707,
            yy = y + scale * position.middle.y * Math.SQRT1_2,
            picture = util.getEntityImageFromMockup(gui.type, gui.color),
            baseColor = picture.color,
            name = global.player.name.substring(7, global.player.name.length + 1),
            timestamp = Math.floor(Date.now() / 1000);

        clearScreen(color.black, 0.1 + 0.15 * global.lerp(0, 0.5, glide), ctx[2]);
        let ratio = util.getScreenRatio();
        scaleScreenRatio(ratio, true);
        drawEntity(baseColor, (xx - 190 - len / 2 + 0.5) | 0, (yy - -5 + 0.5) | 0, picture, 1.5, 1, (0.5 * scale) / picture.realSize, 1, -Math.PI / 4, true, ctx[2]);
        drawText("Level " + gui.__s.getLevel(), x - 275, y - -80, 14, color.guiwhite, "center");
        drawText(picture.name, x - 275, y - -110, 24, color.guiwhite, "center");
        drawText(timestamp + '', x, y - 80, 10, color.guiwhite, "center");
        drawText(name == "" ? "Your Score: " : name + "'s Score: ", x - 170, y - 30, 24, color.guiwhite);
        drawText(util.formatLargeNumber(Math.round(global.finalScore.get())), x - 170, y + 25, 50, color.guiwhite);
        ctx[2].globalAlpha = global.lerp(1, 1.25, glide);
        drawText("??Survived for " + util.timeForHumans(Math.round(global.finalLifetime.get())), x - 170, y + 55, 16, color.guiwhite);
        ctx[2].globalAlpha = global.lerp(1.25, 1.5, glide);
        drawText(getKills(), x - 170, y + 77, 16, color.guiwhite);
        ctx[2].globalAlpha = global.lerp(1.5, 1.75, glide);
        drawText(getDeath(), x - 170, y + 99, 16, color.guiwhite);
        ctx[2].globalAlpha = global.lerp(1.75, 2, glide);
        drawText(getTips(), x - 170, y + 122, 16, color.guiwhite);
        ctx[2].globalAlpha = global.lerp(2, 2.25, glide);
        drawText("The server was alive for " + (100 * gui.fps).toFixed(0) + "%" + " for the run", x - 170, y + 144, 16, color.guiwhite);
        ctx[2].globalAlpha = global.lerp(3, 3.25, glide);
        if (global.cannotRespawn || global.mobile || global.gamepadMode) drawText(global.cannotRespawn ?
            global.respawnTimeout ?
            "(you may respawn in " + global.respawnTimeout + " Secon" + `${global.respawnTimeout <= 1 ? 'd' : 'ds'}` + ")"
            : "(you cannot respawn)"
            : global.mobile ? 
            "(tap to respawn)"
            : global.gamepadMode ? 
            "(Press RT or R2 button to respawn)"
            : '',
            x, y + 189, 16, color.guiwhite, "center");
        if (!global.disconnected && !global.cannotRespawn) {
            if (!global.mobile && !global.gamepadMode) {
                drawButton(x - 80, y + 195, 130, 30, global.lerp(3, 3.25, glide), "rect", "Back", 15, false, false, false, true, "exitGame", global.canvas.height / global.screenHeight / global.ratio, 0);
                drawButton(x + 80, y + 195, 130, 30, global.lerp(3, 3.25, glide), "rect", "Respawn", 15, false, false, false, true, "deathRespawn", global.canvas.height / global.screenHeight / global.ratio, 0);
            } else drawButton(x, y + 215, 150, 50, global.lerp(3, 3.25, glide), "rect", "Back", 25, false, false, false, true, "exitGame", global.canvas.height / global.screenHeight / global.ratio, 0);
        } 
    };

    const applyScreenShake = (type = "camera", returnOption = false) => {
        let properties = type == "gui" ? config.graphical.shakeProperties.UIShake : config.graphical.shakeProperties.CameraShake;
        var cdx = 0;
        var cdy = 0;
        if (properties.shakeStartTime == -1) return;
        var dt = Date.now() - properties.shakeStartTime;
        if (dt > properties.shakeDuration) {
            properties.shakeStartTime = -1;
            properties.shakeDuration = -1;
            properties.shakeAmount = -1;
            return;
        }
        var easingCoef = dt / properties.shakeDuration;
        var easing = Math.pow(easingCoef - 1, 3);
        cdx = easing * (Math.cos(dt * 0.1) + Math.cos(dt * 0.3115)) * Math.random() * properties.shakeAmount;
        cdy = easing * (Math.sin(dt * 0.05) + Math.sin(dt * 0.3115)) * Math.random() * properties.shakeAmount;
        if (properties.keepShake && dt > 100) properties.shakeStartTime = Date.now();
        if (cdx == 0 && cdy == 0) return;
        if (returnOption) return {
            dx: cdx,
            dy: cdy,
        }
        global.player.renderx += cdx;
        global.player.rendery += cdy;
    }
    const drawGameplay = (tick, ratio) => {
        // Prep stuff
        global.metrics.rendertimes++;
        global.GRAPHDATA = 0;
        let tickMotion = lasttick ? tick - lasttick : null;
        lasttick = tick;
        let motion = compensation();
        motion.set();
        global.GRAPHDATA = motion.getPrediction();
        // Move the camera
        // Don't move the camera if you're dead. This helps with jitter issues
        let playerx = global.player.animX.get(tick);
        let playery = global.player.animY.get(tick);
        if (config.graphical.lerpAnimations) {
            global.player.renderx = util.lerp(global.player.renderx, global.player.cx.x, 0.1, true);
            global.player.rendery = util.lerp(global.player.rendery, global.player.cy.y, 0.1, true);
        } else if (config.graphical.smoothcamera && config.graphical.shakeProperties.CameraShake.shakeStartTime == -1) {
            let n = null == tickMotion ? 0 : 0.99 ** tickMotion;
            global.player.renderx = global.player.renderx * n + playerx * (1 - n);
            global.player.rendery = global.player.rendery * n + playery * (1 - n);
        } else if (!config.graphical.interpolation) {
            global.player.renderx = motion.predict(global.player.lastx, global.player.cx.x, global.player.lastvx, global.player.vx),
            global.player.rendery = motion.predict(global.player.lasty, global.player.cy.y, global.player.lastvy, global.player.vy);
        } else {
            global.player.renderx = playerx;
            global.player.rendery = playery;
        }
        if (config.graphical.shakeProperties.CameraShake.shakeStartTime !== -1) applyScreenShake();
        global.player.cx.animX = playerx;
        global.player.cy.animY = playery;
        let px = ratio * global.player.renderx,
            py = ratio * global.player.rendery;

        // Get the player's target
        if (!global.mobile && !global.gamepadMode) calculateTarget();

        let spacing = 20;
        //draw the in game stuff
        drawFloor(px, py, ratio, tick);
        drawCraftrasBlocks(px, py, ratio);
        drawEntities(px, py, ratio, tick, spacing);
        drawCraftrasDaylightOverlay();
    };

    function drawCraftrasDaylightOverlay() {
        if (!global.craftrasWorld?.active) return;
        const state = global.craftrasDayCycle;
        const phaseDuration = 10 * 60 * 1000;
        const cycleDuration = phaseDuration * 3;
        const virtualTime = ((state.virtualTime + (Date.now() - state.receivedAt) * state.speed) % cycleDuration + cycleDuration) % cycleDuration;
        const phase = Math.floor(virtualTime / phaseDuration);
        const progress = (virtualTime % phaseDuration) / phaseDuration;
        const colors = [
            [210, 232, 255, 0.015],
            [255, 112, 40, 0.24],
            [5, 12, 36, 0.60],
        ];
        const transition = progress < 0.72 ? 0 : (() => {
            const t = Math.min(1, (progress - 0.72) / 0.28);
            return t * t * (3 - 2 * t);
        })();
        const from = colors[phase];
        const to = colors[(phase + 1) % colors.length];
        const mix = index => from[index] + (to[index] - from[index]) * transition;
        ctx[1].save();
        ctx[1].fillStyle = `rgba(${Math.round(mix(0))}, ${Math.round(mix(1))}, ${Math.round(mix(2))}, ${mix(3).toFixed(3)})`;
        ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
        ctx[1].restore();
    }

    const drawGUI = (tick, scaleRatio) => {
        scaleScreenRatio(scaleRatio, true);
        let ratio = util.getScreenRatio();
        //draw hud
        let spacing = 20;
        let alcoveSize = 200 / ratio; // drawRatio * global.screenWidth;
        gui.__s.update();
        let lb = leaderboard.get();
        let max = lb.max;
        global.canSkill = !!gui.points && !global.showTree && !global.pullSkillBar;
        let shake = false;
        if (config.graphical.shakeProperties.UIShake.shakeStartTime !== -1) shake = applyScreenShake("gui", true);
        if (shake) ctx[2].translate(shake.dx, shake.dy);
        if (global.mobile) { // MOBILE UI
            drawMobileJoysticks();
            drawMobileButtons(spacing, alcoveSize);
        }
        if (global.gamepadMode) drawCrosshair();
        drawCraftrasHotbar();
        drawCraftrasDebuffs();
        drawCraftrasInventory();
        if (global.GUIStatus.renderGUI) {
            drawMessages(spacing, alcoveSize);
            if (global.GUIStatus.renderUpgrades) drawSkillBars(spacing, alcoveSize);
            if (global.GUIStatus.renderPlayerBars) drawSelfInfo(max);
            drawMinimapAndDebug(spacing, alcoveSize, global.GRAPHDATA, tick);
            if (global.GUIStatus.renderLeaderboard) drawLeaderboard(spacing, alcoveSize, max);
            if (global.GUIStatus.renderUpgrades) drawAvailableUpgrades(spacing, alcoveSize);
        } else if (global.GUIStatus.renderUpgrades) drawAvailableUpgrades(spacing, alcoveSize);
        if (global.showTree) {
            drawUpgradeTree(spacing, alcoveSize);
        }
        if (shake) ctx[2].translate(-shake.dx, -shake.dy);
        global.metrics.lastrender = getNow();
    }

    function drawCraftrasHotbar() {
        const hotbar = global.craftrasHotbar;
        const isCraftras = hotbar?.active || global.craftrasWorld?.active || /craftras/i.test(global.serverStats?.serverGamemodeName || "");
        if (!isCraftras || global.died || global.disconnected) return;

        const slotCount = 10;
        const gap = 4;
        const availableWidth = Math.max(240, global.screenWidth - 24);
        const slotSize = Math.max(28, Math.min(48, (availableWidth - gap * (slotCount - 1)) / slotCount));
        const totalWidth = slotSize * slotCount + gap * (slotCount - 1);
        const startX = Math.round((global.screenWidth - totalWidth) / 2);
        const y = Math.round(global.screenHeight - slotSize - 132);

        ctx[2].save();
        ctx[2].textBaseline = "middle";
        const health = global.craftrasHealth ?? { amount: 100, max: 100 };
        const healthRatio = Math.max(0, Math.min(1, health.amount / Math.max(1, health.max)));
        const healthBarHeight = Math.max(12, Math.min(16, slotSize * 0.32));
        const healthBarY = Math.round(y - healthBarHeight - 10);
        if (global.craftrasPlacement?.active) {
            const floorMode = global.craftrasPlacement.mode === "floor";
            drawText(
                floorMode ? "FLOOR" : "WALL",
                startX + totalWidth / 2,
                healthBarY - 13,
                12,
                floorMode ? "#66d5ff" : "#70e487",
                "center",
                true,
                1,
                1,
                ctx[2],
            );
        }
        ctx[2].fillStyle = "rgba(35, 38, 43, 0.9)";
        ctx[2].fillRect(startX, healthBarY, totalWidth, healthBarHeight);
        if (healthRatio > 0) {
            ctx[2].fillStyle = healthRatio > 0.3 ? "#e44343" : "#ff3030";
            ctx[2].fillRect(startX + 2, healthBarY + 2, Math.max(0, (totalWidth - 4) * healthRatio), healthBarHeight - 4);
        }
        ctx[2].strokeStyle = "rgba(225, 230, 238, 0.82)";
        ctx[2].lineWidth = 1.5;
        ctx[2].strokeRect(startX, healthBarY, totalWidth, healthBarHeight);
        drawText(`${Math.ceil(health.amount)} / ${Math.ceil(health.max)}`, startX + totalWidth / 2, healthBarY + healthBarHeight / 2, Math.max(9, healthBarHeight * 0.68), color.guiwhite, "center", true, 1, 1, ctx[2]);
        for (let index = 0; index < slotCount; index++) {
            const x = Math.round(startX + index * (slotSize + gap));
            const selected = hotbar.selected === index;
            const item = hotbar.slots[index];

            ctx[2].fillStyle = selected ? "rgba(70, 66, 38, 0.92)" : "rgba(35, 38, 43, 0.82)";
            ctx[2].strokeStyle = selected ? "#ffd84d" : "rgba(225, 230, 238, 0.72)";
            ctx[2].lineWidth = selected ? 3 : 1.5;
            ctx[2].fillRect(x, y, slotSize, slotSize);
            ctx[2].strokeRect(x, y, slotSize, slotSize);

            drawText(index === 9 ? "0" : String(index + 1), x + 6, y + 8, Math.max(8, slotSize * 0.2), color.guiwhite, "center", false, 1, 1, ctx[2]);

            if (item && !drawCraftrasToolIcon(ctx[2], item.id, x, y, slotSize)) drawCraftrasInventoryItem({ ...item, count: 1 }, x, y, slotSize);

            if (item?.count > 1) {
                drawText(String(item.count), x + slotSize - 7, y + slotSize - 8, Math.max(9, slotSize * 0.22), color.guiwhite, "right", true, 1, 1, ctx[2]);
            }
        }
        const offhandX = Math.round(startX + totalWidth + gap * 2);
        const offhand = global.craftrasInventory?.offhand;
        ctx[2].fillStyle = "rgba(35, 38, 43, 0.82)";
            const offhandSelected = !!hotbar.offhandSelected;
            ctx[2].strokeStyle = offhandSelected ? "#ffd84d" : offhand ? "#78c8ff" : "rgba(225, 230, 238, 0.72)";
            ctx[2].lineWidth = offhandSelected ? 3 : offhand ? 2.5 : 1.5;
        ctx[2].fillRect(offhandX, y, slotSize, slotSize);
        ctx[2].strokeRect(offhandX, y, slotSize, slotSize);
        drawText("F", offhandX + 6, y + 8, Math.max(8, slotSize * 0.2), color.guiwhite, "center", false, 1, 1, ctx[2]);
        if (offhand && !drawCraftrasToolIcon(ctx[2], offhand.id, offhandX, y, slotSize)) {
            drawCraftrasInventoryItem({ ...offhand, count: 1 }, offhandX, y, slotSize);
        }
        if (offhand && craftrasShieldHealth[offhand.id]) {
            const maxDurability = craftrasShieldHealth[offhand.id];
            const broken = offhand.brokenUntil > Date.now();
            const durability = broken
                ? 0
                : Number.isFinite(offhand.durability) ? Math.max(0, Math.min(maxDurability, offhand.durability)) : maxDurability;
            const durabilityRatio = durability / maxDurability;
            const gaugeX = offhandX + slotSize + 5;
            const gaugeWidth = 9;
            ctx[2].fillStyle = "rgba(24, 27, 32, 0.9)";
            ctx[2].fillRect(gaugeX, y, gaugeWidth, slotSize);
            ctx[2].fillStyle = durabilityRatio > 0.5 ? "#4ed36b" : durabilityRatio > 0.2 ? "#f0bd3f" : "#ed4545";
            ctx[2].fillRect(gaugeX + 2, y + 2 + (slotSize - 4) * (1 - durabilityRatio), gaugeWidth - 4, (slotSize - 4) * durabilityRatio);
            ctx[2].strokeStyle = "rgba(225, 230, 238, 0.72)";
            ctx[2].lineWidth = 1;
            ctx[2].strokeRect(gaugeX, y, gaugeWidth, slotSize);
            drawText(`${Math.ceil(durability)}/${maxDurability}`, gaugeX + gaugeWidth + 4, y + slotSize / 2, Math.max(9, slotSize * 0.2), color.guiwhite, "left", true, 1, 1, ctx[2]);
        }
        ctx[2].restore();
    }

    function drawCraftrasDebuffs() {
        const debuffs = global.craftrasDebuffs;
        const isCraftras = global.craftrasHotbar?.active || global.craftrasWorld?.active || /craftras/i.test(global.serverStats?.serverGamemodeName || "");
        if (!isCraftras || !Array.isArray(debuffs) || !debuffs.length || global.died || global.disconnected) return;

        const iconSize = 48;
        const gap = 8;
        const left = 18;
        const bottom = global.screenHeight - 24;
        let hovered = null;
        let hoveredY = 0;

        ctx[2].save();
        for (let index = 0; index < debuffs.length; index++) {
            const debuff = debuffs[index];
            const y = bottom - iconSize - index * (iconSize + gap);
            const image = craftrasDebuffImages[debuff.id];

            ctx[2].fillStyle = "rgba(20, 22, 27, 0.86)";
            ctx[2].strokeStyle = debuff.id === "poison" ? "#70c95a" : "#d94b4b";
            ctx[2].lineWidth = 2;
            ctx[2].fillRect(left, y, iconSize, iconSize);
            if (image?.complete && image.naturalWidth) ctx[2].drawImage(image, left + 2, y + 2, iconSize - 4, iconSize - 4);
            ctx[2].strokeRect(left, y, iconSize, iconSize);

            const duration = debuff.remaining < 0 ? "?? : `${debuff.remaining}s`;
            drawText(duration, left + iconSize - 4, y + iconSize - 8, 12, color.guiwhite, "right", true, 1, 1, ctx[2]);
            if (global.mouse.x >= left && global.mouse.x <= left + iconSize && global.mouse.y >= y && global.mouse.y <= y + iconSize) {
                hovered = debuff;
                hoveredY = y;
            }
        }

        if (hovered) {
            const width = 286;
            const height = 84;
            const x = Math.min(left + iconSize + 10, global.screenWidth - width - 10);
            const y = Math.max(10, Math.min(hoveredY, global.screenHeight - height - 10));
            ctx[2].fillStyle = "rgba(18, 20, 25, 0.94)";
            ctx[2].strokeStyle = "rgba(230, 234, 240, 0.72)";
            ctx[2].lineWidth = 1.5;
            ctx[2].fillRect(x, y, width, height);
            ctx[2].strokeRect(x, y, width, height);
            drawText(hovered.name, x + 12, y + 18, 15, color.guiwhite, "left", true, 1, 1, ctx[2]);
            drawText(hovered.description, x + 12, y + 43, 12, "#d6d9df", "left", false, 1, 1, ctx[2]);
            const duration = hovered.remaining < 0 ? "Duration: Infinite" : `Time remaining: ${hovered.remaining}s`;
            drawText(duration, x + 12, y + 66, 11, "#aeb5c0", "left", false, 1, 1, ctx[2]);
        }
        ctx[2].restore();
    }

    function drawCraftrasInventoryItem(item, x, y, size) {
        if (!item) return;
        if (drawCraftrasToolIcon(ctx[2], item.id, x, y, size)) {
            // Tool rendered above.
        } else if (drawCraftrasMobHeadIcon(ctx[2], item.id, x, y, size)) {
            // Mob head rendered above.
        } else if (craftrasItemImages[item.id]?.complete && craftrasItemImages[item.id].naturalWidth) {
            ctx[2].save();
            if (craftrasFlatItemIds.has(item.id)) {
                ctx[2].imageSmoothingEnabled = true;
                ctx[2].drawImage(craftrasItemImages[item.id], x + size * 0.08, y + size * 0.08, size * 0.84, size * 0.84);
                ctx[2].restore();
            } else {
                const blockX = x + size * 0.16;
                const blockY = y + size * 0.16;
                const blockSize = size * 0.68;
                const wooden = item.id === "plank" || item.id === "crafting_table";
                ctx[2].fillStyle = wooden ? "#c99b68" : "#96999f";
                ctx[2].strokeStyle = wooden ? "#805d3c" : "#676a70";
                ctx[2].lineWidth = Math.max(1, size * 0.035);
                ctx[2].fillRect(blockX, blockY, blockSize, blockSize);
                ctx[2].strokeRect(blockX, blockY, blockSize, blockSize);
                ctx[2].imageSmoothingEnabled = false;
                const crop = item.id === "furnace" ? craftrasPlacedBlockCrops[11] : null;
                if (crop) ctx[2].drawImage(craftrasItemImages[item.id], crop.x, crop.y, crop.width, crop.height, blockX, blockY, blockSize, blockSize);
                else ctx[2].drawImage(craftrasItemImages[item.id], blockX, blockY, blockSize, blockSize);
                ctx[2].restore();
            }
        } else if (item.id === "stick") {
            ctx[2].save();
            ctx[2].translate(x + size / 2, y + size / 2);
            ctx[2].rotate(Math.PI / 4);
            ctx[2].fillStyle = "#9b673d";
            ctx[2].strokeStyle = "#5f3b24";
            ctx[2].lineWidth = Math.max(1, size * 0.05);
            ctx[2].fillRect(-size * 0.06, -size * 0.32, size * 0.12, size * 0.64);
            ctx[2].strokeRect(-size * 0.06, -size * 0.32, size * 0.12, size * 0.64);
            ctx[2].restore();
        } else if (item.id === "iron_ingot" || item.id === "gold_ingot") {
            ctx[2].fillStyle = item.id === "iron_ingot" ? "#e4e1d9" : "#f2c83b";
            ctx[2].strokeStyle = "#6f7073";
            ctx[2].lineWidth = 2;
            ctx[2].beginPath();
            ctx[2].moveTo(x + size * 0.2, y + size * 0.65);
            ctx[2].lineTo(x + size * 0.3, y + size * 0.35);
            ctx[2].lineTo(x + size * 0.7, y + size * 0.35);
            ctx[2].lineTo(x + size * 0.8, y + size * 0.65);
            ctx[2].closePath();
            ctx[2].fill();
            ctx[2].stroke();
        } else if (item.id === "charcoal") {
            drawCraftrasPolygon(ctx[2], x + size / 2, y + size / 2, size * 0.28, 7, 0, "#17191d", "#050607");
        } else if (item.id === "chest") {
            ctx[2].fillStyle = "#a46b32";
            ctx[2].strokeStyle = "#573719";
            ctx[2].lineWidth = 2;
            ctx[2].fillRect(x + size * 0.16, y + size * 0.25, size * 0.68, size * 0.55);
            ctx[2].strokeRect(x + size * 0.16, y + size * 0.25, size * 0.68, size * 0.55);
            ctx[2].fillStyle = "#e4bd54";
            ctx[2].fillRect(x + size * 0.44, y + size * 0.48, size * 0.12, size * 0.18);
        } else if (craftrasHelmetImages[item.id]?.complete && craftrasHelmetImages[item.id].naturalWidth) {
            ctx[2].save();
            ctx[2].imageSmoothingEnabled = true;
            drawCraftrasHelmetImage(ctx[2], craftrasHelmetImages[item.id], item.id, x + size * 0.08, y + size * 0.08, size * 0.84);
            ctx[2].restore();
        } else {
            const itemColors = {
                grass_block: "#71b957",
                dirt: "#aa7b52",
                dirt_path: "#9a7045",
                stone: "#8b9098",
                coal: "#292d33",
                iron_ore: "#ded8ce",
                gold_ore: "#efc83c",
                diamond: "#4bd7e8",
                wood: "#c69963",
                plank: "#c99b68",
                bedrock: "#111318",
                coal_block: "#252a30",
                iron_block: "#d9dde2",
                gold_block: "#efc83c",
                diamond_block: "#4bd7e8",
                creative_24h: "#f3d34a",
                creative_1h: "#7bdff2",
            };
            const blockColor = itemColors[item.id] || "#d7dbe2";
            ctx[2].fillStyle = blockColor;
            ctx[2].strokeStyle = "rgba(20, 23, 28, 0.75)";
            ctx[2].lineWidth = 2;
            const left = x + size * 0.18;
            const top = y + size * 0.18;
            const blockSize = size * 0.64;
            ctx[2].fillRect(left, top, blockSize, blockSize);
            ctx[2].strokeRect(left, top, blockSize, blockSize);
            ctx[2].fillStyle = "rgba(255, 255, 255, 0.18)";
            ctx[2].fillRect(left + 2, top + 2, blockSize - 4, blockSize * 0.18);
            ctx[2].fillStyle = "rgba(0, 0, 0, 0.16)";
            ctx[2].fillRect(left + 2, top + blockSize * 0.76, blockSize - 4, blockSize * 0.2);
        }
        if (item.count > 1) {
            drawText(String(item.count), x + size - 5, y + size - 7, Math.max(10, size * 0.24), color.guiwhite, "right", true, 1, 1, ctx[2]);
        }
    }

    const craftrasRecipeBookRecipes = [
        {
            name: "Zombie Crown",
            note: "Blacksmith Lv 40",
            pattern: [
                ["diamond", "crown_fragment", "diamond"],
                ["crown_fragment", null, "crown_fragment"],
                [null, null, null],
            ],
            output: "zombie_crown",
        },
        {
            name: "Knight's Shield",
            note: "Blacksmith Lv 30",
            pattern: [
                ["iron_ingot", "diamond", "iron_ingot"],
                ["diamond", "knight_shield_fragment", "diamond"],
                [null, "iron_ingot", null],
            ],
            output: "knight_shield",
        },
        {
            name: "Venom Sword",
            note: "Blacksmith Lv 50",
            pattern: [
                ["spider_venom", "spider_venom", "spider_venom"],
                ["string", "diamond_sword", "string"],
                ["spider_leg", "spider_leg", "spider_leg"],
            ],
            output: "venom_sword",
        },
    ];

    function drawCraftrasRecipeIcon(itemId, x, y, size) {
        ctx[2].save();
        drawCraftrasInventoryItem({ id: itemId, name: itemId, count: 1 }, x, y, size);
        ctx[2].restore();
    }

    function drawCraftrasRecipeBook(x, y, width, height) {
        ctx[2].fillStyle = "rgba(19, 23, 28, 0.94)";
        ctx[2].strokeStyle = "rgba(224, 229, 237, 0.8)";
        ctx[2].lineWidth = 2;
        optionsMenu_drawRoundedRect(x, y, width, height, 7);
        ctx[2].fill();
        ctx[2].stroke();
        drawText("Recipe Book", x + 14, y + 24, 19, "#ffd84d", "left", true, 1, 1, ctx[2]);

        const cardX = x + 10;
        const cardWidth = width - 20;
        const slotSize = 22;
        const slotGap = 3;
        for (let recipeIndex = 0; recipeIndex < craftrasRecipeBookRecipes.length; recipeIndex++) {
            ctx[2].save();
            const recipe = craftrasRecipeBookRecipes[recipeIndex];
            const cardY = y + 40 + recipeIndex * 126;
            ctx[2].fillStyle = "rgba(38, 43, 51, 0.96)";
            ctx[2].strokeStyle = "rgba(135, 145, 158, 0.65)";
            ctx[2].lineWidth = 1.25;
            optionsMenu_drawRoundedRect(cardX, cardY, cardWidth, 116, 5);
            ctx[2].fill();
            ctx[2].stroke();
            drawText(recipe.name, cardX + 10, cardY + 20, 14, color.guiwhite, "left", true, 1, 1, ctx[2]);
            if (recipe.note) drawText(recipe.note, cardX + cardWidth - 10, cardY + 20, 10, "#ffd84d", "right", true, 1, 1, ctx[2]);

            const gridX = cardX + 10;
            const gridY = cardY + 32;
            for (let row = 0; row < 3; row++) {
                for (let column = 0; column < 3; column++) {
                    const slotX = gridX + column * (slotSize + slotGap);
                    const slotY = gridY + row * (slotSize + slotGap);
                    ctx[2].fillStyle = "rgba(55, 61, 71, 0.95)";
                    ctx[2].strokeStyle = "rgba(175, 184, 196, 0.65)";
                    ctx[2].lineWidth = 1;
                    ctx[2].fillRect(slotX, slotY, slotSize, slotSize);
                    ctx[2].strokeRect(slotX, slotY, slotSize, slotSize);
                    const itemId = recipe.pattern[row][column];
                    if (itemId) drawCraftrasRecipeIcon(itemId, slotX, slotY, slotSize);
                }
            }

            const outputSize = 40;
            const outputX = cardX + cardWidth - outputSize - 13;
            const outputY = gridY + 21;
            drawText(">", outputX - 23, outputY + outputSize / 2 + 1, 24, "#c8ced8", "center", true, 1, 1, ctx[2]);
            ctx[2].fillStyle = "rgba(75, 68, 37, 0.96)";
            ctx[2].strokeStyle = "#ffd84d";
            ctx[2].lineWidth = 2;
            ctx[2].fillRect(outputX, outputY, outputSize, outputSize);
            ctx[2].strokeRect(outputX, outputY, outputSize, outputSize);
            drawCraftrasRecipeIcon(recipe.output, outputX, outputY, outputSize);
            ctx[2].restore();
        }
    }

    function drawCraftrasRecipeBookButton(x, y, width, height, open) {
        const hovered = global.mouse.x >= x && global.mouse.x <= x + width
            && global.mouse.y >= y && global.mouse.y <= y + height;
        ctx[2].fillStyle = hovered ? "rgba(83, 91, 104, 0.98)" : "rgba(43, 49, 58, 0.96)";
        ctx[2].strokeStyle = open ? "#ffd84d" : "rgba(224, 229, 237, 0.8)";
        ctx[2].lineWidth = open ? 2 : 1.5;
        optionsMenu_drawRoundedRect(x, y, width, height, 5);
        ctx[2].fill();
        ctx[2].stroke();
        drawText(open ? "Close" : "Recipes", x + width / 2, y + height / 2 + 1, 13, open ? "#ffd84d" : color.guiwhite, "center", true, 1, 1, ctx[2]);
    }

    function drawCraftrasCharacterPreview(centerX, centerY, radius, helmet) {
        const angle = Math.atan2(global.mouse.y - centerY, global.mouse.x - centerX);
        const picture = util.getEntityImageFromMockup(gui.type, gui.color);
        if (picture) {
            const scale = radius / Math.max(1, 1.5 * picture.realSize);
            drawEntity(picture.color, centerX, centerY, picture, 1.5, 1, scale, 1, angle, true, ctx[2]);
        }
        const helmetImage = craftrasHelmetImages[helmet?.id];
        if (!helmetImage?.complete || !helmetImage.naturalWidth) return;
        ctx[2].save();
        ctx[2].translate(centerX, centerY);
        ctx[2].rotate(angle + Math.PI / 2);
        ctx[2].imageSmoothingEnabled = true;
        const size = radius * 3.075;
        drawCraftrasHelmetImage(ctx[2], helmetImage, helmet?.id, -size / 2, -size / 2 - radius * 0.16, size);
        ctx[2].restore();
    }

    function drawCraftrasInventory() {
        const inventory = global.craftrasInventory;
        if (!inventory?.active || !inventory.open || global.died || global.disconnected) return;

        const columns = 10;
        const slotSize = 44;
        const gap = 5;
        const gridWidth = columns * slotSize + (columns - 1) * gap;
        const panelWidth = gridWidth + 36;
        const panelHeight = 430;
        const creative = global.craftrasCreative ?? { active: false, items: [] };
        const creativeSlotSize = 32;
        const creativeGap = 4;
        const creativeWidth = columns * creativeSlotSize + (columns - 1) * creativeGap + 24;
        const recipeWidth = 240;
        const recipeGap = 12;
        const recipeButtonWidth = 82;
        const recipeButtonHeight = 28;
        const recipeOpen = !!global.craftrasRecipeBookOpen;
        const recipeAreaWidth = recipeOpen ? recipeWidth : recipeButtonWidth;
        const totalWidth = panelWidth + recipeGap + recipeAreaWidth + (creative.active ? creativeWidth + 12 : 0);
        const groupX = Math.max(8, Math.round((global.screenWidth - totalWidth) / 2));
        const panelX = groupX + (creative.active ? creativeWidth + 12 : 0);
        const panelY = Math.round((global.screenHeight - panelHeight) / 2);
        const creativeX = groupX;
        const recipeX = panelX + panelWidth + recipeGap;
        const recipeButtonX = recipeOpen ? recipeX + recipeWidth - recipeButtonWidth - 8 : recipeX;
        const recipeButtonY = panelY + 8;

        ctx[2].save();
        let hovered = null;
        if (creative.active) {
            ctx[2].fillStyle = "rgba(19, 23, 28, 0.94)";
            ctx[2].strokeStyle = "rgba(224, 229, 237, 0.8)";
            ctx[2].lineWidth = 2;
            optionsMenu_drawRoundedRect(creativeX, panelY, creativeWidth, panelHeight, 7);
            ctx[2].fill();
            ctx[2].stroke();
            drawText("Creative", creativeX + 12, panelY + 24, 20, "#ffd84d", "left", true, 1, 1, ctx[2]);
            const creativeStartX = creativeX + 12;
            const creativeStartY = panelY + 48;
            for (let index = 0; index < creative.items.length; index++) {
                const column = index % columns;
                const row = Math.floor(index / columns);
                const x = creativeStartX + column * (creativeSlotSize + creativeGap);
                const y = creativeStartY + row * (creativeSlotSize + creativeGap);
                ctx[2].fillStyle = "rgba(53, 59, 68, 0.9)";
                ctx[2].strokeStyle = "rgba(175, 184, 196, 0.7)";
                ctx[2].lineWidth = 1.25;
                ctx[2].fillRect(x, y, creativeSlotSize, creativeSlotSize);
                ctx[2].strokeRect(x, y, creativeSlotSize, creativeSlotSize);
                drawCraftrasInventoryItem({ ...creative.items[index], count: 1 }, x, y, creativeSlotSize);
                if (global.mouse.x >= x && global.mouse.x <= x + creativeSlotSize && global.mouse.y >= y && global.mouse.y <= y + creativeSlotSize) hovered = creative.items[index];
            }
        }
        ctx[2].fillStyle = "rgba(19, 23, 28, 0.94)";
        ctx[2].strokeStyle = "rgba(224, 229, 237, 0.8)";
        ctx[2].lineWidth = 2;
        optionsMenu_drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 7);
        ctx[2].fill();
        ctx[2].stroke();
        if (recipeOpen) drawCraftrasRecipeBook(recipeX, panelY, recipeWidth, panelHeight);
        drawCraftrasRecipeBookButton(recipeButtonX, recipeButtonY, recipeButtonWidth, recipeButtonHeight, recipeOpen);
        const crafting = global.craftrasCrafting;
        const blacksmith = global.craftrasBlacksmith ?? { open: false, slot: null, offer: null, playerLevel: 0 };
        const furnace = global.craftrasFurnace ?? { open: false, slots: [null, null, null], progress: 0 };
        const chest = global.craftrasChest ?? { open: false, slots: Array(27).fill(null) };
        drawText(chest.open ? "Chest" : furnace.open ? "Furnace" : blacksmith.open ? "Blacksmith" : crafting.mode === 3 ? "Crafting Table" : "Inventory", panelX + 18, panelY + 24, 20, color.guiwhite, "left", true, 1, 1, ctx[2]);
        drawText("E / Esc", panelX + panelWidth - 18, panelY + 24, 11, "#aeb6c2", "right", false, 1, 1, ctx[2]);

        const startX = panelX + 18;
        const mainY = panelY + 205;
        if (blacksmith.open) {
            const inputSize = 52;
            const inputX = panelX + 64;
            const inputY = panelY + 72;
            const outputSize = 52;
            const outputX = panelX + 218;
            const outputY = inputY;
            const buttonX = panelX + 316;
            const buttonY = panelY + 108;
            const buttonWidth = 122;
            const buttonHeight = 34;
            const offer = blacksmith.offer;
            const currentLevel = Number(blacksmith.playerLevel) || 0;
            const enoughLevel = offer && currentLevel >= offer.cost;
            const alreadyUnlocked = !!offer?.unlocked;

            ctx[2].fillStyle = "rgba(36, 40, 47, 0.95)";
            ctx[2].strokeStyle = "rgba(175, 184, 196, 0.7)";
            ctx[2].lineWidth = 1.5;
            ctx[2].fillRect(panelX + 42, panelY + 48, panelWidth - 84, 124);
            ctx[2].strokeRect(panelX + 42, panelY + 48, panelWidth - 84, 124);

            ctx[2].fillStyle = "rgba(53, 59, 68, 0.9)";
            ctx[2].strokeStyle = blacksmith.slot ? "#ffd84d" : "rgba(175, 184, 196, 0.7)";
            ctx[2].lineWidth = blacksmith.slot ? 2.5 : 1.5;
            ctx[2].fillRect(inputX, inputY, inputSize, inputSize);
            ctx[2].strokeRect(inputX, inputY, inputSize, inputSize);
            if (!blacksmith.slot) drawText("?", inputX + inputSize / 2, inputY + inputSize / 2 + 2, 24, "#7f8996", "center", true, 1, 1, ctx[2]);
            drawCraftrasInventoryItem(blacksmith.slot, inputX, inputY, inputSize);
            if (global.mouse.x >= inputX && global.mouse.x <= inputX + inputSize && global.mouse.y >= inputY && global.mouse.y <= inputY + inputSize) hovered = blacksmith.slot || { id: "blacksmith_slot", name: "Unlock Item" };

            drawText(">", panelX + 166, inputY + 31, 30, "#c8ced8", "center", true, 1, 1, ctx[2]);

            ctx[2].fillStyle = "rgba(70, 76, 86, 0.95)";
            ctx[2].strokeStyle = offer && !alreadyUnlocked ? "#ffd84d" : "rgba(175, 184, 196, 0.7)";
            ctx[2].lineWidth = offer && !alreadyUnlocked ? 2.5 : 1.5;
            ctx[2].fillRect(outputX, outputY, outputSize, outputSize);
            ctx[2].strokeRect(outputX, outputY, outputSize, outputSize);
            if (offer?.output) drawCraftrasInventoryItem({ id: offer.output, name: offer.name, count: 1 }, outputX, outputY, outputSize);
            if (global.mouse.x >= outputX && global.mouse.x <= outputX + outputSize && global.mouse.y >= outputY && global.mouse.y <= outputY + outputSize && offer) hovered = { id: offer.output, name: offer.name };

            drawText(offer ? offer.name : "No Recipe", panelX + 316, panelY + 77, 16, color.guiwhite, "left", true, 1, 1, ctx[2]);
            drawText(offer ? `Level ${offer.cost} / You ${currentLevel}` : "Put a boss scroll or fragment", panelX + 316, panelY + 96, 12, offer && !enoughLevel ? "#f08a8a" : "#c8ced8", "left", false, 1, 1, ctx[2]);

            ctx[2].fillStyle = alreadyUnlocked ? "rgba(70, 76, 86, 0.95)" : enoughLevel ? "rgba(85, 94, 42, 0.95)" : "rgba(68, 52, 52, 0.95)";
            ctx[2].strokeStyle = alreadyUnlocked ? "#aeb6c2" : enoughLevel ? "#ffd84d" : "#d07070";
            ctx[2].lineWidth = 1.5;
            ctx[2].fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            ctx[2].strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
            drawText(alreadyUnlocked ? "Unlocked" : "Unlock", buttonX + buttonWidth / 2, buttonY + 22, 14, color.guiwhite, "center", true, 1, 1, ctx[2]);
        } else if (chest.open) {
            const chestColumns = 9;
            const chestSlotSize = 42;
            const chestGap = 4;
            const chestWidth = chestColumns * chestSlotSize + (chestColumns - 1) * chestGap;
            const chestX = panelX + (panelWidth - chestWidth) / 2;
            const chestY = panelY + 48;
            for (let row = 0; row < 3; row++) {
                for (let column = 0; column < chestColumns; column++) {
                    const index = row * chestColumns + column;
                    const x = chestX + column * (chestSlotSize + chestGap);
                    const y = chestY + row * (chestSlotSize + chestGap);
                    ctx[2].fillStyle = "rgba(53, 59, 68, 0.9)";
                    ctx[2].strokeStyle = "rgba(175, 184, 196, 0.7)";
                    ctx[2].lineWidth = 1.5;
                    ctx[2].fillRect(x, y, chestSlotSize, chestSlotSize);
                    ctx[2].strokeRect(x, y, chestSlotSize, chestSlotSize);
                    drawCraftrasInventoryItem(chest.slots[index], x, y, chestSlotSize);
                    if (global.mouse.x >= x && global.mouse.x <= x + chestSlotSize && global.mouse.y >= y && global.mouse.y <= y + chestSlotSize) hovered = chest.slots[index];
                }
            }
        } else if (furnace.open) {
            const furnaceSlotSize = 42;
            const inputX = panelX + 74;
            const inputY = panelY + 55;
            const fuelX = inputX;
            const fuelY = inputY + 58;
            const outputX = inputX + 150;
            const outputY = inputY + 29;
            const furnaceSlots = [[inputX, inputY], [fuelX, fuelY], [outputX, outputY]];
            for (let index = 0; index < furnaceSlots.length; index++) {
                const [x, y] = furnaceSlots[index];
                ctx[2].fillStyle = "rgba(53, 59, 68, 0.9)";
                ctx[2].strokeStyle = index === 2 && furnace.slots[index] ? "#ffd84d" : "rgba(175, 184, 196, 0.7)";
                ctx[2].lineWidth = index === 2 && furnace.slots[index] ? 2.5 : 1.5;
                ctx[2].fillRect(x, y, furnaceSlotSize, furnaceSlotSize);
                ctx[2].strokeRect(x, y, furnaceSlotSize, furnaceSlotSize);
                drawCraftrasInventoryItem(furnace.slots[index], x, y, furnaceSlotSize);
                if (global.mouse.x >= x && global.mouse.x <= x + furnaceSlotSize && global.mouse.y >= y && global.mouse.y <= y + furnaceSlotSize) hovered = furnace.slots[index];
            }
            drawText("Input", inputX + furnaceSlotSize + 9, inputY + 23, 11, "#c8ced8", "left", false, 1, 1, ctx[2]);
            drawText("Fuel", fuelX + furnaceSlotSize + 9, fuelY + 23, 11, "#c8ced8", "left", false, 1, 1, ctx[2]);
            drawText("??, outputX - 35, outputY + 23, 26, "#c8ced8", "center", true, 1, 1, ctx[2]);
            ctx[2].fillStyle = "rgba(36, 40, 47, 0.95)";
            ctx[2].fillRect(inputX + 68, inputY + 50, 58, 8);
            ctx[2].fillStyle = "#f2a33c";
            ctx[2].fillRect(inputX + 68, inputY + 50, 58 * furnace.progress, 8);
        } else if (crafting.mode) {
            const craftSize = crafting.size || 2;
            const craftSlotSize = 42;
            const craftGap = 4;
            const personalInventory = crafting.mode === 2;
            const craftX = panelX + (personalInventory ? 245 : 42);
            const craftY = panelY + 55;
            if (personalInventory) {
                const helmetX = panelX + 36;
                const helmetY = panelY + 68;
                const offhandX = panelX + 36;
                const offhandY = panelY + 120;
                const previewX = panelX + 154;
                const previewY = panelY + 105;
                ctx[2].fillStyle = "rgba(36, 40, 47, 0.95)";
                ctx[2].strokeStyle = "rgba(175, 184, 196, 0.7)";
                ctx[2].lineWidth = 1.5;
                ctx[2].fillRect(panelX + 92, panelY + 47, 124, 118);
                ctx[2].strokeRect(panelX + 92, panelY + 47, 124, 118);
                drawCraftrasCharacterPreview(previewX, previewY, 27, inventory.helmet);
                ctx[2].fillStyle = "rgba(53, 59, 68, 0.9)";
                ctx[2].strokeStyle = inventory.helmet ? "#ffd84d" : "rgba(175, 184, 196, 0.7)";
                ctx[2].lineWidth = 1.5;
                ctx[2].fillRect(helmetX, helmetY, slotSize, slotSize);
                ctx[2].strokeRect(helmetX, helmetY, slotSize, slotSize);
                if (!inventory.helmet) drawText("H", helmetX + slotSize / 2, helmetY + slotSize / 2 + 1, 18, "#7f8996", "center", true, 1, 1, ctx[2]);
                drawCraftrasInventoryItem(inventory.helmet, helmetX, helmetY, slotSize);
                if (global.mouse.x >= helmetX && global.mouse.x <= helmetX + slotSize && global.mouse.y >= helmetY && global.mouse.y <= helmetY + slotSize) hovered = inventory.helmet || { id: "helmet_slot", name: "Helmet Slot" };
                ctx[2].fillStyle = "rgba(53, 59, 68, 0.9)";
                ctx[2].strokeStyle = inventory.offhand ? "#ffd84d" : "rgba(175, 184, 196, 0.7)";
                ctx[2].lineWidth = 1.5;
                ctx[2].fillRect(offhandX, offhandY, slotSize, slotSize);
                ctx[2].strokeRect(offhandX, offhandY, slotSize, slotSize);
                if (!inventory.offhand) drawText("S", offhandX + slotSize / 2, offhandY + slotSize / 2 + 1, 18, "#7f8996", "center", true, 1, 1, ctx[2]);
                drawCraftrasInventoryItem(inventory.offhand, offhandX, offhandY, slotSize);
                if (global.mouse.x >= offhandX && global.mouse.x <= offhandX + slotSize && global.mouse.y >= offhandY && global.mouse.y <= offhandY + slotSize) hovered = inventory.offhand || { id: "shield_slot", name: "Shield Slot" };
            }
            for (let row = 0; row < craftSize; row++) {
                for (let column = 0; column < craftSize; column++) {
                    const index = row * craftSize + column;
                    const x = craftX + column * (craftSlotSize + craftGap);
                    const y = craftY + row * (craftSlotSize + craftGap);
                    ctx[2].fillStyle = "rgba(53, 59, 68, 0.9)";
                    ctx[2].strokeStyle = "rgba(175, 184, 196, 0.7)";
                    ctx[2].lineWidth = 1.5;
                    ctx[2].fillRect(x, y, craftSlotSize, craftSlotSize);
                    ctx[2].strokeRect(x, y, craftSlotSize, craftSlotSize);
                    drawCraftrasInventoryItem(crafting.slots[index], x, y, craftSlotSize);
                    if (global.mouse.x >= x && global.mouse.x <= x + craftSlotSize && global.mouse.y >= y && global.mouse.y <= y + craftSlotSize) hovered = crafting.slots[index];
                }
            }
            const craftHeight = craftSize * craftSlotSize + (craftSize - 1) * craftGap;
            const craftWidth = craftSize * craftSlotSize + (craftSize - 1) * craftGap;
            const outputX = craftX + craftWidth + 86;
            const outputY = craftY + (craftHeight - craftSlotSize) / 2;
            drawText("??, outputX - 43, outputY + craftSlotSize / 2 + 1, 28, "#c8ced8", "center", true, 1, 1, ctx[2]);
            ctx[2].fillStyle = "rgba(70, 76, 86, 0.95)";
            ctx[2].strokeStyle = crafting.output ? "#ffd84d" : "rgba(175, 184, 196, 0.7)";
            ctx[2].lineWidth = crafting.output ? 2.5 : 1.5;
            ctx[2].fillRect(outputX, outputY, craftSlotSize, craftSlotSize);
            ctx[2].strokeRect(outputX, outputY, craftSlotSize, craftSlotSize);
            drawCraftrasInventoryItem(crafting.output, outputX, outputY, craftSlotSize);
            if (global.mouse.x >= outputX && global.mouse.x <= outputX + craftSlotSize && global.mouse.y >= outputY && global.mouse.y <= outputY + craftSlotSize) hovered = crafting.output;
        }
        for (let row = 0; row < 3; row++) {
            for (let column = 0; column < columns; column++) {
                const index = 10 + row * columns + column;
                const x = startX + column * (slotSize + gap);
                const y = mainY + row * (slotSize + gap);
                ctx[2].fillStyle = "rgba(53, 59, 68, 0.9)";
                ctx[2].strokeStyle = "rgba(175, 184, 196, 0.7)";
                ctx[2].lineWidth = 1.5;
                ctx[2].fillRect(x, y, slotSize, slotSize);
                ctx[2].strokeRect(x, y, slotSize, slotSize);
                drawCraftrasInventoryItem(inventory.slots[index], x, y, slotSize);
                if (global.mouse.x >= x && global.mouse.x <= x + slotSize && global.mouse.y >= y && global.mouse.y <= y + slotSize) hovered = inventory.slots[index];
            }
        }

        const hotbarY = panelY + panelHeight - slotSize - 17;
        for (let column = 0; column < columns; column++) {
            const x = startX + column * (slotSize + gap);
            const selected = global.craftrasHotbar.selected === column;
            ctx[2].fillStyle = selected ? "rgba(79, 69, 34, 0.95)" : "rgba(53, 59, 68, 0.9)";
            ctx[2].strokeStyle = selected ? "#ffd84d" : "rgba(175, 184, 196, 0.7)";
            ctx[2].lineWidth = selected ? 3 : 1.5;
            ctx[2].fillRect(x, hotbarY, slotSize, slotSize);
            ctx[2].strokeRect(x, hotbarY, slotSize, slotSize);
            drawCraftrasInventoryItem(inventory.slots[column], x, hotbarY, slotSize);
            if (global.mouse.x >= x && global.mouse.x <= x + slotSize && global.mouse.y >= hotbarY && global.mouse.y <= hotbarY + slotSize) hovered = inventory.slots[column];
        }
        if (hovered) drawText(hovered.name || hovered.id, panelX + panelWidth / 2, panelY + panelHeight - 70, 13, color.guiwhite, "center", true, 1, 1, ctx[2]);
        if (inventory.cursor) {
            ctx[2].save();
            ctx[2].globalAlpha = 0.88;
            drawCraftrasInventoryItem(
                inventory.cursor,
                (inventory.cursorX ?? global.mouse.x) - slotSize / 2,
                (inventory.cursorY ?? global.mouse.y) - slotSize / 2,
                slotSize,
            );
            ctx[2].restore();
        }
        ctx[2].restore();
    }

    function optionsMenu_drawRoundedRect(x, y, w, h, r) {
        ctx[2].beginPath();
        ctx[2].moveTo(x+r, y);
        ctx[2].lineTo(x+w-r, y);
        ctx[2].quadraticCurveTo(x+w, y, x+w, y+r);
        ctx[2].lineTo(x+w, y+h-r);
        ctx[2].quadraticCurveTo(x+w, y+h, x+w-r, y+h);
        ctx[2].lineTo(x+r, y+h);
        ctx[2].quadraticCurveTo(x, y+h, x, y+h-r);
        ctx[2].lineTo(x, y+r);
        ctx[2].quadraticCurveTo(x, y, x+r, y);
        ctx[2].closePath();
    }

    function drawToolip(cb) {
        // Draw tooltip

        // Set fade animation
        cb.tooltipService.alpha.set(cb.tooltipService.targetAlpha);

        // And get it
        const anim = cb.tooltipService.alpha.get();

        // And dont forget the ratio
        const clickableRatio = global.canvas.height / global.screenHeight / global.ratio;
        // invisible ??skip
        if (anim > 0.001) {
            ctx[2].save();
            ctx[2].globalAlpha = anim;

            const paddingX = 9;
            const paddingY = 6;

            const splitTooltip = cb.tooltipService.text.split("\n");

            let textW = cb.tooltipService.text.length;
            for (let line of splitTooltip) textW = Math.max(textW, measureText(line, 13.5));
            const textH = 16; // font size
            const boxW = textW + paddingX * 2;
            let boxH = 0;
            if (splitTooltip.length === 1) boxH = textH + paddingY * 2.5;
            if (splitTooltip.length !== 1) for (let line of splitTooltip) boxH += textH;
            // convert from screen ??canvas
            const tipX = cb.tooltipService.x / clickableRatio;
            const tipY = cb.tooltipService.y / clickableRatio;

            // tooltip sits BELOW checkbox
            const bx = tipX;
            const by = tipY;
            let textY = by;
            // background
            ctx[2].fillStyle = "rgba(30, 30, 30, 0.45)";
            optionsMenu_drawRoundedRect(bx, by, boxW, splitTooltip.length === 1 ? boxH : boxH + 15, 8);
            ctx[2].fill();
            ctx[2].globalAlpha = anim;

            // Text
            for (let i = 0; i < splitTooltip.length; i++) {
                let text = splitTooltip[i];
                let increaseLength = splitTooltip.length === 1 ? 22 : 17.6;
                textY += increaseLength;
                drawText(text, bx + paddingX, splitTooltip.length === 1 ? textY : textY + 3, 13.5, color.guiwhite);
            }

            ctx[2].restore();
        }
    }


    function drawOptionsMenu() {
        // Initialize tab offset for sliding animation and menu height animation
        if (!global.optionsMenu_Anim.tabOffset) {
            global.optionsMenu_Anim.tabOffset = Smoothbar(global.optionsMenu_Anim.activeTab || 0, 2, 3, 0.08, 0.025, true);
        }

        const RENDERX = global.optionsMenu_Anim.switchMenu_button.get();
        const BTN_SIZE = 30;
        const BTN_WIDTH_COLLAPSED = BTN_SIZE / 1.57; // Half width when not hovering
        const BTN_WIDTH_EXPANDED = 119; // Increased from 100 to make it wider
        const BTN_X = 1;
        const BTN_Y = 25;
        const clickableRatio = global.canvas ? global.canvas.height / global.screenHeight / global.ratio : 1;
        const animValue = global.optionsMenu_Anim.optionsButtonProgress.get();
        // Check hover state
        let mpos = {
            x: global.mouse.x,
            y: global.mouse.y
        };
        
        // Update clickable area
        const currentWidth = BTN_WIDTH_COLLAPSED + (BTN_WIDTH_EXPANDED - BTN_WIDTH_COLLAPSED) * animValue;
        if (global.clickables && global.clickables.optionsMenu.switchButton) {
            if (global.optionsMenu_Anim.isOpened) {
                global.clickables.optionsMenu.switchButton.hide();
            } else global.clickables.optionsMenu.switchButton.place(0, BTN_X * clickableRatio - 4, BTN_Y * clickableRatio, currentWidth * clickableRatio + 4, BTN_SIZE * clickableRatio);
        }
        
        let hover = global.clickables && global.clickables.optionsMenu.switchButton ? global.clickables.optionsMenu.switchButton.check(mpos) === 0 : false;
        
        // Change value to activate animation
        if (hover) {
            global.optionsMenu_Anim.optionsButtonProgress.set(1);
        } else {
            global.optionsMenu_Anim.optionsButtonProgress.set(0);
        }
        
        const animatedWidth = BTN_WIDTH_COLLAPSED + (BTN_WIDTH_EXPANDED - BTN_WIDTH_COLLAPSED) * animValue;
        ctx[2].translate(RENDERX, 0);
        ctx[2].save();
        
        // Draw button background
        ctx[2].lineWidth = 3;
        gameDraw.setColor(ctx[2], color.green);
        drawGuiRect(BTN_X, BTN_Y, animatedWidth, BTN_SIZE);
        if (hover) {
            gameDraw.setColor(ctx[2], global.clickables.clicked ? "#000" : "#fff");
            ctx[2].globalAlpha = global.clickables.clicked ? 0.15 : 0.2;
            drawGuiRect(BTN_X, BTN_Y, animatedWidth, BTN_SIZE);
            ctx[2].globalAlpha = 1;
        }
        // Draw "Options" text
        if (animValue > 0.1) {
            const textX = BTN_X + BTN_WIDTH_COLLAPSED / 2 + animatedWidth - 105;
            const textY = BTN_Y + BTN_SIZE / 2;
            drawText("Options", textX, textY * 1.13, 13, color.guiwhite, "left");
        }
        ctx[2].lineWidth = 3;
        gameDraw.setColor(ctx[2], color.black);
        drawGuiRect(BTN_X, BTN_Y, animatedWidth, BTN_SIZE, true); // Draw stroke(Outline) between the box
        
        // Draw THICK border
        
        // Draw separator line between options area and arrow area (when expanded)
        if (animValue > 0.001) {
            const separatorX = BTN_X + animatedWidth - BTN_WIDTH_COLLAPSED - 2;
            ctx[2].strokeStyle = color.black;
            ctx[2].lineWidth = 6;
            ctx[2].beginPath();
            ctx[2].moveTo(separatorX, BTN_Y + 2);
            ctx[2].lineTo(separatorX, BTN_Y + BTN_SIZE - 2);
            ctx[2].stroke();
        }
        
        // Draw arrow - slides to the right as button expands - KEEP YOUR ORIGINAL ARROW
        const arrowW = BTN_WIDTH_COLLAPSED * 0.3;  // Arrow width (horizontal)
        const arrowH = BTN_SIZE * 0.3;    // Arrow height (vertical)
        
        // Arrow position moves from center of collapsed button to right edge of expanded button
        const arrowBaseX = BTN_X + BTN_WIDTH_COLLAPSED / 2;
        const arrowCenterX = arrowBaseX + animatedWidth - 19;
        const arrowCenterY = BTN_Y + BTN_SIZE / 2;
        

        const leftX = arrowCenterX - arrowW / 3; 
        const tipX = arrowCenterX + arrowW / 2; 
        const topY = arrowCenterY - arrowH / 2;
        const botY = arrowCenterY + arrowH / 2;

        ctx[2].fillStyle = "#ffffff";
        ctx[2].lineJoin = "round";
        ctx[2].lineCap = "round";
        ctx[2].lineWidth = 3;
        
        ctx[2].beginPath();
        ctx[2].moveTo(leftX, topY);
        ctx[2].lineTo(tipX, arrowCenterY);
        ctx[2].lineTo(leftX, botY);
        ctx[2].closePath();
        ctx[2].fill();
        ctx[2].strokeStyle = "#ffffff";
        ctx[2].stroke();
        
        ctx[2].restore();
        ctx[2].translate(-RENDERX, -0);

        const mainMenuAnim = global.optionsMenu_Anim.mainMenu.get();
        if (mainMenuAnim < -470) return; // fully hidden
        const PANEL_WIDTH = 460;
        const PANEL_Y = 75;
        const MAX_PANEL_HEIGHT = global.screenHeight - PANEL_Y - 25; // 10px bottom margin
        const PANEL_HEIGHT = Math.min(global.optionsMenu_Anim.mainMenuHeight.get(), MAX_PANEL_HEIGHT);

        // slide from off-screen left ??visible
        const PANEL_VISIBLE_X = mainMenuAnim;
        const PANEL_HIDDEN_X = PANEL_VISIBLE_X - PANEL_WIDTH - 30;
        const panelX = PANEL_HIDDEN_X + (PANEL_VISIBLE_X - PANEL_HIDDEN_X);

        ctx[2].save();
        ctx[2].globalAlpha = 1;

        // background
        ctx[2].lineWidth = 3;
        gameDraw.setColor(ctx[2], color.grey);
        drawGuiRect(panelX, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT);
        gameDraw.setColor(ctx[2], color.black);
        drawGuiRect(panelX, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, true);

        // Top tabs with interactive functionality
        const TAB_WIDTH = PANEL_WIDTH / 3.73; // 5.035
        const TAB_HEIGHT = 50;
        const TAB_Y = PANEL_Y - TAB_HEIGHT;
        const TAB_NAMES = global.optionsMenu_Anim.tabs;

        drawText("ingame options is not finished, expect missing features and bugs lol", panelX + PANEL_WIDTH / 2, PANEL_Y - 57, 13.5, color.guiwhite, "center");

        // Initialize tab clickables

        // Draw tabs backgrounds and place clickables
        for (let tabIndex = 0; tabIndex < TAB_NAMES.length; tabIndex++) {
            const x = panelX + tabIndex * TAB_WIDTH * 1.162;
            const tabX = x + 50;
            const tabClickableX = tabX * clickableRatio;
            const tabClickableY = TAB_Y * clickableRatio;
            const tabClickableW = TAB_WIDTH * clickableRatio;
            const tabClickableH = TAB_HEIGHT * clickableRatio;

            global.optionsMenu_Anim.tabClickables.place(tabIndex, tabClickableX, tabClickableY, tabClickableW, tabClickableH);

            const tabHover = global.optionsMenu_Anim.tabClickables.check(mpos) === tabIndex;
            
            // Draw tab background
            ctx[2].lineWidth = 3;
            gameDraw.setColor(ctx[2], gameDraw.mixColors(color.grey, color.black, 0.3));
            drawGuiRect(tabX, TAB_Y, TAB_WIDTH, TAB_HEIGHT);
            if (tabHover) {
                gameDraw.setColor(ctx[2], global.clickables.clicked ? color.guiblack : color.lgrey);
                ctx[2].globalAlpha = global.clickables.clicked ? 0.10 : 1;
                drawGuiRect(tabX, TAB_Y, TAB_WIDTH, TAB_HEIGHT);
                ctx[2].globalAlpha = 1;
            }
        }

        // Draw tabs borders
        for (let tabIndex = 0; tabIndex < TAB_NAMES.length; tabIndex++) {
            const x = panelX + tabIndex * TAB_WIDTH * 1.162;
            const tabX = x + 50;
            
            // Draw tab border
            ctx[2].lineWidth = 3;
            gameDraw.setColor(ctx[2], color.black);
            drawGuiRect(tabX, TAB_Y, TAB_WIDTH, TAB_HEIGHT, true);
        }

        // Sliding tab background and border (above borders, below text)
        const currentTab = global.optionsMenu_Anim.tabOffset.get();
        const bgX = panelX + currentTab * TAB_WIDTH * 1.162 + 50;
        gameDraw.setColor(ctx[2], color.grey);
        drawGuiRect(bgX, TAB_Y, TAB_WIDTH, TAB_HEIGHT + 3); // Extend height to cover bottom border
        // Draw border without bottom
        ctx[2].strokeStyle = color.black;
        ctx[2].lineWidth = 3;
        ctx[2].beginPath();
        ctx[2].moveTo(bgX, TAB_Y);
        ctx[2].lineTo(bgX + TAB_WIDTH, TAB_Y); // top
        ctx[2].moveTo(bgX, TAB_Y);
        ctx[2].lineTo(bgX, TAB_Y + TAB_HEIGHT); // left
        ctx[2].moveTo(bgX + TAB_WIDTH, TAB_Y);
        ctx[2].lineTo(bgX + TAB_WIDTH, TAB_Y + TAB_HEIGHT); // right
        ctx[2].stroke();

        // Draw tabs labels
        for (let tabIndex = 0; tabIndex < TAB_NAMES.length; tabIndex++) {
            const x = panelX + tabIndex * TAB_WIDTH * 1.162;
            
            // Tab label
            const cx = x + TAB_WIDTH - 11;
            const cy = TAB_Y + TAB_HEIGHT - 18;
            drawText(TAB_NAMES[tabIndex][0], cx, cy, 16, color.guiwhite, "center");
        }

        // Draw tab content with fade animation
        const fadeOptions = Math.max(0, 1 - Math.abs(0 - currentTab));
        const fadeTheme = Math.max(0, 1 - Math.abs(1 - currentTab));
        const fadeKeybinds = Math.max(0, 1 - Math.abs(2 - currentTab));

        ctx[2].save();
        ctx[2].globalAlpha *= fadeOptions;
        ctx[2].beginPath();
        ctx[2].rect(panelX, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT - 15);
        ctx[2].clip();
        if (fadeOptions > 0.01) {

            // OPTIONS TAB

            drawText("Game Appearance", panelX + PANEL_WIDTH / 2, PANEL_Y + 30, 15.5, color.guiwhite, "center");
            drawText("UI Elements",     panelX + PANEL_WIDTH / 2, PANEL_Y + 310, 15.5, color.guiwhite, "center");
            drawText("Extra",           panelX + PANEL_WIDTH / 2, PANEL_Y + 470, 15.5, color.guiwhite, "center");
            drawText("Performance",     panelX + PANEL_WIDTH / 2, PANEL_Y + 670, 15.5, color.guiwhite, "center");

            if (!global.optionsCheckboxes) {
                global.optionsCheckboxes = [
                    // Game Appearance
                    { id: "optRenderNames",         label: "Player Names",          column: 0, row: 0, section: "appearance", tooltip: "Show player names." },
                    { id: "optRenderScores",        label: "Player Scores",         column: 0, row: 1, section: "appearance", tooltip: "Show player scores." },
                    { id: "optNoGrid",              label: "Background Grid",       column: 0, row: 2, section: "appearance", tooltip: "Show the background grid.", reverseCheck: true },
                    { id: "optPointy",              label: "Sharp Traps",           column: 0, row: 3, section: "appearance", tooltip: "Sharpen the corners of traps." },
                    { id: "optSharpEdges",          label: "Sharp Polygons",        column: 0, row: 4, section: "appearance", tooltip: "Sharpen the corners of all polygons.\n" + "May slightly lower the frame rate." },
                    { id: "optSecretOptions",       label: "Secret Options",        column: 0, row: 5, section: "appearance", tooltip: "Unlock the secret options tab.\n" + "Note: Some of these options are hidden for a reason. They can cause glitches, and may get removed at any time." },

                    { id: "optChatMessages",        label: "Chat Messages",         column: 1, row: 0, section: "appearance", tooltip: "Show chat messages." },
                    { id: "optRenderHealth",        label: "Health Bars",           column: 1, row: 1, section: "appearance", tooltip: "Show health bars." },
                    { id: "separatedHealthbars",    label: "Separate Shield Bar",   column: 1, row: 2, section: "appearance", tooltip: "Separate the shield bar from the health bar." },
                    { id: "optCurvyTraps",          label: "Curvy Traps",           column: 1, row: 3, section: "appearance", tooltip: "Add curvature to the sides of traps.\n" + "May slightly lower the frame rate." },
                    { id: "optTankSkins",           label: "Tank Skins",            column: 1, row: 4, section: "appearance", tooltip: "Show tank skins.\n" + "May slightly lower the frame rate." },
                    { id: "coloredHealthbars",      label: "Colored Health Bars",   column: 1, row: 5, section: "appearance", tooltip: "Make the health and shield bar(s) of entities match their body color." },

                    // UI Elements
                    { id: "optRenderUpgrades",      label: "Upgrades",              column: 0, row: 0, section: "ui", tooltip: "Toggle the visibility of the class and skill upgrade menus." },
                    { id: "optRenderPlayerBars",    label: "Player Bars",           column: 0, row: 1, section: "ui", tooltip: "Toggle the visibility of the score and level bars." },
                    { id: "optRenderKillbar",       label: "Kill Bar",              column: 0, row: 2, section: "ui", tooltip: "Toggle the visibility of the kill bar, which shows the number of kills, assists and boss kills." },

                    { id: "optRenderLeaderboard",   label: "Leaderboard",           column: 1, row: 0, section: "ui", tooltip: "Toggle the visibility of the leaderboard." },
                    { id: "optRenderMinimap",       label: "Minimap",               column: 1, row: 1, section: "ui", tooltip: "Toggle the visibility of the minimap." },
                    { id: "optReducedInfo",         label: "Extra Info",            column: 1, row: 2, section: "ui", tooltip: "Show various extra information in the bottom right corner.", reverseCheck: true },

                    // Extra
                    { id: "smoothCamera",           label: "Smooth Camera",         column: 0, row: 0, section: "extra", tooltip: "Make the camera follow your tank instead of being fixed at it." },
                    { id: "autoLevelUp",            label: "Auto-Level Up",         column: 0, row: 1, section: "extra", tooltip: "Automatically level you up to level 45 upon joining the game." },

                    { id: "optFancy",               label: "Fading Animation",      column: 1, row: 0, section: "extra", tooltip: "Make dying entities fade out instead of shrinking until disappearing.\n" + "May slightly lower the frame rate." },
                    { id: "optIncognitoMode",       label: "Incognito Mode",        column: 1, row: 1, section: "extra", tooltip: "Hide you from the leaderboard and make your score appear low to other players." },

                    // Performance
                    { id: "optLowResolution",       label: "Low Resolution",        column: 1, row: 0, section: "perf", tooltip: "Lower the game's resolution.\n" + "May help to improve the frame rate." },
                ];

                for (const cb of global.optionsCheckboxes) {
                    let doc = document.getElementById(cb.id);
                    if (doc) cb.value = doc.checked, cb.lastValue = cb.value;
                }
            }

            const BOX_SIZE = 25;
            const LINE_HEIGHT = 40;

            for (let i = 0; i < global.optionsCheckboxes.length; i++) {
                const cb = global.optionsCheckboxes[i];
                let baseY = PANEL_Y + 45;
                if (cb.section === "ui")    baseY = PANEL_Y + 325;
                if (cb.section === "extra") baseY = PANEL_Y + 525;
                if (cb.section === "perf")  baseY = PANEL_Y + 685;

                const baseXLeft  = panelX + 20;
                const baseXRight = panelX + PANEL_WIDTH / 2 + 7.5;

                const x = (cb.column === 0 ? baseXLeft : baseXRight);
                const y = baseY + cb.row * LINE_HEIGHT;
                const hitX = x * clickableRatio;
                const hitY = y * clickableRatio;
                const hitSize = BOX_SIZE * clickableRatio;

                if (!cb.tooltipService) {
                    global.optionsCheckboxes[i].tooltipService = {
                        text: cb.tooltip,
                        targetAlpha: 0,
                        alpha: Smoothbar(0, 2, 3, 0.06, 0.025, true),
                        x: 0,
                        y: 0
                    }
                }

                cb.tooltipService.x = hitX;
                cb.tooltipService.y = hitY + hitSize + 10;
                if (fadeOptions > 0.2) {
                    global.clickables.optionsMenu.toggleBoxes.place(i, hitX, hitY, hitSize, hitSize);
                    global.clickables.optionsMenu.HoverBoxes.place(i, hitX, hitY, hitSize + measureText(cb.label, BOX_SIZE) * 0.65, hitSize);
                } else {
                    global.clickables.optionsMenu.toggleBoxes.hide();
                    global.clickables.optionsMenu.HoverBoxes.hide();
                }
                let clickHover = global.clickables.optionsMenu.toggleBoxes.check(mpos);
                let hovered = global.clickables.optionsMenu.HoverBoxes.check(mpos);

                if (hovered !== -1) {
                    global.optionsCheckboxes[hovered].tooltipService.targetAlpha = 1;
                } else global.optionsCheckboxes[i].tooltipService.targetAlpha = 0;

                if (cb.lastValue !== cb.value) {
                    cb.lastValue = cb.value;
                    loadSettings();
                    if (cb.id === "optLowResolution") resizeEvent();
                }

                const isOn = (cb.reverseCheck && !cb.value) || (!cb.reverseCheck && cb.value);
                ctx[2].lineWidth = 3;
                gameDraw.setColor(ctx[2], isOn ? color.green : color.guiwhite);
                drawGuiRect(x, y, BOX_SIZE, BOX_SIZE);
                if (clickHover !== -1 && clickHover === i) {
                    gameDraw.setColor(ctx[2], !isOn ? global.clickables.clicked ? color.guiblack : color.black : global.clickables.clicked ? color.black : color.guiwhite);
                    ctx[2].globalAlpha = global.clickables.clicked ? 0.25 : 0.2;
                    drawGuiRect(x, y, BOX_SIZE, BOX_SIZE);
                    ctx[2].globalAlpha = 1 * fadeOptions;
                }
                gameDraw.setColor(ctx[2], color.black);
                drawGuiRect(x, y, BOX_SIZE, BOX_SIZE, true);

                if (isOn) {
                    ctx[2].strokeStyle = "#ffffff";
                    ctx[2].lineWidth = 3;
                    ctx[2].beginPath();
                    ctx[2].moveTo(x + 5.5, y + BOX_SIZE / 1.8);
                    ctx[2].lineTo(x + BOX_SIZE / 2 - 3, y + BOX_SIZE - 7);
                    ctx[2].lineTo(x + BOX_SIZE - 6, y + 8);
                    ctx[2].stroke();
                }

                drawText(cb.label, x + BOX_SIZE + 10.5, y + BOX_SIZE / 2 + 6, 13.5, color.guiwhite, "left");
            }

        }
        ctx[2].restore();

        for (const cb of global.optionsCheckboxes) drawToolip(cb);

        ctx[2].save();
        ctx[2].globalAlpha *= fadeTheme;
        if (fadeTheme > 0.01) {
            // THEME TAB
        
            const CONTENT_Y = PANEL_Y + 50;
            const CONTENT_X = panelX + 30;

            ctx[2].fillStyle = color.guiwhite;
            ctx[2].font = "bold 20px Ubuntu";
            ctx[2].textAlign = "left";
            ctx[2].textBaseline = "middle";

            drawText("Theme", panelX + PANEL_WIDTH / 2, PANEL_Y + 30, 15.5, color.guiwhite, "center");
            drawText("Coming soon??, CONTENT_X, CONTENT_Y, 20, color.guiwhite, "left");
        }
        ctx[2].restore();

        ctx[2].save();
        ctx[2].globalAlpha *= fadeKeybinds;
        if (fadeKeybinds > 0.01) {
            // KEYBINDS TAB
        
            const CONTENT_Y = PANEL_Y + 50;
            const CONTENT_X = panelX + 30;

            ctx[2].fillStyle = color.guiwhite;
            ctx[2].font = "bold 20px Ubuntu";
            ctx[2].textAlign = "left";
            ctx[2].textBaseline = "middle";

            drawText("Keybinds", panelX + PANEL_WIDTH / 2, PANEL_Y + 30, 15.5, color.guiwhite, "center");
            drawText("Coming soon??, CONTENT_X, CONTENT_Y, 20, color.guiwhite, "left");
        }
        ctx[2].restore();

        // Close button
        const CLOSE_SIZE = 30;
        const closeX = panelX;
        const closeY = PANEL_Y - CLOSE_SIZE - 20;

        global.clickables.optionsMenu.switchButton.place(
            1,
            closeX * clickableRatio,
            closeY * clickableRatio,
            CLOSE_SIZE * clickableRatio,
            CLOSE_SIZE * clickableRatio
        );

        const cstate = global.clickables.optionsMenu.switchButton.check(mpos);
        ctx[2].save();
        ctx[2].globalAlpha = 1;

        gameDraw.setColor(ctx[2], color.red);
        ctx[2].lineWidth = 3;
        drawGuiRect(closeX, closeY, CLOSE_SIZE, CLOSE_SIZE);
        if (cstate === 1) {
            gameDraw.setColor(ctx[2], global.clickables.clicked ? "#000" : "#fff");
            ctx[2].globalAlpha = 0.25;
            drawGuiRect(closeX, closeY, CLOSE_SIZE, CLOSE_SIZE);
            ctx[2].globalAlpha = 1;
        }
        gameDraw.setColor(ctx[2], color.black);
        drawGuiRect(closeX, closeY, CLOSE_SIZE, CLOSE_SIZE, true);

        ctx[2].strokeStyle = "#ffffff";
        ctx[2].lineWidth = 4;
        ctx[2].beginPath();
        ctx[2].moveTo(closeX + 8, closeY + 8);
        ctx[2].lineTo(closeX + CLOSE_SIZE - 8, closeY + CLOSE_SIZE - 8);
        ctx[2].moveTo(closeX + CLOSE_SIZE - 8, closeY + 8);
        ctx[2].lineTo(closeX + 8, closeY + CLOSE_SIZE - 8);
        ctx[2].stroke();

        ctx[2].restore();

        ctx[2].restore();
    }

    function runSecondary() {
        let pingAttempt = setInterval(() => {
            if (global.gameUpdate && !global.disconnected) {
                clearInterval(pingAttempt);
                resizeEvent();
                global.socket.ping(Date.now(), socketStuff.clockDiff - socketStuff.serverStart);
            };
        }, 500);
    }

    let drawConnectingScreen = () => {
        let ratio = util.getScreenRatio();
        scaleScreenRatio(ratio, true);
        clearScreen(color.white, 1, ctx[2]);
        drawText("Connecting...", global.screenWidth / 2, global.screenHeight / 2, 30, color.guiwhite, "center");
        drawText(global.message, global.screenWidth / 2, global.screenHeight / 2 + 30, 15, color.lgreen, "center");
        drawText(global.tips, global.screenWidth / 2, global.screenHeight / 2 + 60, 15, color.guiwhite, "center");
    };

    const drawDisconnectedScreen = () => {
        let ratio = util.getScreenRatio();
        scaleScreenRatio(ratio, true);
        clearScreen(gameDraw.mixColors(color.red, color.guiblack, 0.3), global.gameStart ? 0.25 : 1, ctx[2]);
        drawText("Disconnected", global.screenWidth / 2, global.screenHeight / 2, 30, color.guiwhite, "center");
        if (global.message === '') global.message = 'The connection has closed. you may attempt to regain score or reload the game.';
        drawText(global.message, global.screenWidth / 2, global.screenHeight / 2 + 30, 15, color.orange, "center");
        lastPing = 0;
        drawButton(global.screenWidth / 2 - 80, global.screenHeight / 2 + 135, 130, 30, 1, "rect", "Back", 15, false, false, false, true, "exitGame", global.canvas.height / global.screenHeight / global.ratio, 0);
        drawButton(global.screenWidth / 2 + 80, global.screenHeight / 2 + 135, 130, 30, 1, "rect", "Reconnect", 15, false, false, false, true, "reconnect", global.canvas.height / global.screenHeight / global.ratio, 0);
    };

    const drawResyncScreen = () => {
        let ratio = util.getScreenRatio();
        scaleScreenRatio(ratio, true);
        clearScreen(gameDraw.mixColors(color.black, color.guiblack, 0.3), 0.25, ctx[2]);
        drawText("Out of sync!", global.screenWidth / 2, global.screenHeight / 2 - 10, 30, color.red, "center");
        drawText("The client is out of sync, please wait until this screen has disappeared.", global.screenWidth / 2, global.screenHeight / 2 + 40, 15, color.guiwhite, "center");
        drawText("The rendering has paused to prevent interuptions.", global.screenWidth / 2, global.screenHeight / 2 + 90, 15, color.guiwhite, "center");
    };

    const drawErrorScreen = () => {
        let ratio = util.getScreenRatio();
        scaleScreenRatio(ratio, true);
        clearScreen(gameDraw.mixColors(color.black, color.guiblack, 0.3), 0.25, ctx[2]);
        drawText("Client error detected!", global.screenWidth / 2, global.screenHeight / 2, 30, color.red, "center");
        drawText("If this is because of an entity, try to move away from it.", global.screenWidth / 2, global.screenHeight / 2 + 30, 15, color.guiwhite, "center");
        drawText("Check your browser's console logs and report whatever you see to the developers.", global.screenWidth / 2, global.screenHeight / 2 + 60, 15, color.guiwhite, "center");
    }
    let animationFrame =
    (!/Chrome\/8[4-6]\.0\.41([4-7][0-9]|8[0-3])\./.test(navigator.userAgent) &&
      window.requestAnimationFrame) ||
    ((a) => setTimeout(() => a(Date.now()), 1e3 / 60));
    function animloop(tick) {
        if (document.getElementById("gameAreaWrapper").style.display === "none") {
            setTimeout(() => animloop(Date.now()), 200); // Slow down when tab is hidden
            return;
        }
        animationFrame(animloop);
        if (global.gameStart) {
            // Update fov
            let fovtickMotion = fovlasttick ? tick - fovlasttick : null;
            fovlasttick = tick;
            let renderv = null == fovtickMotion ? 0 : config.graphical.slowerFOV ? 0.98 : 0.99 ** fovtickMotion;
            let renderfov = global.player.animv.get(tick);
            global.player.renderv = global.player.renderv * renderv + renderfov * (1 - renderv);
            // Reset collected rendering info (DEBUG)
            global.renderingInfo.entities = 0;
            global.renderingInfo.turretEntities = 0;
            global.renderingInfo.entitiesWithName = 0;
        }

        var ratio = config.graphical.screenshotMode ? 2 : util.getRatio();
        // Set the drawing style
        gameDraw.reanimateColors();
        for (let context of ctx) {
            context.lineCap = "round";
            context.lineJoin = "round";
            context.clearRect(0, 0, window.innerWidth + 1000, window.innerHeight + 1000);
        }
        // Figure out where we're rendering if we don't yet know
        if (isNaN(global.player.renderx) && isNaN(global.player.rendery)) {
            global.player.renderx = global.player.cx.x;
            global.player.rendery = global.player.cy.y;
        }
        // Draw the game
        if (global.gameUpdate && !global.disconnected) {
            global.time = getNow();
            if (isNaN(global.time)) { // If something isnt right, do a resync and pause the rendering.
                global.gameUpdate = false;
                global.pullUpgradeMenu = true;
                global.pullSkillBar = true;
                resizeEvent();
                resync();
            }
            if (global.time - lastPing > 1000) {
                // Get last ping.
                lastPing = global.time;
                // Do rendering speed.
                global.metrics.rendertime = global.metrics.rendertimes - 1;
                global.metrics.rendertimes = 0;
                global.fps = global.metrics.rendertime;
                // Do update rate.
                global.metrics.updatetime = global.updateTimes;
                global.updateTimes = 0;
                // Get the final bandwidth.
                global.bandwidth.finalHa = global.bandwidth.currentHa;
                global.bandwidth.finalFa = global.bandwidth.currentFa;
                global.bandwidth.currentHa = 0;
                global.bandwidth.currentFa = 0;
                if (!global.secondaryLoop) global.secondaryLoop = true, runSecondary();
            }
            global.metrics.lag = global.time - global.player.time;
        }
        if (global.GUIStatus.fullHDMode) ctx[2].translate(0.5, 0.5);
        let p = performance.now();
        try {
            drawGameplay(tick, ratio);
            drawGUI(tick, util.getScreenRatio());
            if (global.gameConnecting && !global.disconnected) {
                drawConnectingScreen();
            };
            if (global.died) {
                gameDrawDead();
            }
            if (isNaN(global.time)) drawResyncScreen();
            if (global.disconnected) {
                drawDisconnectedScreen();
            }
            if (global.dailyTankAd.renderUI) drawAdScreen();
            drawOptionsMenu(tick, 20, util.getScreenRatio());
            if (global.GUIStatus.fullHDMode) ctx[2].translate(-0.5, -0.5);

            //oh no we need to throw an error!
        } catch (e) {

            //hold on....
            drawErrorScreen(); // Draw the error screen.
            if (global.GUIStatus.fullHDMode) ctx[2].translate(-0.5, -0.5);

            //okay, NOW throw the error!
            throw e;
        }
        let t = performance.now();
        global.metrics.mspt = t - p;
    }
})(util, global, config, Canvas, colors, gameDraw, socketStuff)
