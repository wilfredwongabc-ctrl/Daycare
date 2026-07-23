"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type * as ThreeTypes from "three";

type ThreeModule = typeof import("three");

let THREE: ThreeModule;

type RoomId =
  | "entrance"
  | "reception"
  | "office"
  | "clinical"
  | "training"
  | "changing"
  | "multisensory"
  | "dining"
  | "common";

type DoorSide = "front" | "back" | "left" | "right";

type RoomLink = {
  to: RoomId;
  side: DoorSide;
  offset: number;
};

type Room = {
  id: RoomId;
  index: string;
  name: string;
  english: string;
  area: string;
  description: string;
  planX: number;
  planY: number;
  size: [number, number, number];
  yaw: number;
  pitch: number;
  kind:
    | "entry"
    | "reception"
    | "office"
    | "clinical"
    | "training"
    | "wet"
    | "small"
    | "hall"
    | "common";
  links: RoomLink[];
};

const ROOMS: Room[] = [
  {
    id: "entrance",
    index: "01",
    name: "主入口",
    english: "Main entrance",
    area: "入口接待帶",
    description: "由西面入口進入，接待處位於前方；北面連接洗衣／工作間。",
    planX: 5,
    planY: 84,
    size: [7.2, 6.2, 4.25],
    yaw: -42,
    pitch: -2,
    kind: "entry",
    links: [
      { to: "reception", side: "front", offset: 0.15 },
      { to: "office", side: "left", offset: 0.12 },
    ],
  },
  {
    id: "reception",
    index: "02",
    name: "接待處",
    english: "Reception",
    area: "5.8 平方米",
    description: "接待處位於入口東面，向前連接中心主要活動空間。",
    planX: 13,
    planY: 77,
    size: [6.8, 5.4, 4.15],
    yaw: 8,
    pitch: -1,
    kind: "reception",
    links: [
      { to: "entrance", side: "back", offset: -0.3 },
      { to: "office", side: "left", offset: 0.2 },
      { to: "dining", side: "front", offset: 0.32 },
    ],
  },
  {
    id: "office",
    index: "03",
    name: "辦公室／洗衣工作間",
    english: "Office & workroom",
    area: "14.5 + 16.4 平方米",
    description: "圖則西側的後勤空間，包括辦公室與洗衣／工作間。",
    planX: 15,
    planY: 58,
    size: [8.1, 5.8, 4.1],
    yaw: 28,
    pitch: -2,
    kind: "office",
    links: [
      { to: "reception", side: "front", offset: 0.28 },
      { to: "entrance", side: "right", offset: -0.22 },
    ],
  },
  {
    id: "clinical",
    index: "04",
    name: "醫療／面談區",
    english: "Clinical & interview",
    area: "11.5 + 6.5 平方米",
    description: "包括診症、護士值勤／病房及面談室，位置在中心西北角。",
    planX: 8,
    planY: 25,
    size: [7.5, 5.1, 4.1],
    yaw: -22,
    pitch: -1,
    kind: "clinical",
    links: [
      { to: "training", side: "right", offset: 0.08 },
      { to: "reception", side: "front", offset: 0.26 },
    ],
  },
  {
    id: "training",
    index: "05",
    name: "物理治療／訓練室",
    english: "Physiotherapy & training",
    area: "70.7 平方米",
    description: "圖則北面的大型訓練空間，南面雙門接往主要活動區。",
    planX: 27,
    planY: 26,
    size: [12.2, 6.0, 4.25],
    yaw: 18,
    pitch: -2,
    kind: "training",
    links: [
      { to: "clinical", side: "left", offset: -0.15 },
      { to: "dining", side: "front", offset: 0.22 },
    ],
  },
  {
    id: "changing",
    index: "06",
    name: "更衣／洗手間區",
    english: "Changing & washrooms",
    area: "設有下沉樓板",
    description: "包括男女更衣室、洗手間及無障礙設施；圖則標示局部下沉樓板。",
    planX: 27,
    planY: 65,
    size: [8.2, 5.4, 4.0],
    yaw: 36,
    pitch: -4,
    kind: "wet",
    links: [
      { to: "reception", side: "left", offset: 0.25 },
      { to: "dining", side: "right", offset: -0.18 },
    ],
  },
  {
    id: "multisensory",
    index: "07",
    name: "多感官室",
    english: "Multi-sensory area",
    area: "9.8 平方米",
    description: "位於接待與活動室之間的小型獨立空間。",
    planX: 38,
    planY: 73,
    size: [4.3, 3.4, 4.0],
    yaw: -18,
    pitch: -2,
    kind: "small",
    links: [{ to: "dining", side: "right", offset: 0.12 }],
  },
  {
    id: "dining",
    index: "08",
    name: "飯廳／活動室",
    english: "Dining & activity room",
    area: "83.7 平方米",
    description: "中心中段的主要活動空間，連接接待、多感官室及東面大公用室。",
    planX: 51,
    planY: 63,
    size: [13.0, 6.7, 4.3],
    yaw: 12,
    pitch: -2,
    kind: "hall",
    links: [
      { to: "reception", side: "left", offset: 0.25 },
      { to: "training", side: "back", offset: -0.3 },
      { to: "multisensory", side: "front", offset: -0.28 },
      { to: "common", side: "right", offset: 0.18 },
    ],
  },
  {
    id: "common",
    index: "09",
    name: "公用室",
    english: "Common room",
    area: "124.4 平方米",
    description: "圖則東面最大空間，內有結構柱，南側連接升降機及樓梯核心。",
    planX: 78,
    planY: 59,
    size: [15.7, 8.0, 4.35],
    yaw: 28,
    pitch: -2,
    kind: "common",
    links: [{ to: "dining", side: "left", offset: -0.15 }],
  },
];

const roomById = Object.fromEntries(
  ROOMS.map((room) => [room.id, room]),
) as Record<RoomId, Room>;

type OverviewFootprint = {
  x: number;
  z: number;
  width: number;
  depth: number;
  color: string;
};

