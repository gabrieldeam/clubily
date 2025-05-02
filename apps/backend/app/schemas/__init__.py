# Pydantic Schemas for Loyalty Ecosystem

from pydantic import BaseModel, EmailStr, Field, Json
from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from datetime import datetime, timedelta, date

# --- Base Schemas (Common fields) ---

class BaseSchema(BaseModel):
    class Config:
        from_attributes = True # Pydantic V2 replacement for orm_mode

class TimestampSchema(BaseModel):
    created_at: datetime
    updated_at: datetime

# --- Profile Schemas ---

class ProfileBase(BaseSchema):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: str = Field(default="customer", description="User role (customer, merchant_admin, third_party_advertiser, system_admin)")
    raw_user_meta_data: Optional[Dict[str, Any]] = None

class ProfileCreate(ProfileBase):
    id: UUID # Comes from Supabase Auth
    email: EmailStr
    cpf_hash: Optional[str] = None # Hash is generated in backend, not provided by client directly usually

class ProfileUpdate(BaseSchema):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    raw_user_meta_data: Optional[Dict[str, Any]] = None
    # Role and CPF hash updates might need specific endpoints/permissions

class ProfileInDBBase(ProfileBase, TimestampSchema):
    id: UUID
    cpf_hash: Optional[str] = None

class Profile(ProfileInDBBase):
    pass

# --- Store Schemas ---

class StoreBase(BaseSchema):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: bool = True
    configuration: Optional[Dict[str, Any]] = None

class StoreCreate(StoreBase):
    # owner_id will be set based on the authenticated user (merchant_admin)
    pass

class StoreUpdate(BaseSchema):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = None
    configuration: Optional[Dict[str, Any]] = None

class StoreInDBBase(StoreBase, TimestampSchema):
    id: UUID
    owner_id: UUID

class Store(StoreInDBBase):
    pass

# --- Visit Schemas ---

class VisitBase(BaseSchema):
    store_id: UUID
    profile_id: Optional[UUID] = None # Can be anonymous
    method: str # Method used for the visit (e.g., 'kiosk', 'app', 'manual')


    metadata: Optional[Dict[str, Any]] = None

class VisitCreate(BaseSchema): # Input for check-in endpoint
    store_id: UUID
    identifier: Optional[str] = None # e.g., CPF, phone, email for identifying user
    identifier_type: Optional[str] = None # e.g., 'cpf', 'phone', 'email'
    metadata: Optional[Dict[str, Any]] = None

class VisitInDBBase(VisitBase, TimestampSchema):
    id: UUID

class Visit(VisitInDBBase):
    pass

# --- Survey Schemas ---

class SurveyQuestion(BaseModel):
    id: str
    type: str # e.g., 'rating', 'text', 'multiple_choice', 'single_choice'
    text: str
    options: Optional[List[str]] = None # For choice types
    required: bool = False

class SurveyBase(BaseSchema):
    title: str
    description: Optional[str] = None
    questions: List[SurveyQuestion]
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_responses: Optional[int] = None
    target_audience: Optional[Dict[str, Any]] = None
    store_id: Optional[UUID] = None # Optional link to a store

class SurveyCreate(SurveyBase):
    # creator_id will be set based on authenticated user
    pass

class SurveyUpdate(BaseSchema):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[SurveyQuestion]] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_responses: Optional[int] = None
    target_audience: Optional[Dict[str, Any]] = None
    store_id: Optional[UUID] = None

class SurveyInDBBase(SurveyBase, TimestampSchema):
    id: UUID
    creator_id: UUID

class Survey(SurveyInDBBase):
    pass

# --- Survey Response Schemas ---

class SurveyResponseBase(BaseSchema):
    survey_id: UUID
    response_data: Dict[str, Any] # Answers keyed by question ID
    profile_id: Optional[UUID] = None # Can be anonymous
    store_id: Optional[UUID] = None # Context
    visit_id: Optional[UUID] = None # Optional link

class SurveyResponseCreate(BaseSchema): # Input for answer endpoint
    response_data: Dict[str, Any]
    identifier: Optional[str] = None # For identifying user if anonymous
    identifier_type: Optional[str] = None
    store_id: Optional[UUID] = None # Context
    visit_id: Optional[UUID] = None # Optional link

class SurveyResponseInDBBase(SurveyResponseBase, TimestampSchema):
    id: UUID

class SurveyResponse(SurveyResponseInDBBase):
    pass

# --- Ad Campaign Schemas ---

