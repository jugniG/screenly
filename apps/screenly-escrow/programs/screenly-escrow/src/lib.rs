use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

pub mod constants;
pub mod errors;
pub mod state;

use crate::constants::*;
use crate::errors::ErrorCode;
use crate::state::*;

declare_id!("9e9aVVCftMkbqH9aVA1bmcRB5LmHT7mBnvmAqUXxMyfb");

// ── Deposit ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(package_name: String, amount: u64)]
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

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = usdc_mint,
        associated_token::authority = escrow,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// ── GiveIn ───────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct GiveIn<'info> {
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

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

// ── Remove ───────────────────────────────────────────────────────────────────

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

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

// ── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod screenly_escrow {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, package_name: String, amount: u64) -> Result<()> {
        require!(
            ctx.accounts.user_token_account.amount >= MIN_DEPOSIT_AMOUNT,
            ErrorCode::InvalidDepositAmount
        );
        require!(
            amount >= MIN_DEPOSIT_AMOUNT,
            ErrorCode::InvalidDepositAmount
        );

        let bump = ctx.bumps.escrow;
        let user_key = ctx.accounts.user.key();
        let seeds = &[
            PROGRAM_SEED,
            ESCROW_SEED,
            user_key.as_ref(),
            package_name.as_bytes(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.user = ctx.accounts.user.key();
        escrow.package_name = package_name;
        escrow.deposit_amount = amount;
        escrow.status = EscrowStatus::Active;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.resolved_at = None;

        Ok(())
    }

    pub fn give_in(ctx: Context<GiveIn>) -> Result<()> {
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
        escrow.status = EscrowStatus::Forfeited;
        escrow.resolved_at = Some(clock.unix_timestamp);

        Ok(())
    }

    pub fn remove(ctx: Context<Remove>) -> Result<()> {
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
}
