const { WORLD_SIZE, WORLD2_BLOCK_OFFSET } = require("../../craftras/worldGenerator.js");

module.exports = {
    mode: "ffa",
    gamemode_name_prefixes: ["Terrain Builder"],
    do_not_override_room: false,
    room_setup: ["room_craftras_worlds"],
    map_tile_width: WORLD_SIZE,
    map_tile_height: WORLD_SIZE,
    bot_cap: 0,
    enable_food: false,
    enable_bosses: false,
    spawn_class: "slayer",
    craftras: true,
    craftras_world2: true,
    craftras_village_builder: true,
    craftras_cave_builder: true,
    craftras_village_world_size: WORLD_SIZE,
    craftras_builder_spawn: {
        x: WORLD2_BLOCK_OFFSET - 300,
        y: 300,
    },
};
