import fs from 'fs'
import path from 'path'

// Test collision detection coordinate system directly
const baseConfig = {
  seed: 12345,
  gravity: [1, 2],
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
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [20, 0, 1, 91, 0], // ALWAYS condition - just return true
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [20, 0, 1, 91, 0], // ALWAYS condition
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [230, 1], // Start close to right wall (240 - 16 = 224 is wall boundary)
        [208, 1], // Y position (13*16 = 208, just above ground)
      ],
      group: 1,
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [
        [160, 32],
        [32, 32],
      ],
      move_speed: [
        [64, 32],
        [32, 32],
      ],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [2, 0], // Moving right
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Always do nothing - just test collision
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function loadWasm() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== COLLISION DETECTION COORDINATE SYSTEM TEST ===')
    console.log('Testing collision detection at exact boundaries')
    console.log('Tilemap: 16x15 tiles, 16 pixels per tile')
    console.log('Left wall: x=0 (column 0), Right wall: x=240 (column 15)')
    console.log('')

    // Test different character positions to verify collision detection
    const testPositions = [
      { x: 16, y: 208, desc: 'x=16 (just inside left wall)' },
      { x: 15, y: 208, desc: 'x=15 (overlapping left wall)' },
      { x: 224, y: 208, desc: 'x=224 (just inside right wall)' },
      { x: 225, y: 208, desc: 'x=225 (overlapping right wall)' },
      { x: 230, y: 208, desc: 'x=230 (overlapping right wall)' },
      { x: 240, y: 208, desc: 'x=240 (exactly at right wall)' },
      { x: 256, y: 208, desc: 'x=256 (outside game area)' },
    ]

    for (const testPos of testPositions) {
      // Create a new game for each test
      const testConfig = {
        ...baseConfig,
        characters: [
          {
            ...baseConfig.characters[0],
            position: [
              [testPos.x, 1],
              [testPos.y, 1],
            ],
          },
        ],
      }

      const testWrapper = new GameWrapper(JSON.stringify(testConfig))
      testWrapper.new_game()

      const initialState = JSON.parse(testWrapper.get_characters_json())
      const character = initialState[0]

      const posX = character.position[0][0] / character.position[0][1]
      const posY = character.position[1][0] / character.position[1][1]

      console.log(`${testPos.desc}:`)
      console.log(`  Initial position: (${posX}, ${posY})`)
      console.log(
        `  Character bounds: x=${posX} to x=${posX + character.size[0]}`
      )

      // Check if character overlaps with walls
      const rightEdge = posX + character.size[0]
      const leftEdge = posX

      let expectedCollision = false
      if (leftEdge < 16) {
        expectedCollision = true
        console.log(
          `  ⚠️  Should collide with LEFT wall (left edge ${leftEdge} < 16)`
        )
      }
      if (rightEdge > 240) {
        expectedCollision = true
        console.log(
          `  ⚠️  Should collide with RIGHT wall (right edge ${rightEdge} > 240)`
        )
      }
      if (!expectedCollision) {
        console.log(
          `  ✅ Should NOT collide (${leftEdge} >= 16 and ${rightEdge} <= 240)`
        )
      }

      // Step one frame to see what happens
      testWrapper.step_frame()
      const afterState = JSON.parse(testWrapper.get_characters_json())
      const afterCharacter = afterState[0]

      const afterPosX =
        afterCharacter.position[0][0] / afterCharacter.position[0][1]
      const afterPosY =
        afterCharacter.position[1][0] / afterCharacter.position[1][1]

      console.log(`  After 1 frame: (${afterPosX}, ${afterPosY})`)

      if (posX !== afterPosX) {
        const deltaX = afterPosX - posX
        console.log(`  📍 Position changed by ${deltaX} pixels horizontally`)

        if (Math.abs(deltaX) > 16) {
          console.log(`  ❌ LARGE POSITION JUMP DETECTED! (${deltaX} pixels)`)
        }
      }

      console.log('')

      testWrapper.free()
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
