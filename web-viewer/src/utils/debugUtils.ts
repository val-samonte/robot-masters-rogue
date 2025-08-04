import { GameWrapper } from '../../../wasm-wrapper/pkg/wasm_wrapper.js'

// Global debugging utilities for browser console
declare global {
  interface Window {
    robotMastersDebug: {
      gameWrapper: GameWrapper | null
      dumpState: () => void
      dumpCharacters: () => void
      dumpSpawns: () => void
      stepFrame: () => void
      getHealthInfo: () => void
      enableVerboseLogging: () => void
      disableVerboseLogging: () => void
    }
  }
}

let verboseLogging = false

export const setupBrowserDebugging = (gameWrapper: GameWrapper | null) => {
  // Make debugging tools available globally in browser console
  window.robotMastersDebug = {
    gameWrapper,

    dumpState: () => {
      if (!gameWrapper || !gameWrapper.is_game_initialized()) {
        console.warn('Game not initialized')
        return
      }
      try {
        const stateJson = gameWrapper.get_state_json()
        const state = JSON.parse(stateJson)
        console.group('🎮 Game State')
        console.log('Raw JSON:', stateJson)
        console.log('Parsed State:', state)
        console.log('Frame:', state.frame)
        console.log('Status:', state.status)
        console.log('Characters:', state.characters)
        console.log('Spawns:', state.spawns)
        console.groupEnd()
      } catch (error) {
        console.error('Failed to dump state:', error)
      }
    },

    dumpCharacters: () => {
      if (!gameWrapper || !gameWrapper.is_game_initialized()) {
        console.warn('Game not initialized')
        return
      }
      try {
        const charactersJson = gameWrapper.get_characters_json()
        const characters = JSON.parse(charactersJson)
        console.group('👾 Characters')
        console.log('Raw JSON:', charactersJson)
        console.log('Parsed Characters:', characters)
        characters.forEach((char: any, index: number) => {
          console.log(`Character ${index}:`, {
            id: char.id,
            position: char.position,
            health: char.health,
            energy: char.energy,
            facing: char.facing,
            velocity: char.velocity,
          })
        })
        console.groupEnd()
      } catch (error) {
        console.error('Failed to dump characters:', error)
      }
    },

    dumpSpawns: () => {
      if (!gameWrapper || !gameWrapper.is_game_initialized()) {
        console.warn('Game not initialized')
        return
      }
      try {
        const spawnsJson = gameWrapper.get_spawns_json()
        const spawns = JSON.parse(spawnsJson)
        console.group('💥 Spawns')
        console.log('Raw JSON:', spawnsJson)
        console.log('Parsed Spawns:', spawns)
        console.groupEnd()
      } catch (error) {
        console.error('Failed to dump spawns:', error)
      }
    },

    stepFrame: () => {
      if (!gameWrapper || !gameWrapper.is_game_initialized()) {
        console.warn('Game not initialized')
        return
      }
      try {
        const beforeFrame = gameWrapper.get_frame()
        gameWrapper.step_frame()
        const afterFrame = gameWrapper.get_frame()
        console.log(`⏭️ Frame stepped: ${beforeFrame} → ${afterFrame}`)

        if (verboseLogging) {
          window.robotMastersDebug.dumpState()
        }
      } catch (error) {
        console.error('Failed to step frame:', error)
        const errorDetails = gameWrapper.get_last_error_details()
        console.error('Error details:', errorDetails)
      }
    },

    getHealthInfo: () => {
      if (!gameWrapper) {
        console.warn('Game wrapper not available')
        return
      }
      try {
        const healthInfo = gameWrapper.get_health_info()
        console.group('🏥 WASM Health Info')
        console.log('Health Info:', healthInfo)
        console.log('Is Stable:', gameWrapper.is_stable())
        console.log('Is Initialized:', gameWrapper.is_initialized())
        console.log('Is Game Initialized:', gameWrapper.is_game_initialized())
        console.log('Is Game Ended:', gameWrapper.is_game_ended())
        console.groupEnd()
      } catch (error) {
        console.error('Failed to get health info:', error)
      }
    },

    enableVerboseLogging: () => {
      verboseLogging = true
      console.log('🔊 Verbose logging enabled')
    },

    disableVerboseLogging: () => {
      verboseLogging = false
      console.log('🔇 Verbose logging disabled')
    },
  }

  // Log available debugging commands
  console.group('🛠️ Robot Masters Debug Tools Available')
  console.log('Use window.robotMastersDebug to access these functions:')
  console.log('• dumpState() - Dump complete game state')
  console.log('• dumpCharacters() - Dump character data')
  console.log('• dumpSpawns() - Dump spawn data')
  console.log('• stepFrame() - Step one frame')
  console.log('• getHealthInfo() - Get WASM health info')
  console.log('• enableVerboseLogging() - Enable verbose frame stepping')
  console.log('• disableVerboseLogging() - Disable verbose logging')
  console.groupEnd()
}

export const logWasmOperation = (
  operation: string,
  success: boolean,
  details?: string
) => {
  if (verboseLogging) {
    const emoji = success ? '✅' : '❌'
    console.log(`${emoji} WASM ${operation}${details ? `: ${details}` : ''}`)
  }
}

export const logGameStateUpdate = (
  frame: number,
  charactersCount: number,
  spawnsCount: number
) => {
  if (verboseLogging) {
    console.log(
      `🎮 State Update - Frame: ${frame}, Characters: ${charactersCount}, Spawns: ${spawnsCount}`
    )
  }
}
