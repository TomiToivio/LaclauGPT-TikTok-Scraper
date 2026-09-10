/**
 * LaclauGPT TikTok Scraper for EP24 Elections
 * -----------------------------------------------------------
 * This Node.js backend ingests structured TikTok data
 * and stores it into a local SQLite database for analysis.
 * Converted to sqlite3 for open source release.
 * This code is intended for academic and research use only.
 *
 * Author: Tomi Toivio
 * License: CC0 1.0 Universal
 */

import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const app = express();

const allowedOrigins = [
  /^moz-extension:\/\//,
  /^http:\/\/localhost(?::\d+)?$/,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/
];

app.use(cors({
  credentials: false,
  origin(origin, callback) {
    if (!origin || allowedOrigins.some((pattern) => pattern.test(origin))) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '1mb' }));

const dbPath = process.env.DB_PATH || 'tiktok_scraper.db';
const db = new sqlite3.Database(dbPath);

function execSql(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function requireFields(body, fields, res) {
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'JSON request body required' });
    return false;
  }

  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
    return false;
  }
  return true;
}

await execSql(`CREATE TABLE IF NOT EXISTS tiktok_scraper_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  videoId TEXT UNIQUE,
  videoDescription TEXT,
  videoCreated TEXT,
  authorId TEXT,
  authorUniqueId TEXT,
  authorNickname TEXT,
  authorAvatar TEXT,
  authorSignature TEXT,
  authorDiggCount INTEGER,
  authorFollowerCount INTEGER,
  authorFollowingCount INTEGER,
  authorFriendCount INTEGER,
  authorHeart BOOLEAN,
  authorHeartCount INTEGER,
  authorVideoCount INTEGER,
  videoUrl TEXT,
  videoCover TEXT,
  videoDuration INTEGER,
  videoHeight INTEGER,
  videoWidth INTEGER,
  videoRatio TEXT,
  videoPlayCount INTEGER,
  videoShareCount INTEGER,
  videoCommentCount INTEGER,
  videoDiggCount INTEGER,
  videoCollectCount INTEGER,
  videoMusicId TEXT,
  videoMusicTitle TEXT,
  videoMusicAuthor TEXT,
  videoMusicOriginal BOOLEAN,
  videoMusicCover TEXT,
  videoMusicPlayUrl TEXT,
  videoMusicDuration INTEGER,
  scrapedCountry TEXT,
  scrapedUrl TEXT,
  scrapedType TEXT,
  scrapedItem TEXT,
  scrapedTime TEXT,
  scrapedFilename TEXT,
  scrapedVideoCreatedDate TEXT,
  scrapedVideoTikTokUrl TEXT,
  scrapedVideoWarning TEXT
);`);

await execSql(`CREATE TABLE IF NOT EXISTS tiktok_scraper_hashtags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  videoId TEXT,
  hashtagId TEXT,
  hashtagName TEXT,
  hashtagHash TEXT UNIQUE
);`);

await execSql(`CREATE TABLE IF NOT EXISTS tiktok_scraper_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challengeId TEXT UNIQUE,
  challengeTitle TEXT,
  challengeViewCount INTEGER,
  challengeVideoCount INTEGER
);`);

await execSql(`CREATE TABLE IF NOT EXISTS tiktok_scraper_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aweme_id TEXT,
  cid TEXT UNIQUE,
  collect_stat BOOLEAN,
  comment_language TEXT,
  comment_text TEXT,
  create_time TEXT,
  digg_count INTEGER,
  reply_comment_total INTEGER,
  reply_id TEXT,
  reply_to_reply_id TEXT,
  description TEXT,
  title TEXT,
  url TEXT,
  uid TEXT,
  nickname TEXT,
  avatar_thumb TEXT
);`);

await execSql(`CREATE TABLE IF NOT EXISTS tiktok_scraper_authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT,
  diggCount INTEGER,
  followerCount INTEGER,
  followingCount INTEGER,
  friendCount INTEGER,
  heart INTEGER,
  heartCount INTEGER,
  videoCount INTEGER,
  avatarLarger TEXT,
  bioLink TEXT,
  usedId TEXT UNIQUE,
  nickname TEXT,
  nicknameModifyTime TEXT,
  secUid TEXT,
  signature TEXT,
  uniqueId TEXT,
  verified BOOLEAN
);`);

app.get('/', (req, res) => {
  res.json({ status: 'ok', backend: 'LaclauGPT TikTok Scraper', database: dbPath });
});

app.post('/tiktok/challenge', async (req, res) => {
  if (!requireFields(req.body, ['challengeId'], res)) return;
  const { challengeId, challengeTitle, challengeViewCount, challengeVideoCount } = req.body;
  await runSql(
    `INSERT OR IGNORE INTO tiktok_scraper_challenges (challengeId, challengeTitle, challengeViewCount, challengeVideoCount) VALUES (?, ?, ?, ?)`,
    [challengeId, challengeTitle, challengeViewCount, challengeVideoCount]
  );
  res.send('OK');
});

