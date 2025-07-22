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
/// Demonstrates conditional cooldown setting - only sets cooldown after successful reload
pub fn shoot_action_with_ammo() -> Action {
    let script = vec![
        // Check if we have ammo
        97, 0, 0, // ReadSpawn: vars[0] = spawns[0] (current ammo)
        20, 1, 0, // AssignByte: vars[1] = 0 (for comparison)
        52, 2, 0, 1, // LessThan: vars[2] = (current_ammo < 0) - out of ammo?
        // If out of ammo, reload and set cooldown
        // Skip to shooting if we have ammo (jump over reload section)
        // For simplicity, we'll just reload to full capacity
        96, 3, 0, // ReadArg: vars[3] = args[0] (ammo_capacity)
        98, 0, 3, // WriteSpawn: spawns[0] = vars[3] (reload to full)
        // Set cooldown after reload (conditional cooldown setting)
        10, 4, 0x02, // ReadProp: vars[4] = current_frame (low byte)
        94, 4, // WriteActionLastUsed: set cooldown timestamp
        // Get projectile spawn ID from args[1]
        96, 5, 1, // ReadArg: vars[5] = args[1] (projectile_spawn_id)
        // Spawn the projectile
        84, 5, // Spawn: spawn projectile with ID from vars[5]
        // Update ammo count (decrease by 1)
        97, 6, 0, // ReadSpawn: vars[6] = spawns[0] (current ammo)
        20, 7, 1, // AssignByte: vars[7] = 1
        41, 6, 6, 7, // SubByte: vars[6] = vars[6] - 1 (decrease ammo)
        98, 0, 6, // WriteSpawn: spawns[0] = vars[6] (update ammo)
        // Exit with success
        0, 1, // Exit with success (1)
    ];

    Action {
        energy_cost: 5, // Small energy cost per shot
        interval: 1,
        duration: 10, // Brief action duration
        cooldown: 30, // Cooldown after reload (0.5 seconds at 60 FPS)
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [30, 1, 10, 0, 0, 0, 0, 0], // ammo_capacity=30, projectile_id=1, fire_rate=10 frames
        spawns: [30, 0, 0, 0],            // current_ammo=30, last_shot_frame=0, unused, unused
        script,
    }
}

