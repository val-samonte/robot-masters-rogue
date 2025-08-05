import { useAtomValue } from 'jotai'
import { useGameState } from '../hooks/useGameState'
import {
  isGameInitializedAtom,
  isGameEndedAtom,
  currentFrameAtom,
  frameInfoAtom,
} from '../atoms/gameState'

interface GameControlsProps {
  className?: string
}

export function GameControls({ className = '' }: GameControlsProps) {
  const { isPlaying, stepFrame, play, pause, resetGame, gameError } =
    useGameState()

  const isGameInitialized = useAtomValue(isGameInitializedAtom)
  const isGameEnded = useAtomValue(isGameEndedAtom)
  const currentFrame = useAtomValue(currentFrameAtom)
  const frameInfo = useAtomValue(frameInfoAtom)

  const handlePlay = () => {
    if (!isGameEnded) {
      play()
    }
  }

  const handlePause = () => {
    pause()
  }

  const handleStep = () => {
    if (!isPlaying && !isGameEnded) {
      stepFrame()
    }
  }

  const handleReset = () => {
    resetGame()
  }

  // Determine game status for display
  const getGameStatus = () => {
    if (!isGameInitialized) return 'Not Loaded'
    if (isGameEnded) return 'Ended'
    if (isPlaying) return 'Playing'
    return 'Paused'
  }

  const gameStatus = getGameStatus()
  const canPlay = isGameInitialized && !isGameEnded && !gameError
  const canPause = isPlaying
  const canStep = isGameInitialized && !isPlaying && !isGameEnded && !gameError
  const canReset = isGameInitialized

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Game Controls
      </h2>

      {/* Game Status Display */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-2">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                gameStatus === 'Playing'
                  ? 'bg-green-500'
                  : gameStatus === 'Paused'
                  ? 'bg-yellow-500'
                  : gameStatus === 'Ended'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`}
            ></div>
            <span className="text-sm font-medium text-gray-700">
              Status: {gameStatus}
            </span>
          </div>
        </div>

        {/* Frame Information */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Current Frame:</span> {currentFrame}
          </div>
          <div>
            <span className="font-medium">Seconds:</span>{' '}
            {Math.floor(currentFrame / 60)}
          </div>
          {frameInfo && (
            <div className="col-span-2">
              <span className="font-medium">Game Status:</span>{' '}
              {frameInfo.status}
            </div>
          )}
        </div>

        {/* Timing Display */}
        {isPlaying && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Running at:</span> 60 FPS
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handlePlay}
          disabled={!canPlay}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            canPlay
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          ▶ Play
        </button>

        <button
          onClick={handlePause}
          disabled={!canPause}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            canPause
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          ⏸ Pause
        </button>

        <button
          onClick={handleStep}
          disabled={!canStep}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            canStep
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          ⏭ Step
        </button>

        <button
          onClick={handleReset}
          disabled={!canReset}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            canReset
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          🔄 Reset
        </button>
      </div>

      {/* Additional Information */}
      {isGameEnded && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            Game has ended. Use Reset to restart from the beginning.
          </p>
        </div>
      )}

      {gameError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">Error: {gameError}</p>
        </div>
      )}
    </div>
  )
}
