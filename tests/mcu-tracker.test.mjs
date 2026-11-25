import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import http from "node:http";
import { createApp } from "../server.js";

const appDir = path.join(process.cwd(), "MCU Tracker");
const dataDir = path.join(appDir, "data");

function createBrowserMock(initialStorage = {}) {
  const store = { ...initialStorage };
  const elements = new Map();

  const makeEl = (id) => ({
    id,
    innerHTML: "",
    textContent: "",
    value: "",
    style: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._set.has(c)) { this._set.delete(c); return false; }
          this._set.add(c); return true;
        }
        if (force) this._set.add(c); else this._set.delete(c);
        return force;
      },
      contains(c) { return this._set.has(c); }
    },
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] ?? null; },
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    appendChild() {},
    prepend() {},
    remove() {},
    scrollIntoView() {}
  });

  const ids = [
    "mcu-timeline", "searchInput", "movieCount", "seriesCount", "specialCount",
    "runtimeCount", "overallProgress", "overallPercentage", "overallText",
    "remainingText", "comingSoonContainer", "achievementContainer",
    "continueWatchingContainer", "detailsModal", "modalBody", "logoResetTrigger",
    "activePhaseBanner", "activePhaseLabel", "clearPhaseFilter"
  ];
  for (const id of ids) elements.set(id, makeEl(id));

  const domListeners = {};

  const ctx = {
    console: { log: () => {}, warn: () => {}, error: console.error },
    URL,
    Date,
    Math,
    Set,
    Map,
    Array,
    Number,
    String,
    JSON,
    parseInt,
    setTimeout: () => 0,
    clearTimeout: () => {},
    localStorage: {
      getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    document: {
      body: { style: {}, appendChild() {} },
      getElementById: (id) => elements.get(id) || null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => makeEl("dynamic"),
      createDocumentFragment: () => ({ appendChild() {} }),
      addEventListener: (ev, fn) => {
        domListeners[ev] = domListeners[ev] || [];
        domListeners[ev].push(fn);
      }
    },
    window: {
      addEventListener() {}
    }
  };

  vm.createContext(ctx);
  const scripts = [
    "infinity-part1.js",
    "infinity-part2.js",
    "infinity-part3.js",
    "multiverse-saga.js",
    "multiverse-collection.js",
    "upcoming.js",
    "data.js",
    "achievement.js",
    "app.js"
  ];
  for (const file of scripts) {
    vm.runInContext(fs.readFileSync(path.join(dataDir, file), "utf8"), ctx, { filename: file });
  }

  return { ctx, store, elements };
}

test("Dataset loads all 125 items sorted by timelineOrder with valid dates & images", () => {
  const { ctx } = createBrowserMock();
  const timeline = vm.runInContext("mcuTimeline", ctx);
  assert.equal(timeline.length, 125);
  for (let i = 1; i < timeline.length; i++) {
    assert.ok(
      timeline[i].timelineOrder >= timeline[i - 1].timelineOrder,
      `Timeline unsorted at index ${i}`
    );
  }
});

test("Category filters and search work across movies, series, one-shots, animation, and characters", () => {
  const { ctx } = createBrowserMock();
  const timeline = vm.runInContext("mcuTimeline", ctx);
  const matchesCategory = vm.runInContext("matchesCategoryFilter", ctx);
  const matchesSearch = vm.runInContext("matchesSearchTerm", ctx);
  const matchesPhase = vm.runInContext("matchesPhaseFilter", ctx);

  const oneShots = timeline.filter(m => matchesCategory(m, "oneshot"));
  assert.equal(oneShots.length, 9);

  const animated = timeline.filter(m => matchesCategory(m, "animation"));
  assert.equal(animated.length, 10);

  const tonyMatches = timeline.filter(m => matchesSearch(m, "Tony Stark"));
  assert.ok(tonyMatches.length >= 3);

  const phase1 = timeline.filter(m => matchesPhase(m, "phase-one"));
  assert.ok(phase1.length >= 6);
});

