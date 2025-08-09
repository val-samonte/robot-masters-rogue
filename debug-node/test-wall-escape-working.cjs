const { GameWrapper } = require('../wasm-wrapper/pkg/wasm_wrapper.js')

// Script constants (copied from web-viewer)
const OperatorAddress = {
  EXIT: 0,
  EXIT_WITH_VAR: 91,
  READ_PROP: 15,
  WRITE_PROP: 16,
  ASSIGN_BYTE: 20,
  NEGATE: 34,
  MUL: 32,
  OR: 61,
}

const PropertyAddress = {
  ENTITY_DIR_HORIZONTAL: 0x40,
  CHARACTER_MOVE_SPEED: 0x1f,
  CHARACTER_VEL_X: 0x14,
  CHARACTER_COLLISION_RIGHT: 0x27,
  CHARACTER_COLLISION_LEFT: 0x29,
}

// Action scripts
const TURN_AROUND_SCRIPT = [
  // Read current direction
  OperatorAddress.READ_PROP,
  0,
  PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read current direction into fixed[0]
  // Negate direction (flip it)
  OperatorAddress.NEGATE,
  0, // Negate fixed[0] (flip direction)
  // Write new direction
  OperatorAddress.WRITE_PROP,
  PropertyAddress.ENTITY_DIR_HORIZONTAL,
  0, // Write fixed[0] back to direction
  // Read move speed
  OperatorAddress.READ_PROP,
  1,
  PropertyAddress.CHARACTER_MOVE_SPEED, // Read move speed into fixed[1]
  // Calculate velocity = new_direction * move_speed
  OperatorAddress.MUL,
  2,
  0,
  1, // fixed[2] = fixed[0] * fixed[1] (new direction * speed)
  // Write velocity to push away from wall
  OperatorAddress.WRITE_PROP,
  PropertyAddress.CHARACTER_VEL_X,
  2, // Write fixed[2] to velocity
  OperatorAddress.EXIT,
  1, // Exit with success
]

const RUN_SCRIPT = [
  // Read current horizontal direction
  OperatorAddress.READ_PROP,
  0,
  PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read direction into fixed[0]
  // Read move speed
  OperatorAddress.READ_PROP,
  1,
  PropertyAddress.CHARACTER_MOVE_SPEED, // Read move speed into fixed[1]
  // Multiply direction * move speed
  OperatorAddress.MUL,
  2,
  0,
  1, // fixed[2] = fixed[0] * fixed[1]
  // Write result to velocity
  OperatorAddress.WRITE_PROP,
  PropertyAddress.CHARACTER_VEL_X,
  2, // Write fixed[2] to velocity
  OperatorAddress.EXIT,
  1, // Exit with success
]

// Condition scripts
const IS_WALL_LEANING_SCRIPT = [
  OperatorAddress.READ_PROP,
  0,
  PropertyAddress.CHARACTER_COLLISION_RIGHT, // Read right collision
  OperatorAddress.READ_PROP,
  1,
  PropertyAddress.CHARACTER_COLLISION_LEFT, // Read left collision
  OperatorAddress.OR,
  2,
  0,
  1, // vars[2] = right_collision OR left_collision
  OperatorAddress.EXIT_WITH_VAR,
  2, // Exit with result
]

const ALWAYS_SCRIPT = [
  OperatorAddress.ASSIGN_BYTE,
  0,
  1, // Set var[0] = 1 (true)
  OperatorAddress.EXIT_WITH_VAR,
  0, // Exit with var[0] (true)
]

// Test configuration using exact format from COMBINATION_1_CONFIG
const gameConfig = {
  seed: 12345,
  gravity: [32, 64], // 0.5 gravity
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
      id: 1,
      position: [
        [128, 1],
        [192, 1],
      ], // Position (128, 192) in pixels - center of arena
      group: 1,
      size: [16, 32],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32], // 5.0 in fixed-point
      move_speed: [64, 32], // 2.0 in fixed-point
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [2, 0], // Facing right
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Wall leaning -> TURN_AROUND (higher priority)
        [1, 1], // Always -> RUN (lower priority)
      ], // Wall leaning -> TURN_AROUND, Always -> RUN
    },
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: TURN_AROUND_SCRIPT,
    },
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: RUN_SCRIPT,
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: IS_WALL_LEANING_SCRIPT,
    },
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: ALWAYS_SCRIPT,
    },
  ],
  spawns: [],
  status_effects: [],
}

