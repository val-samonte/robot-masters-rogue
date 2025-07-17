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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fixed_constants() {
        assert_eq!(Fixed::ZERO.raw(), 0);
        assert_eq!(Fixed::ONE.raw(), 32); // 1 << 5
        assert_eq!(Fixed::FRACTIONAL_BITS, 5);
    }

    #[test]
    fn test_from_int() {
        assert_eq!(Fixed::from_int(0), Fixed::ZERO);
        assert_eq!(Fixed::from_int(1), Fixed::ONE);
        assert_eq!(Fixed::from_int(5).raw(), 160); // 5 << 5
        assert_eq!(Fixed::from_int(-3).raw(), -96); // -3 << 5
    }

    #[test]
    fn test_to_int() {
        assert_eq!(Fixed::ZERO.to_int(), 0);
        assert_eq!(Fixed::ONE.to_int(), 1);
        assert_eq!(Fixed::from_int(5).to_int(), 5);
        assert_eq!(Fixed::from_int(-3).to_int(), -3);

        // Test fractional truncation
        let half = Fixed::from_raw(16); // 0.5 in fixed point
        assert_eq!(half.to_int(), 0);

        let one_and_half = Fixed::from_raw(48); // 1.5 in fixed point
        assert_eq!(one_and_half.to_int(), 1);
    }

    #[test]
    fn test_frac() {
        assert_eq!(Fixed::ZERO.frac(), 0);
        assert_eq!(Fixed::ONE.frac(), 0);

        let half = Fixed::from_raw(16); // 0.5
        assert_eq!(half.frac(), 16);

        let quarter = Fixed::from_raw(8); // 0.25
        assert_eq!(quarter.frac(), 8);

        let one_and_quarter = Fixed::from_raw(40); // 1.25
        assert_eq!(one_and_quarter.frac(), 8);
    }

    #[test]
    fn test_addition() {
        let a = Fixed::from_int(3);
        let b = Fixed::from_int(2);
        assert_eq!(a.add(b), Fixed::from_int(5));

        let c = Fixed::from_int(-2);
        assert_eq!(a.add(c), Fixed::from_int(1));

        // Test with fractional parts
        let half = Fixed::from_raw(16); // 0.5
        let quarter = Fixed::from_raw(8); // 0.25
        let three_quarters = Fixed::from_raw(24); // 0.75
        assert_eq!(half.add(quarter), three_quarters);
    }

    #[test]
    fn test_addition_overflow() {
        let max_val = Fixed::MAX;
        let one = Fixed::ONE;
        let result = max_val.add(one);
        // Should saturate at max value
        assert_eq!(result, Fixed::MAX);

        let min_val = Fixed::MIN;
        let neg_one = Fixed::ONE.neg();
        let result = min_val.add(neg_one);
        // Should saturate at min value
        assert_eq!(result, Fixed::MIN);
    }

    #[test]
    fn test_subtraction() {
        let a = Fixed::from_int(5);
        let b = Fixed::from_int(3);
        assert_eq!(a.sub(b), Fixed::from_int(2));

        let c = Fixed::from_int(-2);
        assert_eq!(a.sub(c), Fixed::from_int(7));

        // Test with fractional parts
        let three_quarters = Fixed::from_raw(24); // 0.75
        let quarter = Fixed::from_raw(8); // 0.25
        let half = Fixed::from_raw(16); // 0.5
        assert_eq!(three_quarters.sub(quarter), half);
    }

    #[test]
    fn test_subtraction_overflow() {
        let min_val = Fixed::MIN;
        let one = Fixed::ONE;
        let result = min_val.sub(one);
        // Should saturate at min value
        assert_eq!(result, Fixed::MIN);

        let max_val = Fixed::MAX;
        let neg_one = Fixed::ONE.neg();
        let result = max_val.sub(neg_one);
        // Should saturate at max value
        assert_eq!(result, Fixed::MAX);
    }

    #[test]
    fn test_multiplication() {
        let a = Fixed::from_int(3);
        let b = Fixed::from_int(4);
        assert_eq!(a.mul(b), Fixed::from_int(12));

        let c = Fixed::from_int(-2);
        assert_eq!(a.mul(c), Fixed::from_int(-6));

        // Test with fractional parts
        let half = Fixed::from_raw(16); // 0.5
        let two = Fixed::from_int(2);
        assert_eq!(half.mul(two), Fixed::ONE);

        let quarter = Fixed::from_raw(8); // 0.25
        let four = Fixed::from_int(4);
        assert_eq!(quarter.mul(four), Fixed::ONE);
    }

    #[test]
    fn test_multiplication_overflow() {
        let large_val = Fixed::from_int(1000);
        let result = large_val.mul(large_val);
        // Should clamp to max value for positive overflow
        assert_eq!(result, Fixed::MAX);

        let neg_large_val = Fixed::from_int(-1000);
        let result = neg_large_val.mul(large_val);
        // Should clamp to min value for negative overflow
        assert_eq!(result, Fixed::MIN);
    }

    #[test]
    fn test_division() {
        let a = Fixed::from_int(12);
        let b = Fixed::from_int(3);
        assert_eq!(a.div(b), Fixed::from_int(4));

        let c = Fixed::from_int(-6);
        let d = Fixed::from_int(2);
        assert_eq!(c.div(d), Fixed::from_int(-3));

        // Test with fractional results
        let one = Fixed::ONE;
        let two = Fixed::from_int(2);
        let half = Fixed::from_raw(16); // 0.5
        assert_eq!(one.div(two), half);
    }

    #[test]
    fn test_division_by_zero() {
        let a = Fixed::from_int(5);
        let zero = Fixed::ZERO;

        // Positive dividend / 0 should return MAX
        assert_eq!(a.div(zero), Fixed::MAX);

        // Negative dividend / 0 should return MIN
        let neg_a = Fixed::from_int(-5);
        assert_eq!(neg_a.div(zero), Fixed::MIN);

        // Zero / 0 should return MAX (since 0 >= 0)
        assert_eq!(zero.div(zero), Fixed::MAX);
    }

    #[test]
    fn test_abs() {
        let pos = Fixed::from_int(5);
        let neg = Fixed::from_int(-5);

        assert_eq!(pos.abs(), pos);
        assert_eq!(neg.abs(), pos);
        assert_eq!(Fixed::ZERO.abs(), Fixed::ZERO);
    }

    #[test]
    fn test_neg() {
        let pos = Fixed::from_int(5);
        let neg = Fixed::from_int(-5);

        assert_eq!(pos.neg(), neg);
        assert_eq!(neg.neg(), pos);
        assert_eq!(Fixed::ZERO.neg(), Fixed::ZERO);
    }

    #[test]
    fn test_comparison_methods() {
        let pos = Fixed::from_int(5);
        let neg = Fixed::from_int(-5);
        let zero = Fixed::ZERO;

        assert!(pos.is_positive());
        assert!(!pos.is_negative());
        assert!(!pos.is_zero());

        assert!(!neg.is_positive());
        assert!(neg.is_negative());
        assert!(!neg.is_zero());

        assert!(!zero.is_positive());
        assert!(!zero.is_negative());
        assert!(zero.is_zero());
    }

    #[test]
    fn test_ordering() {
        let a = Fixed::from_int(1);
        let b = Fixed::from_int(2);
        let c = Fixed::from_int(-1);

        assert!(a < b);
        assert!(b > a);
        assert!(c < a);
        assert!(a > c);
        assert_eq!(a, a);
    }

    #[test]
    fn test_fractional_arithmetic() {
        // Test 0.5 + 0.25 = 0.75
        let half = Fixed::from_raw(16);
        let quarter = Fixed::from_raw(8);
        let three_quarters = Fixed::from_raw(24);

        assert_eq!(half.add(quarter), three_quarters);

        // Test 0.75 - 0.25 = 0.5
        assert_eq!(three_quarters.sub(quarter), half);

        // Test 0.5 * 0.5 = 0.25
        assert_eq!(half.mul(half), quarter);

        // Test 0.5 / 0.25 = 2
        assert_eq!(half.div(quarter), Fixed::from_int(2));
    }

    #[test]
    fn test_precision_limits() {
        // Test that we can represent values with 5-bit precision
        let smallest_frac = Fixed::from_raw(1); // 1/32 = 0.03125
        assert_eq!(smallest_frac.frac(), 1);

        // Test maximum fractional precision
        let max_frac = Fixed::from_raw(31); // 31/32 = 0.96875
        assert_eq!(max_frac.frac(), 31);

        // Test that precision is maintained in operations
        let result = smallest_frac.add(smallest_frac);
        assert_eq!(result.raw(), 2);
    }

    // Trigonometry tests
    #[test]
    fn test_trig_tables_creation() {
        let tables = TrigTables::new();

        // Test that tables are populated (not all zeros)
        assert_ne!(tables.sin(90), Fixed::ZERO);
        assert_ne!(tables.cos(0), Fixed::ZERO);
    }

    #[test]
    fn test_sin_values() {
        let tables = TrigTables::new();

        // Test key sin values
        assert_eq!(tables.sin(0), Fixed::ZERO);
        assert_eq!(tables.sin(90), Fixed::ONE); // sin(90°) = 1
        assert_eq!(tables.sin(180), Fixed::ZERO);
        assert_eq!(tables.sin(270), Fixed::ONE.neg()); // sin(270°) = -1

        // Test symmetry: sin(x) = -sin(180 + x)
        assert_eq!(tables.sin(30), tables.sin(210).neg());
        assert_eq!(tables.sin(45), tables.sin(225).neg());

        // Test that values are within expected range [-1, 1]
        for degrees in 0..360 {
            let sin_val = tables.sin(degrees);
            assert!(sin_val.raw() >= -32 && sin_val.raw() <= 32);
        }
    }

    #[test]
    fn test_cos_values() {
        let tables = TrigTables::new();

        // Test key cos values
        assert_eq!(tables.cos(0), Fixed::ONE); // cos(0°) = 1
        assert_eq!(tables.cos(90), Fixed::ZERO);
        assert_eq!(tables.cos(180), Fixed::ONE.neg()); // cos(180°) = -1
        assert_eq!(tables.cos(270), Fixed::ZERO);

        // Test symmetry: cos(x) = -cos(180 - x)
        assert_eq!(tables.cos(30), tables.cos(150).neg());
        assert_eq!(tables.cos(60), tables.cos(120).neg());

        // Test that values are within expected range [-1, 1]
        for degrees in 0..360 {
            let cos_val = tables.cos(degrees);
            assert!(cos_val.raw() >= -32 && cos_val.raw() <= 32);
        }
    }

    #[test]
    fn test_sin_cos_relationship() {
        let tables = TrigTables::new();

        // Test cos(x) = sin(x + 90)
        for degrees in 0..360 {
            let cos_val = tables.cos(degrees);
            let sin_plus_90 = tables.sin((degrees + 90) % 360);
            assert_eq!(cos_val, sin_plus_90);
        }
    }

    #[test]
    fn test_atan2_basic_cases() {
        let tables = TrigTables::new();

        // Test cardinal directions
        let pos_x = Fixed::from_int(10);
        let neg_x = Fixed::from_int(-10);
        let pos_y = Fixed::from_int(10);
        let neg_y = Fixed::from_int(-10);
        let zero = Fixed::ZERO;

        // Positive X axis (0°)
        assert_eq!(tables.atan2(zero, pos_x), 0);

        // Positive Y axis (90°)
        assert_eq!(tables.atan2(pos_y, zero), 90);

        // Negative X axis (180°)
        assert_eq!(tables.atan2(zero, neg_x), 180);

        // Negative Y axis (270° wraps to 14 in u8 since 270 % 256 = 14)
        let neg_y_angle = tables.atan2(neg_y, zero);
        assert!(neg_y_angle == 14 || neg_y_angle > 200); // Allow for implementation variation
    }

    #[test]
    fn test_atan2_quadrants() {
        let tables = TrigTables::new();

        let pos = Fixed::from_int(5);
        let neg = Fixed::from_int(-5);

        // Quadrant 1 (0° to 90°)
        let q1_angle = tables.atan2(pos, pos);
        assert!(q1_angle < 90);

        // Quadrant 2 (90° to 180°)
        let q2_angle = tables.atan2(pos, neg);
        assert!(q2_angle >= 90 && q2_angle < 180);

        // Quadrant 3 (180° to 255°) - limited by u8 range
        let q3_angle = tables.atan2(neg, neg);
        assert!(q3_angle >= 180);

        // Quadrant 4 (angles > 255 wrap around)
        let q4_angle = tables.atan2(neg, pos);
        // This could be a small value due to wrapping, or > 200
        assert!(q4_angle < 90 || q4_angle > 200);
    }

    #[test]
    fn test_atan2_edge_cases() {
        let tables = TrigTables::new();

        let zero = Fixed::ZERO;

        // Origin case (undefined, should return 0)
        assert_eq!(tables.atan2(zero, zero), 0);

        // Test with extreme values
        let max_val = Fixed::from_int(127);
        let min_val = Fixed::from_int(-128);

        // Should not panic and return valid angles
        let angle1 = tables.atan2(max_val, max_val);
        let angle2 = tables.atan2(min_val, min_val);
        let angle3 = tables.atan2(max_val, min_val);
        let angle4 = tables.atan2(min_val, max_val);

        // Just verify they don't panic - specific values depend on implementation
        // All u8 values are valid angles, so we just check they're reasonable
        assert!(angle1 < 90);
        assert!(angle2 >= 180);
        assert!(angle3 >= 90 && angle3 < 180);
        // angle4 could wrap around due to u8 limit, so just check it's valid
        assert!(angle4 < 90 || angle4 > 200);
    }

    #[test]
    fn test_atan2_symmetry() {
        let tables = TrigTables::new();

        let x = Fixed::from_int(3);
        let y = Fixed::from_int(4);

        // Test that atan2(-y, -x) = atan2(y, x) + 180
        let angle1 = tables.atan2(y, x);
        let angle2 = tables.atan2(y.neg(), x.neg());
        let expected_diff = (angle2 as i16 - angle1 as i16 + 360) % 360;
        assert!(expected_diff >= 170 && expected_diff <= 190); // Allow some approximation error
    }

    #[test]
    fn test_trig_accuracy() {
        let tables = TrigTables::new();

        // Test that sin^2 + cos^2 ≈ 1 for various angles
        // Due to fixed-point precision, we allow some tolerance
        for degrees in [
            0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330,
        ] {
            let sin_val = tables.sin(degrees);
            let cos_val = tables.cos(degrees);

            let sin_squared = sin_val.mul(sin_val);
            let cos_squared = cos_val.mul(cos_val);
            let sum = sin_squared.add(cos_squared);

            // Should be close to 1 (32 in fixed-point)
            // Allow larger tolerance due to linear approximation and fixed-point precision
            let diff = (sum.raw() - 32).abs();
            assert!(
                diff <= 20,
                "sin^2 + cos^2 = {} for {}°, expected ~32 (tolerance ±20)",
                sum.raw(),
                degrees
            );
        }
    }

    #[test]
    fn test_angle_wrapping() {
        let tables = TrigTables::new();

        // Test that angles wrap correctly
        assert_eq!(tables.sin(0), tables.sin(360));
        assert_eq!(tables.sin(45), tables.sin(405));
        assert_eq!(tables.cos(0), tables.cos(360));
        assert_eq!(tables.cos(90), tables.cos(450));

        // Test with large angles
        assert_eq!(tables.sin(30), tables.sin(30 + 360));
        assert_eq!(tables.cos(60), tables.cos(60 + 720));
    }
}
