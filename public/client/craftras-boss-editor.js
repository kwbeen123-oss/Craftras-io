const $ = id => document.getElementById(id);
const clone = value => structuredClone(value);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const option = (value, label) => ({ value, label });
const AUTOSAVE_KEY = "craftras-boss-studio-autosave-v1";

const dom = Object.fromEntries([
    "projectTitle", "newBossButton", "openProjectButton", "undoButton", "redoButton", "saveProjectButton", "exportBossButton",
    "addBossButton", "bossSearch", "bossList", "addAssetButton", "assetList", "phaseSelect", "skillSelect", "playButton",
    "pauseButton", "stopButton", "stepButton", "speedSelect", "showHitboxes", "stageTime", "stage", "stageCanvas",
    "dialoguePreview", "stageEmpty", "addPhaseButton", "addSkillButton", "actionTypeSelect", "addActionButton", "timelineScroll",
    "timelineRuler", "playhead", "actionTracks", "bossName", "bossId", "bossHealth", "bossSize", "bossSpeed", "bossColor",
    "bossAiMode", "bossDistance", "bossDetection", "bossHatAsset", "bossWeaponAsset", "weaponScale", "weaponAngle", "weaponOffset",
    "phaseName", "phaseTrigger", "phaseHealthThreshold", "phaseDialogue", "phaseHealth", "phaseColor", "phaseInvulnerable",
    "deletePhaseButton", "skillName", "skillDuration", "skillCooldown", "skillWeight", "skillRange", "skillLoop",
    "skillLockMovement", "deleteSkillButton", "actionInspectorTitle", "actionEmpty", "actionFields", "actionCommands",
    "duplicateActionButton", "deleteActionButton", "assetPreview", "assetName", "assetKind", "replaceAssetImageButton",
    "attachHitboxButton", "assetScale", "assetAnchorX", "assetAnchorY", "assetGlow", "deleteAssetButton", "statusBoss",
    "statusSelection", "statusObjects", "statusFps", "statusSave", "projectInput", "assetImageInput", "hitboxInput",
].map(id => [id, $(id)]));

const AI_OPTIONS = [option("approach", "다가가기"), option("retreat", "멀어지기"), option("distance", "거리 유지"), option("orbit", "공전"), option("idle", "정지")];
const SOURCE_OPTIONS = [option("boss", "보스"), option("target", "플레이어"), option("effect", "마법진/효과"), option("world", "월드 좌표")];
const EASING_OPTIONS = [option("linear", "일정"), option("easeIn", "가속"), option("easeOut", "감속"), option("easeInOut", "가속 후 감속"), option("bounce", "튕김")];
const PATTERN_OPTIONS = [option("aimed", "조준"), option("ring", "원형"), option("arc", "부채꼴"), option("line", "직선 배열"), option("flower", "꽃잎"), option("random", "무작위")];
const ACTION_TYPES = {
    dialogue: { label: "대사", defaults: { speaker: "BOSS", text: "..." }, fields: [
        ["speaker", "화자", "text"], ["text", "대사", "textarea"],
    ] },
    animation: { label: "애니메이션", defaults: { preset: "swing", angleStart: -35, angleEnd: 65, repeats: 1, easing: "easeInOut" }, fields: [
        ["preset", "동작", "select", [option("swing", "검 휘두르기"), option("staff", "지팡이 흔들기"), option("thrust", "앞으로 뻗기"), option("spin", "360도 회전"), option("custom", "직접 설정")]],
        ["angleStart", "시작 각도", "number"], ["angleEnd", "끝 각도", "number"], ["repeats", "반복", "number", null, 1, 100, 1], ["easing", "변화", "select", EASING_OPTIONS],
    ] },
    teleport: { label: "순간이동", defaults: { destination: "behindTarget", distance: 180, angle: 0, fadeOut: 250, fadeIn: 250, ignoreWalls: true, faceTarget: true }, fields: [
        ["destination", "도착 기준", "select", [option("behindTarget", "플레이어 뒤"), option("frontTarget", "플레이어 앞"), option("aroundTarget", "플레이어 주변 무작위"), option("bossOffset", "현재 위치 기준"), option("world", "월드 좌표")]],
        ["distance", "거리", "number"], ["angle", "추가 각도", "number"], ["x", "월드 X", "number"], ["y", "월드 Y", "number"],
        ["fadeOut", "사라지는 시간", "number"], ["fadeIn", "나타나는 시간", "number"],
        ["ignoreWalls", "벽 무시", "checkbox"], ["faceTarget", "플레이어 바라보기", "checkbox"],
    ] },
    move: { label: "이동 AI", defaults: { mode: "approach", speed: 120, desiredDistance: 180, easing: "linear" }, fields: [
        ["mode", "이동 방식", "select", AI_OPTIONS], ["speed", "속도", "number"], ["desiredDistance", "유지 거리", "number"], ["easing", "변화", "select", EASING_OPTIONS],
    ] },
    dash: { label: "돌진", defaults: { target: "target", distance: 260, damage: 10, percentDamage: true, trailColor: "#ff57b6", easing: "easeIn" }, fields: [
        ["target", "방향", "select", [option("target", "플레이어"), option("facing", "바라보는 방향"), option("fixed", "고정 각도")]], ["distance", "거리", "number"],
        ["damage", "피해", "number"], ["percentDamage", "최대 체력 비례", "checkbox"], ["trailColor", "트레일", "color"], ["easing", "변화", "select", EASING_OPTIONS],
    ] },
    magicCircle: { label: "마법진", defaults: { effectId: "circle-1", assetId: "jane-circle-1", source: "target", sourceRef: "", offsetX: 0, offsetY: 0, scaleStart: 0.2, scaleEnd: 1, opacityStart: 0, opacityEnd: 0.75, rotationSpeed: 45, easing: "easeOut" }, fields: [
        ["effectId", "효과 ID", "text"], ["assetId", "이미지 에셋", "asset"], ["source", "생성 기준", "select", SOURCE_OPTIONS], ["sourceRef", "기준 효과 ID", "text"],
        ["x", "월드 X", "number"], ["y", "월드 Y", "number"], ["offsetX", "X 오프셋", "number"], ["offsetY", "Y 오프셋", "number"],
        ["scaleStart", "시작 크기", "number"], ["scaleEnd", "끝 크기", "number"],
        ["opacityStart", "시작 투명도", "number", null, 0, 1, 0.05], ["opacityEnd", "끝 투명도", "number", null, 0, 1, 0.05], ["rotationSpeed", "회전(도/초)", "number"], ["easing", "변화", "select", EASING_OPTIONS],
    ] },
    projectile: { label: "투사체", defaults: { assetId: "none", source: "boss", sourceRef: "", pattern: "ring", count: 12, bursts: 1, burstInterval: 500, spread: 360, angleOffset: 0, speed: 180, size: 14, damage: 10, percentDamage: true, lifetime: 4000, homing: 0, spin: 0, color: "#ff57b6", trail: true }, fields: [
        ["assetId", "이미지 에셋", "asset"], ["source", "발사 기준", "select", SOURCE_OPTIONS], ["sourceRef", "마법진/효과 ID", "text"],
        ["x", "월드 X", "number"], ["y", "월드 Y", "number"], ["pattern", "배열", "select", PATTERN_OPTIONS],
        ["count", "방향/개수", "number", null, 1, 360, 1], ["bursts", "연속 발사", "number", null, 1, 200, 1], ["burstInterval", "발사 간격", "number"], ["spread", "전체 각도", "number"],
        ["angleOffset", "시작 각도", "number"], ["speed", "속도", "number"], ["size", "크기", "number"], ["lifetime", "수명", "number"],
        ["damage", "피해", "number"], ["percentDamage", "최대 체력 비례", "checkbox"], ["homing", "유도력", "number", null, 0, 1, 0.05], ["spin", "회전 속도", "number"], ["color", "색상", "color"], ["trail", "트레일", "checkbox"],
    ] },
    laser: { label: "레이저", defaults: { assetId: "laser-beam", source: "boss", sourceRef: "", lengthStart: 850, lengthEnd: 850, widthStart: 20, widthEnd: 160, angle: 0, aimTarget: true, rotationSpeed: 0, opacityStart: 0, opacityEnd: 1, damage: 5, percentDamage: true, damageInterval: 100, color: "#ff57b6", easing: "easeOut" }, fields: [
        ["assetId", "레이저 이미지", "asset"], ["source", "발사 기준", "select", SOURCE_OPTIONS], ["sourceRef", "마법진/효과 ID", "text"],
        ["x", "월드 X", "number"], ["y", "월드 Y", "number"], ["lengthStart", "시작 길이", "number"], ["lengthEnd", "끝 길이", "number"],
        ["widthStart", "시작 두께", "number"], ["widthEnd", "끝 두께", "number"], ["angle", "추가 각도", "number"], ["aimTarget", "플레이어 조준", "checkbox"],
        ["rotationSpeed", "회전(도/초)", "number"], ["opacityStart", "시작 투명도", "number", null, 0, 1, 0.05], ["opacityEnd", "끝 투명도", "number", null, 0, 1, 0.05],
        ["damage", "틱 피해", "number"], ["percentDamage", "최대 체력 비례", "checkbox"], ["damageInterval", "피해 간격", "number"], ["color", "색상", "color"], ["easing", "변화", "select", EASING_OPTIONS],
    ] },
    force: { label: "밀기/흡입", defaults: { mode: "pull", source: "boss", sourceRef: "", radius: 650, strength: 150, ignoreWalls: false, easing: "easeIn" }, fields: [
        ["mode", "힘 방향", "select", [option("pull", "끌어당기기"), option("push", "밀어내기")]], ["source", "중심", "select", SOURCE_OPTIONS], ["sourceRef", "마법진/효과 ID", "text"],
        ["x", "월드 X", "number"], ["y", "월드 Y", "number"],
        ["radius", "범위", "number"], ["strength", "힘", "number"], ["ignoreWalls", "벽 무시", "checkbox"], ["easing", "변화", "select", EASING_OPTIONS],
    ] },
    summon: { label: "소환", defaults: { entityId: "clone", count: 1, source: "boss", sourceRef: "", pattern: "ring", radius: 160, interval: 500, inheritSkill: "" }, fields: [
        ["entityId", "몬스터/분신 ID", "text"], ["count", "개수", "number"], ["source", "소환 기준", "select", SOURCE_OPTIONS], ["sourceRef", "기준 효과 ID", "text"],
        ["x", "월드 X", "number"], ["y", "월드 Y", "number"],
        ["pattern", "배치", "select", PATTERN_OPTIONS], ["radius", "배치 거리", "number"], ["interval", "소환 간격", "number"], ["inheritSkill", "사용할 스킬", "text"],
    ] },
    visibility: { label: "표시/투명화", defaults: { target: "boss", opacityStart: 1, opacityEnd: 0, easing: "linear", untargetable: true }, fields: [
        ["target", "대상", "select", [option("boss", "보스"), option("effect", "효과")]], ["opacityStart", "시작 투명도", "number", null, 0, 1, 0.05],
        ["opacityEnd", "끝 투명도", "number", null, 0, 1, 0.05], ["easing", "변화", "select", EASING_OPTIONS], ["untargetable", "공격 불가", "checkbox"],
    ] },
    invulnerable: { label: "무적", defaults: { enabled: true }, fields: [["enabled", "무적 활성화", "checkbox"]] },
    screenEffect: { label: "화면 효과", defaults: { color: "#ff57b6", opacityStart: 0, opacityEnd: 0.35, shake: 10, flash: false, easing: "easeInOut" }, fields: [
        ["color", "화면 색상", "color"], ["opacityStart", "시작 진하기", "number", null, 0, 1, 0.05], ["opacityEnd", "끝 진하기", "number", null, 0, 1, 0.05],
        ["shake", "화면 흔들림", "number"], ["flash", "순간 점멸", "checkbox"], ["easing", "변화", "select", EASING_OPTIONS],
    ] },
};

