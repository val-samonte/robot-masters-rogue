import React, { useState, useEffect } from 'react'
import { useGameState } from '../hooks/useGameState'
import { getGameConfig } from '../config/gameConfigs'

type ConfigName =
  | 'SIMPLE_MOVEMENT'
  | 'JUMP_DEBUG'
  | 'COMBINATION_1'
  | 'ADVANCED_MOVEMENT'
  | 'INVERTED_GRAVITY'
  | 'INVERTED_GRAVITY_WITH_JUMPING'

export const ConfigurationLoader: React.FC = () => {
  const [selectedConfig, setSelectedConfig] =
    useState<ConfigName>('COMBINATION_1')
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
        <option value="SIMPLE_MOVEMENT">Simple Movement (Debug)</option>
        <option value="JUMP_DEBUG">Jump Debug (Energy Drain Test)</option>
        <option value="COMBINATION_1">Basic Movement (Turn + Run)</option>
        <option value="ADVANCED_MOVEMENT">
          Advanced Movement (All Actions)
        </option>
        <option value="INVERTED_GRAVITY">Inverted Gravity (Task 23)</option>
        <option value="INVERTED_GRAVITY_WITH_JUMPING">
          Inverted Gravity + Jumping (Task 26)
        </option>
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
