import { Link } from 'react-router-dom';
export default function Breadcrumbs({ trail }) {
  return (
    <div className="breadcrumbs">
      {trail.map((t,i)=> (
        <span key={i}>
          {t.to ? <Link to={t.to}>{t.label}</Link> : <strong>{t.label}</strong>}
          {i < trail.length-1 && <span className="sep"> / </span>}
        </span>
      ))}
    </div>
  );
}
