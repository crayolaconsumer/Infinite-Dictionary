$(document).ready(function() {

    function fetchAndDisplayWord(word) {
        if (!word) return;

        $('#word-container').fadeOut(200);
        $('#error-container').hide();
        $('#loader').fadeIn(200);

        // Fetch definition from the API
        $.ajax({
            url: `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
            method: 'GET',
            success: function(data) {
                displayWordData(data[0]);
            },
            error: function() {
                $('#loader').hide();
                $('#error-message').text(`Sorry, the definition for "${word}" could not be found.`);
                $('#error-container').fadeIn(200);
            }
        });
    }

    function displayWordData(data) {
        const word = data.word;
        const phonetic = data.phonetic || (data.phonetics.find(p => p.text) || {}).text || '';
        
        $('#word-title').text(word);
        $('#word-phonetic').text(phonetic);

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

        const imageUrl = `https://picsum.photos/seed/${word}/800/600`;
        $('#word-image').attr('src', imageUrl).on('load', function() {
            $('#loader').hide();
            $('#word-container').css('display', 'flex').fadeIn(400);
        }).on('error', function() {
            // If image fails to load, still show the content
            $('#loader').hide();
            $('#word-container').css('display', 'flex').fadeIn(400);
        });
    }

    $('#search-button').on('click', function() {
        const searchTerm = $('#search-input').val();
        fetchAndDisplayWord(searchTerm);
    });

    $('#search-input').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            const searchTerm = $(this).val();
            fetchAndDisplayWord(searchTerm);
        }
    });

    $(document).on('click', '.word-link', function(e) {
        e.preventDefault();
        const word = $(this).text().replace(/[^a-zA-Z]/g, '');
        $('#search-input').val(word);
        fetchAndDisplayWord(word);
    });

    // Initial word
    fetchAndDisplayWord("welcome");
});
