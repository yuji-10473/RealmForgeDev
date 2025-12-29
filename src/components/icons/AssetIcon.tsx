import { SVGProps } from "react";

export function AssetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M3 3h2v2H3V3m0 4h2v2H3V7m0 4h2v2H3v-2m0 4h2v2H3v-2m4-12h2v2H7V3m0 4h2v2H7V7m0 4h2v2H7v-2m0 4h2v2H7v-2m4-12h2v2h-2V3m0 4h2v2h-2V7m0 4h2v2h-2v-2m0 4h2v2h-2v-2m4-12h2v2h-2V3m0 4h2v2h-2V7m0 4h2v2h-2v-2m0 4h2v2h-2v-2m4-12h2v2h-2V3m0 4h2v2h-2V7m0 4h2v2h-2v-2m0 4h2v2h-2v-2Z"></path>
    </svg>
  );
}