const BUILTIN_ASSETS = [
    ["jane-hat", "Jane Hat", "hat", "./img/craftras-jane-hat.png"], ["jane-sword", "Jane Sword", "weapon", "./img/craftras-jane-sword.png"],
    ["jane-saw", "Jane Saw", "projectile", "./img/craftras-jane-saw.png"], ["jane-throwing-sword", "Jane Throwing Sword", "projectile", "./img/craftras-jane-throwing-sword.png"],
    ["jane-circle-1", "Jane Circle 1", "magicCircle", "./img/craftras-jane-circle-1.png"], ["jane-circle-2", "Jane Circle 2", "magicCircle", "./img/craftras-jane-circle-2.png"],
    ["jane-circle-3", "Jane Circle 3", "magicCircle", "./img/craftras-jane-circle-3.png"], ["laser-beam", "Laser Beam", "laser", "./img/craftras-laser-beam.png"],
    ["diamond-sword", "Diamond Sword", "weapon", "./img/craftras-diamond-sword.png"], ["zombie-crown", "Zombie Crown", "hat", "./img/craftras-zombie-crown.png"],
    ["challenge-circle", "Magic Zombie Circle", "magicCircle", "./img/craftras-challenge-magic-circle.png"],
].map(([id, name, kind, src]) => ({
    id, name, kind, src, builtin: true, scale: 1,
    anchor: kind === "laser" ? { x: 0, y: 0.5 } : kind === "weapon" ? { x: 0.5, y: 0.14 } : { x: 0.5, y: 0.5 },
    glow: kind === "magicCircle" || kind === "laser",
    hitbox: null,
}));

function action(type, start, duration, params = {}) {
    return { id: uid("action"), type, name: ACTION_TYPES[type].label, start, duration, enabled: true, params: { ...ACTION_TYPES[type].defaults, ...params } };
}

function skill(name, duration = 10000, actions = []) {
    return { id: uid("skill"), name, duration, cooldown: 6000, weight: 1, range: 1200, loop: false, lockMovement: true, actions };
}

function phase(name, healthThreshold, skills = []) {
    return { id: uid("phase"), name, trigger: healthThreshold >= 100 ? "spawn" : "healthBelow", healthThreshold, dialogue: "", resetHealth: 0, color: "#ffffff", introInvulnerable: true, skills };
}

function baseProject(id, name, health, color, size = 46, speed = 80) {
    return {
        format: "craftras-boss", version: 1, kind: "editor-project", createdAt: new Date().toISOString(),
        boss: { id, name, health, size, speed, color, ai: { mode: "distance", desiredDistance: 220, detectionRange: 2400 }, equipment: { hatAssetId: "none", weaponAssetId: "none", weaponScale: 1, weaponAngle: -35, weaponOffset: 48 } },
        assets: clone(BUILTIN_ASSETS), phases: [phase("Phase 1", 100, [skill("Basic Attack", 5000)])], metadata: { legacySource: true },
    };
}

function janeProject() {
    const project = baseProject("jane", "Jane", 1_000_000, "#f2f2f2", 58, 110);
    project.boss.equipment = { hatAssetId: "jane-hat", weaponAssetId: "jane-sword", weaponScale: 1.25, weaponAngle: -35, weaponOffset: 62 };
    project.phases = [
        phase("Phase 1", 100, [
            skill("Triple Rush & Saw", 9000, [action("projectile", 0, 7000, { assetId: "jane-saw", pattern: "aimed", count: 1, homing: 0.55, size: 80, speed: 230 }), action("dash", 800, 450), action("dash", 3000, 450), action("dash", 5200, 450)]),
            skill("Sword Prison", 23000, [action("magicCircle", 0, 21000, { assetId: "jane-circle-1", source: "target", scaleStart: 2.4, scaleEnd: 0.8, rotationSpeed: 22 }), action("projectile", 0, 21000, { assetId: "jane-throwing-sword", source: "target", pattern: "ring", count: 36, bursts: 3, burstInterval: 7000, speed: 45, size: 42, lifetime: 9000 })]),
            skill("Clone Assault", 25000, [action("summon", 0, 25000, { entityId: "jane_clone", count: 5, interval: 5000 }), action("dash", 0, 25000, { distance: 320, damage: 50 })]),
            skill("Floral Laser", 35000, [action("magicCircle", 0, 35000, { assetId: "jane-circle-2", source: "boss", scaleStart: 0.3, scaleEnd: 2.2, rotationSpeed: 38 }), action("projectile", 1200, 28000, { source: "boss", pattern: "flower", count: 14, bursts: 36, burstInterval: 750, speed: 95, size: 10 }), action("laser", 1700, 28000, { source: "boss", lengthStart: 1300, lengthEnd: 1300, widthStart: 70, widthEnd: 190, rotationSpeed: 25.7, damage: 1 })]),
            skill("Judgment Laser", 17400, [action("laser", 0, 17400, { source: "boss", lengthStart: 1500, lengthEnd: 1500, widthStart: 250, widthEnd: 250, rotationSpeed: 112.5, damage: 50, color: "#ff304a" }), action("force", 0, 17400, { mode: "pull", source: "boss", radius: 900, strength: 162 })]),
        ]),
        phase("Phase 2 - Work Area", 50, [skill("New Phase 2 Skill", 10000)]),
    ];
    project.metadata.legacySource = false;
    return project;
}

const BOSS_TEMPLATES = [
    janeProject(), baseProject("sword_guy_2", "Basic", 100000, "#ffffff", 52, 90), baseProject("king_zombie", "King Zombie", 400, "#4f9a45", 38, 55),
    baseProject("king_guardian", "King Guardian", 1500, "#456f43", 48, 80), baseProject("queen_spider", "Queen Spider", 3000, "#7d486f", 62, 75),
    baseProject("magical_zombie", "Magical Zombie", 66666, "#301d33", 64, 90), baseProject("annihilator", "Annihilator", 1500, "#aa4d45", 68, 62),
    baseProject("the_nuclear", "The Nuclear", 10000, "#e84a43", 100, 0), baseProject("spiker", "SPIKER", 15000, "#76543b", 96, 100),
    baseProject("giant_worm", "Giant Worm", 7000, "#75472f", 74, 130),
];

const state = {
    project: clone(BOSS_TEMPLATES[0]), phaseIndex: 0, skillIndex: 0, selectedActionId: null, selectedAssetId: null,
    inspector: "boss", timelineView: "actions", history: [], future: [], dirty: false, pxPerMs: 0.065, imageCache: new Map(), autosaveTimer: 0,
};
const sim = { playing: false, time: 0, speed: 1, lastFrame: performance.now(), target: { x: 190, y: 0 }, bossBase: { x: -190, y: 0 }, drag: null, fps: 60, frameCounter: 0, fpsAt: performance.now() };
const ctx = dom.stageCanvas.getContext("2d");
const PREVIEW_OBJECT_LIMIT = 3000;

const currentPhase = () => state.project?.phases?.[state.phaseIndex] || null;
const currentSkill = () => currentPhase()?.skills?.[state.skillIndex] || null;
const currentAction = () => currentSkill()?.actions?.find(entry => entry.id === state.selectedActionId) || null;
const currentAsset = () => state.project?.assets?.find(entry => entry.id === state.selectedAssetId) || null;

function snapshot() {
    return { project: clone(state.project), phaseIndex: state.phaseIndex, skillIndex: state.skillIndex, selectedActionId: state.selectedActionId, selectedAssetId: state.selectedAssetId };
}

function recordHistory() {
    state.history.push(snapshot());
    if (state.history.length > 80) state.history.shift();
    state.future.length = 0;
}

function restore(value) {
    Object.assign(state, clone(value));
    state.dirty = true;
    resetSimulation();
    refreshAll();
}

function undo() {
    if (!state.history.length) return;
    state.future.push(snapshot());
    restore(state.history.pop());
}

