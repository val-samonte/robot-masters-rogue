import React, { useState } from 'react'
import { useGameState } from '../hooks/useGameState'

export const ConfigurationLoader: React.FC = () => {
  const [configText, setConfigText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { loadConfiguration, gameError, isGameInitialized } = useGameState()

  const handleLoadConfig = async () => {
    if (!configText.trim()) {
      return
    }

    setIsLoading(true)
    try {
      const result = loadConfiguration(configText)
      if (result.success) {
        console.log('Configuration loaded successfully')
      }
    } catch (error) {
      console.error('Failed to load configuration:', error)
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
      }
      reader.readAsText(file)
    }
  }

  const sampleConfig = {
    tilemap: {
      width: 20,
      height: 15,
      tiles: [],
    },
    characters: [
      {
        id: 1,
        position: { x: 160, y: 240 },
        size: { width: 32, height: 32 },
        health: 100,
        energy: 100,
        facing: 1,
        scripts: [],
      },
    ],
    spawns: [],
    max_frames: 3600,
  }

  const loadSampleConfig = () => {
    setConfigText(JSON.stringify(sampleConfig, null, 2))
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Configuration Loader
      </h2>

      <div className="space-y-4">
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

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Configuration JSON
            </label>
            <button
              onClick={loadSampleConfig}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Load Sample Config
            </button>
          </div>
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Paste your JSON configuration here..."
          />
        </div>

        <button
          onClick={handleLoadConfig}
          disabled={!configText.trim() || isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Load Configuration'}
        </button>

        {isGameInitialized && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Success!</strong> Game configuration loaded and initialized.
          </div>
        )}
      </div>
    </div>
  )
}
