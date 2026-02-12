import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Scale, Shield, Clock, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
              <Link to="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
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
                <Scale className="h-10 w-10 text-amber-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Terms of Service</h1>
            <p className="text-white/50">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <FileText className="h-5 w-5 text-amber-400" />
                <span>Acceptance of Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-white/70">
              <p>MessFlow is a subscription service provided by Algo Plus. By accessing or using MessFlow ("the Service"), you agree to be bound by these Terms of Service.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-white/60">You must be at least 18 years old to use this service</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-white/60">You agree to provide accurate and complete information</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Shield className="h-5 w-5 text-amber-400" />
                <span>Account Responsibilities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Your Responsibilities</h4>
                  <ul className="text-sm text-white/60 space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500" />Maintain account security</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500" />Keep login credentials confidential</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500" />Notify us of unauthorized access</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500" />Use the service lawfully</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Prohibited Activities</h4>
                  <ul className="text-sm text-white/60 space-y-2">
                    <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />Violating any applicable laws</li>
                    <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />Interfering with service operation</li>
                    <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />Accessing unauthorized data</li>
                    <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />Reverse engineering the software</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Shield className="h-5 w-5 text-amber-400" />
                <span>Data and Privacy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Your Data</h4>
                  <p className="text-sm text-white/60">You retain ownership of all data you input into the Service. We process this data to provide and improve our services.</p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Cloud Storage</h4>
                  <p className="text-sm text-white/60">Your files are stored securely using Cloudinary for optimal performance across all devices including mobile.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span>Limitation of Liability</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-white/70">
              <p className="text-sm">In no event shall MessFlow, nor its directors, employees, partners, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.</p>
              <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-600/10 rounded-lg border border-amber-500/20">
                <p className="text-sm text-white/80"><strong>Maximum Liability:</strong> Our total liability shall not exceed the amount you paid to us in the last six months.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Clock className="h-5 w-5 text-amber-400" />
                <span>Termination</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">By You</h4>
                  <p className="text-sm text-white/60">You may terminate your account at any time by contacting us or through your account settings.</p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">By Us</h4>
                  <p className="text-sm text-white/60">We may terminate or suspend your account immediately for any breach of these Terms.</p>
                </div>
              </div>
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-200"><strong>Note:</strong> Upon termination, your data will be retained for 30 days and then permanently deleted.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <FileText className="h-5 w-5 text-amber-400" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/70">If you have any questions about these Terms, please contact us:</p>
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
