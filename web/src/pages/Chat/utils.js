export const formatDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return '시간 정보 없음';
    if (startDate && !endDate) return `${startDate.toLocaleString('ko-KR')} 시작`;
    if (!startDate && endDate) return `${endDate.toLocaleString('ko-KR')} 종료`;

    return `${startDate.toLocaleString('ko-KR')} ~ ${endDate.toLocaleString('ko-KR')}`;
};

export const formatDuration = (durationSec) => {
    if (typeof durationSec !== 'number' || durationSec <= 0) return null;

    const totalMinutes = Math.max(Math.round(durationSec / 60), 0);
    if (totalMinutes <= 0) return '1분 미만';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0) parts.push(`${minutes}분`);

    return parts.join(' ') || '1분 미만';
};

export const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // 항상 HH:MM:SS 형식으로 반환
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const formatTimeShort = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    // HH:MM 형식으로 반환
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

