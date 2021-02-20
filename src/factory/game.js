import {
  Mesh,
  Scene,
  Color,
  Clock,
  Sprite,
  Vector2,
  Vector3,
  MOUSE, TOUCH,
  BufferGeometry,
  MeshStandardMaterial,
  BoxBufferGeometry,
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  WebGLRenderer,
  TextureLoader,
  PMREMGenerator,
  MeshPhongMaterial,
  PlaneBufferGeometry,
  LinearToneMapping,
  InstancedMesh,
  Object3D,
  InstancedBufferAttribute,
  MeshBasicMaterial,
  CanvasTexture,
  LineBasicMaterial,
  Geometry,
  Line, LineLoop,
  Raycaster,
} from 'three';
import storage from '@/utils/storage';
import store from '@/store/index.js';
import { base64ToBlob } from '@/utils/help.js'; // thottle, 
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import onBeforeCompile from './utils/compile.js';

const TweenMax = window.gsap; // 在index.html中引入了gsap.min.js
// const { params } = store.state.factory;
let timeS = 0;
const model = {};
const spaceGap = 0; // space 之间是否留空隙，默认为 0
const spaceSize = 100;
const clock = new Clock();
const fps = 24;
const renderT = 1 / fps;
let modelLoadedCB;
const floorHeight = 1000;
const instanceMesh = {};
const raycaster = new Raycaster();
const mouse = new Vector2(1, 1);
let onOverSpace, mouseHolding, draging;
let onOver = {};
let moveDuration = 1.2; // 移动速度
let waitingMoveList = {};
const spaceMapByIndex = {};

const spaceColorMap = {
  '-1': new Color(0xFF3296), // for status
  1: new Color(0xbbd9fb),
  0: new Color(0xa8abb5),
  2: new Color(0xf91d00),
  3: new Color(0xC6F7C5),
  4: new Color(0x158000),
  5: new Color(0x00ffff),
  6: new Color(0x000000),
  7: new Color(0xFEF535),
  8: new Color(0xbb970e),
  10: new Color(0xbb970e),
  11: new Color(0xff7cbb),
};

const terminalColorMap = {
  0: new Color(0x808080),
  1: new Color(0x158000),
  2: new Color(0xf91d00),
};

function createRect(w, l) {
  const textureLoader = new TextureLoader();
  const texture = textureLoader.load('textures/space.jpg');
  const material = new MeshPhongMaterial({ map: texture });
  const geometry = new PlaneBufferGeometry(w, l);
  geometry.rotateX(-Math.PI / 2);
  return new Mesh(geometry, material);
}

function objLoader(name, type, scale) {
  return new Promise((resolve) => {
    new MTLLoader().setPath('model/').load(`${name}.mtl`, (materials) => {
      materials.preload();
      new OBJLoader().setMaterials(materials).setPath('model/').load(`${name}.obj`, (_model) => {
        _model.name = name;
        scale && _model.scale.setScalar(scale);
        _model.traverse((object) => {
          if (object.isMesh) object.castShadow = true;
        });
        if (type === 'robot') {
          const warnSprite = model.robotWarnSprite.clone();
          _model.add(warnSprite);
        }
        resolve(_model);
      });
    });
  });
}

async function loaderObjs() {
  model.robotWarnSprite = new Sprite();
  model.robotWarnSprite.name = 'robotWarnSprite';
  model.robotWarnSprite.scale.set(400, 200);
  model.robotWarnSprite.center.set(0.2, -0.1);
  model.robotWarnSprite.visible = false;
  const modelLL = [
    objLoader('container0', 'container'),
    objLoader('charger'),
    objLoader('fenjianqiang_worker'),
    objLoader('MP700', 'robot'),
    objLoader('MMC1000', 'robot'),
    objLoader('container_tuopan1', 'container'),
  ];
  const models = await Promise.all(modelLL);
  model.container1 = models[0];
  model.charger = models[1];
  model.fenjianqiang = models[2];
  model.MP700 = model.MP1300 = models[3];
  model.MMC1000 = models[4];
  model.container0 = models[5];
  modelLoadedCB();
}

