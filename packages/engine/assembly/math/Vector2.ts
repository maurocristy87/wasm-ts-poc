export class Vector2 {
    constructor(
        public x: f64,
        public y: f64,
    ) {}
}

export function vector2Magnitude(x: f64, y: f64): f64 {
    return f64(Mathf.sqrt(f32(x * x + y * y)));
}

export function vector2Unit(x: f64, y: f64): Float64Array {
    let magnitude = vector2Magnitude(x, y);
    if (magnitude == 0) return new Float64Array(2);
    const unit = new Float64Array(2);
    unit[0] = x / magnitude;
    unit[1] = y / magnitude;
    return unit;
}

export function vector2Normal(x: f64, y: f64): Float64Array {
    let unit = vector2Unit(-y, x); // Rotación 90° antihoraria (perpendicular)
    return unit;
}
