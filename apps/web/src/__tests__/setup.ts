import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  })),
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock UI components
vi.mock('@/components/ui/button', async () => {
  const mocks = await import('./mocks/houston-ui');
  return { Button: mocks.Button };
});

vi.mock('@/components/ui/input', async () => {
  const mocks = await import('./mocks/houston-ui');
  return { Input: mocks.Input };
});

vi.mock('@/components/ui/label', async () => {
  const mocks = await import('./mocks/houston-ui');
  return { Label: mocks.Label };
});

vi.mock('@/components/ui/checkbox', async () => {
  const mocks = await import('./mocks/houston-ui');
  return { Checkbox: mocks.Checkbox };
});

vi.mock('@/components/ui/card', async () => {
  const mocks = await import('./mocks/houston-ui');
  return { Card: mocks.Card, CardContent: mocks.CardContent };
});

vi.mock('@/components/ui/select', async () => {
  const mocks = await import('./mocks/houston-ui');
  return {
    Select: mocks.Select,
    SelectTrigger: mocks.SelectTrigger,
    SelectContent: mocks.SelectContent,
    SelectItem: mocks.SelectItem,
    SelectValue: mocks.SelectValue,
  };
});

vi.mock('@/components/ui/textarea', async () => {
  const mocks = await import('./mocks/houston-ui');
  return { Textarea: mocks.Textarea };
});

vi.mock('@/components/ui/dropdown-menu', async () => {
  const mocks = await import('./mocks/houston-ui');
  return {
    DropdownMenu: mocks.DropdownMenu,
    DropdownMenuTrigger: mocks.DropdownMenuTrigger,
    DropdownMenuContent: mocks.DropdownMenuContent,
    DropdownMenuItem: mocks.DropdownMenuItem,
    DropdownMenuSeparator: mocks.DropdownMenuSeparator,
  };
});

vi.mock('@/components/ui/avatar', async () => {
  const mocks = await import('./mocks/houston-ui');
  return { Avatar: mocks.Avatar, AvatarFallback: mocks.AvatarFallback };
});

vi.mock('@/lib/utils', async () => {
  const mocks = await import('./mocks/houston-ui');
  return { cn: mocks.cn };
});

// Mock @tanstack/react-query globally
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    cancelQueries: vi.fn(),
  })),
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Houston custom components
vi.mock('@/components/houston', async () => {
  const mocks = await import('./mocks/houston-ui');
  return {
    LoadingSpinner: mocks.LoadingSpinner,
    Modal: mocks.Modal,
    DatePicker: mocks.DatePicker,
    DateRangePicker: mocks.DateRangePicker,
    StatusBadge: mocks.StatusBadge,
    DataTable: mocks.DataTable,
  };
});
