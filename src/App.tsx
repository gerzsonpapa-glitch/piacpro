import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SiteCustomizationProvider } from './contexts/SiteCustomizationContext';
import { RouterContext, useRouterProvider, useRouter } from './lib/router';
import Layout from './components/Layout';
import ChatWidget from './components/ChatWidget';
import { LiveWorldStatsProvider } from './contexts/LiveWorldStatsContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CreateListingPage = lazy(() => import('./pages/CreateListingPage'));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const AuctionsPage = lazy(() => import('./pages/AuctionsPage'));
const AuctionDetailPage = lazy(() => import('./pages/AuctionDetailPage'));
const CreateAuctionPage = lazy(() => import('./pages/CreateAuctionPage'));
const EditListingPage = lazy(() => import('./pages/EditListingPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const RulesPage = lazy(() => import('./pages/RulesPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const ShopsPage = lazy(() => import('./pages/ShopsPage'));
const ShopDetailPage = lazy(() => import('./pages/ShopDetailPage'));
const ShopDashboardPage = lazy(() => import('./pages/ShopDashboardPage'));
const ProducersPage = lazy(() => import('./pages/ProducersPage'));
const ProducerProfilePage = lazy(() => import('./pages/ProducerProfilePage'));
const ProducerSetupPage = lazy(() => import('./pages/ProducerSetupPage'));
const LocalBusinessesPage = lazy(() => import('./pages/LocalBusinessesPage'));
const BusinessProfilePage = lazy(() => import('./pages/BusinessProfilePage'));
const BusinessSetupPage = lazy(() => import('./pages/BusinessSetupPage'));
const DonationsPage = lazy(() => import('./pages/DonationsPage'));
const DonationDetailPage = lazy(() => import('./pages/DonationDetailPage'));
const CreateDonationPage = lazy(() => import('./pages/CreateDonationPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const CreateOfferPage = lazy(() => import('./pages/CreateOfferPage'));
const OfferDetailPage = lazy(() => import('./pages/OfferDetailPage'));
const ForumPage = lazy(() => import('./pages/ForumPage'));
const VedelemPage = lazy(() => import('./pages/VedelemPage'));
const BusinessHubPage = lazy(() => import('./pages/BusinessHubPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const PiacAIChatPage = lazy(() => import('./pages/PiacAIChatPage'));

function PiacAIRedirect() {
  const { navigate } = useRouter();
  useEffect(() => {
    navigate('/create?mode=ai');
  }, [navigate]);
  return <PageLoader />;
}

function PiacAIRoute() {
  const { search } = useRouter();
  if (search.includes('mode=ai') || search.includes('redirect=create')) {
    return <PiacAIRedirect />;
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <PiacAIChatPage />
    </Suspense>
  );
}

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-9 h-9 rounded-full border-2 border-[#00C896]/30 border-t-[#00C896] animate-spin"
          aria-hidden
        />
        <p className="text-sm text-zinc-500">Betöltés…</p>
      </div>
    </div>
  );
}

function JobDetailRedirect() {
  const { navigate, params } = useRouter();
  useEffect(() => {
    if (params.id) navigate(`/jobs/${params.id}`);
    else navigate('/jobs');
  }, [navigate, params.id]);
  return <PageLoader />;
}

function JobCreateRedirect() {
  const { navigate } = useRouter();
  useEffect(() => {
    navigate('/jobs?create=1');
  }, [navigate]);
  return <PageLoader />;
}

function App() {
  const router = useRouterProvider();

  function renderPage() {
    const { path } = router;

    let page: JSX.Element;
    if (path === '/') page = <HomePage />;
    else if (path === '/login') page = <LoginPage />;
    else if (path === '/register') page = <RegisterPage />;
    else if (path === '/reset-password') page = <ResetPasswordPage />;
    else if (path === '/onboarding') page = <OnboardingPage />;
    else if (path === '/hogyan-mukodik') page = <HowItWorksPage />;
    else if (path === '/uzleti') page = <BusinessHubPage />;
    else if (path === '/create') page = <CreateListingPage />;
    else if (path === '/create-auction') page = <CreateAuctionPage />;
    else if (path === '/auctions') page = <AuctionsPage />;
    else if (path === '/search') page = <SearchPage />;
    else if (path === '/discover') page = <DiscoverPage />;
    else if (path === '/favorites') page = <FavoritesPage />;
    else if (path === '/messages') page = <MessagesPage />;
    else if (path.startsWith('/listing/')) page = <ListingDetailPage />;
    else if (path.startsWith('/auction/')) page = <AuctionDetailPage />;
    else if (path.startsWith('/edit-listing/')) page = <EditListingPage />;
    else if (path.startsWith('/checkout/')) page = <CheckoutPage />;
    else if (path.startsWith('/profile/')) page = <ProfilePage key={router.params.id} />;
    else if (path.startsWith('/chat/')) page = <MessagesPage />;
    else if (path === '/admin') page = <AdminPage />;
    else if (path === '/rules') page = <RulesPage />;
    else if (path.startsWith('/jobs/seeker/')) page = <JobsPage />;
    else if (path.startsWith('/job/')) page = <JobDetailRedirect />;
    else if (path === '/create-job') page = <JobCreateRedirect />;
    else if (path.startsWith('/jobs/')) page = <JobsPage />;
    else if (path === '/jobs') page = <JobsPage />;
    else if (path === '/shops') page = <ShopsPage />;
    else if (path.startsWith('/shops/')) page = <ShopDetailPage />;
    else if (path === '/my-shop') page = <ShopDashboardPage />;
    else if (path === '/producers') page = <ProducersPage />;
    else if (path === '/producers/apply') page = <ProducerSetupPage />;
    else if (path.startsWith('/producers/') && !path.endsWith('/edit')) page = <ProducerProfilePage />;
    else if (path.startsWith('/producers/') && path.endsWith('/edit')) page = <ProducerSetupPage />;
    else if (path === '/helyi-vallalkozasok') page = <LocalBusinessesPage />;
    else if (path === '/vallalkozas-regisztracio') page = <BusinessSetupPage />;
    else if (path === '/vallalkozasom') page = <BusinessSetupPage />;
    else if (path.startsWith('/helyi-vallalkozasok/')) page = <BusinessProfilePage id={router.params.id} />;
    else if (path === '/donations') page = <DonationsPage />;
    else if (path === '/donations/create') page = <CreateDonationPage />;
    else if (path.startsWith('/donations/edit/')) page = <CreateDonationPage />;
    else if (path.startsWith('/donations/')) page = <DonationDetailPage />;
    else if (path === '/offers/create') page = <CreateOfferPage />;
    else if (path.startsWith('/offers/')) page = <OfferDetailPage />;
    else if (path === '/forum') page = <ForumPage />;
    else if (path === '/forum/hibak') page = <ForumPage />;
    else if (path.startsWith('/forum/')) page = <ForumPage />;
    else if (path === '/vedelem') page = <VedelemPage />;
    else if (path === '/piac-ai') page = <PiacAIRoute />;
    else if (path === '/ai-assistant') page = <PiacAIRedirect />;
    else {
      page = (
        <div className="text-center py-20">
          <p className="text-zinc-400 text-lg">Oldal nem található</p>
        </div>
      );
    }

    return <Suspense fallback={<PageLoader />}>{page}</Suspense>;
  }

  return (
    <RouterContext.Provider value={router}>
      <AuthProvider>
        <SiteCustomizationProvider>
          <NotificationProvider>
            <LiveWorldStatsProvider>
            <Layout>{renderPage()}</Layout>
            <ChatWidget />
            </LiveWorldStatsProvider>
          </NotificationProvider>
        </SiteCustomizationProvider>
      </AuthProvider>
    </RouterContext.Provider>
  );
}

export default App;
