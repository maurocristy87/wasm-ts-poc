import { renderShapes } from "./rendering";
import { generateRandomPolygon, generateRandomRect, Shape } from "./shape";
import release from "./wasm/debug.wasm";

type WasmModuleExprts = {
    insertShape(id: number, pointer: number, length: number, circumference: number): void;
    updateBroadPhase(): void;
    retrieveNeighbors(id: number): number;
    getNeighborsLength(): number;
    memory: WebAssembly.Memory;
    __new(size: number, id: number): number;
};

export async function run(rectsLength: number, render: boolean = true) {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    canvas.style.width = "80%";
    canvas.style.height = "80%";

    document.body.appendChild(canvas);

    const wasm = await loadWasm();

    main(rectsLength, render && canvas, wasm);
}

const loadWasm = async () => {
    const wasmBuffer = await release();
    const imports = {
        env: {
            memory: new WebAssembly.Memory({ initial: 256, maximum: 256 }),
            abort: () => console.error("Abort called!"),
        },
    };
    const instance = new WebAssembly.Instance(wasmBuffer, imports);

    return instance.exports as WasmModuleExprts;
};

const main = (rectsLength: number, canvas: HTMLCanvasElement, wasm: WasmModuleExprts) => {
    const { insertShape, updateBroadPhase, retrieveNeighbors, getNeighborsLength, memory } = wasm;
    const shapes: Shape[] = [];

    for (let i = 0; i < rectsLength; i++) {
        const shape = generateRandomRect();
        // const shape = generateRandomPolygon(4, 4);
        shapes.push(shape);

        const vertices = new Float64Array(shape.vertices);
        const ptr = wasm.__new(vertices.length * 8, 3); // 3 is the id for Float64Array
        new Float64Array(wasm.memory.buffer, ptr, vertices.length).set(vertices);

        // console.log(ptr);

        insertShape(i, ptr, vertices.length, 0);
    }

    updateBroadPhase();

    for (let i = 0; i < rectsLength; i++) {
        const neighborsPointer = retrieveNeighbors(i);
        const neighborsLength = getNeighborsLength();
        const neighbors = new Int32Array(memory.buffer, neighborsPointer, neighborsLength);

        shapes[i].hasCollision = neighborsLength > 1;
    }

    if (canvas) renderShapes(canvas, shapes);

    window.requestAnimationFrame(() => main(rectsLength, canvas, wasm));
};
