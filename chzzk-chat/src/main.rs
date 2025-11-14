use std::env;
use std::time::Duration;

use anyhow::{Context, Result};
use chrono::{Duration as ChronoDuration, Utc};
use dashmap::DashSet;
use futures::{SinkExt, StreamExt};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::time;
use tokio_tungstenite::{
    connect_async,
    tungstenite::{client::IntoClientRequest, Message},
};

/// Node.js의 `scrapingChannels` Set 대체
static SCRAPING_CHANNELS: Lazy<DashSet<String>> = Lazy::new(DashSet::new);

/// ====== 공통 로그 함수 (KST 기준) ======
fn log(msg: impl AsRef<str>) {
    let now = Utc::now() + ChronoDuration::hours(9);
    println!("{} {}", now.format("%Y-%m-%d %H:%M:%S"), msg.as_ref());
}

/// ====== HTTP 응답 구조체들 ======

#[derive(Debug, Deserialize, Clone)]
struct ChannelInfo {
    #[serde(rename = "channelId")]
    channel_id: String,
    // 다른 필드는 필요 없으면 생략
}

#[derive(Debug, Deserialize, Clone)]
struct Live {
    #[serde(rename = "concurrentUserCount")]
    concurrent_user_count: u64,
    adult: bool,
    #[serde(rename = "chatChannelId")]
    #[allow(dead_code)]
    chat_channel_id: Option<String>,
    channel: ChannelInfo,
}

#[derive(Debug, Deserialize)]
struct PageNext {
    #[serde(rename = "concurrentUserCount")]
    concurrent_user_count: u64,
    #[serde(rename = "liveId")]
    live_id: u64,
}

#[derive(Debug, Deserialize)]
struct PageInfo {
    next: Option<PageNext>,
}

#[derive(Debug, Deserialize)]
struct LivesContent {
    data: Vec<Live>,
    page: PageInfo,
}

#[derive(Debug, Deserialize)]
struct LivesResponse {
    content: LivesContent,
}

