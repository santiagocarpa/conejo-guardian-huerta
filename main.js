/**
 * ============================================================================
 * EL CONEJO GUARDIÁN DE LA HUERTA - EDICIÓN HD
 * ============================================================================
 * Características:
 * - Resolución HD nativa con soporte para 1270x720 (Horizontal) y 720x1270 (Vertical)
 * - Botón de Pantalla Completa con escalado HD
 * - Sistema de Cooldown de ataque en plagas con barra visual y anticipación
 * - Enemigos Voladores (Cuervos/Aves de huerta con vuelo, picada y huida)
 * - Sistema de Oleadas progresivas con dificultad incremental
 * - Sistema Roguelite de 3 opciones de habilidades/atributos al terminar cada ronda
 * - Proyectiles de zanahoria, dash, escudos de cultivo y aliados biológicos
 * ============================================================================
 */

// ============================================================================
// 1. SISTEMA DE AUDIO PROCEDURAL (Web Audio API)
// ============================================================================
const AudioSys = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  playHop() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(460, this.ctx.currentTime + 0.11);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.11);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.11);
  },
  playScare() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(950, this.ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  },
  playNibble() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.setValueAtTime(90, this.ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  },
  playThrow() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  },
  playHit() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  },
  playBirdChirp() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
    osc.frequency.setValueAtTime(1100, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.14);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  },
  playUpgrade() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554, 659, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.15, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.22);
    });
  },
  playWaveStart() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [330, 440, 554];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.14, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.35);
    });
  },
  playShieldBlock() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  },
  playDash() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  },
  playWeatherChange() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
};

// ============================================================================
// 2. CONFIGURACIÓN Y ESTADO GLOBAL DEL JUEGO
// ============================================================================
let NutrientesDelCultivo = 100.0;
let GROUND_Y = 590;

const GameState = {
  isGameOver: false,
  isPausedForUpgrade: false,
  scoreRepelled: 0,
  debugMode: false,
  orientation: 'landscape', // 'landscape' (1270x720) o 'portrait' (720x1270)
  passiveRegenRate: 0, // Nutrientes recuperados pasivamente por segundo
  enemyCooldownMult: 1.0, // Multiplicador de cooldown de ataque en enemigos
  enemySpeedMult: 1.0 // Multiplicador de velocidad de movimiento en enemigos
};

