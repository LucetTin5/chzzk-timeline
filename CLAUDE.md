# CLAUDE.md

## 프로젝트 개요

**chzzk-timeline**은 치지직(CHZZK) 스트리밍 플랫폼의 채널 및 다시보기 데이터를 시각화하는 프로젝트입니다.

- 원본: https://github.com/stupidJoon/chzzk-map
- 배포 URL: https://chzzk-timeline.pages.dev/

## 아키텍처

### 주요 구성 요소

1. **Python 스크립트** - 데이터 수집 및 처리
2. **chzzk-chat** (Rust) - 채팅 클라이언트
3. **server** (Node.js) - 백엔드 서버
4. **web** (React + Vite) - 프론트엔드 UI

---

## 디렉토리 구조

```
chzzk-timeline/
├── bot-replays-chat.py          # 다시보기 채팅 봇
├── channel_with_replays.py      # 채널 + 다시보기 통합 처리
├── extract_channel.py           # 채널 정보 추출
├── extract_channel_replays.py   # 채널별 다시보기 추출
├── list_channels.py             # 채널 목록 조회
├── list_replays.py              # 다시보기 목록 조회
├── mask_chat_logs.py            # 채팅 로그 마스킹 처리
├── replay_chat.py               # 다시보기 채팅 수집
├── requirements.txt             # Python 의존성
├── chzzk-chat/                  # Rust 기반 채팅 클라이언트
│   ├── Cargo.toml
│   └── src/
├── server/                      # Node.js 백엔드
│   ├── package.json
│   ├── sqlite.db               # SQLite 데이터베이스
│   └── src/
│       ├── db.js               # 데이터베이스 로직
│       ├── index.js            # 서버 엔트리포인트
│       ├── scrape.js           # 스크래핑 로직
│       └── upload.js           # 업로드 처리
└── web/                         # React 프론트엔드
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── App.jsx             # 메인 앱 컴포넌트
        ├── main.jsx            # React 엔트리포인트
        ├── index.css
        ├── pages/              # 페이지 컴포넌트들
        └── utils/              # 유틸리티 함수들
```

---

## 기술 스택

### Python 스크립트
- **언어**: Python 3.x
- **주요 라이브러리**:
  - `requests==2.32.4` - HTTP 요청
  - `urllib3==2.5.0` - URL 처리

### chzzk-chat (Rust)
- **언어**: Rust 2021 Edition
- **주요 크레이트**:
  - `tokio` - 비동기 런타임
  - `reqwest` - HTTP 클라이언트
  - `serde`, `serde_json` - JSON 직렬화
  - `tokio-tungstenite` - WebSocket 클라이언트
  - `chrono` - 날짜/시간 처리
  - `dashmap` - 동시성 해시맵

### server (Node.js)
- **런타임**: Node.js (ESM)
- **주요 패키지**:
  - `better-sqlite3` - SQLite 데이터베이스
  - `ws` - WebSocket 서버
  - `node-cron` - 크론 작업 스케줄러
  - `cloudflare` - Cloudflare API 연동
  - `dotenv` - 환경 변수 관리

### web (React)
- **프레임워크**: React 18.3
- **빌드 도구**: Vite 6.0
- **UI 라이브러리**:
  - `@mantine/core`, `@mantine/hooks` - UI 컴포넌트
  - `tailwindcss` - CSS 프레임워크
- **데이터 시각화**:
  - `d3` - 데이터 시각화
  - `react-force-graph-3d` - 3D 그래프
  - `three` - 3D 렌더링
- **테이블/가상화**:
  - `@tanstack/react-table` - 테이블 컴포넌트
  - `@tanstack/react-virtual` - 가상 스크롤
- **라우팅**: `react-router-dom`

---

## 주요 기능

### 1. 데이터 수집 (Python)

#### 채널 데이터 수집
- `list_channels.py`: 치지직 채널 목록 조회
- `extract_channel.py`: 특정 채널 정보 추출
- `channel_with_replays.py`: 채널과 다시보기를 통합하여 처리

#### 다시보기 데이터 수집
- `list_replays.py`: 다시보기 목록 조회
- `extract_channel_replays.py`: 채널별 다시보기 추출
- 필터링: 최근 90일 이내 데이터만 처리
- 팔로워 수 상위 100명 채널 우선 처리

