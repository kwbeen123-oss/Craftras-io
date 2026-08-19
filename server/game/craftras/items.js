const fs = require("fs");
const path = require("path");

const BUILTIN_ITEMS = Object.freeze({
    sword: { id: "sword", name: "Test Sword" },
    grass_block: { id: "grass_block", name: "Grass Block" },
    dirt: { id: "dirt", name: "Dirt" },
    dirt_path: { id: "dirt_path", name: "Dirt Path" },
    stone: { id: "stone", name: "Stone" },
    wood: { id: "wood", name: "Wood" },
    coal: { id: "coal", name: "Coal" },
    iron_ore: { id: "iron_ore", name: "Iron Ore" },
    gold_ore: { id: "gold_ore", name: "Gold Ore" },
    diamond: { id: "diamond", name: "Diamond" },
    sapphire: { id: "sapphire", name: "Sapphire" },
    ruby: { id: "ruby", name: "Ruby" },
    coal_block: { id: "coal_block", name: "Coal Block" },
    iron_block: { id: "iron_block", name: "Iron Block" },
    gold_block: { id: "gold_block", name: "Gold Block" },
    diamond_block: { id: "diamond_block", name: "Diamond Block" },
    plank: { id: "plank", name: "Oak Plank" },
    stick: { id: "stick", name: "Stick" },
    steel_rod: { id: "steel_rod", name: "Steel Rod" },
    iron_ingot: { id: "iron_ingot", name: "Iron Ingot" },
    gold_ingot: { id: "gold_ingot", name: "Gold Ingot" },
    charcoal: { id: "charcoal", name: "Charcoal" },
    crafting_table: { id: "crafting_table", name: "Crafting Table" },
    furnace: { id: "furnace", name: "Furnace" },
    torch: { id: "torch", name: "Torch" },
    steel_torch: {
        id: "steel_torch",
        name: "Steel Torch",
        description: "Used to light important places. It is much tougher than a normal torch and has 5x light range.",
        adminOnly: true,
    },
    chest: { id: "chest", name: "Chest" },
    bedrock: { id: "bedrock", name: "Bedrock", adminOnly: true },
    challenge_start_block: {
        id: "challenge_start_block",
        name: "Challenge Start Block",
        description: "Marks the place where a challenge can begin.",
        adminOnly: true,
    },
    world2_challenge_block: {
        id: "world2_challenge_block",
        name: "World 2 Challenge Block",
        description: "Marks the entrance to the World 2 challenge.",
        adminOnly: true,
    },
    challenge_spawn_block: {
        id: "challenge_spawn_block",
        name: "Spawn Block",
        description: "Marks a player spawn point for a challenge.",
        adminOnly: true,
    },
    transparent_block: {
        id: "transparent_block",
        name: "Transparent Block",
        description: "An invisible barrier. Hold this block to reveal placed barriers.",
        adminOnly: true,
    },
    route_marker_block: {
        id: "route_marker_block",
        name: "Route Marker Block",
        description: "An invisible path marker shown in blue on the minimap.",
        adminOnly: true,
    },
    admin_pickaxe: { id: "admin_pickaxe", name: "Admin Pickaxe", adminOnly: true },
    worldedit_axe: {
        id: "worldedit_axe",
        name: "WorldEdit Axe",
        description: "Admin building tool for selecting and filling block regions.",
        adminOnly: true,
    },
    destroyer: { id: "destroyer", name: "DESTROYER", adminOnly: true },
    m134: { id: "m134", name: "M134", adminOnly: true },
    rocket_launcher: { id: "rocket_launcher", name: "Rocket Launcher", adminOnly: true },
    laser_test: {
        id: "laser_test",
        name: "Laser test",
        description: "Fires an experimental continuous laser.",
        damage: 0,
        adminOnly: true,
    },
    blue_laser_beam: {
        id: "blue_laser_beam",
        name: "Blue Laser Beam",
        description: "Challenge weapon. Its recoil builds tremendous speed.",
        damage: 0,
        noTransfer: true,
    },
    screen_cut_test: {
        id: "screen_cut_test",
        name: "Screen Cut Test",
        description: "Cuts the screens of nearby players and sets nearby combatants to 1 health.",
        damage: 0,
        adminOnly: true,
    },
    creative_24h: { id: "creative_24h", name: "Creative (24h)", creativeDuration: 24 * 60 * 60 * 1000, adminOnly: true },
    creative_1h: { id: "creative_1h", name: "Creative (1h)", creativeDuration: 60 * 60 * 1000, adminOnly: true },
    world1_badge: { id: "world1_badge", name: "World 1 Badge", important: true },
    bandage: { id: "bandage", name: "Bandage" },
    rotten_flesh: { id: "rotten_flesh", name: "Rotten Flesh" },
    zombie_head: { id: "zombie_head", name: "Zombie Head" },
    bone: { id: "bone", name: "Bone" },
    hardened_bone: { id: "hardened_bone", name: "Hardened Bone" },
    burnt_bone: { id: "burnt_bone", name: "Burnt Bone" },
    fire_orb: { id: "fire_orb", name: "Fire Orb" },
    fire_soul: { id: "fire_soul", name: "Fire Soul" },
    worm_shell: { id: "worm_shell", name: "Worm Shell" },
    horn: { id: "horn", name: "Horn" },
    ancient_key: { id: "ancient_key", name: "Ancient Key" },
    magic_crystal: { id: "magic_crystal", name: "Magic Crystal" },
    skeleton_head: { id: "skeleton_head", name: "Skeleton Head" },
    gunpowder: { id: "gunpowder", name: "Gunpowder" },
    creeper_head: { id: "creeper_head", name: "Creeper Head" },
    bomb_recipe: { id: "bomb_recipe", name: "Bomb Recipe", equipmentRecipe: true },
    bone_bomb_recipe: { id: "bone_bomb_recipe", name: "Bone Bomb Recipe", equipmentRecipe: true },
    horn_sword_recipe: { id: "horn_sword_recipe", name: "Horn Sword Recipe", equipmentRecipe: true },
    sturdy_helmet_recipe: { id: "sturdy_helmet_recipe", name: "Sturdy Helmet Recipe", equipmentRecipe: true },
    zombie_wizard_staff_recipe: { id: "zombie_wizard_staff_recipe", name: "Zombie Wizard's Staff Recipe", equipmentRecipe: true },
    bone_bomb: { id: "bone_bomb", name: "Bone Bomb", damage: 100 },
    crown_fragment: { id: "crown_fragment", name: "Crown Fragment" },
    royal_key: { id: "royal_key", name: "Royal Key" },
    spider_eye: { id: "spider_eye", name: "Spider Eye" },
    spider_head: { id: "spider_head", name: "Spider Head" },
    toxic_spider_eye: { id: "toxic_spider_eye", name: "Toxic Spider Eye" },
    toxic_spider_head: { id: "toxic_spider_head", name: "Toxic Spider Head" },
    spider_leg: { id: "spider_leg", name: "Spider Leg" },
    string: { id: "string", name: "String" },
    spider_venom: { id: "spider_venom", name: "Spider Venom" },
    venom_sword_recipe: { id: "venom_sword_recipe", name: "Venom Sword Recipe", equipmentRecipe: true },
    zombie_crown_recipe: { id: "zombie_crown_recipe", name: "Zombie Crown Scroll", equipmentRecipe: true },
    knight_shield_recipe: { id: "knight_shield_recipe", name: "Knight's Shield Scroll", equipmentRecipe: true },
    cleric_staff_recipe: { id: "cleric_staff_recipe", name: "Cleric Staff Recipe", equipmentRecipe: true, noTransfer: true },
    cleric_staff_head: { id: "cleric_staff_head", name: "Cleric Staff Head", noTransfer: true },
    cleric_staff_body: { id: "cleric_staff_body", name: "Cleric Staff Body", noTransfer: true },
    cleric_staff_handle: { id: "cleric_staff_handle", name: "Cleric Staff Handle", noTransfer: true },
    wooden_pickaxe: { id: "wooden_pickaxe", name: "Wooden Pickaxe" },
    stone_pickaxe: { id: "stone_pickaxe", name: "Stone Pickaxe" },
    iron_pickaxe: { id: "iron_pickaxe", name: "Iron Pickaxe" },
    gold_pickaxe: { id: "gold_pickaxe", name: "Gold Pickaxe" },
    diamond_pickaxe: { id: "diamond_pickaxe", name: "Diamond Pickaxe" },
    ruby_pickaxe: { id: "ruby_pickaxe", name: "Ruby Pickaxe" },
    sapphire_pickaxe: { id: "sapphire_pickaxe", name: "Sapphire Pickaxe" },
    wooden_axe: { id: "wooden_axe", name: "Wooden Axe" },
    stone_axe: { id: "stone_axe", name: "Stone Axe" },
    iron_axe: { id: "iron_axe", name: "Iron Axe" },
    gold_axe: { id: "gold_axe", name: "Gold Axe" },
    diamond_axe: { id: "diamond_axe", name: "Diamond Axe" },
    wooden_shovel: { id: "wooden_shovel", name: "Wooden Shovel" },
    stone_shovel: { id: "stone_shovel", name: "Stone Shovel" },
    iron_shovel: { id: "iron_shovel", name: "Iron Shovel" },
    gold_shovel: { id: "gold_shovel", name: "Gold Shovel" },
    diamond_shovel: { id: "diamond_shovel", name: "Diamond Shovel" },
    wooden_sword: { id: "wooden_sword", name: "Wooden Sword" },
    stone_sword: { id: "stone_sword", name: "Stone Sword" },
    iron_sword: { id: "iron_sword", name: "Iron Sword" },
    gold_sword: { id: "gold_sword", name: "Gold Sword" },
    diamond_sword: { id: "diamond_sword", name: "Diamond Sword" },
    ruby_sword: { id: "ruby_sword", name: "Ruby Sword", damage: 200 },
    horn_sword: { id: "horn_sword", name: "Horn Sword", damage: 500, customWeaponOverride: true },
    jane_sword: { id: "jane_sword", name: "Jane's Sword", damage: 200, important: true, adminOnly: true },
    venom_sword: { id: "venom_sword", name: "Venom Sword", damage: 100 },
    the_great: { id: "the_great", name: "The Great", damage: 0, important: true, adminOnly: true },
    the_great_friend: {
        id: "the_great_friend",
        name: "The Great's friend",
        description: "A mysterious companion. Its attacks grow stronger with your level, and right-click unleashes a three-slash combo.",
        levelDamageMultiplier: 2,
        important: true,
    },
    blacksmith_hammer: { id: "blacksmith_hammer", name: "Blacksmith Hammer", damage: 20 },
    cleric_staff: { id: "cleric_staff", name: "Cleric Staff", healPerSecond: 20, cooldown: 20_000 },
    zombie_wizard_staff: { id: "zombie_wizard_staff", name: "Zombie Wizard's Staff", damage: 0 },
    cleric_staff_op: { id: "cleric_staff_op", name: "OP Cleric Staff", healRatio: 0.2, duration: 30_000, adminOnly: true, superAdminOnly: true },
    cleric_hat: { id: "cleric_hat", name: "Cleric Hat", important: true, adminOnly: true },
    pope_hat: { id: "pope_hat", name: "Pope Hat", important: true, adminOnly: true },
    pope_staff: { id: "pope_staff", name: "Pope Staff", damage: 0, important: true, adminOnly: true },
    blesser_hat: { id: "blesser_hat", name: "Blesser Hat", important: true, adminOnly: true },
    jane_hat: { id: "jane_hat", name: "Jane's Hat", important: true, adminOnly: true },
    blesser_staff: { id: "blesser_staff", name: "Blesser Staff", damage: 0, important: true, adminOnly: true },
    merchant_hat: { id: "merchant_hat", name: "Merchant Hat" },
    monster_merchant_hat: { id: "monster_merchant_hat", name: "Monster Merchant Hat" },
    king_zombie_summon_ticket: { id: "king_zombie_summon_ticket", name: "King Zombie Summon Ticket" },
    queen_spider_summon_ticket: { id: "queen_spider_summon_ticket", name: "Queen Spider Summon Ticket" },
    annihilator_summon_ticket: { id: "annihilator_summon_ticket", name: "Annihilator Summon Ticket" },
    sword_guy_summon_ticket: { id: "sword_guy_summon_ticket", name: "Sword guy Summon Ticket" },
    iron_helmet: { id: "iron_helmet", name: "Iron Helmet" },
    diamond_helmet: { id: "diamond_helmet", name: "Diamond Helmet" },
    great_iron_helmet: { id: "great_iron_helmet", name: "Great Iron Helmet", healthBonus: 500 },
    great_diamond_helmet: { id: "great_diamond_helmet", name: "Great Diamond Helmet", healthBonus: 1000 },
    ruby_helmet: { id: "ruby_helmet", name: "Ruby Helmet", healthBonus: 500 },
    sapphire_helmet: { id: "sapphire_helmet", name: "Sapphire Helmet", healthBonus: 600 },
    sturdy_helmet: { id: "sturdy_helmet", name: "Sturdy Helmet", healthBonus: 2000 },
    zombie_crown: { id: "zombie_crown", name: "Zombie Crown" },
    iron_shield: { id: "iron_shield", name: "Iron Shield", shieldHealth: 100 },
    gold_shield: { id: "gold_shield", name: "Gold Shield", shieldHealth: 50 },
    diamond_shield: { id: "diamond_shield", name: "Diamond Shield", shieldHealth: 150 },
    knight_shield: { id: "knight_shield", name: "Knight's Shield", shieldHealth: 250 },
    parry_tool: {
        id: "parry_tool",
        name: "Parry Tool",
        description: "Equip in the F slot and right-click shortly after an incoming attack to parry it.",
        offhandSlot: true,
    },
    parry_tool_op: {
        id: "parry_tool_op",
        name: "OP Parrying Tool",
        description: "Automatically parries every incoming enemy attack.",
        offhandSlot: true,
        adminOnly: true,
        superAdminOnly: true,
    },
    magic_book: {
        id: "magic_book",
        name: "MAGIC BOOK",
        description: "A support weapon that stores magic, strengthens parries, and unlocks three spells.",
        offhandSlot: true,
        hiddenFromCreative: true,
        important: true,
    },
    knight_shield_fragment: { id: "knight_shield_fragment", name: "Knight's Shield Fragment" },
    raw_beef: { id: "raw_beef", name: "Raw Beef", heal: 10 },
    cooked_beef: { id: "cooked_beef", name: "Cooked Beef", heal: 50 },
    raw_pork: { id: "raw_pork", name: "Raw Pork", heal: 5 },
    cooked_pork: { id: "cooked_pork", name: "Cooked Pork", heal: 40 },
    raw_chicken: { id: "raw_chicken", name: "Raw Chicken", heal: 5 },
    cooked_chicken: { id: "cooked_chicken", name: "Cooked Chicken", heal: 40 },
    cactus_sap: {
        id: "cactus_sap",
        name: "Cactus Sap",
        description: "Regenerates 100 health per second for 1 minute.",
        healOverTimePerSecond: 100,
        healOverTimeDuration: 60_000,
    },
});

