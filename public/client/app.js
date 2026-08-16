import { util } from "./util.js?v=20260815-play-fix1";
import { global } from "./global.js?v=20260815-play-fix1";
import { config, resetScreenShake } from "./config.js?v=20260815-play-fix1";
import { Canvas } from "./canvas.js?v=20260815-play-fix1";
import { color as colors } from "./color.js?v=20260719-challenge-instance1";
import { gameDraw } from "./gameDraw.js?v=20260815-play-fix1";
import * as socketStuff from "./socketinit.js?v=20260815-play-fix1";
import "./serverSelectorHandler.js?v=20260815-play-fix1";
import * as CraftrasWorld from "../craftras-worldGenerator.js?v=20260810-world2-giant-cave1";
import { preloadCraftrasAssets } from "./assetPreloader.js?v=20260814-asset-preload1";

const craftrasJaneScreenSliceCanvas = document.createElement("canvas");
const craftrasJaneScreenSliceContext = craftrasJaneScreenSliceCanvas.getContext("2d");

const craftrasBlockBreakImages = [null, 1, 2, 3].map(stage => {
    if (stage == null) return null;
    const image = new Image();
    image.src = `./img/craftras-block-break-${stage}.png?v=20260612-1`;
    return image;
});
const craftrasDebuffImages = Object.fromEntries([
    ["knight_target", "craftras-debuff-knight-target.png"],
    ["poison", "craftras-debuff-poison.png"],
    ["health_buff", "craftras-health-buff.png"],
    ["strength_buff", "craftras-strength-buff.png"],
    ["health_buff_2", "craftras-health-buff.png"],
    ["strength_buff_2", "craftras-strength-buff.png"],
    ["haste_buff_2", "craftras-haste-buff.png"],
    ["world1_blessing", "craftras-world1-badge.png"],
    ["world2_curse", "craftras-world1-badge.png"],
].map(([id, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260712-swordguy1`;
    return [id, image];
}));
const craftrasFireFrames = Array.from({ length: 5 }, (_, index) => {
    const image = new Image();
    image.src = `./img/craftras-fire-${index}.png?v=20260618-1`;
    return image;
});
const CRAFTRAS_TORCH_FIRE_GIF_SRC = "./img/craftras-torch-fire.gif?v=20260704-cave11";
const craftrasTorchFireGifImage = new Image();
craftrasTorchFireGifImage.src = CRAFTRAS_TORCH_FIRE_GIF_SRC;
const craftrasLaserBeamImage = new Image();
craftrasLaserBeamImage.src = "./img/craftras-laser-beam.png?v=20260802-laser-test1";
const craftrasGiantLaserBeamImage = new Image();
craftrasGiantLaserBeamImage.src = "./img/craftras-giant-laser.png?v=20260807-giant-laser1";
const craftrasBlueLaserBeamImage = new Image();
craftrasBlueLaserBeamImage.src = "./img/craftras-blue-laser-beam.png?v=20260813-world2-challenge1";
const craftrasTorchGifOverlays = new Map();
const CRAFTRAS_CAVE_MAX_DARKNESS = 0.9;
const CRAFTRAS_NIGHT_MAX_DARKNESS = 0.7;
const CRAFTRAS_CAVE_DARK_START_DEPTH = 2;
const CRAFTRAS_CAVE_FULL_DARK_DEPTH = 42;
const CRAFTRAS_CAVE_DEPTH_CACHE_LIMIT = 65536;
const CRAFTRAS_CAVE_DEPTH_SAMPLE_BLOCKS = 4;
const CRAFTRAS_CAVE_DEPTH_DIRECTIONS = 12;
const CRAFTRAS_CAVE_DEPTH_RADII = Object.freeze([0, 1, 2, 4, 7, 11, 16, 22, 29, 37, 46, 50]);
const CRAFTRAS_CAVE_PREWARM_PER_FRAME = 4;
const CRAFTRAS_CAVE_PREWARM_INTERVAL_MS = 120;
const CRAFTRAS_CAVE_PREWARM_TIME_BUDGET_MS = 0.75;
const CRAFTRAS_TORCH_BLOCK_CODE = 20;
const CRAFTRAS_STEEL_TORCH_BLOCK_CODE = 21;
const CRAFTRAS_TORCH_LIGHT_RADIUS_BLOCKS = 12;
const CRAFTRAS_STEEL_TORCH_LIGHT_RADIUS_BLOCKS = CRAFTRAS_TORCH_LIGHT_RADIUS_BLOCKS * (5 / 1.5);
const CRAFTRAS_TORCH_LIGHT_CURVE_POWER = 1.45;
const CRAFTRAS_CAVE_BRIGHTEN_LERP = 0.018;
const CRAFTRAS_CAVE_DARKEN_LERP = 0.01;
const CRAFTRAS_NIGHT_TORCH_RISE_LERP = 0.014;
const CRAFTRAS_NIGHT_TORCH_FALL_LERP = 0.04;
const CRAFTRAS_NIGHT_TORCH_MAX_DARKNESS_REDUCTION = 0.45;
const CRAFTRAS_CAVE_MOB_BASE_VISIBLE_BLOCKS = 18;
const CRAFTRAS_CAVE_FOG_MIN_CLEAR_BLOCKS = 1.8;
const CRAFTRAS_CAVE_FOG_FEATHER_BLOCKS = 2.5;
const CRAFTRAS_CAVE_FOG_CLEAR_RADIUS_SCALE = 0.75;
const CRAFTRAS_CAVE_FOG_CENTER_DARKNESS_RATIO = 0.8;
const CRAFTRAS_CLOUD_SECTOR_BLOCKS = 18;
const CRAFTRAS_CLOUD_VISIBLE_ALPHA = 0.4;
const CRAFTRAS_CLOUD_UNDER_ALPHA = 0.2;
const CRAFTRAS_CLOUD_SURFACE_SCORE = 0.58;
const CRAFTRAS_CLOUD_SIZE_MULTIPLIER = 3;
const CRAFTRAS_CLOUD_HEIGHT_MULTIPLIER = CRAFTRAS_CLOUD_SIZE_MULTIPLIER * 1.5;
const CRAFTRAS_CLOUD_DRIFT_SPEED = 18;
const CRAFTRAS_CLOUD_LAYER_FADE_LERP = 0.035;
const CRAFTRAS_CLOUD_SPAWN_FADE_RATIO = 0.26;
const CRAFTRAS_CLOUD_SCREEN_MARGIN = 96;
const CRAFTRAS_WEATHER_FADE_LERP = 0.018;
const CRAFTRAS_WEATHER_SURFACE_FADE_LERP = 0.035;
const CRAFTRAS_WHITE_INFERNO_FADE_LERP = 0.055;
const CRAFTRAS_WHITE_INFERNO_SCREEN_ALPHA = 0.9;
const CRAFTRAS_WHITE_INFERNO_BLOCK_ALPHA = 0.96;
const CRAFTRAS_STORM_TRANSITION_MS = 60_000;
const CRAFTRAS_WEATHER_DARKNESS_ALPHA = 0.36;
const CRAFTRAS_KINGDOM_STORM_DARKNESS_MULTIPLIER = 1.5;
const CRAFTRAS_KINGDOM_FOG_ALPHA = 0.9;
const CRAFTRAS_KINGDOM_FOG_CLEAR_RADIUS_BLOCKS = 4 / 1.5;
const CRAFTRAS_KINGDOM_FOG_OUTER_RADIUS_BLOCKS = 10 / 1.5;
const CRAFTRAS_KINGDOM_FOG_ENTER_DURATION_MS = 2_000;
const CRAFTRAS_KINGDOM_FOG_EXIT_DURATION_MS = 1_200;
const CRAFTRAS_KINGDOM_RESTORATION_FOG_ALPHA = 0.98;
const CRAFTRAS_CHALLENGE_VILLAGE_BOUNDS = Object.freeze({ minX: -329, maxX: -254, minY: 285, maxY: 360 });
const CRAFTRAS_CHALLENGE_VILLAGE_FOG_FADE_BLOCKS = 90;
const CRAFTRAS_CHALLENGE_VILLAGE_MIN_FOG_RATIO = 0.18;
const CRAFTRAS_CHALLENGE_VILLAGE_WARMTH_DURATION_MS = 1_500;
const CRAFTRAS_STORM_CLOUD_COUNT = 10;
const CRAFTRAS_STORM_CLOUD_SCALE = 4;
const CRAFTRAS_RAIN_MIN_STREAKS = 90;
const CRAFTRAS_RAIN_MAX_STREAKS = 220;
const craftrasCloudImages = Array.from({ length: 5 }, (_, index) => {
    const image = new Image();
    image.src = `./img/craftras-cloud-${index + 1}.png?v=20260711-clouds4`;
    return image;
});
const craftrasPlacedBlockImages = Object.fromEntries([
    [9, "craftras-plank.png"],
    [10, "craftras-crafting-table.png"],
    [11, "craftras-furnace-off.png"],
    [12, "craftras-furnace-on.png"],
    [20, "craftras-torch.png"],
    [21, "craftras-steel-torch.png"],
].map(([code, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260704-cave11`;
    return [code, image];
}));
const craftrasOreOverlayImages = Object.fromEntries([
    [5, "craftras-coal-ore-overlay.png"],
    [6, "craftras-iron-ore-overlay.png"],
    [7, "craftras-gold-ore-overlay.png"],
    [8, "craftras-diamond-ore-overlay.png"],
].map(([code, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260711-ore-remake1`;
    return [code, image];
}));
const craftrasWorld2OreOverlayImages = Object.fromEntries([
    [6, "craftras-sapphire-ore-overlay.png"],
    [8, "craftras-ruby-ore-overlay.png"],
].map(([code, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260727-world2-mobs1`;
    return [code, image];
}));
const craftrasHelmetImages = Object.fromEntries([
    ["iron_helmet", "craftras-iron-helmet.png"],
    ["diamond_helmet", "craftras-diamond-helmet.png"],
    ["great_iron_helmet", "craftras-iron-helmet.png"],
    ["amethyst_helmet", "craftras-diamond-helmet.png"],
    ["great_diamond_helmet", "craftras-great-diamond-helmet.png"],
    ["sapphire_helmet", "craftras-sapphire-helmet.png"],
    ["ruby_helmet", "craftras-ruby-helmet.png"],
    ["sturdy_helmet", "craftras-sturdy-helmet.png"],
    ["zombie_crown", "craftras-zombie-crown.png"],
    ["cleric_hat", "craftras-cleric-hat.png"],
    ["pope_hat", "craftras-pope-hat.png"],
    ["blesser_hat", "craftras-blesser-hat.png"],
    ["merchant_hat", "craftras-merchant-hat.png"],
    ["monster_merchant_hat", "craftras-monster-merchant-hat.png"],
    ["miner_hat", "craftras-miner-hat.png"],
    ["healer_hat", "craftras-healer-hat.png"],
    ["bominik_hat", "craftras-bominik-hat.png?v=2"],
    ["jane_hat", "craftras-jane-hat.png"],
].map(([id, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260731-jane-assets2`;
    return [id, image];
}));
const craftrasBandageImage = new Image();
craftrasBandageImage.src = "./img/craftras-bandage.png?v=20260727-world2-equipment2";
const drawCraftrasHelmetImage = (context, image, helmetId, x, y, size) => {
    if (!image || !((image.complete && image.naturalWidth) || image.width)) return false;
    const previousFilter = context.filter;
    if (helmetId === "amethyst_helmet") context.filter = "hue-rotate(80deg) saturate(1.55)";
    if (helmetId === "sturdy_helmet") {
        const width = size * 1.5;
        context.drawImage(image, x - (width - size) / 2, y, width, size);
    } else {
        context.drawImage(image, x, y, size, size);
    }
    if (helmetId === "gold_helmet") {
        context.globalCompositeOperation = "source-atop";
        context.globalAlpha *= 0.72;
        context.fillStyle = "#f1c84a";
        context.fillRect(x, y, size, size);
        context.globalCompositeOperation = "source-over";
        context.globalAlpha /= 0.72;
    }
    context.filter = previousFilter;
    return true;
};
craftrasHelmetImages.gold_helmet = craftrasHelmetImages.iron_helmet;
const craftrasM134Image = new Image();
craftrasM134Image.src = "./img/craftras-m134.png?v=20260615-1";
const craftrasRocketLauncherImage = new Image();
craftrasRocketLauncherImage.src = "./img/craftras-rocket-launcher.png?v=20260618-1";
const craftrasGuardianSlashImage = new Image();
craftrasGuardianSlashImage.src = "./img/craftras-guardian-slash.png?v=20260709-king-zombie1";
const craftrasJaneSawImage = new Image();
craftrasJaneSawImage.src = "./img/craftras-jane-saw.png?v=20260802-jane-skill1";
const craftrasJaneThrowingSwordImage = new Image();
craftrasJaneThrowingSwordImage.src = "./img/craftras-jane-throwing-sword.png?v=20260802-jane-skill2";
const craftrasPhoenixEffectImage = new Image();
craftrasPhoenixEffectImage.src = "./img/craftras-phoenix-effect.png?v=20260727-world2-mobs1";
const craftrasParryEffectImage = new Image();
craftrasParryEffectImage.src = "./img/craftras-parry-effect.png?v=20260728-parry1";
const craftrasChallengeMagicCircleImage = new Image();
craftrasChallengeMagicCircleImage.src = "./img/craftras-challenge-magic-circle.png?v=20260719-magic-circle1";
const craftrasBasicMagicCircleImage = new Image();
craftrasBasicMagicCircleImage.src = "./img/craftras-basic-magic-circle.png?v=20260728-sword-guy2-1";
const craftrasBominikMagicCircleImages = Object.fromEntries([1, 2, 3].map(index => {
    const image = new Image();
    image.src = `./img/craftras-bominik-circle-${index}.png?v=20260729-sword-guy2-phase2-1`;
    return [`craftrasBominikMagicCircle${index}`, image];
}));
const craftrasJaneMagicCircleImages = Object.fromEntries([1, 2, 3].map(index => {
    const image = new Image();
    image.src = `./img/craftras-jane-circle-${index}.png?v=20260802-jane-skill5-1`;
    return [`craftrasJaneMagicCircle${index}`, image];
}));
const craftrasTheGreatFriendImage = new Image();
craftrasTheGreatFriendImage.src = "./img/craftras-the-great-friend.png?v=20260731-jane-assets2";
const craftrasCowPatternImage = new Image();
craftrasCowPatternImage.src = "./img/craftras-cow-pattern.png?v=20260621-1";
const craftrasChickenCombImage = new Image();
craftrasChickenCombImage.src = "./img/craftras-chicken-comb.png?v=20260621-1";
const craftrasClericImages = Object.fromEntries([
    ["hat", "craftras-cleric-hat.png"],
    ["staff", "craftras-cleric-staff.png"],
    ["healCircle", "craftras-cleric-heal-circle.png"],
    ["popeHat", "craftras-pope-hat.png"],
    ["popeStaff", "craftras-pope-staff.png"],
    ["blesserHat", "craftras-blesser-hat.png"],
    ["blesserStaff", "craftras-blesser-staff.png"],
    ["popeMagicCircle1", "craftras-pope-magic-circle-1.png"],
    ["popeMagicCircle2", "craftras-pope-magic-circle-2.png"],
    ["popeMagicCircle3", "craftras-pope-magic-circle-3.png"],
].map(([id, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260705-pope-staff3`;
    return [id, image];
}));
const craftrasLootImages = Object.fromEntries([
    ["bandage", "craftras-bandage.png"],
    ["rotten_flesh", "craftras-rotten-flesh.png"],
    ["bone", "craftras-bone.png"],
    ["hardened_bone", "craftras-bone.png"],
    ["burnt_bone", "craftras-burnt-bone.png"],
    ["fire_orb", "craftras-fire-orb.png"],
    ["fire_soul", "craftras-fire-soul.png"],
    ["worm_shell", "craftras-worm-shell.png"],
    ["horn", "craftras-horn.png"],
    ["ancient_key", "craftras-ancient-key.png"],
    ["magic_crystal", "craftras-magic-crystal.png"],
    ["gunpowder", "craftras-gunpowder.png"],
    ["crown_fragment", "craftras-crown-fragment.png"],
    ["royal_key", "craftras-royal-key.png"],
    ["spider_eye", "craftras-spider-eye.png"],
    ["toxic_spider_eye", "craftras-toxic-spider-eye.png"],
    ["spider_leg", "craftras-spider-leg.png"],
    ["string", "craftras-string.png"],
    ["spider_venom", "craftras-spider-venom.png"],
    ["venom_sword_recipe", "craftras-venom-sword-recipe.png"],
    ["zombie_crown_recipe", "craftras-zombie-crown-recipe.png"],
    ["knight_shield_recipe", "craftras-knight-shield-recipe.png"],
    ["cleric_staff_recipe", "craftras-cleric-staff-recipe.png"],
    ["bone_bomb_recipe", "craftras-bone-bomb-recipe.png"],
    ["horn_sword_recipe", "craftras-horn-sword-recipe.png"],
    ["sturdy_helmet_recipe", "craftras-sturdy-helmet-recipe.png"],
    ["zombie_wizard_staff_recipe", "craftras-zombie-wizard-staff-recipe.png"],
    ["bone_bomb", "craftras-bone-bomb.png"],
    ["the_great_friend", "craftras-the-great-friend.png"],
    ["cleric_staff_head", "craftras-cleric-staff-head.png"],
    ["cleric_staff_body", "craftras-cleric-staff-body.png"],
    ["cleric_staff_handle", "craftras-cleric-staff-handle.png"],
    ["knight_shield_fragment", "craftras-knight-shield-fragment.png"],
    ["iron_shield", "craftras-iron-shield.png"],
    ["gold_shield", "craftras-gold-shield.png"],
    ["diamond_shield", "craftras-diamond-shield.png"],
    ["knight_shield", "craftras-knight-shield.png"],
    ["parry_tool", "craftras-parry-tool.png"],
    ["parry_tool_op", "craftras-parry-tool.png"],
    ["magic_book", "craftras-magic-book.png"],
    ["raw_beef", "craftras-raw-beef.png"],
    ["cooked_beef", "craftras-cooked-beef.png"],
    ["raw_pork", "craftras-raw-pork.png"],
    ["cooked_pork", "craftras-cooked-pork.png"],
    ["raw_chicken", "craftras-raw-chicken.png"],
    ["cooked_chicken", "craftras-cooked-chicken.png"],
    ["blacksmith_hammer", "craftras-blacksmith-hammer.png"],
    ["world1_badge", "craftras-world1-badge.png"],
    ["cleric_hat", "craftras-cleric-hat.png"],
    ["pope_hat", "craftras-pope-hat.png"],
    ["pope_staff", "craftras-pope-staff.png"],
    ["blesser_hat", "craftras-blesser-hat.png"],
    ["blesser_staff", "craftras-blesser-staff.png"],
    ["merchant_hat", "craftras-merchant-hat.png"],
    ["monster_merchant_hat", "craftras-monster-merchant-hat.png"],
    ["jane_hat", "craftras-jane-hat.png"],
    ["jane_sword", "craftras-jane-sword.png"],
].map(([id, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260731-jane-assets2`;
    return [id, image];
}));
const craftrasResourceItemImages = Object.fromEntries([
    ["coal", "craftras-coal-item.png"],
    ["iron_ore", "craftras-iron-ore-item.png"],
    ["iron_ingot", "craftras-iron-ore-item.png"],
    ["steel_rod", "craftras-iron-ore-item.png"],
    ["gold_ore", "craftras-gold-ore-item.png"],
    ["gold_ingot", "craftras-gold-ore-item.png"],
    ["diamond", "craftras-diamond-item.png"],
    ["sapphire", "craftras-sapphire-item.png"],
    ["ruby", "craftras-ruby-item.png"],
].map(([id, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260711-ore-item1`;
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
    torch: craftrasPlacedBlockImages[20],
    steel_torch: craftrasPlacedBlockImages[21],
    m134: craftrasM134Image,
    rocket_launcher: craftrasRocketLauncherImage,
    ...craftrasResourceItemImages,
    ...craftrasLootImages,
};
const craftrasFlatItemIds = new Set([
    "coal", "iron_ore", "iron_ingot", "steel_rod", "gold_ore", "gold_ingot", "diamond", "sapphire", "ruby",
    "torch", "steel_torch", "m134", "rocket_launcher", "bandage", "rotten_flesh", "bone", "hardened_bone", "burnt_bone", "fire_orb", "fire_soul", "worm_shell", "horn", "ancient_key", "magic_crystal", "gunpowder", "bomb_recipe",
    "bone_bomb_recipe", "bone_bomb", "horn_sword_recipe", "sturdy_helmet_recipe", "zombie_wizard_staff_recipe", "the_great_friend", "jane_sword", "jane_hat",
    "crown_fragment", "royal_key", "spider_eye", "toxic_spider_eye",
    "spider_leg", "string", "spider_venom", "venom_sword_recipe",
    "zombie_crown_recipe", "knight_shield_recipe",
    "knight_shield_fragment", "iron_shield", "gold_shield", "diamond_shield", "knight_shield", "parry_tool", "parry_tool_op", "magic_book",
    "raw_beef", "cooked_beef", "raw_pork", "cooked_pork", "raw_chicken", "cooked_chicken",
    "blacksmith_hammer", "world1_badge", "cleric_hat", "pope_hat", "pope_staff", "blesser_hat", "blesser_staff",
    "merchant_hat", "monster_merchant_hat",
    "cleric_staff_recipe", "cleric_staff_head", "cleric_staff_body", "cleric_staff_handle",
    "king_zombie_summon_ticket", "queen_spider_summon_ticket", "annihilator_summon_ticket", "sword_guy_summon_ticket",
    "creative_24h", "creative_1h",
]);
const craftrasOreItemBlockCodes = {
    iron_ore: 6,
    gold_ore: 7,
};
global.craftrasRecipeBookOpen ??= false;
global.craftrasRecipeBookRecipes ??= [];
global.craftrasRecipeSearch ??= "";
global.craftrasRecipeSearchActive ??= false;
global.craftrasRecipeScroll ??= 0;
global.craftrasRecipeUnlockQueue ??= [];
const craftrasMobHeadStyles = {
    zombie_head: { body: "#48a84f", border: "#28652d" },
    skeleton_head: { body: "#eeeeee", border: "#8a8e94", gun: true },
    creeper_head: { body: "#78d66c", border: "#397c34" },
    spider_head: { body: "#20141f", border: "#090609" },
    toxic_spider_head: { body: "#452066", border: "#1d0d2c" },
};
const craftrasHeldItemClasses = {
    craftrasHeldItemTorch: "torch",
    craftrasHeldItemSteelTorch: "steel_torch",
    craftrasHeldItemBandage: "bandage",
    craftrasHeldItemRottenFlesh: "rotten_flesh",
    craftrasHeldItemZombieHead: "zombie_head",
    craftrasHeldItemBone: "bone",
    craftrasHeldItemHardenedBone: "hardened_bone",
    craftrasHeldItemBurntBone: "burnt_bone",
    craftrasHeldItemFireOrb: "fire_orb",
    craftrasHeldItemFireSoul: "fire_soul",
    craftrasHeldItemWormShell: "worm_shell",
    craftrasHeldItemHorn: "horn",
    craftrasHeldItemAncientKey: "ancient_key",
    craftrasHeldItemMagicCrystal: "magic_crystal",
    craftrasHeldItemSteelRod: "steel_rod",
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
    craftrasHeldItemZombieCrownRecipe: "zombie_crown_recipe",
    craftrasHeldItemKnightShieldRecipe: "knight_shield_recipe",
    craftrasHeldItemBoneBombRecipe: "bone_bomb_recipe",
    craftrasHeldItemBoneBomb: "bone_bomb",
    craftrasHeldItemHornSwordRecipe: "horn_sword_recipe",
    craftrasHeldItemSturdyHelmetRecipe: "sturdy_helmet_recipe",
    craftrasHeldItemZombieWizardStaffRecipe: "zombie_wizard_staff_recipe",
    craftrasHeldItemKnightShieldFragment: "knight_shield_fragment",
    craftrasHeldItemIronShield: "iron_shield",
    craftrasHeldItemGoldShield: "gold_shield",
    craftrasHeldItemDiamondShield: "diamond_shield",
    craftrasHeldItemKnightShield: "knight_shield",
    craftrasHeldItemParryTool: "parry_tool",
    craftrasHeldItemParryToolOp: "parry_tool_op",
    craftrasHeldItemRawBeef: "raw_beef",
    craftrasHeldItemCookedBeef: "cooked_beef",
    craftrasHeldItemRawPork: "raw_pork",
    craftrasHeldItemCookedPork: "cooked_pork",
    craftrasHeldItemRawChicken: "raw_chicken",
    craftrasHeldItemCookedChicken: "cooked_chicken",
    craftrasHeldItemCreative24h: "creative_24h",
    craftrasHeldItemCreative1h: "creative_1h",
    craftrasHeldItemWorld1Badge: "world1_badge",
    craftrasHeldItemClericStaffRecipe: "cleric_staff_recipe",
    craftrasHeldItemClericStaffHead: "cleric_staff_head",
    craftrasHeldItemClericStaffBody: "cleric_staff_body",
    craftrasHeldItemClericStaffHandle: "cleric_staff_handle",
    craftrasHeldItemKingZombieSummonTicket: "king_zombie_summon_ticket",
    craftrasHeldItemQueenSpiderSummonTicket: "queen_spider_summon_ticket",
    craftrasHeldItemAnnihilatorSummonTicket: "annihilator_summon_ticket",
    craftrasHeldItemSwordGuySummonTicket: "sword_guy_summon_ticket",
};
const craftrasOffhandShieldClasses = {
    craftrasOffhandIronShield: "iron_shield",
    craftrasOffhandGoldShield: "gold_shield",
    craftrasOffhandDiamondShield: "diamond_shield",
    craftrasOffhandKnightShield: "knight_shield",
    craftrasOffhandMagicBook: "magic_book",
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
    worldedit_axe: "craftras-wooden-axe.png",
    destroyer: "craftras-wooden-pickaxe.png",
    laser_test: "craftras-wooden-shovel.png",
    blue_laser_beam: "craftras-blue-laser-beam.png",
    screen_cut_test: "craftras-iron-sword.png",
    wooden_pickaxe: "craftras-wooden-pickaxe.png",
    stone_pickaxe: "craftras-stone-pickaxe.png",
    iron_pickaxe: "craftras-iron-pickaxe.png",
    gold_pickaxe: "craftras-gold-pickaxe.png",
    diamond_pickaxe: "craftras-diamond-pickaxe.png",
    ruby_pickaxe: "craftras-ruby-pickaxe.png",
    sapphire_pickaxe: "craftras-sapphire-pickaxe.png",
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
    ruby_sword: "craftras-ruby-sword.png",
    sapphire_sword: "craftras-sapphire-sword.png",
    horn_sword: "craftras-horn-sword.png",
    venom_sword: "craftras-venom-sword.png",
    the_great: "craftras-the-great.png",
    the_great_friend: "craftras-the-great-friend.png",
    jane_sword: "craftras-jane-sword.png",
    blacksmith_hammer: "craftras-blacksmith-hammer.png",
    cleric_staff: "craftras-cleric-staff.png",
    zombie_wizard_staff: "craftras-zombie-wizard-staff.png",
    cleric_staff_op: "craftras-cleric-staff.png",
    pope_staff: "craftras-pope-staff.png",
    blesser_staff: "craftras-blesser-staff.png",
    sword: "craftras-iron-sword.png",
};
const craftrasToolImages = Object.fromEntries(Object.entries(craftrasToolImageFiles).map(([id, file]) => {
    const image = new Image();
    image.src = `./img/${file}?v=20260731-jane-assets2`;
    return [id, image];
}));
const craftrasCustomToolDefinitions = Object.create(null);
const craftrasCustomToolClasses = Object.create(null);
function registerCraftrasCustomTool(item) {
    if (!item?.customWeapon || !item.id || !item.image || !item.weapon) return false;
    craftrasCustomToolDefinitions[item.id] = item.weapon;
    const layers = item.weapon.layers?.length ? item.weapon.layers : [{
        id: "main",
        image: item.image,
        priority: 0,
        opacity: 1,
        anchor: item.weapon.anchor,
    }];
    item.weapon._layerImages = Object.create(null);
    for (const layer of layers) {
        const image = new Image();
        image.src = layer.image || item.image;
        item.weapon._layerImages[layer.id] = image;
        if (!craftrasToolImages[item.id] || layer.id === "main") craftrasToolImages[item.id] = image;
        const layerClassName = `craftrasHeld${String(item.id).split("_").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join("")}Layer${String(layer.id).split("_").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join("")}`;
        craftrasCustomToolClasses[layerClassName] = { itemId: item.id, layerId: layer.id };
    }
    if (!item.weapon.layers?.length) {
        const className = `craftrasHeld${String(item.id).split("_").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join("")}`;
        craftrasCustomToolClasses[className] = { itemId: item.id, layerId: "main" };
    }
    return true;
}
const craftrasPlacedBlockCrops = {
    11: { x: 32, y: 30, width: 436, height: 438 },
    12: { x: 27, y: 26, width: 446, height: 448 },
};

const craftrasToolColors = {
    wooden: { fill: "#b7834f", stroke: "#68472b" },
    destroyer: { fill: "#07090c", stroke: "#010203" },
    stone: { fill: "#858a92", stroke: "#4f5359" },
    iron: { fill: "#d9dde2", stroke: "#777e87" },
    gold: { fill: "#f0c83d", stroke: "#9f7918" },
    diamond: { fill: "#42cddd", stroke: "#187e91" },
    ruby: { fill: "#ef3155", stroke: "#8f1733" },
    sapphire: { fill: "#467cff", stroke: "#173d9d" },
    venom: { fill: "#55e047", stroke: "#173b16" },
};

function getCraftrasToolStyle(itemId) {
    if (craftrasCustomToolDefinitions[itemId]) return { material: "iron", type: "sword", custom: true };
    if (itemId === "sword") return { material: "iron", type: "sword" };
    if (itemId === "admin_pickaxe") return { material: "wooden", type: "pickaxe", rainbow: true };
    if (itemId === "worldedit_axe") return { material: "wooden", type: "axe", rainbow: true };
    if (itemId === "destroyer") return { material: "destroyer", type: "pickaxe", black: true };
    if (itemId === "laser_test") return { material: "wooden", type: "shovel", pink: true };
    if (itemId === "blue_laser_beam") return { material: "diamond", type: "staff" };
    if (itemId === "screen_cut_test") return { material: "iron", type: "sword" };
    if (itemId === "blacksmith_hammer") return { material: "iron", type: "hammer" };
    if (itemId === "cleric_staff") return { material: "gold", type: "staff" };
    if (itemId === "zombie_wizard_staff") return { material: "venom", type: "staff" };
    if (itemId === "cleric_staff_op") return { material: "gold", type: "staff", rainbow: true };
    if (itemId === "pope_staff") return { material: "gold", type: "staff" };
    if (itemId === "blesser_staff") return { material: "diamond", type: "staff" };
    if (itemId === "venom_sword") return { material: "venom", type: "sword" };
    if (itemId === "horn_sword") return { material: "wooden", type: "sword" };
    if (itemId === "the_great") return { material: "iron", type: "sword" };
    if (itemId === "the_great_friend") return { material: "iron", type: "sword" };
    if (itemId === "jane_sword") return { material: "ruby", type: "sword" };
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
        } else if (style.black) {
            context.filter = "brightness(0) saturate(1)";
        } else if (style.pink) {
            context.filter = "brightness(0) saturate(100%) invert(42%) sepia(95%) saturate(3500%) hue-rotate(306deg) brightness(108%) contrast(102%)";
        }
        if (itemId === "the_great") {
            const imageRatio = image.naturalHeight / Math.max(1, image.naturalWidth);
            const drawWidth = size * 0.88;
            const drawHeight = Math.min(size * 0.96, drawWidth * imageRatio);
            context.drawImage(image, x + (size - drawWidth) / 2, y + (size - drawHeight) / 2, drawWidth, drawHeight);
        } else {
            context.drawImage(image, x + size * 0.06, y + size * 0.06, size * 0.88, size * 0.88);
        }
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
    const tipGroups = Array.isArray(global.tips) && global.tips.length ? global.tips : [["Craftras.io"]];
    const tips = tipGroups[Math.floor(Math.random() * tipGroups.length)] || ["Craftras.io"];
    global.tips = Array.isArray(tips) && tips.length ? tips[Math.floor(Math.random() * tips.length)] : String(tips || "Craftras.io");
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

    const validPlayerNamePattern = /^[A-Za-z ]+$/;
    const playerNameBypassSuffix = "[pass]";
    function getPlayerNameState(value) {
        const rawName = String(value || "");
        const bypassed = rawName.endsWith(playerNameBypassSuffix);
        const name = (bypassed ? rawName.slice(0, -playerNameBypassSuffix.length) : rawName).trim();
        if (!name) return { valid: false, reason: "missing", name: "" };
        const valid = bypassed || validPlayerNamePattern.test(name);
        return {
            valid,
            reason: valid ? "" : "characters",
            name,
        };
    }

    function updatePlayerNameStartButton() {
        const playerNameInput = document.getElementById("playerNameInput");
        const startButton = document.getElementById("startButton");
        if (!playerNameInput || !startButton) return false;
        const state = getPlayerNameState(playerNameInput.value);
        const label = startButton.querySelector("b");
        playerNameInput.classList.toggle("error", !state.valid);
        startButton.classList.toggle("name-required", !state.valid);
        startButton.setAttribute("aria-invalid", String(!state.valid));
        if (label) {
            label.textContent = state.valid
                ? "Play"
                : state.reason === "missing"
                    ? "Make your name"
                    : "Special characters are not allowed";
        }
        return state.valid;
    }

    const bootClient = async () => {
        // Prepare the server selector
        global.serverMap = {};
        global.servers = [];
        // Set up the socket
        global.loadServerSelector(false, "Connecting..."); // The code is at ./serverSelectorHandler.js

        const fallbackServers = [{
            ip: location.host || "localhost:3000",
            players: 0,
            maxPlayers: 200,
            id: "server1",
            featured: true,
            region: "Server",
            gameMode: "World 1",
        }];
        const builderServers = [
            {
                ip: `${location.hostname || "localhost"}:3001`,
                players: 0,
                maxPlayers: 20,
                id: "village",
                featured: false,
                region: "Village Builder",
                gameMode: "Village Builder",
            },
            {
                ip: `${location.hostname || "localhost"}:3002`,
                players: 0,
                maxPlayers: 20,
                id: "steel-torch",
                featured: false,
                region: "Steel Torch Builder",
                gameMode: "Steel Torch Builder",
            },
            {
                ip: `${location.hostname || "localhost"}:3003`,
                players: 0,
                maxPlayers: 20,
                id: "broken-kingdom",
                featured: false,
                region: "Broken Kingdom Builder",
                gameMode: "Broken Kingdom Builder",
            },
            {
                ip: `${location.hostname || "localhost"}:3004`,
                players: 0,
                maxPlayers: 20,
                id: "cave-builder",
                featured: false,
                region: "World Terrain Builder",
                gameMode: "World Terrain Builder",
            },
            {
                ip: `${location.hostname || "localhost"}:3006`,
                players: 0,
                maxPlayers: 20,
                id: "world1-challenge",
                featured: false,
                region: "World 1 Challenge",
                gameMode: "World 1 Challenge",
            },
            {
                ip: `${location.hostname || "localhost"}:3007`,
                players: 0,
                maxPlayers: 20,
                id: "world2-village",
                featured: false,
                region: "World 2 Village Builder",
                gameMode: "World 2 Village Builder",
            },
            {
                ip: `${location.hostname || "localhost"}:3008`,
                players: 0,
                maxPlayers: 20,
                id: "world2-challenge",
                featured: false,
                region: "World 2 Challenge",
                gameMode: "World 2 Challenge",
            },
        ];
        const applyServerList = json => {
            const requestedServerId = location.hash.slice(1);
            const servers = Array.isArray(json) && json.length ? [...json] : [...fallbackServers];
            const requestedBuilder = builderServers.find(server => server.id === requestedServerId);
            if (requestedBuilder && !servers.some(server => server.id === requestedBuilder.id)) servers.push(requestedBuilder);
            global.servers = servers;
            global.loadServerSelector(servers);
        };
        fetch(`/getServers.json?ts=${Date.now()}`, { cache: "no-store" }).then(response => response.json()).then(applyServerList).catch(error => {
            console.error(error);
            applyServerList(fallbackServers);
        });
        setTimeout(() => {
            const selector = document.getElementById("serverSelector");
            const text = selector?.innerText || "";
            if (!selector || /Connecting|No Server/i.test(text) || !selector.children.length) applyServerList(fallbackServers);
        }, 1500);

        // Retrieve forms
        util.retrieveFromLocalStorage("playerNameInput");
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
                    global.createTabMenu(`This server is running a development build of Craftras.io. (${global.version})`, "warning");
                }
                // Addon info handler
                let keyValue = "";
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
        const playerNameInput = document.getElementById("playerNameInput");
        playerNameInput.addEventListener("input", updatePlayerNameStartButton);
        updatePlayerNameStartButton();
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
    if (document.readyState === "loading") {
        window.addEventListener("load", bootClient, { once: true });
    } else {
        bootClient();
    }

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
        i_div.textContent = `Craftras.io ${global.version}` + `${global.devBuild ? "-dev" : ""}`;
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
        if (c?.resize) c.resize(global.screenWidth, global.screenHeight);
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
        clamp01 = value => Math.max(0, Math.min(1, value)),
        smoothstep01 = value => {
            const t = clamp01(value);
            return t * t * (3 - 2 * t);
        },
        ensureCraftrasSteelTorchLightMap = world => {
            if (!world?.active || world.steelTorchLightLoadStarted) return;
            world.steelTorchLightLoadStarted = true;
            fetch("/api/craftras/steelTorchMap", { cache: "no-store" })
                .then(response => response.ok ? response.json() : null)
                .then(data => {
                    const torches = Array.isArray(data) ? data : data?.torches;
                    world.steelTorchLightPoints = Array.isArray(torches)
                        ? torches
                            .map(torch => ({ x: Number(torch.x), y: Number(torch.y) }))
                            .filter(torch => Number.isFinite(torch.x) && Number.isFinite(torch.y))
                        : [];
                })
                .catch(() => {
                    world.steelTorchLightPoints = [];
                });
        },
        getCraftrasTorchFalloff = (distance, radius, isSteelTorch = false) => {
            const ratio = clamp01(1 - distance / radius);
            return isSteelTorch ? ratio : Math.pow(smoothstep01(ratio), CRAFTRAS_TORCH_LIGHT_CURVE_POWER);
        },
        getCraftrasTorchLightAtPlayer = () => {
            const world = global.craftrasWorld;
            if (!world?.active) return 0;
            ensureCraftrasSteelTorchLightMap(world);
            const now = performance.now();
            const cached = world.torchLightCache;
            if (cached && now - cached.updatedAt < 24) return cached.value;
            const blockSize = world.blockSize || 82;
            const chunkSize = world.chunkSize || 8;
            const radiusBlocks = CRAFTRAS_STEEL_TORCH_LIGHT_RADIUS_BLOCKS;
            const centerX = Math.floor(global.player.renderx / blockSize);
            const centerY = Math.floor(global.player.rendery / blockSize);
            const minChunkX = Math.floor((centerX - radiusBlocks) / chunkSize);
            const maxChunkX = Math.floor((centerX + radiusBlocks) / chunkSize);
            const minChunkY = Math.floor((centerY - radiusBlocks) / chunkSize);
            const maxChunkY = Math.floor((centerY + radiusBlocks) / chunkSize);
            const radius = radiusBlocks * blockSize;
            let light = 0;
            if (world.steelTorchLightPoints?.length) {
                for (const torch of world.steelTorchLightPoints) {
                    const torchX = torch.x * blockSize + blockSize / 2;
                    const torchY = torch.y * blockSize + blockSize / 2;
                    const distance = Math.hypot(torchX - global.player.renderx, torchY - global.player.rendery);
                    if (distance > radius) continue;
                    light = Math.max(light, getCraftrasTorchFalloff(distance, radius, true));
                }
            }
            for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
                for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
                    const entries = world.torchChunkEntries?.get(`${chunkX},${chunkY}`);
                    if (!entries?.length) continue;
                    const chunkBlockX = chunkX * chunkSize;
                    const chunkBlockY = chunkY * chunkSize;
                    for (const entry of entries) {
                        const torchCode = entry.code & 31;
                        if (torchCode !== CRAFTRAS_TORCH_BLOCK_CODE && torchCode !== CRAFTRAS_STEEL_TORCH_BLOCK_CODE) continue;
                        const torchX = (chunkBlockX + entry.localX) * blockSize + blockSize / 2;
                        const torchY = (chunkBlockY + entry.localY) * blockSize + blockSize / 2;
                        const radius = (torchCode === CRAFTRAS_STEEL_TORCH_BLOCK_CODE
                            ? CRAFTRAS_STEEL_TORCH_LIGHT_RADIUS_BLOCKS
                            : CRAFTRAS_TORCH_LIGHT_RADIUS_BLOCKS) * blockSize;
                        const distance = Math.hypot(torchX - global.player.renderx, torchY - global.player.rendery);
                        if (distance > radius) continue;
                        light = Math.max(light, getCraftrasTorchFalloff(distance, radius, torchCode === CRAFTRAS_STEEL_TORCH_BLOCK_CODE));
                    }
                }
            }
            const value = clamp01(light);
            world.torchLightCache = { updatedAt: now, value };
            return value;
        },
        getCraftrasDepthSample = block => {
            const size = CRAFTRAS_CAVE_DEPTH_SAMPLE_BLOCKS;
            const x = Math.floor(block.x / size) * size + Math.floor(size / 2);
            const y = Math.floor(block.y / size) * size + Math.floor(size / 2);
            return { x, y, key: `${x},${y}` };
        },
        isCraftrasUndergroundBlock = (block, seed) => {
            if (CraftrasWorld.isUndergroundCell) return CraftrasWorld.isUndergroundCell(block.x, block.y, seed);
            if (CraftrasWorld.isBrokenKingdomSurfaceCell?.(block.x, block.y)) return false;
            return (CraftrasWorld.getOutsideScore(block.x, block.y, seed) || 0) <= 0.56;
        },
        getCraftrasSurfaceDepth = (world, block, seed) => {
            world.caveSurfaceDepthCache ??= new Map();
            if (world.caveSurfaceDepthSeed !== seed) {
                world.caveSurfaceDepthSeed = seed;
                world.caveSurfaceDepthCache.clear();
            }
            const sample = getCraftrasDepthSample(block);
            const cached = world.caveSurfaceDepthCache.get(sample.key);
            if (cached != null) return cached;
            const maxDepth = CRAFTRAS_CAVE_FULL_DARK_DEPTH + 8;
            let depth = maxDepth;
            for (const radius of CRAFTRAS_CAVE_DEPTH_RADII) {
                let foundSurface = radius === 0
                    ? !isCraftrasUndergroundBlock({ x: sample.x, y: sample.y }, seed)
                    : false;
                for (let direction = 0; direction < CRAFTRAS_CAVE_DEPTH_DIRECTIONS && !foundSurface; direction++) {
                    const angle = direction * Math.PI * 2 / CRAFTRAS_CAVE_DEPTH_DIRECTIONS;
                    const x = Math.round(sample.x + Math.cos(angle) * radius);
                    const y = Math.round(sample.y + Math.sin(angle) * radius);
                    foundSurface = !isCraftrasUndergroundBlock({ x, y }, seed);
                }
                if (foundSurface) {
                    depth = radius;
                    break;
                }
            }
            if (world.caveSurfaceDepthCache.size >= CRAFTRAS_CAVE_DEPTH_CACHE_LIMIT) {
                const oldestKey = world.caveSurfaceDepthCache.keys().next().value;
                if (oldestKey != null) world.caveSurfaceDepthCache.delete(oldestKey);
            }
            world.caveSurfaceDepthCache.set(sample.key, depth);
            return depth;
        },
        queueCraftrasCaveDepthPrewarm = world => {
            const api = CraftrasWorld;
            if (!world?.active || !world.chunks?.size || !api?.getOutsideScore) return;
            if (!world.cavePrewarmChunksDirty) return;
            world.cavePrewarmChunksDirty = false;
            const seed = world.seed || 1337;
            world.caveSurfaceDepthCache ??= new Map();
            if (world.caveSurfaceDepthSeed !== seed) {
                world.caveSurfaceDepthSeed = seed;
                world.caveSurfaceDepthCache.clear();
                world.cavePrewarmSeenChunks = new Set();
                world.cavePrewarmQueue = [];
                world.cavePrewarmCursor = 0;
            }
            world.cavePrewarmSeenChunks ??= new Set();
            world.cavePrewarmQueue ??= [];
            world.cavePrewarmCursor ??= 0;
            const chunkSize = world.chunkSize || 8;
            for (const [chunkKey] of world.chunks) {
                if (world.cavePrewarmSeenChunks.has(chunkKey)) continue;
                world.cavePrewarmSeenChunks.add(chunkKey);
                const [chunkX, chunkY] = chunkKey.split(",").map(Number);
                if (!Number.isFinite(chunkX) || !Number.isFinite(chunkY)) continue;
                const baseX = chunkX * chunkSize;
                const baseY = chunkY * chunkSize;
                for (let localY = 0; localY < chunkSize; localY++) {
                    for (let localX = 0; localX < chunkSize; localX++) {
                        const x = baseX + localX;
                        const y = baseY + localY;
                        const sample = getCraftrasDepthSample({ x, y });
                        if (world.caveSurfaceDepthCache.has(sample.key)) continue;
                        if (isCraftrasUndergroundBlock({ x, y }, seed)) {
                            world.caveSurfaceDepthCache.set(sample.key, null);
                            world.cavePrewarmQueue.push(sample);
                        }
                    }
                }
            }
        },
        prewarmCraftrasCaveDepthCache = () => {
            const world = global.craftrasWorld;
            const api = CraftrasWorld;
            if (!world?.active || !api?.getOutsideScore) return;
            const now = performance.now();
            if (now < (world.caveNextPrewarmAt || 0)) return;
            world.caveNextPrewarmAt = now + CRAFTRAS_CAVE_PREWARM_INTERVAL_MS;
            queueCraftrasCaveDepthPrewarm(world);
            const queue = world.cavePrewarmQueue;
            if (!queue?.length) return;
            const seed = world.seed || 1337;
            const start = performance.now();
            let processed = 0;
            world.cavePrewarmCursor ??= 0;
            while (world.cavePrewarmCursor < queue.length && processed < CRAFTRAS_CAVE_PREWARM_PER_FRAME) {
                if (performance.now() - start > CRAFTRAS_CAVE_PREWARM_TIME_BUDGET_MS) break;
                const block = queue[world.cavePrewarmCursor++];
                if (block) {
                    const cached = world.caveSurfaceDepthCache.get(block.key);
                    if (cached == null) {
                        world.caveSurfaceDepthCache.delete(block.key);
                        getCraftrasSurfaceDepth(world, block, seed);
                    }
                }
                processed++;
            }
            if (world.cavePrewarmCursor >= queue.length) {
                queue.length = 0;
                world.cavePrewarmCursor = 0;
            } else if (world.cavePrewarmCursor > 2048) {
                world.cavePrewarmQueue = queue.slice(world.cavePrewarmCursor);
                world.cavePrewarmCursor = 0;
            }
        },
        getCraftrasCaveDarknessTarget = () => {
            const world = global.craftrasWorld;
            const api = CraftrasWorld;
            if (world?.world2ChallengeMode) return 0;
            if (!world?.active || !api?.worldToBlock || !api?.getOutsideScore) return 0;
            const seed = world.seed || 1337;
            const block = api.worldToBlock(global.player.renderx, global.player.rendery);
            if (!isCraftrasUndergroundBlock(block, seed)) return 0;
            const depth = getCraftrasSurfaceDepth(world, block, seed);
            if (!Number.isFinite(depth)) return 0;
            const darkness = smoothstep01((depth - CRAFTRAS_CAVE_DARK_START_DEPTH) / (CRAFTRAS_CAVE_FULL_DARK_DEPTH - CRAFTRAS_CAVE_DARK_START_DEPTH));
            const torchLight = getCraftrasTorchLightAtPlayer();
            world.caveTorchLight = torchLight;
            return CRAFTRAS_CAVE_MAX_DARKNESS * darkness * (1 - torchLight);
        },
        updateCraftrasCaveDarkness = () => {
            const world = global.craftrasWorld;
            if (!world) return 0;
            const target = getCraftrasCaveDarknessTarget();
            const current = world.caveDarknessAlpha || 0;
            const lerp = target < current ? CRAFTRAS_CAVE_BRIGHTEN_LERP : CRAFTRAS_CAVE_DARKEN_LERP;
            world.caveDarknessAlpha = current + (target - current) * lerp;
            if (Math.abs(world.caveDarknessAlpha) < 0.001) world.caveDarknessAlpha = 0;
            return world.caveDarknessAlpha;
        },
        isCraftrasCaveLimitedMob = instance => {
            if (!instance || instance.id === gui.playerid) return false;
            const name = String(instance.name || "").toLowerCase();
            return /zombie|spider|skeleton|creeper|bomber|annihilator|nuclear|guardian/.test(name);
        },
        getCraftrasCaveMobVisibility = instance => {
            const world = global.craftrasWorld;
            if (world?.challengeMode) return 1;
            const darkness = world?.caveDarknessAlpha || 0;
            if (darkness <= 0.03 || !isCraftrasCaveLimitedMob(instance)) return 1;
            const blockSize = world.blockSize || 82;
            const visibleBlocks = Math.max(1.8, CRAFTRAS_CAVE_MOB_BASE_VISIBLE_BLOCKS * (1 - darkness));
            const fadeBlocks = 1.35;
            const distance = Math.hypot((instance.render?.x ?? instance.x) - global.player.renderx, (instance.render?.y ?? instance.y) - global.player.rendery);
            const fullyVisibleDistance = visibleBlocks * blockSize;
            const fullyHiddenDistance = (visibleBlocks + fadeBlocks) * blockSize;
            if (distance <= fullyVisibleDistance) return 1;
            if (distance >= fullyHiddenDistance) return 0;
            return 1 - smoothstep01((distance - fullyVisibleDistance) / (fullyHiddenDistance - fullyVisibleDistance));
        },
        isCraftrasTheSwordAlwaysVisible = instance => {
            if (!instance) return false;
            const indexes = String(instance.index || "").split("-");
            const mockupIndex = +indexes[0];
            const m = global.mockups[mockupIndex] || global.missingno[0];
            const mockupClassName = String(m.className || instance.className || "");
            const mockupName = String(m.name || m.label || instance.name || instance.label || "");
            const mockupColor = String(m.color || instance.color || "").toLowerCase();
            return mockupClassName === "craftrasTheGreatFriend"
                || mockupClassName === "craftrasTheGreatWarningLine"
                || mockupClassName === "craftrasTheWorm"
                || mockupClassName === "craftrasWormSegment"
                || /The Great'?s friend|The Great Warning/i.test(mockupName)
                || ((mockupColor.startsWith("#f6f6ff") || mockupColor.startsWith("#f6d36a") || mockupColor.startsWith("#fff4b8")) && (m.size ?? instance.size ?? 0) >= 20);
        },
        handleScreenDistance = (alpha, instance, fade = true) => {
            if (isCraftrasTheSwordAlwaysVisible(instance)) return alpha;
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

    async function startGame() {
        if (!updatePlayerNameStartButton()) {
            document.getElementById("playerNameInput")?.focus();
            return;
        }
        // Set flag
        if (global.gameLoading) return;
        global.gameLoading = true;
        const startButton = document.getElementById("startButton");
        if (startButton) startButton.disabled = true;
        if (global.mobile) {
            var d = document.body;
            d.requestFullscreen ? d.requestFullscreen()
                : d.msRequestFullscreen ? d.msRequestFullscreen()
                    : d.mozRequestFullScreen ? d.mozRequestFullScreen()
                        : d.webkitRequestFullscreen && d.webkitRequestFullscreen();
        }

        try {
            await preloadCraftrasAssets();
        } catch (error) {
            console.error("Game start stopped because images did not finish loading.", error);
            global.gameLoading = false;
            if (startButton) startButton.disabled = false;
            return;
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
        let autolevelUpInput = document.getElementById("autoLevelUp").checked;
        global.autolvlUp = autolevelUpInput;
        // Name and keys
        util.submitToLocalStorage("playerNameInput");
        global.playerName = global.player.name = getPlayerNameState(playerNameInput.value).name;
        global.playerKey = "";
        // Change the screen
        global.screenWidth = window.innerWidth;
        global.screenHeight = window.innerHeight;
        document.getElementById("startMenuWrapper").style.top = "-700px";
        setTimeout(() => {
            document.getElementById("startMenuWrapper").style.display = "none";
        }, 1e3);

        global.gameConnecting = true;
        // Connect to the server.
        if (!global.serverAdd) global.serverAdd = window.__craftrasServerAdd || location.host || "localhost:3000";
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
        const textArrayRaw = String(rawText).split("\u00a7");
        const textArray = [];
        if (!(textArrayRaw.length & 1)) textArrayRaw.unshift("");
        while (textArrayRaw.length) {
            const first = textArrayRaw.shift();
            if (!textArrayRaw.length) {
                textArray.push(first);
            } else if (textArrayRaw[1]) {
                textArray.push(first, textArrayRaw.shift());
            } else {
                textArrayRaw.shift();
                textArray.push(first + "\u00a7" + textArrayRaw.shift(), textArrayRaw.shift());
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
        let strokeRatio = typeof stroke === "number" ? Math.max(stroke, config.graphical.fontStrokeRatio) : config.graphical.fontStrokeRatio;
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
        craftrasPopeMagicCircleSeenAt = new Map(),
        craftrasGuardianSlashAngles = new Map(),
        craftrasJaneSkillTwoSwordAngles = new Map(),
        craftrasTheGreatFriendStates = new Map(),
        craftrasBulletTrails = new Map(),
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
        },
        isBulletMockup = m => {
            const className = String(m?.className || "");
            const name = String(m?.name || "");
            return m?.type === "bullet" || /bullet/i.test(className) || /bullet/i.test(name);
        },
        drawBulletTrail = (context, instance, ratio, xx, yy, currentX, currentY, drawSize, alphaFade, bodyColor) => {
            if (!instance?.id || alphaFade <= 0.02) return;
            const now = performance.now();
            let state = craftrasBulletTrails.get(instance.id);
            if (!state) {
                state = { x: currentX, y: currentY, trail: [], seenAt: now };
                craftrasBulletTrails.set(instance.id, state);
                if (craftrasBulletTrails.size > 900) {
                    const keepAfter = now - 2500;
                    for (const [id, value] of craftrasBulletTrails) {
                        if (value.seenAt < keepAfter || craftrasBulletTrails.size > 900) craftrasBulletTrails.delete(id);
                    }
                }
            }
            state.seenAt = now;
            const dx = currentX - state.x;
            const dy = currentY - state.y;
            const moved = dx * dx + dy * dy;
            const trail = state.trail || (state.trail = []);
            if (moved > 0.0009) trail.push({ x: state.x, y: state.y, t: now });
            state.x = currentX;
            state.y = currentY;

            const maxTrail = 8;
            const life = 280;
            while (trail.length > maxTrail || (trail.length && now - trail[0].t > life)) trail.shift();
            if (!trail.length) return;

            context.save();
            gameDraw.setColor(context, bodyColor);
            context.lineWidth = Math.max(1, drawSize * 0.08);
            context.lineCap = "round";
            context.lineJoin = "round";
            for (let i = 0; i < trail.length; i++) {
                const ghost = trail[i];
                const age = Math.max(0, Math.min(1, 1 - (now - ghost.t) / life));
                const order = (i + 1) / trail.length;
                const ghostAlpha = alphaFade * 0.34 * age * order;
                if (ghostAlpha < 0.012) continue;
                const radius = Math.max(2, drawSize * (0.16 + 0.18 * order));
                context.globalAlpha = ghostAlpha;
                context.beginPath();
                context.arc(
                    xx + (ghost.x - currentX) * ratio,
                    yy + (ghost.y - currentY) * ratio,
                    radius,
                    0,
                    Math.PI * 2,
                );
                context.fill();
            }
            context.restore();
        };
        // The actual drawEntity function
        return (baseColor, x, y, instance, ratio, alpha = 1, scale = 1, lineWidthMult = 1, rot = 0, turretsObeyRot = false, assignedContext = false, turretInfo = false, render = instance.render, smoothsize = false) => {
            let context = assignedContext || ctx[1];
            const indexStr = String(instance.index || "");
            const indexes = indexStr.split("-");
            const mockupIndex = +indexes[0];
            const m = global.mockups[mockupIndex] || global.missingno[0];
            const source = turretInfo === false ? instance : turretInfo;
            const craftrasMockupClassName = String(m.className || source?.className || instance?.className || "");
            const craftrasMockupName = String(m.name || m.label || source?.name || source?.label || instance?.name || "");
            const craftrasMockupColor = String(m.color || source?.color || instance?.color || "").toLowerCase();
            const craftrasMockupShape = typeof m.shape === "number" ? m.shape : Number.NaN;
            const isBulletTrailEntity = !turretInfo && isBulletMockup(m);
            const isCraftrasPopeMagicCircle = m.className === "craftrasPopeMagicCircle1"
                || m.className === "craftrasPopeMagicCircle2"
                || m.className === "craftrasPopeMagicCircle3";
            const isCraftrasChallengeMagicCircle = m.className === "craftrasChallengeMagicCircle";
            const isCraftrasBasicMagicCircle = m.className === "craftrasBasicMagicCircle";
            const isCraftrasBominikMagicCircle = /^craftrasBominikMagicCircle[123]$/.test(m.className || "");
            const isCraftrasJaneMagicCircle = /^craftrasJaneMagicCircle[123]$/.test(m.className || "");
            const isCraftrasPhoenixEffect = m.className === "craftrasPhoenixEffect";
            const isCraftrasParryEffect = m.className === "craftrasParryEffect";
            const isCraftrasChallengeFadingMob = m.className === "craftrasMagicalZombie" || m.className === "craftrasCursedZombie";
            const isCraftrasJaneSawProjectile = m.className === "craftrasJaneSawProjectile";
            const isCraftrasJaneSlashProjectile = m.className === "craftrasJaneSlashProjectile";
            const isCraftrasJaneSkillTwoSwordProjectile = m.className === "craftrasJaneSkillTwoSwordProjectile";
            const isCraftrasJaneSkillTwoBulletProjectile = m.className === "craftrasJaneSkillTwoBulletProjectile";
            const isCraftrasGuardianSlashProjectile = m.className === "craftrasGuardianSlashProjectile"
                || m.className === "craftrasSwordGuy2SlashProjectile"
                || isCraftrasJaneSlashProjectile;
            const isCraftrasBoneBombProjectile = m.className === "craftrasBoneBombProjectile";
            const isCraftrasTheGreatFriend = craftrasMockupClassName === "craftrasTheGreatFriend"
                || craftrasMockupClassName === "craftrasTheGreatCompanionFriend"
                || /The Great'?s friend/i.test(craftrasMockupName)
                || ((craftrasMockupColor.startsWith("#f6f6ff") || craftrasMockupColor.startsWith("#f6d36a") || craftrasMockupColor.startsWith("#fff4b8")) && (m.size ?? 0) >= 20 && (m.alpha ?? 1) >= 0.45);
            const isCraftrasTheGreatWarningLine = craftrasMockupClassName === "craftrasTheGreatWarningLine" || /The Great Warning/i.test(craftrasMockupName);
            const isCraftrasKingdomGhostBuilder = craftrasMockupClassName === "craftrasBuilder" && /Ghost Builder/i.test(String(instance.name || ""));
            const canRenderLowAlphaCraftrasImage = isCraftrasPopeMagicCircle
                || isCraftrasChallengeMagicCircle
                || isCraftrasBasicMagicCircle
                || isCraftrasBominikMagicCircle
                || isCraftrasJaneMagicCircle
                || isCraftrasJaneSawProjectile
                || isCraftrasJaneSkillTwoSwordProjectile
                || isCraftrasJaneSkillTwoBulletProjectile
                || isCraftrasPhoenixEffect
                || isCraftrasParryEffect
                || isCraftrasChallengeFadingMob
                || isCraftrasGuardianSlashProjectile
                || isCraftrasTheGreatFriend
                || isCraftrasTheGreatWarningLine
                || isCraftrasKingdomGhostBuilder;
            // The Great's friends are short-lived custom projectiles. Their normal
            // death fade can be reused by recycled client entities, so keep their
            // sprite visibility tied to their own server packet alpha instead.
            const rawFade = turretInfo ? 1 : render.status.getFade();
            const fade = isCraftrasTheGreatFriend || isCraftrasTheGreatWarningLine ? 1 : rawFade;
            if (fade === 0) return;

            const alphaFade = fade * alpha;
            if (!canRenderLowAlphaCraftrasImage && alpha === 0) return;
            if (!canRenderLowAlphaCraftrasImage && !global.gameUpdate && alphaFade < 0.5) return;
        
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
            const isCraftrasJane = m.className === "craftrasJane" || craftrasDisplayName === "Jane";
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
            const craftrasHeldCustomLayerTurrets = [];
            let craftrasHeldItemTurret = null;
            let craftrasHeldItemId = null;
            let craftrasOffhandShieldTurret = null;
            let craftrasOffhandShieldId = null;
            let craftrasClericHatTurret = null;
            let craftrasClericStaffTurret = null;
            let craftrasPopeHatTurret = null;
            let craftrasPopeStaffTurret = null;
            let craftrasBlesserHatTurret = null;
            let craftrasBlesserStaffTurret = null;
            let craftrasBandageTurret = null;
            const getCraftrasHelmetIdFromTurretClass = turretClass => {
                if (turretClass === "craftrasHelmetFront") return "iron_helmet";
                if (turretClass === "craftrasHelmetSide") return "diamond_helmet";
                if (turretClass === "craftrasMobSapphireHelmet") return "sapphire_helmet";
                if (turretClass === "craftrasMobRubyHelmet") return "ruby_helmet";
                if (turretClass === "craftrasMobAmethystHelmet") return "amethyst_helmet";
                if (turretClass === "craftrasMobGreatDiamondHelmet") return "great_diamond_helmet";
                if (turretClass === "craftrasHelmetCrown") return "zombie_crown";
                if (turretClass === "craftrasPlayerPopeHat") return "pope_hat";
                if (turretClass === "craftrasPlayerClericHat") return "cleric_hat";
                if (turretClass === "craftrasPlayerBlesserHat") return "blesser_hat";
                if (turretClass === "craftrasPlayerMerchantHat" || turretClass === "craftrasMerchantHat") return "merchant_hat";
                if (turretClass === "craftrasPlayerMonsterMerchantHat" || turretClass === "craftrasMonsterMerchantHat") return "monster_merchant_hat";
                if (turretClass === "craftrasMinerHat") return "miner_hat";
                if (turretClass === "craftrasHealerHat") return "healer_hat";
                if (turretClass === "craftrasBominikHat") return "bominik_hat";
                if (turretClass === "craftrasPlayerJaneHat") return "jane_hat";
                if (turretClass === "craftrasPlayerRubyHelmet") return "ruby_helmet";
                if (turretClass === "craftrasPlayerSapphireHelmet") return "sapphire_helmet";
                if (turretClass === "craftrasPlayerSturdyHelmet") return "sturdy_helmet";
                if (turretClass === "craftrasPlayerGreatIronHelmet") return "great_iron_helmet";
                if (turretClass === "craftrasPlayerGreatDiamondHelmet") return "great_diamond_helmet";
                if (turretClass === "craftrasMobIronHelmet" || turretClass === "craftrasMobIronHelmetSide") return "iron_helmet";
                if (turretClass === "craftrasMobDiamondHelmet" || turretClass === "craftrasMobDiamondHelmetSide") return "diamond_helmet";
                return null;
            };
            const getCraftrasHeldToolIdFromTurretClass = turretClass => {
                if (craftrasCustomToolClasses[turretClass]) return craftrasCustomToolClasses[turretClass].itemId;
                if (turretClass === "craftrasHeldSword") return "sword";
                if (turretClass === "craftrasHeldAdminPickaxe") return "admin_pickaxe";
                if (turretClass === "craftrasHeldWorldeditAxe") return "worldedit_axe";
                if (turretClass === "craftrasHeldDestroyer") return "destroyer";
                if (turretClass === "craftrasHeldLaserTest") return "laser_test";
                if (turretClass === "craftrasHeldBlueLaserBeam") return "blue_laser_beam";
                if (turretClass === "craftrasHeldScreenCutTest") return "screen_cut_test";
                if (turretClass === "craftrasHeldBlacksmithHammer") return "blacksmith_hammer";
                if (turretClass === "craftrasHeldClericStaff") return "cleric_staff";
                if (turretClass === "craftrasHeldZombieWizardStaff") return "zombie_wizard_staff";
                if (turretClass === "craftrasHeldClericStaffOp") return "cleric_staff_op";
                if (turretClass === "craftrasHeldPopeStaff") return "pope_staff";
                if (turretClass === "craftrasHeldBlesserStaff") return "blesser_staff";
                if (turretClass === "craftrasHeldVenomSword") return "venom_sword";
                if (turretClass === "craftrasHeldTheGreat") return "the_great";
                if (turretClass === "craftrasHeldTheGreatFriend") return "the_great_friend";
                if (turretClass === "craftrasHeldRubySword") return "ruby_sword";
                if (turretClass === "craftrasHeldHornSword") return "horn_sword";
                if (turretClass === "craftrasHeldJaneSword") return "jane_sword";
                const match = /^craftrasHeld(Wooden|Stone|Iron|Gold|Diamond|Ruby|Sapphire)(Pickaxe|Axe|Shovel|Sword)$/.exec(turretClass || "");
                return match ? `${match[1].toLowerCase()}_${match[2].toLowerCase()}` : null;
            };
            if (!instance.isImage) {
                for (const turret of turrets) {
                    if (turret.isProp) continue;
                    const turretIndex = +String(turret.index).split("-")[0];
                    const turretClass = global.mockups[turretIndex]?.className;
                    const turretVisible = turret.sizeFactor > 0.01 && (turret.alpha == null || turret.alpha > 0.05);
                    if (turretClass === "craftrasM134Mount" && turret.sizeFactor > 0.01) craftrasM134Turret = turret;
                    if (turretClass === "craftrasRocketLauncherMount" && turret.sizeFactor > 0.01) craftrasRocketLauncherTurret = turret;
                    if (turretClass === "craftrasClericHat" && turret.sizeFactor > 0.01) craftrasClericHatTurret = turret;
                    if (turretClass === "craftrasClericStaff" && turret.sizeFactor > 0.01) craftrasClericStaffTurret = turret;
                    if (turretClass === "craftrasPopeHat" && turret.sizeFactor > 0.01) craftrasPopeHatTurret = turret;
                    if (turretClass === "craftrasPopeStaff" && turret.sizeFactor > 0.01) craftrasPopeStaffTurret = turret;
                    if (turretClass === "craftrasBlesserHat" && turret.sizeFactor > 0.01) craftrasBlesserHatTurret = turret;
                    if (turretClass === "craftrasBlesserStaff" && turret.sizeFactor > 0.01) craftrasBlesserStaffTurret = turret;
                    if (turretClass === "craftrasMobBandageWrap" && turret.sizeFactor > 0.01) craftrasBandageTurret = turret;
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
                    const isTheSword = craftrasDisplayName === "THE SWORD";
                    if (heldToolId && turretVisible && !(isTheSword && heldToolId === "diamond_sword")) {
                        const customLayer = craftrasCustomToolClasses[turretClass];
                        if (customLayer) craftrasHeldCustomLayerTurrets.push({
                            turret,
                            itemId: customLayer.itemId,
                            layerId: customLayer.layerId,
                        });
                        if (!craftrasHeldToolTurret || customLayer?.layerId === "main") craftrasHeldToolTurret = turret;
                        craftrasHeldToolId = heldToolId;
                    }
                    craftrasHelmetId = getCraftrasHelmetIdFromTurretClass(turretClass) || craftrasHelmetId;
                }
            }
            // Jane must always display her dedicated equipment. The normal turret
            // lookup can be skipped by old/cached mockups, so provide a client-side
            // fallback based on the Jane body class itself.
            if (isCraftrasJane) {
                craftrasHelmetId = "jane_hat";
                craftrasHeldToolId = "jane_sword";
                if (!craftrasHeldToolTurret) {
                    craftrasHeldToolTurret = {
                        direction: 0,
                        angle: -35 * Math.PI / 180,
                        offset: 0.82,
                        facing: rot,
                        forceAngle: null,
                        mirrorMasterAngle: true,
                        alpha: 1,
                        sizeFactor: 1,
                    };
                }
            }
            const isCraftrasHelmetTurret = turret => {
                if (turret.isProp) return false;
                const turretIndex = +String(turret.index).split("-")[0];
                const turretClass = global.mockups[turretIndex]?.className;
                return !!getCraftrasHelmetIdFromTurretClass(turretClass);
            };
            const isCraftrasBandageTurret = turret => {
                if (turret.isProp) return false;
                const turretIndex = +String(turret.index).split("-")[0];
                return global.mockups[turretIndex]?.className === "craftrasMobBandageWrap";
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
            const isCraftrasClericImageTurret = turret => {
                if (turret.isProp) return false;
                const turretIndex = +String(turret.index).split("-")[0];
                const turretClass = global.mockups[turretIndex]?.className;
                return turretClass === "craftrasClericHat" || turretClass === "craftrasClericStaff"
                    || turretClass === "craftrasPopeHat" || turretClass === "craftrasPopeStaff"
                    || turretClass === "craftrasBlesserHat" || turretClass === "craftrasBlesserStaff";
            };
            const drawCraftrasClericTurretImage = (turret, image, options = {}) => {
                if (!turret || !image?.complete || !image.naturalWidth) return false;
                const ang = turret.direction + turret.angle + rot;
                const len = turret.offset * drawSize;
                const facing = turret.forceAngle === null || turret.forceAngle === undefined
                    ? (turret.mirrorMasterAngle || turretsObeyRot) ? rot + turret.angle : turret.facing
                    : turret.angle;
                const imageSize = drawSize * (options.scale || 2.7) * (turret.sizeFactor || 1);
                context.save();
                context.translate(xx + len * Math.cos(ang), yy + len * Math.sin(ang));
                context.rotate(facing + (options.rotateOffset || 0));
                context.imageSmoothingEnabled = true;
                if (options.glow) {
                    context.shadowColor = options.glow;
                    context.shadowBlur = imageSize * 0.14;
                }
                context.drawImage(
                    image,
                    -imageSize * (options.anchorX ?? 0.5),
                    -imageSize * (options.anchorY ?? 0.5),
                    imageSize,
                    imageSize,
                );
                context.restore();
                return true;
            };

            // --- Gun positions with single update ---
            source.guns.update();
        
            // --- Fancy canvas with reduced state setup ---
            let xx = x, yy = y;
            const useFancyCanvas = DEAIC(assignedContext, alphaFade, m.shape, m.glow, source.guns.length, turrets.length);
        
            if (useFancyCanvas) {
                context = ctx2;
                const customImageExtent = craftrasClericHatTurret || craftrasClericStaffTurret || craftrasPopeHatTurret || craftrasPopeStaffTurret || craftrasBlesserHatTurret || craftrasBlesserStaffTurret
                    ? 14
                    : craftrasHeldToolTurret || craftrasHeldItemTurret || craftrasOffhandShieldTurret || craftrasHelmetId ? 8 : 0;
                const normalCanvasSize = drawSize * m.position.axis + ratio * 20 * m.position.axis;
                const customCanvasSize = customImageExtent ? drawSize * customImageExtent + ratio * 20 : 0;
                context.canvas.width = context.canvas.height = Math.max(normalCanvasSize, customCanvasSize);
                xx = context.canvas.width / 2 - (drawSize * m.position.axis * m.position.middle.x * Math.cos(rot)) / 4;
                yy = context.canvas.height / 2 - (drawSize * m.position.axis * m.position.middle.x * Math.sin(rot)) / 4;
                context.translate(0.5, 0.5);
            } else if (!canRenderLowAlphaCraftrasImage && alphaFade < 0.5 && !config.graphical.fancyAnimations) {
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

            const craftrasPopeMagicCircleImages = {
                craftrasPopeMagicCircle1: craftrasClericImages.popeMagicCircle1,
                craftrasPopeMagicCircle2: craftrasClericImages.popeMagicCircle2,
                craftrasPopeMagicCircle3: craftrasClericImages.popeMagicCircle3,
            };
            const popeMagicCircleImage = craftrasPopeMagicCircleImages[m.className];
            if (popeMagicCircleImage?.complete && popeMagicCircleImage.naturalWidth) {
                const circleSize = drawSize * 7.2;
                if (!craftrasPopeMagicCircleSeenAt.has(instance.id)) craftrasPopeMagicCircleSeenAt.set(instance.id, performance.now());
                if (craftrasPopeMagicCircleSeenAt.size > 200) {
                    const keepAfter = performance.now() - 30_000;
                    for (const [id, seenAt] of craftrasPopeMagicCircleSeenAt) if (seenAt < keepAfter) craftrasPopeMagicCircleSeenAt.delete(id);
                }
                const localFade = Math.max(0, Math.min(1, (performance.now() - craftrasPopeMagicCircleSeenAt.get(instance.id)) / 3000));
                const serverFade = Math.max(0, Math.min(1, instance.alpha ?? 1));
                const magicAlpha = localFade * serverFade;
                const direction = m.className === "craftrasPopeMagicCircle2" ? -1 : 1;
                const magicRotation = rot + direction * performance.now() / 1000 * 1.8;
                context.save();
                context.globalAlpha = magicAlpha;
                context.translate(xx, yy);
                context.rotate(magicRotation);
                context.imageSmoothingEnabled = true;
                context.drawImage(popeMagicCircleImage, -circleSize / 2, -circleSize / 2, circleSize, circleSize);
                context.restore();
                return;
            }

            if (isCraftrasPhoenixEffect && craftrasPhoenixEffectImage.complete && craftrasPhoenixEffectImage.naturalWidth) {
                const effectSize = drawSize * 3.8;
                context.save();
                context.globalAlpha = Math.max(0, Math.min(0.6, alphaFade));
                context.translate(xx, yy);
                context.imageSmoothingEnabled = true;
                context.drawImage(craftrasPhoenixEffectImage, -effectSize / 2, -effectSize / 2, effectSize, effectSize);
                context.restore();
                return;
            }

            if (isCraftrasParryEffect && craftrasParryEffectImage.complete && craftrasParryEffectImage.naturalWidth) {
                const effectSize = drawSize * 4.2;
                context.save();
                context.globalAlpha = Math.max(0, Math.min(1, alphaFade));
                context.translate(xx, yy);
                context.rotate(rot);
                context.imageSmoothingEnabled = true;
                context.drawImage(craftrasParryEffectImage, -effectSize / 2, -effectSize / 2, effectSize, effectSize);
                context.restore();
                return;
            }

            if (isCraftrasChallengeMagicCircle && craftrasChallengeMagicCircleImage.complete && craftrasChallengeMagicCircleImage.naturalWidth) {
                const circleSize = drawSize * 7.2;
                context.save();
                context.globalAlpha *= Math.max(0, Math.min(1, instance.alpha ?? 1));
                context.translate(xx, yy);
                context.rotate(rot);
                context.imageSmoothingEnabled = true;
                context.drawImage(craftrasChallengeMagicCircleImage, -circleSize / 2, -circleSize / 2, circleSize, circleSize);
                context.restore();
                return;
            }

            if (isCraftrasBasicMagicCircle && craftrasBasicMagicCircleImage.complete && craftrasBasicMagicCircleImage.naturalWidth) {
                const circleSize = drawSize * 7.2;
                context.save();
                context.globalAlpha *= Math.max(0, Math.min(1, instance.alpha ?? 1));
                context.translate(xx, yy);
                context.rotate(rot + performance.now() / 1000 * 1.2);
                context.imageSmoothingEnabled = true;
                context.drawImage(craftrasBasicMagicCircleImage, -circleSize / 2, -circleSize / 2, circleSize, circleSize);
                context.restore();
                return;
            }

            const bominikMagicCircleImage = craftrasBominikMagicCircleImages[m.className];
            if (isCraftrasBominikMagicCircle && bominikMagicCircleImage?.complete && bominikMagicCircleImage.naturalWidth) {
                const circleSize = drawSize * 7.2;
                const direction = m.className === "craftrasBominikMagicCircle2" ? -1 : 1;
                context.save();
                context.globalAlpha *= Math.max(0, Math.min(1, instance.alpha ?? 1));
                context.translate(xx, yy);
                context.rotate(rot + direction * performance.now() / 1000 * 1.6);
                context.imageSmoothingEnabled = true;
                context.drawImage(bominikMagicCircleImage, -circleSize / 2, -circleSize / 2, circleSize, circleSize);
                context.restore();
                return;
            }

            const janeMagicCircleImage = craftrasJaneMagicCircleImages[m.className];
            if (isCraftrasJaneMagicCircle && janeMagicCircleImage?.complete && janeMagicCircleImage.naturalWidth) {
                const circleSize = drawSize * 7.4;
                const index = Number(String(m.className).slice(-1)) || 1;
                const direction = index === 2 ? -1 : 1;
                context.save();
                context.globalAlpha *= Math.max(0, Math.min(1, instance.alpha ?? 1));
                context.translate(xx, yy);
                context.rotate(rot + direction * performance.now() / 1000 * (1.35 + index * 0.18));
                context.imageSmoothingEnabled = true;
                context.drawImage(janeMagicCircleImage, -circleSize / 2, -circleSize / 2, circleSize, circleSize);
                context.restore();
                return;
            }

            if (isCraftrasJaneSawProjectile && craftrasJaneSawImage.complete && craftrasJaneSawImage.naturalWidth) {
                const sawSize = Math.max(40, drawSize * 5.4);
                context.save();
                context.globalAlpha *= alphaFade;
                context.translate(xx, yy);
                context.rotate(performance.now() / 1000 * 8);
                context.imageSmoothingEnabled = true;
                context.drawImage(craftrasJaneSawImage, -sawSize / 2, -sawSize / 2, sawSize, sawSize);
                context.globalCompositeOperation = "source-atop";
                context.globalAlpha *= 0.82;
                context.fillStyle = gameDraw.modifyColor(instance.color);
                context.fillRect(-sawSize / 2, -sawSize / 2, sawSize, sawSize);
                context.restore();
                return;
            }

            if (isCraftrasJaneSkillTwoSwordProjectile && craftrasJaneThrowingSwordImage.complete && craftrasJaneThrowingSwordImage.naturalWidth) {
                const swordWidth = Math.max(30, drawSize * 2.7);
                const swordHeight = Math.max(52, drawSize * 4.6);
                const currentX = instance.render?.x ?? instance.x ?? 0;
                const currentY = instance.render?.y ?? instance.y ?? 0;
                let swordState = craftrasJaneSkillTwoSwordAngles.get(instance.id);
                if (!swordState) {
                    swordState = { x: currentX, y: currentY, angle: rot };
                    craftrasJaneSkillTwoSwordAngles.set(instance.id, swordState);
                    if (craftrasJaneSkillTwoSwordAngles.size > 160) {
                        const firstKey = craftrasJaneSkillTwoSwordAngles.keys().next().value;
                        craftrasJaneSkillTwoSwordAngles.delete(firstKey);
                    }
                }
                const movementX = currentX - swordState.x;
                const movementY = currentY - swordState.y;
                if (movementX * movementX + movementY * movementY > 0.0001) {
                    swordState.angle = Math.atan2(movementY, movementX);
                }
                context.save();
                context.globalAlpha *= alphaFade;
                context.translate(xx, yy);
                context.rotate(swordState.angle - Math.PI / 2);
                context.imageSmoothingEnabled = true;
                context.drawImage(craftrasJaneThrowingSwordImage, -swordWidth / 2, -swordHeight / 2, swordWidth, swordHeight);
                context.globalCompositeOperation = "source-atop";
                context.globalAlpha *= 0.68;
                context.fillStyle = gameDraw.modifyColor(instance.color);
                context.fillRect(-swordWidth / 2, -swordHeight / 2, swordWidth, swordHeight);
                context.restore();
                swordState.x = currentX;
                swordState.y = currentY;
                return;
            }

            if (isCraftrasJaneSkillTwoBulletProjectile) {
                const bulletRadius = Math.max(10, drawSize * 1.15);
                context.save();
                context.globalAlpha *= alphaFade;
                context.translate(xx, yy);
                context.fillStyle = gameDraw.modifyColor(instance.color);
                context.strokeStyle = gameDraw.getColorDark(context.fillStyle);
                context.lineWidth = Math.max(2, bulletRadius * 0.12);
                context.beginPath();
                context.arc(0, 0, bulletRadius, 0, Math.PI * 2);
                context.fill();
                context.stroke();
                context.restore();
                return;
            }

            if (isCraftrasGuardianSlashProjectile && craftrasGuardianSlashImage.complete && craftrasGuardianSlashImage.naturalWidth) {
                const slashImage = craftrasGuardianSlashImage;
                const reflectedSlash = String(instance.name || "").includes("[REFLECTED]");
                const reflectedSlashFilter = "brightness(0) saturate(100%) invert(61%) sepia(70%) saturate(3023%) hue-rotate(176deg) brightness(102%) contrast(101%)";
                const janeSlashFilter = "brightness(0) saturate(100%) invert(58%) sepia(92%) saturate(3095%) hue-rotate(286deg) brightness(107%) contrast(104%)";
                const slashFilter = isCraftrasJaneSlashProjectile ? janeSlashFilter : reflectedSlash ? reflectedSlashFilter : null;
                const slashWidth = drawSize * 8.2;
                const slashHeight = drawSize * 4.7;
                const slashRotationOffset = Math.PI;
                const slashOffsetX = -slashWidth * 0.42;
                let slashState = craftrasGuardianSlashAngles.get(instance.id);
                if (!slashState) {
                    slashState = { x: instance.render?.x ?? instance.x ?? 0, y: instance.render?.y ?? instance.y ?? 0, angle: rot, trail: [] };
                    craftrasGuardianSlashAngles.set(instance.id, slashState);
                    if (craftrasGuardianSlashAngles.size > 300) {
                        const firstKey = craftrasGuardianSlashAngles.keys().next().value;
                        craftrasGuardianSlashAngles.delete(firstKey);
                    }
                }
                const currentX = instance.render?.x ?? instance.x ?? slashState.x;
                const currentY = instance.render?.y ?? instance.y ?? slashState.y;
                const deltaX = currentX - slashState.x;
                const deltaY = currentY - slashState.y;
                if (deltaX * deltaX + deltaY * deltaY > 0.0004) slashState.angle = Math.atan2(deltaY, deltaX);
                const trail = slashState.trail || (slashState.trail = []);
                const trailLimit = isCraftrasJaneSlashProjectile ? 0 : 14;
                for (let i = 0; i < trailLimit && i < trail.length; i++) {
                    const ghost = trail[i];
                    const t = (i + 1) / (trail.length + 1);
                    const ghostAlpha = alphaFade * 0.42 * t * t;
                    if (ghostAlpha < 0.015) continue;
                    const ghostScale = 0.68 + t * 0.26;
                    context.save();
                    context.translate(
                        xx + (ghost.x - currentX) * ratio,
                        yy + (ghost.y - currentY) * ratio,
                    );
                    context.rotate(ghost.angle + slashRotationOffset);
                    context.globalAlpha *= ghostAlpha;
                    context.imageSmoothingEnabled = true;
                    if (slashFilter) context.filter = slashFilter;
                    context.drawImage(
                        slashImage,
                        slashOffsetX * ghostScale,
                        -slashHeight * 0.5 * ghostScale,
                        slashWidth * ghostScale,
                        slashHeight * ghostScale,
                    );
                    context.restore();
                }
                context.save();
                context.translate(xx, yy);
                context.rotate(slashState.angle + slashRotationOffset);
                context.globalAlpha *= alphaFade;
                context.imageSmoothingEnabled = true;
                if (slashFilter) context.filter = slashFilter;
                context.drawImage(slashImage, slashOffsetX, -slashHeight / 2, slashWidth, slashHeight);
                context.restore();
                slashState.x = currentX;
                slashState.y = currentY;
                if (trailLimit > 0) {
                    trail.push({ x: currentX, y: currentY, angle: slashState.angle });
                    while (trail.length > trailLimit) trail.shift();
                } else if (trail.length) {
                    trail.length = 0;
                }
                return;
            }

            if (isCraftrasTheGreatFriend) {
                if (alphaFade <= 0.01) {
                    craftrasTheGreatFriendStates.delete(instance.id);
                    return;
                }
                const imageSize = Math.max(drawSize * 4.5, 48);
                const friendVisualAlpha = Math.max(0.92, alphaFade);
                let friendState = craftrasTheGreatFriendStates.get(instance.id);
                if (!friendState) {
                    friendState = { x: instance.render?.x ?? instance.x ?? 0, y: instance.render?.y ?? instance.y ?? 0, angle: rot, trail: [] };
                    craftrasTheGreatFriendStates.set(instance.id, friendState);
                    if (craftrasTheGreatFriendStates.size > 350) {
                        const firstKey = craftrasTheGreatFriendStates.keys().next().value;
                        craftrasTheGreatFriendStates.delete(firstKey);
                    }
                }
                const currentX = instance.render?.x ?? instance.x ?? friendState.x;
                const currentY = instance.render?.y ?? instance.y ?? friendState.y;
                const deltaX = currentX - friendState.x;
                const deltaY = currentY - friendState.y;
                if (deltaX * deltaX + deltaY * deltaY > 0.0004) friendState.angle = Math.atan2(deltaY, deltaX);
                const friendTrail = friendState.trail || (friendState.trail = []);
                for (let i = 0; i < friendTrail.length; i++) {
                    const ghost = friendTrail[i];
                    const t = (i + 1) / (friendTrail.length + 1);
                    const ghostAlpha = friendVisualAlpha * 0.42 * t * t;
                    if (ghostAlpha < 0.015) continue;
                    const ghostScale = 0.68 + t * 0.26;
                    context.save();
                    context.translate(
                        xx + (ghost.x - currentX) * ratio,
                        yy + (ghost.y - currentY) * ratio,
                    );
                    context.rotate(ghost.angle - Math.PI / 2);
                    context.globalAlpha *= ghostAlpha;
                    context.imageSmoothingEnabled = true;
                    if (craftrasTheGreatFriendImage.complete && craftrasTheGreatFriendImage.naturalWidth) {
                        context.drawImage(craftrasTheGreatFriendImage, -imageSize * ghostScale / 2, -imageSize * ghostScale / 2, imageSize * ghostScale, imageSize * ghostScale);
                    } else {
                        context.fillStyle = "#f6d36a";
                        context.strokeStyle = "#fff3b0";
                        context.lineWidth = Math.max(1, drawSize * 0.08 * ghostScale);
                        context.beginPath();
                        context.moveTo(0, imageSize * 0.42 * ghostScale);
                        context.lineTo(-imageSize * 0.15 * ghostScale, -imageSize * 0.08 * ghostScale);
                        context.lineTo(0, -imageSize * 0.5 * ghostScale);
                        context.lineTo(imageSize * 0.15 * ghostScale, -imageSize * 0.08 * ghostScale);
                        context.closePath();
                        context.fill();
                        context.stroke();
                    }
                    context.restore();
                }
                context.save();
                context.translate(xx, yy);
                context.rotate(friendState.angle - Math.PI / 2);
                context.globalAlpha *= friendVisualAlpha;
                context.imageSmoothingEnabled = true;
                if (craftrasTheGreatFriendImage.complete && craftrasTheGreatFriendImage.naturalWidth) {
                    const imageRatio = craftrasTheGreatFriendImage.naturalHeight / Math.max(1, craftrasTheGreatFriendImage.naturalWidth);
                    const renderWidth = imageSize * 0.86;
                    const renderHeight = renderWidth * imageRatio;
                    context.drawImage(craftrasTheGreatFriendImage, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);
                } else {
                    context.fillStyle = "#f6d36a";
                    context.strokeStyle = "#fff3b0";
                    context.lineWidth = Math.max(2, drawSize * 0.1);
                    context.beginPath();
                    context.moveTo(0, imageSize * 0.42);
                    context.lineTo(-imageSize * 0.15, -imageSize * 0.08);
                    context.lineTo(0, -imageSize * 0.5);
                    context.lineTo(imageSize * 0.15, -imageSize * 0.08);
                    context.closePath();
                    context.fill();
                    context.stroke();
                }
                context.restore();
                friendState.x = currentX;
                friendState.y = currentY;
                friendTrail.push({ x: currentX, y: currentY, angle: friendState.angle });
                while (friendTrail.length > 14) friendTrail.shift();
                return;
            }

            if (isCraftrasTheGreatWarningLine) {
                context.save();
                context.globalAlpha *= Math.max(0, Math.min(0.85, alphaFade * (m.alpha ?? 0.78)));
                context.translate(xx, yy);
                context.rotate(rot);
                context.fillStyle = "#ff3030";
                context.fillRect(-drawSize * 36, -Math.max(2, drawSize * 0.42), drawSize * 72, Math.max(4, drawSize * 0.84));
                context.restore();
                return;
            }

            if (isCraftrasBoneBombProjectile && craftrasItemImages.bone_bomb?.complete && craftrasItemImages.bone_bomb.naturalWidth) {
                const bombImage = craftrasItemImages.bone_bomb;
                const imageSize = drawSize * 2;
                context.save();
                context.translate(xx, yy);
                context.rotate(rot + performance.now() / 1000 * 14);
                context.globalAlpha *= alphaFade;
                context.imageSmoothingEnabled = true;
                context.drawImage(bombImage, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
                context.restore();
                return;
            }
        
            // --- Draw turrets beneath with cached values ---
            for (let i = 0; i < turrets.length; i++) {
                let t = turrets[i];
                if (isCraftrasHelmetTurret(t) || isCraftrasM134Turret(t) || isCraftrasRocketLauncherTurret(t) || isCraftrasHeldToolTurret(t) || isCraftrasHeldItemTurret(t) || isCraftrasOffhandShieldTurret(t) || isCraftrasClericImageTurret(t)) continue;
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
            const queenSpiderLegSwings = queenSpiderModel ? Array.from({ length: 8 }, (_, leg) => {
                if (!queenSpiderMoving) return 0;
                const legPhase = queenSpiderLegPhases[leg] || 0;
                const legSpeed = queenSpiderLegSpeeds[leg] || 7;
                const legAmplitude = queenSpiderLegAmplitudes[leg] || 0.11;
                return Math.sin(queenSpiderTime * legSpeed + legPhase) * legAmplitude
                    + Math.sin(queenSpiderTime * (legSpeed * 0.43) + legPhase * 2.7) * legAmplitude * 0.32;
            }) : null;
            const statusColor = render.status.getColor();
            const blend = render.status.getBlend();
            const trailBodyColor = isBulletTrailEntity
                ? gameDraw.mixColors(gameDraw.modifyColor(instance.color, baseColor), statusColor, blend)
                : null;
            if (isBulletTrailEntity && !isCraftrasGuardianSlashProjectile) {
                drawBulletTrail(
                    context,
                    instance,
                    ratio,
                    xx,
                    yy,
                    instance.render?.x ?? instance.x ?? 0,
                    instance.render?.y ?? instance.y ?? 0,
                    drawSize,
                    alphaFade,
                    trailBodyColor,
                );
            }

            const drawCraftrasShield = (turret, shieldId) => {
                const shieldImage = craftrasItemImages[shieldId];
                if (!turret || !shieldImage?.complete || !shieldImage.naturalWidth) return;
                const magicBook = shieldId === "magic_book";
                const shieldSize = drawSize * 3.2 / (magicBook ? 1.1 : 1);
                const blocking = !magicBook && Math.cos((turret.direction || 0) + (turret.angle || 0)) > 0;
                const shieldX = blocking
                    ? xx + Math.cos(rot) * drawSize * 1.05
                    : xx + Math.cos(rot) * drawSize * 0.3 - Math.sin(rot) * drawSize * 1.32;
                const shieldY = blocking
                    ? yy + Math.sin(rot) * drawSize * 1.05
                    : yy + Math.sin(rot) * drawSize * 0.3 + Math.cos(rot) * drawSize * 1.32;
                // Bound turret alpha is not sent to other clients. Carry this
                // state in an imperceptible direction offset instead.
                const shieldSignal = Math.abs(turret.direction || 0);
                let broken = shieldSignal >= 0.0005 && shieldSignal < 0.0015;
                let hit = shieldSignal >= 0.0015;
                if (instance.id === gui.playerid) {
                    const localStack = turret === craftrasOffhandShieldTurret
                        ? global.craftrasInventory?.offhand
                        : global.craftrasHotbar?.slots?.[global.craftrasHotbar.selected];
                    broken = localStack?.id === shieldId && localStack.brokenUntil > Date.now();
                    hit = localStack?.id === shieldId && localStack.hitUntil > Date.now();
                }
                const hitBlink = hit && Math.floor(Date.now() / 90) % 2 === 0;
                context.save();
                context.translate(shieldX, shieldY);
                context.rotate(blocking ? rot - Math.PI : rot + Math.PI / 2);
                context.imageSmoothingEnabled = true;
                context.globalAlpha = broken ? 0.6 : hitBlink ? 0.72 : 1;
                if (hitBlink) context.filter = "brightness(1.9) saturate(2.6) hue-rotate(-12deg)";
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
                    const queenSpiderLeg = queenSpiderModel ? Math.floor(i / queenSpiderSegmentsPerLeg) : 0;
                    const queenSpiderSwing = queenSpiderLegSwings?.[queenSpiderLeg] || 0;
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
                    if (m.className !== "craftrasClericHealCircle") {
                        drawBody(context, xx, yy, sizeRatio, m.shape, rot, m.borderless, m.drawFill, m.imageInterpolation);
                    }

                    if (m.className === "craftrasSpiker") {
                        const spikeCount = 12;
                        const outerRadius = drawSize * 0.94;
                        const innerRadius = drawSize * 0.30;
                        const halfBase = drawSize * 0.14;
                        const spikerRotation = performance.now() / 1000 * Math.PI;
                        context.save();
                        context.fillStyle = "#f7f7f3";
                        context.strokeStyle = "#bfc3c7";
                        context.lineWidth = Math.max(1.5, drawSize * 0.035);
                        context.lineJoin = "round";
                        for (let index = 0; index < spikeCount; index++) {
                            const angle = spikerRotation + index * Math.PI * 2 / spikeCount;
                            const tangentX = -Math.sin(angle) * halfBase;
                            const tangentY = Math.cos(angle) * halfBase;
                            const baseX = xx + Math.cos(angle) * outerRadius;
                            const baseY = yy + Math.sin(angle) * outerRadius;
                            context.beginPath();
                            context.moveTo(baseX + tangentX, baseY + tangentY);
                            context.lineTo(
                                xx + Math.cos(angle) * innerRadius,
                                yy + Math.sin(angle) * innerRadius,
                            );
                            context.lineTo(baseX - tangentX, baseY - tangentY);
                            context.closePath();
                            context.fill();
                            context.stroke();
                        }
                        context.restore();
                    }

                    if (craftrasBandageTurret) {
                        if (craftrasBandageImage.complete && craftrasBandageImage.naturalWidth) {
                            const bandageSize = drawSize * 5.544;
                            const bandageOffsetY = drawSize * 0.12;
                            context.save();
                            context.translate(xx, yy + bandageOffsetY);
                            context.imageSmoothingEnabled = true;
                            context.drawImage(
                                craftrasBandageImage,
                                -bandageSize / 2,
                                -bandageSize / 2,
                                bandageSize,
                                bandageSize,
                            );
                            context.restore();
                        }
                    }

                    if (m.className === "craftrasClericHealCircle" && craftrasClericImages.healCircle.complete && craftrasClericImages.healCircle.naturalWidth) {
                        const circleSize = drawSize * 4.7;
                        context.save();
                        context.translate(xx, yy);
                        context.rotate((m.facing || 0) + performance.now() / 1000 * 90 * Math.PI / 180);
                        context.globalAlpha *= 0.9 + Math.sin(Date.now() / 260) * 0.1;
                        context.imageSmoothingEnabled = true;
                        context.drawImage(craftrasClericImages.healCircle, -circleSize / 2, -circleSize / 2, circleSize, circleSize);
                        context.restore();
                    }
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
                        const helmetSize = drawSize * (craftrasHelmetId === "sturdy_helmet"
                            ? 3.294
                            : craftrasHelmetId === "great_iron_helmet" || craftrasHelmetId === "great_diamond_helmet"
                            ? 4.2
                            : craftrasHelmetId === "ruby_helmet" || craftrasHelmetId === "sapphire_helmet"
                            ? 6
                            : craftrasHelmetId === "blesser_hat" ? 4.29
                            : craftrasHelmetId === "cleric_hat" || craftrasHelmetId === "pope_hat" ? 3.9
                            : craftrasHelmetId === "bominik_hat" ? 5.2
                            : craftrasHelmetId === "jane_hat" ? 4.1
                            : craftrasHelmetId === "miner_hat" || craftrasHelmetId === "healer_hat" ? 4.8
                            : craftrasHelmetId === "merchant_hat" || craftrasHelmetId === "monster_merchant_hat" ? 3.55 : 3);
                        const helmetLift = craftrasHelmetId === "cleric_hat"
                            ? 0.38
                            : craftrasHelmetId === "pope_hat"
                            ? 1.46
                            : craftrasHelmetId === "blesser_hat" ? 0.86
                            : craftrasHelmetId === "bominik_hat" ? 0.82
                            : craftrasHelmetId === "jane_hat" ? 0.74
                            : craftrasHelmetId === "miner_hat" || craftrasHelmetId === "healer_hat" ? 0.62
                            : craftrasHelmetId === "merchant_hat" || craftrasHelmetId === "monster_merchant_hat" ? 0.74
                            : craftrasHelmetId === "sturdy_helmet" ? 0.5
                            : craftrasHelmetId === "great_iron_helmet" || craftrasHelmetId === "great_diamond_helmet" ? 0.34
                            : craftrasHelmetId === "ruby_helmet" || craftrasHelmetId === "sapphire_helmet" ? 0.45
                            : craftrasHelmetId === "zombie_crown" ? 0.73 : 0.16;
                        drawCraftrasHelmetImage(context, helmetImage, craftrasHelmetId, -helmetSize / 2, -helmetSize / 2 - drawSize * helmetLift, helmetSize);
                        context.restore();
                    }

                    drawCraftrasClericTurretImage(craftrasClericHatTurret, craftrasClericImages.hat, {
                        scale: 11.75,
                        rotateOffset: Math.PI / 2,
                        anchorX: 0.5,
                        anchorY: 0.78,
                        glow: "#fff1a8",
                    });
                    drawCraftrasClericTurretImage(craftrasPopeHatTurret, craftrasClericImages.popeHat, {
                        scale: 12.4,
                        rotateOffset: Math.PI / 2,
                        anchorX: 0.5,
                        anchorY: 0.86,
                        glow: "#fff6c9",
                    });
                    drawCraftrasClericTurretImage(craftrasBlesserHatTurret, craftrasClericImages.blesserHat, {
                        scale: 11.66,
                        rotateOffset: Math.PI / 2,
                        anchorX: 0.5,
                        anchorY: 0.72,
                        glow: "#bdf6ff",
                    });
                    drawCraftrasClericTurretImage(craftrasClericStaffTurret, craftrasClericImages.staff, {
                        scale: 4.875,
                        rotateOffset: Math.PI / 4,
                        anchorX: 0.5,
                        anchorY: 0.5,
                    });
                    drawCraftrasClericTurretImage(craftrasPopeStaffTurret, craftrasClericImages.popeStaff, {
                        scale: 10.2,
                        rotateOffset: Math.PI / 4,
                        anchorX: 0.5,
                        anchorY: 0.5,
                    });
                    drawCraftrasClericTurretImage(craftrasBlesserStaffTurret, craftrasClericImages.blesserStaff, {
                        scale: 10.0,
                        rotateOffset: Math.PI / 4,
                        anchorX: 0.5,
                        anchorY: 0.5,
                    });

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
                    const heldCustomTool = craftrasCustomToolDefinitions[craftrasHeldToolId];
                    if (heldCustomTool && craftrasHeldCustomLayerTurrets.length) {
                        const layerById = Object.fromEntries((heldCustomTool.layers || []).map(layer => [layer.id, layer]));
                        const orderedLayers = craftrasHeldCustomLayerTurrets
                            .filter(entry => entry.itemId === craftrasHeldToolId)
                            .sort((left, right) => (Number(layerById[left.layerId]?.priority) || 0) - (Number(layerById[right.layerId]?.priority) || 0));
                        for (const entry of orderedLayers) {
                            const layer = layerById[entry.layerId];
                            const image = heldCustomTool._layerImages?.[entry.layerId];
                            if (!layer || !image?.complete || !image.naturalWidth) continue;
                            const t = entry.turret;
                            const ang = t.direction + t.angle + rot;
                            const len = t.offset * drawSize;
                            const facing = t.forceAngle === null || t.forceAngle === undefined
                                ? (t.mirrorMasterAngle || turretsObeyRot) ? rot + t.angle : t.facing
                                : t.angle;
                            const weaponWidth = drawSize * (Number(heldCustomTool.renderScale) || 3.25) * (Number(t.sizeFactor) || 1);
                            const weaponHeight = weaponWidth * image.naturalHeight / Math.max(1, image.naturalWidth);
                            const anchorX = Math.max(0, Math.min(1, Number(layer.anchor?.x) || 0));
                            const anchorY = Math.max(0, Math.min(1, Number(layer.anchor?.y) || 0));
                            context.save();
                            context.translate(xx + len * Math.cos(ang), yy + len * Math.sin(ang));
                            context.rotate(facing + (Number(heldCustomTool.rotationOffset) || 0) * Math.PI / 180);
                            if (layer.flipX) context.scale(-1, 1);
                            const layerOpacity = Number.isFinite(Number(layer.opacity)) ? Number(layer.opacity) : 1;
                            context.globalAlpha *= Math.max(0, Math.min(1, layerOpacity));
                            context.imageSmoothingEnabled = true;
                            context.drawImage(image, -weaponWidth * anchorX, -weaponHeight * anchorY, weaponWidth, weaponHeight);
                            context.restore();
                        }
                    }
                    if (!heldCustomTool && craftrasHeldToolTurret && heldToolImage?.complete && heldToolImage.naturalWidth) {
                        const t = craftrasHeldToolTurret;
                        const ang = t.direction + t.angle + rot;
                        const len = t.offset * drawSize;
                        const facing = t.forceAngle === null || t.forceAngle === undefined
                            ? (t.mirrorMasterAngle || turretsObeyRot) ? rot + t.angle : t.facing
                            : t.angle;
                        const customTool = craftrasCustomToolDefinitions[craftrasHeldToolId];
                        const isSwordTool = !!customTool || craftrasHeldToolId === "sword" || craftrasHeldToolId === "the_great" || craftrasHeldToolId === "the_great_friend" || craftrasHeldToolId?.endsWith("_sword");
                        const isHammerTool = craftrasHeldToolId === "blacksmith_hammer";
                        const isStaffTool = craftrasHeldToolId === "cleric_staff" || craftrasHeldToolId === "zombie_wizard_staff" || craftrasHeldToolId === "cleric_staff_op" || craftrasHeldToolId === "pope_staff" || craftrasHeldToolId === "blesser_staff" || craftrasHeldToolId === "blue_laser_beam";
                        const toolSize = drawSize * (customTool
                            ? (Number(customTool.renderScale) || 3.25) * (Number(t.sizeFactor) || 1)
                            : craftrasHeldToolId === "the_great" ? 2.175 : craftrasHeldToolId === "the_great_friend" ? 4.7 : craftrasHeldToolId === "jane_sword" ? 4.35 : isSwordTool ? 3.25 : isHammerTool ? 3.45 : craftrasHeldToolId === "zombie_wizard_staff" ? 5.325 / 1.4 : isStaffTool ? 5.325 : 3.05);
                        const staffCooling = isStaffTool && (t.alpha ?? 1) <= 0.55;
                        context.save();
                        context.translate(xx + len * Math.cos(ang), yy + len * Math.sin(ang));
                        const toolRotationOffset = customTool
                            ? (Number(customTool.rotationOffset) || 0) * Math.PI / 180
                            : craftrasHeldToolId === "the_great"
                            ? Math.PI / 4 - 80 * Math.PI / 180
                            : craftrasHeldToolId === "the_great_friend" || craftrasHeldToolId === "jane_sword"
                            ? -Math.PI / 2
                            : craftrasHeldToolId === "blue_laser_beam"
                            ? Math.PI / 2
                            : Math.PI / 4;
                        context.rotate(facing + toolRotationOffset);
                        context.imageSmoothingEnabled = true;
                        if (staffCooling) {
                            context.globalAlpha *= 0.5;
                            context.filter = "brightness(0.9) sepia(1) saturate(8) hue-rotate(-35deg)";
                        } else if (craftrasHeldToolId === "admin_pickaxe" || craftrasHeldToolId === "worldedit_axe" || craftrasHeldToolId === "cleric_staff_op") {
                            context.filter = `hue-rotate(${Math.floor(Date.now() / 8) % 360}deg) saturate(2.4) brightness(1.25)`;
                        } else if (craftrasHeldToolId === "destroyer") {
                            context.filter = "brightness(0) saturate(1)";
                        } else if (craftrasHeldToolId === "laser_test") {
                            context.filter = "brightness(0) saturate(100%) invert(42%) sepia(95%) saturate(3500%) hue-rotate(306deg) brightness(108%) contrast(102%)";
                        }
                        if (customTool) {
                            const imageRatio = heldToolImage.naturalHeight / Math.max(1, heldToolImage.naturalWidth);
                            const weaponWidth = toolSize;
                            const weaponHeight = weaponWidth * imageRatio;
                            const anchorX = Math.max(0, Math.min(1, Number(customTool.anchor?.x) || 0));
                            const anchorY = Math.max(0, Math.min(1, Number(customTool.anchor?.y) || 0));
                            context.drawImage(heldToolImage, -weaponWidth * anchorX, -weaponHeight * anchorY, weaponWidth, weaponHeight);
                        } else if (craftrasHeldToolId === "the_great") {
                            const imageRatio = heldToolImage.naturalHeight / Math.max(1, heldToolImage.naturalWidth);
                            const weaponWidth = toolSize;
                            const weaponHeight = toolSize * imageRatio;
                            context.drawImage(heldToolImage, -weaponWidth * 0.5, -weaponHeight * 0.23, weaponWidth, weaponHeight);
                        } else if (craftrasHeldToolId === "the_great_friend" || craftrasHeldToolId === "jane_sword") {
                            const imageRatio = heldToolImage.naturalHeight / Math.max(1, heldToolImage.naturalWidth);
                            const weaponWidth = toolSize;
                            const weaponHeight = weaponWidth * imageRatio;
                            const anchorY = craftrasHeldToolId === "jane_sword" ? 0.19 : 0.24;
                            context.drawImage(heldToolImage, -weaponWidth * 0.5, -weaponHeight * anchorY, weaponWidth, weaponHeight);
                        } else if (isSwordTool) {
                            context.drawImage(heldToolImage, -toolSize * 0.28, -toolSize * 0.72, toolSize, toolSize);
                        } else if (isHammerTool) {
                            context.drawImage(heldToolImage, -toolSize * 0.46, -toolSize * 0.58, toolSize, toolSize);
                        } else if (craftrasHeldToolId === "blue_laser_beam") {
                            const imageRatio = heldToolImage.naturalHeight / Math.max(1, heldToolImage.naturalWidth);
                            const weaponHeight = drawSize * 5.4;
                            const weaponWidth = weaponHeight / Math.max(0.01, imageRatio);
                            context.drawImage(heldToolImage, -weaponWidth * 0.5, -weaponHeight * 0.5, weaponWidth, weaponHeight);
                        } else if (craftrasHeldToolId === "zombie_wizard_staff") {
                            const imageRatio = heldToolImage.naturalHeight / Math.max(1, heldToolImage.naturalWidth);
                            const weaponHeight = toolSize;
                            const weaponWidth = weaponHeight / Math.max(0.01, imageRatio);
                            context.drawImage(heldToolImage, -weaponWidth * 0.44, -weaponHeight * 0.62, weaponWidth, weaponHeight);
                        } else if (isStaffTool) {
                            context.drawImage(heldToolImage, -toolSize * 0.44, -toolSize * 0.62, toolSize, toolSize);
                        } else {
                            context.drawImage(heldToolImage, -toolSize / 2, -toolSize / 2, toolSize, toolSize);
                        }
                        context.restore();
                    }

                    if (craftrasHeldItemTurret && craftrasHeldItemId) {
                        const heldImage = craftrasItemImages[craftrasHeldItemId];
                        const shield = craftrasHeldItemId.endsWith("_shield");
                        if (!shield) {
                            const heldSize = drawSize * (craftrasHeldItemId === "torch" || craftrasHeldItemId === "steel_torch" ? 3.4 : 1.7);
                            const heldAngle = rot + (craftrasHeldItemTurret.angle || 0);
                            const heldDistance = (craftrasHeldItemTurret.offset || 1) * drawSize * 1.15;
                            const heldX = xx + Math.cos(heldAngle) * heldDistance;
                            const heldY = yy + Math.sin(heldAngle) * heldDistance;
                            context.save();
                            context.translate(heldX, heldY);
                            context.rotate(heldAngle + Math.PI / 4);
                            context.imageSmoothingEnabled = true;
                            if (craftrasHeldItemId === "parry_tool_op") {
                                context.filter = `hue-rotate(${Math.floor(Date.now() / 8) % 360}deg) saturate(2.6) brightness(1.2)`;
                            }
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
                if (isCraftrasHelmetTurret(t) || isCraftrasBandageTurret(t) || isCraftrasM134Turret(t) || isCraftrasRocketLauncherTurret(t) || isCraftrasHeldToolTurret(t) || isCraftrasHeldItemTurret(t) || isCraftrasOffhandShieldTurret(t) || isCraftrasClericImageTurret(t)) continue;
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
        if (global.craftrasWorld?.world2ChallengeMode) {
            ctx[0].globalAlpha = 1;
            ctx[0].fillStyle = "#dabb70";
            ctx[0].fillRect(roomX, roomY, roomWidth, roomHeight);
        }
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
                            // These images are part of the startup preload manifest, so reuse
                            // the already decoded browser copy instead of issuing a new URL.
                            tile.renderImage.src = `/img/${tile.image}`;
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

    function clearCraftrasTorchGifOverlays() {
        for (const image of craftrasTorchGifOverlays.values()) image.remove();
        craftrasTorchGifOverlays.clear();
    }

    function syncCraftrasTorchGifOverlays(px, py, ratio) {
        const world = global.craftrasWorld;
        const wrapper = document.getElementById("gameAreaWrapper");
        if (!wrapper || !world?.active || !world.chunkEntries?.size) {
            clearCraftrasTorchGifOverlays();
            return;
        }
        const blockSize = world.blockSize || 82;
        const wallSize = world.wallSize || blockSize;
        const chunkSize = world.chunkSize || 8;
        const halfScreenWorldX = global.screenWidth / ratio / 2;
        const halfScreenWorldY = global.screenHeight / ratio / 2;
        const minBlockX = Math.floor((global.player.renderx - halfScreenWorldX) / blockSize) - 1;
        const maxBlockX = Math.floor((global.player.renderx + halfScreenWorldX) / blockSize) + 1;
        const minBlockY = Math.floor((global.player.rendery - halfScreenWorldY) / blockSize) - 1;
        const maxBlockY = Math.floor((global.player.rendery + halfScreenWorldY) / blockSize) + 1;
        const minChunkX = Math.floor(minBlockX / chunkSize);
        const maxChunkX = Math.floor(maxBlockX / chunkSize);
        const minChunkY = Math.floor(minBlockY / chunkSize);
        const maxChunkY = Math.floor(maxBlockY / chunkSize);
        const kingdomTransitionAlpha = getCraftrasKingdomTransitionAlpha();
        const seen = new Set();
        const blockScreenSize = Math.max(1, wallSize * ratio);
        const fireSize = Math.max(20, blockScreenSize * 1.12);

        for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
            for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
                const entries = world.chunkEntries.get(`${chunkX},${chunkY}`);
                if (!entries?.length) continue;
                const chunkBlockX = chunkX * chunkSize;
                const chunkBlockY = chunkY * chunkSize;
                for (const entry of entries) {
                    const torchCode = entry.code & 31;
                    if (torchCode !== CRAFTRAS_TORCH_BLOCK_CODE && torchCode !== CRAFTRAS_STEEL_TORCH_BLOCK_CODE) continue;
                    const blockX = chunkBlockX + entry.localX;
                    const blockY = chunkBlockY + entry.localY;
                    if (blockX < minBlockX || blockX > maxBlockX || blockY < minBlockY || blockY > maxBlockY) continue;
                    const key = `${blockX},${blockY}`;
                    seen.add(key);
                    const worldX = blockX * blockSize + blockSize / 2;
                    const worldY = blockY * blockSize + blockSize / 2;
                    const screenX = ratio * worldX - px + global.screenWidth / 2;
                    const screenY = ratio * worldY - py + global.screenHeight / 2 - blockScreenSize * (torchCode === CRAFTRAS_STEEL_TORCH_BLOCK_CODE ? 0.36 : 0.30);
                    let image = craftrasTorchGifOverlays.get(key);
                    if (!image) {
                        image = document.createElement("img");
                        image.src = CRAFTRAS_TORCH_FIRE_GIF_SRC;
                        image.alt = "";
                        image.draggable = false;
                        image.style.position = "absolute";
                        image.style.pointerEvents = "none";
                        image.style.zIndex = "2";
                        image.style.transform = "translate(-50%, -50%)";
                        image.style.imageRendering = "auto";
                        image.style.userSelect = "none";
                        craftrasTorchGifOverlays.set(key, image);
                        wrapper.appendChild(image);
                    }
                    image.style.display = "block";
                    image.style.left = `${screenX}px`;
                    image.style.top = `${screenY}px`;
                    image.style.width = `${fireSize}px`;
                    image.style.height = `${fireSize}px`;
                    const inKingdom = !!CraftrasWorld.isBrokenKingdomSurfaceCell?.(blockX, blockY);
                    let overlayAlpha = (inKingdom ? kingdomTransitionAlpha : 1)
                        * getCraftrasKingdomRainVisibilityAt(worldX, worldY);
                    image.style.opacity = String(Math.max(0, Math.min(1, overlayAlpha)));
                }
            }
        }
        for (const [key, image] of craftrasTorchGifOverlays) {
            if (seen.has(key)) continue;
            image.remove();
            craftrasTorchGifOverlays.delete(key);
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
        const minChunkX = Math.floor(minBlockX / chunkSize);
        const maxChunkX = Math.floor(maxBlockX / chunkSize);
        const minChunkY = Math.floor(minBlockY / chunkSize);
        const maxChunkY = Math.floor(maxBlockY / chunkSize);
        const kingdomTransitionAlpha = getCraftrasKingdomTransitionAlpha();

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
        const getBlockStyle = (code, world2Block = false) => {
            let fill = "#96999f", stroke = "#676a70";
            if (world2Block && code >= 4 && code <= 8) {
                fill = "#6f737a";
                stroke = "#454950";
            }
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
            else if (code === CRAFTRAS_TORCH_BLOCK_CODE) { fill = "#7b4a24"; stroke = "#2d180b"; }
            else if (code === CRAFTRAS_STEEL_TORCH_BLOCK_CODE) { fill = "#9ca6ad"; stroke = "#3f474d"; }
            else if (code === 22) { fill = "#29d6b4"; stroke = "#075f57"; }
            else if (code === 29) { fill = "#596dff"; stroke = "#202b99"; }
            else if (code === 24) { fill = "#419cff"; stroke = "#0c4b91"; }
            else if (code === 26) { fill = "#a653ff"; stroke = "#4b167d"; }
            else if (code === 27) { fill = "#dabb70"; stroke = "#a88442"; }
            else if (code === 28) { fill = "#5f646b"; stroke = "#3d4248"; }
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
        const drawDetailedFloors = !world.world2ChallengeMode && floorSize >= 2.5;
        if (drawDetailedFloors) for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
            for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
                const entries = world.floorChunkEntries?.get(`${chunkX},${chunkY}`);
                if (!entries?.length) continue;
                const chunkBlockX = chunkX * chunkSize;
                const chunkBlockY = chunkY * chunkSize;
                for (const entry of entries) {
                const blockX = chunkBlockX + entry.localX;
                const blockY = chunkBlockY + entry.localY;
                if (blockX < minBlockX || blockX > maxBlockX || blockY < minBlockY || blockY > maxBlockY) continue;
                const floorRenderCode = entry.code;
                const code = floorRenderCode & 31;
                const damageStage = (floorRenderCode >> 5) & 3;
                if (!code) continue;
                const worldX = blockX * blockSize + blockSize / 2;
                const worldY = blockY * blockSize + blockSize / 2;
                const screenX = ratio * worldX - px + global.screenWidth / 2;
                const screenY = ratio * worldY - py + global.screenHeight / 2;
                const style = getBlockStyle(code);
                const cellAlpha = (CraftrasWorld.isBrokenKingdomSurfaceCell?.(blockX, blockY) ? kingdomTransitionAlpha : 1)
                    * getCraftrasKingdomRainVisibilityAt(worldX, worldY);
                context.save();
                context.globalAlpha = cellAlpha;
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
                } else if (code === 27) {
                    const grain = Math.max(1, floorSize * 0.035);
                    const offset = ((blockX * 17 + blockY * 31) & 7) / 7;
                    context.fillStyle = "rgba(255, 241, 174, 0.28)";
                    context.fillRect(screenX - floorSize * (0.34 - offset * 0.12), screenY - floorSize * 0.22, grain * 2.4, grain);
                    context.fillRect(screenX + floorSize * 0.18, screenY + floorSize * (0.16 + offset * 0.08), grain * 1.6, grain);
                    context.strokeStyle = "rgba(137, 101, 43, 0.18)";
                    context.lineWidth = Math.max(0.7, floorSize * 0.018);
                    context.beginPath();
                    context.moveTo(screenX - floorSize * 0.36, screenY + floorSize * (0.04 + offset * 0.08));
                    context.quadraticCurveTo(screenX, screenY - floorSize * 0.08, screenX + floorSize * 0.36, screenY + floorSize * 0.02);
                    context.stroke();
                } else if (code === 28) {
                    const chip = Math.max(1, floorSize * 0.045);
                    const offset = ((blockX * 13 + blockY * 19) & 7) / 7;
                    context.fillStyle = "rgba(27, 31, 36, 0.24)";
                    context.fillRect(screenX - floorSize * (0.30 - offset * 0.10), screenY - floorSize * 0.20, chip * 2.2, chip);
                    context.fillRect(screenX + floorSize * 0.17, screenY + floorSize * 0.21, chip * 1.5, chip);
                    context.strokeStyle = "rgba(178, 184, 191, 0.13)";
                    context.lineWidth = Math.max(0.7, floorSize * 0.018);
                    context.beginPath();
                    context.moveTo(screenX - floorSize * 0.30, screenY + floorSize * 0.24);
                    context.lineTo(screenX - floorSize * 0.05, screenY + floorSize * 0.05);
                    context.lineTo(screenX + floorSize * (0.16 + offset * 0.08), screenY + floorSize * 0.12);
                    context.stroke();
                }
                const placedImage = craftrasPlacedBlockImages[code];
                if (placedImage?.complete && placedImage.naturalWidth) {
                    context.globalAlpha = cellAlpha;
                    context.imageSmoothingEnabled = false;
                    context.drawImage(placedImage, screenX - floorHalfSize, screenY - floorHalfSize, floorSize, floorSize);
                }
                const breakImage = craftrasBlockBreakImages[damageStage];
                if (breakImage?.complete && breakImage.naturalWidth) {
                    context.globalAlpha = 0.7 * cellAlpha;
                    context.imageSmoothingEnabled = false;
                    context.drawImage(breakImage, screenX - floorHalfSize, screenY - floorHalfSize, floorSize, floorSize);
                }
                context.restore();
                }
            }
        }

        const drawDetailedBlocks = size >= 4;
        const heldStack = global.craftrasHotbar?.slots?.[global.craftrasHotbar.selected];
        const revealTransparentBlocks = heldStack?.id === "transparent_block";
        const revealTextStoryBlocks = heldStack?.id === "worldedit_axe";
        for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
            for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
                const entries = world.chunkEntries?.get(`${chunkX},${chunkY}`);
                if (!entries?.length) continue;
                const chunkBlockX = chunkX * chunkSize;
                const chunkBlockY = chunkY * chunkSize;
                for (const entry of entries) {
                const blockX = chunkBlockX + entry.localX;
                const blockY = chunkBlockY + entry.localY;
                if (blockX < minBlockX || blockX > maxBlockX || blockY < minBlockY || blockY > maxBlockY) continue;
                const renderCode = entry.code;
                const code = renderCode & 31;
                const damageStage = (renderCode >> 5) & 3;
                const direction = (renderCode >> 7) & 3;
                if (!code) continue;
                if (code === 23 || code === 25 || code === 24 && !revealTransparentBlocks || code === 26 && !revealTextStoryBlocks) continue;
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
                const cellAlpha = (CraftrasWorld.isBrokenKingdomSurfaceCell?.(blockX, blockY) ? kingdomTransitionAlpha : 1)
                    * getCraftrasKingdomRainVisibilityAt(worldX, worldY);
                context.globalAlpha = code === 24 ? 0.62 * cellAlpha : cellAlpha;

                if (code === CRAFTRAS_TORCH_BLOCK_CODE || code === CRAFTRAS_STEEL_TORCH_BLOCK_CODE) {
                    context.save();
                    const torchImage = craftrasPlacedBlockImages[code];
                    if (torchImage?.complete && torchImage.naturalWidth) {
                        context.imageSmoothingEnabled = false;
                        context.globalAlpha = cellAlpha;
                        context.drawImage(torchImage, screenX - halfSize, screenY - halfSize, size, size);
                    } else {
                        context.fillStyle = "#7b4a24";
                        context.fillRect(screenX - size * 0.06, screenY - size * 0.12, size * 0.12, size * 0.48);
                        context.fillStyle = "#f6b03d";
                        context.fillRect(screenX - size * 0.11, screenY - size * 0.28, size * 0.22, size * 0.18);
                    }
                    if (craftrasTorchFireGifImage.complete && craftrasTorchFireGifImage.naturalWidth) {
                        const fireSize = Math.max(20, size * 1.12);
                        const fireY = screenY - size * (code === CRAFTRAS_STEEL_TORCH_BLOCK_CODE ? 0.36 : 0.30);
                        context.imageSmoothingEnabled = true;
                        context.globalAlpha = cellAlpha;
                        context.drawImage(craftrasTorchFireGifImage, screenX - fireSize / 2, fireY - fireSize / 2, fireSize, fireSize);
                    }
                    context.restore();
                } else if (code === 1) {
                    context.save();
                    context.globalAlpha = 0.3 * cellAlpha;
                    drawCraftrasPolygon(context, screenX, screenY, size, 9, -Math.PI / 2, "#166b35", "#0e4c25");
                    context.restore();
                } else {
                    const { fill, stroke } = getBlockStyle(code, CraftrasWorld.isInsideWorld2?.(blockX, blockY));
                    context.globalAlpha = code === 24 ? 0.62 * cellAlpha : cellAlpha;
                    context.fillStyle = fill;
                    context.fillRect(left, top, size, size);
                    if (drawDetailedBlocks) {
                        context.strokeStyle = stroke;
                        context.strokeRect(left, top, size, size);
                    }
                    if (code === 26) {
                        const storyIndex = global.craftrasTextStoryMarkers?.get(`${blockX},${blockY}`);
                        if (storyIndex) {
                            context.save();
                            context.fillStyle = "#ffffff";
                            context.textAlign = "center";
                            context.textBaseline = "middle";
                            context.font = `bold ${Math.max(8, Math.min(22, size * 0.34))}px Ubuntu, sans-serif`;
                            context.fillText(String(storyIndex), screenX, screenY);
                            context.restore();
                        }
                    }
                    if (drawDetailedBlocks && code === 22) {
                        context.save();
                        context.translate(screenX, screenY);
                        context.rotate(Math.PI / 4);
                        context.fillStyle = "rgba(5, 35, 40, 0.72)";
                        context.fillRect(-size * 0.24, -size * 0.24, size * 0.48, size * 0.48);
                        context.fillStyle = "#f5e86b";
                        context.fillRect(-size * 0.10, -size * 0.10, size * 0.20, size * 0.20);
                        context.restore();
                    }
                    if (drawDetailedBlocks && code === 29) {
                        context.save();
                        context.translate(screenX, screenY);
                        context.rotate(Math.PI / 4);
                        context.fillStyle = "rgba(12, 18, 65, 0.78)";
                        context.fillRect(-size * 0.27, -size * 0.27, size * 0.54, size * 0.54);
                        context.fillStyle = "#f4df62";
                        context.fillRect(-size * 0.12, -size * 0.12, size * 0.24, size * 0.24);
                        context.fillStyle = "#ffffff";
                        context.fillRect(-size * 0.045, -size * 0.045, size * 0.09, size * 0.09);
                        context.restore();
                    }
                }

                const placedImage = craftrasPlacedBlockImages[code];
                if (drawDetailedBlocks && code !== CRAFTRAS_TORCH_BLOCK_CODE && code !== CRAFTRAS_STEEL_TORCH_BLOCK_CODE && placedImage?.complete && placedImage.naturalWidth) {
                    context.save();
                    context.translate(screenX, screenY);
                    context.rotate(direction * Math.PI / 2);
                    context.imageSmoothingEnabled = false;
                    const crop = craftrasPlacedBlockCrops[code];
                    if (crop) context.drawImage(placedImage, crop.x, crop.y, crop.width, crop.height, -halfSize, -halfSize, size, size);
                    else context.drawImage(placedImage, -halfSize, -halfSize, size, size);
                    context.restore();
                }

                if (drawDetailedBlocks && code === 13) {
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

                if (drawDetailedBlocks && code >= 5 && code <= 8) {
                    const markerRadius = size * 0.42;
                    const world2OreImage = CraftrasWorld.isInsideWorld2?.(blockX, blockY)
                        ? craftrasWorld2OreOverlayImages[code]
                        : null;
                    const oreImage = world2OreImage || craftrasOreOverlayImages[code];
                    if (oreImage?.complete && oreImage.naturalWidth) {
                        context.save();
                        context.imageSmoothingEnabled = false;
                        context.drawImage(oreImage, screenX - halfSize, screenY - halfSize, size, size);
                        context.restore();
                    } else if (code === 5) {
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
                if (drawDetailedBlocks && breakImage?.complete && breakImage.naturalWidth) {
                    context.save();
                    context.imageSmoothingEnabled = false;
                    context.drawImage(breakImage, left, top, size, size);
                    context.restore();
                }
                }
            }
        }

        if (revealTextStoryBlocks && global.craftrasTextStoryMarkers?.size) {
            const { fill, stroke } = getBlockStyle(26);
            for (const [key, storyIndex] of global.craftrasTextStoryMarkers) {
                const [blockX, blockY] = key.split(",").map(Number);
                if (!Number.isInteger(blockX) || !Number.isInteger(blockY)
                    || blockX < minBlockX || blockX > maxBlockX || blockY < minBlockY || blockY > maxBlockY) continue;
                const worldX = blockX * blockSize + blockSize / 2;
                const worldY = blockY * blockSize + blockSize / 2;
                const screenX = ratio * worldX - px + global.screenWidth / 2;
                const screenY = ratio * worldY - py + global.screenHeight / 2;
                const left = Math.round(screenX - halfSize);
                const top = Math.round(screenY - halfSize);
                const cellAlpha = getCraftrasKingdomRainVisibilityAt(worldX, worldY);
                context.save();
                context.globalAlpha = 0.78 * cellAlpha;
                context.fillStyle = fill;
                context.fillRect(left, top, size, size);
                context.strokeStyle = stroke;
                context.lineWidth = Math.max(1, outlineWidth);
                context.strokeRect(left, top, size, size);
                context.globalAlpha = cellAlpha;
                context.fillStyle = "#ffffff";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.font = `bold ${Math.max(8, Math.min(22, size * 0.34))}px Ubuntu, sans-serif`;
                context.fillText(String(storyIndex), screenX, screenY);
                context.restore();
            }
        }

        const worldEdit = global.craftrasWorldEdit;
        if (worldEdit?.active) {
            const minX = Math.min(worldEdit.anchorX, worldEdit.cursorX);
            const maxX = Math.max(worldEdit.anchorX, worldEdit.cursorX);
            const minY = Math.min(worldEdit.anchorY, worldEdit.cursorY);
            const maxY = Math.max(worldEdit.anchorY, worldEdit.cursorY);
            const left = ratio * (minX * blockSize) - px + global.screenWidth / 2;
            const top = ratio * (minY * blockSize) - py + global.screenHeight / 2;
            const width = Math.max(1, (maxX - minX + 1) * blockSize * ratio);
            const height = Math.max(1, (maxY - minY + 1) * blockSize * ratio);
            const filled = worldEdit.mode === "fill";
            context.save();
            context.globalAlpha = filled ? 0.18 : 0.09;
            context.fillStyle = filled ? "#f2b84b" : "#45a8ff";
            context.fillRect(left, top, width, height);
            context.globalAlpha = 0.95;
            context.strokeStyle = filled ? "#ffca62" : "#65bcff";
            context.lineWidth = Math.max(2, outlineWidth * 2);
            context.setLineDash(filled ? [] : [Math.max(5, ratio * 8), Math.max(3, ratio * 5)]);
            context.strokeRect(left, top, width, height);
            const markerSize = Math.max(5, Math.min(size * 0.3, 14));
            context.setLineDash([]);
            context.fillStyle = "#ffffff";
            context.fillRect(
                ratio * (worldEdit.anchorX * blockSize + blockSize / 2) - px + global.screenWidth / 2 - markerSize / 2,
                ratio * (worldEdit.anchorY * blockSize + blockSize / 2) - py + global.screenHeight / 2 - markerSize / 2,
                markerSize,
                markerSize,
            );
            context.restore();
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

    function getCraftrasCloudDescriptor(world, sectorX, sectorY, seed, blockSize) {
        world.cloudDescriptorCache ??= new Map();
        if (world.cloudDescriptorSeed !== seed) {
            world.cloudDescriptorSeed = seed;
            world.cloudDescriptorCache.clear();
        }
        const key = `${sectorX},${sectorY}`;
        if (world.cloudDescriptorCache.has(key)) return world.cloudDescriptorCache.get(key);
        const chance = CraftrasWorld.hash01(sectorX, sectorY, seed + 15400);
        if (chance > 0.42) {
            world.cloudDescriptorCache.set(key, null);
            return null;
        }
        const sectorBlocks = CRAFTRAS_CLOUD_SECTOR_BLOCKS;
        const centerBlockX = sectorX * sectorBlocks + sectorBlocks * (0.25 + CraftrasWorld.hash01(sectorX, sectorY, seed + 15401) * 0.5);
        const centerBlockY = sectorY * sectorBlocks + sectorBlocks * (0.25 + CraftrasWorld.hash01(sectorX, sectorY, seed + 15402) * 0.5);
        if ((CraftrasWorld.getOutsideScore(Math.round(centerBlockX), Math.round(centerBlockY), seed) || 0) < CRAFTRAS_CLOUD_SURFACE_SCORE) {
            world.cloudDescriptorCache.set(key, null);
            return null;
        }
        const cloud = {
            x: centerBlockX * blockSize,
            y: centerBlockY * blockSize,
            width: blockSize * (5.0 + CraftrasWorld.hash01(sectorX, sectorY, seed + 15403) * 3.8),
            height: blockSize * (2.4 + CraftrasWorld.hash01(sectorX, sectorY, seed + 15404) * 1.4),
            imageIndex: Math.floor(CraftrasWorld.hash01(sectorX, sectorY, seed + 15405) * craftrasCloudImages.length) % craftrasCloudImages.length,
        };
        world.cloudDescriptorCache.set(key, cloud);
        if (world.cloudDescriptorCache.size > 4096) world.cloudDescriptorCache.clear();
        return cloud;
    }

    function drawCraftrasCloudShape(context, cloud, screenX, screenY, ratio, alpha, renderWidth = cloud.width, renderHeight = cloud.height) {
        const width = Math.max(1, renderWidth * ratio);
        const height = Math.max(1, renderHeight * ratio);
        const image = craftrasCloudImages[cloud.imageIndex] || craftrasCloudImages[0];
        if (!image?.complete || !image.naturalWidth) return;
        const previousAlpha = context.globalAlpha;
        const previousSmoothing = context.imageSmoothingEnabled;
        context.globalAlpha = alpha;
        context.imageSmoothingEnabled = false;
        context.drawImage(image, screenX - width / 2, screenY - height / 2, width, height);
        context.globalAlpha = previousAlpha;
        context.imageSmoothingEnabled = previousSmoothing;
    }

    function isCraftrasPlayerInWorld2() {
        const world = global.craftrasWorld;
        return !!world?.active
            && !!world.world2Enabled
            && Number.isFinite(global.player.renderx)
            && global.player.renderx >= world.world2MinX;
    }

    function drawCraftrasClouds(px, py, ratio) {
        const world = global.craftrasWorld;
        const api = CraftrasWorld;
        if (!world?.active || !api?.worldToBlock || !api?.generateCell || !api?.getOutsideScore || !api?.hash01) return;
        if (world.world2ChallengeMode) {
            world.cloudLayerAlpha = 0;
            return;
        }
        if (isCraftrasPlayerInWorld2()) {
            world.cloudLayerAlpha = 0;
            return;
        }
        const seed = world.seed || 1337;
        const blockSize = world.blockSize || 82;
        const playerBlock = api.worldToBlock(global.player.renderx, global.player.rendery);
        const playerCell = api.generateCell(playerBlock.x, playerBlock.y, seed);
        const targetLayerAlpha = playerCell?.region === "surface" ? 1 : 0;
        world.cloudLayerAlpha = world.cloudLayerAlpha == null
            ? targetLayerAlpha
            : world.cloudLayerAlpha + (targetLayerAlpha - world.cloudLayerAlpha) * CRAFTRAS_CLOUD_LAYER_FADE_LERP;
        if (world.cloudLayerAlpha <= 0.005) {
            world.cloudLayerAlpha = 0;
            return;
        }

        const halfScreenWorldX = global.screenWidth / ratio / 2;
        const halfScreenWorldY = global.screenHeight / ratio / 2;
        const paddingBlocks = CRAFTRAS_CLOUD_SECTOR_BLOCKS;
        const minBlockX = Math.floor((global.player.renderx - halfScreenWorldX) / blockSize) - paddingBlocks;
        const maxBlockX = Math.floor((global.player.renderx + halfScreenWorldX) / blockSize) + paddingBlocks;
        const minBlockY = Math.floor((global.player.rendery - halfScreenWorldY) / blockSize) - paddingBlocks;
        const maxBlockY = Math.floor((global.player.rendery + halfScreenWorldY) / blockSize) + paddingBlocks;
        const minSectorX = Math.floor(minBlockX / CRAFTRAS_CLOUD_SECTOR_BLOCKS) - 2;
        const maxSectorX = Math.floor(maxBlockX / CRAFTRAS_CLOUD_SECTOR_BLOCKS) + 2;
        const minSectorY = Math.floor(minBlockY / CRAFTRAS_CLOUD_SECTOR_BLOCKS);
        const maxSectorY = Math.floor(maxBlockY / CRAFTRAS_CLOUD_SECTOR_BLOCKS);
        const context = ctx[1];
        const sectorWorldSize = CRAFTRAS_CLOUD_SECTOR_BLOCKS * blockSize;
        const globalDrift = (performance.now() / 1000) * CRAFTRAS_CLOUD_DRIFT_SPEED;
        for (let sectorY = minSectorY; sectorY <= maxSectorY; sectorY++) {
            for (let sectorX = minSectorX; sectorX <= maxSectorX; sectorX++) {
                const cloud = getCraftrasCloudDescriptor(world, sectorX, sectorY, seed, blockSize);
                if (!cloud) continue;
                const phaseOffset = CraftrasWorld.hash01(sectorX, sectorY, seed + 15430) * sectorWorldSize;
                const drift = (globalDrift + phaseOffset) % sectorWorldSize;
                const cloudX = cloud.x + drift;
                const cloudWidth = cloud.width * CRAFTRAS_CLOUD_SIZE_MULTIPLIER;
                const cloudHeight = cloud.height * CRAFTRAS_CLOUD_HEIGHT_MULTIPLIER;
                const screenX = ratio * cloudX - px + global.screenWidth / 2;
                const screenY = ratio * cloud.y - py + global.screenHeight / 2;
                const screenWidth = cloudWidth * ratio;
                const screenHeight = cloudHeight * ratio;
                if (
                    screenX + screenWidth / 2 < -CRAFTRAS_CLOUD_SCREEN_MARGIN ||
                    screenX - screenWidth / 2 > global.screenWidth + CRAFTRAS_CLOUD_SCREEN_MARGIN ||
                    screenY + screenHeight / 2 < -CRAFTRAS_CLOUD_SCREEN_MARGIN ||
                    screenY - screenHeight / 2 > global.screenHeight + CRAFTRAS_CLOUD_SCREEN_MARGIN
                ) continue;
                const spawnFade = smoothstep01(drift / Math.max(1, sectorWorldSize * CRAFTRAS_CLOUD_SPAWN_FADE_RATIO));
                const dx = (global.player.renderx - cloudX) / Math.max(1, cloudWidth * 0.62);
                const dy = (global.player.rendery - cloud.y) / Math.max(1, cloudHeight * 0.72);
                const closeness = smoothstep01(1 - Math.hypot(dx, dy));
                const alpha = (CRAFTRAS_CLOUD_VISIBLE_ALPHA
                    - (CRAFTRAS_CLOUD_VISIBLE_ALPHA - CRAFTRAS_CLOUD_UNDER_ALPHA) * closeness)
                    * world.cloudLayerAlpha
                    * spawnFade;
                if (alpha <= 0.005) continue;
                drawCraftrasCloudShape(context, cloud, screenX, screenY, ratio, alpha, cloudWidth, cloudHeight);
            }
        }
    }

    function isCraftrasPlayerInBrokenKingdom() {
        const world = global.craftrasWorld;
        const api = CraftrasWorld;
        if (world?.active && world.challengeMode) return true;
        if (!world?.active || !api?.worldToBlock || !api?.isBrokenKingdomSurfaceCell) return false;
        const block = api.worldToBlock(global.player.renderx, global.player.rendery);
        return api.isBrokenKingdomSurfaceCell(block.x, block.y);
    }

    function getCraftrasKingdomRainVisibilityAt(worldX, worldY) {
        const world = global.craftrasWorld;
        const storyEightFog = !!world?.challengeMode && !!world.challengeStoryEightReached;
        const storyEightTransition = storyEightFog && !!global.craftrasChallengeStoryEffect?.active;
        const weatherFogAlpha = storyEightFog ? storyEightTransition ? 0 : 0.5 : world?.challengeMode ? world.weatherStormAlpha : world?.weatherStormVisualAlpha;
        const villageWarmth = !storyEightFog && world?.challengeMode ? world.challengeVillageWarmthAlpha || 0 : 0;
        const fogRatio = storyEightFog ? 1 : 1 - villageWarmth * (1 - CRAFTRAS_CHALLENGE_VILLAGE_MIN_FOG_RATIO);
        const stormVisibility = (weatherFogAlpha || 0) * (world?.kingdomFogPresenceAlpha || 0) * fogRatio;
        if (stormVisibility <= 0.005) return 1;
        const blockSize = world.blockSize || 82;
        const distanceBlocks = Math.hypot(worldX - global.player.renderx, worldY - global.player.rendery) / blockSize;
        const distanceFade = smoothstep01(
            (distanceBlocks - CRAFTRAS_KINGDOM_FOG_CLEAR_RADIUS_BLOCKS)
            / Math.max(0.01, CRAFTRAS_KINGDOM_FOG_OUTER_RADIUS_BLOCKS - CRAFTRAS_KINGDOM_FOG_CLEAR_RADIUS_BLOCKS),
        );
        return Math.max(0, 1 - stormVisibility * distanceFade);
    }

    function getCraftrasKingdomEntityVisibility(instance) {
        if (instance.id === gui.playerid) return 1;
        const indexes = String(instance.index || "").split("-");
        const mockup = global.mockups[+indexes[0]] || global.missingno[0];
        if (mockup?.className === "craftrasChallengeMagicPulseSphere") return 1;
        return getCraftrasKingdomRainVisibilityAt(
            instance.render?.x ?? instance.x ?? 0,
            instance.render?.y ?? instance.y ?? 0,
        );
    }

    function getCraftrasKingdomTransitionAlpha() {
        const state = global.craftrasKingdomWeather;
        if (!state?.target) return 1;
        const elapsed = Math.min(state.duration, state.elapsed + (state.paused ? 0 : Date.now() - state.receivedAt));
        const progress = Math.max(0, Math.min(1, elapsed / Math.max(1, state.duration)));
        return progress < 0.5 ? 1 - progress * 2 : (progress - 0.5) * 2;
    }

    function getCraftrasKingdomRestorationFogAlpha() {
        const state = global.craftrasKingdomWeather;
        if (state?.target !== "intact") return 0;
        return smoothstep01(1 - getCraftrasKingdomTransitionAlpha());
    }

    function getCraftrasChallengeVillageWarmth(block) {
        if (!global.craftrasWorld?.challengeMode || !block) return 0;
        const bounds = CRAFTRAS_CHALLENGE_VILLAGE_BOUNDS;
        const dx = block.x < bounds.minX ? bounds.minX - block.x : block.x > bounds.maxX ? block.x - bounds.maxX : 0;
        const dy = block.y < bounds.minY ? bounds.minY - block.y : block.y > bounds.maxY ? block.y - bounds.maxY : 0;
        const distance = Math.hypot(dx, dy);
        return 1 - smoothstep01(distance / CRAFTRAS_CHALLENGE_VILLAGE_FOG_FADE_BLOCKS);
    }

    function updateCraftrasWeatherVisuals() {
        const world = global.craftrasWorld;
        const api = CraftrasWorld;
        if (!world?.active || !api?.worldToBlock || !api?.generateCell) return 0;
        const playerBlock = api.worldToBlock(global.player.renderx, global.player.rendery);
        const playerCell = api.generateCell(playerBlock.x, playerBlock.y, world.seed || 1337);
        const playerInWorld2 = isCraftrasPlayerInWorld2();
        const whiteInfernoTarget = playerInWorld2
            && playerCell?.region === "surface"
            && global.craftrasWeather?.whiteInfernoState === "active" ? 1 : 0;
        world.whiteInfernoAlpha ??= 0;
        world.whiteInfernoAlpha += (whiteInfernoTarget - world.whiteInfernoAlpha) * CRAFTRAS_WHITE_INFERNO_FADE_LERP;
        if (Math.abs(whiteInfernoTarget - world.whiteInfernoAlpha) < 0.001) world.whiteInfernoAlpha = whiteInfernoTarget;

        if (playerInWorld2) {
            world.weatherRainAlpha = 0;
            world.weatherStormAlpha = 0;
            world.weatherSurfaceAlpha = 0;
            world.weatherVisualAlpha = 0;
            world.weatherStormVisualAlpha = 0;
            world.kingdomFogPresenceAlpha = 0;
            return 0;
        }
        const targetRain = global.craftrasWeather?.type === "rain" ? 1 : 0;
        world.weatherRainAlpha ??= 0;
        world.weatherRainAlpha += (targetRain - world.weatherRainAlpha) * CRAFTRAS_WEATHER_FADE_LERP;
        if (Math.abs(targetRain - world.weatherRainAlpha) < 0.001) world.weatherRainAlpha = targetRain;

        const now = performance.now();
        const elapsed = Math.max(0, Math.min(250, now - (world.weatherStormLastUpdate ?? now)));
        world.weatherStormLastUpdate = now;
        world.weatherStormAlpha ??= 0;
        const stormStep = elapsed / CRAFTRAS_STORM_TRANSITION_MS;
        world.weatherStormAlpha = targetRain > world.weatherStormAlpha
            ? Math.min(targetRain, world.weatherStormAlpha + stormStep)
            : Math.max(targetRain, world.weatherStormAlpha - stormStep);

        const targetVillageWarmth = getCraftrasChallengeVillageWarmth(playerBlock);
        world.challengeVillageWarmthAlpha ??= 0;
        const warmthStep = elapsed / CRAFTRAS_CHALLENGE_VILLAGE_WARMTH_DURATION_MS;
        world.challengeVillageWarmthAlpha = targetVillageWarmth > world.challengeVillageWarmthAlpha
            ? Math.min(targetVillageWarmth, world.challengeVillageWarmthAlpha + warmthStep)
            : Math.max(targetVillageWarmth, world.challengeVillageWarmthAlpha - warmthStep);

        const targetKingdomFogPresence = isCraftrasPlayerInBrokenKingdom() ? 1 : 0;
        world.kingdomFogPresenceAlpha ??= 0;
        const kingdomFogDuration = targetKingdomFogPresence > world.kingdomFogPresenceAlpha
            ? CRAFTRAS_KINGDOM_FOG_ENTER_DURATION_MS
            : CRAFTRAS_KINGDOM_FOG_EXIT_DURATION_MS;
        const kingdomFogStep = elapsed / kingdomFogDuration;
        world.kingdomFogPresenceAlpha = targetKingdomFogPresence > world.kingdomFogPresenceAlpha
            ? Math.min(targetKingdomFogPresence, world.kingdomFogPresenceAlpha + kingdomFogStep)
            : Math.max(targetKingdomFogPresence, world.kingdomFogPresenceAlpha - kingdomFogStep);

        const targetSurface = playerCell?.region === "surface" ? 1 : 0;
        world.weatherSurfaceAlpha ??= targetSurface;
        world.weatherSurfaceAlpha += (targetSurface - world.weatherSurfaceAlpha) * CRAFTRAS_WEATHER_SURFACE_FADE_LERP;
        if (Math.abs(targetSurface - world.weatherSurfaceAlpha) < 0.001) world.weatherSurfaceAlpha = targetSurface;
        world.weatherVisualAlpha = world.weatherRainAlpha * world.weatherSurfaceAlpha;
        world.weatherStormVisualAlpha = world.weatherStormAlpha * world.weatherSurfaceAlpha;
        return world.weatherVisualAlpha;
    }

    function drawCraftrasWhiteInferno(px, py, ratio) {
        const world = global.craftrasWorld;
        const entrance = global.craftrasBominikInferno;
        let entranceAlpha = 0;
        if (entrance?.active) {
            const elapsed = Math.max(0, Date.now() - entrance.startedAt);
            const fadeElapsed = elapsed - entrance.holdDuration;
            entranceAlpha = fadeElapsed <= 0
                ? 1
                : Math.max(0, 1 - fadeElapsed / Math.max(100, entrance.fadeDuration));
            if (entranceAlpha <= 0) entrance.active = false;
        }
        const alpha = Math.max(world?.whiteInfernoAlpha || 0, entranceAlpha);
        if (alpha <= 0.005 || !world?.chunks?.size) return;

        const context = ctx[1];
        context.save();
        context.fillStyle = `rgba(255, 255, 255, ${(alpha * CRAFTRAS_WHITE_INFERNO_SCREEN_ALPHA).toFixed(3)})`;
        context.fillRect(0, 0, global.screenWidth, global.screenHeight);

        const blockSize = world.blockSize;
        const wallSize = world.wallSize;
        const chunkSize = world.chunkSize;
        const halfScreenWorldX = global.screenWidth / ratio / 2;
        const halfScreenWorldY = global.screenHeight / ratio / 2;
        const minBlockX = Math.floor((global.player.renderx - halfScreenWorldX) / blockSize) - 1;
        const maxBlockX = Math.floor((global.player.renderx + halfScreenWorldX) / blockSize) + 1;
        const minBlockY = Math.floor((global.player.rendery - halfScreenWorldY) / blockSize) - 1;
        const maxBlockY = Math.floor((global.player.rendery + halfScreenWorldY) / blockSize) + 1;
        const minChunkX = Math.floor(minBlockX / chunkSize);
        const maxChunkX = Math.floor(maxBlockX / chunkSize);
        const minChunkY = Math.floor(minBlockY / chunkSize);
        const maxChunkY = Math.floor(maxBlockY / chunkSize);
        const size = Math.max(1, wallSize * ratio);
        const halfSize = size / 2;

        context.fillStyle = `rgba(0, 0, 0, ${(alpha * CRAFTRAS_WHITE_INFERNO_BLOCK_ALPHA).toFixed(3)})`;
        for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
            for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
                const entries = world.chunkEntries?.get(`${chunkX},${chunkY}`);
                if (!entries?.length) continue;
                const chunkBlockX = chunkX * chunkSize;
                const chunkBlockY = chunkY * chunkSize;
                for (const entry of entries) {
                    const blockX = chunkBlockX + entry.localX;
                    const blockY = chunkBlockY + entry.localY;
                    if (blockX < minBlockX || blockX > maxBlockX || blockY < minBlockY || blockY > maxBlockY) continue;
                    const code = entry.code & 31;
                    if (!code || code === 23 || code === 24 || code === 25 || code === 26) continue;
                    const worldX = blockX * blockSize + blockSize / 2;
                    const worldY = blockY * blockSize + blockSize / 2;
                    const screenX = ratio * worldX - px + global.screenWidth / 2;
                    const screenY = ratio * worldY - py + global.screenHeight / 2;
                    context.fillRect(
                        Math.round(screenX - halfSize),
                        Math.round(screenY - halfSize),
                        Math.ceil(size),
                        Math.ceil(size),
                    );
                }
            }
        }
        context.restore();
    }

    function drawCraftrasJaneScreenCutEffect() {
        const effect = global.craftrasJaneScreenCut;
        if (!effect?.active) return;
        const elapsed = Math.max(0, Date.now() - effect.startedAt);
        const duration = Math.max(300, effect.duration || 3_000);
        if (elapsed >= duration) {
            effect.active = false;
            return;
        }
        const context = ctx[1];
        const canvas = context.canvas;
        const width = canvas.width || global.screenWidth;
        const height = canvas.height || global.screenHeight;
        const centerY = height / 2;
        const instant = !!effect.instant;
        const warningDuration = instant ? 0 : Math.max(100, effect.warningDuration || 200);
        const parryWindow = instant ? 0 : Math.max(100, effect.parryWindow || 200);
        const impactAt = warningDuration;
        const clamp01 = value => Math.max(0, Math.min(1, value));
        const smooth = value => {
            const t = clamp01(value);
            return t * t * (3 - 2 * t);
        };

        if (elapsed >= impactAt && craftrasJaneScreenSliceContext) {
            if (craftrasJaneScreenSliceCanvas.width !== width || craftrasJaneScreenSliceCanvas.height !== height) {
                craftrasJaneScreenSliceCanvas.width = width;
                craftrasJaneScreenSliceCanvas.height = height;
            }
            craftrasJaneScreenSliceContext.clearRect(0, 0, width, height);
            craftrasJaneScreenSliceContext.drawImage(canvas, 0, 0, width, height);
            const cutElapsed = elapsed - impactAt;
            const cutDuration = Math.max(1, duration - impactAt);
            const splitInDuration = instant ? 70 : 100;
            const splitHoldDuration = instant ? 250 : 1_000;
            const splitReturnDuration = Math.max(1, cutDuration - splitInDuration - splitHoldDuration);
            const intensity = cutElapsed < splitInDuration
                ? smooth(cutElapsed / splitInDuration)
                : cutElapsed < splitInDuration + splitHoldDuration
                    ? 1
                    : 1 - smooth((cutElapsed - splitInDuration - splitHoldDuration) / splitReturnDuration);
            const shift = Math.max(20, effect.maxShift || 72) * intensity;
            const cutAngle = Number(effect.cutAngle) || 0;
            const directionX = Math.cos(cutAngle);
            const directionY = Math.sin(cutAngle);
            const diagonal = Math.hypot(width, height);
            context.clearRect(0, 0, width, height);
            context.fillStyle = effect.colorMode === "white" ? "#ffffff" : "#ff2fb7";
            context.fillRect(0, 0, width, height);
            const drawHalf = (upper, direction) => {
                context.save();
                context.translate(width / 2, centerY);
                context.rotate(cutAngle);
                context.beginPath();
                context.rect(-diagonal, upper ? -diagonal : 0, diagonal * 2, diagonal);
                context.clip();
                context.rotate(-cutAngle);
                context.translate(-width / 2, -centerY);
                context.drawImage(
                    craftrasJaneScreenSliceCanvas,
                    directionX * shift * direction,
                    directionY * shift * direction,
                    width,
                    height,
                );
                context.restore();
            };
            drawHalf(true, -1);
            drawHalf(false, 1);
        }

        const warningProgress = instant ? 1 : smooth(elapsed / warningDuration);
        const cutProgress = elapsed < impactAt ? 0 : smooth((elapsed - impactAt) / 90);
        const pulse = 0.5 + Math.sin(elapsed / 24) * 0.5;
        const infernoAlpha = instant
            ? 0.08 + 0.68 * (1 - smooth(elapsed / duration))
            : elapsed < impactAt
                ? 0.24 + warningProgress * 0.48 + pulse * 0.08
                : Math.max(0.08, 0.34 * (1 - smooth((elapsed - impactAt) / Math.max(1, duration - impactAt))));
        const gradient = context.createRadialGradient(width / 2, centerY, 0, width / 2, centerY, Math.hypot(width, height) * 0.62);
        if (effect.colorMode === "white") {
            gradient.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.96, infernoAlpha + 0.16).toFixed(3)})`);
            gradient.addColorStop(0.55, `rgba(245, 248, 255, ${infernoAlpha.toFixed(3)})`);
            gradient.addColorStop(1, `rgba(178, 188, 205, ${Math.min(0.84, infernoAlpha + 0.10).toFixed(3)})`);
        } else {
            gradient.addColorStop(0, `rgba(255, 72, 196, ${Math.min(0.92, infernoAlpha + 0.12).toFixed(3)})`);
            gradient.addColorStop(0.55, `rgba(255, 20, 167, ${infernoAlpha.toFixed(3)})`);
            gradient.addColorStop(1, `rgba(95, 0, 59, ${Math.min(0.88, infernoAlpha + 0.16).toFixed(3)})`);
        }
        context.save();
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
        const lineThickness = (4 + warningProgress * 7 + cutProgress * 8)
            * (effect.colorMode === "white" ? 0.5 : 1);
        context.fillStyle = `rgba(0, 0, 0, ${Math.min(1, 0.35 + warningProgress * 0.65).toFixed(3)})`;
        context.save();
        context.translate(width / 2, centerY);
        context.rotate(Number(effect.cutAngle) || 0);
        context.fillRect(-Math.hypot(width, height), -lineThickness / 2, Math.hypot(width, height) * 2, lineThickness);
        context.restore();
        const prompt = instant
            ? ""
            : elapsed < warningDuration
                ? "!!!!"
                : elapsed < warningDuration + parryWindow
                    ? "NOW!"
                    : "";
        if (prompt) {
            const fontSize = Math.max(64, Math.min(width, height) * 0.17);
            context.font = `900 ${fontSize}px sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.lineJoin = "round";
            context.lineWidth = Math.max(6, fontSize * 0.075);
            context.strokeStyle = "rgba(34, 0, 23, 0.96)";
            context.fillStyle = prompt === "NOW!" ? "#ffffff" : "#ffb7e7";
            context.strokeText(prompt, width / 2, centerY);
            context.fillText(prompt, width / 2, centerY);
        }
        context.restore();
    }

    function drawCraftrasJanePhaseTwoSkillTwoScreenEffect() {
        const effect = global.craftrasJanePhaseTwoSkillTwoScreen;
        if (!effect?.active || !craftrasJaneScreenSliceContext) return;
        const elapsed = Math.max(0, Date.now() - effect.startedAt);
        const duration = Math.max(1_000, effect.duration || 18_000);
        if (elapsed >= duration) {
            effect.active = false;
            return;
        }
        const context = ctx[1];
        const canvas = context.canvas;
        const width = canvas.width || global.screenWidth;
        const height = canvas.height || global.screenHeight;
        const centerY = height / 2;
        const clamp01 = value => Math.max(0, Math.min(1, value));
        const smooth = value => {
            const t = clamp01(value);
            return t * t * (3 - 2 * t);
        };
        const enter = smooth(elapsed / 180);
        const leave = 1 - smooth((elapsed - Math.max(180, duration - 900)) / 900);
        const pulse = 0.93 + Math.sin(elapsed / 210) * 0.07;
        const shift = Math.max(16, effect.maxShift || 54) * enter * leave * pulse;
        if (shift <= 0.01) return;
        if (craftrasJaneScreenSliceCanvas.width !== width || craftrasJaneScreenSliceCanvas.height !== height) {
            craftrasJaneScreenSliceCanvas.width = width;
            craftrasJaneScreenSliceCanvas.height = height;
        }
        craftrasJaneScreenSliceContext.clearRect(0, 0, width, height);
        craftrasJaneScreenSliceContext.drawImage(canvas, 0, 0, width, height);
        context.save();
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#210017";
        context.fillRect(0, 0, width, height);
        context.drawImage(craftrasJaneScreenSliceCanvas, 0, 0, width, centerY, -shift, 0, width, centerY);
        context.drawImage(craftrasJaneScreenSliceCanvas, 0, centerY, width, height - centerY, shift, centerY, width, height - centerY);
        const lineWidth = Math.max(5, Math.min(14, 6 + shift * 0.09));
        context.shadowColor = "#ff48bd";
        context.shadowBlur = 22;
        context.fillStyle = "rgba(0, 0, 0, 0.96)";
        context.fillRect(0, centerY - lineWidth / 2, width, lineWidth);
        context.restore();
    }

    function drawCraftrasStormClouds(ratio) {
        const world = global.craftrasWorld;
        const api = CraftrasWorld;
        const visibility = world?.weatherStormVisualAlpha || 0;
        if (visibility <= 0.005 || !api?.hash01) return;
        const context = ctx[1];
        const seed = world.seed || 1337;
        const blockSize = world.blockSize || 82;
        const elapsed = performance.now() / 1000;
        const margin = Math.max(240, global.screenWidth * 0.72);
        const horizontalSpan = global.screenWidth + margin * 2;
        const previousAlpha = context.globalAlpha;
        const previousSmoothing = context.imageSmoothingEnabled;
        const previousFilter = context.filter;
        context.imageSmoothingEnabled = false;
        context.filter = "grayscale(1) brightness(0.58)";
        for (let index = 0; index < CRAFTRAS_STORM_CLOUD_COUNT; index++) {
            const imageIndex = Math.floor(api.hash01(index, 71, seed + 16501) * craftrasCloudImages.length) % craftrasCloudImages.length;
            const image = craftrasCloudImages[imageIndex] || craftrasCloudImages[0];
            if (!image?.complete || !image.naturalWidth) continue;
            const baseWorldWidth = blockSize * (5 + api.hash01(index, 72, seed + 16502) * 3.8) * CRAFTRAS_CLOUD_SIZE_MULTIPLIER;
            const width = Math.max(global.screenWidth * 0.82, Math.min(global.screenWidth * 2.15, baseWorldWidth * CRAFTRAS_STORM_CLOUD_SCALE * ratio));
            const aspect = 0.32 + api.hash01(index, 73, seed + 16503) * 0.12;
            const height = width * aspect;
            const drift = elapsed * CRAFTRAS_CLOUD_DRIFT_SPEED * ratio * (1.5 + api.hash01(index, 74, seed + 16504));
            const startX = api.hash01(index, 75, seed + 16505) * horizontalSpan;
            const screenX = ((startX + drift - global.player.renderx * ratio * 0.035) % horizontalSpan + horizontalSpan) % horizontalSpan - margin;
            const screenY = api.hash01(index, 76, seed + 16506) * (global.screenHeight + height * 0.5) - height * 0.22;
            context.globalAlpha = visibility * (0.12 + api.hash01(index, 77, seed + 16507) * 0.07);
            context.drawImage(image, screenX - width / 2, screenY - height / 2, width, height);
        }
        context.globalAlpha = previousAlpha;
        context.imageSmoothingEnabled = previousSmoothing;
        context.filter = previousFilter;
    }

    function drawCraftrasWeatherDarkness() {
        const visibility = global.craftrasWorld?.weatherStormVisualAlpha || 0;
        if (visibility <= 0.005) return;
        const kingdomPresence = global.craftrasWorld?.kingdomFogPresenceAlpha || 0;
        const villageWarmth = global.craftrasWorld?.challengeMode ? global.craftrasWorld.challengeVillageWarmthAlpha || 0 : 0;
        const darknessMultiplier = 1 + (CRAFTRAS_KINGDOM_STORM_DARKNESS_MULTIPLIER - 1) * kingdomPresence;
        ctx[1].save();
        ctx[1].fillStyle = `rgba(63, 70, 76, ${Math.min(0.95, visibility * CRAFTRAS_WEATHER_DARKNESS_ALPHA * darknessMultiplier * (1 - villageWarmth * 0.8)).toFixed(3)})`;
        ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
        ctx[1].restore();
    }

    function drawCraftrasKingdomFog(ratio) {
        const world = global.craftrasWorld;
        const kingdomPresence = world?.kingdomFogPresenceAlpha || 0;
        const storyEightFog = !!world?.challengeMode && !!world.challengeStoryEightReached;
        const storyEightTransition = storyEightFog && !!global.craftrasChallengeStoryEffect?.active;
        const weatherFogAlpha = storyEightFog ? storyEightTransition ? 0 : 0.5 : world?.challengeMode ? world.weatherStormAlpha : world?.weatherStormVisualAlpha;
        const villageWarmth = storyEightFog ? 1 : world?.challengeMode ? world.challengeVillageWarmthAlpha || 0 : 0;
        const fogRatio = storyEightFog ? 1 : 1 - villageWarmth * (1 - CRAFTRAS_CHALLENGE_VILLAGE_MIN_FOG_RATIO);
        const visibility = (weatherFogAlpha || 0) * kingdomPresence * fogRatio;
        const restorationFog = getCraftrasKingdomRestorationFogAlpha() * kingdomPresence;
        if (visibility <= 0.005 && restorationFog <= 0.005) return;
        const blockSize = world.blockSize || 82;
        const centerX = global.screenWidth / 2;
        const centerY = global.screenHeight / 2;
        const clearRadius = Math.max(90, Math.min(Math.min(global.screenWidth, global.screenHeight) * 0.3, blockSize * ratio * CRAFTRAS_KINGDOM_FOG_CLEAR_RADIUS_BLOCKS));
        const outerRadius = Math.max(clearRadius + 80, blockSize * ratio * CRAFTRAS_KINGDOM_FOG_OUTER_RADIUS_BLOCKS);
        const fogRed = Math.round(45 + (255 - 45) * villageWarmth);
        const fogGreen = Math.round(50 + (226 - 50) * villageWarmth);
        const fogBlue = Math.round(54 + (118 - 54) * villageWarmth);
        const fogColor = `${fogRed}, ${fogGreen}, ${fogBlue}`;
        const fog = ctx[1].createRadialGradient(centerX, centerY, clearRadius, centerX, centerY, outerRadius);
        fog.addColorStop(0, `rgba(${fogColor}, ${(villageWarmth * 0.035).toFixed(3)})`);
        fog.addColorStop(0.22, `rgba(${fogColor}, ${(visibility * 0.18).toFixed(3)})`);
        fog.addColorStop(1, `rgba(${fogColor}, ${(visibility * CRAFTRAS_KINGDOM_FOG_ALPHA).toFixed(3)})`);
        ctx[1].save();
        ctx[1].fillStyle = fog;
        ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
        ctx[1].restore();
        if (villageWarmth > 0.005 && !storyEightFog) {
            ctx[1].save();
            ctx[1].fillStyle = `rgba(255, 229, 137, ${(villageWarmth * 0.07).toFixed(3)})`;
            ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
            ctx[1].restore();
        }
        if (restorationFog > 0.005) {
            ctx[1].save();
            ctx[1].fillStyle = `rgba(45, 50, 54, ${(restorationFog * CRAFTRAS_KINGDOM_RESTORATION_FOG_ALPHA).toFixed(3)})`;
            ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
            ctx[1].restore();
        }
    }

    function drawCraftrasRain() {
        const world = global.craftrasWorld;
        const api = CraftrasWorld;
        const visibility = world?.weatherVisualAlpha || 0;
        if (visibility <= 0.005 || !api?.hash01) return;
        const context = ctx[1];
        const seed = world.seed || 1337;
        const elapsed = performance.now() / 1000;
        const count = Math.max(CRAFTRAS_RAIN_MIN_STREAKS, Math.min(CRAFTRAS_RAIN_MAX_STREAKS, Math.round(global.screenWidth * global.screenHeight / 8_500)));
        const fallSpan = global.screenHeight + 180;
        const horizontalSpan = global.screenWidth + 320;
        context.save();
        context.lineCap = "round";
        for (let layer = 0; layer < 2; layer++) {
            context.beginPath();
            for (let index = layer; index < count; index += 2) {
                const speed = 780 + api.hash01(index, 81, seed + 16601) * 720 + layer * 160;
                const startY = api.hash01(index, 82, seed + 16602) * fallSpan;
                const y = (startY + elapsed * speed) % fallSpan - 90;
                const startX = api.hash01(index, 83, seed + 16603) * horizontalSpan;
                const x = (startX + elapsed * speed * 0.12) % horizontalSpan - 160;
                const length = 13 + api.hash01(index, 84, seed + 16604) * 19 + layer * 5;
                context.moveTo(x, y);
                context.lineTo(x - length * 0.24, y + length);
            }
            context.lineWidth = layer ? 1.45 : 0.9;
            context.strokeStyle = `rgba(201, 220, 232, ${(visibility * (layer ? 0.48 : 0.3)).toFixed(3)})`;
            context.stroke();
        }
        context.restore();
    }

    function drawEntities(px, py, ratio, tick) {
        if (global.advanced.blackout.active) {
            document.getElementById("gameCanvas-background").style.display = "none";
            ctx[1].drawImage(ctx[0].canvas, 0, 0, global.screenWidth, global.screenHeight);
            if (global.glCanvas) ctx[1].drawImage(global.glCanvas, 0, 0, global.screenWidth, global.screenHeight);
        } else if (document.getElementById("gameCanvas-background").style.display === "none") document.getElementById("gameCanvas-background").style.display = "block";
        const craftrasVisibilityCache = new Map();
        const getFrameVisibility = instance => {
            let visibility = craftrasVisibilityCache.get(instance.id);
            if (visibility) return visibility;
            visibility = {
                cave: getCraftrasCaveMobVisibility(instance),
                kingdom: getCraftrasKingdomEntityVisibility(instance),
                infoAlpha: null,
            };
            craftrasVisibilityCache.set(instance.id, visibility);
            return visibility;
        };
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
            const visibility = getFrameVisibility(instance);
            const caveMobVisibility = visibility.cave;
            if (caveMobVisibility <= 0.01) continue;
            alpha *= caveMobVisibility;
            const kingdomRainVisibility = visibility.kingdom;
            if (kingdomRainVisibility <= 0.01) continue;
            alpha *= kingdomRainVisibility;
            const isKingdomGhostBuilder = String(instance.name || "").substring(7) === "Ghost Builder";
            drawEntity(baseColor, x, y, instance, ratio, isKingdomGhostBuilder ? alpha : instance.alpha * alpha, 1, 1, instance.render.f, false, false, false, instance.render, isize);
        }
        if (!global.screenshotGuiHidden) {
            for (let instance of global.entities) {
                const visibility = getFrameVisibility(instance);
                const caveMobVisibility = visibility.cave;
                if (caveMobVisibility <= 0.01) continue;
                const kingdomRainVisibility = visibility.kingdom;
                if (kingdomRainVisibility <= 0.01) continue;
                if (visibility.infoAlpha == null) {
                    visibility.infoAlpha = handleScreenDistance(instance.alpha, instance) * caveMobVisibility * kingdomRainVisibility;
                }
                const alpha = visibility.infoAlpha;
                let x = instance.id === gui.playerid ? global.player.screenx : ratio * instance.render.x - px,
                    y = instance.id === gui.playerid ? global.player.screeny : ratio * instance.render.y - py;
                drawHealth(x, y, instance, ratio, gui.visibleEntities ? kingdomRainVisibility : alpha, instance.size);
                drawName(x, y, instance, ratio, gui.visibleEntities ? Math.min(alpha * 0.75 + 0.25, kingdomRainVisibility) : alpha, instance.size);
            }
            for (let instance of global.entities) {
                const visibility = getFrameVisibility(instance);
                const caveMobVisibility = visibility.cave;
                if (caveMobVisibility <= 0.01) continue;
                const kingdomRainVisibility = visibility.kingdom;
                if (kingdomRainVisibility <= 0.01) continue;
                if (visibility.infoAlpha == null) {
                    visibility.infoAlpha = handleScreenDistance(instance.alpha, instance) * caveMobVisibility * kingdomRainVisibility;
                }
                const alpha = visibility.infoAlpha;
                let x = instance.id === gui.playerid ? global.player.screenx : ratio * instance.render.x - px,
                    y = instance.id === gui.playerid ? global.player.screeny : ratio * instance.render.y - py;
                drawChatMessages(x, false, py, instance, ratio, gui.visibleEntities ? kingdomRainVisibility : alpha, instance.size, px, py);
                drawChatInput(x, y, instance, ratio, instance.size);
            }
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
            "X",
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
        let renderedMessageCount = 0;
        let skipButtonPlaced = false;
        let skipButtonLayout = null;
        global.craftrasDialogueSkipToken = null;
        global.clickables.dialogueSkip.hide();
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
        for (const [token, lastSeenAt] of global.craftrasFastDialogueTokens) {
            if (Bd - lastSeenAt > 1_500) global.craftrasFastDialogueTokens.delete(token);
        }
        for (let i = global.messages.length - 1; i >= 0; i--) {
            let msg = global.messages[i],
                txt = msg.text,
                time = Bd - msg.time,
                duration = msg.duration - time,
                text = txt,
                messageScale = Math.max(0.5, Math.min(3, Number(msg.scale) || 1)),
                messageHeight = height * messageScale,
                messageColor = msg.color || color.guiwhite;

            if (0 >= duration) {
                 global.messages.splice(i, 1);
                 continue;
            }
            renderedMessageCount++;

            let K = Math.max(0, Math.min(1, time / 300, duration / 300));
            if (msg.textJSON) { // If a message is like a big ass box then draw this instead.
                let len = 0;
                // Give it a textobj if it doesn't have one
                msg.textJSON.forEach((txt) => {
                    if (len < measureText(txt, messageHeight - 4.25, false)) len = measureText(txt, messageHeight - 4.25, false)
                })
                ctx[2].globalAlpha = 0.5 * K;
                // Draw the background
                drawBarAdvanced(x - len / 2, x + len / 2, y + yy / 2, messageHeight, color.black, 17.5 * messageScale * (msg.textJSON.length) - 17.5 * messageScale + 1);
                ctx[2].globalAlpha = K;
                // Draw the text
                msg.textobjs = [];
                msg.textJSON.forEach((txt) => {
                    msg.textobjs[msg.textobjs.length] = function () { }; // For some reason this fixes the text's location i guess.
                    drawText(txt, x - len / 2 + 2, y + 16 * messageScale + 17.5 * messageScale * (msg.textobjs.length - 1), messageHeight - 4.3, messageColor, "left", false, 1, 5.5);
                })
                y += 23 * messageScale * K + 17.5 * messageScale * (3 - 2 * K) * (msg.textJSON.length - 1) * K * K;
            } else {
                // Give it a textobj if it doesn't have one
                if (msg.len == null || msg.lenScale !== messageScale) {
                    msg.len = measureText(text, messageHeight - 4.3);
                    msg.lenScale = messageScale;
                }
                // Draw the background
                ctx[2].globalAlpha = 0.5 * K;
                drawBar(x - msg.len / 2, x + msg.len / 2, y + yy / 2, messageHeight + 2 * messageScale, color.black);
                // Draw the text
                ctx[2].globalAlpha = K;
                drawText(text, x, y + yy / 1.3 + (messageHeight - height) * 0.38, messageHeight - 4.3, messageColor, "center", false, 1, 5.5);
                if (msg.skipToken && global.craftrasFastDialogueTokens.has(msg.skipToken)) {
                    global.craftrasFastDialogueTokens.set(msg.skipToken, Bd);
                }
                if (
                    !skipButtonPlaced
                    && msg.skipToken
                    && !global.craftrasFastDialogueTokens.has(msg.skipToken)
                    && K > 0.2
                ) {
                    const buttonWidth = 68;
                    const buttonHeight = 28;
                    const buttonX = Math.min(
                        global.screenWidth - buttonWidth / 2 - 8,
                        x + msg.len / 2 + buttonWidth / 2 + 12,
                    );
                    const buttonY = Math.max(6, y + yy / 2 - buttonHeight / 2);
                    skipButtonLayout = {
                        x: buttonX,
                        y: buttonY,
                        width: buttonWidth,
                        height: buttonHeight,
                        alpha: K,
                    };
                    global.craftrasDialogueSkipToken = msg.skipToken;
                    skipButtonPlaced = true;
                }
                y += 23 * messageScale * (3 - 2 * K) * K * K;
            }
        }
        if (skipButtonLayout) {
            const {
                x: buttonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight,
                alpha: buttonAlpha,
            } = skipButtonLayout;
            const clickableRatio = global.canvas.height / global.screenHeight / global.ratio;
            global.clickables.dialogueSkip.place(
                0,
                (buttonX - buttonWidth / 2) * clickableRatio,
                buttonY * clickableRatio,
                buttonWidth * clickableRatio,
                buttonHeight * clickableRatio,
            );
            ctx[2].save();
            ctx[2].globalAlpha = Math.max(0.35, buttonAlpha);
            ctx[2].fillStyle = "#3f8cff";
            drawGuiRect(buttonX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight);
            ctx[2].fillStyle = "#2459a6";
            drawGuiRect(buttonX - buttonWidth / 2, buttonY + buttonHeight * 0.7, buttonWidth, buttonHeight * 0.3);
            ctx[2].strokeStyle = "#183b70";
            ctx[2].lineWidth = 2;
            drawGuiRect(buttonX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight, true);
            drawText("Skip", buttonX, buttonY + buttonHeight * 0.5, 14, color.guiwhite, "center", true);
            ctx[2].restore();
        }
        global.craftrasMessageBottom = renderedMessageCount ? y : 0;
        ctx[2].globalAlpha = 1;
    }

    function drawChatMessages(x, y, py, instance, ratio, alpha, isize) {
        if (!(instance.id === gui.playerid) && instance.alpha < 0.25) return;
        const messages = global.chats[instance.id];
        if (!messages) return;
        ctx[1].save();
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
            
            const parryStatus = text === "PARRY SUCCESS" || text === "PARRY BROKEN";
            if (!parryStatus) {
                ctx[1].globalAlpha = 0.5 * valpha * alpha * alpha * fade;
                drawBar(x - msgLengthHalf, x + msgLengthHalf, y - g * (instance.id === gui.playerid ? 2.26 : barScale) - slideOffset, 0.75 * g, gameDraw.getColorDark(gameDraw.getColor(instance.color.split(" ")[0])), ctx[1]);
            }
            ctx[1].globalAlpha = valpha * alpha * fade;
            config.graphical.fontStrokeRatio *= 1.2;
            drawText(text, x, y - g * (instance.id === gui.playerid ? 2.05 : textScale) - slideOffset, parryStatus ? 0.38 * g : 0.50 * g, text === "PARRY BROKEN" ? "#ff3a4c" : text === "PARRY SUCCESS" ? "#45a8ff" : color.guiwhite, "center", false, 1, true, ctx[1]);
            config.graphical.fontStrokeRatio /= 1.2;
        }
        ctx[1].restore();
    }
    

    function drawHealth(x, y, instance, ratio, alpha, isize) {
        if (!(0.02 > alpha)) {
            ctx[1].save();
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
                const forceHealthbar = displayName.endsWith("Zombie") || displayName.endsWith("Skeleton") || [
                    "Skeleton", "Bomber", "Annihilator", "The Nuclear", "Spider", "Cave Spider",
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
            ctx[1].restore();
        }
    }

    function drawName(x, y, instance, ratio, alpha, isize) {
        if (!(0.02 > alpha)) {
            ctx[1].save();
            let fade = instance.render.status.getFade();
            fade *= fade;

            let size = isize * ratio;
            x += global.screenWidth / 2;
            y += global.screenHeight / 2;
            const g = Math.max(20, size);
            const hostLabel = global.craftrasTeamHostLabels?.get?.(instance.id);
            if (hostLabel) {
                ctx[1].globalAlpha = alpha * alpha * fade;
                drawText(hostLabel, x, y - g * (global.GUIStatus.renderPlayerScores ? 2.42 : 1.98), 0.34 * g, "#ffd84a", "center", false, 1, true, ctx[1]);
            }

            if (instance.id !== gui.playerid && instance.nameplate) {
                var name = instance.name.substring(7, instance.name.length + 1);
                var namecolor = instance.name.substring(0, 7);
                if (name.startsWith("[FIRE] ")) name = name.slice(7);
                const isCraftrasItem = name.startsWith("[ITEM] ");
                const isCraftrasMob = name.endsWith("Zombie") || name.endsWith("Skeleton") || [
                    "Skeleton", "Bomber", "Annihilator", "The Nuclear", "Spider", "Cave Spider",
                ].includes(name);
                if (isCraftrasItem) name = name.slice(7);
                ctx[1].globalAlpha = alpha * alpha * fade;
                if (global.GUIStatus.renderPlayerNames || isCraftrasItem || isCraftrasMob) drawText(name, x, y - g * (global.GUIStatus.renderPlayerScores ? 1.9 : 1.45), 0.55 * g, namecolor == "#ffffff" ? color.guiwhite : namecolor, "center", false, 1, true, ctx[1]);
                if (global.GUIStatus.renderPlayerScores || typeof instance.score === "string") drawText(typeof instance.score === "string" ? instance.score : util.handleLargeNumber(instance.score, 1), x, y - 1.45 * g, 0.3 * g, namecolor == "#ffffff" ? color.guiwhite : namecolor, "center", false, 1, true, ctx[1]);
            }
            ctx[1].restore();
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
        const playerDisplayName = (global.player.name || "").substring(7).trim() || "Player";
        const levelText = "Level " + gui.__s.getLevel() + " " + playerDisplayName;
        drawText(levelText, x + width / 2 + 1, y + height / 2 + 9, 21, color.guiwhite, "center", false, 6);
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
        const craftrasMap = global.craftrasWorld?.active && global.craftrasWorld?.world2Enabled;
        const mapWorldWidth = craftrasMap ? global.craftrasWorld.regionSize || global.craftrasWorld.worldSize : global.gameWidth;
        const mapWorldHeight = craftrasMap ? mapWorldWidth : global.gameHeight;
        let height = (len / mapWorldWidth) * mapWorldHeight;
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
            const displayRegion = craftrasMap ? global.craftrasWorld.displayRegion || 1 : 1;
            const mapCenterWorldX = craftrasMap && displayRegion === 2 ? global.craftrasWorld.world2CenterX : 0;
            const mapLeftWorldX = mapCenterWorldX - mapWorldWidth / 2;
            const mapTopWorldY = -mapWorldHeight / 2;
            const mapXForWorld = worldX => config.game.centeredMinimap
                ? centerX + (worldX - global.player.cx.animX) / mapWorldWidth * len
                : x + (worldX - mapLeftWorldX) / mapWorldWidth * len;
            const mapYForWorld = worldY => config.game.centeredMinimap
                ? centerY + (worldY - global.player.cy.animY) / mapWorldHeight * height
                : y + (worldY - mapTopWorldY) / mapWorldHeight * height;
            const isInsideDisplayedRegion = worldX => !craftrasMap
                || Math.abs(worldX - mapCenterWorldX) <= mapWorldWidth / 2;
        
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
                        let minimapX = mapXForWorld(cellWorldX);
                        let minimapY = mapYForWorld(cellWorldY);
                        let cellWidth = global.gameWidth / W / mapWorldWidth * len;
                        let cellHeight = global.gameHeight / H / mapWorldHeight * height;
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
            if (global.craftrasWorld?.active && global.craftrasRouteMarkers?.length) {
                const blockSize = global.craftrasWorld.blockSize || 82;
                const markerSize = global.mobile ? 3 : 2.2;
                ctx[2].globalAlpha = 0.95;
                ctx[2].fillStyle = "#258dff";
                for (const marker of global.craftrasRouteMarkers) {
                    const worldX = marker[0] * blockSize + blockSize / 2;
                    const worldY = marker[1] * blockSize + blockSize / 2;
                    if (!isInsideDisplayedRegion(worldX)) continue;
                    const minimapX = mapXForWorld(worldX);
                    const minimapY = mapYForWorld(worldY);
                    drawGuiRect(minimapX - markerSize / 2, minimapY - markerSize / 2, markerSize, markerSize);
                }
            }
            ctx[2].globalAlpha = 1;
            for (let entity of minimap.get()) {
                if (!isInsideDisplayedRegion(entity.x)) continue;
                ctx[2].fillStyle = gameDraw.mixColors(gameDraw.modifyColor(entity.color), color.black, 0.3);
                ctx[2].globalAlpha = entity.alpha;
                let minimapX = mapXForWorld(entity.x);
                let minimapY = mapYForWorld(entity.y);
                
                switch (entity.type) {
                    case 3: {
                        const markerSize = Math.max(!global.mobile ? 5 : 7, (entity.size / mapWorldWidth) * len * 1.35);
                        const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 180);
                        ctx[2].globalAlpha = entity.alpha * 0.28 * pulse;
                        ctx[2].fillStyle = "#ff3030";
                        drawGuiCircle(minimapX, minimapY, markerSize * 2.2);
                        ctx[2].globalAlpha = entity.alpha;
                        drawCraftrasPolygon(ctx[2], minimapX, minimapY, markerSize, 4, Math.PI / 4, "#ff3030", "#5b0505");
                        drawText("N", minimapX, minimapY, markerSize * 1.55, "#ffffff", "center", false, 1, 8, ctx[2]);
                    } break;
                    case 2:
                        // Draw wall entities
                        let trueSize = (entity.size + 2) / 1.1283791671;
                        let sizeOnMap = (trueSize / mapWorldWidth) * len;
                        drawGuiRect(minimapX - sizeOnMap, minimapY - sizeOnMap, sizeOnMap * 2, sizeOnMap * 2);
                        break;
                    case 1:
                        // Draw rock/other entities
                        let entitySize = (entity.size / mapWorldWidth) * len;
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
            drawGuiCircle(config.game.centeredMinimap ? centerX : mapXForWorld(global.player.cx.animX), config.game.centeredMinimap ? centerY : mapYForWorld(global.player.cy.animY), !global.mobile ? 2 : 3.5, false);
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
        let watermarkText = "Craftras.io";
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
            drawText(`${(100 * gui.fps).toFixed(2)}% ` + global.serverStats.players + ` player${global.serverStats.players == 1 ? "" : "s"}`, x + len, y - 50 - 9 * 14, 10, color.guiwhite, "right");
            drawText(`Coordinates: (${xloc.toFixed(2)}, ${yloc.toFixed(2)})`, x + len, y - 50 - 8 * 14, 10, color.guiwhite, "right");
            drawText("Speed: " + tankSpeed.toFixed(2) + " gu/s", x + len, y - 50 - 7 * 14, 10, color.guiwhite, "right");
            drawText("Memory: " + global.metrics.rendergap.toFixed(1) + " Mib", x + len, y - 50 - 6 * 14, 10, color.guiwhite, "right");
            drawText(`Rendering: e ${global.renderingInfo.entities} t: ${global.renderingInfo.turretEntities} n: ${global.renderingInfo.entitiesWithName}`, x + len, y - 50 - 5 * 14, 10, color.guiwhite, "right");
            drawText(`Bandwidth: tx ${global.bandwidth.finalHa} rx ${global.bandwidth.finalFa}`, x + len, y - 50 - 4 * 14, 10, color.guiwhite, "right");
            drawText("Update Rate: " + global.metrics.updatetime + "Hz", x + len, y - 50 - 3 * 14, 10, color.guiwhite, "right");
            drawText("Prediction: " + Math.round(GRAPHDATA) + "ms", x + len, y - 50 - 2 * 14, 10, color.guiwhite, "right");
            drawText(`${global.metrics.rendertime} FPS ${global.serverStats.mspt} mspt : ${global.metrics.mspt.toFixed(1)} gmspt`, x + len, y - 50 - 1 * 14, 10, color.guiwhite, "right");
            drawText(ping.toFixed(1) + " ms / " + global.serverStats.serverGamemodeName + " " + global.locationHash, x + len, y - 50, 10, color.guiwhite, "right");
        } else if (!global.GUIStatus.minimapReducedInfo) {
            drawText(watermarkText, x + len, y - 50 - 3 * 14 - 2, 15, watermarkColor, "right");
            drawText(`${(100 * gui.fps).toFixed(2)}% ` + global.serverStats.players + ` player${global.serverStats.players == 1 ? "" : "s"}`, x + len, y - 50 - 2 * 14, 10, color.guiwhite, "right");
            drawText(`${global.metrics.rendertime} FPS ${global.serverStats.mspt} mspt`, x + len, y - 50 - 1 * 14, 10, color.guiwhite, "right");
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
                drawButton(x + width - 25, y + 7, 35, 35, global.dailyTankAd.closebtnAnim.get(), "rect", "X", 24, color.red, color.red, false, true, "dailyTankCloseAd", global.canvas.height / global.screenHeight / global.ratio, false);
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
        let txt = "";
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
        drawText("Survived for " + util.timeForHumans(Math.round(global.finalLifetime.get())), x - 170, y + 55, 16, color.guiwhite);
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

    const drawCraftrasSpectatorUI = () => {
        if (!global.craftrasSpectator || global.died || global.disconnected) {
            global.craftrasSpectatorRespawnBounds = null;
            if (!global.died) global.clickables.deathRespawn.hide();
            return;
        }
        const x = global.screenWidth / 2;
        const y = Math.max(120, global.screenHeight - 280);
        ctx[2].save();
        ctx[2].globalAlpha = 0.94;
        drawText("SPECTATOR", x, y - 34, 18, "#dfe8ff", "center", true, 1, 1, ctx[2]);
        if (global.craftrasWorld?.challengeMode) {
            global.craftrasSpectatorRespawnBounds = null;
            global.clickables.deathRespawn.hide();
        } else {
            const width = 190;
            const height = 48;
            const rect = global.canvas.cv.getBoundingClientRect();
            const scaleX = rect.width / Math.max(1, global.screenWidth);
            const scaleY = rect.height / Math.max(1, global.screenHeight);
            global.craftrasSpectatorRespawnBounds = {
                left: rect.left + (x - width / 2) * scaleX,
                top: rect.top + y * scaleY,
                right: rect.left + (x + width / 2) * scaleX,
                bottom: rect.top + (y + height) * scaleY,
            };
            drawButton(x, y, width, height, 1, "rect", "Respawn", 22, false, false, false, true, "deathRespawn", global.canvas.height / global.screenHeight / global.ratio, 0);
        }
        ctx[2].restore();
    };

    const drawCraftrasBossHealthBar = () => {
        const duo = global.craftrasSwordGuy2DuoHealth;
        if (duo?.active && Date.now() < duo.expiresAt && duo.bosses?.length) {
            const width = Math.max(300, Math.min(640, global.screenWidth * 0.48));
            const height = 16;
            const gap = 29;
            const x = Math.round((global.screenWidth - width) / 2);
            const messageBottom = Math.max(0, Number(global.craftrasMessageBottom) || 0);
            const firstY = Math.min(
                Math.max(38, global.screenHeight - height * 2 - gap - 24),
                Math.max(38, Math.ceil(messageBottom + 30)),
            );
            ctx[2].save();
            duo.bosses.forEach((boss, index) => {
                boss.displayAmount += (boss.amount - boss.displayAmount) * 0.12;
                if (Math.abs(boss.displayAmount - boss.amount) < 0.05) boss.displayAmount = boss.amount;
                const y = firstY + index * (height + gap);
                const healthRatio = Math.max(0, Math.min(1, boss.amount / boss.max));
                const displayRatio = Math.max(0, Math.min(1, boss.displayAmount / boss.max));
                const mainColor = index === 0 ? "#4aa3ff" : "#ad55ee";
                const delayedColor = index === 0 ? "#244c7d" : "#5b2d73";
                ctx[2].fillStyle = "rgba(12, 13, 16, 0.9)";
                ctx[2].fillRect(x - 3, y - 3, width + 6, height + 6);
                ctx[2].fillStyle = delayedColor;
                ctx[2].fillRect(x, y, width * displayRatio, height);
                ctx[2].fillStyle = mainColor;
                ctx[2].fillRect(x, y, width * healthRatio, height);
                ctx[2].strokeStyle = "#f1f3f5";
                ctx[2].lineWidth = 2;
                ctx[2].strokeRect(x, y, width, height);
                drawText(boss.name, global.screenWidth / 2, y - 10, 17, "#ffffff", "center", true, 1, 1, ctx[2]);
                drawText(
                    `${Math.ceil(boss.amount)} / ${Math.ceil(boss.max)}`,
                    global.screenWidth / 2,
                    y + height / 2,
                    11,
                    "#ffffff",
                    "center",
                    true,
                    1,
                    1,
                    ctx[2],
                );
            });
            ctx[2].restore();
            return;
        }
        if (duo) duo.active = false;
        const boss = global.craftrasBossHealth;
        if (!boss?.active || Date.now() >= boss.expiresAt || boss.max <= 0) {
            if (boss) boss.active = false;
            return;
        }
        boss.displayAmount += (boss.amount - boss.displayAmount) * 0.12;
        if (Math.abs(boss.displayAmount - boss.amount) < 0.05) boss.displayAmount = boss.amount;
        const width = Math.max(300, Math.min(640, global.screenWidth * 0.48));
        const height = 18;
        const x = Math.round((global.screenWidth - width) / 2);
        const messageBottom = Math.max(0, Number(global.craftrasMessageBottom) || 0);
        const y = Math.min(
            Math.max(38, global.screenHeight - height - 24),
            Math.max(38, Math.ceil(messageBottom + 30)),
        );
        const healthRatio = Math.max(0, Math.min(1, boss.amount / boss.max));
        const displayRatio = Math.max(0, Math.min(1, boss.displayAmount / boss.max));

        ctx[2].save();
        ctx[2].fillStyle = "rgba(12, 13, 16, 0.9)";
        ctx[2].fillRect(x - 3, y - 3, width + 6, height + 6);
        ctx[2].fillStyle = "#611f2b";
        ctx[2].fillRect(x, y, width * displayRatio, height);
        ctx[2].fillStyle = "#df3548";
        ctx[2].fillRect(x, y, width * healthRatio, height);
        ctx[2].strokeStyle = "#f1f3f5";
        ctx[2].lineWidth = 2;
        ctx[2].strokeRect(x, y, width, height);
        drawText(boss.name || "Boss", global.screenWidth / 2, y - 11, 19, "#ffffff", "center", true, 1, 1, ctx[2]);
        drawText(
            `${Math.ceil(boss.amount)} / ${Math.ceil(boss.max)}`,
            global.screenWidth / 2,
            y + height / 2,
            12,
            "#ffffff",
            "center",
            true,
            1,
            1,
            ctx[2],
        );
        ctx[2].restore();
    };

    const drawCraftrasTeamInvite = () => {
        const invite = global.craftrasTeamInvite;
        if (!invite?.active || global.disconnected || Date.now() >= invite.expiresAt) {
            if (invite?.active && Date.now() >= invite.expiresAt) {
                global.craftrasTeamInvite = { active: false, inviter: "", kind: "invite", expiresAt: 0 };
            }
            global.clickables.teamInvite.hide();
            return;
        }
        const ratio = global.canvas.height / global.screenHeight / global.ratio;
        const centerX = global.screenWidth / 2;
        const top = Math.max(32, Math.min(74, global.screenHeight * 0.07));
        const panelWidth = Math.min(420, global.screenWidth - 24);
        const panelHeight = 104;
        const seconds = Math.max(1, Math.ceil((invite.expiresAt - Date.now()) / 1000));
        ctx[2].save();
        ctx[2].globalAlpha = 0.96;
        ctx[2].fillStyle = "rgba(20, 24, 30, 0.94)";
        ctx[2].strokeStyle = "rgba(225, 232, 240, 0.7)";
        ctx[2].lineWidth = 2;
        ctx[2].fillRect(centerX - panelWidth / 2, top, panelWidth, panelHeight);
        ctx[2].strokeRect(centerX - panelWidth / 2, top, panelWidth, panelHeight);
        const invitationText = invite.kind === "join"
            ? `${invite.inviter} wants to join your team`
            : `${invite.inviter} invited you to a team`;
        drawText(invitationText, centerX, top + 25, 17, "#ffffff", "center", true, 1, 1, ctx[2]);
        drawText(`${seconds}s`, centerX, top + 48, 12, "#b8c0cc", "center", false, 1, 1, ctx[2]);
        drawButton(centerX - 72, top + 62, 124, 34, 1, "rect", "Accept", 16, "#36ad58", "#23783c", "#164d28", true, "teamInvite", ratio, 0);
        drawButton(centerX + 72, top + 62, 124, 34, 1, "rect", "Decline", 16, "#df4b4b", "#9e2f34", "#5f1c21", true, "teamInvite", ratio, 1);
        ctx[2].restore();
    };

    const drawCraftrasChallengeEntry = () => {
        const entry = global.craftrasChallengeEntry;
        if (!entry?.open || global.disconnected || global.died || global.craftrasSpectator) {
            global.clickables.challengeEntry.hide();
            return;
        }
        const ratio = global.canvas.height / global.screenHeight / global.ratio;
        const centerX = global.screenWidth / 2;
        const centerY = global.screenHeight / 2;
        const panelWidth = Math.max(300, Math.min(470, global.screenWidth - 24));
        const panelHeight = entry.teamName ? 250 : 272;
        const panelX = centerX - panelWidth / 2;
        const panelY = centerY - panelHeight / 2;
        const buttonWidth = Math.max(118, Math.min(172, (panelWidth - 52) / 2));
        const buttonFontSize = panelWidth < 380 ? 13 : 16;
        const buttonY = panelY + panelHeight - 58;
        const world2Challenge = entry.kind === "world2";
        ctx[2].save();
        ctx[2].globalAlpha = 0.97;
        ctx[2].fillStyle = "rgba(18, 22, 28, 0.96)";
        ctx[2].strokeStyle = "rgba(230, 236, 244, 0.78)";
        ctx[2].lineWidth = 2;
        ctx[2].fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx[2].strokeRect(panelX, panelY, panelWidth, panelHeight);
        drawText(world2Challenge ? "WORLD 2 Challenge" : "WORLD 1 Challenge", centerX, panelY + 38, 25, "#ffffff", "center", true, 1, 1, ctx[2]);
        drawText(world2Challenge ? "[Ancient Key Required]" : "[Royal Key Required]", centerX, panelY + 70, 16, "#f2cf63", "center", true, 1, 1, ctx[2]);
        if (world2Challenge) {
            drawText("Difficulty: Hard  |  Reward: 1 Token (One-time)", centerX, panelY + 98, 14, "#ffd84d", "center", false, 1, 1, ctx[2]);
        }
        drawText("All team members will be transported.", centerX, panelY + (world2Challenge ? 123 : 105), 15, "#d9e0e8", "center", false, 1, 1, ctx[2]);
        if (entry.teamName) {
            drawText(`${entry.teamName} (${entry.memberCount}/8)`, centerX, panelY + (world2Challenge ? 151 : 137), 14, entry.isHost ? "#ffd84a" : "#c9d3df", "center", false, 1, 1, ctx[2]);
        } else {
            drawText("No team yet? Create one using", centerX, panelY + (world2Challenge ? 151 : 135), 13, "#b9c3cf", "center", false, 1, 1, ctx[2]);
            drawText("the $team command.", centerX, panelY + (world2Challenge ? 171 : 155), 13, "#b9c3cf", "center", false, 1, 1, ctx[2]);
        }
        drawButton(centerX - buttonWidth / 2 - 8, buttonY, buttonWidth, 40, 1, "rect", "Start Challenge", buttonFontSize, "#36ad58", "#23783c", "#164d28", true, "challengeEntry", ratio, 0);
        drawButton(centerX + buttonWidth / 2 + 8, buttonY, buttonWidth, 40, 1, "rect", "Cancel", buttonFontSize, "#df4b4b", "#9e2f34", "#5f1c21", true, "challengeEntry", ratio, 1);
        ctx[2].restore();
    };

    const applyScreenShake = (type = "camera", returnOption = false) => {
        if (global.died || global.craftrasSpectator || global.disconnected) {
            resetScreenShake();
            return;
        }
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
        prewarmCraftrasCaveDepthCache();
        updateCraftrasCaveDarkness();
        updateCraftrasWeatherVisuals();
        drawEntities(px, py, ratio, tick, spacing);
        ctx[1].globalAlpha = 1;
        ctx[2].globalAlpha = 1;
        drawCraftrasClouds(px, py, ratio);
        drawCraftrasStormClouds(ratio);
        drawCraftrasDaylightOverlay();
        drawCraftrasWeatherDarkness();
        drawCraftrasKingdomFog(ratio);
        drawCraftrasCaveDarknessOverlay(ratio);
        drawCraftrasCurseDarknessOverlay(ratio);
        drawCraftrasRain();
        drawCraftrasChallengeStoryEffect();
        drawCraftrasWhiteInferno(px, py, ratio);
        drawCraftrasLaserBeams(px, py, ratio);
        drawCraftrasJaneScreenCutEffect();
        drawCraftrasJanePhaseTwoSkillTwoScreenEffect();
    };

    function drawCraftrasCaveDarknessOverlay(ratio) {
        const world = global.craftrasWorld;
        const alpha = world?.caveDarknessAlpha || 0;
        if (alpha <= 0.005) return;
        const blockSize = world.blockSize || 82;
        const centerX = global.screenWidth / 2;
        const centerY = global.screenHeight / 2;
        const visibleBlocks = Math.max(CRAFTRAS_CAVE_FOG_MIN_CLEAR_BLOCKS, CRAFTRAS_CAVE_MOB_BASE_VISIBLE_BLOCKS * (1 - alpha));
        const screenRadius = Math.hypot(global.screenWidth, global.screenHeight) * 0.48;
        const clearRadius = Math.max(36, Math.min(screenRadius, visibleBlocks * blockSize * ratio) * CRAFTRAS_CAVE_FOG_CLEAR_RADIUS_SCALE);
        const outerRadius = clearRadius + Math.max(90, CRAFTRAS_CAVE_FOG_FEATHER_BLOCKS * blockSize * ratio);
        const fogAlpha = Math.min(CRAFTRAS_CAVE_MAX_DARKNESS, alpha);
        const depthRatio = smoothstep01(alpha / CRAFTRAS_CAVE_MAX_DARKNESS);
        const centerAlpha = fogAlpha * CRAFTRAS_CAVE_FOG_CENTER_DARKNESS_RATIO * depthRatio;
        const blendFogAlpha = amount => centerAlpha + (fogAlpha - centerAlpha) * amount;
        const fog = ctx[1].createRadialGradient(centerX, centerY, clearRadius, centerX, centerY, outerRadius);
        fog.addColorStop(0, `rgba(0, 0, 0, ${centerAlpha.toFixed(3)})`);
        fog.addColorStop(0.28, `rgba(0, 0, 0, ${blendFogAlpha(0.12).toFixed(3)})`);
        fog.addColorStop(0.62, `rgba(0, 0, 0, ${blendFogAlpha(0.58).toFixed(3)})`);
        fog.addColorStop(1, `rgba(0, 0, 0, ${fogAlpha.toFixed(3)})`);
        ctx[1].save();
        ctx[1].fillStyle = fog;
        ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
        ctx[1].restore();
    }

    function drawCraftrasCurseDarknessOverlay(ratio) {
        const world = global.craftrasWorld;
        if (!world) return;
        const target = Date.now() < (world.curseDarknessUntil || 0) ? 0.86 : 0;
        const current = world.curseDarknessAlpha || 0;
        const lerp = target > current ? 0.12 : 0.035;
        world.curseDarknessAlpha = current + (target - current) * lerp;
        const alpha = world.curseDarknessAlpha;
        if (alpha <= 0.005) return;
        const centerX = global.screenWidth / 2;
        const centerY = global.screenHeight / 2;
        const blockSize = world.blockSize || 82;
        const clearRadius = Math.max(22, blockSize * ratio * 0.65);
        const outerRadius = clearRadius + Math.max(85, blockSize * ratio * 2.2);
        const fog = ctx[1].createRadialGradient(centerX, centerY, clearRadius, centerX, centerY, outerRadius);
        fog.addColorStop(0, `rgba(0, 0, 0, ${(alpha * 0.38).toFixed(3)})`);
        fog.addColorStop(0.45, `rgba(0, 0, 0, ${(alpha * 0.72).toFixed(3)})`);
        fog.addColorStop(1, `rgba(0, 0, 0, ${alpha.toFixed(3)})`);
        ctx[1].save();
        ctx[1].fillStyle = fog;
        ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
        ctx[1].restore();
    }

    function drawCraftrasChallengeStoryEffect() {
        const effect = global.craftrasChallengeStoryEffect;
        if (!effect?.active) return;
        const elapsed = Math.max(0, Date.now() - effect.startedAt);
        const whiteoutDuration = Math.max(1, effect.whiteoutDuration || 3000);
        const fogDuration = Math.max(whiteoutDuration, effect.fogDuration || 8000);
        if (elapsed >= fogDuration) {
            effect.active = false;
            return;
        }

        const whiteProgress = Math.min(1, elapsed / whiteoutDuration);
        const whiteAlpha = whiteProgress < 0.36
            ? smoothstep01(whiteProgress / 0.36)
            : whiteProgress < 0.5
                ? 1
                : 1 - smoothstep01((whiteProgress - 0.5) / 0.5);
        const fogIn = smoothstep01(Math.max(0, Math.min(1, (elapsed - whiteoutDuration * 0.34) / (whiteoutDuration * 0.5))));
        const fogOut = 1 - smoothstep01(Math.max(0, Math.min(1, (elapsed - fogDuration * 0.72) / (fogDuration * 0.28))));
        const fogAlpha = fogIn * fogOut;
        const centerX = global.screenWidth / 2;
        const centerY = global.screenHeight / 2;
        const diagonal = Math.hypot(global.screenWidth, global.screenHeight);
        const fog = ctx[1].createRadialGradient(centerX, centerY, diagonal * 0.08, centerX, centerY, diagonal * 0.72);
        fog.addColorStop(0, `rgba(255, 250, 205, ${(fogAlpha * 0.08).toFixed(3)})`);
        fog.addColorStop(0.42, `rgba(255, 236, 142, ${(fogAlpha * 0.24).toFixed(3)})`);
        fog.addColorStop(1, `rgba(255, 218, 92, ${(fogAlpha * 0.48).toFixed(3)})`);
        ctx[1].save();
        ctx[1].fillStyle = fog;
        ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
        if (whiteAlpha > 0.001) {
            ctx[1].fillStyle = `rgba(255, 255, 244, ${whiteAlpha.toFixed(3)})`;
            ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
        }
        ctx[1].restore();
    }

    function updateCraftrasWorldRegionTransition() {
        const world = global.craftrasWorld;
        if (!world?.active || !world.world2Enabled || !Number.isFinite(global.player.renderx)) return;
        const transition = global.craftrasServerTransition;
        const now = Date.now();
        const detectedRegion = global.player.renderx >= world.world2MinX ? 2 : 1;

        if (!world.displayRegion) {
            world.displayRegion = detectedRegion;
            return;
        }
        if (world.pendingRegion) {
            if (transition?.phase === "hold" && now >= (transition.worldRegionHoldUntil || 0)) {
                world.displayRegion = world.pendingRegion;
                transition.phase = "in";
                transition.startedAt = now;
                transition.duration = 600;
            } else if (!transition?.active) {
                world.pendingRegion = 0;
            }
            return;
        }
        if (detectedRegion === world.displayRegion || transition?.active) return;

        world.pendingRegion = detectedRegion;
        transition.active = true;
        transition.phase = "out";
        transition.startedAt = now;
        transition.duration = 500;
        transition.alpha = 0;
        transition.worldRegionHoldUntil = now + 700;
    }

    function drawCraftrasServerTransition() {
        updateCraftrasWorldRegionTransition();
        const transition = global.craftrasServerTransition;
        if (!transition?.active) return;
        const now = Date.now();
        let alpha = transition.alpha || 0;
        if (transition.phase === "out") {
            const progress = Math.max(0, Math.min(1, (now - transition.startedAt) / Math.max(1, transition.duration)));
            alpha = smoothstep01(progress);
            if (progress >= 1) transition.phase = "hold";
        } else if (transition.phase === "hold") {
            alpha = 1;
        } else if (transition.phase === "in") {
            const progress = Math.max(0, Math.min(1, (now - transition.startedAt) / Math.max(1, transition.duration)));
            alpha = 1 - smoothstep01(progress);
            if (progress >= 1) {
                transition.active = false;
                transition.phase = "idle";
                transition.alpha = 0;
                transition.worldRegionHoldUntil = 0;
                if (global.craftrasWorld) global.craftrasWorld.pendingRegion = 0;
                return;
            }
        }
        transition.alpha = alpha;
        if (alpha <= 0.001) return;
        ctx[2].save();
        if (alpha >= 0.995) {
            ctx[2].fillStyle = "#000000";
        } else {
            const centerX = global.screenWidth / 2;
            const centerY = global.screenHeight / 2;
            const diagonal = Math.hypot(global.screenWidth, global.screenHeight);
            const clearRadius = Math.max(0, diagonal * 0.58 * (1 - alpha) ** 2);
            const outerRadius = clearRadius + Math.max(100, diagonal * (0.16 + 0.12 * alpha));
            const centerAlpha = Math.min(1, alpha ** 3);
            const fog = ctx[2].createRadialGradient(centerX, centerY, clearRadius, centerX, centerY, outerRadius);
            fog.addColorStop(0, `rgba(0, 0, 0, ${centerAlpha.toFixed(3)})`);
            fog.addColorStop(0.32, `rgba(0, 0, 0, ${(centerAlpha + (alpha - centerAlpha) * 0.18).toFixed(3)})`);
            fog.addColorStop(0.72, `rgba(0, 0, 0, ${(centerAlpha + (alpha - centerAlpha) * 0.72).toFixed(3)})`);
            fog.addColorStop(1, `rgba(0, 0, 0, ${alpha.toFixed(3)})`);
            ctx[2].fillStyle = fog;
        }
        ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
        ctx[2].restore();
    }

    function drawCraftrasChallengeBlueParry() {
        const effect = global.craftrasChallengeBlueParry;
        if (!effect?.active) return;
        const elapsed = Math.max(0, Date.now() - effect.startedAt);
        const numberDuration = Math.max(200, effect.numberDuration || 500);
        const bangDuration = Math.max(100, effect.bangDuration || 200);
        const countdownDuration = numberDuration * 3 + bangDuration;
        const flashDuration = Math.max(500, effect.flashDuration || 2000);
        if (elapsed >= countdownDuration + flashDuration) {
            effect.active = false;
            return;
        }
        ctx[2].save();
        if (elapsed < countdownDuration) {
            const labels = ["!", "!!", "!!!", "DIE"];
            const step = elapsed < numberDuration * 3
                ? Math.min(2, Math.floor(elapsed / numberDuration))
                : 3;
            const whiteProgress = Math.min(1, elapsed / Math.max(1, numberDuration * 3));
            ctx[2].fillStyle = `rgba(255, 255, 255, ${(whiteProgress * 0.72).toFixed(3)})`;
            ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
            const fontSize = Math.max(110, Math.min(global.screenWidth, global.screenHeight) * 0.32);
            ctx[2].textAlign = "center";
            ctx[2].textBaseline = "middle";
            ctx[2].font = `900 ${fontSize}px Ubuntu`;
            ctx[2].lineWidth = Math.max(8, fontSize * 0.055);
            const fillColors = ["#f2f2f2", "#ff8a8a", "#ff3030", "#ff1616"];
            const strokeColors = [
                "rgba(50, 50, 58, 0.92)",
                "rgba(92, 20, 30, 0.92)",
                "rgba(82, 4, 12, 0.94)",
                "rgba(62, 0, 8, 0.96)",
            ];
            ctx[2].strokeStyle = strokeColors[step];
            ctx[2].fillStyle = fillColors[step];
            ctx[2].strokeText(labels[step], global.screenWidth / 2, global.screenHeight / 2);
            ctx[2].fillText(labels[step], global.screenWidth / 2, global.screenHeight / 2);
        } else {
            const progress = Math.min(1, (elapsed - countdownDuration) / flashDuration);
            const alpha = progress < 0.88 ? 1 : 1 - smoothstep01((progress - 0.88) / 0.12);
            ctx[2].fillStyle = `rgba(210, 18, 38, ${Math.min(1, alpha).toFixed(3)})`;
            ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
        }
        ctx[2].restore();
    }

    function drawCraftrasSwordGuy2Parry() {
        const effect = global.craftrasSwordGuy2Parry;
        if (!effect?.active) return;
        const elapsed = Math.max(0, Date.now() - effect.startedAt);
        const stepDuration = Math.max(100, effect.stepDuration || 500);
        const nowDuration = Math.max(100, effect.nowDuration || 200);
        const warningDuration = stepDuration * 3;
        const sequenceDuration = warningDuration + nowDuration;
        const flashDuration = Math.max(200, effect.flashDuration || 500);
        if (elapsed >= sequenceDuration + flashDuration) {
            effect.active = false;
            return;
        }
        ctx[2].save();
        if (elapsed < sequenceDuration) {
            const step = elapsed < warningDuration
                ? Math.min(2, Math.floor(elapsed / stepDuration))
                : 3;
            const labels = ["!", "!!", "!!!", "NOW!"];
            const backgroundAlpha = step === 3 ? 0.92 : 0.08 + step * 0.08;
            ctx[2].fillStyle = `rgba(22, 112, 255, ${backgroundAlpha.toFixed(3)})`;
            ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
            const fontSize = Math.max(110, Math.min(global.screenWidth, global.screenHeight) * (step === 3 ? 0.25 : 0.32));
            ctx[2].textAlign = "center";
            ctx[2].textBaseline = "middle";
            ctx[2].font = `900 ${fontSize}px Ubuntu`;
            ctx[2].lineWidth = Math.max(8, fontSize * 0.055);
            ctx[2].strokeStyle = "rgba(5, 35, 105, 0.96)";
            ctx[2].fillStyle = step === 3 ? "#ffffff" : "#aee4ff";
            ctx[2].strokeText(labels[step], global.screenWidth / 2, global.screenHeight / 2);
            ctx[2].fillText(labels[step], global.screenWidth / 2, global.screenHeight / 2);
        } else {
            const progress = Math.min(1, (elapsed - sequenceDuration) / flashDuration);
            const alpha = 1 - smoothstep01(progress);
            ctx[2].fillStyle = `rgba(20, 105, 255, ${alpha.toFixed(3)})`;
            ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
        }
        ctx[2].restore();
    }

    function drawCraftrasWorld2MagicWarning() {
        const effect = global.craftrasWorld2MagicWarning;
        if (!effect?.active) return;
        const elapsed = Math.max(0, Date.now() - effect.startedAt);
        const stepDuration = Math.max(100, effect.stepDuration || 500);
        const warningDuration = stepDuration * 3;
        const flashDuration = Math.max(200, effect.flashDuration || 500);
        if (elapsed >= warningDuration + flashDuration) {
            effect.active = false;
            return;
        }
        ctx[2].save();
        if (elapsed < warningDuration) {
            const step = Math.min(2, Math.floor(elapsed / stepDuration));
            const labels = ["!", "!!", "!!!"];
            const intensity = 0.1 + step * 0.1;
            ctx[2].fillStyle = `rgba(105, 0, 72, ${intensity.toFixed(3)})`;
            ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
            const fontSize = Math.max(100, Math.min(global.screenWidth, global.screenHeight) * 0.3);
            ctx[2].textAlign = "center";
            ctx[2].textBaseline = "middle";
            ctx[2].font = `900 ${fontSize}px Ubuntu`;
            ctx[2].lineWidth = Math.max(8, fontSize * 0.055);
            ctx[2].strokeStyle = "rgba(58, 0, 42, 0.96)";
            ctx[2].fillStyle = step === 2 ? "#ff4d9a" : "#ffc0dc";
            ctx[2].strokeText(labels[step], global.screenWidth / 2, global.screenHeight / 2);
            ctx[2].fillText(labels[step], global.screenWidth / 2, global.screenHeight / 2);
        } else {
            const progress = Math.min(1, (elapsed - warningDuration) / flashDuration);
            const alpha = 0.68 * (1 - smoothstep01(progress));
            ctx[2].fillStyle = `rgba(145, 0, 92, ${alpha.toFixed(3)})`;
            ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
        }
        ctx[2].restore();
    }

    function drawCraftrasSwordGuy2Opening() {
        const effect = global.craftrasSwordGuy2Opening;
        if (!effect?.active) return;
        const elapsed = Math.max(0, Date.now() - effect.startedAt);
        const chargeDuration = Math.max(1500, effect.chargeDuration || 3000);
        const stepDuration = Math.max(200, effect.stepDuration || 500);
        const nowDuration = Math.max(100, effect.nowDuration || 200);
        if (elapsed >= chargeDuration + nowDuration) {
            effect.active = false;
            return;
        }
        const whiteProgress = Math.max(0, Math.min(1, elapsed / chargeDuration));
        const whiteAlpha = smoothstep01(whiteProgress);
        const labelStart = Math.max(0, chargeDuration - stepDuration * 3);
        ctx[2].save();
        ctx[2].fillStyle = `rgba(255, 255, 255, ${whiteAlpha.toFixed(3)})`;
        ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
        if (elapsed >= labelStart) {
            const labelElapsed = elapsed - labelStart;
            const step = labelElapsed < stepDuration * 3
                ? Math.min(2, Math.floor(labelElapsed / stepDuration))
                : 3;
            const labels = ["!", "!!", "!!!", "NOW"];
            const fontSize = Math.max(105, Math.min(global.screenWidth, global.screenHeight) * 0.28);
            ctx[2].textAlign = "center";
            ctx[2].textBaseline = "middle";
            ctx[2].font = `900 ${fontSize}px Ubuntu`;
            ctx[2].lineWidth = Math.max(8, fontSize * 0.055);
            ctx[2].strokeStyle = "rgba(255, 255, 255, 0.88)";
            ctx[2].fillStyle = "#050505";
            ctx[2].strokeText(labels[step], global.screenWidth / 2, global.screenHeight / 2);
            ctx[2].fillText(labels[step], global.screenWidth / 2, global.screenHeight / 2);
        }
        ctx[2].restore();
    }

    function drawCraftrasSwordGuy2DashCountdown() {
        const effect = global.craftrasSwordGuy2DashCountdown;
        if (!effect?.active) return;
        const elapsed = Math.max(0, Date.now() - effect.startedAt);
        const bangDuration = Math.max(100, effect.bangDuration || 200);
        if (elapsed >= bangDuration) {
            effect.active = false;
            return;
        }
        const progress = Math.min(1, elapsed / bangDuration);
        ctx[2].save();
        const fontSize = Math.max(54, Math.min(global.screenWidth, global.screenHeight) * 0.085);
        const playerOffsetX = Number(global.player?.screenx) || 0;
        const playerOffsetY = Number(global.player?.screeny) || 0;
        const x = global.screenWidth / 2 + playerOffsetX;
        const y = global.screenHeight / 2 + playerOffsetY - Math.max(76, fontSize * 1.3);
        ctx[2].textAlign = "center";
        ctx[2].textBaseline = "middle";
        ctx[2].font = `900 ${fontSize}px Ubuntu`;
        ctx[2].lineWidth = Math.max(5, fontSize * 0.09);
        ctx[2].globalAlpha = 1 - smoothstep01(progress);
        ctx[2].strokeStyle = "rgba(92, 0, 8, 0.98)";
        ctx[2].fillStyle = "#ff2020";
        ctx[2].strokeText("!", x, y);
        ctx[2].fillText("!", x, y);
        ctx[2].restore();
    }

    function drawCraftrasJanePinkFlash() {
        const effect = global.craftrasJanePinkFlash;
        if (!effect?.active) return;
        const progress = Math.max(0, Math.min(1, (Date.now() - effect.startedAt) / Math.max(1, effect.duration || 420)));
        if (progress >= 1) {
            effect.active = false;
            return;
        }
        const alpha = (effect.alpha || 0.24) * (1 - smoothstep01(progress));
        ctx[2].save();
        ctx[2].fillStyle = `rgba(255, 72, 184, ${alpha.toFixed(3)})`;
        ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
        ctx[2].restore();
    }

    function drawCraftrasJaneSkillFourCountdown() {
        const effect = global.craftrasJaneSkillFourCountdown;
        if (!effect?.active) return;
        const elapsed = Math.max(0, Date.now() - effect.startedAt);
        const stepDuration = Math.max(100, effect.stepDuration || 500);
        const impactDuration = Math.max(100, effect.impactDuration || 200);
        const warningDuration = stepDuration * 3;
        if (elapsed >= warningDuration + impactDuration) {
            effect.active = false;
            return;
        }
        const step = elapsed < warningDuration ? Math.min(2, Math.floor(elapsed / stepDuration)) : 3;
        const labels = ["!", "!!", "!!!", "PARRY!"];
        const intensity = step === 3 ? 0.72 : 0.08 + step * 0.08;
        const fontSize = Math.max(90, Math.min(global.screenWidth, global.screenHeight) * (step === 3 ? 0.2 : 0.27));
        ctx[2].save();
        ctx[2].fillStyle = step === 3
            ? `rgba(58, 140, 255, ${intensity.toFixed(3)})`
            : `rgba(255, 50, 184, ${intensity.toFixed(3)})`;
        ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
        ctx[2].textAlign = "center";
        ctx[2].textBaseline = "middle";
        ctx[2].font = `900 ${fontSize}px Ubuntu`;
        ctx[2].lineWidth = Math.max(7, fontSize * 0.06);
        ctx[2].strokeStyle = step === 3 ? "rgba(8, 45, 130, 0.96)" : "rgba(105, 8, 70, 0.96)";
        ctx[2].fillStyle = step === 3 ? "#dff5ff" : "#ffb5e4";
        ctx[2].strokeText(labels[step], global.screenWidth / 2, global.screenHeight / 2);
        ctx[2].fillText(labels[step], global.screenWidth / 2, global.screenHeight / 2);
        ctx[2].restore();
    }

    function drawCraftrasLaserBeams(px, py, ratio) {
        const beams = global.craftrasLaserBeams;
        if (!(beams instanceof Map) || beams.size === 0) return;
        const now = Date.now();
        const playerX = Number(global.player.renderx) || 0;
        const playerY = Number(global.player.rendery) || 0;
        for (const [id, beam] of beams) {
            const duration = Math.max(1, beam.duration || 700);
            const elapsed = now - beam.startedAt;
            const stopProgress = beam.stoppingAt
                ? Math.max(0, (now - beam.stoppingAt) / Math.max(1, beam.stopDuration || 140))
                : 0;
            if (stopProgress >= 1) {
                beams.delete(id);
                continue;
            }
            if (elapsed >= duration) {
                beams.delete(id);
                continue;
            }
            const activeDelay = Math.max(0, Math.min(duration - 1, beam.activeDelay || 0));
            const activeElapsed = Math.max(0, elapsed - activeDelay);
            const activeDuration = Math.max(1, duration - activeDelay);
            const progress = Math.max(0, Math.min(1, activeElapsed / activeDuration));
            const fadeIn = smoothstep01(Math.min(1, activeElapsed / 55));
            const fadeOutStart = Math.max(0, Math.min(0.99, Number(beam.fadeOutStart) || 0.72));
            const fadeOut = 1 - smoothstep01(Math.max(0, (progress - fadeOutStart) / (1 - fadeOutStart)));
            const flicker = 0.88 + Math.sin(now * 0.047 + Number(id) * 0.71) * 0.08
                + Math.sin(now * 0.113 + Number(id) * 1.37) * 0.04;
            const colorMode = String(beam.colorMode || "pink");
            const isBlue = colorMode === "blue";
            const isRed = colorMode === "red";
            const beamRgb = isBlue ? "60, 145, 255" : isRed ? "255, 38, 52" : "255, 45, 184";
            const beamFilter = isBlue
                ? "hue-rotate(-105deg) saturate(2.1) brightness(1.08)"
                : isRed ? "hue-rotate(35deg) saturate(2.35) brightness(1.03)" : "none";
            const alpha = Math.max(0, fadeIn * fadeOut * (1 - stopProgress) * flicker * (Number(beam.alphaScale) || 1));
            const length = Math.max(1, beam.length || 2400);
            const width = Math.max(1, beam.width || 450);
            let angle = (Number(beam.angle) || 0) + (Number(beam.angularVelocity) || 0) * activeElapsed;
            if (Number.isFinite(beam.trackedTargetAngle)) {
                const from = Number.isFinite(beam.trackedFromAngle) ? beam.trackedFromAngle : angle;
                const difference = Math.atan2(
                    Math.sin(beam.trackedTargetAngle - from),
                    Math.cos(beam.trackedTargetAngle - from),
                );
                const trackingProgress = smoothstep01(Math.min(1, Math.max(0, now - (beam.trackedUpdatedAt || now)) / 55));
                angle = from + difference * trackingProgress;
            }
            beam.renderAngle = angle;
            const startX = global.screenWidth / 2 + ratio * beam.x - px;
            const startY = global.screenHeight / 2 + ratio * beam.y - py;
            const visualLength = length * ratio;
            const visualHeight = width * ratio * (1.72 + Math.sin(now * 0.031) * 0.08);

            if (elapsed < activeDelay) {
                const warningPulse = 0.34 + (Math.sin(now * 0.024 + Number(id)) + 1) * 0.13;
                ctx[1].save();
                ctx[1].translate(startX, startY);
                ctx[1].rotate(angle);
                ctx[1].globalCompositeOperation = "lighter";
                ctx[1].strokeStyle = `rgba(${beamRgb}, ${warningPulse.toFixed(3)})`;
                ctx[1].shadowColor = `rgba(${beamRgb}, 0.9)`;
                ctx[1].shadowBlur = 15;
                ctx[1].lineWidth = Math.max(2, 5 * ratio);
                ctx[1].beginPath();
                ctx[1].moveTo(0, 0);
                ctx[1].lineTo(visualLength, 0);
                ctx[1].stroke();
                ctx[1].restore();
                continue;
            }

            ctx[1].save();
            ctx[1].translate(startX, startY);
            ctx[1].rotate(angle);
            ctx[1].globalCompositeOperation = "lighter";
            ctx[1].imageSmoothingEnabled = true;
            ctx[1].shadowColor = `rgba(${beamRgb}, 0.95)`;
            ctx[1].shadowBlur = Math.max(18, width * ratio * 0.8);
            ctx[1].filter = beamFilter;
            const isBlueLaserImage = beam.visualVariant === "blue";
            const laserImage = isBlueLaserImage
                ? craftrasBlueLaserBeamImage
                : beam.visualVariant === "giant"
                    ? craftrasGiantLaserBeamImage
                    : craftrasLaserBeamImage;
            // The regular laser PNG has a transparent 121px lead-in. Cropping it
            // keeps the visible beam rooted at the same point as its hitbox.
            const sourceCropLeft = isBlueLaserImage ? 0 : beam.visualVariant === "giant" ? 26.083 : 121;
            const sourceAxisY = beam.visualVariant === "giant" ? 467 / 1024 : 0.5;
            const sourceWidth = Math.max(1, laserImage.naturalWidth - sourceCropLeft);
            if (laserImage.complete && laserImage.naturalWidth) {
                if (isBlueLaserImage) {
                    ctx[1].rotate(Math.PI / 2);
                    ctx[1].globalAlpha = alpha * 0.38;
                    ctx[1].drawImage(
                        laserImage,
                        0,
                        0,
                        laserImage.naturalWidth,
                        laserImage.naturalHeight,
                        -visualHeight * 0.78,
                        -visualLength,
                        visualHeight * 1.56,
                        visualLength,
                    );
                    ctx[1].globalAlpha = alpha * 0.92;
                    ctx[1].drawImage(
                        laserImage,
                        0,
                        0,
                        laserImage.naturalWidth,
                        laserImage.naturalHeight,
                        -visualHeight * 0.5,
                        -visualLength,
                        visualHeight,
                        visualLength,
                    );
                } else {
                ctx[1].globalAlpha = alpha * 0.34;
                ctx[1].drawImage(
                    laserImage,
                    sourceCropLeft,
                    0,
                    sourceWidth,
                    laserImage.naturalHeight,
                    0,
                    -visualHeight * 1.56 * sourceAxisY,
                    visualLength,
                    visualHeight * 1.56,
                );
                ctx[1].globalAlpha = alpha * 0.82;
                ctx[1].drawImage(
                    laserImage,
                    sourceCropLeft,
                    0,
                    sourceWidth,
                    laserImage.naturalHeight,
                    0,
                    -visualHeight * sourceAxisY,
                    visualLength,
                    visualHeight,
                );
                }
            } else {
                const gradient = ctx[1].createLinearGradient(0, 0, visualLength, 0);
                gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
                gradient.addColorStop(0.08, `rgba(${beamRgb}, 0.95)`);
                gradient.addColorStop(1, `rgba(${beamRgb}, 0.72)`);
                ctx[1].globalAlpha = alpha;
                ctx[1].strokeStyle = gradient;
                ctx[1].lineWidth = Math.max(4, width * ratio * 0.28);
                ctx[1].beginPath();
                ctx[1].moveTo(0, 0);
                ctx[1].lineTo(visualLength, 0);
                ctx[1].stroke();
            }
            ctx[1].restore();

            const forwardX = Math.cos(angle);
            const forwardY = Math.sin(angle);
            const dx = playerX - beam.x;
            const dy = playerY - beam.y;
            const forward = Math.max(0, Math.min(length, dx * forwardX + dy * forwardY));
            const closestX = beam.x + forwardX * forward;
            const closestY = beam.y + forwardY * forward;
            const distance = Math.hypot(playerX - closestX, playerY - closestY);
            const light = Math.max(0, 1 - distance / 900) * alpha;
            if (light <= 0.002) continue;
            const lightX = global.screenWidth / 2 + ratio * closestX - px;
            const lightY = global.screenHeight / 2 + ratio * closestY - py;
            const radius = Math.max(180, 620 * ratio);
            const glow = ctx[1].createRadialGradient(lightX, lightY, 0, lightX, lightY, radius);
            glow.addColorStop(0, `rgba(255, 245, 255, ${(light * 0.31).toFixed(3)})`);
            glow.addColorStop(0.22, `rgba(${beamRgb}, ${(light * 0.22).toFixed(3)})`);
            glow.addColorStop(1, `rgba(${beamRgb}, 0)`);
            ctx[1].save();
            ctx[1].globalCompositeOperation = "screen";
            ctx[1].fillStyle = glow;
            ctx[1].fillRect(lightX - radius, lightY - radius, radius * 2, radius * 2);
            ctx[1].restore();
        }
    }

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
            [5, 12, 36, CRAFTRAS_NIGHT_MAX_DARKNESS],
        ];
        const transition = progress < 0.72 ? 0 : (() => {
            const t = Math.min(1, (progress - 0.72) / 0.28);
            return t * t * (3 - 2 * t);
        })();
        const from = colors[phase];
        const to = colors[(phase + 1) % colors.length];
        const mix = index => from[index] + (to[index] - from[index]) * transition;
        const world = global.craftrasWorld;
        const targetTorchLight = mix(3) > 0.3 ? getCraftrasTorchLightAtPlayer() : 0;
        const currentTorchLight = world.dayTorchLightAlpha || 0;
        const torchLerp = targetTorchLight > currentTorchLight ? CRAFTRAS_NIGHT_TORCH_RISE_LERP : CRAFTRAS_NIGHT_TORCH_FALL_LERP;
        world.dayTorchLightAlpha = currentTorchLight + (targetTorchLight - currentTorchLight) * torchLerp;
        if (Math.abs(world.dayTorchLightAlpha) < 0.001) world.dayTorchLightAlpha = 0;
        const alpha = mix(3) > 0.3
            ? mix(3) * (1 - world.dayTorchLightAlpha * CRAFTRAS_NIGHT_TORCH_MAX_DARKNESS_REDUCTION)
            : mix(3);
        ctx[1].save();
        ctx[1].fillStyle = `rgba(${Math.round(mix(0))}, ${Math.round(mix(1))}, ${Math.round(mix(2))}, ${alpha.toFixed(3)})`;
        ctx[1].fillRect(0, 0, global.screenWidth, global.screenHeight);
        ctx[1].restore();
    }

    const drawGUI = (tick, scaleRatio) => {
        if (global.screenshotGuiHidden) {
            global.metrics.lastrender = getNow();
            return;
        }
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
        drawCraftrasRecipeUnlockNotification();
        global.craftrasMessageBottom = 0;
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
        drawCraftrasChallengeEntry();
        drawCraftrasTeamInvite();
        if (shake) ctx[2].translate(-shake.dx, -shake.dy);
        global.metrics.lastrender = getNow();
    }

    function drawCraftrasBossSkillBar() {
        const form = global.craftrasBossForm;
        const skillSets = {
            world1_basic: [
                { key: "Q", name: "DASH COMBO" },
                { key: "R", name: "FRIEND STORM" },
                { key: "T", name: "BLADE BURST" },
            ],
            world2_basic: [
                { key: "Q", name: "NOW" },
                { key: "R", name: "TRIPLE DASH" },
                { key: "T", name: "FRIEND STORM" },
                { key: "Y", name: "CHASE DASH" },
            ],
            jane: [
                { key: "Q", name: "SAW RUSH" },
                { key: "R", name: "SWORD PRISON" },
                { key: "T", name: "CLONE CHARGE" },
                { key: "Y", name: "PETAL LASER" },
                { key: "U", name: "JUDGMENT LASER" },
                { key: "I", name: "P2 SAW RUSH" },
                { key: "O", name: "P2 PRISON" },
                { key: "P", name: "P2 CLONE LASER" },
            ],
        };
        const skills = skillSets[form.type] || skillSets.world1_basic;
        const columns = Math.min(4, skills.length);
        const rows = Math.ceil(skills.length / columns);
        const slotWidth = Math.max(82, Math.min(138, (global.screenWidth - 40) / columns - 8));
        const slotHeight = 46;
        const gap = 6;
        const totalWidth = slotWidth * columns + gap * (columns - 1);
        const startX = Math.round((global.screenWidth - totalWidth) / 2);
        const y = Math.round(global.screenHeight - rows * slotHeight - (rows - 1) * gap - 132);
        const health = global.craftrasHealth ?? { amount: 3000, max: 3000 };
        const healthRatio = Math.max(0, Math.min(1, health.amount / Math.max(1, health.max)));
        const healthY = y - 24;

        ctx[2].save();
        ctx[2].fillStyle = "rgba(20, 24, 32, 0.9)";
        ctx[2].fillRect(startX, healthY, totalWidth, 15);
        ctx[2].fillStyle = "#e44343";
        ctx[2].fillRect(startX + 2, healthY + 2, Math.max(0, (totalWidth - 4) * healthRatio), 11);
        ctx[2].strokeStyle = "rgba(225, 235, 255, 0.9)";
        ctx[2].lineWidth = 1.5;
        ctx[2].strokeRect(startX, healthY, totalWidth, 15);
        drawText(`${Math.ceil(health.amount)} / ${Math.ceil(health.max)}`, startX + totalWidth / 2, healthY + 7.5, 10, color.guiwhite, "center", true, 1, 1, ctx[2]);
        drawText("M  CANCEL", startX + totalWidth, healthY - 9, 10, "#ff9dba", "right", true, 1, 1, ctx[2]);

        const now = Date.now();
        for (let index = 0; index < skills.length; index++) {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + column * (slotWidth + gap);
            const slotY = y + row * (slotHeight + gap);
            const active = form.activeSkill === index;
            const cooldownMs = Math.max(0, (form.cooldownEndsAt?.[index] || 0) - now);
            const ready = cooldownMs <= 0 && form.activeSkill < 0;
            ctx[2].fillStyle = active ? "rgba(52, 106, 171, 0.94)" : ready ? "rgba(34, 54, 72, 0.92)" : "rgba(28, 30, 36, 0.92)";
            ctx[2].strokeStyle = active ? "#7ec8ff" : ready ? "#dceeff" : "#6f7782";
            ctx[2].lineWidth = active ? 3 : 1.5;
            ctx[2].fillRect(x, slotY, slotWidth, slotHeight);
            ctx[2].strokeRect(x, slotY, slotWidth, slotHeight);
            drawText(skills[index].key, x + 14, slotY + 13, 13, active ? "#ffffff" : "#8fd3ff", "center", true, 1, 1, ctx[2]);
            drawText(skills[index].name, x + slotWidth / 2, slotY + 27, 10, color.guiwhite, "center", true, 1, 1, ctx[2]);
            const state = active ? "ACTIVE" : cooldownMs > 0 ? `${Math.ceil(cooldownMs / 100) / 10}s` : "READY";
            drawText(state, x + slotWidth - 8, slotY + 12, 10, active ? "#ffffff" : cooldownMs > 0 ? "#ffd45e" : "#79edaa", "right", true, 1, 1, ctx[2]);
        }
        ctx[2].restore();
    }

    function drawCraftrasHotbar() {
        const hotbar = global.craftrasHotbar;
        const isCraftras = hotbar?.active || global.craftrasWorld?.active || /craftras/i.test(global.serverStats?.serverGamemodeName || "");
        if (!isCraftras || global.died || global.craftrasSpectator || global.disconnected) return;
        if (global.craftrasBossForm?.active) {
            drawCraftrasBossSkillBar();
            return;
        }

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
        const selectedItem = hotbar.slots[hotbar.selected];
        if (selectedItem?.id === "blue_laser_beam") {
            const laser = global.craftrasBlueLaser || { gauge: 100, overheatedUntil: 0, firing: false };
            const gauge = Math.max(0, Math.min(100, Number(laser.gauge) || 0));
            const overheatedFor = Math.max(0, (laser.overheatedUntil || 0) - Date.now());
            const gaugeY = healthBarY - 22;
            ctx[2].fillStyle = "rgba(16, 25, 36, 0.92)";
            ctx[2].fillRect(startX, gaugeY, totalWidth, 13);
            ctx[2].fillStyle = overheatedFor > 0 ? "#ff4658" : laser.firing ? "#70e9ff" : "#478edb";
            ctx[2].fillRect(startX + 2, gaugeY + 2, Math.max(0, (totalWidth - 4) * gauge / 100), 9);
            ctx[2].strokeStyle = overheatedFor > 0 ? "#ff9da8" : "rgba(190, 235, 255, 0.9)";
            ctx[2].lineWidth = 1.5;
            ctx[2].strokeRect(startX, gaugeY, totalWidth, 13);
            const laserLabel = overheatedFor > 0
                ? `LASER OVERHEATED ${(overheatedFor / 1000).toFixed(1)}s`
                : `LASER ${Math.round(gauge)}%`;
            drawText(laserLabel, startX + totalWidth / 2, gaugeY + 6.5, 10, color.guiwhite, "center", true, 1, 1, ctx[2]);
        }
        if (global.craftrasPlacement?.active && global.craftrasPlacement.adminLayerTools) {
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
            if (selected && item?.id === "the_great_friend") {
                const cooldownEndsAt = Number(global.craftrasFriendSkill?.cooldownEndsAt) || 0;
                const cooldownMs = Math.max(0, cooldownEndsAt - Date.now());
                const cooldownLabel = cooldownMs > 0
                    ? `T ${Math.ceil(cooldownMs / 100) / 10}s`
                    : "T READY";
                const labelHeight = Math.max(13, slotSize * 0.28);
                ctx[2].fillStyle = "rgba(8, 12, 18, 0.78)";
                ctx[2].fillRect(x + 2, y + slotSize - labelHeight - 2, slotSize - 4, labelHeight);
                drawText(
                    cooldownLabel,
                    x + slotSize / 2,
                    y + slotSize - labelHeight / 2 - 2,
                    Math.max(8, slotSize * 0.18),
                    cooldownMs > 0 ? "#ffd45e" : "#6de5ff",
                    "center",
                    true,
                    1,
                    1,
                    ctx[2],
                );
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
        if (["parry_tool", "parry_tool_op", "magic_book"].includes(offhand?.id)) {
            const parry = global.craftrasParry || {};
            const reduction = Math.max(0, Math.min(100, Number(parry.reduction) || 0));
            const counter = Math.max(0, Math.min(1000, Number(parry.counter) || 0));
            const magicBook = global.craftrasMagicBook || {};
            const gaugeWidth = Math.max(96, slotSize * 2.2);
            const gaugeHeight = 10;
            const gaugeX = Math.max(
                8,
                Math.min(global.screenWidth - gaugeWidth - 8, offhandX + slotSize + 12),
            );
            const drawGauge = (gaugeY, ratio, fill, label) => {
                ctx[2].fillStyle = "rgba(24, 27, 32, 0.92)";
                ctx[2].fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
                ctx[2].fillStyle = fill;
                ctx[2].fillRect(gaugeX + 2, gaugeY + 2, Math.max(0, (gaugeWidth - 4) * ratio), gaugeHeight - 4);
                ctx[2].strokeStyle = "rgba(225, 230, 238, 0.78)";
                ctx[2].lineWidth = 1;
                ctx[2].strokeRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
                drawText(label, gaugeX + gaugeWidth / 2, gaugeY + gaugeHeight / 2, 9, color.guiwhite, "center", true, 1, 1, ctx[2]);
            };
            drawGauge(
                y - 30,
                reduction / 100,
                offhand.id === "parry_tool_op" ? `hsl(${Math.floor(Date.now() / 8) % 360} 85% 62%)` : "#63bfff",
                offhand.id === "parry_tool_op" ? "AUTO PARRY" : `Parry ${Math.round(reduction)}%`,
            );
            if (offhand.id === "magic_book") {
                const magic = Math.max(0, Math.min(5000, Number(magicBook.gauge) || 0));
                drawGauge(
                    y - 17,
                    magic / 5000,
                    magic >= 1500 ? "#d856ff" : "#8656db",
                    `Magic ${Math.round(magic)}%`,
                );
                const now = Date.now();
                const slashLeft = Math.max(0, (magicBook.slashCooldownUntil || 0) - now);
                const barrageLeft = Math.max(0, (magicBook.barrageCooldownUntil || 0) - now);
                const charge = Math.max(0, Math.min(100, Number(magicBook.charge) || 0));
                const status = charge > 0
                    ? `Charge ${Math.round(charge)}%`
                    : `Slash ${slashLeft > 0 ? (slashLeft / 1000).toFixed(1) + "s" : "READY"}  R ${barrageLeft > 0 ? (barrageLeft / 1000).toFixed(1) + "s" : "READY"}`;
                drawText(status, gaugeX + gaugeWidth / 2, y - 42, 9, "#f0d9ff", "center", true, 1, 1, ctx[2]);
            } else {
                drawGauge(y - 17, counter / 1000, counter >= 500 ? "#ffd84d" : "#8f78ff", `Counter ${Math.round(counter)}%`);
            }
        }
        ctx[2].restore();
    }

    function drawCraftrasParryFlash() {
        const parry = global.craftrasParry;
        if (!parry?.flashStartedAt) return;
        const duration = Math.max(1, parry.flashDuration || 200);
        const progress = (Date.now() - parry.flashStartedAt) / duration;
        if (progress >= 1) {
            parry.flashStartedAt = 0;
            return;
        }
        ctx[2].save();
        ctx[2].fillStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - progress).toFixed(3)})`;
        ctx[2].fillRect(0, 0, global.screenWidth, global.screenHeight);
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
            const buffIds = new Set(["health_buff", "strength_buff", "health_buff_2", "strength_buff_2", "haste_buff_2", "world1_blessing"]);
            ctx[2].strokeStyle = debuff.id === "poison" ? "#70c95a" : buffIds.has(debuff.id) ? "#80dfff" : "#d94b4b";
            ctx[2].lineWidth = 2;
            ctx[2].fillRect(left, y, iconSize, iconSize);
            if (image?.complete && image.naturalWidth) {
                ctx[2].save();
                if (debuff.id === "world2_curse") ctx[2].filter = "brightness(0)";
                ctx[2].drawImage(image, left + 2, y + 2, iconSize - 4, iconSize - 4);
                ctx[2].restore();
            }
            ctx[2].strokeRect(left, y, iconSize, iconSize);

            const duration = debuff.remaining < 0 ? "--" : `${debuff.remaining}s`;
            drawText(duration, left + iconSize - 4, y + iconSize - 8, 12, color.guiwhite, "right", true, 1, 1, ctx[2]);
            if (global.mouse.x >= left && global.mouse.x <= left + iconSize && global.mouse.y >= y && global.mouse.y <= y + iconSize) {
                hovered = debuff;
                hoveredY = y;
            }
        }

        if (hovered) {
            const width = Math.max(160, Math.min(320, global.screenWidth - 20));
            const descriptionSize = 12;
            const descriptionFontSize = descriptionSize + config.graphical.fontSizeBoost;
            ctx[2].font = `bold ${descriptionFontSize}px Ubuntu`;
            const descriptionLines = [];
            let currentLine = "";
            for (const word of String(hovered.description || "").split(/\s+/).filter(Boolean)) {
                const candidate = currentLine ? `${currentLine} ${word}` : word;
                if (!currentLine || ctx[2].measureText(candidate).width <= width - 24) {
                    currentLine = candidate;
                } else {
                    descriptionLines.push(currentLine);
                    currentLine = word;
                }
            }
            if (currentLine) descriptionLines.push(currentLine);
            if (!descriptionLines.length) descriptionLines.push("");
            const descriptionLineHeight = 16;
            const durationOffset = 49 + descriptionLines.length * descriptionLineHeight;
            const height = durationOffset + 18;
            const x = Math.max(10, Math.min(left + iconSize + 10, global.screenWidth - width - 10));
            const y = Math.max(10, Math.min(hoveredY, global.screenHeight - height - 10));
            ctx[2].fillStyle = "rgba(18, 20, 25, 0.94)";
            ctx[2].strokeStyle = "rgba(230, 234, 240, 0.72)";
            ctx[2].lineWidth = 1.5;
            ctx[2].fillRect(x, y, width, height);
            ctx[2].strokeRect(x, y, width, height);
            drawText(hovered.name, x + 12, y + 18, 15, color.guiwhite, "left", true, 1, 1, ctx[2]);
            for (let index = 0; index < descriptionLines.length; index++) {
                drawText(descriptionLines[index], x + 12, y + 43 + index * descriptionLineHeight, descriptionSize, "#d6d9df", "left", false, 1, 1, ctx[2]);
            }
            const duration = hovered.remaining < 0 ? "Duration: Infinite" : `Time remaining: ${hovered.remaining}s`;
            drawText(duration, x + 12, y + durationOffset, 11, "#aeb5c0", "left", false, 1, 1, ctx[2]);
        }
        ctx[2].restore();
    }

    function drawCraftrasInventoryItem(item, x, y, size) {
        if (!item) return;
        registerCraftrasCustomTool(item);
        if (drawCraftrasToolIcon(ctx[2], item.id, x, y, size)) {
            // Tool rendered above.
        } else if (drawCraftrasMobHeadIcon(ctx[2], item.id, x, y, size)) {
            // Mob head rendered above.
        } else if (craftrasOreItemBlockCodes[item.id]) {
            ctx[2].save();
            const blockX = x + size * 0.16;
            const blockY = y + size * 0.16;
            const blockSize = size * 0.68;
            ctx[2].fillStyle = "#96999f";
            ctx[2].strokeStyle = "#676a70";
            ctx[2].lineWidth = Math.max(1, size * 0.035);
            ctx[2].fillRect(blockX, blockY, blockSize, blockSize);
            ctx[2].strokeRect(blockX, blockY, blockSize, blockSize);
            const oreImage = craftrasOreOverlayImages[craftrasOreItemBlockCodes[item.id]];
            if (oreImage?.complete && oreImage.naturalWidth) {
                ctx[2].imageSmoothingEnabled = false;
                ctx[2].drawImage(oreImage, blockX, blockY, blockSize, blockSize);
            }
            ctx[2].restore();
        } else if (craftrasItemImages[item.id]?.complete && craftrasItemImages[item.id].naturalWidth) {
            ctx[2].save();
            if (craftrasFlatItemIds.has(item.id)) {
                ctx[2].imageSmoothingEnabled = true;
                if (item.id === "parry_tool_op") {
                    ctx[2].filter = `hue-rotate(${Math.floor(Date.now() / 8) % 360}deg) saturate(2.6) brightness(1.2)`;
                }
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
                challenge_start_block: "#29d6b4",
                world2_challenge_block: "#596dff",
                challenge_spawn_block: "#73e67b",
                transparent_block: "#419cff",
                route_marker_block: "#258dff",
                creative_24h: "#f3d34a",
                creative_1h: "#7bdff2",
                king_zombie_summon_ticket: "#7ed957",
                queen_spider_summon_ticket: "#b06cff",
                annihilator_summon_ticket: "#ff7048",
                sword_guy_summon_ticket: "#f1f1f1",
                bandage: "#d8cab2",
                burnt_bone: "#5d4032",
                fire_orb: "#ff532c",
                fire_soul: "#ff6a1f",
                worm_shell: "#8d5f3d",
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

    const craftrasRecipeBookFallbackRecipes = [
        {
            name: "Zombie Crown",
            note: "Blacksmith Lv 40",
            unlock: "zombie_crown",
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
            unlock: "knight_shield",
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
            unlock: "venom_sword",
            pattern: [
                ["spider_venom", "spider_venom", "spider_venom"],
                ["string", "diamond_sword", "string"],
                ["spider_leg", "spider_leg", "spider_leg"],
            ],
            output: "venom_sword",
        },
        {
            name: "Cleric Staff",
            note: "Blacksmith Lv 30",
            unlock: "cleric_staff",
            pattern: [
                [null, "cleric_staff_head", null],
                [null, "cleric_staff_body", null],
                [null, "cleric_staff_handle", null],
            ],
            output: "cleric_staff",
        },
        {
            name: "Bone Bomb",
            note: "Blacksmith Lv 30",
            unlock: "bone_bomb",
            pattern: [
                [null, "string", null],
                [null, "gunpowder", null],
                [null, "bone", null],
            ],
            output: "bone_bomb",
            outputCount: 2,
        },
        {
            name: "Steel Rod",
            note: "Crafting Table",
            pattern: [
                ["iron_ingot", "iron_ingot", "iron_ingot"],
                ["iron_ingot", "stick", "iron_ingot"],
                ["iron_ingot", "iron_ingot", "iron_ingot"],
            ],
            output: "steel_rod",
        },
        {
            name: "Hardened Bone",
            note: "Shapeless",
            pattern: [
                ["iron_block", "bone", null],
                [null, null, null],
                [null, null, null],
            ],
            output: "hardened_bone",
        },
        {
            name: "Horn Sword",
            note: "Blacksmith Lv 100",
            unlock: "horn_sword",
            pattern: [
                [null, "horn", null],
                [null, "horn", null],
                [null, "steel_rod", null],
            ],
            output: "horn_sword",
        },
        {
            name: "Sturdy Helmet",
            note: "Blacksmith Lv 80",
            unlock: "sturdy_helmet",
            pattern: [
                ["worm_shell", "worm_shell", "worm_shell"],
                ["worm_shell", "iron_block", "worm_shell"],
                [null, null, null],
            ],
            output: "sturdy_helmet",
        },
        {
            name: "Zombie Wizard's Staff",
            note: "Blacksmith Recipe",
            unlock: "zombie_wizard_staff",
            pattern: [
                [null, "magic_crystal", null],
                [null, "hardened_bone", null],
                [null, "stick", null],
            ],
            output: "zombie_wizard_staff",
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
        drawText("Recipe Book", x + 14, y + 23, 18, "#ffd84d", "left", true, 1, 1, ctx[2]);

        const searchX = x + 10;
        const searchY = y + 34;
        const searchWidth = width - 20;
        const searchHeight = 28;
        ctx[2].fillStyle = global.craftrasRecipeSearchActive ? "rgba(58, 64, 73, 0.98)" : "rgba(38, 43, 51, 0.96)";
        ctx[2].strokeStyle = global.craftrasRecipeSearchActive ? "#ffd84d" : "rgba(135, 145, 158, 0.75)";
        ctx[2].lineWidth = 1.5;
        optionsMenu_drawRoundedRect(searchX, searchY, searchWidth, searchHeight, 4);
        ctx[2].fill();
        ctx[2].stroke();
        const searchText = String(global.craftrasRecipeSearch || "");
        const caret = global.craftrasRecipeSearchActive && Math.floor(Date.now() / 500) % 2 ? "|" : "";
        drawText(searchText ? `${searchText}${caret}` : "Search recipes...", searchX + 9, searchY + searchHeight / 2 + 1, 12, searchText ? color.guiwhite : "#8d97a4", "left", false, 1, 1, ctx[2]);

        const cardX = x + 10;
        const cardWidth = width - 20;
        const slotSize = 22;
        const slotGap = 3;
        const unlockedRecipes = Array.isArray(global.craftrasUnlockedRecipes) ? global.craftrasUnlockedRecipes : [];
        const sourceRecipes = Array.isArray(global.craftrasRecipeBookRecipes) && global.craftrasRecipeBookRecipes.length
            ? global.craftrasRecipeBookRecipes
            : craftrasRecipeBookFallbackRecipes;
        const query = searchText.trim().toLowerCase();
        const visibleRecipes = sourceRecipes.filter(recipe => !query || `${recipe.name || ""} ${recipe.output || ""} ${recipe.search || ""}`.toLowerCase().includes(query));
        const cardHeight = 108;
        const cardGap = 8;
        const cardStartY = y + 70;
        const visibleCount = Math.max(1, Math.floor((height - 78) / (cardHeight + cardGap)));
        const maxScroll = Math.max(0, visibleRecipes.length - visibleCount);
        global.craftrasRecipeVisibleCount = visibleCount;
        global.craftrasRecipeMaxScroll = maxScroll;
        global.craftrasRecipeScroll = Math.max(0, Math.min(maxScroll, Math.floor(Number(global.craftrasRecipeScroll) || 0)));
        if (!visibleRecipes.length) {
            drawText("No matching recipes", x + width / 2, y + 110, 14, "#aeb6c2", "center", true, 1, 1, ctx[2]);
            return;
        }
        ctx[2].save();
        ctx[2].beginPath();
        ctx[2].rect(x + 2, cardStartY, width - 4, height - (cardStartY - y) - 5);
        ctx[2].clip();
        const firstRecipe = global.craftrasRecipeScroll;
        const lastRecipe = Math.min(visibleRecipes.length, firstRecipe + visibleCount + 1);
        for (let recipeIndex = firstRecipe; recipeIndex < lastRecipe; recipeIndex++) {
            ctx[2].save();
            const recipe = visibleRecipes[recipeIndex];
            const cardY = cardStartY + (recipeIndex - firstRecipe) * (cardHeight + cardGap);
            const locked = !!recipe.unlock && !unlockedRecipes.includes(recipe.unlock);
            ctx[2].fillStyle = "rgba(38, 43, 51, 0.96)";
            ctx[2].strokeStyle = locked ? "rgba(174, 96, 96, 0.8)" : "rgba(135, 145, 158, 0.65)";
            ctx[2].lineWidth = 1.25;
            optionsMenu_drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 5);
            ctx[2].fill();
            ctx[2].stroke();
            drawText(recipe.name, cardX + 10, cardY + 20, 14, color.guiwhite, "left", true, 1, 1, ctx[2]);
            drawText(locked ? `LOCKED - ${recipe.note || "Recipe"}` : recipe.note || "Crafting", cardX + cardWidth - 10, cardY + 20, 9, locked ? "#ff8d8d" : "#ffd84d", "right", true, 1, 1, ctx[2]);

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
            if (recipe.outputCount > 1) {
                drawText(String(recipe.outputCount), outputX + outputSize - 4, outputY + outputSize - 5, 12, color.guiwhite, "right", true, 1, 1, ctx[2]);
            }
            ctx[2].restore();
        }
        ctx[2].restore();
        if (maxScroll > 0) drawText(`${firstRecipe + 1}-${Math.min(visibleRecipes.length, firstRecipe + visibleCount)} / ${visibleRecipes.length}`, x + width - 10, y + height - 8, 9, "#aeb6c2", "right", false, 1, 1, ctx[2]);
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

    function drawCraftrasRecipeUnlockNotification() {
        const queue = global.craftrasRecipeUnlockQueue;
        if (!Array.isArray(queue) || !queue.length || global.screenshotGuiHidden) return;
        const entry = queue[0];
        if (!entry.startedAt) entry.startedAt = Date.now();
        const items = Array.isArray(entry.items) ? entry.items : [];
        if (!items.length) {
            queue.shift();
            return;
        }
        const enterDuration = 320;
        const holdDuration = items.length * 1000;
        const exitDuration = 360;
        const elapsed = Date.now() - entry.startedAt;
        const totalDuration = enterDuration + holdDuration + exitDuration;
        if (elapsed >= totalDuration) {
            queue.shift();
            return;
        }
        const panelWidth = 230;
        const panelHeight = 106;
        let slide = 0;
        if (elapsed < enterDuration) slide = 1 - Math.min(1, elapsed / enterDuration);
        else if (elapsed > enterDuration + holdDuration) slide = Math.min(1, (elapsed - enterDuration - holdDuration) / exitDuration);
        const x = global.screenWidth - panelWidth - 18 + slide * (panelWidth + 30);
        const y = Math.max(86, global.screenHeight * 0.2);
        const itemIndex = Math.min(items.length - 1, Math.max(0, Math.floor((elapsed - enterDuration) / 1000)));
        const item = items[itemIndex];
        ctx[2].save();
        ctx[2].fillStyle = "rgba(20, 25, 31, 0.96)";
        ctx[2].strokeStyle = "#ffd84d";
        ctx[2].lineWidth = 2;
        optionsMenu_drawRoundedRect(x, y, panelWidth, panelHeight, 6);
        ctx[2].fill();
        ctx[2].stroke();
        drawText("RECIPE UNLOCK", x + panelWidth / 2, y + 19, 16, "#ffd84d", "center", true, 1, 1, ctx[2]);
        drawCraftrasInventoryItem({ ...item, count: 1 }, x + 18, y + 34, 54);
        drawText(item.name || item.id, x + 82, y + 59, 14, color.guiwhite, "left", true, 1, 1, ctx[2]);
        drawText(`${itemIndex + 1} / ${items.length}`, x + panelWidth - 12, y + 88, 10, "#aeb6c2", "right", false, 1, 1, ctx[2]);
        ctx[2].restore();
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
        const size = radius * (helmet?.id === "sturdy_helmet"
            ? 3.382
            : helmet?.id === "great_iron_helmet" || helmet?.id === "great_diamond_helmet"
            ? 4.3
            : helmet?.id === "ruby_helmet" || helmet?.id === "sapphire_helmet"
            ? 6.15
            : helmet?.id === "blesser_hat" ? 4.4
            : helmet?.id === "cleric_hat" || helmet?.id === "pope_hat" ? 4.0
            : helmet?.id === "jane_hat" ? 4.1
            : helmet?.id === "merchant_hat" || helmet?.id === "monster_merchant_hat" ? 3.6 : 3.075);
        const helmetLift = helmet?.id === "cleric_hat"
            ? 0.38
            : helmet?.id === "pope_hat"
            ? 1.46
            : helmet?.id === "blesser_hat" ? 0.86
            : helmet?.id === "jane_hat" ? 0.74
            : helmet?.id === "merchant_hat" || helmet?.id === "monster_merchant_hat" ? 0.74
            : helmet?.id === "sturdy_helmet" ? 0.5
            : helmet?.id === "great_iron_helmet" || helmet?.id === "great_diamond_helmet" ? 0.34
            : helmet?.id === "ruby_helmet" || helmet?.id === "sapphire_helmet" ? 0.45
            : helmet?.id === "zombie_crown" ? 0.73 : 0.16;
        drawCraftrasHelmetImage(ctx[2], helmetImage, helmet?.id, -size / 2, -size / 2 - radius * helmetLift, size);
        ctx[2].restore();
    }

    function drawCraftrasInventory() {
        const inventory = global.craftrasInventory;
        if (!inventory?.active || !inventory.open || global.died || global.craftrasSpectator || global.disconnected) return;

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
            const visibleRows = Math.max(1, Math.floor((panelHeight - 60) / (creativeSlotSize + creativeGap)));
            const totalRows = Math.ceil((creative.items?.length || 0) / columns);
            const maxScrollRow = Math.max(0, totalRows - visibleRows);
            const scrollRow = Math.max(0, Math.min(maxScrollRow, Math.floor(Number(creative.scrollRow) || 0)));
            creative.scrollRow = scrollRow;
            ctx[2].fillStyle = "rgba(19, 23, 28, 0.94)";
            ctx[2].strokeStyle = "rgba(224, 229, 237, 0.8)";
            ctx[2].lineWidth = 2;
            optionsMenu_drawRoundedRect(creativeX, panelY, creativeWidth, panelHeight, 7);
            ctx[2].fill();
            ctx[2].stroke();
            drawText("Creative", creativeX + 12, panelY + 24, 20, "#ffd84d", "left", true, 1, 1, ctx[2]);
            const creativeStartX = creativeX + 12;
            const creativeStartY = panelY + 48;
            ctx[2].save();
            ctx[2].beginPath();
            ctx[2].rect(creativeX + 8, creativeStartY - 3, creativeWidth - 16, panelHeight - 56);
            ctx[2].clip();
            for (let row = scrollRow; row < scrollRow + visibleRows; row++) {
                for (let column = 0; column < columns; column++) {
                    const index = row * columns + column;
                    if (index >= creative.items.length) break;
                    const x = creativeStartX + column * (creativeSlotSize + creativeGap);
                    const y = creativeStartY + (row - scrollRow) * (creativeSlotSize + creativeGap);
                    ctx[2].fillStyle = "rgba(53, 59, 68, 0.9)";
                    ctx[2].strokeStyle = "rgba(175, 184, 196, 0.7)";
                    ctx[2].lineWidth = 1.25;
                    ctx[2].fillRect(x, y, creativeSlotSize, creativeSlotSize);
                    ctx[2].strokeRect(x, y, creativeSlotSize, creativeSlotSize);
                    drawCraftrasInventoryItem({ ...creative.items[index], count: 1 }, x, y, creativeSlotSize);
                    if (global.mouse.x >= x && global.mouse.x <= x + creativeSlotSize && global.mouse.y >= y && global.mouse.y <= y + creativeSlotSize) hovered = creative.items[index];
                }
            }
            ctx[2].restore();
            if (maxScrollRow > 0) {
                const trackX = creativeX + creativeWidth - 8;
                const trackY = creativeStartY;
                const trackHeight = panelHeight - 64;
                const thumbHeight = Math.max(26, trackHeight * visibleRows / Math.max(visibleRows, totalRows));
                const thumbY = trackY + (trackHeight - thumbHeight) * (scrollRow / maxScrollRow);
                ctx[2].fillStyle = "rgba(255, 255, 255, 0.13)";
                ctx[2].fillRect(trackX, trackY, 3, trackHeight);
                ctx[2].fillStyle = "rgba(255, 216, 77, 0.8)";
                ctx[2].fillRect(trackX - 1, thumbY, 5, thumbHeight);
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
        const cleric = global.craftrasCleric ?? { open: false, mode: "token", rebirths: 0, playerLevel: 0, levelCap: 100, canRebirth: false, nextLevelCap: 0, healthBonus: 0, requirements: [], slots: Array(4).fill(null), canToken: false };
        const merchant = global.craftrasMerchant ?? { open: false, points: 0, refreshIn: 0, offers: [], sellSlot: null };
        const blesser = global.craftrasBlesser ?? { open: false, points: 0, offers: [], kind: "blesser" };
        const furnace = global.craftrasFurnace ?? { open: false, slots: [null, null, null], progress: 0 };
        const chest = global.craftrasChest ?? { open: false, slots: Array(27).fill(null) };
        const clericTitle = cleric.mode === "pope" ? "Pope" : "Cleric";
        const merchantTitle = merchant.kind === "monster" ? "Monster Merchant" : merchant.kind === "miner" ? "Miner" : "Merchant";
        const blesserTitle = blesser.kind === "healer" ? "Healer" : "Blesser";
        drawText(chest.open ? "Chest" : furnace.open ? "Furnace" : blesser.open ? blesserTitle : merchant.open ? merchantTitle : cleric.open ? clericTitle : blacksmith.open ? "Blacksmith" : crafting.mode === 3 ? "Crafting Table" : "Inventory", panelX + 18, panelY + 24, 20, color.guiwhite, "left", true, 1, 1, ctx[2]);
        drawText("E / Esc", panelX + panelWidth - 18, panelY + 24, 11, "#aeb6c2", "right", false, 1, 1, ctx[2]);

        const startX = panelX + 18;
        const mainY = panelY + 205;
        if (blesser.open) {
            const offers = Array.isArray(blesser.offers) ? blesser.offers : [];
            const cardW = 142, cardH = 54, cardGap = 10;
            const cardsX = panelX + 32, cardsY = panelY + 54;
            drawText(`Points ${util.formatLargeNumber(Math.round(blesser.points || 0))}`, panelX + panelWidth - 24, panelY + 38, 10, "#aeb6c2", "right", false, 1, 1, ctx[2]);
            for (let index = 0; index < 6; index++) {
                const offer = offers[index];
                const column = index % 3;
                const row = Math.floor(index / 3);
                const x = cardsX + column * (cardW + cardGap);
                const y = cardsY + row * (cardH + cardGap);
                const cooldownIn = Math.max(0, Math.ceil(Number(offer?.cooldownIn) || 0));
                const affordable = offer && !cooldownIn && (offer.free || (blesser.points || 0) >= offer.price);
                ctx[2].fillStyle = affordable ? "rgba(55, 62, 45, 0.95)" : cooldownIn ? "rgba(32, 35, 41, 0.96)" : "rgba(42, 47, 55, 0.95)";
                ctx[2].strokeStyle = cooldownIn ? "rgba(120, 128, 138, 0.65)" : offer?.free ? "#80dfff" : affordable ? "#ffd84d" : "rgba(175, 184, 196, 0.65)";
                ctx[2].lineWidth = affordable ? 2 : 1.2;
                ctx[2].fillRect(x, y, cardW, cardH);
                ctx[2].strokeRect(x, y, cardW, cardH);
                if (offer) {
                    const drawId = offer.kind === "buff" ? offer.id : offer.id;
                    const icon = offer.kind === "buff"
                        ? craftrasDebuffImages[offer.id]
                        : craftrasItemImages[drawId];
                    if (icon?.complete && icon.naturalWidth) ctx[2].drawImage(icon, x + 6, y + 9, 34, 34);
                    else drawCraftrasInventoryItem({ id: drawId, name: offer.name, count: offer.count || 1 }, x + 5, y + 8, 36);
                    drawText(offer.name, x + 46, y + 17, 9, "#dfe8ff", "left", true, 1, 1, ctx[2]);
                    const cooldownText = cooldownIn >= 60 ? `${Math.ceil(cooldownIn / 60)}m` : `${cooldownIn}s`;
                    const priceText = cooldownIn ? `CD ${cooldownText}` : offer.free ? "Free" : `${offer.price}`;
                    drawText(priceText, x + 46, y + 36, 11, cooldownIn ? "#aeb6c2" : offer.free ? "#80dfff" : affordable ? "#ffd84d" : "#f0a0a0", "left", true, 1, 1, ctx[2]);
                    if (offer.kind === "buff") drawText("15m", x + cardW - 8, y + 36, 9, "#aeb6c2", "right", false, 1, 1, ctx[2]);
                    if (global.mouse.x >= x && global.mouse.x <= x + cardW && global.mouse.y >= y && global.mouse.y <= y + cardH) {
                        const cooldown = cooldownIn ? `, cooldown ${cooldownIn}s` : offer.nextFreeIn ? `, free in ${offer.nextFreeIn}s` : "";
                        hovered = { id: drawId, name: `${offer.name} (${priceText}${cooldown})`, count: offer.count || 1 };
                    }
                }
            }
        } else if (cleric.open) {
            const boxX = panelX + 42;
            const boxY = panelY + 48;
            const boxW = panelWidth - 84;
            const boxH = 132;
            const buttonX = panelX + 156;
            const buttonY = panelY + 132;
            const buttonW = 190;
            const buttonH = 38;
            ctx[2].fillStyle = "rgba(36, 40, 47, 0.95)";
            ctx[2].strokeStyle = "rgba(175, 184, 196, 0.7)";
            ctx[2].lineWidth = 1.5;
            ctx[2].fillRect(boxX, boxY, boxW, boxH);
            ctx[2].strokeRect(boxX, boxY, boxW, boxH);
            if (cleric.mode === "token") {
                const slotSize = 46;
                const gap = 12;
                const slotY = panelY + 75;
                const slotX = panelX + 66;
                const outputX = panelX + 340;
                const requirements = [
                    { id: "knight_shield", name: "Knight's Shield" },
                    { id: "zombie_crown", name: "King's Crown" },
                    { id: "venom_sword", name: "Venom Sword" },
                    { id: "cleric_staff", name: "Cleric Staff" },
                ];
                const slots = Array.isArray(cleric.slots) ? cleric.slots : [];
                drawText("World 1 Badge", panelX + panelWidth / 2, panelY + 67, 17, "#dfe8ff", "center", true, 1, 1, ctx[2]);
                for (let index = 0; index < 4; index++) {
                    const x = slotX + index * (slotSize + gap);
                    const slot = slots[index] || null;
                    const ok = slot?.id === requirements[index].id;
                    ctx[2].fillStyle = "rgba(53, 59, 68, 0.9)";
                    ctx[2].strokeStyle = ok ? "#ffd84d" : "rgba(175, 184, 196, 0.7)";
                    ctx[2].lineWidth = ok ? 2.5 : 1.5;
                    ctx[2].fillRect(x, slotY, slotSize, slotSize);
                    ctx[2].strokeRect(x, slotY, slotSize, slotSize);
                    if (!slot) {
                        ctx[2].save();
                        ctx[2].globalAlpha *= 0.32;
                        drawCraftrasInventoryItem({ ...requirements[index], count: 1 }, x, slotY, slotSize);
                        ctx[2].restore();
                    } else drawCraftrasInventoryItem(slot, x, slotY, slotSize);
                    if (global.mouse.x >= x && global.mouse.x <= x + slotSize && global.mouse.y >= slotY && global.mouse.y <= slotY + slotSize) hovered = slot || requirements[index];
                }
                drawText(">", panelX + 310, slotY + 28, 30, "#c8ced8", "center", true, 1, 1, ctx[2]);
                ctx[2].fillStyle = "rgba(70, 76, 86, 0.95)";
                ctx[2].strokeStyle = cleric.canToken ? "#ffd84d" : "rgba(175, 184, 196, 0.7)";
                ctx[2].lineWidth = cleric.canToken ? 2.5 : 1.5;
                ctx[2].fillRect(outputX, slotY, slotSize, slotSize);
                ctx[2].strokeRect(outputX, slotY, slotSize, slotSize);
                drawCraftrasInventoryItem({ id: "world1_badge", name: "World 1 Badge", count: 1 }, outputX, slotY, slotSize);
                if (global.mouse.x >= outputX && global.mouse.x <= outputX + slotSize && global.mouse.y >= slotY && global.mouse.y <= slotY + slotSize) hovered = { id: "world1_badge", name: "World 1 Badge" };

                ctx[2].fillStyle = cleric.canToken ? "rgba(85, 94, 42, 0.95)" : "rgba(68, 52, 52, 0.95)";
                ctx[2].strokeStyle = cleric.canToken ? "#ffd84d" : "#d07070";
                ctx[2].lineWidth = 1.5;
                ctx[2].fillRect(buttonX, buttonY, buttonW, buttonH);
                ctx[2].strokeRect(buttonX, buttonY, buttonW, buttonH);
                drawText(cleric.canToken ? "Create Badge" : "Need Items", buttonX + buttonW / 2, buttonY + 20, 15, color.guiwhite, "center", true, 1, 1, ctx[2]);
            } else {
                const canRebirth = !!cleric.canRebirth;
                drawText(`Rebirth ${cleric.rebirths}`, panelX + panelWidth / 2, panelY + 73, 20, "#dfe8ff", "center", true, 1, 1, ctx[2]);
                drawText(`Level ${cleric.playerLevel}`, panelX + panelWidth / 2, panelY + 98, 15, canRebirth ? "#a9f08a" : "#f0c36d", "center", false, 1, 1, ctx[2]);
                drawText(`Rebirth needs Level ${cleric.levelCap}   HP +${Math.round(cleric.healthBonus || 0)}`, panelX + panelWidth / 2, panelY + 118, 12, "#c8ced8", "center", false, 1, 1, ctx[2]);
                const requirements = Array.isArray(cleric.requirements) ? cleric.requirements : [];
                for (let index = 0; index < requirements.length; index++) {
                    const requirement = requirements[index];
                    drawText(`${requirement.name}: ${requirement.count || 0}/${requirement.required || 1}`, boxX + 16, panelY + 126 + index * 14, 11, (requirement.count || 0) >= (requirement.required || 1) ? "#a9f08a" : "#f0c36d", "left", false, 1, 1, ctx[2]);
                }
                const popeButtonY = panelY + 142;
                ctx[2].fillStyle = canRebirth ? "rgba(85, 94, 42, 0.95)" : "rgba(68, 52, 52, 0.95)";
                ctx[2].strokeStyle = canRebirth ? "#ffd84d" : "#d07070";
                ctx[2].lineWidth = 1.5;
                ctx[2].fillRect(buttonX, popeButtonY, buttonW, buttonH);
                ctx[2].strokeRect(buttonX, popeButtonY, buttonW, buttonH);
                const rebirthText = cleric.rebirths >= 1 ? "Currently under development" : canRebirth ? "Rebirth" : `Need Lv ${cleric.levelCap}`;
                drawText(rebirthText, buttonX + buttonW / 2, popeButtonY + 20, cleric.rebirths >= 1 ? 12 : 15, color.guiwhite, "center", true, 1, 1, ctx[2]);
            }
        } else if (merchant.open) {
            const offers = Array.isArray(merchant.offers) ? merchant.offers : [];
            const cardW = 104, cardH = 48, cardGap = 8;
            const cardsX = panelX + 24, cardsY = panelY + 48;
            const refreshElapsed = Math.max(0, (Date.now() - (merchant.refreshReceivedAt || Date.now())) / 1000);
            const refreshLeft = Math.max(0, Math.ceil((merchant.refreshIn || 0) - refreshElapsed));
            drawText(`Refresh ${refreshLeft}s`, panelX + panelWidth - 24, panelY + 38, 10, "#aeb6c2", "right", false, 1, 1, ctx[2]);
            for (let index = 0; index < 8; index++) {
                const offer = offers[index];
                const column = index % 4;
                const row = Math.floor(index / 4);
                const x = cardsX + column * (cardW + cardGap);
                const y = cardsY + row * (cardH + cardGap);
                const stock = offer ? Math.max(0, Number(offer.stock ?? offer.count) || 0) : 0;
                const affordable = offer && stock > 0 && (merchant.points || 0) >= offer.price;
                ctx[2].fillStyle = affordable ? "rgba(55, 62, 45, 0.95)" : "rgba(42, 47, 55, 0.95)";
                ctx[2].strokeStyle = affordable ? "#ffd84d" : "rgba(175, 184, 196, 0.65)";
                ctx[2].lineWidth = affordable ? 2 : 1.2;
                ctx[2].fillRect(x, y, cardW, cardH);
                ctx[2].strokeRect(x, y, cardW, cardH);
                if (offer) {
                    drawCraftrasInventoryItem({ id: offer.id, name: offer.name, count: offer.count }, x + 4, y + 7, 32);
                    drawText(`${offer.count || 1}x`, x + 40, y + 16, 9, "#dfe8ff", "left", true, 1, 1, ctx[2]);
                    drawText(`${offer.price}`, x + 40, y + 35, 10, affordable ? "#ffd84d" : "#f0a0a0", "left", true, 1, 1, ctx[2]);
                    drawText(`${stock}/${offer.maxStock || stock}`, x + cardW - 6, y + 16, 8, stock > 0 ? "#aeb6c2" : "#f0a0a0", "right", true, 1, 1, ctx[2]);
                    if (global.mouse.x >= x && global.mouse.x <= x + cardW && global.mouse.y >= y && global.mouse.y <= y + cardH) hovered = { id: offer.id, name: `${offer.name} (${offer.price} points, stock ${stock}/${offer.maxStock || stock})`, count: offer.count };
                }
            }
            const sellX = panelX + 118, sellY = panelY + 160, sellSize = 42;
            const sellButtonX = sellX + 58, sellButtonY = sellY + 4, sellButtonW = 128, sellButtonH = 34;
            ctx[2].fillStyle = "rgba(53, 59, 68, 0.9)";
            ctx[2].strokeStyle = merchant.sellSlot ? "#ffd84d" : "rgba(175, 184, 196, 0.7)";
            ctx[2].lineWidth = merchant.sellSlot ? 2.5 : 1.5;
            ctx[2].fillRect(sellX, sellY, sellSize, sellSize);
            ctx[2].strokeRect(sellX, sellY, sellSize, sellSize);
            drawCraftrasInventoryItem(merchant.sellSlot, sellX, sellY, sellSize);
            if (!merchant.sellSlot) drawText("$", sellX + sellSize / 2 + 3, sellY + 23, 18, "#7f8996", "center", true, 1, 1, ctx[2]);
            const sellLabel = merchant.kind === "monster" ? "Sell Loot" : merchant.kind === "miner" ? "Sell Ores" : "Sell Items";
            if (global.mouse.x >= sellX && global.mouse.x <= sellX + sellSize && global.mouse.y >= sellY && global.mouse.y <= sellY + sellSize) hovered = merchant.sellSlot || { id: "merchant_sell", name: sellLabel };
            ctx[2].fillStyle = merchant.sellSlot ? "rgba(85, 94, 42, 0.95)" : "rgba(68, 52, 52, 0.95)";
            ctx[2].strokeStyle = merchant.sellSlot ? "#ffd84d" : "#d07070";
            ctx[2].lineWidth = 1.5;
            ctx[2].fillRect(sellButtonX, sellButtonY, sellButtonW, sellButtonH);
            ctx[2].strokeRect(sellButtonX, sellButtonY, sellButtonW, sellButtonH);
            drawText(sellLabel, sellButtonX + sellButtonW / 2, sellButtonY + 18, 13, color.guiwhite, "center", true, 1, 1, ctx[2]);
        } else if (blacksmith.open) {
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
            drawText(offer ? `Level ${offer.cost} / You ${currentLevel}` : "Put a boss scroll", panelX + 316, panelY + 96, 12, offer && !enoughLevel ? "#f08a8a" : "#c8ced8", "left", false, 1, 1, ctx[2]);

            ctx[2].fillStyle = alreadyUnlocked ? "rgba(70, 76, 86, 0.95)" : enoughLevel ? "rgba(85, 94, 42, 0.95)" : "rgba(68, 52, 52, 0.95)";
            ctx[2].strokeStyle = alreadyUnlocked ? "#aeb6c2" : enoughLevel ? "#ffd84d" : "#d07070";
            ctx[2].lineWidth = 1.5;
            ctx[2].fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            ctx[2].strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
            drawText(alreadyUnlocked ? "Unlocked" : "Unlock", buttonX + buttonWidth / 2, buttonY + 18, 14, color.guiwhite, "center", true, 1, 1, ctx[2]);
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
            drawText(">", outputX - 35, outputY + 23, 26, "#c8ced8", "center", true, 1, 1, ctx[2]);
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
            drawText(">", outputX - 43, outputY + craftSlotSize / 2 + 1, 28, "#c8ced8", "center", true, 1, 1, ctx[2]);
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
        if (global.craftrasWorld?.active) {
            global.clickables?.optionsMenu?.switchButton?.hide?.();
            global.optionsMenu_Anim.isOpened = false;
            const economy = global.craftrasEconomy || { points: 0, tokens: 0, status: "Survival" };
            const statusColors = {
                Admin: "#4aa3ff",
                Creative: "#ffd84d",
                Spectator: "#b9a7ff",
                Survival: "#ffffff",
            };
            const left = 20;
            drawText(`Points ${util.formatLargeNumber(economy.points || 0)}`, left, 24, 22, "#ffd84d", "left", false, 1, 4);
            drawText(`Token ${util.formatLargeNumber(economy.tokens || 0)}`, left, 52, 22, "#ffd84d", "left", false, 1, 4);
            drawText(`Status ${economy.status || "Survival"}`, left, 78, 19, statusColors[economy.status] || "#ffffff", "left", false, 1, 4);
            return;
        }
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
            drawText("Coming soon", CONTENT_X, CONTENT_Y, 20, color.guiwhite, "left");
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
            drawText("Coming soon", CONTENT_X, CONTENT_Y, 20, color.guiwhite, "left");
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
        if (global.craftrasServerTransition?.active) {
            clearScreen("#000000", 1, ctx[2]);
            return;
        }
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
            drawCraftrasSpectatorUI();
            if (!global.screenshotGuiHidden) drawCraftrasBossHealthBar();
            if (isNaN(global.time)) drawResyncScreen();
            if (global.disconnected) {
                drawDisconnectedScreen();
            }
            if (global.dailyTankAd.renderUI) drawAdScreen();
            if (!global.screenshotGuiHidden) drawOptionsMenu(tick, 20, util.getScreenRatio());
            drawCraftrasChallengeBlueParry();
            drawCraftrasWorld2MagicWarning();
            drawCraftrasSwordGuy2Parry();
            drawCraftrasSwordGuy2Opening();
            drawCraftrasSwordGuy2DashCountdown();
            drawCraftrasJanePinkFlash();
            drawCraftrasJaneSkillFourCountdown();
            drawCraftrasParryFlash();
            drawCraftrasServerTransition();
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
