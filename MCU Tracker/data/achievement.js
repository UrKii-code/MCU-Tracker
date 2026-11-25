// ========================================
// MCU TRACKER - ACHIEVEMENTS MODULE
// ========================================

const SAFE_FALLBACK_ICON = "images/icon/shield-emblem.png";

const achievementsData = [
    // === 1. GENERAL MILESTONES ===
    {
        id: "first-mission",
        title: "First Mission",
        badge: "Stark Industries ID",
        requirement: "Watch first MCU title",
        details: "Watch any 1 title in the tracker",
        check: (watched) => countValidWatched(watched) >= 1
    },
    {
        id: "newbie",
        title: "Newbie",
        badge: "Star Lord Cassette",
        requirement: "Watch 10 MCU titles",
        details: "Watch any 10 movies, series, or specials",
        check: (watched) => countValidWatched(watched) >= 10
    },
    {
        id: "marathon-runner",
        title: "Marathon Runner",
        badge: "Quinjet",
        requirement: "Watch 25 MCU titles",
        details: "Watch any 25 movies, series, or specials",
        check: (watched) => countValidWatched(watched) >= 25
    },
    {
        id: "super-fan",
        title: "Super Fan",
        badge: "Wandavision TV",
        requirement: "Watch 50 MCU titles",
        details: "Watch any 50 movies, series, or specials",
        check: (watched) => countValidWatched(watched) >= 50
    },
    {
        id: "ultimate-fan",
        title: "Ultimate Fan",
        badge: "Zodiac Key",
        requirement: "Watch 75 MCU titles",
        details: "Watch any 75 movies, series, or specials",
        check: (watched) => countValidWatched(watched) >= 75
    },
    {
        id: "mcu-completionist",
        title: "MCU Completionist",
        badge: "Black Vortex",
        requirement: "Reach 100% MCU completion",
        details: "Watch every single release in the MCU Tracker watchlist",
        check: (watched) => {
            if (typeof mcuTimeline === "undefined" || mcuTimeline.length === 0) return false;
            return countValidWatched(watched) >= mcuTimeline.length;
        }
    },

    // === 2. PHASES & SAGAS ===
    {
        id: "original-six",
        title: "Original Six",
        badge: "Tesseract",
        requirement: "Complete Phase 1",
        details: "Iron Man, The Incredible Hulk, Iron Man 2, Thor, Captain America: The First Avenger, The Avengers",
        check: (watched) => hasCompletedGroup(watched, [
            "Iron Man",
            "The Incredible Hulk",
            "Iron Man 2",
            "Thor",
            "Captain America: The First Avenger",
            "The Avengers"
        ])
    },
    {
        id: "age-of-heroes",
        title: "Age of Heroes",
        badge: "Infinity Gauntlet",
        requirement: "Complete Phase 2",
        details: "Iron Man 3, Thor: The Dark World, Captain America: The Winter Soldier, Guardians of the Galaxy, Avengers: Age of Ultron, Ant-Man",
        check: (watched) => hasCompletedGroup(watched, [
            "Iron Man 3",
            "Thor: The Dark World",
            "Captain America: The Winter Soldier",
            "Guardians of the Galaxy",
            "Avengers: Age of Ultron",
            "Ant-Man"
        ])
    },
    {
        id: "endgame-begins",
        title: "Endgame Begins",
        badge: "Stark Gauntlet",
        requirement: "Complete Phase 3",
        details: "Captain America: Civil War, Doctor Strange, Guardians of the Galaxy Vol. 2, Spider-Man: Homecoming, Thor: Ragnarok, Black Panther, Avengers: Infinity War, Ant-Man and the Wasp, Captain Marvel, Avengers: Endgame, Spider-Man: Far From Home",
        check: (watched) => hasCompletedGroup(watched, [
            "Captain America: Civil War",
            "Doctor Strange",
            "Guardians of the Galaxy Vol. 2",
            "Spider-Man: Homecoming",
            "Thor: Ragnarok",
            "Black Panther",
            "Avengers: Infinity War",
            "Ant-Man and the Wasp",
            "Captain Marvel",
            "Avengers: Endgame",
            "Spider-Man: Far From Home"
        ])
    },
    {
        id: "saga-collector",
        title: "Saga Collector",
        badge: "Infinity Stones",
        requirement: "Complete Infinity Saga",
        details: "WWII + 1995 + Phase One + Phase Two + Phase Three",
        check: (watched) => hasCompletedFilter(watched, m =>
            m.saga === "Infinity Saga" && m.timelineSection !== "Documentary / Recap"
        )
    },
    {
        id: "multiverse-voyager",
        title: "Multiverse Voyager",
        badge: "TemPad",
        requirement: "Complete Multiverse Saga",
        details: "TVA / Outside Time + Post-Blip",
        check: (watched) => hasCompletedFilter(watched, m =>
            m.saga === "The Multiverse Saga" && m.timelineSection !== "Documentary / Recap"
        )
    },
    {
        id: "master-of-the-multiverse",
        title: "Master of the Multiverse",
        badge: "Yggdrasil",
        requirement: "Complete Multiverse Collection",
        details: "Recap + Spider-Man Universe + X-Men Universe + Animation",
        check: (watched) => hasCompletedFilter(watched, m =>
            ["Documentary / Recap", "Spider-Man Universe", "X-Men Universe", "Animation / Wakanda History", "Animation / Multiverse"].includes(m.timelineSection)
        )
    },

    // === 3. CHARACTER & HERO COLLECTIONS ===
    {
        id: "i-am-iron-man",
        title: "I Am Iron Man",
        badge: "Arc Reactor",
        requirement: "Complete all Iron Man related titles",
        details: "Iron Man, Iron Man 2, Iron Man 3",
        check: (watched) => hasCompletedGroup(watched, ["Iron Man", "Iron Man 2", "Iron Man 3"])
    },
    {
        id: "captains-journey",
        title: "Captain's Journey",
        badge: "Cap Shield",
        requirement: "Complete Captain America titles",
        details: "Captain America: The First Avenger, Captain America: The Winter Soldier, Captain America: Civil War, Captain America: Brave New World",
        check: (watched) => hasCompletedGroup(watched, [
            "Captain America: The First Avenger",
            "Captain America: The Winter Soldier",
            "Captain America: Civil War",
            "Captain America: Brave New World"
        ])
    },
    {
        id: "god-of-thunder",
        title: "God of Thunder",
        badge: "Mjolnir",
        requirement: "Complete all Thor titles",
        details: "Thor, Thor: The Dark World, Thor: Ragnarok, Thor: Love and Thunder",
        check: (watched) => hasCompletedGroup(watched, [
            "Thor",
            "Thor: The Dark World",
            "Thor: Ragnarok",
            "Thor: Love and Thunder"
        ])
    },
    {
        id: "hulk-smash",
        title: "Hulk Smash!",
        badge: "Hulk Fist",
        requirement: "Watch all Hulk-related MCU appearances",
        details: "The Incredible Hulk, The Avengers, Avengers: Age of Ultron, Thor: Ragnarok, Avengers: Infinity War, Avengers: Endgame, She-Hulk: Attorney at Law",
        check: (watched) => hasCompletedGroup(watched, [
            "The Incredible Hulk",
            "The Avengers",
            "Avengers: Age of Ultron",
            "Thor: Ragnarok",
            "Avengers: Infinity War",
            "Avengers: Endgame",
            "She-Hulk: Attorney at Law"
        ])
    },
    {
        id: "master-of-mystic-arts",
        title: "Master of the Mystic Arts",
        badge: "Eye of Agamotto",
        requirement: "Complete Doctor Strange titles",
        details: "Doctor Strange, Doctor Strange in the Multiverse of Madness",
        check: (watched) => hasCompletedGroup(watched, [
            "Doctor Strange",
            "Doctor Strange in the Multiverse of Madness"
        ])
    },
    {
        id: "web-slinger",
        title: "Web-Slinger",
        badge: "Spider Emblem",
        requirement: "Complete Spider-Man MCU titles",
        details: "Spider-Man: Homecoming, Spider-Man: Far From Home, Spider-Man: No Way Home, Spider-Man: Brand New Day",
        check: (watched) => hasCompletedGroup(watched, [
            "Spider-Man: Homecoming",
            "Spider-Man: Far From Home",
            "Spider-Man: No Way Home",
            "Spider-Man: Brand New Day"
        ])
    },
    {
        id: "wakanda-forever",
        title: "Wakanda Forever",
        badge: "Panther",
        requirement: "Complete Black Panther titles",
        details: "Black Panther, Black Panther: Wakanda Forever",
        check: (watched) => hasCompletedGroup(watched, [
            "Black Panther",
            "Black Panther: Wakanda Forever"
        ])
    },
    {
        id: "guardian-of-galaxy",
        title: "Guardian of the Galaxy",
        badge: "Milano",
        requirement: "Complete Guardians of the Galaxy titles",
        details: "Guardians of the Galaxy, Guardians of the Galaxy Vol. 2, Guardians of the Galaxy Vol. 3, The Guardians of the Galaxy Holiday Special",
        check: (watched) => hasCompletedGroup(watched, [
            "Guardians of the Galaxy",
            "Guardians of the Galaxy Vol. 2",
            "Guardians of the Galaxy Vol. 3",
            "The Guardians of the Galaxy Holiday Special"
        ])
    },
    {
        id: "sorcerer-supreme",
        title: "Sorcerer Supreme",
        badge: "Mystic Portal",
        requirement: "Watch all major Doctor Strange appearances",
        details: "Doctor Strange, Thor: Ragnarok, Avengers: Infinity War, Avengers: Endgame, Spider-Man: No Way Home, Doctor Strange in the Multiverse of Madness",
        check: (watched) => hasCompletedGroup(watched, [
            "Doctor Strange",
            "Thor: Ragnarok",
            "Avengers: Infinity War",
            "Avengers: Endgame",
            "Spider-Man: No Way Home",
            "Doctor Strange in the Multiverse of Madness"
        ])
    },
    {
        id: "king-of-wakanda",
        title: "King of Wakanda",
        badge: "Kimoyo",
        requirement: "Complete Wakanda related titles",
        details: "Black Panther, Black Panther: Wakanda Forever, What If...?, Eyes of Wakanda",
        check: (watched) => hasCompletedGroup(watched, [
            "Black Panther",
            "Black Panther: Wakanda Forever",
            "What If...?",
            "Eyes of Wakanda"
        ])
    },
    {
        id: "friendly-neighborhood",
        title: "Friendly Neighborhood",
        badge: "Web Shooter",
        requirement: "Watch all Spider-Man titles",
        details: "All Spider-Man MCU and Multiverse titles",
        check: (watched) => hasCompletedFilter(watched, m =>
            (m.title || "").toLowerCase().includes("spider-man")
        )
    },
    {
        id: "quantum-traveler",
        title: "Quantum Traveler",
        badge: "Pym Particle Vial",
        requirement: "Complete Ant-Man titles & Quantum Realm appearances",
        details: "Ant-Man, Ant-Man and the Wasp, Ant-Man and the Wasp: Quantumania",
        check: (watched) => hasCompletedGroup(watched, [
            "Ant-Man",
            "Ant-Man and the Wasp",
            "Ant-Man and the Wasp: Quantumania"
        ])
    },

    // === 4. TEAMS & SPECIAL SERIES ===
    {
        id: "avengers-assemble",
        title: "Avengers Assemble",
        badge: "Avengers Logo",
        requirement: "Watch all Avengers Movies",
        details: "The Avengers, Avengers: Age of Ultron, Avengers: Infinity War, Avengers: Endgame",
        check: (watched) => hasCompletedGroup(watched, [
            "The Avengers",
            "Avengers: Age of Ultron",
            "Avengers: Infinity War",
            "Avengers: Endgame"
        ])
    },
    {
        id: "defenders-of-new-york",
        title: "Defenders of New York",
        badge: "Iron Fist Book",
        requirement: "Complete all street-level Marvel Netflix / Disney+ series",
        details: "Marvel's Daredevil, Marvel's Jessica Jones, Marvel's Luke Cage, Marvel's Iron Fist, Marvel's The Defenders, Marvel's The Punisher, Echo",
        check: (watched) => hasCompletedGroup(watched, [
            "Marvel's Daredevil",
            "Marvel's Jessica Jones",
            "Marvel's Luke Cage",
            "Marvel's Iron Fist",
            "Marvel's The Defenders",
            "Marvel's The Punisher",
            "Echo"
        ])
    },
    {
        id: "midnight-sons",
        title: "Midnight Sons",
        badge: "Bloodstone",
        requirement: "Watch supernatural/dark MCU titles",
        details: "Moon Knight, Werewolf by Night",
        check: (watched) => hasCompletedGroup(watched, ["Moon Knight", "Werewolf by Night"])
    },
    {
        id: "small-screen-binge",
        title: "Small Screen Binge",
        badge: "Darkhold Pages",
        requirement: "Complete all live-action Disney+ original series",
        details: "WandaVision, The Falcon and the Winter Soldier, Loki, Hawkeye, Ms. Marvel, Secret Invasion, She-Hulk: Attorney at Law, Echo, Agatha All Along",
        check: (watched) => hasCompletedGroup(watched, [
            "WandaVision",
            "The Falcon and the Winter Soldier",
            "Loki",
            "Hawkeye",
            "Ms. Marvel",
            "Secret Invasion",
            "She-Hulk: Attorney at Law",
            "Echo",
            "Agatha All Along"
        ])
    },
    {
        id: "multiverse-animator",
        title: "Multiverse Animator",
        badge: "Book of Cagliostro",
        requirement: "Complete all Disney+ animated Marvel series",
        details: "What If...?, I Am Groot, Marvel Zombies, Your Friendly Neighborhood Spider-Man",
        check: (watched) => hasCompletedGroup(watched, [
            "What If...?",
            "I Am Groot",
            "Marvel Zombies",
            "Your Friendly Neighborhood Spider-Man"
        ])
    },
    {
        id: "multiverse-chaos",
        title: "Multiverse Chaos",
        badge: "Darkhold Book",
        requirement: "Complete Darkhold / Scarlet Witch storyline",
        details: "WandaVision, Doctor Strange in the Multiverse of Madness, Agatha All Along",
        check: (watched) => hasCompletedGroup(watched, [
            "WandaVision",
            "Doctor Strange in the Multiverse of Madness",
            "Agatha All Along"
        ])
    }
];

