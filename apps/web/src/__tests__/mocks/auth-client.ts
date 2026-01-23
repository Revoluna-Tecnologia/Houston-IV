import { vi } from 'vitest';

const mockSession = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'administrador',
    grupoIds: ['grupo-1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  session: {
    id: 'session-1',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  },
};

// Create a reactive state for session
let currentSession: typeof mockSession | null = null;
let isPending = false;

const createMockUseSession = () => {
  const mockRefetch = vi.fn(async () => {
    return { data: currentSession };
  });
  
  return {
    get data() {
      return currentSession;
    },
    get isPending() {
      return isPending;
    },
    refetch: mockRefetch,
  };
};

const mockUseSession = vi.fn(createMockUseSession);

const mockSignIn = {
  email: vi.fn(async ({ email, _password }: { email: string; _password: string }) => {
    if (email === 'invalid@example.com') {
      return { error: { message: 'Credenciais invalidas', code: 'INVALID_CREDENTIALS' } };
    }
    // Set session on successful login
    currentSession = mockSession;
    return { data: mockSession, error: null };
  }),
  social: vi.fn(async () => {
    currentSession = mockSession;
    return { data: mockSession, error: null };
  }),
};

const mockSignUp = {
  email: vi.fn(async () => {
    currentSession = mockSession;
    return { data: mockSession, error: null };
  }),
};

const mockSignOut = vi.fn(async () => {
  currentSession = null;
  return { error: null };
});

const mockGetSession = vi.fn(async () => mockSession);

export const mockAuthClient = {
  signIn: mockSignIn,
  signUp: mockSignUp,
  signOut: mockSignOut,
  useSession: mockUseSession,
  getSession: mockGetSession,
};

// Reset mocks helper
export function resetAuthMocks() {
  currentSession = null;
  isPending = false;
  mockSignIn.email.mockClear();
  mockSignUp.email.mockClear();
  mockSignOut.mockClear();
  mockGetSession.mockClear();
}

// Set authenticated session
export function setAuthenticatedSession() {
  currentSession = mockSession;
  isPending = false;
  
  const mockRefetch = vi.fn(async () => {
    // If refetch returns null, clear the session
    // This simulates a failed refresh
    return { data: currentSession };
  });
  
  // Update the refetch function
  const sessionResult = mockUseSession();
  sessionResult.refetch = mockRefetch;
  
  return mockRefetch;
}

// Set loading session
export function setLoadingSession() {
  currentSession = null;
  isPending = true;
}

