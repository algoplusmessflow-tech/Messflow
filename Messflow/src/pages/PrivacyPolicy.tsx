import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Clock, Lock, Globe, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <nav className="border-b border-white/5 bg-[#0F0F0F] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center gap-3 text-white hover:text-amber-400 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-lg font-semibold">Back to Home</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/10 rounded-md hover:bg-white/20 transition-colors">Sign In</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-full border border-amber-500/30">
                <Shield className="h-10 w-10 text-amber-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
            <p className="text-white/50">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <FileText className="h-5 w-5 text-amber-400" />
                <span>Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-white/70">
              <p>At MessFlow, we respect your privacy and are committed to protecting your personal information.</p>
              <p className="text-sm text-white/50">By using our services, you agree to the collection and use of information in accordance with this policy.</p>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Lock className="h-5 w-5 text-amber-400" />
                <span>Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Personal Information</h4>
                  <ul className="text-sm text-white/60 space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" />Name and contact details</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" />Email address</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" />Phone number</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" />Profile picture</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Business Information</h4>
                  <ul className="text-sm text-white/60 space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" />Company name and details</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" />Mess location and details</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" />Business registration information</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-500" />Payment and billing information</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Globe className="h-5 w-5 text-amber-400" />
                <span>Third-Party Services</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5">
                  <h4 className="font-semibold text-white mb-2">Supabase</h4>
                  <p className="text-sm text-white/60">Database and authentication services.</p>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5">
                  <h4 className="font-semibold text-white mb-2">Cloudinary</h4>
                  <p className="text-sm text-white/60">Cloud storage for receipts and documents.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Shield className="h-5 w-5 text-amber-400" />
                <span>Data Protection</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-6 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-lg border border-amber-500/20">
                  <Lock className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                  <h5 className="font-semibold text-white mb-2">Encryption</h5>
                  <p className="text-sm text-white/60">All data encrypted in transit and at rest</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-lg border border-amber-500/20">
                  <Clock className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                  <h5 className="font-semibold text-white mb-2">Retention</h5>
                  <p className="text-sm text-white/60">Data retained only as necessary</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-lg border border-amber-500/20">
                  <Globe className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                  <h5 className="font-semibold text-white mb-2">Access</h5>
                  <p className="text-sm text-white/60">Only authorized personnel have access</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <FileText className="h-5 w-5 text-amber-400" />
                <span>Contact Us</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/70">If you have any questions about this Privacy Policy, please contact us:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5">
                  <h5 className="font-semibold text-white mb-2">Email</h5>
                  <p className="text-sm text-white/60">support@algoplusit.com</p>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5">
                  <h5 className="font-semibold text-white mb-2">WhatsApp</h5>
                  <p className="text-sm text-white/60">+971 50 123 4567</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
