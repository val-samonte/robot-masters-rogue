import React from 'react'
import { Provider } from 'jotai'

function App() {
  return (
    <Provider>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Robot Masters Web Viewer
          </h1>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600">
              Web viewer is ready for development.
            </p>
          </div>
        </div>
      </div>
    </Provider>
  )
}

export default App
