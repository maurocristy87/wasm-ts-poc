import { renderShapes } from "./rendering";
import { generateRandomPolygon, generateRandomRect, Shape } from "./shape";
import release from "./wasm/release.wasm";

type WasmModuleExprts = {
    insertShape(id: number, pointer: number, length: number, circumference: number): void;
    updateBroadPhase(): void;
    retrieveNeighbors(id: number): number;
    getNeighborsLength(): number;
    memory: WebAssembly.Memory;
    __new(size: number, id: number): number;
    __pin(ptr: number): number;
    __unpin(ptr: number): void;
    __collect(): void;
};

export async function run(rectsLength: number, render: boolean = true) {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    canvas.style.width = "80%";
    canvas.style.height = "80%";

    document.body.appendChild(canvas);

    const wasm = await loadWasm();

    main(rectsLength, render && canvas, wasm as WasmModuleExprts);
}

const loadWasm = async () => {
    const wasmBuffer = await release();
    const imports = {
        env: {
            memory: new WebAssembly.Memory({ initial: 255, maximum: 255 }),
            abort: (error: any) => console.error("Abort called! Error: " + error),
        },
    };
    const instance = new WebAssembly.Instance(wasmBuffer, imports);

    return instance.exports as WasmModuleExprts;
};

const main = (rectsLength: number, canvas: HTMLCanvasElement, wasm: WasmModuleExprts) => {
    const { insertShape, updateBroadPhase, retrieveNeighbors, getNeighborsLength, memory } = wasm;
    const shapes: Shape[] = [];

    const maxVertices = 8;
    const verticesPtr = wasm.__new(maxVertices * 2 * 8, 3); // 3 is the id for Float64Array
    wasm.__pin(verticesPtr);

    for (let i = 0; i < rectsLength; i++) {
        // const shape = generateRandomRect();
        const shape = generateRandomPolygon(3, 8);
        shapes.push(shape);

        const vertices = new Float64Array(shape.vertices);
        new Float64Array(wasm.memory.buffer, verticesPtr, vertices.length).set(vertices);

        insertShape(i, verticesPtr, vertices.length, 0);
    }

    // console.log(verticesPtr);

    // free memory after inserting the shapes
    wasm.__unpin(verticesPtr);

    updateBroadPhase();

    for (let i = 0; i < rectsLength; i++) {
        const neighborsPointer = retrieveNeighbors(i);
        const neighborsLength = getNeighborsLength();
        const neighbors = new Int32Array(memory.buffer, neighborsPointer, neighborsLength);

        shapes[i].hasCollision = neighborsLength > 1;
    }

    wasm.__collect();

    if (canvas) renderShapes(canvas, shapes);

    window.requestAnimationFrame(() => main(rectsLength, canvas, wasm));
};
