import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';
import { getAnalytics } from '@/lib/server';
import { AnalyticsClient } from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default function AdminAnalytics() {
  const data = getAnalytics(30);
  return <AnalyticsClient initial={data} />;
}
