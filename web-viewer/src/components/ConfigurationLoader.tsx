import React, { useState, useCallback } from 'react'
import { useGameState } from '../hooks/useGameState'
import {
  ACTION_SCRIPTS,
  CONDITION_SCRIPTS,
  type ActionScriptType,
  type ConditionScriptType,
} from '../constants/scriptConstants'
import {
  WASM_TEST_CONFIGURATIONS,
  createCustomWasmTestConfig,
  type WasmTestConfigurationType,
} from '../tests/wasmTestConfigurations'

interface ValidationError {
  field: string
  message: string
}

interface ScriptTemplate {
  action: ActionScriptType
  condition: ConditionScriptType
  energyCost: number
  cooldown: number
}

export const ConfigurationLoader: React.FC = () => {
  const [configText, setConfigText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  )
  const [loadError, setLoadError] = useState<string>('')
  const [showScriptBuilder, setShowScriptBuilder] = useState(false)
  const [scriptTemplates, setScriptTemplates] = useState<ScriptTemplate[]>([
    { action: 'RUN', condition: 'ALWAYS', energyCost: 0, cooldown: 0 },
  ])
  const { loadConfiguration, isGameInitialized } = useGameState()

  const validateConfiguration = useCallback(
    (configJson: string): ValidationError[] => {
      const errors: ValidationError[] = []

      try {
        const config = JSON.parse(configJson)

        // Basic structure validation - let WASM wrapper handle detailed validation
        if (typeof config.seed !== 'number') {
          errors.push({ field: 'seed', message: 'Seed must be a number' })
        }

        if (!Array.isArray(config.tilemap)) {
          errors.push({ field: 'tilemap', message: 'Tilemap must be an array' })
        }

        if (!Array.isArray(config.characters)) {
          errors.push({
            field: 'characters',
            message: 'Characters must be an array',
          })
        }

        if (!Array.isArray(config.actions)) {
          errors.push({ field: 'actions', message: 'Actions must be an array' })
        }

        if (!Array.isArray(config.conditions)) {
          errors.push({
            field: 'conditions',
            message: 'Conditions must be an array',
          })
        }

        if (!Array.isArray(config.spawns)) {
          errors.push({ field: 'spawns', message: 'Spawns must be an array' })
        }

        if (!Array.isArray(config.status_effects)) {
          errors.push({
            field: 'status_effects',
            message: 'Status effects must be an array',
          })
        }
      } catch (parseError) {
        errors.push({ field: 'json', message: 'Invalid JSON format' })
      }

      return errors
    },
    []
  )

  const handleLoadConfig = async () => {
    if (!configText.trim()) {
      setLoadError('Configuration cannot be empty')
      return
    }

    // Validate configuration
    const errors = validateConfiguration(configText)
    setValidationErrors(errors)

    if (errors.length > 0) {
      setLoadError(
        'Configuration has validation errors. Please fix them before loading.'
      )
      return
    }

    setIsLoading(true)
    setLoadError('')

    try {
      const result = loadConfiguration(configText)
      if (result.success) {
        console.log('Configuration loaded successfully')
        setLoadError('')
      } else {
        setLoadError(result.error || 'Failed to load configuration')
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setConfigText(content)
        setValidationErrors([])
        setLoadError('')
      }
      reader.readAsText(file)
    }
  }

  const loadTestConfiguration = (configName: WasmTestConfigurationType) => {
    const config = WASM_TEST_CONFIGURATIONS[configName]
    setConfigText(JSON.stringify(config, null, 2))
    setValidationErrors([])
    setLoadError('')
  }

  const generateConfigFromScripts = () => {
    // Convert script templates to WASM wrapper format
    const actions = scriptTemplates.map((template) => ({
      energy_cost: template.energyCost,
      cooldown: template.cooldown,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: Array.from(ACTION_SCRIPTS[template.action]),
    }))

    const conditions = scriptTemplates.map((template) => ({
      energy_mul: 32, // Fixed-point 1.0 as raw integer
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: Array.from(CONDITION_SCRIPTS[template.condition]),
    }))

    const behaviors = scriptTemplates.map((_, index) => [index, index])

    const config = {
      seed: Math.floor(Math.random() * 65536),
      tilemap: Array(15)
        .fill(null)
        .map(() => Array(16).fill(0)),
      characters: [
        {
          id: 1,
          group: 1,
          position: [
            [160, 32],
            [240, 32],
          ], // Fixed-point [5.0, 7.5]
          health: 100,
          health_cap: 100,
          energy: 100,
          energy_cap: 100,
          power: 10,
          weight: 5,
          jump_force: [160, 32], // Fixed-point 5.0
          move_speed: [64, 32], // Fixed-point 2.0
          armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          energy_regen: 1,
          energy_regen_rate: 60,
          energy_charge: 5,
          energy_charge_rate: 30,
          dir: [1, 0], // Facing right, normal gravity
          enmity: 0,
          target_id: null,
          target_type: 0,
          behaviors,
        },
      ],
      actions,
      conditions,
      spawns: [],
      status_effects: [],
    }

    setConfigText(JSON.stringify(config, null, 2))
    setValidationErrors([])
    setLoadError('')
    setShowScriptBuilder(false)
  }

  const addScriptTemplate = () => {
    setScriptTemplates([
      ...scriptTemplates,
      { action: 'RUN', condition: 'ALWAYS', energyCost: 10, cooldown: 0 },
    ])
  }

  const removeScriptTemplate = (index: number) => {
    setScriptTemplates(scriptTemplates.filter((_, i) => i !== index))
  }

  const updateScriptTemplate = (
    index: number,
    field: keyof ScriptTemplate,
    value: any
  ) => {
    const updated = [...scriptTemplates]
    updated[index] = { ...updated[index], [field]: value }
    setScriptTemplates(updated)
  }

  const sampleConfig = {
    seed: 12345,
    tilemap: Array(15)
      .fill(null)
      .map((_, row) =>
        Array(16)
          .fill(0)
          .map((_, col) => {
            // Add some ground tiles at the bottom
            if (row >= 12) return 1
            // Add some scattered blocks for testing
            if ((row === 8 && col === 5) || (row === 6 && col === 10)) return 1
            return 0
          })
      ),
    characters: [
      {
        id: 1,
        group: 1,
        position: [
          [160, 32],
          [240, 32],
        ], // Fixed-point [5.0, 7.5]
        health: 100,
        health_cap: 100,
        energy: 100,
        energy_cap: 100,
        power: 10,
        weight: 5,
        jump_force: [160, 32], // Fixed-point 5.0
        move_speed: [64, 32], // Fixed-point 2.0
        armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        energy_regen: 1,
        energy_regen_rate: 60,
        energy_charge: 5,
        energy_charge_rate: 30,
        dir: [1, 0], // Facing right, normal gravity
        enmity: 0,
        target_id: null,
        target_type: 0,
        behaviors: [],
      },
    ],
    actions: [],
    conditions: [],
    spawns: [],
    status_effects: [],
  }

  const loadSampleConfig = () => {
    setConfigText(JSON.stringify(sampleConfig, null, 2))
    setValidationErrors([])
    setLoadError('')
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Configuration Loader
      </h2>

      <div className="space-y-4">
        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload JSON Configuration
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Quick Load Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Load Options
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadSampleConfig}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Empty Config
            </button>
            <button
              onClick={() => setShowScriptBuilder(!showScriptBuilder)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Script Builder
            </button>
            <select
              onChange={(e) =>
                e.target.value &&
                loadTestConfiguration(
                  e.target.value as WasmTestConfigurationType
                )
              }
              className="px-3 py-1 text-sm border border-gray-300 rounded"
              defaultValue=""
            >
              <option value="">Load Test Config...</option>
              <option value="RUN_ALWAYS">Run Always</option>
              <option value="TURN_AROUND">Turn Around</option>
              <option value="JUMP_GROUNDED">Jump When Grounded</option>
              <option value="WALL_JUMP">Wall Jump</option>
              <option value="CHARGE_LOW_ENERGY">Charge Low Energy</option>
              <option value="MIXED_SCRIPTS">Mixed Scripts</option>
            </select>
          </div>
        </div>

        {/* Script Builder */}
        {showScriptBuilder && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              Script Template Builder
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Mix and match actions and conditions to create custom character
              behaviors.
            </p>

            {scriptTemplates.map((template, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded p-3 mb-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Script {index + 1}
                  </span>
                  {scriptTemplates.length > 1 && (
                    <button
                      onClick={() => removeScriptTemplate(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Action
                    </label>
                    <select
                      value={template.action}
                      onChange={(e) =>
                        updateScriptTemplate(
                          index,
                          'action',
                          e.target.value as ActionScriptType
                        )
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      {Object.keys(ACTION_SCRIPTS).map((action) => (
                        <option key={action} value={action}>
                          {action.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Condition
                    </label>
                    <select
                      value={template.condition}
                      onChange={(e) =>
                        updateScriptTemplate(
                          index,
                          'condition',
                          e.target.value as ConditionScriptType
                        )
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      {Object.keys(CONDITION_SCRIPTS).map((condition) => (
                        <option key={condition} value={condition}>
                          {condition.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Energy Cost
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={template.energyCost}
                      onChange={(e) =>
                        updateScriptTemplate(
                          index,
                          'energyCost',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cooldown (frames)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={template.cooldown}
                      onChange={(e) =>
                        updateScriptTemplate(
                          index,
                          'cooldown',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={addScriptTemplate}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Add Script
              </button>
              <button
                onClick={generateConfigFromScripts}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Generate Configuration
              </button>
            </div>
          </div>
        )}

        {/* Configuration Editor */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Configuration JSON
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  try {
                    const formatted = JSON.stringify(
                      JSON.parse(configText),
                      null,
                      2
                    )
                    setConfigText(formatted)
                  } catch (e) {
                    // Ignore formatting errors
                  }
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Format JSON
              </button>
              <button
                onClick={() => setConfigText('')}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={configText}
            onChange={(e) => {
              setConfigText(e.target.value)
              setValidationErrors([])
              setLoadError('')
            }}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Paste your JSON configuration here..."
          />
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              Validation Errors:
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>
                  <strong>{error.field}:</strong> {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Load Error */}
        {loadError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {loadError}
          </div>
        )}

        {/* Load Button */}
        <button
          onClick={handleLoadConfig}
          disabled={
            !configText.trim() || isLoading || validationErrors.length > 0
          }
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Load Configuration'}
        </button>

        {/* Success Message */}
        {isGameInitialized && !loadError && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Success!</strong> Game configuration loaded and initialized.
          </div>
        )}

        {/* Configuration Preview */}
        {configText && !validationErrors.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Configuration Preview:
            </h4>
            <div className="text-sm text-blue-700">
              {(() => {
                try {
                  const config = JSON.parse(configText)
                  return (
                    <div className="space-y-1">
                      <div>Seed: {config.seed}</div>
                      <div>
                        Tilemap:{' '}
                        {Array.isArray(config.tilemap)
                          ? `${config.tilemap.length}x${
                              config.tilemap[0]?.length || 0
                            }`
                          : 'Invalid'}
                      </div>
                      <div>Characters: {config.characters?.length || 0}</div>
                      <div>Actions: {config.actions?.length || 0}</div>
                      <div>Conditions: {config.conditions?.length || 0}</div>
                      <div>Spawns: {config.spawns?.length || 0}</div>
                      <div>
                        Status Effects: {config.status_effects?.length || 0}
                      </div>
                      {config.characters?.length > 0 && (
                        <div>
                          Behaviors:{' '}
                          {config.characters[0].behaviors?.length || 0} on first
                          character
                        </div>
                      )}
                    </div>
                  )
                } catch (e) {
                  return <div>Invalid JSON</div>
                }
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
