import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Pane } from "tweakpane";

// initialize pane
const pane = new Pane();

// initialize the scene
const scene = new THREE.Scene();

// texture loaders
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath('/textures/cubeMap/');

const sunTexture = textureLoader.load('/textures/2k_sun.jpg');
const earthTexture = textureLoader.load('/textures/2k_earth_daymap.jpg');
const mercuryTexture = textureLoader.load('/textures/2k_mercury.jpg');
const marsTexture = textureLoader.load('/textures/2k_mars.jpg');
const venusTexture = textureLoader.load('/textures/2k_venus_surface.jpg');
const moonTexture = textureLoader.load('/textures/2k_moon.jpg');

const backgroundCubemap = cubeTextureLoader.load([
  'px.png', 'nx.png',
  'py.png', 'ny.png',
  'pz.png', 'nz.png',
]);
scene.background = backgroundCubemap;

// sphere geometry
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

// materials
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
const mercuryMaterial = new THREE.MeshStandardMaterial({ map: mercuryTexture });
const marsMaterial = new THREE.MeshStandardMaterial({ map: marsTexture });
const venusMaterial = new THREE.MeshStandardMaterial({ map: venusTexture });
const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });

// sun
const sun = new THREE.Mesh(sphereGeometry, sunMaterial);
sun.scale.setScalar(5);
scene.add(sun);

// planets data
const planets = [
  {
    name: "Mercury", radius: 0.5, distance: 10, speed: 0.01, material: mercuryMaterial, moons: []
  },
  {
    name: "Venus", radius: 0.8, distance: 15, speed: 0.007, material: venusMaterial, moons: []
  },
  {
    name: "Earth", radius: 1, distance: 20, speed: 0.005, material: earthMaterial, moons: [
      { name: "Moon", radius: 0.3, distance: 2.5, speed: 0.015 }
    ]
  },
  {
    name: "Mars", radius: 0.7, distance: 25, speed: 0.003, material: marsMaterial, moons: [
      { name: "Phobos", radius: 0.1, distance: 2, speed: 0.02 },
      { name: "Deimos", radius: 0.2, distance: 3, speed: 0.01 }
    ]
  },
];

// helper functions
const createPlanet = (planet) => {
  const planetMesh = new THREE.Mesh(sphereGeometry, planet.material);
  planetMesh.scale.setScalar(planet.radius);

  const orbitGroup = new THREE.Group();
  planetMesh.position.x = planet.distance;
  orbitGroup.add(planetMesh);

  planet.moons.forEach(moon => {
    const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
    moonMesh.scale.setScalar(moon.radius);
    moonMesh.userData = { speed: moon.speed, distance: moon.distance, angle: 0 };
    planetMesh.add(moonMesh);
  });

  scene.add(orbitGroup);

  return {
    orbitGroup,
    planetMesh,
    speed: planet.speed,
    moons: planet.moons,
  };
};

const planetObjects = planets.map(createPlanet);

// lights
scene.add(new THREE.AmbientLight(0xffffff, 0.12));
scene.add(new THREE.PointLight(0xffffff, 2000));

// camera
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 5, 100);

// renderer
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxDistance = 200;
controls.minDistance = 20;

// resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// animation loop
const renderloop = () => {
  planetObjects.forEach(({ orbitGroup, planetMesh, speed, moons }) => {
    // revolution
    orbitGroup.rotation.y += speed;

    // self-rotation
    planetMesh.rotation.y += 0.01;

    // moon orbits
    planetMesh.children.forEach((moonMesh, i) => {
      moonMesh.userData.angle += moons[i].speed;
      moonMesh.position.x = Math.sin(moonMesh.userData.angle) * moonMesh.userData.distance;
      moonMesh.position.z = Math.cos(moonMesh.userData.angle) * moonMesh.userData.distance;
    });
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(renderloop);
};

renderloop();
