import * as PIXI from 'pixi.js';
import store from '@/store/index.js';
import colorConfig from '@/utils/colorConfig.js';
import { thottle } from '@/utils/help.js';
import { isPC } from '@/utils/device.js';

const deviceIsPC = isPC();
const { params } = store.state.factory;
const floorPadding = 10;
const floorMargin = 20;

class Scene {
  constructor(el, warehouseInfo, events) {
    this.el = el;
    const { mapWidth, mapLength, spaceWidth, spaceLength } = warehouseInfo;
    // const { warehouseLayerNo } = warehouseInfo; // warehouseType
    this.mapWidth = mapLength * 10;
    this.mapLength = mapWidth * 10;
    this.spaceWidth = spaceLength * 10;
    this.spaceLength = spaceWidth * 10;
    this.events = events || {};
    this.app = null;
    this.building = {
      floors: {}, // 楼层
      buildingContainer: new PIXI.Container(), // 主容器
    };
    this.colorConfig = colorConfig;
    this.info = {
      spaceCount: 0, // 点位数量
      spaceMap: {}, // 储存点位信息
      spaceMapOfMark: {}, // 标红的点位信息
      spaceCountOfCharger: 0, // 充电桩数量
      containerCount: 0, // 货架数量
      robotCount: {
        sum: 0, // 总数
        'robotCountOf-1': 0, // 离线
        robotCountOf99: 0, // 有问题
        robotCountOf0: 0, // 空载
        robotCountOf1: 0, // 载货
        robotCountOf3: 0, // 充电
      }, // 机器人数量
      terminalCount: {
        sum: 0, // 总数
        terminalCountOf0: 0, // 离线
        terminalCountOf1: 0, // 工作
        terminalCountOf2: 0, // 暂停
      }, // 工作站数量
      robotMapOfError: {}, // 机器错误信息
    }; // 场景内容信息
    this.createScene(el); // 场景创建
    // loadTextures().then(res => {
    //   textures = res
    //   this.events.onSceneCreated && this.events.onSceneCreated()
    // })
  }

