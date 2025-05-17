use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::p2a_accounts::TransferSol;

pub fn handler(ctx: Context<TransferSol>, amount: u64) -> Result<()> {
  let authority_key = ctx.accounts.authority.key();
  let bump = ctx.bumps.swap_authority;
  
  let seeds = &[
    b"swap_authority" as &[u8],
    authority_key.as_ref(),
    &[bump],
  ];
  let signer_seeds = &[&seeds[..]];

  let cpi_accounts = system_program::Transfer {
    from: ctx.accounts.swap_authority.to_account_info(),
    to:   ctx.accounts.to.to_account_info(),
  };
  
  let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.system_program.to_account_info(),
    cpi_accounts,
    signer_seeds,
  );
  
  system_program::transfer(cpi_ctx, amount)?;
  Ok(())
}
