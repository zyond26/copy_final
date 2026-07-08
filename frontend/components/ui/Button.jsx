export default function Button({
  variant = 'primary', // primary | secondary | danger | ghost
  size = 'md',         // sm | md | lg
  className = '',
  ...props
}) {
  const sizeClass = size !== 'md' ? ` btn--${size}` : '';
  return (
    <button className={`btn btn--${variant}${sizeClass} ${className}`} {...props} />
  );
}
