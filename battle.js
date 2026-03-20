/**
 * battle.js - מערכת קרב מבוססת תורות עם מכונת מצבים.
 */

const BattleState = {
    INTRO:          'INTRO',
    PLAYER_TURN:    'PLAYER_TURN',
    SELECT_MOVE:    'SELECT_MOVE',
    SELECT_SWITCH:  'SELECT_SWITCH',
    PLAYER_ATTACK:  'PLAYER_ATTACK',
    ENEMY_ATTACK:   'ENEMY_ATTACK',
    AFTER_PLAYER:   'AFTER_PLAYER',
    AFTER_ENEMY:    'AFTER_ENEMY',
    TRY_CATCH:      'TRY_CATCH',
    USE_ITEM:       'USE_ITEM',
    TRY_RUN:        'TRY_RUN',
    DO_SWITCH:      'DO_SWITCH',
    XP_REWARD:      'XP_REWARD',
    PLAYER_FAINTED: 'PLAYER_FAINTED',
    BATTLE_END:     'BATTLE_END',
};

const BattleResult = {
    WIN:      'WIN',
    LOSE:     'LOSE',
    CAUGHT:   'CAUGHT',
    RAN_AWAY: 'RAN_AWAY',
};

class Battle {
    constructor(playerMonster, enemyMonster, playerRef, storageRef, trainerData) {
        this.playerMon = playerMonster;
        this.enemyMon = enemyMonster;
        this.player = playerRef;
        this.storage = storageRef;

        // Trainer battle data
        this.isTrainerBattle = !!trainerData;
        this.trainerData = trainerData || null;
        this._trainerPartyIndex = 0;

        // Register this species as discovered
        this.player.registerDiscovered(enemyMonster.speciesId);

        this.state = BattleState.INTRO;
        this.result = null;
        this.godMode = false;
        this.canCatch = true;
        this.isItayBattle = false;

        this.messages = this.isTrainerBattle
            ? [`!${trainerData.name} מאתגר אותך לקרב`, `!${enemyMonster.name} נשלח לקרב`]
            : [`${enemyMonster.name} פראי הופיע!`];
        this.mainCursor = 0;
        this.moveCursor = 0;
        this.switchCursor = 0;

        this._timer = 80;
        this._phaseAfterMsg = null;

        this._playerActed = false;
        this._enemyActed = false;

        // Animation state
        this.anim = {
            playerSlide: 0,      // -1..1 slide offset for attack
            enemySlide: 0,
            playerFlash: 0,      // countdown for white flash on hit
            enemyFlash: 0,
            displayPlayerHp: playerMonster.hp,  // for smooth HP bar
            displayEnemyHp: enemyMonster.hp,
            particles: new ParticleSystem(),
            floatingTexts: [],
            screenShake: new ScreenShake(),
            frameCount: 0,
        };
    }

    update() {
        // Update animation systems
        this.anim.frameCount++;
        this.anim.particles.update();
        this.anim.screenShake.update();
        if (this.anim.playerFlash > 0) this.anim.playerFlash--;
        if (this.anim.enemyFlash > 0) this.anim.enemyFlash--;
        // Smooth slide back to 0
        this.anim.playerSlide *= 0.85;
        this.anim.enemySlide *= 0.85;
        if (Math.abs(this.anim.playerSlide) < 0.5) this.anim.playerSlide = 0;
        if (Math.abs(this.anim.enemySlide) < 0.5) this.anim.enemySlide = 0;
        // Smooth HP bar
        const hpSpeed = 0.12;
        this.anim.displayPlayerHp += (this.playerMon.hp - this.anim.displayPlayerHp) * hpSpeed;
        this.anim.displayEnemyHp += (this.enemyMon.hp - this.anim.displayEnemyHp) * hpSpeed;
        if (Math.abs(this.anim.displayPlayerHp - this.playerMon.hp) < 0.5) this.anim.displayPlayerHp = this.playerMon.hp;
        if (Math.abs(this.anim.displayEnemyHp - this.enemyMon.hp) < 0.5) this.anim.displayEnemyHp = this.enemyMon.hp;
        // Floating texts
        for (let i = this.anim.floatingTexts.length - 1; i >= 0; i--) {
            this.anim.floatingTexts[i].update();
            if (!this.anim.floatingTexts[i].alive) this.anim.floatingTexts.splice(i, 1);
        }

        if (this._timer > 0) {
            this._timer--;
            return;
        }

        if (this._phaseAfterMsg !== null) {
            this.state = this._phaseAfterMsg;
            this._phaseAfterMsg = null;
            return;
        }

        switch (this.state) {
            case BattleState.INTRO:
                this._newRound();
                this.state = BattleState.PLAYER_TURN;
                this.messages = ['מה תרצה לעשות?'];
                this.mainCursor = 0;
                break;

            case BattleState.PLAYER_ATTACK:
                this._doPlayerAttack();
                break;

            case BattleState.ENEMY_ATTACK:
                this._doEnemyAttack();
                break;

            case BattleState.AFTER_PLAYER:
                this._afterPlayerAttack();
                break;

            case BattleState.AFTER_ENEMY:
                this._afterEnemyAttack();
                break;

            case BattleState.TRY_CATCH:
                this._tryCatch();
                break;

            case BattleState.USE_ITEM:
                this._usePotion();
                break;

            case BattleState.TRY_RUN:
                this._tryRun();
                break;

            case BattleState.DO_SWITCH:
                this._doSwitch();
                break;

            case BattleState.XP_REWARD:
                this._awardXp();
                break;

            case BattleState.PLAYER_FAINTED:
                this._handlePlayerFainted();
                break;
        }
    }

