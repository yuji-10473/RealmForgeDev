import { SVGProps } from "react";

export function CombatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M3 3h2v2H3v-2Zm2 2h2v2H5V5Zm2 2h2v2H7V7Zm0 2H5v2h2V9Zm0 2H3v2h4v-2Zm2-2h2v2H9V9Zm2-2h2v2h-2V7Zm0 2h-2v2h2V9Zm0-4h2v2h-2V5Zm2-2h2v2h-2V3Zm2 2h2v2h-2V5Zm0 2h-2v2h2V7Zm0 0V5h2v2h-2Zm2 12h-2v-2h2v2Zm-2-2h-2v-2h2v2Zm-2-2h-2v-2h2v2Zm-2-2h-2v-2h2v2Zm-2-2h-2v-2h2v2Zm10 2h2v2h-2v-2Zm-2 0v2h2v-2h-2Zm-2 0v-2h-2v2h2Zm-6-2v2h2v-2H9Zm-2 4h2v2H7v-2Z"></path>
    </svg>
  );
}
