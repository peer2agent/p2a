use anchor_lang::prelude::*;
use anchor_lang::system_program;

pub fn handler(ctx: Context<crate::p2a_accounts::TransferSol>, amount: u64) -> Result<()> {
    // Create the transfer instruction
    let transfer_instruction = system_program::Transfer {
        from: ctx.accounts.from.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
    };

    // Execute the transfer with the specified amount
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
        ),
        amount,
    )?;

    msg!("Transferred {} lamports to {}", amount, ctx.accounts.to.key());
    Ok(())
} 