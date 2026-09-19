import React from 'react';
import { Layers } from 'lucide-react';

export const SubjectFilter = ({
  subjects = [],
  selectedSubject = 'all',
  onSelectSubject,
  totalNotes = 0
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
      {/* All Subjects Chip */}
      <button
        onClick={() => onSelectSubject('all')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
          selectedSubject === 'all'
            ? 'bg-black text-white border-black shadow-sm'
            : 'bg-white text-zinc-700 border-zinc-200 hover:text-black hover:bg-zinc-100 shadow-sm'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>All Subjects</span>
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            selectedSubject === 'all' ? 'bg-white text-black' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
          }`}
        >
          {totalNotes}
        </span>
      </button>

      {/* Dynamic Subject Chips */}
      {subjects.map((sub) => {
        const isSelected = selectedSubject === sub.name;
        return (
          <button
            key={sub.name}
            onClick={() => onSelectSubject(sub.name)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              isSelected
                ? 'bg-black text-white border-black shadow-sm'
                : 'bg-white text-zinc-700 border-zinc-200 hover:text-black hover:bg-zinc-100 shadow-sm'
            }`}
          >
            <span>{sub.name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-white text-black' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
              }`}
            >
              {sub.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
