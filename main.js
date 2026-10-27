/**
 * ============================================================================
 * PROYECTO EDUCATIVO: EL CONEJO GUARDIÁN DE LA HUERTA
 * ============================================================================
 * 
 * CONCEPTOS PEDAGÓGICOS IMPLEMENTADOS:
 * 1. GAME LOOP: Ciclo continuo de actualización lógica (Update) y renderizado (Draw)
 *    utilizando requestAnimationFrame sincronizado con la tasa de refresco del monitor
 *    y normalizado con deltaTime para independencia de framerate.
 * 
 * 2. DETECCIÓN DE COLISIONES AABB (Axis-Aligned Bounding Box):
 *    Algoritmo geométrico O(1) para verificar solapamiento entre rectángulos alineados
 *    con los ejes cartesianos sin rotación.
 * 
 * 3. MÁQUINA DE ESTADOS FINITOS (FSM - Finite State Machine):
 *    Patrón de diseño para el comportamiento de agentes autónomos (Insectos),
 *    compuesto por un conjunto finito de estados ('PATRULLAJE', 'ALIMENTACION')
 *    y transiciones gobernadas por eventos de colisión.
 * 
 * 4. SISTEMA DE ESTADO GLOBAL:
 *    Gestión del recurso vital de la huerta (NutrientesDelCultivo: 100 -> 0).
 * ============================================================================
 */

// ============================================================================
// 1. VARIABLES GLOBALES Y SISTEMA DE ESTADO
// ============================================================================

/**
 * Variable global que cuantifica la salud/nutrientes del cultivo (0 a 100).
 * Disminuye progresivamente cuando los insectos se encuentran en estado 'ALIMENTACION'.
 */
let NutrientesDelCultivo = 100.0;

/** Tasa base de absorción de nutrientes por insecto por segundo */
const CONSUMO_NUTRIENTES_POR_SEGUNDO = 4.5;

/** Estado general de la partida */
const GameState = {
  isGameOver: false,
  isVictory: false,
  scoreRepelled: 0,
  debugMode: false,
  spawnTimer: 0,
  spawnInterval: 2.8 // Genera un insecto cada 2.8 segundos
};

// Referencias a elementos del DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nutrientFill = document.getElementById('nutrientFill');
const nutrientText = document.getElementById('nutrientText');
const activePestsElem = document.getElementById('activePests');
const repelledPestsElem = document.getElementById('repelledPests');
const gameOverScreen = document.getElementById('gameOverScreen');
const overlayTitle = document.getElementById('overlayTitle');
const overlayDesc = document.getElementById('overlayDesc');
const restartBtn = document.getElementById('restartBtn');
const debugBoxToggle = document.getElementById('debugBoxToggle');

// Ajuste del plano de tierra (suelo de la huerta)
const GROUND_Y = 390;

// ============================================================================
// 2. SISTEMA DE AUDIO PROCEDURAL (Sintetizador Web Audio API)
// ============================================================================
// Permite generar sonidos ecológicos y de acción sin depender de archivos externos.
const AudioSys = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
  },
  playHop() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  },
  playScare() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  },
  playNibble() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.setValueAtTime(90, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }
};

// ============================================================================
// 3. FÍSICA EDUCATIVA: DETECCIÓN DE COLISIONES AABB
// ============================================================================
/**
 * DETECCIÓN DE COLISIONES AABB (Axis-Aligned Bounding Box)
 * 
 * TEORÍA MATEMÁTICA:
 * Dos rectángulos alineados a los ejes X e Y (sin rotación) colisionan si y solo si
 * se solapan SIMULTÁNEAMENTE en ambos ejes ortogonales (Principio de Separación de Ejes en 1D).
 * 
 * Si existe un espacio o brecha en al menos uno de los dos ejes, es físicamente
 * imposible que exista contacto.
 * 
 * CONDICIONES DE COLISIÓN (Las cuatro deben ser verdaderas):
 * 1. rectA.x < rectB.x + rectB.width   -> El borde izquierdo de A está a la izquierda del borde derecho de B.
 * 2. rectA.x + rectA.width > rectB.x   -> El borde derecho de A está a la derecha del borde izquierdo de B.
 * 3. rectA.y < rectB.y + rectB.height  -> El borde superior de A está arriba del borde inferior de B.
 * 4. rectA.y + rectA.height > rectB.y  -> El borde inferior de A está abajo del borde superior de B.
 * 
 * COMPLEJIDAD COMPUTACIONAL:
 * O(1) tiempo, O(1) espacio. Sólo 4 comparaciones aritméticas directas.
 * 
 * @param {Object} rectA Objeto con propiedades {x, y, width, height}
 * @param {Object} rectB Objeto con propiedades {x, y, width, height}
 * @returns {boolean} True si las cajas se solapan, False en caso contrario.
 */
