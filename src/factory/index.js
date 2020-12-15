import * as PIXI from 'pixi.js';
import storage from '@/utils/storage';
import store from '@/store/index.js';
import colorConfig from '@/utils/colorConfig.js';
import { thottle } from '@/utils/help.js';
import { isPC } from '@/utils/device.js';
import sound from './sound';
import { createGraphics, loadTextures, getMinAndSec, calcShapeColorByFrquence, calcShapeColorByType } from './func.js';

let nowStamp;
const TweenMax = window.gsap; // 在index.html中引入了gsap.min.js
const deviceIsPC = isPC();
const { params } = store.state.factory;
const floorPadding = 10;
const floorMargin = 20;
const sprites = { rect: null };
const spaceSelectArr = [];

class Scene {
  constructor(el, warehouseInfo, events, spaceInfoBox) {
    this.el = el;
    this.spaceInfoBox = spaceInfoBox;
    const { mapWidth, mapLength, spaceWidth, spaceLength, warehouseLayerNo } = warehouseInfo;
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
    const floors = (warehouseLayerNo || '0').trim().split(' ');
    floors.forEach((floorIndex) => {
      this.building.floors[floorIndex] = { visible: true };
    });
    this.colorConfig = colorConfig;
    this.spacesOfContainerSlot = []; // 货架泊位
    this.spacesOfInvalid = []; // 无效位置
    this.spacesOfWaiting = []; // 等待位
    this.waitingMoveList = []; // 等待移动的列表
    this.spacesContainerNew = []; // 点位容器（存储移动的路径）
    this.selectedContainers = {}; // 选中的货架
    this.info = {
      floorsCount: floors.length,
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
    this.textures = null;
    this.floorSelect = false; // 批量编辑模式下的选中状态
    !this.app && this.createScene(el); // 场景创建
    loadTextures().then((res) => {
      this.textures = res;
      this.events.onInitWS && this.events.onInitWS();
      this.events.onMarkerList && this.events.onMarkerList();
      this.events.onDimensionList && this.events.onDimensionList();
    });
  }

  resize() {
    console.log('app resize');
    this.el.style.display = 'none';
    this.app && this.app.renderer.resize(this.el.parentElement.clientWidth, this.el.parentElement.clientHeight);
    this.el.style.display = 'block';
  }

  // 楼层排列方式更新
  floorDirectionChange(value, floor = 0) {
    const child = this.building.buildingContainer.children[0];
    if (value === 'Horizontal') {
      child.x = (this.mapWidth + floorPadding * 2 + floorMargin) * floor;
      child.y = 0;
    } else {
      child.x = 0;
      child.y = (this.mapLength + floorPadding * 2 + floorMargin) * floor;
    }
  }

  createScene(el) {
    console.time('createScene');
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
    Object.keys(this.building.floors).forEach((i) => {
      const floor = this.building.floors[i];
      // 地板容器
      const floorContainer = new PIXI.Container();
      floorContainer.name = 'floorContainer';
      if (params.floorDirection === 'Horizontal') {
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
      floor.spacesPathSprite.visible = params.showLinks;
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
      // 特殊容器 手势边框等等
      floor.other = new PIXI.Container();
      floor.other.name = 'other';
      floor.other.position.set(floorPadding, floorPadding);
      floorContainer.addChild(floor.other);
      // 点位选中
      const containerSelector = new PIXI.Graphics();
      containerSelector.name = 'containerSelector';
      containerSelector.beginFill(0xff0000, 0.1);
      containerSelector.drawRect(0, 0, 1, 1); // 初始图案必须占用有效像素，否则不会被添加到场景当中
      containerSelector.endFill();
      containerSelector.visible = false;
      floor.containerSelector = containerSelector;
      floorContainer.addChild(containerSelector);
      this.floorSpriteEvent(floorContainer, containerSelector);
      // 主容器
      const buildingContainer = this.building.buildingContainer;
      buildingContainer.x = Math.floor(this.app.screen.width / (devicePixelRatio * 2));
      buildingContainer.y = Math.floor(this.app.screen.height / (devicePixelRatio * 2));
      buildingContainer.pivot.x = Math.floor(buildingContainer.width / 2);
      buildingContainer.pivot.y = Math.floor(buildingContainer.height / 2);
      this.app.stage.addChild(buildingContainer);
      this.resize();
      window.addEventListener('resize', thottle(300, this.resize.bind(this)));
      // 浏览器 tab 页切换到后台时将机器的移动速度置为 0，即无动画
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          store.commit('SET_MOVE_SPEED', 0);
        } else {
          store.commit('SET_MOVE_SPEED', storage.get('scada_moveSpeed') || 1.5);
        }
      });
      this.domEvent();
    });
    console.timeEnd('createScene');
  }

  floorSpriteEvent(floorSprite, containerSelector) {
    let p1 = null;
    let p2 = null;
    if (deviceIsPC) {
      floorSprite.cursor = 'crosshair';
      // floorSprite.interactive = true; // 事件开关
      floorSprite.on('mousedown', (e) => {
        this.floorSelect = true;
        p1 = e.data.getLocalPosition(floorSprite);
        console.log('p1', p1);
        containerSelector.position.set(p1.x, p1.y);
        containerSelector.width = 0;
        containerSelector.height = 0;
        containerSelector.visible = true;
      });
      floorSprite.on('mousemove', (e) => {
        if (this.floorSelect) {
          p2 = e.data.getLocalPosition(floorSprite);
          containerSelector.width = p2.x - p1.x;
          containerSelector.height = p2.y - p1.y;
        }
      });
      floorSprite.on('mouseup', () => {
        this.floorSelect = false;
        Object.keys(this.info.containerMap).forEach((containerId) => {
          const container = this.containerMap[containerId];
          const containerContainer = container.containerContainer;
          const containerPosition = containerContainer.getGlobalPosition();
          if (containerSelector.containsPoint(containerPosition)) {
            if (this.selectedContainers[containerId]) {
              // 存在则移除，取消高亮
              containerContainer.getChildAt(2).visible = false;
              delete this.selectedContainers[containerId];
            } else {
              // 不存在则添加，高亮
              this.selectedContainers[containerId] = container;
              containerContainer.getChildAt(2).visible = true;
            }
          }
        });
        containerSelector.visible = false;
        // this.events.onBatchConfirm && this.events.onBatchConfirm(this.selectedContainers);
      });
    }
  }

  destroy() {
    this.app.destroy();
    this.app = null;
    this.building = {
      floors: {}, // 楼层
      buildingContainer: null, // 主容器
    };
  }

  init(data) {
    nowStamp = +new Date();
    const { spaces, terminals, robots, containers } = data;
    spaces && this.initSpaces(spaces);
    terminals && this.initTerminals(terminals);
    robots && this.initRobots(robots);
    containers && this.initContainers(containers);
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
    sprites.toBorder = createGraphics(this.spaceWidth, this.spaceLength, this.colorConfig.toBorderColor, 'toBorder');
    this.building.buildingContainer.addChild(sprites.hoverBorder, sprites.fromBorder, sprites.toBorder);
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
      const spacesIdLayer2 = new PIXI.Container();
      spacesIdLayer2.name = spaceId;
      spacesIdLayer.width = spacesIdLayer2.width = this.spaceWidth;
      spacesIdLayer.height = spacesIdLayer2.height = this.spaceLength;
      spacesIdLayer.pivot.set(this.spaceWidth / 2, this.spaceLength / 2);
      spacesIdLayer.position.set(space.x, space.y);
      spacesIdLayer2.pivot.set(this.spaceWidth / 2, this.spaceLength / 2);
      spacesIdLayer2.position.set(space.x, space.y);
      // 本体1
      const spaceSprite = PIXI.Sprite.from('textures/space1.jpg');
      spaceSprite.width = this.spaceWidth;
      spaceSprite.height = this.spaceLength;
      spaceSprite.visible = params.showSpaces;
      spacesIdLayer.addChild(spaceSprite);
      space.spaceSprite = spaceSprite;
      space.spacesIdLayer = spacesIdLayer;
      // 本体2
      const spaceSprite2 = PIXI.Sprite.from('textures/space1.png');
      spaceSprite2.width = this.spaceWidth;
      spaceSprite2.height = this.spaceLength;
      spacesIdLayer2.addChild(spaceSprite2);
      // 点位id
      const idSprite = new PIXI.Text(spaceId, { fill: this.colorConfig.spaceIdColor });
      idSprite.scale.set(0.1);
      idSprite.anchor.set(-0.6, -1.2);
      idSprite.visible = params.showSpaceId;
      spacesIdLayer2.addChild(idSprite);
      this.spacesContainerNew.push(spacesIdLayer2);
      const floor = this.building.floors[space.z];
      const { spacesContainer, spacesContainer2, spacesContainerOfMarked } = floor;
      if (status === 1) {
        this.info.spaceMapOfMark[spaceId] = space;
        spaceSprite.tint = this.colorConfig.spaceColorMap['-1'];
        spacesContainerOfMarked.addChild(spacesIdLayer);
      } else {
        spaceSprite.tint = this.colorConfig.spaceColorMap[type];
        spacesContainer.addChild(spacesIdLayer);
        spacesContainer2.addChild(spacesIdLayer2);
      }
      this.info.spaceMap[spaceId] = space;
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
      }
      // TODO添加事件
      if (deviceIsPC) {
        // 添加事件
        spaceSprite.interactive = true;
        spaceSprite.on('mouseover', this.spaceMouseOver.bind(spaceSprite, space, this));
        spaceSprite.on('mouseout', this.spaceMouseOut.bind(spaceSprite, this));
        spaceSprite.on('click', this.spaceUp.bind(spaceSprite, space, this));
        spaceSprite.on('rightclick', this.spaceRightUp.bind(spaceSprite, space, this));
      }
      // if (deviceIsPC) {
      //   spaceSprite.on('rightclick', this.spaceRightUp.bind(spaceSprite, space, this))
      // } else {
      //   spaceSprite.on('touchstart', this.spaceNoPCtoClick.bind(spaceSprite, space, this))
      // }
      //
    }
    for (let i = 0; i < spaces.length; i++) {
      if (spaces[i].status === -9) i++; // 状态-9跳过
      const { x, y, z, linkId } = spaces[i];
      if (linkId) {
        const spacesPathSprite = this.building.floors[z].spacesPathSprite;
        const linkIds = linkId.trim().split(' ');
        linkIds.forEach((toId) => {
          const { x: x1, y: y1 } = this.info.spaceMap[toId];
          spacesPathSprite.moveTo(x, y);
          spacesPathSprite.lineTo((x + x1) / 2, (y + y1) / 2);
        });
      }
    }
  }

  spaceRightUp(space, $root) {
    const modeStatus = store.state.modeStatus;
    if (modeStatus === 'edit') {
      // 请先设置起始点, 起始点和终点不能一致
      if (!spaceSelectArr[0] || spaceSelectArr[0] === space.spaceId || spaceSelectArr[1] === space.spaceId) {
        sprites.toBorder.visible = false;
        spaceSelectArr[1] = null;
        $root.events.onSelectTo && $root.events.onSelectTo({});
        return;
      }
      const { spaceId, x, y, z } = space;
      sprites.toBorder.setParent($root.building.floors[z].other);
      sprites.toBorder.position.set(x - floorPadding / 2, y - floorMargin / 4);
      sprites.toBorder.visible = true;
      spaceSelectArr[1] = spaceId;
      $root.events.onSelectTo && $root.events.onSelectTo(space);
    }
  }

  spaceUp(space, $root) {
    const modeStatus = store.state.modeStatus;
    const { spaceId, x, y, z } = space;
    if (modeStatus === 'edit') {
      if (spaceSelectArr[0] === spaceId) {
        sprites.fromBorder.visible = false;
        spaceSelectArr[0] = null;
        $root.events.onSelectFrom && $root.events.onSelectFrom({});
        $root.spaceRightUp(null, $root);
        return;
      }
      spaceSelectArr[1] === spaceId && $root.spaceRightUp(space, $root);
      sprites.fromBorder.setParent($root.building.floors[z].other);
      sprites.fromBorder.position.set(x - floorPadding / 2, y - floorMargin / 4);
      sprites.fromBorder.visible = true;
      spaceSelectArr[0] = spaceId;
      $root.events.onSelectFrom && $root.events.onSelectFrom(space);
    }

    if (modeStatus === 'mark') {
      $root.events.onMarkSpace && $root.events.onMarkSpace(space);
    }
    // if (params.model === 'setOrigin' && !movedOnMouseDown) {
    //   // const fixWidth = 10 + 2
    //   // const fixHeight = 10 + 2
    //   // const fixWidthScale = fixWidth / 10
    //   // const fixHeightScale = fixHeight / 10
    //   // 选第一个点和第二个点
    //   if (
    //     ($root.homeAreaStartId == null && $root.homeAreaEndId == null) ||
    //     ($root.homeAreaStartId != null && $root.homeAreaEndId != null) ||
    //     (sprites.setArea.startZ != null && sprites.setArea.startZ !== z)
    //   ) { // 都为空 或 都非空 时设置第一个点；都非空时清除第二个点
    //     $root.homeAreaStartId = spaceId
    //     $root.homeAreaEndId = null
    //     if (!sprites.setArea) { // 若 setArea 不存在则创建它
    //       sprites.setArea = createRect(10, 10, 0x9600ff, 'homeArea', false, true, 0.3)
    //       building.floors[z].other.addChild(sprites.setArea)
    //     } else { // 存在则将尺寸置为 10 (单个 space 的大小)
    //       sprites.setArea.setParent(building.floors[z].other)
    //       sprites.setArea.width = 10
    //       sprites.setArea.height = 10
    //     }
    //     // sprites.setArea.width = 10
    //     // sprites.setArea.height = 10
    //     sprites.setArea.position.set(x, y)
    //     sprites.setArea.visible = true
    //     // 记录第一个点位信息，供设置第二个点时使用
    //     sprites.setArea.startX = x
    //     sprites.setArea.startY = y
    //     sprites.setArea.startZ = z
    //   } else if ($root.homeAreaStartId != null && $root.homeAreaEndId == null) { // 第一个点不为空，第二个点位为空时设置第二个点
    //     $root.homeAreaEndId = spaceId
    //     sprites.setArea.width = Math.abs(x - sprites.setArea.startX) + 10
    //     sprites.setArea.height = Math.abs(y - sprites.setArea.startY) + 10
    //     sprites.setArea.position.set((x + sprites.setArea.startX) / 2, (y + sprites.setArea.startY) / 2)
    //   } else {
    //     console.error('设置归巢区域时发生了异常')
    //   }
    // }
    // if (params.model === 'batch') {
    //   const container = $root.hoverSpaceInfo.container
    //   const { containerId, containerContainer } = container
    //   if (!containerId || !containerContainer) return
    //   if ($root.selectedContainers[containerId]) { // 存在则移除，取消高亮
    //     containerContainer.getChildAt(2).visible = false
    //     delete $root.selectedContainers[containerId]
    //   } else { // 不存在则添加，高亮
    //     $root.selectedContainers[containerId] = container
    //     containerContainer.getChildAt(2).visible = true
    //   }
    // }
  }

  initTerminals(terminals) {
    this.info.terminalCount.sum = terminals.length;
    this.info.terminalMap = {};
    for (let i = 0; i < terminals.length; i++) {
      if (terminals[i].status === -1) i++;
      const terminal = terminals[i];
      const { terminalId, spaceId, status } = terminal;
      const space = this.info.spaceMap[spaceId];
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
      this.building.floors[z].terminalSprites.addChild(terminalContainer);
      // 工作站列表， 给右侧栏使用
      this.info.terminalMap[terminalId] = { terminalId, spaceId, posX, posY, posZ, status, terminalContainer };
    }
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
      const endIdList = endIdNew ? endIdNew.split(',') : [];
      const endId = endIdList[0]; // endId 第一个坐标点
      const space = this.info.spaceMap[spaceId];
      if (!space) continue;
      const { posX, posY, posZ, x, y, z } = space;
      space.robotId = robotId; // 记录点位存在机器人Id
      space.robotStatus = status; // 记录点位存在机器人Id
      robot.posX = posX;
      robot.posY = posY;
      robot.posZ = posZ;
      const robotContainer = new PIXI.Container();
      const robotSprites = this.building.floors[z].robotSprites;
      robotSprites.addChild(robotContainer);
      // 0, 路径
      const endSpace = this.info.spaceMap[endId];
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
      // other
      robotSprite.calculateBounds();
      robot.robotContainer = robotContainer;
      // 机器列表，给右侧栏用
      this.info.robotMap[robotId] = robot;
      // 设置机器颜色、错误代码
      this.setRobotState(robot);
    }
  }

  initContainers(containers) {
    let validLen = 0;
    this.info.containerMap = {};
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      const { spaceId, status, containerId } = container;
      if (status === -9 || !spaceId) continue;
      const space = this.info.spaceMap[spaceId];
      if (!space) continue;
      const { z } = space;
      space.containerId = containerId; // 记录点位存在货架Id
      this.building.floors[z].containerSprites.addChild(this.createContainer(container));
      validLen++;
    }
    this.info.containerCount = validLen;
  }

  createContainer(container) {
    const { containerId, spaceId, frequence, orientation, type } = container;
    const space = this.info.spaceMap[spaceId];
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
    containerContainer.addChild(
      createGraphics(this.spaceWidth, this.spaceLength, 0x00ffff, 'selectContainer', false, false, 0.3),
    );
    // 3, containerId
    const idSprite = new PIXI.Text(containerId, this.colorConfig.containerIdStyle);
    idSprite.anchor.set(0.5, 0.3);
    idSprite.scale.set(0.2);
    idSprite.visible = params.showContainerId;
    containerContainer.addChild(idSprite);
    container.containerContainer = containerContainer;
    this.info.containerMap[containerId] = container;
    // if (!['N', undefined, 'T-virtual'].includes(terminalId)) {
    //   console.log('error includes 1')
    //   this.pendingContainerMap[containerId] = container
    // }
    return containerContainer;
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

  // 添加 warn 计时（时间到达后 显示错误代码，机器变红，闪烁，统计）
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

  spaceMouseOver(space, $root) {
    $root.showInfoTimer && clearTimeout($root.showInfoTimer);
    const { spaceId, terminalId, robotId, containerId, robotStatus, posX, posY, posZ, x, y, z, spaceSprite } = space;
    const status = robotStatus || 0;
    sprites.hoverBorder.setParent($root.building.floors[z].other);
    sprites.hoverBorder.position.set(x - 5, y - 5);
    sprites.hoverBorder.visible = true;
    // 200ms内光标所在的space不变化才显示space信息
    $root.showInfoTimer = setTimeout(() => {
      const config = {
        posX,
        posY,
        posZ,
        spaceId: spaceId || '-',
        robotId: robotId || '-',
        robotErr: status <= 10 ? '' : status - 10,
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
      const oldSpace = this.info.spaceMap[spaceId];
      if (!oldSpace) continue;
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

  updateTerminals(terminals) {
    for (let i = 0; i < terminals.length; i++) {
      const terminal = terminals[i];
      const { spaceId, status } = terminal;
      const oldTerminal = this.info.terminalMap[spaceId];
      const { terminalContainer, status: oldStatus } = oldTerminal;
      if (status !== oldStatus) {
        terminalContainer.getChildAt(0).tint = this.colorConfig.terminalColorMap[status];
        oldTerminal.status = status;
        // 状态变化更改计数
        this.info.terminalCount[`terminalCountOf${oldStatus}`]--;
        this.info.terminalCount[`terminalCountOf${status}`]++;
        // 刷新工作站状态， 给右侧栏使用
        this.info.terminalMap[spaceId].status = status;
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
      const space = this.info.spaceMap[spaceId]; // 当前的位置
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
      if (endId !== undefined && endId !== spaceId) {
        const { min, sec } = getMinAndSec(nowStamp, lastUpdateTimeStamp);
        if (sec > params.RobotTimeout) {
          robotContainer.overtime = min;
          robot.status > 10
            ? (errorText.text = `${robotId}, e${robot.status - 10}, ${robotContainer.overtime}min`)
            : (errorText.text = `${robotId}, ${robotContainer.overtime}min`);
          errorTextBox.width = errorText.width + 2;
          errorTextBox.visible = true;
          errorText.visible = true;
          robotContainer.loop = setInterval(() => {
            ++robotContainer.overtime;
            robot.status > 10
              ? (errorText.text = `${robotId}, e${robot.status - 10}, ${robotContainer.overtime}min`)
              : (errorText.text = `${robotId}, ${robotContainer.overtime}min`);
            errorTextBox.width = errorText.width + 2;
          }, 60 * 1000);
        } else {
          robotContainer.loop = setTimeout(() => {
            robotContainer.overtime = Math.floor(params.RobotTimeout / 60);
            robot.status > 10
              ? (errorText.text = `${robotId}, e${robot.status - 10}, ${robotContainer.overtime}min`)
              : (errorText.text = `${robotId}, ${robotContainer.overtime}min`);
            errorTextBox.width = errorText.width + 2;
            errorTextBox.visible = true;
            errorText.visible = true;
            robotContainer.loop = setInterval(() => {
              ++robotContainer.overtime;
              robot.status > 10
                ? (errorText.text = `${robotId}, e${robot.status - 10}, ${robotContainer.overtime}min`)
                : (errorText.text = `${robotId}, ${robotContainer.overtime}min`);
              errorTextBox.width = errorText.width + 2;
            }, 60 * 1000);
          }, (params.RobotTimeout - sec) * 1000);
        }
      }
      // 若机器人 status 变化需要重新设置颜色, orientation 变化需要改变方向
      if (status !== oldStatus || orientation !== oldOrientation) {
        // 设置机器颜色、错误代码
        robot.robotContainer = robotContainer;
        this.setRobotState(robot, oldStatus);
      }
      const endSpace = this.info.spaceMap[endId];
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
        const oldSpace = this.info.spaceMap[oldSpaceId];
        const { x: oldX, y: oldY, z: oldZ } = oldSpace;
        // todo: 如果机器人的移动伴随楼层转换，则执行不同的逻辑。包括不需要显示机器的路径（endId 与 spaceId 不同），
        if (z !== oldZ) {
          // 楼层转换
          robotContainer.setParent(this.building.floors[z].robotSprites);
          // 添加转换闪烁动画， 如不需要，注释掉即可
          let j = 0;
          const yoyo = setInterval(() => {
            j > 5 ? clearInterval(yoyo) : (j += 1);
            robotContainer.setParent(this.building.floors[j % 2 === 1 ? oldZ : z].robotSprites);
          }, 100);
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
    const containerList = this.spacesContainerNew;
    const container = containerList.find((o) => o.name === space.spaceId);
    const CPoint = [this.spaceWidth / 2, this.spaceLength / 2];
    if (endIdList.length > 0) {
      const robotPath2 = new PIXI.Graphics();
      robotPath2.lineStyle(1.5, this.colorConfig.robotlineColor, 1);
      robotPath2.moveTo(CPoint[0], CPoint[1]);
      for (let i = 0; i < endIdList.length; i += 1) {
        robotPath2.visible = params.showRobotsPath;
        let space1;
        i === 0 ? (space1 = space) : (space1 = this.info.spaceMap[endIdList[i - 1]]);
        const { x: endX1, y: endY1 } = space1;
        const space2 = this.info.spaceMap[endIdList[i]];
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
    const containerList = this.spacesContainerNew;
    const container = containerList.find((o) => o.name === startId);
    container.children.length = 1;
  }

  // 删除货架视图
  removeContainer(containerId, $root) {
    const container = $root.info.containerMap[containerId];
    const { spaceId, containerContainer } = container;
    const { z } = $root.info.spaceMap[spaceId];
    TweenMax.to(containerContainer, 0.1, {
      alpha: 0,
      repeat: 8,
      yoyo: true,
      onComplete() {
        // 删除货架模型
        $root.building.floors[z].containerSprites.removeChild(containerContainer);
      },
    });
    delete $root.info.containerMap[containerId];
    $root.info.containerCount--; // 货架数量减少
  }

  updateContainers(containers) {
    const len = containers.length;
    for (let i = 0; i < len; i++) {
      const container = containers[i];
      console.log('container status', container.status);
      if (container.status === -9) {
        this.removeContainer(container.containerId, this);
        continue;
      }
      const { containerId, spaceId, type, orientation, frequence, zoneId } = container;
      const space = this.info.spaceMap[spaceId];
      if (!space) continue;
      const { x, y, z } = space;
      const oldContainer = this.info.containerMap[containerId];
      // 若 oldContainer 不存在，则是新增的 container，走 container 初始化逻辑
      if (!oldContainer) {
        const containerContainer = this.createContainer(container);
        this.info.containerCount++; // 货架数量增加
        this.building.floors[z].containerSprites.addChild(containerContainer);
        this.info.spaceMap[spaceId].containerId = containerId; // 记录点位存在货架Id
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
      const oldSpace = this.info.spaceMap[oldSpaceId];
      const { x: oldX, y: oldY, z: oldZ } = oldSpace;
      // 货架移动了，包括更新货架位置
      if (spaceId !== oldSpaceId) {
        oldSpace.containerId = null;
        oldContainer.spaceId = spaceId;
        space.containerId = containerId;
        const key = `${oldSpaceId}->${spaceId}`;
        const waitingMoveItem = this.waitingMoveList[key];
        if (z !== oldZ) {
          // 楼层变了
          // console.log('楼层转换', z, oldZ)
          containerContainer.setParent(this.building.floors[z].containerSprites);
          containerContainer.position.set(x, y);
          // 添加转换闪烁动画， 如不需要，注释掉即可
          let j = 0;
          const yoyo = setInterval(() => {
            if (j > 5) {
              clearInterval(yoyo);
            } else {
              j++;
            }
            if (j % 2 === 1) {
              containerContainer.setParent(this.building.floors[oldZ].containerSprites);
              containerContainer.position.set(oldX, oldY);
            } else {
              containerContainer.setParent(this.building.floors[z].containerSprites);
              containerContainer.position.set(x, y);
            }
          }, 100);
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
      // oldContainer.terminalId = terminalId;
    }
  }

  // 绑定事件 拖动,点击,放大缩小等
  domEvent() {
    let preX;
    let preY;
    let mousedown = false;
    if (deviceIsPC) {
      this.el.onmousedown = (e) => {
        mousedown = true;
        preX = e.x;
        preY = e.y;
        this.el.onmousemove = (ev) => {
          if (!mousedown) return;
          if (store.state.modeStatus === 'batch') return;
          if (mousedown) {
            const offsetX = ev.x - preX;
            const offsetY = ev.y - preY;
            const buildingSprite = this.building.buildingContainer;
            const oldX = Math.round(buildingSprite.position.x + offsetX);
            const oldY = Math.round(buildingSprite.position.y + offsetY);
            buildingSprite.position.set(oldX, oldY);
            preX = ev.x;
            preY = ev.y;
          }
        };
        this.el.onmouseup = () => {
          mousedown = false;
        };
        this.el.onmouseout = () => {
          mousedown = false;
        };
      };
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

  doMove() {
    Object.keys(this.waitingMoveList).forEach((key) => {
      const { robotContainer, containerContainerPosition, x, y, endX, endY, offsetX, offsetY } = this.waitingMoveList[
        key
      ];
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
    this.app.renderer.extract.canvas(this.app.stage).toBlob((b) => {
      const a = document.createElement('a');
      document.body.append(a);
      a.download = 'screenshot';
      a.href = URL.createObjectURL(b);
      a.click();
      a.remove();
    }, 'image/png');
  }

  // TODO markers创建
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
      this.building.floors[posZ].markerSprites.addChild(markerBox);
    });
  }

  updateContainersType(containerTypeMap) {
    this.containerTypeMap = containerTypeMap;
  }

  showSpaces(flag) {
    const container = this.building.floors[0].spacesContainer;
    container.children.forEach((item) => {
      item.children[0].visible = flag;
    });
  }

  showLinks(flag) {
    this.building.floors[0].spacesPathSprite.visible = flag;
  }

  showSpaceId(flag) {
    const container = this.building.floors[0].spacesContainer2;
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
    this.building.floors[0].robotSprites.visible = flag;
  }

  showOfflineRobots(flag) {
    Object.keys(this.info.robotMap).forEach((key) => {
      const { status, robotContainer } = this.info.robotMap[key];
      status === -1 && (robotContainer.visible = flag);
    });
  }

  showRobotsPath(flag) {
    Object.keys(this.info.robotMap).forEach((key) => {
      const { robotContainer } = this.info.robotMap[key];
      robotContainer.getChildAt(4).visible = flag;
    });
  }

  showRobotsId(flag) {
    Object.keys(this.info.robotMap).forEach((key) => {
      const { robotContainer } = this.info.robotMap[key];
      robotContainer.getChildAt(1).visible = flag;
    });
  }

  showContainers(flag) {
    this.building.floors[0].containerSprites.visible = flag;
  }

  showContainerId(flag) {
    Object.keys(this.info.containerMap).forEach((key) => {
      const { containerContainer } = this.info.containerMap[key];
      containerContainer.getChildAt(3).visible = flag;
    });
  }

  showContainersType(value) {
    const setContainersColorBy = {
      type() {
        Object.keys(this.info.containerMap).forEach((key) => {
          const { type, containerContainer } = this.info.containerMap[key];
          containerContainer.getChildAt(0).tint = calcShapeColorByType(type);
        });
      },
      frequence() {
        Object.keys(this.info.containerMap).forEach((key) => {
          const { frequence, containerContainer } = this.info.containerMap[key];
          containerContainer.getChildAt(0).tint = calcShapeColorByFrquence(frequence);
        });
      },
    };
    setContainersColorBy[value].call(this);
  }

  showTerminals(flag) {
    this.building.floors[0].terminalSprites.visible = flag;
  }

  updateModel() {
    const modeStatus = store.state.modeStatus;
    console.log('updateModel modeStatus =', modeStatus);

    if (modeStatus !== 'edit') {
      sprites.hoverBorder.visible = false;
      sprites.toBorder.visible = false;
      sprites.fromBorder.visible = false;
    }

    // // 进入批量模式，楼层接收事件
    // if (model === 'batch') {
    //   this.selectedContainers = {}
    //   for (let key in building.floors) {
    //     building.floors[key].floorSprite.interactive = true
    //   }
    // }

    // // 退出批量模式，楼层取消接收事件
    // if (oldModel === 'batch' && model !== 'batch') {
    //   params.onSelectContainers = false

    //   for (let key in building.floors) {
    //     building.floors[key].floorSprite.interactive = false
    //   }

    //   // 取消之前选中的全部货架的高亮
    //   for (let containerId in this.selectedContainers) {
    //     this.selectedContainers[containerId].containerContainer.getChildAt(2).visible = false
    //   }

    //   this.selectedContainers = {}
    // }
  }
}

export default Scene;
