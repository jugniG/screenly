use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

use crate::constants::*;
use crate::errors::ErrorCode;
use crate::state::*;

#[derive(Accounts)]
#[instruction(package_name: String)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + EscrowAccount::INIT_SPACE,
        seeds = [PROGRAM_SEED, ESCROW_SEED, user.key().as_ref(), package_name.as_bytes()],
        bump,
    )]
    pub escrow: Account<'info, EscrowAccount>,

    /// User's USDC token account
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    /// Escrow's PDA USDC token account (created if needed)
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = usdc_mint,
        associated_token::authority = escrow,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// USDC mint
    pub usdc_mint: Account<'info, Mint>,

    /// System programs
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Deposit>, package_name: String) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;

    require!(
        ctx.accounts.user_token_account.amount >= DEPOSIT_AMOUNT,
        ErrorCode::InvalidDepositAmount
    );

    // Transfer $5 USDC from user -> escrow PDA ATA
    let bump = ctx.bumps.escrow;
    let user_key = ctx.accounts.user.key();
    let seeds = &[
        PROGRAM_SEED,
        ESCROW_SEED,
        user_key.as_ref(),
        package_name.as_bytes(),
        &[bump],
    ];
    let _signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, DEPOSIT_AMOUNT)?;

    escrow.user = ctx.accounts.user.key();
    escrow.package_name = package_name;
    escrow.deposit_amount = DEPOSIT_AMOUNT;
    escrow.status = EscrowStatus::Active;
    escrow.created_at = Clock::get()?.unix_timestamp;
    escrow.resolved_at = None;

    Ok(())
}
