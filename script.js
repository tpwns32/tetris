const canvas = document.getElementById('tetrisCanvas');
const context = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('startButton');

// 다음 블록 미리보기 캔버스
const nextCanvas = document.getElementById('nextCanvas');
const nextContext = nextCanvas.getContext('2d');

const GRID_SIZE = 20; // 게임판 한 블록의 크기 (px)
const COLS = canvas.width / GRID_SIZE; // 게임판 열 개수 (200px / 20px = 10개)
const ROWS = canvas.height / GRID_SIZE; // 게임판 행 개수 (400px / 20px = 20개)
const NEXT_GRID_SIZE = 20; // 다음 블록 미리보기 칸의 한 블록 크기

let board = []; // 게임판의 상태를 저장하는 2차원 배열
let score = 0; // 현재 점수
let gameOver = false; // 게임 오버 여부
let currentPiece = null; // 현재 움직이는 블록
let nextPiece = null; // 다음으로 나올 블록
let gameInterval; // 블록이 자동으로 떨어지는 타이머
let gameSpeed = 500; // 블록이 떨어지는 속도 (ms, 500ms = 0.5초)

// 테트로미노 모양 정의 (각 블록의 모양과 색상)
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

// 블록이 최종적으로 떨어질 Y 위치를 계산하는 함수 (고스트 피스용)
function getGhostPieceY() {
    if (!currentPiece) {
        return -1;
    }
    let ghostY = currentPiece.y;
    // 현재 블록의 x 위치와 모양으로, 충돌 없이 한 칸 더 아래로 내려갈 수 있는 한 계속 y를 증가시킴
    while (isValidMove(currentPiece.x, ghostY + 1, currentPiece.shape)) {
        ghostY++;
    }
    return ghostY;
}

// 무작위 테트로미노 종류 선택 함수
function getRandomTetrominoType() {
    const types = Object.keys(TETROMINOES);
    return types[Math.floor(Math.random() * types.length)];
}

// 테트로미노 객체 생성 함수
function createPiece(type) {
    const { shape, color } = TETROMINOES[type];
    return {
        shape: shape,
        color: color,
        x: 0, // 이 값은 실제 게임판에 배치될 때 재설정됩니다.
        y: 0
    };
}

// 보드 초기화 함수
function initBoard() {
    // 모든 셀을 0(비어있음)으로 채워서 게임판 초기화
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0; // 점수 초기화
    scoreDisplay.textContent = score; // 화면에 표시되는 점수도 초기화
    gameOver = false; // 게임 오버 상태 해제
    gameSpeed = 500; // 게임 속도 초기화

    // 게임 시작 시, 다음 블록을 하나 먼저 생성하고,
    // 그 다음 블록을 현재 블록으로 가져오면서 새로운 다음 블록을 생성합니다.
    nextPiece = createPiece(getRandomTetrominoType()); // 다음에 나올 블록을 미리 생성
    generateNewPiece(); // 현재 블록 생성 (nextPiece에서 가져오고 새 nextPiece 생성)
}

// 현재 블록 생성 (nextPiece를 currentPiece로 가져오고, 새로운 nextPiece를 만듦)
function generateNewPiece() {
    currentPiece = nextPiece; // '다음 블록'을 '현재 블록'으로 가져옵니다.
    nextPiece = createPiece(getRandomTetrominoType()); // 새로운 '다음 블록'을 생성합니다.

    // 현재 블록의 시작 위치를 게임판 중앙 상단으로 설정
    currentPiece.x = Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2);
    currentPiece.y = 0;

    // 새로 생성된 블록이 이미 다른 블록과 충돌하면 게임 오버 (더 이상 블록이 내려올 수 없는 경우)
    if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        gameOver = true;
        clearInterval(gameInterval); // 게임 타이머 중지
        alert(`게임 오버! 최종 점수: ${score}`); // 게임 오버 메시지
        startButton.textContent = "다시 시작"; // 버튼 텍스트 변경
    }
}

// 특정 위치에 블록 한 조각을 그리는 함수
function drawBlock(x, y, color, ctx = context, size = GRID_SIZE) {
    ctx.fillStyle = color; // 블록 색상 설정
    ctx.fillRect(x * size, y * size, size, size); // 블록 내부 채우기
    ctx.strokeStyle = '#333'; // 블록 테두리 색상 설정
    ctx.strokeRect(x * size, y * size, size, size); // 블록 테두리 그리기
}

