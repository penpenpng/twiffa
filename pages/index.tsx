import { FunctionComponent } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Home from "../components/Home";

const page: FunctionComponent = () => {
  return (
    <div className="h-screen bg-yellow-50">
      <Header />
      <Home />
      <Footer />
    </div>
  );
};

export default page;
