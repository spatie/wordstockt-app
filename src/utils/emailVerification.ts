import type { User } from '../types';

const GRACE_PERIOD_DAYS = 7;

export function isEmailVerified(user: User | null): boolean {
  if (!user) {
    return false;
  }

  return user.emailVerifiedAt !== null;
}

export function isInGracePeriod(user: User | null): boolean {
  if (!user) {
    return false;
  }

  if (isEmailVerified(user)) {
    return false;
  }

  const createdAt = new Date(user.createdAt);
  const gracePeriodEnd = new Date(createdAt);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  return new Date() < gracePeriodEnd;
}

export function isGracePeriodExpired(user: User | null): boolean {
  if (!user) {
    return false;
  }

  if (isEmailVerified(user)) {
    return false;
  }

  return !isInGracePeriod(user);
}

export function getDaysRemainingInGracePeriod(user: User | null): number {
  if (!user || isEmailVerified(user)) {
    return 0;
  }

  const createdAt = new Date(user.createdAt);
  const gracePeriodEnd = new Date(createdAt);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  const now = new Date();
  const diff = gracePeriodEnd.getTime() - now.getTime();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
