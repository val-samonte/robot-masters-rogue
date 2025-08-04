import { GameWrapper } from '../../../wasm-wrapper/pkg/wasm_wrapper.js'
import {
  GameConfig,
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

  async initialize(): Promise<void> {
    await initializeWasm()
  }

  loadConfiguration(configJson: string): { success: boolean; error?: string } {
    try {
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
    return this.wrapper !== null && this.wrapper.is_game_initialized()
  }

  getCurrentGameState(): GameStateData | null {
    if (!this.wrapper || !this.wrapper.is_game_initialized()) {
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
    if (!this.wrapper || !this.wrapper.is_game_initialized()) {
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
    if (!this.wrapper || !this.wrapper.is_game_initialized()) {
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
    if (!this.wrapper || !this.wrapper.is_game_initialized()) {
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
    if (!this.wrapper || !this.wrapper.is_game_initialized()) {
      return { success: false, error: 'Game not initialized' }
    }

    if (this.wrapper.is_game_ended()) {
      return { success: false, error: 'Game has ended' }
    }

    try {
      stepFrame(this.wrapper)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  getCurrentFrame(): number {
    if (!this.wrapper || !this.wrapper.is_game_initialized()) {
      return 0
    }

    return this.wrapper.get_frame()
  }

  isGameEnded(): boolean {
    if (!this.wrapper || !this.wrapper.is_game_initialized()) {
      return false
    }

    return this.wrapper.is_game_ended()
  }

  getGameStatus(): string {
    if (!this.wrapper || !this.wrapper.is_game_initialized()) {
      return 'Not initialized'
    }

    return this.wrapper.get_game_status()
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
  }
}

// Singleton instance for the application
export const gameStateManager = new GameStateManager()
