import React from 'react';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export default function ByScience(){
  const [sciences,setSciences]=React.useState([]);
  const [selected,setSelected]=React.useState(null);
  const [q,setQ]=React.useState('');
  const [resources,setResources]=React.useState([]);

  React.useEffect(()=>{ fetch(`${API}/sciences`).then(r=>r.json()).then(setSciences); },[]);
  React.useEffect(()=>{
    if(!selected) return setResources([]);
    fetch(`${API}/sciences/${selected.id}/resources`).then(r=>r.json()).then(rs=>{
      setResources(q? rs.filter(x=>x.title?.includes(q) || x.description?.includes(q)): rs);
    });
  },[selected,q]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <Autocomplete
          options={sciences}
          getOptionLabel={(o)=>o.name_ar}
          value={selected}
          onChange={(_,v)=>setSelected(v)}
          renderInput={(p)=><TextField {...p} label="اختر علمًا" />}
          sx={{ minWidth: 320 }}
        />
        <TextField label="بحث" value={q} onChange={e=>setQ(e.target.value)} />
      </Stack>

      <Grid container spacing={2}>
        {resources.map(r=>(
          <Grid key={r.id} size={{ xs:12, sm:6, md:4 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700}>{r.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ my:0.5 }}>{r.description || ''}</Typography>
                <Button href={r.url} target="_blank">فتح</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!resources.length && (
          <Grid size={12}><Typography color="text.secondary">اختر علمًا ثم ابحث.</Typography></Grid>
        )}
      </Grid>
    </Stack>
  );
}


