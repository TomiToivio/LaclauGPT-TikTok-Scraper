/**
 * LaclauGPT TikTok Scraper for EP24 Elections
 * ---------------------------------------------
 * This script automates browsing behavior on TikTok
 * by randomly visiting user pages, hashtag feeds,
 * or performing searches, and storing metadata.
 *
 * Author: Tomi Toivio
 * License: CC0 1.0 Universal
 * Released for academic and research documentation.
 */

// Configure research targets here. Empty lists are safe: automatic navigation
// stays idle while passive API collection can still work on pages you visit.
const SCRAPE_CONFIG = {
    Global: {
        searchQueries: [],
        usernames: [],
        hashtags: []
    }
};

function onError(error) {
    console.error("Storage error:", error);
}

function setScrapedCountry(country) {
    browser.storage.local.set({ scrapedCountry: country }).catch(onError);
}

function setScrapedType(type) {
    browser.storage.local.set({ scrapedType: type }).catch(onError);
}

function setScrapedItem(item) {
    browser.storage.local.set({ scrapedItem: item }).catch(onError);
}

function setScrapedUrl(url) {
    browser.storage.local.set({ scrapedUrl: url }).catch(onError);
}

function pickRandom(items) {
    if (!Array.isArray(items) || items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
}

function hasConfiguredTargets() {
    return Object.values(SCRAPE_CONFIG).some((config) =>
        (Array.isArray(config?.searchQueries) && config.searchQueries.length > 0) ||
        (Array.isArray(config?.usernames) && config.usernames.length > 0) ||
        (Array.isArray(config?.hashtags) && config.hashtags.length > 0)
    );
}

function check_current_page() {
    const url = window.location.href;
    if (url.includes("search") || url.includes("tag") || (url.includes("@") && !url.includes("video"))) {
        click_random_video();
    } else {
        search_or_hashtag_or_user();
    }
}

function click_random_video() {
    const links = Array.from(document.getElementsByTagName('a'));
    const videos = links.filter((link) => link.href.includes("/video/"));
    const video = pickRandom(videos);
    if (video) {
        video.click();
    }
}

function search_or_hashtag_or_user() {
    updateCountry();

    const actions = [];
    if (candidate_search_queries.length > 0) actions.push(searchWait);
    if (candidate_hashtags.length > 0) actions.push(go_to_hashtag);
    if (candidate_usernames.length > 0) actions.push(go_to_candidate_page);

    const action = pickRandom(actions);
    if (action) {
        action();
    }
}

function go_to_candidate_page() {
    const name = pickRandom(candidate_usernames);
    if (!name) return;

    const url = `https://www.tiktok.com/@${encodeURIComponent(name)}${lang_for_url()}`;
    setScrapedCountry(country);
    setScrapedType("user");
    setScrapedItem(name);
    setScrapedUrl(url);
    window.location.assign(url);
}

function search_for_political_videos() {
    const query = pickRandom(candidate_search_queries);
    if (!query) return;

    const url = `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`;
    setScrapedCountry(country);
    setScrapedType("search");
    setScrapedItem(query);
    setScrapedUrl(url);

    const input = Array.from(document.getElementsByTagName("input"))
        .find((element) => element.getAttribute("data-e2e") === "search-user-input");
    const form = Array.from(document.getElementsByTagName("form"))
        .find((element) => element.getAttribute("data-e2e") === "search-box");

    if (input && form) {
        input.value = query;
        form.submit();
    } else {
        window.location.assign(url);
    }
}

function go_to_hashtag() {
    const tag = pickRandom(candidate_hashtags);
    if (!tag) return;

    const cleanTag = String(tag).replace(/^#/, '');
    const url = `https://www.tiktok.com/tag/${encodeURIComponent(cleanTag)}${lang_for_url()}`;
    setScrapedCountry(country);
    setScrapedType("hashtag");
    setScrapedItem(cleanTag);
    setScrapedUrl(url);
    window.location.assign(url);
}

function scrollerMania() {
    const url = window.location.href;
    if (url.includes("search") || url.includes("tag") || (url.includes("@") && !url.includes("video"))) {
        window.scrollTo(0, document.body.scrollHeight);
    } else if (url.includes("@") && url.includes("video")) {
        const button = Array.from(document.getElementsByTagName("button"))
            .find((element) => element.getAttribute("data-e2e") === "arrow-left");
        if (button) button.click();
    }
}

function searchWait() {
    // One-shot delay. The old setInterval() could create multiple overlapping
    // search loops every time this action was selected.
    setTimeout(search_for_political_videos, 5000);
}

function lang_for_url() {
    const map = {
        "Bulgaria": "bg-BG", "Croatia": "hr-HR", "Finland": "fi-FI",
        "France": "fr-FR", "Germany": "de-DE", "Global": "en-IE",
        "Hungary": "hu-HU", "Poland": "pl-PL", "Portugal": "pt-PT",
        "Spain": "es-ES", "Sweden": "sv-SE"
    };
    return `?lang=${map[country] || "en-IE"}`;
}

function updateCountry() {
    const countries = Object.keys(SCRAPE_CONFIG);
    country = pickRandom(countries) || "Global";

    const config = SCRAPE_CONFIG[country] || {};
    candidate_search_queries = Array.isArray(config.searchQueries) ? config.searchQueries : [];
    candidate_usernames = Array.isArray(config.usernames) ? config.usernames : [];
    candidate_hashtags = Array.isArray(config.hashtags) ? config.hashtags : [];
}

let country = "Global";
let candidate_search_queries = [];
let candidate_usernames = [];
let candidate_hashtags = [];

updateCountry();

if (hasConfiguredTargets()) {
    setInterval(scrollerMania, 5000);
    setInterval(() => {
        scrollerMania();
        check_current_page();
    }, 10000);
} else {
    console.info("LaclauGPT automatic browsing is idle because SCRAPE_CONFIG has no targets.");
}
