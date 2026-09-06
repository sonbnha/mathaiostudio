'use client';

import React from 'react';
import Image from 'next/image';
import { PRESET_AVATARS, DEFAULT_AVATAR, PresetAvatar } from '@/config/avatars';
import { Check } from 'lucide-react';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelect: (avatarPath: string) => void;
  showLargePreview?: boolean;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar = DEFAULT_AVATAR,
  onSelect,
  showLargePreview = true,
}) => {
  const current = PRESET_AVATARS.find((a) => a.path === selectedAvatar) || PRESET_AVATARS[0];

  return (
    <div className="w-full flex flex-col gap-3 py-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span>Chọn Avatar đại diện</span>
          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">(Hình học & Toán học)</span>
        </label>
        <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
          {current.name}
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Large Highlighted Current Avatar */}
        {showLargePreview && (
          <div className="relative shrink-0 group">
            <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-indigo-500 via-cyan-500 to-purple-500 shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/40">
              <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center">
                <img
                  src={current.path}
                  alt={current.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-sm text-[10px]">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          </div>
        )}

        {/* Preset Avatars List */}
        <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRESET_AVATARS.map((avatar) => {
            const isSelected = selectedAvatar === avatar.path;

            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => onSelect(avatar.path)}
                title={`${avatar.name} - ${avatar.description}`}
                className={`relative w-11 h-11 rounded-xl p-0.5 transition-all duration-200 cursor-pointer shrink-0 group ${
                  isSelected
                    ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105 shadow-md shadow-indigo-500/25'
                    : 'opacity-75 hover:opacity-100 hover:scale-105 hover:ring-1 hover:ring-slate-300 dark:hover:ring-slate-700'
                }`}
              >
                <div className="w-full h-full rounded-[10px] bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                  <img
                    src={avatar.path}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;
