export function LevelCard({ item, onOpen }) {
  return (
    <button className="card" onClick={onOpen}>
      <span className="badge">مستوى</span>
      <h3>{item.title}</h3>
      <p>يحتوي {item.stages?.length || 0} مرحلة</p>
    </button>
  );
}
export function StageCard({ item, onOpen }) {
  const c = (item.subjects?.length||0) + (item.resources?.length||0);
  return (
    <button className="card" onClick={onOpen}>
      <span className="badge">مرحلة</span>
      <h3>{item.title}</h3>
      <p>{c} عنصر</p>
    </button>
  );
}
export function SubjectCard({ item }) {
  return (
    <div className="card">
      <span className="badge">مقرر</span>
      <h3>{item.name}</h3>
      <p className="small">مواد وملفات تابعة للمقرر</p>
    </div>
  );
}
export function ResourceItem({ r }) {
  const icon = r.type === 'file' ? '📄' : '🔗';
  return (
    <div className="list-item">
      <a href={r.url} target="_blank" rel="noreferrer"><strong>{icon} {r.title}</strong></a>
      {r.description && <div className="small">{r.description}</div>}
    </div>
  );
}
