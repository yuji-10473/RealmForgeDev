import { SVGProps } from "react";

export function CharacterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M10 4h4v2h-4V4M8 7h8v2H8V7m-2 3h12v2H6v-2m2 3h8v2H8v-2m-2 3h12v2H6v-2m4 3h4v2h-4v-2Z"></path>
    </svg>
  );
}
