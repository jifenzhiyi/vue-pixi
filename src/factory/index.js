import * as PIXI from 'pixi.js';
import store from '@/store/index.js';
import colorConfig from '@/utils/colorConfig.js';
import { thottle } from '@/utils/help.js';
import { isPC } from '@/utils/device.js';
import sound from './sound';
import { createGraphics, loadTextures, getMinAndSec } from './func.js';

let nowStamp;
const deviceIsPC = isPC();
const { params } = store.state.factory;
const floorPadding = 10;
const floorMargin = 20;
const sprites = { rect: null };

class Scene {
  constructor(el, warehouseInfo, events, spaceInfoBox) {
    this.el = el;
    this.spaceInfoBox = spaceInfoBox;
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
    this.textures = null;
    this.allowSound = false; // 提示音
    loadTextures().then((res) => {
      this.textures = res;
      this.createScene(el); // 场景创建
      this.events.onInitWS && this.events.onInitWS();
    });
  }

  resize() {
    this.el.style.display = 'none';
    this.app && this.app.renderer.resize(this.el.parentElement.clientWidth, this.el.parentElement.clientHeight);
    this.el.style.display = 'block';
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
    // 特殊容器 手势边框等等
    floor.other = new PIXI.Container();
    floor.other.name = 'other';
    floor.other.position.set(floorPadding, floorPadding);
    floorContainer.addChild(floor.other);
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
    nowStamp = +new Date();
    const { spaces, terminals, robots } = data; // containers, containerDetail
    spaces && this.initSpaces(spaces);
    terminals && this.initTerminals(terminals);
    robots && this.initRobots(robots);
    // containers && this.initContainers(containers, containerDetail)
    sprites.hoverBorder = createGraphics(
      this.spaceWidth,
      this.spaceLength,
      this.colorConfig.hoverBorderColor,
      'hoverBorder',
    );
    // sprites.fromBorder = createGraphics(this.spaceWidth, this.spaceLength, this.colorConfig.fromBorderColor, 'fromBorder')
    // sprites.toBorder = createGraphics(this.spaceWidth, this.spaceLength, this.colorConfig.toBorderColor, 'toBorder')
    this.building.buildingContainer.addChild(sprites.hoverBorder); // , sprites.fromBorder, sprites.toBorder
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
      if (deviceIsPC) {
        // 添加事件
        spaceSprite.interactive = true;
        spaceSprite.on('mouseover', this.spaceMouseOver.bind(spaceSprite, space, this));
        spaceSprite.on('mouseout', this.spaceMouseOut.bind(spaceSprite, this));
        // spaceSprite.on('click', this.spaceUp.bind(spaceSprite, space, this))
        // spaceSprite.on('rightclick', this.spaceRightUp.bind(spaceSprite, space, this))
      }
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
    // linkId
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
      const { robotId, spaceId, orientation, status } = robot;
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
      idSprite.visible = false;
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
      robot.robotContainer = robotContainer;
      robotSprite.calculateBounds();
      // 机器列表，给右侧栏用
      this.info.robotMap[robotId] = robot;
      // 设置机器颜色、错误代码
      this.setRobotState(robot);
    }
  }

  setRobotState(robot, oldStatus) {
    const { robotId, robotContainer, status } = robot; // spaceId,
    const [robotSprite, , errorTextBox, errorText] = robotContainer.children;
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
        // const robotSpriteTween = TweenMax.getTweensOf(robotSprite.scale)[0]
        // if (robotSpriteTween) {
        //   robotSpriteTween.kill();
        //   robotSprite.scale.set(robotSprite.oldScale);
        // }
      }
    }
  }

  // 添加 warn 计时（时间到达后 显示错误代码，机器变红，闪烁，统计）
  robotStatusControl(robot, oldStatus) {
    const { robotId, robotContainer, status } = robot;
    const [robotSprite, , errorTextBox, errorText] = robotContainer.children;
    robotContainer.errTimer = setTimeout(() => {
      this.allowSound && sound.play();
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
      // const oldScale = robotSprite.oldScale;
      // TweenMax.fromTo(
      //   robotSprite.scale,
      //   0.35,
      //   {
      //     x: oldScale,
      //     y: oldScale,
      //   },
      //   {
      //     x: oldScale * 3,
      //     y: oldScale * 3,
      //     repeat: -1,
      //   },
      // );
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
    const { spaceId, terminalId, robotId, robotStatus, posX, posY, posZ, x, y, z, spaceSprite } = space; // status
    const status = robotStatus || 0;
    sprites.hoverBorder.setParent($root.building.floors[z].other);
    sprites.hoverBorder.position.set(x - 5, y - 5);
    sprites.hoverBorder.visible = true;
    // const container = building.containerMap[spaceId] || {}
    // // 200ms内光标所在的space不变化才显示space信息
    $root.showInfoTimer = setTimeout(() => {
      store.commit('SET_CONFIG_ONE', { key: 'spaceId', value: spaceId });
      store.commit('SET_CONFIG_ONE', { key: 'posX', value: posX });
      store.commit('SET_CONFIG_ONE', { key: 'posY', value: posY });
      store.commit('SET_CONFIG_ONE', { key: 'posZ', value: posZ });
      store.commit('SET_CONFIG_ONE', { key: 'terminalId', value: terminalId || '-' });
      store.commit('SET_CONFIG_ONE', { key: 'robotId', value: robotId || '-' });
      store.commit('SET_CONFIG_ONE', { key: 'robotErr', value: status <= 10 ? '' : status - 10 });
      // e && $root.showLinkedLater()
      // mutations.set('containerId', container.containerId || '-')
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
    const { spaces, terminals, robots } = data; // containers, containerDetail
    spaces && this.updateSpaces(spaces);
    terminals && this.updateTerminals(terminals);
    robots && this.updateRobots(robots);
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
        // containerId,
        // terminalId,
        // frequence,
      } = robot;
      const endIdList = endIdNew ? endIdNew.split(',') : [];
      const endId = endIdList[0]; // endId 第一个坐标点
      const space = this.info.spaceMap[spaceId]; // 当前的位置
      if (!space) continue; // robot对应的space不存在 直接跳过
      const { posX, posY, posZ } = space; // x, y, z
      const oldRobot = this.info.robotMap[robotId]; // 原机器人信息
      oldRobot.lastUpdateTimeStamp = lastUpdateTimeStamp;
      oldRobot.posX = posX;
      oldRobot.posY = posY;
      oldRobot.posZ = posZ;
      if (!oldRobot) continue; // 若oldRobot不存在，则是新增的robot，走robot初始化逻辑
      const { robotContainer, status: oldStatus, orientation: oldOrientation } = oldRobot;
      // spaceId: oldSpaceId,
      const [, , errorTextBox, errorText] = robotContainer.children;
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
      // const oldSpace = this.info.spaceMap[oldSpaceId];
      // const { x: oldX, y: oldY, z: oldZ } = oldSpace;
      // 机器列表，给右侧栏用
      oldRobot.status = status;
      oldRobot.voltage = voltage;
      oldRobot.orientation = orientation;
      // 若机器人 status 变化需要重新设置颜色, orientation 变化需要改变方向
      if (status !== oldStatus || orientation !== oldOrientation) {
        // 设置机器颜色、错误代码
        robot.robotContainer = robotContainer;
        this.setRobotState(robot, oldStatus);
      }
      // todo：以下两行代码移到下方的 if 代码块内
      // const endSpace = this.info.spaceMap[endId]
      // const { x: endX, y: endY } = endSpace // 需要移动的第一个点位
      // this.robotlineTo(space, endSpace, robotContainer);
      // // TODO 节流控制运动轨迹的生成
      // throttle(function () {
      //   if (oldRobot.startId) {
      //     window.Scene.robotlineClear(oldRobot.startId, oldRobot.setTime)
      //     oldRobot.startId = null
      //   }
      //   if (!oldRobot.startId && spaceId !== endId) {
      //     // if (robotId === 'R6') {
      //     //   console.log('endIdNew', endIdNew, 'endId', endId, 'startId', oldRobot.startId)
      //     //   console.log('list', endIdList)
      //     // }
      //     oldRobot.startId = spaceId
      //     window.Scene.robotlineTo2(space, endIdList)
      //   }
      // }, 1000)()
      // if (oldRobot.startId && spaceId === endId) {
      //   this.robotlineClear(oldRobot.startId, oldRobot.setTime)
      //   oldRobot.startId = null
      // }
      // oldRobot.endId = endIdNew
      // if (spaceId !== oldSpaceId) {
      //   oldRobot.spaceId = spaceId
      //   this.robotMapBySpaceId[oldSpaceId] = ''
      //   this.robotMapBySpaceId[spaceId] = oldRobot
      //   // todo: 如果机器人的移动伴随楼层转换，则执行不同的逻辑。包括不需要显示机器的路径（endId 与 spaceId 不同），
      //   if (z !== oldZ) { // 楼层转换
      //     robotContainer.setParent(building.floors[z].robotSprites)
      //     // 添加转换闪烁动画， 如不需要，注释掉即可
      //     let i = 0
      //     const yoyo = setInterval(() => {
      //       i > 5 ? clearInterval(yoyo) : i += 1
      //       robotContainer.setParent(building.floors[i % 2 === 1 ? oldZ : z].robotSprites)
      //     }, 100)
      //   } else { // 同层移动
      //     let offsetX, offsetY
      //     if (spaceId !== oldSpaceId) {
      //       offsetX = x - oldX
      //       offsetY = y - oldY
      //     }
      //     const key = `${oldSpaceId}->${spaceId}`
      //     this.waitingMoveListByRobotId[robotId] = this.waitingMoveList[key] = {
      //       robotContainer, x, y, endX, endY, offsetX, offsetY,
      //     }
      //   }
      //   // 机器列表，给右侧栏用
      //   this.info.robotMap[robotId].spaceId = spaceId
      //   this.info.robotMap[robotId].posX = posX
      //   this.info.robotMap[robotId].posY = posY
      //   this.info.robotMap[robotId].posZ = posZ
      // }
      // oldRobot.containerId = containerId
      // oldRobot.terminalId = terminalId
      // oldRobot.frequence = frequence
    }
    setTimeout(() => {
      this.events.onUpdateInfo(this.info);
    }, params.ErrRobotTimeout * 1000);
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
