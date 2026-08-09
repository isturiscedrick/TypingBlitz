let player;
let showHowToPlay = false;
let howToPlayScroll = 0;
let howToContentHeight = 0; // measured (not guessed) height of the wrapped text
let howToMaxScroll = 0;     // recomputed each frame the overlay is open
let howToLineHeight = 21;
let enemies = [];
let score = 0;
let gameOver = false;
let moveSpeed = 4;
let lastSpawn = 0;
let startTime = 0;
let survivalTime = 0;
let lastSpeedIncrease = 0;
let enemySpeedMultiplier = 1;
let playZone = { x: (600 - 300) / 2, y: (600 - 300) / 2, w: 300, h: 300 };
let particles = [];
let gameStarted = false;
let gridOffset = 0;
let lastSpecialSpawn = 0;
let specialSpawnInterval = 10000;
let lives = 3;

// UI feedback state
let hoverStart = false;
let hoverHowTo = false;
let hoverClose = false;

// Shared button geometry so drawing and click-detection can never drift apart
let uiLayout = {
  start: { x: 0, y: 0, w: 260, h: 64 },
  howTo: { x: 0, y: 0, w: 180, h: 44 },
  close: { x: 0, y: 0, w: 32, h: 32 },
  gameOverRestart: { x: 0, y: 0, w: 190, h: 54 },
  gameOverMenu: { x: 0, y: 0, w: 190, h: 54 }
};
let flashTimer = 0; // screen flash on hit
let comboFlash = 0; // score pop feedback
let scoreFlashScale = 1;
let shakeTimer = 0;
let shakeAmount = 0;

function setup() {
  let cnv = createCanvas(600, 600);
  cnv.style('display', 'block');
  cnv.parent(document.body);
  textFont('Michroma');
  player = { x: playZone.x + playZone.w / 2, y: playZone.y + playZone.h / 2, size: 40 };
  startTime = millis();
  lastSpeedIncrease = millis();
}

function draw() {
  push();
  if (shakeTimer > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeTimer--;
  }

  background(10);
  drawBackgroundGrid();

  if (!gameStarted) {
    drawStartScreen();
    if (showHowToPlay) {
      drawHowToPlayOverlay();
    }
    pop();
    return;
  }

  if (gameOver) {
    drawGameOver();
    pop();
    noLoop();
    return;
  }

  survivalTime = (millis() - startTime) / 1000;

  drawPlayZone();
  handlePlayerMovement();
  drawPlayer();
  handleEnemies();
  drawScore();
  drawTime();

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].alpha <= 0) particles.splice(i, 1);
  }

  // Red damage flash overlay
  if (flashTimer > 0) {
    noStroke();
    fill(255, 0, 60, flashTimer * 12);
    rect(0, 0, width, height);
    flashTimer--;
  }

  pop();
}

