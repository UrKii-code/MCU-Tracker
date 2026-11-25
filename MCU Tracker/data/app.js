// ========================================
// MCU TRACKER - APPLICATION ENGINE
// ========================================

// ===== Load watched items from browser localStorage ===== //
let watchedMovies = JSON.parse(localStorage.getItem("mcuWatchedList")) || [];

// Global reference for timeline rendering so modal and outer functions can access it
let renderTimeline;

document.addEventListener("DOMContentLoaded", () => {
    const timelineContainer = document.getElementById("mcu-timeline");
    const searchInput = document.getElementById("searchInput");
    const filterButtons = document.querySelectorAll(".filter");

    // Check that timeline container exists
    if (!timelineContainer) {
        console.error("MCU timeline container not found.");
        return;
    }

    if (typeof mcuTimeline === "undefined" || mcuTimeline.length === 0) {
        console.error("No MCU timeline data found.");
        return;
    }

    // Core Render Function assigned to global scope variable
    renderTimeline = function(dataToRender) {
        timelineContainer.innerHTML = "";

        if (!dataToRender || dataToRender.length === 0) {
            timelineContainer.innerHTML = `<p style="text-align: center; color: #b0b0b0; grid-column: 1 / -1; padding: 40px;">No matching movies or series found.</p>`;
            return;
        }

        dataToRender.forEach(movie => {
            const card = document.createElement("div");
            card.classList.add("movie-card");

            // Check if this movie is already marked as watched using movie.title
            const isWatched = watchedMovies.includes(movie.title);

            card.innerHTML = `
                <div class="movie-poster">
                    <img src="${movie.poster}" alt="${movie.title}" loading="lazy">
                </div>
                <div class="movie-info">
                    <div>
                        <h3>${movie.title}</h3>
                        <p>${movie.releaseYear || movie.timelineYear || ""}</p>
                        ${movie.season ? `<p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #94a3b8; margin: 3px 0;">Season ${movie.season}</p>` : ''}
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                            <span>${movie.type || ""}</span>
                            ${movie.userRating ? `<span style="font-size: 12px; color: #fbbf24; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-star"></i> ${movie.userRating}</span>` : ''}
                        </div>
                    </div>
                    <button class="watch-btn ${isWatched ? 'watched' : ''}" data-title="${movie.title}">
                        <i class="fa-solid ${isWatched ? 'fa-check-circle' : 'fa-circle'}"></i> 
                        ${isWatched ? 'Watched' : 'Mark Watched'}
                    </button>
                </div>
            `;

            // Open popup modal when clicking the movie card (prevent opening when clicking watch button)
            card.addEventListener("click", (e) => {
                if (!e.target.closest(".watch-btn")) {
                    openMovieModal(movie);
                }
            });

            // Watch button click handler
            const watchBtn = card.querySelector(".watch-btn");
            watchBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleWatchStatus(movie.title, watchBtn);
            });

            timelineContainer.appendChild(card);
        });
    };

    // Hero Button Handlers
    const continueBtn = document.getElementById("continueBtn");
    const timelineBtn = document.getElementById("timelineBtn");

    if (continueBtn) {
        continueBtn.addEventListener("click", () => {
            const nextProject = mcuTimeline.find(movie => !watchedMovies.includes(movie.title));
            if (nextProject) {
                openMovieModal(nextProject);
            } else {
                alert("You have completed all MCU projects! Amazing job!");
            }
        });
    }

    if (timelineBtn) {
        timelineBtn.addEventListener("click", () => {
            const statsSection = document.getElementById("statistics") || document.querySelector(".progress-wrapper") || document.querySelector(".stats-section");
            if (statsSection) {
                statsSection.scrollIntoView({ behavior: "smooth" });
            } else {
                window.location.hash = "#statistics";
            }
        });
    }

    // Combined Filter & Search Logic
    function filterAndSearchMovies() {
        const activeFilterBtn = document.querySelector(".filter.active");
        const filterValue = activeFilterBtn ? activeFilterBtn.getAttribute("data-filter") : "all";
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";

        let result = mcuTimeline;
        if (filterValue !== "all") {
            result = result.filter(movie => 
                movie.type && movie.type.toLowerCase() === filterValue.toLowerCase()
            );
        }

        if (searchTerm !== "") {
            result = result.filter(movie => 
                movie.title && movie.title.toLowerCase().includes(searchTerm)
            );
        }

        renderTimeline(result);
    }

    // Attach Event Listeners to Filter Buttons
    filterButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            filterButtons.forEach(btn => btn.classList.remove("active"));
            e.target.classList.add("active");
            filterAndSearchMovies();
        });
    });

    // Attach Event Listener to Search Input
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            filterAndSearchMovies();
        });
    }

    // Initial load calls
    renderTimeline(mcuTimeline);
    updateDashboard();
    updateStatistics();
    renderComingSoon();
    renderAchievements();
    updateContinueWatching();
});

// ===== Progress Dashboard & Statistics ===== //
function updateDashboard() {
    const totalProjects = Array.isArray(mcuTimeline) ? mcuTimeline.length : 0;

    let watchedCount = 0;
    if (Array.isArray(mcuTimeline) && Array.isArray(watchedMovies)) {
        // Normalize titles (lowercase and trim) to prevent mismatch bugs
        const normalizedWatched = watchedMovies.map(title => 
            typeof title === 'string' ? title.toLowerCase().trim() : ''
        );

        watchedCount = mcuTimeline.filter(movie => {
            if (!movie.title) return false;
            const movieTitle = movie.title.toLowerCase().trim();
            return normalizedWatched.includes(movieTitle);
        }).length;
    }

    const percentage = totalProjects > 0
        ? Math.min(Math.round((watchedCount / totalProjects) * 100), 100)
        : 0;

    const progressBar = document.getElementById("overallProgress");
    if (progressBar) {
        progressBar.style.width = percentage + "%";
    }

    const percentageElement = document.getElementById("overallPercentage");
    if (percentageElement) {
        percentageElement.textContent = percentage + "%";
    }

    const overallText = document.getElementById("overallText");
    if (overallText) {
        overallText.textContent = `${watchedCount} / ${totalProjects} Completed`;
    }

    const remainingText = document.getElementById("remainingText");
    if (remainingText) {
        const remaining = Math.max(totalProjects - watchedCount, 0);
        remainingText.textContent = `${remaining} Remaining`;
    }

    console.log(`MCU Progress: ${watchedCount} / ${totalProjects} (${percentage}%)`);
}

function updateStatistics() {
    if (typeof mcuTimeline === "undefined") return;

    let movies = 0;
    let series = 0;
    let specials = 0;
    let totalMinutes = 0;

    mcuTimeline.forEach(movie => {
        const type = (movie.type || "").toLowerCase();
        if (type.includes("movie")) movies++;
        else if (type.includes("series")) series++;
        else if (type.includes("special") || type.includes("one-shot")) specials++;

        if (movie.runtime) {
            const matches = movie.runtime.toString().match(/\d+/);
            if (matches) {
                totalMinutes += parseInt(matches[0], 10);
            }
        }
    });

    const movieCountEl = document.getElementById("movieCount");
    if (movieCountEl) movieCountEl.textContent = movies;

    const seriesCountEl = document.getElementById("seriesCount");
    if (seriesCountEl) seriesCountEl.textContent = series;

    const specialCountEl = document.getElementById("specialCount");
    if (specialCountEl) specialCountEl.textContent = specials;

    const runtimeCountEl = document.getElementById("runtimeCount");
    if (runtimeCountEl) {
        const totalHours = Math.round(totalMinutes / 60);
        runtimeCountEl.textContent = totalHours + "h";
    }
}

// ===== Watch Status Toggle Function ===== //
function toggleWatchStatus(movieTitle, buttonElement) {
    const index = watchedMovies.indexOf(movieTitle);

    if (index > -1) {
        watchedMovies.splice(index, 1);
        if (buttonElement) {
            buttonElement.classList.remove("watched");
            buttonElement.innerHTML = `<i class="fa-solid fa-circle"></i> Mark Watched`;
            buttonElement.style.background = "rgba(255,255,255,0.1)";
            buttonElement.style.border = "1px solid rgba(255,255,255,0.2)";
        }
    } else {
        watchedMovies.push(movieTitle);
        if (buttonElement) {
            buttonElement.classList.add("watched");
            buttonElement.innerHTML = `<i class="fa-solid fa-check-circle"></i> Watched`;
            buttonElement.style.background = "#16a34a";
            buttonElement.style.border = "1px solid #22c55e";
        }
    }

    // Remove Duplicates
    watchedMovies = [...new Set(watchedMovies)];

    // Save
    localStorage.setItem("mcuWatchedList", JSON.stringify(watchedMovies));
    
    // Update Everything
    checkAndNotifyAchievements();
    updateDashboard();
    updateStatistics();
    renderAchievements();
    updateContinueWatching();
}

// ===== Movie Details Popup ===== //
const modal = document.getElementById("detailsModal");
const modalBody = document.getElementById("modalBody");
const closeBtn = document.querySelector(".close");

function openMovieModal(movie) {
    if (!modal || !modalBody) return;

    const characterList = movie.characters && movie.characters.length > 0 
        ? movie.characters.join(", ") 
        : "N/A";

    // Synchronized check using movie.title
    const isWatched = watchedMovies.includes(movie.title);

    modalBody.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%;">
            
            ${movie.backdrop ? `
                <div style="position: absolute; inset: 0; background: url('${movie.backdrop}') center/cover no-repeat; opacity: 0.55; z-index: 1; pointer-events: none;"></div>
                <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(11,17,32,0.65), rgba(11,17,32,0.92)); z-index: 1; pointer-events: none;"></div>
            ` : ''}
            
            <div style="position: relative; z-index: 2; display: flex; gap: 30px; flex-wrap: wrap; align-items: stretch; height: 100%;">
                
                <img src="${movie.poster}" alt="${movie.title}" style="width: 210px; height: 315px; border-radius: 8px; object-fit: cover; box-shadow: 0 8px 25px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15);">
                
                <div style="flex: 1; min-width: 260px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="text-align: center; margin-bottom: 15px;">
                            ${movie.logo 
                                ? `<img src="${movie.logo}" alt="${movie.title}" style="max-height: 52px; max-width: 100%; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.7)); display: inline-block;">` 
                                : `<h2 style="color: var(--gold); font-family: 'Cinzel', serif; font-size: 26px;">${movie.title}</h2>`
                            }
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; margin-bottom: 15px; font-size: 13.5px;">
                            <p style="color: #cbd5e1; margin: 0;"><strong>Release:</strong> <span style="color: #94a3b8;">${movie.releaseDate || movie.timelineYear || "N/A"}</span></p>
                            <p style="color: #cbd5e1; margin: 0;"><strong>Category:</strong> <span style="color: #94a3b8;">${movie.type || "N/A"}</span></p>
                            ${movie.season ? `<p style="color: #cbd5e1; margin: 0;"><strong>Season:</strong> <span style="color: #94a3b8;">${movie.season}</span></p>` : ''}
                            ${movie.episodes ? `<p style="color: #cbd5e1; margin: 0;"><strong>Episodes:</strong> <span style="color: #94a3b8;">${movie.episodes}</span></p>` : ''}
                            <p style="color: #cbd5e1; margin: 0;"><strong>Runtime:</strong> <span style="color: #94a3b8;">${movie.runtime ? movie.runtime + " mins" : "N/A"}</span></p>
                            <p style="color: #cbd5e1; margin: 0;"><strong>Rating:</strong> <span style="color: #fbbf24; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-star"></i> ${movie.userRating || "N/A"}</span></p>
                            <p style="color: #cbd5e1; margin: 0;"><strong>Streaming:</strong> <span style="color: #38bdf8; font-weight: 600;">${movie.streaming || "N/A"}</span></p>
                            <p style="color: #cbd5e1; margin: 0;"><strong>Director:</strong> <span style="color: #94a3b8;">${movie.director || "N/A"}</span></p>
                        </div>

                        <p style="color: #cbd5e1; font-size: 13px; margin-bottom: 12px;"><strong>Characters:</strong> <span style="color: #94a3b8;">${characterList}</span></p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            ${movie.icon ? `
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    ${Array.isArray(movie.icon) 
                                        ? movie.icon.map(iconPath => `
                                            <a href="${movie.streamingUrl || '#'}" target="_blank" title="Watch ${movie.title} Directly" style="display: inline-block; cursor: pointer;">
                                                <img src="${iconPath}" alt="Icon" style="width: 45px; height: 45px; object-fit: contain; display: block;">
                                            </a>
                                        `).join('')
                                        : `
                                            <a href="${movie.streamingUrl || '#'}" target="_blank" title="Watch ${movie.title} Directly" style="display: inline-block; cursor: pointer;">
                                                <img src="${movie.icon}" alt="Icon" style="width: 55px; height: 55px; object-fit: contain; display: block;">
                                            </a>
                                        `
                                    }
                                </div>
                            ` : '<div></div>'}

                            <button id="modal-watch-btn" class="watch-btn ${isWatched ? 'watched' : ''}" style="background: ${isWatched ? '#16a34a' : 'rgba(255,255,255,0.1)'}; color: white; border: 1px solid ${isWatched ? '#22c55e' : 'rgba(255,255,255,0.2)'}; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                                <i class="fa-solid ${isWatched ? 'fa-check-circle' : 'fa-circle'}"></i> 
                                ${isWatched ? 'Watched' : 'Mark Watched'}
                            </button>
                        </div>
                    </div>
                    
                    <p style="color: #e2e8f0; line-height: 1.6; font-size: 13.5px; background: rgba(0,0,0,0.35); padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">${movie.description || "Detailed synopsis coming soon for this project."}</p>
                </div>
            </div>
        </div>
    `;

    // Hook up modal button to toggle function and safely re-render background cards
    const modalWatchBtn = modalBody.querySelector('#modal-watch-btn');
    if (modalWatchBtn) {
        modalWatchBtn.onclick = function() {
            toggleWatchStatus(movie.title, modalWatchBtn);
            if (typeof renderTimeline === 'function') {
                renderTimeline(mcuTimeline);
            }
            updateContinueWatching();
        };
    }

    modal.style.display = "block";
}

// Close modal when clicking the 'X' button
if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

// Close modal when clicking anywhere outside the modal box
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

// ===== Coming Soon ===== //
function renderComingSoon() {
    const comingSoonContainer = document.getElementById("comingSoonContainer");
    if (!comingSoonContainer) return;

    const upcomingData = typeof upcoming !== "undefined" ? upcoming : mcuTimeline.filter(movie => {
        const releaseYear = new Date(movie.releaseDate).getFullYear();
        return releaseYear >= 2026;
    });

    comingSoonContainer.innerHTML = "";

    if (!upcomingData || upcomingData.length === 0) {
        comingSoonContainer.innerHTML = `<p style="text-align: center; color: #b0b0b0; grid-column: 1 / -1; padding: 30px;">No upcoming projects announced.</p>`;
        return;
    }

    upcomingData.forEach(movie => {
        const card = document.createElement("div");
        card.classList.add("movie-card");

        card.innerHTML = `
            <div class="movie-poster">
                <img src="${movie.poster}" alt="${movie.title}" loading="lazy">
            </div>
            <div class="movie-info">
                <div>
                    <h3>${movie.title}</h3>
                    <p>${movie.releaseDate || movie.timelineYear || "TBA"}</p>
                    <span>${movie.type || "Upcoming"}</span>
                </div>
            </div>
        `;

        card.addEventListener("click", () => {
            openMovieModal(movie);
        });

        comingSoonContainer.appendChild(card);
    });
}

// ===== Continue Watching / Next Up ===== //
function updateContinueWatching() {
    const continueContainer = document.getElementById("continueWatchingContainer");
    if (!continueContainer) return;

    const nextProject = mcuTimeline.find(movie => !watchedMovies.includes(movie.title));

    if (!nextProject) {
        continueContainer.innerHTML = `
            <div style="background: var(--glass); padding: 25px; border-radius: 15px; text-align: center; border: 1px solid var(--border);">
                <h3 style="color: var(--gold); margin-bottom: 8px; font-family: 'Cinzel', serif;">Congratulations! 🎉</h3>
                <p style="color: #b0b0b0; font-size: 14px;">You have completed the entire MCU timeline available so far!</p>
            </div>
        `;
        return;
    }

    continueContainer.innerHTML = `
        <div style="background: var(--glass); border-radius: 18px; padding: 25px; border: 1px solid var(--border); box-shadow: var(--shadow); display: flex; gap: 20px; flex-wrap: wrap; align-items: center; position: relative; overflow: hidden;">
            
            ${nextProject.backdrop ? `
                <div style="position: absolute; inset: 0; background: url('${nextProject.backdrop}') center/cover no-repeat; opacity: 0.15; z-index: 1;"></div>
            ` : ''}

            <div style="position: relative; z-index: 2; display: flex; gap: 20px; width: 100%; align-items: center; flex-wrap: wrap;">
                <img src="${nextProject.poster}" alt="${nextProject.title}" style="width: 100px; height: 150px; border-radius: 8px; object-fit: cover; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                
                <div style="flex: 1; min-width: 220px; position: relative; z-index: 2;">
                    <span style="font-size: 11px; text-transform: uppercase; background: rgba(255,215,0,0.15); color: var(--gold); padding: 4px 10px; border-radius: 20px; font-weight: bold; letter-spacing: 0.5px;">Next Up in Timeline</span>
                    <h3 style="color: #fff; font-size: 20px; margin: 8px 0 6px 0; font-family: 'Cinzel', serif;">${nextProject.title}</h3>
                    <p style="color: #b0b0b0; font-size: 13px; margin-bottom: 12px;">${nextProject.releaseDate || nextProject.timelineYear || ""} • ${nextProject.type || ""}</p>
                    
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <button class="watch-btn" id="nextUpWatchBtn" style="margin-top: 0;">
                            <i class="fa-solid fa-check-circle"></i> Mark Watched
                        </button>
                        <button class="filter" id="nextUpDetailsBtn" style="margin-top: 0; background: rgba(255,255,255,0.1);">
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
            toggleWatchStatus(nextProject.title, watchBtn);
            if (typeof renderTimeline === 'function') {
                renderTimeline(mcuTimeline);
            }
            updateContinueWatching();
            renderAchievements();
        });
    }

    if (detailsBtn) {
        detailsBtn.addEventListener("click", () => {
            openMovieModal(nextProject);
        });
    }
}

// ===== Secret Logo Reset (3x Click) ===== //
let resetClickCount = 0;
let resetTimer = null;

const logoTrigger = document.getElementById("logoResetTrigger");

if (logoTrigger) {
    logoTrigger.addEventListener("click", () => {
        resetClickCount++;
        clearTimeout(resetTimer);
        
        if (resetClickCount === 3) {
            resetClickCount = 0;
            promptForResetPassword();
        } else {
            resetTimer = setTimeout(() => {
                resetClickCount = 0;
            }, 2000);
        }
    });
}

function promptForResetPassword() {
    const passwordInput = prompt("⚡ Perfectly balanced, as all things should be...\nEnter the secret password to trigger the Thanos Snap (Reset Data):");
    
    if (passwordInput === "thanos") {
        const choice = confirm("Snap your fingers? This will wipe half the universe (Reset your Watchlist). Proceed?");
        
        if (choice) {
            localStorage.removeItem("mcuWatchedList");
            localStorage.removeItem("mcu_unlocked_achievements");
            watchedMovies = [];
            
            updateDashboard();
            renderTimeline(mcuTimeline);
            renderAchievements();
            updateContinueWatching();
            
            alert("💥 *SNAP* \n\nThe watchlist and achievements have been reduced to atoms. Everything is reset.");
        }
    } else if (passwordInput !== null) {
        alert("🛡️ 'Dread it. Run from it. Destiny arrives all the same.'\n\nIncorrect password. Access denied.");
    }
}

// ===== Timeline Progress Bar ===== //
function toggleBranches(branchId) {
    const branches = document.getElementById(branchId);
    if (!branches) return;
    branches.classList.toggle("active");
}

function loadPhase(phaseName, element) {
    console.log("Loading watchlist for:", phaseName);

    document
        .querySelectorAll(".phase-node")
        .forEach(node => {
            node.classList.remove("selected");
        });

    if (element) {
        const phaseNode =
            element.querySelector(".phase-node");
        if (phaseNode) {
            phaseNode.classList.add("selected");
        }
    }

    if (typeof mcuTimeline !== "undefined") {
        const movies = mcuTimeline.filter(movie => {
            return movie.timelineSection === phaseName;
        });

        console.log(
            `Found ${movies.length} movies for ${phaseName}`,
            movies
        );
    }
}
