use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct EscrowAccount {
    pub user: Pubkey,
    #[max_len(200)]
    pub package_name: String,
    pub deposit_amount: u64,
    pub status: EscrowStatus,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
    Active,
    Forfeited,
    Removed,
}
