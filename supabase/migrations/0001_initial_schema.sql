-- Supabase Migration: 0001_initial_schema.sql
-- Description: Sets up the initial database schema for the Loyalty Ecosystem.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Define Custom Roles
-- Note: Roles are typically managed in Supabase dashboard under Database -> Roles.
-- This SQL is illustrative; actual role creation might differ slightly in UI.
-- Ensure these roles exist in your Supabase project.

-- Example commands (run these as postgres user or via dashboard):
-- CREATE ROLE customer NOINHERIT;
-- CREATE ROLE merchant_admin NOINHERIT;
-- CREATE ROLE third_party_advertiser NOINHERIT;
-- CREATE ROLE system_admin NOINHERIT; -- Consider if needed beyond 'service_role'

-- Grant basic usage on the public schema to authenticated users and the new roles
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT USAGE ON SCHEMA public TO customer;
-- GRANT USAGE ON SCHEMA public TO merchant_admin;
-- GRANT USAGE ON SCHEMA public TO third_party_advertiser;
-- GRANT USAGE ON SCHEMA public TO service_role;

-- Grant select permission on the users table to authenticated users
-- GRANT SELECT ON TABLE auth.users TO authenticated;

-- 2. Helper Functions

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Default role is 'customer'. Adjust if signup logic determines role differently.
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::TEXT;

  INSERT INTO public.profiles (id, email, role, raw_user_meta_data)
  VALUES (NEW.id, NEW.email, user_role, NEW.raw_user_meta_data);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Profiles Table (Linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email VARCHAR(255) UNIQUE,
    full_name TEXT,
    cpf_hash TEXT UNIQUE, -- Store only the hash using bcrypt
    phone_number VARCHAR(20),
    role TEXT NOT NULL DEFAULT 'customer', -- e.g., 'customer', 'merchant_admin', 'third_party_advertiser', 'system_admin'
    raw_user_meta_data JSONB -- Store additional metadata if needed
);

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.cpf_hash IS 'Stores the bcrypt hash of the user''s CPF.';
COMMENT ON COLUMN public.profiles.role IS 'User role within the application (customer, merchant_admin, etc.).';

-- Trigger for updated_at
CREATE TRIGGER profiles_updated_at_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service_role full access (implicit, but good practice to be explicit if needed)
-- CREATE POLICY "Allow service_role full access" ON public.profiles FOR ALL USING (true); -- Use with caution

-- Grant permissions (adjust based on roles)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone_number, raw_user_meta_data) ON public.profiles TO authenticated; -- Allow users to update specific fields

-- 4. Stores Table
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Merchant admin profile ID
    name TEXT NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    phone_number VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    configuration JSONB -- Store specific settings like opening hours, kiosk theme, etc.
);

-- Indexes
CREATE INDEX idx_stores_owner_id ON public.stores(owner_id);

-- Trigger for updated_at
CREATE TRIGGER stores_updated_at_trigger
BEFORE UPDATE ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores
CREATE POLICY "Merchant admins can manage their own stores" ON public.stores
  FOR ALL USING (
    auth.uid() = owner_id AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'merchant_admin'
  )
  WITH CHECK (
    auth.uid() = owner_id AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'merchant_admin'
  );

CREATE POLICY "Authenticated users can view active stores" ON public.stores
  FOR SELECT USING (is_active = TRUE);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO service_role;
GRANT SELECT ON public.stores TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stores TO authenticated; -- But RLS restricts actual execution




-- 5. Visits Table
CREATE TABLE public.visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Can be anonymous initially
    visit_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method VARCHAR(50) NOT NULL DEFAULT 'kiosk', -- e.g., 'kiosk', 'app_checkin', 'manual'
    metadata JSONB -- Store device info, etc.
);

-- Indexes
CREATE INDEX idx_visits_store_id ON public.visits(store_id);
CREATE INDEX idx_visits_profile_id ON public.visits(profile_id);
CREATE INDEX idx_visits_visit_time ON public.visits(visit_time DESC);

-- Trigger for updated_at
CREATE TRIGGER visits_updated_at_trigger
BEFORE UPDATE ON public.visits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visits
CREATE POLICY "Merchant admins can view visits to their stores" ON public.visits
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can view their own visits" ON public.visits
  FOR SELECT USING (auth.uid() = profile_id);

-- Allow service_role full access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO service_role;
-- Allow authenticated users (via backend/kiosk) to insert visits
GRANT INSERT ON public.visits TO authenticated;
GRANT SELECT ON public.visits TO authenticated; -- Restricted by RLS