// --- HOW TO PLAY OVERLAY ---
function drawHowToPlayOverlay() {
  fill(0, 220);
  rect(0, 0, width, height);

  fill(10, 15, 25, 245);
  stroke(0, 220, 255, 160);
  strokeWeight(3);
  rectMode(CENTER);
  rect(width / 2, height / 2, 520, 500, 28);
  noStroke();
  rectMode(CORNER);

  // Header bar
  fill(0, 180, 255, 30);
  rect(width / 2 - 260, height / 2 - 250, 520, 46, 28, 28, 0, 0);
  fill(0, 255, 255);
  textAlign(LEFT, CENTER);
  textSize(20);
  textStyle(BOLD);
  text("HOW TO PLAY", width / 2 - 240, height / 2 - 227);
  textStyle(NORMAL);

  fill(230, 245, 255);
  textAlign(LEFT, TOP);
  textSize(15);
  let howToText =
    "1. Player Mechanics\n" +
    "The player is a circular avatar constrained inside the play zone (green glowing rectangle).\n\n" +
    "Movement: arrow keys (LEFT, RIGHT, UP, DOWN).\n" +
    "Player cannot leave the play zone due to constrain().\n" +
    "Collision: if an enemy touches the player, you lose a life.\n\n" +
    "2. Enemy Mechanics\n" +
    "Enemies spawn from outside the play zone and move toward the player. There are several types:\n" +
    "Standard: Moves normally toward the player. Destroyed with a single correct typed letter/number.\n" +
    "Fast: Slightly faster than standard. Single-hit typed to destroy.\n" +
    "Zigzag: Moves toward player in a wavy pattern. Single-hit typed to destroy.\n" +
    "Tank: Larger enemy. Requires two hits (two typed letters) to destroy.\n" +
    "Bomb: Explodes after 5s or when typed. Creates a chain explosion, affecting nearby enemies.\n" +
    "Bonus: Cosmetic or optional; may give extra visual satisfaction. Single-hit typed to destroy.\n" +
    "Freeze (special): Spawns every 10s. Type to trigger. Stops all other enemies for 1s.\n" +
    "Slow (special): Spawns every 10s. Type to trigger. Slows all other enemies for 2s.\n\n" +
    "Enemy Spawning: Spawn interval and number increase as score grows. Special enemies spawn every 10s.\n" +
    "Enemy Movement: All move toward player. Zigzag moves wavy. Others move straight. Bounce off edges. Speed increases every 10s.\n\n" +
    "3. Typing Mechanics\n" +
    "Type the letter/number on each enemy to destroy it.\n" +
    "Tank: two hits. Bomb: explodes. Freeze/Slow: triggers effect.\n\n" +
    "4. Player Effects / Power-ups\n" +
    "Freeze: stops all enemies for 1s. Slow: slows all for 2s. Require typing accuracy.\n\n" +
    "5. Scoring\n" +
    "Each enemy destroyed = +1 score. Final Score = (Score * 10) + Survival Time (s).\n\n" +
    "6. Visuals\n" +
    "Neon grid background. Player: glowing circles. Enemies: unique shapes/colors.\n" +
    "Particles: glowing explosions. UI: Score (top-left), Time (top-right), Game Over screen.\n\n" +
    "7. Enemy Difficulty Scaling\n" +
    "Spawn rate and speed increase as score grows. More enemies per interval.\n\n" +
    "8. Lives & Restart\n" +
    "You have 3 lives. Losing all lives ends the game. Click to restart. All stats reset.\n\n" +
    "9. Particle System\n" +
    "Destroyed enemies create glowing particles that fade and shrink.\n\n" +
    "10. Player Strategy\n" +
    "Survive by avoiding collisions. Type accurately. Prioritize Freeze/Slow. Use Bombs for groups.\n" +
    "Tanks need two hits. Balance typing and movement!\n\n" +
    "The game is a typing survival challenge with increasing difficulty, visual feedback, and strategic power-ups. Accuracy and timing are key!";

  let textX = width / 2 - 240;
  let textY = height / 2 - 195;
  let textW = 480;
  let textH = 375;
  let innerW = textW - 24; // matches the box width passed to text() below
  let topPad = 12, bottomPad = 12;

  // Measure the ACTUAL wrapped height of this text at the font/size we're
  // about to draw it with, instead of guessing a fixed number. This keeps
  // scrolling accurate even if the copy changes or the font's metrics shift.
  textSize(15);
  textFont('Michroma');
  textLeading(howToLineHeight);
  howToContentHeight = measureWrappedTextHeight(howToText, innerW, howToLineHeight);
  howToMaxScroll = max(0, howToContentHeight - textH + topPad + bottomPad);
  howToPlayScroll = constrain(howToPlayScroll, 0, howToMaxScroll);

  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(textX, textY, textW, textH);
  drawingContext.clip();
  textSize(15);
  textFont('Michroma');
  textLeading(howToLineHeight);
  text(howToText, textX + 12, textY + topPad - howToPlayScroll, innerW, howToContentHeight + howToLineHeight);
  drawingContext.restore();
  pop();

  // Fade masks at top/bottom of scroll area for polish
  noStroke();
  let fadeH = 18;
  let g1 = drawingContext.createLinearGradient(0, textY, 0, textY + fadeH);
  g1.addColorStop(0, 'rgba(10,15,25,1)');
  g1.addColorStop(1, 'rgba(10,15,25,0)');
  drawingContext.fillStyle = g1;
  drawingContext.fillRect(textX, textY, textW, fadeH);
  let g2 = drawingContext.createLinearGradient(0, textY + textH - fadeH, 0, textY + textH);
  g2.addColorStop(0, 'rgba(10,15,25,0)');
  g2.addColorStop(1, 'rgba(10,15,25,1)');
  drawingContext.fillStyle = g2;
  drawingContext.fillRect(textX, textY + textH - fadeH, textW, fadeH);

  // Scroll indicator track + thumb, sized to the real content ratio
  let trackX = width / 2 + 240 - 14;
  fill(255, 255, 255, 20);
  rect(trackX, textY, 6, textH, 3);
  let visibleRatio = constrain(textH / max(howToContentHeight, textH), 0, 1);
  let scrollBarH = max(30, textH * visibleRatio);
  let scrollBarY = howToMaxScroll > 0 ? textY + (howToPlayScroll / howToMaxScroll) * (textH - scrollBarH) : textY;
  fill(0, 220, 255, 220);
  rect(trackX, scrollBarY, 6, scrollBarH, 3);

  // Close button with hover feedback
  let btnX = width / 2 + 220 - 36;
  let btnY = height / 2 - 220 + 16;
  uiLayout.close = { x: btnX, y: btnY, w: 32, h: 32 }; // top-left anchored, not centered
  hoverClose = mouseX > btnX && mouseX < btnX + 32 && mouseY > btnY && mouseY < btnY + 32;
  fill(hoverClose ? 255 : 220, hoverClose ? 70 : 50, hoverClose ? 90 : 70);
  stroke(180, 0, 40);
  strokeWeight(2);
  rect(btnX, btnY, 32, 32, 8);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(22);
  text("X", btnX + 16, btnY + 16);

  // Scroll hint (only worth showing if there's actually more to see)
  if (howToMaxScroll > 0) {
    fill(150, 220, 255, 180);
    textSize(12);
    textAlign(CENTER, CENTER);
    text("Scroll or use ↑ / ↓", width / 2, height / 2 + 232);
  }
}

