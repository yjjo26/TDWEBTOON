import Icon from "./Icon";

export default function IconButton({
  icon,
  label,
  variant = "default",
  size = "md",
  shortcut,
  align,
  onClick,
  disabled,
  className = "",
  ...rest
}) {
  const tip = shortcut ? `${label} · ${shortcut}` : label;
  const cls = `icon-btn ${variant !== "default" ? variant : ""} ${
    size !== "md" ? size : ""
  } ${className}`.trim();
  return (
    <button
      type="button"
      className={cls}
      title={tip}
      data-tooltip={tip}
      data-tooltip-align={align}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
    </button>
  );
}
