#!/usr/bin/env node

// Debug script to trace through collision detection step by step

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

const gameConfig = {
  seed: 12345,
  gravity: [1, 1],
  tilemap: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  characters: [
    {
      id: 0,
      group: 0,
      position: [
        [128, 1],
        [16, 1],
      ],
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [5, 1],
      move_speed: [2, 1],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 2,
      energy_charge_rate: 30,
      dir: [1, 0],
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

function stepByStepAnalysis() {
  console.log('=== Step-by-Step Collision Analysis ===\n')

  // Manual collision detection calculation
  const charX = 128
  const charY = 16
  const charWidth = 16
  const charHeight = 16
  const tileSize = 16

  console.log('Manual collision detection calculation:')
  console.log(
    `Character: x=${charX}, y=${charY}, width=${charWidth}, height=${charHeight}`
  )

  // Calculate tile bounds (following the Rust logic)
  const leftTile = Math.floor(charX / tileSize)
  const rightEdge = charX + charWidth
  const rightTile = Math.floor((rightEdge - 1) / tileSize)

  const topTile = Math.floor(charY / tileSize)
  const bottomEdge = charY + charHeight
  const bottomTile = Math.floor((bottomEdge - 1) / tileSize)

  console.log(`  Left tile: ${leftTile} (tile x=${leftTile})`)
  console.log(
    `  Right edge: ${rightEdge}, Right tile: ${rightTile} (tile x=${rightTile})`
  )
  console.log(`  Top tile: ${topTile} (tile y=${topTile})`)
  console.log(
    `  Bottom edge: ${bottomEdge}, Bottom tile: ${bottomTile} (tile y=${bottomTile})`
  )

  console.log('\nTiles to check:')
  for (let tileY = topTile; tileY <= bottomTile; tileY++) {
    for (let tileX = leftTile; tileX <= rightTile; tileX++) {
      const tileValue = gameConfig.tilemap[tileY][tileX]
      console.log(
        `  Tile (${tileX}, ${tileY}): ${tileValue} (${
          tileValue === 1 ? 'WALL' : 'EMPTY'
        })`
      )
    }
  }

  // Check if any tiles are walls
  let hasCollision = false
  for (let tileY = topTile; tileY <= bottomTile; tileY++) {
    for (let tileX = leftTile; tileX <= rightTile; tileX++) {
      if (gameConfig.tilemap[tileY][tileX] === 1) {
        hasCollision = true
        break
      }
    }
    if (hasCollision) break
  }

  console.log(
    `\nManual collision result: ${hasCollision ? 'COLLISION' : 'NO COLLISION'}`
  )

  // Now test with actual game
  console.log('\n--- Testing with actual game ---')

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  const beforeChars = JSON.parse(gameWrapper.get_characters_json())
  const beforeChar = beforeChars[0]

  console.log(
    `Game character position: [${beforeChar.position[0][0] / 32}, ${
      beforeChar.position[1][0] / 32
    }]`
  )

  gameWrapper.step_frame()

  const afterChars = JSON.parse(gameWrapper.get_characters_json())
  const afterChar = afterChars[0]

  const moved = beforeChar.position[1][0] !== afterChar.position[1][0]
  console.log(`Position correction triggered: ${moved ? 'YES' : 'NO'}`)

  if (moved) {
    console.log('  This means the game thinks there IS a collision')
    console.log(
      '  But our manual calculation says there should be NO collision'
    )
    console.log(
      '  There must be a bug in the collision detection or Fixed-point conversion'
    )
  } else {
    console.log('  Game agrees with manual calculation - no collision detected')
  }

  gameWrapper.free()
}

stepByStepAnalysis()

console.log('\n=== Analysis Complete ===')