const CUSTOM_ITEMS_DIRECTORIES = [
    path.resolve(__dirname, "../../../Craftras Item"),
    path.join(__dirname, "customItems"),
];
const CUSTOM_ITEM_IMAGES_DIRECTORY = path.resolve(__dirname, "../../../public/img/custom-items");
const clampNumber = (value, fallback, min, max) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
};

function materializeEditorLayer(itemId, source, index, seenIds) {
    const primary = !!source?.primary || index === 0;
    let layerId = primary ? "main" : String(source?.id || `layer_${index}`).toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 40);
    layerId ||= `layer_${index}`;
    while (seenIds.has(layerId)) layerId = `${layerId}_${index}`.slice(0, 40);
    seenIds.add(layerId);
    const dataUrl = String(source?.image?.dataUrl || "");
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=]+)$/i.exec(dataUrl);
    if (!match) throw new Error(`editor layer ${index + 1} has no usable image data`);
    const extension = match[1].toLowerCase() === "image/jpeg" ? "jpg" : match[1].split("/")[1];
    const imageBuffer = Buffer.from(match[2], "base64");
    if (!imageBuffer.length || imageBuffer.length > 12_000_000) throw new Error(`editor layer ${index + 1} has invalid image data`);
    fs.mkdirSync(CUSTOM_ITEM_IMAGES_DIRECTORY, { recursive: true });
    const imageFilename = `${itemId}-${layerId}.${extension}`;
    const imagePath = path.join(CUSTOM_ITEM_IMAGES_DIRECTORY, imageFilename);
    if (!fs.existsSync(imagePath) || !fs.readFileSync(imagePath).equals(imageBuffer)) fs.writeFileSync(imagePath, imageBuffer);
    const independentLegacyLayer = !primary && !source?.anchorModeExplicit;
    const inferredMainAnchor = independentLegacyLayer && /검집|scabbard|sheathe/i.test(String(source?.name || ""));
    return {
        ...source,
        id: layerId,
        primary,
        // Extra images from the old editor did not have an anchor mode. Make those independent by default.
        anchorMode: inferredMainAnchor ? "main" : independentLegacyLayer || source?.anchorMode === "body" ? "body" : source?.anchorMode === "main" && !primary ? "main" : "weapon",
        anchorModeExplicit: !!source?.anchorModeExplicit,
        image: `./img/custom-items/${imageFilename}`,
        imageSize: {
            width: clampNumber(source?.image?.width, 1, 1, 16384),
            height: clampNumber(source?.image?.height, 1, 1, 16384),
        },
    };
}

