/**
 * constants.js - Global constants for the Monster Trainer RPG (Web version).
 */

const GAME_VERSION = 'v1.4.0';
const TILE_SIZE = 48;
const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 720;
const FPS = 60;
const GAME_TITLE = "מאלף המפלצות של אופק";

// Colors
const BLACK   = '#000000';
const WHITE   = '#ffffff';
const RED     = '#dc3232';
const GREEN   = '#22b14c';
const BLUE    = '#3278dc';
const YELLOW  = '#ffd232';
const GRAY    = '#828282';
const DARK_GRAY = '#3c3c3c';
const LIGHT_GRAY = '#c8c8c8';

// Tile palette
const COLOR_GRASS      = '#64c850';
const COLOR_TALL_GRASS = '#288c28';
const COLOR_PATH       = '#d2b482';
const COLOR_WATER      = '#4682d2';
const COLOR_WALL       = '#5a5a5a';
const COLOR_BUILDING   = '#b4783c';
const COLOR_DOOR       = '#dcaa3c';
const COLOR_HEAL_TILE  = '#ffb4c8';

// Type colors
const TYPE_COLORS = {
    FIRE:     '#f05028',
    WATER:    '#3c8cf0',
    GRASS:    '#50c850',
    NORMAL:   '#b4b4a0',
    ELECTRIC: '#fadc32',
    ICE:      '#78d0f0',
    DARK:     '#6e5090',
};

// Tile IDs
const TILE_GRASS      = 0;
const TILE_TALL_GRASS = 1;
const TILE_PATH       = 2;
const TILE_WALL       = 3;
const TILE_WATER      = 4;
const TILE_BUILDING   = 5;
const TILE_DOOR       = 6;
const TILE_HEAL       = 7;
const TILE_SHOP_DOOR  = 8;
const TILE_CAVE_WALL  = 9;
const TILE_CAVE_DOOR  = 10;

const IMPASSABLE_TILES = new Set([TILE_WALL, TILE_WATER, TILE_BUILDING, TILE_CAVE_WALL]);

const COLOR_SHOP_DOOR = '#66bb66';
const COLOR_CAVE_WALL = '#4a3a2a';
const COLOR_CAVE_DOOR = '#2a1a0a';

const TILE_COLOR_MAP = {
    [TILE_GRASS]:      COLOR_GRASS,
    [TILE_TALL_GRASS]: COLOR_TALL_GRASS,
    [TILE_PATH]:       COLOR_PATH,
    [TILE_WALL]:       COLOR_WALL,
    [TILE_WATER]:      COLOR_WATER,
    [TILE_BUILDING]:   COLOR_BUILDING,
    [TILE_DOOR]:       COLOR_DOOR,
    [TILE_HEAL]:       COLOR_HEAL_TILE,
    [TILE_SHOP_DOOR]:  COLOR_SHOP_DOOR,
    [TILE_CAVE_WALL]:  COLOR_CAVE_WALL,
    [TILE_CAVE_DOOR]:  COLOR_CAVE_DOOR,
};

const TILE_NAMES = {
    [TILE_GRASS]:      'grass',
    [TILE_TALL_GRASS]: 'tall_grass',
    [TILE_PATH]:       'path',
    [TILE_WALL]:       'wall',
    [TILE_WATER]:      'water',
    [TILE_BUILDING]:   'building',
    [TILE_DOOR]:       'door',
    [TILE_HEAL]:       'heal',
    [TILE_SHOP_DOOR]:  'shop',
    [TILE_CAVE_WALL]:  'cave_wall',
    [TILE_CAVE_DOOR]:  'cave_door',
};

// Gameplay
const ENCOUNTER_CHANCE = 0.15;
const CATCH_BASE_RATE  = 0.40;
const MAX_PARTY_SIZE   = 6;

// Hebrew type names
const TYPE_NAMES_HE = {
    FIRE:     'אש',
    WATER:    'מים',
    GRASS:    'דשא',
    NORMAL:   'רגיל',
    ELECTRIC: 'חשמל',
    ICE:      'קרח',
    DARK:     'חושך',
};

// Type effectiveness chart (7x7)
const TYPE_CHART = {
    FIRE:     { FIRE: 0.5, WATER: 0.5, GRASS: 2.0, NORMAL: 1.0, ELECTRIC: 1.0, ICE: 2.0, DARK: 1.0 },
    WATER:    { FIRE: 2.0, WATER: 0.5, GRASS: 0.5, NORMAL: 1.0, ELECTRIC: 1.0, ICE: 1.0, DARK: 1.0 },
    GRASS:    { FIRE: 0.5, WATER: 2.0, GRASS: 0.5, NORMAL: 1.0, ELECTRIC: 1.0, ICE: 1.0, DARK: 1.0 },
    NORMAL:   { FIRE: 1.0, WATER: 1.0, GRASS: 1.0, NORMAL: 1.0, ELECTRIC: 1.0, ICE: 1.0, DARK: 1.0 },
    ELECTRIC: { FIRE: 1.0, WATER: 2.0, GRASS: 0.5, NORMAL: 1.0, ELECTRIC: 0.5, ICE: 1.0, DARK: 1.0 },
    ICE:      { FIRE: 0.5, WATER: 0.5, GRASS: 2.0, NORMAL: 1.0, ELECTRIC: 1.0, ICE: 0.5, DARK: 1.0 },
    DARK:     { FIRE: 1.0, WATER: 1.0, GRASS: 1.0, NORMAL: 1.0, ELECTRIC: 1.0, ICE: 1.0, DARK: 0.5 },
};
