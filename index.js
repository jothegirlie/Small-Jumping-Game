const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const scoreBoard = document.getElementById("scoreBoard");
const message = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function getGround() {
  return canvas.height * 0.8;
}

const sounds = {
  jump: new Audio("sounds/jump.mp3"),
  hit: new Audio("sounds/hit.mp3"),
  score: new Audio("sounds/score.mp3"),
  music: new Audio("sounds/music.mp3")
};

sounds.music.loop = true;
sounds.music.volume = 0.4;

const player = {
  x: 80,
  y: 0,
  size: 40,
  velY: 0,
  jumping: false
};

const GRAVITY = 0.6;
const JUMP_FORCE = -13;


let obstacles = [];
let stars = [];
let score = 0;
let bestScore = 0;
let gameRunning = false;
let gameOver = false;
let frameCount = 0;
let speed = 4;
let spawnInterval = 90;


function createStars() {
  stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.6,
      size: Math.random() * 2
    });
  }
}
createStars();

function drawStars() {
  ctx.fillStyle = "white";
  stars.forEach(s => {
    ctx.fillRect(s.x, s.y, s.size, s.size);
    s.x -= 0.3;
    if (s.x < 0) {
      s.x = canvas.width;
      s.y = Math.random() * canvas.height * 0.6;
    }
  });
}

function drawPlayer() {
  let size = canvas.height * 0.12;
  player.size = size;
  let stretch = player.jumping ? 1.2 : 0.8;
  let squash = player.jumping ? 0.8 : 1.2;

  ctx.fillStyle = "#4CAF50";

  ctx.beginPath();
  ctx.ellipse(
    player.x + size / 2,
    player.y - size / 2,
    (size / 2) * squash,
    (size / 2) * stretch,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();


  ctx.fillStyle = "black";
  ctx.fillRect(player.x + size * 0.3, player.y - size * 0.6, 4, 4);
  ctx.fillRect(player.x + size * 0.6, player.y - size * 0.6, 4, 4);
}

function drawObstacles() {
  obstacles.forEach(obs => {

    if (obs.type === "spike") {
      ctx.fillStyle = "#ccc";

      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y);
      ctx.lineTo(obs.x + obs.width / 2, obs.y - obs.width);
      ctx.lineTo(obs.x + obs.width, obs.y);
      ctx.closePath();
      ctx.fill();
    }

    if (obs.type === "gap") {
      ctx.fillStyle = "#000";
      ctx.fillRect(obs.x, obs.y, obs.width, canvas.height - obs.y);
    }
  });
}

function drawGround() {
  ctx.fillStyle = "#222";
  ctx.fillRect(0, getGround(), canvas.width, canvas.height);
  obstacles.forEach(obs => {
    if (obs.type === "gap") {
      ctx.clearRect(obs.x, getGround(), obs.width, canvas.height);
    }
  });
}


function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "16px Goldman";
  ctx.fillText("Score: " + score, canvas.width - 140, 25);
}


function spawnObstacle() {
  let type = Math.random() < 0.5 ? "spike" : "gap";

  obstacles.push({
    x: canvas.width,
    y: getGround(),
    type: type,
    width: canvas.height * 0.12,
    counted: false
  });
}

function checkCollision(obs) {
  let size = player.size;

 
  if (obs.type === "spike") {
    return (
      player.x < obs.x + obs.width &&
      player.x + size > obs.x &&
      player.y > obs.y - obs.width
    );
  }

  if (obs.type === "gap") {
    if (
      player.x + size > obs.x &&
      player.x < obs.x + obs.width &&
      player.y >= getGround()
    ) {
      return true;
    }
  }

  return false;
}

function jump() {
  if (!player.jumping) {
    player.velY = JUMP_FORCE;
    player.jumping = true;
    sounds.jump.currentTime = 0;
    sounds.jump.play();
  }
}


function update() {
  if (!gameRunning) return;

  frameCount++;

  if (frameCount % spawnInterval === 0) spawnObstacle();

  player.velY += GRAVITY;
  player.y += player.velY;

  if (player.y >= getGround()) {
    player.y = getGround();
    player.velY = 0;
    player.jumping = false;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= speed;

    if (!obstacles[i].counted && obstacles[i].x < player.x) {
      score++;
      obstacles[i].counted = true;
      scoreBoard.textContent = "Score: " + score + " | Highest-Score: " + bestScore;
    }

    if (checkCollision(obstacles[i])) {
      endGame();
    }

    if (obstacles[i].x < -50) obstacles.splice(i, 1);
  }
}


function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawGround();
  drawPlayer();
  drawObstacles();
  drawScore();
}


function gameLoop() {
  if (!gameRunning) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}


function startGame() {
  if (gameRunning || gameOver) return;
  gameRunning = true;
  message.textContent = "";
  sounds.music.play();
  gameLoop();
}

function endGame() {
  gameRunning = false;
  gameOver = true;

  sounds.music.pause();
  sounds.music.currentTime = 0;
  sounds.hit.currentTime = 0;
  sounds.hit.play();

  sounds.hit.onended = () => {
    sounds.score.currentTime = 0;
    sounds.score.play();

    if (score > bestScore) {
      bestScore = score;
    }

    scoreBoard.textContent =
      "Score: " + score + " | Highest-Score: " + bestScore;

    message.textContent = "Game Over!";
    restartBtn.style.display = "inline-block";
  };
}

function restartGame() {
  obstacles = [];
  score = 0;
  frameCount = 0;
  gameOver = false;
  gameRunning = false;

  player.y = getGround();
  player.velY = 0;

  scoreBoard.textContent = "Score: 0 | Highest-Score: " + bestScore;
  message.textContent = "Press SPACE or click to start";
  restartBtn.style.display = "none";

  draw();
}


document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    if (!gameRunning && !gameOver) startGame();
    else if (gameRunning) jump();
  }
});

canvas.addEventListener("click", () => {
  if (!gameRunning && !gameOver) startGame();
  else if (gameRunning) jump();
});


player.y = getGround();
draw();