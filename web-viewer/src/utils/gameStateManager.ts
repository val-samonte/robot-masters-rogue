import { GameWrapper } from 'wasm-wrapper'
import {
  GameStateData,
  CharacterRenderData,
  SpawnRenderData,
  FrameInfo,
} from '../atoms/gameState'
import {
  initializeWasm,
  validateGameConfig,
  createGameWrapper,
  initializeGame,
  getGameState,
  getCharacters,
  getSpawns,
  stepFrame,
  getFrameInfo,
} from './wasmLoader'

export class GameStateManager {
  private wrapper: GameWrapper | null = null
  private initialized: boolean = false

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true
    await initializeWasm()
  }

  loadConfiguration(configJson: string): { success: boolean; error?: string } {
    try {
      // Clean up existing wrapper before creating new one
      if (this.wrapper) {
        console.log(
          'Cleaning up existing WASM wrapper before loading new configuration'
        )
        this.wrapper.free()
        this.wrapper = null
      }

      // Validate configuration first
      const validation = validateGameConfig(configJson)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Create wrapper with validated config
      this.wrapper = createGameWrapper(configJson)

      // Initialize the game
      initializeGame(this.wrapper)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  getWrapper(): GameWrapper | null {
    return this.wrapper
  }

  isInitialized(): boolean {
    return this.wrapper !== null && this.wrapper.is_initialized()
  }

  isGameInitialized(): boolean {
    return this.wrapper !== null
  }

  getCurrentGameState(): GameStateData | null {
    if (!this.wrapper) {
      return null
    }

    try {
      return getGameState(this.wrapper)
    } catch (error) {
      console.error('Failed to get game state:', error)
      return null
    }
  }

  getCurrentCharacters(): CharacterRenderData[] {
    if (!this.wrapper) {
      return []
    }

    try {
      return getCharacters(this.wrapper)
    } catch (error) {
      console.error('Failed to get characters:', error)
      return []
    }
  }

  getCurrentSpawns(): SpawnRenderData[] {
    if (!this.wrapper) {
      return []
    }

    try {
      return getSpawns(this.wrapper)
    } catch (error) {
      console.error('Failed to get spawns:', error)
      return []
    }
  }

  getCurrentFrameInfo(): FrameInfo | null {
    if (!this.wrapper) {
      return null
    }

    try {
      return getFrameInfo(this.wrapper)
    } catch (error) {
      console.error('Failed to get frame info:', error)
      return null
    }
  }

  stepGameFrame(): { success: boolean; error?: string } {
    if (!this.wrapper) {
      return { success: false, error: 'Game not initialized' }
    }

    // Skip the is_game_ended check for now to avoid memory errors

    try {
      stepFrame(this.wrapper)
      return { success: true }
    } catch (error) {
      // Enhanced error logging for debugging
      console.error('=== GAME STATE MANAGER ERROR ===')
      console.error('Step frame failed in gameStateManager:', error)
      console.error('================================')

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  getCurrentFrame(): number {
    if (!this.wrapper) {
      return 0
    }

    try {
      return this.wrapper.get_frame()
    } catch (error) {
      console.error('Error getting frame:', error)
      return 0
    }
  }

  isGameEnded(): boolean {
    if (!this.wrapper) {
      return false
    }

    try {
      return this.wrapper.is_game_ended()
    } catch (error) {
      console.error('Error checking if game ended:', error)
      return false
    }
  }

  getGameStatus(): string {
    if (!this.wrapper) {
      return 'Not initialized'
    }

    try {
      return this.wrapper.get_game_status()
    } catch (error) {
      console.error('Error getting game status:', error)
      return 'Error'
    }
  }

  getLastErrorDetails(): string {
    if (!this.wrapper) {
      return 'No wrapper available'
    }

    return this.wrapper.get_last_error_details()
  }

  cleanup(): void {
    if (this.wrapper) {
      this.wrapper.free()
      this.wrapper = null
    }
    // Reset initialization flag so it can be re-initialized if needed
    this.initialized = false
  }
}

// Singleton instance for the application
export const gameStateManager = new GameStateManager()
