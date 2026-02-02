import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PublicHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              MessFlow
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              MessFlow is a food mess and canteen management system that helps you manage members, 
              menus, inventory, staff payroll, and monthly expenses in one place.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center items-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg">
                <Link to="/login">
                  Open App
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-lg">
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Member Management</CardTitle>
              <CardDescription>Track members, dues, and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Easily manage member registrations, track monthly dues, and monitor payment status.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Menu & Inventory</CardTitle>
              <CardDescription>Plan meals and track supplies</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create weekly menus, track inventory levels, and manage supplier relationships.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Staff & Expenses</CardTitle>
              <CardDescription>Manage payroll and track costs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Handle staff payroll, track monthly expenses, and generate detailed reports.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-4">
              MessFlow is a product developed by{' '}
              <a 
                href="https://algoplusit.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline"
              >
                Algo Plus
              </a>
              .
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <Link to="/privacy" className="hover:text-gray-900 transition-colors">
                Privacy Policy
              </Link>
              <span className="text-gray-300">·</span>
              <Link to="/terms" className="hover:text-gray-900 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}