/**
 * monsters.js - Monster & Move definitions, species database, damage math.
 */

class Move {
    constructor(name, moveType, power, accuracy, pp = 20) {
        this.name = name;
        this.moveType = moveType;
        this.power = power;
        this.accuracy = accuracy;
        this.pp = pp;
        this.currentPP = pp;
    }
    clone() {
        return new Move(this.name, this.moveType, this.power, this.accuracy, this.pp);
    }
}

class Monster {
    constructor(name, speciesId, monType, level, baseHp, baseAttack, baseDefense, baseSpeed, moves = []) {
        this.name = name;
        this.speciesId = speciesId;
        this.monType = monType;
        this.level = level;
        this.experience = 0;
        this.xpToNext = this._xpForLevel(level + 1);

        this._baseHp = baseHp;
        this._baseAttack = baseAttack;
        this._baseDefense = baseDefense;
        this._baseSpeed = baseSpeed;

        this.maxHp = this._scaleHp(baseHp, level);
        this.hp = this.maxHp;
        this.attack = this._scaleStat(baseAttack, level);
        this.defense = this._scaleStat(baseDefense, level);
        this.speed = this._scaleStat(baseSpeed, level);

        this.moves = moves;
    }

    _scaleHp(base, level) {
        return Math.floor((2 * base * level) / 100) + level + 10;
    }
    _scaleStat(base, level) {
        return Math.floor((2 * base * level) / 100) + 5;
    }
    _xpForLevel(level) {
        return level * level * level;
    }

    gainXp(amount) {
        const messages = [];
        this.experience += amount;
        messages.push(`${this.name} קיבל ${amount} נק' ניסיון!`);

        while (this.experience >= this.xpToNext && this.level < 100) {
            this.level++;
            this.experience -= this.xpToNext;
            this.xpToNext = this._xpForLevel(this.level + 1);
            this._recalcStats();
            messages.push(`${this.name} עלה לרמה ${this.level}!`);

            // Check for new moves at this level
            const species = SPECIES_DB[this.speciesId];
            if (species) {
                for (const [reqLv, moveName] of species.learnable) {
                    if (reqLv === this.level && !this.moves.some(m => m.name === MOVE_DB[moveName].name)) {
                        const newMove = MOVE_DB[moveName].clone();
                        if (this.moves.length < 4) {
                            this.moves.push(newMove);
                            messages.push(`${this.name} למד ${newMove.name}!`);
                        } else {
                            // Replace oldest move
                            const replaced = this.moves.shift();
                            this.moves.push(newMove);
                            messages.push(`${this.name} למד ${newMove.name} במקום ${replaced.name}!`);
                        }
                    }
                }
            }

            // Check for evolution
            if (species && species.evolvesTo && species.evolveLevel && this.level >= species.evolveLevel) {
                const evoResult = this.evolve();
                if (evoResult) {
                    messages.push(...evoResult);
                }
            }
        }
        return messages;
    }

    evolve() {
        const species = SPECIES_DB[this.speciesId];
        if (!species || !species.evolvesTo) return null;
        const evoSpecies = SPECIES_DB[species.evolvesTo];
        if (!evoSpecies) return null;

        const oldName = this.name;
        this.name = evoSpecies.name;
        this.speciesId = species.evolvesTo;
        this.monType = evoSpecies.type;
        this._baseHp = evoSpecies.baseHp;
        this._baseAttack = evoSpecies.baseAttack;
        this._baseDefense = evoSpecies.baseDefense;
        this._baseSpeed = evoSpecies.baseSpeed;
        this._recalcStats();
        this.hp = this.maxHp; // Full heal on evolution

        // Learn any moves available at current level for new species
        for (const [reqLv, moveName] of evoSpecies.learnable) {
            if (reqLv <= this.level && !this.moves.some(m => m.name === MOVE_DB[moveName].name)) {
                const newMove = MOVE_DB[moveName].clone();
                if (this.moves.length < 4) {
                    this.moves.push(newMove);
                } else {
                    this.moves.shift();
                    this.moves.push(newMove);
                }
            }
        }

        return [
            `?...מה זה! ${oldName} מתפתח`,
            `!${oldName} התפתח ל${this.name}`,
        ];
    }