// 보드, 현재 블록, 고스트 블록을 화면에 그리는 함수
function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height); // 화면 전체를 지우고 새로 그립니다.

    // 보드에 고정된 블록 그리기
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(col, row, board[row][col]);
            }
        }
    }

    // 현재 움직이는 블록이 있을 때만 고스트 블록과 실제 블록을 그립니다.
    if (currentPiece) {
        const ghostY = getGhostPieceY(); // 고스트 블록의 최종 y 위치를 계산

        // 고스트 블록 그리기: 테두리만 그리거나 투명하게 그립니다.
        // 실제 블록보다 먼저 그려야 실제 블록이 고스트 블록 위에 겹쳐서 자연스럽게 보입니다.
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) { // 블록의 일부인 경우
                    // 고스트 블록은 색을 채우지 않고 테두리만 그려서 실제 블록과 구분합니다.
                    context.strokeStyle = 'rgba(0, 0, 0, 0.3)'; // 투명한 검정색 테두리
                    context.lineWidth = 1; // 테두리 두께
                    context.strokeRect(
                        (currentPiece.x + col) * GRID_SIZE, // x 위치
                        (ghostY + row) * GRID_SIZE,        // 고스트 블록의 최종 y 위치
                        GRID_SIZE,
                        GRID_SIZE
                    );
                }
            }
        }

        // 실제 현재 움직이는 블록 그리기
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) { // 블록의 일부인 경우
                    drawBlock(currentPiece.x + col, currentPiece.y + row, currentPiece.color);
                }
            }
        }
    }
    drawNextPiece(); // 다음 블록 미리보기 그리기 함수 호출
}

// 다음 블록 미리보기 캔버스에 그리는 함수
function drawNextPiece() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height); // 캔버스 지우기

    if (nextPiece) {
        // 미리보기 캔버스 중앙에 블록을 그리기 위한 오프셋 계산
        // 블록의 최대 크기 (4x4)를 기준으로 중앙 정렬 (이해를 돕기 위함, 실제는 블록 크기에 따라 조절)
        const startX = (nextCanvas.width / NEXT_GRID_SIZE - nextPiece.shape[0].length) / 2;
        const startY = (nextCanvas.height / NEXT_GRID_SIZE - nextPiece.shape.length) / 2;

        for (let row = 0; row < nextPiece.shape.length; row++) {
            for (let col = 0; col < nextPiece.shape[row].length; col++) {
                if (nextPiece.shape[row][col]) {
                    // drawBlock 함수를 재활용, context와 size만 nextCanvas용으로 변경
                    drawBlock(startX + col, startY + row, nextPiece.color, nextContext, NEXT_GRID_SIZE);
                }
            }
        }
    }
}

// 특정 위치에 블록을 놓았을 때 유효한 이동인지 (다른 블록과 충돌하거나 경계를 벗어나지 않는지) 확인하는 함수
function isValidMove(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) { // 블록의 일부인 경우
                const newX = x + col;
                const newY = y + row;

                // 보드 경계 확인 (좌우 끝, 바닥)
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false; // 보드 밖으로 벗어남
                }
                // 다른 블록과의 충돌 확인 (newY가 음수이면 아직 보드 밖이니 무시)
                if (newY >= 0 && board[newY][newX]) {
                    return false; // 다른 블록과 충돌함
                }
            }
        }
    }
    return true; // 유효한 이동
}

// 현재 움직이는 블록을 게임판에 고정시키는 함수
function mergePiece() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardX = currentPiece.x + col;
                const boardY = currentPiece.y + row;
                if (boardY >= 0) { // 보드 밖으로 나간 블록은 저장하지 않음 (게임 오버 시 발생 가능)
                    board[boardY][boardX] = currentPiece.color; // 해당 위치에 블록 색상 저장
                }
            }
        }
    }
}

