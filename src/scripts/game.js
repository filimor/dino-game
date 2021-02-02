const FIELD_HEIGHT = 150;
const FIELD_WIDTH = 600;
const PLAYER_HEIGHT = 46;
const PLAYER_WIDTH = 44;
const PLAYER_START_X = 22;
const PLAYER_START_Y = 127;
const FPS = 1 / 20;
const KEYBINDS = {
  ' ': 'jump',
  'ArrowDown': 'duck'
};

// TODO: Couldn't this be inside a class?
function randomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// TODO: use ES6 prop names
class Entity {
  constructor(position, speed, direction) {
    this.position = position;
    this.speed = speed;
    this._direction = direction;
    this.timer = 0;
    this.width = 5;
    this.height = 5;
    this.hp = 1;
    // TODO: reduce collision rect size
    this.collisionRect = new Rectangle(
      this.position.x - this.width / 2,
      this.position.y - this.height / 2,
      this.width,
      this.height
    );
  }

  get direction() {
    return this._direction;
  }

  set direction(value) {
    this._direction = value;
  }

  getCollisionRect() {
    this.collisionRect.x = this.position.x - this.width / 2;
    this.collisionRect.y = this.position.y - this.height / 2;
    this.collisionRect.width = this.width;
    this.collisionRect.height = this.height;

    return this.collisionRect;
  }

  update(fps) {
    this.timer += fps;
  }
}

// TODO: create subclasse of enemy with different sizes
class Enemy extends Entity {
  constructor(position, speed) {
    super(position, speed, new Vector2d(-1, 0));

    // TODO: Implement different enemy sizes (sub-classing?)
    this.width = 34;
    this.height = 35;
    // TODO: Do I need this field?
    this.timer = 0;
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
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.gravity = 9.8 * 6;
    this.impulse = 50;
    this.ducking = false;
    this.jumping = false;
    this.speed = 100;
  }

