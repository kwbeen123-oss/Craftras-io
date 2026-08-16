const $ = id => document.getElementById(id);
const hitboxEditor = window.CraftrasHitboxEditor;

const dom = {
    modeButtons: [...document.querySelectorAll("[data-editor-mode]")],
    itemId: $("itemId"), itemName: $("itemName"), itemDescription: $("itemDescription"),
    itemDamage: $("itemDamage"), itemDamageWalls: $("itemDamageWalls"),
    itemRenderScale: $("itemRenderScale"), itemRotationOffset: $("itemRotationOffset"),
    itemHitStart: $("itemHitStart"), itemHitEnd: $("itemHitEnd"),
    trailEnabled: $("trailEnabled"), trailColor: $("trailColor"), trailOpacity: $("trailOpacity"),
    trailSize: $("trailSize"), trailDuration: $("trailDuration"), trailInterval: $("trailInterval"),
    itemPreviewCanvas: $("itemPreviewCanvas"), animationCanvas: $("animationCanvas"),
    animationReadout: $("animationReadout"), animationPlayButton: $("animationPlayButton"),
    animationPlayhead: $("animationPlayhead"), animationDuration: $("animationDuration"),
    comboList: $("comboList"), comboCount: $("comboCount"), newComboButton: $("newComboButton"), addComboAttackButton: $("addComboAttackButton"),
    addSheatheButton: $("addSheatheButton"), deleteComboAttackButton: $("deleteComboAttackButton"),
    comboDashEnabled: $("comboDashEnabled"), comboDashDistance: $("comboDashDistance"),
    comboDamage: $("comboDamage"), comboAnchorMode: $("comboAnchorMode"),
    comboCooldown: $("comboCooldown"), comboPreviewEnabled: $("comboPreviewEnabled"),
    comboScreenCutEnabled: $("comboScreenCutEnabled"), screenCutToggle: $("screenCutToggle"),
    specialActionList: $("specialActionList"), specialActionCount: $("specialActionCount"),
    addSpecialActionButton: $("addSpecialActionButton"), deleteSpecialActionButton: $("deleteSpecialActionButton"),
    specialActionKey: $("specialActionKey"), specialActionName: $("specialActionName"), specialActionCooldown: $("specialActionCooldown"),
    addKeyframeButton: $("addKeyframeButton"), deleteKeyframeButton: $("deleteKeyframeButton"),
    keyframeList: $("keyframeList"), frameAngle: $("frameAngle"), frameGripAngle: $("frameGripAngle"),
    frameGripOffset: $("frameGripOffset"), frameSize: $("frameSize"),
    animationLayerSelect: $("animationLayerSelect"), frameLayerAngle: $("frameLayerAngle"),
    frameLayerScale: $("frameLayerScale"), frameLayerX: $("frameLayerX"), frameLayerY: $("frameLayerY"),
    addImageLayerButton: $("addImageLayerButton"), layerImageInput: $("layerImageInput"),
    layerHitboxInput: $("layerHitboxInput"), loadLayerHitboxButton: $("loadLayerHitboxButton"),
    weaponLayerList: $("weaponLayerList"), layerName: $("layerName"), layerPriority: $("layerPriority"),
    layerScale: $("layerScale"), layerOffsetX: $("layerOffsetX"), layerOffsetY: $("layerOffsetY"),
    layerRotation: $("layerRotation"), layerOpacity: $("layerOpacity"),
    layerAnchorMode: $("layerAnchorMode"),
    layerAnchorX: $("layerAnchorX"), layerAnchorY: $("layerAnchorY"),
    layerDamageEnabled: $("layerDamageEnabled"), moveLayerBackButton: $("moveLayerBackButton"),
    moveLayerFrontButton: $("moveLayerFrontButton"), layerFlipButton: $("layerFlipButton"), deleteLayerButton: $("deleteLayerButton"),
    layerHitboxStatus: $("layerHitboxStatus"), downloadItemButton: $("downloadItemButton"),
    installItemButton: $("installItemButton"), installItemTopButton: $("installItemTopButton"),
    installStatus: $("installStatus"),
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const defaultLayerMotion = () => ({ angle: 0, x: 0, y: 0, scale: 1 });
const cloneKeyframes = frames => structuredClone(frames);
const makeSlashKeyframes = () => [
    { time: 0, angle: -45, gripAngle: 0, gripOffset: 10, size: 18.5, layers: {} },
    { time: 0.18, angle: 125, gripAngle: 96, gripOffset: 12.8, size: 18.5, layers: {} },
    { time: 0.62, angle: -105, gripAngle: -60, gripOffset: 14, size: 27, layers: {} },
    { time: 1, angle: -45, gripAngle: 0, gripOffset: 10, size: 18.5, layers: {} },
];
const makeSheatheKeyframes = () => [
    { time: 0, angle: -45, gripAngle: 0, gripOffset: 10, size: 18.5, layers: {} },
    { time: 0.15, angle: 118, gripAngle: 94, gripOffset: 12.5, size: 19, layers: {} },
    { time: 0.45, angle: -110, gripAngle: -62, gripOffset: 14, size: 27, layers: {} },
    { time: 0.72, angle: 140, gripAngle: 168, gripOffset: 6, size: 16.5, layers: {} },
    { time: 1, angle: 140, gripAngle: 168, gripOffset: 6, size: 16.5, layers: {} },
];
const makeComboAttack = (keyframes, options = {}) => ({
    type: options.type === "sheathe" ? "sheathe" : "slash",
    duration: options.duration ?? 700,
    cooldown: options.cooldown === undefined || options.cooldown === null || options.cooldown === ""
        ? 0
        : clamp(Number(options.cooldown), 0, 60000),
    dash: !!options.dash,
    dashDistance: options.dashDistance ?? 3,
    damage: Number.isFinite(Number(options.damage)) ? Math.max(0, Number(options.damage)) : null,
    anchorMode: ["body", "main"].includes(options.anchorMode) ? options.anchorMode : "weapon",
    screenCut: !!options.screenCut,
    keyframes: cloneKeyframes(keyframes),
});
const makeSpecialActionKeyframes = () => [
    { time: 0, angle: -45, gripAngle: 0, gripOffset: 10, size: 18.5, layers: {} },
    { time: 0.35, angle: 48, gripAngle: 50, gripOffset: 11.5, size: 20, layers: {} },
    { time: 0.7, angle: -118, gripAngle: -42, gripOffset: 12.5, size: 21, layers: {} },
    { time: 1, angle: -45, gripAngle: 0, gripOffset: 10, size: 18.5, layers: {} },
];
const makeSpecialAction = (options = {}) => ({
    type: "emote",
    name: String(options.name || "Special action").slice(0, 40),
    key: ["z", "x", "c", "v", "b", "n", "m"].includes(options.key) ? options.key : "z",
    duration: clamp(Number(options.duration ?? 900), 80, 10000),
    cooldown: clamp(Number(options.cooldown ?? 0), 0, 60000),
    anchorMode: ["body", "main"].includes(options.anchorMode) ? options.anchorMode : "weapon",
    keyframes: cloneKeyframes(options.keyframes?.length >= 2 ? options.keyframes : makeSpecialActionKeyframes()),
});
const makeMainLayer = () => ({
    id: "main", name: "Main weapon", primary: true, priority: 10, scale: 1,
    offsetX: 0, offsetY: 0, rotation: 0, opacity: 1, anchor: { x: 0.5, y: 0.5 },
    flipX: false, anchorMode: "weapon", anchorModeExplicit: true, damageEnabled: true, polygons: [], imageDataUrl: null, imageName: "", mimeType: "", width: 1, height: 1,
    imageElement: null,
});

const state = {
    mode: "hitbox", playing: false, playStartedAt: 0, selectedKeyframe: 0,
    selectedLayerId: "main", animationLayerId: "main", layerCounter: 1, activeComboIndex: 0, activeSpecialIndex: -1,
    canvasDrag: null, previewWholeCombo: true,
    layers: [makeMainLayer()],
    comboAttacks: [makeComboAttack(makeSlashKeyframes())],
    specialActions: [],
    keyframes: null,
};
state.keyframes = state.comboAttacks[0].keyframes;

function activeComboAttack() {
    return state.comboAttacks[state.activeComboIndex] || state.comboAttacks[0];
}

function isEditingSpecialAction() {
    return Number.isInteger(state.activeSpecialIndex) && state.activeSpecialIndex >= 0;
}

function activeAnimation() {
    return isEditingSpecialAction()
        ? state.specialActions[state.activeSpecialIndex]
        : activeComboAttack();
}

function ensureFrameLayerMotions(frames) {
    for (const frame of frames || []) for (const layer of state.layers) ensureLayerMotion(frame, layer.id);
}

function commitActiveComboControls() {
    const attack = activeAnimation();
    if (!attack) return;
    if (isEditingSpecialAction()) {
        attack.duration = clamp(getNumber(dom.animationDuration, attack.duration || 900), 80, 10000);
        attack.cooldown = clamp(getNumber(dom.specialActionCooldown, attack.cooldown ?? 0), 0, 60000);
        attack.key = ["z", "x", "c", "v", "b", "n", "m"].includes(dom.specialActionKey.value) ? dom.specialActionKey.value : attack.key;
        attack.name = dom.specialActionName.value.trim().slice(0, 40) || attack.name;
        return;
    }
    attack.duration = clamp(getNumber(dom.animationDuration, attack.duration || 700), 80, 10000);
    attack.cooldown = clamp(getNumber(dom.comboCooldown, attack.cooldown ?? 0), 0, 60000);
    attack.dash = attack.type !== "sheathe" && !!dom.comboDashEnabled.checked;
    attack.dashDistance = clamp(getNumber(dom.comboDashDistance, attack.dashDistance || 3), 1, 20);
    attack.damage = Math.max(0, getNumber(dom.comboDamage, attack.damage ?? getNumber(dom.itemDamage, 100)));
    attack.anchorMode = ["body", "main"].includes(dom.comboAnchorMode.value) ? dom.comboAnchorMode.value : "weapon";
    if (attack.type !== "sheathe") attack.screenCut = !!dom.comboScreenCutEnabled.checked;
}

function comboAttackLabel(attack, index) {
    return attack.type === "sheathe" ? "검집 넣기 · 자동" : `${index + 1}타`;
}

function renderComboControls() {
    const attack = activeAnimation();
    if (!attack) return;
    const editingSpecial = isEditingSpecialAction();
    const isSheathe = !editingSpecial && attack.type === "sheathe";
    const isFinished = state.comboAttacks.some(entry => entry.type === "sheathe");
    dom.comboList.replaceChildren();
    state.comboAttacks.forEach((entry, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `combo-step${index === state.activeComboIndex ? " active" : ""}${entry.type === "sheathe" ? " finish" : ""}`;
        button.textContent = comboAttackLabel(entry, index);
        button.title = `${comboAttackLabel(entry, index)} 애니메이션 편집`;
        button.addEventListener("click", () => selectComboAttack(index));
        dom.comboList.append(button);
    });
    dom.comboCount.textContent = `${state.comboAttacks.length} / 100`;
    dom.addComboAttackButton.disabled = isFinished || state.comboAttacks.length >= 100;
    dom.addSheatheButton.disabled = isFinished || state.comboAttacks.length >= 100;
    dom.deleteComboAttackButton.disabled = state.comboAttacks.length <= 1;
    dom.comboDashEnabled.checked = !editingSpecial && !isSheathe && !!attack.dash;
    dom.comboDashEnabled.disabled = editingSpecial || isSheathe;
    dom.comboDashDistance.disabled = editingSpecial || isSheathe;
    dom.comboDashDistance.value = attack.dashDistance ?? 3;
    dom.comboDamage.value = attack.damage ?? Math.max(0, getNumber(dom.itemDamage, 100));
    dom.comboDamage.disabled = editingSpecial || isSheathe;
    dom.comboAnchorMode.value = ["body", "main"].includes(attack.anchorMode) ? attack.anchorMode : "weapon";
    dom.comboAnchorMode.disabled = editingSpecial || isSheathe;
    dom.comboCooldown.disabled = editingSpecial;
    dom.comboCooldown.value = attack.cooldown ?? 0;
    dom.comboScreenCutEnabled.checked = !editingSpecial && !isSheathe && !!attack.screenCut;
    dom.comboScreenCutEnabled.disabled = editingSpecial || isSheathe;
    dom.screenCutToggle.classList.toggle("disabled", editingSpecial || isSheathe);
    dom.animationDuration.value = attack.duration ?? 700;
}

function renderSpecialActionControls() {
    dom.specialActionList.replaceChildren();
    state.specialActions.forEach((action, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `combo-step${isEditingSpecialAction() && index === state.activeSpecialIndex ? " active" : ""}`;
        button.textContent = `${action.key.toUpperCase()} · ${action.name}`;
        button.title = "Edit this special action";
        button.addEventListener("click", () => selectSpecialAction(index));
        dom.specialActionList.append(button);
    });
    dom.specialActionCount.textContent = `${state.specialActions.length} / 2`;
    dom.addSpecialActionButton.disabled = state.specialActions.length >= 2;
    dom.deleteSpecialActionButton.disabled = !isEditingSpecialAction();
    const action = activeAnimation();
    const special = isEditingSpecialAction() ? action : null;
    dom.specialActionKey.disabled = !special;
    dom.specialActionName.disabled = !special;
    dom.specialActionCooldown.disabled = !special;
    dom.specialActionKey.value = special?.key || "z";
    dom.specialActionName.value = special?.name || "Special action";
    dom.specialActionCooldown.value = special?.cooldown ?? 0;
}

function selectComboAttack(index) {
    commitActiveComboControls();
    state.activeSpecialIndex = -1;
    state.activeComboIndex = clamp(index, 0, state.comboAttacks.length - 1);
    const attack = activeComboAttack();
    state.keyframes = attack.keyframes;
    ensureFrameLayerMotions(state.keyframes);
    state.selectedKeyframe = 0;
    state.playing = false;
    dom.animationPlayButton.textContent = "▶";
    dom.animationPlayhead.value = "0";
    renderComboControls();
    renderSpecialActionControls();
    renderKeyframes();
}

function selectSpecialAction(index) {
    commitActiveComboControls();
    state.activeSpecialIndex = clamp(index, 0, state.specialActions.length - 1);
    const action = activeAnimation();
    state.keyframes = action.keyframes;
    ensureFrameLayerMotions(state.keyframes);
    state.selectedKeyframe = 0;
    state.playing = false;
    dom.animationPlayButton.textContent = "Play";
    dom.animationPlayhead.value = "0";
    renderComboControls();
    renderSpecialActionControls();
    renderKeyframes();
}

function addComboAttack() {
    if (state.comboAttacks.length >= 100 || state.comboAttacks.some(attack => attack.type === "sheathe")) return;
    const attack = makeComboAttack(makeSlashKeyframes());
    ensureFrameLayerMotions(attack.keyframes);
    state.comboAttacks.push(attack);
    selectComboAttack(state.comboAttacks.length - 1);
}

function addSpecialAction() {
    if (state.specialActions.length >= 2) return;
    const usedKeys = new Set(state.specialActions.map(action => action.key));
    const key = ["z", "x", "c", "v", "b", "n", "m"].find(candidate => !usedKeys.has(candidate)) || "z";
    const action = makeSpecialAction({ key, name: `Special action ${state.specialActions.length + 1}` });
    ensureFrameLayerMotions(action.keyframes);
    state.specialActions.push(action);
    selectSpecialAction(state.specialActions.length - 1);
}

function deleteSpecialAction() {
    if (!isEditingSpecialAction()) return;
    state.specialActions.splice(state.activeSpecialIndex, 1);
    state.activeSpecialIndex = -1;
    state.activeComboIndex = Math.min(state.activeComboIndex, state.comboAttacks.length - 1);
    state.keyframes = activeComboAttack().keyframes;
    state.selectedKeyframe = 0;
    renderKeyframes();
}

function cloneFrameAtTime(frame, time = 0) {
    const clone = structuredClone(frame);
    clone.time = time;
    clone.layers ||= {};
    return clone;
}

function makeLinkedSheatheKeyframes(previousFrame) {
    const frames = makeSheatheKeyframes();
    if (!previousFrame) return frames;
    const start = cloneFrameAtTime(previousFrame, 0);
    const carriedLayers = structuredClone(start.layers || {});
    frames.forEach(frame => { frame.layers = structuredClone(carriedLayers); });
    frames[0] = start;
    return frames;
}

function addSheatheAnimation() {
    if (state.comboAttacks.length >= 100 || state.comboAttacks.some(attack => attack.type === "sheathe")) return;
    const previous = state.comboAttacks.at(-1)?.keyframes?.at(-1);
    const attack = makeComboAttack(makeLinkedSheatheKeyframes(previous), { type: "sheathe", cooldown: 0 });
    ensureFrameLayerMotions(attack.keyframes);
    state.comboAttacks.push(attack);
    selectComboAttack(state.comboAttacks.length - 1);
}

function makeNewThreeHitCombo() {
    if (state.comboAttacks.length && !window.confirm("현재 콤보 시퀀스를 새 3타 + 자동 검집 넣기로 바꿀까요?")) return;
    const attacks = [
        makeComboAttack(makeSlashKeyframes(), { cooldown: 0 }),
        makeComboAttack(makeSlashKeyframes(), { cooldown: 0 }),
        makeComboAttack(makeSlashKeyframes(), { cooldown: 0 }),
    ];
    attacks[1].keyframes[0] = cloneFrameAtTime(attacks[0].keyframes.at(-1), 0);
    attacks[2].keyframes[0] = cloneFrameAtTime(attacks[1].keyframes.at(-1), 0);
    const sheathe = makeComboAttack(makeLinkedSheatheKeyframes(attacks[2].keyframes.at(-1)), { type: "sheathe", cooldown: 0 });
    state.comboAttacks = [...attacks, sheathe];
    state.activeSpecialIndex = -1;
    state.activeComboIndex = 0;
    state.keyframes = attacks[0].keyframes;
    for (const attack of state.comboAttacks) ensureFrameLayerMotions(attack.keyframes);
    state.selectedKeyframe = 0;
    renderKeyframes();
}

function deleteComboAttack() {
    if (state.comboAttacks.length <= 1) return;
    state.activeSpecialIndex = -1;
    state.comboAttacks.splice(state.activeComboIndex, 1);
    selectComboAttack(Math.min(state.activeComboIndex, state.comboAttacks.length - 1));
}

function setMode(mode) {
    state.mode = ["hitbox", "item", "animation"].includes(mode) ? mode : "hitbox";
    document.body.dataset.editorMode = state.mode;
    for (const button of dom.modeButtons) button.classList.toggle("active", button.dataset.editorMode === state.mode);
    syncMainLayer();
    if (state.mode === "item") drawItemPreview();
    if (state.mode === "animation") drawAnimation();
}

function getNumber(input, fallback) {
    const value = Number(input.value);
    return Number.isFinite(value) ? value : fallback;
}

function selectedLayer() {
    return state.layers.find(layer => layer.id === state.selectedLayerId) || state.layers[0];
}

function syncMainLayer() {
    const layer = state.layers.find(entry => entry.primary) || state.layers[0];
    const image = hitboxEditor.getImage();
    const runtime = hitboxEditor.getRuntime();
    layer.id = "main";
    layer.primary = true;
    layer.imageElement = image.element;
    layer.imageDataUrl = image.dataUrl;
    layer.imageName = image.name;
    layer.mimeType = image.mimeType;
    layer.width = image.width || 1;
    layer.height = image.height || 1;
    layer.anchor = { ...image.anchor };
    layer.polygons = runtime.polygons || [];
}

function getItemSettings() {
    const hitStart = clamp(getNumber(dom.itemHitStart, 20) / 100, 0, 1);
    const hitEnd = clamp(getNumber(dom.itemHitEnd, 70) / 100, hitStart, 1);
    return {
        item: {
            id: dom.itemId.value.trim().toLowerCase(), name: dom.itemName.value.trim(),
            description: dom.itemDescription.value.trim(), damage: Math.max(0, getNumber(dom.itemDamage, 100)),
        },
        weapon: {
            renderScale: clamp(getNumber(dom.itemRenderScale, 3.25), 0.2, 20),
            rotationOffset: clamp(getNumber(dom.itemRotationOffset, -45), -1080, 1080),
            hitStart, hitEnd,
            damageWalls: dom.itemDamageWalls.checked,
            trail: {
                enabled: dom.trailEnabled.checked, color: dom.trailColor.value,
                opacity: clamp(getNumber(dom.trailOpacity, 55) / 100, 0, 1),
                size: clamp(getNumber(dom.trailSize, 1), 0.1, 8),
                duration: clamp(getNumber(dom.trailDuration, 300), 30, 3000),
                interval: clamp(getNumber(dom.trailInterval, 40), 16, 1000),
            },
        },
    };
}

function ensureLayerMotion(frame, layerId) {
    frame.layers ||= {};
    frame.layers[layerId] ||= defaultLayerMotion();
    return frame.layers[layerId];
}

function interpolate(first, second, amount) {
    return Number(first) + (Number(second) - Number(first)) * amount;
}

function interpolateAngle(first, second, amount) {
    const start = Number(first) || 0;
    const end = Number(second) || 0;
    const shortest = ((end - start + 180) % 360 + 360) % 360 - 180;
    return start + shortest * amount;
}

function closestAngle(value, reference) {
    const raw = Number(value) || 0;
    const base = Number(reference) || 0;
    return base + ((raw - base + 180) % 360 + 360) % 360 - 180;
}

function poseAt(time, frames = state.keyframes) {
    let left = frames[0];
    let right = frames[frames.length - 1];
    if (time <= left.time) right = left;
    else if (time >= right.time) left = right;
    else {
        const rightIndex = frames.findIndex(frame => frame.time >= time);
        left = frames[rightIndex - 1];
        right = frames[rightIndex];
    }
    const amount = left === right ? 0 : (time - left.time) / Math.max(0.0001, right.time - left.time);
    const layers = {};
    for (const layer of state.layers) {
        const first = ensureLayerMotion(left, layer.id);
        const second = ensureLayerMotion(right, layer.id);
        layers[layer.id] = {
            angle: interpolateAngle(first.angle, second.angle, amount),
            x: interpolate(first.x, second.x, amount),
            y: interpolate(first.y, second.y, amount),
            scale: interpolate(first.scale, second.scale, amount),
        };
    }
    return {
        time, angle: interpolateAngle(left.angle, right.angle, amount),
        gripAngle: interpolateAngle(left.gripAngle, right.gripAngle, amount),
        gripOffset: interpolate(left.gripOffset, right.gripOffset, amount),
        size: interpolate(left.size, right.size, amount), layers,
    };
}

function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, devicePixelRatio || 1);
    const pixelWidth = Math.max(1, Math.round(rect.width * dpr));
    const pixelHeight = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
    }
    const context = canvas.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { context, width: rect.width, height: rect.height };
}

