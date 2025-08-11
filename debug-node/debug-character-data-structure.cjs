const { GameWrapper } = require('../wasm-wrapper/pkg/wasm_wrapper.js')

// Simple test to see what the character data structure looks like
const SIMPLE_CONFIG = {
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
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [90, 1], // Just EXIT 1
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [90, 1], // ALWAYS
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [32, 1],
        [192, 1],
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
      dir: [2, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Always -> Simple action
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

console.log('🔍 Debugging character data structure...')

const gameWrapper = new GameWrapper(JSON.stringify(SIMPLE_CONFIG))
gameWrapper.new_game()

console.log('\n📊 Raw character data:')
const rawData = gameWrapper.get_characters_json()
console.log('Raw JSON:', rawData)

const characters = JSON.parse(rawData)
console.log('\nParsed character data:')
console.log('Character count:', characters.length)
if (characters.length > 0) {
  console.log('Character 0 keys:', Object.keys(characters[0]))
  console.log('Full character 0:', JSON.stringify(characters[0], null, 2))
}

// Run a few frames to see if data changes
for (let frame = 0; frame < 5; frame++) {
  gameWrapper.step_frame()
  const frameData = JSON.parse(gameWrapper.get_characters_json())
  console.log(`\nFrame ${frame + 1} character data:`)
  if (frameData.length > 0) {
    console.log('Keys:', Object.keys(frameData[0]))
    console.log('Position field:', frameData[0].position)
    console.log('Velocity field:', frameData[0].velocity)
    console.log('Pos field:', frameData[0].pos)
    console.log('Vel field:', frameData[0].vel)
  }
}
