const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

document.addEventListener('DOMContentLoaded', () => {
  const startScreen = document.getElementById('start-screen');
  const startButton = document.getElementById('start-button');
  const helpButton = document.getElementById('help-button');
  const helpScreen = document.getElementById('help-screen');
  const backButton = document.getElementById('back-button');
  const canvas = document.querySelector('canvas');

  // Quan es fa clic a "Jugar", es fa desaparèixer la pantalla inicial i es mostra el canvas
  startButton.addEventListener('click', () => {
    startScreen.style.display = 'none'; // Amaguem la pantalla d'inici
    canvas.style.display = 'block'; // Mostrem el canvas del joc
    startGame(); // Iniciem el joc
  });

   // Mostrar la pantalla de juego al hacer clic en "Jugar"
   startButton.addEventListener('click', () => {
    startScreen.style.display = 'none'; // Ocultar la pantalla de inicio
    canvas.style.display = 'block'; // Mostrar el canvas
    startGame(); // Iniciar el juego
  });

  // Mostrar la pantalla de ayuda al hacer clic en "Ayuda"
  helpButton.addEventListener('click', () => {
    startScreen.style.display = 'none'; // Ocultar la pantalla de inicio
    helpScreen.style.display = 'flex'; // Mostrar la pantalla de ayuda
  });

  // Volver al menú principal desde la pantalla de ayuda
  backButton.addEventListener('click', () => {
    helpScreen.style.display = 'none'; // Ocultar la pantalla de ayuda
    startScreen.style.display = 'flex'; // Mostrar la pantalla de inicio
  });
});


/* ----------------------------- Variables del juego ----------------------------- */

//Imagenes y sprites del juego
const $sprite = document.querySelector('#sprite');
const $bricks = document.querySelector('#bricks');
const $heart = document.querySelector('#heart'); // Seleccionamos la imagen del corazón
const $paddleLarge = document.querySelector('#paddleLarge'); // Seleccionamos la imagen de la pala grande
const $fastBall = document.querySelector('#fastBall');  // Imagen de la bola rápida
const $slowBall = document.querySelector('#slowBall');  // Imagen de la bola lenta

// Definimos el tamaño del canvas
canvas.width = 448;
canvas.height = 400;

/* VARIABLES DE LA PELOTA */
const ballRadius = 3;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 3;
let dy = -3;
let initialSpeed = 3; // Velocidad inicial por nivel
const speedIncrement = 3;  // Incremento de velocidad para los power-ups

/* VARIABLES DE LA PALETA */
const PADDLE_SENSITIVITY = 8;
let paddleHeight = 10;
let paddleWidth = 31;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleY = canvas.height - paddleHeight - 10;

let rightPressed = false;
let leftPressed = false;

/* VARIABLES DE LOS LADRILLOS */
const brickWidth = 32;
const brickHeight = 16;
const brickPadding = 0;
const brickOffsetTop = 80; // Espacio superior de los ladrillos
const bricks = [];

const BRICK_STATUS = {
  ACTIVE: 1,
  DESTROYED: 0
};

/* VARIABLES DE VIDAS */
let lives = 3; // Comenzamos con 3 vidas

/* VARIABLE NOTIFICACIONES POWER UP*/
let notificationText = ''; // Texto que se mostrará
let notificationTimer = null; // Temporizador para controlar cuánto tiempo se muestra el texto

// Variables para velocidad ajustada
let speedAdjusted = false;
let currentSpeedAdjustment = 0; // Para rastrear el ajuste total de la velocidad
let paddleTimer = null;  // Temporitzador per al power-up de la paleta gran
let fastBallTimer = null; // Temporitzador per a la bola ràpida
let slowBallTimer = null; // Temporitzador per a la bola lenta

const MIN_SPEED = 1; // Velocitat mínima perquè no s'aturi la bola
const MAX_SPEED = 12; // Velocitat màxima

/* ----------------------------- Variables de Niveles ----------------------------- */

