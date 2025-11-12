import React from 'react';
import { useDrag } from 'react-dnd';
import AnimatedCard from './AnimatedCard.jsx';

export default function CardDraggable({ card, onPlay, animationType = 'none' }) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'CARD',
    item: { card },
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop && onPlay && item?.card) {
        onPlay(item.card);
      }
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  return (
    <div
      ref={dragRef}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'opacity 0.2s ease'
      }}
    >
      <AnimatedCard card={card} animationType={animationType} />
    </div>
  );
}
