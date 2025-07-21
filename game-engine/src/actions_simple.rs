//! Essential action scripts for character behaviors

use crate::behavior::Action;
use crate::math::Fixed;
use alloc::vec;

/// Simple test function to verify module compilation
pub fn test_function() -> u8 {
    42
}

/// Create action script: "Shoot" for projectile spawning with ammo management
/// This action spawns projectiles using spawn ID and tracks ammo consumption
/// Uses args[0] for ammo capacity, args[1] for projectile spawn ID, args[2] for fire rate (frames between shots)
/// Uses spawns[0] to track current ammo count
pub fn shoot_action_with_ammo() -> Action {
    let script = vec![
        // Basic shoot script - spawn projectile and manage ammo/timing

        // Get projectile spawn ID from args[1]
        96, 0, 1, // ReadArg: vars[0] = args[1] (projectile_spawn_id)
        // Spawn the projectile
        84, 0, // Spawn: spawn projectile with ID from vars[0]
        // Update ammo count (decrease by 1)
        97, 1, 0, // ReadSpawn: vars[1] = spawns[0] (current ammo)
        20, 2, 1, // AssignByte: vars[2] = 1
        41, 1, 1, 2, // SubByte: vars[1] = vars[1] - 1 (decrease ammo)
        98, 0, 1, // WriteSpawn: spawns[0] = vars[1] (update ammo)
        // Update last shot frame
        10, 0, 0x02, // ReadProp: fixed[0] = current_frame
        23, 3, 0, // ToByte: vars[3] = current_frame (low byte)
        98, 1, 3, // WriteSpawn: spawns[1] = vars[3] (update last shot frame)
        // Exit with success
        0, 1, // Exit with success (1)
    ];

    Action {
        energy_cost: 5, // Small energy cost per shot
        interval: 1,
        duration: 10, // Brief action duration
        cooldown: 0,  // No action-level cooldown (using internal fire rate)
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [30, 1, 10, 0, 0, 0, 0, 0], // ammo_capacity=30, projectile_id=1, fire_rate=10 frames
        spawns: [30, 0, 0, 0],            // current_ammo=30, last_shot_frame=0, unused, unused
        script,
    }
}

/// Create action script: "Charge" for energy recovery
/// This action stops movement and recovers energy based on character properties
/// Uses args[0] for energy recovery amount, args[1] for max energy cap
pub fn charge_action() -> Action {
    let script = vec![
        80, // LockAction
        21, 0, 0, 1, // AssignFixed: fixed[0] = 0
        11, 0x1B, 0, // WriteProp: velocity.x = fixed[0]
        11, 0x1C, 0, // WriteProp: velocity.y = fixed[0]
        10, 0, 0x23, // ReadProp: vars[0] = current_energy
        96, 1, 0, // ReadArg: vars[1] = args[0]
        40, 2, 0, 1, // AddByte: vars[2] = current_energy + recovery_amount
        96, 3, 1, // ReadArg: vars[3] = args[1]
        70, 4, 2, 3, // Min: vars[4] = min(new_energy, max_cap)
        11, 0x23, 4, // WriteProp: energy = vars[4]
        0, 1, // Exit with success
    ];

    Action {
        energy_cost: 0,
        interval: 1,
        duration: 120,
        cooldown: 0,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [2, 100, 0, 0, 0, 0, 0, 0],
        spawns: [0; 4],
        script,
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple() {
        assert_eq!(1, 1);
    }

    #[test]
    fn test_function_works() {
        assert_eq!(test_function(), 42);
    }

    #[test]
    fn test_shoot_action_creation() {
        let action = shoot_action_with_ammo();

        assert_eq!(action.energy_cost, 5);
        assert_eq!(action.duration, 10);
        assert_eq!(action.args[0], 30); // ammo_capacity
        assert_eq!(action.args[1], 1); // projectile_id
        assert_eq!(action.args[2], 10); // fire_rate
        assert_eq!(action.spawns[0], 30); // current_ammo
        assert_eq!(action.spawns[1], 0); // last_shot_frame
        assert!(!action.script.is_empty());
    }

    #[test]
    fn test_charge_action_creation() {
        let action = charge_action();

        assert_eq!(action.energy_cost, 0);
        assert_eq!(action.duration, 120);
        assert_eq!(action.args[0], 2); // energy recovery amount
        assert_eq!(action.args[1], 100); // max energy cap
        assert!(!action.script.is_empty());
    }
}
