/**
 * player.js - Player, Inventory, and Storage systems.
 */

class Inventory {
    constructor() { this.items = {}; }
    add(name, qty = 1) { this.items[name] = (this.items[name] || 0) + qty; }
    remove(name, qty = 1) {
        if ((this.items[name] || 0) >= qty) {
            this.items[name] -= qty;
            if (this.items[name] <= 0) delete this.items[name];
            return true;
        }
        return false;
    }
    count(name) { return this.items[name] || 0; }
}

class Storage {
    constructor() { this.monsters = []; }
    deposit(monster) { this.monsters.push(monster); }
    withdraw(index) {
        if (index >= 0 && index < this.monsters.length)
            return this.monsters.splice(index, 1)[0];
        return null;
    }
}

class Player {
    constructor(name, col, row) {
        this.name = name;
        this.col = col;
        this.row = row;
        this.party = [];
        this.inventory = new Inventory();
        this.discovered = new Set();  // species IDs seen in battle
        this.caught = new Set();      // species IDs caught
        this.coins = 0;
        this.defeatedTrainers = new Set(); // trainer IDs defeated
        this.facing = 'down';
        this._moveCooldown = 0;
        this.MOVE_DELAY = 8;

        // Smooth movement
        this._visualX = col * TILE_SIZE;
        this._visualY = row * TILE_SIZE;
        this._walkFrame = 0;
        this._walkTimer = 0;
        this._isMoving = false;
    }

    addToParty(monster) {
        if (this.party.length < MAX_PARTY_SIZE) {
            this.party.push(monster);
            this.registerCaught(monster.speciesId);
            return true;
        }
        return false;
    }

    registerDiscovered(speciesId) {
        this.discovered.add(speciesId);
    }

    registerCaught(speciesId) {
        this.discovered.add(speciesId);
        this.caught.add(speciesId);
    }

    hasUsableMonster() { return this.party.some(m => !m.isFainted); }

    firstUsableMonster() {
        return this.party.find(m => !m.isFainted) || null;
    }

    healAll() { for (const m of this.party) m.fullHeal(); }

    tryMove(dx, dy, gameMap) {
        if (this._moveCooldown > 0) return '';
        const newCol = this.col + dx;
        const newRow = this.row + dy;

        if (dx === 1) this.facing = 'right';
        else if (dx === -1) this.facing = 'left';
        else if (dy === 1) this.facing = 'down';
        else if (dy === -1) this.facing = 'up';

        if (gameMap.isPassable(newCol, newRow)) {
            this.col = newCol;
            this.row = newRow;
            this._moveCooldown = this.MOVE_DELAY;
            return gameMap.tileNameAt(newCol, newRow);
        }
        return '';
    }

    update() {
        if (this._moveCooldown > 0) this._moveCooldown--;

        // Smooth interpolation toward target position
        const targetX = this.col * TILE_SIZE;
        const targetY = this.row * TILE_SIZE;
        const lerpSpeed = 0.25;
        this._visualX += (targetX - this._visualX) * lerpSpeed;
        this._visualY += (targetY - this._visualY) * lerpSpeed;
        // Snap if close
        if (Math.abs(this._visualX - targetX) < 0.5) this._visualX = targetX;
        if (Math.abs(this._visualY - targetY) < 0.5) this._visualY = targetY;

        this._isMoving = (this._visualX !== targetX || this._visualY !== targetY);

        // Walk animation timer
        if (this._isMoving) {
            this._walkTimer++;
            if (this._walkTimer >= 8) {
                this._walkTimer = 0;
                this._walkFrame = (this._walkFrame + 1) % 2;
            }
        } else {
            this._walkTimer = 0;
            this._walkFrame = 0;
        }
    }

    get pixelX() { return this._visualX; }
    get pixelY() { return this._visualY; }
}
