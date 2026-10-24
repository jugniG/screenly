import { BatteryFull, Signal, Wifi } from "lucide-react";

/**
 * The limit-reached screen, exactly as the app shows it: blocked app, the stake
 * on the line, and the two ways out. Deliberately sparse — this is the product.
 */
export default function BlockScreen() {
  return (
    <div className="block-visual">
      <div className="block-device" aria-label="Screenly's block screen">
        <div className="block-status">
          <span>7:24</span>
          <span className="block-status-icons">
            <Signal size={12} />
            <Wifi size={12} />
            <BatteryFull size={16} />
          </span>
        </div>

        <div className="block-screen-content">
          <div className="block-app">
            <span className="block-app-icon">
              <i />
            </span>
            <strong>YouTube</strong>
            <span className="block-app-flag">This app is blocked</span>
          </div>

          <div className="block-stake">
            <span>Your stake</span>
            <strong>₹100.00</strong>
            <small>Back in full in 12 days - as long as you don't break the lock.</small>
          </div>

          <div className="block-actions">
            <span className="block-btn">Back to home</span>
            <span className="block-btn accent">Unlock early −₹100</span>
          </div>
        </div>

        <div className="block-home-indicator" />
      </div>
    </div>
  );
}