console.log('=== Testing Wall Escape Fix with Working Configuration ===\n')

try {
  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  let directionChanges = 0
  let lastDirection = 2
  let wallEscapeSuccess = false

  // Run until character hits wall and test escape
  for (let frame = 0; frame < 200; frame++) {
    gameWrapper.step_frame()
    const state = JSON.parse(gameWrapper.get_characters_json())

    const char = state[0]
    const pos = char.position[0][0] / char.position[0][1] // Convert Fixed to float
    const vel = char.velocity[0][0] / char.velocity[0][1] // Convert Fixed to float
    const dir = char.dir[0]
    const collision = char.collision

    // Track direction changes
    if (dir !== lastDirection) {
      directionChanges++
      lastDirection = dir
      console.log(
        `🔄 Direction change #${directionChanges} at frame ${frame}: Now facing ${
          dir === 0 ? 'LEFT' : dir === 2 ? 'RIGHT' : 'UNKNOWN'
        }`
      )
    }

    // Focus on critical frames around wall collision
    if (frame >= 94 && frame <= 110) {
      console.log(
        `Frame ${frame}: pos=${pos.toFixed(1)}, vel=${vel.toFixed(
          1
        )}, dir=${dir}, collision=[${collision.join(', ')}]`
      )

      if (pos >= 208) {
        // Near right wall
        console.log(`  🔍 Character near wall (pos=${pos.toFixed(1)})`)
        console.log(
          `  🔍 Right edge at: ${(pos + 16).toFixed(1)} (wall at 240.0)`
        )

        if (collision[1]) {
          // Right collision
          console.log(`  🚨 RIGHT COLLISION DETECTED`)
        }
        if (collision[2]) {
          // Bottom collision
          console.log(`  🚨 BOTTOM COLLISION DETECTED`)
        }

        if (vel === 0 && pos >= 224) {
          console.log(`  ❌ VELOCITY IS ZERO - Wall escape failed!`)
        } else if (vel !== 0) {
          console.log(`  ✅ Velocity preserved: ${vel.toFixed(1)}`)
        }
      }
    }

    // Test success: character should move away from wall after turning around
    if (frame > 97 && directionChanges >= 1) {
      if (vel !== 0 && ((dir === 0 && vel < 0) || (dir === 2 && vel > 0))) {
        console.log(`\n🎉 SUCCESS! Wall escape working at frame ${frame}!`)
        console.log(`   Character moving with velocity: ${vel.toFixed(1)}`)
        console.log(`   Direction: ${dir === 0 ? 'LEFT' : 'RIGHT'}`)
        console.log(`   Position: ${pos.toFixed(1)}`)
        wallEscapeSuccess = true
        break
      }
    }

    // Stop if stuck oscillating
    if (frame > 105 && pos >= 224 && vel === 0) {
      console.log(`\n❌ FAILED: Character stuck oscillating at wall`)
      break
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Direction changes: ${directionChanges}`)

  if (directionChanges > 0) {
    console.log(`✅ Turn-around mechanism is working`)
  } else {
    console.log(`❌ Turn-around mechanism failed`)
  }

  if (wallEscapeSuccess) {
    console.log(`✅ Wall escape system is working`)
    console.log(`🎉 TASK 17 SUCCESS: Turn-around velocity bug is FIXED!`)
  } else {
    console.log(`❌ Wall escape system failed`)
    console.log(`❌ TASK 17 FAILED: Turn-around velocity bug still exists`)
  }
} catch (error) {
  console.error('Error:', error)
}
