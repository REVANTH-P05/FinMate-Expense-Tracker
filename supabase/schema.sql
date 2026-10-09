-- 
-- FinMate Database Schema Definition
-- Run this script in your Supabase SQL Editor to configure the database.
--

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. Profiles Table
-- =========================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  currency text not null default 'INR',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create RLS Policies for Profiles
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- =========================================================================
-- 2. Transactions Table
-- =========================================================================
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  amount numeric not null check (amount > 0),
  date date not null default current_date,
  merchant text,
  notes text,
  payment_method text not null,
  tags text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster queries by user and date
create index transactions_user_id_date_idx on public.transactions(user_id, date desc);

-- Enable RLS
alter table public.transactions enable row level security;

-- Create RLS Policies for Transactions
create policy "Users can perform all operations on their own transactions" on public.transactions
  for all using (auth.uid() = user_id);

-- =========================================================================
-- 3. Budgets Table
-- =========================================================================
create table public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  month text not null check (month ~ '^\d{4}-\d{2}$'), -- Format: YYYY-MM
  category text, -- If NULL, represents the total monthly budget
  limit_amount numeric not null check (limit_amount > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints: One total budget per month, one budget per category per month
  constraint budgets_user_month_category_key unique (user_id, month, category)
);

-- Enable RLS
alter table public.budgets enable row level security;

-- Create RLS Policies for Budgets
create policy "Users can perform all operations on their own budgets" on public.budgets
  for all using (auth.uid() = user_id);

-- =========================================================================
-- 4. Auth Trigger for Profile Creation
-- =========================================================================
-- Function to handle creating profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'INR'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute whenever a new auth user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
