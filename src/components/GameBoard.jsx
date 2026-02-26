import React from 'react';
import Card from './Card';

const GameBoard = ({ cards, onCardClick, flippedCards, matchedCards, wrongCards, difficulty }) => {
    const gridClass = difficulty === '8x8' ? 'grid-8x8' : difficulty === '6x6' ? 'grid-6x6' : 'grid-4x4';

    return (
        <div className={`cards-grid ${gridClass}`}>
            {cards.map((card) => {
                const isFlipped = flippedCards.some(f => f.id === card.id) || matchedCards.includes(card.id);
                const isMatched = matchedCards.includes(card.id);
                const isWrong = wrongCards.includes(card.id);

                return (
                    <Card
                        key={card.id}
                        card={card}
                        onClick={onCardClick}
                        isFlipped={isFlipped}
                        isMatched={isMatched}
                        isWrong={isWrong}
                    />
                );
            })}
        </div>
    );
};

export default GameBoard;