#[derive(Debug, Deserialize, Clone)]
struct ChannelDetail {
    #[serde(rename = "channelId")]
    channel_id: String,
    #[serde(rename = "followerCount")]
    follower_count: Option<u64>,
    #[serde(rename = "openLive")]
    open_live: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct ChannelDetailResponse {
    content: Option<ChannelDetail>,
}

#[derive(Debug, Deserialize, Clone)]
struct LiveDetail {
    #[serde(rename = "chatChannelId")]
    chat_channel_id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct LiveDetailResponse {
    content: Option<LiveDetail>,
}

/// 스크래핑에 필요한 최소 정보만 모아놓은 구조체
#[derive(Debug, Clone)]
struct LiveReady {
    channel_id: String,
    chat_channel_id: String,
    follower_count: u64,
}

/// ====== HTTP 함수들 ======

async fn fetch_lives(next: Option<&PageNext>) -> Result<(Vec<Live>, Option<PageNext>)> {
    let url = if let Some(next) = next {
        format!(
            "https://api.chzzk.naver.com/service/v1/lives?size=50&sortType=POPULAR&concurrentUserCount={}&liveId={}",
            next.concurrent_user_count, next.live_id
        )
    } else {
        "https://api.chzzk.naver.com/service/v1/lives?size=50&sortType=POPULAR".to_string()
    };

    let client = reqwest::Client::new();
    let resp: LivesResponse = client
        .get(&url)
        .header("User-Agent", "Mozilla")
        .send()
        .await?
        .json()
        .await
        .with_context(|| format!("Failed to parse lives response: {}", url))?;

    Ok((resp.content.data, resp.content.page.next))
}

async fn fetch_lives_pages(min_user: u64) -> Result<Vec<Live>> {
    let mut valid_lives = Vec::new();
    let mut next: Option<PageNext> = None;

    loop {
        let (lives, next_page) = fetch_lives(next.as_ref()).await?;

        // let stop = filtered.len() < filtered.capacity(); // lives.len()과 같지 않으면 중단
        let stop = lives.iter().any(|l| l.concurrent_user_count < min_user);

        valid_lives.append(
            &mut lives
                .into_iter()
                .filter(|l| l.concurrent_user_count >= min_user)
                .collect(),
        );

        if stop {
            break;
        }

        if next_page.is_none() {
            break;
        }

        next = next_page;
        println!("next: {:?}", next);
    }

    Ok(valid_lives)
}

async fn fetch_channel(channel_id: &str) -> Result<Option<ChannelDetail>> {
    let url = format!(
        "https://api.chzzk.naver.com/service/v1/channels/{}",
        channel_id
    );

    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header("User-Agent", "Mozilla")
        .send()
        .await?;

    let status = resp.status();
    if !status.is_success() {
        log(format!(
            "fetchChannel() HTTP error {} for channel {}",
            status, channel_id
        ));
        return Ok(None);
    }

    let json: ChannelDetailResponse = resp
        .json()
        .await
        .with_context(|| format!("fetchChannel() JSON parse error for channel {}", channel_id))?;

    if json.content.is_none() {
        log(format!(
            "fetchChannel() JSON Error! channel_id={} (content is null)",
            channel_id
        ));
    }

    Ok(json.content)
}

async fn fetch_live_detail(channel_id: &str) -> Result<Option<LiveDetail>> {
    let url = format!(
        "https://api.chzzk.naver.com/service/v3/channels/{}/live-detail",
        channel_id
    );

    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header("User-Agent", "Mozilla")
        .send()
        .await?;

    let status = resp.status();
    if !status.is_success() {
        log(format!(
            "fetchLiveDetail() HTTP error {} for channel {}",
            status, channel_id
        ));
        return Ok(None);
    }

    let json: LiveDetailResponse = resp.json().await.with_context(|| {
        format!(
            "fetchLiveDetail() JSON parse error for channel {}",
            channel_id
        )
    })?;

    Ok(json.content)
}

/// ====== WebSocket 메시지 포맷 ======

#[derive(Debug, Serialize)]
struct InitBody {
    uid: Option<String>,
    #[serde(rename = "devType")]
    dev_type: i32,
    #[serde(rename = "accTkn")]
    acc_tkn: Option<String>,
    auth: String,
    #[serde(rename = "libVer")]
    lib_ver: Option<String>,
    #[serde(rename = "osVer")]
    os_ver: Option<String>,
    #[serde(rename = "devName")]
    dev_name: Option<String>,
    locale: Option<String>,
    timezone: Option<String>,
}

#[derive(Debug, Serialize)]
struct InitMessage {
    ver: String,
    cmd: i32,
    svcid: String,
    cid: String,
    tid: i32,
    bdy: InitBody,
}

/// ====== 스캔 & 웹소켓 스크래핑 ======

/// Node의 scanChannels와 대응
async fn scan_channels() -> Result<()> {
    let min_live_user: u64 = env::var("MIN_LIVE_USER")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(100); // 기본값

    log(format!(
        "Starting scan with MIN_LIVE_USER = {}",
        min_live_user
    ));

    let mut lives = fetch_lives_pages(min_live_user).await?;
    // adult == false만
    lives.retain(|l| !l.adult);

    // sequentialMap과 유사하게 순차적으로 채널 상세 데이터 fetch
    let mut ready_lives = Vec::new();
    for live in lives.into_iter() {
        let channel_id = live.channel.channel_id.clone();

        let detail_opt = fetch_channel(&channel_id).await?;
        let Some(detail) = detail_opt else {
            continue;
        };

        let Some(follower_count) = detail.follower_count else {
            continue;
        };

        let live_detail_opt = fetch_live_detail(&channel_id).await?;
        let Some(live_detail) = live_detail_opt else {
            continue;
        };

        let Some(chat_channel_id) = live_detail.chat_channel_id.clone() else {
            continue;
        };

        let ready_live = LiveReady {
            channel_id,
            chat_channel_id,
            follower_count,
        };
        println!("ready_live: {:?}", ready_live);

        ready_lives.push(ready_live);
    }

    // 이미 scraping 중인 채널 제거
    ready_lives.retain(|l| !SCRAPING_CHANNELS.contains(&l.channel_id));

    // 각 live마다 WebSocket 스크래핑 시작
    for live in ready_lives {
        spawn_scrape_chats(live);
    }

    Ok(())
}

/// Node의 scrapeChats(live)와 대응 (백그라운드 태스크로 실행)
fn spawn_scrape_chats(live: LiveReady) {
    tokio::spawn(async move {
        if let Err(e) = scrape_chats(live.clone()).await {
            log(format!(
                "scrape_chats error for channel {}: {:?}",
                live.channel_id, e
            ));
            SCRAPING_CHANNELS.remove(&live.channel_id);
        }
    });
}

async fn scrape_chats(live: LiveReady) -> Result<()> {
    let request = "wss://kr-ss1.chat.naver.com/chat"
        .into_client_request()
        .unwrap();

    let (mut ws_stream, _) = connect_async(request).await?;
    SCRAPING_CHANNELS.insert(live.channel_id.clone());

    // INIT 메시지 전송
    let init_msg = InitMessage {
        ver: "3".to_string(),
        cmd: 100,
        svcid: "game".to_string(),
        cid: live.chat_channel_id.clone(),
        tid: 1,
        bdy: InitBody {
            uid: None,
            dev_type: 2001,
            acc_tkn: None,
            auth: "READ".to_string(),
            lib_ver: None,
            os_ver: None,
            dev_name: None,
            locale: None,
            timezone: None,
        },
    };

    ws_stream
        .send(Message::Text(serde_json::to_string(&init_msg)?))
        .await?;

    log(format!(
        "Opened! channel_id={} scrapingChannels={}",
        live.channel_id,
        SCRAPING_CHANNELS.len()
    ));

    let mut ping_interval = time::interval(Duration::from_secs(20));

    loop {
        tokio::select! {
            _ = ping_interval.tick() => {
                // Node 코드처럼 주기적으로 채널 상태 확인 및 PING
                if let Some(detail) = fetch_channel(&live.channel_id).await? {
                    if let Some(open_live) = detail.open_live {
                        if !open_live {
                            log(format!("Channel {} closed live, closing websocket.", live.channel_id));
                            ws_stream.close(None).await.ok();
                            break;
                        }
                    }
                }

                let ping_msg = serde_json::json!({
                    "ver": 3,
                    "cmd": 0,
                });

                ws_stream
                    .send(Message::Text(ping_msg.to_string()))
                    .await
                    .ok();
            }

            msg = ws_stream.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        handle_ws_message(&live, &mut ws_stream, &text).await?;
                    }
                    Some(Ok(Message::Ping(_))) => {
                        // 서버에서 온 ping에 자동 응답은 tungstenite가 처리하지만,
                        // 필요하면 여기서 수동으로 처리 가능.
                    }
                    Some(Ok(Message::Close(_))) => {
                        break;
                    }
                    Some(Err(e)) => {
                        log(format!("WebSocket error for channel {}: {:?}", live.channel_id, e));
                        break;
                    }
                    None => {
                        // 스트림 종료
                        break;
                    }
                    _ => {}
                }
            }
        }
    }

    SCRAPING_CHANNELS.remove(&live.channel_id);
    log(format!(
        "Closed! channel_id={} scrapingChannels={}",
        live.channel_id,
        SCRAPING_CHANNELS.len()
    ));

    Ok(())
}

