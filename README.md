# Bubble Bobble WebGL - PlayCanvas Edition

A WebGL implementation of the classic Bubble Bobble platform game using the PlayCanvas engine.

## Features

- Player movement and jumping (Arrow keys, WASD, or Spacebar)
- Enemy AI with gravity and platform physics
- Platform-based 2D gameplay
- Score, lives, and level tracking
- Proper AABB collision detection

## Quick Start

### Local Server

```bash
cd public
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

## Controls

- **Arrow Left/Right** or **A/D** - Move
- **Arrow Up**, **W**, or **Space** - Jump

## Game Mechanics

- Jump on platforms to navigate the level
- Avoid enemies — collision costs a life
- Stay alive as long as possible
- Enemies spawn at the top and patrol the platforms
- Horizontal wrapping keeps the action centered

## Built With

- [PlayCanvas Engine](https://github.com/playcanvas/engine) — WebGL game engine
- Vanilla JavaScript — No build step required
- CDN-hosted PlayCanvas library

## TODO

- [ ] Bubble shooting mechanic
- [ ] Enemy trapping and popping
- [ ] Score multipliers
- [ ] Multiple levels with increasing difficulty
- [ ] Sound effects
- [ ] Mobile touch controls
- [ ] Particle effects
