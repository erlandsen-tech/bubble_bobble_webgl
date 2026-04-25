# Bubble Bobble WebGL

A WebGL implementation of the classic Bubble Bobble platform game.

## Features

- Player movement and jumping (Arrow keys or WASD)
- Enemy AI with simple pathfinding
- Platform-based gameplay
- Score and lives tracking
- Level system (framework in place)

## Quick Start

### Static Server (Simplest)

```bash
cd public
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

### Development with Node.js

```bash
npm install
npm run dev
```

## Controls

- **Arrow Left/Right** or **A/D** - Move
- **Arrow Up** or **W** - Jump

## Game Mechanics

- Jump on platforms to avoid enemies
- Stay alive as long as possible
- Enemies spawn at the top and patrol

## TODO

- [ ] Bubble shooting mechanic
- [ ] Enemy popping animation
- [ ] Score multipliers
- [ ] Boss levels
- [ ] Sound effects
- [ ] Mobile touch controls
