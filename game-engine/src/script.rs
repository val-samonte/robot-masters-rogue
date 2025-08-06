//! Bytecode scripting system for game logic

use crate::constants::operator_address;
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

        match op_byte {
            // Control flow operations
            operator_address::EXIT => {
                self.exit_flag = self.read_u8(script)?;
                self.pos = script.len();
            }

            operator_address::EXIT_IF_NO_ENERGY => {
                let exit_flag = self.read_u8(script)?;
                let energy_req = context.get_energy_requirement();
                if context.get_current_energy() < energy_req {
                    self.exit_flag = exit_flag;
                    self.pos = script.len();
                }
            }

            operator_address::EXIT_IF_COOLDOWN => {
                let exit_flag = self.read_u8(script)?;
                if context.is_on_cooldown() {
                    self.exit_flag = exit_flag;
                    self.pos = script.len();
                }
            }

            operator_address::EXIT_IF_NOT_GROUNDED => {
                let exit_flag = self.read_u8(script)?;
                if !context.is_grounded() {
                    self.exit_flag = exit_flag;
                    self.pos = script.len();
                }
            }

            operator_address::SKIP => {
                let skip_count = self.read_u8(script)? as usize;
                self.pos += skip_count;
            }

            operator_address::GOTO => {
                let target = self.read_u8(script)? as usize;
                if target >= script.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.pos = target;
            }

            // Property operations - easily extensible
            operator_address::READ_PROP => {
                let var_index = self.read_u8(script)? as usize;
                let prop_address = self.read_u8(script)?;
                if var_index >= self.vars.len() + self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.read_property(self, var_index, prop_address);
            }

            operator_address::WRITE_PROP => {
                let prop_address = self.read_u8(script)?;
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() + self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.write_property(self, prop_address, var_index);
            }

            // Variable assignment operations
            operator_address::ASSIGN_BYTE => {
                let var_index = self.read_u8(script)? as usize;
                let literal = self.read_u8(script)?;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::IndexOutOfBounds);
                }
                self.vars[var_index] = literal;
            }

            operator_address::ASSIGN_FIXED => {
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

            operator_address::ASSIGN_RANDOM => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::IndexOutOfBounds);
                }
                self.vars[var_index] = context.get_random_u8();
            }

            operator_address::TO_BYTE => {
                let to_var_index = self.read_u8(script)? as usize;
                let from_fixed_index = self.read_u8(script)? as usize;
                if to_var_index >= self.vars.len() || from_fixed_index >= self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[to_var_index] = self.fixed[from_fixed_index].to_int() as u8;
            }

            operator_address::TO_FIXED => {
                let to_fixed_index = self.read_u8(script)? as usize;
                let from_var_index = self.read_u8(script)? as usize;
                if to_fixed_index >= self.fixed.len() || from_var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.fixed[to_fixed_index] = Fixed::from_int(self.vars[from_var_index] as i16);
            }

            // Generic 3-operand fixed-point arithmetic
            operator_address::ADD
            | operator_address::SUB
            | operator_address::MUL
            | operator_address::DIV => {
                self.execute_fixed_arithmetic(script, op_byte)?;
            }

            operator_address::NEGATE => {
                let fixed_index = self.read_u8(script)? as usize;
                if fixed_index >= self.fixed.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.fixed[fixed_index] = self.fixed[fixed_index].neg();
            }

            // Generic 3-operand byte arithmetic
            operator_address::ADD_BYTE
            | operator_address::SUB_BYTE
            | operator_address::MUL_BYTE
            | operator_address::DIV_BYTE
            | operator_address::MOD_BYTE
            | operator_address::WRAPPING_ADD => {
                self.execute_byte_arithmetic(script, op_byte)?;
            }

            // Generic 3-operand conditional operations
            operator_address::EQUAL
            | operator_address::NOT_EQUAL
            | operator_address::LESS_THAN
            | operator_address::LESS_THAN_OR_EQUAL => {
                self.execute_conditional(script, op_byte)?;
            }

            // Generic logical operations
            operator_address::OR | operator_address::AND => {
                self.execute_logical_binary(script, op_byte)?;
            }

            operator_address::NOT => {
                let dest_index = self.read_u8(script)? as usize;
                let source_index = self.read_u8(script)? as usize;
                if dest_index >= self.vars.len() || source_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[dest_index] = if self.vars[source_index] == 0 { 1 } else { 0 };
            }

            // Generic utility operations
            operator_address::MIN | operator_address::MAX => {
                self.execute_utility_binary(script, op_byte)?;
            }

            // Game-specific operations
            operator_address::LOCK_ACTION => {
                context.lock_action();
            }

            operator_address::UNLOCK_ACTION => {
                context.unlock_action();
            }

            operator_address::APPLY_ENERGY_COST => {
                context.apply_energy_cost();
            }

            operator_address::APPLY_DURATION => {
                context.apply_duration();
            }

            operator_address::SPAWN => {
                let spawn_id = self.vars[self.read_u8(script)? as usize] as usize;
                context.create_spawn(spawn_id, None);
            }

            operator_address::SPAWN_WITH_VARS => {
                let spawn_id = self.vars[self.read_u8(script)? as usize] as usize;
                let vars = [
                    self.vars[self.read_u8(script)? as usize],
                    self.vars[self.read_u8(script)? as usize],
                    self.vars[self.read_u8(script)? as usize],
                    self.vars[self.read_u8(script)? as usize],
                ];
                context.create_spawn(spawn_id, Some(vars));
            }

            operator_address::LOG_VARIABLE => {
                let var_index = self.read_u8(script)? as usize;
                if var_index < self.vars.len() {
                    context.log_debug("variable logged");
                } else if var_index < self.vars.len() + self.fixed.len() {
                    context.log_debug("fixed variable logged");
                }
            }

            operator_address::EXIT_WITH_VAR => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.exit_flag = self.vars[var_index];
                self.pos = script.len();
            }

            // Cooldown operators
            operator_address::READ_ACTION_COOLDOWN => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                // This will be handled by context-specific implementations
                context.read_action_cooldown(self, var_index);
            }

            operator_address::READ_ACTION_LAST_USED => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.read_action_last_used(self, var_index);
            }

            operator_address::WRITE_ACTION_LAST_USED => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                context.write_action_last_used(self, var_index);
            }

            operator_address::IS_ACTION_ON_COOLDOWN => {
                let var_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[var_index] = if context.is_on_cooldown() { 1 } else { 0 };
            }

            // Args and Spawns access operations
            operator_address::READ_ARG => {
                let var_index = self.read_u8(script)? as usize;
                let arg_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() || arg_index >= self.args.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[var_index] = self.args[arg_index];
            }

            operator_address::READ_SPAWN => {
                let var_index = self.read_u8(script)? as usize;
                let spawn_index = self.read_u8(script)? as usize;
                if var_index >= self.vars.len() || spawn_index >= self.spawns.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.vars[var_index] = self.spawns[spawn_index];
            }

            operator_address::WRITE_SPAWN => {
                let spawn_index = self.read_u8(script)? as usize;
                let var_index = self.read_u8(script)? as usize;
                if spawn_index >= self.spawns.len() || var_index >= self.vars.len() {
                    return Err(ScriptError::InvalidScript);
                }
                self.spawns[spawn_index] = self.vars[var_index];
            }

            // Entity property access operators
            operator_address::READ_CHARACTER_PROPERTY => {
                let character_id = self.read_u8(script)?;
                let var_index = self.read_u8(script)? as usize;
                let property_address = self.read_u8(script)?;
                context.read_character_property(self, character_id, var_index, property_address);
            }

            operator_address::WRITE_CHARACTER_PROPERTY => {
                let character_id = self.read_u8(script)?;
                let property_address = self.read_u8(script)?;
                let var_index = self.read_u8(script)? as usize;
                context.write_character_property(self, character_id, property_address, var_index);
            }

            operator_address::READ_SPAWN_PROPERTY => {
                let spawn_instance_id = self.read_u8(script)?;
                let var_index = self.read_u8(script)? as usize;
                let property_address = self.read_u8(script)?;
                context.read_spawn_property(self, spawn_instance_id, var_index, property_address);
            }

            operator_address::WRITE_SPAWN_PROPERTY => {
                let spawn_instance_id = self.read_u8(script)?;
                let property_address = self.read_u8(script)?;
                let var_index = self.read_u8(script)? as usize;
                context.write_spawn_property(self, spawn_instance_id, property_address, var_index);
            }

            // Invalid operator
            _ => return Err(ScriptError::InvalidOperator),
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
    fn execute_fixed_arithmetic(&mut self, script: &[u8], op: u8) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.fixed.len() || left >= self.fixed.len() || right >= self.fixed.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.fixed[dest] = match op {
            operator_address::ADD => self.fixed[left].add(self.fixed[right]),
            operator_address::SUB => self.fixed[left].sub(self.fixed[right]),
            operator_address::MUL => self.fixed[left].mul(self.fixed[right]),
            operator_address::DIV => self.fixed[left].div(self.fixed[right]),
            _ => unreachable!(),
        };

        Ok(())
    }

    fn execute_byte_arithmetic(&mut self, script: &[u8], op: u8) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            operator_address::ADD_BYTE => self.vars[left].saturating_add(self.vars[right]),
            operator_address::SUB_BYTE => self.vars[left].saturating_sub(self.vars[right]),
            operator_address::MUL_BYTE => self.vars[left].saturating_mul(self.vars[right]),
            operator_address::DIV_BYTE => {
                if self.vars[right] == 0 {
                    u8::MAX
                } else {
                    self.vars[left] / self.vars[right]
                }
            }
            operator_address::MOD_BYTE => {
                if self.vars[right] == 0 {
                    0
                } else {
                    self.vars[left] % self.vars[right]
                }
            }
            operator_address::WRAPPING_ADD => self.vars[left].wrapping_add(self.vars[right]),
            _ => unreachable!(),
        };

        Ok(())
    }

    fn execute_conditional(&mut self, script: &[u8], op: u8) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            operator_address::EQUAL => {
                if self.vars[left] == self.vars[right] {
                    1
                } else {
                    0
                }
            }
            operator_address::NOT_EQUAL => {
                if self.vars[left] != self.vars[right] {
                    1
                } else {
                    0
                }
            }
            operator_address::LESS_THAN => {
                if self.vars[left] < self.vars[right] {
                    1
                } else {
                    0
                }
            }
            operator_address::LESS_THAN_OR_EQUAL => {
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

    fn execute_logical_binary(&mut self, script: &[u8], op: u8) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            operator_address::OR => {
                if self.vars[left] != 0 || self.vars[right] != 0 {
                    1
                } else {
                    0
                }
            }
            operator_address::AND => {
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

    fn execute_utility_binary(&mut self, script: &[u8], op: u8) -> Result<(), ScriptError> {
        let dest = self.read_u8(script)? as usize;
        let left = self.read_u8(script)? as usize;
        let right = self.read_u8(script)? as usize;

        if dest >= self.vars.len() || left >= self.vars.len() || right >= self.vars.len() {
            return Err(ScriptError::InvalidScript);
        }

        self.vars[dest] = match op {
            operator_address::MIN => self.vars[left].min(self.vars[right]),
            operator_address::MAX => self.vars[left].max(self.vars[right]),
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
    /// Check if character is grounded (touching ground)
    fn is_grounded(&self) -> bool;
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

    /// Check if property address is compatible with character entity access
    fn is_character_property_compatible(&self, property_address: u8) -> bool {
        // Character properties: 0x10-0x3F
        // EntityCore properties: 0x40-0x4F
        (property_address >= 0x10 && property_address <= 0x3F)
            || (property_address >= 0x40 && property_address <= 0x4F)
    }

    /// Check if property address is compatible with spawn entity access
    fn is_spawn_property_compatible(&self, property_address: u8) -> bool {
        // Spawn properties: 0x50-0x7F
        // EntityCore properties: 0x40-0x4F
        (property_address >= 0x50 && property_address <= 0x7F)
            || (property_address >= 0x40 && property_address <= 0x4F)
    }

    /// Read character property by ID with compatibility checking
    fn read_character_property(
        &mut self,
        engine: &mut ScriptEngine,
        character_id: u8,
        var_index: usize,
        property_address: u8,
    ) {
        // Check property address compatibility
        if !self.is_character_property_compatible(property_address) {
            // Silent operation ignore for incompatible property addresses
            return;
        }

        // Delegate to implementation-specific method
        self.read_character_property_impl(engine, character_id, var_index, property_address);
    }

    /// Write character property by ID with compatibility checking
    fn write_character_property(
        &mut self,
        engine: &mut ScriptEngine,
        character_id: u8,
        property_address: u8,
        var_index: usize,
    ) {
        // Check property address compatibility
        if !self.is_character_property_compatible(property_address) {
            // Silent operation ignore for incompatible property addresses
            return;
        }

        // Delegate to implementation-specific method
        self.write_character_property_impl(engine, character_id, property_address, var_index);
    }

    /// Read spawn property by instance ID with compatibility checking
    fn read_spawn_property(
        &mut self,
        engine: &mut ScriptEngine,
        spawn_instance_id: u8,
        var_index: usize,
        property_address: u8,
    ) {
        // Check property address compatibility
        if !self.is_spawn_property_compatible(property_address) {
            // Silent operation ignore for incompatible property addresses
            return;
        }

        // Delegate to implementation-specific method
        self.read_spawn_property_impl(engine, spawn_instance_id, var_index, property_address);
    }

    /// Write spawn property by instance ID with compatibility checking
    fn write_spawn_property(
        &mut self,
        engine: &mut ScriptEngine,
        spawn_instance_id: u8,
        property_address: u8,
        var_index: usize,
    ) {
        // Check property address compatibility
        if !self.is_spawn_property_compatible(property_address) {
            // Silent operation ignore for incompatible property addresses
            return;
        }

        // Delegate to implementation-specific method
        self.write_spawn_property_impl(engine, spawn_instance_id, property_address, var_index);
    }

    /// Implementation-specific character property read (to be implemented by concrete types)
    fn read_character_property_impl(
        &mut self,
        _engine: &mut ScriptEngine,
        _character_id: u8,
        _var_index: usize,
        _property_address: u8,
    ) {
        // Default implementation: silently ignore invalid entity ID
        // Concrete implementations should override this method
    }

    /// Implementation-specific character property write (to be implemented by concrete types)
    fn write_character_property_impl(
        &mut self,
        _engine: &mut ScriptEngine,
        _character_id: u8,
        _property_address: u8,
        _var_index: usize,
    ) {
        // Default implementation: silently ignore invalid entity ID
        // Concrete implementations should override this method
    }

    /// Implementation-specific spawn property read (to be implemented by concrete types)
    fn read_spawn_property_impl(
        &mut self,
        _engine: &mut ScriptEngine,
        _spawn_instance_id: u8,
        _var_index: usize,
        _property_address: u8,
    ) {
        // Default implementation: silently ignore invalid entity ID
        // Concrete implementations should override this method
    }

    /// Implementation-specific spawn property write (to be implemented by concrete types)
    fn write_spawn_property_impl(
        &mut self,
        _engine: &mut ScriptEngine,
        _spawn_instance_id: u8,
        _property_address: u8,
        _var_index: usize,
    ) {
        // Default implementation: silently ignore invalid entity ID
        // Concrete implementations should override this method
    }
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