function getLayerTransform(centerX, centerY, pose, scale, layer, skipSync = false) {
    if (!skipSync) syncMainLayer();
    const settings = getItemSettings();
    const bodyRadius = 30 * scale;
    const gripRadians = pose.gripAngle * Math.PI / 180;
    const gripDistance = bodyRadius * pose.gripOffset / 10;
    const gripX = centerX + Math.cos(gripRadians) * gripDistance;
    const gripY = centerY + Math.sin(gripRadians) * gripDistance;
    const baseWidth = bodyRadius * settings.weapon.renderScale * pose.size / 20;
    const baseAngle = (pose.angle + settings.weapon.rotationOffset) * Math.PI / 180;
    const baseCosine = Math.cos(baseAngle);
    const baseSine = Math.sin(baseAngle);
    const motion = pose.layers?.[layer.id] || defaultLayerMotion();
    const anchoredToBody = layer.anchorMode === "body";
    const mainLayer = state.layers.find(entry => entry.primary) || state.layers[0];
    const anchoredToMain = layer.anchorMode === "main" && layer !== mainLayer;
    const mainTransform = anchoredToMain
        ? getLayerTransform(centerX, centerY, pose, scale, mainLayer, true)
        : null;
    const parentX = anchoredToMain ? mainTransform.x : anchoredToBody ? centerX : gripX;
    const parentY = anchoredToMain ? mainTransform.y : anchoredToBody ? centerY : gripY;
    const parentAngle = anchoredToMain ? mainTransform.angle : anchoredToBody ? 0 : baseAngle;
    const parentCosine = Math.cos(parentAngle);
    const parentSine = Math.sin(parentAngle);
    const width = baseWidth * layer.scale * motion.scale;
    const height = width * Math.max(1, layer.height) / Math.max(1, layer.width);
    const angle = parentAngle + (layer.rotation + motion.angle) * Math.PI / 180;
    const offsetX = (layer.offsetX + motion.x) * bodyRadius;
    const offsetY = (layer.offsetY + motion.y) * bodyRadius;
    return {
        bodyRadius, gripX, gripY, baseAngle, baseCosine, baseSine, parentX, parentY, parentAngle, parentCosine, parentSine,
        anchoredToBody, anchoredToMain, motion, width, height, angle,
        x: parentX + offsetX * parentCosine - offsetY * parentSine,
        y: parentY + offsetX * parentSine + offsetY * parentCosine,
    };
}

