import { useEffect } from 'react'
import { Provider } from 'jotai'
import { useGameState } from './hooks/useGameState'
import { ConfigurationLoader } from './components/ConfigurationLoader'
import { DebugPanel } from './components/DebugPanel'
import { GameCanvas } from './components/GameCanvas'
import { setupScriptTestRunner } from './tests/testRunner'
import { setupScriptIntegrationTests } from './tests/scriptIntegrationTest'

function GameViewer() {
  const {
    gameError,
    clearError,
    isGameInitialized,
    gameState,
    characters,
    spawns,
  } = useGameState()

  // Setup script testing tools on component mount
  useEffect(() => {
    const setupTestingTools = async () => {
      try {
        // Setup both test runners for browser console access
        await setupScriptTestRunner()
        setupScriptIntegrationTests()

        console.log('🧪 Script testing tools initialized')
      } catch (error) {
        console.error('Failed to setup script testing tools:', error)
      }
    }

    setupTestingTools()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Robot Masters Web Viewer
        </h1>

        {gameError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex justify-between items-start">
              <div>
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{gameError}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-700 hover:text-red-900 ml-4"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                WASM Integration Status
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${
                      !gameError ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></div>
                  <span className="text-sm text-gray-600">
                    WASM: {!gameError ? 'Initialized' : 'Error'}
                  </span>
                </div>
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${
                      isGameInitialized ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  ></div>
                  <span className="text-sm text-gray-600">
                    Game: {isGameInitialized ? 'Ready' : 'Not loaded'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-600">
              WASM wrapper integration is complete. Ready for configuration
              loading and game state management.
            </p>
          </div>

          {isGameInitialized && gameState && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Game State
              </h2>
              <div className="space-y-2 text-sm">
                <div>Frame: {gameState.frame}</div>
                <div>Status: {gameState.status}</div>
                <div>Characters: {characters.length}</div>
                <div>Spawns: {spawns.length}</div>
              </div>
            </div>
          )}

          {/* Game Canvas */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Game View
              </h2>
              <GameCanvas />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConfigurationLoader />
          <DebugPanel />
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Provider>
      <GameViewer />
    </Provider>
  )
}

export default App
