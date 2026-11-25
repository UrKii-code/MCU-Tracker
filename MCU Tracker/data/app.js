// ========================================
// MCU TRACKER - APPLICATION ENGINE
// ========================================

const WATCHED_STORAGE_KEY = "mcuWatchedList";
const ACHIEVEMENT_STORAGE_KEY = "mcu_unlocked_achievements";
const FALLBACK_POSTER = "images/logos/mcu-logo.png";

// ===== Safe LocalStorage Load & Legacy Migration ===== //
function loadWatchedList() {
    let rawList = [];
    try {
        const stored = localStorage.getItem(WATCHED_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                rawList = parsed.filter(item => typeof item === "string" && item.trim() !== "");
            }
        }
    } catch (err) {
        console.warn("Corrupted watched list in localStorage ignored:", err);
        return [];
    }

    if (typeof mcuTimeline === "undefined" || !Array.isArray(mcuTimeline) || mcuTimeline.length === 0) {
        return [...new Set(rawList.map(s => s.trim()))];
    }

    const keyMap = new Map();
    const titleGroups = new Map();

    mcuTimeline.forEach(movie => {
        const key = getProjectKey(movie);
        if (key) keyMap.set(key.toLowerCase().trim(), key);

        const baseTitle = (movie.title || "").toLowerCase().trim();
        if (baseTitle) {
            if (!titleGroups.has(baseTitle)) titleGroups.set(baseTitle, []);
            titleGroups.get(baseTitle).push(key);
        }
    });

    let migrated = false;
    const result = [];

    rawList.forEach(entry => {
        const trimmed = entry.trim();
        const lower = trimmed.toLowerCase();

        if (keyMap.has(lower)) {
            const canonical = keyMap.get(lower);
            if (canonical !== trimmed) migrated = true;
            result.push(canonical);
        } else if (titleGroups.has(lower)) {
            // Legacy bare title for a multi-season series: expand non-destructively to all its seasons
            titleGroups.get(lower).forEach(seasonKey => result.push(seasonKey));
            migrated = true;
        } else {
            result.push(trimmed);
        }
    });

    const deduped = [...new Set(result)];
    if (migrated) {
        saveWatchedList(deduped);
    }
    return deduped;
}

function saveWatchedList(list) {
    try {
        localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify([...new Set(list)]));
    } catch (err) {
        console.warn("Failed to save watched list to localStorage:", err);
    }
}

let watchedMovies = loadWatchedList();
let activePhaseFilter = "all";
let renderTimeline;
let applyFiltersAndRender;

// ===== Timeline Filter & Matching Helpers ===== //
function matchesCategoryFilter(movie, filterValue) {
    if (!movie) return false;
    const normalizedFilter = (filterValue || "all").toLowerCase().trim();
    if (normalizedFilter === "all") return true;

    const type = (movie.type || "").toLowerCase().trim();
    if (normalizedFilter === "movie") return type === "movie";
    if (normalizedFilter === "series") return type === "series";
    if (normalizedFilter === "oneshot" || normalizedFilter === "one-shot") {
        return type === "one-shot" || type === "oneshot" || type === "special";
    }
    if (normalizedFilter === "animation") {
        return typeof isAnimatedProject === "function" ? isAnimatedProject(movie) : false;
    }
    return type === normalizedFilter;
}

