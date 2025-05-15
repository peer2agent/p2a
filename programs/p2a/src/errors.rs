use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Trader is not allowed")]
    NotAllowed,
    #[msg("Overflow detected during apport update")]
    Overflow,
    #[msg("User is already following this trader")]
    AlreadyFollowing,
    #[msg("Follow list is at maximum capacity")]
    FollowListFull,
}