export type Shape = {
    id: number;
    vertices: number[];
    center: number[];
    radius?: number;
    boundingBox: number[]; // [x, y, width, height]
    hasCollision?: boolean;
};

export function generateRandomPolygon(minVertices: number = 3, maxVertices: number = 8): Shape {
    const numVertices = Math.floor(Math.random() * (maxVertices - minVertices + 1)) + minVertices;
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
        hasCollision: false,
        radius: 0,
    };
}

export function generateRandomRect(): Shape {
    const x = 50 + Math.floor(Math.random() * 1820);
    const y = 50 + Math.floor(Math.random() * 980);
    const width = 80;
    const height = 80;

    return {
        id: 0,
        vertices: [x, y, x, y + height, x + width, y + height, x + width, y],
        center: [x + width / 2, y + height / 2],
        boundingBox: [x, y, x + width, y + height],
        hasCollision: false,
    };
}