function matchesPhaseFilter(movie, phaseKey) {
    if (!movie || !phaseKey || phaseKey === "all") return true;
    const section = (movie.timelineSection || "").toLowerCase();
    const saga = (movie.saga || "").toLowerCase();

    switch (phaseKey) {
        case "infinity-saga":
            return saga === "infinity saga" && section !== "documentary / recap";
        case "phase-one":
            return section === "wwii" || section === "1995" || section === "phase one";
        case "phase-two":
            return section === "phase two";
        case "phase-three":
            return section === "phase three";
        case "multiverse-saga":
            return saga === "the multiverse saga" && section !== "documentary / recap";
        case "phase-four":
            return saga === "the multiverse saga" && (section === "tva / outside time" || (movie.releaseYear >= 2021 && movie.releaseYear <= 2022));
        case "phase-five":
            return saga === "the multiverse saga" && movie.releaseYear >= 2023 && movie.releaseYear <= 2025 && (movie.timelineOrder || 0) < 90;
        case "phase-six":
            return saga === "the multiverse saga" && (movie.releaseYear >= 2025 && (movie.timelineOrder || 0) >= 90);
        case "multiverse-collection":
            return ["documentary / recap", "spider-man universe", "x-men universe", "animation / wakanda history", "animation / multiverse"].includes(section);
        default:
            return true;
    }
}

function matchesSearchTerm(movie, searchTerm) {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;

    const haystacks = [
        movie.title,
        movie.director,
        movie.saga,
        movie.timelineSection,
        movie.type,
        movie.timelineYear,
        movie.releaseYear != null ? String(movie.releaseYear) : "",
        movie.season != null ? `season ${movie.season}` : "",
        ...(Array.isArray(movie.characters) ? movie.characters : [])
    ];

    return haystacks.some(field => typeof field === "string" && field.toLowerCase().includes(q));
}

