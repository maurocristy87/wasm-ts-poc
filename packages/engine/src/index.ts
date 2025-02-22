import release from "./wasm/debug.wasm";

type WasmModuleExprts = {
    insertShape: (id: number, pointer: number, length: number, circumference: number) => void;
    updateBroadPhase: () => void;
    retrieveNeighbors: (id: number) => number;
    getNeighborsLength: () => number;
    memory: WebAssembly.Memory;
    __new(size: number, id: number): number;
    __pin(ptr: number): number;
    __unpin(ptr: number): void;
    __collect(): void;
};

export async function run(rectsLength: number, render: boolean = true) {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;
    canvas.style.width = "1000px";
    canvas.style.height = "1000px";

    document.body.appendChild(canvas);

    const wasm = await loadWasm();

    main(rectsLength, render && canvas, wasm);
}

export async function main(rectsLength: number, canvas: HTMLCanvasElement, wasm: WasmModuleExprts) {
    const { insertShape, updateBroadPhase, retrieveNeighbors, getNeighborsLength, memory } = wasm;
    const rectsToDraw: { x: number; y: number; width: number; height: number; id: number; collision: boolean }[] = [];

    for (let i = 0; i < rectsLength; i++) {
        rectsToDraw.push({
            x: Math.floor(Math.random() * 400),
            y: Math.floor(Math.random() * 400),
            width: 40,
            height: 40,
            id: i,
            collision: false,
        });

        const { x, y, width, height } = rectsToDraw[i];

        const vertices = new Float64Array([x, y, x, y + height, x + width, y + height, x + width, y]);
        const ptr = wasm.__new(vertices.length * 8, 3); // `3` is the id for Float64Array
        new Float64Array(wasm.memory.buffer, ptr, vertices.length).set(vertices);

        insertShape(i, ptr, vertices.length, 0);
    }

    updateBroadPhase();

    for (let i = 0; i < rectsLength; i++) {
        const neighborsPointer = retrieveNeighbors(i);
        const neighborsLength = getNeighborsLength();
        const neighbors = new Int32Array(memory.buffer, neighborsPointer, neighborsLength);

        rectsToDraw[i].collision = neighborsLength > 1;
    }

    if (canvas) renderRects(canvas, rectsToDraw);

    window.requestAnimationFrame(() => main(rectsLength, canvas, wasm));
}

const loadWasm = async () => {
    const wasmBuffer = await release();

    const imports = {
        env: {
            abort: () => console.error("Abort called!"),
        },
    };

    const instance = new WebAssembly.Instance(wasmBuffer, imports);

    return instance.exports as WasmModuleExprts;
};

const renderRects = (
    canvas: HTMLCanvasElement,
    rects: { id: number; x: number; y: number; width: number; height: number; collision: boolean }[],
) => {
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const rect of rects) {
        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

        ctx.fillStyle = "#000000";
        ctx.fillText(`${rect.id}: ${rect.collision ? "C" : ""}`, rect.x + rect.width / 3, rect.y + rect.height / 2);
    }
};