-- 6. Surveys Table
CREATE TABLE public.surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- Optional: link survey to a specific store
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- merchant_admin or third_party_advertiser
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL, -- Structure for questions (e.g., [{id: 'q1', type: 'rating', text: '...'}, ...])
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    max_responses INTEGER,
    target_audience JSONB -- Optional targeting criteria
);

-- Indexes
CREATE INDEX idx_surveys_store_id ON public.surveys(store_id);
CREATE INDEX idx_surveys_creator_id ON public.surveys(creator_id);

-- Trigger for updated_at
CREATE TRIGGER surveys_updated_at_trigger
BEFORE UPDATE ON public.surveys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for surveys
CREATE POLICY "Creators can manage their own surveys" ON public.surveys
  FOR ALL USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Authenticated users can view active surveys (e.g., for a store)" ON public.surveys
  FOR SELECT USING (
    is_active = TRUE AND
    (start_date IS NULL OR start_date <= NOW()) AND
    (end_date IS NULL OR end_date >= NOW())
    -- Add store_id check if needed based on context
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surveys TO service_role;
GRANT SELECT ON public.surveys TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.surveys TO authenticated; -- Restricted by RLS (only creators)

-- 7. Survey Responses Table
CREATE TABLE public.survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Can be anonymous
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL, -- Context where response was given
    response_data JSONB NOT NULL, -- Answers keyed by question ID (e.g., {'q1': 5, 'q2': 'text answer'})
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL -- Optional link to a visit
);

-- Indexes
CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_profile_id ON public.survey_responses(profile_id);
CREATE INDEX idx_survey_responses_store_id ON public.survey_responses(store_id);
CREATE INDEX idx_survey_responses_visit_id ON public.survey_responses(visit_id);

-- Trigger for updated_at
CREATE TRIGGER survey_responses_updated_at_trigger
BEFORE UPDATE ON public.survey_responses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for survey_responses
CREATE POLICY "Survey creators can view responses to their surveys" ON public.survey_responses
  FOR SELECT USING (
    survey_id IN (SELECT id FROM public.surveys WHERE creator_id = auth.uid())
  );

CREATE POLICY "Users can view their own survey responses" ON public.survey_responses
  FOR SELECT USING (auth.uid() = profile_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_responses TO service_role;
GRANT INSERT ON public.survey_responses TO authenticated; -- Allow submissions
GRANT SELECT ON public.survey_responses TO authenticated; -- Restricted by RLS

-- 8. Ad Campaigns Table
CREATE TABLE public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- merchant_admin or third_party_advertiser
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL, -- Optional: target specific store
    name TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- e.g., 'image', 'video', 'html'
    content_url TEXT, -- URL for image/video or HTML content itself
    content_data JSONB, -- For storing HTML or structured content
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    display_locations TEXT[], -- e.g., ['kiosk_idle', 'kiosk_success', 'app_home']
    target_audience JSONB, -- Optional targeting criteria
    max_impressions INTEGER,
    current_impressions INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_ad_campaigns_creator_id ON public.ad_campaigns(creator_id);
CREATE INDEX idx_ad_campaigns_store_id ON public.ad_campaigns(store_id);
CREATE INDEX idx_ad_campaigns_active_dates ON public.ad_campaigns(is_active, start_date, end_date);

-- Trigger for updated_at
CREATE TRIGGER ad_campaigns_updated_at_trigger
BEFORE UPDATE ON public.ad_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_campaigns
CREATE POLICY "Creators can manage their own ad campaigns" ON public.ad_campaigns
  FOR ALL USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Allow service role to fetch active ads" ON public.ad_campaigns
  FOR SELECT USING (is_active = TRUE);
  -- Backend service (using service_role) will handle filtering by date, location, targeting

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_campaigns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_campaigns TO authenticated; -- Restricted by RLS (only creators)

-- 9. Rules Table (Loyalty Rules)
CREATE TABLE public.rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- e.g., 'visit', 'survey_response', 'purchase'
    conditions JSONB, -- e.g., {'min_purchase_value': 50, 'required_survey_id': 'uuid'}
    actions JSONB NOT NULL, -- e.g., {'grant_points': 10, 'grant_badge_id': 'uuid'}
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    cooldown_period INTERVAL, -- e.g., '1 day', '6 hours'
    max_activations_per_user INTEGER,
    max_total_activations INTEGER
);

