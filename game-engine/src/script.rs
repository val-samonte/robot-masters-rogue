//! Bytecode scripting system for game logic

use crate::constants::OperatorAddress;
use crate::math::Fixed;

extern crate alloc;

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

    /// Create a new script engine with arguments and spawns
    pub fn new_with_args_and_spawns(args: [u8; 8], spawns: [u8; 4]) -> Self {
        Self {
            pos: 0,
            exit_flag: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args,
            spawns,
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

    /// Reset the script engine state with new arguments and spawns
    pub fn reset_with_args_and_spawns(&mut self, args: [u8; 8], spawns: [u8; 4]) {
        self.pos = 0;
        self.exit_flag = 0;
        self.vars = [0; 8];
        self.fixed = [Fixed::ZERO; 4];
        self.args = args;
        self.spawns = spawns;
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
        let op = OperatorAddress::from_u8(op_byte).ok_or(ScriptError::InvalidOperator)?;

        match op {
            // Control flow operations
            OperatorAddress::Exit => {
                self.exit_flag = self.read_u8(script)?;
                self.pos = script.len();
            }

            OperatorAddress::ExitIfNoEnergy => {
                let exit_flag = self.read_u8(script)?;
                let energy_req = context.get_energy_requirement();
                if context.get_current_energy() < energy_req {
                    self.exit_flag = exit_flag;
                    self.pos = script.len();
                }
            }

            OperatorAddress::ExitIfCooldown => {
                let exit_flag = self.read_u8(script)?;
                if context.is_on_cooldown() {
                    self.exit_flag = exit_flag;
                    self.pos = script.len();
                }
            }

            OperatorAddress::Skip => {
                let skip_count = self.read_u8(script)? as usize;
                self.pos += skip_count;
            }

            OperatorAddress::Goto => {
                let target = self.read_u8(script)? as usize;
                if target >= script.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.pos = target;
            }

            // Property operations - easily extensible
            OperatorAddress::ReadProp => {
                let var_index = self.read_u8(script)? as usize;
                let prop_address = self.read_u8(script)?;
                if var_index >= self.vars.len() + self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.read_property(self, var_index, prop_address);
            }

            OperatorAddress::WriteProp => {
                let prop_address = self.read_u8(script)?;
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() + self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.write_property(self, prop_address, var_index);
            }

            // Variable assignment operations
            OperatorAddress::AssignByte => {
                let var_index = self.read_u8(script)? as usize;
                let literal = self.read_u8(script)?;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::IndexOutOfBounds);
                }
                self.vars[var_index] = literal;
            }

            OperatorAddress::AssignFixed => {
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

            OperatorAddress::AssignRandom => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::IndexOutOfBounds);
                }
                self.vars[var_index] = context.get_random_u8();
            }

            OperatorAddress::ToByte => {
                let to_var_index = self.read_u8(script)? as usize;
                let from_fixed_index = self.read_u8(script)? as usize;
                if to_var_index >= self.vars.len() || from_fixed_index >= self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[to_var_index] = self.fixed[from_fixed_index].to_int() as u8;
            }

            OperatorAddress::ToFixed => {
                let to_fixed_index = self.read_u8(script)? as usize;
                let from_var_index = self.read_u8(script)? as usize;
                if to_fixed_index >= self.fixed.len() || from_var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.fixed[to_fixed_index] = Fixed::from_int(self.vars[from_var_index] as i16);
            }

            // Generic 3-operand fixed-point arithmetic
            OperatorAddress::Add
            | OperatorAddress::Sub
            | OperatorAddress::Mul
            | OperatorAddress::Div => {
                self.execute_fixed_arithmetic(script, op)?;
            }

            OperatorAddress::Negate => {
                let fixed_index = self.read_u8(script)? as usize;
                if fixed_index >= self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.fixed[fixed_index] = self.fixed[fixed_index].neg();
            }

            // Generic 3-operand byte arithmetic
            OperatorAddress::AddByte
            | OperatorAddress::SubByte
            | OperatorAddress::MulByte
            | OperatorAddress::DivByte
            | OperatorAddress::ModByte
            | OperatorAddress::WrappingAdd => {
                self.execute_byte_arithmetic(script, op)?;
            }

            // Generic 3-operand conditional operations
            OperatorAddress::Equal
            | OperatorAddress::NotEqual
            | OperatorAddress::LessThan
            | OperatorAddress::LessThanOrEqual => {
                self.execute_conditional(script, op)?;
            }

            // Generic logical operations
            OperatorAddress::Or | OperatorAddress::And => {
                self.execute_logical_binary(script, op)?;
            }

            OperatorAddress::Not => {
                let dest_index = self.read_u8(script)? as usize;
                let source_index = self.read_u8(script)? as usize;
                if dest_index >= self.vars.len() || source_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[dest_index] = if self.vars[source_index] == 0 { 1 } else { 0 };
            }

            // Generic utility operations
            OperatorAddress::Min | OperatorAddress::Max => {
                self.execute_utility_binary(script, op)?;
            }

            // Game-specific operations
            OperatorAddress::LockAction => {
                context.lock_action();
            }

            OperatorAddress::UnlockAction => {
                context.unlock_action();
            }

            OperatorAddress::ApplyEnergyCost => {
                context.apply_energy_cost();
            }

            OperatorAddress::ApplyDuration => {
                context.apply_duration();
            }

            OperatorAddress::Spawn => {
                let spawn_id = self.vars[self.read_u8(script)? as usize] as usize;
                context.create_spawn(spawn_id, None);
            }

            OperatorAddress::SpawnWithVars => {
                let spawn_id = self.vars[self.read_u8(script)? as usize] as usize;
                let vars = [
                    self.vars[self.read_u8(script)? as usize],
                    self.vars[self.read_u8(script)? as usize],
                    self.vars[self.read_u8(script)? as usize],
                    self.vars[self.read_u8(script)? as usize],
                ];
                context.create_spawn(spawn_id, Some(vars));
            }

            OperatorAddress::LogVariable => {
                let var_index = self.read_u8(script)? as usize;
                if var_index < self.vars.len() {
                    context.log_debug("variable logged");
                } else if var_index < self.vars.len() + self.fixed.len() {
                    context.log_debug("fixed variable logged");
                }
            }

            OperatorAddress::ExitWithVar => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.exit_flag = self.vars[var_index];
                self.pos = script.len();
            }

            // Cooldown operators
            OperatorAddress::ReadActionCooldown => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                // This will be handled by context-specific implementations
                context.read_action_cooldown(self, var_index);
            }

            OperatorAddress::ReadActionLastUsed => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.read_action_last_used(self, var_index);
            }

            OperatorAddress::WriteActionLastUsed => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.write_action_last_used(self, var_index);
            }

            OperatorAddress::IsActionOnCooldown => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[var_index] = if context.is_on_cooldown() { 1 } else { 0 };
            }

            // Args and Spawns access operations
            OperatorAddress::ReadArg => {
                let var_index = self.read_u8(script)? as usize;
                let arg_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() || arg_index >= self.args.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[var_index] = self.args[arg_index];
            }

            OperatorAddress::ReadSpawn => {
                let var_index = self.read_u8(script)? as usize;
                let spawn_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() || spawn_index >= self.spawns.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[var_index] = self.spawns[spawn_index];
            }

            OperatorAddress::WriteSpawn => {
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
    fn execute_fixed_arithmetic(
        &mut self,
        script: &[u8],
        op: OperatorAddress,
    ) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.fixed.len() || left >= self.fixed.len() || right >= self.fixed.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.fixed[dest] = match op {
            OperatorAddress::Add => self.fixed[left].add(self.fixed[right]),
            OperatorAddress::Sub => self.fixed[left].sub(self.fixed[right]),
            OperatorAddress::Mul => self.fixed[left].mul(self.fixed[right]),
            OperatorAddress::Div => self.fixed[left].div(self.fixed[right]),
            _ => unreachable!(),
        };

        Ok(())
    }

    fn execute_byte_arithmetic(
        &mut self,
        script: &[u8],
        op: OperatorAddress,
    ) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            OperatorAddress::AddByte => self.vars[left].saturating_add(self.vars[right]),
            OperatorAddress::SubByte => self.vars[left].saturating_sub(self.vars[right]),
            OperatorAddress::MulByte => self.vars[left].saturating_mul(self.vars[right]),
            OperatorAddress::DivByte => {
                if self.vars[right] == 0 {
                    u8::MAX
                } else {
                    self.vars[left] / self.vars[right]
                }
            }
            OperatorAddress::ModByte => {
                if self.vars[right] == 0 {
                    0
                } else {
                    self.vars[left] % self.vars[right]
                }
            }
            OperatorAddress::WrappingAdd => self.vars[left].wrapping_add(self.vars[right]),
            _ => unreachable!(),
        };

        Ok(())
    }

    fn execute_conditional(
        &mut self,
        script: &[u8],
        op: OperatorAddress,
    ) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            OperatorAddress::Equal => {
                if self.vars[left] == self.vars[right] {
                    1
                } else {
                    0
                }
            }
            OperatorAddress::NotEqual => {
                if self.vars[left] != self.vars[right] {
                    1
                } else {
                    0
                }
            }
            OperatorAddress::LessThan => {
                if self.vars[left] < self.vars[right] {
                    1
                } else {
                    0
                }
            }
            OperatorAddress::LessThanOrEqual => {
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

    fn execute_logical_binary(
        &mut self,
        script: &[u8],
        op: OperatorAddress,
    ) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            OperatorAddress::Or => {
                if self.vars[left] != 0 || self.vars[right] != 0 {
                    1
                } else {
                    0
                }
            }
            OperatorAddress::And => {
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

    fn execute_utility_binary(
        &mut self,
        script: &[u8],
        op: OperatorAddress,
    ) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            OperatorAddress::Min => self.vars[left].min(self.vars[right]),
            OperatorAddress::Max => self.vars[left].max(self.vars[right]),
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
