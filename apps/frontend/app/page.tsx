'use client';

import { useAuth } from '@/components/auth-provider';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const { user, loading, refreshUser } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we just returned from OAuth
    if (user == null && searchParams.get('auth') === 'success') {
      refreshUser();
    }
  }, [user, searchParams, refreshUser]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to SC2 Match Tracker
        </h1>

        {loading ? (
          <div className="mt-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : user ? (
          <div className="mt-8">
            <p className="text-xl text-gray-600">
              Welcome back, <span className="font-semibold">{user.battletag}</span>!
            </p>
            <div className="mt-8 p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-4">Your Stats</h2>
              <p className="text-gray-500">Match tracking coming soon...</p>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <p className="text-xl text-gray-600 mb-8">
              Track your StarCraft II matches and improve your gameplay
            </p>
            <button
              onClick={() => window.location.href = 'http://localhost:4000/api/auth/battlenet'}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login with Battle.net to Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
