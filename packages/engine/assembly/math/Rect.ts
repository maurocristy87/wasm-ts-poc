export class Rect {
    constructor(
        public x: f64,
        public y: f64,
        public width: f64,
        public height: f64,
    ) {}

    set(x: f64, y: f64, width: f64, height: f64): void {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    intersects(other: Rect): boolean {
        return !(
            this.x + this.width < other.x ||
            this.x > other.x + other.width ||
            this.y + this.height < other.y ||
            this.y > other.y + other.height
        );
    }

    contains(other: Rect): boolean {
        return (
            this.x <= other.x &&
            this.y <= other.y &&
            this.x + this.width >= other.x + other.width &&
            this.y + this.height >= other.y + other.height
        );
    }

    copy(rect: Rect): void {
        this.x = rect.x;
        this.y = rect.y;
        this.width = rect.width;
        this.height = rect.height;
    }
}
