const {combineStats, skillSet, weaponArray} = require('../facilitators.js')
const {base, statnames} = require('../constants.js')
const g = require('../gunvals.js')

// Base Protector
Class.baseProtector = {
    PARENT: "genericTank",
    LABEL: "Base",
    UPGRADE_LABEL: "Base Protector",
    ON_MINIMAP: false,
    SIZE: 64,
    DAMAGE_CLASS: 0,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    IGNORED_BY_AI: true,
    HITS_OWN_TYPE: "pushOnlyTeam",
    SKILL: skillSet({
        rld: 1,
        dam: 1,
        pen: 1,
        spd: 1,
        str: 1,
    }),
    BODY: {
        SPEED: 0,
        HEALTH: 1e4,
        DAMAGE: 10,
        PENETRATION: 0.25,
        SHIELD: 1e3,
        REGEN: 100,
        FOV: 1,
        PUSHABILITY: 0,
        RESIST: 10000,
        HETERO: 0,
    },
    FACING_TYPE: ["spin", {speed: 0.04}],
    TURRETS: [
        {
            POSITION: [25, 0, 0, 0, 360, 0],
            TYPE: "dominationBody",
        },
        ...weaponArray({
            POSITION: [12, 7, 0, 45, 100, 0],
            TYPE: "baseSwarmTurret",
        }, 4)
    ],
    GUNS: weaponArray([
        {
            POSITION: [4.5, 11.5, -1.3, 6, 0, 45, 0],
        },
        {
            POSITION: [4.5, 8.5, -1.5, 7, 0, 45, 0],
        },
    ], 4)
}

// Dominators
Class.dominator = {
    PARENT: "genericTank",
    LABEL: "Dominator",
    UPGRADE_LABEL: 'Unknown',
    ON_MINIMAP: false,
    DANGER: 7,
    SKILL: skillSet({
        rld: 1,
        dam: 1,
        pen: 1,
        str: 1,
        spd: 1,
    }),
    LEVEL: 45,
    LEVEL_CAP: 45,
    SIZE: 50,
    SYNC_WITH_TANK: true,
    BODY: {
        RESIST: 100,
        SPEED: 1.32,
        ACCELERATION: 0.8,
        HEALTH: 590,
        DAMAGE: 6,
        PENETRATION: 0.25,
        FOV: 0.5,
        PUSHABILITY: 0,
        HETERO: 0,
        SHIELD: base.SHIELD * 1.4
    },
    CONTROLLERS: ["nearestDifferentMaster", ["spin", { onlyWhenIdle: true }]],
    AI: { IGNORE_SHAPES: true },
    DISPLAY_NAME: true,
    TURRETS: [
        {
            POSITION: [22, 0, 0, 0, 360, 0],
            TYPE: "dominationBody"
        }
    ],
    CAN_BE_ON_LEADERBOARD: false,
    GIVE_KILL_MESSAGE: false,
    ACCEPTS_SCORE: false,
    HITS_OWN_TYPE: "pushOnlyTeam"
}
Class.destroyerDominator = {
    PARENT: "dominator",
    UPGRADE_LABEL: 'Destroyer',
    GUNS: [
        {
            POSITION: [15.25, 6.75, 1, 0, 0, 0, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, g.destroyerDominator]),
                TYPE: "bullet"
            }
        },
        {
            POSITION: [5, 6.75, -1.6, 6.75, 0, 0, 0]
        }
    ]
}
Class.gunnerDominator = {
    PARENT: "dominator",
    UPGRADE_LABEL: 'Gunner',
    GUNS: [
        {
            POSITION: [14.25, 3, 1, 0, -2, 0, 0.5],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, g.gunnerDominator]),
                TYPE: "bullet"
            }
        },
        {
            POSITION: [14.25, 3, 1, 0, 2, 0, 0.5],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, g.gunnerDominator]),
                TYPE: "bullet"
            }
        },
        {
            POSITION: [15.85, 3, 1, 0, 0, 0, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, g.gunnerDominator]),
                TYPE: "bullet"
            }
        },
        {
            POSITION: [5, 8.5, -1.6, 6.25, 0, 0, 0]
        }
    ]
}
Class.trapperDominator = {
    PARENT: "dominator",
    UPGRADE_LABEL: 'Trapper',
    FACING_TYPE: ["spin", {speed: 0.02}],
    GUNS: weaponArray([
        {
            POSITION: [4, 3.75, 1, 8, 0, 0, 0]
        },
        {
            POSITION: [1.25, 3.75, 1.7, 12, 0, 0, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.trap, g.trapperDominator]),
                TYPE: "trap",
                STAT_CALCULATOR: "trap",
                AUTOFIRE: true
            }
        }
    ], 8)
}

// Sanctuaries
Class.sanctuary = {
    PARENT: 'dominator',
    LABEL: "Sanctuary",
    DISPLAY_NAME: false,
    DISPLAY_SCORE: false,
    LEVEL: 45,
    SIZE: 40,
    FACING_TYPE: ['spin', {speed: 0.025}],
    SKILL: skillSet({
        rld: 1.25,
        dam: 1.25,
        str: 1.25,
    }),
    BODY: {
        HEALTH: 1280,
        DAMAGE: 5.5,
        SHIELD: base.SHIELD * 1.2
    },
    TURRETS: [
        {
            TYPE: 'dominationBody',
            POSITION: {
                SIZE: 22
            }
        }
    ]
}
let sancTiers =       [3, 6, 8, 9, 10, 12]
let sancHealerTiers = [2, 3, 4]
for (let tier of sancHealerTiers) {
    Class['sanctuaryHealerTier' + (sancHealerTiers.indexOf(tier) + 1)] = {
        PARENT: 'sanctuaryHealer',
        FACING_TYPE: ['spin', {speed: -0.06}],
        GUNS: weaponArray([
            {
                POSITION: {
                    LENGTH: 6,
                    WIDTH: 9,
                    ASPECT: -0.5,
                    X: 12.5
                },
            },
            {
                POSITION: {
                    LENGTH: 5.5,
                    WIDTH: 10,
                    X: 10
                },
                PROPERTIES: {
                    SHOOT_SETTINGS: combineStats([g.basic, { range: 0.5, reload: 1.1, speed: 0.80 }, g.healer]),
                    SPAWN_OFFSET: 0,
                    TYPE: 'healerSanctuaryBullet',
                    AUTOFIRE: true,
                }
            }
        ], tier)
    }
}
for (let tier of sancTiers) {
    let sancIndex = sancTiers.indexOf(tier)
    Class['sanctuaryTier' + (sancIndex + 1)] = {
        PARENT: 'sanctuary',
        TURRETS: [],
        UPGRADE_LABEL: 'Tier ' + (sancIndex + 1),
        GUNS: weaponArray([
            {
                POSITION: {LENGTH: 12, WIDTH: 4}
            }, {
                POSITION: {LENGTH: 1.5, WIDTH: 4, ASPECT: 1.7, X: 12},
                PROPERTIES: {
                    SHOOT_SETTINGS: combineStats([g.trap, {shudder: 0.15, health: 7, reload: 1.5, speed: 1}]),
                    TYPE: ["trap", {BODY: {PUSHABILITY: 0.5}}],
                    STAT_CALCULATOR: "trap",
                    AUTOFIRE: true,
                },
            }
        ], tier)
    }
    Class['sanctuaryTier' + (sancIndex + 1)].TURRETS.push({
        POSITION: { SIZE: 22 },
        TYPE: 'dominationBody',
    }, {
        POSITION: { SIZE: 9.3, LAYER: 1 },
        TYPE: 'sanctuaryHealerTier' + (sancIndex < 2 ? 1 : sancIndex < 4 ? 2 : sancIndex < 6 ? 3 : 3),
    })
}

// Mothership
Class.mothership = {
    PARENT: "genericTank",
    LABEL: "Mothership",
    NAME: "Mothership",
    DANGER: 10,
    SIZE: Class.genericTank.SIZE * (12 / 3),
    SHAPE: 16,
    STAT_NAMES: statnames.drone,
    VALUE: 5e5,
    SKILL: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    BODY: {
        REGEN: 0.5,
        FOV: 1,
        SHIELD: 0,
        ACCEL: 0.2,
        SPEED: 0.3,
        HEALTH: 4000,
        PUSHABILITY: 0.15,
        DENSITY: 0.2,
        DAMAGE: 1.5,
    },
    HITS_OWN_TYPE: "pushOnlyTeam",
    GUNS: 
    weaponArray([
        {
            POSITION: [4.3, 3.1, 1.2, 8, 0, 22.5, 0],
            PROPERTIES: {
                MAX_CHILDREN: 2,
                SHOOT_SETTINGS: combineStats([g.drone, g.overseer, g.mothership]),
                TYPE: "drone",
                AUTOFIRE: true,
                SYNCS_SKILLS: true,
                STAT_CALCULATOR: "drone",
                WAIT_TO_CYCLE: true,
            }
        }, {
            POSITION: [4.3, 3.1, 1.2, 8, 0, 45, 1/32],
            PROPERTIES: {
                MAX_CHILDREN: 2,
                SHOOT_SETTINGS: combineStats([g.drone, g.overseer, g.mothership]),
                TYPE: ["drone", {
                        AI: {skynet: true},
                        INDEPENDENT: true,
                        BODY: {FOV: 2},
                    }],
                AUTOFIRE: true,
                SYNCS_SKILLS: true,
                STAT_CALCULATOR: "drone",
                WAIT_TO_CYCLE: true,
            }
        }
    ], 8, {delayIncrement: 1/16})
}
Class.flagship = {
    PARENT: 'mothership',
    LABEL: "Flagship",
    NAME: "Flagship",
    TURRETS: [
        {
            TYPE: 'flagshipTurret',
            POSITION: {
                SIZE: 10,
                ANGLE: 45,
                LAYER: 1
            }
        }
    ]
}
Class.turkeynose = {
    COLOR: 19,
    LABEL: '',
    SIZE: 6.45,
}
Class.turkeyeye = {
    COLOR: 18,
    LABEL: '',
    TURRETS: [
        {
            POSITION: [10.75, 1, 0, 0, 360, 1],
            TYPE: "turkeynose"
        }
    ] 
}
Class.turkeyhead = {
    LABEL: 'Turkey',
    SIZE: 26.9,
    GUNS: [
        {
            POSITION: [19.8, 8.1, -1.75, 5.5, 0, 0, 0]
        }
    ],
    SHAPE: 0,
    TURRETS: [
        {
            POSITION: [6.5, 7, -5, 0, 360, 1],
            TYPE: "turkeyeye"
        },
        {
            POSITION: [6.5, 7, 5, 0, 360, 1],
            TYPE: "turkeyeye"
        }
    ]
}
Class.turkey = {
    PARENT: "genericTank",
    LABEL: 'Turkey',
    NAME: 'Turkey',
    SIZE: 50,
    MAX_CHILDREN: 16,
    SHAPE: 16,
    BODY: {
        SPEED: base.SPEED * 0.2,
        FOV: 1.5,
        SHIELD: 0,
        ACCEL: 0.2,
        SPEED: 0.3,
        HEALTH: 2000,
        PUSHABILITY: 0.15,
        DENSITY: 0.2,
        DAMAGE: 1.5,
    },
    GUNS: [
        {
            POSITION: [18, 4.69, 1, 0, 0, 135, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.drone, g.overseer, g.mothership]),
                TYPE: "drone",
                AUTOFIRE: true,
                SYNCS_SKILLS: true,
                STAT_CALCULATOR: "drone",
            },
        },
        { 
            POSITION: [20.96, 6.69, 1, 0, 0, 157.5, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.drone, g.overseer, g.mothership]),
                TYPE: "drone",
                AUTOFIRE: true,
                SYNCS_SKILLS: true,
                STAT_CALCULATOR: "drone",
            }, 
        },
        {
            POSITION: [18, 4.69, 1, 0, 0, 225, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.drone, g.overseer, g.mothership]),
                TYPE: "drone",
                AUTOFIRE: true,
                SYNCS_SKILLS: true,
                STAT_CALCULATOR: "drone",
            },  
        },
        {
            POSITION: [20.96, 6.69, 1, 0, 0, 202.5, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.drone, g.overseer, g.mothership]),
                TYPE: "drone",
                AUTOFIRE: true,
                SYNCS_SKILLS: true,
                STAT_CALCULATOR: "drone",
            }, 
        },
        {
        POSITION: [24.09, 8.69, 1, 0, 0, 180, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.drone, g.overseer, g.mothership]),
                TYPE: "drone",
                AUTOFIRE: true,
                SYNCS_SKILLS: true,
                STAT_CALCULATOR: "drone",
            },
        },
        {
            POSITION: [ 24.09, 8.69, 1, 0, 0, 180, 0 ],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.drone, g.overseer, g.mothership]),
                TYPE: "drone",
                AUTOFIRE: true,
                SYNCS_SKILLS: true,
                STAT_CALCULATOR: "drone",
            },
        },
        { 
            POSITION: [ 4, 5, 1, 10, 0, 105, 0 ],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.drone, g.overseer, g.mothership]),
                TYPE: "drone",
                AUTOFIRE: true,
                SYNCS_SKILLS: true,
                STAT_CALCULATOR: "drone",
            }, 
        },
        {   POSITION: [ 4, 5, 1, 10, 0, -105, 0 ],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.drone, g.overseer, g.mothership]),
                TYPE: "drone",
                AUTOFIRE: true,
                SYNCS_SKILLS: true,
                STAT_CALCULATOR: "drone",
            }, 
        }
    ],
    TURRETS: [
        {
            POSITION: [10, 8.75, 0, 0, 360, 1],
            TYPE: "turkeyhead"
        }
    ],
}

