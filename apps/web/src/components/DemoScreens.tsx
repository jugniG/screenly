import { useState } from "react";
import {
  BarChart3,
  BatteryFull,
  ChevronDown,
  Leaf,
  Plus,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  Trophy,
  Wifi,
} from "lucide-react";

/**
 * The three app screens side by side, each interactive: the chart picks a day,
 * the limits panel toggles into an editable state, the leaderboard opens an
 * invite. Ported from screenly-0915.
 *
 * Sample data throughout, and labelled as such under the row — a visitor must
 * not read these as real numbers.
 */

type PanelCopy = [string, string];

const PANELS: PanelCopy[] = [
  ["Know your time.", "See your day. Choose what deserves it."],
  ["Make room for more.", "App limits that leave space for your plans."],
  ["Better together.", "Shared goals. A little friendly competition."],
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];
const DAILY_TOTALS = ["2h 12m", "3h 04m", "2h 48m", "3h 39m", "2h 24m", "1h 36m", "1h 12m"];
const BAR_HEIGHTS = [41, 67, 56, 86, 48, 32, 23];

const MOST_USED: [string, string, number][] = [
  ["YouTube", "1h 04m", 70],
  ["X", "38m", 43],
  ["Chess", "15m", 22],
];

const LEADERBOARD: [string, string][] = [
  ["Aarav", "1h 12m"],
  ["You", "2h 04m"],
  ["Meera", "2h 38m"],
  ["Dad", "3h 21m"],
];

const TABS = [BarChart3, SlidersHorizontal, Trophy];

function AppIcon({ name }: { name: string }) {
  return (
    <span className={`app-icon ${name.toLowerCase()}`}>
      {name === "YouTube" ? (
        <span className="play" />
      ) : name === "Chess" ? (
        <img src="/chesscom.webp" alt="" className="size-full rounded-[6px] object-cover" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-[15px]" fill="#0F1419" aria-hidden="true">
          <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
        </svg>
      )}
    </span>
  );
}