-- Indexes
CREATE INDEX idx_rules_store_id ON public.rules(store_id);
CREATE INDEX idx_rules_event_type ON public.rules(event_type);
CREATE INDEX idx_rules_is_active ON public.rules(is_active);

-- Trigger for updated_at
CREATE TRIGGER rules_updated_at_trigger
BEFORE UPDATE ON public.rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rules
CREATE POLICY "Merchant admins can manage rules for their stores" ON public.rules
  FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "Allow service role to read active rules" ON public.rules
  FOR SELECT USING (is_active = TRUE);
  -- Backend service (using service_role) will evaluate rules

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rules TO authenticated; -- Restricted by RLS (only merchant admins)

-- 10. Badges Table
CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE, -- Optional: store-specific badges
    name TEXT NOT NULL UNIQUE, -- Ensure badge names are unique globally or per store if store_id is NOT NULL
    description TEXT,
    icon_url TEXT,
    criteria TEXT -- Text description of how to earn the badge
);

-- Indexes
CREATE INDEX idx_badges_store_id ON public.badges(store_id);

-- Trigger for updated_at
CREATE TRIGGER badges_updated_at_trigger
BEFORE UPDATE ON public.badges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges
CREATE POLICY "Merchant admins can manage badges for their stores" ON public.badges
  FOR ALL USING (
    store_id IS NULL OR -- Global badges managed by system/service
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    store_id IS NULL OR
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "Authenticated users can view all badges" ON public.badges
  FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.badges TO service_role;
GRANT SELECT ON public.badges TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.badges TO authenticated; -- Restricted by RLS

-- 11. User Badges Table (Link between users and badges)
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rule_id UUID REFERENCES public.rules(id) ON DELETE SET NULL, -- Rule that granted the badge
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL, -- Visit associated with earning
    UNIQUE (profile_id, badge_id) -- User can earn each badge only once
);

-- Indexes
CREATE INDEX idx_user_badges_profile_id ON public.user_badges(profile_id);
CREATE INDEX idx_user_badges_badge_id ON public.user_badges(badge_id);

-- No updated_at trigger needed as this is typically an immutable record once created

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Merchant admins can view badges earned in their stores (indirectly via rules/visits)" ON public.user_badges
  FOR SELECT USING (
    rule_id IN (SELECT id FROM public.rules WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())) OR
    visit_id IN (SELECT id FROM public.visits WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_badges TO service_role;
GRANT SELECT ON public.user_badges TO authenticated; -- Restricted by RLS
-- Inserts handled by service_role (triggered by rules engine)

-- 12. Rewards Table (Defines available rewards)
CREATE TABLE public.rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    reward_type VARCHAR(50) NOT NULL, -- e.g., 'discount_percentage', 'discount_fixed', 'free_item', 'points_voucher'
    value NUMERIC, -- e.g., percentage value, fixed amount, points cost
    item_name TEXT, -- For 'free_item' type
    points_cost INTEGER, -- Cost in points to redeem this reward
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_redemptions_per_user INTEGER,
    max_total_redemptions INTEGER,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_rewards_store_id ON public.rewards(store_id);
CREATE INDEX idx_rewards_is_active ON public.rewards(is_active);

-- Trigger for updated_at
CREATE TRIGGER rewards_updated_at_trigger
BEFORE UPDATE ON public.rewards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rewards
CREATE POLICY "Merchant admins can manage rewards for their stores" ON public.rewards
  FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "Authenticated users can view active rewards for stores" ON public.rewards
  FOR SELECT USING (
    is_active = TRUE AND
    (valid_from IS NULL OR valid_from <= NOW()) AND
    (valid_until IS NULL OR valid_until >= NOW())
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO service_role;
GRANT SELECT ON public.rewards TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.rewards TO authenticated; -- Restricted by RLS (merchant admins)

-- 13. User Rewards Table (Rewards redeemed by users)
CREATE TABLE public.user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT, -- Don't delete reward definition if redeemed
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ, -- Timestamp when the reward was actually used/applied
    status VARCHAR(50) NOT NULL DEFAULT 'redeemed', -- e.g., 'redeemed', 'used', 'expired'
    redemption_code TEXT UNIQUE, -- Optional unique code for offline use
    points_spent INTEGER -- Points used to redeem this reward
);

-- Indexes
CREATE INDEX idx_user_rewards_profile_id ON public.user_rewards(profile_id);
CREATE INDEX idx_user_rewards_reward_id ON public.user_rewards(reward_id);
CREATE INDEX idx_user_rewards_store_id ON public.user_rewards(store_id);
CREATE INDEX idx_user_rewards_status ON public.user_rewards(status);

-- No updated_at trigger needed, status changes are specific updates

-- Enable RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own redeemed rewards" ON public.user_rewards
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Merchant admins can view rewards redeemed at their stores" ON public.user_rewards
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "Merchant admins can update status of rewards redeemed at their stores" ON public.user_rewards
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_rewards TO service_role;
GRANT SELECT ON public.user_rewards TO authenticated; -- Restricted by RLS
GRANT UPDATE (status, used_at) ON public.user_rewards TO authenticated; -- Restricted by RLS (merchant admins)
-- Inserts handled by service_role (triggered by redemption logic)

-- 14. User Points Table (Current point balance per store)
CREATE TABLE public.user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    UNIQUE (profile_id, store_id)
);

