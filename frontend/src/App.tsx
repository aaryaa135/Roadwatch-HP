import { Router } from "./router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Report } from "./pages/Report";
import { Map } from "./pages/Map";
import { Admin } from "./pages/Admin";

const routes = [
  { path: "/", element: Home },
  { path: "/report", element: Report },
  { path: "/map", element: Map },
  { path: "/admin", element: Admin },
];

export default function App() {
  return (
    <div className="flex min-h-screen flex-col text-gray-900">
      <Navbar />
      <main className="flex-grow">
        <Router routes={routes} />
      </main>
      <Footer />
    </div>
  );
}
