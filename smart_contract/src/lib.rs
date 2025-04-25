use anchor_lang::prelude::*;

declare_id!("5BRwGqtuzRWX5c1eae5Yr4h2aqXuBuuSz9PpVDVa5wEZ");

#[program]
pub mod vai_project {
    use super::*;

    // user 
    pub fn make_transfer(ctx: Context<UserAccount>) -> Result<()> {
        Ok(())
    }

    pub fn make_apport(ctx: Context<UserAccount>, apport_value: u16) -> Result<()> {
        let pote = &mut ctx.accounts.pote;
        pote.amount = apport_value; 
        pote.signer = ctx.accounts.signer.key();
        Ok(())
    }

    //trader
    pub fn trader_is_allowed(ctx: Context<TraderAccount>) -> Result<()> {
        if !ctx.accounts.permission.is_allowed {
            return Err(ErrorCode::NotAllowed.into());
        }
        Ok(())
    }

    pub fn is_allowed(ctx: Context<CheckPermission>) -> Result<()> {
        ctx.accounts.permission.is_allowed = true;
        Ok(()) 
    }
}

#[derive(Accounts)]
pub struct UserAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,

    #[account(
        init,
        payer = signer,
        space = 8 + 2 + 32,
        seeds = [b"pote", signer.key().as_ref()],
        bump,
    )]
    pub pote: Account<'info, Apport>,
}

#[derive(Accounts)]
pub struct TraderAccount<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + 1,
        seeds = [b"permission", signer.key().as_ref()],
        bump,
    )]
    pub permission: Account<'info, PermissionToTrade>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CheckPermission<'info> {
    #[account(mut)]
    pub permission: Account<'info, PermissionToTrade>,
    pub signer: Signer<'info>,
}

#[account]
pub struct Apport {
    pub amount: u16,
    pub signer: Pubkey,
}

#[account]
pub struct PermissionToTrade {
    pub is_allowed: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Trader is not allowed")]
    NotAllowed,
}

