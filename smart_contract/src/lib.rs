use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
    program_error::ProgramError,
};

mod instructions;

use instructions::AddTokenInstruction;

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    use solana_program::{program::invoke, system_instruction, account_info::next_account_info};

    msg!("Hello, world!");
    msg!("I am programId-> {}", _program_id);
    msg!("I am accounts -> {:?}", accounts);
    msg!("I am instruction_data -> {:?}", instruction_data);

    let instruction = AddTokenInstruction::unpack(instruction_data)?;

    let account_info_iter = &mut accounts.iter();
    let payer_info = next_account_info(account_info_iter)?;          // [0]
    let system_program_info = next_account_info(account_info_iter)?; // [1]
    let recipient_info = next_account_info(account_info_iter)?;      // [2]

    match instruction {
        AddTokenInstruction::Set { amount, recipient } => {
            msg!("Instruction: Set {{ amount: {}, recipient: {} }}", amount, recipient);

            // Confirma se o recipient passado no instruction_data bate com o que está em accounts
            if *recipient_info.key != recipient {
                msg!("❌ Recipient mismatch!");
                return Err(ProgramError::InvalidAccountData);
            }

            let ix = system_instruction::transfer(
                payer_info.key,
                &recipient,
                amount as u64,
            );

            invoke(
                &ix,
                &[payer_info.clone(), recipient_info.clone(), system_program_info.clone()],
            )?;

            msg!("✅ Transferência de {} lamports feita para {}", amount, recipient);
        }
    }

    Ok(())
}
