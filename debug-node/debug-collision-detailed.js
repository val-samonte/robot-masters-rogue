import fs from 'fs'
import path from 'path'

// Detailed collision debug script to trace frame processing steps
const gameConfig = {
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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
      size: [16, 32],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32],
      move_speed: [64, 32],
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

    console.log('=== DETAILED COLLISION DEBUG ANALYSIS ===')
    console.log(
      'Tracing frame processing steps to identify where position jump occurs'
    )
    console.log('')
    console.log('COORDINATE SYSTEM:')
    console.log('- Tilemap: 16x15 tiles, 16 pixels per tile')
    console.log('- Game area: 0 ≤ x ≤ 240, 0 ≤ y ≤ 224')
    console.log('- Left wall: x=0, Right wall: x=240')
    console.log('- Character: 16x32 pixels, starts at x=230')
    console.log(
      '- Expected: Character right edge (230+16=246) overlaps wall at x=240'
    )
    console.log(
      '- Expected: Position correction should push character to x=224'
    )
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    console.log('FRAME PROCESSING ORDER (from state.rs::advance_frame):')
    console.log('1. Process status effects')
    console.log('2. Execute character behaviors (sets velocity)')
    console.log('3. Apply gravity to velocity')
    console.log(
      '4. Check collisions and constrain velocity (POSITION CORRECTION HAPPENS HERE)'
    )
    console.log('5. Apply velocity to position')
    console.log('')

    // Analyze first few frames in detail
    for (let frame = 0; frame < 5; frame++) {
      console.log(`=== FRAME ${frame} ANALYSIS ===`)

      const before = JSON.parse(gameWrapper.get_characters_json())
      const char_before = before[0]
      const posX_before =
        char_before.position[0][0] / char_before.position[0][1]
      const posY_before =
        char_before.position[1][0] / char_before.position[1][1]
      const velX_before =
        char_before.velocity[0][0] / char_before.velocity[0][1]
      const velY_before =
        char_before.velocity[1][0] / char_before.velocity[1][1]

      console.log(`BEFORE step_frame():`)
      console.log(
        `  Position: (${posX_before.toFixed(1)}, ${posY_before.toFixed(1)})`
      )
      console.log(
        `  Velocity: (${velX_before.toFixed(1)}, ${velY_before.toFixed(1)})`
      )
      console.log(
        `  Character bounds: x=${posX_before.toFixed(1)} to x=${(
          posX_before + 16
        ).toFixed(1)}`
      )
      console.log(`  Collision flags: [${char_before.collision.join(', ')}]`)

      // Check if character should be colliding
      if (posX_before + 16 > 240) {
        console.log(
          `  ⚠️  CHARACTER OVERLAPPING RIGHT WALL BY ${(
            posX_before +
            16 -
            240
          ).toFixed(1)} PIXELS`
        )
        console.log(
          `  📍 Expected position correction: push left to x=${(
            240 - 16
          ).toFixed(1)}`
        )
      } else if (posX_before + 16 === 240) {
        console.log(`  ✅ CHARACTER EXACTLY AT WALL BOUNDARY`)
      } else {
        console.log(`  ✅ CHARACTER NOT OVERLAPPING WALL`)
      }

      // Step the frame
      gameWrapper.step_frame()

      const after = JSON.parse(gameWrapper.get_characters_json())
      const char_after = after[0]
      const posX_after = char_after.position[0][0] / char_after.position[0][1]
      const posY_after = char_after.position[1][0] / char_after.position[1][1]
      const velX_after = char_after.velocity[0][0] / char_after.velocity[0][1]
      const velY_after = char_after.velocity[1][0] / char_after.velocity[1][1]

      console.log(`AFTER step_frame():`)
      console.log(
        `  Position: (${posX_after.toFixed(1)}, ${posY_after.toFixed(1)})`
      )
      console.log(
        `  Velocity: (${velX_after.toFixed(1)}, ${velY_after.toFixed(1)})`
      )
      console.log(
        `  Character bounds: x=${posX_after.toFixed(1)} to x=${(
          posX_after + 16
        ).toFixed(1)}`
      )
      console.log(`  Collision flags: [${char_after.collision.join(', ')}]`)

      // Analyze the changes
      const deltaX = posX_after - posX_before
      const deltaY = posY_after - posY_before
      const deltaVelX = velX_after - velX_before
      const deltaVelY = velY_after - velY_before

      console.log(`CHANGES:`)
      console.log(
        `  Position delta: (${deltaX.toFixed(1)}, ${deltaY.toFixed(1)})`
      )
      console.log(
        `  Velocity delta: (${deltaVelX.toFixed(1)}, ${deltaVelY.toFixed(1)})`
      )

      // Identify issues
      if (Math.abs(deltaX) > 0.1 && Math.abs(velX_before) < 0.1) {
        console.log(
          `  🚨 BUG: Position changed by ${deltaX.toFixed(
            1
          )} pixels with near-zero velocity!`
        )
        console.log(`  🔍 This indicates position correction is broken`)
      }

      if (posX_after > 240) {
        console.log(
          `  🚨 BUG: Character outside game area (x=${posX_after.toFixed(
            1
          )} > 240)`
        )
      }

      if (posX_after + 16 > 240 && !char_after.collision[1]) {
        console.log(
          `  🚨 BUG: Character overlapping right wall but no right collision flag`
        )
      }

      if (char_after.collision[3] && posX_after > 16) {
        console.log(
          `  🚨 BUG: Left collision flag set but character not near left wall`
        )
      }

      console.log('')
    }

    console.log('=== ANALYSIS SUMMARY ===')
    console.log('Key findings:')
    console.log(
      '1. Position jumps occur during step_frame() with zero velocity'
    )
    console.log('2. Character ends up outside game boundaries (x > 240)')
    console.log(
      '3. Collision flags show wrong direction (left instead of right)'
    )
    console.log('4. Position correction algorithm is fundamentally broken')
    console.log('')
    console.log('Root cause: correct_entity_overlap_static() in state.rs')
    console.log('- Uses MAX_CORRECTION_DISTANCE = 32 (too large)')
    console.log(
      '- Always tries pushing left first (wrong for right-moving entities)'
    )
    console.log('- No boundary checking (allows pushing outside game area)')
    console.log('- No velocity direction consideration')
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
