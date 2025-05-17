// in your p2a program
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::p2a_accounts::DepositToPda;

pub fn handler(ctx: Context<DepositToPda>, amount: u64) -> Result<()> {
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.authority.to_account_info(),
        to:   ctx.accounts.swap_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        cpi_accounts,
    );
    system_program::transfer(cpi_ctx, amount)?;
    Ok(())
}
