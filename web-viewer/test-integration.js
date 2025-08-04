// Simple test to verify WASM integration
import { gameStateManager } from './src/utils/gameStateManager.js'
import fs from 'fs'

async function testWasmIntegration() {
  try {
    console.log('Testing WASM integration...')

    // Initialize WASM
    await gameStateManager.initialize()
    console.log('✓ WASM initialized successfully')

    // Load test configuration
    const configJson = fs.readFileSync('./test-config.json', 'utf8')
    const result = gameStateManager.loadConfiguration(configJson)

    if (result.success) {
      console.log('✓ Configuration loaded successfully')

      // Test game state retrieval
      const gameState = gameStateManager.getCurrentGameState()
      console.log('✓ Game state retrieved:', {
        frame: gameState?.frame,
        charactersCount: gameState?.characters?.length,
        spawnsCount: gameState?.spawns?.length,
      })

      // Test frame stepping
      const stepResult = gameStateManager.stepGameFrame()
      if (stepResult.success) {
        console.log('✓ Frame step successful')
        console.log('Current frame:', gameStateManager.getCurrentFrame())
      } else {
        console.log('✗ Frame step failed:', stepResult.error)
      }
    } else {
      console.log('✗ Configuration loading failed:', result.error)
    }

    // Cleanup
    gameStateManager.cleanup()
    console.log('✓ Cleanup completed')
  } catch (error) {
    console.error('✗ Test failed:', error)
  }
}

testWasmIntegration()
