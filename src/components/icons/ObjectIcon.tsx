import { SVGProps } from "react";

export function ObjectIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
        <path fill="currentColor" d="M3 5v14h18V5H3Zm16 12H5V7h14v10Z"></path><path fill="currentColor" d="M11 9h2v2h-2z"></path>
    </svg>
  );
}
