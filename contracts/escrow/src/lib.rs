#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
    Disputed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub id: u32,
    pub description: String,
    pub amount: i128,
    pub status: MilestoneStatus,
    pub proof: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Gig {
    pub client: Address,
    pub freelancer: Address,
    pub arbiter: Address,
    pub milestones: Vec<Milestone>,
    pub total_funded: i128,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneInput {
    pub description: String,
    pub amount: i128,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    NextGigId,
    Gig(u32),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EscrowError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    GigNotFound = 3,
    Unauthorized = 4,
    InvalidMilestone = 5,
    InvalidAmount = 6,
    InvalidState = 7,
    DoubleRelease = 8,
    ActiveSubmissions = 9,
}

#[contract]
pub struct EscrowGigContract;

#[contractimpl]
impl EscrowGigContract {
    pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), EscrowError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(EscrowError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::NextGigId, &0u32);
        Ok(())
    }

    pub fn create_gig(
        env: Env,
        client: Address,
        freelancer: Address,
        arbiter: Address,
        milestones: Vec<MilestoneInput>,
    ) -> Result<u32, EscrowError> {
        Self::ensure_initialized(&env)?;
        client.require_auth();

        if milestones.is_empty() {
            return Err(EscrowError::InvalidMilestone);
        }

        let mut stored = Vec::new(&env);
        let mut total = 0i128;

        for (index, input) in milestones.iter().enumerate() {
            if input.amount <= 0 {
                return Err(EscrowError::InvalidAmount);
            }
            total = total
                .checked_add(input.amount)
                .ok_or(EscrowError::InvalidAmount)?;
            stored.push_back(Milestone {
                id: index as u32,
                description: input.description,
                amount: input.amount,
                status: MilestoneStatus::Pending,
                proof: String::from_str(&env, ""),
            });
        }

        let gig_id = Self::next_gig_id(&env)?;
        let gig = Gig {
            client,
            freelancer,
            arbiter,
            milestones: stored,
            total_funded: total,
            is_active: false,
        };

        env.storage().persistent().set(&DataKey::Gig(gig_id), &gig);
        env.storage()
            .instance()
            .set(&DataKey::NextGigId, &(gig_id + 1));
        Ok(gig_id)
    }

    pub fn fund_gig(env: Env, gig_id: u32) -> Result<(), EscrowError> {
        let mut gig = Self::load_gig(&env, gig_id)?;
        gig.client.require_auth();

        if gig.is_active {
            return Err(EscrowError::InvalidState);
        }

        let expected = Self::pending_total(&gig);
        if expected != gig.total_funded || expected <= 0 {
            return Err(EscrowError::InvalidAmount);
        }

        let token = Self::token_client(&env)?;
        token.transfer(&gig.client, &env.current_contract_address(), &expected);
        gig.is_active = true;
        Self::save_gig(&env, gig_id, &gig);
        Ok(())
    }

    pub fn submit_milestone(
        env: Env,
        gig_id: u32,
        milestone_id: u32,
        proof_url: String,
    ) -> Result<(), EscrowError> {
        let mut gig = Self::load_active_gig(&env, gig_id)?;
        gig.freelancer.require_auth();
        Self::update_milestone(&env, &mut gig, milestone_id, |mut milestone| {
            if milestone.status != MilestoneStatus::Pending {
                return Err(EscrowError::InvalidState);
            }
            milestone.status = MilestoneStatus::Submitted;
            milestone.proof = proof_url.clone();
            Ok(milestone)
        })?;
        Self::save_gig(&env, gig_id, &gig);
        Ok(())
    }

    pub fn approve_milestone(
        env: Env,
        gig_id: u32,
        milestone_id: u32,
    ) -> Result<(), EscrowError> {
        let mut gig = Self::load_active_gig(&env, gig_id)?;
        gig.client.require_auth();
        let freelancer = gig.freelancer.clone();
        let amount = Self::release_milestone(&env, &mut gig, milestone_id, freelancer)?;
        Self::save_gig(&env, gig_id, &gig);

        let token = Self::token_client(&env)?;
        token.transfer(
            &env.current_contract_address(),
            &gig.freelancer,
            &amount,
        );
        Ok(())
    }

    pub fn raise_dispute(env: Env, gig_id: u32, milestone_id: u32) -> Result<(), EscrowError> {
        let mut gig = Self::load_active_gig(&env, gig_id)?;
        gig.client.require_auth();

        Self::update_milestone(&env, &mut gig, milestone_id, |mut milestone| {
            if milestone.status == MilestoneStatus::Approved {
                return Err(EscrowError::DoubleRelease);
            }
            milestone.status = MilestoneStatus::Disputed;
            Ok(milestone)
        })?;
        Self::save_gig(&env, gig_id, &gig);
        Ok(())
    }

    pub fn raise_dispute_as(
        env: Env,
        caller: Address,
        gig_id: u32,
        milestone_id: u32,
    ) -> Result<(), EscrowError> {
        let mut gig = Self::load_active_gig(&env, gig_id)?;
        if caller != gig.client && caller != gig.freelancer {
            return Err(EscrowError::Unauthorized);
        }
        caller.require_auth();

        Self::update_milestone(&env, &mut gig, milestone_id, |mut milestone| {
            if milestone.status == MilestoneStatus::Approved {
                return Err(EscrowError::DoubleRelease);
            }
            milestone.status = MilestoneStatus::Disputed;
            Ok(milestone)
        })?;
        Self::save_gig(&env, gig_id, &gig);
        Ok(())
    }

    pub fn resolve_dispute(
        env: Env,
        gig_id: u32,
        milestone_id: u32,
        release_to: Address,
    ) -> Result<(), EscrowError> {
        let mut gig = Self::load_active_gig(&env, gig_id)?;
        gig.arbiter.require_auth();

        if release_to != gig.client && release_to != gig.freelancer {
            return Err(EscrowError::Unauthorized);
        }

        let amount = Self::release_milestone(&env, &mut gig, milestone_id, release_to.clone())?;
        Self::save_gig(&env, gig_id, &gig);

        let token = Self::token_client(&env)?;
        token.transfer(&env.current_contract_address(), &release_to, &amount);
        Ok(())
    }

    pub fn cancel_gig(env: Env, gig_id: u32) -> Result<(), EscrowError> {
        let mut gig = Self::load_gig(&env, gig_id)?;
        gig.client.require_auth();

        if gig.milestones.iter().any(|m| m.status != MilestoneStatus::Pending) {
            return Err(EscrowError::ActiveSubmissions);
        }

        if gig.is_active {
            let token = Self::token_client(&env)?;
            token.transfer(
                &env.current_contract_address(),
                &gig.client,
                &gig.total_funded,
            );
        }

        gig.is_active = false;
        Self::save_gig(&env, gig_id, &gig);
        Ok(())
    }

    pub fn get_gig(env: Env, gig_id: u32) -> Result<Gig, EscrowError> {
        Self::load_gig(&env, gig_id)
    }
}

