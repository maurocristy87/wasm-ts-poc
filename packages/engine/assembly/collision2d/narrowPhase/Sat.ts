export class Sat {
    resolveForPolygons(
        verticesA: Float64Array,
        normalsA: Float64Array,
        verticesB: Float64Array,
        normalsB: Float64Array,
        result: Float64Array,
    ): Float64Array {
        result[2] = Infinity;

        for (let i = 0; i < normalsA.length; i += 2) {
            if (!this.overlapOnAxis(verticesA, verticesB, normalsA[i], normalsA[i + 1], result)) {
                return result;
            }
        }

        for (let i = 0; i < normalsB.length; i += 2) {
            if (!this.overlapOnAxis(verticesA, verticesB, normalsB[i], normalsB[i + 1], result)) {
                return result;
            }
        }

        return result;
    }

    private overlapOnAxis(
        verticesA: Float64Array,
        verticesB: Float64Array,
        axisX: f64,
        axisY: f64,
        result: Float64Array,
    ): bool {
        let minA: f64 = Infinity;
        let maxA: f64 = -Infinity;
        let minB: f64 = Infinity;
        let maxB: f64 = -Infinity;

        for (let i = 0; i < verticesA.length; i += 2) {
            const projection = verticesA[i] * axisX + verticesA[i + 1] * axisY;
            if (projection < minA) minA = projection;
            if (projection > maxA) maxA = projection;
        }

        for (let i = 0; i < verticesB.length; i += 2) {
            const projection = verticesB[i] * axisX + verticesB[i + 1] * axisY;
            if (projection < minB) minB = projection;
            if (projection > maxB) maxB = projection;
        }

        if (maxA < minB || maxB < minA) return false; // no collision

        const penetration = Math.min(maxA - minB, maxB - minA);
        if (penetration < result[2]) {
            result[0] = axisX;
            result[1] = axisY;
            result[2] = penetration;
        }
        return true;
    }

    resolveForCircleAndPolygon(
        circleData: Float64Array, // [x, y, radius]
        polygonVertices: Float64Array,
        polygonNormals: Float64Array,
        result: Float64Array,
    ): Float64Array {
        result[2] = Infinity;

        for (let i = 0; i < polygonNormals.length; i += 2) {
            if (
                !this.overlapOnAxisCirclePolygon(
                    circleData,
                    polygonVertices,
                    polygonNormals[i],
                    polygonNormals[i + 1],
                    result,
                )
            ) {
                return result;
            }
        }

        return result;
    }

    private overlapOnAxisCirclePolygon(
        circle: Float64Array,
        polygonVertices: Float64Array,
        axisX: f64,
        axisY: f64,
        result: Float64Array,
    ): bool {
        const circleProjection = circle[0] * axisX + circle[1] * axisY;
        const minCircle = circleProjection - circle[2];
        const maxCircle = circleProjection + circle[2];

        let minPolygon: f64 = Infinity;
        let maxPolygon: f64 = -Infinity;

        for (let i = 0; i < polygonVertices.length; i += 2) {
            const projection = polygonVertices[i] * axisX + polygonVertices[i + 1] * axisY;
            if (projection < minPolygon) minPolygon = projection;
            if (projection > maxPolygon) maxPolygon = projection;
        }

        if (maxCircle < minPolygon || maxPolygon < minCircle) return false; // no collision

        const penetration = Math.min(maxPolygon - minCircle, maxCircle - minPolygon);
        if (penetration < result[2]) {
            result[0] = axisX;
            result[1] = axisY;
            result[2] = penetration;
        }
        return true;
    }
}
