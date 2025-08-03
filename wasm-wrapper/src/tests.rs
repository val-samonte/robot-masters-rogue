//! Unit tests for WASM wrapper
//!
//! These tests verify JSON serialization, game initialization, and basic functionality

use crate::types::{
    convert_tilemap, ActionDefinitionJson, CharacterDefinitionJson, ConditionDefinitionJson,
    GameConfig,
};
use crate::GameWrapper;
use robot_masters_engine::constants::operator_address;
use robot_masters_engine::{entity::Character, math::Fixed};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn test_character_json_conversion() {
    let character_json = CharacterDefinitionJson {
        id: 1,
        group: 2,
        position: [5.5, 10.25],
        health: 100,
        energy: 80,
        armor: [10, 20, 30, 40, 50, 60, 70, 80, 90],
        energy_regen: 2,
        energy_regen_rate: 60,
        energy_charge: 5,
        energy_charge_rate: 10,
        behaviors: vec![[0, 1], [2, 3]],
    };

    // Convert to engine type
    let character: Character = character_json.clone().into();

    // Verify conversion
    assert_eq!(character.core.id, 1);
    assert_eq!(character.core.group, 2);
    assert_eq!(character.health, 100);
    assert_eq!(character.energy, 80);
    assert_eq!(character.armor, [10, 20, 30, 40, 50, 60, 70, 80, 90]);
    assert_eq!(character.energy_regen, 2);
    assert_eq!(character.energy_regen_rate, 60);
    assert_eq!(character.energy_charge, 5);
    assert_eq!(character.energy_charge_rate, 10);
    assert_eq!(character.behaviors, vec![(0, 1), (2, 3)]);

    // Verify position conversion (float to fixed-point)
    let expected_x = Fixed::from_raw((5.5 * 32.0) as i16);
    let expected_y = Fixed::from_raw((10.25 * 32.0) as i16);
    assert_eq!(character.core.pos.0, expected_x);
    assert_eq!(character.core.pos.1, expected_y);
}

