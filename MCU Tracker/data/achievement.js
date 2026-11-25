// ========================================
// MCU TRACKER - ACHIEVEMENTS MODULE
// ========================================

const achievementsData = [
    // === 1. GENERAL MILESTONES ===
    { 
        id: "first-mission",
        title: "First Mission", 
        badge: "Stark Industries ID", 
        requirement: "Watch first MCU title", 
        details: "First selected movie", 
        check: (watched) => watched.length >= 1 
    },
    { 
        id: "newbie",
        title: "Newbie", 
        badge: "Star Lord Cassette", 
        requirement: "Watch 10 MCU titles", 
        details: "Any 10 MCU movies or series", 
        check: (watched) => watched.length >= 10 
    },
    { 
        id: "marathon-runner",
        title: "Marathon Runner", 
        badge: "Quinjet", 
        requirement: "Watch 25 MCU titles", 
        details: "Any 25 MCU movies or series", 
        check: (watched) => watched.length >= 25 
    },
    { 
        id: "super-fan",
        title: "Super Fan", 
        badge: "Wandavision TV", 
        requirement: "Watch 50 MCU titles", 
        details: "Any 50 MCU movies or series", 
        check: (watched) => watched.length >= 50 
    },
    { 
        id: "ultimate-fan",
        title: "Ultimate Fan", 
        badge: "Zodiac Key", 
        requirement: "Watch 75 MCU titles", 
        details: "Any 75 MCU movies or series", 
        check: (watched) => watched.length >= 75 
    },
    { 
        id: "mcu-completionist",
        title: "MCU Completionist", 
        badge: "Black Vortex", 
        requirement: "Reach 100% MCU completion", 
        details: "Watch every single official release in the Marvel Cinematic Universe", 
        check: (watched) => watched.length >= 71 
    },

    // === 2. PHASES & SAGAS ===
    { 
        id: "original-six",
        title: "Original Six", 
        badge: "Tesseract", 
        requirement: "Complete Phase 1", 
        details: "All watchlist in phase 1", 
        check: (watched) => hasCompletedGroup(watched, ["Iron Man", "The Incredible Hulk", "Iron Man 2", "Thor", "Captain America: The First Avenger", "The Avengers"]) 
    },
    { 
        id: "age-of-heroes",
        title: "Age of Heroes", 
        badge: "Infinity Gauntlet", 
        requirement: "Complete Phase 2", 
        details: "All watchlist in phase 2", 
        check: (watched) => hasCompletedGroup(watched, ["Iron Man 3", "Thor: The Dark World", "Captain America: The Winter Soldier", "Guardians of the Galaxy", "Avengers: Age of Ultron", "Ant-Man"]) 
    },
    { 
        id: "endgame-begins",
        title: "Endgame Begins", 
        badge: "Stark Gauntlet", 
        requirement: "Complete Phase 3", 
        details: "All watchlist in phase 3", 
        check: (watched) => hasCompletedGroup(watched, ["Captain America: Civil War", "Doctor Strange", "Guardians of the Galaxy Vol. 2", "Spider-Man: Homecoming", "Thor: Ragnarok", "Black Panther", "Avengers: Infinity War", "Ant-Man and the Wasp", "Captain Marvel", "Avengers: Endgame", "Spider-Man: Far From Home"]) 
    },
    { 
        id: "saga-collector",
        title: "Saga Collector", 
        badge: "Infinity Stones", 
        requirement: "Complete Infinity Saga", 
        details: "Phase 1 + Phase 2 + Phase 3", 
        check: (watched) => watched.length >= 23 
    },
    { 
        id: "multiverse-voyager",
        title: "Multiverse Voyager", 
        badge: "TemPad", 
        requirement: "Complete Multiverse Saga", 
        details: "TVA + Post-Blip", 
        check: (watched) => watched.length >= 15 
    },
    { 
        id: "master-of-the-multiverse",
        title: "Master of the Multiverse", 
        badge: "Yggdrasil", 
        requirement: "Complete Multiverse Collection", 
        details: "Recap + Spider-Man Universe + X-Men Universe + Animation", 
        check: (watched) => watched.length >= 10 
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
        details: "Captain America: The First Avenger, Captain America: The Winter Soldier, Captain America: Civil War", 
        check: (watched) => hasCompletedGroup(watched, ["Captain America: The First Avenger", "Captain America: The Winter Soldier", "Captain America: Civil War"]) 
    },
    { 
        id: "god-of-thunder",
        title: "God of Thunder", 
        badge: "Mjolnir", 
        requirement: "Complete all Thor Titles", 
        details: "Thor, Thor: The Dark World, Thor: Ragnarok, Thor: Love and Thunder", 
        check: (watched) => hasCompletedGroup(watched, ["Thor", "Thor: The Dark World", "Thor: Ragnarok", "Thor: Love and Thunder"]) 
    },
    { 
        id: "hulk-smash",
        title: "Hulk Smash!", 
        badge: "Hulk Fist", 
        requirement: "Watch all Hulk-related MCU appearances", 
        details: "The Incredible Hulk, The Avengers, Avengers: Age of Ultron, Thor: Ragnarok, Avengers: Infinity War, Avengers: Endgame, She-Hulk", 
        check: (watched) => hasCompletedGroup(watched, ["The Incredible Hulk", "The Avengers", "Avengers: Age of Ultron", "Thor: Ragnarok", "Avengers: Infinity War", "Avengers: Endgame", "She-Hulk: Attorney at Law"]) 
    },
    { 
        id: "master-of-mystic-arts",
        title: "Master of the Mystic Arts", 
        badge: "Eye of Agamotto", 
        requirement: "Complete Doctor Strange titles", 
        details: "Doctor Strange, Doctor Strange in the Multiverse of Madness", 
        check: (watched) => hasCompletedGroup(watched, ["Doctor Strange", "Doctor Strange in the Multiverse of Madness"]) 
    },
    { 
        id: "web-slinger",
        title: "Web-Slinger", 
        badge: "Spider Emblem", 
        requirement: "Complete Spider-Man MCU titles", 
        details: "Spider-Man: Homecoming, Spider-Man: No Way Home, Spider-Man: Brand New Day", 
        check: (watched) => hasCompletedGroup(watched, ["Spider-Man: Homecoming", "Spider-Man: No Way Home"]) 
    },
    { 
        id: "wakanda-forever",
        title: "Wakanda Forever", 
        badge: "Panther", 
        requirement: "Complete Black Panther titles", 
        details: "Black Panther, Black Panther: Wakanda Forever", 
        check: (watched) => hasCompletedGroup(watched, ["Black Panther", "Black Panther: Wakanda Forever"]) 
    },
    { 
        id: "guardian-of-galaxy",
        title: "Guardian of the Galaxy", 
        badge: "Milano", 
        requirement: "Complete Guardian of the Galaxy titles", 
        details: "Guardians of the Galaxy, Guardians of the Galaxy vol.2, Guardians of the Galaxy vol.3, Guardians of the Galaxy Holiday Special", 
        check: (watched) => hasCompletedGroup(watched, ["Guardians of the Galaxy", "Guardians of the Galaxy Vol. 2", "Guardians of the Galaxy Vol. 3", "The Guardians of the Galaxy Holiday Special"]) 
    },
    { 
        id: "sorcerer-supreme",
        title: "Sorcerer Supreme", 
        badge: "Mystic Portal", 
        requirement: "Watch all major Doctor strange appearances", 
        details: "Doctor Strange, Thor: Ragnarok, Avengers: Infinity War, Avengers: Endgame, Spider-Man: No Way Home, Multiverse of Madness", 
        check: (watched) => hasCompletedGroup(watched, ["Doctor Strange", "Thor: Ragnarok", "Avengers: Infinity War", "Avengers: Endgame", "Spider-Man: No Way Home", "Doctor Strange in the Multiverse of Madness"]) 
    },
    { 
        id: "king-of-wakanda",
        title: "King of Wakanda", 
        badge: "Kimoyo", 
        requirement: "Complete Wakanda related titles", 
        details: "Black Panther, Black Panther: Wakanda Forever, What If...?, Eyes of Wakanda", 
        check: (watched) => hasCompletedGroup(watched, ["Black Panther", "Black Panther: Wakanda Forever", "What If...?"]) 
    },
    { 
        id: "friendly-neighborhood",
        title: "Friendly Neighborhood", 
        badge: "Web Shooter", 
        requirement: "Watch all Spider-Man titles", 
        details: "Spider-Man MCU + Spider-Man Universe", 
        check: (watched) => watched.some(m => m.toLowerCase().includes("spider-man")) 
    },
    { 
        id: "quantum-traveler",
        title: "Quantum Traveler", 
        badge: "Pym Particle Vial", 
        requirement: "Complete Ant-Man titles & Quantum Realm appearances", 
        details: "Ant-Man, Ant-Man and the Wasp, Ant-Man and the Wasp: Quantumania", 
        check: (watched) => hasCompletedGroup(watched, ["Ant-Man", "Ant-Man and the Wasp", "Ant-Man and the Wasp: Quantumania"]) 
    },

    // === 4. TEAMS & SPECIAL SERIES ===
    { 
        id: "avengers-assemble",
        title: "Avengers Assemble", 
        badge: "Avengers Logo", 
        requirement: "Watch all Avengers Movies", 
        details: "The Avengers, Avengers: Age of Ultron, Avengers: Infinity War, Avengers: Endgame", 
        check: (watched) => hasCompletedGroup(watched, ["The Avengers", "Avengers: Age of Ultron", "Avengers: Infinity War", "Avengers: Endgame"]) 
    },
    { 
        id: "defenders-of-new-york",
        title: "Defenders of New York", 
        badge: "Iron Fist Book", 
        requirement: "Complete all street-level Marvel Netflix / Disney+ series", 
        details: "Daredevil, Jessica Jones, Luke Cage, Iron Fist, The Defenders, The Punisher, Echo", 
        check: (watched) => hasCompletedGroup(watched, ["Daredevil", "Jessica Jones", "Luke Cage", "Iron Fist", "The Defenders", "The Punisher", "Echo"]) 
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
        details: "WandaVision, The Falcon and the Winter Soldier, Loki, Hawkeye, Ms. Marvel, Secret Invasion, She-Hulk, Echo, Agatha All Along", 
        check: (watched) => hasCompletedGroup(watched, ["WandaVision", "The Falcon and the Winter Soldier", "Loki", "Hawkeye", "Ms. Marvel", "Secret Invasion", "She-Hulk: Attorney at Law", "Echo", "Agatha All Along"]) 
    },
    { 
        id: "multiverse-animator",
        title: "Multiverse Animator", 
        badge: "Book of Cagliostro", 
        requirement: "Complete all Disney+ animated Marvel series", 
        details: "What If...?, I Am Groot, Marvel Zombies, Your Friendly Neighborhood Spider-Man", 
        check: (watched) => hasCompletedGroup(watched, ["What If...?", "I Am Groot"]) 
    },
    { 
        id: "multiverse-chaos",
        title: "Multiverse Chaos", 
        badge: "Darkhold Book", 
        requirement: "Complete Darkhold / Scarlet Witch storyline", 
        details: "WandaVision, Doctor Strange in the Multiverse of Madness, Agatha All Along", 
        check: (watched) => hasCompletedGroup(watched, ["WandaVision", "Doctor Strange in the Multiverse of Madness", "Agatha All Along"]) 
    }
];

