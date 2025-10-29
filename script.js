const canvas = document.getElementById('tetrisCanvas');
const context = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('startButton');

const GRID_SIZE = 20; // 한 블록의 크기 (px)
const COLS = canvas.width / GRID_SIZE; // 열 개수
const ROWS = canvas.height / GRID_SIZE; // 행 개수

let board = [];
let score = 0;
let gameOver = false;
let currentPiece = null;
let gameInterval;
let gameSpeed = 500; // 블록이 떨어지는 속도 (ms)

// 테트로미노 모양 정의 (블록 모양과 색상)
const TETROMINOES = {
    'I': {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: 'cyan'
    },
    'J': {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 'blue'
    },
    'L': {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 'orange'
    },
    'O': {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: 'yellow'
    },
    'S': {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: 'green'
    },
    'T': {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: 'purple'
    },
    'Z': {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: 'red'
    }
};

// 보드 초기화
function initBoard() {
    board = Array.from({
        length: ROWS
    }, () => Array(COLS).fill(0));
    score = 0;
    scoreDisplay.textContent = score;
    gameOver = false;
    gameSpeed = 500;
}

// 새로운 블록 생성
function generateNewPiece() {
    const types = Object.keys(TETROMINOES);
    const type = types[Math.floor(Math.random() * types.length)];
    const {
        shape,
        color
    } = TETROMINOES[type];

    currentPiece = {
        shape: shape,
        color: color,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), // 중앙 정렬
        y: 0
    };

    // 새로 생성된 블록이 이미 다른 블록과 충돌하면 게임 오버
    if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        gameOver = true;
        clearInterval(gameInterval);
        alert(`게임 오버! 최종 점수: ${score}`);
        startButton.textContent = "다시 시작";
    }
}

// 블록 그리기
function drawBlock(x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    context.strokeStyle = '#333';
    context.strokeRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
}

// 보드와 현재 블록 그리기
function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height); // 화면 지우기

    // 보드에 고정된 블록 그리기
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(col, row, board[row][col]);
            }
        }
    }

    // 현재 움직이는 블록 그리기
    if (currentPiece) {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    drawBlock(currentPiece.x + col, currentPiece.y + row, currentPiece.color);
                }
            }
        }
    }
}

// 충돌 감지
function isValidMove(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) { // 블록의 일부인 경우
                const newX = x + col;
                const newY = y + row;

                // 보드 경계 확인
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }
                // 다른 블록과의 충돌 확인 (새로운 y가 음수이면 보드 밖이므로 무시)
                if (newY >= 0 && board[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

// 블록을 보드에 고정
function mergePiece() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardX = currentPiece.x + col;
                const boardY = currentPiece.y + row;
                if (boardY >= 0) { // 보드 밖으로 나간 블록은 저장하지 않음
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }
}

// 가득 찬 줄 제거 및 점수 업데이트
function clearLines() {
    let linesCleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) { // 줄이 완전히 채워진 경우
            board.splice(row, 1); // 해당 줄 삭제
            board.unshift(Array(COLS).fill(0)); // 맨 위에 빈 줄 추가
            linesCleared++;
            row++; // 줄을 삭제했으므로 현재 줄을 다시 검사해야 함
        }
    }

    if (linesCleared > 0) {
        score += linesCleared * 100; // 한 줄당 100점
        scoreDisplay.textContent = score;
        // 게임 속도 증가 (선택 사항)
        // gameSpeed = Math.max(50, gameSpeed - linesCleared * 20); // 최소 속도 50ms
        // clearInterval(gameInterval);
        // gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

// 블록 이동 (아래로)
function dropPiece() {
    if (currentPiece && isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
        currentPiece.y++;
    } else {
        // 더 이상 내려갈 수 없으면 블록 고정
        if (currentPiece) {
            mergePiece();
            clearLines();
            generateNewPiece();
        }
    }
    draw();
}

// 게임 루프
function gameLoop() {
    if (gameOver) return;
    dropPiece();
}

// 키보드 입력 처리
document.addEventListener('keydown', e => {
    if (gameOver || !currentPiece) return;

    let newX = currentPiece.x;
    let newY = currentPiece.y;
    let newShape = currentPiece.shape;

    if (e.key === 'ArrowLeft') {
        newX--;
    } else if (e.key === 'ArrowRight') {
        newX++;
    } else if (e.key === 'ArrowDown') {
        newY++;
    } else if (e.key === 'ArrowUp') { // 회전
        newShape = rotate(currentPiece.shape);
    } else if (e.key === ' ') { // 스페이스바: 즉시 낙하
        while (isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
            currentPiece.y++;
            score += 1; // 빠르게 내릴 때 추가 점수 (선택 사항)
        }
        scoreDisplay.textContent = score;
        mergePiece();
        clearLines();
        generateNewPiece();
        draw();
        return; // 스페이스바는 즉시 턴 종료
    }

    if (isValidMove(newX, newY, newShape)) {
        currentPiece.x = newX;
        currentPiece.y = newY;
        currentPiece.shape = newShape;
    }
    draw();
});

// 블록 회전 로직
function rotate(matrix) {
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
        row.map((val, j) => matrix[N - j][i])
    );
    return result;
}

// 게임 시작 버튼
startButton.addEventListener('click', () => {
    if (gameOver || !gameInterval) { // 게임이 끝났거나 아직 시작 전이면
        clearInterval(gameInterval); // 기존 인터벌 정리
        initBoard();
        generateNewPiece();
        gameInterval = setInterval(gameLoop, gameSpeed);
        startButton.textContent = "게임 중...";
    }
});

// 초기화
initBoard();
draw();
