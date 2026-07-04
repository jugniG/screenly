export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-brand-border bg-brand-bg px-4 pb-14 pt-12 text-brand-gray">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 sm:flex-row text-center sm:text-left">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-2">
            <img
              src="/favicon.ico"
              alt="Screenly Logo"
              className="w-5 h-5 object-contain"
            />
            <span className="font-outfit font-bold text-lg text-brand-white">
              Screenly
            </span>
          </div>
          <p className="m-0 text-sm">
            &copy; {year} Screenly. All rights reserved. Keep your commitment.
          </p>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-2 text-sm">
          <p className="m-0">Solana Program: <code className="bg-brand-card px-2 py-0.5 rounded text-brand-orange text-xs">9e9aVVCf...Myfb</code></p>
          <div className="flex gap-4 mt-2">
            <a
              href="https://github.com/sahil-Gupta584/screenly"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-1.5 text-brand-gray hover:bg-brand-card hover:text-brand-white transition duration-200"
            >
              <span className="sr-only">GitHub</span>
              <svg viewBox="0 0 16 16" aria-hidden="true" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
