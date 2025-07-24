//! Bytecode scripting system for game logic

use crate::constants::{OperatorAddress, PropertyAddress};
use crate::math::Fixed;

extern crate alloc;
use alloc::format;

#[cfg(test)]
use alloc::vec::Vec;

/// Script execution engine with execution context
#[derive(Debug)]
pub struct ScriptEngine {
    /// Current instruction pointer
    pub pos: usize,
    /// Exit flag for script termination
    pub exit_flag: u8,
    /// Byte variables for script execution
    pub vars: [u8; 8],
    /// Fixed-point variables for script execution
    pub fixed: [Fixed; 4],
    /// Read-only arguments passed to script (like function parameters)
    pub args: [u8; 8],
    /// Spawn IDs for spawn creation
    pub spawns: [u8; 4],
}

/// Bytecode operators with explicit byte values
///
/// This enum is kept for backward compatibility but uses the values from OperatorAddress.
/// New code should use OperatorAddress directly.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Operator {
    // Control flow
    Exit = OperatorAddress::Exit as u8,
    ExitIfNoEnergy = OperatorAddress::ExitIfNoEnergy as u8,
    ExitIfCooldown = OperatorAddress::ExitIfCooldown as u8,
    Skip = OperatorAddress::Skip as u8,
    Goto = OperatorAddress::Goto as u8,

    // Property operations (scalable approach)
    ReadProp = OperatorAddress::ReadProp as u8, // [ReadProp, var_index, prop_address]
    WriteProp = OperatorAddress::WriteProp as u8, // [WriteProp, prop_address, var_index]

    // Variable operations
    AssignByte = OperatorAddress::AssignByte as u8, // [AssignByte, var_index, literal_value]
    AssignFixed = OperatorAddress::AssignFixed as u8, // [AssignFixed, var_index, numerator, denominator]
    AssignRandom = OperatorAddress::AssignRandom as u8, // [AssignRandom, var_index]
    ToByte = OperatorAddress::ToByte as u8,           // [ToByte, to_var_index, from_fixed_index]
    ToFixed = OperatorAddress::ToFixed as u8,         // [ToFixed, to_fixed_index, from_var_index]

    // Arithmetic (Fixed-point) - generic 3-operand pattern
    Add = OperatorAddress::Add as u8, // [Add, dest_fixed, left_fixed, right_fixed]
    Sub = OperatorAddress::Sub as u8, // [Sub, dest_fixed, left_fixed, right_fixed]
    Mul = OperatorAddress::Mul as u8, // [Mul, dest_fixed, left_fixed, right_fixed]
    Div = OperatorAddress::Div as u8, // [Div, dest_fixed, left_fixed, right_fixed]
    Negate = OperatorAddress::Negate as u8, // [Negate, fixed_index]

    // Arithmetic (Byte) - generic 3-operand pattern
    AddByte = OperatorAddress::AddByte as u8, // [AddByte, dest_var, left_var, right_var]
    SubByte = OperatorAddress::SubByte as u8, // [SubByte, dest_var, left_var, right_var]
    MulByte = OperatorAddress::MulByte as u8, // [MulByte, dest_var, left_var, right_var]
    DivByte = OperatorAddress::DivByte as u8, // [DivByte, dest_var, left_var, right_var]
    ModByte = OperatorAddress::ModByte as u8, // [ModByte, dest_var, left_var, right_var]
    WrappingAdd = OperatorAddress::WrappingAdd as u8, // [WrappingAdd, dest_var, left_var, right_var]

    // Conditionals - generic 3-operand pattern
    Equal = OperatorAddress::Equal as u8, // [Equal, dest_var, left_var, right_var]
    NotEqual = OperatorAddress::NotEqual as u8, // [NotEqual, dest_var, left_var, right_var]
    LessThan = OperatorAddress::LessThan as u8, // [LessThan, dest_var, left_var, right_var]
    LessThanOrEqual = OperatorAddress::LessThanOrEqual as u8, // [LessThanOrEqual, dest_var, left_var, right_var]

    // Logical operations - generic patterns
    Not = OperatorAddress::Not as u8, // [Not, dest_var, source_var]
    Or = OperatorAddress::Or as u8,   // [Or, dest_var, left_var, right_var]
    And = OperatorAddress::And as u8, // [And, dest_var, left_var, right_var]

    // Utility operations
    Min = OperatorAddress::Min as u8, // [Min, dest_var, left_var, right_var]
    Max = OperatorAddress::Max as u8, // [Max, dest_var, left_var, right_var]

    // Game actions
    LockAction = OperatorAddress::LockAction as u8,
    UnlockAction = OperatorAddress::UnlockAction as u8,
    ApplyEnergyCost = OperatorAddress::ApplyEnergyCost as u8,
    ApplyDuration = OperatorAddress::ApplyDuration as u8,
    Spawn = OperatorAddress::Spawn as u8, // [Spawn, spawn_id_var]
    SpawnWithVars = OperatorAddress::SpawnWithVars as u8, // [SpawnWithVars, spawn_id_var, var1, var2, var3, var4]

    // Debug
    LogVariable = OperatorAddress::LogVariable as u8, // [LogVariable, var_index]

    // Conditional exit
    ExitWithVar = OperatorAddress::ExitWithVar as u8, // [ExitWithVar, var_index] - Exit with value from variable

    // Cooldown operators
    ReadActionCooldown = OperatorAddress::ReadActionCooldown as u8, // [ReadActionCooldown, var_index] - Read Action cooldown into vars
    ReadActionLastUsed = OperatorAddress::ReadActionLastUsed as u8, // [ReadActionLastUsed, var_index] - Read when action was last used
    WriteActionLastUsed = OperatorAddress::WriteActionLastUsed as u8, // [WriteActionLastUsed, var_index] - Update last used timestamp
    IsActionOnCooldown = OperatorAddress::IsActionOnCooldown as u8, // [IsActionOnCooldown, var_index] - Check if action is on cooldown

    // Args and Spawns access (read-only)
    ReadArg = 96,    // [ReadArg, var_index, arg_index] - Copy arg to var
    ReadSpawn = 97,  // [ReadSpawn, var_index, spawn_index] - Copy spawn ID to var
    WriteSpawn = 98, // [WriteSpawn, spawn_index, var_index] - Copy var to spawn ID
}

impl Operator {
    /// Simple byte-to-enum conversion
    ///
    /// This method now uses OperatorAddress for conversion to maintain consistency
    pub fn from_u8(byte: u8) -> Option<Operator> {
        // Use OperatorAddress for conversion to maintain consistency
        if let Some(address_byte) = OperatorAddress::from_u8(byte) {
            // Map OperatorAddress to Operator
            match address_byte {
                OperatorAddress::Exit => Some(Operator::Exit),
                OperatorAddress::ExitIfNoEnergy => Some(Operator::ExitIfNoEnergy),
                OperatorAddress::ExitIfCooldown => Some(Operator::ExitIfCooldown),
                OperatorAddress::Skip => Some(Operator::Skip),
                OperatorAddress::Goto => Some(Operator::Goto),
                OperatorAddress::ReadProp => Some(Operator::ReadProp),
                OperatorAddress::WriteProp => Some(Operator::WriteProp),
                OperatorAddress::AssignByte => Some(Operator::AssignByte),
                OperatorAddress::AssignFixed => Some(Operator::AssignFixed),
                OperatorAddress::AssignRandom => Some(Operator::AssignRandom),
                OperatorAddress::ToByte => Some(Operator::ToByte),
                OperatorAddress::ToFixed => Some(Operator::ToFixed),
                OperatorAddress::Add => Some(Operator::Add),
                OperatorAddress::Sub => Some(Operator::Sub),
                OperatorAddress::Mul => Some(Operator::Mul),
                OperatorAddress::Div => Some(Operator::Div),
                OperatorAddress::Negate => Some(Operator::Negate),
                OperatorAddress::AddByte => Some(Operator::AddByte),
                OperatorAddress::SubByte => Some(Operator::SubByte),
                OperatorAddress::MulByte => Some(Operator::MulByte),
                OperatorAddress::DivByte => Some(Operator::DivByte),
                OperatorAddress::ModByte => Some(Operator::ModByte),
                OperatorAddress::WrappingAdd => Some(Operator::WrappingAdd),
                OperatorAddress::Equal => Some(Operator::Equal),
                OperatorAddress::NotEqual => Some(Operator::NotEqual),
                OperatorAddress::LessThan => Some(Operator::LessThan),
                OperatorAddress::LessThanOrEqual => Some(Operator::LessThanOrEqual),
                OperatorAddress::Not => Some(Operator::Not),
                OperatorAddress::Or => Some(Operator::Or),
                OperatorAddress::And => Some(Operator::And),
                OperatorAddress::Min => Some(Operator::Min),
                OperatorAddress::Max => Some(Operator::Max),
                OperatorAddress::LockAction => Some(Operator::LockAction),
                OperatorAddress::UnlockAction => Some(Operator::UnlockAction),
                OperatorAddress::ApplyEnergyCost => Some(Operator::ApplyEnergyCost),
                OperatorAddress::ApplyDuration => Some(Operator::ApplyDuration),
                OperatorAddress::Spawn => Some(Operator::Spawn),
                OperatorAddress::SpawnWithVars => Some(Operator::SpawnWithVars),
                OperatorAddress::LogVariable => Some(Operator::LogVariable),
                OperatorAddress::ExitWithVar => Some(Operator::ExitWithVar),
                OperatorAddress::ReadActionCooldown => Some(Operator::ReadActionCooldown),
                OperatorAddress::ReadActionLastUsed => Some(Operator::ReadActionLastUsed),
                OperatorAddress::WriteActionLastUsed => Some(Operator::WriteActionLastUsed),
                OperatorAddress::IsActionOnCooldown => Some(Operator::IsActionOnCooldown),
                OperatorAddress::ReadArg => Some(Operator::ReadArg),
                OperatorAddress::ReadSpawn => Some(Operator::ReadSpawn),
                OperatorAddress::WriteSpawn => Some(Operator::WriteSpawn),
            }
        } else {
            None
        }
    }
}

