
"use client";

import { useState, useEffect, useCallback } from 'react';
import EventSimulatorClient from './event-simulator-client';

// ==================================================================
// 修正点 2:
// EventSimulatorClient 呼び出し時の key プロパティを削除
// ==================================================================
export default function SequencePlayerClient({ sequence, onSequenceComplete }: { sequence: any, onSequenceComplete: () => void }) {
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [eventHistory, setEventHistory] = useState<string[]>([]);

    const eventIds = sequence.eventIds || [];
    const currentEventId = eventIds[currentEventIndex];

    const handleEventComplete = useCallback(() => {
        setCurrentEventIndex(prevIndex => {
            const nextIndex = prevIndex + 1;
            if (nextIndex < eventIds.length) {
                const completedEventId = eventIds[prevIndex];
                setEventHistory(prevHistory => [...prevHistory, completedEventId]);
                return nextIndex;
            } else {
                onSequenceComplete();
                return prevIndex;
            }
        });
    }, [eventIds, onSequenceComplete]);


    if (!currentEventId) {
        return <div>シーケンスの終端です。</div>;
    }

    return (
        <div>
            <div className="mb-4 p-2 border rounded bg-slate-50/50">
                <h3 className="font-bold text-sm text-slate-600">物語の記憶</h3>
                <ul className='text-xs text-slate-500'>
                    {eventHistory.map((id, index) => <li key={index}>{id}</li>)}
                    {eventHistory.length === 0 && <li>まだ再生されたイベントはありません。</li>}
                </ul>
            </div>

            {/* key プロパティを削除し、eventId prop の変更で内部的に更新されるようにする */}
            <EventSimulatorClient
                eventId={currentEventId}
                onEventComplete={handleEventComplete}
            />
        </div>
    );
}
