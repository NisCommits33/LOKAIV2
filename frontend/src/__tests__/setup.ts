import { vi } from 'vitest';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock @/lib/supabase/server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock @/lib/supabase/admin-client
vi.mock('@/lib/supabase/admin-client', () => ({
  createAdminClient: vi.fn(),
}));