// ATMG
Class.antiTankMachineGun = {
    PARENT: "dominator",
    LABEL: "Anti-Tank Machine Gun",
    UPGRADE_LABEL: "A.T.M.G.",
    CONTROLLERS: [['spin', {onlyWhenIdle: true}], 'nearestDifferentMaster'],
    LEVEL: 45,
    SIZE: 32,
    BODY: {
        RESIST: 100,
        SPEED: 1.32,
        ACCELERATION: 0.8,
        HEALTH: 1e99,
        DAMAGE: 6,
        PENETRATION: 0.25,
        FOV: 1.35,
        PUSHABILITY: 0,
        HETERO: 0,
        SHIELD: base.SHIELD * 1.4,
    },
    SKILL_CAP: Array(10).fill(15),
    SKILL: Array(10).fill(15),
    GUNS: [
        {
            POSITION: { LENGTH: 15, WIDTH: 3.0000001192092896, X: -6.556708751634699e-8, Y: 1.5000000596046434, ANGLE: 0 },
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, g.op, {reload: 0.5, health: 100, damage: 100, recoil: 0, spray: 0.1, speed: 2, maxSpeed: 2}]),
                TYPE: "bullet",
            }
        },
        {
            POSITION: { LENGTH: 15, WIDTH: 3.0000001192092896, X: -6.556708770004402e-8, Y: -1.5000000596046434, ANGLE: 0 },
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, g.op, {reload: 0.5, health: 100, damage: 100, recoil: 0, spray: 0.1, speed: 2, maxSpeed: 2}]),
                TYPE: "bullet",
            }
        },
        {
            POSITION: { LENGTH: 17.000000476837158, WIDTH: 3.0000001192092896, X: 0, Y: 0, ANGLE: 0 },
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, g.op, {reload: 0.5, health: 100, damage: 100, recoil: 0, spray: 0.1, speed: 2, maxSpeed: 2}]),
                TYPE: "bullet",
            }
        },
        {
            POSITION: { LENGTH: 10, WIDTH: 8.00000011920929, ASPECT: -1.2000000476837158, X: 9.999999999999998, Y: -6.123234262925839e-16, ANGLE: 90.00000250447816 }
        },
        {
            POSITION: { LENGTH: 10, WIDTH: 8.00000011920929, ASPECT: -1.2000000476837158, X: 9.999999999999998, Y: -6.123233601181349e-16, ANGLE: -90.00000250447816 }
        },
        {
            POSITION: { LENGTH: 5, WIDTH: 6.000000238418579, ASPECT: -1.600000023841858, X: 7.5, Y: -4.592425496802574e-16, ANGLE: 0 }
        }
    ],
    TURRETS: [{
        POSITION: [20, 0, 25, 0, 180, 1],
        TYPE: ["antiTankMachineGunArm"]
    }, {
        POSITION: [20, 0, -25, 0, 180, 1],
        TYPE: ["antiTankMachineGunArm"]
    }, {
        POSITION: [25, 0, 0, 0, 360, 0],
        TYPE: ["dominationBody"]
    }]
}
Class.cxATMGBullet = {PARENT: "bullet", SHAPE: Class.cube.SHAPE}
Class.cxATMGArm = {
    PARENT: "genericTank",
    COLOR: "white",
    SHAPE: Class.cube.SHAPE,
    SKILL_CAP: Array(10).fill(15),
    SKILL: Array(10).fill(15),
    GUNS: [
        {
            POSITION: [15, 2.5, 1, 0, 2, 0, 0.2],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, {reload: 0.5}]),
                TYPE: "cxATMGBullet",
            }
        },
        {
            POSITION: [15, 2.5, 1, 0, -2, 0, 0.2],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, {reload: 0.5}]),
                TYPE: "cxATMGBullet",
            }
        },
        {
            POSITION: [1, 2.5, 1, 0, 0, 0, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, {reload: 0.5}]),
                TYPE: "cxATMGBullet",
            }
        },
        {
            POSITION: [16.5, 3.5, 1, 0, 0, 0, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, {reload: 0.5}]),
                TYPE: "cxATMGBullet",
            }
        },
        {
            POSITION: [5.5, 6.5, -1.8, 6.5, 0, 0, 0]
        }
    ],
}
Class.cxATMG = {
    PARENT: "dominator",
    LABEL: "CX-ATMG",
    UPGRADE_LABEL: "CX-ATMG",
    SHAPE: Class.cube.SHAPE,
    SIZE: 12,
    BODY: {
        RESIST: 2,
        SPEED: 2.32,
        ACCELERATION: 0.8,
        HEALTH: 200,
        DAMAGE: 6,
        PENETRATION: 0.25,
        FOV: 1.35,
        PUSHABILITY: 0,
        HETERO: 0,
        SHIELD: base.SHIELD * 1.4,
    },
    SKILL_CAP: Array(10).fill(15),
    SKILL: Array(10).fill(15),
    GUNS: [
        {
            POSITION: [15, 2.5, 1, 0, 2, 0, 0.2],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, {reload: 0.5}]),
                TYPE: "cxATMGBullet",
            }
        },
        {
            POSITION: [15, 2.5, 1, 0, -2, 0, 0.2],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, {reload: 0.5}]),
                TYPE: "cxATMGBullet",
            }
        },
        {
            POSITION: [1, 2.5, 1, 0, 0, 0, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, {reload: 0.5}]),
                TYPE: "cxATMGBullet",
            }
        },
        {
            POSITION: [16.5, 3.5, 1, 0, 0, 0, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, {reload: 0.5}]),
                TYPE: "cxATMGBullet",
            }
        },
        {
            POSITION: [24, 7, -1.3, 0, 0, 90, 0],
        },
        {
            POSITION: [24, 7, -1.3, 0, 0, -90, 0],
        },
        {
            POSITION: [5.5, 6.5, -1.8, 6.5, 0, 0, 0]
        }
    ],
    TURRETS: [{
        POSITION: [20, 0, 25, 0, 180, 1],
        TYPE: ["cxATMGArm"]
    }, {
        POSITION: [20, 0, -25, 0, 180, 1],
        TYPE: ["cxATMGArm"]
    }, {
        POSITION: [26, 0, 0, 0, 360, 0],
        TYPE: ["dominationBody"]
    }]
}

// Arena Closer
Class.arenaCloser = {
    PARENT: "genericTank",
    LABEL: "Arena Closer",
    DISPLAY_NAME: true,
    DANGER: 10,
    SIZE: 34,
    COLOR: "yellow",
    UPGRADE_COLOR: "yellow",
    LAYER: 13,
    BODY: {
        REGEN: 1e5,
        HEALTH: 1e6,
        DENSITY: 30,
        DAMAGE: 1e5,
        FOV: 10,
        SPEED: 6,
    },
    SKILL: skillSet({rld: 1, dam: 1, pen: 1, str: 1, spd: 1, atk: 1, hlt: 1, shi: 1, rgn: 1, mob: 1}),
    DRAW_HEALTH: false,
    HITS_OWN_TYPE: "never",
    ARENA_CLOSER: true,
    IS_IMMUNE_TO_TILES: true,
    UPGRADE_TOOLTIP: "Hackerman",
    GUNS: [
        {
            POSITION: {
                LENGTH: 14,
                WIDTH: 10
            },
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, {reload: 0.8, recoil: 0.25, health: 1e3, damage: 1e3, pen: 1e3, speed: 2.5, maxSpeed: 1.15, range: 1.8, density: 4, spray: 0.25}]),
                TYPE: ["bullet", {LAYER: 12}]
            }
        }
    ]
}

// Craftras mining test tank. This keeps the original Slayer swing animation,
// while Craftras owns the fixed-damage wall mining rules.
const CRAFTRAS_SLAYER_GRIP_ANGLE = -92;
const CRAFTRAS_SLAYER_GRIP_OFFSET = 8.2;
const CRAFTRAS_SLAYER_IDLE_ANGLE = -128;
const CRAFTRAS_SLAYER_WINDUP_ANGLE = -166;
const CRAFTRAS_SLAYER_WINDUP_GRIP_ANGLE = -118;
const CRAFTRAS_SLAYER_WINDUP_GRIP_OFFSET = 9.6;
const CRAFTRAS_SLAYER_CUT_END_ANGLE = 122;
const CRAFTRAS_SLAYER_CUT_GRIP_ANGLE = 54;
const CRAFTRAS_SLAYER_CUT_GRIP_OFFSET = 17.4;
const CRAFTRAS_SLAYER_RECOVER_ANGLE = CRAFTRAS_SLAYER_IDLE_ANGLE + 360;
const CRAFTRAS_SLAYER_RECOVER_GRIP_ANGLE = CRAFTRAS_SLAYER_GRIP_ANGLE + 360;
const CRAFTRAS_SWORD_IDLE_ANGLE = 169;
const CRAFTRAS_SWORD_IDLE_GRIP_ANGLE = -73;
const CRAFTRAS_SWORD_IDLE_GRIP_OFFSET = 7.6;
const CRAFTRAS_SWORD_WINDUP_ANGLE = -129;
const CRAFTRAS_SWORD_WINDUP_GRIP_ANGLE = -99;
const CRAFTRAS_SWORD_WINDUP_GRIP_OFFSET = 10.8;
const CRAFTRAS_SWORD_CUT_END_ANGLE = 93;
const CRAFTRAS_SWORD_CUT_GRIP_ANGLE = 63;
const CRAFTRAS_SWORD_CUT_GRIP_OFFSET = 21.2;
const CRAFTRAS_SWORD_RECOVER_ANGLE = CRAFTRAS_SWORD_IDLE_ANGLE;
const CRAFTRAS_SWORD_RECOVER_GRIP_ANGLE = CRAFTRAS_SWORD_IDLE_GRIP_ANGLE;

