import { Provider } from 'jotai'
import { useGameLoop } from './hooks/useGameLoop'
import { ConfigurationLoader } from './components/ConfigurationLoader'
import { GameCanvas } from './components/GameCanvas'
import { GameControls } from './components/GameControls'

function GameViewer() {
  // Initialize the 60fps game loop
  useGameLoop()

  return (
    <div className="p-4">
      {/* 1. CONFIG SELECTOR */}
      <ConfigurationLoader />

      {/* 2. CANVAS */}
      <GameCanvas />

      {/* 3. CONTROLS */}
      <GameControls />
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
