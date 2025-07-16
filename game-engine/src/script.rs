//! Bytecode scripting system for game logic

use crate::math::Fixed;

/// Script execution engine
#[derive(Debug)]
pub struct ScriptEngine {
    /// Local variables for script execution
    variables: [ScriptValue; 16],
    /// Execution stack
    stack: [ScriptValue; 32],
    /// Current stack pointer
    stack_ptr: usize,
}

/// Script value types
#[derive(Debug, Clone, Copy)]
pub enum ScriptValue {
    Byte(u8),
    Fixed(Fixed),
    Bool(bool),
}

/// Bytecode operators for script execution
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Operator {
    // Control flow
    Exit = 0,
    Skip = 1,
    Goto = 2,

    // Arithmetic
    Add = 10,
    Sub = 11,
    Mul = 12,
    Div = 13,

    // Comparison
    Equal = 20,
    LessThan = 21,
    GreaterThan = 22,

    // Game actions
    LockAction = 30,
    Spawn = 31,
    ApplyDamage = 32,
    Move = 33,
    Jump = 34,

    // Property access
    GetHealth = 40,
    GetEnergy = 41,
    GetPosition = 42,
    GetVelocity = 43,

    // Stack operations
    Push = 50,
    Pop = 51,
    Duplicate = 52,

    // Variables
    LoadVar = 60,
    StoreVar = 61,
}

impl ScriptEngine {
    pub fn new() -> Self {
        Self {
            variables: [ScriptValue::Byte(0); 16],
            stack: [ScriptValue::Byte(0); 32],
            stack_ptr: 0,
        }
    }

    /// Execute a bytecode script
    pub fn execute(&mut self, script: &[u8]) -> Result<ScriptValue, ScriptError> {
        let mut pc = 0; // Program counter

        while pc < script.len() {
            let op_byte = script[pc];
            let operator = self.byte_to_operator(op_byte)?;

            match operator {
                Operator::Exit => break,
                Operator::Push => {
                    if pc + 1 >= script.len() {
                        return Err(ScriptError::InvalidScript);
                    }
                    let value = ScriptValue::Byte(script[pc + 1]);
                    self.push(value)?;
                    pc += 2;
                }
                Operator::Add => {
                    let b = self.pop()?;
                    let a = self.pop()?;
                    let result = self.add_values(a, b)?;
                    self.push(result)?;
                    pc += 1;
                }
                // Additional operators will be implemented in later tasks
                _ => {
                    pc += 1; // Skip unimplemented operators for now
                }
            }
        }

        // Return top of stack or default value
        if self.stack_ptr > 0 {
            Ok(self.stack[self.stack_ptr - 1])
        } else {
            Ok(ScriptValue::Bool(false))
        }
    }

    /// Convert byte to operator using efficient lookup
    fn byte_to_operator(&self, byte: u8) -> Result<Operator, ScriptError> {
        match byte {
            0 => Ok(Operator::Exit),
            1 => Ok(Operator::Skip),
            2 => Ok(Operator::Goto),
            10 => Ok(Operator::Add),
            11 => Ok(Operator::Sub),
            12 => Ok(Operator::Mul),
            13 => Ok(Operator::Div),
            20 => Ok(Operator::Equal),
            21 => Ok(Operator::LessThan),
            22 => Ok(Operator::GreaterThan),
            30 => Ok(Operator::LockAction),
            31 => Ok(Operator::Spawn),
            32 => Ok(Operator::ApplyDamage),
            33 => Ok(Operator::Move),
            34 => Ok(Operator::Jump),
            40 => Ok(Operator::GetHealth),
            41 => Ok(Operator::GetEnergy),
            42 => Ok(Operator::GetPosition),
            43 => Ok(Operator::GetVelocity),
            50 => Ok(Operator::Push),
            51 => Ok(Operator::Pop),
            52 => Ok(Operator::Duplicate),
            60 => Ok(Operator::LoadVar),
            61 => Ok(Operator::StoreVar),
            _ => Err(ScriptError::InvalidOperator),
        }
    }

    fn push(&mut self, value: ScriptValue) -> Result<(), ScriptError> {
        if self.stack_ptr >= self.stack.len() {
            return Err(ScriptError::StackOverflow);
        }
        self.stack[self.stack_ptr] = value;
        self.stack_ptr += 1;
        Ok(())
    }

    fn pop(&mut self) -> Result<ScriptValue, ScriptError> {
        if self.stack_ptr == 0 {
            return Err(ScriptError::StackUnderflow);
        }
        self.stack_ptr -= 1;
        Ok(self.stack[self.stack_ptr])
    }

    fn add_values(&self, a: ScriptValue, b: ScriptValue) -> Result<ScriptValue, ScriptError> {
        match (a, b) {
            (ScriptValue::Byte(a), ScriptValue::Byte(b)) => {
                Ok(ScriptValue::Byte(a.saturating_add(b)))
            }
            (ScriptValue::Fixed(a), ScriptValue::Fixed(b)) => Ok(ScriptValue::Fixed(a.add(b))),
            _ => Err(ScriptError::TypeMismatch),
        }
    }
}

/// Script execution errors
#[derive(Debug, Clone)]
pub enum ScriptError {
    InvalidScript,
    InvalidOperator,
    StackOverflow,
    StackUnderflow,
    TypeMismatch,
}

impl Default for ScriptEngine {
    fn default() -> Self {
        Self::new()
    }
}
