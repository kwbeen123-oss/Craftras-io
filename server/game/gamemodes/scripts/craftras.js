const {
    WORLD_SIZE,
    WALL_SIZE,
    BLOCK_SIZE,
    BLOCKS,
    FLOORS,
    BLOCKS_X,
    BLOCKS_Y,
    generateCell,
    isBrokenKingdomSurfaceCell,
    isNearBrokenKingdomSurfaceCell,
    worldToBlock,
    blockToWorld,
} = require("../../craftras/worldGenerator.js");
const { ITEMS, CRAFTING_RECIPES, SMELTING_RECIPES, makeItem } = require("../../craftras/items.js");
const challengeTeams = require("../../craftras/challengeTeams.js");
const MANUAL_CAVES = require("../../craftras/manualCaves.json");
const fs = require("fs");
const path = require("path");

const CHUNK_SIZE = 8;
const VILLAGE_BLUEPRINT_FILE = path.join(__dirname, "../../craftras/villageBlueprint.json");
const VILLAGE_NPC_SPAWNS_FILE = path.join(__dirname, "../../craftras/villageNpcSpawns.json");
const STEEL_TORCH_MAP_FILE = path.join(__dirname, "../../craftras/steelTorchMap.json");
const BROKEN_KINGDOM_BLUEPRINT_FILE = path.join(__dirname, "../../craftras/brokenKingdomBlueprint.json");
const ROYAL_KINGDOM_INTACT_BLUEPRINT_FILE = path.join(__dirname, "../../craftras/royalKingdomIntactBlueprint.json");
const CAVE_EXCAVATION_FILE = path.join(__dirname, "../../craftras/caveExcavation.json");
const WORLD1_CHALLENGE_BLUEPRINT_FILE = path.join(__dirname, "../../craftras/world1ChallengeBlueprint.json");
const WORLD1_CHALLENGE_BLUEPRINT_BACKUP_FILE = path.join(__dirname, "../../craftras/world1ChallengeBlueprint.backup.json");
const VILLAGE_NATURE_CLEAR_RADIUS = 12;
const BROKEN_KINGDOM_SPAWN_CLEAR_RADIUS = 20;
const VILLAGE_NPC_MAX_HOME_DISTANCE = 15;
const VILLAGE_BLACKSMITH_INTERACT_RANGE = BLOCK_SIZE * 3;
const VILLAGE_CLERIC_INTERACT_RANGE = BLOCK_SIZE * 3;
const VILLAGE_MERCHANT_INTERACT_RANGE = BLOCK_SIZE * 3;
const VILLAGE_POPE_INTERACT_RANGE = BLOCK_SIZE * 3;
const VILLAGE_BLESSER_INTERACT_RANGE = BLOCK_SIZE * 3;
const VILLAGE_BLESSER_BUFF_COST = 1_000;
const VILLAGE_BLESSER_DURATION = 15 * 60 * 1000;
const VILLAGE_BLESSER_FREE_INTERVAL = 12 * 60 * 60 * 1000;
const VILLAGE_BLESSER_ITEM_COOLDOWN = 15 * 60 * 1000;
const VILLAGE_BLESSER_HEALTH_BONUS = 200;
const VILLAGE_BLESSER_DAMAGE_BONUS = 40;
const VILLAGE_BLESSER_DAMAGE_MULTIPLIER = 1.25;
const CRAFTRAS_BLESSER_STAFF_COOLDOWN = 10_000;
const CRAFTRAS_POPE_HAT_HEALTH_BONUS = 5_000;
const CRAFTRAS_POPE_HAT_REGEN_PER_SECOND = 200;
const CRAFTRAS_BLESSER_HAT_HEALTH_BONUS = 200;
const CRAFTRAS_BASE_LEVEL_CAP = 100;
const CRAFTRAS_REBIRTH_LEVEL_STEP = 100;
const CRAFTRAS_LEVEL_SCORE_BASE = 10_000;
const CRAFTRAS_SHOP_REFRESH_INTERVAL = 10 * 60 * 1000;
const VILLAGE_NPC_COUNTS = Object.freeze({
    guard: 5,
    villager: 10,
    captain: 1,
    cleric: 1,
    merchant: 1,
    monster_merchant: 1,
    pope: 1,
    blesser: 1,
});
const VILLAGE_GUARD_AGGRO_RANGE = BLOCK_SIZE * 18;
const VILLAGE_GUARD_ZONE_PADDING = 6;
const VILLAGE_GUARD_ATTACK_RANGE = BLOCK_SIZE * 1.55;
const VILLAGE_CLERIC_HEAL_RANGE = BLOCK_SIZE * 8;
const VILLAGE_CLERIC_CAST_RANGE = BLOCK_SIZE * 9;
const VILLAGE_CLERIC_HEAL_DURATION = 10_000;
const VILLAGE_CLERIC_HEAL_INTERVAL = 1_000;
const VILLAGE_CLERIC_HEAL_RATE = 0.05;
const CRAFTRAS_CLERIC_STAFF_HEAL_PER_TICK = 20;
const CRAFTRAS_CLERIC_STAFF_COOLDOWN = 20_000;
const CRAFTRAS_CLERIC_STAFF_REVIVE_COOLDOWN = 30_000;
const CRAFTRAS_OP_CLERIC_STAFF_DURATION = 30_000;
const CRAFTRAS_OP_CLERIC_STAFF_HEAL_INTERVAL = 100;
const CRAFTRAS_OP_CLERIC_STAFF_HEAL_RATE = 0.2;
const CRAFTRAS_POPE_STAFF_CUBE_COUNT = 8;
const CRAFTRAS_POPE_STAFF_ORBIT_RADIUS = BLOCK_SIZE * 1.75;
const CRAFTRAS_POPE_STAFF_ORBIT_SPEED = 0.0032;
const CRAFTRAS_POPE_STAFF_SHOT_SPEED = 36;
const CRAFTRAS_POPE_STAFF_SHOT_COOLDOWN = 100;
const CRAFTRAS_POPE_STAFF_SHOT_DAMAGE = 100;
const CRAFTRAS_POPE_STAFF_BEAM_DAMAGE = 200;
const CRAFTRAS_POPE_STAFF_BEAM_BLOCK_DAMAGE = 10;
const CRAFTRAS_POPE_STAFF_DAMAGE_INTERVAL = 80;
const CRAFTRAS_POPE_STAFF_CHARGE_DURATION = 10_000;
const CRAFTRAS_POPE_STAFF_COOLDOWN = 60_000;
const CRAFTRAS_POPE_STAFF_MAGIC_STAGE_DURATION = 3_000;
const CRAFTRAS_POPE_STAFF_MAGIC_FADE_DURATION = 1_500;
const CRAFTRAS_POPE_STAFF_JUDGMENT_WINDUP = 1_200;
const CRAFTRAS_POPE_STAFF_JUDGMENT_DURATION = 10_000;
const CRAFTRAS_POPE_STAFF_CUBE_FADE_DURATION = 900;
const CRAFTRAS_POPE_STAFF_CUBE_VANISH_DURATION = 700;
const CRAFTRAS_POPE_STAFF_CUBE_VANISH_STAGGER = 180;
const CRAFTRAS_POPE_STAFF_CUBE_RESTORE_INTERVAL = CRAFTRAS_POPE_STAFF_COOLDOWN / CRAFTRAS_POPE_STAFF_CUBE_COUNT;
const CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_COUNT = 11;
const CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_SIZE = 300;
const CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_SPACING = 200;
const CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_INTERVAL = 35;
const CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_LIFE = 90;
const CRAFTRAS_POPE_STAFF_BEAM_LENGTH = 2000;
const CRAFTRAS_POPE_STAFF_BEAM_WIDTH = CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_SIZE * 1.75;
const CRAFTRAS_POPE_STAFF_BEAM_COLOR = "yellow";
const CRAFTRAS_POPE_STAFF_BEAM_ALPHA = 0.45;
const VILLAGE_GUARD_CLERIC_RETREAT_HEALTH_RATIO = 0.4;
const VILLAGE_BUILDER_LIMIT = 5;
const VILLAGE_BUILDER_REPAIR_RANGE = BLOCK_SIZE * 1.05;
const VILLAGE_BUILDER_REPAIR_FORCE_RANGE = BLOCK_SIZE * 2.15;
const VILLAGE_BUILDER_REPAIR_FORCE_AFTER = 3500;
const VILLAGE_BUILDER_BLOCK_DAMAGE = 5000;
const KINGDOM_GHOST_BUILDER_LIMIT = VILLAGE_BUILDER_LIMIT;
const KINGDOM_GHOST_BUILDER_SCAN_INTERVAL = 500;
const KINGDOM_GHOST_BUILDER_DESPAWN_DELAY = 4000;
const KINGDOM_GHOST_BUILDER_ALPHA = 0.4;
const ARENA_BUILD_INTERVAL = 3 * 60 * 60 * 1000;
const ARENA_BUILDER_LIMIT = 20;
const ARENA_BUILDER_SPEED_PER_TICK = BLOCK_SIZE * 20;
const ARENA_BUILDER_REPAIR_RANGE = BLOCK_SIZE * 3.75;
const ARENA_BUILDER_REPAIRS_PER_TICK = 16;
const ARENA_BUILD_SCAN_KEYS_PER_TICK = 600;
const ARENA_BUILD_ASSIGN_SCAN_KEYS = 900;
const ARENA_BUILD_REPAIR_BUDGET_PER_TICK = 160;
const DESTROYER_BLOCKS_PER_TICK = 350;
const WORLD_EDIT_BLOCKS_PER_TICK = 768;
const TEXT_STORY_BLOCK_PREFIX = "text_story_";
const TEXT_STORY_BLOCK_MAX = 999;
const TEXT_STORY_BLOCK_CODE = 26;
const getTextStoryIndex = block => {
    const match = /^text_story_(\d{1,3})$/.exec(String(block || ""));
    if (!match) return 0;
    const index = Number(match[1]);
    return Number.isInteger(index) && index >= 1 && index <= TEXT_STORY_BLOCK_MAX ? index : 0;
};
const isTextStoryBlock = block => getTextStoryIndex(block) > 0;
const makeTextStoryBlock = index => `${TEXT_STORY_BLOCK_PREFIX}${index}`;
const CRAFTRAS_ANNIHILATOR_FUSE = 30_000;
const CRAFTRAS_NUCLEAR_FUSE = 10 * 60_000;
const CRAFTRAS_NUCLEAR_RADIUS_BLOCKS = 400;
const CRAFTRAS_NUCLEAR_DAMAGE = 50_000;
const CRAFTRAS_GUARDIAN_COMBO_COOLDOWN = 10_000;
const CRAFTRAS_GUARDIAN_LAST_STAND_COMBO_COOLDOWN = 5_000;
const CRAFTRAS_GUARDIAN_COMBO_WINDUP = 2_000;
const CRAFTRAS_GUARDIAN_COMBO_STEP = 430;
const CRAFTRAS_GUARDIAN_LAST_STAND_COMBO_STEP = 300;
const CRAFTRAS_GUARDIAN_DODGE_RECHARGE = 7_000;
const CRAFTRAS_GUARDIAN_SLASH_DAMAGE = 20;
const CRAFTRAS_GUARDIAN_SLASH_SPEED = 67.5;
const CRAFTRAS_GUARDIAN_SLASH_KNOCKBACK = 36;
const CRAFTRAS_GUARDIAN_SLASH_LIFE = 1700;
const CRAFTRAS_GUARDIAN_SLASH_FADE = 950;
const CRAFTRAS_GUARDIAN_PROTECT_RANGE = BLOCK_SIZE * 4.2;
const CRAFTRAS_GUARDIAN_PROTECT_DASH_DAMAGE = 50;
const CRAFTRAS_GUARDIAN_PROTECT_SLASH_DAMAGE = 10;
const CRAFTRAS_GUARDIAN_PROTECT_SLASH_INTERVAL = 200;
const CRAFTRAS_GUARDIAN_BERSERK_DURATION = 20_000;
const CRAFTRAS_GUARDIAN_BERSERK_ARM_DELAY = 10_000;
const CRAFTRAS_GUARDIAN_BERSERK_COMBO_COOLDOWN = 2_000;
const CRAFTRAS_GUARDIAN_BERSERK_DASH_STEP = 200;
const CRAFTRAS_GUARDIAN_BERSERK_SLASH_STEP = 100;
const CRAFTRAS_GUARDIAN_BERSERK_SLASH_DAMAGE = 10;
const CRAFTRAS_GUARDIAN_BERSERK_SLASH_SPEED_MULTIPLIER = 1.8;
const CRAFTRAS_GUARDIAN_BERSERK_SLASH_SIZE_MULTIPLIER = 2;
const CRAFTRAS_KING_GUARDIAN_DAMAGE_CAP = 100;
const CRAFTRAS_KING_FLEE_DISTANCE = BLOCK_SIZE * 9;
const CRAFTRAS_SWORD_GUY_LINES = Object.freeze([
    "Ow! Stop it!",
    "I didn't do anything!",
    "you hate me?",
    "Ow! Let go of me!",
    "I'm innocent!",
]);
const CRAFTRAS_THE_SWORD_INTRO_LINES = Object.freeze([
    "alright...",
    "You really do love fighting, don't you?",
    "Then....",
    "I'll make sure you have plenty of fun.",
    "Don't run away",
]);
const CRAFTRAS_THE_SWORD_ESCAPE_LINES = Object.freeze([
    "Don't run away like a coward.",
    "Are you scared of me?",
    "Isn't this what you wanted?",
]);
const CRAFTRAS_THE_SWORD_ARENA_HALF_SIZE = BLOCK_SIZE * 30;
const CRAFTRAS_THE_SWORD_ENTRY_HALF_SIZE = BLOCK_SIZE * 34;
const CRAFTRAS_THE_SWORD_COMBO_COOLDOWN = 10_000;
const CRAFTRAS_THE_SWORD_FRIEND_SPEED = CRAFTRAS_GUARDIAN_SLASH_SPEED / 1.5;
const CRAFTRAS_THE_SWORD_BULLET_SPEED = CRAFTRAS_GUARDIAN_SLASH_SPEED * 0.575;
const CRAFTRAS_THE_SWORD_SLASH_SIZE = 1.5;
const CRAFTRAS_THE_SWORD_FRIEND_FADE = 650;
const CRAFTRAS_THE_SWORD_FRIEND_WARNING_DELAY = 900;
const CRAFTRAS_THE_SWORD_INTRO_LINE_INTERVAL = 3000;
const CRAFTRAS_THE_SWORD_INTRO_LINE_DURATION = 2400;
const CRAFTRAS_THE_SWORD_READY_DURATION = 3000;
const CRAFTRAS_THE_SWORD_RECOVER_INTERVAL = 100;
const CRAFTRAS_THE_SWORD_RECOVER_PER_TICK = 100;
const CRAFTRAS_THE_SWORD_PLAYER_DAMAGE_CAP = 10_000_000_000;
const CRAFTRAS_THE_SWORD_DEATH_LINES = Object.freeze([
    { text: "wow....", duration: 2_000 },
    { text: "very impressive....", duration: 3_000 },
    { text: "It's been a long time since someone pushed me this far...", duration: 5_000 },
    { text: "I want to fight you some more...", duration: 3_000 },
    { text: "But you're too weak to defeat me...", duration: 3_000 },
    { text: "When you've grown stronger", duration: 3_000 },
    { text: "Let's meet again in World 2", duration: 4_000 },
    { text: "bye bye", duration: 2_000 },
]);
const CRAFTRAS_CHALLENGE_ESCORT_STEP = BLOCK_SIZE * 0.0625;
const CRAFTRAS_CHALLENGE_INTRO_LINES = Object.freeze([
    { text: "Hey! Snap out of it!", duration: 3_000 },
    { text: "We don't have time for this!", duration: 4_000 },
    { text: "The village has already been badly destroyed.", duration: 4_000 },
    { text: "We can't hold this position much longer!", duration: 4_000 },
    { text: "Look at the map.", duration: 2_000 },
    { text: "Our objective is to escape to the village in the northwest.", duration: 5_000 },
    { text: "So get ready-", duration: 2_000, cameraShake: { duration: 2_000, amount: 65 } },
    { text: "Damn these zombies!!", duration: 4_000, startEscort: true },
    { text: "Protect the king!!", duration: 3_000 },
]);
const CRAFTRAS_CHALLENGE_SPAWN_STAGES = Object.freeze({
    1: { cap: 20, interval: 500, normal: 0.70, equipped: 0.05, runner: 0.20, giant: 0.10 },
    2: { cap: 10, interval: 1_000, normal: 1, equipped: 0, runner: 0, giant: 0 },
    3: { cap: 50, interval: 200, normal: 0.70, equipped: 0.05, runner: 0.20, giant: 0.10 },
    4: { cap: 20, interval: 2_000, normal: 0.20, equipped: 1, runner: 0, giant: 0.80 },
    5: { cap: 80, interval: 100, normal: 0.90, equipped: 0.05, runner: 0.07, giant: 0.03 },
    6: { cap: 20, interval: 500, normal: 0.80, equipped: 0, runner: 0.20, giant: 0 },
    7: { cap: 80, interval: 100, normal: 0.85, equipped: 0.10, runner: 0.10, giant: 0.05 },
});
const CRAFTRAS_CHALLENGE_STAGE_SPAWN_DELAY = 10_000;
const CRAFTRAS_CHALLENGE_NPC_REGEN_INTERVAL = 5_000;
const CRAFTRAS_CHALLENGE_NPC_REGEN_AMOUNT = 100;
const CRAFTRAS_CHALLENGE_FAIL_MESSAGE_DURATION = 4_000;
const CRAFTRAS_CHALLENGE_STRAGGLER_DISTANCE = BLOCK_SIZE * 18;
const CRAFTRAS_CHALLENGE_MAGIC_DAMAGE = 20;
const CRAFTRAS_CHALLENGE_MAGIC_SKILL_COOLDOWN = 10_000;
const CRAFTRAS_CHALLENGE_MAGIC_FADE_DURATION = 700;
const CRAFTRAS_CHALLENGE_CURSE_SPAWN_INTERVAL = 2_500;
const CRAFTRAS_CHALLENGE_CURSE_COUNT = 6;
const CRAFTRAS_CHALLENGE_CURSE_DURATION = 10_000;
const CRAFTRAS_CHALLENGE_MAGICIAN_FAREWELL = "L̶̮͎͚̰̠͎͖̠̤̯̭̝͍͚̳͊̾̉̀͗͑̃̅̍̀̽̆̋̓͒̒́̉̇̿͋̏Ü̶̟̭̲̯̜̪̭̝͚̣͚̪̥̝̟̟̗͍̘͆̀̾͆̓̌͆̌̅̿̈́̎̐̊̑̑͋̀̔̚C̸͈̫͙̠̭̪̪̝̮̝͇̑̌̀̑͑̾̎̌͊̔͑̑̏̓̎́͋̊̅̽̈́̆ͅK̴̯̙̘̬͍̤̮̟̘͔͎͖͍̫̲̱̈́̇̎̂́̋̏̈́̍͑̉̿̿̋͐̀̓̉̂̚̚Y҉̦̲̮̣͖̳͎͇̝̱̦̗̋̂̽̌̈̇͑͂̆͛̽̚ Y̵̖͓̤̱͇̬͈̬̘͇̩͈̥̦̮̠̱̓͛̋̒̃̇̉̆̑̐͒̎̊̂̄̚ͅO̷͍̗̗̝̭͓̲͍̙̘͉̞͇͙͎̝̟͈͈͇͕̍͋̓͋̓̅̄̍͋̈́̇̅̈́̀́̽̇́͋̉̀̓Ụ̸̞̘̳̬̥̙͚͔̮̠̳̲̭̗̘̯̠̬͖͋̆͌͒͋͌͆́͛̇̆̇̿.̴͔͖̥̱̬̰̬̩͉͍̱̣̦̥̥̗̲͚͗̈͑̐̂̅̀̿̇́́̚.̶̭̞̯͖͙̣̯̤̭̪̯͉͇̭̜̰̰͇̲̪͇͔͙́͋̐͊̀̀͛̀́͊̊̆̋͐̌͛́́̿̐.̶̬͇̘̬̭̫̞̠̘̟̘̗̬̪̩̞͍̤̝̑̑͌͑̉̊͌̽̓̇͋̓͌̐̾͛ͅͅ.҉̥̠͚̮̬̙̲̲̩͉̝͙͔͇̥̦͕͉̤̜̣͇̀́̐͗̃̌̽̅́͋̀̎́̂͗̽̍̊̽ͅ.҈̟͚̭̫̰̭̯͔̣̞̮̗̥͇̝̟̮̞̫̬̠͕͆̃̽̀͑́̈́̅̆́͋͂͒̓̔̉̽́́͊͋͊͐̚ͅ";
const CRAFTRAS_GREAT_FRIEND_ITEM_ID = "the_great_friend";
const CRAFTRAS_GREAT_FRIEND_COMPANION_DAMAGE = 100;
const CRAFTRAS_GREAT_FRIEND_COMPANION_INTERVAL = 1_000;
const CRAFTRAS_GREAT_FRIEND_COMPANION_RANGE = BLOCK_SIZE * 12;
const CRAFTRAS_GREAT_FRIEND_COMPANION_SPEED = 51;
const CRAFTRAS_GREAT_FRIEND_COMPANION_FOLLOW_RADIUS = BLOCK_SIZE * 1.8;
const CRAFTRAS_CHALLENGE_KEY_ITEM = "royal_key";
const CRAFTRAS_CHALLENGE_TRANSITION_OUT_MS = 2_400;
const CRAFTRAS_CHALLENGE_TRANSFER_DELAY_MS = 2_650;
const CRAFTRAS_OP_CLERIC_STAFF_RADIUS = BLOCK_SIZE * 12;
const CRAFTRAS_THE_SWORD_POSE = Object.freeze({
    idleAngle: 169,
    idleGripAngle: -73,
    idleGripOffset: 7.6,
    windupAngle: -129,
    windupGripAngle: -99,
    windupGripOffset: 10.8,
    cutEndAngle: 93,
    cutGripAngle: 63,
    cutGripOffset: 21.2,
    recoverAngle: 169,
    recoverGripAngle: -73,
    windupEnd: 0.18,
    cutEnd: 0.62,
    idleSize: 18.5,
    cutSize: 27,
});
const BLOCK_REGEN_DELAY = 10_000;
const BLOCK_REGEN_RATE_PER_SECOND = 0.2;
const CRAFTRAS_MOB_SEPARATION_CELL_SIZE = BLOCK_SIZE * 1.5;
const CRAFTRAS_MOB_SEPARATION_RADIUS_SCALE = 1.05;
const CRAFTRAS_MOB_SEPARATION_STRENGTH = 0.28;
const CRAFTRAS_MOB_SEPARATION_MAX_PUSH = BLOCK_SIZE * 0.09;
const DAY_PHASE_DURATION = 10 * 60 * 1000;
const DAY_CYCLE_DURATION = DAY_PHASE_DURATION * 3;
const DAY_PHASES = ["morning", "afternoon", "night"];
const WEATHER_CHECK_INTERVAL = 10 * 60 * 1000;
const WEATHER_RAIN_DURATION = 10 * 60 * 1000;
const WEATHER_INITIAL_RAIN_CHANCE = 0.05;
const WEATHER_RAIN_CHANCE_STEP = 0.05;
const KINGDOM_WEATHER_TRANSITION_DURATION = 60_000;
const KINGDOM_WEATHER_SWAP_DELAY = KINGDOM_WEATHER_TRANSITION_DURATION / 2;
const BLOCK_CODES = Object.freeze({
    [BLOCKS.AIR]: 0,
    [BLOCKS.TREE]: 1,
    [BLOCKS.GRASS_WALL]: 2,
    [BLOCKS.DIRT_WALL]: 3,
    [BLOCKS.ROCK]: 4,
    [BLOCKS.CORE_ROCK]: 4,
    [BLOCKS.COAL_ORE]: 5,
    [BLOCKS.IRON_ORE]: 6,
    [BLOCKS.GOLD_ORE]: 7,
    [BLOCKS.CRYSTAL_ORE]: 8,
    [BLOCKS.PLANK]: 9,
    [BLOCKS.CRAFTING_TABLE]: 10,
    [BLOCKS.FURNACE]: 11,
    [BLOCKS.TORCH]: 20,
    [BLOCKS.STEEL_TORCH]: 21,
    [BLOCKS.CHEST]: 13,
    [BLOCKS.BEDROCK]: 14,
    [BLOCKS.COAL_BLOCK]: 15,
    [BLOCKS.IRON_BLOCK]: 16,
    [BLOCKS.GOLD_BLOCK]: 17,
    [BLOCKS.DIAMOND_BLOCK]: 18,
    [BLOCKS.DIRT_PATH]: 19,
    [BLOCKS.CHALLENGE_START]: 22,
    [BLOCKS.CHALLENGE_SPAWN]: 23,
    [BLOCKS.TRANSPARENT_BLOCK]: 24,
    [BLOCKS.ROUTE_MARKER]: 25,
});
const BLOCK_HEALTH = Object.freeze({
    [BLOCKS.GRASS_WALL]: 50,
    [BLOCKS.DIRT_WALL]: 50,
    [BLOCKS.DIRT_PATH]: 50,
    [BLOCKS.ROCK]: 100,
    [BLOCKS.CORE_ROCK]: 100,
    [BLOCKS.COAL_ORE]: 150,
    [BLOCKS.IRON_ORE]: 250,
    [BLOCKS.GOLD_ORE]: 200,
    [BLOCKS.CRYSTAL_ORE]: 300,
    [BLOCKS.TREE]: 75,
    [BLOCKS.PLANK]: 75,
    [BLOCKS.CRAFTING_TABLE]: 75,
    [BLOCKS.FURNACE]: 100,
    [BLOCKS.TORCH]: 5,
    [BLOCKS.STEEL_TORCH]: 1_000_000_000,
    [BLOCKS.CHEST]: 75,
    [BLOCKS.BEDROCK]: 100_000_000,
    [BLOCKS.COAL_BLOCK]: 300,
    [BLOCKS.IRON_BLOCK]: 500,
    [BLOCKS.GOLD_BLOCK]: 400,
    [BLOCKS.DIAMOND_BLOCK]: 600,
    [BLOCKS.CHALLENGE_START]: 1_000_000_000,
    [BLOCKS.CHALLENGE_SPAWN]: 1_000_000_000,
    [BLOCKS.TRANSPARENT_BLOCK]: 1_000_000_000,
    [BLOCKS.ROUTE_MARKER]: 1_000_000_000,
});
const BLOCK_DROPS = Object.freeze({
    [BLOCKS.GRASS_WALL]: { id: "grass_block", name: "Grass Block" },
    [BLOCKS.DIRT_WALL]: { id: "dirt", name: "Dirt" },
    [BLOCKS.DIRT_PATH]: { id: "dirt_path", name: "Dirt Path" },
    [BLOCKS.ROCK]: { id: "stone", name: "Stone" },
    [BLOCKS.CORE_ROCK]: { id: "stone", name: "Stone" },
    [BLOCKS.COAL_ORE]: { id: "coal", name: "Coal" },
    [BLOCKS.IRON_ORE]: { id: "iron_ore", name: "Iron Ore" },
    [BLOCKS.GOLD_ORE]: { id: "gold_ore", name: "Gold Ore" },
    [BLOCKS.CRYSTAL_ORE]: { id: "diamond", name: "Diamond" },
    [BLOCKS.TREE]: { id: "wood", name: "Wood" },
    [BLOCKS.PLANK]: { id: "plank", name: "Oak Plank" },
    [BLOCKS.CRAFTING_TABLE]: { id: "crafting_table", name: "Crafting Table" },
    [BLOCKS.FURNACE]: { id: "furnace", name: "Furnace" },
    [BLOCKS.TORCH]: { id: "torch", name: "Torch" },
    [BLOCKS.STEEL_TORCH]: { id: "steel_torch", name: "Steel Torch" },
    [BLOCKS.CHEST]: { id: "chest", name: "Chest" },
    [BLOCKS.BEDROCK]: { id: "bedrock", name: "Bedrock" },
    [BLOCKS.COAL_BLOCK]: { id: "coal_block", name: "Coal Block" },
    [BLOCKS.IRON_BLOCK]: { id: "iron_block", name: "Iron Block" },
    [BLOCKS.GOLD_BLOCK]: { id: "gold_block", name: "Gold Block" },
    [BLOCKS.DIAMOND_BLOCK]: { id: "diamond_block", name: "Diamond Block" },
});
const BLOCK_SCORES = Object.freeze({
    [BLOCKS.ROCK]: 50,
    [BLOCKS.CORE_ROCK]: 50,
    [BLOCKS.COAL_ORE]: 200,
    [BLOCKS.IRON_ORE]: 500,
    [BLOCKS.GOLD_ORE]: 1000,
    [BLOCKS.CRYSTAL_ORE]: 5000,
});
const MOB_SCORES = Object.freeze({
    zombie: 2500,
    iron_helmet_zombie: 2500,
    diamond_helmet_zombie: 2500,
    iron_sword_zombie: 2500,
    diamond_sword_zombie: 2500,
    giant_zombie: 2500,
    runner_zombie: 2500,
    cursed_zombie: 0,
    titan_zombie: 10000,
    magical_zombie: 0,
    king_zombie: 15000,
    king_guardian: 8000,
    skeleton: 2500,
    sniper_skeleton: 3500,
    cannon_skeleton: 5000,
    sword_guy: 25000,
    creeper: 5000,
    annihilator: 25000,
    the_nuclear: 100000,
    spider: 2500,
    toxic_spider: 2500,
    queen_spider: 30000,
    blacksmith: 0,
    builder: 0,
    guard: 0,
    villager: 0,
    captain: 0,
    cleric: 0,
    merchant: 0,
    monster_merchant: 0,
    pope: 0,
    blesser: 0,
});
const MOB_CLASS_NAMES = Object.freeze({
    zombie: "craftrasZombie",
    iron_helmet_zombie: "craftrasIronHelmetZombie",
    diamond_helmet_zombie: "craftrasDiamondHelmetZombie",
    iron_sword_zombie: "craftrasIronSwordZombie",
    diamond_sword_zombie: "craftrasZombie",
    giant_zombie: "craftrasGiantZombie",
    runner_zombie: "craftrasRunnerZombie",
    cursed_zombie: "craftrasCursedZombie",
    titan_zombie: "craftrasTitanZombie",
    magical_zombie: "craftrasMagicalZombie",
    king_zombie: "craftrasKingZombie",
    king_guardian: "craftrasKingGuardian",
    skeleton: "craftrasSkeleton",
    sniper_skeleton: "craftrasSniperSkeleton",
    cannon_skeleton: "craftrasCannonSkeleton",
    sword_guy: "craftrasSwordGuy",
    creeper: "craftrasCreeper",
    annihilator: "craftrasAnnihilator",
    the_nuclear: "craftrasNuclear",
    spider: "craftrasSpider",
    toxic_spider: "craftrasToxicSpider",
    queen_spider: "queen_spider",
    cow: "craftrasCow",
    pig: "craftrasPig",
    chicken: "craftrasChicken",
    blacksmith: "craftrasBlacksmith",
    builder: "craftrasBuilder",
    guard: "craftrasVillageGuard",
    villager: "craftrasVillager",
    captain: "craftrasKnightCaptain",
    challenge_king: "craftrasChallengeKing",
    royal_guardian: "craftrasRoyalGuardian",
    cleric: "craftrasCleric",
    merchant: "craftrasMerchant",
    monster_merchant: "craftrasMonsterMerchant",
    pope: "craftrasPope",
    blesser: "craftrasBlesser",
});
const MOB_HEALTH = Object.freeze({
    zombie: 100,
    iron_helmet_zombie: 200,
    diamond_helmet_zombie: 300,
    iron_sword_zombie: 100,
    diamond_sword_zombie: 100,
    giant_zombie: 500,
    runner_zombie: 100,
    cursed_zombie: 1,
    titan_zombie: 4000,
    magical_zombie: 1_000_000_000,
    king_zombie: 400,
    king_guardian: 1000,
    skeleton: 100,
    sniper_skeleton: 50,
    cannon_skeleton: 150,
    sword_guy: 1000,
    creeper: 100,
    annihilator: 1500,
    the_nuclear: 10000,
    spider: 100,
    toxic_spider: 75,
    queen_spider: 2500,
    cow: 100,
    pig: 80,
    chicken: 40,
    blacksmith: 50_000_000,
    builder: 50_000_000,
    guard: 300,
    villager: 50_000_000,
    captain: 1000,
    challenge_king: 1000,
    royal_guardian: 1000,
    cleric: 300,
    merchant: 50_000_000,
    monster_merchant: 50_000_000,
    pope: 50_000_000,
    blesser: 50_000_000,
});
const MOB_TYPES = new Set(Object.keys(MOB_CLASS_NAMES));
const ANIMAL_TYPES = new Set(["cow", "pig", "chicken"]);
const NPC_TYPES = new Set(["blacksmith", "builder", "guard", "villager", "captain", "challenge_king", "royal_guardian", "cleric", "merchant", "monster_merchant", "pope", "blesser"]);
const VILLAGE_STATIC_NPC_TYPES = new Set(["blacksmith", "guard", "villager", "captain", "cleric", "merchant", "monster_merchant", "pope", "blesser"]);
const VILLAGE_SPAWNPOINT_NPC_TYPES = Object.freeze(["blacksmith", "merchant", "monster_merchant", "pope", "blesser"]);
const VILLAGE_IDLE_SHOP_NPC_TYPES = new Set(["merchant", "monster_merchant"]);
const VILLAGE_COMBAT_NPC_TYPES = new Set(["guard", "captain"]);
const VILLAGE_CLERIC_NPC_HEAL_TARGET_TYPES = new Set(["guard", "captain"]);
const NON_DESPAWNING_MOB_TYPES = new Set(["king_zombie", "king_guardian", "queen_spider", "sword_guy", "annihilator", "the_nuclear", "titan_zombie", "magical_zombie", ...NPC_TYPES]);
const PLACEABLE_ITEMS = Object.freeze({
    grass_block: BLOCKS.GRASS_WALL,
    dirt: BLOCKS.DIRT_WALL,
    dirt_path: BLOCKS.DIRT_PATH,
    stone: BLOCKS.ROCK,
    coal: BLOCKS.COAL_ORE,
    iron_ore: BLOCKS.IRON_ORE,
    gold_ore: BLOCKS.GOLD_ORE,
    wood: BLOCKS.TREE,
    plank: BLOCKS.PLANK,
    crafting_table: BLOCKS.CRAFTING_TABLE,
    furnace: BLOCKS.FURNACE,
    torch: BLOCKS.TORCH,
    steel_torch: BLOCKS.STEEL_TORCH,
    chest: BLOCKS.CHEST,
    bedrock: BLOCKS.BEDROCK,
    coal_block: BLOCKS.COAL_BLOCK,
    iron_block: BLOCKS.IRON_BLOCK,
    gold_block: BLOCKS.GOLD_BLOCK,
    diamond_block: BLOCKS.DIAMOND_BLOCK,
    challenge_start_block: BLOCKS.CHALLENGE_START,
    challenge_spawn_block: BLOCKS.CHALLENGE_SPAWN,
    transparent_block: BLOCKS.TRANSPARENT_BLOCK,
    route_marker_block: BLOCKS.ROUTE_MARKER,
});
const AXE_BLOCKS = new Set([BLOCKS.TREE, BLOCKS.PLANK, BLOCKS.CRAFTING_TABLE, BLOCKS.TORCH, BLOCKS.STEEL_TORCH, BLOCKS.CHEST]);
const PICKAXE_BLOCKS = new Set([
    BLOCKS.ROCK, BLOCKS.CORE_ROCK, BLOCKS.COAL_ORE, BLOCKS.IRON_ORE,
    BLOCKS.GOLD_ORE, BLOCKS.CRYSTAL_ORE, BLOCKS.FURNACE, BLOCKS.COAL_BLOCK,
    BLOCKS.IRON_BLOCK, BLOCKS.GOLD_BLOCK, BLOCKS.DIAMOND_BLOCK, BLOCKS.BEDROCK,
]);
const SHOVEL_BLOCKS = new Set([BLOCKS.GRASS_WALL, BLOCKS.DIRT_WALL, BLOCKS.DIRT_PATH]);
const ALWAYS_HARVESTABLE_BLOCKS = new Set([
    BLOCKS.GRASS_WALL,
    BLOCKS.DIRT_WALL,
    BLOCKS.DIRT_PATH,
    BLOCKS.TREE,
    BLOCKS.TORCH,
    BLOCKS.STEEL_TORCH,
]);
const BLACKSMITH_RECIPE_UNLOCKS = Object.freeze({
    venom_sword_recipe: { unlock: "venom_sword", name: "Venom Sword", cost: 50, output: "venom_sword" },
    knight_shield_recipe: { unlock: "knight_shield", name: "Knight's Shield", cost: 30, output: "knight_shield" },
    zombie_crown_recipe: { unlock: "zombie_crown", name: "Zombie Crown", cost: 40, output: "zombie_crown" },
    cleric_staff_recipe: { unlock: "cleric_staff", name: "Cleric Staff", cost: 30, output: "cleric_staff" },
    bone_bomb_recipe: { unlock: "bone_bomb", name: "Bone Bomb", cost: 30, output: "bone_bomb" },
});
const CRAFTRAS_LOCKED_RECIPE_ITEMS = new Set([
    "venom_sword_recipe", "knight_shield_recipe", "zombie_crown_recipe",
    "cleric_staff_recipe", "cleric_staff_head", "cleric_staff_body", "cleric_staff_handle",
    "bone_bomb_recipe",
]);
const CRAFTRAS_WORLD1_TOKEN_REQUIREMENTS = Object.freeze([
    { id: "knight_shield", name: "Knight's Shield" },
    { id: "zombie_crown", name: "King's Crown" },
    { id: "venom_sword", name: "Venom Sword" },
    { id: "cleric_staff", name: "Cleric Staff" },
]);
const CRAFTRAS_REBIRTH_REQUIREMENTS = Object.freeze([
    { id: "world1_badge", name: "World 1 Badge" },
]);
const CRAFTRAS_BLESSER_SHOP_OFFERS = Object.freeze([
    { id: "cleric_staff_recipe", name: "Cleric Staff Recipe", price: 5_000, count: 1, kind: "item" },
    { id: "cleric_staff_head", name: "Cleric Staff Head", price: 1_000, count: 1, kind: "item" },
    { id: "cleric_staff_body", name: "Cleric Staff Body", price: 1_000, count: 1, kind: "item" },
    { id: "cleric_staff_handle", name: "Cleric Staff Handle", price: 1_000, count: 1, kind: "item" },
    { id: "strength_buff", name: "Strength Buff", price: VILLAGE_BLESSER_BUFF_COST, count: 1, kind: "buff" },
    { id: "health_buff", name: "Health Buff", price: VILLAGE_BLESSER_BUFF_COST, count: 1, kind: "buff" },
]);
const CRAFTRAS_SHOP_SELL_PRICES = Object.freeze({
    stone: 2,
    coal: 10,
    iron_ore: 25,
    gold_ore: 40,
    diamond: 100,
    iron_ingot: 35,
    gold_ingot: 55,
    coal_block: 90,
    iron_block: 315,
    gold_block: 495,
    diamond_block: 900,
    rotten_flesh: 3,
    bone: 3,
    gunpowder: 3,
    spider_eye: 3,
    toxic_spider_eye: 3,
    spider_leg: 3,
    string: 3,
    spider_venom: 3,
    zombie_head: 50,
    skeleton_head: 50,
    creeper_head: 50,
    spider_head: 50,
    toxic_spider_head: 50,
});
const CRAFTRAS_MONSTER_SHOP_OFFERS = Object.freeze([
    { id: "king_zombie_summon_ticket", name: "King Zombie Summon Ticket", price: 1000, count: 1, stock: 10, maxStock: 10 },
    { id: "queen_spider_summon_ticket", name: "Queen Spider Summon Ticket", price: 1000, count: 1, stock: 10, maxStock: 10 },
    { id: "annihilator_summon_ticket", name: "Annihilator Summon Ticket", price: 1000, count: 1, stock: 10, maxStock: 10 },
    { id: "sword_guy_summon_ticket", name: "Sword guy Summon Ticket", price: 1000, count: 1, stock: 10, maxStock: 10 },
]);
const CRAFTRAS_SUMMON_TICKET_BOSSES = Object.freeze({
    king_zombie_summon_ticket: "king_zombie",
    queen_spider_summon_ticket: "queen_spider",
    annihilator_summon_ticket: "annihilator",
    sword_guy_summon_ticket: "sword_guy",
});
const CRAFTRAS_HEAD_TICKET_REWARDS = Object.freeze({
    zombie_head: "king_zombie_summon_ticket",
    spider_head: "queen_spider_summon_ticket",
    toxic_spider_head: "queen_spider_summon_ticket",
    creeper_head: "annihilator_summon_ticket",
    skeleton_head: "sword_guy_summon_ticket",
});
const CRAFTRAS_SHOP_BASE_PRICES = Object.freeze({
    wood: 4,
    plank: 1,
    stick: 3,
    stone: 3,
    coal: 12,
    iron_ore: 32,
    gold_ore: 52,
    diamond: 100,
    iron_ingot: 35,
    gold_ingot: 55,
    charcoal: 12,
    torch: 18,
    spider_eye: 120,
    toxic_spider_eye: 240,
    spider_leg: 700,
    string: 120,
    spider_venom: 2400,
    crown_fragment: 4200,
    royal_key: 6500,
    knight_shield_fragment: 7000,
    venom_sword_recipe: 45000,
    knight_shield_recipe: 35000,
    zombie_crown_recipe: 40000,
    bone_bomb_recipe: 30000,
});
const CRAFTRAS_SHOP_COMMON_ITEMS = Object.freeze([
    "wood", "stone", "coal", "iron_ore", "gold_ore", "diamond", "iron_ingot", "gold_ingot",
    "stick", "torch", "iron_pickaxe", "iron_sword", "diamond_pickaxe", "diamond_sword",
]);
const CRAFTRAS_SHOP_BOSS_MATERIALS = Object.freeze([
    "crown_fragment", "royal_key", "knight_shield_fragment", "spider_eye", "toxic_spider_eye",
    "spider_leg", "string", "spider_venom",
]);
const CRAFTRAS_SHOP_RECIPE_ITEMS = Object.freeze(["venom_sword_recipe", "knight_shield_recipe", "zombie_crown_recipe", "bone_bomb_recipe"]);
const CRAFTRAS_BOSS_CAVE_TYPES = new Set(["zombie_boss_room", "queen_spider_boss_room"]);
const CRAFTRAS_PASSIVE_BOSS_CAVE_MOB_CAP = 20;
const CRAFTRAS_BOSS_NATURAL_ROLL_INTERVAL = 60_000;
const CRAFTRAS_BOSS_NATURAL_SPAWN_COOLDOWN = 10 * 60_000;
const CRAFTRAS_SHIELD_REGEN_DELAY = 10_000;
const CRAFTRAS_SHIELD_REGEN_INTERVAL = 100;
const CRAFTRAS_SHIELD_REGEN_RATIO = 0.01;
const CRAFTRAS_ZOMBIE_CAVE_BASE_MOB_CAP = 20;
const CRAFTRAS_ZOMBIE_CAVE_MOB_CAP_PER_PLAYER = 15;
const CRAFTRAS_ZOMBIE_CAVE_MOB_CAP_GROWTH_INTERVAL = 2 * 60_000;
const CRAFTRAS_ZOMBIE_CAVE_SPAWN_RATE_MULTIPLIER = 1;
const CRAFTRAS_SHOP_BLOCK_ITEMS = new Set([
    "grass_block", "dirt", "dirt_path", "stone", "wood", "plank", "crafting_table",
    "furnace", "torch", "steel_torch", "chest", "bedrock", "coal_block", "iron_block",
    "gold_block", "diamond_block",
]);
const VILLAGE_IGNORED_DECORATION_BLOCKS = new Set([BLOCKS.TORCH, BLOCKS.STEEL_TORCH]);
const BLOCK_HARVEST_LEVEL = Object.freeze({
    [BLOCKS.GRASS_WALL]: 1,
    [BLOCKS.DIRT_WALL]: 1,
    [BLOCKS.DIRT_PATH]: 1,
    [BLOCKS.TREE]: 1,
    [BLOCKS.PLANK]: 1,
    [BLOCKS.CRAFTING_TABLE]: 1,
    [BLOCKS.TORCH]: 1,
    [BLOCKS.STEEL_TORCH]: 999,
    [BLOCKS.CHEST]: 1,
    [BLOCKS.ROCK]: 1,
    [BLOCKS.CORE_ROCK]: 1,
    [BLOCKS.FURNACE]: 1,
    [BLOCKS.COAL_ORE]: 2,
    [BLOCKS.COAL_BLOCK]: 2,
    [BLOCKS.IRON_ORE]: 2,
    [BLOCKS.IRON_BLOCK]: 2,
    [BLOCKS.GOLD_ORE]: 2,
    [BLOCKS.GOLD_BLOCK]: 2,
    [BLOCKS.CRYSTAL_ORE]: 3,
    [BLOCKS.DIAMOND_BLOCK]: 3,
    [BLOCKS.BEDROCK]: 999,
    [BLOCKS.CHALLENGE_SPAWN]: 999,
    [BLOCKS.TRANSPARENT_BLOCK]: 999,
    [BLOCKS.ROUTE_MARKER]: 999,
});

const getToolHarvestLevel = itemId => {
    if (itemId === "admin_pickaxe") return 999;
    if (itemId?.startsWith("diamond_")) return 3;
    if (itemId?.startsWith("iron_")) return 2;
    if (itemId?.startsWith("stone_") || itemId?.startsWith("gold_")) return 1;
    if (itemId?.startsWith("wooden_")) return 0;
    return -1;
};

class Craftras {
    constructor(gameManager) {
        this.redefine(gameManager);
        this.seed = 1337;
        this.cellCache = new Map();
        this.destroyedWallKeys = new Set();
        this.brokenKingdomBlueprintClearedKeys = new Set();
        this.caveBlueprintClearedKeys = new Set();
        this.placedBlocks = new Map();
        this.placedFloors = new Map();
        this.textStoryMarkers = new Map();
        this.placedBlockDirections = new Map();
        this.furnaces = new Map();
        this.chests = new Map();
        this.damagedWallHealth = new Map();
        this.damagedWallLastHitAt = new Map();
        this.permanentBlockDamageStages = new Map();
        this.damagedWallRegenLastUpdate = Date.now();
        this.damagedFloorHealth = new Map();
        this.clientStates = new WeakMap();
        this.loadedTrees = new Map();
        this.itemDrops = new Set();
        this.mobs = new Set();
        this.spiderEggs = new Set();
        this.spiderWebProjectiles = new Set();
        this.spiderWebs = new Set();
        this.guardianSlashProjectiles = new Set();
        this.challengeMagicEntities = new Set();
        this.theGreatProjectiles = new Set();
        this.theGreatCompanions = new Map();
        this.theGreatWarnings = new Set();
        this.explosionEffects = new Set();
        this.clericHealCircles = new Set();
        this.rocketProjectiles = new Set();
        this.boneBombProjectiles = new Set();
        this.popeStaffCubes = new Set();
        this.popeStaffMagicCircles = new Set();
        this.popeStaffJudgments = new Set();
        this.popeStaffPendingJudgments = [];
        this.popeStaffBeamStates = [];
        this.destroyerQueue = [];
        this.destroyerQueueIndex = 0;
        this.destroyerQueuedBlockKeys = new Set();
        this.worldEditJobs = new Map();
        this.routeMarkerRevision = 0;
        this.textStoryMarkerRevision = 0;
        this.pendingGuardianSpawns = new Set();
        this.knightTargetBody = null;
        this.dayCycleTime = 0;
        this.dayCycleSpeed = 1;
        this.dayCycleLastUpdate = Date.now();
        this.dayCycleLastSync = 0;
        this.craftrasTimeStopped = false;
        this.weatherType = Config.craftras_world1_challenge_builder ? "rain" : "clear";
        this.weatherRainChance = WEATHER_INITIAL_RAIN_CHANCE;
        this.weatherCheckElapsed = 0;
        this.weatherRainElapsed = 0;
        this.weatherLastUpdate = Date.now();
        this.weatherLastSync = 0;
        this.scheduledWeatherChange = null;
        this.kingdomBlueprintStates = { ruined: null, intact: null };
        this.kingdomWeatherState = "ruined";
        this.kingdomWeatherTransition = null;
        this.kingdomWeatherEventId = 0;
        this.kingdomWeatherClearEventId = 0;
        this.kingdomWeatherClearNotifyUntil = 0;
        this.kingdomWeatherLastSync = 0;
        this.mobSpawnCounter = 0;
        this.animalSpawnCounter = 0;
        this.treeClientCount = 0;
        this.baseLoadRadius = 8;
        this.maxLoadRadius = 48;
        this.updateCounter = 0;
        this.spawnPoint = null;
        this.spawnPool = [];
        this.challengeSpawnCursor = 0;
        this.challengeStage = Config.craftras_world1_challenge_builder ? "waiting" : null;
        this.challengeActors = new Set();
        this.challengeRoute = [];
        this.challengeRouteStartIndex = 0;
        this.challengeEscortMoving = false;
        this.challengeIntro = null;
        this.challengeRouteProtectedCells = new Set();
        this.challengeEncounter = null;
        this.challengeApproachPlayerId = null;
        this.challengeHadClients = false;
        this.challengeFailure = null;
        this.villageBounds = null;
        this.villageNpcSpawns = {};
        this.villageOriginalBlocks = new Map();
        this.villageRepairJobs = new Map();
        this.villageDemolitionJobs = new Map();
        this.nextVillageDemolitionScanAt = 0;
        this.kingdomGhostRepairJobs = new Map();
        this.nextKingdomGhostRepairScanAt = 0;
        this.villageStaticNpcMaintainCounter = 0;
        this.shopOffers = [];
        this.shopNextRefreshAt = 0;
        this.shopPriceCache = new Map();
        this.arenaBuildJobs = new Map();
        this.nextArenaBuildAt = Date.now() + ARENA_BUILD_INTERVAL;
        this.arenaBuildActive = false;
        this.arenaBuildScanIterator = null;
        this.arenaBuildScanActive = false;
        this.arenaBuildScanTargetCount = 0;
        this.arenaBuildRepairBudget = ARENA_BUILD_REPAIR_BUDGET_PER_TICK;
        this.nuclearArenaBuildTimeout = null;
        this.worldSize = WORLD_SIZE;
        this.monsterPlaces = this.buildMonsterPlaces();
    }

    redefine(gameManager) {
        this.gameManager = gameManager;
    }

    start() {
        for (const actor of this.challengeActors) {
            actor?.destroy?.();
            this.mobs.delete(actor);
        }
        this.challengeActors.clear();
        this.challengeStage = Config.craftras_world1_challenge_builder ? "waiting" : null;
        this.challengeRoute = [];
        this.challengeRouteStartIndex = 0;
        this.challengeEscortMoving = false;
        this.challengeIntro = null;
        this.challengeRouteProtectedCells.clear();
        this.challengeEncounter = null;
        this.challengeApproachPlayerId = null;
        this.challengeHadClients = false;
        this.challengeFailure = null;
        this.clearLoadedTrees();
        this.cellCache.clear();
        this.clientStates = new WeakMap();
        this.treeClientCount = 0;
        this.pendingGuardianSpawns.clear();
        this.destroyerQueue = [];
        this.destroyerQueueIndex = 0;
        this.destroyerQueuedBlockKeys.clear();
        this.worldEditJobs.clear();
        this.textStoryMarkers.clear();
        this.knightTargetBody = null;
        this.dayCycleTime = 0;
        this.dayCycleSpeed = 1;
        this.dayCycleLastUpdate = Date.now();
        this.dayCycleLastSync = 0;
        this.craftrasTimeStopped = false;
        this.weatherType = Config.craftras_world1_challenge_builder ? "rain" : "clear";
        this.weatherRainChance = WEATHER_INITIAL_RAIN_CHANCE;
        this.weatherCheckElapsed = 0;
        this.weatherRainElapsed = 0;
        this.weatherLastUpdate = Date.now();
        this.weatherLastSync = 0;
        this.scheduledWeatherChange = null;
        this.kingdomBlueprintStates = { ruined: null, intact: null };
        this.kingdomWeatherState = "ruined";
        this.kingdomWeatherTransition = null;
        this.kingdomWeatherEventId = 0;
        this.kingdomWeatherClearEventId = 0;
        this.kingdomWeatherClearNotifyUntil = 0;
        this.kingdomWeatherLastSync = 0;
        this.villageBounds = null;
        this.villageOriginalBlocks.clear();
        this.brokenKingdomBlueprintClearedKeys.clear();
        this.caveBlueprintClearedKeys.clear();
        this.permanentBlockDamageStages.clear();
        this.villageRepairJobs.clear();
        this.villageDemolitionJobs.clear();
        this.nextVillageDemolitionScanAt = 0;
        this.kingdomGhostRepairJobs.clear();
        this.nextKingdomGhostRepairScanAt = 0;
        this.villageStaticNpcMaintainCounter = 0;
        this.shopOffers = [];
        this.shopNextRefreshAt = 0;
        this.shopPriceCache.clear();
        for (const entity of [...this.popeStaffCubes, ...this.popeStaffMagicCircles, ...this.popeStaffJudgments]) entity?.destroy?.();
        this.popeStaffCubes.clear();
        this.popeStaffMagicCircles.clear();
        this.popeStaffJudgments.clear();
        this.popeStaffPendingJudgments = [];
        this.popeStaffBeamStates = [];
        for (const projectile of this.guardianSlashProjectiles) projectile?.destroy?.();
        this.guardianSlashProjectiles.clear();
        for (const entity of this.challengeMagicEntities) entity?.destroy?.();
        this.challengeMagicEntities.clear();
        for (const projectile of this.theGreatProjectiles) projectile?.destroy?.();
        this.theGreatProjectiles.clear();
        this.theGreatCompanions.clear();
        for (const warning of this.theGreatWarnings) warning?.destroy?.();
        this.theGreatWarnings.clear();
        for (const rocket of this.rocketProjectiles) rocket?.destroy?.();
        this.rocketProjectiles.clear();
        for (const bomb of this.boneBombProjectiles) bomb?.destroy?.();
        this.boneBombProjectiles.clear();
        this.arenaBuildJobs.clear();
        this.nextArenaBuildAt = Date.now() + ARENA_BUILD_INTERVAL;
        this.arenaBuildActive = false;
        this.arenaBuildScanIterator = null;
        this.arenaBuildScanActive = false;
        this.arenaBuildScanTargetCount = 0;
        this.arenaBuildRepairBudget = ARENA_BUILD_REPAIR_BUDGET_PER_TICK;
        if (this.nuclearArenaBuildTimeout) clearTimeout(this.nuclearArenaBuildTimeout);
        this.nuclearArenaBuildTimeout = null;
        this.loadVillageNpcSpawns();
        this.worldSize = Config.craftras_village_builder
            ? (Config.craftras_village_world_size || WORLD_SIZE)
            : WORLD_SIZE;
        this.gameManager.updateBounds(this.worldSize, this.worldSize);
        if (Config.craftras_village_builder && !Config.craftras_broken_kingdom_builder && !Config.craftras_intact_kingdom_builder && !Config.craftras_world1_challenge_builder && !Config.craftras_cave_builder) {
            this.destroyedWallKeys.clear();
            this.placedBlocks.clear();
            this.placedFloors.clear();
            this.placedBlockDirections.clear();
            this.furnaces.clear();
            this.chests.clear();
            this.damagedWallHealth.clear();
            this.damagedWallLastHitAt.clear();
            this.damagedWallRegenLastUpdate = Date.now();
            this.damagedFloorHealth.clear();
            const loaded = this.loadVillageBlueprint({ clearGeneratedTerrain: false });
            this.spawnPool = [];
            this.spawnPoint = blockToWorld(0, 0);
            global.craftrasSpawnProvider = () => ({ ...this.spawnPoint });
            console.log(`[Craftras Village] Loaded ${loaded.blocks} walls and ${loaded.floors} floors.`);
        } else {
            if (Config.craftras_load_village_blueprint) {
                const loaded = this.loadVillageBlueprint({
                    offsetX: Config.craftras_village_import_offset_x || 0,
                    offsetY: Config.craftras_village_import_offset_y || 0,
                    clearGeneratedTerrain: true,
                });
                console.log(`[Craftras] Imported village blueprint: ${loaded.blocks} walls, ${loaded.floors} floors, cleared ${loaded.cleared} generated cells.`);
            }
            if (Config.craftras_intact_kingdom_builder) {
                this.loadKingdomWeatherBlueprintStates();
                const intactKingdom = this.kingdomBlueprintStates?.intact;
                if (!intactKingdom || !this.applyKingdomBlueprintState("intact")) {
                    console.error("[Craftras Intact Kingdom] Intact Kingdom blueprint could not be loaded.");
                }
            } else {
                const brokenKingdom = this.loadBrokenKingdomBlueprint();
                this.loadKingdomWeatherBlueprintStates();
                if (brokenKingdom.blocks || brokenKingdom.floors || brokenKingdom.cleared || brokenKingdom.damaged) {
                    console.log(`[Craftras] Loaded Broken Kingdom blueprint: ${brokenKingdom.blocks} walls, ${brokenKingdom.floors} floors, ${brokenKingdom.cleared} cleared cells, ${brokenKingdom.damaged} permanently cracked blocks.`);
                }
            }
            const caveExcavation = this.loadCaveExcavation();
            if (caveExcavation) console.log(`[Craftras] Loaded ${caveExcavation} permanent cave excavation cell(s).`);
            const steelTorches = this.loadSteelTorchMap();
            if (steelTorches) console.log(`[Craftras] Loaded ${steelTorches} steel torch map marker(s).`);
            if (Config.craftras_world1_challenge_builder) {
                const challenge = this.loadWorld1ChallengeBlueprint();
                if (challenge.loaded) {
                    console.log(`[Craftras World 1 Challenge] Loaded independent map: ${challenge.blocks} walls, ${challenge.floors} floors, ${challenge.cleared} cleared cells, ${challenge.damaged} cracked blocks, ${challenge.stories} story markers.`);
                } else {
                    const saved = this.saveWorld1ChallengeBlueprint();
                    console.log(`[Craftras World 1 Challenge] Created initial World 1 snapshot: ${saved.blocks} walls, ${saved.floors} floors, ${saved.cleared} cleared cells, ${saved.damaged} cracked blocks.`);
                }
            }
            if (Config.craftras_world1_challenge_builder) {
                this.spawnPool = [];
                this.spawnPoint = this.getNextChallengeSpawn(false);
                global.craftrasSpawnProvider = () => this.getNextChallengeSpawn();
                this.spawnChallengeInitialCast();
            } else if (Config.craftras_broken_kingdom_builder || Config.craftras_intact_kingdom_builder || Config.craftras_cave_builder) {
                this.spawnPool = [];
                this.spawnPoint = blockToWorld(-300, -310);
                global.craftrasSpawnProvider = () => ({ ...this.spawnPoint });
            } else {
                this.spawnPool = this.buildOutsideSpawnPool();
                this.spawnPoint = this.getRandomOutsideSpawn({ avoidBrokenKingdom: true });
                global.craftrasSpawnProvider = () => this.getRandomOutsideSpawn({ avoidBrokenKingdom: true });
            }
            if (!Config.craftras_steel_torch_builder && !Config.craftras_broken_kingdom_builder && !Config.craftras_intact_kingdom_builder && !Config.craftras_world1_challenge_builder && !Config.craftras_cave_builder) this.spawnVillageNpcs();
        }
        global.spawnPoint = undefined;
        console.log(`[Craftras] Numeric block world enabled. Arena=${this.worldSize}x${this.worldSize}, wall=${WALL_SIZE}, step=${BLOCK_SIZE}, chunk=${CHUNK_SIZE}.`);
        console.log(`[Craftras] Spawn selected at (${this.spawnPoint.x.toFixed(1)}, ${this.spawnPoint.y.toFixed(1)}).`);
        this.syncDayCycle(true);
        this.syncWeather(true);
    }

    terminate() {
        for (const socket of this.gameManager.clients) socket?.talk?.("CR", 0);
        for (const socket of this.gameManager.clients) socket?.talk?.("WE", "clear", 0, WEATHER_INITIAL_RAIN_CHANCE);
        if (global.craftrasSpawnProvider) global.craftrasSpawnProvider = undefined;
        this.clientStates = new WeakMap();
        this.clearLoadedTrees();
        for (const drop of this.itemDrops) drop?.destroy?.();
        this.itemDrops.clear();
        for (const mob of this.mobs) mob?.destroy?.();
        this.mobs.clear();
        for (const egg of this.spiderEggs) egg?.destroy?.();
        this.spiderEggs.clear();
        for (const web of this.spiderWebProjectiles) web?.destroy?.();
        this.spiderWebProjectiles.clear();
        for (const web of this.spiderWebs) web?.destroy?.();
        this.spiderWebs.clear();
        for (const projectile of this.guardianSlashProjectiles) projectile?.destroy?.();
        this.guardianSlashProjectiles.clear();
        for (const entity of this.challengeMagicEntities) entity?.destroy?.();
        this.challengeMagicEntities.clear();
        for (const projectile of this.theGreatProjectiles) projectile?.destroy?.();
        this.theGreatProjectiles.clear();
        this.theGreatCompanions.clear();
        for (const effect of this.explosionEffects) effect?.destroy?.();
        this.explosionEffects.clear();
        for (const circle of this.clericHealCircles) circle?.destroy?.();
        this.clericHealCircles.clear();
        for (const rocket of this.rocketProjectiles) rocket?.destroy?.();
        this.rocketProjectiles.clear();
        for (const bomb of this.boneBombProjectiles) bomb?.destroy?.();
        this.boneBombProjectiles.clear();
        this.spawnPoint = null;
        this.spawnPool.length = 0;
        this.scheduledWeatherChange = null;
    }

    wallKey(x, y) {
        return `${x},${y}`;
    }

    chunkKey(x, y) {
        return `${x},${y}`;
    }

    isInsideVillageNatureClearZone(x, y, radius = VILLAGE_NATURE_CLEAR_RADIUS) {
        const bounds = this.villageBounds;
        if (!bounds) return false;
        return x >= bounds.minX - radius
            && x <= bounds.maxX + radius
            && y >= bounds.minY - radius
            && y <= bounds.maxY + radius;
    }

    isInsideVillageGuardZone(entityOrX, y = null) {
        const block = typeof entityOrX === "object"
            ? worldToBlock(entityOrX.x, entityOrX.y)
            : { x: entityOrX, y };
        return this.isInsideVillageNatureClearZone(block.x, block.y, VILLAGE_GUARD_ZONE_PADDING);
    }

    loadVillageBlueprint(options = {}) {
        if (!fs.existsSync(VILLAGE_BLUEPRINT_FILE)) return { blocks: 0, floors: 0, cleared: 0 };
        try {
            const data = JSON.parse(fs.readFileSync(VILLAGE_BLUEPRINT_FILE, "utf8"));
            const validBlocks = new Set(Object.values(BLOCKS));
            const offsetX = Math.trunc(Number(options.offsetX) || 0);
            const offsetY = Math.trunc(Number(options.offsetY) || 0);
            let blocks = 0;
            let floors = 0;
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            const noteBounds = (x, y) => {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            };
            for (const entry of Array.isArray(data.blocks) ? data.blocks : []) {
                const x = Math.trunc(Number(entry.x)) + offsetX;
                const y = Math.trunc(Number(entry.y)) + offsetY;
                if (!Number.isFinite(x) || !Number.isFinite(y) || !validBlocks.has(entry.type) || entry.type === BLOCKS.AIR) continue;
                const key = this.wallKey(x, y);
                const direction = Math.max(0, Math.min(3, Math.trunc(Number(entry.direction) || 0)));
                this.placedBlocks.set(key, entry.type);
                this.placedBlockDirections.set(key, direction);
                this.villageOriginalBlocks.set(key, { x, y, type: entry.type, direction });
                if (entry.type === BLOCKS.FURNACE) this.furnaces.set(key, { slots: [null, null, null], active: false, finishAt: 0 });
                if (entry.type === BLOCKS.CHEST) this.chests.set(key, { slots: Array(27).fill(null) });
                noteBounds(x, y);
                blocks++;
            }
            for (const entry of Array.isArray(data.floors) ? data.floors : []) {
                const x = Math.trunc(Number(entry.x)) + offsetX;
                const y = Math.trunc(Number(entry.y)) + offsetY;
                if (!Number.isFinite(x) || !Number.isFinite(y) || !validBlocks.has(entry.type) || entry.type === BLOCKS.AIR) continue;
                this.placedFloors.set(this.wallKey(x, y), entry.type);
                noteBounds(x, y);
                floors++;
            }
            let cleared = 0;
            if (Number.isFinite(minX)) this.villageBounds = { minX, minY, maxX, maxY };
            if (options.clearGeneratedTerrain && Number.isFinite(minX)) {
                for (let y = minY - 1; y <= maxY + 1; y++) {
                    for (let x = minX - 1; x <= maxX + 1; x++) {
                        const key = this.wallKey(x, y);
                        if (this.placedBlocks.has(key)) continue;
                        this.destroyedWallKeys.add(key);
                        this.damagedWallHealth.delete(key);
                        this.damagedWallLastHitAt.delete(key);
                        cleared++;
                    }
                }
            }
            return { blocks, floors, cleared };
        } catch (error) {
            console.error(`[Craftras Village] Could not load blueprint: ${error.message}`);
            return { blocks: 0, floors: 0, cleared: 0 };
        }
    }

    saveVillageBlueprint() {
        if (!Config.craftras_village_builder) throw new Error("Village blueprints can only be saved in Village Builder.");
        const parseKey = key => key.split(",").map(Number);
        const blocks = [...this.placedBlocks].map(([key, type]) => {
            const [x, y] = parseKey(key);
            return { x, y, type, direction: this.placedBlockDirections.get(key) ?? 0 };
        }).sort((a, b) => a.y - b.y || a.x - b.x);
        const floors = [...this.placedFloors].map(([key, type]) => {
            const [x, y] = parseKey(key);
            return { x, y, type };
        }).sort((a, b) => a.y - b.y || a.x - b.x);
        const data = {
            version: 1,
            blockSize: BLOCK_SIZE,
            savedAt: new Date().toISOString(),
            blocks,
            floors,
        };
        fs.mkdirSync(path.dirname(VILLAGE_BLUEPRINT_FILE), { recursive: true });
        const temporaryFile = `${VILLAGE_BLUEPRINT_FILE}.tmp`;
        fs.writeFileSync(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
        fs.renameSync(temporaryFile, VILLAGE_BLUEPRINT_FILE);
        return { blocks: blocks.length, floors: floors.length, file: VILLAGE_BLUEPRINT_FILE };
    }

    readKingdomBlueprintState(file) {
        if (!fs.existsSync(file)) return null;
        try {
            const data = JSON.parse(fs.readFileSync(file, "utf8"));
            const validBlocks = new Set(Object.values(BLOCKS));
            const blocks = new Map();
            const floors = new Map();
            const cleared = new Set();
            const damageStages = new Map();
            for (const entry of Array.isArray(data.blocks) ? data.blocks : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                if (!Number.isFinite(x) || !Number.isFinite(y) || !isBrokenKingdomSurfaceCell(x, y) || !validBlocks.has(entry?.type) || entry.type === BLOCKS.AIR) continue;
                blocks.set(this.wallKey(x, y), {
                    x,
                    y,
                    type: entry.type,
                    direction: Math.max(0, Math.min(3, Math.trunc(Number(entry.direction) || 0))),
                });
            }
            for (const entry of Array.isArray(data.floors) ? data.floors : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                if (!Number.isFinite(x) || !Number.isFinite(y) || !isBrokenKingdomSurfaceCell(x, y) || !validBlocks.has(entry?.type) || entry.type === BLOCKS.AIR) continue;
                floors.set(this.wallKey(x, y), { x, y, type: entry.type });
            }
            for (const entry of Array.isArray(data.cleared) ? data.cleared : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                if (!Number.isFinite(x) || !Number.isFinite(y) || !isBrokenKingdomSurfaceCell(x, y)) continue;
                cleared.add(this.wallKey(x, y));
            }
            for (const entry of Array.isArray(data.damageStages) ? data.damageStages : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                const stage = Math.trunc(Number(entry?.stage));
                if (!Number.isFinite(x) || !Number.isFinite(y) || !isBrokenKingdomSurfaceCell(x, y) || stage < 1 || stage > 3) continue;
                damageStages.set(this.wallKey(x, y), stage);
            }
            return { blocks, floors, cleared, damageStages };
        } catch (error) {
            console.error(`[Craftras Kingdom Weather] Could not read ${path.basename(file)}: ${error.message}`);
            return null;
        }
    }

    loadKingdomWeatherBlueprintStates() {
        this.kingdomBlueprintStates = {
            ruined: this.readKingdomBlueprintState(BROKEN_KINGDOM_BLUEPRINT_FILE),
            intact: this.readKingdomBlueprintState(ROYAL_KINGDOM_INTACT_BLUEPRINT_FILE),
        };
        this.kingdomWeatherState = "ruined";
        this.kingdomWeatherTransition = null;
        return !!this.kingdomBlueprintStates.ruined && !!this.kingdomBlueprintStates.intact;
    }

    loadBrokenKingdomBlueprint() {
        if (!fs.existsSync(BROKEN_KINGDOM_BLUEPRINT_FILE)) return { blocks: 0, floors: 0, cleared: 0, damaged: 0 };
        try {
            const data = JSON.parse(fs.readFileSync(BROKEN_KINGDOM_BLUEPRINT_FILE, "utf8"));
            const validBlocks = new Set(Object.values(BLOCKS));
            let blocks = 0;
            let floors = 0;
            let cleared = 0;
            let damaged = 0;
            for (const entry of Array.isArray(data.cleared) ? data.cleared : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                if (!Number.isFinite(x) || !Number.isFinite(y) || !isBrokenKingdomSurfaceCell(x, y)) continue;
                const key = this.wallKey(x, y);
                this.destroyedWallKeys.add(key);
                this.brokenKingdomBlueprintClearedKeys.add(key);
                this.damagedWallHealth.delete(key);
                this.damagedWallLastHitAt.delete(key);
                cleared++;
            }
            for (const entry of Array.isArray(data.blocks) ? data.blocks : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                if (!Number.isFinite(x) || !Number.isFinite(y) || !isBrokenKingdomSurfaceCell(x, y) || !validBlocks.has(entry?.type) || entry.type === BLOCKS.AIR) continue;
                const key = this.wallKey(x, y);
                const direction = Math.max(0, Math.min(3, Math.trunc(Number(entry.direction) || 0)));
                this.destroyedWallKeys.delete(key);
                this.brokenKingdomBlueprintClearedKeys.delete(key);
                this.placedBlocks.set(key, entry.type);
                this.placedBlockDirections.set(key, direction);
                if (entry.type === BLOCKS.FURNACE) this.furnaces.set(key, { slots: [null, null, null], active: false, finishAt: 0 });
                if (entry.type === BLOCKS.CHEST) this.chests.set(key, { slots: Array(27).fill(null) });
                blocks++;
            }
            for (const entry of Array.isArray(data.floors) ? data.floors : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                if (!Number.isFinite(x) || !Number.isFinite(y) || !isBrokenKingdomSurfaceCell(x, y) || !validBlocks.has(entry?.type) || entry.type === BLOCKS.AIR) continue;
                this.placedFloors.set(this.wallKey(x, y), entry.type);
                floors++;
            }
            for (const entry of Array.isArray(data.damageStages) ? data.damageStages : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                const stage = Math.trunc(Number(entry?.stage));
                if (!Number.isFinite(x) || !Number.isFinite(y) || !isBrokenKingdomSurfaceCell(x, y) || stage < 1 || stage > 3) continue;
                this.permanentBlockDamageStages.set(this.wallKey(x, y), stage);
                damaged++;
            }
            return { blocks, floors, cleared, damaged };
        } catch (error) {
            console.error(`[Craftras Broken Kingdom] Could not load blueprint: ${error.message}`);
            return { blocks: 0, floors: 0, cleared: 0, damaged: 0 };
        }
    }

    saveBrokenKingdomBlueprint() {
        if (!Config.craftras_broken_kingdom_builder) throw new Error("Broken Kingdom blueprints can only be saved in Broken Kingdom Builder.");
        const parseKey = key => key.split(",").map(Number);
        const inKingdom = key => {
            const [x, y] = parseKey(key);
            return Number.isInteger(x) && Number.isInteger(y) && isBrokenKingdomSurfaceCell(x, y);
        };
        const blocks = [...this.placedBlocks]
            .filter(([key]) => inKingdom(key))
            .map(([key, type]) => {
                const [x, y] = parseKey(key);
                return { x, y, type, direction: this.placedBlockDirections.get(key) ?? 0 };
            })
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const floors = [...this.placedFloors]
            .filter(([key]) => inKingdom(key))
            .map(([key, type]) => {
                const [x, y] = parseKey(key);
                return { x, y, type };
            })
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const cleared = [...this.destroyedWallKeys]
            .filter(key => inKingdom(key) && !this.placedBlocks.has(key))
            .map(key => {
                const [x, y] = parseKey(key);
                return { x, y };
            })
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const damageStages = [...this.permanentBlockDamageStages]
            .filter(([key, stage]) => inKingdom(key) && stage >= 1 && stage <= 3)
            .map(([key, stage]) => {
                const [x, y] = parseKey(key);
                return { x, y, stage };
            })
            .filter(entry => this.getBlock(entry.x, entry.y) !== BLOCKS.AIR)
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const data = {
            version: 1,
            blockSize: BLOCK_SIZE,
            savedAt: new Date().toISOString(),
            blocks,
            floors,
            cleared,
            damageStages,
        };
        fs.mkdirSync(path.dirname(BROKEN_KINGDOM_BLUEPRINT_FILE), { recursive: true });
        const temporaryFile = `${BROKEN_KINGDOM_BLUEPRINT_FILE}.tmp`;
        fs.writeFileSync(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
        fs.renameSync(temporaryFile, BROKEN_KINGDOM_BLUEPRINT_FILE);
        this.brokenKingdomBlueprintClearedKeys = new Set(cleared.map(entry => this.wallKey(entry.x, entry.y)));
        this.permanentBlockDamageStages = new Map(damageStages.map(entry => [this.wallKey(entry.x, entry.y), entry.stage]));
        return { blocks: blocks.length, floors: floors.length, cleared: cleared.length, damaged: damageStages.length, file: BROKEN_KINGDOM_BLUEPRINT_FILE };
    }

    saveIntactKingdomBlueprint() {
        if (!Config.craftras_intact_kingdom_builder) throw new Error("Intact Kingdom blueprints can only be saved in Intact Kingdom Builder.");
        const parseKey = key => key.split(",").map(Number);
        const inKingdom = key => {
            const [x, y] = parseKey(key);
            return Number.isInteger(x) && Number.isInteger(y) && isBrokenKingdomSurfaceCell(x, y);
        };
        const blocks = [...this.placedBlocks]
            .filter(([key]) => inKingdom(key))
            .map(([key, type]) => {
                const [x, y] = parseKey(key);
                return { x, y, type, direction: this.placedBlockDirections.get(key) ?? 0 };
            })
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const floors = [...this.placedFloors]
            .filter(([key]) => inKingdom(key))
            .map(([key, type]) => {
                const [x, y] = parseKey(key);
                return { x, y, type };
            })
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const cleared = [...this.destroyedWallKeys]
            .filter(key => inKingdom(key) && !this.placedBlocks.has(key))
            .map(key => {
                const [x, y] = parseKey(key);
                return { x, y };
            })
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const damageStages = [...this.permanentBlockDamageStages]
            .filter(([key, stage]) => inKingdom(key) && stage >= 1 && stage <= 3)
            .map(([key, stage]) => {
                const [x, y] = parseKey(key);
                return { x, y, stage };
            })
            .filter(entry => this.getBlock(entry.x, entry.y) !== BLOCKS.AIR)
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const data = {
            version: 1,
            blockSize: BLOCK_SIZE,
            savedAt: new Date().toISOString(),
            blocks,
            floors,
            cleared,
            damageStages,
        };
        fs.mkdirSync(path.dirname(ROYAL_KINGDOM_INTACT_BLUEPRINT_FILE), { recursive: true });
        const temporaryFile = `${ROYAL_KINGDOM_INTACT_BLUEPRINT_FILE}.tmp`;
        fs.writeFileSync(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
        fs.renameSync(temporaryFile, ROYAL_KINGDOM_INTACT_BLUEPRINT_FILE);
        this.kingdomBlueprintStates.intact = this.readKingdomBlueprintState(ROYAL_KINGDOM_INTACT_BLUEPRINT_FILE);
        return { blocks: blocks.length, floors: floors.length, cleared: cleared.length, damaged: damageStages.length, file: ROYAL_KINGDOM_INTACT_BLUEPRINT_FILE };
    }

    loadWorld1ChallengeBlueprint() {
        if (!fs.existsSync(WORLD1_CHALLENGE_BLUEPRINT_FILE)) return { loaded: false, blocks: 0, floors: 0, cleared: 0, damaged: 0, stories: 0 };
        try {
            const data = JSON.parse(fs.readFileSync(WORLD1_CHALLENGE_BLUEPRINT_FILE, "utf8"));
            const validBlocks = new Set(Object.values(BLOCKS));
            const validCell = (x, y) => Number.isInteger(x) && Number.isInteger(y)
                && Math.abs(x) <= Math.ceil(BLOCKS_X / 2) && Math.abs(y) <= Math.ceil(BLOCKS_Y / 2);
            this.destroyedWallKeys.clear();
            this.placedBlocks.clear();
            this.placedFloors.clear();
            this.textStoryMarkers.clear();
            this.placedBlockDirections.clear();
            this.furnaces.clear();
            this.chests.clear();
            this.damagedWallHealth.clear();
            this.damagedWallLastHitAt.clear();
            this.damagedFloorHealth.clear();
            this.permanentBlockDamageStages.clear();
            let blocks = 0;
            let floors = 0;
            let cleared = 0;
            let damaged = 0;
            const loadedStoryKeys = new Set();
            const loadStoryMarker = entry => {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                const index = Math.trunc(Number(entry?.index ?? getTextStoryIndex(entry?.type)));
                const key = this.wallKey(x, y);
                if (!validCell(x, y) || index < 1 || index > TEXT_STORY_BLOCK_MAX || loadedStoryKeys.has(key)) return false;
                loadedStoryKeys.add(key);
                this.textStoryMarkers.set(key, index);
                return true;
            };
            for (const entry of Array.isArray(data.storyMarkers) ? data.storyMarkers : []) loadStoryMarker(entry);
            for (const entry of Array.isArray(data.cleared) ? data.cleared : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                if (!validCell(x, y)) continue;
                this.destroyedWallKeys.add(this.wallKey(x, y));
                cleared++;
            }
            for (const entry of Array.isArray(data.blocks) ? data.blocks : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                const storyIndex = getTextStoryIndex(entry?.type);
                if (!validCell(x, y) || (!validBlocks.has(entry?.type) && !storyIndex) || entry.type === BLOCKS.AIR) continue;
                if (storyIndex) {
                    loadStoryMarker({ x, y, index: storyIndex });
                    continue;
                }
                const key = this.wallKey(x, y);
                const direction = Math.max(0, Math.min(3, Math.trunc(Number(entry.direction) || 0)));
                this.destroyedWallKeys.delete(key);
                this.placedBlocks.set(key, entry.type);
                this.placedBlockDirections.set(key, direction);
                if (entry.type === BLOCKS.FURNACE) this.furnaces.set(key, { slots: [null, null, null], active: false, finishAt: 0 });
                if (entry.type === BLOCKS.CHEST) this.chests.set(key, { slots: Array(27).fill(null) });
                blocks++;
            }
            for (const entry of Array.isArray(data.floors) ? data.floors : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                if (!validCell(x, y) || !validBlocks.has(entry?.type) || entry.type === BLOCKS.AIR) continue;
                this.placedFloors.set(this.wallKey(x, y), entry.type);
                floors++;
            }
            for (const entry of Array.isArray(data.damageStages) ? data.damageStages : []) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                const stage = Math.trunc(Number(entry?.stage));
                if (!validCell(x, y) || stage < 1 || stage > 3) continue;
                const key = this.wallKey(x, y);
                if (!this.placedBlocks.has(key) && this.getBlock(x, y) === BLOCKS.AIR) continue;
                this.permanentBlockDamageStages.set(key, stage);
                damaged++;
            }
            this.textStoryMarkerRevision++;
            return { loaded: true, blocks, floors, cleared, damaged, stories: this.textStoryMarkers.size, file: WORLD1_CHALLENGE_BLUEPRINT_FILE };
        } catch (error) {
            console.error(`[Craftras World 1 Challenge] Could not load blueprint: ${error.message}`);
            return { loaded: false, blocks: 0, floors: 0, cleared: 0, damaged: 0, stories: 0 };
        }
    }

    saveWorld1ChallengeBlueprint() {
        if (!Config.craftras_world1_challenge_builder) throw new Error("World 1 Challenge can only be saved in its builder server.");
        const parseKey = key => key.split(",").map(Number);
        const validKey = key => {
            const [x, y] = parseKey(key);
            return Number.isInteger(x) && Number.isInteger(y)
                && Math.abs(x) <= Math.ceil(BLOCKS_X / 2) && Math.abs(y) <= Math.ceil(BLOCKS_Y / 2);
        };
        const blocks = [...this.placedBlocks]
            .filter(([key, type]) => validKey(key) && type !== BLOCKS.AIR && !isTextStoryBlock(type))
            .map(([key, type]) => {
                const [x, y] = parseKey(key);
                return { x, y, type, direction: this.placedBlockDirections.get(key) ?? 0 };
            })
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const floors = [...this.placedFloors]
            .filter(([key, type]) => validKey(key) && type !== BLOCKS.AIR)
            .map(([key, type]) => {
                const [x, y] = parseKey(key);
                return { x, y, type };
            })
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const cleared = [...this.destroyedWallKeys]
            .filter(key => validKey(key) && !this.placedBlocks.has(key))
            .map(key => {
                const [x, y] = parseKey(key);
                return { x, y };
            })
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const damageStages = [...this.permanentBlockDamageStages]
            .filter(([key, stage]) => validKey(key) && stage >= 1 && stage <= 3)
            .map(([key, stage]) => {
                const [x, y] = parseKey(key);
                return { x, y, stage };
            })
            .filter(entry => this.getBlock(entry.x, entry.y) !== BLOCKS.AIR)
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const storyMarkers = [...this.textStoryMarkers]
            .filter(([key, index]) => validKey(key) && Number.isInteger(index) && index >= 1 && index <= TEXT_STORY_BLOCK_MAX)
            .map(([key, index]) => {
                const [x, y] = parseKey(key);
                return { x, y, index };
            })
            .sort((a, b) => a.index - b.index);
        const data = {
            version: 2,
            blockSize: BLOCK_SIZE,
            worldSize: this.worldSize,
            savedAt: new Date().toISOString(),
            blocks,
            floors,
            cleared,
            damageStages,
            storyMarkers,
        };
        fs.mkdirSync(path.dirname(WORLD1_CHALLENGE_BLUEPRINT_FILE), { recursive: true });
        const temporaryFile = `${WORLD1_CHALLENGE_BLUEPRINT_FILE}.tmp`;
        if (fs.existsSync(WORLD1_CHALLENGE_BLUEPRINT_FILE)) {
            fs.copyFileSync(WORLD1_CHALLENGE_BLUEPRINT_FILE, WORLD1_CHALLENGE_BLUEPRINT_BACKUP_FILE);
        }
        fs.writeFileSync(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
        fs.renameSync(temporaryFile, WORLD1_CHALLENGE_BLUEPRINT_FILE);
        return { blocks: blocks.length, floors: floors.length, cleared: cleared.length, damaged: damageStages.length, stories: storyMarkers.length, file: WORLD1_CHALLENGE_BLUEPRINT_FILE };
    }

    loadCaveExcavation() {
        if (!fs.existsSync(CAVE_EXCAVATION_FILE)) return 0;
        try {
            const data = JSON.parse(fs.readFileSync(CAVE_EXCAVATION_FILE, "utf8"));
            const cleared = Array.isArray(data) ? data : data.cleared;
            if (!Array.isArray(cleared)) return 0;
            let loaded = 0;
            for (const entry of cleared) {
                const x = Math.trunc(Number(entry?.x));
                const y = Math.trunc(Number(entry?.y));
                if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
                const key = this.wallKey(x, y);
                this.destroyedWallKeys.add(key);
                this.caveBlueprintClearedKeys.add(key);
                this.damagedWallHealth.delete(key);
                this.damagedWallLastHitAt.delete(key);
                loaded++;
            }
            return loaded;
        } catch (error) {
            console.error(`[Craftras Cave Builder] Could not load excavation: ${error.message}`);
            return 0;
        }
    }

    saveCaveExcavation() {
        if (!Config.craftras_cave_builder) throw new Error("Cave excavations can only be saved in Cave Builder.");
        const cleared = [...this.destroyedWallKeys]
            .filter(key => !this.brokenKingdomBlueprintClearedKeys.has(key) && !this.placedBlocks.has(key))
            .map(key => {
                const [x, y] = key.split(",").map(Number);
                return { x, y };
            })
            .filter(entry => Number.isInteger(entry.x) && Number.isInteger(entry.y) && (this.getCell(entry.x, entry.y)?.block ?? BLOCKS.AIR) !== BLOCKS.AIR)
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const data = {
            version: 1,
            blockSize: BLOCK_SIZE,
            savedAt: new Date().toISOString(),
            cleared,
        };
        fs.mkdirSync(path.dirname(CAVE_EXCAVATION_FILE), { recursive: true });
        const temporaryFile = `${CAVE_EXCAVATION_FILE}.tmp`;
        fs.writeFileSync(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
        fs.renameSync(temporaryFile, CAVE_EXCAVATION_FILE);
        this.caveBlueprintClearedKeys = new Set(cleared.map(entry => this.wallKey(entry.x, entry.y)));
        return { cleared: cleared.length, file: CAVE_EXCAVATION_FILE };
    }

    isPermanentBlueprintClear(key) {
        return this.brokenKingdomBlueprintClearedKeys.has(key) || this.caveBlueprintClearedKeys.has(key);
    }

    saveSteelTorchMap() {
        if (!Config.craftras_steel_torch_builder) throw new Error("Steel torch maps can only be saved in Steel Torch Builder.");
        const torches = [...this.placedBlocks]
            .filter(([, type]) => type === BLOCKS.STEEL_TORCH)
            .map(([key]) => {
                const [x, y] = key.split(",").map(Number);
                return { x, y };
            })
            .filter(entry => Number.isInteger(entry.x) && Number.isInteger(entry.y))
            .sort((a, b) => a.y - b.y || a.x - b.x);
        const data = {
            savedAt: new Date().toISOString(),
            block: "steel_torch",
            torches,
        };
        fs.mkdirSync(path.dirname(STEEL_TORCH_MAP_FILE), { recursive: true });
        const temporaryFile = `${STEEL_TORCH_MAP_FILE}.tmp`;
        fs.writeFileSync(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
        fs.renameSync(temporaryFile, STEEL_TORCH_MAP_FILE);
        return { torches: torches.length, file: STEEL_TORCH_MAP_FILE };
    }

    loadSteelTorchMap() {
        if (!fs.existsSync(STEEL_TORCH_MAP_FILE)) return 0;
        try {
            const data = JSON.parse(fs.readFileSync(STEEL_TORCH_MAP_FILE, "utf8"));
            const torches = Array.isArray(data) ? data : data.torches;
            if (!Array.isArray(torches)) return 0;
            let loaded = 0;
            for (const entry of torches) {
                const x = Number(entry?.x);
                const y = Number(entry?.y);
                if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
                const key = this.wallKey(x, y);
                this.destroyedWallKeys.delete(key);
                this.damagedWallHealth.delete(key);
                this.damagedWallLastHitAt.delete(key);
                this.placedBlocks.set(key, BLOCKS.STEEL_TORCH);
                this.placedBlockDirections.set(key, 0);
                loaded++;
            }
            return loaded;
        } catch (error) {
            console.error(`[Craftras] Could not load steel torch map: ${error.message}`);
            return 0;
        }
    }

    updateDayCycle(now = Date.now()) {
        const elapsed = Math.max(0, now - this.dayCycleLastUpdate);
        this.dayCycleLastUpdate = now;
        this.dayCycleTime = (this.dayCycleTime + elapsed * this.dayCycleSpeed) % DAY_CYCLE_DURATION;
        if (now - this.dayCycleLastSync >= 1000) this.syncDayCycle();
    }

    getDayPhase() {
        return DAY_PHASES[Math.floor(this.dayCycleTime / DAY_PHASE_DURATION) % DAY_PHASES.length];
    }

    setDayCycleSpeed(speed) {
        this.updateDayCycle();
        this.dayCycleSpeed = Math.max(0.1, Math.min(1000, speed));
        this.syncDayCycle(true);
        return this.dayCycleSpeed;
    }

    setTimeStopped(stopped) {
        const now = Date.now();
        const nextStopped = !!stopped;
        const transition = this.kingdomWeatherTransition;
        if (transition) {
            if (nextStopped && !transition.pausedAt) transition.pausedAt = now;
            else if (!nextStopped && transition.pausedAt) {
                const pausedDuration = now - transition.pausedAt;
                transition.startedAt += pausedDuration;
                transition.swapAt += pausedDuration;
                transition.endsAt += pausedDuration;
                transition.pausedAt = 0;
            }
        }
        this.craftrasTimeStopped = nextStopped;
        this.dayCycleLastUpdate = now;
        this.weatherLastUpdate = now;
        this.syncKingdomWeatherTransition(true);
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.()) continue;
            mob.velocity.x = 0;
            mob.velocity.y = 0;
            mob.craftrasControl = {
                goal: { x: mob.x, y: mob.y },
                target: { x: Math.cos(mob.facing || 0), y: Math.sin(mob.facing || 0) },
                fire: false,
                power: 0,
            };
        }
        return this.craftrasTimeStopped;
    }

    syncDayCycle(force = false) {
        const now = Date.now();
        if (!force && now - this.dayCycleLastSync < 1000) return;
        this.dayCycleLastSync = now;
        for (const socket of this.gameManager.clients) socket?.talk?.("DY", Math.round(this.dayCycleTime), this.dayCycleSpeed);
    }

    isWeatherEnabled() {
        if (Config.craftras_world1_challenge_builder) return true;
        return !!Config.craftras
            && !Config.craftras_village_builder
            && !Config.craftras_steel_torch_builder
            && !Config.craftras_broken_kingdom_builder
            && !Config.craftras_intact_kingdom_builder
            && !Config.craftras_cave_builder;
    }

    getWeatherRemaining() {
        return this.weatherType === "rain"
            ? Math.max(0, WEATHER_RAIN_DURATION - this.weatherRainElapsed)
            : Math.max(0, WEATHER_CHECK_INTERVAL - this.weatherCheckElapsed);
    }

    syncWeather(force = false) {
        const now = Date.now();
        if (!force && now - this.weatherLastSync < 1000) return;
        this.weatherLastSync = now;
        const type = this.isWeatherEnabled() ? this.weatherType : "clear";
        const remaining = type === "rain" ? this.getWeatherRemaining() : Math.max(0, WEATHER_CHECK_INTERVAL - this.weatherCheckElapsed);
        for (const socket of this.gameManager.clients) {
            socket?.talk?.("WE", type, Math.round(remaining), Number(this.weatherRainChance.toFixed(2)));
        }
        this.notifyKingdomFogPlayers();
        this.syncKingdomWeatherTransition(force);
    }

    setWeather(type, { forced = true } = {}) {
        const normalized = String(type || "").trim().toLowerCase();
        if (!this.isWeatherEnabled()) return { ok: false, reason: "server" };
        if (normalized !== "rain" && normalized !== "clear") return { ok: false, reason: "type" };
        if (Config.craftras_world1_challenge_builder) {
            if (normalized !== "rain" && this.challengeStage !== "completed") return { ok: false, reason: "locked" };
            this.weatherType = normalized;
            this.weatherRainElapsed = 0;
            this.weatherCheckElapsed = 0;
            this.weatherLastUpdate = Date.now();
            this.scheduledWeatherChange = null;
            this.syncWeather(true);
            return { ok: true, type: normalized, forced, duration: normalized === "rain" ? WEATHER_RAIN_DURATION : 0, nextCheck: 0 };
        }
        const previousType = this.weatherType;
        this.weatherType = normalized;
        this.weatherRainElapsed = 0;
        this.weatherCheckElapsed = 0;
        this.weatherRainChance = WEATHER_INITIAL_RAIN_CHANCE;
        this.weatherLastUpdate = Date.now();
        if (normalized === "rain") {
            this.kingdomWeatherEventId++;
            this.beginKingdomWeatherTransition("intact");
        } else {
            if (previousType === "rain") {
                this.kingdomWeatherClearEventId++;
                this.kingdomWeatherClearNotifyUntil = Date.now() + KINGDOM_WEATHER_TRANSITION_DURATION;
            }
            this.beginKingdomWeatherTransition("ruined");
        }
        this.syncWeather(true);
        return {
            ok: true,
            type: this.weatherType,
            forced,
            duration: this.weatherType === "rain" ? WEATHER_RAIN_DURATION : 0,
            nextCheck: this.weatherType === "clear" ? WEATHER_CHECK_INTERVAL : 0,
        };
    }

    scheduleWeather(type, delaySeconds = 0) {
        const normalized = String(type || "").trim().toLowerCase();
        const seconds = Number(delaySeconds);
        if (!this.isWeatherEnabled()) return { ok: false, reason: "server" };
        if (normalized !== "rain" && normalized !== "clear") return { ok: false, reason: "type" };
        if (!Number.isFinite(seconds) || seconds < 0 || seconds > 604_800) return { ok: false, reason: "delay" };
        if (Config.craftras_world1_challenge_builder) {
            if (normalized !== "rain" || seconds !== 0) return { ok: false, reason: "locked" };
            return this.setWeather("rain");
        }
        if (seconds === 0) {
            this.scheduledWeatherChange = null;
            return this.setWeather(normalized);
        }
        this.scheduledWeatherChange = {
            type: normalized,
            remaining: seconds * 1000,
        };
        return { ok: true, type: normalized, scheduled: true, delaySeconds: seconds };
    }

    updateWeather(now = Date.now()) {
        if (!this.isWeatherEnabled()) {
            this.weatherLastUpdate = now;
            this.syncWeather();
            return;
        }
        if (Config.craftras_world1_challenge_builder) {
            this.weatherLastUpdate = now;
            this.weatherType = this.challengeStage === "completed" ? "clear" : "rain";
            this.weatherRainElapsed = 0;
            this.weatherCheckElapsed = 0;
            this.scheduledWeatherChange = null;
            this.syncWeather();
            return;
        }
        const realElapsed = Math.max(0, now - this.weatherLastUpdate);
        const elapsed = realElapsed * Math.max(0.1, this.dayCycleSpeed || 1);
        this.weatherLastUpdate = now;
        if (this.scheduledWeatherChange) {
            this.scheduledWeatherChange.remaining -= realElapsed;
            if (this.scheduledWeatherChange.remaining <= 0) {
                const scheduledType = this.scheduledWeatherChange.type;
                this.scheduledWeatherChange = null;
                const result = this.setWeather(scheduledType);
                if (result.ok) {
                    const message = scheduledType === "rain" ? "Rain is beginning." : "The sky is clearing.";
                    for (const socket of this.gameManager.clients) socket?.talk?.("BM", Config.popup_message_duration, message);
                }
                return;
            }
        }
        if (this.weatherType === "rain") {
            this.weatherRainElapsed += elapsed;
            if (this.weatherRainElapsed >= WEATHER_RAIN_DURATION) {
                this.setWeather("clear", { forced: false });
                return;
            }
            this.syncWeather();
            return;
        }
        this.weatherCheckElapsed += elapsed;
        while (this.weatherCheckElapsed >= WEATHER_CHECK_INTERVAL && this.weatherType === "clear") {
            this.weatherCheckElapsed -= WEATHER_CHECK_INTERVAL;
            if (Math.random() < this.weatherRainChance) {
                this.setWeather("rain", { forced: false });
                return;
            }
            this.weatherRainChance = Math.min(1, this.weatherRainChance + WEATHER_RAIN_CHANCE_STEP);
        }
        this.syncWeather();
    }

    notifyKingdomFogPlayers() {
        if (Config.craftras_world1_challenge_builder) return;
        const raining = this.weatherType === "rain";
        const eventId = raining ? this.kingdomWeatherEventId : this.kingdomWeatherClearEventId;
        if (!eventId || (!raining && Date.now() > this.kingdomWeatherClearNotifyUntil)) return;
        const socketEventKey = raining ? "craftrasKingdomFogEventId" : "craftrasKingdomFogClearEventId";
        const message = raining
            ? "A thick fog begins to cover the kingdom."
            : "The thick fog begins to fade away...";
        for (const socket of this.gameManager.clients) {
            const body = socket?.player?.body;
            if (!body || body.isDead?.() || body.craftrasSpectator) continue;
            const block = worldToBlock(body.x, body.y);
            if (!isBrokenKingdomSurfaceCell(block.x, block.y)) continue;
            if (socket[socketEventKey] === eventId) continue;
            socket[socketEventKey] = eventId;
            socket.talk("BM", 7_000, message);
        }
    }

    beginKingdomWeatherTransition(target, now = Date.now()) {
        if (!this.isWeatherEnabled() || !this.kingdomBlueprintStates?.[target]) return false;
        if (this.kingdomWeatherTransition?.target === target) return true;
        if (this.kingdomWeatherState === target) {
            this.kingdomWeatherTransition = null;
            this.syncKingdomWeatherTransition(true);
            return true;
        }
        this.kingdomWeatherTransition = {
            target,
            startedAt: now,
            swapAt: now + KINGDOM_WEATHER_SWAP_DELAY,
            endsAt: now + KINGDOM_WEATHER_TRANSITION_DURATION,
            swapped: false,
            pausedAt: 0,
        };
        this.syncKingdomWeatherTransition(true);
        return true;
    }

    syncKingdomWeatherTransition(force = false) {
        const now = Date.now();
        if (!force && now - this.kingdomWeatherLastSync < 1000) return;
        this.kingdomWeatherLastSync = now;
        const transition = this.kingdomWeatherTransition;
        const elapsedAt = transition ? (transition.pausedAt || now) : now;
        const elapsed = transition ? Math.max(0, Math.min(KINGDOM_WEATHER_TRANSITION_DURATION, elapsedAt - transition.startedAt)) : 0;
        for (const socket of this.gameManager.clients) {
            socket?.talk?.(
                "KW",
                this.kingdomWeatherState,
                transition?.target || "",
                KINGDOM_WEATHER_TRANSITION_DURATION,
                Math.round(elapsed),
                transition?.pausedAt ? 1 : 0,
            );
        }
    }

    updateKingdomWeatherTransition(now = Date.now()) {
        const transition = this.kingdomWeatherTransition;
        if (!transition || transition.pausedAt) return;
        if (!transition.swapped && now >= transition.swapAt) {
            this.applyKingdomBlueprintState(transition.target);
            transition.swapped = true;
            this.syncKingdomWeatherTransition(true);
        }
        if (now >= transition.endsAt) {
            if (!transition.swapped) this.applyKingdomBlueprintState(transition.target);
            this.kingdomWeatherTransition = null;
            this.syncKingdomWeatherTransition(true);
            return;
        }
        this.syncKingdomWeatherTransition();
    }

    chunkTouchesBrokenKingdom(chunkX, chunkY) {
        for (let localY = 0; localY < CHUNK_SIZE; localY++) {
            for (let localX = 0; localX < CHUNK_SIZE; localX++) {
                if (isBrokenKingdomSurfaceCell(chunkX * CHUNK_SIZE + localX, chunkY * CHUNK_SIZE + localY)) return true;
            }
        }
        return false;
    }

    refreshLoadedKingdomChunks() {
        for (const socket of this.gameManager.clients) {
            const state = this.clientStates.get(socket);
            if (!state?.chunks) continue;
            for (const key of state.chunks) {
                const [chunkX, chunkY] = key.split(",").map(Number);
                if (!Number.isInteger(chunkX) || !Number.isInteger(chunkY) || !this.chunkTouchesBrokenKingdom(chunkX, chunkY)) continue;
                socket.talk("CH", chunkX, chunkY, ...this.buildChunkData(chunkX, chunkY));
                socket.talk("FH", chunkX, chunkY, ...this.buildFloorChunkData(chunkX, chunkY));
            }
        }
    }

    applyKingdomBlueprintState(stateName) {
        const target = this.kingdomBlueprintStates?.[stateName];
        if (!target) return false;
        for (const [key, type] of [...this.placedBlocks]) {
            const [x, y] = key.split(",").map(Number);
            if (!isBrokenKingdomSurfaceCell(x, y)) continue;
            this.placedBlocks.delete(key);
            this.placedBlockDirections.delete(key);
            this.furnaces.delete(key);
            if (this.chests.has(key)) {
                for (const socket of this.gameManager.clients) {
                    if (socket.craftrasChestKey === key) this.gameManager.socketManager.closeCraftrasChest(socket);
                }
                this.chests.delete(key);
            }
        }
        for (const key of [...this.placedFloors.keys()]) {
            const [x, y] = key.split(",").map(Number);
            if (isBrokenKingdomSurfaceCell(x, y)) this.placedFloors.delete(key);
        }
        for (const key of [...this.destroyedWallKeys]) {
            const [x, y] = key.split(",").map(Number);
            if (isBrokenKingdomSurfaceCell(x, y)) this.destroyedWallKeys.delete(key);
        }
        for (const collection of [this.damagedWallHealth, this.damagedWallLastHitAt, this.permanentBlockDamageStages, this.damagedFloorHealth]) {
            for (const key of [...collection.keys()]) {
                const [x, y] = key.split(",").map(Number);
                if (isBrokenKingdomSurfaceCell(x, y)) collection.delete(key);
            }
        }
        for (const [key, tree] of [...this.loadedTrees]) {
            const [x, y] = key.split(",").map(Number);
            if (!isBrokenKingdomSurfaceCell(x, y)) continue;
            tree?.destroy?.();
            this.loadedTrees.delete(key);
        }

        this.brokenKingdomBlueprintClearedKeys = new Set(target.cleared);
        for (const key of target.cleared) this.destroyedWallKeys.add(key);
        for (const [key, entry] of target.blocks) {
            this.destroyedWallKeys.delete(key);
            this.placedBlocks.set(key, entry.type);
            this.placedBlockDirections.set(key, entry.direction);
            if (entry.type === BLOCKS.FURNACE) this.furnaces.set(key, { slots: [null, null, null], active: false, finishAt: 0 });
            if (entry.type === BLOCKS.CHEST) this.chests.set(key, { slots: Array(27).fill(null) });
        }
        for (const [key, entry] of target.floors) this.placedFloors.set(key, entry.type);
        for (const [key, stage] of target.damageStages) {
            if (this.placedBlocks.has(key)) this.permanentBlockDamageStages.set(key, stage);
        }
        this.kingdomWeatherState = stateName;
        this.refreshLoadedKingdomChunks();
        for (const body of this.getConnectedPlayerBodies()) this.resolveEntityOutOfWall(body, 12);
        for (const mob of this.mobs) this.resolveEntityOutOfWall(mob, 12);
        console.log(`[Craftras Kingdom Weather] Switched to ${stateName} kingdom: ${target.blocks.size} walls, ${target.floors.size} floors.`);
        return true;
    }

    getCell(x, y) {
        const key = this.wallKey(x, y);
        let cell = this.cellCache.get(key);
        if (!cell) {
            cell = generateCell(x, y, this.seed);
            this.cellCache.set(key, cell);
        }
        return cell;
    }

    getBlock(x, y) {
        const key = this.wallKey(x, y);
        if (this.placedBlocks.has(key)) return this.placedBlocks.get(key);
        if (this.destroyedWallKeys.has(key)) return BLOCKS.AIR;
        if (Config.craftras_village_builder && !Config.craftras_broken_kingdom_builder && !Config.craftras_intact_kingdom_builder && !Config.craftras_world1_challenge_builder && !Config.craftras_cave_builder) return BLOCKS.AIR;
        const generatedBlock = this.getCell(x, y)?.block ?? BLOCKS.AIR;
        if (generatedBlock === BLOCKS.TREE && this.isInsideVillageNatureClearZone(x, y)) return BLOCKS.AIR;
        return generatedBlock;
    }

    getFloor(x, y) {
        return this.placedFloors.get(this.wallKey(x, y)) ?? BLOCKS.AIR;
    }

    getBlockCode(x, y) {
        const block = this.getBlock(x, y);
        return isTextStoryBlock(block) ? TEXT_STORY_BLOCK_CODE : BLOCK_CODES[block] ?? 0;
    }

    setPermanentBlockDamageStage(socket, stage) {
        if (!Config.craftras_broken_kingdom_builder) return { ok: false, reason: "builder" };
        const body = socket?.player?.body;
        if (!body || body.isDead?.()) return { ok: false, reason: "body" };
        const normalizedStage = Math.trunc(Number(stage));
        if (!Number.isInteger(normalizedStage) || normalizedStage < 0 || normalizedStage > 3) return { ok: false, reason: "stage" };
        const cell = this.getPlacementCell(body);
        if (!isBrokenKingdomSurfaceCell(cell.x, cell.y)) return { ok: false, reason: "area" };
        const block = this.getBlock(cell.x, cell.y);
        if (block === BLOCKS.AIR) return { ok: false, reason: "air" };
        const key = this.wallKey(cell.x, cell.y);
        if (normalizedStage === 0) this.permanentBlockDamageStages.delete(key);
        else this.permanentBlockDamageStages.set(key, normalizedStage);
        this.broadcastBlockUpdate(cell.x, cell.y, this.getBlockRenderCode(cell.x, cell.y));
        const saved = this.saveBrokenKingdomBlueprint();
        return { ok: true, x: cell.x, y: cell.y, block, stage: normalizedStage, saved };
    }

    getBlockDamageStage(x, y, block = this.getBlock(x, y)) {
        const permanentStage = this.permanentBlockDamageStages.get(this.wallKey(x, y)) ?? 0;
        const maxHealth = BLOCK_HEALTH[block];
        const health = this.damagedWallHealth.get(this.wallKey(x, y));
        if (!maxHealth || health == null) return permanentStage;
        const damageRatio = 1 - health / maxHealth;
        const temporaryStage = damageRatio >= 0.66 ? 3 : damageRatio >= 0.33 ? 2 : damageRatio >= 0.01 ? 1 : 0;
        return Math.max(permanentStage, temporaryStage);
    }

    getBlockDamageStageFromHealth(health, maxHealth) {
        if (!maxHealth || health == null) return 0;
        const damageRatio = 1 - health / maxHealth;
        if (damageRatio >= 0.66) return 3;
        if (damageRatio >= 0.33) return 2;
        if (damageRatio >= 0.01) return 1;
        return 0;
    }

    updateDamagedBlockRegeneration(now) {
        const lastUpdate = this.damagedWallRegenLastUpdate || now;
        this.damagedWallRegenLastUpdate = now;
        if (!this.damagedWallHealth.size) return;

        for (const [key, health] of [...this.damagedWallHealth]) {
            const [x, y] = key.split(",").map(Number);
            const block = Number.isFinite(x) && Number.isFinite(y) ? this.getBlock(x, y) : BLOCKS.AIR;
            const maxHealth = BLOCK_HEALTH[block];
            if (!maxHealth || block === BLOCKS.AIR) {
                this.damagedWallHealth.delete(key);
                this.damagedWallLastHitAt.delete(key);
                continue;
            }

            const lastHitAt = this.damagedWallLastHitAt.get(key) ?? 0;
            const regenStartAt = lastHitAt + BLOCK_REGEN_DELAY;
            if (now <= regenStartAt) continue;

            const elapsed = now - Math.max(lastUpdate, regenStartAt);
            if (elapsed <= 0) continue;

            const oldStage = this.getBlockDamageStageFromHealth(health, maxHealth);
            const nextHealth = Math.min(maxHealth, health + maxHealth * BLOCK_REGEN_RATE_PER_SECOND * elapsed / 1000);
            const tree = this.loadedTrees.get(key);
            if (tree) tree.health.amount = tree.health.max * nextHealth / maxHealth;

            if (nextHealth >= maxHealth) {
                this.damagedWallHealth.delete(key);
                this.damagedWallLastHitAt.delete(key);
                this.broadcastBlockUpdate(x, y, this.getBlockRenderCode(x, y));
                continue;
            }

            this.damagedWallHealth.set(key, nextHealth);
            const nextStage = this.getBlockDamageStageFromHealth(nextHealth, maxHealth);
            if (nextStage !== oldStage) this.broadcastBlockUpdate(x, y, this.getBlockRenderCode(x, y));
        }
    }

    getBlockRenderCode(x, y, forcedStage = null) {
        const block = this.getBlock(x, y);
        if (isTextStoryBlock(block)) return TEXT_STORY_BLOCK_CODE;
        let code = BLOCK_CODES[block] ?? 0;
        if (block === BLOCKS.FURNACE && this.furnaces.get(this.wallKey(x, y))?.active) code = 12;
        const stage = forcedStage ?? this.getBlockDamageStage(x, y, block);
        const direction = this.placedBlockDirections.get(this.wallKey(x, y)) ?? 0;
        return code | (stage << 5) | (direction << 7);
    }

    getFloorRenderCode(x, y) {
        const block = this.getFloor(x, y);
        let code = BLOCK_CODES[block] ?? 0;
        const maxHealth = BLOCK_HEALTH[block];
        const health = this.damagedFloorHealth.get(this.wallKey(x, y));
        if (maxHealth && health != null) {
            const damageRatio = 1 - health / maxHealth;
            const stage = damageRatio >= 0.66 ? 3 : damageRatio >= 0.33 ? 2 : damageRatio >= 0.01 ? 1 : 0;
            code |= stage << 5;
        }
        return code;
    }

    isMovementBlockingBlock(block) {
        return block !== BLOCKS.AIR && block !== BLOCKS.TORCH && block !== BLOCKS.STEEL_TORCH && block !== BLOCKS.CHALLENGE_SPAWN && block !== BLOCKS.ROUTE_MARKER && !isTextStoryBlock(block);
    }

    canEntityPassTransparentBlock(entity) {
        const family = entity?.craftrasMobFamily;
        return family === "npc" || !!family && family !== "animal";
    }

    isMovementBlockingBlockForEntity(block, entity) {
        if (block === BLOCKS.TRANSPARENT_BLOCK && this.canEntityPassTransparentBlock(entity)) return false;
        return this.isMovementBlockingBlock(block);
    }

    isBodyCollisionBlock(block) {
        return this.isMovementBlockingBlock(block) && block !== BLOCKS.TREE;
    }

    isBodyCollisionBlockForEntity(block, entity) {
        return this.isMovementBlockingBlockForEntity(block, entity) && block !== BLOCKS.TREE;
    }

    isSolidBlock(x, y) {
        return this.isMovementBlockingBlock(this.getBlock(x, y));
    }

    resolveEntityOutOfWall(entity, maxRadius = 4) {
        if (!entity || entity.isDead?.() || entity.craftrasSpectator) return false;
        const center = worldToBlock(entity.x, entity.y);
        if (!this.isBodyCollisionBlockForEntity(this.getBlock(center.x, center.y), entity)) return false;
        let best = null;
        let bestDistance = Infinity;
        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let x = center.x - radius; x <= center.x + radius; x++) {
                for (let y = center.y - radius; y <= center.y + radius; y++) {
                    if (Math.max(Math.abs(x - center.x), Math.abs(y - center.y)) !== radius) continue;
                    if (this.isBodyCollisionBlockForEntity(this.getBlock(x, y), entity)) continue;
                    const location = blockToWorld(x, y);
                    const distance = Math.hypot(location.x - entity.x, location.y - entity.y);
                    if (distance >= bestDistance) continue;
                    bestDistance = distance;
                    best = location;
                }
            }
            if (best) break;
        }
        if (!best) return false;
        const speed = Math.hypot(entity.velocity?.x || 0, entity.velocity?.y || 0);
        entity.x = best.x;
        entity.y = best.y;
        if (speed > 0) {
            const dx = best.x - blockToWorld(center.x, center.y).x;
            const dy = best.y - blockToWorld(center.x, center.y).y;
            const distance = Math.hypot(dx, dy) || 1;
            entity.velocity.x = dx / distance * speed;
            entity.velocity.y = dy / distance * speed;
        }
        return true;
    }

    clearLoadedTrees() {
        if (!this.loadedTrees) return;
        for (const trunk of this.loadedTrees.values()) trunk?.destroy?.();
        this.loadedTrees.clear();
    }

    spawnTree(x, y) {
        const key = this.wallKey(x, y);
        if (this.loadedTrees.has(key) || this.getBlock(x, y) !== BLOCKS.TREE) return;
        const location = blockToWorld(x, y);
        const sizeScale = 0.85 + (((x * 73856093) ^ (y * 19349663) ^ this.seed) >>> 0) % 31 / 100;
        const trunk = new Entity(location);
        trunk.define("craftrasTree");
        trunk.team = TEAM_ROOM;
        trunk.SIZE *= sizeScale / 1.5;
        trunk.coreSize = trunk.SIZE;
        trunk.facing = 0;
        trunk.protect();
        trunk.life();
        trunk.on("dead", () => {
            if (!this.destroyedWallKeys.has(key)) {
                const villageRepair = this.registerVillageRepairJob(x, y, BLOCKS.TREE);
                this.destroyedWallKeys.add(key);
                this.damagedWallHealth.delete(key);
                this.damagedWallLastHitAt.delete(key);
                this.permanentBlockDamageStages.delete(key);
                this.broadcastBlockUpdate(x, y, 0);
                if (!villageRepair) this.spawnItemDrop(BLOCKS.TREE, location);
            }
            this.loadedTrees.delete(key);
        });
        this.loadedTrees.set(key, trunk);
    }

    spawnItemDrop(block, location) {
        const item = BLOCK_DROPS[block];
        if (!item) return null;
        const count = block === BLOCKS.TREE ? 1 + Math.floor(Math.random() * 2) : 1;
        return this.spawnItemEntity(item, location, { count, pickupDelay: 150 });
    }

    spawnItemEntity(item, location, options = {}) {
        const now = Date.now();
        const drop = new Entity({ x: location.x, y: location.y });
        drop.define("craftrasItemDrop");
        drop.settings.no_collisions = true;
        drop.displayName = true;
        drop.nameColor = "#ffffff";
        drop.team = TEAM_ROOM;
        drop.alwaysActive = true;
        drop.craftrasItem = item;
        drop.craftrasItemCount = Math.max(1, Math.floor(options.count || 1));
        this.updateItemDropName(drop);
        drop.craftrasPickupAt = now + Math.max(0, options.pickupDelay || 0);
        drop.craftrasMagnetAt = now + Math.max(0, options.magnetDelay || 0);
        drop.craftrasExpiresAt = now + 60_000;
        drop.craftrasDropOwner = options.owner || null;
        drop.craftrasOwnerBlockedUntil = now + Math.max(0, options.ownerBlockDuration || 0);
        drop.damp = 0.025;
        drop.maxSpeed = 32;
        drop.velocity.x = options.velocityX || 0;
        drop.velocity.y = options.velocityY || 0;
        drop.settings.scoreLabel = " ";
        drop.on("dead", () => this.itemDrops.delete(drop));
        this.itemDrops.add(drop);
        return drop;
    }

    spawnMobLoot(mob, itemId, count = 1) {
        const item = ITEMS[itemId];
        if (!mob || !item || count < 1) return null;
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 5;
        return this.spawnItemEntity(item, { x: mob.x, y: mob.y }, {
            count,
            pickupDelay: 300,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
        });
    }

    dropMobLoot(mob, mobType) {
        if (!mob || mob.craftrasLootDropped || mob.craftrasChallengeNoLoot) return;
        mob.craftrasLootDropped = true;
        const rollDrop = (chance, itemId, min = 1, max = min) => {
            if (Math.random() >= chance) return;
            const count = min + Math.floor(Math.random() * (max - min + 1));
            this.spawnMobLoot(mob, itemId, count);
        };

        if (mobType === "king_zombie") {
            rollDrop(0.05, "zombie_crown_recipe");
            this.spawnMobLoot(mob, "crown_fragment");
            return;
        }
        if (mobType === "king_guardian") {
            rollDrop(0.2, "royal_key");
            rollDrop(1, "knight_shield_recipe");
            rollDrop(0.1, "knight_shield_fragment");
            return;
        }
        if (mob.craftrasMobFamily === "skeleton") {
            rollDrop(0.7, "bone", 1, 2);
            rollDrop(0.1, "skeleton_head");
            return;
        }
        if (mobType === "creeper") {
            rollDrop(0.6, "gunpowder", 1, 2);
            rollDrop(0.1, "creeper_head");
            return;
        }
        if (mobType === "annihilator") {
            this.spawnMobLoot(mob, "gunpowder", 4 + Math.floor(Math.random() * 3));
            rollDrop(0.05, "bone_bomb_recipe");
            return;
        }
        if (mobType === "spider") {
            rollDrop(0.5, "spider_eye");
            rollDrop(0.07, "spider_head");
            return;
        }
        if (mobType === "toxic_spider") {
            rollDrop(0.4, "toxic_spider_eye");
            rollDrop(0.05, "toxic_spider_head");
            return;
        }
        if (mobType === "queen_spider") {
            rollDrop(0.05, "venom_sword_recipe");
            const queenLoot = ["spider_leg", "string", "spider_venom"];
            for (let i = 0; i < 4; i++) this.spawnMobLoot(mob, queenLoot[Math.floor(Math.random() * queenLoot.length)]);
            return;
        }
        if (mobType === "cow") {
            rollDrop(0.9, "raw_beef", 1, 2);
            return;
        }
        if (mobType === "pig") {
            rollDrop(0.9, "raw_pork", 1, 2);
            return;
        }
        if (mobType === "chicken") {
            rollDrop(0.9, "raw_chicken", 1, 2);
            return;
        }
        if (mob.craftrasMobFamily !== "zombie") return;

        rollDrop(0.6, "rotten_flesh", 1, 2);
        rollDrop(0.1, "zombie_head");
        const equipment = [];
        if (mob.craftrasHelmetMaterial === "iron") equipment.push("iron_helmet");
        else if (mob.craftrasHelmetMaterial === "diamond") equipment.push("diamond_helmet");
        if (mob.craftrasSwordMaterial === "iron") equipment.push("iron_sword");
        else if (mob.craftrasSwordMaterial === "diamond") equipment.push("diamond_sword");
        if (equipment.length && Math.random() < 0.05) {
            this.spawnMobLoot(mob, equipment[Math.floor(Math.random() * equipment.length)]);
        }
    }

    updateItemDropName(drop) {
        if (!drop?.craftrasItem) return;
        const count = Math.max(1, Math.floor(drop.craftrasItemCount || 1));
        drop.name = count > 1 ? `${drop.craftrasItem.name} x ${count}` : drop.craftrasItem.name;
    }

    mergeNearbyItemDrops() {
        if (this.itemDrops.size < 2) return;
        const mergeRange = 14;
        const mergeRangeSquared = mergeRange * mergeRange;
        const attractionRange = 120;
        const attractionRangeSquared = attractionRange * attractionRange;
        const buckets = new Map();
        const bucketKey = (x, y) => `${Math.floor(x / attractionRange)},${Math.floor(y / attractionRange)}`;
        const drops = [];

        for (const drop of this.itemDrops) {
            if (!drop || drop.isDead?.() || !drop.craftrasItem) continue;
            drops.push(drop);
            const key = bucketKey(drop.x, drop.y);
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key).push(drop);
        }

        const processedPairs = new Set();
        dropLoop: for (const drop of drops) {
            if (!this.itemDrops.has(drop) || drop.isDead?.()) continue;
            const bucketX = Math.floor(drop.x / attractionRange);
            const bucketY = Math.floor(drop.y / attractionRange);
            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                for (let offsetX = -1; offsetX <= 1; offsetX++) {
                    const nearby = buckets.get(`${bucketX + offsetX},${bucketY + offsetY}`);
                    if (!nearby) continue;
                    for (const target of nearby) {
                        if (!target || target === drop || !this.itemDrops.has(target) || target.isDead?.()) continue;
                        if (target.craftrasItem?.id !== drop.craftrasItem.id) continue;
                        const pairKey = drop.id < target.id ? `${drop.id}:${target.id}` : `${target.id}:${drop.id}`;
                        if (processedPairs.has(pairKey)) continue;
                        processedPairs.add(pairKey);

                        const dx = target.x - drop.x;
                        const dy = target.y - drop.y;
                        const distanceSquared = dx * dx + dy * dy;
                        if (distanceSquared > attractionRangeSquared || distanceSquared < 1e-8) continue;

                        if (distanceSquared <= mergeRangeSquared && (drop.craftrasItemCount < 64 || target.craftrasItemCount < 64)) {
                            const receiver = target.craftrasItemCount >= drop.craftrasItemCount ? target : drop;
                            const donor = receiver === target ? drop : target;
                            const moved = Math.min(64 - receiver.craftrasItemCount, donor.craftrasItemCount);
                            if (moved > 0) {
                                receiver.craftrasItemCount += moved;
                                donor.craftrasItemCount -= moved;
                                receiver.craftrasExpiresAt = Math.min(
                                    receiver.craftrasExpiresAt || Infinity,
                                    donor.craftrasExpiresAt || Infinity,
                                );
                                receiver.velocity.x = (receiver.velocity.x + donor.velocity.x) * 0.5;
                                receiver.velocity.y = (receiver.velocity.y + donor.velocity.y) * 0.5;
                                this.updateItemDropName(receiver);
                                if (donor.craftrasItemCount <= 0) {
                                    this.itemDrops.delete(donor);
                                    donor.destroy();
                                    if (donor === drop) continue dropLoop;
                                } else this.updateItemDropName(donor);
                            }
                            continue;
                        }

                        if (drop.craftrasItemCount >= 64 && target.craftrasItemCount >= 64) continue;
                        const distance = Math.sqrt(distanceSquared);
                        const pull = 0.12 + 0.38 * (1 - distance / attractionRange);
                        const pullX = dx / distance * pull;
                        const pullY = dy / distance * pull;
                        drop.velocity.x += pullX;
                        drop.velocity.y += pullY;
                        target.velocity.x -= pullX;
                        target.velocity.y -= pullY;
                    }
                }
            }
        }
    }

    dropSelectedItem(socket) {
        if (Date.now() < (socket.craftrasNextDropAt || 0)) return false;
        socket.craftrasNextDropAt = Date.now() + 80;
        const body = socket?.player?.body;
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        const slot = socket?.craftrasHotbar?.selected;
        const stack = Number.isInteger(slot) ? socket?.craftrasInventory?.slots?.[slot] : null;
        if (!body || body.isDead?.() || !stack) return false;
        if (this.isLockedRecipeItem(stack.id)) {
            body.sendMessage("Protected items cannot be dropped.");
            return false;
        }
        const item = { id: stack.id, name: stack.name || stack.id };
        const facing = Number.isFinite(body.facing) ? body.facing : 0;
        const forwardX = Math.cos(facing);
        const forwardY = Math.sin(facing);
        const launchDistance = Math.max(28, (body.realSize || body.size || 12) + 14);
        if (!this.gameManager.socketManager.consumeCraftrasSelectedItem(socket, 1, true)) return false;
        this.spawnItemEntity(item, {
            x: body.x + forwardX * launchDistance,
            y: body.y + forwardY * launchDistance,
        }, {
            velocityX: forwardX * 28 + body.velocity.x * 0.35,
            velocityY: forwardY * 28 + body.velocity.y * 0.35,
            pickupDelay: 450,
            magnetDelay: 550,
            owner: body,
            ownerBlockDuration: 1100,
        });
        return true;
    }

    dropOffhandItem(socket) {
        if (Date.now() < (socket.craftrasNextDropAt || 0)) return false;
        socket.craftrasNextDropAt = Date.now() + 80;
        const body = socket?.player?.body;
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        const stack = socket?.craftrasInventory?.offhand;
        if (!body || body.isDead?.() || !stack) return false;
        const item = { id: stack.id, name: stack.name || stack.id };
        const facing = Number.isFinite(body.facing) ? body.facing : 0;
        const forwardX = Math.cos(facing);
        const forwardY = Math.sin(facing);
        const launchDistance = Math.max(28, (body.realSize || body.size || 12) + 14);
        socket.craftrasInventory.offhand = null;
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        this.gameManager.socketManager.sendCraftrasHotbar(socket);
        this.gameManager.socketManager.sendCraftrasInventory(socket);
        this.spawnItemEntity(item, {
            x: body.x + forwardX * launchDistance,
            y: body.y + forwardY * launchDistance,
        }, {
            velocityX: forwardX * 28 + body.velocity.x * 0.35,
            velocityY: forwardY * 28 + body.velocity.y * 0.35,
            pickupDelay: 450,
            magnetDelay: 550,
            owner: body,
            ownerBlockDuration: 1100,
        });
        return true;
    }

    dropInventoryStack(socket, slot) {
        const body = socket?.player?.body;
        if (!body || body.isDead?.() || slot < 0 || slot >= 40) return false;
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        const stack = socket.craftrasInventory.slots[slot];
        if (!stack) return false;
        if (this.isLockedRecipeItem(stack.id)) {
            body.sendMessage("Protected items cannot be dropped.");
            return false;
        }
        const item = { id: stack.id, name: stack.name || stack.id };
        const count = Math.max(1, Math.floor(stack.count || 1));
        const facing = Number.isFinite(body.facing) ? body.facing : 0;
        const forwardX = Math.cos(facing);
        const forwardY = Math.sin(facing);
        const launchDistance = Math.max(28, (body.realSize || body.size || 12) + 14);
        socket.craftrasInventory.slots[slot] = null;
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        this.gameManager.socketManager.sendCraftrasHotbar(socket);
        this.gameManager.socketManager.sendCraftrasInventory(socket);
        this.spawnItemEntity(item, {
            x: body.x + forwardX * launchDistance,
            y: body.y + forwardY * launchDistance,
        }, {
            count,
            velocityX: forwardX * 28 + body.velocity.x * 0.35,
            velocityY: forwardY * 28 + body.velocity.y * 0.35,
            pickupDelay: 450,
            magnetDelay: 550,
            owner: body,
            ownerBlockDuration: 1100,
        });
        return true;
    }

    dropCursorItem(socket, amount) {
        const body = socket?.player?.body;
        const cursor = socket?.craftrasInventory?.cursor;
        if (!body || body.isDead?.() || !cursor) return false;
        if (this.isLockedRecipeItem(cursor.id)) {
            body.sendMessage("Protected items cannot be dropped.");
            return false;
        }
        const count = Math.max(1, Math.min(cursor.count, Math.floor(amount || 1)));
        const item = { id: cursor.id, name: cursor.name || cursor.id };
        const facing = Number.isFinite(body.facing) ? body.facing : 0;
        const forwardX = Math.cos(facing);
        const forwardY = Math.sin(facing);
        const launchDistance = Math.max(28, (body.realSize || body.size || 12) + 14);

        cursor.count -= count;
        if (cursor.count <= 0) socket.craftrasInventory.cursor = null;
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        this.gameManager.socketManager.sendCraftrasHotbar(socket);
        this.gameManager.socketManager.sendCraftrasInventory(socket);
        this.spawnItemEntity(item, {
            x: body.x + forwardX * launchDistance,
            y: body.y + forwardY * launchDistance,
        }, {
            count,
            velocityX: forwardX * 18 + body.velocity.x * 0.35,
            velocityY: forwardY * 18 + body.velocity.y * 0.35,
            pickupDelay: 450,
            magnetDelay: 550,
            owner: body,
            ownerBlockDuration: 1100,
        });
        return true;
    }

    dropAllInventory(socket, deadBody) {
        if (!socket || !deadBody || deadBody.craftrasInventoryDropped) return false;
        deadBody.craftrasInventoryDropped = true;
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        if (!Config.craftras_village_builder && !Config.craftras_steel_torch_builder) {
            this.gameManager.socketManager.sendCraftrasHotbar(socket);
            this.gameManager.socketManager.sendCraftrasInventory(socket);
            return false;
        }
        const slots = socket.craftrasInventory?.slots;
        if (!slots) return false;
        const stacks = slots.map(stack => stack ? { id: stack.id, name: stack.name || stack.id, count: stack.count } : null).filter(Boolean);
        const cursor = socket.craftrasInventory.cursor;
        if (cursor) stacks.push({ id: cursor.id, name: cursor.name || cursor.id, count: cursor.count });
        const helmet = socket.craftrasInventory.helmet;
        if (helmet) stacks.push({ id: helmet.id, name: helmet.name || helmet.id, count: 1 });
        const offhand = socket.craftrasInventory.offhand;
        if (offhand) stacks.push({ id: offhand.id, name: offhand.name || offhand.id, count: 1 });
        if (socket.craftrasCrafting?.slots) {
            for (const stack of socket.craftrasCrafting.slots) {
                if (stack) stacks.push({ id: stack.id, name: stack.name || stack.id, count: stack.count });
            }
            socket.craftrasCrafting.mode = 0;
            socket.craftrasCrafting.slots = Array(9).fill(null);
        }
        slots.fill(null);
        socket.craftrasInventory.cursor = null;
        socket.craftrasInventory.helmet = null;
        socket.craftrasInventory.offhand = null;
        this.gameManager.socketManager.sendCraftrasHotbar(socket);
        this.gameManager.socketManager.sendCraftrasInventory(socket);
        socket.craftrasInventory = null;
        socket.craftrasHotbar = null;

        const count = stacks.length;
        stacks.forEach((stack, index) => {
            const angle = index / count * Math.PI * 2 + (deadBody.facing || 0);
            const speed = 10 + index % 4 * 2;
            this.spawnItemEntity({ id: stack.id, name: stack.name }, {
                x: deadBody.x + Math.cos(angle) * 12,
                y: deadBody.y + Math.sin(angle) * 12,
            }, {
                count: stack.count,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                pickupDelay: 700,
                magnetDelay: 700,
            });
        });
        return true;
    }

    collectItemDrops() {
        if (!this.itemDrops.size) return;
        this.mergeNearbyItemDrops();
        const now = Date.now();
        for (const drop of this.itemDrops) {
            if (!drop || drop.isDead?.()) {
                this.itemDrops.delete(drop);
                continue;
            }
            if (now >= (drop.craftrasExpiresAt || Infinity)) {
                this.itemDrops.delete(drop);
                drop.destroy();
                continue;
            }
            drop.velocity.x *= 0.94;
            drop.velocity.y *= 0.94;
            let nearest = null;
            let nearestDistanceSquared = Infinity;
            for (const socket of this.gameManager.clients) {
                const body = socket?.player?.body;
                if (!body || body.isDead?.()) continue;
                const dx = body.x - drop.x;
                const dy = body.y - drop.y;
                const distanceSquared = dx * dx + dy * dy;
                const ownerBlocked = body === drop.craftrasDropOwner && now < drop.craftrasOwnerBlockedUntil;
                const bodyRadius = Math.max(12, body.realSize || body.size || 12);
                const magnetRadius = Math.min(420, 90 + bodyRadius);
                if (!ownerBlocked && now >= drop.craftrasMagnetAt && distanceSquared < magnetRadius * magnetRadius && distanceSquared < nearestDistanceSquared) {
                    nearest = { body, dx, dy, distanceSquared };
                    nearestDistanceSquared = distanceSquared;
                }

                const pickupRadius = bodyRadius * 1.15 + Math.max(5, drop.realSize || drop.size || 5);
                if (ownerBlocked || now < drop.craftrasPickupAt || distanceSquared > pickupRadius * pickupRadius) continue;
                const accepted = this.gameManager.socketManager.addCraftrasItem(socket, drop.craftrasItem, drop.craftrasItemCount);
                if (!accepted) continue;
                drop.craftrasItemCount -= accepted;
                if (drop.craftrasItemCount <= 0) {
                    this.itemDrops.delete(drop);
                    drop.destroy();
                } else this.updateItemDropName(drop);
                break;
            }
            if (!this.itemDrops.has(drop) || !nearest) continue;
            const distance = Math.sqrt(nearest.distanceSquared) || 1;
            const targetRadius = Math.min(420, 90 + Math.max(12, nearest.body.realSize || nearest.body.size || 12));
            const pull = 0.8 + 3.2 * (1 - Math.min(1, distance / targetRadius));
            drop.velocity.x += nearest.dx / distance * pull;
            drop.velocity.y += nearest.dy / distance * pull;
            const speed = Math.hypot(drop.velocity.x, drop.velocity.y);
            if (speed > 32) {
                drop.velocity.x = drop.velocity.x / speed * 32;
                drop.velocity.y = drop.velocity.y / speed * 32;
            }
        }
    }

    getSelectedPlacement(socket) {
        const selected = socket?.craftrasHotbar?.selected;
        const stack = Number.isInteger(selected) ? socket?.craftrasInventory?.slots?.[selected] : null;
        const block = stack ? PLACEABLE_ITEMS[stack.id] : null;
        if (ITEMS[stack?.id]?.adminOnly && !socket.permissions?.admin) return null;
        return block ? {
            stack,
            block,
            floorOnly: stack.id === "dirt_path",
            blockOnly: stack.id === "torch" || stack.id === "steel_torch" || stack.id === "challenge_start_block" || stack.id === "challenge_spawn_block" || stack.id === "transparent_block" || stack.id === "route_marker_block",
        } : null;
    }

    getPlacementCell(body) {
        const target = body?.control?.target ?? { x: 0, y: 0 };
        return worldToBlock(body.x + target.x, body.y + target.y);
    }

    getPlacementReach(body) {
        const bodyRadius = Math.max(1, body.realSize || body.size || 1);
        return bodyRadius + BLOCK_SIZE * 4;
    }

    placementOverlapsEntity(blockX, blockY) {
        const location = blockToWorld(blockX, blockY);
        const half = WALL_SIZE * 0.5;
        const nearby = global.grid.query(location.x - half, location.y - half, location.x + half, location.y + half);
        for (const entity of nearby) {
            if (!entity || entity.isDead?.() || entity.bond || entity.craftrasItem) continue;
            if (!["tank", "miniboss", "crasher", "wall"].includes(entity.type)) continue;
            const radius = Math.max(1, entity.realSize || entity.size || 1);
            const nearestX = Math.max(location.x - half, Math.min(entity.x, location.x + half));
            const nearestY = Math.max(location.y - half, Math.min(entity.y, location.y + half));
            const dx = entity.x - nearestX;
            const dy = entity.y - nearestY;
            if (dx * dx + dy * dy < radius * radius) return true;
        }
        return false;
    }

    getPlacementState(socket) {
        const body = socket?.player?.body;
        const selected = this.getSelectedPlacement(socket);
        const canSelectLayer = !!socket?.permissions?.admin;
        const mode = selected?.floorOnly
            ? "floor"
            : selected?.blockOnly || !canSelectLayer
                ? "block"
                : socket?.craftrasPlacementMode === "floor" ? "floor" : "block";
        if (!body || body.isDead?.() || !selected) return { active: false, x: 0, y: 0, valid: false, mode };
        const cell = this.getPlacementCell(body);
        const location = blockToWorld(cell.x, cell.y);
        const halfRoomWidth = this.gameManager.room.width * 0.5;
        const halfRoomHeight = this.gameManager.room.height * 0.5;
        const halfWall = WALL_SIZE * 0.5;
        const insideRoom = location.x - halfWall >= -halfRoomWidth && location.x + halfWall <= halfRoomWidth &&
            location.y - halfWall >= -halfRoomHeight && location.y + halfWall <= halfRoomHeight;
        const dx = location.x - body.x;
        const dy = location.y - body.y;
        const reach = this.getPlacementReach(body);
        const inRange = dx * dx + dy * dy <= reach * reach;
        const key = this.wallKey(cell.x, cell.y);
        const layerAvailable = mode === "floor"
            ? !this.placedFloors.has(key)
            : this.getBlock(cell.x, cell.y) === BLOCKS.AIR && !this.placementOverlapsEntity(cell.x, cell.y);
        const kingdomBuilder = Config.craftras_broken_kingdom_builder || Config.craftras_intact_kingdom_builder;
        const insideBuilderArea = !kingdomBuilder || isBrokenKingdomSurfaceCell(cell.x, cell.y);
        const valid = insideRoom && inRange && layerAvailable && insideBuilderArea;
        return { active: true, x: cell.x, y: cell.y, valid, block: selected.block, mode };
    }

    syncPlacementPreview(socket) {
        const state = this.getPlacementState(socket);
        const adminLayerTools = !!socket?.permissions?.admin;
        const signature = `${state.active ? 1 : 0}:${state.x}:${state.y}:${state.valid ? 1 : 0}:${state.mode}:${adminLayerTools ? 1 : 0}`;
        const clientState = this.clientStates.get(socket);
        if (!clientState || clientState.placementSignature === signature) return;
        clientState.placementSignature = signature;
        socket.talk("PV", state.active ? 1 : 0, state.x, state.y, state.valid ? 1 : 0, state.mode === "floor" ? 1 : 0, adminLayerTools ? 1 : 0);
    }

    togglePlacementMode(socket) {
        if (!socket?.permissions?.admin) {
            socket.craftrasPlacementMode = "block";
            this.syncPlacementPreview(socket);
            return false;
        }
        const selected = this.getSelectedPlacement(socket);
        if (!selected) return false;
        if (selected.floorOnly) {
            socket.craftrasPlacementMode = "floor";
            this.syncPlacementPreview(socket);
            return true;
        }
        if (selected.blockOnly) {
            socket.craftrasPlacementMode = "block";
            this.syncPlacementPreview(socket);
            return true;
        }
        socket.craftrasPlacementMode = socket.craftrasPlacementMode === "floor" ? "block" : "floor";
        const clientState = this.clientStates.get(socket);
        if (clientState) clientState.placementSignature = null;
        this.syncPlacementPreview(socket);
        return true;
    }

    clampWorldEditCell(cell) {
        const halfX = Math.ceil(BLOCKS_X / 2);
        const halfY = Math.ceil(BLOCKS_Y / 2);
        return {
            x: Math.max(-halfX, Math.min(halfX, Math.trunc(Number(cell?.x) || 0))),
            y: Math.max(-halfY, Math.min(halfY, Math.trunc(Number(cell?.y) || 0))),
        };
    }

    syncWorldEditPreview(socket, active = true) {
        const state = socket?.craftrasWorldEdit;
        const visible = !!active && !!state?.anchor && !!state?.cursor;
        const signature = visible
            ? `1:${state.anchor.x}:${state.anchor.y}:${state.cursor.x}:${state.cursor.y}:${state.mode}`
            : "0";
        if (!socket || state?.previewSignature === signature) return;
        state.previewSignature = signature;
        if (!visible) socket.talk("WV", 0);
        else socket.talk(
            "WV",
            1,
            state.anchor.x,
            state.anchor.y,
            state.cursor.x,
            state.cursor.y,
            state.mode === "fill" ? 1 : 0,
        );
    }

    updateWorldEditAxeInput(socket, body) {
        if (!socket || !body) return;
        const state = socket.craftrasWorldEdit ??= {
            anchor: null,
            cursor: null,
            mode: "outline",
            fireWasDown: false,
            altWasDown: false,
            equipped: false,
            previewSignature: null,
        };
        const active = !!socket.permissions?.admin && !body.craftrasSpectator && body.craftrasHeldItem === "worldedit_axe";
        const fireDown = !!body.control?.fire;
        const altDown = !!body.control?.alt;
        if (!active) {
            state.fireWasDown = false;
            state.altWasDown = false;
            state.equipped = false;
            this.syncWorldEditPreview(socket, false);
            return;
        }

        const firstEquippedFrame = !state.equipped;
        const firePressed = !firstEquippedFrame && fireDown && !state.fireWasDown;
        const altPressed = !firstEquippedFrame && altDown && !state.altWasDown;
        state.equipped = true;
        state.fireWasDown = fireDown;
        state.altWasDown = altDown;
        state.cursor = this.clampWorldEditCell(this.getPlacementCell(body));

        if (altPressed) {
            state.anchor = { ...state.cursor };
            body.sendMessage?.(`WorldEdit point marked at ${state.anchor.x}, ${state.anchor.y}.`);
        }
        if (firePressed) {
            state.mode = state.mode === "outline" ? "fill" : "outline";
            body.sendMessage?.(`WorldEdit mode: ${state.mode === "fill" ? "Filled" : "Outline"}.`);
        }
        this.syncWorldEditPreview(socket, true);
    }

    resolveWorldEditBlock(rawName) {
        const normalize = value => String(value || "").trim().toLowerCase().replace(/[\s_'\-]+/g, "");
        const requested = normalize(rawName);
        if (!requested) return null;
        if (["air", "empty", "clear"].includes(requested)) return { block: BLOCKS.AIR, itemId: "air", name: "Air" };
        const storyMatch = /^textstory(\d{1,3})$/.exec(requested);
        if (storyMatch) {
            const storyIndex = Number(storyMatch[1]);
            if (storyIndex < 1 || storyIndex > TEXT_STORY_BLOCK_MAX) return null;
            return {
                block: makeTextStoryBlock(storyIndex),
                itemId: makeTextStoryBlock(storyIndex),
                name: `Text Story ${storyIndex}`,
                storyIndex,
            };
        }

        const aliases = {
            grass: "grass_block",
            grasswall: "grass_block",
            dirtwall: "dirt",
            rock: "stone",
            coalore: "coal",
            iron: "iron_ore",
            gold: "gold_ore",
            diamond: "diamond_ore",
            diamondore: "diamond_ore",
            crystal: "diamond_ore",
            crystalore: "diamond_ore",
            spawn: "challenge_spawn_block",
            spawnblock: "challenge_spawn_block",
            barrier: "transparent_block",
            transparent: "transparent_block",
            route: "route_marker_block",
            path: "route_marker_block",
            routemarker: "route_marker_block",
            mapmarker: "route_marker_block",
            challengestart: "challenge_start_block",
        };
        const aliased = aliases[requested] || requested;
        if (aliased === "diamond_ore") return { block: BLOCKS.CRYSTAL_ORE, itemId: "diamond_ore", name: "Diamond Ore" };
        for (const [itemId, block] of Object.entries(PLACEABLE_ITEMS)) {
            const candidates = [itemId, ITEMS[itemId]?.name, block].map(normalize);
            if (!candidates.includes(normalize(aliased))) continue;
            return { block, itemId, name: ITEMS[itemId]?.name || itemId };
        }
        return null;
    }

    queueWorldEditSet(socket, rawBlockName) {
        const body = socket?.player?.body;
        if (!socket?.permissions?.admin) return { ok: false, reason: "admin" };
        if (!body || body.isDead?.() || body.craftrasSpectator) return { ok: false, reason: "body" };
        if (body.craftrasHeldItem !== "worldedit_axe") return { ok: false, reason: "tool" };
        if (this.worldEditJobs.has(socket)) return { ok: false, reason: "busy" };
        const state = socket.craftrasWorldEdit;
        const target = this.resolveWorldEditBlock(rawBlockName);
        if (!target) return { ok: false, reason: "block" };
        if (!state?.anchor || (!target.storyIndex && !state?.cursor)) return { ok: false, reason: "selection" };

        const selectionEnd = target.storyIndex ? state.anchor : state.cursor;
        const minX = Math.min(state.anchor.x, selectionEnd.x);
        const maxX = Math.max(state.anchor.x, selectionEnd.x);
        const minY = Math.min(state.anchor.y, selectionEnd.y);
        const maxY = Math.max(state.anchor.y, selectionEnd.y);
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        if (target.storyIndex) {
            if (!Config.craftras_world1_challenge_builder) return { ok: false, reason: "story_server" };
            if (width !== 1 || height !== 1) return { ok: false, reason: "story_single" };
            const markerKey = this.wallKey(minX, minY);
            const duplicate = this.textStoryMarkers.get(markerKey) === target.storyIndex;
            const pendingDuplicate = [...this.worldEditJobs.values()].some(job =>
                job.storyIndex === target.storyIndex && job.minX === minX && job.minY === minY);
            if (duplicate || pendingDuplicate) {
                return { ok: false, reason: "story_duplicate", x: minX, y: minY, storyIndex: target.storyIndex };
            }
        }
        const outline = state.mode === "outline";
        let coordinates = null;
        let total = width * height;
        if (outline) {
            coordinates = [];
            for (let x = minX; x <= maxX; x++) coordinates.push({ x, y: minY });
            if (maxY !== minY) for (let x = minX; x <= maxX; x++) coordinates.push({ x, y: maxY });
            for (let y = minY + 1; y < maxY; y++) {
                coordinates.push({ x: minX, y });
                if (maxX !== minX) coordinates.push({ x: maxX, y });
            }
            total = coordinates.length;
        }
        this.worldEditJobs.set(socket, {
            socket,
            block: target.block,
            storyIndex: target.storyIndex || 0,
            blockName: target.name,
            mode: state.mode,
            minX,
            maxX,
            minY,
            maxY,
            nextX: minX,
            nextY: minY,
            coordinates,
            coordinateIndex: 0,
            total,
            processed: 0,
            changed: 0,
            routeMarkersChanged: false,
            textStoryMarkersChanged: false,
        });
        return { ok: true, total, blockName: target.name, mode: state.mode };
    }

    applyWorldEditBlock(x, y, targetBlock) {
        const key = this.wallKey(x, y);
        const currentBlock = this.getBlock(x, y);
        const hadDamage = this.damagedWallHealth.has(key) || this.permanentBlockDamageStages.has(key);
        if (currentBlock === targetBlock && !hadDamage) return false;

        if (currentBlock !== targetBlock) {
            const tree = this.loadedTrees.get(key);
            if (tree) {
                tree.kill?.();
                this.loadedTrees.delete(key);
            }
            this.furnaces.delete(key);
            if (this.chests.has(key)) {
                for (const client of this.gameManager.clients) {
                    if (client.craftrasChestKey === key) this.gameManager.socketManager.closeCraftrasChest(client);
                }
                this.chests.delete(key);
            }
        }

        this.damagedWallHealth.delete(key);
        this.damagedWallLastHitAt.delete(key);
        this.permanentBlockDamageStages.delete(key);
        this.placedBlockDirections.delete(key);
        if (targetBlock === BLOCKS.AIR) {
            this.placedBlocks.delete(key);
            this.destroyedWallKeys.add(key);
        } else {
            this.destroyedWallKeys.delete(key);
            this.placedBlocks.set(key, targetBlock);
            this.placedBlockDirections.set(key, 0);
            if (targetBlock === BLOCKS.FURNACE) this.furnaces.set(key, { slots: [null, null, null], active: false, finishAt: 0 });
            if (targetBlock === BLOCKS.CHEST) this.chests.set(key, { slots: Array(27).fill(null) });
        }
        this.broadcastBlockUpdate(x, y, this.getBlockRenderCode(x, y), { immediate: true });
        return true;
    }

    processWorldEditJobs(limit = WORLD_EDIT_BLOCKS_PER_TICK) {
        let remaining = Math.max(0, Math.trunc(limit));
        for (const [socket, job] of this.worldEditJobs) {
            while (remaining > 0 && job.processed < job.total) {
                let point;
                if (job.coordinates) {
                    point = job.coordinates[job.coordinateIndex++];
                } else {
                    point = { x: job.nextX, y: job.nextY };
                    job.nextX++;
                    if (job.nextX > job.maxX) {
                        job.nextX = job.minX;
                        job.nextY++;
                    }
                }
                job.processed++;
                remaining--;
                if (point) {
                    if (job.storyIndex) {
                        const key = this.wallKey(point.x, point.y);
                        if (this.textStoryMarkers.get(key) !== job.storyIndex) {
                            this.textStoryMarkers.set(key, job.storyIndex);
                            job.textStoryMarkersChanged = true;
                            job.changed++;
                        }
                    } else {
                        const previousBlock = this.getBlock(point.x, point.y);
                        if (previousBlock === BLOCKS.ROUTE_MARKER || job.block === BLOCKS.ROUTE_MARKER) job.routeMarkersChanged = true;
                        if (this.applyWorldEditBlock(point.x, point.y, job.block)) job.changed++;
                    }
                }
            }
            if (job.processed < job.total) {
                if (remaining <= 0) break;
                continue;
            }
            this.worldEditJobs.delete(socket);
            if (job.routeMarkersChanged) this.routeMarkerRevision++;
            if (job.textStoryMarkersChanged) this.textStoryMarkerRevision++;
            socket?.talk?.("m", 6_000, `WorldEdit complete: ${job.changed}/${job.total} block(s) changed to ${job.blockName}.`);
        }
    }

    placeSelectedBlock(socket) {
        const state = this.getPlacementState(socket);
        if (!state.active || !state.valid) return false;
        if ((state.block === BLOCKS.BEDROCK || state.block === BLOCKS.STEEL_TORCH || state.block === BLOCKS.CHALLENGE_START || state.block === BLOCKS.CHALLENGE_SPAWN || state.block === BLOCKS.TRANSPARENT_BLOCK || state.block === BLOCKS.ROUTE_MARKER) && !socket.permissions?.admin) return false;
        if (!this.gameManager.socketManager.consumeCraftrasSelectedItem(socket, 1)) return false;
        const key = this.wallKey(state.x, state.y);
        if (state.mode === "floor") {
            this.damagedFloorHealth.delete(key);
            this.placedFloors.set(key, state.block);
            this.broadcastFloorUpdate(state.x, state.y, this.getFloorRenderCode(state.x, state.y));
            const clientState = this.clientStates.get(socket);
            if (clientState) clientState.placementSignature = null;
            this.syncPlacementPreview(socket);
            return true;
        }
        this.destroyedWallKeys.delete(key);
        this.damagedWallHealth.delete(key);
        this.damagedWallLastHitAt.delete(key);
        this.permanentBlockDamageStages.delete(key);
        this.placedBlocks.set(key, state.block);
        if (state.block === BLOCKS.ROUTE_MARKER) this.routeMarkerRevision++;
        this.handleVillageBlockPlaced(state.x, state.y, state.block);
        const facing = socket.player.body?.facing || 0;
        // The source texture faces down, so rotate it one quarter-turn past
        // the player's facing to make the furnace front face its installer.
        const direction = ((Math.round(facing / (Math.PI / 2)) + 1) % 4 + 4) % 4;
        this.placedBlockDirections.set(key, direction);
        if (state.block === BLOCKS.FURNACE) this.furnaces.set(key, { slots: [null, null, null], active: false, finishAt: 0 });
        if (state.block === BLOCKS.CHEST) this.chests.set(key, { slots: Array(27).fill(null) });
        this.broadcastBlockUpdate(state.x, state.y, this.getBlockRenderCode(state.x, state.y));
        if (state.block === BLOCKS.TREE) this.spawnTree(state.x, state.y);
        const clientState = this.clientStates.get(socket);
        if (clientState) clientState.placementSignature = null;
        this.syncPlacementPreview(socket);
        return true;
    }

    openCraftingTable(socket) {
        const body = socket?.player?.body;
        if (!body || body.isDead?.()) return false;
        const cell = this.getPlacementCell(body);
        const location = blockToWorld(cell.x, cell.y);
        const dx = location.x - body.x;
        const dy = location.y - body.y;
        const reach = this.getPlacementReach(body);
        if (dx * dx + dy * dy > reach * reach || this.getBlock(cell.x, cell.y) !== BLOCKS.CRAFTING_TABLE) return false;
        this.gameManager.socketManager.openCraftrasCrafting(socket, 3);
        return true;
    }

    getTouchingStation(body) {
        const center = worldToBlock(body.x, body.y);
        const radius = Math.max(1, body.realSize || body.size || 1);
        const halfWall = WALL_SIZE * 0.5;
        for (let y = center.y - 1; y <= center.y + 1; y++) {
            for (let x = center.x - 1; x <= center.x + 1; x++) {
                const block = this.getBlock(x, y);
                if (block !== BLOCKS.CRAFTING_TABLE && block !== BLOCKS.FURNACE && block !== BLOCKS.CHEST) continue;
                const location = blockToWorld(x, y);
                const nearestX = Math.max(location.x - halfWall, Math.min(body.x, location.x + halfWall));
                const nearestY = Math.max(location.y - halfWall, Math.min(body.y, location.y + halfWall));
                const dx = body.x - nearestX;
                const dy = body.y - nearestY;
                if (dx * dx + dy * dy <= (radius + 7) ** 2) return { x, y, block, key: this.wallKey(x, y) };
            }
        }
        return null;
    }

    syncStationTouches() {
        for (const socket of this.gameManager.clients) {
            const body = socket?.player?.body;
            if (!body || body.isDead?.()) continue;
            const station = this.getTouchingStation(body);
            const signature = station ? `${station.key}:${station.block}` : null;
            if (!signature) {
                socket.craftrasTouchStation = null;
                continue;
            }
            if (socket.craftrasTouchStation === signature) continue;
            socket.craftrasTouchStation = signature;
            if (station.block === BLOCKS.CRAFTING_TABLE) this.gameManager.socketManager.openCraftrasCrafting(socket, 3);
            else if (station.block === BLOCKS.FURNACE) this.gameManager.socketManager.openCraftrasFurnace(socket, station.key);
            else this.gameManager.socketManager.openCraftrasChest(socket, station.key);
        }
    }

    getChest(key) {
        let chest = this.chests.get(key);
        if (!chest) {
            chest = { slots: Array(27).fill(null) };
            this.chests.set(key, chest);
        }
        return chest;
    }

    dropStationContents(key, location) {
        const furnace = this.furnaces.get(key);
        if (furnace) {
            for (const stack of furnace.slots) {
                if (stack) this.spawnItemEntity(stack, location, { count: stack.count, pickupDelay: 250 });
            }
            this.furnaces.delete(key);
        }
        const chest = this.chests.get(key);
        if (chest) {
            for (const stack of chest.slots) {
                if (stack) this.spawnItemEntity(stack, location, { count: stack.count, pickupDelay: 250 });
            }
            for (const socket of this.gameManager.clients) {
                if (socket.craftrasChestKey === key) this.gameManager.socketManager.closeCraftrasChest(socket);
            }
            this.chests.delete(key);
        }
    }

    getFurnace(key) {
        let furnace = this.furnaces.get(key);
        if (!furnace) {
            furnace = { slots: [null, null, null], active: false, finishAt: 0 };
            this.furnaces.set(key, furnace);
        }
        return furnace;
    }

    tryStartFurnace(key) {
        const furnace = this.getFurnace(key);
        if (furnace.active) return false;
        const input = furnace.slots[0];
        const fuel = furnace.slots[1];
        const recipe = input && SMELTING_RECIPES[input.id];
        const output = recipe && makeItem(recipe.output, recipe.count);
        const validFuel = fuel && ["coal", "charcoal", "wood", "plank"].includes(fuel.id);
        const currentOutput = furnace.slots[2];
        if (!recipe || !output || !validFuel || (currentOutput && (currentOutput.id !== output.id || currentOutput.count + output.count > 64))) return false;
        fuel.count--;
        if (fuel.count <= 0) furnace.slots[1] = null;
        furnace.active = true;
        furnace.finishAt = Date.now() + 3000;
        const [x, y] = key.split(",").map(Number);
        this.broadcastBlockUpdate(x, y, this.getBlockRenderCode(x, y));
        this.gameManager.socketManager.sendCraftrasFurnaceForKey(key);
        return true;
    }

    updateFurnaces() {
        const now = Date.now();
        for (const [key, furnace] of this.furnaces) {
            if (!furnace.active || now < furnace.finishAt) continue;
            const input = furnace.slots[0];
            const recipe = input && SMELTING_RECIPES[input.id];
            if (recipe) {
                input.count--;
                if (input.count <= 0) furnace.slots[0] = null;
                const output = makeItem(recipe.output, recipe.count);
                if (furnace.slots[2]) furnace.slots[2].count += output.count;
                else furnace.slots[2] = output;
            }
            furnace.active = false;
            furnace.finishAt = 0;
            const [x, y] = key.split(",").map(Number);
            this.broadcastBlockUpdate(x, y, this.getBlockRenderCode(x, y));
            this.gameManager.socketManager.sendCraftrasFurnaceForKey(key);
            this.tryStartFurnace(key);
        }
    }

    syncTreeEntities() {
        const neededChunks = new Set();
        for (const socket of this.gameManager.clients) {
            const state = this.clientStates.get(socket);
            if (!socket?.player?.body || socket.player.body.isDead?.() || !state) continue;
            for (const key of state.chunks) neededChunks.add(key);
        }

        const neededTrees = new Set();
        for (const chunkKey of neededChunks) {
            const [chunkX, chunkY] = chunkKey.split(",").map(Number);
            for (let localY = 0; localY < CHUNK_SIZE; localY++) {
                for (let localX = 0; localX < CHUNK_SIZE; localX++) {
                    const x = chunkX * CHUNK_SIZE + localX;
                    const y = chunkY * CHUNK_SIZE + localY;
                    if (this.getBlock(x, y) !== BLOCKS.TREE) continue;
                    const key = this.wallKey(x, y);
                    neededTrees.add(key);
                    this.spawnTree(x, y);
                }
            }
        }

        for (const [key, trunk] of this.loadedTrees) {
            if (neededTrees.has(key)) continue;
            trunk?.destroy?.();
            this.loadedTrees.delete(key);
        }
    }

    getPlayerLoadRadius(body) {
        const equippedBonus = body?.craftrasHeldItem === "pope_staff" ? 2 * CHUNK_SIZE : 0;
        const chunkRadiusOverride = Math.floor(Number(body.craftrasLoadChunkRadiusOverride));
        if (Number.isFinite(chunkRadiusOverride) && chunkRadiusOverride > 0) return chunkRadiusOverride * CHUNK_SIZE + equippedBonus;
        const manualBonus = Math.max(0, Math.floor(body.craftrasLoadRadiusBonus || 0));
        return Math.min(this.maxLoadRadius + equippedBonus, this.baseLoadRadius + manualBonus + equippedBonus);
    }

    setPlayerChunkLoadRadius(body, chunkRadius) {
        const radius = Math.max(1, Math.min(32, Math.floor(Number(chunkRadius) || 0)));
        body.craftrasLoadChunkRadiusOverride = radius;
        return radius;
    }

    isSafeOutsideSpawnCell(x, y, radius = 3) {
        for (let oy = -radius; oy <= radius; oy++) {
            for (let ox = -radius; ox <= radius; ox++) {
                const cell = this.getCell(x + ox, y + oy);
                if (!cell || cell.region !== "surface" || this.getBlock(x + ox, y + oy) !== BLOCKS.AIR || cell.floor === FLOORS.WATER) return false;
            }
        }
        return true;
    }

    hasVisibleSpawnLandmark(x, y, minRadius = 4, horizontalRadius = 8, verticalRadius = 5) {
        const minSquared = minRadius * minRadius;
        let visibleSolidCount = 0;
        for (let oy = -verticalRadius; oy <= verticalRadius; oy++) {
            for (let ox = -horizontalRadius; ox <= horizontalRadius; ox++) {
                const distanceSquared = ox * ox + oy * oy;
                if (distanceSquared < minSquared) continue;
                if (this.isSolidBlock(x + ox, y + oy) && ++visibleSolidCount >= 5) return true;
            }
        }
        return false;
    }

    isGoodOutsideSpawnCell(x, y, options = {}) {
        if (options.avoidBrokenKingdom && isNearBrokenKingdomSurfaceCell(x, y, BROKEN_KINGDOM_SPAWN_CLEAR_RADIUS)) return false;
        return this.isSafeOutsideSpawnCell(x, y) && this.hasVisibleSpawnLandmark(x, y);
    }

    getChallengeSpawnPoints() {
        return [...this.placedBlocks]
            .filter(([, type]) => type === BLOCKS.CHALLENGE_SPAWN)
            .map(([key]) => key.split(",").map(Number))
            .filter(([x, y]) => Number.isInteger(x) && Number.isInteger(y))
            .sort((a, b) => a[1] - b[1] || a[0] - b[0])
            .map(([x, y]) => blockToWorld(x, y));
    }

    getRouteMarkerPositions() {
        return [...this.placedBlocks]
            .filter(([, type]) => type === BLOCKS.ROUTE_MARKER)
            .map(([key]) => key.split(",").map(Number))
            .filter(([x, y]) => Number.isInteger(x) && Number.isInteger(y))
            .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    }

    getTextStoryMarkerPositions() {
        return [...this.textStoryMarkers]
            .map(([key, index]) => {
                const [x, y] = key.split(",").map(Number);
                return { x, y, index };
            })
            .filter(marker => marker.index && Number.isInteger(marker.x) && Number.isInteger(marker.y))
            .sort((a, b) => a.index - b.index);
    }

    getNextChallengeSpawn(advance = true) {
        const points = this.getChallengeSpawnPoints();
        if (!points.length) return blockToWorld(-300, -310);
        const index = this.challengeSpawnCursor % points.length;
        if (advance) this.challengeSpawnCursor = (index + 1) % points.length;
        return { ...points[index] };
    }

    isChallengeWaiting() {
        return Config.craftras_world1_challenge_builder && this.challengeStage === "waiting";
    }

    startWorld1Challenge() {
        if (!Config.craftras_world1_challenge_builder || !["waiting", "approach"].includes(this.challengeStage)) {
            console.warn(`[Craftras World 1 Challenge] Start rejected: stage=${this.challengeStage}, enabled=${!!Config.craftras_world1_challenge_builder}.`);
            return false;
        }
        const route = this.buildChallengeNpcRoute();
        if (route.length < 2) {
            console.warn(`[Craftras World 1 Challenge] Start rejected: route build failed with ${this.getRouteMarkerPositions().length} marker(s).`);
            return false;
        }
        this.challengeRoute = route;
        this.challengeEncounter = this.createChallengeEncounterState();
        this.challengeRouteProtectedCells.clear();
        for (const point of route) {
            for (let y = point.blockY - 2; y <= point.blockY + 2; y++) {
                for (let x = point.blockX - 2; x <= point.blockX + 2; x++) this.challengeRouteProtectedCells.add(this.wallKey(x, y));
            }
        }
        this.challengeStage = "intro";
        this.challengeEscortMoving = false;
        this.challengeIntro = {
            lineIndex: 0,
            nextLineAt: Date.now(),
        };
        for (const actor of this.challengeActors) {
            actor.craftrasChallengeWaiting = true;
            actor.craftrasChallengeRouteIndex = this.findNearestChallengeRouteIndex(actor, this.challengeRouteStartIndex, this.challengeRouteStartIndex + 32);
            actor.craftrasChallengeRouteFinished = false;
            actor.craftrasChallengeFollowVelocity = { x: 0, y: 0 };
            actor.SPEED = 5.25;
            actor.topSpeed = this.gameManager.runSpeed * actor.SPEED;
            actor.craftrasWanderPath = null;
            actor.craftrasPath = null;
        }
        console.log(`[Craftras World 1 Challenge] Intro started. Escort route contains ${route.length} connected cells.`);
        return true;
    }

    beginChallengeEscort() {
        if (this.challengeEscortMoving) return;
        this.challengeEscortMoving = true;
        for (const actor of this.challengeActors) {
            actor.craftrasChallengeWaiting = false;
            actor.craftrasChallengeRouteIndex = this.findNearestChallengeRouteIndex(actor, this.challengeRouteStartIndex, this.challengeRouteStartIndex + 32);
            actor.craftrasChallengeRouteFinished = false;
        }
        console.log("[Craftras World 1 Challenge] The escort began moving during the intro.");
    }

    updateChallengeIntro(now = Date.now()) {
        const intro = this.challengeIntro;
        if (this.challengeStage !== "intro" || !intro || now < intro.nextLineAt) return;
        if (intro.lineIndex < CRAFTRAS_CHALLENGE_INTRO_LINES.length) {
            const line = CRAFTRAS_CHALLENGE_INTRO_LINES[intro.lineIndex++];
            const captain = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "captain" && !actor.isDead?.());
            captain?.say?.(line.text, line.duration);
            for (const socket of this.gameManager.clients) {
                socket?.talk?.("BM", line.duration, `Knight Captain: ${line.text}`, "#f2f2f2");
                if (line.cameraShake) socket?.talk?.("SH", JSON.stringify({
                    type: "camera",
                    duration: line.cameraShake.duration,
                    amount: line.cameraShake.amount,
                    keepShake: false,
                }));
            }
            if (line.startEscort) this.beginChallengeEscort();
            intro.nextLineAt = now + line.duration;
            return;
        }
        this.challengeStage = "active";
        this.challengeIntro = null;
        this.setChallengeEncounterStage(1, now);
        for (const socket of this.gameManager.clients) socket?.talk?.("BM", Config.popup_message_duration, "CHALLENGE START", "#ffcf40");
        console.log("[Craftras World 1 Challenge] CHALLENGE START. Stage 1 spawning begins in 10s.");
    }

    buildChallengeNpcRoute() {
        const markers = this.getRouteMarkerPositions().map(([x, y]) => ({ x, y }));
        if (markers.length < 2) return [];
        const markerMap = new Map(markers.map(marker => [this.wallKey(marker.x, marker.y), marker]));
        const neighbors = marker => [
            { x: marker.x + 1, y: marker.y },
            { x: marker.x - 1, y: marker.y },
            { x: marker.x, y: marker.y + 1 },
            { x: marker.x, y: marker.y - 1 },
        ].filter(candidate => markerMap.has(this.wallKey(candidate.x, candidate.y)));
        const endpoints = markers.filter(marker => neighbors(marker).length === 1);
        const discovered = new Set();
        const components = [];
        for (const marker of markers) {
            const markerKey = this.wallKey(marker.x, marker.y);
            if (discovered.has(markerKey)) continue;
            const component = [];
            const queue = [marker];
            discovered.add(markerKey);
            for (let cursor = 0; cursor < queue.length; cursor++) {
                const current = queue[cursor];
                component.push(current);
                for (const next of neighbors(current)) {
                    const nextKey = this.wallKey(next.x, next.y);
                    if (discovered.has(nextKey)) continue;
                    discovered.add(nextKey);
                    queue.push(markerMap.get(nextKey));
                }
            }
            components.push(component);
        }
        while (components.length > 1) {
            let closest = null;
            for (let firstIndex = 0; firstIndex < components.length; firstIndex++) {
                for (let secondIndex = firstIndex + 1; secondIndex < components.length; secondIndex++) {
                    for (const first of components[firstIndex]) {
                        for (const second of components[secondIndex]) {
                            const distance = (first.x - second.x) ** 2 + (first.y - second.y) ** 2;
                            if (!closest || distance < closest.distance) closest = { firstIndex, secondIndex, first, second, distance };
                        }
                    }
                }
            }
            if (!closest) {
                console.warn("[Craftras World 1 Challenge] Route bridge selection failed.");
                return [];
            }
            const bridge = [];
            let x = closest.first.x;
            let y = closest.first.y;
            while (x !== closest.second.x || y !== closest.second.y) {
                if (Math.abs(closest.second.x - x) >= Math.abs(closest.second.y - y) && x !== closest.second.x) {
                    x += Math.sign(closest.second.x - x);
                } else {
                    y += Math.sign(closest.second.y - y);
                }
                const key = this.wallKey(x, y);
                let bridgeMarker = markerMap.get(key);
                if (!bridgeMarker) {
                    bridgeMarker = { x, y };
                    markerMap.set(key, bridgeMarker);
                }
                bridge.push(bridgeMarker);
            }
            const merged = [...components[closest.firstIndex], ...components[closest.secondIndex], ...bridge];
            components.splice(closest.secondIndex, 1);
            components.splice(closest.firstIndex, 1, merged);
        }
        const spawnPoints = this.getChallengeSpawnPoints();
        const spawnCenter = spawnPoints.length
            ? worldToBlock(
                spawnPoints.reduce((sum, point) => sum + point.x, 0) / spawnPoints.length,
                spawnPoints.reduce((sum, point) => sum + point.y, 0) / spawnPoints.length,
            )
            : worldToBlock(this.spawnPoint.x, this.spawnPoint.y);
        const villageTarget = this.villageBounds
            ? {
                x: (this.villageBounds.minX + this.villageBounds.maxX) / 2,
                y: (this.villageBounds.minY + this.villageBounds.maxY) / 2,
            }
            : markers.reduce((best, marker) => marker.y > best.y ? marker : best, markers[0]);
        const nearestTo = (candidates, target, excluded = null) => candidates.reduce((best, candidate) => {
            if (excluded && candidate === excluded) return best;
            const distance = (candidate.x - target.x) ** 2 + (candidate.y - target.y) ** 2;
            return !best || distance < best.distance ? { marker: candidate, distance } : best;
        }, null)?.marker;
        const start = nearestTo(endpoints.length ? endpoints : markers, spawnCenter);
        const end = nearestTo(endpoints.length ? endpoints : markers, villageTarget, start);
        if (!start || !end) {
            console.warn(`[Craftras World 1 Challenge] Route endpoint selection failed: endpoints=${endpoints.length}.`);
            return [];
        }

        const startKey = this.wallKey(start.x, start.y);
        const endKey = this.wallKey(end.x, end.y);
        const queue = [start];
        const visited = new Set([startKey]);
        const parents = new Map();
        for (let cursor = 0; cursor < queue.length; cursor++) {
            const current = queue[cursor];
            const currentKey = this.wallKey(current.x, current.y);
            if (currentKey === endKey) break;
            for (const next of neighbors(current)) {
                const nextKey = this.wallKey(next.x, next.y);
                if (visited.has(nextKey)) continue;
                visited.add(nextKey);
                parents.set(nextKey, currentKey);
                queue.push(next);
            }
        }
        if (!visited.has(endKey)) {
            console.warn(`[Craftras World 1 Challenge] Route remained disconnected: start=${startKey}, end=${endKey}, reachable=${visited.size}, mapped=${markerMap.size}.`);
            return [];
        }
        const route = [];
        for (let key = endKey; key;) {
            const marker = markerMap.get(key);
            if (!marker) {
                console.warn(`[Craftras World 1 Challenge] Route reconstruction lost marker ${key}.`);
                return [];
            }
            const world = blockToWorld(marker.x, marker.y);
            route.push({ blockX: marker.x, blockY: marker.y, x: world.x, y: world.y });
            if (key === startKey) break;
            key = parents.get(key);
        }
        route.reverse();
        this.challengeRouteStartIndex = this.findNearestChallengeRouteIndex(spawnCenter, 0, route.length - 1, route, true);
        console.log(`[Craftras World 1 Challenge] Route build: start=${startKey}, end=${endKey}, cells=${route.length}, spawnIndex=${this.challengeRouteStartIndex}.`);
        return route;
    }

    findNearestChallengeRouteIndex(location, minIndex = 0, maxIndex = Infinity, route = this.challengeRoute, locationInBlocks = false) {
        if (!route?.length) return 0;
        const start = Math.max(0, Math.floor(minIndex));
        const end = Math.min(route.length - 1, Math.floor(maxIndex));
        let bestIndex = start;
        let bestDistance = Infinity;
        const source = locationInBlocks ? blockToWorld(location.x, location.y) : location;
        for (let index = start; index <= end; index++) {
            const point = route[index];
            const distance = (point.x - source.x) ** 2 + (point.y - source.y) ** 2;
            if (distance >= bestDistance) continue;
            bestDistance = distance;
            bestIndex = index;
        }
        return bestIndex;
    }

    updateChallengeActorRoute(mob) {
        const route = this.challengeRoute;
        if (!mob?.craftrasChallengeActor || !this.challengeEscortMoving || !route.length) return false;
        if (mob.craftrasChallengeRouteFinished) {
            mob.velocity.x *= 0.7;
            mob.velocity.y *= 0.7;
            mob.craftrasControl = {
                goal: { x: mob.x, y: mob.y },
                target: mob.craftrasControl?.target || { x: 1, y: 0 },
                fire: false,
                power: 0,
            };
            return true;
        }
        let index = Math.max(this.challengeRouteStartIndex, Math.floor(mob.craftrasChallengeRouteIndex || this.challengeRouteStartIndex));
        let targetIndex = Math.min(route.length - 1, index + 1);
        let target = route[targetIndex];
        let dx = target.x - mob.x;
        let dy = target.y - mob.y;
        while (targetIndex < route.length - 1 && Math.hypot(dx, dy) <= BLOCK_SIZE * 0.48) {
            index = targetIndex;
            targetIndex++;
            target = route[targetIndex];
            dx = target.x - mob.x;
            dy = target.y - mob.y;
        }
        mob.craftrasChallengeRouteIndex = index;
        if (targetIndex === route.length - 1 && Math.hypot(dx, dy) <= BLOCK_SIZE * 0.5) {
            mob.craftrasChallengeRouteIndex = targetIndex;
            mob.craftrasChallengeRouteFinished = true;
            return this.updateChallengeActorRoute(mob);
        }
        const distance = Math.hypot(dx, dy) || 1;
        const step = Math.min(distance, CRAFTRAS_CHALLENGE_ESCORT_STEP);
        mob.x += dx / distance * step;
        mob.y += dy / distance * step;
        mob.velocity.x = 0;
        mob.velocity.y = 0;
        if (mob.accel) {
            mob.accel.x = 0;
            mob.accel.y = 0;
        }
        mob.craftrasControl = {
            goal: { x: mob.x, y: mob.y },
            target: { x: dx, y: dy },
            fire: false,
            power: 0,
        };
        return true;
    }

    updateChallengeRouteFollower(actor, routeIndex, side = 0, speedMultiplier = 1.65) {
        if (!actor || !this.challengeEscortMoving || !this.challengeRoute.length) return false;
        const route = this.challengeRoute;
        const targetIndex = Math.max(this.challengeRouteStartIndex, Math.min(route.length - 1, Math.floor(routeIndex)));
        const target = route[targetIndex];
        const next = route[Math.min(route.length - 1, targetIndex + 1)] || target;
        const previous = route[Math.max(0, targetIndex - 1)] || target;
        const tangentX = next.x - previous.x;
        const tangentY = next.y - previous.y;
        const tangentLength = Math.hypot(tangentX, tangentY) || 1;
        const lateral = BLOCK_SIZE * 0.58 * side;
        const goal = {
            x: target.x - tangentY / tangentLength * lateral,
            y: target.y + tangentX / tangentLength * lateral,
        };
        const dx = goal.x - actor.x;
        const dy = goal.y - actor.y;
        const distance = Math.hypot(dx, dy) || 1;
        const catchUp = Math.min(CRAFTRAS_CHALLENGE_ESCORT_STEP * speedMultiplier, CRAFTRAS_CHALLENGE_ESCORT_STEP + Math.max(0, distance - BLOCK_SIZE * 2) * 0.08);
        const arrivalScale = Math.min(1, distance / (BLOCK_SIZE * 0.65));
        const speed = Math.min(distance, catchUp * arrivalScale);
        const desiredX = dx / distance * speed;
        const desiredY = dy / distance * speed;
        const velocity = actor.craftrasChallengeFollowVelocity ||= { x: 0, y: 0 };
        velocity.x = velocity.x * 0.62 + desiredX * 0.38;
        velocity.y = velocity.y * 0.62 + desiredY * 0.38;
        actor.x += velocity.x;
        actor.y += velocity.y;
        actor.velocity.x = 0;
        actor.velocity.y = 0;
        if (actor.accel) {
            actor.accel.x = 0;
            actor.accel.y = 0;
        }
        actor.craftrasChallengeRouteIndex = targetIndex;
        actor.craftrasControl = {
            goal: { x: actor.x, y: actor.y },
            target: { x: dx, y: dy },
            fire: false,
            power: 0,
        };
        return true;
    }

    freezeChallengeActor(actor, heal = false) {
        if (!actor) return;
        if (heal) actor.health.amount = actor.health.max;
        actor.velocity.x = 0;
        actor.velocity.y = 0;
        if (actor.accel) {
            actor.accel.x = 0;
            actor.accel.y = 0;
        }
        actor.craftrasControl = {
            goal: { x: actor.x, y: actor.y },
            target: actor.craftrasControl?.target || { x: 1, y: 0 },
            fire: false,
            power: 0,
        };
    }

    updateChallengeCaptainApproach(captain, player) {
        if (!captain || !player) return false;
        const dx = player.x - captain.x;
        const dy = player.y - captain.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance <= BLOCK_SIZE * 1.7) {
            this.freezeChallengeActor(captain, true);
            return true;
        }
        const step = Math.min(distance - BLOCK_SIZE * 1.45, CRAFTRAS_CHALLENGE_ESCORT_STEP * 0.72);
        captain.x += dx / distance * Math.max(0, step);
        captain.y += dy / distance * Math.max(0, step);
        captain.craftrasControl = {
            goal: { x: captain.x, y: captain.y },
            target: { x: dx, y: dy },
            fire: false,
            power: 0,
        };
        return false;
    }

    findChallengeKnightTarget(actor, maxRange = VILLAGE_GUARD_ATTACK_RANGE * 1.75) {
        if (actor?.craftrasChallengeRole === "guardian") maxRange *= 3;
        let nearest = null;
        let nearestDistance = maxRange;
        for (const target of this.getChallengeHostiles()) {
            if (target.craftrasChallengeKingAssassin || target.craftrasMobType === "magical_zombie") continue;
            const distance = Math.hypot(target.x - actor.x, target.y - actor.y);
            if (distance >= nearestDistance) continue;
            nearest = target;
            nearestDistance = distance;
        }
        return nearest ? { body: nearest, distance: nearestDistance } : null;
    }

    updateChallengeKnightCombat(actor, now = Date.now()) {
        if (!actor || actor.isDead?.() || actor.craftrasChallengeRole === "king" || this.challengeStage !== "active") return false;
        this.updateVillageGuardSlash(actor, now);
        const found = this.findChallengeKnightTarget(actor);
        const target = found?.body;
        if (!target) {
            actor.craftrasGuardTarget = null;
            actor.craftrasChallengeCombatPath = null;
            return false;
        }
        actor.craftrasGuardTarget = target;
        const dx = target.x - actor.x;
        const dy = target.y - actor.y;
        const distance = found.distance || 1;
        const meleeRange = VILLAGE_GUARD_ATTACK_RANGE * 1.3;
        if (!actor.craftrasGuardSlash && distance <= meleeRange && now >= (actor.craftrasNextGuardAttackAt || 0)) {
            actor.craftrasNextGuardAttackAt = now + (actor.craftrasChallengeRole === "captain" ? 550 : 720);
            actor.craftrasGuardSlash = { target, startedAt: now, hitDone: false };
            actor.craftrasChallengeCombatPath = null;
            return false;
        }
        if (actor.craftrasChallengeRole === "guardian" && !actor.craftrasGuardSlash && now >= (actor.craftrasNextChallengeSlashAt || 0)) {
            actor.craftrasNextChallengeSlashAt = now + 1_500;
            actor.craftrasGuardSlash = { target, startedAt: now, hitDone: true, visualOnly: true };
            this.spawnGuardianSlashProjectile(actor, target, {
                friendly: true,
                damage: 100,
                knockback: 18,
                speedMultiplier: 1.15,
                life: CRAFTRAS_GUARDIAN_SLASH_LIFE * 3,
                direction: { x: dx / distance, y: dy / distance },
            });
            actor.craftrasChallengeCombatPath = null;
            return false;
        }
        actor.craftrasChallengeCombatPath = null;
        return false;
    }

    faceChallengeActorAtCombatTarget(actor) {
        if (!actor || actor.isDead?.() || !actor.craftrasGuardSlash) return;
        const target = actor.craftrasGuardSlash.target;
        if (!target || target.isDead?.()) return;
        const dx = target.x - actor.x;
        const dy = target.y - actor.y;
        if (Math.hypot(dx, dy) < 0.001) return;
        const facing = Math.atan2(dy, dx);
        actor.facing = facing;
        actor.vfacing = facing;
        actor.craftrasControl ||= {};
        actor.craftrasControl.target = { x: dx, y: dy };
        actor.craftrasControl.fire = true;
    }

    resetWorld1ChallengeSession() {
        if (!Config.craftras_world1_challenge_builder) return;
        for (const actor of this.challengeActors) {
            actor?.destroy?.();
            this.mobs.delete(actor);
        }
        this.challengeActors.clear();
        for (const mob of this.getChallengeHostiles()) {
            mob.craftrasChallengeNoLoot = true;
            mob.destroy?.();
            this.mobs.delete(mob);
        }
        for (const projectile of this.guardianSlashProjectiles) projectile?.destroy?.();
        this.guardianSlashProjectiles.clear();
        for (const entity of this.challengeMagicEntities) entity?.destroy?.();
        this.challengeMagicEntities.clear();
        for (const drop of this.itemDrops) drop?.destroy?.();
        this.itemDrops.clear();
        this.challengeStage = "waiting";
        this.challengeRoute = [];
        this.challengeRouteStartIndex = 0;
        this.challengeEscortMoving = false;
        this.challengeIntro = null;
        this.challengeRouteProtectedCells.clear();
        this.challengeEncounter = null;
        this.challengeApproachPlayerId = null;
        this.challengeAiDiagnostics = null;
        this.challengeHadClients = false;
        this.challengeFailure = null;
        this.challengeSpawnCursor = 0;
        this.weatherType = "rain";
        this.weatherRainElapsed = 0;
        this.weatherCheckElapsed = 0;
        this.spawnChallengeInitialCast();
        this.syncWeather(true);
        console.log("[Craftras World 1 Challenge] Empty session reset. Combat simulation is idle.");
    }

    updateChallengeActors(now = Date.now()) {
        if (!Config.craftras_world1_challenge_builder) return;
        const players = this.getLivingPlayers();
        const captain = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "captain" && !actor.isDead?.());
        const king = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "king" && !actor.isDead?.());
        const guardian = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "guardian" && !actor.isDead?.());
        const knights = [...this.challengeActors]
            .filter(actor => actor?.craftrasChallengeRole === "knight" && !actor.isDead?.())
            .sort((a, b) => (a.craftrasChallengeActorIndex || 0) - (b.craftrasChallengeActorIndex || 0));
        if (this.challengeStage === "waiting" && players.length && captain) {
            this.challengeStage = "approach";
            this.challengeApproachPlayerId = players[0].body.id;
            console.log("[Craftras World 1 Challenge] Knight Captain is approaching the newly arrived player.");
        }
        if (this.challengeStage === "approach") {
            const player = players.find(entry => entry.body.id === this.challengeApproachPlayerId)?.body || players[0]?.body;
            for (const actor of this.challengeActors) {
                actor.damageReceived = 0;
                if (actor !== captain) this.freezeChallengeActor(actor, true);
            }
            if (captain && player && this.updateChallengeCaptainApproach(captain, player)) this.startWorld1Challenge();
            return;
        }
        this.updateChallengeIntro(now);
        const frozen = !this.challengeEscortMoving;
        for (const actor of this.challengeActors) {
            if (!actor || actor.isDead?.()) {
                this.challengeActors.delete(actor);
                this.mobs.delete(actor);
                continue;
            }
            if (this.challengeStage !== "active") actor.damageReceived = 0;
            if (actor.health && !actor.craftrasChallengeInjured && now >= (actor.craftrasNextChallengeRegenAt || 0)) {
                actor.craftrasNextChallengeRegenAt = now + CRAFTRAS_CHALLENGE_NPC_REGEN_INTERVAL;
                actor.health.amount = Math.min(actor.health.max, actor.health.amount + CRAFTRAS_CHALLENGE_NPC_REGEN_AMOUNT);
            }
            if (frozen) {
                this.freezeChallengeActor(actor, this.challengeStage !== "completed" && !actor.craftrasChallengeInjured);
            }
        }
        if (frozen) return;
        if (!this.updateChallengeKnightCombat(captain, now)) this.updateChallengeActorRoute(captain);
        const captainIndex = Math.floor(captain?.craftrasChallengeRouteIndex || this.challengeRouteStartIndex);
        if (king?.craftrasChallengeInjured) this.freezeChallengeActor(king);
        else this.updateChallengeRouteFollower(king, captainIndex - 5, 0, 1.8);
        const kingIndex = Math.floor(king?.craftrasChallengeRouteIndex || Math.max(this.challengeRouteStartIndex, captainIndex - 5));
        if (king?.craftrasChallengeInjured) this.freezeChallengeActor(guardian);
        else if (!this.updateChallengeKnightCombat(guardian, now)) this.updateChallengeRouteFollower(guardian, kingIndex - 1, 0.85, 1.8);
        // Two knights screen the King from the front while four protect the rear.
        const formationOffsets = [3, 3, -2, -2, -4, -4];
        for (let index = 0; index < knights.length; index++) {
            const anchorIndex = king?.craftrasChallengeInjured ? captainIndex - (Math.floor(index / 2) + 1) * 2 : kingIndex + formationOffsets[index];
            if (!this.updateChallengeKnightCombat(knights[index], now)) {
                this.updateChallengeRouteFollower(knights[index], anchorIndex, index % 2 === 0 ? -1 : 1, 2.5);
            }
        }
        this.faceChallengeActorAtCombatTarget(captain);
        this.faceChallengeActorAtCombatTarget(guardian);
        for (const knight of knights) this.faceChallengeActorAtCombatTarget(knight);
        if (captain?.craftrasChallengeRouteFinished) this.finishWorld1Challenge(now);
    }

    createChallengeEncounterState(now = Date.now()) {
        return {
            stage: 0,
            nextSpawnAt: Infinity,
            spawnEnabledAt: Infinity,
            triggeredMarkers: new Set(),
            kingInjuryAt: 0,
            kingAssassinSpawned: false,
            kingInjured: false,
            dialogue: null,
            dialogueQueue: [],
            completed: false,
            createdAt: now,
        };
    }

    setChallengeEncounterStage(stage, now = Date.now()) {
        const config = CRAFTRAS_CHALLENGE_SPAWN_STAGES[stage];
        if (!config) return false;
        this.challengeEncounter ||= this.createChallengeEncounterState(now);
        this.challengeEncounter.stage = stage;
        this.challengeEncounter.spawnEnabledAt = now + CRAFTRAS_CHALLENGE_STAGE_SPAWN_DELAY;
        this.challengeEncounter.nextSpawnAt = this.challengeEncounter.spawnEnabledAt;
        let excess = Math.max(0, this.getChallengeHostiles().length - config.cap);
        if (excess) {
            for (const mob of this.getChallengeHostiles()) {
                if (!excess || mob.craftrasChallengeSpecial) continue;
                mob.craftrasChallengeNoLoot = true;
                mob.destroy?.();
                this.mobs.delete(mob);
                excess--;
            }
        }
        console.log(`[Craftras World 1 Challenge] Encounter stage ${stage}: spawning begins in ${CRAFTRAS_CHALLENGE_STAGE_SPAWN_DELAY / 1000}s, cap=${config.cap}, interval=${config.interval}ms.`);
        return true;
    }

    getChallengeHostiles() {
        return [...this.mobs].filter(mob => mob?.craftrasChallengeHostile && !mob.isDead?.());
    }

    findChallengeHostileSpawn(players, options = {}) {
        const anchors = players?.length
            ? players.map(({ body }) => body).filter(Boolean)
            : [...this.challengeActors].filter(actor => actor && !actor.isDead?.());
        if (!anchors.length) return null;
        const minDistance = options.minDistance ?? 7;
        const maxDistance = options.maxDistance ?? 14;
        for (let attempt = 0; attempt < 100; attempt++) {
            const anchor = anchors[Math.floor(Math.random() * anchors.length)];
            const center = worldToBlock(anchor.x, anchor.y);
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * Math.max(1, maxDistance - minDistance);
            const x = center.x + Math.round(Math.cos(angle) * distance);
            const y = center.y + Math.round(Math.sin(angle) * distance);
            if (!options.ignoreRoute && this.challengeRouteProtectedCells.has(this.wallKey(x, y))) continue;
            const cell = this.getCell(x, y);
            if (!cell || cell.floor === FLOORS.WATER || this.isMovementBlockingBlock(this.getBlock(x, y))) continue;
            const location = blockToWorld(x, y);
            if (anchors.some(body => Math.hypot(body.x - location.x, body.y - location.y) < BLOCK_SIZE * 4.5)) continue;
            const spawnProbe = { ...location, craftrasMobFamily: "zombie", craftrasChallengeHostile: true };
            if (!anchors.some(body => this.hasLineOfSight(spawnProbe, body))) continue;
            if (this.placementOverlapsEntity(x, y)) continue;
            return location;
        }
        return null;
    }

    getChallengeZombieType(config) {
        const roll = Math.random();
        if (roll < config.giant) return "giant_zombie";
        if (roll < config.giant + config.runner) return "runner_zombie";
        const equipped = Math.random() < config.equipped;
        return equipped ? {
            type: "zombie",
            scoreType: "zombie",
            label: "Armored Zombie",
            health: 200,
            helmet: "iron",
            sword: "iron",
            swordDamage: 40,
            contactDamage: 20,
            scoreMultiplier: 1.5,
        } : "zombie";
    }

    spawnChallengeHostile(type, location, options = {}) {
        const mob = this.spawnMobAt(location, type);
        if (!mob) return null;
        mob.craftrasChallengeHostile = true;
        mob.craftrasChallengeSpecial = options.special || null;
        mob.craftrasSunImmune = true;
        mob.alwaysActive = true;
        mob.craftrasChallengeNoLoot = true;
        mob.craftrasScoreMultiplier = 0;
        mob.skill.score = 0;
        if (mob.craftrasMobType === "runner_zombie") {
            mob.craftrasNoAttackKnockback = true;
            mob.craftrasContactDamage = 20;
        } else if (mob.craftrasMobType === "titan_zombie") {
            mob.craftrasContactDamage = 80;
            mob.craftrasNextTitanDashAt = Date.now() + 1200;
            mob.craftrasTitanDash = null;
            mob.craftrasNoKnockback = false;
        } else if (mob.craftrasMobType === "magical_zombie") {
            mob.craftrasFinalDashPhasing = true;
            mob.craftrasNoKnockback = true;
            mob.craftrasContactDamage = 0;
            mob.alpha = 0;
            mob.craftrasMagicFadeInAt = 0;
            mob.craftrasMagicFadeOutAt = 0;
            mob.craftrasMagicFadeOutAlpha = 0;
        } else if (mob.craftrasMobType === "cursed_zombie") {
            mob.craftrasContactDamage = 0;
            mob.craftrasNoAttackKnockback = true;
            mob.alpha = 0.4;
        }
        return mob;
    }

    ensureChallengeSpecial(type, players, now = Date.now()) {
        const existing = this.getChallengeHostiles().find(mob => mob.craftrasMobType === type);
        if (existing) return existing;
        const location = this.findChallengeHostileSpawn(players, { minDistance: 10, maxDistance: 16, ignoreRoute: type === "magical_zombie" });
        if (!location) return null;
        const mob = this.spawnChallengeHostile(type, location, { special: type, noLoot: type === "magical_zombie" });
        if (mob && type === "magical_zombie") mob.craftrasMagicOrbitPhase = Math.random() * Math.PI * 2;
        if (mob && type === "titan_zombie") mob.craftrasNextTitanDashAt = now + 1500;
        return mob;
    }

    triggerChallengeStoryMarker(index, players, now = Date.now()) {
        const encounter = this.challengeEncounter;
        if (!encounter || encounter.triggeredMarkers.has(index)) return;
        encounter.triggeredMarkers.add(index);
        if (index >= 2 && index <= 7) this.setChallengeEncounterStage(index, now);
        const captain = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "captain" && !actor.isDead?.());
        const king = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "king" && !actor.isDead?.());
        const guardian = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "guardian" && !actor.isDead?.());
        const knight = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "knight" && !actor.isDead?.());
        const citizen = index === 1 ? this.ensureChallengeDialogueCitizen(players) : null;
        const magicalZombie = index >= 4
            ? this.getChallengeHostiles().find(mob => mob?.craftrasMobType === "magical_zombie" && !mob.isDead?.())
                || this.ensureChallengeSpecial("magical_zombie", players, now)
            : null;
        const storyLines = {
            1: [
                { speaker: citizen, name: "Citizen", text: "Help us!", duration: 2_500 },
                { speaker: knight, name: "Knight", text: "Everyone, gather here! Move, now!", duration: 3_500 },
            ],
            2: [
                { speaker: captain, name: "Knight Captain", text: "The fog makes it terribly dark...", duration: 4_000 },
                { speaker: captain, name: "Knight Captain", text: "Place a torch.", duration: 3_000 },
                { speaker: captain, name: "Knight Captain", text: "Otherwise, we won't be able to see anything.", duration: 4_000 },
            ],
            3: [
                { speaker: captain, name: "Knight Captain", text: "Damn it, they're swarming us. Get ready!", duration: 4_000 },
            ],
            4: [
                { speaker: king, name: "King", text: "This cave is...", duration: 3_000 },
                { speaker: captain, name: "Knight Captain", text: "Damn it.", duration: 2_000 },
                { speaker: captain, name: "Knight Captain", text: "To think this is our only path...", duration: 4_000 },
                { speaker: magicalZombie, name: "Magical Zombie", text: "WHERE ARE YOU GOING?", duration: 4_000, color: "#ff3030" },
            ],
            5: [
                { speaker: captain, name: "Knight Captain", text: "We get out of here as fast as possible.", duration: 5_000 },
            ],
            6: [
                { speaker: guardian, name: "Royal Guardian", text: "I'll protect the king, so go on ahead!", duration: 4_000 },
                { speaker: magicalZombie, name: "Magical Zombie", text: "DON'T RUN!!!!", duration: 4_000, color: "#ff3030" },
            ],
            7: [
                { speaker: magicalZombie, name: "Magical Zombie", text: "KILL ALL", duration: 4_000, color: "#ff3030" },
            ],
        }[index];
        if (storyLines) this.queueChallengeDialogue(storyLines, now);
        if (index === 5) {
            encounter.kingInjuryAt = now + 20_000;
        }
        console.log(`[Craftras World 1 Challenge] text_story_${index} triggered.`);
    }

    queueChallengeDialogue(lines, now = Date.now()) {
        const encounter = this.challengeEncounter;
        if (!encounter || !Array.isArray(lines) || !lines.length) return false;
        encounter.dialogueQueue ||= [];
        const dialogue = { index: 0, nextAt: now, lines };
        if (encounter.dialogue) encounter.dialogueQueue.push(dialogue);
        else encounter.dialogue = dialogue;
        return true;
    }

    ensureChallengeDialogueCitizen(players = []) {
        const existing = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "citizen" && !actor.isDead?.());
        if (existing) return existing;
        const anchor = players.find(entry => entry?.body && !entry.body.isDead?.())?.body
            || [...this.challengeActors].find(actor => actor && !actor.isDead?.());
        if (!anchor) return null;
        let location = { x: anchor.x + BLOCK_SIZE * 1.5, y: anchor.y };
        for (let index = 0; index < 16; index++) {
            const angle = index * Math.PI / 8;
            const candidate = {
                x: anchor.x + Math.cos(angle) * BLOCK_SIZE * 1.5,
                y: anchor.y + Math.sin(angle) * BLOCK_SIZE * 1.5,
            };
            const block = worldToBlock(candidate.x, candidate.y);
            if (this.getBlock(block.x, block.y) === BLOCKS.AIR) {
                location = candidate;
                break;
            }
        }
        const citizen = this.configureChallengeActor(this.spawnMobAt(location, "villager"), "citizen", 0, location);
        if (!citizen) return null;
        citizen.craftrasChallengeWaiting = false;
        citizen.craftrasChallengeRouteIndex = this.findNearestChallengeRouteIndex(citizen, this.challengeRouteStartIndex, this.challengeRoute.length - 1);
        return citizen;
    }

    resolveChallengeDialogueSpeaker(line) {
        if (line?.speaker && !line.speaker.isDead?.()) return line.speaker;
        const roleByName = {
            "Knight Captain": "captain",
            King: "king",
            "Royal Guardian": "guardian",
            Knight: "knight",
            Citizen: "citizen",
        };
        const role = roleByName[line?.name];
        if (role) return [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === role && !actor.isDead?.()) || null;
        if (line?.name === "Magical Zombie") {
            return this.getChallengeHostiles().find(mob => mob?.craftrasMobType === "magical_zombie" && !mob.isDead?.()) || null;
        }
        return null;
    }

    detectChallengeStoryMarkers(players, now = Date.now()) {
        const encounter = this.challengeEncounter;
        if (!encounter || this.challengeStage !== "active") return;
        for (const [key, index] of this.textStoryMarkers) {
            if (encounter.triggeredMarkers.has(index)) continue;
            const [x, y] = key.split(",").map(Number);
            const marker = blockToWorld(x, y);
            if (players.some(({ body }) => Math.hypot(body.x - marker.x, body.y - marker.y) <= BLOCK_SIZE * 0.8)) {
                this.triggerChallengeStoryMarker(index, players, now);
            }
        }
    }

    spawnChallengeKingAssassin(players, now = Date.now()) {
        const encounter = this.challengeEncounter;
        const king = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "king" && !actor.isDead?.());
        if (!encounter || !king || encounter.kingAssassinSpawned || encounter.kingInjured) return null;
        const angle = Math.random() * Math.PI * 2;
        const location = {
            x: king.x + Math.cos(angle) * BLOCK_SIZE * 7,
            y: king.y + Math.sin(angle) * BLOCK_SIZE * 7,
        };
        const assassin = this.spawnChallengeHostile("runner_zombie", location, { special: "king_assassin", noLoot: true });
        if (!assassin) return null;
        assassin.craftrasChallengeKingAssassin = true;
        assassin.craftrasFinalDashPhasing = true;
        assassin.invuln = true;
        assassin.health.set(1_000_000_000);
        assassin.health.amount = assassin.health.max;
        encounter.kingAssassinSpawned = true;
        console.log("[Craftras World 1 Challenge] The invulnerable Runner Zombie is pursuing the King.");
        return assassin;
    }

    injureChallengeKing(assassin, now = Date.now()) {
        const encounter = this.challengeEncounter;
        const king = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "king" && !actor.isDead?.());
        const guardian = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "guardian" && !actor.isDead?.());
        if (!encounter || !king || encounter.kingInjured) return;
        encounter.kingInjured = true;
        king.craftrasChallengeInjured = true;
        king.health.amount = 1;
        guardian.craftrasChallengeGuardingKing = true;
        assassin.craftrasChallengeNoLoot = true;
        assassin.destroy?.();
        this.mobs.delete(assassin);
        this.queueChallengeDialogue([
            { speaker: king, name: "King", text: "Huff... huff....", duration: 3_000 },
            { speaker: guardian, name: "Royal Guardian", text: "No......", duration: 2_000 },
            { speaker: guardian, name: "Royal Guardian", text: "I'll protect the king, so go on ahead!", duration: 4_000 },
        ], now);
        console.log("[Craftras World 1 Challenge] The King was struck and left at 1 HP.");
    }

    updateChallengeDialogue(now = Date.now()) {
        const dialogue = this.challengeEncounter?.dialogue;
        if (!dialogue || now < dialogue.nextAt) return;
        if (dialogue.index >= dialogue.lines.length) {
            this.challengeEncounter.dialogue = this.challengeEncounter.dialogueQueue?.shift?.() || null;
            return;
        }
        const line = dialogue.lines[dialogue.index++];
        const speaker = this.resolveChallengeDialogueSpeaker(line);
        speaker?.say?.(line.text, line.duration);
        for (const socket of this.gameManager.clients) socket?.talk?.("BM", line.duration, `${line.name}: ${line.text}`, line.color || "#f2f2f2");
        dialogue.nextAt = now + line.duration;
    }

    updateChallengeEncounter(players, now = Date.now()) {
        if (!Config.craftras_world1_challenge_builder || !this.challengeEncounter) return;
        this.updateChallengeDialogue(now);
        if (this.challengeStage === "completed") {
            for (const mob of this.getChallengeHostiles()) {
                if (mob.craftrasMobType !== "magical_zombie" || now < (mob.craftrasChallengeFarewellUntil || 0)) continue;
                mob.destroy?.();
                this.mobs.delete(mob);
            }
            return;
        }
        if (this.challengeStage !== "active") return;
        this.detectChallengeStoryMarkers(players, now);
        const encounter = this.challengeEncounter;
        const spawningEnabled = now >= (encounter.spawnEnabledAt || 0);
        if (spawningEnabled && encounter.stage >= 5) this.ensureChallengeSpecial("magical_zombie", players, now);
        if (spawningEnabled && encounter.stage >= 7) this.ensureChallengeSpecial("titan_zombie", players, now);
        if (encounter.kingInjuryAt && now >= encounter.kingInjuryAt && !encounter.kingAssassinSpawned) this.spawnChallengeKingAssassin(players, now);
        const config = CRAFTRAS_CHALLENGE_SPAWN_STAGES[encounter.stage];
        if (!config || now < encounter.nextSpawnAt) return;
        encounter.nextSpawnAt = now + config.interval;
        if (this.getChallengeHostiles().length >= config.cap) return;
        const location = this.findChallengeHostileSpawn(players);
        if (!location) return;
        const spawned = this.spawnChallengeHostile(this.getChallengeZombieType(config), location);
        if (spawned && this.getChallengeHostiles().length >= config.cap && encounter.capLoggedForStage !== encounter.stage) {
            encounter.capLoggedForStage = encounter.stage;
            console.log(`[Craftras World 1 Challenge] Encounter stage ${encounter.stage} reached its ${config.cap}-zombie cap.`);
        }
    }

    updateChallengeKingAssassin(mob, now = Date.now()) {
        const king = [...this.challengeActors].find(actor => actor?.craftrasChallengeRole === "king" && !actor.isDead?.());
        if (!king || this.challengeEncounter?.kingInjured) {
            mob.destroy?.();
            this.mobs.delete(mob);
            return true;
        }
        mob.health.amount = mob.health.max;
        mob.damageReceived = 0;
        const dx = king.x - mob.x;
        const dy = king.y - mob.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance <= (mob.realSize || mob.size || 20) + (king.realSize || king.size || 20) + 8) {
            this.injureChallengeKing(mob, now);
            return true;
        }
        const step = Math.min(distance, BLOCK_SIZE * 0.19);
        mob.x += dx / distance * step;
        mob.y += dy / distance * step;
        mob.velocity.x = 0;
        mob.velocity.y = 0;
        mob.craftrasControl = {
            goal: { x: mob.x, y: mob.y },
            target: { x: dx, y: dy },
            fire: false,
            power: 0,
        };
        return true;
    }

    spawnChallengeMagicEntity(definition, location, options = {}) {
        const entity = new Entity({ x: location.x, y: location.y });
        entity.define(definition);
        entity.team = TEAM_ENEMIES;
        entity.alwaysActive = true;
        entity.craftrasChallengeMagicKind = options.kind || "visual";
        entity.craftrasChallengeMagicOwner = options.owner || null;
        entity.craftrasChallengeMagicTarget = options.target || null;
        entity.craftrasChallengeMagicDamage = options.damage || 0;
        entity.craftrasVelocity = options.velocity || { x: 0, y: 0 };
        entity.craftrasExpiresAt = options.expiresAt || Date.now() + 8_000;
        entity.craftrasHitIds = new Set();
        if (Number.isFinite(options.alpha)) entity.alpha = options.alpha;
        entity.on("dead", () => this.challengeMagicEntities.delete(entity));
        this.challengeMagicEntities.add(entity);
        return entity;
    }

    spawnChallengeMagicBullet(location, angle, speed, owner, options = {}) {
        return this.spawnChallengeMagicEntity("craftrasChallengeMagicBullet", location, {
            kind: options.kind || "linear",
            owner,
            target: options.target || null,
            damage: options.damage || CRAFTRAS_CHALLENGE_MAGIC_DAMAGE,
            velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
            expiresAt: options.expiresAt || Date.now() + 6_000,
            alpha: 0.9,
        });
    }

    clearChallengeMagicEntities(owner = null) {
        for (const entity of [...this.challengeMagicEntities]) {
            if (owner && entity.craftrasChallengeMagicOwner !== owner) continue;
            entity.destroy?.();
            this.challengeMagicEntities.delete(entity);
        }
    }

    finishChallengeMagicalZombieSkill(mob, state, now = Date.now()) {
        if (state?.circle) {
            state.circle.destroy?.();
            this.challengeMagicEntities.delete(state.circle);
        }
        mob.craftrasMagicFadeOutAt = now;
        mob.craftrasMagicFadeOutAlpha = Math.max(0, Math.min(0.95, mob.alpha ?? 0.95));
        mob.craftrasMagicCast = null;
        mob.craftrasMagicSkillIndex = (state?.skill || mob.craftrasMagicSkillIndex || 1) % 3 + 1;
        mob.craftrasMagicNextSkillAt = now + CRAFTRAS_CHALLENGE_MAGIC_SKILL_COOLDOWN;
    }

    startChallengeMagicalZombieSkill(mob, players, now = Date.now()) {
        const living = (players || []).map(entry => entry?.body).filter(body => body && !body.isDead?.() && !body.craftrasSpectator);
        if (!living.length) return false;
        const skill = Math.min(3, Math.max(1, mob.craftrasMagicSkillIndex || 1));
        const state = mob.craftrasMagicCast = { skill, startedAt: now };
        mob.craftrasMagicFadeInAt = now;
        mob.craftrasMagicFadeOutAt = 0;
        mob.craftrasMagicFadeOutAlpha = 0;
        if (skill === 1) {
            state.spawned = 0;
            state.endsAt = now + 15_000;
            state.nextCurseAt = now;
        } else if (skill === 2) {
            state.spawned = 0;
            state.nextCubeAt = now;
            state.endsAt = now + 4_300;
        } else {
            state.launchIndex = 0;
            state.nextLaunchAt = now + 2_000;
            state.orbits = [];
            for (const target of living) {
                for (let index = 0; index < 6; index++) {
                    const angle = index * Math.PI / 3;
                    const bullet = this.spawnChallengeMagicBullet(target, angle, 0, mob, {
                        kind: "orbit",
                        target,
                        expiresAt: now + 18_000,
                    });
                    bullet.craftrasMagicOrbitIndex = index;
                    bullet.craftrasMagicOrbitStartedAt = now;
                    state.orbits.push(bullet);
                }
            }
        }
        console.log(`[Craftras World 1 Challenge] Magical Zombie started skill ${skill}.`);
        return true;
    }

    updateChallengeMagicalZombieCombat(mob, players, now = Date.now()) {
        const encounter = this.challengeEncounter;
        if (!encounter || encounter.stage < 7 || now < (encounter.spawnEnabledAt || 0)) return;
        let state = mob.craftrasMagicCast;
        if (!state) {
            if (now < (mob.craftrasMagicNextSkillAt || 0)) return;
            if (!this.startChallengeMagicalZombieSkill(mob, players, now)) return;
            state = mob.craftrasMagicCast;
        }
        if (state.skill === 1) {
            if (state.spawned < CRAFTRAS_CHALLENGE_CURSE_COUNT && now >= state.nextCurseAt && now < state.endsAt) {
                const living = (players || []).map(entry => entry?.body).filter(body => body && !body.isDead?.() && !body.craftrasSpectator);
                if (living.length) this.spawnChallengeCursedZombie(mob, living[state.spawned % living.length], now);
                state.spawned++;
                state.nextCurseAt += CRAFTRAS_CHALLENGE_CURSE_SPAWN_INTERVAL;
            }
            if (now >= state.endsAt) this.finishChallengeMagicalZombieSkill(mob, state, now);
            return;
        }
        if (state.skill === 2) {
            if (state.spawned < 10 && now >= state.nextCubeAt) {
                const living = (players || []).map(entry => entry?.body).filter(body => body && !body.isDead?.() && !body.craftrasSpectator);
                if (living.length) {
                    const target = living[state.spawned % living.length];
                    const angle = Math.random() * Math.PI * 2;
                    const radius = BLOCK_SIZE * (2.5 + Math.random() * 3.5);
                    const cube = this.spawnChallengeMagicEntity("craftrasChallengeMagicCube", {
                        x: target.x + Math.cos(angle) * radius,
                        y: target.y + Math.sin(angle) * radius,
                    }, {
                        kind: "cube",
                        owner: mob,
                        expiresAt: now + 2_000,
                        alpha: 0.88,
                    });
                    cube.craftrasMagicBurstAt = now + 1_000;
                    cube.craftrasMagicBurstAngle = Math.random() * Math.PI * 2;
                }
                state.spawned++;
                state.nextCubeAt += 300;
            }
            if (state.spawned >= 10 && now >= state.endsAt) this.finishChallengeMagicalZombieSkill(mob, state, now);
            return;
        }
        if (state.skill === 3) {
            if (state.launchIndex < 6 && now >= state.nextLaunchAt) {
                for (const bullet of state.orbits) {
                    if (!bullet || bullet.isDead?.() || bullet.craftrasMagicOrbitIndex !== state.launchIndex) continue;
                    bullet.craftrasChallengeMagicKind = "pause";
                    bullet.craftrasMagicPauseUntil = now + 700;
                    bullet.craftrasVelocity = { x: 0, y: 0 };
                    bullet.craftrasExpiresAt = now + 6_000;
                }
                state.launchIndex++;
                state.nextLaunchAt += 2_000;
                if (state.launchIndex >= 6) state.completeAt = now + 900;
            }
            if (state.completeAt && now >= state.completeAt) this.finishChallengeMagicalZombieSkill(mob, state, now);
        }
    }

    updateChallengeMagicEntities(players, now = Date.now()) {
        for (const entity of [...this.challengeMagicEntities]) {
            if (!entity || entity.isDead?.() || now >= (entity.craftrasExpiresAt || 0)) {
                entity?.destroy?.();
                this.challengeMagicEntities.delete(entity);
                continue;
            }
            const owner = entity.craftrasChallengeMagicOwner;
            if (!owner || owner.isDead?.() || this.challengeStage === "completed") {
                entity.destroy?.();
                this.challengeMagicEntities.delete(entity);
                continue;
            }
            const kind = entity.craftrasChallengeMagicKind;
            if (kind === "circle") {
                const target = entity.craftrasChallengeMagicTarget;
                if (!target || target.isDead?.()) {
                    entity.destroy?.();
                    this.challengeMagicEntities.delete(entity);
                    continue;
                }
                entity.x = target.x;
                entity.y = target.y;
                entity.facing = (entity.facing || 0) + 0.025;
                entity.vfacing = entity.facing;
                continue;
            }
            if (kind === "cube") {
                entity.facing = (entity.facing || 0) + 0.07;
                entity.vfacing = entity.facing;
                if (now >= (entity.craftrasMagicBurstAt || Infinity)) {
                    for (let index = 0; index < 12; index++) {
                        this.spawnChallengeMagicBullet(entity, (entity.craftrasMagicBurstAngle || 0) + index * Math.PI / 6, 8, owner, { expiresAt: now + 8_000 });
                    }
                    this.spawnExplosionEffect(entity, { duration: 420, startSize: 14, growth: 0.7, color: "#9b72ff", alpha: 0.38 });
                    entity.destroy?.();
                    this.challengeMagicEntities.delete(entity);
                }
                continue;
            }
            if (kind === "orbit") {
                const target = entity.craftrasChallengeMagicTarget;
                if (!target || target.isDead?.()) {
                    entity.destroy?.();
                    this.challengeMagicEntities.delete(entity);
                    continue;
                }
                const angle = (now - (entity.craftrasMagicOrbitStartedAt || now)) / 420 + (entity.craftrasMagicOrbitIndex || 0) * Math.PI / 3;
                const radius = BLOCK_SIZE * 2.2;
                entity.x = target.x + Math.cos(angle) * radius;
                entity.y = target.y + Math.sin(angle) * radius;
                entity.facing = angle + Math.PI / 2;
                entity.vfacing = entity.facing;
                continue;
            }
            if (kind === "pause") {
                entity.facing = (entity.facing || 0) + 0.05;
                entity.vfacing = entity.facing;
                if (now < (entity.craftrasMagicPauseUntil || 0)) continue;
                const target = entity.craftrasChallengeMagicTarget;
                if (!target || target.isDead?.()) {
                    entity.destroy?.();
                    this.challengeMagicEntities.delete(entity);
                    continue;
                }
                const dx = target.x - entity.x;
                const dy = target.y - entity.y;
                const distance = Math.hypot(dx, dy) || 1;
                entity.craftrasVelocity = { x: dx / distance * 48, y: dy / distance * 48 };
                entity.craftrasChallengeMagicKind = "linear";
            }
            entity.x += entity.craftrasVelocity?.x || 0;
            entity.y += entity.craftrasVelocity?.y || 0;
            entity.facing = Math.atan2(entity.craftrasVelocity?.y || 0, entity.craftrasVelocity?.x || 1);
            entity.vfacing = entity.facing;
            const block = worldToBlock(entity.x, entity.y);
            if (this.isMovementBlockingBlock(this.getBlock(block.x, block.y))) {
                entity.destroy?.();
                this.challengeMagicEntities.delete(entity);
                continue;
            }
            const hitRadius = Math.max(10, entity.realSize || entity.size || 14);
            for (const { body } of players || []) {
                if (!body || body.isDead?.() || body.craftrasSpectator || entity.craftrasHitIds.has(body.id)) continue;
                const dx = body.x - entity.x;
                const dy = body.y - entity.y;
                const radius = hitRadius + Math.max(8, body.realSize || body.size || 12);
                if (dx * dx + dy * dy > radius * radius) continue;
                entity.craftrasHitIds.add(body.id);
                this.applyPlayerDamage(body, entity.craftrasChallengeMagicDamage || CRAFTRAS_CHALLENGE_MAGIC_DAMAGE, owner);
                entity.destroy?.();
                this.challengeMagicEntities.delete(entity);
                break;
            }
        }
    }

    spawnChallengeCursedZombie(owner, target, now = Date.now()) {
        if (!owner || !target || target.isDead?.()) return null;
        const players = [{ socket: this.getSocketForBody(target), body: target }];
        const location = this.findChallengeHostileSpawn(players, { minDistance: 7, maxDistance: 11, ignoreRoute: true });
        if (!location) return null;
        const cursed = this.spawnChallengeHostile("cursed_zombie", location, { special: "cursed_zombie" });
        if (!cursed) return null;
        cursed.craftrasCurseOwner = owner;
        cursed.craftrasCurseTarget = target;
        cursed.craftrasCurseExpiresAt = now + 20_000;
        return cursed;
    }

    applyChallengeCurse(body, now = Date.now()) {
        if (!body || body.isDead?.() || body.craftrasSpectator) return false;
        body.craftrasCursedUntil = Math.max(body.craftrasCursedUntil || 0, now + CRAFTRAS_CHALLENGE_CURSE_DURATION);
        this.getSocketForBody(body)?.talk?.("CD", CRAFTRAS_CHALLENGE_CURSE_DURATION);
        return true;
    }

    updateChallengeCursedZombie(mob, players, now = Date.now()) {
        if (!mob || mob.isDead?.()) return true;
        if (this.challengeStage === "completed" || now >= (mob.craftrasCurseExpiresAt || 0)) {
            mob.craftrasChallengeNoLoot = true;
            mob.destroy?.();
            this.mobs.delete(mob);
            return true;
        }
        mob.alpha = 0.4;
        mob.color.base = Math.floor(now / 200) % 2 ? "#080808" : "#b00020";
        let target = mob.craftrasCurseTarget;
        if (!target || target.isDead?.() || target.craftrasSpectator) {
            target = this.nearestPlayer(mob, players)?.body || null;
            mob.craftrasCurseTarget = target;
        }
        if (!target) return true;
        const nearest = this.updateChallengeHostileNavigation(mob, [{ socket: this.getSocketForBody(target), body: target }], now);
        if (!nearest?.body) return true;
        const contactRange = (mob.realSize || mob.size || 48) + (target.realSize || target.size || 12) + 3;
        if (nearest.distance > contactRange) return true;
        this.applyChallengeCurse(target, now);
        mob.craftrasChallengeNoLoot = true;
        mob.destroy?.();
        this.mobs.delete(mob);
        return true;
    }

    updateChallengeMagicalZombieVisibility(mob, now = Date.now()) {
        if (mob.craftrasMagicCast) {
            const progress = Math.max(0, Math.min(1, (now - (mob.craftrasMagicFadeInAt || now)) / CRAFTRAS_CHALLENGE_MAGIC_FADE_DURATION));
            mob.alpha = 0.95 * progress;
            return;
        }
        if (mob.craftrasMagicFadeOutAt) {
            const progress = Math.max(0, Math.min(1, (now - mob.craftrasMagicFadeOutAt) / CRAFTRAS_CHALLENGE_MAGIC_FADE_DURATION));
            mob.alpha = (mob.craftrasMagicFadeOutAlpha || 0) * (1 - progress);
            if (progress >= 1) {
                mob.alpha = 0;
                mob.craftrasMagicFadeOutAt = 0;
                mob.craftrasMagicFadeOutAlpha = 0;
            }
            return;
        }
        mob.alpha = 0;
    }

    updateChallengeMagicalZombie(mob, players, now = Date.now()) {
        mob.craftrasFinalDashPhasing = true;
        mob.health.amount = mob.health.max;
        mob.damageReceived = 0;
        if (this.challengeStage === "completed") {
            this.freezeChallengeActor(mob);
            const remaining = Math.max(0, (mob.craftrasChallengeFarewellUntil || now) - now);
            mob.alpha = Math.min(0.95, (mob.craftrasChallengeFarewellStartAlpha || 0) * remaining / 5_000);
            return true;
        }
        const nearest = this.nearestPlayer(mob, players);
        if (!nearest?.body) {
            this.updateChallengeMagicalZombieVisibility(mob, now);
            return true;
        }
        const target = nearest.body;
        const phase = (mob.craftrasMagicOrbitPhase || 0) + now / 420;
        const radius = BLOCK_SIZE * 7.5;
        const goal = {
            x: target.x + Math.cos(phase) * radius,
            y: target.y + Math.sin(phase) * radius,
        };
        const dx = goal.x - mob.x;
        const dy = goal.y - mob.y;
        const distance = Math.hypot(dx, dy) || 1;
        const speed = Math.min(distance, BLOCK_SIZE * 0.16);
        mob.x += dx / distance * speed;
        mob.y += dy / distance * speed;
        mob.velocity.x = 0;
        mob.velocity.y = 0;
        mob.facing = Math.atan2(target.y - mob.y, target.x - mob.x);
        mob.vfacing = mob.facing;
        mob.craftrasControl = {
            goal: { x: mob.x, y: mob.y },
            target: { x: target.x - mob.x, y: target.y - mob.y },
            fire: false,
            power: 0,
        };
        this.updateChallengeMagicalZombieCombat(mob, players, now);
        this.updateChallengeMagicalZombieVisibility(mob, now);
        return true;
    }

    updateChallengeTitanZombie(mob, players, now = Date.now()) {
        const nearest = this.nearestPlayer(mob, players);
        if (!nearest?.body) return true;
        const target = nearest.body;
        if (nearest.distance > BLOCK_SIZE * 28) {
            const angle = Math.random() * Math.PI * 2;
            mob.x = target.x + Math.cos(angle) * BLOCK_SIZE * 10;
            mob.y = target.y + Math.sin(angle) * BLOCK_SIZE * 10;
            mob.velocity.x = 0;
            mob.velocity.y = 0;
            mob.craftrasTitanDash = null;
            mob.craftrasNextTitanDashAt = now + 1200;
        }
        let dash = mob.craftrasTitanDash;
        if (!dash && now >= (mob.craftrasNextTitanDashAt || 0)) {
            const dx = target.x - mob.x;
            const dy = target.y - mob.y;
            const distance = Math.hypot(dx, dy) || 1;
            dash = mob.craftrasTitanDash = {
                direction: { x: dx / distance, y: dy / distance },
                targetPoint: { x: target.x, y: target.y },
                slowAt: 0,
                hitIds: new Set(),
            };
        }
        if (dash) {
            const distancePast = (mob.x - dash.targetPoint.x) * dash.direction.x + (mob.y - dash.targetPoint.y) * dash.direction.y;
            if (!dash.slowAt && distancePast >= 0) dash.slowAt = now + 200;
            const dashSpeed = CRAFTRAS_GUARDIAN_SLASH_SPEED / 1.3;
            const speedScale = dash.slowAt ? Math.max(0.08, (dash.slowAt - now) / 200) : 1;
            mob.x += dash.direction.x * dashSpeed * speedScale;
            mob.y += dash.direction.y * dashSpeed * speedScale;
            mob.craftrasControl = {
                goal: { x: mob.x, y: mob.y },
                target: { x: dash.direction.x, y: dash.direction.y },
                fire: false,
                power: 0,
            };
            if (now >= (mob.craftrasNextTitanTrailAt || 0)) {
                mob.craftrasNextTitanTrailAt = now + 70;
                this.spawnExplosionEffect({ x: mob.x, y: mob.y }, {
                    duration: 360,
                    startSize: Math.max(12, (mob.realSize || mob.size || 48) * 0.45),
                    endSize: Math.max(18, (mob.realSize || mob.size || 48) * 0.72),
                    color: "#315d35",
                    alpha: 0.18,
                    fade: true,
                });
            }
            for (const { body } of players) {
                if (!body || body.isDead?.() || dash.hitIds.has(body.id)) continue;
                const hitRange = (mob.realSize || mob.size || 48) + (body.realSize || body.size || 12) + 8;
                if (Math.hypot(body.x - mob.x, body.y - mob.y) > hitRange) continue;
                dash.hitIds.add(body.id);
                this.applyCombatTargetDamage(body, 80, mob);
            }
            if (dash.slowAt && now >= dash.slowAt) {
                mob.craftrasTitanDash = null;
                mob.craftrasNextTitanDashAt = now + 5_000;
            }
            return true;
        }
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        mob.craftrasControl = {
            goal: { x: target.x, y: target.y },
            target: { x: dx, y: dy },
            fire: false,
            power: 1,
        };
        return true;
    }

    finishWorld1Challenge(now = Date.now()) {
        if (!Config.craftras_world1_challenge_builder || this.challengeStage === "completed") return;
        this.challengeStage = "completed";
        this.challengeEscortMoving = false;
        this.clearChallengeMagicEntities();
        if (this.challengeEncounter) this.challengeEncounter.completed = true;
        for (const mob of this.getChallengeHostiles()) {
            if (mob.craftrasMobType === "magical_zombie") {
                mob.say?.(CRAFTRAS_CHALLENGE_MAGICIAN_FAREWELL, 5_000);
                mob.craftrasChallengeFarewellUntil = now + 5_000;
                mob.craftrasChallengeFarewellStartAlpha = Math.max(0, Math.min(0.95, mob.alpha || 0));
                for (const socket of this.gameManager.clients) socket?.talk?.("BM", 5_000, CRAFTRAS_CHALLENGE_MAGICIAN_FAREWELL, "#ff3030");
            } else if (mob.craftrasMobType === "titan_zombie") {
                mob.destroy?.();
                this.mobs.delete(mob);
            }
        }
        this.weatherType = "clear";
        this.weatherRainElapsed = 0;
        this.weatherCheckElapsed = 0;
        this.syncWeather(true);
        console.log("[Craftras World 1 Challenge] The escort reached the village. Spawning and rain stopped.");
    }

    startWorld1ChallengeFailure(now = Date.now()) {
        if (!Config.craftras_world1_challenge_builder || this.challengeFailure || !["intro", "active"].includes(this.challengeStage)) return false;
        this.challengeStage = "failed";
        this.challengeEscortMoving = false;
        this.challengeIntro = null;
        this.clearChallengeMagicEntities();
        if (this.challengeEncounter) {
            this.challengeEncounter.dialogue = null;
            this.challengeEncounter.dialogueQueue = [];
        }
        for (const mob of this.getChallengeHostiles()) {
            mob.craftrasChallengeNoLoot = true;
            mob.destroy?.();
            this.mobs.delete(mob);
        }
        this.challengeFailure = {
            fadeAt: now + CRAFTRAS_CHALLENGE_FAIL_MESSAGE_DURATION,
            transferAt: now + CRAFTRAS_CHALLENGE_FAIL_MESSAGE_DURATION + CRAFTRAS_CHALLENGE_TRANSITION_OUT_MS,
            fadeStarted: false,
            transferred: false,
        };
        for (const socket of this.gameManager.clients) {
            socket?.talk?.("BM", CRAFTRAS_CHALLENGE_FAIL_MESSAGE_DURATION, "CHALLENGE FAIL - All players have died.", "#ff3030");
        }
        console.log("[Craftras World 1 Challenge] CHALLENGE FAIL. All players have died.");
        return true;
    }

    updateWorld1ChallengeFailure(now = Date.now()) {
        const failure = this.challengeFailure;
        if (!failure) return false;
        if (!failure.fadeStarted && now >= failure.fadeAt) {
            failure.fadeStarted = true;
            for (const socket of this.gameManager.clients) socket?.talk?.("CTR", 1, CRAFTRAS_CHALLENGE_TRANSITION_OUT_MS);
        }
        if (!failure.transferred && now >= failure.transferAt) {
            failure.transferred = true;
            for (const socket of [...this.gameManager.clients]) {
                const mainPort = Number(process.env.PORT) || 3000;
                this.gameManager.socketManager.sendToServer(socket, `http://127.0.0.1:${mainPort}`, "/");
            }
        }
        return true;
    }

    findChallengeActorSpawnLocations(count) {
        const spawnPoints = this.getChallengeSpawnPoints();
        const fallback = worldToBlock(this.spawnPoint?.x || blockToWorld(-300, -310).x, this.spawnPoint?.y || blockToWorld(-300, -310).y);
        const center = spawnPoints.length
            ? worldToBlock(
                spawnPoints.reduce((sum, point) => sum + point.x, 0) / spawnPoints.length,
                spawnPoints.reduce((sum, point) => sum + point.y, 0) / spawnPoints.length,
            )
            : fallback;
        const locations = [];
        const used = new Set();
        for (let attempt = 0; attempt < 320 && locations.length < count; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 2 + Math.random() * 5;
            const x = center.x + Math.round(Math.cos(angle) * distance);
            const y = center.y + Math.round(Math.sin(angle) * distance);
            const key = this.wallKey(x, y);
            const cell = this.getCell(x, y);
            if (used.has(key) || this.getBlock(x, y) !== BLOCKS.AIR || cell?.floor === FLOORS.WATER) continue;
            if (locations.some(location => Math.hypot(location.blockX - x, location.blockY - y) < 1.5)) continue;
            used.add(key);
            locations.push({ ...blockToWorld(x, y), blockX: x, blockY: y });
        }
        while (locations.length < count) {
            const index = locations.length;
            const x = center.x + 2 + index % 4;
            const y = center.y + 2 + Math.floor(index / 4);
            locations.push({ ...blockToWorld(x, y), blockX: x, blockY: y });
        }
        return locations;
    }

    configureChallengeActor(mob, role, index, location) {
        if (!mob) return null;
        mob.name = role === "knight"
            ? "Knight"
            : role === "captain"
                ? "Knight Captain"
                : role === "guardian" ? "Royal Guardian" : role === "citizen" ? "Citizen" : "King";
        mob.craftrasBaseName = mob.name;
        mob.craftrasChallengeActor = true;
        mob.craftrasChallengeRole = role;
        mob.craftrasChallengeActorIndex = index;
        mob.craftrasChallengeWaiting = true;
        mob.craftrasNextChallengeRegenAt = Date.now() + CRAFTRAS_CHALLENGE_NPC_REGEN_INTERVAL;
        mob.craftrasHome = { x: location.x, y: location.y };
        mob.craftrasNpcWanderRadius = 8;
        mob.craftrasInvulnerableNpc = false;
        const roleHealth = role === "knight" ? 600 : role === "captain" ? 1_200 : role === "guardian" ? 2_000 : role === "king" ? 500 : role === "citizen" ? 200 : null;
        if (roleHealth) {
            mob.health.set(roleHealth);
            mob.health.amount = mob.health.max;
        }
        if (role === "guardian") {
            mob.craftrasHeldItem = "iron_sword";
            mob.craftrasMainHandStack = makeItem("iron_sword");
            mob.craftrasOffhandShield = makeItem("knight_shield");
            mob.syncTurrets?.();
        }
        mob.craftrasControl = { goal: { x: location.x, y: location.y }, target: { x: 1, y: 0 }, fire: false, power: 0 };
        mob.on("damage", () => {
            if (this.challengeStage === "active") {
                mob.craftrasNextChallengeRegenAt = Date.now() + CRAFTRAS_CHALLENGE_NPC_REGEN_INTERVAL;
                return;
            }
            mob.damageReceived = 0;
            mob.health.amount = mob.health.max;
            mob.readyToDie = false;
        });
        this.challengeActors.add(mob);
        return mob;
    }

    spawnChallengeInitialCast() {
        if (!Config.craftras_world1_challenge_builder) return [];
        const locations = this.findChallengeActorSpawnLocations(9);
        const actors = [];
        for (let index = 0; index < 6; index++) {
            const mob = this.spawnMobAt(locations[index], "guard");
            actors.push(this.configureChallengeActor(mob, "knight", index, locations[index]));
        }
        const captain = this.spawnMobAt(locations[6], "captain");
        actors.push(this.configureChallengeActor(captain, "captain", 0, locations[6]));
        const king = this.spawnMobAt(locations[7], "challenge_king");
        actors.push(this.configureChallengeActor(king, "king", 0, locations[7]));
        const guardian = this.spawnMobAt(locations[8], "royal_guardian");
        actors.push(this.configureChallengeActor(guardian, "guardian", 0, locations[8]));
        console.log(`[Craftras World 1 Challenge] Initial cast ready: ${actors.filter(Boolean).length}/9 actors. Hostile spawning is paused until CHALLENGE START.`);
        return actors.filter(Boolean);
    }

    buildOutsideSpawnPool(limit = 512) {
        const halfWidth = Math.floor(BLOCKS_X / 2);
        const halfHeight = Math.floor(BLOCKS_Y / 2);
        const pool = [];
        const used = new Set();

        for (let attempt = 0; attempt < 50000 && pool.length < limit; attempt++) {
            const x = Math.floor(Math.random() * (BLOCKS_X - 4)) - halfWidth + 2;
            const y = Math.floor(Math.random() * (BLOCKS_Y - 4)) - halfHeight + 2;
            const key = this.wallKey(x, y);
            if (!used.has(key) && this.isGoodOutsideSpawnCell(x, y)) {
                used.add(key);
                pool.push({ blockX: x, blockY: y });
            }
        }

        if (!pool.length) {
            for (let y = -halfHeight + 2; y < halfHeight - 2 && pool.length < limit; y++) {
                for (let x = -halfWidth + 2; x < halfWidth - 2 && pool.length < limit; x++) {
                    if (this.isGoodOutsideSpawnCell(x, y)) pool.push({ blockX: x, blockY: y });
                }
            }
        }
        return pool;
    }

    getRandomOutsideSpawn(options = {}) {
        if (!this.spawnPool.length) this.spawnPool = this.buildOutsideSpawnPool();
        for (let attempt = 0; attempt < 32; attempt++) {
            const candidate = this.spawnPool[Math.floor(Math.random() * this.spawnPool.length)];
            if (!candidate || !this.isGoodOutsideSpawnCell(candidate.blockX, candidate.blockY, options)) continue;
            return blockToWorld(candidate.blockX, candidate.blockY);
        }
        const candidate = this.spawnPool.find(entry => this.isGoodOutsideSpawnCell(entry.blockX, entry.blockY, options));
        if (!candidate) throw new Error("Craftras could not find a safe outside spawn cell.");
        return blockToWorld(candidate.blockX, candidate.blockY);
    }

    countNearbySurfaceCells(blockX, blockY, radius = 8) {
        let count = 0;
        for (let y = blockY - radius; y <= blockY + radius; y++) {
            for (let x = blockX - radius; x <= blockX + radius; x++) {
                const cell = this.getCell(x, y);
                if (cell?.region === "surface" && cell.floor !== FLOORS.WATER && this.getBlock(x, y) === BLOCKS.AIR) count++;
            }
        }
        return count;
    }

    getSwordGuyIslandSpawn() {
        if (!this.spawnPool.length) this.spawnPool = this.buildOutsideSpawnPool();
        const halfWidth = Math.floor(BLOCKS_X / 2);
        const halfHeight = Math.floor(BLOCKS_Y / 2);
        const minX = Math.floor(halfWidth * 0.18);
        const minY = Math.floor(halfHeight * 0.18);
        let best = null;
        let bestScore = -Infinity;
        const consider = candidate => {
            if (!candidate || candidate.blockX < minX || candidate.blockY < minY) return;
            const { blockX, blockY } = candidate;
            if (!this.isSafeOutsideSpawnCell(blockX, blockY, 2)) return;
            const landScore = this.countNearbySurfaceCells(blockX, blockY, 10);
            const southeastScore = blockX + blockY;
            const score = landScore * 12 + southeastScore;
            if (score <= bestScore) return;
            bestScore = score;
            best = candidate;
        };
        for (const candidate of this.spawnPool) consider(candidate);
        if (!best) {
            for (let y = minY; y < halfHeight - 3; y += 3) {
                for (let x = minX; x < halfWidth - 3; x += 3) consider({ blockX: x, blockY: y });
            }
        }
        return best ? blockToWorld(best.blockX, best.blockY) : this.getRandomOutsideSpawn();
    }

    getLivingPlayers() {
        const players = [];
        for (const socket of this.gameManager.clients) {
            const body = socket?.player?.body;
            if (body && !body.isDead?.() && !body.craftrasSpectator) players.push({ socket, body });
        }
        return players;
    }

    getConnectedPlayerBodies() {
        const players = [];
        for (const socket of this.gameManager.clients) {
            const body = socket?.player?.body;
            if (body && !body.isDead?.()) players.push({ socket, body });
        }
        return players;
    }

    loadVillageNpcSpawns() {
        const fallback = Config.craftras_blacksmith_spawn || { x: -287, y: 322 };
        this.villageNpcSpawns = {
            blacksmith: {
                x: Math.trunc(Number(fallback.x)),
                y: Math.trunc(Number(fallback.y)),
            },
        };
        if (!fs.existsSync(VILLAGE_NPC_SPAWNS_FILE)) return this.villageNpcSpawns;
        try {
            const data = JSON.parse(fs.readFileSync(VILLAGE_NPC_SPAWNS_FILE, "utf8"));
            for (const type of VILLAGE_SPAWNPOINT_NPC_TYPES) {
                const spawn = data?.[type];
                const x = Math.trunc(Number(spawn?.x));
                const y = Math.trunc(Number(spawn?.y));
                if (Number.isFinite(x) && Number.isFinite(y)) this.villageNpcSpawns[type] = { x, y };
            }
        } catch (error) {
            console.error(`[Craftras Village] Could not load NPC spawnpoints: ${error.message}`);
        }
        return this.villageNpcSpawns;
    }

    saveVillageNpcSpawns() {
        fs.mkdirSync(path.dirname(VILLAGE_NPC_SPAWNS_FILE), { recursive: true });
        const temporaryFile = `${VILLAGE_NPC_SPAWNS_FILE}.tmp`;
        fs.writeFileSync(temporaryFile, `${JSON.stringify(this.villageNpcSpawns, null, 2)}\n`, "utf8");
        fs.renameSync(temporaryFile, VILLAGE_NPC_SPAWNS_FILE);
    }

    setVillageNpcSpawnPoint(type, x, y) {
        type = String(type || "").toLowerCase();
        if (!VILLAGE_SPAWNPOINT_NPC_TYPES.includes(type)) throw new Error("Invalid village NPC spawnpoint type.");
        x = Math.trunc(Number(x));
        y = Math.trunc(Number(y));
        if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`Invalid ${type} spawnpoint.`);
        this.villageNpcSpawns[type] = { x, y };
        this.saveVillageNpcSpawns();
        const location = blockToWorld(x, y);
        let npc = null;
        for (const mob of this.mobs) {
            if (mob?.craftrasMobType === type && !mob.isDead?.()) {
                npc = mob;
                break;
            }
        }
        if (!npc) npc = this.spawnMobAt(location, type, { fixed: true });
        this.configureVillageStaticNpc(npc, type, 0, location);
        return { x, y };
    }

    setBlacksmithSpawnPoint(x, y) {
        return this.setVillageNpcSpawnPoint("blacksmith", x, y);
    }

    spawnVillageNpcs() {
        const blacksmithSpawn = this.villageNpcSpawns.blacksmith || Config.craftras_blacksmith_spawn;
        if (!blacksmithSpawn) return;
        const x = Math.trunc(Number(blacksmithSpawn.x));
        const y = Math.trunc(Number(blacksmithSpawn.y));
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        this.configureVillageStaticNpc(this.spawnMobAt(blockToWorld(x, y), "blacksmith", { fixed: true }), "blacksmith", 0, blockToWorld(x, y));
        for (const type of ["merchant", "monster_merchant", "pope", "blesser"]) {
            const spawn = this.villageNpcSpawns[type];
            const sx = Math.trunc(Number(spawn?.x));
            const sy = Math.trunc(Number(spawn?.y));
            if (Number.isFinite(sx) && Number.isFinite(sy)) this.configureVillageStaticNpc(this.spawnMobAt(blockToWorld(sx, sy), type, { fixed: true }), type, 0, blockToWorld(sx, sy));
        }
        this.maintainVillageStaticNpcs(true);
    }

    getVillageCenterBlock() {
        const blacksmithSpawn = this.villageNpcSpawns.blacksmith || Config.craftras_blacksmith_spawn;
        const x = Math.trunc(Number(blacksmithSpawn?.x));
        const y = Math.trunc(Number(blacksmithSpawn?.y));
        if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
        if (this.villageBounds) {
            return {
                x: Math.round((this.villageBounds.minX + this.villageBounds.maxX) / 2),
                y: Math.round((this.villageBounds.minY + this.villageBounds.maxY) / 2),
            };
        }
        return { x: 0, y: 0 };
    }

    findVillageNpcSpawnLocation(type, index = 0) {
        const center = this.getVillageCenterBlock();
        const bounds = this.villageBounds;
        const typeSalt = [...String(type)].reduce((total, char) => total + char.charCodeAt(0), 0);
        const tryCell = (x, y) => {
            if (this.getBlock(x, y) !== BLOCKS.AIR) return null;
            const cell = this.getCell(x, y);
            if (cell?.floor === FLOORS.WATER) return null;
            return blockToWorld(x, y);
        };
        if (bounds) {
            const width = Math.max(1, bounds.maxX - bounds.minX + 1);
            const height = Math.max(1, bounds.maxY - bounds.minY + 1);
            for (let attempt = 0; attempt < 160; attempt++) {
                const hash = (typeSalt * 73856093 + index * 19349663 + attempt * 83492791) >>> 0;
                const x = bounds.minX + hash % width;
                const y = bounds.minY + Math.floor(hash / width) % height;
                const location = tryCell(x, y);
                if (location) return location;
            }
        }
        const baseRadius = type === "captain" ? 4 : type === "cleric" || type === "merchant" || type === "monster_merchant" || type === "pope" || type === "blesser" ? 6 : 8;
        for (let attempt = 0; attempt < 128; attempt++) {
            const angle = (typeSalt + index * 47 + attempt * 31) * 0.61803398875 * Math.PI * 2;
            const distance = baseRadius + attempt % 12;
            const x = center.x + Math.round(Math.cos(angle) * distance);
            const y = center.y + Math.round(Math.sin(angle) * distance);
            const location = tryCell(x, y);
            if (location) return location;
        }
        return blockToWorld(center.x, center.y);
    }

    configureVillageStaticNpc(mob, type, index, location) {
        if (!mob) return null;
        const savedSpawn = this.villageNpcSpawns[type];
        if (savedSpawn) location = blockToWorld(savedSpawn.x, savedSpawn.y);
        mob.x = location.x;
        mob.y = location.y;
        mob.velocity.x = 0;
        mob.velocity.y = 0;
        mob.craftrasVillageStaticType = type;
        mob.craftrasVillageStaticIndex = index;
        mob.craftrasFixedNpc = true;
        mob.craftrasInvulnerableNpc = !VILLAGE_COMBAT_NPC_TYPES.has(type);
        mob.craftrasNpcWanderRadius = VILLAGE_NPC_MAX_HOME_DISTANCE;
        mob.craftrasHome = { x: location.x, y: location.y };
        mob.craftrasWanderPath = null;
        mob.craftrasWanderPathIndex = 0;
        mob.craftrasNextWanderAt = 0;
        mob.craftrasControl = { goal: { x: location.x, y: location.y }, target: { x: 1, y: 0 }, fire: false, power: 0 };
        return mob;
    }

    maintainVillageStaticNpcs(force = false) {
        if (Config.craftras_village_builder) return;
        if (!force && ++this.villageStaticNpcMaintainCounter % 180 !== 0) return;
        for (const [type, targetCount] of Object.entries(VILLAGE_NPC_COUNTS)) {
            const existing = [...this.mobs].filter(mob =>
                mob && !mob.isDead?.() &&
                mob.craftrasMobType === type &&
                mob.craftrasVillageStaticType === type &&
                !mob.craftrasArenaBuilder
            );
            for (let index = existing.length; index < targetCount; index++) {
                const location = this.findVillageNpcSpawnLocation(type, index);
                const mob = this.spawnMobAt(location, type, { fixed: true });
                this.configureVillageStaticNpc(mob, type, index, location);
            }
        }
    }

    findNearbyBlacksmith(body, range = VILLAGE_BLACKSMITH_INTERACT_RANGE) {
        if (!body || body.isDead?.()) return null;
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || mob.craftrasMobType !== "blacksmith") continue;
            if ((mob.x - body.x) ** 2 + (mob.y - body.y) ** 2 <= range ** 2) return mob;
        }
        return null;
    }

    findNearbyCleric(body, range = VILLAGE_CLERIC_INTERACT_RANGE) {
        if (!body || body.isDead?.()) return null;
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || mob.craftrasMobType !== "cleric") continue;
            if ((mob.x - body.x) ** 2 + (mob.y - body.y) ** 2 <= range ** 2) return mob;
        }
        return null;
    }

    findNearbyMerchant(body, range = VILLAGE_MERCHANT_INTERACT_RANGE) {
        if (!body || body.isDead?.()) return null;
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || (mob.craftrasMobType !== "merchant" && mob.craftrasMobType !== "monster_merchant")) continue;
            if ((mob.x - body.x) ** 2 + (mob.y - body.y) ** 2 <= range ** 2) return mob;
        }
        return null;
    }

    findNearbyPope(body, range = VILLAGE_POPE_INTERACT_RANGE) {
        if (!body || body.isDead?.()) return null;
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || mob.craftrasMobType !== "pope") continue;
            if ((mob.x - body.x) ** 2 + (mob.y - body.y) ** 2 <= range ** 2) return mob;
        }
        return null;
    }

    findNearbyBlesser(body, range = VILLAGE_BLESSER_INTERACT_RANGE) {
        if (!body || body.isDead?.()) return null;
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || mob.craftrasMobType !== "blesser") continue;
            if ((mob.x - body.x) ** 2 + (mob.y - body.y) ** 2 <= range ** 2) return mob;
        }
        return null;
    }

    openPope(socket) {
        const body = socket?.player?.body;
        if (!this.findNearbyPope(body)) return false;
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        socketManager.closeCraftrasCrafting(socket);
        socketManager.closeCraftrasFurnace(socket);
        socketManager.closeCraftrasChest(socket);
        this.closeMerchant(socket);
        this.closeBlesser(socket);
        this.closeBlacksmith(socket);
        this.closeCleric(socket);
        socket.craftrasCleric = { open: true, mode: "pope", slots: Array(4).fill(null) };
        socketManager.sendCraftrasInventory(socket);
        this.sendClericView(socket);
        return true;
    }

    openBlesser(socket) {
        const body = socket?.player?.body;
        if (!this.findNearbyBlesser(body)) return false;
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        socketManager.closeCraftrasCrafting(socket);
        socketManager.closeCraftrasFurnace(socket);
        socketManager.closeCraftrasChest(socket);
        this.closeMerchant(socket);
        this.closeBlesser(socket);
        this.closeBlacksmith(socket);
        this.closeCleric(socket);
        socket.craftrasBlesser = { open: true };
        socket.craftrasShopPoints = Math.max(0, Math.floor(Number(socket.craftrasShopPoints) || 0));
        socketManager.sendCraftrasInventory(socket);
        this.sendBlesserView(socket);
        return true;
    }

    closeBlesser(socket) {
        if (!socket?.craftrasBlesser?.open) {
            this.sendBlesserView(socket);
            return true;
        }
        socket.craftrasBlesser = { open: false };
        this.sendBlesserView(socket);
        return true;
    }

    getBlesserOfferState(socket, offer, now = Date.now()) {
        const freeKey = offer.id === "strength_buff" ? "strength" : offer.id === "health_buff" ? "health" : null;
        const nextFreeAt = freeKey ? Math.max(0, Math.floor(Number(socket?.craftrasBlesserNextFreeAt?.[freeKey]) || 0)) : 0;
        const free = !!freeKey && now >= nextFreeAt;
        const itemCooldownAt = offer.kind === "item" ? Math.max(0, Math.floor(Number(socket?.craftrasBlesserItemCooldowns?.[offer.id]) || 0)) : 0;
        const cooldownIn = offer.kind === "item" ? Math.max(0, Math.ceil((itemCooldownAt - now) / 1000)) : 0;
        return {
            ...offer,
            price: free ? 0 : offer.price,
            free,
            cooldownIn,
            nextFreeIn: freeKey ? Math.max(0, Math.ceil((nextFreeAt - now) / 1000)) : 0,
            duration: offer.kind === "buff" ? Math.ceil(VILLAGE_BLESSER_DURATION / 1000) : 0,
        };
    }

    sendBlesserView(socket) {
        if (!socket) return false;
        socket.craftrasBlesserNextFreeAt ??= {};
        socket.craftrasBlesserItemCooldowns ??= {};
        const now = Date.now();
        const offers = CRAFTRAS_BLESSER_SHOP_OFFERS.map(offer => this.getBlesserOfferState(socket, offer, now));
        socket.talk(
            "SV",
            socket.craftrasBlesser?.open ? 1 : 0,
            Math.max(0, Math.floor(Number(socket.craftrasShopPoints) || 0)),
            JSON.stringify(offers),
        );
        return true;
    }

    buyBlesserOffer(socket, index) {
        const body = socket?.player?.body;
        if (!socket?.craftrasBlesser?.open || !body || body.isDead?.() || !Number.isInteger(index)) return false;
        if (!this.findNearbyBlesser(body)) {
            this.closeBlesser(socket);
            return false;
        }
        const baseOffer = CRAFTRAS_BLESSER_SHOP_OFFERS[index];
        if (!baseOffer) return false;
        const now = Date.now();
        socket.craftrasShopPoints = Math.max(0, Math.floor(Number(socket.craftrasShopPoints) || 0));
        socket.craftrasBlesserNextFreeAt ??= {};
        socket.craftrasBlesserItemCooldowns ??= {};
        const offer = this.getBlesserOfferState(socket, baseOffer, now);
        if (offer.cooldownIn > 0) {
            body.sendMessage(`That item is on cooldown for ${offer.cooldownIn}s.`);
            this.sendBlesserView(socket);
            return false;
        }
        if (socket.craftrasShopPoints < offer.price) {
            body.sendMessage("Not enough shop points.");
            return false;
        }
        if (offer.kind === "item") {
            const item = makeItem(offer.id, offer.count || 1);
            if (!item) return false;
            this.gameManager.socketManager.initializeCraftrasInventory(socket);
            const capacity = socket.craftrasInventory.slots.reduce((total, stack) => {
                if (!stack) return total + 64;
                return stack.id === item.id ? total + Math.max(0, 64 - stack.count) : total;
            }, 0);
            if (capacity < (item.count || 1)) {
                body.sendMessage("Not enough inventory space.");
                return false;
            }
            const accepted = this.gameManager.socketManager.addCraftrasItem(socket, item, item.count || 1);
            if (accepted < (item.count || 1)) return false;
            socket.craftrasBlesserItemCooldowns[offer.id] = now + VILLAGE_BLESSER_ITEM_COOLDOWN;
            body.sendMessage(`Bought ${offer.name}.`);
        } else if (offer.id === "strength_buff") {
            body.craftrasStrengthBlessingUntil = Math.max(body.craftrasStrengthBlessingUntil || 0, now + VILLAGE_BLESSER_DURATION);
            if (offer.free) socket.craftrasBlesserNextFreeAt.strength = now + VILLAGE_BLESSER_FREE_INTERVAL;
            body.sendMessage("Strength Buff activated for 15 minutes.");
        } else if (offer.id === "health_buff") {
            body.craftrasHealthBlessingUntil = Math.max(body.craftrasHealthBlessingUntil || 0, now + VILLAGE_BLESSER_DURATION);
            body.craftrasNextBlessingRegenAt = now + 1000;
            if (offer.free) socket.craftrasBlesserNextFreeAt.health = now + VILLAGE_BLESSER_FREE_INTERVAL;
            body.sendMessage("Health Buff activated for 15 minutes.");
        } else return false;
        socket.craftrasShopPoints -= offer.price;
        this.gameManager.socketManager.sendCraftrasInventory(socket);
        this.sendBlesserView(socket);
        this.syncPlayerDebuffs(socket, body, now);
        return true;
    }

    hasHealthBlessing(body, now = Date.now()) {
        return body?.craftrasHelmet === "blesser_hat" || (body?.craftrasBlessingUntil || 0) > now || (body?.craftrasHealthBlessingUntil || 0) > now;
    }

    hasStrengthBlessing(body, now = Date.now()) {
        return body?.craftrasHelmet === "blesser_hat" || (body?.craftrasBlessingUntil || 0) > now || (body?.craftrasStrengthBlessingUntil || 0) > now;
    }

    hasActiveBlessing(body, now = Date.now()) {
        return this.hasHealthBlessing(body, now) || this.hasStrengthBlessing(body, now);
    }

    sendMerchantView(socket) {
        if (!socket) return false;
        this.refreshMerchantShop();
        const merchant = socket.craftrasMerchant || { open: false, sellSlot: null };
        const kind = merchant.kind === "monster" ? "monster" : "normal";
        const offers = kind === "monster" ? CRAFTRAS_MONSTER_SHOP_OFFERS.map(offer => ({ ...offer })) : this.shopOffers;
        const refreshIn = kind === "monster" ? 0 : Math.max(0, Math.ceil((this.shopNextRefreshAt - Date.now()) / 1000));
        socket.talk(
            "MV",
            merchant.open ? 1 : 0,
            Math.max(0, Math.floor(Number(socket.craftrasShopPoints) || 0)),
            refreshIn,
            JSON.stringify(offers),
            JSON.stringify(merchant.sellSlot || null),
            kind,
        );
        return true;
    }

    openMerchant(socket) {
        const body = socket?.player?.body;
        const nearbyMerchant = this.findNearbyMerchant(body);
        if (!nearbyMerchant) return false;
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        socketManager.closeCraftrasCrafting(socket);
        socketManager.closeCraftrasFurnace(socket);
        socketManager.closeCraftrasChest(socket);
        this.closeBlacksmith(socket);
        this.closeCleric(socket);
        this.closeBlesser(socket);
        socket.craftrasMerchant ??= { open: false, sellSlot: null };
        socket.craftrasMerchant.open = true;
        socket.craftrasMerchant.kind = nearbyMerchant.craftrasMobType === "monster_merchant" ? "monster" : "normal";
        socket.craftrasShopPoints = Math.max(0, Math.floor(Number(socket.craftrasShopPoints) || 0));
        socketManager.sendCraftrasInventory(socket);
        this.sendMerchantView(socket);
        return true;
    }

    closeMerchant(socket) {
        if (!socket?.craftrasMerchant?.open && !socket?.craftrasMerchant?.sellSlot) {
            this.sendMerchantView(socket);
            return true;
        }
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        const slot = socket.craftrasMerchant.sellSlot;
        if (slot) {
            const accepted = socketManager.addCraftrasItem(socket, slot, slot.count || 1);
            const remaining = (slot.count || 1) - accepted;
            if (remaining > 0 && socket.player?.body) this.spawnItemEntity(slot, socket.player.body, { count: remaining, pickupDelay: 300 });
        }
        socket.craftrasMerchant = { open: false, sellSlot: null };
        socketManager.sendCraftrasInventory(socket);
        this.sendMerchantView(socket);
        return true;
    }

    handleMerchantSellSlotClick(socket, button) {
        if (!Config.craftras || !socket?.craftrasMerchant?.open || ![0, 2].includes(button)) return false;
        const body = socket.player?.body;
        if (!this.findNearbyMerchant(body)) {
            this.closeMerchant(socket);
            return false;
        }
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        const inventory = socket.craftrasInventory;
        const merchant = socket.craftrasMerchant;
        const target = merchant.sellSlot;
        const cursor = inventory.cursor;
        const cursorSellPrice = this.getShopSellPrice(cursor?.id);

        if (button === 0) {
            if (!cursor) {
                if (!target) return false;
                inventory.cursor = target;
                merchant.sellSlot = null;
            } else if (!target) {
                if (!cursorSellPrice) {
                    body?.sendMessage("Only sellable items can be sold.");
                    return false;
                }
                merchant.sellSlot = cursor;
                inventory.cursor = null;
            } else if (target.id === cursor.id && target.count < 64) {
                const moved = Math.min(64 - target.count, cursor.count);
                target.count += moved;
                cursor.count -= moved;
                if (cursor.count <= 0) inventory.cursor = null;
            } else {
                if (!cursorSellPrice) {
                    body?.sendMessage("Only sellable items can be sold.");
                    return false;
                }
                merchant.sellSlot = cursor;
                inventory.cursor = target;
            }
        } else if (!cursor) {
            if (!target) return false;
            const taken = Math.ceil(target.count / 2);
            inventory.cursor = { ...target, count: taken };
            target.count -= taken;
            if (target.count <= 0) merchant.sellSlot = null;
        } else if (!target) {
            if (!cursorSellPrice) {
                body?.sendMessage("Only sellable items can be sold.");
                return false;
            }
            merchant.sellSlot = { ...cursor, count: 1 };
            cursor.count--;
            if (cursor.count <= 0) inventory.cursor = null;
        } else if (target.id === cursor.id && target.count < 64) {
            target.count++;
            cursor.count--;
            if (cursor.count <= 0) inventory.cursor = null;
        } else return false;

        socketManager.sendCraftrasHotbar(socket);
        socketManager.sendCraftrasInventory(socket);
        this.sendMerchantView(socket);
        return true;
    }

    sellMerchantSlot(socket) {
        const body = socket?.player?.body;
        const merchant = socket?.craftrasMerchant;
        if (!merchant?.open || !body || body.isDead?.() || !this.findNearbyMerchant(body)) return false;
        const stack = merchant.sellSlot;
        const unitPrice = this.getShopSellPrice(stack?.id);
        if (!stack || !unitPrice) {
            body.sendMessage("Only sellable items can be sold.");
            return false;
        }
        const count = Math.max(1, Math.floor(stack.count || 1));
        const gained = unitPrice * count;
        socket.craftrasShopPoints = Math.max(0, Math.floor(Number(socket.craftrasShopPoints) || 0)) + gained;
        const rewardTicketId = CRAFTRAS_HEAD_TICKET_REWARDS[stack.id];
        const rewardCount = rewardTicketId ? Math.floor(count / 30) : 0;
        let acceptedRewards = 0;
        if (rewardCount > 0) {
            const rewardItem = makeItem(rewardTicketId, rewardCount);
            acceptedRewards = this.gameManager.socketManager.addCraftrasItem(socket, rewardItem, rewardCount);
        }
        merchant.sellSlot = null;
        this.gameManager.socketManager.sendCraftrasInventory(socket);
        this.sendMerchantView(socket);
        const rewardName = acceptedRewards > 0 ? ITEMS[rewardTicketId]?.name || rewardTicketId : null;
        body.sendMessage(`Sold ${count}x ${stack.name || stack.id} for ${gained} points${rewardName ? ` and got ${acceptedRewards}x ${rewardName}` : ""}.`);
        if (rewardCount > acceptedRewards) body.sendMessage("Not enough inventory space for every bonus ticket.");
        return true;
    }

    buyMerchantOffer(socket, index) {
        const body = socket?.player?.body;
        if (!socket?.craftrasMerchant?.open || !body || body.isDead?.() || !Number.isInteger(index)) return false;
        if (!this.findNearbyMerchant(body)) {
            this.closeMerchant(socket);
            return false;
        }
        const monsterShop = socket.craftrasMerchant.kind === "monster";
        if (!monsterShop) this.refreshMerchantShop();
        const offer = monsterShop ? CRAFTRAS_MONSTER_SHOP_OFFERS[index] && { ...CRAFTRAS_MONSTER_SHOP_OFFERS[index] } : this.shopOffers[index];
        if (!offer) return false;
        const stock = Math.max(0, Math.floor(Number(offer.stock) || 0));
        if (stock <= 0) {
            body.sendMessage("This shop item is sold out.");
            this.sendMerchantView(socket);
            return false;
        }
        const buyCount = Math.max(1, Math.min(stock, Math.floor(Number(offer.count) || 1)));
        const points = Math.max(0, Math.floor(Number(socket.craftrasShopPoints) || 0));
        if (points < offer.price) {
            body.sendMessage("Not enough shop points.");
            return false;
        }
        const item = makeItem(offer.id, buyCount);
        if (!item) return false;
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        const capacity = socket.craftrasInventory.slots.reduce((total, stack) => {
            if (!stack) return total + 64;
            return stack.id === offer.id ? total + Math.max(0, 64 - stack.count) : total;
        }, 0);
        if (capacity < (item?.count || 1)) {
            body.sendMessage("Not enough inventory space.");
            return false;
        }
        const accepted = this.gameManager.socketManager.addCraftrasItem(socket, item, item?.count || 1);
        if (accepted < (item?.count || 1)) return false;
        offer.stock = Math.max(0, stock - buyCount);
        socket.craftrasShopPoints = points - offer.price;
        this.sendMerchantView(socket);
        body.sendMessage(`Bought ${buyCount}x ${offer.name}.`);
        return true;
    }

    sendClericView(socket) {
        if (!socket) return false;
        const body = socket.player?.body;
        const clericState = socket.craftrasCleric || { open: false, mode: "cleric", slots: Array(4).fill(null) };
        const mode = clericState.mode === "pope" ? "pope" : "token";
        const slots = Array.from({ length: 4 }, (_, index) => clericState.slots?.[index] || null);
        const rebirths = this.getCraftrasRebirths(socket);
        const levelCap = this.getCraftrasLevelCap(socket);
        const level = body?.skill?.level || 0;
        const requirements = this.getRebirthRequirementStatus(socket);
        const hasRequirements = requirements.every(requirement => requirement.count >= requirement.required);
        const canRebirth = !!clericState.open && mode === "pope" && rebirths < 1 && level >= levelCap && hasRequirements;
        const canToken = !!clericState.open && mode === "token" && this.canCraftWorld1Token(slots);
        socket.talk(
            "RV",
            clericState.open ? 1 : 0,
            mode,
            rebirths,
            level,
            levelCap,
            canRebirth ? 1 : 0,
            CRAFTRAS_BASE_LEVEL_CAP + (rebirths + 1) * CRAFTRAS_REBIRTH_LEVEL_STEP,
            this.getCraftrasLevelHealthBonus(level),
            JSON.stringify(requirements),
            JSON.stringify(slots),
            canToken ? 1 : 0,
        );
        return true;
    }

    openCleric(socket) {
        const body = socket?.player?.body;
        if (!this.findNearbyCleric(body)) return false;
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        socketManager.closeCraftrasCrafting(socket);
        socketManager.closeCraftrasFurnace(socket);
        socketManager.closeCraftrasChest(socket);
        this.closeMerchant(socket);
        this.closeBlacksmith(socket);
        socket.craftrasCleric ??= { open: false, mode: "token", slots: Array(4).fill(null) };
        socket.craftrasCleric.open = true;
        socket.craftrasCleric.mode = "token";
        socket.craftrasCleric.slots = Array.from({ length: 4 }, (_, index) => socket.craftrasCleric.slots?.[index] || null);
        socketManager.sendCraftrasInventory(socket);
        this.sendClericView(socket);
        return true;
    }

    closeCleric(socket) {
        if (!socket?.craftrasCleric?.open && !(socket?.craftrasCleric?.slots || []).some(Boolean)) {
            this.sendClericView(socket);
            return true;
        }
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        for (const slot of socket.craftrasCleric.slots || []) {
            if (!slot) continue;
            const accepted = socketManager.addCraftrasItem(socket, slot, slot.count || 1);
            const remaining = (slot.count || 1) - accepted;
            if (remaining > 0 && socket.player?.body) this.spawnItemEntity(slot, socket.player.body, { count: remaining, pickupDelay: 300 });
        }
        socket.craftrasCleric = { open: false, mode: "token", slots: Array(4).fill(null) };
        socketManager.sendCraftrasInventory(socket);
        this.sendClericView(socket);
        return true;
    }

    canCraftWorld1Token(slots) {
        return CRAFTRAS_WORLD1_TOKEN_REQUIREMENTS.every((requirement, index) => slots?.[index]?.id === requirement.id && (slots[index].count || 0) >= 1);
    }

    handleClericTokenSlotClick(socket, slotIndex, button) {
        if (!Config.craftras || !socket?.craftrasCleric?.open || socket.craftrasCleric.mode !== "token" || ![0, 2].includes(button)) return false;
        if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= CRAFTRAS_WORLD1_TOKEN_REQUIREMENTS.length) return false;
        const body = socket.player?.body;
        if (!this.findNearbyCleric(body)) {
            this.closeCleric(socket);
            return false;
        }
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        const inventory = socket.craftrasInventory;
        const slots = socket.craftrasCleric.slots;
        const target = slots[slotIndex] || null;
        const cursor = inventory.cursor || null;
        const required = CRAFTRAS_WORLD1_TOKEN_REQUIREMENTS[slotIndex];
        const acceptsCursor = cursor?.id === required.id;

        if (button === 0) {
            if (!cursor) {
                if (!target) return false;
                inventory.cursor = target;
                slots[slotIndex] = null;
            } else if (!target) {
                if (!acceptsCursor) {
                    body?.sendMessage(`This slot needs ${required.name}.`);
                    return false;
                }
                slots[slotIndex] = cursor;
                inventory.cursor = null;
            } else if (target.id === cursor.id && target.count < 64) {
                const moved = Math.min(64 - target.count, cursor.count);
                target.count += moved;
                cursor.count -= moved;
                if (cursor.count <= 0) inventory.cursor = null;
            } else {
                if (!acceptsCursor) {
                    body?.sendMessage(`This slot needs ${required.name}.`);
                    return false;
                }
                slots[slotIndex] = cursor;
                inventory.cursor = target;
            }
        } else if (!cursor) {
            if (!target) return false;
            const taken = Math.ceil(target.count / 2);
            inventory.cursor = { ...target, count: taken };
            target.count -= taken;
            if (target.count <= 0) slots[slotIndex] = null;
        } else if (!target) {
            if (!acceptsCursor) {
                body?.sendMessage(`This slot needs ${required.name}.`);
                return false;
            }
            slots[slotIndex] = { ...cursor, count: 1 };
            cursor.count--;
            if (cursor.count <= 0) inventory.cursor = null;
        } else if (target.id === cursor.id && target.count < 64) {
            target.count++;
            cursor.count--;
            if (cursor.count <= 0) inventory.cursor = null;
        } else return false;

        socketManager.sendCraftrasHotbar(socket);
        socketManager.sendCraftrasInventory(socket);
        this.sendClericView(socket);
        return true;
    }

    craftWorld1TokenAtCleric(socket) {
        const body = socket?.player?.body;
        const cleric = socket?.craftrasCleric;
        if (!cleric?.open || cleric.mode !== "token" || !body || body.isDead?.()) return false;
        if (!this.findNearbyCleric(body)) {
            this.closeCleric(socket);
            return false;
        }
        const slots = Array.from({ length: 4 }, (_, index) => cleric.slots?.[index] || null);
        if (!this.canCraftWorld1Token(slots)) {
            body.sendMessage("Put Knight's Shield, King's Crown, Venom Sword, and Cleric Staff in the Cleric slots.");
            this.sendClericView(socket);
            return false;
        }
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        if (this.countCraftrasItem(socket, "world1_badge") > 0) {
            body.sendMessage("You already have a World 1 Badge.");
            this.sendClericView(socket);
            return false;
        }
        const hasTokenSpace = socket.craftrasInventory.slots.some(stack => !stack || (stack.id === "world1_badge" && (stack.count || 0) < 64));
        if (!hasTokenSpace) {
            body.sendMessage("Inventory full. Make room for the World 1 Badge.");
            this.sendClericView(socket);
            return false;
        }
        const token = makeItem("world1_badge", 1);
        const accepted = this.gameManager.socketManager.addCraftrasItem(socket, token, 1);
        if (accepted > 0) body.sendMessage("Created a World 1 Badge.");
        this.gameManager.socketManager.sendCraftrasInventory(socket);
        this.sendClericView(socket);
        return accepted > 0;
    }

    rebirthAtCleric(socket) {
        const body = socket?.player?.body;
        if (socket?.craftrasCleric?.mode === "token") return this.craftWorld1TokenAtCleric(socket);
        if (!socket?.craftrasCleric?.open || socket.craftrasCleric.mode !== "pope" || !body || body.isDead?.()) return false;
        if (!this.findNearbyPope(body)) {
            this.closeCleric(socket);
            return false;
        }
        if (this.getCraftrasRebirths(socket) >= 1) {
            body.sendMessage("Rebirth 2 is currently under development.");
            this.sendClericView(socket);
            return false;
        }
        const levelCap = this.getCraftrasLevelCap(socket);
        if ((body.skill?.level || 0) < levelCap) {
            body.sendMessage(`Rebirth needs level ${levelCap}.`);
            this.sendClericView(socket);
            return false;
        }
        const requirements = this.getRebirthRequirementStatus(socket);
        const missing = requirements.filter(requirement => requirement.count < requirement.required);
        if (missing.length) {
            body.sendMessage(`Rebirth needs ${missing.map(requirement => requirement.name).join(", ")}.`);
            this.sendClericView(socket);
            return false;
        }
        for (const requirement of requirements) this.removeCraftrasItem(socket, requirement.id, requirement.required);
        socket.craftrasRebirths = this.getCraftrasRebirths(socket) + 1;
        this.rebuildSkillAfterLevelPayment(body.skill, 0);
        body.health.set(100);
        body.health.amount = 100;
        socket.craftrasHealthSignature = "";
        this.gameManager.socketManager.saveCraftrasPlayerSave(socket);
        this.sendClericView(socket);
        body.sendMessage(`Rebirth complete. Level cap is now ${this.getCraftrasLevelCap(socket)}.`);
        return true;
    }

    getBlacksmithUnlockForItem(itemId) {
        return BLACKSMITH_RECIPE_UNLOCKS[itemId] || null;
    }

    isLockedRecipeItem(itemId) {
        return CRAFTRAS_LOCKED_RECIPE_ITEMS.has(itemId);
    }

    getShopItemUnitPrice(itemId, seen = new Set()) {
        if (!itemId) return 0;
        if (CRAFTRAS_SHOP_BASE_PRICES[itemId]) return CRAFTRAS_SHOP_BASE_PRICES[itemId];
        if (this.shopPriceCache.has(itemId)) return this.shopPriceCache.get(itemId);
        if (seen.has(itemId)) return 0;
        seen.add(itemId);
        const recipe = CRAFTING_RECIPES.find(entry => entry.output?.[0] === itemId && !entry.unlock);
        if (!recipe) return 0;
        const ingredients = new Map();
        const note = id => ingredients.set(id, (ingredients.get(id) || 0) + 1);
        if (recipe.shapeless) {
            for (const id of recipe.shapeless) note(id);
        } else {
            for (const row of recipe.pattern || []) {
                for (const id of row) if (id) note(id);
            }
        }
        let total = 0;
        for (const [id, count] of ingredients) {
            const price = this.getShopItemUnitPrice(id, seen);
            if (!price) return 0;
            total += price * count;
        }
        const outputCount = Math.max(1, Number(recipe.output?.[1]) || 1);
        const price = Math.max(1, Math.ceil(total / outputCount * 1.5));
        this.shopPriceCache.set(itemId, price);
        return price;
    }

    getShopSellPrice(itemId) {
        return CRAFTRAS_SHOP_SELL_PRICES[itemId] || 0;
    }

    rollShopItemId(used) {
        const recipeChance = used.size >= 2 ? 0.04 : 0;
        const roll = Math.random();
        const pool = roll < recipeChance
            ? CRAFTRAS_SHOP_RECIPE_ITEMS
            : roll < 0.26
                ? CRAFTRAS_SHOP_BOSS_MATERIALS
                : CRAFTRAS_SHOP_COMMON_ITEMS;
        for (let attempt = 0; attempt < 30; attempt++) {
            const id = pool[Math.floor(Math.random() * pool.length)];
            if (!used.has(id)) return id;
        }
        return [...CRAFTRAS_SHOP_COMMON_ITEMS, ...CRAFTRAS_SHOP_BOSS_MATERIALS, ...CRAFTRAS_SHOP_RECIPE_ITEMS].find(id => !used.has(id)) || "coal";
    }

    getShopOfferCount(itemId) {
        if (CRAFTRAS_SHOP_RECIPE_ITEMS.includes(itemId)) return 1;
        if (itemId.endsWith("_sword") || itemId.endsWith("_pickaxe") || itemId.endsWith("_axe") || itemId.endsWith("_shovel")) return 1;
        if (CRAFTRAS_SHOP_BLOCK_ITEMS.has(itemId)) return 10;
        return 1;
    }

    getShopOfferStockLimit(itemId) {
        if (CRAFTRAS_SHOP_RECIPE_ITEMS.includes(itemId)) return 1;
        if (itemId.endsWith("_sword") || itemId.endsWith("_pickaxe") || itemId.endsWith("_axe") || itemId.endsWith("_shovel")) return 3;
        if (CRAFTRAS_SHOP_BLOCK_ITEMS.has(itemId)) return 100;
        return 10;
    }

    refreshMerchantShop(force = false) {
        const now = Date.now();
        if (!force && this.shopOffers.length === 8 && now < this.shopNextRefreshAt) return false;
        const used = new Set();
        const offers = [];
        while (offers.length < 8) {
            const id = this.rollShopItemId(used);
            used.add(id);
            const item = ITEMS[id];
            const unitPrice = this.getShopItemUnitPrice(id);
            if (!item || !unitPrice) continue;
            const count = this.getShopOfferCount(id);
            const stock = this.getShopOfferStockLimit(id);
            const rarityMultiplier = CRAFTRAS_SHOP_RECIPE_ITEMS.includes(id) ? 1.35 : CRAFTRAS_SHOP_BOSS_MATERIALS.includes(id) ? 1.2 : 1;
            offers.push({
                id,
                name: item.name || id,
                count,
                stock,
                maxStock: stock,
                price: Math.max(1, Math.ceil(unitPrice * count * rarityMultiplier)),
            });
        }
        this.shopOffers = offers;
        this.shopNextRefreshAt = now + CRAFTRAS_SHOP_REFRESH_INTERVAL;
        return true;
    }

    updateMerchantShop() {
        if (!this.refreshMerchantShop()) return;
        for (const socket of this.gameManager.clients) {
            if (socket?.craftrasMerchant?.open) this.sendMerchantView(socket);
        }
    }

    getBlacksmithLevelScore(level) {
        return this.getCraftrasLevelScore(level);
    }

    getSocketForBody(body) {
        if (!body) return null;
        return this.gameManager.clients.find(client => client?.player?.body === body) || null;
    }

    getCraftrasLevelScore(level) {
        const targetLevel = Math.max(1, Math.trunc(Number(level) || 1));
        let score = 0;
        let tierStart = 1;
        let cost = CRAFTRAS_LEVEL_SCORE_BASE;
        while (tierStart < targetLevel) {
            const tierEnd = Math.min(targetLevel, tierStart + CRAFTRAS_REBIRTH_LEVEL_STEP);
            score += (tierEnd - tierStart) * cost;
            tierStart += CRAFTRAS_REBIRTH_LEVEL_STEP;
            cost *= 10;
        }
        return score;
    }

    getCraftrasRebirths(socket) {
        return Math.max(0, Math.trunc(Number(socket?.craftrasRebirths) || 0));
    }

    countCraftrasItem(socket, itemId) {
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        let count = 0;
        for (const stack of socket.craftrasInventory?.slots || []) {
            if (stack?.id === itemId) count += Math.max(1, Math.floor(stack.count || 1));
        }
        if (socket.craftrasInventory?.helmet?.id === itemId) count++;
        if (socket.craftrasInventory?.offhand?.id === itemId) count++;
        return count;
    }

    removeCraftrasItem(socket, itemId, amount = 1) {
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        let remaining = Math.max(1, Math.floor(amount || 1));
        const inventory = socket.craftrasInventory;
        for (let index = 0; index < inventory.slots.length && remaining > 0; index++) {
            const stack = inventory.slots[index];
            if (stack?.id !== itemId) continue;
            const removed = Math.min(remaining, Math.max(1, Math.floor(stack.count || 1)));
            stack.count -= removed;
            remaining -= removed;
            if (stack.count <= 0) inventory.slots[index] = null;
        }
        if (remaining > 0 && inventory.helmet?.id === itemId) {
            inventory.helmet = null;
            remaining--;
        }
        if (remaining > 0 && inventory.offhand?.id === itemId) {
            inventory.offhand = null;
            remaining--;
        }
        this.gameManager.socketManager.initializeCraftrasInventory(socket);
        this.gameManager.socketManager.sendCraftrasHotbar(socket);
        this.gameManager.socketManager.sendCraftrasInventory(socket);
        return remaining <= 0;
    }

    getRebirthRequirementStatus(socket) {
        if (this.getCraftrasRebirths(socket) > 0) return [];
        return CRAFTRAS_REBIRTH_REQUIREMENTS.map(requirement => ({
            ...requirement,
            count: this.countCraftrasItem(socket, requirement.id),
            required: 1,
        }));
    }

    hasRebirthRequirements(socket) {
        return this.getRebirthRequirementStatus(socket).every(requirement => requirement.count >= requirement.required);
    }

    getCraftrasLevelCap(socket) {
        return CRAFTRAS_BASE_LEVEL_CAP + this.getCraftrasRebirths(socket) * CRAFTRAS_REBIRTH_LEVEL_STEP;
    }

    getCraftrasLevelHealthBonus(level) {
        let remaining = Math.max(0, Math.trunc(Number(level) || 0));
        let bonus = 0;
        let amountPerLevel = 1;
        while (remaining > 0) {
            const levels = Math.min(CRAFTRAS_REBIRTH_LEVEL_STEP, remaining);
            bonus += levels * amountPerLevel;
            remaining -= levels;
            amountPerLevel *= 10;
        }
        return bonus;
    }

    ensureCraftrasMinimumLevel(skill) {
        if (!skill || skill.level >= 1) return false;
        skill.score = Math.max(0, Math.floor(Number(skill.score) || 0));
        skill.deduction = 0;
        skill.level = 1;
        skill.levelUpScore = skill.scoreForLevel;
        skill.points = 0;
        skill.update();
        return true;
    }

    clampCraftrasLevelToCap(socket, body = socket?.player?.body) {
        if (!body?.skill) return false;
        const cap = this.getCraftrasLevelCap(socket);
        const capScore = this.getCraftrasLevelScore(cap);
        if (body.skill.level <= cap) return false;
        const spentPoints = Array.isArray(body.skill.raw) ? body.skill.raw.reduce((total, value) => total + (Number(value) || 0), 0) : 0;
        body.skill.score = capScore;
        body.skill.deduction = 0;
        body.skill.level = 0;
        body.skill.levelUpScore = 1;
        body.skill.points = 0;
        let guard = 0;
        while (guard++ < cap + 5 && body.skill.maintain()) {}
        this.ensureCraftrasMinimumLevel(body.skill);
        body.skill.points = Math.max(0, body.skill.points - spentPoints);
        body.skill.update();
        return true;
    }

    updateCraftrasScoreGate(socket, body = socket?.player?.body) {
        if (!body?.skill?.level && body?.skill?.level !== 0) return false;
        const cap = this.getCraftrasLevelCap(socket);
        if (body.skill.level > cap) this.clampCraftrasLevelToCap(socket, body);
        body.settings.acceptsScore = body.skill.level < cap;
        return body.settings.acceptsScore;
    }

    rebuildSkillAfterLevelPayment(skill, score) {
        if (!skill) return;
        const spentPoints = Array.isArray(skill.raw) ? skill.raw.reduce((total, value) => total + (Number(value) || 0), 0) : 0;
        skill.score = Math.max(0, Math.floor(score || 0));
        skill.deduction = 0;
        skill.level = 0;
        skill.levelUpScore = 1;
        skill.points = 0;
        let guard = 0;
        while (guard++ < 200 && skill.maintain()) {}
        this.ensureCraftrasMinimumLevel(skill);
        skill.points = Math.max(0, skill.points - spentPoints);
        skill.update();
    }

    sendBlacksmithView(socket) {
        if (!socket) return false;
        const blacksmith = socket.craftrasBlacksmith || { open: false, slot: null };
        const slot = blacksmith.slot || null;
        const unlock = this.getBlacksmithUnlockForItem(slot?.id);
        const unlocked = socket.craftrasUnlockedRecipes instanceof Set
            ? [...socket.craftrasUnlockedRecipes]
            : [];
        const offer = unlock ? {
            input: slot.id,
            unlock: unlock.unlock,
            name: unlock.name,
            cost: unlock.cost,
            output: unlock.output,
            unlocked: unlocked.includes(unlock.unlock),
        } : null;
        socket.talk(
            "BV",
            blacksmith.open ? 1 : 0,
            JSON.stringify(slot),
            JSON.stringify(offer),
            socket.player?.body?.skill?.level || 0,
            JSON.stringify(unlocked),
        );
        return true;
    }

    openBlacksmith(socket) {
        const body = socket?.player?.body;
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        if (this.findNearbyPope(body)) return this.openPope(socket);
        if (this.findNearbyBlesser(body)) return this.openBlesser(socket);
        if (this.findNearbyCleric(body)) return this.openCleric(socket);
        if (this.findNearbyMerchant(body)) return this.openMerchant(socket);
        if (!this.findNearbyBlacksmith(body)) {
            this.closeCleric(socket);
            this.closeMerchant(socket);
            this.closeBlesser(socket);
            socketManager.openCraftrasCrafting(socket, 2);
            return false;
        }
        this.closeCleric(socket);
        this.closeMerchant(socket);
        this.closeBlesser(socket);
        socketManager.closeCraftrasCrafting(socket);
        socketManager.closeCraftrasFurnace(socket);
        socketManager.closeCraftrasChest(socket);
        socket.craftrasBlacksmith ??= { open: false, slot: null };
        socket.craftrasBlacksmith.open = true;
        socketManager.sendCraftrasInventory(socket);
        this.sendBlacksmithView(socket);
        return true;
    }

    closeBlacksmith(socket) {
        if (!socket?.craftrasBlacksmith?.open && !socket?.craftrasBlacksmith?.slot) {
            this.sendBlacksmithView(socket);
            return true;
        }
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        const slot = socket.craftrasBlacksmith.slot;
        if (slot) {
            const accepted = socketManager.addCraftrasItem(socket, slot, slot.count || 1);
            const remaining = (slot.count || 1) - accepted;
            if (remaining > 0 && socket.player?.body) {
                this.spawnItemEntity(slot, socket.player.body, { count: remaining, pickupDelay: 300 });
            }
        }
        socket.craftrasBlacksmith = { open: false, slot: null };
        socketManager.sendCraftrasInventory(socket);
        this.sendBlacksmithView(socket);
        return true;
    }

    handleBlacksmithClick(socket, button) {
        if (!Config.craftras || !socket?.craftrasBlacksmith?.open || ![0, 2].includes(button)) return false;
        const body = socket.player?.body;
        if (!this.findNearbyBlacksmith(body)) {
            this.closeBlacksmith(socket);
            return false;
        }
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        const inventory = socket.craftrasInventory;
        const blacksmith = socket.craftrasBlacksmith;
        const target = blacksmith.slot;
        const cursor = inventory.cursor;
        const cursorUnlock = this.getBlacksmithUnlockForItem(cursor?.id);

        if (button === 0) {
            if (!cursor) {
                if (!target) return false;
                inventory.cursor = target;
                blacksmith.slot = null;
            } else if (!target) {
                if (!cursorUnlock) {
                    body?.sendMessage("The Blacksmith cannot read that.");
                    return false;
                }
                blacksmith.slot = cursor;
                inventory.cursor = null;
            } else if (target.id === cursor.id && target.count < 64) {
                const moved = Math.min(64 - target.count, cursor.count);
                target.count += moved;
                cursor.count -= moved;
                if (cursor.count <= 0) inventory.cursor = null;
            } else {
                if (!cursorUnlock) {
                    body?.sendMessage("The Blacksmith cannot read that.");
                    return false;
                }
                blacksmith.slot = cursor;
                inventory.cursor = target;
            }
        } else if (!cursor) {
            if (!target) return false;
            const taken = Math.ceil(target.count / 2);
            inventory.cursor = { ...target, count: taken };
            target.count -= taken;
            if (target.count <= 0) blacksmith.slot = null;
        } else if (!target) {
            if (!cursorUnlock) {
                body?.sendMessage("The Blacksmith cannot read that.");
                return false;
            }
            blacksmith.slot = { ...cursor, count: 1 };
            cursor.count--;
            if (cursor.count <= 0) inventory.cursor = null;
        } else if (target.id === cursor.id && target.count < 64) {
            target.count++;
            cursor.count--;
            if (cursor.count <= 0) inventory.cursor = null;
        } else return false;

        socketManager.sendCraftrasHotbar(socket);
        socketManager.sendCraftrasInventory(socket);
        this.sendBlacksmithView(socket);
        return true;
    }

    unlockBlacksmithRecipe(socket) {
        const body = socket?.player?.body;
        const socketManager = this.gameManager.socketManager;
        socketManager.initializeCraftrasInventory(socket);
        const blacksmith = socket?.craftrasBlacksmith;
        const stack = blacksmith?.slot;
        const unlock = this.getBlacksmithUnlockForItem(stack?.id);
        if (!blacksmith?.open || !body || body.isDead?.() || !unlock) return false;
        if (!this.findNearbyBlacksmith(body)) {
            this.closeBlacksmith(socket);
            return false;
        }
        socket.craftrasUnlockedRecipes ??= new Set();
        if (!(socket.craftrasUnlockedRecipes instanceof Set)) socket.craftrasUnlockedRecipes = new Set(socket.craftrasUnlockedRecipes);
        if (socket.craftrasUnlockedRecipes.has(unlock.unlock)) {
            body.sendMessage(`${unlock.name} recipe is already unlocked.`);
            return false;
        }
        if ((body.skill?.level || 0) < unlock.cost) {
            body.sendMessage(`${unlock.name} needs level ${unlock.cost}.`);
            return false;
        }
        socket.craftrasUnlockedRecipes.add(unlock.unlock);
        stack.count = (stack.count || 1) - 1;
        if (stack.count <= 0) blacksmith.slot = null;
        const targetLevel = Math.max(0, (body.skill.level || 0) - unlock.cost);
        this.rebuildSkillAfterLevelPayment(body.skill, this.getBlacksmithLevelScore(targetLevel));
        socketManager.sendCraftrasCrafting(socket);
        socketManager.sendCraftrasInventory(socket);
        this.sendBlacksmithView(socket);
        body.sendMessage(`Blacksmith unlocked ${unlock.name}.`);
        return true;
    }

    unlockRecipeAtBlacksmith(socket) {
        return this.unlockBlacksmithRecipe(socket);
    }

    registerVillageRepairJob(x, y, block) {
        if (Config.craftras_village_builder) return false;
        const key = this.wallKey(x, y);
        const original = this.villageOriginalBlocks.get(key);
        if (!original || original.type !== block) return false;
        if (!this.villageRepairJobs.has(key)) {
            this.villageRepairJobs.set(key, {
                key,
                mode: "repair",
                x,
                y,
                type: original.type,
                direction: original.direction || 0,
                assignedBuilderId: null,
            });
        }
        return true;
    }

    registerVillageDemolitionJob(x, y, block) {
        if (Config.craftras_village_builder || block === BLOCKS.AIR || !this.isInsideVillageNatureClearZone(x, y, 0)) return false;
        if (VILLAGE_IGNORED_DECORATION_BLOCKS.has(block)) return false;
        const key = this.wallKey(x, y);
        const original = this.villageOriginalBlocks.get(key);
        if (original?.type === block) {
            this.villageDemolitionJobs.delete(key);
            this.villageRepairJobs.delete(key);
            return false;
        }
        const existing = this.villageDemolitionJobs.get(key);
        if (existing) {
            existing.type = block;
            return true;
        }
        this.villageDemolitionJobs.set(key, {
            key,
            mode: "demolish",
            x,
            y,
            type: block,
            assignedBuilderId: null,
        });
        return true;
    }

    handleVillageBlockPlaced(x, y, block) {
        if (Config.craftras_village_builder || block === BLOCKS.AIR || !this.isInsideVillageNatureClearZone(x, y, 0)) return;
        if (VILLAGE_IGNORED_DECORATION_BLOCKS.has(block)) return;
        const key = this.wallKey(x, y);
        const original = this.villageOriginalBlocks.get(key);
        if (original?.type === block) {
            this.villageRepairJobs.delete(key);
            this.villageDemolitionJobs.delete(key);
            return;
        }
        if (original) this.registerVillageRepairJob(x, y, original.type);
        this.registerVillageDemolitionJob(x, y, block);
    }

    scanVillageDemolitionJobs(now) {
        if (Config.craftras_village_builder || !this.villageBounds || now < (this.nextVillageDemolitionScanAt || 0)) return;
        this.nextVillageDemolitionScanAt = now + 1000;
        const bounds = this.villageBounds;

        for (const [key, job] of [...this.villageDemolitionJobs]) {
            const block = this.getBlock(job.x, job.y);
            const original = this.villageOriginalBlocks.get(key);
            if (block === BLOCKS.AIR || original?.type === block || VILLAGE_IGNORED_DECORATION_BLOCKS.has(block)) this.villageDemolitionJobs.delete(key);
        }

        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const key = this.wallKey(x, y);
                if (this.villageDemolitionJobs.has(key)) continue;
                const block = this.getBlock(x, y);
                const original = this.villageOriginalBlocks.get(key);
                if (VILLAGE_IGNORED_DECORATION_BLOCKS.has(block)) {
                    this.villageDemolitionJobs.delete(key);
                    continue;
                }
                if (block === BLOCKS.AIR) {
                    if (original && !this.villageRepairJobs.has(key)) this.registerVillageRepairJob(x, y, original.type);
                    continue;
                }
                if (original?.type === block) continue;
                this.registerVillageDemolitionJob(x, y, block);
            }
        }
    }

    repairVillageBlock(job) {
        if (!job) return false;
        const key = job.key || this.wallKey(job.x, job.y);
        const currentBlock = this.getBlock(job.x, job.y);
        if (currentBlock !== BLOCKS.AIR) {
            if (VILLAGE_IGNORED_DECORATION_BLOCKS.has(currentBlock)) {
                this.villageRepairJobs.delete(key);
                this.villageDemolitionJobs.delete(key);
                return true;
            }
            if (currentBlock === job.type) {
                this.villageRepairJobs.delete(key);
                this.villageDemolitionJobs.delete(key);
                return true;
            }
            this.registerVillageDemolitionJob(job.x, job.y, currentBlock);
            job.assignedBuilderId = null;
            return false;
        }
        this.destroyedWallKeys.delete(key);
        this.damagedWallHealth.delete(key);
        this.damagedWallLastHitAt.delete(key);
        this.placedBlocks.set(key, job.type);
        this.placedBlockDirections.set(key, job.direction || 0);
        if (job.type === BLOCKS.FURNACE && !this.furnaces.has(key)) this.furnaces.set(key, { slots: [null, null, null], active: false, finishAt: 0 });
        if (job.type === BLOCKS.CHEST && !this.chests.has(key)) this.chests.set(key, { slots: Array(27).fill(null) });
        if (job.type === BLOCKS.TREE) this.spawnTree(job.x, job.y);
        this.broadcastBlockUpdate(job.x, job.y, this.getBlockRenderCode(job.x, job.y));
        this.villageRepairJobs.delete(key);
        this.villageDemolitionJobs.delete(key);
        return true;
    }

    isArenaBuildProtectedCell(x, y, key = this.wallKey(x, y)) {
        if (this.placedBlocks.has(key)) return true;
        if (this.villageBounds && this.isInsideVillageNatureClearZone(x, y, 1)) return true;
        return false;
    }

    getArenaBuildOriginalBlock(x, y, key = this.wallKey(x, y)) {
        if (this.isArenaBuildProtectedCell(x, y, key)) return BLOCKS.AIR;
        const block = this.getCell(x, y)?.block ?? BLOCKS.AIR;
        if (block === BLOCKS.TREE && this.isInsideVillageNatureClearZone(x, y)) return BLOCKS.AIR;
        return block;
    }

    validateArenaBuildJob(job) {
        if (!job) return null;
        const key = job.key || this.wallKey(job.x, job.y);
        if (this.isPermanentBlueprintClear(key)) {
            this.arenaBuildJobs.delete(key);
            return null;
        }
        const type = this.getArenaBuildOriginalBlock(job.x, job.y, key);
        if (type === BLOCKS.AIR || !this.destroyedWallKeys.has(key) || this.getBlock(job.x, job.y) !== BLOCKS.AIR) {
            this.arenaBuildJobs.delete(key);
            return null;
        }
        job.type = type;
        return job;
    }

    prepareArenaBuildJobScan() {
        this.arenaBuildJobs.clear();
        const repairableKeys = [...this.destroyedWallKeys].filter(key => !this.isPermanentBlueprintClear(key));
        this.arenaBuildScanIterator = repairableKeys.values();
        this.arenaBuildScanActive = true;
        this.arenaBuildScanTargetCount = repairableKeys.length;
        return this.arenaBuildScanTargetCount;
    }

    processArenaBuildJobScan(limit = ARENA_BUILD_SCAN_KEYS_PER_TICK) {
        if (!this.arenaBuildScanActive || !this.arenaBuildScanIterator || limit <= 0) return 0;
        let added = 0;
        let checked = 0;
        while (checked++ < limit) {
            const next = this.arenaBuildScanIterator.next();
            if (next.done) {
                this.arenaBuildScanIterator = null;
                this.arenaBuildScanActive = false;
                break;
            }
            const key = next.value;
            if (this.arenaBuildJobs.has(key) || !this.destroyedWallKeys.has(key) || this.isPermanentBlueprintClear(key)) continue;
            const [x, y] = key.split(",").map(Number);
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
            const type = this.getArenaBuildOriginalBlock(x, y, key);
            if (type === BLOCKS.AIR || this.getBlock(x, y) !== BLOCKS.AIR) continue;
            this.arenaBuildJobs.set(key, {
                key,
                mode: "arena_repair",
                x,
                y,
                type,
                assignedBuilderId: null,
            });
            added++;
        }
        return added;
    }

    findNearestSurfaceExit(body) {
        const center = worldToBlock(body.x, body.y);
        const maxRadius = Math.max(BLOCKS_X, BLOCKS_Y);
        const valid = (x, y) => {
            const cell = this.getCell(x, y);
            if (!cell || cell.region !== "surface" || cell.floor === FLOORS.WATER) return false;
            return this.getBlock(x, y) === BLOCKS.AIR;
        };
        if (valid(center.x, center.y)) return blockToWorld(center.x, center.y);
        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (const dy of [-radius, radius]) {
                    const x = center.x + dx;
                    const y = center.y + dy;
                    if (valid(x, y)) return blockToWorld(x, y);
                }
            }
            for (let dy = -radius + 1; dy <= radius - 1; dy++) {
                for (const dx of [-radius, radius]) {
                    const x = center.x + dx;
                    const y = center.y + dy;
                    if (valid(x, y)) return blockToWorld(x, y);
                }
            }
        }
        return this.spawnPoint ? { ...this.spawnPoint } : blockToWorld(0, 0);
    }

    hasArenaBuilders() {
        for (const mob of this.mobs) {
            if (mob && !mob.isDead?.() && mob.craftrasArenaBuilder) return true;
        }
        return false;
    }

    ejectUndergroundPlayersForArenaBuild(players = this.getLivingPlayers()) {
        let ejected = 0;
        const now = Date.now();
        for (const { socket, body } of players) {
            const block = worldToBlock(body.x, body.y);
            if (this.getCell(block.x, block.y)?.region !== "underground") continue;
            const exit = this.findNearestSurfaceExit(body);
            body.x = exit.x;
            body.y = exit.y;
            body.velocity.x = 0;
            body.velocity.y = 0;
            if (body.accel) {
                body.accel.x = 0;
                body.accel.y = 0;
            }
            body.craftrasArenaEjectedAt = now;
            if (now - (body.craftrasArenaEjectMessageAt || 0) > 3000) {
                body.craftrasArenaEjectMessageAt = now;
                socket?.talk?.("m", 5_000, "Arena Builders are rebuilding the caves. You were moved outside.");
            }
            ejected++;
        }
        return ejected;
    }

    findArenaBuilderSpawnLocation() {
        const minX = -Math.floor(BLOCKS_X / 2);
        const minY = -Math.floor(BLOCKS_Y / 2);
        for (let attempt = 0; attempt < 160; attempt++) {
            const x = minX + Math.floor(Math.random() * BLOCKS_X);
            const y = minY + Math.floor(Math.random() * BLOCKS_Y);
            const cell = this.getCell(x, y);
            if (!cell || cell.floor === FLOORS.WATER || this.getBlock(x, y) !== BLOCKS.AIR) continue;
            return blockToWorld(x, y);
        }
        return this.spawnPoint ? { ...this.spawnPoint } : blockToWorld(0, 0);
    }

    spawnArenaBuilders() {
        const builders = [...this.mobs].filter(mob => mob && !mob.isDead?.() && mob.craftrasArenaBuilder);
        let spawned = 0;
        for (let count = builders.length; count < ARENA_BUILDER_LIMIT; count++) {
            const builder = this.spawnMobAt(this.findArenaBuilderSpawnLocation(), "builder");
            if (!builder) break;
            builder.craftrasArenaBuilder = true;
            builder.craftrasBaseName = "Arena Builder";
            builder.name = "Arena Builder";
            builder.craftrasHeldItem = "grass_block";
            builder.craftrasFinalDashPhasing = true;
            builder.craftrasNoKnockback = true;
            builder.SIZE *= 2;
            builder.coreSize = builder.SIZE;
            builder.sizeMultiplier = 1;
            spawned++;
        }
        return spawned;
    }

    releaseArenaBuildJob(builder) {
        const key = builder?.craftrasArenaBuildJobKey;
        if (key) {
            const job = this.arenaBuildJobs.get(key);
            if (job?.assignedBuilderId === builder.id) job.assignedBuilderId = null;
        }
        if (builder) {
            builder.craftrasArenaBuildJobKey = null;
            builder.craftrasBuilderJobMode = null;
            builder.craftrasHeldItem = null;
        }
    }

    findLocalArenaBuildJob(builder) {
        const center = worldToBlock(builder.x, builder.y);
        const maxRadius = Math.max(6, Math.ceil(ARENA_BUILDER_REPAIR_RANGE / BLOCK_SIZE) * 6);
        for (let radius = 0; radius <= maxRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (const dy of radius ? [-radius, radius] : [0]) {
                    const job = this.arenaBuildJobs.get(this.wallKey(center.x + dx, center.y + dy));
                    if (job?.assignedBuilderId) continue;
                    const valid = this.validateArenaBuildJob(job);
                    if (valid) return valid;
                }
            }
            for (let dy = -radius + 1; dy <= radius - 1; dy++) {
                for (const dx of [-radius, radius]) {
                    const job = this.arenaBuildJobs.get(this.wallKey(center.x + dx, center.y + dy));
                    if (job?.assignedBuilderId) continue;
                    const valid = this.validateArenaBuildJob(job);
                    if (valid) return valid;
                }
            }
        }
        return null;
    }

    findAnyArenaBuildJob(builder) {
        let best = null;
        let bestDistance = Infinity;
        let scanned = 0;
        for (const job of this.arenaBuildJobs.values()) {
            if (++scanned > ARENA_BUILD_ASSIGN_SCAN_KEYS) break;
            if (job.assignedBuilderId) continue;
            const valid = this.validateArenaBuildJob(job);
            if (!valid) continue;
            const location = blockToWorld(valid.x, valid.y);
            const distance = Math.hypot(location.x - builder.x, location.y - builder.y);
            if (distance >= bestDistance) continue;
            best = valid;
            bestDistance = distance;
        }
        return best;
    }

    assignArenaBuildJob(builder) {
        if (!builder || builder.isDead?.()) return null;
        const existing = this.arenaBuildJobs.get(builder.craftrasArenaBuildJobKey);
        if (existing?.assignedBuilderId === builder.id) {
            const validExisting = this.validateArenaBuildJob(existing);
            if (validExisting) return validExisting;
        }
        this.releaseArenaBuildJob(builder);
        const best = this.findLocalArenaBuildJob(builder) || this.findAnyArenaBuildJob(builder);
        if (!best) return null;
        best.assignedBuilderId = builder.id;
        builder.craftrasArenaBuildJobKey = best.key;
        builder.craftrasBuilderJobMode = "arena_repair";
        builder.craftrasHeldItem = this.getVillageBuilderHeldItem(best);
        return best;
    }

    repairArenaBuildBlock(job) {
        if (!job) return false;
        const key = job.key || this.wallKey(job.x, job.y);
        if (this.isPermanentBlueprintClear(key)) {
            this.arenaBuildJobs.delete(key);
            return false;
        }
        const type = this.getArenaBuildOriginalBlock(job.x, job.y, key);
        if (type === BLOCKS.AIR) {
            this.arenaBuildJobs.delete(key);
            return false;
        }
        this.destroyedWallKeys.delete(key);
        this.damagedWallHealth.delete(key);
        this.damagedWallLastHitAt.delete(key);
        this.broadcastBlockUpdate(job.x, job.y, this.getBlockRenderCode(job.x, job.y));
        if (type === BLOCKS.TREE) this.spawnTree(job.x, job.y);
        this.arenaBuildJobs.delete(key);
        return true;
    }

    repairArenaBuildBlocksNear(builder, limit = ARENA_BUILDER_REPAIRS_PER_TICK) {
        if (!builder || !this.arenaBuildJobs.size || limit <= 0) return 0;
        const budget = Math.min(limit, this.arenaBuildRepairBudget ?? limit);
        if (budget <= 0) return 0;
        const center = worldToBlock(builder.x, builder.y);
        const radiusBlocks = Math.ceil(ARENA_BUILDER_REPAIR_RANGE / BLOCK_SIZE);
        const radiusSquared = ARENA_BUILDER_REPAIR_RANGE * ARENA_BUILDER_REPAIR_RANGE;
        let repaired = 0;
        for (let y = center.y - radiusBlocks; y <= center.y + radiusBlocks && repaired < budget; y++) {
            for (let x = center.x - radiusBlocks; x <= center.x + radiusBlocks && repaired < budget; x++) {
                const key = this.wallKey(x, y);
                const job = this.arenaBuildJobs.get(key);
                if (!job) continue;
                const target = blockToWorld(x, y);
                if ((target.x - builder.x) ** 2 + (target.y - builder.y) ** 2 > radiusSquared) continue;
                if (this.repairArenaBuildBlock(job)) repaired++;
            }
        }
        this.arenaBuildRepairBudget = Math.max(0, (this.arenaBuildRepairBudget ?? budget) - repaired);
        return repaired;
    }

    updateArenaBuilder(builder, now) {
        let job = this.arenaBuildJobs.get(builder.craftrasArenaBuildJobKey);
        if (!job || job.assignedBuilderId !== builder.id) job = this.assignArenaBuildJob(builder);
        builder.velocity.x = 0;
        builder.velocity.y = 0;
        if (builder.accel) {
            builder.accel.x = 0;
            builder.accel.y = 0;
        }
        if (!job) {
            builder.craftrasControl = {
                goal: { x: builder.x, y: builder.y },
                target: { x: Math.cos(builder.facing || 0), y: Math.sin(builder.facing || 0) },
                fire: false,
                power: 0,
            };
            if (!this.arenaBuildScanActive && (!this.arenaBuildJobs.size || now - (builder.craftrasArenaNoJobSince ||= now) > 4000)) {
                this.releaseArenaBuildJob(builder);
                this.mobs.delete(builder);
                builder.destroy();
            }
            return;
        }
        builder.craftrasArenaNoJobSince = 0;
        builder.craftrasHeldItem = this.getVillageBuilderHeldItem(job);
        const target = blockToWorld(job.x, job.y);
        const dx = target.x - builder.x;
        const dy = target.y - builder.y;
        const distance = Math.hypot(dx, dy) || 1;
        builder.craftrasControl = {
            goal: { x: target.x, y: target.y },
            target: { x: dx, y: dy },
            fire: false,
            power: 0,
        };
        if (distance <= ARENA_BUILDER_REPAIR_RANGE || distance <= ARENA_BUILDER_SPEED_PER_TICK) {
            builder.x = target.x;
            builder.y = target.y;
            this.repairArenaBuildBlocksNear(builder);
            this.releaseArenaBuildJob(builder);
            this.assignArenaBuildJob(builder);
            return;
        }
        builder.x += dx / distance * ARENA_BUILDER_SPEED_PER_TICK;
        builder.y += dy / distance * ARENA_BUILDER_SPEED_PER_TICK;
        this.repairArenaBuildBlocksNear(builder, Math.ceil(ARENA_BUILDER_REPAIRS_PER_TICK / 2));
        builder.velocity.x = 0;
        builder.velocity.y = 0;
        if (builder.accel) {
            builder.accel.x = 0;
            builder.accel.y = 0;
        }
    }

    updateArenaBuildCycle(now) {
        if (Config.craftras_village_builder) return;
        if (this.arenaBuildScanActive) this.processArenaBuildJobScan();
        if (this.arenaBuildActive && !this.arenaBuildScanActive && !this.arenaBuildJobs.size) {
            this.arenaBuildActive = false;
        }
        if (now < (this.nextArenaBuildAt || 0)) return;
        this.startArenaBuild({ automatic: true });
    }

    startArenaBuild({ automatic = false } = {}) {
        if (!Config.craftras || Config.craftras_village_builder) return { started: false, reason: "disabled" };
        this.nextArenaBuildAt = Date.now() + ARENA_BUILD_INTERVAL;
        const ejected = this.ejectUndergroundPlayersForArenaBuild();
        const candidates = this.prepareArenaBuildJobScan();
        this.processArenaBuildJobScan();
        const spawned = candidates ? this.spawnArenaBuilders() : 0;
        this.arenaBuildActive = candidates > 0;
        const message = candidates
            ? `Arena Build ${automatic ? "started" : "triggered"}: scanning ${candidates} broken block(s), ${spawned} builder(s), ${ejected} player(s) moved.`
            : `Arena Build ${automatic ? "started" : "triggered"}: no broken generated blocks, ${ejected} player(s) moved.`;
        for (const client of this.gameManager.clients) client?.talk?.("m", 8_000, message);
        return { started: true, jobs: candidates, spawned, ejected };
    }

    scheduleNuclearArenaBuild() {
        if (!Config.craftras || Config.craftras_village_builder) return;
        if (this.nuclearArenaBuildTimeout) clearTimeout(this.nuclearArenaBuildTimeout);
        for (const client of this.gameManager.clients) {
            client?.talk?.("BM", Config.popup_message_duration, "World 1 has been severely destroyed.");
        }
        this.nuclearArenaBuildTimeout = setTimeout(() => {
            this.nuclearArenaBuildTimeout = null;
            this.startArenaBuild({ automatic: false });
        }, 60_000);
    }

    getVillageBuilderHeldItem(job) {
        if (job?.mode === "demolish") return "diamond_pickaxe";
        return BLOCK_DROPS[job?.type]?.id || null;
    }

    releaseVillageRepairJob(builder) {
        for (const [property, jobs] of [
            ["craftrasRepairJobKey", this.villageRepairJobs],
            ["craftrasDemolitionJobKey", this.villageDemolitionJobs],
        ]) {
            const key = builder?.[property];
            if (!key) continue;
            const job = jobs.get(key);
            if (job?.assignedBuilderId === builder.id) job.assignedBuilderId = null;
        }
        if (builder) {
            builder.craftrasRepairJobKey = null;
            builder.craftrasDemolitionJobKey = null;
            builder.craftrasBuilderJobMode = null;
            builder.craftrasBuilderJobStartedAt = 0;
            builder.craftrasHeldItem = null;
            builder.craftrasFinalDashPhasing = false;
            builder.craftrasWanderPath = null;
            builder.craftrasWanderPathIndex = 0;
        }
    }

    assignVillageRepairJob(builder) {
        if (!builder || builder.isDead?.()) return null;
        const existing = this.villageRepairJobs.get(builder.craftrasRepairJobKey);
        if (existing?.assignedBuilderId === builder.id) {
            const block = this.getBlock(existing.x, existing.y);
            if (block === BLOCKS.AIR) return existing;
            if (block === existing.type) this.villageRepairJobs.delete(existing.key);
            else {
                this.registerVillageDemolitionJob(existing.x, existing.y, block);
                existing.assignedBuilderId = null;
            }
            builder.craftrasRepairJobKey = null;
        }
        const existingDemolition = this.villageDemolitionJobs.get(builder.craftrasDemolitionJobKey);
        if (existingDemolition?.assignedBuilderId === builder.id) {
            const block = this.getBlock(existingDemolition.x, existingDemolition.y);
            const original = this.villageOriginalBlocks.get(existingDemolition.key);
            if (block !== BLOCKS.AIR && original?.type !== block) return existingDemolition;
            this.villageDemolitionJobs.delete(existingDemolition.key);
            builder.craftrasDemolitionJobKey = null;
        }

        this.releaseVillageRepairJob(builder);
        let best = null;
        let bestDistance = Infinity;
        const considerJob = job => {
            if (job.assignedBuilderId) return;
            const block = this.getBlock(job.x, job.y);
            if (job.mode === "repair" && block !== BLOCKS.AIR) {
                if (block === job.type) this.villageRepairJobs.delete(job.key);
                else this.registerVillageDemolitionJob(job.x, job.y, block);
                return;
            }
            if (job.mode === "demolish") {
                const original = this.villageOriginalBlocks.get(job.key);
                if (block === BLOCKS.AIR || original?.type === block) {
                    this.villageDemolitionJobs.delete(job.key);
                    return;
                }
            }
            const location = blockToWorld(job.x, job.y);
            const distance = Math.hypot(location.x - builder.x, location.y - builder.y);
            if (distance >= bestDistance) return;
            best = job;
            bestDistance = distance;
        };
        for (const job of this.villageRepairJobs.values()) considerJob(job);
        for (const job of this.villageDemolitionJobs.values()) considerJob(job);
        if (!best) return null;
        best.assignedBuilderId = builder.id;
        best.assignedAt = Date.now();
        builder.craftrasBuilderJobMode = best.mode;
        if (best.mode === "demolish") builder.craftrasDemolitionJobKey = best.key;
        else builder.craftrasRepairJobKey = best.key;
        builder.craftrasBuilderJobStartedAt = best.assignedAt;
        builder.craftrasHeldItem = this.getVillageBuilderHeldItem(best);
        builder.craftrasNextPathAt = 0;
        builder.craftrasPath = null;
        builder.craftrasPathIndex = 0;
        builder.craftrasNoRepairJobSince = 0;
        return best;
    }

    findVillageBuilderSpawnLocation() {
        const bounds = this.villageBounds;
        if (!bounds) return this.spawnPoint ? { ...this.spawnPoint } : blockToWorld(0, 0);
        for (let attempt = 0; attempt < 96; attempt++) {
            const x = bounds.minX + Math.floor(Math.random() * (bounds.maxX - bounds.minX + 1));
            const y = bounds.minY + Math.floor(Math.random() * (bounds.maxY - bounds.minY + 1));
            if (this.getBlock(x, y) !== BLOCKS.AIR) continue;
            return blockToWorld(x, y);
        }
        return blockToWorld(
            Math.round((bounds.minX + bounds.maxX) / 2),
            Math.round((bounds.minY + bounds.maxY) / 2),
        );
    }

    updateVillageRepairers(now) {
        this.scanVillageDemolitionJobs(now);
        if (Config.craftras_village_builder || (!this.villageRepairJobs.size && !this.villageDemolitionJobs.size)) return;
        const builders = [...this.mobs].filter(mob => mob
            && !mob.isDead?.()
            && mob.craftrasMobType === "builder"
            && !mob.craftrasArenaBuilder
            && !mob.craftrasKingdomGhostBuilder);
        const livingBuilderIds = new Set(builders.map(builder => builder.id));
        const activeRepairJobKeys = new Set(builders.map(builder => builder.craftrasRepairJobKey).filter(Boolean));
        const activeDemolitionJobKeys = new Set(builders.map(builder => builder.craftrasDemolitionJobKey).filter(Boolean));
        for (const job of [...this.villageRepairJobs.values()]) {
            const block = this.getBlock(job.x, job.y);
            if (block === job.type) {
                this.villageRepairJobs.delete(job.key);
                continue;
            }
            if (block !== BLOCKS.AIR) this.registerVillageDemolitionJob(job.x, job.y, block);
            if (job.assignedBuilderId && (!livingBuilderIds.has(job.assignedBuilderId) || !activeRepairJobKeys.has(job.key))) job.assignedBuilderId = null;
        }
        for (const job of [...this.villageDemolitionJobs.values()]) {
            const block = this.getBlock(job.x, job.y);
            const original = this.villageOriginalBlocks.get(job.key);
            if (block === BLOCKS.AIR || original?.type === block || VILLAGE_IGNORED_DECORATION_BLOCKS.has(block)) {
                this.villageDemolitionJobs.delete(job.key);
                continue;
            }
            if (job.assignedBuilderId && (!livingBuilderIds.has(job.assignedBuilderId) || !activeDemolitionJobKeys.has(job.key))) job.assignedBuilderId = null;
        }

        let builderCount = builders.length;
        while (builderCount < VILLAGE_BUILDER_LIMIT) {
            const hasUnassignedJob = [...this.villageRepairJobs.values()].some(job => !job.assignedBuilderId)
                || [...this.villageDemolitionJobs.values()].some(job => !job.assignedBuilderId);
            if (!hasUnassignedJob) break;
            const builder = this.spawnMobAt(this.findVillageBuilderSpawnLocation(), "builder");
            if (!builder) break;
            this.assignVillageRepairJob(builder);
            builderCount++;
        }
    }

    updateVillageBuilder(builder, now) {
        let job = this.villageRepairJobs.get(builder.craftrasRepairJobKey)
            || this.villageDemolitionJobs.get(builder.craftrasDemolitionJobKey);
        if (!job || job.assignedBuilderId !== builder.id) job = this.assignVillageRepairJob(builder);
        if (!job) {
            builder.craftrasHeldItem = null;
            builder.craftrasFinalDashPhasing = false;
            builder.craftrasNoRepairJobSince ||= now;
            builder.craftrasControl = {
                goal: { x: builder.x, y: builder.y },
                target: { x: Math.cos(builder.facing || 0), y: Math.sin(builder.facing || 0) },
                fire: false,
                power: 0,
            };
            if (now - builder.craftrasNoRepairJobSince > 4000) {
                this.releaseVillageRepairJob(builder);
                this.mobs.delete(builder);
                builder.destroy();
            }
            return;
        }

        builder.craftrasNoRepairJobSince = 0;
        builder.craftrasFinalDashPhasing = true;
        builder.craftrasHeldItem = this.getVillageBuilderHeldItem(job);
        const target = blockToWorld(job.x, job.y);
        const distanceToTarget = Math.hypot(target.x - builder.x, target.y - builder.y);
        const jobAge = now - (builder.craftrasBuilderJobStartedAt || job.assignedAt || now);
        if (job.mode === "repair" && (
            this.getBlock(job.x, job.y) !== BLOCKS.AIR ||
            distanceToTarget <= VILLAGE_BUILDER_REPAIR_RANGE ||
            (jobAge >= VILLAGE_BUILDER_REPAIR_FORCE_AFTER && distanceToTarget <= VILLAGE_BUILDER_REPAIR_FORCE_RANGE)
        )) {
            this.repairVillageBlock(job);
            this.releaseVillageRepairJob(builder);
            this.assignVillageRepairJob(builder);
            return;
        }
        if (job.mode === "demolish" && this.getBlock(job.x, job.y) === BLOCKS.AIR) {
            const original = this.villageOriginalBlocks.get(job.key);
            this.villageDemolitionJobs.delete(job.key);
            if (original && this.getBlock(job.x, job.y) === BLOCKS.AIR) this.registerVillageRepairJob(job.x, job.y, original.type);
            this.releaseVillageRepairJob(builder);
            this.assignVillageRepairJob(builder);
            return;
        }
        if (job.mode === "demolish") {
            if (VILLAGE_IGNORED_DECORATION_BLOCKS.has(this.getBlock(job.x, job.y))) {
                this.villageDemolitionJobs.delete(job.key);
                this.releaseVillageRepairJob(builder);
                this.assignVillageRepairJob(builder);
                return;
            }
            const original = this.villageOriginalBlocks.get(job.key);
            if (original?.type === this.getBlock(job.x, job.y)) {
                this.villageDemolitionJobs.delete(job.key);
                this.releaseVillageRepairJob(builder);
                this.assignVillageRepairJob(builder);
                return;
            }
        }

        const targetKey = job.key;
        if (now >= (builder.craftrasNextPathAt || 0) || builder.craftrasPathTargetKey !== targetKey) {
            builder.craftrasNextPathAt = now + 650;
            builder.craftrasPathTargetKey = targetKey;
            builder.craftrasPath = this.findMobPath(builder, target) || [];
            builder.craftrasPathIndex = 0;
        }

        const path = builder.craftrasPath || [];
        let waypoint = path[builder.craftrasPathIndex] || { x: job.x, y: job.y };
        let worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        if (Math.hypot(worldWaypoint.x - builder.x, worldWaypoint.y - builder.y) < BLOCK_SIZE * 0.28 && builder.craftrasPathIndex < path.length - 1) {
            builder.craftrasPathIndex++;
            waypoint = path[builder.craftrasPathIndex];
            worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        }
        builder.craftrasControl = {
            goal: { x: worldWaypoint.x, y: worldWaypoint.y },
            target: { x: target.x - builder.x, y: target.y - builder.y },
            fire: job.mode === "demolish" && distanceToTarget <= VILLAGE_BUILDER_REPAIR_RANGE * 1.35,
            power: job.mode === "demolish" && distanceToTarget <= VILLAGE_BUILDER_REPAIR_RANGE * 1.35 ? 0 : 0.85,
        };
    }

    isKingdomGhostRepairActive() {
        return this.isWeatherEnabled()
            && this.weatherType === "rain"
            && this.kingdomWeatherState === "intact"
            && !!this.kingdomBlueprintStates?.intact;
    }

    releaseKingdomGhostRepairJob(builder) {
        const key = builder?.craftrasKingdomGhostRepairJobKey;
        if (key) {
            const job = this.kingdomGhostRepairJobs.get(key);
            if (job?.assignedBuilderId === builder.id) job.assignedBuilderId = null;
        }
        if (!builder) return;
        builder.craftrasKingdomGhostRepairJobKey = null;
        builder.craftrasBuilderJobMode = null;
        builder.craftrasBuilderJobStartedAt = 0;
        builder.craftrasHeldItem = null;
    }

    clearKingdomGhostRepairers() {
        this.kingdomGhostRepairJobs.clear();
        this.nextKingdomGhostRepairScanAt = 0;
        for (const builder of [...this.mobs]) {
            if (!builder?.craftrasKingdomGhostBuilder) continue;
            this.releaseKingdomGhostRepairJob(builder);
            this.mobs.delete(builder);
            builder.destroy();
        }
    }

    scanKingdomGhostRepairJobs(now) {
        if (now < (this.nextKingdomGhostRepairScanAt || 0)) return;
        this.nextKingdomGhostRepairScanAt = now + KINGDOM_GHOST_BUILDER_SCAN_INTERVAL;
        const intact = this.kingdomBlueprintStates?.intact;
        if (!intact) return;
        const livingBuilderIds = new Set([...this.mobs]
            .filter(mob => mob && !mob.isDead?.() && mob.craftrasKingdomGhostBuilder)
            .map(mob => mob.id));

        for (const [key, job] of [...this.kingdomGhostRepairJobs]) {
            const original = intact.blocks.get(key);
            const current = original ? this.getBlock(original.x, original.y) : BLOCKS.AIR;
            const damaged = original && current === original.type && this.damagedWallHealth.has(key);
            if (!original || current !== BLOCKS.AIR && !damaged) {
                this.kingdomGhostRepairJobs.delete(key);
                continue;
            }
            if (job.assignedBuilderId && !livingBuilderIds.has(job.assignedBuilderId)) job.assignedBuilderId = null;
        }

        for (const [key, original] of intact.blocks) {
            const current = this.getBlock(original.x, original.y);
            const damaged = current === original.type && this.damagedWallHealth.has(key);
            if (current !== BLOCKS.AIR && !damaged) continue;
            const existing = this.kingdomGhostRepairJobs.get(key);
            if (existing) {
                existing.type = original.type;
                existing.direction = original.direction || 0;
                continue;
            }
            this.kingdomGhostRepairJobs.set(key, {
                key,
                mode: "kingdom_ghost_repair",
                x: original.x,
                y: original.y,
                type: original.type,
                direction: original.direction || 0,
                assignedBuilderId: null,
            });
        }
    }

    assignKingdomGhostRepairJob(builder) {
        if (!builder || builder.isDead?.()) return null;
        const existing = this.kingdomGhostRepairJobs.get(builder.craftrasKingdomGhostRepairJobKey);
        if (existing?.assignedBuilderId === builder.id) return existing;
        this.releaseKingdomGhostRepairJob(builder);
        let best = null;
        let bestDistance = Infinity;
        for (const job of this.kingdomGhostRepairJobs.values()) {
            if (job.assignedBuilderId) continue;
            const current = this.getBlock(job.x, job.y);
            if (current !== BLOCKS.AIR && !(current === job.type && this.damagedWallHealth.has(job.key))) continue;
            const target = blockToWorld(job.x, job.y);
            const distance = Math.hypot(target.x - builder.x, target.y - builder.y);
            if (distance >= bestDistance) continue;
            best = job;
            bestDistance = distance;
        }
        if (!best) return null;
        best.assignedBuilderId = builder.id;
        best.assignedAt = Date.now();
        builder.craftrasKingdomGhostRepairJobKey = best.key;
        builder.craftrasBuilderJobMode = best.mode;
        builder.craftrasBuilderJobStartedAt = best.assignedAt;
        builder.craftrasHeldItem = this.getVillageBuilderHeldItem(best);
        builder.craftrasGhostNoJobSince = 0;
        return best;
    }

    repairKingdomGhostBlock(job) {
        if (!job) return false;
        const intact = this.kingdomBlueprintStates?.intact;
        const original = intact?.blocks.get(job.key);
        if (!original) {
            this.kingdomGhostRepairJobs.delete(job.key);
            return false;
        }
        const current = this.getBlock(original.x, original.y);
        if (current !== BLOCKS.AIR && current !== original.type) {
            this.kingdomGhostRepairJobs.delete(job.key);
            return false;
        }
        if (current === BLOCKS.AIR) {
            this.destroyedWallKeys.delete(job.key);
            this.placedBlocks.set(job.key, original.type);
            this.placedBlockDirections.set(job.key, original.direction || 0);
            if (original.type === BLOCKS.FURNACE && !this.furnaces.has(job.key)) this.furnaces.set(job.key, { slots: [null, null, null], active: false, finishAt: 0 });
            if (original.type === BLOCKS.CHEST && !this.chests.has(job.key)) this.chests.set(job.key, { slots: Array(27).fill(null) });
            if (original.type === BLOCKS.TREE) this.spawnTree(original.x, original.y);
        }
        this.damagedWallHealth.delete(job.key);
        this.damagedWallLastHitAt.delete(job.key);
        const intendedDamageStage = intact.damageStages.get(job.key);
        if (intendedDamageStage) this.permanentBlockDamageStages.set(job.key, intendedDamageStage);
        else this.permanentBlockDamageStages.delete(job.key);
        this.broadcastBlockUpdate(original.x, original.y, this.getBlockRenderCode(original.x, original.y));
        this.kingdomGhostRepairJobs.delete(job.key);
        return true;
    }

    findKingdomGhostBuilderSpawnLocation() {
        const jobs = [...this.kingdomGhostRepairJobs.values()];
        if (!jobs.length) return this.spawnPoint ? { ...this.spawnPoint } : blockToWorld(0, 0);
        for (let attempt = 0; attempt < 40; attempt++) {
            const anchor = jobs[Math.floor(Math.random() * jobs.length)];
            const x = anchor.x + Math.floor(Math.random() * 21) - 10;
            const y = anchor.y + Math.floor(Math.random() * 21) - 10;
            if (isBrokenKingdomSurfaceCell(x, y)) return blockToWorld(x, y);
        }
        return blockToWorld(jobs[0].x, jobs[0].y);
    }

    spawnKingdomGhostBuilder() {
        const builder = this.spawnMobAt(this.findKingdomGhostBuilderSpawnLocation(), "builder");
        if (!builder) return null;
        builder.craftrasKingdomGhostBuilder = true;
        builder.craftrasBaseName = "Ghost Builder";
        builder.name = "Ghost Builder";
        builder.nameColor = "#c9f4ff";
        builder.color.base = "#a9e8f5";
        builder.craftrasBaseColor = builder.color.base;
        builder.alpha = KINGDOM_GHOST_BUILDER_ALPHA;
        builder.craftrasFinalDashPhasing = true;
        builder.craftrasNoKnockback = true;
        if (builder.settings) builder.settings.goThruObstacle = true;
        this.assignKingdomGhostRepairJob(builder);
        return builder;
    }

    updateKingdomGhostRepairers(now) {
        if (!this.isKingdomGhostRepairActive()) {
            if (this.kingdomGhostRepairJobs.size || [...this.mobs].some(mob => mob?.craftrasKingdomGhostBuilder)) this.clearKingdomGhostRepairers();
            return;
        }
        this.scanKingdomGhostRepairJobs(now);
        const builders = [...this.mobs].filter(mob => mob && !mob.isDead?.() && mob.craftrasKingdomGhostBuilder);
        let builderCount = builders.length;
        while (builderCount < KINGDOM_GHOST_BUILDER_LIMIT) {
            if (![...this.kingdomGhostRepairJobs.values()].some(job => !job.assignedBuilderId)) break;
            if (!this.spawnKingdomGhostBuilder()) break;
            builderCount++;
        }
    }

    updateKingdomGhostBuilder(builder, now) {
        if (!this.isKingdomGhostRepairActive()) {
            this.releaseKingdomGhostRepairJob(builder);
            this.mobs.delete(builder);
            builder.destroy();
            return;
        }
        builder.craftrasFinalDashPhasing = true;
        builder.alpha = KINGDOM_GHOST_BUILDER_ALPHA;
        builder.color.base = "#a9e8f5";
        let job = this.kingdomGhostRepairJobs.get(builder.craftrasKingdomGhostRepairJobKey);
        if (!job || job.assignedBuilderId !== builder.id) job = this.assignKingdomGhostRepairJob(builder);
        if (!job) {
            builder.craftrasHeldItem = null;
            builder.craftrasGhostNoJobSince ||= now;
            builder.craftrasControl = {
                goal: { x: builder.x, y: builder.y },
                target: { x: Math.cos(builder.facing || 0), y: Math.sin(builder.facing || 0) },
                fire: false,
                power: 0,
            };
            if (now - builder.craftrasGhostNoJobSince > KINGDOM_GHOST_BUILDER_DESPAWN_DELAY) {
                this.releaseKingdomGhostRepairJob(builder);
                this.mobs.delete(builder);
                builder.destroy();
            }
            return;
        }
        builder.craftrasGhostNoJobSince = 0;
        builder.craftrasHeldItem = this.getVillageBuilderHeldItem(job);
        const target = blockToWorld(job.x, job.y);
        const dx = target.x - builder.x;
        const dy = target.y - builder.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= VILLAGE_BUILDER_REPAIR_RANGE) {
            this.repairKingdomGhostBlock(job);
            this.releaseKingdomGhostRepairJob(builder);
            this.assignKingdomGhostRepairJob(builder);
            return;
        }
        builder.craftrasControl = {
            goal: { x: target.x, y: target.y },
            target: { x: dx, y: dy },
            fire: false,
            power: 0.85,
        };
    }

    buildMonsterPlaces() {
        return (MANUAL_CAVES.rooms || [])
            .filter(room => ["hotspot", "zombie_boss_room", "queen_spider_boss_room"].includes(room.type))
            .map((room, index) => ({
                id: `${room.type}:${index}`,
                type: room.type,
                blockX: Math.round(room.blockX || 0),
                blockY: Math.round(room.blockY || 0),
                radius: Math.max(8, Math.ceil(room.radius || 12)),
            }));
    }

    isPlayerInMonsterPlace(body, place) {
        if (!body || !place) return false;
        const cell = worldToBlock(body.x, body.y);
        return Math.hypot(cell.x - place.blockX, cell.y - place.blockY) <= place.radius;
    }

    getMonsterPlaceById(placeId) {
        if (!placeId) return null;
        return (this.monsterPlaces || []).find(place => place.id === placeId) || null;
    }

    isWorldLocationInMonsterPlace(location, place, margin = 0) {
        if (!location || !place) return false;
        const cell = worldToBlock(location.x, location.y);
        return Math.hypot(cell.x - place.blockX, cell.y - place.blockY) <= Math.max(1, place.radius - margin);
    }

    isMobRetreatPathClear(from, goal, place = null, placeMargin = 1) {
        if (!from || !goal) return false;
        const distance = Math.hypot(goal.x - from.x, goal.y - from.y);
        const steps = Math.max(2, Math.ceil(distance / (BLOCK_SIZE * 0.35)));
        for (let step = 1; step <= steps; step++) {
            const probe = {
                x: from.x + (goal.x - from.x) * step / steps,
                y: from.y + (goal.y - from.y) * step / steps,
            };
            if (place && !this.isWorldLocationInMonsterPlace(probe, place, placeMargin)) return false;
            const cell = worldToBlock(probe.x, probe.y);
            if (this.isMovementBlockingBlock(this.getBlock(cell.x, cell.y))) return false;
        }
        return true;
    }

    findMobRetreatGoal(mob, target, options = {}) {
        if (!mob || !target) return null;
        const baseDx = mob.x - target.x;
        const baseDy = mob.y - target.y;
        const baseAngle = Math.atan2(baseDy, baseDx);
        const distanceBlocks = options.distanceBlocks || 2.5;
        const place = options.place || null;
        const placeMargin = options.placeMargin || 1;
        const angleOffsets = [0, 0.25, -0.25, 0.5, -0.5, 0.85, -0.85, 1.2, -1.2, Math.PI * 0.5, -Math.PI * 0.5, Math.PI * 0.75, -Math.PI * 0.75, Math.PI, -Math.PI];
        const distanceMultipliers = [1, 0.7, 0.45, 1.25];
        let best = null;
        let bestScore = -Infinity;
        const considerGoal = (angle, distanceMultiplier, anglePenalty = 0) => {
            const goal = {
                x: mob.x + Math.cos(angle) * BLOCK_SIZE * distanceBlocks * distanceMultiplier,
                y: mob.y + Math.sin(angle) * BLOCK_SIZE * distanceBlocks * distanceMultiplier,
            };
            if (!this.isMobRetreatPathClear(mob, goal, place, placeMargin)) return;
            const score = Math.hypot(goal.x - target.x, goal.y - target.y) - anglePenalty * BLOCK_SIZE * 0.12 + distanceMultiplier * 3;
            if (score <= bestScore) return;
            bestScore = score;
            best = goal;
        };
        for (const distanceMultiplier of distanceMultipliers) {
            for (const offset of angleOffsets) considerGoal(baseAngle + offset, distanceMultiplier, Math.abs(offset));
        }
        if (!best) {
            for (let i = 0; i < 16; i++) {
                const angle = Math.PI * 2 * i / 16;
                for (const distanceMultiplier of [0.5, 0.85, 1.15]) considerGoal(angle, distanceMultiplier, 1.5);
            }
        }
        if (best) return best;
        if (!place) return null;
        const center = blockToWorld(place.blockX, place.blockY);
        return this.isMobRetreatPathClear(mob, center, place, -1) ? center : null;
    }

    getActiveMonsterPlaces(players) {
        const active = [];
        for (const place of this.monsterPlaces) {
            const members = players.filter(({ body }) => this.isPlayerInMonsterPlace(body, place));
            if (members.length) active.push({ place, players: members });
        }
        return active;
    }

    getPassiveBossCavePlaces(activePlaceIds) {
        return this.monsterPlaces
            .filter(place => CRAFTRAS_BOSS_CAVE_TYPES.has(place.type) && !activePlaceIds.has(place.id))
            .map(place => ({ place, players: [], passive: true }));
    }

    resetInactiveZombieCavePressure(activePlaceIds, now) {
        for (const place of this.monsterPlaces) {
            if (place.type !== "zombie_boss_room" || activePlaceIds.has(place.id)) continue;
            place.craftrasZombieCavePressureMs = 0;
            place.craftrasZombieCavePressureLastAt = now;
        }
    }

    getZombieCaveSpawnMultiplier(pressureMs) {
        const minutes = Math.max(0, pressureMs || 0) / 60_000;
        if (minutes <= 2) return 1 + minutes * 0.05;
        if (minutes <= 3) return 1.1 + (minutes - 2) * 0.2;
        return Math.min(2, 1.3 + (minutes - 3) * 0.1);
    }

    updateZombieCavePressure(place, now) {
        if (place.type !== "zombie_boss_room") return 1;
        place.craftrasZombieCavePressureLastAt ??= now;
        const elapsed = Math.max(0, now - place.craftrasZombieCavePressureLastAt) * Math.max(0.1, this.dayCycleSpeed || 1);
        place.craftrasZombieCavePressureMs = Math.max(0, (place.craftrasZombieCavePressureMs || 0) + elapsed);
        place.craftrasZombieCavePressureLastAt = now;
        return this.getZombieCaveSpawnMultiplier(place.craftrasZombieCavePressureMs);
    }

    getZombieCaveMobCap(place, players = []) {
        const activePlayers = players?.length || 0;
        const timeBonus = Math.floor((place?.craftrasZombieCavePressureMs || 0) / CRAFTRAS_ZOMBIE_CAVE_MOB_CAP_GROWTH_INTERVAL);
        return CRAFTRAS_ZOMBIE_CAVE_BASE_MOB_CAP
            + activePlayers * CRAFTRAS_ZOMBIE_CAVE_MOB_CAP_PER_PLAYER
            + timeBonus;
    }

    getZombieVariant(placeType = null) {
        const chanceMultiplier = placeType === "zombie_boss_room" ? 3 : 1;
        const giantChance = Math.min(1, 0.03 * chanceMultiplier);
        if (Math.random() < giantChance) {
            return {
                type: "giant_zombie",
                label: "Giant Zombie",
                health: 500,
                contactDamage: 30,
                scoreMultiplier: 3,
                noKnockback: true,
            };
        }

        const helmet = Math.random() < Math.min(1, 0.10 * chanceMultiplier)
            ? (Math.random() < 0.70 ? "iron" : "diamond")
            : null;
        const sword = Math.random() < Math.min(1, 0.06 * chanceMultiplier)
            ? (Math.random() < 0.70 ? "iron" : "diamond")
            : null;
        let health = 100;
        let scoreMultiplier = 1;
        if (helmet === "iron") {
            health += 100;
            scoreMultiplier *= 1.5;
        } else if (helmet === "diamond") {
            health += 200;
            scoreMultiplier *= 2;
        }
        if (sword === "iron") scoreMultiplier *= 1.5;
        else if (sword === "diamond") scoreMultiplier *= 2;

        const parts = [];
        if (helmet) parts.push(helmet === "iron" ? "Iron Helmet" : "Diamond Helmet");
        if (sword) parts.push(sword === "iron" ? "Iron Sword" : "Diamond Sword");
        return {
            type: "zombie",
            label: `${parts.length ? `${parts.join(" ")} ` : ""}Zombie`,
            health,
            helmet,
            sword,
            swordDamage: sword === "diamond" ? 60 : sword === "iron" ? 40 : 0,
            scoreMultiplier,
        };
    }

    getSkeletonVariant() {
        const roll = Math.random();
        if (roll < 0.12) return "sniper_skeleton";
        if (roll < 0.20) return "cannon_skeleton";
        return "skeleton";
    }

    getExplicitMobVariant(type) {
        if (type === "iron_helmet_zombie") return { type: "zombie", label: "Iron Helmet Zombie", health: 200, helmet: "iron", sword: null, swordDamage: 0, scoreMultiplier: 1.5 };
        if (type === "diamond_helmet_zombie") return { type: "zombie", label: "Diamond Helmet Zombie", health: 300, helmet: "diamond", sword: null, swordDamage: 0, scoreMultiplier: 2 };
        if (type === "iron_sword_zombie") return { type: "zombie", label: "Iron Sword Zombie", health: 100, helmet: null, sword: "iron", swordDamage: 40, scoreMultiplier: 1.5 };
        if (type === "diamond_sword_zombie") return { type: "zombie", label: "Diamond Sword Zombie", health: 100, helmet: null, sword: "diamond", swordDamage: 60, scoreMultiplier: 2 };
        if (type === "giant_zombie") return { type: "giant_zombie", label: "Giant Zombie", health: 500, contactDamage: 30, scoreMultiplier: 3, noKnockback: true };
        if (type === "runner_zombie") return { type: "runner_zombie", label: "Runner Zombie", health: 100, contactDamage: 20, scoreMultiplier: 1, noKnockback: false };
        if (type === "cursed_zombie") return { type: "cursed_zombie", label: "Cursed Zombie", health: 1, contactDamage: 0, scoreMultiplier: 0, noKnockback: false };
        if (type === "titan_zombie") return { type: "titan_zombie", label: "Titan Zombie", health: 4000, contactDamage: 80, scoreMultiplier: 4, noKnockback: false };
        if (type === "magical_zombie") return { type: "magical_zombie", label: "Magical Zombie", health: 1_000_000_000, contactDamage: 0, scoreMultiplier: 0, noKnockback: true };
        if (type === "king_zombie") return { type: "king_zombie", label: "King Zombie", health: 400, helmet: "zombie_crown", sword: null, swordDamage: 0, contactDamage: 0, scoreMultiplier: 6, noKnockback: false };
        if (type === "king_guardian") return { type: "king_guardian", label: "Knight Zombie", health: 1000, helmet: "iron", sword: "iron", shield: "knight_shield", swordDamage: 30, contactDamage: 0, scoreMultiplier: 3, noKnockback: true };
        if (type === "sniper_skeleton") return { type: "sniper_skeleton", label: "Sniper Skeleton", health: 500, scoreMultiplier: 1.4 };
        if (type === "cannon_skeleton") return { type: "cannon_skeleton", label: "Cannon Skeleton", health: 1500, scoreMultiplier: 2 };
        if (type === "sword_guy") return { type: "sword_guy", label: "Sword guy", health: 1000, sword: "diamond", swordDamage: 60, contactDamage: 0, scoreMultiplier: 10, noKnockback: true };
        if (type === "queen_spider") return { type: "queen_spider", label: "Queen Spider", health: 2500, contactDamage: 30, scoreMultiplier: 12, noKnockback: true };
        if (type === "annihilator") return { type: "annihilator", label: "Annihilator", health: 1500, contactDamage: 0, scoreMultiplier: 5, noKnockback: true };
        if (type === "the_nuclear") return { type: "the_nuclear", label: "The Nuclear", health: 10000, contactDamage: 0, scoreMultiplier: 20, noKnockback: true };
        return null;
    }

    getNaturalBossTypeForPlace(place) {
        if (place?.type === "zombie_boss_room") return "king_zombie";
        if (place?.type === "queen_spider_boss_room") return "queen_spider";
        return null;
    }

    isNaturalBossForPlace(place, mob) {
        const bossType = this.getNaturalBossTypeForPlace(place);
        return !!bossType && mob?.craftrasMobType === bossType;
    }

    countMobsForPlace(placeId, options = {}) {
        let count = 0;
        for (const mob of this.mobs) {
            if (mob && !mob.isDead?.() && mob.craftrasSpawnPlaceId === placeId) count++;
        }
        return count;
    }

    countNormalMobsForPlace(place) {
        let count = 0;
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || mob.craftrasSpawnPlaceId !== place?.id) continue;
            if (this.isNaturalBossForPlace(place, mob)) continue;
            count++;
        }
        return count;
    }

    hasNaturalBossInPlace(place) {
        for (const mob of this.mobs) {
            if (mob && !mob.isDead?.() && mob.craftrasSpawnPlaceId === place?.id && this.isNaturalBossForPlace(place, mob)) return true;
        }
        return false;
    }

    announceNaturalBossSpawn(place, bossType) {
        const message = bossType === "king_zombie"
            ? "A King Zombie has appeared in the Zombie Cave!"
            : bossType === "queen_spider"
                ? "The Queen Spider has appeared in the Spider Cave!"
                : "A boss has appeared!";
        for (const socket of this.gameManager.clients) socket?.talk?.("BM", Config.popup_message_duration, message);
    }

    chooseMonsterPlaceMobType(place) {
        const roll = Math.random();
        if (place.type === "zombie_boss_room") {
            return this.getZombieVariant(place.type);
        }
        if (place.type === "queen_spider_boss_room") {
            if (roll < 0.45) return "spider";
            if (roll < 0.70) return "toxic_spider";
            if (roll < 0.82) return this.getZombieVariant(place.type);
            if (roll < 0.92) return this.getSkeletonVariant();
            return "creeper";
        }
        if (roll < 0.12) return "toxic_spider";
        if (roll < 0.42) return "zombie";
        if (roll < 0.62) return this.getSkeletonVariant();
        if (roll < 0.78) return "creeper";
        return this.getZombieVariant(place.type);
    }

    findMonsterPlaceSpawn(place, placePlayers) {
        for (let attempt = 0; attempt < 60; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * Math.max(4, place.radius - 3);
            const x = place.blockX + Math.round(Math.cos(angle) * distance);
            const y = place.blockY + Math.round(Math.sin(angle) * distance);
            if (this.getCell(x, y)?.region !== "underground" || this.isMovementBlockingBlock(this.getBlock(x, y))) continue;
            const location = blockToWorld(x, y);
            if (placePlayers.some(({ body }) => (body.x - location.x) ** 2 + (body.y - location.y) ** 2 < (BLOCK_SIZE * 3.5) ** 2)) continue;
            if (this.placementOverlapsEntity(x, y)) continue;
            return location;
        }
        return null;
    }

    syncPlayerProgressSave(socket, body, now) {
        if (!socket || !body?.skill || !this.gameManager.socketManager?.saveCraftrasPlayerSave) return false;
        const signature = JSON.stringify({
            score: Math.floor(Number(body.skill.score) || 0),
            level: Math.floor(Number(body.skill.level) || 0),
            raw: Array.isArray(body.skill.raw) ? body.skill.raw.map(value => Math.floor(Number(value) || 0)) : [],
            shopPoints: Math.floor(Number(socket.craftrasShopPoints) || 0),
            rebirths: this.getCraftrasRebirths(socket),
            unlockedRecipes: Array.from(socket.craftrasUnlockedRecipes instanceof Set ? socket.craftrasUnlockedRecipes : []),
        });
        if (socket.craftrasProgressSaveSignature !== signature) {
            socket.craftrasProgressSaveSignature = signature;
            socket.craftrasProgressSaveDirty = true;
        }
        if (!socket.craftrasProgressSaveDirty || now < (socket.craftrasNextProgressSaveAt || 0)) return false;
        socket.craftrasNextProgressSaveAt = now + 5_000;
        socket.craftrasProgressSaveDirty = false;
        return this.gameManager.socketManager.saveCraftrasPlayerSave(socket);
    }

    isTouchingChallengeStartBlock(body) {
        if (!body || body.isDead?.() || body.craftrasSpectator) return false;
        const center = worldToBlock(body.x, body.y);
        const radius = Math.max(1, body.realSize || body.size || 1);
        const halfWall = WALL_SIZE * 0.5;
        const searchRadius = Math.max(1, Math.ceil((radius + halfWall) / BLOCK_SIZE));
        for (let y = center.y - searchRadius; y <= center.y + searchRadius; y++) {
            for (let x = center.x - searchRadius; x <= center.x + searchRadius; x++) {
                if (this.getBlock(x, y) !== BLOCKS.CHALLENGE_START) continue;
                const location = blockToWorld(x, y);
                const nearestX = Math.max(location.x - halfWall, Math.min(body.x, location.x + halfWall));
                const nearestY = Math.max(location.y - halfWall, Math.min(body.y, location.y + halfWall));
                const dx = body.x - nearestX;
                const dy = body.y - nearestY;
                if (dx * dx + dy * dy <= (radius + 2) ** 2) return true;
            }
        }
        return false;
    }

    sendChallengeEntryView(socket, open = true) {
        if (!socket) return false;
        if (!open) {
            socket.craftrasChallengeEntrySignature = "closed";
            socket.craftrasChallengeStartOpen = false;
            socket.talk?.("CSG", 0, "", 0, 0);
            return true;
        }
        const team = challengeTeams.getTeamInfo(this.gameManager, socket);
        const teamName = team?.name || "";
        const memberCount = team?.members?.length || 1;
        const isHost = !team || team.isHost;
        const signature = `open:${teamName}:${memberCount}:${isHost ? 1 : 0}`;
        socket.craftrasChallengeStartOpen = true;
        if (socket.craftrasChallengeEntrySignature === signature) return true;
        socket.craftrasChallengeEntrySignature = signature;
        socket.talk?.("CSG", 1, teamName, memberCount, isHost ? 1 : 0);
        return true;
    }

    async handleChallengeEntryAction(socket, action) {
        const normalizedAction = Math.trunc(Number(action));
        if (normalizedAction === 0) {
            socket.craftrasChallengeStartDismissed = true;
            this.sendChallengeEntryView(socket, false);
            return { ok: true, cancelled: true };
        }
        if (normalizedAction !== 1) return { ok: false, reason: "action" };
        if (socket?.craftrasChallengeEntryTransferring) return { ok: false, reason: "transferring" };
        const body = socket?.player?.body;
        if (!socket?.craftrasChallengeStartOpen || !body || body.isDead?.() || body.craftrasSpectator || !this.isTouchingChallengeStartBlock(body)) {
            this.sendChallengeEntryView(socket, false);
            return { ok: false, reason: "block" };
        }
        const team = challengeTeams.getTeamInfo(this.gameManager, socket);
        if (team && !team.isHost) {
            socket.talk?.("m", 5_000, "Only the team host can start the challenge.");
            return { ok: false, reason: "host" };
        }
        const members = team?.members?.length ? team.members : [socket];
        const connected = new Set(this.gameManager.clients || []);
        for (const member of members) {
            const memberBody = member?.player?.body;
            if (!connected.has(member) || !memberBody || memberBody.isDead?.() || memberBody.craftrasSpectator) {
                socket.talk?.("m", 5_000, `${challengeTeams.playerName(member) || "A team member"} is not ready.`);
                return { ok: false, reason: "member" };
            }
            const cell = worldToBlock(memberBody.x, memberBody.y);
            if (!isBrokenKingdomSurfaceCell(cell.x, cell.y)) {
                socket.talk?.("m", 5_000, `${challengeTeams.playerName(member)} is not in the kingdom.`);
                return { ok: false, reason: "kingdom", member };
            }
        }
        for (const member of members) {
            if (this.countCraftrasItem(member, CRAFTRAS_CHALLENGE_KEY_ITEM) > 0) continue;
            socket.talk?.("m", 5_000, `${challengeTeams.playerName(member)} does not have a Royal Key.`);
            return { ok: false, reason: "key", member };
        }
        if (typeof global.createCraftrasChallengeInstance !== "function") {
            socket.talk?.("m", 5_000, "World 1 Challenge is currently unavailable.");
            return { ok: false, reason: "server" };
        }
        if (members.some(member => member.status?.transferred || member.craftrasChallengeEntryTransferring)) {
            return { ok: false, reason: "transferring" };
        }
        for (const member of members) {
            member.craftrasChallengeEntryTransferring = true;
            member.craftrasChallengeStartDismissed = true;
        }
        socket.talk?.("m", 30_000, "Preparing a private challenge for your team...");
        let challengeInstance;
        try {
            challengeInstance = await global.createCraftrasChallengeInstance({
                teamName: team?.name || `${challengeTeams.playerName(socket)} Solo`,
                hostName: challengeTeams.playerName(socket),
                memberCount: members.length,
            });
        } catch (error) {
            for (const member of members) member.craftrasChallengeEntryTransferring = false;
            console.error(`[Craftras Challenge] Failed to prepare a private instance: ${error?.stack || error}`);
            socket.talk?.("m", 7_000, "The private challenge server could not be prepared. Please try again.");
            return { ok: false, reason: "server_start" };
        }
        const connectedAfterLoad = new Set(this.gameManager.clients || []);
        if (members.some(member => !connectedAfterLoad.has(member) || !member?.player?.body || member.player.body.isDead?.())) {
            global.disposeCraftrasChallengeInstance?.(challengeInstance.id, "party changed before transfer");
            for (const member of members) member.craftrasChallengeEntryTransferring = false;
            socket.talk?.("m", 6_000, "A team member disconnected while the private challenge was loading.");
            return { ok: false, reason: "member_left" };
        }
        for (const member of members) {
            if (!this.removeCraftrasItem(member, CRAFTRAS_CHALLENGE_KEY_ITEM, 1)) {
                global.disposeCraftrasChallengeInstance?.(challengeInstance.id, "entry item failure");
                for (const lockedMember of members) lockedMember.craftrasChallengeEntryTransferring = false;
                socket.talk?.("m", 5_000, "Challenge entry failed while consuming a Royal Key.");
                return { ok: false, reason: "consume", member };
            }
            this.gameManager.socketManager.saveCraftrasPlayerSave(member);
            this.sendChallengeEntryView(member, false);
            member.talk?.("CTR", 1, CRAFTRAS_CHALLENGE_TRANSITION_OUT_MS);
        }
        setTimeout(() => {
            for (const member of members) this.gameManager.socketManager.sendToServer(
                member,
                challengeInstance.apiDestination,
                challengeInstance.clientDestination,
            );
        }, CRAFTRAS_CHALLENGE_TRANSFER_DELAY_MS);
        return { ok: true, ready: true, transferring: true, members, challengeInstance };
    }

    updatePlayerChallengeStartPrompt(socket, body, now = Date.now()) {
        const touching = this.isTouchingChallengeStartBlock(body);
        if (touching && !socket.craftrasChallengeStartDismissed) {
            socket.craftrasChallengeStartTouching = true;
            this.sendChallengeEntryView(socket, true);
        } else if (!touching) {
            socket.craftrasChallengeStartTouching = false;
            socket.craftrasChallengeStartDismissed = false;
            if (socket.craftrasChallengeStartOpen) this.sendChallengeEntryView(socket, false);
        }
    }

    syncPlayerSurvivalState(players, now) {
        for (const { socket, body } of players) {
            challengeTeams.syncSocketTeam(this.gameManager, socket);
            socket.craftrasRebirths = this.getCraftrasRebirths(socket);
            body.craftrasRebirths = socket.craftrasRebirths;
            const forcedNameColor = socket.permissions?.admin ? (socket.permissions.nameColor || "#4aa3ff") : "#ffffff";
            if (body.nameColor !== forcedNameColor) {
                body.nameColor = forcedNameColor;
                socket.talk?.("z", forcedNameColor);
            }
            this.gameManager.socketManager.updateTemporaryCraftrasCreative(socket, now);
            this.updateWorldEditAxeInput(socket, body);
            if (!body.craftrasStartingLevelApplied) {
                body.craftrasStartingLevelApplied = true;
            }
            this.ensureCraftrasMinimumLevel(body.skill);
            this.updateCraftrasScoreGate(socket, body);
            body.skill.points = 0;
            this.syncPlayerProgressSave(socket, body, now);
            if (body.craftrasSpectator) {
                body.health.amount = Math.max(1, body.health.amount || 1);
                body.damageReceived = 0;
                body.readyToDie = false;
                body.invuln = true;
                body.alpha = 0.36;
                body.intangibility = true;
                body.settings.no_collisions = true;
                body.collisionArray.length = 0;
                const baseSpeed = Number.isFinite(body.craftrasSpectatorBaseSpeed) ? body.craftrasSpectatorBaseSpeed : 6;
                const baseTopSpeed = Number.isFinite(body.craftrasSpectatorBaseTopSpeed) ? body.craftrasSpectatorBaseTopSpeed : this.gameManager.runSpeed * 6;
                const baseAcceleration = Number.isFinite(body.craftrasSpectatorBaseAcceleration) ? body.craftrasSpectatorBaseAcceleration : body.acceleration;
                body.SPEED = baseSpeed * 3;
                body.topSpeed = baseTopSpeed * 3;
                if (Number.isFinite(baseAcceleration)) body.acceleration = baseAcceleration * 3;
                body.control.fire = false;
                body.control.alt = false;
                socket.talk?.("HP", 1, Math.max(1, body.health.max || 1));
                continue;
            }
            this.updatePlayerChallengeStartPrompt(socket, body, now);
            body.craftrasLastDamageAt ??= now;
            body.craftrasNextRegenAt ??= now + 10000;

            if (!body.craftrasSurvivalInitialized) {
                body.craftrasSurvivalInitialized = true;
                body.HEALTH = 100;
                body.SHIELD = 0;
                body.REGEN = 0;
                body.SPEED = 6;
                body.health.set(100);
                body.health.amount = 100;
                body.shield.set(0, 0);
            }
            const helmetBonus = body.craftrasHelmet === "pope_hat"
                ? CRAFTRAS_POPE_HAT_HEALTH_BONUS
                : body.craftrasHelmet === "blesser_hat"
                ? CRAFTRAS_BLESSER_HAT_HEALTH_BONUS
                : body.craftrasHelmet === "zombie_crown" ? 300 : body.craftrasHelmet === "diamond_helmet" ? 100 : body.craftrasHelmet === "iron_helmet" ? 50 : 0;
            const blessingHealthBonus = this.hasHealthBlessing(body, now) && body.craftrasHelmet !== "blesser_hat" ? VILLAGE_BLESSER_HEALTH_BONUS : 0;
            const adminPickaxeBonus = body.craftrasHeldItem === "admin_pickaxe" ? 1e100 : 0;
            const levelHealth = this.getCraftrasLevelHealthBonus(body.skill.level);
            const desiredHealth = 100 + helmetBonus + blessingHealthBonus + levelHealth + adminPickaxeBonus;
            if (body.health.max !== desiredHealth) {
                const oldMax = body.health.max > 0 ? body.health.max : desiredHealth;
                const oldAmount = Number.isFinite(body.health.amount) ? body.health.amount : oldMax;
                const missingHealth = Math.max(0, oldMax - oldAmount);
                body.health.set(desiredHealth);
                body.health.amount = Math.max(1, desiredHealth - missingHealth);
            }
            if (body.shield.max !== 0) body.shield.set(0, 0);
            this.updatePlayerSummonTicket(socket, body, now);
            this.updatePlayerBoneBomb(socket, body, now);
            this.updatePlayerEating(socket, body, now);
            this.updatePlayerClericStaff(socket, body, now);
            this.updatePlayerBlesserStaff(socket, body, now);
            this.updatePlayerShieldRecovery(socket, body, now);
            this.updatePlayerPopeStaff(socket, body, now);
            const hasPopeStaffFov = body.craftrasHeldItem === "pope_staff";
            if (!hasPopeStaffFov) {
                if (body.craftrasPopeStaffFovActive) {
                    body.FOV = body.craftrasPopeStaffBaseFov || 1;
                    body.craftrasPopeStaffFovActive = false;
                    body.updateBodyInfo?.();
                }
                body.craftrasPopeStaffBaseFov = body.FOV || body.craftrasPopeStaffBaseFov || 1;
            } else {
                if (!body.craftrasPopeStaffFovActive) {
                    body.craftrasPopeStaffBaseFov = body.FOV || body.craftrasPopeStaffBaseFov || 1;
                    body.craftrasPopeStaffFovActive = true;
                }
                const desiredFov = (body.craftrasPopeStaffBaseFov || 1) * 2;
                if (body.FOV !== desiredFov) {
                    body.FOV = desiredFov;
                    body.updateBodyInfo?.();
                }
            }
            const eatingSpeedMultiplier = body.craftrasEating ? 0.4 : 1;
            const hasDirectAdminSpeed = global.craftrasCheatsEnabled !== false
                && !!socket.permissions?.admin
                && Number.isFinite(socket.craftrasMovementSpeedMultiplier);
            const curseSpeedMultiplier = now < (body.craftrasCursedUntil || 0) ? 1 / 1.5 : 1;
            const movementSpeedMultiplier = (hasDirectAdminSpeed
                ? Math.max(0.1, Math.min(100, socket.craftrasMovementSpeedMultiplier))
                : 1) * curseSpeedMultiplier;
            body.topSpeed = this.gameManager.runSpeed * 6 * (body.craftrasCreativeFlight ? 10 : 1) * eatingSpeedMultiplier * movementSpeedMultiplier;
            body.craftrasDirectMovement = hasDirectAdminSpeed;
            if (hasDirectAdminSpeed) {
                const command = socket.player?.command;
                const moveX = (command?.right ? 1 : 0) - (command?.left ? 1 : 0);
                const moveY = (command?.down ? 1 : 0) - (command?.up ? 1 : 0);
                const moveLength = Math.hypot(moveX, moveY);
                body.velocity.x = moveLength ? moveX / moveLength * body.topSpeed : 0;
                body.velocity.y = moveLength ? moveY / moveLength * body.topSpeed : 0;
                body.accel.x = 0;
                body.accel.y = 0;
            }

            if (!body.craftrasDamageHooked) {
                body.craftrasDamageHooked = true;
                body.on("damage", ({ damageTool = [] }) => {
                    let projectileDamage = 0;
                    for (const tool of damageTool) {
                        const label = tool?.label || "";
                        if (label.includes("Craftras M134 Bullet")) {
                            projectileDamage += 5;
                            tool.kill?.();
                        } else if (label.includes("Craftras Skeleton Bullet") || tool?.master?.craftrasMobFamily === "skeleton") {
                            projectileDamage += tool?.master?.craftrasSkeletonBulletDamage || 20;
                            tool.kill?.();
                        }
                    }
                    if (projectileDamage) body.damageReceived = this.absorbShieldDamage(body, projectileDamage);
                    body.craftrasLastDamageAt = Date.now();
                    body.craftrasNextRegenAt = body.craftrasLastDamageAt + 10000;
                    this.flashEntity(body);
                });
            }

            if (now >= body.craftrasNextRegenAt && body.health.amount > 0 && body.health.amount < body.health.max) {
                body.health.amount = Math.min(body.health.max, body.health.amount + 10);
                body.craftrasNextRegenAt += 5000;
            }
            if (body.craftrasHelmet === "pope_hat" && now >= (body.craftrasNextPopeHatRegenAt || 0) && body.health.amount > 0 && body.health.amount < body.health.max) {
                body.health.amount = Math.min(body.health.max, body.health.amount + CRAFTRAS_POPE_HAT_REGEN_PER_SECOND);
                body.craftrasNextPopeHatRegenAt = now + 1000;
            } else if (body.craftrasHelmet !== "pope_hat") {
                body.craftrasNextPopeHatRegenAt = now + 1000;
            }
            if (this.hasHealthBlessing(body, now) && now >= (body.craftrasNextBlessingRegenAt || 0) && body.health.amount > 0) {
                body.health.amount = Math.min(body.health.max, body.health.amount + Math.max(3, body.health.max * 0.01));
                body.craftrasNextBlessingRegenAt = now + 1000;
            } else if (!this.hasActiveBlessing(body, now) && body.craftrasHelmet !== "blesser_hat") {
                body.craftrasBlessingUntil = 0;
                body.craftrasHealthBlessingUntil = 0;
                body.craftrasStrengthBlessingUntil = 0;
            }
            this.updatePlayerPoison(body, now);
            this.syncPlayerDebuffs(socket, body, now);
            this.restoreEntityFlash(body, now);

            const hp = Math.max(0, Math.min(desiredHealth, body.health.amount));
            const signature = `${Math.round(hp * 10)}:${desiredHealth}`;
            if (socket.craftrasHealthSignature !== signature) {
                socket.craftrasHealthSignature = signature;
                socket.talk("HP", hp, desiredHealth);
            }
            if (socket.craftrasCleric?.open) this.sendClericView(socket);
            if (socket.craftrasBlesser?.open) this.sendBlesserView(socket);
        }
        challengeTeams.syncHostLabels(this.gameManager);
    }

    updatePlayerEating(socket, body, now) {
        const item = ITEMS[body.craftrasHeldItem];
        const canEat = (!!item?.heal || !!item?.creativeDuration) && body.health.amount > 0;
        if (!canEat || !(body.control.alt || socket.craftrasEatingInput)) {
            body.craftrasEating = false;
            body.craftrasEatingStarted = 0;
            body.craftrasEatingItem = null;
            return;
        }
        if (body.craftrasEatingItem !== item.id) {
            body.craftrasEatingItem = item.id;
            body.craftrasEatingStarted = now;
        }
        body.craftrasEating = true;
        if (now - body.craftrasEatingStarted < 1200) return;
        if (item.creativeDuration && global.craftrasCheatsEnabled === false) {
            body.craftrasEating = false;
            body.craftrasEatingStarted = 0;
            body.craftrasEatingItem = null;
            body.sendMessage?.("Cheats are disabled.");
            return;
        }
        if (!this.gameManager.socketManager.consumeCraftrasSelectedItem(socket, 1, true)) return;
        if (item.creativeDuration) {
            this.gameManager.socketManager.grantTemporaryCraftrasCreative(socket, item.creativeDuration);
        } else {
            body.health.amount = Math.min(body.health.max, body.health.amount + item.heal);
        }
        body.craftrasEatingStarted = now;
        body.craftrasEatingItem = body.craftrasHeldItem;
    }

    hasActiveBossType(bossType) {
        const matchingTypes = bossType === "annihilator" ? new Set(["annihilator", "the_nuclear"]) : new Set([bossType]);
        for (const mob of this.mobs || []) {
            if (!mob || mob.isDead?.()) continue;
            if (matchingTypes.has(mob.craftrasMobType)) return true;
        }
        return false;
    }

    getBossDisplayName(bossType, item = null) {
        if (bossType === "king_zombie") return "King Zombie";
        if (bossType === "queen_spider") return "Queen Spider";
        if (bossType === "sword_guy") return "Sword guy";
        if (bossType === "annihilator") return "Annihilator";
        return item?.name?.replace(" Summon Ticket", "") || bossType;
    }

    updatePlayerSummonTicket(socket, body, now) {
        const bossType = CRAFTRAS_SUMMON_TICKET_BOSSES[body?.craftrasHeldItem];
        if (!bossType || !body || body.isDead?.() || !(body.control.alt || socket.craftrasEatingInput)) return false;
        if (now < (body.craftrasNextSummonTicketAt || 0)) return false;
        body.craftrasNextSummonTicketAt = now + 750;
        const item = ITEMS[body.craftrasHeldItem];
        const label = this.getBossDisplayName(bossType, item);
        if (this.hasActiveBossType(bossType)) {
            body.sendMessage(`${label} is already alive.`);
            return false;
        }
        if (!this.gameManager.socketManager.consumeCraftrasSelectedItem(socket, 1)) return false;
        let boss = null;
        if (bossType === "annihilator") {
            boss = this.spawnOutsideBoss?.("annihilator", { direct: false });
        } else if (bossType === "sword_guy") {
            boss = this.spawnMobAt(this.getSwordGuyIslandSpawn(), bossType, { outsideBoss: true });
        } else {
            const placeType = bossType === "king_zombie" ? "zombie_boss_room" : "queen_spider_boss_room";
            const places = (this.monsterPlaces || []).filter(place => place.type === placeType);
            const place = places[Math.floor(Math.random() * places.length)];
            if (place) {
                const location = this.findMonsterPlaceSpawn(place, []) || blockToWorld(place.blockX, place.blockY);
                boss = this.spawnMobAt(location, bossType, { placeId: place.id });
                place.craftrasNextBossRollAt = Date.now() + CRAFTRAS_BOSS_NATURAL_SPAWN_COOLDOWN;
            }
        }
        if (!boss) {
            body.sendMessage(`Could not summon ${label}.`);
            this.gameManager.socketManager.addCraftrasItem(socket, item, 1);
            return false;
        }
        const summonedLabel = boss.craftrasMobType === "the_nuclear" ? "The Nuclear" : this.getBossDisplayName(boss.craftrasMobType, item);
        const summonerName = (body.name || "").trim() || "An unnamed player";
        for (const client of this.gameManager.clients) client?.talk?.("BM", Config.popup_message_duration, `${summonerName} has summoned ${summonedLabel}.`);
        body.sendMessage(`Summoned ${summonedLabel}.`);
        return true;
    }

    updatePlayerBoneBomb(socket, body, now) {
        if (!body || body.isDead?.() || body.craftrasHeldItem !== "bone_bomb") return false;
        if (!body.control.fire) return false;
        if (now < (body.craftrasNextBoneBombAt || 0)) return false;
        body.craftrasNextBoneBombAt = now + 2000;
        if (!this.gameManager.socketManager.consumeCraftrasSelectedItem(socket, 1)) return false;

        const angle = body.facing || 0;
        const offset = (body.realSize || body.size || 20) + 20;
        const speed = 20;
        const bomb = new Entity({
            x: body.x + Math.cos(angle) * offset,
            y: body.y + Math.sin(angle) * offset,
        });
        bomb.define("craftrasBoneBombProjectile");
        bomb.team = bomb.id;
        bomb.master = body;
        bomb.source = body;
        bomb.parent = body;
        bomb.facing = angle;
        bomb.velocity.x = Math.cos(angle) * speed;
        bomb.velocity.y = Math.sin(angle) * speed;
        bomb.craftrasBoneBombOwner = body;
        bomb.craftrasBoneBombSpawnedAt = now;
        bomb.craftrasBoneBombExpiresAt = now + Math.ceil((BLOCK_SIZE * 16) / speed) * 1000 / 30;
        bomb.alwaysActive = true;
        bomb.on("dead", () => this.boneBombProjectiles.delete(bomb));
        this.boneBombProjectiles.add(bomb);
        return true;
    }

    updatePlayerClericStaff(socket, body, now) {
        if (!body || body.isDead?.() || body.craftrasSpectator || !["cleric_staff", "cleric_staff_op"].includes(body.craftrasHeldItem)) return;
        if (!body.control.fire) return;
        const opStaff = body.craftrasHeldItem === "cleric_staff_op";
        if (!opStaff && now < (body.craftrasNextClericStaffAt || 0)) return;
        if (!body.health || body.health.amount <= 0) return;
        if (body.craftrasHelmet === "cleric_hat" && this.reviveNearbyCraftrasSpectator(body, now)) {
            if (!opStaff) body.craftrasNextClericStaffAt = now + CRAFTRAS_CLERIC_STAFF_REVIVE_COOLDOWN;
            body.craftrasClericStaffCastStarted = now;
            body.craftrasClericStaffCastUntil = now + 900;
            return;
        }
        if (!opStaff) body.craftrasNextClericStaffAt = now + CRAFTRAS_CLERIC_STAFF_COOLDOWN;
        const targets = opStaff
            ? this.getLivingPlayers()
                .map(({ body: targetBody }) => targetBody)
                .filter(targetBody => targetBody?.health && targetBody.health.amount > 0 && !targetBody.craftrasSpectator && Math.hypot(targetBody.x - body.x, targetBody.y - body.y) <= CRAFTRAS_OP_CLERIC_STAFF_RADIUS)
            : [body];
        for (const targetBody of targets) {
            targetBody.craftrasClericHealUntil = now + (opStaff ? CRAFTRAS_OP_CLERIC_STAFF_DURATION : VILLAGE_CLERIC_HEAL_DURATION);
            targetBody.craftrasNextClericHealAt = now + (opStaff ? CRAFTRAS_OP_CLERIC_STAFF_HEAL_INTERVAL : VILLAGE_CLERIC_HEAL_INTERVAL);
            targetBody.craftrasClericHealFlatAmount = opStaff ? 0 : CRAFTRAS_CLERIC_STAFF_HEAL_PER_TICK;
            targetBody.craftrasClericHealRatio = opStaff ? CRAFTRAS_OP_CLERIC_STAFF_HEAL_RATE : 0;
            targetBody.craftrasClericHealInterval = opStaff ? CRAFTRAS_OP_CLERIC_STAFF_HEAL_INTERVAL : VILLAGE_CLERIC_HEAL_INTERVAL;
            targetBody.craftrasClericHealStopsAtFull = opStaff;
            this.ensureClericHealCircle(targetBody, now);
        }
        body.craftrasClericStaffCastStarted = now;
        body.craftrasClericStaffCastUntil = now + 900;
    }

    reviveNearbyCraftrasSpectator(clericBody, now = Date.now()) {
        let best = null;
        let bestDistance = Infinity;
        const reviveRange = BLOCK_SIZE * 3.2;
        for (const client of this.gameManager.clients || []) {
            const target = client?.player?.body;
            if (!target?.craftrasSpectator || target.craftrasSpectatorFinalizing || target.isDead?.()) continue;
            const distance = Math.hypot(target.x - clericBody.x, target.y - clericBody.y);
            if (distance > reviveRange || distance >= bestDistance) continue;
            best = { socket: client, body: target };
            bestDistance = distance;
        }
        if (!best) return false;
        const target = best.body;
        target.craftrasSpectator = false;
        target.craftrasSpectatorFinalizing = false;
        target.craftrasSpectatorSince = 0;
        target.SPEED = Number.isFinite(target.craftrasSpectatorBaseSpeed) ? target.craftrasSpectatorBaseSpeed : 6;
        if (Number.isFinite(target.craftrasSpectatorBaseTopSpeed)) target.topSpeed = target.craftrasSpectatorBaseTopSpeed;
        if (Number.isFinite(target.craftrasSpectatorBaseAcceleration)) target.acceleration = target.craftrasSpectatorBaseAcceleration;
        delete target.craftrasSpectatorBaseSpeed;
        delete target.craftrasSpectatorBaseTopSpeed;
        delete target.craftrasSpectatorBaseAcceleration;
        target.invuln = false;
        target.alpha = 1;
        target.intangibility = false;
        target.settings.no_collisions = false;
        target.readyToDie = false;
        target.damageReceived = 0;
        target.collisionArray.length = 0;
        target.health.amount = Math.max(1, Math.min(target.health.max || 100, (target.health.max || 100) * 0.35));
        target.craftrasLastDamageAt = now;
        target.craftrasNextRegenAt = now + 10000;
        best.socket.craftrasSpectatorDeathRecords = null;
        best.socket.craftrasSpectatorBodyId = null;
        best.socket.talk?.("CSPEC", 0);
        target.sendMessage?.("A cleric revived you.");
        clericBody.sendMessage?.(`Revived ${(target.name || "a spectator").trim() || "a spectator"}.`);
        this.ensureClericHealCircle(target, now);
        target.craftrasClericHealUntil = now + VILLAGE_CLERIC_HEAL_DURATION;
        target.craftrasNextClericHealAt = now + VILLAGE_CLERIC_HEAL_INTERVAL;
        target.craftrasClericHealFlatAmount = CRAFTRAS_CLERIC_STAFF_HEAL_PER_TICK;
        target.craftrasClericHealRatio = 0;
        target.craftrasClericHealInterval = VILLAGE_CLERIC_HEAL_INTERVAL;
        target.craftrasClericHealStopsAtFull = false;
        return true;
    }

    updatePlayerBlesserStaff(socket, body, now) {
        if (!body || body.isDead?.() || body.craftrasHeldItem !== "blesser_staff") return;
        if (!body.control.fire) return;
        if (now < (body.craftrasNextBlesserStaffAt || 0)) return;
        if (!body.health || body.health.amount <= 0) return;
        body.craftrasNextBlesserStaffAt = now + CRAFTRAS_BLESSER_STAFF_COOLDOWN;
        body.craftrasHealthBlessingUntil = Math.max(body.craftrasHealthBlessingUntil || 0, now + VILLAGE_BLESSER_DURATION);
        body.craftrasStrengthBlessingUntil = Math.max(body.craftrasStrengthBlessingUntil || 0, now + VILLAGE_BLESSER_DURATION);
        body.craftrasNextBlessingRegenAt = now + 1000;
        body.craftrasBlesserStaffCastStarted = now;
        body.craftrasBlesserStaffCastUntil = now + 900;
        body.sendMessage("Blessing activated for 15 minutes.");
        this.syncPlayerDebuffs(socket, body, now);
    }

    updatePlayerPopeStaff(socket, body, now) {
        if (!body || body.isDead?.() || body.craftrasHeldItem !== "pope_staff") {
            this.cleanupPopeStaffOrbit(body);
            this.cleanupPopeStaffMagicCircles(body);
            if (body) {
                body.craftrasPopeStaffCharging = false;
                body.craftrasPopeStaffChargeStarted = 0;
                body.craftrasPopeMagicHoldUntil = 0;
                body.craftrasPopeMagicFadeUntil = 0;
                body.craftrasPopeStaffCastingUntil = 0;
                body.craftrasPopeStaffCastStarted = 0;
                if (body.isDead?.()) body.craftrasPopeCubesRespawnStartAt = 0;
            }
            return;
        }

        this.ensurePopeStaffOrbit(body, now);
        if (body.control.fire && now >= (body.craftrasNextPopeStaffAt || 0)) {
            if (!body.craftrasPopeStaffCharging) {
                body.craftrasPopeStaffCharging = true;
                body.craftrasPopeStaffChargeStarted = now;
            }
            this.ensurePopeStaffMagicCircles(body, now);
            if (now - body.craftrasPopeStaffChargeStarted >= CRAFTRAS_POPE_STAFF_CHARGE_DURATION) {
                this.triggerPopeStaffJudgment(body, now);
                body.craftrasNextPopeStaffAt = now + CRAFTRAS_POPE_STAFF_JUDGMENT_WINDUP + CRAFTRAS_POPE_STAFF_JUDGMENT_DURATION + CRAFTRAS_POPE_STAFF_COOLDOWN;
                body.craftrasPopeCubesRespawnStartAt = now + CRAFTRAS_POPE_STAFF_JUDGMENT_WINDUP + CRAFTRAS_POPE_STAFF_JUDGMENT_DURATION;
                body.craftrasPopeMagicHoldUntil = now + CRAFTRAS_POPE_STAFF_JUDGMENT_WINDUP + CRAFTRAS_POPE_STAFF_JUDGMENT_DURATION;
                body.craftrasPopeMagicFadeUntil = body.craftrasPopeMagicHoldUntil + CRAFTRAS_POPE_STAFF_MAGIC_FADE_DURATION;
                body.craftrasPopeStaffCastingUntil = body.craftrasPopeMagicHoldUntil;
                body.craftrasPopeStaffCastStarted = now;
                body.craftrasPopeStaffCharging = false;
                body.craftrasPopeStaffChargeStarted = 0;
            }
        } else {
            body.craftrasPopeStaffCharging = false;
            body.craftrasPopeStaffChargeStarted = 0;
            if (!(body.craftrasPopeMagicFadeUntil && now < body.craftrasPopeMagicFadeUntil)) this.cleanupPopeStaffMagicCircles(body);
        }
    }

    ensurePopeStaffOrbit(body, now) {
        body.craftrasPopeOrbitBaseAngle ??= Math.random() * Math.PI * 2;
        body.craftrasPopeOrbitCubes ??= [];
        body.craftrasPopeOrbitCubes = body.craftrasPopeOrbitCubes.filter(cube => cube && !cube.isDead?.() && cube.craftrasPopeMode === "orbit");
        const respawnStart = body.craftrasPopeCubesRespawnStartAt || 0;
        const allowedCount = respawnStart && now < respawnStart
            ? 0
            : respawnStart
            ? Math.max(0, Math.min(CRAFTRAS_POPE_STAFF_CUBE_COUNT, Math.floor((now - respawnStart) / CRAFTRAS_POPE_STAFF_CUBE_RESTORE_INTERVAL) + 1))
            : CRAFTRAS_POPE_STAFF_CUBE_COUNT;
        if (respawnStart && allowedCount >= CRAFTRAS_POPE_STAFF_CUBE_COUNT) body.craftrasPopeCubesRespawnStartAt = 0;
        while (body.craftrasPopeOrbitCubes.length < allowedCount) {
            const cube = new Entity({ x: body.x, y: body.y });
            cube.define("craftrasPopeCube");
            cube.team = cube.id;
            cube.master = cube;
            cube.source = cube;
            cube.parent = null;
            cube.alwaysActive = true;
            cube.color?.interpret?.("#ffd84d");
            cube.craftrasPopeMode = "orbit";
            cube.craftrasPopeOwner = body;
            cube.craftrasPopeOrbitIndex = body.craftrasPopeOrbitCubes.length;
            cube.craftrasPopeCreatedAt = now;
            cube.craftrasPopeFadeStarted = now;
            cube.facing = Math.random() * Math.PI * 2;
            cube.alpha = 0.02;
            cube.on("dead", () => this.popeStaffCubes.delete(cube));
            this.popeStaffCubes.add(cube);
            body.craftrasPopeOrbitCubes.push(cube);
        }
    }

    cleanupPopeStaffOrbit(body) {
        if (!body?.craftrasPopeOrbitCubes) return;
        for (const cube of body.craftrasPopeOrbitCubes) {
            if (cube?.craftrasPopeMode === "orbit") cube.destroy?.();
        }
        body.craftrasPopeOrbitCubes = [];
    }

    ensurePopeStaffMagicCircles(body, now) {
        body.craftrasPopeMagicCircles ??= [];
        body.craftrasPopeMagicCircles = body.craftrasPopeMagicCircles.filter(circle => circle && !circle.isDead?.());
        const startedAt = body.craftrasPopeStaffChargeStarted || now;
        const elapsed = Math.max(0, now - startedAt);
        const targetCount = Math.max(1, Math.min(3, Math.floor(elapsed / CRAFTRAS_POPE_STAFF_MAGIC_STAGE_DURATION) + 1));
        for (let index = body.craftrasPopeMagicCircles.length; index < targetCount; index++) {
            const circle = new Entity({ x: body.x, y: body.y });
            circle.define(`craftrasPopeMagicCircle${index + 1}`);
            circle.team = circle.id;
            circle.master = circle;
            circle.source = circle;
            circle.parent = null;
            circle.alwaysActive = true;
            circle.color?.interpret?.("#fff7c9");
            circle.craftrasPopeOwner = body;
            circle.craftrasPopeMagicIndex = index;
            circle.craftrasPopeMagicStarted = startedAt;
            circle.alpha = 1;
            circle.on("dead", () => this.popeStaffMagicCircles.delete(circle));
            this.popeStaffMagicCircles.add(circle);
            body.craftrasPopeMagicCircles.push(circle);
        }
    }

    cleanupPopeStaffMagicCircles(body) {
        if (!body?.craftrasPopeMagicCircles) return;
        for (const circle of body.craftrasPopeMagicCircles) circle?.destroy?.();
        body.craftrasPopeMagicCircles = [];
    }

    launchPopeStaffCube(body, now) {
        this.ensurePopeStaffOrbit(body, now);
        const cube = body.craftrasPopeOrbitCubes?.find(entity => entity && !entity.isDead?.() && entity.craftrasPopeMode === "orbit");
        if (!cube) return false;
        const angle = Number.isFinite(body.facing) ? body.facing : 0;
        cube.craftrasPopeMode = "shot";
        cube.parent = null;
        cube.craftrasPopeVelocity = {
            x: Math.cos(angle) * CRAFTRAS_POPE_STAFF_SHOT_SPEED,
            y: Math.sin(angle) * CRAFTRAS_POPE_STAFF_SHOT_SPEED,
        };
        cube.craftrasPopeExpiresAt = now + 2500;
        cube.craftrasPopeLastHitAt = new Map();
        cube.facing = angle;
        if (cube.health) {
            cube.health.max = 1;
            cube.health.amount = 1;
        }
        body.craftrasPopeOrbitCubes = body.craftrasPopeOrbitCubes.filter(entity => entity !== cube);
        this.ensurePopeStaffOrbit(body, now);
        return true;
    }

    getPopeStaffTargetPoint(body) {
        const target = body?.control?.target || {};
        const targetX = Number.isFinite(target.x) ? target.x : Math.cos(body.facing || 0) * BLOCK_SIZE * 10;
        const targetY = Number.isFinite(target.y) ? target.y : Math.sin(body.facing || 0) * BLOCK_SIZE * 10;
        const distance = Math.hypot(targetX, targetY);
        const maxDistance = BLOCK_SIZE * 22;
        const scale = distance > maxDistance ? maxDistance / distance : 1;
        return {
            x: body.x + targetX * scale,
            y: body.y + targetY * scale,
        };
    }

    getPopeStaffAimAngle(body) {
        const target = body?.control?.target || {};
        const targetX = Number.isFinite(target.x) ? target.x : Math.cos(body?.facing || 0);
        const targetY = Number.isFinite(target.y) ? target.y : Math.sin(body?.facing || 0);
        return Math.atan2(targetY, targetX) || (body?.facing || 0);
    }

    triggerPopeStaffJudgment(body, now) {
        const target = this.getPopeStaffTargetPoint(body);
        const angle = this.getPopeStaffAimAngle(body);
        const cubes = (body.craftrasPopeOrbitCubes || []).filter(cube => cube && !cube.isDead?.() && cube.craftrasPopeMode === "orbit");
        for (let index = 0; index < cubes.length; index++) {
            const cube = cubes[index];
            const away = Math.atan2(cube.y - body.y, cube.x - body.x) || index / Math.max(1, cubes.length) * Math.PI * 2;
            const curveSide = index % 2 ? -1 : 1;
            const sideAngle = away + Math.PI / 2 * curveSide;
            cube.craftrasPopeMode = "converge";
            cube.parent = null;
            cube.alpha = 1;
            cube.craftrasPopeConvergeIndex = index;
            cube.craftrasPopeConvergeStarted = now;
            cube.craftrasPopeConvergeDuration = CRAFTRAS_POPE_STAFF_JUDGMENT_WINDUP;
            cube.craftrasPopeStart = { x: cube.x, y: cube.y };
            cube.craftrasPopeControl1 = {
                x: cube.x + Math.cos(away) * BLOCK_SIZE * 8 + Math.cos(sideAngle) * BLOCK_SIZE * 1.5,
                y: cube.y + Math.sin(away) * BLOCK_SIZE * 8 + Math.sin(sideAngle) * BLOCK_SIZE * 1.5,
            };
            cube.craftrasPopeControl2 = {
                x: target.x - Math.cos(angle) * BLOCK_SIZE * 2.2 + Math.cos(sideAngle) * BLOCK_SIZE * 5,
                y: target.y - Math.sin(angle) * BLOCK_SIZE * 2.2 + Math.sin(sideAngle) * BLOCK_SIZE * 5,
            };
            cube.craftrasPopeTarget = target;
        }
        body.craftrasPopeOrbitCubes = [];
        this.popeStaffPendingJudgments.push({ owner: body, target, angle, at: now + CRAFTRAS_POPE_STAFF_JUDGMENT_WINDUP });
    }

    spawnPopeStaffJudgment(owner, target, angle, now) {
        const beam = {
            owner,
            craftrasPopeOwner: owner,
            craftrasPopeBeamAngle: angle,
            craftrasPopeBeamLength: CRAFTRAS_POPE_STAFF_BEAM_LENGTH,
            craftrasPopeBeamWidth: CRAFTRAS_POPE_STAFF_BEAM_WIDTH,
            craftrasPopeExpiresAt: now + CRAFTRAS_POPE_STAFF_JUDGMENT_DURATION,
            craftrasPopeNextParticleAt: now,
            craftrasPopeLastHitAt: new Map(),
            craftrasPopeLastBlockHitAt: new Map(),
            craftrasPopeFollowsOwner: true,
        };
        this.updatePopeStaffBeamTracking(beam);
        this.popeStaffBeamStates.push(beam);
    }

    updatePopeStaffBeamTracking(beam) {
        const owner = beam?.owner;
        if (!owner || owner.isDead?.()) return;
        const angle = this.getPopeStaffAimAngle(owner);
        const startDistance = Math.max(320, (owner.realSize || owner.size || owner.SIZE || 32) * 9.4);
        beam.craftrasPopeBeamAngle = angle;
        beam.craftrasPopeBeamStart = {
            x: owner.x + Math.cos(angle) * startDistance,
            y: owner.y + Math.sin(angle) * startDistance,
        };
    }

    spawnPopeStaffBeamParticles(beam, now) {
        if (Array.isArray(beam.craftrasPopeBeamParticles)) {
            for (const oldParticle of beam.craftrasPopeBeamParticles) {
                oldParticle?.destroy?.();
                this.popeStaffJudgments.delete(oldParticle);
            }
        }
        beam.craftrasPopeBeamParticles = [];
        const start = beam.craftrasPopeBeamStart;
        const angle = beam.craftrasPopeBeamAngle || 0;
        const forwardX = Math.cos(angle);
        const forwardY = Math.sin(angle);
        for (let index = 0; index < CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_COUNT; index++) {
            const distance = index * CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_SPACING;
            const particle = new Entity({
                x: start.x + forwardX * distance,
                y: start.y + forwardY * distance,
            });
            particle.define("craftrasPopeJudgmentParticle");
            particle.team = particle.id;
            particle.master = particle;
            particle.source = particle;
            particle.alwaysActive = true;
            particle.color?.interpret?.(CRAFTRAS_POPE_STAFF_BEAM_COLOR);
            particle.craftrasPopeMode = "beam_particle";
            particle.craftrasPopeOwner = beam.owner;
            particle.craftrasPopeExpiresAt = now + CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_LIFE;
            particle.SIZE = CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_SIZE;
            particle.coreSize = CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_SIZE;
            particle.facing = angle;
            particle.vfacing = angle;
            particle.alpha = CRAFTRAS_POPE_STAFF_BEAM_ALPHA;
            particle.refreshBodyAttributes?.();
            particle.on("dead", () => this.popeStaffJudgments.delete(particle));
            this.popeStaffJudgments.add(particle);
            beam.craftrasPopeBeamParticles.push(particle);
        }
    }

    updatePopeStaffProjectiles(players, now) {
        for (let index = this.popeStaffPendingJudgments.length - 1; index >= 0; index--) {
            const pending = this.popeStaffPendingJudgments[index];
            if (!pending?.owner || pending.owner.isDead?.() || now >= pending.at) {
                if (pending?.owner && !pending.owner.isDead?.()) this.spawnPopeStaffJudgment(pending.owner, pending.target, pending.angle, now);
                this.popeStaffPendingJudgments.splice(index, 1);
            }
        }

        for (const cube of this.popeStaffCubes) {
            if (!cube || cube.isDead?.()) {
                this.popeStaffCubes.delete(cube);
                continue;
            }
            const owner = cube.craftrasPopeOwner;
            if (!owner || owner.isDead?.()) {
                cube.destroy?.();
                this.popeStaffCubes.delete(cube);
                continue;
            }
            if (cube.craftrasPopeMode === "orbit") {
                if (owner.craftrasHeldItem !== "pope_staff") {
                    cube.destroy?.();
                    this.popeStaffCubes.delete(cube);
                    continue;
                }
                cube.color?.interpret?.("#ffd84d");
                const chargeProgress = owner.craftrasPopeStaffCharging
                    ? Math.max(0, Math.min(1, (now - (owner.craftrasPopeStaffChargeStarted || now)) / CRAFTRAS_POPE_STAFF_CHARGE_DURATION))
                    : 0;
                if (owner.craftrasPopeOrbitUpdatedAt !== now) {
                    const delta = Math.max(1, Math.min(50, now - (owner.craftrasPopeOrbitUpdatedAt || now)));
                    owner.craftrasPopeOrbitBaseAngle = (owner.craftrasPopeOrbitBaseAngle || 0)
                        + CRAFTRAS_POPE_STAFF_ORBIT_SPEED * (1 + chargeProgress * 7) * Math.max(1, this.dayCycleSpeed || 1) * delta;
                    owner.craftrasPopeOrbitUpdatedAt = now;
                }
                const angle = owner.craftrasPopeOrbitBaseAngle + cube.craftrasPopeOrbitIndex / CRAFTRAS_POPE_STAFF_CUBE_COUNT * Math.PI * 2;
                const radius = CRAFTRAS_POPE_STAFF_ORBIT_RADIUS * (1 + chargeProgress * 0.22);
                cube.x = owner.x + Math.cos(angle) * radius;
                cube.y = owner.y + Math.sin(angle) * radius;
                const fadeStarted = cube.craftrasPopeFadeStarted || now;
                cube.alpha = Math.max(0.02, Math.min(1, (now - fadeStarted) / CRAFTRAS_POPE_STAFF_CUBE_FADE_DURATION));
                continue;
            }
            if (cube.craftrasPopeMode === "shot") {
                cube.color?.interpret?.("#ffd84d");
                const velocity = cube.craftrasPopeVelocity || { x: 0, y: 0 };
                cube.x += velocity.x;
                cube.y += velocity.y;
                cube.facing = Math.atan2(velocity.y, velocity.x) + Math.PI / 4;
                const block = worldToBlock(cube.x, cube.y);
                if (now >= cube.craftrasPopeExpiresAt || this.isMovementBlockingBlock(this.getBlock(block.x, block.y))) {
                    cube.destroy?.();
                    this.popeStaffCubes.delete(cube);
                    continue;
                }
                this.applyPopeStaffAreaDamage(cube, owner, Math.max(12, cube.realSize || cube.size || 10), players, now, CRAFTRAS_POPE_STAFF_SHOT_DAMAGE);
                continue;
            }
            if (cube.craftrasPopeMode === "converge") {
                cube.color?.interpret?.("#ffd84d");
                const rawProgress = Math.max(0, Math.min(1, (now - cube.craftrasPopeConvergeStarted) / cube.craftrasPopeConvergeDuration));
                const progress = rawProgress < 0.5 ? 4 * rawProgress * rawProgress * rawProgress : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;
                const start = cube.craftrasPopeStart || { x: cube.x, y: cube.y };
                const control1 = cube.craftrasPopeControl1 || start;
                const control2 = cube.craftrasPopeControl2 || cube.craftrasPopeTarget || start;
                const target = cube.craftrasPopeTarget || control2;
                const inv = 1 - progress;
                cube.x = inv ** 3 * start.x + 3 * inv ** 2 * progress * control1.x + 3 * inv * progress ** 2 * control2.x + progress ** 3 * target.x;
                cube.y = inv ** 3 * start.y + 3 * inv ** 2 * progress * control1.y + 3 * inv * progress ** 2 * control2.y + progress ** 3 * target.y;
                cube.alpha = 1;
                if (rawProgress >= 1) {
                    if (cube.craftrasPopeConvergeIndex === 0) this.spawnExplosionEffect({ x: cube.x, y: cube.y }, { duration: 500, startSize: 10, growth: 1 });
                    cube.destroy?.();
                    this.popeStaffCubes.delete(cube);
                }
            }
        }

        for (const circle of this.popeStaffMagicCircles) {
            if (!circle || circle.isDead?.()) {
                this.popeStaffMagicCircles.delete(circle);
                continue;
            }
            const owner = circle.craftrasPopeOwner;
            const magicHoldUntil = owner?.craftrasPopeMagicHoldUntil || 0;
            const magicFadeUntil = owner?.craftrasPopeMagicFadeUntil || 0;
            const magicActive = owner?.craftrasPopeStaffCharging || now < magicFadeUntil;
            if (!owner || owner.isDead?.() || owner.craftrasHeldItem !== "pope_staff" || !magicActive) {
                circle.destroy?.();
                this.popeStaffMagicCircles.delete(circle);
                continue;
            }
            const chargeStarted = owner.craftrasPopeStaffChargeStarted || circle.craftrasPopeMagicStarted || now;
            const elapsed = owner.craftrasPopeStaffCharging
                ? now - chargeStarted
                : magicHoldUntil && now < magicHoldUntil ? now - chargeStarted : Math.max(0, (magicHoldUntil || now) - chargeStarted);
            const stage = circle.craftrasPopeMagicIndex || 0;
            const stageElapsed = elapsed - stage * CRAFTRAS_POPE_STAFF_MAGIC_STAGE_DURATION;
            circle.x = owner.x;
            circle.y = owner.y;
            circle.color?.interpret?.("#fff7c9");
            if (!owner.craftrasPopeStaffCharging && magicHoldUntil && now >= magicHoldUntil) {
                const fadeProgress = Math.max(0, Math.min(1, (now - magicHoldUntil) / CRAFTRAS_POPE_STAFF_MAGIC_FADE_DURATION));
                circle.alpha = 1 - fadeProgress;
                if (fadeProgress >= 1) {
                    circle.destroy?.();
                    this.popeStaffMagicCircles.delete(circle);
                    continue;
                }
            } else {
                circle.alpha = 1;
            }
            const direction = stage === 1 ? -1 : 1;
            const speedProgress = Math.max(0, Math.min(2.4, elapsed / CRAFTRAS_POPE_STAFF_CHARGE_DURATION));
            const speed = 0.002 + speedProgress * speedProgress * 0.014;
            circle.facing = (circle.facing || 0) + direction * speed * 16;
            circle.vfacing = circle.facing;
        }

        for (let index = this.popeStaffBeamStates.length - 1; index >= 0; index--) {
            const beam = this.popeStaffBeamStates[index];
            if (!beam?.owner || beam.owner.isDead?.() || now >= beam.craftrasPopeExpiresAt) {
                if (Array.isArray(beam?.craftrasPopeBeamParticles)) {
                    for (const particle of beam.craftrasPopeBeamParticles) {
                        particle?.destroy?.();
                        this.popeStaffJudgments.delete(particle);
                    }
                    beam.craftrasPopeBeamParticles = [];
                }
                this.popeStaffBeamStates.splice(index, 1);
                continue;
            }
            if (beam.craftrasPopeFollowsOwner) this.updatePopeStaffBeamTracking(beam);
            if (now >= (beam.craftrasPopeNextParticleAt || 0)) {
                this.spawnPopeStaffBeamParticles(beam, now);
                beam.craftrasPopeNextParticleAt = now + CRAFTRAS_POPE_STAFF_BEAM_PARTICLE_INTERVAL;
            }
            this.applyPopeStaffBeamBlockDamage(beam, now);
            this.applyPopeStaffBeamDamage(beam, beam.owner, players, now);
        }

        for (const zone of this.popeStaffJudgments) {
            if (!zone || zone.isDead?.()) {
                this.popeStaffJudgments.delete(zone);
                continue;
            }
            if (now >= zone.craftrasPopeExpiresAt) {
                zone.destroy?.();
                this.popeStaffJudgments.delete(zone);
                continue;
            }
            if (zone.craftrasPopeMode === "beam_particle") {
                zone.color?.interpret?.(CRAFTRAS_POPE_STAFF_BEAM_COLOR);
                zone.alpha = CRAFTRAS_POPE_STAFF_BEAM_ALPHA;
                zone.facing = (zone.facing || 0) + 0.05;
                continue;
            }
            const lifeLeft = Math.max(0, zone.craftrasPopeExpiresAt - now);
            zone.alpha = Math.min(0.92, lifeLeft / 500);
            if (zone.craftrasPopeMode === "beam") this.applyPopeStaffBeamDamage(zone, zone.craftrasPopeOwner, players, now);
            else this.applyPopeStaffAreaDamage(zone, zone.craftrasPopeOwner, Math.max(70, zone.realSize || zone.size || 70), players, now, CRAFTRAS_POPE_STAFF_SHOT_DAMAGE);
        }
    }

    popeStaffBeamContains(zone, target) {
        if (!zone || !target) return false;
        const angle = zone.craftrasPopeBeamAngle ?? zone.facing ?? 0;
        const start = zone.craftrasPopeBeamStart || { x: zone.x, y: zone.y };
        const forwardX = Math.cos(angle);
        const forwardY = Math.sin(angle);
        const sideX = -forwardY;
        const sideY = forwardX;
        const dx = target.x - start.x;
        const dy = target.y - start.y;
        const forward = dx * forwardX + dy * forwardY;
        const side = Math.abs(dx * sideX + dy * sideY);
        const margin = target.realSize || target.size || target.SIZE || 0;
        const length = zone.craftrasPopeBeamLength || CRAFTRAS_POPE_STAFF_BEAM_LENGTH;
        const halfWidth = (zone.craftrasPopeBeamWidth || CRAFTRAS_POPE_STAFF_BEAM_WIDTH) / 2;
        return forward >= -margin && forward <= length + margin && side <= halfWidth + margin * 0.65;
    }

    applyPopeStaffBeamDamage(zone, owner, players, now) {
        if (!zone || !owner || owner.isDead?.()) return;
        const lastHit = zone.craftrasPopeLastHitAt ??= new Map();
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || mob.craftrasInvulnerableNpc || mob.craftrasMobFamily === "npc") continue;
            if (!this.popeStaffBeamContains(zone, mob)) continue;
            if (now - (lastHit.get(mob.id) || 0) < CRAFTRAS_POPE_STAFF_DAMAGE_INTERVAL) continue;
            lastHit.set(mob.id, now);
            let damage = CRAFTRAS_POPE_STAFF_BEAM_DAMAGE;
            if (mob.craftrasMobType === "king_zombie" && this.protectKingFromPlayer(mob, owner, now)) continue;
            damage = this.capKingDamageByGuardian(mob, damage);
            if (mob.craftrasGuardian) damage = this.absorbGuardianShieldDamage(mob, damage, now);
            if (damage <= 0 || this.tryGuardianDodge(mob, owner, now)) continue;
            if (this.tryGuardianLastStand(mob, damage)) {
                this.flashEntity(mob, 350);
                continue;
            }
            mob.health.amount -= damage;
            this.setMobAggro(mob, owner, now);
            this.handleSwordGuyDamaged(mob, damage, owner, now);
            this.flashEntity(mob);
            if (mob.health.amount <= 0) {
                this.awardCraftrasScore(owner, (MOB_SCORES[mob.craftrasMobType] || 0) * (mob.craftrasScoreMultiplier || 1));
                this.mobs.delete(mob);
                mob.kill?.();
            }
        }
        for (const { body } of players || []) {
            if (!body || body === owner || body.isDead?.()) continue;
            if (!this.popeStaffBeamContains(zone, body)) continue;
            if (now - (lastHit.get(body.id) || 0) < CRAFTRAS_POPE_STAFF_DAMAGE_INTERVAL) continue;
            lastHit.set(body.id, now);
            this.applyPlayerDamage(body, CRAFTRAS_POPE_STAFF_BEAM_DAMAGE, owner);
        }
    }

    applyPopeStaffBeamBlockDamage(zone, now) {
        if (!zone || !zone.owner || zone.owner.isDead?.()) return;
        const lastHit = zone.craftrasPopeLastBlockHitAt ??= new Map();
        const angle = zone.craftrasPopeBeamAngle ?? 0;
        const start = zone.craftrasPopeBeamStart || { x: zone.x, y: zone.y };
        const length = zone.craftrasPopeBeamLength || CRAFTRAS_POPE_STAFF_BEAM_LENGTH;
        const halfWidth = (zone.craftrasPopeBeamWidth || CRAFTRAS_POPE_STAFF_BEAM_WIDTH) / 2;
        const forwardX = Math.cos(angle);
        const forwardY = Math.sin(angle);
        const sideX = -forwardY;
        const sideY = forwardX;
        const step = Math.max(BLOCK_SIZE * 0.65, halfWidth * 0.45);
        const sideStep = Math.max(BLOCK_SIZE * 0.9, halfWidth * 0.75);
        const damaged = new Set();
        for (let forward = 0; forward <= length; forward += step) {
            for (let side = -halfWidth; side <= halfWidth; side += sideStep) {
                const cell = worldToBlock(
                    start.x + forwardX * forward + sideX * side,
                    start.y + forwardY * forward + sideY * side,
                );
                const key = this.wallKey(cell.x, cell.y);
                if (damaged.has(key)) continue;
                damaged.add(key);
                if (now - (lastHit.get(key) || 0) < CRAFTRAS_POPE_STAFF_DAMAGE_INTERVAL) continue;
                if (this.getBlock(cell.x, cell.y) === BLOCKS.AIR) continue;
                lastHit.set(key, now);
                this.damageBlockAt(cell.x, cell.y, CRAFTRAS_POPE_STAFF_BEAM_BLOCK_DAMAGE, { suppressDrops: true });
            }
        }
    }

    applyPopeStaffAreaDamage(sourceEntity, owner, radius, players, now, baseDamage = CRAFTRAS_POPE_STAFF_SHOT_DAMAGE) {
        if (!sourceEntity || !owner || owner.isDead?.()) return;
        const lastHit = sourceEntity.craftrasPopeLastHitAt ??= new Map();
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || mob.craftrasInvulnerableNpc || mob.craftrasMobFamily === "npc") continue;
            const hitRadius = radius + Math.max(1, mob.realSize || mob.size || 12);
            const dx = mob.x - sourceEntity.x;
            const dy = mob.y - sourceEntity.y;
            if (dx * dx + dy * dy > hitRadius * hitRadius) continue;
            if (now - (lastHit.get(mob.id) || 0) < CRAFTRAS_POPE_STAFF_DAMAGE_INTERVAL) continue;
            lastHit.set(mob.id, now);
            let damage = baseDamage;
            if (mob.craftrasMobType === "king_zombie" && this.protectKingFromPlayer(mob, owner, now)) continue;
            damage = this.capKingDamageByGuardian(mob, damage);
            if (mob.craftrasGuardian) damage = this.absorbGuardianShieldDamage(mob, damage, now);
            if (damage <= 0 || this.tryGuardianDodge(mob, owner, now)) continue;
            if (this.tryGuardianLastStand(mob, damage)) {
                this.flashEntity(mob, 350);
                continue;
            }
            mob.health.amount -= damage;
            this.setMobAggro(mob, owner, now);
            this.handleSwordGuyDamaged(mob, damage, owner, now);
            this.flashEntity(mob);
            if (mob.health.amount <= 0) {
                this.awardCraftrasScore(owner, (MOB_SCORES[mob.craftrasMobType] || 0) * (mob.craftrasScoreMultiplier || 1));
                this.mobs.delete(mob);
                mob.kill?.();
            }
        }
        for (const { body } of players || []) {
            if (!body || body === owner || body.isDead?.()) continue;
            const hitRadius = radius + Math.max(1, body.realSize || body.size || 12);
            const dx = body.x - sourceEntity.x;
            const dy = body.y - sourceEntity.y;
            if (dx * dx + dy * dy > hitRadius * hitRadius) continue;
            if (now - (lastHit.get(body.id) || 0) < CRAFTRAS_POPE_STAFF_DAMAGE_INTERVAL) continue;
            lastHit.set(body.id, now);
            this.applyPlayerDamage(body, baseDamage, owner);
        }
    }

    flashEntity(entity, duration = 150) {
        if (!entity || entity.isDead?.()) return;
        if (!entity.craftrasFlashUntil || entity.craftrasFlashUntil < Date.now()) entity.craftrasFlashColor = entity.color.base;
        entity.craftrasFlashUntil = Date.now() + duration;
        entity.color.base = "#ff4545";
        entity.alpha = 0.5;
        entity.blend.amount = 1;
    }

    restoreEntityFlash(entity, now = Date.now()) {
        if (!entity?.craftrasFlashUntil || now < entity.craftrasFlashUntil) return;
        entity.craftrasFlashUntil = 0;
        if (entity.craftrasFlashColor != null) entity.color.base = entity.craftrasFlashColor;
        entity.alpha = 1;
    }

    absorbShieldDamage(body, amount) {
        if (!body?.control?.alt || amount <= 0) return amount;
        if (ITEMS[body.craftrasHeldItem]?.heal) return amount;
        if (body.craftrasHeldItem === "pope_staff") return amount;
        const offhand = body.craftrasOffhandShield;
        const mainhand = body.craftrasMainHandStack;
        const shield = ITEMS[offhand?.id]?.shieldHealth ? offhand : ITEMS[mainhand?.id]?.shieldHealth ? mainhand : null;
        if (!shield) return amount;
        const maxHealth = ITEMS[shield.id].shieldHealth;
        const now = Date.now();
        if (shield.brokenUntil && now >= shield.brokenUntil) {
            shield.durability = maxHealth;
            shield.brokenUntil = 0;
        }
        if (shield.brokenUntil && now < shield.brokenUntil) return amount;
        if (!Number.isFinite(shield.durability)) shield.durability = maxHealth;
        const absorbed = Math.min(shield.durability, amount);
        shield.durability -= absorbed;
        if (absorbed > 0) {
            shield.hitUntil = now + 450;
            shield.lastDamageAt = now;
            shield.nextRegenAt = now + CRAFTRAS_SHIELD_REGEN_DELAY;
        }
        if (shield.durability <= 0) {
            shield.durability = 0;
            shield.brokenUntil = now + 15_000;
        }
        const socket = this.gameManager.clients.find(client => client?.player?.body === body);
        if (socket) this.gameManager.socketManager.sendCraftrasInventory(socket);
        return amount - absorbed;
    }

    updatePlayerShieldRecovery(socket, body, now) {
        if (!socket?.craftrasInventory || !body) return;
        const shields = new Set([socket.craftrasInventory.offhand, body.craftrasMainHandStack]);
        let changed = false;
        for (const shield of shields) {
            const maxHealth = ITEMS[shield?.id]?.shieldHealth;
            if (!maxHealth) continue;
            if (shield.brokenUntil && now < shield.brokenUntil) continue;
            if (shield.brokenUntil && now >= shield.brokenUntil) {
                shield.durability = maxHealth;
                shield.brokenUntil = 0;
                shield.nextRegenAt = now + CRAFTRAS_SHIELD_REGEN_DELAY;
                changed = true;
                continue;
            }
            if (!Number.isFinite(shield.durability)) shield.durability = maxHealth;
            if (shield.durability >= maxHealth) continue;
            const lastDamageAt = Number.isFinite(shield.lastDamageAt) ? shield.lastDamageAt : 0;
            const readyAt = Math.max(lastDamageAt + CRAFTRAS_SHIELD_REGEN_DELAY, Number.isFinite(shield.nextRegenAt) ? shield.nextRegenAt : 0);
            if (now < readyAt) continue;
            const ticks = Math.max(1, Math.floor((now - readyAt) / CRAFTRAS_SHIELD_REGEN_INTERVAL) + 1);
            const recovered = maxHealth * CRAFTRAS_SHIELD_REGEN_RATIO * ticks;
            shield.durability = Math.min(maxHealth, shield.durability + recovered);
            shield.nextRegenAt = readyAt + ticks * CRAFTRAS_SHIELD_REGEN_INTERVAL;
            changed = true;
        }
        if (changed) {
            body.craftrasOffhandShield = socket.craftrasInventory.offhand || null;
            this.gameManager.socketManager.sendCraftrasInventory(socket);
        }
    }

    applyPlayerDamage(body, amount, source, options = {}) {
        if (!body || body.isDead?.() || body.invuln || body.godmode || amount <= 0) return false;
        const noKnockback = !!options.noKnockback;
        amount = this.absorbShieldDamage(body, amount);
        if (amount <= 0) {
            if (source && !noKnockback) {
                const dx = body.x - source.x;
                const dy = body.y - source.y;
                const distance = Math.hypot(dx, dy) || 1;
                body.velocity.x += dx / distance * 12;
                body.velocity.y += dy / distance * 12;
                this.resolveEntityOutOfWall(body);
            }
            return true;
        }
        body.health.amount -= amount;
        body.craftrasLastDamageAt = Date.now();
        body.craftrasNextRegenAt = body.craftrasLastDamageAt + 10000;
        this.flashEntity(body);
        if (source && !noKnockback) {
            const dx = body.x - source.x;
            const dy = body.y - source.y;
            const distance = Math.hypot(dx, dy) || 1;
            body.velocity.x += dx / distance * 12;
            body.velocity.y += dy / distance * 12;
            this.resolveEntityOutOfWall(body);
        }
        if (body.health.amount <= 0) {
            body.kill?.();
            this.handleTheSwordParticipantDeath(body);
        }
        return true;
    }

    applyCombatTargetDamage(target, amount, source) {
        if (!target || target.isDead?.() || amount <= 0) return false;
        if (target.craftrasMobFamily === "npc") return this.applyVillageCombatNpcDamage(target, amount, source);
        return this.applyPlayerDamage(target, amount, source, { noKnockback: !!source?.craftrasNoAttackKnockback });
    }

    handleSwordGuyDamaged(mob, damage = 1, source = null, now = Date.now()) {
        if (!mob || mob.craftrasMobType !== "sword_guy" || damage <= 0) return false;
        if (mob.isDead?.() && mob.craftrasSwordGuyPhase !== 1) return false;
        if (mob.craftrasSwordGuyPhase === 2) {
            mob.damageReceived = Math.min(mob.craftrasMaxIncomingDamage || 1e10, Math.max(0, damage));
            if (source && source.id) {
                mob.craftrasSwordGuyParticipantIds ??= new Set();
                mob.craftrasSwordGuyParticipantIds.add(source.id);
            }
            if (source && !source.isDead?.()) this.setMobAggro(mob, source, now);
            if ((mob.health?.amount ?? 0) <= 0) {
                this.startTheSwordDeathDialogue(mob, source, now);
                return true;
            }
            return true;
        }
        if (mob.craftrasSwordGuyPhase === "intro" || mob.craftrasSwordGuyPhase === "recovering" || mob.craftrasSwordGuyPhase === "dying") {
            mob.health.amount = Math.max(1, mob.health.amount || 1);
            mob.damageReceived = 0;
            mob.readyToDie = false;
            return true;
        }
        if (source && source.id) {
            mob.craftrasSwordGuyParticipantIds ??= new Set();
            mob.craftrasSwordGuyParticipantIds.add(source.id);
        }
        if (source && !source.isDead?.()) this.setMobAggro(mob, source, now);
        if (mob.craftrasSwordGuyPhase === 1 && (mob.health?.amount ?? 0) <= 0) {
            this.startSwordGuyPhaseTwoIntro(mob, source, now);
            return true;
        }
        if (mob.craftrasSwordGuyHostile) return false;
        if ((mob.health?.amount ?? 0) <= 500) {
            mob.craftrasSwordGuyHostile = true;
            mob.say?.("Fine, you started it!", Config.chat_message_duration);
            return true;
        }
        if (now >= (mob.craftrasNextSwordGuyLineAt || 0)) {
            mob.craftrasNextSwordGuyLineAt = now + 850;
            mob.say?.(CRAFTRAS_SWORD_GUY_LINES[Math.floor(Math.random() * CRAFTRAS_SWORD_GUY_LINES.length)], Config.chat_message_duration);
        }
        return false;
    }

    findSocketByBody(body) {
        if (!body) return null;
        return this.gameManager.clients.find(socket => socket?.player?.body === body) || null;
    }

    socketHasCraftrasItem(socket, itemId) {
        const inventory = socket?.craftrasInventory;
        if (!inventory || !itemId) return false;
        return [
            ...(Array.isArray(inventory.slots) ? inventory.slots : []),
            inventory.cursor,
            inventory.helmet,
            inventory.offhand,
        ].some(stack => stack?.id === itemId && (stack.count ?? 1) > 0);
    }

    getSwordGuyParticipants(mob, players = this.getLivingPlayers()) {
        const ids = mob?.craftrasSwordGuyParticipantIds;
        if (!(ids instanceof Set) || !ids.size) return [];
        return players.filter(({ body }) => ids.has(body.id));
    }

    getTheSwordDamage(body, kind) {
        const max = Math.max(1, body?.health?.max || 100);
        let damage;
        if (kind === "melee") damage = Math.max(80, max * 0.2);
        else if (kind === "slash") damage = Math.max(10, max * 0.1);
        else damage = Math.max(10, max * 0.05);
        return Math.min(CRAFTRAS_THE_SWORD_PLAYER_DAMAGE_CAP, damage);
    }

    applyTheSwordPlayerDamage(body, kind, source) {
        return this.applyPlayerDamage(body, this.getTheSwordDamage(body, kind), source, {
            noKnockback: kind === "friend" || kind === "bullet",
        });
    }

    startTheSwordDeathDialogue(mob, source = null, now = Date.now()) {
        if (!mob || mob.craftrasSwordGuyPhase === "dying" || mob.craftrasTheSwordDeathFinished) return false;
        this.clearSwordGuyTransformTimers(mob);
        mob.craftrasSwordGuyPhase = "dying";
        mob.craftrasDeathLocked = true;
        mob.invuln = true;
        mob.damageReceived = 0;
        mob.readyToDie = false;
        mob.health.amount = 1;
        mob.craftrasSwordGuyCombo = null;
        mob.craftrasTheSwordRewardBody = source && !source.isDead?.() ? source : null;
        mob.velocity.x = 0;
        mob.velocity.y = 0;
        if (mob.accel) {
            mob.accel.x = 0;
            mob.accel.y = 0;
        }
        mob.craftrasControl = {
            goal: { x: mob.x, y: mob.y },
            target: { x: Math.cos(mob.facing || 0), y: Math.sin(mob.facing || 0) },
            fire: false,
            power: 0,
        };

        let delay = 0;
        mob.craftrasSwordGuyTransformTimers = [];
        for (const line of CRAFTRAS_THE_SWORD_DEATH_LINES) {
            const timer = setTimeout(() => {
                if (!mob || mob.craftrasSwordGuyPhase !== "dying") return;
                mob.health.amount = 1;
                mob.damageReceived = 0;
                mob.readyToDie = false;
                this.sendTheSwordIntroLine(mob, line.text, line.duration);
            }, delay);
            mob.craftrasSwordGuyTransformTimers.push(timer);
            delay += line.duration;
        }
        const finishTimer = setTimeout(() => {
            if (!mob || mob.craftrasSwordGuyPhase !== "dying") return;
            this.finishTheSwordDeath(mob);
        }, delay);
        mob.craftrasSwordGuyTransformTimers.push(finishTimer);
        return true;
    }

    finishTheSwordDeath(mob) {
        if (!mob || mob.craftrasTheSwordDeathFinished) return false;
        mob.craftrasTheSwordDeathFinished = true;
        this.clearSwordGuyTransformTimers(mob);
        const participants = this.getSwordGuyParticipants(mob);
        const rewardBody = mob.craftrasTheSwordRewardBody && !mob.craftrasTheSwordRewardBody.isDead?.()
            ? mob.craftrasTheSwordRewardBody
            : participants.find(({ body }) => body && !body.isDead?.())?.body || null;
        const rewardSocket = this.findSocketByBody(rewardBody);
        const messageSockets = new Set(participants.map(({ socket }) => socket).filter(Boolean));
        if (rewardSocket) messageSockets.add(rewardSocket);
        for (const socket of messageSockets) socket?.talk?.("BM", Config.popup_message_duration, "Sword Guy left a mysterious gift.");
        if (rewardSocket) {
            const accepted = this.gameManager.socketManager.addCraftrasItem(rewardSocket, ITEMS[CRAFTRAS_GREAT_FRIEND_ITEM_ID], 1);
            if (accepted < 1) rewardSocket.talk?.("m", 6_000, "Friend got upset by your rudeness and disappeared.");
        }
        mob.craftrasLootDropped = true;
        mob.craftrasDeathLocked = false;
        mob.invuln = false;
        mob.health.amount = 0;
        this.spawnMobDeathEffect(mob);
        mob.destroy?.();
        this.mobs.delete(mob);
        if (global.craftrasTheSwordLockedIds instanceof Set) global.craftrasTheSwordLockedIds.clear();
        return true;
    }

    handleTheSwordParticipantDeath(body, now = Date.now()) {
        if (!body?.id) return false;
        const active = [...this.mobs].find(mob => (
            mob?.craftrasMobType === "sword_guy" &&
            mob.craftrasSwordGuyPhase === 2 &&
            mob.craftrasSwordGuyParticipantIds instanceof Set &&
            mob.craftrasSwordGuyParticipantIds.has(body.id) &&
            !mob.craftrasTheSwordResetting
        ));
        if (!active) return false;
        active.craftrasTheSwordResetting = true;
        const participantIds = new Set(active.craftrasSwordGuyParticipantIds);
        const sockets = new Set();
        for (const socket of this.gameManager.clients || []) {
            const playerBody = socket?.player?.body;
            if (playerBody?.id && participantIds.has(playerBody.id)) sockets.add(socket);
        }
        const deadSocket = this.findSocketByBody(body);
        if (deadSocket) sockets.add(deadSocket);
        for (const socket of sockets) socket?.talk?.("BM", Config.popup_message_duration, "Better luck next time.", "#ff3030");
        this.resetTheSwordToPhaseOne(active, now);
        return true;
    }

    resetTheSwordToPhaseOne(mob, now = Date.now()) {
        if (!mob) return null;
        this.clearSwordGuyTransformTimers(mob);
        const location = mob.craftrasSwordGuyArenaCenter || { x: mob.x, y: mob.y };
        for (const projectile of [...this.theGreatProjectiles]) {
            if (projectile?.craftrasPhotoFriend || projectile?.craftrasCompanionFriend) continue;
            projectile?.craftrasWarningLine?.destroy?.();
            projectile?.destroy?.();
            this.theGreatProjectiles.delete(projectile);
        }
        for (const warning of [...this.theGreatWarnings]) {
            warning?.destroy?.();
            this.theGreatWarnings.delete(warning);
        }
        for (const projectile of [...this.guardianSlashProjectiles]) {
            if (projectile?.craftrasGuardianSlashOwner !== mob) continue;
            projectile?.destroy?.();
            this.guardianSlashProjectiles.delete(projectile);
        }
        mob.craftrasSwordGuyPhase = "reset";
        mob.destroy?.();
        this.mobs.delete(mob);
        if (global.craftrasTheSwordLockedIds instanceof Set) global.craftrasTheSwordLockedIds.clear();
        const replacement = this.spawnMobAt(location, "sword_guy");
        if (replacement) {
            replacement.craftrasSwordGuyArenaCenter = { x: location.x, y: location.y };
            replacement.craftrasNextSwordGuyLineAt = now + 1000;
        }
        return replacement;
    }

    stripTheSwordPlayerPower(body) {
        const socket = this.findSocketByBody(body);
        if (!socket?.craftrasInventory) return;
        if (socket.craftrasTheSwordOpOverride) return;
        body.godmode = false;
        body.invuln = false;
        body.craftrasCreativeFlight = false;
        const isForbidden = stack => stack && ITEMS[stack.id]?.adminOnly && !ITEMS[stack.id]?.superAdminOnly;
        const selectedSlot = Number.isInteger(socket.craftrasHotbar?.selected)
            ? socket.craftrasHotbar.selected
            : Number.isInteger(body.craftrasSelectedHotbarSlot)
                ? body.craftrasSelectedHotbarSlot
                : 0;
        for (let i = 0; i < socket.craftrasInventory.slots.length; i++) {
            if (isForbidden(socket.craftrasInventory.slots[i])) socket.craftrasInventory.slots[i] = null;
        }
        if (isForbidden(socket.craftrasInventory.offhand)) socket.craftrasInventory.offhand = null;
        if (isForbidden(socket.craftrasInventory.cursor)) socket.craftrasInventory.cursor = null;
        if (isForbidden(socket.craftrasInventory.craftingOutput)) socket.craftrasInventory.craftingOutput = null;
        const selectedStack = socket.craftrasInventory.slots[selectedSlot] || null;
        body.craftrasSelectedHotbarSlot = selectedSlot;
        body.craftrasHeldItem = selectedStack?.id || null;
        body.craftrasMainHandStack = selectedStack;
        global.craftrasTheSwordLockedIds ??= new Set();
        global.craftrasTheSwordLockedIds.add(body.id);
        this.gameManager.socketManager.sendCraftrasInventory(socket);
    }

    startSwordGuyPhaseTwoIntro(mob, source = null, now = Date.now()) {
        if (!mob || mob.craftrasSwordGuyPhase !== 1) return;
        this.clearSwordGuyTransformTimers(mob);
        mob.craftrasSwordGuyPhase = "intro";
        mob.craftrasDeathLocked = true;
        mob.craftrasSwordGuyPendingIntro = false;
        mob.craftrasSwordGuyHostile = true;
        mob.craftrasSwordGuyIntroStartedAt = now;
        mob.craftrasSwordGuyIntroIndex = 0;
        mob.craftrasNextSwordGuyIntroLineAt = now;
        mob.craftrasSwordGuyArenaCenter ||= { x: mob.x, y: mob.y };
        mob.craftrasSwordGuyParticipantIds ??= new Set();
        if (source?.id) mob.craftrasSwordGuyParticipantIds.add(source.id);
        mob.health.set(3000);
        mob.health.amount = 1;
        mob.damageReceived = 0;
        mob.readyToDie = false;
        mob.invuln = true;
        mob.velocity.x = 0;
        mob.velocity.y = 0;
        for (const { body } of this.getSwordGuyParticipants(mob)) this.stripTheSwordPlayerPower(body);
        this.spawnExplosionEffect({ x: mob.x, y: mob.y }, { duration: 900, startSize: 28, growth: 0.06, color: "#f7f7ff", alpha: 0.35 });
        this.scheduleSwordGuyPhaseTwoIntro(mob);
    }

    startSwordGuyPhaseTwo(mob, now = Date.now()) {
        if (!mob || mob.craftrasSwordGuyPhase === 2) return;
        this.clearSwordGuyTransformTimers(mob);
        const location = { x: mob.x, y: mob.y };
        const arenaCenter = mob.craftrasSwordGuyArenaCenter || location;
        const participantIds = new Set(mob.craftrasSwordGuyParticipantIds instanceof Set ? [...mob.craftrasSwordGuyParticipantIds] : []);
        const facing = mob.facing || 0;
        mob.craftrasSwordGuyPhase = "replaced";
        mob.craftrasDeathLocked = false;
        mob.invuln = false;
        mob.readyToDie = false;
        mob.damageReceived = 0;
        mob.destroy?.();
        this.mobs.delete(mob);
        const replacement = this.spawnMobAt(location, "sword_guy");
        if (!replacement) return null;
        replacement.craftrasSwordGuyParticipantIds = participantIds;
        replacement.craftrasSwordGuyArenaCenter = arenaCenter;
        replacement.facing = facing;
        replacement.vfacing = facing;
        this.configureTheSwordPhaseTwoBoss(replacement, now);
        for (const { socket } of this.getSwordGuyParticipants(replacement)) {
            socket?.talk?.("BM", Config.popup_message_duration, "A mysterious power has stripped you of your TOKEN");
            socket?.talk?.("BM", CRAFTRAS_THE_SWORD_READY_DURATION, "ARE YOU READY?", "#ff3030");
        }
        return replacement;
    }

    configureTheSwordPhaseTwoBoss(mob, now = Date.now()) {
        if (!mob) return null;
        mob.define?.("craftrasTheSword");
        mob.craftrasSwordGuyPhase = 2;
        mob.craftrasMobType = "sword_guy";
        mob.craftrasMobFamily = "skeleton";
        mob.craftrasDeathLocked = false;
        mob.craftrasSwordGuyPendingIntro = false;
        mob.craftrasSwordGuyIntroScheduled = false;
        mob.invuln = false;
        mob.readyToDie = false;
        mob.damageReceived = 0;
        mob.removeAllListeners?.("damage");
        mob.name = "THE SWORD";
        mob.craftrasBaseName = "THE SWORD";
        mob.nameColor = "#4aa3ff";
        mob.craftrasHeldItem = "the_great";
        mob.craftrasSwordGuyHostile = true;
        mob.craftrasSunImmune = true;
        mob.craftrasBurning = false;
        mob.craftrasNextSunDamageAt = 0;
        mob.craftrasMaxIncomingDamage = 1e10;
        mob.health.set(3000);
        mob.health.amount = 3000;
        mob.craftrasPhaseTwoHoldUntil = now + CRAFTRAS_THE_SWORD_READY_DURATION;
        mob.craftrasNextSwordGuyComboAt = mob.craftrasPhaseTwoHoldUntil + 1500;
        mob.craftrasSwordGuyComboIndex = 0;
        mob.craftrasSwordGuyCombo = null;
        mob.craftrasRetreatGoal = null;
        mob.craftrasNextRetreatAt = 0;
        mob.craftrasControl = {
            goal: { x: mob.x, y: mob.y },
            target: { x: Math.cos(mob.facing || 0), y: Math.sin(mob.facing || 0) },
            fire: false,
            power: 0,
        };
        mob.controllers = [{
            acceptsFromTop: true,
            think: () => mob.craftrasControl,
        }];
        mob.on?.("damage", ({ damageInflictor = [], damageTool = [] } = {}) => {
            const received = Math.min(mob.craftrasMaxIncomingDamage || 1e10, Math.max(1, Number(mob.damageReceived) || 0));
            const attacker = this.findPlayerDamageSource(damageInflictor, damageTool);
            if (attacker?.id) {
                mob.craftrasSwordGuyParticipantIds ??= new Set();
                mob.craftrasSwordGuyParticipantIds.add(attacker.id);
            }
            if (attacker && !attacker.isDead?.()) this.setMobAggro(mob, attacker);
            mob.damageReceived = received;
            if ((mob.health?.amount ?? 0) - received <= 0 || (mob.health?.amount ?? 0) <= 0) {
                mob.damageReceived = 0;
                mob.health.amount = 1;
                this.startTheSwordDeathDialogue(mob, attacker, Date.now());
            }
        });
        this.setSwordGuyWeaponVisual(mob);
        this.setTheSwordIdlePose(mob);
        return mob;
    }

    clearSwordGuyTransformTimers(mob) {
        if (!mob) return;
        for (const timer of mob.craftrasSwordGuyTransformTimers || []) clearTimeout(timer);
        mob.craftrasSwordGuyTransformTimers = [];
        if (mob.craftrasSwordGuyRecoverTimer) {
            clearInterval(mob.craftrasSwordGuyRecoverTimer);
            mob.craftrasSwordGuyRecoverTimer = null;
        }
    }

    maintainSwordGuyTransformLock(mob) {
        if (!mob || mob.isDead?.() && mob.craftrasSwordGuyPhase !== 1) return false;
        mob.health.set(3000);
        mob.health.amount = Math.max(1, mob.health.amount || 1);
        mob.damageReceived = 0;
        mob.readyToDie = false;
        mob.invuln = true;
        mob.velocity.x *= 0.2;
        mob.velocity.y *= 0.2;
        this.setZombieSwordPose(mob, -35);
        this.setSwordGuyWeaponVisual(mob);
        return true;
    }

    scheduleSwordGuyPhaseTwoIntro(mob) {
        if (!mob || mob.craftrasSwordGuyIntroScheduled) return;
        mob.craftrasSwordGuyIntroScheduled = true;
        mob.craftrasSwordGuyTransformTimers = [];
        CRAFTRAS_THE_SWORD_INTRO_LINES.forEach((line, index) => {
            const timer = setTimeout(() => {
                if (!mob || mob.craftrasSwordGuyPhase !== "intro") return;
                if (!this.maintainSwordGuyTransformLock(mob)) return;
                this.sendTheSwordIntroLine(mob, line);
            }, index * CRAFTRAS_THE_SWORD_INTRO_LINE_INTERVAL);
            mob.craftrasSwordGuyTransformTimers.push(timer);
        });
        const recoverTimer = setTimeout(() => {
            if (!mob || mob.craftrasSwordGuyPhase !== "intro") return;
            if (!this.maintainSwordGuyTransformLock(mob)) return;
            mob.craftrasSwordGuyPhase = "recovering";
            mob.craftrasSwordGuyRecoveryAnnounced = true;
            mob.craftrasSwordGuyRecoverStartedAt = Date.now();
            mob.health.set(3000);
            mob.health.amount = 1;
            this.sendTheSwordIntroLine(mob, "...");
            mob.craftrasSwordGuyRecoverTimer = setInterval(() => {
                if (!mob || mob.craftrasSwordGuyPhase !== "recovering") {
                    if (mob?.craftrasSwordGuyRecoverTimer) clearInterval(mob.craftrasSwordGuyRecoverTimer);
                    if (mob) mob.craftrasSwordGuyRecoverTimer = null;
                    return;
                }
                if (!this.maintainSwordGuyTransformLock(mob)) return;
                const elapsed = Date.now() - (mob.craftrasSwordGuyRecoverStartedAt || Date.now());
                const recovered = Math.floor(elapsed / CRAFTRAS_THE_SWORD_RECOVER_INTERVAL) * CRAFTRAS_THE_SWORD_RECOVER_PER_TICK;
                mob.health.amount = Math.min(3000, 1 + recovered);
                if (mob.health.amount >= 3000) {
                    clearInterval(mob.craftrasSwordGuyRecoverTimer);
                    mob.craftrasSwordGuyRecoverTimer = null;
                    this.startSwordGuyPhaseTwo(mob, Date.now());
                }
            }, 100);
        }, CRAFTRAS_THE_SWORD_INTRO_LINES.length * CRAFTRAS_THE_SWORD_INTRO_LINE_INTERVAL);
        mob.craftrasSwordGuyTransformTimers.push(recoverTimer);
    }

    updateSwordGuyTransformations(now = Date.now()) {
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() && mob.craftrasSwordGuyPhase !== 1 || mob.craftrasMobType !== "sword_guy") continue;
            if (mob.craftrasSwordGuyPendingIntro && mob.craftrasSwordGuyPhase === 1) {
                this.startSwordGuyPhaseTwoIntro(mob, this.nearestPlayer(mob, this.getLivingPlayers())?.body || null, now);
            }
            if (mob.craftrasSwordGuyPhase === "intro") {
                this.updateTheSwordIntro(mob, now);
            } else if (mob.craftrasSwordGuyPhase === "recovering") {
                this.updateTheSwordRecovery(mob, now);
            }
        }
    }

    sendTheSwordIntroLine(mob, message, durationOverride = null) {
        if (!mob || !message) return;
        const duration = Number.isFinite(durationOverride) ? durationOverride : [
            "You really do love fighting, don't you?",
            "I'll make sure you have plenty of fun.",
        ].includes(message) ? 3000 : CRAFTRAS_THE_SWORD_INTRO_LINE_DURATION;
        mob.say?.(message, duration);
        const participants = this.getSwordGuyParticipants(mob);
        const targets = participants.length ? participants : this.getLivingPlayers();
        for (const { socket } of targets) socket?.talk?.("BM", duration, message, "#ff3030");
    }

    knockCombatTargetFromSource(target, source, force = 36) {
        if (!target || !source || !target.velocity || force <= 0) return;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.hypot(dx, dy) || 1;
        target.velocity.x += dx / distance * force;
        target.velocity.y += dy / distance * force;
    }

    applyVillageCombatNpcDamage(target, amount, source) {
        if (!target || target.isDead?.() || amount <= 0 || target.craftrasMobFamily !== "npc") return false;
        const damageableChallengeActor = target.craftrasChallengeActor && this.challengeStage === "active";
        if (!VILLAGE_COMBAT_NPC_TYPES.has(target.craftrasMobType) && !damageableChallengeActor) {
            if (target.health) target.health.amount = target.health.max;
            return false;
        }
        target.health.amount -= amount;
        if (target.craftrasChallengeActor) target.craftrasNextChallengeRegenAt = Date.now() + CRAFTRAS_CHALLENGE_NPC_REGEN_INTERVAL;
        this.flashEntity(target);
        if (source) {
            target.craftrasGuardTarget = source;
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distance = Math.hypot(dx, dy) || 1;
            target.velocity.x += dx / distance * 10;
            target.velocity.y += dy / distance * 10;
        }
        if (target.health.amount <= 0) {
            this.mobs.delete(target);
            target.kill?.();
        }
        return true;
    }

    applyPlayerPoison(body, amount = 30) {
        if (!body || body.isDead?.() || body.invuln || body.godmode) return false;
        body.craftrasPoisonRemaining = Math.max(body.craftrasPoisonRemaining || 0, amount);
        body.craftrasPoisonUntil = Date.now() + 10_000;
        body.craftrasNextPoisonAt = Date.now() + 1000;
        return true;
    }

    updatePlayerPoison(body, now) {
        if (!body?.craftrasPoisonUntil || body.isDead?.()) return;
        if (body.invuln || body.godmode) {
            body.craftrasPoisonRemaining = 0;
            body.craftrasPoisonUntil = 0;
            return;
        }
        if (now >= body.craftrasPoisonUntil) {
            body.craftrasPoisonRemaining = 0;
            body.craftrasPoisonUntil = 0;
            return;
        }
        if (now < (body.craftrasNextPoisonAt || 0)) return;
        const damage = Math.min(5, Math.max(0, body.health.amount - 1));
        body.craftrasPoisonRemaining = Math.max(0, (body.craftrasPoisonRemaining || 0) - damage);
        body.craftrasNextPoisonAt = now + 1000;
        if (damage <= 0) return;
        body.health.amount -= damage;
        body.craftrasLastDamageAt = now;
        body.craftrasNextRegenAt = now + 10000;
        this.flashEntity(body);
    }

    syncPlayerDebuffs(socket, body, now) {
        const debuffs = [];
        if (this.knightTargetBody === body) {
            debuffs.push({
                id: "knight_target",
                name: "Knight's Target",
                description: "You attacked the king.",
                remaining: -1,
            });
        }
        if ((body.craftrasPoisonUntil || 0) > now) {
            debuffs.push({
                id: "poison",
                name: "Poison",
                description: "It gnaws away at your life.",
                remaining: Math.max(1, Math.ceil((body.craftrasPoisonUntil - now) / 1000)),
            });
        }
        if (this.hasHealthBlessing(body, now)) {
            const healthUntil = Math.max(body.craftrasBlessingUntil || 0, body.craftrasHealthBlessingUntil || 0);
            const remaining = body.craftrasHelmet === "blesser_hat" ? -1 : Math.max(1, Math.ceil((healthUntil - now) / 1000));
            debuffs.push({
                id: "health_buff",
                name: "Health Buff",
                description: "Max health +200 and blessed recovery.",
                remaining,
            });
        }
        if (this.hasStrengthBlessing(body, now)) {
            const strengthUntil = Math.max(body.craftrasBlessingUntil || 0, body.craftrasStrengthBlessingUntil || 0);
            const remaining = body.craftrasHelmet === "blesser_hat" ? -1 : Math.max(1, Math.ceil((strengthUntil - now) / 1000));
            debuffs.push({
                id: "strength_buff",
                name: "Strength Buff",
                description: "Melee damage +40.",
                remaining,
            });
        }
        const signature = JSON.stringify(debuffs);
        if (socket.craftrasDebuffSignature === signature) return;
        socket.craftrasDebuffSignature = signature;
        socket.talk("DF", signature);
    }

    awardCraftrasScore(body, amount) {
        if (!body || body.isDead?.() || !Number.isFinite(amount) || amount <= 0) return false;
        const socket = this.getSocketForBody(body);
        if (socket && !this.updateCraftrasScoreGate(socket, body)) {
            return false;
        }
        body.skill.score += amount;
        while (body.skill.maintain()) { }
        if (socket) this.updateCraftrasScoreGate(socket, body);
        body.skill.points = 0;
        return true;
    }

    pointToSegmentDistanceSquared(x, y, segment) {
        const dx = segment.endX - segment.startX;
        const dy = segment.endY - segment.startY;
        const lengthSquared = dx * dx + dy * dy;
        const amount = lengthSquared > 1e-8
            ? Math.max(0, Math.min(1, ((x - segment.startX) * dx + (y - segment.startY) * dy) / lengthSquared))
            : 0;
        const closestX = segment.startX + dx * amount;
        const closestY = segment.startY + dy * amount;
        return (x - closestX) ** 2 + (y - closestY) ** 2;
    }

    toolSegmentsHitCircle(toolSegments, target) {
        const targetRadius = Math.max(1, target.realSize || target.size || 12);
        for (const segment of toolSegments || []) {
            const hitRadius = targetRadius + segment.radius;
            if (this.pointToSegmentDistanceSquared(target.x, target.y, segment) <= hitRadius * hitRadius) return true;
        }
        return false;
    }

    toolSegmentHitsBlock(segment, blockX, blockY) {
        const location = blockToWorld(blockX, blockY);
        const half = WALL_SIZE * 0.5 + segment.radius;
        const minX = location.x - half;
        const maxX = location.x + half;
        const minY = location.y - half;
        const maxY = location.y + half;
        let low = 0;
        let high = 1;
        const dx = segment.endX - segment.startX;
        const dy = segment.endY - segment.startY;

        for (const [start, delta, min, max] of [
            [segment.startX, dx, minX, maxX],
            [segment.startY, dy, minY, maxY],
        ]) {
            if (Math.abs(delta) < 1e-8) {
                if (start < min || start > max) return false;
                continue;
            }
            const first = (min - start) / delta;
            const second = (max - start) / delta;
            low = Math.max(low, Math.min(first, second));
            high = Math.min(high, Math.max(first, second));
            if (low > high) return false;
        }
        return true;
    }

    damageMobsInSlash(body, { toolSegments, damage, heldItem }) {
        if (!body || body.craftrasSpectator) return;
        if (body?.craftrasMobType === "builder" && body.craftrasBuilderJobMode === "demolish") return;
        if (!this.mobs.size) return;
        body.craftrasCombatHitIds ??= new Set();
        const itemDamage = ITEMS[heldItem]?.damage;
        const multiplier = heldItem === "sword" || heldItem?.endsWith("_sword") ? 1 : 0.5;
        const now = Date.now();
        const blessingDamageBonus = this.hasStrengthBlessing(body, now) ? VILLAGE_BLESSER_DAMAGE_BONUS : 0;
        const effectiveDamage = (Number.isFinite(itemDamage) ? itemDamage : damage * multiplier) + blessingDamageBonus;

        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || body.craftrasCombatHitIds.has(mob.id)) continue;
            if (mob.craftrasInvulnerableNpc || mob.craftrasMobFamily === "npc") {
                if (mob.health) mob.health.amount = mob.health.max;
                continue;
            }
            if (!this.toolSegmentsHitCircle(toolSegments, mob)) continue;
            const dx = mob.x - body.x;
            const dy = mob.y - body.y;
            body.craftrasCombatHitIds.add(mob.id);
            if (mob.craftrasMobType === "king_zombie" && this.protectKingFromPlayer(mob, body, now)) continue;
            let damageToMob = effectiveDamage;
            damageToMob = this.capKingDamageByGuardian(mob, damageToMob);
            if (mob.craftrasGuardian) damageToMob = this.absorbGuardianShieldDamage(mob, damageToMob, now);
            if (damageToMob <= 0) continue;
            if (this.tryGuardianDodge(mob, body, now)) continue;
            if (this.tryGuardianLastStand(mob, damageToMob)) {
                this.flashEntity(mob, 350);
                continue;
            }
            mob.health.amount -= damageToMob;
            this.setMobAggro(mob, body, now);
            this.handleSwordGuyDamaged(mob, damageToMob, body, now);
            this.flashEntity(mob);
            if (heldItem === "venom_sword") this.applyMobPoison(mob, body, 10, 10_000);
            const distance = Math.hypot(dx, dy) || 1;
            if (!mob.craftrasNoKnockback) {
                mob.velocity.x += dx / distance * 16;
                mob.velocity.y += dy / distance * 16;
            }
            if (mob.health.amount <= 0) {
                this.awardCraftrasScore(body, (MOB_SCORES[mob.craftrasMobType] || 0) * (mob.craftrasScoreMultiplier || 1));
                mob.kill?.();
            }
        }
    }

    applyMobPoison(mob, owner, damage = 10, duration = 10_000) {
        if (!mob || mob.isDead?.() || mob.craftrasInvulnerableNpc || mob.craftrasMobFamily === "npc") return false;
        const now = Date.now();
        mob.craftrasPoisonDamage = Math.max(mob.craftrasPoisonDamage || 0, damage);
        mob.craftrasPoisonUntil = Math.max(mob.craftrasPoisonUntil || 0, now + duration);
        mob.craftrasNextPoisonAt = now + 1000;
        mob.craftrasPoisonOwner = owner || mob.craftrasPoisonOwner || null;
        return true;
    }

    updateMobPoison(mob, now) {
        if (!mob?.craftrasPoisonUntil || mob.isDead?.()) return false;
        if (now >= mob.craftrasPoisonUntil) {
            mob.craftrasPoisonUntil = 0;
            mob.craftrasPoisonDamage = 0;
            mob.craftrasPoisonOwner = null;
            return false;
        }
        if (now < (mob.craftrasNextPoisonAt || 0)) return false;
        const damage = this.capKingDamageByGuardian(mob, Math.max(0, mob.craftrasPoisonDamage || 10));
        mob.craftrasNextPoisonAt = now + 1000;
        if (!damage || !mob.health) return false;
        if (this.tryGuardianLastStand(mob, damage)) {
            this.flashEntity(mob, 350);
            return false;
        }
        mob.health.amount -= damage;
        this.handleSwordGuyDamaged(mob, damage, mob.craftrasPoisonOwner, now);
        this.flashEntity(mob);
        if (mob.health.amount > 0) return false;
        const owner = mob.craftrasPoisonOwner;
        if (owner && !owner.isDead?.()) {
            this.awardCraftrasScore(owner, (MOB_SCORES[mob.craftrasMobType] || 0) * (mob.craftrasScoreMultiplier || 1));
        }
        mob.kill?.();
        return true;
    }

    tryGuardianLastStand(mob, damage) {
        if (!mob?.craftrasGuardian || mob.craftrasLastStandUsed || damage < mob.health.amount) return false;
        mob.craftrasLastStandUsed = true;
        mob.health.amount = 1;
        mob.craftrasPoisonUntil = 0;
        mob.craftrasPoisonDamage = 0;
        mob.craftrasPoisonOwner = null;
        mob.craftrasGuardianShieldDurability = 0;
        mob.craftrasGuardianShieldBrokenUntil = Infinity;
        mob.craftrasGuardianShieldPermanent = true;
        mob.craftrasDodgeCharges = Math.max(mob.craftrasDodgeCharges || 0, 5);
        mob.craftrasDodgeReadyAt = 0;
        mob.craftrasNextGuardianSkillAt = Date.now();
        mob.craftrasNextLongDashAt = Date.now() + 1000;
        this.updateGuardianShieldVisual(mob, Date.now());
        return true;
    }

    tryGuardianDodge(mob, attacker, now = Date.now()) {
        if (!mob?.craftrasGuardian || !attacker) return false;
        this.updateGuardianDodgeCharges(mob, now);
        if ((mob.craftrasDodgeCharges || 0) <= 0) return false;
        mob.craftrasDodgeCharges--;
        const dx = mob.x - attacker.x;
        const dy = mob.y - attacker.y;
        const distance = Math.hypot(dx, dy) || 1;
        const place = this.getMonsterPlaceById(mob.craftrasSpawnPlaceId)
            || this.getMonsterPlaceById(mob.craftrasGuardianOwner?.craftrasSpawnPlaceId);
        const goal = this.findMobRetreatGoal(mob, attacker, {
            distanceBlocks: 4.5,
            place,
            placeMargin: 1,
        }) || { x: mob.x + dx / distance * BLOCK_SIZE * 4.5, y: mob.y + dy / distance * BLOCK_SIZE * 4.5 };
        mob.velocity.x += dx / distance * 84;
        mob.velocity.y += dy / distance * 84;
        mob.craftrasControl = {
            goal,
            target: { x: attacker.x - mob.x, y: attacker.y - mob.y },
            fire: false,
            power: 0,
        };
        mob.craftrasNextGuardianSkillAt = Math.max(now, (mob.craftrasNextGuardianSkillAt || now) - 5000);
        return true;
    }

    updateGuardianDodgeCharges(mob, now = Date.now()) {
        if (!mob?.craftrasGuardian) return;
        const maxCharges = mob.craftrasLastStandUsed ? 5 : 1;
        mob.craftrasDodgeCharges = Math.min(maxCharges, mob.craftrasDodgeCharges || 0);
        if (!mob.craftrasNextDodgeRechargeAt) mob.craftrasNextDodgeRechargeAt = now + CRAFTRAS_GUARDIAN_DODGE_RECHARGE;
        while (mob.craftrasDodgeCharges < maxCharges && now >= mob.craftrasNextDodgeRechargeAt) {
            mob.craftrasDodgeCharges++;
            mob.craftrasNextDodgeRechargeAt += CRAFTRAS_GUARDIAN_DODGE_RECHARGE;
        }
        if (mob.craftrasDodgeCharges >= maxCharges) mob.craftrasNextDodgeRechargeAt = now + CRAFTRAS_GUARDIAN_DODGE_RECHARGE;
    }

    getLivingGuardianForKing(king) {
        if (!king || king.isDead?.()) return null;
        for (const mob of this.mobs) {
            if (mob?.craftrasGuardian && mob.craftrasGuardianOwner === king && !mob.isDead?.()) return mob;
        }
        return null;
    }

    capKingDamageByGuardian(king, amount) {
        if (!king || king.craftrasMobType !== "king_zombie" || amount <= 0) return amount;
        return this.getLivingGuardianForKing(king)
            ? Math.min(amount, CRAFTRAS_KING_GUARDIAN_DAMAGE_CAP)
            : amount;
    }

    protectKingFromPlayer(king, attacker, now = Date.now()) {
        if (!attacker || attacker.isDead?.()) return false;
        if (!this.getLivingGuardianForKing(king)) {
            this.scheduleKingGuardianSpawn(king, 0);
        }
        const guardian = this.getLivingGuardianForKing(king);
        if (!guardian) return false;
        this.knightTargetBody = attacker;
        guardian.craftrasTarget = attacker;
        guardian.craftrasNextPathAt = 0;
        this.tryGuardianProtectiveSlash(guardian, attacker, now);
        if (now >= (guardian.craftrasGuardianBerserkReadyAt || Infinity)) this.startGuardianBerserk(guardian, attacker, now);
        return false;
    }

    startGuardianBerserk(mob, target, now = Date.now()) {
        if (!mob?.craftrasGuardian || !target || target.isDead?.()) return false;
        mob.craftrasGuardianBerserkUntil = now + CRAFTRAS_GUARDIAN_BERSERK_DURATION;
        mob.craftrasGuardianBerserkTarget = target;
        mob.craftrasNextGuardianSkillAt = now;
        mob.craftrasTarget = target;
        mob.craftrasNextPathAt = 0;
        this.startGuardianBerserkChase(mob, target, now);
        return true;
    }

    guardianBerserkActive(mob, now = Date.now()) {
        return !!(mob?.craftrasGuardian && mob.craftrasGuardianBerserkUntil && now < mob.craftrasGuardianBerserkUntil);
    }

    startGuardianBerserkChase(mob, target, now = Date.now()) {
        if (!mob || !target || target.isDead?.()) return false;
        mob.craftrasGuardianCombo = null;
        mob.craftrasGuardianLongDash = {
            startedAt: now,
            target,
            direction: null,
            hit: false,
            followUpSlashes: 0,
            remainingDashes: 1,
            quickChain: true,
            intercept: true,
            protectDash: false,
            berserkChase: true,
            damagedBlockKeys: new Set(),
        };
        return true;
    }

    findPlayerDamageSource(damageInflictor = [], damageTool = []) {
        const players = this.getLivingPlayers();
        for (const { body } of players) {
            if (damageInflictor.some(source => source === body || source?.master === body || source?.source === body)) return body;
            if (damageTool.some(tool => tool === body || tool?.master === body || tool?.source === body || tool?.master?.master === body)) return body;
        }
        return null;
    }

    guardianShieldBroken(mob, now = Date.now()) {
        if (!mob) return true;
        if (!mob.craftrasGuardianShieldPermanent && (mob.craftrasGuardianShieldBrokenUntil || 0) && now >= mob.craftrasGuardianShieldBrokenUntil) {
            mob.craftrasGuardianShieldDurability = 250;
            mob.craftrasGuardianShieldBrokenUntil = 0;
        }
        return !!mob.craftrasGuardianShieldPermanent || (mob.craftrasGuardianShieldBrokenUntil || 0) > now;
    }

    guardianIsAttacking(mob) {
        return !!(mob?.craftrasGuardianCombo || mob?.craftrasGuardianLongDash || mob?.craftrasSwordSwingStarted);
    }

    absorbGuardianShieldDamage(mob, amount, now = Date.now()) {
        if (!mob?.craftrasGuardian || amount <= 0 || this.guardianIsAttacking(mob)) return amount;
        if (this.guardianShieldBroken(mob, now)) return amount;
        const durability = Number.isFinite(mob.craftrasGuardianShieldDurability)
            ? mob.craftrasGuardianShieldDurability
            : 250;
        const absorbed = Math.min(durability, amount);
        mob.craftrasGuardianShieldDurability = durability - absorbed;
        if (mob.craftrasGuardianShieldDurability <= 0) {
            mob.craftrasGuardianShieldDurability = 0;
            mob.craftrasGuardianShieldBrokenUntil = now + 30_000;
        }
        this.updateGuardianShieldVisual(mob, now);
        return amount - absorbed;
    }

    updateGuardianShieldVisual(mob, now = Date.now()) {
        if (!mob?.craftrasGuardian) return;
        const broken = this.guardianShieldBroken(mob, now);
        const blocking = !broken && !this.guardianIsAttacking(mob);
        for (const turret of mob.turrets?.values?.() || []) {
            if (turret.label !== "Offhand Shield:knight_shield") continue;
            turret.alpha = broken ? 1 : 0;
            turret.bound.direction = broken ? 0.001 : 0;
            turret.bound.angle = blocking ? 0 : Math.PI;
        }
    }

    getGuardianComboLength(mob, now = Date.now()) {
        if (!mob?.craftrasGuardian) return 1;
        if (mob.craftrasLastStandUsed || mob.health.amount <= 1) return 4;
        const lowHealth = mob.health.amount <= mob.health.max * 0.5;
        const broken = this.guardianShieldBroken(mob, now);
        if (lowHealth && broken) return 3;
        if (lowHealth || broken) return 2;
        return 1;
    }

    damagePlayersInSlash(body, { toolSegments, damage, heldItem }) {
        if (!body || body.craftrasSpectator) return;
        if (body?.craftrasMobType === "builder" && body.craftrasBuilderJobMode === "demolish") return;
        body.craftrasCombatHitIds ??= new Set();
        const itemDamage = ITEMS[heldItem]?.damage;
        const multiplier = heldItem === "sword" || heldItem?.endsWith("_sword") ? 1 : 0.5;
        const effectiveDamage = Number.isFinite(itemDamage) ? itemDamage : damage * multiplier;

        for (const { body: target } of this.getLivingPlayers()) {
            if (!target || target === body || body.craftrasCombatHitIds.has(target.id)) continue;
            if (!this.toolSegmentsHitCircle(toolSegments, target)) continue;
            body.craftrasCombatHitIds.add(target.id);
            this.applyPlayerDamage(target, effectiveDamage, body);
        }
    }

    findUndergroundSpawn(players) {
        if (!players.length) return null;
        for (let attempt = 0; attempt < 80; attempt++) {
            const owner = players[Math.floor(Math.random() * players.length)].body;
            const center = worldToBlock(owner.x, owner.y);
            const angle = Math.random() * Math.PI * 2;
            const distance = 7 + Math.floor(Math.random() * 12);
            const x = center.x + Math.round(Math.cos(angle) * distance);
            const y = center.y + Math.round(Math.sin(angle) * distance);
            const cell = this.getCell(x, y);
            if (cell?.region !== "underground" || this.isMovementBlockingBlock(this.getBlock(x, y))) continue;
            const location = blockToWorld(x, y);
            if (players.some(({ body }) => (body.x - location.x) ** 2 + (body.y - location.y) ** 2 < (BLOCK_SIZE * 5) ** 2)) continue;
            if (this.placementOverlapsEntity(x, y)) continue;
            return location;
        }
        return null;
    }

    findNightSpawn(players) {
        if (!players.length) return null;
        for (let attempt = 0; attempt < 100; attempt++) {
            const owner = players[Math.floor(Math.random() * players.length)].body;
            const center = worldToBlock(owner.x, owner.y);
            const angle = Math.random() * Math.PI * 2;
            const distance = 7 + Math.floor(Math.random() * 12);
            const x = center.x + Math.round(Math.cos(angle) * distance);
            const y = center.y + Math.round(Math.sin(angle) * distance);
            const cell = this.getCell(x, y);
            if (!cell || this.getBlock(x, y) !== BLOCKS.AIR || cell.floor === FLOORS.WATER) continue;
            const location = blockToWorld(x, y);
            if (players.some(({ body }) => (body.x - location.x) ** 2 + (body.y - location.y) ** 2 < (BLOCK_SIZE * 5) ** 2)) continue;
            if (this.placementOverlapsEntity(x, y)) continue;
            return location;
        }
        return null;
    }

    findSurfaceAnimalSpawn(players) {
        if (!players.length) return null;
        for (let attempt = 0; attempt < 100; attempt++) {
            const owner = players[Math.floor(Math.random() * players.length)].body;
            const center = worldToBlock(owner.x, owner.y);
            const angle = Math.random() * Math.PI * 2;
            const distance = 8 + Math.floor(Math.random() * 11);
            const x = center.x + Math.round(Math.cos(angle) * distance);
            const y = center.y + Math.round(Math.sin(angle) * distance);
            const cell = this.getCell(x, y);
            if (this.isInsideVillageNatureClearZone(x, y) || isBrokenKingdomSurfaceCell(x, y)) continue;
            if (cell?.region !== "surface" || cell.floor === FLOORS.WATER || this.getBlock(x, y) !== BLOCKS.AIR) continue;
            const location = blockToWorld(x, y);
            if (players.some(({ body }) => (body.x - location.x) ** 2 + (body.y - location.y) ** 2 < (BLOCK_SIZE * 5) ** 2)) continue;
            if (this.placementOverlapsEntity(x, y)) continue;
            return { x, y, location };
        }
        return null;
    }

    spawnAnimalGroup(players) {
        const center = this.findSurfaceAnimalSpawn(players);
        if (!center) return 0;
        const roll = Math.random();
        const type = roll < 1 / 3 ? "cow" : roll < 2 / 3 ? "pig" : "chicken";
        const min = type === "cow" ? 1 : type === "pig" ? 2 : 3;
        const max = type === "cow" ? 2 : type === "pig" ? 3 : 4;
        const count = min + Math.floor(Math.random() * (max - min + 1));
        let spawned = 0;
        for (let i = 0; i < count; i++) {
            let location = i === 0 ? center.location : null;
            for (let attempt = 0; !location && attempt < 16; attempt++) {
                const x = center.x + Math.floor(Math.random() * 5) - 2;
                const y = center.y + Math.floor(Math.random() * 5) - 2;
                const cell = this.getCell(x, y);
                if (this.isInsideVillageNatureClearZone(x, y) || isBrokenKingdomSurfaceCell(x, y)) continue;
                if (cell?.region !== "surface" || cell.floor === FLOORS.WATER || this.getBlock(x, y) !== BLOCKS.AIR) continue;
                location = blockToWorld(x, y);
            }
            if (location && this.spawnMobAt(location, type)) spawned++;
        }
        return spawned;
    }

    spawnMob(players, mode = null) {
        const night = mode === "night" || (mode == null && this.getDayPhase() === "night");
        const location = night ? this.findNightSpawn(players) : this.findUndergroundSpawn(players);
        if (!location) return null;
        const roll = Math.random();
        if (night) return this.spawnMobAt(location, roll < 0.45 ? this.getZombieVariant()
            : roll < 0.70 ? "skeleton"
                : roll < 0.88 ? "creeper"
                    : "spider");
        return this.spawnMobAt(location, roll < 0.58 ? this.getZombieVariant()
            : roll < 0.80 ? this.getSkeletonVariant()
                : "creeper");
    }

    spawnOutsideBoss(type, options = {}) {
        const requestedType = type === "annihilator" && !options.direct && Math.random() < 0.02 ? "the_nuclear" : type;
        const location = this.getRandomOutsideSpawn();
        const mob = this.spawnMobAt(location, requestedType, { outsideBoss: true });
        if (!mob) return null;
        const block = worldToBlock(location.x, location.y);
        const label = requestedType === "the_nuclear" ? "The Nuclear" : requestedType === "annihilator" ? "Annihilator" : mob.name || requestedType;
        const message = requestedType === "the_nuclear"
            ? `${label} has appeared outside at X ${block.x}, Y ${block.y}!`
            : `${label} has appeared outside!`;
        for (const socket of this.gameManager.clients) {
            if (requestedType === "the_nuclear") socket?.talk?.("BM", Config.popup_message_duration, message, "#ff3030");
            else socket?.talk?.("BM", Config.popup_message_duration, message);
        }
        return mob;
    }

    spawnMobAt(location, type, options = {}) {
        const variant = typeof type === "object" && type ? type : this.getExplicitMobVariant(type);
        const mobType = variant?.type || type;
        if (!location || !MOB_TYPES.has(mobType)) return null;
        if (ANIMAL_TYPES.has(mobType)) {
            const cell = worldToBlock(location.x, location.y);
            if (isBrokenKingdomSurfaceCell(cell.x, cell.y)) return null;
        }
        const mob = new Entity(location);
        mob.define(MOB_CLASS_NAMES[mobType]);
        if (variant) this.applyMobVariantDefinition(mob, variant);
        if (variant?.label) mob.name = variant.label;
        mob.craftrasBaseName = mob.name || mob.label;
        mob.craftrasMobType = variant?.scoreType || mobType;
        mob.craftrasMobFamily = NPC_TYPES.has(mobType) ? "npc" : ANIMAL_TYPES.has(mobType) ? "animal" : mobType.includes("zombie") || mobType === "king_guardian" ? "zombie" : mobType.includes("skeleton") ? "skeleton" : mobType.includes("spider") ? "spider" : mobType;
        mob.team = mob.craftrasMobFamily === "npc" ? TEAM_ROOM : TEAM_ENEMIES;
        mob.craftrasSpawnPlaceId = options.placeId || null;
        mob.craftrasFixedNpc = !!options.fixed;
        mob.craftrasHome = options.fixed ? { x: location.x, y: location.y } : null;
        mob.craftrasInvulnerableNpc = NPC_TYPES.has(mobType) && !VILLAGE_COMBAT_NPC_TYPES.has(mobType) && mobType !== "challenge_king" && mobType !== "royal_guardian";
        mob.craftrasNpcWanderRadius = VILLAGE_NPC_MAX_HOME_DISTANCE;
        mob.craftrasSwordZombie = !!variant?.sword || type === "iron_sword_zombie";
        mob.craftrasSwordDamage = variant?.swordDamage || (type === "iron_sword_zombie" ? 40 : 0);
        mob.craftrasHelmetMaterial = variant?.helmet || null;
        mob.craftrasSwordMaterial = variant?.sword || (type === "iron_sword_zombie" ? "iron" : null);
        mob.craftrasContactDamage = variant?.contactDamage ?? (ANIMAL_TYPES.has(mobType) || NPC_TYPES.has(mobType) ? 0 : mobType === "giant_zombie" ? 30 : mobType === "toxic_spider" ? 20 : 20);
        mob.craftrasScoreMultiplier = variant?.scoreMultiplier || 1;
        mob.craftrasNoKnockback = !!variant?.noKnockback || NPC_TYPES.has(mobType);
        mob.craftrasPoisonOnHit = mobType === "toxic_spider" || mobType === "queen_spider";
        mob.craftrasQueenSpider = mobType === "queen_spider";
        if (mobType === "the_nuclear") {
            const now = Date.now();
            mob.craftrasFuseStarted = now;
            mob.craftrasFuseDuration = CRAFTRAS_NUCLEAR_FUSE;
            mob.craftrasSpawnSize = 72;
            mob.craftrasFinalSize = 480;
            mob.craftrasNextFlashAt = now;
            mob.alwaysActive = true;
            mob.alwaysShowOnMinimap = true;
            mob.minimapColor = "#ff3030";
            mob.craftrasMinimapType = "nuclear";
        }
        if (mob.craftrasQueenSpider) {
            mob.craftrasNextChargeAt = Date.now() + 2500;
            mob.craftrasNextEggAt = Date.now() + 5000;
            mob.craftrasNextWebAt = Date.now() + 3500;
            mob.craftrasNextClawAt = Date.now() + 1200;
            mob.craftrasQueenHalfSummoned = false;
        }
        if (mobType === "runner_zombie") mob.craftrasNoAttackKnockback = true;
        if (mobType === "magical_zombie") {
            mob.craftrasFinalDashPhasing = true;
            mob.craftrasSunImmune = true;
        }
        mob.craftrasGuardian = mobType === "king_guardian";
        if (mob.craftrasGuardian) {
            mob.craftrasDodgeReadyAt = 0;
            mob.craftrasDodgeCharges = 1;
            mob.craftrasNextDodgeRechargeAt = Date.now() + CRAFTRAS_GUARDIAN_DODGE_RECHARGE;
            mob.craftrasNextGuardianSkillAt = Date.now();
            mob.craftrasNextLongDashAt = Date.now() + 4000;
            mob.craftrasGuardianShieldDurability = 250;
            mob.craftrasGuardianShieldBrokenUntil = 0;
            mob.craftrasGuardianShieldPermanent = false;
            mob.craftrasNextProtectSlashAt = 0;
            mob.craftrasNextProtectSlashProjectileAt = 0;
            mob.craftrasGuardianBerserkUntil = 0;
            mob.craftrasGuardianBerserkTarget = null;
            mob.craftrasGuardianBerserkReadyAt = Infinity;
        }
        mob.craftrasBaseColor = mob.color.base;
        mob.craftrasControl = {
            goal: { x: mob.x, y: mob.y },
            target: { x: 1, y: 0 },
            fire: false,
            power: 0,
        };
        mob.controllers = [{
            acceptsFromTop: true,
            think: () => mob.craftrasControl,
        }];
        const maxHealth = variant?.health || MOB_HEALTH[mobType] || 100;
        const appliedMaxHealth = mobType === "the_nuclear" ? 10000 + this.getLivingPlayers().length * 1000 : maxHealth;
        mob.health.set(appliedMaxHealth);
        mob.health.amount = appliedMaxHealth;
        mob.shield.set(0, 0);
        mob.skill.points = 0;
        if (mob.craftrasMobFamily === "skeleton") {
            mob.craftrasSkeletonBulletDamage = mobType === "sniper_skeleton" ? 60 : mobType === "cannon_skeleton" ? 90 : 20;
            mob.craftrasSkeletonApproachRange = BLOCK_SIZE * (mobType === "sniper_skeleton" ? 22 : 11);
            mob.craftrasSkeletonRetreatRange = BLOCK_SIZE * (mobType === "sniper_skeleton" ? 14 : 7);
            mob.craftrasSkeletonNoRetreat = mobType === "cannon_skeleton";
        }
        if (mobType === "sword_guy") {
            mob.craftrasSkeletonApproachRange = BLOCK_SIZE * 24;
            mob.craftrasSkeletonRetreatRange = 0;
            mob.craftrasSwordGuyHostile = false;
            mob.craftrasSwordGuyPhase = 1;
            mob.craftrasSwordGuyArenaCenter = { x: location.x, y: location.y };
            mob.on("damage", ({ damageInflictor = [], damageTool = [] } = {}) => {
                const now = Date.now();
                const received = Math.max(1, Number(mob.damageReceived) || 0);
                const attacker = this.findPlayerDamageSource(damageInflictor, damageTool);
                if (mob.craftrasSwordGuyPhase === "intro" || mob.craftrasSwordGuyPhase === "recovering") {
                    mob.damageReceived = 0;
                    mob.health.amount = Math.max(1, mob.health.amount || 1);
                    mob.readyToDie = false;
                    return;
                }
                if (mob.craftrasSwordGuyPhase === 1 && mob.health.amount - received <= 0) {
                    mob.damageReceived = 0;
                    this.startSwordGuyPhaseTwoIntro(mob, attacker, now);
                    return;
                }
                this.handleSwordGuyDamaged(mob, received, attacker, now);
            });
        }
        if (mob.craftrasInvulnerableNpc) {
            mob.on("damage", () => {
                mob.damageReceived = 0;
                mob.health.amount = mob.health.max;
            });
        }
        if (mob.craftrasMobFamily !== "npc") {
            mob.on("damage", ({ damageInflictor = [], damageTool = [] }) => {
                const attacker = this.findPlayerDamageSource(damageInflictor, damageTool);
                if (attacker) this.setMobAggro(mob, attacker);
            });
        }
        if (mobType === "king_zombie" || mob.craftrasGuardian) {
            mob.on("damage", ({ damageInflictor = [], damageTool = [] }) => {
                const now = Date.now();
                const attacker = this.findPlayerDamageSource(damageInflictor, damageTool);
                if (mobType === "king_zombie" && attacker && this.protectKingFromPlayer(mob, attacker)) {
                    mob.damageReceived = 0;
                    return;
                }
                if (mobType === "king_zombie") mob.damageReceived = this.capKingDamageByGuardian(mob, mob.damageReceived);
                if (!mob.craftrasGuardian || mob.damageReceived <= 0) return;
                mob.damageReceived = this.absorbGuardianShieldDamage(mob, mob.damageReceived);
                if (mob.damageReceived > 0 && this.tryGuardianLastStand(mob, mob.damageReceived)) mob.damageReceived = 0;
            });
        }
        mob.on("dead", () => {
            this.spawnMobDeathEffect(mob);
            this.dropMobLoot(mob, mobType);
            this.mobs.delete(mob);
            if (mobType === "king_zombie") {
                this.knightTargetBody = null;
                for (const entry of this.pendingGuardianSpawns) {
                    if (entry.king === mob) this.pendingGuardianSpawns.delete(entry);
                }
                for (const guardian of this.mobs) {
                    if (!guardian?.craftrasGuardian || guardian.craftrasGuardianOwner !== mob || guardian.isDead?.()) continue;
                    this.dropMobLoot(guardian, guardian.craftrasMobType || "king_guardian");
                    guardian.craftrasGuardianOwner = null;
                    guardian.kill?.();
                }
            }
            if (mobType === "king_guardian") {
                const owner = mob.craftrasGuardianOwner;
                if (owner && !owner.isDead?.()) this.scheduleKingGuardianSpawn(owner, 60_000);
            }
        });
        this.mobs.add(mob);
        return mob;
    }

    updateMobSunlight(mob, now) {
        if (this.weatherType === "rain" || mob.craftrasSunImmune || mob.craftrasSwordGuyPhase === 2) {
            mob.craftrasBurning = false;
            mob.craftrasNextSunDamageAt = 0;
            if (mob.craftrasBaseName) mob.name = mob.craftrasBaseName;
            return;
        }
        const block = worldToBlock(mob.x, mob.y);
        const onSurface = this.getCell(block.x, block.y)?.region === "surface";
        const burnable = mob.craftrasMobFamily === "zombie" || mob.craftrasMobFamily === "skeleton";
        const phase = this.getDayPhase();
        const burning = burnable && onSurface && (phase === "morning" || phase === "afternoon");
        mob.craftrasBurning = burning;
        mob.name = burning ? `[FIRE] ${mob.craftrasBaseName}` : mob.craftrasBaseName;
        if (phase === "night") {
            mob.craftrasNextSunDamageAt = 0;
            return;
        }
        if (!burning || now < (mob.craftrasNextSunDamageAt || 0)) return;
        mob.craftrasNextSunDamageAt = now + 1000;
        mob.damageReceived += 10;
    }

    scheduleKingGuardianSpawn(king, delay = 60_000) {
        if (!king) return;
        if ([...this.mobs].some(mob => mob?.craftrasMobType === "king_guardian" && mob.craftrasGuardianOwner === king && !mob.isDead?.())) return;
        if ([...this.pendingGuardianSpawns].some(entry => entry.king === king)) return;
        this.pendingGuardianSpawns.add({
            x: king.x,
            y: king.y,
            king,
            dueAt: Date.now() + delay,
            effectAt: 0,
            location: null,
        });
    }

    findGuardianSpawnNear(location) {
        const center = worldToBlock(location.x, location.y);
        for (let attempt = 0; attempt < 80; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 2 + Math.random() * 6;
            const x = center.x + Math.round(Math.cos(angle) * distance);
            const y = center.y + Math.round(Math.sin(angle) * distance);
            if (this.getCell(x, y)?.region !== "underground" || this.getBlock(x, y) !== BLOCKS.AIR) continue;
            const spawn = blockToWorld(x, y);
            if (this.placementOverlapsEntity(x, y)) continue;
            return spawn;
        }
        return this.getBlock(center.x, center.y) === BLOCKS.AIR ? blockToWorld(center.x, center.y) : null;
    }

    updatePendingGuardianSpawns(now) {
        for (const entry of this.pendingGuardianSpawns) {
            if (!entry.king || entry.king.isDead?.()) {
                this.pendingGuardianSpawns.delete(entry);
                continue;
            }
            if (now < entry.dueAt) continue;
            if (!entry.effectAt) {
                entry.x = entry.king.x;
                entry.y = entry.king.y;
                entry.location = this.findGuardianSpawnNear(entry.king) || { x: entry.king.x, y: entry.king.y };
                this.spawnExplosionEffect(entry.location, { duration: 1200, startSize: 12, growth: 0.22, color: "#f5df5f", alpha: 0.55 });
                entry.effectAt = now;
                continue;
            }
            if (now - entry.effectAt < 1100) continue;
            const guardian = this.spawnMobAt(entry.location, "king_guardian", { placeId: entry.king.craftrasSpawnPlaceId || null });
            if (guardian) {
                guardian.craftrasGuardianOwner = entry.king;
                guardian.craftrasGuardianBerserkReadyAt = now + CRAFTRAS_GUARDIAN_BERSERK_ARM_DELAY;
            }
            this.pendingGuardianSpawns.delete(entry);
        }
    }

    applyMobVariantDefinition(mob, variant) {
        const turrets = [];
        if (variant.helmet) {
            turrets.push({
                POSITION: [7, 0, 0, 0, 360, 2],
                TYPE: variant.helmet === "zombie_crown"
                    ? "craftrasHelmetCrown"
                    : variant.helmet === "diamond" ? "craftrasHelmetSide" : "craftrasHelmetFront",
            });
        }
        if (variant.sword) {
            turrets.push({
                POSITION: [0.001, 6.64, 4.82, -35, 360, 1],
                TYPE: variant.sword === "diamond"
                    ? "craftrasHeldDiamondSword"
                    : variant.sword === "stone" ? "craftrasHeldStoneSword" : "craftrasHeldIronSword",
            });
        }
        if (variant.shield) {
            turrets.push({
                POSITION: [7, 10, 0, 180, 360, 1],
                TYPE: "craftrasOffhandKnightShield",
            });
        }
        mob.define({
            LABEL: variant.label || mob.label,
            ...(turrets.length ? { TURRETS: turrets } : {}),
        });
    }

    nearestPlayer(mob, players) {
        let nearest = null;
        let best = Infinity;
        for (const { body } of players) {
            const distanceSquared = (body.x - mob.x) ** 2 + (body.y - mob.y) ** 2;
            if (distanceSquared < best) {
                best = distanceSquared;
                nearest = body;
            }
        }
        return nearest ? { body: nearest, distance: Math.sqrt(best) } : null;
    }

    hasLineOfSight(from, to) {
        const start = worldToBlock(from.x, from.y);
        const end = worldToBlock(to.x, to.y);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        if (!steps) return true;
        for (let step = 1; step < steps; step++) {
            const x = Math.round(start.x + dx * step / steps);
            const y = Math.round(start.y + dy * step / steps);
            if (this.isMovementBlockingBlockForEntity(this.getBlock(x, y), from)) return false;
        }
        return true;
    }

    findMobPath(mob, target) {
        const start = worldToBlock(mob.x, mob.y);
        const goal = worldToBlock(target.x, target.y);
        if (start.x === goal.x && start.y === goal.y) return [];

        const margin = 20;
        const minX = Math.min(start.x, goal.x) - margin;
        const maxX = Math.max(start.x, goal.x) + margin;
        const minY = Math.min(start.y, goal.y) - margin;
        const maxY = Math.max(start.y, goal.y) + margin;
        const key = (x, y) => `${x},${y}`;
        const heuristic = (x, y) => {
            const dx = Math.abs(goal.x - x);
            const dy = Math.abs(goal.y - y);
            return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
        };
        const open = [{ x: start.x, y: start.y, g: 0, f: heuristic(start.x, start.y) }];
        const bestCost = new Map([[key(start.x, start.y), 0]]);
        const parents = new Map();
        let visited = 0;

        while (open.length && visited++ < 2500) {
            let bestIndex = 0;
            for (let index = 1; index < open.length; index++) if (open[index].f < open[bestIndex].f) bestIndex = index;
            const current = open.splice(bestIndex, 1)[0];
            if (current.x === goal.x && current.y === goal.y) {
                const path = [];
                let cursor = key(goal.x, goal.y);
                const startKey = key(start.x, start.y);
                while (cursor !== startKey) {
                    const [x, y] = cursor.split(",").map(Number);
                    path.push({ x, y });
                    cursor = parents.get(cursor);
                    if (!cursor) return null;
                }
                path.reverse();
                return path;
            }

            for (const [offsetX, offsetY] of [
                [1, 0], [-1, 0], [0, 1], [0, -1],
                [1, 1], [1, -1], [-1, 1], [-1, -1],
            ]) {
                const x = current.x + offsetX;
                const y = current.y + offsetY;
                if (x < minX || x > maxX || y < minY || y > maxY) continue;
                if ((x !== goal.x || y !== goal.y) && this.isMovementBlockingBlockForEntity(this.getBlock(x, y), mob)) continue;
                if (offsetX && offsetY) {
                    const horizontalBlocked = this.isMovementBlockingBlockForEntity(this.getBlock(current.x + offsetX, current.y), mob);
                    const verticalBlocked = this.isMovementBlockingBlockForEntity(this.getBlock(current.x, current.y + offsetY), mob);
                    if (horizontalBlocked || verticalBlocked) continue;
                }
                const nextKey = key(x, y);
                const nextCost = current.g + (offsetX && offsetY ? Math.SQRT2 : 1);
                if (nextCost >= (bestCost.get(nextKey) ?? Infinity)) continue;
                bestCost.set(nextKey, nextCost);
                parents.set(nextKey, key(current.x, current.y));
                open.push({ x, y, g: nextCost, f: nextCost + heuristic(x, y) });
            }
        }
        return null;
    }

    clearMobAggro(mob) {
        mob.craftrasTarget = null;
        mob.craftrasAggroTarget = null;
        mob.craftrasAggroUntil = 0;
        mob.craftrasPath = null;
        mob.craftrasPathIndex = 0;
        mob.craftrasControl = {
            goal: { x: mob.x, y: mob.y },
            target: { x: Math.cos(mob.facing || 0), y: Math.sin(mob.facing || 0) },
            fire: false,
            power: 0,
        };
        if (mob.craftrasMobType === "creeper") {
            mob.craftrasPrimeStarted = 0;
            mob.SIZE = 24;
            mob.coreSize = 24;
            mob.sizeMultiplier = 1;
            mob.color.base = mob.craftrasBaseColor;
            mob.alpha = 1;
        }
    }

    isValidMobAggroTarget(mob, target, players = null, now = Date.now()) {
        if (!mob || !target || target.isDead?.()) return false;
        if ((mob.craftrasAggroUntil || 0) && now > mob.craftrasAggroUntil) return false;
        if (target.craftrasMobFamily === "npc") {
            return VILLAGE_COMBAT_NPC_TYPES.has(target.craftrasMobType) && this.isInsideVillageGuardZone(target) && this.isInsideVillageGuardZone(mob);
        }
        if (!players) return true;
        return players.some(({ body }) => body === target && !body?.isDead?.());
    }

    setMobAggro(mob, target, now = Date.now(), duration = 20_000) {
        if (!mob || !target || mob.isDead?.() || target.isDead?.() || mob.craftrasMobFamily === "npc" || mob.craftrasMobFamily === "animal") return false;
        if (target.craftrasMobFamily === "npc" && !VILLAGE_COMBAT_NPC_TYPES.has(target.craftrasMobType)) return false;
        if (target.craftrasMobFamily === "npc" && (!this.isInsideVillageGuardZone(target) || !this.isInsideVillageGuardZone(mob))) return false;
        if (this.isValidGreatFriendMonsterTarget?.(mob) && this.findSocketByBody(target)) {
            target.craftrasGreatFriendPreferredTarget = mob;
            target.craftrasGreatFriendPreferredTargetAt = now;
        }
        mob.craftrasAggroTarget = target;
        mob.craftrasAggroUntil = now + duration;
        if (mob.craftrasTarget !== target) {
            mob.craftrasTarget = target;
            mob.craftrasNextPathAt = 0;
            mob.craftrasPath = null;
            mob.craftrasPathIndex = 0;
        }
        return true;
    }

    chooseMobWanderPath(mob, now) {
        const center = worldToBlock(mob.x, mob.y);
        mob.craftrasWanderPath = null;
        mob.craftrasWanderPathIndex = 0;

        for (let attempt = 0; attempt < 24; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 4 + Math.floor(Math.random() * 8);
            const x = center.x + Math.round(Math.cos(angle) * distance);
            const y = center.y + Math.round(Math.sin(angle) * distance);
            if (this.getCell(x, y)?.region !== "underground" || this.getBlock(x, y) !== BLOCKS.AIR) continue;
            const destination = blockToWorld(x, y);
            const path = this.findMobPath(mob, destination);
            if (!path?.length) continue;
            mob.craftrasWanderPath = path;
            mob.craftrasWanderPathIndex = 0;
            mob.craftrasNextWanderAt = now + 4000 + Math.random() * 4000;
            return true;
        }

        mob.craftrasNextWanderAt = now + 1000 + Math.random() * 1500;
        return false;
    }

    chooseNpcWanderPath(mob, now, home) {
        const homeCell = worldToBlock(home.x, home.y);
        const radius = mob.craftrasMobType === "blesser" || mob.craftrasMobType === "monster_merchant" ? 2 : mob.craftrasNpcWanderRadius || VILLAGE_NPC_MAX_HOME_DISTANCE;
        const villageCombatNpc = VILLAGE_COMBAT_NPC_TYPES.has(mob.craftrasMobType);
        const bounds = villageCombatNpc ? this.villageBounds : null;
        mob.craftrasWanderPath = null;
        mob.craftrasWanderPathIndex = 0;

        for (let attempt = 0; attempt < 32; attempt++) {
            const x = bounds
                ? bounds.minX - VILLAGE_GUARD_ZONE_PADDING + Math.floor(Math.random() * (bounds.maxX - bounds.minX + 1 + VILLAGE_GUARD_ZONE_PADDING * 2))
                : homeCell.x + Math.floor(Math.random() * (radius * 2 + 1)) - radius;
            const y = bounds
                ? bounds.minY - VILLAGE_GUARD_ZONE_PADDING + Math.floor(Math.random() * (bounds.maxY - bounds.minY + 1 + VILLAGE_GUARD_ZONE_PADDING * 2))
                : homeCell.y + Math.floor(Math.random() * (radius * 2 + 1)) - radius;
            if (villageCombatNpc && !this.isInsideVillageGuardZone(x, y)) continue;
            if (this.getBlock(x, y) !== BLOCKS.AIR) continue;
            const destination = blockToWorld(x, y);
            const path = this.findMobPath(mob, destination);
            if (!path?.length) continue;
            if (villageCombatNpc) {
                if (!path.every(point => this.isInsideVillageGuardZone(point.x, point.y))) continue;
            } else if (!path.every(point => Math.abs(point.x - homeCell.x) <= radius && Math.abs(point.y - homeCell.y) <= radius)) continue;
            mob.craftrasWanderPath = path;
            mob.craftrasWanderPathIndex = 0;
            mob.craftrasNextWanderAt = now + 3500 + Math.random() * 4500;
            return true;
        }

        mob.craftrasNextWanderAt = now + 1200 + Math.random() * 1800;
        return false;
    }

    updateNpcWander(mob, now, home) {
        if (mob.craftrasMobType === "pope") {
            mob.craftrasWanderPath = null;
            mob.craftrasWanderPathIndex = 0;
            mob.craftrasNextWanderAt = now + 1000;
            mob.x = home.x;
            mob.y = home.y;
            mob.velocity.x = 0;
            mob.velocity.y = 0;
            if (mob.accel) {
                mob.accel.x = 0;
                mob.accel.y = 0;
            }
            mob.craftrasControl = {
                goal: { x: home.x, y: home.y },
                target: { x: Math.cos(mob.facing || 0), y: Math.sin(mob.facing || 0) },
                fire: false,
                power: 0,
            };
            return;
        }
        const homeCell = worldToBlock(home.x, home.y);
        const radius = mob.craftrasMobType === "blesser" || mob.craftrasMobType === "monster_merchant" ? 2 : mob.craftrasNpcWanderRadius || VILLAGE_NPC_MAX_HOME_DISTANCE;
        const villageCombatNpc = VILLAGE_COMBAT_NPC_TYPES.has(mob.craftrasMobType);
        let path = mob.craftrasWanderPath;
        let index = mob.craftrasWanderPathIndex || 0;
        if (!path?.length || index >= path.length) {
            if (now < (mob.craftrasNextWanderAt || 0)) return;
            if (!this.chooseNpcWanderPath(mob, now, home)) return;
            path = mob.craftrasWanderPath;
            index = 0;
        } else if (now >= (mob.craftrasNextWanderAt || 0)) {
            if (!this.chooseNpcWanderPath(mob, now, home)) return;
            path = mob.craftrasWanderPath;
            index = 0;
        }

        let waypoint = path[index];
        if (villageCombatNpc ? !this.isInsideVillageGuardZone(waypoint.x, waypoint.y) : Math.abs(waypoint.x - homeCell.x) > radius || Math.abs(waypoint.y - homeCell.y) > radius) {
            mob.craftrasWanderPath = null;
            mob.craftrasWanderPathIndex = 0;
            return;
        }
        let worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        if (Math.hypot(worldWaypoint.x - mob.x, worldWaypoint.y - mob.y) < BLOCK_SIZE * 0.28) {
            index++;
            mob.craftrasWanderPathIndex = index;
            if (index >= path.length) {
                mob.craftrasWanderPath = null;
                mob.craftrasNextWanderAt = now + 900 + Math.random() * 1600;
                mob.craftrasControl = {
                    goal: { x: mob.x, y: mob.y },
                    target: { x: Math.cos(mob.facing || 0), y: Math.sin(mob.facing || 0) },
                    fire: false,
                    power: 0,
                };
                return;
            }
            waypoint = path[index];
            worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        }

        mob.craftrasControl = {
            goal: { x: worldWaypoint.x, y: worldWaypoint.y },
            target: { x: worldWaypoint.x - mob.x, y: worldWaypoint.y - mob.y },
            fire: false,
            power: 0.45,
        };
    }

    isClericHealTarget(target) {
        if (!target || target.isDead?.() || !target.health || target.health.max <= 0) return false;
        if (target.craftrasMobFamily === "npc") {
            if (!VILLAGE_CLERIC_NPC_HEAL_TARGET_TYPES.has(target.craftrasMobType)) return false;
            if (!this.isInsideVillageGuardZone(target)) return false;
        } else if (!target.isPlayer) return false;
        return target.health.amount > 0 && target.health.amount < target.health.max - 0.5;
    }

    findNearestCleric(location) {
        if (!location) return null;
        let best = null;
        let bestDistance = Infinity;
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || mob.craftrasMobType !== "cleric") continue;
            const distanceSquared = (mob.x - location.x) ** 2 + (mob.y - location.y) ** 2;
            if (distanceSquared >= bestDistance) continue;
            best = mob;
            bestDistance = distanceSquared;
        }
        return best;
    }

    findClericHealTarget(cleric, players, now) {
        let best = null;
        let bestScore = Infinity;
        const consider = target => {
            if (!this.isClericHealTarget(target)) return;
            if (target.craftrasClericHealUntil > now) return;
            const distance = Math.hypot(target.x - cleric.x, target.y - cleric.y);
            if (distance > VILLAGE_CLERIC_HEAL_RANGE) return;
            const missingRatio = 1 - target.health.amount / target.health.max;
            const score = distance / BLOCK_SIZE - missingRatio * 12;
            if (score >= bestScore) return;
            best = target;
            bestScore = score;
        };
        for (const mob of this.mobs) consider(mob);
        for (const { body } of players) consider(body);
        return best;
    }

    setClericStaffPose(cleric, angleDegrees, size = 1, offset = 0.86) {
        for (const turret of cleric.turrets?.values?.() || []) {
            if (turret.label !== "Craftras Cleric Staff") continue;
            turret.alpha = 1;
            turret.bound.angle = angleDegrees * Math.PI / 180;
            turret.bound.direction = 0;
            turret.bound.offset = offset;
            turret.bound.size = size;
        }
    }

    setClericStaffCastPose(cleric, now) {
        const started = cleric.craftrasClericCastStarted || now;
        const until = cleric.craftrasClericCastUntil || now;
        const progress = Math.max(0, Math.min(1, (now - started) / Math.max(1, until - started)));
        if (progress < 0.35) {
            const motion = 1 - (1 - progress / 0.35) ** 3;
            this.setClericStaffPose(
                cleric,
                -45 + (68 + 45) * motion,
                1 + (1.28 - 1) * motion,
                0.86 + (1.05 - 0.86) * motion,
            );
            return;
        }
        const hold = Math.min(1, Math.max(0, (progress - 0.35) / 0.65));
        const shake = Math.sin(hold * Math.PI * 4) * 18;
        const pulse = Math.sin(hold * Math.PI * 2.5) * 0.04;
        this.setClericStaffPose(cleric, 68 + shake, 1.28 + pulse, 1.05 + pulse);
    }

    ensureClericHealCircle(target, now) {
        let circle = target.craftrasClericHealCircle;
        if (!circle || circle.isDead?.()) {
            circle = new Entity({ x: target.x, y: target.y });
            circle.define("craftrasClericHealCircle");
            circle.team = target.team ?? TEAM_ROOM;
            this.clericHealCircles.add(circle);
            target.craftrasClericHealCircle = circle;
        }
        circle.craftrasClericHealTarget = target;
        circle.craftrasClericHealStarted = now;
        return circle;
    }

    startClericHeal(cleric, target, now) {
        if (!this.isClericHealTarget(target)) return false;
        target.craftrasClericHealUntil = now + VILLAGE_CLERIC_HEAL_DURATION;
        target.craftrasNextClericHealAt = now + VILLAGE_CLERIC_HEAL_INTERVAL;
        target.craftrasClericHealFlatAmount = 0;
        this.ensureClericHealCircle(target, now);
        cleric.craftrasClericCastStarted = now;
        cleric.craftrasClericCastUntil = now + 900;
        cleric.craftrasClericCastTarget = target;
        cleric.craftrasNextClericHealCastAt = now + 1400;
        this.setClericStaffCastPose(cleric, now);
        return true;
    }

    updateClericHealCircles(now) {
        for (const circle of this.clericHealCircles) {
            const target = circle?.craftrasClericHealTarget;
            if (!circle || circle.isDead?.() || !target || target.isDead?.() || now >= (target.craftrasClericHealUntil || 0)) {
                if (target?.craftrasClericHealCircle === circle) {
                    target.craftrasClericHealCircle = null;
                    target.craftrasClericHealUntil = 0;
                    target.craftrasClericHealFlatAmount = 0;
                    target.craftrasClericHealRatio = 0;
                    target.craftrasClericHealInterval = 0;
                    target.craftrasClericHealStopsAtFull = false;
                }
                circle?.destroy?.();
                this.clericHealCircles.delete(circle);
                continue;
            }
            circle.x = target.x;
            circle.y = target.y;
            const elapsed = now - (circle.craftrasClericHealStarted || now);
            circle.facing = elapsed / 1000 * 90 * Math.PI / 180;
            circle.SIZE = Math.max(34, (target.size || 20) * 1.9);
            circle.coreSize = circle.SIZE;
            circle.sizeMultiplier = 1;
            circle.alpha = 1;
            if (target.health && now >= (target.craftrasNextClericHealAt || 0)) {
                target.craftrasNextClericHealAt = now + (target.craftrasClericHealInterval || VILLAGE_CLERIC_HEAL_INTERVAL);
                const flatHeal = Math.max(0, Number(target.craftrasClericHealFlatAmount) || 0);
                const ratioHeal = Math.max(0, Number(target.craftrasClericHealRatio) || 0);
                const healAmount = flatHeal || target.health.max * (ratioHeal || VILLAGE_CLERIC_HEAL_RATE);
                target.health.amount = Math.min(target.health.max, target.health.amount + healAmount);
                if (target.craftrasClericHealStopsAtFull && target.health.amount >= target.health.max - 0.5) {
                    target.craftrasClericHealUntil = 0;
                    target.craftrasClericHealFlatAmount = 0;
                    target.craftrasClericHealRatio = 0;
                    target.craftrasClericHealInterval = 0;
                    target.craftrasClericHealStopsAtFull = false;
                }
            }
        }
    }

    updateVillageCleric(cleric, players, now, home) {
        const castTarget = cleric.craftrasClericCastTarget;
        if (now < (cleric.craftrasClericCastUntil || 0) && castTarget && !castTarget.isDead?.()) {
            cleric.craftrasControl = {
                goal: { x: cleric.x, y: cleric.y },
                target: { x: castTarget.x - cleric.x, y: castTarget.y - cleric.y },
                fire: true,
                power: 0,
            };
            this.setClericStaffCastPose(cleric, now);
            return true;
        }
        this.setClericStaffPose(cleric, -45, 1);
        if (now < (cleric.craftrasNextClericHealCastAt || 0)) return false;
        const target = this.findClericHealTarget(cleric, players, now);
        if (!target) return false;
        const distance = Math.hypot(target.x - cleric.x, target.y - cleric.y);
        if (distance <= VILLAGE_CLERIC_CAST_RANGE) {
            this.startClericHeal(cleric, target, now);
            cleric.craftrasControl = {
                goal: { x: cleric.x, y: cleric.y },
                target: { x: target.x - cleric.x, y: target.y - cleric.y },
                fire: true,
                power: 0,
            };
            return true;
        }
        return false;
    }

    updateVillageGuardClericRetreat(mob, now) {
        if (!mob?.health?.max || mob.health.amount > mob.health.max * VILLAGE_GUARD_CLERIC_RETREAT_HEALTH_RATIO) return false;
        if (mob.craftrasClericHealUntil > now) return false;
        const cleric = this.findNearestCleric(mob);
        if (!cleric) return false;
        const dx = cleric.x - mob.x;
        const dy = cleric.y - mob.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= BLOCK_SIZE * 2.2) {
            mob.craftrasGuardTarget = null;
            mob.craftrasPath = null;
            mob.craftrasWanderPath = null;
            mob.craftrasControl = {
                goal: { x: mob.x, y: mob.y },
                target: { x: dx, y: dy },
                fire: false,
                power: 0,
            };
            return true;
        }
        const clericCell = worldToBlock(cleric.x, cleric.y);
        const targetKey = this.wallKey(clericCell.x, clericCell.y);
        if (now >= (mob.craftrasNextPathAt || 0) || mob.craftrasPathTargetKey !== targetKey) {
            mob.craftrasNextPathAt = now + 450;
            mob.craftrasPathTargetKey = targetKey;
            mob.craftrasPath = this.findMobPath(mob, cleric) || [];
            mob.craftrasPathIndex = 0;
        }
        const path = mob.craftrasPath || [];
        let waypoint = path[mob.craftrasPathIndex] || clericCell;
        let worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        if (Math.hypot(worldWaypoint.x - mob.x, worldWaypoint.y - mob.y) < BLOCK_SIZE * 0.28 && mob.craftrasPathIndex < path.length - 1) {
            mob.craftrasPathIndex++;
            waypoint = path[mob.craftrasPathIndex];
            worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        }
        mob.craftrasGuardTarget = null;
        mob.craftrasWanderPath = null;
        mob.craftrasControl = {
            goal: { x: worldWaypoint.x, y: worldWaypoint.y },
            target: { x: dx, y: dy },
            fire: false,
            power: 1,
        };
        return true;
    }

    findVillageGuardTarget(mob, home) {
        const aggroTarget = mob.craftrasGuardTarget;
        const guardZone = target => target && this.isInsideVillageGuardZone(target);
        if (aggroTarget && !aggroTarget.isDead?.() && aggroTarget.craftrasMobFamily !== "npc" && aggroTarget.craftrasMobFamily !== "animal" && guardZone(aggroTarget)) {
            return { body: aggroTarget, distance: Math.hypot(aggroTarget.x - mob.x, aggroTarget.y - mob.y) };
        }
        let best = null;
        let bestDistance = Infinity;
        for (const target of this.mobs) {
            if (!target || target === mob || target.isDead?.() || target.craftrasMobFamily === "npc" || target.craftrasMobFamily === "animal") continue;
            if (target.craftrasInvulnerableNpc) continue;
            if (!guardZone(target)) continue;
            const distanceSquared = (target.x - mob.x) ** 2 + (target.y - mob.y) ** 2;
            if (distanceSquared >= bestDistance) continue;
            best = target;
            bestDistance = distanceSquared;
        }
        return best ? { body: best, distance: Math.sqrt(bestDistance) } : null;
    }

    findVillageCombatTargetForMob(mob) {
        if (!mob || !this.isInsideVillageGuardZone(mob)) return null;
        let best = null;
        let bestDistance = Infinity;
        for (const target of this.mobs) {
            if (!target || target === mob || target.isDead?.() || target.craftrasMobFamily !== "npc") continue;
            if (!VILLAGE_COMBAT_NPC_TYPES.has(target.craftrasMobType) || !this.isInsideVillageGuardZone(target)) continue;
            const distanceSquared = (target.x - mob.x) ** 2 + (target.y - mob.y) ** 2;
            if (distanceSquared >= bestDistance) continue;
            best = target;
            bestDistance = distanceSquared;
        }
        return best ? { body: best, distance: Math.sqrt(bestDistance) } : null;
    }

    setVillageSwordPose(mob, angleDegrees) {
        for (const turret of mob.turrets?.values?.() || []) {
            const swordLabel = turret.label || "";
            const isSword = (swordLabel.startsWith("Craftras Tool:") || swordLabel.startsWith("Held Item:")) && swordLabel.endsWith("_sword");
            if (!isSword) continue;
            turret.alpha = 1;
            turret.bound.angle = angleDegrees * Math.PI / 180;
            turret.bound.direction = 0;
            turret.bound.offset = 0.9;
            turret.bound.size = 0.95;
        }
    }

    applyVillageGuardHit(mob, target, damage, now) {
        if (!mob || !target || target.isDead?.()) return false;
        let hitDamage = damage;
        hitDamage = this.capKingDamageByGuardian(target, hitDamage);
        if (target.craftrasGuardian) hitDamage = this.absorbGuardianShieldDamage(target, hitDamage, now);
        if (hitDamage <= 0) return false;
        if (this.tryGuardianDodge(target, mob, now)) return false;
        if (this.tryGuardianLastStand(target, hitDamage)) {
            this.flashEntity(target, 350);
            return true;
        }
        target.health.amount -= hitDamage;
        this.setMobAggro(target, mob, now);
        this.flashEntity(target);
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (!target.craftrasNoKnockback) {
            target.velocity.x += dx / distance * 10;
            target.velocity.y += dy / distance * 10;
        }
        if (target.health.amount <= 0) target.kill?.();
        return true;
    }

    updateVillageCaptainSlash(mob, now) {
        const combo = mob.craftrasCaptainSlash;
        if (!combo) return false;
        const target = combo.target;
        if (!target || target.isDead?.()) {
            mob.craftrasCaptainSlash = null;
            this.setVillageSwordPose(mob, -35);
            return false;
        }
        const elapsed = now - combo.startedAt;
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const distance = Math.hypot(dx, dy) || 1;
        const range = VILLAGE_GUARD_ATTACK_RANGE * 1.55;
        const phaseDuration = 240;
        const gapDuration = 90;
        const cycleDuration = phaseDuration + gapDuration;
        const phase = Math.floor(elapsed / cycleDuration);
        const phaseElapsed = elapsed - phase * cycleDuration;

        if (phase >= 2) {
            mob.craftrasCaptainSlash = null;
            this.setVillageSwordPose(mob, -35);
            return false;
        }
        if (phaseElapsed >= phaseDuration) {
            this.setVillageSwordPose(mob, phase % 2 ? -115 : 115);
            mob.craftrasControl = {
                goal: { x: mob.x, y: mob.y },
                target: { x: dx, y: dy },
                fire: true,
                power: 0,
            };
            return true;
        }

        if (combo.phase !== phase) {
            combo.phase = phase;
            combo.hitPhase = -1;
            combo.direction = { x: dx / distance, y: dy / distance };
            mob.velocity.x = combo.direction.x * 9;
            mob.velocity.y = combo.direction.y * 9;
        }

        if (mob.craftrasChallengeActor && mob.craftrasChallengeRole === "captain") {
            const dashStep = Math.min(Math.max(0, distance - range * 0.48), BLOCK_SIZE * 0.12);
            const nextX = mob.x + dx / distance * dashStep;
            const nextY = mob.y + dy / distance * dashStep;
            const nextCell = worldToBlock(nextX, nextY);
            if (!this.isBodyCollisionBlockForEntity(this.getBlock(nextCell.x, nextCell.y), mob)) {
                mob.x = nextX;
                mob.y = nextY;
            }
            if (now >= (mob.craftrasNextChallengeCaptainTrailAt || 0)) {
                mob.craftrasNextChallengeCaptainTrailAt = now + 70;
                this.spawnExplosionEffect({ x: mob.x, y: mob.y }, {
                    duration: 180,
                    startSize: 7,
                    growth: 0.01,
                    color: "#d9ecff",
                    alpha: 0.22,
                });
            }
        }

        const progress = Math.min(1, phaseElapsed / phaseDuration);
        const eased = 1 - (1 - progress) ** 3;
        const angle = phase % 2 === 0
            ? -115 + 240 * eased
            : 125 - 240 * eased;
        this.setVillageSwordPose(mob, angle);

        const direction = combo.direction || { x: dx / distance, y: dy / distance };
        mob.velocity.x += direction.x * 5.5;
        mob.velocity.y += direction.y * 5.5;
        mob.craftrasControl = {
            goal: { x: mob.x + direction.x * BLOCK_SIZE * 1.8, y: mob.y + direction.y * BLOCK_SIZE * 1.8 },
            target: { x: dx, y: dy },
            fire: true,
            power: 1,
        };

        if (progress >= 0.24 && progress <= 0.72 && combo.hitPhase !== phase && Math.hypot(target.x - mob.x, target.y - mob.y) <= range) {
            combo.hitPhase = phase;
            this.applyVillageGuardHit(mob, target, 80, now);
        }
        return true;
    }

    updateVillageGuardSlash(mob, now) {
        const slash = mob.craftrasGuardSlash;
        if (!slash) return false;
        const target = slash.target;
        if (!target || target.isDead?.()) {
            mob.craftrasGuardSlash = null;
            this.setVillageSwordPose(mob, -35);
            return false;
        }
        const elapsed = now - slash.startedAt;
        const duration = 520;
        const progress = Math.min(1, Math.max(0, elapsed / duration));
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const range = VILLAGE_GUARD_ATTACK_RANGE * 1.25;
        mob.craftrasControl = {
            goal: { x: mob.x, y: mob.y },
            target: { x: dx, y: dy },
            fire: true,
            power: 0,
        };

        let angle = -35;
        if (progress < 0.28) {
            angle = -35 + (-115 + 35) * (progress / 0.28);
        } else if (progress < 0.72) {
            const t = (progress - 0.28) / 0.44;
            angle = -115 + (125 + 115) * (1 - (1 - t) ** 3);
            if (!slash.hitDone && Math.hypot(dx, dy) <= range) {
                slash.hitDone = true;
                const damage = mob.craftrasChallengeRole === "guardian" ? 120 : 60;
                this.applyVillageGuardHit(mob, target, damage, now);
            }
        } else {
            const t = (progress - 0.72) / 0.28;
            angle = 125 + (-35 - 125) * (1 - (1 - t) ** 3);
        }
        this.setVillageSwordPose(mob, angle);
        if (progress >= 1) {
            mob.craftrasGuardSlash = null;
            this.setVillageSwordPose(mob, -35);
            return false;
        }
        return true;
    }

    damageVillageGuardTarget(mob, target, now) {
        if (!mob || !target || target.isDead?.()) return false;
        if (now < (mob.craftrasNextGuardAttackAt || 0)) return false;
        if (mob.craftrasMobType === "captain") {
            mob.craftrasNextGuardAttackAt = now + 1100;
            mob.craftrasCaptainSlash = { target, startedAt: now, phase: -1, hitPhase: -1, direction: null };
            return true;
        }
        mob.craftrasNextGuardAttackAt = now + 720;
        mob.craftrasGuardSlash = { target, startedAt: now, hitDone: false };
        return true;
    }

    updateVillageCombatNpc(mob, now, home) {
        if (this.updateVillageCaptainSlash(mob, now)) return true;
        if (this.updateVillageGuardSlash(mob, now)) return true;
        if (this.updateVillageGuardClericRetreat(mob, now)) return true;
        let target = mob.craftrasGuardTarget;
        const targetValid = target && !target.isDead?.() && target.craftrasMobFamily !== "npc" && target.craftrasMobFamily !== "animal" &&
            !target.craftrasInvulnerableNpc && this.isInsideVillageGuardZone(target);
        if (!targetValid) {
            const nearest = this.findVillageGuardTarget(mob, home);
            target = nearest?.body || null;
            mob.craftrasGuardTarget = target;
            mob.craftrasPath = null;
            mob.craftrasPathIndex = 0;
        }
        if (!target) return false;

        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= VILLAGE_GUARD_ATTACK_RANGE) {
            mob.craftrasWanderPath = null;
            mob.craftrasPath = null;
            mob.craftrasControl = {
                goal: { x: mob.x, y: mob.y },
                target: { x: dx, y: dy },
                fire: true,
                power: 0,
            };
            this.damageVillageGuardTarget(mob, target, now);
            return true;
        }

        const targetCell = worldToBlock(target.x, target.y);
        const targetKey = this.wallKey(targetCell.x, targetCell.y);
        if (now >= (mob.craftrasNextPathAt || 0) || mob.craftrasPathTargetKey !== targetKey) {
            mob.craftrasNextPathAt = now + 450;
            mob.craftrasPathTargetKey = targetKey;
            mob.craftrasPath = this.findMobPath(mob, target) || [];
            mob.craftrasPathIndex = 0;
        }
        const path = mob.craftrasPath || [];
        let waypoint = path[mob.craftrasPathIndex] || targetCell;
        let worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        if (Math.hypot(worldWaypoint.x - mob.x, worldWaypoint.y - mob.y) < BLOCK_SIZE * 0.28 && mob.craftrasPathIndex < path.length - 1) {
            mob.craftrasPathIndex++;
            waypoint = path[mob.craftrasPathIndex];
            worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        }
        mob.craftrasControl = {
            goal: { x: worldWaypoint.x, y: worldWaypoint.y },
            target: { x: dx, y: dy },
            fire: false,
            power: 1,
        };
        return true;
    }

    updateMobWander(mob, now) {
        let path = mob.craftrasWanderPath;
        let index = mob.craftrasWanderPathIndex || 0;
        if (!path?.length || index >= path.length) {
            if (now < (mob.craftrasNextWanderAt || 0)) return;
            if (!this.chooseMobWanderPath(mob, now)) return;
            path = mob.craftrasWanderPath;
            index = 0;
        } else if (now >= (mob.craftrasNextWanderAt || 0)) {
            if (!this.chooseMobWanderPath(mob, now)) return;
            path = mob.craftrasWanderPath;
            index = 0;
        }

        let waypoint = path[index];
        let worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        if (Math.hypot(worldWaypoint.x - mob.x, worldWaypoint.y - mob.y) < BLOCK_SIZE * 0.28) {
            index++;
            mob.craftrasWanderPathIndex = index;
            if (index >= path.length) {
                mob.craftrasWanderPath = null;
                mob.craftrasNextWanderAt = now + 800 + Math.random() * 1400;
                mob.craftrasControl = {
                    goal: { x: mob.x, y: mob.y },
                    target: { x: Math.cos(mob.facing || 0), y: Math.sin(mob.facing || 0) },
                    fire: false,
                    power: 0,
                };
                return;
            }
            waypoint = path[index];
            worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        }

        mob.craftrasControl = {
            goal: { x: worldWaypoint.x, y: worldWaypoint.y },
            target: { x: worldWaypoint.x - mob.x, y: worldWaypoint.y - mob.y },
            fire: false,
            power: 0.55,
        };
    }

    removeChallengeStraggler(mob, targetDistance, now = Date.now()) {
        if (!mob || mob.craftrasChallengeSpecial) return false;
        if (targetDistance > CRAFTRAS_CHALLENGE_STRAGGLER_DISTANCE) {
            mob.craftrasChallengeOutpacedAt ||= now;
        } else {
            mob.craftrasChallengeOutpacedAt = 0;
        }

        const probe = mob.craftrasChallengeMovementProbe ||= { x: mob.x, y: mob.y, at: now, stuckFor: 0 };
        if (now - probe.at >= 1_000) {
            const moved = Math.hypot(mob.x - probe.x, mob.y - probe.y);
            probe.stuckFor = moved < BLOCK_SIZE * 0.18 && targetDistance > BLOCK_SIZE * 7
                ? probe.stuckFor + (now - probe.at)
                : 0;
            probe.x = mob.x;
            probe.y = mob.y;
            probe.at = now;
        }
        const outpaced = mob.craftrasChallengeOutpacedAt && now - mob.craftrasChallengeOutpacedAt >= 1_500;
        const stuck = probe.stuckFor >= 3_000;
        if (!outpaced && !stuck) return false;
        mob.craftrasChallengeNoLoot = true;
        mob.destroy?.();
        this.mobs.delete(mob);
        return true;
    }

    updateChallengeHostileNavigation(mob, targets, now) {
        const startX = mob.x;
        const startY = mob.y;
        const candidates = (targets || [])
            .map(entry => entry?.body)
            .filter(body => body && body !== mob && !body.isDead?.() && !body.craftrasSpectator);
        if (!candidates.length) {
            this.clearMobAggro(mob);
            return null;
        }
        let target = null;
        let targetDistance = Infinity;
        for (const body of candidates) {
            const distance = Math.hypot(body.x - mob.x, body.y - mob.y);
            if (distance >= targetDistance) continue;
            target = body;
            targetDistance = distance;
        }
        if (!target) return null;
        if (this.removeChallengeStraggler(mob, targetDistance, now)) return null;

        mob.craftrasTarget = target;
        mob.craftrasAggroTarget = target;
        mob.craftrasAggroUntil = now + 5_000;
        const targetCell = worldToBlock(target.x, target.y);
        const targetKey = this.wallKey(targetCell.x, targetCell.y);
        const visible = this.hasLineOfSight(mob, target);
        if (visible) {
            mob.craftrasPath = null;
            mob.craftrasPathIndex = 0;
            mob.craftrasPathTargetKey = targetKey;
        } else if (now >= (mob.craftrasNextPathAt || 0) || mob.craftrasPathTargetKey !== targetKey) {
            mob.craftrasNextPathAt = now + 350;
            mob.craftrasPathTargetKey = targetKey;
            mob.craftrasPath = this.findMobPath(mob, target) || [];
            mob.craftrasPathIndex = 0;
        }

        const path = mob.craftrasPath || [];
        let waypoint = path[mob.craftrasPathIndex] || targetCell;
        let worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        if (path.length && Math.hypot(worldWaypoint.x - mob.x, worldWaypoint.y - mob.y) < BLOCK_SIZE * 0.3) {
            mob.craftrasPathIndex = Math.min(path.length - 1, (mob.craftrasPathIndex || 0) + 1);
            waypoint = path[mob.craftrasPathIndex] || targetCell;
            worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        }

        const moveX = worldWaypoint.x - mob.x;
        const moveY = worldWaypoint.y - mob.y;
        const moveDistance = Math.hypot(moveX, moveY) || 1;
        const speedScale = mob.craftrasMobType === "runner_zombie" || mob.craftrasMobType === "cursed_zombie" ? 1.5 : mob.craftrasMobType === "giant_zombie" ? 0.78 : 1;
        const step = Math.min(moveDistance, BLOCK_SIZE * 0.09 * speedScale);
        const stepX = moveX / moveDistance * step;
        const stepY = moveY / moveDistance * step;
        const canOccupy = (x, y) => {
            const cell = worldToBlock(x, y);
            return !this.isBodyCollisionBlockForEntity(this.getBlock(cell.x, cell.y), mob);
        };
        let nextX = mob.x + stepX;
        let nextY = mob.y + stepY;
        if (canOccupy(nextX, nextY)) {
            mob.x = nextX;
            mob.y = nextY;
        } else if (canOccupy(nextX, mob.y)) {
            mob.x = nextX;
        } else if (canOccupy(mob.x, nextY)) {
            mob.y = nextY;
        } else {
            const alternatives = [
                { x: mob.x + step, y: mob.y },
                { x: mob.x - step, y: mob.y },
                { x: mob.x, y: mob.y + step },
                { x: mob.x, y: mob.y - step },
            ].filter(point => canOccupy(point.x, point.y));
            alternatives.sort((a, b) =>
                (a.x - target.x) ** 2 + (a.y - target.y) ** 2 - ((b.x - target.x) ** 2 + (b.y - target.y) ** 2));
            if (alternatives[0]) {
                mob.x = alternatives[0].x;
                mob.y = alternatives[0].y;
            }
        }
        mob.velocity.x = 0;
        mob.velocity.y = 0;
        if (mob.accel) {
            mob.accel.x = 0;
            mob.accel.y = 0;
        }
        const faceX = target.x - mob.x;
        const faceY = target.y - mob.y;
        const facing = Math.atan2(faceY, faceX);
        mob.facing = facing;
        mob.vfacing = facing;
        mob.craftrasControl = {
            goal: { x: mob.x, y: mob.y },
            target: { x: faceX, y: faceY },
            fire: false,
            power: 0,
        };
        const diagnostics = this.challengeAiDiagnostics ||= { reports: 0, nextAt: now + 3_000, samples: 0, moved: 0, targetedPlayers: 0 };
        diagnostics.samples++;
        if (Math.hypot(mob.x - startX, mob.y - startY) > 0.01) diagnostics.moved++;
        if (this.findSocketByBody(target)) diagnostics.targetedPlayers++;
        if (diagnostics.reports < 3 && now >= diagnostics.nextAt) {
            console.log(`[Craftras World 1 Challenge] AI check: hostiles=${this.getChallengeHostiles().length}, moved=${diagnostics.moved}/${diagnostics.samples}, playerTargets=${diagnostics.targetedPlayers}, friendlySlashes=${[...this.guardianSlashProjectiles].filter(projectile => projectile?.craftrasGuardianSlashFriendly).length}, timeStopped=${!!this.craftrasTimeStopped}.`);
            diagnostics.reports++;
            diagnostics.nextAt = now + 3_000;
            diagnostics.samples = 0;
            diagnostics.moved = 0;
            diagnostics.targetedPlayers = 0;
        }
        return { body: target, distance: Math.hypot(faceX, faceY), visible: this.hasLineOfSight(mob, target) };
    }

    updateMobNavigation(mob, players, now) {
        if (mob.craftrasChallengeHostile) return this.updateChallengeHostileNavigation(mob, players, now);
        const detectionBlocks = mob.craftrasChallengeHostile ? 32 : 16;
        const canBreakToTarget = this.mobCanBreakBlocks(mob);
        const aggroTarget = this.isValidMobAggroTarget(mob, mob.craftrasAggroTarget, players, now) ? mob.craftrasAggroTarget : null;
        const villageCombatTarget = aggroTarget ? null : this.findVillageCombatTargetForMob(mob)?.body || null;
        const guardianTarget = mob.craftrasGuardian && this.knightTargetBody && !this.knightTargetBody.isDead?.() && players.some(({ body }) => body === this.knightTargetBody)
            ? this.knightTargetBody
            : null;
        const priorityTarget = aggroTarget || guardianTarget || villageCombatTarget;
        let target = priorityTarget || mob.craftrasTarget;
        if (priorityTarget && mob.craftrasTarget !== priorityTarget) {
            mob.craftrasTarget = priorityTarget;
            mob.craftrasNextPathAt = 0;
        }
        if (!target || target.isDead?.() || (target.craftrasMobFamily === "npc" && !target.craftrasChallengeActor && (!VILLAGE_COMBAT_NPC_TYPES.has(target.craftrasMobType) || !this.isInsideVillageGuardZone(target)))) {
            target = null;
            let nearestDistance = Infinity;
            for (const { body } of players) {
                const mobCell = worldToBlock(mob.x, mob.y);
                const playerCell = worldToBlock(body.x, body.y);
                if (Math.max(Math.abs(playerCell.x - mobCell.x), Math.abs(playerCell.y - mobCell.y)) > detectionBlocks) continue;
                const distance = Math.hypot(body.x - mob.x, body.y - mob.y);
                if (distance >= nearestDistance || (!canBreakToTarget && !mob.craftrasChallengeHostile && !this.hasLineOfSight(mob, body))) continue;
                target = body;
                nearestDistance = distance;
            }
            if (!target) {
                this.clearMobAggro(mob);
                this.updateMobWander(mob, now);
                return null;
            }
            mob.craftrasTarget = target;
            mob.craftrasNextPathAt = 0;
            mob.craftrasWanderPath = null;
            mob.craftrasWanderPathIndex = 0;
        }

        const targetCell = worldToBlock(target.x, target.y);
        const pathTargetKey = this.wallKey(targetCell.x, targetCell.y);
        if (now >= (mob.craftrasNextPathAt || 0) || mob.craftrasPathTargetKey !== pathTargetKey) {
            mob.craftrasNextPathAt = now + 500;
            mob.craftrasPathTargetKey = pathTargetKey;
            mob.craftrasPath = this.findMobPath(mob, target);
            mob.craftrasPathIndex = 0;
            if (!mob.craftrasPath) {
                if (canBreakToTarget) {
                    mob.craftrasPath = [];
                    mob.craftrasPathIndex = 0;
                } else {
                    this.clearMobAggro(mob);
                    return null;
                }
            }
        }

        const path = mob.craftrasPath || [];
        let waypoint = path[mob.craftrasPathIndex] || targetCell;
        let worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        if (Math.hypot(worldWaypoint.x - mob.x, worldWaypoint.y - mob.y) < BLOCK_SIZE * 0.28 && mob.craftrasPathIndex < path.length - 1) {
            mob.craftrasPathIndex++;
            waypoint = path[mob.craftrasPathIndex];
            worldWaypoint = blockToWorld(waypoint.x, waypoint.y);
        }
        mob.craftrasControl = {
            goal: { x: worldWaypoint.x, y: worldWaypoint.y },
            target: { x: target.x - mob.x, y: target.y - mob.y },
            fire: false,
            power: 1,
        };
        return { body: target, distance: Math.hypot(target.x - mob.x, target.y - mob.y), visible: this.hasLineOfSight(mob, target) };
    }

    updateKingZombie(mob, nearest, now) {
        const target = nearest?.body;
        if (!mob || !target) return;
        const cave = this.getMonsterPlaceById(mob.craftrasSpawnPlaceId)
            || (this.monsterPlaces || []).find(place => place.type === "zombie_boss_room");
        if (cave && !this.isWorldLocationInMonsterPlace(mob, cave, -1)) {
            const current = worldToBlock(mob.x, mob.y);
            const offsetX = current.x - cave.blockX;
            const offsetY = current.y - cave.blockY;
            const blockDistance = Math.hypot(offsetX, offsetY) || 1;
            const clampRadius = Math.max(2, cave.radius - 1);
            const clamped = blockToWorld(
                Math.round(cave.blockX + offsetX / blockDistance * clampRadius),
                Math.round(cave.blockY + offsetY / blockDistance * clampRadius),
            );
            const clampedCell = worldToBlock(clamped.x, clamped.y);
            if (!this.isMovementBlockingBlockForEntity(this.getBlock(clampedCell.x, clampedCell.y), mob)) {
                mob.x = clamped.x;
                mob.y = clamped.y;
            }
            const center = blockToWorld(cave.blockX, cave.blockY);
            mob.velocity.x *= 0.2;
            mob.velocity.y *= 0.2;
            mob.craftrasControl = {
                goal: center,
                target: { x: target.x - mob.x, y: target.y - mob.y },
                fire: false,
                power: 0.58,
            };
            return;
        }
        const dx = mob.x - target.x;
        const dy = mob.y - target.y;
        const distance = Math.hypot(dx, dy) || 1;
        const awayX = dx / distance;
        const awayY = dy / distance;
        const goal = this.findMobRetreatGoal(mob, target, {
            distanceBlocks: 2.4,
            place: cave,
            placeMargin: 1,
        });
        if (!goal) {
            mob.velocity.x *= 0.35;
            mob.velocity.y *= 0.35;
            mob.craftrasControl = {
                goal: { x: mob.x, y: mob.y },
                target: { x: -awayY, y: awayX },
                fire: false,
                power: 0,
            };
            return;
        }
        mob.craftrasControl = {
            goal,
            target: { x: target.x - mob.x, y: target.y - mob.y },
            fire: false,
            power: distance < CRAFTRAS_KING_FLEE_DISTANCE ? 0.48 : 0.18,
        };
        mob.velocity.x += awayX * (distance < CRAFTRAS_KING_FLEE_DISTANCE ? 0.18 : 0.06);
        mob.velocity.y += awayY * (distance < CRAFTRAS_KING_FLEE_DISTANCE ? 0.18 : 0.06);
    }

    mobCanBreakBlocks(mob) {
        return mob?.craftrasMobType === "giant_zombie"
            || mob?.craftrasMobType === "king_guardian"
            || mob?.craftrasMobType === "queen_spider";
    }

    getMobBlockDamage(mob) {
        if (!mob) return 0;
        if (mob.craftrasMobType === "queen_spider") return 50;
        if (mob.craftrasSwordZombie) return mob.craftrasSwordDamage || 30;
        return mob.craftrasContactDamage ?? 20;
    }

    damageBlockTowardTarget(mob, target, now, cooldown = 650) {
        if (!mob || !target || now < (mob.craftrasNextBlockSlashAt || 0)) return false;
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const distance = Math.hypot(dx, dy) || 1;
        const directionX = dx / distance;
        const directionY = dy / distance;
        const reach = (mob.realSize || mob.size || 12) + BLOCK_SIZE * 1.4;
        const steps = Math.max(2, Math.ceil(reach / (BLOCK_SIZE * 0.45)));
        for (let step = 1; step <= steps; step++) {
            const probe = worldToBlock(mob.x + directionX * reach * step / steps, mob.y + directionY * reach * step / steps);
            const block = this.getBlock(probe.x, probe.y);
            if (!this.isBodyCollisionBlockForEntity(block, mob)) continue;
            mob.craftrasNextBlockSlashAt = now + cooldown;
            this.damageBlockAt(probe.x, probe.y, this.getMobBlockDamage(mob));
            this.setZombieSwordPose(mob, now % 700 < 350 ? 105 : -105);
            return true;
        }
        return false;
    }

    spawnMonsterPlaceMobs(activePlaces, now) {
        if (!activePlaces.length) return;
        for (const { place, players, passive } of activePlaces) {
            const isZombieCave = place.type === "zombie_boss_room";
            if (!isZombieCave && this.mobSpawnCounter % 60 !== 0) continue;
            let monsterCount = this.countNormalMobsForPlace(place);
            const speedMultiplier = isZombieCave ? this.updateZombieCavePressure(place, now) : 1;
            const monsterCap = passive
                ? CRAFTRAS_PASSIVE_BOSS_CAVE_MOB_CAP
                : isZombieCave ? this.getZombieCaveMobCap(place, players) : 50;
            const bossType = this.getNaturalBossTypeForPlace(place);
            if (bossType && now >= (place.craftrasNextBossRollAt || 0)) {
                place.craftrasNextBossRollAt = now + CRAFTRAS_BOSS_NATURAL_ROLL_INTERVAL;
                if (!this.hasNaturalBossInPlace(place) && Math.random() < 0.10) {
                    const bossLocation = this.findMonsterPlaceSpawn(place, players);
                    if (bossLocation && this.spawnMobAt(bossLocation, bossType, { placeId: place.id })) {
                        place.craftrasNextBossRollAt = now + CRAFTRAS_BOSS_NATURAL_SPAWN_COOLDOWN;
                        this.announceNaturalBossSpawn(place, bossType);
                    }
                }
            }
            if (monsterCount >= monsterCap) continue;
            if (isZombieCave) {
                const serverSpeed = Math.max(0.1, this.dayCycleSpeed || 1);
                const spawnInterval = Math.max(100, 1000 / (speedMultiplier * serverSpeed * CRAFTRAS_ZOMBIE_CAVE_SPAWN_RATE_MULTIPLIER));
                place.craftrasNextMonsterSpawnAt ??= now;
                if (now < place.craftrasNextMonsterSpawnAt) continue;
                place.craftrasNextMonsterSpawnAt = now + spawnInterval;
            }
            const location = this.findMonsterPlaceSpawn(place, players);
            if (!location) continue;
            this.spawnMobAt(location, this.chooseMonsterPlaceMobType(place), { placeId: place.id });
        }
    }

    resolveCraftrasMobSeparation() {
        const mobs = [];
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || mob.craftrasFinalDashPhasing) continue;
            if (mob.craftrasMobFamily === "npc" || mob.craftrasMobFamily === "animal") continue;
            mobs.push(mob);
        }
        if (mobs.length < 2) return;

        const grid = new Map();
        const cellSize = CRAFTRAS_MOB_SEPARATION_CELL_SIZE;
        for (const mob of mobs) {
            const cellX = Math.floor(mob.x / cellSize);
            const cellY = Math.floor(mob.y / cellSize);
            const key = `${cellX},${cellY}`;
            let bucket = grid.get(key);
            if (!bucket) grid.set(key, bucket = []);
            bucket.push(mob);
            mob.craftrasSeparationCellX = cellX;
            mob.craftrasSeparationCellY = cellY;
        }

        for (const mob of mobs) {
            const cellX = mob.craftrasSeparationCellX;
            const cellY = mob.craftrasSeparationCellY;
            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                for (let offsetX = -1; offsetX <= 1; offsetX++) {
                    const bucket = grid.get(`${cellX + offsetX},${cellY + offsetY}`);
                    if (!bucket) continue;
                    for (const other of bucket) {
                        if (!other || other === mob || other.id <= mob.id) continue;
                        const desired = Math.max(8, ((mob.realSize || mob.size || 12) + (other.realSize || other.size || 12)) * CRAFTRAS_MOB_SEPARATION_RADIUS_SCALE);
                        let dx = mob.x - other.x;
                        let dy = mob.y - other.y;
                        let distanceSquared = dx * dx + dy * dy;
                        if (distanceSquared >= desired * desired) continue;
                        if (distanceSquared < 1e-4) {
                            const angle = ((mob.id * 97 + other.id * 131) % 628) / 100;
                            dx = Math.cos(angle);
                            dy = Math.sin(angle);
                            distanceSquared = 1;
                        }
                        const distance = Math.sqrt(distanceSquared);
                        const push = Math.min(CRAFTRAS_MOB_SEPARATION_MAX_PUSH, (desired - distance) * CRAFTRAS_MOB_SEPARATION_STRENGTH);
                        if (push <= 0) continue;
                        const normalX = dx / distance;
                        const normalY = dy / distance;
                        mob.x += normalX * push;
                        mob.y += normalY * push;
                        other.x -= normalX * push;
                        other.y -= normalY * push;
                    }
                }
            }
        }
    }

    updateMobs(players, now) {
        const challengeServer = !!Config.craftras_world1_challenge_builder;
        const challengeWaiting = challengeServer && this.challengeStage !== "active";
        const undergroundPlayers = players.filter(({ body }) => {
            const cell = worldToBlock(body.x, body.y);
            return this.getCell(cell.x, cell.y)?.region === "underground";
        });
        const activeMonsterPlaces = this.getActiveMonsterPlaces(undergroundPlayers);
        const activePlaceIds = new Set(activeMonsterPlaces.map(({ place }) => place.id));
        const passiveMonsterPlaces = this.getPassiveBossCavePlaces(activePlaceIds);
        this.resetInactiveZombieCavePressure(activePlaceIds, now);
        if (!challengeServer && !challengeWaiting) this.spawnMonsterPlaceMobs([...activeMonsterPlaces, ...passiveMonsterPlaces], now);
        const roamingSpawnPlayers = this.getDayPhase() === "night" ? players : undergroundPlayers;
        const roamingMonsterCount = [...this.mobs].filter(mob => mob
            && !mob.isDead?.()
            && !mob.craftrasSpawnPlaceId
            && mob.craftrasMobFamily !== "animal"
            && mob.craftrasMobFamily !== "npc").length;
        if (!challengeServer && !challengeWaiting && ++this.mobSpawnCounter % 180 === 0 && Math.random() < 0.35 && roamingSpawnPlayers.length && roamingMonsterCount < 20) {
            const mobCounts = new Map(roamingSpawnPlayers.map(player => [player.body.id, 0]));
            for (const mob of this.mobs) {
                if (!mob
                    || mob.isDead?.()
                    || mob.craftrasSpawnPlaceId
                    || mob.craftrasMobFamily === "animal"
                    || mob.craftrasMobFamily === "npc") continue;
                let nearestPlayer = null;
                let nearestDistance = Infinity;
                for (const player of roamingSpawnPlayers) {
                    const dx = mob.x - player.body.x;
                    const dy = mob.y - player.body.y;
                    const distance = dx * dx + dy * dy;
                    if (distance >= nearestDistance) continue;
                    nearestDistance = distance;
                    nearestPlayer = player;
                }
                if (nearestPlayer) mobCounts.set(nearestPlayer.body.id, mobCounts.get(nearestPlayer.body.id) + 1);
            }

            const perPlayerTarget = Math.ceil(20 / roamingSpawnPlayers.length);
            const underfilledPlayers = roamingSpawnPlayers
                .filter(player => mobCounts.get(player.body.id) < perPlayerTarget)
                .sort((a, b) => mobCounts.get(a.body.id) - mobCounts.get(b.body.id));
            for (const player of underfilledPlayers) {
                const cell = worldToBlock(player.body.x, player.body.y);
                const mode = this.getCell(cell.x, cell.y)?.region === "underground" ? "underground" : "night";
                if (this.spawnMob([player], mode)) break;
            }
        }
        const surfacePlayers = players.filter(({ body }) => {
            const cell = worldToBlock(body.x, body.y);
            return this.getCell(cell.x, cell.y)?.region === "surface";
        });
        const animalCount = [...this.mobs].filter(mob => mob && !mob.isDead?.() && mob.craftrasMobFamily === "animal").length;
        const animalLimit = Math.min(48, Math.max(16, surfacePlayers.length * 12));
        if (!challengeServer && !challengeWaiting && ++this.animalSpawnCounter % 300 === 0 && surfacePlayers.length && animalCount < animalLimit && Math.random() < 0.65) {
            this.spawnAnimalGroup(surfacePlayers);
        }

        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.()) {
                this.mobs.delete(mob);
                continue;
            }
            mob.skill.points = 0;
            this.restoreEntityFlash(mob, now);
            this.updateMobSunlight(mob, now);
            if (this.updateMobPoison(mob, now)) {
                this.mobs.delete(mob);
                continue;
            }
            if (mob.craftrasMobType === "the_nuclear") {
                this.updateTimedExploder(mob, now);
                continue;
            }
            if (mob.craftrasChallengeKingAssassin) {
                this.updateChallengeKingAssassin(mob, now);
                continue;
            }
            if (mob.craftrasMobType === "cursed_zombie" && mob.craftrasChallengeHostile) {
                this.updateChallengeCursedZombie(mob, players, now);
                continue;
            }
            if (mob.craftrasMobType === "magical_zombie" && mob.craftrasChallengeHostile) {
                this.updateChallengeMagicalZombie(mob, players, now);
                continue;
            }
            if (mob.craftrasMobType === "titan_zombie" && mob.craftrasChallengeHostile) {
                this.updateChallengeTitanZombie(mob, players, now);
                continue;
            }
            if (mob.craftrasMobFamily === "npc") {
                if (!mob.craftrasChallengeActor || this.challengeStage !== "active") mob.damageReceived = 0;
                if (mob.craftrasChallengeActor && challengeWaiting) {
                    mob.health.amount = mob.health.max;
                    mob.velocity.x = 0;
                    mob.velocity.y = 0;
                    if (mob.accel) {
                        mob.accel.x = 0;
                        mob.accel.y = 0;
                    }
                    mob.craftrasControl = {
                        goal: { x: mob.x, y: mob.y },
                        target: mob.craftrasControl?.target || { x: 1, y: 0 },
                        fire: false,
                        power: 0,
                    };
                    continue;
                }
                if (mob.craftrasChallengeActor) continue;
                if (mob.health && !VILLAGE_COMBAT_NPC_TYPES.has(mob.craftrasMobType) && !mob.craftrasChallengeActor) mob.health.amount = mob.health.max;
                if (mob.craftrasKingdomGhostBuilder) {
                    this.updateKingdomGhostBuilder(mob, now);
                    continue;
                }
                if (mob.craftrasArenaBuilder) {
                    this.updateArenaBuilder(mob, now);
                    continue;
                }
                if (mob.craftrasMobType === "builder") {
                    this.updateVillageBuilder(mob, now);
                    continue;
                }
                const home = mob.craftrasHome || { x: mob.x, y: mob.y };
                const homeDeltaX = Math.round((mob.x - home.x) / BLOCK_SIZE);
                const homeDeltaY = Math.round((mob.y - home.y) / BLOCK_SIZE);
                const outsideFixedRange = VILLAGE_COMBAT_NPC_TYPES.has(mob.craftrasMobType)
                    ? !this.isInsideVillageGuardZone(mob)
                    : Math.abs(homeDeltaX) > VILLAGE_NPC_MAX_HOME_DISTANCE || Math.abs(homeDeltaY) > VILLAGE_NPC_MAX_HOME_DISTANCE;
                if (mob.craftrasFixedNpc && outsideFixedRange) {
                    mob.x = home.x;
                    mob.y = home.y;
                    mob.velocity.x = 0;
                    mob.velocity.y = 0;
                    mob.craftrasWanderPath = null;
                    mob.craftrasWanderPathIndex = 0;
                }
                if (mob.craftrasMobType === "cleric" && this.updateVillageCleric(mob, players, now, home)) continue;
                if (VILLAGE_COMBAT_NPC_TYPES.has(mob.craftrasMobType) && this.updateVillageCombatNpc(mob, now, home)) continue;
                if (VILLAGE_IDLE_SHOP_NPC_TYPES.has(mob.craftrasMobType)) {
                    this.updateIdleShopNpcLook(mob, players, home);
                    continue;
                }
                this.updateNpcWander(mob, now, home);
                continue;
            }
            if (mob.craftrasMobFamily === "animal") {
                const closestPlayer = this.nearestPlayer(mob, players);
                if (!closestPlayer || closestPlayer.distance > BLOCK_SIZE * 50) {
                    mob.destroy();
                    this.mobs.delete(mob);
                    continue;
                }
                this.updateAnimalWander(mob, now);
                continue;
            }
            if (mob.craftrasMobType === "sword_guy" && (
                mob.craftrasSwordGuyPhase === 2 ||
                mob.craftrasSwordGuyPhase === "intro" ||
                mob.craftrasSwordGuyPhase === "recovering" ||
                mob.craftrasSwordGuyPhase === "dying" ||
                mob.craftrasSwordGuyPendingIntro
            )) {
                this.updateSwordGuy(mob, null, now);
                continue;
            }
            let targetPlayers = mob.craftrasChallengeHostile
                ? [...players, ...[...this.challengeActors]
                    .filter(actor => actor && !actor.isDead?.())
                    .map(body => ({ socket: null, body }))]
                : players;
            if (mob.craftrasSpawnPlaceId) {
                const activePlace = activeMonsterPlaces.find(({ place }) => place.id === mob.craftrasSpawnPlaceId);
                if (!activePlace) {
                    const homePlace = this.getMonsterPlaceById(mob.craftrasSpawnPlaceId);
                    if (
                        homePlace &&
                        !this.isWorldLocationInMonsterPlace(mob, homePlace, -2) &&
                        !NON_DESPAWNING_MOB_TYPES.has(mob.craftrasMobType)
                    ) {
                        mob.destroy();
                        this.mobs.delete(mob);
                        continue;
                    }
                    this.clearMobAggro(mob);
                    this.updateMobWander(mob, now);
                    continue;
                }
                targetPlayers = activePlace.players;
            }
            const closestPlayer = this.nearestPlayer(mob, targetPlayers);
            if ((!closestPlayer || closestPlayer.distance > BLOCK_SIZE * 40) && !mob.craftrasChallengeHostile && !NON_DESPAWNING_MOB_TYPES.has(mob.craftrasMobType)) {
                mob.destroy();
                this.mobs.delete(mob);
                continue;
            }
            const nearest = this.updateMobNavigation(mob, targetPlayers, now);
            if (!nearest) {
                if (mob.craftrasMobType === "sword_guy") {
                    this.updateSwordGuy(mob, null, now);
                }
                continue;
            }

            if (mob.craftrasSpawnPlaceId && !activePlaceIds.has(mob.craftrasSpawnPlaceId)) {
                this.clearMobAggro(mob);
                continue;
            }

            if (mob.craftrasMobType === "sword_guy") {
                this.updateSwordGuy(mob, nearest, now);
            } else if (mob.craftrasMobFamily === "zombie") {
                if (mob.craftrasMobType === "king_zombie") {
                    this.updateKingZombie(mob, nearest, now);
                    continue;
                }
                if (this.mobCanBreakBlocks(mob) && !nearest.visible) this.damageBlockTowardTarget(mob, nearest.body, now);
                const contactRange = (mob.realSize || mob.size || 12) + (nearest.body.realSize || nearest.body.size || 12) + 3;
                if (nearest.distance <= contactRange && now >= (mob.craftrasNextContactAt || 0)) {
                    mob.craftrasNextContactAt = now + 750;
                    const contactDamage = mob.craftrasContactDamage ?? 20;
                    if (contactDamage > 0) this.applyCombatTargetDamage(nearest.body, contactDamage, mob);
                }
                if (mob.craftrasGuardian) this.updateKingGuardian(mob, nearest, now);
                else if (mob.craftrasSwordZombie) this.updateSwordZombie(mob, nearest, now);
            } else if (mob.craftrasMobFamily === "skeleton") {
                this.updateSkeletonMovement(mob, nearest, now);
                mob.craftrasControl.fire = nearest.visible && nearest.distance <= (mob.craftrasSkeletonApproachRange || BLOCK_SIZE * 11);
            } else if (mob.craftrasMobType === "creeper" || mob.craftrasMobType === "annihilator") {
                this.updateCreeper(mob, nearest, now);
            } else if (mob.craftrasMobFamily === "spider") {
                if (mob.craftrasQueenSpider) this.updateQueenSpider(mob, nearest, now);
                else this.updateSpider(mob, nearest, now);
            }
        }
    }

    updateAnimalWander(mob, now) {
        const current = worldToBlock(mob.x, mob.y);
        const blocked = this.isMovementBlockingBlockForEntity(this.getBlock(current.x, current.y), mob);
        if (blocked || now >= (mob.craftrasNextWanderAt || 0) || !mob.craftrasWanderGoal) {
            mob.craftrasWanderGoal = null;
            for (let attempt = 0; attempt < 24; attempt++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 2 + Math.floor(Math.random() * 6);
                const x = current.x + Math.round(Math.cos(angle) * distance);
                const y = current.y + Math.round(Math.sin(angle) * distance);
                const cell = this.getCell(x, y);
                if (cell?.region !== "surface" || cell.floor === FLOORS.WATER || this.isMovementBlockingBlockForEntity(this.getBlock(x, y), mob)) continue;
                mob.craftrasWanderGoal = blockToWorld(x, y);
                break;
            }
            mob.craftrasNextWanderAt = now + 2500 + Math.random() * 3500;
        }
        const goal = mob.craftrasWanderGoal;
        if (!goal) {
            mob.craftrasControl = { goal: { x: mob.x, y: mob.y }, target: { x: 1, y: 0 }, fire: false, power: 0 };
            return;
        }
        const dx = goal.x - mob.x;
        const dy = goal.y - mob.y;
        if (Math.hypot(dx, dy) < BLOCK_SIZE * 0.35) {
            mob.craftrasWanderGoal = null;
            mob.craftrasNextWanderAt = now + 1200 + Math.random() * 1800;
        }
        mob.craftrasControl = { goal, target: { x: dx, y: dy }, fire: false, power: 0.42 };
    }

    updateIdleShopNpcLook(mob, players, home) {
        if (!mob) return;
        mob.craftrasWanderPath = null;
        mob.craftrasWanderPathIndex = 0;
        mob.craftrasNextWanderAt = Date.now() + 1000;
        mob.x = home.x;
        mob.y = home.y;
        mob.velocity.x = 0;
        mob.velocity.y = 0;
        if (mob.accel) {
            mob.accel.x = 0;
            mob.accel.y = 0;
        }

        const lookRangeSquared = (BLOCK_SIZE * 2) ** 2;
        let target = null;
        let bestDistanceSquared = Infinity;
        for (const { body } of players || []) {
            if (!body || body.isDead?.()) continue;
            const dx = body.x - mob.x;
            const dy = body.y - mob.y;
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared > lookRangeSquared || distanceSquared >= bestDistanceSquared) continue;
            target = body;
            bestDistanceSquared = distanceSquared;
        }

        const targetVector = target
            ? { x: target.x - mob.x, y: target.y - mob.y }
            : { x: Math.cos(mob.facing || 0), y: Math.sin(mob.facing || 0) };
        if (target) {
            mob.facing = Math.atan2(targetVector.y, targetVector.x);
            mob.vfacing = mob.facing;
        }
        mob.craftrasControl = {
            goal: { x: home.x, y: home.y },
            target: targetVector,
            fire: false,
            power: 0,
        };
    }

    updateSwordZombie(mob, nearest, now) {
        const range = (mob.realSize || mob.size || 12) + (nearest.body.realSize || nearest.body.size || 12) + BLOCK_SIZE * 0.6;
        const idleAngle = -35;
        const windupAngle = -95;
        const cutAngle = 105;
        const duration = 650;

        if (!mob.craftrasSwordSwingStarted && now >= (mob.craftrasNextSwordAt || 0) && nearest.distance <= range) {
            mob.craftrasSwordSwingStarted = now;
            mob.craftrasSwordHitThisSwing = false;
            mob.craftrasNextSwordAt = now + 2000;
        }

        if (!mob.craftrasSwordSwingStarted) {
            this.setZombieSwordPose(mob, idleAngle);
            return;
        }

        const progress = Math.min(1, (now - mob.craftrasSwordSwingStarted) / duration);
        let angle = idleAngle;
        let cutting = false;
        if (progress < 0.25) {
            angle = idleAngle + (windupAngle - idleAngle) * (progress / 0.25);
        } else if (progress < 0.68) {
            const t = (progress - 0.25) / 0.43;
            angle = windupAngle + (cutAngle - windupAngle) * (1 - (1 - t) ** 3);
            cutting = true;
        } else {
            const t = (progress - 0.68) / 0.32;
            angle = cutAngle + (idleAngle - cutAngle) * (1 - (1 - t) ** 3);
        }
        this.setZombieSwordPose(mob, angle);

        if (cutting && !mob.craftrasSwordHitThisSwing && nearest.distance <= range) {
            mob.craftrasSwordHitThisSwing = true;
            this.applyCombatTargetDamage(nearest.body, mob.craftrasSwordDamage || 40, mob);
            if (mob.craftrasGuardian) this.knockCombatTargetFromSource(nearest.body, mob, 44);
            else if (mob.craftrasMobType === "sword_guy") this.knockCombatTargetFromSource(nearest.body, mob, 16);
        }

        if (progress >= 1) {
            mob.craftrasSwordSwingStarted = 0;
            mob.craftrasSwordHitThisSwing = false;
            this.setZombieSwordPose(mob, idleAngle);
        }
    }

    startGuardianCombo(mob, target, startedAt = Date.now(), counter = false, slashes = null) {
        if (!mob || !target) return;
        const berserk = this.guardianBerserkActive(mob, startedAt);
        mob.craftrasGuardianLongDash = null;
        mob.craftrasFinalDashPhasing = false;
        mob.craftrasGuardianCombo = {
            startedAt,
            target,
            counter,
            phase: -1,
            hitPhase: -1,
            firedPhase: -1,
            direction: null,
            slashes: berserk ? 18 : 9,
            berserk,
        };
        const cooldown = berserk
            ? CRAFTRAS_GUARDIAN_BERSERK_COMBO_COOLDOWN
            : mob.craftrasLastStandUsed ? CRAFTRAS_GUARDIAN_LAST_STAND_COMBO_COOLDOWN : CRAFTRAS_GUARDIAN_COMBO_COOLDOWN;
        mob.craftrasNextGuardianSkillAt = startedAt + cooldown;
    }

    updateKingGuardian(mob, nearest, now) {
        const nearestBody = nearest?.body && !nearest.body.isDead?.() ? nearest.body : null;
        const berserk = this.guardianBerserkActive(mob, now);
        if (berserk) {
            mob.color.base = "#ff3030";
            mob.craftrasGuardianBerserkColorActive = true;
        } else if (mob.craftrasGuardianBerserkColorActive) {
            mob.color.base = mob.craftrasBaseColor || "#48a84f";
            mob.craftrasGuardianBerserkColorActive = false;
            mob.craftrasGuardianBerserkTarget = null;
        }
        this.updateGuardianDodgeCharges(mob, now);
        this.updateGuardianShieldVisual(mob, now);
        if (mob.craftrasGuardianLongDash) {
            this.updateGuardianLongDash(mob, nearest, now);
            return;
        }

        const combo = mob.craftrasGuardianCombo;
        const target = combo?.target && !combo.target.isDead?.() ? combo.target : nearestBody;
        if (!target) {
            mob.craftrasGuardianCombo = null;
            this.setZombieSwordPose(mob, -35);
            return;
        }
        const effectiveNearest = nearestBody ? nearest : {
            body: target,
            distance: Math.hypot(target.x - mob.x, target.y - mob.y),
            visible: this.hasLineOfSight(mob, target),
        };
        const range = (mob.realSize || mob.size || 12) + (target.realSize || target.size || 12) + BLOCK_SIZE * 0.85;
        if (combo) {
            if (now < combo.startedAt) {
                mob.velocity.x *= 0.18;
                mob.velocity.y *= 0.18;
                this.setZombieSwordPose(mob, -105);
                mob.craftrasControl.target = { x: target.x - mob.x, y: target.y - mob.y };
                mob.craftrasControl.power = 0;
                return;
            }

            const elapsed = now - combo.startedAt;
            const comboBerserk = combo.berserk && this.guardianBerserkActive(mob, now);
            let phaseDuration;
            let phase;
            let phaseElapsed;
            let totalPhases;
            if (comboBerserk) {
                totalPhases = 18;
                const openingDashDuration = CRAFTRAS_GUARDIAN_BERSERK_DASH_STEP * 4;
                const slashDuration = CRAFTRAS_GUARDIAN_BERSERK_SLASH_STEP * 10;
                if (elapsed < openingDashDuration) {
                    phaseDuration = CRAFTRAS_GUARDIAN_BERSERK_DASH_STEP;
                    phase = Math.floor(elapsed / phaseDuration);
                    phaseElapsed = elapsed - phase * phaseDuration;
                } else if (elapsed < openingDashDuration + slashDuration) {
                    phaseDuration = CRAFTRAS_GUARDIAN_BERSERK_SLASH_STEP;
                    const projectileElapsed = elapsed - openingDashDuration;
                    phase = 4 + Math.floor(projectileElapsed / phaseDuration);
                    phaseElapsed = projectileElapsed - (phase - 4) * phaseDuration;
                } else {
                    phaseDuration = CRAFTRAS_GUARDIAN_BERSERK_DASH_STEP;
                    const finalDashElapsed = elapsed - openingDashDuration - slashDuration;
                    phase = 14 + Math.floor(finalDashElapsed / phaseDuration);
                    phaseElapsed = finalDashElapsed - (phase - 14) * phaseDuration;
                }
            } else {
                phaseDuration = mob.craftrasLastStandUsed ? CRAFTRAS_GUARDIAN_LAST_STAND_COMBO_STEP : CRAFTRAS_GUARDIAN_COMBO_STEP;
                const gapDuration = 35;
                const cycleDuration = phaseDuration + gapDuration;
                phase = Math.floor(elapsed / cycleDuration);
                phaseElapsed = elapsed - phase * cycleDuration;
                totalPhases = 9;
            }
            if (phase >= totalPhases) {
                mob.craftrasGuardianCombo = null;
                if (comboBerserk) mob.craftrasNextGuardianSkillAt = now + CRAFTRAS_GUARDIAN_BERSERK_COMBO_COOLDOWN;
                this.setZombieSwordPose(mob, -35);
                return;
            }
            if (phaseElapsed >= phaseDuration) {
                this.setZombieSwordPose(mob, phase % 2 ? -115 : 115);
                mob.craftrasControl.power = 0;
                return;
            }

            const projectilePhase = comboBerserk ? phase >= 4 && phase <= 13 : phase >= 3 && phase <= 5;
            if (combo.phase !== phase) {
                combo.phase = phase;
                combo.hitPhase = -1;
                const dx = target.x - mob.x;
                const dy = target.y - mob.y;
                const distance = Math.hypot(dx, dy) || 1;
                combo.direction = { x: dx / distance, y: dy / distance };
                mob.facing = Math.atan2(combo.direction.y, combo.direction.x);
                mob.vfacing = mob.facing;
                if (!projectilePhase) {
                    mob.velocity.x = combo.direction.x * 20;
                    mob.velocity.y = combo.direction.y * 20;
                } else {
                    mob.velocity.x *= 0.35;
                    mob.velocity.y *= 0.35;
                }
            }

            const progress = Math.min(1, phaseElapsed / phaseDuration);
            const eased = 1 - (1 - progress) ** 3;
            const angle = phase % 2 === 0
                ? -115 + 240 * eased
                : 125 - 240 * eased;
            this.setZombieSwordPose(mob, angle);

            const direction = combo.direction || { x: 1, y: 0 };
            if (projectilePhase) {
                mob.craftrasControl = {
                    goal: { x: mob.x, y: mob.y },
                    target: { x: direction.x, y: direction.y },
                    fire: false,
                    power: 0,
                };
                if (progress >= 0.38 && combo.firedPhase !== phase) {
                    combo.firedPhase = phase;
                    this.spawnGuardianSlashProjectile(mob, target, {
                        speedMultiplier: comboBerserk ? CRAFTRAS_GUARDIAN_BERSERK_SLASH_SPEED_MULTIPLIER : mob.craftrasLastStandUsed ? 1.5 : 1,
                        damage: comboBerserk ? CRAFTRAS_GUARDIAN_BERSERK_SLASH_DAMAGE : CRAFTRAS_GUARDIAN_SLASH_DAMAGE,
                        sizeMultiplier: comboBerserk ? CRAFTRAS_GUARDIAN_BERSERK_SLASH_SIZE_MULTIPLIER : 1,
                    });
                }
                return;
            }

            if (this.guardianDashHitWall(mob, direction, now)) {
                mob.velocity.x *= 0.15;
                mob.velocity.y *= 0.15;
                if (!combo.counter) {
                    mob.craftrasGuardianCombo = null;
                    this.setZombieSwordPose(mob, -35);
                }
                return;
            }
            mob.velocity.x = direction.x * 24;
            mob.velocity.y = direction.y * 24;
            mob.craftrasControl = {
                goal: { x: mob.x + direction.x * BLOCK_SIZE * 0.8, y: mob.y + direction.y * BLOCK_SIZE * 0.8 },
                target: { x: direction.x, y: direction.y },
                fire: false,
                power: 1,
            };

            if (progress >= 0.24 && progress <= 0.72 && combo.hitPhase !== phase && Math.hypot(target.x - mob.x, target.y - mob.y) <= range) {
                combo.hitPhase = phase;
                this.applyCombatTargetDamage(target, 30, mob);
                this.knockCombatTargetFromSource(target, mob, 48);
            }
            return;
        }

        const comboReady = (effectiveNearest.visible || effectiveNearest.distance <= BLOCK_SIZE * 2.4 || berserk)
            && effectiveNearest.distance <= BLOCK_SIZE * 9
            && now >= (mob.craftrasNextGuardianSkillAt || 0);
        if (comboReady) {
            this.startGuardianCombo(mob, effectiveNearest.body, now + CRAFTRAS_GUARDIAN_COMBO_WINDUP);
            return;
        }

        const king = mob.craftrasGuardianOwner;
        if (king && !king.isDead?.()) {
            let protectedTarget = null;
            let protectedDistance = Infinity;
            for (const { body } of this.getLivingPlayers()) {
                const distance = Math.hypot(body.x - king.x, body.y - king.y);
                if (distance >= protectedDistance || distance > CRAFTRAS_GUARDIAN_PROTECT_RANGE) continue;
                protectedTarget = body;
                protectedDistance = distance;
            }
            if (protectedTarget && this.tryGuardianProtectiveSlash(mob, protectedTarget, now)) return;
        }

        if (!berserk && this.guardianShieldBroken(mob, now) && effectiveNearest.distance < BLOCK_SIZE * 7) {
            this.retreatGuardianFromTarget(mob, effectiveNearest.body, now);
            return;
        }

        if (berserk && effectiveNearest.body && !effectiveNearest.body.isDead?.()) {
            const dx = effectiveNearest.body.x - mob.x;
            const dy = effectiveNearest.body.y - mob.y;
            const distance = Math.hypot(dx, dy) || 1;
            mob.velocity.x += dx / distance * 5.5;
            mob.velocity.y += dy / distance * 5.5;
            mob.craftrasControl = {
                goal: { x: effectiveNearest.body.x, y: effectiveNearest.body.y },
                target: { x: dx, y: dy },
                fire: false,
                power: 1,
            };
            return;
        }

        this.updateSwordZombie(mob, effectiveNearest, now);
    }

    tryGuardianProtectiveSlash(mob, target, now = Date.now()) {
        if (!mob?.craftrasGuardian || !target || target.isDead?.()) return false;
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const distance = Math.hypot(dx, dy) || 1;
        const direction = { x: dx / distance, y: dy / distance };
        mob.facing = Math.atan2(direction.y, direction.x);
        mob.vfacing = mob.facing;
        if (now >= (mob.craftrasNextProtectSlashProjectileAt || 0)) {
            mob.craftrasNextProtectSlashProjectileAt = now + CRAFTRAS_GUARDIAN_PROTECT_SLASH_INTERVAL;
            this.spawnGuardianSlashProjectile(mob, target, {
                direction,
                damage: CRAFTRAS_GUARDIAN_PROTECT_SLASH_DAMAGE,
                speedMultiplier: 1.5,
            });
        }
        if (now < (mob.craftrasNextProtectSlashAt || 0)) return false;
        mob.craftrasNextProtectSlashAt = now + (mob.craftrasLastStandUsed ? 380 : 520);
        mob.craftrasGuardianCombo = null;
        mob.craftrasGuardianLongDash = {
            startedAt: now,
            target,
            direction,
            hit: false,
            followUpSlashes: 0,
            remainingDashes: 1,
            quickChain: true,
            intercept: true,
            protectDash: true,
            damagedBlockKeys: new Set(),
        };
        return true;
    }

    retreatGuardianFromTarget(mob, target, now = Date.now()) {
        if (!mob || !target) return;
        const dx = mob.x - target.x;
        const dy = mob.y - target.y;
        const distance = Math.hypot(dx, dy) || 1;
        const place = this.getMonsterPlaceById(mob.craftrasSpawnPlaceId)
            || this.getMonsterPlaceById(mob.craftrasGuardianOwner?.craftrasSpawnPlaceId);
        const goal = this.findMobRetreatGoal(mob, target, {
            distanceBlocks: 1.8,
            place,
            placeMargin: 1,
        });
        if (!goal) {
            mob.velocity.x *= 0.35;
            mob.velocity.y *= 0.35;
            mob.craftrasControl = {
                goal: { x: mob.x, y: mob.y },
                target: { x: target.x - mob.x, y: target.y - mob.y },
                fire: false,
                power: 0,
            };
            this.setZombieSwordPose(mob, -35);
            return;
        }
        mob.craftrasControl = {
            goal,
            target: { x: target.x - mob.x, y: target.y - mob.y },
            fire: false,
            power: 0.3,
        };
        mob.velocity.x += dx / distance * 0.93;
        mob.velocity.y += dy / distance * 0.93;
        mob.craftrasNextRetreatAt = now + 300;
        this.setZombieSwordPose(mob, -35);
    }

    spawnGuardianSlashProjectile(owner, target, options = {}) {
        if (!owner || owner.isDead?.()) return null;
        const direction = options.direction || (() => {
            const facing = Number.isFinite(owner.facing) ? owner.facing : Number.isFinite(owner.vfacing) ? owner.vfacing : null;
            if (facing !== null) return { x: Math.cos(facing), y: Math.sin(facing) };
            const dx = (target?.x ?? owner.x + 1) - owner.x;
            const dy = (target?.y ?? owner.y) - owner.y;
            const distance = Math.hypot(dx, dy) || 1;
            return { x: dx / distance, y: dy / distance };
        })();
        const angle = Math.atan2(direction.y, direction.x);
        const offset = Math.max(26, owner.realSize || owner.size || owner.SIZE || 24);
        const projectile = new Entity({
            x: owner.x + direction.x * offset,
            y: owner.y + direction.y * offset,
        });
        projectile.define("craftrasGuardianSlashProjectile");
        projectile.team = options.friendly ? TEAM_ROOM : TEAM_ENEMIES;
        projectile.alwaysActive = true;
        projectile.facing = angle;
        projectile.vfacing = angle;
        projectile.craftrasGuardianSlashOwner = owner;
        projectile.craftrasGuardianSlashDamage = options.damage || CRAFTRAS_GUARDIAN_SLASH_DAMAGE;
        projectile.craftrasTheSwordDamageKind = options.theSwordDamageKind || null;
        projectile.craftrasGuardianSlashKnockback = options.knockback || CRAFTRAS_GUARDIAN_SLASH_KNOCKBACK;
        projectile.craftrasGuardianSlashFriendly = !!options.friendly;
        projectile.craftrasGuardianSlashScale = options.sizeMultiplier || 1;
        if (projectile.craftrasGuardianSlashScale !== 1) {
            const scaledSize = (projectile.SIZE || projectile.size || 36) * projectile.craftrasGuardianSlashScale;
            projectile.SIZE = scaledSize;
            projectile.coreSize = scaledSize;
            projectile.refreshBodyAttributes?.();
        }
        const speed = CRAFTRAS_GUARDIAN_SLASH_SPEED * (options.speedMultiplier || 1);
        projectile.craftrasVelocity = { x: direction.x * speed, y: direction.y * speed };
        projectile.craftrasSpawnedAt = Date.now();
        projectile.craftrasExpiresAt = projectile.craftrasSpawnedAt + (options.life || CRAFTRAS_GUARDIAN_SLASH_LIFE);
        projectile.on("dead", () => this.guardianSlashProjectiles.delete(projectile));
        this.guardianSlashProjectiles.add(projectile);
        return projectile;
    }

    updateGuardianSlashProjectiles(players, now) {
        for (const projectile of this.guardianSlashProjectiles) {
            if (!projectile || projectile.isDead?.()) {
                this.guardianSlashProjectiles.delete(projectile);
                continue;
            }
            if (projectile.craftrasSlashFadeUntil && now >= projectile.craftrasSlashFadeUntil) {
                projectile.destroy();
                this.guardianSlashProjectiles.delete(projectile);
                continue;
            }
            if (!projectile.craftrasSlashFadeUntil && now >= (projectile.craftrasExpiresAt || 0)) {
                projectile.craftrasSlashFadeUntil = now + CRAFTRAS_GUARDIAN_SLASH_FADE;
            }
            const fadeLeft = projectile.craftrasSlashFadeUntil ? projectile.craftrasSlashFadeUntil - now : CRAFTRAS_GUARDIAN_SLASH_FADE;
            projectile.alpha = Math.max(0.02, Math.min(0.95, fadeLeft / CRAFTRAS_GUARDIAN_SLASH_FADE));
            projectile.x += (projectile.craftrasVelocity?.x || 0);
            projectile.y += (projectile.craftrasVelocity?.y || 0);
            const block = worldToBlock(projectile.x, projectile.y);
            if (this.isMovementBlockingBlock(this.getBlock(block.x, block.y))) {
                if (!projectile.craftrasSlashFadeUntil) projectile.craftrasSlashFadeUntil = now + CRAFTRAS_GUARDIAN_SLASH_FADE;
                continue;
            }

            if (projectile.craftrasSlashFadeUntil) continue;

            const damage = projectile.craftrasGuardianSlashDamage || CRAFTRAS_GUARDIAN_SLASH_DAMAGE;
            const knockback = projectile.craftrasGuardianSlashKnockback || CRAFTRAS_GUARDIAN_SLASH_KNOCKBACK;
            const radius = Math.max(10, projectile.realSize || projectile.size || 18);
            projectile.craftrasHitIds ??= new Set();
            if (projectile.craftrasFadeUntil) continue;
            if (!projectile.craftrasGuardianSlashFriendly) for (const { body } of players || []) {
                if (!body || body.isDead?.() || projectile.craftrasHitIds.has(body.id)) continue;
                const dx = body.x - projectile.x;
                const dy = body.y - projectile.y;
                const hitRadius = radius + Math.max(8, body.realSize || body.size || 12);
                if (dx * dx + dy * dy > hitRadius * hitRadius) continue;
                projectile.craftrasHitIds.add(body.id);
                if (projectile.craftrasTheSwordDamageKind) this.applyTheSwordPlayerDamage(body, projectile.craftrasTheSwordDamageKind, projectile.craftrasGuardianSlashOwner || projectile);
                else this.applyPlayerDamage(body, damage, projectile.craftrasGuardianSlashOwner || projectile);
                const distance = Math.hypot(dx, dy) || 1;
                body.velocity.x += dx / distance * knockback;
                body.velocity.y += dy / distance * knockback;
            }
            if (projectile.craftrasGuardianSlashFriendly) for (const target of this.getChallengeHostiles()) {
                if (!target || target.isDead?.() || target.craftrasMobType === "magical_zombie" || projectile.craftrasHitIds.has(target.id)) continue;
                const dx = target.x - projectile.x;
                const dy = target.y - projectile.y;
                const hitRadius = radius + Math.max(8, target.realSize || target.size || 12);
                if (dx * dx + dy * dy > hitRadius * hitRadius) continue;
                projectile.craftrasHitIds.add(target.id);
                this.applyVillageGuardHit(projectile.craftrasGuardianSlashOwner, target, damage, now);
                const distance = Math.hypot(dx, dy) || 1;
                if (!target.craftrasNoKnockback) {
                    target.velocity.x += dx / distance * knockback;
                    target.velocity.y += dy / distance * knockback;
                }
            }
        }
    }

    isValidGreatFriendMonsterTarget(mob) {
        return !!mob && !mob.isDead?.() && mob.craftrasMobFamily !== "npc" && mob.craftrasMobFamily !== "animal" && !mob.craftrasInvulnerableNpc && mob.craftrasSwordGuyPhase !== "dying";
    }

    findTheGreatCompanionTarget(friend, owner, now = Date.now()) {
        const preferred = owner?.craftrasGreatFriendPreferredTarget;
        if (
            this.isValidGreatFriendMonsterTarget(preferred) &&
            now - (owner.craftrasGreatFriendPreferredTargetAt || 0) <= 8_000
        ) {
            const dx = preferred.x - friend.x;
            const dy = preferred.y - friend.y;
            const preferredRange = CRAFTRAS_GREAT_FRIEND_COMPANION_RANGE * 2.5;
            if (dx * dx + dy * dy <= preferredRange * preferredRange) return preferred;
        }
        let best = null;
        let bestDistance = Infinity;
        const rangeSquared = CRAFTRAS_GREAT_FRIEND_COMPANION_RANGE ** 2;
        for (const mob of this.mobs) {
            if (!this.isValidGreatFriendMonsterTarget(mob)) continue;
            const dx = mob.x - friend.x;
            const dy = mob.y - friend.y;
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared > rangeSquared || distanceSquared >= bestDistance) continue;
            best = mob;
            bestDistance = distanceSquared;
        }
        return best;
    }

    damageMobFromGreatFriend(mob, owner, damage = CRAFTRAS_GREAT_FRIEND_COMPANION_DAMAGE, now = Date.now()) {
        if (!mob || mob.isDead?.() || mob.craftrasInvulnerableNpc || mob.craftrasMobFamily === "npc" || mob.craftrasMobFamily === "animal") return false;
        let amount = damage;
        amount = this.capKingDamageByGuardian(mob, amount);
        if (mob.craftrasGuardian) amount = this.absorbGuardianShieldDamage(mob, amount, now);
        if (amount <= 0) return false;
        if (mob.craftrasGuardian && this.tryGuardianDodge(mob, owner, now)) return false;
        if (mob.craftrasGuardian && this.tryGuardianLastStand(mob, amount)) {
            this.flashEntity(mob, 350);
            return true;
        }
        mob.health.amount -= amount;
        if (owner && !owner.isDead?.()) this.setMobAggro(mob, owner, now);
        this.handleSwordGuyDamaged(mob, amount, owner, now);
        this.flashEntity(mob);
        if (mob.health.amount <= 0) {
            if (owner && !owner.isDead?.()) this.awardCraftrasScore(owner, (MOB_SCORES[mob.craftrasMobType] || 0) * (mob.craftrasScoreMultiplier || 1));
            mob.kill?.();
        }
        return true;
    }

    updateTheGreatCompanionFriend(friend, now) {
        const owner = friend.craftrasOwnerSocket?.player?.body || friend.craftrasOwnerBody;
        if (!owner || owner.isDead?.()) {
            friend.destroy?.();
            this.theGreatProjectiles.delete(friend);
            if (friend.craftrasOwnerBody?.id) this.theGreatCompanions.delete(friend.craftrasOwnerBody.id);
            return;
        }
        friend.craftrasOwnerBody = owner;
        friend.team = owner.team;
        friend.craftrasVelocity ??= { x: 0, y: 0 };
        friend.craftrasExpiresAt = Infinity;

        if (friend.craftrasCompanionHidden) {
            friend.x = owner.x;
            friend.y = owner.y;
            friend.craftrasVelocity.x = 0;
            friend.craftrasVelocity.y = 0;
            friend.alpha = 0;
            friend.craftrasCompanionAttack = null;
            friend.craftrasCompanionHitIds = new Set();
            friend.craftrasNextCompanionAttackAt = Math.max(friend.craftrasNextCompanionAttackAt || 0, now + 250);
            return;
        }

        friend.alpha = 0.95;
        if (!friend.craftrasCompanionAttack && now >= (friend.craftrasNextCompanionAttackAt || 0)) {
            const attackTarget = this.findTheGreatCompanionTarget(friend, owner, now);
            if (attackTarget) {
                const dx = attackTarget.x - friend.x;
                const dy = attackTarget.y - friend.y;
                const distance = Math.hypot(dx, dy) || 1;
                const dirX = dx / distance;
                const dirY = dy / distance;
                friend.craftrasCompanionAttack = {
                    target: attackTarget,
                    targetPoint: { x: attackTarget.x, y: attackTarget.y },
                    dirX,
                    dirY,
                    homing: Math.random() < 0.5,
                    passedAt: 0,
                    slowAt: 0,
                    readyAt: 0,
                };
                friend.craftrasCompanionHitIds = new Set();
                friend.craftrasVelocity.x = dirX * CRAFTRAS_GREAT_FRIEND_COMPANION_SPEED;
                friend.craftrasVelocity.y = dirY * CRAFTRAS_GREAT_FRIEND_COMPANION_SPEED;
                friend.facing = Math.atan2(dirY, dirX);
                friend.vfacing = friend.facing;
            }
        }

        const attack = friend.craftrasCompanionAttack;
        const attacking = !!attack;
        if (attack) {
            const prevX = friend.x;
            const prevY = friend.y;
            const liveTarget = attack.target && !attack.target.isDead?.() ? attack.target : null;
            if (attack.homing && liveTarget && !attack.passedAt) {
                const dx = liveTarget.x - friend.x;
                const dy = liveTarget.y - friend.y;
                const distance = Math.hypot(dx, dy) || 1;
                const aimX = dx / distance;
                const aimY = dy / distance;
                friend.craftrasVelocity.x = friend.craftrasVelocity.x * 0.78 + aimX * CRAFTRAS_GREAT_FRIEND_COMPANION_SPEED * 0.22;
                friend.craftrasVelocity.y = friend.craftrasVelocity.y * 0.78 + aimY * CRAFTRAS_GREAT_FRIEND_COMPANION_SPEED * 0.22;
                const velocityDistance = Math.hypot(friend.craftrasVelocity.x, friend.craftrasVelocity.y) || 1;
                attack.dirX = friend.craftrasVelocity.x / velocityDistance;
                attack.dirY = friend.craftrasVelocity.y / velocityDistance;
                attack.targetPoint = { x: liveTarget.x, y: liveTarget.y };
            }
            if (attack.slowAt && now >= attack.slowAt) {
                friend.craftrasVelocity.x *= 0.45;
                friend.craftrasVelocity.y *= 0.45;
            }
            friend.x += friend.craftrasVelocity.x;
            friend.y += friend.craftrasVelocity.y;

            const target = attack.target && !attack.target.isDead?.() ? attack.target : null;
            if (target && !friend.craftrasCompanionHitIds?.has(target.id)) {
                const segX = friend.x - prevX;
                const segY = friend.y - prevY;
                const segLenSquared = Math.max(1, segX * segX + segY * segY);
                const t = Math.max(0, Math.min(1, ((target.x - prevX) * segX + (target.y - prevY) * segY) / segLenSquared));
                const closestX = prevX + segX * t;
                const closestY = prevY + segY * t;
                const hitRadius = Math.max(10, (friend.realSize || friend.size || 18) + (target.realSize || target.size || 12));
                const hitDx = target.x - closestX;
                const hitDy = target.y - closestY;
                if (hitDx * hitDx + hitDy * hitDy <= hitRadius * hitRadius) {
                    friend.craftrasCompanionHitIds.add(target.id);
                    this.damageMobFromGreatFriend(target, owner, CRAFTRAS_GREAT_FRIEND_COMPANION_DAMAGE, now);
                }
            }

            const passedDistance = (friend.x - attack.targetPoint.x) * attack.dirX + (friend.y - attack.targetPoint.y) * attack.dirY;
            if (!attack.passedAt && passedDistance >= 0) {
                attack.passedAt = now;
                attack.slowAt = now + 200;
                attack.readyAt = now + 1200;
            }
            if (attack.readyAt && now >= attack.readyAt) {
                friend.craftrasCompanionAttack = null;
                friend.craftrasCompanionHitIds = new Set();
                friend.craftrasNextCompanionAttackAt = now;
            }
        } else {
            const orbit = now / 850 + (owner.id || 0);
            const goal = {
                x: owner.x + Math.cos(orbit) * CRAFTRAS_GREAT_FRIEND_COMPANION_FOLLOW_RADIUS,
                y: owner.y + Math.sin(orbit) * CRAFTRAS_GREAT_FRIEND_COMPANION_FOLLOW_RADIUS,
            };
            const dx = goal.x - friend.x;
            const dy = goal.y - friend.y;
            const distance = Math.hypot(dx, dy) || 1;
            const ownerDistance = Math.hypot(friend.x - owner.x, friend.y - owner.y);
            const maxSpeed = CRAFTRAS_GREAT_FRIEND_COMPANION_SPEED * 0.9;
            const distanceSpeed = Math.max(0.8, ownerDistance * 0.22);
            const arrivalScale = Math.min(1, distance / (BLOCK_SIZE * 0.8));
            const speed = Math.min(maxSpeed, distanceSpeed) * arrivalScale;
            const desiredX = dx / distance * speed;
            const desiredY = dy / distance * speed;
            friend.craftrasVelocity.x = friend.craftrasVelocity.x * 0.72 + desiredX * 0.28;
            friend.craftrasVelocity.y = friend.craftrasVelocity.y * 0.72 + desiredY * 0.28;
            friend.x += friend.craftrasVelocity.x;
            friend.y += friend.craftrasVelocity.y;
        }
        if (Math.hypot(friend.craftrasVelocity.x, friend.craftrasVelocity.y) > 0.05) {
            friend.facing = Math.atan2(friend.craftrasVelocity.y, friend.craftrasVelocity.x);
            friend.vfacing = friend.facing;
        }
        if (!attacking && Math.hypot(friend.x - owner.x, friend.y - owner.y) > CRAFTRAS_GREAT_FRIEND_COMPANION_RANGE * 8) {
            friend.x = owner.x + CRAFTRAS_GREAT_FRIEND_COMPANION_FOLLOW_RADIUS;
            friend.y = owner.y;
            friend.craftrasVelocity.x = 0;
            friend.craftrasVelocity.y = 0;
        }
        if (attack && attack.readyAt && now >= attack.slowAt) friend.alpha = Math.max(0.72, 0.95 - (now - attack.slowAt) / 5000);
        if (attacking && !attack.readyAt) friend.alpha = 0.98;
        if (now >= (friend.craftrasNextTrailAt || 0)) {
            friend.craftrasNextTrailAt = now + 70;
            this.spawnExplosionEffect({ x: friend.x, y: friend.y }, {
                duration: 360,
                startSize: Math.max(4, (friend.realSize || friend.size || 18) * 0.34),
                endSize: Math.max(6, (friend.realSize || friend.size || 18) * 0.48),
                color: "#f6f6ff",
                alpha: attacking ? 0.17 : 0.08,
                fade: true,
            });
        }
    }

    updateTheGreatProjectiles(players, now) {
        for (const warning of [...this.theGreatWarnings]) {
            const linkedFriend = warning?.craftrasLinkedFriend;
            if (linkedFriend && !linkedFriend.isDead?.()) {
                warning.craftrasExpiresAt = Math.max(warning.craftrasExpiresAt || 0, (linkedFriend.craftrasExpiresAt || now) + 120);
                warning.facing = linkedFriend.craftrasWarningAngle ?? warning.facing;
                warning.vfacing = warning.facing;
            }
            if (!warning || warning.isDead?.() || now >= (warning.craftrasExpiresAt || 0)) {
                warning?.destroy?.();
                this.theGreatWarnings.delete(warning);
            }
        }
        for (const projectile of [...this.theGreatProjectiles]) {
            if (!projectile || projectile.isDead?.()) {
                projectile?.destroy?.();
                this.theGreatProjectiles.delete(projectile);
                continue;
            }
            if (projectile.craftrasCompanionFriend) {
                this.updateTheGreatCompanionFriend(projectile, now);
                continue;
            }
            if (projectile.craftrasPhotoFriend) {
                const socketTarget = projectile.craftrasPhotoFriendSocket?.player?.body;
                const target = socketTarget && !socketTarget.isDead?.() ? socketTarget : projectile.craftrasTarget;
                if (target && !target.isDead?.()) {
                    projectile.craftrasTarget = target;
                    projectile.facing = Math.atan2(target.y - projectile.y, target.x - projectile.x);
                    projectile.vfacing = projectile.facing;
                }
                if (projectile.velocity) {
                    projectile.velocity.x *= 0.05;
                    projectile.velocity.y *= 0.05;
                }
                projectile.alpha = 0.95;
                continue;
            }
            if (now >= (projectile.craftrasExpiresAt || 0)) {
                if (projectile.craftrasTheGreatKind === "friend") {
                    projectile.craftrasSlashFadeUntil ??= now + CRAFTRAS_GUARDIAN_SLASH_FADE;
                    if (projectile.craftrasWarningLine && !projectile.craftrasWarningLine.isDead?.()) {
                        projectile.craftrasWarningLine.craftrasExpiresAt = Math.max(
                            projectile.craftrasWarningLine.craftrasExpiresAt || 0,
                            projectile.craftrasSlashFadeUntil + 120,
                        );
                    }
                } else {
                    projectile.destroy();
                    this.theGreatProjectiles.delete(projectile);
                    continue;
                }
            }
            if (projectile.craftrasTheGreatKind === "friend") {
                if (projectile.craftrasSlashFadeUntil && now >= projectile.craftrasSlashFadeUntil) {
                    projectile.destroy();
                    this.theGreatProjectiles.delete(projectile);
                    continue;
                }
                if (projectile.craftrasSlashFadeUntil) {
                    const fadeLeft = projectile.craftrasSlashFadeUntil - now;
                    if (fadeLeft <= 0) {
                        projectile.destroy();
                        this.theGreatProjectiles.delete(projectile);
                        continue;
                    }
                    projectile.alpha = Math.max(0.02, Math.min(0.95, fadeLeft / CRAFTRAS_GUARDIAN_SLASH_FADE));
                } else {
                    projectile.alpha = 0.95;
                }
            }
            if (projectile.craftrasTheGreatKind === "friend" && projectile.craftrasMode === "homing") {
                const target = projectile.craftrasTarget;
                if (target && !target.isDead?.()) {
                    const dx = target.x - projectile.x;
                    const dy = target.y - projectile.y;
                    const distance = Math.hypot(dx, dy) || 1;
                    if (distance > BLOCK_SIZE * 4) {
                        const speed = projectile.craftrasSpeed || CRAFTRAS_THE_SWORD_FRIEND_SPEED;
                        projectile.craftrasVelocity.x = projectile.craftrasVelocity.x * 0.84 + dx / distance * speed * 0.16;
                        projectile.craftrasVelocity.y = projectile.craftrasVelocity.y * 0.84 + dy / distance * speed * 0.16;
                    }
                }
            }
            if (projectile.craftrasTheGreatKind === "friend" && projectile.craftrasMode === "explode" && !projectile.craftrasSlowing && !projectile.craftrasSlashFadeUntil) {
                const point = projectile.craftrasTargetPoint;
                const oldDistance = Math.hypot(point.x - projectile.x, point.y - projectile.y);
                const nextX = projectile.x + (projectile.craftrasVelocity?.x || 0);
                const nextY = projectile.y + (projectile.craftrasVelocity?.y || 0);
                const nextDistance = Math.hypot(point.x - nextX, point.y - nextY);
                if (oldDistance < BLOCK_SIZE * 1.6 || nextDistance > oldDistance) {
                    projectile.craftrasSlowing = true;
                    projectile.craftrasExplodeAt = now + (projectile.craftrasExplodeDelay ?? 620);
                }
            }
            if (projectile.craftrasTheGreatKind === "friend" && projectile.craftrasMode === "straight" && !projectile.craftrasSlashFadeUntil) {
                const point = projectile.craftrasTargetPoint;
                const oldDistance = Math.hypot(point.x - projectile.x, point.y - projectile.y);
                const nextX = projectile.x + (projectile.craftrasVelocity?.x || 0);
                const nextY = projectile.y + (projectile.craftrasVelocity?.y || 0);
                const nextDistance = Math.hypot(point.x - nextX, point.y - nextY);
                if (oldDistance < BLOCK_SIZE * 1.6 || nextDistance > oldDistance) {
                    projectile.craftrasSlashFadeUntil = now + CRAFTRAS_GUARDIAN_SLASH_FADE;
                    projectile.craftrasWarningLine?.destroy?.();
                }
            }
            if (projectile.craftrasSlowing) {
                projectile.craftrasVelocity.x *= 0.82;
                projectile.craftrasVelocity.y *= 0.82;
                if (!projectile.craftrasSlashFadeUntil && now >= projectile.craftrasExplodeAt) {
                    this.explodeTheGreatFriend(projectile);
                    continue;
                }
            }
            projectile.x += projectile.craftrasVelocity?.x || 0;
            projectile.y += projectile.craftrasVelocity?.y || 0;
            projectile.facing = Math.atan2(projectile.craftrasVelocity?.y || 0, projectile.craftrasVelocity?.x || 1);
            projectile.vfacing = projectile.facing;
            if (projectile.craftrasTheGreatKind === "friend" && now >= (projectile.craftrasNextTrailAt || 0)) {
                projectile.craftrasNextTrailAt = now + 45;
                this.spawnExplosionEffect({ x: projectile.x, y: projectile.y }, {
                    duration: 420,
                    startSize: Math.max(5, (projectile.realSize || projectile.size || 20) * 0.45),
                    endSize: Math.max(7, (projectile.realSize || projectile.size || 20) * 0.62),
                    color: "#f6f6ff",
                    alpha: 0.16,
                    fade: true,
                });
            }
            const hitRadius = Math.max(8, projectile.realSize || projectile.size || 8);
            projectile.craftrasHitIds ??= new Set();
            if (projectile.craftrasTheGreatKind === "friend" && projectile.craftrasSlashFadeUntil) continue;
            for (const { body } of players || []) {
                if (!body || body.isDead?.() || projectile.craftrasHitIds.has(body.id)) continue;
                const dx = body.x - projectile.x;
                const dy = body.y - projectile.y;
                const radius = hitRadius + Math.max(8, body.realSize || body.size || 12);
                if (dx * dx + dy * dy > radius * radius) continue;
                projectile.craftrasHitIds.add(body.id);
                this.applyTheSwordPlayerDamage(body, projectile.craftrasTheGreatKind === "friend" ? "friend" : "bullet", projectile.craftrasOwner || projectile);
                if (projectile.craftrasTheGreatKind === "bullet") {
                    projectile.destroy();
                    this.theGreatProjectiles.delete(projectile);
                }
                break;
            }
        }
    }

    updateTheGreatFriendCompanions(players, now) {
        const activeOwnerIds = new Set();
        for (const { socket, body } of players || []) {
            if (!socket || !body || body.isDead?.()) continue;
            activeOwnerIds.add(body.id);
            const hasFriend = this.socketHasCraftrasItem(socket, CRAFTRAS_GREAT_FRIEND_ITEM_ID);
            const holdingFriend = body.craftrasHeldItem === CRAFTRAS_GREAT_FRIEND_ITEM_ID;
            let companion = this.theGreatCompanions.get(body.id);
            if (!hasFriend || holdingFriend) {
                if (companion) {
                    companion.destroy?.();
                    this.theGreatProjectiles.delete(companion);
                    this.theGreatCompanions.delete(body.id);
                }
                continue;
            }
            if (!companion || companion.isDead?.()) companion = this.spawnTheGreatCompanionFriend(socket, body);
            companion.craftrasOwnerSocket = socket;
            companion.craftrasOwnerBody = body;
            companion.craftrasCompanionHidden = false;
        }
        for (const [ownerId, companion] of [...this.theGreatCompanions]) {
            if (activeOwnerIds.has(ownerId)) continue;
            companion?.destroy?.();
            this.theGreatProjectiles.delete(companion);
            this.theGreatCompanions.delete(ownerId);
        }
    }

    updateTheSwordArenas(players, now) {
        const active = [...this.mobs].find(mob => mob?.craftrasMobType === "sword_guy" && !mob.isDead?.() && (mob.craftrasSwordGuyPhase === "intro" || mob.craftrasSwordGuyPhase === "recovering" || mob.craftrasSwordGuyPhase === "dying" || mob.craftrasSwordGuyPhase === 2));
        if (!active) {
            if (global.craftrasTheSwordLockedIds instanceof Set) global.craftrasTheSwordLockedIds.clear();
            return;
        }
        const center = { x: active.x, y: active.y };
        const participants = active.craftrasSwordGuyParticipantIds instanceof Set ? active.craftrasSwordGuyParticipantIds : new Set();
        for (const { socket, body } of players || []) {
            if (!body || body.isDead?.()) continue;
            const dx = body.x - center.x;
            const dy = body.y - center.y;
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);
            const participant = participants.has(body.id);
            if (participant) {
                global.craftrasTheSwordLockedIds ??= new Set();
                global.craftrasTheSwordLockedIds.add(body.id);
                if (now >= (body.craftrasNextTheSwordStripAt || 0)) {
                    body.craftrasNextTheSwordStripAt = now + 1000;
                    this.stripTheSwordPlayerPower(body);
                }
                if (absX > CRAFTRAS_THE_SWORD_ARENA_HALF_SIZE || absY > CRAFTRAS_THE_SWORD_ARENA_HALF_SIZE) {
                    body.x = center.x + Math.max(-CRAFTRAS_THE_SWORD_ARENA_HALF_SIZE * 0.94, Math.min(CRAFTRAS_THE_SWORD_ARENA_HALF_SIZE * 0.94, dx));
                    body.y = center.y + Math.max(-CRAFTRAS_THE_SWORD_ARENA_HALF_SIZE * 0.94, Math.min(CRAFTRAS_THE_SWORD_ARENA_HALF_SIZE * 0.94, dy));
                    body.velocity.x *= 0.15;
                    body.velocity.y *= 0.15;
                    if (now >= (body.craftrasNextSwordGuyEscapeMessageAt || 0)) {
                        body.craftrasNextSwordGuyEscapeMessageAt = now + 1800;
                        const message = CRAFTRAS_THE_SWORD_ESCAPE_LINES[Math.floor(Math.random() * CRAFTRAS_THE_SWORD_ESCAPE_LINES.length)];
                        socket?.talk?.("BM", Config.popup_message_duration, message);
                    }
                }
            }
        }
    }

    startGuardianLongDash(mob, target, now = Date.now(), followUpSlashes = 0) {
        if (!mob || !target) return;
        mob.craftrasGuardianCombo = null;
        mob.craftrasGuardianLongDash = {
            startedAt: now,
            target,
            direction: null,
            hit: false,
            followUpSlashes,
            remainingDashes: mob.craftrasLastStandUsed ? 2 : 1,
            quickChain: false,
            intercept: false,
            damagedBlockKeys: new Set(),
        };
        mob.craftrasNextLongDashAt = now + 9000;
        mob.craftrasNextGuardianSkillAt = Math.max(mob.craftrasNextGuardianSkillAt || 0, now + 2200);
    }

    startGuardianIntercept(mob, target, now = Date.now()) {
        if (!mob || !target) return;
        const activeDash = mob.craftrasGuardianLongDash;
        if (activeDash?.intercept && activeDash.target === target) return;
        mob.craftrasGuardianCombo = null;
        mob.craftrasGuardianLongDash = {
            startedAt: now,
            target,
            direction: null,
            hit: false,
            followUpSlashes: 0,
            remainingDashes: 1,
            quickChain: true,
            intercept: true,
            damagedBlockKeys: new Set(),
        };
        mob.craftrasNextGuardianSkillAt = Math.max(mob.craftrasNextGuardianSkillAt || 0, now + 1200);
    }

    updateGuardianLongDash(mob, nearest, now) {
        const dash = mob.craftrasGuardianLongDash;
        if (!dash) return;
        const fallbackTarget = nearest?.body && !nearest.body.isDead?.() ? nearest.body : null;
        const target = dash.target && !dash.target.isDead?.() ? dash.target : fallbackTarget;
        if (!target) {
            mob.craftrasGuardianLongDash = null;
            mob.craftrasFinalDashPhasing = false;
            mob.velocity.x *= 0.2;
            mob.velocity.y *= 0.2;
            this.setZombieSwordPose(mob, -35);
            return;
        }
        const prepare = dash.intercept ? 0 : dash.quickChain ? 120 : 1000;
        const duration = dash.berserkChase ? CRAFTRAS_GUARDIAN_BERSERK_DASH_STEP : dash.protectDash ? 150 : dash.intercept ? 360 : 650;
        const elapsed = now - dash.startedAt;

        if (elapsed < prepare) {
            mob.craftrasFinalDashPhasing = false;
            mob.velocity.x *= 0.35;
            mob.velocity.y *= 0.35;
            mob.craftrasControl = {
                goal: { x: mob.x, y: mob.y },
                target: { x: target.x - mob.x, y: target.y - mob.y },
                fire: false,
                power: 0,
            };
            this.setZombieSwordPose(mob, -120);
            return;
        }

        if (!dash.direction || dash.berserkChase) {
            const dx = target.x - mob.x;
            const dy = target.y - mob.y;
            const distance = Math.hypot(dx, dy) || 1;
            dash.direction = { x: dx / distance, y: dy / distance };
        }

        if (elapsed >= prepare + duration) {
            const followUpSlashes = dash.followUpSlashes || 0;
            const remainingDashes = dash.remainingDashes || 1;
            mob.craftrasFinalDashPhasing = false;
            if (!dash.intercept && remainingDashes > 1) {
                mob.craftrasGuardianLongDash = {
                    startedAt: now,
                    target,
                    direction: null,
                    hit: false,
                    followUpSlashes,
                    remainingDashes: remainingDashes - 1,
                    quickChain: true,
                    intercept: false,
                    damagedBlockKeys: new Set(),
                };
            } else {
                mob.craftrasGuardianLongDash = null;
                if (followUpSlashes) this.startGuardianCombo(mob, target, now, true, followUpSlashes);
                else this.setZombieSwordPose(mob, -35);
            }
            return;
        }

        const direction = dash.direction;
        const isFinalDash = !dash.intercept && (dash.followUpSlashes || 0) > 0;
        mob.craftrasFinalDashPhasing = isFinalDash || dash.berserkChase;
        if (isFinalDash) {
            this.damageFinalDashBlocks(mob, direction, dash);
        } else if (!dash.berserkChase && this.guardianLongDashHitWall(mob, direction, now)) {
            mob.craftrasGuardianLongDash = null;
            mob.velocity.x *= 0.08;
            mob.velocity.y *= 0.08;
            this.setZombieSwordPose(mob, -35);
            return;
        }

        const dashAcceleration = dash.berserkChase ? 135 : dash.protectDash ? 72 : dash.intercept ? 72 : 22;
        if (dash.protectDash || dash.berserkChase) {
            mob.velocity.x = direction.x * dashAcceleration;
            mob.velocity.y = direction.y * dashAcceleration;
        } else {
            mob.velocity.x += direction.x * dashAcceleration;
            mob.velocity.y += direction.y * dashAcceleration;
        }
        mob.craftrasControl = {
            goal: {
                x: mob.x + direction.x * BLOCK_SIZE * (dash.berserkChase ? 8 : dash.protectDash ? 1.2 : 8),
                y: mob.y + direction.y * BLOCK_SIZE * (dash.berserkChase ? 8 : dash.protectDash ? 1.2 : 8),
            },
            target: { x: direction.x, y: direction.y },
            fire: false,
            power: 1,
        };
        this.setZombieSwordPose(mob, 45);
        if (now >= (mob.craftrasNextLongDashTrailAt || 0)) {
            mob.craftrasNextLongDashTrailAt = now + (dash.berserkChase ? 35 : 70);
            this.spawnExplosionEffect({ x: mob.x, y: mob.y }, {
                duration: dash.berserkChase ? 360 : 220,
                startSize: dash.berserkChase ? 14 : 8,
                growth: 0.015,
                color: dash.berserkChase ? "#ff4a4a" : "#d9ecff",
                alpha: dash.berserkChase ? 0.42 : 0.28,
            });
        }

        const hitRange = (mob.realSize || mob.size || 12) + (target.realSize || target.size || 12) + 5;
        if (!dash.hit && Math.hypot(target.x - mob.x, target.y - mob.y) <= hitRange) {
            dash.hit = true;
            if (dash.intercept) {
                if (dash.protectDash || dash.berserkChase) this.applyCombatTargetDamage(target, CRAFTRAS_GUARDIAN_PROTECT_DASH_DAMAGE, mob);
                target.velocity.x += direction.x * (dash.protectDash || dash.berserkChase ? 58 : 120);
                target.velocity.y += direction.y * (dash.protectDash || dash.berserkChase ? 58 : 120);
            } else {
                this.applyCombatTargetDamage(target, 80, mob);
                this.knockCombatTargetFromSource(target, mob, 56);
                mob.velocity.x += direction.x * 30;
                mob.velocity.y += direction.y * 30;
            }
        }
    }

    damageFinalDashBlocks(mob, direction, dash) {
        const radius = Math.max(8, (mob.realSize || mob.size || 12) * 0.72);
        const reach = radius + BLOCK_SIZE * 1.5;
        const segment = {
            startX: mob.x - direction.x * BLOCK_SIZE * 0.25,
            startY: mob.y - direction.y * BLOCK_SIZE * 0.25,
            endX: mob.x + direction.x * reach,
            endY: mob.y + direction.y * reach,
            radius,
        };
        const min = worldToBlock(Math.min(segment.startX, segment.endX) - radius, Math.min(segment.startY, segment.endY) - radius);
        const max = worldToBlock(Math.max(segment.startX, segment.endX) + radius, Math.max(segment.startY, segment.endY) + radius);
        for (let y = min.y; y <= max.y; y++) {
            for (let x = min.x; x <= max.x; x++) {
                if (!this.isMovementBlockingBlockForEntity(this.getBlock(x, y), mob) || !this.toolSegmentHitsBlock(segment, x, y)) continue;
                const key = this.wallKey(x, y);
                if (dash.damagedBlockKeys.has(key)) continue;
                dash.damagedBlockKeys.add(key);
                this.damageBlockAt(x, y, 200);
            }
        }
    }

    guardianLongDashHitWall(mob, direction, now) {
        if (!mob || !direction || now < (mob.craftrasNextLongDashWallHitAt || 0)) return false;
        const reach = (mob.realSize || mob.size || 12) + BLOCK_SIZE * 0.9;
        const check = worldToBlock(mob.x + direction.x * reach, mob.y + direction.y * reach);
        const block = this.getBlock(check.x, check.y);
        if (!this.isBodyCollisionBlockForEntity(block, mob)) return false;
        mob.craftrasNextLongDashWallHitAt = now + 300;
        for (let y = check.y - 1; y <= check.y + 1; y++) {
            for (let x = check.x - 1; x <= check.x + 1; x++) {
                if (this.isMovementBlockingBlockForEntity(this.getBlock(x, y), mob)) this.damageBlockAt(x, y, 400);
            }
        }
        return true;
    }

    guardianDashHitWall(mob, direction, now) {
        if (!mob || !direction || now < (mob.craftrasNextDashWallHitAt || 0)) return false;
        const reach = (mob.realSize || mob.size || 12) + BLOCK_SIZE * 0.9;
        const check = worldToBlock(mob.x + direction.x * reach, mob.y + direction.y * reach);
        const block = this.getBlock(check.x, check.y);
        if (!this.isBodyCollisionBlockForEntity(block, mob)) return false;
        mob.craftrasNextDashWallHitAt = now + 300;
        this.damageBlockAt(check.x, check.y, 200);
        return true;
    }

    setZombieSwordPose(mob, angleDegrees) {
        for (const turret of mob.turrets?.values?.() || []) {
            if (!turret.label?.startsWith("Craftras Tool:")) continue;
            const isSwordGuy = mob?.craftrasMobType === "sword_guy";
            const transforming = mob?.craftrasSwordGuyPhase === "intro" || mob?.craftrasSwordGuyPhase === "recovering";
            const phaseTwo = mob?.craftrasSwordGuyPhase === 2;
            if (isSwordGuy && turret.label === "Craftras Tool:diamond_sword" && (transforming || phaseTwo)) {
                turret.alpha = 0;
                continue;
            }
            if (isSwordGuy && turret.label === "Craftras Tool:the_great" && !phaseTwo) {
                turret.alpha = 0;
                continue;
            }
            if (!turret.label.endsWith("_sword") && turret.label !== "Craftras Tool:the_great") continue;
            turret.alpha = 1;
            turret.bound.angle = angleDegrees * Math.PI / 180;
            turret.bound.direction = 0;
            turret.bound.offset = 0.92;
            turret.bound.size = 0.9;
        }
    }

    craftrasTheSwordEaseIn(t) {
        return Math.max(0, Math.min(1, t)) ** 2;
    }

    craftrasTheSwordEaseOut(t) {
        const clamped = Math.max(0, Math.min(1, t));
        return 1 - (1 - clamped) ** 3;
    }

    craftrasTheSwordLerp(a, b, t) {
        return a + (b - a) * Math.max(0, Math.min(1, t));
    }

    setTheSwordWeaponPose(mob, size, offset, angleDegrees, gripAngleDegrees) {
        for (const turret of mob?.turrets?.values?.() || []) {
            if (turret.label === "Craftras Tool:diamond_sword") {
                turret.alpha = 0;
                turret.bound.size = 0.001;
                continue;
            }
            if (turret.label !== "Craftras Tool:the_great") continue;
            turret.alpha = mob?.craftrasSwordGuyPhase === 2 ? 1 : 0;
            if (turret.alpha <= 0) {
                turret.bound.size = 0.001;
                continue;
            }
            turret.bound.size = size / 20;
            turret.bound.offset = offset / 10;
            turret.bound.angle = angleDegrees * Math.PI / 180;
            turret.bound.direction = (gripAngleDegrees - angleDegrees) * Math.PI / 180;
        }
    }

    setTheSwordIdlePose(mob) {
        const pose = CRAFTRAS_THE_SWORD_POSE;
        this.setTheSwordWeaponPose(mob, pose.idleSize, pose.idleGripOffset, pose.idleAngle, pose.idleGripAngle);
    }

    setTheSwordStaffShakePose(mob, now = Date.now()) {
        const pose = CRAFTRAS_THE_SWORD_POSE;
        const elapsed = now - (mob.craftrasTheSwordStaffPoseStartedAt ||= now);
        const shake = Math.sin(elapsed / 155) * 22;
        const pulse = Math.sin(elapsed / 240) * 1.1;
        this.setTheSwordWeaponPose(mob, 26 + pulse, 13.6 + pulse, 68 + shake - 80, -8 + shake * 0.18 - 80);
    }

    setTheSwordSlashPose(mob, startedAt = Date.now(), now = Date.now(), duration = 650) {
        const pose = CRAFTRAS_THE_SWORD_POSE;
        const progress = Math.max(0, Math.min(1, (now - startedAt) / Math.max(1, duration)));
        let swordAngle;
        let gripAngle;
        let gripOffset;
        let poseSize;
        if (progress < pose.windupEnd) {
            const motion = this.craftrasTheSwordEaseIn(progress / pose.windupEnd);
            swordAngle = this.craftrasTheSwordLerp(pose.idleAngle, pose.windupAngle, motion);
            gripAngle = this.craftrasTheSwordLerp(pose.idleGripAngle, pose.windupGripAngle, motion);
            gripOffset = this.craftrasTheSwordLerp(pose.idleGripOffset, pose.windupGripOffset, motion);
            poseSize = pose.idleSize;
        } else if (progress < pose.cutEnd) {
            const motion = this.craftrasTheSwordEaseOut((progress - pose.windupEnd) / (pose.cutEnd - pose.windupEnd));
            swordAngle = this.craftrasTheSwordLerp(pose.windupAngle, pose.cutEndAngle, motion);
            gripAngle = this.craftrasTheSwordLerp(pose.windupGripAngle, pose.cutGripAngle, motion);
            gripOffset = this.craftrasTheSwordLerp(pose.windupGripOffset, pose.cutGripOffset, motion);
            poseSize = pose.cutSize;
        } else {
            const motion = this.craftrasTheSwordEaseOut((progress - pose.cutEnd) / (1 - pose.cutEnd));
            swordAngle = this.craftrasTheSwordLerp(pose.cutEndAngle, pose.recoverAngle, motion);
            gripAngle = this.craftrasTheSwordLerp(pose.cutGripAngle, pose.recoverGripAngle, motion);
            gripOffset = this.craftrasTheSwordLerp(pose.cutGripOffset, pose.idleGripOffset, motion);
            poseSize = this.craftrasTheSwordLerp(21, pose.idleSize, motion);
        }
        this.setTheSwordWeaponPose(mob, poseSize, gripOffset, swordAngle, gripAngle);
    }

    updateSpider(mob, nearest, now) {
        const contactRange = (mob.realSize || mob.size || 12) + (nearest.body.realSize || nearest.body.size || 12) + 4;
        if (nearest.distance <= contactRange && now >= (mob.craftrasNextContactAt || 0)) {
            mob.craftrasNextContactAt = now + 850;
            this.applyCombatTargetDamage(nearest.body, mob.craftrasContactDamage || 20, mob);
            if (mob.craftrasPoisonOnHit && nearest.body.craftrasMobFamily !== "npc") this.applyPlayerPoison(nearest.body, 30);
        }

        if (now < (mob.craftrasChargePrepareUntil || 0)) {
            const direction = mob.craftrasChargeDirection || { x: nearest.body.x - mob.x, y: nearest.body.y - mob.y };
            mob.velocity.x = 0;
            mob.velocity.y = 0;
            mob.craftrasControl.goal = { x: mob.x, y: mob.y };
            mob.craftrasControl.target = direction;
            mob.craftrasControl.power = 0;
            return;
        }

        if (mob.craftrasChargePrepared) {
            mob.craftrasChargePrepared = false;
            mob.craftrasChargeUntil = now + 260;
        }

        if (now >= (mob.craftrasNextChargeAt || 0)) {
            mob.craftrasNextChargeAt = now + 2000;
            mob.craftrasChargePrepareUntil = now + 500;
            mob.craftrasChargePrepared = true;
            const target = nearest.body;
            const dx = target.x - mob.x;
            const dy = target.y - mob.y;
            const distance = Math.hypot(dx, dy) || 1;
            mob.craftrasChargeDirection = { x: dx / distance, y: dy / distance };
            mob.velocity.x *= 0.35;
            mob.velocity.y *= 0.35;
            mob.craftrasControl.goal = { x: mob.x, y: mob.y };
            mob.craftrasControl.target = mob.craftrasChargeDirection;
            mob.craftrasControl.power = 0;
            return;
        }

        if (now < (mob.craftrasChargeUntil || 0)) {
            const direction = mob.craftrasChargeDirection || { x: 1, y: 0 };
            mob.velocity.x += direction.x * 8;
            mob.velocity.y += direction.y * 8;
            mob.craftrasControl.goal = {
                x: mob.x + direction.x * BLOCK_SIZE * 2.2,
                y: mob.y + direction.y * BLOCK_SIZE * 2.2,
            };
            mob.craftrasControl.target = direction;
            mob.craftrasControl.power = 1;
        }
    }

    updateQueenSpider(mob, nearest, now) {
        const target = nearest.body;
        const bodySize = mob.realSize || mob.size || 12;
        const targetSize = target.realSize || target.size || 12;
        const contactRange = bodySize + targetSize + 5;
        const charging = now < (mob.craftrasChargeUntil || 0);

        if (!mob.craftrasFlashUntil || now >= mob.craftrasFlashUntil) {
            if (now < (mob.craftrasClawUntil || 0)) {
                const progress = Math.max(0, Math.min(1, 1 - (mob.craftrasClawUntil - now) / 600));
                mob.alpha = (mob.craftrasClawSide < 0 ? 0.97 : 0.985) + progress * 0.009;
            } else if (mob.alpha > 0.95) {
                mob.alpha = 1;
            }
        }

        if (nearest.distance <= contactRange && now >= (mob.craftrasNextContactAt || 0)) {
            mob.craftrasNextContactAt = now + (charging ? 320 : 850);
            const blockedCharge = charging && this.isBlockingWithUsableShield(target, now);
            this.applyCombatTargetDamage(target, charging ? 50 : 30, mob);
            if (blockedCharge) {
                const dx = target.x - mob.x;
                const dy = target.y - mob.y;
                const distance = Math.hypot(dx, dy) || 1;
                target.velocity.x += dx / distance * 12;
                target.velocity.y += dy / distance * 12;
            }
            if (target.craftrasMobFamily !== "npc") this.applyPlayerPoison(target, 30);
        }

        const clawRange = contactRange + BLOCK_SIZE * 1.15;
        if (!charging && now >= (mob.craftrasNextClawAt || 0) && nearest.distance <= clawRange) {
            mob.craftrasNextClawAt = now + 1800;
            mob.craftrasClawSide = Math.random() < 0.5 ? -1 : 1;
            mob.craftrasClawUntil = now + 600;
            this.applyCombatTargetDamage(target, 20, mob);
        }

        if (!mob.craftrasQueenHalfSummoned && mob.health.amount <= mob.health.max * 0.5) {
            mob.craftrasQueenHalfSummoned = true;
            this.summonQueenSpiderReinforcements(mob, target, 10);
        }

        if (now >= (mob.craftrasNextEggAt || 0)) {
            mob.craftrasNextEggAt = now + 12_000;
            this.spawnQueenSpiderEggs(mob, 3);
        }
        if (now >= (mob.craftrasNextWebAt || 0)) {
            mob.craftrasNextWebAt = now + 6500;
            this.throwQueenSpiderWeb(mob, target);
        }

        if (now < (mob.craftrasChargePrepareUntil || 0)) {
            const direction = mob.craftrasChargeDirection || { x: target.x - mob.x, y: target.y - mob.y };
            mob.velocity.x = 0;
            mob.velocity.y = 0;
            mob.craftrasControl.goal = { x: mob.x, y: mob.y };
            mob.craftrasControl.target = direction;
            mob.craftrasControl.power = 0;
            return;
        }

        if (mob.craftrasChargePrepared) {
            mob.craftrasChargePrepared = false;
            mob.craftrasChargeUntil = now + 340;
        }

        if (now < (mob.craftrasChargeUntil || 0)) {
            const direction = mob.craftrasChargeDirection || { x: 1, y: 0 };
            mob.velocity.x += direction.x * 15;
            mob.velocity.y += direction.y * 15;
            mob.craftrasControl.goal = { x: mob.x + direction.x * BLOCK_SIZE * 4, y: mob.y + direction.y * BLOCK_SIZE * 4 };
            mob.craftrasControl.target = direction;
            mob.craftrasControl.power = 1;
            return;
        }

        if (mob.craftrasQueenChargesRemaining > 0 && now >= (mob.craftrasNextChainChargeAt || 0)) {
            mob.craftrasQueenChargesRemaining--;
            const dx = target.x - mob.x;
            const dy = target.y - mob.y;
            const distance = Math.hypot(dx, dy) || 1;
            mob.craftrasChargeDirection = { x: dx / distance, y: dy / distance };
            mob.craftrasChargeUntil = now + 340;
            return;
        }

        if (now >= (mob.craftrasNextChargeAt || 0)) {
            mob.craftrasNextChargeAt = now + 5500;
            mob.craftrasChargePrepareUntil = now + 500;
            mob.craftrasChargePrepared = true;
            mob.craftrasQueenChargesRemaining = mob.health.amount <= mob.health.max * 0.5 ? 1 : 0;
            mob.craftrasNextChainChargeAt = now + 1000;
            const dx = target.x - mob.x;
            const dy = target.y - mob.y;
            const distance = Math.hypot(dx, dy) || 1;
            mob.craftrasChargeDirection = { x: dx / distance, y: dy / distance };
            mob.velocity.x = 0;
            mob.velocity.y = 0;
            mob.craftrasControl.goal = { x: mob.x, y: mob.y };
            mob.craftrasControl.target = mob.craftrasChargeDirection;
            mob.craftrasControl.power = 0;
        }
    }

    isBlockingWithUsableShield(body, now = Date.now()) {
        if (!body?.control?.alt) return false;
        const offhand = body.craftrasOffhandShield;
        const mainhand = body.craftrasMainHandStack;
        const shield = ITEMS[offhand?.id]?.shieldHealth ? offhand : ITEMS[mainhand?.id]?.shieldHealth ? mainhand : null;
        return !!shield && !(shield.brokenUntil && now < shield.brokenUntil) && (shield.durability == null || shield.durability > 0);
    }

    findQueenSpiderSpawn(mob, target, minBlocks = 8, maxBlocks = 15) {
        for (let attempt = 0; attempt < 80; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = BLOCK_SIZE * (minBlocks + Math.random() * (maxBlocks - minBlocks));
            const x = mob.x + Math.cos(angle) * distance;
            const y = mob.y + Math.sin(angle) * distance;
            if (target && Math.hypot(x - target.x, y - target.y) < BLOCK_SIZE * minBlocks) continue;
            const block = worldToBlock(x, y);
            if (this.getBlock(block.x, block.y) !== BLOCKS.AIR || this.placementOverlapsEntity(block.x, block.y)) continue;
            return blockToWorld(block.x, block.y);
        }
        return null;
    }

    summonQueenSpiderReinforcements(mob, target, count) {
        for (let index = 0; index < count; index++) {
            const location = this.findQueenSpiderSpawn(mob, target, 8, 16);
            if (!location) continue;
            this.spawnMobAt(location, "spider", { placeId: mob.craftrasSpawnPlaceId });
        }
    }

    spawnQueenSpiderEggs(mob, count) {
        for (let index = 0; index < count; index++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = BLOCK_SIZE * (2.5 + Math.random() * 2.5);
            const block = worldToBlock(mob.x + Math.cos(angle) * distance, mob.y + Math.sin(angle) * distance);
            if (this.getBlock(block.x, block.y) !== BLOCKS.AIR) continue;
            const location = blockToWorld(block.x, block.y);
            const egg = new Entity(location);
            egg.define("craftrasSpiderEgg");
            egg.team = TEAM_ENEMIES;
            egg.alwaysActive = true;
            egg.craftrasHatchAt = Date.now() + 10_000;
            egg.craftrasQueenOwner = mob;
            egg.on("dead", () => this.spiderEggs.delete(egg));
            this.spiderEggs.add(egg);
        }
    }

    throwQueenSpiderWeb(mob, target) {
        if (!mob || !target) return;
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const distance = Math.hypot(dx, dy) || 1;
        const projectile = new Entity({ x: mob.x, y: mob.y });
        projectile.define("craftrasSpiderWebProjectile");
        projectile.team = TEAM_ENEMIES;
        projectile.alwaysActive = true;
        projectile.craftrasVelocity = { x: dx / distance * 18, y: dy / distance * 18 };
        projectile.craftrasWebTarget = target;
        projectile.craftrasExpiresAt = Date.now() + 3000;
        projectile.on("dead", () => this.spiderWebProjectiles.delete(projectile));
        this.spiderWebProjectiles.add(projectile);
    }

    placeSpiderWeb(location) {
        const web = new Entity(location);
        web.define("craftrasSpiderWeb");
        web.team = TEAM_ENEMIES;
        web.alwaysActive = true;
        web.craftrasExpiresAt = Date.now() + 8000;
        web.on("dead", () => this.spiderWebs.delete(web));
        this.spiderWebs.add(web);
    }

    updateSpiderAbilities(players, now) {
        for (const egg of this.spiderEggs) {
            if (!egg || egg.isDead?.()) {
                this.spiderEggs.delete(egg);
                continue;
            }
            const owner = egg.craftrasQueenOwner;
            if (now < egg.craftrasHatchAt) continue;
            this.spawnMobAt({ x: egg.x, y: egg.y }, "spider", { placeId: owner?.craftrasSpawnPlaceId });
            egg.destroy();
            this.spiderEggs.delete(egg);
        }

        for (const projectile of this.spiderWebProjectiles) {
            if (!projectile || projectile.isDead?.()) {
                this.spiderWebProjectiles.delete(projectile);
                continue;
            }
            const velocity = projectile.craftrasVelocity || { x: 0, y: 0 };
            projectile.x += velocity.x;
            projectile.y += velocity.y;
            const target = projectile.craftrasWebTarget;
            const hitTarget = target && !target.isDead?.() && Math.hypot(projectile.x - target.x, projectile.y - target.y) <= (target.realSize || target.size || 12) + 10;
            const block = worldToBlock(projectile.x, projectile.y);
            if (hitTarget || this.isMovementBlockingBlock(this.getBlock(block.x, block.y)) || now >= projectile.craftrasExpiresAt) {
                this.placeSpiderWeb({ x: projectile.x, y: projectile.y });
                projectile.destroy();
                this.spiderWebProjectiles.delete(projectile);
            }
        }

        for (const web of this.spiderWebs) {
            if (!web || web.isDead?.() || now >= web.craftrasExpiresAt) {
                web?.destroy?.();
                this.spiderWebs.delete(web);
                continue;
            }
            const radius = (web.realSize || web.size || 34) + BLOCK_SIZE * 0.75;
            for (const { body } of players) {
                if (Math.hypot(body.x - web.x, body.y - web.y) > radius) continue;
                body.SPEED = Math.min(body.SPEED, 2.5);
                body.velocity.x *= 0.72;
                body.velocity.y *= 0.72;
            }
        }
    }

    updateSkeletonMovement(mob, nearest, now) {
        const retreatRange = mob.craftrasSkeletonRetreatRange || BLOCK_SIZE * 7;
        const approachRange = mob.craftrasSkeletonApproachRange || BLOCK_SIZE * 11;
        if (nearest.distance >= approachRange) return;

        const target = nearest.body;
        mob.craftrasControl.target = { x: target.x - mob.x, y: target.y - mob.y };
        if (mob.craftrasSkeletonNoRetreat) {
            mob.craftrasControl.goal = { x: target.x, y: target.y };
            mob.craftrasControl.power = 1;
            return;
        }
        if (nearest.distance >= retreatRange) {
            mob.craftrasControl.goal = { x: mob.x, y: mob.y };
            mob.craftrasControl.power = 0;
            return;
        }

        if (now < (mob.craftrasNextRetreatAt || 0) && mob.craftrasRetreatGoal) {
            mob.craftrasControl.goal = mob.craftrasRetreatGoal;
            mob.craftrasControl.power = 1;
            return;
        }

        const current = worldToBlock(mob.x, mob.y);
        let best = null;
        let bestScore = nearest.distance;
        for (const [offsetX, offsetY] of [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1],
        ]) {
            const x = current.x + offsetX;
            const y = current.y + offsetY;
            if (this.isMovementBlockingBlock(this.getBlock(x, y))) continue;
            if (offsetX && offsetY && (
                this.isMovementBlockingBlock(this.getBlock(current.x + offsetX, current.y)) ||
                this.isMovementBlockingBlock(this.getBlock(current.x, current.y + offsetY))
            )) continue;
            const location = blockToWorld(x, y);
            const score = Math.hypot(location.x - target.x, location.y - target.y);
            if (score <= bestScore) continue;
            bestScore = score;
            best = location;
        }

        mob.craftrasNextRetreatAt = now + 250;
        mob.craftrasRetreatGoal = best || { x: mob.x, y: mob.y };
        mob.craftrasControl.goal = mob.craftrasRetreatGoal;
        mob.craftrasControl.power = best ? 1 : 0;
    }

    getAngleToTarget(from, target) {
        return Math.atan2((target?.y ?? 0) - (from?.y ?? 0), (target?.x ?? 0) - (from?.x ?? 0));
    }

    setSwordGuyWeaponVisual(mob) {
        const transforming = mob?.craftrasSwordGuyPhase === "intro" || mob?.craftrasSwordGuyPhase === "recovering";
        const phaseTwo = mob?.craftrasSwordGuyPhase === 2;
        for (const turret of mob?.turrets?.values?.() || []) {
            if (turret.label === "Craftras Tool:diamond_sword") turret.alpha = transforming || phaseTwo ? 0 : 1;
            if (turret.label === "Craftras Tool:the_great") turret.alpha = phaseTwo ? 1 : 0;
        }
    }

    updateTheSwordIntro(mob, now) {
        if (mob.craftrasSwordGuyIntroScheduled) {
            this.maintainSwordGuyTransformLock(mob);
            return;
        }
        mob.craftrasControl.goal = { x: mob.x, y: mob.y };
        mob.craftrasControl.power = 0;
        mob.velocity.x *= 0.2;
        mob.velocity.y *= 0.2;
        this.setZombieSwordPose(mob, -35);
        this.setSwordGuyWeaponVisual(mob);
        mob.health.amount = Math.max(1, mob.health.amount || 1);
        mob.damageReceived = 0;
        mob.readyToDie = false;
        mob.invuln = true;
        mob.craftrasSwordGuyIntroIndex ??= 0;
        mob.craftrasNextSwordGuyIntroLineAt ??= now;
        if (mob.craftrasSwordGuyIntroIndex < CRAFTRAS_THE_SWORD_INTRO_LINES.length) {
            if (now < mob.craftrasNextSwordGuyIntroLineAt) return;
            const line = mob.craftrasSwordGuyIntroIndex++;
            this.sendTheSwordIntroLine(mob, CRAFTRAS_THE_SWORD_INTRO_LINES[line]);
            mob.craftrasNextSwordGuyIntroLineAt = now + CRAFTRAS_THE_SWORD_INTRO_LINE_INTERVAL;
            return;
        }
        if (now >= mob.craftrasNextSwordGuyIntroLineAt) {
            mob.craftrasSwordGuyPhase = "recovering";
            mob.craftrasNextSwordGuyRecoverAt = now;
            mob.craftrasSwordGuyRecoverStartedAt = now;
            mob.craftrasSwordGuyRecoveryAnnounced = true;
            mob.health.set(3000);
            mob.health.amount = Math.max(1, Math.min(mob.health.amount || 1, 3000));
            mob.damageReceived = 0;
            mob.readyToDie = false;
            mob.invuln = true;
            this.sendTheSwordIntroLine(mob, "...");
        }
    }

    updateTheSwordRecovery(mob, now) {
        if (mob.craftrasSwordGuyRecoverTimer) {
            this.maintainSwordGuyTransformLock(mob);
            return;
        }
        mob.craftrasControl.goal = { x: mob.x, y: mob.y };
        mob.craftrasControl.power = 0;
        mob.velocity.x *= 0.2;
        mob.velocity.y *= 0.2;
        this.setZombieSwordPose(mob, -35);
        this.setSwordGuyWeaponVisual(mob);
        mob.health.set(3000);
        mob.damageReceived = 0;
        mob.readyToDie = false;
        mob.invuln = true;
        mob.health.amount = Math.max(1, mob.health.amount || 1);
        if (now >= (mob.craftrasNextSwordGuyRecoverAt || 0)) {
            mob.craftrasSwordGuyRecoverStartedAt ??= now;
            const elapsed = now - mob.craftrasSwordGuyRecoverStartedAt;
            const recovered = Math.floor(elapsed / CRAFTRAS_THE_SWORD_RECOVER_INTERVAL) * CRAFTRAS_THE_SWORD_RECOVER_PER_TICK;
            mob.health.amount = Math.min(3000, 1 + recovered);
            mob.craftrasNextSwordGuyRecoverAt = now + CRAFTRAS_THE_SWORD_RECOVER_INTERVAL;
        }
        if (mob.health.amount >= 3000) this.startSwordGuyPhaseTwo(mob, now);
    }

    getTheSwordTarget(mob, players) {
        const participants = this.getSwordGuyParticipants(mob, players).filter(({ body }) => body && !body.isDead?.());
        const pool = participants.length ? participants : players;
        let best = null;
        for (const entry of pool) {
            const distance = Math.hypot(entry.body.x - mob.x, entry.body.y - mob.y);
            if (!best || distance < best.distance) best = { ...entry, distance, visible: this.hasLineOfSight(mob, entry.body) };
        }
        return best;
    }

    startTheSwordCombo(mob, target, now) {
        const type = (mob.craftrasSwordGuyComboIndex || 0) % 3 + 1;
        mob.craftrasSwordGuyComboIndex = type;
        mob.craftrasSwordGuyCombo = {
            type,
            startedAt: now,
            targetId: target?.id,
            phase: -1,
            fired: new Set(),
            nextSpawnAt: now,
            spawned: 0,
            nextSlashAt: now,
        };
        mob.craftrasNextSwordGuyComboAt = now + CRAFTRAS_THE_SWORD_COMBO_COOLDOWN;
    }

    updateTheSwordPhaseTwo(mob, nearest, players, now) {
        this.setSwordGuyWeaponVisual(mob);
        mob.nameColor = "#4aa3ff";
        mob.craftrasRetreatGoal = null;
        mob.craftrasNextRetreatAt = 0;
        const targetEntry = this.getTheSwordTarget(mob, players);
        const target = targetEntry?.body || nearest?.body;
        if (!target || target.isDead?.()) {
            mob.craftrasControl.goal = { x: mob.x, y: mob.y };
            mob.craftrasControl.power = 0;
            mob.velocity.x *= 0.75;
            mob.velocity.y *= 0.75;
            return;
        }
        const dx = target.x - mob.x;
        const dy = target.y - mob.y;
        const distance = Math.hypot(dx, dy) || 1;
        const direction = { x: dx / distance, y: dy / distance };
        const facing = Math.atan2(direction.y, direction.x);
        mob.facing = facing;
        mob.vfacing = facing;
        mob.craftrasControl ??= {};
        mob.craftrasControl.target = direction;
        mob.craftrasControl.goal = { x: target.x, y: target.y };
        mob.craftrasControl.power = 1;
        if (now < (mob.craftrasPhaseTwoHoldUntil || 0)) {
            mob.craftrasControl.goal = { x: mob.x, y: mob.y };
            mob.craftrasControl.power = 0;
            mob.velocity.x *= 0.25;
            mob.velocity.y *= 0.25;
            this.setTheSwordIdlePose(mob);
            return;
        }
        if (!mob.craftrasSwordGuyCombo && now >= (mob.craftrasNextSwordGuyComboAt || 0)) this.startTheSwordCombo(mob, target, now);
        if (mob.craftrasSwordGuyCombo) {
            mob.craftrasControl.goal = { x: mob.x, y: mob.y };
            mob.craftrasControl.power = 0;
            mob.velocity.x *= 0.08;
            mob.velocity.y *= 0.08;
            this.updateTheSwordCombo(mob, target, now);
            return;
        }
        mob.velocity.x = mob.velocity.x * 0.72 + direction.x * 3.2;
        mob.velocity.y = mob.velocity.y * 0.72 + direction.y * 3.2;
        if (now >= (mob.craftrasNextTheSwordTrailAt || 0)) {
            mob.craftrasNextTheSwordTrailAt = now + 55;
            this.spawnExplosionEffect({ x: mob.x, y: mob.y }, { duration: 260, startSize: 9, growth: 0.02, color: mob.nameColor, alpha: 0.25 });
        }
        if (distance <= (mob.realSize || mob.size || 20) + (target.realSize || target.size || 12) + BLOCK_SIZE * 0.9 && now >= (mob.craftrasNextTheSwordMeleeAt || 0)) {
            mob.craftrasNextTheSwordMeleeAt = now + 1200;
            mob.craftrasTheSwordSlashStartedAt = now;
            mob.craftrasTheSwordSlashUntil = now + 650;
            this.setTheSwordSlashPose(mob, mob.craftrasTheSwordSlashStartedAt, now);
            this.applyTheSwordPlayerDamage(target, "melee", mob);
        }
        if (now < (mob.craftrasTheSwordSlashUntil || 0)) this.setTheSwordSlashPose(mob, mob.craftrasTheSwordSlashStartedAt || now, now);
        else this.setTheSwordIdlePose(mob);
    }

    updateSwordGuy(mob, nearest, now) {
        const target = nearest?.body;
        this.resolveEntityOutOfWall(mob);
        mob.nameColor = mob.craftrasSwordGuyPhase === 2 ? "#4aa3ff" : "#ffffff";
        this.setSwordGuyWeaponVisual(mob);
        if (mob.craftrasSwordGuyPendingIntro && mob.craftrasSwordGuyPhase === 1) {
            this.startSwordGuyPhaseTwoIntro(mob, target, now);
            return;
        }
        if (mob.craftrasSwordGuyPhase === "intro") {
            this.updateTheSwordIntro(mob, now);
            return;
        }
        if (mob.craftrasSwordGuyPhase === "recovering") {
            this.updateTheSwordRecovery(mob, now);
            return;
        }
        if (mob.craftrasSwordGuyPhase === "dying") {
            mob.health.amount = 1;
            mob.damageReceived = 0;
            mob.readyToDie = false;
            mob.velocity.x *= 0.05;
            mob.velocity.y *= 0.05;
            this.setTheSwordIdlePose(mob);
            return;
        }
        if (mob.craftrasSwordGuyPhase === 2) {
            this.updateTheSwordPhaseTwo(mob, nearest, this.getLivingPlayers(), now);
            return;
        }
        if (!target) return;
        mob.craftrasControl.target = { x: target.x - mob.x, y: target.y - mob.y };
        if (!mob.craftrasSwordGuyHostile) {
            mob.craftrasControl.goal = { x: mob.x, y: mob.y };
            mob.craftrasControl.power = 0;
            this.setZombieSwordPose(mob, -35);
            return;
        }
        this.updateSwordZombie(mob, nearest, now);
    }

    updateTheSwordCombo(mob, target, now) {
        const combo = mob.craftrasSwordGuyCombo;
        if (!combo || !target || target.isDead?.()) {
            mob.craftrasSwordGuyCombo = null;
            return;
        }
        if (combo.type === 1) {
            const elapsed = now - combo.startedAt;
            const phaseDuration = 650;
            const phase = Math.floor(elapsed / phaseDuration);
            if (phase >= 3) {
                mob.craftrasSwordGuyCombo = null;
                this.setTheSwordIdlePose(mob);
                return;
            }
            const dx = target.x - mob.x;
            const dy = target.y - mob.y;
            const distance = Math.hypot(dx, dy) || 1;
            const direction = { x: dx / distance, y: dy / distance };
            mob.facing = Math.atan2(direction.y, direction.x);
            mob.vfacing = mob.facing;
            const progress = Math.min(1, (elapsed - phase * phaseDuration) / phaseDuration);
            this.setTheSwordSlashPose(mob, combo.startedAt + phase * phaseDuration, now, phaseDuration);
            if ((phase === 0 || phase === 2) && !combo.fired.has(`dash-${phase}`)) {
                combo.fired.add(`dash-${phase}`);
                for (let i = 0; i < 2; i++) this.spawnTheGreatFriend({
                    x: mob.x + (Math.random() - 0.5) * BLOCK_SIZE,
                    y: mob.y + (Math.random() - 0.5) * BLOCK_SIZE,
                    target,
                    mode: "homing",
                    owner: mob,
                    speed: CRAFTRAS_THE_SWORD_FRIEND_SPEED,
                    warn: true,
                });
                for (let i = 0; i < 6; i++) {
                    const angle = mob.facing + (i - 2.5) * Math.PI / 3;
                    this.spawnTheGreatBullet({ x: mob.x, y: mob.y, angle, owner: mob });
                }
            }
            if (phase === 1 && !combo.fired.has("slash")) {
                combo.fired.add("slash");
                this.spawnGuardianSlashProjectile(mob, target, {
                    direction,
                    sizeMultiplier: CRAFTRAS_THE_SWORD_SLASH_SIZE,
                    speedMultiplier: 1.725,
                    life: CRAFTRAS_GUARDIAN_SLASH_LIFE * 2,
                    damage: 10,
                    theSwordDamageKind: "slash",
                });
            }
            mob.velocity.x *= 0.08;
            mob.velocity.y *= 0.08;
            return;
        }

        if (combo.type === 2) {
            mob.velocity.x *= 0.08;
            mob.velocity.y *= 0.08;
            if (now < (mob.craftrasTheSwordSlashUntil || 0)) this.setTheSwordSlashPose(mob, mob.craftrasTheSwordSlashStartedAt || now, now);
            else this.setTheSwordStaffShakePose(mob, now);
            if (combo.spawned >= 20 && now - combo.startedAt > 17_500) {
                mob.craftrasSwordGuyCombo = null;
                return;
            }
            if (combo.spawned < 20 && now >= combo.nextSpawnAt) {
                combo.nextSpawnAt = now + 700;
                combo.spawned++;
                const targetPoint = { x: target.x, y: target.y };
                const angle = Math.random() * Math.PI * 2;
                const distance = BLOCK_SIZE * (22 + Math.random() * 5);
                const start = {
                    x: targetPoint.x + Math.cos(angle) * distance,
                    y: targetPoint.y + Math.sin(angle) * distance,
                };
                this.spawnTheGreatFriend({
                    ...start,
                    target: targetPoint,
                    mode: "explode",
                    owner: mob,
                    speed: CRAFTRAS_THE_SWORD_FRIEND_SPEED * 1.45,
                    explodeDelay: 1500,
                    bulletCount: 8,
                    warn: false,
                });
            }
            if (now >= combo.nextSlashAt) {
                combo.nextSlashAt = now + 2000;
                mob.craftrasTheSwordSlashStartedAt = now;
                mob.craftrasTheSwordSlashUntil = now + 650;
                this.setTheSwordSlashPose(mob, mob.craftrasTheSwordSlashStartedAt, now);
                this.spawnGuardianSlashProjectile(mob, target, {
                    sizeMultiplier: CRAFTRAS_THE_SWORD_SLASH_SIZE,
                    speedMultiplier: 1.1,
                    damage: 10,
                    theSwordDamageKind: "slash",
                });
            }
            return;
        }

        if (combo.type === 3) {
            mob.velocity.x *= 0.08;
            mob.velocity.y *= 0.08;
            this.setTheSwordStaffShakePose(mob, now);
            if (combo.spawned >= 50 && now - combo.startedAt > 12_500) {
                mob.craftrasSwordGuyCombo = null;
                return;
            }
            if (combo.spawned < 50 && now >= combo.nextSpawnAt) {
                combo.nextSpawnAt = now + 200;
                combo.spawned++;
                const targetPoint = { x: target.x, y: target.y };
                const largeBlade = combo.spawned % 10 === 0;
                const angle = Math.random() * Math.PI * 2;
                const distance = BLOCK_SIZE * (1.7 + Math.random() * 0.9);
                const start = {
                    x: mob.x + Math.cos(angle) * distance,
                    y: mob.y + Math.sin(angle) * distance,
                };
                this.spawnTheGreatFriend({
                    ...start,
                    target: targetPoint,
                    mode: largeBlade ? "explode" : "straight",
                    owner: mob,
                    speed: CRAFTRAS_THE_SWORD_FRIEND_SPEED * 2.04,
                    sizeMultiplier: largeBlade ? 2 : 1,
                    explodeDelay: 1000,
                    bulletCount: largeBlade ? 30 : 12,
                    warn: false,
                });
            }
        }
    }

    spawnTheGreatWarningLine(x, y, angle, life = CRAFTRAS_THE_SWORD_FRIEND_WARNING_DELAY, size = 6) {
        const line = new Entity({ x, y });
        line.define("craftrasTheGreatWarningLine");
        line.team = TEAM_ENEMIES;
        line.alwaysActive = true;
        line.facing = angle;
        line.vfacing = angle;
        line.SIZE = size;
        line.coreSize = size;
        line.sizeMultiplier = 1;
        line.refreshBodyAttributes?.();
        line.craftrasExpiresAt = Date.now() + life;
        line.on("dead", () => this.theGreatWarnings.delete(line));
        this.theGreatWarnings.add(line);
        return line;
    }

    spawnTheGreatFriend({
        x,
        y,
        target,
        mode = "straight",
        owner = null,
        speed = CRAFTRAS_THE_SWORD_FRIEND_SPEED,
        warn = false,
        sizeMultiplier = 1,
        explodeDelay = 620,
        bulletCount = 12,
        warningSizeMultiplier = 1,
    }) {
        const dx = (target?.x ?? x + 1) - x;
        const dy = (target?.y ?? y) - y;
        const distance = Math.hypot(dx, dy) || 1;
        const direction = { x: dx / distance, y: dy / distance };
        const friend = new Entity({ x, y });
        friend.define("craftrasTheGreatFriend");
        friend.team = TEAM_ENEMIES;
        friend.alwaysActive = true;
        if (sizeMultiplier !== 1) {
            const scaledSize = (friend.SIZE || friend.size || 40) * sizeMultiplier;
            friend.SIZE = scaledSize;
            friend.coreSize = scaledSize;
            friend.refreshBodyAttributes?.();
        }
        friend.facing = Math.atan2(direction.y, direction.x);
        friend.vfacing = friend.facing;
        friend.craftrasTheGreatKind = "friend";
        friend.craftrasOwner = owner;
        friend.craftrasTarget = target;
        friend.craftrasMode = mode;
        friend.craftrasTargetPoint = target ? { x: target.x, y: target.y } : { x: x + direction.x * BLOCK_SIZE * 10, y: y + direction.y * BLOCK_SIZE * 10 };
        friend.craftrasVelocity = { x: direction.x * speed, y: direction.y * speed };
        friend.craftrasStoredVelocity = { x: friend.craftrasVelocity.x, y: friend.craftrasVelocity.y };
        friend.alpha = 1;
        friend.craftrasSpeed = speed;
        friend.craftrasExplodeDelay = explodeDelay;
        friend.craftrasExplosionBulletCount = bulletCount;
        friend.craftrasSpawnedAt = Date.now();
        friend.craftrasExpiresAt = friend.craftrasSpawnedAt + (mode === "straight" ? 10_000 : 7000);
        if (warn) {
            const warningAngle = Math.atan2(direction.y, direction.x);
            const targetPoint = friend.craftrasTargetPoint || { x: x + direction.x * BLOCK_SIZE * 10, y: y + direction.y * BLOCK_SIZE * 10 };
            const warningDistance = Math.max(BLOCK_SIZE * 8, Math.hypot(targetPoint.x - x, targetPoint.y - y));
            const warningSize = Math.max(2.5, Math.max(8, (warningDistance + BLOCK_SIZE * 8) / 72) * warningSizeMultiplier);
            const warningX = (x + targetPoint.x) / 2;
            const warningY = (y + targetPoint.y) / 2;
            const warning = this.spawnTheGreatWarningLine(
                warningX,
                warningY,
                warningAngle,
                friend.craftrasExpiresAt - friend.craftrasSpawnedAt + CRAFTRAS_THE_SWORD_FRIEND_FADE + 250,
                warningSize,
            );
            warning.craftrasLinkedFriend = friend;
            friend.craftrasWarningLine = warning;
            friend.craftrasWarningAngle = warningAngle;
        }
        friend.craftrasHitIds = new Set();
        friend.on("dead", () => {
            friend.craftrasWarningLine?.destroy?.();
            this.theGreatWarnings.delete(friend.craftrasWarningLine);
            this.theGreatProjectiles.delete(friend);
        });
        this.theGreatProjectiles.add(friend);
        return friend;
    }

    spawnTheGreatPhotoFriend(location, target = null, options = {}) {
        const friend = new Entity({ x: location.x, y: location.y });
        friend.define("craftrasTheGreatFriend");
        friend.team = TEAM_ENEMIES;
        friend.alwaysActive = true;
        friend.craftrasTheGreatKind = "friend";
        friend.craftrasPhotoFriend = true;
        friend.craftrasPhotoFriendSocket = options.socket || null;
        friend.craftrasTarget = target;
        friend.craftrasVelocity = { x: 0, y: 0 };
        friend.craftrasExpiresAt = Infinity;
        friend.velocity.x = 0;
        friend.velocity.y = 0;
        friend.alpha = 0.95;
        if (options.sizeMultiplier && options.sizeMultiplier !== 1) {
            const scaledSize = (friend.SIZE || friend.size || 40) * options.sizeMultiplier;
            friend.SIZE = scaledSize;
            friend.coreSize = scaledSize;
            friend.refreshBodyAttributes?.();
        }
        if (target && !target.isDead?.()) {
            friend.facing = Math.atan2(target.y - friend.y, target.x - friend.x);
            friend.vfacing = friend.facing;
        }
        friend.on("dead", () => this.theGreatProjectiles.delete(friend));
        this.theGreatProjectiles.add(friend);
        return friend;
    }

    spawnTheGreatCompanionFriend(socket, body) {
        const angle = (body?.id || 1) * 1.618;
        const friend = new Entity({
            x: (body?.x || 0) + Math.cos(angle) * CRAFTRAS_GREAT_FRIEND_COMPANION_FOLLOW_RADIUS,
            y: (body?.y || 0) + Math.sin(angle) * CRAFTRAS_GREAT_FRIEND_COMPANION_FOLLOW_RADIUS,
        });
        friend.define("craftrasTheGreatCompanionFriend");
        friend.team = body?.team || TEAM_BLUE;
        friend.alwaysActive = true;
        friend.craftrasTheGreatKind = "friend";
        friend.craftrasCompanionFriend = true;
        friend.craftrasOwnerSocket = socket;
        friend.craftrasOwnerBody = body;
        friend.craftrasVelocity = { x: 0, y: 0 };
        friend.craftrasExpiresAt = Infinity;
        friend.alpha = 0.95;
        friend.on("dead", () => {
            this.theGreatProjectiles.delete(friend);
            if (body?.id && this.theGreatCompanions.get(body.id) === friend) this.theGreatCompanions.delete(body.id);
        });
        this.theGreatProjectiles.add(friend);
        if (body?.id) this.theGreatCompanions.set(body.id, friend);
        return friend;
    }

    spawnTheGreatBullet({ x, y, angle, owner = null, speed = CRAFTRAS_THE_SWORD_BULLET_SPEED }) {
        const bullet = new Entity({ x, y });
        bullet.define("craftrasTheGreatBullet");
        bullet.team = TEAM_ENEMIES;
        bullet.alwaysActive = true;
        bullet.facing = angle;
        bullet.vfacing = angle;
        bullet.craftrasTheGreatKind = "bullet";
        bullet.craftrasOwner = owner;
        bullet.craftrasVelocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
        bullet.craftrasSpawnedAt = Date.now();
        bullet.craftrasExpiresAt = bullet.craftrasSpawnedAt + 3500;
        bullet.craftrasHitIds = new Set();
        bullet.on("dead", () => this.theGreatProjectiles.delete(bullet));
        this.theGreatProjectiles.add(bullet);
        return bullet;
    }

    explodeTheGreatFriend(friend) {
        if (!friend || friend.craftrasExploded) return;
        friend.craftrasExploded = true;
        const bulletCount = Math.max(1, friend.craftrasExplosionBulletCount || 12);
        for (let i = 0; i < bulletCount; i++) this.spawnTheGreatBullet({
            x: friend.x,
            y: friend.y,
            angle: i * Math.PI * 2 / bulletCount,
            owner: friend.craftrasOwner || friend,
            speed: CRAFTRAS_THE_SWORD_BULLET_SPEED / 1.5,
        });
        this.spawnExplosionEffect({ x: friend.x, y: friend.y }, { duration: 360, startSize: 18, growth: 0.035, color: "#fff4b8", alpha: 0.34 });
        friend.destroy();
        this.theGreatProjectiles.delete(friend);
    }

    updateCreeper(mob, nearest, now) {
        const isAnnihilator = mob.craftrasMobType === "annihilator";
        const baseSize = isAnnihilator ? 72 : 24;
        const fuseDuration = isAnnihilator ? CRAFTRAS_ANNIHILATOR_FUSE : 1500;
        const primeRange = 150;
        const cancelRange = primeRange * 2;
        if (!mob.craftrasPrimeStarted) {
            if (nearest.distance > primeRange) return;
            mob.craftrasPrimeStarted = now;
            mob.craftrasNextFlashAt = now;
        } else if (!isAnnihilator && nearest.distance > cancelRange) {
            mob.craftrasPrimeStarted = 0;
            mob.SIZE = baseSize;
            mob.coreSize = baseSize;
            mob.sizeMultiplier = 1;
            mob.color.base = mob.craftrasBaseColor;
            mob.alpha = 1;
            return;
        }

        mob.velocity.x *= 0.5;
        mob.velocity.y *= 0.5;
        mob.craftrasControl.goal = { x: mob.x, y: mob.y };
        mob.craftrasControl.power = 0;
        const progress = Math.min(1, (now - mob.craftrasPrimeStarted) / fuseDuration);
        const growth = isAnnihilator ? 3 : 0.18;
        const size = baseSize * (1 + progress * growth);
        mob.SIZE = size;
        mob.coreSize = size;
        mob.sizeMultiplier = 1;
        if (now >= mob.craftrasNextFlashAt) {
            mob.craftrasNextFlashAt = now + Math.max(70, 220 - progress * 150);
            mob.craftrasPrimeWhite = !mob.craftrasPrimeWhite;
            mob.color.base = mob.craftrasPrimeWhite ? "#ffffff" : mob.craftrasBaseColor;
        }
        if (progress >= 1) {
            if (isAnnihilator) this.explodeAnnihilator(mob);
            else this.explodeCreeper(mob);
        }
    }

    updateTimedExploder(mob, now) {
        if (!mob || mob.craftrasExploded || !mob.craftrasFuseStarted) return false;
        const duration = mob.craftrasFuseDuration || CRAFTRAS_ANNIHILATOR_FUSE;
        const progress = Math.max(0, Math.min(1, (now - mob.craftrasFuseStarted) / duration));
        const startSize = mob.craftrasSpawnSize || (mob.craftrasMobType === "the_nuclear" ? 72 : 48);
        const finalSize = mob.craftrasFinalSize || startSize;
        const size = startSize + (finalSize - startSize) * progress;
        mob.SIZE = size;
        mob.coreSize = size;
        mob.sizeMultiplier = 1;

        if (mob.craftrasMobType === "the_nuclear") {
            mob.velocity.x = 0;
            mob.velocity.y = 0;
            mob.craftrasControl.goal = { x: mob.x, y: mob.y };
            mob.craftrasControl.power = 0;
            const colors = ["#ff3030", "#2f6bff", "#35d860"];
            mob.color.base = colors[Math.floor(now / 500) % colors.length];
        } else if (now >= (mob.craftrasNextFlashAt || 0)) {
            mob.craftrasNextFlashAt = now + Math.max(80, 500 - progress * 360);
            mob.craftrasPrimeWhite = !mob.craftrasPrimeWhite;
            mob.color.base = mob.craftrasPrimeWhite ? "#ffffff" : mob.craftrasBaseColor;
        }

        if (progress < 1) return false;
        if (mob.craftrasMobType === "the_nuclear") this.explodeNuclear(mob);
        else this.explodeAnnihilator(mob);
        return true;
    }

    accelerateNuclearFuses(multiplier = 60) {
        const now = Date.now();
        const speed = Math.max(1, Number(multiplier) || 60);
        let accelerated = 0;
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.() || mob.craftrasMobType !== "the_nuclear" || mob.craftrasExploded) continue;
            const duration = mob.craftrasFuseDuration || CRAFTRAS_NUCLEAR_FUSE;
            const started = mob.craftrasFuseStarted || now;
            const elapsed = Math.max(0, now - started);
            const remaining = Math.max(0, duration - elapsed);
            mob.craftrasFuseStarted = now - Math.max(0, duration - remaining / speed);
            accelerated++;
        }
        return accelerated;
    }

    getBlockHealth(x, y) {
        const block = this.getBlock(x, y);
        return this.damagedWallHealth.get(this.wallKey(x, y)) ?? BLOCK_HEALTH[block] ?? 0;
    }

    explosionBlockAbsorption(from, target) {
        const distance = Math.hypot(target.x - from.x, target.y - from.y);
        const steps = Math.max(1, Math.ceil(distance / (BLOCK_SIZE * 0.35)));
        const seen = new Set();
        let absorption = 0;
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const cell = worldToBlock(from.x + (target.x - from.x) * t, from.y + (target.y - from.y) * t);
            const key = this.wallKey(cell.x, cell.y);
            if (seen.has(key) || this.getBlock(cell.x, cell.y) === BLOCKS.AIR) continue;
            seen.add(key);
            absorption += this.getBlockHealth(cell.x, cell.y);
        }
        return absorption;
    }

    damageBlockAt(x, y, damage, options = {}) {
        if (Config.craftras_world1_challenge_builder) return false;
        const block = this.getBlock(x, y);
        if (block === BLOCKS.AIR || isTextStoryBlock(block) || damage <= 0) return false;
        const suppressDrops = !!options.suppressDrops || isBrokenKingdomSurfaceCell(x, y);
        const key = this.wallKey(x, y);
        const maxHealth = BLOCK_HEALTH[block] ?? 100;
        const health = (this.damagedWallHealth.get(key) ?? maxHealth) - damage;
        if (!options.suppressShake) this.broadcastBlockShake(x, y);
        if (health > 0) {
            this.damagedWallHealth.set(key, health);
            this.damagedWallLastHitAt.set(key, Date.now());
            this.broadcastBlockUpdate(x, y, this.getBlockRenderCode(x, y));
            return false;
        }
        const location = blockToWorld(x, y);
        this.damagedWallHealth.delete(key);
        this.damagedWallLastHitAt.delete(key);
        this.permanentBlockDamageStages.delete(key);
        const villageRepair = this.registerVillageRepairJob(x, y, block);
        this.destroyedWallKeys.add(key);
        this.placedBlocks.delete(key);
        this.placedBlockDirections.delete(key);
        if (block === BLOCKS.ROUTE_MARKER) this.routeMarkerRevision++;
        if (suppressDrops) {
            this.furnaces.delete(key);
            if (this.chests.has(key)) {
                for (const socket of this.gameManager.clients) {
                    if (socket.craftrasChestKey === key) this.gameManager.socketManager.closeCraftrasChest(socket);
                }
                this.chests.delete(key);
            }
        } else if (!villageRepair) {
            this.dropStationContents(key, location);
            this.spawnItemDrop(block, location);
        }
        const tree = this.loadedTrees.get(key);
        if (tree) {
            tree.kill?.();
            this.loadedTrees.delete(key);
        }
        this.broadcastBlockUpdate(x, y, 0, { immediate: !!options.suppressHitEffect });
        return true;
    }

    damageFloorAt(x, y, damage, options = {}) {
        if (Config.craftras_world1_challenge_builder) return false;
        const floor = this.getFloor(x, y);
        if (floor === BLOCKS.AIR || damage <= 0) return false;
        const key = this.wallKey(x, y);
        const maxHealth = BLOCK_HEALTH[floor] ?? 50;
        const health = (this.damagedFloorHealth.get(key) ?? maxHealth) - damage;
        if (!options.suppressShake) this.broadcastBlockShake(x, y);
        if (health > 0) {
            this.damagedFloorHealth.set(key, health);
            this.broadcastFloorUpdate(x, y, this.getFloorRenderCode(x, y));
            return false;
        }
        this.damagedFloorHealth.delete(key);
        this.placedFloors.delete(key);
        this.broadcastFloorUpdate(x, y, 0);
        return true;
    }

    spawnExplosionEffect(location, options = {}) {
        const effect = new Entity(location);
        effect.define("craftrasExplosionEffect");
        effect.team = TEAM_ROOM;
        effect.craftrasExplosionStarted = Date.now();
        effect.craftrasExplosionDuration = options.duration || 500;
        effect.craftrasExplosionStartSize = options.startSize || 10;
        effect.craftrasExplosionEndSize = options.endSize;
        effect.craftrasExplosionGrowth = options.growth || 0.5;
        effect.craftrasExplosionStartAlpha = options.alpha != null ? options.alpha : effect.alpha;
        effect.craftrasExplosionFade = !!options.fade;
        effect.SIZE = effect.craftrasExplosionStartSize;
        effect.coreSize = effect.craftrasExplosionStartSize;
        effect.sizeMultiplier = 1;
        if (options.color) effect.color.base = options.color;
        if (options.alpha != null) effect.alpha = options.alpha;
        this.explosionEffects.add(effect);
        return effect;
    }

    updateExplosionEffects(now) {
        for (const effect of this.explosionEffects) {
            if (!effect || effect.isDead?.()) {
                this.explosionEffects.delete(effect);
                continue;
            }
            const elapsed = now - effect.craftrasExplosionStarted;
            const duration = effect.craftrasExplosionDuration || 500;
            const progress = Math.max(0, Math.min(1, elapsed / duration));
            if (elapsed >= duration) {
                effect.destroy();
                this.explosionEffects.delete(effect);
                continue;
            }
            const size = Number.isFinite(effect.craftrasExplosionEndSize)
                ? (effect.craftrasExplosionStartSize || 10) + (effect.craftrasExplosionEndSize - (effect.craftrasExplosionStartSize || 10)) * progress
                : (effect.craftrasExplosionStartSize || 10) + elapsed * (effect.craftrasExplosionGrowth || 0.5);
            effect.SIZE = size;
            effect.coreSize = size;
            effect.sizeMultiplier = 1;
            if (effect.craftrasExplosionFade) effect.alpha = Math.max(0, (effect.craftrasExplosionStartAlpha ?? 0.45) * (1 - progress));
        }
    }

    spawnMobDeathEffect(mob) {
        if (!mob || mob.craftrasDeathEffectSpawned) return;
        mob.craftrasDeathEffectSpawned = true;
        const startSize = Math.max(10, mob.realSize || mob.size || mob.SIZE || 18);
        this.spawnExplosionEffect({ x: mob.x, y: mob.y }, {
            duration: 750,
            startSize: startSize * 1.05,
            endSize: startSize * 0.38,
            color: mob.color?.base || mob.craftrasBaseColor || "#d9dde1",
            alpha: 0.42,
            fade: true,
        });
    }

    fireRocketLauncher(body) {
        if (!body || body.isDead?.() || body.craftrasHeldItem !== "rocket_launcher") return false;
        const angle = body.facing || 0;
        const offset = (body.realSize || body.size || 20) + 18;
        const rocket = new Entity({
            x: body.x + Math.cos(angle) * offset,
            y: body.y + Math.sin(angle) * offset,
        });
        rocket.define("craftrasRocketBullet");
        rocket.team = body.team;
        rocket.master = body;
        rocket.source = body;
        rocket.parent = body;
        rocket.facing = angle;
        rocket.velocity.x = Math.cos(angle) * 18;
        rocket.velocity.y = Math.sin(angle) * 18;
        rocket.craftrasRocketOwner = body;
        rocket.craftrasRocketExpiresAt = Date.now() + 10_000;
        rocket.alwaysActive = true;
        rocket.on("dead", () => this.rocketProjectiles.delete(rocket));
        this.rocketProjectiles.add(rocket);
        return true;
    }

    updateRocketProjectiles(now) {
        for (const rocket of this.rocketProjectiles) {
            if (!rocket || rocket.isDead?.()) {
                this.rocketProjectiles.delete(rocket);
                continue;
            }
            if (now >= rocket.craftrasRocketExpiresAt) {
                rocket.destroy();
                this.rocketProjectiles.delete(rocket);
                continue;
            }
            const block = worldToBlock(rocket.x, rocket.y);
            if (this.isMovementBlockingBlock(this.getBlock(block.x, block.y))) {
                this.explodeRocket(rocket);
                continue;
            }
            const rocketRadius = Math.max(4, rocket.realSize || rocket.size || 8);
            let hit = false;
            for (const mob of this.mobs) {
                if (!mob || mob.isDead?.()) continue;
                const hitRadius = rocketRadius + Math.max(4, mob.realSize || mob.size || 12);
                if ((rocket.x - mob.x) ** 2 + (rocket.y - mob.y) ** 2 <= hitRadius ** 2) {
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                for (const { body } of this.getLivingPlayers()) {
                    if (!body || body === rocket.craftrasRocketOwner) continue;
                    const hitRadius = rocketRadius + Math.max(4, body.realSize || body.size || 12);
                    if ((rocket.x - body.x) ** 2 + (rocket.y - body.y) ** 2 <= hitRadius ** 2) {
                        hit = true;
                        break;
                    }
                }
            }
            if (hit) this.explodeRocket(rocket);
        }
    }

    updateBoneBombProjectiles(now) {
        for (const bomb of this.boneBombProjectiles) {
            if (!bomb || bomb.isDead?.()) {
                this.boneBombProjectiles.delete(bomb);
                continue;
            }
            bomb.facing = (bomb.facing || 0) + 0.55;
            if (now >= bomb.craftrasBoneBombExpiresAt) {
                this.explodeBoneBomb(bomb);
                continue;
            }
            const block = worldToBlock(bomb.x, bomb.y);
            if (this.isMovementBlockingBlock(this.getBlock(block.x, block.y))) {
                this.explodeBoneBomb(bomb);
                continue;
            }
            const bombRadius = Math.max(6, bomb.realSize || bomb.size || 12);
            let hit = false;
            for (const mob of this.mobs) {
                if (!mob || mob.isDead?.()) continue;
                const hitRadius = bombRadius + Math.max(4, mob.realSize || mob.size || 12);
                if ((bomb.x - mob.x) ** 2 + (bomb.y - mob.y) ** 2 <= hitRadius ** 2) {
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                for (const { body } of this.getLivingPlayers()) {
                    if (!body || body === bomb.craftrasBoneBombOwner) continue;
                    const hitRadius = bombRadius + Math.max(4, body.realSize || body.size || 12);
                    if ((bomb.x - body.x) ** 2 + (bomb.y - body.y) ** 2 <= hitRadius ** 2) {
                        hit = true;
                        break;
                    }
                }
            }
            if (hit) this.explodeBoneBomb(bomb);
        }
    }

    explodeRocket(rocket) {
        if (!rocket || rocket.craftrasExploded) return;
        rocket.craftrasExploded = true;
        const origin = { x: rocket.x, y: rocket.y };
        const owner = rocket.craftrasRocketOwner;
        const radius = BLOCK_SIZE * 8;
        const maxDamage = 1000;
        for (const { body } of this.getLivingPlayers()) {
            if (!body || body === owner) continue;
            const distance = Math.hypot(body.x - origin.x, body.y - origin.y);
            if (distance > radius) continue;
            const rawDamage = maxDamage * (1 - distance / radius);
            const damage = Math.max(0, rawDamage - this.explosionBlockAbsorption(origin, body));
            if (damage > 0) this.applyPlayerDamage(body, damage, owner || rocket);
        }
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.()) continue;
            const distance = Math.hypot(mob.x - origin.x, mob.y - origin.y);
            if (distance > radius) continue;
            const rawDamage = maxDamage * (1 - distance / radius);
            let damage = Math.max(0, rawDamage - this.explosionBlockAbsorption(origin, mob));
            damage = this.capKingDamageByGuardian(mob, damage);
            if (damage <= 0) continue;
            if (mob.craftrasMobFamily === "npc") {
                this.applyVillageCombatNpcDamage(mob, damage, owner || rocket);
                continue;
            }
            if (mob.craftrasInvulnerableNpc) {
                if (mob.health) mob.health.amount = mob.health.max;
                continue;
            }
            if (this.tryGuardianLastStand(mob, damage)) {
                this.flashEntity(mob, 350);
                continue;
            }
            mob.health.amount -= damage;
            if (owner) this.setMobAggro(mob, owner);
            this.handleSwordGuyDamaged(mob, damage, owner || rocket);
            this.flashEntity(mob);
            if (mob.health.amount <= 0) {
                if (owner) this.awardCraftrasScore(owner, (MOB_SCORES[mob.craftrasMobType] || 0) * (mob.craftrasScoreMultiplier || 1));
                this.mobs.delete(mob);
                mob.kill?.();
            }
        }
        const center = worldToBlock(origin.x, origin.y);
        for (let y = center.y - 8; y <= center.y + 8; y++) {
            for (let x = center.x - 8; x <= center.x + 8; x++) {
                const location = blockToWorld(x, y);
                const distance = Math.hypot(location.x - origin.x, location.y - origin.y);
                if (distance <= radius) this.damageBlockAt(x, y, maxDamage * (1 - distance / radius));
            }
        }
        this.spawnExplosionEffect(origin, { duration: 500, startSize: 10, growth: 1 });
        this.rocketProjectiles.delete(rocket);
        rocket.destroy();
    }

    explodeBoneBomb(bomb) {
        if (!bomb || bomb.craftrasExploded) return;
        bomb.craftrasExploded = true;
        const origin = { x: bomb.x, y: bomb.y };
        const owner = bomb.craftrasBoneBombOwner;
        const radiusBlocks = 4;
        const radius = BLOCK_SIZE * radiusBlocks;
        const maxDamage = 100;
        for (const { body } of this.getLivingPlayers()) {
            if (!body || body === owner) continue;
            const distance = Math.hypot(body.x - origin.x, body.y - origin.y);
            if (distance > radius) continue;
            const rawDamage = maxDamage * (1 - distance / radius);
            const damage = Math.max(0, rawDamage - this.explosionBlockAbsorption(origin, body));
            if (damage > 0) this.applyPlayerDamage(body, damage, owner || bomb);
        }
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.()) continue;
            const distance = Math.hypot(mob.x - origin.x, mob.y - origin.y);
            if (distance > radius) continue;
            const rawDamage = maxDamage * (1 - distance / radius);
            let damage = Math.max(0, rawDamage - this.explosionBlockAbsorption(origin, mob));
            damage = this.capKingDamageByGuardian(mob, damage);
            if (damage <= 0) continue;
            if (mob.craftrasMobFamily === "npc") {
                this.applyVillageCombatNpcDamage(mob, damage, owner || bomb);
                continue;
            }
            if (mob.craftrasInvulnerableNpc) {
                if (mob.health) mob.health.amount = mob.health.max;
                continue;
            }
            if (this.tryGuardianLastStand(mob, damage)) {
                this.flashEntity(mob, 350);
                continue;
            }
            mob.health.amount -= damage;
            if (owner) this.setMobAggro(mob, owner);
            this.handleSwordGuyDamaged(mob, damage, owner || bomb);
            this.flashEntity(mob);
            if (mob.health.amount <= 0) {
                if (owner) this.awardCraftrasScore(owner, (MOB_SCORES[mob.craftrasMobType] || 0) * (mob.craftrasScoreMultiplier || 1));
                this.mobs.delete(mob);
                mob.kill?.();
            }
        }
        const center = worldToBlock(origin.x, origin.y);
        for (let y = center.y - radiusBlocks; y <= center.y + radiusBlocks; y++) {
            for (let x = center.x - radiusBlocks; x <= center.x + radiusBlocks; x++) {
                const location = blockToWorld(x, y);
                const distance = Math.hypot(location.x - origin.x, location.y - origin.y);
                if (distance <= radius) this.damageBlockAt(x, y, maxDamage * (1 - distance / radius));
            }
        }
        this.spawnExplosionEffect(origin, { duration: 420, startSize: 9, growth: 0.8, color: "#d9dde2", alpha: 0.5 });
        this.boneBombProjectiles.delete(bomb);
        bomb.destroy();
    }

    explodeAnnihilator(mob) {
        this.explodeCreeperLike(mob, {
            radiusBlocks: 12,
            damage: 1000,
            blockDamage: 1000,
            effect: { duration: 900, startSize: 24, growth: 2.4, color: "#f4d35e", alpha: 0.55 },
        });
    }

    queueNuclearBlockDamage(center) {
        const radiusBlocks = CRAFTRAS_NUCLEAR_RADIUS_BLOCKS;
        const radiusSquared = radiusBlocks * radiusBlocks;
        for (let y = center.y - radiusBlocks; y <= center.y + radiusBlocks; y++) {
            const dy = y - center.y;
            for (let x = center.x - radiusBlocks; x <= center.x + radiusBlocks; x++) {
                const dx = x - center.x;
                if (dx * dx + dy * dy > radiusSquared) continue;
                const key = this.wallKey(x, y);
                if (this.destroyerQueuedBlockKeys.has(key) || this.getBlock(x, y) === BLOCKS.AIR) continue;
                this.destroyerQueuedBlockKeys.add(key);
                this.destroyerQueue.push({ x, y, key });
            }
        }
    }

    explodeNuclear(mob) {
        if (!mob || mob.craftrasExploded) return;
        mob.craftrasExploded = true;
        const origin = { x: mob.x, y: mob.y };
        const radius = CRAFTRAS_NUCLEAR_RADIUS_BLOCKS * BLOCK_SIZE;
        const maxDamage = CRAFTRAS_NUCLEAR_DAMAGE;
        for (const { body } of this.getLivingPlayers()) {
            const distance = Math.hypot(body.x - origin.x, body.y - origin.y);
            if (distance > radius) continue;
            body.health.amount = 0;
            body.craftrasLastDamageAt = Date.now();
            body.craftrasNextRegenAt = body.craftrasLastDamageAt + 10000;
            this.flashEntity(body, 600);
            const dx = body.x - origin.x;
            const dy = body.y - origin.y;
            const pushDistance = Math.hypot(dx, dy) || 1;
            const push = 90 * (1 - distance / radius);
            body.velocity.x += dx / pushDistance * push;
            body.velocity.y += dy / pushDistance * push;
            body.kill?.();
        }
        for (const other of this.mobs) {
            if (!other || other === mob || other.isDead?.()) continue;
            const distance = Math.hypot(other.x - origin.x, other.y - origin.y);
            if (distance > radius) continue;
            let damage = maxDamage * (1 - distance / radius);
            damage = this.capKingDamageByGuardian(other, damage);
            if (other.craftrasMobFamily === "npc") {
                this.applyVillageCombatNpcDamage(other, damage, mob);
                continue;
            }
            if (other.craftrasInvulnerableNpc) continue;
            other.health.amount -= damage;
            this.handleSwordGuyDamaged(other, damage, mob);
            this.flashEntity(other);
            if (other.health.amount <= 0) {
                this.mobs.delete(other);
                other.kill?.();
            }
        }
        this.queueNuclearBlockDamage(worldToBlock(origin.x, origin.y));
        this.spawnExplosionEffect(origin, { duration: 4200, startSize: 90, growth: 18, color: "#ff3030", alpha: 0.82 });
        for (const socket of this.gameManager.clients) {
            socket?.talk?.("SH", JSON.stringify({ type: "camera", duration: 5000, amount: 160, keepShake: false }));
            socket?.talk?.("SH", JSON.stringify({ type: "gui", duration: 3200, amount: 55, keepShake: false }));
        }
        this.scheduleNuclearArenaBuild();
        this.spawnMobDeathEffect(mob);
        this.mobs.delete(mob);
        mob.destroy();
    }

    explodeCreeperLike(mob, options = {}) {
        if (!mob || mob.craftrasExploded) return;
        mob.craftrasExploded = true;
        const origin = { x: mob.x, y: mob.y };
        const radiusBlocks = options.radiusBlocks || 4;
        const radius = BLOCK_SIZE * radiusBlocks;
        const maxDamage = options.damage || 210;
        const blockDamage = options.blockDamage || maxDamage;
        for (const { body } of this.getLivingPlayers()) {
            const distance = Math.hypot(body.x - origin.x, body.y - origin.y);
            if (distance > radius) continue;
            const rawDamage = maxDamage * (1 - distance / radius);
            const damage = Math.max(0, rawDamage - this.explosionBlockAbsorption(origin, body));
            this.applyPlayerDamage(body, damage, mob);
        }
        for (const other of this.mobs) {
            if (!other || other === mob || other.isDead?.()) continue;
            const distance = Math.hypot(other.x - origin.x, other.y - origin.y);
            if (distance > radius) continue;
            const rawDamage = maxDamage * (1 - distance / radius);
            let damage = Math.max(0, rawDamage - this.explosionBlockAbsorption(origin, other));
            damage = this.capKingDamageByGuardian(other, damage);
            if (damage <= 0) continue;
            if (other.craftrasMobFamily === "npc") {
                this.applyVillageCombatNpcDamage(other, damage, mob);
                continue;
            }
            if (other.craftrasInvulnerableNpc) {
                if (other.health) other.health.amount = other.health.max;
                continue;
            }
            if (this.tryGuardianLastStand(other, damage)) {
                this.flashEntity(other, 350);
                continue;
            }
            other.health.amount -= damage;
            this.handleSwordGuyDamaged(other, damage, mob);
            this.flashEntity(other);
            const dx = other.x - origin.x;
            const dy = other.y - origin.y;
            const pushDistance = Math.hypot(dx, dy) || 1;
            other.velocity.x += dx / pushDistance * Math.min(36, radiusBlocks * 4.5);
            other.velocity.y += dy / pushDistance * Math.min(36, radiusBlocks * 4.5);
            if (other.health.amount <= 0) {
                this.mobs.delete(other);
                other.kill?.();
            }
        }
        const center = worldToBlock(origin.x, origin.y);
        for (let y = center.y - radiusBlocks; y <= center.y + radiusBlocks; y++) {
            for (let x = center.x - radiusBlocks; x <= center.x + radiusBlocks; x++) {
                const location = blockToWorld(x, y);
                const distance = Math.hypot(location.x - origin.x, location.y - origin.y);
                if (distance <= radius) this.damageBlockAt(x, y, blockDamage * (1 - distance / radius));
            }
        }
        this.spawnExplosionEffect(origin, options.effect || {});
        this.spawnMobDeathEffect(mob);
        this.mobs.delete(mob);
        mob.destroy();
    }

    isCraftrasM134Bullet(entity) {
        return entity?.type === "bullet" && (entity.label || "").includes("Craftras M134 Bullet");
    }

    isCraftrasSkeletonBullet(entity) {
        return entity?.type === "bullet" && (entity.label || "").includes("Craftras Skeleton Bullet");
    }

    updateCraftrasM134Projectiles() {
        const m134Bullets = [];
        const skeletonBullets = [];
        for (const entity of entities.values()) {
            if (!entity || entity.isDead?.() || entity.type !== "bullet") continue;
            if (this.isCraftrasM134Bullet(entity)) {
                m134Bullets.push(entity);
                const cell = worldToBlock(entity.x, entity.y);
                if (this.isMovementBlockingBlock(this.getBlock(cell.x, cell.y))) {
                    this.damageBlockAt(cell.x, cell.y, 5);
                    if (entity.health) entity.health.amount -= 5;
                    if (entity.health?.amount <= 0) entity.kill?.();
                }
            } else if (this.isCraftrasSkeletonBullet(entity)) {
                skeletonBullets.push(entity);
            }
        }

        if (!m134Bullets.length || !skeletonBullets.length) return;
        for (const m134 of m134Bullets) {
            if (!m134 || m134.isDead?.()) continue;
            const m134Radius = Math.max(1, m134.realSize || m134.size || 1);
            for (const skeleton of skeletonBullets) {
                if (!skeleton || skeleton.isDead?.()) continue;
                const hitRadius = m134Radius + Math.max(1, skeleton.realSize || skeleton.size || 1);
                const dx = m134.x - skeleton.x;
                const dy = m134.y - skeleton.y;
                if (dx * dx + dy * dy > hitRadius * hitRadius) continue;
                skeleton.kill?.();
                if (m134.health) m134.health.amount -= 20;
                if (m134.health?.amount <= 0) m134.kill?.();
                break;
            }
        }
    }

    explodeCreeper(mob) {
        return this.explodeCreeperLike(mob, {
            radiusBlocks: 4,
            damage: 210,
            blockDamage: 210,
        });
        if (!mob || mob.craftrasExploded) return;
        mob.craftrasExploded = true;
        const origin = { x: mob.x, y: mob.y };
        const radius = BLOCK_SIZE * 4;
        for (const { body } of this.getLivingPlayers()) {
            const distance = Math.hypot(body.x - origin.x, body.y - origin.y);
            if (distance > radius) continue;
            const rawDamage = 210 * (1 - distance / radius);
            const damage = Math.max(0, rawDamage - this.explosionBlockAbsorption(origin, body));
            this.applyPlayerDamage(body, damage, mob);
        }
        for (const other of this.mobs) {
            if (!other || other === mob || other.isDead?.()) continue;
            const distance = Math.hypot(other.x - origin.x, other.y - origin.y);
            if (distance > radius) continue;
            const rawDamage = 210 * (1 - distance / radius);
            let damage = Math.max(0, rawDamage - this.explosionBlockAbsorption(origin, other));
            damage = this.capKingDamageByGuardian(other, damage);
            if (damage <= 0) continue;
            if (other.craftrasMobFamily === "npc") {
                this.applyVillageCombatNpcDamage(other, damage, mob);
                continue;
            }
            if (other.craftrasInvulnerableNpc) {
                if (other.health) other.health.amount = other.health.max;
                continue;
            }
            if (this.tryGuardianLastStand(other, damage)) {
                this.flashEntity(other, 350);
                continue;
            }
            other.health.amount -= damage;
            this.handleSwordGuyDamaged(other, damage, mob);
            this.flashEntity(other);
            const dx = other.x - origin.x;
            const dy = other.y - origin.y;
            const pushDistance = Math.hypot(dx, dy) || 1;
            other.velocity.x += dx / pushDistance * 18;
            other.velocity.y += dy / pushDistance * 18;
            if (other.health.amount <= 0) {
                this.mobs.delete(other);
                other.kill?.();
            }
        }
        const center = worldToBlock(origin.x, origin.y);
        for (let y = center.y - 4; y <= center.y + 4; y++) {
            for (let x = center.x - 4; x <= center.x + 4; x++) {
                const location = blockToWorld(x, y);
                const distance = Math.hypot(location.x - origin.x, location.y - origin.y);
                if (distance <= radius) this.damageBlockAt(x, y, 210 * (1 - distance / radius));
            }
        }
        this.spawnExplosionEffect(origin);
        this.mobs.delete(mob);
        mob.destroy();
    }

    getDestroyerAreaCenter(body, toolSegments) {
        let best = null;
        let bestDistance = -1;
        for (const segment of toolSegments || []) {
            for (const point of [
                { x: segment.startX, y: segment.startY },
                { x: segment.endX, y: segment.endY },
            ]) {
                const distance = (point.x - body.x) ** 2 + (point.y - body.y) ** 2;
                if (distance <= bestDistance) continue;
                bestDistance = distance;
                best = point;
            }
        }
        return worldToBlock(best?.x ?? body.x, best?.y ?? body.y);
    }

    damageDestroyerArea(body, toolSegments) {
        const onceKey = "__destroyer_area__";
        body.craftrasMiningHitKeys ??= new Set();
        if (body.craftrasMiningHitKeys.has(onceKey)) return;
        body.craftrasMiningHitKeys.add(onceKey);
        const center = this.getDestroyerAreaCenter(body, toolSegments);
        const half = 50;
        for (let y = center.y - half; y < center.y + half; y++) {
            for (let x = center.x - half; x < center.x + half; x++) {
                const key = this.wallKey(x, y);
                if (this.destroyerQueuedBlockKeys.has(key) || this.getBlock(x, y) === BLOCKS.AIR) continue;
                this.destroyerQueuedBlockKeys.add(key);
                this.destroyerQueue.push({ x, y, key });
            }
        }
    }

    processDestroyerQueue() {
        if (this.destroyerQueueIndex >= this.destroyerQueue.length) return;
        for (let i = 0; i < DESTROYER_BLOCKS_PER_TICK && this.destroyerQueueIndex < this.destroyerQueue.length; i++) {
            const job = this.destroyerQueue[this.destroyerQueueIndex++];
            this.destroyerQueuedBlockKeys.delete(job.key);
            this.damageBlockAt(job.x, job.y, 1e100, { suppressDrops: true, suppressShake: true, suppressHitEffect: true });
        }
        if (this.destroyerQueueIndex >= this.destroyerQueue.length) {
            this.destroyerQueue = [];
            this.destroyerQueueIndex = 0;
        }
    }

    damageWallsInSlash(body, { toolSegments, damage = 100 }) {
        if (Config.craftras_world1_challenge_builder || !body || body.craftrasSpectator || !toolSegments?.length) return;
        if (body.craftrasHeldItem === "destroyer") {
            this.damageDestroyerArea(body, toolSegments);
            return;
        }
        const center = worldToBlock(body.x, body.y);
        let maxReach = 0;
        for (const segment of toolSegments) {
            maxReach = Math.max(
                maxReach,
                Math.hypot(segment.startX - body.x, segment.startY - body.y) + segment.radius,
                Math.hypot(segment.endX - body.x, segment.endY - body.y) + segment.radius,
            );
        }
        const blockRadius = Math.ceil((maxReach + WALL_SIZE * 0.5) / BLOCK_SIZE) + 1;
        body.craftrasMiningHitKeys ??= new Set();

        for (let y = center.y - blockRadius; y <= center.y + blockRadius; y++) {
            for (let x = center.x - blockRadius; x <= center.x + blockRadius; x++) {
                const key = this.wallKey(x, y);
                if (body.craftrasMiningHitKeys.has(key)) continue;
                const block = this.getBlock(x, y);
                const location = blockToWorld(x, y);
                if (!toolSegments.some(segment => this.toolSegmentHitsBlock(segment, x, y))) continue;
                if (isTextStoryBlock(block)) continue;
                if (block === BLOCKS.AIR) {
                    if (!Config.craftras_village_builder || this.getFloor(x, y) === BLOCKS.AIR) continue;
                    body.craftrasMiningHitKeys.add(key);
                    const heldItem = body.craftrasHeldItem || "";
                    const floorDamage = heldItem === "admin_pickaxe" ? 1e100 : heldItem.endsWith("_shovel") ? damage * 2 : damage;
                    this.damageFloorAt(x, y, floorDamage);
                    continue;
                }

                const builderDemolition = body.craftrasMobType === "builder" && body.craftrasBuilderJobMode === "demolish";
                if (builderDemolition) {
                    if (key !== body.craftrasDemolitionJobKey) continue;
                    const original = this.villageOriginalBlocks.get(key);
                    if (original?.type === block) continue;
                }

                body.craftrasMiningHitKeys.add(key);
                const maxHealth = BLOCK_HEALTH[block] ?? 100;
                const heldItem = body.craftrasHeldItem || "";
                const correctTool = heldItem.endsWith("_axe") ? AXE_BLOCKS.has(block)
                    : heldItem.endsWith("_pickaxe") ? PICKAXE_BLOCKS.has(block)
                    : heldItem.endsWith("_shovel") ? SHOVEL_BLOCKS.has(block)
                    : false;
                const effectiveDamage = builderDemolition ? VILLAGE_BUILDER_BLOCK_DAMAGE : heldItem === "admin_pickaxe" ? damage : correctTool ? damage * 2 : 10;
                const harvestLevel = BLOCK_HARVEST_LEVEL[block] ?? 1;
                const canHarvest = ALWAYS_HARVESTABLE_BLOCKS.has(block)
                    || correctTool && harvestLevel <= getToolHarvestLevel(heldItem) + 1;
                const health = (this.damagedWallHealth.get(key) ?? maxHealth) - effectiveDamage;
                this.broadcastBlockShake(x, y);
                if (health > 0) {
                    this.damagedWallHealth.set(key, health);
                    this.damagedWallLastHitAt.set(key, Date.now());
                    this.broadcastBlockUpdate(x, y, this.getBlockRenderCode(x, y));
                    const tree = this.loadedTrees.get(key);
                    if (tree) {
                        tree.health.amount = tree.health.max * health / maxHealth;
                        tree.damageReceived = Math.max(tree.damageReceived || 0, 0.01);
                    }
                    continue;
                }

                this.broadcastBlockUpdate(x, y, (BLOCK_CODES[block] ?? 0) | (3 << 5));
                const villageRepair = this.registerVillageRepairJob(x, y, block);
                const suppressKingdomBlockDrop = isBrokenKingdomSurfaceCell(x, y);
                if (!builderDemolition && !villageRepair && canHarvest) this.awardCraftrasScore(body, BLOCK_SCORES[block] || 0);
                this.damagedWallHealth.delete(key);
                this.damagedWallLastHitAt.delete(key);
                this.permanentBlockDamageStages.delete(key);
                this.destroyedWallKeys.add(key);
                this.placedBlocks.delete(key);
                this.placedBlockDirections.delete(key);
                if (block === BLOCKS.ROUTE_MARKER) this.routeMarkerRevision++;
                if (builderDemolition) {
                    this.furnaces.delete(key);
                    if (this.chests.has(key)) {
                        for (const socket of this.gameManager.clients) {
                            if (socket.craftrasChestKey === key) this.gameManager.socketManager.closeCraftrasChest(socket);
                        }
                        this.chests.delete(key);
                    }
                } else if (!villageRepair) {
                    this.dropStationContents(key, location);
                    if (canHarvest && !suppressKingdomBlockDrop) this.spawnItemDrop(block, location);
                }
                const tree = this.loadedTrees.get(key);
                if (tree) {
                    tree.kill?.();
                    this.loadedTrees.delete(key);
                }
                this.broadcastBlockUpdate(x, y, 0);
            }
        }
    }

    resolvePlayerBlockCollisions() {
        for (const socket of this.gameManager.clients) {
            const body = socket?.player?.body;
            if (!body || body.isDead?.() || body.ac || body.craftrasCreativeFlight || body.craftrasSpectator) continue;
            this.resolveBodyBlockCollisions(body);
        }
        for (const mob of this.mobs) {
            if (!mob || mob.isDead?.()) continue;
            if (mob.craftrasFinalDashPhasing) continue;
            this.resolveBodyBlockCollisions(mob);
        }
    }

    resolveItemDropBlockCollisions() {
        if (!this.itemDrops.size) return;
        const halfWall = WALL_SIZE * 0.5;
        for (const drop of this.itemDrops) {
            if (!drop || drop.isDead?.()) continue;
            const radius = Math.max(1, drop.realSize || drop.size || 1);
            const blockRadius = Math.ceil((radius + halfWall) / BLOCK_SIZE) + 1;

            // Dropped items are intangible entities, so Craftras data blocks need
            // their own collision response.
            for (let pass = 0; pass < 2; pass++) {
                const center = worldToBlock(drop.x, drop.y);
                let moved = false;
                for (let y = center.y - blockRadius; y <= center.y + blockRadius; y++) {
                    for (let x = center.x - blockRadius; x <= center.x + blockRadius; x++) {
                        if (!this.isMovementBlockingBlock(this.getBlock(x, y))) continue;
                        const wall = blockToWorld(x, y);
                        const nearestX = Math.max(wall.x - halfWall, Math.min(drop.x, wall.x + halfWall));
                        const nearestY = Math.max(wall.y - halfWall, Math.min(drop.y, wall.y + halfWall));
                        const dx = drop.x - nearestX;
                        const dy = drop.y - nearestY;
                        const distanceSquared = dx * dx + dy * dy;
                        if (distanceSquared >= radius * radius) continue;

                        let normalX = 0;
                        let normalY = 0;
                        let penetration = 0;
                        if (distanceSquared > 1e-8) {
                            const distance = Math.sqrt(distanceSquared);
                            normalX = dx / distance;
                            normalY = dy / distance;
                            penetration = radius - distance;
                        } else {
                            const left = drop.x - (wall.x - halfWall);
                            const right = wall.x + halfWall - drop.x;
                            const top = drop.y - (wall.y - halfWall);
                            const bottom = wall.y + halfWall - drop.y;
                            const minimum = Math.min(left, right, top, bottom);
                            if (minimum === left) { normalX = -1; penetration = radius + left; }
                            else if (minimum === right) { normalX = 1; penetration = radius + right; }
                            else if (minimum === top) { normalY = -1; penetration = radius + top; }
                            else { normalY = 1; penetration = radius + bottom; }
                        }

                        drop.x += normalX * penetration;
                        drop.y += normalY * penetration;
                        this.removeInwardMotion(drop.velocity, normalX, normalY);
                        this.removeInwardMotion(drop.accel, normalX, normalY);
                        moved = true;
                    }
                }
                if (!moved) break;
            }
        }
    }

    resolveBodyBlockCollisions(body) {
        if (!body || body.craftrasSpectator) return;
        this.resolveEntityOutOfWall(body);
        const radius = Math.max(1, body.realSize || body.size || 1);
        const halfWall = WALL_SIZE * 0.5;
        const blockRadius = Math.ceil((radius + halfWall) / BLOCK_SIZE) + 1;
        const canBreakBlocks = this.mobCanBreakBlocks(body);
        const now = canBreakBlocks ? Date.now() : 0;

        // Two passes settle corner contacts without creating physics entities.
        for (let pass = 0; pass < 2; pass++) {
            const center = worldToBlock(body.x, body.y);
            let moved = false;
            for (let y = center.y - blockRadius; y <= center.y + blockRadius; y++) {
                for (let x = center.x - blockRadius; x <= center.x + blockRadius; x++) {
                    const block = this.getBlock(x, y);
                    if (!this.isBodyCollisionBlockForEntity(block, body)) continue;
                    const wall = blockToWorld(x, y);
                    const nearestX = Math.max(wall.x - halfWall, Math.min(body.x, wall.x + halfWall));
                    const nearestY = Math.max(wall.y - halfWall, Math.min(body.y, wall.y + halfWall));
                    let dx = body.x - nearestX;
                    let dy = body.y - nearestY;
                    let distanceSquared = dx * dx + dy * dy;
                    if (distanceSquared >= radius * radius) continue;

                    if (canBreakBlocks && now >= (body.craftrasNextBlockDamageAt || 0)) {
                        body.craftrasNextBlockDamageAt = now + 350;
                        this.damageBlockAt(x, y, this.getMobBlockDamage(body));
                    }

                    let normalX = 0;
                    let normalY = 0;
                    let penetration = 0;
                    if (distanceSquared > 1e-8) {
                        const distance = Math.sqrt(distanceSquared);
                        normalX = dx / distance;
                        normalY = dy / distance;
                        penetration = radius - distance;
                    } else {
                        const left = body.x - (wall.x - halfWall);
                        const right = wall.x + halfWall - body.x;
                        const top = body.y - (wall.y - halfWall);
                        const bottom = wall.y + halfWall - body.y;
                        const minimum = Math.min(left, right, top, bottom);
                        if (minimum === left) { normalX = -1; penetration = radius + left; }
                        else if (minimum === right) { normalX = 1; penetration = radius + right; }
                        else if (minimum === top) { normalY = -1; penetration = radius + top; }
                        else { normalY = 1; penetration = radius + bottom; }
                    }

                    body.x += normalX * penetration;
                    body.y += normalY * penetration;
                    this.removeInwardMotion(body.velocity, normalX, normalY);
                    this.removeInwardMotion(body.accel, normalX, normalY);
                    moved = true;
                }
            }
            if (!moved) break;
        }
        this.resolveEntityOutOfWall(body);
    }

    removeInwardMotion(vector, normalX, normalY) {
        if (!vector) return;
        const inward = vector.x * normalX + vector.y * normalY;
        if (inward < 0) {
            vector.x -= inward * normalX;
            vector.y -= inward * normalY;
        }
    }

    buildChunkData(chunkX, chunkY) {
        const values = new Array(CHUNK_SIZE * CHUNK_SIZE);
        let index = 0;
        for (let localY = 0; localY < CHUNK_SIZE; localY++) {
            for (let localX = 0; localX < CHUNK_SIZE; localX++) {
                values[index++] = this.getBlockRenderCode(chunkX * CHUNK_SIZE + localX, chunkY * CHUNK_SIZE + localY);
            }
        }

        const runs = [];
        for (let i = 0; i < values.length;) {
            const value = values[i];
            let length = 1;
            while (i + length < values.length && values[i + length] === value && length < 255) length++;
            runs.push(length, value);
            i += length;
        }
        return runs;
    }

    buildFloorChunkData(chunkX, chunkY) {
        const values = new Array(CHUNK_SIZE * CHUNK_SIZE);
        let index = 0;
        for (let localY = 0; localY < CHUNK_SIZE; localY++) {
            for (let localX = 0; localX < CHUNK_SIZE; localX++) {
                values[index++] = this.getFloorRenderCode(chunkX * CHUNK_SIZE + localX, chunkY * CHUNK_SIZE + localY);
            }
        }
        const runs = [];
        for (let i = 0; i < values.length;) {
            const value = values[i];
            let length = 1;
            while (i + length < values.length && values[i + length] === value && length < 255) length++;
            runs.push(length, value);
            i += length;
        }
        return runs;
    }

    syncClient(socket, body, force = false) {
        let state = this.clientStates.get(socket);
        if (!state) {
            state = { initialized: false, centerChunkX: NaN, centerChunkY: NaN, radius: 0, chunks: new Set(), routeMarkerRevision: -1, textStoryMarkerRevision: -1 };
            this.clientStates.set(socket, state);
        }
        if (!state.initialized) {
            socket.talk("CR", 1, this.worldSize || WORLD_SIZE, BLOCK_SIZE, WALL_SIZE, CHUNK_SIZE, Config.craftras_world1_challenge_builder ? 1 : 0);
            state.initialized = true;
        }
        if (state.routeMarkerRevision !== this.routeMarkerRevision) {
            socket.talk("MR", JSON.stringify(this.getRouteMarkerPositions()));
            state.routeMarkerRevision = this.routeMarkerRevision;
        }
        if (state.textStoryMarkerRevision !== this.textStoryMarkerRevision) {
            socket.talk("TSM", JSON.stringify(this.getTextStoryMarkerPositions()));
            state.textStoryMarkerRevision = this.textStoryMarkerRevision;
        }

        const block = worldToBlock(body.x, body.y);
        const centerChunkX = Math.floor(block.x / CHUNK_SIZE);
        const centerChunkY = Math.floor(block.y / CHUNK_SIZE);
        const loadRadius = this.getPlayerLoadRadius(body);
        const chunkRadius = Math.ceil(loadRadius / CHUNK_SIZE);
        if (!force && centerChunkX === state.centerChunkX && centerChunkY === state.centerChunkY && chunkRadius === state.radius) return false;

        const needed = new Set();
        for (let chunkY = centerChunkY - chunkRadius; chunkY <= centerChunkY + chunkRadius; chunkY++) {
            for (let chunkX = centerChunkX - chunkRadius; chunkX <= centerChunkX + chunkRadius; chunkX++) {
                const key = this.chunkKey(chunkX, chunkY);
                needed.add(key);
                if (!state.chunks.has(key)) {
                    socket.talk("CH", chunkX, chunkY, ...this.buildChunkData(chunkX, chunkY));
                    socket.talk("FH", chunkX, chunkY, ...this.buildFloorChunkData(chunkX, chunkY));
                }
            }
        }
        for (const key of state.chunks) {
            if (needed.has(key)) continue;
            const [chunkX, chunkY] = key.split(",").map(Number);
            socket.talk("CU", chunkX, chunkY);
        }

        state.centerChunkX = centerChunkX;
        state.centerChunkY = centerChunkY;
        state.radius = chunkRadius;
        state.chunks = needed;
        return true;
    }

    broadcastBlockUpdate(x, y, code, options = {}) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const key = this.chunkKey(chunkX, chunkY);
        for (const socket of this.gameManager.clients) {
            const state = this.clientStates.get(socket);
            if (state?.chunks.has(key)) socket.talk("CB", x, y, code, options.immediate ? 1 : 0);
        }
    }

    broadcastFloorUpdate(x, y, code) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const key = this.chunkKey(chunkX, chunkY);
        for (const socket of this.gameManager.clients) {
            const state = this.clientStates.get(socket);
            if (state?.chunks.has(key)) socket.talk("FB", x, y, code);
        }
    }

    broadcastBlockShake(x, y) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const key = this.chunkKey(chunkX, chunkY);
        for (const socket of this.gameManager.clients) {
            const state = this.clientStates.get(socket);
            if (state?.chunks.has(key)) socket.talk("CS", x, y);
        }
    }

    update(force = false) {
        if (!Config.craftras) return;
        const now = Date.now();
        const timeStopped = !!this.craftrasTimeStopped;
        const challengeServer = !!Config.craftras_world1_challenge_builder;
        const challengeIdle = challengeServer && this.gameManager.clients.length === 0;
        if (challengeServer) {
            if (!challengeIdle) this.challengeHadClients = true;
            else if (this.challengeHadClients) {
                this.resetWorld1ChallengeSession();
                this.challengeHadClients = false;
            }
        }
        if (timeStopped) {
            this.dayCycleLastUpdate = now;
            this.weatherLastUpdate = now;
        } else {
            this.updateDayCycle(now);
            this.updateWeather(now);
            this.updateKingdomWeatherTransition(now);
        }
        const players = this.getLivingPlayers();
        const connectedPlayers = this.getConnectedPlayerBodies();
        this.syncPlayerSurvivalState(connectedPlayers, now);
        if (challengeServer && ["intro", "active"].includes(this.challengeStage) && connectedPlayers.length && !players.length) {
            this.startWorld1ChallengeFailure(now);
        }
        const challengeFailureActive = challengeServer && this.updateWorld1ChallengeFailure(now);
        this.updateSwordGuyTransformations(now);
        this.processDestroyerQueue();
        this.processWorldEditJobs();
        this.updateMerchantShop();
        if (!timeStopped && !challengeIdle && !challengeFailureActive) {
            this.updateChallengeActors(now);
            this.updateChallengeEncounter(players, now);
        }
        const runCombatSimulation = !Config.craftras_steel_torch_builder && (
            !Config.craftras_village_builder || Config.craftras_world1_challenge_builder
        );
        if (!timeStopped && !challengeIdle && !challengeFailureActive && runCombatSimulation) {
            if (!Config.craftras_world1_challenge_builder) {
                this.updateArenaBuildCycle(now);
                if (this.hasArenaBuilders()) this.ejectUndergroundPlayersForArenaBuild(players);
                this.arenaBuildRepairBudget = ARENA_BUILD_REPAIR_BUDGET_PER_TICK;
                this.maintainVillageStaticNpcs();
                this.updateVillageRepairers(now);
                this.updateKingdomGhostRepairers(now);
                this.updatePendingGuardianSpawns(now);
            }
            this.updateMobs(players, now);
            this.resolveCraftrasMobSeparation();
            this.updateSpiderAbilities(players, now);
            this.updateClericHealCircles(now);
            this.updatePopeStaffProjectiles(players, now);
            this.updateGuardianSlashProjectiles(players, now);
            this.updateChallengeMagicEntities(players, now);
            this.updateTheGreatFriendCompanions(players, now);
            this.updateTheGreatProjectiles(players, now);
            this.updateTheSwordArenas(players, now);
            this.updateExplosionEffects(now);
            this.updateRocketProjectiles(now);
            this.updateBoneBombProjectiles(now);
            this.updateCraftrasM134Projectiles();
        }
        if (!timeStopped) this.updateDamagedBlockRegeneration(now);
        this.resolvePlayerBlockCollisions();
        this.syncStationTouches();
        this.collectItemDrops();
        if (!timeStopped) {
            this.resolveItemDropBlockCollisions();
            this.updateFurnaces();
        }
        if (!force && ++this.updateCounter % 3 !== 0) return;
        let chunksChanged = force;
        let activeClientCount = 0;
        for (const { socket, body } of connectedPlayers) {
            activeClientCount++;
            if (this.syncClient(socket, body, force)) chunksChanged = true;
            this.syncPlacementPreview(socket);
        }
        if (activeClientCount !== this.treeClientCount) {
            this.treeClientCount = activeClientCount;
            chunksChanged = true;
        }
        if (chunksChanged) this.syncTreeEntities();
    }
}

module.exports = { Craftras };
