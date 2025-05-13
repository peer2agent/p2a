use anchor_lang::prelude::*;
use crate::p2a_accounts::DelegateSwapAuthority;

pub fn handler(ctx: Context<DelegateSwapAuthority>) -> Result<()> {
    let del = &mut ctx.accounts.swap_delegate;
    del.owner = ctx.accounts.user.key();
    msg!("✅ Swap authority delegated to PDA for user: {}", del.owner);
    Ok(())
}
