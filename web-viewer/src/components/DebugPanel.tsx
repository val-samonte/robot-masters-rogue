import React, { useState } from 'react'
import { useGameState } from '../hooks/useGameState'
import { gameStateManager } from '../utils/gameStateManager'

export const DebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [debugOutput, setDebugOutput] = useState<string[]>([])
  const {
    gameWrapper,
    gameState,
    characters,
    spawns,
    currentFrame,
    isGameInitialized,
    stepFrame,
  } = useGameState()

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugOutput((prev) => [...prev.slice(-50), `[${timestamp}] ${message}`])
  }

  const handleStepFrame = () => {
    const result = stepFrame()
    if (result.success) {
      addDebugLog(
        `Frame stepped successfully. Current frame: ${gameStateManager.getCurrentFrame()}`
      )
    } else {
      addDebugLog(`Frame step failed: ${result.error}`)
    }
  }

  const handleDumpGameState = () => {
    if (gameWrapper && isGameInitialized) {
      try {
        const stateJson = gameWrapper.get_state_json()
        console.log('Full Game State:', JSON.parse(stateJson))
        addDebugLog('Game state dumped to console')
      } catch (error) {
        addDebugLog(`Failed to dump game state: ${error}`)
      }
    }
  }

  const handleDumpCharacters = () => {
    if (gameWrapper && isGameInitialized) {
      try {
        const charactersJson = gameWrapper.get_characters_json()
        console.log('Characters Data:', JSON.parse(charactersJson))
        addDebugLog('Characters data dumped to console')
      } catch (error) {
        addDebugLog(`Failed to dump characters: ${error}`)
      }
    }
  }

  const handleGetHealthInfo = () => {
    if (gameWrapper) {
      try {
        const healthInfo = gameWrapper.get_health_info()
        console.log('WASM Health Info:', healthInfo)
        addDebugLog('Health info dumped to console')
      } catch (error) {
        addDebugLog(`Failed to get health info: ${error}`)
      }
    }
  }

  const handleClearLogs = () => {
    setDebugOutput([])
  }

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700"
        >
          Debug Panel
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-xl">
      <div className="bg-gray-100 px-4 py-2 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Debug Panel</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-600 hover:text-gray-800"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Info */}
        <div className="text-sm space-y-1">
          <div>WASM: {gameWrapper ? '✓ Loaded' : '✗ Not loaded'}</div>
          <div>
            Game: {isGameInitialized ? '✓ Initialized' : '✗ Not initialized'}
          </div>
          <div>Frame: {currentFrame}</div>
          <div>Characters: {characters.length}</div>
          <div>Spawns: {spawns.length}</div>
        </div>

        {/* Debug Actions */}
        <div className="space-y-2">
          <button
            onClick={handleStepFrame}
            disabled={!isGameInitialized}
            className="w-full bg-green-600 text-white py-1 px-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
          >
            Step Frame
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDumpGameState}
              disabled={!isGameInitialized}
              className="bg-blue-600 text-white py-1 px-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
            >
              Dump State
            </button>

            <button
              onClick={handleDumpCharacters}
              disabled={!isGameInitialized}
              className="bg-purple-600 text-white py-1 px-2 rounded text-sm hover:bg-purple-700 disabled:bg-gray-400"
            >
              Dump Chars
            </button>
          </div>

          <button
            onClick={handleGetHealthInfo}
            disabled={!gameWrapper}
            className="w-full bg-orange-600 text-white py-1 px-2 rounded text-sm hover:bg-orange-700 disabled:bg-gray-400"
          >
            Health Info
          </button>
        </div>

        {/* Debug Log */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Debug Log</span>
            <button
              onClick={handleClearLogs}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          </div>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono h-32 overflow-y-auto">
            {debugOutput.length === 0 ? (
              <div className="text-gray-500">No debug output yet...</div>
            ) : (
              debugOutput.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
