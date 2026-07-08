export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 'var(--space-3)' }}>{actions}</div>}
    </div>
  );
}