class AdCampaignBase(BaseSchema):
    name: str
    content_type: str # e.g., 'image', 'video', 'html'
    content_url: Optional[str] = None
    content_data: Optional[Dict[str, Any]] = None
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    display_locations: Optional[List[str]] = None # e.g., ['kiosk_idle', 'kiosk_success']
    target_audience: Optional[Dict[str, Any]] = None
    max_impressions: Optional[int] = None
    store_id: Optional[UUID] = None # Optional link to a store

class AdCampaignCreate(AdCampaignBase):
    # creator_id will be set based on authenticated user
    pass

class AdCampaignUpdate(BaseSchema):
    name: Optional[str] = None
    content_type: Optional[str] = None
    content_url: Optional[str] = None
    content_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    display_locations: Optional[List[str]] = None
    target_audience: Optional[Dict[str, Any]] = None
    max_impressions: Optional[int] = None
    store_id: Optional[UUID] = None
    # current_impressions update handled internally

class AdCampaignInDBBase(AdCampaignBase, TimestampSchema):
    id: UUID
    creator_id: UUID
    current_impressions: int = 0

class AdCampaign(AdCampaignInDBBase):
    pass

class AdCampaignNextRequest(BaseSchema):
    store_id: UUID
    location: str # e.g., 'kiosk_idle'
    user_context: Optional[Dict[str, Any]] = None # For targeting

# --- Rule Schemas ---

class RuleCondition(BaseModel):
    # Define structure based on expected conditions
    # Example: min_purchase_value: Optional[float] = None
    # Example: required_survey_id: Optional[UUID] = None
    pass

class RuleAction(BaseModel):
    grant_points: Optional[int] = None
    grant_badge_id: Optional[UUID] = None
    # Add other possible actions

class RuleBase(BaseSchema):
    name: str
    description: Optional[str] = None
    event_type: str # e.g., 'visit', 'survey_response', 'purchase'
    conditions: Optional[RuleCondition] = None # Using Json type might be simpler if complex
    actions: RuleAction # Using Json type might be simpler
    is_active: bool = True
    cooldown_period_seconds: Optional[int] = None # Store as seconds for easier calculation
    max_activations_per_user: Optional[int] = None
    max_total_activations: Optional[int] = None

class RuleCreate(RuleBase):
    store_id: UUID # Must be provided on creation

class RuleUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    conditions: Optional[RuleCondition] = None
    actions: Optional[RuleAction] = None
    is_active: Optional[bool] = None
    cooldown_period_seconds: Optional[int] = None
    max_activations_per_user: Optional[int] = None
    max_total_activations: Optional[int] = None

class RuleInDBBase(RuleBase, TimestampSchema):
    id: UUID
    store_id: UUID

class Rule(RuleInDBBase):
    pass

# --- Badge Schemas ---

class BadgeBase(BaseSchema):
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    criteria: Optional[str] = None
    store_id: Optional[UUID] = None # Optional: store-specific badges

class BadgeCreate(BadgeBase):
    pass

class BadgeUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    icon_url: Optional[str] = None
    criteria: Optional[str] = None
    store_id: Optional[UUID] = None

class BadgeInDBBase(BadgeBase, TimestampSchema):
    id: UUID

class Badge(BadgeInDBBase):
    pass

# --- UserBadge Schemas ---

class UserBadgeBase(BaseSchema):
    profile_id: UUID
    badge_id: UUID
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    rule_id: Optional[UUID] = None
    visit_id: Optional[UUID] = None

class UserBadgeCreate(UserBadgeBase):
    pass # Created internally by rules engine

class UserBadgeInDBBase(UserBadgeBase):
    id: UUID
    created_at: datetime # From DB

class UserBadge(UserBadgeInDBBase):
    badge: Optional[Badge] = None # Include badge details when fetching

# --- Reward Schemas ---

class RewardBase(BaseSchema):
    name: str
    description: Optional[str] = None
    reward_type: str # e.g., 'discount_percentage', 'discount_fixed', 'free_item', 'points_voucher'
    value: Optional[float] = None
    item_name: Optional[str] = None
    points_cost: Optional[int] = None
    is_active: bool = True
    max_redemptions_per_user: Optional[int] = None
    max_total_redemptions: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None

class RewardCreate(RewardBase):
    store_id: UUID # Must be provided

class RewardUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    reward_type: Optional[str] = None
    value: Optional[float] = None
    item_name: Optional[str] = None
    points_cost: Optional[int] = None
    is_active: Optional[bool] = None
    max_redemptions_per_user: Optional[int] = None
    max_total_redemptions: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None

class RewardInDBBase(RewardBase, TimestampSchema):
    id: UUID
    store_id: UUID

class Reward(RewardInDBBase):
    pass

# --- UserReward Schemas ---

