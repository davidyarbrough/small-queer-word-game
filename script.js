document.addEventListener('DOMContentLoaded', () => {
    // Game state variables
    let currentRow = 0;
    let currentTile = 0;
    let gameOver = false;
    let targetWord = '';
    let isWordOfTheDay = true; // Track if playing the daily word
    let wotdDate = ''; // Track the current WOTD date
    const maxRows = 6;
    const wordLength = 5;
    
    // LocalStorage keys
    const STORAGE_PREFIX = 'sqwg_'; // Small Queer Word Game prefix
    const STORAGE_WOTD_DATE = `${STORAGE_PREFIX}wotd_date`;
    const STORAGE_WOTD_WORD = `${STORAGE_PREFIX}wotd_word`;
    const STORAGE_WOTD_GUESSES = `${STORAGE_PREFIX}wotd_guesses`;
    const STORAGE_WOTD_CURRENT_ROW = `${STORAGE_PREFIX}wotd_row`;
    const STORAGE_WOTD_GAME_OVER = `${STORAGE_PREFIX}wotd_game_over`;
    
    // Initialize the game
    init();
    
    function init() {
        // Create the game board

        console.log(`BUSTED. Yes, you can cheat by editing the local storage.`); 
        console.log(`If you hack the game and post the results to social, please mention the Trevor Project.`);
        console.log(`If you find a bug, hit me up on Github.`)
        createGameBoard();
        
        // Pick a random word and check for saved progress
        setNewTargetWord();
        
        // Set up event listeners
        setupKeyboardEvents();
        document.getElementById('new-game').addEventListener('click', resetGame);
    }
    
    function setNewTargetWord() {
        if (isWordOfTheDay) {
            // For Word of the Day: use date to select a consistent word
            const today = new Date();
            const zuluDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            wotdDate = zuluDate;
            
            // Generate a hash from the date string
            let hash = 0;
            for (let i = 0; i < zuluDate.length; i++) {
                hash = ((hash << 5) - hash) + zuluDate.charCodeAt(i);
                hash = hash & hash; // Convert to 32bit integer
            }
            
            // Use the absolute value of hash to select a word
            const wordIndex = Math.abs(hash) % WORD_LIST.length;
            targetWord = WORD_LIST[wordIndex].toLowerCase();
            
            // Display Word of the Day mode
            document.getElementById('game-mode').textContent = `WOTD for ${zuluDate}`;
            
            // Check if we have saved progress for today's WOTD
            const savedDate = localStorage.getItem(STORAGE_WOTD_DATE);
            const savedWord = localStorage.getItem(STORAGE_WOTD_WORD);
            
            if (savedDate === zuluDate && savedWord === targetWord) {
                // We have a saved game for today's word, restore it
                restoreSavedGame();
            } else {
                // New day or first time playing, save the initial state
                saveGameState();
            }
        } else {
            // Free Play mode: select a random word
            targetWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)].toLowerCase();
            
            // Display Free Play mode
            document.getElementById('game-mode').textContent = "Free Play";
            
            // Clear any WOTD saved data to prevent confusion
            wotdDate = '';
        }
    }
    
    function createGameBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < maxRows; i++) {
            const row = document.createElement('div');
            row.classList.add('game-row');
            
            for (let j = 0; j < wordLength; j++) {
                const tile = document.createElement('div');
                tile.classList.add('game-tile');
                tile.dataset.row = i;
                tile.dataset.col = j;
                row.appendChild(tile);
            }
            
            gameBoard.appendChild(row);
        }
    }
    
    function setupKeyboardEvents() {
        // Physical keyboard events
        document.addEventListener('keydown', handleKeyPress);
        
        // Virtual keyboard events
        const keys = document.querySelectorAll('#keyboard button');
        keys.forEach(key => {
            key.addEventListener('click', () => {
                const keyValue = key.getAttribute('data-key');
                handleKeyInput(keyValue);
            });
        });
    }
    
    function handleKeyPress(event) {
        const key = event.key.toLowerCase();
        
        if (key === 'enter') {
            handleKeyInput('enter');
        } else if (key === 'backspace') {
            handleKeyInput('backspace');
        } else if (/^[a-z]$/.test(key)) {
            handleKeyInput(key);
        }
    }
    
    function handleKeyInput(key) {
        if (gameOver) return;
        
        if (key === 'enter') {
            submitGuess();
        } else if (key === 'backspace') {
            deleteLetter();
        } else if (/^[a-z]$/.test(key) && currentTile < wordLength) {
            addLetter(key);
        }
    }
    
    function addLetter(letter) {
        if (currentTile < wordLength) {
            const tile = document.querySelector(`.game-tile[data-row="${currentRow}"][data-col="${currentTile}"]`);
            tile.textContent = letter;
            tile.classList.add('filled', 'pop');
            currentTile++;
        }
    }
    
    function deleteLetter() {
        if (currentTile > 0) {
            currentTile--;
            const tile = document.querySelector(`.game-tile[data-row="${currentRow}"][data-col="${currentTile}"]`);
            tile.textContent = '';
            tile.classList.remove('filled');
        }
    }
    
    function submitGuess() {
        if (currentTile !== wordLength) {
            showMessage("Not enough letters");
            shakeRow();
            return;
        }
        
        let guess = '';
        for (let i = 0; i < wordLength; i++) {
            const tile = document.querySelector(`.game-tile[data-row="${currentRow}"][data-col="${i}"]`);
            guess += tile.textContent;
        }
        
        if (!VALID_GUESSES.includes(guess.toLowerCase())) {
            showMessage("Not in word list");
            shakeRow();
            return;
        }
        
        // Check the guess against the target word
        checkGuess(guess);
        
        // Move to the next row
        currentRow++;
        currentTile = 0;
        
        // Save the game state if playing WOTD
        if (isWordOfTheDay) {
            saveGameState();
        }
        
        // Check if game is over
        if (guess.toLowerCase() === targetWord) {
            setTimeout(() => {
                showMessage("Spectacular!");
                gameOver = true;
                document.getElementById('new-game').classList.remove('hidden');
                
                // Save the completed game state if playing WOTD
                if (isWordOfTheDay) {
                    saveGameState();
                }
            }, wordLength * 300 + 100);
        } else if (currentRow === maxRows) {
            setTimeout(() => {
                showMessage(`Game over! The word was ${targetWord.toUpperCase()}`);
                gameOver = true;
                document.getElementById('new-game').classList.remove('hidden');
                
                // Save the completed game state if playing WOTD
                if (isWordOfTheDay) {
                    saveGameState();
                }
            }, wordLength * 300 + 100);
        }
    }
    
    function checkGuess(guess) {
        const guessLower = guess.toLowerCase();
        const targetLetters = targetWord.split('');
        const rowToCheck = currentRow; // Store current row value to prevent timing issues
        
        // First pass: mark correct letters
        for (let i = 0; i < wordLength; i++) {
            setTimeout(() => {
                const tile = document.querySelector(`.game-tile[data-row="${rowToCheck}"][data-col="${i}"]`);
                tile.classList.add('flip');
                
                const keyButton = document.querySelector(`button[data-key="${guessLower[i]}"]`);
                
                if (guessLower[i] === targetWord[i]) {
                    // Correct position
                    setTimeout(() => {
                        tile.classList.add('correct');
                        keyButton.classList.remove('present');
                        keyButton.classList.add('correct');
                    }, 150);
                    targetLetters[i] = null; // Mark as used
                } else if (targetLetters.includes(guessLower[i])) {
                    // Correct letter, wrong position
                    setTimeout(() => {
                        tile.classList.add('present');
                        if (!keyButton.classList.contains('correct')) {
                            keyButton.classList.add('present');
                        }
                    }, 150);
                    targetLetters[targetLetters.indexOf(guessLower[i])] = null; // Mark as used
                } else {
                    // Letter not in word
                    setTimeout(() => {
                        tile.classList.add('absent');
                        if (!keyButton.classList.contains('correct') && !keyButton.classList.contains('present')) {
                            keyButton.classList.add('absent');
                        }
                    }, 150);
                }
            }, i * 300);
        }
    }
    
    function shakeRow() {
        for (let i = 0; i < wordLength; i++) {
            const tile = document.querySelector(`.game-tile[data-row="${currentRow}"][data-col="${i}"]`);
            tile.classList.add('shake');
        }
        
        setTimeout(() => {
            for (let i = 0; i < wordLength; i++) {
                const tile = document.querySelector(`.game-tile[data-row="${currentRow}"][data-col="${i}"]`);
                tile.classList.remove('shake');
            }
        }, 500);
    }
    
    function showMessage(message) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        
        setTimeout(() => {
            messageEl.textContent = '';
        }, 2000);
    }
    
    function resetGame() {
        // Reset game state variables
        currentRow = 0;
        currentTile = 0;
        gameOver = false;
        
        // Switch to Free Play mode for subsequent games
        isWordOfTheDay = false;
        
        // Reset UI
        createGameBoard();
        setNewTargetWord();
        document.getElementById('new-game').classList.add('hidden');
        document.getElementById('message').textContent = '';
        
        // Reset keyboard
        const keys = document.querySelectorAll('#keyboard button');
        keys.forEach(key => {
            key.classList.remove('correct', 'present', 'absent');
        });
    }
    
    // Save current game state to localStorage
    function saveGameState() {
        if (!isWordOfTheDay || !wotdDate) return; // Only save WOTD games
        
        // Get all guesses so far
        const guesses = [];
        for (let row = 0; row < currentRow; row++) {
            let guess = '';
            for (let col = 0; col < wordLength; col++) {
                const tile = document.querySelector(`.game-tile[data-row="${row}"][data-col="${col}"]`);
                guess += tile.textContent;
            }
            guesses.push(guess);
        }
        
        // Save state to localStorage
        localStorage.setItem(STORAGE_WOTD_DATE, wotdDate);
        localStorage.setItem(STORAGE_WOTD_WORD, targetWord);
        localStorage.setItem(STORAGE_WOTD_GUESSES, JSON.stringify(guesses));
        localStorage.setItem(STORAGE_WOTD_CURRENT_ROW, currentRow);
        localStorage.setItem(STORAGE_WOTD_GAME_OVER, gameOver);
    }
    
    // Restore saved game from localStorage
    function restoreSavedGame() {
        if (!isWordOfTheDay) return; // Only restore WOTD games
        
        // Get saved state
        const savedGuesses = JSON.parse(localStorage.getItem(STORAGE_WOTD_GUESSES) || '[]');
        const savedRow = parseInt(localStorage.getItem(STORAGE_WOTD_CURRENT_ROW) || '0');
        const savedGameOver = localStorage.getItem(STORAGE_WOTD_GAME_OVER) === 'true';
        
        // Restore game state
        currentRow = savedRow;
        gameOver = savedGameOver;
        
        // Replay the saved guesses
        savedGuesses.forEach((guess, row) => {
            // Place the letters on the board
            for (let col = 0; col < wordLength; col++) {
                const tile = document.querySelector(`.game-tile[data-row="${row}"][data-col="${col}"]`);
                if (tile) {
                    tile.textContent = guess[col];
                    tile.classList.add('filled');
                }
            }
            
            // Apply the coloring
            checkGuessWithoutAnimation(guess, row);
        });
        
        // Show game over state if needed
        if (gameOver) {
            document.getElementById('new-game').classList.remove('hidden');
            if (savedGuesses.length > 0 && savedGuesses[savedGuesses.length - 1].toLowerCase() === targetWord) {
                showMessage('Spectacular!');
            } else {
                showMessage(`Game over! The word was ${targetWord.toUpperCase()}`);
            }
        }
    }
    
    // Check a guess without animations (for restoring saved games)
    function checkGuessWithoutAnimation(guess, row) {
        const guessLower = guess.toLowerCase();
        const targetLetters = targetWord.split('');
        
        // Process each letter in the guess
        for (let i = 0; i < wordLength; i++) {
            const tile = document.querySelector(`.game-tile[data-row="${row}"][data-col="${i}"]`);
            const keyButton = document.querySelector(`button[data-key="${guessLower[i]}"]`);
            
            if (guessLower[i] === targetWord[i]) {
                // Correct position
                tile.classList.add('correct');
                keyButton.classList.remove('present');
                keyButton.classList.add('correct');
                targetLetters[i] = null; // Mark as used
            } else if (targetLetters.includes(guessLower[i])) {
                // Correct letter, wrong position
                tile.classList.add('present');
                if (!keyButton.classList.contains('correct')) {
                    keyButton.classList.add('present');
                }
                targetLetters[targetLetters.indexOf(guessLower[i])] = null; // Mark as used
            } else {
                // Letter not in word
                tile.classList.add('absent');
                if (!keyButton.classList.contains('correct') && !keyButton.classList.contains('present')) {
                    keyButton.classList.add('absent');
                }
            }
        }
    }
});