// Replicates p5's greedy word-wrap to measure exactly how tall a block of
// text will render at the given width/line-height, so scroll bounds match
// what's actually on screen instead of a hardcoded guess.
function measureWrappedTextHeight(txt, maxW, lineHeight) {
  let paragraphs = txt.split('\n');
  let totalLines = 0;
  for (let para of paragraphs) {
    if (para === '') {
      totalLines += 1;
      continue;
    }
    let words = para.split(' ');
    let current = '';
    let linesInPara = 0;
    for (let w of words) {
      let candidate = current === '' ? w : current + ' ' + w;
      if (textWidth(candidate) > maxW && current !== '') {
        linesInPara++;
        current = w;
      } else {
        current = candidate;
      }
    }
    if (current !== '') linesInPara++;
    totalLines += max(linesInPara, 1);
  }
  return totalLines * lineHeight;
}

// --- SCROLLING FOR HOW TO PLAY ---
function mouseWheel(event) {
  if (showHowToPlay && !gameStarted) {
    howToPlayScroll = constrain(howToPlayScroll + event.delta, 0, howToMaxScroll);
    return false;
  }
}

function drawBackgroundGrid() {
  gridOffset += 0.5;
  stroke(0, 150, 255, 50);
  strokeWeight(1);
  for (let x = 0; x < width; x += 40) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += 40) {
    line(0, y + (gridOffset % 40), width, y + (gridOffset % 40));
  }
}

function drawPlayZone() {
  let glow = 180 + 75 * sin(frameCount * 0.1);
  rectMode(CENTER);
  noFill();
  stroke(57, 255, 20, glow);
  strokeWeight(8);
  rect(playZone.x + playZone.w / 2, playZone.y + playZone.h / 2, playZone.w, playZone.h, 28);
  noStroke();
  rectMode(CORNER);
}

// --- Player ---
function drawPlayer() {
  let outerGlow = player.size + 30 * sin(frameCount * 0.15);
  let innerGlow = player.size + 15 * sin(frameCount * 0.25);

  noFill();
  stroke(0, 200, 255, 50);
  strokeWeight(8);
  circle(player.x, player.y, outerGlow);

  stroke(0, 255, 255, 100);
  strokeWeight(4);
  circle(player.x, player.y, innerGlow);

  fill(0, 200, 255);
  noStroke();
  circle(player.x, player.y, player.size);
}

function handlePlayerMovement() {
  if (keyIsDown(LEFT_ARROW)) player.x -= moveSpeed;
  if (keyIsDown(RIGHT_ARROW)) player.x += moveSpeed;
  if (keyIsDown(UP_ARROW)) player.y -= moveSpeed;
  if (keyIsDown(DOWN_ARROW)) player.y += moveSpeed;

  player.x = constrain(player.x, playZone.x + player.size / 2, playZone.x + playZone.w - player.size / 2);
  player.y = constrain(player.y, playZone.y + player.size / 2, playZone.y + playZone.h - player.size / 2);
}

