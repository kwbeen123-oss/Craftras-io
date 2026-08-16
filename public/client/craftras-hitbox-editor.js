const $ = id => document.getElementById(id);

const dom = {
    canvas: $("editorCanvas"),
    workspace: $("workspace"),
    emptyState: $("emptyState"),
    canvasHint: $("canvasHint"),
    documentName: $("documentName"),
    imageInput: $("imageInput"),
    projectInput: $("projectInput"),
    openImageButton: $("openImageButton"),
    emptyOpenButton: $("emptyOpenButton"),
    openProjectButton: $("openProjectButton"),
    saveProjectButton: $("saveProjectButton"),
    exportButton: $("exportButton"),
    undoButton: $("undoButton"),
    redoButton: $("redoButton"),
    fitButton: $("fitButton"),
    addRegularButton: $("addRegularButton"),
    duplicateButton: $("duplicateButton"),
    deletePolygonButton: $("deletePolygonButton"),
    layerList: $("layerList"),
    polygonName: $("polygonName"),
    vertexCount: $("vertexCount"),
    regenerateButton: $("regenerateButton"),
    rotationInput: $("rotationInput"),
    scaleInput: $("scaleInput"),
    vertexX: $("vertexX"),
    vertexY: $("vertexY"),
    anchorX: $("anchorX"),
    anchorY: $("anchorY"),
    anchorCenterButton: $("anchorCenterButton"),
    traceVertices: $("traceVertices"),
    alphaThreshold: $("alphaThreshold"),
    traceButton: $("traceButton"),
    polygonColor: $("polygonColor"),
    fillOpacity: $("fillOpacity"),
    imageOpacity: $("imageOpacity"),
    showGrid: $("showGrid"),
    snapGrid: $("snapGrid"),
    showIndices: $("showIndices"),
    showBounds: $("showBounds"),
    gridSize: $("gridSize"),
    embedImage: $("embedImage"),
    previewButton: $("previewButton"),
    imageStatus: $("imageStatus"),
    cursorStatus: $("cursorStatus"),
    selectionStatus: $("selectionStatus"),
    zoomStatus: $("zoomStatus"),
    zoomInButton: $("zoomInButton"),
    zoomOutButton: $("zoomOutButton"),
};

const ctx = dom.canvas.getContext("2d", { alpha: true });
const state = {
    image: null,
    imageDataUrl: null,
    imageName: "",
    imageMime: "",
    imageWidth: 0,
    imageHeight: 0,
    polygons: [],
    selectedId: null,
    selectedVertex: -1,
    draft: null,
    tool: "select",
    view: { zoom: 1, panX: 0, panY: 0 },
    interaction: null,
    history: [],
    future: [],
    idCounter: 1,
    spaceDown: false,
    imageOpacity: 1,
    showGrid: true,
    snapGrid: false,
    showIndices: true,
    showBounds: false,
    gridSize: 8,
    anchor: { x: 0.5, y: 0.5 },
    dirty: false,
};

const palette = ["#2ed6b7", "#4aa8ff", "#f4c84a", "#ff6b7b", "#cf72ff", "#ff963d"];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value, digits = 3) => Number(Number(value).toFixed(digits));
const selectedPolygon = () => state.polygons.find(polygon => polygon.id === state.selectedId) || null;
const clonePolygons = polygons => polygons.map(polygon => ({
    ...polygon,
    vertices: polygon.vertices.map(vertex => ({ ...vertex })),
}));

function snapshot() {
    return {
        polygons: clonePolygons(state.polygons),
        selectedId: state.selectedId,
        selectedVertex: state.selectedVertex,
        idCounter: state.idCounter,
    };
}

function restoreSnapshot(value) {
    state.polygons = clonePolygons(value.polygons || []);
    state.selectedId = value.selectedId || null;
    state.selectedVertex = Number.isInteger(value.selectedVertex) ? value.selectedVertex : -1;
    state.idCounter = Math.max(1, Number(value.idCounter) || 1);
    state.draft = null;
    state.interaction = null;
    markDirty(true);
    refreshUi();
}

function recordHistory() {
    state.history.push(snapshot());
    if (state.history.length > 100) state.history.shift();
    state.future.length = 0;
    updateHistoryButtons();
}

function undo() {
    if (!state.history.length) return;
    state.future.push(snapshot());
    restoreSnapshot(state.history.pop());
    updateHistoryButtons();
}

function redo() {
    if (!state.future.length) return;
    state.history.push(snapshot());
    restoreSnapshot(state.future.pop());
    updateHistoryButtons();
}

function updateHistoryButtons() {
    dom.undoButton.disabled = state.history.length === 0;
    dom.redoButton.disabled = state.future.length === 0;
}

function markDirty(value = true) {
    state.dirty = value;
    const base = state.imageName ? state.imageName.replace(/\.[^.]+$/, "") : "새 히트박스 프로젝트";
    dom.documentName.textContent = `${base}${state.dirty ? " *" : ""}`;
}

function notify(message, duration = 2600) {
    dom.canvasHint.textContent = message;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(updateCanvasHint, duration);
}

function updateCanvasHint() {
    const hints = {
        select: "꼭짓점을 드래그하거나 다각형 내부를 드래그하세요.",
        polygon: "점을 차례로 찍고 Enter 또는 더블클릭으로 닫으세요.",
        addVertex: "선택한 다각형의 변을 클릭해 꼭짓점을 추가하세요.",
        deleteVertex: "삭제할 꼭짓점을 클릭하세요. 최소 3개는 유지됩니다.",
        pan: "캔버스를 드래그해 화면을 이동하세요.",
    };
    dom.canvasHint.textContent = hints[state.tool];
}

