/**
 * LaclauGPT TikTok Scraper for EP24 Elections
 * ---------------------------------------
 * Intercepts TikTok API calls from the browser, parses responses,
 * and posts structured data to a local backend.
 *
 * Author: Tomi Toivio
 * License: CC0 1.0 Universal
 *
 * Released for academic and research documentation. Not tested or maintained after 2024.
 */

const BACKEND_URL = "http://localhost:3000/tiktok/";

function listener(details) {
    const requestUrl = details.url;
    let responseDatas = "";

    const filter = browser.webRequest.filterResponseData(details.requestId);
    const decoder = new TextDecoder("utf-8");

    filter.ondata = (event) => {
        responseDatas += decoder.decode(event.data, { stream: true });
        // Forward the original bytes unchanged. Re-encoding decoded chunks can corrupt
        // multibyte characters split across network chunks.
        filter.write(event.data);
    };

    filter.onstop = () => {
        responseDatas += decoder.decode();
        filter.close();

        try {
            const parsedData = JSON.parse(responseDatas);
            dataGrabber(parsedData, requestUrl);
        } catch (error) {
            console.error("Failed to parse JSON from", requestUrl, error);
        }
    };

    filter.onerror = () => {
        console.error("Failed to intercept response from", requestUrl, filter.error);
    };

    return {};
}

