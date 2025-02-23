import { Quadtree } from "./collision2d/broadPhase/QuadTree";
import { calculateBoundingBoxFromCircumference, calculateBoundingBoxFromVertices } from "./math/Utils";
import { Rect } from "./math/Rect";

// shapes
const shapeIds: Set<i32> = new Set<i32>();
const boundingBoxes: Map<i32, Rect> = new Map<i32, Rect>();

// broad phase
const bounds: Rect = new Rect(0, 0, 0, 0);
const quadtree: Quadtree = new Quadtree(bounds);
let neighbors: i32[] = [];

export function insertShape(id: i32, pointer: usize, length: i32, circumference: i32): void {
    shapeIds.add(id);

    if (!boundingBoxes.has(id)) boundingBoxes.set(id, new Rect(0, 0, 0, 0));

    const data = Float64Array.wrap(changetype<ArrayBuffer>(pointer), 0, length);

    if (circumference > 0) {
        calculateBoundingBoxFromCircumference(boundingBoxes.get(id), data);
    } else {
        calculateBoundingBoxFromVertices(boundingBoxes.get(id), data);
    }
}

export function updateBroadPhase(): void {
    if (shapeIds.size === 0) return;

    let minX: f64 = Infinity;
    let minY: f64 = Infinity;
    let maxX: f64 = -Infinity;
    let maxY: f64 = -Infinity;

    const ids = shapeIds.values();

    for (let i = 0; i < ids.length; i++) {
        const rect = boundingBoxes.get(ids[i]);
        if (!rect) continue;

        if (rect.x < minX) minX = rect.x;
        if (rect.y < minY) minY = rect.y;
        if (rect.x + rect.width > maxX) maxX = rect.x + rect.width;
        if (rect.y + rect.height > maxY) maxY = rect.y + rect.height;
    }

    bounds.set(minX, minY, maxX - minX, maxY - minY);
    quadtree.clear(bounds);

    for (let i = 0; i < ids.length; i++) {
        if (!boundingBoxes.has(ids[i])) continue;
        const id = ids[i];
        quadtree.insert(id, boundingBoxes.get(id));
    }
}

export function retrieveNeighbors(id: i32): usize {
    neighbors = quadtree.retrieve(boundingBoxes.get(id));
    const result = new Int32Array(neighbors.length);

    for (let i = 0; i < neighbors.length; i++) {
        result[i] = neighbors[i];
    }

    return result.dataStart;
}

export function getNeighborsLength(): i32 {
    return neighbors.length;
}
