const { WORLD_SIZE } = require("../../craftras/worldGenerator.js");

module.exports = {
    mode: "ffa",
    gamemode_name_prefixes: ["Cave Builder"],
    do_not_override_room: false,
    room_setup: ["room_craftras"],
    map_tile_width: WORLD_SIZE,
    map_tile_height: WORLD_SIZE,
    bot_cap: 0,
    enable_food: false,
    enable_bosses: false,
    spawn_class: "slayer",
    craftras: true,
    craftras_village_builder: true,
    craftras_cave_builder: true,
    craftras_village_world_size: WORLD_SIZE,
};