// Definimos los niveles del juego
const levels = [
    { rows: 3, cols: 5, speed: 3 }, // Nivel 1
    { rows: 4, cols: 7, speed: 3 }, // Nivel 2
    { rows: 6, cols: 9, speed: 3 }, // Nivel 3
  ];
  
  let currentLevel = 0; // Nivel actual
  let levelStartTime; // Tiempo en que se inicia el nivel
  
  // Función para cargar un nivel específico
  function loadLevel(levelIndex) {
    const level = levels[levelIndex];
  
    // Reseteamos posiciones y velocidad de la pelota
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = initialSpeed;
    dy = -initialSpeed;
    initialSpeed = level.speed; // Velocidad inicial del nivel
  
    // Guardamos el tiempo de inicio del nivel para aumentar la velocidad por tiempo
    levelStartTime = Date.now();
  
    // Centramos los ladrillos calculando el espacio total ocupado
    const totalBrickWidth = level.cols * (brickWidth + brickPadding);
    const brickOffsetLeft = (canvas.width - totalBrickWidth) / 2;
  
    // Reseteamos los ladrillos
    bricks.length = 0;
    for (let c = 0; c < level.cols; c++) {
      bricks[c] = [];
      for (let r = 0; r < level.rows; r++) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        const random = Math.floor(Math.random() * 8);
        bricks[c][r] = {
          x: brickX,
          y: brickY,
          status: BRICK_STATUS.ACTIVE,
          color: random
        };
      }
    }
  }

  /* ----------------------------- Variables de Power-Ups ----------------------------- */
  const powerUps = [];
  const POWER_UP_TYPES = {
    BIG_PADDLE: 'BIG_PADDLE',
    FAST_BALL: 'FAST_BALL',
    SLOW_BALL: 'SLOW_BALL',
    EXTRA_LIFE: 'EXTRA_LIFE'
  };
  
  const powerUpEffects = {
    [POWER_UP_TYPES.BIG_PADDLE]: () => {
      paddleWidth = 47;  // Aumentar el ancho de la paleta
      paddleHeight = 9;  // Ajustar el alto de la paleta
      showNotification("Pala més gran"); // Mostrar notificación
  
      if (paddleTimer) {
        clearTimeout(paddleTimer);
      }
  
      paddleTimer = setTimeout(() => {
        paddleWidth = 31;  // Tornem a la mida original després de 15 segons
        paddleHeight = 10;
        paddleTimer = null; // Reiniciem el temporitzador
      }, 15000);
    },
  
    [POWER_UP_TYPES.FAST_BALL]: () => {
      // Incrementamos la velocidad, pero respetamos el límite de velocidad máxima
      dx = (dx > 0 ? 1 : -1) * Math.min(Math.abs(dx) + speedIncrement, MAX_SPEED);
      dy = (dy > 0 ? 1 : -1) * Math.min(Math.abs(dy) + speedIncrement, MAX_SPEED);
      showNotification("Pelota rápida");
  
      // Después de 10 segundos, volveremos a la velocidad inicial
      if (fastBallTimer) clearTimeout(fastBallTimer);
      fastBallTimer = setTimeout(() => {
        dx = (dx > 0 ? 1 : -1) * initialSpeed;
        dy = (dy > 0 ? 1 : -1) * initialSpeed;
      }, 10000); // Duración del power-up 10 segundos
    },
  
    [POWER_UP_TYPES.SLOW_BALL]: () => {
      // Reducimos la velocidad, pero respetamos el límite de velocidad mínima
      dx = (dx > 0 ? 1 : -1) * Math.max(Math.abs(dx) - speedIncrement, MIN_SPEED);
      dy = (dy > 0 ? 1 : -1) * Math.max(Math.abs(dy) - speedIncrement, MIN_SPEED);
      showNotification("Pelota lenta");
  
      // Después de 10 segundos, volveremos a la velocidad inicial
      if (slowBallTimer) clearTimeout(slowBallTimer);
      slowBallTimer = setTimeout(() => {
        dx = (dx > 0 ? 1 : -1) * initialSpeed;
        dy = (dy > 0 ? 1 : -1) * initialSpeed;
      }, 10000); // Duración del power-up 10 segundos
    },
  
    [POWER_UP_TYPES.EXTRA_LIFE]: () => {
      lives++;  // Afegim una vida extra
      showNotification("+1 Vida"); // Mostrem la notificació
    }
  };
  
/* ----------------------------- MOVIMIENTO DE LA  PELOTA --------------------------------*/

  // Función para controlar el movimiento de la pelota
