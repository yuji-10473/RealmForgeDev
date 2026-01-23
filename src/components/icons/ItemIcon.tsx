import { SVGProps } from "react";

export function ItemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M3,7L12,2L21,7V17L12,22L3,17V7M5,8.08V15.92L12,19.84L19,15.92V8.08L12,4.16L5,8.08Z" />
    </svg>
  );
}
