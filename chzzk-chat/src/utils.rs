use chrono::{Duration as ChronoDuration, Utc};
use dashmap::DashSet;
use once_cell::sync::Lazy;

/// Node.js의 `scrapingChannels` Set 대체
pub static SCRAPING_CHANNELS: Lazy<DashSet<String>> = Lazy::new(DashSet::new);

/// ====== 공통 로그 함수 (KST 기준) ======
pub fn log(msg: impl AsRef<str>) {
    let now = Utc::now() + ChronoDuration::hours(9);
    println!("{} {}", now.format("%Y-%m-%d %H:%M:%S"), msg.as_ref());
}
