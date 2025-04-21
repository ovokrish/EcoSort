import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ScanWaste from "./pages/ScanWaste";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import ChatEcoGuide from "./pages/ChatEcoGuide";
import NotFound from "./pages/NotFound";
import WasteClassifier from "./Try";
// @ts-ignore
import CommunityChattry from "./ChatTry";
// import CommunityChat from "./components/chat/CommunityChat";
// import WasteClassifie from "./Try";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
        {/* <Route path="/try" element={<WasteClassifie />} /> */}
        <Route path="/try" element={<WasteClassifier></WasteClassifier>} />
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scan" element={<ScanWaste />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cht" element={<CommunityChattry />} />
          <Route path="/chat" element={<ChatEcoGuide />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
