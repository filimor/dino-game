const FIELD_BACKGROUND = '#fafafa';
const FIELD_HEIGHT = 150;
const FIELD_WIDTH = 600;
const FPS = 1/60;

const PLAYER_POS = {
  'NORMAL_WIDTH': 44,
  'NORMAL_HEIGHT': 46,
  'NORMAL_X': 22,
  'NORMAL_Y': 127,
  'DUCK_WIDTH': 58,
  'DUCK_HEIGHT': 30,
  'DUCK_X': 29,
  'DUCK_Y': 135,
};

const ENEMY_POS = {
  'START_X': 650,
  'CACTUS1_START_Y': 133,
  'CACTUS1_WIDTH': 34,
  'CACTUS1_HEIGHT': 35,
  'CACTUS2_START_Y': 133,
  'CACTUS2_WIDTH': 25,
  'CACTUS2_HEIGHT': 49,
  'BIRD_START_Y': 100,
  'BIRD_WIDTH': 46,
  'BIRD_HEIGHT': 39,
};

const KEYBINDS = {
  ' ': 'jump',
  'ArrowDown': 'duck'
};

class Entity {
  constructor(position, speed, direction) {
    this.position = position;
    this.speed = speed;
    this._direction = direction;
    this.width = 5;
    this.height = 5;
    this.hp = 1;
    this.padding = -8;
    this.collisionRect = new Rectangle(
      this.position.x - this.width / 2 + this.padding,
      this.position.y - this.height / 2 + this.padding,
      this.width + this.padding,
      this.height + this.padding
    );
  }

  get direction() {
    return this._direction;
  }

  set direction(value) {
    this._direction = value;
  }

  getCollisionRect() {
    this.collisionRect.x = this.position.x - this.width / 2 + this.padding;
    this.collisionRect.y = this.position.y - this.height / 2 + this.padding;
    this.collisionRect.width = this.width + this.padding;
    this.collisionRect.height = this.height + this.padding;

    return this.collisionRect;
  }

  update(fps) {
  }
}
class Enemy extends Entity {
  constructor(position, speed, rank) {
    super(position, speed, new Vector2d(-1, 0));

    // TODO: Implement different enemy sizes
    this.width = 34;
    this.height = 35;
    this.rank = rank;
  }

  update(fps) {
    super.update(fps);

    if (this.getCollisionRect().right() <= 0 ) {
      this.hp--;
    }
  }
}

class Player extends Entity {
  constructor(position) {
    super(position, 0, new Vector2d(0, 0));
    this.width = PLAYER_POS.NORMAL_WIDTH;
    this.height = PLAYER_POS.NORMAL_HEIGHT;
    this.ducking = false;
    this.jumping = false;
    this.speed = 160;
    this.status = 0;
  }

  jump() {
    if (this.jumping || this.ducking) {
      return;
    }

    this.jumping = true;

    let maxJump = PLAYER_POS.NORMAL_HEIGHT / 2;
    let upInterval = setInterval(() => {
      if (this.position.y <= maxJump) {
        this.position.y = maxJump;
        clearInterval(upInterval);

        let downInterval = setInterval(() => {
          this.direction.set(0, 1);
          if (this.position.y >= PLAYER_POS.NORMAL_Y) {
            this.position.y = PLAYER_POS.NORMAL_Y;
            this.direction.set(0, 0);
            clearInterval(downInterval);
            this.jumping = false;
          }
        }, FPS);
      } else {
        this.direction.set(0, -1);
      }
    }, FPS);
  }

  duck(enable) {
    if (this.jumping) {
      return;
    }

    this.ducking = enable;

    if (enable) {
      this.width = PLAYER_POS.DUCK_WIDTH;
      this.height = PLAYER_POS.DUCK_HEIGHT;
      this.position.x = PLAYER_POS.DUCK_X;
      this.position.y = PLAYER_POS.DUCK_Y;
      this.status = 1;
    } else {
      this.width = PLAYER_POS.NORMAL_WIDTH;
      this.height = PLAYER_POS.NORMAL_HEIGHT;
      this.position.x = PLAYER_POS.NORMAL_X;
      this.position.y = PLAYER_POS.NORMAL_Y;
      this.status = 0;
    }
  }

  update(fps) {
    super.update(fps);
  }
}

class PlayerActions {
  constructor() {
    this.ongoingActions = [];

    this.startActions = {
      'jump': () => {
        if (!game.started || game.gameOver) {
          game.start();
        } else {
          if (game.player) {
            game.player.jump();
          }
        }
      },
      'duck': () => {
        if (game.player) {
          game.player.duck(true);
        }
      }
    };

    this.endActions = {
      'duck': () => {
        if (game.player) {
          game.player.duck(false);
        }
      }
    };
  }