const craftrasSlayerLerp = (start, end, amount) => start + (end - start) * amount;
const craftrasSlayerEaseIn = amount => amount * amount;
const craftrasSlayerEaseOut = amount => 1 - (1 - amount) ** 3;
const CRAFTRAS_HELD_BLOCK_SIZE = 7;
const CRAFTRAS_HELD_BLOCK_LABELS = Object.freeze({
    grass_block: "Held Block:grass_block",
    dirt: "Held Block:dirt",
    dirt_path: "Held Block:dirt_path",
    stone: "Held Block:stone",
    coal: "Held Block:coal",
    iron_ore: "Held Block:iron_ore",
    gold_ore: "Held Block:gold_ore",
    diamond: "Held Block:diamond",
    wood: "Held Block:wood",
    plank: "Held Block:plank",
    crafting_table: "Held Block:crafting_table",
    furnace: "Held Block:furnace",
    chest: "Held Block:chest",
    bedrock: "Held Block:bedrock",
    coal_block: "Held Block:coal_block",
    iron_block: "Held Block:iron_block",
    gold_block: "Held Block:gold_block",
    diamond_block: "Held Block:diamond_block",
    challenge_start_block: "Held Block:challenge_start_block",
    challenge_spawn_block: "Held Block:challenge_spawn_block",
    transparent_block: "Held Block:transparent_block",
    route_marker_block: "Held Block:route_marker_block",
});
const CRAFTRAS_HELD_BLOCK_TYPES = [
    "craftrasHeldGrass", "craftrasHeldDirt", "craftrasHeldDirtPath", "craftrasHeldStone",
    "craftrasHeldCoal", "craftrasHeldIron", "craftrasHeldGold", "craftrasHeldDiamond",
    "craftrasHeldWood", "craftrasHeldPlank", "craftrasHeldCraftingTable", "craftrasHeldFurnace",
    "craftrasHeldChest", "craftrasHeldBedrock", "craftrasHeldCoalBlock", "craftrasHeldIronBlock",
    "craftrasHeldGoldBlock", "craftrasHeldDiamondBlock",
    "craftrasHeldChallengeStartBlock",
    "craftrasHeldChallengeSpawnBlock", "craftrasHeldTransparentBlock",
    "craftrasHeldRouteMarkerBlock",
];
const CRAFTRAS_HELD_ITEM_IDS = Object.freeze([
    "torch", "steel_torch", "rotten_flesh", "zombie_head", "bone", "skeleton_head", "gunpowder", "bomb_recipe",
    "bone_bomb_recipe", "bone_bomb",
    "creeper_head", "crown_fragment", "royal_key", "spider_eye", "spider_head",
    "toxic_spider_eye", "toxic_spider_head", "spider_leg", "string", "spider_venom",
    "venom_sword_recipe", "zombie_crown_recipe", "knight_shield_recipe",
    "cleric_staff_recipe", "cleric_staff_head", "cleric_staff_body", "cleric_staff_handle",
    "king_zombie_summon_ticket", "queen_spider_summon_ticket", "annihilator_summon_ticket", "sword_guy_summon_ticket",
    "knight_shield_fragment", "iron_shield", "gold_shield", "diamond_shield", "knight_shield",
    "raw_beef", "cooked_beef", "raw_pork", "cooked_pork", "raw_chicken", "cooked_chicken",
    "creative_24h", "creative_1h", "world1_badge",
]);
const CRAFTRAS_FOOD_ITEMS = new Set([
    "raw_beef", "cooked_beef", "raw_pork", "cooked_pork", "raw_chicken", "cooked_chicken",
    "creative_24h", "creative_1h",
]);
const CRAFTRAS_SHIELD_HEALTH = Object.freeze({
    iron_shield: 100,
    gold_shield: 50,
    diamond_shield: 150,
    knight_shield: 250,
});
const getCraftrasHeldItemClassName = itemId => `craftrasHeldItem${itemId
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
const CRAFTRAS_TOOL_MATERIALS = Object.freeze({
    wooden: "#b7834f",
    destroyer: "#07090c",
    stone: "#858a92",
    iron: "#d9dde2",
    gold: "#f0c83d",
    diamond: "#42cddd",
    venom: "#55e047",
});
const CRAFTRAS_TOOL_SHAPES = Object.freeze({
    sword: [
        [-0.55, -0.09], [-0.18, -0.09], [-0.18, -0.34], [0.04, -0.34],
        [0.04, -0.14], [1.42, -0.14], [2.12, 0], [1.42, 0.14],
        [0.04, 0.14], [0.04, 0.34], [-0.18, 0.34], [-0.18, 0.09], [-0.55, 0.09],
    ],
    pickaxe: [
        [-0.72, -0.12], [1.18, -0.12], [1.26, -0.3], [1.2, -0.55],
        [1.05, -0.82], [0.86, -1.08], [1.2, -0.9], [1.52, -0.62],
        [1.76, -0.3], [1.9, 0], [1.76, 0.3], [1.52, 0.62],
        [1.2, 0.9], [0.86, 1.08], [1.05, 0.82], [1.2, 0.55],
        [1.26, 0.3], [1.18, 0.12], [-0.72, 0.12],
    ],
    axe: [
        // Medium handle and head proportions based on the inventory icon.
        [-1.28, -0.11], [-1.18, -0.16], [0.72, -0.16], [0.72, -0.34],
        [0.93, -0.64], [1.61, -0.56], [1.81, -0.11], [1.64, 0.51],
        [1, 0.92], [0.72, 0.65], [0.72, 0.16], [-1.18, 0.16],
        [-1.28, 0.11],
    ],
    shovel: [
        [-0.72, -0.12], [1.04, -0.12], [1.04, -0.28], [1.3, -0.48],
        [1.68, -0.56], [1.94, -0.38], [2.16, 0], [1.94, 0.38],
        [1.68, 0.56], [1.3, 0.48], [1.04, 0.28], [1.04, 0.12],
        [-0.72, 0.12],
    ],
    hammer: [
        [-1.24, -0.12], [-1.13, -0.18], [0.62, -0.18], [0.62, -0.44],
        [0.88, -0.58], [1.58, -0.58], [1.82, -0.34], [1.82, 0.34],
        [1.58, 0.58], [0.88, 0.58], [0.62, 0.44], [0.62, 0.18],
        [-1.13, 0.18], [-1.24, 0.12],
    ],
    staff: [
        [-1.35, -0.09], [0.92, -0.09], [0.92, -0.23], [1.26, -0.23],
        [1.46, 0], [1.26, 0.23], [0.92, 0.23], [0.92, 0.09],
        [-1.35, 0.09],
    ],
});
const getCraftrasToolInfo = itemId => {
    if (itemId === "sword") return { type: "sword", color: CRAFTRAS_TOOL_MATERIALS.iron };
    if (itemId === "admin_pickaxe") return { type: "pickaxe", color: CRAFTRAS_TOOL_MATERIALS.wooden, rainbow: true };
    if (itemId === "worldedit_axe") return { type: "axe", color: CRAFTRAS_TOOL_MATERIALS.wooden, rainbow: true };
    if (itemId === "destroyer") return { type: "pickaxe", color: CRAFTRAS_TOOL_MATERIALS.destroyer };
    if (itemId === "blacksmith_hammer") return { type: "hammer", color: CRAFTRAS_TOOL_MATERIALS.iron };
    if (itemId === "cleric_staff") return { type: "staff", color: CRAFTRAS_TOOL_MATERIALS.gold };
    if (itemId === "cleric_staff_op") return { type: "staff", color: CRAFTRAS_TOOL_MATERIALS.gold, rainbow: true };
    if (itemId === "pope_staff") return { type: "staff", color: CRAFTRAS_TOOL_MATERIALS.gold };
    if (itemId === "blesser_staff") return { type: "staff", color: CRAFTRAS_TOOL_MATERIALS.diamond };
    if (itemId === "venom_sword") return { type: "sword", color: CRAFTRAS_TOOL_MATERIALS.venom };
    if (itemId === "the_great") return { type: "sword", color: "#f5f6ff" };
    if (itemId === "the_great_friend") return { type: "sword", color: "#f5f6ff" };
    const match = /^(wooden|stone|iron|gold|diamond)_(pickaxe|axe|shovel|sword)$/.exec(itemId || "");
    return match ? { type: match[2], color: CRAFTRAS_TOOL_MATERIALS[match[1]] } : null;
};
const getCraftrasToolDamage = itemId => {
    if (itemId === "admin_pickaxe") return 9_999_999_999_999;
    if (itemId === "destroyer") return 9_999_999_999_999;
    if (itemId === "blacksmith_hammer") return 20;
    if (itemId === "venom_sword") return 100;
    if (itemId === "the_great_friend") return 50;
    if (itemId === "cleric_staff" || itemId === "cleric_staff_op" || itemId === "pope_staff" || itemId === "blesser_staff") return 0;
    if (itemId === "sword" || itemId?.endsWith("_sword")) {
        if (itemId?.startsWith("diamond_")) return 80;
        if (itemId?.startsWith("iron_")) return 60;
        if (itemId?.startsWith("stone_")) return 40;
        return 20;
    }
    if (itemId?.startsWith("diamond_")) return 80;
    if (itemId?.startsWith("iron_")) return 40;
    if (itemId?.startsWith("stone_")) return 20;
    return 10;
};

const CRAFTRAS_TOOL_HITBOX = Object.freeze({
    sword: { start: -0.18, end: 2.12, radius: 0.28 },
    pickaxe: { start: -0.12, end: 1.9, radius: 0.34 },
    axe: { start: -0.12, end: 1.81, radius: 0.38 },
    shovel: { start: -0.12, end: 2.16, radius: 0.32 },
    hammer: { start: -0.12, end: 1.82, radius: 0.42 },
    staff: { start: -0.12, end: 1.46, radius: 0.22 },
});

const getCraftrasToolSegment = (body, toolType, size, gripOffset, toolAngleDegrees, gripAngleDegrees) => {
    const hitbox = CRAFTRAS_TOOL_HITBOX[toolType] || CRAFTRAS_TOOL_HITBOX.sword;
    const toolScale = body.size * size / 20;
    const toolAngle = body.facing + toolAngleDegrees * Math.PI / 180;
    const gripAngle = body.facing + gripAngleDegrees * Math.PI / 180;
    const centerX = body.x + Math.cos(gripAngle) * body.size * gripOffset / 10;
    const centerY = body.y + Math.sin(gripAngle) * body.size * gripOffset / 10;
    const directionX = Math.cos(toolAngle);
    const directionY = Math.sin(toolAngle);
    return {
        startX: centerX + directionX * toolScale * hitbox.start,
        startY: centerY + directionY * toolScale * hitbox.start,
        endX: centerX + directionX * toolScale * hitbox.end,
        endY: centerY + directionY * toolScale * hitbox.end,
        radius: Math.max(3, body.size * hitbox.radius),
    };
};

const getCraftrasSweptToolSegments = (previous, current) => {
    if (!previous) return [current];
    const segments = [];
    for (let step = 0; step <= 4; step++) {
        const amount = step / 4;
        segments.push({
            startX: craftrasSlayerLerp(previous.startX, current.startX, amount),
            startY: craftrasSlayerLerp(previous.startY, current.startY, amount),
            endX: craftrasSlayerLerp(previous.endX, current.endX, amount),
            endY: craftrasSlayerLerp(previous.endY, current.endY, amount),
            radius: craftrasSlayerLerp(previous.radius, current.radius, amount),
        });
    }
    return segments;
};

const makeCraftrasTool = (itemId, toolType, materialColor) => ({
    PARENT: "genericTank",
    LABEL: `Craftras Tool:${itemId}`,
    COLOR: materialColor,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    MIRROR_MASTER_ANGLE: true,
    SHAPE: CRAFTRAS_TOOL_SHAPES[toolType],
    BODY: {
        DAMAGE: 0,
        HEALTH: 1e9,
        SHIELD: 1e9,
        REGEN: 1e6,
        DENSITY: 0,
        SPEED: 0,
        PUSHABILITY: 0,
    },
});

const setCraftrasSlayerPose = (body, size, offset, angleDegrees, gripAngleDegrees = CRAFTRAS_SLAYER_GRIP_ANGLE) => {
    const angle = angleDegrees * Math.PI / 180;
    const direction = (gripAngleDegrees - angleDegrees) * Math.PI / 180;
    for (const turret of body.turrets.values()) {
        if (!turret.craftrasToolSlot && turret.label !== "Craftras Tool Slot") continue;
        turret.craftrasToolSlot = true;
        turret.bound.size = turret.alpha > 0 ? size / 20 : 0.001;
        turret.bound.offset = offset / 10;
        turret.bound.angle = angle;
        turret.bound.direction = direction;
    }
};

const craftrasSlayerTick = ({ body }) => {
    if (body.craftrasSpectator) {
        body.control.fire = false;
        body.control.alt = false;
        body.slayerSwingPhase = 0;
        body.slayerSwingActive = false;
        body.slayerFireWasDown = false;
        body.craftrasMiningHitKeys = new Set();
        body.craftrasCombatHitIds = new Set();
        body.craftrasPreviousToolSegment = null;
        setCraftrasSlayerPose(body, 20, CRAFTRAS_SLAYER_GRIP_OFFSET, CRAFTRAS_SLAYER_IDLE_ANGLE);
        return;
    }
    const heldItem = body.craftrasHeldItem;
    const hasM134 = heldItem === "m134";
    const hasRocketLauncher = heldItem === "rocket_launcher";
    const now = Date.now();
    const offhandShield = body.craftrasOffhandShield;
    const mainhandShield = body.craftrasMainHandStack;
    let shieldRecovered = false;
    for (const shield of new Set([offhandShield, mainhandShield])) {
        const maxDurability = CRAFTRAS_SHIELD_HEALTH[shield?.id];
        if (!maxDurability || !shield.brokenUntil || shield.brokenUntil > now) continue;
        shield.durability = maxDurability;
        shield.brokenUntil = 0;
        shieldRecovered = true;
    }
    if (shieldRecovered) {
        const socket = global.gameManager?.clients?.find(client => client?.player?.body === body);
        if (socket) global.gameManager.socketManager.sendCraftrasInventory(socket);
    }
    const activeShield = CRAFTRAS_SHIELD_HEALTH[offhandShield?.id]
        ? offhandShield
        : CRAFTRAS_SHIELD_HEALTH[mainhandShield?.id] ? mainhandShield : null;
    const eatingFood = CRAFTRAS_FOOD_ITEMS.has(heldItem);
    const shieldBlocking = !!body.control.alt && !eatingFood && !!activeShield && !(activeShield.brokenUntil > now);
    if (shieldBlocking) body.control.fire = false;
    const m134Firing = hasM134 && !!body.control.fire;
    if (m134Firing) body.craftrasM134WarmupStarted ??= now;
    else body.craftrasM134WarmupStarted = 0;
    const m134Heat = m134Firing ? Math.min(1, (now - body.craftrasM134WarmupStarted) / 2000) : 0;
    const m134Ready = m134Firing && m134Heat >= 1;
    if (hasRocketLauncher && body.control.fire && now >= (body.craftrasNextRocketAt || 0)) {
        const fired = global.gameManager?.gamemodeManager?.gameCraftras?.fireRocketLauncher(body);
        if (fired) body.craftrasNextRocketAt = now + 10_000;
    }
    const toolInfo = getCraftrasToolInfo(heldItem);
    const hasToolEquipped = !!toolInfo;
    const hasSwordEquipped = heldItem === "sword" || heldItem === "the_great_friend" || heldItem?.endsWith("_sword");
    const helmetType = body.craftrasHelmet;
    for (const gun of body.guns.values()) {
        if (gun.label !== "Craftras M134 Barrel") continue;
        gun.canShoot = m134Ready;
        gun.autofire = m134Ready;
        gun.alpha = 0;
    }
    for (const turret of body.turrets.values()) {
        if (turret.label === "Craftras M134 Mount") {
            turret.craftrasM134Size ??= turret.bound.size;
            turret.bound.size = hasM134 ? turret.craftrasM134Size : 0.001;
            turret.control.fire = false;
            for (const gun of turret.guns.values()) {
                gun.canShoot = false;
                gun.autofire = false;
                gun.alpha = m134Heat;
            }
            continue;
        }
        if (turret.label === "Craftras Rocket Launcher Mount") {
            turret.craftrasRocketLauncherSize ??= turret.bound.size;
            turret.bound.size = hasRocketLauncher ? turret.craftrasRocketLauncherSize : 0.001;
            turret.alpha = 0;
            continue;
        }
        if (turret.label.startsWith("Craftras Helmet")) {
            turret.craftrasHelmetSize ??= turret.bound.size;
            const visible = turret.label === "Craftras Helmet Crown"
                ? helmetType === "zombie_crown"
                : turret.label === "Craftras Helmet Front"
                ? helmetType === "iron_helmet"
                : helmetType === "diamond_helmet";
            turret.alpha = 0;
            turret.bound.size = visible ? turret.craftrasHelmetSize : 0.001;
            continue;
        }
        if (turret.label.startsWith("Craftras Player Hat:")) {
            turret.craftrasHelmetSize ??= turret.bound.size;
            const hatId = turret.label.slice("Craftras Player Hat:".length);
            turret.alpha = 0;
            turret.bound.size = helmetType === hatId ? turret.craftrasHelmetSize : 0.001;
            continue;
        }
        if (turret.craftrasToolSlot || turret.label.startsWith("Craftras Tool:")) {
            turret.craftrasToolSlot = true;
            const visible = hasToolEquipped && turret.label === `Craftras Tool:${heldItem}`;
            const cooldownVisible = visible && (
                (heldItem === "cleric_staff" && now < (body.craftrasNextClericStaffAt || 0)) ||
                (heldItem === "blesser_staff" && now < (body.craftrasNextBlesserStaffAt || 0))
            );
            turret.alpha = visible ? cooldownVisible ? 0.5 : 1 : 0;
            if (visible) {
                const rainbowColors = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#32ade6", "#5856d6", "#af52de"];
                turret.color.interpret(cooldownVisible
                    ? "#ff3030"
                    : toolInfo.rainbow
                    ? rainbowColors[Math.floor(now / 100) % rainbowColors.length]
                    : toolInfo.color);
            }
            else turret.bound.size = 0.001;
            continue;
        }
        if (turret.label.startsWith("Held Item:")) {
            const visible = turret.label === `Held Item:${heldItem}`;
            const stack = body.craftrasMainHandStack;
            const broken = visible && CRAFTRAS_SHIELD_HEALTH[heldItem] && stack?.brokenUntil > now;
            const hit = visible && CRAFTRAS_SHIELD_HEALTH[heldItem] && stack?.hitUntil > now;
            turret.alpha = broken ? 0.4 : 0;
            turret.bound.size = visible ? CRAFTRAS_HELD_BLOCK_SIZE / 20 : 0.001;
            if (CRAFTRAS_SHIELD_HEALTH[heldItem]) {
                turret.bound.direction = broken ? 0.001 : hit ? 0.002 : 0;
                turret.bound.angle = body.control.alt && !broken ? 0 : Math.PI;
                turret.bound.offset = 1;
            } else if (visible && CRAFTRAS_FOOD_ITEMS.has(heldItem) && body.craftrasEating) {
                const phase = Math.min(1, Math.max(0, (now - (body.craftrasEatingStarted || now)) / 1200));
                turret.bound.angle = Math.sin(phase * Math.PI * 6) * 0.18;
                turret.bound.offset = 1 - Math.sin(phase * Math.PI) * 0.58;
            } else if (visible) {
                turret.bound.angle = 0;
                turret.bound.offset = 1;
            }
            continue;
        }
        if (turret.label.startsWith("Offhand Shield:")) {
            const shield = body.craftrasOffhandShield;
            const visible = turret.label === `Offhand Shield:${shield?.id}`;
            turret.alpha = visible && shield?.brokenUntil > now ? 0.4 : 0;
            turret.bound.size = visible ? CRAFTRAS_HELD_BLOCK_SIZE / 20 : 0.001;
            const broken = visible && shield?.brokenUntil > now;
            const hit = visible && shield?.hitUntil > now;
            turret.bound.direction = broken ? 0.001 : hit ? 0.002 : 0;
            turret.bound.angle = body.control.alt && !eatingFood && !broken ? 0 : Math.PI;
            continue;
        }
        if (!turret.label.startsWith("Held Block:")) continue;
        const visible = turret.label === CRAFTRAS_HELD_BLOCK_LABELS[body.craftrasHeldItem];
        turret.alpha = visible ? 1 : 0;
        turret.bound.size = visible ? CRAFTRAS_HELD_BLOCK_SIZE / 20 : 0.001;
    }
    if (hasM134 || hasRocketLauncher) {
        body.slayerSwingPhase = 0;
        body.slayerSwingActive = false;
        body.craftrasMiningHitKeys = new Set();
        body.craftrasCombatHitIds = new Set();
        body.craftrasPreviousToolSegment = null;
        return;
    }
    if (!hasToolEquipped) {
        body.slayerSwingPhase = 0;
        body.slayerSwingActive = false;
        body.craftrasMiningHitKeys = new Set();
        body.craftrasCombatHitIds = new Set();
        body.craftrasPreviousToolSegment = null;
        return;
    }

    if (heldItem === "pope_staff") {
        body.slayerSwingPhase = 0;
        body.slayerSwingActive = false;
        body.slayerFireWasDown = !!body.control.fire;
        body.craftrasMiningHitKeys = new Set();
        body.craftrasCombatHitIds = new Set();
        body.craftrasPreviousToolSegment = null;
        const casting = now < (body.craftrasPopeStaffCastingUntil || 0);
        if (!body.craftrasPopeStaffCharging && !casting) {
            setCraftrasSlayerPose(body, 20, CRAFTRAS_SLAYER_GRIP_OFFSET, CRAFTRAS_SLAYER_IDLE_ANGLE);
            return;
        }
        const elapsed = now - (body.craftrasPopeStaffCharging ? body.craftrasPopeStaffChargeStarted || now : body.craftrasPopeStaffCastStarted || now);
        const extend = Math.min(1, Math.max(0, elapsed / 350));
        const shake = Math.sin(elapsed / 155) * 22;
        const pulse = Math.sin(elapsed / 240) * 1.1;
        setCraftrasSlayerPose(
            body,
            craftrasSlayerLerp(20, 26 + pulse, extend),
            craftrasSlayerLerp(CRAFTRAS_SLAYER_GRIP_OFFSET, 13.6 + pulse, extend),
            craftrasSlayerLerp(CRAFTRAS_SLAYER_IDLE_ANGLE, 68 + shake, extend),
            craftrasSlayerLerp(CRAFTRAS_SLAYER_GRIP_ANGLE, -8 + shake * 0.18, extend),
        );
        return;
    }

    if (heldItem === "cleric_staff" || heldItem === "cleric_staff_op") {
        body.slayerSwingPhase = 0;
        body.slayerSwingActive = false;
        body.slayerFireWasDown = !!body.control.fire;
        body.craftrasMiningHitKeys = new Set();
        body.craftrasCombatHitIds = new Set();
        body.craftrasPreviousToolSegment = null;
        if (now >= (body.craftrasClericStaffCastUntil || 0)) {
            setCraftrasSlayerPose(body, 20, CRAFTRAS_SLAYER_GRIP_OFFSET, CRAFTRAS_SLAYER_IDLE_ANGLE);
            return;
        }
        const started = body.craftrasClericStaffCastStarted || now;
        const progress = Math.max(0, Math.min(1, (now - started) / Math.max(1, (body.craftrasClericStaffCastUntil || now) - started)));
        if (progress < 0.35) {
            const motion = craftrasSlayerEaseOut(progress / 0.35);
            setCraftrasSlayerPose(
                body,
                craftrasSlayerLerp(20, 26, motion),
                craftrasSlayerLerp(CRAFTRAS_SLAYER_GRIP_OFFSET, 13.6, motion),
                craftrasSlayerLerp(CRAFTRAS_SLAYER_IDLE_ANGLE, 68, motion),
                craftrasSlayerLerp(CRAFTRAS_SLAYER_GRIP_ANGLE, -8, motion),
            );
        } else {
            const hold = Math.min(1, Math.max(0, (progress - 0.35) / 0.65));
            const shake = Math.sin(hold * Math.PI * 4) * 18;
            const pulse = Math.sin(hold * Math.PI * 2.5) * 0.8;
            setCraftrasSlayerPose(body, 26 + pulse, 13.6 + pulse, 68 + shake, -8 + shake * 0.18);
        }
        return;
    }

    if (heldItem === "blesser_staff") {
        body.slayerSwingPhase = 0;
        body.slayerSwingActive = false;
        body.slayerFireWasDown = !!body.control.fire;
        body.craftrasMiningHitKeys = new Set();
        body.craftrasCombatHitIds = new Set();
        body.craftrasPreviousToolSegment = null;
        if (now >= (body.craftrasBlesserStaffCastUntil || 0)) {
            setCraftrasSlayerPose(body, 20, CRAFTRAS_SLAYER_GRIP_OFFSET, CRAFTRAS_SLAYER_IDLE_ANGLE);
            return;
        }
        const started = body.craftrasBlesserStaffCastStarted || now;
        const progress = Math.max(0, Math.min(1, (now - started) / Math.max(1, (body.craftrasBlesserStaffCastUntil || now) - started)));
        if (progress < 0.35) {
            const motion = craftrasSlayerEaseOut(progress / 0.35);
            setCraftrasSlayerPose(
                body,
                craftrasSlayerLerp(20, 26.5, motion),
                craftrasSlayerLerp(CRAFTRAS_SLAYER_GRIP_OFFSET, 13.9, motion),
                craftrasSlayerLerp(CRAFTRAS_SLAYER_IDLE_ANGLE, 70, motion),
                craftrasSlayerLerp(CRAFTRAS_SLAYER_GRIP_ANGLE, -8, motion),
            );
        } else {
            const hold = Math.min(1, Math.max(0, (progress - 0.35) / 0.65));
            const shake = Math.sin(hold * Math.PI * 5) * 16;
            const pulse = Math.sin(hold * Math.PI * 2.5) * 0.9;
            setCraftrasSlayerPose(body, 26.5 + pulse, 13.9 + pulse, 70 + shake, -8 + shake * 0.14);
        }
        return;
    }

    if (heldItem === "worldedit_axe") {
        body.slayerSwingPhase = 0;
        body.slayerSwingActive = false;
        body.slayerFireWasDown = !!body.control.fire;
        body.craftrasMiningHitKeys = new Set();
        body.craftrasCombatHitIds = new Set();
        body.craftrasPreviousToolSegment = null;
        setCraftrasSlayerPose(body, 20, CRAFTRAS_SLAYER_GRIP_OFFSET, CRAFTRAS_SLAYER_IDLE_ANGLE);
        return;
    }

    const fireDown = !!body.control.fire;
    const firePressed = fireDown && !body.slayerFireWasDown;
    body.slayerFireWasDown = fireDown;

    if (firePressed && !body.slayerSwingActive) {
        body.slayerSwingPhase = 0;
        body.slayerSwingActive = true;
        if (heldItem === "the_great_friend") body.craftrasGreatFriendSwingSide = (body.craftrasGreatFriendSwingSide || 0) ^ 1;
        body.craftrasMiningHitKeys = new Set();
        body.craftrasCombatHitIds = new Set();
        body.craftrasPreviousToolSegment = null;
    }

    if (!body.slayerSwingActive) {
        body.craftrasPreviousToolSegment = null;
        if (hasSwordEquipped) {
            setCraftrasSlayerPose(body, 18.5, CRAFTRAS_SWORD_IDLE_GRIP_OFFSET, CRAFTRAS_SWORD_IDLE_ANGLE, CRAFTRAS_SWORD_IDLE_GRIP_ANGLE);
        } else {
            setCraftrasSlayerPose(body, 20, CRAFTRAS_SLAYER_GRIP_OFFSET, CRAFTRAS_SLAYER_IDLE_ANGLE);
        }
        return;
    }

    const swingFrames = 24;
    const phase = Math.min(body.slayerSwingPhase ?? 0, swingFrames - 1);
    if (phase === 0) {
        body.craftrasMiningHitKeys = new Set();
        body.craftrasCombatHitIds = new Set();
    }
    const progress = phase / (swingFrames - 1);
    const friendReverseSwing = heldItem === "the_great_friend" && (body.craftrasGreatFriendSwingSide || 0) === 1;
    const swingMotion = hasSwordEquipped ? (friendReverseSwing ? {
        idleAngle: -169,
        idleGripAngle: 73,
        idleGripOffset: CRAFTRAS_SWORD_IDLE_GRIP_OFFSET,
        windupAngle: 129,
        windupGripAngle: 99,
        windupGripOffset: CRAFTRAS_SWORD_WINDUP_GRIP_OFFSET,
        cutEndAngle: -93,
        cutGripAngle: -63,
        cutGripOffset: CRAFTRAS_SWORD_CUT_GRIP_OFFSET,
        recoverAngle: -169,
        recoverGripAngle: 73,
        windupEnd: 0.18,
        cutEnd: 0.62,
        idleSize: 18.5,
        cutSize: 27,
    } : {
        idleAngle: CRAFTRAS_SWORD_IDLE_ANGLE,
        idleGripAngle: CRAFTRAS_SWORD_IDLE_GRIP_ANGLE,
        idleGripOffset: CRAFTRAS_SWORD_IDLE_GRIP_OFFSET,
        windupAngle: CRAFTRAS_SWORD_WINDUP_ANGLE,
        windupGripAngle: CRAFTRAS_SWORD_WINDUP_GRIP_ANGLE,
        windupGripOffset: CRAFTRAS_SWORD_WINDUP_GRIP_OFFSET,
        cutEndAngle: CRAFTRAS_SWORD_CUT_END_ANGLE,
        cutGripAngle: CRAFTRAS_SWORD_CUT_GRIP_ANGLE,
        cutGripOffset: CRAFTRAS_SWORD_CUT_GRIP_OFFSET,
        recoverAngle: CRAFTRAS_SWORD_RECOVER_ANGLE,
        recoverGripAngle: CRAFTRAS_SWORD_RECOVER_GRIP_ANGLE,
        windupEnd: 0.18,
        cutEnd: 0.62,
        idleSize: 18.5,
        cutSize: 27,
    }) : {
        idleAngle: CRAFTRAS_SLAYER_IDLE_ANGLE,
        idleGripAngle: CRAFTRAS_SLAYER_GRIP_ANGLE,
        idleGripOffset: CRAFTRAS_SLAYER_GRIP_OFFSET,
        windupAngle: CRAFTRAS_SLAYER_WINDUP_ANGLE,
        windupGripAngle: CRAFTRAS_SLAYER_WINDUP_GRIP_ANGLE,
        windupGripOffset: CRAFTRAS_SLAYER_WINDUP_GRIP_OFFSET,
        cutEndAngle: CRAFTRAS_SLAYER_CUT_END_ANGLE,
        cutGripAngle: CRAFTRAS_SLAYER_CUT_GRIP_ANGLE,
        cutGripOffset: CRAFTRAS_SLAYER_CUT_GRIP_OFFSET,
        recoverAngle: CRAFTRAS_SLAYER_RECOVER_ANGLE,
        recoverGripAngle: CRAFTRAS_SLAYER_RECOVER_GRIP_ANGLE,
        windupEnd: 0.22,
        cutEnd: 0.66,
        idleSize: 20,
        cutSize: 23,
    };
    let swordAngle;
    let gripAngle;
    let gripOffset;
    let poseSize = 21;
    let cutting = false;

    if (progress < swingMotion.windupEnd) {
        const motion = craftrasSlayerEaseIn(progress / swingMotion.windupEnd);
        swordAngle = craftrasSlayerLerp(swingMotion.idleAngle, swingMotion.windupAngle, motion);
        gripAngle = craftrasSlayerLerp(swingMotion.idleGripAngle, swingMotion.windupGripAngle, motion);
        gripOffset = craftrasSlayerLerp(swingMotion.idleGripOffset, swingMotion.windupGripOffset, motion);
        poseSize = swingMotion.idleSize;
    } else if (progress < swingMotion.cutEnd) {
        const motion = craftrasSlayerEaseOut((progress - swingMotion.windupEnd) / (swingMotion.cutEnd - swingMotion.windupEnd));
        swordAngle = craftrasSlayerLerp(swingMotion.windupAngle, swingMotion.cutEndAngle, motion);
        gripAngle = craftrasSlayerLerp(swingMotion.windupGripAngle, swingMotion.cutGripAngle, motion);
        gripOffset = craftrasSlayerLerp(swingMotion.windupGripOffset, swingMotion.cutGripOffset, motion);
        poseSize = swingMotion.cutSize;
        cutting = true;
    } else {
        const motion = craftrasSlayerEaseOut((progress - swingMotion.cutEnd) / (1 - swingMotion.cutEnd));
        swordAngle = craftrasSlayerLerp(swingMotion.cutEndAngle, swingMotion.recoverAngle, motion);
        gripAngle = craftrasSlayerLerp(swingMotion.cutGripAngle, swingMotion.recoverGripAngle, motion);
        gripOffset = craftrasSlayerLerp(swingMotion.cutGripOffset, swingMotion.idleGripOffset, motion);
        poseSize = craftrasSlayerLerp(21, swingMotion.idleSize, motion);
    }

    const swingStep = heldItem === "admin_pickaxe" ? 4 : heldItem === "the_great_friend" ? 2 : 1;
    if (phase + swingStep >= swingFrames) {
        body.slayerSwingPhase = 0;
        body.slayerSwingActive = fireDown;
        if (fireDown) {
            if (heldItem === "the_great_friend") body.craftrasGreatFriendSwingSide = (body.craftrasGreatFriendSwingSide || 0) ^ 1;
            body.craftrasMiningHitKeys = new Set();
            body.craftrasCombatHitIds = new Set();
        }
    } else {
        body.slayerSwingPhase = phase + swingStep;
    }
    setCraftrasSlayerPose(body, poseSize, gripOffset, swordAngle, gripAngle);
    const currentToolSegment = getCraftrasToolSegment(body, toolInfo.type, poseSize, gripOffset, swordAngle, gripAngle);
    if (!cutting) {
        body.craftrasPreviousToolSegment = progress < 0.22 ? currentToolSegment : null;
        return;
    }
    const toolSegments = getCraftrasSweptToolSegments(body.craftrasPreviousToolSegment, currentToolSegment);
    body.craftrasPreviousToolSegment = currentToolSegment;

    global.gameManager?.gamemodeManager?.gameCraftras?.damageWallsInSlash(body, {
        toolSegments,
        damage: getCraftrasToolDamage(heldItem),
    });
    global.gameManager?.gamemodeManager?.gameCraftras?.damageMobsInSlash(body, {
        toolSegments,
        damage: getCraftrasToolDamage(heldItem),
        heldItem,
    });
    global.gameManager?.gamemodeManager?.gameCraftras?.damagePlayersInSlash(body, {
        toolSegments,
        damage: getCraftrasToolDamage(heldItem),
        heldItem,
    });
};

const craftrasSlayerGuardDamage = ({ body }) => {
    if (!body.control.alt || body.damageReceived <= 0) return;
    const game = global.gameManager?.gamemodeManager?.gameCraftras;
    if (game) body.damageReceived = game.absorbShieldDamage(body, body.damageReceived);
};

const CRAFTRAS_MOB_BODY = {
    ACCELERATION: 1.6,
    HEALTH: 100,
    SHIELD: 0,
    REGEN: 0,
    DAMAGE: 0,
    PENETRATION: 1,
    RESIST: 1,
    FOV: 1.25,
    DENSITY: 0.5,
    PUSHABILITY: 1,
};

Class.craftrasSkeletonBullet = {
    PARENT: "bullet",
    LABEL: "Craftras Skeleton Bullet",
    BODY: {
        DAMAGE: 0.01,
        HEALTH: 1,
        PENETRATION: 1,
    },
};


Class.craftrasM134Bullet = {
    PARENT: "craftrasSkeletonBullet",
    LABEL: "Craftras M134 Bullet",
    BODY: {
        DAMAGE: 5,
        HEALTH: 1,
        PENETRATION: 1,
    },
};

Class.craftrasRocketBullet = {
    PARENT: "craftrasSkeletonBullet",
    LABEL: "Craftras Rocket Bullet",
    COLOR: "red",
    SIZE: 8,
    INTANGIBLE: true,
    NO_COLLISIONS: true,
    DIE_AT_RANGE: false,
    BODY: {
        DAMAGE: 0,
        HEALTH: 1e6,
        PENETRATION: 1e6,
        RANGE: 1e6,
    },
};

Class.craftrasBoneBombProjectile = {
    PARENT: "genericEntity",
    LABEL: "Craftras Bone Bomb",
    TYPE: "tank",
    COLOR: "#e7e0d6",
    BORDERLESS: false,
    SIZE: 28,
    SHAPE: 5,
    INDEPENDENT: true,
    INTANGIBLE: true,
    NO_COLLISIONS: true,
    HITS_OWN_TYPE: "never",
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: {
        SPEED: 0,
        ACCELERATION: 0,
        HEALTH: 1e6,
        DAMAGE: 0,
        PENETRATION: 1e6,
        DENSITY: 0,
        PUSHABILITY: 0,
    },
};

Class.craftrasPopeCube = {
    PARENT: "genericEntity",
    LABEL: "Craftras Pope Cube",
    TYPE: "tank",
    COLOR: "#ffd84d",
    SIZE: 21,
    SHAPE: Class.cube.SHAPE,
    FACING_TYPE: ["spin", { speed: 0.08, independent: true }],
    INDEPENDENT: true,
    INTANGIBLE: true,
    NO_COLLISIONS: true,
    HITS_OWN_TYPE: "never",
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: {
        SPEED: 0,
        ACCELERATION: 0,
        HEALTH: 1e9,
        SHIELD: 0,
        REGEN: 0,
        DAMAGE: 0,
        PENETRATION: 0,
        DENSITY: 0,
        PUSHABILITY: 0,
    },
};

Class.craftrasPopeJudgmentBullet = {
    PARENT: "craftrasPopeCube",
    LABEL: "Craftras Pope Judgment Bullet",
    COLOR: "yellow",
    SIZE: 70,
    SHAPE: 0,
    ALPHA: 0.45,
};

Class.craftrasPopeJudgmentParticle = {
    PARENT: "craftrasPopeCube",
    LABEL: "Craftras Pope Judgment Particle",
    COLOR: "yellow",
    SIZE: 200,
    SHAPE: 0,
    ALPHA: 0.45,
    BORDERLESS: true,
    DRAW_FILL: true,
    LAYER: 12,
};

Class.craftrasPopeJudgmentBeam = {
    PARENT: "craftrasPopeCube",
    LABEL: "Craftras Pope Judgment Beam",
    COLOR: "yellow",
    SIZE: 1,
    SHAPE: [[-1, -0.035], [1, -0.035], [1, 0.035], [-1, 0.035]],
    ALPHA: 0.45,
    DRAW_FILL: true,
    BORDERLESS: false,
    LAYER: 12,
};

Class.craftrasM134Mount = {
    PARENT: "genericTank",
    LABEL: "Craftras M134 Mount",
    COLOR: "black",
    SHAPE: 0,
    MIRROR_MASTER_ANGLE: true,
    FACING_TYPE: "bound",
    HAS_NO_RECOIL: true,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: {
        DAMAGE: 0,
        HEALTH: 1e9,
        SHIELD: 1e9,
        REGEN: 1e6,
        DENSITY: 0,
        SPEED: 0,
        PUSHABILITY: 0,
    },
    GUNS: [{
        POSITION: [1, 1, 1, 0, 0, 0, 0],
        PROPERTIES: {
            ALPHA: 0,
        },
    }],
};

Class.craftrasRocketLauncherMount = {
    PARENT: "craftrasM134Mount",
    LABEL: "Craftras Rocket Launcher Mount",
};

Class.craftrasZombie = {
    PARENT: "genericTank",
    LABEL: "Zombie",
    COLOR: "#48a84f",
    SIZE: 24,
    DISPLAY_NAME: true,
    DRAW_HEALTH: true,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 2 },
};

Class.craftrasMobIronHelmet = {
    PARENT: "genericTank",
    LABEL: "Craftras Mob Iron Helmet",
    COLOR: "grey",
    ALPHA: 0,
    SHAPE: 0,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: {
        DAMAGE: 0,
        HEALTH: 1e9,
        SHIELD: 1e9,
        REGEN: 1e6,
        DENSITY: 0,
        SPEED: 0,
        PUSHABILITY: 0,
    },
};

Class.craftrasMobDiamondHelmet = {
    PARENT: "craftrasMobIronHelmet",
    LABEL: "Craftras Mob Diamond Helmet",
};

Class.craftrasMobIronHelmetSide = {
    PARENT: "craftrasMobIronHelmet",
    LABEL: "Craftras Mob Iron Helmet Side",
};

Class.craftrasMobDiamondHelmetSide = {
    PARENT: "craftrasMobIronHelmetSide",
    LABEL: "Craftras Mob Diamond Helmet Side",
};

Class.craftrasMobIronSword = {
    PARENT: "genericTank",
    LABEL: "Craftras Mob Iron Sword",
    COLOR: "#d5d9de",
    SHAPE: [
        [-0.45, -0.08], [0.1, -0.08], [0.1, -0.18], [0.24, -0.18],
        [0.24, -0.08], [1.45, -0.08], [1.8, 0], [1.45, 0.08],
        [0.24, 0.08], [0.24, 0.18], [0.1, 0.18], [0.1, 0.08],
        [-0.45, 0.08],
    ],
    MIRROR_MASTER_ANGLE: true,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: {
        DAMAGE: 0,
        HEALTH: 1e9,
        SHIELD: 1e9,
        REGEN: 1e6,
        DENSITY: 0,
        SPEED: 0,
        PUSHABILITY: 0,
    },
};

Class.craftrasMobDiamondSword = {
    PARENT: "craftrasMobIronSword",
    LABEL: "Craftras Mob Diamond Sword",
    COLOR: "#5fe4f2",
};

Class.craftrasIronHelmetZombie = {
    PARENT: "craftrasZombie",
    LABEL: "Iron Helmet Zombie",
};

Class.craftrasDiamondHelmetZombie = {
    PARENT: "craftrasZombie",
    LABEL: "Diamond Helmet Zombie",
};

Class.craftrasIronSwordZombie = {
    PARENT: "craftrasZombie",
    LABEL: "Iron Sword Zombie",
    TURRETS: [{
        POSITION: [0.001, 6.5, 4.5, -35, 360, 1],
        TYPE: "craftrasMobIronSword",
    }],
};

const makeCraftrasVillageNpc = (label, color, size = 24, speed = 1.5, turrets = []) => ({
    PARENT: "genericTank",
    LABEL: label,
    COLOR: color,
    SIZE: size,
    DISPLAY_NAME: true,
    DRAW_HEALTH: false,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: speed },
    TURRETS: turrets,
});

Class.craftrasVillager = makeCraftrasVillageNpc("Villager", "#4169d8", 23, 1.35);

Class.craftrasChallengeKing = makeCraftrasVillageNpc("King", "#4169d8", 28, 1.2, [
    {
        POSITION: [8.8, 4.2, 0, 0, 360, 2],
        TYPE: "craftrasHelmetCrown",
    },
]);
Class.craftrasChallengeKing.DRAW_HEALTH = true;

Class.craftrasRoyalGuardian = makeCraftrasVillageNpc("Royal Guardian", "#4169d8", 27, 1.45, [
    {
        POSITION: [8.4, 4.1, 0, 0, 360, 2],
        TYPE: "craftrasMobIronHelmet",
    },
    {
        POSITION: [0.001, 10, 0, 180, 360, 1],
        TYPE: "craftrasOffhandKnightShield",
    },
    {
        POSITION: [6.8, 6.7, 4.7, -35, 360, 1],
        TYPE: "craftrasHeldIronSword",
    },
]);
Class.craftrasRoyalGuardian.DRAW_HEALTH = true;

Class.craftrasCleric = makeCraftrasVillageNpc("Cleric", "#dfe8ff", 24, 1.25, [
    {
        POSITION: [6.2, 3, 0, 0, 360, 2],
        TYPE: "craftrasClericHat",
    },
    {
        POSITION: [7.4, 6.2, 4.3, -45, 360, 1],
        TYPE: "craftrasClericStaff",
    },
]);

Class.craftrasMerchant = makeCraftrasVillageNpc("Merchant", "#4aa66a", 24, 1.25, [
    {
        POSITION: [7, 3.35, 0, 0, 360, 2],
        TYPE: "craftrasMerchantHat",
    },
]);
Class.craftrasMonsterMerchant = makeCraftrasVillageNpc("Monster Merchant", "#7b4ac8", 24, 1.25, [
    {
        POSITION: [7, 3.35, 0, 0, 360, 2],
        TYPE: "craftrasMonsterMerchantHat",
    },
]);

Class.craftrasPope = makeCraftrasVillageNpc("Pope", "#f4f0ff", 27, 1.2, [
    {
        POSITION: [7.4, 3.2, 0, 0, 360, 2],
        TYPE: "craftrasPopeHat",
    },
    {
        POSITION: [8.2, 6.3, 4.5, -42, 360, 1],
        TYPE: "craftrasPopeStaff",
    },
]);

Class.craftrasBlesser = makeCraftrasVillageNpc("Blesser", "#d7f8ff", 25, 1.35, [
    {
        POSITION: [6.9, 3.1, 0, 0, 360, 2],
        TYPE: "craftrasBlesserHat",
    },
    {
        POSITION: [7.7, 6.2, 4.3, -42, 360, 1],
        TYPE: "craftrasBlesserStaff",
    },
]);

Class.craftrasVillageGuard = makeCraftrasVillageNpc("Village Guard", "#4169d8", 25, 4.7, [
    {
        POSITION: [8.2, 4, 0, 0, 360, 2],
        TYPE: "craftrasMobIronHelmet",
    },
    {
        POSITION: [6.5, 6.5, 4.5, -35, 360, 1],
        TYPE: "craftrasHeldIronSword",
    },
]);
Class.craftrasVillageGuard.DRAW_HEALTH = true;

Class.craftrasKnightCaptain = makeCraftrasVillageNpc("Knight Captain", "#4169d8", 29, 5.3, [
    {
        POSITION: [8.8, 4.2, 0, 0, 360, 2],
        TYPE: "craftrasMobDiamondHelmet",
    },
    {
        POSITION: [7.2, 7, 5, -35, 360, 1],
        TYPE: "craftrasHeldDiamondSword",
    },
]);
Class.craftrasKnightCaptain.DRAW_HEALTH = true;

Class.craftrasBlacksmith = {
    PARENT: "genericTank",
    LABEL: "Blacksmith",
    COLOR: "#4169d8",
    SIZE: 26,
    DISPLAY_NAME: true,
    DRAW_HEALTH: false,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 1 },
    TURRETS: [
        {
            POSITION: [8.5, 4, 0, 0, 360, 2],
            TYPE: "craftrasMobIronHelmet",
        },
        {
            POSITION: [1, 6.64, 4.82, -28, 360, 1],
            TYPE: "craftrasHeldBlacksmithHammer",
        },
    ],
};

Class.craftrasBuilder = {
    PARENT: "genericTank",
    LABEL: "Gold Helmet Builder",
    COLOR: "#4169d8",
    SIZE: 24,
    DISPLAY_NAME: true,
    DRAW_HEALTH: false,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 8.8 },
    TURRETS: [
        {
            POSITION: [0.001, 6.64, 4.82, CRAFTRAS_SLAYER_IDLE_ANGLE, 360, 1],
            TYPE: ["craftrasHeldDiamondPickaxe", { ALPHA: 0 }],
        },
        ...CRAFTRAS_HELD_BLOCK_TYPES.map(type => ({
            POSITION: [0.001, 10, 0, 0, 360, 1],
            TYPE: [type, { ALPHA: 0 }],
        })),
    ],
    ON: [
        { event: "tick", handler: craftrasSlayerTick },
    ],
};

Class.craftrasSkeleton = {
    PARENT: "genericTank",
    LABEL: "Skeleton",
    COLOR: "#eeeeee",
    SIZE: 24,
    DISPLAY_NAME: true,
    DRAW_HEALTH: true,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 1 },
    GUNS: [{
        POSITION: [18, 8, 1, 0, 0, 0, 0],
        PROPERTIES: {
            SHOOT_SETTINGS: combineStats([g.basic, { reload: 5.7142857143, speed: 2.25, maxSpeed: 2.25, damage: 0.01 }]),
            TYPE: "craftrasSkeletonBullet",
            AUTOFIRE: false,
        },
    }],
};

Class.craftrasSniperSkeleton = {
    PARENT: "sniper",
    LABEL: "Sniper Skeleton",
    COLOR: "#eeeeee",
    SIZE: 24,
    DISPLAY_NAME: true,
    DRAW_HEALTH: true,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 1 },
    GUNS: [{
        POSITION: [24, 8, 1, 0, 0, 0, 0],
        PROPERTIES: {
            SHOOT_SETTINGS: combineStats([g.basic, { reload: 11.4285714286, speed: 4.5, maxSpeed: 4.5, damage: 0.01, spray: 0.05 }]),
            TYPE: "craftrasSkeletonBullet",
            AUTOFIRE: false,
        },
    }],
};

Class.craftrasCannonSkeleton = {
    PARENT: "annihilator",
    LABEL: "Cannon Skeleton",
    COLOR: "#eeeeee",
    SIZE: 24,
    DISPLAY_NAME: true,
    DRAW_HEALTH: true,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 1 },
    GUNS: [{
        POSITION: [20.5, 19.5, 1, 0, 0, 0, 0],
        PROPERTIES: {
            SHOOT_SETTINGS: combineStats([g.basic, { reload: 11.4285714286, speed: 1.35, maxSpeed: 1.35, damage: 1, spray: 2 }]),
            TYPE: "craftrasSkeletonBullet",
            AUTOFIRE: false,
        },
    }],
};

Class.craftrasSwordGuy = {
    PARENT: "genericTank",
    LABEL: "Sword guy",
    COLOR: "#ffffff",
    SIZE: 32,
    SHAPE: 0,
    DISPLAY_NAME: true,
    DRAW_HEALTH: true,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 4, DENSITY: 1.3, PUSHABILITY: 0.2, DAMAGE: 0 },
    TURRETS: [
        {
            POSITION: [6.8, 6.2, 4.8, -35, 360, 1],
            TYPE: "craftrasHeldDiamondSword",
        },
        {
            POSITION: [8.2, 6.6, 5.4, -35, 360, 1],
            TYPE: ["craftrasHeldTheGreat", { ALPHA: 0 }],
        },
    ],
    GUNS: [],
};

Class.craftrasTheSword = {
    PARENT: "craftrasSwordGuy",
    LABEL: "THE SWORD",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 2, DENSITY: 1.3, PUSHABILITY: 0.2, DAMAGE: 0 },
    TURRETS: [
        {
            POSITION: [8.2, 6.6, 5.4, -35, 360, 1],
            TYPE: "craftrasHeldTheGreat",
        },
    ],
    GUNS: [],
};

Class.craftrasCreeper = {
    PARENT: "genericTank",
    LABEL: "Bomber",
    COLOR: "#78d66c",
    SIZE: 24,
    DISPLAY_NAME: true,
    DRAW_HEALTH: true,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 4.5 },
};

Class.craftrasAnnihilator = {
    PARENT: "craftrasCreeper",
    LABEL: "Annihilator",
    SIZE: 72,
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 3.2, DENSITY: 8, PUSHABILITY: 0.1 },
};

Class.craftrasNuclear = {
    PARENT: "craftrasCreeper",
    LABEL: "The Nuclear",
    COLOR: "#ff3030",
    SIZE: 72,
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 0, ACCELERATION: 0, DENSITY: 25, PUSHABILITY: 0 },
};

const makeCraftrasAnimal = (label, color, size, speed) => ({
    PARENT: "genericTank",
    LABEL: label,
    COLOR: color,
    SIZE: size,
    DISPLAY_NAME: true,
    DRAW_HEALTH: true,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: speed, DAMAGE: 0 },
});

Class.craftrasCow = makeCraftrasAnimal("Cow", "#8a5a35", 26, 2.4);
Class.craftrasPig = makeCraftrasAnimal("Pig", "#ef91aa", 23, 2.8);
Class.craftrasChicken = makeCraftrasAnimal("Chicken", "#f4f1e8", 17, 3.2);

const CRAFTRAS_QUEEN_SPIDER_LEG_ANGLES = [35, 65, 115, 145, 215, 245, 295, 325];
const makeCraftrasQueenSpiderTwoSegmentLegs = () => CRAFTRAS_QUEEN_SPIDER_LEG_ANGLES.flatMap((angle, index) => {
    const bend = index < 4 ? -8 : 8;
    const counterAngle = -bend * Math.PI / 180;
    return [
        { POSITION: [12, 2.5, 1, 0, 0, angle, 0], PROPERTIES: { COLOR: "#40372b" } },
        { POSITION: [10, 2.2, 1, 12 * Math.cos(counterAngle), 12 * Math.sin(counterAngle), angle + bend, 0], PROPERTIES: { COLOR: "#40372b" } },
    ];
});
const makeCraftrasSpiderThreeSegmentLegs = (color = "#40372b") => CRAFTRAS_QUEEN_SPIDER_LEG_ANGLES.flatMap((angle, index) => {
    const bend = index < 4 ? -8 : 8;
    const bendRadians = bend * Math.PI / 180;
    const firstJoint = 14.5;
    const segmentLength = 5.5;
    const secondX = firstJoint * Math.cos(-bendRadians);
    const secondY = firstJoint * Math.sin(-bendRadians);
    const thirdX = firstJoint * Math.cos(-2 * bendRadians) + segmentLength * Math.cos(-bendRadians);
    const thirdY = firstJoint * Math.sin(-2 * bendRadians) + segmentLength * Math.sin(-bendRadians);
    return [
        { POSITION: [segmentLength, 2.5, 1, 9, 0, angle, 0], PROPERTIES: { COLOR: color } },
        { POSITION: [segmentLength, 2.3, 1, secondX, secondY, angle + bend, 0], PROPERTIES: { COLOR: color } },
        { POSITION: [segmentLength, 2, 1, thirdX, thirdY, angle + bend * 2, 0], PROPERTIES: { COLOR: color } },
    ];
});

Class.craftrasSpider = {
    PARENT: "genericTank",
    LABEL: "Spider",
    COLOR: "#20141f",
    SIZE: 25,
    DISPLAY_NAME: true,
    DRAW_HEALTH: true,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 3.5 },
    GUNS: makeCraftrasSpiderThreeSegmentLegs("#20141f"),
};

Class.craftrasToxicSpider = {
    PARENT: "craftrasSpider",
    LABEL: "Cave Spider",
    COLOR: "#452066",
    SIZE: 22,
    GUNS: makeCraftrasSpiderThreeSegmentLegs("#452066"),
};
const makeCraftrasQueenSpider = guns => ({
    PARENT: "genericTank",
    LABEL: "Queen Spider",
    COLOR: "#40372b",
    SIZE: 240,
    DISPLAY_NAME: true,
    DRAW_HEALTH: true,
    HEALTH_WITH_LEVEL: false,
    SKILL_CAP: Array(10).fill(0),
    LEVEL_CAP: 0,
    CONTROLLERS: [],
    FACING_TYPE: "toTarget",
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 3.5 / 1.5, DENSITY: 12, PUSHABILITY: 0 },
    GUNS: guns,
});

Class.craftrasQueenSpiderSaved = makeCraftrasQueenSpider(makeCraftrasQueenSpiderTwoSegmentLegs());
Class.craftrasQueenSpider = makeCraftrasQueenSpider(makeCraftrasSpiderThreeSegmentLegs());

Class.queen_spider = {
    PARENT: "craftrasQueenSpider",
    LABEL: "Queen Spider",
};
Class.queenSpider = {
    PARENT: "queen_spider",
    LABEL: "Queen Spider",
};
Class.queenSpiderSaved = {
    PARENT: "craftrasQueenSpiderSaved",
    LABEL: "Queen Spider Saved",
};

Class.craftrasSpiderEgg = {
    PARENT: "genericEntity",
    LABEL: "Spider Egg",
    TYPE: "tank",
    SHAPE: 0,
    COLOR: "#d8d1c0",
    SIZE: 16,
    ALPHA: 0.9,
    INTANGIBLE: true,
    NO_COLLISIONS: true,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: { SPEED: 0, ACCELERATION: 0, HEALTH: 1e9, SHIELD: 0, REGEN: 0, DAMAGE: 0, PENETRATION: 0, DENSITY: 0, PUSHABILITY: 0 },
};

Class.craftrasSpiderWeb = {
    PARENT: "craftrasSpiderEgg",
    LABEL: "Spider Web",
    COLOR: "#eeeeee",
    SIZE: 34,
    ALPHA: 0.38,
    SHAPE: 8,
};

Class.craftrasSpiderWebProjectile = {
    PARENT: "craftrasSpiderEgg",
    LABEL: "Spider Web Projectile",
    COLOR: "#eeeeee",
    SIZE: 8,
    ALPHA: 0.8,
};

Class.craftrasGiantZombie = {
    PARENT: "craftrasZombie",
    LABEL: "Giant Zombie",
    SIZE: 48,
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 1.8, DENSITY: 8, PUSHABILITY: 0 },
};

Class.craftrasRunnerZombie = {
    PARENT: "craftrasZombie",
    LABEL: "Runner Zombie",
    COLOR: "#276b32",
    SIZE: 19.2,
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 3, DENSITY: 0.8, PUSHABILITY: 0.7 },
};

Class.craftrasCursedZombie = {
    PARENT: "craftrasGiantZombie",
    LABEL: "Cursed Zombie",
    COLOR: "#080808",
    SIZE: 48,
    ALPHA: 0.4,
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 3, DENSITY: 0.8, PUSHABILITY: 0.7 },
};

Class.craftrasTitanZombie = {
    PARENT: "craftrasGiantZombie",
    LABEL: "Titan Zombie",
    COLOR: "#315d35",
    SIZE: 96,
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 4, DENSITY: 4, PUSHABILITY: 1.8 },
};

Class.craftrasKingZombie = {
    PARENT: "craftrasZombie",
    LABEL: "King Zombie",
    SIZE: 24,
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 1.45, DENSITY: 1.2, PUSHABILITY: 0.4 },
};

Class.craftrasKingGuardian = {
    PARENT: "craftrasGiantZombie",
    LABEL: "Knight Zombie",
    SIZE: 48,
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 2, DENSITY: 10, PUSHABILITY: 0 },
};

Class.craftrasGuardianSlashProjectile = {
    PARENT: "craftrasSkeletonBullet",
    LABEL: "Craftras Guardian Slash",
    COLOR: "#e8f2ff",
    SIZE: 36,
    ALPHA: 0.95,
    BODY: {
        DAMAGE: 0.01,
        HEALTH: 1,
        PENETRATION: 1,
    },
};

Class.craftrasTheGreatFriend = {
    PARENT: "genericEntity",
    LABEL: "The Great's friend",
    TYPE: "tank",
    COLOR: "#fff4b8",
    SHAPE: 0,
    SIZE: 33,
    ALPHA: 1,
    LAYER: 13,
    DIE_AT_RANGE: false,
    SEND_ALL_MOCKUPS: true,
    INDEPENDENT: true,
    INTANGIBLE: true,
    NO_COLLISIONS: true,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: { SPEED: 0, ACCELERATION: 0, HEALTH: 1e9, SHIELD: 0, REGEN: 0, DAMAGE: 0, PENETRATION: 0, DENSITY: 0, PUSHABILITY: 0 },
};

Class.craftrasTheGreatCompanionFriend = {
    PARENT: "craftrasTheGreatFriend",
    SIZE: 27.5,
};

Class.craftrasTheGreatBullet = {
    PARENT: "genericEntity",
    LABEL: "The Great Bullet",
    TYPE: "tank",
    COLOR: "#fff4b8",
    SHAPE: 0,
    SIZE: 12,
    ALPHA: 0.85,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: { SPEED: 0, ACCELERATION: 0, HEALTH: 1e9, SHIELD: 0, REGEN: 0, DAMAGE: 0, PENETRATION: 0, DENSITY: 0, PUSHABILITY: 0 },
};

Class.craftrasChallengeMagicBullet = {
    PARENT: "genericEntity",
    LABEL: "Challenge Magic Bullet",
    TYPE: "tank",
    COLOR: "#b58cff",
    SHAPE: 0,
    SIZE: 18,
    ALPHA: 0.9,
    INTANGIBLE: true,
    NO_COLLISIONS: true,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: { SPEED: 0, ACCELERATION: 0, HEALTH: 1e9, SHIELD: 0, REGEN: 0, DAMAGE: 0, PENETRATION: 0, DENSITY: 0, PUSHABILITY: 0 },
};

Class.craftrasChallengeMagicCube = {
    PARENT: "craftrasChallengeMagicBullet",
    LABEL: "Challenge Magic Cube",
    COLOR: "#774bd8",
    SHAPE: 4,
    SIZE: 25,
    ALPHA: 0.88,
};

Class.craftrasChallengeMagicCircle = {
    PARENT: "craftrasChallengeMagicBullet",
    LABEL: "Magical Zombie Magic Circle",
    COLOR: "#6f437e",
    SHAPE: 0,
    SIZE: 28,
    ALPHA: 0.82,
};

Class.craftrasTheGreatWarningLine = {
    PARENT: "genericEntity",
    LABEL: "The Great Warning",
    TYPE: "tank",
    COLOR: "#ff4040",
    SHAPE: [[-10, -0.08], [10, -0.08], [10, 0.08], [-10, 0.08]],
    SIZE: 6,
    ALPHA: 0.78,
    SEND_ALL_MOCKUPS: true,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: { SPEED: 0, ACCELERATION: 0, HEALTH: 1e9, SHIELD: 0, REGEN: 0, DAMAGE: 0, PENETRATION: 0, DENSITY: 0, PUSHABILITY: 0 },
};

Class.craftrasExplosionEffect = {
    PARENT: "genericEntity",
    LABEL: "Creeper Explosion",
    TYPE: "tank",
    SHAPE: 0,
    COLOR: "#f4efdf",
    ALPHA: 0.45,
    INTANGIBLE: true,
    NO_COLLISIONS: true,
    HITS_OWN_TYPE: "never",
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: {
        SPEED: 0,
        ACCELERATION: 0,
        HEALTH: 1e9,
        SHIELD: 0,
        REGEN: 0,
        DAMAGE: 0,
        PENETRATION: 0,
        DENSITY: 0,
        PUSHABILITY: 0,
    },
};

Class.slayerSword = {
    PARENT: "genericTank",
    LABEL: "Slayer Sword",
    COLOR: "veryLightGrey",
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    MIRROR_MASTER_ANGLE: true,
    SHAPE: [
        [-0.55, -0.09], [-0.18, -0.09], [-0.18, -0.34], [0.04, -0.34],
        [0.04, -0.14], [1.42, -0.14], [2.12, 0], [1.42, 0.14],
        [0.04, 0.14], [0.04, 0.34], [-0.18, 0.34], [-0.18, 0.09], [-0.55, 0.09],
    ],
    BODY: {
        DAMAGE: 0,
        HEALTH: 1e9,
        SHIELD: 1e9,
        REGEN: 1e6,
        DENSITY: 0,
        SPEED: 0,
        PUSHABILITY: 0,
    },
};

const CRAFTRAS_HELD_TOOL_ITEMS = [
    "sword",
    "admin_pickaxe", "worldedit_axe", "destroyer",
    "wooden_pickaxe", "stone_pickaxe", "iron_pickaxe", "gold_pickaxe", "diamond_pickaxe",
    "wooden_axe", "stone_axe", "iron_axe", "gold_axe", "diamond_axe",
    "wooden_shovel", "stone_shovel", "iron_shovel", "gold_shovel", "diamond_shovel",
    "wooden_sword", "stone_sword", "iron_sword", "gold_sword", "diamond_sword",
    "venom_sword", "the_great", "the_great_friend",
    "blacksmith_hammer",
    "cleric_staff", "cleric_staff_op", "pope_staff", "blesser_staff",
];

const getCraftrasHeldToolClassName = itemId => `craftrasHeld${itemId
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;

for (const itemId of CRAFTRAS_HELD_TOOL_ITEMS) {
    const toolInfo = getCraftrasToolInfo(itemId);
    Class[getCraftrasHeldToolClassName(itemId)] = makeCraftrasTool(itemId, toolInfo.type, toolInfo.color);
}

const makeCraftrasHeldBlock = (label, blockColor) => ({
    PARENT: "genericTank",
    LABEL: label,
    COLOR: blockColor,
    ALPHA: 0,
    SHAPE: 4,
    MIRROR_MASTER_ANGLE: true,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: {
        DAMAGE: 0,
        HEALTH: 1e9,
        SHIELD: 1e9,
        REGEN: 1e6,
        DENSITY: 0,
        SPEED: 0,
        PUSHABILITY: 0,
    },
});

Class.craftrasHeldGrass = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.grass_block, "#75b85a");
Class.craftrasHeldDirt = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.dirt, "#aa7b52");
Class.craftrasHeldDirtPath = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.dirt_path, "#9a7045");
Class.craftrasHeldStone = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.stone, "#8b9098");
Class.craftrasHeldCoal = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.coal, "#252a30");
Class.craftrasHeldIron = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.iron_ore, "#ded8ce");
Class.craftrasHeldGold = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.gold_ore, "#efc83c");
Class.craftrasHeldDiamond = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.diamond, "#4bd7e8");
Class.craftrasHeldWood = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.wood, "#c69963");
Class.craftrasHeldPlank = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.plank, "#c99b68");
Class.craftrasHeldCraftingTable = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.crafting_table, "#b88452");
Class.craftrasHeldFurnace = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.furnace, "#777d86");
Class.craftrasHeldChest = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.chest, "#a46b32");
Class.craftrasHeldBedrock = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.bedrock, "#111318");
Class.craftrasHeldCoalBlock = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.coal_block, "#252a30");
Class.craftrasHeldIronBlock = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.iron_block, "#d9dde2");
Class.craftrasHeldGoldBlock = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.gold_block, "#efc83c");
Class.craftrasHeldDiamondBlock = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.diamond_block, "#4bd7e8");
Class.craftrasHeldChallengeStartBlock = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.challenge_start_block, "#29d6b4");
Class.craftrasHeldChallengeSpawnBlock = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.challenge_spawn_block, "#73e67b");
Class.craftrasHeldTransparentBlock = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.transparent_block, "#419cff");
Class.craftrasHeldRouteMarkerBlock = makeCraftrasHeldBlock(CRAFTRAS_HELD_BLOCK_LABELS.route_marker_block, "#258dff");