function redo() {
    if (!state.future.length) return;
    state.history.push(snapshot());
    restore(state.future.pop());
}

function markDirty() {
    state.dirty = true;
    dom.statusSave.textContent = "변경됨";
    dom.statusSave.classList.add("dirty");
    dom.projectTitle.textContent = `${state.project.boss.name} *`;
    clearTimeout(state.autosaveTimer);
    state.autosaveTimer = setTimeout(() => {
        try {
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state.project));
            dom.statusSave.textContent = "자동 저장됨";
            renderBossList();
        } catch {
            dom.statusSave.textContent = "자동 저장 실패";
        }
    }, 500);
}

function mutate(callback) {
    recordHistory();
    callback();
    markDirty();
    refreshAll();
}

function setOptions(select, options) {
    select.replaceChildren(...options.map(item => {
        const element = document.createElement("option");
        element.value = item.value;
        element.textContent = item.label;
        return element;
    }));
}

function safeName(value) {
    return String(value || "boss").trim().replace(/[^a-zA-Z0-9가-힣_-]+/g, "-").replace(/^-+|-+$/g, "") || "boss";
}

function loadImage(asset) {
    if (!asset?.src) return null;
    if (state.imageCache.has(asset.src)) return state.imageCache.get(asset.src);
    const image = new Image();
    image.onload = drawStage;
    image.src = asset.src;
    state.imageCache.set(asset.src, image);
    return image;
}

function assetById(id) {
    return state.project.assets.find(asset => asset.id === id) || null;
}

function renderBossList() {
    const search = dom.bossSearch.value.trim().toLowerCase();
    dom.bossList.replaceChildren();
    let autosave = null;
    try { autosave = JSON.parse(localStorage.getItem(AUTOSAVE_KEY)); } catch {}
    const sources = [
        ...(autosave?.format === "craftras-boss" ? [{ template: normalizeProject(autosave), tag: "AUTO", auto: true }] : []),
        ...BOSS_TEMPLATES.map(template => ({ template, tag: template.metadata?.legacySource ? "LEGACY" : "NATIVE", auto: false })),
    ].filter(({ template }) => `${template.boss.name} ${template.boss.id}`.toLowerCase().includes(search));
    for (const source of sources) {
        const { template } = source;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `boss-entry${!source.auto && template.boss.id === state.project.boss.id ? " selected" : ""}`;
        const avatar = document.createElement("span");
        avatar.className = "boss-avatar";
        avatar.style.background = template.boss.color;
        avatar.textContent = template.boss.name.slice(0, 2).toUpperCase();
        const copy = document.createElement("span");
        copy.className = "entry-copy";
        copy.innerHTML = `<strong>${template.boss.name}${source.auto ? " (최근 작업)" : ""}</strong><small>${template.boss.health.toLocaleString()} HP · ${template.phases.length} phase</small>`;
        const tag = document.createElement("span");
        tag.className = "legacy-tag";
        tag.textContent = source.tag;
        button.append(avatar, copy, tag);
        button.addEventListener("click", () => loadTemplate(template));
        dom.bossList.append(button);
    }
}

function renderAssetList() {
    dom.assetList.replaceChildren();
    for (const asset of state.project.assets) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `asset-entry${asset.id === state.selectedAssetId ? " selected" : ""}`;
        const thumb = document.createElement("span");
        thumb.className = "asset-thumb";
        const image = document.createElement("img");
        image.src = asset.src;
        image.alt = "";
        thumb.append(image);
        const copy = document.createElement("span");
        copy.className = "entry-copy";
        copy.innerHTML = `<strong>${asset.name}</strong><small>${asset.kind}${asset.hitbox ? " · HITBOX" : ""}</small>`;
        button.append(thumb, copy);
        button.addEventListener("click", () => {
            state.selectedAssetId = asset.id;
            switchInspector("asset");
            refreshAll();
        });
        dom.assetList.append(button);
    }
}

function loadTemplate(template) {
    if (state.dirty && !confirm("현재 변경 내용을 버리고 이 보스를 불러올까요?")) return;
    state.project = clone(template);
    state.phaseIndex = 0;
    state.skillIndex = 0;
    state.selectedActionId = null;
    state.selectedAssetId = null;
    state.history.length = 0;
    state.future.length = 0;
    state.dirty = false;
    resetSimulation();
    refreshAll();
}

function refreshSelectors() {
    dom.phaseSelect.replaceChildren(...state.project.phases.map((item, index) => new Option(item.name, index)));
    dom.phaseSelect.value = String(state.phaseIndex);
    const skills = currentPhase()?.skills || [];
    dom.skillSelect.replaceChildren(...skills.map((item, index) => new Option(item.name, index)));
    dom.skillSelect.value = String(state.skillIndex);
    dom.stageEmpty.classList.toggle("hidden", !!currentSkill());
}

function assetOptions(kind = null) {
    return [option("none", "없음"), ...state.project.assets.filter(asset => !kind || asset.kind === kind || kind === "any").map(asset => option(asset.id, asset.name))];
}

function fillBossInspector() {
    const boss = state.project.boss;
    dom.bossName.value = boss.name;
    dom.bossId.value = boss.id;
    dom.bossHealth.value = boss.health;
    dom.bossSize.value = boss.size;
    dom.bossSpeed.value = boss.speed;
    dom.bossColor.value = boss.color;
    dom.bossAiMode.value = boss.ai.mode;
    dom.bossDistance.value = boss.ai.desiredDistance;
    dom.bossDetection.value = boss.ai.detectionRange;
    setOptions(dom.bossHatAsset, assetOptions("hat"));
    setOptions(dom.bossWeaponAsset, assetOptions("weapon"));
    dom.bossHatAsset.value = boss.equipment.hatAssetId || "none";
    dom.bossWeaponAsset.value = boss.equipment.weaponAssetId || "none";
    dom.weaponScale.value = boss.equipment.weaponScale;
    dom.weaponAngle.value = boss.equipment.weaponAngle;
    dom.weaponOffset.value = boss.equipment.weaponOffset;
}

function fillPhaseInspector() {
    const item = currentPhase();
    for (const control of [dom.phaseName, dom.phaseTrigger, dom.phaseHealthThreshold, dom.phaseDialogue, dom.phaseHealth, dom.phaseColor, dom.phaseInvulnerable, dom.deletePhaseButton]) control.disabled = !item;
    if (!item) return;
    dom.phaseName.value = item.name;
    dom.phaseTrigger.value = item.trigger;
    dom.phaseHealthThreshold.value = item.healthThreshold;
    dom.phaseDialogue.value = item.dialogue;
    dom.phaseHealth.value = item.resetHealth;
    dom.phaseColor.value = item.color;
    dom.phaseInvulnerable.checked = item.introInvulnerable;
}

function fillSkillInspector() {
    const item = currentSkill();
    for (const control of [dom.skillName, dom.skillDuration, dom.skillCooldown, dom.skillWeight, dom.skillRange, dom.skillLoop, dom.skillLockMovement, dom.deleteSkillButton]) control.disabled = !item;
    if (!item) return;
    dom.skillName.value = item.name;
    dom.skillDuration.value = item.duration;
    dom.skillCooldown.value = item.cooldown;
    dom.skillWeight.value = item.weight;
    dom.skillRange.value = item.range;
    dom.skillLoop.checked = item.loop;
    dom.skillLockMovement.checked = item.lockMovement;
}

function makeActionField(actionItem, field) {
    const [key, label, type, options, min, max, step] = field;
    const wrapper = document.createElement("label");
    wrapper.className = type === "checkbox" ? "check-line" : "field";
    let input;
    if (type === "select" || type === "asset") {
        input = document.createElement("select");
        setOptions(input, type === "asset" ? assetOptions("any") : options);
    } else if (type === "textarea") {
        input = document.createElement("textarea");
        input.rows = 3;
    } else {
        input = document.createElement("input");
        input.type = type;
        if (min != null) input.min = min;
        if (max != null) input.max = max;
        if (step != null) input.step = step;
    }
    if (type === "checkbox") {
        input.checked = !!actionItem.params[key];
        wrapper.append(input, document.createTextNode(label));
    } else {
        const caption = document.createElement("span");
        caption.textContent = label;
        input.value = actionItem.params[key] ?? "";
        wrapper.append(caption, input);
    }
    input.addEventListener("change", () => mutate(() => {
        actionItem.params[key] = type === "checkbox" ? input.checked : type === "number" ? Number(input.value) : input.value;
    }));
    return wrapper;
}

function fillActionInspector() {
    const item = currentAction();
    dom.actionEmpty.classList.toggle("hidden", !!item);
    dom.actionCommands.classList.toggle("hidden", !item);
    dom.actionFields.replaceChildren();
    if (!item) return;
    dom.actionInspectorTitle.textContent = ACTION_TYPES[item.type]?.label || item.type;
    const common = [
        ["name", "이름", "text", item], ["start", "시작 시간(ms)", "number", item], ["duration", "지속 시간(ms)", "number", item], ["enabled", "활성화", "checkbox", item],
    ];
    for (const [key, label, type] of common) {
        const wrapper = document.createElement("label");
        wrapper.className = type === "checkbox" ? "check-line" : "field";
        const input = document.createElement("input");
        input.type = type;
        if (type === "checkbox") {
            input.checked = !!item[key];
            wrapper.append(input, document.createTextNode(label));
        } else {
            const span = document.createElement("span");
            span.textContent = label;
            input.value = item[key];
            wrapper.append(span, input);
        }
        input.addEventListener("change", () => mutate(() => item[key] = type === "number" ? Math.max(0, Number(input.value)) : type === "checkbox" ? input.checked : input.value));
        dom.actionFields.append(wrapper);
    }
    const separator = document.createElement("div");
    separator.className = "section-title";
    separator.textContent = "행동 설정";
    dom.actionFields.append(separator);
    for (const field of ACTION_TYPES[item.type]?.fields || []) dom.actionFields.append(makeActionField(item, field));
}

