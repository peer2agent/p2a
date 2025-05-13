use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{Instruction},
    program::invoke_signed,
};
use crate::p2a_accounts::ExecuteSwap;

pub fn handler(
    ctx: Context<ExecuteSwap>,
    instruction_data: Vec<u8>
) -> Result<()> {
    let seeds = &[
        b"swap_authority",
        ctx.accounts.user.key.as_ref(),
        &[ctx.bumps.swap_authority],
    ];
    let ix = Instruction {
        program_id: ctx.accounts.jupiter_program.key(),
        accounts: vec![],
        data: instruction_data,
    };
    invoke_signed(&ix, &ctx.remaining_accounts, &[seeds])?;
    Ok(())
}