for (const itemId of CRAFTRAS_HELD_ITEM_IDS) {
    Class[getCraftrasHeldItemClassName(itemId)] = makeCraftrasHeldBlock(`Held Item:${itemId}`, "#ffffff");
}
for (const itemId of Object.keys(CRAFTRAS_SHIELD_HEALTH)) {
    Class[`craftrasOffhand${getCraftrasHeldItemClassName(itemId).slice("craftrasHeldItem".length)}`] =
        makeCraftrasHeldBlock(`Offhand Shield:${itemId}`, "#ffffff");
}

const makeCraftrasHelmetPart = (label, shape) => ({
    PARENT: "genericTank",
    LABEL: label,
    COLOR: "#d9dde1",
    ALPHA: 0,
    SHAPE: shape,
    MIRROR_MASTER_ANGLE: true,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: {
        DAMAGE: 0,
        HEALTH: 1e9,
        SHIELD: 1e9,
        REGEN: 1e6,
        DENSITY: 0,
        SPEED: 0,
        PUSHABILITY: 0,
    },
});

Class.craftrasHelmetFront = makeCraftrasHelmetPart("Craftras Helmet Front", 5);
Class.craftrasHelmetSide = makeCraftrasHelmetPart("Craftras Helmet Side", 4);
Class.craftrasHelmetCrown = makeCraftrasHelmetPart("Craftras Helmet Crown", 6);
Class.craftrasPlayerClericHat = makeCraftrasHelmetPart("Craftras Player Hat:cleric_hat", 3);
Class.craftrasPlayerPopeHat = makeCraftrasHelmetPart("Craftras Player Hat:pope_hat", 3);
Class.craftrasPlayerBlesserHat = makeCraftrasHelmetPart("Craftras Player Hat:blesser_hat", 3);
Class.craftrasPlayerMerchantHat = makeCraftrasHelmetPart("Craftras Player Hat:merchant_hat", 3);
Class.craftrasPlayerMonsterMerchantHat = makeCraftrasHelmetPart("Craftras Player Hat:monster_merchant_hat", 3);
Class.craftrasMerchantHat = makeCraftrasHelmetPart("Merchant Hat", 3);
Class.craftrasMonsterMerchantHat = makeCraftrasHelmetPart("Monster Merchant Hat", 3);
Class.craftrasMagicalZombie = {
    PARENT: "craftrasGiantZombie",
    LABEL: "Magical Zombie",
    COLOR: "#3d7a46",
    SIZE: 48,
    BODY: { ...CRAFTRAS_MOB_BODY, SPEED: 6, DENSITY: 0, PUSHABILITY: 0 },
    TURRETS: [{
        POSITION: [7, 3.35, 0, 0, 360, 2],
        TYPE: "craftrasMonsterMerchantHat",
    }],
};
Class.craftrasClericHat = {
    PARENT: "genericTank",
    LABEL: "Cleric Hat",
    COLOR: "#f4e58d",
    ALPHA: 1,
    SHAPE: 3,
    MIRROR_MASTER_ANGLE: true,
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: {
        DAMAGE: 0,
        HEALTH: 1e9,
        SHIELD: 1e9,
        REGEN: 1e6,
        DENSITY: 0,
        SPEED: 0,
        PUSHABILITY: 0,
    },
};
Class.craftrasClericStaff = {
    PARENT: "genericTank",
    LABEL: "Craftras Cleric Staff",
    COLOR: "#f4e58d",
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    MIRROR_MASTER_ANGLE: true,
    SHAPE: [
        [-1.3, -0.08], [0.82, -0.08], [0.82, -0.24], [1.04, -0.42],
        [1.32, -0.42], [1.52, -0.22], [1.52, 0.22], [1.32, 0.42],
        [1.04, 0.42], [0.82, 0.24], [0.82, 0.08], [-1.3, 0.08],
    ],
    BODY: {
        DAMAGE: 0,
        HEALTH: 1e9,
        SHIELD: 1e9,
        REGEN: 1e6,
        DENSITY: 0,
        SPEED: 0,
        PUSHABILITY: 0,
    },
};
Class.craftrasPopeHat = {
    PARENT: "craftrasClericHat",
    LABEL: "Pope Hat",
    COLOR: "#f7f3ff",
};
Class.craftrasPopeStaff = {
    PARENT: "craftrasClericStaff",
    LABEL: "Pope Staff",
    COLOR: "#f7f3ff",
};
Class.craftrasBlesserHat = {
    PARENT: "craftrasClericHat",
    LABEL: "Blesser Hat",
    COLOR: "#d7f8ff",
};
Class.craftrasBlesserStaff = {
    PARENT: "craftrasClericStaff",
    LABEL: "Blesser Staff",
    COLOR: "#d7f8ff",
};
Class.craftrasClericHealCircle = {
    PARENT: "genericTank",
    LABEL: "Cleric Healing Circle",
    COLOR: "#9df7ff",
    ALPHA: 0,
    SHAPE: 6,
    INTANGIBLE: true,
    NO_COLLISIONS: true,
    HITS_OWN_TYPE: "never",
    DRAW_HEALTH: false,
    ACCEPTS_SCORE: false,
    CAN_BE_ON_LEADERBOARD: false,
    BODY: {
        SPEED: 0,
        ACCELERATION: 0,
        HEALTH: 1e9,
        SHIELD: 0,
        REGEN: 0,
        DAMAGE: 0,
        PENETRATION: 0,
        DENSITY: 0,
        PUSHABILITY: 0,
    },
};

