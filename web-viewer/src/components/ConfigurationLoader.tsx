import React, { useState, useEffect } from 'react'
import { useGameState } from '../hooks/useGameState'
import { ConfigName, getGameConfig } from '../config/gameConfigs'

export const ConfigurationLoader: React.FC = () => {
  const [selectedConfig, setSelectedConfig] = useState<ConfigName>('RUN_AROUND')
  const [loadError, setLoadError] = useState<string>('')
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false)
  const { loadConfiguration, isWasmInitialized } = useGameState()

  useEffect(() => {
    if (!hasAutoLoaded && isWasmInitialized) {
      const config = getGameConfig('RUN_AROUND')
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

  // Handle configuration change
  const handleConfigChange = (configName: ConfigName) => {
    setSelectedConfig(configName)
    console.log(`Loading ${configName} configuration...`)

    const config = getGameConfig(configName)
    const configJson = JSON.stringify(config, null, 2)

    const result = loadConfiguration(configJson)
    if (result.success) {
      console.log(`✅ Loaded ${configName} configuration successfully`)
      setLoadError('')
    } else {
      console.error(`❌ Failed to load ${configName}:`, result.error)
      setLoadError(result.error || `Failed to load ${configName}`)
    }
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Configuration:</label>
      <select
        className="px-3 py-2 border border-gray-300 rounded"
        value={selectedConfig}
        onChange={(e) => handleConfigChange(e.target.value as ConfigName)}
        disabled={!isWasmInitialized}
      >
        <option value="RUN_AROUND">Run Around</option>
        <option value="RUN_AND_JUMP">Run & Jump</option>
        <option value="INVERTED_RUN">Inverted Run Around</option>
        <option value="INVERTED_RUN_AND_JUMP">Inverted Run & Jump</option>
      </select>
      {loadError && (
        <div className="text-red-600 text-sm mt-1">{loadError}</div>
      )}
      {!isWasmInitialized && (
        <div className="text-gray-500 text-sm mt-1">Loading WASM...</div>
      )}
    </div>
  )
}
