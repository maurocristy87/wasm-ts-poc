import release from "./wasm/release.wasm";

type WasmModuleExprts = {
    insertRect: (id: number, x: number, y: number, width: number, height: number) => void;
    updateBroadPhase: () => void;
    retrieveNeighbors: (id: number) => number;
    getNeighborsLength: () => number;
    memory: WebAssembly.Memory;
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
    const { insertRect, updateBroadPhase, retrieveNeighbors, getNeighborsLength, memory } = wasm;
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

        insertRect(i, rectsToDraw[i].x, rectsToDraw[i].y, rectsToDraw[i].width, rectsToDraw[i].height);
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
            abort: () => {
                console.error("Abort called!");
            },
        },
    };

    const instance = new WebAssembly.Instance(wasmBuffer, imports);

    return instance.exports as WasmModuleExprts;
};

const renderRects = (
    canvas: HTMLCanvasElement,
    rects: { id: number; x: number; y: number; width: number; height: number }[],
) => {
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const rect of rects) {
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
    }

    for (const rect of rects) {
        ctx.fillText(rect.id.toString(), rect.x + rect.width / 2, rect.y + rect.height / 2);
        ctx.fillStyle = "black";
    }
};