function hasCompletedGroup(watchedList, requiredTitles) {
    const normalizedWatched = watchedList.map(t => t.toLowerCase().trim());
    return requiredTitles.every(req => normalizedWatched.includes(req.toLowerCase().trim()));
}

function getBadgeIconPath(badgeName) {
    const slug = badgeName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    return `images/badges/${slug}.png`;
}

// Queue system for popups to ensure they show one by one
let achievementQueue = [];
let isPopupShowing = false;

function ensurePopupContainerExists() {
    let container = document.getElementById("achievement-popup-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "achievement-popup-container";
        document.body.appendChild(container);
    }
    return container;
}

function showAchievementPopup(ach) {
    const container = ensurePopupContainerExists();
    const iconPath = getBadgeIconPath(ach.badge);

    const card = document.createElement("div");
    card.className = "achievement-popup-card";
    card.innerHTML = `
        <img src="${iconPath}" alt="${ach.badge}" onerror="this.onerror=null; this.src='images/default-shield.png';">
        <div class="achievement-popup-info">
            <h4>🏆 ACHIEVEMENT UNLOCKED</h4>
            <p class="badge-name">${ach.badge}</p>
            <p class="badge-req">${ach.requirement}</p>
        </div>
    `;

    // PREPEND puts the newest notification at the very top
    container.prepend(card);

    // Trigger slide-in animation
    setTimeout(() => {
        card.classList.add("show");
    }, 50);

    // Remove the card after ~5 seconds
    setTimeout(() => {
        card.classList.remove("show");
        setTimeout(() => {
            card.remove();
        }, 400);
    }, 5000);
}

