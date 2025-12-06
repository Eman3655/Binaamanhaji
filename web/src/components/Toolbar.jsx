export default function Toolbar({ q, setQ }) {
  return (
    <div className="toolbar">
      <input
        type="search"
        placeholder="ابحث في العناوين والوصف"
        value={q}
        onChange={e=>setQ(e.target.value)}
      />
    </div>
  );
}