class UserRewardBase(BaseSchema):
    profile_id: UUID
    reward_id: UUID
    store_id: UUID
    redeemed_at: datetime = Field(default_factory=datetime.utcnow)
    used_at: Optional[datetime] = None
    status: str = Field(default='redeemed') # 'redeemed', 'used', 'expired'
    redemption_code: Optional[str] = None
    points_spent: Optional[int] = None

class UserRewardCreate(BaseSchema):
    # Typically created internally during redemption process
    reward_id: UUID
    # profile_id and store_id derived from context/request

class UserRewardUpdate(BaseSchema):
    # For merchant marking as used
    status: Optional[str] = None
    used_at: Optional[datetime] = None

class UserRewardInDBBase(UserRewardBase):
    id: UUID
    created_at: datetime # From DB

class UserReward(UserRewardInDBBase):
    reward: Optional[Reward] = None # Include reward details

# --- UserPoints Schemas ---

class UserPointsBase(BaseSchema):
    profile_id: UUID
    store_id: UUID
    balance: int = 0

class UserPointsInDBBase(UserPointsBase, TimestampSchema):
    id: UUID

class UserPoints(UserPointsInDBBase):
    pass

# --- PointTransaction Schemas ---

class PointTransactionBase(BaseSchema):
    profile_id: UUID
    store_id: UUID
    change: int
    balance_after: int
    transaction_type: str # e.g., 'rule_grant', 'reward_redemption', 'manual_adjustment'
    related_rule_id: Optional[UUID] = None
    related_visit_id: Optional[UUID] = None
    related_reward_id: Optional[UUID] = None
    notes: Optional[str] = None

class PointTransactionCreate(PointTransactionBase):
    # Created internally by RPC functions or adjustments
    pass

class PointTransactionInDBBase(PointTransactionBase):
    id: UUID
    created_at: datetime # From DB

class PointTransaction(PointTransactionInDBBase):
    pass

# --- Billing Subscription Schemas ---

class BillingSubscriptionBase(BaseSchema):
    store_id: UUID
    profile_id: UUID
    plan_id: str # e.g., 'free', 'basic', 'premium'
    status: str # e.g., 'active', 'trialing', 'past_due', 'canceled'
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    stripe_price_id: Optional[str] = None
    cancel_at_period_end: bool = False

class BillingSubscriptionCreate(BaseSchema):
    # Likely handled via webhook or specific setup endpoint
    store_id: UUID
    plan_id: str
    # profile_id from auth context
    # Stripe details might come from Stripe API call

class BillingSubscriptionUpdate(BaseSchema):
    # Likely handled via webhook
    plan_id: Optional[str] = None
    status: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    stripe_price_id: Optional[str] = None
    cancel_at_period_end: Optional[bool] = None

class BillingSubscriptionInDBBase(BillingSubscriptionBase, TimestampSchema):
    id: UUID

class BillingSubscription(BillingSubscriptionInDBBase):
    pass

# --- Billing Invoice Schemas ---

class BillingInvoiceBase(BaseSchema):
    subscription_id: UUID
    store_id: UUID
    profile_id: UUID
    amount_due: float
    amount_paid: Optional[float] = None
    currency: str
    status: str # e.g., 'draft', 'open', 'paid', 'uncollectible', 'void'
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    stripe_invoice_id: Optional[str] = None
    invoice_pdf_url: Optional[str] = None
    billing_reason: Optional[str] = None

class BillingInvoiceCreate(BillingInvoiceBase):
    # Likely created via webhook
    pass

class BillingInvoiceUpdate(BaseSchema):
    # Likely updated via webhook
    amount_paid: Optional[float] = None
    status: Optional[str] = None
    paid_at: Optional[datetime] = None
    invoice_pdf_url: Optional[str] = None

class BillingInvoiceInDBBase(BillingInvoiceBase, TimestampSchema):
    id: UUID

class BillingInvoice(BillingInvoiceInDBBase):
    pass

# --- UserRuleActivation Schemas ---

class UserRuleActivationBase(BaseSchema):
    profile_id: UUID
    rule_id: UUID
    store_id: UUID
    activated_at: datetime = Field(default_factory=datetime.utcnow)
    visit_id: Optional[UUID] = None
    survey_response_id: Optional[UUID] = None

class UserRuleActivationCreate(UserRuleActivationBase):
    # Created internally by rules engine
    pass

class UserRuleActivationInDBBase(UserRuleActivationBase):
    id: UUID
    created_at: datetime # From DB

class UserRuleActivation(UserRuleActivationInDBBase):
    pass

# --- Token Schemas (For potential custom auth, though Supabase handles primary) ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    # Add other relevant claims like role, email etc.
    role: Optional[str] = None

# --- Generic Response Schemas ---

class Message(BaseModel):
    message: str


