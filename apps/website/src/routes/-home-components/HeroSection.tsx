import { Button } from '@heroui/react'
import { GoArrowRight } from "react-icons/go";
import { FaShieldAlt } from "react-icons/fa";
import { AiOutlineDollar } from "react-icons/ai";
import { TbAlertTriangle } from "react-icons/tb";
import { type IconType } from "react-icons";

const FEATURES: { icon: IconType; title: string; subtitle: string }[] = [
  { icon: FaShieldAlt, title: 'Lock apps',       subtitle: 'that distract you' },
  { icon: AiOutlineDollar,  title: 'Stake to lock',   subtitle: 'your screentime' },
  { icon: TbAlertTriangle,   title: 'Real consequences',  subtitle: 'lose money if you slip' },
]

export default function HeroSection() {

  return (
    <section className="flex flex-col lg:flex-row gap-12 lg:gap-8 mx-auto w-full max-w-7xl px-4 pt-4 pb-20 sm:px-6 lg:pt-4 lg:pb-28 items-center">
      {/* Background radial glow */}

      <div className=" text-center lg:text-left">
        <a href="https://solana.com">
          <div className="inline-flex items-center gap-2 rounded-full  bg-brand-orange-soft px-3.5 py-2 text-xs font-semibold tracking-wide text-brand-orange uppercase mb-6 ">
            <img src="https://solana.com/_next/static/media/favicon.b615f892.png" alt="" className="h-4 w-4" />
            Backed by Solana
          </div>
        </a>
        <h1 className="text-5xl font-geist  tracking-tight text-brand-white sm:text-6xl lg:text-7xl leading-tight">
          Want to control your<br />
          <span className="text-brand-orange filter drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            screentime?
          </span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-brand-gray max-w-2xl mx-auto lg:mx-0">
          We know self control is hard, so we bet on it.
          <br />
          When it's about money, self control reaches to its max level.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-8">
          <a href="#download" className="no-underline">
            <Button
              size="lg"
              className="bg-brand-orange text-brand-white font-semibold font-inter! rounded-2xl hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] hover:scale-102 transition-all duration-250 w-full sm:w-auto h-14 px-8"
              endContent={<GoArrowRight />}
            >
              Get Screenly
            </Button>
          </a>
          <a href="#science" className="no-underline">
            <button
              className="relative flex gap-2 items-center cursor-pointer hover:gap-4 group font-inter border-brand-border  hover:border-brand-gray text-brand-white  rounded-xl transition-all duration-200 w-full sm:w-auto"
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
        className="w-[50%] mt-12"
      />
    </section>
  )
}