function ballMovement() {
  checkWallCollisions();
  checkPaddleCollision();
  updateBallPosition();
}

// Comprobar colisiones con las paredes
function checkWallCollisions() {
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }

  if (y + dy < ballRadius) {
    dy = -dy;
  }
}



// Comprobar colisiones con la paleta
function checkPaddleCollision() {
  const isBallSameXAsPaddle = x > paddleX && x < paddleX + paddleWidth;
  const isBallTouchingPaddle = y + dy >= paddleY && y + dy <= paddleY + paddleHeight;

  if (isBallSameXAsPaddle && isBallTouchingPaddle) {
    // Calcular el punto de impacto de la pelota en la paleta
    const relativeImpact = (x - paddleX) / paddleWidth; // Proporción de la posición de la pelota en la paleta (entre 0 y 1)
    
    // Ajustar el ángulo del rebote basándonos en el punto de impacto
    const maxBounceAngle = Math.PI / 3; // Ángulo máximo de rebote (60 grados)
    const bounceAngle = (relativeImpact - 0.5) * 2 * maxBounceAngle; // Calcular el ángulo de rebote

    // Establecer las nuevas velocidades de la pelota según el ángulo de rebote
    const speed = Math.sqrt(dx * dx + dy * dy); // Mantener la velocidad constante
    dx = speed * Math.sin(bounceAngle); // Ajustar la velocidad horizontal
    dy = -speed * Math.cos(bounceAngle); // Ajustar la velocidad vertical (invertida para el rebote hacia arriba)

    // Aseguramos que la pelota no atraviese la paleta moviéndola justo encima
    y = paddleY - ballRadius;
  }
}



  
  


// Funció per generar power-ups amb probabilitat aleatòria
function generatePowerUp(ladrilloX, ladrilloY) {
  const chance = Math.random();

  if (chance < 0.25) { // 25% de probabilitat per la vida extra
    const heartWidth = 20;
    const heartHeight = 20;

    const powerUpX = ladrilloX + (brickWidth / 2) - (heartWidth / 2);
    const powerUpY = ladrilloY;

    powerUps.push({
      type: POWER_UP_TYPES.EXTRA_LIFE,
      x: powerUpX,
      y: powerUpY,
      width: heartWidth,
      height: heartHeight,
      dy: 2 // Moviment cap avall
    });
  } else if (chance < 0.5) { // 25% de probabilitat per la paleta gran
    const paddleLargeWidth = 47;
    const paddleLargeHeight = 9;

    const powerUpX = ladrilloX + (brickWidth / 2) - (paddleLargeWidth / 2);
    const powerUpY = ladrilloY;

    powerUps.push({
      type: POWER_UP_TYPES.BIG_PADDLE,
      x: powerUpX,
      y: powerUpY,
      width: paddleLargeWidth,
      height: paddleLargeHeight,
      dy: 2 // Moviment cap avall
    });
  } else if (chance < 0.75) { // 25% de probabilitat per la bola ràpida
    const fastBallWidth = 30;
    const fastBallHeight = 40;

    const powerUpX = ladrilloX + (brickWidth / 2) - (fastBallWidth / 2);
    const powerUpY = ladrilloY;

    powerUps.push({
      type: POWER_UP_TYPES.FAST_BALL,
      x: powerUpX,
      y: powerUpY,
      width: fastBallWidth,
      height: fastBallHeight,
      dy: 2 // Moviment cap avall
    });
  } else { // 25% de probabilitat per la bola lenta
    const slowBallWidth = 35;
    const slowBallHeight = 25;

    const powerUpX = ladrilloX + (brickWidth / 2) - (slowBallWidth / 2);
    const powerUpY = ladrilloY;

    powerUps.push({
      type: POWER_UP_TYPES.SLOW_BALL,
      x: powerUpX,
      y: powerUpY,
      width: slowBallWidth,
      height: slowBallHeight,
      dy: 2 // Moviment cap avall
    });
  }
}


/* ----------------------------- Funciones de dibujo ----------------------------- */

// Función para dibujar la pelota
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
  }
  
