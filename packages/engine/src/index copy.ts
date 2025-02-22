import { memory } from "./wasm/release";
import release from "./wasm/release.wasm";

// types
type WasmModuleExprts = {
    insertShape(id: number, pointer: number, length: number, circumference: number): void;
    updateBroadPhase(): void;
    retrieveNeighbors(id: number): number;
    getNeighborsLength(): number;
    getCollisionResult(shapeId: number, neighborId: number): number;
    clear(): void;
    memory: WebAssembly.Memory;
    __new(size: number, id: number): number;
    __pin(ptr: number): number;
    __unpin(ptr: number): void;
    __collect(): void;
};

type Shape = {
    id: number;
    vertices: number[];
    center: number[];
    radius?: number;
    boundingBox: number[]; // [x, y, width, height]
    hasCollision?: boolean;
};

// logic
export async function run(shapeNumber: number, render: boolean = true) {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    canvas.style.width = "80%";
    canvas.style.height = "80%";

    document.body.appendChild(canvas);

    const wasm = await loadWasm();

    // state
    const shapes: Shape[] = [];
    const shapePointers = new Map<number, number>(); // shapeId -> pointer

    createShapes(shapeNumber, wasm, shapes, shapePointers);
    gameLoop(shapeNumber, render && canvas, wasm, shapes, shapePointers);
}

const loadWasm = async () => {
    const wasmBuffer = await release();

    const imports = {
        env: {
            memory: new WebAssembly.Memory({ initial: 256, maximum: 256 }),
            abort: () => console.error("Abort called!"),
            logMemoryStatus: (ptr: number, memorySize: number) => console.log(`Memory status: ${ptr}/${memorySize}`),
        },
    };

    const instance = new WebAssembly.Instance(wasmBuffer, imports);

    return instance.exports as WasmModuleExprts;
};

const createShapes = (
    shapeNumber: number,
    wasm: WasmModuleExprts,
    shapes: Shape[],
    shapePointers: Map<number, number>,
): void => {
    for (let i = 0; i < shapeNumber; i++) {
        const polygon = generateRandomPolygon();
        polygon.id = i;
        shapes.push(polygon);

        const { vertices, boundingBox } = polygon;
        const ptr = wasm.__new(vertices.length * 8, 3); // `3` is the id for Float64Array
        new Float64Array(memory.buffer, ptr, vertices.length).set(vertices);

        shapePointers.set(i, ptr);

        // console.log("Inserting shape", i, ptr, vertices.length, vertices, boundingBox);
        wasm.insertShape(i, ptr, vertices.length, 0);
    }
};

const generateRandomPolygon = (): Shape => {
    const numVertices = Math.floor(Math.random() * (8 - 3 + 1)) + 3;
    // const numVertices = 4;
    const centerX = 50 + Math.random() * 1820;
    const centerY = 50 + Math.random() * 980;
    const radius = 50;
    const angleStep = (Math.PI * 2) / numVertices;
    const vertices: number[] = [];
    const baseAngle = Math.random() * Math.PI * 2;
    // const baseAngle = 0;

    for (let i = 0; i < numVertices; i++) {
        const angle = baseAngle + angleStep * i;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        vertices.push(x, y);
    }

    return {
        id: 0,
        vertices,
        center: [centerX, centerY],
        boundingBox: vertices.reduce(
            (acc, val, idx) => {
                if (idx % 2 === 0) {
                    acc[0] = Math.min(acc[0], val);
                    acc[2] = Math.max(acc[2], val);
                } else {
                    acc[1] = Math.min(acc[1], val);
                    acc[3] = Math.max(acc[3], val);
                }
                return acc;
            },
            [Infinity, Infinity, -Infinity, -Infinity], // [minX, minY, maxX, maxY]
        ),
    };
};

const gameLoop = (
    verticesNumber: number,
    canvas: HTMLCanvasElement,
    wasm: WasmModuleExprts,
    shapes: Shape[],
    shapePointers: Map<number, number>,
): void => {
    const { updateBroadPhase, retrieveNeighbors, getNeighborsLength, getCollisionResult, clear, memory } = wasm;

    updateBroadPhase();

    for (let i = 0; i < verticesNumber; i++) {
        const neighborsPointer = retrieveNeighbors(i);
        const neighborsLength = getNeighborsLength();
        const neighbors = new Int32Array(memory.buffer, neighborsPointer, neighborsLength);

        console.log(`Neighbors for ${i}:`, Array.from(neighbors));

        for (let j = 0; j < neighborsLength; j++) {
            const neighborId = neighbors[j];
            if (i === neighborId) continue;

            const collisionResultPointer = getCollisionResult(i, neighborId);
            const collisionResult = new Float64Array(memory.buffer, collisionResultPointer, 3);

            if (collisionResult[2] !== Infinity) {
                shapes[i].hasCollision = true;
                shapes[neighborId].hasCollision = true;
                console.log(
                    `Collision between ${i} and ${neighborId}: direction (${collisionResult[0]}, ${collisionResult[1]}), penetration: ${collisionResult[2]}`,
                );
            }
        }
    }

    if (canvas) renderPolygons(canvas, shapes);

    window.requestAnimationFrame(() => gameLoop(verticesNumber, canvas, wasm, shapes, shapePointers));
};

const renderPolygons = (canvas: HTMLCanvasElement, polygons: Shape[]) => {
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const { id, vertices, boundingBox, center, hasCollision } of polygons) {
        // draw polygon
        ctx.fillStyle = hasCollision ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 0, 255, 1)";
        ctx.beginPath();
        ctx.moveTo(vertices[0], vertices[1]);
        for (let i = 2; i < vertices.length; i += 2) {
            ctx.lineTo(vertices[i], vertices[i + 1]);
        }
        ctx.closePath();
        ctx.fill();

        // draw id
        ctx.fillStyle = "#000000";
        ctx.fillText(`${id}`, center[0], center[1]);
        ctx.font = "20px Arial";

        // draw bounding box
        ctx.strokeStyle = "#00FF00";
        ctx.strokeRect(
            boundingBox[0],
            boundingBox[1],
            boundingBox[2] - boundingBox[0],
            boundingBox[3] - boundingBox[1],
        );
    }
};
