import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger'

const scene = new THREE.Scene()
scene.add(new THREE.AxesHelper(5))

var light1 = new THREE.SpotLight(0xffffff, 100)
light1.position.set(2.5, 5, 5)
light1.angle = Math.PI / 4
light1.penumbra = 0.5
light1.castShadow = true
light1.shadow.mapSize.width = 1024
light1.shadow.mapSize.height = 1024
light1.shadow.camera.near = 0.5
light1.shadow.camera.far = 20
scene.add(light1)

var light2 = new THREE.SpotLight(0xffffff, 100)
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
camera.position.set(0, 4, 4)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.screenSpacePanning = true
controls.target.y = 2

const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)

const normalMaterial = new THREE.MeshNormalMaterial()
const phongMaterial = new THREE.MeshPhongMaterial()

let monkeyMeshes: THREE.Object3D[] = []
let monkeyBodies: CANNON.Body[] = []
let monkeyLoaded = false

const objLoader = new OBJLoader()
objLoader.load(
  'models/monkey.obj',
  (object) => {
    const monkeyMesh = object.children[0] as THREE.Mesh
    monkeyMesh.material = normalMaterial

    for (let i = 0; i < 100; i++) {
      const monkeyMeshClone = monkeyMesh.clone()
      monkeyMeshClone.position.x = Math.floor(Math.random() * 10) - 5
      monkeyMeshClone.position.z = Math.floor(Math.random() * 10) - 5
      monkeyMeshClone.position.y = 5 + i
      scene.add(monkeyMeshClone)
      monkeyMeshes.push(monkeyMeshClone)

      const monkeyBody = new CANNON.Body({ mass: 1 })
      monkeyBody.addShape(new CANNON.Sphere(.8), new CANNON.Vec3(0, .2, 0))// head,
      monkeyBody.addShape(new CANNON.Sphere(.05), new CANNON.Vec3(0, -.97, 0.46))// chin,
      monkeyBody.addShape(new CANNON.Sphere(.05), new CANNON.Vec3(-1.36, .29, -0.5)) //left ear
      monkeyBody.addShape(new CANNON.Sphere(.05), new CANNON.Vec3(1.36, .29, -0.5)) //right ear

      monkeyBody.position.x = monkeyMeshClone.position.x
      monkeyBody.position.y = monkeyMeshClone.position.y
      monkeyBody.position.z = monkeyMeshClone.position.z

      world.addBody(monkeyBody)

      monkeyBodies.push(monkeyBody)
    }

    monkeyLoaded = true
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
  },
  (error) => {
    console.log('An error happened')
  }
)

const planeGeometry = new THREE.PlaneGeometry(25, 25)
const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial)
planeMesh.rotateX(-Math.PI / 2)
planeMesh.receiveShadow = true
scene.add(planeMesh)
const planeShape = new CANNON.Plane()
const planeBody = new CANNON.Body({ mass: 0 })
planeBody.addShape(planeShape)
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

const cannonDebugger = CannonDebugger(scene, world) // 宣告它，傳入場景及世界

function animate() {
  requestAnimationFrame(animate)

  controls.update()

  world.step(1 / 60)

  cannonDebugger.update() // 呼叫 update 方法

  // Copy coordinates from Cannon to Three.js
  if (monkeyLoaded) {
    monkeyMeshes.forEach((m, i) => {
      m.position.set(
        monkeyBodies[i].position.x,
        monkeyBodies[i].position.y,
        monkeyBodies[i].position.z
      )
      m.quaternion.set(
        monkeyBodies[i].quaternion.x,
        monkeyBodies[i].quaternion.y,
        monkeyBodies[i].quaternion.z,
        monkeyBodies[i].quaternion.w
      )
    })
  }

  render()

  stats.update()
}

function render() {
  renderer.render(scene, camera)
}
animate()