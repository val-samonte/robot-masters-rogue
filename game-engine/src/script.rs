//! Bytecode scripting system for game logic

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

/// Bytecode operators with explicit byte values
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Operator {
    // Control flow
    Exit = 0,
    ExitIfNoEnergy = 1,
    ExitIfCooldown = 2,
    Skip = 3,
    Goto = 4,

    // Property operations
    ReadProp = 10,  // [ReadProp, var_index, prop_address]
    WriteProp = 11, // [WriteProp, prop_address, var_index]

    // Variable operations
    AssignByte = 20,   // [AssignByte, var_index, literal_value]
    AssignFixed = 21,  // [AssignFixed, var_index, numerator, denominator]
    AssignRandom = 22, // [AssignRandom, var_index]
    ToByte = 23,       // [ToByte, to_var_index, from_fixed_index]
    ToFixed = 24,      // [ToFixed, to_fixed_index, from_var_index]

    // Arithmetic (Fixed-point)
    Add = 30,    // [Add, dest_fixed, left_fixed, right_fixed]
    Sub = 31,    // [Sub, dest_fixed, left_fixed, right_fixed]
    Mul = 32,    // [Mul, dest_fixed, left_fixed, right_fixed]
    Div = 33,    // [Div, dest_fixed, left_fixed, right_fixed]
    Negate = 34, // [Negate, fixed_index]

    // Arithmetic (Byte)
    AddByte = 40,     // [AddByte, dest_var, left_var, right_var]
    SubByte = 41,     // [SubByte, dest_var, left_var, right_var]
    MulByte = 42,     // [MulByte, dest_var, left_var, right_var]
    DivByte = 43,     // [DivByte, dest_var, left_var, right_var]
    ModByte = 44,     // [ModByte, dest_var, left_var, right_var]
    WrappingAdd = 45, // [WrappingAdd, dest_var, left_var, right_var]

    // Conditionals
    Equal = 50,           // [Equal, dest_var, left_var, right_var]
    NotEqual = 51,        // [NotEqual, dest_var, left_var, right_var]
    LessThan = 52,        // [LessThan, dest_var, left_var, right_var]
    LessThanOrEqual = 53, // [LessThanOrEqual, dest_var, left_var, right_var]

    // Logical operations
    Not = 60, // [Not, dest_var, source_var]
    Or = 61,  // [Or, dest_var, left_var, right_var]
    And = 62, // [And, dest_var, left_var, right_var]

    // Utility operations
    Min = 70, // [Min, dest_var, left_var, right_var]
    Max = 71, // [Max, dest_var, left_var, right_var]

    // Game actions
    LockAction = 80,
    UnlockAction = 81,
    ApplyEnergyCost = 82,
    ApplyDuration = 83,
    Spawn = 84,         // [Spawn, spawn_id_var]
    SpawnWithVars = 85, // [SpawnWithVars, spawn_id_var, var1, var2, var3, var4]

    // Debug
    LogVariable = 90, // [LogVariable, var_index]

    // Conditional exit
    ExitWithVar = 91, // [ExitWithVar, var_index] - Exit with value from variable

    // Args and spawns access
    ReadArg = 96,    // [ReadArg, var_index, arg_index] - Read from args array
    ReadSpawn = 97,  // [ReadSpawn, var_index, spawn_index] - Read from spawns array
    WriteSpawn = 98, // [WriteSpawn, spawn_index, var_index] - Write to spawns array

    // Cooldown operators
    ReadActionCooldown = 100, // [ReadActionCooldown, var_index] - Read Action cooldown into vars
    ReadActionLastUsed = 101, // [ReadActionLastUsed, var_index] - Read when action was last used
    WriteActionLastUsed = 102, // [WriteActionLastUsed, var_index] - Update last used timestamp
    IsActionOnCooldown = 103, // [IsActionOnCooldown, var_index] - Check if action is on cooldown
}

impl Operator {
    /// Simple byte-to-enum conversion
    pub fn from_u8(byte: u8) -> Option<Operator> {
        match byte {
            0 => Some(Operator::Exit),
            1 => Some(Operator::ExitIfNoEnergy),
            2 => Some(Operator::ExitIfCooldown),
            3 => Some(Operator::Skip),
            4 => Some(Operator::Goto),
            10 => Some(Operator::ReadProp),
            11 => Some(Operator::WriteProp),
            20 => Some(Operator::AssignByte),
            21 => Some(Operator::AssignFixed),
            22 => Some(Operator::AssignRandom),
            23 => Some(Operator::ToByte),
            24 => Some(Operator::ToFixed),
            30 => Some(Operator::Add),
            31 => Some(Operator::Sub),
            32 => Some(Operator::Mul),
            33 => Some(Operator::Div),
            34 => Some(Operator::Negate),
            40 => Some(Operator::AddByte),
            41 => Some(Operator::SubByte),
            42 => Some(Operator::MulByte),
            43 => Some(Operator::DivByte),
            44 => Some(Operator::ModByte),
            45 => Some(Operator::WrappingAdd),
            50 => Some(Operator::Equal),
            51 => Some(Operator::NotEqual),
            52 => Some(Operator::LessThan),
            53 => Some(Operator::LessThanOrEqual),
            60 => Some(Operator::Not),
            61 => Some(Operator::Or),
            62 => Some(Operator::And),
            70 => Some(Operator::Min),
            71 => Some(Operator::Max),
            80 => Some(Operator::LockAction),
            81 => Some(Operator::UnlockAction),
            82 => Some(Operator::ApplyEnergyCost),
            83 => Some(Operator::ApplyDuration),
            84 => Some(Operator::Spawn),
            85 => Some(Operator::SpawnWithVars),
            90 => Some(Operator::LogVariable),
            91 => Some(Operator::ExitWithVar),
            96 => Some(Operator::ReadArg),
            97 => Some(Operator::ReadSpawn),
            98 => Some(Operator::WriteSpawn),
            100 => Some(Operator::ReadActionCooldown),
            101 => Some(Operator::ReadActionLastUsed),
            102 => Some(Operator::WriteActionLastUsed),
            103 => Some(Operator::IsActionOnCooldown),
            _ => None,
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
                    context.log_debug("variable logged");
                } else if var_index < self.vars.len() + self.fixed.len() {
                    context.log_debug("fixed variable logged");
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
