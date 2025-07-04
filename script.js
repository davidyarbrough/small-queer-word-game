document.addEventListener('DOMContentLoaded', () => {
    // Game state variables
    let currentRow = 0;
    let currentTile = 0;
    let gameOver = false;
    let targetWord = '';
    const maxRows = 6;
    const wordLength = 5;
    
    // Initialize the game
    init();
    
    function init() {
        // Create the game board
        createGameBoard();
        
        // Pick a random word
        setNewTargetWord();
        
        // Set up event listeners
        setupKeyboardEvents();
        document.getElementById('new-game').addEventListener('click', resetGame);
    }
    
    function setNewTargetWord() {
        // Pick a random word from the word list
        targetWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)].toLowerCase();
        console.log(`Target word: ${targetWord}`); // For debugging
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
        
        // Check if game is over
        if (guess.toLowerCase() === targetWord) {
            setTimeout(() => {
                showMessage("Spectacular!");
                gameOver = true;
                document.getElementById('new-game').classList.remove('hidden');
            }, wordLength * 300 + 100);
        } else if (currentRow === maxRows) {
            setTimeout(() => {
                showMessage(`Game over! The word was ${targetWord.toUpperCase()}`);
                gameOver = true;
                document.getElementById('new-game').classList.remove('hidden');
            }, wordLength * 300 + 100);
        }
    }
    
    function checkGuess(guess) {
        const guessLower = guess.toLowerCase();
        const targetLetters = targetWord.split('');
        
        // First pass: mark correct letters
        for (let i = 0; i < wordLength; i++) {
            setTimeout(() => {
                const tile = document.querySelector(`.game-tile[data-row="${currentRow}"][data-col="${i}"]`);
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
});
