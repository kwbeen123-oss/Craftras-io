const NativeImage = window.Image;

const tracker = window.__craftrasAssetImageTracker || (() => {
    const images = new Set();

    function TrackedImage(width, height) {
        const image = Number.isFinite(width) || Number.isFinite(height)
            ? new NativeImage(width, height)
            : new NativeImage();
        images.add(image);
        return image;
    }

    TrackedImage.prototype = NativeImage.prototype;
    Object.setPrototypeOf(TrackedImage, NativeImage);
    window.Image = TrackedImage;

    return window.__craftrasAssetImageTracker = { images, NativeImage };
})();

const IMAGE_LOAD_TIMEOUT_MS = 45_000;
const IMAGE_LOAD_RETRIES = 2;
const IMAGE_LOAD_CONCURRENCY = 10;
let completedRevision = null;
let activePreload = null;

function loadingElements() {
    return {
        overlay: document.getElementById("craftrasAssetLoading"),
        title: document.getElementById("craftrasAssetLoadingTitle"),
        progress: document.getElementById("craftrasAssetLoadingProgress"),
        retry: document.getElementById("craftrasAssetLoadingRetry"),
    };
}

function showLoading(title = "Loading...", progress = "Preparing images...") {
    const elements = loadingElements();
    if (!elements.overlay) return;
    elements.title.textContent = title;
    elements.progress.textContent = progress;
    elements.retry.hidden = true;
    elements.overlay.hidden = false;
}

function hideLoading() {
    const { overlay } = loadingElements();
    if (overlay) overlay.hidden = true;
}

function showLoadError(error) {
    const elements = loadingElements();
    if (!elements.overlay) return;
    elements.title.textContent = "Image loading failed";
    elements.progress.textContent = error?.message || "Some images could not be loaded.";
    elements.retry.hidden = false;
    elements.retry.onclick = () => {
        elements.overlay.hidden = true;
        document.getElementById("startButton")?.click();
    };
}

function assetPath(source) {
    try {
        const url = new URL(source, location.href);
        if (url.origin !== location.origin || !url.pathname.startsWith("/img/")) return null;
        return decodeURIComponent(url.pathname);
    } catch {
        return null;
    }
}

function retrySource(source, attempt) {
    const url = new URL(source, location.href);
    url.searchParams.set("craftrasAssetRetry", `${Date.now()}-${attempt}`);
    return url.href;
}

function waitForImage(image, source, retries = IMAGE_LOAD_RETRIES) {
    return new Promise((resolve, reject) => {
        let attempt = 0;
        let timer = null;

        const cleanUp = () => {
            clearTimeout(timer);
            image.removeEventListener("load", onLoad);
            image.removeEventListener("error", onError);
        };
        const onLoad = () => {
            if (!image.naturalWidth || !image.naturalHeight) return onError();
            cleanUp();
            resolve();
        };
        const failOrRetry = () => {
            cleanUp();
            if (attempt >= retries) {
                reject(new Error(`Could not load ${assetPath(source) || source}`));
                return;
            }
            attempt++;
            attach();
            image.src = retrySource(source, attempt);
        };
        const onError = () => failOrRetry();
        const attach = () => {
            image.addEventListener("load", onLoad, { once: true });
            image.addEventListener("error", onError, { once: true });
            timer = setTimeout(failOrRetry, IMAGE_LOAD_TIMEOUT_MS);
        };

        if (!image.src) {
            attach();
            image.src = source;
            return;
        }
        if (image.complete && image.naturalWidth && image.naturalHeight) {
            resolve();
            return;
        }
        if (image.complete && !image.naturalWidth) {
            failOrRetry();
            return;
        }
        attach();
    });
}

async function runJobs(jobs, onProgress) {
    let cursor = 0;
    let completed = 0;
    const failures = [];
    const worker = async () => {
        while (cursor < jobs.length) {
            const job = jobs[cursor++];
            try {
                await job.load();
            } catch (error) {
                failures.push({ source: job.source, error });
            }
            completed++;
            onProgress(completed, jobs.length);
        }
    };
    await Promise.all(Array.from({ length: Math.min(IMAGE_LOAD_CONCURRENCY, jobs.length) }, worker));
    return failures;
}

async function fetchManifest() {
    const response = await fetch(`/api/craftras/assets?time=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Asset list request failed (${response.status}).`);
    const manifest = await response.json();
    if (!Array.isArray(manifest.assets)) throw new Error("The server returned an invalid asset list.");
    return manifest;
}

async function performPreload() {
    showLoading();
    const manifest = await fetchManifest();
    if (completedRevision && completedRevision === manifest.revision) {
        hideLoading();
        return manifest;
    }

    const manifestPaths = new Set(manifest.assets.map(asset => assetPath(asset.url)).filter(Boolean));
    const trackedPaths = new Set();
    const jobs = [];

    for (const image of tracker.images) {
        const source = image.currentSrc || image.src;
        const pathname = assetPath(source);
        if (!pathname) continue;
        trackedPaths.add(pathname);
        jobs.push({ source, load: () => waitForImage(image, source) });
    }

    for (const asset of manifest.assets) {
        const pathname = assetPath(asset.url);
        if (!pathname || trackedPaths.has(pathname)) continue;
        jobs.push({
            source: asset.url,
            load: () => {
                const image = new tracker.NativeImage();
                image.decoding = "async";
                return waitForImage(image, asset.url);
            },
        });
    }

    // A source referenced by the game but absent from the server manifest must
    // still finish successfully; otherwise entering the map would recreate the
    // original invisible-image bug.
    const missingReferencedPaths = [...trackedPaths].filter(pathname => !manifestPaths.has(pathname));
    if (missingReferencedPaths.length) {
        console.warn("Images referenced outside the asset manifest:", missingReferencedPaths);
    }

    const failures = await runJobs(jobs, (loaded, total) => {
        const { progress } = loadingElements();
        if (progress) progress.textContent = `${loaded} / ${total} images`;
    });
    if (failures.length) {
        console.error("Craftras image preload failures:", failures);
        throw new Error(`${failures.length} image${failures.length === 1 ? "" : "s"} could not be loaded. Press Retry.`);
    }

    if (document.fonts?.ready) await document.fonts.ready;
    completedRevision = manifest.revision;
    hideLoading();
    return manifest;
}

export async function preloadCraftrasAssets() {
    if (!activePreload) {
        activePreload = performPreload().catch(error => {
            showLoadError(error);
            throw error;
        }).finally(() => {
            activePreload = null;
        });
    }
    return activePreload;
}
