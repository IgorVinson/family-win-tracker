import Header from "@/components/layout/Header";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Auth from "./pages/Auth";
import IndexWrapper from "./pages/IndexWrapper";
import KidDashboard from "./pages/KidDashboard";
import NotFound from "./pages/NotFound";

function AppContent() {
  const location = useLocation();
  const hideHeader = location.pathname.startsWith("/auth");
  return (
    <>
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<IndexWrapper />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/kid/:id" element={<KidDashboard />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
