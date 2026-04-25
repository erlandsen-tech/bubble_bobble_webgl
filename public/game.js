// Bubble Bobble - WebGL Implementation
class Game {
    constructor() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x001a33);
        
        this.camera = new THREE.OrthographicCamera(
            window.innerWidth / -2, window.innerWidth / 2,
            window.innerHeight / 2, window.innerHeight / -2,
            0.1, 1000
        );
        this.camera.position.z = 10;
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameActive = true;
        
        // Physics & input
        this.keys = {};
        this.gravity = 0.6;
        this.friction = 0.92;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.bubbles = [];
        this.platforms = [];
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Create player
        this.player = new Player(0, -80);
        this.scene.add(this.player.mesh);
        
        // Create platforms
        this.createLevel(1);
        
        // Create enemies
        this.spawnEnemies(2);
    }
    
    createLevel(levelNum) {
        // Clear existing platforms
        this.platforms.forEach(p => this.scene.remove(p.mesh));
        this.platforms = [];
        
        const platformData = [
            { x: 0, y: -100, width: 500, height: 30 },
            { x: -200, y: 50, width: 350, height: 25 },
            { x: 200, y: 50, width: 350, height: 25 },
            { x: -200, y: 200, width: 350, height: 25 },
            { x: 200, y: 200, width: 350, height: 25 },
            { x: 0, y: 350, width: 500, height: 30 },
        ];
        
        platformData.forEach(data => {
            const platform = new Platform(data.x, data.y, data.width, data.height);
            this.platforms.push(platform);
            this.scene.add(platform.mesh);
        });
    }
    
    spawnEnemies(count) {
        this.enemies = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 600;
            const y = window.innerHeight / 2 - 150;
            const enemy = new Enemy(x, y);
            this.enemies.push(enemy);
            this.scene.add(enemy.mesh);
        }
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    onWindowResize() {
        this.camera.left = window.innerWidth / -2;
        this.camera.right = window.innerWidth / 2;
        this.camera.top = window.innerHeight / 2;
        this.camera.bottom = window.innerHeight / -2;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        // Player input
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.player.velocityX = -6;
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            this.player.velocityX = 6;
        } else {
            this.player.velocityX *= this.friction;
        }
        
        if ((this.keys['ArrowUp'] || this.keys['w'] || this.keys[' ']) && this.player.onGround) {
            this.player.velocityY = 15;
            this.player.onGround = false;
        }
        
        // Update player
        this.player.update(this.gravity, this.platforms);
        
        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.gravity, this.platforms);
        });
        
        // Update bubbles
        this.bubbles = this.bubbles.filter(bubble => {
            bubble.update(this.gravity);
            return bubble.alive;
        });
        
        // Collision detection
        this.checkCollisions();
        
        // UI update
        this.updateUI();
    }
    
    checkCollisions() {
        // Enemy-player collision
        this.enemies.forEach((enemy, idx) => {
            if (this.player.collidesWith(enemy)) {
                this.lives--;
                if (this.lives <= 0) {
                    this.gameActive = false;
                    document.getElementById('score').textContent += ' - GAME OVER';
                } else {
                    this.player.reset();
                }
            }
        });
        
        // Bubble-enemy collision
        this.bubbles.forEach(bubble => {
            this.enemies.forEach((enemy, idx) => {
                if (bubble.collidesWith(enemy)) {
                    bubble.alive = false;
                    this.scene.remove(bubble.mesh);
                    this.score += 100;
                    
                    // Respawn enemy after 4 seconds
                    setTimeout(() => {
                        if (this.gameActive) {
                            this.scene.remove(enemy.mesh);
                            this.enemies.splice(idx, 1);
                            const newEnemy = new Enemy(
                                (Math.random() - 0.5) * 600,
                                window.innerHeight / 2 - 50
                            );
                            this.enemies.push(newEnemy);
                            this.scene.add(newEnemy.mesh);
                        }
                    }, 2000);
                }
            });
        });
    }
    
    updateUI() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('lives').textContent = `Lives: ${this.lives}`;
        document.getElementById('level').textContent = `Level: ${this.level}`;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.gameActive) {
            this.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Player class
class Player {
    constructor(x, y) {
        const geometry = new THREE.BoxGeometry(28, 36, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, 0);
        
        this.width = 28;
        this.height = 36;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.initialX = x;
        this.initialY = y;
    }
    
    update(gravity, platforms) {
        // Apply gravity
        this.velocityY -= gravity;
        
        // Update position
        this.mesh.position.x += this.velocityX;
        this.mesh.position.y += this.velocityY;
        
        // Check platform collisions (AABB)
        this.onGround = false;
        platforms.forEach(platform => {
            if (this.isCollidingWithPlatform(platform)) {
                // Only land if falling down
                if (this.velocityY <= 0) {
                    this.mesh.position.y = platform.mesh.position.y + (platform.height / 2) + (this.height / 2);
                    this.velocityY = 0;
                    this.onGround = true;
                }
                // Bump head if jumping into platform
                else if (this.velocityY > 0) {
                    this.mesh.position.y = platform.mesh.position.y - (platform.height / 2) - (this.height / 2);
                    this.velocityY = -this.velocityY * 0.3;
                }
            }
        });
        
        // Wrap around screen horizontally
        if (this.mesh.position.x < -window.innerWidth / 2 - 50) {
            this.mesh.position.x = window.innerWidth / 2 + 50;
        }
        if (this.mesh.position.x > window.innerWidth / 2 + 50) {
            this.mesh.position.x = -window.innerWidth / 2 - 50;
        }
        
        // Reset if fell off bottom
        if (this.mesh.position.y < -window.innerHeight / 2 - 100) {
            this.reset();
        }
    }
    
    isCollidingWithPlatform(platform) {
        const dx = this.mesh.position.x - platform.mesh.position.x;
        const dy = this.mesh.position.y - platform.mesh.position.y;
        
        const overlapX = Math.abs(dx) < ((this.width + platform.width) / 2);
        const overlapY = Math.abs(dy) < ((this.height + platform.height) / 2);
        
        return overlapX && overlapY;
    }
    
    collidesWith(other) {
        const dx = Math.abs(this.mesh.position.x - other.mesh.position.x);
        const dy = Math.abs(this.mesh.position.y - other.mesh.position.y);
        
        const minDist = (this.width + other.width) / 2;
        const minDistY = (this.height + other.height) / 2;
        
        return dx < minDist && dy < minDistY;
    }
    
    reset() {
        this.mesh.position.set(this.initialX, this.initialY, 0);
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
    }
}

// Enemy class
class Enemy {
    constructor(x, y) {
        const geometry = new THREE.BoxGeometry(26, 34, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0066 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, 0);
        
        this.width = 26;
        this.height = 34;
        this.velocityX = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 2);
        this.velocityY = 0;
        this.onGround = false;
    }
    
    update(gravity, platforms) {
        // Apply gravity
        this.velocityY -= gravity;
        
        // Horizontal movement
        this.mesh.position.x += this.velocityX;
        this.mesh.position.y += this.velocityY;
        
        // Platform collision
        this.onGround = false;
        platforms.forEach(platform => {
            if (this.isCollidingWithPlatform(platform)) {
                if (this.velocityY <= 0) {
                    this.mesh.position.y = platform.mesh.position.y + (platform.height / 2) + (this.height / 2);
                    this.velocityY = 0;
                    this.onGround = true;
                }
            }
        });
        
        // Bounce off walls
        if (Math.abs(this.mesh.position.x) > window.innerWidth / 2 - 50) {
            this.velocityX *= -1;
        }
        
        // Random jumps
        if (this.onGround && Math.random() < 0.025) {
            this.velocityY = 10 + Math.random() * 4;
        }
    }
    
    isCollidingWithPlatform(platform) {
        const dx = this.mesh.position.x - platform.mesh.position.x;
        const dy = this.mesh.position.y - platform.mesh.position.y;
        
        const overlapX = Math.abs(dx) < ((this.width + platform.width) / 2);
        const overlapY = Math.abs(dy) < ((this.height + platform.height) / 2);
        
        return overlapX && overlapY;
    }
    
    collidesWith(other) {
        const dx = Math.abs(this.mesh.position.x - other.mesh.position.x);
        const dy = Math.abs(this.mesh.position.y - other.mesh.position.y);
        
        const minDist = (this.width + other.width) / 2;
        const minDistY = (this.height + other.height) / 2;
        
        return dx < minDist && dy < minDistY;
    }
}

// Bubble class (for future shooting mechanic)
class Bubble {
    constructor(x, y) {
        const geometry = new THREE.SphereGeometry(12, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: false });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, 0);
        
        this.width = 24;
        this.height = 24;
        this.velocityY = 8;
        this.alive = true;
        this.lifespan = 6000; // 6 seconds
        this.birthTime = Date.now();
    }
    
    update(gravity) {
        this.velocityY -= gravity;
        this.mesh.position.y += this.velocityY;
        
        // Fade out
        if (Date.now() - this.birthTime > this.lifespan) {
            this.alive = false;
        }
    }
    
    collidesWith(other) {
        const dx = Math.abs(this.mesh.position.x - other.mesh.position.x);
        const dy = Math.abs(this.mesh.position.y - other.mesh.position.y);
        
        const minDist = (this.width + other.width) / 2;
        const minDistY = (this.height + other.height) / 2;
        
        return dx < minDist && dy < minDistY;
    }
}

// Platform class
class Platform {
    constructor(x, y, width, height) {
        const geometry = new THREE.BoxGeometry(width, height, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, 0);
        
        this.width = width;
        this.height = height;
    }
}

// Start game
const game = new Game();