// ===== DOM Initialization ===== //
document.addEventListener("DOMContentLoaded", () => {
    const timelineContainer = document.getElementById("mcu-timeline");
    const searchInput = document.getElementById("searchInput");
    const filterButtons = document.querySelectorAll(".filter-section .filter");
    const navToggle = document.getElementById("navToggle");
    const mainNav = document.getElementById("mainNav");
    const phaseNodes = document.querySelectorAll(".mcu-simple-timeline .timeline-item[data-phase]");
    const clearPhaseBtn = document.getElementById("clearPhaseFilter");

    if (!timelineContainer) {
        console.error("MCU timeline container not found.");
        return;
    }

    if (typeof mcuTimeline === "undefined" || !Array.isArray(mcuTimeline) || mcuTimeline.length === 0) {
        timelineContainer.innerHTML = `<p class="empty-state">Unable to load MCU timeline data.</p>`;
        return;
    }

    // Mobile Navigation Toggle
    if (navToggle && mainNav) {
        navToggle.addEventListener("click", () => {
            const isOpen = mainNav.classList.toggle("open");
            navToggle.setAttribute("aria-expanded", String(isOpen));
        });

        mainNav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                mainNav.classList.remove("open");
                navToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    // Core Render Function
    renderTimeline = function(dataToRender) {
        timelineContainer.innerHTML = "";

        if (!dataToRender || dataToRender.length === 0) {
            timelineContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-film"></i>
                    <p>No matching movies, series, or characters found.</p>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        dataToRender.forEach(movie => {
            const card = document.createElement("div");
            card.classList.add("movie-card");
            card.setAttribute("tabindex", "0");
            card.setAttribute("role", "button");
            card.setAttribute("aria-label", `View details for ${getProjectKey(movie)}`);

            const projectKey = getProjectKey(movie);
            const isWatched = isProjectWatched(movie, watchedMovies);
            const safeTitle = escapeHtml(movie.title);
            const safePoster = escapeHtml(sanitizeUrl(movie.poster, true) || FALLBACK_POSTER);
            const safeYear = escapeHtml(movie.releaseYear || movie.timelineYear || "");
            const safeType = escapeHtml(movie.type || "");
            const safeRating = escapeHtml(movie.userRating || "");

            card.innerHTML = `
                <div class="movie-poster">
                    <img src="${safePoster}" alt="${safeTitle}" loading="lazy" onerror="this.onerror=null; this.src='${FALLBACK_POSTER}';">
                    ${isWatched ? '<span class="watched-corner-badge" title="Watched"><i class="fa-solid fa-check"></i></span>' : ""}
                </div>
                <div class="movie-info">
                    <div>
                        <h3>${safeTitle}</h3>
                        <p>${safeYear}</p>
                        ${movie.season ? `<p class="card-season">Season ${escapeHtml(movie.season)}</p>` : ""}
                        <div class="card-meta-row">
                            <span class="type-pill">${safeType}</span>
                            ${safeRating ? `<span class="rating-pill"><i class="fa-solid fa-star"></i> ${safeRating}</span>` : ""}
                        </div>
                    </div>
                    <button type="button" class="watch-btn ${isWatched ? "watched" : ""}" data-key="${escapeHtml(projectKey)}">
                        <i class="fa-solid ${isWatched ? "fa-check-circle" : "fa-circle"}"></i>
                        ${isWatched ? "Watched" : "Mark Watched"}
                    </button>
                </div>
            `;

            card.addEventListener("click", (e) => {
                if (!e.target.closest(".watch-btn")) {
                    openMovieModal(movie);
                }
            });

            card.addEventListener("keydown", (e) => {
                if ((e.key === "Enter" || e.key === " ") && !e.target.closest(".watch-btn")) {
                    e.preventDefault();
                    openMovieModal(movie);
                }
            });

            const watchBtn = card.querySelector(".watch-btn");
            watchBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleWatchStatus(projectKey);
            });

            fragment.appendChild(card);
        });

        timelineContainer.appendChild(fragment);
    };

    // Combined Filter, Phase & Search Logic
    function filterAndSearchMovies() {
        const activeFilterBtn = document.querySelector(".filter-section .filter.active");
        const filterValue = activeFilterBtn ? activeFilterBtn.getAttribute("data-filter") : "all";
        const searchTerm = searchInput ? searchInput.value : "";

        const result = mcuTimeline.filter(movie =>
            matchesCategoryFilter(movie, filterValue) &&
            matchesPhaseFilter(movie, activePhaseFilter) &&
            matchesSearchTerm(movie, searchTerm)
        );

        updateActivePhaseBanner();
        renderTimeline(result);
    }

    applyFiltersAndRender = filterAndSearchMovies;

    function updateActivePhaseBanner() {
        const banner = document.getElementById("activePhaseBanner");
        const label = document.getElementById("activePhaseLabel");
        if (!banner || !label) return;

        if (!activePhaseFilter || activePhaseFilter === "all") {
            banner.style.display = "none";
            return;
        }

        const activeNode = document.querySelector(`.mcu-simple-timeline .timeline-item[data-phase="${activePhaseFilter}"]`);
        const phaseText = activeNode ? (activeNode.getAttribute("data-label") || activePhaseFilter) : activePhaseFilter;
        label.textContent = `Timeline Filter: ${phaseText}`;
        banner.style.display = "flex";
    }

    // Timeline Node Click Handlers
    phaseNodes.forEach(node => {
        const handleActivate = () => {
            const phase = node.getAttribute("data-phase");
            if (activePhaseFilter === phase) {
                activePhaseFilter = "all";
                phaseNodes.forEach(n => n.classList.remove("selected"));
            } else {
                activePhaseFilter = phase;
                phaseNodes.forEach(n => n.classList.remove("selected"));
                node.classList.add("selected");
            }
            filterAndSearchMovies();

            const timelineSection = document.getElementById("timeline");
            if (timelineSection && activePhaseFilter !== "all") {
                timelineSection.scrollIntoView({ behavior: "smooth" });
            }
        };

        node.addEventListener("click", handleActivate);
        node.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleActivate();
            }
        });
    });

    if (clearPhaseBtn) {
        clearPhaseBtn.addEventListener("click", () => {
            activePhaseFilter = "all";
            phaseNodes.forEach(n => n.classList.remove("selected"));
            filterAndSearchMovies();
        });
    }

    // Category Filter Buttons
    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            filterButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            filterAndSearchMovies();
        });
    });

    // Search Input Listener
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            filterAndSearchMovies();
        });
    }

    // Hero Button Handlers
    const continueBtn = document.getElementById("continueBtn");
    const timelineBtn = document.getElementById("timelineBtn");

    if (continueBtn) {
        continueBtn.addEventListener("click", () => {
            const nextProject = mcuTimeline.find(movie => !isProjectWatched(movie, watchedMovies));
            if (nextProject) {
                openMovieModal(nextProject);
            } else {
                showStatusDialog(
                    "Timeline Complete",
                    "You have watched every title in the MCU Tracker timeline. Incredible work!"
                );
            }
        });
    }

    if (timelineBtn) {
        timelineBtn.addEventListener("click", () => {
            const target = document.getElementById("timeline") || document.getElementById("statistics");
            if (target) {
                target.scrollIntoView({ behavior: "smooth" });
            }
        });
    }

    // Initial load calls
    filterAndSearchMovies();
    updateDashboard();
    updateStatistics();
    renderComingSoon();
    renderAchievements();
    updateContinueWatching();
});

