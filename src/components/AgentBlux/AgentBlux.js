import React, { useEffect, useRef, useState } from 'react';
import './AgentBlux.css';

const STATUS_COLORS = {
    idle: { core: '#38bdf8', glow: '#0ea5e9', label: 'Idle' },
    thinking: { core: '#818cf8', glow: '#6366f1', label: 'Thinking…' },
    active: { core: '#34d399', glow: '#10b981', label: 'Active' },
    offline: { core: '#94a3b8', glow: '#64748b', label: 'Offline' }
};

const AgentBlux = ({
    name = 'Blux AI',
    status = 'idle',
    size = 180,
    onChat,
    caption
}) => {
    const [blinking, setBlinking] = useState(false);
    const timeoutsRef = useRef([]);

    useEffect(() => {
        const scheduleNext = () => {
            const delay = 2000 + Math.random() * 4000;
            const t1 = setTimeout(() => {
                setBlinking(true);
                const t2 = setTimeout(() => {
                    setBlinking(false);
                    scheduleNext();
                }, 180);
                timeoutsRef.current.push(t2);
            }, delay);
            timeoutsRef.current.push(t1);
        };
        scheduleNext();
        return () => {
            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];
        };
    }, []);

    const sc = STATUS_COLORS[status] || STATUS_COLORS.idle;
    const isOffline = status === 'offline';
    const interactive = typeof onChat === 'function';

    return (
        <div
            className={`blux-wrapper blux-status-${status}${interactive ? ' is-interactive' : ''}`}
            style={{ width: size }}
            onClick={interactive ? onChat : undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={(e) => {
                if (!interactive) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChat();
                }
            }}
            aria-label={interactive ? `${name} — ${sc.label}. Open assistant.` : `${name} — ${sc.label}`}
            title={interactive ? `${name} — ${sc.label}` : undefined}
        >
            <div className={`blux-stage${isOffline ? ' is-offline' : ''}`}>
                <div className="blux-glow" aria-hidden />
                <svg className="blux-svg" viewBox="0 0 680 520" xmlns="http://www.w3.org/2000/svg">
                    <ellipse className="blux-shadow" cx="340" cy="490" rx="92" ry="12" fill="#0ea5e9" opacity="0.18" />
                    <g className={isOffline ? '' : 'blux-float'}>
                        <g className={isOffline ? '' : 'blux-bob'}>
                            <rect x="304" y="390" width="22" height="60" rx="10" fill="#0369a1" />
                            <rect x="354" y="390" width="22" height="60" rx="10" fill="#0369a1" />
                            <rect x="296" y="442" width="36" height="14" rx="7" fill="#0284c7" />
                            <rect x="348" y="442" width="36" height="14" rx="7" fill="#0284c7" />

                            <rect x="280" y="240" width="120" height="160" rx="22" fill="#0284c7" />
                            <rect x="297" y="260" width="86" height="50" rx="8" fill="#0369a1" opacity="0.55" />
                            <circle
                                cx="340"
                                cy="285"
                                r="18"
                                fill={sc.glow}
                                opacity="0.9"
                                className={isOffline ? '' : 'blux-pulse'}
                            />
                            <circle cx="340" cy="285" r="10" fill={isOffline ? '#475569' : '#e0f2fe'} />
                            {[305, 320, 335, 350, 365].map((x, i) => (
                                <circle
                                    key={x}
                                    cx={x}
                                    cy="330"
                                    r="5"
                                    fill={sc.core}
                                    className={isOffline ? '' : 'blux-pulse'}
                                    style={{ animationDelay: `${i * 0.35}s` }}
                                />
                            ))}
                            {[360, 370, 380].map((y) => (
                                <line
                                    key={y}
                                    x1="300"
                                    y1={y}
                                    x2="380"
                                    y2={y}
                                    stroke="#0369a1"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                            ))}

                            <g className={isOffline ? '' : 'blux-arm-left'}>
                                <rect x="236" y="252" width="50" height="20" rx="10" fill="#0369a1" />
                                <rect x="220" y="248" width="28" height="28" rx="14" fill="#0284c7" />
                                <circle cx="215" cy="262" r="12" fill={sc.core} />
                            </g>
                            <g className={isOffline ? '' : 'blux-arm-right'}>
                                <rect x="394" y="252" width="50" height="20" rx="10" fill="#0369a1" />
                                <rect x="432" y="248" width="28" height="28" rx="14" fill="#0284c7" />
                                <circle cx="465" cy="262" r="12" fill={sc.core} />
                            </g>

                            <rect x="325" y="225" width="30" height="20" rx="6" fill="#0369a1" />
                            <g className={isOffline ? '' : 'blux-head-tilt'}>
                                <rect x="270" y="140" width="140" height="95" rx="24" fill="#0ea5e9" />
                                <rect x="336" y="110" width="8" height="35" rx="4" fill="#0284c7" />
                                <circle
                                    cx="340"
                                    cy="106"
                                    r="9"
                                    fill={sc.core}
                                    className={isOffline ? '' : 'blux-pulse'}
                                    style={{ animationDelay: '0.5s' }}
                                />
                                <rect x="260" y="162" width="18" height="30" rx="9" fill="#0284c7" />
                                <rect x="402" y="162" width="18" height="30" rx="9" fill="#0284c7" />
                                <circle
                                    cx="269"
                                    cy="177"
                                    r="5"
                                    fill={sc.core}
                                    className={isOffline ? '' : 'blux-pulse'}
                                    style={{ animationDelay: '1s' }}
                                />
                                <circle
                                    cx="411"
                                    cy="177"
                                    r="5"
                                    fill={sc.core}
                                    className={isOffline ? '' : 'blux-pulse'}
                                    style={{ animationDelay: '1s' }}
                                />
                                <rect x="283" y="158" width="114" height="38" rx="10" fill="#0c4a6e" opacity="0.85" />
                                {[315, 365].map((cx) => (
                                    <g key={cx}>
                                        <ellipse cx={cx} cy="177" rx="16" ry="13" fill="#0c4a6e" />
                                        <ellipse
                                            cx={cx}
                                            cy="177"
                                            rx="11"
                                            ry={blinking || isOffline ? 1 : 9}
                                            fill={isOffline ? '#475569' : sc.core}
                                            style={{ transition: 'ry 0.07s ease' }}
                                        />
                                        {!isOffline && !blinking && (
                                            <>
                                                <ellipse cx={cx} cy="177" rx="5" ry="4" fill="#e0f2fe" />
                                                <circle cx={cx + 2} cy="175" r="2" fill="white" opacity="0.7" />
                                            </>
                                        )}
                                    </g>
                                ))}
                                <rect x="305" y="207" width="70" height="18" rx="9" fill="#0369a1" />
                                {[311, 325, 339, 353].map((x, i) => (
                                    <rect
                                        key={x}
                                        x={x}
                                        y="211"
                                        width="10"
                                        height="10"
                                        rx="2"
                                        fill={isOffline ? '#475569' : sc.core}
                                        className={
                                            isOffline
                                                ? ''
                                                : status === 'thinking'
                                                ? 'blux-wave'
                                                : 'blux-pulse'
                                        }
                                        style={{ animationDelay: `${i * 0.3}s` }}
                                    />
                                ))}
                            </g>
                        </g>
                    </g>
                </svg>
            </div>

            <div className="blux-label">
                <span className="blux-name">{name}</span>
                <span className={`blux-badge blux-badge-${status}`}>{sc.label}</span>
                {caption ? <span className="blux-caption">{caption}</span> : null}
            </div>
        </div>
    );
};

export default AgentBlux;