function fillAssetInspector() {
    const asset = currentAsset();
    for (const control of [dom.assetName, dom.assetKind, dom.replaceAssetImageButton, dom.attachHitboxButton, dom.assetScale, dom.assetAnchorX, dom.assetAnchorY, dom.assetGlow, dom.deleteAssetButton]) control.disabled = !asset;
    dom.assetPreview.replaceChildren();
    if (!asset) {
        dom.assetPreview.textContent = "NO ASSET";
        return;
    }
    const image = document.createElement("img");
    image.src = asset.src;
    image.alt = asset.name;
    dom.assetPreview.append(image);
    dom.assetName.value = asset.name;
    dom.assetKind.value = asset.kind;
    dom.assetScale.value = asset.scale;
    dom.assetAnchorX.value = asset.anchor.x;
    dom.assetAnchorY.value = asset.anchor.y;
    dom.assetGlow.checked = asset.glow;
}

function renderTimeline() {
    const selectedSkill = currentSkill();
    dom.timelineRuler.replaceChildren();
    dom.actionTracks.replaceChildren();
    if (state.timelineView === "phases") {
        renderPhaseTimeline();
        return;
    }
    if (!selectedSkill) return;
    const duration = Math.max(1000, selectedSkill.duration);
    const width = Math.max(900, duration * state.pxPerMs);
    dom.timelineRuler.style.width = `${width + 160}px`;
    dom.actionTracks.style.width = `${width + 160}px`;
    for (let time = 0; time <= duration; time += 1000) {
        const mark = document.createElement("div");
        mark.className = "ruler-mark";
        mark.style.left = `${160 + time * state.pxPerMs}px`;
        mark.innerHTML = `<span>${(time / 1000).toFixed(0)}s</span>`;
        dom.timelineRuler.append(mark);
    }
    const actions = [...selectedSkill.actions].sort((a, b) => a.start - b.start);
    for (const item of actions) {
        const row = document.createElement("div");
        row.className = `action-row${item.id === state.selectedActionId ? " selected" : ""}`;
        const label = document.createElement("div");
        label.className = "action-label";
        label.innerHTML = `<span class="action-type-dot"></span><strong>${item.name}</strong>`;
        label.addEventListener("click", () => selectAction(item.id));
        const lane = document.createElement("div");
        lane.className = "action-lane";
        const clip = document.createElement("div");
        clip.className = "action-clip";
        clip.dataset.type = item.type;
        clip.textContent = `${item.name} · ${(item.duration / 1000).toFixed(1)}s`;
        clip.style.left = `${item.start * state.pxPerMs}px`;
        clip.style.width = `${Math.max(8, item.duration * state.pxPerMs)}px`;
        clip.style.opacity = item.enabled ? "1" : "0.35";
        clip.addEventListener("pointerdown", event => beginActionDrag(event, item));
        lane.addEventListener("pointerdown", event => {
            if (event.target === clip) return;
            seekSimulation((event.offsetX / state.pxPerMs));
        });
        lane.append(clip);
        row.append(label, lane);
        dom.actionTracks.append(row);
    }
    updatePlayhead();
}

function renderPhaseTimeline() {
    const width = 980;
    dom.timelineRuler.style.width = `${width + 160}px`;
    dom.actionTracks.style.width = `${width + 160}px`;
    for (let health = 100; health >= 0; health -= 10) {
        const mark = document.createElement("div");
        mark.className = "ruler-mark";
        mark.style.left = `${160 + (100 - health) / 100 * width}px`;
        mark.innerHTML = `<span>${health}% HP</span>`;
        dom.timelineRuler.append(mark);
    }
    const phases = [...state.project.phases].sort((a, b) => Number(b.healthThreshold) - Number(a.healthThreshold));
    phases.forEach((phaseItem, index) => {
        const originalIndex = state.project.phases.indexOf(phaseItem);
        const startHealth = clamp(Number(phaseItem.healthThreshold), 0, 100);
        const endHealth = clamp(Number(phases[index + 1]?.healthThreshold ?? 0), 0, startHealth);
        const row = document.createElement("div");
        row.className = `action-row phase-row${originalIndex === state.phaseIndex ? " selected" : ""}`;
        const label = document.createElement("div");
        label.className = "action-label";
        label.innerHTML = `<span class="action-type-dot"></span><strong>${phaseItem.name}</strong>`;
        const lane = document.createElement("div");
        lane.className = "action-lane";
        const clip = document.createElement("button");
        clip.type = "button";
        clip.className = "phase-clip";
        clip.style.left = `${(100 - startHealth) / 100 * width}px`;
        clip.style.width = `${Math.max(44, (startHealth - endHealth) / 100 * width)}px`;
        clip.style.background = phaseItem.color || "#4ba8ff";
        clip.textContent = `${phaseItem.name} · ${startHealth}% → ${endHealth}%`;
        const selectPhase = () => {
            state.phaseIndex = originalIndex;
            state.skillIndex = 0;
            state.selectedActionId = null;
            switchInspector("phase");
            resetSimulation();
            refreshAll();
        };
        label.addEventListener("click", selectPhase);
        clip.addEventListener("click", selectPhase);
        lane.append(clip);
        row.append(label, lane);
        dom.actionTracks.append(row);
    });
    dom.playhead.style.display = "none";
}

function beginActionDrag(event, item) {
    event.preventDefault();
    selectAction(item.id);
    recordHistory();
    const startX = event.clientX;
    const original = item.start;
    const move = moveEvent => {
        item.start = clamp(Math.round((original + (moveEvent.clientX - startX) / state.pxPerMs) / 10) * 10, 0, Math.max(0, currentSkill().duration - item.duration));
        markDirty();
        renderTimeline();
        fillActionInspector();
    };
    const end = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
}

function selectAction(id) {
    state.selectedActionId = id;
    switchInspector("action");
    refreshAll();
}

function switchInspector(name) {
    state.inspector = name;
    document.querySelectorAll("[data-inspector]").forEach(button => button.classList.toggle("active", button.dataset.inspector === name));
    document.querySelectorAll(".inspector-view").forEach(view => view.classList.toggle("active", view.dataset.view === name));
}

function refreshStatus() {
    const phaseItem = currentPhase();
    const skillItem = currentSkill();
    dom.statusBoss.textContent = `${state.project.boss.name} · ${state.project.boss.health.toLocaleString()} HP`;
    dom.statusSelection.textContent = currentAction()?.name || currentAsset()?.name || skillItem?.name || phaseItem?.name || "선택 없음";
    dom.undoButton.disabled = !state.history.length;
    dom.redoButton.disabled = !state.future.length;
    dom.projectTitle.textContent = `${state.project.boss.name}${state.dirty ? " *" : ""}`;
    if (!state.dirty) {
        dom.statusSave.textContent = "저장됨";
        dom.statusSave.classList.remove("dirty");
    }
}

function refreshAll() {
    state.phaseIndex = clamp(state.phaseIndex, 0, Math.max(0, state.project.phases.length - 1));
    state.skillIndex = clamp(state.skillIndex, 0, Math.max(0, (currentPhase()?.skills.length || 1) - 1));
    renderBossList();
    renderAssetList();
    refreshSelectors();
    fillBossInspector();
    fillPhaseInspector();
    fillSkillInspector();
    fillActionInspector();
    fillAssetInspector();
    renderTimeline();
    refreshStatus();
    drawStage();
}

function ease(name, t) {
    t = clamp(t, 0, 1);
    if (name === "easeIn") return t * t;
    if (name === "easeOut") return 1 - (1 - t) * (1 - t);
    if (name === "easeInOut") return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    if (name === "bounce") return 1 - Math.abs(Math.cos(t * Math.PI * 2.5)) * (1 - t);
    return t;
}

function actionProgress(item, time = sim.time) {
    return clamp((time - item.start) / Math.max(1, item.duration), 0, 1);
}

function activeActions(type = null, time = sim.time) {
    return (currentSkill()?.actions || []).filter(item => item.enabled && (!type || item.type === type) && time >= item.start && time < item.start + item.duration);
}

function bossPositionAt(time = sim.time) {
    let position = { ...sim.bossBase };
    const selectedSkill = currentSkill();
    if (selectedSkill && !selectedSkill.lockMovement) {
        const ai = state.project.boss.ai;
        const dx = sim.target.x - position.x;
        const dy = sim.target.y - position.y;
        const distance = Math.hypot(dx, dy) || 1;
        const travel = Number(state.project.boss.speed) * time / 1000;
        if (ai.mode === "orbit") {
            const angle = travel / Math.max(1, Number(ai.desiredDistance));
            position = { x: sim.target.x + Math.cos(angle) * ai.desiredDistance, y: sim.target.y + Math.sin(angle) * ai.desiredDistance };
        } else if (ai.mode === "approach" || ai.mode === "retreat" || ai.mode === "distance") {
            const direction = ai.mode === "retreat" ? -1 : distance > Number(ai.desiredDistance) ? 1 : -1;
            const remaining = ai.mode === "distance" ? Math.abs(distance - Number(ai.desiredDistance)) : ai.mode === "approach" ? distance : travel;
            const amount = Math.min(travel, remaining);
            position = { x: position.x + dx / distance * amount * direction, y: position.y + dy / distance * amount * direction };
        }
    }
    const actions = [...(currentSkill()?.actions || [])].filter(item => item.enabled && item.start <= time).sort((a, b) => a.start - b.start);
    for (const item of actions) {
        if (item.type === "teleport" && time >= item.start + Math.max(0, Number(item.params.fadeOut) || 0)) position = teleportDestination(item, position);
        if (item.type === "move") {
            const p = ease(item.params.easing, actionProgress(item, time));
            const dx = sim.target.x - position.x;
            const dy = sim.target.y - position.y;
            const distance = Math.hypot(dx, dy) || 1;
            const direction = item.params.mode === "retreat" ? -1 : 1;
            if (item.params.mode === "orbit") {
                const angle = p * Math.PI * 2;
                position = { x: sim.target.x + Math.cos(angle) * item.params.desiredDistance, y: sim.target.y + Math.sin(angle) * item.params.desiredDistance };
            } else if (item.params.mode !== "idle") {
                const travel = Math.min(Math.abs(distance - item.params.desiredDistance), item.params.speed * item.duration / 1000 * p);
                position = { x: position.x + dx / distance * travel * direction, y: position.y + dy / distance * travel * direction };
            }
        }
        if (item.type === "dash") {
            const p = ease(item.params.easing, actionProgress(item, time));
            const angle = item.params.target === "target" ? Math.atan2(sim.target.y - position.y, sim.target.x - position.x) : Number(item.params.angle || 0) * Math.PI / 180;
            position = { x: position.x + Math.cos(angle) * item.params.distance * p, y: position.y + Math.sin(angle) * item.params.distance * p };
        }
    }
    return position;
}