impl ScriptEngine {
    pub fn new() -> Self {
        Self {
            pos: 0,
            exit_flag: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
        }
    }

    /// Create a new script engine with arguments
    pub fn new_with_args(args: [u8; 8]) -> Self {
        Self {
            pos: 0,
            exit_flag: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args,
            spawns: [0; 4],
        }
    }

    /// Reset the script engine state for reuse
    pub fn reset(&mut self) {
        self.pos = 0;
        self.exit_flag = 0;
        self.vars = [0; 8];
        self.fixed = [Fixed::ZERO; 4];
        // Note: args and spawns are NOT reset - they persist across script executions
    }

    /// Reset the script engine state with new arguments
    pub fn reset_with_args(&mut self, args: [u8; 8]) {
        self.pos = 0;
        self.exit_flag = 0;
        self.vars = [0; 8];
        self.fixed = [Fixed::ZERO; 4];
        self.args = args;
        self.spawns = [0; 4];
    }

    /// Read a u8 value from the script at current position and advance
    pub fn read_u8(&mut self, script: &[u8]) -> Result<u8, ScriptError> {
        if self.pos >= script.len() {
            return Err(ScriptError::InvalidScript);
        }
        let value = script[self.pos];
        self.pos += 1;
        Ok(value)
    }

    /// Execute a single instruction
    pub fn execute_instruction<T: ScriptContext>(
        &mut self,
        script: &[u8],
        context: &mut T,
    ) -> Result<(), ScriptError> {
        if self.pos >= script.len() {
            return Ok(());
        }

        let op_byte = self.read_u8(script)?;
        let op = Operator::from_u8(op_byte).ok_or(ScriptError::InvalidOperator)?;

        match op {
            // Control flow operations
            Operator::Exit => {
                self.exit_flag = self.read_u8(script)?;
                self.pos = script.len();
            }

            Operator::ExitIfNoEnergy => {
                let exit_flag = self.read_u8(script)?;
                let energy_req = context.get_energy_requirement();
                if context.get_current_energy() < energy_req {
                    self.exit_flag = exit_flag;
                    self.pos = script.len();
                }
            }

            Operator::ExitIfCooldown => {
                let exit_flag = self.read_u8(script)?;
                if context.is_on_cooldown() {
                    self.exit_flag = exit_flag;
                    self.pos = script.len();
                }
            }

            Operator::Skip => {
                let skip_count = self.read_u8(script)? as usize;
                self.pos += skip_count;
            }

            Operator::Goto => {
                let target = self.read_u8(script)? as usize;
                if target >= script.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.pos = target;
            }

            // Property operations - easily extensible
            Operator::ReadProp => {
                let var_index = self.read_u8(script)? as usize;
                let prop_address = self.read_u8(script)?;
                if var_index >= self.vars.len() + self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.read_property(self, var_index, prop_address);
            }

            Operator::WriteProp => {
                let prop_address = self.read_u8(script)?;
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() + self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.write_property(self, prop_address, var_index);
            }

            // Variable assignment operations
            Operator::AssignByte => {
                let var_index = self.read_u8(script)? as usize;
                let literal = self.read_u8(script)?;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::IndexOutOfBounds);
                }
                self.vars[var_index] = literal;
            }

            Operator::AssignFixed => {
                let var_index = self.read_u8(script)? as usize;
                let numerator = self.read_u8(script)? as i32;
                let denominator = self.read_u8(script)? as i32;
                if var_index >= self.fixed.len() {
                    return Err(ScriptError::IndexOutOfBounds);
                }
                if denominator == 0 {
                    self.fixed[var_index] = Fixed::from_int(numerator as i16);
                } else {
                    self.fixed[var_index] =
                        Fixed::from_int(numerator as i16).div(Fixed::from_int(denominator as i16));
                }
            }