const OVERVIEW_LAYOUT: Record<RoomId, OverviewFootprint> = {
  entrance: { x: -16, z: 7.4, width: 4.8, depth: 4.2, color: "#ff725c" },
  reception: { x: -10.9, z: 7.4, width: 4.8, depth: 4.2, color: "#e99a60" },
  office: { x: -15.1, z: 1.8, width: 6.6, depth: 5.7, color: "#607d88" },
  clinical: { x: -15.2, z: -5.7, width: 6.5, depth: 6.5, color: "#779195" },
  training: { x: -6.4, z: -5.7, width: 10.6, depth: 6.5, color: "#c99547" },
  changing: { x: -7.9, z: 1.7, width: 7.4, depth: 5.8, color: "#548b99" },
  multisensory: { x: -5.9, z: 7.4, width: 4.6, depth: 4.2, color: "#8b73a7" },
  dining: { x: 2.7, z: 2.8, width: 12.2, depth: 8.4, color: "#b66e57" },
  common: { x: 14.8, z: 1.1, width: 11.7, depth: 11.9, color: "#7b9060" },
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function concreteTexture(seed: number, base = "#77766f") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const random = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 6500; i += 1) {
    const tone = 90 + Math.floor(random() * 70);
    const alpha = 0.025 + random() * 0.055;
    ctx.fillStyle = `rgba(${tone},${tone},${tone - 4},${alpha})`;
    const radius = 0.25 + random() * 1.8;
    ctx.fillRect(random() * 512, random() * 512, radius, radius);
  }

  ctx.strokeStyle = "rgba(35,38,39,.16)";
  ctx.lineWidth = 2;
  [126, 256, 386].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 4, 512);
    ctx.stroke();
  });
  [172, 344].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y - 3);
    ctx.stroke();
  });

  for (let i = 0; i < 28; i += 1) {
    ctx.beginPath();
    ctx.arc(random() * 512, random() * 512, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(25,28,29,.24)";
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function floorTexture(seed: number) {
  const texture = concreteTexture(seed, "#797873");
  texture.repeat.set(4, 4);
  return texture;
}

function labelTexture(label: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 220;
  const ctx = canvas.getContext("2d")!;
  ctx.shadowColor = "rgba(0,0,0,.38)";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "rgba(18,22,24,.9)";
  ctx.beginPath();
  ctx.roundRect(18, 18, 604, 184, 92);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,.3)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#ff6b55";
  ctx.beginPath();
  ctx.arc(104, 110, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#15191b";
  ctx.font = "700 54px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("→", 104, 106);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 34px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, 178, 111);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roomSignTexture(room: Room) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 360;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(231,226,211,.91)";
  ctx.fillRect(0, 0, 900, 360);
  ctx.fillStyle = "#df4d3a";
  ctx.fillRect(0, 0, 22, 360);
  ctx.fillStyle = "#191d1f";
  ctx.font = "700 68px Arial, sans-serif";
  ctx.fillText(room.name, 70, 145);
  ctx.font = "400 35px Arial, sans-serif";
  ctx.fillStyle = "#50585a";
  ctx.fillText(room.english.toUpperCase(), 70, 212);
  ctx.font = "600 34px Arial, sans-serif";
  ctx.fillStyle = "#df4d3a";
  ctx.fillText(room.area, 70, 291);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function overviewLabelTexture(room: Room) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 240;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(18,22,24,.94)";
  ctx.beginPath();
  ctx.roundRect(8, 8, 704, 224, 26);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.32)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "#ff725c";
  ctx.beginPath();
  ctx.arc(105, 120, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#171a1b";
  ctx.font = "800 48px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(room.index, 105, 122);
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 43px Arial, sans-serif";
  ctx.fillText(room.name, 190, 105);
  ctx.fillStyle = "rgba(255,255,255,.62)";
  ctx.font = "500 25px Arial, sans-serif";
  ctx.fillText(room.area, 190, 155);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function disposeScene(scene: ThreeTypes.Scene) {
  scene.traverse((object) => {
    const mesh = object as ThreeTypes.Mesh;
    mesh.geometry?.dispose?.();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => {
        const map = (material as ThreeTypes.MeshStandardMaterial).map;
        map?.dispose();
        material.dispose();
      });
    } else if (mesh.material) {
      const material = mesh.material as ThreeTypes.MeshStandardMaterial;
      material.map?.dispose();
      material.dispose();
    }
  });
}

function FallbackScene({
  room,
  zoom,
  autoRotate,
  onMove,
}: {
  room: Room;
  zoom: number;
  autoRotate: boolean;
  onMove: (roomId: RoomId) => void;
}) {
  const [yaw, setYaw] = useState(room.yaw);
  const [pitch, setPitch] = useState(room.pitch);
  const dragRef = useRef({
    active: false,
    x: 0,
    y: 0,
    startX: 0,
    distance: 0,
  });

  const worldStyle = {
    "--fallback-yaw": `${yaw}deg`,
    "--fallback-pitch": `${pitch}deg`,
    "--fallback-scale": String(1 + (68 - zoom) / 180),
  } as CSSProperties;

  useEffect(() => {
    if (!autoRotate) return;
    let frame = 0;
    let previous = performance.now();
    const rotate = (now: number) => {
      const delta = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      if (!dragRef.current.active) {
        setYaw((value) => value - delta * 4.8);
      }
      frame = requestAnimationFrame(rotate);
    };
    frame = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(frame);
  }, [autoRotate]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      distance: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current.distance += Math.abs(dx) + Math.abs(dy);
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    setYaw((value) => value - dx * 0.22);
    setPitch((value) => Math.max(-38, Math.min(38, value - dy * 0.13)));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className="fallback-scene"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="fallback-world" style={worldStyle}>
        {(["front", "back", "left", "right"] as DoorSide[]).map((side) => (
          <div className={`fallback-face fallback-${side}`} key={side}>
            <div className="fallback-formwork" />
            <div className="fallback-wall-label">
              <span>{room.index}</span>
              <div>
                <strong>{room.name}</strong>
                <small>{room.english}</small>
              </div>
            </div>
            <div className="fallback-door-shape" />
          </div>
        ))}
        <div className="fallback-face fallback-floor" />
        <div className="fallback-face fallback-ceiling">
          <i />
          <i />
          <i />
          <b />
          <b />
        </div>
      </div>
      <div className="fallback-columns" aria-hidden="true">
        {["hall", "common", "training"].includes(room.kind) && (
          <>
            <i />
            <i />
          </>
        )}
      </div>
      <div className="fallback-portals">
        {room.links.map((link, index) => (
          <button
            type="button"
            key={link.to}
            style={{ "--portal-index": index } as CSSProperties}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onMove(link.to)}
          >
            <span>→</span>
            {roomById[link.to].name}
          </button>
        ))}
      </div>
      <span className="fallback-note">兼容模式 · 可拖曳環視</span>
    </div>
  );
}

