import { Badge, Button, Group, Text, Title, Avatar } from '@mantine/core';
import { Link } from 'react-router-dom';

export const VideoHeader = ({ videoInfo, videoData }) => {
    return (
        <div className="flex flex-col gap-4">
            {videoInfo?.replay?.thumbnail ? (
                <img
                    src={videoInfo.replay.thumbnail}
                    alt={videoInfo.replay.title ? `${videoInfo.replay.title} 썸네일` : '비디오 썸네일'}
                    className="w-full rounded-2xl border border-slate-800/60 object-cover shadow-inner shadow-slate-900/40"
                    loading="lazy"
                />
            ) : null}
            <div className="min-w-0">
                {videoInfo?.replay?.title ? (
                    <Title order={1} size={24} fw={800} className="text-slate-100 break-words">
                        {videoInfo.replay.title}
                    </Title>
                ) : (
                    <div>
                        <Text size="xs" c="dimmed" fw={600} className="uppercase tracking-wide mb-2">
                            비디오 ID
                        </Text>
                        <Title order={1} size={24} fw={800} className="text-slate-100 break-words">
                            {videoData.videoId}
                        </Title>
                    </div>
                )}
                {videoInfo?.replay?.categoryKo ? (
                    <Badge size="lg" radius="md" variant="light" color="violet" className="inline-flex mt-[8px]">
                        {videoInfo.replay.categoryKo}
                    </Badge>
                ) : null}
                {Array.isArray(videoInfo?.replay?.tags) && videoInfo.replay.tags.length > 0 ? (
                    <Group gap={8} wrap="wrap" mt={'8px'}>
                        {videoInfo.replay.tags
                            .filter(Boolean)
                            .slice(0, 10)
                            .map((tag) => (
                                <Badge key={tag} size="md" radius="md" variant="light" color="gray">
                                    #{tag}
                                </Badge>
                            ))}
                    </Group>
                ) : null}
                {videoInfo?.channel?.name ? (
                    <div className="mt-[8px] mb-2">
                        {videoInfo?.channel?.channelId ? (
                            <Link
                                to={`/channel/${videoInfo.channel.channelId}`}
                                className="block rounded-xl bg-slate-900/60 px-3 py-2 transition-colors hover:bg-slate-800/70 cursor-pointer"
                                title="채널 상세로 이동"
                            >
                                <Group gap="sm" align="center" wrap="nowrap">
                                    <Avatar
                                        src={videoInfo.channel.image ? `${videoInfo.channel.image}?type=f120_120_na` : undefined}
                                        alt={videoInfo.channel.name}
                                        radius="xl"
                                        size={36}
                                    >
                                        {videoInfo.channel.name?.slice(0, 2)}
                                    </Avatar>
                                    <div className="min-w-0">
                                        <Text size="sm" fw={700} className="text-slate-100 truncate">
                                            {videoInfo.channel.name}
                                        </Text>
                                        <Text size="xs" c="dimmed" className="font-mono truncate">
                                            {videoInfo.channel.channelId}
                                        </Text>
                                    </div>
                                </Group>
                            </Link>
                        ) : (
                            <div className="rounded-xl bg-slate-900/60 px-3 py-2">
                                <Group gap="sm" align="center" wrap="nowrap">
                                    <Avatar
                                        src={videoInfo.channel.image ? `${videoInfo.channel.image}?type=f120_120_na` : undefined}
                                        alt={videoInfo.channel.name}
                                        radius="xl"
                                        size={36}
                                    >
                                        {videoInfo.channel.name?.slice(0, 2)}
                                    </Avatar>
                                    <Text size="sm" c="dimmed" fw={600} className="uppercase tracking-wide truncate">
                                        {videoInfo.channel.name}
                                    </Text>
                                </Group>
                            </div>
                        )}
                    </div>
                ) : null}
                {videoInfo?.replay?.videoNo ? (
                    <Group mt={4}>
                        <Button
                            component="a"
                            href={`https://chzzk.naver.com/video/${videoInfo.replay.videoNo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="light"
                            color="teal"
                            radius="lg"
                            size="md"
                            className="mt-0 inline-flex items-center gap-2"
                            leftSection={
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                >
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            }
                        >
                            치지직에서 보기
                        </Button>
                    </Group>
                ) : null}
            </div>
        </div>
    );
};