            Operator::AssignRandom => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::IndexOutOfBounds);
                }
                self.vars[var_index] = context.get_random_u8();
            }

            Operator::ToByte => {
                let to_var_index = self.read_u8(script)? as usize;
                let from_fixed_index = self.read_u8(script)? as usize;
                if to_var_index >= self.vars.len() || from_fixed_index >= self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[to_var_index] = self.fixed[from_fixed_index].to_int() as u8;
            }

            Operator::ToFixed => {
                let to_fixed_index = self.read_u8(script)? as usize;
                let from_var_index = self.read_u8(script)? as usize;
                if to_fixed_index >= self.fixed.len() || from_var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.fixed[to_fixed_index] = Fixed::from_int(self.vars[from_var_index] as i16);
            }

            // Generic 3-operand fixed-point arithmetic
            Operator::Add | Operator::Sub | Operator::Mul | Operator::Div => {
                self.execute_fixed_arithmetic(script, op)?;
            }

            Operator::Negate => {
                let fixed_index = self.read_u8(script)? as usize;
                if fixed_index >= self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.fixed[fixed_index] = self.fixed[fixed_index].neg();
            }

            // Generic 3-operand byte arithmetic
            Operator::AddByte
            | Operator::SubByte
            | Operator::MulByte
            | Operator::DivByte
            | Operator::ModByte
            | Operator::WrappingAdd => {
                self.execute_byte_arithmetic(script, op)?;
            }

            // Generic 3-operand conditional operations
            Operator::Equal
            | Operator::NotEqual
            | Operator::LessThan
            | Operator::LessThanOrEqual => {
                self.execute_conditional(script, op)?;
            }

            // Generic logical operations
            Operator::Or | Operator::And => {
                self.execute_logical_binary(script, op)?;
            }

            Operator::Not => {
                let dest_index = self.read_u8(script)? as usize;
                let source_index = self.read_u8(script)? as usize;
                if dest_index >= self.vars.len() || source_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[dest_index] = if self.vars[source_index] == 0 { 1 } else { 0 };
            }

            // Generic utility operations
            Operator::Min | Operator::Max => {
                self.execute_utility_binary(script, op)?;
            }

            // Game-specific operations
            Operator::LockAction => {
                context.lock_action();
            }

            Operator::UnlockAction => {
                context.unlock_action();
            }

            Operator::ApplyEnergyCost => {
                context.apply_energy_cost();
            }

            Operator::ApplyDuration => {
                context.apply_duration();
            }

            Operator::Spawn => {
                let spawn_id = self.vars[self.read_u8(script)? as usize] as usize;
                context.create_spawn(spawn_id, None);
            }

            Operator::SpawnWithVars => {
                let spawn_id = self.vars[self.read_u8(script)? as usize] as usize;
                let vars = [
                    self.vars[self.read_u8(script)? as usize],
                    self.vars[self.read_u8(script)? as usize],
                    self.vars[self.read_u8(script)? as usize],
                    self.vars[self.read_u8(script)? as usize],
                ];
                context.create_spawn(spawn_id, Some(vars));
            }

            Operator::LogVariable => {
                let var_index = self.read_u8(script)? as usize;
                if var_index < self.vars.len() {
                    context.log_debug(&format!("var[{}] = {}", var_index, self.vars[var_index]));
                } else if var_index < self.vars.len() + self.fixed.len() {
                    let fixed_index = var_index - self.vars.len();
                    context.log_debug(&format!(
                        "fixed[{}] = {:?}",
                        fixed_index, self.fixed[fixed_index]
                    ));
                }
            }

            Operator::ExitWithVar => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.exit_flag = self.vars[var_index];
                self.pos = script.len();
            }

            // Cooldown operators
            Operator::ReadActionCooldown => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                // This will be handled by context-specific implementations
                context.read_action_cooldown(self, var_index);
            }

            Operator::ReadActionLastUsed => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.read_action_last_used(self, var_index);
            }

            Operator::WriteActionLastUsed => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.write_action_last_used(self, var_index);
            }

            Operator::IsActionOnCooldown => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[var_index] = if context.is_on_cooldown() { 1 } else { 0 };
            }

            // Args and Spawns access operations
            Operator::ReadArg => {
                let var_index = self.read_u8(script)? as usize;
                let arg_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() || arg_index >= self.args.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[var_index] = self.args[arg_index];
            }

            Operator::ReadSpawn => {
                let var_index = self.read_u8(script)? as usize;
                let spawn_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() || spawn_index >= self.spawns.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[var_index] = self.spawns[spawn_index];
            }

            Operator::WriteSpawn => {
                let spawn_index = self.read_u8(script)? as usize;
                let var_index = self.read_u8(script)? as usize;
                if spawn_index >= self.spawns.len() || var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.spawns[spawn_index] = self.vars[var_index];
            }
        }

        Ok(())
    }

    /// Execute a complete script
    pub fn execute<T: ScriptContext>(
        &mut self,
        script: &[u8],
        context: &mut T,
    ) -> Result<u8, ScriptError> {
        self.reset();

        while self.pos < script.len() && self.exit_flag == 0 {
            self.execute_instruction(script, context)?;
        }

        Ok(self.exit_flag)
    }

    // Generic arithmetic operation handlers
    fn execute_fixed_arithmetic(&mut self, script: &[u8], op: Operator) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.fixed.len() || left >= self.fixed.len() || right >= self.fixed.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.fixed[dest] = match op {
            Operator::Add => self.fixed[left].add(self.fixed[right]),
            Operator::Sub => self.fixed[left].sub(self.fixed[right]),
            Operator::Mul => self.fixed[left].mul(self.fixed[right]),
            Operator::Div => self.fixed[left].div(self.fixed[right]),
            _ => unreachable!(),
        };

        Ok(())
    }

    fn execute_byte_arithmetic(&mut self, script: &[u8], op: Operator) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            Operator::AddByte => self.vars[left].saturating_add(self.vars[right]),
            Operator::SubByte => self.vars[left].saturating_sub(self.vars[right]),
            Operator::MulByte => self.vars[left].saturating_mul(self.vars[right]),
            Operator::DivByte => {
                if self.vars[right] == 0 {
                    u8::MAX
                } else {
                    self.vars[left] / self.vars[right]
                }
            }
            Operator::ModByte => {
                if self.vars[right] == 0 {
                    0
                } else {
                    self.vars[left] % self.vars[right]
                }
            }
            Operator::WrappingAdd => self.vars[left].wrapping_add(self.vars[right]),
            _ => unreachable!(),
        };

        Ok(())
    }

    fn execute_conditional(&mut self, script: &[u8], op: Operator) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            Operator::Equal => {
                if self.vars[left] == self.vars[right] {
                    1
                } else {
                    0
                }
            }
            Operator::NotEqual => {
                if self.vars[left] != self.vars[right] {
                    1
                } else {
                    0
                }
            }
            Operator::LessThan => {
                if self.vars[left] < self.vars[right] {
                    1
                } else {
                    0
                }
            }
            Operator::LessThanOrEqual => {
                if self.vars[left] <= self.vars[right] {
                    1
                } else {
                    0
                }
            }
            _ => unreachable!(),
        };

        Ok(())
    }

    fn execute_logical_binary(&mut self, script: &[u8], op: Operator) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            Operator::Or => {
                if self.vars[left] != 0 || self.vars[right] != 0 {
                    1
                } else {
                    0
                }
            }
            Operator::And => {
                if self.vars[left] != 0 && self.vars[right] != 0 {
                    1
                } else {
                    0
                }
            }
            _ => unreachable!(),
        };

        Ok(())
    }

    fn execute_utility_binary(&mut self, script: &[u8], op: Operator) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            Operator::Min => self.vars[left].min(self.vars[right]),
            Operator::Max => self.vars[left].max(self.vars[right]),
            _ => unreachable!(),
        };

        Ok(())
    }
}

/// Context trait for script execution with definition and instance property support
pub trait ScriptContext {
    /// Read a property value into a variable
    fn read_property(&mut self, engine: &mut ScriptEngine, var_index: usize, prop_address: u8);
    /// Write a variable value to a property
    fn write_property(&mut self, engine: &mut ScriptEngine, prop_address: u8, var_index: usize);
    /// Get current energy requirement
    fn get_energy_requirement(&self) -> u8;
    /// Get current energy
    fn get_current_energy(&self) -> u8;
    /// Check if on cooldown
    fn is_on_cooldown(&self) -> bool;
    /// Get random u8 value
    fn get_random_u8(&mut self) -> u8;
    /// Lock action
    fn lock_action(&mut self);
    /// Unlock action
    fn unlock_action(&mut self);
    /// Apply energy cost
    fn apply_energy_cost(&mut self);
    /// Apply duration
    fn apply_duration(&mut self);
    /// Create spawn
    fn create_spawn(&mut self, spawn_id: usize, vars: Option<[u8; 4]>);
    /// Log debug message
    fn log_debug(&self, message: &str);
    /// Read action cooldown value
    fn read_action_cooldown(&self, engine: &mut ScriptEngine, var_index: usize);
    /// Read action last used timestamp
    fn read_action_last_used(&self, engine: &mut ScriptEngine, var_index: usize);
    /// Write action last used timestamp
    fn write_action_last_used(&mut self, engine: &mut ScriptEngine, var_index: usize);
}

/// Extended context trait for definition and instance property access
pub trait DefinitionInstanceContext: ScriptContext {
    /// Get action definition by ID
    fn get_action_definition(&self, action_id: usize) -> Option<&crate::entity::ActionDefinition>;
    /// Get condition definition by ID
    fn get_condition_definition(
        &self,
        condition_id: usize,
    ) -> Option<&crate::entity::ConditionDefinition>;
    /// Get action instance by ID
    fn get_action_instance(&self, instance_id: usize) -> Option<&crate::entity::ActionInstance>;
    /// Get mutable action instance by ID
    fn get_action_instance_mut(
        &mut self,
        instance_id: usize,
    ) -> Option<&mut crate::entity::ActionInstance>;
    /// Get condition instance by ID
    fn get_condition_instance(
        &self,
        instance_id: usize,
    ) -> Option<&crate::entity::ConditionInstance>;
    /// Get mutable condition instance by ID
    fn get_condition_instance_mut(
        &mut self,
        instance_id: usize,
    ) -> Option<&mut crate::entity::ConditionInstance>;
    /// Get current action definition ID being executed
    fn get_current_action_definition_id(&self) -> Option<usize>;
    /// Get current condition definition ID being evaluated
    fn get_current_condition_definition_id(&self) -> Option<usize>;
    /// Get current action instance ID being executed
    fn get_current_action_instance_id(&self) -> Option<usize>;
    /// Get current condition instance ID being evaluated
    fn get_current_condition_instance_id(&self) -> Option<usize>;
}

/// Script execution errors
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ScriptError {
    InvalidScript,
    InvalidOperator,
    TypeMismatch,
    IndexOutOfBounds,
    ArithmeticError,
}

