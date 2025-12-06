import React from 'react';
import Layout from '../components/Layout.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Toolbar from '../components/Toolbar.jsx';
import { LevelCard, StageCard, SubjectCard, ResourceItem } from '../components/Cards.jsx';

const API = 'http://localhost:4000/api';

export default function Library(){
  const [data, setData] = React.useState(null);
  const [level, setLevel] = React.useState(null);
  const [stage, setStage] = React.useState(null);
  const [q, setQ] = React.useState('');

  React.useEffect(()=>{
    fetch(`${API}/structure`).then(r=>r.json()).then(setData).catch(console.error);
  },[]);

  if (!data) return <Layout><p>جارِ التحميل…</p></Layout>;

  function matchQuery(text){
    if (!q) return true;
    return (text||'').toLowerCase().includes(q.toLowerCase());
  }

  // الصفحة الأولى: تمهيدي + مستويات
  if (!level && !stage){
    return (
      <Layout>
        <Breadcrumbs trail={[{label:'المكتبة', to:'/library'}]} />
        <h2 style={{margin:'8px 0'}}>المرحلة التمهيدية</h2>
        <div className="grid" style={{marginBottom:18}}>
          {(data.prep.subjects||[]).filter(s=>matchQuery(s.name)).map(s=> <SubjectCard key={s.id} item={s} />)}
        </div>
        <div className="list" style={{marginBottom:18}}>
          {(data.prep.resources||[]).filter(r=>matchQuery(r.title||r.description)).map(r=> <ResourceItem key={r.id} r={r} />)}
        </div>

        <h2 style={{margin:'12px 0'}}>المستويات</h2>
        <Toolbar q={q} setQ={setQ} />
        <div className="grid">
          {data.levels.filter(l=>matchQuery(l.title)).map(l=> (
            <LevelCard key={l.id} item={l} onOpen={()=>{ setLevel(l); setStage(null); }} />
          ))}
        </div>
      </Layout>
    );
  }

  // صفحة المستوى: قائمة مراحل
  if (level && !stage){
    return (
      <Layout>
        <Breadcrumbs trail={[{label:'المكتبة', to:'/library'}, {label: level.title}]} />
        <Toolbar q={q} setQ={setQ} />
        <div className="grid">
          {level.stages.filter(s=>matchQuery(s.title)).map(s=> (
            <StageCard key={s.id} item={s} onOpen={()=>setStage(s)} />
          ))}
        </div>
        <div style={{marginTop:12}}>
          <button onClick={()=>{ setLevel(null); setStage(null); }}>رجوع</button>
        </div>
      </Layout>
    );
  }

  // صفحة المرحلة: مواد + موارد
  if (level && stage){
    const subjects = stage.subjects?.filter(s=>matchQuery(s.name)) || [];
    const resources = stage.resources?.filter(r=>matchQuery(r.title||r.description)) || [];
    return (
      <Layout>
        <Breadcrumbs trail={[{label:'المكتبة', to:'/library'}, {label: level.title, to:'#'}, {label: stage.title}]} />
        <Toolbar q={q} setQ={setQ} />

        {!!subjects.length && <h3 style={{margin:'8px 0'}}>المقررات</h3>}
        <div className="grid" style={{marginBottom:18}}>
          {subjects.map(s=> <SubjectCard key={s.id} item={s} />)}
        </div>

        <h3 style={{margin:'8px 0'}}>الموارد</h3>
        <div className="list">
          {resources.map(r=> <ResourceItem key={r.id} r={r} />)}
          {!resources.length && <div className="list-item small">لا توجد موارد بعد.</div>}
        </div>

        <div style={{marginTop:12}}>
          <button onClick={()=> setStage(null)}>رجوع للمستوى</button>
        </div>
      </Layout>
    );
  }
}
