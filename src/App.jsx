import React from "react";
import { Routes, Route } from "react-router-dom";
import styled from "styled-components";
import PostcardPage from "./PostcardPage";

const Message = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  color: #fff;
  font-weight: 500;
  font-size: 24px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;

function App() {
  return (
    <Routes>
      <Route path="/" element={<Message>No postcard selected</Message>} />
      <Route path="/:id" element={<PostcardPage />} />
    </Routes>
  );
}

export default App;
