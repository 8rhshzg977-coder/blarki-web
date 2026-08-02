'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Runs the first time a newly-confirmed user actually has a session — creates their
// profiles row, and either a company (+ owner membership) or an applicant profile,
// based on what they picked at signup (stored in auth user_metadata).
async function ensureProfileExists(supabase: SupabaseClient, user: User) {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (existing) return;

  const userType = (user.user_metadata?.user_type as string) || 'applicant';
  const name = (user.user_metadata?.name as string) || '';

  await supabase.from('profiles').insert({ id: user.id, email: user.email, user_type: userType });

  if (userType === 'company_member') {
    const { data: company } = await supabase
      .from('companies')
      .insert({ name: name || 'My company' })
      .select('id')
      .single();
    if (company) {
      await supabase.from('company_members').insert({
        company_id: company.id,
        user_id: user.id,
        role: 'owner',
      });
    }
  } else {
    await supabase.from('applicant_profiles').insert({
      user_id: user.id,
      full_name: name,
    });
  }
}

export async function signup(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const name = String(formData.get('name') || '').trim();
  const role = String(formData.get('role') || 'applicant');

  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }
  if (!name) {
    return { error: role === 'company' ? 'Enter a company name.' : 'Enter your full name.' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { user_type: role === 'company' ? 'company_member' : 'applicant', name },
    },
  });

  if (error) return { error: error.message };

  // If email confirmation is off, Supabase returns an active session immediately —
  // set up their profile/company right away. If confirmation is required, this runs
  // on their first real login instead (see login() below).
  if (data.session && data.user) {
    await ensureProfileExists(supabase, data.user);
    redirect(role === 'company' ? '/dashboard/company' : '/dashboard/applicant');
  }

  return { success: 'Check your email to confirm your account, then sign in.' };
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Incorrect email or password.' };

  if (data.user) {
    await ensureProfileExists(supabase, data.user);
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', data.user.id)
      .single();
    redirect(profile?.user_type === 'company_member' ? '/dashboard/company' : '/dashboard/applicant');
  }
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}