  jump() {
    if (this.jumping) {
      return;
    }

    this.jumping = true;

    // TODO: Fix the FPS used
    let maxJump = PLAYER_HEIGHT / 2;
    let upInterval = setInterval(() => {
      if (this.position.y <= maxJump) {
        this.position.y = maxJump;
        clearInterval(upInterval);

        let downInterval = setInterval(() => {
          this.direction.set(0, 1);
          if (this.position.y >= PLAYER_START_Y) {
            this.position.y = PLAYER_START_Y;
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
    this.ducking = enable;
    console.log('duck to be implemented');
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
          if (game.getPlayer()) {
            game.player.jump();
          }
        }
      },
      'duck': () => {
        if (game.getPlayer()) {
          game.player.duck(true);
        }
      }
    };

    this.endActions = {
      'duck': () => {
        if (game.getPlayer()) {
          game.getPlayer.duck(false);
        }
      }
    };
  }

  startAction(id, playerAction) {
    if (playerAction === undefined) {
      return;
    }

    // TODO: WTF is that?
    let f;
    if (f = this.startActions[playerAction]) {
      f();
    }

    this.ongoingActions.push({identifier: id, playerAction: playerAction});
  }

  endAction(id) {
    // TODO: remove duplicated code

    let index = this.ongoingActions.findIndex(x => x.identifier === id);

    let f;
    if (index >= 0) {
      // TODO: WTF again?
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

      // TODO: It's really necessary?
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

    this.playerSprite = new Sprite('/src/images/dino.png', 4, 8, 0, 0, 0);
    this.enemySprites = [
      new Sprite('/src/images/small_cactus1.png', 1, 2, 0, 0, 0),
      new Sprite('/src/images/small_cactus2.png', 1, 1, 0, 0, 0)
    ];

    this.sprites = [].concat(this.playerSprite, this.enemySprites);
  }

  // TODO: convert entity.position.x = entity.width / 2 to a prop?
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

    this.context.fillStyle = '#fafafa';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const entity of game.getEntities()) {
      if (entity instanceof Enemy) {
        this.drawSprite(this.enemySprites[0], entity);
      } else if (entity instanceof Player) {
        this.drawSprite(this.playerSprite, entity);
      }
    }

    this.updateUI();
  }

  updateUI() {
    const scoreElement = document.querySelector('#score');
    const highScoresElement = document.querySelector('#high-scores');
    const titleElement = document.querySelector('#title');

    const scoreText = 'Score' + Math.round(game.score);
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
      console.log(highScoresElement);
    } else {
      highScoresElement.style.display = 'none';
      titleElement.style.display = 'none';
    }

    if (game.started) {
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
    for (const entity of game.getEntities()) {
      this.velocityStep.set(entity.direction.x, entity.direction.y);
      this.velocityStep.scalarMultiply(entity.speed * fps);
      entity.position.add(this.velocityStep);
    }

    for (const enemy of game.getEnemies()) {
      this.collide(game.getPlayer(), enemy);
    }

    if (game.getPlayer() && game.getPlayer().jumping) {

    }
  }
}

// TODO: remove unused methods
class Vector2d {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vector2d(this.x, this.y);
  }

  add(vector2) {
    this.x += vector2.x;
    this.y += vector2.y;
  }

  subtract(vector2) {
    this.x -= vector2.x;
    this.y -= vector2.y;
  }

  static vectorLength(vector) {
    return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
  }

  scalarMultiply(scalarValue) {
    this.x *= scalarValue;
    this.y *= scalarValue;
  }

  static vectorNormalize(vector) {
    const reciprocal = 1.0 / (this.vectorLength(vector) + Number.EPSILON);
    return this.scalarMultiply(reciprocal);
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

  static clone() {
    return new Rectangle(this.x, this.y, this.width, this.height);
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

  containsPoint(x, y) {
    return this.left() <= x &&
      x <= this.right() &&
      this.top() <= y &&
      y <= this.bottom();
  }

  //TODO: It's really necessary?f
  static union(rectangle2) {
    if (rectangle2 === undefined) {
      return;
    }

    const x = Math.min(this.x, rectangle2.x);
    const y = Math.min(this.y, rectangle2.y);
    const width = Math.max(this.right(), rectangle2.right() -
      Math.min(this.left(), rectangle2.left()));
    const height = Math.max(this.bottom, rectangle2.bottom() -
      Math.min(this.top(), rectangle2.top()));

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

class Keyboard {
  // TODO: Detach keyboard from playerActions
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

class Game {
  constructor() {
    this.fieldRect = new Rectangle(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    this.enemySpeed = 150;
    this.spawnInterval = 10;
    this.entities = [];
    this.enemies = [];
    this.player = undefined;
    this.started = false;
    this.gameOver = false;
    this.score = 0;
    this.lastFps = 0;
    // TODO: Move the high scores to another class
    this.highScores = [];
    this.updateFunc = () => this.update();

    if (typeof(Storage) !== undefined) {
      try {
        this.highScores = JSON.parse(localStorage.dinoScores);
      } catch (e) {
        this.highScores = [];
      }
    }
  }

  start() {
    this.addEntity(new Player(new Vector2d(PLAYER_START_X, PLAYER_START_Y)));

    if (!this.started) {
      window.requestAnimationFrame(() => this.update());
      this.started = true;
    }
  }

  addEntity(entity) {
    this.entities.push(entity);

    if (entity instanceof Player) {
      this.player = entity;
    } else if (entity instanceof Enemy) {
      this.enemies.push(entity);
    }
  }

  removeEntities(entities) {
    if (!entities) {
      return;
    }

    this.entities = this.entities.filter(x => !entities.includes(x));
    this.enemies = this.enemies.filter(x => !entities.includes(x));

    if (entities.includes(this.player)) {
      this.player = undefined;
    }
  }

  update(newFps) {
    // TODO: remove this and fix FPS calculation
    const fps = FPS;

    // TODO: update the score here?
    //score++;

    //const fps = Math.min((newFps - this.lastFps) / 1000, FPS);
    //this.lastFps = timer;

    if (this.gameOver) {
      this.started = false;
      return;
    }

    physics.update(fps);

    for (const entity of this.entities) {
      entity.update(fps);

      if (entity.hp <= 0) {
        this.removeEntities([entity]);
      }
    }

    // TODO: Fix the crazy spawn rate
    if(randomInt(2000) < this.spawnInterval) {
      this.addEntity(new Enemy(new Vector2d(617, 133), this.enemySpeed));
    }

    //TODO: remove coupling (dependency injection?)
    renderer.render(fps);
    window.requestAnimationFrame(this.updateFunc);
  }

  addScore(score) {
    this.highScores.push(score);
    this.highScores.sort((a, b) => b - a);
    this.highScores = this.highScores.slice(0, 10);

    // TODO: Eliminate duplicated code
    if (typeof(Storage) !== undefined) {
      localStorage.dinoScores = JSON.stringify(this.highScores);
    }
  }

  setGameOver() {
    this.gameOver = true;
    this.addScore(Math.round(this.score));
  }

  //TODO: Can I convert it to full properties?
  getEntities() {
    return this.entities;
  }

  getFieldRect() {
    return this.fieldRect;
  }

  getEnemies() {
    return this.enemies;
  }

  getPlayer() {
    return this.player;
  }
}

const game = new Game();
const renderer = new Renderer();
const playerActions = new PlayerActions();
const physics = new Physics();
const keyboard = new Keyboard();

document.body.addEventListener('keydown', keyboard.keyDown);
document.body.addEventListener('keyup', keyboard.keyUp);