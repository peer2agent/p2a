use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{Instruction, AccountMeta},
    program::invoke_signed,
};

declare_id!("9uWnELB4ExQ4HY4YhSPb6pkGchaLCzty1BryX8w5xqVu");

#[program]
pub mod p2a {
    use super::*;

    /// Cria ou atualiza o pote do usuário, armazenando um valor inicial.
    pub fn make_apport(ctx: Context<UserAccount>, apport_value: u16) -> Result<()> {
        let pote = &mut ctx.accounts.pote;
        pote.amount = apport_value;
        pote.signer = ctx.accounts.signer.key();
        Ok(())
    }

    /// Verifica se o trader está autorizado a operar.
    pub fn trader_is_allowed(ctx: Context<TraderAccount>) -> Result<()> {
        if !ctx.accounts.permission.is_allowed {
            return Err(ErrorCode::NotAllowed.into());
        }
        Ok(())
    }

    /// Inicializa a permissão de um trader para operar.
    pub fn initialize_trader(ctx: Context<TraderAccount>) -> Result<()> {
        ctx.accounts.permission.is_allowed = true;
        Ok(())
    }

    /// Adiciona um seguidor à lista derivada do trader (PDA).
    pub fn add_follower(ctx: Context<AddFollower>, new_follower: Pubkey) -> Result<()> {
        let follow_list = &mut ctx.accounts.follow_list;
        require!(
            new_follower != ctx.accounts.signer.key(),
            ErrorCode::NotAllowed
        );
        if follow_list.follows.contains(&new_follower) {
            msg!("⚠️ O usuário já é um seguidor.");
            return Ok(());
        }
        follow_list.follows.push(new_follower);
        msg!("✅ Novo seguidor adicionado: {}", new_follower);
        Ok(())
    }

    /// Atualiza o valor do pote, só permitindo que o dono original faça isso.
    pub fn update_apport(ctx: Context<UpdateApport>, additional_value: u16) -> Result<()> {
        let pote = &mut ctx.accounts.pote;
        require!(
            pote.signer == ctx.accounts.signer.key(),
            ErrorCode::NotAllowed
        );
        pote.amount = pote
            .amount
            .checked_add(additional_value)
            .ok_or(ErrorCode::Overflow)?;
        msg!("✅ Novo valor acumulado no pote: {}", pote.amount);
        Ok(())
    }

    /// Cria ou atualiza a conta PDA que delega autoridade de swap ao programa.
    pub fn delegate_swap_authority(ctx: Context<DelegateSwapAuthority>) -> Result<()> {
        let delegate = &mut ctx.accounts.swap_delegate;
        delegate.owner = ctx.accounts.user.key();
        msg!(
            "✅ Swap authority delegated to PDA for user: {}",
            delegate.owner
        );
        Ok(())
    }

    pub fn execute_swap(ctx: Context<ExecuteSwap>, instruction_data: Vec<u8>) -> Result<()> {
        // Verify the swap authority PDA
        let seeds = &[
            b"swap_authority",
            ctx.accounts.user.key.as_ref(),
            &[ctx.bumps.swap_authority],
        ];
        
        // Create a CPI instruction to Jupiter
        // IMPORTANT: Don't try to deserialize the instruction_data
        // or parse accounts from it - that's what's causing memory issues
        let jupiter_ix = Instruction {
            program_id: ctx.accounts.jupiter_program.key(),
            accounts: vec![], // Leave this empty, we'll use account_infos instead
            data: instruction_data,
        };
        
        // Get account infos from remaining accounts
        let account_infos = ctx.remaining_accounts;
        
        // Invoke the Jupiter program with PDA signing
        invoke_signed(
            &jupiter_ix,
            &account_infos,
            &[seeds],
        )?;
        
        Ok(())
    }
}

//
// Contextos de contas (com seeds + bump onde é necessário)
//

#[derive(Accounts)]
pub struct UserAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// PDA do pote: seeds = ["pote", signer]
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + 2 + 32,
        seeds = [b"pote", signer.key().as_ref()],
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
        space = 8 + 1,
        seeds = [b"permission", signer.key().as_ref()],
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
        space = 8 + 4 + (32 * 100),
        seeds = [b"follow_list", signer.key().as_ref()],
        bump
    )]
    pub follow_list: Account<'info, ListOfFollow>,
}

#[derive(Accounts)]
pub struct AddFollower<'info> {
    /// Mesma PDA de follow_list usada em TraderAccount
    #[account(
        mut,
        seeds = [b"follow_list", signer.key().as_ref()],
        bump
    )]
    pub follow_list: Account<'info, ListOfFollow>,

    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateApport<'info> {
    /// Mesma PDA de pote usada em UserAccount
    #[account(
        mut,
        seeds = [b"pote", signer.key().as_ref()],
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
        space = 8 + 32,
        seeds = [b"swap_authority", user.key().as_ref()],
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
        seeds = [b"swap_authority", user.key().as_ref()],
        bump
    )]
    /// CHECK: This is the PDA that will sign for transactions
    pub swap_authority: AccountInfo<'info>,
    
    /// CHECK: Jupiter program
    pub jupiter_program: AccountInfo<'info>,
    
    // Remaining accounts will be passed through to the Jupiter program
    // WITHOUT trying to deserialize them
}

//
// Structs de dados on‐chain
//

/// Autoridade de swap delegada (PDA)
#[account]
pub struct SwapDelegate {
    pub owner: Pubkey,
}

/// Pote de aportes
#[account]
pub struct Apport {
    pub amount: u16,
    pub signer: Pubkey,
}

/// Permissão para trade
#[account]
pub struct PermissionToTrade {
    pub is_allowed: bool,
}

/// Lista de seguidores
#[account]
pub struct ListOfFollow {
    pub follows: Vec<Pubkey>,
}

/// Exemplo de estrutura para autorizar swap (não usada diretamente acima)
#[account]
pub struct SwapAuthorization {
    pub owner: Pubkey,
    pub executor: Pubkey,
    pub token_in: Pubkey,
    pub token_out: Pubkey,
    pub amount: u64,
    pub is_active: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Trader is not allowed")]
    NotAllowed,

    #[msg("Overflow detected during apport update")]
    Overflow,
}
