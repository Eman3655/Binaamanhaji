import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export default function AdminLogin() {
  const nav = useNavigate();
  const loc = useLocation();
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [err,setErr] = useState('');

async function onSubmit(e){
  e.preventDefault();
  setErr('');
  const res = await fetch(`${API}/admin/login`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    credentials:'include',
    body: JSON.stringify({ email, password })
  });
  if(!res.ok){ setErr('بيانات غير صحيحة'); return; }

  try {
    const me = await fetch(`${API}/admin/me`, { credentials: 'include' });
    const data = await me.json().catch(()=>({}));
    if (!data?.ok) { setErr('لم يتم تثبيت الجلسة، حاول ثانية'); return; }
  } catch {
  }

  const to = loc.state?.from?.pathname || '/admin';
  nav(to, { replace:true });
}


  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold mb-4">تسجيل دخول الإدارة</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full rounded bg-black text-white py-2">دخول</button>
      </form>
    </div>
  );
}

