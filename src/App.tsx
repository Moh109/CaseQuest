import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import FindingParts from "./sections/FindingParts";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FindingParts />
      </main>
    </>
  );
}
