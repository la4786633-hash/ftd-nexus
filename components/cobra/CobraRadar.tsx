'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils/cn'

// ============================================================
// COBRA RADAR CHART (SVG)
// ============================================================

interface RadarDataPoint {
  label: string
  value: number
  max?: number
}

interface CobraRadarProps {
  notas: RadarDataPoint[]
  size?: number
  showLabels?: boolean
  className?: string
}

export function CobraRadar({ notas, size = 120, showLabels = false, className }: CobraRadarProps) {
  const cx = size / 2
  const cy = size / 2
  const r = (size / 2) * 0.75
  const n = notas.length

  const points = useMemo(() => {
    return notas.map((nota, i) => {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2
      const pct = nota.max ? nota.value / nota.max : nota.value / 5
      return {
        ...nota,
        angle,
        x: cx + r * Math.cos(angle) * pct,
        y: cy + r * Math.sin(angle) * pct,
        gridX: cx + r * Math.cos(angle),
        gridY: cy + r * Math.sin(angle),
      }
    })
  }, [notas, cx, cy, r, n])

  const polyDataPoints = points.map(p => `${p.x},${p.y}`).join(' ')
  const polyGridPoints = points.map(p => `${p.gridX},${p.gridY}`).join(' ')

  // Grid levels (20, 40, 60, 80, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('flex-shrink-0', className)}
      role="img"
      aria-label={`Radar COBRA: ${notas.map(n => `${n.label} ${n.value}/5`).join(', ')}`}
    >
      {/* Grid polygons */}
      {gridLevels.map(level => {
        const levelPoints = points.map(p => {
          const px = cx + r * Math.cos(p.angle) * level
          const py = cy + r * Math.sin(p.angle) * level
          return `${px},${py}`
        }).join(' ')
        return (
          <polygon
            key={level}
            points={levelPoints}
            fill="none"
            stroke="rgba(9, 30, 66, 0.07)"
            strokeWidth="0.5"
          />
        )
      })}

      {/* Axis lines */}
      {points.map((p, i) => (
        <line
          key={i}
          x1={cx} y1={cy}
          x2={p.gridX} y2={p.gridY}
          stroke="rgba(9, 30, 66, 0.06)"
          strokeWidth="0.5"
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={polyDataPoints}
        fill="rgba(21, 101, 192, 0.15)"
        stroke="#1565C0"
        strokeWidth="1.5"
      />

      {/* Data points */}
      {points.map((p, i) => {
        const pct = p.max ? p.value / p.max : p.value / 5
        const color = pct >= 0.8 ? '#00875A' : pct >= 0.6 ? '#1565C0' : '#DE350B'
        return (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} aria-hidden />
        )
      })}

      {/* Labels */}
      {showLabels && points.map((p, i) => {
        const labelR = r * 1.18
        const lx = cx + labelR * Math.cos(p.angle)
        const ly = cy + labelR * Math.sin(p.angle)
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill="#6B778C"
          >
            {p.label}
          </text>
        )
      })}
    </svg>
  )
}

// ============================================================
// COBRA CRITERIA BAR
// ============================================================

interface CobraCriteriaBarProps {
  label: string
  value: number
  max?: number
  showValue?: boolean
}

export function CobraCriteriaBar({ label, value, max = 5, showValue = true }: CobraCriteriaBarProps) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct >= 80 ? '#00875A' : pct >= 60 ? '#1565C0' : '#DE350B'
  const textColor = pct >= 80 ? 'text-status-ok' : pct >= 60 ? 'text-brand-blue' : 'text-status-danger'

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-ink-secondary w-24 flex-shrink-0 truncate">{label}</span>
      <div className="progress-bar flex-1">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showValue && (
        <span className={cn('text-[10px] font-medium w-6 text-right', textColor)}>
          {value}/{max}
        </span>
      )}
    </div>
  )
}

// ============================================================
// COBRA NIVEL BADGE
// ============================================================

export function CobraNivelBadge({ nivel, pontos }: { nivel?: string | null; pontos?: number | null }) {
  if (!nivel) return null

  const colorMap: Record<string, string> = {
    'Excelente': 'badge-ok',
    'Muito bom': 'badge-ok',
    'Bom, ajustar': 'badge-warning',
    'Baixo, atenção': 'badge-danger',
    'Crítico': 'badge-danger',
  }

  return (
    <span className={cn('badge', colorMap[nivel] ?? 'badge-neutral')}>
      {pontos ? `${pontos}/25 · ` : ''}{nivel}
    </span>
  )
}
