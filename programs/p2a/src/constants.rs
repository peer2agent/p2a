pub const POTE_SEED: &[u8] = b"pote";
pub const PERMISSION_SEED: &[u8] = b"permission";
pub const FOLLOW_LIST_SEED: &[u8] = b"follow_list";
pub const SWAP_AUTHORITY_SEED: &[u8] = b"swap_authority";

// Space constants for account sizes
pub const APPORT_SIZE: usize = 8 + 2 + 32; // discriminator + amount + signer
pub const PERMISSION_SIZE: usize = 8 + 1;   // discriminator + is_allowed
pub const FOLLOW_LIST_BASE_SIZE: usize = 8 + 4; // discriminator + vec length
pub const MAX_FOLLOWERS: usize = 100;
pub const FOLLOW_LIST_SIZE: usize = FOLLOW_LIST_BASE_SIZE + (32 * MAX_FOLLOWERS); // Base + (pubkey size * max followers)
pub const SWAP_DELEGATE_SIZE: usize = 8 + 32; // discriminator + owner 