app.post('/tiktok/author', async (req, res) => {
  if (!requireFields(req.body, ['usedId'], res)) return;
  const a = req.body;
  await runSql(
    `INSERT OR IGNORE INTO tiktok_scraper_authors (description, diggCount, followerCount, followingCount, friendCount, heart, heartCount, videoCount, avatarLarger, bioLink, usedId, nickname, nicknameModifyTime, secUid, signature, uniqueId, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [a.desc, a.diggCount, a.followerCount, a.followingCount, a.friendCount, a.heart, a.heartCount, a.videoCount, a.avatarLarger, a.bioLink, a.usedId, a.nickname, a.nicknameModifyTime, a.secUid, a.signature, a.uniqueId, a.verified]
  );
  res.send('OK');
});

app.post('/tiktok/hashtag', async (req, res) => {
  if (!requireFields(req.body, ['video_id', 'hashtag_id'], res)) return;
  const { video_id, hashtag_id, hashtag_name, hashtag_hash } = req.body;
  const hashtagHash = hashtag_hash || `${video_id}:${hashtag_id}`;
  await runSql(
    `INSERT OR IGNORE INTO tiktok_scraper_hashtags (videoId, hashtagId, hashtagName, hashtagHash) VALUES (?, ?, ?, ?)`,
    [video_id, hashtag_id, hashtag_name, hashtagHash]
  );
  res.send('OK');
});

app.post('/tiktok/comment', async (req, res) => {
  if (!requireFields(req.body, ['cid'], res)) return;
  const c = req.body;
  await runSql(
    `INSERT OR IGNORE INTO tiktok_scraper_comments (aweme_id, cid, collect_stat, comment_language, comment_text, create_time, digg_count, reply_comment_total, reply_id, reply_to_reply_id, description, title, url, uid, nickname, avatar_thumb) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [c.aweme_id, c.cid, c.collect_stat, c.comment_language, c.comment_text, c.create_time, c.digg_count, c.reply_comment_total, c.reply_id, c.reply_to_reply_id, c.desc, c.title, c.url, c.uid, c.nickname, c.avatar_thumb]
  );
  res.send('OK');
});

app.post('/tiktok/video', async (req, res) => {
  if (!requireFields(req.body, ['videoId'], res)) return;
  const v = req.body;
  const values = [
    v.videoId, v.videoDescription, v.videoCreated,
    v.authorId, v.authorUniqueId, v.authorNickname, v.authorAvatar, v.authorSignature,
    v.authorDiggCount, v.authorFollowerCount, v.authorFollowingCount, v.authorFriendCount,
    v.authorHeart, v.authorHeartCount, v.authorVideoCount,
    v.videoUrl, v.videoCover, v.videoDuration, v.videoHeight, v.videoWidth, v.videoRatio,
    v.videoPlayCount, v.videoShareCount, v.videoCommentCount, v.videoDiggCount, v.videoCollectCount,
    v.videoMusicId, v.videoMusicTitle, v.videoMusicAuthor, v.videoMusicOriginal, v.videoMusicCover, v.videoMusicPlayUrl, v.videoMusicDuration,
    v.scrapedCountry, v.scrapedUrl, v.scrapedType, v.scrapedItem, v.scrapedTime,
    v.scrapedFilename, v.scrapedVideoCreatedDate, v.scrapedVideoTikTokUrl, v.scrapedVideoWarning
  ];
  await runSql(
    `INSERT OR IGNORE INTO tiktok_scraper_videos (videoId, videoDescription, videoCreated, authorId, authorUniqueId, authorNickname, authorAvatar, authorSignature, authorDiggCount, authorFollowerCount, authorFollowingCount, authorFriendCount, authorHeart, authorHeartCount, authorVideoCount, videoUrl, videoCover, videoDuration, videoHeight, videoWidth, videoRatio, videoPlayCount, videoShareCount, videoCommentCount, videoDiggCount, videoCollectCount, videoMusicId, videoMusicTitle, videoMusicAuthor, videoMusicOriginal, videoMusicCover, videoMusicPlayUrl, videoMusicDuration, scrapedCountry, scrapedUrl, scrapedType, scrapedItem, scrapedTime, scrapedFilename, scrapedVideoCreatedDate, scrapedVideoTikTokUrl, scrapedVideoWarning) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    values
  );
  res.send('OK');
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number.parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '127.0.0.1';

app.listen(port, host, () => {
  console.log(`SQLite REST API running at http://${host}:${port}`);
});
