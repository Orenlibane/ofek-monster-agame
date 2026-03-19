/**
 * game.js - Main game controller and loop for Ofek's Monster Trainer (Web).
 */

const GameState = {
    START_SCREEN:    'start_screen',
    CHOOSE_STARTER:  'choose_starter',
    OVERWORLD:       'overworld',
    BATTLE:          'battle',
    PARTY:           'party',
    COLLECTION:      'collection',
    SETTINGS:        'settings',
    MONSTERPEDIA:    'monsterpedia',
    SHOP:            'shop',
    TRANSITION_IN:   'transition_in',
    TRANSITION_OUT:  'transition_out',
};

const SETTINGS_OPTIONS = [
    ['battle_speed',   3],
    ['text_speed',     3],
    ['battle_effects', 2],
    ['sound',          2],
    ['god_mode',       2],
    ['save_game',      0],  // 0 = action button (no cycling)
];

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        canvas.width = SCREEN_WIDTH;
        canvas.height = SCREEN_HEIGHT;
        // Set canvas direction for proper Hebrew text rendering
        canvas.style.direction = 'ltr';
        this.ctx.direction = 'ltr';

        // World
        this.gameMap = new GameMap();

        // Player setup (starter chosen later)
        this.player = new Player('Ofek', 3, 6);
        this.player.inventory.add('כמוסת לכידה', 10);
        this.player.inventory.add('שיקוי ריפוי', 5);

        // Starter selection
        this.starterOptions = [1, 2, 3]; // Fire, Water, Grass
        this.starterCursor = 0;

        // Storage
        this.storage = new Storage();

        // Settings
        this.settings = {
            battle_speed: 1,
            text_speed: 1,
            battle_effects: 1,
            sound: 1,
            god_mode: 0,
        };
        this.settingsCursor = 0;

        // Monsterpedia
        this.monsterpediaCursor = 0;
        this.monsterpediaScroll = 0;

        // Collection
        this.collectionCursor = 0;

        // Shop
        this.shopCursor = 0;
        this.shopItems = [
            { name: 'כמוסת לכידה',     price: 50,  desc: 'תופסת מפלצות פראיות' },
            { name: 'כמוסת על',         price: 150, desc: 'סיכוי לכידה גבוה x2' },
            { name: 'שיקוי ריפוי',      price: 40,  desc: 'מרפא 30 HP' },
            { name: 'שיקוי סופר',       price: 100, desc: 'מרפא 80 HP' },
            { name: 'שיקוי מלא',        price: 250, desc: 'מרפא HP מלא' },
            { name: 'מגן תקיפה',        price: 200, desc: 'מגביר תקיפה בקרב הבא' },
        ];

        // NPC Trainers
        this.trainers = this._createTrainers();

        // Animation systems
        this._frameCount = 0;
        this.particles = new ParticleSystem();
        this.screenShake = new ScreenShake();
        this.floatingTexts = [];

        // Game state
        this.state = GameState.START_SCREEN;
        this.battle = null;
        this.partyCursor = 0;
        this._healFlash = 0;
        this._saveFlash = 0;

        // Transition
        this._transitionProgress = 0.0;
        this._transitionSpeed = 0.04;
        this._pendingEnemy = null;
        this._pendingTrainer = null;
        this._shopMessage = '';
        this._shopMsgTimer = 0;

        // Current user (set by login)
        this._currentUser = null;

        // Input
        this._keysDown = new Set();
        this._setupInput();

        // Start loop
        this._lastTime = 0;
        this._frameDuration = 1000 / FPS;
        this._accumulator = 0;
        requestAnimationFrame((t) => this._loop(t));
    }

    _setupInput() {
        document.addEventListener('keydown', (e) => {
            // Prevent default for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'z', 'Z', 'p', 'P', 's', 'S', 'd', 'D', 'c', 'C'].includes(e.key)) {
                e.preventDefault();
            }
            this._onKeyDown(e.key);
        });
    }

    // Main loop
    _loop(timestamp) {
        const delta = timestamp - this._lastTime;
        this._lastTime = timestamp;
        this._accumulator += delta;

        // Fixed timestep
        while (this._accumulator >= this._frameDuration) {
            this._update();
            this._accumulator -= this._frameDuration;
        }

        this._render();
        requestAnimationFrame((t) => this._loop(t));
    }

    // Input handling
    _onKeyDown(key) {
        if (this.state === GameState.START_SCREEN) {
            if (key === 'Enter' || key === 'z' || key === 'Z') {
                this.state = GameState.CHOOSE_STARTER;
                this.starterCursor = 0;
            }
        } else if (this.state === GameState.CHOOSE_STARTER) {
            this._starterKey(key);
        } else if (this.state === GameState.OVERWORLD) {
            this._overworldKey(key);
        } else if (this.state === GameState.BATTLE) {
            if (this.battle) {
                this.battle.handleInput(key);
            }
        } else if (this.state === GameState.PARTY) {
            this._partyKey(key);
        } else if (this.state === GameState.SETTINGS) {
            this._settingsKey(key);
        } else if (this.state === GameState.MONSTERPEDIA) {
            this._monsterpediaKey(key);
        } else if (this.state === GameState.COLLECTION) {
            this._collectionKey(key);
        } else if (this.state === GameState.SHOP) {
            this._shopKey(key);
        }
    }

    _overworldKey(key) {
        let dx = 0, dy = 0;
        if (key === 'ArrowUp') dy = -1;
        else if (key === 'ArrowDown') dy = 1;
        else if (key === 'ArrowLeft') dx = -1;
        else if (key === 'ArrowRight') dx = 1;
        else if (key === 'p' || key === 'P') {
            this.state = GameState.PARTY;
            this.partyCursor = 0;
            return;
        } else if (key === 's' || key === 'S') {
            this.state = GameState.SETTINGS;
            this.settingsCursor = 0;
            return;
        } else if (key === 'd' || key === 'D') {
            this.state = GameState.MONSTERPEDIA;
            this.monsterpediaCursor = 0;
            this.monsterpediaScroll = 0;
            return;
        } else if (key === 'c' || key === 'C') {
            this.state = GameState.COLLECTION;
            this.collectionCursor = 0;
            return;
        } else {
            return;
        }

        const tileName = this.player.tryMove(dx, dy, this.gameMap);
        if (!tileName) return;

        if (tileName === 'tall_grass') {
            const wild = this.gameMap.checkEncounter(this.player.col, this.player.row);
            if (wild) {
                this._startBattle(wild);
            }
        } else if (tileName === 'door' || tileName === 'heal') {
            this.player.healAll();
            this._healFlash = 30;
            saveGame(this);
        } else if (tileName === 'shop') {
            this.state = GameState.SHOP;
            this.shopCursor = 0;
            return;
        }

        // Check trainer vision
        if (this.state === GameState.OVERWORLD) {
            this._checkTrainerVision();
        }
    }

    _partyKey(key) {
        if (key === 'Escape') {
            this.state = GameState.OVERWORLD;
        } else if (key === 'ArrowUp') {
            this.partyCursor = Math.max(0, this.partyCursor - 1);
        } else if (key === 'ArrowDown') {
            this.partyCursor = Math.min(this.player.party.length - 1, this.partyCursor + 1);
        }
    }

    _settingsKey(key) {
        if (key === 'Escape') {
            this.state = GameState.OVERWORLD;
        } else if (key === 'ArrowUp') {
            this.settingsCursor = Math.max(0, this.settingsCursor - 1);
        } else if (key === 'ArrowDown') {
            this.settingsCursor = Math.min(SETTINGS_OPTIONS.length - 1, this.settingsCursor + 1);
        } else if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Enter' || key === 'z' || key === 'Z') {
            const [optKey, numChoices] = SETTINGS_OPTIONS[this.settingsCursor];

            // Handle save action
            if (optKey === 'save_game') {
                if (key === 'Enter' || key === 'z' || key === 'Z') {
                    const ok = saveGame(this);
                    this._shopMessage = ok ? '!המשחק נשמר בהצלחה' : '!שגיאה בשמירה';
                    this._shopMsgTimer = 90;
                    this._saveFlash = 30;
                }
                return;
            }

            if (key === 'Enter' || key === 'z' || key === 'Z') return;

            let current = this.settings[optKey] || 0;
            if (key === 'ArrowRight') {
                this.settings[optKey] = (current + 1) % numChoices;
            } else {
                this.settings[optKey] = (current - 1 + numChoices) % numChoices;
            }

            // God mode toggled on: register all species as discovered+caught, give coins
            if (optKey === 'god_mode' && this.settings.god_mode === 1) {
                for (const id of Object.keys(SPECIES_DB)) {
                    this.player.registerCaught(parseInt(id));
                }
                this.player.coins = Math.max(this.player.coins, 99999);
            }
        }
    }

    _monsterpediaKey(key) {
        const totalSpecies = Object.keys(SPECIES_DB).length;
        if (key === 'Escape') {
            this.state = GameState.OVERWORLD;
        } else if (key === 'ArrowUp') {
            this.monsterpediaCursor = Math.max(0, this.monsterpediaCursor - 1);
        } else if (key === 'ArrowDown') {
            this.monsterpediaCursor = Math.min(totalSpecies - 1, this.monsterpediaCursor + 1);
        }
    }

    _starterKey(key) {
        if (key === 'ArrowLeft') {
            this.starterCursor = (this.starterCursor - 1 + 3) % 3;
        } else if (key === 'ArrowRight') {
            this.starterCursor = (this.starterCursor + 1) % 3;
        } else if (key === 'Enter' || key === 'z' || key === 'Z') {
            const chosenId = this.starterOptions[this.starterCursor];
            const starter = createMonster(chosenId, 9);
            this.player.addToParty(starter);
            this.player.registerCaught(chosenId);
            this.state = GameState.OVERWORLD;
            saveGame(this);
        }
    }

    _collectionKey(key) {
        // All caught monsters: party + storage
        const allMonsters = [...this.player.party, ...this.storage.monsters];
        if (key === 'Escape') {
            this.state = GameState.OVERWORLD;
        } else if (key === 'ArrowUp') {
            this.collectionCursor = Math.max(0, this.collectionCursor - 1);
        } else if (key === 'ArrowDown') {
            this.collectionCursor = Math.min(allMonsters.length - 1, this.collectionCursor + 1);
        }
    }

    _shopKey(key) {
        if (key === 'Escape') {
            this.state = GameState.OVERWORLD;
        } else if (key === 'ArrowUp') {
            this.shopCursor = Math.max(0, this.shopCursor - 1);
        } else if (key === 'ArrowDown') {
            this.shopCursor = Math.min(this.shopItems.length - 1, this.shopCursor + 1);
        } else if (key === 'Enter' || key === 'z' || key === 'Z') {
            const item = this.shopItems[this.shopCursor];
            if (this.player.coins >= item.price) {
                this.player.coins -= item.price;
                this.player.inventory.add(item.name, 1);
                this._shopMessage = `!${item.name} נקנה`;
                this._shopMsgTimer = 60;
                saveGame(this);
            } else {
                this._shopMessage = '!אין לך מספיק מטבעות';
                this._shopMsgTimer = 60;
            }
        }
    }

    _createTrainers() {
        return [
            {
                id: 'trainer_1', name: 'דן', col: 14, row: 3, facing: 'down',
                visionRange: 3,
                party: [createMonster(4, 8), createMonster(14, 9)],
            },
            {
                id: 'trainer_2', name: 'מיכל', col: 22, row: 9, facing: 'left',
                visionRange: 4,
                party: [createMonster(2, 10), createMonster(6, 10)],
            },
            {
                id: 'trainer_3', name: 'אורי', col: 33, row: 19, facing: 'up',
                visionRange: 3,
                party: [createMonster(7, 12), createMonster(11, 11), createMonster(16, 12)],
            },
            {
                id: 'trainer_4', name: 'נועה', col: 5, row: 22, facing: 'right',
                visionRange: 3,
                party: [createMonster(3, 9), createMonster(13, 10)],
            },
            {
                id: 'trainer_5', name: 'גיא', col: 38, row: 33, facing: 'left',
                visionRange: 4,
                party: [createMonster(1, 14), createMonster(17, 13), createMonster(24, 14)],
            },
        ];
    }

    _checkTrainerVision() {
        for (const trainer of this.trainers) {
            if (this.player.defeatedTrainers.has(trainer.id)) continue;
            const dx = this.player.col - trainer.col;
            const dy = this.player.row - trainer.row;
            let inVision = false;
            if (trainer.facing === 'down' && dx === 0 && dy > 0 && dy <= trainer.visionRange) inVision = true;
            else if (trainer.facing === 'up' && dx === 0 && dy < 0 && Math.abs(dy) <= trainer.visionRange) inVision = true;
            else if (trainer.facing === 'right' && dy === 0 && dx > 0 && dx <= trainer.visionRange) inVision = true;
            else if (trainer.facing === 'left' && dy === 0 && dx < 0 && Math.abs(dx) <= trainer.visionRange) inVision = true;

            if (inVision) {
                this._startTrainerBattle(trainer);
                return;
            }
        }
    }

    _startTrainerBattle(trainer) {
        // Create fresh copies of trainer monsters for the battle
        const freshParty = trainer.party.map(m => {
            const fresh = createMonster(m.speciesId, m.level);
            return fresh;
        });
        this._pendingTrainer = { ...trainer, party: freshParty };
        this._pendingEnemy = freshParty[0];
        this._transitionProgress = 0.0;
        this.state = GameState.TRANSITION_IN;
    }

    // Transitions & battle lifecycle
    _startBattle(enemyMonster) {
        this._pendingEnemy = enemyMonster;
        this._pendingTrainer = null;
        this._transitionProgress = 0.0;
        this.state = GameState.TRANSITION_IN;
    }

    _beginBattle() {
        const playerMon = this.player.firstUsableMonster();
        if (playerMon === null) {
            this.state = GameState.OVERWORLD;
            return;
        }
        this.battle = new Battle(playerMon, this._pendingEnemy, this.player, this.storage, this._pendingTrainer);
        this.battle.godMode = (this.settings.god_mode === 1);
        this._pendingEnemy = null;
        this._pendingTrainer = null;
        this.state = GameState.BATTLE;
    }

    _endBattle() {
        const result = this.battle.result;
        // Mark trainer as defeated
        if (this.battle.isTrainerBattle && this.battle.trainerData && result === BattleResult.WIN) {
            this.player.defeatedTrainers.add(this.battle.trainerData.id);
        }
        if (result === BattleResult.LOSE) {
            this.player.healAll();
            this.player.col = 3;
            this.player.row = 6;
        }
        this.battle = null;
        this._transitionProgress = 1.0;
        this.state = GameState.TRANSITION_OUT;
        saveGame(this);
    }

    // Update
    _update() {
        this._frameCount++;
        this.player.update();
        this.particles.update();
        this.screenShake.update();
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update();
            if (!this.floatingTexts[i].alive) this.floatingTexts.splice(i, 1);
        }

        if (this.state === GameState.TRANSITION_IN) {
            this._transitionProgress += this._transitionSpeed;
            if (this._transitionProgress >= 1.0) {
                this._beginBattle();
            }
        } else if (this.state === GameState.TRANSITION_OUT) {
            this._transitionProgress -= this._transitionSpeed;
            if (this._transitionProgress <= 0.0) {
                this._transitionProgress = 0.0;
                this.state = GameState.OVERWORLD;
            }
        } else if (this.state === GameState.BATTLE && this.battle) {
            this.battle.update();
            if (this.battle.isOver) {
                this._endBattle();
            }
        }

        if (this._healFlash > 0) {
            this._healFlash--;
        }
        if (this._saveFlash > 0) {
            this._saveFlash--;
        }
        if (this._shopMsgTimer > 0) {
            this._shopMsgTimer--;
        }
    }

    // Render
    _render() {
        const ctx = this.ctx;
        ctx.fillStyle = BLACK;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        if (this.state === GameState.START_SCREEN) {
            this._renderStartScreen();
        } else if (this.state === GameState.CHOOSE_STARTER) {
            drawStarterSelection(ctx, this.starterCursor, this._frameCount);
        } else if (this.state === GameState.OVERWORLD) {
            drawOverworld(ctx, this.gameMap, this.player, this._frameCount, this.trainers, this.player.defeatedTrainers);
            this._renderDayNight();
            drawHud(ctx, this.player);
            this._renderHealFlash();
            this._renderControlsHint();
        } else if (this.state === GameState.BATTLE) {
            if (this.battle) {
                drawBattle(ctx, this.battle);
            }
        } else if (this.state === GameState.PARTY) {
            drawPartyScreen(ctx, this.player, this.partyCursor);
        } else if (this.state === GameState.COLLECTION) {
            drawCollectionScreen(ctx, this.player, this.storage, this.collectionCursor, this._frameCount);
        } else if (this.state === GameState.MONSTERPEDIA) {
            drawMonsterpedia(ctx, this.monsterpediaCursor, this._frameCount, this.player);
        } else if (this.state === GameState.SHOP) {
            drawShopScreen(ctx, this.player, this.shopItems, this.shopCursor, this._shopMessage, this._shopMsgTimer);
        } else if (this.state === GameState.SETTINGS) {
            drawOverworld(ctx, this.gameMap, this.player, this._frameCount);
            drawHud(ctx, this.player);
            drawSettingsScreen(ctx, this.settings, this.settingsCursor);
            // Save flash message
            if (this._saveFlash > 0) {
                const alpha = Math.min(1, this._saveFlash / 15);
                ctx.fillStyle = `rgba(50,200,255,${alpha * 0.06})`;
                ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                const msg = this._shopMessage;
                ctx.font = `bold 15px ${FONT_MAIN}`;
                const w = ctx.measureText(msg).width;
                const bx = SCREEN_WIDTH / 2 - w / 2 - 14;
                drawPanel(ctx, bx, 78, w + 28, 30, 'rgba(20,50,80,0.85)', 'rgba(100,180,220,0.5)', 1.5, 8);
                ctx.fillStyle = 'rgb(140,220,255)';
                ctx.fillText(msg, SCREEN_WIDTH / 2 - w / 2, 99);
            }
        } else if (this.state === GameState.TRANSITION_IN || this.state === GameState.TRANSITION_OUT) {
            drawOverworld(ctx, this.gameMap, this.player, this._frameCount);
            drawHud(ctx, this.player);
            drawBattleTransition(ctx, this._transitionProgress, this._frameCount);
        }
    }

    _renderStartScreen() {
        const ctx = this.ctx;
        const fc = this._frameCount;

        // Dark gradient background
        const bgGrad = ctx.createRadialGradient(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3, 50, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH);
        bgGrad.addColorStop(0, 'rgb(18,14,42)');
        bgGrad.addColorStop(0.5, 'rgb(10,10,25)');
        bgGrad.addColorStop(1, 'rgb(5,5,12)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Animated background stars
        for (let i = 0; i < 80; i++) {
            const sx = (i * 137 + fc * 0.15) % SCREEN_WIDTH;
            const sy = (i * 97 + Math.sin(fc * 0.008 + i) * 25) % SCREEN_HEIGHT;
            const brightness = 0.2 + Math.sin(fc * 0.04 + i * 2) * 0.15;
            const size = 1 + (i % 3) * 0.5;
            ctx.fillStyle = `rgba(180,200,255,${brightness})`;
            ctx.beginPath();
            ctx.arc(sx, sy, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Title glow
        const titleFloat = Math.sin(fc * 0.025) * 6;
        const glowAlpha = 0.15 + Math.sin(fc * 0.03) * 0.05;
        ctx.fillStyle = `rgba(255,210,50,${glowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 3 + titleFloat - 5, 260, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // Title
        ctx.fillStyle = YELLOW;
        ctx.font = `bold 36px ${FONT_MAIN}`;
        const titleW = ctx.measureText(GAME_TITLE).width;
        ctx.fillText(GAME_TITLE, SCREEN_WIDTH / 2 - titleW / 2, SCREEN_HEIGHT / 3 + titleFloat);

        // Subtitle with blinking
        const subAlpha = 0.4 + 0.5 * Math.sin(fc * 0.06);
        ctx.fillStyle = `rgba(220,225,255,${subAlpha})`;
        ctx.font = `16px ${FONT_MAIN}`;
        const sub = 'לחץ ENTER כדי להתחיל';
        const subW = ctx.measureText(sub).width;
        ctx.fillText(sub, SCREEN_WIDTH / 2 - subW / 2, SCREEN_HEIGHT / 3 + 55);

        // Decorative line
        const lineAlpha = 0.15 + Math.sin(fc * 0.02) * 0.05;
        ctx.strokeStyle = `rgba(140,160,220,${lineAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(SCREEN_WIDTH / 2 - 200, SCREEN_HEIGHT / 2 + 15);
        ctx.lineTo(SCREEN_WIDTH / 2 + 200, SCREEN_HEIGHT / 2 + 15);
        ctx.stroke();

        // Info lines
        const infoLines = [
            'ESC: ביטול    Enter/Z: אישור    חצים: תנועה',
            'S: הגדרות   P: קבוצה   D: מפלצופדיה   C: אוסף',
            'היכנס לדלת (צהוב): תחנת ריפוי',
            '!לך דרך הדשא הכהה כדי לפגוש מפלצות פראיות',
        ];
        ctx.font = `13px ${FONT_MAIN}`;
        let y = SCREEN_HEIGHT / 2 + 40;
        for (let li = 0; li < infoLines.length; li++) {
            const line = infoLines[li];
            ctx.fillStyle = li < 2 ? 'rgba(160,170,210,0.6)' : 'rgba(140,150,190,0.5)';
            const w = ctx.measureText(line).width;
            ctx.fillText(line, SCREEN_WIDTH / 2 - w / 2, y);
            y += 26;
        }
    }

    _renderDayNight() {
        // Slow day/night cycle (full cycle ~10 minutes at 60fps)
        const cycleLen = 36000;
        const t = (this._frameCount % cycleLen) / cycleLen;
        // t: 0..0.25 = day, 0.25..0.5 = dusk, 0.5..0.75 = night, 0.75..1.0 = dawn
        let alpha = 0;
        if (t < 0.25) {
            alpha = 0; // Day
        } else if (t < 0.4) {
            alpha = (t - 0.25) / 0.15 * 0.35; // Dusk
        } else if (t < 0.6) {
            alpha = 0.35; // Night
        } else if (t < 0.75) {
            alpha = 0.35 - (t - 0.6) / 0.15 * 0.35; // Dawn
        }

        if (alpha > 0.01) {
            const ctx = this.ctx;
            ctx.fillStyle = `rgba(10,10,40,${alpha})`;
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        }
    }

    _renderHealFlash() {
        if (this._healFlash > 0) {
            const ctx = this.ctx;
            const alpha = Math.min(1, this._healFlash / 15);
            // Green glow overlay
            ctx.fillStyle = `rgba(50,255,100,${alpha * 0.08})`;
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            // Text with panel
            const txt = '!כל המפלצות רופאו';
            ctx.font = `bold 15px ${FONT_MAIN}`;
            const w = ctx.measureText(txt).width;
            const px = SCREEN_WIDTH / 2 - w / 2 - 14;
            drawPanel(ctx, px, 78, w + 28, 30, 'rgba(20,80,40,0.85)', 'rgba(80,220,100,0.5)', 1.5, 8);
            ctx.fillStyle = 'rgb(120,255,140)';
            ctx.fillText(txt, SCREEN_WIDTH / 2 - w / 2, 99);
        }
    }

    _renderControlsHint() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(130,140,170,0.5)';
        ctx.font = `11px ${FONT_MAIN}`;
        const hint = '[S] הגדרות  [P] קבוצה  [D] מפלצופדיה  [C] אוסף';
        const w = ctx.measureText(hint).width;
        ctx.fillText(hint, SCREEN_WIDTH - w - 12, SCREEN_HEIGHT - 12);
    }
}

// ===================================================================
// Save / Load system
// ===================================================================

function serializeMonster(m) {
    return {
        speciesId: m.speciesId,
        name: m.name,
        monType: m.monType,
        level: m.level,
        experience: m.experience,
        hp: m.hp,
        moves: m.moves.map(mv => ({
            name: mv.name, moveType: mv.moveType,
            power: mv.power, accuracy: mv.accuracy,
            pp: mv.pp, currentPP: mv.currentPP,
        })),
    };
}

function deserializeMonster(data) {
    const species = Object.values(SPECIES_DB).find(s => s.id === data.speciesId);
    if (!species) return null;
    const m = createMonster(data.speciesId, data.level);
    m.name = data.name;
    m.experience = data.experience;
    m.hp = Math.min(data.hp, m.maxHp);
    if (data.moves && data.moves.length > 0) {
        m.moves = data.moves.map(mv => {
            const move = new Move(mv.name, mv.moveType, mv.power, mv.accuracy, mv.pp);
            move.currentPP = mv.currentPP;
            return move;
        });
    }
    return m;
}

function buildSaveData(game) {
    return {
        version: 1,
        timestamp: Date.now(),
        player: {
            name: game.player.name,
            col: game.player.col,
            row: game.player.row,
            facing: game.player.facing,
            coins: game.player.coins,
            party: game.player.party.map(serializeMonster),
            inventory: { ...game.player.inventory.items },
            discovered: [...game.player.discovered],
            caught: [...game.player.caught],
            defeatedTrainers: [...game.player.defeatedTrainers],
        },
        storage: {
            monsters: game.storage.monsters.map(serializeMonster),
        },
        settings: { ...game.settings },
        hasStarter: game.state !== GameState.START_SCREEN && game.state !== GameState.CHOOSE_STARTER,
    };
}

function applySaveData(game, data) {
    if (!data || !data.player) return false;
    const p = data.player;
    game.player.name = p.name;
    game.player.col = p.col;
    game.player.row = p.row;
    game.player.facing = p.facing || 'down';
    game.player.coins = p.coins || 0;
    game.player._visualX = p.col * TILE_SIZE;
    game.player._visualY = p.row * TILE_SIZE;

    // Party
    game.player.party = [];
    for (const md of (p.party || [])) {
        const mon = deserializeMonster(md);
        if (mon) game.player.party.push(mon);
    }

    // Inventory
    game.player.inventory = new Inventory();
    if (p.inventory) {
        for (const [k, v] of Object.entries(p.inventory)) {
            game.player.inventory.items[k] = v;
        }
    }

    // Sets
    game.player.discovered = new Set(p.discovered || []);
    game.player.caught = new Set(p.caught || []);
    game.player.defeatedTrainers = new Set(p.defeatedTrainers || []);

    // Storage
    game.storage.monsters = [];
    if (data.storage && data.storage.monsters) {
        for (const md of data.storage.monsters) {
            const mon = deserializeMonster(md);
            if (mon) game.storage.monsters.push(mon);
        }
    }

    // Settings
    if (data.settings) {
        Object.assign(game.settings, data.settings);
    }

    // If save had a starter, go to overworld
    if (data.hasStarter && game.player.party.length > 0) {
        game.state = GameState.OVERWORLD;
    }

    return true;
}

function saveGame(game) {
    if (!game._currentUser) return false;
    const key = 'monster_save_' + game._currentUser;
    const data = buildSaveData(game);
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        return false;
    }
}

function loadGame(game, username) {
    const key = 'monster_save_' + username;
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const data = JSON.parse(raw);
        return applySaveData(game, data);
    } catch (e) {
        return false;
    }
}

function hasSaveData(username) {
    const key = 'monster_save_' + username;
    return localStorage.getItem(key) !== null;
}

// ===================================================================
// Entry point
// ===================================================================

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const overlay = document.getElementById('loginOverlay');
    const loginBtn = document.getElementById('loginBtn');
    const loginInput = document.getElementById('loginUsername');
    const loginMsg = document.getElementById('loginMsg');

    let gameInstance = null;

    function startGame(username) {
        overlay.classList.add('hidden');
        gameInstance = new Game(canvas);
        gameInstance._currentUser = username;

        const loaded = loadGame(gameInstance, username);
        if (loaded) {
            loginMsg.textContent = '';
        }
    }

    function doLogin() {
        const username = loginInput.value.trim();
        if (!username) {
            loginMsg.className = 'login-msg error';
            loginMsg.textContent = 'נא להכניס שם משתמש';
            return;
        }
        if (username.length < 2) {
            loginMsg.className = 'login-msg error';
            loginMsg.textContent = 'שם משתמש חייב להיות לפחות 2 תווים';
            return;
        }

        // Save username to remember last login
        localStorage.setItem('monster_last_user', username);

        if (hasSaveData(username)) {
            loginMsg.className = 'login-msg success';
            loginMsg.textContent = '...טוען משחק שמור';
            setTimeout(() => startGame(username), 400);
        } else {
            loginMsg.className = 'login-msg success';
            loginMsg.textContent = '...!שחקן חדש, בהצלחה';
            setTimeout(() => startGame(username), 400);
        }
    }

    loginBtn.addEventListener('click', doLogin);
    loginInput.addEventListener('keydown', (e) => {
        e.stopPropagation(); // Prevent game from intercepting keys
        if (e.key === 'Enter') doLogin();
    });

    // Pre-fill last username
    const lastUser = localStorage.getItem('monster_last_user');
    if (lastUser) loginInput.value = lastUser;

    // Focus input
    loginInput.focus();
});
