import React, { useState } from 'react'
import { useGameState } from '../hooks/useGameState'
import { gameStateManager } from '../utils/gameStateManager'
import { ScriptIntegrationTestSuite } from '../tests/scriptIntegrationTest'
import {
  TEST_CONFIGURATIONS,
  type TestConfigurationType,
} from '../tests/testConfigurations'

export const DebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [debugOutput, setDebugOutput] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'debug' | 'scripts'>('debug')
  const [testSuite] = useState(() => new ScriptIntegrationTestSuite())
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const {
    gameWrapper,
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

  const handleRunScriptTests = async () => {
    setIsRunningTests(true)
    addDebugLog('Starting script integration tests...')

    try {
      await testSuite.initialize()
      const results = await testSuite.runAllTests()
      setTestResults(results)

      const passed = results.filter((r) => r.success).length
      addDebugLog(`Script tests completed: ${passed}/${results.length} passed`)
    } catch (error) {
      addDebugLog(`Script tests failed: ${error}`)
    } finally {
      setIsRunningTests(false)
    }
  }

  const handleLoadTestConfig = (configName: TestConfigurationType) => {
    try {
      const config = TEST_CONFIGURATIONS[configName]
      const configJson = JSON.stringify(config)
      const result = gameStateManager.loadConfiguration(configJson)

      if (result.success) {
        addDebugLog(`Loaded test configuration: ${configName}`)
      } else {
        addDebugLog(`Failed to load ${configName}: ${result.error}`)
      }
    } catch (error) {
      addDebugLog(`Error loading ${configName}: ${error}`)
    }
  }

  const handleValidateScriptExecution = () => {
    if (!gameWrapper || !isGameInitialized) {
      addDebugLog('Game not initialized for script validation')
      return
    }

    try {
      // Step a few frames and observe character behavior
      const initialCharacters = gameStateManager.getCurrentCharacters()
      const initialFrame = gameStateManager.getCurrentFrame()

      // Step 30 frames (0.5 seconds)
      for (let i = 0; i < 30; i++) {
        const stepResult = gameStateManager.stepGameFrame()
        if (!stepResult.success) {
          addDebugLog(`Frame step failed at frame ${i}: ${stepResult.error}`)
          return
        }
      }

      const finalCharacters = gameStateManager.getCurrentCharacters()
      const finalFrame = gameStateManager.getCurrentFrame()

      // Analyze changes
      if (initialCharacters.length > 0 && finalCharacters.length > 0) {
        const initialChar = initialCharacters[0]
        const finalChar = finalCharacters[0]

        const positionChanged =
          initialChar.position.x !== finalChar.position.x ||
          initialChar.position.y !== finalChar.position.y

        const energyChanged = initialChar.energy !== finalChar.energy
        const facingChanged = initialChar.facing !== finalChar.facing

        addDebugLog(`Script validation (${finalFrame - initialFrame} frames):`)
        addDebugLog(`  Position changed: ${positionChanged}`)
        addDebugLog(`  Energy: ${initialChar.energy} → ${finalChar.energy}`)
        addDebugLog(`  Facing: ${initialChar.facing} → ${finalChar.facing}`)
        addDebugLog(
          `  Velocity: (${finalChar.velocity.x}, ${finalChar.velocity.y})`
        )
      }
    } catch (error) {
      addDebugLog(`Script validation failed: ${error}`)
    }
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
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Debug Panel</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-600 hover:text-gray-800"
        >
          ×
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('debug')}
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === 'debug'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'bg-gray-50 text-gray-600 hover:text-gray-800'
          }`}
        >
          Debug
        </button>
        <button
          onClick={() => setActiveTab('scripts')}
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === 'scripts'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'bg-gray-50 text-gray-600 hover:text-gray-800'
          }`}
        >
          Scripts
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-80">
        {activeTab === 'debug' && (
          <>
            {/* Status Info */}
            <div className="text-sm space-y-1">
              <div>WASM: {gameWrapper ? '✓ Loaded' : '✗ Not loaded'}</div>
              <div>
                Game:{' '}
                {isGameInitialized ? '✓ Initialized' : '✗ Not initialized'}
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

              <button
                onClick={handleValidateScriptExecution}
                disabled={!isGameInitialized}
                className="w-full bg-indigo-600 text-white py-1 px-2 rounded text-sm hover:bg-indigo-700 disabled:bg-gray-400"
              >
                Validate Scripts
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
          </>
        )}

        {activeTab === 'scripts' && (
          <>
            {/* Script Testing */}
            <div className="space-y-3">
              <div className="text-sm font-medium">
                Script Integration Tests
              </div>

              <button
                onClick={handleRunScriptTests}
                disabled={isRunningTests}
                className="w-full bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700 disabled:bg-gray-400"
              >
                {isRunningTests ? 'Running Tests...' : 'Run All Script Tests'}
              </button>

              {testResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Test Results:</div>
                  <div className="bg-gray-100 p-2 rounded text-xs max-h-32 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div key={index} className="mb-1">
                        <span
                          className={
                            result.success ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {result.success ? '✓' : '✗'}
                        </span>
                        <span className="ml-1">{result.testName}</span>
                        {!result.success && (
                          <div className="text-red-600 ml-3 text-xs">
                            {result.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Configurations */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Load Test Config:</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Object.keys(TEST_CONFIGURATIONS).map((configName) => (
                    <button
                      key={configName}
                      onClick={() =>
                        handleLoadTestConfig(
                          configName as TestConfigurationType
                        )
                      }
                      className="bg-gray-200 text-gray-700 py-1 px-2 rounded hover:bg-gray-300 truncate"
                      title={configName}
                    >
                      {configName.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