function teleportDestination(item, from) {
    const distance = Number(item.params.distance) || 0;
    const baseAngle = Math.atan2(sim.target.y - from.y, sim.target.x - from.x);
    const extra = Number(item.params.angle || 0) * Math.PI / 180;
    if (item.params.destination === "world") return { x: Number(item.params.x) || 0, y: Number(item.params.y) || 0 };
    if (item.params.destination === "bossOffset") return { x: from.x + Math.cos(extra) * distance, y: from.y + Math.sin(extra) * distance };
    if (item.params.destination === "aroundTarget") {
        const angle = ((hashCode(item.id) % 360) * Math.PI / 180) + extra;
        return { x: sim.target.x + Math.cos(angle) * distance, y: sim.target.y + Math.sin(angle) * distance };
    }
    const angle = baseAngle + extra + (item.params.destination === "frontTarget" ? Math.PI : 0);
    return { x: sim.target.x + Math.cos(angle) * distance, y: sim.target.y + Math.sin(angle) * distance };
}

function hashCode(text) {
    let hash = 0;
    for (const char of String(text)) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return Math.abs(hash);
}

function sourcePosition(params, effects, bossPos) {
    if (params.source === "target") return { ...sim.target };
    if (params.source === "effect" && effects.has(params.sourceRef)) return effects.get(params.sourceRef);
    if (params.source === "world") return { x: Number(params.x) || 0, y: Number(params.y) || 0 };
    return { ...bossPos };
}

function effectPositions(bossPos, time = sim.time) {
    const effects = new Map();
    for (const item of activeActions("magicCircle", time)) {
        const source = sourcePosition(item.params, effects, bossPos);
        effects.set(item.params.effectId, { x: source.x + Number(item.params.offsetX || 0), y: source.y + Number(item.params.offsetY || 0) });
    }
    return effects;
}

function resizeCanvas() {
    const rect = dom.stageCanvas.getBoundingClientRect();
    const dpr = Math.max(1, devicePixelRatio || 1);
    dom.stageCanvas.width = Math.max(1, Math.round(rect.width * dpr));
    dom.stageCanvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawStage();
}

function canvasCenter() {
    const rect = dom.stageCanvas.getBoundingClientRect();
    return { x: rect.width / 2, y: rect.height / 2 };
}

function toScreen(point, shake = { x: 0, y: 0 }) {
    const center = canvasCenter();
    return { x: center.x + point.x + shake.x, y: center.y + point.y + shake.y };
}

function drawAsset(asset, x, y, width, height, angle = 0, alpha = 1, tint = null) {
    const image = loadImage(asset);
    const assetScale = Math.max(0.01, Number(asset?.scale) || 1);
    width *= assetScale;
    height *= assetScale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    if (asset?.glow) {
        ctx.globalCompositeOperation = "lighter";
        ctx.shadowColor = tint || "#ff57b6";
        ctx.shadowBlur = Math.max(8, Math.min(width, height) * 0.2);
    }
    if (tint) ctx.filter = tint === "#ff304a" ? "hue-rotate(35deg) saturate(2)" : "none";
    if (image?.complete && image.naturalWidth) ctx.drawImage(image, -width * (asset.anchor?.x ?? 0.5), -height * (asset.anchor?.y ?? 0.5), width, height);
    else {
        ctx.fillStyle = tint || "#ff57b6";
        ctx.fillRect(-width / 2, -height / 2, width, height);
    }
    ctx.restore();
}

