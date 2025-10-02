import Image from "next/image";
import Link from "next/link";

interface HeaderLogoProps {
  href?: string | null;
  className?: string;
  width?: number;
  height?: number;
}

export function HeaderLogo({
  href = "/",
  className = "",
  width = 120,
  height = 120,
}: HeaderLogoProps) {
  const logo = (
    <Image
      src="/logos/logo-alqudairani.svg"
      alt="Al-Qudairani Company"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {logo}
      </Link>
    );
  }

  return logo;
}