#[wasm_bindgen_test]
fn test_tilemap_conversion() {
    let json_tilemap = vec![
        vec![0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        vec![1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        vec![1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        vec![0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        vec![1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        vec![1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        vec![0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        vec![1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        vec![1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        vec![0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        vec![1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    // Convert to engine format
    let tilemap = convert_tilemap(&json_tilemap).expect("Tilemap conversion should succeed");

    // Verify dimensions
    assert_eq!(tilemap.len(), 15);
    assert_eq!(tilemap[0].len(), 16);

    // Verify some specific values
    assert_eq!(tilemap[0][0], 0);
    assert_eq!(tilemap[0][1], 1);
    assert_eq!(tilemap[1][0], 1);
    assert_eq!(tilemap[1][1], 0);
    assert_eq!(tilemap[3], [1; 16]); // Row of all 1s
    assert_eq!(tilemap[6], [0; 16]); // Row of all 0s
}

#[wasm_bindgen_test]
fn test_game_wrapper_creation() {
    let config = GameConfig {
        seed: 12345,
        tilemap: vec![vec![0; 16]; 15],
        characters: vec![CharacterDefinitionJson {
            id: 1,
            group: 1,
            position: [5.0, 5.0],
            health: 100,
            energy: 100,
            armor: [100; 9],
            energy_regen: 1,
            energy_regen_rate: 60,
            energy_charge: 5,
            energy_charge_rate: 10,
            behaviors: vec![[0, 0]],
        }],
        actions: vec![ActionDefinitionJson {
            energy_cost: 20,
            cooldown: 60,
            args: [0; 8],
            spawns: [0; 4],
            script: vec![
                operator_address::APPLY_ENERGY_COST,
                operator_address::EXIT,
                0,
            ],
        }],
        conditions: vec![ConditionDefinitionJson {
            energy_mul: 1.0,
            args: [0; 8],
            script: vec![
                operator_address::ASSIGN_BYTE,
                0,
                1, // always true
                operator_address::EXIT,
                0,
            ],
        }],
        spawns: vec![],
        status_effects: vec![],
    };

    let config_json = serde_json::to_string(&config).expect("Config serialization should work");
    let wrapper = GameWrapper::new(&config_json);
    assert!(wrapper.is_ok(), "GameWrapper creation should succeed");

    let wrapper = wrapper.unwrap();
    assert!(wrapper.is_initialized(), "Wrapper should be initialized");
    assert!(
        !wrapper.is_game_initialized(),
        "Game should not be initialized yet"
    );
}

#[wasm_bindgen_test]
fn test_game_initialization() {
    let config = GameConfig {
        seed: 12345,
        tilemap: vec![vec![0; 16]; 15],
        characters: vec![CharacterDefinitionJson {
            id: 1,
            group: 1,
            position: [8.0, 7.0],
            health: 100,
            energy: 100,
            armor: [100; 9],
            energy_regen: 1,
            energy_regen_rate: 60,
            energy_charge: 5,
            energy_charge_rate: 10,
            behaviors: vec![[0, 0]],
        }],
        actions: vec![ActionDefinitionJson {
            energy_cost: 20,
            cooldown: 60,
            args: [0; 8],
            spawns: [0; 4],
            script: vec![
                operator_address::EXIT_IF_NO_ENERGY,
                1,
                operator_address::APPLY_ENERGY_COST,
                operator_address::EXIT,
                0,
            ],
        }],
        conditions: vec![ConditionDefinitionJson {
            energy_mul: 1.0,
            args: [0; 8],
            script: vec![
                operator_address::ASSIGN_BYTE,
                0,
                1, // always true
                operator_address::EXIT,
                0,
            ],
        }],
        spawns: vec![],
        status_effects: vec![],
    };

    let config_json = serde_json::to_string(&config).expect("Config serialization should work");
    let mut wrapper = GameWrapper::new(&config_json).expect("Wrapper creation should succeed");

    // Initialize the game
    let init_result = wrapper.new_game();
    assert!(init_result.is_ok(), "Game initialization should succeed");
    assert!(wrapper.is_game_initialized(), "Game should be initialized");

    // Check initial state
    assert_eq!(wrapper.get_frame(), 0, "Initial frame should be 0");
    assert_eq!(
        wrapper.get_game_status(),
        "playing",
        "Game should be playing"
    );
    assert!(!wrapper.is_game_ended(), "Game should not be ended");
}

#[wasm_bindgen_test]
fn test_frame_stepping() {
    let config = GameConfig {
        seed: 12345,
        tilemap: vec![vec![0; 16]; 15],
        characters: vec![CharacterDefinitionJson {
            id: 1,
            group: 1,
            position: [8.0, 7.0],
            health: 100,
            energy: 100,
            armor: [100; 9],
            energy_regen: 1,
            energy_regen_rate: 60,
            energy_charge: 5,
            energy_charge_rate: 10,
            behaviors: vec![[0, 0]],
        }],
        actions: vec![ActionDefinitionJson {
            energy_cost: 20,
            cooldown: 60,
            args: [0; 8],
            spawns: [0; 4],
            script: vec![
                operator_address::EXIT_IF_NO_ENERGY,
                1,
                operator_address::APPLY_ENERGY_COST,
                operator_address::EXIT,
                0,
            ],
        }],
        conditions: vec![ConditionDefinitionJson {
            energy_mul: 1.0,
            args: [0; 8],
            script: vec![
                operator_address::ASSIGN_BYTE,
                0,
                1, // always true
                operator_address::EXIT,
                0,
            ],
        }],
        spawns: vec![],
        status_effects: vec![],
    };

    let config_json = serde_json::to_string(&config).expect("Config serialization should work");
    let mut wrapper = GameWrapper::new(&config_json).expect("Wrapper creation should succeed");
    wrapper
        .new_game()
        .expect("Game initialization should succeed");

    // Step through several frames
    for expected_frame in 1..=5 {
        let step_result = wrapper.step_frame();
        assert!(
            step_result.is_ok(),
            "Frame stepping should succeed at frame {}",
            expected_frame
        );

        let current_frame = wrapper.get_frame();
        assert_eq!(
            current_frame, expected_frame,
            "Frame should increment correctly"
        );
    }
}

#[wasm_bindgen_test]
fn test_state_serialization() {
    let config = GameConfig {
        seed: 12345,
        tilemap: vec![vec![0; 16]; 15],
        characters: vec![CharacterDefinitionJson {
            id: 1,
            group: 1,
            position: [8.0, 7.0],
            health: 100,
            energy: 100,
            armor: [100; 9],
            energy_regen: 1,
            energy_regen_rate: 60,
            energy_charge: 5,
            energy_charge_rate: 10,
            behaviors: vec![[0, 0]],
        }],
        actions: vec![ActionDefinitionJson {
            energy_cost: 20,
            cooldown: 60,
            args: [0; 8],
            spawns: [0; 4],
            script: vec![
                operator_address::APPLY_ENERGY_COST,
                operator_address::EXIT,
                0,
            ],
        }],
        conditions: vec![ConditionDefinitionJson {
            energy_mul: 1.0,
            args: [0; 8],
            script: vec![
                operator_address::ASSIGN_BYTE,
                0,
                1, // always true
                operator_address::EXIT,
                0,
            ],
        }],
        spawns: vec![],
        status_effects: vec![],
    };

    let config_json = serde_json::to_string(&config).expect("Config serialization should work");
    let mut wrapper = GameWrapper::new(&config_json).expect("Wrapper creation should succeed");
    wrapper
        .new_game()
        .expect("Game initialization should succeed");

    // Test getting various state JSON
    let state_json = wrapper.get_state_json();
    assert!(state_json.is_ok(), "Should be able to get state JSON");

    let characters_json = wrapper.get_characters_json();
    assert!(
        characters_json.is_ok(),
        "Should be able to get characters JSON"
    );

    let spawns_json = wrapper.get_spawns_json();
    assert!(spawns_json.is_ok(), "Should be able to get spawns JSON");

    let status_effects_json = wrapper.get_status_effects_json();
    assert!(
        status_effects_json.is_ok(),
        "Should be able to get status effects JSON"
    );

    let frame_info_json = wrapper.get_frame_info_json();
    assert!(
        frame_info_json.is_ok(),
        "Should be able to get frame info JSON"
    );
}

#[wasm_bindgen_test]
fn test_deterministic_behavior() {
    let seed = 42;
    let config = GameConfig {
        seed,
        tilemap: vec![vec![0; 16]; 15],
        characters: vec![CharacterDefinitionJson {
            id: 1,
            group: 1,
            position: [3.0, 3.0],
            health: 100,
            energy: 100,
            armor: [100; 9],
            energy_regen: 1,
            energy_regen_rate: 60,
            energy_charge: 5,
            energy_charge_rate: 10,
            behaviors: vec![[0, 0]],
        }],
        actions: vec![ActionDefinitionJson {
            energy_cost: 20,
            cooldown: 60,
            args: [0; 8],
            spawns: [0; 4],
            script: vec![
                operator_address::APPLY_ENERGY_COST,
                operator_address::EXIT,
                0,
            ],
        }],
        conditions: vec![ConditionDefinitionJson {
            energy_mul: 1.0,
            args: [0; 8],
            script: vec![
                operator_address::ASSIGN_BYTE,
                0,
                1, // always true
                operator_address::EXIT,
                0,
            ],
        }],
        spawns: vec![],
        status_effects: vec![],
    };

    let config_json = serde_json::to_string(&config).expect("Config serialization should work");

    let mut wrapper1 = GameWrapper::new(&config_json).expect("Wrapper1 creation should succeed");
    let mut wrapper2 = GameWrapper::new(&config_json).expect("Wrapper2 creation should succeed");

    wrapper1
        .new_game()
        .expect("Game1 initialization should succeed");
    wrapper2
        .new_game()
        .expect("Game2 initialization should succeed");

    // Step both games for the same number of frames
    for frame in 1..=10 {
        wrapper1
            .step_frame()
            .expect("Game1 frame stepping should succeed");
        wrapper2
            .step_frame()
            .expect("Game2 frame stepping should succeed");

        assert_eq!(
            wrapper1.get_frame(),
            frame,
            "Game1 frame should match expected"
        );
        assert_eq!(
            wrapper2.get_frame(),
            frame,
            "Game2 frame should match expected"
        );
        assert_eq!(
            wrapper1.get_frame(),
            wrapper2.get_frame(),
            "Frame numbers should match"
        );

        // Compare states every few frames
        if frame % 3 == 0 {
            let state1 = wrapper1.get_state_json().expect("Should get state1");
            let state2 = wrapper2.get_state_json().expect("Should get state2");
            assert_eq!(
                state1, state2,
                "Game states should be identical at frame {}",
                frame
            );
        }
    }
}

#[wasm_bindgen_test]
fn test_error_handling() {
    // Test invalid JSON
    let invalid_json = "{ this is not valid json }";
    let result = GameWrapper::new(invalid_json);
    assert!(result.is_err(), "Invalid JSON should fail");

    // Test missing required fields
    let incomplete_json = r#"{"seed": 123}"#;
    let result = GameWrapper::new(incomplete_json);
    assert!(result.is_err(), "Incomplete JSON should fail");

    // Test operations without game initialization
    let config = GameConfig {
        seed: 12345,
        tilemap: vec![vec![0; 16]; 15],
        characters: vec![CharacterDefinitionJson {
            id: 1,
            group: 1,
            position: [5.0, 5.0],
            health: 100,
            energy: 100,
            armor: [100; 9],
            energy_regen: 1,
            energy_regen_rate: 60,
            energy_charge: 5,
            energy_charge_rate: 10,
            behaviors: vec![[0, 0]],
        }],
        actions: vec![ActionDefinitionJson {
            energy_cost: 20,
            cooldown: 60,
            args: [0; 8],
            spawns: [0; 4],
            script: vec![operator_address::EXIT, 0],
        }],
        conditions: vec![ConditionDefinitionJson {
            energy_mul: 1.0,
            args: [0; 8],
            script: vec![
                operator_address::ASSIGN_BYTE,
                0,
                1, // always true
                operator_address::EXIT,
                0,
            ],
        }],
        spawns: vec![],
        status_effects: vec![],
    };

    let config_json = serde_json::to_string(&config).expect("Serialization should work");
    let mut wrapper = GameWrapper::new(&config_json).expect("Wrapper creation should succeed");

    // Try to step frame without initializing game
    let result = wrapper.step_frame();
    assert!(
        result.is_err(),
        "Frame stepping should fail without game initialization"
    );

    // Try to get state without initializing game
    let result = wrapper.get_state_json();
    assert!(
        result.is_err(),
        "Getting state should fail without game initialization"
    );
}