function drawLayerHandles(context, transform, layer) {
    const edge = Math.max(transform.width, transform.height) * 0.5;
    const rotateDistance = edge + 28;
    const rotateX = transform.x + Math.cos(transform.angle - Math.PI / 2) * rotateDistance;
    const rotateY = transform.y + Math.sin(transform.angle - Math.PI / 2) * rotateDistance;
    const flipDirection = layer.flipX ? -1 : 1;
    const flipX = transform.x + Math.cos(transform.angle) * (edge + 24) * flipDirection;
    const flipY = transform.y + Math.sin(transform.angle) * (edge + 24) * flipDirection;
    context.save();
    context.setLineDash([4, 4]);
    context.strokeStyle = "rgba(117, 236, 255, 0.95)";
    context.lineWidth = 1.5;
    context.translate(transform.x, transform.y);
    context.rotate(transform.angle);
    if (layer.flipX) context.scale(-1, 1);
    context.strokeRect(-transform.width * layer.anchor.x, -transform.height * layer.anchor.y, transform.width, transform.height);
    context.restore();
    context.save();
    context.strokeStyle = "rgba(117, 236, 255, 0.75)";
    context.lineWidth = 1.5;
    context.beginPath(); context.moveTo(transform.x, transform.y); context.lineTo(rotateX, rotateY); context.stroke();
    context.fillStyle = "#2fd4ff";
    context.beginPath(); context.arc(rotateX, rotateY, 8, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#151b1e";
    context.font = "bold 12px system-ui";
    context.textAlign = "center"; context.textBaseline = "middle";
    context.fillText("↻", rotateX, rotateY + 0.5);
    context.fillStyle = "#ffd462";
    context.beginPath(); context.arc(flipX, flipY, 9, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#151b1e";
    context.fillText("↔", flipX, flipY + 0.5);
    context.restore();
    return { rotateX, rotateY, flipX, flipY };
}

function drawWeapon(context, centerX, centerY, pose, scale = 1, showHitbox = true, showHandles = false) {
    syncMainLayer();
    const bodyRadius = 30 * scale;
    context.save();
    context.fillStyle = "#e7edf0";
    context.strokeStyle = "#7f8e94";
    context.lineWidth = 3 * scale;
    context.beginPath();
    context.arc(centerX, centerY, bodyRadius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    let selectedTransform = null;
    for (const layer of [...state.layers].sort((a, b) => a.priority - b.priority)) {
        const transform = getLayerTransform(centerX, centerY, pose, scale, layer);
        context.save();
        context.translate(transform.x, transform.y);
        context.rotate(transform.angle);
        if (layer.flipX) context.scale(-1, 1);
        context.globalAlpha *= layer.opacity;
        if (layer.imageElement?.complete && layer.imageElement.naturalWidth) {
            context.imageSmoothingEnabled = true;
            context.drawImage(layer.imageElement, -transform.width * layer.anchor.x, -transform.height * layer.anchor.y, transform.width, transform.height);
        }
        if (showHitbox && layer.damageEnabled) {
            context.fillStyle = "rgba(46, 214, 183, 0.18)";
            context.strokeStyle = "rgba(105, 241, 213, 0.9)";
            context.lineWidth = 1.5;
            for (const polygon of layer.polygons || []) {
                if (!polygon.points?.length) continue;
                context.beginPath();
                polygon.points.forEach((point, index) => {
                    const x = point[0] * transform.width;
                    const y = point[1] * transform.height;
                    index ? context.lineTo(x, y) : context.moveTo(x, y);
                });
                context.closePath();
                context.fill();
                context.stroke();
            }
        }
        context.restore();
        if (layer.id === state.selectedLayerId) selectedTransform = { layer, transform };
    }
    if (showHandles && selectedTransform) drawLayerHandles(context, selectedTransform.transform, selectedTransform.layer);
    context.restore();
}

function drawItemPreview() {
    const { context, width, height } = prepareCanvas(dom.itemPreviewCanvas);
    context.clearRect(0, 0, width, height);
    drawWeapon(context, width * 0.42, height * 0.56, poseAt(0), 0.82, !state.canvasDrag, true);
}

function getComboPreviewFrame(elapsedMs) {
    if (isEditingSpecialAction()) {
        const action = activeAnimation();
        const duration = Math.max(80, Number(action?.duration) || 900);
        return {
            attack: action,
            index: state.activeSpecialIndex,
            duration,
            progress: ((elapsedMs % duration) + duration) % duration / duration,
            elapsed: elapsedMs,
            totalDuration: duration,
        };
    }
    const attacks = state.comboAttacks.length ? state.comboAttacks : [activeComboAttack()];
    const totalDuration = attacks.reduce((total, attack) => total + Math.max(80, Number(attack?.duration) || 700), 0);
    let remaining = ((elapsedMs % Math.max(1, totalDuration)) + totalDuration) % totalDuration;
    for (let index = 0; index < attacks.length; index++) {
        const attack = attacks[index];
        const duration = Math.max(80, Number(attack?.duration) || 700);
        if (remaining < duration || index === attacks.length - 1) {
            return { attack, index, duration, progress: remaining / duration, elapsed: remaining, totalDuration };
        }
        remaining -= duration;
    }
    return { attack: activeComboAttack(), index: state.activeComboIndex, duration: 700, progress: 0, elapsed: 0, totalDuration: 700 };
}

function drawAnimation() {
    let attack = activeAnimation();
    let time = clamp(Number(dom.animationPlayhead.value) / 1000, 0, 1);
    let attackIndex = state.activeComboIndex;
    let readoutDuration = Math.max(80, Number(attack?.duration) || 700);
    if (state.playing && dom.comboPreviewEnabled.checked) {
        const preview = getComboPreviewFrame(performance.now() - state.playStartedAt);
        attack = preview.attack;
        attackIndex = preview.index;
        time = preview.progress;
        readoutDuration = preview.duration;
        if (attackIndex === state.activeComboIndex) dom.animationPlayhead.value = String(Math.round(time * 1000));
    } else if (state.playing) {
        dom.animationPlayhead.value = String(Math.round(((performance.now() - state.playStartedAt) % readoutDuration) / readoutDuration * 1000));
        time = clamp(Number(dom.animationPlayhead.value) / 1000, 0, 1);
    }
    const { context, width, height } = prepareCanvas(dom.animationCanvas);
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "rgba(90, 112, 120, 0.24)";
    context.beginPath();
    context.moveTo(width / 2, 0); context.lineTo(width / 2, height);
    context.moveTo(0, height / 2); context.lineTo(width, height / 2); context.stroke();
    const pose = poseAt(time, attack?.keyframes || state.keyframes);
    drawWeapon(context, width / 2, height / 2, pose, Math.max(1, Math.min(width, height) / 620), !state.canvasDrag, true);
    const label = isEditingSpecialAction()
        ? `${attack?.key?.toUpperCase() || "?"} · ${attack?.name || "Special action"}`
        : comboAttackLabel(attack, attackIndex);
    dom.animationReadout.textContent = `${label}  |  ${Math.round(time * readoutDuration)} ms  |  ${pose.angle.toFixed(1)}°`;
    requestAnimationFrame(drawAnimation);
}

function getCanvasPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}

function getCanvasScene(canvas) {
    const animation = canvas === dom.animationCanvas;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const time = animation ? clamp(Number(dom.animationPlayhead.value) / 1000, 0, 1) : 0;
    return {
        animation,
        time,
        centerX: animation ? width / 2 : width * 0.42,
        centerY: animation ? height / 2 : height * 0.56,
        scale: animation ? Math.max(1, Math.min(width, height) / 620) : 0.82,
        pose: poseAt(time),
    };
}

function toLayerLocal(transform, layer, point) {
    const dx = point.x - transform.x;
    const dy = point.y - transform.y;
    let x = Math.cos(transform.angle) * dx + Math.sin(transform.angle) * dy;
    const y = -Math.sin(transform.angle) * dx + Math.cos(transform.angle) * dy;
    if (layer.flipX) x = -x;
    return { x, y };
}

function isPointInsideLayer(transform, layer, point) {
    const local = toLayerLocal(transform, layer, point);
    return local.x >= -transform.width * layer.anchor.x
        && local.x <= transform.width * (1 - layer.anchor.x)
        && local.y >= -transform.height * layer.anchor.y
        && local.y <= transform.height * (1 - layer.anchor.y);
}

function getLayerAtPoint(scene, point) {
    for (const layer of [...state.layers].sort((a, b) => b.priority - a.priority)) {
        const transform = getLayerTransform(scene.centerX, scene.centerY, scene.pose, scene.scale, layer);
        if (isPointInsideLayer(transform, layer, point)) return { layer, transform };
    }
    return null;
}

function getSelectedHandles(scene) {
    const layer = selectedLayer();
    const transform = getLayerTransform(scene.centerX, scene.centerY, scene.pose, scene.scale, layer);
    const edge = Math.max(transform.width, transform.height) * 0.5;
    const rotateDistance = edge + 28;
    const flipDirection = layer.flipX ? -1 : 1;
    return {
        layer,
        transform,
        rotateX: transform.x + Math.cos(transform.angle - Math.PI / 2) * rotateDistance,
        rotateY: transform.y + Math.sin(transform.angle - Math.PI / 2) * rotateDistance,
        flipX: transform.x + Math.cos(transform.angle) * (edge + 24) * flipDirection,
        flipY: transform.y + Math.sin(transform.angle) * (edge + 24) * flipDirection,
    };
}

function setCanvasCursor(canvas, kind) {
    canvas.style.cursor = kind === "rotate" ? "crosshair" : kind === "move" ? "grabbing" : "grab";
}

function syncCanvasFields() {
    const layer = selectedLayer();
    dom.layerOffsetX.value = layer.offsetX;
    dom.layerOffsetY.value = layer.offsetY;
    dom.layerRotation.value = layer.rotation;
    dom.layerFlipButton.textContent = layer.flipX ? "좌우 반전 해제" : "좌우 반전";
    const frame = state.keyframes[state.selectedKeyframe];
    if (!frame) return;
    const motion = ensureLayerMotion(frame, state.animationLayerId);
    dom.frameAngle.value = frame.angle;
    dom.frameGripAngle.value = frame.gripAngle;
    dom.frameGripOffset.value = frame.gripOffset;
    dom.frameLayerAngle.value = motion.angle;
    dom.frameLayerX.value = motion.x;
    dom.frameLayerY.value = motion.y;
}

function updateCanvasMove(scene, layer, point) {
    const transform = getLayerTransform(scene.centerX, scene.centerY, scene.pose, scene.scale, layer);
    const frame = state.keyframes[state.selectedKeyframe];
    if (scene.animation && layer.primary && frame && !transform.anchoredToBody) {
        const localX = (layer.offsetX + transform.motion.x) * transform.bodyRadius;
        const localY = (layer.offsetY + transform.motion.y) * transform.bodyRadius;
        const offsetX = localX * transform.baseCosine - localY * transform.baseSine;
        const offsetY = localX * transform.baseSine + localY * transform.baseCosine;
        const gripX = point.x - offsetX;
        const gripY = point.y - offsetY;
        frame.gripAngle = closestAngle(
            Math.atan2(gripY - scene.centerY, gripX - scene.centerX) * 180 / Math.PI,
            frame.gripAngle,
        );
        frame.gripOffset = Math.hypot(gripX - scene.centerX, gripY - scene.centerY) / transform.bodyRadius * 10;
        return;
    }
    const dx = point.x - transform.parentX;
    const dy = point.y - transform.parentY;
    const localX = (dx * transform.parentCosine + dy * transform.parentSine) / transform.bodyRadius;
    const localY = (-dx * transform.parentSine + dy * transform.parentCosine) / transform.bodyRadius;
    if (scene.animation && frame) {
        const motion = ensureLayerMotion(frame, layer.id);
        motion.x = localX - layer.offsetX;
        motion.y = localY - layer.offsetY;
    } else {
        layer.offsetX = localX - transform.motion.x;
        layer.offsetY = localY - transform.motion.y;
    }
}

function updateCanvasRotation(scene, layer, point) {
    const transform = getLayerTransform(scene.centerX, scene.centerY, scene.pose, scene.scale, layer);
    const desiredAngle = Math.atan2(point.y - transform.y, point.x - transform.x) * 180 / Math.PI;
    const settings = getItemSettings();
    const frame = state.keyframes[state.selectedKeyframe];
    if (scene.animation && layer.primary && frame && !transform.anchoredToBody) {
        const next = desiredAngle - settings.weapon.rotationOffset - layer.rotation - transform.motion.angle;
        frame.angle = closestAngle(next, frame.angle);
    } else if (scene.animation && frame) {
        const motion = ensureLayerMotion(frame, layer.id);
        const next = desiredAngle - transform.parentAngle * 180 / Math.PI - layer.rotation;
        motion.angle = closestAngle(next, motion.angle);
    } else {
        const next = desiredAngle - transform.parentAngle * 180 / Math.PI - transform.motion.angle;
        layer.rotation = closestAngle(next, layer.rotation);
    }
}

function handleCanvasPointerDown(event) {
    const canvas = event.currentTarget;
    if (canvas === dom.animationCanvas) {
        state.playing = false;
        const frame = state.keyframes[state.selectedKeyframe];
        if (frame) dom.animationPlayhead.value = String(Math.round(frame.time * 1000));
    }
    const scene = getCanvasScene(canvas);
    const point = getCanvasPoint(canvas, event);
    let handles = getSelectedHandles(scene);
    const distanceTo = (x, y) => Math.hypot(point.x - x, point.y - y);
    let kind = null;
    if (distanceTo(handles.rotateX, handles.rotateY) <= 15) kind = "rotate";
    else if (distanceTo(handles.flipX, handles.flipY) <= 16) {
        handles.layer.flipX = !handles.layer.flipX;
        syncCanvasFields();
        if (!scene.animation) drawItemPreview();
        kind = "flip";
    }
    else {
        const hit = getLayerAtPoint(scene, point);
        if (!hit) return;
        if (hit.layer.id !== state.selectedLayerId) {
            state.selectedLayerId = hit.layer.id;
            state.animationLayerId = hit.layer.id;
            renderLayers();
            if (scene.animation) renderKeyframes();
            handles = getSelectedHandles(scene);
        }
        kind = "move";
    }
    state.canvasDrag = { canvas, kind, layerId: state.selectedLayerId };
    canvas.setPointerCapture?.(event.pointerId);
    setCanvasCursor(canvas, kind);
    event.preventDefault();
}

function handleCanvasPointerMove(event) {
    const canvas = event.currentTarget;
    const scene = getCanvasScene(canvas);
    const point = getCanvasPoint(canvas, event);
    const drag = state.canvasDrag;
    if (!drag || drag.canvas !== canvas) {
        const handles = getSelectedHandles(scene);
        const nearHandle = Math.hypot(point.x - handles.rotateX, point.y - handles.rotateY) < 16
            || Math.hypot(point.x - handles.flipX, point.y - handles.flipY) < 17;
        setCanvasCursor(canvas, nearHandle ? "rotate" : getLayerAtPoint(scene, point) ? "move" : "idle");
        return;
    }
    const layer = state.layers.find(entry => entry.id === drag.layerId);
    if (!layer) return;
    if (drag.kind === "rotate") updateCanvasRotation(scene, layer, point);
    else if (drag.kind === "flip") {
        const transform = getLayerTransform(scene.centerX, scene.centerY, scene.pose, scene.scale, layer);
        const projection = (point.x - transform.x) * Math.cos(transform.angle) + (point.y - transform.y) * Math.sin(transform.angle);
        layer.flipX = projection < 0;
    } else updateCanvasMove(scene, layer, point);
    syncCanvasFields();
    if (!scene.animation) drawItemPreview();
    event.preventDefault();
}

function handleCanvasPointerUp(event) {
    const drag = state.canvasDrag;
    if (!drag || drag.canvas !== event.currentTarget) return;
    state.canvasDrag = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setCanvasCursor(event.currentTarget, "idle");
    renderLayers();
    if (event.currentTarget === dom.animationCanvas) renderKeyframes();
    else drawItemPreview();
}

function sortFrames() {
    state.keyframes.sort((a, b) => a.time - b.time);
    state.selectedKeyframe = Math.max(0, Math.min(state.keyframes.length - 1, state.selectedKeyframe));
}

function refreshAnimationLayerSelect() {
    const previous = state.animationLayerId;
    dom.animationLayerSelect.replaceChildren();
    for (const layer of [...state.layers].sort((a, b) => a.priority - b.priority)) {
        const option = document.createElement("option");
        option.value = layer.id;
        option.textContent = `${layer.name} (priority ${layer.priority})`;
        dom.animationLayerSelect.append(option);
    }
    state.animationLayerId = state.layers.some(layer => layer.id === previous) ? previous : state.layers[0].id;
    dom.animationLayerSelect.value = state.animationLayerId;
}

function renderKeyframes() {
    sortFrames();
    renderComboControls();
    renderSpecialActionControls();
    dom.keyframeList.replaceChildren();
    state.keyframes.forEach((frame, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `keyframe-chip${index === state.selectedKeyframe ? " active" : ""}`;
        button.textContent = `${Math.round(frame.time * 100)}%`;
        button.addEventListener("click", () => selectKeyframe(index));
        dom.keyframeList.append(button);
    });
    refreshAnimationLayerSelect();
    const frame = state.keyframes[state.selectedKeyframe];
    dom.frameAngle.value = frame?.angle ?? "";
    dom.frameGripAngle.value = frame?.gripAngle ?? "";
    dom.frameGripOffset.value = frame?.gripOffset ?? "";
    dom.frameSize.value = frame?.size ?? "";
    const motion = frame ? ensureLayerMotion(frame, state.animationLayerId) : defaultLayerMotion();
    dom.frameLayerAngle.value = motion.angle;
    dom.frameLayerScale.value = motion.scale;
    dom.frameLayerX.value = motion.x;
    dom.frameLayerY.value = motion.y;
    dom.deleteKeyframeButton.disabled = state.keyframes.length <= 2;
}

function selectKeyframe(index) {
    state.selectedKeyframe = index;
    dom.animationPlayhead.value = String(Math.round(state.keyframes[index].time * 1000));
    renderKeyframes();
}

function addKeyframe() {
    const time = clamp(Number(dom.animationPlayhead.value) / 1000, 0, 1);
    const existing = state.keyframes.findIndex(frame => Math.abs(frame.time - time) < 0.005);
    if (existing >= 0) return selectKeyframe(existing);
    const pose = poseAt(time);
    state.keyframes.push({ ...pose, time, layers: structuredClone(pose.layers) });
    sortFrames();
    selectKeyframe(state.keyframes.findIndex(frame => frame.time === time));
}

function updateSelectedFrame() {
    const frame = state.keyframes[state.selectedKeyframe];
    if (!frame) return;
    frame.angle = getNumber(dom.frameAngle, frame.angle);
    frame.gripAngle = getNumber(dom.frameGripAngle, frame.gripAngle);
    frame.gripOffset = getNumber(dom.frameGripOffset, frame.gripOffset);
    frame.size = Math.max(1, getNumber(dom.frameSize, frame.size));
    const motion = ensureLayerMotion(frame, state.animationLayerId);
    motion.angle = getNumber(dom.frameLayerAngle, motion.angle);
    motion.scale = Math.max(0.05, getNumber(dom.frameLayerScale, motion.scale));
    motion.x = getNumber(dom.frameLayerX, motion.x);
    motion.y = getNumber(dom.frameLayerY, motion.y);
}

function renderLayers() {
    syncMainLayer();
    dom.weaponLayerList.replaceChildren();
    for (const layer of [...state.layers].sort((a, b) => a.priority - b.priority)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `weapon-layer-chip${layer.id === state.selectedLayerId ? " active" : ""}`;
        const image = document.createElement("img");
        image.src = layer.imageDataUrl || "";
        const label = document.createElement("span");
        label.textContent = layer.name;
        const priority = document.createElement("small");
        priority.textContent = String(layer.priority);
        button.append(image, label, priority);
        button.addEventListener("click", () => selectLayer(layer.id));
        dom.weaponLayerList.append(button);
    }
    refreshAnimationLayerSelect();
    const layer = selectedLayer();
    dom.layerName.value = layer.name;
    dom.layerPriority.value = layer.priority;
    dom.layerScale.value = layer.scale;
    dom.layerOffsetX.value = layer.offsetX;
    dom.layerOffsetY.value = layer.offsetY;
    dom.layerRotation.value = layer.rotation;
    dom.layerOpacity.value = Math.round(layer.opacity * 100);
    dom.layerAnchorMode.value = ["body", "main"].includes(layer.anchorMode) ? layer.anchorMode : "weapon";
    dom.layerAnchorX.value = Math.round(layer.anchor.x * 1000) / 10;
    dom.layerAnchorY.value = Math.round(layer.anchor.y * 1000) / 10;
    dom.layerDamageEnabled.checked = layer.damageEnabled;
    dom.layerFlipButton.textContent = layer.flipX ? "좌우 반전 해제" : "좌우 반전";
    dom.deleteLayerButton.disabled = layer.primary;
    dom.loadLayerHitboxButton.disabled = layer.primary;
    dom.layerHitboxStatus.textContent = layer.primary
        ? `기본 이미지: 1단계의 히트박스 ${layer.polygons.length}개 사용`
        : `${layer.polygons.length}개 히트박스 · ${layer.damageEnabled ? "공격 판정 사용" : "장식 전용"}`;
}

function selectLayer(id) {
    state.selectedLayerId = id;
    renderLayers();
    drawItemPreview();
}

function updateSelectedLayer() {
    const layer = selectedLayer();
    layer.name = dom.layerName.value.trim() || layer.name;
    layer.priority = clamp(getNumber(dom.layerPriority, layer.priority), -100, 100);
    layer.scale = clamp(getNumber(dom.layerScale, layer.scale), 0.05, 20);
    layer.offsetX = getNumber(dom.layerOffsetX, layer.offsetX);
    layer.offsetY = getNumber(dom.layerOffsetY, layer.offsetY);
    layer.rotation = getNumber(dom.layerRotation, layer.rotation);
    layer.opacity = clamp(getNumber(dom.layerOpacity, layer.opacity * 100) / 100, 0, 1);
    layer.anchorMode = ["body", "main"].includes(dom.layerAnchorMode.value) ? dom.layerAnchorMode.value : "weapon";
    layer.anchorModeExplicit = true;
    layer.anchor.x = clamp(getNumber(dom.layerAnchorX, layer.anchor.x * 100) / 100, 0, 1);
    layer.anchor.y = clamp(getNumber(dom.layerAnchorY, layer.anchor.y * 100) / 100, 0, 1);
    layer.damageEnabled = dom.layerDamageEnabled.checked;
    renderLayers();
    drawItemPreview();
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error("이미지를 읽을 수 없습니다."));
        reader.readAsDataURL(file);
    });
}

