import * as PIXI from 'pixi.js';

// function loadTextures () {
//   return new Promise((resolve, reject) => {
//     const textures = {}
//     const loader = new PIXI.Loader()
//     loader
//       .add('robot', 'textures/robot.svg')
//       .add('lift', 'textures/lift.svg')
//       .add('Manipulator', 'textures/Manipulator.png')
//       .add('ConveyerBelt', 'textures/ConveyerBelt.png')

//     loader.load((loader, resources) => {
//       for (let key in resources) {
//         textures[key] = resources[key].texture
//       }
//       resolve(textures)
//     })
//   })
// }

class Scene {
  constructor(el, warehouseInfo, events) {
    this.el = el;
    this.warehouseConf = warehouseInfo;
    // const { mapWidth, mapLength, spaceWidth, spaceLength, warehouseLayerNo, warehouseType } = warehouseConf;const { mapWidth, mapLength, spaceWidth, spaceLength, warehouseLayerNo, warehouseType } = warehouseConf;
    // this.mapWidth = mapLength * 10;
    // this.mapLength = mapWidth * 10;
    // this.spaceWidth = spaceLength * 10;
    // this.spaceLength = spaceWidth * 10;
    // const floors = (warehouseLayerNo || '0').trim().split(' ');
    // this.events = events || {};
    // this.app = null;

    // this.createScene(el);

    // loadTextures().then(res => {
    //   textures = res
    //   this.events.onSceneCreated && this.events.onSceneCreated()
    // })
  }

  createScene(el) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.app = new PIXI.Application({
      view: el,
      width: el.parentElement.clientWidth * devicePixelRatio,
      height: el.parentElement.clientHeight * devicePixelRatio,
      transparent: true,
      resolution: devicePixelRatio,
    });
    PIXI.settings.ROUND_PIXELS = true;
    this.app.renderer.autoResize = true;
    this.app.renderer.plugins.interaction.moveWhenInside = true;
    // 创建每层楼
    let i = 0;

  }
}

export default Scene;