// ===== Progress Dashboard & Statistics ===== //
function updateDashboard() {
    const totalProjects = typeof mcuTimeline !== "undefined" && Array.isArray(mcuTimeline) ? mcuTimeline.length : 0;

    let watchedCount = 0;
    if (totalProjects > 0 && Array.isArray(watchedMovies)) {
        watchedCount = mcuTimeline.filter(movie => isProjectWatched(movie, watchedMovies)).length;
    }

    const clampedWatched = Math.min(watchedCount, totalProjects);
    const percentage = totalProjects > 0
        ? Math.min(Math.round((clampedWatched / totalProjects) * 100), 100)
        : 0;

    const progressBar = document.getElementById("overallProgress");
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute("aria-valuenow", String(percentage));
    }

    const percentageElement = document.getElementById("overallPercentage");
    if (percentageElement) {
        percentageElement.textContent = `${percentage}%`;
    }

    const overallText = document.getElementById("overallText");
    if (overallText) {
        overallText.textContent = `${clampedWatched} / ${totalProjects} Completed`;
    }

    const remainingText = document.getElementById("remainingText");
    if (remainingText) {
        const remaining = Math.max(totalProjects - clampedWatched, 0);
        remainingText.textContent = `${remaining} Remaining`;
    }
}

function updateStatistics() {
    if (typeof mcuTimeline === "undefined" || !Array.isArray(mcuTimeline)) return;

    let movies = 0;
    let series = 0;
    let specials = 0;
    let totalMinutes = 0;

    mcuTimeline.forEach(movie => {
        const type = (movie.type || "").toLowerCase().trim();
        if (type === "movie") movies++;
        else if (type === "series") series++;
        else if (type.includes("special") || type.includes("one-shot") || type === "oneshot") specials++;

        if (movie.runtime != null) {
            const numeric = typeof movie.runtime === "number"
                ? movie.runtime
                : parseInt(String(movie.runtime).replace(/[^\d]/g, ""), 10);
            if (!Number.isNaN(numeric) && numeric > 0) {
                totalMinutes += numeric;
            }
        }
    });

    const movieCountEl = document.getElementById("movieCount");
    if (movieCountEl) movieCountEl.textContent = String(movies);

    const seriesCountEl = document.getElementById("seriesCount");
    if (seriesCountEl) seriesCountEl.textContent = String(series);

    const specialCountEl = document.getElementById("specialCount");
    if (specialCountEl) specialCountEl.textContent = String(specials);

    const runtimeCountEl = document.getElementById("runtimeCount");
    if (runtimeCountEl) {
        const totalHours = Math.round(totalMinutes / 60);
        runtimeCountEl.textContent = `${totalHours}h`;
    }
}