async function post_to_backend(data, endpoint) {
    try {
        const response = await fetch(BACKEND_URL + endpoint, {
            method: 'POST',
            credentials: 'omit',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.error(`[ERROR] ${endpoint}: backend returned ${response.status}`);
            return;
        }
        console.debug(`[OK] ${endpoint}`);
    } catch (error) {
        console.error(`[ERROR] ${endpoint}:`, error);
    }
}

function unwrapStored(value, key) {
    if (value && typeof value === 'object' && key in value) {
        return value[key];
    }
    return value ?? "";
}

async function getScrapeContext() {
    const stored = await browser.storage.local.get([
        'scrapedCountry',
        'scrapedUrl',
        'scrapedType',
        'scrapedItem'
    ]);

    return {
        scrapedCountry: unwrapStored(stored.scrapedCountry, 'country'),
        scrapedUrl: unwrapStored(stored.scrapedUrl, 'url'),
        scrapedType: unwrapStored(stored.scrapedType, 'type'),
        scrapedItem: unwrapStored(stored.scrapedItem, 'item'),
        scrapedTime: new Date().toISOString()
    };
}

function dataGrabber(parsedData, requestUrl) {
    if (requestUrl.includes("comment")) {
        parseCommentList(parsedData);
    } else if (requestUrl.includes("search/general/full")) {
        parseSearchResults(parsedData);
    } else if (requestUrl.includes("post/item_list")) {
        parseVideoList(parsedData);
    } else if (requestUrl.includes("challenge/item_list")) {
        parseChallengeList(parsedData);
    } else if (requestUrl.includes("user/detail")) {
        parseUserDetails(parsedData);
    } else if (requestUrl.includes("challenge/detail")) {
        parseHashTagDetails(parsedData);
    } else if (requestUrl.includes("user/playlist")) {
        parseUserPlaylist(parsedData);
    } else {
        console.debug("Unhandled TikTok API URL:", requestUrl);
    }
}

async function parseVideoItem(videoData) {
    if (!videoData || typeof videoData !== 'object' || !videoData.id) {
        return;
    }

    const videoId = videoData.id;
    const author = videoData.author ?? {};
    const stats = videoData.stats ?? {};
    const music = videoData.music ?? {};
    const video = videoData.video ?? {};
    const hashtags = Array.isArray(videoData.textExtra) ? videoData.textExtra : [];

    for (const tag of hashtags) {
        const hashtagId = tag?.hashtagId;
        const hashtagName = tag?.hashtagName;
        if (hashtagId && hashtagName) {
            void post_to_backend({
                video_id: videoId,
                hashtag_id: hashtagId,
                hashtag_name: hashtagName,
                hashtag_hash: `${videoId}:${hashtagId}`
            }, "hashtag");
        }
    }

    let scrapeContext = {};
    try {
        scrapeContext = await getScrapeContext();
    } catch (error) {
        console.error("Failed to read scrape context from extension storage", error);
    }

    const createdUnix = Number(videoData.createTime);
    const createdDate = Number.isFinite(createdUnix)
        ? new Date(createdUnix * 1000).toISOString()
        : "";
    const canonicalVideoUrl = author.uniqueId
        ? `https://www.tiktok.com/@${author.uniqueId}/video/${videoId}`
        : "";

    const video_data = {
        videoId,
        videoDescription: videoData.desc,
        videoCreated: videoData.createTime,
        authorId: author.id,
        authorUniqueId: author.uniqueId,
        authorNickname: author.nickname,
        authorAvatar: author.avatarLarger,
        authorSignature: author.signature,
        authorDiggCount: videoData.authorStats?.diggCount ?? 0,
        authorFollowerCount: videoData.authorStats?.followerCount ?? 0,
        authorFollowingCount: videoData.authorStats?.followingCount ?? 0,
        authorFriendCount: videoData.authorStats?.friendCount ?? 0,
        authorHeart: videoData.authorStats?.heart ?? 0,
        authorHeartCount: videoData.authorStats?.heartCount ?? 0,
        authorVideoCount: videoData.authorStats?.videoCount ?? 0,
        videoUrl: video.downloadAddr,
        videoCover: video.cover,
        videoDuration: video.duration,
        videoHeight: video.height,
        videoWidth: video.width,
        videoRatio: video.ratio,
        videoPlayCount: stats.playCount,
        videoShareCount: stats.shareCount,
        videoCommentCount: stats.commentCount,
        videoDiggCount: stats.diggCount,
        videoCollectCount: stats.collectCount,
        videoMusicId: music.id,
        videoMusicTitle: music.title,
        videoMusicAuthor: music.authorName,
        videoMusicOriginal: music.original,
        videoMusicCover: music.coverLarge,
        videoMusicPlayUrl: music.playUrl,
        videoMusicDuration: music.duration,
        ...scrapeContext,
        scrapedFilename: "",
        scrapedVideoCreatedDate: createdDate,
        scrapedVideoTikTokUrl: canonicalVideoUrl,
        scrapedVideoWarning: ""
    };

    await post_to_backend(video_data, "video");
}

function parseVideoList(parsedData) {
    const videoList = Array.isArray(parsedData?.itemList) ? parsedData.itemList : [];
    for (const videoData of videoList) {
        void parseVideoItem(videoData);
    }
}

function parseChallengeList(parsedData) {
    parseVideoList(parsedData);
}

function parseUserPlaylist(parsedData) {
    const itemList = Array.isArray(parsedData?.itemList) ? parsedData.itemList : [];
    for (const item of itemList) {
        if (item?.item) {
            void parseVideoItem(item.item);
        }
    }
}

function parseSearchResults(parsedData) {
    const itemList = Array.isArray(parsedData?.data) ? parsedData.data : [];
    for (const item of itemList) {
        if (item?.type === 1 && item.item) {
            void parseVideoItem(item.item);
        }
    }
}

function parseCommentList(parsedData) {
    const comments = Array.isArray(parsedData?.comments) ? parsedData.comments : [];
    for (const comment of comments) {
        if (!comment?.cid) continue;
        const user = comment.user ?? {};
        const share = comment.share_info ?? {};
        void post_to_backend({
            aweme_id: comment.aweme_id,
            cid: comment.cid,
            collect_stat: comment.collect_stat,
            comment_language: comment.comment_language,
            comment_text: comment.text,
            create_time: comment.create_time,
            digg_count: comment.digg_count,
            reply_comment_total: comment.reply_comment_total,
            reply_id: comment.reply_id,
            reply_to_reply_id: comment.reply_to_reply_id,
            desc: share.desc,
            title: share.title,
            url: share.url,
            uid: user.uid,
            nickname: user.nickname,
            avatar_thumb: user.avatar_thumb?.url_list?.[0] ?? ""
        }, "comment");
    }
}

function parseUserDetails(parsedData) {
    const user = parsedData?.userInfo?.user;
    if (!user?.id) return;

    const stats = parsedData.userInfo?.stats ?? {};
    const shareMeta = parsedData.shareMeta ?? {};

    void post_to_backend({
        desc: shareMeta.desc,
        title: shareMeta.title,
        diggCount: stats.diggCount,
        followerCount: stats.followerCount,
        followingCount: stats.followingCount,
        friendCount: stats.friendCount,
        heart: stats.heart,
        heartCount: stats.heartCount,
        videoCount: stats.videoCount,
        avatarLarger: user.avatarLarger,
        bioLink: user.bioLink?.link ?? "",
        usedId: user.id,
        nickname: user.nickname,
        nicknameModifyTime: user.nickNameModifyTime,
        secUid: user.secUid,
        signature: user.signature,
        uniqueId: user.uniqueId,
        verified: user.verified
    }, "author");
}

function parseHashTagDetails(parsedData) {
    const info = parsedData?.challengeInfo;
    const challenge = info?.challenge;
    const stats = info?.statsV2 ?? {};
    if (!challenge?.id) return;

    void post_to_backend({
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        challengeViewCount: stats.viewCount,
        challengeVideoCount: stats.videoCount
    }, "challenge");
}

browser.webRequest.onBeforeRequest.addListener(
    listener,
    { urls: ["*://*.tiktok.com/api/*"], types: ["xmlhttprequest"] },
    ["blocking"]
);
