let reader = new FileReader();
let decklist_ids;
let decklist_data;
let outputWrapper = document.getElementById("output-wrapper");
let searchOutput;
let handOutput;
let deckOutput;
let title_deck;
let outputAllMonsterWrapper;
let title_decklist;


// fetch small world effect
fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php?id=89558743")
    .then(response => response.json())
    .then(data => {
        document.getElementById("small-world").innerText = data.data[0].desc
    });

getImage(imageId) {
    return 'https://images.ygoprodeck.com/images/cards_small/' + imageId + '.jpg';
}

// on change event listener of ydk upload
document.getElementById('ydk-upload').addEventListener('change', async function () {

    reader.onload = async () => {

        resetOutputs();

        // filter ydk to only show main deck
        decklist_ids = reader.result.split('\r\n');
        decklist_ids.splice(0, 2);

        decklist_ids.forEach((element, index) => {
            if (element == "#extra") {
                decklist_ids.length = index;
            }
        });

        // remove duplicates
        decklist_ids = [...new Set(decklist_ids)];

        // fetch card data from ygoprodeck api
        decklist_data = await decklist_fetch();

        // reset output div
        if (outputAllMonsterWrapper != null) {
            outputAllMonsterWrapper.remove();
            title_decklist.remove();
        }

        // create div and title for all monsters in deck
        outputAllMonsterWrapper = document.createElement("div");
        document.getElementsByClassName("container")[0].append(outputAllMonsterWrapper);
        title_decklist = document.createElement('h3');
        title_decklist.innerText = "All monsters in deck";
        outputAllMonsterWrapper.append(title_decklist);

        // load card images
        for (let i = 0; i < decklist_data.length; i++) {
            let img = document.createElement('img');
            img.src = getImage(decklist_data[i].id);
            outputAllMonsterWrapper.appendChild(img);
        }

        // add on enter event
        document.getElementById("search-input").addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                search();
            }
        });
    }

    // read ydk on file selection
    reader.readAsText(this.files[0]);
})

// method to fetch card data from ygoprodeck
let decklist_fetch = async () => {

    let data;
    let response;
    let decklist_data_temp = [];

    for (let i = 0; i < decklist_ids.length; i++) {
        response = await fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php?id=" + decklist_ids[i]);
        data = await response.json();
        if (data.data[0].type.includes("Monster")) {
            decklist_data_temp.push(data.data[0]);
        }
    }

    return decklist_data_temp;
}

// method to compare same stats of 2 cards
// returns number of the same stats
let compareStats = (card1, card2) => {
    let sameStatsCount = 0;
    let decklist_data_temp = JSON.parse(JSON.stringify(decklist_data));

    // delete properties
    for (let i = 0; i < decklist_data_temp.length; i++) {

        delete decklist_data_temp[i].archetype
        delete decklist_data_temp[i].card_images
        delete decklist_data_temp[i].card_prices
        delete decklist_data_temp[i].card_sets
        delete decklist_data_temp[i].desc
        delete decklist_data_temp[i].type
        delete decklist_data_temp[i].id
        delete decklist_data_temp[i].name
    }

    // compare all properties left for small world (atk, def, level, attribute, type/race)
    for (let i = 0; i < Object.keys(decklist_data_temp[0]).length; i++) {
        const element = Object.keys(decklist_data_temp[0])[i];

        if (card1[element] == card2[element]) {
            sameStatsCount += 1
        }
    }

    return sameStatsCount;
}

let resetOutputs = () => {
    if (searchOutput != null) {
        searchOutput.remove();
    }

    if (handOutput != null) {
        handOutput.remove();
    }

    if (deckOutput != null) {
        deckOutput.remove();
    }
}

let search = () => {
    let input = document.getElementById("search-input").value.toLowerCase();
    let searchedCard;
    let cardsHand = new Set([]);
    let cardsDeck = new Set([]);

    resetOutputs();

    // search for card
    // break on first found card
    for (let i = 0; i < decklist_data.length; i++) {
        const element = decklist_data[i];

        if (decklist_data[i].name.toLowerCase().includes(input)) {
            searchedCard = element;
            break;
        }
    }

    if (searchedCard) {
        searchOutputDiv();
        handOutputDiv();

        // append img
        let img_search = document.createElement('img');
        img_search.src = getImage(searchedCard.id);
        searchOutput.appendChild(img_search);


        // get connections between cards
        // decklist_data[i] => bridge => card in deck
        for (let i = 0; i < decklist_data.length; i++) {
            const element = decklist_data[i];
            if (compareStats(searchedCard, element) == 1) {
                // decklist_data[j] => cards in hand
                for (let j = 0; j < decklist_data.length; j++) {
                    if (compareStats(element, decklist_data[j]) == 1) {
                        cardsHand.add(decklist_data[j]);
                    }
                }
            }
        }
    }

    cardsHand.forEach(element => {
        let img_hand = document.createElement('img');
        img_hand.src = getImage(element.id);
        img_hand.classList.add("grayscale");
        handOutput.appendChild(img_hand);

        img_hand.onclick = () => {

            img_hand.classList.add("active-img");
            let activeImg = document.getElementsByClassName("active-img");

            // add grayscale for current active imgages
            for (let i = 0; i < activeImg.length; i++) {
                activeImg[i].classList.add("grayscale");
            }

            // remove grayscale of current img
            img_hand.classList.remove("grayscale");

            if (deckOutput != null) {
                deckOutput.remove();
            }

            deckOutputDiv();

            // reset
            cardsDeck = new Set([]);

            decklist_data.forEach(card_in_deck => {
                if (compareStats(card_in_deck, element) == 1 && compareStats(card_in_deck, searchedCard) == 1) {
                    cardsDeck.add(card_in_deck);
                }
            });

            cardsDeck.forEach(element => {
                let img_deck = document.createElement('img');
                img_deck.src = getImage(element.id);
                deckOutput.appendChild(img_deck);
            })
        }


    });
}

let searchOutputDiv = () => {
    searchOutput = document.createElement('div');
    outputWrapper.append(searchOutput);
    searchOutput.classList.add("col-2");

    let title_search = document.createElement('h3');
    title_search.innerText = "Search";
    searchOutput.append(title_search);
}

let handOutputDiv = () => {
    handOutput = document.createElement('div');
    outputWrapper.append(handOutput);
    handOutput.id = "handOutput";
    handOutput.classList.add("col-5");

    let title_hand = document.createElement('h3');
    title_hand.innerText = "Reveal Hand";
    handOutput.append(title_hand);
}

let deckOutputDiv = () => {
    deckOutput = document.createElement('div');
    outputWrapper.append(deckOutput);
    deckOutput.classList.add("col-5");

    title_deck = document.createElement('h3');
    title_deck.innerText = "Reveal Deck";
    deckOutput.append(title_deck);
}
