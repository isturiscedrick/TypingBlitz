let player;
let showHowToPlay = false;
let howToPlayScroll = 0;
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

function setup() {
  let cnv = createCanvas(600, 600);
  cnv.style('display', 'block'); 
  textFont('Michroma');
  player = { x: playZone.x + playZone.w / 2, y: playZone.y + playZone.h / 2, size: 40 };
  startTime = millis();
  lastSpeedIncrease = millis();
}

function draw() {
  background(10);
  drawBackgroundGrid();


  if (!gameStarted) {
    drawStartScreen();
    if (showHowToPlay) {
      drawHowToPlayOverlay();
    }
    return;
  }
// --- HOW TO PLAY OVERLAY ---
function drawHowToPlayOverlay() {
  // Overlay background
  fill(0, 220);
  rect(0, 0, width, height);

  // White rounded panel
  fill(255, 245);
  stroke(0, 180, 255, 80);
  strokeWeight(3);
  rectMode(CENTER);
  rect(width/2, height/2, 520, 500, 28);
  noStroke();
  rectMode(CORNER);

  // Scrollable text area (simulate with text wrap)
  fill(0);
  textAlign(LEFT, TOP);
  textSize(15);
  let howToText =
    "1. Player Mechanics\n" +
    "The player is a circular avatar constrained inside the play zone (green glowing rectangle).\n\n" +
    "Movement: arrow keys (LEFT, RIGHT, UP, DOWN).\n" +
    "Player cannot leave the play zone due to constrain().\n" +
    "Collision: if an enemy touches the player, the game ends.\n\n" +
    "2. Enemy Mechanics\n" +
    "Enemies spawn from outside the play zone and move toward the player. There are several types:\n" +
    "Standard: Moves normally toward the player. Destroyed with a single correct typed letter/number.\n" +
    "Fast: Slightly faster than standard. Single-hit typed to destroy.\n" +
    "Zigzag: Moves toward player in a wavy pattern. Single-hit typed to destroy.\n" +
    "Tank: Larger enemy. Requires two hits (two typed letters) to destroy. Shows a hitCount internally.\n" +
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
    "8. Game Over & Restart\n" +
    "Collision = game over. Click to restart. All stats reset.\n\n" +
    "9. Particle System\n" +
    "Destroyed enemies create glowing particles that fade and shrink.\n\n" +
    "10. Player Strategy\n" +
    "Survive by avoiding collisions. Type accurately. Prioritize Freeze/Slow. Use Bombs for groups.\n" +
    "Tanks need two hits. Balance typing and movement!\n\n" +
    "💡 The game is a typing survival challenge with increasing difficulty, visual feedback, and strategic power-ups. Accuracy and timing are key!";
  let textX = width/2 - 240;
  let textY = height/2 - 220;
  let textW = 480;
  let textH = 400;
  let scrollMax = 2800; // Full content height
  // Dynamically calculate the minimum scroll so the last section is at the bottom
  let minScroll = 0;
  let maxScroll = Math.max(0, scrollMax - textH);
  push();
  // Clip to panel area
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(textX, textY, textW, textH);
  drawingContext.clip();
  // Apply scroll offset
  text(howToText, textX + 12, textY + 12 - howToPlayScroll, textW - 24, 2000);
  drawingContext.restore();
  pop();
  // Draw scroll indicator
  let scrollBarH = Math.max(40, textH * textH / scrollMax);
  let scrollBarY = textY + (howToPlayScroll / (scrollMax - textH)) * (textH - scrollBarH);
  fill(0,80,255,80);
  rect(width/2 + 240 - 16, scrollBarY, 8, scrollBarH, 4);
// --- SCROLLING FOR HOW TO PLAY ---
function mouseWheel(event) {
  if (showHowToPlay && !gameStarted) {
    howToPlayScroll += event.delta;
    // Limit scroll so the last section is at the bottom, not past
    let maxScroll = Math.max(0, 2000 - 400);
    howToPlayScroll = constrain(howToPlayScroll, 0, maxScroll);
    return false;
  }
}

let origKeyPressed = keyPressed;
keyPressed = function() {
  if (showHowToPlay && !gameStarted) {
    if (keyCode === DOWN_ARROW) {
      howToPlayScroll += 40;
      let maxScroll = Math.max(0, 2000 - 400);
      howToPlayScroll = constrain(howToPlayScroll, 0, maxScroll);
      return false;
    } else if (keyCode === UP_ARROW) {
      howToPlayScroll -= 40;
      let maxScroll = Math.max(0, 2000 - 400);
      howToPlayScroll = constrain(howToPlayScroll, 0, maxScroll);
      return false;
    }
  }
  if (typeof origKeyPressed === 'function') origKeyPressed();
}

  // Close button
  let btnX = width/2 + 220 - 36;
  let btnY = height/2 - 220 + 16;
  fill(255, 60, 80);
  stroke(180,0,40);
  strokeWeight(2);
  rect(btnX, btnY, 32, 32, 8);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(22);
  text("X", btnX + 16, btnY + 16);
}

  if (gameOver) {
    drawGameOver();
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
  stroke(57, 255, 20, glow); // neon green
  strokeWeight(8);
  rect(playZone.x + playZone.w/2, playZone.y + playZone.h/2, playZone.w, playZone.h, 28);
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

  // Use purple hues for all enemies
  let r = 180 + 40 * sin(frameCount * 0.1 + e.x * 0.01);
  let g = 60 + 20 * sin(frameCount * 0.13 + e.y * 0.01);
  let b = 255;

  switch (e.type) {
    case "standard":
      stroke(0); strokeWeight(4);
      fill(r,g,b); rect(0,0,e.size,e.size,5); noStroke(); break;
    case "fast":
      stroke(0); strokeWeight(4);
      fill(r,g,b); rect(0,0,e.size*1.2,e.size*0.8,3); noStroke(); break;
    case "zigzag":
      stroke(0); strokeWeight(4);
      fill(r, g, b, 180);
      beginShape();
      for (let j = -e.size / 2; j <= e.size / 2; j += 10) {
        vertex(j, sin(j * 0.5 + frameCount * 0.2) * 10);
      }
      endShape(CLOSE);
      noStroke();
      // Draw readable letter for zigzag
      push();
      textAlign(CENTER, CENTER);
      let glowSize = 32 + 6 * sin(frameCount * 0.3);
      // Black background for contrast
      fill(0, 220);
      rectMode(CENTER);
      rect(0, 0, glowSize + 12, glowSize + 8, 8);
      // Neon white letter
      textSize(glowSize);
      fill(255);
      textStyle(BOLD);
      text(e.label, 0, 0);
      pop();
      break;

    case "tank":
      stroke(0); strokeWeight(4);
      fill(r,g,b); rect(0,0,e.size*1.5,e.size,5);
      fill(r+30,g+30,b); rect(0,-e.size*0.35,e.size*0.6,e.size*0.4,3);
      stroke(0,255,200,150); strokeWeight(3); line(0,-e.size*0.35,0,-e.size*0.6); noStroke(); break;

    case "bomb":
      // Classic bomb: black body, fuse, spark
      stroke(30); strokeWeight(4);
      fill(30, 30, 30); // dark bomb body
      circle(0, 0, e.size);
      // Bomb highlight
      noStroke();
      fill(180, 180, 180, 80);
      ellipse(-e.size*0.18, -e.size*0.18, e.size*0.35, e.size*0.18);
      // Fuse
      stroke(120, 80, 30); strokeWeight(3);
      let fuseLen = 12 + 2 * sin(frameCount * 0.3);
      line(0, -e.size/2, 0, -e.size/2 - fuseLen);
      // Spark at end of fuse
      let sparkX = 0, sparkY = -e.size/2 - fuseLen;
      noStroke();
      let sparkCol = color(255, 220 + 30*sin(frameCount*0.7), 60 + 80*sin(frameCount*0.5));
      for (let a = 0; a < TWO_PI; a += PI/4) {
        fill(sparkCol);
        ellipse(sparkX + cos(a)*5, sparkY + sin(a)*5, 4 + 2*sin(frameCount*0.8 + a));
      }
      break;

    case "bonus":
      stroke(0); strokeWeight(4);
      fill(r,g,b,200); circle(0,0,e.size + 10*sin(frameCount*0.2)); noStroke(); break;

    case "freeze":
      // Icy crystal: jagged, blue/white, frosty sparkles
      push();
      let iceCol = color(120, 220, 255);
      let iceGlow = color(120, 220, 255, 80 + 60 * sin(frameCount*0.2));
      let cx = 0, cy = 0, n = 7;
      // Outer icy glow
      for (let g = 3; g > 0; g--) {
        fill(120, 220, 255, 18 * g);
        beginShape();
        for (let i = 0; i < n; i++) {
          let angle = i * TWO_PI / n;
          let rad = e.size * (0.6 + 0.18 * g + 0.08 * sin(frameCount*0.5 + i));
          vertex(cx + cos(angle) * rad, cy + sin(angle) * rad);
        }
        endShape(CLOSE);
      }
      // Main icy jagged crystal
      fill(iceCol);
      stroke(200, 240, 255, 180); strokeWeight(2);
      beginShape();
      for (let i = 0; i < n; i++) {
        let angle = i * TWO_PI / n;
        let rad = e.size * (0.5 + 0.18 * sin(frameCount*0.7 + i*1.2));
        vertex(cx + cos(angle) * rad, cy + sin(angle) * rad);
      }
      endShape(CLOSE);
      // Frosty sparkles
      for (let i = 0; i < 8; i++) {
        let angle = i * PI/4 + frameCount*0.01;
        let rad = e.size * 0.7 + 6 * sin(frameCount*0.5 + i);
        fill(255,255,255, 120 + 80*sin(frameCount*0.8 + i));
        ellipse(cx + cos(angle)*rad, cy + sin(angle)*rad, 4 + 2*sin(frameCount*0.8 + i));
      }
      // White snowflake overlay
      stroke(255, 255, 255, 200); strokeWeight(2);
      for (let i = 0; i < 6; i++) {
        let angle = i * PI/3;
        line(0, 0, cos(angle) * e.size * 0.5, sin(angle) * e.size * 0.5);
      }
      noStroke();
      pop();
      break;

    case "slow":
      stroke(0); strokeWeight(4);
      fill(200, 80, 255, 200); // purple for slow
      circle(0, 0, e.size);
      stroke(255); strokeWeight(2);
      line(0, -e.size/2, 0, e.size/2);
      line(-e.size/2, 0, e.size/2, 0);
      noStroke(); break;
  }

  // Draw readable letter for all except zigzag (already handled above)
  if(e.type !== "zigzag") {
    let fontSize = 28 + 6*sin(frameCount*0.3);
    // Black background for contrast
    noStroke();
    fill(0, 220);
    rectMode(CENTER);
    rect(0, 0, fontSize + 12, fontSize + 8, 8);
    // Neon white letter
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

  let types = ["standard","fast","zigzag","tank","bomb","bonus"];
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
  if(type === "tank") size = 45;

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
        }
      } else {
        createExplosion(e, true);
        enemies.splice(i, 1);
        score++;
      }
      break;
    }
  }
}