impl Default for ScriptEngine {
    fn default() -> Self {
        Self::new()
    }
}

/// Helper functions for property access with definition/instance distinction
impl ScriptEngine {
    /// Read a property value using the new PropertyAddress system
    pub fn read_property_typed<T: DefinitionInstanceContext>(
        &mut self,
        context: &mut T,
        var_index: usize,
        prop_address: u8,
    ) {
        if let Some(property) = PropertyAddress::from_u8(prop_address) {
            if property.is_definition_property() {
                self.read_definition_property(context, var_index, property);
            } else if property.is_instance_property() {
                self.read_instance_property(context, var_index, property);
            } else if property.is_character_property() {
                // Delegate to the existing read_property method for character properties
                context.read_property(self, var_index, prop_address);
            } else {
                // Handle other property types (game state, spawn, etc.)
                context.read_property(self, var_index, prop_address);
            }
        } else {
            // Unknown property address - delegate to existing method
            context.read_property(self, var_index, prop_address);
        }
    }

    /// Write a property value using the new PropertyAddress system
    pub fn write_property_typed<T: DefinitionInstanceContext>(
        &mut self,
        context: &mut T,
        prop_address: u8,
        var_index: usize,
    ) {
        if let Some(property) = PropertyAddress::from_u8(prop_address) {
            if property.is_instance_property() {
                self.write_instance_property(context, property, var_index);
            } else {
                // Definition properties are read-only, delegate to existing method for other properties
                context.write_property(self, prop_address, var_index);
            }
        } else {
            // Unknown property address - delegate to existing method
            context.write_property(self, prop_address, var_index);
        }
    }

    /// Read a definition property (static, shared data)
    fn read_definition_property<T: DefinitionInstanceContext>(
        &mut self,
        context: &mut T,
        var_index: usize,
        property: PropertyAddress,
    ) {
        match property {
            // Action definition properties
            PropertyAddress::ActionDefEnergyCost => {
                if let Some(action_id) = context.get_current_action_definition_id() {
                    if let Some(def) = context.get_action_definition(action_id) {
                        if var_index < self.vars.len() {
                            self.vars[var_index] = def.energy_cost;
                        }
                    }
                }
            }
            PropertyAddress::ActionDefInterval => {
                if let Some(action_id) = context.get_current_action_definition_id() {
                    if let Some(def) = context.get_action_definition(action_id) {
                        if var_index < self.fixed.len() {
                            self.fixed[var_index] = Fixed::from_int(def.interval as i16);
                        }
                    }
                }
            }
            PropertyAddress::ActionDefDuration => {
                if let Some(action_id) = context.get_current_action_definition_id() {
                    if let Some(def) = context.get_action_definition(action_id) {
                        if var_index < self.fixed.len() {
                            self.fixed[var_index] = Fixed::from_int(def.duration as i16);
                        }
                    }
                }
            }
            PropertyAddress::ActionDefCooldown => {
                if let Some(action_id) = context.get_current_action_definition_id() {
                    if let Some(def) = context.get_action_definition(action_id) {
                        if var_index < self.fixed.len() {
                            self.fixed[var_index] = Fixed::from_int(def.cooldown as i16);
                        }
                    }
                }
            }
            PropertyAddress::ActionDefArg0
            | PropertyAddress::ActionDefArg1
            | PropertyAddress::ActionDefArg2
            | PropertyAddress::ActionDefArg3
            | PropertyAddress::ActionDefArg4
            | PropertyAddress::ActionDefArg5
            | PropertyAddress::ActionDefArg6
            | PropertyAddress::ActionDefArg7 => {
                if let Some(action_id) = context.get_current_action_definition_id() {
                    if let Some(def) = context.get_action_definition(action_id) {
                        let arg_index = match property {
                            PropertyAddress::ActionDefArg0 => 0,
                            PropertyAddress::ActionDefArg1 => 1,
                            PropertyAddress::ActionDefArg2 => 2,
                            PropertyAddress::ActionDefArg3 => 3,
                            PropertyAddress::ActionDefArg4 => 4,
                            PropertyAddress::ActionDefArg5 => 5,
                            PropertyAddress::ActionDefArg6 => 6,
                            PropertyAddress::ActionDefArg7 => 7,
                            _ => return,
                        };
                        if var_index < self.vars.len() && arg_index < def.args.len() {
                            self.vars[var_index] = def.args[arg_index];
                        }
                    }
                }
            }

            // Condition definition properties
            PropertyAddress::ConditionDefEnergyMul => {
                if let Some(condition_id) = context.get_current_condition_definition_id() {
                    if let Some(def) = context.get_condition_definition(condition_id) {
                        if var_index < self.fixed.len() {
                            self.fixed[var_index] = def.energy_mul;
                        }
                    }
                }
            }
            PropertyAddress::ConditionDefArg0
            | PropertyAddress::ConditionDefArg1
            | PropertyAddress::ConditionDefArg2
            | PropertyAddress::ConditionDefArg3
            | PropertyAddress::ConditionDefArg4
            | PropertyAddress::ConditionDefArg5
            | PropertyAddress::ConditionDefArg6
            | PropertyAddress::ConditionDefArg7 => {
                if let Some(condition_id) = context.get_current_condition_definition_id() {
                    if let Some(def) = context.get_condition_definition(condition_id) {
                        // Handle the non-contiguous condition arg addresses
                        let arg_index = match property {
                            PropertyAddress::ConditionDefArg0 => 0,
                            PropertyAddress::ConditionDefArg1 => 1,
                            PropertyAddress::ConditionDefArg2 => 2,
                            PropertyAddress::ConditionDefArg3 => 3,
                            PropertyAddress::ConditionDefArg4 => 4,
                            PropertyAddress::ConditionDefArg5 => 5,
                            PropertyAddress::ConditionDefArg6 => 6,
                            PropertyAddress::ConditionDefArg7 => 7,
                            _ => return,
                        };
                        if var_index < self.vars.len() && arg_index < def.args.len() {
                            self.vars[var_index] = def.args[arg_index];
                        }
                    }
                }
            }
            _ => {} // Other definition properties not implemented yet
        }
    }

