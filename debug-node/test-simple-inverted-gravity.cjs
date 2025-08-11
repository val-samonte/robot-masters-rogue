const { GameWrapper } = require('../wasm-wrapper/pkg/wasm_wrapper.js')

// Helper function to convert fixed-point to decimal
function fixedToDecimal(fixedPoint) {
  return fixedPoint[0] / fixedPoint[1]
}

// SIMPLE INVERTED_GRAVITY_CONFIG - Task 23 focus
const SIMPLE_INVERTED_GRAVITY_CONFIG = {
  seed: 12345,
  gravity: [32, 64],
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
    // Action 0: TURN_AROUND
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        15,
        0,
        0x40, // READ_PROP fixed[0] = ENTITY_DIR_HORIZONTAL
        85,
        0, // NEGATE fixed[0]
        16,
        0x40,
        0, // WRITE_PROP ENTITY_DIR_HORIZONTAL = fixed[0]
        15,
        1,
        0x1f, // READ_PROP fixed[1] = CHARACTER_MOVE_SPEED
        82,
        2,
        0,
        1, // MUL fixed[2] = fixed[0] * fixed[1]
        16,
        0x14,
        2, // WRITE_PROP CHARACTER_VEL_X = fixed[2] (FIXED: 0x14 not 0x1e)
        90,
        1, // EXIT 1
      ],
    },
    // Action 1: RUN
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        15,
        0,
        0x40, // READ_PROP fixed[0] = ENTITY_DIR_HORIZONTAL
        15,
        1,
        0x1f, // READ_PROP fixed[1] = CHARACTER_MOVE_SPEED
        82,
        2,
        0,
        1, // MUL fixed[2] = fixed[0] * fixed[1]
        16,
        0x14,
        2, // WRITE_PROP CHARACTER_VEL_X = fixed[2] (FIXED: 0x14 not 0x1e)
        90,
        1, // EXIT 1
      ],
    },
    // Action 2: INVERT_GRAVITY
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        20,
        0,
        2, // ASSIGN_BYTE vars[0] = 2
        16,
        0x41,
        0, // WRITE_PROP ENTITY_DIR_VERTICAL = vars[0]
        90,
        1, // EXIT 1
      ],
    },
  ],
  conditions: [
    // Condition 0: Wall leaning
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        15,
        0,
        0x27, // READ_PROP vars[0] = CHARACTER_COLLISION_RIGHT
        15,
        1,
        0x29, // READ_PROP vars[1] = CHARACTER_COLLISION_LEFT
        78,
        2,
        0,
        1, // OR vars[2] = vars[0] | vars[1]
        91,
        2, // EXIT_WITH_VAR vars[2]
      ],
    },
    // Condition 1: Always
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        20,
        0,
        1, // ASSIGN_BYTE vars[0] = 1
        91,
        0, // EXIT_WITH_VAR vars[0]
      ],
    },
    // Condition 2: ONLY_ONCE
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        20,
        1,
        1, // ASSIGN_BYTE vars[1] = 1
        50,
        2,
        0,
        1, // EQUAL vars[2] = (vars[0] == 1) - true if already used
        60,
        3,
        2, // NOT vars[3] = !vars[2] - true if NOT used yet
        20,
        0,
        1, // ASSIGN_BYTE vars[0] = 1 (mark as used)
        91,
        3, // EXIT_WITH_VAR vars[3] (1 first time, 0 after = false)
      ],
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [32, 1],
        [192, 1],
      ], // Position (2, 12) in pixels - above ground
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
      dir: [2, 0], // Facing right (0=left, 1=neutral, 2=right)
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [2, 2], // ONLY_ONCE -> INVERT_GRAVITY (highest priority, once at start)
        [0, 0], // Wall leaning -> TURN_AROUND (when hitting walls)
        [1, 1], // Always -> RUN (constant horizontal movement)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

console.log('🚀 Testing SIMPLE INVERTED_GRAVITY_CONFIG - Task 23 Focus')
console.log(
  'Expected: 1) Invert gravity once, 2) Run horizontally, 3) Turn around at walls'
)

const gameWrapper = new GameWrapper(
  JSON.stringify(SIMPLE_INVERTED_GRAVITY_CONFIG)
)
gameWrapper.new_game()

console.log('\n📊 Initial state:')
const initialState = JSON.parse(gameWrapper.get_characters_json())
const char0 = initialState[0]
console.log('Character 0:')
console.log(
  `  Position: [${fixedToDecimal(char0.position[0]).toFixed(
    1
  )}, ${fixedToDecimal(char0.position[1]).toFixed(1)}]`
)
console.log(
  `  Velocity: [${fixedToDecimal(char0.velocity[0]).toFixed(
    1
  )}, ${fixedToDecimal(char0.velocity[1]).toFixed(1)}]`
)
console.log(`  Direction: [${char0.dir[0]}, ${char0.dir[1]}]`)
console.log(`  Collision: [${char0.collision.join(',')}]`)

let gravityInverted = false
let directionChanges = 0
let runningDetected = false
let lastMovement = -1