function drawHitbox(asset, x, y, width, height, angle = 0) {
    const polygons = asset?.hitbox?.runtime?.polygons || asset?.hitbox?.polygons || [];
    if (!polygons.length) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const assetScale = Math.max(0.01, Number(asset?.scale) || 1);
    width *= assetScale;
    height *= assetScale;
    const runtimeAnchor = asset?.hitbox?.runtime?.anchor || { x: 0.5, y: 0.5 };
    const assetAnchor = asset?.anchor || { x: 0.5, y: 0.5 };
    ctx.strokeStyle = "#2ed6b7";
    ctx.fillStyle = "rgba(46,214,183,0.16)";
    ctx.lineWidth = 1.5;
    for (const entry of polygons) {
        const points = entry.points || entry;
        if (!points?.length) continue;
        ctx.beginPath();
        ctx.moveTo((points[0][0] + runtimeAnchor.x - assetAnchor.x) * width, (points[0][1] + runtimeAnchor.y - assetAnchor.y) * height);
        for (const point of points.slice(1)) ctx.lineTo((point[0] + runtimeAnchor.x - assetAnchor.x) * width, (point[1] + runtimeAnchor.y - assetAnchor.y) * height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}

function collectEffects(bossPos, shake) {
    const effects = effectPositions(bossPos);
    for (const item of activeActions("magicCircle")) {
        const p = ease(item.params.easing, actionProgress(item));
        const position = effects.get(item.params.effectId) || bossPos;
        const screen = toScreen(position, shake);
        const scale = lerp(Number(item.params.scaleStart), Number(item.params.scaleEnd), p) * 170;
        const alpha = lerp(Number(item.params.opacityStart), Number(item.params.opacityEnd), p);
        const angle = (sim.time - item.start) / 1000 * Number(item.params.rotationSpeed) * Math.PI / 180;
        const asset = assetById(item.params.assetId);
        if (asset) drawAsset(asset, screen.x, screen.y, scale, scale, angle, alpha);
        else {
            ctx.save(); ctx.translate(screen.x, screen.y); ctx.rotate(angle); ctx.globalAlpha = alpha; ctx.strokeStyle = "#cf72ff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, scale / 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
    }
    return effects;
}

function projectileAngles(params, source) {
    const count = clamp(Math.round(Number(params.count) || 1), 1, 360);
    const aim = Math.atan2(sim.target.y - source.y, sim.target.x - source.x) + Number(params.angleOffset || 0) * Math.PI / 180;
    if (params.pattern === "ring" || params.pattern === "flower") return Array.from({ length: count }, (_, index) => aim + index * Math.PI * 2 / count);
    if (params.pattern === "arc") {
        const spread = Number(params.spread || 90) * Math.PI / 180;
        return Array.from({ length: count }, (_, index) => aim - spread / 2 + spread * (count === 1 ? 0.5 : index / (count - 1)));
    }
    if (params.pattern === "random") return Array.from({ length: count }, (_, index) => (hashCode(`${params.sourceRef}-${index}`) % 360) * Math.PI / 180);
    if (params.pattern === "line") return Array.from({ length: count }, () => aim);
    return Array.from({ length: count }, () => aim);
}

function drawProjectiles(effects, bossPos, shake) {
    let objects = 0;
    for (const item of currentSkill()?.actions || []) {
        if (!item.enabled || item.type !== "projectile" || sim.time < item.start) continue;
        const params = item.params;
        const bursts = clamp(Math.round(Number(params.bursts) || 1), 1, 200);
        const interval = Math.max(1, Number(params.burstInterval) || 1);
        for (let burst = 0; burst < bursts; burst++) {
            const spawnAt = item.start + burst * interval;
            const age = sim.time - spawnAt;
            if (age < 0 || age > Number(params.lifetime)) continue;
            const spawnBossPos = bossPositionAt(spawnAt);
            const spawnEffects = effectPositions(spawnBossPos, spawnAt);
            const source = sourcePosition(params, spawnEffects, spawnBossPos);
            const angles = projectileAngles(params, source);
            for (let index = 0; index < angles.length; index++) {
                if (objects >= PREVIEW_OBJECT_LIMIT) return objects;
                let angle = angles[index];
                if (params.pattern === "flower") angle += age / 1000 * 0.9 * (burst % 2 ? -1 : 1);
                if (Number(params.homing) > 0) {
                    const targetAngle = Math.atan2(sim.target.y - source.y, sim.target.x - source.x);
                    angle = lerpAngle(angle, targetAngle, clamp(Number(params.homing) * age / 2000, 0, 1));
                }
                const lineOffset = params.pattern === "line" ? (index - (angles.length - 1) / 2) * Number(params.size) * 1.5 : 0;
                const distance = Number(params.speed) * age / 1000;
                const world = { x: source.x + Math.cos(angle) * distance + Math.cos(angle + Math.PI / 2) * lineOffset, y: source.y + Math.sin(angle) * distance + Math.sin(angle + Math.PI / 2) * lineOffset };
                const screen = toScreen(world, shake);
                const size = Number(params.size) || 12;
                if (params.trail) {
                    ctx.save(); ctx.strokeStyle = `${params.color}55`; ctx.lineWidth = Math.max(2, size * 0.15); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(screen.x, screen.y); ctx.lineTo(screen.x - Math.cos(angle) * size * 1.2, screen.y - Math.sin(angle) * size * 1.2); ctx.stroke(); ctx.restore();
                }
                const asset = assetById(params.assetId);
                if (asset) drawAsset(asset, screen.x, screen.y, size, size, angle + age / 1000 * Number(params.spin) * Math.PI / 180, 1);
                else { ctx.fillStyle = params.color; ctx.beginPath(); ctx.arc(screen.x, screen.y, size / 2, 0, Math.PI * 2); ctx.fill(); }
                objects++;
            }
        }
    }
    return objects;
}

function lerpAngle(a, b, t) {
    let difference = (b - a + Math.PI) % (Math.PI * 2) - Math.PI;
    if (difference < -Math.PI) difference += Math.PI * 2;
    return a + difference * t;
}

function drawLasers(effects, bossPos, shake) {
    let objects = 0;
    for (const item of activeActions("laser")) {
        const p = ease(item.params.easing, actionProgress(item));
        const source = sourcePosition(item.params, effects, bossPos);
        const baseAngle = item.params.aimTarget ? Math.atan2(sim.target.y - source.y, sim.target.x - source.x) : 0;
        const angle = baseAngle + Number(item.params.angle) * Math.PI / 180 + (sim.time - item.start) / 1000 * Number(item.params.rotationSpeed) * Math.PI / 180;
        const legacyLength = Number(item.params.length) || 850;
        const length = lerp(Number(item.params.lengthStart ?? legacyLength), Number(item.params.lengthEnd ?? legacyLength), p);
        const width = lerp(Number(item.params.widthStart), Number(item.params.widthEnd), p);
        const alpha = lerp(Number(item.params.opacityStart), Number(item.params.opacityEnd), p);
        const screen = toScreen(source, shake);
        const asset = assetById(item.params.assetId);
        if (asset) drawAsset(asset, screen.x, screen.y, length, width, angle, alpha, item.params.color);
        else { ctx.save(); ctx.translate(screen.x, screen.y); ctx.rotate(angle); ctx.globalAlpha = alpha; ctx.fillStyle = item.params.color; ctx.fillRect(0, -width / 2, length, width); ctx.restore(); }
        if (dom.showHitboxes.checked && asset) drawHitbox(asset, screen.x, screen.y, length, width, angle);
        objects++;
    }
    return objects;
}

function drawSummons(effects, bossPos, shake) {
    let objects = 0;
    for (const item of activeActions("summon")) {
        const count = clamp(Math.round(item.params.count), 1, 100);
        for (let index = 0; index < count; index++) {
            const spawnAt = item.start + index * Math.max(1, item.params.interval);
            if (sim.time < spawnAt) continue;
            const source = sourcePosition(item.params, effects, bossPos);
            const angle = index * Math.PI * 2 / count + sim.time / 1800;
            const position = { x: source.x + Math.cos(angle) * item.params.radius, y: source.y + Math.sin(angle) * item.params.radius };
            const screen = toScreen(position, shake);
            ctx.fillStyle = "#d789ff"; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(screen.x, screen.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
            ctx.fillStyle = "#fff"; ctx.font = "8px Segoe UI"; ctx.textAlign = "center"; ctx.fillText(item.params.entityId, screen.x, screen.y - 18);
            objects++;
        }
    }
    return objects;
}

function bossOpacity() {
    let opacity = 1;
    const visibility = activeActions("visibility").find(actionItem => actionItem.params.target === "boss");
    if (visibility) {
        const p = ease(visibility.params.easing, actionProgress(visibility));
        opacity = lerp(Number(visibility.params.opacityStart), Number(visibility.params.opacityEnd), p);
    }
    const teleport = activeActions("teleport").at(-1);
    if (teleport) {
        const elapsed = sim.time - teleport.start;
        const fadeOut = Math.max(1, Number(teleport.params.fadeOut) || 1);
        const fadeIn = Math.max(1, Number(teleport.params.fadeIn) || 1);
        const teleportOpacity = elapsed < fadeOut
            ? 1 - elapsed / fadeOut
            : elapsed < fadeOut + fadeIn ? (elapsed - fadeOut) / fadeIn : 1;
        opacity = Math.min(opacity, clamp(teleportOpacity, 0, 1));
    }
    return opacity;
}

function weaponPose() {
    let angle = Number(state.project.boss.equipment.weaponAngle) || 0;
    for (const item of activeActions("animation")) {
        const repeats = Math.max(1, Number(item.params.repeats) || 1);
        let p = (actionProgress(item) * repeats) % 1;
        if (item.params.preset === "swing") p = p < 0.5 ? p * 2 : 2 - p * 2;
        if (item.params.preset === "spin") p = actionProgress(item) * repeats;
        angle = lerp(Number(item.params.angleStart), Number(item.params.angleEnd), ease(item.params.easing, p));
    }
    return angle * Math.PI / 180;
}

function screenShake() {
    let amount = 0;
    for (const item of activeActions("screenEffect")) amount = Math.max(amount, Number(item.params.shake) || 0);
    if (!amount) return { x: 0, y: 0 };
    return { x: Math.sin(sim.time * 0.19) * amount, y: Math.cos(sim.time * 0.23) * amount };
}

function drawActor(bossPos, shake) {
    const boss = state.project.boss;
    const screen = toScreen(bossPos, shake);
    const alpha = bossOpacity();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = boss.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, boss.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (activeActions("invulnerable").some(item => item.params.enabled)) {
        ctx.strokeStyle = "rgba(77, 205, 255, 0.9)";
        ctx.lineWidth = 4;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, boss.size + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    const aim = Math.atan2(sim.target.y - bossPos.y, sim.target.x - bossPos.x);
    const equipment = boss.equipment;
    const hat = assetById(equipment.hatAssetId);
    if (hat) drawAsset(hat, screen.x, screen.y - boss.size * 0.34, boss.size * 1.7, boss.size * 1.7, 0, alpha);
    const weapon = assetById(equipment.weaponAssetId);
    if (weapon) {
        const distance = Number(equipment.weaponOffset) || boss.size;
        drawAsset(weapon, screen.x + Math.cos(aim) * distance, screen.y + Math.sin(aim) * distance, boss.size * 1.65 * equipment.weaponScale, boss.size * 1.65 * equipment.weaponScale, aim - Math.PI / 2 + weaponPose(), alpha);
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "700 12px Segoe UI";
    ctx.fillText(boss.name, screen.x, screen.y - boss.size - 15);
    ctx.restore();
    return screen;
}

function drawTarget(shake) {
    const screen = toScreen(sim.target, shake);
    ctx.save();
    ctx.fillStyle = "#3e8ff0";
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#dceeff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "700 11px Segoe UI";
    ctx.fillText("DUMMY", screen.x, screen.y - 38);
    if (dom.showHitboxes.checked) { ctx.strokeStyle = "#2ed6b7"; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(screen.x, screen.y, 25, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
}

function updateDialogue() {
    const item = activeActions("dialogue").at(-1);
    dom.dialoguePreview.classList.toggle("hidden", !item);
    if (!item) return;
    dom.dialoguePreview.querySelector("strong").textContent = item.params.speaker;
    dom.dialoguePreview.querySelector("span").textContent = item.params.text;
}

function drawStage() {
    const rect = dom.stageCanvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!currentSkill()) return;
    const shake = screenShake();
    const bossPos = bossPositionAt();
    const effects = collectEffects(bossPos, shake);
    let objects = effects.size;
    objects += drawProjectiles(effects, bossPos, shake);
    objects += drawLasers(effects, bossPos, shake);
    drawActor(bossPos, shake);
    drawTarget(shake);
    objects += drawSummons(effects, bossPos, shake);
    for (const item of activeActions("screenEffect")) {
        const p = ease(item.params.easing, actionProgress(item));
        const alpha = item.params.flash ? Math.sin(p * Math.PI) * Number(item.params.opacityEnd) : lerp(Number(item.params.opacityStart), Number(item.params.opacityEnd), p);
        ctx.save(); ctx.globalAlpha = clamp(alpha, 0, 1); ctx.fillStyle = item.params.color; ctx.fillRect(0, 0, rect.width, rect.height); ctx.restore();
    }
    updateDialogue();
    dom.statusObjects.textContent = `오브젝트 ${objects}`;
}

function updateForces(dt) {
    const bossPos = bossPositionAt();
    const effects = effectPositions(bossPos);
    for (const item of activeActions("force")) {
        const source = sourcePosition(item.params, effects, bossPos);
        const dx = source.x - sim.target.x;
        const dy = source.y - sim.target.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance > Number(item.params.radius)) continue;
        const direction = item.params.mode === "pull" ? 1 : -1;
        const strength = Number(item.params.strength) * ease(item.params.easing, actionProgress(item));
        sim.target.x += dx / distance * strength * dt / 1000 * direction;
        sim.target.y += dy / distance * strength * dt / 1000 * direction;
    }
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000).toString().padStart(2, "0");
    const seconds = Math.floor(ms % 60000 / 1000).toString().padStart(2, "0");
    const millis = Math.floor(ms % 1000).toString().padStart(3, "0");
    return `${minutes}:${seconds}.${millis}`;
}

function updatePlayhead() {
    dom.playhead.style.display = state.timelineView === "actions" ? "block" : "none";
    dom.playhead.style.left = `${160 + sim.time * state.pxPerMs}px`;
    dom.stageTime.textContent = formatTime(sim.time);
}

function resetSimulation() {
    sim.playing = false;
    sim.time = 0;
    sim.target = { x: 190, y: 0 };
    sim.bossBase = { x: -190, y: 0 };
    sim.lastFrame = performance.now();
    updatePlayhead();
    drawStage();
}

function seekSimulation(time) {
    sim.time = clamp(Number(time) || 0, 0, currentSkill()?.duration || 0);
    updatePlayhead();
    drawStage();
}

function animationFrame(now) {
    const dt = Math.min(50, now - sim.lastFrame);
    sim.lastFrame = now;
    if (sim.playing && currentSkill()) {
        sim.time += dt * sim.speed;
        updateForces(dt * sim.speed);
        if (sim.time >= currentSkill().duration) {
            if (currentSkill().loop) {
                sim.time %= currentSkill().duration;
                sim.target = { x: 190, y: 0 };
            } else {
                sim.time = currentSkill().duration;
                sim.playing = false;
            }
        }
        updatePlayhead();
    }
    drawStage();
    sim.frameCounter++;
    if (now - sim.fpsAt >= 500) {
        sim.fps = Math.round(sim.frameCounter * 1000 / (now - sim.fpsAt));
        sim.frameCounter = 0;
        sim.fpsAt = now;
        dom.statusFps.textContent = `FPS ${sim.fps}`;
    }
    requestAnimationFrame(animationFrame);
}

function eventToWorld(event) {
    const rect = dom.stageCanvas.getBoundingClientRect();
    const center = canvasCenter();
    return { x: event.clientX - rect.left - center.x, y: event.clientY - rect.top - center.y };
}

dom.stageCanvas.addEventListener("pointerdown", event => {
    const point = eventToWorld(event);
    const bossPos = bossPositionAt();
    if (Math.hypot(point.x - sim.target.x, point.y - sim.target.y) <= 38) sim.drag = "target";
    else if (Math.hypot(point.x - bossPos.x, point.y - bossPos.y) <= state.project.boss.size + 12) sim.drag = "boss";
    if (sim.drag) dom.stageCanvas.setPointerCapture(event.pointerId);
});
dom.stageCanvas.addEventListener("pointermove", event => {
    if (!sim.drag) return;
    const point = eventToWorld(event);
    if (sim.drag === "target") sim.target = point;
    else sim.bossBase = point;
});
dom.stageCanvas.addEventListener("pointerup", event => { sim.drag = null; dom.stageCanvas.releasePointerCapture?.(event.pointerId); });

function addPhase() {
    mutate(() => {
        state.project.phases.push(phase(`Phase ${state.project.phases.length + 1}`, Math.max(0, 100 - state.project.phases.length * 25), [skill("New Skill")]));
        state.phaseIndex = state.project.phases.length - 1;
        state.skillIndex = 0;
        state.selectedActionId = null;
    });
    switchInspector("phase");
}

function addSkill() {
    if (!currentPhase()) return;
    mutate(() => {
        currentPhase().skills.push(skill(`Skill ${currentPhase().skills.length + 1}`));
        state.skillIndex = currentPhase().skills.length - 1;
        state.selectedActionId = null;
    });
    switchInspector("skill");
}

function addAction() {
    const selectedSkill = currentSkill();
    const type = dom.actionTypeSelect.value;
    if (!selectedSkill || !ACTION_TYPES[type]) return;
    mutate(() => {
        const duration = type === "dialogue" ? 3000 : type === "teleport" ? 600 : Math.min(5000, selectedSkill.duration);
        const item = action(type, Math.min(sim.time, Math.max(0, selectedSkill.duration - duration)), duration);
        selectedSkill.actions.push(item);
        state.selectedActionId = item.id;
    });
    switchInspector("action");
}

function readFileDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function importAssetImage(file, replace = false) {
    if (!file) return;
    const src = await readFileDataUrl(file);
    mutate(() => {
        if (replace && currentAsset()) {
            currentAsset().src = src;
            currentAsset().builtin = false;
        } else {
            const asset = { id: uid("asset"), name: file.name.replace(/\.[^.]+$/, ""), kind: "effect", src, builtin: false, scale: 1, anchor: { x: 0.5, y: 0.5 }, glow: false, hitbox: null };
            state.project.assets.push(asset);
            state.selectedAssetId = asset.id;
        }
        state.imageCache.delete(src);
    });
    switchInspector("asset");
}

async function attachHitbox(file) {
    const asset = currentAsset();
    if (!file || !asset) return;
    try {
        const data = JSON.parse(await file.text());
        if (data.format !== "craftras-hitbox") throw new Error("Craftras 히트박스 파일이 아닙니다.");
        mutate(() => asset.hitbox = { format: data.format, version: data.version, image: { width: data.image?.width, height: data.image?.height, sha256: data.image?.sha256 }, runtime: clone(data.runtime) });
    } catch (error) {
        alert(error.message);
    }
}

function normalizeProject(project) {
    const output = clone(project);
    output.boss ||= {};
    output.boss.ai = { mode: "distance", desiredDistance: 220, detectionRange: 2400, ...(output.boss.ai || {}) };
    output.boss.equipment = { hatAssetId: "none", weaponAssetId: "none", weaponScale: 1, weaponAngle: 0, weaponOffset: 48, ...(output.boss.equipment || {}) };
    output.assets = (output.assets || []).map(asset => ({ scale: 1, anchor: { x: 0.5, y: 0.5 }, glow: false, hitbox: null, ...asset, anchor: { x: 0.5, y: 0.5, ...(asset.anchor || {}) } }));
    output.phases = (output.phases || []).map((phaseItem, phaseIndex) => ({
        id: phaseItem.id || uid("phase"), name: phaseItem.name || `Phase ${phaseIndex + 1}`, trigger: phaseItem.trigger || (phaseIndex ? "healthBelow" : "spawn"),
        healthThreshold: phaseItem.healthThreshold ?? Math.max(0, 100 - phaseIndex * 25), dialogue: phaseItem.dialogue || "", resetHealth: phaseItem.resetHealth || 0,
        color: phaseItem.color || "#ffffff", introInvulnerable: phaseItem.introInvulnerable ?? true,
        skills: (phaseItem.skills || []).map((skillItem, skillIndex) => ({
            id: skillItem.id || uid("skill"), name: skillItem.name || `Skill ${skillIndex + 1}`, duration: Math.max(1, Number(skillItem.duration) || 10000),
            cooldown: Math.max(0, Number(skillItem.cooldown) || 0), weight: Number(skillItem.weight) || 1, range: Number(skillItem.range) || 1200,
            loop: !!skillItem.loop, lockMovement: skillItem.lockMovement ?? true,
            actions: (skillItem.actions || []).filter(item => ACTION_TYPES[item.type]).map(item => ({
                id: item.id || uid("action"), type: item.type, name: item.name || ACTION_TYPES[item.type].label,
                start: Math.max(0, Number(item.start) || 0), duration: Math.max(0, Number(item.duration) || 0), enabled: item.enabled ?? true,
                params: { ...ACTION_TYPES[item.type].defaults, ...(item.params || {}) },
            })),
        })),
    }));
    return output;
}

function buildExport(kind) {
    const output = clone(state.project);
    output.kind = kind;
    output.generatedAt = new Date().toISOString();
    output.runtime = {
        engine: "craftras-boss-runtime",
        actionSchema: 1,
        supportedActions: Object.keys(ACTION_TYPES),
        timeUnit: "milliseconds",
        angleUnit: "degrees",
        coordinateSystem: "boss-local-world-units",
    };
    return output;
}

function validateProject() {
    const errors = [];
    const warnings = [];
    const assetIds = new Set(state.project.assets.map(asset => asset.id));
    if (!state.project.boss.id) errors.push("보스 내부 ID가 비어 있습니다.");
    if (!state.project.boss.name) errors.push("보스 이름이 비어 있습니다.");
    if (!(Number(state.project.boss.health) > 0)) errors.push("보스 체력은 1 이상이어야 합니다.");
    if (!state.project.phases.length) errors.push("페이즈가 하나 이상 필요합니다.");
    const seenPhaseIds = new Set();
    for (const phaseItem of state.project.phases) {
        if (seenPhaseIds.has(phaseItem.id)) errors.push(`중복 페이즈 ID: ${phaseItem.id}`);
        seenPhaseIds.add(phaseItem.id);
        if (!phaseItem.skills?.length) errors.push(`${phaseItem.name}: 스킬이 하나 이상 필요합니다.`);
        for (const skillItem of phaseItem.skills || []) {
            const effects = new Set(skillItem.actions.filter(item => item.type === "magicCircle").map(item => item.params.effectId).filter(Boolean));
            for (const item of skillItem.actions || []) {
                if (item.start < 0 || item.duration < 0) errors.push(`${skillItem.name}/${item.name}: 시간 값이 음수입니다.`);
                if (item.start + item.duration > skillItem.duration) warnings.push(`${skillItem.name}/${item.name}: 행동이 스킬 지속시간을 넘어갑니다.`);
                const assetId = item.params?.assetId;
                if (assetId && assetId !== "none" && !assetIds.has(assetId)) errors.push(`${skillItem.name}/${item.name}: '${assetId}' 에셋을 찾을 수 없습니다.`);
                if (item.params?.source === "effect" && !effects.has(item.params.sourceRef)) errors.push(`${skillItem.name}/${item.name}: '${item.params.sourceRef}' 효과 ID를 찾을 수 없습니다.`);
                if (item.type === "laser") {
                    const startLength = Number(item.params.lengthStart ?? item.params.length);
                    const endLength = Number(item.params.lengthEnd ?? item.params.length);
                    if (!(startLength > 0) || !(endLength > 0) || !(Number(item.params.widthStart) > 0) || !(Number(item.params.widthEnd) > 0)) errors.push(`${skillItem.name}/${item.name}: 레이저 크기는 0보다 커야 합니다.`);
                }
            }
        }
    }
    return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

function exportRuntimeBoss() {
    const report = validateProject();
    if (report.errors.length) {
        alert(`내보내기 전에 수정해야 합니다.\n\n${report.errors.map(value => `- ${value}`).join("\n")}`);
        return;
    }
    if (report.warnings.length && !confirm(`경고가 있습니다. 그래도 내보낼까요?\n\n${report.warnings.map(value => `- ${value}`).join("\n")}`)) return;
    downloadJson(buildExport("runtime-boss"), ".craftras-boss.json");
}

function downloadJson(data, suffix) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeName(state.project.boss.name)}${suffix}`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    state.dirty = false;
    refreshStatus();
}

async function openProject(file) {
    if (!file) return;
    try {
        const data = JSON.parse(await file.text());
        if (data.format !== "craftras-boss" || Number(data.version) !== 1) throw new Error("지원하지 않는 보스 파일입니다.");
        state.project = normalizeProject(data);
        state.phaseIndex = 0;
        state.skillIndex = 0;
        state.selectedActionId = null;
        state.selectedAssetId = null;
        state.history.length = 0;
        state.future.length = 0;
        state.dirty = false;
        resetSimulation();
        refreshAll();
    } catch (error) {
        alert(error.message || "파일을 열 수 없습니다.");
    }
}

function bind(id, getter, setter, type = "value") {
    dom[id].addEventListener("change", () => mutate(() => setter(type === "checked" ? dom[id].checked : dom[id].type === "number" ? Number(dom[id].value) : dom[id].value)));
}

setOptions(dom.bossAiMode, AI_OPTIONS);
setOptions(dom.phaseTrigger, [option("spawn", "스폰 즉시"), option("healthBelow", "체력 이하"), option("time", "시간 경과"), option("event", "이벤트")]);
setOptions(dom.assetKind, [option("hat", "모자"), option("weapon", "무기"), option("projectile", "투사체"), option("magicCircle", "마법진"), option("laser", "레이저"), option("effect", "효과"), option("character", "캐릭터")]);
setOptions(dom.actionTypeSelect, Object.entries(ACTION_TYPES).map(([value, definition]) => option(value, definition.label)));

bind("bossName", () => state.project.boss.name, value => state.project.boss.name = value);
bind("bossId", () => state.project.boss.id, value => state.project.boss.id = safeName(value).toLowerCase());
bind("bossHealth", () => state.project.boss.health, value => state.project.boss.health = Math.max(1, value));
bind("bossSize", () => state.project.boss.size, value => state.project.boss.size = Math.max(1, value));
bind("bossSpeed", () => state.project.boss.speed, value => state.project.boss.speed = Math.max(0, value));
bind("bossColor", () => state.project.boss.color, value => state.project.boss.color = value);
bind("bossAiMode", () => state.project.boss.ai.mode, value => state.project.boss.ai.mode = value);
bind("bossDistance", () => state.project.boss.ai.desiredDistance, value => state.project.boss.ai.desiredDistance = Math.max(0, value));
bind("bossDetection", () => state.project.boss.ai.detectionRange, value => state.project.boss.ai.detectionRange = Math.max(0, value));
bind("bossHatAsset", () => state.project.boss.equipment.hatAssetId, value => state.project.boss.equipment.hatAssetId = value);
bind("bossWeaponAsset", () => state.project.boss.equipment.weaponAssetId, value => state.project.boss.equipment.weaponAssetId = value);
bind("weaponScale", () => state.project.boss.equipment.weaponScale, value => state.project.boss.equipment.weaponScale = Math.max(0.01, value));
bind("weaponAngle", () => state.project.boss.equipment.weaponAngle, value => state.project.boss.equipment.weaponAngle = value);
bind("weaponOffset", () => state.project.boss.equipment.weaponOffset, value => state.project.boss.equipment.weaponOffset = value);

for (const [id, key, transform = value => value] of [
    ["phaseName", "name"], ["phaseTrigger", "trigger"], ["phaseHealthThreshold", "healthThreshold", Number], ["phaseDialogue", "dialogue"], ["phaseHealth", "resetHealth", Number], ["phaseColor", "color"],
]) bind(id, () => currentPhase()?.[key], value => { if (currentPhase()) currentPhase()[key] = transform(value); });
bind("phaseInvulnerable", () => currentPhase()?.introInvulnerable, value => { if (currentPhase()) currentPhase().introInvulnerable = value; }, "checked");

for (const [id, key, transform = value => value] of [
    ["skillName", "name"], ["skillDuration", "duration", value => Math.max(1, Number(value))], ["skillCooldown", "cooldown", value => Math.max(0, Number(value))], ["skillWeight", "weight", Number], ["skillRange", "range", Number],
]) bind(id, () => currentSkill()?.[key], value => { if (currentSkill()) currentSkill()[key] = transform(value); });
bind("skillLoop", () => currentSkill()?.loop, value => { if (currentSkill()) currentSkill().loop = value; }, "checked");
bind("skillLockMovement", () => currentSkill()?.lockMovement, value => { if (currentSkill()) currentSkill().lockMovement = value; }, "checked");

for (const [id, key, transform = value => value] of [
    ["assetName", "name"], ["assetKind", "kind"], ["assetScale", "scale", Number], ["assetAnchorX", "anchor.x", Number], ["assetAnchorY", "anchor.y", Number],
]) bind(id, () => null, value => {
    const asset = currentAsset();
    if (!asset) return;
    if (key.includes(".")) asset.anchor[key.endsWith("x") ? "x" : "y"] = clamp(transform(value), 0, 1);
    else asset[key] = transform(value);
});
bind("assetGlow", () => currentAsset()?.glow, value => { if (currentAsset()) currentAsset().glow = value; }, "checked");

dom.phaseSelect.addEventListener("change", () => { state.phaseIndex = Number(dom.phaseSelect.value); state.skillIndex = 0; state.selectedActionId = null; resetSimulation(); refreshAll(); });
dom.skillSelect.addEventListener("change", () => { state.skillIndex = Number(dom.skillSelect.value); state.selectedActionId = null; resetSimulation(); refreshAll(); });
dom.bossSearch.addEventListener("input", renderBossList);
dom.playButton.addEventListener("click", () => { if (sim.time >= (currentSkill()?.duration || 0)) resetSimulation(); sim.playing = true; });
dom.pauseButton.addEventListener("click", () => sim.playing = false);
dom.stopButton.addEventListener("click", resetSimulation);
dom.stepButton.addEventListener("click", () => { sim.playing = false; seekSimulation(sim.time + 1000 / 60); });
dom.speedSelect.addEventListener("change", () => sim.speed = Number(dom.speedSelect.value) || 1);
dom.showHitboxes.addEventListener("change", drawStage);
dom.addPhaseButton.addEventListener("click", addPhase);
dom.addSkillButton.addEventListener("click", addSkill);
dom.addActionButton.addEventListener("click", addAction);
dom.addBossButton.addEventListener("click", () => loadTemplate(baseProject(uid("boss"), "New Boss", 1000, "#efefef")));
dom.newBossButton.addEventListener("click", () => loadTemplate(baseProject(uid("boss"), "New Boss", 1000, "#efefef")));
dom.deletePhaseButton.addEventListener("click", () => { if (state.project.phases.length <= 1) return alert("페이즈는 최소 하나가 필요합니다."); mutate(() => { state.project.phases.splice(state.phaseIndex, 1); state.phaseIndex = 0; state.skillIndex = 0; }); });
dom.deleteSkillButton.addEventListener("click", () => { if (!currentPhase() || currentPhase().skills.length <= 1) return alert("스킬은 최소 하나가 필요합니다."); mutate(() => { currentPhase().skills.splice(state.skillIndex, 1); state.skillIndex = 0; }); });
dom.duplicateActionButton.addEventListener("click", () => { const item = currentAction(); if (!item) return; mutate(() => { const copyItem = clone(item); copyItem.id = uid("action"); copyItem.name += " Copy"; copyItem.start += 200; currentSkill().actions.push(copyItem); state.selectedActionId = copyItem.id; }); });
dom.deleteActionButton.addEventListener("click", () => { const item = currentAction(); if (!item) return; mutate(() => { currentSkill().actions = currentSkill().actions.filter(entry => entry.id !== item.id); state.selectedActionId = null; }); });
dom.addAssetButton.addEventListener("click", () => { dom.assetImageInput.dataset.mode = "add"; dom.assetImageInput.click(); });
dom.replaceAssetImageButton.addEventListener("click", () => { dom.assetImageInput.dataset.mode = "replace"; dom.assetImageInput.click(); });
dom.assetImageInput.addEventListener("change", async () => { await importAssetImage(dom.assetImageInput.files?.[0], dom.assetImageInput.dataset.mode === "replace"); dom.assetImageInput.value = ""; });
dom.attachHitboxButton.addEventListener("click", () => dom.hitboxInput.click());
dom.hitboxInput.addEventListener("change", async () => { await attachHitbox(dom.hitboxInput.files?.[0]); dom.hitboxInput.value = ""; });
dom.deleteAssetButton.addEventListener("click", () => { const asset = currentAsset(); if (!asset) return; mutate(() => { state.project.assets = state.project.assets.filter(entry => entry.id !== asset.id); state.selectedAssetId = null; }); });
dom.openProjectButton.addEventListener("click", () => dom.projectInput.click());
dom.projectInput.addEventListener("change", async () => { await openProject(dom.projectInput.files?.[0]); dom.projectInput.value = ""; });
dom.saveProjectButton.addEventListener("click", () => downloadJson(buildExport("editor-project"), ".craftras-boss-project.json"));
dom.exportBossButton.addEventListener("click", exportRuntimeBoss);
dom.undoButton.addEventListener("click", undo);
dom.redoButton.addEventListener("click", redo);
document.querySelectorAll("[data-inspector]").forEach(button => button.addEventListener("click", () => switchInspector(button.dataset.inspector)));
document.querySelectorAll("[data-timeline-view]").forEach(button => button.addEventListener("click", () => {
    state.timelineView = button.dataset.timelineView;
    document.querySelectorAll("[data-timeline-view]").forEach(entry => entry.classList.toggle("active", entry === button));
    renderTimeline();
}));
window.addEventListener("keydown", event => {
    const input = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
    else if (!input && event.code === "Space") { event.preventDefault(); sim.playing = !sim.playing; }
    else if (!input && event.key === "Delete" && currentAction()) dom.deleteActionButton.click();
});
window.addEventListener("beforeunload", event => { if (state.dirty) { event.preventDefault(); event.returnValue = ""; } });

new ResizeObserver(resizeCanvas).observe(dom.stage);
refreshAll();
resizeCanvas();
requestAnimationFrame(animationFrame);
