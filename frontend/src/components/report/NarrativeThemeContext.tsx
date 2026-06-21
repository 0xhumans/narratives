import { createContext, useContext, type CSSProperties, type ReactNode } from "react";

import { getNarrativeTheme, type NarrativeTheme } from "../../lib/narrativeTheme";

const Ctx = createContext<NarrativeTheme>(getNarrativeTheme(undefined));

export function NarrativeThemeProvider({
  slug,
  children,
}: {
  slug: string | undefined;
  children: ReactNode;
}) {
  const theme = getNarrativeTheme(slug);
  return (
    <Ctx.Provider value={theme}>
      <div
        className="narrative-blog-root"
        style={
          {
            "--blog-accent": theme.accent,
            "--blog-accent-rgb": theme.accentRgb,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function useNarrativeTheme() {
  return useContext(Ctx);
}