function getTerminalId(text) {
  const width = 512, height = 512;
  const canvas = document.createElement('canvas');
  // 创建画布大小
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const gap = 10;
  // 吊牌链
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(width * 0.25, height * 0.5);
  ctx.lineTo(width * 0.5, height * 0.25);
  ctx.lineTo(width * 0.75, height * 0.5);
  ctx.stroke();
  // 钉子
  ctx.lineWidth = 20;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.25, 10, 0, 2 * Math.PI);
  ctx.fill();
  // 吊牌主体
  ctx.fillStyle = '#cccccc';
  ctx.beginPath();
  ctx.moveTo(gap, height * 0.5);
  ctx.lineTo(width - gap, height * 0.5);
  ctx.lineTo(width - gap, height - gap);
  ctx.lineTo(gap, height - gap);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  // 创建文字
  ctx.font = '100px " bold';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, width / 2, (height - 75));
  return canvas;
}

function createRobotPath(vertices, color1 = '0xff0000', color2 = '0x0000ff') {
  const material = new LineBasicMaterial({
    vertexColors: true,
    linewidth: 2, // 默认为1，暂时无法修改
  });
  const geometry = new Geometry();
  geometry.colors.push(
    new Color(color1),
    new Color(color2),
  );
  geometry.vertices = vertices;
  const robotPath = new Line(geometry, material);
  robotPath.name = 'robotPath';
  return robotPath;
}

function createRectBorder(w, l, color) {
  const material = new LineBasicMaterial({
    color,
    linewidth: 2, // 默认为1，暂时无法修改
  });
  const wHalf = w / 2;
  const hHalf = l / 2;
  const geometry = new Geometry();
  geometry.vertices.push(
    new Vector3(-wHalf, 0, -hHalf),
    new Vector3(wHalf, 0, -hHalf),
    new Vector3(wHalf, 0, hHalf),
    new Vector3(-wHalf, 0, hHalf),
  );
  const rectBorder = new LineLoop(geometry, material);
  rectBorder.visible = false;
  return rectBorder;
}

export default class Game {
  constructor(viewBox, warehouseInfo, cb, events) {
    modelLoadedCB = cb;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.viewBox = viewBox;
    this.events = events;
    this.domW = this.viewBox.clientWidth;
    this.domH = this.viewBox.clientHeight;
    const { mapLength, mapWidth } = warehouseInfo;
    this.spaceWidth = 1;
    this.spaceLength = 1;
    this.mapWidth = mapWidth;
    this.mapLength = mapLength;
    model.rect = createRect(this.spaceLength * 100 - spaceGap, this.spaceWidth * 100 - spaceGap);
    this.info = {}; // 场景内容信息
    this.containerTypeMap = {};
    this.workerMeshList = [];
    this.init();
  }

  // 数据初始化
  initReset() {
    this.info = {
      floorsCount: 1,
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
      chargerMap: {}, // 充电桩信息
      terminalMap: {}, // 工作站信息
      containerMap: {}, // 货架信息
    };
  }

  init() {
    this.initScene(); // 场景
    this.initCamera(); // 相机
    this.initLight(); // 灯光
    this.initBackground(); // 背景
    this.initGround(); // 地面
    this.initControls(); // 控制(鼠标缩放,平移,旋转)
    this.initEvents();
    this.render();
    loaderObjs();
  }