// --- Enemies ---
function handleEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];

    if (e.type === "zigzag") {
      e.x += e.vx;
      e.y += e.vy + sin(frameCount * 0.1) * 2;
    } else {
      e.x += e.vx;
      e.y += e.vy;
    }

    if (e.x - e.size / 2 < 0) { e.x = e.size / 2; e.vx *= -1; }
    if (e.x + e.size / 2 > width) { e.x = width - e.size / 2; e.vx *= -1; }
    if (e.y - e.size / 2 < 0) { e.y = e.size / 2; e.vy *= -1; }
    if (e.y + e.size / 2 > height) { e.y = height - e.size / 2; e.vy *= -1; }

    drawEnemy(e);

    if (e.type === "bomb" && millis() - e.spawnTime > 5000) {
      createExplosion(e, false);
      enemies.splice(i, 1);
      continue;
    }

    if (dist(e.x, e.y, player.x, player.y) < (e.size + player.size) / 2) {
      lives--;
      flashTimer = 12;
      shakeTimer = 10;
      shakeAmount = 6;
      enemies.splice(i, 1);
      if (lives <= 0) {
        gameOver = true;
      }
    }
  }

  let dynamicInterval = max(300, 1000 - score * 15);
  if (millis() - lastSpawn > dynamicInterval) {
    let enemiesToSpawn = 1 + floor(score / 20);
    for (let i = 0; i < enemiesToSpawn; i++) spawnEnemy();
    lastSpawn = millis();
  }

  if (millis() - lastSpeedIncrease > 10000) {
    moveSpeed += 0.3;
    enemySpeedMultiplier = min(enemySpeedMultiplier * 1.08, 4);
    for (let e of enemies) { e.vx *= 1.08; e.vy *= 1.08; }
    lastSpeedIncrease = millis();
  }

  if (millis() - lastSpecialSpawn > specialSpawnInterval) {
    spawnSpecialEnemy();
    lastSpecialSpawn = millis();
  }
}

function drawEnemy(e) {
  push();
  translate(e.x, e.y);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);

  let r = 180 + 40 * sin(frameCount * 0.1 + e.x * 0.01);
  let g = 60 + 20 * sin(frameCount * 0.13 + e.y * 0.01);
  let b = 255;

  switch (e.type) {
    case "standard":
      stroke(0); strokeWeight(4);
      fill(r, g, b); rect(0, 0, e.size, e.size, 5); noStroke(); break;
    case "fast":
      stroke(0); strokeWeight(4);
      fill(r, g, b); rect(0, 0, e.size * 1.2, e.size * 0.8, 3); noStroke(); break;
    case "zigzag":
      stroke(0); strokeWeight(4);
      fill(r, g, b, 180);
      beginShape();
      for (let j = -e.size / 2; j <= e.size / 2; j += 10) {
        vertex(j, sin(j * 0.5 + frameCount * 0.2) * 10);
      }
      endShape(CLOSE);
      noStroke();
      push();
      textAlign(CENTER, CENTER);
      let glowSize = 32 + 6 * sin(frameCount * 0.3);
      fill(0, 220);
      rectMode(CENTER);
      rect(0, 0, glowSize + 12, glowSize + 8, 8);
      textSize(glowSize);
      fill(255);
      textStyle(BOLD);
      text(e.label, 0, 0);
      pop();
      break;

    case "tank":
      stroke(0); strokeWeight(4);
      fill(r, g, b); rect(0, 0, e.size * 1.5, e.size, 5);
      fill(r + 30, g + 30, b); rect(0, -e.size * 0.35, e.size * 0.6, e.size * 0.4, 3);
      stroke(0, 255, 200, 150); strokeWeight(3); line(0, -e.size * 0.35, 0, -e.size * 0.6); noStroke();
      // Hit indicator pips for tank
      noStroke();
      for (let p = 0; p < 2; p++) {
        fill(p < e.hitCount ? color(0, 255, 150) : color(255, 255, 255, 60));
        circle(-8 + p * 16, e.size * 0.55, 6);
      }
      break;

    case "bomb":
      stroke(30); strokeWeight(4);
      fill(30, 30, 30);
      circle(0, 0, e.size);
      noStroke();
      fill(180, 180, 180, 80);
      ellipse(-e.size * 0.18, -e.size * 0.18, e.size * 0.35, e.size * 0.18);
      stroke(120, 80, 30); strokeWeight(3);
      let fuseLen = 12 + 2 * sin(frameCount * 0.3);
      line(0, -e.size / 2, 0, -e.size / 2 - fuseLen);
      let sparkX = 0, sparkY = -e.size / 2 - fuseLen;
      noStroke();
      let sparkCol = color(255, 220 + 30 * sin(frameCount * 0.7), 60 + 80 * sin(frameCount * 0.5));
      for (let a = 0; a < TWO_PI; a += PI / 4) {
        fill(sparkCol);
        ellipse(sparkX + cos(a) * 5, sparkY + sin(a) * 5, 4 + 2 * sin(frameCount * 0.8 + a));
      }
      // Countdown ring showing time until auto-explode
      let elapsed = millis() - e.spawnTime;
      let remainingFrac = 1 - constrain(elapsed / 5000, 0, 1);
      noFill();
      stroke(255, 80, 60, 200);
      strokeWeight(3);
      arc(0, 0, e.size + 16, e.size + 16, -HALF_PI, -HALF_PI + remainingFrac * TWO_PI);
      noStroke();
      break;

    case "bonus":
      stroke(0); strokeWeight(4);
      fill(r, g, b, 200); circle(0, 0, e.size + 10 * sin(frameCount * 0.2)); noStroke(); break;

    case "freeze":
      push();
      let cx = 0, cy = 0, n = 7;
      for (let gg = 3; gg > 0; gg--) {
        fill(120, 220, 255, 18 * gg);
        beginShape();
        for (let i = 0; i < n; i++) {
          let angle = i * TWO_PI / n;
          let rad = e.size * (0.6 + 0.18 * gg + 0.08 * sin(frameCount * 0.5 + i));
          vertex(cx + cos(angle) * rad, cy + sin(angle) * rad);
        }
        endShape(CLOSE);
      }
      fill(120, 220, 255);
      stroke(200, 240, 255, 180); strokeWeight(2);
      beginShape();
      for (let i = 0; i < n; i++) {
        let angle = i * TWO_PI / n;
        let rad = e.size * (0.5 + 0.18 * sin(frameCount * 0.7 + i * 1.2));
        vertex(cx + cos(angle) * rad, cy + sin(angle) * rad);
      }
      endShape(CLOSE);
      for (let i = 0; i < 8; i++) {
        let angle = i * PI / 4 + frameCount * 0.01;
        let rad = e.size * 0.7 + 6 * sin(frameCount * 0.5 + i);
        fill(255, 255, 255, 120 + 80 * sin(frameCount * 0.8 + i));
        ellipse(cx + cos(angle) * rad, cy + sin(angle) * rad, 4 + 2 * sin(frameCount * 0.8 + i));
      }
      stroke(255, 255, 255, 200); strokeWeight(2);
      for (let i = 0; i < 6; i++) {
        let angle = i * PI / 3;
        line(0, 0, cos(angle) * e.size * 0.5, sin(angle) * e.size * 0.5);
      }
      noStroke();
      pop();
      break;

    case "slow":
      stroke(0); strokeWeight(4);
      fill(200, 80, 255, 200);
      circle(0, 0, e.size);
      stroke(255); strokeWeight(2);
      line(0, -e.size / 2, 0, e.size / 2);
      line(-e.size / 2, 0, e.size / 2, 0);
      noStroke(); break;
  }

  if (e.type !== "zigzag") {
    let fontSize = 28 + 6 * sin(frameCount * 0.3);
    noStroke();
    fill(0, 220);
    rectMode(CENTER);
    rect(0, 0, fontSize + 12, fontSize + 8, 8);
    textSize(fontSize);
    fill(255);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(e.label, 0, 0);
    rectMode(CENTER);
  }

  pop();
}