-- Indexes
CREATE INDEX idx_user_points_profile_id ON public.user_points(profile_id);
CREATE INDEX idx_user_points_store_id ON public.user_points(store_id);

-- Trigger for updated_at
CREATE TRIGGER user_points_updated_at_trigger
BEFORE UPDATE ON public.user_points
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_points
CREATE POLICY "Users can view their own point balances" ON public.user_points
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Merchant admins can view point balances for their stores" ON public.user_points
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_points TO service_role;
GRANT SELECT ON public.user_points TO authenticated; -- Restricted by RLS
-- Updates handled by service_role via RPC functions

-- 15. Point Transactions Table (History of point changes)
CREATE TABLE public.point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    change INTEGER NOT NULL, -- Positive for earning, negative for spending
    balance_after INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- e.g., 'rule_grant', 'reward_redemption', 'manual_adjustment', 'expiry'
    related_rule_id UUID REFERENCES public.rules(id) ON DELETE SET NULL,
    related_visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    related_reward_id UUID REFERENCES public.rewards(id) ON DELETE SET NULL,
    notes TEXT
);

-- Indexes
CREATE INDEX idx_point_transactions_profile_id_store_id ON public.point_transactions(profile_id, store_id);
CREATE INDEX idx_point_transactions_created_at ON public.point_transactions(created_at DESC);

-- No updated_at trigger needed, immutable record

-- Enable RLS
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for point_transactions
CREATE POLICY "Users can view their own point transaction history" ON public.point_transactions
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Merchant admins can view transactions for their stores" ON public.point_transactions
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.point_transactions TO service_role;
GRANT SELECT ON public.point_transactions TO authenticated; -- Restricted by RLS
-- Inserts handled by service_role via RPC functions

-- 16. RPC Functions for Atomic Point Updates

