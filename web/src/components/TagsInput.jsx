import React from 'react';

export default function TagsInput({ value, onChange, placeholder = 'أدخل وسم واضغط Enter' }) {
  const [input, setInput] = React.useState('');
  const tags = React.useMemo(
    () => value.split(',').map(s => s.trim()).filter(Boolean),
    [value]
  );

  function addTag() {
    const t = input.trim();
    if (!t) return;
    const set = new Set(tags.concat(t));
    onChange(Array.from(set).join(','));
    setInput('');
  }

  function removeTag(tag) {
    onChange(tags.filter(x => x !== tag).join(','));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="badge inline-flex items-center">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ms-2 text-slate-500 hover:text-slate-700"
              aria-label={`إزالة ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        className="input w-full"
        placeholder={placeholder}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
          }
        }}
      />
    </div>
  );
}