function resizeCanvas() {
    const rect = dom.canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (dom.canvas.width !== width || dom.canvas.height !== height) {
        dom.canvas.width = width;
        dom.canvas.height = height;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
}

function canvasSize() {
    const rect = dom.canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
}

function imageToScreen(point) {
    const size = canvasSize();
    return {
        x: size.width / 2 + state.view.panX + (point.x - state.imageWidth / 2) * state.view.zoom,
        y: size.height / 2 + state.view.panY + (point.y - state.imageHeight / 2) * state.view.zoom,
    };
}

function screenToImage(point) {
    const size = canvasSize();
    return {
        x: (point.x - size.width / 2 - state.view.panX) / state.view.zoom + state.imageWidth / 2,
        y: (point.y - size.height / 2 - state.view.panY) / state.view.zoom + state.imageHeight / 2,
    };
}

function eventPoint(event) {
    const rect = dom.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function snapPoint(point) {
    if (!state.snapGrid) return point;
    const grid = Math.max(1, state.gridSize);
    return {
        x: Math.round(point.x / grid) * grid,
        y: Math.round(point.y / grid) * grid,
    };
}

function clampPoint(point) {
    return {
        x: clamp(point.x, 0, state.imageWidth),
        y: clamp(point.y, 0, state.imageHeight),
    };
}

function rgba(hex, alpha) {
    const normalized = String(hex || "#2ed6b7").replace("#", "");
    const value = normalized.length === 3
        ? normalized.split("").map(char => char + char).join("")
        : normalized.padEnd(6, "0").slice(0, 6);
    const number = Number.parseInt(value, 16);
    return `rgba(${number >> 16}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
}

function drawGrid() {
    if (!state.showGrid || !state.image) return;
    const grid = Math.max(1, state.gridSize);
    const minimumScreenGap = 10;
    const step = grid * Math.max(1, Math.ceil(minimumScreenGap / Math.max(0.001, grid * state.view.zoom)));
    const topLeft = imageToScreen({ x: 0, y: 0 });
    const bottomRight = imageToScreen({ x: state.imageWidth, y: state.imageHeight });
    ctx.save();
    ctx.beginPath();
    ctx.rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    ctx.clip();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(190, 210, 216, 0.12)";
    ctx.beginPath();
    for (let x = 0; x <= state.imageWidth; x += step) {
        const screen = imageToScreen({ x, y: 0 });
        ctx.moveTo(Math.round(screen.x) + 0.5, topLeft.y);
        ctx.lineTo(Math.round(screen.x) + 0.5, bottomRight.y);
    }
    for (let y = 0; y <= state.imageHeight; y += step) {
        const screen = imageToScreen({ x: 0, y });
        ctx.moveTo(topLeft.x, Math.round(screen.y) + 0.5);
        ctx.lineTo(bottomRight.x, Math.round(screen.y) + 0.5);
    }
    ctx.stroke();
    ctx.restore();
}

function polygonBounds(polygon) {
    const xs = polygon.vertices.map(vertex => vertex.x);
    const ys = polygon.vertices.map(vertex => vertex.y);
    return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
    };
}

function polygonCentroid(polygon) {
    if (!polygon?.vertices?.length) return { x: state.imageWidth / 2, y: state.imageHeight / 2 };
    return polygon.vertices.reduce((sum, vertex) => ({ x: sum.x + vertex.x, y: sum.y + vertex.y }), { x: 0, y: 0 });
}

function averagePoint(polygon) {
    const sum = polygonCentroid(polygon);
    return { x: sum.x / polygon.vertices.length, y: sum.y / polygon.vertices.length };
}

function drawPolygon(polygon, selected = false) {
    if (!polygon.visible || polygon.vertices.length < 2) return;
    const points = polygon.vertices.map(imageToScreen);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index++) ctx.lineTo(points[index].x, points[index].y);
    ctx.closePath();
    ctx.fillStyle = rgba(polygon.color, polygon.fillOpacity);
    ctx.fill();
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeStyle = selected ? polygon.color : rgba(polygon.color, 0.75);
    ctx.shadowColor = selected ? polygon.color : "transparent";
    ctx.shadowBlur = selected ? 7 : 0;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (state.showBounds && selected) {
        const bounds = polygonBounds(polygon);
        const a = imageToScreen({ x: bounds.minX, y: bounds.minY });
        const b = imageToScreen({ x: bounds.maxX, y: bounds.maxY });
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(244, 200, 74, 0.85)";
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
        ctx.setLineDash([]);
    }

    for (let index = 0; index < points.length; index++) {
        const point = points[index];
        const active = selected && state.selectedVertex === index;
        ctx.beginPath();
        ctx.arc(point.x, point.y, active ? 6.5 : selected ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = active ? "#ffffff" : polygon.color;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = active ? polygon.color : "#101417";
        ctx.stroke();
        if (selected && state.showIndices) {
            ctx.font = "10px Segoe UI";
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
            ctx.lineWidth = 3;
            ctx.strokeText(String(index + 1), point.x + 7, point.y - 5);
            ctx.fillText(String(index + 1), point.x + 7, point.y - 5);
        }
    }
    ctx.restore();
}

function drawDraft() {
    if (!state.draft?.length) return;
    const points = state.draft.map(imageToScreen);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index++) ctx.lineTo(points[index].x, points[index].y);
    ctx.strokeStyle = "#f4c84a";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const point of points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#f4c84a";
        ctx.fill();
    }
    ctx.restore();
}

function draw() {
    const size = canvasSize();
    ctx.clearRect(0, 0, size.width, size.height);
    if (!state.image) return;
    const topLeft = imageToScreen({ x: 0, y: 0 });
    const displayWidth = state.imageWidth * state.view.zoom;
    const displayHeight = state.imageHeight * state.view.zoom;
    ctx.save();
    ctx.globalAlpha = state.imageOpacity;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(state.image, topLeft.x, topLeft.y, displayWidth, displayHeight);
    ctx.restore();
    drawGrid();
    ctx.save();
    ctx.strokeStyle = "rgba(238, 246, 248, 0.72)";
    ctx.lineWidth = 1;
    ctx.strokeRect(topLeft.x - 0.5, topLeft.y - 0.5, displayWidth + 1, displayHeight + 1);
    ctx.restore();
    for (const polygon of state.polygons) drawPolygon(polygon, polygon.id === state.selectedId);
    drawDraft();
    const anchor = imageToScreen({ x: state.imageWidth * state.anchor.x, y: state.imageHeight * state.anchor.y });
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fillStyle = "rgba(16, 20, 23, 0.78)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(anchor.x - 11, anchor.y);
    ctx.lineTo(anchor.x + 11, anchor.y);
    ctx.moveTo(anchor.x, anchor.y - 11);
    ctx.lineTo(anchor.x, anchor.y + 11);
    ctx.stroke();
    ctx.restore();
}

function fitToScreen() {
    if (!state.image) return;
    const size = canvasSize();
    state.view.zoom = clamp(Math.min((size.width - 70) / state.imageWidth, (size.height - 70) / state.imageHeight), 0.02, 50);
    state.view.panX = 0;
    state.view.panY = 0;
    refreshStatus();
    draw();
}

function zoomAt(factor, screenPoint = null) {
    if (!state.image) return;
    const size = canvasSize();
    const anchor = screenPoint || { x: size.width / 2, y: size.height / 2 };
    const before = screenToImage(anchor);
    state.view.zoom = clamp(state.view.zoom * factor, 0.02, 80);
    const after = imageToScreen(before);
    state.view.panX += anchor.x - after.x;
    state.view.panY += anchor.y - after.y;
    refreshStatus();
    draw();
}

function pointInPolygon(point, polygon) {
    let inside = false;
    const vertices = polygon.vertices;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const a = vertices[i];
        const b = vertices[j];
        const crosses = (a.y > point.y) !== (b.y > point.y)
            && point.x < (b.x - a.x) * (point.y - a.y) / ((b.y - a.y) || 1e-9) + a.x;
        if (crosses) inside = !inside;
    }
    return inside;
}

function distanceToSegment(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared ? clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1) : 0;
    const projected = { x: start.x + dx * t, y: start.y + dy * t };
    return { distance: Math.hypot(point.x - projected.x, point.y - projected.y), point: projected, t };
}

function findVertex(point) {
    const threshold = 11 / state.view.zoom;
    for (let layer = state.polygons.length - 1; layer >= 0; layer--) {
        const polygon = state.polygons[layer];
        if (!polygon.visible || polygon.locked) continue;
        for (let index = 0; index < polygon.vertices.length; index++) {
            if (Math.hypot(point.x - polygon.vertices[index].x, point.y - polygon.vertices[index].y) <= threshold) {
                return { polygon, index };
            }
        }
    }
    return null;
}

function findPolygon(point) {
    for (let index = state.polygons.length - 1; index >= 0; index--) {
        const polygon = state.polygons[index];
        if (polygon.visible && !polygon.locked && pointInPolygon(point, polygon)) return polygon;
    }
    return null;
}

function findClosestEdge(polygon, point) {
    let best = null;
    for (let index = 0; index < polygon.vertices.length; index++) {
        const next = (index + 1) % polygon.vertices.length;
        const result = distanceToSegment(point, polygon.vertices[index], polygon.vertices[next]);
        if (!best || result.distance < best.distance) best = { ...result, index };
    }
    return best;
}

function regularVertices(count, center, radius, rotationDegrees = -90) {
    const rotation = rotationDegrees * Math.PI / 180;
    return Array.from({ length: count }, (_, index) => ({
        x: center.x + Math.cos(rotation + index * Math.PI * 2 / count) * radius,
        y: center.y + Math.sin(rotation + index * Math.PI * 2 / count) * radius,
    }));
}

function createPolygon(vertices, options = {}) {
    const polygon = {
        id: `hitbox-${state.idCounter++}`,
        name: options.name || `Hitbox ${state.polygons.length + 1}`,
        vertices: vertices.map(vertex => clampPoint(vertex)),
        color: options.color || palette[state.polygons.length % palette.length],
        fillOpacity: Number.isFinite(options.fillOpacity) ? options.fillOpacity : 0.22,
        visible: options.visible !== false,
        locked: !!options.locked,
        rotation: Number(options.rotation) || 0,
        scalePercent: Number(options.scalePercent) || 100,
    };
    state.polygons.push(polygon);
    state.selectedId = polygon.id;
    state.selectedVertex = -1;
    markDirty(true);
    refreshUi();
    return polygon;
}

function addRegularPolygon(count = 4) {
    if (!state.image) return notify("먼저 이미지를 열어주세요.");
    recordHistory();
    const center = { x: state.imageWidth / 2, y: state.imageHeight / 2 };
    const radius = Math.min(state.imageWidth, state.imageHeight) * 0.28;
    createPolygon(regularVertices(clamp(Math.round(count), 3, 64), center, radius));
}

function regenerateSelected(count) {
    const polygon = selectedPolygon();
    if (!polygon) return;
    recordHistory();
    const center = averagePoint(polygon);
    const radius = Math.max(2, polygon.vertices.reduce((sum, vertex) => sum + Math.hypot(vertex.x - center.x, vertex.y - center.y), 0) / polygon.vertices.length);
    polygon.vertices = regularVertices(clamp(Math.round(count), 3, 64), center, radius, polygon.rotation - 90).map(clampPoint);
    polygon.scalePercent = 100;
    state.selectedVertex = -1;
    markDirty(true);
    refreshUi();
}

function duplicateSelected() {
    const polygon = selectedPolygon();
    if (!polygon) return;
    recordHistory();
    const offset = Math.max(4, state.gridSize);
    createPolygon(polygon.vertices.map(vertex => ({ x: vertex.x + offset, y: vertex.y + offset })), {
        ...polygon,
        name: `${polygon.name} Copy`,
    });
}

function deleteSelectedPolygon() {
    const index = state.polygons.findIndex(polygon => polygon.id === state.selectedId);
    if (index < 0) return;
    recordHistory();
    state.polygons.splice(index, 1);
    state.selectedId = state.polygons[Math.min(index, state.polygons.length - 1)]?.id || null;
    state.selectedVertex = -1;
    markDirty(true);
    refreshUi();
}

function finalizeDraft() {
    if (!state.draft) return;
    if (state.draft.length < 3) {
        state.draft = null;
        draw();
        return notify("다각형에는 최소 3개의 점이 필요합니다.");
    }
    recordHistory();
    const vertices = state.draft;
    state.draft = null;
    createPolygon(vertices);
    setTool("select");
}

function setTool(tool) {
    if (state.draft && tool !== "polygon") finalizeDraft();
    state.tool = tool;
    document.querySelectorAll(".tool[data-tool]").forEach(button => button.classList.toggle("active", button.dataset.tool === tool));
    const cursors = { select: "default", polygon: "crosshair", addVertex: "copy", deleteVertex: "not-allowed", pan: "grab" };
    dom.canvas.style.cursor = cursors[tool] || "default";
    updateCanvasHint();
}

function transformSelected(rotationDegrees = null, scalePercent = null) {
    const polygon = selectedPolygon();
    if (!polygon) return;
    const center = averagePoint(polygon);
    if (rotationDegrees != null) {
        const next = Number(rotationDegrees) || 0;
        const delta = (next - (polygon.rotation || 0)) * Math.PI / 180;
        const cosine = Math.cos(delta);
        const sine = Math.sin(delta);
        polygon.vertices = polygon.vertices.map(vertex => {
            const x = vertex.x - center.x;
            const y = vertex.y - center.y;
            return clampPoint({ x: center.x + x * cosine - y * sine, y: center.y + x * sine + y * cosine });
        });
        polygon.rotation = next;
    }
    if (scalePercent != null) {
        const next = clamp(Number(scalePercent) || 1, 1, 1000);
        const ratio = next / Math.max(1, polygon.scalePercent || 100);
        polygon.vertices = polygon.vertices.map(vertex => clampPoint({
            x: center.x + (vertex.x - center.x) * ratio,
            y: center.y + (vertex.y - center.y) * ratio,
        }));
        polygon.scalePercent = next;
    }
    markDirty(true);
    refreshUi();
}

async function loadImageData(dataUrl, name = "image.png", mime = "image/png", preserveScale = true) {
    const image = new Image();
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
        image.src = dataUrl;
    });
    const previousWidth = state.imageWidth;
    const previousHeight = state.imageHeight;
    if (preserveScale && previousWidth && previousHeight && state.polygons.length) {
        const sx = image.naturalWidth / previousWidth;
        const sy = image.naturalHeight / previousHeight;
        state.polygons.forEach(polygon => polygon.vertices.forEach(vertex => {
            vertex.x *= sx;
            vertex.y *= sy;
        }));
    }
    state.image = image;
    state.imageDataUrl = dataUrl;
    state.imageName = name;
    state.imageMime = mime || dataUrl.match(/^data:([^;]+)/)?.[1] || "image/png";
    state.imageWidth = image.naturalWidth;
    state.imageHeight = image.naturalHeight;
    dom.emptyState.classList.add("hidden");
    markDirty(true);
    fitToScreen();
    refreshUi();
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error("파일 읽기 실패"));
        reader.readAsDataURL(file);
    });
}

async function openImage(file) {
    if (!file) return;
    try {
        const dataUrl = await readFileAsDataUrl(file);
        recordHistory();
        await loadImageData(dataUrl, file.name, file.type, true);
        notify(`${file.name} 이미지를 불러왔습니다.`);
    } catch (error) {
        notify(error.message || "이미지 불러오기에 실패했습니다.");
    }
}

function polygonArea(vertices) {
    let area = 0;
    for (let index = 0; index < vertices.length; index++) {
        const next = (index + 1) % vertices.length;
        area += vertices[index].x * vertices[next].y - vertices[next].x * vertices[index].y;
    }
    return area / 2;
}

async function imageSha256() {
    if (!state.imageDataUrl || !crypto?.subtle) return null;
    const base64 = state.imageDataUrl.split(",")[1] || "";
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function buildExport(project = false) {
    const width = state.imageWidth || 1;
    const height = state.imageHeight || 1;
    const hitboxes = state.polygons.map((polygon, layer) => {
        const bounds = polygonBounds(polygon);
        const area = polygonArea(polygon.vertices);
        return {
            id: polygon.id,
            name: polygon.name,
            layer,
            enabled: polygon.visible,
            color: polygon.color,
            vertices: polygon.vertices.map((vertex, index) => ({
                index,
                x: round(vertex.x),
                y: round(vertex.y),
                centerUnitX: round(vertex.x / width - 0.5, 7),
                centerUnitY: round(vertex.y / height - 0.5, 7),
                anchorUnitX: round(vertex.x / width - state.anchor.x, 7),
                anchorUnitY: round(vertex.y / height - state.anchor.y, 7),
                bipolarX: round((vertex.x - width / 2) / (width / 2), 7),
                bipolarY: round((vertex.y - height / 2) / (height / 2), 7),
            })),
            bounds: {
                x: round(bounds.minX),
                y: round(bounds.minY),
                width: round(bounds.maxX - bounds.minX),
                height: round(bounds.maxY - bounds.minY),
            },
            signedArea: round(area),
            winding: area >= 0 ? "clockwise-screen-space" : "counter-clockwise-screen-space",
        };
    });
    const data = {
        format: "craftras-hitbox",
        version: 1,
        kind: project ? "editor-project" : "runtime-hitbox",
        generatedAt: new Date().toISOString(),
        image: {
            name: state.imageName,
            mimeType: state.imageMime,
            width: state.imageWidth,
            height: state.imageHeight,
            sha256: await imageSha256(),
            dataUrl: project || dom.embedImage.checked ? state.imageDataUrl : null,
        },
        coordinateSystem: {
            pixelOrigin: "top-left",
            pixelXAxis: "right",
            pixelYAxis: "down",
            centerUnitOrigin: "image-center",
            centerUnitRange: "-0.5..0.5",
            bipolarOrigin: "image-center",
            bipolarRange: "-1..1",
            anchorUnitFormula: "worldX=anchorUnitX*renderWidth; worldY=anchorUnitY*renderHeight",
        },
        hitboxes,
        runtime: {
            anchor: { x: round(state.anchor.x, 7), y: round(state.anchor.y, 7) },
            polygons: hitboxes.filter(hitbox => hitbox.enabled).map(hitbox => ({
                id: hitbox.id,
                name: hitbox.name,
                points: hitbox.vertices.map(vertex => [vertex.anchorUnitX, vertex.anchorUnitY]),
            })),
        },
    };
    if (project) {
        data.editor = {
            polygons: clonePolygons(state.polygons),
            selectedId: state.selectedId,
            selectedVertex: state.selectedVertex,
            idCounter: state.idCounter,
            view: { ...state.view },
            options: {
                imageOpacity: state.imageOpacity,
                showGrid: state.showGrid,
                snapGrid: state.snapGrid,
                showIndices: state.showIndices,
                showBounds: state.showBounds,
                gridSize: state.gridSize,
                anchor: { ...state.anchor },
            },
        };
    }
    return data;
}

function safeBaseName() {
    return (state.imageName || "craftras-image")
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9가-힣_-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "craftras-image";
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportJson(project = false) {
    if (!state.image) return notify("먼저 이미지를 열어주세요.");
    if (!state.polygons.length) return notify("내보낼 히트박스를 하나 이상 만들어주세요.");
    try {
        const data = await buildExport(project);
        const suffix = project ? ".hitbox-project.json" : ".craftras-hitbox.json";
        downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `${safeBaseName()}${suffix}`);
        markDirty(false);
        notify(project ? "편집 프로젝트를 저장했습니다." : "Craftras 히트박스 파일을 내보냈습니다.");
    } catch (error) {
        notify(error.message || "파일 생성에 실패했습니다.");
    }
}

async function openProject(file) {
    if (!file) return;
    try {
        let data = JSON.parse(await file.text());
        let itemProject = null;
        if (data.format === "craftras-item" && Number(data.version) === 1) {
            itemProject = data;
            data = data.hitbox;
        }
        if (data.format !== "craftras-hitbox" || Number(data.version) !== 1) throw new Error("지원하지 않는 히트박스 파일입니다.");
        const editorPolygons = data.editor?.polygons;
        const runtimePolygons = (data.hitboxes || []).map(hitbox => ({
            id: hitbox.id,
            name: hitbox.name,
            color: hitbox.color || palette[0],
            fillOpacity: 0.22,
            visible: hitbox.enabled !== false,
            locked: false,
            rotation: 0,
            scalePercent: 100,
            vertices: (hitbox.vertices || []).map(vertex => ({ x: Number(vertex.x), y: Number(vertex.y) })),
        }));
        state.polygons = clonePolygons(editorPolygons?.length ? editorPolygons : runtimePolygons);
        state.selectedId = data.editor?.selectedId || state.polygons[0]?.id || null;
        state.selectedVertex = Number.isInteger(data.editor?.selectedVertex) ? data.editor.selectedVertex : -1;
        state.idCounter = Math.max(Number(data.editor?.idCounter) || 1, state.polygons.length + 1);
        state.history.length = 0;
        state.future.length = 0;
        const options = data.editor?.options || {};
        Object.assign(state, {
            imageOpacity: Number(options.imageOpacity) || 1,
            showGrid: options.showGrid !== false,
            snapGrid: !!options.snapGrid,
            showIndices: options.showIndices !== false,
            showBounds: !!options.showBounds,
            gridSize: Math.max(1, Number(options.gridSize) || 8),
        });
        const anchor = options.anchor || data.runtime?.anchor;
        state.anchor = {
            x: clamp(Number(anchor?.x ?? 0.5), 0, 1),
            y: clamp(Number(anchor?.y ?? 0.5), 0, 1),
        };
        if (data.image?.dataUrl) {
            await loadImageData(data.image.dataUrl, data.image.name || "embedded-image.png", data.image.mimeType, false);
        } else {
            state.imageWidth = Number(data.image?.width) || 0;
            state.imageHeight = Number(data.image?.height) || 0;
            state.imageName = data.image?.name || "missing-image";
            notify("히트박스는 불러왔습니다. 원본 이미지를 다시 열어주세요.", 4200);
        }
        if (data.editor?.view) state.view = { ...state.view, ...data.editor.view };
        markDirty(false);
        refreshUi();
        if (itemProject) window.dispatchEvent(new CustomEvent("craftras-item-load", { detail: itemProject }));
    } catch (error) {
        notify(error.message || "프로젝트를 열 수 없습니다.", 4200);
    }
}

function savePreview() {
    if (!state.image || !state.polygons.length) return notify("이미지와 히트박스가 필요합니다.");
    const canvas = document.createElement("canvas");
    canvas.width = state.imageWidth;
    canvas.height = state.imageHeight;
    const context = canvas.getContext("2d");
    context.drawImage(state.image, 0, 0);
    for (const polygon of state.polygons) {
        if (!polygon.visible || polygon.vertices.length < 3) continue;
        context.beginPath();
        context.moveTo(polygon.vertices[0].x, polygon.vertices[0].y);
        polygon.vertices.slice(1).forEach(vertex => context.lineTo(vertex.x, vertex.y));
        context.closePath();
        context.fillStyle = rgba(polygon.color, Math.max(0.24, polygon.fillOpacity));
        context.fill();
        context.strokeStyle = polygon.color;
        context.lineWidth = Math.max(1, Math.min(state.imageWidth, state.imageHeight) / 256 * 2);
        context.stroke();
    }
    canvas.toBlob(blob => blob && downloadBlob(blob, `${safeBaseName()}.hitbox-preview.png`), "image/png");
}

function traceAlpha() {
    if (!state.image) return notify("먼저 투명 배경 이미지를 열어주세요.");
    const sampleCount = clamp(Math.round(Number(dom.traceVertices.value) || 16), 4, 64);
    const threshold = clamp(Math.round(Number(dom.alphaThreshold.value) || 24), 1, 255);
    const canvas = document.createElement("canvas");
    canvas.width = state.imageWidth;
    canvas.height = state.imageHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(state.image, 0, 0);
    let pixels;
    try {
        pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    } catch {
        return notify("이미지 픽셀을 읽을 수 없습니다.");
    }
    const stride = Math.max(1, Math.ceil(Math.sqrt(canvas.width * canvas.height / 800000)));
    let weight = 0;
    let centerX = 0;
    let centerY = 0;
    for (let y = 0; y < canvas.height; y += stride) for (let x = 0; x < canvas.width; x += stride) {
        const alpha = pixels[(y * canvas.width + x) * 4 + 3];
        if (alpha < threshold) continue;
        weight++;
        centerX += x;
        centerY += y;
    }
    if (!weight) return notify("설정한 알파 기준보다 진한 픽셀이 없습니다.");
    const center = { x: centerX / weight, y: centerY / weight };
    const maximumRadius = Math.hypot(canvas.width, canvas.height);
    const vertices = [];
    for (let index = 0; index < sampleCount; index++) {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / sampleCount;
        let last = null;
        for (let radius = 0; radius <= maximumRadius; radius += 0.75) {
            const x = Math.round(center.x + Math.cos(angle) * radius);
            const y = Math.round(center.y + Math.sin(angle) * radius);
            if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) break;
            if (pixels[(y * canvas.width + x) * 4 + 3] >= threshold) last = { x, y };
        }
        vertices.push(last || center);
    }
    recordHistory();
    createPolygon(vertices, { name: `Auto Trace ${state.polygons.length + 1}` });
    notify(`${sampleCount}개 꼭짓점으로 외곽선을 생성했습니다.`);
}

function refreshLayers() {
    dom.layerList.replaceChildren();
    if (!state.polygons.length) {
        const empty = document.createElement("div");
        empty.className = "layer-empty";
        empty.textContent = "히트박스가 없습니다.";
        dom.layerList.append(empty);
        return;
    }
    [...state.polygons].reverse().forEach(polygon => {
        const item = document.createElement("div");
        item.className = `layer-item${polygon.id === state.selectedId ? " selected" : ""}`;
        item.draggable = true;
        item.dataset.id = polygon.id;
        const color = document.createElement("span");
        color.className = "layer-color";
        color.style.background = polygon.color;
        const name = document.createElement("span");
        name.className = "layer-name";
        name.textContent = `${polygon.name} · ${polygon.vertices.length}`;
        const visible = document.createElement("button");
        visible.type = "button";
        visible.className = `layer-toggle${polygon.visible ? "" : " off"}`;
        visible.textContent = polygon.visible ? "◉" : "○";
        visible.title = polygon.visible ? "숨기기" : "표시";
        visible.addEventListener("click", event => {
            event.stopPropagation();
            recordHistory();
            polygon.visible = !polygon.visible;
            markDirty(true);
            refreshUi();
        });
        const locked = document.createElement("button");
        locked.type = "button";
        locked.className = `layer-toggle${polygon.locked ? "" : " off"}`;
        locked.textContent = "L";
        locked.title = polygon.locked ? "잠금 해제" : "잠금";
        locked.addEventListener("click", event => {
            event.stopPropagation();
            recordHistory();
            polygon.locked = !polygon.locked;
            markDirty(true);
            refreshUi();
        });
        item.append(color, name, visible, locked);
        item.addEventListener("click", () => {
            state.selectedId = polygon.id;
            state.selectedVertex = -1;
            refreshUi();
        });
        item.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", polygon.id));
        item.addEventListener("dragover", event => event.preventDefault());
        item.addEventListener("drop", event => {
            event.preventDefault();
            const sourceId = event.dataTransfer.getData("text/plain");
            if (!sourceId || sourceId === polygon.id) return;
            recordHistory();
            const sourceIndex = state.polygons.findIndex(entry => entry.id === sourceId);
            let targetIndex = state.polygons.findIndex(entry => entry.id === polygon.id);
            const [source] = state.polygons.splice(sourceIndex, 1);
            if (sourceIndex < targetIndex) targetIndex--;
            state.polygons.splice(targetIndex, 0, source);
            markDirty(true);
            refreshUi();
        });
        dom.layerList.append(item);
    });
}

function refreshInspector() {
    const polygon = selectedPolygon();
    const disabled = !polygon;
    [dom.polygonName, dom.vertexCount, dom.regenerateButton, dom.rotationInput, dom.scaleInput,
        dom.polygonColor, dom.fillOpacity, dom.duplicateButton, dom.deletePolygonButton].forEach(element => element.disabled = disabled);
    if (!polygon) {
        dom.polygonName.value = "";
        dom.vertexCount.value ||= "4";
        dom.vertexX.value = "";
        dom.vertexY.value = "";
        dom.vertexX.disabled = true;
        dom.vertexY.disabled = true;
        dom.vertexCount.disabled = false;
        return;
    }
    dom.polygonName.value = polygon.name;
    dom.vertexCount.value = polygon.vertices.length;
    dom.rotationInput.value = round(polygon.rotation || 0, 2);
    dom.scaleInput.value = round(polygon.scalePercent || 100, 2);
    dom.polygonColor.value = polygon.color;
    dom.fillOpacity.value = Math.round(polygon.fillOpacity * 100);
    const vertex = polygon.vertices[state.selectedVertex];
    dom.vertexX.disabled = !vertex;
    dom.vertexY.disabled = !vertex;
    dom.vertexX.value = vertex ? round(vertex.x, 2) : "";
    dom.vertexY.value = vertex ? round(vertex.y, 2) : "";
}

function refreshStatus() {
    dom.imageStatus.textContent = state.image ? `${state.imageName} · ${state.imageWidth}×${state.imageHeight}` : "이미지 없음";
    const polygon = selectedPolygon();
    dom.selectionStatus.textContent = polygon
        ? `${state.polygons.length}개 · ${polygon.name} (${polygon.vertices.length}점)`
        : `히트박스 ${state.polygons.length}개`;
    dom.zoomStatus.textContent = `${Math.round(state.view.zoom * 100)}%`;
}

function refreshOptions() {
    dom.imageOpacity.value = Math.round(state.imageOpacity * 100);
    dom.showGrid.checked = state.showGrid;
    dom.snapGrid.checked = state.snapGrid;
    dom.showIndices.checked = state.showIndices;
    dom.showBounds.checked = state.showBounds;
    dom.gridSize.value = state.gridSize;
    dom.anchorX.value = round(state.anchor.x * 100, 2);
    dom.anchorY.value = round(state.anchor.y * 100, 2);
}

function refreshUi() {
    refreshLayers();
    refreshInspector();
    refreshOptions();
    refreshStatus();
    updateHistoryButtons();
    draw();
}

function beginPointer(event) {
    if (!state.image) return;
    dom.canvas.setPointerCapture?.(event.pointerId);
    const screen = eventPoint(event);
    const imagePoint = clampPoint(snapPoint(screenToImage(screen)));
    const panMode = event.button === 1 || state.spaceDown || state.tool === "pan";
    if (panMode) {
        state.interaction = { type: "pan", screen, panX: state.view.panX, panY: state.view.panY };
        dom.canvas.style.cursor = "grabbing";
        return;
    }
    if (event.button !== 0) return;
    if (state.tool === "polygon") {
        if (event.detail >= 2) return;
        state.draft ||= [];
        state.draft.push(imagePoint);
        draw();
        return;
    }
    const vertexHit = findVertex(imagePoint);
    if (state.tool === "deleteVertex") {
        if (!vertexHit) return;
        if (vertexHit.polygon.vertices.length <= 3) return notify("꼭짓점은 최소 3개가 필요합니다.");
        recordHistory();
        vertexHit.polygon.vertices.splice(vertexHit.index, 1);
        state.selectedId = vertexHit.polygon.id;
        state.selectedVertex = -1;
        markDirty(true);
        refreshUi();
        return;
    }
    if (state.tool === "addVertex") {
        let polygon = selectedPolygon();
        if (!polygon || polygon.locked) polygon = findPolygon(imagePoint);
        if (!polygon) return notify("점을 추가할 히트박스를 먼저 선택하세요.");
        const edge = findClosestEdge(polygon, imagePoint);
        recordHistory();
        polygon.vertices.splice(edge.index + 1, 0, clampPoint(snapPoint(edge.point)));
        state.selectedId = polygon.id;
        state.selectedVertex = edge.index + 1;
        markDirty(true);
        refreshUi();
        return;
    }
    if (vertexHit) {
        recordHistory();
        state.selectedId = vertexHit.polygon.id;
        state.selectedVertex = vertexHit.index;
        state.interaction = { type: "vertex", polygon: vertexHit.polygon, index: vertexHit.index };
        refreshUi();
        return;
    }
    const polygon = findPolygon(imagePoint);
    if (polygon) {
        recordHistory();
        state.selectedId = polygon.id;
        state.selectedVertex = -1;
        state.interaction = {
            type: "polygon",
            polygon,
            start: imagePoint,
            vertices: polygon.vertices.map(vertex => ({ ...vertex })),
        };
        refreshUi();
        return;
    }
    state.selectedId = null;
    state.selectedVertex = -1;
    refreshUi();
}

function movePointer(event) {
    const screen = eventPoint(event);
    const rawPoint = screenToImage(screen);
    dom.cursorStatus.textContent = state.image
        ? `X ${round(rawPoint.x, 1)} / Y ${round(rawPoint.y, 1)}`
        : "X — / Y —";
    if (!state.interaction) return;
    if (state.interaction.type === "pan") {
        state.view.panX = state.interaction.panX + screen.x - state.interaction.screen.x;
        state.view.panY = state.interaction.panY + screen.y - state.interaction.screen.y;
        draw();
        return;
    }
    const point = clampPoint(snapPoint(rawPoint));
    if (state.interaction.type === "vertex") {
        state.interaction.polygon.vertices[state.interaction.index] = point;
        markDirty(true);
        refreshInspector();
        draw();
        return;
    }
    if (state.interaction.type === "polygon") {
        const dx = point.x - state.interaction.start.x;
        const dy = point.y - state.interaction.start.y;
        state.interaction.polygon.vertices = state.interaction.vertices.map(vertex => clampPoint({ x: vertex.x + dx, y: vertex.y + dy }));
        markDirty(true);
        refreshInspector();
        draw();
    }
}

function endPointer(event) {
    if (state.interaction?.type === "pan") setTool(state.tool);
    state.interaction = null;
    dom.canvas.releasePointerCapture?.(event.pointerId);
    refreshUi();
}

dom.canvas.addEventListener("pointerdown", beginPointer);
dom.canvas.addEventListener("pointermove", movePointer);
dom.canvas.addEventListener("pointerup", endPointer);
dom.canvas.addEventListener("pointercancel", endPointer);
dom.canvas.addEventListener("dblclick", event => {
    event.preventDefault();
    if (state.tool === "polygon") finalizeDraft();
});
dom.canvas.addEventListener("contextmenu", event => {
    event.preventDefault();
    if (!state.image) return;
    const hit = findVertex(screenToImage(eventPoint(event)));
    if (!hit || hit.polygon.vertices.length <= 3) return;
    recordHistory();
    hit.polygon.vertices.splice(hit.index, 1);
    state.selectedId = hit.polygon.id;
    state.selectedVertex = -1;
    markDirty(true);
    refreshUi();
});
dom.canvas.addEventListener("wheel", event => {
    event.preventDefault();
    zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, eventPoint(event));
}, { passive: false });

document.querySelectorAll(".tool[data-tool]").forEach(button => button.addEventListener("click", () => setTool(button.dataset.tool)));
document.querySelectorAll("[data-preset]").forEach(button => button.addEventListener("click", () => regenerateSelected(Number(button.dataset.preset))));

dom.openImageButton.addEventListener("click", () => dom.imageInput.click());
dom.emptyOpenButton.addEventListener("click", () => dom.imageInput.click());
dom.openProjectButton.addEventListener("click", () => dom.projectInput.click());
dom.imageInput.addEventListener("change", () => {
    openImage(dom.imageInput.files?.[0]);
    dom.imageInput.value = "";
});
dom.projectInput.addEventListener("change", () => {
    openProject(dom.projectInput.files?.[0]);
    dom.projectInput.value = "";
});
dom.saveProjectButton.addEventListener("click", () => exportJson(true));
dom.exportButton.addEventListener("click", () => exportJson(false));
dom.previewButton.addEventListener("click", savePreview);
dom.undoButton.addEventListener("click", undo);
dom.redoButton.addEventListener("click", redo);
dom.fitButton.addEventListener("click", fitToScreen);
dom.zoomInButton.addEventListener("click", () => zoomAt(1.2));
dom.zoomOutButton.addEventListener("click", () => zoomAt(1 / 1.2));
dom.addRegularButton.addEventListener("click", () => addRegularPolygon(Number(dom.vertexCount.value) || 4));
dom.duplicateButton.addEventListener("click", duplicateSelected);
dom.deletePolygonButton.addEventListener("click", deleteSelectedPolygon);
dom.regenerateButton.addEventListener("click", () => regenerateSelected(Number(dom.vertexCount.value) || 4));
dom.traceButton.addEventListener("click", traceAlpha);

dom.polygonName.addEventListener("change", () => {
    const polygon = selectedPolygon();
    if (!polygon) return;
    recordHistory();
    polygon.name = dom.polygonName.value.trim() || polygon.name;
    markDirty(true);
    refreshUi();
});
dom.polygonColor.addEventListener("pointerdown", recordHistory);
dom.polygonColor.addEventListener("input", () => {
    const polygon = selectedPolygon();
    if (!polygon) return;
    polygon.color = dom.polygonColor.value;
    markDirty(true);
    refreshLayers();
    draw();
});
dom.fillOpacity.addEventListener("input", () => {
    const polygon = selectedPolygon();
    if (!polygon) return;
    polygon.fillOpacity = Number(dom.fillOpacity.value) / 100;
    markDirty(true);
    draw();
});
dom.rotationInput.addEventListener("change", () => {
    recordHistory();
    transformSelected(dom.rotationInput.value, null);
});
dom.scaleInput.addEventListener("change", () => {
    recordHistory();
    transformSelected(null, dom.scaleInput.value);
});

function updateSelectedVertex(axis, value) {
    const polygon = selectedPolygon();
    const vertex = polygon?.vertices[state.selectedVertex];
    if (!vertex || !Number.isFinite(Number(value))) return;
    recordHistory();
    vertex[axis] = clamp(Number(value), 0, axis === "x" ? state.imageWidth : state.imageHeight);
    markDirty(true);
    refreshUi();
}
dom.vertexX.addEventListener("change", () => updateSelectedVertex("x", dom.vertexX.value));
dom.vertexY.addEventListener("change", () => updateSelectedVertex("y", dom.vertexY.value));

dom.imageOpacity.addEventListener("input", () => {
    state.imageOpacity = Number(dom.imageOpacity.value) / 100;
    draw();
});
dom.showGrid.addEventListener("change", () => { state.showGrid = dom.showGrid.checked; draw(); });
dom.snapGrid.addEventListener("change", () => { state.snapGrid = dom.snapGrid.checked; });
dom.showIndices.addEventListener("change", () => { state.showIndices = dom.showIndices.checked; draw(); });
dom.showBounds.addEventListener("change", () => { state.showBounds = dom.showBounds.checked; draw(); });
dom.gridSize.addEventListener("change", () => {
    state.gridSize = clamp(Math.round(Number(dom.gridSize.value) || 8), 1, 256);
    refreshOptions();
    draw();
});

function updateAnchor() {
    state.anchor.x = clamp((Number(dom.anchorX.value) || 0) / 100, 0, 1);
    state.anchor.y = clamp((Number(dom.anchorY.value) || 0) / 100, 0, 1);
    markDirty(true);
    refreshOptions();
    draw();
}
dom.anchorX.addEventListener("change", updateAnchor);
dom.anchorY.addEventListener("change", updateAnchor);
dom.anchorCenterButton.addEventListener("click", () => {
    state.anchor = { x: 0.5, y: 0.5 };
    markDirty(true);
    refreshOptions();
    draw();
});

dom.workspace.addEventListener("dragover", event => {
    if (event.dataTransfer?.types?.includes("Files")) event.preventDefault();
});
dom.workspace.addEventListener("drop", event => {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    event.preventDefault();
    if (file.type === "application/json" || file.name.toLowerCase().endsWith(".json")) openProject(file);
    else if (file.type.startsWith("image/")) openImage(file);
    else notify("이미지 또는 Craftras JSON 파일만 열 수 있습니다.");
});

window.addEventListener("keydown", event => {
    const inputActive = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
    if (event.code === "Space" && !inputActive) {
        state.spaceDown = true;
        event.preventDefault();
    }
    if (inputActive) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
        return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
    }
    const key = event.key.toLowerCase();
    if (key === "v") setTool("select");
    else if (key === "p") setTool("polygon");
    else if (key === "a") setTool("addVertex");
    else if (key === "d") setTool("deleteVertex");
    else if (key === "h") setTool("pan");
    else if (key === "f") fitToScreen();
    else if (key === "enter") finalizeDraft();
    else if (key === "escape") {
        state.draft = null;
        state.selectedVertex = -1;
        draw();
    } else if (key === "delete" || key === "backspace") {
        event.preventDefault();
        const polygon = selectedPolygon();
        if (polygon && state.selectedVertex >= 0 && polygon.vertices.length > 3) {
            recordHistory();
            polygon.vertices.splice(state.selectedVertex, 1);
            state.selectedVertex = -1;
            markDirty(true);
            refreshUi();
        } else deleteSelectedPolygon();
    } else if (key === "+" || key === "=") zoomAt(1.2);
    else if (key === "-") zoomAt(1 / 1.2);
});
window.addEventListener("keyup", event => {
    if (event.code === "Space") state.spaceDown = false;
});
window.addEventListener("beforeunload", event => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
});

new ResizeObserver(resizeCanvas).observe(dom.workspace);
window.CraftrasHitboxEditor = Object.freeze({
    buildExport,
    notify,
    downloadBlob,
    safeBaseName,
    getImage: () => ({
        element: state.image,
        dataUrl: state.imageDataUrl,
        name: state.imageName,
        mimeType: state.imageMime,
        width: state.imageWidth,
        height: state.imageHeight,
        anchor: { ...state.anchor },
    }),
    getRuntime: () => ({
        anchor: { ...state.anchor },
        polygons: state.polygons.filter(polygon => polygon.visible).map(polygon => ({
            id: polygon.id,
            name: polygon.name,
            points: polygon.vertices.map(vertex => [
                vertex.x / Math.max(1, state.imageWidth) - state.anchor.x,
                vertex.y / Math.max(1, state.imageHeight) - state.anchor.y,
            ]),
        })),
    }),
});
updateCanvasHint();
refreshUi();
resizeCanvas();