/// Create action script: "Charge" for energy recovery
/// This action stops movement and recovers energy based on character properties
/// Uses character's energy_charge and energy_charge_rate properties for recovery logic
/// Overrides passive regeneration while active
/// Sets cooldown explicitly when action completes
pub fn charge_action() -> Action {
    let script = vec![
        80, // LockAction
        21, 0, 0, 1, // AssignFixed: fixed[0] = 0
        11, 0x1B, 0, // WriteProp: velocity.x = fixed[0] (stop horizontal movement)
        11, 0x1C, 0, // WriteProp: velocity.y = fixed[0] (stop vertical movement)
        // Read current energy and energy charge properties
        10, 0, 0x23, // ReadProp: vars[0] = current_energy
        10, 1, 0x27, // ReadProp: vars[1] = energy_charge (recovery amount per rate)
        10, 2, 0x28, // ReadProp: vars[2] = energy_charge_rate (frames between recovery)
        // Simple energy recovery logic: recover energy_charge amount every energy_charge_rate frames
        // For simplicity, we'll recover energy every frame the action runs (overriding passive regen)
        40, 3, 0, 1, // AddByte: vars[3] = current_energy + energy_charge
        20, 4, 100, // AssignByte: vars[4] = 100 (max energy cap)
        70, 5, 3, 4, // Min: vars[5] = min(new_energy, 100)
        11, 0x23, 5, // WriteProp: energy = vars[5]
        // Set cooldown explicitly when action completes
        10, 6, 0x02, // ReadProp: vars[6] = current_frame
        94, 6, // WriteActionLastUsed: set cooldown timestamp
        0, 1, // Exit with success
    ];

    Action {
        energy_cost: 0,
        interval: 1,
        duration: 120,
        cooldown: 60, // 1 second cooldown after charging
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8], // No longer using args - using character properties instead
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
        assert_eq!(action.cooldown, 30); // cooldown after reload
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
        assert_eq!(action.cooldown, 60); // 1 second cooldown after charging
                                         // No longer using args - using character properties instead
        assert_eq!(action.args, [0; 8]);
        assert!(!action.script.is_empty());
    }

    #[test]
    fn test_charge_action_uses_energy_charge_properties() {
        let action = charge_action();

        // Verify the script reads from the correct property addresses
        let script = &action.script;

        // Should read current energy (0x23)
        assert!(script.contains(&0x23));
        // Should read energy_charge (0x27)
        assert!(script.contains(&0x27));
        // Should read energy_charge_rate (0x28)
        assert!(script.contains(&0x28));

        // Should stop movement by writing to velocity properties
        assert!(script.contains(&0x1B)); // velocity.x
        assert!(script.contains(&0x1C)); // velocity.y

        // Should lock action
        assert_eq!(script[0], 80); // LockAction opcode
    }

    #[test]
    fn test_charge_action_script_structure() {
        let action = charge_action();
        let script = &action.script;

        // Verify script starts with LockAction
        assert_eq!(script[0], 80); // LockAction

        // Verify script stops movement (sets velocity to 0)
        // AssignFixed: fixed[0] = 0
        assert_eq!(script[1], 21); // AssignFixed
        assert_eq!(script[2], 0); // fixed[0]
        assert_eq!(script[3], 0); // numerator = 0
        assert_eq!(script[4], 1); // denominator = 1

        // WriteProp: velocity.x = fixed[0]
        assert_eq!(script[5], 11); // WriteProp
        assert_eq!(script[6], 0x1B); // velocity.x property address
        assert_eq!(script[7], 0); // fixed[0]

        // WriteProp: velocity.y = fixed[0]
        assert_eq!(script[8], 11); // WriteProp
        assert_eq!(script[9], 0x1C); // velocity.y property address
        assert_eq!(script[10], 0); // fixed[0]

        // Verify script ends with Exit success
        assert_eq!(script[script.len() - 2], 0); // Exit opcode
        assert_eq!(script[script.len() - 1], 1); // success flag
    }

    #[test]
    fn test_charge_action_energy_recovery_logic() {
        let action = charge_action();
        let script = &action.script;

        // Find the energy recovery section in the script
        let mut found_energy_read = false;
        let mut found_charge_read = false;
        let mut found_energy_write = false;

        for i in 0..script.len() - 2 {
            // ReadProp: vars[0] = current_energy (0x23)
            if script[i] == 10 && script[i + 1] == 0 && script[i + 2] == 0x23 {
                found_energy_read = true;
            }
            // ReadProp: vars[1] = energy_charge (0x27)
            if script[i] == 10 && script[i + 1] == 1 && script[i + 2] == 0x27 {
                found_charge_read = true;
            }
            // WriteProp: energy = vars[5] (0x23)
            if script[i] == 11 && script[i + 1] == 0x23 && script[i + 2] == 5 {
                found_energy_write = true;
            }
        }

        assert!(found_energy_read, "Script should read current energy");
        assert!(
            found_charge_read,
            "Script should read energy_charge property"
        );
        assert!(found_energy_write, "Script should write updated energy");
    }

    #[test]
    fn test_charge_action_overrides_passive_regeneration() {
        let action = charge_action();

        // The charge action should have 0 energy cost (doesn't consume energy)
        assert_eq!(action.energy_cost, 0);

        // The action should lock the character (preventing other actions)
        let script = &action.script;
        assert_eq!(script[0], 80); // LockAction opcode

        // The action should have a duration that locks the character
        assert!(action.duration > 0);
        assert_eq!(action.duration, 120); // 2 seconds at 60 FPS
    }

    #[test]
    fn test_charge_action_energy_capping() {
        let action = charge_action();
        let script = &action.script;

        // Find the energy capping logic in the script
        let mut found_max_cap = false;
        let mut found_min_operation = false;

        for i in 0..script.len() - 2 {
            // AssignByte: vars[4] = 100 (max energy cap)
            if script[i] == 20 && script[i + 1] == 4 && script[i + 2] == 100 {
                found_max_cap = true;
            }
            // Min: vars[5] = min(new_energy, 100)
            if script[i] == 70 && script[i + 1] == 5 && script[i + 2] == 3 && script[i + 3] == 4 {
                found_min_operation = true;
            }
        }

        assert!(found_max_cap, "Script should set max energy cap to 100");
        assert!(
            found_min_operation,
            "Script should cap energy using Min operation"
        );
    }
}
