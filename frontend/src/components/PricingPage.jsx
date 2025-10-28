import React, { useState } from 'react';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'
  const [hardwareOption, setHardwareOption] = useState('purchase'); // 'purchase' or 'lease'

  const tiers = [
    {
      name: 'Super Basic',
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for getting started with foot traffic analytics',
      badge: 'FREE FOREVER',
      badgeColor: 'bg-green-100 text-green-800',
      features: [
        'Dashboard with conversion rate',
        'Detailed foot traffic analytics',
        'Email support',
        'Basic visualizations',
        'Weekly reports'
      ],
      cta: 'Get Started Free',
      ctaStyle: 'bg-gray-600 hover:bg-gray-700',
      popular: false
    },
    {
      name: 'Basic',
      price: { monthly: 15, annual: 150 },
      description: 'Everything you need to understand your retail performance',
      badge: 'BEST VALUE',
      badgeColor: 'bg-blue-100 text-blue-800',
      features: [
        'Everything in Super Basic',
        'Full POS integration',
        'Core analytics dashboard',
        'Advanced visualizations',
        'Daily automated reports',
        '2 AI prescriptive insights/month',
        'Missed opportunity analysis',
        'Standard support'
      ],
      cta: 'Start Free Trial',
      ctaStyle: 'bg-blue-600 hover:bg-blue-700',
      popular: true
    },
    {
      name: 'Gold',
      price: { monthly: 50, annual: 500 },
      description: 'Advanced AI-powered insights for serious retailers',
      badge: 'MOST POWERFUL',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      features: [
        'Everything in Basic',
        'Unlimited AI prescriptive insights',
        'Real-time opportunity alerts',
        'Root cause analysis',
        'Priority 24/7 support',
        'Multi-location support',
        'Custom integrations',
        'Dedicated account manager'
      ],
      cta: 'Start Free Trial',
      ctaStyle: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
      popular: false
    }
  ];

  const calculateSavings = (tier) => {
    if (billingCycle === 'annual' && tier.price.monthly > 0) {
      const monthlyCost = tier.price.monthly * 12;
      const savings = monthlyCost - tier.price.annual;
      return savings;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Democratizing retail analytics for small businesses
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
            </span>
            {billingCycle === 'annual' && (
              <span className="ml-2 text-sm font-semibold text-green-600">
                Save up to 2 months! 🎉
              </span>
            )}
          </div>
        </div>

        {/* Hardware Section */}
        <div className="mb-12 bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                LiDAR Sensor Hardware
              </h2>
              <p className="text-gray-600 mb-4">
                Required for foot traffic analytics and conversion tracking
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Purchase Option */}
            <div
              onClick={() => setHardwareOption('purchase')}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                hardwareOption === 'purchase'
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">One-Time Purchase</h3>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  hardwareOption === 'purchase' ? 'border-blue-600' : 'border-gray-300'
                }`}>
                  {hardwareOption === 'purchase' && (
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-gray-900">$400</span>
                <span className="text-gray-600 ml-2">one-time</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Own the hardware outright
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Lower total cost
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  1-year warranty included
                </li>
              </ul>
            </div>

            {/* Lease Option */}
            <div
              onClick={() => setHardwareOption('lease')}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                hardwareOption === 'lease'
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Lease-to-Own</h3>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  hardwareOption === 'lease' ? 'border-blue-600' : 'border-gray-300'
                }`}>
                  {hardwareOption === 'lease' && (
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-gray-900">$50</span>
                <span className="text-gray-600 ml-2">/month × 8 months</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Lower upfront cost
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Own after 8 months
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Easier on cash flow
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                tier.popular ? 'ring-2 ring-blue-600 transform scale-105' : ''
              }`}
            >
              {/* Card Header */}
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                  {tier.badge && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tier.badgeColor}`}>
                      {tier.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-6">{tier.description}</p>
                
                {/* Price */}
                <div className="mb-4">
                  {tier.price.monthly === 0 ? (
                    <div>
                      <span className="text-4xl font-bold text-gray-900">Free</span>
                      <span className="text-gray-600 ml-2">forever</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">
                          ${billingCycle === 'monthly' ? tier.price.monthly : Math.round(tier.price.annual / 12)}
                        </span>
                        <span className="text-gray-600 ml-2">/month</span>
                      </div>
                      {billingCycle === 'annual' && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">
                            ${tier.price.annual}/year
                          </span>
                          <span className="ml-2 text-sm font-semibold text-green-600">
                            Save ${calculateSavings(tier)}!
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition-all ${tier.ctaStyle}`}
                >
                  {tier.cta}
                </button>
              </div>

              {/* Features List */}
              <div className="p-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do I need the LiDAR sensor?</h3>
              <p className="text-gray-600 text-sm">
                Yes, the LiDAR sensor is required for foot traffic analytics and conversion tracking. However, if you only need POS analytics, the Super Basic tier works without the sensor.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I switch plans later?</h3>
              <p className="text-gray-600 text-sm">
                Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What's included in the free trial?</h3>
              <p className="text-gray-600 text-sm">
                All paid plans include a 14-day free trial with full access to all features. No credit card required to start.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What POS systems do you integrate with?</h3>
              <p className="text-gray-600 text-sm">
                We integrate with Square, Clover, Toast, and most major POS systems. Custom integrations available on Gold tier.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Trusted by small businesses nationwide</p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              30-day money-back guarantee
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure & encrypted
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              24/7 support available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
