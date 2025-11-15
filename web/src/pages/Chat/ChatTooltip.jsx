import { formatTime } from './utils.js';

export const ChatTooltip = ({ hoveredPoint, tooltipPosition, isFirstRender, parsedStartTime }) => {
    if (!hoveredPoint || !tooltipPosition) return null;

    return (
        <div
            className={`fixed pointer-events-none z-50 ${isFirstRender ? '' : 'transition-all duration-300 ease-out'}`}
            style={{
                left: `${tooltipPosition.x + 15}px`,
                top: `${tooltipPosition.y - 70}px`,
                transform: 'translateY(-50%)',
            }}
        >
            <div className="rounded-lg border border-slate-700/70 bg-slate-900/95 px-4 py-3 shadow-lg shadow-slate-900/40 min-w-[180px]">
                <div className="space-y-2">
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                            다시보기 시간
                        </div>
                        <div className="text-sm font-semibold text-slate-100">
                            {formatTime(hoveredPoint.time)}
                        </div>
                    </div>
                    {parsedStartTime ? (
                        <div>
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                                시간
                            </div>
                            <div className="text-sm font-semibold text-slate-100">
                                {new Date(parsedStartTime.getTime() + hoveredPoint.time * 1000).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false,
                                })}
                            </div>
                        </div>
                    ) : null}
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                            채팅 수
                        </div>
                        <div className="text-sm font-bold text-teal-300">
                            {hoveredPoint.count.toLocaleString('ko-KR')}개
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

