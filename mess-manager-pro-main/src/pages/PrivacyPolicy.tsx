import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, Lock, Globe, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link 
              to="/" 
              className="flex items-center gap-3 text-gray-900 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-lg font-semibold">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                to="/terms" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                to="/login" 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                At MessFlow, we respect your privacy and are committed to protecting your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
                you use our mess management application.
              </p>
              <p className="text-sm text-muted-foreground">
                By using our services, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lock className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Personal Information</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Name and contact details</li>
                    <li>• Email address</li>
                    <li>• Phone number</li>
                    <li>• Profile picture</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Business Information</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Company name and details</li>
                    <li>• Mess location and details</li>
                    <li>• Business registration information</li>
                    <li>• Payment and billing information</li>
                  </ul>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Usage Data</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• IP address and browser type</li>
                    <li>• Pages visited and time spent</li>
                    <li>• Device information</li>
                    <li>• App usage patterns</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Financial Data</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Member payments and dues</li>
                    <li>• Expense records</li>
                    <li>• Inventory transactions</li>
                    <li>• Salary and payroll information</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Globe className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Service Provision</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Provide and maintain our services</li>
                    <li>• Process transactions and payments</li>
                    <li>• Manage user accounts</li>
                    <li>• Send service notifications</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Improvement & Support</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Improve our application</li>
                    <li>• Analyze usage patterns</li>
                    <li>• Provide customer support</li>
                    <li>• Prevent fraud and abuse</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                Data Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h5 className="font-semibold">Encryption</h5>
                  <p className="text-sm text-muted-foreground">
                    All sensitive data is encrypted both in transit and at rest
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h5 className="font-semibold">Retention</h5>
                  <p className="text-sm text-muted-foreground">
                    We retain data only as long as necessary for service provision
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h5 className="font-semibold">Access</h5>
                  <p className="text-sm text-muted-foreground">
                    Only authorized personnel have access to your information
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Access & Control</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Access your personal information</li>
                    <li>• Correct inaccurate data</li>
                    <li>• Request data deletion</li>
                    <li>• Export your data</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Privacy Preferences</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Opt out of marketing communications</li>
                    <li>• Manage cookie preferences</li>
                    <li>• Control data sharing</li>
                    <li>• Withdraw consent at any time</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold mb-2">Email</h5>
                  <p className="text-sm text-muted-foreground">
                    privacy@messflow.com
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">WhatsApp</h5>
                  <p className="text-sm text-muted-foreground">
                    +971 50 123 4567
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                We will respond to your inquiries within 48 hours.
              </p>
            </CardContent>
          </Card>

          {/* Policy Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Clock className="h-5 w-5" />
                Policy Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We may update our Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}