    _newRound() {
        this._playerActed = false;
        this._enemyActed = false;
    }

    handleInput(key) {
        if (this.state === BattleState.PLAYER_TURN) {
            this._handleMenuInput(key);
        } else if (this.state === BattleState.SELECT_MOVE) {
            this._handleMoveSelect(key);
        } else if (this.state === BattleState.SELECT_SWITCH) {
            this._handleSwitchSelect(key);
        }
    }

    _handleMenuInput(key) {
        if (key === 'ArrowUp') {
            this.mainCursor = (this.mainCursor - 1 + 5) % 5;
        } else if (key === 'ArrowDown') {
            this.mainCursor = (this.mainCursor + 1) % 5;
        } else if (key === 'Enter' || key === 'z' || key === 'Z') {
            if (this.mainCursor === 0) {
                this.state = BattleState.SELECT_MOVE;
                this.moveCursor = 0;
            } else if (this.mainCursor === 1) {
                this.state = BattleState.SELECT_SWITCH;
                this.switchCursor = 0;
            } else if (this.mainCursor === 2) {
                this.state = BattleState.TRY_CATCH;
            } else if (this.mainCursor === 3) {
                this.state = BattleState.USE_ITEM;
            } else if (this.mainCursor === 4) {
                this.state = BattleState.TRY_RUN;
            }
        }
    }

    _handleMoveSelect(key) {
        const nMoves = this.playerMon.moves.length;
        if (nMoves === 0) return;

        if (key === 'ArrowUp') {
            this.moveCursor = (this.moveCursor - 1 + nMoves) % nMoves;
        } else if (key === 'ArrowDown') {
            this.moveCursor = (this.moveCursor + 1) % nMoves;
        } else if (key === 'Escape') {
            this.state = BattleState.PLAYER_TURN;
        } else if (key === 'Enter' || key === 'z' || key === 'Z') {
            const move = this.playerMon.moves[this.moveCursor];
            if (move.currentPP <= 0) {
                this.messages = ['!אין PP למהלך הזה'];
                return;
            }
            move.currentPP--;

            this._newRound();

            if (this.playerMon.speed >= this.enemyMon.speed) {
                this.state = BattleState.PLAYER_ATTACK;
            } else {
                this.state = BattleState.ENEMY_ATTACK;
            }
        }
    }

    _handleSwitchSelect(key) {
        const party = this.player.party;
        if (key === 'ArrowUp') {
            this.switchCursor = (this.switchCursor - 1 + party.length) % party.length;
        } else if (key === 'ArrowDown') {
            this.switchCursor = (this.switchCursor + 1) % party.length;
        } else if (key === 'Escape') {
            this.state = BattleState.PLAYER_TURN;
        } else if (key === 'Enter' || key === 'z' || key === 'Z') {
            const chosen = party[this.switchCursor];
            if (chosen === this.playerMon) {
                this.messages = ['!מפלצת זו כבר בקרב'];
                return;
            }
            if (chosen.isFainted) {
                this.messages = ['!מפלצת זו התעלפה ולא יכולה להילחם'];
                return;
            }
            this.state = BattleState.DO_SWITCH;
        }
    }

