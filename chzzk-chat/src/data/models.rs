use chrono::{DateTime, FixedOffset};
use serde::{Deserialize, Serialize};

/// ====== Channel With Replays JSON 구조체 ======

#[derive(Debug, Deserialize, Clone)]
pub struct Replay {
    pub title: String,
    pub start: String,
    pub end: String,
    #[serde(rename = "videoNo")]
    pub video_no: u64,
    #[serde(default)]
    pub thumbnail: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(rename = "categoryKo", default)]
    pub category_ko: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ChannelWithReplays {
    pub name: String,
    pub follower: u64,
    #[serde(rename = "channelId")]
    pub channel_id: String,
    #[serde(default)]
    pub image: Option<String>,
    pub replays: Vec<Replay>,
}

/// ====== Chat Log 구조체 ======

/// 채팅 메시지
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    #[serde(rename = "t")]
    pub timestamp: DateTime<FixedOffset>,
    #[serde(skip)]
    pub nickname: String,
    #[serde(rename = "m")]
    pub message: String,
    #[serde(rename = "u")]
    pub user_id: String,
}

/// 채팅 로그 (특정 비디오의 모든 채팅 메시지)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatLog {
    #[serde(rename = "v")]
    pub video_id: u64,
    #[serde(rename = "m")]
    pub messages: Vec<ChatMessage>,
}
