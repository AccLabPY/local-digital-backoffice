"use client"

import { useMemo } from "react"
import * as d3 from "d3"
import { InteractionData, HeatmapData } from "./Heatmap"
import styles from "./renderer.module.css"

const MARGIN = { top: 10, right: 10, bottom: 80, left: 400 }

type RendererProps = {
  width: number
  height: number
  data: HeatmapData[]
  setHoveredCell: (hoveredCell: InteractionData | null) => void
  colorScale: d3.ScaleLinear<string, string, never>
  viewMode?: 'combined' | 'positive' | 'negative'
}

export const Renderer = ({
  width,
  height,
  data,
  setHoveredCell,
  colorScale,
  viewMode = 'combined',
}: RendererProps) => {
  // bounds = area inside the axis
  const boundsWidth = width - MARGIN.right - MARGIN.left
  const boundsHeight = height - MARGIN.top - MARGIN.bottom

  // Obtener grupos únicos
  const allYGroups = useMemo(() => [...new Set(data.map((d) => d.y))], [data])
  const allXGroups = useMemo(() => [...new Set(data.map((d) => d.x))], [data])

  // Escalas
  const xScale = useMemo(() => {
    return d3
      .scaleBand()
      .range([0, boundsWidth])
      .domain(allXGroups)
      .padding(0.05)
  }, [data, boundsWidth, allXGroups])

  const yScale = useMemo(() => {
    return d3
      .scaleBand<string>()
      .range([0, boundsHeight])
      .domain(allYGroups)
      .padding(0.05)
  }, [data, boundsHeight, allYGroups])

  // Renderizar rectángulos
  const allRects = data.map((d, i) => {
    const xPos = xScale(d.x)
    const yPos = yScale(d.y)

    if (d.value === null || xPos === undefined || yPos === undefined) {
      return null
    }

    return (
      <rect
        key={i}
        x={xPos}
        y={yPos}
        className={styles.rectangle}
        width={xScale.bandwidth()}
        height={yScale.bandwidth()}
        fill={d.value !== null ? colorScale(d.value) : "#F8F8F8"}
        stroke="#ffffff"
        strokeWidth={1}
        onMouseEnter={() => {
          setHoveredCell({
            xLabel: d.x,
            yLabel: d.y,
            xPos: xPos + xScale.bandwidth() + MARGIN.left,
            yPos: yPos + yScale.bandwidth() / 2 + MARGIN.top,
            value: d.value ? Math.round(d.value * 100) / 100 : null,
          })
        }}
      />
    )
  })

  // Labels del eje X (Dimensiones)
  const xLabels = allXGroups.map((name, i) => {
    const xPos = xScale(name)
    if (xPos === undefined) return null
    
    return (
      <text
        key={i}
        x={xPos + xScale.bandwidth() / 2}
        y={boundsHeight + 20}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
        fill="#150773"
        fontWeight={500}
      >
        {name}
      </text>
    )
  })

  // Labels del eje Y (Sectores)
  const yLabels = allYGroups.map((name, i) => {
    const yPos = yScale(name)
    if (yPos === undefined) return null

    // Truncar nombres largos - ahora con mucho más espacio disponible
    const displayName = name.length > 45 ? name.substring(0, 45) + "..." : name

    return (
      <text
        key={i}
        x={MARGIN.left - 15}
        y={yPos + yScale.bandwidth() / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={11}
        fill="#666"
      >
        {displayName}
      </text>
    )
  })

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onMouseLeave={() => setHoveredCell(null)}
      style={{ 
        overflow: 'visible',
        display: 'block',
        backgroundColor: '#ffffff'
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        width={boundsWidth}
        height={boundsHeight}
        transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
      >
        {allRects}
        {xLabels}
      </g>
      {/* Labels del eje Y fuera del grupo transformado para que puedan extenderse más hacia la izquierda */}
      <g transform={`translate(0, ${MARGIN.top})`}>
        {yLabels}
      </g>
    </svg>
  )
}

