use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Escrow account is not active")]
    NotActive,
    #[msg("Escrow already resolved (forfeited or removed)")]
    AlreadyResolved,
    #[msg("Only the rule owner can perform this action")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Deposit amount must match $5 USDC")]
    InvalidDepositAmount,
}
