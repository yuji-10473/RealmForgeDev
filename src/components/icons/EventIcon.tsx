import { SVGProps } from "react";

export function EventIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M3 3h12v2H3V3m0 4h12v2H3V7m0 4h8v2H3v-2m13-1l-3 3l3 3v-2h5v-2h-5V10Z"></path>
    </svg>
  );
}
