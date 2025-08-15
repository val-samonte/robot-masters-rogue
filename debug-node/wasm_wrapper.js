
let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;
let wasm;
const { TextDecoder, TextEncoder } = require(`util`);

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

module.exports.main = function() {
    wasm.main();
};

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_3.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

const GameWrapperFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gamewrapper_free(ptr >>> 0, 1));

class GameWrapper {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GameWrapperFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gamewrapper_free(ptr, 0);
    }
    /**
     * Create a new GameWrapper instance with JSON configuration
     * @param {string} config_json
     */
    constructor(config_json) {
        const ptr0 = passStringToWasm0(config_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.gamewrapper_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        GameWrapperFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Get the current configuration as JSON string
     * @returns {string}
     */
    get_config_json() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.gamewrapper_get_config_json(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Check if the game wrapper has been properly initialized
     * @returns {boolean}
     */
    is_initialized() {
        const ret = wasm.gamewrapper_is_initialized(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Validate a JSON configuration string without creating a GameWrapper instance
     * @param {string} config_json
     * @returns {string}
     */
    static validate_config(config_json) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(config_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.gamewrapper_validate_config(ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Initialize a new game from the JSON configuration
     * This creates a new game state using the game engine's new_game API
     */
    new_game() {
        const ret = wasm.gamewrapper_new_game(this.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Check if the game has been initialized and is ready for frame execution
     * @returns {boolean}
     */
    is_game_initialized() {
        const ret = wasm.gamewrapper_is_game_initialized(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Advance the game state by exactly one frame (1/60th second)
     * Maintains deterministic behavior across WASM boundary
     */
    step_frame() {
        const ret = wasm.gamewrapper_step_frame(this.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Get the current frame number for timing synchronization
     * @returns {number}
     */
    get_frame() {
        const ret = wasm.gamewrapper_get_frame(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get frame timing information as JSON string
     * Returns frame count, game status, and timing data for synchronization
     * @returns {string}
     */
    get_frame_info_json() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.gamewrapper_get_frame_info_json(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Check if the game has ended (reached maximum frames or other end condition)
     * @returns {boolean}
     */
    is_game_ended() {
        const ret = wasm.gamewrapper_is_game_ended(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get the current game status as a string
     * @returns {string}
     */
    get_game_status() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.gamewrapper_get_game_status(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get complete game state as JSON string
     * Returns all game state information including characters, spawns, status effects, and frame info
     * @returns {string}
     */
    get_state_json() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.gamewrapper_get_state_json(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Get characters data as JSON string
     * Returns detailed character information including position, health, energy, and status effects
     * @returns {string}
     */
    get_characters_json() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.gamewrapper_get_characters_json(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Get spawn instances data as JSON string
     * Returns all active spawn instances with their positions, properties, and remaining lifespan
     * @returns {string}
     */
    get_spawns_json() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.gamewrapper_get_spawns_json(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Get status effect instances data as JSON string
     * Returns all active status effects with their remaining duration and stack information
     * @returns {string}
     */
    get_status_effects_json() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.gamewrapper_get_status_effects_json(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Get detailed error information for the last operation
     * This can be called after any method that returns an error
     * @returns {string}
     */
    get_last_error_details() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.gamewrapper_get_last_error_details(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Check if the wrapper is in a stable state
     * @returns {boolean}
     */
    is_stable() {
        const ret = wasm.gamewrapper_is_stable(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Attempt to recover from errors and stabilize the wrapper
     * @returns {string}
     */
    attempt_stabilization() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.gamewrapper_attempt_stabilization(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Get system health information
     * @returns {string}
     */
    get_health_info() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.gamewrapper_get_health_info(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
}
module.exports.GameWrapper = GameWrapper;

module.exports.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

module.exports.__wbg_new_8a6f238a6ece86ea = function() {
    const ret = new Error();
    return ret;
};

module.exports.__wbg_now_807e54c39636c349 = function() {
    const ret = Date.now();
    return ret;
};

module.exports.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
    const ret = arg1.stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

module.exports.__wbindgen_init_externref_table = function() {
    const table = wasm.__wbindgen_export_3;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
};

module.exports.__wbindgen_string_new = function(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
};

module.exports.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

const path = require('path').join(__dirname, 'wasm_wrapper_bg.wasm');
const bytes = require('fs').readFileSync(path);

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
module.exports.__wasm = wasm;

wasm.__wbindgen_start();