function OverviewFallback({
  currentRoom,
  onEnter,
}: {
  currentRoom: RoomId;
  onEnter: (roomId: RoomId) => void;
}) {
  return (
    <div className="overview-fallback">
      <div className="overview-fallback-plan">
        {ROOMS.map((room) => {
          const footprint = OVERVIEW_LAYOUT[room.id];
          return (
            <button
              type="button"
              key={room.id}
              className={currentRoom === room.id ? "is-current" : ""}
              style={
                {
                  "--overview-x": `${((footprint.x - footprint.width / 2 + 21) / 42) * 100}%`,
                  "--overview-z": `${((footprint.z - footprint.depth / 2 + 12) / 24) * 100}%`,
                  "--overview-width": `${(footprint.width / 42) * 100}%`,
                  "--overview-depth": `${(footprint.depth / 24) * 100}%`,
                  "--overview-color": footprint.color,
                } as CSSProperties
              }
              onClick={() => onEnter(room.id)}
              aria-label={`進入${room.name}`}
            >
              <span>{room.index}</span>
              <strong>{room.name}</strong>
            </button>
          );
        })}
      </div>
      <span className="fallback-note">兼容模式 · 點擊房間進入</span>
    </div>
  );
}

function OverviewCanvas({
  currentRoom,
  onEnter,
}: {
  currentRoom: RoomId;
  onEnter: (roomId: RoomId) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onEnterRef = useRef(onEnter);
  const [dragging, setDragging] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [zoomDistance, setZoomDistance] = useState(42);
  const [hoveredRoom, setHoveredRoom] = useState<RoomId | null>(null);

  useEffect(() => {
    onEnterRef.current = onEnter;
  }, [onEnter]);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void import("three")
      .then((threeModule) => {
        if (cancelled) return;
        THREE = threeModule;

        const mount = mountRef.current;
        if (!mount) return;

        const testCanvas = document.createElement("canvas");
        if (!testCanvas.getContext("webgl2")) {
          setWebglFailed(true);
          return;
        }

        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#171b1c");
        scene.fog = new THREE.Fog("#171b1c", 42, 78);

        const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 140);
        let yaw = -0.7;
        let pitch = 0.78;
        let radius = 42;

        let renderer: ThreeTypes.WebGLRenderer;
        try {
          renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          });
        } catch {
          setWebglFailed(true);
          return;
        }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.18;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.domElement.setAttribute(
          "aria-label",
          "啟德4A2互動鳥瞰模型，可拖曳旋轉、滾輪縮放及點擊房間進入",
        );
        renderer.domElement.setAttribute("role", "application");
        renderer.domElement.tabIndex = 0;
        mount.prepend(renderer.domElement);

        const ambient = new THREE.HemisphereLight("#f4f7f2", "#302b28", 2.2);
        scene.add(ambient);

        const sunlight = new THREE.DirectionalLight("#fff1d6", 3.6);
        sunlight.position.set(-18, 32, 21);
        sunlight.castShadow = true;
        sunlight.shadow.mapSize.set(2048, 2048);
        sunlight.shadow.camera.left = -30;
        sunlight.shadow.camera.right = 30;
        sunlight.shadow.camera.top = 24;
        sunlight.shadow.camera.bottom = -24;
        scene.add(sunlight);

        const grid = new THREE.GridHelper(58, 29, "#343b3c", "#252b2c");
        grid.position.y = -0.56;
        scene.add(grid);

        const baseMaterial = new THREE.MeshStandardMaterial({
          color: "#282d2e",
          roughness: 0.86,
          metalness: 0.08,
        });
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(44, 0.8, 26),
          baseMaterial,
        );
        base.position.y = -0.48;
        base.receiveShadow = true;
        scene.add(base);

        const boundary = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(44, 0.82, 26)),
          new THREE.LineBasicMaterial({
            color: "#60696b",
            transparent: true,
            opacity: 0.72,
          }),
        );
        boundary.position.y = -0.48;
        scene.add(boundary);

        const corridor = new THREE.Mesh(
          new THREE.BoxGeometry(35.8, 0.08, 1.35),
          new THREE.MeshStandardMaterial({
            color: "#d6d0c1",
            roughness: 0.92,
          }),
        );
        corridor.position.set(-1.2, -0.01, 5.05);
        corridor.receiveShadow = true;
        scene.add(corridor);

        const roomMeshes: ThreeTypes.Mesh[] = [];
        const roomMaterials = new Map<RoomId, ThreeTypes.MeshStandardMaterial>();

        ROOMS.forEach((room) => {
          const footprint = OVERVIEW_LAYOUT[room.id];
          const material = new THREE.MeshStandardMaterial({
            color: footprint.color,
            roughness: 0.68,
            metalness: 0.04,
            emissive: "#000000",
          });
          roomMaterials.set(room.id, material);

          const floor = new THREE.Mesh(
            new THREE.BoxGeometry(footprint.width - 0.18, 0.34, footprint.depth - 0.18),
            material,
          );
          floor.position.set(footprint.x, 0.16, footprint.z);
          floor.castShadow = true;
          floor.receiveShadow = true;
          floor.userData.roomId = room.id;
          scene.add(floor);
          roomMeshes.push(floor);

          const wallMaterial = material.clone();
          wallMaterial.transparent = true;
          wallMaterial.opacity = 0.82;
          const wallHeight = room.id === "common" ? 1.75 : 1.55;
          const wallThickness = 0.14;
          const walls = [
            {
              width: footprint.width,
              depth: wallThickness,
              x: footprint.x,
              z: footprint.z - footprint.depth / 2,
            },
            {
              width: footprint.width,
              depth: wallThickness,
              x: footprint.x,
              z: footprint.z + footprint.depth / 2,
            },
            {
              width: wallThickness,
              depth: footprint.depth,
              x: footprint.x - footprint.width / 2,
              z: footprint.z,
            },
            {
              width: wallThickness,
              depth: footprint.depth,
              x: footprint.x + footprint.width / 2,
              z: footprint.z,
            },
          ];

          walls.forEach((wall) => {
            const wallMesh = new THREE.Mesh(
              new THREE.BoxGeometry(wall.width, wallHeight, wall.depth),
              wallMaterial,
            );
            wallMesh.position.set(wall.x, wallHeight / 2 + 0.3, wall.z);
            wallMesh.castShadow = true;
            wallMesh.userData.roomId = room.id;
            scene.add(wallMesh);
            roomMeshes.push(wallMesh);
          });

          const labelMaterial = new THREE.SpriteMaterial({
            map: overviewLabelTexture(room),
            transparent: true,
            depthTest: false,
            depthWrite: false,
          });
          const label = new THREE.Sprite(labelMaterial);
          label.position.set(
            footprint.x,
            wallHeight + 2.05,
            footprint.z,
          );
          const labelWidth = Math.min(5.7, Math.max(3.45, footprint.width * 0.72));
          label.scale.set(labelWidth, labelWidth / 3, 1);
          label.renderOrder = 20;
          scene.add(label);
        });

        const entranceMarker = new THREE.Group();
        const markerMaterial = new THREE.MeshStandardMaterial({
          color: "#ff725c",
          roughness: 0.45,
          metalness: 0.08,
        });
        const markerStem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 2.5, 12),
          markerMaterial,
        );
        markerStem.position.y = 1.25;
        const markerHead = new THREE.Mesh(
          new THREE.ConeGeometry(0.38, 0.85, 18),
          markerMaterial,
        );
        markerHead.position.y = 2.8;
        markerHead.rotation.z = Math.PI;
        entranceMarker.add(markerStem, markerHead);
        entranceMarker.position.set(-19.4, 0, 7.4);
        scene.add(entranceMarker);

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let pointerDown = false;
        let dragDistance = 0;
        let previousX = 0;
        let previousY = 0;
        let hoveredId: RoomId | null = null;

        function updateCamera() {
          const horizontal = Math.cos(pitch) * radius;
          camera.position.set(
            Math.sin(yaw) * horizontal,
            Math.sin(pitch) * radius,
            Math.cos(yaw) * horizontal,
          );
          camera.lookAt(0, 0.6, 0);
          camera.updateProjectionMatrix();
        }

        function resize() {
          const rect = mount.getBoundingClientRect();
          renderer.setSize(rect.width, rect.height, false);
          camera.aspect = rect.width / Math.max(1, rect.height);
          camera.updateProjectionMatrix();
        }

        function setPointer(event: PointerEvent) {
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        }

        function updateHover(event: PointerEvent) {
          setPointer(event);
          raycaster.setFromCamera(pointer, camera);
          const hit = raycaster.intersectObjects(roomMeshes, false)[0];
          const nextId = (hit?.object.userData.roomId as RoomId | undefined) ?? null;
          if (nextId === hoveredId) return;

          if (hoveredId) {
            roomMaterials.get(hoveredId)?.emissive.set("#000000");
          }
          if (nextId) {
            roomMaterials.get(nextId)?.emissive.set("#51251f");
          }
          hoveredId = nextId;
          setHoveredRoom(nextId);
          renderer.domElement.style.cursor = nextId ? "pointer" : "grab";
        }

        function onPointerDown(event: PointerEvent) {
          pointerDown = true;
          dragDistance = 0;
          previousX = event.clientX;
          previousY = event.clientY;
          renderer.domElement.setPointerCapture(event.pointerId);
          renderer.domElement.focus();
          setDragging(true);
        }

        function onPointerMove(event: PointerEvent) {
          if (!pointerDown) {
            updateHover(event);
            return;
          }
          const dx = event.clientX - previousX;
          const dy = event.clientY - previousY;
          dragDistance += Math.abs(dx) + Math.abs(dy);
          yaw -= dx * 0.006;
          pitch = THREE.MathUtils.clamp(pitch + dy * 0.004, 0.34, 1.34);
          previousX = event.clientX;
          previousY = event.clientY;
          updateCamera();
        }

        function onPointerUp(event: PointerEvent) {
          pointerDown = false;
          setDragging(false);
          renderer.domElement.releasePointerCapture(event.pointerId);
          if (dragDistance >= 8) return;
          setPointer(event);
          raycaster.setFromCamera(pointer, camera);
          const hit = raycaster.intersectObjects(roomMeshes, false)[0];
          const roomId = hit?.object.userData.roomId as RoomId | undefined;
          if (roomId) onEnterRef.current(roomId);
        }

        function onPointerLeave() {
          if (hoveredId) {
            roomMaterials.get(hoveredId)?.emissive.set("#000000");
          }
          hoveredId = null;
          setHoveredRoom(null);
        }

        function onWheel(event: WheelEvent) {
          event.preventDefault();
          radius = THREE.MathUtils.clamp(radius + event.deltaY * 0.025, 24, 58);
          setZoomDistance(Math.round(radius));
          updateCamera();
        }

        function resetView() {
          yaw = -0.7;
          pitch = 0.78;
          radius = 42;
          setZoomDistance(42);
          updateCamera();
        }

        function onKeyDown(event: KeyboardEvent) {
          if (event.key === "ArrowLeft") yaw += 0.08;
          else if (event.key === "ArrowRight") yaw -= 0.08;
          else if (event.key === "ArrowUp")
            pitch = THREE.MathUtils.clamp(pitch + 0.06, 0.34, 1.34);
          else if (event.key === "ArrowDown")
            pitch = THREE.MathUtils.clamp(pitch - 0.06, 0.34, 1.34);
          else if (event.key.toLowerCase() === "r") resetView();
          else return;
          event.preventDefault();
          updateCamera();
        }

        updateCamera();
        resize();

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
        renderer.domElement.addEventListener("pointerdown", onPointerDown);
        renderer.domElement.addEventListener("pointermove", onPointerMove);
        renderer.domElement.addEventListener("pointerup", onPointerUp);
        renderer.domElement.addEventListener("pointercancel", onPointerUp);
        renderer.domElement.addEventListener("pointerleave", onPointerLeave);
        renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
        renderer.domElement.addEventListener("keydown", onKeyDown);
        mount.addEventListener("overview-reset", resetView);

        let animationFrame = 0;
        function animate() {
          renderer.render(scene, camera);
          animationFrame = requestAnimationFrame(animate);
        }
        animationFrame = requestAnimationFrame(animate);

        cleanup = () => {
          cancelAnimationFrame(animationFrame);
          resizeObserver.disconnect();
          renderer.domElement.removeEventListener("pointerdown", onPointerDown);
          renderer.domElement.removeEventListener("pointermove", onPointerMove);
          renderer.domElement.removeEventListener("pointerup", onPointerUp);
          renderer.domElement.removeEventListener("pointercancel", onPointerUp);
          renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
          renderer.domElement.removeEventListener("wheel", onWheel);
          renderer.domElement.removeEventListener("keydown", onKeyDown);
          mount.removeEventListener("overview-reset", resetView);
          disposeScene(scene);
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => {
        if (!cancelled) setWebglFailed(true);
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  const dispatchControl = (control: "zoomIn" | "zoomOut" | "reset") => {
    const mount = mountRef.current;
    const canvas = mount?.querySelector("canvas");
    if (control === "reset") {
      mount?.dispatchEvent(new Event("overview-reset"));
      return;
    }
    if (!canvas) return;
    canvas.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: control === "zoomIn" ? -220 : 220,
        cancelable: true,
      }),
    );
  };

  const highlightedRoom = hoveredRoom ? roomById[hoveredRoom] : null;

  return (
    <div
      className={`tour-canvas overview-canvas ${dragging ? "is-dragging" : ""}`}
      ref={mountRef}
    >
      {webglFailed && (
        <OverviewFallback currentRoom={currentRoom} onEnter={onEnter} />
      )}
      <div className="canvas-shade overview-shade" />
      <div className="overview-compass" aria-hidden="true">
        <span>N</span>
        <i>↑</i>
      </div>
      <div className="viewer-controls overview-viewer-controls" aria-label="鳥瞰視角控制">
        <button
          type="button"
          onClick={() => dispatchControl("zoomIn")}
          aria-label="放大鳥瞰模型"
        >
          ＋
        </button>
        <span className="zoom-readout">{zoomDistance}m</span>
        <button
          type="button"
          onClick={() => dispatchControl("zoomOut")}
          aria-label="縮小鳥瞰模型"
        >
          −
        </button>
        <button
          type="button"
          className="overview-reset"
          onClick={() => dispatchControl("reset")}
          aria-label="重設鳥瞰視角"
          title="重設視角"
        >
          ↺
        </button>
      </div>
      <div className="drag-hint overview-drag-hint">
        <span className="drag-mark">↔</span>
        拖曳旋轉 · 滾輪縮放 · 點擊房間進入
      </div>
      {highlightedRoom && (
        <div className="overview-hover-card" aria-live="polite">
          <span>{highlightedRoom.index}</span>
          <div>
            <strong>{highlightedRoom.name}</strong>
            <small>點擊進入 360° 室內視角</small>
          </div>
        </div>
      )}
      <div className="overview-legend">
        <span>
          <i className="overview-legend-room" />
          可進入空間
        </span>
        <span>
          <i className="overview-legend-route" />
          主要動線
        </span>
      </div>
    </div>
  );
}

