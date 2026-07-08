export function Card({ className = '', ...props }) {
  return <div className={`card ${className}`} {...props} />;
}

export function CardHeader({ title, actions }) {
  return (
    <div className="card__header">
      <h2 className="card__title">{title}</h2>
      {actions && <div>{actions}</div>}
    </div>
  );
}

export function CardBody(props) {
  return <div className="card__body" {...props} />;
}

export function CardFooter(props) {
  return <div className="card__footer" {...props} />;
}
