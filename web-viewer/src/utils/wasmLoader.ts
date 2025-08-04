import init, { GameWrapper } from '../../../wasm-wrapper/pkg/wasm_wrapper.js'

// WASM wrapper integration utilities

let wasmInitialized = false

export const initializeWasm = async (): Promise<void> => {
  if (wasmInitialized) {
    return
  }

  try {
    await init()
    wasmInitialized = true
    console.log('WASM wrapper initialized successfully')
  } catch (error) {
    console.error('Failed to initialize WASM wrapper:', error)
    throw new Error(`WASM initialization failed: ${error}`)
  }
}

export const validateGameConfig = (
  configJson: string
): { isValid: boolean; error?: string } => {
  if (!wasmInitialized) {
    throw new Error('WASM not initialized. Call initializeWasm() first.')
  }

  try {
    const validationResult = GameWrapper.validate_config(configJson)
    if (validationResult === 'valid') {
      return { isValid: true }
    } else {
      return { isValid: false, error: validationResult }
    }
  } catch (error) {
    return { isValid: false, error: `Validation error: ${error}` }
  }
}

export const createGameWrapper = (configJson: string): GameWrapper => {
  if (!wasmInitialized) {
    throw new Error('WASM not initialized. Call initializeWasm() first.')
  }

  try {
    const wrapper = new GameWrapper(configJson)
    if (!wrapper.is_initialized()) {
      const errorDetails = wrapper.get_last_error_details()
      throw new Error(`GameWrapper initialization failed: ${errorDetails}`)
    }
    return wrapper
  } catch (error) {
    throw new Error(`Failed to create GameWrapper: ${error}`)
  }
}

export const initializeGame = (wrapper: GameWrapper): void => {
  try {
    wrapper.new_game()
    if (!wrapper.is_game_initialized()) {
      const errorDetails = wrapper.get_last_error_details()
      throw new Error(`Game initialization failed: ${errorDetails}`)
    }
  } catch (error) {
    throw new Error(`Failed to initialize game: ${error}`)
  }
}

export const getGameState = (wrapper: GameWrapper) => {
  try {
    const stateJson = wrapper.get_state_json()
    return JSON.parse(stateJson)
  } catch (error) {
    const errorDetails = wrapper.get_last_error_details()
    throw new Error(`Failed to get game state: ${errorDetails || error}`)
  }
}

export const getCharacters = (wrapper: GameWrapper) => {
  try {
    const charactersJson = wrapper.get_characters_json()
    return JSON.parse(charactersJson)
  } catch (error) {
    const errorDetails = wrapper.get_last_error_details()
    throw new Error(`Failed to get characters: ${errorDetails || error}`)
  }
}

export const getSpawns = (wrapper: GameWrapper) => {
  try {
    const spawnsJson = wrapper.get_spawns_json()
    return JSON.parse(spawnsJson)
  } catch (error) {
    const errorDetails = wrapper.get_last_error_details()
    throw new Error(`Failed to get spawns: ${errorDetails || error}`)
  }
}

export const stepFrame = (wrapper: GameWrapper): void => {
  try {
    wrapper.step_frame()
  } catch (error) {
    const errorDetails = wrapper.get_last_error_details()
    throw new Error(`Failed to step frame: ${errorDetails || error}`)
  }
}

export const getFrameInfo = (wrapper: GameWrapper) => {
  try {
    const frameInfoJson = wrapper.get_frame_info_json()
    return JSON.parse(frameInfoJson)
  } catch (error) {
    const errorDetails = wrapper.get_last_error_details()
    throw new Error(`Failed to get frame info: ${errorDetails || error}`)
  }
}
