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
        this.gravity = 0.5;
        this.friction = 0.95;
        
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
        this.player = new Player(0, -window.innerHeight / 2 + 100);
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
            { x: 0, y: 0, width: 400, height: 20 },
            { x: -150, y: 150, width: 300, height: 20 },
            { x: 150, y: 150, width: 300, height: 20 },
            { x: -150, y: 300, width: 300, height: 20 },
            { x: 150, y: 300, width: 300, height: 20 },
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
            const y = window.innerHeight / 2 - 100;
            const enemy = new Enemy(x, y, this.platforms);
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
            this.player.velocityX = -5;
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            this.player.velocityX = 5;
        } else {
            this.player.velocityX *= this.friction;
        }
        
        if ((this.keys['ArrowUp'] || this.keys['w']) && this.player.onGround) {
            this.player.velocityY = 12;
            this.player.onGround = false;
        }
        
        // Update player
        this.player.update(this.gravity, this.platforms);
        
        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.gravity, this.platforms, this.player);
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
                    enemy.trapped = true;
                    this.score += 100;
                    
                    // Pop bubble after delay
                    setTimeout(() => {
                        const newEnemy = new Enemy(enemy.mesh.position.x, enemy.mesh.position.y, this.platforms);
                        this.enemies.splice(idx, 1, newEnemy);
                        this.scene.remove(enemy.mesh);
                        this.scene.add(newEnemy.mesh);
                    }, 3000);
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
        const geometry = new THREE.BoxGeometry(30, 40, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, 0);
        
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.initialX = x;
        this.initialY = y;
    }
    
    update(gravity, platforms) {
        this.velocityY -= gravity;
        
        this.mesh.position.x += this.velocityX;
        this.mesh.position.y += this.velocityY;
        
        // Platform collision
        this.onGround = false;
        platforms.forEach(platform => {
            if (this.collidesWith(platform) && this.velocityY <= 0) {
                this.mesh.position.y = platform.mesh.position.y + platform.height / 2 + 20;
                this.velocityY = 0;
                this.onGround = true;
            }
        });
        
        // Boundary
        const margin = 200;
        if (this.mesh.position.x < -margin) this.mesh.position.x = margin;
        if (this.mesh.position.x > margin) this.mesh.position.x = -margin;
    }
    
    collidesWith(other) {
        const dx = Math.abs(this.mesh.position.x - other.mesh.position.x);
        const dy = Math.abs(this.mesh.position.y - other.mesh.position.y);
        
        return dx < 35 && dy < 40;
    }
    
    reset() {
        this.mesh.position.set(this.initialX, this.initialY, 0);
        this.velocityX = 0;
        this.velocityY = 0;
    }
}

// Enemy class
class Enemy {
    constructor(x, y, platforms) {
        const geometry = new THREE.BoxGeometry(25, 35, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0066 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, 0);
        
        this.velocityX = Math.random() > 0.5 ? 3 : -3;
        this.velocityY = 0;
        this.onGround = false;
        this.trapped = false;
        this.platforms = platforms;
    }
    
    update(gravity, platforms, player) {
        if (this.trapped) return;
        
        this.velocityY -= gravity;
        this.mesh.position.x += this.velocityX;
        this.mesh.position.y += this.velocityY;
        
        // Platform collision
        this.onGround = false;
        platforms.forEach(platform => {
            if (this.collidesWith(platform) && this.velocityY <= 0) {
                this.mesh.position.y = platform.mesh.position.y + platform.height / 2 + 18;
                this.velocityY = 0;
                this.onGround = true;
            }
        });
        
        // Simple AI - bounce at edges
        if (Math.abs(this.mesh.position.x) > 250) {
            this.velocityX *= -1;
        }
        
        // Random jump
        if (this.onGround && Math.random() < 0.02) {
            this.velocityY = 8;
        }
    }
    
    collidesWith(other) {
        const dx = Math.abs(this.mesh.position.x - other.mesh.position.x);
        const dy = Math.abs(this.mesh.position.y - other.mesh.position.y);
        
        if (other.width) {
            return dx < (other.width / 2 + 15) && dy < 30;
        }
        return dx < 30 && dy < 40;
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
