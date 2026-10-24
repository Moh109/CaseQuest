import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import FindingParts from "./sections/FindingParts";
import FindingStock from "./sections/FindingStock";
import FindingSafety from "./sections/FindingSafety";
import FindingWarning from "./sections/FindingWarning";
import Prototype from "./sections/Prototype";
import Options from "./sections/Options";
import Rollout from "./sections/Rollout";
import Close from "./sections/Close";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FindingParts />
        <FindingStock />
        <FindingSafety />
        <FindingWarning />
        <Prototype />
        <Options />
        <Rollout />
        <Close />
      </main>
    </>
  );
}