function spawnEnemy() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let label = chars.charAt(floor(random(chars.length)));

  let types = ["standard", "fast", "zigzag", "tank", "bomb", "bonus"];
  let type = random(types);

  let baseSpeed = 1.5 + score * 0.03;
  let speed = random(baseSpeed, baseSpeed + 1.5);

  let x, y;
  let side = floor(random(4));
  if (side === 0) { x = random(width); y = playZone.y - 30; }
  else if (side === 1) { x = random(width); y = playZone.y + playZone.h + 30; }
  else if (side === 2) { x = playZone.x - 30; y = random(height); }
  else { x = playZone.x + playZone.w + 30; y = random(height); }

  let angle = atan2(player.y - y, player.x - x);
  let vx = cos(angle) * speed * enemySpeedMultiplier;
  let vy = sin(angle) * speed * enemySpeedMultiplier;

  let size = 30;
  if (type === "tank") size = 45;

  enemies.push({ x, y, vx, vy, label, size, type, hitCount: 0, spawnTime: millis() });
}

function spawnSpecialEnemy() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let label = chars.charAt(floor(random(chars.length)));

  let types = ["freeze", "slow"];
  let type = random(types);

  let speed = 1;
  let x, y;
  let side = floor(random(4));
  if (side === 0) { x = random(width); y = playZone.y - 30; }
  else if (side === 1) { x = random(width); y = playZone.y + playZone.h + 30; }
  else if (side === 2) { x = playZone.x - 30; y = random(height); }
  else { x = playZone.x + playZone.w + 30; y = random(height); }

  let angle = atan2(player.y - y, player.x - x);
  let vx = cos(angle) * speed;
  let vy = sin(angle) * speed;

  enemies.push({ x, y, vx, vy, label, size: 30, type, hitCount: 0, spawnTime: millis() });
}

