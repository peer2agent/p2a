use anchor_lang::prelude::*;

/// Represents the result of a swap operation
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SwapResult {
    pub amount_in: u64,
    pub amount_out: u64,
    pub token_in: Pubkey,
    pub token_out: Pubkey,
}

/// Configuration for swap limits
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SwapLimits {
    pub min_amount_out: u64,
    pub max_amount_in: u64,
}

/// Status of a trader's activity
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum TraderStatus {
    Active,
    Suspended,
    Pending,
} 