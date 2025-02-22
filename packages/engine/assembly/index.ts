import { Quadtree } from "./collision2d/broadPhase/QuadTree";
import {
    calculateBoundingBoxFromCircumference,
    calculateBoundingBoxFromVertices,
    calculateNormals,
} from "./math/Utils";
import { Rect } from "./math/Rect";
import { Sat } from "./collision2d/narrowPhase/Sat";

// @external("env", "logMemoryStatus")
// declare function logMemoryStatus(ptr: usize, memorySize: i32): void;

// shapes
const shapeIds: Set<i32> = new Set<i32>();
const boundingBoxes: Map<i32, Rect> = new Map<i32, Rect>();
const vertices: Map<i32, Float64Array> = new Map<i32, Float64Array>();
const circumferences: Map<i32, Float64Array> = new Map<i32, Float64Array>(); // id -> [x, y, radius]
const normals: Map<i32, Float64Array> = new Map<i32, Float64Array>();

// broad phase
const bounds: Rect = new Rect(0, 0, 0, 0);
const quadtree: Quadtree = new Quadtree(bounds);
let neighbors: Set<i32> = new Set<i32>();
let neighborsBuffer: Int32Array = new Int32Array(100); // 100 as a starter size

// narrow phase
const sat = new Sat();
let collisionResult: Float64Array = new Float64Array(3);

export function insertShape(id: i32, pointer: usize, length: i32, circumference: i32): void {
    if (!boundingBoxes.has(id)) boundingBoxes.set(id, new Rect(0, 0, 0, 0));

    const data = Float64Array.wrap(changetype<ArrayBuffer>(pointer), 0, length);

    if (circumference > 0) {
        calculateBoundingBoxFromCircumference(boundingBoxes.get(id), data);
        circumferences.set(id, data);
    } else {
        calculateBoundingBoxFromVertices(boundingBoxes.get(id), data);
        vertices.set(id, data);
        normals.set(id, calculateNormals(data));
    }

    shapeIds.add(id);
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
    quadtree.retrieve(boundingBoxes.get(id), neighbors);

    if (neighbors.size > neighborsBuffer.length) {
        neighborsBuffer = new Int32Array(neighbors.size);
    }

    for (let i = 0; i < neighbors.size; i++) {
        neighborsBuffer[i] = neighbors.values()[i];
    }

    return neighborsBuffer.dataStart;
}

export function getNeighborsLength(): i32 {
    return neighbors.size;
}

export function getCollisionResult(shapeId: i32, neighborId: i32): usize {
    sat.resolveForPolygons(
        vertices.get(shapeId),
        normals.get(shapeId),
        vertices.get(neighborId),
        normals.get(neighborId),
        collisionResult,
    );

    return collisionResult.dataStart;
}

export function resetMemory(): void {
    // shapes
    shapeIds.clear();
    boundingBoxes.clear();
    vertices.clear();
    circumferences.clear();
    normals.clear();

    // broad phase
    quadtree.clear(null);
    neighbors.clear();
    neighborsBuffer = new Int32Array(100);
}
