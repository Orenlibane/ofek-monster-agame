/**
 * ui.js - All Canvas rendering: overworld with camera, battle screen, HUD, menus.
 */

// Font setup - use Heebo (loaded via CSS) with fallbacks
const FONT_MAIN = '"Heebo", "Courier New", sans-serif';
const FONT_BOLD = '"Heebo", "Courier New", sans-serif';

// Polyfill for roundRect (older browsers)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        else if (Array.isArray(r) && r.length === 1) r = [r[0], r[0], r[0], r[0]];
        const [tl, tr, br, bl] = r;
        this.moveTo(x + tl, y);
        this.lineTo(x + w - tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + tr);
        this.lineTo(x + w, y + h - br);
        this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
        this.lineTo(x + bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - bl);
        this.lineTo(x, y + tl);
        this.quadraticCurveTo(x, y, x + tl, y);
        this.closePath();
        return this;
    };
}

// ===================================================================
// Drawing helpers
// ===================================================================

function drawPanel(ctx, x, y, w, h, bg, borderColor, borderWidth, radius) {
    bg = bg || 'rgba(10,10,30,0.85)';
    borderColor = borderColor || 'rgba(140,160,220,0.6)';
    borderWidth = (borderWidth !== undefined) ? borderWidth : 2;
    radius = radius || 10;

    ctx.save();
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Inner highlight (top edge glow)
    const innerGrad = ctx.createLinearGradient(x, y, x, y + h * 0.3);
    innerGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
    innerGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, w - 2, h * 0.3, [radius, radius, 0, 0]);
    ctx.fillStyle = innerGrad;
    ctx.fill();

    if (borderWidth > 0) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.stroke();
    }
    ctx.restore();
}

function drawHealthBar(ctx, x, y, w, current, maximum, label, height, showText) {
    label = label || '';
    height = height || 16;
    showText = (showText !== undefined) ? showText : true;

    const ratio = Math.max(0, current / Math.max(1, maximum));
    let barColor1, barColor2;
    if (ratio > 0.5) { barColor1 = 'rgb(80,220,80)'; barColor2 = 'rgb(30,160,30)'; }
    else if (ratio > 0.2) { barColor1 = 'rgb(255,220,60)'; barColor2 = 'rgb(200,150,20)'; }
    else { barColor1 = 'rgb(240,70,70)'; barColor2 = 'rgb(170,30,30)'; }

    // Background
    ctx.fillStyle = 'rgb(20,22,35)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, height, 4);
    ctx.fill();

    // Fill with gradient
    const fillW = Math.floor(w * ratio);
    if (fillW > 0) {
        const grad = ctx.createLinearGradient(x, y, x, y + height);
        grad.addColorStop(0, barColor1);
        grad.addColorStop(1, barColor2);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, fillW, height, 4);
        ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, fillW - 2, Math.floor(height / 2) - 1, [3, 3, 0, 0]);
        ctx.fill();
    }

    // Border
    ctx.strokeStyle = 'rgba(120,130,160,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, height, 4);
    ctx.stroke();

    if (showText) {
        ctx.fillStyle = WHITE;
        ctx.font = `bold ${Math.max(10, height - 4)}px ${FONT_MAIN}`;
        ctx.fillText(`${label}${current}/${maximum}`, x + 4, y + height - 3);
    }
}

function drawXpBar(ctx, x, y, w, current, needed) {
    const ratio = Math.max(0, current / Math.max(1, needed));
    const h = 8;
    ctx.fillStyle = 'rgb(20,22,40)';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 3); ctx.fill();
    const fillW = Math.floor(w * ratio);
    if (fillW > 0) {
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, 'rgb(100,160,255)');
        grad.addColorStop(1, 'rgb(50,90,200)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(x, y, fillW, h, 3); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(80,90,130,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 3); ctx.stroke();
}

// ===================================================================
// Camera helper
// ===================================================================

function cameraOffset(player, gameMap) {
    const pcx = player.pixelX + TILE_SIZE / 2;
    const pcy = player.pixelY + TILE_SIZE / 2;
    let camX = pcx - SCREEN_WIDTH / 2;
    let camY = pcy - SCREEN_HEIGHT / 2;
    const mapPixelW = gameMap.cols * TILE_SIZE;
    const mapPixelH = gameMap.rows * TILE_SIZE;
    camX = Math.max(0, Math.min(camX, mapPixelW - SCREEN_WIDTH));
    camY = Math.max(0, Math.min(camY, mapPixelH - SCREEN_HEIGHT));
    return [camX, camY];
}

// ===================================================================
// Overworld rendering
// ===================================================================

