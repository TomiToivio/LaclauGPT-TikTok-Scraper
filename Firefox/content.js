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

// Generic promise handlers for storage actions
function setItem() {
    // Placeholder for future success logic
}

function onError(error) {
    console.log("Storage error:", error);
}

// Store specific data items locally
function setScrapedCountry(country) {
    browser.storage.local.set({ scrapedCountry: { country } }).then(setItem, onError);
}

function setScrapedType(type) {
    browser.storage.local.set({ scrapedType: { type } }).then(setItem, onError);
}

function setScrapedItem(item) {
    browser.storage.local.set({ scrapedItem: { item } }).then(setItem, onError);
}

function setScrapedUrl(url) {
    browser.storage.local.set({ scrapedUrl: { url } }).then(setItem, onError);
}

// Detect current page type and act accordingly
function check_current_page() {
    const url = window.location.href;
    if (url.includes("search") || url.includes("tag") || (url.includes("@") && !url.includes("video"))) {
        click_random_video();
    } else {
        search_or_hashtag_or_user();
    }
}

// Click a random video link from the page
function click_random_video() {
    const links = Array.from(document.getElementsByTagName('a'));
    const videos = links.filter(link => link.href.includes("/video/"));
    if (!videos.length) {
        window.location.assign("https://www.tiktok.com/");
        return;
    }
    videos[Math.floor(Math.random() * videos.length)].click();
}

// Random choice between search, hashtag, or user
function search_or_hashtag_or_user() {
    updateCountry();
    const r = Math.floor(Math.random() * 3);
    if (r === 0) searchWait();
    if (r === 1) go_to_hashtag();
    if (r === 2) go_to_candidate_page();
}

// Delay-based navigation retry
function random_wait() {
    setTimeout(search_or_hashtag_or_user, Math.floor(Math.random() * 60000));
}

// Navigate to a candidate user profile
function go_to_candidate_page() {
    const name = candidate_usernames[Math.floor(Math.random() * candidate_usernames.length)];
    const url = `https://www.tiktok.com/@${name}${lang_for_url()}`;
    setScrapedCountry(country);
    setScrapedType("user");
    setScrapedItem(name);
    setScrapedUrl(url);
    window.location.assign(url);
}

// Search for a political query
function search_for_political_videos() {
    const query = candidate_search_queries[Math.floor(Math.random() * candidate_search_queries.length)];
    const url = `https://www.tiktok.com/search?q=${query.replace(/\s/g, '%20')}`;
    setScrapedCountry(country);
    setScrapedType("search");
    setScrapedItem(query);
    setScrapedUrl(url);

    const input = Array.from(document.getElementsByTagName("input"))
        .find(i => i.getAttribute("data-e2e") === "search-user-input");
    const form = Array.from(document.getElementsByTagName("form"))
        .find(f => f.getAttribute("data-e2e") === "search-box");

    if (input && form) {
        input.value = query;
        form.submit();
    }
}

// Navigate to a hashtag feed
function go_to_hashtag() {
    const tag = candidate_hashtags[Math.floor(Math.random() * candidate_hashtags.length)];
    const url = `https://www.tiktok.com/tag/${tag}${lang_for_url()}`;
    setScrapedCountry(country);
    setScrapedType("hashtag");
    setScrapedItem(tag);
    setScrapedUrl(url);
    window.location.assign(url);
}

// Scrolls or clicks back depending on the context
function scrollerMania() {
    const url = window.location.href;
    if (url.includes("search") || url.includes("tag") || (url.includes("@") && !url.includes("video"))) {
        window.scrollTo(0, document.body.scrollHeight);
    } else if (url.includes("@") && url.includes("video")) {
        const btn = Array.from(document.getElementsByTagName("button"))
            .find(b => b.getAttribute("data-e2e") === "arrow-left");
        if (btn) btn.click();
    }
}

// Randomly initiates search
function searchWait() {
    setInterval(search_for_political_videos, 5000);
}

// Language string generation
// Just leave EP2024 countries here.
function lang_for_url() {
    const map = {
        "Bulgaria": "bg-BG", "Croatia": "hr-HR", "Finland": "fi-FI",
        "France": "fr-FR", "Germany": "de-DE", "Global": "en-IE",
        "Hungary": "hu-HU", "Poland": "pl-PL", "Portugal": "pt-PT",
        "Spain": "es-ES", "Sweden": "sv-SE"
    };
    return `?lang=${map[country] || "en-IE"}`;
}

// Updates country and sets candidates for scraping
// Settings used for EP2024 elections are removed.
// This is awkward on purpose, had to be modified all the time.
// You need to do something here to use this. Remember: academic and research use only!
function updateCountry() {
    const countries = ["Global"];
    country = countries[Math.floor(Math.random() * countries.length)];
    // Settings used for EP2024 elections are removed.
    // You need to do something here to use this. Remember: academic and research use only!
    candidate_search_queries = [];
    candidate_usernames = [];
    candidate_hashtags = [];
}

// Global variables for data source per country
let country = "";
let candidate_search_queries = [];
let candidate_usernames = [];
let candidate_hashtags = [];

// Triggers
setInterval(scrollerMania, 5000);
setInterval(() => {
    scrollerMania();
    check_current_page();
}, 10000);