function checkAndNotifyAchievements() {
    let currentWatched = typeof watchedMovies !== "undefined" ? watchedMovies : [];

    let unlockedCache = [];
    try {
        unlockedCache = JSON.parse(localStorage.getItem("mcu_unlocked_achievements")) || [];
    } catch (e) {
        unlockedCache = [];
    }

    achievementsData.forEach(ach => {
        const isUnlocked = typeof ach.check === "function" ? ach.check(currentWatched) : false;
        if (isUnlocked && !unlockedCache.includes(ach.id)) {
            unlockedCache.push(ach.id);
            // Instantly trigger popup for each newly unlocked achievement
            showAchievementPopup(ach);
        }
    });

    localStorage.setItem("mcu_unlocked_achievements", JSON.stringify(unlockedCache));
}

function renderAchievements() {
    const achievementContainer = document.getElementById("achievementContainer");
    if (!achievementContainer) return;

    let currentWatched = [];
    if (typeof watchedMovies !== "undefined" && Array.isArray(watchedMovies)) {
        currentWatched = watchedMovies;
    } else if (typeof watched !== "undefined" && Array.isArray(watched)) {
        currentWatched = watched;
    } else {
        try {
            const stored = localStorage.getItem("mcu_watched");
            if (stored) currentWatched = JSON.parse(stored);
        } catch (e) {
            currentWatched = [];
        }
    }

    checkAndNotifyAchievements();

    achievementContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 24px; padding: 30px; justify-items: center; align-items: center;">
            ${achievementsData.map((ach) => {
                const isUnlocked = typeof ach.check === "function" ? ach.check(currentWatched) : false;
                const iconPath = getBadgeIconPath(ach.badge);
                const tooltipText = `${ach.badge}\nRequirement: ${ach.requirement}`;
                
                return `
                    <div title="${tooltipText}" style="cursor: pointer; transition: transform 0.2s; opacity: ${isUnlocked ? '1' : '0.35'}; display: flex; justify-content: center; align-items: center;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <img src="${iconPath}" alt="${ach.badge}" style="width: 85px; height: 85px; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));" onerror="this.onerror=null; this.src='images/default-shield.png';">
                    </div>
                `;
            }).join('')}
        </div>
    `;
}
