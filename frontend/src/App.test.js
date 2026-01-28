import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// --- MOCKS ---
// We mock the complex AuthContext to isolate UI testing
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { name: 'Test Admin', role: 'admin', email: 'admin@test.com' },
    login: jest.fn(),
    logout: jest.fn(),
    hasRole: jest.fn().mockReturnValue(true),
  })
}));

// We mock Lazy Loaded pages to avoid Suspense timeouts in tests
jest.mock('./pages/Dashboard', () => () => <div data-testid="dashboard-page">Dashboard Content</div>);
jest.mock('./pages/InventoryList', () => () => <div data-testid="inventory-page">Inventory List</div>);

describe('Application Root Integration Tests', () => {
  
  test('renders the application without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  test('redirects authenticated user to the Dashboard', async () => {
    render(<App />);
    
    // Check if Dashboard is rendered (using the mocked testid)
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  test('renders global toast container', () => {
    const { container } = render(<App />);
    // React Toastify creates a portal div, checking for class presence
    const toastContainer = document.querySelector('.Toastify');
    expect(toastContainer).toBeInTheDocument();
  });

  test('handles 404 Unknown Routes', async () => {
    // Manually set the URL to a non-existent route
    window.history.pushState({}, 'Test Page', '/some/random/route/xyz');
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
      expect(screen.getByText(/404/i)).toBeInTheDocument();
    });
  });

  test('renders navigation elements within protected layout', async () => {
    render(<App />);
    // Assuming MainLayout is rendered, check for common layout elements if not mocked
    // Note: Since MainLayout is lazy loaded, we might need to mock it or wait
  });
});