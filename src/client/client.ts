import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import * as CANNON from 'cannon-es'

const scene = new THREE.Scene()
scene.add(new THREE.AxesHelper(5))

const light1 = new THREE.SpotLight(0xffffff, 100)
light1.position.set(2.5, 5, 5)
light1.angle = Math.PI / 4
light1.penumbra = 0.5
light1.castShadow = true
light1.shadow.mapSize.width = 1024
light1.shadow.mapSize.height = 1024
light1.shadow.camera.near = 0.5
light1.shadow.camera.far = 20
scene.add(light1)

const light2 = new THREE.SpotLight(0xffffff, 100)
light2.position.set(-2.5, 5, 5)
light2.angle = Math.PI / 4
light2.penumbra = 0.5
light2.castShadow = true
light2.shadow.mapSize.width = 1024
light2.shadow.mapSize.height = 1024
light2.shadow.camera.near = 0.5
light2.shadow.camera.far = 20
scene.add(light2)

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 2, 4)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true // 開啟陰影
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
// controls.target.y = 0.5

const world = new CANNON.World() // 創建世界
world.gravity.set(0, -9.82, 0) // 設定物理重力
// world.broadphase = new CANNON.NaiveBroadphase()
//   ; (world.solver as CANNON.GSSolver).iterations = 10
// world.allowSleep = true

const normalMaterial = new THREE.MeshNormalMaterial()
const phongMaterial = new THREE.MeshPhongMaterial()

// 創建 three.js 的方塊
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
const cubeMesh = new THREE.Mesh(cubeGeometry, normalMaterial)
// 設定位置
cubeMesh.position.x = -3
cubeMesh.position.y = 3
// 開啟陰影
cubeMesh.castShadow = true
// 將方塊添加到場景中
scene.add(cubeMesh)
// 創建 CANNON 的方塊，在 CANNON 中使用半徑設置大小，所以 three.js 的 1, 1, 1 在 CANNON 中要用 0.5, 0.5, 0.5
const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
const cubeBody = new CANNON.Body({ mass: 1 }) // 設定質量為 1 讓其擁有重力效果
cubeBody.addShape(cubeShape)
// 設定其位置等於 three.js 的方塊的位置
cubeBody.position.x = cubeMesh.position.x
cubeBody.position.y = cubeMesh.position.y
cubeBody.position.z = cubeMesh.position.z
// 往世界中添加方塊
world.addBody(cubeBody)

// 創建 three.js 的球體
const sphereGeometry = new THREE.SphereGeometry(1)
const sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial)
// 設定位置
sphereMesh.position.x = -1
sphereMesh.position.y = 3
// 開啟陰影
sphereMesh.castShadow = true
// 將球體添加到場景中
scene.add(sphereMesh)
// 創建 CANNON 的球體
const sphereShape = new CANNON.Sphere(1)
const sphereBody = new CANNON.Body({ mass: 1 }) // 設定質量為 1 讓其擁有重力效果
sphereBody.addShape(sphereShape)
// 設定其位置等於 three.js 的球體的位置
sphereBody.position.x = sphereMesh.position.x
sphereBody.position.y = sphereMesh.position.y
sphereBody.position.z = sphereMesh.position.z
world.addBody(sphereBody)

// 創建 three.js 的十二面體
const icosahedronGeometry = new THREE.IcosahedronGeometry(1, 0)
const icosahedronMesh = new THREE.Mesh(icosahedronGeometry, normalMaterial)
// 設定位置
icosahedronMesh.position.x = 1
icosahedronMesh.position.y = 3
// 開啟陰影
icosahedronMesh.castShadow = true
// 將十二面體添加到場景中
scene.add(icosahedronMesh)

// 創建函數建立 CANNON 的凸多面體
function CreateConvexPolyhedron(geometry: THREE.BufferGeometry) {
  // 獲取 geometry 的所有頂點
  const position = geometry.attributes.position.array
  // 宣告 points 存放所有的轉換成 CANNON.Vec3 的頂點
  const points: CANNON.Vec3[] = []
  for (let i = 0; i < position.length; i += 3) {
    // 將轉換好的頂點 push 到 points 中
    points.push(new CANNON.Vec3(position[i], position[i + 1], position[i + 2]));
  }
  // 宣告 faces 存放所有面的組合(每三個頂點組成一個面)
  const faces: number[][] = []
  for (let i = 0; i < position.length / 3; i += 3) {
    // 將每三個頂點設為一個陣列 push 到 faces 中
    faces.push([i, i + 1, i + 2])
  }
  // 使用 CANNON.ConvexPolyhedron 傳入所有頂點及面創建出 CANNON 的凸多面體
  return new CANNON.ConvexPolyhedron({
    vertices: points,
    faces: faces,
  })
}
// 根據 IcosahedronGeometry 使用 CreateConvexPolyhedron 函數創建 CANNON 的凸多面體
const icosahedronShape = CreateConvexPolyhedron(icosahedronMesh.geometry)
const icosahedronBody = new CANNON.Body({ mass: 1 }) // 設定質量為 1 讓其擁有重力效果
icosahedronBody.addShape(icosahedronShape)
// 設定其位置等於 three.js 的十二面體的位置
icosahedronBody.position.x = icosahedronMesh.position.x
icosahedronBody.position.y = icosahedronMesh.position.y
icosahedronBody.position.z = icosahedronMesh.position.z
world.addBody(icosahedronBody)

