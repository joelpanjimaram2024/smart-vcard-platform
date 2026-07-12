import React from 'react';

interface TimelineData {
  date: string;
  views: number;
  scans: number;
  downloads: number;
}

interface InteractiveChartProps {
  data: TimelineData[];
  selectedMetric: 'views' | 'scans' | 'downloads';
  color?: string;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ 
  data = [], 
  selectedMetric = 'views',
  color = '#4f46e5'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 dark:border-white/5 rounded-xl">
        <p className="text-sm text-gray-400">No timeline data available</p>
      </div>
    );
  }

  // Get active values
  const values = data.map(d => d[selectedMetric] || 0);
  const maxVal = Math.max(...values, 10); // Ensure division by zero safety
  const minVal = 0;

  // Formatting date string to short label (e.g., Jul 11)
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    } catch {
      return dateStr;
    }
  };

  // Dimensions of SVG
  const width = 600;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d[selectedMetric] || 0) / maxVal) * chartHeight;
    return { x, y, data: d };
  });

  // Build SVG Path
  let pathD = '';
  let areaD = '';

  if (points.length > 0) {
    // Generate simple polyline or cubic bezier
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    // Generate closed area path for gradient fill
    areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  // Y-Axis Ticks
  const yTicks = [0, Math.floor(maxVal * 0.25), Math.floor(maxVal * 0.5), Math.floor(maxVal * 0.75), maxVal];

  // Metric styling colors
  const metricColorMap = {
    views: { line: '#4f46e5', fill: 'url(#gradient-views)' },
    scans: { line: '#10b981', fill: 'url(#gradient-scans)' },
    downloads: { line: '#f59e0b', fill: 'url(#gradient-downloads)' }
  };

  const style = metricColorMap[selectedMetric] || { line: color, fill: 'none' };

  return (
    <div className="w-full">
      {/* Chart Legend Summary */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500">Active Metric Timeline</span>
          <h4 className="text-2xl font-black text-gray-900 dark:text-white capitalize flex items-center gap-2">
            {selectedMetric}
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: style.line }} />
          </h4>
        </div>
        <div className="flex gap-4 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-indigo-600 inline-block" />
            <span>Views</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-500 inline-block" />
            <span>QR Scans</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-amber-500 inline-block" />
            <span>Downloads</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50/50 dark:bg-[#161618]/30 p-4 rounded-2xl border border-gray-150 dark:border-white/5">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            {/* Gradients */}
            <linearGradient id="gradient-views" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-scans" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-downloads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = paddingTop + chartHeight - (tick / maxVal) * chartHeight;
            return (
              <g key={i}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  className="stroke-gray-100 dark:stroke-white/5" 
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  textAnchor="end" 
                  className="fill-gray-400 dark:fill-gray-500 text-[10px] font-mono font-medium"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, index) => {
            // Render labels for index 0, mid, and last
            const isLabel = index === 0 || index === Math.floor((data.length - 1) / 2) || index === data.length - 1;
            if (!isLabel) return null;
            
            const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
            return (
              <text
                key={index}
                x={x}
                y={height - paddingBottom + 18}
                textAnchor="middle"
                className="fill-gray-400 dark:fill-gray-500 text-[9px] font-bold tracking-wider"
              >
                {formatDate(d.date)}
              </text>
            );
          })}

          {/* Gradient Area Fill */}
          {areaD && (
            <path 
              d={areaD} 
              fill={style.fill} 
              className="transition-all duration-500 ease-in-out"
            />
          )}

          {/* Spline Line Path */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke={style.line} 
              strokeWidth={2.5} 
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-in-out"
            />
          )}

          {/* Interactive Data Markers */}
          {points.map((p, i) => (
            <g key={i} className="group/dot cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r={4}
                fill={style.line}
                className="stroke-white dark:stroke-[#111113] group-hover/dot:r-6 transition-all duration-200"
                strokeWidth={1.5}
              />
              {/* Custom micro-tooltip on hover */}
              <g className="opacity-0 group-hover/dot:opacity-100 pointer-events-none transition-all duration-200">
                <rect
                  x={p.x - 25}
                  y={p.y - 32}
                  width={50}
                  height={22}
                  rx={4}
                  fill="#000000"
                  className="fill-slate-900 dark:fill-[#161618]"
                />
                <text
                  x={p.x}
                  y={p.y - 18}
                  textAnchor="middle"
                  fill="#ffffff"
                  className="text-[9px] font-black font-mono fill-white"
                >
                  {p.data[selectedMetric]}
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