function countValidWatched(watchedList) {
    if (!Array.isArray(watchedList)) return 0;
    if (typeof mcuTimeline !== "undefined" && Array.isArray(mcuTimeline) && typeof isProjectWatched === "function") {
        return mcuTimeline.filter(movie => isProjectWatched(movie, watchedList)).length;
    }
    return new Set(
        watchedList.filter(t => typeof t === "string" && t.trim() !== "").map(t => t.toLowerCase().trim())
    ).size;
}

function hasCompletedFilter(watchedList, predicate) {
    if (!Array.isArray(watchedList) || typeof mcuTimeline === "undefined" || !Array.isArray(mcuTimeline)) {
        return false;
    }
    const matching = mcuTimeline.filter(predicate);
    if (matching.length === 0) return false;
    return matching.every(movie => isProjectWatched(movie, watchedList));
}

function hasCompletedGroup(watchedList, requiredTitles) {
    if (!Array.isArray(watchedList) || !Array.isArray(requiredTitles) || requiredTitles.length === 0) {
        return false;
    }

    const normalizedWatched = new Set(
        watchedList.filter(t => typeof t === "string").map(t => t.toLowerCase().trim())
    );

    return requiredTitles.every(req => {
        const targetTitle = req.toLowerCase().trim();
        if (typeof mcuTimeline !== "undefined" && Array.isArray(mcuTimeline) && typeof isProjectWatched === "function") {
            const matchingEntries = mcuTimeline.filter(m => (m.title || "").toLowerCase().trim() === targetTitle);
            if (matchingEntries.length > 0) {
                return matchingEntries.every(entry => isProjectWatched(entry, watchedList));
            }
        }
        return normalizedWatched.has(targetTitle);
    });
}