  startAction(id, playerAction) {
    if (playerAction === undefined) {
      return;
    }

    let f;
    if (f = this.startActions[playerAction]) {
      f();
    }

    this.ongoingActions.push({identifier: id, playerAction: playerAction});
  }

  endAction(id) {
    let index = this.ongoingActions.findIndex(x => x.identifier === id);

    let f;
    if (index >= 0) {
      if (f = this.endActions[this.ongoingActions[index].playerAction]) {
        f();
      }

      this.ongoingActions.splice(index, 1);
    }
  }
}

class Sprite {
  constructor(path, frames, fps, red, green, blue) {
    this.frames = frames;
    this.fps = fps;
    this.timer = 0;
    this.currentFrame = 0;
    this.image = new Image();
    this.spriteImage = new Image();
    this.spriteImage.src = path;

    this.spriteImage.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.width = this.spriteImage.width;
      canvas.height = this.spriteImage.height;

      context.drawImage(
        this.spriteImage, 0, 0, this.spriteImage.width, this.spriteImage.height,
        0, 0, canvas.width, canvas.height
      );

      const sourceData = context.getImageData(
        0, 0, this.spriteImage.width, this.spriteImage.height
      );

      const data = sourceData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = red;
        data[i + 1] = green;
        data[i + 2] = blue;
      }

      context.putImageData(sourceData, 0, 0);
      this.image.src = canvas.toDataURL('image/png');
    };
  }

  update(fps) {
    this.timer += fps;

    if (this.timer > 1/ this.fps) {
      this.timer = 0;
    }

    this.currentFrame = (this.currentFrame + 1) % this.frames;
  }
}

class Renderer {
  constructor() {
    this.canvas = document.querySelector('#game-layer');
    this.context = this.canvas.getContext('2d');

    this.playerSprites = [
      new Sprite('/src/images/dino.png', 4, 8, 0, 0, 0),
      new Sprite('/src/images/dino_down.png', 2, 4, 0, 0, 0),
    ];
    this.enemySprites = [
      new Sprite('/src/images/small_cactus1.png', 1, 2, 0, 0, 0),
      new Sprite('/src/images/small_cactus2.png', 1, 2, 0, 0, 0),
      new Sprite('/src/images/small_cactus3.png', 1, 2, 0, 0, 0),
      new Sprite('/src/images/big_cactus1.png', 1, 2, 0, 0, 0),
      new Sprite('/src/images/big_cactus2.png', 1, 2, 0, 0, 0),
      new Sprite('/src/images/big_cactus3.png', 1, 2, 0, 0, 0),
      new Sprite('/src/images/big_cactus4.png', 1, 2, 0, 0, 0),
      new Sprite('/src/images/bird.png', 2, 4, 0, 0, 0),
    ];

    this.sprites = [].concat(this.playerSprites, this.enemySprites);
  }

  drawSprite(sprite, entity) {
    const frame = sprite.image.width / sprite.frames;
    this.context.drawImage(
      sprite.image,
      frame * sprite.currentFrame,
      0,
      frame,
      sprite.image.height,
      entity.position.x - entity.width / 2,
      entity.position.y - entity.height / 2,
      entity.width,
      entity.height
    );
  }

  render(fps) {
    for (const sprite of this.sprites) {
      sprite.update(fps);
    }

    this.context.fillStyle = FIELD_BACKGROUND;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const entity of game.entities) {
      if (entity instanceof Enemy) {
        this.drawSprite(this.enemySprites[entity.rank], entity);
      } else if (entity instanceof Player) {
        this.drawSprite(this.playerSprites[entity.status], entity);
      }
    }

    this.updateUI();
  }

  updateUI() {
    const scoreElement = document.querySelector('#score');
    const highScoresElement = document.querySelector('#high-scores');
    const titleElement = document.querySelector('#title');

    const scoreText = + Math.round(game.score);
    if (scoreElement.innerHTML != scoreText) {
      scoreElement.innerHTML = scoreText;
    }

    if (game.gameOver) {
      const scores = game.highScores;

      for (let i = 0; i < scores.length; i++) {
        document.querySelector('#score' + i).innerHTML = scores[i];
      }

      highScoresElement.style.display = 'block';
      titleElement.style.display = 'none';
    } else {
      highScoresElement.style.display = 'none';
      titleElement.style.display = 'none';
    }
  }
}

class Physics {
  constructor() {
    this.velocityStep = new Vector2d(0, 0);
  }

  collide(entity1, entity2) {
    if (entity1.getCollisionRect().intersects(entity2.getCollisionRect())) {
      game.setGameOver();
    }
  }

  update(fps) {
    for (const entity of game.entities) {
      this.velocityStep.set(entity.direction.x, entity.direction.y);
      this.velocityStep.scalarMultiply(entity.speed * fps);
      entity.position.add(this.velocityStep);
    }

    for (const enemy of game.enemies) {
      this.collide(game.player, enemy);
    }
  }
}