    _recalcStats() {
        const oldMax = this.maxHp;
        this.maxHp = this._scaleHp(this._baseHp, this.level);
        this.hp += (this.maxHp - oldMax);
        this.attack = this._scaleStat(this._baseAttack, this.level);
        this.defense = this._scaleStat(this._baseDefense, this.level);
        this.speed = this._scaleStat(this._baseSpeed, this.level);
    }

    get isFainted() { return this.hp <= 0; }

    takeDamage(amount) { this.hp = Math.max(0, this.hp - amount); }
    heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }

    fullHeal() {
        this.hp = this.maxHp;
        for (const m of this.moves) m.currentPP = m.pp;
    }
}

// Move database
const MOVE_DB = {
    'Ember':       new Move('גחלת',       'FIRE',     40, 100),
    'Flame Burst': new Move('פרץ להבה',   'FIRE',     65, 90),
    'Inferno':     new Move('תופת',       'FIRE',     90, 75),
    'Splash':      new Move('התזה',       'WATER',    40, 100),
    'Aqua Jet':    new Move('סילון מים',  'WATER',    60, 95),
    'Tidal Wave':  new Move('גל ענק',     'WATER',    85, 80),
    'Vine Whip':   new Move('שוט גפן',    'GRASS',    40, 100),
    'Leaf Blade':  new Move('להב עלים',   'GRASS',    65, 95),
    'Solar Beam':  new Move('קרן שמש',    'GRASS',    90, 80),
    'Tackle':      new Move('התנגשות',     'NORMAL',   35, 100),
    'Headbutt':    new Move('נגיחה',       'NORMAL',   55, 95),
    'Slam':        new Move('טריקה',       'NORMAL',   70, 85),
    'Spark':       new Move('ניצוץ',       'ELECTRIC', 40, 100),
    'Thunderbolt': new Move('ברק',         'ELECTRIC', 75, 90),
    'Ice Shard':   new Move('רסיס קרח',   'ICE',      40, 100),
    'Frost Bite':  new Move('נשיכת כפור', 'ICE',      60, 95),
    'Blizzard':    new Move('סופת שלג',   'ICE',      90, 75),
    'Shadow Claw': new Move('טופר צל',    'DARK',     45, 100),
    'Dark Pulse':  new Move('פולס חושך',  'DARK',     65, 90),
    'Nightmare':   new Move('סיוט',       'DARK',     85, 80),
    // New moves
    'Fire Fang':    new Move('נשיכת אש',   'FIRE',     50, 95),
    'Lava Blast':   new Move('פיצוץ לבה',  'FIRE',     80, 85),
    'Water Pulse':  new Move('פולס מים',   'WATER',    50, 100),
    'Hydro Pump':   new Move('משאבת מים',  'WATER',    95, 75),
    'Razor Leaf':   new Move('עלה חד',     'GRASS',    50, 95),
    'Petal Storm':  new Move('סערת עלי כותרת','GRASS', 85, 80),
    'Body Slam':    new Move('מעיכה',      'NORMAL',   75, 90),
    'Hyper Strike': new Move('מכת על',     'NORMAL',   85, 80),
    'Volt Tackle':  new Move('התנגשות חשמל','ELECTRIC', 85, 80),
    'Thunder':      new Move('רעם',        'ELECTRIC', 95, 70),
    'Ice Beam':     new Move('קרן קרח',    'ICE',      70, 90),
    'Hail Storm':   new Move('סופת ברד',   'ICE',      80, 85),
    'Shadow Ball':  new Move('כדור צל',    'DARK',     75, 90),
    'Doom Strike':  new Move('מכת אבדון',  'DARK',     90, 75),
    'Quick Attack': new Move('התקפה מהירה','NORMAL',   40, 100),
    'Crunch':       new Move('כתיתה',      'DARK',     70, 95),
    // Legendary moves
    'Dragon Blaze': new Move('להבת דרקון',  'FIRE',    100, 85),
    'Ofek Inferno': new Move('גיהינום של אופק','FIRE',  120, 80),
    'Abyssal Wave': new Move('גל תהומי',    'WATER',   100, 85),
    'Forest Wrath': new Move('זעם היער',     'GRASS',   100, 85),
    'Dark Nova':    new Move('נובה חשוכה',   'DARK',     95, 80),
    'Frost Nova':   new Move('נובה קפואה',   'ICE',      95, 80),
    'Thunder Storm':new Move('סערת רעמים',   'ELECTRIC', 95, 80),
};

