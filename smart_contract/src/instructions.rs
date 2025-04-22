use solana_program::{
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(Debug)]
pub enum AddTokenInstruction {
    /// Set a value to a recipient
    /// Fields: [amount: u32, recipient: Pubkey]
    Set { amount: u32, recipient: Pubkey },
}

impl AddTokenInstruction {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, rest) = input.split_first().ok_or(ProgramError::InvalidInstructionData)?;

        match tag {
            0 => {
                if rest.len() < 4 + 32 {
                    return Err(ProgramError::InvalidInstructionData);
                }

                let (amount_bytes, key_bytes) = rest.split_at(4);

                let amount = u32::from_le_bytes(amount_bytes.try_into().unwrap());
                let recipient = Pubkey::new_from_array(key_bytes.try_into().unwrap());

                Ok(Self::Set { amount, recipient })
            }
            _ => Err(ProgramError::InvalidInstructionData),
        }
    }
}
