export function BrandShield({ size = 28 }: { size?: number }) {
  return (
    <img
      src="/guardian-shield.jpg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        display: "block",
        objectFit: "contain",
        borderRadius: 6,
        userSelect: "none",
      }}
    />
  );
}
