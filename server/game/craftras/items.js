const ITEMS = Object.freeze({
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
    coal_block: { id: "coal_block", name: "Coal Block" },
    iron_block: { id: "iron_block", name: "Iron Block" },
    gold_block: { id: "gold_block", name: "Gold Block" },
    diamond_block: { id: "diamond_block", name: "Diamond Block" },
    plank: { id: "plank", name: "Oak Plank" },
    stick: { id: "stick", name: "Stick" },
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
    creative_24h: { id: "creative_24h", name: "Creative (24h)", creativeDuration: 24 * 60 * 60 * 1000, adminOnly: true },
    creative_1h: { id: "creative_1h", name: "Creative (1h)", creativeDuration: 60 * 60 * 1000, adminOnly: true },
    world1_badge: { id: "world1_badge", name: "World 1 Badge", important: true },
    rotten_flesh: { id: "rotten_flesh", name: "Rotten Flesh" },
    zombie_head: { id: "zombie_head", name: "Zombie Head" },
    bone: { id: "bone", name: "Bone" },
    skeleton_head: { id: "skeleton_head", name: "Skeleton Head" },
    gunpowder: { id: "gunpowder", name: "Gunpowder" },
    creeper_head: { id: "creeper_head", name: "Creeper Head" },
    bomb_recipe: { id: "bomb_recipe", name: "Bomb Recipe", equipmentRecipe: true },
    bone_bomb_recipe: { id: "bone_bomb_recipe", name: "Bone Bomb Recipe", equipmentRecipe: true },
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
    venom_sword: { id: "venom_sword", name: "Venom Sword", damage: 100 },
    the_great: { id: "the_great", name: "The Great", damage: 0, important: true, adminOnly: true },
    the_great_friend: {
        id: "the_great_friend",
        name: "The Great's friend",
        description: "A mysterious companion. Keep it in your inventory and it will follow you. Hold it to wield it as a fast dagger.",
        damage: 50,
        important: true,
    },
    blacksmith_hammer: { id: "blacksmith_hammer", name: "Blacksmith Hammer", damage: 20 },
    cleric_staff: { id: "cleric_staff", name: "Cleric Staff", healPerSecond: 20, cooldown: 20_000 },
    cleric_staff_op: { id: "cleric_staff_op", name: "OP Cleric Staff", healRatio: 0.2, duration: 30_000, adminOnly: true, superAdminOnly: true },
    cleric_hat: { id: "cleric_hat", name: "Cleric Hat", important: true, adminOnly: true },
    pope_hat: { id: "pope_hat", name: "Pope Hat", important: true, adminOnly: true },
    pope_staff: { id: "pope_staff", name: "Pope Staff", damage: 0, important: true, adminOnly: true },
    blesser_hat: { id: "blesser_hat", name: "Blesser Hat", important: true, adminOnly: true },
    blesser_staff: { id: "blesser_staff", name: "Blesser Staff", damage: 0, important: true, adminOnly: true },
    merchant_hat: { id: "merchant_hat", name: "Merchant Hat" },
    monster_merchant_hat: { id: "monster_merchant_hat", name: "Monster Merchant Hat" },
    king_zombie_summon_ticket: { id: "king_zombie_summon_ticket", name: "King Zombie Summon Ticket" },
    queen_spider_summon_ticket: { id: "queen_spider_summon_ticket", name: "Queen Spider Summon Ticket" },
    annihilator_summon_ticket: { id: "annihilator_summon_ticket", name: "Annihilator Summon Ticket" },
    sword_guy_summon_ticket: { id: "sword_guy_summon_ticket", name: "Sword guy Summon Ticket" },
    iron_helmet: { id: "iron_helmet", name: "Iron Helmet" },
    diamond_helmet: { id: "diamond_helmet", name: "Diamond Helmet" },
    zombie_crown: { id: "zombie_crown", name: "Zombie Crown" },
    iron_shield: { id: "iron_shield", name: "Iron Shield", shieldHealth: 100 },
    gold_shield: { id: "gold_shield", name: "Gold Shield", shieldHealth: 50 },
    diamond_shield: { id: "diamond_shield", name: "Diamond Shield", shieldHealth: 150 },
    knight_shield: { id: "knight_shield", name: "Knight's Shield", shieldHealth: 250 },
    knight_shield_fragment: { id: "knight_shield_fragment", name: "Knight's Shield Fragment" },
    raw_beef: { id: "raw_beef", name: "Raw Beef", heal: 10 },
    cooked_beef: { id: "cooked_beef", name: "Cooked Beef", heal: 50 },
    raw_pork: { id: "raw_pork", name: "Raw Pork", heal: 5 },
    cooked_pork: { id: "cooked_pork", name: "Cooked Pork", heal: 40 },
    raw_chicken: { id: "raw_chicken", name: "Raw Chicken", heal: 5 },
    cooked_chicken: { id: "cooked_chicken", name: "Cooked Chicken", heal: 40 },
});

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

module.exports = { ITEMS, CRAFTING_RECIPES, SMELTING_RECIPES, findCraftingRecipe, makeItem };
