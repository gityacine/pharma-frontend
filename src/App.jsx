import reactLogo from './assets/react.svg';
import './App.css';
import { Outlet, Routes, Route } from 'react-router-dom';
import Home from './components/Home';


export default function App() {


  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </>
  )
}

function Layout() {
  return (
    <>
      <Outlet />
    </>
  );
}

function About() {
  return (
    <p>Some info about whatever this is</p>
  );
}