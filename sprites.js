/**
 * sprites.js - Procedural pixel-art sprite generator for Canvas.
 *
 * Each sprite is drawn once to an offscreen canvas and cached.
 * Pixel grids are 16x16 arrays of color strings (or null for transparent).
 */

const T = null; // Transparent

// ===================================================================
// Core helper: turn a pixel grid into an offscreen canvas
// ===================================================================

function gridToCanvas(grid, scale) {
    scale = scale || 1;
    const h = grid.length;
    const w = grid[0] ? grid[0].length : 0;
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            const color = grid[r][c];
            if (color !== null) {
                ctx.fillStyle = color;
                ctx.fillRect(c * scale, r * scale, scale, scale);
            }
        }
    }
    return canvas;
}

// ===================================================================
// Color palettes
// ===================================================================

// Hero
const H_SKIN  = 'rgb(240,200,160)';
const H_HAIR  = 'rgb(60,40,30)';
const H_SHIRT = 'rgb(220,60,60)';
const H_PANTS = 'rgb(50,60,140)';
const H_SHOE  = 'rgb(40,40,40)';
const H_EYE   = 'rgb(30,30,30)';
const H_BELT  = 'rgb(80,60,40)';

// Blazelet (fire lizard)
const BZ_BODY   = 'rgb(240,100,50)';
const BZ_BELLY  = 'rgb(255,200,100)';
const BZ_EYE    = 'rgb(30,30,30)';
const BZ_FLAME  = 'rgb(255,220,50)';
const BZ_FLAME2 = 'rgb(255,150,30)';
const BZ_DARK   = 'rgb(180,60,30)';

// Aquaphin (water dolphin)
const AQ_BODY  = 'rgb(60,150,240)';
const AQ_BELLY = 'rgb(180,220,255)';
const AQ_EYE   = 'rgb(30,30,30)';
const AQ_FIN   = 'rgb(40,110,200)';
const AQ_DARK  = 'rgb(30,90,170)';

// Thornix (grass thorny creature)
const TH_BODY  = 'rgb(60,170,60)';
const TH_DARK  = 'rgb(40,120,40)';
const TH_LEAF  = 'rgb(100,210,80)';
const TH_EYE   = 'rgb(30,30,30)';
const TH_THORN = 'rgb(140,100,50)';
const TH_BELLY = 'rgb(150,220,130)';

// Zappfly (electric insect)
const ZP_BODY   = 'rgb(250,220,50)';
const ZP_WING   = 'rgb(255,255,200)';
const ZP_EYE    = 'rgb(30,30,30)';
const ZP_DARK   = 'rgb(200,170,30)';
const ZP_BOLT   = 'rgb(255,255,100)';
const ZP_STRIPE = 'rgb(80,60,20)';

// Barkbite (normal dog/wolf)
const BB_BODY  = 'rgb(180,140,100)';
const BB_DARK  = 'rgb(130,100,70)';
const BB_BELLY = 'rgb(220,200,170)';
const BB_EYE   = 'rgb(30,30,30)';
const BB_NOSE  = 'rgb(40,30,30)';
const BB_EAR   = 'rgb(140,100,70)';

// ===================================================================
// Hero sprites (16x16, scale=3 => 48x48)
// ===================================================================

function createHeroSprites(scale) {
    scale = scale || 3;
    const sprites = {};

    // FACING DOWN
    const down = [
        [T,T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T],
        [T,T,T,T,H_SKIN,H_EYE,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_EYE,H_SKIN,T,T,T,T],
        [T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T],
        [T,T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T],
        [T,T,T,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,T,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T],
        [T,T,H_SKIN,T,T,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,T,T,H_SKIN,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,T,T,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,T,T,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,T,H_SHOE,H_SHOE,T,T,H_SHOE,H_SHOE,T,T,T,T,T],
        [T,T,T,T,T,H_SHOE,H_SHOE,T,T,H_SHOE,H_SHOE,T,T,T,T,T],
    ];
    sprites.down = gridToCanvas(down, scale);

    // FACING UP
    const up = [
        [T,T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T],
        [T,T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T],
        [T,T,T,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,T,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T],
        [T,T,H_SKIN,T,T,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,T,T,H_SKIN,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,T,T,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,T,T,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,T,H_SHOE,H_SHOE,T,T,H_SHOE,H_SHOE,T,T,T,T,T],
        [T,T,T,T,T,H_SHOE,H_SHOE,T,T,H_SHOE,H_SHOE,T,T,T,T,T],
    ];
    sprites.up = gridToCanvas(up, scale);

    // FACING LEFT
    const left = [
        [T,T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T,T],
        [T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T,T],
        [T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T],
        [T,T,T,H_SKIN,H_EYE,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T,T],
        [T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T,T],
        [T,T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T,T,T],
        [T,T,T,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,T,T,T,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T,T,T],
        [T,T,T,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T,T,T],
        [T,T,T,T,T,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,T,T,T,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,T,T,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,T,T,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,T,H_SHOE,H_SHOE,T,T,H_SHOE,H_SHOE,T,T,T,T,T],
        [T,T,T,T,T,H_SHOE,H_SHOE,T,T,H_SHOE,H_SHOE,T,T,T,T,T],
    ];
    sprites.left = gridToCanvas(left, scale);

    // FACING RIGHT (mirror of left)
    const right = left.map(row => [...row].reverse());
    sprites.right = gridToCanvas(right, scale);

    return sprites;
}

// ===================================================================
// Monster battle sprites (16x16 grids, scale=5 => 80x80)
// ===================================================================