class Vector2d {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
  }

  add(vector2) {
    this.x += vector2.x;
    this.y += vector2.y;
  }

  scalarMultiply(scalarValue) {
    this.x *= scalarValue;
    this.y *= scalarValue;
  }
}

class Rectangle {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  set(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  left() {
    return this.x;
  }

  right() {
    return this.x + this.width;
  }

  top() {
    return this.y;
  }

  bottom() {
    return this.y + this.height;
  }

  intersects(rectangle2) {
    return this.right() >= rectangle2.left() &&
      this.left() <= rectangle2.right() &&
      this.top() <= rectangle2.bottom() &&
      this.bottom() >= rectangle2.top();
  }
}

class Keyboard {
  keyDown(event) {
    const key = event.key;

    if (KEYBINDS[key] !== undefined) {
      event.preventDefault();
      playerActions.startAction(key, KEYBINDS[key]);
    }
  }

  keyUp(event) {
    const key = event.key;

    if (KEYBINDS[key] !== undefined) {
      event.preventDefault();
      playerActions.endAction(key);
    }
  }
}

class io {
  static getHighScores() {
    if (typeof(Storage) !== undefined) {
      try {
        return JSON.parse(localStorage.dinoScores);
      } catch (e) {
        return [];
      }
    }
  }

  static SaveHighScores(scores) {
    if (typeof(Storage) !== undefined) {
      localStorage.dinoScores = JSON.stringify(scores);
    }
  }
}

class Game {
  constructor() {
    this._fieldRect = new Rectangle(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    this.enemySpeed = 150;
    this.SpawnRate =  20;
    this._entities = [];
    this._enemies = [];
    this._player = undefined;
    this.started = false;
    this.gameOver = false;
    this.score = 0;
    this.highScores = io.getHighScores();
    this.updateFunction = () => this.update();
  }

  get entities() {
    return this._entities;
  }

  get player() {
    return this._player;
  }

  get enemies() {
    return this._enemies;
  }

  get fieldRect() {
    return this._fieldRect;
  }

  start() {
    if (this.player === undefined) {
      this.addEntity(new Player(new Vector2d(PLAYER_POS.NORMAL_X, PLAYER_POS.NORMAL_Y)));
    }

    if (!this.started) {
      if (this.gameOver) {
        this.removeEntities(this._enemies);
        this.gameOver = false;
      }

      window.requestAnimationFrame(() => this.update());
      this.started = true;
    }
  }

  addEntity(entity) {
    this._entities.push(entity);

    if (entity instanceof Player) {
      this._player = entity;
    } else if (entity instanceof Enemy) {
      this._enemies.push(entity);
    }
  }

  removeEntities(entities) {
    if (!entities) {
      return;
    }

    this._entities = this._entities.filter(x => !entities.includes(x));
    this._enemies = this._enemies.filter(x => !entities.includes(x));

    if (entities.includes(this._player)) {
      this._player = undefined;
    }
  }

  update() {
    if (this.gameOver) {
      this.started = false;
      return;
    }

    physics.update(FPS);

    for (const entity of this._entities) {
      entity.update(FPS);

      if (entity.hp <= 0) {
        this.removeEntities([entity]);
      }
    }

    if(Math.floor(Math.random() * 1000) < this.SpawnRate) {
      switch (Math.floor(Math.random() * 3)) {
        case 1:
          this.addEntity(new Enemy(
            new Vector2d(ENEMY_POS.START_X, ENEMY_POS.CACTUS1_START_Y),
            this.enemySpeed, 0)
          );
          break;
        case 2:
          this.addEntity(new Enemy(
            new Vector2d(ENEMY_POS.START_X, ENEMY_POS.CACTUS2_START_Y),
            this.enemySpeed, 3)
          );
          break;
        case 3:
          this.addEntity(new Enemy(
            new Vector2d(ENEMY_POS.START_X, ENEMY_POS.BIRD_START_Y),
            this.enemySpeed, 7)
          );
          break;
        default:
          break;
      }

    }

    this.score++;
    renderer.render(FPS);
    window.requestAnimationFrame(this.updateFunction);
  }

  addScore(score) {
    this.highScores.push(score);
    this.highScores.sort((a, b) => b - a);
    this.highScores = this.highScores.slice(0, 10);
    io.SaveHighScores(this.highScores);
  }

  setGameOver() {
    this.gameOver = true;
    this.addScore(Math.round(this.score));
  }
}

const game = new Game();
const renderer = new Renderer();
const playerActions = new PlayerActions();
const physics = new Physics();
const keyboard = new Keyboard();

document.body.addEventListener('keydown', keyboard.keyDown);
document.body.addEventListener('keyup', keyboard.keyUp);