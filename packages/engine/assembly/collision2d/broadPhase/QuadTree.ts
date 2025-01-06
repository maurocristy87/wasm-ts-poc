import { Rect } from "../../math/Rect";

export class Quadtree {
    static readonly MAX_DEPTH: i32 = 8;
    static readonly MAX_RECTS: i32 = 16;

    bounds: Rect;
    depth: i32;
    rects: Map<i32, Rect>;
    children: Quadtree[] | null;

    constructor(bounds: Rect, depth: i32 = 0) {
        this.bounds = bounds;
        this.depth = depth;
        this.rects = new Map<i32, Rect>();
        this.children = null;
    }

    public insert(id: i32, rect: Rect): void {
        // Si ya hay subdivisiones, delegar a los hijos que intersecten
        if (this.children) {
            for (let i = 0; i < 4; i++) {
                if ((this.children as Quadtree[])[i].bounds.intersects(rect)) {
                    (this.children as Quadtree[])[i].insert(id, rect);
                }
            }
            return;
        }

        // Agregar el rect al nodo actual
        this.rects.set(id, rect);

        // Si excede el máximo de rects y la profundidad permite, subdividir
        if (this.rects.size > Quadtree.MAX_RECTS && this.depth < Quadtree.MAX_DEPTH) {
            this.subdivide();
            // Redistribuir rects a los hijos relevantes
            const keys = this.rects.keys();
            const values = this.rects.values();
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const value = values[i];
                for (let j = 0; j < 4; j++) {
                    if (this.children![j].bounds.intersects(value)) {
                        this.children![j].insert(key, value);
                    }
                }
            }
            this.rects.clear();
        }
    }

    public retrieve(rect: Rect): i32[] {
        const neighbors: i32[] = [];
        this.retrieveFromNode(rect, neighbors);
        return neighbors;
    }

    public clear(rect: Rect | null = null): void {
        if (rect !== null) this.bounds = rect;

        this.rects.clear();

        if (this.children) {
            for (let i = 0; i < 4; i++) {
                (this.children as Quadtree[])[i].clear();
            }
            this.children = null;
        }
    }

    private retrieveFromNode(rect: Rect, result: i32[]): void {
        // Añadir los rectángulos del nodo actual que intersectan con el rect
        const keys = this.rects.keys();
        const values = this.rects.values();
        for (let i = 0; i < keys.length; i++) {
            const id = keys[i];
            const currentRect = values[i];
            if (currentRect.intersects(rect) && result.indexOf(id) === -1) {
                result.push(id);
            }
        }

        // Si hay hijos, explorar solo los que intersecten con el rect
        if (this.children) {
            for (let i = 0; i < 4; i++) {
                if ((this.children as Quadtree[])[i].bounds.intersects(rect)) {
                    (this.children as Quadtree[])[i].retrieveFromNode(rect, result);
                }
            }
        }
    }

    private subdivide(): void {
        //const { x, y, width, height } = this.bounds;
        const x = this.bounds.x;
        const y = this.bounds.y;
        const width = this.bounds.width;
        const height = this.bounds.height;

        const halfWidth = width / 2;
        const halfHeight = height / 2;

        this.children = [
            new Quadtree(new Rect(x, y, halfWidth, halfHeight), this.depth + 1),
            new Quadtree(new Rect(x + halfWidth, y, halfWidth, halfHeight), this.depth + 1),
            new Quadtree(new Rect(x, y + halfHeight, halfWidth, halfHeight), this.depth + 1),
            new Quadtree(new Rect(x + halfWidth, y + halfHeight, halfWidth, halfHeight), this.depth + 1),
        ];
    }
}