function normalizeEditorItemProject(source) {
    if (source?.format !== "craftras-item" || !source?.item) return source;
    const item = source.item || {};
    const id = String(item.id || "").trim().toLowerCase();
    const rawLayers = Array.isArray(source.layers) && source.layers.length ? source.layers : [];
    if (!id || !rawLayers.length) throw new Error("editor item project is missing an item ID or image layers");
    const seenIds = new Set();
    const layers = rawLayers.slice(0, 12).map((layer, index) => materializeEditorLayer(id, layer, index, seenIds));
    const primaryLayer = layers.find(layer => layer.primary) || layers[0];
    const animation = source.animation || {};
    const weapon = source.weapon || {};
    return {
        id,
        name: item.name,
        description: item.description,
        damage: item.damage,
        image: primaryLayer.image,
        weapon: {
            ...weapon,
            attackDuration: animation.duration ?? weapon.attackDuration,
            anchor: primaryLayer.anchor || weapon.anchor,
            imageSize: primaryLayer.imageSize,
            polygons: primaryLayer.polygons || [],
            layers,
            keyframes: animation.keyframes || weapon.keyframes,
            combo: animation.combo || weapon.combo,
            specialActions: animation.combo?.specialActions || weapon.specialActions || [],
        },
    };
}

function loadCustomItems() {
    const items = {};
    for (const directory of CUSTOM_ITEMS_DIRECTORIES) {
        if (!fs.existsSync(directory)) continue;
        for (const filename of fs.readdirSync(directory).filter(name => name.endsWith(".json"))) {
        try {
            const source = normalizeEditorItemProject(JSON.parse(fs.readFileSync(path.join(directory, filename), "utf8")));
            const id = String(source.id || "").trim().toLowerCase();
            const builtin = BUILTIN_ITEMS[id];
            if (!/^[a-z0-9_]{2,48}$/.test(id) || (builtin && !builtin.customWeaponOverride) || items[id]) continue;
            const weapon = source.weapon && typeof source.weapon === "object" ? source.weapon : {};
            items[id] = Object.freeze({
                id,
                name: String(builtin?.name || source.name || id).slice(0, 64),
                description: String(source.description || builtin?.description || "Custom Craftras weapon.").slice(0, 240),
                image: String(source.image || ""),
                damage: clampNumber(builtin?.damage ?? source.damage, 20, 0, 1e15),
                adminOnly: !!builtin?.adminOnly,
                customWeapon: true,
                weapon: Object.freeze({
                    type: "sword",
                    renderScale: clampNumber(weapon.renderScale, 3.25, 0.2, 20),
                    rotationOffset: clampNumber(weapon.rotationOffset, -45, -1080, 1080),
                    attackDuration: clampNumber(weapon.attackDuration, 700, 80, 10000),
                    hitStart: clampNumber(weapon.hitStart, 0.2, 0, 1),
                    hitEnd: clampNumber(weapon.hitEnd, 0.7, 0, 1),
                    anchor: weapon.anchor || { x: 0.5, y: 0.5 },
                    imageSize: weapon.imageSize || { width: 1, height: 1 },
                    polygons: Array.isArray(weapon.polygons) ? weapon.polygons : [],
                    layers: Array.isArray(weapon.layers) ? weapon.layers : [],
                    keyframes: Array.isArray(weapon.keyframes) ? weapon.keyframes : [],
                    combo: weapon.combo && typeof weapon.combo === "object" ? weapon.combo : null,
                    specialActions: Array.isArray(weapon.specialActions) ? weapon.specialActions.slice(0, 2) : [],
                    trail: weapon.trail && typeof weapon.trail === "object" ? weapon.trail : { enabled: false },
                    damageWalls: weapon.damageWalls !== false,
                }),
            });
        } catch (error) {
            console.warn(`[Craftras] Could not load custom item ${filename}: ${error.message}`);
        }
        }
    }
    return items;
}

