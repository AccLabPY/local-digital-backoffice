"use client"

import { useState } from "react"
import { Renderer } from "./Renderer"
import { Tooltip } from "./Tooltip"
import { ColorLegend } from "./ColorLegend"
import * as d3 from "d3"

export type HeatmapData = {
  x: string // Dimensión (Tecnología, Comunicación, etc.)
  y: string // Sector
  value: number | null
}

export type HeatmapViewMode = 'combined' | 'positive' | 'negative'

type HeatmapProps = {
  width: number
  height: number
  data: HeatmapData[]
  viewMode?: HeatmapViewMode
}

export type InteractionData = {
  xLabel: string
  yLabel: string
  xPos: number
  yPos: number
  value: number | null
}

const COLOR_LEGEND_HEIGHT = 60

export const Heatmap = ({ width, height, data, viewMode = 'combined' }: HeatmapProps) => {
  const [hoveredCell, setHoveredCell] = useState<InteractionData | null>(null)

  // Filtrar datos según el modo de vista y excluir valores null
  const filteredData = data.filter((d) => {
    if (d.value === null) return false
    
    switch (viewMode) {
      case 'positive':
        return d.value > 0
      case 'negative':
        return d.value < 0
      case 'combined':
      default:
        return true
    }
  })

  // Obtener valores para la escala de colores
  const values = filteredData
    .map((d) => d.value)
    .filter((d): d is number => d !== null)
  
  const min = d3.min(values) || 0
  const max = d3.max(values) || 0
  
  // Escala de color según el modo de vista
  let colorScale: d3.ScaleLinear<string, string, never>
  
  if (viewMode === 'positive') {
    // Solo cambios positivos - escala verde
    colorScale = d3
      .scaleLinear<string>()
      .domain([0, max > 0 ? max : 1])
      .range(["#e6f7e6", "#2f855a"])
      .interpolate(d3.interpolateRgb)
      .clamp(true)
  } else if (viewMode === 'negative') {
    // Solo cambios negativos - escala roja
    colorScale = d3
      .scaleLinear<string>()
      .domain([min < 0 ? min : -1, 0])
      .range(["#c53030", "#ffe6e6"])
      .interpolate(d3.interpolateRgb)
      .clamp(true)
  } else {
    // Combinado - escala divergente rojo-blanco-verde
    const maxAbsValue = Math.max(Math.abs(min), Math.abs(max))
    colorScale = d3
      .scaleLinear<string>()
      .domain([-maxAbsValue, 0, maxAbsValue])
      .range(["#c53030", "#ffffff", "#2f855a"])
      .interpolate(d3.interpolateRgb)
      .clamp(true)
  }

  return (
    <div 
      style={{ 
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#ffffff',
        display: 'block'
      }}
    >
      <Renderer
        width={width}
        height={height - COLOR_LEGEND_HEIGHT}
        data={filteredData}
        setHoveredCell={setHoveredCell}
        colorScale={colorScale}
        viewMode={viewMode}
      />
      <Tooltip
        interactionData={hoveredCell}
        width={width}
        height={height - COLOR_LEGEND_HEIGHT}
      />
      <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "10px" }}>
        <ColorLegend
          height={COLOR_LEGEND_HEIGHT}
          width={300}
          colorScale={colorScale}
          interactionData={hoveredCell}
          min={min}
          max={max}
          viewMode={viewMode}
        />
      </div>
    </div>
  )
}

