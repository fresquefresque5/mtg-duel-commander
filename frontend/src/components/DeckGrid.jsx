import React from "react";
import AnimatedCard from "./AnimatedCard";

export default function DeckGrid({ cards = [] }) {
  if (!cards || cards.length === 0) {
    return <p style={{ color: "#ccc", textAlign: "center", marginTop: "40px" }}>No hay cartas importadas todavía.</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
        padding: "20px",
        justifyItems: "center",
        alignItems: "start",
        maxHeight: "80vh",
        overflowY: "auto",
        background: "rgba(0, 0, 0, 0.6)",
        borderRadius: "12px",
      }}
    >
      {cards.map((card) => (
        <AnimatedCard key={card.id} card={card} />
      ))}
    </div>
  );
}
