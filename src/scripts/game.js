const FIELD_HEIGHT = 150;
const FIELD_WIDTH = 600;
const FPS = 1/60;

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

class Player extends Entity {
  constructor(position, speed, direction) {
    super(position, speed, direction);
    this.width = 44;
    this.height = 46;
  }

  update() {
    super.update();

    if (this.collisionRect().top() <= 0 ||
      this.collisionRect().bottom() >= game.getFieldRect().bottom() ) {
      this.direction.y *= -1;
    }
  }
}

class Enemy extends Entity {
  update() {
    super.update();

    // TODO: destroy itself
    if (this.collisionRect().top() <= 0 ||
      this.collisionRect().bottom() >= game.getFieldRect().bottom() ) {
      this.direction.y *= -1;
    }
  }
}

// TODO: create subclasse of enemy with different sizes

class Renderer {
  constructor() {
    this.canvas = document.querySelector('#game-layer');
    this.context = this.canvas.getContext('2d');
    this.render();
  }

  // TODO: replace color with image
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
  constructor() {
    this.update();
  }

  static update(fps) {
    for (const entity of game.getEntities()) {
      let velocity = Vector2d.vectorScalarMultiply(entity.direction, entity.speed);
      entity.position = Vector2d.vectorAdd(entity.position,
        Vector2d.vectorScalarMultiply(velocity, fps));
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
  static union(rectangle1, rectangle2) {
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

class Game {
  constructor() {
    this.fieldRect = new Rectangle(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    this.entities = [];
    this.enemies = [];
    this.player = undefined;
    this.started = false;
  }

  start() {
    this.addEntity(new Player(new Vector2d(20, 20), 25, new Vector2d(0, -1)));
    this.addEntity(new Enemy(new Vector2d(40,40), 20, new Vector2d(0, 1)));

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

  removeEntity(entity) {
    if (!entities) {
      return;
    }

    this.entities = this.entities.filter(x => !this.entities.includes(x));
    this.enemies = this.enemies.filter(x => !this.entities.includes(x));

    if (this.entities.includes(this.player)) {
      this.player = undefined;
    }
  }

  update() {
    const fps = FPS;
    Physics.update(fps);

    for (const entity of this.entities) {
      entity.update(fps);
    }

    renderer.render(fps);
    window.requestAnimationFrame(() => this.update());
  }

  //TODO: Can I convert it to full properties?
  getEntities() {
    return this.entities;
  }

  getFieldRect() {
    return this.fieldRect;
  }

  //TODO: I'ts really necessary?
  getEnemies() {
    return this.enemies;
  }

  getPlayer() {
    return this.player;
  }
}

const game = new Game();
const renderer = new Renderer();
game.start();
game.update();