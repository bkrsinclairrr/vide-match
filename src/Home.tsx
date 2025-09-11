const queryClient = new QueryClient();

const Home = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        ...
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default Home;
