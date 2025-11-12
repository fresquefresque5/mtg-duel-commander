import React from 'react';
import { useDrag } from 'react-dnd';
import AnimatedCard from './AnimatedCard.jsx';

export default function CardDraggable({ card, onPlay }) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'CARD',
    item: { card },
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop && onPlay) onPlay(item.card);
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  return (
    <div ref={dragRef} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}>
      <AnimatedCard card={card} />
    </div>
  );
}