// 創建 three.js 的圓環結
const torusKnotGeometry = new THREE.TorusKnotGeometry()
const torusKnotMesh = new THREE.Mesh(torusKnotGeometry, normalMaterial)
torusKnotMesh.position.x = 4
torusKnotMesh.position.y = 3
torusKnotMesh.castShadow = true // 開啟陰影
scene.add(torusKnotMesh) // 添加到場景中

function CreateTrimesh(geometry: THREE.BufferGeometry) {
  // 獲取所有頂點座標
  const vertices = (geometry.attributes.position as THREE.BufferAttribute).array
  // 獲取所有頂點座標的索引
  const indices = Object.keys(vertices).map(Number)
  // 使用 CANNON.Trimesh 傳入所有頂點及索引創建出 CANNON 的不規則物體
  return new CANNON.Trimesh(vertices as unknown as number[], indices)
}
// 根據 TorusKnotGeometry 使用 CreateTrimesh 函數創建 CANNON 的不規則物體
const torusKnotShape = CreateTrimesh(torusKnotMesh.geometry)
const torusKnotBody = new CANNON.Body({ mass: 1 }) // 設定質量為 1 讓其擁有重力效果
torusKnotBody.addShape(torusKnotShape)
// 設定其位置等於 three.js 的圓環結的位置
torusKnotBody.position.x = torusKnotMesh.position.x
torusKnotBody.position.y = torusKnotMesh.position.y
torusKnotBody.position.z = torusKnotMesh.position.z
world.addBody(torusKnotBody)



// 添加地板
const planeGeometry = new THREE.PlaneGeometry(25, 25)
const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial) // 設定材質為 MeshPhongMaterial
// 轉為水平方向
planeMesh.rotateX(-Math.PI / 2)
planeMesh.receiveShadow = true // 接收陰影
scene.add(planeMesh) // 將平面添加到場景中
// 在世界中添加 CANNON 的地板
const planeShape = new CANNON.Plane() // CANNON 的地板預設就是無限大，無法設定尺寸
const planeBody = new CANNON.Body({ mass: 0 }) // 設定重力為 0 讓平面靜止不動
planeBody.addShape(planeShape)
// 等同於 planeMesh.rotateX(-Math.PI / 2) 將地板旋轉為平的
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
world.addBody(planeBody)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  render()
}

const stats = new Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const physicsFolder = gui.addFolder('Physics')
physicsFolder.add(world.gravity, 'x', -10.0, 10.0, 0.1)
physicsFolder.add(world.gravity, 'y', -10.0, 10.0, 0.1)
physicsFolder.add(world.gravity, 'z', -10.0, 10.0, 0.1)
physicsFolder.open()

function animate() {
  requestAnimationFrame(animate)

  controls.update()

  world.step(1 / 60)

  // 設定 three.js 的方塊位置為 CANNON 的方塊位置
  cubeMesh.position.set(cubeBody.position.x, cubeBody.position.y, cubeBody.position.z)
  // 設定 three.js 的方塊的四元數為 CANNON 的方塊的四元數，以確保獲取到方塊的旋轉
  cubeMesh.quaternion.set(cubeBody.quaternion.x, cubeBody.quaternion.y, cubeBody.quaternion.z, cubeBody.quaternion.w)

  // 設定 three.js 的球體位置為 CANNON 的球體位置
  sphereMesh.position.set(sphereBody.position.x, sphereBody.position.y, sphereBody.position.z)
  // 設定 three.js 的球體的四元數為 CANNON 的球體的四元數，以確保獲取到球體的旋轉
  sphereMesh.quaternion.set(sphereBody.quaternion.x, sphereBody.quaternion.y, sphereBody.quaternion.z, sphereBody.quaternion.w)

  // 設定 three.js 的十二面體位置為 CANNON 的十二面體位置
  icosahedronMesh.position.set(icosahedronBody.position.x, icosahedronBody.position.y, icosahedronBody.position.z)
  // 設定 three.js 的十二面體的四元數為 CANNON 的十二面體的四元數，以確保獲取到十二面體的旋轉
  icosahedronMesh.quaternion.set(icosahedronBody.quaternion.x, icosahedronBody.quaternion.y, icosahedronBody.quaternion.z, icosahedronBody.quaternion.w)

  // 設定 three.js 的圓環結位置為 CANNON 的圓環結位置
  torusKnotMesh.position.set(torusKnotBody.position.x, torusKnotBody.position.y, torusKnotBody.position.z)
  // 設定 three.js 的圓環結的四元數為 CANNON 的圓環結的四元數，以確保獲取到圓環結的旋轉
  torusKnotMesh.quaternion.set(torusKnotBody.quaternion.x, torusKnotBody.quaternion.y, torusKnotBody.quaternion.z, torusKnotBody.quaternion.w)

  render()

  stats.update()
}

function render() {
  renderer.render(scene, camera)
}

animate()