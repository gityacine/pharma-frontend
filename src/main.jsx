import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from './components/Layout.jsx';
import Home from './components/Home.jsx';
import Calculator, { loader as calculatorLoader } from './components/Calculator.jsx';
import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "calculator",
        element: <Calculator />,
        loader: calculatorLoader
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
