import React, { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import styled from "styled-components";
import PostcardPage from "./PostcardPage";

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  color: #333;
  margin-bottom: 32px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

const Card = styled(Link)`
  display: block;
  text-decoration: none;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  }
`;

const Thumb = styled.img`
  width: 100%;
  display: block;
`;

const CardLabel = styled.div`
  padding: 12px;
  font-size: 14px;
  color: #555;
`;

function Home() {
  const [postcards, setPostcards] = useState([]);

  useEffect(() => {
    fetch("/api/postcards")
      .then((r) => r.json())
      .then((data) => setPostcards(data.postcards));
  }, []);

  return (
    <Container>
      <Title>Postcards</Title>
      <Grid>
        {postcards.map((id) => (
          <Card key={id} to={`/${id}`}>
            <Thumb src={`/postcards/${id}/front.jpeg`} alt={`Postcard ${id}`} />
            <CardLabel>{id}</CardLabel>
          </Card>
        ))}
      </Grid>
    </Container>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:id" element={<PostcardPage />} />
    </Routes>
  );
}

export default App;
