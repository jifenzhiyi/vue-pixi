import * as PIXI from 'pixi.js';
import store from '@/store/index.js';
import storage from '@/utils/storage';
import { isPC } from '@/utils/device.js';
import { createGraphics, loadTextures, getMinAndSec, calcShapeColorByFrquence, calcShapeColorByType } from './func.js';
import sound from './sound';

const deviceIsPC = isPC();
const floorPadding = 10, floorMargin = 20;
let noPCflag = true, floorSelect = false;
const { params } = store.state.factory;
const sprites = { rect: null };
const spacesContainerNew = []; // 点位容器（存储移动的路径）
const TweenMax = window.gsap; // 在index.html中引入了gsap.min.js
let nowStamp, app, building;
const spaceSelectArr = [];
let ismousedown = false;

function createDefaultGraphics(name, bgColor, width, height, visible = true, w = 2, color = 0x000000) {
  const graphics = new PIXI.Graphics();
  graphics.name = name;
  graphics.lineStyle(w, color, 1, 0.5, true);
  graphics.beginFill(bgColor);
  graphics.drawRect(0, 0, width, height);
  graphics.endFill();
  graphics.visible = visible;
  return graphics;
}

export default class Scene {
  constructor(el, warehouseConf, events, spaceInfoBox, equipments = []) {
    this.el = el;
    this.events = events || {};
    this.spaceInfoBox = spaceInfoBox;
    const { mapWidth, mapLength, spaceWidth, spaceLength, warehouseLayerNo } = warehouseConf; // warehouseType
    building = {
      floors: {},
    };
    building.buildingSprite = new PIXI.Container();
    const floors = (warehouseLayerNo || '0').trim().split(' ');
    floors.forEach((floorIndex) => {
      building.floors[floorIndex] = { visible: true };
    });
    this.floors = floors;
    this.mapWidth = mapLength * 10;
    this.mapLength = mapWidth * 10;
    this.spaceWidth = spaceLength * 10;
    this.spaceLength = spaceWidth * 10;
    this.colorConfig = store.state.colorConfig;
    this.info = {}; // 场景内容信息
    this.spacesOfContainerSlot = []; // 货架泊位
    this.spacesOfInvalid = []; // 无效位置
    this.spacesOfWaiting = []; // 等待位
    this.waitingMoveList = []; // 等待移动的列表
    this.selectedContainers = {}; // 选中的货架
    this.createScene(el); // 场景创建
    loadTextures(equipments).then((res) => {
      this.textures = res;
      this.events.onInitWS && this.events.onInitWS();
      this.events.onMarkerList && this.events.onMarkerList();
      this.events.onDimensionList && this.events.onDimensionList();
    });
  }

  // 数据初始化
  initReset() {
    this.info = {
      floorsCount: this.floors.length,
      spaceCount: 0, // 点位数量
      spaceMap: new Map(), // 储存点位信息
      spaceMapOfMark: new Map(), // 标红的点位信息
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
      chargerMap: {}, // 充电桩信息
      terminalMap: {}, // 工作站信息
      containerMap: {}, // 货架信息
    };
    sprites.hoverBorder = createGraphics(
      this.spaceWidth,
      this.spaceLength,
      this.colorConfig.hoverBorderColor,
      'hoverBorder',
    );
    sprites.fromBorder = createGraphics(
      this.spaceWidth,
      this.spaceLength,
      this.colorConfig.fromBorderColor,
      'fromBorder',
    );
    sprites.toBorder = createGraphics(
      this.spaceWidth, 
      this.spaceLength,
      this.colorConfig.toBorderColor,
      'toBorder',
    );
    building.buildingSprite.addChild(sprites.hoverBorder, sprites.fromBorder, sprites.toBorder);
  }

  createDefaultContainer(name, floorIndex, x = floorPadding, y = floorPadding) {
    const container = new PIXI.Container();
    container.name = name;
    container.position.set(x, y);
    const floor = building.floors[floorIndex];
    floor[name] = container;
    return container;
  }

  createSpaceContainer(name, x, y, width = this.spaceWidth, height = this.spaceLength) {
    const container = new PIXI.Container();
    container.name = name;
    container.width = width;
    container.height = height;
    container.pivot.set(width / 2, height / 2);
    container.position.set(x, y);
    return container;
  }

  createScene(el) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    app = new PIXI.Application({
      view: el,
      width: el.parentElement.clientWidth * devicePixelRatio,
      height: el.parentElement.clientHeight * devicePixelRatio,
      transparent: true,
      resolution: devicePixelRatio,
      powerPreference: 'high-performance',
    });
    PIXI.settings.ROUND_PIXELS = true;
    app.renderer.autoResize = true;
    app.renderer.plugins.interaction.moveWhenInside = true;
    let i = 0;
    Object.keys(building.floors).forEach((floorIndex) => {
      const floor = building.floors[floorIndex];
      const floorSprite = new PIXI.Container();
      floorSprite.name = 'floorSprite';
      if (params.floorDirection === 'Horizontal') {
        floorSprite.x = (this.mapWidth + floorPadding * 2 + floorMargin) * i;
        floorSprite.y = 0;
      } else {
        floorSprite.x = 0;
        floorSprite.y = (this.mapLength + floorPadding * 2 + floorMargin) * i;
      }
      floor.floorSprite = floorSprite;
      building.buildingSprite.addChild(floorSprite);
      // 地图边框
      const floorBgColor = this.colorConfig.floorBgColor;
      const floorBorderW = this.mapWidth + floorPadding * 2;
      const floorBorderH = this.mapLength + floorPadding * 2;
      const floorBorder = createDefaultGraphics('floorBorder', floorBgColor, floorBorderW, floorBorderH);
      floorSprite.addChild(floorBorder);
      floor.floorBorder = floorBorder;
      // 空间容器1
      floorSprite.addChild(this.createDefaultContainer('spacesContainer', floorIndex));
      // 空间容器2
      floorSprite.addChild(this.createDefaultContainer('spacesContainer2', floorIndex));
      // 空间标记容器
      floorSprite.addChild(this.createDefaultContainer('spacesContainerOfMarked', floorIndex));
      // 工作站容器
      floorSprite.addChild(this.createDefaultContainer('terminalSprites', floorIndex));
      // 货架容器
      floorSprite.addChild(this.createDefaultContainer('containerSprites', floorIndex));
      // 标记容器
      floorSprite.addChild(this.createDefaultContainer('markerSprites', floorIndex));
      // 机器人容器
      floorSprite.addChild(this.createDefaultContainer('robotSprites', floorIndex));
      // other
      floorSprite.addChild(this.createDefaultContainer('other', floorIndex));
      // 初始化图案
      const containerSelector = new PIXI.Graphics();
      containerSelector.name = 'containerSelector';
      containerSelector.beginFill(0xff0000, 0.1);
      containerSelector.drawRect(0, 0, 1, 1); // 初始图案必须占用有效像素，否则不会被添加到场景当中
      containerSelector.endFill();
      containerSelector.visible = false;
      floorSprite.addChild(containerSelector);
      floor.containerSelector = containerSelector;
      // 空间路径
      const spacesPathSprite = new PIXI.Graphics();
      spacesPathSprite.lineStyle(1, this.colorConfig.spacesPathColor, 1, 0.5, true);
      spacesPathSprite.name = 'spacesPathSprite';
      spacesPathSprite.position.set(floorPadding, floorPadding);
      spacesPathSprite.alpha = 0.3;
      spacesPathSprite.visible = params.showLinks;
      floorSprite.addChild(spacesPathSprite);
      floor.spacesPathSprite = spacesPathSprite;
      this.floorSpriteEvent(floorSprite, containerSelector, floorIndex);

      i++;
    });

