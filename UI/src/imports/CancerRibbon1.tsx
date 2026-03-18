import svgPaths from "./svg-y3ajc0n1dc";

function Group() {
  return (
    <div className="relative shrink-0 w-full aspect-[282.96/453.601]" data-name="Group">
      <svg className="absolute block inset-0 w-full h-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 282.96 453.601" style={{ transform: 'scale(0.5)' }}>
        <g id="Group">
          <path d={svgPaths.p142db700} fill="var(--fill-0, #B82C69)" id="Vector" />
          <path d={svgPaths.p1e31c9a0} fill="var(--fill-0, #38285D)" id="Vector_2" />
          <path d={svgPaths.p3ad79d00} fill="var(--fill-0, #732954)" id="Vector_3" />
        </g>
      </svg>
    </div>
  );
}

export default function CancerRibbon({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`flex flex-col gap-4 items-center justify-center ${className || ''}`} data-name="cancer-ribbon 1">
      <div className="w-20 md:w-24">
        <Group />
      </div>
      {showText && (
        <p className="font-['Inter:Bold',sans-serif] font-bold text-center text-[#1c398e] text-xl md:text-2xl tracking-wide">
          Mahaveer Cancer Care Foundation
        </p>
      )}
    </div>
  );
}