// ===== Watch Status Toggle Function ===== //
function toggleWatchStatus(projectKey, buttonElement) {
    if (!projectKey) return;

    const lowerKey = projectKey.toLowerCase().trim();
    const existingIndex = watchedMovies.findIndex(
        item => typeof item === "string" && item.toLowerCase().trim() === lowerKey
    );

    const nowWatched = existingIndex === -1;

    if (nowWatched) {
        watchedMovies.push(projectKey);
    } else {
        watchedMovies.splice(existingIndex, 1);
    }

    watchedMovies = [...new Set(watchedMovies)];
    saveWatchedList(watchedMovies);

    if (buttonElement) {
        buttonElement.classList.toggle("watched", nowWatched);
        buttonElement.innerHTML = `<i class="fa-solid ${nowWatched ? "fa-check-circle" : "fa-circle"}"></i> ${nowWatched ? "Watched" : "Mark Watched"}`;
    }

    // Keep all sections synchronized without losing active search/filters
    if (typeof checkAndNotifyAchievements === "function") checkAndNotifyAchievements();
    updateDashboard();
    updateStatistics();
    if (typeof renderAchievements === "function") renderAchievements();
    updateContinueWatching();
    renderComingSoon();
    if (typeof applyFiltersAndRender === "function") applyFiltersAndRender();
}

// ===== Details Modal Helpers ===== //
const modal = document.getElementById("detailsModal");
const modalBody = document.getElementById("modalBody");
const closeBtn = document.querySelector("#detailsModal .close");

function closeDetailsModal() {
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
}

