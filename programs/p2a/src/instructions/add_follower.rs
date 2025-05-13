use anchor_lang::prelude::*;
use crate::p2a_accounts::AddFollower;
use crate::errors::ErrorCode;

pub fn handler(ctx: Context<AddFollower>, new_follower: Pubkey) -> Result<()> {
    require!(
        new_follower != ctx.accounts.signer.key(),
        ErrorCode::NotAllowed
    );
    let list = &mut ctx.accounts.follow_list;
    if list.follows.contains(&new_follower) {
        msg!("⚠️ Already a follower");
        return Ok(());
    }
    list.follows.push(new_follower);
    msg!("✅ Added follower: {}", new_follower);
    Ok(())
}
