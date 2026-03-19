/**
 * world.js - Map data, collision, and encounter logic.
 */

const _ = TILE_GRASS, G = TILE_TALL_GRASS, P = TILE_PATH, W = TILE_WALL;
const A = TILE_WATER, B = TILE_BUILDING, D = TILE_DOOR, H = TILE_HEAL;
const S = TILE_SHOP_DOOR;
const CV = TILE_CAVE_WALL, CD = TILE_CAVE_DOOR;

const GAME_MAP_DATA = [
[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W],
[W,_,B,B,B,_,_,_,_,_,P,P,_,_,_,_,_,_,_,B,B,B,B,B,_,_,G,G,G,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W],
[W,_,B,H,B,_,_,_,_,_,P,P,_,_,G,G,_,_,_,B,H,H,H,B,_,G,G,G,G,G,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W],
[W,_,B,D,B,_,_,_,_,_,P,P,_,G,G,G,G,_,_,B,H,H,H,B,_,G,G,G,G,G,_,_,_,_,_,_,A,A,A,A,_,_,_,_,_,_,_,_,_,W],
[W,_,_,P,_,_,_,_,_,_,P,P,_,G,G,G,G,_,_,B,B,D,B,B,_,_,G,G,G,_,_,_,_,_,_,A,A,A,A,A,A,_,_,_,_,_,_,_,_,W],
[W,_,_,P,P,P,P,P,P,P,P,P,_,_,G,G,_,_,_,_,_,P,_,_,_,_,_,_,_,_,_,_,_,_,A,A,A,A,A,A,A,A,_,_,_,_,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,P,_,_,_,_,_,_,_,_,_,_,_,_,A,A,A,A,A,A,A,A,_,_,_,_,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,P,G,G,_,_,_,_,_,_,_,_,_,_,_,A,A,A,A,A,A,_,_,_,_,_,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,A,A,A,A,_,_,_,_,_,_,_,_,_,W],
[W,_,_,_,G,G,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,G,G,G,_,_,_,_,_,_,_,_,P,_,_,_,_,_,_,_,_,_,_,G,G,G,_,_,_,W],
[W,_,_,G,G,G,G,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,G,_,_,_,_,_,_,_,_,_,P,_,_,_,_,_,_,_,_,_,G,G,G,G,G,_,_,W],
[W,_,_,G,G,G,G,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,_,_,_,_,_,_,G,G,G,G,G,_,_,W],
[W,_,_,G,G,G,G,G,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,_,_,_,_,_,G,G,G,G,G,G,_,_,W],
[W,_,_,_,G,G,G,_,_,_,P,P,_,_,_,A,A,A,A,_,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,_,_,_,_,_,_,G,G,G,G,_,_,_,W],
[W,_,_,_,_,G,_,_,_,_,P,P,_,_,A,A,A,A,A,A,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,_,_,_,_,_,_,_,G,G,_,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,A,A,A,A,A,A,A,A,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,A,A,A,A,A,A,A,A,_,_,_,_,_,_,_,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,A,A,A,A,A,A,A,A,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,_,A,A,A,A,A,A,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,_,_,A,A,A,A,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,W],
[W,_,_,G,G,_,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,_,G,G,G,G,_,_,_,_,_,_,_,_,_,G,G,G,_,_,_,_,_,P,_,_,_,W],
[W,_,G,G,G,G,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_,_,_,G,G,G,G,G,_,_,_,_,P,_,_,_,W],
[W,_,G,G,G,G,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_,_,G,G,G,G,G,G,G,_,_,_,P,_,_,_,W],
[W,_,G,G,G,G,G,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,G,G,G,G,P,P,P,P,P,P,P,P,G,G,G,G,P,P,P,P,P,P,_,_,_,W],
[W,_,_,G,G,G,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_,_,G,G,G,G,G,G,G,_,_,_,P,_,_,_,W],
[W,_,_,_,G,_,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_,_,_,G,G,G,G,G,_,_,_,_,P,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,_,G,G,G,G,_,_,_,_,_,_,_,_,_,G,G,G,_,_,_,_,_,P,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,G,G,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,W],
[W,_,_,B,B,B,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,_,_,P,_,_,_,W],
[W,_,_,B,B,B,_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_,G,G,G,G,_,_,_,_,_,_,_,_,_,_,B,H,B,_,_,P,_,_,_,W],
[W,_,_,B,S,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_,_,_,_,_,B,D,B,_,_,P,_,_,_,W],
[W,_,_,_,P,P,P,P,P,P,_,_,_,_,_,_,_,_,_,_,P,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_,_,_,_,_,_,P,P,P,P,P,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,P,P,P,P,P,G,G,G,G,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,G,G,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W],
[W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W],
[W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
];

const ENCOUNTER_TABLE = [
    { speciesId: 3, minLv: 3, maxLv: 7, weight: 15 },
    { speciesId: 5, minLv: 3, maxLv: 6, weight: 14 },
    { speciesId: 4, minLv: 4, maxLv: 8, weight: 8 },
    { speciesId: 1, minLv: 5, maxLv: 8, weight: 4 },
    { speciesId: 2, minLv: 5, maxLv: 8, weight: 4 },
    { speciesId: 8, minLv: 3, maxLv: 7, weight: 7 },
    { speciesId: 9, minLv: 4, maxLv: 7, weight: 5 },
    { speciesId: 10, minLv: 4, maxLv: 8, weight: 4 },
    { speciesId: 6, minLv: 5, maxLv: 9, weight: 3 },
    { speciesId: 7, minLv: 6, maxLv: 10, weight: 2 },
    // New monsters
    { speciesId: 13, minLv: 3, maxLv: 7, weight: 5 },
    { speciesId: 23, minLv: 3, maxLv: 6, weight: 5 },
    { speciesId: 11, minLv: 5, maxLv: 9, weight: 3 },
    { speciesId: 12, minLv: 4, maxLv: 8, weight: 3 },
    { speciesId: 14, minLv: 5, maxLv: 9, weight: 2 },
    { speciesId: 15, minLv: 4, maxLv: 8, weight: 3 },
    { speciesId: 16, minLv: 6, maxLv: 10, weight: 2 },
    { speciesId: 17, minLv: 5, maxLv: 9, weight: 2 },
    { speciesId: 18, minLv: 4, maxLv: 8, weight: 2 },
    { speciesId: 19, minLv: 3, maxLv: 7, weight: 3 },
    { speciesId: 20, minLv: 5, maxLv: 9, weight: 2 },
    { speciesId: 21, minLv: 6, maxLv: 10, weight: 1 },
    { speciesId: 22, minLv: 5, maxLv: 9, weight: 2 },
    { speciesId: 24, minLv: 6, maxLv: 10, weight: 1 },
    { speciesId: 25, minLv: 4, maxLv: 8, weight: 2 },
    { speciesId: 26, minLv: 3, maxLv: 7, weight: 3 },
    { speciesId: 27, minLv: 4, maxLv: 8, weight: 2 },
    { speciesId: 28, minLv: 5, maxLv: 9, weight: 2 },
    { speciesId: 29, minLv: 6, maxLv: 10, weight: 1 },
    { speciesId: 30, minLv: 7, maxLv: 11, weight: 1 },
];

// Legendary encounters - only in specific map areas with very low chance
const LEGENDARY_ZONES = [
    { speciesId: 41, level: 25, col: 37, row: 33, radius: 4 },  // Drakoflame - bottom right grass
    { speciesId: 42, level: 25, col: 27, row: 4,  radius: 3 },  // Aquarion - top right grass near water
    { speciesId: 43, level: 25, col: 4,  row: 22, radius: 3 },  // Sylvaron - left side grass
];

// Cave boss configuration
const CAVE_CONFIG = {
    // Cave entrance location (bottom-right empty area)
    col: 44, row: 46,
    // Tiles to place when cave spawns: [row, col, tileId]
    tiles: [
        [45, 43, CV], [45, 44, CV], [45, 45, CV],
        [46, 43, CV], [46, 44, CD], [46, 45, CV],
    ],
    bossSpeciesId: 44,
    bossLevel: 20,
};

class GameMap {
    constructor() {
        this.grid = GAME_MAP_DATA.map(row => [...row]); // mutable copy
        this.rows = this.grid.length;
        this.cols = this.grid[0].length;
        this.caveSpawned = false;
    }

    spawnCave() {
        if (this.caveSpawned) return;
        for (const [r, c, tile] of CAVE_CONFIG.tiles) {
            this.grid[r][c] = tile;
        }
        this.caveSpawned = true;
    }

    tileAt(col, row) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows)
            return this.grid[row][col];
        return TILE_WALL;
    }

    tileNameAt(col, row) {
        return TILE_NAMES[this.tileAt(col, row)] || 'unknown';
    }

    isPassable(col, row) {
        return !IMPASSABLE_TILES.has(this.tileAt(col, row));
    }

    checkEncounter(col, row) {
        if (this.tileAt(col, row) !== TILE_TALL_GRASS) return null;
        if (Math.random() > ENCOUNTER_CHANCE) return null;

        // Check for legendary encounter (5% chance when in zone)
        for (const zone of LEGENDARY_ZONES) {
            const dx = col - zone.col;
            const dy = row - zone.row;
            if (Math.abs(dx) <= zone.radius && Math.abs(dy) <= zone.radius) {
                if (Math.random() < 0.05) {
                    return createMonster(zone.speciesId, zone.level);
                }
            }
        }

        return this._generateWild();
    }

    _generateWild() {
        const totalWeight = ENCOUNTER_TABLE.reduce((s, e) => s + e.weight, 0);
        let roll = Math.random() * totalWeight;
        for (const entry of ENCOUNTER_TABLE) {
            roll -= entry.weight;
            if (roll <= 0) {
                const lv = entry.minLv + Math.floor(Math.random() * (entry.maxLv - entry.minLv + 1));
                return createMonster(entry.speciesId, lv);
            }
        }
        const e = ENCOUNTER_TABLE[0];
        return createMonster(e.speciesId, e.minLv);
    }
}
