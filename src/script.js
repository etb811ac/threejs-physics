import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import { Sky } from 'three/addons/objects/Sky.js'
import CANNON, { ContactMaterial, Plane, Vec3 } from 'cannon'

/**
 * Debug
 */
const debugObjects = []



debugObjects.createSphere = () => {
    createSphere(
        .6,
        {
            x: (Math.random() - 0.5) * 5,
            y: 5,
            z: (Math.random() - 0.5) * 5
        })
}

debugObjects.createBrick = () => {
    createBrick(
        {
            x: (Math.random() - 0.5) * 5,
            y: 5,
            z: (Math.random() - 0.5) * 5
        })
}

debugObjects.reset = () => {
    objectsToUpdate.forEach(object => {
        world.remove(object.body)
        object.body.removeEventListener('collide', playSoundHit)

        scene.remove(object.mesh)
    })

    objectsToUpdate.splice(0, objectsToUpdate.length)
}



/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//sounds
const hitSound = new Audio('sounds/hit.mp3')

const playSoundHit = (collison) => {


    const impactStrenght = collison.contact.getImpactVelocityAlongNormal()

    if (impactStrenght > 1.5) {
        hitSound.volume = Math.random()
        hitSound.currentTime = 0
        hitSound.play()
    }

}

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const gltfLoader = new GLTFLoader()

//floor texture
const groundMap = textureLoader.load("/textures/ground_05_2k/ground_05_baseColor_2k.png")
const groundARMMap = textureLoader.load("/textures/ground_05_2k/ground_05_ao_r_m_h_2k.png")

groundMap.colorSpace = THREE.SRGBColorSpace

groundMap.repeat.set(70, 70)
groundARMMap.repeat.set(70, 70)

groundMap.wrapS = THREE.RepeatWrapping
groundARMMap.wrapS = THREE.RepeatWrapping

groundMap.wrapT = THREE.RepeatWrapping
groundARMMap.wrapT = THREE.RepeatWrapping


//brick texture
const brickMap = textureLoader.load('/textures/stone_bricks_wall_06_2k/stone_bricks_wall_06_color_2k.png')
const brickAoMap = textureLoader.load('/textures/stone_bricks_wall_06_2k/stone_bricks_wall_06_ambient_occlusion_2k.png')
const brickHeightMap = textureLoader.load('/textures/stone_bricks_wall_06_2k/stone_bricks_wall_06_height_2k.png')
const brickRoughMap = textureLoader.load('/textures/stone_bricks_wall_06_2k/stone_bricks_wall_06_roughness_2k.png')

brickMap.colorSpace = THREE.SRGBColorSpace

//ball texture
const ballMap = textureLoader.load('/textures/ball.jpg')


//models


//Physics
const world = new CANNON.World()
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true
world.gravity.set(0, -9.82, 0)


//Materials
const defaultMaterial = new CANNON.Material('default')
const concreteMaterial = new CANNON.Material('concrete')

const defaultContact = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.5,
        restitution: 0.7
    }
)

const defaulteConcreteContact = new ContactMaterial(
    defaultMaterial,
    concreteMaterial,
    {
        friction: 5,
        restitution: 0
    }
)

world.addContactMaterial(defaultContact)
world.addContactMaterial(defaulteConcreteContact)
world.defaultContactMaterial = defaultContact



//Floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body({
    mass: 0,
    shape: floorShape,
    material: defaultMaterial
})

floorBody.quaternion.setFromAxisAngle(
    new Vec3(-1, 0, 0),
    Math.PI * .5
)

world.addBody(floorBody)


