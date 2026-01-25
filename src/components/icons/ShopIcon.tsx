import { SVGProps } from "react";

export function ShopIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M19 6h-2V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1ZM9 5h6v1H9V5Zm10 14H5V8h14v11Z"></path>
      <path fill="currentColor" d="M12 17a4 4 0 0 1-4-4h2a2 2 0 1 0 4 0h2a4 4 0 0 1-4 4Z"></path>
    </svg>
  );
}
