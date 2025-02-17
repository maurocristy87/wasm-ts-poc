import { Rect } from "./Rect";
import { vector2Normal } from "./Vector2";

export function calculateBoundingBoxFromVertices(rect: Rect, vertices: Float64Array): void {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let x: f64;
    let y: f64;
    const len = vertices.length;

    for (let i = 0; i < len; i += 2) {
        x = vertices[i];
        y = vertices[i + 1];

        if (x < minX) minX = x;
        else if (x > maxX) maxX = x;

        if (y < minY) minY = y;
        else if (y > maxY) maxY = y;
    }

    rect.set(minX, minY, maxX - minX, maxY - minY);
}

export function calculateBoundingBoxFromCircumference(rect: Rect, data: Float64Array): void {
    rect.set(data[0] - data[2], data[1] - data[2], data[2] * 2, data[2] * 2);
}

export function calculateNormals(vertices: Float64Array): Float64Array {
    let count = vertices.length / 2;
    let normals = new Float64Array(count * 2);

    for (let i = 0; i < count; i++) {
        let j = (i + 1) % count;
        let x1 = vertices[i * 2];
        let y1 = vertices[i * 2 + 1];
        let x2 = vertices[j * 2];
        let y2 = vertices[j * 2 + 1];

        let dx = x2 - x1;
        let dy = y2 - y1;

        let normal = vector2Normal(dx, dy);
        normals[i * 2] = normal[0];
        normals[i * 2 + 1] = normal[1];
    }

    return normals;
}
