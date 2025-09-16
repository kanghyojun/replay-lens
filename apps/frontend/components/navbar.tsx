'use client';

import React from 'react';
import { UserMenu } from './user-menu';

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              SC2 Match Tracker
            </h1>
          </div>

          <div className="flex items-center">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}