    /// Read an instance property (runtime, per-instance data)
    fn read_instance_property<T: DefinitionInstanceContext>(
        &mut self,
        context: &mut T,
        var_index: usize,
        property: PropertyAddress,
    ) {
        match property {
            // Action instance properties
            PropertyAddress::ActionInstVar0
            | PropertyAddress::ActionInstVar1
            | PropertyAddress::ActionInstVar2
            | PropertyAddress::ActionInstVar3
            | PropertyAddress::ActionInstVar4
            | PropertyAddress::ActionInstVar5
            | PropertyAddress::ActionInstVar6
            | PropertyAddress::ActionInstVar7 => {
                if let Some(instance_id) = context.get_current_action_instance_id() {
                    if let Some(instance) = context.get_action_instance(instance_id) {
                        let var_idx = match property {
                            PropertyAddress::ActionInstVar0 => 0,
                            PropertyAddress::ActionInstVar1 => 1,
                            PropertyAddress::ActionInstVar2 => 2,
                            PropertyAddress::ActionInstVar3 => 3,
                            PropertyAddress::ActionInstVar4 => 4,
                            PropertyAddress::ActionInstVar5 => 5,
                            PropertyAddress::ActionInstVar6 => 6,
                            PropertyAddress::ActionInstVar7 => 7,
                            _ => return,
                        };
                        if var_index < self.vars.len() && var_idx < instance.runtime_vars.len() {
                            self.vars[var_index] = instance.runtime_vars[var_idx];
                        }
                    }
                }
            }
            PropertyAddress::ActionInstFixed0
            | PropertyAddress::ActionInstFixed1
            | PropertyAddress::ActionInstFixed2
            | PropertyAddress::ActionInstFixed3 => {
                if let Some(instance_id) = context.get_current_action_instance_id() {
                    if let Some(instance) = context.get_action_instance(instance_id) {
                        let fixed_idx = match property {
                            PropertyAddress::ActionInstFixed0 => 0,
                            PropertyAddress::ActionInstFixed1 => 1,
                            PropertyAddress::ActionInstFixed2 => 2,
                            PropertyAddress::ActionInstFixed3 => 3,
                            _ => return,
                        };
                        if var_index < self.fixed.len() && fixed_idx < instance.runtime_fixed.len()
                        {
                            self.fixed[var_index] = instance.runtime_fixed[fixed_idx];
                        }
                    }
                }
            }
            PropertyAddress::ActionInstRemainingDuration => {
                if let Some(instance_id) = context.get_current_action_instance_id() {
                    if let Some(instance) = context.get_action_instance(instance_id) {
                        if var_index < self.fixed.len() {
                            self.fixed[var_index] =
                                Fixed::from_int(instance.remaining_duration as i16);
                        }
                    }
                }
            }
            PropertyAddress::ActionInstLastUsedFrame => {
                if let Some(instance_id) = context.get_current_action_instance_id() {
                    if let Some(instance) = context.get_action_instance(instance_id) {
                        if var_index < self.fixed.len() {
                            self.fixed[var_index] =
                                Fixed::from_int(instance.last_used_frame as i16);
                        }
                    }
                }
            }

            // Condition instance properties
            PropertyAddress::ConditionInstVar0
            | PropertyAddress::ConditionInstVar1
            | PropertyAddress::ConditionInstVar2
            | PropertyAddress::ConditionInstVar3
            | PropertyAddress::ConditionInstVar4
            | PropertyAddress::ConditionInstVar5
            | PropertyAddress::ConditionInstVar6
            | PropertyAddress::ConditionInstVar7 => {
                if let Some(instance_id) = context.get_current_condition_instance_id() {
                    if let Some(instance) = context.get_condition_instance(instance_id) {
                        let var_idx = match property {
                            PropertyAddress::ConditionInstVar0 => 0,
                            PropertyAddress::ConditionInstVar1 => 1,
                            PropertyAddress::ConditionInstVar2 => 2,
                            PropertyAddress::ConditionInstVar3 => 3,
                            PropertyAddress::ConditionInstVar4 => 4,
                            PropertyAddress::ConditionInstVar5 => 5,
                            PropertyAddress::ConditionInstVar6 => 6,
                            PropertyAddress::ConditionInstVar7 => 7,
                            _ => return,
                        };
                        if var_index < self.vars.len() && var_idx < instance.runtime_vars.len() {
                            self.vars[var_index] = instance.runtime_vars[var_idx];
                        }
                    }
                }
            }
            PropertyAddress::ConditionInstFixed0
            | PropertyAddress::ConditionInstFixed1
            | PropertyAddress::ConditionInstFixed2
            | PropertyAddress::ConditionInstFixed3 => {
                if let Some(instance_id) = context.get_current_condition_instance_id() {
                    if let Some(instance) = context.get_condition_instance(instance_id) {
                        let fixed_idx = match property {
                            PropertyAddress::ConditionInstFixed0 => 0,
                            PropertyAddress::ConditionInstFixed1 => 1,
                            PropertyAddress::ConditionInstFixed2 => 2,
                            PropertyAddress::ConditionInstFixed3 => 3,
                            _ => return,
                        };
                        if var_index < self.fixed.len() && fixed_idx < instance.runtime_fixed.len()
                        {
                            self.fixed[var_index] = instance.runtime_fixed[fixed_idx];
                        }
                    }
                }
            }
            _ => {} // Other instance properties not implemented yet
        }
    }

