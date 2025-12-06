import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export default function RequireAdmin({ children }) {
  const loc = useLocation();
  const [state, setState] = React.useState({ loading: true, ok: false });
  const triedOnceRef = React.useRef(false);

  React.useEffect(() => {
    const ctrl = new AbortController();

    async function checkOnce() {
      try {
        const res = await fetch(`${API}/admin/me`, {
          credentials: 'include',
          signal: ctrl.signal,
        });
        // 200 مع {ok:true} = جلسة صحيحة
        // 200 مع {ok:false} = لا جلسة
        // 401 = لا جلسة
        const data = await res.json().catch(() => ({}));
        if (!ctrl.signal.aborted) {
          setState({ loading: false, ok: !!data?.ok });
        }
      } catch {
        // لو فشل الشبكة، جرّب مرة ثانية بسرعة قبل الطرد
        if (!triedOnceRef.current) {
          triedOnceRef.current = true;
          setTimeout(checkOnce, 250);
          return;
        }
        if (!ctrl.signal.aborted) {
          setState({ loading: false, ok: false });
        }
      }
    }

    checkOnce();
    return () => ctrl.abort();
  }, [API]);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="animate-pulse text-slate-500">جارِ التحقق من الصلاحية…</div>
      </div>
    );
  }

  if (!state.ok) {
    return <Navigate to="/admin-login" replace state={{ from: loc }} />;
  }

  return children;
}



