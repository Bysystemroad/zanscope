import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  SIGNUP_BONUS_CREDITS,
  SIGNUP_BONUS_PENDING_MESSAGE,
  evaluateSignupAttemptLimits,
  isEmailVerified,
  isValidEmail,
  normalizeEmail
} from "../lib/auth-security.ts";

const migrationSql = fs.readFileSync(new URL("../lib/supabase/signup-security-migration.sql", import.meta.url), "utf8");
const landingCopy = fs.readFileSync(new URL("../components/landing-page-client.tsx", import.meta.url), "utf8");
const authCopy = fs.readFileSync(new URL("../components/auth-form.tsx", import.meta.url), "utf8");
const middlewareSource = fs.readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");

test("new verified signup bonus is exactly 50 credits", () => {
  assert.equal(SIGNUP_BONUS_CREDITS, 50);
  assert.match(migrationSql, /p_amount integer default 50/);
  assert.match(migrationSql, /values \(p_user_id, p_amount, 'signup_bonus'/);
});

test("unverified users receive no authenticated access signal", () => {
  assert.equal(isEmailVerified({ email_confirmed_at: null, confirmed_at: null }), false);
});

test("verified users can pass the email confirmation check", () => {
  assert.equal(isEmailVerified({ email_confirmed_at: "2026-07-28T00:00:00Z", confirmed_at: null }), true);
});

test("same user cannot receive signup bonus twice at the database layer", () => {
  assert.match(migrationSql, /credit_transactions_one_signup_bonus_per_user_idx/);
  assert.match(migrationSql, /where type = 'signup_bonus'/);
  assert.match(migrationSql, /on conflict do nothing/);
});

test("replayed or parallel verification attempts are idempotent in SQL", () => {
  assert.match(migrationSql, /for update/);
  assert.match(migrationSql, /when unique_violation/);
  assert.match(migrationSql, /return query select false/);
});

test("existing users are not granted another bonus unless marked eligible", () => {
  assert.match(migrationSql, /signup_bonus_eligible boolean not null default false/);
  assert.match(migrationSql, /if not eligible then/);
});

test("signup rate limit blocks excessive IP attempts", () => {
  assert.equal(evaluateSignupAttemptLimits(3, 0, 0).allowed, false);
  assert.equal(evaluateSignupAttemptLimits(0, 5, 0).allowed, false);
});

test("signup rate limit blocks excessive device attempts", () => {
  assert.equal(evaluateSignupAttemptLimits(0, 0, 2).allowed, false);
});

test("normal signup under rate limits succeeds", () => {
  assert.equal(evaluateSignupAttemptLimits(2, 4, 1).allowed, true);
});

test("email validation normalizes and rejects malformed email addresses", () => {
  assert.equal(normalizeEmail(" USER@Example.COM "), "user@example.com");
  assert.equal(isValidEmail("user@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
});

test("protected routes reject unverified users in middleware", () => {
  assert.match(middlewareSource, /hasVerifiedSession/);
  assert.match(middlewareSource, /isProtectedPage && !hasVerifiedSession/);
});

test("UI displays 50 free credits instead of 100", () => {
  const obsoleteSignupCopy = new RegExp(["100 free", " credits|Start free with 100", " credits"].join(""));
  assert.match(landingCopy, /Start free with 50 credits/);
  assert.match(authCopy, /50 free credits/);
  assert.doesNotMatch(landingCopy, obsoleteSignupCopy);
});

test("signup confirmation explains email verification before credits", () => {
  assert.match(SIGNUP_BONUS_PENDING_MESSAGE, /verify your account/i);
  assert.match(SIGNUP_BONUS_PENDING_MESSAGE, /50 free credits/i);
});
