// Shared formatting helpers for the live CSE dashboard widgets.

export const fmtNum = (value, dp = 2) => {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: dp,
        maximumFractionDigits: dp
    });
};

export const fmtCompact = (value) => {
    if (value == null || Number.isNaN(Number(value))) return '—';
    const n = Number(value);
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
    return `${sign}${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

export const fmtPct = (value) => {
    if (value == null || Number.isNaN(Number(value))) return '—';
    const n = Number(value);
    return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
};

export const pctClass = (value) => {
    if (value == null || Number(value) === 0) return 'flat';
    return Number(value) > 0 ? 'up' : 'down';
};

export const fmtTime = (iso) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return '';
    }
};

// Build an SVG sparkline path from a numeric series.
export const sparklinePath = (values, width = 240, height = 48, pad = 2) => {
    const nums = (values || []).map((v) => Number(v)).filter((v) => !Number.isNaN(v));
    if (nums.length < 2) return { line: '', area: '', up: true };
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const span = max - min || 1;
    const stepX = (width - pad * 2) / (nums.length - 1);
    const points = nums.map((v, i) => {
        const x = pad + i * stepX;
        const y = pad + (height - pad * 2) * (1 - (v - min) / span);
        return [x, y];
    });
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${points[points.length - 1][0].toFixed(1)},${height - pad} L${points[0][0].toFixed(1)},${height - pad} Z`;
    return { line, area, up: nums[nums.length - 1] >= nums[0] };
};