function loadImageElement(dataUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("레이어 이미지를 열 수 없습니다."));
        image.src = dataUrl;
    });
}

async function addImageLayers(files) {
    for (const file of files || []) {
        const dataUrl = await fileToDataUrl(file);
        const image = await loadImageElement(dataUrl);
        const id = `layer_${state.layerCounter++}`;
        const anchor = { x: 0.5, y: 0.5 };
        const followsMainWeapon = /검집|scabbard|sheathe/i.test(file.name);
        state.layers.push({
            id, name: file.name.replace(/\.[^.]+$/, "") || id, primary: false,
            priority: Math.max(...state.layers.map(layer => layer.priority), 0) + 1,
            scale: 1, offsetX: 0, offsetY: 0, rotation: 0, opacity: 1, anchor, anchorMode: followsMainWeapon ? "main" : "body", anchorModeExplicit: false,
            flipX: false,
            damageEnabled: false,
            polygons: [{ id: `${id}_bounds`, name: "Image bounds", points: [
                [-anchor.x, -anchor.y], [1 - anchor.x, -anchor.y],
                [1 - anchor.x, 1 - anchor.y], [-anchor.x, 1 - anchor.y],
            ] }],
            imageDataUrl: dataUrl, imageName: file.name, mimeType: file.type,
            width: image.naturalWidth, height: image.naturalHeight, imageElement: image,
        });
        for (const attack of [...state.comboAttacks, ...state.specialActions]) {
            for (const frame of attack.keyframes) ensureLayerMotion(frame, id);
        }
        state.selectedLayerId = id;
        state.animationLayerId = id;
    }
    renderLayers();
    renderKeyframes();
    drawItemPreview();
}

