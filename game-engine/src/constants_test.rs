//! Integration tests for address byte constants

use crate::constants::{OperatorAddress, PropertyAddress};
use crate::script::Operator;

#[test]
fn test_address_bytes_match_operator_values() {
    // Test that OperatorAddress values match Operator values
    assert_eq!(u8::from(OperatorAddress::Exit), Operator::Exit as u8);
    assert_eq!(u8::from(OperatorAddress::ReadProp), Operator::ReadProp as u8);
    assert_eq!(u8::from(OperatorAddress::WriteProp), Operator::WriteProp as u8);
    assert_eq!(
        u8::from(OperatorAddress::AssignByte),
        Operator::AssignByte as u8
    );
    assert_eq!(
        u8::from(OperatorAddress::AssignFixed),
        Operator::AssignFixed as u8
    );
    assert_eq!(u8::from(OperatorAddress::Add), Operator::Add as u8);
    assert_eq!(u8::from(OperatorAddress::LessThan), Operator::LessThan as u8);
    assert_eq!(u8::from(OperatorAddress::Spawn), Operator::Spawn as u8);
    assert_eq!(
        u8::from(OperatorAddress::ExitWithVar),
        Operator::ExitWithVar as u8
    );
}

#[test]
fn test_property_address_values() {
    // Test that PropertyAddress values match expected byte values
    assert_eq!(u8::from(PropertyAddress::GameSeed), 0x01);
    assert_eq!(u8::from(PropertyAddress::CharacterPosX), 0x19);
    assert_eq!(u8::from(PropertyAddress::CharacterVelY), 0x1C);
    assert_eq!(u8::from(PropertyAddress::CharacterEnergy), 0x23);
    assert_eq!(u8::from(PropertyAddress::CharacterCollisionBottom), 0x2D);
    assert_eq!(u8::from(PropertyAddress::CharacterArmorPunct), 0x40);
    assert_eq!(u8::from(PropertyAddress::SpawnPosX), 0x78);
}

#[test]
fn test_address_bytes_conversion() {
    // Test conversion from u8 to OperatorAddress
    assert_eq!(OperatorAddress::from_u8(0), Some(OperatorAddress::Exit));
    assert_eq!(
        OperatorAddress::from_u8(10),
        Some(OperatorAddress::ReadProp)
    );
    assert_eq!(
        OperatorAddress::from_u8(20),
        Some(OperatorAddress::AssignByte)
    );
    assert_eq!(OperatorAddress::from_u8(30), Some(OperatorAddress::Add));
    assert_eq!(OperatorAddress::from_u8(50), Some(OperatorAddress::Equal));
    assert_eq!(OperatorAddress::from_u8(84), Some(OperatorAddress::Spawn));
    assert_eq!(OperatorAddress::from_u8(96), Some(OperatorAddress::ReadArg));

    // Test invalid value
    assert_eq!(OperatorAddress::from_u8(255), None);

    // Test round-trip conversion
    assert_eq!(OperatorAddress::Exit.to_u8(), 0);
    assert_eq!(OperatorAddress::ReadProp.to_u8(), 10);
    assert_eq!(OperatorAddress::Spawn.to_u8(), 84);
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