function drawOverworld(ctx, gameMap, player, frameCount, trainers, defeatedTrainers, itayMonster) {
    frameCount = frameCount || 0;
    const [camX, camY] = cameraOffset(player, gameMap);

    const startCol = Math.max(0, Math.floor(camX / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
    const endCol = Math.min(gameMap.cols, Math.floor((camX + SCREEN_WIDTH) / TILE_SIZE) + 2);
    const endRow = Math.min(gameMap.rows, Math.floor((camY + SCREEN_HEIGHT) / TILE_SIZE) + 2);

    // Tiles
    for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
            const tileId = gameMap.grid[row][col];
            let color = TILE_COLOR_MAP[tileId] || GRAY;
            const sx = col * TILE_SIZE - camX;
            const sy = row * TILE_SIZE - camY;

            // Animated water shimmer
            if (tileId === TILE_WATER) {
                const shimmer = Math.sin(frameCount * 0.04 + col * 0.7 + row * 0.5) * 15;
                const r = 70 + Math.floor(shimmer);
                const g = 130 + Math.floor(shimmer * 0.5);
                const b = 210 + Math.floor(shimmer * 0.3);
                color = `rgb(${r},${g},${b})`;

                // Wave highlight
                ctx.fillStyle = color;
                ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                const waveY = sy + 10 + Math.sin(frameCount * 0.06 + col * 1.2) * 6;
                ctx.strokeStyle = 'rgba(180,220,255,0.25)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(sx + 2, waveY);
                ctx.quadraticCurveTo(sx + TILE_SIZE / 2, waveY - 4, sx + TILE_SIZE - 2, waveY + 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = color;
                ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
        }
    }

    // Tall-grass decoration with sway
    for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
            if (gameMap.grid[row][col] === TILE_TALL_GRASS) {
                const sx = col * TILE_SIZE - camX;
                const sy = row * TILE_SIZE - camY;
                const sway = Math.sin(frameCount * 0.03 + col * 0.8 + row * 0.6) * 3;
                for (let i = 4; i < TILE_SIZE - 4; i += 10) {
                    ctx.strokeStyle = 'rgb(30,100,30)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(sx + i, sy + TILE_SIZE - 4);
                    ctx.lineTo(sx + i - 3 + sway, sy + TILE_SIZE - 16);
                    ctx.stroke();
                    ctx.strokeStyle = 'rgb(50,130,30)';
                    ctx.beginPath();
                    ctx.moveTo(sx + i + 4, sy + TILE_SIZE - 4);
                    ctx.lineTo(sx + i + 7 + sway * 0.7, sy + TILE_SIZE - 18);
                    ctx.stroke();
                }
            }
        }
    }

    // Building decorations (signs, roofs)
    // Small healing station sign (original at cols 2-4, rows 2-4)
    {
        const signCol = 3, signRow = 2;
        const ssx = signCol * TILE_SIZE - camX;
        const ssy = signRow * TILE_SIZE - camY - 16;
        if (ssx > -100 && ssx < SCREEN_WIDTH + 100 && ssy > -100 && ssy < SCREEN_HEIGHT + 100) {
            ctx.fillStyle = 'rgba(200,80,80,0.85)';
            ctx.beginPath();
            ctx.roundRect(ssx - 12, ssy, TILE_SIZE + 24, 16, 3);
            ctx.fill();
            ctx.fillStyle = WHITE;
            ctx.font = '10px ' + FONT_MAIN;
            const txt = 'תחנת ריפוי';
            const tw = ctx.measureText(txt).width;
            ctx.fillText(txt, ssx + TILE_SIZE / 2 - tw / 2, ssy + 12);
        }
    }
    // Healing Hotel sign (at cols 19-23, rows 2-5)
    {
        const hotelCol = 19, hotelRow = 2;
        const hsx = (hotelCol + 2) * TILE_SIZE - camX;
        const hsy = hotelRow * TILE_SIZE - camY - 22;
        if (hsx > -200 && hsx < SCREEN_WIDTH + 200 && hsy > -200 && hsy < SCREEN_HEIGHT + 200) {
            // Roof accent
            const roofX = hotelCol * TILE_SIZE - camX;
            const roofW = 5 * TILE_SIZE;
            ctx.fillStyle = 'rgb(160,60,60)';
            ctx.fillRect(roofX, hotelRow * TILE_SIZE - camY - 4, roofW, 6);

            // Sign board
            ctx.fillStyle = 'rgba(180,50,50,0.92)';
            ctx.beginPath();
            ctx.roundRect(hsx - 55, hsy, 110, 20, 4);
            ctx.fill();
            ctx.strokeStyle = 'rgb(255,200,100)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(hsx - 55, hsy, 110, 20, 4);
            ctx.stroke();
            ctx.fillStyle = '#ffd232';
            ctx.font = 'bold 12px ' + FONT_MAIN;
            const htxt = 'מלון הריפוי';
            const htw = ctx.measureText(htxt).width;
            ctx.fillText(htxt, hsx - htw / 2, hsy + 15);

            // Cross/plus symbol on heal tiles
            for (let hr = 3; hr <= 4; hr++) {
                for (let hc = 20; hc <= 22; hc++) {
                    const cx = hc * TILE_SIZE - camX + TILE_SIZE / 2;
                    const cy = hr * TILE_SIZE - camY + TILE_SIZE / 2;
                    if (cx > -50 && cx < SCREEN_WIDTH + 50 && cy > -50 && cy < SCREEN_HEIGHT + 50) {
                        ctx.strokeStyle = 'rgba(255,100,120,0.5)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(cx - 8, cy);
                        ctx.lineTo(cx + 8, cy);
                        ctx.moveTo(cx, cy - 8);
                        ctx.lineTo(cx, cy + 8);
                        ctx.stroke();
                    }
                }
            }
        }
    }

    // Shop building sign (rows 40-42, cols 3-4)
    {
        const shopCol = 3, shopRow = 40;
        const ssx = (shopCol + 0.5) * TILE_SIZE - camX;
        const ssy = shopRow * TILE_SIZE - camY - 18;
        if (ssx > -200 && ssx < SCREEN_WIDTH + 200 && ssy > -200 && ssy < SCREEN_HEIGHT + 200) {
            ctx.fillStyle = 'rgba(50,120,50,0.92)';
            ctx.beginPath();
            ctx.roundRect(ssx - 38, ssy, 80, 16, 3);
            ctx.fill();
            ctx.strokeStyle = '#aaddaa';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(ssx - 38, ssy, 80, 16, 3);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px ' + FONT_MAIN;
            const stxt = 'חנות פריטים';
            const stw = ctx.measureText(stxt).width;
            ctx.fillText(stxt, ssx - stw / 2 + 2, ssy + 12);
        }
    }

    // Cave entrance decoration (if spawned)
    if (gameMap.caveSpawned) {
        const caveCol = CAVE_CONFIG.col;
        const caveRow = CAVE_CONFIG.row - 1; // sign above door
        const csx = caveCol * TILE_SIZE - camX;
        const csy = caveRow * TILE_SIZE - camY;
        if (csx > -200 && csx < SCREEN_WIDTH + 200 && csy > -200 && csy < SCREEN_HEIGHT + 200) {
            // Glow around cave door
            const doorX = caveCol * TILE_SIZE - camX;
            const doorY = (caveRow + 1) * TILE_SIZE - camY;
            const glowAlpha = 0.3 + Math.sin(frameCount * 0.05) * 0.15;
            ctx.fillStyle = `rgba(255,80,20,${glowAlpha})`;
            ctx.beginPath();
            ctx.arc(doorX + TILE_SIZE / 2, doorY + TILE_SIZE / 2, TILE_SIZE * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Sign
            ctx.fillStyle = 'rgba(80,20,10,0.92)';
            ctx.beginPath();
            ctx.roundRect(csx - 20, csy - 18, TILE_SIZE + 40, 18, 3);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,100,40,0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(csx - 20, csy - 18, TILE_SIZE + 40, 18, 3);
            ctx.stroke();
            ctx.fillStyle = '#ff6622';
            ctx.font = `bold 11px ${FONT_MAIN}`;
            const ctxt = 'מערת האש';
            const ctw = ctx.measureText(ctxt).width;
            ctx.fillText(ctxt, csx + TILE_SIZE / 2 - ctw / 2, csy - 4);

            // Fire particles around cave
            for (let i = 0; i < 3; i++) {
                const fx = doorX + TILE_SIZE / 2 + Math.sin(frameCount * 0.07 + i * 2.1) * 20;
                const fy = doorY - 4 - (frameCount * 0.8 + i * 10) % 30;
                const fa = 0.6 - ((frameCount * 0.8 + i * 10) % 30) / 30 * 0.6;
                const fsize = 3 + Math.sin(frameCount * 0.1 + i) * 1.5;
                ctx.fillStyle = `rgba(255,${100 + i * 40},20,${fa})`;
                ctx.beginPath();
                ctx.arc(fx, fy, fsize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // NPC trainers
    if (trainers && defeatedTrainers) {
        const trainerSprites = getTrainerSprites();
        for (const trainer of trainers) {
            const tx = trainer.col * TILE_SIZE - camX;
            const ty = trainer.row * TILE_SIZE - camY;
            if (tx < -100 || tx > SCREEN_WIDTH + 100 || ty < -100 || ty > SCREEN_HEIGHT + 100) continue;

            const defeated = defeatedTrainers.has(trainer.id);
            const sprite = trainerSprites[trainer.facing] || trainerSprites.down;
            ctx.drawImage(sprite, tx + (TILE_SIZE - sprite.width) / 2, ty + (TILE_SIZE - sprite.height) / 2);

            // Name label with better styling
            ctx.font = `bold 10px ${FONT_MAIN}`;
            const nw = ctx.measureText(trainer.name).width;
            const nlx = tx + TILE_SIZE / 2 - nw / 2 - 5;
            const nly = ty - 16;
            ctx.fillStyle = defeated ? 'rgba(60,60,70,0.75)' : 'rgba(180,40,40,0.85)';
            ctx.beginPath();
            ctx.roundRect(nlx, nly, nw + 10, 15, 4);
            ctx.fill();
            if (!defeated) {
                ctx.strokeStyle = 'rgba(255,100,100,0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(nlx, nly, nw + 10, 15, 4);
                ctx.stroke();
            }
            ctx.fillStyle = WHITE;
            ctx.fillText(trainer.name, tx + TILE_SIZE / 2 - nw / 2, ty - 4);

            // Vision indicator (exclamation mark if not defeated)
            if (!defeated) {
                const bob = Math.sin(frameCount * 0.08) * 3;
                ctx.fillStyle = '#ff4444';
                ctx.font = `bold 16px ${FONT_MAIN}`;
                ctx.fillText('!', tx + TILE_SIZE / 2 - 4, ty - 22 + bob);
            }
        }
    }

    // Player sprite with walking animation
    const heroSprites = getHeroSprites();
    const walkSprites = getHeroWalkSprites();
    let heroSurf;
    if (player._isMoving && player._walkFrame > 0) {
        const walkKey = player.facing + '_walk' + player._walkFrame;
        heroSurf = walkSprites[walkKey] || heroSprites[player.facing] || heroSprites.down;
    } else if (player._isMoving) {
        const walkKey = player.facing + '_walk1';
        heroSurf = walkSprites[walkKey] || heroSprites[player.facing] || heroSprites.down;
    } else {
        heroSurf = heroSprites[player.facing] || heroSprites.down;
    }
    const px = player.pixelX - camX + (TILE_SIZE - heroSurf.width) / 2;
    const py = player.pixelY - camY + (TILE_SIZE - heroSurf.height) / 2;
    ctx.drawImage(heroSurf, px, py);

    // Draw Itay's Monster
    if (itayMonster) {
        _drawItayMonster(ctx, itayMonster, camX, camY, frameCount);
    }
}

function _drawItayMonster(ctx, itay, camX, camY, fc) {
    const screenX = itay.col * TILE_SIZE - camX + TILE_SIZE / 2;
    const screenY = itay.row * TILE_SIZE - camY + TILE_SIZE / 2;
    if (screenX < -120 || screenX > SCREEN_WIDTH + 120 || screenY < -120 || screenY > SCREEN_HEIGHT + 120) return;

    const pulse = Math.sin(fc * 0.05);
    const bob = Math.sin(fc * 0.04) * 5;
    const radius = 40 + pulse * 5;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(screenX, itay.row * TILE_SIZE - camY + TILE_SIZE + 4, radius * 1.1, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Purple aura glow
    const aura = 0.18 + pulse * 0.08;
    const auraGrad = ctx.createRadialGradient(screenX, screenY + bob, 0, screenX, screenY + bob, radius * 1.8);
    auraGrad.addColorStop(0, `rgba(140,0,255,${aura})`);
    auraGrad.addColorStop(0.5, `rgba(80,0,160,${aura * 0.4})`);
    auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(screenX, screenY + bob, radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    const bodyGrad = ctx.createRadialGradient(screenX - 8, screenY + bob - 10, 4, screenX, screenY + bob, radius);
    bodyGrad.addColorStop(0, 'rgb(90,10,140)');
    bodyGrad.addColorStop(0.5, 'rgb(45,0,90)');
    bodyGrad.addColorStop(1, 'rgb(15,0,35)');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(screenX, screenY + bob, radius, 0, Math.PI * 2);
    ctx.fill();

    // Spikes on top
    for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 + (i - 2) * 0.38 + Math.sin(fc * 0.025 + i) * 0.08;
        const sx2 = screenX + Math.cos(angle) * radius * 0.9;
        const sy2 = screenY + bob + Math.sin(angle) * radius * 0.9;
        const ex = screenX + Math.cos(angle) * (radius + 14 + (i % 2) * 6);
        const ey = screenY + bob + Math.sin(angle) * (radius + 14 + (i % 2) * 6);
        ctx.strokeStyle = 'rgb(180,60,255)';
        ctx.lineWidth = 3 - (i % 2);
        ctx.beginPath();
        ctx.moveTo(sx2, sy2);
        ctx.lineTo(ex, ey);
        ctx.stroke();
    }

    // Glowing eyes
    const eyeOffX = 13, eyeY = screenY + bob - 10;
    for (const ex of [screenX - eyeOffX, screenX + eyeOffX]) {
        const eyeGlow = 0.6 + Math.sin(fc * 0.12) * 0.35;
        ctx.fillStyle = `rgba(255,0,120,${eyeGlow * 0.35})`;
        ctx.beginPath(); ctx.arc(ex, eyeY, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,60,160,${eyeGlow})`;
        ctx.beginPath(); ctx.arc(ex, eyeY, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(ex + 1, eyeY - 1, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Teeth
    for (let t = 0; t < 5; t++) {
        const tx = screenX - 20 + t * 10;
        const ty = screenY + bob + radius * 0.42;
        ctx.fillStyle = 'rgb(230,230,240)';
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + 4, ty + 9);
        ctx.lineTo(tx + 8, ty);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Floating name label
    const nameFloat = Math.sin(fc * 0.045) * 3;
    const name = 'המפלצת של איתי';
    ctx.font = `bold 13px ${FONT_MAIN}`;
    const nw = ctx.measureText(name).width;
    const nlx = screenX - nw / 2 - 8;
    const nly = screenY + bob - radius - 28 + nameFloat;
    const warnAlpha = 0.75 + Math.sin(fc * 0.1) * 0.25;
    ctx.fillStyle = `rgba(50,0,90,${warnAlpha * 0.92})`;
    ctx.beginPath();
    ctx.roundRect(nlx - 4, nly - 14, nw + 24, 19, 5);
    ctx.fill();
    ctx.strokeStyle = `rgba(200,60,255,${warnAlpha * 0.7})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(nlx - 4, nly - 14, nw + 24, 19, 5);
    ctx.stroke();
    ctx.fillStyle = `rgba(230,110,255,${warnAlpha})`;
    ctx.fillText(name, nlx + 4, nly);
}

function drawHud(ctx, player) {
    const hudW = 310, hudH = 68;
    const hudGrad = ctx.createLinearGradient(4, 4, 4, 4 + hudH);
    hudGrad.addColorStop(0, 'rgba(15,18,45,0.88)');
    hudGrad.addColorStop(1, 'rgba(8,10,28,0.92)');
    drawPanel(ctx, 4, 4, hudW, hudH, hudGrad, 'rgba(100,120,200,0.35)', 1.5, 10);

    const mon = player.firstUsableMonster();
    if (mon) {
        const mini = getMonsterMiniSprite(mon.speciesId);
        ctx.drawImage(mini, 12, 10);
        const xOff = 12 + mini.width + 8;
        ctx.fillStyle = WHITE;
        ctx.font = `bold 13px ${FONT_MAIN}`;
        ctx.fillText(`${mon.name}`, xOff, 22);
        ctx.fillStyle = 'rgba(180,190,230,0.8)';
        ctx.font = `11px ${FONT_MAIN}`;
        ctx.fillText(`רמה ${mon.level}`, xOff + 90, 22);
        drawHealthBar(ctx, xOff, 28, 150, mon.hp, mon.maxHp, '', 13);
    } else {
        ctx.fillStyle = WHITE;
        ctx.font = `13px ${FONT_MAIN}`;
        ctx.fillText('!אין מפלצות', 12, 24);
    }

    // Items row
    ctx.fillStyle = 'rgba(180,190,220,0.7)';
    ctx.font = `11px ${FONT_MAIN}`;
    const capsules = player.inventory.count('כמוסת לכידה');
    const potions = player.inventory.count('שיקוי ריפוי');
    ctx.fillText(`כמוסות:${capsules}  שיקויים:${potions}`, 12, 60);

    // Coins display with icon
    ctx.fillStyle = '#ffd232';
    ctx.font = `bold 12px ${FONT_MAIN}`;
    const coinText = `${player.coins}`;
    const coinW = ctx.measureText(coinText).width;
    ctx.fillText(`\u{1FA99} ${coinText}`, hudW - coinW - 30, 60);
}

// ===================================================================
// Battle rendering
// ===================================================================

function drawBattle(ctx, battle) {
    // Apply screen shake
    const shakeX = battle.anim.screenShake.offsetX;
    const shakeY = battle.anim.screenShake.offsetY;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawBattleBackground(ctx, battle.anim.frameCount, battle.isItayBattle);
    drawBattleArena(ctx, battle);
    drawEnemyInfoPanel(ctx, battle);
    drawPlayerInfoPanel(ctx, battle);

    // Draw particles
    battle.anim.particles.draw(ctx);
    // Draw floating texts
    for (const ft of battle.anim.floatingTexts) {
        ft.draw(ctx);
    }

    if (battle.state === BattleState.PLAYER_TURN) {
        drawMainMenu(ctx, battle);
    } else if (battle.state === BattleState.SELECT_MOVE) {
        drawMoveMenu(ctx, battle);
    } else if (battle.state === BattleState.SELECT_SWITCH) {
        drawSwitchMenu(ctx, battle);
    }

    drawMessageBox(ctx, battle.messages, battle.anim.frameCount);

    ctx.restore();
}

function drawBattleBackground(ctx, frameCount, isItay) {
    const skyH = Math.floor(SCREEN_HEIGHT * 0.55);

    if (isItay) {
        // === ITAY BOSS: dark void sky ===
        const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
        skyGrad.addColorStop(0, 'rgb(4,0,12)');
        skyGrad.addColorStop(0.4, 'rgb(12,0,30)');
        skyGrad.addColorStop(0.7, 'rgb(30,0,50)');
        skyGrad.addColorStop(1, 'rgb(45,5,60)');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, SCREEN_WIDTH, skyH);

        // Pulsing purple nebula clouds
        for (let i = 0; i < 5; i++) {
            const cx = (i * 193 + frameCount * 0.12) % SCREEN_WIDTH;
            const cy = 30 + (i * 61) % (skyH - 60);
            const pulse = 0.06 + Math.sin(frameCount * 0.03 + i * 1.5) * 0.04;
            const r = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90 + i * 20);
            r.addColorStop(0, `rgba(120,0,180,${pulse})`);
            r.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = r;
            ctx.fillRect(0, 0, SCREEN_WIDTH, skyH);
        }

        // Red/purple animated lightning cracks
        ctx.save();
        const lc = Math.floor(frameCount / 22) % 5;
        if (lc < 3) {
            ctx.strokeStyle = `rgba(200,50,255,${0.5 + lc * 0.1})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const lx = 120 + lc * 200;
            ctx.moveTo(lx, 0);
            ctx.lineTo(lx + 15, 40);
            ctx.lineTo(lx + 5, 70);
            ctx.lineTo(lx + 22, 110);
            ctx.stroke();
        }
        ctx.restore();

        // Dark cracked ground
        const groundGrad = ctx.createLinearGradient(0, skyH, 0, SCREEN_HEIGHT);
        groundGrad.addColorStop(0, 'rgb(20,5,30)');
        groundGrad.addColorStop(0.3, 'rgb(15,3,22)');
        groundGrad.addColorStop(1, 'rgb(8,0,12)');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, skyH, SCREEN_WIDTH, SCREEN_HEIGHT - skyH);

        // Ground cracks / lava glow lines
        for (let i = 0; i < 5; i++) {
            const gy = skyH + 15 + i * 38;
            const glowPulse = 0.08 + Math.sin(frameCount * 0.05 + i * 0.8) * 0.05;
            ctx.strokeStyle = `rgba(160,0,80,${glowPulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(SCREEN_WIDTH, gy);
            ctx.stroke();
        }

        // Dark purple horizon glow
        const horizonGrad = ctx.createLinearGradient(0, skyH - 20, 0, skyH + 20);
        horizonGrad.addColorStop(0, 'rgba(100,0,150,0)');
        horizonGrad.addColorStop(0.5, 'rgba(120,0,160,0.4)');
        horizonGrad.addColorStop(1, 'rgba(100,0,150,0)');
        ctx.fillStyle = horizonGrad;
        ctx.fillRect(0, skyH - 20, SCREEN_WIDTH, 40);

        // Dark vignette overlay
        const vig = ctx.createRadialGradient(SCREEN_WIDTH/2, SCREEN_HEIGHT/2, 200, SCREEN_WIDTH/2, SCREEN_HEIGHT/2, 600);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    } else {
        // === NORMAL BATTLE BACKGROUND ===
        const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
        skyGrad.addColorStop(0, 'rgb(15,12,45)');
        skyGrad.addColorStop(0.4, 'rgb(30,28,70)');
        skyGrad.addColorStop(0.7, 'rgb(50,55,100)');
        skyGrad.addColorStop(1, 'rgb(65,75,110)');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, SCREEN_WIDTH, skyH);

        // Subtle animated stars in sky
        for (let i = 0; i < 20; i++) {
            const sx = (i * 137 + frameCount * 0.05) % SCREEN_WIDTH;
            const sy = (i * 67) % (skyH - 20) + 10;
            const brightness = 0.15 + Math.sin(frameCount * 0.04 + i * 3) * 0.1;
            ctx.fillStyle = `rgba(200,210,255,${brightness})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ground gradient
        const groundGrad = ctx.createLinearGradient(0, skyH, 0, SCREEN_HEIGHT);
        groundGrad.addColorStop(0, 'rgb(55,70,50)');
        groundGrad.addColorStop(0.3, 'rgb(45,60,40)');
        groundGrad.addColorStop(1, 'rgb(30,42,28)');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, skyH, SCREEN_WIDTH, SCREEN_HEIGHT - skyH);

        // Horizon glow
        const horizonGrad = ctx.createLinearGradient(0, skyH - 15, 0, skyH + 15);
        horizonGrad.addColorStop(0, 'rgba(120,140,100,0)');
        horizonGrad.addColorStop(0.5, 'rgba(120,140,100,0.3)');
        horizonGrad.addColorStop(1, 'rgba(120,140,100,0)');
        ctx.fillStyle = horizonGrad;
        ctx.fillRect(0, skyH - 15, SCREEN_WIDTH, 30);

        // Ground grid lines (perspective feel)
        for (let i = 0; i < 6; i++) {
            const gy = skyH + 20 + i * 40;
            const alpha = Math.max(0.03, (0.18 - i * 0.03));
            ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(SCREEN_WIDTH, gy);
            ctx.stroke();
        }
    }
}

// ===================================================================
// Custom canvas starter sprites (IDs 1, 2, 3)
// Drawn in the same hand-crafted style as Itay's boss sprite
// but with lighter animation. cx/cy = body centre, scale = optional.
// ===================================================================

function _drawStarterCanvasSprite(ctx, speciesId, cx, cy, fc, flashActive, scale) {
    scale = scale || 1;
    ctx.save();
    ctx.translate(cx, cy);
    if (scale !== 1) ctx.scale(scale, scale);
    if      (speciesId === 1) _drawBlazeleteCanvas(ctx, fc, flashActive);
    else if (speciesId === 2) _drawAquaphinCanvas(ctx, fc, flashActive);
    else if (speciesId === 3) _drawThornixCanvas(ctx, fc, flashActive);
    ctx.restore();
}

// ── BLAZELETE (1 · FIRE) ── fire salamander ──────────────────────
function _drawBlazeleteCanvas(ctx, fc, flashActive) {
    const tailWave   = Math.sin(fc * 0.08) * 6;
    const flamePulse = 0.82 + Math.sin(fc * 0.14) * 0.18;

    // Warm aura
    const aura = ctx.createRadialGradient(0, 10, 12, 0, 10, 56);
    aura.addColorStop(0, 'rgba(255,120,0,0.10)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.ellipse(0, 10, 56, 56, 0, 0, Math.PI*2); ctx.fill();

    // ── Tail (drawn behind body) ──
    ctx.save();
    ctx.strokeStyle = 'rgb(195,55,0)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(28, 30);
    ctx.bezierCurveTo(52, 20+tailWave, 66, tailWave, 63, -14+tailWave*0.6);
    ctx.stroke();
    ctx.strokeStyle = 'rgb(235,95,0)'; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(63, -14+tailWave*0.6);
    ctx.bezierCurveTo(68, -22+tailWave*0.4, 63, -29, 58, -34+tailWave*0.3);
    ctx.stroke();
    ctx.restore();

    // Flame tip (only animated element)
    const ftx = 58, fty = -34 + tailWave*0.3;
    const fg = ctx.createRadialGradient(ftx, fty, 0, ftx, fty, 12*flamePulse);
    fg.addColorStop(0, `rgba(255,235,50,${flamePulse})`);
    fg.addColorStop(0.5, `rgba(255,130,0,${flamePulse*0.8})`);
    fg.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(ftx, fty, 12*flamePulse, 0, Math.PI*2); ctx.fill();

    // ── Body ──
    const bg = ctx.createRadialGradient(-8, 5, 4, 0, 12, 40);
    bg.addColorStop(0, 'rgb(255,130,38)');
    bg.addColorStop(0.55, 'rgb(218,68,8)');
    bg.addColorStop(1, 'rgb(155,34,0)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 12, 37, 33, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(100,20,0,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Belly
    const bel = ctx.createRadialGradient(0, 18, 0, 0, 18, 23);
    bel.addColorStop(0, 'rgb(255,215,138)'); bel.addColorStop(1, 'rgba(255,168,88,0)');
    ctx.fillStyle = bel;
    ctx.beginPath(); ctx.ellipse(0, 20, 20, 22, 0, 0, Math.PI*2); ctx.fill();

    // ── Legs ──
    ctx.fillStyle = 'rgb(192,52,6)';
    ctx.beginPath(); ctx.ellipse(-28, 36, 11, 7, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 28, 36, 11, 7,  0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-20, 48, 13, 8, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 20, 48, 13, 8,  0.5, 0, Math.PI*2); ctx.fill();

    // ── Head ──
    const hg = ctx.createRadialGradient(-6, -24, 4, 0, -20, 27);
    hg.addColorStop(0, 'rgb(255,140,48)'); hg.addColorStop(1, 'rgb(198,56,4)');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.ellipse(0, -20, 25, 23, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(100,20,0,0.4)'; ctx.lineWidth = 1; ctx.stroke();

    // Horn nubs
    ctx.fillStyle = 'rgb(152,36,0)';
    for (const sx of [-13, 13]) {
        ctx.beginPath();
        ctx.moveTo(sx-4, -40); ctx.lineTo(sx, -52); ctx.lineTo(sx+4, -40);
        ctx.closePath(); ctx.fill();
    }

    // ── Eyes ──
    ctx.fillStyle = 'rgb(255,250,232)';
    ctx.beginPath(); ctx.ellipse(-10, -22,  8, 9, -0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 10, -22,  8, 9,  0.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgb(24,7,0)';
    ctx.beginPath(); ctx.ellipse(-10, -21, 5, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 10, -21, 5, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath(); ctx.arc(-13, -24, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(  7, -24, 2.5, 0, Math.PI*2); ctx.fill();

    // Nostrils
    ctx.fillStyle = 'rgba(100,20,0,0.45)';
    ctx.beginPath(); ctx.arc(-5, -12, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 5, -12, 2, 0, Math.PI*2); ctx.fill();

    if (flashActive) {
        ctx.fillStyle = 'rgba(255,200,100,0.55)';
        ctx.beginPath(); ctx.ellipse(0, 0, 56, 66, 0, 0, Math.PI*2); ctx.fill();
    }
}

// ── AQUAPHIN (2 · WATER) ── cute dolphin ─────────────────────────
function _drawAquaphinCanvas(ctx, fc, flashActive) {
    const finWave     = Math.sin(fc * 0.07) * 10;
    const shimmerA    = 0.07 + Math.sin(fc * 0.10) * 0.04;

    // Cool aura
    const aura = ctx.createRadialGradient(0, 5, 10, 0, 5, 56);
    aura.addColorStop(0, 'rgba(40,140,255,0.09)'); aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.ellipse(0, 5, 56, 56, 0, 0, Math.PI*2); ctx.fill();

    // ── Tail fin (behind body) ──
    ctx.fillStyle = 'rgb(28,98,198)';
    ctx.save(); ctx.translate(0, 52);
    for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(s*22, 8+s*finWave*0.25, s*30, 18, s*20, 20);
        ctx.bezierCurveTo(s*10, 22, 0, 10, 0, 0);
        ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // ── Dorsal fin (animated tip) ──
    ctx.fillStyle = 'rgb(24,88,183)';
    ctx.beginPath();
    ctx.moveTo(-8, -33);
    ctx.bezierCurveTo(-16+finWave*0.35, -54, -4+finWave*0.25, -60, 6, -38);
    ctx.lineTo(0, -33); ctx.closePath(); ctx.fill();

    // ── Body ──
    const bg = ctx.createRadialGradient(-10, -4, 7, 0, 8, 44);
    bg.addColorStop(0, 'rgb(78,158,255)');
    bg.addColorStop(0.55, 'rgb(33,108,214)');
    bg.addColorStop(1, 'rgb(13,68,158)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 8, 33, 45, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(8,38,118,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Belly
    const bel = ctx.createRadialGradient(0, 12, 0, 0, 12, 30);
    bel.addColorStop(0, 'rgb(208,238,255)');
    bel.addColorStop(0.6, 'rgba(178,218,255,0.7)');
    bel.addColorStop(1, 'rgba(98,168,255,0)');
    ctx.fillStyle = bel;
    ctx.beginPath(); ctx.ellipse(0, 15, 20, 32, 0, 0, Math.PI*2); ctx.fill();

    // Water sparkles (only animated element on body)
    ctx.fillStyle = `rgba(200,240,255,${shimmerA})`;
    for (let i = 0; i < 3; i++) {
        const sy2 = -10 + Math.sin(fc*0.09 + i*1.2) * 14;
        ctx.beginPath(); ctx.arc(-15+i*15, sy2, 2.5, 0, Math.PI*2); ctx.fill();
    }

    // ── Side fins (gently wave) ──
    const fa = finWave * 0.015;
    for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(side*33, 15); ctx.rotate(side*(0.3+fa));
        ctx.fillStyle = 'rgb(28,98,198)';
        ctx.beginPath(); ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }

    // ── Head ──
    const hg = ctx.createRadialGradient(-6, -38, 4, 0, -35, 28);
    hg.addColorStop(0, 'rgb(88,168,255)'); hg.addColorStop(1, 'rgb(28,98,208)');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.ellipse(0, -35, 26, 22, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(8,38,118,0.35)'; ctx.lineWidth = 1; ctx.stroke();

    // Snout
    ctx.fillStyle = 'rgb(23,88,188)';
    ctx.beginPath(); ctx.ellipse(0, -22, 14, 9, 0, 0, Math.PI*2); ctx.fill();

    // ── Eye ──
    ctx.fillStyle = 'rgb(238,250,255)';
    ctx.beginPath(); ctx.ellipse(-12, -38, 9, 10, 0.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgb(8,22,78)';
    ctx.beginPath(); ctx.ellipse(-12, -37, 6, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath(); ctx.arc(-15, -40, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(-9, -33, 1.5, 0, Math.PI*2); ctx.fill();

    // Blowhole
    ctx.fillStyle = 'rgba(14,62,152,0.6)';
    ctx.beginPath(); ctx.ellipse(5, -50, 4, 2.5, 0.2, 0, Math.PI*2); ctx.fill();

    if (flashActive) {
        ctx.fillStyle = 'rgba(148,218,255,0.55)';
        ctx.beginPath(); ctx.ellipse(0, 0, 56, 66, 0, 0, Math.PI*2); ctx.fill();
    }
}

// ── THORNIX (3 · GRASS) ── spiky leaf creature ───────────────────
function _drawThornixCanvas(ctx, fc, flashActive) {
    const leafPulse = Math.sin(fc * 0.09);
    const leafG     = Math.floor(158 + leafPulse * 28); // green oscillates

    // Soft green aura
    const aura = ctx.createRadialGradient(0, 10, 10, 0, 10, 56);
    aura.addColorStop(0, 'rgba(60,180,60,0.08)'); aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.ellipse(0, 10, 56, 56, 0, 0, Math.PI*2); ctx.fill();

    // ── Leaf spikes on back (only animated element: colour shimmer) ──
    const spikes = [
        { a: -Math.PI*0.76, len: 28 },
        { a: -Math.PI*0.61, len: 33 },
        { a: -Math.PI*0.50, len: 36 },
        { a: -Math.PI*0.39, len: 33 },
        { a: -Math.PI*0.24, len: 28 },
    ];
    for (let i = 0; i < spikes.length; i++) {
        const { a, len } = spikes[i];
        const tipShift = Math.sin(fc*0.09 + i*0.65) * 2.5;
        const bx = Math.cos(a)*33, by = Math.sin(a)*30 + 12;
        const tx = bx + Math.cos(a)*len, ty = by + Math.sin(a)*len + tipShift;
        const lg = Math.floor(leafG + Math.sin(fc*0.09+i*0.6)*20);
        ctx.strokeStyle = `rgb(28,${Math.min(200,lg)},36)`; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.strokeStyle = `rgb(88,${Math.min(240,lg+45)},68)`; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx+(tx-bx)*0.5, by+(ty-by)*0.5);
        ctx.lineTo(tx, ty); ctx.stroke();
    }

    // ── Body ──
    const bg = ctx.createRadialGradient(-8, 5, 5, 0, 12, 40);
    bg.addColorStop(0, 'rgb(88,183,73)');
    bg.addColorStop(0.55, 'rgb(53,143,43)');
    bg.addColorStop(1, 'rgb(28,88,23)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 12, 36, 32, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(18,58,13,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Belly
    const bel = ctx.createRadialGradient(0, 18, 0, 0, 18, 24);
    bel.addColorStop(0, 'rgb(188,238,158)'); bel.addColorStop(1, 'rgba(148,208,118,0)');
    ctx.fillStyle = bel;
    ctx.beginPath(); ctx.ellipse(0, 20, 20, 22, 0, 0, Math.PI*2); ctx.fill();

    // ── Legs ──
    ctx.fillStyle = 'rgb(48,138,38)';
    ctx.beginPath(); ctx.ellipse(-28, 36, 11, 7, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 28, 36, 11, 7,  0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-20, 48, 13, 8, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 20, 48, 13, 8,  0.5, 0, Math.PI*2); ctx.fill();

    // ── Head ──
    const hg = ctx.createRadialGradient(-6, -22, 4, 0, -20, 27);
    hg.addColorStop(0, 'rgb(93,188,78)'); hg.addColorStop(1, 'rgb(48,138,38)');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.ellipse(0, -20, 25, 23, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(18,58,13,0.4)'; ctx.lineWidth = 1; ctx.stroke();

    // Ear-leaf nubs (colour-animated too)
    for (const [ex, flip] of [[-14, -1], [14, 1]]) {
        ctx.fillStyle = `rgb(28,${Math.min(200,leafG)},36)`;
        ctx.beginPath();
        ctx.moveTo(ex, -40); ctx.lineTo(ex+flip*8, -52); ctx.lineTo(ex+flip*4, -38);
        ctx.closePath(); ctx.fill();
    }

    // ── Eyes ──
    ctx.fillStyle = 'rgb(243,255,238)';
    ctx.beginPath(); ctx.ellipse(-10, -22,  8, 9, -0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 10, -22,  8, 9,  0.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgb(13,48,8)';
    ctx.beginPath(); ctx.ellipse(-10, -21, 5, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 10, -21, 5, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath(); ctx.arc(-13, -24, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(  7, -24, 2.5, 0, Math.PI*2); ctx.fill();

    // Nostrils
    ctx.fillStyle = 'rgba(18,58,13,0.45)';
    ctx.beginPath(); ctx.arc(-5, -11, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 5, -11, 2, 0, Math.PI*2); ctx.fill();

    if (flashActive) {
        ctx.fillStyle = 'rgba(148,255,118,0.55)';
        ctx.beginPath(); ctx.ellipse(0, 0, 56, 66, 0, 0, Math.PI*2); ctx.fill();
    }
}

function _drawItayBattleSprite(ctx, cx, cy, fc, flashActive) {
    ctx.save();

    const R = 72; // body radius
    const pulse = Math.sin(fc * 0.06) * 0.12; // pulsing scale
    const scale = 1 + pulse;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // === Outer aura rings ===
    for (let ring = 3; ring >= 1; ring--) {
        const auraAlpha = (0.06 + Math.sin(fc * 0.04 + ring) * 0.03) / ring;
        const auraR = ctx.createRadialGradient(0, 0, R * ring * 0.5, 0, 0, R * ring);
        auraR.addColorStop(0, `rgba(160,0,220,${auraAlpha * 2})`);
        auraR.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = auraR;
        ctx.beginPath();
        ctx.arc(0, 0, R * ring, 0, Math.PI * 2);
        ctx.fill();
    }

    // === Dark tendrils (8 squiggly arms) ===
    ctx.save();
    for (let t = 0; t < 8; t++) {
        const angle = (t / 8) * Math.PI * 2 + fc * 0.02;
        const wriggle = Math.sin(fc * 0.08 + t * 0.9) * 12;
        ctx.strokeStyle = `rgba(80,0,120,0.7)`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * (R - 10), Math.sin(angle) * (R - 10));
        ctx.bezierCurveTo(
            Math.cos(angle + 0.3) * (R + 30) + wriggle,
            Math.sin(angle + 0.3) * (R + 30) + wriggle,
            Math.cos(angle - 0.3) * (R + 55),
            Math.sin(angle - 0.3) * (R + 55),
            Math.cos(angle) * (R + 75),
            Math.sin(angle) * (R + 75)
        );
        ctx.stroke();
    }
    ctx.restore();

    // === Spikes (7 triangular spikes around body) ===
    ctx.save();
    for (let s = 0; s < 7; s++) {
        const sa = (s / 7) * Math.PI * 2 + Math.PI / 14;
        const spikePulse = R + 22 + Math.sin(fc * 0.07 + s * 0.8) * 4;
        ctx.fillStyle = 'rgb(60,0,90)';
        ctx.beginPath();
        ctx.moveTo(Math.cos(sa - 0.2) * (R - 5), Math.sin(sa - 0.2) * (R - 5));
        ctx.lineTo(Math.cos(sa) * spikePulse, Math.sin(sa) * spikePulse);
        ctx.lineTo(Math.cos(sa + 0.2) * (R - 5), Math.sin(sa + 0.2) * (R - 5));
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // === Body ===
    const bodyGrad = ctx.createRadialGradient(-15, -20, 10, 0, 0, R);
    bodyGrad.addColorStop(0, 'rgb(60,0,100)');
    bodyGrad.addColorStop(0.5, 'rgb(30,0,60)');
    bodyGrad.addColorStop(1, 'rgb(10,0,20)');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();

    // Body rim glow
    const rimGlow = 0.4 + Math.sin(fc * 0.06) * 0.2;
    ctx.strokeStyle = `rgba(180,0,255,${rimGlow})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();

    // === Central eye (large cyclops) ===
    const eyeY = -8;
    // Eye white (glowing)
    const eyeGlow = ctx.createRadialGradient(0, eyeY, 0, 0, eyeY, 24);
    eyeGlow.addColorStop(0, 'rgb(255,200,255)');
    eyeGlow.addColorStop(0.4, 'rgb(220,100,255)');
    eyeGlow.addColorStop(1, 'rgb(80,0,120)');
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.ellipse(0, eyeY, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vertical slit pupil
    ctx.fillStyle = 'rgb(5,0,10)';
    ctx.beginPath();
    ctx.ellipse(0, eyeY, 6, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil glow (red)
    const pupilGlow = ctx.createRadialGradient(0, eyeY, 0, 0, eyeY, 8);
    pupilGlow.addColorStop(0, 'rgba(255,50,50,0.9)');
    pupilGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pupilGlow;
    ctx.beginPath();
    ctx.ellipse(0, eyeY, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // === Two small side eyes ===
    for (let se = -1; se <= 1; se += 2) {
        const sex = se * 38, sey = 5;
        const seyGlow = ctx.createRadialGradient(sex, sey, 0, sex, sey, 9);
        seyGlow.addColorStop(0, 'rgb(255,120,0)');
        seyGlow.addColorStop(0.5, 'rgb(200,50,0)');
        seyGlow.addColorStop(1, 'rgb(60,0,0)');
        ctx.fillStyle = seyGlow;
        ctx.beginPath();
        ctx.ellipse(sex, sey, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // small dark pupil
        ctx.fillStyle = 'rgb(5,0,0)';
        ctx.beginPath();
        ctx.arc(sex, sey, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // === Jagged mouth / teeth ===
    const mouthY = 28;
    ctx.fillStyle = 'rgb(5,0,10)';
    ctx.beginPath();
    ctx.ellipse(0, mouthY, 38, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Teeth (7 triangles)
    ctx.fillStyle = 'rgb(240,230,255)';
    for (let tooth = 0; tooth < 7; tooth++) {
        const tx = -33 + tooth * 11;
        ctx.beginPath();
        ctx.moveTo(tx, mouthY - 4);
        ctx.lineTo(tx + 5, mouthY - 13);
        ctx.lineTo(tx + 10, mouthY - 4);
        ctx.closePath();
        ctx.fill();
    }

    // Bottom teeth (shorter)
    ctx.fillStyle = 'rgb(200,190,220)';
    for (let tooth = 0; tooth < 6; tooth++) {
        const tx = -28 + tooth * 11;
        ctx.beginPath();
        ctx.moveTo(tx, mouthY + 4);
        ctx.lineTo(tx + 5, mouthY + 10);
        ctx.lineTo(tx + 10, mouthY + 4);
        ctx.closePath();
        ctx.fill();
    }

    // === Flash effect (white overlay) ===
    if (flashActive) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, R + 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    ctx.restore();

    // === Floating name label under sprite ===
    ctx.save();
    ctx.font = `bold 13px ${FONT_MAIN}`;
    const nameLabel = 'המפלצת של איתי';
    const nlW = ctx.measureText(nameLabel).width + 14;
    const nlX = cx - nlW / 2;
    const nlY = cy + R * scale + 18;
    const labelAlpha = 0.7 + Math.sin(fc * 0.06) * 0.15;
    ctx.fillStyle = `rgba(60,0,100,${labelAlpha})`;
    ctx.beginPath();
    ctx.roundRect(nlX, nlY - 14, nlW, 20, 5);
    ctx.fill();
    ctx.strokeStyle = `rgba(180,0,255,${labelAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = `rgba(220,160,255,${labelAlpha})`;
    ctx.fillText(nameLabel, nlX + 7, nlY);
    ctx.restore();
}

function drawBattleArena(ctx, battle) {
    const fc = battle.anim.frameCount;
    // Idle bob offset (sine wave)
    const enemyBob = Math.sin(fc * 0.05) * 3;
    const playerBob = Math.sin(fc * 0.05 + Math.PI) * 2.5;

    // Enemy platform + sprite (top-right)
    const platEx = SCREEN_WIDTH - 280;
    const platEy = Math.floor(SCREEN_HEIGHT * 0.30);

    // Platform ellipse
    if (battle.isItayBattle) {
        // Dark void platform with purple glow
        const platPulse = 0.3 + Math.sin(fc * 0.06) * 0.15;
        ctx.fillStyle = `rgba(30,0,50,0.9)`;
        ctx.beginPath();
        ctx.ellipse(platEx + 60, platEy + 20, 85, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(150,0,220,${platPulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(platEx + 60, platEy + 15, 85, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        ctx.fillStyle = 'rgb(60,75,55)';
        ctx.beginPath();
        ctx.ellipse(platEx + 60, platEy + 20, 80, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgb(80,100,70)';
        ctx.beginPath();
        ctx.ellipse(platEx + 60, platEy + 15, 80, 15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    const slideE = battle.anim.enemySlide;
    const flashActive = battle.anim.enemyFlash > 0 && battle.anim.enemyFlash % 3 < 2;

    if (battle.isItayBattle) {
        // === Custom Itay Boss Sprite ===
        const cx = platEx + 60 + slideE;
        const cy = platEy - 55 + enemyBob;
        _drawItayBattleSprite(ctx, cx, cy, fc, flashActive);
    } else if (battle.enemyMon.speciesId <= 3) {
        // === Custom canvas starter sprite (enemy side) ===
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath(); ctx.ellipse(platEx+60+slideE, platEy+4, 42, 8, 0, 0, Math.PI*2); ctx.fill();
        _drawStarterCanvasSprite(ctx, battle.enemyMon.speciesId,
            platEx + 60 + slideE, platEy - 50 + enemyBob, fc, flashActive, 1.0);
    } else {
        const enemySprite = getMonsterBattleSprite(battle.enemyMon.speciesId);
        const ex = platEx + 60 - enemySprite.width / 2 + slideE;
        const ey = platEy - enemySprite.height + 8 + enemyBob;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(ex + 5, platEy - 2, enemySprite.width - 10, 8);
        if (flashActive) {
            ctx.globalAlpha = 0.5; ctx.drawImage(enemySprite, ex, ey); ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(ex, ey, enemySprite.width, enemySprite.height);
        } else {
            ctx.drawImage(enemySprite, ex, ey);
        }
    }

    // Player platform + sprite (bottom-left)
    const platPx = 80;
    const platPy = Math.floor(SCREEN_HEIGHT * 0.60);

    ctx.fillStyle = 'rgb(50,65,45)';
    ctx.beginPath(); ctx.ellipse(platPx+70, platPy+26, 100, 18, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgb(70,90,60)';
    ctx.beginPath(); ctx.ellipse(platPx+70, platPy+18, 100, 18, 0, 0, Math.PI*2); ctx.fill();

    const slideP   = battle.anim.playerSlide;
    const playerFlash = battle.anim.playerFlash > 0 && battle.anim.playerFlash % 3 < 2;

    if (battle.playerMon.speciesId <= 3) {
        // === Custom canvas starter sprite (player side, 1.4× scale) ===
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(platPx+70+slideP, platPy+2, 55, 10, 0, 0, Math.PI*2); ctx.fill();
        _drawStarterCanvasSprite(ctx, battle.playerMon.speciesId,
            platPx + 70 + slideP, platPy - 68 + playerBob, fc, playerFlash, 1.4);
    } else {
        const playerSprite = getMonsterBattleSprite(battle.playerMon.speciesId);
        const scaledW = Math.floor(playerSprite.width * 1.4);
        const scaledH = Math.floor(playerSprite.height * 1.4);
        const ppx = platPx + 70 - scaledW / 2 + slideP;
        const ppy = platPy - scaledH + 10 + playerBob;
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(ppx + 8, platPy - 2, scaledW - 16, 10);
        if (playerFlash) {
            ctx.globalAlpha = 0.5; ctx.drawImage(playerSprite, ppx, ppy, scaledW, scaledH); ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(ppx, ppy, scaledW, scaledH);
        } else {
            ctx.drawImage(playerSprite, ppx, ppy, scaledW, scaledH);
        }
    }
}

function drawEnemyInfoPanel(ctx, battle) {
    const px = 20, py = 30, pw = 300, ph = 80;
    const enemy = battle.enemyMon;

    if (battle.isItayBattle) {
        // === ITAY BOSS panel: glowing dark purple ===
        const fc = battle.anim.frameCount;
        const glowPulse = 0.5 + Math.sin(fc * 0.07) * 0.3;

        // Dark panel fill
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 8);
        ctx.fillStyle = 'rgba(8,0,20,0.95)';
        ctx.fill();

        // Animated purple glow border
        ctx.strokeStyle = `rgba(160,0,220,${glowPulse})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        // Outer glow halo
        ctx.save();
        const halo = ctx.createLinearGradient(px, py, px + pw, py + ph);
        halo.addColorStop(0, `rgba(120,0,200,${glowPulse * 0.25})`);
        halo.addColorStop(0.5, `rgba(200,0,120,${glowPulse * 0.15})`);
        halo.addColorStop(1, `rgba(120,0,200,${glowPulse * 0.25})`);
        ctx.beginPath();
        ctx.roundRect(px - 3, py - 3, pw + 6, ph + 6, 11);
        ctx.fillStyle = halo;
        ctx.fill();
        ctx.restore();

        // Boss name — red/orange gradient text
        ctx.save();
        const nameGrad = ctx.createLinearGradient(px + 12, py + 10, px + 12, py + 30);
        nameGrad.addColorStop(0, 'rgb(255,80,80)');
        nameGrad.addColorStop(1, 'rgb(200,20,200)');
        ctx.fillStyle = nameGrad;
        ctx.font = `bold 16px ${FONT_MAIN}`;
        ctx.fillText(enemy.name, px + 12, py + 22);
        ctx.restore();

        // ⚠ בוס badge
        ctx.save();
        ctx.font = `bold 11px ${FONT_MAIN}`;
        const bossBadge = ' ⚠ בוס ';
        const bw = ctx.measureText(bossBadge).width + 6;
        const bossGrad = ctx.createLinearGradient(px + 12, py + 28, px + 12 + bw, py + 46);
        bossGrad.addColorStop(0, 'rgb(180,0,50)');
        bossGrad.addColorStop(1, 'rgb(120,0,180)');
        ctx.fillStyle = bossGrad;
        ctx.beginPath();
        ctx.roundRect(px + 12, py + 29, bw, 17, 4);
        ctx.fill();
        ctx.fillStyle = 'rgb(255,200,200)';
        ctx.fillText(bossBadge, px + 14, py + 43);
        ctx.restore();

        // Level text
        ctx.fillStyle = 'rgba(220,150,255,0.9)';
        ctx.font = `12px ${FONT_MAIN}`;
        const lvText = `רמה ${enemy.level}`;
        const lvW = ctx.measureText(lvText).width;
        ctx.fillText(lvText, px + pw - lvW - 12, py + 22);

        // HP bar with red/dark style
        const dispEnemyHp = Math.round(battle.anim.displayEnemyHp);
        drawHealthBar(ctx, px + 12, py + 54, pw - 24, dispEnemyHp, enemy.maxHp, 'HP: ', 16);

    } else {
        // === NORMAL panel ===
        drawPanel(ctx, px, py, pw, ph, 'rgba(10,15,35,0.88)', 'rgba(120,140,200,0.45)');

        const typeColor = TYPE_COLORS[enemy.monType] || WHITE;

        // Name and level
        ctx.fillStyle = WHITE;
        ctx.font = `bold 15px ${FONT_MAIN}`;
        const isTrainer = battle.isTrainerBattle;
        ctx.fillText(`${enemy.name}${isTrainer ? '' : ' פראי'}`, px + 12, py + 22);

        ctx.fillStyle = 'rgba(180,190,230,0.8)';
        ctx.font = `12px ${FONT_MAIN}`;
        const lvText = `רמה ${enemy.level}`;
        const lvW = ctx.measureText(lvText).width;
        ctx.fillText(lvText, px + pw - lvW - 12, py + 22);

        // Type badge
        const typeName = TYPE_NAMES_HE[enemy.monType] || enemy.monType;
        const badgeText = ` ${typeName} `;
        ctx.font = `11px ${FONT_MAIN}`;
        const badgeW = ctx.measureText(badgeText).width + 6;
        ctx.fillStyle = typeColor;
        ctx.beginPath();
        ctx.roundRect(px + 12, py + 30, badgeW, 18, 5);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.font = `bold 11px ${FONT_MAIN}`;
        ctx.fillText(badgeText, px + 14, py + 44);

        // HP bar
        const dispEnemyHp = Math.round(battle.anim.displayEnemyHp);
        drawHealthBar(ctx, px + 12, py + 54, pw - 24, dispEnemyHp, enemy.maxHp, 'HP: ', 16);
    }
}

function drawPlayerInfoPanel(ctx, battle) {
    const pw = 310, ph = 100;
    const px = SCREEN_WIDTH - pw - 20;
    const py = SCREEN_HEIGHT - ph - 180;
    drawPanel(ctx, px, py, pw, ph, 'rgba(10,15,35,0.88)', 'rgba(120,140,200,0.45)');

    const pmon = battle.playerMon;
    const typeColor = TYPE_COLORS[pmon.monType] || WHITE;

    ctx.fillStyle = WHITE;
    ctx.font = `bold 15px ${FONT_MAIN}`;
    ctx.fillText(pmon.name, px + 12, py + 22);

    ctx.fillStyle = 'rgba(180,190,230,0.8)';
    ctx.font = `12px ${FONT_MAIN}`;
    const lvText2 = `רמה ${pmon.level}`;
    const lvW2 = ctx.measureText(lvText2).width;
    ctx.fillText(lvText2, px + pw - lvW2 - 12, py + 22);

    // Type badge
    const typeName2 = TYPE_NAMES_HE[pmon.monType] || pmon.monType;
    const badgeText2 = ` ${typeName2} `;
    ctx.font = `11px ${FONT_MAIN}`;
    const badgeW2 = ctx.measureText(badgeText2).width + 6;
    ctx.fillStyle = typeColor;
    ctx.beginPath();
    ctx.roundRect(px + 12, py + 30, badgeW2, 18, 5);
    ctx.fill();
    ctx.fillStyle = BLACK;
    ctx.font = `bold 11px ${FONT_MAIN}`;
    ctx.fillText(badgeText2, px + 14, py + 44);

    // HP bar
    const dispPlayerHp = Math.round(battle.anim.displayPlayerHp);
    drawHealthBar(ctx, px + 12, py + 54, pw - 24, dispPlayerHp, pmon.maxHp, 'HP: ', 16);

    // XP bar
    drawXpBar(ctx, px + 12, py + 78, pw - 60, pmon.experience, pmon.xpToNext);
    ctx.fillStyle = 'rgba(100,140,220,0.8)';
    ctx.font = `11px ${FONT_MAIN}`;
    ctx.fillText('נס', px + pw - 42, py + 86);
}

function drawMainMenu(ctx, battle) {
    const menuW = 240, menuH = 195;
    const mx = SCREEN_WIDTH - menuW - 20;
    const my = SCREEN_HEIGHT - menuH - 95;
    const fc = battle.anim.frameCount;

    drawPanel(ctx, mx, my, menuW, menuH, 'rgba(8,12,35,0.92)', 'rgba(160,170,220,0.5)');

    // Title bar
    ctx.strokeStyle = 'rgba(100,110,160,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx + 10, my + 28);
    ctx.lineTo(mx + menuW - 10, my + 28);
    ctx.stroke();
    ctx.fillStyle = 'rgba(170,175,220,0.8)';
    ctx.font = `bold 12px ${FONT_MAIN}`;
    ctx.fillText('תפריט קרב', mx + 14, my + 21);

    const options = [
        ['התקפה',  'rgb(255,120,80)'],
        ['החלפה',  'rgb(220,180,255)'],
        ['לכידה',   'rgb(100,200,255)'],
        ['פריט',    'rgb(120,220,120)'],
        ['בריחה',     'rgb(200,200,140)'],
    ];

    for (let i = 0; i < options.length; i++) {
        const [opt, color] = options[i];
        const oy = my + 36 + i * 30;
        const selected = i === battle.mainCursor;

        if (selected) {
            // Selection highlight with rounded rect
            ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', ',0.12)');
            ctx.beginPath();
            ctx.roundRect(mx + 8, oy, menuW - 16, 26, 5);
            ctx.fill();
            // Bouncing cursor
            const bounce = Math.sin(fc * 0.12) * 3;
            ctx.fillStyle = YELLOW;
            ctx.font = `bold 16px ${FONT_MAIN}`;
            ctx.fillText('▸', mx + 12 + bounce, oy + 19);
            ctx.fillText(opt, mx + 34, oy + 19);
        } else {
            ctx.fillStyle = color;
            ctx.font = `15px ${FONT_MAIN}`;
            ctx.fillText(opt, mx + 34, oy + 19);
        }
    }
}

function drawMoveMenu(ctx, battle) {
    const menuW = 420;
    const nMoves = battle.playerMon.moves.length;
    const menuH = 40 + nMoves * 40;
    const mx = SCREEN_WIDTH - menuW - 15;
    const my = SCREEN_HEIGHT - menuH - 95;

    drawPanel(ctx, mx, my, menuW, menuH, 'rgba(8,12,35,0.93)', 'rgba(160,170,220,0.5)');

    // Title
    ctx.fillStyle = 'rgba(170,175,220,0.8)';
    ctx.font = `bold 12px ${FONT_MAIN}`;
    ctx.fillText('[ESC] חזרה   בחר מהלך', mx + 14, my + 18);
    ctx.strokeStyle = 'rgba(100,110,160,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx + 10, my + 26);
    ctx.lineTo(mx + menuW - 10, my + 26);
    ctx.stroke();

    for (let i = 0; i < battle.playerMon.moves.length; i++) {
        const move = battle.playerMon.moves[i];
        const oy = my + 30 + i * 40;
        const selected = i === battle.moveCursor;
        const typeCol = TYPE_COLORS[move.moveType] || WHITE;

        if (selected) {
            let selColor;
            if (typeCol.startsWith('#')) {
                const r = parseInt(typeCol.slice(1,3), 16);
                const g = parseInt(typeCol.slice(3,5), 16);
                const b = parseInt(typeCol.slice(5,7), 16);
                selColor = `rgba(${r},${g},${b},0.12)`;
            } else {
                selColor = typeCol.replace('rgb', 'rgba').replace(')', ',0.12)');
            }
            ctx.fillStyle = selColor;
            ctx.beginPath();
            ctx.roundRect(mx + 8, oy, menuW - 16, 36, 5);
            ctx.fill();
            ctx.fillStyle = YELLOW;
            ctx.font = `bold 15px ${FONT_MAIN}`;
            ctx.fillText(`▸ ${move.name}`, mx + 12, oy + 23);
        } else {
            ctx.fillStyle = WHITE;
            ctx.font = `14px ${FONT_MAIN}`;
            ctx.fillText(`  ${move.name}`, mx + 12, oy + 23);
        }

        // Type badge
        const moveTypeName = TYPE_NAMES_HE[move.moveType] || move.moveType;
        const badgeText3 = ` ${moveTypeName} `;
        ctx.font = `11px ${FONT_MAIN}`;
        const badgeW3 = ctx.measureText(badgeText3).width + 6;
        const badgeX = mx + 180;
        ctx.fillStyle = typeCol;
        ctx.beginPath();
        ctx.roundRect(badgeX, oy + 7, badgeW3, 16, 5);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.font = `bold 11px ${FONT_MAIN}`;
        ctx.fillText(badgeText3, badgeX + 3, oy + 19);

        // Stats
        const stats = `עוצמה:${move.power}  PP:${move.currentPP}/${move.pp}`;
        ctx.fillStyle = 'rgba(180,190,220,0.7)';
        ctx.font = `11px ${FONT_MAIN}`;
        ctx.fillText(stats, badgeX + badgeW3 + 10, oy + 19);
    }
}

function drawSwitchMenu(ctx, battle) {
    const party = battle.player.party;
    const menuW = 420;
    const menuH = 40 + party.length * 50;
    const mx = SCREEN_WIDTH - menuW - 15;
    const my = SCREEN_HEIGHT - menuH - 95;

    drawPanel(ctx, mx, my, menuW, menuH, 'rgba(8,12,35,0.93)', 'rgba(160,170,220,0.5)');

    // Title
    ctx.fillStyle = 'rgba(170,175,220,0.8)';
    ctx.font = `bold 12px ${FONT_MAIN}`;
    ctx.fillText('[ESC] חזרה   בחר מפלצת להחלפה', mx + 14, my + 18);
    ctx.strokeStyle = 'rgba(100,110,160,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx + 10, my + 26);
    ctx.lineTo(mx + menuW - 10, my + 26);
    ctx.stroke();

    for (let i = 0; i < party.length; i++) {
        const mon = party[i];
        const oy = my + 30 + i * 50;
        const selected = i === battle.switchCursor;
        const isActive = mon === battle.playerMon;
        const isFainted = mon.isFainted;

        if (selected) {
            ctx.fillStyle = 'rgba(255,210,50,0.1)';
            ctx.beginPath();
            ctx.roundRect(mx + 8, oy, menuW - 16, 46, 5);
            ctx.fill();
        }

        // Mini sprite
        const mini = getMonsterMiniSprite(mon.speciesId);
        const miniScale = 0.7;
        const miniW = mini.width * miniScale;
        const miniH = mini.height * miniScale;
        if (isFainted) ctx.globalAlpha = 0.4;
        ctx.drawImage(mini, mx + 12, oy + (46 - miniH) / 2, miniW, miniH);
        ctx.globalAlpha = 1.0;

        // Name
        const nameX = mx + 12 + miniW + 8;
        if (selected) {
            ctx.fillStyle = YELLOW;
            ctx.font = `bold 14px ${FONT_MAIN}`;
            ctx.fillText('▸ ' + mon.name, nameX, oy + 18);
        } else {
            ctx.fillStyle = isFainted ? 'rgb(120,60,60)' : WHITE;
            ctx.font = `13px ${FONT_MAIN}`;
            ctx.fillText('  ' + mon.name, nameX, oy + 18);
        }

        // Level
        ctx.fillStyle = 'rgba(180,190,220,0.7)';
        ctx.font = `11px ${FONT_MAIN}`;
        ctx.fillText(`רמה ${mon.level}`, nameX + 2, oy + 34);

        // HP bar
        drawHealthBar(ctx, nameX + 80, oy + 24, 100, mon.hp, mon.maxHp, '', 10, false);

        // HP text
        ctx.fillStyle = 'rgba(180,190,220,0.7)';
        ctx.font = `10px ${FONT_MAIN}`;
        ctx.fillText(`${mon.hp}/${mon.maxHp}`, nameX + 185, oy + 34);

        // Status tags
        if (isActive) {
            ctx.fillStyle = 'rgb(80,200,80)';
            ctx.font = `bold 11px ${FONT_MAIN}`;
            ctx.fillText('בקרב', mx + menuW - 55, oy + 18);
        }
        if (isFainted) {
            ctx.fillStyle = 'rgb(200,60,60)';
            ctx.font = `bold 11px ${FONT_MAIN}`;
            ctx.fillText('מעולף', mx + menuW - 55, oy + 34);
        }

        // Type badge
        const typeCol = TYPE_COLORS[mon.monType] || WHITE;
        const typeName = TYPE_NAMES_HE[mon.monType] || mon.monType;
        const badge = ` ${typeName} `;
        ctx.font = `10px ${FONT_MAIN}`;
        const badgeW = ctx.measureText(badge).width + 4;
        ctx.fillStyle = typeCol;
        ctx.beginPath();
        ctx.roundRect(mx + menuW - 55, oy + 2, badgeW, 14, 4);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.font = `bold 10px ${FONT_MAIN}`;
        ctx.fillText(badge, mx + menuW - 54, oy + 13);
    }
}

function drawMessageBox(ctx, messages, frameCount) {
    const boxH = 88;
    const boxX = 10;
    const boxY = SCREEN_HEIGHT - boxH - 8;
    const boxW = SCREEN_WIDTH - 20;

    drawPanel(ctx, boxX, boxY, boxW, boxH, 'rgba(5,8,25,0.9)', 'rgba(140,155,200,0.45)');

    // Subtle corner accents
    const corners = [
        [boxX + 10, boxY + 10], [boxX + boxW - 10, boxY + 10],
        [boxX + 10, boxY + boxH - 10], [boxX + boxW - 10, boxY + boxH - 10],
    ];
    for (const [cx, cy] of corners) {
        ctx.fillStyle = 'rgba(100,120,180,0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = WHITE;
    ctx.font = `15px ${FONT_MAIN}`;
    const displayMessages = messages.slice(-3);
    let y = boxY + 26;

    for (const line of displayMessages) {
        ctx.fillText(line, boxX + 22, y);
        y += 24;
    }

    // Blinking indicator
    if (frameCount && Math.floor(frameCount / 20) % 2 === 0) {
        ctx.fillStyle = 'rgba(200,210,255,0.5)';
        ctx.font = `12px ${FONT_MAIN}`;
        ctx.fillText('▼', boxX + boxW - 26, boxY + boxH - 14);
    }
}

// ===================================================================
// Party screen
// ===================================================================

function drawPartyScreen(ctx, player, cursor, dragInfo, swapSource) {
    dragInfo = dragInfo || null;
    swapSource = (swapSource !== undefined && swapSource !== null) ? swapSource : -1;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    bgGrad.addColorStop(0, 'rgb(10,10,28)');
    bgGrad.addColorStop(1, 'rgb(6,6,18)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Title
    ctx.fillStyle = YELLOW;
    ctx.font = `bold 24px ${FONT_MAIN}`;
    const title = '-- הקבוצה --';
    const titleW = ctx.measureText(title).width;
    ctx.fillText(title, SCREEN_WIDTH / 2 - titleW / 2, 36);

    // Hint text
    ctx.fillStyle = 'rgba(140,150,190,0.5)';
    ctx.font = `12px ${FONT_MAIN}`;
    let hint;
    if (swapSource >= 0) {
        hint = '[ESC/OK] סיום   [↑/↓] הזז מפלצת';
    } else if (dragInfo) {
        hint = '...גרור למיקום הרצוי';
    } else if (window.isTouchDevice) {
        hint = 'OK: בחר להזזה   גרור כרטיס לשינוי סדר';
    } else {
        hint = '[ESC] סגירה   [OK/Enter] תפוס/שחרר להזזה   גרור עם עכבר';
    }
    const hintW = ctx.measureText(hint).width;
    ctx.fillText(hint, SCREEN_WIDTH / 2 - hintW / 2, 56);

    if (!player.party.length) {
        ctx.fillStyle = WHITE;
        ctx.font = `16px ${FONT_MAIN}`;
        ctx.fillText('.אין מפלצות בקבוצה', 60, 100);
        return;
    }

    // Build display order (live preview while dragging)
    let displayItems = player.party.map((mon, idx) => ({ mon, origIdx: idx }));
    let dragDisplayIdx = -1;
    if (dragInfo) {
        const rawTarget = Math.round((dragInfo.currentY - 80 - 45) / 100);
        const dropTarget = Math.max(0, Math.min(displayItems.length - 1, rawTarget));
        const [moved] = displayItems.splice(dragInfo.sourceIndex, 1);
        displayItems.splice(dropTarget, 0, moved);
        dragDisplayIdx = dropTarget;
    }

    for (let i = 0; i < displayItems.length; i++) {
        const { mon, origIdx } = displayItems[i];
        const isDragging  = dragInfo !== null && i === dragDisplayIdx;
        const isSwapSrc   = !dragInfo && origIdx === swapSource;
        const isSelected  = dragInfo ? isDragging : (origIdx === cursor);
        const isLeader    = i === 0;
        const y = 80 + i * 100;

        let borderCol, bg;
        if (isDragging) {
            borderCol = 'rgba(80,200,255,0.95)';
            bg = 'rgba(8,36,65,0.97)';
        } else if (isSwapSrc) {
            borderCol = 'rgba(255,200,50,0.95)';
            bg = 'rgba(40,34,5,0.97)';
        } else if (isSelected) {
            borderCol = YELLOW;
            bg = 'rgba(25,30,60,0.94)';
        } else {
            borderCol = 'rgba(70,70,110,0.5)';
            bg = 'rgba(14,16,38,0.86)';
        }

        ctx.globalAlpha = (dragInfo && !isDragging) ? 0.55 : 1.0;
        drawPanel(ctx, 30, y, SCREEN_WIDTH - 60, 90, bg, borderCol, (isSelected || isDragging || isSwapSrc) ? 2.5 : 1);
        ctx.globalAlpha = 1.0;

        // Grab handle
        ctx.fillStyle = isDragging ? 'rgba(80,200,255,0.8)'
                      : isSwapSrc ? 'rgba(255,200,50,0.7)'
                      : 'rgba(180,190,220,0.28)';
        ctx.font = `18px ${FONT_MAIN}`;
        ctx.fillText('⠿', 40, y + 53);

        // Leader badge (top right of card)
        if (isLeader) {
            ctx.font = `bold 11px ${FONT_MAIN}`;
            const lbTxt = '★ מוביל';
            const lbW = ctx.measureText(lbTxt).width;
            ctx.fillStyle = 'rgba(255,200,30,0.15)';
            ctx.beginPath();
            ctx.roundRect(SCREEN_WIDTH - 30 - lbW - 16, y + 5, lbW + 12, 17, 4);
            ctx.fill();
            ctx.fillStyle = YELLOW;
            ctx.fillText(lbTxt, SCREEN_WIDTH - 30 - lbW - 10, y + 18);
        }

        // Swap-mode indicator
        if (isSwapSrc) {
            ctx.font = `11px ${FONT_MAIN}`;
            const smTxt = '↕ מהזז...';
            ctx.fillStyle = 'rgba(255,200,50,0.7)';
            ctx.fillText(smTxt, SCREEN_WIDTH - 30 - ctx.measureText(smTxt).width - 10, y + 18);
        }

        // Mini sprite (shifted right for grab handle)
        const mini = getMonsterMiniSprite(mon.speciesId);
        ctx.drawImage(mini, 58, y + (90 - mini.height) / 2);
        const infoX = 58 + mini.width + 12;

        // Name & level
        ctx.fillStyle = (isSelected || isDragging || isSwapSrc) ? YELLOW : WHITE;
        ctx.font = `bold 15px ${FONT_MAIN}`;
        ctx.fillText(`${mon.name}`, infoX, y + 22);
        ctx.fillStyle = 'rgba(180,190,230,0.7)';
        ctx.font = `12px ${FONT_MAIN}`;
        ctx.fillText(`רמה ${mon.level}`, infoX + 100, y + 22);

        // Type badge
        const typeCol = TYPE_COLORS[mon.monType] || WHITE;
        const partyTypeName = TYPE_NAMES_HE[mon.monType] || mon.monType;
        const badgeTextP = ` ${partyTypeName} `;
        ctx.font = `11px ${FONT_MAIN}`;
        const badgeWP = ctx.measureText(badgeTextP).width + 6;
        ctx.fillStyle = typeCol;
        ctx.beginPath();
        ctx.roundRect(infoX, y + 32, badgeWP, 17, 5);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.font = `bold 11px ${FONT_MAIN}`;
        ctx.fillText(badgeTextP, infoX + 3, y + 45);

        // HP bar
        drawHealthBar(ctx, infoX, y + 55, 160, mon.hp, mon.maxHp, '', 14);

        // Stats
        const statsX = infoX + 200;
        ctx.fillStyle = 'rgba(180,190,220,0.7)';
        ctx.font = `12px ${FONT_MAIN}`;
        ctx.fillText(`התק:${mon.attack}  הגנ:${mon.defense}  מהי:${mon.speed}`, statsX, y + 22);
        const movesStr = mon.moves.map(m => m.name).join(', ');
        ctx.fillText(`מהלכים: ${movesStr}`, statsX, y + 42);
        ctx.fillText(`נס: ${mon.experience}/${mon.xpToNext}`, statsX, y + 62);
    }
}

// ===================================================================
// Monsterpedia screen
// ===================================================================

function drawMonsterpedia(ctx, cursor, frameCount, player) {
    frameCount = frameCount || 0;
    const speciesIds = Object.keys(SPECIES_DB).map(Number).sort((a, b) => a - b);
    const total = speciesIds.length;
    const discovered = player ? player.discovered : new Set();
    const caught = player ? player.caught : new Set();

    // Background
    const mpBg = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    mpBg.addColorStop(0, 'rgb(8,10,28)');
    mpBg.addColorStop(1, 'rgb(4,5,16)');
    ctx.fillStyle = mpBg;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Subtle animated background pattern
    for (let i = 0; i < 40; i++) {
        const bx = (i * 113 + frameCount * 0.1) % SCREEN_WIDTH;
        const by = (i * 79 + Math.sin(frameCount * 0.006 + i) * 15) % SCREEN_HEIGHT;
        const alpha = 0.025 + Math.sin(frameCount * 0.02 + i) * 0.012;
        ctx.fillStyle = `rgba(100,140,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Title
    const titleFloat = Math.sin(frameCount * 0.025) * 3;
    ctx.fillStyle = YELLOW;
    ctx.font = `bold 26px ${FONT_MAIN}`;
    const title = '-- מפלצופדיה --';
    const titleW = ctx.measureText(title).width;
    ctx.fillText(title, SCREEN_WIDTH / 2 - titleW / 2, 34 + titleFloat);

    // Collection counter
    ctx.fillStyle = 'rgba(180,190,220,0.7)';
    ctx.font = `12px ${FONT_MAIN}`;
    const countText = `נתפסו: ${caught.size}/${total}   נראו: ${discovered.size}/${total}`;
    const countW = ctx.measureText(countText).width;
    ctx.fillText(countText, SCREEN_WIDTH / 2 - countW / 2, 52);

    // Hint
    ctx.fillStyle = 'rgba(140,150,190,0.5)';
    ctx.font = `11px ${FONT_MAIN}`;
    const hint = '[ESC] סגירה   [למעלה/למטה] ניווט';
    const hintW = ctx.measureText(hint).width;
    ctx.fillText(hint, SCREEN_WIDTH / 2 - hintW / 2, 66);

    // Layout: species list on right, detail panel on left
    const listX = SCREEN_WIDTH - 240;
    const listY = 78;
    const listW = 225;
    const listItemH = 44;
    const maxVisible = Math.min(total, Math.floor((SCREEN_HEIGHT - listY - 20) / listItemH));

    // Scroll offset
    let scrollOffset = 0;
    if (cursor >= maxVisible) {
        scrollOffset = cursor - maxVisible + 1;
    }

    // Species list panel
    drawPanel(ctx, listX - 8, listY - 8, listW + 16, maxVisible * listItemH + 16, 'rgba(10,15,40,0.85)', 'rgb(80,90,140)');

    for (let i = 0; i < maxVisible; i++) {
        const idx = i + scrollOffset;
        if (idx >= total) break;
        const sid = speciesIds[idx];
        const species = SPECIES_DB[sid];
        const selected = idx === cursor;
        const isDiscovered = discovered.has(sid);
        const isCaught = caught.has(sid);
        const oy = listY + i * listItemH;

        if (selected) {
            ctx.fillStyle = 'rgba(255,210,50,0.12)';
            ctx.beginPath();
            ctx.roundRect(listX - 4, oy - 2, listW + 8, listItemH - 4, 6);
            ctx.fill();
            ctx.strokeStyle = YELLOW;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(listX - 4, oy - 2, listW + 8, listItemH - 4, 6);
            ctx.stroke();
        }

        // Catch status icon
        ctx.font = '12px ' + FONT_MAIN;
        if (isCaught) {
            ctx.fillStyle = '#50ff50';
            ctx.fillText('*', listX - 14, oy + 22);
        } else if (isDiscovered) {
            ctx.fillStyle = '#ffaa30';
            ctx.fillText('~', listX - 14, oy + 22);
        }

        if (isDiscovered) {
            // Mini sprite
            const mini = getMonsterMiniSprite(sid);
            const miniScale = 0.7;
            const miniW = mini.width * miniScale;
            const miniH = mini.height * miniScale;
            ctx.drawImage(mini, listX, oy + (listItemH - 4 - miniH) / 2, miniW, miniH);

            // Name
            ctx.fillStyle = selected ? YELLOW : WHITE;
            ctx.font = selected ? 'bold 14px ' + FONT_MAIN : '14px ' + FONT_MAIN;
            ctx.fillText(species.name, listX + miniW + 8, oy + 18);

            // Type badge
            const typeColor = TYPE_COLORS[species.type] || WHITE;
            const typeName = TYPE_NAMES_HE[species.type] || species.type;
            ctx.fillStyle = typeColor;
            ctx.font = '11px ' + FONT_MAIN;
            const badgeText = ` ${typeName} `;
            const badgeW = ctx.measureText(badgeText).width + 2;
            ctx.beginPath();
            ctx.roundRect(listX + miniW + 8, oy + 24, badgeW, 14, 3);
            ctx.fill();
            ctx.fillStyle = BLACK;
            ctx.fillText(badgeText, listX + miniW + 9, oy + 35);
        } else {
            // Unknown monster - show silhouette
            ctx.fillStyle = selected ? 'rgb(80,80,110)' : 'rgb(50,50,70)';
            ctx.font = '14px ' + FONT_MAIN;
            ctx.fillText('???', listX + 42, oy + 22);
            ctx.fillStyle = 'rgb(40,40,60)';
            ctx.font = '11px ' + FONT_MAIN;
            ctx.fillText('לא נראה', listX + 42, oy + 38);
        }

        // Number
        ctx.fillStyle = 'rgb(80,80,120)';
        ctx.font = '11px ' + FONT_MAIN;
        ctx.fillText(`#${String(sid).padStart(2, '0')}`, listX + listW - 30, oy + 18);
    }

    // Scroll indicator
    if (total > maxVisible) {
        const scrollBarH = maxVisible * listItemH;
        const thumbH = Math.max(20, (maxVisible / total) * scrollBarH);
        const thumbY = listY + (scrollOffset / (total - maxVisible)) * (scrollBarH - thumbH);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(listX + listW + 12, listY, 4, scrollBarH);
        ctx.fillStyle = 'rgba(255,210,50,0.5)';
        ctx.beginPath();
        ctx.roundRect(listX + listW + 11, thumbY, 6, thumbH, 3);
        ctx.fill();
    }

    // ========================
    // Detail panel (left side)
    // ========================
    const selId = speciesIds[cursor];
    const sel = SPECIES_DB[selId];
    const selDiscovered = discovered.has(selId);
    const selCaught = caught.has(selId);
    const detailX = 20;
    const detailY = 78;
    const detailW = SCREEN_WIDTH - 290;
    const detailH = SCREEN_HEIGHT - detailY - 16;

    drawPanel(ctx, detailX, detailY, detailW, detailH, 'rgba(12,16,42,0.92)', 'rgb(100,110,160)');

    if (!selDiscovered) {
        // Unknown monster panel
        ctx.fillStyle = 'rgb(50,50,70)';
        ctx.font = '60px ' + FONT_MAIN;
        const q = '?';
        const qw = ctx.measureText(q).width;
        ctx.fillText(q, detailX + detailW / 2 - qw / 2, detailY + detailH / 2 - 30);
        ctx.fillStyle = 'rgb(80,80,110)';
        ctx.font = '18px ' + FONT_MAIN;
        const unk = `#${String(selId).padStart(2, '0')} - לא נראה`;
        const unkW = ctx.measureText(unk).width;
        ctx.fillText(unk, detailX + detailW / 2 - unkW / 2, detailY + detailH / 2 + 20);
        ctx.fillStyle = 'rgb(60,60,85)';
        ctx.font = '13px ' + FONT_MAIN;
        const hint2 = 'פגוש מפלצת זו בטבע כדי לגלות אותה';
        const hint2W = ctx.measureText(hint2).width;
        ctx.fillText(hint2, detailX + detailW / 2 - hint2W / 2, detailY + detailH / 2 + 50);

        // Page indicator at bottom
        ctx.fillStyle = GRAY;
        ctx.font = '12px ' + FONT_MAIN;
        const pageText = `${cursor + 1} / ${total}`;
        const pageW = ctx.measureText(pageText).width;
        ctx.fillText(pageText, SCREEN_WIDTH / 2 - pageW / 2, SCREEN_HEIGHT - 10);
        return;
    }

    // Caught status badge
    if (selCaught) {
        ctx.fillStyle = '#50ff50';
        ctx.font = '12px ' + FONT_MAIN;
        ctx.fillText('* נתפס', detailX + detailW - 80, detailY + 18);
    } else {
        ctx.fillStyle = '#ffaa30';
        ctx.font = '12px ' + FONT_MAIN;
        ctx.fillText('~ נראה', detailX + detailW - 80, detailY + 18);
    }

    // Battle sprite (big, centered at top)
    const battleSprite = getMonsterBattleSprite(selId);
    const spriteScale = 1.5;
    const spriteW = battleSprite.width * spriteScale;
    const spriteH = battleSprite.height * spriteScale;
    const spriteX = detailX + detailW / 2 - spriteW / 2;
    const spriteY = detailY + 16;

    // Glow behind sprite
    const typeGlow = TYPE_COLORS[sel.type] || '#ffffff';
    const glowPulse = 0.15 + Math.sin(frameCount * 0.04) * 0.06;
    ctx.fillStyle = typeGlow.replace('#', '');
    // Convert hex to rgba for glow
    const r = parseInt(typeGlow.slice(1, 3), 16);
    const g = parseInt(typeGlow.slice(3, 5), 16);
    const b = parseInt(typeGlow.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r},${g},${b},${glowPulse})`;
    ctx.beginPath();
    ctx.ellipse(spriteX + spriteW / 2, spriteY + spriteH / 2, spriteW / 2 + 12, spriteH / 2 + 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Idle bob
    const bob = Math.sin(frameCount * 0.05) * 3;
    ctx.drawImage(battleSprite, spriteX, spriteY + bob, spriteW, spriteH);

    // Name + number
    const nameY = spriteY + spriteH + 18;
    ctx.fillStyle = WHITE;
    ctx.font = '22px ' + FONT_MAIN;
    const fullName = `#${String(selId).padStart(2, '0')} ${sel.name}`;
    const nameW = ctx.measureText(fullName).width;
    ctx.fillText(fullName, detailX + detailW / 2 - nameW / 2, nameY);

    // Type badge (large)
    const typeName2 = TYPE_NAMES_HE[sel.type] || sel.type;
    const typeColor2 = TYPE_COLORS[sel.type] || WHITE;
    ctx.font = '14px ' + FONT_MAIN;
    const bigBadge = ` ${typeName2} `;
    const bigBadgeW = ctx.measureText(bigBadge).width + 6;
    const badgeX = detailX + detailW / 2 - bigBadgeW / 2;
    ctx.fillStyle = typeColor2;
    ctx.beginPath();
    ctx.roundRect(badgeX, nameY + 8, bigBadgeW, 20, 4);
    ctx.fill();
    ctx.fillStyle = BLACK;
    ctx.font = '14px ' + FONT_MAIN;
    ctx.fillText(bigBadge, badgeX + 3, nameY + 24);

    // Divider
    const divY = nameY + 38;
    ctx.strokeStyle = 'rgb(60,65,100)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(detailX + 20, divY);
    ctx.lineTo(detailX + detailW - 20, divY);
    ctx.stroke();

    // Base stats section
    const statsY = divY + 14;
    ctx.fillStyle = 'rgb(150,160,210)';
    ctx.font = '14px ' + FONT_MAIN;
    ctx.fillText('נתוני בסיס', detailX + 30, statsY);

    const stats = [
        { label: 'חיים', value: sel.baseHp, max: 80, color: '#50c850' },
        { label: 'התקפה', value: sel.baseAttack, max: 80, color: '#f05028' },
        { label: 'הגנה', value: sel.baseDefense, max: 80, color: '#3c8cf0' },
        { label: 'מהירות', value: sel.baseSpeed, max: 80, color: '#fadc32' },
    ];

    const barX = detailX + 120;
    const barW = detailW - 180;
    let sy = statsY + 12;

    for (const stat of stats) {
        // Label
        ctx.fillStyle = LIGHT_GRAY;
        ctx.font = '13px ' + FONT_MAIN;
        const labelW = ctx.measureText(stat.label).width;
        ctx.fillText(stat.label, barX - labelW - 10, sy + 12);

        // Bar background
        ctx.fillStyle = 'rgb(25,28,50)';
        ctx.beginPath();
        ctx.roundRect(barX, sy, barW, 14, 4);
        ctx.fill();

        // Bar fill
        const ratio = Math.min(1, stat.value / stat.max);
        const fillW = Math.floor(barW * ratio);
        if (fillW > 0) {
            ctx.fillStyle = stat.color;
            ctx.beginPath();
            ctx.roundRect(barX, sy, fillW, 14, 4);
            ctx.fill();
            // Shine
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(barX, sy, fillW, 7);
        }

        // Border
        ctx.strokeStyle = 'rgb(50,55,80)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(barX, sy, barW, 14, 4);
        ctx.stroke();

        // Value
        ctx.fillStyle = WHITE;
        ctx.font = '12px ' + FONT_MAIN;
        ctx.fillText(String(stat.value), barX + barW + 8, sy + 12);

        sy += 24;
    }

    // Divider
    const div2Y = sy + 4;
    ctx.strokeStyle = 'rgb(60,65,100)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(detailX + 20, div2Y);
    ctx.lineTo(detailX + detailW - 20, div2Y);
    ctx.stroke();

    // Learnable moves
    const movesY = div2Y + 14;
    ctx.fillStyle = 'rgb(150,160,210)';
    ctx.font = '14px ' + FONT_MAIN;
    ctx.fillText('מהלכים נלמדים', detailX + 30, movesY);

    let my = movesY + 16;
    for (const [reqLv, moveName] of sel.learnable) {
        const move = MOVE_DB[moveName];
        if (!move) continue;

        // Level requirement
        ctx.fillStyle = 'rgb(100,105,140)';
        ctx.font = '12px ' + FONT_MAIN;
        ctx.fillText(`רמה ${String(reqLv).padStart(2, ' ')}`, detailX + 34, my + 12);

        // Move name
        ctx.fillStyle = WHITE;
        ctx.font = '13px ' + FONT_MAIN;
        ctx.fillText(move.name, detailX + 110, my + 12);

        // Move type badge
        const mTypeColor = TYPE_COLORS[move.moveType] || WHITE;
        const mTypeName = TYPE_NAMES_HE[move.moveType] || move.moveType;
        const mBadge = ` ${mTypeName} `;
        ctx.font = '11px ' + FONT_MAIN;
        const mBadgeW = ctx.measureText(mBadge).width + 2;
        ctx.fillStyle = mTypeColor;
        ctx.beginPath();
        ctx.roundRect(detailX + 200, my, mBadgeW, 14, 3);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.fillText(mBadge, detailX + 201, my + 11);

        // Power & accuracy
        ctx.fillStyle = LIGHT_GRAY;
        ctx.font = '11px ' + FONT_MAIN;
        ctx.fillText(`עוצמה:${move.power}  דיוק:${move.accuracy}%`, detailX + 200 + mBadgeW + 10, my + 12);

        my += 22;
    }

    // Divider
    const div3Y = my + 6;
    ctx.strokeStyle = 'rgb(60,65,100)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(detailX + 20, div3Y);
    ctx.lineTo(detailX + detailW - 20, div3Y);
    ctx.stroke();

    // Type effectiveness
    const effY = div3Y + 14;
    ctx.fillStyle = 'rgb(150,160,210)';
    ctx.font = '14px ' + FONT_MAIN;
    ctx.fillText('יעילות סוגים', detailX + 30, effY);

    const weakTo = [];
    const strongAgainst = [];
    const resistantTo = [];
    const allTypes = ['FIRE', 'WATER', 'GRASS', 'NORMAL', 'ELECTRIC', 'ICE', 'DARK'];

    for (const atkType of allTypes) {
        const eff = (TYPE_CHART[atkType] || {})[sel.type] || 1.0;
        if (eff > 1.0) weakTo.push(atkType);
        else if (eff < 1.0) resistantTo.push(atkType);
    }
    for (const defType of allTypes) {
        const eff = (TYPE_CHART[sel.type] || {})[defType] || 1.0;
        if (eff > 1.0) strongAgainst.push(defType);
    }

    let ey = effY + 14;

    // Weak to
    ctx.fillStyle = '#ff6060';
    ctx.font = '12px ' + FONT_MAIN;
    ctx.fillText('חלש נגד:', detailX + 34, ey + 12);
    let ex = detailX + 120;
    for (const t of weakTo) {
        const tc = TYPE_COLORS[t] || WHITE;
        const tn = TYPE_NAMES_HE[t] || t;
        const badge = ` ${tn} `;
        ctx.font = '11px ' + FONT_MAIN;
        const bw = ctx.measureText(badge).width + 2;
        ctx.fillStyle = tc;
        ctx.beginPath();
        ctx.roundRect(ex, ey, bw, 14, 3);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.fillText(badge, ex + 1, ey + 11);
        ex += bw + 6;
    }
    if (weakTo.length === 0) {
        ctx.fillStyle = GRAY;
        ctx.font = '11px ' + FONT_MAIN;
        ctx.fillText('אין', ex, ey + 12);
    }

    ey += 22;

    // Resistant to
    ctx.fillStyle = '#60b0ff';
    ctx.font = '12px ' + FONT_MAIN;
    ctx.fillText('עמיד נגד:', detailX + 34, ey + 12);
    ex = detailX + 120;
    for (const t of resistantTo) {
        const tc = TYPE_COLORS[t] || WHITE;
        const tn = TYPE_NAMES_HE[t] || t;
        const badge = ` ${tn} `;
        ctx.font = '11px ' + FONT_MAIN;
        const bw = ctx.measureText(badge).width + 2;
        ctx.fillStyle = tc;
        ctx.beginPath();
        ctx.roundRect(ex, ey, bw, 14, 3);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.fillText(badge, ex + 1, ey + 11);
        ex += bw + 6;
    }
    if (resistantTo.length === 0) {
        ctx.fillStyle = GRAY;
        ctx.font = '11px ' + FONT_MAIN;
        ctx.fillText('אין', ex, ey + 12);
    }

    ey += 22;

    // Strong against
    ctx.fillStyle = '#60ff80';
    ctx.font = '12px ' + FONT_MAIN;
    ctx.fillText('חזק נגד:', detailX + 34, ey + 12);
    ex = detailX + 120;
    for (const t of strongAgainst) {
        const tc = TYPE_COLORS[t] || WHITE;
        const tn = TYPE_NAMES_HE[t] || t;
        const badge = ` ${tn} `;
        ctx.font = '11px ' + FONT_MAIN;
        const bw = ctx.measureText(badge).width + 2;
        ctx.fillStyle = tc;
        ctx.beginPath();
        ctx.roundRect(ex, ey, bw, 14, 3);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.fillText(badge, ex + 1, ey + 11);
        ex += bw + 6;
    }
    if (strongAgainst.length === 0) {
        ctx.fillStyle = GRAY;
        ctx.font = '11px ' + FONT_MAIN;
        ctx.fillText('אין', ex, ey + 12);
    }

    // Evolution info
    if (sel.evolvesTo && SPECIES_DB[sel.evolvesTo]) {
        ey += 26;
        ctx.strokeStyle = 'rgb(60,65,100)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(detailX + 20, ey - 4);
        ctx.lineTo(detailX + detailW - 20, ey - 4);
        ctx.stroke();

        ctx.fillStyle = 'rgb(150,160,210)';
        ctx.font = '14px ' + FONT_MAIN;
        ctx.fillText('התפתחות', detailX + 30, ey + 10);

        const evoSpecies = SPECIES_DB[sel.evolvesTo];
        const evoDiscovered = discovered.has(sel.evolvesTo);
        ctx.fillStyle = 'rgb(100,105,140)';
        ctx.font = '12px ' + FONT_MAIN;
        ctx.fillText(`ברמה ${sel.evolveLevel}`, detailX + 34, ey + 28);

        ctx.fillStyle = '#ffd232';
        ctx.font = '12px ' + FONT_MAIN;
        ctx.fillText('→', detailX + 100, ey + 28);

        if (evoDiscovered) {
            const evoTypeCol = TYPE_COLORS[evoSpecies.type] || WHITE;
            ctx.fillStyle = WHITE;
            ctx.font = '13px ' + FONT_MAIN;
            ctx.fillText(evoSpecies.name, detailX + 120, ey + 28);

            const evoTypeName = TYPE_NAMES_HE[evoSpecies.type] || evoSpecies.type;
            const evoBadge = ` ${evoTypeName} `;
            ctx.font = '10px ' + FONT_MAIN;
            const evoBadgeW = ctx.measureText(evoBadge).width + 2;
            ctx.fillStyle = evoTypeCol;
            ctx.beginPath();
            ctx.roundRect(detailX + 210, ey + 16, evoBadgeW, 13, 3);
            ctx.fill();
            ctx.fillStyle = BLACK;
            ctx.fillText(evoBadge, detailX + 211, ey + 26);
        } else {
            ctx.fillStyle = 'rgb(80,80,110)';
            ctx.font = '13px ' + FONT_MAIN;
            ctx.fillText('???', detailX + 120, ey + 28);
        }
    }

    // Page indicator at bottom
    ctx.fillStyle = GRAY;
    ctx.font = '12px ' + FONT_MAIN;
    const pageText = `${cursor + 1} / ${total}`;
    const pageW = ctx.measureText(pageText).width;
    ctx.fillText(pageText, SCREEN_WIDTH / 2 - pageW / 2, SCREEN_HEIGHT - 10);
}

// ===================================================================
// Collection screen
// ===================================================================

function drawCollectionScreen(ctx, player, storage, cursor, frameCount) {
    frameCount = frameCount || 0;
    const allMonsters = [...player.party, ...storage.monsters];

    // Background
    const colBg = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    colBg.addColorStop(0, 'rgb(10,12,30)');
    colBg.addColorStop(1, 'rgb(5,6,16)');
    ctx.fillStyle = colBg;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Title
    const titleFloat = Math.sin(frameCount * 0.025) * 3;
    ctx.fillStyle = YELLOW;
    ctx.font = 'bold 24px ' + FONT_MAIN;
    const title = '-- האוסף שלי --';
    const titleW = ctx.measureText(title).width;
    ctx.fillText(title, SCREEN_WIDTH / 2 - titleW / 2, 34 + titleFloat);

    // Counter
    ctx.fillStyle = 'rgba(180,190,220,0.7)';
    ctx.font = '12px ' + FONT_MAIN;
    const countText = `בקבוצה: ${player.party.length}/${MAX_PARTY_SIZE}   באחסון: ${storage.monsters.length}   סה"כ: ${allMonsters.length}`;
    const countW = ctx.measureText(countText).width;
    ctx.fillText(countText, SCREEN_WIDTH / 2 - countW / 2, 52);

    // Hint
    ctx.fillStyle = 'rgba(140,150,190,0.5)';
    ctx.font = '11px ' + FONT_MAIN;
    const hint = '[ESC] סגירה   [למעלה/למטה] ניווט';
    const hintW = ctx.measureText(hint).width;
    ctx.fillText(hint, SCREEN_WIDTH / 2 - hintW / 2, 66);

    if (allMonsters.length === 0) {
        ctx.fillStyle = WHITE;
        ctx.font = '16px ' + FONT_MAIN;
        const empty = '.עדיין לא תפסת מפלצות';
        const emptyW = ctx.measureText(empty).width;
        ctx.fillText(empty, SCREEN_WIDTH / 2 - emptyW / 2, SCREEN_HEIGHT / 2);
        return;
    }

    // Layout: list on right, detail on left
    const listX = SCREEN_WIDTH - 300;
    const listY = 78;
    const listW = 280;
    const listItemH = 54;
    const maxVisible = Math.min(allMonsters.length, Math.floor((SCREEN_HEIGHT - listY - 20) / listItemH));

    let scrollOffset = 0;
    if (cursor >= maxVisible) {
        scrollOffset = cursor - maxVisible + 1;
    }

    // List panel
    drawPanel(ctx, listX - 8, listY - 8, listW + 16, maxVisible * listItemH + 16, 'rgba(10,15,40,0.85)', 'rgb(80,90,140)');

    for (let i = 0; i < maxVisible; i++) {
        const idx = i + scrollOffset;
        if (idx >= allMonsters.length) break;
        const mon = allMonsters[idx];
        const selected = idx === cursor;
        const isInParty = idx < player.party.length;
        const oy = listY + i * listItemH;

        if (selected) {
            ctx.fillStyle = 'rgba(255,210,50,0.12)';
            ctx.beginPath();
            ctx.roundRect(listX - 4, oy - 2, listW + 8, listItemH - 4, 6);
            ctx.fill();
            ctx.strokeStyle = YELLOW;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(listX - 4, oy - 2, listW + 8, listItemH - 4, 6);
            ctx.stroke();
        }

        // Mini sprite
        const mini = getMonsterMiniSprite(mon.speciesId);
        const miniScale = 0.65;
        const miniW = mini.width * miniScale;
        const miniH = mini.height * miniScale;
        if (mon.isFainted) ctx.globalAlpha = 0.4;
        ctx.drawImage(mini, listX, oy + (listItemH - 4 - miniH) / 2, miniW, miniH);
        ctx.globalAlpha = 1.0;

        // Name
        ctx.fillStyle = selected ? YELLOW : WHITE;
        ctx.font = selected ? 'bold 13px ' + FONT_MAIN : '13px ' + FONT_MAIN;
        ctx.fillText(mon.name, listX + miniW + 8, oy + 18);

        // Level + HP
        ctx.fillStyle = LIGHT_GRAY;
        ctx.font = '11px ' + FONT_MAIN;
        ctx.fillText(`רמה ${mon.level}  HP:${mon.hp}/${mon.maxHp}`, listX + miniW + 8, oy + 34);

        // Location tag
        const locText = isInParty ? 'קבוצה' : 'אחסון';
        const locColor = isInParty ? 'rgb(80,200,80)' : 'rgb(180,150,100)';
        ctx.fillStyle = locColor;
        ctx.font = '10px ' + FONT_MAIN;
        ctx.fillText(locText, listX + listW - 40, oy + 14);

        // Type badge
        const typeCol = TYPE_COLORS[mon.monType] || WHITE;
        const typeName = TYPE_NAMES_HE[mon.monType] || mon.monType;
        const badge = ` ${typeName} `;
        ctx.font = '10px ' + FONT_MAIN;
        const badgeW = ctx.measureText(badge).width + 2;
        ctx.fillStyle = typeCol;
        ctx.beginPath();
        ctx.roundRect(listX + listW - badgeW - 8, oy + 24, badgeW, 13, 3);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.fillText(badge, listX + listW - badgeW - 7, oy + 34);
    }

    // Scroll indicator
    if (allMonsters.length > maxVisible) {
        const scrollBarH = maxVisible * listItemH;
        const thumbH = Math.max(20, (maxVisible / allMonsters.length) * scrollBarH);
        const thumbY = listY + (scrollOffset / (allMonsters.length - maxVisible)) * (scrollBarH - thumbH);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(listX + listW + 12, listY, 4, scrollBarH);
        ctx.fillStyle = 'rgba(255,210,50,0.5)';
        ctx.beginPath();
        ctx.roundRect(listX + listW + 11, thumbY, 6, thumbH, 3);
        ctx.fill();
    }

    // Detail panel (left)
    const selMon = allMonsters[cursor];
    const detailX = 20;
    const detailY = 78;
    const detailW = SCREEN_WIDTH - 350;
    const detailH = SCREEN_HEIGHT - detailY - 16;

    drawPanel(ctx, detailX, detailY, detailW, detailH, 'rgba(12,16,42,0.92)', 'rgb(100,110,160)');

    // Sprite
    const sprite = getMonsterBattleSprite(selMon.speciesId);
    const spriteScale = 1.4;
    const sw = sprite.width * spriteScale;
    const sh = sprite.height * spriteScale;
    const sx = detailX + detailW / 2 - sw / 2;
    const bob = Math.sin(frameCount * 0.05) * 3;
    const sy = detailY + 16 + bob;

    // Glow
    const typeGlow = TYPE_COLORS[selMon.monType] || '#ffffff';
    const r = parseInt(typeGlow.slice(1, 3), 16);
    const g = parseInt(typeGlow.slice(3, 5), 16);
    const b = parseInt(typeGlow.slice(5, 7), 16);
    const glowPulse = 0.12 + Math.sin(frameCount * 0.04) * 0.05;
    ctx.fillStyle = `rgba(${r},${g},${b},${glowPulse})`;
    ctx.beginPath();
    ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2 + 10, sh / 2 + 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (selMon.isFainted) ctx.globalAlpha = 0.5;
    ctx.drawImage(sprite, sx, sy, sw, sh);
    ctx.globalAlpha = 1.0;

    // Name
    const nameY = sy + sh + 16;
    ctx.fillStyle = WHITE;
    ctx.font = '20px ' + FONT_MAIN;
    const fullName = selMon.name;
    const nameW = ctx.measureText(fullName).width;
    ctx.fillText(fullName, detailX + detailW / 2 - nameW / 2, nameY);

    // Level
    ctx.fillStyle = LIGHT_GRAY;
    ctx.font = '14px ' + FONT_MAIN;
    const lvlText = `רמה ${selMon.level}`;
    const lvlW = ctx.measureText(lvlText).width;
    ctx.fillText(lvlText, detailX + detailW / 2 - lvlW / 2, nameY + 20);

    // Type badge
    const selTypeName = TYPE_NAMES_HE[selMon.monType] || selMon.monType;
    const selTypeColor = TYPE_COLORS[selMon.monType] || WHITE;
    ctx.font = '13px ' + FONT_MAIN;
    const selBadge = ` ${selTypeName} `;
    const selBadgeW = ctx.measureText(selBadge).width + 4;
    const selBadgeX = detailX + detailW / 2 - selBadgeW / 2;
    ctx.fillStyle = selTypeColor;
    ctx.beginPath();
    ctx.roundRect(selBadgeX, nameY + 28, selBadgeW, 18, 4);
    ctx.fill();
    ctx.fillStyle = BLACK;
    ctx.fillText(selBadge, selBadgeX + 2, nameY + 42);

    // Location
    const isInParty = cursor < player.party.length;
    ctx.fillStyle = isInParty ? 'rgb(80,200,80)' : 'rgb(180,150,100)';
    ctx.font = '12px ' + FONT_MAIN;
    const locLabel = isInParty ? 'מיקום: בקבוצה' : 'מיקום: באחסון';
    const locLW = ctx.measureText(locLabel).width;
    ctx.fillText(locLabel, detailX + detailW / 2 - locLW / 2, nameY + 62);

    // Fainted status
    if (selMon.isFainted) {
        ctx.fillStyle = 'rgb(220,60,60)';
        ctx.font = '14px ' + FONT_MAIN;
        const faintText = '!מעולף';
        const faintW = ctx.measureText(faintText).width;
        ctx.fillText(faintText, detailX + detailW / 2 - faintW / 2, nameY + 80);
    }

    // Divider
    const divY = nameY + (selMon.isFainted ? 92 : 72);
    ctx.strokeStyle = 'rgb(60,65,100)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(detailX + 20, divY);
    ctx.lineTo(detailX + detailW - 20, divY);
    ctx.stroke();

    // HP bar
    const barSectionY = divY + 12;
    ctx.fillStyle = 'rgb(150,160,210)';
    ctx.font = '13px ' + FONT_MAIN;
    ctx.fillText('נתונים', detailX + 30, barSectionY);

    drawHealthBar(ctx, detailX + 30, barSectionY + 8, detailW - 60, selMon.hp, selMon.maxHp, 'HP: ', 14);

    // XP bar
    drawXpBar(ctx, detailX + 30, barSectionY + 28, detailW - 100, selMon.experience, selMon.xpToNext);
    ctx.fillStyle = 'rgb(100,130,200)';
    ctx.font = '11px ' + FONT_MAIN;
    ctx.fillText(`נס: ${selMon.experience}/${selMon.xpToNext}`, detailX + detailW - 65, barSectionY + 36);

    // Stats
    const statsY = barSectionY + 50;
    const statItems = [
        { label: 'התקפה', value: selMon.attack, color: '#f05028' },
        { label: 'הגנה', value: selMon.defense, color: '#3c8cf0' },
        { label: 'מהירות', value: selMon.speed, color: '#fadc32' },
    ];
    let stY = statsY;
    ctx.font = '12px ' + FONT_MAIN;
    for (const st of statItems) {
        ctx.fillStyle = st.color;
        ctx.fillText(`${st.label}: ${st.value}`, detailX + 30, stY);
        stY += 20;
    }

    // Moves
    const movesY = stY + 10;
    ctx.strokeStyle = 'rgb(60,65,100)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(detailX + 20, movesY - 6);
    ctx.lineTo(detailX + detailW - 20, movesY - 6);
    ctx.stroke();

    ctx.fillStyle = 'rgb(150,160,210)';
    ctx.font = '13px ' + FONT_MAIN;
    ctx.fillText('מהלכים', detailX + 30, movesY + 6);

    let my = movesY + 18;
    for (const move of selMon.moves) {
        const mTypeCol = TYPE_COLORS[move.moveType] || WHITE;
        const mTypeName = TYPE_NAMES_HE[move.moveType] || move.moveType;

        ctx.fillStyle = WHITE;
        ctx.font = '12px ' + FONT_MAIN;
        ctx.fillText(move.name, detailX + 34, my + 12);

        // Type badge
        const mBadge = ` ${mTypeName} `;
        ctx.font = '10px ' + FONT_MAIN;
        const mBadgeW = ctx.measureText(mBadge).width + 2;
        ctx.fillStyle = mTypeCol;
        ctx.beginPath();
        ctx.roundRect(detailX + 160, my, mBadgeW, 13, 3);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.fillText(mBadge, detailX + 161, my + 10);

        ctx.fillStyle = LIGHT_GRAY;
        ctx.font = '10px ' + FONT_MAIN;
        ctx.fillText(`עוצמה:${move.power}  PP:${move.currentPP}/${move.pp}`, detailX + 160 + mBadgeW + 8, my + 12);

        my += 22;
    }
}

// ===================================================================
// Starter selection screen
// ===================================================================

function drawStarterSelection(ctx, cursor, frameCount) {
    frameCount = frameCount || 0;

    // Background with radial gradient
    const bgGrad = ctx.createRadialGradient(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 50, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH);
    bgGrad.addColorStop(0, 'rgb(14,12,38)');
    bgGrad.addColorStop(0.6, 'rgb(8,8,22)');
    bgGrad.addColorStop(1, 'rgb(4,4,12)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Animated particles
    for (let i = 0; i < 50; i++) {
        const px = (i * 131 + frameCount * 0.15) % SCREEN_WIDTH;
        const py = (i * 89 + Math.sin(frameCount * 0.008 + i) * 25) % SCREEN_HEIGHT;
        const alpha = 0.03 + Math.sin(frameCount * 0.025 + i) * 0.02;
        ctx.fillStyle = `rgba(160,180,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + (i % 3) * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Title
    const titleFloat = Math.sin(frameCount * 0.025) * 4;
    ctx.fillStyle = YELLOW;
    ctx.font = `bold 28px ${FONT_MAIN}`;
    const title = '!בחר את המפלצת ההתחלתית שלך';
    const titleW = ctx.measureText(title).width;
    ctx.fillText(title, SCREEN_WIDTH / 2 - titleW / 2, 60 + titleFloat);

    ctx.fillStyle = 'rgba(150,160,200,0.6)';
    ctx.font = `14px ${FONT_MAIN}`;
    const hint = '[שמאל/ימין] ניווט   [Enter] בחירה';
    const hintW = ctx.measureText(hint).width;
    ctx.fillText(hint, SCREEN_WIDTH / 2 - hintW / 2, 88);

    const starters = [1, 2, 3];
    const cardW = 240;
    const cardH = 400;
    const gap = 40;
    const totalW = 3 * cardW + 2 * gap;
    const startX = (SCREEN_WIDTH - totalW) / 2;
    const cardY = 115;

    for (let i = 0; i < 3; i++) {
        const sid = starters[i];
        const species = SPECIES_DB[sid];
        const selected = i === cursor;
        const cx = startX + i * (cardW + gap);

        // Card float animation when selected
        const cardFloat = selected ? Math.sin(frameCount * 0.05) * 5 : 0;
        const cy = cardY + (selected ? -10 : 0) + cardFloat;

        // Card background
        const typeColor = TYPE_COLORS[species.type] || '#ffffff';
        const borderCol = selected ? YELLOW : 'rgba(70,75,120,0.6)';
        const bgAlpha = selected ? 0.95 : 0.8;
        drawPanel(ctx, cx, cy, cardW, cardH, `rgba(12,16,42,${bgAlpha})`, borderCol, selected ? 2.5 : 1, 12);

        // Glow effect when selected
        if (selected) {
            const r = parseInt(typeColor.slice(1, 3), 16);
            const g = parseInt(typeColor.slice(3, 5), 16);
            const b = parseInt(typeColor.slice(5, 7), 16);
            const glowPulse = 0.06 + Math.sin(frameCount * 0.05) * 0.03;
            ctx.fillStyle = `rgba(${r},${g},${b},${glowPulse})`;
            ctx.beginPath();
            ctx.roundRect(cx - 6, cy - 6, cardW + 12, cardH + 12, 16);
            ctx.fill();
        }

        // Sprite — use live canvas drawing for all 3 starters
        const bob     = selected ? Math.sin(frameCount * 0.06) * 4 : 0;
        const sprScale = selected ? 1.0 : 0.88;
        // Centre of sprite inside card: 30px top-padding + 55 (half of ~110px sprite height)
        const spriteCX = cx + cardW / 2;
        const spriteCY = cy + 30 + 58 + bob;
        _drawStarterCanvasSprite(ctx, sid, spriteCX, spriteCY, frameCount, false, sprScale);

        // Name — fixed position below sprite area (sprite spans ~110px * scale, centred at spriteCY)
        const nameY = cy + 30 + 118 + 14;
        ctx.fillStyle = selected ? YELLOW : WHITE;
        ctx.font = selected ? `bold 20px ${FONT_MAIN}` : `18px ${FONT_MAIN}`;
        const nameW = ctx.measureText(species.name).width;
        ctx.fillText(species.name, cx + cardW / 2 - nameW / 2, nameY);

        // Type badge
        const typeName = TYPE_NAMES_HE[species.type] || species.type;
        const badge = ` ${typeName} `;
        ctx.font = `12px ${FONT_MAIN}`;
        const badgeW = ctx.measureText(badge).width + 6;
        const badgeX = cx + cardW / 2 - badgeW / 2;
        ctx.fillStyle = typeColor;
        ctx.beginPath();
        ctx.roundRect(badgeX, nameY + 8, badgeW, 19, 5);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.font = `bold 12px ${FONT_MAIN}`;
        ctx.fillText(badge, badgeX + 3, nameY + 23);

        // Stats bars
        const statsY = nameY + 38;
        const barX = cx + 80;
        const barW = cardW - 100;
        const stats = [
            { label: 'חיים', value: species.baseHp, max: 80, color: '#50c850' },
            { label: 'התקפה', value: species.baseAttack, max: 80, color: '#f05028' },
            { label: 'הגנה', value: species.baseDefense, max: 80, color: '#3c8cf0' },
            { label: 'מהירות', value: species.baseSpeed, max: 80, color: '#fadc32' },
        ];

        let statY = statsY;
        for (const stat of stats) {
            ctx.fillStyle = 'rgba(180,190,220,0.7)';
            ctx.font = `11px ${FONT_MAIN}`;
            const labelW = ctx.measureText(stat.label).width;
            ctx.fillText(stat.label, barX - labelW - 6, statY + 10);

            // Bar bg
            ctx.fillStyle = 'rgb(20,22,42)';
            ctx.beginPath();
            ctx.roundRect(barX, statY, barW, 12, 3);
            ctx.fill();

            // Bar fill
            const ratio = Math.min(1, stat.value / stat.max);
            const fillW = Math.floor(barW * ratio);
            if (fillW > 0) {
                ctx.fillStyle = stat.color;
                ctx.beginPath();
                ctx.roundRect(barX, statY, fillW, 12, 3);
                ctx.fill();
            }

            // Border
            ctx.strokeStyle = 'rgba(60,65,100,0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(barX, statY, barW, 12, 3);
            ctx.stroke();

            // Value
            ctx.fillStyle = WHITE;
            ctx.font = `10px ${FONT_MAIN}`;
            ctx.fillText(String(stat.value), barX + barW + 4, statY + 10);

            statY += 20;
        }

        // Selection arrow
        if (selected) {
            const arrowBounce = Math.sin(frameCount * 0.1) * 4;
            ctx.fillStyle = YELLOW;
            ctx.font = `24px ${FONT_MAIN}`;
            const arrowText = '▲';
            const arrowW = ctx.measureText(arrowText).width;
            ctx.fillText(arrowText, cx + cardW / 2 - arrowW / 2, cy + cardH + 25 + arrowBounce);
        }
    }

    // Bottom text
    ctx.fillStyle = 'rgba(120,130,170,0.5)';
    ctx.font = `12px ${FONT_MAIN}`;
    const bottomText = '...כל מפלצת מתחילה ברמה 9. בחר בחוכמה';
    const bottomW = ctx.measureText(bottomText).width;
    ctx.fillText(bottomText, SCREEN_WIDTH / 2 - bottomW / 2, SCREEN_HEIGHT - 20);
}

// ===================================================================
// Settings screen
// ===================================================================

function drawSettingsScreen(ctx, settings, cursor) {
    // Dim background with blur effect
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const pw = 460, ph = 430;
    const px = (SCREEN_WIDTH - pw) / 2;
    const py = (SCREEN_HEIGHT - ph) / 2;
    drawPanel(ctx, px, py, pw, ph, 'rgba(10,12,35,0.96)', 'rgba(160,170,220,0.5)', 2, 14);

    // Title
    ctx.fillStyle = YELLOW;
    ctx.font = `bold 24px ${FONT_MAIN}`;
    const title2 = 'הגדרות';
    const titleW2 = ctx.measureText(title2).width;
    ctx.fillText(title2, px + pw / 2 - titleW2 / 2, py + 34);
    ctx.strokeStyle = 'rgba(100,110,160,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 18, py + 48);
    ctx.lineTo(px + pw - 18, py + 48);
    ctx.stroke();

    const options = [
        { label: 'מהירות קרב', choices: ['איטי', 'רגיל', 'מהיר'], value: settings.battle_speed || 0 },
        { label: 'מהירות טקסט', choices: ['איטי', 'רגיל', 'מהיר'], value: settings.text_speed || 0 },
        { label: 'אפקטי קרב', choices: ['כבוי', 'פעיל'], value: settings.battle_effects || 0 },
        { label: 'צליל', choices: ['כבוי', 'פעיל'], value: settings.sound || 0 },
        { label: 'GOD MODE', choices: ['כבוי', 'פעיל'], value: settings.god_mode || 0 },
        { label: 'שמור משחק', action: true },
    ];

    let oy = py + 64;
    for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const selected = i === cursor;
        const color = selected ? YELLOW : WHITE;

        if (selected) {
            ctx.fillStyle = 'rgba(255,210,50,0.06)';
            ctx.beginPath();
            ctx.roundRect(px + 15, oy - 2, pw - 30, 36, 6);
            ctx.fill();
        }

        if (opt.action) {
            // Save button row
            ctx.fillStyle = color;
            ctx.font = `${selected ? 'bold ' : ''}15px ${FONT_MAIN}`;
            const saveLabel = opt.label;
            const saveLabelW = ctx.measureText(saveLabel).width;
            ctx.fillText(saveLabel, px + pw / 2 - saveLabelW / 2, oy + 22);
            if (selected) {
                ctx.fillStyle = 'rgba(140,210,255,0.6)';
                ctx.font = `12px ${FONT_MAIN}`;
                const hint = 'לחץ Enter לשמירה';
                const hintWs = ctx.measureText(hint).width;
                ctx.fillText(hint, px + pw / 2 - hintWs / 2, oy + 40);
            }
        } else {
            ctx.fillStyle = color;
            ctx.font = `${selected ? 'bold ' : ''}15px ${FONT_MAIN}`;
            ctx.fillText(opt.label, px + 30, oy + 22);

            const valText = opt.choices[opt.value] || opt.choices[0];
            ctx.fillStyle = 'rgba(140,210,255,0.85)';
            ctx.font = `bold 15px ${FONT_MAIN}`;
            const valW = ctx.measureText(valText).width;
            const vx = px + pw - 30 - valW;
            ctx.fillText(valText, vx, oy + 22);

            if (selected) {
                ctx.fillStyle = YELLOW;
                ctx.font = `bold 16px ${FONT_MAIN}`;
                ctx.fillText('◂', vx - 22, oy + 22);
                ctx.fillText('▸', vx + valW + 8, oy + 22);
            }
        }

        oy += 52;
    }

    // Close hint
    ctx.fillStyle = 'rgba(140,150,190,0.5)';
    ctx.font = `12px ${FONT_MAIN}`;
    const hintText = '[ESC] סגירה   [שמאל/ימין] שינוי   [למעלה/למטה] ניווט';
    const hintW2 = ctx.measureText(hintText).width;
    ctx.fillText(hintText, px + pw / 2 - hintW2 / 2, py + ph - 18);
}

// ===================================================================
// Transition effect
// ===================================================================

function drawBattleTransition(ctx, progress, frameCount) {
    frameCount = frameCount || 0;
    const cx = SCREEN_WIDTH / 2;
    const cy = SCREEN_HEIGHT / 2;
    const maxRadius = Math.sqrt(cx * cx + cy * cy);

    if (progress < 0.5) {
        // Spiral wipe in
        const t = progress / 0.5;
        const radius = maxRadius * (1 - t);
        const angle = t * Math.PI * 6;

        // Draw black over everything except a shrinking circle
        ctx.save();
        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.arc(cx + Math.cos(angle) * radius * 0.1, cy + Math.sin(angle) * radius * 0.1, radius, 0, Math.PI * 2, true);
        ctx.fill('evenodd');
        ctx.restore();

        // White flash border
        if (t > 0.3) {
            ctx.strokeStyle = `rgba(255,255,255,${(t - 0.3) * 1.4})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(angle) * radius * 0.1, cy + Math.sin(angle) * radius * 0.1, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else {
        // Fade from black
        const t = (progress - 0.5) / 0.5;
        const alpha = 1 - t;
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }
}

// ===================================================================
// Shop Screen
// ===================================================================

function drawShopScreen(ctx, player, shopItems, cursor, message, msgTimer) {
    // Background
    const shopBg = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    shopBg.addColorStop(0, 'rgb(12,24,14)');
    shopBg.addColorStop(1, 'rgb(6,14,8)');
    ctx.fillStyle = shopBg;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Title bar
    drawPanel(ctx, 20, 16, SCREEN_WIDTH - 40, 46, 'rgba(25,70,30,0.9)', 'rgba(80,180,80,0.5)', 2, 10);
    ctx.fillStyle = '#88ff88';
    ctx.font = `bold 22px ${FONT_MAIN}`;
    const title = 'חנות פריטים';
    const tw = ctx.measureText(title).width;
    ctx.fillText(title, SCREEN_WIDTH / 2 - tw / 2, 46);

    // Coins display
    ctx.fillStyle = '#ffd232';
    ctx.font = `bold 15px ${FONT_MAIN}`;
    ctx.fillText(`\u{1FA99} ${player.coins}`, 40, 46);

    // Item list
    const listX = 60;
    const listY = 82;
    const itemH = 58;
    const listW = SCREEN_WIDTH - 120;

    for (let i = 0; i < shopItems.length; i++) {
        const item = shopItems[i];
        const oy = listY + i * itemH;
        const selected = (i === cursor);
        const canAfford = player.coins >= item.price;

        // Row background
        const bg = selected ? 'rgba(50,130,55,0.4)' : 'rgba(16,35,18,0.6)';
        const border = selected ? 'rgba(100,220,100,0.6)' : 'rgba(50,80,50,0.4)';
        drawPanel(ctx, listX, oy, listW, itemH - 4, bg, border, selected ? 2 : 1, 8);

        // Cursor arrow
        if (selected) {
            ctx.fillStyle = '#88ff88';
            ctx.font = `15px ${FONT_MAIN}`;
            ctx.fillText('▸', listX + 10, oy + 30);
        }

        // Item name
        ctx.fillStyle = canAfford ? WHITE : 'rgb(120,120,120)';
        ctx.font = `bold 15px ${FONT_MAIN}`;
        ctx.fillText(item.name, listX + 32, oy + 23);

        // Description
        ctx.fillStyle = canAfford ? 'rgba(180,190,220,0.7)' : 'rgb(90,90,90)';
        ctx.font = `12px ${FONT_MAIN}`;
        ctx.fillText(item.desc, listX + 32, oy + 42);

        // Price
        ctx.fillStyle = canAfford ? '#ffd232' : 'rgb(150,80,80)';
        ctx.font = `bold 14px ${FONT_MAIN}`;
        const priceText = `\u{1FA99} ${item.price}`;
        const pw = ctx.measureText(priceText).width;
        ctx.fillText(priceText, listX + listW - pw - 16, oy + 28);

        // Owned count
        const owned = player.inventory.count(item.name);
        if (owned > 0) {
            ctx.fillStyle = 'rgba(150,200,150,0.7)';
            ctx.font = `11px ${FONT_MAIN}`;
            ctx.fillText(`(${owned} ברשותך)`, listX + listW - pw - 100, oy + 28);
        }
    }

    // Message
    if (message && msgTimer > 0) {
        const msgAlpha = Math.min(1, msgTimer / 15);
        drawPanel(ctx, SCREEN_WIDTH / 2 - 160, SCREEN_HEIGHT - 82, 320, 38, `rgba(20,60,20,${0.95 * msgAlpha})`, `rgba(100,220,100,${0.6 * msgAlpha})`, 2, 8);
        ctx.fillStyle = `rgba(136,255,136,${msgAlpha})`;
        ctx.font = `bold 14px ${FONT_MAIN}`;
        const mw = ctx.measureText(message).width;
        ctx.fillText(message, SCREEN_WIDTH / 2 - mw / 2, SCREEN_HEIGHT - 57);
    }

    // Controls
    ctx.fillStyle = 'rgba(100,150,110,0.5)';
    ctx.font = `12px ${FONT_MAIN}`;
    const hint = 'ESC: יציאה    Enter: קנייה    חצים: בחירה';
    const hw = ctx.measureText(hint).width;
    ctx.fillText(hint, SCREEN_WIDTH / 2 - hw / 2, SCREEN_HEIGHT - 16);
}
