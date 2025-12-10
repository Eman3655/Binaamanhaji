// src/pages/Browse.jsx
import React from 'react';
import ResourceCard from '../components/ResourceCard.jsx';
import Modal from '../components/Modal.jsx';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function Browse() {
  const [filters, setFilters] = React.useState({
    levels: [],
    stages: [],
    sciences: [],
    subjects: [],
  });
  const [filtersLoading, setFiltersLoading] = React.useState(true);

  const [selected, setSelected] = React.useState({
    level_id: '',
    stage_id: '',
    science_id: '',
    subject_id: '',
  });

  const [q, setQ] = React.useState('');
  const [tagsInput, setTagsInput] = React.useState('');

  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await getJson(`${API}/public/filters`);
        setFilters(data);
      } catch (e) {
        console.error('filters error', e);
      } finally {
        setFiltersLoading(false);
      }
    })();
  }, []);

  const stagesForLevel = React.useMemo(() => {
    if (!selected.level_id) return filters.stages;
    const lid = Number(selected.level_id);
    return filters.stages.filter((s) => s.level_id === lid);
  }, [filters.stages, selected.level_id]);

  const subjectsForScience = React.useMemo(() => {
    if (!selected.science_id) return filters.subjects;
    const sid = Number(selected.science_id);
    return filters.subjects.filter((s) => s.science_ids?.includes(sid));
  }, [filters.subjects, selected.science_id]);

  async function loadResources() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (selected.level_id) params.set('level_id', selected.level_id);
      if (selected.stage_id) params.set('stage_id', selected.stage_id);
      if (selected.science_id) params.set('science_id', selected.science_id);
      if (selected.subject_id) params.set('subject_id', selected.subject_id);

      const tags = tagsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (tags.length) params.set('tags', tags.join(','));

      const url = `${API}/public/resources${
        params.toString() ? `?${params.toString()}` : ''
      }`;
      const data = await getJson(url);
      const items = Array.isArray(data?.items) ? data.items : [];
      setRows(items);
    } catch (e) {
      console.error('resources error', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetFilters() {
    setSelected({
      level_id: '',
      stage_id: '',
      science_id: '',
      subject_id: '',
    });
    setQ('');
    setTagsInput('');
    setRows([]);
  }

  const activeUrl =
    active?.external_url || active?.file_url || active?.url || '';
  const activeMime = active?.mime || active?.mime_type || '';

  return (
    <section className="grid gap-6">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">تصفية الموارد</h2>
          {loading ? (
            <span className="text-xs text-sky-400 animate-pulse">
              جارِ تحميل النتائج…
            </span>
          ) : rows.length ? (
            <span className="text-xs text-slate-500">
              عدد النتائج: {rows.length}
            </span>
          ) : null}
        </div>

        {filtersLoading ? (
          <div className="text-slate-500 text-sm">جارِ تحميل بيانات الفلاتر…</div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="text-xs text-slate-500">المستوى</label>
                <select
                  className="select"
                  value={selected.level_id}
                  onChange={(e) =>
                    setSelected((s) => ({
                      ...s,
                      level_id: e.target.value,
                      stage_id: '',
                    }))
                  }
                >
                  <option value="">كل المستويات</option>
                  {filters.levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500">المرحلة</label>
                <select
                  className="select"
                  value={selected.stage_id}
                  onChange={(e) =>
                    setSelected((s) => ({
                      ...s,
                      stage_id: e.target.value,
                    }))
                  }
                >
                  <option value="">كل المراحل</option>
                  {stagesForLevel.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500">العلم</label>
                <select
                  className="select"
                  value={selected.science_id}
                  onChange={(e) =>
                    setSelected((s) => ({
                      ...s,
                      science_id: e.target.value,
                      subject_id: '',
                    }))
                  }
                >
                  <option value="">كل العلوم</option>
                  {filters.sciences.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500">المقرر</label>
                <select
                  className="select"
                  value={selected.subject_id}
                  onChange={(e) =>
                    setSelected((s) => ({
                      ...s,
                      subject_id: e.target.value,
                    }))
                  }
                  disabled={!filters.subjects.length}
                >
                  <option value="">كل المقررات</option>
                  {subjectsForScience.map((su) => (
                    <option key={su.id} value={su.id}>
                      {su.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[2fr,2fr,auto,auto]">
              <div>
                <label className="text-xs text-slate-500">
                  بحث نصي (عنوان / وصف)
                </label>
                <input
                  className="input"
                  placeholder="عنوان، كاتب، ملاحظة..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">
                  وسوم (افصل بـ ,)
                </label>
                <input
                  className="input"
                  placeholder="PDF, واجب, ملخص..."
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="btn btn-outline w-full"
                >
                  تصفية الكل
                </button>
              </div>
              <div className="flex items-end">
                <button
                  onClick={loadResources}
                  className="btn-primary w-full"
                >
                  تحديث النتائج
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {loading && (
        <div className="text-slate-500 text-sm">جارِ تحميل النتائج…</div>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-slate-500">لا توجد نتائج مطابقة حاليًا.</div>
      )}

      {!loading && rows.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((r) => (
            <ResourceCard
              key={r.id}
              item={{
                ...r,
                url: r.external_url || r.file_url || r.url,
                mime_type: r.mime || r.mime_type,
              }}
              onOpen={(it) => {
                setActive(it);
                setOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={active?.title || 'المورد'}
      >
        {active && (
          <div className="grid gap-2">
            {active.description && (
              <div className="prose dark:prose-invert">
                {active.description}
              </div>
            )}
            <div className="text-sm flex flex-wrap gap-2">
              <span className="badge">النوع: {active.type}</span>
              {activeMime && <span className="badge">{activeMime}</span>}
            </div>
            {activeUrl && (
              <a
                className="btn btn-outline w-fit"
                href={activeUrl}
                target="_blank"
                rel="noreferrer"
              >
                فتح في تبويب جديد
              </a>
            )}
            {activeUrl &&
              (activeMime.includes('pdf') ||
                activeUrl.toLowerCase().endsWith('.pdf')) && (
                <div className="mt-2 h-[70vh] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <iframe
                    src={activeUrl}
                    title="pdf"
                    className="w-full h-full"
                  />
                </div>
              )}
          </div>
        )}
      </Modal>
    </section>
  );
}