function TourCanvas({
  room,
  autoRotate,
  onMove,
}: {
  room: Room;
  autoRotate: boolean;
  onMove: (roomId: RoomId) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onMoveRef = useRef(onMove);
  const autoRotateRef = useRef(autoRotate);
  const [zoom, setZoom] = useState(68);
  const [dragging, setDragging] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void import("three")
      .then((threeModule) => {
        if (cancelled) return;
        THREE = threeModule;

        const mount = mountRef.current;
        if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#171a1b");
    scene.fog = new THREE.FogExp2("#171a1b", 0.014);
    const camera = new THREE.PerspectiveCamera(68, 1, 0.05, 80);
    camera.position.set(0, 1.64, 0);
    camera.rotation.order = "YXZ";

    const testCanvas = document.createElement("canvas");
    const webglContext = testCanvas.getContext("webgl2");
    if (!webglContext) {
      setWebglFailed(true);
      return;
    }

    let renderer: ThreeTypes.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute(
      "aria-label",
      `${room.name} 360度虛擬空間，可拖曳視角`,
    );
    renderer.domElement.setAttribute("role", "img");
    mount.prepend(renderer.domElement);

    const [width, depth, height] = room.size;
    const wallTexture = concreteTexture(room.index.charCodeAt(0) * 37 + 13);
    wallTexture.repeat.set(Math.max(2, width / 3), Math.max(1.5, height / 2));
    const groundTexture = floorTexture(room.index.charCodeAt(1) * 57 + 19);

    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      color: "#a5a29a",
      roughness: 0.93,
      metalness: 0.01,
      side: THREE.DoubleSide,
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      color: "#8c8a83",
      roughness: 0.98,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const darkConcrete = new THREE.MeshStandardMaterial({
      color: "#4c4e4d",
      roughness: 0.96,
    });
    const blackMaterial = new THREE.MeshStandardMaterial({
      color: "#111516",
      roughness: 0.72,
    });
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: "#899296",
      roughness: 0.35,
      metalness: 0.72,
    });
    const redMaterial = new THREE.MeshStandardMaterial({
      color: "#8f2f28",
      roughness: 0.48,
      metalness: 0.26,
    });
    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: "#d7d1c6",
      roughness: 0.76,
    });

    function addPlane(
      planeWidth: number,
      planeHeight: number,
      x: number,
      y: number,
      z: number,
      rotX: number,
      rotY: number,
      material: ThreeTypes.Material,
    ) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(planeWidth, planeHeight),
        material,
      );
      mesh.position.set(x, y, z);
      mesh.rotation.set(rotX, rotY, 0);
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    }

    addPlane(width, depth, 0, 0, 0, -Math.PI / 2, 0, floorMaterial);
    addPlane(width, height, 0, height / 2, -depth / 2, 0, 0, wallMaterial);
    addPlane(
      width,
      height,
      0,
      height / 2,
      depth / 2,
      0,
      Math.PI,
      wallMaterial,
    );
    addPlane(
      depth,
      height,
      -width / 2,
      height / 2,
      0,
      0,
      Math.PI / 2,
      wallMaterial,
    );
    addPlane(
      depth,
      height,
      width / 2,
      height / 2,
      0,
      0,
      -Math.PI / 2,
      wallMaterial,
    );
    addPlane(
      width,
      depth,
      0,
      height,
      0,
      Math.PI / 2,
      0,
      darkConcrete,
    );

    const ambient = new THREE.HemisphereLight("#e6edf0", "#443e36", 1.5);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight("#fff4dd", 2.1);
    keyLight.position.set(-2, height - 0.4, 2.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const beamCount = Math.max(2, Math.round(depth / 2.1));
    for (let i = 0; i < beamCount; i += 1) {
      const z = -depth / 2 + ((i + 0.65) * depth) / beamCount;
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.42, 0.28),
        darkConcrete,
      );
      beam.position.set(0, height - 0.22, z);
      beam.castShadow = true;
      beam.receiveShadow = true;
      scene.add(beam);
    }

    const duct = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.76, 0.3, 0.54),
      steelMaterial,
    );
    duct.position.set(0, height - 0.72, -depth * 0.26);
    duct.castShadow = true;
    scene.add(duct);

    function addPipe(
      z: number,
      material: ThreeTypes.Material,
      radius: number,
    ) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, width * 0.86, 12),
        material,
      );
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, height - 0.56, z);
      pipe.castShadow = true;
      scene.add(pipe);
    }
    addPipe(depth * 0.29, redMaterial, 0.055);
    addPipe(depth * 0.2, steelMaterial, 0.035);

    const lightCount = Math.max(2, Math.round(width / 4));
    for (let i = 0; i < lightCount; i += 1) {
      const x = -width / 2 + ((i + 0.7) * width) / lightCount;
      const casing = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.08, 0.18),
        whiteMaterial,
      );
      casing.position.set(x, height - 0.8, depth * 0.04);
      scene.add(casing);
      const glow = new THREE.PointLight("#fff5dc", 2.6, 7.5, 2.1);
      glow.position.set(x, height - 1.05, depth * 0.04);
      scene.add(glow);
    }

    const signMap = roomSignTexture(room);
    const signMaterial = new THREE.MeshBasicMaterial({
      map: signMap,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.12), signMaterial);
    sign.position.set(-width * 0.21, 2.55, -depth / 2 + 0.025);
    scene.add(sign);

    function addColumn(x: number, z: number, sx = 0.58, sz = 0.58) {
      const column = new THREE.Mesh(
        new THREE.BoxGeometry(sx, height, sz),
        darkConcrete,
      );
      column.position.set(x, height / 2, z);
      column.castShadow = true;
      column.receiveShadow = true;
      scene.add(column);
    }

    if (["hall", "common", "training"].includes(room.kind)) {
      addColumn(-width * 0.27, depth * 0.08);
      addColumn(width * 0.24, depth * 0.08);
      if (room.kind === "common") addColumn(width * 0.38, -depth * 0.3);
    }

    if (room.kind === "entry") {
      const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 1.65, 0.22),
        whiteMaterial,
      );
      cabinet.position.set(-width / 2 + 0.13, 1.62, -0.7);
      cabinet.rotation.y = Math.PI / 2;
      cabinet.castShadow = true;
      scene.add(cabinet);
      const smallCabinet = cabinet.clone();
      smallCabinet.scale.set(0.7, 0.62, 1);
      smallCabinet.position.z = 0.55;
      scene.add(smallCabinet);
    }

    if (room.kind === "reception") {
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 1.02, 0.8),
        darkConcrete,
      );
      counter.position.set(-0.8, 0.51, -1.25);
      counter.castShadow = true;
      scene.add(counter);
    }

    if (room.kind === "office") {
      const partition = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 2.65, depth * 0.58),
        whiteMaterial,
      );
      partition.position.set(width * 0.15, 1.325, -0.45);
      partition.castShadow = true;
      scene.add(partition);
    }

    if (room.kind === "clinical") {
      const partition = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 2.7, depth * 0.62),
        whiteMaterial,
      );
      partition.position.set(0.6, 1.35, -0.35);
      scene.add(partition);
    }

    if (room.kind === "wet") {
      const recessed = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.72, 0.08, depth * 0.62),
        blackMaterial,
      );
      recessed.position.set(0.45, 0.01, 0);
      scene.add(recessed);
      for (let i = 0; i < 8; i += 1) {
        const stub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.075, 0.64, 12),
          whiteMaterial,
        );
        stub.position.set(
          -width * 0.24 + (i % 4) * 0.9,
          0.32,
          -0.78 + Math.floor(i / 4) * 1.6,
        );
        scene.add(stub);
      }
    }

    const hotspotObjects: ThreeTypes.Sprite[] = [];

    function doorTransform(link: RoomLink) {
      const alongX = link.offset * width;
      const alongZ = link.offset * depth;
      if (link.side === "front") {
        return {
          x: alongX,
          z: -depth / 2 + 0.035,
          ry: 0,
          hx: alongX,
          hz: -depth / 2 + 0.46,
        };
      }
      if (link.side === "back") {
        return {
          x: alongX,
          z: depth / 2 - 0.035,
          ry: Math.PI,
          hx: alongX,
          hz: depth / 2 - 0.46,
        };
      }
      if (link.side === "left") {
        return {
          x: -width / 2 + 0.035,
          z: alongZ,
          ry: Math.PI / 2,
          hx: -width / 2 + 0.46,
          hz: alongZ,
        };
      }
      return {
        x: width / 2 - 0.035,
        z: alongZ,
        ry: -Math.PI / 2,
        hx: width / 2 - 0.46,
        hz: alongZ,
      };
    }

    room.links.forEach((link) => {
      const target = roomById[link.to];
      const transform = doorTransform(link);
      const opening = new THREE.Mesh(
        new THREE.PlaneGeometry(1.55, 2.55),
        blackMaterial,
      );
      opening.position.set(transform.x, 1.275, transform.z);
      opening.rotation.y = transform.ry;
      scene.add(opening);

      const frameGeo =
        link.side === "front" || link.side === "back"
          ? new THREE.BoxGeometry(0.11, 2.7, 0.13)
          : new THREE.BoxGeometry(0.13, 2.7, 0.11);
      const frameOffset =
        link.side === "front" || link.side === "back"
          ? [0.83, 0, 0]
          : [0, 0, 0.83];
      [-1, 1].forEach((direction) => {
        const frame = new THREE.Mesh(frameGeo, steelMaterial);
        frame.position.set(
          transform.x + frameOffset[0] * direction,
          1.35,
          transform.z + frameOffset[2] * direction,
        );
        scene.add(frame);
      });

      const spriteMaterial = new THREE.SpriteMaterial({
        map: labelTexture(target.name),
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const hotspot = new THREE.Sprite(spriteMaterial);
      hotspot.position.set(transform.hx, 1.2, transform.hz);
      hotspot.scale.set(2.6, 0.9, 1);
      hotspot.userData.roomId = link.to;
      hotspot.renderOrder = 30;
      scene.add(hotspot);
      hotspotObjects.push(hotspot);
    });

    let yaw = THREE.MathUtils.degToRad(room.yaw);
    let pitch = THREE.MathUtils.degToRad(room.pitch);
    let fov = 68;
    let pointerDown = false;
    let dragDistance = 0;
    let previousX = 0;
    let previousY = 0;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function updateCamera() {
      camera.rotation.set(pitch, yaw, 0, "YXZ");
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    updateCamera();

    function resize() {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    }
    resize();

    function onPointerDown(event: PointerEvent) {
      pointerDown = true;
      dragDistance = 0;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      setDragging(true);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (pointerDown) {
        const dx = event.clientX - previousX;
        const dy = event.clientY - previousY;
        dragDistance += Math.abs(dx) + Math.abs(dy);
        yaw -= dx * 0.0042;
        pitch -= dy * 0.0035;
        pitch = THREE.MathUtils.clamp(pitch, -1.15, 1.08);
        previousX = event.clientX;
        previousY = event.clientY;
        updateCamera();
        return;
      }

      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hotspotObjects, false)[0];
      renderer.domElement.style.cursor = hit ? "pointer" : "grab";
    }

    function onPointerUp(event: PointerEvent) {
      pointerDown = false;
      setDragging(false);
      renderer.domElement.releasePointerCapture(event.pointerId);
      if (dragDistance < 8) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(hotspotObjects, false)[0];
        if (hit?.object.userData.roomId) {
          onMoveRef.current(hit.object.userData.roomId as RoomId);
        }
      }
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      fov = THREE.MathUtils.clamp(fov + event.deltaY * 0.025, 46, 84);
      setZoom(Math.round(fov));
      updateCamera();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") yaw += 0.08;
      else if (event.key === "ArrowRight") yaw -= 0.08;
      else if (event.key === "ArrowUp")
        pitch = THREE.MathUtils.clamp(pitch + 0.06, -1.15, 1.08);
      else if (event.key === "ArrowDown")
        pitch = THREE.MathUtils.clamp(pitch - 0.06, -1.15, 1.08);
      else return;
      event.preventDefault();
      updateCamera();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    let animationFrame = 0;
    let last = performance.now();
    function animate(now: number) {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (autoRotateRef.current && !pointerDown) {
        yaw -= delta * 0.085;
        updateCamera();
      }
      hotspotObjects.forEach((hotspot, index) => {
        hotspot.position.y = 1.23 + Math.sin(now * 0.0024 + index) * 0.055;
      });
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    }
    animationFrame = requestAnimationFrame(animate);

    cleanup = () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
      })
      .catch(() => {
        if (!cancelled) setWebglFailed(true);
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [room]);

  const dispatchControl = (control: "zoomIn" | "zoomOut" | "reset") => {
    const canvas = mountRef.current?.querySelector("canvas");
    if (!canvas) {
      setZoom((value) =>
        control === "zoomIn"
          ? Math.max(46, value - 5)
          : Math.min(84, value + 5),
      );
      return;
    }
    if (control === "reset") {
      setZoom(68);
      onMove(room.id);
      return;
    }
    const direction = control === "zoomIn" ? -180 : 180;
    canvas.dispatchEvent(
      new WheelEvent("wheel", { deltaY: direction, cancelable: true }),
    );
  };

  return (
    <div
      className={`tour-canvas ${dragging ? "is-dragging" : ""}`}
      ref={mountRef}
    >
      {webglFailed && (
        <FallbackScene
          room={room}
          zoom={zoom}
          autoRotate={autoRotate}
          onMove={onMove}
        />
      )}
      <div className="canvas-shade" />
      <div className="viewer-controls" aria-label="視角控制">
        <button
          type="button"
          onClick={() => dispatchControl("zoomIn")}
          aria-label="放大"
          title="放大"
        >
          ＋
        </button>
        <span className="zoom-readout">{zoom}°</span>
        <button
          type="button"
          onClick={() => dispatchControl("zoomOut")}
          aria-label="縮小"
          title="縮小"
        >
          −
        </button>
      </div>
      <div className="drag-hint">
        <span className="drag-mark">↔</span>
        拖曳觀看 360°
      </div>
    </div>
  );
}

