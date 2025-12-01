"use client"

import { InteractionData } from "./Heatmap"
import styles from "./tooltip.module.css"

type TooltipProps = {
  interactionData: InteractionData | null
  width: number
  height: number
}

export const Tooltip = ({ interactionData, width, height }: TooltipProps) => {
  if (!interactionData) {
    return null
  }

  return (
    <div
      style={{
        width,
        height,
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      <div
        className={styles.tooltip}
        style={{
          position: "absolute",
          left: interactionData.xPos,
          top: interactionData.yPos,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "4px", color: "#150773" }}>
          {interactionData.yLabel}
        </div>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "2px" }}>
          {interactionData.xLabel}
        </div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#f5592b" }}>
          Δ {interactionData.value !== null ? interactionData.value.toFixed(2) : 'N/A'}%
        </div>
      </div>
    </div>
  )
}

