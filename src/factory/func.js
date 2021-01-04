import * as PIXI from 'pixi.js';

function loadTextures() {
  return new Promise((resolve) => {
    const textures = {};
    const loader = new PIXI.Loader();
    loader
      .add('robot', 'textures/robot.svg')
      .add('lift', 'textures/lift.svg')
      .add('Manipulator', 'textures/Manipulator.png')
      .add('ConveyerBelt', 'textures/ConveyerBelt.png');
    loader.load((obj, resources) => {
      Object.keys(resources).forEach((key) => {
        textures[key] = resources[key].texture;
      });
      resolve(textures);
    });
  });
}

function createGraphics(w, h, c, n, isStroke = false, native = false, alpha = 1) {
  const graphics = new PIXI.Graphics();
  graphics.name = n;
  graphics.lineStyle(2, c, 1, 0.5, native);
  isStroke && graphics.beginFill(0xffffff);
  graphics.drawRect(0, 0, w, h);
  graphics.endFill();
  graphics.alpha = alpha;
  graphics.visible = false;
  return graphics;
}

function getMinAndSec(nowStamp, stamp) {
  const allSec = ~~((nowStamp - stamp) / 1000);
  let min, sec;
  if (allSec > 0) {
    min = Math.floor(allSec / 60);
    sec = allSec;
  } else {
    min = 0;
    sec = 0;
  }
  return { min, sec };
}

const confContainer = {
  typeColorsMap: {
    0: 0x343434,
    1: 0x63a9ff,
    2: 0x0054ff,
    3: 0x425489,
    4: 0x91c300,
    5: 0x007f09,
    6: 0x009392,
    7: 0xf3b706,
    8: 0xfb7b13,
    9: 0xaf7a45,
    10: 0x753f33,
    11: 0xe33131,
    12: 0xae0066,
    13: 0xea65a4,
    14: 0xbd50eb,
    15: 0x7738de,
    16: 0x69167d,
  },
  maxHot: 30, // 货架热度上限值（越小越红；越大越蓝）
  color: {
    red: {
      r: 1,
      g: 0,
      b: 0.4,
    },
    blue: {
      r: 0,
      g: 0.4,
      b: 1,
    },
  },
};

function calcShapeColorByFrquence(freq) {
  const {
    maxHot,
    color: { red, blue },
  } = confContainer;
  freq = freq > maxHot ? maxHot : freq;
  const rRange = Math.abs(red.r - blue.r);
  const gRange = Math.abs(red.g - blue.g);
  const bRange = Math.abs(red.b - blue.b);
  const r = (rRange * freq) / maxHot;
  const g = blue.g - (gRange * freq) / maxHot;
  const b = blue.b - (bRange * freq) / maxHot;
  return PIXI.utils.rgb2hex([r, g, b]);
}

function calcShapeColorByType(type) {
  return confContainer.typeColorsMap[type];
}

export { loadTextures, createGraphics, calcShapeColorByFrquence, calcShapeColorByType, getMinAndSec };