async function importLayerHitbox(file) {
    const layer = selectedLayer();
    if (!file || layer.primary) return;
    const data = JSON.parse(await file.text());
    if (data.format !== "craftras-hitbox") throw new Error("Craftras 히트박스 JSON이 아닙니다.");
    layer.polygons = data.runtime?.polygons || [];
    if (data.image?.dataUrl) {
        layer.imageDataUrl = data.image.dataUrl;
        layer.imageName = data.image.name || layer.imageName;
        layer.mimeType = data.image.mimeType || layer.mimeType;
        layer.imageElement = await loadImageElement(layer.imageDataUrl);
        layer.width = layer.imageElement.naturalWidth;
        layer.height = layer.imageElement.naturalHeight;
    }
    layer.anchor = { ...(data.runtime?.anchor || layer.anchor) };
    layer.damageEnabled = true;
    renderLayers();
    drawItemPreview();
}

function moveSelectedLayer(direction) {
    const layer = selectedLayer();
    const sorted = [...state.layers].sort((a, b) => a.priority - b.priority);
    const index = sorted.indexOf(layer);
    const other = sorted[index + direction];
    if (!other) return;
    const priority = layer.priority;
    layer.priority = other.priority;
    other.priority = priority;
    if (layer.priority === other.priority) layer.priority += direction;
    renderLayers();
    drawItemPreview();
}

