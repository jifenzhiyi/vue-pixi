import {
  Mesh,
  Scene,
  Color,
  Clock,
  Sprite,
  Vector2,
  Vector3,
  MOUSE, TOUCH,
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
import store from '@/store/index.js';
import { thottle, base64ToBlob } from '@/utils/help.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import onBeforeCompile from './utils/compile.js';

const { params } = store.state.factory;
let timeS = 0;
const model = {};
const spaceGap = 0; // space 之间是否留空隙，默认为 0
const spaceSize = 100;
const clock = new Clock();
const fps = 24;
const renderT = 1 / fps;
let modelLoadedCB;
let isFirst = true;
const floorHeight = 1000;
const instanceMesh = {};
const defaultMoveDuration = 1.2;
const raycaster = new Raycaster();
const mouse = new Vector2();
let onOverSpace, mouseHolding, draging; // clickLeft, clickRight;
let onOver = {};
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

function createRobotPath(vertices) {
  const material = new LineBasicMaterial({
    vertexColors: true,
    // 定义线条材质是否使用顶点元素，这是一个boolean值。
    // 意思是线条各部分的颜色根据顶点的颜色来进行插值。
  });
  const geometry = new Geometry();
  geometry.colors.push(
    new Color(0xff0000),
    new Color(0x0000ff),
  );
  geometry.vertices = vertices;
  const robotPath = new Line(geometry, material);
  robotPath.name = 'robotPath';
  return robotPath;
}

function createRectBorder(w, l, color, linewidth = 1) {
  const material = new LineBasicMaterial({
    color,
    linewidth,
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
  constructor(viewBox, warehouseInfo, cb) {
    modelLoadedCB = cb;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.viewBox = viewBox;
    this.domW = this.viewBox.clientWidth;
    this.domH = this.viewBox.clientHeight;
    const { mapLength, mapWidth } = warehouseInfo;
    this.spaceWidth = 1;
    this.spaceLength = 1;
    this.mapWidth = mapWidth;
    this.mapLength = mapLength;
    model.rect = createRect(this.spaceLength * 100 - spaceGap, this.spaceWidth * 100 - spaceGap);
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
      chargerMap: {}, // 充电桩信息
    }; // 场景内容信息
    this.containerTypeMap = {};

    this.init();
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
    this.camera = new PerspectiveCamera(50, this.domW / this.domH, 1, 30000);
    this.camera.position.set(this.mapLength * 100 / 2, 3000, this.mapWidth * 100 * 1.5);
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
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.mouseButtons = {
      LEFT: MOUSE.PAN,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.ROTATE,
    };
    this.controls.touches = {
      ONE: TOUCH.PAN,
      TWO: TOUCH.DOLLY_ROTATE,
    };
    this.controls.maxPolarAngle = Math.PI / 2; // 能够垂直旋转的角度的上限，范围是 0 到 Math.PI，其默认值为 Math.PI
    // 是否开启右键拖拽
    this.controls.enablePan = true; // 是否启用相机平移
    this.controls.enableRotate = true; // 是否启用相机旋转, 移动设备可能需要设置为禁止旋转
    this.controls.target = new Vector3(this.mapLength * 100 / 2, 0, this.mapWidth * 100 * 0.8); // 接管相机的 lookAt
    this.controls.update();
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
        thottle(() => {
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
        }, 2000)();
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

  onWindowResize() {
    setTimeout(() => {
      this.camera.aspect = this.domW / this.domH;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.domW, this.domH);
    }, 0);
  }

  initEvents() {
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
        params.moveDuration = 0;
      } else {
        params.moveDuration = defaultMoveDuration;
      }
    }, false);
    this.viewBox.addEventListener('mousedown', () => {
      mouseHolding = true;
      // if (e.button === 0) {
      //   clickLeft = 1;
      // }
      // if (e.button === 2) {
      //   clickRight = 1;
      // }
    }, false);
    this.viewBox.addEventListener('mouseup', () => {
      mouseHolding = false;
      if (draging) { // 发生了拖拽
        draging = false;
      } else if (onOverSpace) { // 未拖拽且点击了且光标在有效的 space 上
        // if (params.model === 'mark') {
        //   if (e.button === 0 && clickLeft && _events.onSpaceClick) { // 左键抬起时、左键之前已被按下、注册了onSpaceClick事件
        //     // _events.onSpaceClick(onOverSpace, 'mark')
        //   }
        // } else if (params.model === 'edit') {
        //   if (e.button === 0 && clickLeft && _events.onSpaceClick) { // 左键抬起时、左键之前已被按下、注册了onSpaceClick事件
        //     // _events.onSpaceClick(onOverSpace, 'edit')
        //     instanceMesh.spaceLeftSelBorderMesh.position.set(onOverSpace.x, onOverSpace.y, onOverSpace.z);
        //     instanceMesh.spaceLeftSelBorderMesh.visible = true;
        //   }
        //   if (e.button === 2 & clickRight && _events.onSpaceContextMenu) { // 右键抬起时、右键之前已被按下、注册了onSpaceContextMenu事件
        //     // _events.onSpaceContextMenu(onOverSpace, 'edit')
        //     instanceMesh.spaceRightSelBorderMesh.position.set(onOverSpace.x, onOverSpace.y, onOverSpace.z);
        //     instanceMesh.spaceRightSelBorderMesh.visible = true;
        //   }
        // }
      }
      // if (e.button === 0) {
      //   clickLeft = 0;
      // }
      // if (e.button === 2) {
      //   clickRight = 0;
      // }
    }, false);
    this.viewBox.addEventListener('mousemove', (event) => {
      event.preventDefault();
      const getBoundingClientRect = this.viewBox.getBoundingClientRect();
      mouse.x = ((event.clientX - getBoundingClientRect.left) / this.domW) * 2 - 1;
      mouse.y = -((event.clientY - getBoundingClientRect.top) / this.domH) * 2 + 1;
      mouseHolding && (draging = true); // 发生了拖拽
    }, false);
  }

  render = () => {
    this.renderer.render(this.scene, this.camera);
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    const t = clock.getDelta();
    timeS += t;
    if (timeS > renderT) {
      this.testRaycaster();
      this.render();
      timeS = 0;
    }
  }

  updateContainersType(containerTypeMap) {
    this.containerTypeMap = containerTypeMap;
  }

  update(data) {
    const { spaces, containers, robots, terminals } = data;
    if (isFirst) {
      isFirst = false;
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
    } else {
      // spaces && spaces.length && this.updateSpaces1(spaces);
      // terminals && terminals.length && this.updateTerminals1(terminals);
      // robots && robots.length && this.updateRobots1(robots);
      // containers && containers.length && this.updateContainers1(containers);
      // this.doMove();
    }
    return Promise.resolve(this.info);
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
        this.scene.add(workerMesh);
      }
    }
    mesh.geometry.setAttribute('instanceColor', new InstancedBufferAttribute(new Float32Array(spaceColorList), 3));
    mesh.material.onBeforeCompile = onBeforeCompile;
    this.scene.add(instanceMesh.spacesMesh); // 添加 space 点位, 不需要显示则无需执行该行
  }

  initTerminals(terminals) {
    this.info.terminalMap = {};
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
    this.info.containerMap = {};
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
}