function Phone({ type }: { type: number }) {
  const [day, setDay] = useState(3);
  const [limits, setLimits] = useState([60, 45, 5]);
  const [editing, setEditing] = useState(false);

  return (
    <div className={`phone phone-${type}`}>
      <div className="phone-status">
        <b>7:24</b>
        <span>
          <Signal size={12} />
          <Wifi size={12} />
          <BatteryFull size={16} />
        </span>
      </div>

      <div className="phone-content">
        {type === 0 ? (
          <>
            <div className="phone-eyebrow">
              Today <span className="live-dot" />
            </div>
            <h3>{DAILY_TOTALS[day]}</h3>
            <p className="phone-sub">A little less scrolling. A little more living.</p>

            <div className="chart-label">
              <span>Sep {day + 5}</span>
              <span>
                This week <ChevronDown size={10} />
              </span>
            </div>
            <div className="chart">
              {BAR_HEIGHTS.map((height, i) => (
                <button
                  key={i}
                  type="button"
                  title={`View ${DAYS[i]}`}
                  onClick={() => setDay(i)}
                  className={day === i ? "chosen" : ""}
                >
                  <span style={{ height: `${height}%` }} />
                  <small>{DAY_INITIALS[i]}</small>
                </button>
              ))}
            </div>

            <h4>
              Most used <span>View all</span>
            </h4>
            {MOST_USED.map(([name, time, width]) => (
              <div className="usage-row" key={name}>
                <AppIcon name={name} />
                <div>
                  <div className="usage-name">
                    {name}
                    <span>{time}</span>
                  </div>
                  <div className="usage-track">
                    <i style={{ width: `${width}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : type === 1 ? (
          <>
            <div className="phone-eyebrow">Good evening,</div>
            <h3 className="name-heading">Sahil</h3>

            <div className="limit-heading">
              <h4>Your limits</h4>
              <button type="button" onClick={() => setEditing(!editing)} aria-label="Edit demo limits">
                <Plus size={12} />
                {editing ? "Done" : "Edit limits"}
              </button>
            </div>

            {["YouTube", "Chess", "X"].map((name, i) => (
              <div className="limit-row" key={name}>
                <div className="limit-top">
                  <AppIcon name={name} />
                  <div>
                    <b>{name}</b>
                    {editing ? (
                      <label className="edit-limit">
                        <input
                          aria-label={`${name} limit in minutes`}
                          type="number"
                          min="1"
                          max="240"
                          value={limits[i]}
                          onChange={(e) =>
                            setLimits(
                              limits.map((v, j) =>
                                j === i ? Math.max(1, Math.min(240, Number(e.target.value))) : v,
                              ),
                            )
                          }
                        />
                        <span>min / {i === 2 ? "hr" : "day"}</span>
                      </label>
                    ) : (
                      <small>
                        {limits[i]}m / {i === 2 ? "hr" : "day"}
                      </small>
                    )}
                  </div>
                  <span className={`limit-pill ${i === 0 ? "reached" : ""}`}>
                    {i === 0 ? <ShieldCheck size={13} /> : <span />}
                  </span>
                </div>
                <div className={`limit-track ${i === 0 ? "full" : ""}`}>
                  <i style={{ width: i === 0 ? "100%" : i === 1 ? "33%" : "80%" }} />
                </div>
                <small className={i === 0 ? "reached-text" : ""}>
                  {i === 0 ? "Limit reached. You’ve got this." : i === 1 ? "15m used" : "4m used"}
                </small>
              </div>
            ))}

            <div className="commit-note">
              <Leaf size={14} />
              <span>Your evening is looking a little greener.</span>
            </div>
          </>
        ) : (
          <>
            <div className="phone-eyebrow">This week</div>
            <h3 className="name-heading">Family circle</h3>

            <div className="family-top">
              <span>
                <i>A</i>
                <i>M</i>
                <i>D</i>
                <i>+1</i>
              </span>
            </div>

            <div className="winner">
              <div className="winner-icon">
                <Trophy size={24} />
              </div>
              <b>Aarav is winning</b>
              <strong>1h 12m</strong>
              <p>
                Less screen time.
                <br />
                More bragging rights.
              </p>
            </div>

            <div className="leader-list">
              {LEADERBOARD.map(([name, time], i) => (
                <div className={i === 1 ? "you" : ""} key={name}>
                  <span>{i === 0 ? <Trophy size={12} /> : i + 1}</span>
                  <i>{name[0]}</i>
                  <b>{name}</b>
                  <small>{time}</small>
                </div>
              ))}
            </div>

            <p className="pot-note">Lowest screen time takes the pot on Sunday.</p>
          </>
        )}
      </div>

      <div className="phone-nav">
        {TABS.map((Icon, i) => (
          <span key={i} className={i === type ? "selected" : ""}>
            <Icon size={15} />
            {["Screen time", "Limits", "Leaderboard"][i]}
          </span>
        ))}
      </div>

      <div className="home-indicator" />
    </div>
  );
}

export function DemoScreens() {
  return (
    <section id="product" className="product-section mx-auto w-full max-w-6xl px-5">
      <div className="section-kicker">
        <span>THREE WAYS TO MAKE YOUR TIME YOURS.</span>
        <span className="demo-label">
          <span className="live-dot" /> INTERACTIVE APP PREVIEW
        </span>
      </div>

      <div className="product-grid">
        {PANELS.map(([title, description], i) => (
          <article className={`product-panel panel-${i}`} key={title}>
            <div className="product-title">
              <span className="step-tag">0{i + 1}</span>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <Phone type={i} />
          </article>
        ))}
      </div>

      <div className="below-demos">
        <ShieldCheck size={15} />
        <span>Your time, your limits, your people. All in one place.</span>
        <span className="demo-data">Sample data shown</span>
      </div>
    </section>
  );
}