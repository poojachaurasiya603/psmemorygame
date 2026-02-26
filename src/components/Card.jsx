import React from 'react';

const Card = ({ card, onClick, isFlipped, isMatched, isWrong }) => {
    const handleClick = () => {
        if (!isFlipped && !isMatched) {
            onClick(card);
        }
    };

    return (
        <div className={`card-scene ${isFlipped ? 'is-flipped' : ''} ${isMatched ? 'is-matched' : ''} ${isWrong ? 'is-wrong' : ''}`} onClick={handleClick}>
            <div className="card-object">
                <div className="card-face card-face-front">
                    {/* Logo or pattern, styling is in CSS */}
                    <span style={{ fontSize: '1.2rem', opacity: 0.3 }}>?</span>
                </div>
                <div className="card-face card-face-back">
                    {/* Usually emoji or image. We generate pairs dynamically. */}
                    {card.icon}
                </div>
            </div>
        </div>
    );
};

export default Card;