// --- Typing ---
function keyPressed() {
  if (showHowToPlay && !gameStarted) {
    if (keyCode === DOWN_ARROW) {
      howToPlayScroll = constrain(howToPlayScroll + 40, 0, howToMaxScroll);
      return false;
    } else if (keyCode === UP_ARROW) {
      howToPlayScroll = constrain(howToPlayScroll - 40, 0, howToMaxScroll);
      return false;
    }
    return;
  }

  if (!gameStarted || gameOver) return;

  let typedKey = key.toUpperCase();
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].label === typedKey) {
      let e = enemies[i];
      if (e.type === "tank") {
        e.hitCount++;
        if (e.hitCount >= 2) {
          createExplosion(e, true);
          enemies.splice(i, 1);
          score++;
          comboFlash = 15;
        }
      } else {
        createExplosion(e, true);
        enemies.splice(i, 1);
        score++;
        comboFlash = 15;
      }
      break;
    }
  }
}

// --- Explosion ---
function createExplosion(e, playerTriggered = true) {
  let r = random(100, 255), g = random(100, 255), b = 255;

  for (let j = 0; j < 20; j++) particles.push(new ColorParticle(e.x, e.y, random(3, 6), random(TWO_PI), r, g, b, 5));
  for (let j = 0; j < 15; j++) particles.push(new ColorParticle(e.x, e.y, random(1.5, 3), random(TWO_PI), r, g, b, 8));
  for (let j = 0; j < 10; j++) particles.push(new ColorParticle(e.x, e.y, random(0.5, 1.5), random(TWO_PI), r, g, b, 12));

  if (e.type === "bomb") {
    let radius = 80;
    for (let i = enemies.length - 1; i >= 0; i--) {
      let other = enemies[i];
      if (other !== e && dist(e.x, e.y, other.x, other.y) <= radius) {
        createExplosion(other, playerTriggered);
        enemies.splice(i, 1);
        if (playerTriggered) score++;
      }
    }
  }

  if (e.type === "freeze") {
    let frozenEnemies = enemies.filter(other => other !== e);
    let originalSpeeds = frozenEnemies.map(o => ({ vx: o.vx, vy: o.vy }));
    for (let other of frozenEnemies) { other.vx = 0; other.vy = 0; }
    setTimeout(() => {
      for (let i = 0; i < frozenEnemies.length; i++) {
        frozenEnemies[i].vx = originalSpeeds[i].vx;
        frozenEnemies[i].vy = originalSpeeds[i].vy;
      }
    }, 1000);
  }

  if (e.type === "slow") {
    let slowedEnemies = enemies.filter(other => other !== e);
    let originalSpeeds = slowedEnemies.map(o => ({ vx: o.vx, vy: o.vy }));
    for (let other of slowedEnemies) { other.vx *= 0.4; other.vy *= 0.4; }
    setTimeout(() => {
      for (let i = 0; i < slowedEnemies.length; i++) {
        slowedEnemies[i].vx = originalSpeeds[i].vx;
        slowedEnemies[i].vy = originalSpeeds[i].vy;
      }
    }, 2000);
  }
}

// --- Particles ---
class ColorParticle {
  constructor(x, y, speed, angle, r, g, b, size) {
    this.x = x; this.y = y;
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    this.alpha = 255; this.size = size; this.r = r; this.g = g; this.b = b;
  }
  update() { this.x += this.vx; this.y += this.vy; this.alpha *= 0.85; this.size *= 0.92; }
  show() {
    noStroke();
    fill(this.r, this.g, this.b, this.alpha);
    circle(this.x, this.y, this.size);
    fill(this.r, this.g, this.b, this.alpha * 0.3);
    circle(this.x, this.y, this.size * 2);
  }
}

// --- UI ---
function drawScore() {
  if (comboFlash > 0) {
    scoreFlashScale = 1 + (comboFlash / 15) * 0.25;
    comboFlash--;
  } else {
    scoreFlashScale = 1;
  }

  push();
  translate(80, 30);
  scale(scoreFlashScale);
  translate(-80, -30);
  fill(0, 100, 0, 150);
  stroke(0, 255, 100, 200); strokeWeight(2);
  rect(10, 10, 140, 40, 10); noStroke();
  fill(255); textSize(18); textAlign(LEFT, CENTER);
  textStyle(BOLD);
  text("Score: " + score, 20, 30);
  textStyle(NORMAL);
  pop();

  let heartX = 24;
  let heartY = 62;
  for (let i = 0; i < 3; i++) {
    if (i < lives) {
      drawHeart(heartX + i * 32, heartY, 18, color(255, 60, 120), 1.0);
    } else {
      drawHeart(heartX + i * 32, heartY, 18, color(120, 40, 60), 0.3);
    }
  }
}

