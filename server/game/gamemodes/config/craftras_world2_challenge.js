const { WORLD_SIZE } = require("../../craftras/worldGenerator.js");
const WORLD2_CHALLENGE_SIZE = WORLD_SIZE * 3;

module.exports = {
    mode: "ffa",
    gamemode_name_prefixes: ["World 2 Challenge"],
    do_not_override_room: false,
    room_setup: ["room_craftras_world2_challenge"],
    map_tile_width: WORLD2_CHALLENGE_SIZE,
    map_tile_height: WORLD2_CHALLENGE_SIZE,
    bot_cap: 0,
    enable_food: false,
    enable_bosses: false,
    spawn_class: "slayer",
    craftras: true,
    craftras_world2_challenge_builder: true,
    craftras_world2_challenge_world_size: WORLD2_CHALLENGE_SIZE,
};
