document.addEventListener("DOMContentLoaded", () => {
    const cardImage = document.querySelector('.Card-Image');

    // Creates a new unshuffled deck
    async function getDeck() {
        const response = await fetch("https://deckofcardsapi.com/api/deck/new/");
        const data = await response.json();
        return data.deck_id;
    }

    // Gets the specified card image and adds it to cardImage
    async function getSpecificCard(cardCode) {
        try {
            const deckId = await getDeck();
            const drawAll = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=52`);
            const drawAllJson = await drawAll.json();
            const findCard = drawAllJson.cards.find(card => card.code === cardCode);
            cardImage.src = findCard.image;
            cardImage.alt = findCard.alt;
        } catch (error) {
            console.error("Error fetching the card:", error);
        }
    }

    // Call the function to display card images
    getSpecificCard("JS");
});