impl EscrowGigContract {
    fn ensure_initialized(env: &Env) -> Result<(), EscrowError> {
        if !env.storage().instance().has(&DataKey::Token) {
            return Err(EscrowError::NotInitialized);
        }
        Ok(())
    }

    fn next_gig_id(env: &Env) -> Result<u32, EscrowError> {
        Self::ensure_initialized(env)?;
        env.storage()
            .instance()
            .get(&DataKey::NextGigId)
            .ok_or(EscrowError::NotInitialized)
    }

    fn token_client(env: &Env) -> Result<token::Client<'_>, EscrowError> {
        let token = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(EscrowError::NotInitialized)?;
        Ok(token::Client::new(env, &token))
    }

    fn load_gig(env: &Env, gig_id: u32) -> Result<Gig, EscrowError> {
        env.storage()
            .persistent()
            .get(&DataKey::Gig(gig_id))
            .ok_or(EscrowError::GigNotFound)
    }

    fn load_active_gig(env: &Env, gig_id: u32) -> Result<Gig, EscrowError> {
        let gig = Self::load_gig(env, gig_id)?;
        if !gig.is_active {
            return Err(EscrowError::InvalidState);
        }
        Ok(gig)
    }

    fn save_gig(env: &Env, gig_id: u32, gig: &Gig) {
        env.storage().persistent().set(&DataKey::Gig(gig_id), gig);
    }

    fn pending_total(gig: &Gig) -> i128 {
        gig.milestones.iter().map(|m| m.amount).sum()
    }

    fn update_milestone<F>(
        env: &Env,
        gig: &mut Gig,
        milestone_id: u32,
        mut update: F,
    ) -> Result<(), EscrowError>
    where
        F: FnMut(Milestone) -> Result<Milestone, EscrowError>,
    {
        if milestone_id >= gig.milestones.len() {
            return Err(EscrowError::InvalidMilestone);
        }

        let mut updated = Vec::new(env);
        for milestone in gig.milestones.iter() {
            if milestone.id == milestone_id {
                updated.push_back(update(milestone)?);
            } else {
                updated.push_back(milestone);
            }
        }
        gig.milestones = updated;
        Ok(())
    }

    fn release_milestone(
        env: &Env,
        gig: &mut Gig,
        milestone_id: u32,
        _release_to: Address,
    ) -> Result<i128, EscrowError> {
        let mut amount = 0i128;
        Self::update_milestone(env, gig, milestone_id, |mut milestone| {
            if milestone.status == MilestoneStatus::Approved {
                return Err(EscrowError::DoubleRelease);
            }
            if milestone.status != MilestoneStatus::Submitted
                && milestone.status != MilestoneStatus::Disputed
            {
                return Err(EscrowError::InvalidState);
            }
            amount = milestone.amount;
            milestone.status = MilestoneStatus::Approved;
            Ok(milestone)
        })?;
        Ok(amount)
    }
}
