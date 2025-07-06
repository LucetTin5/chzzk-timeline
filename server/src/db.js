import Database from 'better-sqlite3';

const db = new Database('./sqlite.db');
db.pragma('journal_mode = WAL');
init();

function init() {
  // DROP TABLE IF EXISTS chat;
  // DROP TABLE IF EXISTS channel;
  const sql = `
  CREATE TABLE IF NOT EXISTS channel (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    follower INTEGER NOT NULL,
    image TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS chat (
    id INTEGER PRIMARY KEY,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channel(id)
    UNIQUE (channel_id, user_id)
  );
  `
  db.exec(sql);
}

export function insertChannel(channel) {
  const sql = `
    INSERT INTO channel (id, name, follower, image)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id)
    DO UPDATE SET name=?, follower=?, image=?, updated_at=CURRENT_TIMESTAMP
  `;
  db.prepare(sql).run(
    channel.channelId, channel.channelName, channel.followerCount, channel.channelImageUrl,
    channel.channelName, channel.followerCount, channel.channelImageUrl,
  );
}

export function insertChat(chat) {
  const sql = `
    INSERT INTO chat (channel_id, user_id)
    VALUES (?, ?)
    ON CONFLICT(channel_id, user_id)
    DO UPDATE SET updated_at=CURRENT_TIMESTAMP
  `;
  db.prepare(sql).run(chat.channelId, chat.userId);
}

export function selectNodes() {
  const sql = `
    WITH
    valid_chat AS (
      SELECT channel_id cid
      FROM chat c
      WHERE updated_at >= DATETIME('now', '-${process.env.MIN_UPLOADER_DAYS}')
    )
    SELECT c.id id, c.name name, c.follower follower, c.image image, COUNT(c.id) chat_count
    FROM valid_chat vc
    LEFT JOIN channel c ON vc.cid = c.id
    GROUP BY id
    ORDER BY chat_count DESC
    LIMIT ${process.env.MAX_NODES}
    `;
  return db.prepare(sql).all();
}

export function selectLinks() {
  const sql = `
    WITH
    valid_chat AS (
        SELECT channel_id cid, user_id uid
        FROM chat
        WHERE updated_at >= DATETIME('now', '-${process.env.MIN_UPLOADER_DAYS}')
    ),
    valid_channel AS (
        SELECT c.id id, COUNT(c.id) cnt
        FROM valid_chat vc
        LEFT JOIN channel c ON vc.cid = c.id
        GROUP BY id
        ORDER BY cnt DESC
        LIMIT ${process.env.MAX_NODES}
    ),
    channel_pair AS (
        SELECT a.id a_cid, b.id b_cid, a.cnt a_cnt, b.cnt b_cnt
        FROM valid_channel a
        JOIN valid_channel b ON a.id<b.id
    ),
    chat_inter AS (
        SELECT a.cid a_cid, b.cid b_cid, COUNT(*) inter
        FROM valid_chat a
        JOIN valid_chat b ON a.uid=b.uid AND a.cid<b.cid
        GROUP BY a.cid, b.cid
    )
    SELECT p.a_cid source, p.b_cid target, COALESCE(i.inter, 0) inter, COALESCE(i.inter, 0) * 1.0 / MIN(p.a_cnt, p.b_cnt) distance
    FROM channel_pair p
    LEFT JOIN chat_inter i ON i.a_cid=p.a_cid AND i.b_cid=p.b_cid
    ORDER BY distance DESC
  `;
  return db.prepare(sql).all();
}