CREATE OR REPLACE FUNCTION public.add_points(p_profile_id UUID, p_store_id UUID, p_amount INTEGER, p_transaction_type VARCHAR, p_related_rule_id UUID DEFAULT NULL, p_related_visit_id UUID DEFAULT NULL, p_notes TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Runs with definer's privileges (service_role)
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Upsert user points balance
  INSERT INTO public.user_points (profile_id, store_id, balance)
  VALUES (p_profile_id, p_store_id, p_amount)
  ON CONFLICT (profile_id, store_id) DO UPDATE
  SET balance = user_points.balance + p_amount
  RETURNING balance INTO v_new_balance;

  -- Log the transaction
  INSERT INTO public.point_transactions (profile_id, store_id, change, balance_after, transaction_type, related_rule_id, related_visit_id, notes)
  VALUES (p_profile_id, p_store_id, p_amount, v_new_balance, p_transaction_type, p_related_rule_id, p_related_visit_id, p_notes);

  RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.subtract_points(p_profile_id UUID, p_store_id UUID, p_amount INTEGER, p_transaction_type VARCHAR, p_related_reward_id UUID DEFAULT NULL, p_notes TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Get current balance and lock the row
  SELECT balance INTO v_current_balance
  FROM public.user_points
  WHERE profile_id = p_profile_id AND store_id = p_store_id
  FOR UPDATE;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  -- Update balance
  v_new_balance := v_current_balance - p_amount;
  UPDATE public.user_points
  SET balance = v_new_balance
  WHERE profile_id = p_profile_id AND store_id = p_store_id;

  -- Log the transaction
  INSERT INTO public.point_transactions (profile_id, store_id, change, balance_after, transaction_type, related_reward_id, notes)
  VALUES (p_profile_id, p_store_id, -p_amount, v_new_balance, p_transaction_type, p_related_reward_id, p_notes);

  RETURN v_new_balance;
END;
$$;

-- Grant execute permission on RPC functions to service_role
GRANT EXECUTE ON FUNCTION public.add_points(UUID, UUID, INTEGER, VARCHAR, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.subtract_points(UUID, UUID, INTEGER, VARCHAR, UUID, TEXT) TO service_role;

-- 17. Billing Subscriptions Table
CREATE TABLE public.billing_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    store_id UUID UNIQUE NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE, -- One subscription per store
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- User who owns the subscription (merchant_admin)
    plan_id TEXT NOT NULL, -- e.g., 'free', 'basic', 'premium'
    status VARCHAR(50) NOT NULL, -- e.g., 'active', 'trialing', 'past_due', 'canceled'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    -- Stripe specific fields (placeholders - store Stripe IDs here)
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    cancel_at_period_end BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_billing_subscriptions_store_id ON public.billing_subscriptions(store_id);
CREATE INDEX idx_billing_subscriptions_profile_id ON public.billing_subscriptions(profile_id);
CREATE INDEX idx_billing_subscriptions_status ON public.billing_subscriptions(status);
CREATE INDEX idx_billing_subscriptions_stripe_sub_id ON public.billing_subscriptions(stripe_subscription_id);

-- Trigger for updated_at
CREATE TRIGGER billing_subscriptions_updated_at_trigger
BEFORE UPDATE ON public.billing_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for billing_subscriptions
CREATE POLICY "Merchant admins can view their own store subscription" ON public.billing_subscriptions
  FOR SELECT USING (auth.uid() = profile_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_subscriptions TO service_role;
GRANT SELECT ON public.billing_subscriptions TO authenticated; -- Restricted by RLS
-- Updates/Inserts likely handled by service_role based on webhooks or admin actions

-- 18. Billing Invoices Table
CREATE TABLE public.billing_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subscription_id UUID NOT NULL REFERENCES public.billing_subscriptions(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_due NUMERIC NOT NULL,
    amount_paid NUMERIC,
    currency CHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g., 'draft', 'open', 'paid', 'uncollectible', 'void'
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    -- Stripe specific fields (placeholders)
    stripe_invoice_id TEXT UNIQUE,
    invoice_pdf_url TEXT,
    billing_reason TEXT -- e.g., 'subscription_cycle', 'subscription_create'
);

-- Indexes
CREATE INDEX idx_billing_invoices_subscription_id ON public.billing_invoices(subscription_id);
CREATE INDEX idx_billing_invoices_store_id ON public.billing_invoices(store_id);
CREATE INDEX idx_billing_invoices_profile_id ON public.billing_invoices(profile_id);
CREATE INDEX idx_billing_invoices_status ON public.billing_invoices(status);
CREATE INDEX idx_billing_invoices_stripe_inv_id ON public.billing_invoices(stripe_invoice_id);

-- Trigger for updated_at
CREATE TRIGGER billing_invoices_updated_at_trigger
BEFORE UPDATE ON public.billing_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for billing_invoices
CREATE POLICY "Merchant admins can view invoices for their subscription" ON public.billing_invoices
  FOR SELECT USING (auth.uid() = profile_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_invoices TO service_role;
GRANT SELECT ON public.billing_invoices TO authenticated; -- Restricted by RLS
-- Updates/Inserts likely handled by service_role based on webhooks

-- 19. User Rule Activations Table (Track cooldowns/limits)
CREATE TABLE public.user_rule_activations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES public.rules(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    survey_response_id UUID REFERENCES public.survey_responses(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_user_rule_activations_profile_rule ON public.user_rule_activations(profile_id, rule_id, activated_at DESC);
CREATE INDEX idx_user_rule_activations_rule_activated ON public.user_rule_activations(rule_id, activated_at DESC);
CREATE INDEX idx_user_rule_activations_store_id ON public.user_rule_activations(store_id);

-- No updated_at trigger needed, immutable record

-- Enable RLS
ALTER TABLE public.user_rule_activations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_rule_activations
-- Typically only accessed by the service_role (rules engine)
CREATE POLICY "Allow service_role full access" ON public.user_rule_activations
  FOR ALL USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_rule_activations TO service_role;
-- No direct access needed for authenticated users usually

-- End of migration script

