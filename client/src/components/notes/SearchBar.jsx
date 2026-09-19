import React from 'react';
import { motion } from 'framer-motion';
import { GooeyInput } from '../ui/GooeyInput';
import { ArrowUpDown, Star } from 'lucide-react';

export const SearchBar = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  totalResults
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl">
      {/* Gooey Animated Search Input */}
      <div className="flex-1 min-w-0">
        <GooeyInput
          value={searchQuery}
          onChange={onSearchChange}
          onClear={() => onSearchChange('')}
        />
      </div>

      {/* Sort & Filter Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Starred filter button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onToggleFavoritesOnly}
          className={`flex items-center gap-1.5 h-11 px-3.5 rounded-2xl text-xs font-semibold border transition-all shadow-2xs ${
            showFavoritesOnly
              ? 'bg-black text-white border-black shadow-xs'
              : 'bg-white/90 text-zinc-700 border-zinc-200/90 hover:text-black hover:border-zinc-300'
          }`}
          title="Filter starred notes"
        >
          <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-white text-white' : 'text-amber-500 fill-amber-400'}`} />
          <span>Starred</span>
        </motion.button>

        {/* Sort Select Dropdown */}
        <div className="relative flex items-center">
          <ArrowUpDown className="absolute left-3.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-11 pl-9 pr-8 text-xs font-semibold bg-white/90 border border-zinc-200/90 rounded-2xl text-zinc-800 focus:outline-none focus:border-black shadow-2xs cursor-pointer appearance-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title_asc">Title (A-Z)</option>
            <option value="title_desc">Title (Z-A)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
