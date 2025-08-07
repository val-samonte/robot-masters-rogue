import { useAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import {
  gameWrapperAtom,
  gameConfigAtom,
  gameStateAtom,
  charactersAtom,
  spawnsAtom,
  isPlayingAtom,
  currentFrameAtom,
  frameInfoAtom,
  gameErrorAtom,
  isGameInitializedAtom,
  isGameEndedAtom,
  GameConfig,
} from '../atoms/gameState'
import { gameStateManager } from '../utils/gameStateManager'
import { setupBrowserDebugging, logGameStateUpdate } from '../utils/debugUtils'

export const useGameState = () => {
  const [gameWrapper, setGameWrapper] = useAtom(gameWrapperAtom)
  const [gameConfig, setGameConfig] = useAtom(gameConfigAtom)
  const [gameState, setGameState] = useAtom(gameStateAtom)
  const [characters, setCharacters] = useAtom(charactersAtom)
  const [spawns, setSpawns] = useAtom(spawnsAtom)
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom)
  const [currentFrame, setCurrentFrame] = useAtom(currentFrameAtom)
  const [frameInfo, setFrameInfo] = useAtom(frameInfoAtom)
  const [gameError, setGameError] = useAtom(gameErrorAtom)
  const [isGameInitialized] = useAtom(isGameInitializedAtom)
  const [isGameEnded] = useAtom(isGameEndedAtom)
  const [isWasmInitialized, setIsWasmInitialized] = useState(false)

  // Initialize WASM on mount (only once)
  useEffect(() => {
    let mounted = true

    const initWasm = async () => {
      try {
        await gameStateManager.initialize()
        if (mounted) {
          console.log('WASM initialized successfully')
          setIsWasmInitialized(true)
        }
      } catch (error) {
        if (mounted) {
          setGameError(error instanceof Error ? error.message : String(error))
          setIsWasmInitialized(false)
        }
      }
    }

    initWasm()

    // Cleanup on unmount
    return () => {
      mounted = false
      console.log('Cleaning up WASM on component unmount')
      gameStateManager.cleanup()
    }
  }, []) // Empty dependency array to run only once

  // Update game state atoms when wrapper changes
  const updateGameState = useCallback(() => {
    if (!gameStateManager.getWrapper()) {
      return
    }

    try {
      const state = gameStateManager.getCurrentGameState()
      const chars = gameStateManager.getCurrentCharacters()
      const spawnsData = gameStateManager.getCurrentSpawns()
      const frame = gameStateManager.getCurrentFrameInfo()

      setGameState(state)
      setCharacters(chars)
      setSpawns(spawnsData)
      setFrameInfo(frame)
      setCurrentFrame(gameStateManager.getCurrentFrame())
      setGameError(null)

      // Log state update for debugging
      logGameStateUpdate(
        gameStateManager.getCurrentFrame(),
        chars.length,
        spawnsData.length
      )
    } catch (error) {
      setGameError(error instanceof Error ? error.message : String(error))
    }
  }, [
    setGameState,
    setCharacters,
    setSpawns,
    setFrameInfo,
    setCurrentFrame,
    setGameError,
  ])

  // Load configuration
  const loadConfiguration = useCallback(
    (configJson: string) => {
      try {
        const config: GameConfig = JSON.parse(configJson)
        const result = gameStateManager.loadConfiguration(configJson)

        if (result.success) {
          const wrapper = gameStateManager.getWrapper()
          setGameWrapper(wrapper)
          setGameConfig(config)
          setGameError(null)
          updateGameState()

          // Setup browser debugging tools
          setupBrowserDebugging(wrapper)

          return { success: true }
        } else {
          setGameError(result.error || 'Unknown configuration error')
          return { success: false, error: result.error }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        setGameError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [setGameWrapper, setGameConfig, setGameError, updateGameState]
  )

  // Step one frame
  const stepFrame = useCallback(() => {
    const result = gameStateManager.stepGameFrame()
    if (result.success) {
      updateGameState()
      return { success: true }
    } else {
      setGameError(result.error || 'Unknown step frame error')
      return { success: false, error: result.error }
    }
  }, [updateGameState, setGameError])

  // Play/pause controls
  const play = useCallback(() => {
    // Simple check - just start playing if we have a wrapper
    if (gameStateManager.getWrapper()) {
      setIsPlaying(true)
    }
  }, [setIsPlaying])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [setIsPlaying])

  // Reset game
  const resetGame = useCallback(() => {
    if (gameConfig) {
      setIsPlaying(false)
      const result = gameStateManager.loadConfiguration(
        JSON.stringify(gameConfig)
      )
      if (result.success) {
        updateGameState()
        setGameError(null)
      } else {
        setGameError(result.error || 'Failed to reset game')
      }
    }
  }, [gameConfig, setIsPlaying, updateGameState, setGameError])

  // Clear error
  const clearError = useCallback(() => {
    setGameError(null)
  }, [setGameError])

  return {
    // State
    gameWrapper,
    gameConfig,
    gameState,
    characters,
    spawns,
    isPlaying,
    currentFrame,
    frameInfo,
    gameError,
    isGameInitialized,
    isGameEnded,
    isWasmInitialized,

    // Actions
    loadConfiguration,
    stepFrame,
    play,
    pause,
    resetGame,
    clearError,
    updateGameState,
  }
}