function drawHeart(x, y, size, col, alpha = 1.0) {
  push();
  translate(x, y);
  fill(red(col), green(col), blue(col), 255 * alpha);
  noStroke();
  beginShape();
  vertex(0, size * 0.3);
  bezierVertex(size * 0.5, -size * 0.4, size, size * 0.5, 0, size);
  bezierVertex(-size, size * 0.5, -size * 0.5, -size * 0.4, 0, size * 0.3);
  endShape(CLOSE);
  pop();
}

function drawTime() {
  fill(0, 0, 100, 150);
  stroke(0, 150, 255, 200); strokeWeight(2);
  rect(width - 150, 10, 140, 40, 10); noStroke();
  fill(255); textSize(18); textAlign(RIGHT, CENTER);
  text("Time: " + survivalTime.toFixed(1) + "s", width - 20, 30);
}

// --- Game Over ---
function drawGameOver() {
  // Dim backdrop over frozen game state
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  let finalScore = (score * 10) + Math.floor(survivalTime);

  fill(15, 5, 10, 235);
  stroke(255, 40, 70, 160);
  strokeWeight(3);
  rectMode(CENTER);
  rect(width / 2, height / 2, 420, 320, 24);
  noStroke();
  rectMode(CORNER);

  textAlign(CENTER, CENTER);
  fill(255, 60, 90);
  textSize(36);
  textStyle(BOLD);
  text("GAME OVER", width / 2, height / 2 - 100);
  textStyle(NORMAL);

  textSize(18);
  fill(220, 230, 255);
  text("Enemies Destroyed: " + score, width / 2, height / 2 - 40);
  text("Time Survived: " + survivalTime.toFixed(1) + "s", width / 2, height / 2 - 10);

  fill(0, 255, 200);
  textSize(26);
  textStyle(BOLD);
  text("Final Score: " + finalScore, width / 2, height / 2 + 35);
  textStyle(NORMAL);

  // Restart + Back to Menu buttons, side by side, hit boxes match exactly
  let btnW = 190, btnH = 54, gap = 20;
  let btnY = height / 2 + 105;
  let restartX = width / 2 - gap / 2 - btnW / 2;
  let menuX = width / 2 + gap / 2 + btnW / 2;

  uiLayout.gameOverRestart = { x: restartX, y: btnY, w: btnW, h: btnH };
  uiLayout.gameOverMenu = { x: menuX, y: btnY, w: btnW, h: btnH };

  let hoverRestart = mouseX > restartX - btnW / 2 && mouseX < restartX + btnW / 2 &&
                      mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;
  let hoverMenu = mouseX > menuX - btnW / 2 && mouseX < menuX + btnW / 2 &&
                  mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;

  rectMode(CENTER);

  // Restart button
  fill(hoverRestart ? color(0, 255, 200) : color(0, 40, 70, 230));
  stroke(0, 255, 200, 200);
  strokeWeight(3);
  rect(restartX, btnY, btnW, btnH, 14);
  noStroke();
  fill(hoverRestart ? 0 : 255);
  textSize(17);
  textStyle(BOLD);
  text("Restart", restartX, btnY);

  // Back to Menu button
  fill(hoverMenu ? color(0, 200, 255) : color(0, 30, 60, 230));
  stroke(0, 200, 255, 200);
  strokeWeight(3);
  rect(menuX, btnY, btnW, btnH, 14);
  noStroke();
  fill(hoverMenu ? 0 : 255);
  textSize(17);
  text("Back to Menu", menuX, btnY);

  textStyle(NORMAL);
  rectMode(CORNER);
}

