import React from "react";
import {
  AppBar, Toolbar, IconButton, Typography, Box, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, Tooltip, useMediaQuery, Button
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SchoolIcon from "@mui/icons-material/School";
import GridViewIcon from "@mui/icons-material/GridView";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useNavigate, useLocation } from "react-router-dom";
import { ColorModeContext } from "../theme";

const drawerWidth = 260;

export default function Shell({ children }) {
  const [open, setOpen] = React.useState(false);
  const isMdUp = useMediaQuery("(min-width:900px)");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const colorMode = React.useContext(ColorModeContext);

  const menu = [
    { to: "/", icon: <SchoolIcon />, label: "الصفحة الرئيسية" },
    { to: "/browse", icon: <GridViewIcon />, label: "تصفّح المواد" },
    { to: "/admin", icon: <SettingsIcon />, label: "لوحة الإدارة" },
  ];

  const DrawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" sx={{ px: 2.5, py: 2 }}>📚 بناء منهجي</Typography>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {menu.map((m) => (
          <ListItemButton key={m.to} selected={pathname === m.to} onClick={() => { navigate(m.to); if(!isMdUp) setOpen(false); }}>
            <ListItemIcon>{m.icon}</ListItemIcon>
            <ListItemText primary={m.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: "flex", gap: 1 }}>
        <Button fullWidth variant="outlined" onClick={() => window.open("https://docs.google.com", "_blank")}>
          دليل الطالب
        </Button>
        <Button fullWidth variant="outlined" onClick={() => window.open("https://forms.gle", "_blank")}>
          تواصل
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" color="transparent" elevation={0}
        sx={{ backdropFilter: "blur(6px)", borderBottom: (t)=>`1px solid ${t.palette.divider}` }}>
        <Toolbar>
          {!isMdUp && (
            <IconButton edge="start" onClick={() => setOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography sx={{ flexGrow: 1, fontWeight: 700 }}>بناء منهجي</Typography>
          <Tooltip title="تبديل الوضع">
            <IconButton onClick={colorMode.toggle}>
              {/* سنختبر خلفية الصفحة لعرض الأيقونة المناسبة */}
              <LightModeIcon sx={{ display: { xs: "none" } }} />
              <DarkModeIcon sx={{ display: { xs: "none" } }} />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      {isMdUp ? (
        <Drawer variant="permanent" open
          sx={{ width: drawerWidth, flexShrink: 0,
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", borderLeft: 0, borderRight: (t)=>`1px solid ${t.palette.divider}` }}}>
          {DrawerContent}
        </Drawer>
      ) : (
        <Drawer anchor="right" open={open} onClose={()=>setOpen(false)}>
          {DrawerContent}
        </Drawer>
      )}

      {/* المحتوى */}
      <Box component="main" sx={{
        flexGrow: 1,
        px: { xs: 2, md: 4 },
        py: { xs: 10, md: 12 },
        ml: { md: 0 },
        mr: { md: drawerWidth },  // لأن الـ Drawer على اليمين في RTL
        maxWidth: 1400,
        width: "100%",
        mx: "auto",
      }}>
        {children}
      </Box>
    </Box>
  );
}
