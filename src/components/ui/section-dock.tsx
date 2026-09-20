"use client";

import { motion } from 'framer-motion';
import { ArrowUpRight, Moon, Sun } from 'lucide-react';

/**
 * The bar across the top: who this is on the left, where you can go on the right.
 *
 * It replaced a floating pill of thumbnails. Thumbnails made sense when the bar
 * was the only thing naming the sections, but the grid below now shows every
 * one of those images at full size — the bar was repeating the page back to
 * itself. Words take a fifth of the room and stop competing with the tiles.
 */

export interface DockContact {
  label: string;
  url: string;
}

export interface DockItem {
  key: string;
  label: string;
  url: string;
  tab: string;
}

export function SectionDock({
  items, active, onSelect, dark, onToggleTheme, contact,
}: {
  items: DockItem[];
  active: string;
  onSelect: (tab: string) => void;
  dark: boolean;
  onToggleTheme: () => void;
  contact?: DockContact;
}) {
  return (
    <motion.nav
      aria-label="Sections"
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-3 border-b bg-background/90 px-3 backdrop-blur-xl sm:gap-4 sm:px-6"
    >
      <button
        type="button"
        onClick={() => onSelect('home')}
        aria-label="Dean Dowling — home"
        aria-current={active === 'home' ? 'page' : undefined}
        className="group flex shrink-0 items-center rounded-full transition hover:text-foreground"
      >
        {/* The portrait moved to the statement tile, where it is large enough to
            be a face rather than a mark. With nothing else in this slot the name
            has to carry it at every width — it used to be hidden below sm. */}
        <span className={`t-title-md whitespace-nowrap ${active === 'home' ? '' : 'text-muted-foreground'}`}>
          Dean Dowling
        </span>
      </button>

      {/* Beside the name, not on the landing tile. It is the only way to reach
          him anywhere on the site, and down there it was on one screen of six.
          `shrink-0` with the nav's own overflow-x keeps it from being the thing
          that gets squeezed out on a narrow phone. */}
      {contact && (
        <a
          href={contact.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${contact.label} on LinkedIn (opens in a new tab)`}
          className="t-body-sm hidden shrink-0 items-center gap-1 whitespace-nowrap text-muted-foreground underline underline-offset-4 transition hover:text-foreground sm:inline-flex"
        >
          {contact.label} <ArrowUpRight className="size-3.5" />
        </a>
      )}

      <div className="ml-auto flex min-w-0 items-center gap-3 overflow-x-auto sm:gap-5">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.tab)}
            aria-current={active === item.tab ? 'page' : undefined}
            className={`t-body-sm shrink-0 whitespace-nowrap transition ${
              active === item.tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
    </motion.nav>
  );
}
