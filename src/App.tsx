import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage/LandingPage";

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes >
          <Route index element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
      Welcome to the homepage
    </div>
  )
}
export default App;