async fn handle_ws_message(
    live: &LiveReady,
    ws_stream: &mut (impl futures::Sink<Message, Error = tokio_tungstenite::tungstenite::Error> + Unpin),
    text: &str,
) -> Result<()> {
    let v: Value = serde_json::from_str(text)?;

    let cmd = v["cmd"].as_i64().unwrap_or_default();

    if cmd == 0 {
        // 서버 ping -> PONG 응답
        let pong_msg = serde_json::json!({
            "ver": 3,
            "cmd": 10000,
        });
        ws_stream
            .send(Message::Text(pong_msg.to_string()))
            .await
            .ok();
    } else if cmd == 93101 {
        if let Some(bdy) = v["bdy"].as_array() {
            for chat in bdy {
                if let Some(uid) = chat["uid"].as_str() {
                    // db.insertChat({ channelId, userId }) 대신 println!
                    // println!("CHAT channelId={} userId={}", live.channel_id, uid);
                }
            }
        }
    }

    Ok(())
}

/// ====== 엔트리포인트 ======

#[tokio::main]
async fn main() -> Result<()> {
    scan_channels().await?;

    // 웹소켓 태스크들이 계속 돌 수 있도록 프로세스를 유지
    loop {
        time::sleep(Duration::from_secs(3600)).await;
    }
}