Class.craftrasPopeMagicCircle1 = {
    PARENT: "craftrasClericHealCircle",
    LABEL: "Pope Magic Circle 1",
    COLOR: "#fff7c9",
    SIZE: 46,
};
Class.craftrasPopeMagicCircle2 = {
    PARENT: "craftrasPopeMagicCircle1",
    LABEL: "Pope Magic Circle 2",
    SIZE: 52,
};
Class.craftrasPopeMagicCircle3 = {
    PARENT: "craftrasPopeMagicCircle1",
    LABEL: "Pope Magic Circle 3",
    SIZE: 75,
};

Class.slayer = {
    PARENT: "genericTank",
    LABEL: "Slayer",
    UPGRADE_LABEL: "Slayer",
    COLOR: "grey",
    SIZE: Class.genericTank.SIZE,
    SHAPE: 0,
    DANGER: Class.basic.DANGER,
    BODY: {
        ...JSON.parse(JSON.stringify(Class.basic.BODY)),
        SPEED: 6,
        HEALTH: 100,
        DAMAGE: 0,
        SHIELD: 0,
        REGEN: 0,
    },
    HEALTH_WITH_LEVEL: true,
    LEVEL_CAP: 45,
    SKILL_CAP: Array(10).fill(0),
    GUNS: [{
        POSITION: [30, 5, 1, 0, 0, 0, 0],
        PROPERTIES: {
            LABEL: "Craftras M134 Barrel",
            SHOOT_SETTINGS: combineStats([g.basic, {
                reload: 0.0396825397,
                recoil: 0,
                shudder: 0.18,
                spray: 0.35,
                size: 0.5,
                speed: 6,
                maxSpeed: 6,
                damage: 1.3333333333,
            }]),
            TYPE: "craftrasM134Bullet",
            WAIT_TO_CYCLE: true,
            FIXED_RELOAD: true,
            STAT_CALCULATOR: "fixed reload",
            ALPHA: 0,
        },
    }],
    TURRETS: [
        {
            POSITION: [8.5, 4, 0, 0, 360, 2],
            TYPE: ["craftrasHelmetFront", { ALPHA: 0 }],
        },
        {
            POSITION: [5.5, 2.5, 0, 58, 360, 2],
            TYPE: ["craftrasHelmetSide", { ALPHA: 0 }],
        },
        {
            POSITION: [5.5, 2.5, 0, -58, 360, 2],
            TYPE: ["craftrasHelmetSide", { ALPHA: 0 }],
        },
        {
            POSITION: [7, 0, 0, 0, 360, 2],
            TYPE: ["craftrasHelmetCrown", { ALPHA: 0 }],
        },
        {
            POSITION: [7, 0, 0, 0, 360, 2],
            TYPE: ["craftrasPlayerClericHat", { ALPHA: 0 }],
        },
        {
            POSITION: [7, 0, 0, 0, 360, 2],
            TYPE: ["craftrasPlayerPopeHat", { ALPHA: 0 }],
        },
        {
            POSITION: [7, 0, 0, 0, 360, 2],
            TYPE: ["craftrasPlayerBlesserHat", { ALPHA: 0 }],
        },
        {
            POSITION: [7, 0, 0, 0, 360, 2],
            TYPE: ["craftrasPlayerMerchantHat", { ALPHA: 0 }],
        },
        {
            POSITION: [7, 0, 0, 0, 360, 2],
            TYPE: ["craftrasPlayerMonsterMerchantHat", { ALPHA: 0 }],
        },
        ...CRAFTRAS_HELD_TOOL_ITEMS.map(itemId => getCraftrasHeldToolClassName(itemId)).map(type => ({
            POSITION: [0.001, 6.64, 4.82, CRAFTRAS_SLAYER_IDLE_ANGLE, 360, 1],
            TYPE: [type, { ALPHA: 0 }],
        })),
        {
            POSITION: [20, 0, 0, 0, 360, 2],
            TYPE: "craftrasM134Mount",
        },
        {
            POSITION: [20, 0, 0, 0, 360, 2],
            TYPE: "craftrasRocketLauncherMount",
        },
        ...CRAFTRAS_HELD_BLOCK_TYPES.map(type => ({
            POSITION: [0.001, 10, 0, 0, 360, 1],
            TYPE: [type, { ALPHA: 0 }],
        })),
        ...CRAFTRAS_HELD_ITEM_IDS.map(itemId => ({
            POSITION: [0.001, 10, 0, 0, 360, 1],
            TYPE: [getCraftrasHeldItemClassName(itemId), { ALPHA: 0 }],
        })),
        ...Object.keys(CRAFTRAS_SHIELD_HEALTH).map(itemId => ({
            POSITION: [0.001, 10, 0, 180, 360, 1],
            TYPE: [`craftrasOffhand${getCraftrasHeldItemClassName(itemId).slice("craftrasHeldItem".length)}`, { ALPHA: 0 }],
        })),
    ],
    ON: [
        { event: "tick", handler: craftrasSlayerTick },
        { event: "damage", handler: craftrasSlayerGuardDamage },
    ],
};
