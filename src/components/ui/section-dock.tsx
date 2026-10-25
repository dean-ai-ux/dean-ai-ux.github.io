"use client";

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react';

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
  items, active, onSelect, dark, onToggleTheme, contact, onAbout,
}: {
  items: DockItem[];
  active: string;
  onSelect: (tab: string) => void;
  dark: boolean;
  onToggleTheme: () => void;
  contact?: DockContact;
  onAbout?: () => void;
}) {
  const [menu, setMenu] = React.useState(false);
  return (
    <>
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
        aria-label="Dean Dowling, home"
        aria-current={active === 'home' ? 'page' : undefined}
        className="group flex min-h-11 shrink-0 items-center rounded-full transition hover:text-foreground fine:min-h-0"
      >
        {/* The portrait moved to the statement tile, where it is large enough to
            be a face rather than a mark. With nothing else in this slot the name
            has to carry it at every width — it used to be hidden below sm. */}
        <span className={`t-title-md whitespace-nowrap ${active === 'home' ? '' : 'text-muted-foreground'}`}>
          Dean Dowling
        </span>
      </button>

      {/* Beside the name, not on the landing tile. It is the only way to reach
          him anywhere on the site, so it shows at every width: it used to be
          hidden below sm, which left a phone with no way to get in touch. */}
      {contact && (
        <a
          href={contact.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${contact.label} on LinkedIn (opens in a new tab)`}
          className="t-body-sm inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap text-muted-foreground underline underline-offset-4 transition hover:text-foreground fine:min-h-0"
        >
          {contact.label} <ArrowUpRight className="size-3.5" />
        </a>
      )}

      {/* The sections from sm. Below it there is no room for five words, and
          the row used to run off the right edge with Writing and the theme
          toggle out of sight, so a phone gets the menu below instead. */}
      <div className="ml-auto hidden min-w-0 items-center gap-5 sm:flex">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.tab)}
            aria-current={active === item.tab ? 'page' : undefined}
            className={`t-body-sm min-h-11 min-w-11 shrink-0 whitespace-nowrap transition fine:min-h-0 fine:min-w-0 ${
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
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground fine:size-auto fine:p-1.5"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setMenu(true)}
        aria-label="Menu"
        aria-expanded={menu}
        aria-controls="site-menu"
        className="-mr-1.5 ml-auto flex size-11 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-muted sm:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>
    </motion.nav>

    <AnimatePresence>
      {menu && (
        <MenuSheet
          items={items}
          active={active}
          onClose={() => setMenu(false)}
          onSelect={(tab) => { setMenu(false); onSelect(tab); }}
          onAbout={onAbout ? () => { setMenu(false); onAbout(); } : undefined}
          contact={contact}
          dark={dark}
          onToggleTheme={onToggleTheme}
        />
      )}
    </AnimatePresence>
    </>
  );
}

/**
 * The phone's navigation: the whole screen, the sections in large type.
 *
 * A sheet rather than a dropdown because five section names, About, Contact and
 * the theme all need a thumb-sized target, and that does not fit under a 64px
 * bar. Every row is at least 56px. Escape, the close button and choosing
 * anything all close it, and the page behind does not scroll while it is open.
 */
function MenuSheet({
  items, active, onClose, onSelect, onAbout, contact, dark, onToggleTheme,
}: {
  items: DockItem[];
  active: string;
  onClose: () => void;
  onSelect: (tab: string) => void;
  onAbout?: () => void;
  contact?: DockContact;
  dark: boolean;
  onToggleTheme: () => void;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  /* Held in a ref so this runs once, on open. onClose is a new function on
     every render, and as a dependency it re-ran the effect each time: toggling
     the theme from the menu pulled focus back to the close button. */
  const onCloseRef = React.useRef(onClose);
  React.useLayoutEffect(() => { onCloseRef.current = onClose; });
  React.useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const row = 'flex min-h-14 w-full items-center text-left';
  return (
    <motion.div
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-background px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] sm:hidden"
    >
      <div className="flex h-16 shrink-0 items-center justify-between">
        <button
          type="button"
          onClick={() => onSelect('home')}
          className="t-title-md flex min-h-11 items-center whitespace-nowrap"
          aria-current={active === 'home' ? 'page' : undefined}
        >
          Dean Dowling
        </button>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="-mr-1.5 flex size-11 items-center justify-center rounded-full transition hover:bg-muted"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      <ul className="mt-4 border-t">
        {items.map((item) => (
          <li key={item.key} className="border-b">
            <button
              type="button"
              onClick={() => onSelect(item.tab)}
              aria-current={active === item.tab ? 'page' : undefined}
              className={`${row} t-headline-md ${active === item.tab ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col">
        {onAbout && (
          <button type="button" onClick={onAbout} className={`${row} t-title-lg`}>
            About me
          </button>
        )}
        {contact && (
          <a
            href={contact.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${contact.label} on LinkedIn (opens in a new tab)`}
            className={`${row} t-title-lg gap-1.5`}
          >
            {contact.label} <ArrowUpRight aria-hidden className="size-4" />
          </a>
        )}
        <button type="button" onClick={onToggleTheme} className={`${row} t-title-lg gap-2`}>
          {dark ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </motion.div>
  );
}
