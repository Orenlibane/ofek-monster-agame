/**
 * animations.js - Particle system, floating text, screen shake, easing functions.
 */

// ===================================================================
// Easing helpers
// ===================================================================

function easeOutQuad(t) { return t * (2 - t); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutSine(t) { return 0.5 * (1 - Math.cos(Math.PI * t)); }

// ===================================================================
// Particle
// ===================================================================

class Particle {
    constructor(x, y, vx, vy, life, color, size, gravity) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.gravity = gravity || 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
    }

    get alive() { return this.life > 0; }
    get alpha() { return Math.max(0, this.life / this.maxLife); }
}

// ===================================================================
// ParticleSystem
// ===================================================================

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, preset) {
        const p = PARTICLE_PRESETS[preset];
        if (!p) return;
        for (let i = 0; i < p.count; i++) {
            const color = p.colors[Math.floor(Math.random() * p.colors.length)];
            const speed = p.speedRange[0] + Math.random() * (p.speedRange[1] - p.speedRange[0]);
            const life = p.lifeRange[0] + Math.floor(Math.random() * (p.lifeRange[1] - p.lifeRange[0]));
            const size = p.sizeRange[0] + Math.random() * (p.sizeRange[1] - p.sizeRange[0]);
            const angle = p.direction + (Math.random() - 0.5) * p.spread;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.particles.push(new Particle(x, y, vx, vy, life, color, size, p.gravity));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (!this.particles[i].alive) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    get active() { return this.particles.length > 0; }
}

// ===================================================================
// Particle presets by type
// ===================================================================

const PARTICLE_PRESETS = {
    FIRE: {
        count: 18,
        colors: ['#ff6622', '#ff9933', '#ffcc33', '#ff4400', '#ffaa00'],
        speedRange: [1.5, 4],
        lifeRange: [20, 45],
        sizeRange: [2, 5],
        gravity: -0.08,
        spread: Math.PI * 0.8,
        direction: -Math.PI / 2,
    },
    WATER: {
        count: 18,
        colors: ['#3388ff', '#55aaff', '#88ccff', '#2266dd', '#44bbff'],
        speedRange: [2, 4.5],
        lifeRange: [18, 40],
        sizeRange: [2, 5],
        gravity: 0.06,
        spread: Math.PI * 0.6,
        direction: -Math.PI / 3,
    },
    GRASS: {
        count: 14,
        colors: ['#44cc44', '#66ee44', '#88ff66', '#22aa22', '#55dd33'],
        speedRange: [1, 3],
        lifeRange: [25, 50],
        sizeRange: [2, 4],
        gravity: 0.03,
        spread: Math.PI * 1.2,
        direction: -Math.PI / 2,
    },
    ELECTRIC: {
        count: 20,
        colors: ['#ffee33', '#ffff88', '#ffdd00', '#eecc00', '#ffffff'],
        speedRange: [3, 6],
        lifeRange: [10, 25],
        sizeRange: [1, 3],
        gravity: 0,
        spread: Math.PI * 2,
        direction: 0,
    },
    ICE: {
        count: 16,
        colors: ['#88ddff', '#aaeeff', '#ccffff', '#66ccee', '#ffffff'],
        speedRange: [1, 3.5],
        lifeRange: [25, 50],
        sizeRange: [2, 5],
        gravity: 0.04,
        spread: Math.PI * 0.9,
        direction: -Math.PI / 2,
    },
    DARK: {
        count: 16,
        colors: ['#6633aa', '#8844cc', '#442266', '#553388', '#331155'],
        speedRange: [1.5, 3.5],
        lifeRange: [20, 45],
        sizeRange: [2, 5],
        gravity: -0.02,
        spread: Math.PI * 1.4,
        direction: -Math.PI / 2,
    },
    NORMAL: {
        count: 10,
        colors: ['#ccccaa', '#ddddbb', '#bbbb99', '#eeeecc'],
        speedRange: [1.5, 3],
        lifeRange: [15, 30],
        sizeRange: [2, 4],
        gravity: 0.02,
        spread: Math.PI * 1.0,
        direction: -Math.PI / 2,
    },
    CATCH_SPARKLE: {
        count: 24,
        colors: ['#ffee55', '#ffffff', '#ffcc33', '#ff88cc', '#88eeff'],
        speedRange: [1.5, 4],
        lifeRange: [30, 60],
        sizeRange: [2, 5],
        gravity: 0.02,
        spread: Math.PI * 2,
        direction: 0,
    },
};

// ===================================================================
// FloatingText
// ===================================================================

class FloatingText {
    constructor(x, y, text, color, life) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = life || 50;
        this.maxLife = this.life;
        this.vy = -1.5;
    }

    update() {
        this.y += this.vy;
        this.vy *= 0.97;
        this.life--;
    }

    get alive() { return this.life > 0; }
    get alpha() { return Math.max(0, this.life / this.maxLife); }

    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        const scale = 1 + 0.3 * (1 - this.life / this.maxLife);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);
        ctx.fillStyle = this.color;
        ctx.font = 'bold 18px ' + FONT_MAIN;
        const w = ctx.measureText(this.text).width;
        // Outline
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, -w / 2, 0);
        ctx.fillText(this.text, -w / 2, 0);
        ctx.restore();
        ctx.globalAlpha = 1.0;
    }
}

// ===================================================================
// ScreenShake
// ===================================================================

class ScreenShake {
    constructor() {
        this.intensity = 0;
        this.duration = 0;
        this.maxDuration = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    trigger(intensity, duration) {
        this.intensity = intensity;
        this.duration = duration;
        this.maxDuration = duration;
    }

    update() {
        if (this.duration > 0) {
            const progress = this.duration / this.maxDuration;
            const currentIntensity = this.intensity * progress;
            this.offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
            this.offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
            this.duration--;
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
        }
    }

    get active() { return this.duration > 0; }
}