    _doSwitch() {
        const chosen = this.player.party[this.switchCursor];
        this.messages = [
            `!${this.playerMon.name}, חזור`,
            `!${chosen.name}, קדימה`,
        ];
        this.playerMon = chosen;
        this.anim.displayPlayerHp = chosen.hp;
        this._newRound();
        this._playerActed = true;
        this._timedTransition(50, BattleState.ENEMY_ATTACK);
    }

    _doPlayerAttack() {
        this._playerActed = true;
        const move = this.playerMon.moves[this.moveCursor];
        this._executeAttack(this.playerMon, this.enemyMon, move);
        this._timedTransition(65, BattleState.AFTER_PLAYER);
    }

    _doEnemyAttack() {
        this._enemyActed = true;
        const usable = this.enemyMon.moves.filter(m => m.currentPP > 0);
        let move;
        if (usable.length === 0) {
            move = new Move('מאבק', 'NORMAL', 30, 100, 999);
        } else {
            move = usable[Math.floor(Math.random() * usable.length)];
            move.currentPP--;
        }
        this._executeAttack(this.enemyMon, this.playerMon, move);
        this._timedTransition(65, BattleState.AFTER_ENEMY);
    }

    _executeAttack(attacker, defender, move) {
        const isPlayerAttacking = attacker === this.playerMon;

        // God mode: player never misses, always one-hit KO
        if (this.godMode && isPlayerAttacking) {
            const damage = defender.hp;
            defender.takeDamage(damage);
            const effectiveness = 2.0;

            this.anim.playerSlide = 40;
            this.anim.enemyFlash = 12;
            this.anim.screenShake.trigger(10, 20);

            const particleType = move.moveType || 'NORMAL';
            if (PARTICLE_PRESETS[particleType]) {
                this.anim.particles.emit(SCREEN_WIDTH - 220, Math.floor(SCREEN_HEIGHT * 0.22), particleType);
            }

            this.anim.floatingTexts.push(new FloatingText(SCREEN_WIDTH - 200, Math.floor(SCREEN_HEIGHT * 0.18), `-${damage}`, '#ff4444', 55));

            this.messages = [`${attacker.name} השתמש ב${move.name}!`, '!GOD MODE - מכה קטלנית'];
            this.messages.push(`${defender.name} ספג ${damage} נזק!`);
            return;
        }

        if (Math.floor(Math.random() * 100) + 1 > move.accuracy) {
            this.messages = [`${attacker.name} השתמש ב${move.name}!`, '!אבל הוא החטיא'];
            return;
        }
        const [damage, effectiveness] = calcDamage(attacker, defender, move);
        defender.takeDamage(damage);

        // Attack slide animation
        if (isPlayerAttacking) {
            this.anim.playerSlide = 40;
            this.anim.enemyFlash = 12;
        } else {
            this.anim.enemySlide = -40;
            this.anim.playerFlash = 12;
        }

        // Particles by move type
        const particleType = move.moveType || 'NORMAL';
        if (PARTICLE_PRESETS[particleType]) {
            // Emit at defender position
            const px = isPlayerAttacking ? SCREEN_WIDTH - 220 : 150;
            const py = isPlayerAttacking ? Math.floor(SCREEN_HEIGHT * 0.22) : Math.floor(SCREEN_HEIGHT * 0.50);
            this.anim.particles.emit(px, py, particleType);
        }

        // Floating damage number
        const ftX = isPlayerAttacking ? SCREEN_WIDTH - 200 : 170;
        const ftY = isPlayerAttacking ? Math.floor(SCREEN_HEIGHT * 0.18) : Math.floor(SCREEN_HEIGHT * 0.45);
        const dmgColor = effectiveness > 1.0 ? '#ff4444' : (effectiveness < 1.0 ? '#8888aa' : '#ffffff');
        this.anim.floatingTexts.push(new FloatingText(ftX, ftY, `-${damage}`, dmgColor, 55));

        // Screen shake on super effective
        if (effectiveness > 1.0) {
            this.anim.screenShake.trigger(6, 15);
        }

        this.messages = [`${attacker.name} השתמש ב${move.name}!`];
        if (effectiveness > 1.0) {
            this.messages.push('!זה סופר אפקטיבי');
        } else if (effectiveness < 1.0) {
            this.messages.push('...זה לא כל כך אפקטיבי');
        }
        this.messages.push(`${defender.name} ספג ${damage} נזק!`);
    }

