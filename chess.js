// Chess Game Logic
document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const chessboard = document.getElementById("chessboard")
    const playerIndicator = document.getElementById("player-indicator")
    const playerText = document.getElementById("player-text")
    const gameStatus = document.getElementById("game-status")
    const moveHistory = document.getElementById("move-history")
    const resetButton = document.getElementById("reset-button")
    const undoButton = document.getElementById("undo-button")
    const whiteCaptured = document.getElementById("white-captured")
    const blackCaptured = document.getElementById("black-captured")
    const whiteTimerElement = document.getElementById("white-time")
    const blackTimerElement = document.getElementById("black-time")
    const whiteTimerContainer = document.getElementById("white-timer")
    const blackTimerContainer = document.getElementById("black-timer")
    const promotionModal = document.getElementById("promotion-modal")
    const promotionOptions = document.getElementById("promotion-options")
    const settingsButton = document.getElementById("settings-button")
    const settingsModal = document.getElementById("settings-modal")
    const closeSettings = document.getElementById("close-settings")
    const saveSettings = document.getElementById("save-settings")
    const timeControlSelect = document.getElementById("time-control")
    const boardThemeSelect = document.getElementById("board-theme")
    const startTimerButton = document.getElementById("start-timer-button")
  
    // Game State
    let board = []
    let selectedPiece = null
    let possibleMoves = []
    let currentPlayer = "white"
    let gameStatusText = "playing" // playing, check, checkmate, stalemate
    let moves = []
    let capturedPieces = {
      white: [],
      black: [],
    }
    let gameHistory = [] // For undo functionality
    let pendingPromotion = null
    let gameActive = true
  
    // Timer variables
    let timeControl = 10 * 60 // 10 minutes in seconds
    let whiteTime = timeControl
    let blackTime = timeControl
    let timerInterval = null
    let timerActive = false
  
    // Board themes
    const boardThemes = {
      classic: {
        light: "#f0d9b5",
        dark: "#b58863",
      },
      blue: {
        light: "#cad9e3",
        dark: "#5d81a8",
      },
      green: {
        light: "#e8eadb",
        dark: "#769656",
      },
      gray: {
        light: "#e6e6e6",
        dark: "#909090",
      },
    }
  
    // Chess Piece Unicode Characters
    const pieceSymbols = {
      white: {
        pawn: "♙",
        rook: "♖",
        knight: "♘",
        bishop: "♗",
        queen: "♕",
        king: "♔",
      },
      black: {
        pawn: "♟",
        rook: "♜",
        knight: "♞",
        bishop: "♝",
        queen: "♛",
        king: "♚",
      },
    }
  
    // Initialize the board
    function initializeBoard() {
      // Clear the board
      board = []
      chessboard.innerHTML = ""
  
      // Create the initial board state
      board = [
        [
          { type: "rook", color: "black" },
          { type: "knight", color: "black" },
          { type: "bishop", color: "black" },
          { type: "queen", color: "black" },
          { type: "king", color: "black" },
          { type: "bishop", color: "black" },
          { type: "knight", color: "black" },
          { type: "rook", color: "black" },
        ],
        Array(8)
          .fill()
          .map(() => ({ type: "pawn", color: "black" })),
        Array(8).fill(null),
        Array(8).fill(null),
        Array(8).fill(null),
        Array(8).fill(null),
        Array(8)
          .fill()
          .map(() => ({ type: "pawn", color: "white" })),
        [
          { type: "rook", color: "white" },
          { type: "knight", color: "white" },
          { type: "bishop", color: "white" },
          { type: "queen", color: "white" },
          { type: "king", color: "white" },
          { type: "bishop", color: "white" },
          { type: "knight", color: "white" },
          { type: "rook", color: "white" },
        ],
      ]
  
      // Create the squares on the board
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const square = document.createElement("div")
          square.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`
          square.dataset.row = row
          square.dataset.col = col
  
          // Add piece if there is one
          const piece = board[row][col]
          if (piece) {
            const pieceElement = document.createElement("div")
            pieceElement.className = `piece ${piece.color}`
            pieceElement.textContent = pieceSymbols[piece.color][piece.type]
            square.appendChild(pieceElement)
          }
  
          // Add click event
          square.addEventListener("click", () => handleSquareClick(row, col))
  
          chessboard.appendChild(square)
        }
      }
  
      // Save initial board state for undo
      saveGameState()
    }
  
    // Handle square click
    function handleSquareClick(row, col) {
      // If game is not active, do nothing
      if (!gameActive) return
  
      // If there's a pending promotion, do nothing
      if (pendingPromotion) return
  
      // If no piece is selected and the clicked square has a piece of the current player
      if (!selectedPiece && board[row][col] && board[row][col].color === currentPlayer) {
        selectedPiece = { row, col }
        possibleMoves = getPossibleMoves(board, row, col)
        updateBoardUI()
      }
      // If a piece is already selected
      else if (selectedPiece) {
        // Check if the clicked square is a valid move
        const isValidMove = possibleMoves.some((move) => move.row === row && move.col === col)
  
        if (isValidMove) {
          // Save game state before making the move
          saveGameState()
  
          // Make the move
          const fromRow = selectedPiece.row
          const fromCol = selectedPiece.col
          const piece = board[fromRow][fromCol]
  
          // Check for pawn promotion
          if (piece.type === "pawn" && (row === 0 || row === 7)) {
            pendingPromotion = { fromRow, fromCol, toRow: row, toCol: col }
            showPromotionOptions(piece.color)
            return
          }
  
          // Check for capture
          if (board[row][col]) {
            capturedPieces[board[row][col].color].push(board[row][col])
            updateCapturedPieces()
          }
  
          makeMove(fromRow, fromCol, row, col)
  
          // Add move to history
          addMoveToHistory(piece, { row: fromRow, col: fromCol }, { row, col })
  
          // Don't automatically start timer on first move
          // We'll use a separate control for this
  
          // Check for check, checkmate, or stalemate
          checkGameStatus()
  
          // Switch player
          currentPlayer = currentPlayer === "white" ? "black" : "white"
          updateGameInfo()
        }
  
        // Reset selection
        selectedPiece = null
        possibleMoves = []
        updateBoardUI()
      }
    }
  
    // Show promotion options
    function showPromotionOptions(color) {
      promotionOptions.innerHTML = ""
  
      const pieces = ["queen", "rook", "bishop", "knight"]
  
      pieces.forEach((pieceType) => {
        const pieceElement = document.createElement("div")
        pieceElement.className = "promotion-piece"
        pieceElement.textContent = pieceSymbols[color][pieceType]
        pieceElement.addEventListener("click", () => handlePromotion(pieceType))
        promotionOptions.appendChild(pieceElement)
      })
  
      promotionModal.style.display = "flex"
    }
  
    // Handle promotion selection
    function handlePromotion(pieceType) {
      if (!pendingPromotion) return
  
      const { fromRow, fromCol, toRow, toCol } = pendingPromotion
      const piece = board[fromRow][fromCol]
  
      // Check for capture
      if (board[toRow][toCol]) {
        capturedPieces[board[toRow][toCol].color].push(board[toRow][toCol])
        updateCapturedPieces()
      }
  
      // Move the piece
      board[toRow][toCol] = { type: pieceType, color: piece.color, hasMoved: true }
      board[fromRow][fromCol] = null
  
      // Update the UI
      updateBoardDisplay()
  
      // Add move to history
      addMoveToHistory(piece, { row: fromRow, col: fromCol }, { row: toRow, col: toCol }, pieceType)
  
      // Check for check, checkmate, or stalemate
      checkGameStatus()
  
      // Switch player
      currentPlayer = currentPlayer === "white" ? "black" : "white"
      updateGameInfo()
  
      // Hide promotion modal
      promotionModal.style.display = "none"
      pendingPromotion = null
    }
  
    // Update the board UI
    function updateBoardUI() {
      // Remove all selection and possible move classes
      document.querySelectorAll(".square").forEach((square) => {
        square.classList.remove("selected", "possible-move")
      })
  
      // Add selected class to the selected piece
      if (selectedPiece) {
        const selectedSquare = document.querySelector(
          `.square[data-row="${selectedPiece.row}"][data-col="${selectedPiece.col}"]`,
        )
        selectedSquare.classList.add("selected")
  
        // Add possible-move class to all possible moves
        possibleMoves.forEach((move) => {
          const moveSquare = document.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`)
          moveSquare.classList.add("possible-move")
        })
      }
    }
  
    // Update game info UI
    function updateGameInfo() {
      // Update player indicator
      playerIndicator.style.backgroundColor = currentPlayer === "white" ? "white" : "black"
      if (currentPlayer === "white") {
        playerIndicator.style.border = "1px solid #ccc"
      } else {
        playerIndicator.style.border = "none"
      }
  
      playerText.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`
  
      // Update game status
      if (gameStatusText === "check") {
        gameStatus.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`
      } else if (gameStatusText === "checkmate") {
        const winner = currentPlayer === "white" ? "Black" : "White"
        gameStatus.textContent = `Checkmate! ${winner} wins!`
        gameActive = false
        stopTimer()
      } else if (gameStatusText === "stalemate") {
        gameStatus.textContent = "Stalemate! The game is a draw."
        gameActive = false
        stopTimer()
      } else {
        gameStatus.textContent = ""
      }
  
      // Update timer UI
      whiteTimerContainer.classList.toggle("active", currentPlayer === "white")
      blackTimerContainer.classList.toggle("active", currentPlayer === "black")
    }
  
    // Update captured pieces display
    function updateCapturedPieces() {
      whiteCaptured.innerHTML = ""
      blackCaptured.innerHTML = ""
  
      capturedPieces.white.forEach((piece) => {
        const pieceElement = document.createElement("div")
        pieceElement.className = "captured-piece"
        pieceElement.textContent = pieceSymbols.white[piece.type]
        blackCaptured.appendChild(pieceElement)
      })
  
      capturedPieces.black.forEach((piece) => {
        const pieceElement = document.createElement("div")
        pieceElement.className = "captured-piece"
        pieceElement.textContent = pieceSymbols.black[piece.type]
        whiteCaptured.appendChild(pieceElement)
      })
    }
  
    // Add move to history
    function addMoveToHistory(piece, from, to, promotion = null) {
      const moveNumber = Math.floor(moves.length / 2) + 1
      const fromNotation = toChessNotation(from)
      const toNotation = toChessNotation(to)
  
      let moveText = `${moveNumber}. ${piece.type.charAt(0).toUpperCase()} ${fromNotation} → ${toNotation}`
  
      if (promotion) {
        moveText += ` (=${promotion.charAt(0).toUpperCase()})`
      }
  
      moves.push({
        piece: piece.type,
        from,
        to,
        promotion,
      })
  
      // Update UI
      if (moves.length === 1) {
        moveHistory.innerHTML = "" // Clear "No moves yet" text
      }
  
      const moveElement = document.createElement("p")
      moveElement.textContent = moveText
      moveHistory.appendChild(moveElement)
  
      // Scroll to bottom
      moveHistory.scrollTop = moveHistory.scrollHeight
    }
  
    // Convert position to chess notation
    function toChessNotation(position) {
      const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
      const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"] // Reversed because our board has 0,0 at the top left
  
      return `${files[position.col]}${ranks[position.row]}`
    }
  
    // Make a move on the board
    function makeMove(fromRow, fromCol, toRow, toCol) {
      const piece = board[fromRow][fromCol]
  
      // Update the piece's hasMoved property (for castling, etc.)
      if (piece) {
        piece.hasMoved = true
      }
  
      // Move the piece
      board[toRow][toCol] = piece
      board[fromRow][fromCol] = null
  
      // Update the UI
      updateBoardDisplay()
    }
  
    // Update the board display after a move
    function updateBoardDisplay() {
      const squares = document.querySelectorAll(".square")
  
      squares.forEach((square) => {
        const row = Number.parseInt(square.dataset.row)
        const col = Number.parseInt(square.dataset.col)
        const piece = board[row][col]
  
        // Clear the square
        square.innerHTML = ""
  
        // Add piece if there is one
        if (piece) {
          const pieceElement = document.createElement("div")
          pieceElement.className = `piece ${piece.color}`
          pieceElement.textContent = pieceSymbols[piece.color][piece.type]
          square.appendChild(pieceElement)
        }
      })
    }
  
    // Check for check or checkmate
    function checkGameStatus() {
      if (isCheck(board, currentPlayer)) {
        if (isCheckmate(board, currentPlayer)) {
          gameStatusText = "checkmate"
        } else {
          gameStatusText = "check"
        }
      } else if (isStalemate(board, currentPlayer)) {
        gameStatusText = "stalemate"
      } else {
        gameStatusText = "playing"
      }
    }
  
    // Save current game state for undo
    function saveGameState() {
      gameHistory.push({
        board: JSON.parse(JSON.stringify(board)),
        currentPlayer,
        capturedPieces: JSON.parse(JSON.stringify(capturedPieces)),
        moves: [...moves],
        gameStatusText,
      })
    }
  
    // Undo last move
    function undoMove() {
      if (gameHistory.length <= 1) return // Can't undo initial state
  
      // Remove the current state
      gameHistory.pop()
  
      // Get the previous state
      const previousState = gameHistory[gameHistory.length - 1]
  
      // Restore the previous state
      board = JSON.parse(JSON.stringify(previousState.board))
      currentPlayer = previousState.currentPlayer
      capturedPieces = JSON.parse(JSON.stringify(previousState.capturedPieces))
      moves = [...previousState.moves]
      gameStatusText = previousState.gameStatusText
  
      // Update UI
      updateBoardDisplay()
      updateGameInfo()
      updateCapturedPieces()
  
      // Update move history UI
      moveHistory.innerHTML = ""
      if (moves.length === 0) {
        moveHistory.innerHTML = '<p class="no-moves">No moves yet</p>'
      } else {
        moves.forEach((move, index) => {
          const moveNumber = Math.floor(index / 2) + 1
          const fromNotation = toChessNotation(move.from)
          const toNotation = toChessNotation(move.to)
  
          let moveText = `${moveNumber}. ${move.piece.charAt(0).toUpperCase()} ${fromNotation} → ${toNotation}`
  
          if (move.promotion) {
            moveText += ` (=${move.promotion.charAt(0).toUpperCase()})`
          }
  
          const moveElement = document.createElement("p")
          moveElement.textContent = moveText
          moveHistory.appendChild(moveElement)
        })
      }
  
      // Reset game active if it was ended
      gameActive = true
    }
  
    // Timer functions
    function startTimer() {
      timerActive = true
      updateTimerDisplay()
  
      timerInterval = setInterval(() => {
        if (currentPlayer === "white") {
          whiteTime--
        } else {
          blackTime--
        }
  
        updateTimerDisplay()
  
        // Check for time out
        if (whiteTime <= 0 || blackTime <= 0) {
          handleTimeOut()
        }
      }, 1000)
    }
  
    function stopTimer() {
      clearInterval(timerInterval)
      timerActive = false
    }
  
    function updateTimerDisplay() {
      whiteTimerElement.textContent = formatTime(whiteTime)
      blackTimerElement.textContent = formatTime(blackTime)
    }
  
    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
  
    function handleTimeOut() {
      stopTimer()
      gameActive = false
  
      const winner = whiteTime <= 0 ? "Black" : "White"
      gameStatus.textContent = `Time's up! ${winner} wins!`
    }
  
    // Apply board theme
    function applyBoardTheme(themeName) {
      const theme = boardThemes[themeName]
  
      document.querySelectorAll(".square.light").forEach((square) => {
        square.style.backgroundColor = theme.light
      })
  
      document.querySelectorAll(".square.dark").forEach((square) => {
        square.style.backgroundColor = theme.dark
      })
    }
  
    // Reset the game
    function resetGame() {
      selectedPiece = null
      possibleMoves = []
      currentPlayer = "white"
      gameStatusText = "playing"
      moves = []
      capturedPieces = { white: [], black: [] }
      gameHistory = []
      gameActive = true
  
      // Reset timers
      stopTimer()
      whiteTime = timeControl
      blackTime = timeControl
      updateTimerDisplay()
  
      // Reset timer button
      startTimerButton.disabled = false
      startTimerButton.textContent = "Start Timer"
  
      // Reset UI
      moveHistory.innerHTML = '<p class="no-moves">No moves yet</p>'
      whiteCaptured.innerHTML = ""
      blackCaptured.innerHTML = ""
  
      // Initialize the board
      initializeBoard()
      updateGameInfo()
    }
  
    // Event listeners
    resetButton.addEventListener("click", resetGame)
    undoButton.addEventListener("click", undoMove)
    startTimerButton.addEventListener("click", () => {
      if (!timerActive && timeControl > 0) {
        startTimer()
        startTimerButton.disabled = true
        startTimerButton.textContent = "Timer Running"
      }
    })
  
    // Settings modal event listeners
    settingsButton.addEventListener("click", () => {
      settingsModal.style.display = "flex"
    })
  
    closeSettings.addEventListener("click", () => {
      settingsModal.style.display = "none"
    })
  
    saveSettings.addEventListener("click", () => {
      // Get time control value
      const newTimeControl = Number.parseInt(timeControlSelect.value)
      timeControl = newTimeControl * 60
  
      // Reset timers
      whiteTime = timeControl
      blackTime = timeControl
      updateTimerDisplay()
  
      // Apply board theme
      applyBoardTheme(boardThemeSelect.value)
  
      // Close modal
      settingsModal.style.display = "none"
    })
  
    // Initialize the game
    initializeBoard()
    updateGameInfo()
    applyBoardTheme("classic")
  
    // ===== CHESS LOGIC FUNCTIONS =====
  
    // Helper function to check if a position is within the board
    function isValidPosition(row, col) {
      return row >= 0 && row < 8 && col >= 0 && col < 8
    }
  
    // Helper function to check if a position is empty or has an enemy piece
    function canMoveTo(board, row, col, playerColor) {
      if (!isValidPosition(row, col)) return false
  
      const piece = board[row][col]
      return piece === null || piece.color !== playerColor
    }
  
    // Helper function to check if a position has an enemy piece
    function hasEnemyPiece(board, row, col, playerColor) {
      if (!isValidPosition(row, col)) return false
  
      const piece = board[row][col]
      return piece !== null && piece.color !== playerColor
    }
  
    // Get possible moves for a piece
    function getPossibleMoves(board, row, col) {
      const piece = board[row][col]
      if (!piece) return []
  
      // Get all possible moves based on piece type
      const moves = []
  
      switch (piece.type) {
        case "pawn":
          // Pawns move differently based on color
          const direction = piece.color === "white" ? -1 : 1
          const startRow = piece.color === "white" ? 6 : 1
  
          // Move forward one square
          if (isValidPosition(row + direction, col) && board[row + direction][col] === null) {
            moves.push({ row: row + direction, col })
  
            // Move forward two squares from starting position
            if (row === startRow && board[row + 2 * direction][col] === null) {
              moves.push({ row: row + 2 * direction, col })
            }
          }
  
          // Capture diagonally
          if (isValidPosition(row + direction, col - 1) && hasEnemyPiece(board, row + direction, col - 1, piece.color)) {
            moves.push({ row: row + direction, col: col - 1 })
          }
  
          if (isValidPosition(row + direction, col + 1) && hasEnemyPiece(board, row + direction, col + 1, piece.color)) {
            moves.push({ row: row + direction, col: col + 1 })
          }
  
          break
  
        case "rook":
          // Rooks move horizontally and vertically
          const directions = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ] // Up, Down, Left, Right
  
          for (const [dx, dy] of directions) {
            let newRow = row + dx
            let newCol = col + dy
  
            while (isValidPosition(newRow, newCol)) {
              if (board[newRow][newCol] === null) {
                moves.push({ row: newRow, col: newCol })
              } else if (board[newRow][newCol].color !== piece.color) {
                moves.push({ row: newRow, col: newCol })
                break
              } else {
                break
              }
  
              newRow += dx
              newCol += dy
            }
          }
  
          break
  
        case "knight":
          // Knights move in an L-shape
          const knightMoves = [
            [-2, -1],
            [-2, 1],
            [-1, -2],
            [-1, 2],
            [1, -2],
            [1, 2],
            [2, -1],
            [2, 1],
          ]
  
          for (const [dx, dy] of knightMoves) {
            const newRow = row + dx
            const newCol = col + dy
  
            if (canMoveTo(board, newRow, newCol, piece.color)) {
              moves.push({ row: newRow, col: newCol })
            }
          }
  
          break
  
        case "bishop":
          // Bishops move diagonally
          const bishopDirections = [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
          ]
  
          for (const [dx, dy] of bishopDirections) {
            let newRow = row + dx
            let newCol = col + dy
  
            while (isValidPosition(newRow, newCol)) {
              if (board[newRow][newCol] === null) {
                moves.push({ row: newRow, col: newCol })
              } else if (board[newRow][newCol].color !== piece.color) {
                moves.push({ row: newRow, col: newCol })
                break
              } else {
                break
              }
  
              newRow += dx
              newCol += dy
            }
          }
  
          break
  
        case "queen":
          // Queens move like rooks and bishops combined
          const queenDirections = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1], // Rook moves
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1], // Bishop moves
          ]
  
          for (const [dx, dy] of queenDirections) {
            let newRow = row + dx
            let newCol = col + dy
  
            while (isValidPosition(newRow, newCol)) {
              if (board[newRow][newCol] === null) {
                moves.push({ row: newRow, col: newCol })
              } else if (board[newRow][newCol].color !== piece.color) {
                moves.push({ row: newRow, col: newCol })
                break
              } else {
                break
              }
  
              newRow += dx
              newCol += dy
            }
          }
  
          break
  
        case "king":
          // Kings move one square in any direction
          const kingMoves = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1],
          ]
  
          for (const [dx, dy] of kingMoves) {
            const newRow = row + dx
            const newCol = col + dy
  
            if (canMoveTo(board, newRow, newCol, piece.color)) {
              // Check if the move would put the king in check
              const tempBoard = copyBoard(board)
              tempBoard[newRow][newCol] = tempBoard[row][col]
              tempBoard[row][col] = null
  
              if (!isSquareUnderAttack(tempBoard, newRow, newCol, piece.color)) {
                moves.push({ row: newRow, col: newCol })
              }
            }
          }
  
          // Castling
          if (!piece.hasMoved && !isCheck(board, piece.color)) {
            // Kingside castling
            if (
              board[row][7] &&
              board[row][7].type === "rook" &&
              board[row][7].color === piece.color &&
              !board[row][7].hasMoved &&
              !board[row][6] &&
              !board[row][5] &&
              !isSquareUnderAttack(board, row, 5, piece.color) &&
              !isSquareUnderAttack(board, row, 6, piece.color)
            ) {
              moves.push({ row, col: 6 })
            }
  
            // Queenside castling
            if (
              board[row][0] &&
              board[row][0].type === "rook" &&
              board[row][0].color === piece.color &&
              !board[row][0].hasMoved &&
              !board[row][1] &&
              !board[row][2] &&
              !board[row][3] &&
              !isSquareUnderAttack(board, row, 2, piece.color) &&
              !isSquareUnderAttack(board, row, 3, piece.color)
            ) {
              moves.push({ row, col: 2 })
            }
          }
  
          break
      }
  
      // Filter moves that would leave or put the king in check
      const legalMoves = []
      const kingPosition = findKing(board, piece.color)
  
      if (!kingPosition) return moves // Shouldn't happen in a valid game
  
      for (const move of moves) {
        const tempBoard = copyBoard(board)
  
        // Make the move on the tempBoard
        tempBoard[move.row][move.col] = tempBoard[row][col]
        tempBoard[row][col] = null
  
        // If the piece is the king, we need to check if the new position is under attack
        if (piece.type === "king") {
          if (!isSquareUnderAttack(tempBoard, move.row, move.col, piece.color)) {
            legalMoves.push(move)
          }
        } else {
          // For other pieces, check if the king would be in check after this move
          if (!isSquareUnderAttack(tempBoard, kingPosition.row, kingPosition.col, piece.color)) {
            legalMoves.push(move)
          }
        }
      }
  
      return legalMoves
    }
  
    // Check if a square is under attack
    function isSquareUnderAttack(board, row, col, playerColor) {
      const oppositeColor = playerColor === "white" ? "black" : "white"
  
      // Check for attacks from pawns
      const pawnDirection = playerColor === "white" ? 1 : -1
      if (
        isValidPosition(row + pawnDirection, col - 1) &&
        board[row + pawnDirection][col - 1] &&
        board[row + pawnDirection][col - 1].type === "pawn" &&
        board[row + pawnDirection][col - 1].color === oppositeColor
      ) {
        return true
      }
  
      if (
        isValidPosition(row + pawnDirection, col + 1) &&
        board[row + pawnDirection][col + 1] &&
        board[row + pawnDirection][col + 1].type === "pawn" &&
        board[row + pawnDirection][col + 1].color === oppositeColor
      ) {
        return true
      }
  
      // Check for attacks from knights
      const knightMoves = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ]
  
      for (const [dx, dy] of knightMoves) {
        const newRow = row + dx
        const newCol = col + dy
  
        if (
          isValidPosition(newRow, newCol) &&
          board[newRow][newCol] &&
          board[newRow][newCol].type === "knight" &&
          board[newRow][newCol].color === oppositeColor
        ) {
          return true
        }
      }
  
      // Check for attacks from kings
      const kingMoves = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ]
  
      for (const [dx, dy] of kingMoves) {
        const newRow = row + dx
        const newCol = col + dy
  
        if (
          isValidPosition(newRow, newCol) &&
          board[newRow][newCol] &&
          board[newRow][newCol].type === "king" &&
          board[newRow][newCol].color === oppositeColor
        ) {
          return true
        }
      }
  
      // Check for attacks from rooks, bishops, and queens
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1], // Rook/Queen directions
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1], // Bishop/Queen directions
      ]
  
      for (const [dx, dy] of directions) {
        let newRow = row + dx
        let newCol = col + dy
  
        while (isValidPosition(newRow, newCol)) {
          if (board[newRow][newCol]) {
            if (board[newRow][newCol].color === oppositeColor) {
              const pieceType = board[newRow][newCol].type
  
              if (
                pieceType === "queen" ||
                (pieceType === "rook" && (dx === 0 || dy === 0)) ||
                (pieceType === "bishop" && dx !== 0 && dy !== 0)
              ) {
                return true
              }
            }
            break
          }
  
          newRow += dx
          newCol += dy
        }
      }
  
      return false
    }
  
    // Find the king's position
    function findKing(board, color) {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col]
          if (piece && piece.type === "king" && piece.color === color) {
            return { row, col }
          }
        }
      }
      return null
    }
  
    // Check if a player is in check
    function isCheck(board, color) {
      const kingPosition = findKing(board, color)
      if (!kingPosition) return false
  
      return isSquareUnderAttack(board, kingPosition.row, kingPosition.col, color)
    }
  
    // Create a deep copy of the board
    function copyBoard(board) {
      return JSON.parse(JSON.stringify(board))
    }
  
    // Check if a player is in checkmate
    function isCheckmate(board, color) {
      // If not in check, can't be in checkmate
      if (!isCheck(board, color)) return false
  
      // Check if any move can get the player out of check
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col]
          if (piece && piece.color === color) {
            const moves = getPossibleMoves(board, row, col)
  
            for (const move of moves) {
              // Try the move
              const newBoard = copyBoard(board)
  
              // Move the piece on the copied board
              newBoard[move.row][move.col] = newBoard[row][col]
              newBoard[row][col] = null
  
              // If this move gets the player out of check, it's not checkmate
              if (!isCheck(newBoard, color)) {
                return false
              }
            }
          }
        }
      }
  
      // If no move can get the player out of check, it's checkmate
      return true
    }
  
    // Check if a player is in stalemate
    function isStalemate(board, color) {
      // If in check, it's not stalemate
      if (isCheck(board, color)) return false
  
      // Check if the player has any legal moves
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col]
          if (piece && piece.color === color) {
            const moves = getPossibleMoves(board, row, col)
  
            if (moves.length > 0) {
              return false
            }
          }
        }
      }
  
      // If the player has no legal moves and is not in check, it's stalemate
      return true
    }
  })
  