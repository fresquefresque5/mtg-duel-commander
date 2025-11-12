// frontend/src/components/CardBack.jsx
import React from "react";

export default function CardBack({ size = "normal", style = {}, draggable = false }) {
  const sizes = {
    small: { width: 60, height: 84 },
    normal: { width: 90, height: 126 },
    large: { width: 120, height: 168 }
  };

  const { width, height } = sizes[size] || sizes.normal;

  return (
    <div
      draggable={draggable}
      style={{
        width,
        height,
        borderRadius: 8,
        background:
          "radial-gradient(circle at 30% 30%, #222 0%, #111 100%)",
        border: "2px solid rgba(255,255,255,0.2)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(15deg)",
          fontSize: width / 2.8,
          fontWeight: "bold",
          color: "rgba(255,255,255,0.15)",
          userSelect: "none",
        }}
      >
        MTG
      </div>
    </div>
  );
}