const CUSTOM_ITEMS = Object.freeze(loadCustomItems());
const ITEMS = Object.freeze({ ...BUILTIN_ITEMS, ...CUSTOM_ITEMS });

const CRAFTING_RECIPES = Object.freeze([
    {
        pattern: [["diamond", "crown_fragment", "diamond"], ["crown_fragment", null, "crown_fragment"]],
        output: ["zombie_crown", 1],
        unlock: "zombie_crown",
    },
    ...[
        ["iron_block", "iron_shield"],
        ["gold_block", "gold_shield"],
        ["diamond_block", "diamond_shield"],
    ].map(([material, shield]) => ({
        pattern: [["plank", material, "plank"], ["plank", "plank", "plank"], [null, "plank", null]],
        output: [shield, 1],
    })),
    {
        pattern: [["iron_ingot", "diamond", "iron_ingot"], ["diamond", "knight_shield_fragment", "diamond"], [null, "iron_ingot", null]],
        output: ["knight_shield", 1],
        unlock: "knight_shield",
    },
    {
        pattern: [["spider_venom", "spider_venom", "spider_venom"], ["string", "diamond_sword", "string"], ["spider_leg", "spider_leg", "spider_leg"]],
        output: ["venom_sword", 1],
        unlock: "venom_sword",
    },
    {
        pattern: [["cleric_staff_head"], ["cleric_staff_body"], ["cleric_staff_handle"]],
        output: ["cleric_staff", 1],
        unlock: "cleric_staff",
    },
    {
        pattern: [["string"], ["gunpowder"], ["bone"]],
        output: ["bone_bomb", 2],
        unlock: "bone_bomb",
    },
    {
        pattern: [["horn"], ["horn"], ["steel_rod"]],
        output: ["horn_sword", 1],
        unlock: "horn_sword",
    },
    {
        pattern: [["worm_shell", "worm_shell", "worm_shell"], ["worm_shell", "iron_block", "worm_shell"]],
        output: ["sturdy_helmet", 1],
        unlock: "sturdy_helmet",
    },
    {
        pattern: [["magic_crystal"], ["hardened_bone"], ["stick"]],
        output: ["zombie_wizard_staff", 1],
        unlock: "zombie_wizard_staff",
    },
    {
        pattern: [
            ["iron_ingot", "iron_ingot", "iron_ingot"],
            ["iron_ingot", "stick", "iron_ingot"],
            ["iron_ingot", "iron_ingot", "iron_ingot"],
        ],
        output: ["steel_rod", 1],
    },
    { shapeless: ["iron_block", "bone"], output: ["hardened_bone", 1] },
    ...[
        ["coal", "coal_block"],
        ["iron_ingot", "iron_block"],
        ["gold_ingot", "gold_block"],
        ["diamond", "diamond_block"],
    ].flatMap(([ingredient, block]) => [
        { pattern: Array.from({ length: 3 }, () => Array(3).fill(ingredient)), output: [block, 1] },
        { shapeless: [block], output: [ingredient, 9] },
    ]),
    { shapeless: ["wood"], output: ["plank", 4] },
    { shapeless: ["dirt"], output: ["dirt_path", 1] },
    { pattern: [["plank"], ["plank"]], output: ["stick", 4] },
    { pattern: [["coal"], ["stick"]], output: ["torch", 4] },
    { pattern: [["charcoal"], ["stick"]], output: ["torch", 4] },
    { pattern: [["plank", "plank"], ["plank", "plank"]], output: ["crafting_table", 1] },
    { pattern: [["stone", "stone", "stone"], ["stone", null, "stone"], ["stone", "stone", "stone"]], output: ["furnace", 1] },
    { pattern: [["plank", "plank", "plank"], ["plank", null, "plank"], ["plank", "plank", "plank"]], output: ["chest", 1] },
    { pattern: [["iron_ingot", "iron_ingot", "iron_ingot"], ["iron_ingot", null, "iron_ingot"]], output: ["iron_helmet", 1] },
    { pattern: [["diamond", "diamond", "diamond"], ["diamond", null, "diamond"]], output: ["diamond_helmet", 1] },
    {
        pattern: [["iron_block", "iron_block", "iron_block"], ["iron_block", null, "iron_block"]],
        output: ["great_iron_helmet", 1],
        unlock: "great_iron_helmet",
    },
    {
        pattern: [["diamond_block", "diamond_block", "diamond_block"], ["diamond_block", null, "diamond_block"]],
        output: ["great_diamond_helmet", 1],
        unlock: "great_diamond_helmet",
    },
    { pattern: [["ruby", "ruby", "ruby"], ["diamond", null, "diamond"]], output: ["ruby_helmet", 1] },
    { pattern: [["sapphire", "sapphire", "sapphire"], ["diamond", null, "diamond"]], output: ["sapphire_helmet", 1] },
    ...[
        ["wooden", "plank"],
        ["stone", "stone"],
        ["iron", "iron_ingot"],
        ["gold", "gold_ingot"],
        ["diamond", "diamond"],
    ].flatMap(([material, ingredient]) => [
        {
            pattern: [[ingredient, ingredient, ingredient], [null, "stick", null], [null, "stick", null]],
            output: [`${material}_pickaxe`, 1],
        },
        {
            pattern: [[ingredient, ingredient], [ingredient, "stick"], [null, "stick"]],
            output: [`${material}_axe`, 1],
        },
        {
            pattern: [[ingredient, ingredient], ["stick", ingredient], ["stick", null]],
            output: [`${material}_axe`, 1],
        },
        {
            pattern: [[ingredient], ["stick"], ["stick"]],
            output: [`${material}_shovel`, 1],
        },
        {
            pattern: [[ingredient], [ingredient], ["stick"]],
            output: [`${material}_sword`, 1],
        },
    ]),
    ...[
        ["ruby", "ruby"],
        ["sapphire", "sapphire"],
    ].map(([material, ingredient]) => ({
        pattern: [[ingredient, ingredient, ingredient], [null, "stick", null], [null, "stick", null]],
        output: [`${material}_pickaxe`, 1],
    })),
    {
        pattern: [["ruby"], ["ruby"], ["stick"]],
        output: ["ruby_sword", 1],
    },
]);

