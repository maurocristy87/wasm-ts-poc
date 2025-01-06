import { Quadtree } from "./collision2d/broadPhase/QuadTree";
import { Rect } from "./math/Rect";

const rects: Map<i32, Rect> = new Map<i32, Rect>();
const bounds: Rect = new Rect(0, 0, 0, 0);
const quadtree: Quadtree = new Quadtree(bounds);
const rectsToInsert: Set<i32> = new Set<i32>();
let neighbors: i32[] = [];

export function insertRect(id: i32, x: f64, y: f64, width: f64, height: f64): void {
    if (!rects.has(id)) rects.set(id, new Rect(x, y, width, height));

    const rect = rects.get(id);
    rect.set(x, y, width, height);

    rectsToInsert.add(id);
}

export function updateBroadPhase(): void {
    if (rectsToInsert.size === 0) return;

    let minX: f64 = Infinity;
    let minY: f64 = Infinity;
    let maxX: f64 = -Infinity;
    let maxY: f64 = -Infinity;

    const ids = rectsToInsert.values();

    for (let i = 0; i < ids.length; i++) {
        const rect = rects.get(ids[i]);
        if (!rect) continue;

        if (rect.x < minX) minX = rect.x;
        if (rect.y < minY) minY = rect.y;
        if (rect.x + rect.width > maxX) maxX = rect.x + rect.width;
        if (rect.y + rect.height > maxY) maxY = rect.y + rect.height;
    }

    bounds.set(minX, minY, maxX - minX, maxY - minY);
    quadtree.clear(bounds);

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        quadtree.insert(id, rects.get(id));
    }

    rectsToInsert.clear();
}

export function retrieveNeighbors(id: i32): usize {
    neighbors = quadtree.retrieve(rects.get(id));
    const result = new Int32Array(neighbors.length);

    for (let i = 0; i < neighbors.length; i++) {
        result[i] = neighbors[i];
    }

    return result.dataStart;
}

export function getNeighborsLength(): i32 {
    return neighbors.length;
}
