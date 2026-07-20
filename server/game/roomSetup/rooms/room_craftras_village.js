module.exports = [[new Tile({
    COLOR: "white",
    IMAGE: "craftras-map-preview-grass-solid.png",
    NAME: "Village Builder",
    INIT: (tile, room) => room.spawnableDefault.push(tile),
})]];
