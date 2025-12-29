import { SVGProps } from "react";

export function ExportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M9 3h6v2H9V3m-4 4h14v10H5V7m2 2v2h10V9H7m0 4v2h5v-2H7m-4 6h18v2H3v-2Z"></path>
    </svg>
  );
}