/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100, 500, 500),
    new THREE.MeshStandardMaterial({
        map: groundMap,
        aoMap: groundARMMap,
        roughnessMap: groundARMMap,
        displacementMap: groundARMMap,
        metalness: 0,
        displacementBias: -0.0359,
        displacementScale: 0.1816
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

document.querySelectorAll('.option').forEach(el => {
    el.addEventListener('click', e => {
        const value = e.currentTarget.dataset.value
        world.gravity.set(0, parseFloat(value), 0)
        document.getElementById('gravity-gauge').innerHTML = (Math.abs(parseFloat(value)))
        document.querySelectorAll('.option').forEach(el => { el.classList.remove('active') })
        e.currentTarget.classList.add('active')
    })
})

document.getElementById('drop-brick').addEventListener('click', e => {
    createBrick({
        x: (Math.random() - 0.5) * 5,
        y: 6,
        z: (Math.random() - 0.5) * 5
    })
})

document.getElementById('drop-ball').addEventListener('click', e => {
    createSphere(.6, {
        x: (Math.random() - 0.5) * 5,
        y: 6,
        z: (Math.random() - 0.5) * 5
    })
})

document.getElementById('clean').addEventListener('click', e => {
    debugObjects.reset()
})



/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 900)
camera.position.set(- 6, 3, 5)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


//Utils

const objectsToUpdate = []

//sphere
const sphereGeometry = new THREE.SphereGeometry(1, 20, 20);
const sphereMaterial = new THREE.MeshStandardMaterial({
    map: ballMap
})

//square
const squareGeomertry = new THREE.BoxGeometry(1, 1, 1, 1000, 1000)
const squareMaterial = new THREE.MeshStandardMaterial({
    map: brickMap,
    aoMap: brickAoMap,
    roughnessMap: brickRoughMap, displacementMap: brickHeightMap,
    displacementScale: 0.0548,
    displacementBias: -0.0379
})



const createSphere = (radius, position) => {
    //ThreeJS objecct
    const mesh = new THREE.Mesh(
        sphereGeometry,
        sphereMaterial
    )
    mesh.scale.set(radius, radius, radius)
    mesh.castShadow = true;
    mesh.position.copy(position)
    scene.add(mesh)

    // //CANONN object
    const shape = new CANNON.Sphere(radius)
    const body = new CANNON.Body({
        mass: 10,
        shape,
        material: defaultMaterial
    })
    body.position.copy(position)

    world.addBody(body)


    objectsToUpdate.push({
        mesh, body
    })

    body.addEventListener('collide', playSoundHit)

    mesh.position.copy(body.position)
}

const createBrick = (position) => {

    //Three
    const mesh = new THREE.Mesh(
        squareGeomertry,
        squareMaterial
    )
    mesh.castShadow = true;
    mesh.scale.set(2, 1, .5)
    mesh.position.copy(position)
    scene.add(mesh)

    //Cannon
    const shape = new CANNON.Box(new CANNON.Vec3(2 / 2, 1 / 2, .5 / 2))
    const body = new CANNON.Body({
        mass: 100,
        shape,
        material: concreteMaterial

    })
    body.position.copy(position);

    world.addBody(body)

    objectsToUpdate.push({ mesh, body })

    body.addEventListener('collide', playSoundHit)

}

//Sky
const sky = new Sky()
sky.scale.set(100, 100, 100)
scene.add(sky)

sky.material.uniforms['turbidity'].value = 10
sky.material.uniforms['rayleigh'].value = 3
sky.material.uniforms['mieCoefficient'].value = 0.1
sky.material.uniforms['mieDirectionalG'].value = 0.95
sky.material.uniforms['sunPosition'].value.set(0.6, 0.038, .5)

/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime

    //update physics world
    world.step(1 / 60, deltaTime, 3)

    objectsToUpdate.forEach(object => {
        object.mesh.position.copy(object.body.position)
        object.mesh.quaternion.copy(object.body.quaternion)
    })

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

//populate at the begging
createSphere(
    .6,
    {
        x: (Math.random() - 0.5) * 5,
        y: 6,
        z: (Math.random() - 0.5) * 5
    })
createSphere(
    .6,
    {
        x: (Math.random() - 0.5) * 5,
        y: 6,
        z: (Math.random() - 0.5) * 5
    })
createBrick(
    {
        x: (Math.random() - 0.5) * 5,
        y: 6,
        z: (Math.random() - 0.5) * 5
    })
createBrick(
    {
        x: (Math.random() - 0.5) * 5,
        y: 6,
        z: (Math.random() - 0.5) * 5
    })
createBrick(
    {
        x: (Math.random() - 0.5) * 5,
        y: 6,
        z: (Math.random() - 0.5) * 5
    })