  resize() {
    this.el.style.display = 'none';
    setTimeout(() => {
      this.app.renderer.resize(this.el.parentElement.clientWidth, this.el.parentElement.clientHeight);
      this.el.style.display = 'block';
    }, 0);
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
    // TODO 暂时只创建1层楼
    const i = 0;
    this.building.floors[i] = {};
    const floor = this.building.floors[i];
    // 地板容器
    const floorContainer = new PIXI.Container();
    floorContainer.name = 'floorContainer';
    if (params.floorsDirection === 'row') {
      floorContainer.x = (this.mapWidth + floorPadding * 2 + floorMargin) * i;
      floorContainer.y = 0;
    } else {
      floorContainer.x = 0;
      floorContainer.y = (this.mapLength + floorPadding * 2 + floorMargin) * i;
    }
    this.building.buildingContainer.addChild(floorContainer);
    // 地板边框
    const floorBorder = new PIXI.Graphics();
    floorBorder.name = 'floorBorder';
    floorBorder.lineStyle(2, 0x000000, 1, 0.5, true);
    floorBorder.beginFill(this.colorConfig.floorBgColor);
    floorBorder.drawRect(0, 0, this.mapWidth + floorPadding * 2 + 20, this.mapLength + floorPadding * 2 + 20);
    floorBorder.endFill();
    floorContainer.addChild(floorBorder);
    // 点位容器1
    floor.spacesContainer = new PIXI.Container();
    floor.spacesContainer.name = 'spacesContainer';
    floor.spacesContainer.position.set(floorPadding, floorPadding);
    floorContainer.addChild(floor.spacesContainer);
    // 点位容器2
    floor.spacesContainer2 = new PIXI.Container();
    floor.spacesContainer2.name = 'spacesContainer2';
    floor.spacesContainer2.position.set(floorPadding, floorPadding);
    floorContainer.addChild(floor.spacesContainer2);
    // 点位标记容器
    floor.spacesContainerOfMarked = new PIXI.Container();
    floor.spacesContainerOfMarked.name = 'spacesContainerOfMarked';
    floor.spacesContainerOfMarked.position.set(floorPadding, floorPadding);
    floorContainer.addChild(floor.spacesContainerOfMarked);
    // 点位路径容器
    floor.spacesPathSprite = new PIXI.Graphics();
    floor.spacesPathSprite.lineStyle(1, this.colorConfig.spacesPathColor, 1, 0.5, true);
    floor.spacesPathSprite.name = 'spacesPathSprite';
    floor.spacesPathSprite.position.set(floorPadding, floorPadding);
    floor.spacesPathSprite.alpha = 0.3;
    floorContainer.addChild(floor.spacesPathSprite);
    // 工作站容器
    floor.terminalSprites = new PIXI.Container();
    floor.terminalSprites.name = 'terminalSprites';
    floor.terminalSprites.position.set(floorPadding, floorPadding);
    floorContainer.addChild(floor.terminalSprites);
    // 货架容器
    floor.containerSprites = new PIXI.Container();
    floor.containerSprites.name = 'containerSprites';
    floor.containerSprites.position.set(floorPadding, floorPadding);
    floorContainer.addChild(floor.containerSprites);
    // 标记容器
    floor.markerSprites = new PIXI.Container();
    floor.markerSprites.name = 'markerSprites';
    floor.markerSprites.position.set(floorPadding, floorPadding);
    floorContainer.addChild(floor.markerSprites);
    // 机器人容器
    floor.robotSprites = new PIXI.Container();
    floor.robotSprites.name = 'robotSprites';
    floor.robotSprites.position.set(floorPadding, floorPadding);
    floorContainer.addChild(floor.robotSprites);
    // 主容器
    const buildingContainer = this.building.buildingContainer;
    buildingContainer.x = Math.floor(this.app.screen.width / (devicePixelRatio * 2));
    buildingContainer.y = Math.floor(this.app.screen.height / (devicePixelRatio * 2));
    buildingContainer.pivot.x = Math.floor(buildingContainer.width / 2);
    buildingContainer.pivot.y = Math.floor(buildingContainer.height / 2);
    this.app.stage.addChild(buildingContainer);
    this.resize();
    window.addEventListener('resize', thottle(200, this.resize.bind(this)));
    // 浏览器 tab 页切换到后台时将机器的移动速度置为 0，即无动画
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        store.commit('SET_PARAMS', { key: 'moveSpeed', value: 0 });
      } else {
        store.commit('SET_PARAMS', { key: 'moveSpeed', value: 1.5 });
      }
    });
    this.domEvent();
  }

  destroy() {
    this.app.destroy();
    this.app = null;
    this.building = {
      floors: {}, // 楼层
      buildingContainer: new PIXI.Container(), // 主容器
    };
  }

  init(data) {
    const { spaces } = data; // terminals, robots, containers, containerDetail
    spaces && this.initSpaces(spaces);
    // terminals && this.initTerminals(terminals)
    // containers && this.initContainers(containers, containerDetail)
    // robots && this.initRobots(robots)
    // sprites.hoverBorder = createRect(this.spaceWidth, this.spaceLength, this.colorConfig.hoverBorderColor, 'hoverBorder')
    // sprites.fromBorder = createRect(this.spaceWidth, this.spaceLength, this.colorConfig.fromBorderColor, 'fromBorder')
    // sprites.toBorder = createRect(this.spaceWidth, this.spaceLength, this.colorConfig.toBorderColor, 'toBorder')
    // building.buildingSprite.addChild(sprites.hoverBorder, sprites.fromBorder, sprites.toBorder)
    // this.params.testStatus()
    return Promise.resolve(this.info);
  }

  initSpaces(spaces) {
    this.info.spaceCount = spaces.length;
    for (let i = 0; i < spaces.length; i++) {
      if (spaces[i].status === -9) i++; // 状态-9跳过
      const space = spaces[i];
      const { spaceId, posY, posX, posZ, type, status } = space;
      space.x = posY * 10;
      space.y = posX * 10;
      space.z = posZ || 0;
      const spacesIdLayer = new PIXI.Container();
      spacesIdLayer.width = this.spaceWidth;
      spacesIdLayer.height = this.spaceLength;
      spacesIdLayer.pivot.set(this.spaceWidth / 2, this.spaceLength / 2);
      spacesIdLayer.position.set(space.x, space.y);
      const spaceSprite = PIXI.Sprite.from('textures/space1.jpg');
      spaceSprite.width = this.spaceWidth;
      spaceSprite.height = this.spaceLength;
      spaceSprite.interactive = true;
      spacesIdLayer.addChild(spaceSprite);
      space.spaceSprite = spaceSprite;
      space.spacesIdLayer = spacesIdLayer;
      const floor = this.building.floors[space.z];
      const { spacesContainer, spacesContainerOfMarked } = floor;
      if (status === 1) {
        this.info.spaceMapOfMark[spaceId] = space;
        spaceSprite.tint = this.colorConfig.spaceColorMap['-1'];
        spacesContainerOfMarked.addChild(spacesIdLayer);
      } else {
        spaceSprite.tint = this.colorConfig.spaceColorMap[type];
        spacesContainer.addChild(spacesIdLayer);
      }
      this.info.spaceMap[spaceId] = space;
      if (type === 7) {
        // 统计充电桩数量
        this.info.spaceCountOfCharger += 1;
      }
      // TODO添加事件
      // if (deviceIsPC) {
      //   spaceSprite.on('mouseover', this.spaceMouseOver.bind(spaceSprite, space, this))
      //   spaceSprite.on('mouseout', this.spaceMouseOut.bind(spaceSprite, space, this))
      //   spaceSprite.on('click', this.spaceUp.bind(spaceSprite, space, this))
      //   spaceSprite.on('rightclick', this.spaceRightUp.bind(spaceSprite, space, this))
      // } else {
      //   spaceSprite.on('touchstart', this.spaceNoPCtoClick.bind(spaceSprite, space, this))
      // }
      // if (type === 1) { // 货架泊位
      //   this.spacesOfContainerSlot.push(space)
      // } else if (type === 6) { // 墙壁
      //   this.spacesOfInvalid.push(space)
      // } else if (type === 3 || type === 5) { // 等待位 & 插入位
      //   this.spacesOfWaiting.push(space)
      // }
      // const spacesIdLayer2 = new PIXI.Container();
    }
  }

  update(data) {
    const { spaces } = data; // terminals, robots, containers, containerDetail
    spaces && this.updateSpaces(spaces);
    // terminals && this.updateTerminals(terminals)
    // robots && this.updateRobots(robots)
    // this.updateContainers(containers, containerDetail)
    // this.doMove()
    return Promise.resolve(this.info);
  }

  updateSpaces(spaces) {
    const len = spaces.length;
    for (let i = 0; i < len; i++) {
      const { spaceId, status, type } = spaces[i];
      const oldSpace = this.info.spaceMap[spaceId];
      const { spaceSprite, spacesIdLayer, status: oldStatus, z } = oldSpace;
      const floor = this.building.floors[z];
      const { spacesContainer, spacesContainerOfMarked } = floor;
      if (status !== oldStatus) {
        if (status === 1) {
          // 状态变为1 地面标红
          spaceSprite.tint = this.colorConfig.spaceColorMap['-1'];
          spacesContainer.removeChild(spacesIdLayer);
          spacesContainerOfMarked.addChild(spacesIdLayer);
        } else {
          spaceSprite.tint = this.colorConfig.spaceColorMap[type];
          delete this.info.spaceMapOfMark[spaceId];
          spacesContainer.addChild(spacesIdLayer);
          spacesContainerOfMarked.removeChild(spacesIdLayer);
        }
        oldSpace.status = status;
      }
    }
  }

  // 绑定事件 拖动,点击,放大缩小等
  domEvent() {
    let preX;
    let preY;
    let mousedown = false;
    if (deviceIsPC) {
      this.el.addEventListener('mousedown', (e) => {
        mousedown = true;
        preX = e.x;
        preY = e.y;
      });
      this.el.addEventListener('mouseup', () => {
        mousedown = false;
      });
      this.el.addEventListener('mouseout', () => {
        mousedown = false;
      });
      this.el.addEventListener(
        'mousemove',
        (e) => {
          if (mousedown) {
            const currX = e.x;
            const currY = e.y;
            const offsetX = currX - preX;
            const offsetY = currY - preY;
            const buildingSprite = this.building.buildingContainer;
            const oldX = buildingSprite.position.x;
            const oldY = buildingSprite.position.y;
            buildingSprite.position.set(Math.round(oldX + offsetX), Math.round(oldY + offsetY));
            preX = currX;
            preY = currY;
          }
        },
        true,
      );
    } else {
      this.el.addEventListener('touchstart', (e) => {
        mousedown = true;
        preX = e.touches[0].clientX;
        preY = e.touches[0].clientY;
      });
      this.el.addEventListener('touchend', () => {
        mousedown = false;
      });
      this.el.addEventListener('mouseout', () => {
        mousedown = false;
      });
      this.el.addEventListener('touchmove', (e) => {
        if (mousedown) {
          const currX = e.touches[0].clientX;
          const currY = e.touches[0].clientY;
          const offsetX = currX - preX;
          const offsetY = currY - preY;
          const buildingSprite = this.building.buildingContainer;
          const oldX = buildingSprite.position.x;
          const oldY = buildingSprite.position.y;
          buildingSprite.position.set(Math.round(oldX + offsetX), Math.round(oldY + offsetY));
          preX = currX;
          preY = currY;
        }
      });
    }
    // 放大缩小
    this.el.addEventListener('mousewheel', (e) => {
      if (e.deltaY > 0) {
        this.zoom(0.1);
      } else {
        this.zoom(-0.1);
      }
    });
    // 禁止右键的默认操作
    this.el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  zoom(offset) {
    const buildingSprite = this.building.buildingContainer;
    if (offset) {
      const oldScale = +buildingSprite.scale.x;
      const toScale = (oldScale + offset).toFixed(2);
      if (offset > 0) {
        // 放大
        buildingSprite.scale.set(toScale);
      } else {
        // 缩小
        toScale < 0.1 ? buildingSprite.scale.set(0.1) : buildingSprite.scale.set(toScale);
      }
    } else {
      // 居中
      buildingSprite.x = Math.floor(this.app.screen.width / 2);
      buildingSprite.y = Math.floor(this.app.screen.height / 2);
      buildingSprite.scale.set(1);
    }
  }
}

export default Scene;
