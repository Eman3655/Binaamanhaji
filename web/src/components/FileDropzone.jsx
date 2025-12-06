// src/components/FileDropzone.jsx
import React from 'react';

export default function FileDropzone({ onUploaded, uploader }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  async function handleFiles(fs) {
    if (!fs || !fs.length) return;
    setErr(''); setBusy(true);
    try {
      const f = fs[0];
      const res = await uploader?.(f); // يُعاد { url, mime, size }
      if (res?.url) onUploaded?.(res);
    } catch (e) {
      setErr(e?.message || 'فشل الرفع');
    } finally { setBusy(false); }
  }

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-4 text-center ${busy?'opacity-60':''}`}
      onDragOver={e=>e.preventDefault()}
      onDrop={e=>{ e.preventDefault(); handleFiles(e.dataTransfer.files); }}
    >
      <div className="mb-2">اسحب ملفًا هنا أو اختر يدويًا</div>
      <label className="btn btn-outline">
        اختيار ملف
        <input hidden type="file" onChange={e=>handleFiles(e.target.files)} />
      </label>
      {err && <div className="text-red-600 mt-2 text-sm">{err}</div>}
    </div>
  );
}
