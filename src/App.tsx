import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import FindingParts from "./sections/FindingParts";
import FindingSafety from "./sections/FindingSafety";
import FindingWarning from "./sections/FindingWarning";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FindingParts />
        <FindingSafety />
        <FindingWarning />
      </main>
    </>
  );
}
