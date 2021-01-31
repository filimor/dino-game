const FIELD_HEIGHT = 150;
const FIELD_WIDTH = 600;
const MIN_FPS = 3 / 60;
const PLAYER_HEIGHT = 46;
const PLAYER_WIDTH = 44;
const PLAYER_START_X = 22;
const PLAYER_START_Y = 127;
//TODO: Put this property back inside the keyboard  class
const KEYBINDS = {
  ' ': 'jump',
  'ArrowDown': 'duck'
};

// TODO: Couldn't this be inside a class?
function randomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

class Entity {
  constructor(position, speed, direction) {
    this.position = position;
    this.speed = speed;
    this.direction = direction;
    this.time = 0;
    this.width = 5;
    this.height = 5;
    this.hp = 1;
  }

  update(fps) {
    this.time += fps;
  }

  collisionRect() {
    return new Rectangle(this.position.x - this.width / 2,
      this.position.y - this.height / 2,
      this.width,
      this.height);
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
    this.time = 0;
  }

  update(fps) {
    super.update(fps);

    if (this.collisionRect().right() <= 0 ) {
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
          this.direction = new Vector2d(0, 1);
          if (this.position.y >= PLAYER_START_Y) {
            this.position.y = PLAYER_START_Y;
            this.direction = new Vector2d(0, 0);
            clearInterval(downInterval);
            this.jumping = false;
          }
        }, MIN_FPS);
      } else {
        this.direction = new Vector2d(0, -1);
      }
    }, MIN_FPS);
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
  }

  startAction(id, playerAction) {
    if (playerAction === undefined) {
      return;
    }

    const actions = {
      'jump': () => {
        if (game.getPlayer()) {
          game.player.jump();
        }
      },
      'duck': () => {
        if (game.getPlayer()) {
          game.player.duck(true);
        }
      }
    };

    // TODO: WTF is that?
    let f;
    if (f = actions[playerAction]) {
      f();
    }

    this.ongoingActions.push({identifier: id, playerAction: playerAction});
  }

  endAction(id) {
    // TODO: remove duplicated code
    const actions = {
      'duck': () => {
        if (game.getPlayer()) {
          game.getPlayer.duck(false);
        }
      }
    };

    let index = this.ongoingActions.findIndex(x => x.identifier === id);

    let f;
    if (index >= 0) {
      // TODO: WTF again?
      if (f = actions[this.ongoingActions[index].playerAction]) {
        f();
      }

      this.ongoingActions.splice(index, 1);
    }
  }
}

class Renderer {
  constructor() {
    this.canvas = document.querySelector('#game-layer');
    this.context = this.canvas.getContext('2d');
  }

  // TODO: remove the foreground color
  drawRectangle(color, entity) {
    this.context.fillStyle = color;
    this.context.fillRect(entity.position.x - entity.width / 2,
      entity.position.y - entity.height / 2,
      entity.width,
      entity.height);
  }

  render(fps) {
    this.context.fillStyle = '#fafafa';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const entity of game.getEntities()) {
      if (entity instanceof Enemy) {
        this.drawRectangle('red', entity);
      } else if (entity instanceof Player) {
        this.drawRectangle('blue', entity);
      }
    }
  }
}

class Physics {
  update(fps) {
    for (const entity of game.getEntities()) {
      let velocity = Vector2d.vectorScalarMultiply(entity.direction, entity.speed);
      entity.position = Vector2d.vectorAdd(entity.position,
        Vector2d.vectorScalarMultiply(velocity, fps));
    }

    // TODO: extract method?
    //if (player) {
      for (const enemy of game.getEnemies()) {
        if (enemy.collisionRect().intersects(game.getPlayer().collisionRect())) {
          game.setGameOver();
        }
      }
    //}

    if (game.getPlayer() && game.getPlayer().jumping) {

    }
  }
}

class Vector2d {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static vectorAdd(vector1, vector2) {
    return new Vector2d(vector1.x + vector2.x, vector1.y + vector2.y);
  }

  static vectorSubtract(vector1, vector2) {
    return new Vector2d(vector1.x - vector1.x, vector2.y - vector2.y);
  }

  static vectorScalarMultiply(vector, scalarValue) {
    return new Vector2d(vector.x * scalarValue, vector.y * scalarValue);
  }

  static vectorLength(vector) {
    return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
  }

  static vectorNormalize(vector) {
    const reciprocal = 1.0 / (this.vectorLength(vector) + Number.EPSILON);
    return this.vectorScalarMultiply(reciprocal);
  }
}

class Rectangle {
  constructor(x, y, width, height) {
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

  //TODO: It's really necessary?f
  static rectUnion(rectangle1, rectangle2) {
    if (rectangle1 === undefined) {
      return rectangle2;
    }

    if (rectangle2 === undefined) {
      return rectangle1;
    }

    const x = Math.min(rectangle1.x, rectangle2.x);
    const y = Math.min(rectangle1.y, rectangle2.y);
    const width = Math.max(rectangle1.right(), rectangle2.right() -
      Math.min(rectangle1.left(), rectangle2.left()));
    const height = Math.max(rectangle1.bottom, rectangle2.bottom() -
      Math.min(rectangle1.top(), rectangle2.top()));

    return new Rectangle(x, y, width, height);
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
    this.enemySpeed = 100;
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
    const fps = 1/60;

    // TODO: update the score here?
    //score++;

    //const fps = Math.min((newFps - this.lastFps) / 1000, MIN_FPS);
    //this.lastFps = time;

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
    window.requestAnimationFrame(() => this.update());
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

// TODO: wait for the player press space bar
game.start();
game.update();

document.body.addEventListener('keydown', keyboard.keyDown);
document.body.addEventListener('keyup', keyboard.keyUp);