    /// Write an instance property (runtime, per-instance data)
    fn write_instance_property<T: DefinitionInstanceContext>(
        &mut self,
        context: &mut T,
        property: PropertyAddress,
        var_index: usize,
    ) {
        match property {
            // Action instance properties
            PropertyAddress::ActionInstVar0
            | PropertyAddress::ActionInstVar1
            | PropertyAddress::ActionInstVar2
            | PropertyAddress::ActionInstVar3
            | PropertyAddress::ActionInstVar4
            | PropertyAddress::ActionInstVar5
            | PropertyAddress::ActionInstVar6
            | PropertyAddress::ActionInstVar7 => {
                if let Some(instance_id) = context.get_current_action_instance_id() {
                    if let Some(instance) = context.get_action_instance_mut(instance_id) {
                        let var_idx = match property {
                            PropertyAddress::ActionInstVar0 => 0,
                            PropertyAddress::ActionInstVar1 => 1,
                            PropertyAddress::ActionInstVar2 => 2,
                            PropertyAddress::ActionInstVar3 => 3,
                            PropertyAddress::ActionInstVar4 => 4,
                            PropertyAddress::ActionInstVar5 => 5,
                            PropertyAddress::ActionInstVar6 => 6,
                            PropertyAddress::ActionInstVar7 => 7,
                            _ => return,
                        };
                        if var_index < self.vars.len() && var_idx < instance.runtime_vars.len() {
                            instance.runtime_vars[var_idx] = self.vars[var_index];
                        }
                    }
                }
            }
            PropertyAddress::ActionInstFixed0
            | PropertyAddress::ActionInstFixed1
            | PropertyAddress::ActionInstFixed2
            | PropertyAddress::ActionInstFixed3 => {
                if let Some(instance_id) = context.get_current_action_instance_id() {
                    if let Some(instance) = context.get_action_instance_mut(instance_id) {
                        let fixed_idx = match property {
                            PropertyAddress::ActionInstFixed0 => 0,
                            PropertyAddress::ActionInstFixed1 => 1,
                            PropertyAddress::ActionInstFixed2 => 2,
                            PropertyAddress::ActionInstFixed3 => 3,
                            _ => return,
                        };
                        if var_index < self.fixed.len() && fixed_idx < instance.runtime_fixed.len()
                        {
                            instance.runtime_fixed[fixed_idx] = self.fixed[var_index];
                        }
                    }
                }
            }
            PropertyAddress::ActionInstRemainingDuration => {
                if let Some(instance_id) = context.get_current_action_instance_id() {
                    if let Some(instance) = context.get_action_instance_mut(instance_id) {
                        if var_index < self.fixed.len() {
                            instance.remaining_duration = self.fixed[var_index].to_int() as u16;
                        }
                    }
                }
            }
            PropertyAddress::ActionInstLastUsedFrame => {
                if let Some(instance_id) = context.get_current_action_instance_id() {
                    if let Some(instance) = context.get_action_instance_mut(instance_id) {
                        if var_index < self.fixed.len() {
                            instance.last_used_frame = self.fixed[var_index].to_int() as u16;
                        }
                    }
                }
            }

            // Condition instance properties
            PropertyAddress::ConditionInstVar0
            | PropertyAddress::ConditionInstVar1
            | PropertyAddress::ConditionInstVar2
            | PropertyAddress::ConditionInstVar3
            | PropertyAddress::ConditionInstVar4
            | PropertyAddress::ConditionInstVar5
            | PropertyAddress::ConditionInstVar6
            | PropertyAddress::ConditionInstVar7 => {
                if let Some(instance_id) = context.get_current_condition_instance_id() {
                    if let Some(instance) = context.get_condition_instance_mut(instance_id) {
                        let var_idx = match property {
                            PropertyAddress::ConditionInstVar0 => 0,
                            PropertyAddress::ConditionInstVar1 => 1,
                            PropertyAddress::ConditionInstVar2 => 2,
                            PropertyAddress::ConditionInstVar3 => 3,
                            PropertyAddress::ConditionInstVar4 => 4,
                            PropertyAddress::ConditionInstVar5 => 5,
                            PropertyAddress::ConditionInstVar6 => 6,
                            PropertyAddress::ConditionInstVar7 => 7,
                            _ => return,
                        };
                        if var_index < self.vars.len() && var_idx < instance.runtime_vars.len() {
                            instance.runtime_vars[var_idx] = self.vars[var_index];
                        }
                    }
                }
            }
            PropertyAddress::ConditionInstFixed0
            | PropertyAddress::ConditionInstFixed1
            | PropertyAddress::ConditionInstFixed2
            | PropertyAddress::ConditionInstFixed3 => {
                if let Some(instance_id) = context.get_current_condition_instance_id() {
                    if let Some(instance) = context.get_condition_instance_mut(instance_id) {
                        let fixed_idx = match property {
                            PropertyAddress::ConditionInstFixed0 => 0,
                            PropertyAddress::ConditionInstFixed1 => 1,
                            PropertyAddress::ConditionInstFixed2 => 2,
                            PropertyAddress::ConditionInstFixed3 => 3,
                            _ => return,
                        };
                        if var_index < self.fixed.len() && fixed_idx < instance.runtime_fixed.len()
                        {
                            instance.runtime_fixed[fixed_idx] = self.fixed[var_index];
                        }
                    }
                }
            }
            _ => {} // Other instance properties not implemented yet
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Mock context for testing
    struct MockContext {
        health: u8,
        energy: u8,
        position: (Fixed, Fixed),
        velocity: (Fixed, Fixed),
        energy_requirement: u8,
        on_cooldown: bool,
        random_value: u8,
        locked: bool,
        spawns_created: Vec<(usize, Option<[u8; 4]>)>,
    }

    impl MockContext {
        fn new() -> Self {
            Self {
                health: 100,
                energy: 50,
                position: (Fixed::from_int(10), Fixed::from_int(20)),
                velocity: (Fixed::from_int(-2), Fixed::from_int(3)),
                energy_requirement: 10,
                on_cooldown: false,
                random_value: 42,
                locked: false,
                spawns_created: Vec::new(),
            }
        }
    }

    impl ScriptContext for MockContext {
        fn read_property(&mut self, engine: &mut ScriptEngine, var_index: usize, prop_address: u8) {
            // Convert raw property address to PropertyAddress enum for better readability
            if let Some(property) = PropertyAddress::from_u8(prop_address) {
                match property {
                    // Game state properties (Fixed-point values)
                    PropertyAddress::GameSeed => {
                        if var_index < engine.fixed.len() {
                            engine.fixed[var_index] = Fixed::from_int(123); // Mock seed
                        }
                    }
                    PropertyAddress::GameFrame => {
                        if var_index < engine.fixed.len() {
                            engine.fixed[var_index] = Fixed::from_int(456); // Mock frame
                        }
                    }

                    // Character position and movement (Fixed-point values)
                    PropertyAddress::CharacterPosX => {
                        if var_index < engine.fixed.len() {
                            engine.fixed[var_index] = self.position.0;
                        }
                    }
                    PropertyAddress::CharacterPosY => {
                        if var_index < engine.fixed.len() {
                            engine.fixed[var_index] = self.position.1;
                        }
                    }
                    PropertyAddress::CharacterVelX => {
                        if var_index < engine.fixed.len() {
                            engine.fixed[var_index] = self.velocity.0;
                        }
                    }
                    PropertyAddress::CharacterVelY => {
                        if var_index < engine.fixed.len() {
                            engine.fixed[var_index] = self.velocity.1;
                        }
                    }

                    // Character stats (Byte values)
                    PropertyAddress::CharacterHealth => {
                        if var_index < engine.vars.len() {
                            engine.vars[var_index] = self.health;
                        }
                    }
                    PropertyAddress::CharacterEnergy => {
                        if var_index < engine.vars.len() {
                            engine.vars[var_index] = self.energy;
                        }
                    }

                    _ => {}
                }
            }
        }

        fn write_property(
            &mut self,
            engine: &mut ScriptEngine,
            prop_address: u8,
            var_index: usize,
        ) {
            // Convert raw property address to PropertyAddress enum for better readability
            if let Some(property) = PropertyAddress::from_u8(prop_address) {
                match property {
                    // Character position and movement (Fixed-point values)
                    PropertyAddress::CharacterPosX => {
                        if var_index < engine.fixed.len() {
                            self.position.0 = engine.fixed[var_index];
                        }
                    }
                    PropertyAddress::CharacterPosY => {
                        if var_index < engine.fixed.len() {
                            self.position.1 = engine.fixed[var_index];
                        }
                    }
                    PropertyAddress::CharacterVelX => {
                        if var_index < engine.fixed.len() {
                            self.velocity.0 = engine.fixed[var_index];
                        }
                    }
                    PropertyAddress::CharacterVelY => {
                        if var_index < engine.fixed.len() {
                            self.velocity.1 = engine.fixed[var_index];
                        }
                    }
                    PropertyAddress::CharacterHealth => {
                        if var_index < engine.vars.len() {
                            self.health = engine.vars[var_index];
                        }
                    }
                    PropertyAddress::CharacterEnergy => {
                        if var_index < engine.vars.len() {
                            self.energy = engine.vars[var_index];
                        }
                    }
                    _ => {}
                }
            }
        }

        fn get_energy_requirement(&self) -> u8 {
            self.energy_requirement
        }

        fn get_current_energy(&self) -> u8 {
            self.energy
        }

        fn is_on_cooldown(&self) -> bool {
            self.on_cooldown
        }

        fn get_random_u8(&mut self) -> u8 {
            self.random_value
        }

        fn lock_action(&mut self) {
            self.locked = true;
        }

        fn unlock_action(&mut self) {
            self.locked = false;
        }

        fn apply_energy_cost(&mut self) {
            self.energy = self.energy.saturating_sub(self.energy_requirement);
        }

        fn apply_duration(&mut self) {
            // Mock implementation
        }

        fn create_spawn(&mut self, spawn_id: usize, vars: Option<[u8; 4]>) {
            self.spawns_created.push((spawn_id, vars));
        }

        fn log_debug(&self, _message: &str) {
            // In real implementation, this would log to appropriate system
        }

        fn read_action_cooldown(&self, engine: &mut ScriptEngine, var_index: usize) {
            // Mock implementation - return a test cooldown value
            if var_index < engine.vars.len() {
                engine.vars[var_index] = 30; // Mock 30-frame cooldown
            }
        }

        fn read_action_last_used(&self, engine: &mut ScriptEngine, var_index: usize) {
            // Mock implementation - return a test timestamp
            if var_index < engine.vars.len() {
                engine.vars[var_index] = 100; // Mock frame 100
            }
        }

        fn write_action_last_used(&mut self, engine: &mut ScriptEngine, var_index: usize) {
            // Mock implementation - no-op for testing
            if var_index < engine.vars.len() {
                // In real implementation, this would update the character's action_last_used
            }
        }
    }

    #[test]
    fn test_operator_from_u8() {
        // Test valid operators
        assert_eq!(Operator::from_u8(0), Some(Operator::Exit));
        assert_eq!(Operator::from_u8(1), Some(Operator::ExitIfNoEnergy));
        assert_eq!(Operator::from_u8(10), Some(Operator::ReadProp));
        assert_eq!(Operator::from_u8(11), Some(Operator::WriteProp));
        assert_eq!(Operator::from_u8(20), Some(Operator::AssignByte));
        assert_eq!(Operator::from_u8(30), Some(Operator::Add));
        assert_eq!(Operator::from_u8(40), Some(Operator::AddByte));
        assert_eq!(Operator::from_u8(50), Some(Operator::Equal));
        assert_eq!(Operator::from_u8(60), Some(Operator::Not));
        assert_eq!(Operator::from_u8(70), Some(Operator::Min));
        assert_eq!(Operator::from_u8(80), Some(Operator::LockAction));
        assert_eq!(Operator::from_u8(90), Some(Operator::LogVariable));

        // Test invalid operators
        assert_eq!(Operator::from_u8(5), None);
        assert_eq!(Operator::from_u8(15), None);
        assert_eq!(Operator::from_u8(255), None);
    }

    #[test]
    fn test_operator_byte_values() {
        // Test that operator enum values match their byte representations
        assert_eq!(Operator::Exit as u8, 0);
        assert_eq!(Operator::ExitIfNoEnergy as u8, 1);
        assert_eq!(Operator::ReadProp as u8, 10);
        assert_eq!(Operator::WriteProp as u8, 11);
        assert_eq!(Operator::AssignByte as u8, 20);
        assert_eq!(Operator::Add as u8, 30);
        assert_eq!(Operator::AddByte as u8, 40);
        assert_eq!(Operator::Equal as u8, 50);
        assert_eq!(Operator::Not as u8, 60);
        assert_eq!(Operator::Min as u8, 70);
        assert_eq!(Operator::LockAction as u8, 80);
        assert_eq!(Operator::LogVariable as u8, 90);
    }

    #[test]
    fn test_script_engine_creation() {
        let engine = ScriptEngine::new();
        assert_eq!(engine.pos, 0);
        assert_eq!(engine.exit_flag, 0);
        assert_eq!(engine.vars, [0; 8]);
        assert_eq!(engine.fixed, [Fixed::ZERO; 4]);
    }

    #[test]
    fn test_script_engine_reset() {
        let mut engine = ScriptEngine::new();
        engine.pos = 10;
        engine.exit_flag = 5;
        engine.vars[0] = 42;
        engine.fixed[0] = Fixed::from_int(100);

        engine.reset();

        assert_eq!(engine.pos, 0);
        assert_eq!(engine.exit_flag, 0);
        assert_eq!(engine.vars, [0; 8]);
        assert_eq!(engine.fixed, [Fixed::ZERO; 4]);
    }

    #[test]
    fn test_basic_variable_assignment() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test AssignByte: [AssignByte, var_index=0, literal=42, Exit, exit_flag=1]
        let script = [20, 0, 42, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[0], 42);
    }

    #[test]
    fn test_fixed_point_assignment() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test AssignFixed: [AssignFixed, var_index=0, numerator=10, denominator=2, Exit, exit_flag=1]
        let script = [21, 0, 10, 2, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.fixed[0], Fixed::from_int(5)); // 10/2 = 5
    }

