import { global } from "./global.js?v=20260719-challenge-instance1";
import { util } from "./util.js?v=20260719-challenge-instance1";
import { config } from "./config.js?v=20260719-challenge-instance1";
import * as socketStuff from "./socketinit.js?v=20260719-challenge-instance1";
import { AdvancedRecorder } from "./recorder.js?v=20260719-challenge-instance1";
let { gui } = socketStuff;

const CRAFTRAS_PLACEABLE_ITEMS = new Set([
    "grass_block", "dirt", "dirt_path", "stone", "coal", "iron_ore", "gold_ore", "wood",
    "plank", "crafting_table", "furnace", "chest", "bedrock", "coal_block",
    "iron_block", "gold_block", "diamond_block", "torch", "steel_torch",
    "challenge_start_block", "challenge_spawn_block", "transparent_block", "route_marker_block",
]);
class Canvas {
    constructor() {
        this.directionLock = false;
        this.target = global.target;
        this.socket = global.socket;
        this.directions = [];
        this.chatListener = function(id, event) {
            if (![global.KEY_ENTER, global.KEY_ESC].includes(event.keyCode)) return;
            this[id].blur();
            this.cv.focus();
            global.showChat = false;
            setTimeout(() => {
                if (!this.chatBox.loadedProperly) this.chatBox.remove(), this.chatInput.remove(), this.chatBox = false;
            }, 50)
            if (!this[id].value) return;
            if (event.keyCode === global.KEY_ENTER) this.socket.talk('M', this[id].value);
            this[id].value = "";
        }

        this.cv = document.getElementById('gameCanvas');
        this.cvb = document.getElementById('gameCanvas-background');
        this.cvg = document.getElementById('gameCanvas-gameplay');
        this.cvu = document.getElementById('gameCanvas-gui');
        this.cv.resize = (width, height) => {
            this.cv.width = this.cvb.width = this.cvg.width = this.cvu.width = this.width = width;
            this.cv.height = this.cvb.height = this.cvg.height = this.cvu.height = this.height = height;
        };
        this.cv.resize(innerWidth, innerHeight);
        this.reverseDirection = false;
        this.inverseMouse = false;
        this.spinLock = false;
        this.craftrasDropTimer = null;
        this.craftrasPointerDrag = null;
        this.craftrasLastSpacePress = 0;
        window.addEventListener("blur", () => {
            if (this.craftrasDropTimer) {
                clearTimeout(this.craftrasDropTimer);
                clearInterval(this.craftrasDropTimer);
            }
            this.craftrasDropTimer = null;
            this.craftrasPointerDrag = null;
        });
        this.mouseMoved = false;
        this.treeScrollSpeed = 0.5;
        this.treeScrollSpeedMultiplier = 1;
        this.initalized = false;
        this.tankTreeProps = {
            searchQuery: '',
            enabled: false,
        }
        global.canvas = this;
    }
    init() {
        global.mobile && optMobile.value == "mobile" || optMobile.value == "mobileWithBigJoysticks" ? ( // Mobile
            this.mobilecv = this.cv,
            this.controlTouch = null,
            this.movementTouch = null,
            this.movementTouchPos = { x: 0, y: 0 },
            this.controlTouchPos = { x: 0, y: 0 },
            this.mobilecv.addEventListener("touchstart", (event) => {if (global.gameStart || global.disconnected) this.touchStart(event)}),
            this.mobilecv.addEventListener("touchmove", (event) => {if (global.gameStart) this.touchMove(event)}),
            this.mobilecv.addEventListener("touchend", (event) => {if (global.gameStart) this.touchEnd(event)}),
            this.mobilecv.addEventListener("touchcancel", (event) => {if (global.gameStart) this.touchEnd(event)})
        ) : ( // PC
            this.cv.addEventListener("mousemove", (event) => {if (global.gameStart || global.disconnected) this.mouseMove(event)}),
            this.cv.addEventListener("mousedown", (event) => {if (global.gameStart || global.disconnected) this.mouseDown(event)}),
            this.cv.addEventListener("mouseup", (event) => {if (global.gameStart || global.disconnected) this.mouseUp(event)}),
            this.cv.addEventListener("pointerdown", event => this.craftrasPointerDown(event), true),
            window.addEventListener("pointermove", event => this.craftrasPointerMove(event), true),
            window.addEventListener("pointerup", event => this.craftrasPointerUp(event), true),
            window.addEventListener("pointercancel", event => this.craftrasPointerUp(event), true),
            this.cv.addEventListener("contextmenu", event => event.preventDefault()),
            this.cv.addEventListener("keypress", (event) => {if (global.gameStart) this.keyPress(event)}),
            this.cv.addEventListener("wheel", (event) => {if (global.gameStart) this.wheel(event)})
        );
        this.cv.addEventListener("keydown", (event) => {if (global.gameStart) this.keyDown(event)});
        this.cv.addEventListener("keyup", (event) => {if (global.gameStart) this.keyUp(event)});
        window.addEventListener("gamepadconnected", (e) => {
            global.createMessage("Controller detected! Initalizing Gamepad mode...");
            this.runGamepad();
        });
        window.addEventListener("gamepaddisconnected", (e) => {
            global.createMessage("Controller disconnected! Gamepad mode terminated.");
            this.stopGamepad();
        });
        this.initalized = true;
    }

    wheel(event) {
        if (global.craftrasCreative?.active && global.craftrasInventory?.open && !global.died) {
            const layout = this.craftrasInventoryLayout();
            const mouseX = global.mouse.x;
            const mouseY = global.mouse.y;
            const inCreativePanel = mouseX >= layout.creativeX && mouseX <= layout.creativeX + layout.creativeWidth
                && mouseY >= layout.panelY && mouseY <= layout.panelY + layout.panelHeight;
            if (inCreativePanel) {
                const metrics = this.craftrasCreativeScrollMetrics(layout);
                const direction = event.deltaY > 0 ? 1 : -1;
                global.craftrasCreative.scrollRow = Math.max(0, Math.min(metrics.maxScrollRow, metrics.scrollRow + direction));
                event.preventDefault();
                return;
            }
        }
        if (!global.died && global.showTree) {
            if (event.deltaY > 1) {
                global.targetTreeScale = Math.max(global.targetTreeScale / 1.2, 0.5);
            } else {
                global.targetTreeScale = Math.min(global.targetTreeScale * 1.2, 8);
            }
        }
    }
    keyPress(event) {
        switch (event.keyCode) {
            case global.KEY_ZOOM_OUT:
                if (!global.died && global.showTree) global.targetTreeScale = Math.max(global.targetTreeScale / 1.2, 0.5);
                break;
            case global.KEY_ZOOM_IN:
                if (!global.died && global.showTree) global.targetTreeScale = Math.min(global.targetTreeScale * 1.2, 8);
                break;
        }
    }
    spawnChatInput() {
        if (!this.chatBox) {
            this.chatBox = document.createElement("div");
            this.chatBox.id = "chatBox";
            this.chatBox.style.zIndex = 10;
            document.getElementById("gameAreaWrapper").appendChild(this.chatBox);
            // Input
            this.chatInput = document.createElement("input");
            this.chatInput.id = "chatInput";
            this.chatInput.style.zIndex = 11;
            this.chatInput.addEventListener('keydown', event => this.chatListener("chatInput", event));
            document.getElementById("gameAreaWrapper").appendChild(this.chatInput);
        }
        this.chatInput.focus();
        global.showChat = true;
    }

    respawn() {
        if (global.craftrasSpectator) {
            const now = Date.now();
            if (now - (this.craftrasSpectatorRespawnRequestedAt || 0) < 500) return;
            this.craftrasSpectatorRespawnRequestedAt = now;
            this.socket.talk("CSR");
            return;
        }
        if (global.died && !global.cannotRespawn) {
            socketStuff.sendCraftrasInventorySaveToServer(this.socket);
            this.socket.talk('s', global.playerName, 0, 1 * config.game.autoLevelUp, false, 1 * config.game.incognitoMode);
            global.died = false;
        }
    }