    _afterPlayerAttack() {
        if (this.enemyMon.isFainted) {
            // Check if trainer has more monsters
            if (this.isTrainerBattle && this.trainerData) {
                this._trainerPartyIndex++;
                if (this._trainerPartyIndex < this.trainerData.party.length) {
                    const nextMon = this.trainerData.party[this._trainerPartyIndex];
                    this.player.registerDiscovered(nextMon.speciesId);
                    // Award XP for defeating this one first
                    const baseXp = 50 + this.enemyMon.level * 8;
                    const oldSpeciesId = this.playerMon.speciesId;
                    const xpMsgs = this.playerMon.gainXp(baseXp);
                    if (this.playerMon.speciesId !== oldSpeciesId) {
                        this.player.registerCaught(this.playerMon.speciesId);
                        this.anim.displayPlayerHp = this.playerMon.hp;
                    }
                    this.messages = [...xpMsgs,
                        `!${this.enemyMon.name} התעלף`,
                        `!${this.trainerData.name} שולח את ${nextMon.name}`,
                    ];
                    this.enemyMon = nextMon;
                    this.anim.displayEnemyHp = nextMon.hp;
                    this._newRound();
                    this._timedTransition(80, BattleState.PLAYER_TURN);
                    return;
                }
            }
            this.messages = this.isTrainerBattle
                ? [`${this.enemyMon.name} התעלף!`, `!ניצחת את ${this.trainerData.name}`]
                : [`${this.enemyMon.name} הפראי התעלף!`];
            this.result = BattleResult.WIN;
            this._timedTransition(60, BattleState.XP_REWARD);
            return;
        }
        if (!this._enemyActed) {
            this._timedTransition(20, BattleState.ENEMY_ATTACK);
        } else {
            this._newRound();
            this.messages = ['מה תרצה לעשות?'];
            this.mainCursor = 0;
            this._timedTransition(10, BattleState.PLAYER_TURN);
        }
    }

    _afterEnemyAttack() {
        if (this.playerMon.isFainted) {
            this._timedTransition(30, BattleState.PLAYER_FAINTED);
            return;
        }
        if (!this._playerActed) {
            this._timedTransition(20, BattleState.PLAYER_ATTACK);
        } else {
            this._newRound();
            this.messages = ['מה תרצה לעשות?'];
            this.mainCursor = 0;
            this._timedTransition(10, BattleState.PLAYER_TURN);
        }
    }

    _handlePlayerFainted() {
        const nextMon = this.player.firstUsableMonster();
        if (nextMon === null) {
            this.messages = [
                `${this.playerMon.name} התעלף!`,
                '...אין לך מפלצות שמישות',
                '!החשכת',
            ];
            this.result = BattleResult.LOSE;
            this._timedTransition(90, BattleState.BATTLE_END);
        } else {
            this.messages = [
                `${this.playerMon.name} התעלף!`,
                `!${nextMon.name} ,קדימה`,
            ];
            this.playerMon = nextMon;
            this._newRound();
            this._timedTransition(60, BattleState.PLAYER_TURN);
        }
    }

    _tryCatch() {
        if (this.canCatch === false) {
            this.messages = ['...המפלצת של איתי לא ניתנת לתפיסה'];
            this._timedTransition(50, BattleState.PLAYER_TURN);
            return;
        }
        if (this.isTrainerBattle) {
            this.messages = ['!אי אפשר לתפוס מפלצת מאמן'];
            this._timedTransition(50, BattleState.PLAYER_TURN);
            return;
        }
        // Try super capsule first, then regular
        let capsuleType = '';
        let catchMultiplier = 1.0;
        if (this.player.inventory.count('כמוסת על') > 0) {
            this.player.inventory.remove('כמוסת על');
            capsuleType = 'כמוסת על';
            catchMultiplier = 2.0;
        } else if (this.player.inventory.count('כמוסת לכידה') > 0) {
            this.player.inventory.remove('כמוסת לכידה');
            capsuleType = 'כמוסת לכידה';
            catchMultiplier = 1.0;
        } else {
            this.messages = ['!אין לך כמוסות לכידה'];
            this._timedTransition(50, BattleState.PLAYER_TURN);
            return;
        }

        const hpFactor = (3 * this.enemyMon.maxHp - 2 * this.enemyMon.hp) /
                          (3 * this.enemyMon.maxHp);
        let catchChance = CATCH_BASE_RATE * hpFactor * catchMultiplier;
        catchChance *= Math.max(0.3, 1.0 - (this.enemyMon.level / 100) * 0.5);
        // Legendaries are harder to catch
        const species = SPECIES_DB[this.enemyMon.speciesId];
        if (species && species.legendary) catchChance *= 0.3;

        const roll = Math.random();
        const capsulesLeft = this.player.inventory.count(capsuleType);
        this.messages = [`${capsuleType} זרקת! (נשארו ${capsulesLeft})`];

        if (roll < catchChance) {
            // Catch sparkle particles
            this.anim.particles.emit(SCREEN_WIDTH - 220, Math.floor(SCREEN_HEIGHT * 0.22), 'CATCH_SPARKLE');
            this.messages.push(`!${this.enemyMon.name} נתפס! יש`);
            this.player.registerCaught(this.enemyMon.speciesId);
            if (!this.player.addToParty(this.enemyMon)) {
                this.storage.deposit(this.enemyMon);
                this.messages.push('.הקבוצה מלאה - נשלח לאחסון');
            }
            this.result = BattleResult.CAUGHT;
            this._timedTransition(90, BattleState.BATTLE_END);
        } else {
            this.messages.push('!אוי לא! הוא השתחרר');
            this._newRound();
            this._playerActed = true;
            this._timedTransition(50, BattleState.ENEMY_ATTACK);
        }
    }

