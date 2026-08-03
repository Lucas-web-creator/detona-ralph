// ==========================================
// 1. ENGINE & LÓGICA DO PRÉDIO (GRID)
// ==========================================
class Building {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    // Matriz com o estado de cada janela: 0 (Quebrada), 1 (Parcial), 2 (Inteira)
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  }

  isFullyRepaired() {
    return this.grid.every(row => row.every(windowState => windowState === 2));
  }

  repairWindow(row, col) {
    if (this.grid[row][col] < 2) {
      this.grid[row][col] += 1;
      return true;
    }
    return false;
  }
}

// ==========================================
// 2. JOGADOR (FELIX JR.)
// ==========================================
class Player {
  constructor(gridRows, gridCols) {
    this.gridRows = gridRows;
    this.gridCols = gridCols;
    
    this.row = gridRows - 1; // Começa no chão (último andar)
    this.col = Math.floor(gridCols / 2); // Centro

    this.width = 36;
    this.height = 54;
    this.lives = 3;
    this.score = 0;
    this.isRepairing = false;
  }

  move(direction) {
    switch(direction) {
      case 'UP':
        if (this.row > 0) this.row--;
        break;
      case 'DOWN':
        if (this.row < this.gridRows - 1) this.row++;
        break;
      case 'LEFT':
        if (this.col > 0) this.col--;
        break;
      case 'RIGHT':
        if (this.col < this.gridCols - 1) this.col++;
        break;
    }
  }

  getCanvasPosition(cellWidth, cellHeight, offsetX, offsetY) {
    return {
      x: offsetX + this.col * cellWidth + (cellWidth - this.width) / 2,
      y: offsetY + this.row * cellHeight + (cellHeight - this.height) / 2
    };
  }
}

// ==========================================
// 3. PROJÉTEIS (TIJOLOS DO RALPH)
// ==========================================
class Projectile {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.width = 18;
    this.height = 18;
    this.speed = speed;
    this.active = true;
  }

  update() {
    this.y += this.speed;
  }
}

// ==========================================
// 4. MOTOR DO JOGO & COLISÃO
// ==========================================
class GameEngine {
  constructor() {
    this.building = new Building(3, 5); // 3 Andares x 5 Colunas
    this.player = new Player(3, 5);
    this.projectiles = [];
    this.brickSpeed = 3.5;
    this.ralphCol = 2; // Posição do Ralph (coluna 0 a 4)
  }

  spawnBrick(cellWidth, offsetX) {
    // Move o Ralph para a coluna de onde o tijolo vai cair
    this.ralphCol = Math.floor(Math.random() * this.building.cols);
    const spawnX = offsetX + this.ralphCol * cellWidth + (cellWidth - 18) / 2;
    this.projectiles.push(new Projectile(spawnX, 110, this.brickSpeed));
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  update(cellWidth, cellHeight, offsetX, offsetY) {
    const playerPos = this.player.getCanvasPosition(cellWidth, cellHeight, offsetX, offsetY);
    const playerBox = { x: playerPos.x, y: playerPos.y, width: this.player.width, height: this.player.height };

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update();

      if (this.checkCollision(playerBox, p)) {
        this.player.lives -= 1;
        p.active = false;
      }

      if (p.y > 600 || !p.active) {
        this.projectiles.splice(i, 1);
      }
    }
  }
}

// ==========================================
// 5. INPUT HANDLER (TECLADO)
// ==========================================
class InputHandler {
  constructor(engine) {
    this.engine = engine;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      if (this.engine.player.lives <= 0) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.engine.player.move('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.engine.player.move('RIGHT');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.engine.player.move('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.engine.player.move('DOWN');
          break;
        case ' ':
          this.handleRepair();
          break;
      }
    });
  }

  handleRepair() {
    const player = this.engine.player;
    const building = this.engine.building;
    
    player.isRepairing = true;
    const scoreGained = building.repairWindow(player.row, player.col);
    if (scoreGained) {
      player.score += 100;
    }

    setTimeout(() => {
      player.isRepairing = false;
    }, 150);
  }
}

