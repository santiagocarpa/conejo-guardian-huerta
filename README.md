# 🥕 El Conejo Guardián de la Huerta

**Videojuego Educativo Ecológico 2D en HTML5 Canvas y JavaScript**

Un videojuego pedagógico que enseña conceptos fundamentales de ciencias de la computación, física matemática para videojuegos y agroecología mediante el control biológico de plagas sin químicos.

---

## 🎮 Descripción del Juego

El jugador encarna a un **Conejo Guardián** que custodia una huerta orgánica de vegetales (zanahorias). Periódicamente, insectos invasores ingresan por los costados para consumir los nutrientes del cultivo.

El jugador debe desplazarse rápidamente y saltar para ahuyentar a las plagas mediante **control biológico**, evitando que la variable global de nutrientes de la huerta caiga a 0%.

---

## 🚀 Conceptos Técnicos y Pedagógicos

### 1. Game Loop con `requestAnimationFrame` y `deltaTime`
- **Sincronización Vertical (V-Sync):** El ciclo de juego se ejecuta acoplado a la tasa de refresco del monitor mediante `requestAnimationFrame`.
- **Independencia de Tasa de Cuadros:** Los desplazamientos y temporizadores se normalizan multiplicando las velocidades por `deltaTime` (segundos transcurridos entre cuadros), garantizando física idéntica en cualquier dispositivo.

### 2. Detección de Colisiones AABB (*Axis-Aligned Bounding Box*)
- **Física de Cajas Alineadas:** Algoritmo de complejidad $O(1)$ basado en el Teorema de Ejes Separadores simplificado para rectángulos 2D ortogonales.
- **Condición Booleana:**
  ```javascript
  function checkCollisionAABB(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }
  ```

### 3. Máquina de Estados Finitos (FSM)
La clase `Insect` modela el comportamiento de las plagas mediante una FSM predecible y extensible:
- **`PATRULLAJE`:** El insecto ingresa desde los laterales, localiza el cultivo más cercano y avanza hacia él.
- **Transición por Colisión AABB:** Al colisionar con una planta, cambia inmediatamente al estado `ALIMENTACION`.
- **`ALIMENTACION`:** Anula su velocidad horizontal (`vx = 0`), reproduce animación de masticado y descuenta puntos de la variable global `NutrientesDelCultivo`.
- **`HUYENDO`:** Si el conejo guardián colisiona con el insecto, activa una transición de huida rápida fuera de la pantalla.

### 4. Sistema de Audio Procedural
- Construido con la API nativa de **Web Audio** (`AudioContext`). Genera sonidos en tiempo real (saltos, masticado, espanto de plagas) sin necesidad de cargar archivos de audio externos.

### 5. Herramienta Didáctica en Pantalla
- Incluye el interruptor **"Modo Visualizador AABB & FSM"** para renderizar las cajas de colisión y los rótulos de estado en tiempo real sobre el lienzo.

---

## 🕹️ Controles

| Tecla | Acción |
| :--- | :--- |
| **`←` / `A`** | Moverse a la Izquierda |
| **`→` / `D`** | Moverse a la Derecha |
| **`Espacio` / `↑` / `W`** | Saltar / Ahuyentar plagas |
| **Checkbox HUD** | Alternar Modo Visualizador AABB & FSM |

---

## 📦 Estructura del Proyecto

```text
conejo-guardian-huerta/
├── index.html     # Estructura semántica, Canvas y HUD educativo
├── style.css      # Sistema de diseño agroecológico y Glassmorphism
├── main.js        # Motor del juego, Game Loop, clases Rabbit, Crop, Insect (FSM) y AABB
└── README.md      # Documentación pedagógica y guía de uso
```

---

## 💻 Cómo Ejecutarlo

1. Clona o descarga este repositorio:
   ```bash
   git clone https://github.com/santiagocarpa/conejo-guardian-huerta.git
   ```
2. Abre directamente `index.html` en cualquier navegador web moderno (Chrome, Firefox, Safari, Edge).
3. O inicia un servidor HTTP local:
   ```bash
   # Con Python
   python -m http.server 8080
   ```
   Y accede a `http://localhost:8080`.

---

Desarrollado como proyecto educativo de Programación y Desarrollo de Videojuegos 2D. 🌱🐰