// --- Explosion ---
function createExplosion(e, playerTriggered = true) {
  let r = random(100,255), g = random(100,255), b = 255;

  for (let j=0; j<20; j++) particles.push(new ColorParticle(e.x, e.y, random(3,6), random(TWO_PI), r, g, b, 5));
  for (let j=0; j<15; j++) particles.push(new ColorParticle(e.x, e.y, random(1.5,3), random(TWO_PI), r, g, b, 8));
  for (let j=0; j<10; j++) particles.push(new ColorParticle(e.x, e.y, random(0.5,1.5), random(TWO_PI), r, g, b, 12));

  if(e.type === "bomb") {
    let radius = 80;
    for(let i = enemies.length - 1; i >= 0; i--) {
      let other = enemies[i];
      if(other !== e && dist(e.x, e.y, other.x, other.y) <= radius) {
        createExplosion(other, playerTriggered);
        enemies.splice(i, 1);
        if(playerTriggered) score++;
      }
    }
  }

  if(e.type === "freeze") {
    let frozenEnemies = enemies.filter(other => other !== e);
    let originalSpeeds = frozenEnemies.map(o => ({vx: o.vx, vy: o.vy}));
    for (let other of frozenEnemies) { other.vx = 0; other.vy = 0; }
    setTimeout(() => {
      for (let i=0;i<frozenEnemies.length;i++) {
        frozenEnemies[i].vx = originalSpeeds[i].vx;
        frozenEnemies[i].vy = originalSpeeds[i].vy;
      }
    }, 1000);
  }

  if(e.type === "slow") {
    let slowedEnemies = enemies.filter(other => other !== e);
    let originalSpeeds = slowedEnemies.map(o => ({vx: o.vx, vy: o.vy}));
    for (let other of slowedEnemies) { other.vx *= 0.4; other.vy *= 0.4; }
    setTimeout(() => {
      for (let i=0;i<slowedEnemies.length;i++) {
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
    fill(this.r,this.g,this.b,this.alpha);
    circle(this.x,this.y,this.size);
    fill(this.r,this.g,this.b,this.alpha*0.3);
    circle(this.x,this.y,this.size*2);
  }
}

// --- UI ---
function drawScore() {
  fill(0, 100, 0, 150);
  stroke(0,255,100,200); strokeWeight(2);
  rect(10,10,140,40,10); noStroke();
  fill(255); textSize(18); textAlign(LEFT,CENTER);
  text("Score: "+score,20,30);

  // Draw lives (hearts)
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

function drawHeart(x, y, size, col, alpha=1.0) {
  push();
  translate(x, y);
  fill(red(col), green(col), blue(col), 255*alpha);
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
  stroke(0,150,255,200); strokeWeight(2);
  rect(width-150,10,140,40,10); noStroke();
  fill(255); textSize(18); textAlign(RIGHT,CENTER);
  text("Time: "+survivalTime.toFixed(1)+"s", width-20,30);
}

// --- Game Over ---
function drawGameOver() {
  let finalScore = (score*10) + Math.floor(survivalTime);
  textAlign(CENTER);
  fill(255,0,0); textSize(32); text("GAME OVER", width/2, height/2);
  textSize(18); fill(255);
  text("Enemies Destroyed: "+score, width/2, height/2 + 40);
  text("Time Survived: "+survivalTime.toFixed(1)+"s", width/2, height/2 + 70);
  text("Final Score: "+finalScore, width/2, height/2 + 100);
  text("Click to Restart", width/2, height/2 + 130);
}

// --- START & RESTART ---
function mousePressed() {
  // --- Start Screen Buttons & How to Play Overlay ---
  if (!gameStarted) {
    // If How to Play overlay is open, check for close button
    if (showHowToPlay) {
      howToPlayScroll = 0;
      let btnX = width/2 + 220 - 36;
      let btnY = height/2 - 220 + 16;
      if (
        mouseX > btnX && mouseX < btnX + 32 &&
        mouseY > btnY && mouseY < btnY + 32
      ) {
        showHowToPlay = false;
        return;
      }
      // Prevent clicking start/how to play buttons when overlay is open
      return;
    }
    // Button positions
    let startBtn = { x: width / 2, y: height / 2 + 90, w: 220, h: 60 };
    let howToPlayBtn = { x: width / 2, y: height / 2 + 160, w: 180, h: 44 };
    // Check if mouse is over How to Play button
    if (
      mouseX > howToPlayBtn.x - howToPlayBtn.w / 2 &&
      mouseX < howToPlayBtn.x + howToPlayBtn.w / 2 &&
      mouseY > howToPlayBtn.y - howToPlayBtn.h / 2 &&
      mouseY < howToPlayBtn.y + howToPlayBtn.h / 2
    ) {
      showHowToPlay = true;
      return;
    }
    // Check if mouse is over Start button
    if (
      mouseX > startBtn.x - startBtn.w / 2 &&
      mouseX < startBtn.x + startBtn.w / 2 &&
      mouseY > startBtn.y - startBtn.h / 2 &&
      mouseY < startBtn.y + startBtn.h / 2
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
    enemies = []; score = 0; moveSpeed = 4; enemySpeedMultiplier = 1;
    gameOver = false; startTime = millis(); lastSpeedIncrease = millis();
    player.x = playZone.x + playZone.w/2; player.y = playZone.y + playZone.h/2;
    lives = 3;
    loop();
  }
}

// --- START SCREEN FUNCTION ---
function drawStartScreen() {
  textAlign(CENTER, CENTER);

  // Neon animated logo
  let logoPulse = 32 + 16 * sin(frameCount * 0.08);
  textSize(60);
  fill(0, 255, 255, 220);
  stroke(0, 255, 255, 180);
  strokeWeight(logoPulse * 0.08);
  textFont('Michroma');
  text("Typing Blitz", width / 2, height / 2 - 100);
  noStroke();

  // Subtitle
  textSize(24);
  fill(255, 255, 255, 220);
  text("Typing Blitz", width / 2, height / 2 - 55);

  // Instructions
  textSize(18);
  fill(200,255,255, 180);
  text("Move: Arrow Keys", width / 2, height / 2 - 10);
  text("Type Letters/Numbers to Destroy Enemies", width / 2, height / 2 + 18);

  // Start Button
  let btnW = 260, btnH = 64;
  let btnY = height / 2 + 70;
  let btnPulse = 12 + 8 * sin(frameCount * 0.15);
  rectMode(CENTER);
  fill(0, 20, 60, 230);
  stroke(0,255,255, 180 + 60 * sin(frameCount*0.2));
  strokeWeight(4 + btnPulse * 0.08);
  rect(width / 2, btnY, btnW, btnH, 18);
  noStroke();
  fill(0,255,255);
  textSize(26);
  text("START GAME", width / 2, btnY);

  // How to Play Button
  let howToY = btnY + 70;
  fill(0, 40, 80, 210);
  stroke(0,255,255, 120);
  strokeWeight(2);
  rect(width / 2, howToY, 180, 44, 12);
  noStroke();
  fill(255);
  textSize(18);
  text("How to Play", width / 2, howToY);
}