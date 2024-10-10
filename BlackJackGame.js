document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector('.Nav-Header');
    const game = document.querySelector('.Game');
    const gameChildren = Array.from(game.children);

    const dealerImages = document.querySelectorAll('.Dealer-Card-Image'); 
    const playerImages = document.querySelectorAll('.User-Card-Image');
    const gameFooterImagesDiv = document.querySelector('.Game-Footer-Images');
    const gameHeaderImagesDiv = document.querySelector('.Game-Header-Images');
    const gameFooterButtons = document.querySelector('.Game-Footer-Buttons');

    const playerCardTotal = document.querySelector('.User-Card-Total');
    const dealerCardTotal = document.querySelector('.Dealer-Card-Total');

    const hitButton = document.querySelector('.Button-Hit');
    const standButton = document.querySelector('.Button-Stand');

    const gamePopup = document.querySelector('.Game-Body');
    const resultText = document.querySelector('.Result-Text');

    let setUpDeck;
    let dealerHand = [];
    let playerHand = [];
    let showDealersTotal = false;
    let storeImage;

    // Creates a new unshuffled deck
    async function getDeck() {
        const response = await fetch("https://deckofcardsapi.com/api/deck/new/");
        const data = await response.json();
        return data.deck_id;
    }

    // Reshuffling the specified deck
    async function reShuffle(deckId) {
        const response = await fetch(`https://www.deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
        const data = await response.json();
        return data.deck_id;
    }

    // Draws a/multiple random card from the deck
    async function drawCard(deckId, count) {
        const response = await fetch(`https://www.deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`);
        const data = await response.json();
        return data.cards;
    }

    // Gets the back of a card
    async function getBackOfCard() {
        const response = await fetch("https://www.deckofcardsapi.com/static/img/back.png");
        return response.url;
    }

    // Sets a timeout to wait before performing any other actions
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Set up the Game
    async function setUpGame() {
        setUpDeck = await getDeck();
        await reShuffle(setUpDeck);

        dealerHand = await drawCard(setUpDeck, 2);
        playerHand = await drawCard(setUpDeck, 2);

        await displayHand(dealerHand, dealerImages, dealerCardTotal, true, false);
        await displayHand(playerHand, playerImages, playerCardTotal, false);
    }

    // Function to display a hand of cards
    function displayHand(hand, imageElements, cardTotal, isDealer, revealScore = true) {
        addCardToHand(hand, imageElements, cardTotal, isDealer, revealScore);
    }

    // Display the images of the cards that are in each hand
    async function addCardToHand(hand, imageElements, cardTotal, isDealer, revealScore = true) {
        const backOfCardURL = await getBackOfCard();
        hand.forEach((card, index) => {
            if (index < imageElements.length) {
                if (index === 1 && isDealer && !revealScore) {
                    imageElements[index].src = backOfCardURL;
                    storeImage = card.image;
                } else {
                    imageElements[index].src = card.image;
                }
                imageElements[index].alt = card.code;
            }
        });

        const handValue = calculateHandValue(hand);
        addUpdateSpan(cardTotal, handValue, isDealer);
    }

    // Function to calculate the total value of a hand
    function calculateHandValue(hand) {
        let handValue = 0;
        let aceCount = 0;
        hand.forEach(card => {
            if (card.value === "ACE") {
                aceCount++;
                handValue += 11;
            } else if (card.value === "JACK" || card.value === "QUEEN" || card.value === "KING") {
                handValue += 10;
            } else {
                handValue += +card.value;
            }
        });

        // Adjust for aces if total value is greater than 21
        while (handValue > 21 && aceCount > 0) {
            handValue -= 10;
            aceCount--;
        }

        return handValue;
    }

    // Add/Update the span text value to be the sum of the cards values
    function addUpdateSpan(cardTotal, handValue, isDealer) {
        let spanValue = cardTotal.querySelector(".Span-Count");
        if (!spanValue) {
            spanValue = document.createElement("span");
            spanValue.classList.add("Span-Count");
            cardTotal.appendChild(spanValue);
        }
        spanValue.textContent = handValue;

        if (!showDealersTotal && isDealer) {
            spanValue.style.display = "none";
        } else {
            spanValue.style.display = "inline";
        }
    }

    // When player clicks the hit button, add a card if score is under 22
    hitButton.addEventListener("click", () => {
        const playerTotal = calculateHandValue(playerHand);
        if (playerTotal < 22) {
            addCard(gameFooterImagesDiv, playerCardTotal, false);
        } else {
            alert("Your current score is over 21. You must stand.")
        }
    });

    // When the stand button is hit, show the dealers cards/score and perform his moves
    standButton.addEventListener("click", () => {
        gameFooterButtons.style.display = "none";
        showDealersTotal = true;
        revealDealerHandAndScore();
        dealerMoves();
    });

    // Draw a random card and display its image and get its value
    async function addCard(div, total, isDealer = false) {
        const createImage = document.createElement("img");
        createImage.classList.add("Image", "User-Card-Image")
        const addCardHand = await drawCard(setUpDeck, 1);
        div.appendChild(createImage); 
        if (isDealer) {
            dealerHand.push(addCardHand[0]);
            addCardToHand(dealerHand, Array.from(div.children), total, isDealer, showDealersTotal);
        } else {
            playerHand.push(addCardHand[0]);
            addCardToHand(playerHand, Array.from(div.children), total, isDealer);
        }
    }

    // Reveal the dealers second card and display his score
    function revealDealerHandAndScore() {
        dealerImages[1].src = storeImage;
        displayHand(dealerHand, dealerImages, dealerCardTotal, true, true);
    }
    
    /* Perform the moves for the dealer
     * Dealer doesn't draw if hand is at 17 or above, or if player busts
     * Draw a card until the dealer's total reaches 17
     */
    async function dealerMoves() {
        const dealerSpan = dealerCardTotal.querySelector(".Span-Count");
        dealerSpan.style.display = "inline";
        let dealerTotal = calculateHandValue(dealerHand);
        const playerTotal = calculateHandValue(playerHand);

        while (dealerTotal < 17 && playerTotal <= 21) {
            await sleep(1000);
            await addCard(gameHeaderImagesDiv, dealerCardTotal, true);
            dealerTotal = calculateHandValue(dealerHand);
        }

        await sleep(1000);
        determineWinner();
    }

    // Determines who the winner of the game is
    function determineWinner() {
        const playerTotal = calculateHandValue(playerHand);
        const dealerTotal = calculateHandValue(dealerHand);
        let gameResult;

        if (playerTotal > 21) {
            gameResult = `Player busts, Dealer wins with the score ${dealerTotal}!`;
        } else if (dealerTotal > 21) {
            gameResult = `Dealer busts, Player wins with the score ${playerTotal}!`;
        } else if (playerTotal > dealerTotal) {
            gameResult = `Player wins with the score ${playerTotal}!`;
        } else if (playerTotal === dealerTotal) {
            gameResult = "Sorry the house wins on draws.. Better luck next time Loser!!"
        } else {
            gameResult = `Dealer wins with the score ${dealerTotal}!`;
        }

        resultText.textContent = gameResult;
        openPopupWindow(gamePopup);
    }

    // Opens the designated div Window
    function openPopupWindow(div) {
        div.classList.add("Show");
        div.classList.remove("Hide");
        lowerOpacity();
    }

    // Lowers the opacity of everything other than the pop up
    function lowerOpacity() {
        gameChildren.forEach(child => {
            if (!child.classList.contains('Game-Body')) {
                child.style.opacity = 0.5;
            }
        });
        header.style.opacity = 0.5;
    }

    setUpGame();
});