// Species database
const SPECIES_DB = {
    1: {
        name: 'להביון', type: 'FIRE',
        baseHp: 45, baseAttack: 60, baseDefense: 40, baseSpeed: 65,
        learnable: [[1,'Tackle'],[1,'Ember'],[8,'Flame Burst'],[16,'Inferno']],
        color: '#f06432', evolvesTo: 31, evolveLevel: 10,
    },
    2: {
        name: 'דולפינון', type: 'WATER',
        baseHp: 50, baseAttack: 48, baseDefense: 55, baseSpeed: 55,
        learnable: [[1,'Tackle'],[1,'Splash'],[8,'Aqua Jet'],[16,'Tidal Wave']],
        color: '#3c96f0', evolvesTo: 32, evolveLevel: 10,
    },
    3: {
        name: 'קוצניק', type: 'GRASS',
        baseHp: 55, baseAttack: 50, baseDefense: 60, baseSpeed: 45,
        learnable: [[1,'Tackle'],[1,'Vine Whip'],[8,'Leaf Blade'],[16,'Solar Beam']],
        color: '#3cbe46', evolvesTo: 33, evolveLevel: 10,
    },
    4: {
        name: 'זיקית', type: 'ELECTRIC',
        baseHp: 40, baseAttack: 55, baseDefense: 35, baseSpeed: 75,
        learnable: [[1,'Tackle'],[1,'Spark'],[10,'Thunderbolt']],
        color: '#fadc32', evolvesTo: 34, evolveLevel: 10,
    },
    5: {
        name: 'נובחן', type: 'NORMAL',
        baseHp: 60, baseAttack: 55, baseDefense: 50, baseSpeed: 50,
        learnable: [[1,'Tackle'],[5,'Headbutt'],[12,'Slam']],
        color: '#b48c64', evolvesTo: 35, evolveLevel: 10,
    },
    6: {
        name: 'קרחון', type: 'ICE',
        baseHp: 65, baseAttack: 45, baseDefense: 70, baseSpeed: 35,
        learnable: [[1,'Tackle'],[1,'Ice Shard'],[8,'Frost Bite'],[18,'Blizzard']],
        color: '#78d0f0', evolvesTo: 36, evolveLevel: 10,
    },
    7: {
        name: 'צלילית', type: 'DARK',
        baseHp: 42, baseAttack: 65, baseDefense: 38, baseSpeed: 72,
        learnable: [[1,'Tackle'],[1,'Shadow Claw'],[8,'Dark Pulse'],[16,'Nightmare']],
        color: '#6e5090', evolvesTo: 37, evolveLevel: 10,
    },
    8: {
        name: 'שלגיל', type: 'ICE',
        baseHp: 50, baseAttack: 55, baseDefense: 55, baseSpeed: 50,
        learnable: [[1,'Tackle'],[1,'Ice Shard'],[6,'Headbutt'],[12,'Frost Bite']],
        color: '#aaddf0', evolvesTo: 38, evolveLevel: 10,
    },
    9: {
        name: 'עטלפן', type: 'DARK',
        baseHp: 48, baseAttack: 58, baseDefense: 42, baseSpeed: 68,
        learnable: [[1,'Tackle'],[1,'Shadow Claw'],[7,'Dark Pulse'],[14,'Nightmare']],
        color: '#553388', evolvesTo: 39, evolveLevel: 10,
    },
    10: {
        name: 'גלשן', type: 'WATER',
        baseHp: 55, baseAttack: 52, baseDefense: 48, baseSpeed: 62,
        learnable: [[1,'Tackle'],[1,'Splash'],[6,'Aqua Jet'],[14,'Tidal Wave']],
        color: '#5599dd', evolvesTo: 40, evolveLevel: 10,
    },
    11: {
        name: 'להבור', type: 'FIRE',
        baseHp: 58, baseAttack: 70, baseDefense: 45, baseSpeed: 60,
        learnable: [[1,'Tackle'],[1,'Fire Fang'],[8,'Flame Burst'],[15,'Lava Blast']],
        color: '#e04820',
    },
    12: {
        name: 'בועון', type: 'WATER',
        baseHp: 62, baseAttack: 44, baseDefense: 65, baseSpeed: 42,
        learnable: [[1,'Tackle'],[1,'Splash'],[7,'Water Pulse'],[16,'Hydro Pump']],
        color: '#44aaee',
    },
    13: {
        name: 'ירוקן', type: 'GRASS',
        baseHp: 48, baseAttack: 58, baseDefense: 50, baseSpeed: 62,
        learnable: [[1,'Tackle'],[1,'Razor Leaf'],[8,'Leaf Blade'],[16,'Petal Storm']],
        color: '#44aa44',
    },
    14: {
        name: 'רעמון', type: 'ELECTRIC',
        baseHp: 50, baseAttack: 68, baseDefense: 40, baseSpeed: 70,
        learnable: [[1,'Tackle'],[1,'Spark'],[8,'Thunderbolt'],[16,'Volt Tackle']],
        color: '#eecc22',
    },
    15: {
        name: 'כפורי', type: 'ICE',
        baseHp: 55, baseAttack: 50, baseDefense: 65, baseSpeed: 40,
        learnable: [[1,'Tackle'],[1,'Ice Shard'],[8,'Ice Beam'],[16,'Blizzard']],
        color: '#88ddff',
    },
    16: {
        name: 'צלמון', type: 'DARK',
        baseHp: 52, baseAttack: 72, baseDefense: 42, baseSpeed: 58,
        learnable: [[1,'Tackle'],[1,'Shadow Claw'],[8,'Shadow Ball'],[16,'Doom Strike']],
        color: '#554488',
    },
    17: {
        name: 'אריון', type: 'FIRE',
        baseHp: 65, baseAttack: 62, baseDefense: 55, baseSpeed: 50,
        learnable: [[1,'Tackle'],[1,'Ember'],[6,'Fire Fang'],[12,'Inferno']],
        color: '#dd6622',
    },
    18: {
        name: 'סנפירון', type: 'WATER',
        baseHp: 45, baseAttack: 55, baseDefense: 45, baseSpeed: 72,
        learnable: [[1,'Tackle'],[1,'Water Pulse'],[8,'Aqua Jet'],[14,'Tidal Wave']],
        color: '#3388cc',
    },
    19: {
        name: 'עלעל', type: 'GRASS',
        baseHp: 60, baseAttack: 45, baseDefense: 70, baseSpeed: 38,
        learnable: [[1,'Tackle'],[1,'Vine Whip'],[7,'Razor Leaf'],[15,'Solar Beam']],
        color: '#33bb55',
    },
    20: {
        name: 'הברקן', type: 'ELECTRIC',
        baseHp: 42, baseAttack: 60, baseDefense: 38, baseSpeed: 78,
        learnable: [[1,'Quick Attack'],[1,'Spark'],[8,'Thunderbolt'],[16,'Thunder']],
        color: '#ffdd44',
    },
    21: {
        name: 'קפאון', type: 'ICE',
        baseHp: 70, baseAttack: 42, baseDefense: 75, baseSpeed: 30,
        learnable: [[1,'Tackle'],[1,'Ice Shard'],[8,'Frost Bite'],[15,'Hail Storm']],
        color: '#66ccee',
    },
    22: {
        name: 'אפלון', type: 'DARK',
        baseHp: 55, baseAttack: 66, baseDefense: 50, baseSpeed: 55,
        learnable: [[1,'Tackle'],[1,'Shadow Claw'],[7,'Crunch'],[14,'Nightmare']],
        color: '#443366',
    },
    23: {
        name: 'זנבור', type: 'NORMAL',
        baseHp: 50, baseAttack: 60, baseDefense: 48, baseSpeed: 65,
        learnable: [[1,'Quick Attack'],[1,'Tackle'],[8,'Headbutt'],[14,'Body Slam']],
        color: '#ccaa66',
    },
    24: {
        name: 'לבהב', type: 'FIRE',
        baseHp: 40, baseAttack: 75, baseDefense: 35, baseSpeed: 72,
        learnable: [[1,'Ember'],[1,'Quick Attack'],[8,'Flame Burst'],[16,'Lava Blast']],
        color: '#ff5533',
    },
    25: {
        name: 'מעיין', type: 'WATER',
        baseHp: 68, baseAttack: 48, baseDefense: 60, baseSpeed: 40,
        learnable: [[1,'Tackle'],[1,'Splash'],[8,'Water Pulse'],[16,'Hydro Pump']],
        color: '#2277bb',
    },
    26: {
        name: 'שיחון', type: 'GRASS',
        baseHp: 52, baseAttack: 55, baseDefense: 55, baseSpeed: 55,
        learnable: [[1,'Tackle'],[1,'Vine Whip'],[7,'Leaf Blade'],[14,'Petal Storm']],
        color: '#55cc33',
    },
    27: {
        name: 'חשמלית', type: 'ELECTRIC',
        baseHp: 55, baseAttack: 52, baseDefense: 55, baseSpeed: 55,
        learnable: [[1,'Tackle'],[1,'Spark'],[8,'Thunderbolt'],[15,'Volt Tackle']],
        color: '#ddbb33',
    },
    28: {
        name: 'שלגון', type: 'ICE',
        baseHp: 58, baseAttack: 58, baseDefense: 58, baseSpeed: 44,
        learnable: [[1,'Tackle'],[1,'Ice Shard'],[7,'Ice Beam'],[14,'Blizzard']],
        color: '#99ddee',
    },
    29: {
        name: 'ליליון', type: 'DARK',
        baseHp: 46, baseAttack: 70, baseDefense: 40, baseSpeed: 68,
        learnable: [[1,'Quick Attack'],[1,'Shadow Claw'],[8,'Dark Pulse'],[16,'Doom Strike']],
        color: '#774499',
    },
    30: {
        name: 'גורילון', type: 'NORMAL',
        baseHp: 75, baseAttack: 65, baseDefense: 60, baseSpeed: 35,
        learnable: [[1,'Tackle'],[1,'Headbutt'],[8,'Body Slam'],[16,'Hyper Strike']],
        color: '#998866',
    },
    // === Evolved forms (level 10 evolutions) ===
    31: {
        name: 'להביאור', type: 'FIRE',
        baseHp: 65, baseAttack: 80, baseDefense: 55, baseSpeed: 78,
        learnable: [[1,'Tackle'],[1,'Ember'],[1,'Flame Burst'],[10,'Fire Fang'],[16,'Inferno'],[20,'Lava Blast']],
        color: '#ff4020',
    },
    32: {
        name: 'דולפיגון', type: 'WATER',
        baseHp: 72, baseAttack: 65, baseDefense: 72, baseSpeed: 68,
        learnable: [[1,'Tackle'],[1,'Splash'],[1,'Aqua Jet'],[10,'Water Pulse'],[16,'Tidal Wave'],[20,'Hydro Pump']],
        color: '#2070d0',
    },
    33: {
        name: 'קוצנאור', type: 'GRASS',
        baseHp: 75, baseAttack: 68, baseDefense: 78, baseSpeed: 58,
        learnable: [[1,'Tackle'],[1,'Vine Whip'],[1,'Leaf Blade'],[10,'Razor Leaf'],[16,'Solar Beam'],[20,'Petal Storm']],
        color: '#228830',
    },
    34: {
        name: 'זיקיטור', type: 'ELECTRIC',
        baseHp: 58, baseAttack: 75, baseDefense: 50, baseSpeed: 88,
        learnable: [[1,'Tackle'],[1,'Spark'],[1,'Thunderbolt'],[10,'Quick Attack'],[16,'Volt Tackle'],[20,'Thunder']],
        color: '#e8b800',
    },
    35: {
        name: 'נובחאון', type: 'NORMAL',
        baseHp: 80, baseAttack: 72, baseDefense: 65, baseSpeed: 62,
        learnable: [[1,'Tackle'],[1,'Headbutt'],[1,'Slam'],[10,'Body Slam'],[16,'Hyper Strike'],[20,'Crunch']],
        color: '#9a7048',
    },
    36: {
        name: 'קרחיאל', type: 'ICE',
        baseHp: 85, baseAttack: 60, baseDefense: 88, baseSpeed: 45,
        learnable: [[1,'Tackle'],[1,'Ice Shard'],[1,'Frost Bite'],[10,'Ice Beam'],[16,'Blizzard'],[20,'Hail Storm']],
        color: '#50b8e0',
    },
    37: {
        name: 'צללאור', type: 'DARK',
        baseHp: 60, baseAttack: 85, baseDefense: 52, baseSpeed: 85,
        learnable: [[1,'Tackle'],[1,'Shadow Claw'],[1,'Dark Pulse'],[10,'Crunch'],[16,'Nightmare'],[20,'Doom Strike']],
        color: '#4a2878',
    },
    38: {
        name: 'שלגיאור', type: 'ICE',
        baseHp: 68, baseAttack: 72, baseDefense: 72, baseSpeed: 62,
        learnable: [[1,'Tackle'],[1,'Ice Shard'],[1,'Headbutt'],[10,'Frost Bite'],[16,'Ice Beam'],[20,'Blizzard']],
        color: '#88c8e8',
    },
    39: {
        name: 'עטלפאור', type: 'DARK',
        baseHp: 65, baseAttack: 76, baseDefense: 56, baseSpeed: 82,
        learnable: [[1,'Tackle'],[1,'Shadow Claw'],[1,'Dark Pulse'],[10,'Shadow Ball'],[16,'Nightmare'],[20,'Doom Strike']],
        color: '#3a2068',
    },
    40: {
        name: 'גלשיאון', type: 'WATER',
        baseHp: 72, baseAttack: 70, baseDefense: 62, baseSpeed: 76,
        learnable: [[1,'Tackle'],[1,'Splash'],[1,'Aqua Jet'],[10,'Water Pulse'],[16,'Tidal Wave'],[20,'Hydro Pump']],
        color: '#3380c0',
    },
    // === Legendary monsters ===
    41: {
        name: 'דרקולהב', type: 'FIRE', legendary: true,
        baseHp: 100, baseAttack: 110, baseDefense: 90, baseSpeed: 95,
        learnable: [[1,'Ember'],[1,'Shadow Claw'],[1,'Flame Burst'],[5,'Dark Pulse'],[10,'Inferno'],[15,'Dragon Blaze'],[20,'Dark Nova']],
        color: '#cc2020',
    },
    42: {
        name: 'אקווריון', type: 'WATER', legendary: true,
        baseHp: 110, baseAttack: 95, baseDefense: 105, baseSpeed: 85,
        learnable: [[1,'Splash'],[1,'Ice Shard'],[1,'Aqua Jet'],[5,'Frost Bite'],[10,'Tidal Wave'],[15,'Abyssal Wave'],[20,'Frost Nova']],
        color: '#2060cc',
    },
    43: {
        name: 'סילבארון', type: 'GRASS', legendary: true,
        baseHp: 95, baseAttack: 100, baseDefense: 95, baseSpeed: 105,
        learnable: [[1,'Vine Whip'],[1,'Spark'],[1,'Leaf Blade'],[5,'Thunderbolt'],[10,'Solar Beam'],[15,'Forest Wrath'],[20,'Thunder Storm']],
        color: '#20aa40',
    },
    // === Cave Boss ===
    44: {
        name: 'דרקו אופק', type: 'FIRE', legendary: true,
        baseHp: 120, baseAttack: 115, baseDefense: 100, baseSpeed: 90,
        learnable: [[1,'Ember'],[1,'Dragon Blaze'],[1,'Inferno'],[1,'Ofek Inferno']],
        color: '#ff3300',
    },
};

function createMonster(speciesId, level) {
    const data = SPECIES_DB[speciesId];
    const knownMoves = data.learnable
        .filter(([reqLv]) => reqLv <= level)
        .map(([, name]) => MOVE_DB[name].clone())
        .slice(-4);

    return new Monster(
        data.name, speciesId, data.type, level,
        data.baseHp, data.baseAttack, data.baseDefense, data.baseSpeed,
        knownMoves
    );
}

function calcDamage(attacker, defender, move) {
    const effectiveness = (TYPE_CHART[move.moveType] || {})[defender.monType] || 1.0;
    const levelFactor = (2 * attacker.level / 5) + 2;
    let raw = (levelFactor * move.power * attacker.attack / Math.max(1, defender.defense)) / 50 + 2;
    raw *= effectiveness;
    raw *= 0.85 + Math.random() * 0.15;
    return [Math.max(1, Math.floor(raw)), effectiveness];
}