    #[test]
    fn test_byte_arithmetic_operations() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test AddByte: assign 5 to var[0], assign 3 to var[1], add them to var[2]
        // [AssignByte, 0, 5, AssignByte, 1, 3, AddByte, 2, 0, 1, Exit, 1]
        let script = [20, 0, 5, 20, 1, 3, 40, 2, 0, 1, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[0], 5);
        assert_eq!(engine.vars[1], 3);
        assert_eq!(engine.vars[2], 8); // 5 + 3 = 8
    }

    #[test]
    fn test_fixed_arithmetic_operations() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test Add: assign 10 to fixed[0], assign 5 to fixed[1], add them to fixed[2]
        // [AssignFixed, 0, 10, 1, AssignFixed, 1, 5, 1, Add, 2, 0, 1, Exit, 1]
        let script = [21, 0, 10, 1, 21, 1, 5, 1, 30, 2, 0, 1, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.fixed[0], Fixed::from_int(10));
        assert_eq!(engine.fixed[1], Fixed::from_int(5));
        assert_eq!(engine.fixed[2], Fixed::from_int(15)); // 10 + 5 = 15
    }

    #[test]
    fn test_conditional_operations() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test Equal: assign 5 to var[0], assign 5 to var[1], compare them to var[2]
        // [AssignByte, 0, 5, AssignByte, 1, 5, Equal, 2, 0, 1, Exit, 1]
        let script = [20, 0, 5, 20, 1, 5, 50, 2, 0, 1, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[2], 1); // 5 == 5 is true (1)

        engine.reset();

        // Test LessThan: assign 3 to var[0], assign 5 to var[1], compare them to var[2]
        // [AssignByte, 0, 3, AssignByte, 1, 5, LessThan, 2, 0, 1, Exit, 1]
        let script = [20, 0, 3, 20, 1, 5, 52, 2, 0, 1, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[2], 1); // 3 < 5 is true (1)
    }

    #[test]
    fn test_logical_operations() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test And: assign 1 to var[0], assign 1 to var[1], AND them to var[2]
        // [AssignByte, 0, 1, AssignByte, 1, 1, And, 2, 0, 1, Exit, 1]
        let script = [20, 0, 1, 20, 1, 1, 62, 2, 0, 1, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[2], 1); // 1 AND 1 is true (1)

        engine.reset();

        // Test Not: assign 0 to var[0], NOT it to var[1]
        // [AssignByte, 0, 0, Not, 1, 0, Exit, 1]
        let script = [20, 0, 0, 60, 1, 0, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[1], 1); // NOT 0 is true (1)
    }

    #[test]
    fn test_utility_operations() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test Min: assign 10 to var[0], assign 5 to var[1], min them to var[2]
        // [AssignByte, 0, 10, AssignByte, 1, 5, Min, 2, 0, 1, Exit, 1]
        let script = [20, 0, 10, 20, 1, 5, 70, 2, 0, 1, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[2], 5); // min(10, 5) = 5

        engine.reset();

        // Test Max: assign 10 to var[0], assign 5 to var[1], max them to var[2]
        // [AssignByte, 0, 10, AssignByte, 1, 5, Max, 2, 0, 1, Exit, 1]
        let script = [20, 0, 10, 20, 1, 5, 71, 2, 0, 1, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[2], 10); // max(10, 5) = 10
    }

    #[test]
    fn test_property_access() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test ReadProp: read health (prop 0x21) into var[0]
        // [ReadProp, var_index=0, prop_address=0x21, Exit, 1]
        let script = [10, 0, 0x21, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[0], 100); // Mock health value

        engine.reset();

        // Test WriteProp: assign 75 to var[0], write it to health (prop 0x21)
        // [AssignByte, 0, 75, WriteProp, 0x21, 0, Exit, 1]
        let script = [20, 0, 75, 11, 0x21, 0, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(context.health, 75); // Health should be updated
    }

    #[test]
    fn test_control_flow_operations() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test Skip: assign 5 to var[0], skip 3 bytes, assign 10 to var[1] (should be skipped)
        // [AssignByte, 0, 5, Skip, 3, AssignByte, 1, 10, Exit, 1]
        let script = [20, 0, 5, 3, 3, 20, 1, 10, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[0], 5);
        assert_eq!(engine.vars[1], 0); // Should remain 0 (skipped)
    }

    #[test]
    fn test_exit_if_no_energy() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();
        context.energy = 5; // Less than requirement (10)

        // Test ExitIfNoEnergy: should exit with flag 99
        // [ExitIfNoEnergy, 99, AssignByte, 0, 42, Exit, 1]
        let script = [1, 99, 20, 0, 42, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 99); // Should exit with flag 99
        assert_eq!(engine.vars[0], 0); // Assignment should be skipped
    }

    #[test]
    fn test_spawn_operations() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test Spawn: assign spawn_id 5 to var[0], spawn it
        // [AssignByte, 0, 5, Spawn, 0, Exit, 1]
        let script = [20, 0, 5, 84, 0, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(context.spawns_created.len(), 1);
        assert_eq!(context.spawns_created[0], (5, None));

        context.spawns_created.clear();
        engine.reset();

        // Test SpawnWithVars: spawn with variables
        // [AssignByte, 0, 3, AssignByte, 1, 10, AssignByte, 2, 20, AssignByte, 3, 30, AssignByte, 4, 40, SpawnWithVars, 0, 1, 2, 3, 4, Exit, 1]
        let script = [
            20, 0, 3, 20, 1, 10, 20, 2, 20, 20, 3, 30, 20, 4, 40, 85, 0, 1, 2, 3, 4, 0, 1,
        ];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(context.spawns_created.len(), 1);
        assert_eq!(context.spawns_created[0], (3, Some([10, 20, 30, 40])));
    }

    #[test]
    fn test_type_conversion() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test ToByte: assign fixed value, convert to byte
        // [AssignFixed, 0, 42, 1, ToByte, 0, 0, Exit, 1]
        let script = [21, 0, 42, 1, 23, 0, 0, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[0], 42);

        engine.reset();

        // Test ToFixed: assign byte value, convert to fixed
        // [AssignByte, 0, 25, ToFixed, 0, 0, Exit, 1]
        let script = [20, 0, 25, 24, 0, 0, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.fixed[0], Fixed::from_int(25));
    }

    #[test]
    fn test_random_assignment() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test AssignRandom: assign random value to var[0]
        // [AssignRandom, 0, Exit, 1]
        let script = [22, 0, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[0], 42); // Mock random value
    }

    #[test]
    fn test_game_actions() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test LockAction and UnlockAction
        // [LockAction, UnlockAction, Exit, 1]
        let script = [80, 81, 0, 1];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        // The mock context doesn't track lock state changes in detail,
        // but the operations should execute without error
    }

    #[test]
    fn test_error_handling() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test invalid operator
        let script = [255, 0, 1]; // Invalid operator 255
        let result = engine.execute(&script, &mut context);
        assert!(matches!(result, Err(ScriptError::InvalidOperator)));

        engine.reset();

        // Test invalid variable index
        let script = [20, 8, 42, 0, 1]; // AssignByte to var[8] (out of bounds)
        let result = engine.execute(&script, &mut context);
        assert!(matches!(result, Err(ScriptError::IndexOutOfBounds)));

        engine.reset();

        // Test truncated script
        let script = [20, 0]; // AssignByte without enough parameters
        let result = engine.execute(&script, &mut context);
        assert!(matches!(result, Err(ScriptError::InvalidScript)));
    }

    #[test]
    fn test_complex_script_execution() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Complex script: read health, compare with 50, if greater spawn projectile
        // [ReadProp, 0, 0x21, AssignByte, 1, 50, LessThan, 2, 1, 0, AssignByte, 3, 5, Spawn, 3, Exit, 1]
        let script = [
            10, 0, 0x21, // ReadProp var[0] = health
            20, 1, 50, // AssignByte var[1] = 50
            52, 2, 1, 0, // LessThan var[2] = (var[1] < var[0]) = (50 < 100) = 1
            20, 3, 5, // AssignByte var[3] = 5 (spawn_id)
            84, 3, // Spawn var[3]
            0, 1, // Exit 1
        ];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[0], 100); // Health
        assert_eq!(engine.vars[1], 50); // Comparison value
        assert_eq!(engine.vars[2], 1); // Comparison result (50 < 100 = true)
        assert_eq!(context.spawns_created.len(), 1);
        assert_eq!(context.spawns_created[0], (5, None));
    }

    #[test]
    fn test_args_access_operations() {
        // Test ReadArg operator functionality
        let args = [10, 20, 30, 40, 50, 60, 70, 80];
        let mut engine = ScriptEngine::new_with_args(args);
        let mut context = MockContext::new();

        // Test reading different args into vars
        // [ReadArg, 0, 0, ReadArg, 1, 3, ReadArg, 2, 7, Exit, 1]
        let script = [
            96, 0, 0, // ReadArg: vars[0] = args[0] (10)
            96, 1, 3, // ReadArg: vars[1] = args[3] (40)
            96, 2, 7, // ReadArg: vars[2] = args[7] (80)
            0, 1, // Exit 1
        ];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[0], 10); // args[0]
        assert_eq!(engine.vars[1], 40); // args[3]
        assert_eq!(engine.vars[2], 80); // args[7]

        // Verify args remain unchanged (read-only)
        assert_eq!(engine.args, args);
    }

    #[test]
    fn test_spawns_access_operations() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test WriteSpawn and ReadSpawn operations
        // [AssignByte, 0, 15, WriteSpawn, 0, 0, AssignByte, 1, 25, WriteSpawn, 1, 1, ReadSpawn, 2, 0, ReadSpawn, 3, 1, Exit, 1]
        let script = [
            20, 0, 15, // AssignByte: vars[0] = 15
            98, 0, 0, // WriteSpawn: spawns[0] = vars[0] (15)
            20, 1, 25, // AssignByte: vars[1] = 25
            98, 1, 1, // WriteSpawn: spawns[1] = vars[1] (25)
            97, 2, 0, // ReadSpawn: vars[2] = spawns[0] (15)
            97, 3, 1, // ReadSpawn: vars[3] = spawns[1] (25)
            0, 1, // Exit 1
        ];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[0], 15);
        assert_eq!(engine.vars[1], 25);
        assert_eq!(engine.vars[2], 15); // Read back from spawns[0]
        assert_eq!(engine.vars[3], 25); // Read back from spawns[1]
        assert_eq!(engine.spawns[0], 15);
        assert_eq!(engine.spawns[1], 25);
        assert_eq!(engine.spawns[2], 0); // Unchanged
        assert_eq!(engine.spawns[3], 0); // Unchanged
    }

    #[test]
    fn test_args_read_only_behavior() {
        let args = [100, 200, 50, 75, 0, 0, 0, 0];
        let mut engine = ScriptEngine::new_with_args(args);
        let mut context = MockContext::new();

        // Test that args cannot be modified directly (they should remain read-only)
        // We can only read from args, not write to them
        // [ReadArg, 0, 0, ReadArg, 1, 1, Exit, 1]
        let script = [
            96, 0, 0, // ReadArg: vars[0] = args[0] (100)
            96, 1, 1, // ReadArg: vars[1] = args[1] (200)
            0, 1, // Exit 1
        ];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[0], 100);
        assert_eq!(engine.vars[1], 200);

        // Args should remain unchanged
        assert_eq!(engine.args, args);
    }

    #[test]
    fn test_args_spawns_error_handling() {
        let mut engine = ScriptEngine::new();
        let mut context = MockContext::new();

        // Test ReadArg with invalid arg index
        let script = [96, 0, 8, 0, 1]; // ReadArg vars[0] = args[8] (out of bounds)
        let result = engine.execute(&script, &mut context);
        assert!(matches!(result, Err(ScriptError::InvalidScript)));

        engine.reset();

        // Test ReadArg with invalid var index
        let script = [96, 8, 0, 0, 1]; // ReadArg vars[8] = args[0] (out of bounds)
        let result = engine.execute(&script, &mut context);
        assert!(matches!(result, Err(ScriptError::InvalidScript)));

        engine.reset();

        // Test WriteSpawn with invalid spawn index
        let script = [20, 0, 42, 98, 4, 0, 0, 1]; // WriteSpawn spawns[4] = vars[0] (out of bounds)
        let result = engine.execute(&script, &mut context);
        assert!(matches!(result, Err(ScriptError::InvalidScript)));

        engine.reset();

        // Test ReadSpawn with invalid spawn index
        let script = [97, 0, 4, 0, 1]; // ReadSpawn vars[0] = spawns[4] (out of bounds)
        let result = engine.execute(&script, &mut context);
        assert!(matches!(result, Err(ScriptError::InvalidScript)));
    }

    #[test]
    fn test_script_engine_with_args_creation() {
        let args = [1, 2, 3, 4, 5, 6, 7, 8];
        let engine = ScriptEngine::new_with_args(args);

        assert_eq!(engine.args, args);
        assert_eq!(engine.vars, [0; 8]);
        assert_eq!(engine.spawns, [0; 4]);
        assert_eq!(engine.pos, 0);
        assert_eq!(engine.exit_flag, 0);
    }

    #[test]
    fn test_script_engine_reset_with_args() {
        let initial_args = [10, 20, 30, 40, 50, 60, 70, 80];
        let mut engine = ScriptEngine::new_with_args(initial_args);

        // Modify engine state
        engine.vars[0] = 99;
        engine.spawns[0] = 88;
        engine.pos = 5;
        engine.exit_flag = 2;

        // Reset with new args
        let new_args = [11, 22, 33, 44, 55, 66, 77, 88];
        engine.reset_with_args(new_args);

        assert_eq!(engine.args, new_args);
        assert_eq!(engine.vars, [0; 8]); // Should be reset
        assert_eq!(engine.spawns, [0; 4]); // Should be reset
        assert_eq!(engine.pos, 0); // Should be reset
        assert_eq!(engine.exit_flag, 0); // Should be reset
    }

    #[test]
    fn test_reusable_action_with_args() {
        // Test a reusable action pattern using args for configuration
        let move_speed = 5;
        let args = [move_speed, 0, 0, 0, 0, 0, 0, 0];
        let mut engine = ScriptEngine::new_with_args(args);
        let mut context = MockContext::new();

        // Simulate a "Run" action that uses args[0] for move speed
        // [ReadArg, 0, 0, ToFixed, 0, 0, ReadProp, 0, 0x1B, Add, 0, 0, 0, WriteProp, 0x1B, 0, Exit, 1]
        let script = [
            96, 0, 0, // ReadArg: vars[0] = args[0] (move speed)
            24, 0, 0, // ToFixed: fixed[0] = Fixed::from_int(vars[0])
            10, 0, 0x1B, // ReadProp: fixed[0] = velocity.x (current velocity)
            30, 0, 0,
            0, // Add: fixed[0] = fixed[0] + fixed[0] (double current velocity for test)
            11, 0x1B, 0, // WriteProp: velocity.x = fixed[0]
            0, 1, // Exit 1
        ];
        let result = engine.execute(&script, &mut context).unwrap();

        assert_eq!(result, 1);
        assert_eq!(engine.vars[0], move_speed);
        // The velocity should have been modified based on the move speed from args
        assert_eq!(context.velocity.0, Fixed::from_int(-4)); // -2 + -2 = -4 (doubled)
    }
}
