import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Badge, Container, Grid, Group, Stack, Text, Tooltip } from '@mantine/core';
import { RelatedChannels } from '../Chat/RelatedChannels.jsx';
import { formatDuration } from '../Chat/utils.js';

const ChannelHeader = ({ channel }) => {
    if (!channel) return null;
    return (
        <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/95 p-6 shadow-lg shadow-slate-900/40">
            <Group justify="space-between" align="flex-start">
                <Group gap="md" align="center">
                    <Avatar
                        src={channel.image ? `${channel.image}?type=f120_120_na` : undefined}
                        alt={channel.name}
                        radius="xl"
                        size={72}
                    >
                        {channel.name?.slice(0, 2)}
                    </Avatar>
                    <div>
                        <Text size="xl" fw={800} className="text-slate-100">
                            {channel.name || '알 수 없는 채널'}
                        </Text>
                        <Text size="sm" c="dimmed" className="font-mono">
                            {channel.channelId}
                        </Text>
                        <Group gap={8} mt={8}>
                            {typeof channel.followerCount === 'number' ? (
                                <Badge size="sm" variant="light" color="teal">
                                    팔로워 {channel.followerCount.toLocaleString()}
                                </Badge>
                            ) : null}
                            {typeof channel.replayCount === 'number' ? (
                                <Badge size="sm" variant="light" color="violet">
                                    다시보기 {channel.replayCount.toLocaleString()}
                                </Badge>
                            ) : null}
                        </Group>
                    </div>
                </Group>
                <Group gap="xs">
                    <a
                        href={`https://chzzk.naver.com/${channel.channelId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full border border-slate-700/70 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/70"
                        title="치지직 채널 열기"
                    >
                        치지직 채널
                    </a>
                </Group>
            </Group>
        </div>
    );
};

const ReplayCard = ({ replay, channel, chatVideoSet }) => {
    if (!replay) return null;

    const title = replay.title || '제목 없음';
    const videoNo = replay.videoNo || replay.videoId || replay.id;
    const thumbnail =
        replay.thumbnailUrl || replay.thumbnail || (channel?.image ? `${channel.image}?type=f216_120_na` : undefined);

    // 날짜/시간
    const startDate =
        replay.startDate ? new Date(replay.startDate) : replay.start ? new Date(String(replay.start).replace(' ', 'T')) : null;
    const endDate =
        replay.endDate ? new Date(replay.endDate) : replay.end ? new Date(String(replay.end).replace(' ', 'T')) : null;

    const durationSec =
        typeof replay.durationSec === 'number'
            ? replay.durationSec
            : typeof replay.durationMs === 'number'
                ? Math.round(replay.durationMs / 1000)
                : (() => {
                    if (startDate && endDate) {
                        const s = startDate.getTime();
                        const e = endDate.getTime();
                        if (!Number.isNaN(s) && !Number.isNaN(e) && e > s) return Math.floor((e - s) / 1000);
                    }
                    return null;
                })();

    const tags = Array.isArray(replay.tags) ? replay.tags.slice(0, 8) : [];

    const chatUrl = videoNo ? `/chat/${videoNo}` : null;
    const originalUrl = videoNo ? `https://chzzk.naver.com/video/${videoNo}` : null;
    const hasChat = videoNo ? Boolean(chatVideoSet?.has(String(videoNo))) : false;
    const targetUrl = hasChat && chatUrl ? chatUrl : originalUrl;

    return (
        <div
            className="flex flex-col overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/95 shadow-lg shadow-slate-900/40 cursor-pointer hover:bg-slate-800/80 hover:shadow-teal-500/10 hover:shadow-xl transform hover:-translate-y-0.5 transition-colors transition-transform transition-shadow duration-200"
            onClick={() => {
                if (targetUrl) {
                    window.open(targetUrl, '_blank', 'noopener');
                }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && targetUrl) {
                    e.preventDefault();
                    window.open(targetUrl, '_blank', 'noopener');
                }
            }}
            title={targetUrl ? (hasChat ? '채팅 타임라인으로 이동' : '치지직 원본 영상으로 이동') : undefined}
            aria-label={targetUrl ? (hasChat ? '채팅 타임라인으로 이동' : '치지직 원본 영상으로 이동') : undefined}
        >
            {thumbnail ? (
                <img
                    src={thumbnail}
                    alt={title ? `${title} 썸네일` : '비디오 썸네일'}
                    className="h-44 w-full object-cover border-b border-slate-800/60"
                    loading="lazy"
                />
            ) : null}
            <div className="p-4 flex-1 flex flex-col gap-2">
                <Tooltip label={title} openDelay={300}>
                    <Text size="md" fw={600} className="text-slate-100 line-clamp-2">
                        {title}
                    </Text>
                </Tooltip>
                {hasChat ? (
                    <Badge size="sm" variant="light" color="teal" className="w-fit">
                        채팅 타임라인
                    </Badge>
                ) : null}
                {startDate ? (
                    <Text size="sm" c="dimmed">
                        {startDate.toLocaleString('ko-KR')}
                    </Text>
                ) : null}
                {typeof durationSec === 'number' ? (
                    <Text size="sm" c="dimmed">
                        {formatDuration(durationSec)}
                    </Text>
                ) : null}
                {tags.length > 0 ? (
                    <Group gap={6} wrap="wrap" mt={2}>
                        {tags.map((tag) => (
                            <Badge key={tag} size="sm" radius="sm" variant="light" color="gray">
                                #{tag}
                            </Badge>
                        ))}
                    </Group>
                ) : null}
                <div className="mt-auto" />
            </div>
        </div>
    );
};

const ChannelPage = () => {
    const { channelId } = useParams();
    const [channel, setChannel] = useState(null);
    const [replays, setReplays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleCount, setVisibleCount] = useState(9);
    const loadMoreRef = useRef(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [chatVideoSet, setChatVideoSet] = useState(null);

    useEffect(() => {
        if (!channelId) return;
        let aborted = false;
        async function load() {
            try {
                setLoading(true);
                setError(null);

                const [res0, res1] = await Promise.all([
                    fetch('/channel_with_replays_0.json'),
                    fetch('/channel_with_replays_1.json'),
                ]);

                const arr0 = res0.ok ? await res0.json() : [];
                const arr1 = res1.ok ? await res1.json() : [];
                const all = [...(Array.isArray(arr0) ? arr0 : []), ...(Array.isArray(arr1) ? arr1 : [])];

                const ch = all.find((c) => String(c?.channelId) === String(channelId));
                if (!ch) {
                    throw new Error('해당 채널을 찾을 수 없습니다.');
                }
                const list = Array.isArray(ch?.replays) ? ch.replays : [];
                const replayCount = list.length;
                // 채팅 타임라인 보유 영상 목록 로드
                let chatSet = null;
                try {
                    const chatRes = await fetch('/video_with_chat_counts.json');
                    if (chatRes.ok) {
                        const chatJson = await chatRes.json();
                        const videos = Array.isArray(chatJson?.videos) ? chatJson.videos : [];
                        chatSet = new Set(
                            videos
                                .map((v) => v?.videoId ?? v?.videoNo ?? v?.id)
                                .filter((x) => x != null)
                                .map((x) => String(x))
                        );
                    }
                } catch {
                    // ignore
                }
                if (!aborted) {
                    setChannel({ ...ch, replayCount });
                    setReplays(list);
                    if (chatSet) setChatVideoSet(chatSet);
                    setLoading(false);
                }
            } catch (err) {
                if (!aborted) {
                    setError(err);
                    setLoading(false);
                }
            }
        }
        load();
        return () => {
            aborted = true;
        };
    }, [channelId]);

    const sortedReplays = useMemo(() => {
        const list = Array.isArray(replays) ? [...replays] : [];
        // 최신순: publishDate / startDate / start
        list.sort((a, b) => {
            const aTs =
                (a?.publishDate ? Date.parse(a.publishDate) : 0) ||
                (a?.startDate ? Date.parse(a.startDate) : 0) ||
                (a?.start ? Date.parse(String(a.start).replace(' ', 'T')) : 0);
            const bTs =
                (b?.publishDate ? Date.parse(b.publishDate) : 0) ||
                (b?.startDate ? Date.parse(b.startDate) : 0) ||
                (b?.start ? Date.parse(String(b.start).replace(' ', 'T')) : 0);
            return (bTs || 0) - (aTs || 0);
        });
        return list;
    }, [replays]);

    // 카테고리/태그 집계
    const replaySummary = useMemo(() => {
        const categoriesMap = new Map();
        const tagsMap = new Map();
        for (const rp of replays) {
            const cat = rp?.categoryKo || rp?.category || null;
            if (cat) {
                categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + 1);
            }
            if (Array.isArray(rp?.tags)) {
                for (const tag of rp.tags) {
                    if (!tag) continue;
                    const t = String(tag).trim();
                    if (!t) continue;
                    tagsMap.set(t, (tagsMap.get(t) || 0) + 1);
                }
            }
        }
        const categories = Array.from(categoriesMap.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 24);
        const tags = Array.from(tagsMap.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 48);
        return {
            total: Array.isArray(replays) ? replays.length : 0,
            categories,
            tags,
        };
    }, [replays]);

    const ChannelReplaySummaryCard = ({
        summary,
        selectedCategories = [],
        selectedTags = [],
        onCategoryToggle,
        onTagToggle,
    }) => (
        <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/95 p-6 shadow-lg shadow-slate-900/40">
            {summary.total > 0 ? (
                <Stack gap="md">
                    <div>
                        <Text size="sm" fw={700} className="text-slate-100">
                            총 리플레이 {summary.total.toLocaleString('ko-KR')}개
                        </Text>
                        <Text size="xs" c="dimmed" mt={4}>
                            채널의 리플레이에서 집계한 카테고리/태그 상위 목록입니다.
                        </Text>
                    </div>
                    {summary.categories.length > 0 ? (
                        <div>
                            <Text size="xs" fw={600} c="dimmed">
                                카테고리 TOP {summary.categories.length}
                            </Text>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {summary.categories.map(({ label, count }) => (
                                    <Badge
                                        key={label}
                                        variant={selectedCategories.includes(label) ? 'filled' : 'light'}
                                        color="teal"
                                        radius="lg"
                                        size="md"
                                        className="cursor-pointer transition-colors hover:bg-teal-400/20"
                                        onClick={() => onCategoryToggle?.(label)}
                                    >
                                        {label} · {count.toLocaleString('ko-KR')}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ) : null}
                    {summary.tags.length > 0 ? (
                        <div>
                            <Text size="xs" fw={600} c="dimmed">
                                태그 TOP {summary.tags.length}
                            </Text>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {summary.tags.map(({ label, count }) => (
                                    <Badge
                                        key={label}
                                        variant={selectedTags.includes(label) ? 'filled' : 'light'}
                                        color="gray"
                                        radius="lg"
                                        size="md"
                                        className="cursor-pointer transition-colors hover:bg-teal-400/20"
                                        onClick={() => onTagToggle?.(label)}
                                    >
                                        #{label} · {count.toLocaleString('ko-KR')}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </Stack>
            ) : (
                <div className="py-2 text-center">
                    <Text size="sm" c="dimmed">
                        집계할 리플레이가 없습니다.
                    </Text>
                </div>
            )}
        </div>
    );

    // 채널 또는 데이터 변경 시 표시 개수 초기화
    useEffect(() => {
        setVisibleCount(9);
    }, [channelId, sortedReplays.length]);

    // 인터섹션 옵저버로 무한 스크롤
    useEffect(() => {
        if (!loadMoreRef.current) return;
        if (visibleCount >= sortedReplays.length) return;

        const sentinel = loadMoreRef.current;
        const onIntersect = (entries) => {
            const entry = entries[0];
            if (entry.isIntersecting) {
                setVisibleCount((prev) => Math.min(prev + 9, sortedReplays.length));
            }
        };
        const observer = new IntersectionObserver(onIntersect, {
            root: null,
            rootMargin: '200px',
            threshold: 0.01,
        });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [visibleCount, sortedReplays.length]);

    // 선택 핸들러
    const onCategoryToggle = (label) => {
        setSelectedCategories((prev) =>
            prev.includes(label) ? prev.filter((x) => x !== label) : prev.concat(label)
        );
        setVisibleCount(9);
    };
    const onTagToggle = (label) => {
        setSelectedTags((prev) =>
            prev.includes(label) ? prev.filter((x) => x !== label) : prev.concat(label)
        );
        setVisibleCount(9);
    };

    // 필터 적용된 리스트
    const filteredReplays = useMemo(() => {
        const cats = new Set(selectedCategories);
        const tags = new Set(selectedTags);
        if (cats.size === 0 && tags.size === 0) return sortedReplays;
        return sortedReplays.filter((rp) => {
            // 카테고리 조건
            if (cats.size > 0) {
                const cat = rp?.categoryKo || rp?.category || null;
                if (!cat || !cats.has(cat)) return false;
            }
            // 태그 조건
            if (tags.size > 0) {
                const rpTags = Array.isArray(rp?.tags) ? rp.tags : [];
                let ok = false;
                for (const t of rpTags) {
                    if (t && tags.has(String(t))) {
                        ok = true;
                        break;
                    }
                }
                if (!ok) return false;
            }
            return true;
        });
    }, [sortedReplays, selectedCategories, selectedTags]);

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedTags([]);
        setVisibleCount(9);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950/95 pt-28 text-slate-100">
                <Container size="xl">
                    <div className="flex items-center justify-center py-20">
                        <Text size="lg" c="dimmed">
                            데이터를 불러오는 중...
                        </Text>
                    </div>
                </Container>
            </div>
        );
    }

    if (error || !channel) {
        return (
            <div className="min-h-screen bg-slate-950/95 pt-28 text-slate-100">
                <Container size="xl">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Text size="lg" c="red" fw={600} mb="md">
                                오류가 발생했습니다
                            </Text>
                            <Text size="sm" c="dimmed">
                                {error?.message || '채널 데이터를 찾을 수 없습니다.'}
                            </Text>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950/95 pt-28 pb-8 text-slate-100">
            <Container size="xl" className="mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(864px,1fr)] gap-6 items-start justify-center max-w-full">
                    <div className="lg:sticky lg:top-28">
                        <ChannelHeader channel={channel} />
                        <div className="mt-6">
                            <RelatedChannels currentChannelId={channel.channelId} />
                        </div>
                    </div>
                    <div className="min-w-0">
                        {/* 요약 카드: 다시보기 목록 위쪽으로 이동 */}
                        <div className="mb-6">
                            <ChannelReplaySummaryCard
                                summary={replaySummary}
                                selectedCategories={selectedCategories}
                                selectedTags={selectedTags}
                                onCategoryToggle={onCategoryToggle}
                                onTagToggle={onTagToggle}
                            />
                        </div>
                        <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/95 p-6 shadow-lg shadow-slate-900/40">
                            <Text size="lg" fw={700} mb={6} className="text-slate-100">
                                다시보기 목록
                            </Text>
                            {(selectedCategories.length > 0 || selectedTags.length > 0) ? (
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    {selectedCategories.map((c) => (
                                        <span key={`sel-cat-${c}`} className="inline-flex items-center rounded-full bg-slate-800/60 px-2.5 py-1 text-xs text-slate-200">
                                            {c}
                                        </span>
                                    ))}
                                    {selectedTags.map((t) => (
                                        <span key={`sel-tag-${t}`} className="inline-flex items-center rounded-full bg-slate-800/60 px-2.5 py-1 text-xs text-slate-200">
                                            #{t}
                                        </span>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="ml-auto inline-flex items-center rounded-full border border-slate-700/70 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800/70"
                                        title="필터 초기화"
                                    >
                                        필터 초기화
                                    </button>
                                </div>
                            ) : null}
                            {sortedReplays.length === 0 ? (
                                <Text size="sm" c="dimmed">
                                    표시할 다시보기가 없습니다.
                                </Text>
                            ) : (
                                <Grid columns={12} gutter="md">
                                    {filteredReplays.slice(0, visibleCount).map((rp, idx) => (
                                        <Grid.Col key={(rp.videoNo || rp.videoId || rp.id || idx) + '-rp'} span={{ base: 12, sm: 6, md: 6, lg: 4 }}>
                                            <ReplayCard replay={rp} channel={channel} chatVideoSet={chatVideoSet} />
                                        </Grid.Col>
                                    ))}
                                </Grid>
                            )}
                            {/* 로드 모어 센티넬 */}
                            {visibleCount < filteredReplays.length ? (
                                <div ref={loadMoreRef} className="h-10 w-full" aria-hidden />
                            ) : null}
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default ChannelPage;


