const emptyBorder = new Tile({
    COLOR: "white",
    NAME: "World Border",
});

const world1 = new Tile({
    COLOR: "white",
    IMAGE: "craftras-world1-custom.png",
    NAME: "World 1",
    INIT: (tile, room) => room.spawnableDefault.push(tile),
});

const world2 = new Tile({
    COLOR: "white",
    IMAGE: "craftras-world2-custom-v2.png",
    NAME: "World 2",
});

module.exports = [[emptyBorder, world1, world2]];
