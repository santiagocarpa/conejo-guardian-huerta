# 🥕 El Conejo Guardián de la Huerta (Edición HD)

**Videojuego de Supervivencia Agroecológica 2D en HTML5 Canvas y JavaScript**

> 🌐 **Jugar online directamente en el navegador:**  
> 👉 **[https://santiagocarpa.github.io/conejo-guardian-huerta/](https://santiagocarpa.github.io/conejo-guardian-huerta/)**

---

## 🎮 Descripción del Juego

El jugador encarna a un **Conejo Guardián** que custodia una huerta orgánica de vegetales (zanahorias). En esta nueva versión HD, la huerta es asediada tanto por **insectos terrestres** como por **cuervos y aves voladoras**.

El objetivo es resistir un **sistema de oleadas progresivas**, espantando a las plagas mediante control biológico, proyectiles y habilidades desbloqueables antes de que agoten los nutrientes de la huerta.

Al finalizar cada oleada con éxito, el ecosistema recompensa al guardián permitiéndole **elegir 1 de 3 habilidades o atributos aleatorios** (estilo Roguelite).

---

## ✨ Nuevas Características Implementadas

1. **📺 Modo HD y Pantalla Completa (720x1270 / 1270x720)**:
   - Botón de **Pantalla Completa** con escalado nítido.
   - Alternador dinámico entre formato panorámico (**1270×720**) y vertical móvil (**720×1270**).
2. **⏱️ Cooldown de Ataque en Enemigos**:
   - Barra de recarga visual sobre los insectos y aves cuando están consumiendo los vegetales.
   - Brinda tiempo de reacción al jugador antes de que se produzca el daño.
3. **🦅 Enemigos Voladores (Cuervos de Huerta)**:
   - Patrullan el cielo con aleteo animado, proyectan sombra en el suelo y descienden en picada para comerse los cultivos.
   - Se pueden interceptar saltando en el aire o con proyectiles de zanahoria.
4. **🌦️ Sistema de Clima Dinámico**:
   - ☀️ **Sol (Normal)**: Día brillante; comportamiento estándar de plagas terrestres y voladoras.
   - 🌧️ **Lluvia Fértil**: Gotas de lluvia animadas y ondas de agua en el suelo; **regenera los nutrientes de las plantas (+2.2%/s)** continuamente.
   - ☁️ **Nublado (Sin Aves)**: Cielo cubierto de nubes; **las aves voladoras NO aparecen** (se refugian en los árboles y no atacarán).
5. **🌊 Sistema de Oleadas Equilibradas (FSM de 4 Fases)**:
   - **Fase de Preparación (4 segundos)**: Cuenta regresiva animada en pantalla para que el jugador se posicione y conozca el clima antes del combate.
   - **Fase de Combate**: Spawning gradual y espaciado de plagas con cuotas justas y equilibradas.
   - **Fase de Celebración (2 segundos)**: Anuncio triunfal de oleada superada antes de abrir las recompensas.
   - **Fase de Recompensa Roguelite**: Pausa estratégica para elegir 1 de 3 mejoras sin reinicios abruptos.
6. **🃏 Sistema Roguelite: 3 Opciones al Final de Cada Ronda**:
   - Modal con 3 cartas aleatorias de un catálogo de 9 habilidades y atributos:
     - 🥕 **Zanahorias Arrojadizas**: Ataque a distancia.
     - ⚡ **Patas Ligeras**: +25% de velocidad de movimiento.
     - 🦘 **Salto Acrobático**: +30% de impulso de salto.
     - 📢 **Rugido Territorial**: +40% de área de espanto y onda de choque.
     - 💧 **Compost Revitalizante**: +30% de nutrientes y regeneración pasiva.
     - 🛡️ **Malla Anti-Plagas**: Escudos protectores que absorben ataques en los cultivos.
     - ⏱️ **Repelente Herbal**: Aumenta el cooldown enemigo (+45%) y reduce su velocidad.
     - 💨 **Carrera Rápida (Dash)**: Impulso de aceleración con la tecla Shift.
     - 🐝 **Abeja Guardiana**: Aliado biológico que patrulla y ahuyenta plagas automáticamente.

---

## 🕹️ Controles

| Tecla / Control | Acción |
| :--- | :--- |
| **`←` / `→`** o **`A` / `D`** | Moverse a los costados |
| **`Espacio` / `↑` / `W`** | Saltar / Cazar aves en el aire |
| **`J` / `Enter` / Clic** | Lanzar Zanahorias (con habilidad desbloqueada) |
| **`Shift` / `K`** | Dash / Carrera rápida (con habilidad desbloqueada) |
| **D-Pad & Botones Táctiles** | Controles en pantalla para dispositivos móviles |
| **Botón Pantalla Completa** | Activar / Desactivar pantalla completa HD |
| **Botón 1270x720 / 720x1270** | Alternar orientación Horizontal / Vertical HD |
| **Checkbox Debug** | Modo visualizador de cajas de colisión y cooldowns |

---

## 📦 Estructura del Proyecto

```text
conejo-guardian-huerta/
├── .github/workflows/deploy.yml  # Automatización de despliegue a GitHub Pages
├── index.html                   # Interfaz semántica, HUD, modales y Canvas HD
├── style.css                    # Estilos modernos, Glassmorphism, cartas y Fullscreen
├── main.js                      # Motor del juego: oleadas, Roguelite, FSM, audio y física
└── README.md                    # Documentación y guía de uso
```

---

Desarrollado como proyecto agroecológico de videojuegos 2D. 🌱🐰
