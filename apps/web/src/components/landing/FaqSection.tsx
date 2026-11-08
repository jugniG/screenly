import { ArrowUpRight } from "lucide-react";

const FAQS = [
  {
    q: "How does Screenly work?",
    a: "Pick the apps you want to spend less time on, set a daily or hourly limit, and choose a stake. Stay within your limits and you keep every rupee of it.",
  },
  {
    q: "Do I have to put money on it?",
    a: "No. You can start on the free tier and never stake anything. The commitment is the extra layer, not the entry fee.",
  },
  {
    q: "What happens if I go over my limit?",
    a: "The stake you committed is what you stand to lose. Screenly is up front about that before you pick an amount — nothing is charged silently.",
  },
  {
    q: "What are the actual stakes?",
    a: "From ₹50 up to ₹1000, over a week, a month or a year. The app only ever charges the amount you picked, and the server prices it independently so it can't be tampered with.",
  },
  {
    q: "Is Screenly open source?",
    a: "Yes. Every line is on GitHub — including the Android accessibility service and the server that verifies payments.",
  },
  {
    q: "Can I use it with my family?",
    a: "Family circles turn less scrolling into a shared challenge. Invite people, compare screen time, and keep each other honest.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="border-y border-border bg-card/50 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-5">
        <div className="text-center">
          <p className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            FAQ
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            The <span className="serif text-primary">obvious</span> questions.
          </h2>
        </div>

        {/* Exclusive HTML <details name="faq"> Accordion */}
        <div className="mt-12 divide-y divide-border border-y border-border">
          {FAQS.map((faq, index) => (
            <details
              key={faq.q}
              name="faq"
              className="group py-5 transition-colors"
              {...(index === 0 ? { open: true } : {})}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-display text-base font-bold text-foreground hover:text-primary sm:text-lg">
                <span>{faq.q}</span>
                <span className="shrink-0 text-xl font-light text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="mt-2.5 max-w-2xl pr-4 text-sm leading-relaxed text-muted-foreground">
                <p>{faq.a}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Original Closing Callout Banner */}
        <div className="mt-16 rounded-3xl border border-border bg-card p-6 text-center sm:p-12 shadow-sm">
          <h3 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl leading-tight">
            Willpower is a bad plan.
            <br />
            <span className="serif text-primary">Money is a better one.</span>
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Set your first limit in under two minutes. Start free.
          </p>
          <div className="mt-6 flex justify-center">
            <a
              href="/install"
              className="btn-quippy inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold shadow-md"
            >
              Get started <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
