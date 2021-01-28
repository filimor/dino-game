const FIELD_HEIGHT = 150;
const FIELD_WIDTH = 600;

class Character {
  constructor(x, y, height, width) {
    this.x = x;
    this.y = y;
    this.width = height;
    this.height = width;
    this.direction = -1;
  }

  update() {
    if (this.y <= 0 || this.y + this.height >= game.fieldHeight) {
      this.direction *= -1;
    }
  }
}

class Player extends Character {
}

class Enemy extends Character {
}

class Renderer {
  constructor() {
    this.render();
  }

  drawEnemy(context, enemy) {
    context.fillStyle = 'red';
    context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  }

  drawPlayer(context, player) {
    context.fillStyle = 'blue';
    context.fillRect(player.x, player.y, player.width, player.height);
  }

  render() {
    //TODO: load sprites
    const canvas = document.querySelector('#game-layer');
    const context = canvas.getContext('2d');

    context.fillStyle = '#fafafa';
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const entity of game.getEntities()) {
      if (entity instanceof Enemy) {
        this.drawEnemy(context, entity);
      } else if (entity instanceof Player) {
        this.drawPlayer(context, entity);
      }
    }
  }
}

class Physics {
  constructor() {
    this.update();
  }

  static update() {
    for (const entity of game.getEntities()) {
      entity.y += entity.direction;
    }
  }
}

class Game {
  constructor() {
    this.fieldHeight = FIELD_HEIGHT;
    this.entities = [];
  }

  start() {
    this.entities.push(new Player(100, 50, 44, 46));
    this.entities.push(new Enemy(20, 25, 34, 35));

    window.requestAnimationFrame(() => this.update());
  }

  update() {
    Physics.update();

    for (const entity of this.entities) {
      entity.update();
    }

    renderer.render();

    window.requestAnimationFrame(() => this.update());
  }

  getEntities() {
    return this.entities;
  }
}

const game = new Game();
const renderer = new Renderer();
game.start();
game.update();