function deleteSelectedLayer() {
    const layer = selectedLayer();
    if (layer.primary) return;
    state.layers = state.layers.filter(entry => entry !== layer);
    for (const attack of [...state.comboAttacks, ...state.specialActions]) {
        for (const frame of attack.keyframes) if (frame.layers) delete frame.layers[layer.id];
    }
    state.selectedLayerId = "main";
    state.animationLayerId = "main";
    renderLayers();
    renderKeyframes();
    drawItemPreview();
}

function serializeLayer(layer) {
    return {
        id: layer.id, name: layer.name, primary: layer.primary, priority: layer.priority,
        scale: layer.scale, offsetX: layer.offsetX, offsetY: layer.offsetY,
        rotation: layer.rotation, opacity: layer.opacity, anchorMode: layer.anchorMode, anchorModeExplicit: !!layer.anchorModeExplicit, anchor: { ...layer.anchor },
        flipX: !!layer.flipX,
        damageEnabled: layer.damageEnabled, polygons: layer.polygons,
        image: {
            name: layer.imageName, mimeType: layer.mimeType, width: layer.width,
            height: layer.height, dataUrl: layer.imageDataUrl,
        },
    };
}

async function buildItemProject() {
    const hitbox = await hitboxEditor.buildExport(true);
    syncMainLayer();
    commitActiveComboControls();
    if (!hitbox.image?.dataUrl) throw new Error("먼저 무기 이미지를 열어주세요.");
    const settings = getItemSettings();
    if (!/^[a-z0-9_]{2,48}$/.test(settings.item.id)) throw new Error("아이템 ID는 영문 소문자, 숫자, 밑줄 2~48자로 입력하세요.");
    if (!settings.item.name) throw new Error("아이템 이름을 입력하세요.");
    if (!state.layers.some(layer => layer.damageEnabled && layer.polygons.length)) throw new Error("공격 판정을 사용하는 히트박스가 하나 이상 필요합니다.");
    return {
        format: "craftras-item", version: 2, generatedAt: new Date().toISOString(),
        item: settings.item, image: { ...hitbox.image }, hitbox,
        layers: state.layers.map(serializeLayer), weapon: settings.weapon,
        animation: {
            duration: state.comboAttacks[0].duration,
            interpolation: "linear", keyframes: structuredClone(state.comboAttacks[0].keyframes),
            combo: {
                resetMs: 850,
                attacks: state.comboAttacks.map(attack => ({
                    type: attack.type,
                    duration: attack.duration,
                    cooldown: attack.cooldown,
                    dash: !!attack.dash,
                    dashDistance: attack.dashDistance,
                    damage: attack.damage,
                    anchorMode: attack.anchorMode,
                    screenCut: attack.type !== "sheathe" && !!attack.screenCut,
                    keyframes: structuredClone(attack.keyframes),
                })),
                specialActions: state.specialActions.map(action => ({
                    type: "emote",
                    key: action.key,
                    name: action.name,
                    duration: action.duration,
                    cooldown: action.cooldown,
                    anchorMode: action.anchorMode,
                    keyframes: structuredClone(action.keyframes),
                })),
            },
        },
    };
}

