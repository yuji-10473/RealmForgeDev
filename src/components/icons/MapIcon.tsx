import { SVGProps } from "react";

export function MapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M3 3h18v18H3V3m2 2v2h4V5H5m-2 4h2v2H3V9m16-4v2h-4V5h4m-4 4h4v2h-4V9m-6 0h4v2h-4V9M5 9h4v2H5V9m-2 4h2v2H3v-2m16 0v2h-4v-2h4m-4 4h4v2h-4v-2m-6-4h4v2h-4v-2m-4 4h4v2H5v-2m6 0h4v2h-4v-2Z"></path>
    </svg>
  );
}