    keyDown(event) {
        // Browser refresh must never be captured by an open Craftras inventory.
        if (event.keyCode === 116) return;
        if (global.dailyTankAd.renderUI) return;
        const specialKey = event.keyCode === global.KEY_SPECIAL || event.code === "Backquote" || event.key === "`";

        if (specialKey) {
            event.preventDefault();
            if (!event.repeat) {
                this.socket.talk("#");
                global.specialPressed = true;
                global.specialKeysPressed = [];
            }
            return;
        }

        if (!event.repeat && event.keyCode === global.KEY_TOKEN) {
            global.screenshotGuiHidden = !global.screenshotGuiHidden;
            if (global.screenshotGuiHidden && global.craftrasInventory?.open) {
                global.craftrasInventory.open = false;
                global.craftrasInventory.drag = null;
                global.craftrasInventory.cursor = null;
                this.craftrasPointerDrag = null;
                this.socket.talk("IC");
            }
            event.preventDefault();
            return;
        }

        if ((global.died || global.craftrasSpectator) && global.craftrasInventory?.open) {
            global.craftrasInventory.open = false;
            global.craftrasInventory.drag = null;
            global.craftrasInventory.cursor = null;
            this.craftrasPointerDrag = null;
            this.socket.talk("IC");
        }

        if (global.craftrasSpectator && event.keyCode === 69) {
            event.preventDefault();
            return;
        }

        if (global.craftrasCreative?.active && !event.repeat && event.keyCode === 32) {
            const now = Date.now();
            if (now - this.craftrasLastSpacePress <= 350) {
                this.craftrasLastSpacePress = 0;
                this.socket.talk("CF");
                event.preventDefault();
                return;
            }
            this.craftrasLastSpacePress = now;
        }

        // Backtick commands take priority over Craftras' normal E inventory.
        if (global.specialPressed && event.keyCode === global.KEY_AUTO_FIRE) {
            event.preventDefault();
            if (!event.repeat) global.specialKeysPressed.push(event.keyCode);
            this.socket.talk("#", ...global.specialKeysPressed);
            return;
        }

        if ((global.craftrasWorld?.challengeMode || global.craftrasChallengeInventoryTemporary) && event.keyCode === 69) {
            global.craftrasInventory.open = false;
            global.craftrasInventory.drag = null;
            this.craftrasPointerDrag = null;
            event.preventDefault();
            return;
        }

        if (global.craftrasInventory?.active && !event.repeat && event.keyCode === 69) {
            if (this.craftrasDropTimer) clearInterval(this.craftrasDropTimer);
            this.craftrasDropTimer = null;
            const wasOpen = global.craftrasInventory.open;
            global.craftrasInventory.open = !wasOpen;
            global.craftrasInventory.drag = null;
            this.craftrasPointerDrag = null;
            if (wasOpen) this.socket.talk("IC");
            else this.socket.talk("BI");
            event.preventDefault();
            return;
        }
        if (global.craftrasInventory?.open) {
            if (event.keyCode === global.KEY_ESC) {
                global.craftrasInventory.open = false;
                global.craftrasInventory.drag = null;
                this.craftrasPointerDrag = null;
                this.socket.talk("IC");
                event.preventDefault();
                return;
            }
            const movementKeys = [
                global.KEY_UP, global.KEY_DOWN, global.KEY_LEFT, global.KEY_RIGHT,
                global.KEY_UP_ARROW, global.KEY_DOWN_ARROW, global.KEY_LEFT_ARROW, global.KEY_RIGHT_ARROW,
            ];
            if (!movementKeys.includes(event.keyCode)) {
                event.preventDefault();
                return;
            }
        }

        if (global.craftrasHotbar?.active && event.keyCode === global.KEY_SCREENSHOT) {
            if (!event.repeat && !this.craftrasDropTimer) {
                const dropSelected = () => this.socket.talk(global.craftrasHotbar.offhandSelected ? "DO" : "DI");
                dropSelected();
                this.craftrasDropTimer = setTimeout(() => {
                    this.craftrasDropTimer = setInterval(dropSelected, 100);
                }, 1000);
            }
            event.preventDefault();
            return;
        }

        // Craftras owns the number row for hotbar selection. Handle it before
        // any skill or class-upgrade shortcuts can consume the same key.
        if (!event.repeat) {
            const hotbarKeys = [49, 50, 51, 52, 53, 54, 55, 56, 57, 48];
            const hotbarSlot = hotbarKeys.indexOf(event.keyCode);
            if (global.craftrasHotbar?.active && hotbarSlot !== -1) {
                global.craftrasHotbar.selected = hotbarSlot;
                global.craftrasHotbar.offhandSelected = false;
                this.socket.talk("HS", hotbarSlot);
                event.preventDefault();
                return;
            }
        }

        if (global.specialPressed) {
            event.preventDefault();
            if (!event.repeat) global.specialKeysPressed.push(event.keyCode);
            this.socket.talk("#", ...global.specialKeysPressed);
            return;
        }

        // Handle search input when tree is open and search bar is active
        if (global.showTree && global.searchBarActive) {
            if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
                event.preventDefault();
                this.tankTreeProps.searchQuery += event.key;
                global.searchTankByName(this.tankTreeProps.searchQuery);
                return;
            } else if (event.keyCode === 8) { // Backspace
                event.preventDefault();
                this.tankTreeProps.searchQuery = this.tankTreeProps.searchQuery.slice(0, -1);
                global.searchTankByName(this.tankTreeProps.searchQuery);
                return;
            } else if (event.keyCode === 27) { // Escape
                event.preventDefault();
                this.tankTreeProps.searchQuery = '';
                global.searchTankByName('');
                global.searchBarActive = false;
                return;
            } else if (event.keyCode === global.KEY_ENTER) {
                event.preventDefault();
                global.searchBarActive = false;
                return;
            }
        }

