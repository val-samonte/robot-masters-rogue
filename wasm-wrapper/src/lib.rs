use wasm_bindgen::prelude::*;

// Use `wee_alloc` as the global allocator for optimized WASM memory usage
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Set up panic hook for better error reporting in development
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

// Basic GameWrapper struct that will hold the game state
#[wasm_bindgen]
pub struct GameWrapper {
    // This will be implemented in future tasks
}

#[wasm_bindgen]
impl GameWrapper {
    // Constructor placeholder - will be implemented in task 2
    #[wasm_bindgen(constructor)]
    pub fn new() -> GameWrapper {
        GameWrapper {}
    }
}
