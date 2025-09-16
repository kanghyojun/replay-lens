'use client';

import React from 'react';
import { useAuth } from './auth-provider';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { LogOut, User as UserIcon } from 'lucide-react';

export function UserMenu() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={login}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Login with Battle.net
      </button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="focus:outline-none">
          <Avatar.Root className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
            <Avatar.Fallback className="text-white font-semibold">
              {user.battletag.charAt(0).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[200px] bg-white rounded-lg shadow-lg p-2 z-50"
          sideOffset={5}
        >
          <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md cursor-default">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>{user.battletag}</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

          <DropdownMenu.Item
            className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
            onSelect={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}