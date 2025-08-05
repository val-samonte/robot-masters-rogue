import { useEffect, useRef, useCallback } from 'react'
import { useAtomValue } from 'jotai'
import { isPlayingAtom } from '../atoms/gameState'
import { useGameState } from './useGameState'
import { gameStateManager } from '../utils/gameStateManager'

export const useGameLoop = () => {
  const isPlaying = useAtomValue(isPlayingAtom)
  const { stepFrame, pause } = useGameState()

  const animationFrameRef = useRef<number>()
  const frameCountRef = useRef<number>(0)
  const fpsCounterRef = useRef<number>(0)
  const lastFpsUpdateRef = useRef<number>(0)

  // Game loop function
  const gameLoop = useCallback(
    (currentTime: number) => {
      // Check if game should continue running
      if (gameStateManager.isGameEnded()) {
        // Automatically pause when game ends
        pause()
        return
      }

      // Step the game forward one frame (run at browser's refresh rate, typically 60fps)
      const result = stepFrame()

      if (!result.success) {
        // If step fails, pause the game
        pause()
        return
      }

      // Update timing tracking
      frameCountRef.current++

      // Update FPS counter every second
      if (currentTime - lastFpsUpdateRef.current >= 1000) {
        fpsCounterRef.current = frameCountRef.current
        frameCountRef.current = 0
        lastFpsUpdateRef.current = currentTime
      }

      // Continue the loop if still playing
      if (isPlaying && !gameStateManager.isGameEnded()) {
        animationFrameRef.current = requestAnimationFrame(gameLoop)
      }
    },
    [isPlaying, stepFrame, pause]
  )

  // Start/stop the game loop based on playing state
  useEffect(() => {
    const gameEnded = gameStateManager.isGameEnded()
    if (isPlaying && !gameEnded) {
      // Reset timing when starting
      frameCountRef.current = 0
      lastFpsUpdateRef.current = performance.now()

      // Start the game loop
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    } else {
      // Stop the game loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, gameLoop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    currentFps: fpsCounterRef.current,
    isRunning: isPlaying && !gameStateManager.isGameEnded(),
  }
}
