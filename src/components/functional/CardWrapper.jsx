/**
 * CardWrapper - a flexible, reusable container that demonstrates `props.children`.
 * Anything placed between <CardWrapper>...</CardWrapper> is rendered in the body,
 * while optional props decorate the header and footer.
 */
export default function CardWrapper({
  title,
  subtitle,
  icon,
  actions,
  footer,
  variant = 'default',
  className = '',
  id,
  children,
}) {
  const hasHeader = Boolean(title || actions)

  return (
    <section id={id} className={`card card--${variant} ${className}`.trim()}>
      {hasHeader && (
        <header className="card__header">
          <div className="card__heading">
            {icon && (
              <span className="card__icon" aria-hidden="true">
                {icon}
              </span>
            )}
            <div>
              {title && <h2 className="card__title">{title}</h2>}
              {subtitle && <p className="card__subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}

      <div className="card__body">{children}</div>

      {footer && <footer className="card__footer">{footer}</footer>}
    </section>
  )
}