    _usePotion() {
        // Try best potion first
        let potionName = '';
        let healAmount = 0;
        if (this.player.inventory.count('שיקוי מלא') > 0) {
            this.player.inventory.remove('שיקוי מלא');
            potionName = 'שיקוי מלא';
            healAmount = 9999;
        } else if (this.player.inventory.count('שיקוי סופר') > 0) {
            this.player.inventory.remove('שיקוי סופר');
            potionName = 'שיקוי סופר';
            healAmount = 80;
        } else if (this.player.inventory.count('שיקוי ריפוי') > 0) {
            this.player.inventory.remove('שיקוי ריפוי');
            potionName = 'שיקוי ריפוי';
            healAmount = 30;
        } else {
            this.messages = ['!אין לך שיקויי ריפוי'];
            this._timedTransition(50, BattleState.PLAYER_TURN);
            return;
        }

        const oldHp = this.playerMon.hp;
        this.playerMon.heal(healAmount);
        const actual = this.playerMon.hp - oldHp;

        const potionsLeft = this.player.inventory.count(potionName);
        this.messages = [
            `${potionName} השתמשת ב! (+${actual} HP)`,
            `.נשארו ${potionsLeft}`,
        ];
        this._newRound();
        this._playerActed = true;
        this._timedTransition(50, BattleState.ENEMY_ATTACK);
    }

    _tryRun() {
        if (this.isTrainerBattle) {
            this.messages = ['!אי אפשר לברוח מקרב מאמנים'];
            this._timedTransition(50, BattleState.PLAYER_TURN);
            return;
        }
        const speedRatio = this.playerMon.speed / Math.max(1, this.enemyMon.speed);
        const escapeChance = Math.min(0.95, 0.5 * speedRatio);

        if (Math.random() < escapeChance) {
            this.messages = ['!נמלטת בהצלחה'];
            this.result = BattleResult.RAN_AWAY;
            this._timedTransition(50, BattleState.BATTLE_END);
        } else {
            this.messages = ['!לא הצלחת לברוח'];
            this._newRound();
            this._playerActed = true;
            this._timedTransition(50, BattleState.ENEMY_ATTACK);
        }
    }

    _awardXp() {
        const baseXp = 50 + this.enemyMon.level * 8;
        const oldSpeciesId = this.playerMon.speciesId;
        const xpMessages = this.playerMon.gainXp(baseXp);
        this.messages = xpMessages;

        // Coin reward
        const coinReward = 10 + this.enemyMon.level * 3 + (this.isTrainerBattle ? this.enemyMon.level * 5 : 0);
        this.player.coins += coinReward;
        this.messages.push(`!${coinReward} \u{1FA99} קיבלת`);

        // If monster evolved, register the new species and update display HP
        if (this.playerMon.speciesId !== oldSpeciesId) {
            this.player.registerCaught(this.playerMon.speciesId);
            this.anim.displayPlayerHp = this.playerMon.hp;
        }

        this._timedTransition(90, BattleState.BATTLE_END);
    }

    _timedTransition(frames, nextState) {
        this._timer = frames;
        this._phaseAfterMsg = nextState;
    }

    get isOver() {
        return this.state === BattleState.BATTLE_END && this._timer <= 0;
    }
}
