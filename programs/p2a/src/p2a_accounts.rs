use anchor_lang::prelude::*;
use crate::state::{Apport, PermissionToTrade, ListOfFollow, SwapDelegate};
use crate::constants::*;


#[derive(Accounts)]
pub struct UserAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// PDA do pote: seeds = ["pote", signer]
    #[account(
        init_if_needed,
        payer = signer,
        space = APPORT_SIZE,
        seeds = [POTE_SEED, signer.key().as_ref()],
        bump
    )]
    pub pote: Account<'info, Apport>,
}

#[derive(Accounts)]
pub struct TraderAccount<'info> {
    /// Permissão de trade: seeds = ["permission", signer]
    #[account(
        init,
        payer = signer,
        space = PERMISSION_SIZE,
        seeds = [PERMISSION_SEED, signer.key().as_ref()],
        bump
    )]
    pub permission: Account<'info, PermissionToTrade>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// Lista de seguidores: seeds = ["follow_list", signer]
    #[account(
        init_if_needed,
        payer = signer,
        space = FOLLOW_LIST_SIZE,
        seeds = [FOLLOW_LIST_SEED, signer.key().as_ref()],
        bump
    )]
    pub follow_list: Account<'info, ListOfFollow>,
}

#[derive(Accounts)]
pub struct AddFollower<'info> {
    /// Lista de seguidores do trader
    #[account(
        mut,
        seeds = [FOLLOW_LIST_SEED, trader.key().as_ref()],
        bump
    )]
    pub follow_list: Account<'info, ListOfFollow>,

    /// CHECK: This is the trader's account that owns the follow list. We only use it as a seed for the PDA.
    pub trader: AccountInfo<'info>,

    /// The user who wants to follow the trader
    pub follower: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateApport<'info> {
    /// Mesma PDA de pote usada em UserAccount
    #[account(
        mut,
        seeds = [POTE_SEED, signer.key().as_ref()],
        bump
    )]
    pub pote: Account<'info, Apport>,

    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct DelegateSwapAuthority<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// PDA de swap authority: seeds = ["swap_authority", user]
    #[account(
        init_if_needed,
        payer = user,
        space = SWAP_DELEGATE_SIZE,
        seeds = [SWAP_AUTHORITY_SEED, user.key().as_ref()],
        bump
    )]
    pub swap_delegate: Account<'info, SwapDelegate>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteSwap<'info> {
    /// CHECK: This is the user's wallet that is authorized to execute the swap
    #[account(mut)]
    pub user: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [SWAP_AUTHORITY_SEED, user.key().as_ref()],
        bump
    )]
    /// CHECK: This is the PDA that will sign for transactions
    pub swap_authority: AccountInfo<'info>,
    
    /// CHECK: Jupiter program
    pub jupiter_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct TransferSol<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    
    /// CHECK: This is safe because we only transfer SOL to this account
    #[account(mut)]
    pub to: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

