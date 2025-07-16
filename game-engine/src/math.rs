//! Fixed-point mathematics for no_std environment
//! Avoiding floats for Solana compatibility

/// Fixed-point number with 5-bit precision for optimal storage/performance balance
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Fixed(i16);

impl Fixed {
    pub const FRACTIONAL_BITS: u32 = 5;
    pub const ONE: Fixed = Fixed(1 << Self::FRACTIONAL_BITS); // 32
    pub const ZERO: Fixed = Fixed(0);

    pub fn from_int(value: i16) -> Self {
        Fixed(value << Self::FRACTIONAL_BITS)
    }

    pub fn to_int(self) -> i32 {
        (self.0 >> Self::FRACTIONAL_BITS) as i32
    }

    pub fn add(self, other: Fixed) -> Fixed {
        Fixed(self.0.saturating_add(other.0))
    }

    pub fn sub(self, other: Fixed) -> Fixed {
        Fixed(self.0.saturating_sub(other.0))
    }

    pub fn mul(self, other: Fixed) -> Fixed {
        let result = (self.0 as i32 * other.0 as i32) >> Self::FRACTIONAL_BITS;
        Fixed(result as i16)
    }

    pub fn div(self, other: Fixed) -> Fixed {
        if other.0 == 0 {
            return Fixed::ZERO;
        }
        let result = ((self.0 as i32) << Self::FRACTIONAL_BITS) / other.0 as i32;
        Fixed(result as i16)
    }
}

/// 2D Vector using fixed-point arithmetic
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Vec2 {
    pub x: Fixed,
    pub y: Fixed,
}

impl Vec2 {
    pub fn new(x: Fixed, y: Fixed) -> Self {
        Self { x, y }
    }

    pub fn zero() -> Self {
        Self {
            x: Fixed::ZERO,
            y: Fixed::ZERO,
        }
    }

    pub fn add(self, other: Vec2) -> Vec2 {
        Vec2 {
            x: self.x.add(other.x),
            y: self.y.add(other.y),
        }
    }
}

/// Precomputed trigonometry tables for performance
pub struct TrigTables {
    sin_table: [Fixed; 360], // 1-degree precision
    cos_table: [Fixed; 360],
    atan2_table: [[u8; 256]; 256], // Returns angle in degrees
}

impl TrigTables {
    pub fn new() -> Self {
        // Tables will be populated in the trigonometry task
        Self {
            sin_table: [Fixed::ZERO; 360],
            cos_table: [Fixed::ZERO; 360],
            atan2_table: [[0; 256]; 256],
        }
    }

    pub fn sin(&self, degrees: u16) -> Fixed {
        let index = (degrees % 360) as usize;
        self.sin_table[index]
    }

    pub fn cos(&self, degrees: u16) -> Fixed {
        let index = (degrees % 360) as usize;
        self.cos_table[index]
    }

    pub fn atan2(&self, _y: Fixed, _x: Fixed) -> u8 {
        // Convert to lookup table indices (will be implemented in trigonometry task)
        0
    }
}
