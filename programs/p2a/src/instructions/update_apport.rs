use anchor_lang::prelude::*;
use crate::p2a_accounts::UpdateApport;
use crate::errors::ErrorCode;

pub fn handler(ctx: Context<UpdateApport>, additional_value: u16) -> Result<()> {
    let pot = &mut ctx.accounts.pote;
    require!(
        pot.signer == ctx.accounts.signer.key(),
        ErrorCode::NotAllowed
    );
    pot.amount = pot
        .amount
        .checked_add(additional_value)
        .ok_or(ErrorCode::Overflow)?;
    msg!("✅ New total: {}", pot.amount);
    Ok(())
}
