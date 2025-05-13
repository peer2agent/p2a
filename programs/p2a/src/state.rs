use anchor_lang::prelude::*;

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