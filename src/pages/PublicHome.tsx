import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UtensilsCrossed,
  Users,
  BarChart3,
  Calendar,
  CreditCard,
  ChefHat,
  ArrowRight,
  CheckCircle2,
  Star
} from 'lucide-react';
import { PLANS } from '@/lib/plans';

export default function PublicHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Users,
      title: 'Member Management',
      description: 'Track members, dues, and payments with ease. Automated reminders and renewal notifications.'
    },
    {
      icon: Calendar,
      title: 'Smart Menu Planning',
      description: 'Create weekly menus, manage food inventory, and track ingredient consumption efficiently.'
    },
    {
      icon: BarChart3,
      title: 'Business Insights',
      description: 'Detailed reports on expenses, member patterns, and profitability metrics.'
    },
    {
      icon: CreditCard,
      title: 'Payroll & Expenses',
      description: 'Manage staff salaries, track daily expenses, and maintain petty cash records.'
    },
    {
      icon: ChefHat,
      title: 'Inventory Control',
      description: 'Monitor stock levels, get low-stock alerts, and manage supplier relationships.'
    },
    {
      icon: UtensilsCrossed,
      title: 'Daily Operations',
      description: 'Streamline daily food service operations with intuitive workflow tools.'
    }
  ];

  const stats = [
    { value: '500+', label: 'Mess Operators' },
    { value: '50K+', label: 'Members Served' },
    { value: 'AED 2M+', label: 'Transactions Processed' },
    { value: '99.9%', label: 'Uptime' }
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">MessFlow</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-white/60 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0">
                <Link to="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-white/70">Trusted by 500+ mess operators worldwide</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <span className="bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                Manage Your Mess
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                Like Never Before
              </span>
            </h1>

            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              The all-in-one food mess and canteen management system. Handle members, menus,
              inventory, staff payroll, and expenses — all in one powerful platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <Button asChild size="lg" className="w-full sm:w-auto h-14 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/20">
                <Link to="/login" className="flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 text-lg border-white/20 text-white hover:bg-white/10 bg-transparent">
                <Link to="/login">Watch Demo</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-10 border-t border-white/5">
              {stats.map((stat, index) => (
                <div key={index} className="text-center animate-fade-in-up" style={{ animationDelay: `${400 + index * 100}ms` }}>
                  <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/50 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to <span className="text-amber-400">Run Your Mess</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Powerful features designed specifically for food service operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-amber-500/20 transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-white/60">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent <span className="text-amber-400">Pricing</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Choose the plan that fits your mess size
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`bg-white/[0.03] border-white/5 relative ${plan.popular ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-500 text-white border-0">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">
                      {plan.price === 0 ? 'Free' : `AED ${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-white/60">/month</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-white/80">
                        <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button asChild className={`w-full ${plan.popular ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0' : 'bg-white/10 hover:bg-white/20 text-white border-0'}`}>
                    <Link to="/login">
                      {plan.price === 0 ? 'Get Started' : 'Start Free Trial'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in <span className="text-orange-400">Minutes</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Three simple steps to transform your mess management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up in seconds with your business details' },
              { step: '02', title: 'Setup Details', desc: 'Add your mess members, menu items, and staff' },
              { step: '03', title: 'Go Live', desc: 'Start managing your operations efficiently' }
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="text-6xl font-bold text-white/5 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-white/60">{item.desc}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-amber-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-600/20" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
            <div className="relative p-12 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Mess Operations?
              </h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                Join hundreds of mess operators who trust MessFlow for their daily operations
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0">
                  <Link to="/login" className="flex items-center gap-2">
                    Start Your Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-white/50">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  14-day free trial
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  No credit card required
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold">MessFlow</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/50">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <a
                href="https://algoplusit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Algo Plus
              </a>
            </div>

            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} MessFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