async function downloadItem() {
    try {
        const project = await buildItemProject();
        hitboxEditor.downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }), `${project.item.id}.craftras-item.json`);
        dom.installStatus.textContent = "아이템 JSON을 다운로드했습니다.";
    } catch (error) { dom.installStatus.textContent = error.message; }
}

async function installItem() {
    dom.installItemButton.disabled = true;
    dom.installItemTopButton.disabled = true;
    dom.installStatus.textContent = "여러 이미지와 무기 설정을 서버에 설치하는 중...";
    try {
        const project = await buildItemProject();
        const response = await fetch("/api/craftras/custom-items", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(project),
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "설치에 실패했습니다.");
        dom.installStatus.textContent = `${project.item.name} 설치 완료. 서버를 재시작하면 관리자 인벤토리에 나타납니다.`;
    } catch (error) { dom.installStatus.textContent = error.message; }
    finally {
        dom.installItemButton.disabled = false;
        dom.installItemTopButton.disabled = false;
    }
}

async function hydrateLayer(source, index) {
    const imageDataUrl = source.image?.dataUrl || (source.primary ? hitboxEditor.getImage().dataUrl : null);
    const imageElement = imageDataUrl ? await loadImageElement(imageDataUrl) : null;
    const inferredMainAnchor = !source.primary && !source.anchorModeExplicit && /검집|scabbard|sheathe/i.test(String(source.name || ""));
    return {
        id: source.primary ? "main" : String(source.id || `layer_${index}`),
        name: String(source.name || `Layer ${index + 1}`), primary: !!source.primary,
        priority: Number(source.priority) || 0, scale: Number(source.scale) || 1,
        offsetX: Number(source.offsetX) || 0, offsetY: Number(source.offsetY) || 0,
        rotation: Number(source.rotation) || 0, opacity: Number.isFinite(Number(source.opacity)) ? Number(source.opacity) : 1,
        // Earlier projects made every added image follow the main weapon. Treat those legacy layers as independent.
        anchorMode: source.primary
            ? (source.anchorMode === "body" ? "body" : "weapon")
            : source.anchorMode === "main" || inferredMainAnchor ? "main"
            : (source.anchorModeExplicit && source.anchorMode === "weapon" ? "weapon" : "body"),
        anchorModeExplicit: !!source.anchorModeExplicit,
        flipX: !!source.flipX,
        anchor: { x: Number(source.anchor?.x ?? 0.5), y: Number(source.anchor?.y ?? 0.5) },
        damageEnabled: source.damageEnabled !== false, polygons: source.polygons || [],
        imageDataUrl, imageName: source.image?.name || "", mimeType: source.image?.mimeType || "",
        width: Number(source.image?.width) || imageElement?.naturalWidth || 1,
        height: Number(source.image?.height) || imageElement?.naturalHeight || 1, imageElement,
    };
}