// --- START & RESTART ---
function mousePressed() {
  if (!gameStarted) {
    if (showHowToPlay) {
      let c = uiLayout.close;
      if (mouseX > c.x && mouseX < c.x + c.w && mouseY > c.y && mouseY < c.y + c.h) {
        showHowToPlay = false;
        howToPlayScroll = 0;
        return;
      }
      return;
    }

    let s = uiLayout.start;
    let h = uiLayout.howTo;

    if (
      mouseX > h.x - h.w / 2 && mouseX < h.x + h.w / 2 &&
      mouseY > h.y - h.h / 2 && mouseY < h.y + h.h / 2
    ) {
      showHowToPlay = true;
      return;
    }
    if (
      mouseX > s.x - s.w / 2 && mouseX < s.x + s.w / 2 &&
      mouseY > s.y - s.h / 2 && mouseY < s.y + s.h / 2
    ) {
      gameStarted = true;
      startTime = millis();
      lastSpawn = millis();
      lastSpeedIncrease = millis();
      lastSpecialSpawn = millis();
      lives = 3;
      return;
    }
    return;
  }

  if (gameOver) {
    let r = uiLayout.gameOverRestart;
    let m = uiLayout.gameOverMenu;
    let clickedRestart = mouseX > r.x - r.w / 2 && mouseX < r.x + r.w / 2 &&
                          mouseY > r.y - r.h / 2 && mouseY < r.y + r.h / 2;
    let clickedMenu = mouseX > m.x - m.w / 2 && mouseX < m.x + m.w / 2 &&
                       mouseY > m.y - m.h / 2 && mouseY < m.y + m.h / 2;

    if (clickedRestart) {
      resetGameState();
      gameStarted = true;
      loop();
    } else if (clickedMenu) {
      resetGameState();
      gameStarted = false;
      loop();
    }
  }
}

// Shared reset used by both Restart and Back to Menu
function resetGameState() {
  enemies = []; score = 0; moveSpeed = 4; enemySpeedMultiplier = 1;
  gameOver = false; startTime = millis(); lastSpeedIncrease = millis();
  lastSpawn = millis(); lastSpecialSpawn = millis();
  player.x = playZone.x + playZone.w / 2; player.y = playZone.y + playZone.h / 2;
  lives = 3;
  particles = [];
}

// --- START SCREEN FUNCTION ---
function drawStartScreen() {
  textAlign(CENTER, CENTER);

  let logoPulse = 32 + 16 * sin(frameCount * 0.08);
  textSize(60);
  fill(0, 255, 255, 220);
  stroke(0, 255, 255, 180);
  strokeWeight(logoPulse * 0.08);
  textFont('Michroma');
  text("Typing Blitz", width / 2, height / 2 - 100);
  noStroke();

  textSize(16);
  fill(180, 235, 255, 200);
  text("SURVIVE. TYPE. SCORE.", width / 2, height / 2 - 55);

  textSize(16);
  fill(200, 255, 255, 180);
  text("Move: Arrow Keys", width / 2, height / 2 - 10);
  text("Type Letters/Numbers to Destroy Enemies", width / 2, height / 2 + 18);

  let btnW = 260, btnH = 64;
  let btnY = height / 2 + 70;
  uiLayout.start = { x: width / 2, y: btnY, w: btnW, h: btnH };
  hoverStart = mouseX > width / 2 - btnW / 2 && mouseX < width / 2 + btnW / 2 &&
               mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;
  let btnPulse = 12 + 8 * sin(frameCount * 0.15);
  rectMode(CENTER);
  fill(hoverStart ? color(0, 40, 90, 240) : color(0, 20, 60, 230));
  stroke(0, 255, 255, 180 + 60 * sin(frameCount * 0.2));
  strokeWeight(4 + btnPulse * 0.08 + (hoverStart ? 2 : 0));
  rect(width / 2, btnY, hoverStart ? btnW + 6 : btnW, hoverStart ? btnH + 4 : btnH, 18);
  noStroke();
  fill(0, 255, 255);
  textSize(26);
  textStyle(BOLD);
  text("START GAME", width / 2, btnY);
  textStyle(NORMAL);

  let howToW = 180, howToH = 44;
  let howToY = btnY + 70;
  uiLayout.howTo = { x: width / 2, y: howToY, w: howToW, h: howToH };
  hoverHowTo = mouseX > width / 2 - howToW / 2 && mouseX < width / 2 + howToW / 2 &&
               mouseY > howToY - howToH / 2 && mouseY < howToY + howToH / 2;
  fill(hoverHowTo ? color(0, 60, 110, 230) : color(0, 40, 80, 210));
  stroke(0, 255, 255, hoverHowTo ? 200 : 120);
  strokeWeight(2);
  rect(width / 2, howToY, hoverHowTo ? howToW + 6 : howToW, hoverHowTo ? howToH + 4 : howToH, 12);
  noStroke();
  fill(255);
  textSize(18);
  text("How to Play", width / 2, howToY);

  rectMode(CORNER);
}

function mouseMoved() {
  if (!gameStarted && (hoverStart || hoverHowTo || hoverClose)) {
    cursor(HAND);
  } else if (gameOver) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}