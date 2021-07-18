let reader = new FileReader();

let decklist_ids;

let decklist_data;
let smallworld_data;

fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php?id=89558743")
    .then(response => response.json())
    .then(data => {
        document.getElementById("small-world").innerText = data.data[0].desc
    });

document.getElementById('ydk-upload').addEventListener('change', async function () {

    reader.onload = async () => {

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
        if (document.getElementById("output") != null)
            document.getElementById("output").remove();

        // create output div
        let output = document.createElement('div');
        let outputWrapper = document.getElementById("output-wrapper");
        outputWrapper.parentNode.insertBefore(output, outputWrapper.nextSibling);
        output.id = "output";

        // create title for all monsters in deck
        let title_decklist = document.createElement('h3');
        title_decklist.innerText = "All monsters in deck";
        outputWrapper.parentNode.insertBefore(title_decklist, outputWrapper.nextSibling);

        // load card images
        for (let i = 0; i < decklist_data.length; i++) {
            let img = document.createElement('img');
            img.src = 'https://storage.googleapis.com/ygoprodeck.com/pics_small/' + decklist_data[i].id + '.jpg';
            document.getElementById('output').appendChild(img);
            //img.classList.add("img-fluid");
        }

        // add on enter
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

    for (let i = 0; i < Object.keys(decklist_data_temp[0]).length; i++) {
        const element = Object.keys(decklist_data_temp[0])[i];

        if (card1[element] == card2[element]) {
            sameStatsCount += 1
        }
    }

    return sameStatsCount;
}

let search = () => {
    let input = document.getElementById("search-input").value.toLowerCase();
    let searchedCard;
    let cardsHand = new Set([]);
    let cardsDeck = new Set([]);

    if (document.getElementById("searchOutput") != null) {
        document.getElementById("searchOutput").remove();
        //document.getElementById("title_search").remove();
    }

    for (let i = 0; i < decklist_data.length; i++) {
        const element = decklist_data[i];

        if (decklist_data[i].name.toLowerCase().includes(input)) {
            console.log(element);
            searchedCard = element;
            break;
        }
    }

    // create output div
    let searchOutput = document.createElement('div');
    let outputWrapper = document.getElementById("output-wrapper");
    outputWrapper.append(searchOutput);
    searchOutput.id = "searchOutput";
    searchOutput.classList.add("col-3");


    // create title for all monsters in deck
    let title_search = document.createElement('h3');
    title_search.innerText = "Search";
    title_search.id = "title_search";
    searchOutput.append(title_search);


    let img_search = document.createElement('img');
    img_search.src = 'https://storage.googleapis.com/ygoprodeck.com/pics_small/' + searchedCard.id + '.jpg';
    document.getElementById('searchOutput').appendChild(img_search);

    //--------------------------------------------------------------

    let handOutput = document.createElement('div');
    //img_search.parentNode.insertBefore(handOutput, img_search.nextSibling);
    outputWrapper.append(handOutput);
    handOutput.id = "handOutput";
    handOutput.classList.add("col-4");


    // create title for all monsters in deck
    let title_hand = document.createElement('h3');
    title_hand.innerText = "Reveal Hand";
    title_hand.id = "title_hand"
    handOutput.append(title_hand);


    //--------------------------------------------------------------

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

    cardsHand.forEach(element => {
        let img_hand = document.createElement('img');
        img_hand.src = 'https://storage.googleapis.com/ygoprodeck.com/pics_small/' + element.id + '.jpg';

        img_hand.onclick = () => {

            if (document.getElementById("deckOutput") != null) {
                document.getElementById("deckOutput").remove();
                //document.getElementById("title_deck").remove();
            }

            let deckOutput = document.createElement('div');
            outputWrapper.append(deckOutput);
            deckOutput.id = "deckOutput";
            deckOutput.classList.add("col-4");


            let title_deck = document.createElement('h3');
            title_deck.innerText = "Reveal Deck";
            title_deck.id = "title_deck"
            deckOutput.append(title_deck);


            cardsDeck = new Set([]);
            decklist_data.forEach(card_in_deck => {
                if (compareStats(card_in_deck, element) == 1) {
                    cardsDeck.add(card_in_deck);
                }
            });

            cardsDeck.forEach(element => {
                let img_deck = document.createElement('img');
                img_deck.src = 'https://storage.googleapis.com/ygoprodeck.com/pics_small/' + element.id + '.jpg';
                document.getElementById('deckOutput').appendChild(img_deck);
            })
        }
        document.getElementById('handOutput').appendChild(img_hand);
    });
}