function openMovieModal(movie) {
    if (!modal || !modalBody || !movie) return;

    const projectKey = getProjectKey(movie);
    const isWatched = isProjectWatched(movie, watchedMovies);

    const safeTitle = escapeHtml(movie.title);
    const safePoster = escapeHtml(sanitizeUrl(movie.poster, true) || FALLBACK_POSTER);
    const safeBackdrop = escapeHtml(sanitizeUrl(movie.backdrop, true));
    const safeLogo = escapeHtml(sanitizeUrl(movie.logo, true));
    const safeStreamingUrl = sanitizeUrl(movie.streamingUrl, false);
    const safeStreaming = escapeHtml(movie.streaming || "N/A");
    const safeDirector = escapeHtml(movie.director || "N/A");
    const safeRelease = escapeHtml(movie.releaseDate || movie.timelineYear || "N/A");
    const safeType = escapeHtml(movie.type || "N/A");
    const safeRating = escapeHtml(movie.userRating || "N/A");
    const safeDesc = escapeHtml(movie.description || "Detailed synopsis coming soon for this project.");
    const characterList = Array.isArray(movie.characters) && movie.characters.length > 0
        ? escapeHtml(movie.characters.join(", "))
        : "N/A";

    const iconsHtml = (() => {
        if (!movie.icon) return "<div></div>";
        const iconList = Array.isArray(movie.icon) ? movie.icon : [movie.icon];
        const imgs = iconList
            .map(iconPath => sanitizeUrl(iconPath, true))
            .filter(Boolean)
            .map(safeIcon => {
                const imgTag = `<img src="${escapeHtml(safeIcon)}" alt="Character Icon" class="modal-char-icon" onerror="this.style.display='none';">`;
                if (safeStreamingUrl) {
                    return `<a href="${escapeHtml(safeStreamingUrl)}" target="_blank" rel="noopener noreferrer" title="Watch ${safeTitle}">${imgTag}</a>`;
                }
                return imgTag;
            })
            .join("");
        return `<div class="modal-icons-row">${imgs}</div>`;
    })();

    modalBody.innerHTML = `
        <div class="modal-inner-wrap">
            ${safeBackdrop ? `
                <div class="modal-backdrop-img" style="background-image: url('${safeBackdrop}');"></div>
                <div class="modal-backdrop-overlay"></div>
            ` : ""}

            <div class="modal-layout">
                <img
                    src="${safePoster}"
                    alt="${safeTitle}"
                    class="modal-poster-img"
                    onerror="this.onerror=null; this.src='${FALLBACK_POSTER}';"
                >

                <div class="modal-details-col">
                    <div>
                        <div class="modal-title-header">
                            ${safeLogo
                                ? `<img src="${safeLogo}" alt="${safeTitle}" class="modal-logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><h2 class="modal-fallback-title" style="display:none;">${safeTitle}</h2>`
                                : `<h2 class="modal-fallback-title">${safeTitle}</h2>`
                            }
                        </div>

                        <div class="modal-meta-grid">
                            <p><strong>Release:</strong> <span>${safeRelease}</span></p>
                            <p><strong>Category:</strong> <span>${safeType}</span></p>
                            ${movie.season ? `<p><strong>Season:</strong> <span>${escapeHtml(movie.season)}</span></p>` : ""}
                            ${movie.episodes ? `<p><strong>Episodes:</strong> <span>${escapeHtml(movie.episodes)}</span></p>` : ""}
                            <p><strong>Runtime:</strong> <span>${movie.runtime ? `${escapeHtml(movie.runtime)} mins` : "N/A"}</span></p>
                            <p><strong>Rating:</strong> <span class="rating-text"><i class="fa-solid fa-star"></i> ${safeRating}</span></p>
                            <p><strong>Streaming:</strong> <span class="streaming-text">${safeStreaming}</span></p>
                            <p><strong>Director:</strong> <span>${safeDirector}</span></p>
                        </div>

                        <p class="modal-characters"><strong>Characters:</strong> <span>${characterList}</span></p>

                        <div class="modal-actions-row">
                            ${iconsHtml}

                            <div class="modal-action-buttons">
                                ${safeStreamingUrl ? `
                                    <a href="${escapeHtml(safeStreamingUrl)}" target="_blank" rel="noopener noreferrer" class="stream-link-btn">
                                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Watch
                                    </a>
                                ` : ""}
                                <button type="button" id="modal-watch-btn" class="watch-btn modal-watch-btn ${isWatched ? "watched" : ""}">
                                    <i class="fa-solid ${isWatched ? "fa-check-circle" : "fa-circle"}"></i>
                                    ${isWatched ? "Watched" : "Mark Watched"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <p class="modal-description">${safeDesc}</p>
                </div>
            </div>
        </div>
    `;

    const modalWatchBtn = modalBody.querySelector("#modal-watch-btn");
    if (modalWatchBtn) {
        modalWatchBtn.addEventListener("click", () => {
            toggleWatchStatus(projectKey, modalWatchBtn);
        });
    }

    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function openAchievementModal(ach, isUnlocked) {
    if (!modal || !modalBody || !ach) return;

    const iconPath = getBadgeIconPath(ach.badge);
    const safeTitle = escapeHtml(ach.title);
    const safeBadge = escapeHtml(ach.badge);
    const safeReq = escapeHtml(ach.requirement);
    const safeDetails = escapeHtml(ach.details || "");

    modalBody.innerHTML = `
        <div class="achievement-modal-body">
            <img
                src="${escapeHtml(iconPath)}"
                alt="${safeBadge}"
                class="achievement-modal-img ${isUnlocked ? "unlocked" : "locked"}"
                onerror="this.onerror=null; this.src='${SAFE_FALLBACK_ICON}';"
            >
            <span class="achievement-status-pill ${isUnlocked ? "unlocked" : "locked"}">
                ${isUnlocked ? "Unlocked" : "Locked"}
            </span>
            <h2>${safeTitle}</h2>
            <p class="achievement-modal-badge">Badge: ${safeBadge}</p>
            <p class="achievement-modal-req"><strong>Requirement:</strong> ${safeReq}</p>
            ${safeDetails ? `<p class="achievement-modal-details">${safeDetails}</p>` : ""}
        </div>
    `;

    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function showStatusDialog(title, message) {
    if (!modal || !modalBody) return;
    modalBody.innerHTML = `
        <div class="status-dialog-body">
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(message)}</p>
            <button type="button" class="filter active" id="statusDialogOkBtn">Close</button>
        </div>
    `;
    const okBtn = modalBody.querySelector("#statusDialogOkBtn");
    if (okBtn) okBtn.addEventListener("click", closeDetailsModal);
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

if (closeBtn) {
    closeBtn.addEventListener("click", closeDetailsModal);
}

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        closeDetailsModal();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.style.display === "block") {
        closeDetailsModal();
    }
});

// ===== Coming Soon ===== //
function renderComingSoon() {
    const comingSoonContainer = document.getElementById("comingSoonContainer");
    if (!comingSoonContainer || typeof mcuTimeline === "undefined") return;

    const hasExplicitUpcoming = typeof upcoming !== "undefined" && Array.isArray(upcoming) && upcoming.length > 0;
    const upcomingData = hasExplicitUpcoming
        ? upcoming
        : mcuTimeline.filter(movie => {
            if ((movie.status || "").toLowerCase() === "upcoming") return true;
            const parsedDate = parseReleaseDate(movie.releaseDate, movie.releaseYear);
            const year = parsedDate ? parsedDate.getFullYear() : Number(movie.releaseYear || 0);
            return year >= 2026;
        });

    comingSoonContainer.innerHTML = "";

    if (!upcomingData || upcomingData.length === 0) {
        comingSoonContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-clock"></i>
                <p>No upcoming projects announced.</p>
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    upcomingData.forEach(movie => {
        const card = document.createElement("div");
        card.classList.add("movie-card");
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");

        const safeTitle = escapeHtml(movie.title);
        const safePoster = escapeHtml(sanitizeUrl(movie.poster, true) || FALLBACK_POSTER);
        const safeDate = escapeHtml(movie.releaseDate || movie.timelineYear || "TBA");
        const safeType = escapeHtml(movie.type || "Upcoming");
        const isWatched = isProjectWatched(movie, watchedMovies);

        card.innerHTML = `
            <div class="movie-poster">
                <img src="${safePoster}" alt="${safeTitle}" loading="lazy" onerror="this.onerror=null; this.src='${FALLBACK_POSTER}';">
                ${isWatched ? '<span class="watched-corner-badge" title="Watched"><i class="fa-solid fa-check"></i></span>' : ""}
            </div>
            <div class="movie-info">
                <div>
                    <h3>${safeTitle}</h3>
                    <p>${safeDate}</p>
                    ${movie.season ? `<p class="card-season">Season ${escapeHtml(movie.season)}</p>` : ""}
                    <span class="type-pill">${safeType}</span>
                </div>
            </div>
        `;

        card.addEventListener("click", () => openMovieModal(movie));
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openMovieModal(movie);
            }
        });

        fragment.appendChild(card);
    });

    comingSoonContainer.appendChild(fragment);
}

// ===== Continue Watching / Next Up ===== //
function updateContinueWatching() {
    const continueContainer = document.getElementById("continueWatchingContainer");
    if (!continueContainer || typeof mcuTimeline === "undefined") return;

    const nextProject = mcuTimeline.find(movie => !isProjectWatched(movie, watchedMovies));

    if (!nextProject) {
        continueContainer.innerHTML = `
            <div class="continue-complete-card">
                <h3>Congratulations!</h3>
                <p>You have completed the entire MCU timeline available so far.</p>
            </div>
        `;
        return;
    }

    const projectKey = getProjectKey(nextProject);
    const safeTitle = escapeHtml(nextProject.title);
    const safePoster = escapeHtml(sanitizeUrl(nextProject.poster, true) || FALLBACK_POSTER);
    const safeBackdrop = escapeHtml(sanitizeUrl(nextProject.backdrop, true));
    const safeDate = escapeHtml(nextProject.releaseDate || nextProject.timelineYear || "");
    const safeType = escapeHtml(nextProject.type || "");
    const seasonSuffix = nextProject.season ? ` • Season ${escapeHtml(nextProject.season)}` : "";

    continueContainer.innerHTML = `
        <div class="continue-banner-card">
            ${safeBackdrop ? `<div class="continue-backdrop" style="background-image: url('${safeBackdrop}');"></div>` : ""}

            <div class="continue-banner-content">
                <img
                    src="${safePoster}"
                    alt="${safeTitle}"
                    class="continue-poster"
                    onerror="this.onerror=null; this.src='${FALLBACK_POSTER}';"
                >

                <div class="continue-meta">
                    <span class="next-up-badge">Next Up in Timeline</span>
                    <h3>${safeTitle}</h3>
                    <p>${safeDate}${seasonSuffix} • ${safeType}</p>

                    <div class="continue-actions">
                        <button type="button" class="watch-btn" id="nextUpWatchBtn">
                            <i class="fa-solid fa-check-circle"></i> Mark Watched
                        </button>
                        <button type="button" class="filter" id="nextUpDetailsBtn">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const watchBtn = continueContainer.querySelector("#nextUpWatchBtn");
    const detailsBtn = continueContainer.querySelector("#nextUpDetailsBtn");

    if (watchBtn) {
        watchBtn.addEventListener("click", () => {
            toggleWatchStatus(projectKey, watchBtn);
        });
    }

    if (detailsBtn) {
        detailsBtn.addEventListener("click", () => {
            openMovieModal(nextProject);
        });
    }
}

