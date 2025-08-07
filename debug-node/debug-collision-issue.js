import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

// Game configuration matching web viewer
const gameConfig = {
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  characters: [
    {
      health: 100,
      energy: 100,
      core: {
        pos: [32, 384], // Start near left wall
        vel: [0, 0],
        size: [16, 16],
        dir: [1, 1], // Facing right initially
        collision: [false, false, false, false],
        weight: 1,
        jump_force: 10,
        move_speed: 2,
        gravity_multiplier: 1,
      },
      behaviors: [
        [0, 1], // IS_WALL_LEANING -> TURN_AROUND
        [1, 0], // ALWAYS -> RUN
      ],
      // ... other character properties
      power: 10,
      health_cap: 100,
      energy_cap: 100,
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 0,
      energy_charge_rate: 0,
      locked_action: null,
      status_effects: [],
      action_last_used: [],
    },
  ],
  actionDefinitions: [
    {
      id: 0,
      name: 'RUN',
      script: [
        { op: 'READ_PROP', args: [1, 0] }, // Read ENTITY_DIR_HORIZONTAL to var[0]
        { op: 'READ_PROP', args: [13, 1] }, // Read CHARACTER_MOVE_SPEED to fixed[1]
        { op: 'MUL', args: [0, 1, 2] }, // Multiply: fixed[2] = var[0] * fixed[1]
        { op: 'WRITE_PROP', args: [2, 2] }, // Write to CHARACTER_VEL_X
      ],
      cooldown: 0,
      spawns: [],
    },
    {
      id: 1,
      name: 'TURN_AROUND',
      script: [
        { op: 'READ_PROP', args: [1, 0] }, // Read ENTITY_DIR_HORIZONTAL to var[0]
        { op: 'NEGATE', args: [0, 1] }, // Negate: fixed[1] = -var[0]
        { op: 'WRITE_PROP', args: [1, 1] }, // Write back to ENTITY_DIR_HORIZONTAL
      ],
      cooldown: 0,
      spawns: [],
    },
  ],
  conditionDefinitions: [
    {
      id: 0,
      name: 'IS_WALL_LEANING',
      script: [
        { op: 'READ_PROP', args: [1, 0] }, // Read ENTITY_DIR_HORIZONTAL to var[0]
        { op: 'READ_PROP', args: [7, 1] }, // Read CHARACTER_COLLISION_RIGHT to var[1]
        { op: 'READ_PROP', args: [9, 2] }, // Read CHARACTER_COLLISION_LEFT to var[2]
        { op: 'CONST', args: [1, 3] }, // Set var[3] = 1 (facing right)
        { op: 'CONST', args: [255, 4] }, // Set var[4] = 255 (facing left, -1 in u8)
        { op: 'EQ', args: [0, 3, 5] }, // var[5] = (dir == 1) ? 1 : 0
        { op: 'EQ', args: [0, 4, 6] }, // var[6] = (dir == -1) ? 1 : 0
        { op: 'AND', args: [5, 1, 7] }, // var[7] = facing_right && right_collision
        { op: 'AND', args: [6, 2, 8] }, // var[8] = facing_left && left_collision
        { op: 'OR', args: [7, 8, 9] }, // var[9] = wall_leaning_right || wall_leaning_left
        { op: 'RETURN', args: [9] }, // Return result
      ],
    },
    {
      id: 1,
      name: 'ALWAYS',
      script: [
        { op: 'CONST', args: [1, 0] },
        { op: 'RETURN', args: [0] },
      ],
    },
  ],
  spawnDefinitions: [],
  statusEffectDefinitions: [],
}

console.log('=== COLLISION ISSUE DEBUG ===')
console.log('Testing execution order and collision detection')

const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
gameWrapper.new_game()

console.log('\n=== FRAME EXECUTION ORDER ANALYSIS ===')

for (let frame = 0; frame < 20; frame++) {
  console.log(`\n--- FRAME ${frame} ---`)

  const beforeFrame = JSON.parse(gameWrapper.get_characters_json())
  const char = beforeFrame[0]

  console.log(`BEFORE FRAME:`)
  console.log(`  Position: [${char.core.pos[0]}, ${char.core.pos[1]}]`)
  console.log(`  Velocity: [${char.core.vel[0]}, ${char.core.vel[1]}]`)
  console.log(`  Direction: [${char.core.dir[0]}, ${char.core.dir[1]}]`)
  console.log(`  Collision: [${char.core.collision.join(', ')}]`)

  // Step one frame
  gameWrapper.step_frame()

  const afterFrame = JSON.parse(gameWrapper.get_characters_json())
  const charAfter = afterFrame[0]

  console.log(`AFTER FRAME:`)
  console.log(
    `  Position: [${charAfter.core.pos[0]}, ${charAfter.core.pos[1]}]`
  )
  console.log(
    `  Velocity: [${charAfter.core.vel[0]}, ${charAfter.core.vel[1]}]`
  )
  console.log(
    `  Direction: [${charAfter.core.dir[0]}, ${charAfter.core.dir[1]}]`
  )
  console.log(`  Collision: [${charAfter.core.collision.join(', ')}]`)

  // Analyze what happened
  const posChanged =
    char.core.pos[0] !== charAfter.core.pos[0] ||
    char.core.pos[1] !== charAfter.core.pos[1]
  const velChanged =
    char.core.vel[0] !== charAfter.core.vel[0] ||
    char.core.vel[1] !== charAfter.core.vel[1]
  const dirChanged =
    char.core.dir[0] !== charAfter.core.dir[0] ||
    char.core.dir[1] !== charAfter.core.dir[1]
  const collisionChanged =
    JSON.stringify(char.core.collision) !==
    JSON.stringify(charAfter.core.collision)

  console.log(`CHANGES:`)
  console.log(`  Position changed: ${posChanged}`)
  console.log(`  Velocity changed: ${velChanged}`)
  console.log(`  Direction changed: ${dirChanged}`)
  console.log(`  Collision changed: ${collisionChanged}`)

  // Check if character is stuck (velocity set but position not changing)
  if (velChanged && !posChanged && charAfter.core.vel[0] !== 0) {
    console.log(
      `  ⚠️  CHARACTER STUCK: Velocity set but position not changing!`
    )
    console.log(`  This suggests collision detection is preventing movement`)
  }

  // Check if direction changed but still colliding
  if (
    dirChanged &&
    (charAfter.core.collision[1] || charAfter.core.collision[3])
  ) {
    console.log(`  ⚠️  TURNED AROUND BUT STILL COLLIDING!`)
    console.log(`  This suggests the character is overlapping with wall`)
  }

  // Stop if we detect the stuck condition
  if (frame > 5 && charAfter.core.vel[0] !== 0 && !posChanged) {
    console.log(`\n🔍 DETECTED STUCK CONDITION AT FRAME ${frame}`)
    console.log(`Character has velocity but position is not changing.`)
    console.log(`This confirms the collision detection issue.`)
    break
  }
}

console.log('\n=== ANALYSIS COMPLETE ===')
console.log('The issue appears to be in the execution order:')
console.log('1. Behaviors execute (set velocity)')
console.log('2. Collision detection runs (constrains velocity)')
console.log('3. Position update applies constrained velocity')
console.log(
  '4. BUT collision flags are set AFTER behaviors have already executed'
)
console.log('5. So next frame, behaviors see old collision state')
