import { memo } from 'react';

interface NavButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export default memo(function NavButton({ label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-colors ${isActive
          ? 'bg-[#006400] text-white'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-[#006400]'
        }`}
    >
      {label}
    </button>
  );
});