  initScene() {
    this.scene = new Scene();
    this.renderer = new WebGLRenderer({
      antialias: true,
      canvas: this.viewBox,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.domW, this.domH);
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = LinearToneMapping;
    new PMREMGenerator(this.renderer).compileEquirectangularShader();
  }

  initCamera() {
    this.camera = new PerspectiveCamera(30, this.domW / this.domH, 1, 300000);
    this.camera.position.set(this.mapLength * 100 / 2, 3000, this.mapWidth * 100 * 1.3);
    this.scene.add(this.camera);
  }

  initLight() {
    this.scene.add(new AmbientLight(0xffffff));
    const light = new DirectionalLight(0x333333, 0.5);
    light.position.set(0, 200, 0);
    light.position.multiplyScalar(1.5);
    light.castShadow = true;
    light.shadow.mapSize.set(4096, 4096); // 阴影的分辨率，值越大阴影越清晰明显，但是性能消耗也越大。默认值为512*512
    light.shadow.camera.left = 0;
    light.shadow.camera.right = this.mapLength * spaceSize;
    light.shadow.camera.top = 0;
    light.shadow.camera.bottom = -this.mapWidth * spaceSize;
    light.shadow.camera.near = 0;
    light.shadow.camera.far = 350;
    this.scene.add(light);
  }

  initBackground() {
    this.scene.background = new Color(0xffffff);
  }

  initGround() {
    const x = this.mapLength * 100;
    const z = this.mapWidth * 100;
    const y = 20;
    const gap = 200;
    const geometry = new BoxBufferGeometry(x + gap, y, z + gap);
    const material = new MeshStandardMaterial({ color: 0xa8abb5 });
    const floorMesh = new Mesh(geometry, material);
    const floor1 = floorMesh.clone();
    floor1.material.depthTest = false;
    floor1.position.set(x / 2, -y / 2, z / 2);
    floor1.receiveShadow = true;
    this.scene.add(floor1);
  }

  initControls() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.mouseButtons = {
      LEFT: MOUSE.PAN,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.ROTATE,
    };
    controls.touches = {
      ONE: TOUCH.PAN,
      TWO: TOUCH.DOLLY_ROTATE,
    };
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI * 0.5; // 能够垂直旋转的角度的上限，范围是 0 到 Math.PI，其默认值为 Math.PI
    // 缩放限制
    controls.minDistance = 1000;
    controls.maxDistance = 10000;
    // 是否开启右键拖拽
    controls.enablePan = true; // 是否启用相机平移
    controls.enableRotate = true; // 是否启用相机旋转, 移动设备可能需要设置为禁止旋转
    controls.screenSpacePanning = false; // 新版three.js需要添加该属性控制鼠标平移的时候摄像机的方向
    controls.target = new Vector3(this.mapLength * 100 / 2, 0, this.mapWidth * 100 * 0.8); // 接管相机的 lookAt
    controls.update();
    this.controls = controls;
    this.controls.saveState();
  }

  testRaycaster() {
    // 通过摄像机和鼠标位置更新射线
    raycaster.setFromCamera(mouse, this.camera);
    // 计算物体和射线的焦点
    const intersection = raycaster.intersectObject(instanceMesh.spacesMesh);
    if (intersection.length > 0) { // mouseenter
      const instance = intersection[0];
      if (onOver.object !== instance.object || onOver.instanceId !== instance.instanceId) {
        onOver = instance;
        onOverSpace = spaceMapByIndex[onOver.instanceId];
        const { spaceId } = onOverSpace;
        const space = this.info.spaceMap[spaceId];
        const { posX, posY, posZ, robotId, status, containerId, terminalId } = space;
        instanceMesh.spaceHoverBorderMesh.position.set(onOverSpace.x, onOverSpace.y, onOverSpace.z);
        instanceMesh.spaceHoverBorderMesh.visible = true;
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
      }
      return;
    }
    store.commit('CONFIG_RESET');
    if (onOver.object && onOver.instanceId !== undefined) {
      onOver = {};
      onOverSpace = undefined;
      instanceMesh.spaceHoverBorderMesh.visible = false;
    }
  }

  spaceSelectArr = [];

  updateModel() {
    const modeStatus = store.state.modeStatus;
    // 退出编辑模式
    if (modeStatus !== 'edit') {
      this.clearSpaceBorderMesh();
    }
  }

  updateContainerInfo(cid) {
    const from = this.info.spaceMap[this.spaceSelectArr[0]];
    const to = this.info.spaceMap[this.spaceSelectArr[1]];
    from.containerId = null;
    to.containerId = cid;
    // const container = this.info.containerMap[cid];
    this.clearSpaceBorderMesh();
  }
  
  moveRobot(rid) {
    const from = this.info.spaceMap[this.spaceSelectArr[0]];
    const to = this.info.spaceMap[this.spaceSelectArr[1]];
    from.robotId = null;
    to.robotId = rid;
    this.clearSpaceBorderMesh();
  }

  clearSpaceBorderMesh() {
    this.spaceSelectArr = [];
    instanceMesh.spaceRightSelBorderMesh.visible = false;
    instanceMesh.spaceLeftSelBorderMesh.visible = false;
    store.commit('SET_HOVER_SPACE_INFO', {});
    store.commit('SET_TO_SPACE_INFO', {});
  }

