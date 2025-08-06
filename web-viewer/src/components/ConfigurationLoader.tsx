import React, { useState, useEffect } from 'react'
import { useGameState } from '../hooks/useGameState'
import { getGameConfig } from '../config/gameConfigs'

export const ConfigurationLoader: React.FC = () => {
  const [loadError, setLoadError] = useState<string>('')
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false)
  const { loadConfiguration, isGameInitialized, isWasmInitialized } =
    useGameState()

  // Auto-load COMBINATION_1 on mount (only once, after WASM is initialized)
  useEffect(() => {
    if (!hasAutoLoaded && isWasmInitialized) {
      console.log('Auto-loading COMBINATION_1 configuration...')
      const config = getGameConfig('COMBINATION_1')
      const configJson = JSON.stringify(config, null, 2)

      // Auto-load the configuration
      const result = loadConfiguration(configJson)
      if (result.success) {
        console.log('✅ Auto-loaded COMBINATION_1 configuration successfully')
        setLoadError('')
      } else {
        console.error('❌ Failed to auto-load COMBINATION_1:', result.error)
        setLoadError(result.error || 'Failed to auto-load COMBINATION_1')
      }

      setHasAutoLoaded(true)
    }
  }, [hasAutoLoaded, isWasmInitialized, loadConfiguration]) // Wait for WASM to be initialized

  // Simplified - no complex UI needed

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Configuration:</label>
      <select
        className="px-3 py-2 border border-gray-300 rounded"
        value="COMBINATION_1"
        disabled
      >
        <option value="COMBINATION_1">COMBINATION_1</option>
      </select>
      {loadError && (
        <div className="text-red-600 text-sm mt-1">{loadError}</div>
      )}
    </div>
  )
}