const SMELTING_RECIPES = Object.freeze({
    wood: { output: "charcoal", count: 1 },
    iron_ore: { output: "iron_ingot", count: 1 },
    gold_ore: { output: "gold_ingot", count: 1 },
    raw_beef: { output: "cooked_beef", count: 1 },
    raw_pork: { output: "cooked_pork", count: 1 },
    raw_chicken: { output: "cooked_chicken", count: 1 },
});

function trimGrid(slots, size) {
    const occupied = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const stack = slots[y * size + x];
            if (stack) occupied.push({ x, y, id: stack.id, index: y * size + x });
        }
    }
    if (!occupied.length) return null;
    const minX = Math.min(...occupied.map(cell => cell.x));
    const maxX = Math.max(...occupied.map(cell => cell.x));
    const minY = Math.min(...occupied.map(cell => cell.y));
    const maxY = Math.max(...occupied.map(cell => cell.y));
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const pattern = Array.from({ length: height }, () => Array(width).fill(null));
    const indexes = [];
    for (const cell of occupied) {
        pattern[cell.y - minY][cell.x - minX] = cell.id;
        indexes.push(cell.index);
    }
    return { pattern, indexes };
}

function samePattern(a, b) {
    if (a.length !== b.length || a[0].length !== b[0].length) return false;
    for (let y = 0; y < a.length; y++) {
        for (let x = 0; x < a[y].length; x++) {
            if ((a[y][x] || null) !== (b[y][x] || null)) return false;
        }
    }
    return true;
}

function findCraftingRecipe(slots, size) {
    const occupied = slots.map((stack, index) => stack ? { id: stack.id, index } : null).filter(Boolean);
    for (const recipe of CRAFTING_RECIPES) {
        if (recipe.shapeless) {
            const wanted = [...recipe.shapeless].sort();
            const actual = occupied.map(stack => stack.id).sort();
            if (wanted.length === actual.length && wanted.every((id, index) => id === actual[index])) {
                return { recipe, consume: occupied.map(stack => stack.index) };
            }
            continue;
        }
        const trimmed = trimGrid(slots, size);
        if (trimmed && samePattern(trimmed.pattern, recipe.pattern)) return { recipe, consume: trimmed.indexes };
    }
    return null;
}

function makeItem(id, count = 1) {
    const item = ITEMS[id];
    return item ? { ...item, count } : null;
}

module.exports = { ITEMS, CUSTOM_ITEMS, CRAFTING_RECIPES, SMELTING_RECIPES, findCraftingRecipe, makeItem };
