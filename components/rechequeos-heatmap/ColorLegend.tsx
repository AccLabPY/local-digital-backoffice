"use client"

import { InteractionData } from "./Heatmap"
import * as d3 from "d3"
import { useEffect, useRef } from "react"

type ColorLegendProps = {
  height: number
  width: number
  colorScale: d3.ScaleLinear<string, string, never>
  interactionData: InteractionData | null
  min: number
  max: number
  viewMode?: 'combined' | 'positive' | 'negative'
}

const COLOR_LEGEND_MARGIN = { top: 0, right: 0, bottom: 30, left: 0 }

export const ColorLegend = ({
  height,
  colorScale,
  width,
  interactionData,
  min,
  max,
  viewMode = 'combined',
}: ColorLegendProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const boundsWidth = width - COLOR_LEGEND_MARGIN.right - COLOR_LEGEND_MARGIN.left
  const boundsHeight = height - COLOR_LEGEND_MARGIN.top - COLOR_LEGEND_MARGIN.bottom

  const xScale = d3.scaleLinear().range([0, boundsWidth]).domain([min, max])

  // Dibujar el gradiente de color en el canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")

    if (!context || !canvas) {
      return
    }

    // Limpiar el canvas primero
    context.clearRect(0, 0, canvas.width, canvas.height)
    
    // Asegurar que el canvas tenga las dimensiones correctas
    if (canvas.width !== boundsWidth) {
      canvas.width = boundsWidth
    }
    if (canvas.height !== boundsHeight) {
      canvas.height = boundsHeight
    }

    // Dibujar el gradiente
    for (let i = 0; i < boundsWidth; ++i) {
      const value = min + ((max - min) * i) / boundsWidth
      context.fillStyle = colorScale(value)
      context.fillRect(i, 0, 1, boundsHeight)
    }
  }, [width, height, colorScale, min, max, boundsWidth, boundsHeight])

  // Generar ticks según el modo de vista
  let ticksSet = new Set(xScale.ticks(5))
  
  if (viewMode === 'combined') {
    // Para modo combinado, incluir 0 si hay valores negativos y positivos
    if (!ticksSet.has(0) && min < 0 && max > 0) {
      ticksSet.add(0)
    }
  } else if (viewMode === 'positive') {
    // Para modo positivo, asegurar que 0 esté incluido
    if (!ticksSet.has(0) && min >= 0) {
      ticksSet.add(0)
    }
  } else if (viewMode === 'negative') {
    // Para modo negativo, asegurar que 0 esté incluido
    if (!ticksSet.has(0) && max <= 0) {
      ticksSet.add(0)
    }
  }
  
  const allTicks = Array.from(ticksSet).sort((a, b) => a - b).map((tick, i) => {
    const isZero = Math.abs(tick) < 0.01
    const formattedValue = viewMode === 'positive' 
      ? `${tick.toFixed(1)}` 
      : viewMode === 'negative'
      ? `${tick.toFixed(1)}`
      : tick > 0 
      ? `+${tick.toFixed(1)}` 
      : tick.toFixed(1)
    
    return (
      <g key={i}>
        <line
          x1={xScale(tick)}
          x2={xScale(tick)}
          y1={0}
          y2={boundsHeight + 5}
          stroke={isZero && viewMode === 'combined' ? "#333" : "#666"}
          strokeWidth={isZero && viewMode === 'combined' ? 2 : 1}
        />
        <text
          x={xScale(tick)}
          y={boundsHeight + 18}
          fontSize={10}
          textAnchor="middle"
          fill={isZero && viewMode === 'combined' ? "#333" : "#666"}
          fontWeight={isZero && viewMode === 'combined' ? "bold" : "normal"}
        >
          {formattedValue}%
        </text>
      </g>
    )
  })

  // Triángulo indicador para el valor hover
  const hoveredValue = interactionData?.value
  const x = hoveredValue ? xScale(hoveredValue) : null
  const triangleWidth = 8
  const triangleHeight = 5
  const triangle = x !== null && x !== undefined ? (
    <polygon
      points={`${x},0 ${x - triangleWidth / 2},${-triangleHeight} ${x + triangleWidth / 2},${-triangleHeight}`}
      fill="#150773"
    />
  ) : null

  return (
    <div style={{ width, height }}>
      <div
        style={{
          position: "relative",
          transform: `translate(${COLOR_LEGEND_MARGIN.left}px, ${COLOR_LEGEND_MARGIN.top}px)`,
        }}
      >
        <canvas ref={canvasRef} width={boundsWidth} height={boundsHeight} />
        <svg
          width={boundsWidth}
          height={boundsHeight + COLOR_LEGEND_MARGIN.bottom}
          style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
        >
          {allTicks}
          {triangle}
        </svg>
      </div>
    </div>
  )
}

