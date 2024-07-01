import React, { useState, useEffect } from 'react';
import './Blackjack.css';

const Blackjack = () => {
    const [deckId, setDeckId] = useState("");
    const [playerCards, setPlayerCards] = useState([]);
    const [houseCards, setHouseCards] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [staying, setStaying] = useState(false);
    const [playerCount, setPlayerCount] = useState(0);
    const [houseCount, setHouseCount] = useState(0);

    useEffect(() => {
        fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
            .then(response => response.json())
            .then(data => setDeckId(data.deck_id))
            .catch(error => console.error('Error fetching new deck:', error));
    }, []);

    const drawCards = (count) => {
        return fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to draw cards');
                }
                return response.json();
            })
            .then(data => {
                return data.cards.map(card => ({
                    ...card,
                    image: card.image
                }));
            })
            .catch(error => console.error('Error drawing cards:', error));
    };

    const dealHands = async () => {
        try {
            const playerCards = await drawCards(2);
            const houseCards = await drawCards(2);
            setPlayerCards(playerCards);
            setHouseCards(houseCards);
            setPlayerCount(calculateCount(playerCards));
            setHouseCount(calculateCount(houseCards));
            setStaying(false);
            setGameStarted(true);
        } catch (error) {
            console.error('Error dealing hands:', error);
        }
    };

    const getAHit = async () => {
        try {
            const newCard = await drawCards(1);
            const newPlayerCards = [...playerCards, ...newCard];
            setPlayerCards(newPlayerCards);
            setPlayerCount(calculateCount(newPlayerCards));
        } catch (error) {
            console.error('Error getting a hit:', error);
        }
    };

    const houseHit = async () => {
        let newHouseCards = houseCards;
        let count = calculateCount(houseCards);
        while (count <= 16) {
            const newCard = await drawCards(1);
            newHouseCards = [...newHouseCards, ...newCard];
            count = calculateCount(newHouseCards);
        }
        setHouseCards(newHouseCards);
        setHouseCount(calculateCount(newHouseCards));
    };

    const calculateCount = (cards) => {
        let count = 0;
        let aces = 0;
        cards.forEach(card => {
            const value = card.value;
            if (!isNaN(value)) {
                count += parseInt(value);
            } else if (value === 'ACE') {
                aces += 1;
                count += 11;
            } else {
                count += 10;
            }
        });
        while (count > 21 && aces > 0) {
            count -= 10;
            aces -= 1;
        }
        return count;
    };

    const revealHands = () => {
        setStaying(true);
        houseHit();
    };

    return (
        <div className="container">
            <button onClick={dealHands} className="deal-button">Deal Hands</button>
            <div>
                <div className="hand" hidden={!staying}>
                    <div hidden={houseCards.length === 0} className="card-label">House's cards:</div>
                    <div className="card-images">
                        {houseCards.map((card, index) => (
                            <img key={index} src={card.image} alt={`${card.value} of ${card.suit}`} className="card" />
                        ))}
                    </div>
                </div>
                <div className="hand">
                    <div hidden={playerCards.length === 0} className="card-label">Player's cards:</div>
                    <div className="card-images">
                        {playerCards.map((card, index) => (
                            <img key={index} src={card.image} alt={`${card.value} of ${card.suit}`} className="card" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="button-group">
                <button onClick={getAHit} disabled={staying || !gameStarted}>Get a Hit</button>
                <button onClick={revealHands} disabled={staying || !gameStarted}>Stay</button>
            </div>
            <div hidden={!staying} className="result">
                {playerCount > houseCount && playerCount <= 21 ? 'You win!' : 'House wins'}
            </div>
        </div>
    );
};

export default Blackjack;
