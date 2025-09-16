
// Core game logic: towers, enemies, projectiles, UI, and effects
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const tileSize = 40;
const mapWidth = 12;
const mapHeight = 16;
let grid = [], towers = [], enemies = [], projectiles = [];
let gold = 100, lives = 10, xp = 0, level = 1;
let wave = 0, path = [];
let upgrades = { range: 0, damage: 0 };

// INIT
function initGrid() {
  grid = Array.from({ length: mapHeight }, (_, y) =>
    Array.from({ length: mapWidth }, (_, x) => ({ x, y, walkable: true }))
  );
}
function buildPath() {
  path = [
    {x: 0, y: 8}, {x: 1, y: 8}, {x: 2, y: 8}, {x: 2, y: 7}, {x: 2, y: 6},
    {x: 3, y: 6}, {x: 4, y: 6}, {x: 5, y: 6}, {x: 6, y: 6},
    {x: 6, y: 7}, {x: 6, y: 8}, {x: 7, y: 8}, {x: 8, y: 8},
    {x: 9, y: 8}, {x: 10, y: 8}, {x: 11, y: 8}
  ];
}
function placeTower(type) {
  const x = Math.floor(Math.random() * mapWidth);
  const y = Math.floor(Math.random() * mapHeight);
  if (!path.some(p => p.x === x && p.y === y)) {
    towers.push({x, y, type, cooldown: 0});
    gold -= 25;
    updateUI();
  }
}
function buyUpgrade(type) {
  const cost = type === 'range' ? 25 : 30;
  if (gold >= cost) {
    upgrades[type]++;
    gold -= cost;
    document.getElementById("upgrades").textContent =
      `Upgrades: +Range(${upgrades.range}) +Damage(${upgrades.damage})`;
    updateUI();
  }
}

// ENEMIES
function spawnEnemy() {
  let hp = 10 + wave * 2;
  if (wave % 5 === 0) hp += 10;
  enemies.push({ x: 0, y: 8, pathIndex: 0, hp });
}
function moveEnemies() {
  enemies.forEach(e => {
    const target = path[e.pathIndex + 1];
    if (!target) {
      lives--;
      enemies = enemies.filter(en => en !== e);
      updateUI();
      return;
    }
    const dx = target.x - e.x, dy = target.y - e.y;
    e.x += dx * 0.05;
    e.y += dy * 0.05;
    if (Math.abs(e.x - target.x) < 0.1 && Math.abs(e.y - target.y) < 0.1)
      e.pathIndex++;
  });
}

// TOWER ATTACK
function towerAttack() {
  towers.forEach(t => {
    if (t.cooldown > 0) return t.cooldown--;
    const range = 2 + upgrades.range * 0.5;
    const damage = 5 + upgrades.damage * 2;
    const aoe = t.type === 'aoe';
    const slow = t.type === 'slow';
    const poison = t.type === 'poison';
    const targets = enemies.filter(e => Math.hypot(e.x - t.x, e.y - t.y) < range);
    if (targets.length) {
      const tgt = targets[0];
      projectiles.push({ x: t.x, y: t.y, target: tgt, damage, aoe, slow, poison });
      t.cooldown = t.type === 'sniper' ? 60 : 30;
    }
  });
}

// PROJECTILES
function updateProjectiles() {
  projectiles.forEach(p => {
    const dx = p.target.x - p.x, dy = p.target.y - p.y;
    p.x += dx * 0.1;
    p.y += dy * 0.1;
    if (Math.abs(p.x - p.target.x) < 0.2 && Math.abs(p.y - p.target.y) < 0.2) {
      if (p.aoe) {
        enemies.forEach(e => {
          if (Math.hypot(e.x - p.target.x, e.y - p.target.y) < 1.5)
            e.hp -= p.damage;
        });
      } else {
        p.target.hp -= p.damage;
        if (p.poison) p.target.poison = 3;
        if (p.slow) p.target.slow = 60;
      }
      projectiles = projectiles.filter(pr => pr !== p);
    }
  });
}

// DOT & SLOW
function applyEffects() {
  enemies.forEach(e => {
    if (e.poison > 0) {
      e.hp -= 0.5;
      e.poison--;
    }
    if (e.slow > 0) {
      e.slow--;
    }
  });
}

// UI + DRAWING
function updateUI() {
  document.getElementById("gold").textContent = gold;
  document.getElementById("lives").textContent = lives;
  document.getElementById("xp").textContent = xp;
  document.getElementById("level").textContent = level;
}
function drawGrid() {
  grid.forEach(row => row.forEach(tile => {
    ctx.fillStyle = path.some(p => p.x === tile.x && p.y === tile.y) ? '#333' : '#1a1a1a';
    ctx.fillRect(tile.x * tileSize, tile.y * tileSize, tileSize, tileSize);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(tile.x * tileSize, tile.y * tileSize, tileSize, tileSize);
  }));
}
function drawTowers() {
  towers.forEach(t => {
    ctx.fillStyle = {
      'sniper': 'purple', 'aoe': 'orange', 'slow': 'cyan', 'poison': 'lime'
    }[t.type] || 'blue';
    ctx.fillRect(t.x * tileSize + 10, t.y * tileSize + 10, 20, 20);
  });
}
function drawEnemies() {
  enemies.forEach(e => {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(e.x * tileSize + tileSize/2, e.y * tileSize + tileSize/2, 10, 0, Math.PI * 2);
    ctx.fill();
  });
}
function drawProjectiles() {
  projectiles.forEach(p => {
    ctx.fillStyle = p.aoe ? 'orange' : p.slow ? 'cyan' : p.poison ? 'lime' : 'yellow';
    ctx.beginPath();
    ctx.arc(p.x * tileSize + tileSize/2, p.y * tileSize + tileSize/2, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// GAME LOOP
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(); drawTowers(); drawEnemies(); drawProjectiles();
  moveEnemies(); towerAttack(); updateProjectiles(); applyEffects();
  requestAnimationFrame(gameLoop);
}
initGrid(); buildPath(); gameLoop();
setInterval(() => { spawnEnemy(); wave++; }, 4000);
