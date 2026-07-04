import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Checkout2, ErrorPage } from "./pages";
import NewThankyouPage from "./pages/NewThankyouPage";

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Checkout2 />} />
          <Route path="*" element={<ErrorPage />} />
          <Route path="/ErrorPage" element={<ErrorPage />} />
          <Route path="/thankyou-page" element={<NewThankyouPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
