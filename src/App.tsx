import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import FindingParts from "./sections/FindingParts";
import FindingSafety from "./sections/FindingSafety";
import FindingWarning from "./sections/FindingWarning";
import Prototype from "./sections/Prototype";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FindingParts />
        <FindingSafety />
        <FindingWarning />
        <Prototype />
      </main>
    </>
  );
}
