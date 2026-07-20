const {weaponArray} = require('../facilitators.js')

// Rocks
Class.gravel = {
    PARENT: "genericObstacle",
    LABEL: "Gravel",
    SIZE: 16,
    SHAPE: -7
}
Class.stone = {
    PARENT: "genericObstacle",
    LABEL: "Stone",
    SIZE: 32,
    SHAPE: -7,
    VARIES_IN_SIZE: true
}
Class.rock = {
    PARENT: "genericObstacle",
    LABEL: "Rock",
    SIZE: 60,
    SHAPE: -9,
    VARIES_IN_SIZE: true
}
Class.craftrasTree = {
    PARENT: "rock",
    LABEL: "Tree",
    COLOR: "#c8a16a",
    DRAW_HEALTH: true,
    HEALTH_WITH_LEVEL: false,
    BODY: {
        HEALTH: 75,
        SHIELD: 0,
        REGEN: 0,
        DAMAGE: 0,
        PUSHABILITY: 0,
    },
    VARIES_IN_SIZE: false
}
Class.craftrasTreeLeaf = {
    PARENT: "rock",
    LABEL: "Leaves",
    COLOR: "#1f6f2d",
    ALPHA: 0.7,
    LAYER: -1,
    NO_COLLISIONS: true,
    HITS_OWN_TYPE: "never",
    BODY: {
        PUSHABILITY: 0,
        DAMAGE: 0,
        HEALTH: 10000,
        SHIELD: 10000,
        REGEN: 1000,
    },
    VARIES_IN_SIZE: false
}
Class.craftrasItemDrop = {
    PARENT: "genericEntity",
    LABEL: "Dropped Item",
    TYPE: "tank",
    DISPLAY_NAME: true,
    SIZE: 6,
    SHAPE: 0,
    COLOR: "veryLightGrey",
    MOTION_TYPE: "glide",
    FACING_TYPE: "spin",
    DRAW_HEALTH: false,
    HEALTH_WITH_LEVEL: false,
    INTANGIBLE: true,
    NO_COLLISIONS: true,
    HITS_OWN_TYPE: "never",
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: {
        SPEED: 0,
        ACCELERATION: 0,
        HEALTH: 1e6,
        SHIELD: 0,
        REGEN: 0,
        DAMAGE: 0,
        PENETRATION: 0,
        DENSITY: 0,
        PUSHABILITY: 0,
    },
}
Class.craftrasMineableWall = {
    PARENT: "wall",
    DRAW_HEALTH: false,
    HEALTH_WITH_LEVEL: false,
    BODY: {
        HEALTH: 100,
        SHIELD: 0,
        REGEN: 0,
        DAMAGE: 0,
        PUSHABILITY: 0,
    },
}
Class.craftrasGrassWall = {
    PARENT: "craftrasMineableWall",
    LABEL: "Grass",
    COLOR: "#62b85b",
    BODY: { HEALTH: 50 },
}
Class.craftrasDirtWall = {
    PARENT: "craftrasMineableWall",
    LABEL: "Dirt",
    COLOR: "#a9774f",
    BODY: { HEALTH: 50 },
}
Class.craftrasCoalMark = { SHAPE: 3, COLOR: "pureBlack", BORDERLESS: true, STROKE_WIDTH: 0 }
Class.craftrasIronMark = { SHAPE: 5, COLOR: "veryLightGrey" }
Class.craftrasGoldMark = { SHAPE: 4, COLOR: "gold" }
Class.craftrasDiamondMark = { SHAPE: 6, COLOR: "aqua" }
Class.craftrasCoalWall = {
    PARENT: "craftrasMineableWall",
    LABEL: "Coal Ore",
    BODY: { HEALTH: 150 },
    PROPS: [{ POSITION: [9.33, 0, 0, 0, 2], TYPE: "craftrasCoalMark" }],
}
Class.craftrasIronWall = {
    PARENT: "craftrasMineableWall",
    LABEL: "Iron Ore",
    BODY: { HEALTH: 250 },
    PROPS: [{ POSITION: [14, 0, 0, 0, 2], TYPE: "craftrasIronMark" }],
}
Class.craftrasGoldWall = {
    PARENT: "craftrasMineableWall",
    LABEL: "Gold Ore",
    BODY: { HEALTH: 200 },
    PROPS: [{ POSITION: [14, 0, 0, 0, 2], TYPE: "craftrasGoldMark" }],
}
Class.craftrasDiamondWall = {
    PARENT: "craftrasMineableWall",
    LABEL: "Diamond Ore",
    BODY: { HEALTH: 300 },
    PROPS: [{ POSITION: [14, 0, 0, 0, 2], TYPE: "craftrasDiamondMark" }],
}
Class.moon = {
    PARENT: "genericObstacle",
    LABEL: "Moon",
    SIZE: 60
}
Class.pumpkinLine = {
    LABEL: "Line",
    SHAPE: -1,
    COLOR: "#ff9000",
}
Class.pumpkinCircle = {
    LABEL: "Circle",
    SHAPE: 0,
    COLOR: "#654320",
}
Class.pumpkinStar = {
    LABEL: "Star",
    SHAPE: -6,
    COLOR: "#267524"
}
Class.pumpkin = {
    PARENT: "stone",
    LABEL: "Pumpkin",
    SHAPE: 9,
    COLOR: "#ff9000",
    GUNS: [],
    SIZE: 63,
    PROPS: [
        ...weaponArray({
            POSITION: [6, -4.5, 0, 0, 360, 1],
            TYPE: "pumpkinLine",
        }, 9),
        {
            POSITION: [6.5, 0, 0, 0, 360, 2],
            TYPE: "pumpkinCircle",
        },
        {
            POSITION: [4.5, 0, 0, 0, 360, 3],
            TYPE: "pumpkinStar",
        },
    ],
}

// Walls
Class.wall = {
    PARENT: "genericObstacle",
    LABEL: "Wall",
    SIZE: 25,
    SHAPE: 4,
    ANGLE: 0,
    WALL_TYPE: 1,
    VARIES_IN_SIZE: false
}
Class.eyewall = {
    PARENT: "wall",
    LABEL: "Optical Wall",
    PROPS: [
        {
            POSITION: [15, 0, 0, 0, 360, 1],
            TYPE: "eyeturret",
            ANGLE: Math.PI / 2,
        }
    ]
}
Class.oneWayUpWall = {
    PARENT: "wall",
	LABEL: "One-Way Wall (Up)",
	PROPS: [
		{
            TYPE: "triangleHat",
			POSITION: {
				SIZE: 7,
				X: -0.5,
                ANGLE: 270,
                LAYER: 1
			}
		}
	]
}
Class.oneWayDownWall = {
    PARENT: "wall",
	LABEL: "One-Way Wall (Down)",
	PROPS: [
		{
            TYPE: "triangleHat",
			POSITION: {
				SIZE: 7,
				X: -0.5,
                ANGLE: 90,
                LAYER: 1
			}
		}
	]
}
Class.oneWayLeftWall = {
    PARENT: "wall",
	LABEL: "One-Way Wall (Left)",
	PROPS: [
		{
            TYPE: "triangleHat",
			POSITION: {
                SIZE: 7,
                X: -0.5,
                ANGLE: 180,
                LAYER: 1
			}
		}
	]
}
Class.oneWayRightWall = {
    PARENT: "wall",
	LABEL: "One-Way Wall (Right)",
	PROPS: [
		{
            TYPE: "triangleHat",
			POSITION: {
                SIZE: 7,
                X: -0.5,
                LAYER: 1
			}
		}
	]
}
