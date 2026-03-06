import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

// Mock next/server (NextRequest / NextResponse) para tests de API
jest.mock('next/server', () => {
  class NextRequest {
    constructor(url) {
      this.url = url;
    }
    async json() {
      return {};
    }
  }

  const NextResponse = {
    json(body, init) {
      const status = (init && init.status) || 200;
      return {
        status,
        json: async () => body,
      };
    },
  };

  return { NextRequest, NextResponse };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    form: ({ children, ...props }) => <form {...props}>{children}</form>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Global fetch mock
global.fetch = jest.fn();
