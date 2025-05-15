use anchor_lang::prelude::*;
use crate::p2a_accounts::AddFollower;

pub fn handler(ctx: Context<AddFollower>) -> Result<()> {
    let follower_key = ctx.accounts.follower.key();
    let trader_key = ctx.accounts.trader.key();
    let list = &mut ctx.accounts.follow_list;
    
    msg!("👤 Processing follow request...");
    msg!("   Follower: {}", follower_key);
    msg!("   Trader: {}", trader_key);
    
    if list.follows.contains(&follower_key) {
        msg!("⚠️ Follow request rejected: User {} is already following trader {}", 
            follower_key, trader_key);
        return Ok(());
    }
    
    list.follows.push(follower_key);
    msg!("✅ Follow request successful!");
    msg!("   New follower {} added to trader {}'s list", follower_key, trader_key);
    msg!("   Total followers: {}", list.follows.len());
    Ok(())
}