  initEvents() {
    this.viewBox.addEventListener('pointerdown', () => {
      mouseHolding = true;
    }, false);
    this.viewBox.addEventListener('pointerup', (e) => {
      mouseHolding = false;
      if (draging) { // 发生了拖拽
        draging = false;
      } else {
        const modeStatus = store.state.modeStatus;
        // 标记地板模式
        if (modeStatus === 'mark' && onOverSpace) {
          this.events.onSpaceClick(onOverSpace, modeStatus);
        }
        // 编辑模式
        if (modeStatus === 'edit') {
          if (e.button === 0) {
            // 点击左键
            if (onOverSpace) {
              if (this.spaceSelectArr[0] === onOverSpace.spaceId) {
                this.clearSpaceBorderMesh();
                return;
              }
              if (this.spaceSelectArr[1] === onOverSpace.spaceId) {
                instanceMesh.spaceRightSelBorderMesh.visible = false;
                this.spaceSelectArr[1] = null;
                store.commit('SET_TO_SPACE_INFO', {});
              }
              const { x, y, z } = onOverSpace;
              instanceMesh.spaceLeftSelBorderMesh.position.set(x, y, z);
              instanceMesh.spaceLeftSelBorderMesh.visible = true;
              store.commit('SET_HOVER_SPACE_INFO', onOverSpace);
              this.spaceSelectArr[0] = onOverSpace.spaceId;
            }
          } else if (e.button === 2) {
            // 点击右键
            if (onOverSpace) {
              if (!this.spaceSelectArr[0]
                || this.spaceSelectArr[0] === onOverSpace.spaceId
                || this.spaceSelectArr[1] === onOverSpace.spaceId) {
                instanceMesh.spaceRightSelBorderMesh.visible = false;
                this.spaceSelectArr[1] = null;
                store.commit('SET_TO_SPACE_INFO', {});
                return;
              }
              const { x, y, z } = onOverSpace;
              instanceMesh.spaceRightSelBorderMesh.position.set(x, y, z);
              instanceMesh.spaceRightSelBorderMesh.visible = true;
              store.commit('SET_TO_SPACE_INFO', onOverSpace);
              this.spaceSelectArr[1] = onOverSpace.spaceId;
            }
          }
        }
      }
    }, false);
    this.viewBox.addEventListener('mousemove', (event) => {
      event.preventDefault();
      const getBoundingClientRect = this.viewBox.getBoundingClientRect();
      mouse.x = ((event.clientX - getBoundingClientRect.left) / this.domW) * 2 - 1;
      mouse.y = -((event.clientY - getBoundingClientRect.top) / this.domH) * 2 + 1;
      mouseHolding && (draging = true); // 发生了拖拽
    }, false);
    // 添加辅助模型，如 spaceBorderOfHover、spaceBorderOfLeft、spaceBorderOfRight
    instanceMesh.spaceHoverBorderMesh = createRectBorder(this.spaceLength * 100, this.spaceWidth * 100, 0x0000ff);
    this.scene.add(instanceMesh.spaceHoverBorderMesh);
    instanceMesh.spaceLeftSelBorderMesh = createRectBorder(this.spaceLength * 100, this.spaceWidth * 100, 0xff0000);
    this.scene.add(instanceMesh.spaceLeftSelBorderMesh);
    instanceMesh.spaceRightSelBorderMesh = createRectBorder(this.spaceLength * 100, this.spaceWidth * 100, 0x00ff00);
    this.scene.add(instanceMesh.spaceRightSelBorderMesh);
    window.addEventListener('resize', this.onWindowResize.bind(this));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        moveDuration = 0;
      } else {
        moveDuration = 1.2;
      }
    }, false);
  }

  onWindowResize() {
    setTimeout(() => {
      const gameView = document.getElementById('gameView');
      this.domW = gameView.clientWidth;
      this.domH = gameView.clientHeight;
      // const dom = document.getElementById('gameBox');
      // this.camera.aspect = dom.clientWidth / dom.clientHeight;
      // this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.domW, this.domH);
    }, 0);
  }

  render = () => {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    const scadaStatus = storage.get('scada_status');
    if (scadaStatus === '3D') {
      const t = clock.getDelta();
      timeS += t;
      if (timeS > renderT) {
        this.testRaycaster();
        this.render();
        timeS = 0;
      }
    }
  }

  destroy() {
    // TODO clear scene
  }

  empty(elem) {
    while (elem.lastChild) elem.removeChild(elem.lastChild);
  }

  updateContainersType(containerTypeMap) {
    this.containerTypeMap = containerTypeMap;
  }

  initData(data) {
    this.initReset();
    const { spaces, containers, robots, terminals } = data;
    if (spaces) {
      this.info.spaceCount = spaces.length;
      this.initSpaces(spaces);
    }
    if (terminals) {
      this.info.terminalCount.sum = terminals.length;
      this.initTerminals(terminals);
    }
    if (robots) {
      this.info.robotCount.sum = robots.length;
      this.initRobots(robots);
    }
    if (containers) {
      this.info.containerCount = containers.length;
      this.initContainers(containers);
    }
    this.animate();
    return Promise.resolve(this.info);
  }

  updateData(data) {
    const { spaces, containers, robots, terminals } = data;
    spaces && this.updateSpaces(spaces);
    terminals && this.updateTerminals(terminals);
    robots && this.updateRobots(robots);
    containers && this.updateContainers(containers);
    this.doMove();
    return Promise.resolve(this.info);
  }

  updateSpaces(spaces) {
    const spaceColorList = instanceMesh.spacesMesh.geometry.attributes.instanceColor;
    spaceColorList.needsUpdate = false;
    const length = spaces.length;
    for (let i = 0; i < length; i++) {
      const { spaceId, status: nStatus, type, } = spaces[i];
      spaces[i].spaceId === '413' && console.log('spaces', spaces[i]);
      const oSpace = this.info.spaceMap[spaceId];
      oSpace.containerId = null; // TODO 2D 3D切换的时候清除一下，updateContainer的时候重新赋值
      const { index, status: oStatus } = oSpace;
      if (nStatus !== oStatus) {
        const { r, g, b } = spaceColorMap[nStatus === 1 ? -1 : type];
        spaceColorList.setXYZ(index, r, g, b);
        oSpace.status = nStatus;
      }
    }
    spaceColorList.needsUpdate = true;
  }

  updateTerminals(terminals) {
    const length = terminals.length;
    for (let i = 0; i < length; i++) {
      const { terminalId, status: nStatus } = terminals[i];
      const oTerminal = this.info.terminalMap[terminalId];
      const { status: oStatus, mesh } = oTerminal;
      if (nStatus !== oStatus) {
        mesh[0].material.color = mesh[1].material.color = terminalColorMap[nStatus];
        this.info.terminalMap[terminalId] = terminals[i];
      }
    }
  }

  updateRobots(robots) {
    const length = robots.length;
    for (let i = 0; i < length; i++) {
      const robot = robots[i];
      const { robotId, spaceId: meshToSpaceId, endId: endIdNew, status } = robot;
      const endId = endIdNew.split(',')[0];
      const fromRobot = this.info.robotMap[robotId];
      if (!fromRobot) continue;
      const pathToSpace = this.info.spaceMap[endId];
      const { mesh, spaceId: meshFromSpaceId } = fromRobot;
      // 切换警告图标可见性
      const robotWarnSprite = mesh.getObjectByName('robotWarnSprite');
      if (robotWarnSprite.userData.status !== status) {
        if (status > 10) {
          robotWarnSprite.material = this.createRobotWarnMat(`${robotId}, e${status}`);
          robotWarnSprite.visible = true;
        } else {
          robotWarnSprite.visible = false;
        }
        robotWarnSprite.userData.status = status;
        fromRobot.status = status;
      }
      const robotPathMesh = mesh.getObjectByName('robotPath');
      const { x, y, z } = this.info.spaceMap[meshToSpaceId]; // 机器新的 space 位置
      const { x: cx, y: cy, z: cz } = mesh.position; // 机器当前所处位置
      const { x: px, y: py, z: pz } = pathToSpace; // 路径终点新的位置
      const robotPathPoint2 = robotPathMesh.geometry.vertices[1]; // 路径终点坐标
      const oldTweenOfPath = TweenMax.getTweensOf(robotPathPoint2)[0];
      oldTweenOfPath && oldTweenOfPath.kill();
      let flagX = 0, flagZ = 0;
      if (x !== cx) flagX = 1;
      if (z !== cz) flagZ = -1;
      const count = flagX + flagZ;
      if (count === 1) { // x 变了， z 没变， 路径 z 为 0， x 取差值
        robotPathPoint2.set(px - cx, py - cy, 0);
      } else if (count === -1) { // x 没变， z 变了， 路径 x 为 0， z 取差值
        robotPathPoint2.set(0, py - cy, pz - cz);
      } else { // 都变了或都没变
        robotPathPoint2.set(px - cx, py - cy, pz - cz);
      }
      robotPathMesh.geometry.verticesNeedUpdate = true;
      waitingMoveList[meshToSpaceId] = {
        px: flagZ ? 0 : px - x,
        py: py - y,
        pz: flagX ? 0 : pz - z,
        robotPathPoint2,
        robotPathMesh,
      };
      if (meshFromSpaceId !== meshToSpaceId) { // 机器移动
        fromRobot.spaceId = meshToSpaceId;
        const oldTweenOfMesh = TweenMax.getTweensOf(mesh.position)[0];
        oldTweenOfMesh && oldTweenOfMesh.kill();
        waitingMoveList[meshToSpaceId] = Object.assign(waitingMoveList[meshToSpaceId], { x, y, z, robotMesh: mesh });
      }
    }
  }

  // 新增货架
  addContainer(container) {
    this.info.containerCount++; // 货架数量增加
    const { containerId, spaceId, orientation, type } = container;
    const { width, length, height } = this.containerTypeMap[type];
    const meshToSpace = this.info.spaceMap[spaceId];
    meshToSpace.containerId = containerId;
    const { posX, posY, x, y, z } = meshToSpace;
    const mesh = (model[`container${type}`] || model.container0).clone();
    mesh.visible = true;
    mesh.position.set(x, y, z);
    type === 0
      ? mesh.scale.set(width * 2, length * 2, height * 2)
      : mesh.scale.set(width * 2, length * 2, height);
    // 初始化时 orientation 为 0 的话不转向，使用原始角度
    orientation && (mesh.rotation.y = -Math.PI / 2 * orientation);
    this.scene.add(mesh);
    container.mesh = mesh;
    this.info.containerMap[containerId] = { posX, posY, ...container };
  }

  removeContainer(containerId) {
    const container = this.info.containerMap[containerId];
    this.scene.remove(container.mesh);
    delete this.info.containerMap[containerId];
    this.info.containerCount--; // 货架数量减少
  }

  updateContainers(containers) {
    const length = containers.length;
    for (let i = 0; i < length; i++) {
      const container = containers[i]; // 新的 container 信息
      container.containerId === 'C149' && console.log('container.containerId', container);
      const meshToSpaceId = container.spaceId; // 新的 spaceId
      const meshToSpace = this.info.spaceMap[meshToSpaceId];
      if (!meshToSpace) {
        meshToSpace.containerId = null;
        continue; // 过滤掉
      }
      const { posX, posY } = meshToSpace;
      meshToSpace.containerId = container.containerId;
      const fromContainer = this.info.containerMap[container.containerId]; // 旧的 container 信息
      if (!fromContainer) {
        this.addContainer(container);
        continue;
      }
      fromContainer.posX = posX;
      fromContainer.posY = posY;
      const { mesh, spaceId: meshFromSpaceId } = fromContainer;
      container.orientation != null && (mesh.rotation.y = -Math.PI / 2 * container.orientation);
      // 更新时 orientation 为 0 的话需要转回原始方向
      if (meshFromSpaceId !== meshToSpaceId) { // 货架移动
        fromContainer.spaceId = meshToSpaceId;
        const { x, y, z } = this.info.spaceMap[meshToSpaceId];
        const oldTweenOfMesh = TweenMax.getTweensOf(mesh.position)[0];
        oldTweenOfMesh && oldTweenOfMesh.kill();
        const waitingTo = waitingMoveList[meshToSpaceId];
        if (waitingTo) {
          waitingTo.containerMesh = mesh;
        } else {
          waitingMoveList[meshToSpaceId] = { x, y, z, containerMesh: mesh };
        }
      }
    }
  }

  doMove() {
    Object.keys(waitingMoveList).forEach((spaceId) => {
      const { x, y, z, robotMesh, containerMesh, px, py, pz, robotPathPoint2, robotPathMesh } = waitingMoveList[spaceId];
      robotPathPoint2 && TweenMax.to(robotPathPoint2, moveDuration, {
        x: px,
        y: py,
        z: pz,
        onUpdate: () => {
          robotPathMesh.geometry.verticesNeedUpdate = true;
        },
      });
      robotMesh && TweenMax.to(robotMesh.position, moveDuration, { x, y, z });
      containerMesh && TweenMax.to(containerMesh.position, moveDuration, { x, y, z });
    });
    waitingMoveList = {};
  }

  initSpaces(spaces) {
    const spaceColorList = [];
    const length = spaces.length;
    const mesh = model.rect.clone();
    instanceMesh.spacesMesh = new InstancedMesh(mesh.geometry, mesh.material, length);
    instanceMesh.spacesMesh.receiveShadow = true;
    const transform = new Object3D();
    for (let i = 0; i < length; i++) {
      const space = spaces[i];
      const { posX, posY, posZ = 0, spaceId, type, status } = space;
      const x = space.x = posY * 100;
      const y = space.y = posZ * floorHeight;
      const z = space.z = posX * 100;
      space.index = i;
      this.info.spaceMap[spaceId] = space;
      spaceMapByIndex[i] = space;
      transform.position.set(x, y, z);
      transform.updateMatrix();
      instanceMesh.spacesMesh.setMatrixAt(i, transform.matrix);
      const { r, g, b } = spaceColorMap[status === 0 ? type : -1];
      spaceColorList.push(r, g, b);
      if (type === 7) { // charger
        const chargerMesh = model.charger.clone();
        chargerMesh.position.set(x, y, z);
        chargerMesh.rotation.y = 0; // 多次添加旋转角度不会叠加
        this.scene.add(chargerMesh);
        // 充电桩数量统计
        this.info.spaceCountOfCharger++;
      } else if (type === 8) { // worker
        const workerMesh = model.fenjianqiang.clone();
        workerMesh.position.set(x, y, z);
        workerMesh.rotateY(0);
        this.workerMeshList.push(workerMesh);
        this.scene.add(workerMesh);
      }
    }
    mesh.geometry.setAttribute('instanceColor', new InstancedBufferAttribute(new Float32Array(spaceColorList), 3));
    mesh.material.onBeforeCompile = onBeforeCompile;
    this.scene.add(instanceMesh.spacesMesh); // 添加 space 点位, 不需要显示则无需执行该行
    // 绘制路径
    for (let i = 0; i < spaces.length; i++) {
      const { x, y, z, linkId } = spaces[i];
      if (linkId) {
        const linkIds = linkId.trim().split(' ');
        linkIds.forEach((toId) => {
          const { x: x1, y: y1, z: z1 } = this.info.spaceMap[toId];
          const vertices = [
            new Vector3(x, y, z),
            new Vector3(x1, y1, z1),
          ];
          const robotPathMesh = createRobotPath(vertices, 0x000000, 0x000000);
          instanceMesh.spacesMesh.add(robotPathMesh);
        });
      }
    }
  }

  initTerminals(terminals) {
    const geometry = new PlaneBufferGeometry(100, 100);
    model.terminalId = new Mesh(geometry);
    for (let i = 0, len = terminals.length; i < len; i++) {
      const terminal = terminals[i];
      const { terminalId, spaceId, status } = terminal;
      const meshToSpaceId = this.info.spaceMap[spaceId];
      meshToSpaceId.terminalId = terminalId;
      if (!meshToSpaceId) {
        console.error(`The terminal of ${terminalId} use a invalid spaceId: ${spaceId}`);
        continue;
      }
      this.info.terminalCount[`terminalCountOf${status}`]++;
      const { posX, posY, posZ, x, z } = meshToSpaceId;
      const mesh = model.terminalId.clone();
      const mat = new MeshBasicMaterial({
        map: new CanvasTexture(getTerminalId(terminalId)),
        color: terminalColorMap[status],
        transparent: true,
        opacity: 0.95,
      });
      mesh.material = mat.clone();
      mesh.position.set(x, 250, z);
      this.scene.add(mesh);
      const mesh2 = mesh.clone();
      mesh2.rotateY(-Math.PI);
      this.scene.add(mesh2);
      terminal.index = i;
      terminal.mesh = [mesh, mesh2];
      this.info.terminalMap[terminalId] = { terminalId, spaceId, posX, posY, posZ, status };
      this.info.terminalMap[terminalId].mesh = [mesh, mesh2];
    }
  }

  initRobots(robots) {
    this.info.robotMap = {};
    const length = robots.length;
    for (let i = 0; i < length; i++) {
      const robot = robots[i];
      const { robotId, spaceId, status, endId: endIdNew, version } = robot;
      const endId = endIdNew.split(',')[0];
      // 屏蔽离线状态的机器
      // if (status === -1) continue;
      const meshToSpace = this.info.spaceMap[spaceId];
      meshToSpace.robotId = robotId;
      const { posX, posY, posZ, x, y, z } = meshToSpace;
      robot.posX = posX;
      robot.posY = posY;
      robot.posZ = posZ;
      const mesh = (model[version] || model.MP700).clone();
      mesh.position.set(x, y, z);
      if (status > 10) {
        const robotWarnSprite = mesh.getObjectByName('robotWarnSprite');
        robotWarnSprite.material = this.createRobotWarnMat(`${robotId}, e${status}`);
        robotWarnSprite.userData.status = status;
        robotWarnSprite.visible = true;
        this.info.robotCount.robotCountOf99++;
      }
      this.info.robotCount[`robotCountOf${status}`]++;
      // -------------------------- 机器路径 开始
      if (endId) {
        const pathToSpace = this.info.spaceMap[endId];
        const { x: px, y: py, z: pz } = pathToSpace;
        const vertices = [
          new Vector3(0, 0, 0),
          new Vector3(px - x, py - y, pz - z),
        ];
        const robotPathMesh = createRobotPath(vertices);
        mesh.add(robotPathMesh);
      }
      // -------------------------- 机器路径 结束
      if (status !== -1) this.scene.add(mesh);
      robot.mesh = mesh;
      this.info.robotMap[robotId] = robot;
    }
  }
  
  initContainers(containers) {
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      const { containerId, spaceId, orientation, status, type } = container;
      // 屏蔽物理上已经移除的货架
      if (status === -9) continue;
      const { width, length, height } = this.containerTypeMap[type];
      const meshToSpace = this.info.spaceMap[spaceId];
      meshToSpace.containerId = containerId;
      const { posX, posY, x, y, z } = meshToSpace;
      const mesh = (model[`container${type}`] || model.container0).clone();
      mesh.position.set(x, y, z);
      type === 0
        ? mesh.scale.set(width * 2, length * 2, height * 2)
        : mesh.scale.set(width * 2, length * 2, height);
      // 初始化时 orientation 为 0 的话不转向，使用原始角度
      orientation && (mesh.rotation.y = -Math.PI / 2 * orientation);
      this.scene.add(mesh);
      container.mesh = mesh;
      this.info.containerMap[containerId] = { posX, posY, ...container };
    }
  }

  zoom(offset) {
    offset ? this.camera.fov += offset : this.camera.fov = 30;
    this.camera.updateProjectionMatrix();
  }

  takeScreenshot() {
    const canvas = this.renderer.domElement;
    this.renderer.render(this.scene, this.camera);
    const imgUrl = base64ToBlob(canvas.toDataURL('image/png'));
    const a = document.createElement('a');
    document.body.append(a);
    a.download = 'screenshot';
    a.href = URL.createObjectURL(imgUrl);
    a.click();
    a.remove();
  }

  showSpaces(flag) {
    instanceMesh.spacesMesh.visible = flag;
  }

  showRobots(flag) {
    Object.keys(this.info.robotMap).forEach((key) => {
      this.info.robotMap[key].mesh.visible = flag;
    });
  }

  showContainers(flag) {
    Object.keys(this.info.containerMap).forEach((key) => {
      this.info.containerMap[key].mesh.visible = flag;
    });
  }

  showTerminals(flag) {
    this.workerMeshList.forEach((item) => {
      item.visible = flag;
    });
    Object.keys(this.info.terminalMap).forEach((key) => {
      this.info.terminalMap[key].mesh[0].visible = flag;
      this.info.terminalMap[key].mesh[1].visible = flag;
    });
  }

  reset() {
    this.controls.reset();
  }
}
