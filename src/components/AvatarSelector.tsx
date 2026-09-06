'use client';

import React from 'react';
import { PRESET_AVATARS, DEFAULT_AVATAR } from '@/config/avatars';

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
          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">(Toán học & Hình học)</span>
        </label>
        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
          {current.name}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 p-1">
        {/* Large Highlighted Current Avatar (Desktop Preview) */}
        {showLargePreview && (
          <div className="relative shrink-0 hidden sm:flex flex-col items-center pr-3 border-r border-slate-200 dark:border-slate-800">
            <div className="relative">
              <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center">
                  <img
                    src={current.path}
                    alt={current.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm text-[11px] font-bold z-10 pointer-events-none">
                ✓
              </span>
            </div>
          </div>
        )}

        {/* Preset Avatars List */}
        <div className="flex-1 flex flex-wrap items-center gap-2.5 sm:gap-3.5 py-2 px-1">
          {PRESET_AVATARS.map((avatar) => {
            const isSelected = selectedAvatar === avatar.path;

            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => onSelect(avatar.path)}
                title={`${avatar.name} - ${avatar.description}`}
                className={`relative rounded-full transition-transform shrink-0 focus:outline-none cursor-pointer ${
                  isSelected ? 'z-10' : 'hover:opacity-100'
                }`}
              >
                {/* Ảnh avatar bo tròn: Active ~56px (w-[56px] h-[56px]), Bình thường ~46px (w-[46px] h-[46px]) */}
                <div
                  className={`${
                    isSelected
                      ? 'w-[56px] h-[56px] ring-2 ring-blue-600 dark:ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105 shadow-md shadow-blue-500/25'
                      : 'w-[46px] h-[46px] opacity-75 hover:opacity-100 hover:scale-105 ring-1 ring-slate-200 dark:ring-slate-800'
                  } rounded-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 p-0.5 transition-all duration-200`}
                >
                  <img
                    src={avatar.path}
                    alt={avatar.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                {/* Dấu tick nằm gọn gàng, có viền trắng tách biệt */}
                {isSelected && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] bg-blue-600 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm text-[10px] font-bold z-20 pointer-events-none">
                    ✓
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
