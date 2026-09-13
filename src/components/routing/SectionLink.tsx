import { Link, type LinkProps } from "react-router-dom";
import { withHash } from "@/lib/deepLinks";

type SectionLinkProps = LinkProps & {
  section?: string;
};

/** React Router link with optional in-page hash section. */
export function SectionLink({ to, section, ...props }: SectionLinkProps) {
  const path = typeof to === "string" ? withHash(to, section) : to;
  return <Link to={path} {...props} />;
}
