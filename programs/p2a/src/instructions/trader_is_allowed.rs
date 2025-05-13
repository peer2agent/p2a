use anchor_lang::prelude::*;
use crate::p2a_accounts::TraderAccount;
use crate::errors::ErrorCode;

pub fn handler(ctx: Context<TraderAccount>) -> Result<()> {
    if !ctx.accounts.permission.is_allowed {
        return Err(ErrorCode::NotAllowed.into());
    }
    Ok(())
}