function checkCollisionAABB(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

// ============================================================================
// 4. CLASE CROP (CULTIVOS DE LA HUERTA)
// ============================================================================
/**
 * Representa los vegetales (ej. Zanahorias) que crecen en la huerta.
 * Son los objetivos nutricionales que los insectos buscan consumir.
 */
class Crop {
  constructor(x, y, name = 'Zanahoria') {
    this.name = name;
    this.width = 46;
    this.height = 54;
    this.x = x;
    this.y = y - this.height;
    this.leavesSway = Math.random() * Math.PI;
  }

  update(dt) {
    this.leavesSway += dt * 3;
  }

  draw(context) {
    const { x, y, width, height } = this;

    // Follaje verde superior (hojas de zanahoria)
    const swayOffset = Math.sin(this.leavesSway) * 3;
    context.fillStyle = '#2f855a';
    context.beginPath();
    context.ellipse(x + width / 2 + swayOffset, y + 6, 16, 8, -0.2, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#38a169';
    context.beginPath();
    context.ellipse(x + width / 2 - swayOffset, y + 2, 14, 9, 0.3, 0, Math.PI * 2);
    context.fill();

    // Cuerpo de la zanahoria (enraizada en la tierra)
    context.fillStyle = '#ed8936';
    context.beginPath();
    context.moveTo(x + 10, y + 16);
    context.lineTo(x + width - 10, y + 16);
    context.lineTo(x + width / 2, y + height);
    context.closePath();
    context.fill();

    // Rayas decorativas de la raíz
    context.strokeStyle = '#c05621';
    context.lineWidth = 1.8;
    context.beginPath();
    context.moveTo(x + 14, y + 26);
    context.lineTo(x + 22, y + 27);
    context.moveTo(x + width - 24, y + 36);
    context.lineTo(x + width - 14, y + 37);
    context.stroke();

    // Dibujo de Caja AABB en Modo Debug
    if (GameState.debugMode) {
      this.drawDebugBox(context);
    }
  }

  drawDebugBox(context) {
    context.strokeStyle = '#48bb78'; // Verde AABB
    context.lineWidth = 2;
    context.strokeRect(this.x, this.y, this.width, this.height);
    context.fillStyle = '#48bb78';
    context.font = '10px monospace';
    context.fillText(`CROP: [${Math.round(this.x)},${Math.round(this.y)}]`, this.x, this.y - 4);
  }
}

// ============================================================================
// 5. CLASE RABBIT (JUGADOR - CONEJO GUARDIÁN)
// ============================================================================
/**
 * Representa al protagonista que defiende la huerta ecológicamente.
 * Se desplaza en 2D sobre la parte inferior del canvas.
 */
class Rabbit {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Dimensiones de la caja de colisión AABB
    this.width = 54;
    this.height = 60;

    // Posición inicial en el suelo
    this.x = canvasWidth / 2 - this.width / 2;
    this.baseY = GROUND_Y - this.height;
    this.y = this.baseY;

    // Físicas y cinemática
    this.speed = 280; // Píxeles por segundo
    this.vx = 0;
    this.vy = 0;
    this.isJumping = false;
    this.jumpForce = -420;
    this.gravity = 1100;

    // Estado visual y animación
    this.facingDirection = 1; // 1 = Derecha, -1 = Izquierda
    this.hopAnimationTimer = 0;
    this.earTwitch = 0;
  }

  /**
   * Procesa la entrada del usuario y actualiza la física del conejo.
   * @param {number} dt DeltaTime en segundos
   * @param {Object} inputState Teclas activas { left, right, jump }
   */
  update(dt, inputState) {
    // 1. Movimiento Horizontal
    this.vx = 0;
    if (inputState.left) {
      this.vx = -this.speed;
      this.facingDirection = -1;
    }
    if (inputState.right) {
      this.vx = this.speed;
      this.facingDirection = 1;
    }

    // Aplicar velocidad horizontal proporcional a deltaTime
    this.x += this.vx * dt;

    // 2. Límites laterales del Canvas (Restricción de Bounding Box)
    if (this.x < 0) {
      this.x = 0;
    } else if (this.x + this.width > this.canvasWidth) {
      this.x = this.canvasWidth - this.width;
    }

    // 3. Salto y Gravedad Vertical
    if (inputState.jump && !this.isJumping) {
      this.vy = this.jumpForce;
      this.isJumping = true;
      AudioSys.playHop();
    }

    if (this.isJumping) {
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;

      // Colisión con el plano del suelo
      if (this.y >= this.baseY) {
        this.y = this.baseY;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    // 4. Temporizador de animación de salto/trote
    if (this.vx !== 0 || this.isJumping) {
      this.hopAnimationTimer += dt * 12;
    } else {
      this.hopAnimationTimer = 0;
    }

    this.earTwitch += dt * 4;
  }

  /**
   * Dibuja al Conejo en el Canvas 2D con detalles visuales procedimentales.
   * @param {CanvasRenderingContext2D} context 
   */
  draw(context) {
    const { x, y, width, height, facingDirection } = this;
    const bounceOffset = Math.sin(this.hopAnimationTimer) * 4;

    context.save();
    context.translate(x + width / 2, y + height / 2 + bounceOffset);
    context.scale(facingDirection, 1);

    // Sombra en el suelo
    context.fillStyle = 'rgba(15, 23, 42, 0.25)';
    context.beginPath();
    context.ellipse(0, height / 2 - bounceOffset + 4, 22, 6, 0, 0, Math.PI * 2);
    context.fill();

    // Cola de pompón blanco
    context.fillStyle = '#edf2f7';
    context.beginPath();
    context.arc(-18, 10, 8, 0, Math.PI * 2);
    context.fill();

    // Cuerpo principal
    context.fillStyle = '#e2e8f0';
    context.beginPath();
    context.ellipse(-2, 8, 18, 16, 0, 0, Math.PI * 2);
    context.fill();

    // Cabeza
    context.fillStyle = '#f7fafc';
    context.beginPath();
    context.ellipse(8, -6, 15, 14, 0, 0, Math.PI * 2);
    context.fill();

    // Orejas largas
    const earWiggle = Math.sin(this.earTwitch) * 2;
    // Oreja trasera
    context.fillStyle = '#e2e8f0';
    context.beginPath();
    context.ellipse(3, -24 + earWiggle, 5, 14, -0.15, 0, Math.PI * 2);
    context.fill();
    // Oreja delantera
    context.fillStyle = '#f7fafc';
    context.beginPath();
    context.ellipse(9, -26, 6, 16, 0.1, 0, Math.PI * 2);
    context.fill();
    // Centro rosado de la oreja
    context.fillStyle = '#fbb6ce';
    context.beginPath();
    context.ellipse(9, -26, 3, 11, 0.1, 0, Math.PI * 2);
    context.fill();

    // Ojo tierno
    context.fillStyle = '#1a202c';
    context.beginPath();
    context.arc(14, -8, 3.5, 0, Math.PI * 2);
    context.fill();
    // Brillo del ojo
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(15, -9, 1.2, 0, Math.PI * 2);
    context.fill();

    // Hocico y nariz
    context.fillStyle = '#f687b3';
    context.beginPath();
    context.arc(20, -4, 2.5, 0, Math.PI * 2);
    context.fill();

    // Pañuelo guardián ecológico (capa verde esmeralda)
    context.fillStyle = '#38a169';
    context.beginPath();
    context.moveTo(2, 0);
    context.lineTo(12, 0);
    context.lineTo(-2, 12);
    context.closePath();
    context.fill();

    // Patitas delanteras y traseras
    context.fillStyle = '#edf2f7';
    context.beginPath();
    context.ellipse(10, 20, 6, 4, 0, 0, Math.PI * 2);
    context.ellipse(-6, 20, 8, 5, 0, 0, Math.PI * 2);
    context.fill();

    context.restore();

    // Dibujo de Caja AABB en Modo Debug
    if (GameState.debugMode) {
      this.drawDebugBox(context);
    }
  }

  drawDebugBox(context) {
    context.strokeStyle = '#4299e1'; // Azul AABB Jugador
    context.lineWidth = 2;
    context.strokeRect(this.x, this.y, this.width, this.height);
    context.fillStyle = '#4299e1';
    context.font = '10px monospace';
    context.fillText(`RABBIT (PLAYER): [${Math.round(this.x)},${Math.round(this.y)}]`, this.x, this.y - 6);
  }
}

// ============================================================================
// 6. CLASE INSECT (MÁQUINA DE ESTADOS FINITOS - FSM)
// ============================================================================
/**
 * CLASE INSECT (Agente Autónomo)
 * 
 * ARQUITECTURA DE LA MÁQUINA DE ESTADOS FINITOS (FSM):
 * 
 *               [Nace en bordes (Izq / Der)]
 *                            │
 *                            ▼
 *                   ┌─────────────────┐
 *                   │   PATRULLAJE    │ ◄─── Se desplaza hacia el cultivo más cercano
 *                   └────────┬────────┘
 *                            │
 *           [Evento: Colisión AABB con Cultivo]
 *                            │
 *                            ▼
 *                   ┌─────────────────┐
 *                   │  ALIMENTACION   │ ◄─── Detiene vx; absorbe NutrientesDelCultivo
 *                   └────────┬────────┘
 *                            │
 *           [Evento: Conejo guardián colisiona AABB]
 *                            │
 *                            ▼
 *                   ┌─────────────────┐
 *                   │     HUYENDO     │ ◄─── Control biológico: el insecto escapa
 *                   └─────────────────┘
 * 
 * POR QUÉ UTILIZAR UNA FSM:
 * 1. Claridad Semántica: Separa el código de movimiento del código de ataque o huida.
 * 2. Mantenibilidad: Agregar un estado nuevo (ej. 'HIBERNANDO', 'VOLANDO') no altera
 *    los estados preexistentes.
 * 3. Prevención de Bugs: Garantiza que el insecto no intente desplazarse mientras come.
 */
class Insect {
  /**
   * @param {string} spawnSide 'LEFT' o 'RIGHT'
   * @param {Array<Crop>} cropsList Referencia a los cultivos para buscar el objetivo
   */
  constructor(spawnSide, cropsList) {
    // Dimensiones de la caja AABB
    this.width = 36;
    this.height = 28;

    // Configuración inicial de posición en bordes laterales
    if (spawnSide === 'LEFT') {
      this.x = -this.width - 10;
      this.direction = 1;
    } else {
      this.x = 800 + 10;
      this.direction = -1;
    }
    this.y = GROUND_Y - this.height - 2;

    // Velocidad de patrullaje
    this.speed = 70 + Math.random() * 45;
    this.vx = this.speed * this.direction;

    // ========================================================================
    // ESTADO INICIAL DE LA MÁQUINA DE ESTADOS FINITOS (FSM)
    // Estados válidos: 'PATRULLAJE', 'ALIMENTACION', 'HUYENDO'
    // ========================================================================
    this.state = 'PATRULLAJE';

    // Referencia al cultivo objetivo
    this.targetCrop = this.findNearestCrop(cropsList);

    // Temporizadores internos y animaciones
    this.munchTimer = 0;
    this.animationTimer = Math.random() * 10;
    this.nibbleSoundThrottle = 0;
    this.isDead = false;
  }

  /**
   * Localiza el cultivo más cercano como objetivo nutricional.
   * @param {Array<Crop>} crops 
   * @returns {Crop|null}
   */
  findNearestCrop(crops) {
    if (!crops || crops.length === 0) return null;
    let closest = crops[0];
    let minDistance = Math.abs((closest.x + closest.width / 2) - this.x);

    for (let i = 1; i < crops.length; i++) {
      const dist = Math.abs((crops[i].x + crops[i].width / 2) - this.x);
      if (dist < minDistance) {
        minDistance = dist;
        closest = crops[i];
      }
    }
    return closest;
  }

  /**
   * CICLO DE ACTUALIZACIÓN DE LA MÁQUINA DE ESTADOS FINITOS
   * @param {number} dt DeltaTime en segundos
   * @param {Array<Crop>} crops Lista de cultivos para evaluar colisión AABB
   */
  update(dt, crops) {
    this.animationTimer += dt * 14;

    // ========================================================================
    // EVALUACIÓN DEL ESTADO ACTUAL (FSM DISPATCHER)
    // ========================================================================
    switch (this.state) {
      
      // ESTADO 1: PATRULLAJE (Desplazamiento hacia el cultivo)
      case 'PATRULLAJE':
        this.updatePatrolState(dt, crops);
        break;

      // ESTADO 2: ALIMENTACION (Consumo del cultivo y reducción de nutrientes globales)
      case 'ALIMENTACION':
        this.updateFeedingState(dt);
        break;

      // ESTADO 3 (Auxiliar didáctico): HUYENDO (Espantado por el conejo sin pesticidas)
      case 'HUYENDO':
        this.updateFleeingState(dt);
        break;
    }
  }

  /**
   * Comportamiento del Estado 'PATRULLAJE':
   * Se desplaza lateralmente hacia el objetivo y evalúa colisión AABB con cultivos.
   */
  updatePatrolState(dt, crops) {
    // Si tiene un cultivo objetivo, orienta su vector velocidad hacia él
    if (this.targetCrop) {
      const targetCenterX = this.targetCrop.x + this.targetCrop.width / 2;
      const currentCenterX = this.x + this.width / 2;
      this.direction = (targetCenterX > currentCenterX) ? 1 : -1;
      this.vx = this.speed * this.direction;
    }

    // Aplicar desplazamiento en el eje X
    this.x += this.vx * dt;

    // DETECCIÓN DE COLISIÓN AABB: Insecto vs Cultivos
    for (const crop of crops) {
      if (checkCollisionAABB(this, crop)) {
        // --------------------------------------------------------------------
        // TRANSICIÓN DE ESTADO FSM: 'PATRULLAJE' -> 'ALIMENTACION'
        // Condición: Se ha producido una intersección geométrica AABB con la planta.
        // --------------------------------------------------------------------
        this.state = 'ALIMENTACION';
        this.vx = 0; // Se detiene físicamente para comer
        this.targetCrop = crop;
        break;
      }
    }
  }

  /**
   * Comportamiento del Estado 'ALIMENTACION':
   * Permanece estático, consume la variable global de nutrientes y reproduce animación.
   */
  updateFeedingState(dt) {
    // La velocidad lateral es 0 (no se mueve)
    this.vx = 0;

    // Reduce la variable global 'NutrientesDelCultivo' en función de deltaTime
    if (NutrientesDelCultivo > 0) {
      NutrientesDelCultivo -= CONSUMO_NUTRIENTES_POR_SEGUNDO * dt;
      if (NutrientesDelCultivo < 0) NutrientesDelCultivo = 0;

      // Efecto sonoro de mordisqueo ecológico atenuado
      this.nibbleSoundThrottle += dt;
      if (this.nibbleSoundThrottle > 0.45) {
        AudioSys.playNibble();
        this.nibbleSoundThrottle = 0;
      }
    }

    this.munchTimer += dt * 8;
  }

  /**
   * Comportamiento del Estado 'HUYENDO':
   * El insecto huye a toda velocidad fuera del canvas tras ser ahuyentado por el conejo.
   */
  updateFleeingState(dt) {
    this.vx = this.speed * 2.2 * this.direction;
    this.x += this.vx * dt;
    this.y -= 40 * dt; // Se eleva o salta al huir

    // Si sale de los bordes del canvas, se marca para eliminación
    if (this.x < -60 || this.x > 860 || this.y < -50) {
      this.isDead = true;
    }
  }

  /**
   * Evento de interacción: El Conejo Guardián espanta al insecto (Control Biológico).
   */
  scareAway(fromDirection) {
    if (this.state !== 'HUYENDO') {
      this.state = 'HUYENDO';
      // Huye en dirección opuesta al conejo
      this.direction = fromDirection >= 0 ? 1 : -1;
      AudioSys.playScare();
      GameState.scoreRepelled++;
    }
  }

  /**
   * Renderizado gráfico del insecto en Canvas 2D según su estado FSM.
   * @param {CanvasRenderingContext2D} context 
   */
  draw(context) {
    const { x, y, width, height, direction, state } = this;
    const munchOffset = (state === 'ALIMENTACION') ? Math.sin(this.munchTimer) * 2 : 0;

    context.save();
    context.translate(x + width / 2, y + height / 2 + munchOffset);
    context.scale(direction, 1);

    // Patitas articuladas
    const legWiggle = Math.sin(this.animationTimer) * 3;
    context.strokeStyle = '#2d3748';
    context.lineWidth = 2;
    // 3 pares de patitas
    for (let i = -8; i <= 8; i += 8) {
      context.beginPath();
      context.moveTo(i, 6);
      context.lineTo(i + (legWiggle * (i > 0 ? 1 : -1)), 13);
      context.stroke();
    }

    // Caparazón / Cuerpo del insecto
    // Cambia sutilmente de tonalidad según su estado FSM
    if (state === 'ALIMENTACION') {
      context.fillStyle = '#e53e3e'; // Rojo: Dañando el cultivo
    } else if (state === 'HUYENDO') {
      context.fillStyle = '#a0aec0'; // Grisáceo: Escapando
    } else {
      context.fillStyle = '#d69e2e'; // Ocre/Ámbar: Patrullando
    }

    // Abdomen segmentado
    context.beginPath();
    context.ellipse(-4, 0, 12, 8, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.stroke();

    // Cabeza
    context.fillStyle = '#744210';
    context.beginPath();
    context.ellipse(10, 0, 6, 6, 0, 0, Math.PI * 2);
    context.fill();

    // Antenas
    context.strokeStyle = '#744210';
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(13, -3);
    context.lineTo(19, -8 + legWiggle);
    context.stroke();

    // Ojo
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(12, -2, 2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#000000';
    context.beginPath();
    context.arc(13, -2, 1, 0, Math.PI * 2);
    context.fill();

    context.restore();

    // Dibujo de Caja AABB e indicador de Estado FSM en Modo Debug
    if (GameState.debugMode) {
      this.drawDebugBox(context);
    }
  }

  drawDebugBox(context) {
    // Color según estado FSM
    let color = '#ecc94b'; // Amarillo para PATRULLAJE
    if (this.state === 'ALIMENTACION') color = '#e53e3e'; // Rojo para ALIMENTACION
    if (this.state === 'HUYENDO') color = '#63b3ed'; // Azul para HUYENDO

    context.strokeStyle = color;
    context.lineWidth = 1.8;
    context.strokeRect(this.x, this.y, this.width, this.height);

    // Etiqueta visual del estado FSM actual
    context.fillStyle = color;
    context.font = 'bold 9px monospace';
    context.fillText(`[FSM: ${this.state}]`, this.x - 4, this.y - 6);
  }
}

// ============================================================================
// 7. ESCENARIO Y ENTORNO AGROECOLÓGICO
// ============================================================================
/**
 * Dibuja un fondo ilustrado rico: cielo con nubes, colinas verdes distantes,
 * valla de madera, y el manto fértil de la huerta orgánica.
 */
function drawScenicBackground(context, width, height) {
  // 1. Cielo con degradado
  const skyGrad = context.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, '#68d391');
  skyGrad.addColorStop(0.35, '#9ae6b4');
  skyGrad.addColorStop(1, '#c6f6d5');
  context.fillStyle = skyGrad;
  context.fillRect(0, 0, width, height);

  // 2. Sol suave matutino
  context.fillStyle = 'rgba(254, 240, 138, 0.8)';
  context.beginPath();
  context.arc(710, 75, 42, 0, Math.PI * 2);
  context.fill();

  // 3. Colinas lejanas
  context.fillStyle = '#48bb78';
  context.beginPath();
  context.ellipse(200, 310, 280, 80, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#38a169';
  context.beginPath();
  context.ellipse(600, 320, 320, 90, 0, 0, Math.PI * 2);
  context.fill();

  // 4. Valla de madera rústica ecológica
  context.fillStyle = '#9c6644';
  // Listones horizontales
  context.fillRect(0, 320, width, 10);
  context.fillRect(0, 345, width, 10);
  // Postes verticales
  for (let px = 30; px < width; px += 85) {
    context.fillRect(px, 305, 14, 60);
    // Punta del poste
    context.beginPath();
    context.moveTo(px, 305);
    context.lineTo(px + 7, 292);
    context.lineTo(px + 14, 305);
    context.fill();
  }

  // 5. Suelo / Tierra fértil (Capa de humus orgánico)
  const soilGrad = context.createLinearGradient(0, GROUND_Y, 0, height);
  soilGrad.addColorStop(0, '#583119');
  soilGrad.addColorStop(0.25, '#402211');
  soilGrad.addColorStop(1, '#27140a');
  context.fillStyle = soilGrad;
  context.fillRect(0, GROUND_Y, width, height - GROUND_Y);

  // Línea de césped superior
  context.fillStyle = '#2f855a';
  context.fillRect(0, GROUND_Y - 4, width, 8);
}

// ============================================================================
// 8. CONTROLADOR DE ENTRADA (TECLADO)
// ============================================================================
const InputHandler = {
  keys: { left: false, right: false, jump: false },

  init() {
    window.addEventListener('keydown', (e) => {
      AudioSys.init(); // Inicializar contexto de audio con la primera interacción

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = true;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.keys.jump = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keys.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keys.right = false;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.keys.jump = false;
      }
    });
  }
};

// ============================================================================
// 9. INSTANCIACIÓN DE ENTIDADES Y PREPARACIÓN DE PARTIDA
// ============================================================================
let rabbit;
let crops = [];
let insects = [];

function setupGameEntities() {
  NutrientesDelCultivo = 100.0;
  GameState.isGameOver = false;
  GameState.isVictory = false;
  GameState.scoreRepelled = 0;
  GameState.spawnTimer = 0;

  // Instanciar jugador
  rabbit = new Rabbit(canvas.width, canvas.height);

  // Instanciar cultivos espaciados homogéneamente en la huerta
  crops = [
    new Crop(130, GROUND_Y, 'Zanahoria 1'),
    new Crop(270, GROUND_Y, 'Zanahoria 2'),
    new Crop(490, GROUND_Y, 'Zanahoria 3'),
    new Crop(630, GROUND_Y, 'Zanahoria 4')
  ];

  // Lista de insectos
  insects = [];

  // Ocultar pantalla de Game Over
  gameOverScreen.classList.remove('active');
  updateHUD();
}

/**
 * Generador automático de plagas desde los bordes del canvas.
 * @param {number} dt DeltaTime
 */
function handleInsectSpawning(dt) {
  GameState.spawnTimer += dt;
  if (GameState.spawnTimer >= GameState.spawnInterval) {
    GameState.spawnTimer = 0;

    // Solo generar si hay menos de 6 plagas activas en pantalla
    const activeFeedingOrPatrol = insects.filter(i => i.state !== 'HUYENDO');
    if (activeFeedingOrPatrol.length < 6) {
      const spawnSide = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
      insects.push(new Insect(spawnSide, crops));
    }
  }
}

// ============================================================================
// 10. EL GAME LOOP FUNCIONAL MEDIANTE requestAnimationFrame
// ============================================================================
/**
 * EL GAME LOOP (Ciclo Principal del Videojuego)
 * 
 * ¿POR QUÉ requestAnimationFrame?
 * 1. Sincronización Vertical (V-Sync): Se ejecuta en el momento óptimo en que el
 *    navegador está listo para pintar en pantalla (normalmente 60Hz o 144Hz).
 * 2. Eficiencia Energética: Pausa la ejecución automáticamente si el usuario
 *    cambia de pestaña, ahorrando batería y CPU.
 * 
 * NORMALIZACIÓN MEDIANTE DELTA TIME (dt):
 * deltaTime representa el tiempo transcurrido en segundos entre el frame anterior
 * y el frame actual:
 *      deltaTime = (timestampActual - timestampPrevio) / 1000
 * Multiplicar velocidades por dt garantiza que la velocidad del juego sea idéntica
 * en computadoras lentas (30fps) o pantallas ultra rápidas (144fps).
 */

let lastTimestamp = 0;

function gameLoop(currentTimestamp) {
  // Cálculo de Delta Time normalizado en segundos
  if (!lastTimestamp) lastTimestamp = currentTimestamp;
  const rawDeltaTime = (currentTimestamp - lastTimestamp) / 1000;
  // Capping preventivo para evitar saltos enormes por pérdida de foco (lag spikes)
  const deltaTime = Math.min(rawDeltaTime, 0.1);
  lastTimestamp = currentTimestamp;

  // 1. Fase Lógica: Actualizar entidades y física
  if (!GameState.isGameOver) {
    update(deltaTime);
  }

  // 2. Fase de Renderizado: Pintar el nuevo estado visual
  render();

  // 3. Solicitar el siguiente ciclo al navegador
  requestAnimationFrame(gameLoop);
}

/**
 * FASE DE ACTUALIZACIÓN LÓGICA (UPDATE)
 * @param {number} dt DeltaTime en segundos
 */
function update(dt) {
  // Actualizar jugador
  rabbit.update(dt, InputHandler.keys);

  // Actualizar cultivos
  for (const crop of crops) {
    crop.update(dt);
  }

  // Generar nuevos insectos por tiempo
  handleInsectSpawning(dt);

  // Actualizar insectos y ejecutar sus FSM
  for (let i = insects.length - 1; i >= 0; i--) {
    const insect = insects[i];
    insect.update(dt, crops);

    // ========================================================================
    // DETECCIÓN DE COLISIÓN AABB: Conejo (Jugador) vs Insecto
    // ========================================================================
    // Si el conejo guardián alcanza al insecto, lo espanta con control biológico
    if (insect.state !== 'HUYENDO' && checkCollisionAABB(rabbit, insect)) {
      const fromDirection = (rabbit.x < insect.x) ? 1 : -1;
      insect.scareAway(fromDirection);
    }

    // Limpiar insectos que salieron de pantalla
    if (insect.isDead) {
      insects.splice(i, 1);
    }
  }

  // Actualizar indicadores del HUD
  updateHUD();

  // Verificar condición de fin de partida (Nutrientes agotados)
  if (NutrientesDelCultivo <= 0 && !GameState.isGameOver) {
    triggerGameOver();
  }
}

/**
 * FASE DE RENDERIZADO VISUAL (RENDER / DRAW)
 */
function render() {
  // Limpiar lienzo
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Fondo ilustrado de la huerta
  drawScenicBackground(ctx, canvas.width, canvas.height);

  // 2. Cultivos
  for (const crop of crops) {
    crop.draw(ctx);
  }

  // 3. Insectos
  for (const insect of insects) {
    insect.draw(ctx);
  }

  // 4. Conejo Guardián
  rabbit.draw(ctx);
}

/**
 * Actualiza la información de la interfaz de usuario (HUD)
 */
function updateHUD() {
  const percentage = Math.max(0, Math.min(100, Math.round(NutrientesDelCultivo)));
  nutrientFill.style.width = `${percentage}%`;
  nutrientText.textContent = `${percentage}%`;

  // Cambiar color de la barra según estado nutricional
  if (percentage > 50) {
    nutrientFill.style.background = 'linear-gradient(90deg, #ecc94b 0%, #48bb78 70%, #38a169 100%)';
  } else if (percentage > 25) {
    nutrientFill.style.background = 'linear-gradient(90deg, #ed8936 0%, #ecc94b 100%)';
  } else {
    nutrientFill.style.background = 'linear-gradient(90deg, #e53e3e 0%, #f56565 100%)';
  }

  const activeCount = insects.filter(i => i.state !== 'HUYENDO').length;
  activePestsElem.textContent = `🐛 ${activeCount}`;
  repelledPestsElem.textContent = `🛡️ ${GameState.scoreRepelled}`;
}

/**
 * Dispara la pantalla de derrota / fin de juego
 */
function triggerGameOver() {
  GameState.isGameOver = true;
  overlayTitle.textContent = '¡Huerta Sin Nutrientes!';
  overlayTitle.className = 'overlay-title loss';
  overlayDesc.textContent = `Los insectos consumieron todos los nutrientes. Lograste ahuyentar a ${GameState.scoreRepelled} plagas mediante control biológico antes del agotamiento del suelo.`;
  gameOverScreen.classList.add('active');
}

// ============================================================================
// 11. INICIALIZACIÓN DE EVENTOS Y ARRANQUE DEL JUEGO
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  InputHandler.init();

  // Escuchar cambio en el visualizador de cajas de colisión AABB y FSM
  if (debugBoxToggle) {
    debugBoxToggle.addEventListener('change', (e) => {
      GameState.debugMode = e.target.checked;
    });
  }

  // Botón de reinicio
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      setupGameEntities();
    });
  }

  // Inicializar entidades y comenzar el ciclo
  setupGameEntities();
  requestAnimationFrame(gameLoop);
});