test("LocalStorage survives corrupted data and migrates legacy multi-season titles non-destructively", () => {
  const corrupted = createBrowserMock({ mcuWatchedList: "{broken-json" });
  assert.deepEqual(Array.from(vm.runInContext("watchedMovies", corrupted.ctx)), []);

  const legacy = createBrowserMock({ mcuWatchedList: JSON.stringify(["Iron Man", "Loki"]) });
  const migrated = Array.from(vm.runInContext("watchedMovies", legacy.ctx));
  assert.ok(migrated.includes("Iron Man"));
  assert.ok(migrated.includes("Loki (Season 1)"));
  assert.ok(migrated.includes("Loki (Season 2)"));
});

test("Progress, statistics, and multi-season independent toggling are accurate and never exceed 100%", () => {
  const { ctx, elements } = createBrowserMock();
  vm.runInContext("updateStatistics()", ctx);
  vm.runInContext("updateDashboard()", ctx);

  assert.equal(elements.get("movieCount").textContent, "61");
  assert.equal(elements.get("seriesCount").textContent, "55");
  assert.equal(elements.get("specialCount").textContent, "9");
  assert.equal(elements.get("overallText").textContent, "0 / 125 Completed");
  assert.equal(elements.get("remainingText").textContent, "125 Remaining");

  // Toggle Loki Season 1 only — Season 2 must remain unwatched
  vm.runInContext('toggleWatchStatus("Loki (Season 1)")', ctx);
  assert.equal(elements.get("overallText").textContent, "1 / 125 Completed");
  assert.equal(elements.get("remainingText").textContent, "124 Remaining");
  assert.equal(elements.get("overallPercentage").textContent, "1%");

  const loki2Watched = vm.runInContext(
    'isProjectWatched(mcuTimeline.find(m => m.title === "Loki" && m.season === 2), watchedMovies)',
    ctx
  );
  assert.equal(loki2Watched, false);
});

test("Achievements unlock only when real requirements are met", () => {
  const { ctx } = createBrowserMock();
  const timeline = vm.runInContext("mcuTimeline", ctx);
  const getKey = vm.runInContext("getProjectKey", ctx);

  // Watching 23 X-Men/random titles must NOT unlock Infinity Saga or MCU Completionist
  ctx.testWatched = timeline.slice(-23).map(m => getKey(m));
  const sagaCollector = vm.runInContext('achievementsData.find(a => a.id === "saga-collector").check(testWatched)', ctx);
  const completionist = vm.runInContext('achievementsData.find(a => a.id === "mcu-completionist").check(testWatched)', ctx);
  assert.equal(sagaCollector, false);
  assert.equal(completionist, false);

  // Defenders of New York unlocks when all 7 required Netflix/D+ titles (all seasons) are watched
  const defenderTitles = [
    "Marvel's Daredevil",
    "Marvel's Jessica Jones",
    "Marvel's Luke Cage",
    "Marvel's Iron Fist",
    "Marvel's The Defenders",
    "Marvel's The Punisher",
    "Echo"
  ];
  ctx.testWatched = timeline
    .filter(m => defenderTitles.includes(m.title))
    .map(m => getKey(m));
  const defenders = vm.runInContext('achievementsData.find(a => a.id === "defenders-of-new-york").check(testWatched)', ctx);
  assert.equal(defenders, true);
});

test("XSS escaping and URL sanitization block malicious scripts and javascript: URLs", () => {
  const { ctx } = createBrowserMock();
  const escapeHtml = vm.runInContext("escapeHtml", ctx);
  const sanitizeUrl = vm.runInContext("sanitizeUrl", ctx);

  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.equal(sanitizeUrl("javascript:alert(1)", false), "");
  assert.equal(sanitizeUrl("javascript:alert(1)", true), "");
  assert.equal(sanitizeUrl("https://disneyplus.com/movies/iron-man", false), "https://disneyplus.com/movies/iron-man");
  assert.equal(sanitizeUrl("images/posters/ironman.jpg", true), "images/posters/ironman.jpg");
});

test("Express server serves static assets and returns 404 for missing files", async () => {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const rootRes = await fetch(`${baseUrl}/`);
    assert.equal(rootRes.status, 200);
    assert.equal(rootRes.headers.get("x-content-type-options"), "nosniff");

    const cssRes = await fetch(`${baseUrl}/style.css`);
    assert.equal(cssRes.status, 200);

    const jsRes = await fetch(`${baseUrl}/data/app.js`);
    assert.equal(jsRes.status, 200);

    const missingRes = await fetch(`${baseUrl}/images/does-not-exist.png`);
    assert.equal(missingRes.status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