    const buildingSprite = building.buildingSprite;
    buildingSprite.x = Math.floor(app.screen.width / (devicePixelRatio * 2));
    buildingSprite.y = Math.floor(app.screen.height / (devicePixelRatio * 2));
    buildingSprite.pivot.x = Math.floor(buildingSprite.width / 2);
    buildingSprite.pivot.y = Math.floor(buildingSprite.height / 2);
    app.stage.addChild(buildingSprite);

    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    // 浏览器 tab 页切换到后台时将机器的移动速度置为 0，即无动画
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        store.commit('SET_MOVE_SPEED', 0);
      } else {
        store.commit('SET_MOVE_SPEED', storage.get('scada_moveSpeed') || 1.5);
      }
    });
    this.domEvent();
  }

  resize() {
    setTimeout(() => {
      this.el.style.display = 'none';
      app && app.renderer.resize(this.el.parentElement.clientWidth, this.el.parentElement.clientHeight);
      this.el.style.display = 'block';
    }, 0);
  }

  domEvent() {
    let preX;
    let preY;
    if (deviceIsPC) {
      this.el.onmousedown = (e) => {
        ismousedown = true;
        preX = e.x;
        preY = e.y;
        this.el.onmouseup = () => {
          ismousedown = false;
        };
        this.el.onmouseout = () => {
          ismousedown = false;
        };
      };
      this.el.onmousemove = (ev) => {
        if (store.state.modeStatus === 'batch' && floorSelect) return;
        if (ismousedown) {
          const offsetX = ev.x - preX;
          const offsetY = ev.y - preY;
          const buildingSprite = building.buildingSprite;
          const oldX = Math.round(buildingSprite.position.x + offsetX);
          const oldY = Math.round(buildingSprite.position.y + offsetY);
          buildingSprite.position.set(oldX, oldY);
          preX = ev.x;
          preY = ev.y;
        }
      };
    } else {
      this.el.addEventListener('touchstart', (e) => {
        ismousedown = true;
        preX = e.touches[0].clientX;
        preY = e.touches[0].clientY;
      });
      this.el.addEventListener('touchend', () => {
        ismousedown = false;
      });
      this.el.addEventListener('touchmove', (e) => {
        if (store.state.modeStatus === 'batch' && floorSelect) return;
        if (ismousedown) {
          const currX = e.touches[0].clientX;
          const currY = e.touches[0].clientY;
          const offsetX = currX - preX;
          const offsetY = currY - preY;
          const buildingSprite = building.buildingSprite;
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
    // 火狐浏览器
    document.addEventListener('DOMMouseScroll', (e) => {
      if (e.detail > 0) {
        this.zoom(0.1);
      } else {
        this.zoom(-0.1);
      }
    });
    // 禁止右键的默认操作
    this.el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    const sceneW = this.el.parentElement.clientWidth;
    const sceneH = this.el.parentElement.clientHeight;
    console.log('floors length', this.floors.length);
    if (this.floors.length === 1) {
      console.log('sceneW', sceneW, 'sceneH', sceneH, 'mapWidth', this.mapWidth, 'mapLength', this.mapLength);
      if (sceneW > sceneH && sceneW > this.mapWidth) {
        const biliw = (sceneW / this.mapWidth).toFixed(1);
        biliw > 1.6 && this.zoom((biliw - 0.6) / 2);
      } else if (sceneH > sceneW && sceneH > this.mapLength) {
        const bilih = (sceneH / this.mapLength).toFixed(1);
        bilih > 1.6 && this.zoom((bilih - 0.6) / 2);
      }
    }
  }

  zoom(offset) {
    const buildingSprite = building.buildingSprite;
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
      buildingSprite.x = Math.floor(app.screen.width / 2);
      buildingSprite.y = Math.floor(app.screen.height / 2);
      buildingSprite.scale.set(1);
    }
  }

  floorSpriteEvent(floorSprite, containerSelector) {
    let p1 = null;
    let p2 = null;
    if (deviceIsPC) {
      floorSprite.cursor = 'crosshair';
      floorSprite.on('mousedown', (e) => {
        floorSelect = true;
        p1 = e.data.getLocalPosition(floorSprite);
        containerSelector.position.set(p1.x, p1.y);
        containerSelector.width = 0;
        containerSelector.height = 0;
        containerSelector.visible = true;
      });
      floorSprite.on('mousemove', (e) => {
        if (floorSelect) {
          p2 = e.data.getLocalPosition(floorSprite);
          containerSelector.width = p2.x - p1.x;
          containerSelector.height = p2.y - p1.y;
        }
      });
      floorSprite.on('mouseup', () => {
        floorSelect = false;
        Object.keys(this.info.containerMap).forEach((containerId) => {
          const { type, zoneId, containerContainer } = this.info.containerMap[containerId];
          const containerPosition = containerContainer.getGlobalPosition();
          if (containerSelector.containsPoint(containerPosition)) {
            if (this.selectedContainers[containerId]) {
              // 存在则移除，取消高亮
              containerContainer.getChildAt(2).visible = false;
              delete this.selectedContainers[containerId];
            } else {
              // 不存在则添加，高亮
              this.selectedContainers[containerId] = { containerId, type, zoneId };
              containerContainer.getChildAt(2).visible = true;
            }
          }
        });
        containerSelector.visible = false;
        this.events.onBatchConfirm && this.events.onBatchConfirm(this.selectedContainers);
      });
    } else {
      floorSprite.on('touchstart', (e) => {
        floorSelect = true;
        p1 = e.data.getLocalPosition(floorSprite);
        containerSelector.position.set(p1.x, p1.y);
        containerSelector.width = 0;
        containerSelector.height = 0;
        containerSelector.visible = true;
      });
      floorSprite.on('touchmove', (e) => {
        if (floorSelect) {
          p2 = e.data.getLocalPosition(floorSprite);
          containerSelector.width = p2.x - p1.x;
          containerSelector.height = p2.y - p1.y;
        }
      });
      floorSprite.on('touchend', () => {
        floorSelect = false;
        
        Object.keys(this.info.containerMap).forEach((containerId) => {
          const { type, zoneId, containerContainer } = this.info.containerMap[containerId];
          const containerPosition = containerContainer.getGlobalPosition();
          if (containerSelector.containsPoint(containerPosition)) {
            if (this.selectedContainers[containerId]) {
              // 存在则移除，取消高亮
              containerContainer.getChildAt(2).visible = false;
              delete this.selectedContainers[containerId];
            } else {
              // 不存在则添加，高亮
              this.selectedContainers[containerId] = { containerId, type, zoneId };
              containerContainer.getChildAt(2).visible = true;
            }
          }
        });
        containerSelector.visible = false;
        this.events.onBatchConfirm && this.events.onBatchConfirm(this.selectedContainers);
      });
    }
  }

  init(data) {
    this.initReset();
    nowStamp = +new Date();
    const { spaces, terminals, robots, containers } = data;
    spaces && this.initSpaces(spaces);
    terminals && this.initTerminals(terminals);
    containers && this.initContainers(containers);
    robots && this.initRobots(robots);
    return Promise.resolve(this.info);
  }

  initSpaces(spaces) {
    const len = spaces.length;
    this.info.spaceCount = len;
    for (let i = 0; i < len; i++) {
      const space = spaces[i];
      const { spaceId, posY, posX, posZ, type, status } = space;
      space.x = posY * 10;
      space.y = posX * 10;
      space.z = posZ || 0;
      this.info.spaceMap.set(spaceId, space);
      const spacesIdLayer = this.createSpaceContainer('spacesIdLayer', space.x, space.y);
      spacesIdLayer.name = spaceId;
      const spacesIdLayer2 = this.createSpaceContainer('spacesIdLayer', space.x, space.y);
      spacesIdLayer2.name = spaceId;
      const spaceSprite = PIXI.Sprite.from('textures/space1.jpg');
      const spaceSprite2 = PIXI.Sprite.from('textures/space1.png');
      if (type === 1) {
        // 货架泊位
        this.spacesOfContainerSlot.push(space);
      } else if (type === 3 || type === 5) {
        // 等待位 & 插入位
        this.spacesOfWaiting.push(space);
      } else if (type === 6) {
        // 墙壁, 无效位置
        this.spacesOfInvalid.push(space);
      } else if (type === 7) {
        // 统计充电桩数量
        this.info.spaceCountOfCharger += 1;
        // TODO 存储充电桩位置
        this.info.chargerMap[spaceId] = space;
      }
      const floor = building.floors[space.z];
      const { spacesContainer, spacesContainer2, spacesContainerOfMarked } = floor;
      spaceSprite.width = this.spaceWidth;
      spaceSprite.height = this.spaceLength;
      spaceSprite2.width = this.spaceWidth;
      spaceSprite2.height = this.spaceLength;
      // TODO添加事件
      spaceSprite.interactive = true;
      if (deviceIsPC) {
        // 添加事件
        spaceSprite.on('mouseover', this.spaceMouseOver.bind(spaceSprite, space, this));
        spaceSprite.on('mouseout', this.spaceMouseOut.bind(spaceSprite, this));
        spaceSprite.on('click', this.spaceUp.bind(spaceSprite, space, this));
        spaceSprite.on('rightclick', this.spaceRightUp.bind(spaceSprite, space, this));
      } else {
        spaceSprite.on('touchend', this.spaceNoPCtoClick.bind(spaceSprite, space, this));
      }
      space.spaceSprite = spaceSprite;
      space.spacesIdLayer = spacesIdLayer;
      spacesIdLayer.addChild(spaceSprite);
      spacesIdLayer2.addChild(spaceSprite2);
      spacesContainerNew.push(spacesIdLayer2);
      if (status !== 1) { // 不标红
        spaceSprite.tint = this.colorConfig.spaceColorMap[type];
        spaceSprite2.tint = this.colorConfig.spaceColorMap[type];
        spacesContainer.addChild(spacesIdLayer);
        spacesContainer2.addChild(spacesIdLayer2);
      } else { // 标红
        this.info.spaceMapOfMark.set(spaceId, space);
        spaceSprite.tint = this.colorConfig.spaceColorMap['-1'];
        spaceSprite2.tint = this.colorConfig.spaceColorMap['-1'];
        spacesContainerOfMarked.addChild(spacesIdLayer);
      }
    }
    for (let i = 0; i < spaces.length; i++) {
      const { x, y, z, linkId } = spaces[i];
      if (linkId) {
        const spacesPathSprite = building.floors[z].spacesPathSprite;
        const linkIds = linkId.trim().split(' ');
        linkIds.forEach((toId) => {
          const { x: x1, y: y1 } = this.info.spaceMap.get(toId);
          spacesPathSprite.moveTo(x, y);
          spacesPathSprite.lineTo((x + x1) / 2, (y + y1) / 2);
        });
      }
    }
  }

  spaceNoPCtoClick(space, $root) {
    if (noPCflag) {
      $root.spaceUp(space, $root);
    } else {
      $root.spaceRightUp(space, $root);
    }
  }

  spaceRightUp(space, $root) {
    const modeStatus = store.state.modeStatus;
    if (modeStatus === 'edit') {
      if (!spaceSelectArr[0] || spaceSelectArr[0] === space.spaceId || spaceSelectArr[1] === space.spaceId) {
        sprites.toBorder.visible = false;
        spaceSelectArr[1] = null;
        $root.events.onSelectTo && $root.events.onSelectTo({});
        return;
      }
      noPCflag = true;
      const { spaceId, containerId, robotId, terminalId, x, y, z, posX, posY } = space;
      sprites.toBorder.setParent(building.floors[z].other);
      sprites.toBorder.position.set(x, y);
      sprites.toBorder.visible = true;
      spaceSelectArr[1] = spaceId;

      $root.events.onSelectTo && $root.events.onSelectTo({ spaceId, containerId, robotId, terminalId, x, y, z, posX, posY });
    }
  }

  spaceUp(space, $root) {
    const modeStatus = store.state.modeStatus;
    const { spaceId, containerId, robotId, terminalId, x, y, z, posX, posY } = space;
    if (modeStatus === 'edit') {
      if (spaceSelectArr[0] === spaceId) {
        sprites.fromBorder.visible = false;
        spaceSelectArr[0] = null;
        $root.events.onSelectFrom && $root.events.onSelectFrom({});
        $root.spaceRightUp(null, $root);
        return;
      }
      noPCflag = false;
      spaceSelectArr[1] === spaceId && $root.spaceRightUp(space, $root);
      sprites.fromBorder.setParent(building.floors[z].other);
      sprites.fromBorder.position.set(x, y);
      sprites.fromBorder.visible = true;
      spaceSelectArr[0] = spaceId;
      $root.events.onSelectFrom && $root.events.onSelectFrom({ spaceId, containerId, robotId, terminalId, x, y, z, posX, posY });
    }
    if (modeStatus === 'mark') {
      $root.events.onMarkSpace && $root.events.onMarkSpace(space);
    }
    if (modeStatus === 'batch') {
      if (!containerId) return;
      const container = $root.info.containerMap[containerId];
      const { containerContainer, type, zoneId } = container;
      if ($root.selectedContainers[containerId]) {
        // 存在则移除，取消高亮
        containerContainer.getChildAt(2).visible = false;
        delete $root.selectedContainers[containerId];
      } else {
        // 不存在则添加，高亮
        $root.selectedContainers[containerId] = { containerId, type, zoneId };
        containerContainer.getChildAt(2).visible = true;
      }
    }
  }

  spaceMouseOver(space, $root) {
    $root.showInfoTimer && clearTimeout($root.showInfoTimer);
    const { spaceId, terminalId, robotId, containerId, robotStatus, posX, posY, posZ, x, y, z, spaceSprite } = space;
    const status = robotStatus || 0;
    sprites.hoverBorder.setParent(building.floors[z].other);
    sprites.hoverBorder.position.set(x, y);
    sprites.hoverBorder.visible = true;
    // 200ms内光标所在的space不变化才显示space信息
    $root.showInfoTimer = setTimeout(() => {
      const config = {
        posX,
        posY,
        posZ,
        spaceId: spaceId || '-',
        robotId: robotId || '-',
        robotErr: status <= 10 ? '' : `e${status - 10}`,
        containerId: containerId || '-',
        terminalId: terminalId || '-',
      };
      store.commit('SET_CONFIG_ALL', config);
      // e && $root.showLinkedLater(); // 特殊操作
      const { x: left, y: top } = spaceSprite.getGlobalPosition();
      const { width, height } = spaceSprite.getBounds();
      $root.spaceInfoBox.style.left = `${left + width * 0.6}px`;
      $root.spaceInfoBox.style.top = `${top - height * 0.6}px`;
      $root.spaceInfoBox.style.display = 'block';
    }, 200);
  }

  spaceMouseOut($root) {
    sprites.hoverBorder.visible = false;
    $root.showInfoTimer && clearTimeout($root.showInfoTimer);
    $root.spaceInfoBox.style.display = 'none';
    store.commit('CONFIG_RESET');
  }

  initTerminals(terminals) {
    this.info.terminalCount.sum = terminals.length;
    for (let i = 0; i < terminals.length; i++) {
      if (terminals[i].status === -1) continue;
      const terminal = terminals[i];
      const { terminalId, spaceId, status } = terminal;
      const space = this.info.spaceMap.get(spaceId);
      if (!space) continue; // 货架对应的space不存在
      this.info.terminalCount[`terminalCountOf${status}`]++;
      const { posX, posY, posZ, x, y, z } = space;
      space.terminalId = terminalId; // 记录点位存在工作站Id
      if (posZ !== 0) continue;
      const terminalContainer = new PIXI.Container();
      // 0, terminal 本体
      const terminalSprite = PIXI.Sprite.from('textures/space1.jpg');
      terminalSprite.tint = this.colorConfig.terminalColorMap[status];
      terminalSprite.width = this.spaceWidth;
      terminalSprite.height = this.spaceLength;
      terminalSprite.anchor.set(0.5);
      terminalContainer.position.set(x, y);
      terminalContainer.addChild(terminalSprite);
      building.floors[z].terminalSprites.addChild(terminalContainer);
      // 工作站列表， 给右侧栏使用
      this.info.terminalMap[terminalId] = { terminalId, spaceId, posX, posY, posZ, status, terminalContainer };
    }
  }

  initContainers(containers) {
    let validLen = 0;
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      const { spaceId, status, containerId } = container;
      if (status === -9 || !spaceId) continue;
      const space = this.info.spaceMap.get(spaceId);
      space.containerId = containerId; // 记录点位存在货架Id
      const one = this.createContainer(container);
      building.floors[0].containerSprites.addChild(one);
      validLen++;
    }
    this.info.containerCount = validLen;
  }

  createContainer(container) {
    const { containerId, spaceId, frequence, orientation, type } = container;
    const space = this.info.spaceMap.get(spaceId);
    const { x, y } = space;
    const containerContainer = new PIXI.Container();
    // 0, 本体
    const containerSprite = PIXI.Sprite.from('textures/container.png');
    params.showContainersType === 'type' && (containerSprite.tint = calcShapeColorByType(type));
    params.showContainersType === 'frequence' && (containerSprite.tint = calcShapeColorByFrquence(frequence));
    containerContainer.position.set(x, y);
    const { width, length } = this.containerTypeMap[type];
    containerSprite.width = width;
    containerSprite.height = length;
    containerSprite.anchor.set(0.5);
    orientation && (containerSprite.rotation = (orientation * Math.PI) / 2);
    containerContainer.addChild(containerSprite);
    // 1, 高亮边框
    containerContainer.addChild(createGraphics(this.spaceWidth, this.spaceLength, 0x0000ff));
    // 2, 高亮框选选中
    const Grap = createGraphics(this.spaceWidth, this.spaceLength, 0x00ffff, 'selectContainer', false, false, 0.3);
    // Grap.pivot.set(this.spaceWidth / 2, this.spaceLength / 2);
    containerContainer.addChild(Grap);
    // 3, containerId
    const idSprite = new PIXI.Text(containerId, this.colorConfig.containerIdStyle);
    idSprite.anchor.set(0.5);
    idSprite.scale.set(0.2);
    idSprite.visible = params.showContainerId;
    containerContainer.addChild(idSprite);
    container.containerContainer = containerContainer;
    // this.info.containerMap.set(containerId, container);
    this.info.containerMap[containerId] = container;
    // if (!['N', undefined, 'T-virtual'].includes(terminalId)) {
    //   console.log('error includes 1')
    //   this.pendingContainerMap[containerId] = container
    // }
    return containerContainer;
  }

  updateContainersType(containerTypeMap) {
    this.containerTypeMap = containerTypeMap;
  }

  initRobots(robots) {
    this.info.robotCount.sum = robots.length;
    this.info.robotMap = {};
    for (let i = 0; i < robots.length; i++) {
      if (robots[i] === -9) {
        this.info.robotCount.sum--;
        continue;
      }
      const robot = robots[i];
      const { robotId, spaceId, endId: endIdNew, orientation, status } = robot;
      const space = this.info.spaceMap.get(spaceId);
      if (!space) continue;
      const endIdList = endIdNew ? endIdNew.split(',') : [];
      const endId = endIdList[0]; // endId 第一个坐标点
      const { posX, posY, posZ, x, y, z } = space;
      space.robotId = robotId; // 记录点位存在机器人Id
      space.robotStatus = status; // 记录点位存在机器人Id
      robot.posX = posX;
      robot.posY = posY;
      robot.posZ = posZ;
      const robotContainer = new PIXI.Container();
      const robotSprites = building.floors[z].robotSprites;
      robotSprites.addChild(robotContainer);
      // 0, 路径
      const endSpace = this.info.spaceMap.get(endId);
      const { x: endX, y: endY } = endSpace;
      const robotPath = new PIXI.Graphics();
      robotPath.visible = params.showRobotsPath;
      robotPath.lineStyle(1.5, 0x0000ff, 1);
      robotPath.moveTo(0, 0);
      robotPath.lineTo(endX - x, endY - y);
      robotContainer.addChild(robotPath);
      // 1, 本体
      const isRobot = robotId.startsWith('R');
      const robotSprite = new PIXI.Sprite(isRobot ? this.textures.robot : this.textures.lift);
      robotContainer.position.set(x, y);
      robotSprite.width = isRobot ? 6 : 12;
      robotSprite.height = isRobot ? 6 : 12;
      robotSprite.anchor.set(0.5);
      orientation && (robotSprite.rotation = (-orientation * Math.PI) / 180);
      robotContainer.addChild(robotSprite);
      robotSprite.oldScale = robotSprite.scale.x;
      // 2, id
      const idSprite = new PIXI.Text(robotId, this.colorConfig.robotIdStyle);
      idSprite.anchor.set(0.5, 1.2);
      idSprite.scale.set(0.5);
      idSprite.visible = params.showRobotsId;
      robotContainer.addChild(idSprite);
      // 3, errorTextBox
      const errorTextBox = PIXI.Sprite.from('textures/errorTextBox.png');
      errorTextBox.tint = 0xff0000;
      errorTextBox.alpha = 0.8;
      errorTextBox.anchor.set(0, 0.5);
      errorTextBox.position.x = 5;
      errorTextBox.visible = false;
      robotContainer.addChild(errorTextBox);
      // 4, errorText
      const errorText = new PIXI.Text('', this.colorConfig.errorTextStyle);
      errorText.anchor.set(0, 0.5);
      errorText.scale.set(0.3);
      errorText.position.x = 6;
      errorText.visible = false;
      robotContainer.addChild(errorText);
      // 错误信息显示
      if (endId !== undefined && endId !== spaceId && params.showRobotError) {
        this.errorMessageDisplay(robot, robotContainer);
      }
      // other
      robotSprite.calculateBounds();
      robot.robotContainer = robotContainer;
      // 机器列表，给右侧栏用
      this.info.robotMap[robotId] = robot;
      // 设置机器颜色、错误代码
      this.setRobotState(robot);
    }
  }

  errorMessageDisplay(robot, robotContainer) {
    const { lastUpdateTimeStamp, robotId } = robot;
    const [, , , errorTextBox, errorText] = robotContainer.children;
    const { min, sec } = getMinAndSec(nowStamp, lastUpdateTimeStamp);
    if (sec > params.RobotTimeout) {
      robotContainer.overtime = min;
      robot.status > 10
        ? (errorText.text = `${robotId}, e${robot.status - 10}, ${robotContainer.overtime}min`)
        : (errorText.text = `${robotId}, ${robotContainer.overtime}min`);
      this.info.robotMapOfError[robotId] = errorText.text;
      errorTextBox.width = errorText.width + 2;
      errorTextBox.visible = true;
      errorText.visible = true;
      robotContainer.loop = setInterval(() => {
        ++robotContainer.overtime;
        robot.status > 10
          ? (errorText.text = `${robotId}, e${robot.status - 10}, ${robotContainer.overtime}min`)
          : (errorText.text = `${robotId}, ${robotContainer.overtime}min`);
        this.info.robotMapOfError[robotId] = errorText.text;
        errorTextBox.width = errorText.width + 2;
      }, 60 * 1000);
    } else {
      robotContainer.loop = setTimeout(() => {
        robotContainer.overtime = Math.floor(params.RobotTimeout / 60);
        robot.status > 10
          ? (errorText.text = `${robotId}, e${robot.status - 10}, ${robotContainer.overtime}min`)
          : (errorText.text = `${robotId}, ${robotContainer.overtime}min`);
        this.info.robotMapOfError[robotId] = errorText.text;
        errorTextBox.width = errorText.width + 2;
        errorTextBox.visible = true;
        errorText.visible = true;
        robotContainer.loop = setInterval(() => {
          ++robotContainer.overtime;
          robot.status > 10
            ? (errorText.text = `${robotId}, e${robot.status - 10}, ${robotContainer.overtime}min`)
            : (errorText.text = `${robotId}, ${robotContainer.overtime}min`);
          this.info.robotMapOfError[robotId] = errorText.text;
          errorTextBox.width = errorText.width + 2;
        }, 60 * 1000);
      }, (params.RobotTimeout - sec) * 1000);
    }
  }

  setRobotState(robot, oldStatus) {
    const { robotId, robotContainer, status } = robot; // spaceId,
    const [, robotSprite, , errorTextBox, errorText] = robotContainer.children;
    status === -1 ? (robotContainer.visible = params.showOfflineRobots) : (robotContainer.visible = true);
    if (oldStatus == null) {
      // 地图初始化
      if (status > 10) {
        // 当状态大于10 机器有问题
        this.robotStatusControl(robot);
      } else {
        // 机器状态正常
        robotSprite.tint = this.colorConfig.robotColorMap[status];
        this.info.robotCount[`robotCountOf${status}`]++;
      }
      return;
    }
    // 地图更新
    if (oldStatus <= 10 && status <= 10) {
      robotSprite.tint = this.colorConfig.robotColorMap[status]; // 颜色更新
      this.info.robotCount[`robotCountOf${oldStatus}`]--;
      this.info.robotCount[`robotCountOf${status}`]++;
    } else if (oldStatus <= 10 && status > 10) {
      this.robotStatusControl(robot, oldStatus); // 机器出问题了
    } else if (oldStatus > 10 && status <= 10) {
      // 问题机器变正常了
      console.log(
        '问题机器变正常了 robotId',
        robotId,
        'status',
        status,
        'oldStatus',
        oldStatus,
        '是否已进入预报错队列：',
        robotContainer.errTimer,
      );
      if (robotContainer.errTimer) {
        clearTimeout(robotContainer.errTimer);
        robotContainer.errTimer = null;
      } else {
        errorTextBox.visible = false;
        errorText.visible = false;
        errorText.text = '';
        delete this.info.robotMapOfError[robotId];
        robotSprite.tint = this.colorConfig.robotColorMap[status];
        // 机器数量统计：有问题 -1，新状态 +1
        this.info.robotCount[`robotCountOf${status}`]++;
        this.info.robotCount.robotCountOf99--;
        // TODO 关闭闪烁
        const robotSpriteTween = TweenMax.getTweensOf(robotSprite.scale)[0];
        if (robotSpriteTween) {
          robotSpriteTween.kill();
          robotSprite.scale.set(robotSprite.oldScale);
        }
      }
    }
  }

  robotStatusControl(robot, oldStatus) {
    const { robotId, robotContainer, status } = robot;
    const [, robotSprite, , errorTextBox, errorText] = robotContainer.children;
    robotContainer.errTimer = setTimeout(() => {
      params.allowSound && sound.play();
      // 错误代码和超时分钟数
      robotContainer.overtime
        ? (this.info.robotMapOfError[robotId] = `${robotId}, e${status - 10}, ${robotContainer.overtime}min`)
        : (this.info.robotMapOfError[robotId] = `${robotId}, e${status - 10}`);
      robotContainer.overtime
        ? (errorText.text = `${robotId}, e${status - 10}, ${robotContainer.overtime}min`)
        : (errorText.text = `${robotId}, e${status - 10}`);
      errorText.visible = true;
      errorTextBox.visible = true;
      errorTextBox.width = errorText.width + 2;
      // 机器变红
      robotSprite.tint = 0xff0000;
      // 机器闪烁
      const oldScale = robotSprite.oldScale;
      TweenMax.fromTo(
        robotSprite.scale,
        0.35,
        {
          x: oldScale,
          y: oldScale,
        },
        {
          x: oldScale * 3,
          y: oldScale * 3,
          repeat: -1,
        },
      );
      // 机器数量统计：有问题
      oldStatus && this.info.robotCount[`robotCountOf${oldStatus}`]--;
      console.log('有问题 robotId', robotId, 'status', status, 'oldStatus', oldStatus);
      this.info.robotCount.robotCountOf99++;
      this.info.robotMap[robotId].status = status; // 更新机器人状态
      robotContainer.errTimer = null;
      this.events.onUpdateInfo(this.info);
    }, params.ErrRobotTimeout * 1000);
  }

  updateModel() {
    const modeStatus = store.state.modeStatus;
    // 退出编辑模式
    if (modeStatus !== 'edit') {
      noPCflag = true;
      sprites.hoverBorder.visible = false;
      sprites.toBorder.visible = false;
      sprites.fromBorder.visible = false;
    }
    // 进入批量模式，楼层接收事件
    if (modeStatus === 'batch') {
      building.floors[0].floorSprite.interactive = true;
    }
    // 退出批量模式
    if (modeStatus !== 'batch') {
      building.floors[0].floorSprite.interactive = false;
      this.resetSelectedContainers();
    }
  }

  resetSelectedContainers() {
    Object.keys(this.selectedContainers).forEach((id) => {
      this.info.containerMap[id].containerContainer.getChildAt(2).visible = false;
    });
    this.selectedContainers = {};
    this.events.onBatchConfirm && this.events.onBatchConfirm(this.selectedContainers);
  }

  initMarkers(markers) {
    markers.forEach((item) => {
      const { marker, posX, posY, posZ } = item;
      const markerBox = PIXI.Sprite.from('textures/space-marker1.png');
      markerBox.width = 10;
      markerBox.height = 10;
      markerBox.anchor.set(0.5);
      markerBox.position.set(posY * 10, posX * 10);
      if (/^T\d+/.test(marker)) {
        // 工作站
        markerBox.tint = this.colorConfig.markerBoxColor.isT.tint; // 底色
        this.colorConfig.markerTextStyle.fill = this.colorConfig.markerBoxColor.isT.fill; // 字色
      } else {
        // 非工作站
        markerBox.tint = this.colorConfig.markerBoxColor.noT.tint; // 底色
        this.colorConfig.markerTextStyle.fill = this.colorConfig.markerBoxColor.noT.fill; // 字色
      }
      this.colorConfig.markerTextStyle.fontSize = 44 - (marker.length - 1) * 10;
      const idSprite = new PIXI.Text(marker, this.colorConfig.markerTextStyle);
      idSprite.visible = true;
      idSprite.scale.set(2);
      idSprite.anchor.set(0.5);
      markerBox.addChild(idSprite);
      building.floors[posZ].markerSprites.addChild(markerBox);
    });
  }

  doMove() {
    Object.values(this.waitingMoveList).forEach((item) => {
      const { robotContainer, containerContainerPosition, x, y, endX, endY, offsetX, offsetY } = item;
      const robotPath = robotContainer.getChildAt(0);
      const { x: currX, y: currY } = robotContainer;
      const offset = Math.sqrt(Math.pow(x - currX, 2) + Math.pow(y - currY, 2)) / 10;
      const duration = params.moveSpeed ? offset / params.moveSpeed : 0;
      const robotContainerTween = TweenMax.getTweensOf(robotContainer.position)[0];
      const containerSpriteTween = TweenMax.getTweensOf(containerContainerPosition)[0];
      robotContainerTween && robotContainerTween.kill();
      containerSpriteTween && containerSpriteTween.kill();
      TweenMax.to(robotContainer.position, duration, {
        x,
        y,
        onUpdate() {
          // TODO update的同时每次需要获取最新的x, y
          const { x: currX1, y: currY2 } = robotContainer;
          robotPath.clear();
          robotPath.lineStyle(1.5, 0x0000ff, 1);
          robotPath.moveTo(0, 0);
          robotPath.lineTo(offsetX === 0 ? 0 : endX - currX1, offsetY === 0 ? 0 : endY - currY2);
        },
        onComplete() {
          robotPath.moveTo(0, 0);
          robotPath.lineTo(offsetY === 0 ? 0 : endX - currX, offsetX === 0 ? 0 : endY - currY);
        },
      }).data = { offsetX, offsetY };
      containerContainerPosition && TweenMax.to(containerContainerPosition, duration, { x, y });
    });
    this.waitingMoveList = {};
  }

  takeScreenshot() {
    app.renderer.extract.canvas(app.stage).toBlob((b) => {
      const a = document.createElement('a');
      document.body.append(a);
      a.download = 'screenshot';
      a.href = URL.createObjectURL(b);
      a.click();
      a.remove();
    }, 'image/png');
  }

  destroy() {
    app.destroy();
    app = null;
    building = {
      floors: {}, // 楼层
    };
  }

  update(data) {
    nowStamp = +new Date();
    const { spaces, terminals, robots, containers } = data; // containers, containerDetail
    spaces && this.updateSpaces(spaces);
    terminals && this.updateTerminals(terminals);
    robots && this.updateRobots(robots);
    containers && this.updateContainers(containers);
    this.doMove();
    return Promise.resolve(this.info);
  }

  updateSpaces(spaces) {
    const len = spaces.length;
    for (let i = 0; i < len; i++) {
      const { spaceId, status, type } = spaces[i];
      const oldSpace = this.info.spaceMap.get(spaceId);
      if (!oldSpace) continue;
      const { spaceSprite, spacesIdLayer, status: oldStatus, z } = oldSpace;
      const floor = building.floors[z];
      const { spacesContainer, spacesContainerOfMarked } = floor;
      if (status !== oldStatus) {
        oldSpace.status = status;
        if (status === 1 && params.showSafeSpace) {
          // 状态变为1 地面标红
          spaceSprite.tint = this.colorConfig.spaceColorMap['-1'];
          spacesContainer.removeChild(spacesIdLayer);
          spacesContainerOfMarked.addChild(spacesIdLayer);
          this.info.spaceMapOfMark.set(spaceId, oldSpace);
        } else {
          spaceSprite.tint = this.colorConfig.spaceColorMap[type];
          spacesContainer.addChild(spacesIdLayer);
          spacesContainerOfMarked.removeChild(spacesIdLayer);
          this.info.spaceMapOfMark.delete(spaceId);
        }
      }
    }
  }

  updateTerminals(terminals) {
    for (let i = 0; i < terminals.length; i++) {
      const terminal = terminals[i];
      const { terminalId, status } = terminal;
      const oldTerminal = this.info.terminalMap[terminalId];
      const { terminalContainer, status: oldStatus } = oldTerminal;
      if (status !== oldStatus) {
        terminalContainer.getChildAt(0).tint = this.colorConfig.terminalColorMap[status];
        oldTerminal.status = status;
        // 状态变化更改计数
        this.info.terminalCount[`terminalCountOf${oldStatus}`]--;
        this.info.terminalCount[`terminalCountOf${status}`]++;
        // 刷新工作站状态， 给右侧栏使用
        this.info.terminalMap[terminalId].status = status;
      }
    }
  }

  updateRobots(robots) {
    const len = robots.length;
    for (let i = 0; i < len; i++) {
      const robot = robots[i];
      const {
        robotId,
        spaceId,
        voltage,
        orientation,
        endId: endIdNew,
        lastUpdateTimeStamp,
        status,
        frequence,
        terminalId,
        containerId,
      } = robot;
      const endIdList = endIdNew ? endIdNew.split(',') : [];
      const endId = endIdList[0]; // endId 第一个坐标点
      const space = this.info.spaceMap.get(spaceId); // 当前的位置
      if (!space) continue; // robot对应的space不存在 直接跳过
      const { posX, posY, posZ, x, y, z } = space;
      const oldRobot = this.info.robotMap[robotId]; // 原机器人信息
      oldRobot.lastUpdateTimeStamp = lastUpdateTimeStamp;
      if (!oldRobot) continue; // 若oldRobot不存在，则是新增的robot，走robot初始化逻辑
      const { robotContainer, status: oldStatus, orientation: oldOrientation, spaceId: oldSpaceId } = oldRobot;
      const [, , , errorTextBox, errorText] = robotContainer.children;
      // 定时循环关闭
      if (robotContainer.loop) {
        clearInterval(robotContainer.loop);
        robotContainer.loop = null;
        robotContainer.overtime = 0;
        if (oldRobot.status > 10) {
          errorText.text = `${robotId}, e${oldRobot.status - 10}`;
        } else {
          errorTextBox.visible = false;
          errorText.visible = false;
          errorText.text = '';
        }
      }
      // 错误信息显示
      if (endId !== undefined && endId !== spaceId && params.showRobotError) {
        this.errorMessageDisplay(robot, robotContainer);
      }
      // 若机器人 status 变化需要重新设置颜色, orientation 变化需要改变方向
      if (status !== oldStatus || orientation !== oldOrientation) {
        // 设置机器颜色、错误代码
        robot.robotContainer = robotContainer;
        this.setRobotState(robot, oldStatus);
      }
      const endSpace = this.info.spaceMap.get(endId);
      const { x: endX, y: endY } = endSpace; // 需要移动的第一个点位
      // TODO 节流控制运动轨迹的生成
      this.robotlineTo(space, endSpace, robotContainer);
      if (oldRobot.startId) {
        this.robotlineClear(oldRobot.startId, oldRobot.setTime);
        oldRobot.startId = null;
      }
      if (!oldRobot.startId && spaceId !== endId) {
        oldRobot.startId = spaceId;
        this.robotlineTo2(space, endIdList);
      }
      if (oldRobot.startId && spaceId === endId) {
        this.robotlineClear(oldRobot.startId, oldRobot.setTime);
        oldRobot.startId = null;
      }
      if (spaceId !== oldSpaceId) {
        oldRobot.spaceId = spaceId;
        const oldSpace = this.info.spaceMap.get(oldSpaceId);
        const { x: oldX, y: oldY, z: oldZ } = oldSpace;
        // todo: 如果机器人的移动伴随楼层转换，则执行不同的逻辑。包括不需要显示机器的路径（endId 与 spaceId 不同），
        if (z !== oldZ) {
          // 楼层转换
          robotContainer.setParent(building.floors[z].robotSprites);
        } else {
          // 同层移动
          let offsetX, offsetY;
          if (spaceId !== oldSpaceId) {
            offsetX = x - oldX;
            offsetY = y - oldY;
          }
          const key = `${oldSpaceId}->${spaceId}`;
          this.waitingMoveList[key] = {
            robotContainer,
            x,
            y,
            endX,
            endY,
            offsetX,
            offsetY,
          };
        }
      }
      // 机器列表，给右侧栏用
      oldRobot.endId = endIdNew;
      oldRobot.posX = posX;
      oldRobot.posY = posY;
      oldRobot.posZ = posZ;
      oldRobot.status = status;
      oldRobot.voltage = voltage;
      oldRobot.frequence = frequence;
      oldRobot.terminalId = terminalId;
      oldRobot.containerId = containerId;
      oldRobot.orientation = orientation;
    }
    setTimeout(() => {
      this.events.onUpdateInfo(this.info);
    }, params.ErrRobotTimeout * 1000);
  }

  robotlineTo(space, endSpace, robotContainer) {
    const { x, y } = space; // 当前位置坐标
    const { x: endX, y: endY } = endSpace; // 需要移动到的点位
    const { x: currX, y: currY } = robotContainer;
    const offsetX = x - currX;
    const offsetY = y - currY;
    const robotPath = robotContainer.getChildAt(0);
    robotPath.clear();
    robotPath.lineStyle(1.5, 0x0000ff, 1);
    robotPath.moveTo(0, 0);
    if (offsetX === 0 && offsetY === 0) {
      robotPath.lineTo(endX - currX, endY - currY);
    } else {
      robotPath.lineTo(offsetX === 0 ? 0 : endX - currX, offsetY === 0 ? 0 : endY - currY);
    }
  }

  robotlineTo2(space, endIdList) {
    const containerList = spacesContainerNew;
    const container = containerList.find((o) => o.name === space.spaceId);
    const CPoint = [this.spaceWidth / 2, this.spaceLength / 2];
    if (endIdList.length > 0) {
      const robotPath2 = new PIXI.Graphics();
      robotPath2.lineStyle(1.5, this.colorConfig.robotlineColor, 1);
      robotPath2.moveTo(CPoint[0], CPoint[1]);
      for (let i = 0; i < endIdList.length; i += 1) {
        robotPath2.visible = params.showRobotsPath;
        let space1;
        i === 0 ? (space1 = space) : (space1 = this.info.spaceMap.get(endIdList[i - 1]));
        const { x: endX1, y: endY1 } = space1;
        const space2 = this.info.spaceMap.get(endIdList[i]);
        const { x: endX2, y: endY2 } = space2;
        const lineTo1 = endX2 - endX1;
        const lineTo2 = endY2 - endY1;
        CPoint[0] += lineTo1;
        CPoint[1] += lineTo2;
        robotPath2.lineTo(CPoint[0], CPoint[1]);
        robotPath2.moveTo(CPoint[0], CPoint[1]);
        container.addChild(robotPath2);
      }
    }
  }

  robotlineClear(startId) {
    const containerList = spacesContainerNew;
    const container = containerList.find((o) => o.name === startId);
    container.children.length = 1;
  }

  removeContainer(containerId) {
    const container = this.info.containerMap[containerId];
    if (!container) return;
    const { spaceId, containerContainer } = container;
    const spaceNow = this.info.spaceMap.get(spaceId);
    spaceNow.containerId = null;
    const { z } = spaceNow;
    TweenMax.to(containerContainer, 0.1, {
      alpha: 0,
      repeat: 8,
      yoyo: true,
      onComplete() {
        building.floors[z].containerSprites.removeChild(containerContainer);
      },
    });
    delete this.info.containerMap[containerId];
    this.info.containerCount--; // 货架数量减少
  }

  updateContainers(containers) {
    const len = containers.length;
    for (let i = 0; i < len; i++) {
      const container = containers[i];
      if (container.status === -9) {
        this.removeContainer(container.containerId, this);
        continue;
      }
      const { containerId, spaceId, type, orientation, frequence, zoneId } = container;
      const space = this.info.spaceMap.get(spaceId);
      if (!space) {
        space.containerId = null;
        continue;
      }
      const { x, y, z } = space;
      const oldContainer = this.info.containerMap[containerId];
      if (!oldContainer) {
        const containerContainer = this.createContainer(container);
        this.info.containerCount++; // 货架数量增加
        space.containerId = containerId; // 记录点位存在货架Id
        building.floors[z].containerSprites.addChild(containerContainer);
        TweenMax.to(containerContainer.getChildAt(0), 0.1, {
          alpha: 0,
          repeat: 7,
          yoyo: true,
        });
        continue;
      }
      const {
        spaceId: oldSpaceId,
        containerContainer,
        orientation: oldOrientation,
        type: oldType,
        frequence: oldFrequence,
        zoneId: oldZoneId,
      } = oldContainer;
      const oldSpace = this.info.spaceMap.get(oldSpaceId);
      const { z: oldZ } = oldSpace;
      // 货架移动了，包括更新货架位置
      if (spaceId !== oldSpaceId) {
        oldSpace.containerId = null;
        oldContainer.spaceId = spaceId;
        space.containerId = containerId;
        const key = `${oldSpaceId}->${spaceId}`;
        const waitingMoveItem = this.waitingMoveList[key];
        if (z !== oldZ) {
          containerContainer.setParent(building.floors[z].containerSprites);
          containerContainer.position.set(x, y);
        } else {
          // 楼层不变
          waitingMoveItem
            ? (waitingMoveItem.containerContainerPosition = containerContainer.position)
            : TweenMax.to(containerContainer.position, 1, { x, y });
        }
      }
      const containerSprite = containerContainer.getChildAt(0);
      if (orientation !== undefined && orientation !== oldOrientation) {
        oldContainer.orientation = orientation;
        TweenMax.to(containerSprite, 0.2, { rotation: (orientation * Math.PI) / 2 });
      }
      if (frequence !== oldFrequence || type !== oldType) {
        oldContainer.frequence = frequence;
        oldContainer.type = type;
        params.showContainersType === 'type'
          ? (containerSprite.tint = calcShapeColorByType(type))
          : (containerSprite.tint = calcShapeColorByFrquence(frequence));
      }
      zoneId !== oldZoneId && (oldContainer.zoneId = zoneId);
      // if (!['N', undefined, 'T-virtual'].includes(terminalId)) {
      //   this.pendingContainerMap[containerId] = oldContainer;
      // } else {
      //   // 以下代码可能导致性能问题
      //   delete this.pendingContainerMap[containerId];
      // }
    }
  }

  showSpaces(flag) {
    const container = building.floors[0].spacesContainer;
    container.children.forEach((item) => {
      item.children[0].visible = flag;
    });
  }

  showLinks(flag) {
    building.floors[0].spacesPathSprite.visible = flag;
  }

  showSpaceId(flag) {
    const container = building.floors[0].spacesContainer2;
    container.children.forEach((item) => {
      item.children[1].visible = flag;
    });
  }

  showContainerBerth(flag) {
    const typeColor = flag ? this.colorConfig.spaceColorMap[1] : this.colorConfig.spaceColorMap[0];
    const len = this.spacesOfContainerSlot.length;
    for (let i = 0; i < len; i++) {
      const { status, spaceSprite } = this.spacesOfContainerSlot[i];
      if (status !== 1) {
        spaceSprite.tint = typeColor;
      }
    }
  }

  showInvalidSpace(flag) {
    const len = this.spacesOfInvalid.length;
    for (let i = 0; i < len; i++) {
      this.spacesOfInvalid[i].spaceSprite.visible = flag;
    }
  }

  showWaitingSpace(flag) {
    const len = this.spacesOfWaiting.length;
    for (let i = 0; i < len; i++) {
      const { type, status, spaceSprite } = this.spacesOfWaiting[i];
      if (status !== 1) {
        spaceSprite.tint = flag ? this.colorConfig.spaceColorMap[type] : this.colorConfig.spaceColorMap[0];
      }
    }
  }

  showRobots(flag) {
    building.floors[0].robotSprites.visible = flag;
  }

  showOfflineRobots(flag) {
    Object.values(this.info.robotMap).forEach((robot) => {
      const { status, robotContainer } = robot;
      status === -1 && (robotContainer.visible = flag);
    });
  }

  showRobotsPath(flag) {
    Object.values(this.info.robotMap).forEach((robot) => {
      const { robotContainer } = robot;
      robotContainer.getChildAt(4).visible = flag;
    });
  }

  showRobotsId(flag) {
    Object.values(this.info.robotMap).forEach((robot) => {
      const { robotContainer } = robot;
      robotContainer.getChildAt(2).visible = flag;
    });
  }

  showContainers(flag) {
    building.floors[0].containerSprites.visible = flag;
  }

  showContainerId(flag) {
    Object.values(this.info.containerMap).forEach((container) => {
      const { containerContainer } = container;
      containerContainer.getChildAt(3).visible = flag;
    });
  }

  showContainersType(value) {
    const setContainersColorBy = {
      type() {
        Object.values(this.info.containerMap).forEach((container) => {
          const { type, containerContainer } = container;
          containerContainer.getChildAt(0).tint = calcShapeColorByType(type);
        });
      },
      frequence() {
        Object.values(this.info.containerMap).forEach((container) => {
          const { frequence, containerContainer } = container;
          containerContainer.getChildAt(0).tint = calcShapeColorByFrquence(frequence);
        });
      },
    };
    setContainersColorBy[value].call(this);
  }

  showTerminals(flag) {
    building.floors[0].terminalSprites.visible = flag;
  }

  showSafeSpace(flag) {
    Object.values(this.info.spaceMapOfMark).forEach((space) => {
      const { spaceSprite, type } = space;
      const markedColor = flag ? this.colorConfig.spaceColorMap[-1] : this.colorConfig.spaceColorMap[type];
      spaceSprite.tint = markedColor;
    });
  }

  showMarker(flag) {
    building.floors[0].markerSprites.visible = flag;
  }

  showRobotError(flag) {
    Object.values(this.info.robotMap).forEach((robot) => {
      const { robotId, status, robotContainer } = robot;
      const [, , , errorTextBox, errorText] = robotContainer.children;
      if (status > 10) {
        errorText.text = `${robotId}, e${status - 10}, ${robotContainer.overtime}min`;
      } else {
        errorText.text = `${robotId}, ${robotContainer.overtime}min`;
      }
      if (flag) {
        errorTextBox.visible = status > 10 || robotContainer.overtime > 0;
        errorText.visible = status > 10 || robotContainer.overtime > 0;
      } else {
        errorTextBox.visible = false;
        errorText.visible = false;
      }
    });
  }

  floorsDirection(value) {
    this.zoom(0);
    let i = 0;
    Object.keys(building.floors).forEach((floorIndex) => {
      const floor = building.floors[floorIndex];
      const floorSprite = floor.floorSprite;
      if (value === 'Horizontal') {
        floorSprite.x = (this.mapWidth + floorPadding * 2 + floorMargin) * i;
        floorSprite.y = 0;
      } else {
        floorSprite.x = 0;
        floorSprite.y = (this.mapLength + floorPadding * 2 + floorMargin) * i;
      }
      i++;
    });
    const buildingSprite = building.buildingSprite;
    buildingSprite.pivot.x = Math.floor(buildingSprite.width / 2);
    buildingSprite.pivot.y = Math.floor(buildingSprite.height / 2);
  }

  toggleFloor(checkedValues) {
    let i = 0;
    Object.keys(building.floors).forEach((floorIndex) => {
      const floor = building.floors[floorIndex];
      const index = checkedValues.indexOf(Number(floorIndex) + 1);
      floor.visible = false;
      const { floorSprite } = floor;
      floorSprite.visible = false;
      if (index !== -1) {
        floor.visible = true;
        floorSprite.visible = true;
        if (params.floorDirection === 'Horizontal') {
          floorSprite.x = (this.mapWidth + floorPadding * 2 + floorMargin) * i;
          floorSprite.y = 0;
        } else {
          floorSprite.x = 0;
          floorSprite.y = (this.mapLength + floorPadding * 2 + floorMargin) * i;
        }
        i++;
      }
    });
  }

  initEquipments(equipments) {
    equipments.forEach((item) => {
      const { posX, posY, posZ = 0, itemType, length, width, rotate } = item;
      const sprite = new PIXI.Sprite(this.textures[itemType]);
      sprite.width = width * 10;
      sprite.height = length * 10;
      sprite.anchor.set(0.5);
      sprite.rotation = rotate * Math.PI / 2;
      sprite.position.set(posY * 10, posX * 10);
      building.floors[posZ].markerSprites.addChild(sprite);
    });
  }
}
