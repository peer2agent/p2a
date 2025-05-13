use anchor_lang::prelude::*;
use crate::p2a_accounts::TraderAccount;

pub fn handler(ctx: Context<TraderAccount>) -> Result<()> {
    ctx.accounts.permission.is_allowed = true;
    Ok(())
}