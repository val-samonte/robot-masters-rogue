//! Fixed-point mathematics for no_std environment
//! Avoiding floats for Solana compatibility

/// Fixed-point number with 5-bit precision for optimal storage/performance balance
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Fixed(i16);

impl Fixed {
    pub const FRACTIONAL_BITS: u32 = 5;
    pub const ONE: Fixed = Fixed(1 << Self::FRACTIONAL_BITS); // 32
    pub const ZERO: Fixed = Fixed(0);
    pub const MAX: Fixed = Fixed(i16::MAX);
    pub const MIN: Fixed = Fixed(i16::MIN);

    /// Create a Fixed from an integer value
    pub fn from_int(value: i16) -> Self {
        Fixed(value << Self::FRACTIONAL_BITS)
    }

    /// Create a Fixed from raw internal representation
    pub fn from_raw(raw: i16) -> Self {
        Fixed(raw)
    }

    /// Get the raw internal representation
    pub fn raw(self) -> i16 {
        self.0
    }

    /// Convert to integer (truncating fractional part)
    pub fn to_int(self) -> i32 {
        (self.0 >> Self::FRACTIONAL_BITS) as i32
    }

    /// Get the fractional part as a value between 0 and 31
    pub fn frac(self) -> u8 {
        (self.0 & ((1 << Self::FRACTIONAL_BITS) - 1)) as u8
    }

    /// Addition with overflow handling
    pub fn add(self, other: Fixed) -> Fixed {
        Fixed(self.0.saturating_add(other.0))
    }

    /// Subtraction with overflow handling
    pub fn sub(self, other: Fixed) -> Fixed {
        Fixed(self.0.saturating_sub(other.0))
    }

    /// Multiplication with overflow handling
    pub fn mul(self, other: Fixed) -> Fixed {
        let result = (self.0 as i32 * other.0 as i32) >> Self::FRACTIONAL_BITS;
        // Clamp to i16 range to handle overflow
        Fixed(result.clamp(i16::MIN as i32, i16::MAX as i32) as i16)
    }

    /// Division with overflow handling and zero check
    pub fn div(self, other: Fixed) -> Fixed {
        if other.0 == 0 {
            // Return max/min value based on sign of dividend for division by zero
            return if self.0 >= 0 { Fixed::MAX } else { Fixed::MIN };
        }
        let result = ((self.0 as i32) << Self::FRACTIONAL_BITS) / other.0 as i32;
        // Clamp to i16 range to handle overflow
        Fixed(result.clamp(i16::MIN as i32, i16::MAX as i32) as i16)
    }

    /// Absolute value
    pub fn abs(self) -> Fixed {
        Fixed(self.0.abs())
    }

    /// Negation
    pub fn neg(self) -> Fixed {
        Fixed(-self.0)
    }

    /// Check if the value is positive
    pub fn is_positive(self) -> bool {
        self.0 > 0
    }

    /// Check if the value is negative
    pub fn is_negative(self) -> bool {
        self.0 < 0
    }

    /// Check if the value is zero
    pub fn is_zero(self) -> bool {
        self.0 == 0
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
        let mut tables = Self {
            sin_table: [Fixed::ZERO; 360],
            cos_table: [Fixed::ZERO; 360],
            atan2_table: [[0; 256]; 256],
        };

        tables.populate_trig_tables();
        tables.populate_atan2_table();
        tables
    }

    /// Populate sin and cos tables with precomputed values
    fn populate_trig_tables(&mut self) {
        // Generate sin values using a simple approximation for each degree
        // We'll use a quarter-wave approach and mirror for other quadrants
        for i in 0..360 {
            let angle_deg = i as i16;
            let sin_val = match angle_deg {
                // First quadrant (0-90 degrees)
                0..=90 => {
                    // Linear approximation: sin increases from 0 to 32 (which represents 1.0)
                    (angle_deg * 32) / 90
                }
                // Second quadrant (91-180 degrees) - mirror first quadrant
                91..=180 => {
                    let mirrored = 180 - angle_deg;
                    (mirrored * 32) / 90
                }
                // Third quadrant (181-270 degrees) - negative of first quadrant
                181..=270 => {
                    let mirrored = angle_deg - 180;
                    -((mirrored * 32) / 90)
                }
                // Fourth quadrant (271-359 degrees) - negative of second quadrant
                _ => {
                    let mirrored = 360 - angle_deg;
                    -((mirrored * 32) / 90)
                }
            };

            self.sin_table[i] = Fixed::from_raw(sin_val);
        }

        // Populate cos table (cos(x) = sin(x + 90))
        for i in 0..360 {
            let cos_index = (i + 90) % 360;
            self.cos_table[i] = self.sin_table[cos_index];
        }
    }

    /// Populate atan2 lookup table for angle calculations
    fn populate_atan2_table(&mut self) {
        // For each combination of y and x values (-128 to 127), compute the angle
        for y in 0..256 {
            for x in 0..256 {
                let y_val = (y as i16) - 128; // Convert to -128..127 range
                let x_val = (x as i16) - 128; // Convert to -128..127 range

                let angle = if x_val == 0 && y_val == 0 {
                    0 // Undefined case, return 0
                } else if x_val == 0 {
                    if y_val > 0 {
                        90
                    } else {
                        270
                    }
                } else if y_val == 0 {
                    if x_val > 0 {
                        0
                    } else {
                        180
                    }
                } else {
                    // Approximate atan2 using octant-based calculation
                    let abs_y = y_val.abs();
                    let abs_x = x_val.abs();

                    let angle = if abs_x >= abs_y {
                        // Use atan(y/x) approximation for angles close to horizontal
                        let ratio = (abs_y * 45) / abs_x; // Approximate atan in degrees
                        ratio.min(45)
                    } else {
                        // Use 90 - atan(x/y) for angles close to vertical
                        let ratio = (abs_x * 45) / abs_y;
                        90 - ratio.min(45)
                    };

                    // Adjust for quadrant
                    if x_val > 0 && y_val > 0 {
                        angle // Q1
                    } else if x_val < 0 && y_val > 0 {
                        180 - angle // Q2
                    } else if x_val < 0 && y_val < 0 {
                        180 + angle // Q3
                    } else {
                        360 - angle // Q4
                    }
                };

                self.atan2_table[y][x] = (angle % 360) as u8;
            }
        }
    }

    /// Get sine value for given angle in degrees
    pub fn sin(&self, degrees: u16) -> Fixed {
        let index = (degrees % 360) as usize;
        self.sin_table[index]
    }

    /// Get cosine value for given angle in degrees
    pub fn cos(&self, degrees: u16) -> Fixed {
        let index = (degrees % 360) as usize;
        self.cos_table[index]
    }

    /// Get angle in degrees for given y and x coordinates using atan2
    pub fn atan2(&self, y: Fixed, x: Fixed) -> u8 {
        // Convert Fixed values to lookup table indices
        // Clamp to -128..127 range and shift to 0..255 for array indexing
        let y_index = ((y.to_int().clamp(-128, 127) + 128) as usize).min(255);
        let x_index = ((x.to_int().clamp(-128, 127) + 128) as usize).min(255);

        self.atan2_table[y_index][x_index]
    }
}

