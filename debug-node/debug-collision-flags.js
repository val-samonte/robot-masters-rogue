#!/usr/bin/env node

// Debug script to test collision flag accuracy and multiple flag issues
// This script tests collision flags at exact tile boundaries and identifies multiple flag problems

import init, { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'
import fs from 'fs'
import path from 'path'

async function initWasm() {
  const wasmPath = path.resolve(
    import.meta.dirname,
    '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
  )
  const wasmBuffer = fs.readFileSync(wasmPath)
  await init(wasmBuffer)
}

// Test configuration with character at different boundary positions
const testConfig = {
  seed: 12345,
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
  gravity: [1, 1],
  characters: [
    {
      id: 0,
      group: 0,
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 2,
      energy_charge_rate: 30,
      power: 10,
      weight: 5,
      jump_force: [8, 1],
      move_speed: [2, 1],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      position: [
        [16, 1],
        [100, 1],
      ], // Start at left wall boundary
      size: [16, 16],
      dir: [0, 0], // facing left, downward gravity
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

function testCollisionFlagsAtPosition(x, y, description) {
  console.log(`\n=== Testing ${description} ===`)
  console.log(`Position: x=${x}, y=${y}`)

  // Create test config with character at specific position
  const config = JSON.parse(JSON.stringify(testConfig))
  config.characters[0].position = [
    [x, 1],
    [y, 1],
  ]

  const gameWrapper = new GameWrapper(JSON.stringify(config))
  gameWrapper.new_game()

  // Run one frame to update collision flags
  gameWrapper.step_frame()

  // Get state after frame processing
  const characters = JSON.parse(gameWrapper.get_characters_json())
  const character = characters[0]

  console.log(
    `Character bounds: left=${character.position[0]}, right=${
      character.position[0] + character.size[0]
    }, top=${character.position[1]}, bottom=${
      character.position[1] + character.size[1]
    }`
  )
  console.log(
    `Collision flags: [top=${character.collision[0]}, right=${character.collision[1]}, bottom=${character.collision[2]}, left=${character.collision[3]}]`
  )

  // Count how many flags are set
  const flagCount = character.collision.filter((flag) => flag).length
  console.log(`Number of collision flags set: ${flagCount}`)

  if (flagCount > 1) {
    console.log(`⚠️  MULTIPLE FLAGS SET - This is the issue we need to fix!`)
  } else if (flagCount === 1) {
    console.log(`✅ Single collision flag set correctly`)
  } else {
    console.log(`ℹ️  No collision flags set`)
  }

  gameWrapper.free()
  return { flagCount, collision: character.collision }
}

async function main() {
  await initWasm()
  console.log('🔍 Testing Collision Flag Accuracy and Multiple Flag Issues')
  console.log('Game boundaries: left=16, right=240, top=16, bottom=224')
  console.log('Character size: 16x16 pixels')

  const testCases = [
    // Left wall boundary tests
    { x: 16, y: 100, desc: 'Left wall boundary (x=16)' },
    { x: 15, y: 100, desc: 'Just inside left wall (x=15)' },
    { x: 17, y: 100, desc: 'Just outside left wall (x=17)' },

    // Right wall boundary tests
    { x: 224, y: 100, desc: 'Right wall boundary (x=224, right edge at 240)' },
    { x: 225, y: 100, desc: 'Overlapping right wall (x=225)' },
    { x: 223, y: 100, desc: 'Just inside right wall (x=223)' },

    // Top wall boundary tests
    { x: 100, y: 16, desc: 'Top wall boundary (y=16)' },
    { x: 100, y: 15, desc: 'Just inside top wall (y=15)' },
    { x: 100, y: 17, desc: 'Just outside top wall (y=17)' },

    // Bottom wall boundary tests
    {
      x: 100,
      y: 208,
      desc: 'Bottom wall boundary (y=208, bottom edge at 224)',
    },
    { x: 100, y: 209, desc: 'Overlapping bottom wall (y=209)' },
    { x: 100, y: 207, desc: 'Just inside bottom wall (y=207)' },

    // Corner tests (these are likely to show multiple flags)
    { x: 16, y: 16, desc: 'Top-left corner' },
    { x: 224, y: 16, desc: 'Top-right corner' },
    { x: 16, y: 208, desc: 'Bottom-left corner' },
    { x: 224, y: 208, desc: 'Bottom-right corner' },

    // Middle of room (should have no flags)
    { x: 120, y: 120, desc: 'Middle of room' },
  ]

  let multipleFlags = 0
  let totalTests = testCases.length

  for (const testCase of testCases) {
    const result = testCollisionFlagsAtPosition(
      testCase.x,
      testCase.y,
      testCase.desc
    )
    if (result.flagCount > 1) {
      multipleFlags++
    }
  }

  console.log(`\n📊 SUMMARY:`)
  console.log(`Total tests: ${totalTests}`)
  console.log(`Tests with multiple flags: ${multipleFlags}`)
  console.log(`Tests with single/no flags: ${totalTests - multipleFlags}`)

  if (multipleFlags > 0) {
    console.log(
      `\n❌ ISSUE CONFIRMED: ${multipleFlags} test cases show multiple collision flags set simultaneously`
    )
    console.log(`This confirms the bug described in task 15.`)
  } else {
    console.log(`\n✅ No multiple flag issues detected`)
  }
}

await main()