function createBlazeleteSprite(scale) {
    scale = scale || 4;
    const B=BZ_BODY, L=BZ_BELLY, E=BZ_EYE, F=BZ_FLAME, G=BZ_FLAME2, D=BZ_DARK;
    const grid = [
        [T,T,T,T,T,T,T,T,T,T,T,T,F,G,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,F,G,F,T,T],
        [T,T,T,T,T,B,B,B,B,T,T,T,F,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,T,T,T,T,T,T],
        [T,T,T,B,B,E,B,B,E,B,B,T,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,B,B,B,L,L,B,B,B,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,T,T,T,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,B,B,B,L,L,L,L,L,L,B,B,B,T,T,T],
        [T,B,D,B,L,L,L,L,L,L,B,D,B,T,T,T],
        [T,T,B,B,L,L,L,L,L,L,B,B,T,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,T,T,T,T,B,B,T,T,T,T,T],
        [T,T,T,D,B,T,T,T,T,D,B,T,T,T,T,T],
        [T,T,T,D,D,T,T,T,T,D,D,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createAquaphinSprite(scale) {
    scale = scale || 4;
    const B=AQ_BODY, L=AQ_BELLY, E=AQ_EYE, F=AQ_FIN, D=AQ_DARK;
    const grid = [
        [T,T,T,T,T,T,T,F,F,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,F,F,F,F,T,T,T,T,T,T],
        [T,T,T,T,T,F,B,B,B,B,F,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,B,E,B,B,E,B,B,B,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,B,B,B,B,B,L,L,B,B,B,B,B,T,T],
        [T,B,B,B,B,L,L,L,L,L,L,B,B,B,B,T],
        [T,B,B,L,L,L,L,L,L,L,L,L,L,B,B,T],
        [T,T,B,B,L,L,L,L,L,L,L,L,B,B,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [F,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [F,F,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,F,F,T,T,B,B,T,T,B,B,T,T,T,T,T],
        [T,T,F,T,T,D,D,T,T,D,D,T,T,T,T,T],
        [T,T,T,T,T,D,D,T,T,D,D,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createThornixSprite(scale) {
    scale = scale || 4;
    const B=TH_BODY, D=TH_DARK, L=TH_LEAF, E=TH_EYE, R=TH_THORN, V=TH_BELLY;
    const grid = [
        [T,T,T,T,T,L,L,T,T,L,L,T,T,T,T,T],
        [T,T,T,T,L,L,R,L,L,R,L,L,T,T,T,T],
        [T,T,T,L,L,L,L,L,L,L,L,L,L,T,T,T],
        [T,T,T,L,R,L,L,L,L,L,L,R,L,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,B,V,V,V,B,B,B,B,T,T,T],
        [T,T,B,B,B,V,V,V,V,V,B,B,B,B,T,T],
        [T,T,B,B,B,V,V,V,V,V,B,B,B,B,T,T],
        [T,T,B,D,B,V,V,V,V,V,B,D,B,B,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,B,D,B,T,T,B,D,B,T,T,T,T],
        [T,T,T,T,D,D,B,T,T,D,D,B,T,T,T,T],
        [T,T,T,T,D,D,T,T,T,D,D,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createZappflySprite(scale) {
    scale = scale || 4;
    const B=ZP_BODY, W=ZP_WING, E=ZP_EYE, D=ZP_DARK, S=ZP_STRIPE, K=ZP_BOLT;
    const grid = [
        [T,T,T,W,W,T,T,T,T,T,T,W,W,T,T,T],
        [T,T,W,W,W,W,T,T,T,T,W,W,W,W,T,T],
        [T,T,W,W,W,W,T,T,T,T,W,W,W,W,T,T],
        [T,W,W,W,W,W,T,T,T,T,W,W,W,W,W,T],
        [T,W,W,W,W,T,T,B,B,T,T,W,W,W,W,T],
        [T,T,W,W,T,T,B,B,B,B,T,T,W,W,T,T],
        [T,T,T,T,T,B,B,E,E,B,B,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,T,B,S,B,B,B,B,S,B,T,T,T,T],
        [T,T,T,T,B,B,S,B,B,S,B,B,T,T,T,T],
        [T,T,T,T,T,B,B,S,S,B,B,T,T,T,T,T],
        [T,T,T,T,T,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,T,T,T,B,B,B,B,T,T,T,T,T,T],
        [T,T,T,T,K,T,T,B,B,T,T,K,T,T,T,T],
        [T,T,T,K,K,T,T,T,T,T,T,K,K,T,T,T],
        [T,T,T,T,K,T,T,T,T,T,T,K,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createBarkbiteSprite(scale) {
    scale = scale || 4;
    const B=BB_BODY, D=BB_DARK, L=BB_BELLY, E=BB_EYE, N=BB_NOSE, R=BB_EAR;
    const grid = [
        [T,T,T,R,R,T,T,T,T,T,T,R,R,T,T,T],
        [T,T,T,R,R,R,T,T,T,T,R,R,R,T,T,T],
        [T,T,T,R,B,B,B,B,B,B,B,B,R,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,N,N,B,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,B,B,B,L,L,L,L,L,L,L,L,B,B,B,T],
        [T,B,D,B,L,L,L,L,L,L,L,L,B,D,B,T],
        [T,T,B,B,L,L,L,L,L,L,L,L,B,B,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,T,B,B,B,T,T,T,T,B,B,B,T,T,T],
        [T,T,T,B,D,B,T,T,T,T,B,D,B,T,T,T],
        [T,T,T,D,D,T,T,T,T,T,T,D,D,T,T,T],
        [T,T,T,T,T,T,T,D,D,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// ===================================================================
// New monster sprites
// ===================================================================

// Karchon (Ice turtle) - ID 6
const IC_BODY   = 'rgb(100,190,220)';
const IC_SHELL  = 'rgb(140,220,240)';
const IC_DARK   = 'rgb(60,140,180)';
const IC_EYE    = 'rgb(30,30,30)';
const IC_BELLY  = 'rgb(200,240,255)';
const IC_FROST  = 'rgb(220,245,255)';

function createKarchonSprite(scale) {
    scale = scale || 4;
    const B=IC_BODY, S=IC_SHELL, D=IC_DARK, E=IC_EYE, L=IC_BELLY, F=IC_FROST;
    const grid = [
        [T,T,T,T,T,T,F,F,F,F,T,T,T,T,T,T],
        [T,T,T,T,T,F,S,S,S,S,F,T,T,T,T,T],
        [T,T,T,T,F,S,S,S,S,S,S,F,T,T,T,T],
        [T,T,T,F,S,S,D,S,S,D,S,S,F,T,T,T],
        [T,T,T,S,S,D,S,D,D,S,D,S,S,T,T,T],
        [T,T,T,S,S,S,S,S,S,S,S,S,S,T,T,T],
        [T,T,B,B,S,S,S,S,S,S,S,S,B,B,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,B,B,E,B,B,B,B,B,B,E,B,B,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,T,B,B,B,L,L,L,L,B,B,B,T,T,T],
        [T,T,T,B,B,L,L,L,L,L,L,B,B,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,D,D,B,T,T,T,T,B,D,D,T,T,T],
        [T,T,T,D,D,T,T,T,T,T,T,D,D,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// Tzlilit (Shadow ghost) - ID 7
const SH_BODY  = 'rgb(90,55,130)';
const SH_DARK  = 'rgb(55,30,85)';
const SH_GLOW  = 'rgb(160,100,200)';
const SH_EYE   = 'rgb(255,80,80)';
const SH_INNER = 'rgb(120,70,170)';

function createTzlilitSprite(scale) {
    scale = scale || 4;
    const B=SH_BODY, D=SH_DARK, G=SH_GLOW, E=SH_EYE, I=SH_INNER;
    const grid = [
        [T,T,T,T,T,T,G,G,G,G,T,T,T,T,T,T],
        [T,T,T,T,T,G,B,B,B,B,G,T,T,T,T,T],
        [T,T,T,T,G,B,B,B,B,B,B,G,T,T,T,T],
        [T,T,T,G,B,B,B,B,B,B,B,B,G,T,T,T],
        [T,T,T,B,B,E,E,B,B,E,E,B,B,T,T,T],
        [T,T,T,B,B,E,E,B,B,E,E,B,B,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,B,B,B,B,I,I,I,I,B,B,B,B,T,T],
        [T,T,B,B,B,I,I,I,I,I,I,B,B,B,T,T],
        [T,T,B,B,B,I,I,I,I,I,I,B,B,B,T,T],
        [T,T,T,B,B,B,I,I,I,I,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,D,B,B,B,B,B,B,D,T,T,T,T],
        [T,T,T,D,T,D,B,B,B,B,D,T,D,T,T,T],
        [T,T,D,T,T,T,D,B,B,D,T,T,T,D,T,T],
        [T,T,T,T,T,T,T,D,D,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// Shalgil (Ice hedgehog) - ID 8
const SG_BODY   = 'rgb(170,215,235)';
const SG_DARK   = 'rgb(100,160,190)';
const SG_SPIKE  = 'rgb(220,245,255)';
const SG_EYE    = 'rgb(30,30,30)';
const SG_BELLY  = 'rgb(230,245,255)';
const SG_NOSE   = 'rgb(60,60,80)';

function createShalgilSprite(scale) {
    scale = scale || 4;
    const B=SG_BODY, D=SG_DARK, S=SG_SPIKE, E=SG_EYE, L=SG_BELLY, N=SG_NOSE;
    const grid = [
        [T,T,T,T,S,T,S,T,T,S,T,S,T,T,T,T],
        [T,T,T,S,S,S,S,S,S,S,S,S,S,T,T,T],
        [T,T,S,S,B,B,S,B,B,S,B,B,S,S,T,T],
        [T,T,S,B,B,B,B,B,B,B,B,B,B,S,T,T],
        [T,T,T,B,B,E,B,B,B,B,E,B,B,T,T,T],
        [T,T,T,B,B,B,B,N,N,B,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,B,B,B,L,L,L,L,L,L,L,L,B,B,B,T],
        [T,B,D,B,L,L,L,L,L,L,L,L,B,D,B,T],
        [T,T,B,B,L,L,L,L,L,L,L,L,B,B,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,B,D,T,T,T,T,D,B,T,T,T,T],
        [T,T,T,T,D,D,T,T,T,T,D,D,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// Atlafan (Dark bat) - ID 9
const BT_BODY  = 'rgb(70,40,110)';
const BT_DARK  = 'rgb(40,20,70)';
const BT_WING  = 'rgb(85,50,130)';
const BT_EYE   = 'rgb(255,220,50)';
const BT_BELLY = 'rgb(110,70,150)';
const BT_EAR   = 'rgb(100,60,140)';

function createAtlafanSprite(scale) {
    scale = scale || 4;
    const B=BT_BODY, D=BT_DARK, W=BT_WING, E=BT_EYE, L=BT_BELLY, R=BT_EAR;
    const grid = [
        [T,T,T,R,R,T,T,T,T,T,T,R,R,T,T,T],
        [T,T,T,R,B,R,T,T,T,T,R,B,R,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,T,B,E,B,B,B,E,B,B,T,T,T,T],
        [T,T,T,T,B,B,B,D,D,B,B,B,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [W,W,T,T,T,B,L,L,L,L,B,T,T,T,W,W],
        [W,W,W,T,B,B,L,L,L,L,B,B,T,W,W,W],
        [T,W,W,W,B,B,L,L,L,L,B,B,W,W,W,T],
        [T,T,W,W,W,B,B,B,B,B,B,W,W,W,T,T],
        [T,T,T,W,W,W,B,B,B,B,W,W,W,T,T,T],
        [T,T,T,T,W,W,B,B,B,B,W,W,T,T,T,T],
        [T,T,T,T,T,W,B,B,B,B,W,T,T,T,T,T],
        [T,T,T,T,T,T,D,B,B,D,T,T,T,T,T,T],
        [T,T,T,T,T,T,D,D,D,D,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// Galashan (Water seal) - ID 10
const GL_BODY  = 'rgb(90,140,200)';
const GL_DARK  = 'rgb(50,100,160)';
const GL_BELLY = 'rgb(180,210,240)';
const GL_EYE   = 'rgb(30,30,30)';
const GL_NOSE  = 'rgb(40,40,50)';
const GL_FLIP  = 'rgb(60,120,180)';

function createGalashanSprite(scale) {
    scale = scale || 4;
    const B=GL_BODY, D=GL_DARK, L=GL_BELLY, E=GL_EYE, N=GL_NOSE, F=GL_FLIP;
    const grid = [
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,B,E,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,N,N,B,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,F,B,B,L,L,L,L,L,L,L,L,B,B,F,T],
        [F,F,B,B,L,L,L,L,L,L,L,L,B,B,F,F],
        [T,F,B,B,L,L,L,L,L,L,L,L,B,B,F,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,T,T,D,D,T,T,D,D,T,T,T,T,T],
        [T,T,T,T,T,D,D,T,T,D,D,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// ===================================================================
// New monster sprites (IDs 11-30)
// ===================================================================

// 11 - Lahavur (Fire wolf)
function createLahavurSprite(scale) {
    scale = scale || 4;
    const B='rgb(224,72,32)', D='rgb(160,40,20)', L='rgb(255,160,80)', E='rgb(30,30,30)', F='rgb(255,200,50)';
    const grid = [
        [T,T,T,D,D,T,T,T,T,T,T,D,D,T,T,T],
        [T,T,T,D,B,D,T,T,T,T,D,B,D,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,B,B,B,B,L,L,L,B,B,B,B,B,T,T],
        [T,B,B,B,L,L,L,L,L,L,L,B,B,B,B,T],
        [T,B,D,B,L,L,L,L,L,L,L,B,D,B,B,T],
        [T,T,B,B,L,L,L,L,L,L,L,B,B,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,T,T,T,T,T,B,B,T,T,T,T],
        [T,T,T,B,D,T,T,T,T,T,D,B,T,T,T,T],
        [T,T,T,D,D,T,T,T,T,T,D,D,T,T,T,T],
        [T,T,T,T,T,T,T,T,F,F,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,F,F,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 12 - Buon (Water bubble)
function createBuonSprite(scale) {
    scale = scale || 4;
    const B='rgb(68,170,238)', D='rgb(40,120,190)', L='rgb(180,230,255)', E='rgb(30,30,30)', S='rgb(220,240,255)';
    const grid = [
        [T,T,T,T,T,T,S,S,S,S,T,T,T,T,T,T],
        [T,T,T,T,S,S,L,L,L,L,S,S,T,T,T,T],
        [T,T,T,S,L,L,L,L,L,L,L,L,S,T,T,T],
        [T,T,S,B,B,B,B,B,B,B,B,B,B,S,T,T],
        [T,T,B,B,B,E,B,B,B,E,B,B,B,B,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,B,B,B,B,B,L,L,B,B,B,B,B,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,B,B,L,L,L,L,L,L,L,L,B,B,T,T],
        [T,T,B,B,L,L,L,L,L,L,L,L,B,B,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,T,T,D,D,T,T,D,D,T,T,T,T,T],
        [T,T,T,T,T,D,D,T,T,D,D,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 13 - Yerokan (Grass lizard)
function createYerokanSprite(scale) {
    scale = scale || 4;
    const B='rgb(68,170,68)', D='rgb(40,120,40)', L='rgb(150,220,130)', E='rgb(30,30,30)', F='rgb(100,200,60)';
    const grid = [
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,B,B,B,B,B,T,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,B,L,L,B,B,B,B,T,T,T,T],
        [T,T,B,B,B,L,L,L,L,B,B,B,B,T,T,T],
        [T,B,B,B,L,L,L,L,L,L,B,B,B,B,T,T],
        [T,B,D,B,L,L,L,L,L,L,B,D,B,T,T,T],
        [T,T,B,B,L,L,L,L,L,L,B,B,T,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,T,T,T,T,B,B,T,T,T,T,T],
        [T,T,T,D,B,T,T,T,T,D,B,T,T,T,T,T],
        [T,T,T,D,D,T,T,T,T,D,D,T,F,F,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,F,F,F,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,F,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 14 - Raamon (Electric ram)
function createRaamonSprite(scale) {
    scale = scale || 4;
    const B='rgb(238,204,34)', D='rgb(180,150,20)', L='rgb(255,245,180)', E='rgb(30,30,30)', K='rgb(255,255,100)';
    const grid = [
        [T,T,T,T,K,K,T,T,T,T,K,K,T,T,T,T],
        [T,T,T,K,K,B,K,T,T,K,B,K,K,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,B,B,B,B,T,T],
        [T,B,B,B,L,L,L,L,L,L,L,B,B,B,B,T],
        [T,B,D,B,L,L,L,L,L,L,L,B,D,B,T,T],
        [T,T,B,B,L,L,L,L,L,L,L,B,B,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,T,T,T,T,B,B,T,T,T,T,T],
        [T,T,T,B,D,T,T,T,T,D,B,T,T,T,T,T],
        [T,T,T,D,D,T,T,T,T,D,D,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 15 - Kfuri (Ice fox)
function createKfuriSprite(scale) {
    scale = scale || 4;
    const B='rgb(136,221,255)', D='rgb(80,160,200)', L='rgb(220,245,255)', E='rgb(30,30,30)', F='rgb(200,240,255)';
    const grid = [
        [T,T,T,F,F,T,T,T,T,T,T,F,F,T,T,T],
        [T,T,T,F,B,F,T,T,T,T,F,B,F,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,D,D,B,B,B,B,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,B,B,B,L,L,L,L,L,L,L,L,B,B,B,T],
        [T,B,D,B,L,L,L,L,L,L,L,L,B,D,B,T],
        [T,T,B,B,L,L,L,L,L,L,L,L,B,B,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,T,B,B,T,T,T,T,T,B,B,T,T,T,T],
        [T,T,T,D,B,T,T,T,T,T,D,B,T,T,T,T],
        [T,T,T,D,D,T,T,T,T,T,D,D,T,T,T,T],
        [T,T,T,T,T,T,T,F,F,F,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,F,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 16 - Tzalmon (Dark phantom)
function createTzalmonSprite(scale) {
    scale = scale || 4;
    const B='rgb(85,68,136)', D='rgb(50,35,85)', G='rgb(140,100,190)', E='rgb(200,50,50)', I='rgb(110,80,160)';
    const grid = [
        [T,T,T,T,T,G,G,G,G,G,G,T,T,T,T,T],
        [T,T,T,T,G,B,B,B,B,B,B,G,T,T,T,T],
        [T,T,T,G,B,B,B,B,B,B,B,B,G,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,E,B,B,E,E,B,B,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,B,B,B,I,I,I,I,I,I,B,B,B,T,T],
        [T,T,B,B,I,I,I,I,I,I,I,I,B,B,T,T],
        [T,T,B,B,I,I,I,I,I,I,I,I,B,B,T,T],
        [T,T,T,B,B,I,I,I,I,I,I,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,D,B,B,B,B,B,B,B,B,D,T,T,T],
        [T,T,D,T,D,B,B,B,B,B,B,D,T,D,T,T],
        [T,D,T,T,T,D,B,B,B,B,D,T,T,T,D,T],
        [T,T,T,T,T,T,D,D,D,D,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,D,D,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 17 - Arion (Fire lion)
function createArionSprite(scale) {
    scale = scale || 4;
    const B='rgb(221,102,34)', D='rgb(160,60,20)', L='rgb(255,200,130)', E='rgb(30,30,30)', M='rgb(240,140,40)';
    const grid = [
        [T,T,T,T,M,M,M,M,M,M,M,M,T,T,T,T],
        [T,T,T,M,M,M,M,M,M,M,M,M,M,T,T,T],
        [T,T,T,M,B,B,B,B,B,B,B,B,M,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,B,B,B,B,L,L,L,B,B,B,B,B,T,T],
        [T,B,B,B,L,L,L,L,L,L,L,B,B,B,B,T],
        [T,B,D,B,L,L,L,L,L,L,L,B,D,B,T,T],
        [T,T,B,B,L,L,L,L,L,L,L,B,B,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,T,T,T,T,B,B,T,T,T,T,T],
        [T,T,T,B,D,T,T,T,T,D,B,T,T,T,T,T],
        [T,T,T,D,D,T,T,T,T,D,D,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 18 - Snapiron (Water fish)
function createSnapironSprite(scale) {
    scale = scale || 4;
    const B='rgb(51,136,204)', D='rgb(30,90,150)', L='rgb(150,210,255)', E='rgb(30,30,30)', F='rgb(40,110,180)';
    const grid = [
        [T,T,T,T,T,T,F,F,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,F,F,F,F,T,T,T,T,T,T,T],
        [T,T,T,T,T,B,B,B,B,B,T,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,T,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,B,B,B,T,T,T],
        [T,B,B,B,L,L,L,L,L,L,L,B,B,B,T,T],
        [T,B,B,L,L,L,L,L,L,L,L,L,B,B,T,T],
        [T,T,B,B,L,L,L,L,L,L,L,B,B,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [F,T,T,B,B,B,B,B,B,B,B,B,T,T,T,T],
        [F,F,T,T,B,B,T,T,T,B,B,T,T,T,T,T],
        [T,F,T,T,D,D,T,T,T,D,D,T,T,T,T,T],
        [T,T,T,T,D,D,T,T,T,D,D,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 19 - Alal (Grass tree)
function createAlalSprite(scale) {
    scale = scale || 4;
    const B='rgb(51,187,85)', D='rgb(35,130,55)', L='rgb(180,240,160)', E='rgb(30,30,30)', R='rgb(120,80,40)', F='rgb(100,210,80)';
    const grid = [
        [T,T,T,T,F,F,F,F,F,F,F,F,T,T,T,T],
        [T,T,T,F,F,F,F,F,F,F,F,F,F,T,T,T],
        [T,T,F,F,F,F,F,F,F,F,F,F,F,F,T,T],
        [T,T,F,F,F,F,F,F,F,F,F,F,F,F,T,T],
        [T,T,T,F,F,F,F,F,F,F,F,F,F,T,T,T],
        [T,T,T,T,T,T,R,R,R,R,T,T,T,T,T,T],
        [T,T,T,T,T,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,T,B,B,E,B,B,E,B,B,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,B,L,L,L,L,B,B,B,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,B,D,T,T,T,T,D,B,T,T,T,T],
        [T,T,T,T,D,D,T,T,T,T,D,D,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 20 - Habarkan (Electric mouse)
function createHabarkanSprite(scale) {
    scale = scale || 4;
    const B='rgb(255,221,68)', D='rgb(200,170,30)', L='rgb(255,245,180)', E='rgb(30,30,30)', K='rgb(255,255,100)', C='rgb(255,100,80)';
    const grid = [
        [T,T,T,B,B,T,T,T,T,T,T,B,B,T,T,T],
        [T,T,T,B,B,B,T,T,T,T,B,B,B,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,C,B,B,B,B,B,C,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,B,B,L,L,L,L,L,L,L,L,B,B,T,T],
        [T,T,B,D,L,L,L,L,L,L,L,L,D,B,T,T],
        [T,T,T,B,B,L,L,L,L,L,L,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,B,D,T,T,T,T,D,B,T,T,T,T],
        [T,T,T,T,D,D,T,T,K,T,D,D,T,T,T,T],
        [T,T,T,T,T,T,T,K,K,K,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,K,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 21 - Kfaon (Ice golem)
function createKfaonSprite(scale) {
    scale = scale || 4;
    const B='rgb(102,204,238)', D='rgb(60,150,190)', L='rgb(210,240,255)', E='rgb(30,30,30)', S='rgb(180,230,250)';
    const grid = [
        [T,T,T,T,T,S,S,S,S,S,S,T,T,T,T,T],
        [T,T,T,T,S,B,B,B,B,B,B,S,T,T,T,T],
        [T,T,T,S,B,B,B,B,B,B,B,B,S,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,B,B,B,L,L,L,L,L,L,L,L,B,B,B,T],
        [T,B,B,B,L,L,L,L,L,L,L,L,B,B,B,T],
        [T,B,D,B,L,L,L,L,L,L,L,L,B,D,B,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,B,D,D,T,T,D,D,B,T,T,T,T],
        [T,T,T,T,D,D,D,T,T,D,D,D,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 22 - Afalon (Dark owl)
function createAfalonSprite(scale) {
    scale = scale || 4;
    const B='rgb(68,51,102)', D='rgb(40,25,65)', W='rgb(90,60,130)', E='rgb(255,200,50)', L='rgb(100,75,140)';
    const grid = [
        [T,T,T,T,W,W,T,T,T,T,W,W,T,T,T,T],
        [T,T,T,W,W,W,W,T,T,W,W,W,W,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,E,B,E,E,B,B,B,T,T,T],
        [T,T,T,B,B,E,E,B,E,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,D,D,B,B,B,B,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,W,B,B,L,L,L,L,L,L,L,L,B,B,W,T],
        [W,W,B,B,L,L,L,L,L,L,L,L,B,B,W,W],
        [T,W,B,B,B,L,L,L,L,L,L,B,B,B,W,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,B,D,T,T,T,T,D,B,T,T,T,T],
        [T,T,T,T,D,D,T,T,T,T,D,D,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 23 - Zanbur (Normal bee)
function createZanburSprite(scale) {
    scale = scale || 4;
    const B='rgb(204,170,102)', D='rgb(140,110,50)', S='rgb(60,40,20)', W='rgb(230,240,255)', E='rgb(30,30,30)', L='rgb(240,220,170)';
    const grid = [
        [T,T,T,W,W,T,T,T,T,T,T,W,W,T,T,T],
        [T,T,W,W,W,W,T,T,T,T,W,W,W,W,T,T],
        [T,T,W,W,W,W,T,T,T,T,W,W,W,W,T,T],
        [T,W,W,W,W,T,T,B,B,T,T,W,W,W,W,T],
        [T,T,W,W,T,T,B,B,B,B,T,T,W,W,T,T],
        [T,T,T,T,T,B,B,E,E,B,B,T,T,T,T,T],
        [T,T,T,T,B,B,S,B,B,S,B,B,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,T,B,S,B,L,L,B,S,B,T,T,T,T],
        [T,T,T,T,B,B,L,L,L,L,B,B,T,T,T,T],
        [T,T,T,T,T,B,S,L,L,S,B,T,T,T,T,T],
        [T,T,T,T,T,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,T,T,T,B,B,B,B,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,D,D,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,D,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 24 - Lavhav (Fire bird)
function createLavhavSprite(scale) {
    scale = scale || 4;
    const B='rgb(255,85,51)', D='rgb(200,50,30)', L='rgb(255,200,100)', E='rgb(30,30,30)', F='rgb(255,220,50)', W='rgb(255,130,60)';
    const grid = [
        [T,T,T,T,T,T,F,F,F,T,T,T,T,T,T,T],
        [T,T,T,T,T,F,F,B,F,F,T,T,T,T,T,T],
        [T,T,T,T,T,B,B,B,B,B,T,T,T,T,T,T],
        [T,T,T,T,B,B,E,B,E,B,B,T,T,T,T,T],
        [T,T,T,T,B,B,B,D,B,B,B,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,T,T,T,T,T],
        [T,W,W,T,B,B,L,L,L,B,B,T,W,W,T,T],
        [W,W,W,B,B,L,L,L,L,L,B,B,W,W,W,T],
        [T,W,W,B,L,L,L,L,L,L,L,B,W,W,T,T],
        [T,T,W,B,B,L,L,L,L,L,B,B,W,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,T,T,D,D,T,D,D,T,T,T,T,T,T],
        [T,T,T,T,T,D,D,T,D,D,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 25 - Maayan (Water jellyfish)
function createMaayanSprite(scale) {
    scale = scale || 4;
    const B='rgb(34,119,187)', D='rgb(20,80,140)', L='rgb(140,200,240)', E='rgb(30,30,30)', G='rgb(80,170,230)';
    const grid = [
        [T,T,T,T,T,G,G,G,G,G,G,T,T,T,T,T],
        [T,T,T,T,G,B,B,B,B,B,B,G,T,T,T,T],
        [T,T,T,G,B,B,B,B,B,B,B,B,G,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,L,L,L,L,L,L,B,B,T,T,T],
        [T,T,T,B,L,L,L,L,L,L,L,L,B,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,T,T,D,T,D,D,T,D,T,T,T,T,T],
        [T,T,T,T,D,T,T,D,D,T,T,D,T,T,T,T],
        [T,T,T,D,T,T,T,D,D,T,T,T,D,T,T,T],
        [T,T,T,D,T,T,T,D,D,T,T,T,D,T,T,T],
        [T,T,T,T,D,T,T,T,T,T,T,D,T,T,T,T],
        [T,T,T,T,T,D,T,T,T,T,D,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 26 - Sichon (Grass bush)
function createSichonSprite(scale) {
    scale = scale || 4;
    const B='rgb(85,204,51)', D='rgb(50,150,30)', L='rgb(180,240,140)', E='rgb(30,30,30)', F='rgb(120,220,60)', R='rgb(200,60,60)';
    const grid = [
        [T,T,T,T,F,F,R,F,F,R,F,F,T,T,T,T],
        [T,T,T,F,F,F,F,F,F,F,F,F,F,T,T,T],
        [T,T,F,F,F,F,F,F,F,F,F,F,F,F,T,T],
        [T,T,F,F,F,F,F,F,F,F,F,F,F,F,T,T],
        [T,T,T,F,F,F,F,F,F,F,F,F,F,T,T,T],
        [T,T,T,T,T,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,B,B,L,L,L,L,L,L,L,L,B,B,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,B,D,T,T,T,T,D,B,T,T,T,T],
        [T,T,T,T,D,D,T,T,T,T,D,D,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 27 - Chashmalit (Electric eel)
function createChashmalitSprite(scale) {
    scale = scale || 4;
    const B='rgb(221,187,51)', D='rgb(160,130,30)', L='rgb(255,245,180)', E='rgb(30,30,30)', K='rgb(255,255,100)', S='rgb(60,60,100)';
    const grid = [
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,B,B,B,B,B,T,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,B,B,B,T,T,T],
        [T,T,B,B,L,L,L,L,L,L,L,B,B,T,T,T],
        [T,T,B,S,B,L,L,L,L,L,B,S,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,T,T,B,B,B,B,B,T,T,T,T,T,T],
        [T,T,T,T,T,T,B,B,B,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,B,B,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,K,B,B,K,T,T,T,T,T,T],
        [T,T,T,T,T,K,K,T,T,K,K,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 28 - Shalgon (Ice bear)
function createShalgonSprite(scale) {
    scale = scale || 4;
    const B='rgb(153,221,238)', D='rgb(100,170,200)', L='rgb(230,245,255)', E='rgb(30,30,30)', N='rgb(60,60,80)';
    const grid = [
        [T,T,T,T,B,B,T,T,T,T,B,B,T,T,T,T],
        [T,T,T,T,B,B,B,T,T,B,B,B,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,N,N,B,B,B,B,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,B,B,B,L,L,L,L,L,L,L,L,B,B,B,T],
        [T,B,D,B,L,L,L,L,L,L,L,L,B,D,B,T],
        [T,B,B,B,L,L,L,L,L,L,L,L,B,B,B,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,T,B,B,B,T,T,T,T,B,B,B,T,T,T],
        [T,T,T,B,D,B,T,T,T,T,B,D,B,T,T,T],
        [T,T,T,D,D,T,T,T,T,T,T,D,D,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 29 - Lilion (Dark cat)
function createLilionSprite(scale) {
    scale = scale || 4;
    const B='rgb(119,68,153)', D='rgb(70,35,100)', L='rgb(160,120,200)', E='rgb(180,255,50)', W='rgb(100,55,140)';
    const grid = [
        [T,T,T,W,W,T,T,T,T,T,T,W,W,T,T,T],
        [T,T,T,W,B,W,T,T,T,T,W,B,W,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,D,D,B,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,B,D,L,L,L,L,L,L,L,L,D,B,T,T],
        [T,T,B,B,L,L,L,L,L,L,L,L,B,B,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,B,B,T,T,T,T,B,B,T,T,T,T],
        [T,T,T,T,D,B,T,T,T,T,D,B,T,T,T,T],
        [T,T,T,T,D,D,T,T,D,D,D,D,T,T,T,T],
        [T,T,T,T,T,T,T,D,D,D,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,D,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// 30 - Gorilion (Normal gorilla)
function createGorilionSprite(scale) {
    scale = scale || 4;
    const B='rgb(153,136,102)', D='rgb(100,85,60)', L='rgb(200,185,160)', E='rgb(30,30,30)', N='rgb(60,50,40)';
    const grid = [
        [T,T,T,T,T,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,B,B,B,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,B,B,E,B,B,B,E,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,N,N,B,B,B,B,T,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,B,B,B,B,L,L,L,L,L,L,B,B,B,B,T],
        [T,B,B,B,L,L,L,L,L,L,L,L,B,B,B,T],
        [T,B,B,B,L,L,L,L,L,L,L,L,B,B,B,T],
        [T,B,D,B,L,L,L,L,L,L,L,L,B,D,B,T],
        [T,T,B,B,B,L,L,L,L,L,L,B,B,B,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,B,B,T,T],
        [T,T,T,B,B,B,B,B,B,B,B,B,B,T,T,T],
        [T,T,T,T,B,D,D,T,T,D,D,B,T,T,T,T],
        [T,T,T,T,D,D,D,T,T,D,D,D,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

// ===================================================================
// Walking animation frames for hero
// ===================================================================

function createHeroWalkSprites(scale) {
    scale = scale || 3;
    const sprites = {};

    // Walk frame 1: left foot forward
    const downWalk1 = [
        [T,T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T],
        [T,T,T,T,H_SKIN,H_EYE,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_EYE,H_SKIN,T,T,T,T],
        [T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T],
        [T,T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T],
        [T,T,T,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,T,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T],
        [T,T,H_SKIN,T,T,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,T,T,H_SKIN,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,H_PANTS,H_PANTS,T,T,T,T,H_PANTS,H_PANTS,T,T,T,T],
        [T,T,T,H_PANTS,H_PANTS,T,T,T,T,T,T,H_PANTS,H_PANTS,T,T,T],
        [T,T,T,H_SHOE,H_SHOE,T,T,T,T,T,T,T,H_SHOE,H_SHOE,T,T],
        [T,T,T,H_SHOE,H_SHOE,T,T,T,T,T,T,T,T,H_SHOE,T,T],
    ];
    sprites.down_walk1 = gridToCanvas(downWalk1, scale);

    // Walk frame 2: right foot forward (mirror of walk1 legs)
    const downWalk2 = [
        [T,T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T],
        [T,T,T,T,H_SKIN,H_EYE,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_EYE,H_SKIN,T,T,T,T],
        [T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T],
        [T,T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T],
        [T,T,T,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,T,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T],
        [T,T,H_SKIN,T,T,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,T,T,H_SKIN,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,H_PANTS,H_PANTS,T,T,T,T,H_PANTS,H_PANTS,T,T,T,T],
        [T,T,T,H_PANTS,H_PANTS,T,T,T,T,T,H_PANTS,H_PANTS,T,T,T,T],
        [T,T,H_SHOE,H_SHOE,T,T,T,T,T,T,T,H_SHOE,H_SHOE,T,T,T],
        [T,T,H_SHOE,T,T,T,T,T,T,T,T,H_SHOE,H_SHOE,T,T,T],
    ];
    sprites.down_walk2 = gridToCanvas(downWalk2, scale);

    // Up walk frames
    const upWalk1 = [
        [T,T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T],
        [T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T],
        [T,T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T],
        [T,T,T,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,T,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T],
        [T,T,H_SKIN,T,T,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,T,T,H_SKIN,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,H_PANTS,H_PANTS,T,T,T,T,H_PANTS,H_PANTS,T,T,T,T],
        [T,T,T,H_PANTS,H_PANTS,T,T,T,T,T,T,H_PANTS,H_PANTS,T,T,T],
        [T,T,T,H_SHOE,H_SHOE,T,T,T,T,T,T,T,H_SHOE,H_SHOE,T,T],
        [T,T,T,H_SHOE,H_SHOE,T,T,T,T,T,T,T,T,H_SHOE,T,T],
    ];
    sprites.up_walk1 = gridToCanvas(upWalk1, scale);
    sprites.up_walk2 = gridToCanvas(upWalk1.map(row => [...row].reverse()), scale);

    // Left walk frames
    const leftWalk1 = [
        [T,T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T,T,T],
        [T,T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T,T],
        [T,T,T,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,H_HAIR,T,T,T,T,T],
        [T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T],
        [T,T,T,H_SKIN,H_EYE,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T,T],
        [T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T,T],
        [T,T,T,T,T,H_SKIN,H_SKIN,H_SKIN,H_SKIN,T,T,T,T,T,T,T],
        [T,T,T,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,T,T,T,T,T],
        [T,T,H_SKIN,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T,T,T],
        [T,T,T,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SHIRT,H_SKIN,T,T,T,T],
        [T,T,T,T,T,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,H_BELT,T,T,T,T,T],
        [T,T,T,T,T,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,T,H_PANTS,H_PANTS,T,T,T,H_PANTS,H_PANTS,T,T,T,T,T],
        [T,T,T,H_PANTS,H_PANTS,T,T,T,T,T,H_PANTS,H_PANTS,T,T,T,T],
        [T,T,T,H_SHOE,H_SHOE,T,T,T,T,T,T,H_SHOE,H_SHOE,T,T,T],
        [T,T,T,H_SHOE,T,T,T,T,T,T,T,H_SHOE,H_SHOE,T,T,T],
    ];
    sprites.left_walk1 = gridToCanvas(leftWalk1, scale);
    sprites.left_walk2 = gridToCanvas(leftWalk1.map(row => [...row]), scale); // same for simplicity

    // Right walk (mirror of left)
    sprites.right_walk1 = gridToCanvas(leftWalk1.map(row => [...row].reverse()), scale);
    sprites.right_walk2 = sprites.right_walk1;

    return sprites;
}

// ===================================================================
// Sprite cache
// ===================================================================

const _spriteCache = {};

function getHeroSprites() {
    if (!_spriteCache.hero) {
        _spriteCache.hero = createHeroSprites(3);
    }
    return _spriteCache.hero;
}

function getHeroWalkSprites() {
    if (!_spriteCache.heroWalk) {
        _spriteCache.heroWalk = createHeroWalkSprites(3);
    }
    return _spriteCache.heroWalk;
}

// ===================================================================
// Evolved form sprites (IDs 31-40)
// ===================================================================

function createLahbiaurSprite(scale) {
    const B = 'rgb(255,60,20)', Y = 'rgb(255,180,60)', E = 'rgb(30,30,30)';
    const R = 'rgb(200,40,10)', O = 'rgb(255,120,30)', W = 'rgb(255,220,100)';
    const grid = [
        [T,T,T,T,T,O,O,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,O,R,O,O,T,T,T,T,T,T,T,T],
        [T,T,T,B,B,B,B,B,T,T,T,T,T,O,O,T],
        [T,T,B,B,E,B,E,B,B,T,T,T,O,R,O,T],
        [T,T,B,B,B,B,B,B,B,T,T,T,T,O,T,T],
        [T,T,B,Y,Y,Y,Y,Y,B,T,T,T,T,T,T,T],
        [T,T,B,Y,Y,Y,Y,Y,B,B,T,T,T,T,T,T],
        [T,B,B,Y,Y,Y,Y,B,B,B,B,T,T,T,T,T],
        [T,B,B,B,B,B,B,B,B,B,B,T,T,T,T,T],
        [T,B,B,B,B,B,B,B,B,B,T,T,T,T,T,T],
        [T,T,B,B,T,T,T,B,B,T,T,T,T,T,T,T],
        [T,T,B,B,T,T,T,B,B,T,T,T,T,T,T,T],
        [T,T,R,R,T,T,T,R,R,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createDolphigonSprite(scale) {
    const B = 'rgb(30,90,200)', L = 'rgb(100,170,255)', W = 'rgb(200,230,255)';
    const E = 'rgb(30,30,30)', D = 'rgb(20,60,150)';
    const grid = [
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,B,B,B,T,T,T,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,B,T,T,T,T,T,T,T],
        [T,T,T,B,B,E,B,E,B,B,T,T,T,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,T,T,T,T,T],
        [T,T,B,L,L,L,L,L,L,B,T,T,T,T,T,T],
        [T,B,B,L,W,L,L,W,L,B,B,T,T,T,T,T],
        [T,B,B,L,L,L,L,L,L,B,B,B,T,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,B,B,D,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,D,D,T,T,T,T],
        [T,T,T,B,B,T,T,B,B,T,T,T,T,T,T,T],
        [T,T,T,B,B,T,T,B,B,T,T,T,T,T,T,T],
        [T,T,T,D,D,T,T,D,D,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createKotznaorSprite(scale) {
    const G = 'rgb(30,120,40)', L = 'rgb(80,180,60)', D = 'rgb(20,80,25)';
    const S = 'rgb(160,120,80)', E = 'rgb(30,30,30)', Y = 'rgb(180,220,80)';
    const grid = [
        [T,T,T,T,D,Y,D,T,T,T,T,T,T,T,T,T],
        [T,T,T,D,G,G,G,D,T,T,T,T,T,T,T,T],
        [T,T,T,D,G,G,G,D,D,T,T,T,T,T,T,T],
        [T,T,G,G,E,G,E,G,G,T,T,T,T,T,T,T],
        [T,T,G,G,G,G,G,G,G,T,T,T,T,T,T,T],
        [T,G,G,L,L,L,L,L,G,G,T,T,T,T,T,T],
        [T,G,G,L,L,L,L,L,G,G,T,T,T,T,T,T],
        [T,G,G,L,L,L,L,L,G,G,T,T,T,T,T,T],
        [T,T,G,G,G,G,G,G,G,T,T,T,T,T,T,T],
        [T,T,G,G,G,G,G,G,G,T,T,T,T,T,T,T],
        [T,T,T,G,G,T,G,G,T,T,T,T,T,T,T,T],
        [T,T,T,S,S,T,S,S,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createZikitorSprite(scale) {
    const Y = 'rgb(230,190,20)', B = 'rgb(255,230,80)', E = 'rgb(30,30,30)';
    const D = 'rgb(180,150,10)', W = 'rgb(255,255,180)';
    const grid = [
        [T,T,T,T,T,W,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,W,Y,W,T,T,T,T,T,T,T,T,T],
        [T,T,T,Y,Y,Y,Y,Y,T,T,T,T,T,T,T,T],
        [T,T,Y,Y,E,Y,E,Y,Y,T,T,T,T,T,T,T],
        [T,T,Y,Y,Y,Y,Y,Y,Y,T,T,T,T,T,T,T],
        [T,Y,Y,B,B,B,B,B,Y,Y,T,T,T,T,T,T],
        [T,Y,Y,B,B,B,B,B,Y,Y,T,T,T,W,T,T],
        [T,T,Y,Y,Y,Y,Y,Y,Y,T,T,T,W,Y,T,T],
        [T,T,Y,Y,Y,Y,Y,Y,Y,T,T,W,Y,T,T,T],
        [T,T,T,Y,Y,Y,Y,Y,T,T,T,T,T,T,T,T],
        [T,T,T,Y,Y,T,Y,Y,T,T,T,T,T,T,T,T],
        [T,T,T,D,D,T,D,D,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createNovhaonSprite(scale) {
    const B = 'rgb(140,100,60)', L = 'rgb(200,170,120)', E = 'rgb(30,30,30)';
    const D = 'rgb(100,70,40)', N = 'rgb(50,40,30)';
    const grid = [
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,T,T,T,T,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,T,T,T,T,T,T,T],
        [T,T,B,B,E,B,B,E,B,B,T,T,T,T,T,T],
        [T,T,B,B,B,N,N,B,B,B,T,T,T,T,T,T],
        [T,B,B,L,L,L,L,L,L,B,B,T,T,T,T,T],
        [T,B,B,L,L,L,L,L,L,B,B,T,T,T,T,T],
        [T,B,B,L,L,L,L,L,L,B,B,T,T,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,T,T,T,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,T,T,T,T,T,T],
        [T,T,T,B,B,T,T,B,B,T,T,T,T,T,T,T],
        [T,T,T,D,D,T,T,D,D,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createKarchielSprite(scale) {
    const I = 'rgb(80,180,220)', L = 'rgb(160,220,240)', W = 'rgb(220,240,255)';
    const E = 'rgb(30,30,30)', D = 'rgb(50,130,180)', C = 'rgb(180,230,255)';
    const grid = [
        [T,T,T,T,C,C,C,T,T,T,T,T,T,T,T,T],
        [T,T,T,C,I,I,I,C,T,T,T,T,T,T,T,T],
        [T,T,I,I,I,I,I,I,I,T,T,T,T,T,T,T],
        [T,T,I,I,E,I,E,I,I,T,T,T,T,T,T,T],
        [T,I,I,I,I,I,I,I,I,I,T,T,T,T,T,T],
        [T,I,I,L,L,L,L,L,I,I,T,T,T,T,T,T],
        [I,I,I,L,W,L,L,W,L,I,I,T,T,T,T,T],
        [I,I,I,L,L,L,L,L,L,I,I,T,T,T,T,T],
        [T,I,I,I,I,I,I,I,I,I,T,T,T,T,T,T],
        [T,T,I,I,I,I,I,I,I,T,T,T,T,T,T,T],
        [T,T,I,I,I,T,I,I,I,T,T,T,T,T,T,T],
        [T,T,D,D,D,T,D,D,D,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createTzlalaorSprite(scale) {
    const P = 'rgb(70,30,110)', L = 'rgb(120,60,180)', W = 'rgb(180,120,255)';
    const E = 'rgb(200,50,50)', D = 'rgb(40,15,70)';
    const grid = [
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,P,P,P,P,P,T,T,T,T,T,T,T,T],
        [T,T,P,P,P,P,P,P,P,T,T,T,T,T,T,T],
        [T,T,P,P,E,P,E,P,P,T,T,T,T,T,T,T],
        [T,P,P,P,P,P,P,P,P,P,T,T,T,T,T,T],
        [T,P,P,L,L,L,L,L,P,P,T,T,T,T,T,T],
        [P,P,P,L,W,L,L,W,L,P,P,T,T,T,T,T],
        [P,P,P,L,L,L,L,L,L,P,P,T,T,T,T,T],
        [T,P,P,P,P,P,P,P,P,P,T,T,T,T,T,T],
        [T,T,P,P,P,P,P,P,P,T,T,T,T,T,T,T],
        [T,T,P,P,T,T,T,P,P,T,T,T,T,T,T,T],
        [T,T,D,D,T,T,T,D,D,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createShalgiaorSprite(scale) {
    const I = 'rgb(130,200,230)', L = 'rgb(200,230,245)', W = 'rgb(240,248,255)';
    const E = 'rgb(30,30,30)', D = 'rgb(90,160,200)', B = 'rgb(160,210,235)';
    const grid = [
        [T,T,T,T,T,W,W,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,I,I,I,I,T,T,T,T,T,T,T,T],
        [T,T,T,I,I,I,I,I,I,T,T,T,T,T,T,T],
        [T,T,I,I,E,I,I,E,I,I,T,T,T,T,T,T],
        [T,T,I,I,I,I,I,I,I,I,T,T,T,T,T,T],
        [T,I,I,L,L,L,L,L,L,I,I,T,T,T,T,T],
        [T,I,I,L,L,L,L,L,L,I,I,T,T,T,T,T],
        [T,T,I,I,I,I,I,I,I,I,T,T,T,T,T,T],
        [T,T,I,I,I,I,I,I,I,I,T,T,T,T,T,T],
        [T,T,T,I,I,I,I,I,I,T,T,T,T,T,T,T],
        [T,T,T,I,I,T,T,I,I,T,T,T,T,T,T,T],
        [T,T,T,D,D,T,T,D,D,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createAtlafaorSprite(scale) {
    const P = 'rgb(50,25,90)', L = 'rgb(90,50,150)', W = 'rgb(150,100,210)';
    const E = 'rgb(220,50,50)', D = 'rgb(30,15,55)', WG = 'rgb(60,35,110)';
    const grid = [
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,WG,P,P,P,WG,T,T,T,T,T,T,T,T],
        [T,T,WG,P,P,P,P,P,WG,T,T,T,T,T,T,T],
        [T,WG,P,P,E,P,E,P,P,WG,T,T,T,T,T,T],
        [WG,T,P,P,P,P,P,P,P,T,WG,T,T,T,T,T],
        [WG,T,P,L,L,L,L,L,P,T,WG,T,T,T,T,T],
        [T,T,P,L,W,L,L,W,L,P,T,T,T,T,T,T],
        [T,T,P,L,L,L,L,L,L,P,T,T,T,T,T,T],
        [T,T,P,P,P,P,P,P,P,P,T,T,T,T,T,T],
        [T,T,T,P,P,P,P,P,P,T,T,T,T,T,T,T],
        [T,T,T,P,P,T,T,P,P,T,T,T,T,T,T,T],
        [T,T,T,D,D,T,T,D,D,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function createGalshiaonSprite(scale) {
    const B = 'rgb(40,110,190)', L = 'rgb(100,180,240)', W = 'rgb(180,220,255)';
    const E = 'rgb(30,30,30)', D = 'rgb(25,70,140)', F = 'rgb(60,140,210)';
    const grid = [
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,B,B,B,B,T,T,T,T,T,T,T,T],
        [T,T,T,B,B,B,B,B,B,T,T,T,T,T,T,T],
        [T,T,B,B,E,B,B,E,B,B,T,T,T,T,T,T],
        [T,B,B,B,B,B,B,B,B,B,B,T,T,T,T,T],
        [T,B,B,L,L,L,L,L,L,B,B,T,T,T,T,T],
        [B,B,B,L,W,L,L,W,L,B,B,B,T,T,T,T],
        [T,B,B,L,L,L,L,L,L,B,B,F,D,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,F,D,T,T,T,T],
        [T,T,B,B,B,B,B,B,B,B,T,T,T,T,T,T],
        [T,T,T,B,B,T,T,B,B,T,T,T,T,T,T,T],
        [T,T,T,D,D,T,T,D,D,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

function getMonsterBattleSprite(speciesId) {
    const key = 'monster_battle_' + speciesId;
    if (!_spriteCache[key]) {
        const creators = {
            1: createBlazeleteSprite,
            2: createAquaphinSprite,
            3: createThornixSprite,
            4: createZappflySprite,
            5: createBarkbiteSprite,
            6: createKarchonSprite,
            7: createTzlilitSprite,
            8: createShalgilSprite,
            9: createAtlafanSprite,
            10: createGalashanSprite,
            11: createLahavurSprite,
            12: createBuonSprite,
            13: createYerokanSprite,
            14: createRaamonSprite,
            15: createKfuriSprite,
            16: createTzalmonSprite,
            17: createArionSprite,
            18: createSnapironSprite,
            19: createAlalSprite,
            20: createHabarkanSprite,
            21: createKfaonSprite,
            22: createAfalonSprite,
            23: createZanburSprite,
            24: createLavhavSprite,
            25: createMaayanSprite,
            26: createSichonSprite,
            27: createChashmalitSprite,
            28: createShalgonSprite,
            29: createLilionSprite,
            30: createGorilionSprite,
            31: createLahbiaurSprite,
            32: createDolphigonSprite,
            33: createKotznaorSprite,
            34: createZikitorSprite,
            35: createNovhaonSprite,
            36: createKarchielSprite,
            37: createTzlalaorSprite,
            38: createShalgiaorSprite,
            39: createAtlafaorSprite,
            40: createGalshiaonSprite,
            41: createDrakoflameSprite,
            42: createAquarionSprite,
            43: createSylvaronSprite,
        };
        const creator = creators[speciesId];
        if (creator) {
            _spriteCache[key] = creator(5);
        } else {
            const c = document.createElement('canvas');
            c.width = 64; c.height = 64;
            const cx = c.getContext('2d');
            cx.fillStyle = '#969696';
            cx.fillRect(0, 0, 64, 64);
            _spriteCache[key] = c;
        }
    }
    return _spriteCache[key];
}

function getMonsterMiniSprite(speciesId) {
    const key = 'monster_mini_' + speciesId;
    if (!_spriteCache[key]) {
        const creators = {
            1: createBlazeleteSprite,
            2: createAquaphinSprite,
            3: createThornixSprite,
            4: createZappflySprite,
            5: createBarkbiteSprite,
            6: createKarchonSprite,
            7: createTzlilitSprite,
            8: createShalgilSprite,
            9: createAtlafanSprite,
            10: createGalashanSprite,
            11: createLahavurSprite,
            12: createBuonSprite,
            13: createYerokanSprite,
            14: createRaamonSprite,
            15: createKfuriSprite,
            16: createTzalmonSprite,
            17: createArionSprite,
            18: createSnapironSprite,
            19: createAlalSprite,
            20: createHabarkanSprite,
            21: createKfaonSprite,
            22: createAfalonSprite,
            23: createZanburSprite,
            24: createLavhavSprite,
            25: createMaayanSprite,
            26: createSichonSprite,
            27: createChashmalitSprite,
            28: createShalgonSprite,
            29: createLilionSprite,
            30: createGorilionSprite,
            31: createLahbiaurSprite,
            32: createDolphigonSprite,
            33: createKotznaorSprite,
            34: createZikitorSprite,
            35: createNovhaonSprite,
            36: createKarchielSprite,
            37: createTzlalaorSprite,
            38: createShalgiaorSprite,
            39: createAtlafaorSprite,
            40: createGalshiaonSprite,
            41: createDrakoflameSprite,
            42: createAquarionSprite,
            43: createSylvaronSprite,
        };
        const creator = creators[speciesId];
        if (creator) {
            _spriteCache[key] = creator(3);
        } else {
            const c = document.createElement('canvas');
            c.width = 48; c.height = 48;
            const cx = c.getContext('2d');
            cx.fillStyle = '#969696';
            cx.fillRect(0, 0, 48, 48);
            _spriteCache[key] = c;
        }
    }
    return _spriteCache[key];
}

// ===================================================================
// NPC Trainer sprites
// ===================================================================

const TR_SKIN  = 'rgb(220,180,140)';
const TR_HAIR  = 'rgb(80,50,30)';
const TR_SHIRT = 'rgb(50,80,180)';
const TR_PANTS = 'rgb(40,40,60)';
const TR_SHOE  = 'rgb(30,30,30)';
const TR_EYE   = 'rgb(20,20,20)';
const TR_BELT  = 'rgb(160,60,50)';

function createTrainerSprite(scale) {
    scale = scale || 3;
    const down = [
        [T,T,T,T,T,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,T,T,T,T,T],
        [T,T,T,T,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,T,T,T,T],
        [T,T,T,T,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,TR_HAIR,T,T,T,T],
        [T,T,T,T,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,T,T,T,T],
        [T,T,T,T,TR_SKIN,TR_EYE,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,TR_EYE,TR_SKIN,T,T,T,T],
        [T,T,T,T,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,T,T,T,T],
        [T,T,T,T,T,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,TR_SKIN,T,T,T,T,T],
        [T,T,T,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,T,T,T],
        [T,T,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,T,T],
        [T,T,TR_SKIN,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SKIN,T,T],
        [T,T,TR_SKIN,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SHIRT,TR_SKIN,T,T],
        [T,T,T,T,TR_BELT,TR_BELT,TR_BELT,TR_BELT,TR_BELT,TR_BELT,TR_BELT,TR_BELT,T,T,T,T],
        [T,T,T,T,TR_PANTS,TR_PANTS,TR_PANTS,TR_PANTS,TR_PANTS,TR_PANTS,TR_PANTS,TR_PANTS,T,T,T,T],
        [T,T,T,T,TR_PANTS,TR_PANTS,TR_PANTS,T,T,TR_PANTS,TR_PANTS,TR_PANTS,T,T,T,T],
        [T,T,T,T,TR_PANTS,TR_PANTS,TR_PANTS,T,T,TR_PANTS,TR_PANTS,TR_PANTS,T,T,T,T],
        [T,T,T,T,TR_SHOE,TR_SHOE,TR_SHOE,T,T,TR_SHOE,TR_SHOE,TR_SHOE,T,T,T,T],
    ];
    return gridToCanvas(down, scale);
}

function getTrainerSprites() {
    if (!_spriteCache['trainer_sprites']) {
        const s = createTrainerSprite(3);
        _spriteCache['trainer_sprites'] = { down: s, up: s, left: s, right: s };
    }
    return _spriteCache['trainer_sprites'];
}

// ===================================================================
// Legendary monster sprites (species 41, 42, 43)
// ===================================================================

const DF_BODY  = 'rgb(180,30,30)';
const DF_BELLY = 'rgb(255,180,60)';
const DF_WING  = 'rgb(120,20,20)';
const DF_EYE   = 'rgb(255,255,80)';
const DF_HORN  = 'rgb(60,30,20)';
const DF_FLAME = 'rgb(255,100,20)';

function createDrakoflameSprite(scale) {
    scale = scale || 5;
    const grid = [
        [T,T,T,DF_HORN,T,T,T,T,T,T,T,T,DF_HORN,T,T,T],
        [T,T,DF_HORN,DF_BODY,DF_BODY,T,T,T,T,T,T,DF_BODY,DF_BODY,DF_HORN,T,T],
        [T,T,T,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,T,T,T],
        [T,DF_WING,T,DF_BODY,DF_EYE,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_EYE,DF_BODY,T,DF_WING,T],
        [DF_WING,DF_WING,T,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,T,DF_WING,DF_WING],
        [DF_WING,DF_WING,DF_WING,DF_BODY,DF_BODY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BODY,DF_BODY,DF_WING,DF_WING,DF_WING],
        [T,DF_WING,DF_WING,DF_BODY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BODY,DF_WING,DF_WING,T],
        [T,T,DF_WING,DF_BODY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BODY,DF_WING,T,T],
        [T,T,T,DF_BODY,DF_BODY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BELLY,DF_BODY,DF_BODY,T,T,T],
        [T,T,T,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,T,T,T],
        [T,T,T,T,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,DF_BODY,T,T,T,T],
        [T,T,T,T,DF_BODY,DF_BODY,T,T,T,T,DF_BODY,DF_BODY,T,T,T,T],
        [T,T,T,T,DF_BODY,DF_BODY,T,T,T,T,DF_BODY,DF_BODY,T,T,T,T],
        [T,T,T,DF_BODY,DF_BODY,T,T,T,T,T,T,DF_BODY,DF_BODY,T,T,T],
        [T,T,T,T,T,T,T,DF_FLAME,DF_FLAME,T,T,T,T,T,T,T],
        [T,T,T,T,T,T,DF_FLAME,DF_FLAME,DF_FLAME,DF_FLAME,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

const AW_BODY  = 'rgb(40,100,200)';
const AW_LIGHT = 'rgb(120,200,255)';
const AW_DARK  = 'rgb(20,60,140)';
const AW_EYE   = 'rgb(255,255,200)';
const AW_CROWN = 'rgb(200,220,255)';
const AW_FIN   = 'rgb(60,140,220)';

function createAquarionSprite(scale) {
    scale = scale || 5;
    const grid = [
        [T,T,T,T,T,AW_CROWN,AW_CROWN,T,T,AW_CROWN,AW_CROWN,T,T,T,T,T],
        [T,T,T,T,AW_CROWN,AW_CROWN,AW_CROWN,AW_CROWN,AW_CROWN,AW_CROWN,AW_CROWN,AW_CROWN,T,T,T,T],
        [T,T,T,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,T,T,T],
        [T,T,AW_FIN,AW_BODY,AW_EYE,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_EYE,AW_BODY,AW_FIN,T,T],
        [T,AW_FIN,AW_FIN,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_FIN,AW_FIN,T],
        [T,T,T,AW_BODY,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_BODY,T,T,T],
        [T,T,T,AW_BODY,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_BODY,T,T,T],
        [T,T,T,AW_BODY,AW_BODY,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_LIGHT,AW_BODY,AW_BODY,T,T,T],
        [T,T,T,T,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,T,T,T,T],
        [T,T,AW_DARK,AW_DARK,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_DARK,AW_DARK,T,T],
        [T,AW_DARK,AW_DARK,T,T,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,AW_BODY,T,T,AW_DARK,AW_DARK,T],
        [T,T,T,T,T,AW_BODY,AW_DARK,AW_DARK,AW_DARK,AW_DARK,AW_BODY,T,T,T,T,T],
        [T,T,T,T,T,T,AW_DARK,T,T,AW_DARK,T,T,T,T,T,T],
        [T,T,T,T,T,T,AW_DARK,T,T,AW_DARK,T,T,T,T,T,T],
        [T,T,T,T,T,AW_FIN,AW_FIN,T,T,AW_FIN,AW_FIN,T,T,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}

const SV_BODY  = 'rgb(40,160,60)';
const SV_LIGHT = 'rgb(180,255,100)';
const SV_DARK  = 'rgb(20,100,30)';
const SV_EYE   = 'rgb(255,255,100)';
const SV_LEAF  = 'rgb(80,200,40)';
const SV_BOLT  = 'rgb(255,240,80)';

function createSylvaronSprite(scale) {
    scale = scale || 5;
    const grid = [
        [T,T,T,SV_LEAF,SV_LEAF,SV_LEAF,SV_LEAF,T,T,SV_LEAF,SV_LEAF,SV_LEAF,SV_LEAF,T,T,T],
        [T,T,SV_LEAF,SV_LEAF,SV_LEAF,SV_LEAF,SV_LEAF,SV_LEAF,SV_LEAF,SV_LEAF,SV_LEAF,SV_LEAF,SV_LEAF,SV_LEAF,T,T],
        [T,SV_LEAF,SV_LEAF,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_LEAF,SV_LEAF,T],
        [T,T,SV_BODY,SV_BODY,SV_EYE,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_EYE,SV_BODY,SV_BODY,T,T],
        [T,T,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,T,T],
        [T,T,T,SV_BODY,SV_BODY,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_BODY,SV_BODY,T,T,T],
        [T,SV_BOLT,T,SV_BODY,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_BODY,T,SV_BOLT,T],
        [SV_BOLT,SV_BOLT,T,SV_BODY,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_BODY,T,SV_BOLT,SV_BOLT],
        [T,SV_BOLT,T,SV_BODY,SV_BODY,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_LIGHT,SV_BODY,SV_BODY,T,SV_BOLT,T],
        [T,T,T,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,T,T,T],
        [T,T,T,T,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_BODY,T,T,T,T],
        [T,T,T,T,SV_DARK,SV_DARK,SV_BODY,SV_BODY,SV_BODY,SV_BODY,SV_DARK,SV_DARK,T,T,T,T],
        [T,T,T,T,SV_DARK,SV_DARK,T,SV_DARK,SV_DARK,T,SV_DARK,SV_DARK,T,T,T,T],
        [T,T,T,T,SV_DARK,T,T,SV_DARK,SV_DARK,T,T,SV_DARK,T,T,T,T],
        [T,T,T,SV_LEAF,SV_LEAF,T,T,T,T,T,T,SV_LEAF,SV_LEAF,T,T,T],
        [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    ];
    return gridToCanvas(grid, scale);
}
