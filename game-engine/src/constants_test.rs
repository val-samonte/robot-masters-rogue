//! Integration tests for address byte constants

use crate::constants::{AddressBytes, PropertyAddress};
use crate::script::Operator;

#[test]
fn test_address_bytes_match_operator_values() {
    // Test that AddressBytes values match Operator values
    assert_eq!(AddressBytes::Exit as u8, Operator::Exit as u8);
    assert_eq!(AddressBytes::ReadProp as u8, Operator::ReadProp as u8);
    assert_eq!(AddressBytes::WriteProp as u8, Operator::WriteProp as u8);
    assert_eq!(AddressBytes::AssignByte as u8, Operator::AssignByte as u8);
    assert_eq!(AddressBytes::AssignFixed as u8, Operator::AssignFixed as u8);
    assert_eq!(AddressBytes::Add as u8, Operator::Add as u8);
    assert_eq!(AddressBytes::LessThan as u8, Operator::LessThan as u8);
    assert_eq!(AddressBytes::Spawn as u8, Operator::Spawn as u8);
    assert_eq!(AddressBytes::ExitWithVar as u8, Operator::ExitWithVar as u8);
}

#[test]
fn test_property_address_values() {
    // Test that PropertyAddress values match expected byte values
    assert_eq!(PropertyAddress::GameSeed as u8, 0x01);
    assert_eq!(PropertyAddress::CharacterPosX as u8, 0x19);
    assert_eq!(PropertyAddress::CharacterVelY as u8, 0x1C);
    assert_eq!(PropertyAddress::CharacterEnergy as u8, 0x23);
    assert_eq!(PropertyAddress::CharacterCollisionBottom as u8, 0x2D);
    assert_eq!(PropertyAddress::CharacterArmorPunct as u8, 0x40);
    assert_eq!(PropertyAddress::SpawnPosX as u8, 0x78);
}

#[test]
fn test_address_bytes_conversion() {
    // Test conversion from u8 to AddressBytes
    assert_eq!(AddressBytes::from_u8(0), Some(AddressBytes::Exit));
    assert_eq!(AddressBytes::from_u8(10), Some(AddressBytes::ReadProp));
    assert_eq!(AddressBytes::from_u8(20), Some(AddressBytes::AssignByte));
    assert_eq!(AddressBytes::from_u8(30), Some(AddressBytes::Add));
    assert_eq!(AddressBytes::from_u8(50), Some(AddressBytes::Equal));
    assert_eq!(AddressBytes::from_u8(84), Some(AddressBytes::Spawn));
    assert_eq!(AddressBytes::from_u8(96), Some(AddressBytes::ReadArg));

    // Test invalid value
    assert_eq!(AddressBytes::from_u8(255), None);

    // Test round-trip conversion
    assert_eq!(AddressBytes::Exit.to_u8(), 0);
    assert_eq!(AddressBytes::ReadProp.to_u8(), 10);
    assert_eq!(AddressBytes::Spawn.to_u8(), 84);
}

#[test]
fn test_property_address_conversion() {
    // Test conversion from u8 to PropertyAddress
    assert_eq!(
        PropertyAddress::from_u8(0x01),
        Some(PropertyAddress::GameSeed)
    );
    assert_eq!(
        PropertyAddress::from_u8(0x19),
        Some(PropertyAddress::CharacterPosX)
    );
    assert_eq!(
        PropertyAddress::from_u8(0x23),
        Some(PropertyAddress::CharacterEnergy)
    );
    assert_eq!(
        PropertyAddress::from_u8(0x2D),
        Some(PropertyAddress::CharacterCollisionBottom)
    );
    assert_eq!(
        PropertyAddress::from_u8(0x40),
        Some(PropertyAddress::CharacterArmorPunct)
    );
    assert_eq!(
        PropertyAddress::from_u8(0x78),
        Some(PropertyAddress::SpawnPosX)
    );

    // Test invalid value
    assert_eq!(PropertyAddress::from_u8(0xFF), None);

    // Test round-trip conversion
    assert_eq!(PropertyAddress::GameSeed.to_u8(), 0x01);
    assert_eq!(PropertyAddress::CharacterEnergy.to_u8(), 0x23);
    assert_eq!(PropertyAddress::CharacterArmorPunct.to_u8(), 0x40);
}