// 가득 찬 줄을 제거하고 점수를 업데이트하는 함수
function clearLines() {
    let linesCleared = 0; // 한 번에 제거된 줄 수
    // 바닥부터 위로 올라가면서 줄 확인
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) { // 해당 줄이 완전히 채워진 경우 (0이 아닌 셀만 존재)
            board.splice(row, 1); // 해당 줄 삭제
            board.unshift(Array(COLS).fill(0)); // 맨 위에 새로운 빈 줄 추가
            linesCleared++; // 제거된 줄 수 증가
            row++; // 줄을 삭제했으므로 현재 줄을 다시 검사해야 함 (새로운 줄이 내려왔으므로)
        }
    }

    if (linesCleared > 0) {
        score += linesCleared * 100; // 줄 수에 따라 점수 추가 (한 줄당 100점)
        scoreDisplay.textContent = score; // 화면 점수 업데이트
        // (선택 사항) 게임 속도 증가 로직은 주석 처리되어 있습니다. 필요하면 주석 해제하세요.
        // gameSpeed = Math.max(50, gameSpeed - linesCleared * 20); // 최소 속도 50ms
        // clearInterval(gameInterval);
        // gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

// 블록을 한 칸 아래로 떨어뜨리는 함수
function dropPiece() {
    if (currentPiece && isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
        currentPiece.y++; // 한 칸 아래로 이동
    } else {
        // 더 이상 내려갈 수 없으면 (바닥 또는 다른 블록에 닿으면)
        if (currentPiece) {
            mergePiece(); // 현재 블록을 게임판에 고정
            clearLines(); // 가득 찬 줄 제거 및 점수 업데이트
            generateNewPiece(); // 새로운 블록 생성
        }
    }
    draw(); // 화면 다시 그리기
}

// 게임의 핵심 루프 (일정 시간마다 블록을 떨어뜨림)
function gameLoop() {
    if (gameOver) return; // 게임 오버 상태면 아무것도 하지 않음
    dropPiece(); // 블록 한 칸 떨어뜨리기
}

// 키보드 입력 처리 함수
document.addEventListener('keydown', e => {
    if (gameOver || !currentPiece) return; // 게임 오버이거나 블록이 없으면 아무것도 하지 않음

    let newX = currentPiece.x;
    let newY = currentPiece.y;
    let newShape = currentPiece.shape;

    if (e.key === 'ArrowLeft') { // 왼쪽 화살표 키
        newX--;
    } else if (e.key === 'ArrowRight') { // 오른쪽 화살표 키
        newX++;
    } else if (e.key === 'ArrowDown') { // 아래 화살표 키 (블록 빠르게 내리기)
        newY++;
    } else if (e.key === 'ArrowUp') { // 위 화살표 키 (블록 회전)
        newShape = rotate(currentPiece.shape);
    } else if (e.key === ' ') { // 스페이스바 (블록 즉시 낙하)
        while (isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
            currentPiece.y++;
            score += 1; // 빠르게 내릴 때 추가 점수 (선택 사항)
        }
        scoreDisplay.textContent = score; // 점수 업데이트
        mergePiece(); // 블록 고정
        clearLines(); // 줄 제거
        generateNewPiece(); // 새 블록 생성
        draw(); // 화면 다시 그리기
        return; // 스페이스바는 즉시 턴을 종료하므로 여기서 함수 종료
    }

    // 새 위치나 모양이 유효하면 적용
    if (isValidMove(newX, newY, newShape)) {
        currentPiece.x = newX;
        currentPiece.y = newY;
        currentPiece.shape = newShape;
    }
    draw(); // 화면 다시 그리기
});

// 블록 회전 로직 함수
function rotate(matrix) {
    const N = matrix.length - 1; // 매트릭스의 최대 인덱스
    const result = matrix.map((row, i) => // 각 행을 순회하며 새로운 행 생성
        row.map((val, j) => matrix[N - j][i]) // 90도 시계방향 회전 공식 적용
    );
    return result;
}

// 게임 시작 버튼 클릭 이벤트 처리
startButton.addEventListener('click', () => {
    if (gameOver || !gameInterval) { // 게임이 끝났거나 아직 시작 전이면
        clearInterval(gameInterval); // 기존 인터벌이 있다면 중지
        initBoard(); // 게임판 초기화
        // generateNewPiece()는 initBoard() 내에서 호출되므로 여기서 호출할 필요 없음
        gameInterval = setInterval(gameLoop, gameSpeed); // 새로운 게임 타이머 시작
        startButton.textContent = "게임 중..."; // 버튼 텍스트 변경
        draw(); // 게임 시작 시 초기 화면과 다음 블록을 한 번 그려줍니다.
    }
});

// 페이지 로드 시 초기화 및 첫 화면 그리기
initBoard();
draw();
