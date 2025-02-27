import { Rect } from "../../math/Rect";

export interface BroadPhase {
    clear(rect: Rect | null): void;
    insert(id: i32, rect: Rect): void;
    retrieve(rect: Rect): i32[];
}
