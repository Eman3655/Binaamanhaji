import logo from '../assets/logo.png'; // غيّر المسار إذا كان في مكان آخر

function Navbar() {
  return (
    <header className="flex items-center gap-2 p-4 bg-white shadow">
      <img src={logo} alt="Logo" className="w-20 h-auto" />
      <h1 className="text-2xl font-semibold text-green-700">
        مواد البناء المنهجي
      </h1>
    </header>
  );
}

export default Navbar;
