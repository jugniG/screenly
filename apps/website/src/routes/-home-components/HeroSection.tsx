import { Button } from '@heroui/react'
import { GoArrowRight } from "react-icons/go";
import { FaShieldAlt } from "react-icons/fa";
import { AiOutlineDollar } from "react-icons/ai";
import { TbAlertTriangle } from "react-icons/tb";
import { type IconType } from "react-icons";

const FEATURES: { icon: IconType; title: string; subtitle: string }[] = [
  { icon: FaShieldAlt, title: 'Lock apps', subtitle: 'that distract you' },
  { icon: AiOutlineDollar, title: 'Stake to lock', subtitle: 'your screentime' },
  { icon: TbAlertTriangle, title: 'Real consequences', subtitle: 'lose money if you slip' },
]

export default function HeroSection() {

  return (
    <section className="flex flex-col lg:flex-row gap-12 lg:gap-8 mx-auto w-full max-w-7xl px-4 pt-4 pb-20 sm:px-6 lg:pt-4 lg:pb-28 items-center">
      {/* Background radial glow */}

      <div className=" text-center lg:text-left">
        <a href="https://solana.com" className="no-underline">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-card px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand-gray mb-6 shadow-sm hover:border-brand-orange/40 transition-colors duration-200">
            <img src="https://solana.com/_next/static/media/favicon.b615f892.png" alt="" className="h-3.5 w-3.5" />
            Backed by Solana
          </div>
        </a>
        <h1 className="tracking-tight text-brand-white leading-tight">
          <span className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl block">
            Make distractions{' '}
            <span className="text-brand-orange filter drop-shadow-[0_0_20px_rgba(254,100,1,0.35)]">
              more expensive,
            </span>
          </span>
          <span className="font-montserrat font-medium text-xl sm:text-2xl lg:text-3xl text-brand-gray block mt-2">
            so you don't lose your time.
          </span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-brand-gray max-w-2xl mx-auto lg:mx-0">
          Screenly helps you to not overuse your apps by guarding it with monetary penalty.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-8">
          <a href="#download" className="no-underline">
            <Button
              size="lg"
              className="bg-brand-orange text-white font-semibold font-inter! rounded-2xl shadow-[0_4px_14px_rgba(254,100,1,0.3)] hover:shadow-[0_6px_20px_rgba(254,100,1,0.45)] hover:scale-102 transition-all duration-250 w-full sm:w-auto h-14 px-8"
              endContent={<GoArrowRight />}
            >
              Get Screenly
            </Button>
          </a>
          <a href="#science" className="no-underline">
            <button
              className="relative flex gap-2 items-center cursor-pointer hover:gap-4 group font-inter border-brand-border hover:border-brand-gray text-brand-white rounded-xl transition-all duration-200 w-full sm:w-auto"
            >
              Learn the Science
              <GoArrowRight />
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-orange transition-all duration-300 group-hover:w-full" />

            </button>
          </a>
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap justify-center lg:justify-start gap-10">
          {FEATURES.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="flex items-center gap-4">
              <Icon className="text-brand-orange text-xl shrink-0" />
              <div>
                <p className="text-sm font-medium text-brand-white/75 leading-tight">{title}</p>
                <p className="text-xs text-brand-gray leading-tight mt-1">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <img
        src="/hero-image.png"
        alt="Screenly App"
        className="w-full scale-[1.2] max-w-[480px] lg:w-[45%] mt-8 object-contain [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]"
      />
    </section>
  )
}

