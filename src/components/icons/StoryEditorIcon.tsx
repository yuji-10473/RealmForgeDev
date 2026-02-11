import { SVGProps } from "react";

export function StoryEditorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M3 5v2h3V5H3m5 0v2h13V5H8M3 11v2h3v-2H3m5 0v2h13v-2H8m-5 6v2h3v-2H3m5 0v2h13v-2H8Z" />
    </svg>
  );
}
