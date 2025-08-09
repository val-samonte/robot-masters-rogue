#!/usr/bin/env node

/**
 * Debug script to test energy regeneration going beyond energy cap
 *
 * Problem: Character energy can exceed energy_cap due to regeneration system
 * Expected: Energy should never exceed energy_cap, regeneration should stop at cap
 */

import init, { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

// Test configuration with energy regeneration
const gameConfig = {
  tilemap: {
    width: 16,
    height: 15,
    tiles: [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
  },
  characters: [
    {
      id: 0,
      pos: [32, 32],
      size: [16, 16],
      dir: [2, 0],
      health: 100,
      health_cap: 100,
      energy: 90, // Start near cap to test regeneration
      energy_cap: 100, // Cap at 100
      power: 0,
      weight: 100,
      jump_force: 5,
      move_speed: 2,
      armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
      energy_regen: 5, // High regen amount to trigger bug quickly
      energy_regen_rate: 30, // Regen every 30 frames (twice per second)
      energy_charge: 0,
      energy_charge_rate: 0,
      behaviors: [],
      locked_action: null,
    },
  ],
  spawns: [],
  actions: [],
  conditions: [],
  gravity: 1,
}

async function testEnergyRegeneration() {
  console.log('=== Energy Regeneration Bug Test ===')
  console.log('Testing energy regeneration going beyond energy_cap')
  console.log(
    'Character starts with energy=90, energy_cap=100, energy_regen=5, energy_regen_rate=30'
  )
  console.log('Expected: Energy should never exceed 100')
  console.log('Bug: Energy will exceed 100 due to missing cap check\n')

  try {
    // Initialize WASM
    await init()

    // Create game wrapper
    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    console.log('Frame | Energy | Energy Cap | Regen Rate | Expected | Status')
    console.log('------|--------|------------|------------|----------|--------')

    // Run for 200 frames to see energy regeneration
    for (let frame = 0; frame < 200; frame++) {
      const charactersJson = gameWrapper.get_characters_json()
      const characters = JSON.parse(charactersJson)
      const character = characters[0]

      const energy = character.energy
      const energyCap = character.energy_cap
      const energyRegen = character.energy_regen
      const energyRegenRate = character.energy_regen_rate

      // Check if this is a regeneration frame
      const isRegenFrame =
        energyRegenRate !== 0 && frame % energyRegenRate === 0
      const expectedEnergy = Math.min(
        energy + (isRegenFrame ? energyRegen : 0),
        energyCap
      )

      // Log important frames
      if (
        frame === 0 ||
        isRegenFrame ||
        energy > energyCap ||
        frame % 60 === 0
      ) {
        const status =
          energy > energyCap
            ? '🚨 BUG!'
            : energy === energyCap
            ? '✅ AT CAP'
            : isRegenFrame
            ? '⚡ REGEN'
            : ''

        console.log(
          `${frame.toString().padStart(5)} | ${energy
            .toString()
            .padStart(6)} | ${energyCap
            .toString()
            .padStart(10)} | ${energyRegenRate
            .toString()
            .padStart(10)} | ${expectedEnergy
            .toString()
            .padStart(8)} | ${status}`
        )
      }

      // Alert if energy exceeds cap
      if (energy > energyCap) {
        console.log(`\n🚨 BUG DETECTED at frame ${frame}:`)
        console.log(`   Energy: ${energy} > Energy Cap: ${energyCap}`)
        console.log(`   Energy exceeded cap by: ${energy - energyCap}`)
        console.log(`   This should not happen!\n`)
      }

      // Step to next frame
      gameWrapper.step_frame()
    }

    console.log('\n=== Test Results ===')
    const finalCharactersJson = gameWrapper.get_characters_json()
    const finalCharacters = JSON.parse(finalCharactersJson)
    const finalCharacter = finalCharacters[0]

    console.log(`Final energy: ${finalCharacter.energy}`)
    console.log(`Energy cap: ${finalCharacter.energy_cap}`)

    if (finalCharacter.energy > finalCharacter.energy_cap) {
      console.log('❌ TEST FAILED: Energy exceeded cap')
      console.log(
        `   Energy is ${
          finalCharacter.energy - finalCharacter.energy_cap
        } points over the cap`
      )
    } else {
      console.log('✅ TEST PASSED: Energy respects cap')
    }

    // Free WASM memory
    gameWrapper.free()
  } catch (error) {
    console.error('Error during energy regeneration test:', error)
  }
}

// Run the test
testEnergyRegeneration()