function getBadgeIconPath(badgeName) {
    const slug = String(badgeName || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return `images/badges/${slug}.png`;
}

// Queue system for achievement popups so notifications display sequentially without piling up
const achievementQueue = [];
let isPopupShowing = false;

function ensurePopupContainerExists() {
    let container = document.getElementById("achievement-popup-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "achievement-popup-container";
        container.setAttribute("aria-live", "polite");
        document.body.appendChild(container);
    }
    return container;
}

function processAchievementQueue() {
    if (isPopupShowing || achievementQueue.length === 0) return;

    isPopupShowing = true;
    const ach = achievementQueue.shift();
    const container = ensurePopupContainerExists();
    const iconPath = getBadgeIconPath(ach.badge);
    const safeBadge = typeof escapeHtml === "function" ? escapeHtml(ach.badge) : ach.badge;
    const safeReq = typeof escapeHtml === "function" ? escapeHtml(ach.requirement) : ach.requirement;

    const card = document.createElement("div");
    card.className = "achievement-popup-card";
    card.innerHTML = `
        <img src="${iconPath}" alt="${safeBadge}" onerror="this.onerror=null; this.src='${SAFE_FALLBACK_ICON}';">
        <div class="achievement-popup-info">
            <h4>Achievement Unlocked</h4>
            <p class="badge-name">${safeBadge}</p>
            <p class="badge-req">${safeReq}</p>
        </div>
    `;

    container.prepend(card);

    setTimeout(() => {
        card.classList.add("show");
    }, 50);

    setTimeout(() => {
        card.classList.remove("show");
        setTimeout(() => {
            card.remove();
            isPopupShowing = false;
            processAchievementQueue();
        }, 400);
    }, 4000);
}

function showAchievementPopup(ach) {
    achievementQueue.push(ach);
    processAchievementQueue();
}

function getCurrentWatchedForAchievements() {
    if (typeof watchedMovies !== "undefined" && Array.isArray(watchedMovies)) {
        return watchedMovies;
    }
    try {
        const stored = JSON.parse(localStorage.getItem("mcuWatchedList"));
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function checkAndNotifyAchievements() {
    const currentWatched = getCurrentWatchedForAchievements();

    let unlockedCache = [];
    try {
        const parsed = JSON.parse(localStorage.getItem("mcu_unlocked_achievements"));
        if (Array.isArray(parsed)) {
            unlockedCache = parsed.filter(id => typeof id === "string");
        }
    } catch {
        unlockedCache = [];
    }

    const currentlyUnlocked = new Set();

    achievementsData.forEach(ach => {
        const isUnlocked = typeof ach.check === "function" ? ach.check(currentWatched) : false;
        if (isUnlocked) {
            currentlyUnlocked.add(ach.id);
            if (!unlockedCache.includes(ach.id)) {
                showAchievementPopup(ach);
            }
        }
    });

    try {
        localStorage.setItem("mcu_unlocked_achievements", JSON.stringify([...currentlyUnlocked]));
    } catch {
        // Ignore storage quota errors gracefully
    }
}

function renderAchievements() {
    const achievementContainer = document.getElementById("achievementContainer");
    if (!achievementContainer) return;

    const currentWatched = getCurrentWatchedForAchievements();
    const unlockedCount = achievementsData.filter(ach =>
        typeof ach.check === "function" && ach.check(currentWatched)
    ).length;

    const safeEsc = typeof escapeHtml === "function" ? escapeHtml : (v) => String(v ?? "");

    achievementContainer.innerHTML = `
        <div class="achievement-summary">
            <span>Unlocked <strong>${unlockedCount}</strong> of <strong>${achievementsData.length}</strong> Badges</span>
        </div>
        <div class="achievement-grid">
            ${achievementsData.map((ach) => {
                const isUnlocked = typeof ach.check === "function" ? ach.check(currentWatched) : false;
                const iconPath = getBadgeIconPath(ach.badge);
                const tooltipText = safeEsc(`${ach.title} (${ach.badge}) — ${ach.requirement}`);

                return `
                    <button
                        type="button"
                        class="achievement-badge-btn ${isUnlocked ? "unlocked" : "locked"}"
                        data-achievement-id="${safeEsc(ach.id)}"
                        title="${tooltipText}"
                        aria-label="${safeEsc(ach.title)}: ${isUnlocked ? "Unlocked" : "Locked"}. ${safeEsc(ach.requirement)}"
                    >
                        <img
                            src="${iconPath}"
                            alt="${safeEsc(ach.badge)}"
                            loading="lazy"
                            onerror="this.onerror=null; this.src='${SAFE_FALLBACK_ICON}';"
                        >
                        <span class="achievement-badge-title">${safeEsc(ach.title)}</span>
                    </button>
                `;
            }).join("")}
        </div>
    `;

    achievementContainer.querySelectorAll(".achievement-badge-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const achId = btn.getAttribute("data-achievement-id");
            const ach = achievementsData.find(item => item.id === achId);
            if (!ach) return;
            const isUnlocked = typeof ach.check === "function" ? ach.check(currentWatched) : false;
            if (typeof openAchievementModal === "function") {
                openAchievementModal(ach, isUnlocked);
            }
        });
    });
}
