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

// Main request listener that intercepts TikTok API traffic and routes it to parsing logic
function listener(details) {
    let requestUrl = details.url;
    let responseDatas = "";

    // Create a filter to intercept response stream
    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    // Accumulate data from the stream
    filter.ondata = (event) => {
        let responseData = decoder.decode(event.data, { stream: true });
        responseDatas += responseData;
        filter.write(encoder.encode(responseData)); // Forward data
    };

    // On end of response, try to parse and dispatch
    filter.onstop = () => {
        filter.close();
        if (requestUrl.includes("tiktok.com/api/")) {
            try {
                let parsedData = JSON.parse(responseDatas);
                dataGrabber(parsedData, requestUrl);
            } catch (e) {
                console.error("Failed to parse JSON from", requestUrl, e);
            }
        }
    };

    return {};
}

// Helper to send parsed JSON data to a specified backend endpoint
function post_to_backend(data, endpoint) {
    const api_url = "http://localhost/tiktok/" + endpoint;
    let headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    headers.append('Access-Control-Allow-Origin','*');

    return fetch(api_url, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow',
        headers: headers,
        body: JSON.stringify(data)
    }).then(resp => console.log(`[RESPONSE] ${endpoint}:`, resp))
      .catch(err => console.error(`[ERROR] ${endpoint}:`, err));
}

// Routes API response JSON to the appropriate parser based on the TikTok API path
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
        console.log("Unhandled URL:", requestUrl);
    }
}

// Parses individual TikTok video metadata and posts it to backend
function parseVideoItem(videoData) {
    const videoId = videoData['id'];
    const author = videoData['author'] ?? {};
    const stats = videoData['stats'] ?? {};
    const music = videoData['music'] ?? {};
    const video = videoData['video'] ?? {};
    const hashtags = videoData['textExtra'] ?? [];

    for (const tag of hashtags) {
        const hashtagId = tag?.hashtagId;
        const hashtagName = tag?.hashtagName;
        if (hashtagId && hashtagName) {
            post_to_backend({
                video_id: videoId,
                hashtag_id: hashtagId,
                hashtag_name: hashtagName,
                hashtag_hash: btoa(videoId + hashtagId)
            }, "hashtag");
        }
    }

    const video_data = {
        videoId,
        videoDescription: videoData['desc'],
        videoCreated: videoData['createTime'],
        authorId: author['id'],
        authorUniqueId: author['uniqueId'],
        authorNickname: author['nickname'],
        authorAvatar: author['avatarLarger'],
        authorSignature: author['signature'],
        authorDiggCount: videoData.authorStats?.diggCount ?? 0,
        authorFollowerCount: videoData.authorStats?.followerCount ?? 0,
        authorFollowingCount: videoData.authorStats?.followingCount ?? 0,
        authorFriendCount: videoData.authorStats?.friendCount ?? 0,
        authorHeart: videoData.authorStats?.heart ?? 0,
        authorHeartCount: videoData.authorStats?.heartCount ?? 0,
        authorVideoCount: videoData.authorStats?.videoCount ?? 0,
        videoUrl: video['downloadAddr'],
        videoCover: video['cover'],
        videoDuration: video['duration'],
        videoHeight: video['height'],
        videoWidth: video['width'],
        videoRatio: video['ratio'],
        videoPlayCount: stats['playCount'],
        videoShareCount: stats['shareCount'],
        videoCommentCount: stats['commentCount'],
        videoDiggCount: stats['diggCount'],
        videoCollectCount: stats['collectCount'],
        videoMusicId: music['id'],
        videoMusicTitle: music['title'],
        videoMusicAuthor: music['authorName'],
        videoMusicOriginal: music['original'],
        videoMusicCover: music['coverLarge'],
        videoMusicPlayUrl: music['playUrl'],
        videoMusicDuration: music['duration']
    };

    post_to_backend(video_data, "video");
}

// Parses a list of TikTok videos and delegates to parseVideoItem
function parseVideoList(parsedData) {
    let videoList = parsedData["itemList"];
    for (const videoData of videoList) {
        parseVideoItem(videoData);
    }
}

// Parses a hashtag challenge video list and delegates to parseVideoItem
function parseChallengeList(parsedData) {
    let videoList = parsedData["itemList"];
    for (const videoData of videoList) {
        parseVideoItem(videoData);
    }
}

// Parses a playlist of TikTok videos for a user
function parseUserPlaylist(parsedData) {
    let itemList = parsedData["itemList"];
    for (const item of itemList) {
        let videoData = item["item"];
        parseVideoItem(videoData);
    }
}

// Parses TikTok search result feed and extracts video content
function parseSearchResults(parsedData) {
    let itemList = parsedData["data"];
    for (const item of itemList) {
        if (item["type"] === 1) {
            parseVideoItem(item["item"]);
        }
    }
}

// Parses comments under a TikTok video and sends structured comment data to backend
function parseCommentList(parsedData) {
    let comments = parsedData["comments"];
    if (comments && comments.length > 0) {
        for (const comment of comments) {
            const user = comment.user ?? {};
            const share = comment.share_info ?? {};
            post_to_backend({
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
}

// Parses detailed metadata about a TikTok user
function parseUserDetails(parsedData) {
    let user = parsedData.userInfo?.user ?? {};
    let stats = parsedData.userInfo?.stats ?? {};
    let shareMeta = parsedData.shareMeta ?? {};

    post_to_backend({
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
        biolink: user.bioLink?.link ?? "",
        id: user.id,
        nickname: user.nickname,
        nicknameModifyTime: user.nickNameModifyTime,
        secUid: user.secUid,
        signature: user.signature,
        uniqueId: user.uniqueId,
        verified: user.verified
    }, "author");
}

// Parses metadata about a TikTok hashtag (challenge)
function parseHashTagDetails(parsedData) {
    let info = parsedData.challengeInfo;
    let challenge = info.challenge;
    let stats = info.statsV2;

    post_to_backend({
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        challengeViewCount: stats.viewCount,
        challengeVideoCount: stats.videoCount
    }, "challenge");
}

// Activate listener for TikTok traffic
browser.webRequest.onBeforeRequest.addListener(
    listener,
    { urls: ["*://*.tiktok.com/*"], types: ["main_frame", "xmlhttprequest"] },
    ["blocking"]
);
