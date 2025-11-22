import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function Footer() {
  return (
    <footer className="border-t border-border py-8 px-4 md:px-8 bg-white dark:bg-slate-950">
      <div className="content-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">About EventPass</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your trusted platform for discovering and booking tickets to amazing events.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <LocalizedClientLink href="/store" className="hover:text-slate-900 dark:hover:text-white transition">
                  Browse Events
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/account" className="hover:text-slate-900 dark:hover:text-white transition">
                  My Tickets
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/account" className="hover:text-slate-900 dark:hover:text-white transition">
                  Account
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">Support</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition">
                  FAQs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>&copy; 2025 EventPass. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