        switch (event.keyCode) {
            case global.KEY_SHIFT:
                if (global.showTree) this.treeScrollSpeedMultiplier = 5;
                else this.socket.cmd.set(6, true);
                break;

            case global.KEY_ENTER:
                // Enter to respawn
                if (global.died && !global.cannotRespawn) {
                    this.respawn();
                    global.died = false;
                    break;
                }

                // or to talk instead
                if (global.gameStart && !global.died && !global.disconnected) {
                    this.spawnChatInput();
                    break;
                }
                break;

            case global.KEY_UP_ARROW:
                if (!global.died && global.showTree) return (global.classTreeDrag.isDragging = true, global.classTreeDrag.momentum.y = -this.treeScrollSpeed * this.treeScrollSpeedMultiplier);
            case global.KEY_UP:
                this.socket.cmd.set(0, true);
                break;
            case global.KEY_DOWN_ARROW:
                if (!global.died && global.showTree) return (global.classTreeDrag.isDragging = true, global.classTreeDrag.momentum.y = +this.treeScrollSpeed * this.treeScrollSpeedMultiplier);
            case global.KEY_DOWN:
                this.socket.cmd.set(1, true);
                break;
            case global.KEY_LEFT_ARROW:
                if (!global.died && global.showTree) return (global.classTreeDrag.isDragging = true, global.classTreeDrag.momentum.x = -this.treeScrollSpeed * this.treeScrollSpeedMultiplier);
            case global.KEY_LEFT:
                this.socket.cmd.set(2, true);
                break;
            case global.KEY_RIGHT_ARROW:
                if (!global.died && global.showTree) return (global.classTreeDrag.isDragging = true, global.classTreeDrag.momentum.x = +this.treeScrollSpeed * this.treeScrollSpeedMultiplier);
            case global.KEY_RIGHT:
                this.socket.cmd.set(3, true);
                break;
            case global.KEY_MOUSE_0:
                this.socket.cmd.set(4, true);
                break;
            case global.KEY_MOUSE_1:
                this.socket.cmd.set(5, true);
                break;
            case global.KEY_MOUSE_2:
                this.socket.cmd.set(6, true);
                break;
            case global.KEY_LEVEL_UP:
                this.socket.talk('L');
                break;
            case global.KEY_BECOME:
                if (global.craftrasHotbar?.active) {
                    const selected = global.craftrasHotbar.slots[global.craftrasHotbar.selected];
                    if (selected?.id?.endsWith("_shield")) {
                        this.socket.talk("OE", global.craftrasHotbar.selected);
                        global.craftrasHotbar.offhandSelected = true;
                        event.preventDefault();
                        break;
                    }
                }
                this.socket.talk('H');
                break;
            case global.KEY_MAX_STAT:
                global.statMaxing = true;
                break;
            case global.KEY_SUICIDE:
                this.socket.talk('1');
                break;
        }
        if (!event.repeat) {
            switch (event.keyCode) {
                case global.KEY_SPECIAL:
                    this.socket.talk("#");
                    global.specialPressed = true;
                    global.specialKeysPressed = [];
                    break;
                case global.KEY_AUTO_SPIN:
                    global.autoSpin = !global.autoSpin;
                    this.socket.talk("t", 0, true);
                    break;
                case global.KEY_AUTO_FIRE:
                    this.socket.talk("t", 1, true);
                    break;
                case global.KEY_OVER_RIDE:
                    this.socket.talk("t", 2, true);
                    break;
                case global.KEY_AUTO_ALT:
                    this.socket.talk("t", 3, true);
                    break;
                case global.KEY_SPIN_LOCK:
                    this.spinLock = !this.spinLock;
                    global.createMessage(this.spinLock ? "Spinlock enabled." : "Spinlock disabled.");
                    this.socket.talk("t", 4, false);
                    break;
                case global.KEY_REVERSE_MOUSE:
                    this.inverseMouse = !this.inverseMouse;
                    global.createMessage(this.inverseMouse ? "Reverse mouse enabled." : "Reverse mouse disabled.");
                    break;
                case global.KEY_REVERSE_TANK:
                    this.reverseDirection = !this.reverseDirection;
                    global.createMessage(this.reverseDirection ? "Reverse tank enabled." : "Reverse tank disabled.");
                    break;
                case global.KEY_DEBUG:
                    global.showDebug = !global.showDebug;
                    break;
                case global.KEY_CLASS_TREE:
                    this.tankTreeProps.enabled = !this.tankTreeProps.enabled;
                    global.tankTree(this.tankTreeProps.enabled ? "open" : "exit");
                    break;
                case global.KEY_RECORD:
                    this.record();
                    break;
                case global.KEY_SCREENSHOT:
                    this.screenshot();
                    break;
            }
            if (global.canSkill) {
                let skill = [
                    global.KEY_UPGRADE_ATK, global.KEY_UPGRADE_HTL, global.KEY_UPGRADE_SPD,
                    global.KEY_UPGRADE_STR, global.KEY_UPGRADE_PEN, global.KEY_UPGRADE_DAM,
                    global.KEY_UPGRADE_RLD, global.KEY_UPGRADE_MOB, global.KEY_UPGRADE_RGN,
                    global.KEY_UPGRADE_SHI
                ].indexOf(event.keyCode);
                if (skill >= 0) this.socket.talk('x', skill, 1 * global.statMaxing);
            }
            if (global.canUpgrade) {
                switch (event.keyCode) {
                    case global.KEY_CHOOSE_1:
                        this.socket.talk("U", 0, parseInt(gui.upgrades[0][0]));
                        break;
                    case global.KEY_CHOOSE_2:
                        this.socket.talk("U", 1, parseInt(gui.upgrades[1][0]));
                        break;
                    case global.KEY_CHOOSE_3:
                        this.socket.talk("U", 2, parseInt(gui.upgrades[2][0]));
                        break;
                    case global.KEY_CHOOSE_4:
                        this.socket.talk("U", 3, parseInt(gui.upgrades[3][0]));
                        break;
                    case global.KEY_CHOOSE_5:
                        this.socket.talk("U", 4, parseInt(gui.upgrades[4][0]));
                        break;
                    case global.KEY_CHOOSE_6:
                        this.socket.talk("U", 5, parseInt(gui.upgrades[5][0]));
                        break;
                }
            }
        }
    }
    keyUp(event) {
        if (global.dailyTankAd.renderUI) return;
        const specialKey = event.keyCode === global.KEY_SPECIAL || event.code === "Backquote" || event.key === "`";
        if (event.keyCode === global.KEY_SCREENSHOT && this.craftrasDropTimer) {
            clearTimeout(this.craftrasDropTimer);
            clearInterval(this.craftrasDropTimer);
            this.craftrasDropTimer = null;
            event.preventDefault();
            return;
        }
        if (specialKey) {
            global.specialPressed = false;
            global.specialKeysPressed = [];
            return;
        }
        switch (event.keyCode) {
            case global.KEY_SPECIAL:
                global.specialPressed = false;
                global.specialKeysPressed = [];
                break;
            case global.KEY_SHIFT:
                if (global.showTree) this.treeScrollSpeedMultiplier = 1;
                else this.socket.cmd.set(6, false);
                break;
            case global.KEY_UP_ARROW:
                global.classTreeDrag.momentum.y = 0;
                global.classTreeDrag.isDragging = false;
            case global.KEY_UP:
                this.socket.cmd.set(0, false);
                break;
            case global.KEY_DOWN_ARROW:
                global.classTreeDrag.momentum.y = 0;
                global.classTreeDrag.isDragging = false;
            case global.KEY_DOWN:
                this.socket.cmd.set(1, false);
                break;
            case global.KEY_LEFT_ARROW:
                global.classTreeDrag.momentum.x = 0;
                global.classTreeDrag.isDragging = false;
            case global.KEY_LEFT:
                this.socket.cmd.set(2, false);
                break;
            case global.KEY_RIGHT_ARROW:
                global.classTreeDrag.momentum.x = 0;
                global.classTreeDrag.isDragging = false;
            case global.KEY_RIGHT:
                this.socket.cmd.set(3, false);
                break;
            case global.KEY_MOUSE_0:
                this.socket.cmd.set(4, false);
                break;
            case global.KEY_MOUSE_1:
                this.socket.cmd.set(5, false);
                break;
            case global.KEY_MOUSE_2:
                this.socket.cmd.set(6, false);
                break;
            case global.KEY_MAX_STAT:
                global.statMaxing = false;
                break;
        }
        if (global.specialPressed) {
            let arrayCopy = global.specialKeysPressed.slice();
            let i = global.specialKeysPressed.indexOf(event.keyCode);
            if (i >= 0) {
                global.specialKeysPressed.splice(i, 1);
                arrayCopy[i] = -event.keyCode;
            }
            else arrayCopy.push(-event.keyCode);
            this.socket.talk("#", ...arrayCopy);
        }
    }
    mouseDown(mouse) {
        let primaryFire = 4,
            secondaryFire = 6;
        if (this.inverseMouse) [primaryFire, secondaryFire] = [secondaryFire, primaryFire];
        global.clickables.clicked = true;
        if (mouse.button === 0 && global.craftrasTeamInvite?.active) {
            const invitePoint = {
                x: mouse.clientX * global.ratio,
                y: mouse.clientY * global.ratio,
            };
            const inviteAction = global.clickables.teamInvite.check(invitePoint);
            if (inviteAction !== -1) {
                this.socket.talk("CTA", inviteAction === 0 ? 1 : 0);
                global.craftrasTeamInvite = { active: false, inviter: "", kind: "invite", expiresAt: 0 };
                global.clickables.teamInvite.hide();
                mouse.preventDefault();
                return;
            }
        }
        if (global.craftrasChallengeEntry?.open) {
            if (mouse.button === 0) {
                const actionPoint = {
                    x: mouse.clientX * global.ratio,
                    y: mouse.clientY * global.ratio,
                };
                const challengeAction = global.clickables.challengeEntry.check(actionPoint);
                if (challengeAction !== -1) {
                    this.socket.talk("CSA", challengeAction === 0 ? 1 : 0);
                    if (challengeAction === 1) {
                        global.craftrasChallengeEntry = { open: false, teamName: "", memberCount: 1, isHost: true };
                        global.clickables.challengeEntry.hide();
                    }
                }
            }
            mouse.preventDefault();
            return;
        }
        if (global.craftrasSpectator && global.craftrasInventory?.open) {
            global.craftrasInventory.open = false;
            global.craftrasInventory.drag = null;
            global.craftrasInventory.cursor = null;
            this.craftrasPointerDrag = null;
            this.socket.talk("IC");
            mouse.preventDefault();
            return;
        }
        if (global.craftrasSpectator) {
            const point = {
                x: mouse.clientX * global.ratio,
                y: mouse.clientY * global.ratio,
            };
            if (global.clickables.deathRespawn.check(point) !== -1 && !global.disconnected) this.respawn();
            this.socket.cmd.set(primaryFire, false);
            this.socket.cmd.set(5, false);
            this.socket.cmd.set(secondaryFire, false);
            mouse.preventDefault();
            return;
        }
        if (mouse.button === 2 && global.craftrasInventory?.open) {
            const point = this.craftrasInventoryPoint(mouse.clientX, mouse.clientY);
            const slot = this.craftrasInventorySlotAt(point.x, point.y);
            const item = slot >= 0 ? global.craftrasInventory.slots[slot] : null;
            if (item?.id?.endsWith("_shield")) this.socket.talk("OE", slot);
            mouse.preventDefault();
            return;
        }
        if (mouse.button === 0 && global.craftrasInventory?.open) {
            const point = this.craftrasInventoryPoint(mouse.clientX, mouse.clientY);
            if (this.craftrasRecipeBookButtonAt(point.x, point.y)) {
                global.craftrasRecipeBookOpen = !global.craftrasRecipeBookOpen;
                mouse.preventDefault();
                return;
            }
            const creativeSlot = this.craftrasCreativeSlotAt(point.x, point.y);
            if (creativeSlot != null) {
                this.socket.talk("GC", creativeSlot, mouse.button);
                mouse.preventDefault();
                return;
            }
            const chestSlot = this.craftrasChestSlotAt(point.x, point.y);
            const furnaceSlot = chestSlot == null ? this.craftrasFurnaceSlotAt(point.x, point.y) : null;
            const blesserOffer = chestSlot == null && furnaceSlot == null ? this.craftrasBlesserOfferAt(point.x, point.y) : null;
            const merchantOffer = chestSlot == null && furnaceSlot == null && blesserOffer == null ? this.craftrasMerchantOfferAt(point.x, point.y) : null;
            const merchantSellButton = chestSlot == null && furnaceSlot == null && blesserOffer == null && merchantOffer == null ? this.craftrasMerchantSellButtonAt(point.x, point.y) : false;
            const merchantSellSlot = chestSlot == null && furnaceSlot == null && blesserOffer == null && merchantOffer == null && !merchantSellButton ? this.craftrasMerchantSellSlotAt(point.x, point.y) : null;
            const clericTokenSlot = chestSlot == null && furnaceSlot == null && blesserOffer == null && merchantOffer == null && !merchantSellButton && merchantSellSlot == null ? this.craftrasClericTokenSlotAt(point.x, point.y) : null;
            const clericRebirth = chestSlot == null && furnaceSlot == null && blesserOffer == null && merchantOffer == null && !merchantSellButton && merchantSellSlot == null && clericTokenSlot == null ? this.craftrasClericRebirthButtonAt(point.x, point.y) : false;
            const blacksmithUnlock = chestSlot == null && furnaceSlot == null && blesserOffer == null && merchantOffer == null && !merchantSellButton && merchantSellSlot == null && clericTokenSlot == null && !clericRebirth ? this.craftrasBlacksmithUnlockButtonAt(point.x, point.y) : false;
            const blacksmithSlot = chestSlot == null && furnaceSlot == null && blesserOffer == null && merchantOffer == null && !merchantSellButton && merchantSellSlot == null && clericTokenSlot == null && !clericRebirth && !blacksmithUnlock ? this.craftrasBlacksmithSlotAt(point.x, point.y) : null;
            const helmetSlot = chestSlot == null && furnaceSlot == null && blesserOffer == null && merchantOffer == null && !merchantSellButton && merchantSellSlot == null && clericTokenSlot == null && !clericRebirth && blacksmithSlot == null && !blacksmithUnlock ? this.craftrasHelmetSlotAt(point.x, point.y) : false;
            const offhandSlot = chestSlot == null && furnaceSlot == null && blesserOffer == null && merchantOffer == null && !merchantSellButton && merchantSellSlot == null && clericTokenSlot == null && !clericRebirth && blacksmithSlot == null && !blacksmithUnlock && !helmetSlot ? this.craftrasOffhandSlotAt(point.x, point.y) : false;
            const craftingSlot = chestSlot == null && furnaceSlot == null && blesserOffer == null && merchantOffer == null && !merchantSellButton && merchantSellSlot == null && clericTokenSlot == null && !clericRebirth && blacksmithSlot == null && !blacksmithUnlock && !helmetSlot && !offhandSlot ? this.craftrasCraftingSlotAt(point.x, point.y) : null;
            const slot = chestSlot == null && furnaceSlot == null && blesserOffer == null && merchantOffer == null && !merchantSellButton && merchantSellSlot == null && clericTokenSlot == null && !clericRebirth && blacksmithSlot == null && !blacksmithUnlock && !helmetSlot && !offhandSlot && craftingSlot == null ? this.craftrasInventorySlotAt(point.x, point.y) : -2;
            global.craftrasInventory.cursorX = point.x;
            global.craftrasInventory.cursorY = point.y;
            if (chestSlot != null) this.socket.talk("XA", chestSlot, mouse.button);
            else if (furnaceSlot != null) this.socket.talk("FA", furnaceSlot, mouse.button);
            else if (blesserOffer != null) this.socket.talk("SB", blesserOffer);
            else if (merchantOffer != null) this.socket.talk("MB", merchantOffer);
            else if (merchantSellButton) this.socket.talk("ML");
            else if (merchantSellSlot != null) this.socket.talk("MS", mouse.button);
            else if (clericTokenSlot != null) this.socket.talk("RS", clericTokenSlot, mouse.button);
            else if (clericRebirth) this.socket.talk("RA");
            else if (blacksmithUnlock) this.socket.talk("BU");
            else if (blacksmithSlot != null) this.socket.talk("BA", mouse.button);
            else if (helmetSlot) this.socket.talk("HE", mouse.button);
            else if (offhandSlot) this.socket.talk("OF", mouse.button);
            else if (craftingSlot != null) this.socket.talk("CA", craftingSlot, mouse.button);
            else if (slot >= 0 || slot === -1) this.socket.talk("IA", slot, mouse.button);
            mouse.preventDefault();
            return;
        }
        switch (mouse.button) {
            case 0:
                let mpos = {
                    x: mouse.clientX * global.ratio,
                    y: mouse.clientY * global.ratio,
                };
                if (global.showTree) {
                    // Start dragging if not clicking UI elements
                    global.classTreeDrag.isDragging = true;
                    global.classTreeDrag.startX = global.classTreeDrag.lastX = mouse.clientX;
                    global.classTreeDrag.startY = global.classTreeDrag.lastY = mouse.clientY;
                    global.classTreeDrag.momentum = { x: 0, y: 0 };
                    break;
                }
                if (global.craftrasHotbar?.active && !global.craftrasInventory?.open) {
                    const selectedItem = global.craftrasHotbar.slots[global.craftrasHotbar.selected];
                    if (selectedItem && CRAFTRAS_PLACEABLE_ITEMS.has(selectedItem.id) && global.craftrasPlacement?.adminLayerTools) {
                        this.socket.talk("PM");
                        mouse.preventDefault();
                        break;
                    }
                }
                let statIndex = global.clickables.stat.check(mpos);
                let upgradeCheck = global.clickables.upgrade.check(mpos);
                if (statIndex !== -1) {
                    this.socket.talk('x', statIndex, 0);
                } else if (
                    !global.dailyTankAd.renderUI &&
                    global.clickables.optionsMenu.toggleBoxes.check(mpos) == -1 && 
                    global.clickables.optionsMenu.switchButton.check(mpos) == -1 &&
                    global.optionsMenu_Anim.tabClickables.check(mpos) == -1 &&
                    global.clickables.skipUpgrades.check(mpos) == -1 && 
                    global.clickables.dailyTankUpgrade.check(mpos) == false &&
                    global.clickables.dailyTankAd.check(mpos) === false &&
                    upgradeCheck == -1 && 
                    !global.died
                ) this.socket.cmd.set(primaryFire, true);
                break;
            case 1:
                this.socket.cmd.set(5, true);
                break;
            case 2:
                if (global.craftrasHotbar?.active && !global.craftrasInventory?.open) {
                    const selectedItem = global.craftrasHotbar.slots[global.craftrasHotbar.selected];
                    const foodItems = new Set([
                        "raw_beef", "cooked_beef", "raw_pork", "cooked_pork", "raw_chicken", "cooked_chicken",
                        "creative_24h", "creative_1h",
                    ]);
                    if (selectedItem && foodItems.has(selectedItem.id)) {
                        this.socket.talk("EF", 1);
                        mouse.preventDefault();
                        this.socket.cmd.set(secondaryFire, true);
                        break;
                    }
                    if (selectedItem && CRAFTRAS_PLACEABLE_ITEMS.has(selectedItem.id)) {
                        this.socket.talk("PL");
                        mouse.preventDefault();
                        break;
                    }
                    this.socket.talk("CT");
                }
                this.socket.cmd.set(secondaryFire, true);
                break;
        }
    }
    mouseUp(mouse) {
        let primaryFire = 4,
            secondaryFire = 6;
        if (this.inverseMouse) [primaryFire, secondaryFire] = [secondaryFire, primaryFire];
        global.clickables.clicked = false;
        if ((mouse.button === 0 || mouse.button === 2) && global.craftrasInventory?.open) {
            mouse.preventDefault();
            return;
        }
        switch (mouse.button) {
            case 0:
                let mpos = {
                    x: mouse.clientX * global.ratio,
                    y: mouse.clientY * global.ratio,
                };
                let upgradeIndex = global.clickables.upgrade.check(mpos);
                let dailyTankUpgrade = global.clickables.dailyTankUpgrade.check(mpos);
                let dailyTankAd = global.clickables.dailyTankAd.check(mpos);
                let dailyTankCloseAd = global.clickables.dailyTankCloseAd.check(mpos);
                let respawnCheck = global.clickables.deathRespawn.check(mpos);
                let exitGame = global.clickables.exitGame.check(mpos);
                let reconnectCheck = global.clickables.reconnect.check(mpos);
                let optionsMenu_Switch = global.clickables.optionsMenu.switchButton.check(mpos);
                let optionsMenu_toggleBox = global.clickables.optionsMenu.toggleBoxes.check(mpos);
                let optionsMenu_tabClick = global.optionsMenu_Anim.tabClickables ? global.optionsMenu_Anim.tabClickables.check(mpos) : -1;
                // Options menu clickables
                if (optionsMenu_Switch === 0) {
                    global.optionsMenu_Anim.switchMenu_button.set(-40);
                    global.optionsMenu_Anim.mainMenu.set(25);
                    global.optionsMenu_Anim.isOpened = true;
                    break;
                }
                if (optionsMenu_Switch === 1) {
                    global.optionsMenu_Anim.switchMenu_button.set(0);
                    global.optionsMenu_Anim.mainMenu.set(-500);
                    global.optionsMenu_Anim.isOpened = false;
                    break;
                }
                if (optionsMenu_tabClick !== -1) {
                    global.optionsMenu_Anim.activeTab = optionsMenu_tabClick;
                    global.optionsMenu_Anim.tabOffset.set(optionsMenu_tabClick);
                    global.optionsMenu_Anim.mainMenuHeight.set(global.optionsMenu_Anim.tabs[optionsMenu_tabClick][1]);
                    break;
                }
                if (optionsMenu_toggleBox !== -1) {
                    let box = global.optionsCheckboxes[optionsMenu_toggleBox];
                    let doc = document.getElementById(box.id);
                    box.value = !box.value;
                    if (doc) doc.checked = box.value;
                    if (doc) util.submitToLocalStorage(box.id);
                    break;
                }
                // Stop dragging class tree
                if (global.classTreeDrag.isDragging) {
                    global.classTreeDrag.isDragging = false;
                }
                if (global.clickables.classTreeClose.check(mpos) === 0) {
                    global.tankTree("exit");
                    break;
                }
                
                // Check zoom buttons
                if (global.clickables.classTreeZoomIn.check(mpos) === 0) {
                    global.targetTreeScale = Math.min(global.targetTreeScale * 1.2, 8);
                    break;
                }
                if (global.clickables.classTreeZoomOut.check(mpos) === 1) {
                    global.targetTreeScale = Math.max(global.targetTreeScale / 1.2, 0.5);
                    break;
                }
                
                // Check search bar click
                const searchBarWidth = 300;
                const searchBarHeight = 35;
                const searchBarX = global.screenWidth / 2 / global.ratio - searchBarWidth / 2;
                const searchBarY = 30;
                
                if (mpos.x / global.ratio >= searchBarX && 
                    mpos.x / global.ratio <= searchBarX + searchBarWidth &&
                    mpos.y / global.ratio >= searchBarY && 
                    mpos.y / global.ratio <= searchBarY + searchBarHeight) {
                    global.searchBarActive = true;
                    break;
                } else {
                    global.searchBarActive = false;
                }
                if (respawnCheck !== -1 && !global.disconnected && (global.craftrasSpectator || global.died)) {
                    this.respawn();
                } else
                if (reconnectCheck !== -1) {
                    if (global.disconnected) global.reconnect();
                } else
                if (exitGame !== -1) {
                    if (global.disconnected || (global.died && !global.cannotRespawn)) global.exit();
                } else 
                if (upgradeIndex !== -1 && upgradeIndex < gui.upgrades.length && !global.dailyTankAd.renderUI) this.socket.talk('U', upgradeIndex, parseInt(gui.upgrades[upgradeIndex][0]));
                else if (dailyTankUpgrade == true && !global.dailyTankAd.renderUI) {
                    this.socket.talk('U', JSON.stringify([{isDailyUpgrade: true, tank: gui.dailyTank.tank}]), "null");
                } else if (dailyTankAd == true) {
                    this.socket.talk("DTA"); // Request to get an ad
                } else if (dailyTankCloseAd == true && global.dailyTankAd.renderUI) {
                    this.socket.talk("DTAD");
                } else if (global.clickables.skipUpgrades.check(mpos) !== -1) {
                    global.clearUpgrades();
                } else this.socket.cmd.set(primaryFire, false);
                break;
            case 1:
                this.socket.cmd.set(5, false);
                break;
            case 2:
                if (global.craftrasHotbar?.active) this.socket.talk("EF", 0);
                this.socket.cmd.set(secondaryFire, false);
                break;
        }
    }
    mouseMove(mouse) {
        if (global.craftrasInventory?.open) {
            const point = this.craftrasInventoryPoint(mouse.clientX, mouse.clientY);
            global.craftrasInventory.cursorX = point.x;
            global.craftrasInventory.cursorY = point.y;
            global.mouse.x = point.x;
            global.mouse.y = point.y;
            return;
        }
        // Handle class tree dragging with smooth momentum
        if (global.showTree && global.classTreeDrag.isDragging) {
            const dx = (mouse.clientX - global.classTreeDrag.lastX) / global.treeScale;
            const dy = (mouse.clientY - global.classTreeDrag.lastY) / global.treeScale;
            
            // Smooth momentum update
            global.classTreeDrag.momentum.x = -dx * 0.01;
            global.classTreeDrag.momentum.y = -dy * 0.01;

            global.classTreeDrag.lastX = mouse.clientX;
            global.classTreeDrag.lastY = mouse.clientY;
            return;
        }
        global.statHover =
            global.clickables.hover.check({
                x: mouse.clientX * global.ratio,
                y: mouse.clientY * global.ratio,
            }) === 0;
        if (this.spinLock) return;
        global.mouse.x = mouse.clientX * global.ratio;
        global.mouse.y = mouse.clientY * global.ratio;
        if (global.gameStart) {
            this.mouseMoved = true;
            global.socket.cmd.reactNow();
        }
    }

    craftrasPointerTarget(clientX, clientY) {
        const point = this.craftrasInventoryPoint(clientX, clientY);
        const creativeSlot = this.craftrasCreativeSlotAt(point.x, point.y);
        if (creativeSlot != null) return { key: `g:${creativeSlot}`, kind: "g", index: creativeSlot, point };

        const chestSlot = this.craftrasChestSlotAt(point.x, point.y);
        if (chestSlot != null) return { key: `x:${chestSlot}`, kind: "x", index: chestSlot, point };

        const furnaceSlot = this.craftrasFurnaceSlotAt(point.x, point.y);
        if (furnaceSlot != null) return { key: `f:${furnaceSlot}`, kind: "f", index: furnaceSlot, point };

        const blacksmithSlot = this.craftrasBlacksmithSlotAt(point.x, point.y);
        if (blacksmithSlot != null) return { key: `b:${blacksmithSlot}`, kind: "b", index: blacksmithSlot, point };

        const merchantSellSlot = this.craftrasMerchantSellSlotAt(point.x, point.y);
        if (merchantSellSlot != null) return { key: `m:${merchantSellSlot}`, kind: "m", index: merchantSellSlot, point };

        const clericTokenSlot = this.craftrasClericTokenSlotAt(point.x, point.y);
        if (clericTokenSlot != null) return { key: `r:${clericTokenSlot}`, kind: "r", index: clericTokenSlot, point };

        const craftingSlot = this.craftrasCraftingSlotAt(point.x, point.y);
        if (craftingSlot != null) return { key: `c:${craftingSlot}`, kind: "c", index: craftingSlot, point };

        const inventorySlot = this.craftrasInventorySlotAt(point.x, point.y);
        if (inventorySlot >= 0) return { key: `i:${inventorySlot}`, kind: "i", index: inventorySlot, point };
        return { key: null, kind: null, index: -1, point };
    }

    craftrasPointerDown(event) {
        if (event.button === 0 && !global.craftrasInventory?.open && global.craftrasHotbar?.active) {
            const target = this.craftrasScreenHotbarTarget(event.clientX, event.clientY);
            if (target) {
                if (target.kind === "hotbar") {
                    global.craftrasHotbar.selected = target.index;
                    global.craftrasHotbar.offhandSelected = false;
                    this.socket.talk("HS", target.index);
                } else if (target.kind === "offhand") {
                    global.craftrasHotbar.offhandSelected = true;
                }
                this.craftrasPointerDrag = {
                    mode: "hotbar",
                    pointerId: event.pointerId,
                    source: target,
                    target,
                };
                try { this.cv.setPointerCapture(event.pointerId); } catch {}
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
        }
        if (event.button !== 2 || !global.craftrasInventory?.open) return;
        const target = this.craftrasPointerTarget(event.clientX, event.clientY);
        global.craftrasInventory.cursorX = target.point.x;
        global.craftrasInventory.cursorY = target.point.y;
        global.mouse.x = target.point.x;
        global.mouse.y = target.point.y;

        if (target.kind === "g") this.socket.talk("GC", target.index, 2);
        else if (target.kind === "i") this.socket.talk("IA", target.index, 2);
        else if (target.kind === "c") this.socket.talk("CA", target.index, 2);
        else if (target.kind === "f") this.socket.talk("FA", target.index, 2);
        else if (target.kind === "x") this.socket.talk("XA", target.index, 2);

        this.craftrasPointerDrag = {
            pointerId: event.pointerId,
            origin: target.key,
            targets: new Set(),
        };
        try { this.cv.setPointerCapture(event.pointerId); } catch {}
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    craftrasPointerMove(event) {
        const drag = this.craftrasPointerDrag;
        if (!drag || event.pointerId !== drag.pointerId) return;
        if (drag.mode === "hotbar") {
            drag.target = this.craftrasScreenHotbarTarget(event.clientX, event.clientY);
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        if (!global.craftrasInventory?.open) {
            this.craftrasPointerDrag = null;
            return;
        }
        const target = this.craftrasPointerTarget(event.clientX, event.clientY);
        global.craftrasInventory.cursorX = target.point.x;
        global.craftrasInventory.cursorY = target.point.y;
        global.mouse.x = target.point.x;
        global.mouse.y = target.point.y;

        const canPlace = target.kind === "i"
            || (target.kind === "c" && target.index >= 0)
            || (target.kind === "f" && target.index >= 0 && target.index < 2);
        if (canPlace && target.key !== drag.origin && !drag.targets.has(target.key)) {
            drag.targets.add(target.key);
            this.socket.talk("IR", JSON.stringify([target.key]));
        }
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    craftrasPointerUp(event) {
        const drag = this.craftrasPointerDrag;
        if (!drag || event.pointerId !== drag.pointerId) return;
        this.craftrasPointerDrag = null;
        try { this.cv.releasePointerCapture(event.pointerId); } catch {}
        if (drag.mode === "hotbar") {
            const target = this.craftrasScreenHotbarTarget(event.clientX, event.clientY) || drag.target;
            if (drag.source.kind === "hotbar" && target?.kind === "hotbar" && drag.source.index !== target.index) {
                this.socket.talk("IM", drag.source.index, target.index);
                global.craftrasHotbar.selected = target.index;
                global.craftrasHotbar.offhandSelected = false;
                this.socket.talk("HS", target.index);
            } else if (drag.source.kind === "hotbar" && target?.kind === "offhand") {
                const item = global.craftrasHotbar.slots[drag.source.index];
                if (item?.id?.endsWith("_shield")) {
                    this.socket.talk("OE", drag.source.index);
                    global.craftrasHotbar.offhandSelected = true;
                }
            }
        }
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    craftrasScreenHotbarTarget(clientX, clientY) {
        const point = this.craftrasInventoryPoint(clientX, clientY);
        const slotCount = 10;
        const gap = 4;
        const availableWidth = Math.max(240, global.screenWidth - 24);
        const slotSize = Math.max(28, Math.min(48, (availableWidth - gap * (slotCount - 1)) / slotCount));
        const totalWidth = slotSize * slotCount + gap * (slotCount - 1);
        const startX = Math.round((global.screenWidth - totalWidth) / 2);
        const y = Math.round(global.screenHeight - slotSize - 132);
        for (let index = 0; index < slotCount; index++) {
            const left = Math.round(startX + index * (slotSize + gap));
            if (point.x >= left && point.x <= left + slotSize && point.y >= y && point.y <= y + slotSize) {
                return { kind: "hotbar", index };
            }
        }
        const offhandX = startX + totalWidth + gap * 2;
        if (point.x >= offhandX && point.x <= offhandX + slotSize && point.y >= y && point.y <= y + slotSize) {
            return { kind: "offhand", index: -1 };
        }
        return null;
    }

    craftrasInventoryLayout() {
        const columns = 10;
        const slotSize = 44;
        const gap = 5;
        const gridWidth = columns * slotSize + (columns - 1) * gap;
        const panelWidth = gridWidth + 36;
        const panelHeight = 430;
        const creativeSlotSize = 32;
        const creativeGap = 4;
        const creativeWidth = columns * creativeSlotSize + (columns - 1) * creativeGap + 24;
        const creativeActive = !!global.craftrasCreative?.active;
        const recipeWidth = 240;
        const recipeGap = 12;
        const recipeButtonWidth = 82;
        const recipeButtonHeight = 28;
        const recipeOpen = !!global.craftrasRecipeBookOpen;
        const recipeAreaWidth = recipeOpen ? recipeWidth : recipeButtonWidth;
        const totalWidth = panelWidth + recipeGap + recipeAreaWidth + (creativeActive ? creativeWidth + 12 : 0);
        const groupX = Math.max(8, Math.round((global.screenWidth - totalWidth) / 2));
        const panelX = groupX + (creativeActive ? creativeWidth + 12 : 0);
        const panelY = Math.round((global.screenHeight - panelHeight) / 2);
        const recipeX = panelX + panelWidth + recipeGap;
        return {
            columns, slotSize, gap, gridWidth, panelWidth, panelHeight,
            panelX,
            panelY,
            creativeX: groupX,
            creativeWidth,
            creativeSlotSize,
            creativeGap,
            recipeOpen,
            recipeX,
            recipeWidth,
            recipeButtonX: recipeOpen ? recipeX + recipeWidth - recipeButtonWidth - 8 : recipeX,
            recipeButtonY: panelY + 8,
            recipeButtonWidth,
            recipeButtonHeight,
        };
    }

    craftrasCreativeScrollMetrics(layout = this.craftrasInventoryLayout()) {
        const items = global.craftrasCreative?.items || [];
        const visibleRows = Math.max(1, Math.floor((layout.panelHeight - 60) / (layout.creativeSlotSize + layout.creativeGap)));
        const totalRows = Math.ceil(items.length / layout.columns);
        const maxScrollRow = Math.max(0, totalRows - visibleRows);
        const scrollRow = Math.max(0, Math.min(maxScrollRow, Math.floor(Number(global.craftrasCreative?.scrollRow) || 0)));
        if (global.craftrasCreative) global.craftrasCreative.scrollRow = scrollRow;
        return { visibleRows, totalRows, maxScrollRow, scrollRow };
    }

    craftrasRecipeBookButtonAt(x, y) {
        if (!global.craftrasInventory?.open) return false;
        const layout = this.craftrasInventoryLayout();
        return x >= layout.recipeButtonX && x <= layout.recipeButtonX + layout.recipeButtonWidth
            && y >= layout.recipeButtonY && y <= layout.recipeButtonY + layout.recipeButtonHeight;
    }

    craftrasCreativeSlotAt(x, y) {
        if (!global.craftrasCreative?.active || !global.craftrasInventory?.open) return null;
        const layout = this.craftrasInventoryLayout();
        const startX = layout.creativeX + 12;
        const startY = layout.panelY + 48;
        const items = global.craftrasCreative.items || [];
        const metrics = this.craftrasCreativeScrollMetrics(layout);
        const endRow = metrics.scrollRow + metrics.visibleRows;
        for (let row = metrics.scrollRow; row < endRow; row++) {
            for (let column = 0; column < layout.columns; column++) {
                const index = row * layout.columns + column;
                if (index >= items.length) return null;
                const left = startX + column * (layout.creativeSlotSize + layout.creativeGap);
                const top = startY + (row - metrics.scrollRow) * (layout.creativeSlotSize + layout.creativeGap);
                if (x >= left && x <= left + layout.creativeSlotSize && y >= top && y <= top + layout.creativeSlotSize) return index;
            }
        }
        return null;
    }

    craftrasInventorySlotAt(x, y) {
        if (!global.craftrasInventory?.open) return -1;
        const { columns, slotSize, gap, panelWidth, panelHeight, panelX, panelY, recipeOpen, recipeX, recipeWidth } = this.craftrasInventoryLayout();
        const startX = panelX + 18;
        const mainY = panelY + 205;

        for (let row = 0; row < 3; row++) {
            for (let column = 0; column < columns; column++) {
                const left = startX + column * (slotSize + gap);
                const top = mainY + row * (slotSize + gap);
                if (x >= left && x <= left + slotSize && y >= top && y <= top + slotSize) return 10 + row * columns + column;
            }
        }

        const hotbarY = panelY + panelHeight - slotSize - 17;
        for (let column = 0; column < columns; column++) {
            const left = startX + column * (slotSize + gap);
            if (x >= left && x <= left + slotSize && y >= hotbarY && y <= hotbarY + slotSize) return column;
        }
        const insideRecipe = recipeOpen && x >= recipeX && x <= recipeX + recipeWidth && y >= panelY && y <= panelY + panelHeight;
        const insidePanel = (x >= panelX && x <= panelX + panelWidth && y >= panelY && y <= panelY + panelHeight) || insideRecipe;
        return insidePanel ? -2 : -1;
    }

    craftrasBlacksmithSlotAt(x, y) {
        if (!global.craftrasInventory?.open || !global.craftrasBlacksmith?.open) return null;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const size = 52;
        const left = panelX + 64;
        const top = panelY + 72;
        return x >= left && x <= left + size && y >= top && y <= top + size ? 0 : null;
    }

    craftrasBlacksmithUnlockButtonAt(x, y) {
        if (!global.craftrasInventory?.open || !global.craftrasBlacksmith?.open) return false;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const left = panelX + 316;
        const top = panelY + 108;
        const width = 122;
        const height = 34;
        return x >= left && x <= left + width && y >= top && y <= top + height;
    }

    craftrasMerchantOfferAt(x, y) {
        if (!global.craftrasInventory?.open || !global.craftrasMerchant?.open) return null;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const cardW = 104, cardH = 48, cardGap = 8;
        const cardsX = panelX + 24, cardsY = panelY + 48;
        for (let index = 0; index < 8; index++) {
            const column = index % 4;
            const row = Math.floor(index / 4);
            const left = cardsX + column * (cardW + cardGap);
            const top = cardsY + row * (cardH + cardGap);
            if (x >= left && x <= left + cardW && y >= top && y <= top + cardH) return index;
        }
        return null;
    }

    craftrasBlesserOfferAt(x, y) {
        if (!global.craftrasInventory?.open || !global.craftrasBlesser?.open) return null;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const cardW = 142, cardH = 54, cardGap = 10;
        const cardsX = panelX + 32, cardsY = panelY + 54;
        for (let index = 0; index < 6; index++) {
            const column = index % 3;
            const row = Math.floor(index / 3);
            const left = cardsX + column * (cardW + cardGap);
            const top = cardsY + row * (cardH + cardGap);
            if (x >= left && x <= left + cardW && y >= top && y <= top + cardH) return index;
        }
        return null;
    }

    craftrasMerchantSellSlotAt(x, y) {
        if (!global.craftrasInventory?.open || !global.craftrasMerchant?.open) return null;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const left = panelX + 118;
        const top = panelY + 160;
        const size = 42;
        return x >= left && x <= left + size && y >= top && y <= top + size ? 0 : null;
    }

    craftrasMerchantSellButtonAt(x, y) {
        if (!global.craftrasInventory?.open || !global.craftrasMerchant?.open) return false;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const left = panelX + 176;
        const top = panelY + 164;
        const width = 128;
        const height = 34;
        return x >= left && x <= left + width && y >= top && y <= top + height;
    }

    craftrasClericRebirthButtonAt(x, y) {
        if (!global.craftrasInventory?.open || !global.craftrasCleric?.open) return false;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const left = panelX + 156;
        const top = panelY + (global.craftrasCleric.mode === "pope" ? 142 : 132);
        const width = 190;
        const height = 38;
        return x >= left && x <= left + width && y >= top && y <= top + height;
    }

    craftrasClericTokenSlotAt(x, y) {
        if (!global.craftrasInventory?.open || !global.craftrasCleric?.open || global.craftrasCleric.mode !== "token") return null;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const size = 46;
        const gap = 12;
        const startX = panelX + 66;
        const top = panelY + 75;
        for (let index = 0; index < 4; index++) {
            const left = startX + index * (size + gap);
            if (x >= left && x <= left + size && y >= top && y <= top + size) return index;
        }
        return null;
    }

    craftrasCraftingSlotAt(x, y) {
        if (!global.craftrasInventory?.open || !global.craftrasCrafting?.mode) return null;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const size = global.craftrasCrafting.size || 2;
        const slotSize = 42;
        const gap = 4;
        const startX = panelX + (global.craftrasCrafting.mode === 2 ? 245 : 42);
        const startY = panelY + 55;
        for (let row = 0; row < size; row++) {
            for (let column = 0; column < size; column++) {
                const left = startX + column * (slotSize + gap);
                const top = startY + row * (slotSize + gap);
                if (x >= left && x <= left + slotSize && y >= top && y <= top + slotSize) return row * size + column;
            }
        }
        const craftWidth = size * slotSize + (size - 1) * gap;
        const outputX = startX + craftWidth + 86;
        const outputY = startY + ((size * slotSize + (size - 1) * gap) - slotSize) / 2;
        if (x >= outputX && x <= outputX + slotSize && y >= outputY && y <= outputY + slotSize) return -1;
        return null;
    }

    craftrasHelmetSlotAt(x, y) {
        if (!global.craftrasInventory?.open || global.craftrasCrafting?.mode !== 2 || global.craftrasFurnace?.open || global.craftrasChest?.open) return false;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const left = panelX + 36;
        const top = panelY + 68;
        const size = 44;
        return x >= left && x <= left + size && y >= top && y <= top + size;
    }

    craftrasOffhandSlotAt(x, y) {
        if (!global.craftrasInventory?.open || global.craftrasCrafting?.mode !== 2 || global.craftrasFurnace?.open || global.craftrasChest?.open) return false;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const left = panelX + 36;
        const top = panelY + 120;
        const size = 44;
        return x >= left && x <= left + size && y >= top && y <= top + size;
    }

    craftrasFurnaceSlotAt(x, y) {
        if (!global.craftrasInventory?.open || !global.craftrasFurnace?.open) return null;
        const { panelX, panelY } = this.craftrasInventoryLayout();
        const slotSize = 42;
        const inputX = panelX + 74;
        const inputY = panelY + 55;
        const positions = [
            [inputX, inputY],
            [inputX, inputY + 58],
            [inputX + 150, inputY + 29],
        ];
        for (let index = 0; index < positions.length; index++) {
            const [left, top] = positions[index];
            if (x >= left && x <= left + slotSize && y >= top && y <= top + slotSize) return index;
        }
        return null;
    }

    craftrasChestSlotAt(x, y) {
        if (!global.craftrasInventory?.open || !global.craftrasChest?.open) return null;
        const { panelX, panelY, panelWidth } = this.craftrasInventoryLayout();
        const columns = 9;
        const slotSize = 42;
        const gap = 4;
        const gridWidth = columns * slotSize + (columns - 1) * gap;
        const startX = panelX + (panelWidth - gridWidth) / 2;
        const startY = panelY + 48;
        for (let row = 0; row < 3; row++) {
            for (let column = 0; column < columns; column++) {
                const left = startX + column * (slotSize + gap);
                const top = startY + row * (slotSize + gap);
                if (x >= left && x <= left + slotSize && y >= top && y <= top + slotSize) return row * columns + column;
            }
        }
        return null;
    }

    craftrasInventoryPoint(clientX, clientY) {
        const rect = this.cv.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * global.screenWidth / Math.max(1, rect.width),
            y: (clientY - rect.top) * global.screenHeight / Math.max(1, rect.height),
        };
    }
    record() {
        let AdvancedCanvasCapturer = () => {
            let canvas = this.cvb.cloneNode();
            let ctx = canvas.getContext("2d");
            let toMerge = [];
            let stop = false;
            return {
                init: () => {
                    let glCanvas = global.glCanvas || null;
                    // Merge all layers, including WebGL2 if present
                    toMerge = glCanvas
                    ? [this.cvb, glCanvas, this.cvg, this.cvu]
                    : [this.cvb, this.cvg, this.cvu];
                    ctx.canvas.width = this.cv.width;
                    ctx.canvas.height = this.cv.height;
                },
                start: () => {
                    stop = false; // Reset flag
                    ctx.canvas.width = this.cv.width; // Set Width
                    ctx.canvas.height = this.cv.height; // Set Height
                    const anim = () => {
                        if (stop) return;
                        if (ctx.canvas.width !== this.cv.width || ctx.canvas.height !== this.cv.height) {
                            global.createMessage("Recorder stopped due to resize change. Saving file...", 5_000);
                            this.videoRecorder.stop();
                            this.videoRecorderCanvas.stop();
                            setTimeout(() => this.videoRecorder.download(), 200);
                        }
                        ctx.fillRect(0, 0, this.cv.width, this.cv.height);
                        toMerge.forEach(layer => {
                            if (layer) ctx.drawImage(layer, 0, 0);
                        });
                        requestAnimationFrame(anim);
                    };
                    anim();
                },
                stop: () => { stop = true; },
                getCanvas: () => canvas
            }
        }
        if (this.cv.captureStream && window.MediaRecorder) {
            if (this.videoRecorder) {
                switch (this.videoRecorder.state) {
                    case "inactive":
                        global.createMessage("Recorder Started!", 2_000);
                        this.videoRecorderCanvas.start();
                        this.videoRecorder.start();
                        break;
                    case "recording":
                        global.createMessage("Recorder Stopped! Saving file...", 5_000);
                        this.videoRecorder.stop();
                        this.videoRecorderCanvas.stop();
                        setTimeout(() => this.videoRecorder.download(), 200);
                }
            } else {
                this.videoRecorderCanvas = AdvancedCanvasCapturer();
                this.videoRecorderCanvas.init();
                this.videoRecorderCanvas.start();
                this.videoRecorder = new AdvancedRecorder(this.videoRecorderCanvas.getCanvas(), 60);
                global.createMessage("Recorder Started!", 2_000);
                this.videoRecorder.start();
            }
        }
    }
    screenshot() {
        let AdvancedCanvasCapturer = () => {
            let canvas = this.cvb.cloneNode();
            let ctx = canvas.getContext("2d");
            let toMerge = [];
            return {
                init: () => {
                    let glCanvas = global.glCanvas || null;
                    // Merge all layers, including WebGL2 if present
                    toMerge = glCanvas
                    ? [this.cvb, glCanvas, this.cvg, this.cvu]
                    : [this.cvb, this.cvg, this.cvu];
                    ctx.canvas.width = this.cv.width;
                    ctx.canvas.height = this.cv.height;
                },
                capture: () => {
                    ctx.canvas.width = this.cv.width; // Set Width
                    ctx.canvas.height = this.cv.height; // Set Height
                    ctx.fillStyle = "#ffffff"
                    ctx.fillRect(0, 0, this.cv.width, this.cv.height);
                    toMerge.forEach(layer => {
                        if (layer) ctx.drawImage(layer, 0, 0);
                    });
                    
                },
                getCanvas: () => canvas
            }
        }
        if (this.screenshotCanvas) {
            this.screenshotCanvas.capture();
        } else {
            this.screenshotCanvas = AdvancedCanvasCapturer();
            this.screenshotCanvas.init();
            this.screenshotCanvas.capture();
        }
        let cv = this.screenshotCanvas.getCanvas();
        var x = cv.toDataURL(),
            k = atob(x.split(",")[1]);
        x = x.split(",")[0].split(":")[1].split(";")[0];
        let p = new Uint8Array(k.length);
        for (let a = 0; a < k.length; a++) p[a] = k.charCodeAt(a);
        let q = URL.createObjectURL(new Blob([p], {type: x})),
        w = document.createElement("a");
        w.style.display = "none";
        w.setAttribute("download", "osa-screenshot.png");
        w.setAttribute("href", q);
        document.body.appendChild(w);
        setTimeout(() => {
            URL.revokeObjectURL(q);
            document.body.removeChild(w);
        }, 100);
        w.click();
        global.createMessage("Saving screenshot...", 3_000);
    }
    // MOBILE SUPPORT
    touchStart(e) {
        e.preventDefault();
        if (global.died && !global.cannotRespawn) {
            this.respawn();
            global.resetTarget();
        } else {
            for (let touch of e.changedTouches) {
                let mpos = {
                    x: touch.clientX * global.ratio,
                    y: touch.clientY * global.ratio,
                };
                if (global.craftrasTeamInvite?.active) {
                    const inviteAction = global.clickables.teamInvite.check(mpos);
                    if (inviteAction !== -1) {
                        this.socket.talk("CTA", inviteAction === 0 ? 1 : 0);
                        global.craftrasTeamInvite = { active: false, inviter: "", kind: "invite", expiresAt: 0 };
                        global.clickables.teamInvite.hide();
                        return;
                    }
                }
                if (global.craftrasChallengeEntry?.open) {
                    const challengeAction = global.clickables.challengeEntry.check(mpos);
                    if (challengeAction !== -1) {
                        this.socket.talk("CSA", challengeAction === 0 ? 1 : 0);
                        if (challengeAction === 1) {
                            global.craftrasChallengeEntry = { open: false, teamName: "", memberCount: 1, isHost: true };
                            global.clickables.challengeEntry.hide();
                        }
                    }
                    return;
                }
                let id = touch.identifier;
                let buttonIndex = global.clickables.mobileButtons.check(mpos);
                if (buttonIndex !== -1) {
                    switch (buttonIndex) {
                        case 0:
                            global.clickables.mobileButtons.active = !global.clickables.mobileButtons.active;
                            break;
                        case 1:
                            if (global.clickables.mobileButtons.active) {
                                global.clickables.mobileButtons.altFire =
                                    !global.clickables.mobileButtons.altFire;
                                if (!global.clickables.mobileButtons.altFire)
                                    this.socket.cmd.set(6, false);
                            } else if (global.isInverted)
                                (global.isInverted = false), this.socket.cmd.set(6, false);
                            else (global.isInverted = true), this.socket.cmd.set(6, true);
                            break;
                        case 2:
                            if (!document.fullscreenElement) {
                                var d = document.body;
                                d.requestFullscreen
                                    ? d.requestFullscreen()
                                    : d.msRequestFullscreen
                                        ? d.msRequestFullscreen()
                                        : d.mozRequestFullScreen
                                            ? d.mozRequestFullScreen()
                                            : d.webkitRequestFullscreen && d.webkitRequestFullscreen();
                            } else {
                                document.exitFullscreen();
                            }
                            break;
                        case 3:
                            this.socket.talk("t", 1, true);
                            break;
                        case 4:
                            this.reverseDirection = !this.reverseDirection;
                            global.createMessage(this.reverseDirection ? "Reverse tank enabled." : "Reverse tank disabled.");
                            break;
                        case 5:
                            this.socket.talk("1");
                            break;
                        case 6:
                            global.autoSpin = !global.autoSpin;
                            this.socket.talk("t", 0, true);
                            break;
                        case 7:
                            this.socket.talk("t", 2, true);
                            break;
                        case 8:
                            this.socket.talk("L");
                            break;
                        case 9:
                            this.socket.talk("H");
                            break;
                        case 10:
                            this.socket.talk("0");
                            break;
                        case 11:
                            if (global.gameStart && !global.died && !global.disconnected) {
                                this.spawnChatInput();
                                break;
                            }
                            break;
                        default:
                            throw new Error("Unknown button index.");
                    }
                } else {
                    let statIndex = global.clickables.stat.check(mpos);
                    let exitGame = global.clickables.exitGame.check(mpos);
                    let reconnectCheck = global.clickables.reconnect.check(mpos);
                    if (reconnectCheck !== -1) {
                        if (global.disconnected) global.reconnect();
                    } else if (exitGame !== -1) {
                        if (global.disconnected || global.died) global.exit();
                    } else if (statIndex !== -1) this.socket.talk("x", statIndex, 0);
                    else if (global.clickables.skipUpgrades.check(mpos) !== -1)
                        global.clearUpgrades();
                    else {
                        let upgradeIndex = global.clickables.upgrade.check(mpos);
                        if (upgradeIndex !== -1)
                            this.socket.talk("U", upgradeIndex, parseInt(gui.upgrades[upgradeIndex][0]));
                        else {
                            let onLeft = mpos.x < this.cv.width / 2;
                            if (this.movementTouch === null && onLeft) {
                                this.movementTouch = id;
                            } else if (this.controlTouch === null && !onLeft) {
                                this.controlTouch = id;
                                this.socket.cmd.set(4, true);
                            }
                        }
                    }
                }
            }
            this.touchMove(e);
        }
    }
    touchMove(e) {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            let mpos = {
                x: touch.clientX * global.ratio,
                y: touch.clientY * global.ratio,
            };
            let id = touch.identifier;

            if (this.movementTouch === id) {
                let radius = Math.min(global.screenWidth * 0.6, global.screenHeight * 0.12);
                let cx = (mpos.x - (this.cv.width * 1) / 6)  / (radius / 64);
                let cy = (mpos.y - (this.cv.height * 2) / 3)  / (radius / 64);
                let touchX = cx / (radius / 64);
                let touchY = cy / (radius / 64);
                let r = Math.sqrt(cx ** 2 + cy ** 2);
                let angle = Math.atan2(cy, cx);
                if (r > radius) {
                    touchX = Math.cos(angle) * radius / 1.05;
                    touchY = Math.sin(angle) * radius / 1.05;
                }
                this.movementTouchPos = { x: touchX, y: touchY };
                let x = mpos.x - (this.cv.width * 1) / 6;
                let y = mpos.y - (this.cv.height * 2) / 3;
                let norm = Math.sqrt(x * x + y * y);
                x /= norm;
                y /= norm;
                let amount = 0.38268323650898;
                if (y < -amount !== this.movementTop)
                    this.socket.cmd.set(0, (this.movementTop = y < -amount));
                if (y > amount !== this.movementBottom)
                    this.socket.cmd.set(1, (this.movementBottom = y > amount));
                if (x < -amount !== this.movementLeft)
                    this.socket.cmd.set(2, (this.movementLeft = x < -amount));
                if (x > amount !== this.movementRight)
                    this.socket.cmd.set(3, (this.movementRight = x > amount));
            } else if (this.controlTouch === id) {
                global.mobileStatus.showCrosshair = true;
                let radius = Math.min(
                    global.screenWidth * 0.6,
                    global.screenHeight * 0.12
                );
                let cx = (mpos.x - (this.cv.width * 5) / 6)  / (radius / 64);
                let cy = (mpos.y - (this.cv.height * 2) / 3)  / (radius / 64);
                let touchX = cx / (radius / 64);
                let touchY = cy / (radius / 64);
                let r = Math.sqrt(cx ** 2 + cy ** 2);
                let angle = Math.atan2(cy, cx);
                if (r > radius) {
                    touchX = Math.cos(angle) * radius / 1.05;
                    touchY = Math.sin(angle) * radius / 1.05;
                }
                this.controlTouchPos = { x: touchX, y: touchY };
                if (!this.spinLock) {
                    if (cx < -radius) cx = -radius;
                    else if (cx > radius) cx = radius;
                    if (cy < -radius) cy = -radius;
                    else if (cy > radius) cy = radius;
                    this.target.x = ((cx / radius) * global.screenWidth) / 2;
                    this.target.y = ((cy / radius) * global.screenHeight) / 2;
                }
            }
        }
        global.mouse = this.target;
    }
    touchEnd(e) {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            let id = touch.identifier;
      
            if (this.movementTouch === id) {
                this.movementTouch = null;
                this.movementTouchPos = { x: 0, y: 0 };
                if (this.movementTop) this.socket.cmd.set(0, (this.movementTop = false));
                if (this.movementBottom) this.socket.cmd.set(1, (this.movementBottom = false));
                if (this.movementLeft) this.socket.cmd.set(2, (this.movementLeft = false));
                if (this.movementRight) this.socket.cmd.set(3, (this.movementRight = false));
            } else if (this.controlTouch === id) {
                this.controlTouch = null;
                this.controlTouchPos = { x: 0, y: 0 };
                this.socket.cmd.set(4, false);
                global.mobileStatus.showCrosshair = false;
            }
        }
    }
    // CONTROLLER/GAMEPAD SUPPORT
    runGamepad() {
        let sendHelp = () => {
            let helpLines = [
                "Control help menu:",
                "Options button = Help Menu",
                "RT / R2 = Fire",
                "LT / L2 = Alt Fire",
                "Left Joystick: Move Body",
                "Right Joystick: Move Face",
                "A / X = Autofire",
                "B / O = Autospin",
                "X / ??= Override",
                "Y / ??= Take Control",
            ];
            global.createMessage(JSON.stringify(helpLines), 15_000, true);
        }
        let gamepadControls = {
            A: 0,
            B: 0,
            X: 0,
            Y: 0,
            help: 0,
        }
        global.gamepadMode = true;
        global.player.target = this.target;
        this.gamepadInterval = setInterval(() => {
            let gamepads = navigator.getGamepads().find((x) => x !== null)
            if (gamepads) {
                this.gamepad = gamepads;
            } else this.gamepad = undefined;
            if (this.gamepad) {
                let angle = (p) => (p < this.gamepad.axes.length ? this.gamepad.axes[p] : 0);
                let target = this.gamepad.axes.slice(0, 2).map((x) => Math.round(x))
                var h = angle(2);
                angle = angle(3);
                if (0.01 < h * h + angle * angle) {
                    let p = 0.6 * Math.max(global.screenWidth, global.screenHeight);
                    this.target.x = (h * p);
                    this.target.y = (angle * p);
                    global.mobileStatus.showCrosshair = true;
                } else global.mobileStatus.showCrosshair = false;
                /*for (let i = 0; i < this.gamepad.buttons.length; i++) { // If you want to add a button, uncomment this and get the array number.
                    let info = this.gamepad.buttons[i];
                    if (info.pressed) {
                        let debugLine = [
                            "(DEBUG)",
                            `Array number: ${i}`,
                        ];
                        global.createMessage(JSON.stringify(debugLine), 5_000, true);
                    }
                }*/
                // Button presses
                if (this.gamepad.buttons[0].pressed) {
                    gamepadControls.A++
                } else {
                    gamepadControls.A = 0;
                }
                if (this.gamepad.buttons[1].pressed) {
                    gamepadControls.B++
                } else {
                    gamepadControls.B = 0;
                }
                if (this.gamepad.buttons[2].pressed) {
                    gamepadControls.X++
                } else {
                    gamepadControls.X = 0;
                }
                if (this.gamepad.buttons[3].pressed) {
                    gamepadControls.Y++
                } else {
                    gamepadControls.Y = 0;
                }
                if (this.gamepad.buttons[9].pressed) {
                    gamepadControls.help++
                } else {
                    gamepadControls.help = 0;
                }
                if (gamepadControls.A === 1) {
                    this.socket.talk("t", 1, true);
                }
            
                if (gamepadControls.B === 1) {
                    global.autoSpin = !global.autoSpin;
                    this.socket.talk("t", 0, true);
                }
            
                if (gamepadControls.X === 1) {
                    this.socket.talk("t", 2, true);
                }
            
                if (gamepadControls.Y === 1) {
                    this.socket.talk('H');
                }

                if (gamepadControls.help === 1) {
                    sendHelp();
                }
                // Shoot
                if (this.gamepad.buttons[7].pressed) {
                    if (global.died && !global.cannotRespawn) {
                        this.socket.talk('s', global.playerName, 0, 1 * config.game.autoLevelUp);
                        global.died = false;
                    } else {
                        this.socket.cmd.set(4, true);
                    }
                } else {
                    this.socket.cmd.set(4, false);
                }
                // Alt shoot
                if (this.gamepad.buttons[6].pressed) {
                    this.socket.cmd.set(6, true);
                } else {
                    this.socket.cmd.set(6, false);
                }
                // Move body
                let cx = 0;
                let cy = 0;
                let ex = target[0];
                let ey = target[1];
                if (ex > cx) {
                    this.socket.cmd.set(2, false);
                    this.socket.cmd.set(3, true);
                } else if (ex < cx) {
                    this.socket.cmd.set(2, true);
                    this.socket.cmd.set(3, false);
                } else {
                    this.socket.cmd.set(2, false);
                    this.socket.cmd.set(3, false);
                }
                
                if (ey > cy) {
                    this.socket.cmd.set(0, false);
                    this.socket.cmd.set(1, true);
                } else if (ey < cy) {
                    this.socket.cmd.set(0, true);
                    this.socket.cmd.set(1, false);
                } else {
                    this.socket.cmd.set(0, false);
                    this.socket.cmd.set(1, false);
                }
            }
        }, 10)
        global.createMessage("Gamepad mode initalized and ready to use.");
        sendHelp();
    }
    stopGamepad() {
        clearInterval(this.gamepadInterval);
        this.gamepad = undefined;
        global.gamepadMode = false;
        this.socket.cmd.set(0, false);
        this.socket.cmd.set(1, false);
        this.socket.cmd.set(2, false);
        this.socket.cmd.set(3, false);
        this.socket.cmd.set(4, false);
        this.socket.cmd.set(6, false);
    }
}
export { Canvas }