// Referencias DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameWrapper = document.getElementById('gameWrapper');
const canvasContainer = document.getElementById('canvasContainer');
const nutrientFill = document.getElementById('nutrientFill');
const nutrientText = document.getElementById('nutrientText');
const weatherText = document.getElementById('weatherText');
const waveText = document.getElementById('waveText');
const remainingPestsElem = document.getElementById('remainingPests');
const repelledPestsElem = document.getElementById('repelledPests');
const gameOverScreen = document.getElementById('gameOverScreen');
const overlayTitle = document.getElementById('overlayTitle');
const overlayDesc = document.getElementById('overlayDesc');
const restartBtn = document.getElementById('restartBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const resolutionToggleBtn = document.getElementById('resolutionToggleBtn');
const debugBoxToggle = document.getElementById('debugBoxToggle');
const upgradeScreen = document.getElementById('upgradeScreen');
const upgradeCardsGrid = document.getElementById('upgradeCardsGrid');

// ============================================================================
// 3. FÍSICA: DETECCIÓN DE COLISIONES AABB
// ============================================================================
function checkCollisionAABB(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

// ============================================================================
// 4. SISTEMA DE PARTÍCULAS Y TEXTO FLOTANTE
// ============================================================================
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
  }

  addText(text, x, y, color = '#68d391', fontSize = 16) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      fontSize,
      vy: -45,
      alpha: 1.0,
      life: 1.1
    });
  }

  addShockwave(x, y, maxRadius = 70, color = '#48bb78') {
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius,
      color,
      alpha: 0.9,
      speed: 180
    });
  }

  addCrumbs(x, y, color = '#ed8936', count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 25,
        color,
        size: 3 + Math.random() * 3,
        alpha: 1.0,
        life: 0.6 + Math.random() * 0.4
      });
    }
  }

  update(dt) {
    // Textos flotantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * dt;
      t.life -= dt;
      t.alpha = Math.max(0, t.life / 1.1);
      if (t.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Ondas de choque
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += s.speed * dt;
      s.alpha = Math.max(0, 1 - (s.radius / s.maxRadius));
      if (s.radius >= s.maxRadius) this.shockwaves.splice(i, 1);
    }

    // Partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt; // Gravedad suave
      p.life -= dt;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(context) {
    // Ondas de choque
    context.save();
    for (const s of this.shockwaves) {
      context.beginPath();
      context.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      context.strokeStyle = s.color;
      context.globalAlpha = s.alpha;
      context.lineWidth = 3;
      context.stroke();
    }
    context.restore();

    // Partículas
    context.save();
    for (const p of this.particles) {
      context.globalAlpha = p.alpha;
      context.fillStyle = p.color;
      context.beginPath();
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();

    // Textos flotantes
    context.save();
    context.textAlign = 'center';
    context.font = 'bold 16px "Segoe UI", sans-serif';
    for (const t of this.floatingTexts) {
      context.globalAlpha = t.alpha;
      context.fillStyle = '#000000';
      context.fillText(t.text, t.x + 1, t.y + 1);
      context.fillStyle = t.color;
      context.fillText(t.text, t.x, t.y);
    }
    context.restore();
  }
}

const particles = new ParticleSystem();

// ============================================================================
// 5. CLASE CROP (CULTIVOS DE LA HUERTA)
// ============================================================================
class Crop {
  constructor(x, y, name = 'Zanahoria') {
    this.name = name;
    this.width = 50;
    this.height = 60;
    this.x = x - this.width / 2;
    this.y = y - this.height;
    this.leavesSway = Math.random() * Math.PI;
    this.shieldPoints = 0; // Escudos otorgados por la mejora Malla Anti-Plagas
  }

  update(dt) {
    this.leavesSway += dt * 3;
  }

  draw(context) {
    const { x, y, width, height, shieldPoints } = this;
    const swayOffset = Math.sin(this.leavesSway) * 3;

    // Escudo Protector si está activo
    if (shieldPoints > 0) {
      context.save();
      context.strokeStyle = '#4299e1';
      context.lineWidth = 2.5;
      context.fillStyle = 'rgba(66, 153, 225, 0.15)';
      context.beginPath();
      context.arc(x + width / 2, y + height / 2, 38, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      // Indicador de cargas de escudo
      context.fillStyle = '#90cdf4';
      context.font = 'bold 11px monospace';
      context.textAlign = 'center';
      context.fillText(`🛡️ x${shieldPoints}`, x + width / 2, y - 10);
      context.restore();
    }

    // Hojas de zanahoria
    context.fillStyle = '#2f855a';
    context.beginPath();
    context.ellipse(x + width / 2 + swayOffset, y + 6, 18, 9, -0.2, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#38a169';
    context.beginPath();
    context.ellipse(x + width / 2 - swayOffset, y + 2, 16, 10, 0.3, 0, Math.PI * 2);
    context.fill();

    // Cuerpo de la zanahoria en tierra
    context.fillStyle = '#ed8936';
    context.beginPath();
    context.moveTo(x + 10, y + 18);
    context.lineTo(x + width - 10, y + 18);
    context.lineTo(x + width / 2, y + height);
    context.closePath();
    context.fill();

    // Textura de la raíz
    context.strokeStyle = '#c05621';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x + 14, y + 28);
    context.lineTo(x + 24, y + 29);
    context.moveTo(x + width - 26, y + 40);
    context.lineTo(x + width - 14, y + 41);
    context.stroke();

    if (GameState.debugMode) {
      context.strokeStyle = '#48bb78';
      context.lineWidth = 1.5;
      context.strokeRect(this.x, this.y, this.width, this.height);
      context.fillStyle = '#48bb78';
      context.font = '10px monospace';
      context.fillText(`CROP: [${Math.round(this.x)},${Math.round(this.y)}]`, this.x, this.y - 4);
    }
  }
}

// ============================================================================
// 6. PROYECTILES DE ZANAHORIA (HABILIDAD DESBLOQUEABLE)
// ============================================================================
class CarrotProjectile {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 16;
    this.direction = direction; // 1 = derecha, -1 = izquierda
    this.speed = 520;
    this.vx = this.speed * direction;
    this.vy = -70; // Ligero arco inicial
    this.rotation = 0;
    this.isDead = false;
    this.life = 2.0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.vy += 180 * dt; // Gravedad
    this.y += this.vy * dt;
    this.rotation += this.direction * 14 * dt;
    this.life -= dt;

    if (this.life <= 0 || this.x < -40 || this.x > canvas.width + 40 || this.y > GROUND_Y + 20) {
      this.isDead = true;
    }
  }

  draw(context) {
    context.save();
    context.translate(this.x + this.width / 2, this.y + this.height / 2);
    context.rotate(this.rotation);

    // Cuerpo de la zanahoria arrojadiza
    context.fillStyle = '#ed8936';
    context.beginPath();
    context.moveTo(-14, -6);
    context.lineTo(14, 0);
    context.lineTo(-14, 6);
    context.closePath();
    context.fill();

    // Follaje de la zanahoria
    context.fillStyle = '#48bb78';
    context.beginPath();
    context.arc(-15, 0, 4, 0, Math.PI * 2);
    context.fill();

    context.restore();

    if (GameState.debugMode) {
      context.strokeStyle = '#f6ad55';
      context.lineWidth = 1.5;
      context.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
}

// ============================================================================
// 7. CLASE RABBIT (JUGADOR - CONEJO GUARDIÁN)
// ============================================================================
class Rabbit {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.width = 56;
    this.height = 62;

    this.x = canvasWidth / 2 - this.width / 2;
    this.baseY = GROUND_Y - this.height;
    this.y = this.baseY;

    // Atributos y niveles de habilidades
    this.baseSpeed = 310;
    this.speed = this.baseSpeed;
    this.speedLevel = 0;

    this.baseJumpForce = -470;
    this.jumpForce = this.baseJumpForce;
    this.jumpLevel = 0;
    this.gravity = 1150;

    this.vx = 0;
    this.vy = 0;
    this.isJumping = false;

    // Habilidades avanzadas
    this.scareRadiusBonus = 0;
    this.scareRoarLevel = 0;

    this.hasCarrotThrow = false;
    this.carrotLevel = 0;
    this.carrotCooldownTimer = 0;
    this.carrotCooldown = 0.42;

    this.hasDash = false;
    this.dashLevel = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 0.18;
    this.dashCooldownTimer = 0;
    this.dashCooldown = 1.5;

    // Animación
    this.facingDirection = 1;
    this.hopAnimationTimer = 0;
    this.earTwitch = 0;
  }

  update(dt, inputState) {
    // Manejo de enfriamiento de zanahoria
    if (this.carrotCooldownTimer > 0) {
      this.carrotCooldownTimer -= dt;
    }

    // Manejo de enfriamiento de dash
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= dt;
    }

    // 1. Dash activo
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.x += this.facingDirection * 780 * dt;
      particles.addCrumbs(this.x + this.width / 2, this.y + this.height - 4, '#a0aec0', 2);
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else {
      // Movimiento horizontal normal
      this.vx = 0;
      if (inputState.left) {
        this.vx = -this.speed;
        this.facingDirection = -1;
      }
      if (inputState.right) {
        this.vx = this.speed;
        this.facingDirection = 1;
      }

      this.x += this.vx * dt;

      // Activar Dash si tiene la habilidad y presiona tecla
      if (inputState.dash && this.hasDash && this.dashCooldownTimer <= 0) {
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldownTimer = this.dashCooldown;
        AudioSys.playDash();
        particles.addShockwave(this.x + this.width / 2, this.y + this.height / 2, 60, '#68d391');
      }
    }

    // Límites de pantalla
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

    // Salto
    if (inputState.jump && !this.isJumping) {
      this.vy = this.jumpForce;
      this.isJumping = true;
      AudioSys.playHop();
      particles.addCrumbs(this.x + this.width / 2, this.baseY + this.height, '#9ae6b4', 4);
    }

    if (this.isJumping) {
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;

      if (this.y >= this.baseY) {
        this.y = this.baseY;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    // Animación
    if (this.vx !== 0 || this.isJumping || this.isDashing) {
      this.hopAnimationTimer += dt * 14;
    } else {
      this.hopAnimationTimer = 0;
    }
    this.earTwitch += dt * 4;
  }

  tryThrowCarrot(projectilesList) {
    if (!this.hasCarrotThrow || this.carrotCooldownTimer > 0) return;
    this.carrotCooldownTimer = this.carrotCooldown;

    const startX = this.facingDirection === 1 ? this.x + this.width : this.x - 20;
    const startY = this.y + 18;
    projectilesList.push(new CarrotProjectile(startX, startY, this.facingDirection));

    // Si tiene nivel 2+, lanza doble zanahoria o mayor velocidad
    if (this.carrotLevel >= 2) {
      setTimeout(() => {
        if (!GameState.isGameOver) {
          projectilesList.push(new CarrotProjectile(startX, startY - 8, this.facingDirection));
        }
      }, 100);
    }

    AudioSys.playThrow();
  }

  // Caja de colisión ampliada por la habilidad de rugido/alcance
  getCollisionRect() {
    const bonus = this.scareRadiusBonus;
    return {
      x: this.x - bonus,
      y: this.y - bonus,
      width: this.width + bonus * 2,
      height: this.height + bonus * 2
    };
  }

  draw(context) {
    const { x, y, width, height, facingDirection } = this;
    const bounceOffset = Math.sin(this.hopAnimationTimer) * 4;

    context.save();
    context.translate(x + width / 2, y + height / 2 + bounceOffset);
    context.scale(facingDirection, 1);

    // Efecto visual de Dash o halo de Rugido
    if (this.isDashing) {
      context.fillStyle = 'rgba(72, 187, 120, 0.4)';
      context.beginPath();
      context.ellipse(-10, 6, 26, 20, 0, 0, Math.PI * 2);
      context.fill();
    }

    // Sombra en el suelo
    context.fillStyle = 'rgba(15, 23, 42, 0.3)';
    context.beginPath();
    context.ellipse(0, height / 2 - bounceOffset + 4, 24, 7, 0, 0, Math.PI * 2);
    context.fill();

    // Cola de pompón
    context.fillStyle = '#edf2f7';
    context.beginPath();
    context.arc(-18, 10, 8.5, 0, Math.PI * 2);
    context.fill();

    // Cuerpo
    context.fillStyle = '#e2e8f0';
    context.beginPath();
    context.ellipse(-2, 8, 19, 17, 0, 0, Math.PI * 2);
    context.fill();

    // Cabeza
    context.fillStyle = '#f7fafc';
    context.beginPath();
    context.ellipse(9, -6, 16, 15, 0, 0, Math.PI * 2);
    context.fill();

    // Orejas
    const earWiggle = Math.sin(this.earTwitch) * 2;
    context.fillStyle = '#e2e8f0';
    context.beginPath();
    context.ellipse(4, -25 + earWiggle, 5.5, 15, -0.15, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#f7fafc';
    context.beginPath();
    context.ellipse(10, -27, 6.5, 17, 0.1, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#fbb6ce';
    context.beginPath();
    context.ellipse(10, -27, 3.2, 12, 0.1, 0, Math.PI * 2);
    context.fill();

    // Ojo
    context.fillStyle = '#1a202c';
    context.beginPath();
    context.arc(15, -8, 3.8, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(16.5, -9, 1.4, 0, Math.PI * 2);
    context.fill();

    // Hocico y nariz
    context.fillStyle = '#f687b3';
    context.beginPath();
    context.arc(21, -4, 2.8, 0, Math.PI * 2);
    context.fill();

    // Capa de guardián ecológico
    context.fillStyle = '#38a169';
    context.beginPath();
    context.moveTo(3, 0);
    context.lineTo(13, 0);
    context.lineTo(-4, 14);
    context.closePath();
    context.fill();

    // Patitas
    context.fillStyle = '#edf2f7';
    context.beginPath();
    context.ellipse(11, 21, 6.5, 4.5, 0, 0, Math.PI * 2);
    context.ellipse(-6, 21, 8.5, 5.5, 0, 0, Math.PI * 2);
    context.fill();

    context.restore();

    if (GameState.debugMode) {
      const colBox = this.getCollisionRect();
      context.strokeStyle = '#4299e1';
      context.lineWidth = 2;
      context.strokeRect(colBox.x, colBox.y, colBox.width, colBox.height);
      context.fillStyle = '#4299e1';
      context.font = '10px monospace';
      context.fillText(`RABBIT [Lv Spd:${this.speedLevel} Jmp:${this.jumpLevel}]`, this.x, this.y - 8);
    }
  }
}

// ============================================================================
// 8. CLASE INSECT (ENEMIGO TERRESTRE CON COOLDOWN DE ATAQUE)
// ============================================================================
class Insect {
  constructor(spawnSide, cropsList) {
    this.width = 40;
    this.height = 30;

    if (spawnSide === 'LEFT') {
      this.x = -this.width - 20;
      this.direction = 1;
    } else {
      this.x = canvas.width + 20;
      this.direction = -1;
    }
    this.y = GROUND_Y - this.height - 2;

    this.baseSpeed = 75 + Math.random() * 45;
    this.speed = this.baseSpeed * GameState.enemySpeedMult;
    this.vx = this.speed * this.direction;

    this.state = 'PATRULLAJE'; // 'PATRULLAJE', 'ALIMENTACION', 'HUYENDO'
    this.targetCrop = this.findNearestCrop(cropsList);

    // ========================================================================
    // SISTEMA DE COOLDOWN DE ATAQUE
    // ========================================================================
    this.baseAttackCooldown = 1.4; // Cooldown base en segundos entre mordiscos
    this.attackCooldown = this.baseAttackCooldown * GameState.enemyCooldownMult;
    this.attackTimer = 0.5; // Primer mordisco tiene un breve tiempo de preparación

    this.animationTimer = Math.random() * 10;
    this.munchTimer = 0;
    this.isDead = false;
  }

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

  update(dt, crops) {
    this.animationTimer += dt * 14;

    switch (this.state) {
      case 'PATRULLAJE':
        this.updatePatrol(dt, crops);
        break;
      case 'ALIMENTACION':
        this.updateFeeding(dt);
        break;
      case 'HUYENDO':
        this.updateFleeing(dt);
        break;
    }
  }

  updatePatrol(dt, crops) {
    if (this.targetCrop) {
      const targetCenterX = this.targetCrop.x + this.targetCrop.width / 2;
      const currentCenterX = this.x + this.width / 2;
      this.direction = (targetCenterX > currentCenterX) ? 1 : -1;
      this.vx = this.speed * this.direction;
    }

    this.x += this.vx * dt;

    // Colisión con cultivo
    for (const crop of crops) {
      if (checkCollisionAABB(this, crop)) {
        this.state = 'ALIMENTACION';
        this.vx = 0;
        this.targetCrop = crop;
        this.attackTimer = 0.5; // Breve preparación antes del primer mordisco
        break;
      }
    }
  }

  updateFeeding(dt) {
    this.vx = 0;
    this.munchTimer += dt * 9;

    // Actualizar Cooldown de Ataque
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.executeBite();
      this.attackTimer = this.attackCooldown;
    }
  }

  executeBite() {
    if (!this.targetCrop) return;

    // Verificar si el cultivo tiene un escudo activo
    if (this.targetCrop.shieldPoints > 0) {
      this.targetCrop.shieldPoints--;
      AudioSys.playShieldBlock();
      particles.addText('🛡️ ¡Bloqueado!', this.x + this.width / 2, this.y - 12, '#63b3ed');
      particles.addCrumbs(this.x + this.width / 2, this.y, '#90cdf4', 5);
      return;
    }

    // Daño a los nutrientes globales
    const damageAmount = 4.5;
    NutrientesDelCultivo -= damageAmount;
    if (NutrientesDelCultivo < 0) NutrientesDelCultivo = 0;

    AudioSys.playNibble();
    particles.addText(`-${damageAmount}%`, this.x + this.width / 2, this.y - 10, '#f56565');
    particles.addCrumbs(this.x + this.width / 2, this.y + 10, '#ed8936', 5);
  }

  updateFleeing(dt) {
    this.vx = this.speed * 2.3 * this.direction;
    this.x += this.vx * dt;
    this.y -= 45 * dt;

    if (this.x < -70 || this.x > canvas.width + 70 || this.y < -50) {
      this.isDead = true;
    }
  }

  scareAway(fromDirection) {
    if (this.state !== 'HUYENDO') {
      this.state = 'HUYENDO';
      this.direction = fromDirection >= 0 ? 1 : -1;
      AudioSys.playScare();
      GameState.scoreRepelled++;
      WaveManager.onEnemyDefeated();
      particles.addText('¡Espantado!', this.x + this.width / 2, this.y - 16, '#68d391');
    }
  }

  draw(context) {
    const { x, y, width, height, direction, state } = this;
    const munchOffset = (state === 'ALIMENTACION') ? Math.sin(this.munchTimer) * 2.5 : 0;

    context.save();
    context.translate(x + width / 2, y + height / 2 + munchOffset);
    context.scale(direction, 1);

    // Patitas
    const legWiggle = Math.sin(this.animationTimer) * 3;
    context.strokeStyle = '#2d3748';
    context.lineWidth = 2;
    for (let i = -10; i <= 10; i += 9) {
      context.beginPath();
      context.moveTo(i, 6);
      context.lineTo(i + (legWiggle * (i > 0 ? 1 : -1)), 14);
      context.stroke();
    }

    // Color del cuerpo según estado
    if (state === 'ALIMENTACION') {
      context.fillStyle = '#e53e3e';
    } else if (state === 'HUYENDO') {
      context.fillStyle = '#a0aec0';
    } else {
      context.fillStyle = '#d69e2e';
    }

    // Abdomen
    context.beginPath();
    context.ellipse(-5, 0, 13, 9, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    context.stroke();

    // Cabeza
    context.fillStyle = '#744210';
    context.beginPath();
    context.ellipse(11, 0, 7, 7, 0, 0, Math.PI * 2);
    context.fill();

    // Antenas
    context.strokeStyle = '#744210';
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(14, -3);
    context.lineTo(21, -9 + legWiggle);
    context.stroke();

    // Ojo
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(13, -2, 2.2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#000000';
    context.beginPath();
    context.arc(14.5, -2, 1.1, 0, Math.PI * 2);
    context.fill();

    context.restore();

    // ========================================================================
    // BARRA VISUAL DE COOLDOWN DE ATAQUE (Cuando está alimentándose)
    // ========================================================================
    if (state === 'ALIMENTACION') {
      const barWidth = 32;
      const barHeight = 5;
      const barX = this.x + (this.width - barWidth) / 2;
      const barY = this.y - 12;
      const progress = Math.max(0, Math.min(1, 1 - (this.attackTimer / this.attackCooldown)));

      context.save();
      context.fillStyle = 'rgba(0, 0, 0, 0.6)';
      context.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
      context.fillStyle = progress > 0.8 ? '#e53e3e' : '#ecc94b';
      context.fillRect(barX, barY, barWidth * progress, barHeight);
      context.restore();
    }

    if (GameState.debugMode) {
      context.strokeStyle = state === 'ALIMENTACION' ? '#e53e3e' : '#ecc94b';
      context.lineWidth = 1.5;
      context.strokeRect(this.x, this.y, this.width, this.height);
      context.fillStyle = '#ffffff';
      context.font = '9px monospace';
      context.fillText(`[${this.state}] CD:${this.attackTimer.toFixed(1)}s`, this.x - 6, this.y - 16);
    }
  }
}

// ============================================================================
// 9. CLASE FLYING PEST (ENEMIGO VOLADOR: CUERVO / PÁJARO DE HUERTA)
// ============================================================================
class FlyingPest {
  constructor(spawnSide, cropsList) {
    this.width = 46;
    this.height = 36;

    this.direction = (spawnSide === 'LEFT') ? 1 : -1;
    this.x = (spawnSide === 'LEFT') ? -this.width - 25 : canvas.width + 25;

    // Altura de vuelo en el cielo
    this.cruiseAltitude = 120 + Math.random() * 120;
    this.y = this.cruiseAltitude;

    this.baseSpeed = 100 + Math.random() * 45;
    this.speed = this.baseSpeed * GameState.enemySpeedMult;
    this.vx = this.speed * this.direction;
    this.vy = 0;

    this.state = 'PATRULLAJE_AEREO'; // 'PATRULLAJE_AEREO', 'ENPICADA', 'ALIMENTACION', 'RETIRADA', 'HUYENDO'
    this.targetCrop = this.findNearestCrop(cropsList);

    // Cooldown para descender en picada
    this.diveCooldown = 1.8 + Math.random() * 2.5;

    // Cooldown de ataque al posarse sobre el cultivo
    this.baseAttackCooldown = 1.2;
    this.attackCooldown = this.baseAttackCooldown * GameState.enemyCooldownMult;
    this.attackTimer = 0.4;
    this.pecksCount = 0; // Se retira tras picotear 2 veces si no lo espantan

    this.wingFlapTimer = Math.random() * 10;
    this.isDead = false;
  }

  findNearestCrop(crops) {
    if (!crops || crops.length === 0) return null;
    return crops[Math.floor(Math.random() * crops.length)];
  }

  update(dt, crops) {
    this.wingFlapTimer += dt * 16;

    switch (this.state) {
      case 'PATRULLAJE_AEREO':
        this.updateAirPatrol(dt);
        break;
      case 'ENPICADA':
        this.updateDive(dt, crops);
        break;
      case 'ALIMENTACION':
        this.updateFeeding(dt);
        break;
      case 'RETIRADA':
        this.updateAscend(dt);
        break;
      case 'HUYENDO':
        this.updateFleeing(dt);
        break;
    }
  }

  updateAirPatrol(dt) {
    // Oscilación suave en el cielo
    this.y = this.cruiseAltitude + Math.sin(this.wingFlapTimer * 0.4) * 18;
    this.x += this.vx * dt;

    // Dar la vuelta en los extremos si aún no pica
    if (this.x > canvas.width - 60 && this.direction === 1) {
      this.direction = -1;
      this.vx = -this.speed;
    } else if (this.x < 60 && this.direction === -1) {
      this.direction = 1;
      this.vx = this.speed;
    }

    // Cuenta regresiva para picada hacia el cultivo
    this.diveCooldown -= dt;
    if (this.diveCooldown <= 0 && this.targetCrop) {
      this.state = 'ENPICADA';
      AudioSys.playBirdChirp();
    }
  }

  updateDive(dt, crops) {
    if (!this.targetCrop) {
      this.state = 'RETIRADA';
      return;
    }

    const targetX = this.targetCrop.x + this.targetCrop.width / 2 - this.width / 2;
    const targetY = this.targetCrop.y - 10;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    this.direction = dx >= 0 ? 1 : -1;

    if (dist < 12) {
      this.state = 'ALIMENTACION';
      this.x = targetX;
      this.y = targetY;
      this.attackTimer = 0.4;
      this.pecksCount = 0;
    } else {
      const diveSpeed = this.speed * 1.6;
      this.x += (dx / dist) * diveSpeed * dt;
      this.y += (dy / dist) * diveSpeed * dt;
    }
  }

  updateFeeding(dt) {
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.executePeck();
      this.pecksCount++;
      this.attackTimer = this.attackCooldown;

      if (this.pecksCount >= 2) {
        this.state = 'RETIRADA';
        this.diveCooldown = 3.0;
      }
    }
  }

  executePeck() {
    if (!this.targetCrop) return;

    if (this.targetCrop.shieldPoints > 0) {
      this.targetCrop.shieldPoints--;
      AudioSys.playShieldBlock();
      particles.addText('🛡️ ¡Picotazo Evitado!', this.x + this.width / 2, this.y - 14, '#63b3ed');
      return;
    }

    const damageAmount = 5.0;
    NutrientesDelCultivo -= damageAmount;
    if (NutrientesDelCultivo < 0) NutrientesDelCultivo = 0;

    AudioSys.playNibble();
    particles.addText(`-${damageAmount}%`, this.x + this.width / 2, this.y - 12, '#f56565');
    particles.addCrumbs(this.x + this.width / 2, this.y + 12, '#38a169', 5);
  }

  updateAscend(dt) {
    this.y -= 140 * dt;
    this.x += this.speed * 0.9 * this.direction * dt;

    if (this.y <= this.cruiseAltitude) {
      this.state = 'PATRULLAJE_AEREO';
      this.targetCrop = crops[Math.floor(Math.random() * crops.length)];
    }
  }

  updateFleeing(dt) {
    this.y -= 180 * dt;
    this.x += this.speed * 2.2 * this.direction * dt;

    if (this.x < -80 || this.x > canvas.width + 80 || this.y < -60) {
      this.isDead = true;
    }
  }

  scareAway(fromDirection) {
    if (this.state !== 'HUYENDO') {
      this.state = 'HUYENDO';
      this.direction = fromDirection >= 0 ? 1 : -1;
      AudioSys.playBirdChirp();
      AudioSys.playScare();
      GameState.scoreRepelled++;
      WaveManager.onEnemyDefeated();
      particles.addText('¡Ave Ahuyentada!', this.x + this.width / 2, this.y - 16, '#9ae6b4');
      particles.addCrumbs(this.x + this.width / 2, this.y + 10, '#4a5568', 6); // Plumas
    }
  }

  draw(context) {
    const { x, y, width, height, direction, state } = this;
    const flapAngle = Math.sin(this.wingFlapTimer) * 0.55;

    // Sombra del ave en el suelo para orientar al jugador
    context.save();
    const shadowScale = Math.max(0.3, 1 - (y / GROUND_Y));
    context.fillStyle = 'rgba(15, 23, 42, 0.2)';
    context.beginPath();
    context.ellipse(x + width / 2, GROUND_Y + 4, 18 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();

    context.save();
    context.translate(x + width / 2, y + height / 2);
    context.scale(direction, 1);

    // Alas (superior e inferior animadas)
    context.fillStyle = '#2d3748';
    context.beginPath();
    context.ellipse(-2, -6, 16, 7, flapAngle, 0, Math.PI * 2);
    context.fill();

    // Cuerpo del cuervo/ave
    context.fillStyle = '#1a202c';
    context.beginPath();
    context.ellipse(0, 2, 14, 10, 0, 0, Math.PI * 2);
    context.fill();

    // Cabeza
    context.fillStyle = '#2d3748';
    context.beginPath();
    context.arc(12, -4, 8, 0, Math.PI * 2);
    context.fill();

    // Pico amarillo/anaranjado
    context.fillStyle = '#ecc94b';
    context.beginPath();
    context.moveTo(18, -6);
    context.lineTo(27, -3);
    context.lineTo(18, 0);
    context.closePath();
    context.fill();

    // Ojo brillante
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(14, -5, 2.2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#000000';
    context.beginPath();
    context.arc(15, -5, 1.1, 0, Math.PI * 2);
    context.fill();

    // Cola
    context.fillStyle = '#1a202c';
    context.beginPath();
    context.moveTo(-12, 0);
    context.lineTo(-24, -4);
    context.lineTo(-24, 6);
    context.closePath();
    context.fill();

    context.restore();

    // Barra de Cooldown de ataque cuando está posada picoteando
    if (state === 'ALIMENTACION') {
      const barWidth = 32;
      const barHeight = 5;
      const barX = this.x + (this.width - barWidth) / 2;
      const barY = this.y - 12;
      const progress = Math.max(0, Math.min(1, 1 - (this.attackTimer / this.attackCooldown)));

      context.save();
      context.fillStyle = 'rgba(0, 0, 0, 0.6)';
      context.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
      context.fillStyle = '#e53e3e';
      context.fillRect(barX, barY, barWidth * progress, barHeight);
      context.restore();
    }

    if (GameState.debugMode) {
      context.strokeStyle = '#9f7aea';
      context.lineWidth = 1.5;
      context.strokeRect(this.x, this.y, this.width, this.height);
      context.fillStyle = '#d6bcfa';
      context.font = '9px monospace';
      context.fillText(`[FLY: ${this.state}] CD:${this.attackTimer.toFixed(1)}s`, this.x - 10, this.y - 16);
    }
  }
}

// ============================================================================
// 10. CLASE ALLY GUARDIAN (ABEJA ALIADA AUTÓNOMA)
// ============================================================================
class AllyGuardian {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.width = 24;
    this.height = 20;
    this.x = canvasWidth / 2;
    this.y = 200;
    this.actionCooldown = 5.0;
    this.actionTimer = 2.0;
    this.hoverTime = 0;
  }

  update(dt, enemiesList) {
    this.hoverTime += dt * 12;
    this.actionTimer -= dt;

    // Patrulla flotando suavemente en el cielo
    this.y = 210 + Math.sin(this.hoverTime * 0.3) * 35;
    this.x = (this.canvasWidth / 2) + Math.cos(this.hoverTime * 0.2) * (this.canvasWidth * 0.35);

    // Cada ciclo, busca una plaga activa y la ahuyenta
    if (this.actionTimer <= 0) {
      const activeEnemies = enemiesList.filter(e => e.state !== 'HUYENDO');
      if (activeEnemies.length > 0) {
        const target = activeEnemies[Math.floor(Math.random() * activeEnemies.length)];
        target.scareAway(1);
        AudioSys.playHit();
        particles.addText('🐝 ¡Piquete Protector!', target.x, target.y - 20, '#ecc94b');
        particles.addShockwave(target.x + target.width / 2, target.y + target.height / 2, 45, '#ecc94b');
        this.actionTimer = this.actionCooldown;
      }
    }
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.y);

    // Alas transparentes zumbando
    const wingWiggle = Math.sin(this.hoverTime * 3) * 6;
    context.fillStyle = 'rgba(255, 255, 255, 0.7)';
    context.beginPath();
    context.ellipse(-4, -10 + wingWiggle, 6, 9, -0.3, 0, Math.PI * 2);
    context.ellipse(4, -10 - wingWiggle, 6, 9, 0.3, 0, Math.PI * 2);
    context.fill();

    // Cuerpo rayado amarillo y negro
    context.fillStyle = '#ecc94b';
    context.beginPath();
    context.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#1a202c';
    context.fillRect(-3, -7, 3, 14);
    context.fillRect(3, -6, 3, 12);

    // Ojo tierno
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(7, -2, 2.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#000000';
    context.beginPath();
    context.arc(8, -2, 1.2, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }
}

// ============================================================================
// 11. SISTEMA DE CLIMA DINÁMICO (WEATHER MANAGER)
// ============================================================================
/**
 * Gestiona el clima agroecológico de la huerta:
 * - 'SOL': Clima normal con sol radiante; comportamiento estándar de insectos y aves.
 * - 'LLUVIA': Lluvia fértil que cae sobre el suelo y regenera los nutrientes de las plantas (+2.2%/s).
 * - 'NUBLADO': Cielo cubierto de nubes densas; las aves no aparecen (se refugian en los árboles).
 */
const WeatherManager = {
  currentWeather: 'SOL', // 'SOL', 'LLUVIA', 'NUBLADO'
  rainDrops: [],
  clouds: [],
  regenTextTimer: 0,

  init(width, height) {
    // Inicializar partículas de lluvia
    this.rainDrops = [];
    for (let i = 0; i < 110; i++) {
      this.rainDrops.push({
        x: Math.random() * (width + 160) - 80,
        y: Math.random() * height,
        length: 12 + Math.random() * 14,
        vy: 480 + Math.random() * 220,
        vx: -50 - Math.random() * 30,
        alpha: 0.35 + Math.random() * 0.45
      });
    }

    // Inicializar nubes esponjosas en el cielo
    this.clouds = [
      { x: width * 0.08, y: 70, scale: 1.15, vx: 18 },
      { x: width * 0.42, y: 110, scale: 0.9, vx: 24 },
      { x: width * 0.78, y: 65, scale: 1.3, vx: 16 },
      { x: -width * 0.25, y: 95, scale: 1.05, vx: 20 }
    ];
  },

  setWeather(weatherType) {
    this.currentWeather = weatherType;
    AudioSys.playWeatherChange();
    updateHUD();

    if (weatherType === 'LLUVIA') {
      particles.addText('🌧️ ¡Lluvia Fértil! Las plantas se regeneran con el agua.', canvas.width / 2, 130, '#63b3ed', 18);
    } else if (weatherType === 'NUBLADO') {
      particles.addText('☁️ ¡Cielo Nublado! Las aves se ocultan y no atacarán.', canvas.width / 2, 130, '#cbd5e0', 18);
      // Si existía algún ave en pantalla, se retira inmediatamente
      if (flyingPests && flyingPests.length > 0) {
        flyingPests.forEach(fly => {
          if (fly.state !== 'HUYENDO') {
            fly.scareAway(1);
          }
        });
      }
    } else {
      particles.addText('☀️ ¡Día Soleado! La huerta brilla con luz natural.', canvas.width / 2, 130, '#ecc94b', 18);
    }
  },

  // Asignar el clima correspondiente para cada oleada
  getWeatherForWave(waveNum) {
    // Oleada 1: Sol (normal / bienvenida)
    // Oleada 2: Nublado (introduce mecánica: ¡sin aves voladoras!)
    // Oleada 3: Lluvia (introduce mecánica: ¡regeneración continua de nutrientes!)
    // Oleada 4+: Rotación dinámica
    const cycle = ['SOL', 'NUBLADO', 'LLUVIA', 'SOL', 'LLUVIA', 'NUBLADO'];
    return cycle[(waveNum - 1) % cycle.length];
  },

  update(dt, width, height) {
    // Desplazamiento horizontal continuo de nubes
    for (const c of this.clouds) {
      c.x += c.vx * dt;
      if (c.x > width + 220) {
        c.x = -220;
      }
    }

    // Efectos específicos de LLUVIA
    if (this.currentWeather === 'LLUVIA') {
      // 1. Física de gotas de lluvia
      for (const d of this.rainDrops) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        // Salpicadura al chocar con el plano del suelo
        if (d.y >= GROUND_Y) {
          if (Math.random() < 0.22) {
            particles.addShockwave(d.x, GROUND_Y, 7 + Math.random() * 8, 'rgba(147, 197, 253, 0.55)');
          }
          d.y = -15;
          d.x = Math.random() * (width + 160) - 80;
        }
      }

      // 2. REGENERACIÓN DE PLANTAS: El agua de lluvia regenera los nutrientes
      if (NutrientesDelCultivo < 100) {
        NutrientesDelCultivo += 2.2 * dt;
        if (NutrientesDelCultivo > 100) NutrientesDelCultivo = 100;

        this.regenTextTimer += dt;
        if (this.regenTextTimer >= 2.8) {
          this.regenTextTimer = 0;
          particles.addText('💧 ¡Lluvia regenerando huerta! +2.2%/s', width / 2, GROUND_Y - 45, '#63b3ed', 15);
        }
      }
    }
  },

  draw(context, width, height) {
    // Dibujar nubes en clima NUBLADO o LLUVIA
    if (this.currentWeather === 'NUBLADO' || this.currentWeather === 'LLUVIA') {
      context.save();
      const cloudColor = (this.currentWeather === 'LLUVIA') ? 'rgba(74, 85, 104, 0.65)' : 'rgba(226, 232, 240, 0.8)';
      context.fillStyle = cloudColor;

      for (const c of this.clouds) {
        this.drawFluffyCloud(context, c.x, c.y, c.scale);
      }
      context.restore();
    }

    // Dibujar gotas de lluvia en clima LLUVIA
    if (this.currentWeather === 'LLUVIA') {
      context.save();
      context.strokeStyle = 'rgba(191, 219, 254, 0.75)';
      context.lineWidth = 1.8;

      for (const d of this.rainDrops) {
        context.beginPath();
        context.moveTo(d.x, d.y);
        context.lineTo(d.x + (d.vx * 0.032), d.y + (d.vy * 0.032));
        context.stroke();
      }
      context.restore();
    }
  },

  drawFluffyCloud(context, x, y, scale = 1.0) {
    context.beginPath();
    context.arc(x, y, 32 * scale, 0, Math.PI * 2);
    context.arc(x + 28 * scale, y - 14 * scale, 36 * scale, 0, Math.PI * 2);
    context.arc(x + 64 * scale, y - 10 * scale, 30 * scale, 0, Math.PI * 2);
    context.arc(x + 92 * scale, y, 28 * scale, 0, Math.PI * 2);
    context.arc(x + 46 * scale, y + 12 * scale, 32 * scale, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }
};

// ============================================================================
// 12. SISTEMA DE OLEADAS EQUILIBRADAS (WAVE MANAGER FSM)
// ============================================================================
/**
 * Máquina de estados robusta para las oleadas:
 * - 'PREPARATION': 4 segundos de descanso con cuenta regresiva para que el jugador se posicione y conozca el clima.
 * - 'SPAWNING': Genera enemigos espaciados con intervalos justos.
 * - 'FIGHTING': Espera a que el jugador derrote a todas las plagas de la oleada.
 * - 'VICTORY': 2 segundos de celebración con cartel antes de abrir las 3 mejoras.
 * - 'UPGRADE': Pausado mientras el jugador elige su recompensa.
 */
const WaveManager = {
  currentWave: 1,
  totalEnemiesInWave: 4,
  spawnedInWave: 0,
  defeatedInWave: 0,
  spawnTimer: 0,
  spawnInterval: 2.6,

  state: 'PREPARATION', // 'PREPARATION', 'SPAWNING', 'FIGHTING', 'VICTORY', 'UPGRADE'
  prepTimer: 4.0,
  victoryTimer: 0,

  startFirstWave() {
    this.currentWave = 1;
    this.prepareWave(1);
  },

  prepareWave(waveNum) {
    this.currentWave = waveNum;
    this.state = 'PREPARATION';
    this.prepTimer = 4.0; // 4 segundos de intermisión garantizada
    this.spawnedInWave = 0;
    this.defeatedInWave = 0;
    this.spawnTimer = 0;

    // Dificultad incremental justa:
    // Oleada 1: 4 plagas
    // Oleada 2: 6 plagas
    // Oleada 3: 8 plagas
    // Oleada 4: 10 plagas, etc.
    this.totalEnemiesInWave = 4 + (waveNum - 1) * 2;
    this.spawnInterval = Math.max(1.8, 2.8 - (waveNum - 1) * 0.1);

    // Velocidad progresiva
    GameState.enemySpeedMult = 1.0 + (waveNum - 1) * 0.04;

    // Establecer el clima de la oleada
    const nextWeather = WeatherManager.getWeatherForWave(waveNum);
    WeatherManager.setWeather(nextWeather);

    AudioSys.playWaveStart();
    updateHUD();
  },

  update(dt, cropsList, insectsList, flyingList) {
    // ------------------------------------------------------------------------
    // FASE 1: PREPARACIÓN (INTERMISIÓN DE 4 SEGUNDOS)
    // ------------------------------------------------------------------------
    if (this.state === 'PREPARATION') {
      this.prepTimer -= dt;
      if (this.prepTimer <= 0) {
        this.state = 'SPAWNING';
        this.spawnTimer = 0.6; // El primer enemigo aparece poco después
        particles.addText('¡A DEFENDER LA HUERTA!', canvas.width / 2, canvas.height * 0.36, '#f56565', 26);
      }
      return; // No spawnea ni chequea victoria durante la preparación
    }

    // ------------------------------------------------------------------------
    // FASE 2: SPAWNING (Generando plagas con ritmo constante)
    // ------------------------------------------------------------------------
    if (this.state === 'SPAWNING') {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnNextEnemy(cropsList, insectsList, flyingList);

        if (this.spawnedInWave >= this.totalEnemiesInWave) {
          this.state = 'FIGHTING';
        }
      }
    }

    // ------------------------------------------------------------------------
    // FASE 3: FIGHTING (Combatiendo las plagas restantes)
    // ------------------------------------------------------------------------
    if (this.state === 'FIGHTING') {
      const activeGround = insectsList.filter(i => i.state !== 'HUYENDO').length;
      const activeFlying = flyingList.filter(f => f.state !== 'HUYENDO').length;

      // La oleada se supera cuando no queda ningún enemigo activo y todos fueron repelidos
      if (this.spawnedInWave >= this.totalEnemiesInWave && activeGround === 0 && activeFlying === 0) {
        this.state = 'VICTORY';
        this.victoryTimer = 2.0; // 2 segundos de celebración
        AudioSys.playUpgrade();
        particles.addText('¡OLEADA SUPERADA!', canvas.width / 2, canvas.height / 2 - 35, '#fef08a', 32);
        particles.addShockwave(canvas.width / 2, canvas.height / 2, 160, '#ecc94b');
      }
    }

    // ------------------------------------------------------------------------
    // FASE 4: VICTORIA (Celebración antes de desplegar las 3 mejoras)
    // ------------------------------------------------------------------------
    if (this.state === 'VICTORY') {
      this.victoryTimer -= dt;
      if (this.victoryTimer <= 0) {
        this.state = 'UPGRADE';
        GameState.isPausedForUpgrade = true;
        UpgradeManager.presentUpgrades();
      }
    }
  },

  spawnNextEnemy(cropsList, insectsList, flyingList) {
    this.spawnedInWave++;
    const spawnSide = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';

    // Regla crucial: En clima NUBLADO NO aparecen aves voladoras
    let allowFlying = (WeatherManager.currentWeather !== 'NUBLADO') && (this.currentWave >= 2);
    let spawnFlyingChance = allowFlying ? Math.min(0.48, 0.25 + (this.currentWave - 2) * 0.08) : 0;

    if (allowFlying && Math.random() < spawnFlyingChance) {
      flyingList.push(new FlyingPest(spawnSide, cropsList));
    } else {
      insectsList.push(new Insect(spawnSide, cropsList));
    }

    updateHUD();
  },

  onEnemyDefeated() {
    this.defeatedInWave++;
    updateHUD();
  },

  drawBanner(context) {
    context.save();

    // Banner animado durante PREPARACIÓN
    if (this.state === 'PREPARATION') {
      const remainingSec = Math.ceil(this.prepTimer);
      const bannerY = canvas.height * 0.22;
      const bannerHeight = 115;

      // Caja de banner con fondo translúcido
      context.fillStyle = 'rgba(8, 22, 14, 0.9)';
      context.fillRect(0, bannerY, canvas.width, bannerHeight);
      context.strokeStyle = '#48bb78';
      context.lineWidth = 2.5;
      context.strokeRect(0, bannerY, canvas.width, bannerHeight);

      context.textAlign = 'center';

      // Título de Oleada
      context.font = 'bold 32px "Segoe UI", sans-serif';
      context.fillStyle = '#fef08a';
      context.fillText(`¡OLEADA ${this.currentWave}!`, canvas.width / 2, bannerY + 38);

      // Descripción del clima y cuenta regresiva
      context.font = 'bold 17px "Segoe UI", sans-serif';
      let weatherDesc = '';
      if (WeatherManager.currentWeather === 'LLUVIA') {
        weatherDesc = '🌧️ Lluvia Fértil (Las plantas se regeneran)';
      } else if (WeatherManager.currentWeather === 'NUBLADO') {
        weatherDesc = '☁️ Nublado (¡Sin aves voladoras!)';
      } else {
        weatherDesc = '☀️ Soleado (Clima normal)';
      }

      context.fillStyle = '#a7f3d0';
      context.fillText(`${weatherDesc}  —  Comienza en: ${remainingSec}s`, canvas.width / 2, bannerY + 72);

      // Barra de progreso de la cuenta regresiva
      const prog = Math.max(0, this.prepTimer / 4.0);
      context.fillStyle = '#48bb78';
      context.fillRect(canvas.width / 2 - 130, bannerY + 88, 260 * prog, 6);
    }

    // Banner de VICTORIA
    if (this.state === 'VICTORY') {
      context.textAlign = 'center';
      context.font = 'bold 36px "Segoe UI", sans-serif';
      context.fillStyle = '#ecc94b';
      context.fillText(`✨ ¡OLEADA ${this.currentWave} SUPERADA! ✨`, canvas.width / 2, canvas.height * 0.32);
      context.font = '18px "Segoe UI", sans-serif';
      context.fillStyle = '#e2f1e7';
      context.fillText('Reclamando recompensas del ecosistema...', canvas.width / 2, canvas.height * 0.32 + 36);
    }

    context.restore();
  }
};

// ============================================================================
// 13. SISTEMA DE MEJORAS Y HABILIDADES ROGUELITE (UPGRADE MANAGER)
// ============================================================================
const UpgradeManager = {
  // Catálogo completo de habilidades y atributos
  upgradesCatalog: [
    {
      id: 'carrot_throw',
      title: 'Zanahorias Arrojadizas',
      icon: '🥕',
      type: 'Ataque a Distancia',
      desc: 'Lanza zanahorias con la tecla [J], [Enter] o Clic para ahuyentar plagas desde lejos.',
      level: 0,
      apply(rabbit) {
        rabbit.hasCarrotThrow = true;
        rabbit.carrotLevel++;
        rabbit.carrotCooldown = Math.max(0.24, 0.45 - rabbit.carrotLevel * 0.08);
      }
    },
    {
      id: 'rabbit_speed',
      title: 'Patas Ligeras',
      icon: '⚡',
      type: 'Atributo: Velocidad',
      desc: 'Aumenta la velocidad de movimiento del conejo guardián en un +25%.',
      level: 0,
      apply(rabbit) {
        rabbit.speedLevel++;
        rabbit.speed = rabbit.baseSpeed * (1 + rabbit.speedLevel * 0.25);
      }
    },
    {
      id: 'super_jump',
      title: 'Salto Acrobático',
      icon: '🦘',
      type: 'Atributo: Salto',
      desc: 'Aumenta la fuerza de salto (+30%) para interceptar aves en pleno vuelo.',
      level: 0,
      apply(rabbit) {
        rabbit.jumpLevel++;
        rabbit.jumpForce = rabbit.baseJumpForce * (1 + rabbit.jumpLevel * 0.28);
      }
    },
    {
      id: 'scare_roar',
      title: 'Rugido Territorial',
      icon: '📢',
      type: 'Habilidad: Alcance',
      desc: 'Aumenta el radio de espanto (+40%) con una onda expansiva al aterrizar.',
      level: 0,
      apply(rabbit) {
        rabbit.scareRoarLevel++;
        rabbit.scareRadiusBonus += 22;
      }
    },
    {
      id: 'compost',
      title: 'Compost Revitalizante',
      icon: '💧',
      type: 'Sostenibilidad',
      desc: 'Recupera +30% de nutrientes de inmediato y activa regeneración pasiva del suelo (+1% cada 3s).',
      level: 0,
      apply() {
        NutrientesDelCultivo = Math.min(100, NutrientesDelCultivo + 30);
        GameState.passiveRegenRate += 0.35;
      }
    },
    {
      id: 'crop_shield',
      title: 'Malla Anti-Plagas',
      icon: '🛡️',
      type: 'Defensa de Cultivos',
      desc: 'Coloca 2 escudos protectores en cada cultivo que absorben mordiscos sin perder nutrientes.',
      level: 0,
      apply(rabbit, crops) {
        crops.forEach(crop => {
          crop.shieldPoints += 2;
        });
      }
    },
    {
      id: 'herbal_repellent',
      title: 'Repelente Herbal',
      icon: '⏱️',
      type: 'Control de Plagas',
      desc: 'Aumenta el Cooldown de mordisco enemigo (+45%) y reduce su velocidad de marcha.',
      level: 0,
      apply() {
        GameState.enemyCooldownMult *= 1.45;
        GameState.enemySpeedMult *= 0.85;
      }
    },
    {
      id: 'dash',
      title: 'Carrera Relámpago (Dash)',
      icon: '💨',
      type: 'Habilidad Activa',
      desc: 'Presiona [Shift] para impulsarte a toda velocidad espantando a las plagas en tu paso.',
      level: 0,
      apply(rabbit) {
        rabbit.hasDash = true;
        rabbit.dashLevel++;
      }
    },
    {
      id: 'ally_bee',
      title: 'Abeja Guardiana',
      icon: '🐝',
      type: 'Aliado Ecológico',
      desc: 'Invoca una abeja guardiana que patrulla el cielo y espanta plagas periódicamente.',
      level: 0,
      apply(rabbit, crops, allEnemies, allyList) {
        if (!allyList.some(a => a instanceof AllyGuardian)) {
          allyList.push(new AllyGuardian(canvas.width, canvas.height));
        }
      }
    }
  ],

  isChoosing: false,

  presentUpgrades() {
    this.isChoosing = false;
    const shuffled = [...this.upgradesCatalog].sort(() => 0.5 - Math.random());
    const selected3 = shuffled.slice(0, 3);

    upgradeCardsGrid.innerHTML = '';
    selected3.forEach(upg => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.setAttribute('tabindex', '-1');
      card.innerHTML = `
        <div class="upgrade-card-icon">${upg.icon}</div>
        <div class="upgrade-card-type">${upg.type}</div>
        <div class="upgrade-card-name">${upg.title}</div>
        <div class="upgrade-card-description">${upg.desc}</div>
        <div class="upgrade-card-level">${upg.level === 0 ? '✨ Desbloquear' : `Nivel ${upg.level + 1}`}</div>
        <button class="upgrade-card-btn" tabindex="-1">Elegir Mejora</button>
      `;

      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.chooseUpgrade(upg);
      });

      upgradeCardsGrid.appendChild(card);
    });

    upgradeScreen.classList.add('active');

    // Desenfocar cualquier elemento activo para evitar que la barra espaciadora lo accione
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  },

  chooseUpgrade(upgrade) {
    if (this.isChoosing) return;
    this.isChoosing = true;

    // Desenfocar inmediatamente
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    upgrade.level++;
    upgrade.apply(rabbit, crops, [...insects, ...flyingPests], allies);

    upgradeScreen.classList.remove('active');
    upgradeCardsGrid.innerHTML = ''; // Vaciar tarjetas para que no queden elementos residuales
    GameState.isPausedForUpgrade = false;

    AudioSys.playUpgrade();
    particles.addText(`¡${upgrade.title}!`, canvas.width / 2, canvas.height / 2, '#48bb78', 24);

    // Iniciar limpia y ordenadamente la preparación de la siguiente ronda (4 segundos de respiro)
    WaveManager.prepareWave(WaveManager.currentWave + 1);

    setTimeout(() => {
      this.isChoosing = false;
    }, 600);
  }
};

// ============================================================================
// 14. ESCENARIO Y FONDO EN HD CON CLIMA DINÁMICO
// ============================================================================
function drawScenicBackground(context, width, height) {
  // 1. Cielo según el clima activo
  const skyGrad = context.createLinearGradient(0, 0, 0, GROUND_Y);

  if (WeatherManager.currentWeather === 'LLUVIA') {
    // Cielo de lluvia: azul-pizarra oscuro tormentoso
    skyGrad.addColorStop(0, '#2d4b3b');
    skyGrad.addColorStop(0.4, '#406753');
    skyGrad.addColorStop(1, '#689680');
  } else if (WeatherManager.currentWeather === 'NUBLADO') {
    // Cielo nublado: gris plata suave con toques celestes
    skyGrad.addColorStop(0, '#4a5568');
    skyGrad.addColorStop(0.4, '#718096');
    skyGrad.addColorStop(1, '#cbd5e0');
  } else {
    // Cielo soleado: verde-esmeralda y celeste radiante
    skyGrad.addColorStop(0, '#5bb883');
    skyGrad.addColorStop(0.4, '#87dfa7');
    skyGrad.addColorStop(1, '#c6f6d5');
  }

  context.fillStyle = skyGrad;
  context.fillRect(0, 0, width, height);

  // 2. Sol (con visibilidad según el clima)
  context.save();
  if (WeatherManager.currentWeather === 'LLUVIA') {
    context.globalAlpha = 0.2; // Sol apenas visible bajo la lluvia
  } else if (WeatherManager.currentWeather === 'NUBLADO') {
    context.globalAlpha = 0.35; // Sol velado por nubes
  } else {
    context.globalAlpha = 1.0; // Sol radiante
  }

  context.fillStyle = 'rgba(254, 240, 138, 0.85)';
  context.beginPath();
  context.arc(width - 110, 85, 48, 0, Math.PI * 2);
  context.fill();

  if (WeatherManager.currentWeather === 'SOL') {
    context.fillStyle = 'rgba(254, 240, 138, 0.2)';
    context.beginPath();
    context.arc(width - 110, 85, 75, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  // 3. Colinas verdes lejanas
  context.fillStyle = (WeatherManager.currentWeather === 'LLUVIA') ? '#36694e' : '#48bb78';
  context.beginPath();
  context.ellipse(width * 0.25, GROUND_Y - 90, width * 0.35, 110, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = (WeatherManager.currentWeather === 'LLUVIA') ? '#28533d' : '#38a169';
  context.beginPath();
  context.ellipse(width * 0.75, GROUND_Y - 80, width * 0.45, 120, 0, 0, Math.PI * 2);
  context.fill();

  // 4. Valla de madera rústica
  context.fillStyle = '#8c5332';
  context.fillRect(0, GROUND_Y - 80, width, 12);
  context.fillRect(0, GROUND_Y - 50, width, 12);

  for (let px = 25; px < width; px += 85) {
    context.fillRect(px, GROUND_Y - 100, 16, 75);
    context.beginPath();
    context.moveTo(px, GROUND_Y - 100);
    context.lineTo(px + 8, GROUND_Y - 115);
    context.lineTo(px + 16, GROUND_Y - 100);
    context.fill();
  }

  // 5. Suelo orgánico fértil
  const soilGrad = context.createLinearGradient(0, GROUND_Y, 0, height);
  soilGrad.addColorStop(0, '#532e18');
  soilGrad.addColorStop(0.3, '#3c1f0f');
  soilGrad.addColorStop(1, '#221108');
  context.fillStyle = soilGrad;
  context.fillRect(0, GROUND_Y, width, height - GROUND_Y);

  // Línea de césped fértil
  context.fillStyle = (WeatherManager.currentWeather === 'LLUVIA') ? '#276749' : '#2f855a';
  context.fillRect(0, GROUND_Y - 5, width, 10);
}

// ============================================================================
// 14. CONTROLADOR DE ENTRADA (TECLADO, RATÓN Y TÁCTIL)
// ============================================================================
const InputHandler = {
  keys: { left: false, right: false, jump: false, dash: false },

  init() {
    // Desenfocar cualquier botón o elemento al hacer clic en cualquier parte de la pantalla
    window.addEventListener('pointerup', () => {
      if (document.activeElement && document.activeElement !== document.body && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    });

    window.addEventListener('keydown', (e) => {
      AudioSys.init();

      // CRUCIAL: Prevenir comportamiento por defecto de Espacio, Flechas y Enter
      // Evita activar el botón enfocado (por ejemplo el botón de pantalla completa o de mejoras)
      // y evita el desplazamiento/scroll de la página.
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Asegurar que ningún botón conserve el foco mientras se interactúa con el juego
      if (document.activeElement && document.activeElement !== document.body && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.jump = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') this.keys.dash = true;

      // Lanzar zanahoria con J o Enter
      if (e.code === 'KeyJ' || e.code === 'Enter') {
        if (e.code === 'Enter') e.preventDefault();
        if (rabbit && !GameState.isGameOver && !GameState.isPausedForUpgrade) {
          rabbit.tryThrowCarrot(projectiles);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.jump = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') this.keys.dash = false;
    });

    // Clic del ratón sobre el canvas para lanzar zanahorias
    canvas.addEventListener('pointerdown', (e) => {
      AudioSys.init();
      if (document.activeElement && document.activeElement !== document.body && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      if (rabbit && !GameState.isGameOver && !GameState.isPausedForUpgrade) {
        rabbit.tryThrowCarrot(projectiles);
      }
    });

    // Controles táctiles en pantalla
    const touchLeft = document.getElementById('touchLeft');
    const touchRight = document.getElementById('touchRight');
    const touchJump = document.getElementById('touchJump');
    const touchThrow = document.getElementById('touchThrow');

    const bindTouch = (elem, pressCallback, releaseCallback) => {
      if (!elem) return;
      elem.addEventListener('touchstart', (e) => { e.preventDefault(); AudioSys.init(); pressCallback(); });
      elem.addEventListener('touchend', (e) => { e.preventDefault(); releaseCallback(); });
    };

    bindTouch(touchLeft, () => { this.keys.left = true; }, () => { this.keys.left = false; });
    bindTouch(touchRight, () => { this.keys.right = true; }, () => { this.keys.right = false; });
    bindTouch(touchJump, () => { this.keys.jump = true; }, () => { this.keys.jump = false; });
    bindTouch(touchThrow, () => {
      if (rabbit && !GameState.isGameOver && !GameState.isPausedForUpgrade) {
        rabbit.tryThrowCarrot(projectiles);
      }
    }, () => {});
  }
};

// ============================================================================
// 15. GESTIÓN DE RESOLUCIÓN (1270x720 / 720x1270 HD) Y PANTALLA COMPLETA
// ============================================================================
function setCanvasResolution(mode) {
  GameState.orientation = mode;

  if (mode === 'portrait') {
    // 720 por 1270 (HD Vertical)
    canvas.width = 720;
    canvas.height = 1270;
    GROUND_Y = 1060;
    gameWrapper.classList.add('portrait-mode');
  } else {
    // 1270 por 720 (HD Horizontal)
    canvas.width = 1270;
    canvas.height = 720;
    GROUND_Y = 590;
    gameWrapper.classList.remove('portrait-mode');
  }

  // Reubicar cultivos proporcionalmente
  if (crops && crops.length > 0) {
    const cropCount = crops.length;
    for (let i = 0; i < cropCount; i++) {
      crops[i].width = 50;
      crops[i].height = 60;
      crops[i].x = canvas.width * (0.16 + i * 0.22) - crops[i].width / 2;
      crops[i].y = GROUND_Y - crops[i].height;
    }
  }

  // Ajustar plano de conejo
  if (rabbit) {
    rabbit.canvasWidth = canvas.width;
    rabbit.canvasHeight = canvas.height;
    rabbit.baseY = GROUND_Y - rabbit.height;
    if (!rabbit.isJumping) rabbit.y = rabbit.baseY;
  }

  // Reinicializar partículas de clima con las nuevas dimensiones
  if (typeof WeatherManager !== 'undefined') {
    WeatherManager.init(canvas.width, canvas.height);
  }
}

function toggleFullscreen() {
  AudioSys.init();
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    const el = gameWrapper || document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function handleFullscreenChange() {
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (fullscreenBtn) {
    fullscreenBtn.innerHTML = isFs ? '❌ Salir Pantalla Completa' : '⛶ Pantalla Completa (720x1270 HD)';
  }
}

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

// ============================================================================
// 16. INSTANCIACIÓN DE ENTIDADES Y REINICIO
// ============================================================================
let rabbit;
let crops = [];
let insects = [];
let flyingPests = [];
let projectiles = [];
let allies = [];

function setupGameEntities() {
  NutrientesDelCultivo = 100.0;
  GameState.isGameOver = false;
  GameState.isPausedForUpgrade = false;
  GameState.scoreRepelled = 0;
  GameState.passiveRegenRate = 0;
  GameState.enemyCooldownMult = 1.0;
  GameState.enemySpeedMult = 1.0;

  // Restablecer niveles del catálogo de mejoras
  UpgradeManager.upgradesCatalog.forEach(u => { u.level = 0; });

  // Configurar dimensiones HD iniciales
  setCanvasResolution(GameState.orientation);

  // Instanciar jugador
  rabbit = new Rabbit(canvas.width, canvas.height);

  // Instanciar cultivos espaciados
  crops = [
    new Crop(canvas.width * 0.16, GROUND_Y, 'Cultivo 1'),
    new Crop(canvas.width * 0.38, GROUND_Y, 'Cultivo 2'),
    new Crop(canvas.width * 0.60, GROUND_Y, 'Cultivo 3'),
    new Crop(canvas.width * 0.82, GROUND_Y, 'Cultivo 4')
  ];

  insects = [];
  flyingPests = [];
  projectiles = [];
  allies = [];

  gameOverScreen.classList.remove('active');
  upgradeScreen.classList.remove('active');

  // Inicializar clima dinámico
  if (typeof WeatherManager !== 'undefined') {
    WeatherManager.init(canvas.width, canvas.height);
  }

  // Iniciar la Oleada 1 con 4 segundos de preparación
  WaveManager.startFirstWave();
}

// ============================================================================
// 17. ACTUALIZACIÓN LÓGICA Y GAME LOOP
// ============================================================================
let lastTimestamp = 0;

function gameLoop(currentTimestamp) {
  if (!lastTimestamp) lastTimestamp = currentTimestamp;
  const rawDeltaTime = (currentTimestamp - lastTimestamp) / 1000;
  const deltaTime = Math.min(rawDeltaTime, 0.1);
  lastTimestamp = currentTimestamp;

  if (!GameState.isGameOver && !GameState.isPausedForUpgrade) {
    update(deltaTime);
  }

  render();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Regeneración pasiva de nutrientes si está activa por mejora
  if (GameState.passiveRegenRate > 0 && NutrientesDelCultivo < 100) {
    NutrientesDelCultivo += GameState.passiveRegenRate * dt;
    if (NutrientesDelCultivo > 100) NutrientesDelCultivo = 100;
  }

  // Actualizar clima dinámico (física de lluvia, nubes y regeneración por agua)
  if (typeof WeatherManager !== 'undefined') {
    WeatherManager.update(dt, canvas.width, canvas.height);
  }

  // Actualizar jugador
  rabbit.update(dt, InputHandler.keys);

  // Actualizar cultivos
  for (const crop of crops) {
    crop.update(dt);
  }

  // Actualizar proyectiles de zanahoria
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.update(dt);

    // Colisión de proyectil con insectos terrestres
    for (const insect of insects) {
      if (insect.state !== 'HUYENDO' && checkCollisionAABB(proj, insect)) {
        insect.scareAway(proj.direction);
        proj.isDead = true;
        AudioSys.playHit();
        particles.addCrumbs(proj.x, proj.y, '#ed8936', 8);
        break;
      }
    }

    // Colisión de proyectil con enemigos voladores
    if (!proj.isDead) {
      for (const fly of flyingPests) {
        if (fly.state !== 'HUYENDO' && checkCollisionAABB(proj, fly)) {
          fly.scareAway(proj.direction);
          proj.isDead = true;
          AudioSys.playHit();
          particles.addCrumbs(proj.x, proj.y, '#ed8936', 8);
          break;
        }
      }
    }

    if (proj.isDead) {
      projectiles.splice(i, 1);
    }
  }

  // Actualizar insectos terrestres
  const rabbitHitbox = rabbit.getCollisionRect();
  for (let i = insects.length - 1; i >= 0; i--) {
    const insect = insects[i];
    insect.update(dt, crops);

    // Colisión Conejo vs Insecto
    if (insect.state !== 'HUYENDO' && checkCollisionAABB(rabbitHitbox, insect)) {
      const fromDir = (rabbit.x < insect.x) ? 1 : -1;
      insect.scareAway(fromDir);
      particles.addShockwave(insect.x + insect.width / 2, insect.y + insect.height / 2, 45, '#48bb78');
    }

    if (insect.isDead) {
      insects.splice(i, 1);
    }
  }

  // Actualizar enemigos voladores
  for (let i = flyingPests.length - 1; i >= 0; i--) {
    const fly = flyingPests[i];
    fly.update(dt, crops);

    // Colisión Conejo vs Ave Voladora (¡Permite cazar aves saltando!)
    if (fly.state !== 'HUYENDO' && checkCollisionAABB(rabbitHitbox, fly)) {
      const fromDir = (rabbit.x < fly.x) ? 1 : -1;
      fly.scareAway(fromDir);
      particles.addShockwave(fly.x + fly.width / 2, fly.y + fly.height / 2, 50, '#9ae6b4');
    }

    if (fly.isDead) {
      flyingPests.splice(i, 1);
    }
  }

  // Actualizar aliados autónomos
  for (const ally of allies) {
    ally.update(dt, [...insects, ...flyingPests]);
  }

  // Actualizar gestor de oleadas
  WaveManager.update(dt, crops, insects, flyingPests);

  // Actualizar sistema de partículas
  particles.update(dt);

  // Actualizar interfaz HUD
  updateHUD();

  // Verificar Game Over
  if (NutrientesDelCultivo <= 0 && !GameState.isGameOver) {
    triggerGameOver();
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Fondo escénico HD (cielo según clima, sol y colinas)
  drawScenicBackground(ctx, canvas.width, canvas.height);

  // 2. Clima dinámico (nubes y lluvia sobre el cielo)
  if (typeof WeatherManager !== 'undefined') {
    WeatherManager.draw(ctx, canvas.width, canvas.height);
  }

  // 3. Cultivos
  for (const crop of crops) {
    crop.draw(ctx);
  }

  // 4. Insectos terrestres
  for (const insect of insects) {
    insect.draw(ctx);
  }

  // 5. Proyectiles
  for (const proj of projectiles) {
    proj.draw(ctx);
  }

  // 6. Conejo Guardián
  rabbit.draw(ctx);

  // 7. Enemigos voladores
  for (const fly of flyingPests) {
    fly.draw(ctx);
  }

  // 8. Aliados
  for (const ally of allies) {
    ally.draw(ctx);
  }

  // 9. Partículas y textos flotantes
  particles.draw(ctx);

  // 10. Banner de Oleada
  WaveManager.drawBanner(ctx);
}

// ============================================================================
// 18. GESTIÓN DE HUD Y GAME OVER
// ============================================================================
function updateHUD() {
  const percentage = Math.max(0, Math.min(100, Math.round(NutrientesDelCultivo)));
  if (nutrientFill) {
    nutrientFill.style.width = `${percentage}%`;
    if (percentage > 50) {
      nutrientFill.style.background = 'linear-gradient(90deg, #ecc94b 0%, #48bb78 70%, #38a169 100%)';
    } else if (percentage > 25) {
      nutrientFill.style.background = 'linear-gradient(90deg, #ed8936 0%, #ecc94b 100%)';
    } else {
      nutrientFill.style.background = 'linear-gradient(90deg, #e53e3e 0%, #f56565 100%)';
    }
  }
  if (nutrientText) nutrientText.textContent = `${percentage}%`;

  // Actualizar indicador de clima en el HUD
  if (weatherText && typeof WeatherManager !== 'undefined') {
    if (WeatherManager.currentWeather === 'LLUVIA') {
      weatherText.textContent = '🌧️ Lluvia (+Regen)';
      weatherText.className = 'hud-value weather-rain';
    } else if (WeatherManager.currentWeather === 'NUBLADO') {
      weatherText.textContent = '☁️ Nublado (Sin Aves)';
      weatherText.className = 'hud-value weather-cloudy';
    } else {
      weatherText.textContent = '☀️ Soleado';
      weatherText.className = 'hud-value weather-sun';
    }
  }

  if (waveText) waveText.textContent = `🌊 ${WaveManager.currentWave}`;

  const remaining = Math.max(0, WaveManager.totalEnemiesInWave - WaveManager.defeatedInWave);
  if (remainingPestsElem) remainingPestsElem.textContent = `🎯 ${remaining}`;
  if (repelledPestsElem) repelledPestsElem.textContent = `🛡️ ${GameState.scoreRepelled}`;

  // Compatibilidad retroactiva si algún elemento activePests existe
  const activePestsFallback = document.getElementById('activePests');
  if (activePestsFallback) {
    const activeCount = (insects ? insects.filter(i => i.state !== 'HUYENDO').length : 0) +
                        (flyingPests ? flyingPests.filter(f => f.state !== 'HUYENDO').length : 0);
    activePestsFallback.textContent = `🐛 ${activeCount}`;
  }
}

function triggerGameOver() {
  GameState.isGameOver = true;
  if (overlayTitle) {
    overlayTitle.textContent = '¡Huerta Sin Nutrientes!';
    overlayTitle.className = 'overlay-title loss';
  }
  if (overlayDesc) {
    overlayDesc.textContent = `Los insectos y aves consumieron las reservas del suelo en la Oleada ${WaveManager.currentWave}. Lograste ahuyentar a ${GameState.scoreRepelled} plagas ecológicamente.`;
  }
  if (gameOverScreen) gameOverScreen.classList.add('active');
}

// ============================================================================
// 19. ARRANQUE E INICIALIZACIÓN
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  InputHandler.init();

  // Botón Pantalla Completa (720x1270 HD)
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', (e) => {
      toggleFullscreen();
      if (fullscreenBtn && fullscreenBtn.blur) fullscreenBtn.blur();
    });
  }

  // Botón Alternar Resolución (1270x720 / 720x1270)
  if (resolutionToggleBtn) {
    resolutionToggleBtn.addEventListener('click', (e) => {
      const nextMode = (GameState.orientation === 'landscape') ? 'portrait' : 'landscape';
      setCanvasResolution(nextMode);
      particles.addText(nextMode === 'portrait' ? '📱 Modo 720x1270 HD' : '💻 Modo 1270x720 HD', canvas.width / 2, canvas.height / 2, '#ecc94b', 24);
      if (resolutionToggleBtn && resolutionToggleBtn.blur) resolutionToggleBtn.blur();
    });
  }

  // Checkbox Modo Debug
  if (debugBoxToggle) {
    debugBoxToggle.addEventListener('change', (e) => {
      GameState.debugMode = e.target.checked;
      if (debugBoxToggle && debugBoxToggle.blur) debugBoxToggle.blur();
    });
  }

  // Botón Reintentar
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      setupGameEntities();
      if (restartBtn && restartBtn.blur) restartBtn.blur();
    });
  }

  // Iniciar entidades y Game Loop
  setupGameEntities();
  requestAnimationFrame(gameLoop);
});
