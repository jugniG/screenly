use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::ErrorCode;
use crate::state::*;

#[derive(Accounts)]
pub struct Remove<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [PROGRAM_SEED, ESCROW_SEED, user.key().as_ref(), escrow.package_name.as_bytes()],
        bump,
    )]
    pub escrow: Account<'info, EscrowAccount>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = escrow,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, anchor_spl::token::Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Remove>) -> Result<()> {
    let clock = Clock::get()?;

    require!(
        ctx.accounts.escrow.status == EscrowStatus::Active,
        ErrorCode::NotActive
    );

    let deposit_amount = ctx.accounts.escrow.deposit_amount;
    let user_key = ctx.accounts.user.key();
    let package_bytes = ctx.accounts.escrow.package_name.as_bytes().to_vec();
    let bump = ctx.bumps.escrow;
    let seeds = &[
        PROGRAM_SEED,
        ESCROW_SEED,
        user_key.as_ref(),
        &package_bytes,
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, deposit_amount)?;

    let escrow = &mut ctx.accounts.escrow;
    escrow.status = EscrowStatus::Removed;
    escrow.resolved_at = Some(clock.unix_timestamp);

    Ok(())
}
