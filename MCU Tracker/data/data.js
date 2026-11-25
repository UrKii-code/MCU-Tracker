// =========================================================
// MCU TRACKER - MASTER DATABASE & SHARED HELPERS
// Combines all MCU timeline data
// =========================================================

const mcuTimeline = [
    ...(typeof infinityPart1 !== "undefined" && Array.isArray(infinityPart1) ? infinityPart1 : []),
    ...(typeof infinityPart2 !== "undefined" && Array.isArray(infinityPart2) ? infinityPart2 : []),
    ...(typeof infinityPart3 !== "undefined" && Array.isArray(infinityPart3) ? infinityPart3 : []),
    ...(typeof multiverseSaga !== "undefined" && Array.isArray(multiverseSaga) ? multiverseSaga : []),
    ...(typeof multiverseCollection !== "undefined" && Array.isArray(multiverseCollection) ? multiverseCollection : []),
    ...(typeof upcoming !== "undefined" && Array.isArray(upcoming) ? upcoming : [])
];

// Deduplicate by id if an upcoming entry mirrors a timeline entry
const seenIds = new Set();
for (let i = mcuTimeline.length - 1; i >= 0; i--) {
    const item = mcuTimeline[i];
    if (!item || typeof item !== "object") {
        mcuTimeline.splice(i, 1);
        continue;
    }
    if (item.id != null) {
        if (seenIds.has(item.id)) {
            mcuTimeline.splice(i, 1);
        } else {
            seenIds.add(item.id);
        }
    }
}

// Automatically sort the entire list by timelineOrder (tie-break by id)
mcuTimeline.sort((a, b) => {
    const orderDiff = (Number(a.timelineOrder) || 0) - (Number(b.timelineOrder) || 0);
    if (orderDiff !== 0) return orderDiff;
    return (Number(a.id) || 0) - (Number(b.id) || 0);
});

// Shared HTML escaping helper to prevent markup/script injection in templates
function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Validate external streaming URLs and relative asset paths
function sanitizeUrl(url, allowRelative = false) {
    if (typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";

    if (allowRelative && !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) && !trimmed.startsWith("//")) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return parsed.href;
        }
    } catch {
        return "";
    }
    return "";
}

// Canonical watch key: preserves legacy single-title keys while separating multi-season series
function getProjectKey(movie) {
    if (!movie || !movie.title) return "";
    if (movie.season !== undefined && movie.season !== null && movie.season !== "") {
        return `${movie.title} (Season ${movie.season})`;
    }
    return movie.title;
}

function isProjectWatched(movie, watchedList) {
    if (!movie || !Array.isArray(watchedList) || watchedList.length === 0) return false;
    const key = getProjectKey(movie).toLowerCase().trim();
    return watchedList.some(item => typeof item === "string" && item.toLowerCase().trim() === key);
}

// Parse DD-MM-YYYY release dates safely (falls back to releaseYear)
function parseReleaseDate(dateStr, fallbackYear) {
    if (typeof dateStr === "string") {
        const ddmmyyyy = dateStr.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (ddmmyyyy) {
            const day = Number(ddmmyyyy[1]);
            const month = Number(ddmmyyyy[2]) - 1;
            const year = Number(ddmmyyyy[3]);
            const parsed = new Date(year, month, day);
            if (!Number.isNaN(parsed.getTime())) return parsed;
        }
        const iso = new Date(dateStr);
        if (!Number.isNaN(iso.getTime())) return iso;
    }
    if (typeof fallbackYear === "number" && !Number.isNaN(fallbackYear)) {
        return new Date(fallbackYear, 0, 1);
    }
    return null;
}

function isAnimatedProject(movie) {
    if (!movie) return false;
    const section = (movie.timelineSection || "").toLowerCase();
    if (section.includes("animation")) return true;
    const title = (movie.title || "").toLowerCase().trim();
    return title === "i am groot";
}
