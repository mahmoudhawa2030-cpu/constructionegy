"use client";

import { useState } from "react";

interface BilingualText {
  ar: string;
  en: string;
}

interface Props {
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  placeholder?: { ar: string; en: string };
}

export function BilingualTextInput({ label, value, onChange, placeholder }: Props) {
  const updateAr = (ar: string) => {
    onChange({ ...value, ar });
  };

  const updateEn = (en: string) => {
    onChange({ ...value, en });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">العربية</label>
          <input
            type="text"
            value={value.ar}
            onChange={(e) => updateAr(e.target.value)}
            placeholder={placeholder?.ar}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="rtl"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">English</label>
          <input
            type="text"
            value={value.en}
            onChange={(e) => updateEn(e.target.value)}
            placeholder={placeholder?.en}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