function FloorPlan({
  currentRoom,
  onMove,
  expanded = false,
}: {
  currentRoom: RoomId;
  onMove: (roomId: RoomId) => void;
  expanded?: boolean;
}) {
  return (
    <div className={`plan-wrap ${expanded ? "is-expanded" : ""}`}>
      {/* The image is a crop of the user-supplied tender floor plan. */}
      <img
        src="/kai-tak-floorplan.svg"
        alt="啟德4A2地下長者日間護理中心圖則"
        draggable={false}
      />
      {ROOMS.map((room) => (
        <button
          type="button"
          key={room.id}
          className={`plan-point ${currentRoom === room.id ? "is-current" : ""}`}
          style={{ left: `${room.planX}%`, top: `${room.planY}%` }}
          onClick={() => onMove(room.id)}
          aria-label={`前往${room.name}`}
          title={room.name}
        >
          <span>{room.index}</span>
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [currentRoomId, setCurrentRoomId] = useState<RoomId>("entrance");
  const [viewMode, setViewMode] = useState<"overview" | "room">("overview");
  const [panelOpen, setPanelOpen] = useState(true);
  const [planOpen, setPlanOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [started, setStarted] = useState(false);
  const room = roomById[currentRoomId];

  const moveTo = useCallback((roomId: RoomId) => {
    setCurrentRoomId(roomId);
    setViewMode("room");
    setStarted(true);
  }, []);

  const openOverview = useCallback(() => {
    setViewMode("overview");
    setStarted(true);
  }, []);

  const progress = useMemo(
    () => ROOMS.findIndex((item) => item.id === currentRoomId) + 1,
    [currentRoomId],
  );

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  return (
    <main className="tour-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            360
          </span>
          <div>
            <p>啟德 4A2 · 地下</p>
            <h1>長者日間護理中心｜現況導覽</h1>
          </div>
        </div>
        <nav className="mode-switch" aria-label="模型檢視模式">
          <button
            type="button"
            className={viewMode === "overview" ? "is-current" : ""}
            onClick={openOverview}
          >
            <span>◇</span>
            總覽鳥瞰
          </button>
          <button
            type="button"
            className={viewMode === "room" ? "is-current" : ""}
            onClick={() => setViewMode("room")}
          >
            <span>◎</span>
            室內 360°
          </button>
        </nav>
        <div className="top-actions">
          <span className="model-badge">
            <i />
            圖則建模 · 視覺模擬
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={() => setAboutOpen(true)}
            aria-label="查看模型說明"
            title="模型說明"
          >
            i
          </button>
          <button
            type="button"
            className="icon-button fullscreen-button"
            onClick={toggleFullscreen}
            aria-label="全螢幕"
            title="全螢幕"
          >
            ⛶
          </button>
          <button
            type="button"
            className={`panel-toggle ${panelOpen ? "is-open" : ""}`}
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-label="開關導覽目錄"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <section className="viewer-stage">
        {viewMode === "overview" ? (
          <OverviewCanvas currentRoom={currentRoomId} onEnter={moveTo} />
        ) : (
          <TourCanvas
            key={currentRoomId}
            room={room}
            autoRotate={autoRotate}
            onMove={moveTo}
          />
        )}

        {viewMode === "overview" ? (
          <div className="room-card overview-card">
            <div className="room-card-index overview-card-index">
              <span>3D</span>
              <small>全層</small>
            </div>
            <div className="room-copy">
              <p>INTERACTIVE OVERVIEW</p>
              <h2>總覽鳥瞰</h2>
              <span>9 個互動空間</span>
              <small>
                拖曳旋轉模型、滾輪縮放；點擊彩色房間即可進入相應的 360° 室內視角。
              </small>
            </div>
          </div>
        ) : (
          <div className="room-card">
            <div className="room-card-index">
              <span>{room.index}</span>
              <small>
                {progress}/{ROOMS.length}
              </small>
            </div>
            <div className="room-copy">
              <p>{room.english}</p>
              <h2>{room.name}</h2>
              <span>{room.area}</span>
              <small>{room.description}</small>
            </div>
          </div>
        )}

        <div className="bottom-actions">
          {viewMode === "overview" ? (
            <button type="button" onClick={() => setPanelOpen(true)}>
              <span>＋</span>
              選擇空間
            </button>
          ) : (
            <button
              type="button"
              className={autoRotate ? "is-active" : ""}
              onClick={() => setAutoRotate((value) => !value)}
            >
              <span>↻</span>
              {autoRotate ? "停止自動旋轉" : "自動旋轉"}
            </button>
          )}
          <button type="button" onClick={() => setPlanOpen(true)}>
            <span>⌗</span>
            查看完整圖則
          </button>
        </div>

        {!started && (
          <div className="start-card">
            <p>INTERACTIVE MODEL · KAI TAK 4A2</p>
            <h2>從鳥瞰了解整體空間</h2>
            <span>
              拖曳旋轉、滾輪縮放，點擊房間進入 360° 室內視角。模型按圖則建立，材質只用作模擬清水樓狀態。
            </span>
            <button type="button" onClick={() => setStarted(true)}>
              開始探索模型
              <b>→</b>
            </button>
          </div>
        )}
      </section>

      <aside className={`tour-panel ${panelOpen ? "is-open" : ""}`}>
        <div className="panel-heading">
          <div>
            <p>FLOOR PLAN</p>
            <h2>圖則定位</h2>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            aria-label="關閉導覽目錄"
          >
            ×
          </button>
        </div>

        <FloorPlan currentRoom={currentRoomId} onMove={moveTo} />

        <div className="plan-legend">
          <span>
            <i className="legend-exact" />
            圖則資料
          </span>
          <span>
            <i className="legend-estimate" />
            視覺推算
          </span>
        </div>

        <nav className="room-list" aria-label="導覽位置">
          {ROOMS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={currentRoomId === item.id ? "is-current" : ""}
              onClick={() => moveTo(item.id)}
            >
              <span>{item.index}</span>
              <div>
                <strong>{item.name}</strong>
                <small>{item.area}</small>
              </div>
              <b>→</b>
            </button>
          ))}
        </nav>

        <p className="panel-note">非實景攝影 · 不可作量度或施工用途</p>
      </aside>

      {planOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="完整互動圖則"
        >
          <div className="plan-modal">
            <div className="modal-heading">
              <div>
                <p>INTERACTIVE FLOOR PLAN</p>
                <h2>啟德 4A2 地下圖則</h2>
              </div>
              <button
                type="button"
                onClick={() => setPlanOpen(false)}
                aria-label="關閉"
              >
                ×
              </button>
            </div>
            <FloorPlan
              currentRoom={currentRoomId}
              onMove={(id) => {
                moveTo(id);
                setPlanOpen(false);
              }}
              expanded
            />
            <p>點擊編號進入相應空間。紅色虛線為圖則所示處所界線。</p>
          </div>
        </div>
      )}

      {aboutOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="模型說明"
        >
          <div className="about-modal">
            <button
              type="button"
              className="modal-close"
              onClick={() => setAboutOpen(false)}
              aria-label="關閉"
            >
              ×
            </button>
            <p>MODEL NOTES</p>
            <h2>這個導覽如何還原現場</h2>
            <div className="certainty-list">
              <article>
                <span className="certainty-dot exact" />
                <div>
                  <h3>按圖則建立</h3>
                  <p>處所界線、房間用途、標示面積及大致相互位置。</p>
                </div>
              </article>
              <article>
                <span className="certainty-dot estimate" />
                <div>
                  <h3>按比例推算</h3>
                  <p>空間長闊、門口位置、柱位及各定位點的視角。</p>
                </div>
              </article>
              <article>
                <span className="certainty-dot reference" />
                <div>
                  <h3>環境參考</h3>
                  <p>
                    混凝土牆地、外露樓底、喉管及臨時照明參考另一清水樓場地，只用作表達「未裝修」狀態。
                  </p>
                </div>
              </article>
            </div>
            <div className="about-warning">
              啟德 4A2 的現場相片、樓高及機電資料尚未提供，因此本版本屬空間理解模型，並非實景紀錄或施工模型。
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => setAboutOpen(false)}
            >
              返回導覽
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