async function loadItemProject(project) {
    const item = project.item || {};
    const weapon = project.weapon || {};
    const trail = weapon.trail || {};
    dom.itemId.value = item.id || "custom_sword";
    dom.itemName.value = item.name || "Custom Sword";
    dom.itemDescription.value = item.description || "";
    dom.itemDamage.value = item.damage ?? 100;
    dom.itemDamageWalls.checked = weapon.damageWalls !== false;
    dom.itemRenderScale.value = weapon.renderScale ?? 3.25;
    dom.itemRotationOffset.value = weapon.rotationOffset ?? -45;
    dom.itemHitStart.value = Math.round((weapon.hitStart ?? 0.2) * 100);
    dom.itemHitEnd.value = Math.round((weapon.hitEnd ?? 0.7) * 100);
    dom.trailEnabled.checked = !!trail.enabled;
    dom.trailColor.value = trail.color || "#ff4fb8";
    dom.trailOpacity.value = Math.round((trail.opacity ?? 0.55) * 100);
    dom.trailSize.value = trail.size ?? 1;
    dom.trailDuration.value = trail.duration ?? 300;
    dom.trailInterval.value = trail.interval ?? 40;
    const layerSources = project.layers?.length ? project.layers : [{
        ...makeMainLayer(), primary: true, image: project.image,
        polygons: project.hitbox?.runtime?.polygons || [], anchor: project.hitbox?.runtime?.anchor,
    }];
    state.layers = await Promise.all(layerSources.map(hydrateLayer));
    if (!state.layers.some(layer => layer.primary)) state.layers[0].primary = true;
    state.layers.find(layer => layer.primary).id = "main";
    state.layerCounter = state.layers.length + 1;
    state.selectedLayerId = "main";
    state.animationLayerId = "main";
    const comboSource = project.animation?.combo?.attacks || weapon.combo?.attacks;
    const fallbackFrames = project.animation?.keyframes?.length >= 2
        ? project.animation.keyframes
        : makeSlashKeyframes();
    if (Array.isArray(comboSource) && comboSource.length) {
        state.comboAttacks = comboSource.slice(0, 100).map(source => {
            const type = source.type === "sheathe" ? "sheathe" : "slash";
            const preset = type === "sheathe" ? makeSheatheKeyframes() : makeSlashKeyframes();
            return makeComboAttack(source.keyframes?.length >= 2 ? source.keyframes : preset, {
                type,
                duration: source.duration ?? project.animation?.duration ?? 700,
                cooldown: source.cooldown,
                dash: source.dash,
                dashDistance: source.dashDistance ?? 3,
                damage: source.damage,
                anchorMode: source.anchorMode,
                screenCut: type !== "sheathe" && source.screenCut,
            });
        });
    } else {
        state.comboAttacks = [makeComboAttack(fallbackFrames, { duration: project.animation?.duration ?? 700 })];
    }
    const specialSource = project.animation?.combo?.specialActions || weapon.specialActions;
    state.specialActions = Array.isArray(specialSource)
        ? specialSource.slice(0, 2).map(source => makeSpecialAction({
            key: source.key,
            name: source.name,
            duration: source.duration,
            cooldown: source.cooldown,
            anchorMode: source.anchorMode,
            keyframes: source.keyframes,
        }))
        : [];
    state.activeComboIndex = 0;
    state.activeSpecialIndex = -1;
    state.keyframes = state.comboAttacks[0].keyframes;
    for (const attack of [...state.comboAttacks, ...state.specialActions]) ensureFrameLayerMotions(attack.keyframes);
    state.selectedKeyframe = 0;
    syncMainLayer();
    renderLayers();
    renderKeyframes();
    setMode("item");
}

for (const button of dom.modeButtons) button.addEventListener("click", () => setMode(button.dataset.editorMode));
for (const input of document.querySelectorAll(".item-workspace input, .item-workspace textarea")) {
    if (!input.closest(".layer-panel")) input.addEventListener("input", drawItemPreview);
}
for (const input of [dom.layerName, dom.layerPriority, dom.layerScale, dom.layerOffsetX, dom.layerOffsetY,
    dom.layerRotation, dom.layerOpacity, dom.layerAnchorMode, dom.layerAnchorX, dom.layerAnchorY, dom.layerDamageEnabled]) {
    input.addEventListener("input", updateSelectedLayer);
}
dom.addImageLayerButton.addEventListener("click", () => dom.layerImageInput.click());
dom.layerImageInput.addEventListener("change", async () => {
    try { await addImageLayers([...dom.layerImageInput.files]); }
    catch (error) { dom.installStatus.textContent = error.message; }
    dom.layerImageInput.value = "";
});
dom.loadLayerHitboxButton.addEventListener("click", () => dom.layerHitboxInput.click());
dom.layerHitboxInput.addEventListener("change", async () => {
    try { await importLayerHitbox(dom.layerHitboxInput.files?.[0]); }
    catch (error) { dom.installStatus.textContent = error.message; }
    dom.layerHitboxInput.value = "";
});
dom.moveLayerBackButton.addEventListener("click", () => moveSelectedLayer(-1));
dom.moveLayerFrontButton.addEventListener("click", () => moveSelectedLayer(1));
dom.layerFlipButton.addEventListener("click", () => {
    selectedLayer().flipX = !selectedLayer().flipX;
    renderLayers();
    drawItemPreview();
});
dom.deleteLayerButton.addEventListener("click", deleteSelectedLayer);
dom.animationLayerSelect.addEventListener("change", () => {
    state.animationLayerId = dom.animationLayerSelect.value;
    renderKeyframes();
});
dom.addComboAttackButton.addEventListener("click", addComboAttack);
dom.addSheatheButton.addEventListener("click", addSheatheAnimation);
dom.newComboButton.addEventListener("click", makeNewThreeHitCombo);
dom.deleteComboAttackButton.addEventListener("click", deleteComboAttack);
dom.addSpecialActionButton.addEventListener("click", addSpecialAction);
dom.deleteSpecialActionButton.addEventListener("click", deleteSpecialAction);
dom.comboDashEnabled.addEventListener("change", () => {
    commitActiveComboControls();
    renderComboControls();
});
dom.comboDashDistance.addEventListener("input", commitActiveComboControls);
dom.comboDamage.addEventListener("input", commitActiveComboControls);
dom.comboAnchorMode.addEventListener("change", commitActiveComboControls);
dom.comboCooldown.addEventListener("input", commitActiveComboControls);
dom.specialActionKey.addEventListener("change", () => {
    commitActiveComboControls();
    renderSpecialActionControls();
});
dom.specialActionName.addEventListener("input", () => {
    commitActiveComboControls();
    renderSpecialActionControls();
});
dom.specialActionCooldown.addEventListener("input", commitActiveComboControls);
dom.comboPreviewEnabled.addEventListener("change", () => {
    state.previewWholeCombo = dom.comboPreviewEnabled.checked;
    state.playing = false;
    dom.animationPlayButton.textContent = "▶";
});
dom.comboScreenCutEnabled.addEventListener("change", () => {
    commitActiveComboControls();
    renderComboControls();
});
dom.animationPlayButton.addEventListener("click", () => {
    state.playing = !state.playing;
    dom.animationPlayButton.textContent = state.playing ? "Ⅱ" : "▶";
    state.playStartedAt = dom.comboPreviewEnabled.checked
        ? performance.now()
        : performance.now() - Number(dom.animationPlayhead.value) / 1000 * getNumber(dom.animationDuration, 700);
});
dom.animationPlayhead.addEventListener("input", () => {
    if (state.playing) state.playStartedAt = performance.now() - Number(dom.animationPlayhead.value) / 1000 * getNumber(dom.animationDuration, 700);
});
dom.animationDuration.addEventListener("input", commitActiveComboControls);
dom.addKeyframeButton.addEventListener("click", addKeyframe);
dom.deleteKeyframeButton.addEventListener("click", () => {
    if (state.keyframes.length <= 2) return;
    state.keyframes.splice(state.selectedKeyframe, 1);
    state.selectedKeyframe = Math.max(0, state.selectedKeyframe - 1);
    renderKeyframes();
});
for (const input of [dom.frameAngle, dom.frameGripAngle, dom.frameGripOffset, dom.frameSize,
    dom.frameLayerAngle, dom.frameLayerScale, dom.frameLayerX, dom.frameLayerY]) input.addEventListener("input", updateSelectedFrame);
dom.downloadItemButton.addEventListener("click", downloadItem);
dom.installItemButton.addEventListener("click", installItem);
dom.installItemTopButton.addEventListener("click", () => { setMode("item"); installItem(); });
window.addEventListener("craftras-item-load", event => loadItemProject(event.detail).catch(error => {
    dom.installStatus.textContent = error.message;
}));
window.addEventListener("resize", drawItemPreview);
for (const canvas of [dom.itemPreviewCanvas, dom.animationCanvas]) {
    canvas.addEventListener("pointerdown", handleCanvasPointerDown);
    canvas.addEventListener("pointermove", handleCanvasPointerMove);
    canvas.addEventListener("pointerup", handleCanvasPointerUp);
    canvas.addEventListener("pointercancel", handleCanvasPointerUp);
}

document.body.dataset.editorMode = "hitbox";
renderLayers();
renderKeyframes();
requestAnimationFrame(drawAnimation);
