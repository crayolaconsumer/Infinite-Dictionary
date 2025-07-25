$('#js-test-indicator').css('background-color', 'green'); // Test 1: Outside ready

$(document).ready(function() {

    const MAX_HISTORY_ITEMS = 10;
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    let favoriteWords = JSON.parse(localStorage.getItem('favoriteWords')) || [];

    function fetchAndDisplayWord(word) {
        if (!word) return;

        // Add to history
        if (!searchHistory.includes(word)) {
            searchHistory.unshift(word); // Add to the beginning
            if (searchHistory.length > MAX_HISTORY_ITEMS) {
                searchHistory.pop(); // Remove the oldest if over limit
            }
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
            renderSearchHistory();
        }

        $('.skeleton-loader').show();
        $('.actual-content').hide();
        $('#error-container').hide();

        // Fetch definition from the API
        $.ajax({
            url: `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
            method: 'GET',
            success: function(data) {
                displayWordData(data[0]);
                $('.skeleton-loader').hide();
                $('.actual-content').css('display', 'flex').fadeIn(400);
            },
            error: function() {
                $('.skeleton-loader').hide();
                $('#error-message').text(`Sorry, the definition for "${word}" could not be found.`);
                $('#error-container').fadeIn(200);
            }
        });
    }

    function displayWordData(data) {
        const word = data.word;
        const phonetic = data.phonetic || (data.phonetics.find(p => p.text) || {}).text || '';
        const audioUrl = (data.phonetics.find(p => p.audio) || {}).audio || '';

        $('#word-title').text(word);
        $('#word-phonetic').text(phonetic);

        if (audioUrl) {
            const audio = new Audio(audioUrl);
            $('#audio-button').show().off('click').on('click', () => audio.play());
        } else {
            $('#audio-button').hide();
        }

        const definitionContainer = $('#word-definition');
        definitionContainer.empty();

        data.meanings.forEach(meaning => {
            const partOfSpeech = $(`<h3>${meaning.partOfSpeech}</h3>`);
            const definitionsList = $('<ol></ol>');
            
            meaning.definitions.forEach(def => {
                const definitionText = def.definition;
                const definitionHtml = definitionText.split(' ').map(w => {
                    const cleanWord = w.replace(/[^a-zA-Z]/g, '');
                    if (cleanWord.length > 0) {
                        return `<a href="#" class="word-link">${w}</a>`;
                    }
                    return w;
                }).join(' ');

                const example = def.example ? `<em>e.g., "${def.example}"</em>` : '';
                definitionsList.append(`<li>${definitionHtml} ${example}</li>`);
            });
            definitionContainer.append(partOfSpeech).append(definitionsList);
        });

        // Handle Synonyms and Antonyms
        const allSynonyms = new Set();
        const allAntonyms = new Set();
        data.meanings.forEach(meaning => {
            meaning.synonyms.forEach(s => allSynonyms.add(s));
            meaning.antonyms.forEach(a => allAntonyms.add(a));
        });

        updateRelatedWords('#synonyms-container', '#synonyms-list', Array.from(allSynonyms));
        updateRelatedWords('#antonyms-container', '#antonyms-list', Array.from(allAntonyms));

        // Handle Etymology
        const etymologyText = data.origin || ''; // Assuming 'origin' field might exist
        if (etymologyText) {
            $('#etymology-text').text(etymologyText);
            $('#etymology-container').show();
        } else {
            $('#etymology-container').hide();
        }

        // Fetch a new image from Picsum Photos
        const imageUrl = `https://picsum.photos/seed/${word}/800/600`;
        $('#word-image').attr('src', imageUrl).on('load', function() {
            // Image loaded, no need to hide skeleton or show content here, it's already done
        }).on('error', function() {
            // If image fails to load, still show the content (already done)
        });
    }

    $('#favorite-button').on('click', function() {
        const currentWord = $('#word-title').text();
        if (currentWord) {
            if (favoriteWords.includes(currentWord)) {
                favoriteWords = favoriteWords.filter(word => word !== currentWord);
                $(this).removeClass('favorited');
            } else {
                favoriteWords.push(currentWord);
                $(this).addClass('favorited');
            }
            localStorage.setItem('favoriteWords', JSON.stringify(favoriteWords));
            renderFavoriteWords();
        }
    });

    $('#search-button').on('click', function() {
        const searchTerm = $('#search-input').val().trim();
        if (searchTerm) {
            fetchAndDisplayWord(searchTerm);
        }
    });

    $('#search-input').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            const searchTerm = $(this).val().trim();
            if (searchTerm) {
                fetchAndDisplayWord(searchTerm);
            }
        }
    });

    $(document).on('click', '.word-link', function(e) {
        e.preventDefault();
        const word = $(this).text().replace(/[^a-zA-Z]/g, '');
        $('#search-input').val(word);
        fetchAndDisplayWord(word);
    });

    function updateRelatedWords(containerId, listId, words) {
        const container = $(containerId);
        const list = $(listId);
        list.empty();

        if (words.length > 0) {
            words.forEach(word => {
                const link = $(`<a href="#" class="word-link">${word}</a>`);
                list.append(link);
            });
            container.show();
        } else {
            container.hide();
        }
    }

    function renderSearchHistory() {
        const historyContainer = $('#history-container');
        const historyList = $('#history-list');
        historyList.empty();

        if (searchHistory.length > 0) {
            searchHistory.forEach(word => {
                const link = $(`<a href="#" class="word-link">${word}</a>`);
                historyList.append(link);
            });
            historyContainer.show();
        } else {
            historyContainer.hide();
        }
    }

    function renderFavoriteWords() {
        const favoritesList = $('#favorites-list');
        favoritesList.empty();
        if (favoriteWords.length > 0) {
            $('#favorites-container').show();
            favoriteWords.forEach(word => {
                const link = $(`<a href="#" class="word-link">${word}</a>`);
                favoritesList.append(link);
            });
        } else {
            $('#favorites-container').hide();
        }
    }

    function fetchRandomWord() {
        const wordList = [
            "ephemeral", "sonder", "petrichor", "serendipity", "eloquence",
            "nostalgia", "mellifluous", "limerence", "ineffable", "ethereal",
            "aurora", "solitude", "cynosure", "panacea", "epiphany"
        ];
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        fetchAndDisplayWord(randomWord);
        $('#search-input').val(randomWord);
    }

    // Initial render of history and favorites
    renderSearchHistory();
    renderFavoriteWords();

    // Theme toggle
    const themeToggleBtn = $('#theme-toggle');
    const body = $('body');

    themeToggleBtn.on('click', function() {
        if (body.hasClass('dark-theme')) {
            body.removeClass('dark-theme').addClass('light-theme');
            localStorage.setItem('theme', 'light-theme');
        } else {
            body.removeClass('light-theme').addClass('dark-theme');
            localStorage.setItem('theme', 'dark-theme');
        }
    });

    // Initial word
    fetchRandomWord();
});