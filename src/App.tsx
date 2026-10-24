import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import FindingParts from "./sections/FindingParts";
import FindingSafety from "./sections/FindingSafety";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FindingParts />
        <FindingSafety />
      </main>
    </>
  );
}
