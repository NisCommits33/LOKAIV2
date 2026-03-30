import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted for mocks
const { mockSupabase, mockAdminSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
  mockAdminSupabase: {
    auth: {
      admin: {
        createUser: vi.fn(),
      },
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    insert: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock('@/lib/supabase/admin-client', () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}));

// Mock next/server with a simpler implementation
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: (body: any, init: any) => ({
      status: init.status,
      jsonContents: body,
      json: async () => body
    }),
  },
}));

import { POST } from './route';

describe('POST /api/organizations/apply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockSupabase.single.mockResolvedValue({ data: { id: 'app-123' }, error: null });
    mockAdminSupabase.auth.admin.createUser.mockResolvedValue({ 
      data: { user: { id: 'user-123', email: 'test@example.com' } }, 
      error: null 
    });
    mockAdminSupabase.maybeSingle.mockResolvedValue({ data: { id: 'user-123' }, error: null });
  });

  it('should return 400 if required fields are missing', async () => {
    const mockReq = {
      json: async () => ({ name: 'Partial Org' })
    };
    const res = await POST(mockReq as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 201 on success', async () => {
    const mockReq = {
      json: async () => ({
        name: 'New Org',
        code: 'NEW',
        contact_email: 'contact@new.com',
        applicant_name: 'New User',
        applicant_email: 'user@new.com',
        password: 'password123',
      })
    };

    const res = await POST(mockReq as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe('app-123');
  });
});
