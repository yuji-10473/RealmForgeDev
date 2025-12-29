import { SVGProps } from "react";

export function StoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M11 3h2v2h-2V3m-2 2h2v2H9V5m2 2h2v2h-2V7m-4 2H5v2h2V9m-2 2H3v2h2v-2m4 0h2v2H7v-2m-2 2H3v2h2v-2m10-6h2v2h-2V5m-2 2h2v2h-2V7m4 2h-2v2h2V9m-2 2h-2v2h2v-2m2 2h2v2h-2v-2m-4 0h-2v2h2v-2m-4 2h2v2H7v-2m12 0h2v2h-2v-2m-2 2h2v2h-2v-2m-2 2h2v2h-2v-2m-4 2h2v2h-2v-2Z"></path>
    </svg>
  );
}
