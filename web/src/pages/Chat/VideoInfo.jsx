import { Stack, Text } from '@mantine/core';
import { formatDateRange, formatDuration } from './utils.js';

export const VideoInfo = ({ parsedStartTime, endTime, totalDuration }) => {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {parsedStartTime ? (
                <div>
                    <Text size="sm" c="dimmed" fw={600} mb={4}>
                        방송 시작
                    </Text>
                    <Text size="lg" fw={600} className="text-slate-100">
                        {parsedStartTime.toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })}
                    </Text>
                </div>
            ) : null}

            {endTime ? (
                <div>
                    <Text size="sm" c="dimmed" fw={600} mb={4}>
                        방송 종료
                    </Text>
                    <Text size="lg" fw={600} className="text-slate-100">
                        {endTime.toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })}
                    </Text>
                </div>
            ) : null}

            {totalDuration > 0 ? (
                <div>
                    <Text size="sm" c="dimmed" fw={600} mb={4}>
                        방송 길이
                    </Text>
                    <Text size="lg" fw={600} className="text-slate-100">
                        {formatDuration(totalDuration)}
                    </Text>
                </div>
            ) : null}

            {parsedStartTime && endTime ? (
                <div>
                    <Text size="sm" c="dimmed" fw={600} mb={4}>
                        방송 기간
                    </Text>
                    <Text size="lg" fw={600} className="text-slate-100">
                        {formatDateRange(parsedStartTime, endTime)}
                    </Text>
                </div>
            ) : null}
        </div>
    );
};

