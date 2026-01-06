
import { SVGProps } from "react";

export function RoomIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M3 5v14h18V5H3Zm4 2h4v4H7V7Zm0 6h4v4H7v-4Zm6-6h4v4h-4V7Zm0 6h4v4h-4v-4Z"></path>
    </svg>
  );
}
