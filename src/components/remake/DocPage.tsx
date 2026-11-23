import { Screen, ScreenBody, ScreenHeader } from "./Screen";

/** Simple readable document screen for privacy, terms and similar text. */
export function DocPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { h: string; p: string }[];
}) {
  return (
    <Screen>
      <ScreenHeader title={title} fallback="/profile" />
      <ScreenBody>
        <p className="mt-1 rounded-2xl bg-primary-soft p-4 text-[15px] text-primary-deep">
          {intro}
        </p>
        <div className="mt-5 space-y-3">
          {sections.map((s, i) => (
            <section key={s.h} className="rounded-3xl bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-[17px] font-semibold">
                <span className="grid size-7 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                {s.h}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.p}</p>
            </section>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Last updated November 2026 · Demo text
        </p>
      </ScreenBody>
    </Screen>
  );
}