for (let frame = 0; frame < 500; frame++) {
  const before = JSON.parse(gameWrapper.get_characters_json())
  gameWrapper.step_frame()
  const after = JSON.parse(gameWrapper.get_characters_json())

  const char = after[0]

  // Track gravity inversion (dir[1] change from 0 to 2)
  if (!gravityInverted && before[0].dir[1] !== after[0].dir[1]) {
    gravityInverted = true
    console.log(`\n🔄 GRAVITY INVERTED at frame ${frame}!`)
    console.log('Before dir:', before[0].dir)
    console.log('After dir:', after[0].dir)
  }

  // Track horizontal direction changes (turn-around behavior)
  if (before[0].dir[0] !== after[0].dir[0]) {
    directionChanges++
    console.log(
      `🔄 Direction change ${directionChanges} at frame ${frame}: ${before[0].dir[0]} → ${after[0].dir[0]}`
    )
  }

  // Track horizontal movement (running)
  const beforeVelX = fixedToDecimal(before[0].velocity[0])
  const afterVelX = fixedToDecimal(after[0].velocity[0])
  if (!runningDetected && Math.abs(afterVelX) > 0.5) {
    runningDetected = true
    console.log(
      `🏃 RUNNING DETECTED at frame ${frame}: vel_x = ${afterVelX.toFixed(1)}`
    )
  }

  // Track any movement
  const beforePosX = fixedToDecimal(before[0].position[0])
  const beforePosY = fixedToDecimal(before[0].position[1])
  const afterPosX = fixedToDecimal(after[0].position[0])
  const afterPosY = fixedToDecimal(after[0].position[1])
  const posChanged =
    Math.abs(beforePosX - afterPosX) > 0.1 ||
    Math.abs(beforePosY - afterPosY) > 0.1

  const beforeVelY = fixedToDecimal(before[0].velocity[1])
  const afterVelY = fixedToDecimal(after[0].velocity[1])
  const velChanged =
    Math.abs(beforeVelX - afterVelX) > 0.1 ||
    Math.abs(beforeVelY - afterVelY) > 0.1

  if (posChanged || velChanged) {
    lastMovement = frame
  }

  // Log key frames
  if (frame < 20 || frame % 100 === 0 || frame > 480) {
    const posX = fixedToDecimal(char.position[0])
    const posY = fixedToDecimal(char.position[1])
    const velX = fixedToDecimal(char.velocity[0])
    const velY = fixedToDecimal(char.velocity[1])
    console.log(
      `Frame ${frame}: pos=[${posX.toFixed(1)}, ${posY.toFixed(
        1
      )}] vel=[${velX.toFixed(1)}, ${velY.toFixed(1)}] dir=[${char.dir[0]}, ${
        char.dir[1]
      }] collision=[${char.collision.join(',')}]`
    )
  }

  // Check if stuck
  const velX = fixedToDecimal(char.velocity[0])
  const velY = fixedToDecimal(char.velocity[1])
  if (frame > 100 && Math.abs(velX) < 0.1 && Math.abs(velY) < 0.1) {
    if (frame - lastMovement > 50) {
      console.log(
        `❌ Character stuck for too long at frame ${frame} - breaking`
      )
      break
    }
  }
}

console.log('\n📈 Final Summary:')
const finalState = JSON.parse(gameWrapper.get_characters_json())
const finalChar = finalState[0]
const finalPosX = fixedToDecimal(finalChar.position[0])
const finalPosY = fixedToDecimal(finalChar.position[1])
const finalVelX = fixedToDecimal(finalChar.velocity[0])
const finalVelY = fixedToDecimal(finalChar.velocity[1])

console.log('Final character state:')
console.log(`  Position: [${finalPosX.toFixed(1)}, ${finalPosY.toFixed(1)}]`)
console.log(`  Velocity: [${finalVelX.toFixed(1)}, ${finalVelY.toFixed(1)}]`)
console.log(`  Direction: [${finalChar.dir[0]}, ${finalChar.dir[1]}]`)
console.log(`  Collision: [${finalChar.collision.join(',')}]`)

console.log(`\nTask 23 Requirements Check:`)
console.log(`  ✅ Gravity inverted: ${gravityInverted}`)
console.log(
  `  ${runningDetected ? '✅' : '❌'} Running detected: ${runningDetected}`
)
console.log(
  `  ${
    directionChanges > 0 ? '✅' : '❌'
  } Direction changes: ${directionChanges}`
)
console.log(`  Last movement at frame: ${lastMovement}`)

if (gravityInverted && runningDetected && directionChanges > 0) {
  console.log('\n✅ SUCCESS: Task 23 basic inverted gravity system is working!')
  console.log(
    'Character inverts gravity once, runs horizontally, and turns around at walls.'
  )
} else {
  console.log('\n❌ ISSUES FOUND:')
  if (!gravityInverted) console.log('  - Gravity was never inverted')
  if (!runningDetected) console.log('  - Character never ran horizontally')
  if (directionChanges === 0)
    console.log('  - Character never turned around at walls')
}
