use anchor_lang::prelude::*;
use crate::p2a_accounts::UserAccount;

pub fn handler(ctx: Context<UserAccount>, apport_value: u16) -> Result<()> {
    let pot = &mut ctx.accounts.pote;
    pot.amount = apport_value;
    pot.signer = ctx.accounts.signer.key();
    Ok(())
}