#### 채팅 데이터 수집
- `replay_chat.py`: 다시보기 채팅 수집
- `bot-replays-chat.py`: 자동화된 채팅 봇
- `mask_chat_logs.py`: 개인정보 마스킹 처리

### 2. 채팅 클라이언트 (Rust)
- WebSocket 기반 실시간 채팅 수집
- 비동기 멀티스레드 처리
- CBOR 바이너리 직렬화로 효율적 데이터 저장

### 3. 백엔드 서버 (Node.js)
- SQLite 데이터베이스 관리
- WebSocket 서버로 실시간 데이터 제공
- 스케줄링된 데이터 스크래핑 작업
- Cloudflare Pages 연동

### 4. 프론트엔드 (React)
- 3D 그래프로 채널/다시보기 관계 시각화
- 가상 스크롤링으로 대량 데이터 렌더링 최적화
- 반응형 UI (Mantine + TailwindCSS)
- 클라이언트 라우팅

---

## 개발 환경 설정

### Python 환경
```bash
# 의존성 설치
pip install -r requirements.txt

# 스크립트 실행 예시
python list_channels.py
python extract_channel_replays.py
```

### Rust 환경 (chzzk-chat)
```bash
cd chzzk-chat
cargo build --release
cargo run
```

### Node.js 서버
```bash
cd server
npm install
node src/index.js
```

### React 웹
```bash
cd web
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
```

---

## 데이터 플로우

1. **데이터 수집**: Python 스크립트가 치지직 API에서 채널/다시보기 데이터 수집
2. **채팅 수집**: Rust 클라이언트가 WebSocket으로 실시간 채팅 수집
3. **데이터 저장**: 수집된 데이터를 SQLite DB에 저장
4. **데이터 제공**: Node.js 서버가 웹소켓/HTTP API로 데이터 제공
5. **시각화**: React 웹앱이 3D 그래프로 데이터 시각화

---

## Git 브랜치 전략

- **현재 브랜치**: `claude/create-claude-md-01QXb7s1CTQiPwGVE15UNuzX`
- 모든 개발은 `claude/` 접두사가 붙은 브랜치에서 진행
- 커밋 후 지정된 브랜치로 푸시: `git push -u origin <branch-name>`

---

## 파일 규칙

### Python 스크립트
- UTF-8 인코딩 사용
- JSON 파일 저장 시 `ensure_ascii=False`로 한글 보존
- KST (UTC+9) 타임존 사용
- 90일 이내 데이터만 필터링

### 데이터베이스
- `server/sqlite.db`: SQLite 데이터베이스 파일
- 마이그레이션: `server/src/db.js`에서 관리

### 환경 변수
- `server/.env`: 서버 환경 변수 (gitignore 처리됨)

---

## 주의사항

### 보안
- `.env` 파일은 절대 커밋하지 말 것
- API 키, 토큰 등 민감 정보는 환경 변수로 관리
- 채팅 로그는 `mask_chat_logs.py`로 마스킹 처리

### 성능
- Python: 대용량 JSON 처리 시 메모리 주의
- Rust: `mimalloc` 사용으로 메모리 최적화
- React: 가상 스크롤링으로 대량 리스트 렌더링 최적화

### 데이터 정합성
- 날짜 형식: `"YYYY-MM-DD HH:MM:SS"` (KST)
- 팔로워 수 기준 상위 100명 채널만 처리
- 90일 이내 다시보기만 포함

---

## 참고 자료

- 원본 프로젝트: https://github.com/stupidJoon/chzzk-map
- 배포 사이트: https://chzzk-timeline.pages.dev/
- 치지직 플랫폼: https://chzzk.naver.com/

---

## 문제 해결

### 일반적인 문제

1. **Python 스크립트 실행 오류**
   - Python 버전 확인 (3.x 필요)
   - `pip install -r requirements.txt` 실행

2. **Rust 빌드 오류**
   - Rust 툴체인 업데이트: `rustup update`
   - 의존성 재빌드: `cargo clean && cargo build`

3. **서버 실행 오류**
   - Node.js 버전 확인 (ESM 지원 필요)
   - `.env` 파일 설정 확인

4. **프론트엔드 빌드 오류**
   - `node_modules` 삭제 후 재설치
   - Vite 캐시 삭제: `rm -rf node_modules/.vite`

---

## 라이선스

원본 프로젝트의 라이선스를 따릅니다.