// ==========================================
// 6. RENDERIZADOR VETORIAL/CANVAS
// ==========================================
class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.cellWidth = 70;
    this.cellHeight = 100;
    this.offsetX = 75;
    this.offsetY = 180;
  }

  clear() {
    this.ctx.fillStyle = '#181425';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  drawUI(player) {
    this.ctx.fillStyle = '#f7d000';
    this.ctx.font = 'bold 16px "Courier New", monospace';
    this.ctx.fillText(`SCORE: ${player.score}`, 20, 30);
    this.ctx.fillText(`LIVES: ${'♥ '.repeat(player.lives)}`, 360, 30);
  }

  drawRalph(ralphCol) {
    const x = this.offsetX + ralphCol * this.cellWidth + (this.cellWidth - 50) / 2;
    const y = 110;

    this.ctx.fillStyle = '#8b2611';
    this.ctx.fillRect(x, y, 50, 40);
    
    this.ctx.fillStyle = '#dca176';
    this.ctx.fillRect(x + 10, y - 20, 30, 20);

    this.ctx.fillStyle = '#5c1d06';
    this.ctx.fillRect(x + 8, y - 25, 34, 8);
  }

  drawBuilding(building) {
    this.ctx.fillStyle = '#4a2810';
    this.ctx.fillRect(this.offsetX - 20, this.offsetY - 20, (building.cols * this.cellWidth) + 40, (building.rows * this.cellHeight) + 40);

    for (let r = 0; r < building.rows; r++) {
      for (let c = 0; c < building.cols; c++) {
        const x = this.offsetX + c * this.cellWidth + 10;
        const y = this.offsetY + r * this.cellHeight + 15;
        const w = this.cellWidth - 20;
        const h = this.cellHeight - 30;
        const state = building.grid[r][c];

        this.ctx.fillStyle = '#221105';
        this.ctx.fillRect(x - 4, y - 4, w + 8, h + 8);

        if (state === 2) {
          this.ctx.fillStyle = '#68c2d3';
          this.ctx.fillRect(x, y, w, h);
          this.ctx.fillStyle = '#ffffff';
          this.ctx.fillRect(x + 4, y + 4, 10, h - 8);
        } else if (state === 1) {
          this.ctx.fillStyle = '#3a6873';
          this.ctx.fillRect(x, y, w, h);
          this.ctx.strokeStyle = '#181425';
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.moveTo(x + 10, y);
          this.ctx.lineTo(x + w / 2, y + h / 2);
          this.ctx.lineTo(x + w - 10, y + h);
          this.ctx.stroke();
        } else {
          this.ctx.fillStyle = '#181425';
          this.ctx.fillRect(x, y, w, h);
        }
      }
    }
  }

  drawPlayer(player) {
    const pos = player.getCanvasPosition(this.cellWidth, this.cellHeight, this.offsetX, this.offsetY);

    this.ctx.fillStyle = '#1e40af';
    this.ctx.fillRect(pos.x, pos.y + 15, player.width, player.height - 15);

    this.ctx.fillStyle = '#fca5a5';
    this.ctx.fillRect(pos.x + 6, pos.y, 24, 18);

    this.ctx.fillStyle = '#1d4ed8';
    this.ctx.fillRect(pos.x + 4, pos.y - 4, 28, 8);

    if (player.isRepairing) {
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.fillRect(pos.x + player.width, pos.y + 10, 16, 12);
    }
  }

  drawProjectiles(projectiles) {
    this.ctx.fillStyle = '#b91c1c';
    projectiles.forEach(p => {
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
      this.ctx.strokeStyle = '#450a0a';
      this.ctx.strokeRect(p.x, p.y, p.width, p.height);
    });
  }

  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.ctx.fillStyle = '#ef4444';
    this.ctx.font = 'bold 32px "Courier New", monospace';
    this.ctx.fillText('GAME OVER', 160, 280);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px "Courier New", monospace';
    this.ctx.fillText('Recarregue a página para jogar novamente', 60, 330);
  }

  drawVictory() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.ctx.fillStyle = '#10b981';
    this.ctx.font = 'bold 32px "Courier New", monospace';
    this.ctx.fillText('YOU WIN!', 180, 280);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px "Courier New", monospace';
    this.ctx.fillText('Você consertou o prédio inteiro!', 100, 330);
  }
}

// ==========================================
// 7. INICIALIZAÇÃO E LOOP PRINCIPAL
// ==========================================
window.onload = () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const engine = new GameEngine();
  const renderer = new Renderer(ctx);
  new InputHandler(engine);

  let lastSpawn = 0;

  function loop(timestamp) {
    renderer.clear();

    if (engine.building.isFullyRepaired()) {
      renderer.drawBuilding(engine.building);
      renderer.drawVictory();
      return;
    }

    if (engine.player.lives <= 0) {
      renderer.drawGameOver();
      return;
    }

    if (timestamp - lastSpawn > 1200) {
      engine.spawnBrick(renderer.cellWidth, renderer.offsetX);
      lastSpawn = timestamp;
    }

    engine.update(renderer.cellWidth, renderer.cellHeight, renderer.offsetX, renderer.offsetY);

    renderer.drawUI(engine.player);
    renderer.drawRalph(engine.ralphCol);
    renderer.drawBuilding(engine.building);
    renderer.drawPlayer(engine.player);
    renderer.drawProjectiles(engine.projectiles);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
};