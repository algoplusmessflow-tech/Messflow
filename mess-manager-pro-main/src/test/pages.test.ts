import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import Terms from '../pages/Terms';

// Mock the AppLayout component
jest.mock('../components/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('Privacy Policy Page', () => {
  it('renders the privacy policy page with correct title', () => {
    render(
      <BrowserRouter>
        <PrivacyPolicy />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });
});

describe('Terms Page', () => {
  it('renders the terms page with correct title', () => {
    render(
      <BrowserRouter>
        <Terms />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });
});