// ===== Secret Logo Reset (3x Click) — In-App Modal ===== //
let resetClickCount = 0;
let resetTimer = null;

const logoTrigger = document.getElementById("logoResetTrigger");

if (logoTrigger) {
    logoTrigger.addEventListener("click", () => {
        resetClickCount++;
        clearTimeout(resetTimer);

        if (resetClickCount === 3) {
            resetClickCount = 0;
            openThanosResetModal();
        } else {
            resetTimer = setTimeout(() => {
                resetClickCount = 0;
            }, 2000);
        }
    });
}

function openThanosResetModal() {
    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
        <div class="status-dialog-body">
            <h2>Thanos Snap Protocol</h2>
            <p>Perfectly balanced, as all things should be. Enter the secret keyword to reset your watchlist and unlocked badges.</p>
            <form id="thanosResetForm" class="thanos-reset-form">
                <input
                    type="password"
                    id="thanosPasswordInput"
                    placeholder="Enter secret keyword..."
                    autocomplete="off"
                    required
                >
                <p id="thanosErrorMsg" class="thanos-error-msg" role="alert"></p>
                <div class="thanos-form-actions">
                    <button type="button" class="filter" id="thanosCancelBtn">Cancel</button>
                    <button type="submit" class="thanos-snap-btn">Trigger Snap</button>
                </div>
            </form>
        </div>
    `;

    modal.style.display = "block";
    document.body.style.overflow = "hidden";

    const form = modalBody.querySelector("#thanosResetForm");
    const input = modalBody.querySelector("#thanosPasswordInput");
    const errorMsg = modalBody.querySelector("#thanosErrorMsg");
    const cancelBtn = modalBody.querySelector("#thanosCancelBtn");

    if (input) input.focus();
    if (cancelBtn) cancelBtn.addEventListener("click", closeDetailsModal);

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const val = input ? input.value.trim() : "";
            if (val === "thanos") {
                try {
                    localStorage.removeItem(WATCHED_STORAGE_KEY);
                    localStorage.removeItem(ACHIEVEMENT_STORAGE_KEY);
                } catch {
                    // Ignore storage error
                }
                watchedMovies = [];
                updateDashboard();
                updateStatistics();
                if (typeof applyFiltersAndRender === "function") applyFiltersAndRender();
                if (typeof renderAchievements === "function") renderAchievements();
                updateContinueWatching();
                renderComingSoon();

                showStatusDialog(
                    "Snap Complete",
                    "Your watchlist and achievements have been reset."
                );
            } else if (errorMsg) {
                errorMsg.textContent = "Incorrect keyword. Access denied.";
            }
        });
    }
}