// Función para dibujar la paleta
function drawPaddle() {
  if (paddleWidth === 47) {
    ctx.drawImage($sprite, 30, 175, 47, 9, paddleX, paddleY, paddleWidth, paddleHeight);
  } else {
    ctx.drawImage($sprite, 30, 109, 31, 10, paddleX, paddleY, paddleWidth, paddleHeight);
  }
}

  
  // Función para dibujar los ladrillos
  function drawBricks() {
    for (let c = 0; c < bricks.length; c++) {
      for (let r = 0; r < bricks[c].length; r++) {
        const currentBrick = bricks[c][r];
        if (currentBrick.status === BRICK_STATUS.DESTROYED) continue;
  
        const clipX = currentBrick.color * 32;
        ctx.drawImage(
          $bricks,
          clipX,
          0,
          brickWidth,
          brickHeight,
          currentBrick.x,
          currentBrick.y,
          brickWidth,
          brickHeight
        );
      }
    }
  }

// Función para mostrar el tiempo transcurrido, el nivel actual y las vidas restantes
function drawLevelTimeLives() {
  ctx.font = '16px Arial'; // Aseguramos un tamaño y fuente consistentes
  ctx.fillStyle = '#fff'; // Color blanco para el texto

  // Mostrar el nivel actual en la esquina superior izquierda
  ctx.textAlign = 'left'; // Alineamos a la izquierda
  ctx.fillText(`Nivel: ${currentLevel + 1}`, 10, 20); // Posición fija

  // Mostrar el tiempo transcurrido en la esquina superior derecha
  const currentTime = Date.now();
  const timeInSeconds = Math.floor((currentTime - levelStartTime) / 1000); // Tiempo en segundos
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  ctx.textAlign = 'right'; // Alineamos a la derecha
  ctx.fillText(`Tiempo: ${formattedTime}`, canvas.width - 10, 20); // Esquina superior derecha

  // Mostrar las vidas restantes centradas
  ctx.textAlign = 'center'; // Alineamos centrado
  ctx.fillText(`Vidas: ${lives}`, canvas.width / 2, 20); // Centrado en la parte superior
}

  
// Función para dibujar los power-ups en el canvas
function drawPowerUps() {
  powerUps.forEach((powerUp) => {
    if (powerUp.type === POWER_UP_TYPES.EXTRA_LIFE) {
      ctx.drawImage($heart, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    } else if (powerUp.type === POWER_UP_TYPES.BIG_PADDLE) {
      ctx.drawImage($paddleLarge, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    } else if (powerUp.type === POWER_UP_TYPES.FAST_BALL) {
      ctx.drawImage($fastBall, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    } else if (powerUp.type === POWER_UP_TYPES.SLOW_BALL) {
      ctx.drawImage($slowBall, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    }
  });
}


// Funció per moure els power-ups cap avall
function movePowerUps() {
  powerUps.forEach((powerUp, index) => {
    // Movem cada power-up cap avall segons la velocitat dy
    powerUp.y += powerUp.dy; // Aplicar moviment cap avall
    if (powerUp.y > canvas.height) {
      powerUps.splice(index, 1); // Eliminar power-up si surt de la pantalla
    }
  });
}

/* ----------------------------- Lógica del juego ----------------------------- */

// Función para detectar colisiones entre la pelota y los ladrillos
function collisionDetection() {
  bricks.forEach((column) => {
    column.forEach((brick) => {
      if (brick.status === BRICK_STATUS.ACTIVE) {
        checkBrickCollision(brick);
      }
    });
  });
}

// Comprobar colisión con un ladrillo
function checkBrickCollision(brick) {
  // Verificamos si la pelota está dentro de los límites del ladrillo
  if (x + ballRadius > brick.x && x - ballRadius < brick.x + brickWidth &&
      y + ballRadius > brick.y && y - ballRadius < brick.y + brickHeight) {
    
    // Determinamos la posición relativa de la pelota al ladrillo
    const fromLeft = x + ballRadius - brick.x;  // Distancia desde el borde izquierdo
    const fromRight = brick.x + brickWidth - (x - ballRadius); // Distancia desde el borde derecho
    const fromTop = y + ballRadius - brick.y;   // Distancia desde la parte superior
    const fromBottom = brick.y + brickHeight - (y - ballRadius); // Distancia desde la parte inferior

    // Determinamos si la colisión es más horizontal o vertical
    const minDistance = Math.min(fromLeft, fromRight, fromTop, fromBottom);

    if (minDistance === fromLeft || minDistance === fromRight) {
      // Colisión desde los lados del ladrillo, invertimos dx
      dx = -dx;
    } else if (minDistance === fromTop || minDistance === fromBottom) {
      // Colisión desde arriba o abajo, invertimos dy
      dy = -dy;
    }

    // Cambiamos el estado del ladrillo a destruido
    brick.status = BRICK_STATUS.DESTROYED;

    // Generamos un power-up al destruir el ladrillo
    generatePowerUp(brick.x, brick.y);
  }
}



// Función para controlar el movimiento de la pelota
function ballMovement() {
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }

  if (y + dy < ballRadius) {
    dy = -dy;
  }

  const isBallSameXAsPaddle = x > paddleX && x < paddleX + paddleWidth;
  const isBallTouchingPaddle = y + dy > paddleY;

  if (isBallSameXAsPaddle && isBallTouchingPaddle) {
    dy = -dy;
  } else if (y + dy > canvas.height - ballRadius || y + dy > paddleY + paddleHeight) {
    loseLife(); // Llamamos a la función que maneja la pérdida de vidas
  }

  // Actualizamos la posición de la pelota
  x += dx;
  y += dy;

}

// Resetea la pelota y la velocidad al perder una vida
function loseLife() {
  lives--; // Restamos una vida
  if (lives > 0) {
    // Reiniciamos la pelota y la paleta si todavía hay vidas
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = initialSpeed; // Velocidad inicial
    dy = -initialSpeed; // También reseteamos la dirección
    paddleX = (canvas.width - paddleWidth) / 2;
  } else {
    // Si no quedan vidas, mostrar pantalla de Game Over
    gameOver = true;
    showGameOverScreen();
  }
}

// Función para controlar el movimiento de la paleta según las teclas presionadas
function paddleMovement() {
  if (rightPressed && paddleX < canvas.width - paddleWidth - 4) {
    paddleX += PADDLE_SENSITIVITY;
  } else if (leftPressed && paddleX > 4) {
    paddleX -= PADDLE_SENSITIVITY;
  }
}

// Función para detectar colisión de power-ups con la paleta
function detectPowerUpCollision() {
  powerUps.forEach((powerUp, index) => {
    const isPowerUpOnPaddleX = powerUp.x + powerUp.width > paddleX && powerUp.x < paddleX + paddleWidth;
    const isPowerUpOnPaddleY = powerUp.y + powerUp.height >= paddleY && powerUp.y <= paddleY + paddleHeight;

    if (isPowerUpOnPaddleX && isPowerUpOnPaddleY) {
      powerUpEffects[powerUp.type](); // Aplicar el efecto correspondiente
      powerUps.splice(index, 1); // Eliminar el power-up recogido
    }
  });
}

// Función para mostrar la notificación en el centro de la pantalla
function showNotification(text) {
  notificationText = text; // Establecemos el texto de la notificación

  // Limpiamos el temporizador anterior si existe
  if (notificationTimer) {
    clearTimeout(notificationTimer);
  }

  // Configuramos un temporizador para borrar el texto después de 1 segundo
  notificationTimer = setTimeout(() => {
    notificationText = ''; // Limpiamos el texto después de 1 segundo
  }, 1000); // El texto desaparecerá después de 1 segundo
}




// Función para dibujar la notificación en el centro de la pantalla
function drawNotification() {
  if (notificationText) {
    ctx.font = '16px Arial'; // Tamaño más pequeño del texto
    ctx.fillStyle = '#fff'; // Color blanco para el texto
    ctx.textAlign = 'center'; // Alineación centrada del texto
    ctx.fillText(notificationText, canvas.width / 2, canvas.height / 2); // Dibujamos en el centro del canvas
  }
}




// Función para resetear las variables del juego
function resetGame() {
  lives = 3;
  currentLevel = 0;
  gameOver = false;
  loadLevel(currentLevel);
  x = canvas.width / 2; // Posicionamos la pelota de nuevo
  y = canvas.height - 30;
  dx = initialSpeed; // Restauramos la velocidad inicial de la pelota
  dy = -initialSpeed;
  paddleX = (canvas.width - paddleWidth) / 2; // Restauramos la posición de la paleta
}

// Función para mostrar la pantalla de fin del juego
function showGameOverScreen() {
  const gameoverScreen = document.getElementById('gameover-screen');
  gameoverScreen.style.display = 'flex'; // Mostrar pantalla de Game Over

  const restartButton = document.getElementById('restart-button');
  restartButton.addEventListener('click', () => {
    gameoverScreen.style.display = 'none'; // Ocultar la pantalla de Game Over
    resetGame(); // Reiniciamos el juego
    startGame(); // Volvemos a empezar el juego
  });
}


// Función para limpiar el canvas antes de volver a dibujar cada cuadro
function cleanCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Función para inicializar los eventos del teclado (para mover la paleta)
function initEvents() {
  document.addEventListener('keydown', keyDownHandler);
  document.addEventListener('keyup', keyUpHandler);

  function keyDownHandler(event) {
    const { key } = event;
    if (key === 'Right' || key === 'ArrowRight' || key.toLowerCase() === 'd') {
      rightPressed = true;
    } else if (key === 'Left' || key === 'ArrowLeft' || key.toLowerCase() === 'a') {
      leftPressed = true;
    }
  }

  function keyUpHandler(event) {
    const { key } = event;
    if (key === 'Right' || key === 'ArrowRight' || key.toLowerCase() === 'd') {
      rightPressed = false;
    } else if (key === 'Left' || key === 'ArrowLeft' || key.toLowerCase() === 'a') {
      leftPressed = false;
    }
  }
}

/* ----------------------------- Función para comprobar si el nivel está completo ----------------------------- */

// Función que verifica si todos los ladrillos han sido destruidos
function checkLevelComplete() {
  for (let c = 0; c < bricks.length; c++) {
    for (let r = 0; r < bricks[c].length; r++) {
      if (bricks[c][r].status === BRICK_STATUS.ACTIVE) {
        return false;
      }
    }
  }
  return true;
}

/* ----------------------------- Renderización del juego ----------------------------- */

const fps = 60;
let msPrev = window.performance.now();
let msFPSPrev = window.performance.now() + 1000;
const msPerFrame = 1000 / fps;
let frames = 0;
let framesPerSec = fps;
let gameOver = false;

// Función para dibujar todos los elementos en el canvas
function drawElements() {
  drawBall();
  drawPaddle();
  drawBricks();
  drawPowerUps();
  drawLevelTimeLives();
  drawNotification();
}

// Función para actualizar el estado del juego (parte de `updateGameState`)
function updateGameState() {
  collisionDetection(); // Detectar colisiones con ladrillos
  ballMovement(); // Mover la pelota
  paddleMovement(); // Mover la paleta
  movePowerUps(); // Mover los power-ups hacia abajo
  detectPowerUpCollision(); // Detectar colisión con power-ups

  // Verificar si se completó el nivel
  if (checkLevelComplete()) {
    currentLevel++;
    if (currentLevel >= levels.length) {
      console.log("¡Juego completado!");
      gameOver = true;
      showGameOverScreen(); // Mostrar la pantalla de Game Over
      return;
    }
    loadLevel(currentLevel); // Cargar el siguiente nivel
  }
}

// Función principal de renderización del juego
function draw() {
  if (gameOver) return; // Si el juego terminó, no dibujamos más

  window.requestAnimationFrame(draw);

  const msNow = window.performance.now();
  const msPassed = msNow - msPrev;

  if (msPassed < msPerFrame) return;

  const excessTime = msPassed % msPerFrame;
  msPrev = msNow - excessTime;

  frames++;

  if (msFPSPrev < msNow) {
    msFPSPrev = window.performance.now() + 1000;
    framesPerSec = frames;
    frames = 0;
  }

  // Separación de la lógica de dibujo en funciones más pequeñas
  cleanCanvas();
  drawElements(); // Dibuja todos los elementos del juego
  updateGameState(); // Actualiza el estado del juego
}



//Funcion que inicializa el juego
function startGame() {
  // Aquí inicialitzem el joc 
  loadLevel(currentLevel);  // Començar amb el primer nivell
  draw();  // Començar a dibuixar el joc
  initEvents();  // Inicialitzar els esdeveniments de teclat
}
