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
    if (validationResult === 'Configuration is valid') {
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
    const rawState = JSON.parse(stateJson)

    // Transform the state to match our TypeScript interface
    return {
      frame: rawState.frame,
      status: rawState.status,
      characters: rawState.characters || [],
      spawns: rawState.spawns || [],
      status_effects: rawState.status_effects || [],
      tilemap: rawState.tilemap || [],
    }
  } catch (error) {
    const errorDetails = wrapper.get_last_error_details()
    throw new Error(`Failed to get game state: ${errorDetails || error}`)
  }
}

export const getCharacters = (wrapper: GameWrapper) => {
  try {
    const charactersJson = wrapper.get_characters_json()
    const rawCharacters = JSON.parse(charactersJson)

    // Transform raw WASM data to match TypeScript interface
    return rawCharacters.map((char: any) => ({
      id: char.id,
      position: {
        x: char.position[0][0] / char.position[0][1], // Convert fixed-point to decimal
        y: char.position[1][0] / char.position[1][1],
      },
      size: {
        width: char.size[0],
        height: char.size[1],
      },
      health: char.health,
      energy: char.energy,
      facing: char.dir[0], // Use horizontal direction as facing
      velocity: {
        x: char.velocity[0][0] / char.velocity[0][1], // Convert fixed-point to decimal
        y: char.velocity[1][0] / char.velocity[1][1],
      },
      collision: {
        top: char.collision[0],
        right: char.collision[1],
        bottom: char.collision[2],
        left: char.collision[3],
      },
    }))
  } catch (error) {
    const errorDetails = wrapper.get_last_error_details()
    throw new Error(`Failed to get characters: ${errorDetails || error}`)
  }
}

export const getSpawns = (wrapper: GameWrapper) => {
  try {
    const spawnsJson = wrapper.get_spawns_json()
    const rawSpawns = JSON.parse(spawnsJson)

    // Transform raw WASM data to match TypeScript interface
    return rawSpawns.map((spawn: any) => ({
      id: spawn.id,
      position: {
        x: spawn.position[0][0] / spawn.position[0][1], // Convert fixed-point to decimal
        y: spawn.position[1][0] / spawn.position[1][1],
      },
      size: {
        width: spawn.size[0],
        height: spawn.size[1],
      },
      lifespan_remaining: spawn.life_span,
      properties: {
        spawn_id: spawn.spawn_id,
        owner_id: spawn.owner_id,
        owner_type: spawn.owner_type,
        health: spawn.health,
        health_cap: spawn.health_cap,
        element: spawn.element,
      },
    }))
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

    // Enhanced error logging for debugging
    console.error('=== STEP FRAME ERROR ===')
    console.error('Original error:', error)
    console.error('WASM error details:', errorDetails)
    console.error('Game frame:', wrapper.get_frame())
    console.error('Game status:', wrapper.get_game_status())
    console.error('Is game initialized:', wrapper.is_game_initialized())
    console.error('Is game ended:', wrapper.is_game_ended())

    // Try to get current game state for debugging
    try {
      const stateJson = wrapper.get_state_json()
      const state = JSON.parse(stateJson)
      console.error('Current game state:', state)
    } catch (stateError) {
      console.error('Could not get game state:', stateError)
    }

    console.error('========================')

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
