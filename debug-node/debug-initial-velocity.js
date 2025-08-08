#!/usr/bin/env node

// Debug script to check if character has initial velocity that triggers position correction

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

function checkInitialVelocity() {
  console.log('=== Initial Velocity Analysis ===\n')

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  const chars = JSON.parse(gameWrapper.get_characters_json())
  const char = chars[0]

  console.log('Character state at game start:')
  console.log(
    `  Position: [${char.position[0][0] / 32}, ${char.position[1][0] / 32}]`
  )
  console.log(
    `  Velocity: [${char.velocity[0][0] / 32}, ${char.velocity[1][0] / 32}]`
  )
  console.log(`  Collision flags: [${char.collision.join(', ')}]`)

  const hasVelocity = char.velocity[0][0] !== 0 || char.velocity[1][0] !== 0
  console.log(`\nHas initial velocity: ${hasVelocity ? 'YES' : 'NO'}`)

  if (hasVelocity) {
    console.log('  This could explain why position correction is triggered!')
  }

  gameWrapper.free()
}

checkInitialVelocity()

console.log('\n=== Analysis Complete ===')
