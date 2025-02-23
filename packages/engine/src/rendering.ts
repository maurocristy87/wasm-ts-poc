import { Shape } from "./shape";

export const renderShapes = (canvas: HTMLCanvasElement, shapes: Shape[]) => {
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const { id, vertices, boundingBox, center, hasCollision } of shapes) {
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
