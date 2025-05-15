use anchor_lang::prelude::*;
use crate::p2a_accounts::*;

pub mod p2a_accounts;
pub mod instructions;
pub mod state;
pub mod errors;
pub mod constants;
pub mod types;

declare_id!("9uWnELB4ExQ4HY4YhSPb6pkGchaLCzty1BryX8w5xqVu");

#[program]
pub mod p2a {
    use super::*;

    pub fn transfer_sol(
        ctx: Context<TransferSol>,
        amount: u64
    ) -> Result<()> {
        instructions::transfer_sol::handler(ctx, amount)
    }

    pub fn make_apport(
        ctx: Context<UserAccount>,
        apport_value: u16
    ) -> Result<()> {
        instructions::make_apport::handler(ctx, apport_value)
    }

    pub fn trader_is_allowed(
        ctx: Context<TraderAccount>
    ) -> Result<()> {
        instructions::trader_is_allowed::handler(ctx)
    }

    pub fn initialize_trader(
        ctx: Context<TraderAccount>
    ) -> Result<()> {
        instructions::initialize_trader::handler(ctx)
    }

    pub fn add_follower(
        ctx: Context<AddFollower>,
    ) -> Result<()> {
        instructions::add_follower::handler(ctx)
    }

    pub fn update_apport(
        ctx: Context<UpdateApport>,
        additional_value: u16
    ) -> Result<()> {
        instructions::update_apport::handler(ctx, additional_value)
    }

    pub fn delegate_swap_authority(
        ctx: Context<DelegateSwapAuthority>
    ) -> Result<()> {
        instructions::delegate_swap_authority::handler(ctx)
    }

    pub fn execute_swap(
        ctx: Context<ExecuteSwap>,
        instruction_data: Vec<u8>
    ) -> Result<()> {
        instructions::execute_swap::handler(ctx, instruction_data)
    }
}