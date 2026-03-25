'use client'

interface ScoreGaugeProps {
  score: number
  label: string
  color: string
  percentile: number
}

const SIZE = 160
const STROKE_WIDTH = 10
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ScoreGauge({
  score,
  label,
  color,
  percentile,
}: ScoreGaugeProps) {
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            className="text-zinc-800"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums" style={{ color }}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      <span className="text-sm font-medium" style={{ color }}>
        {label}
      </span>
      <span className="text-xs text-zinc-400">
        Melhor que {Math.round(percentile)}% dos bairros
      </span>
    </div>
  )
}
