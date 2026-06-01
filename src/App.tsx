import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RouterContext, useRouterProvider } from './lib/router';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailPage from './pages/ListingDetailPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import MessagesPage from './pages/MessagesPage';
import AuctionsPage from './pages/AuctionsPage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import EditListingPage from './pages/EditListingPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminPage from './pages/AdminPage';
import RulesPage from './pages/RulesPage';
import JobsPage from './pages/JobsPage';
import ShopsPage from './pages/ShopsPage';
import ShopDetailPage from './pages/ShopDetailPage';
import ShopDashboardPage from './pages/ShopDashboardPage';
import ProducersPage from './pages/ProducersPage';
import ProducerProfilePage from './pages/ProducerProfilePage';
import ProducerSetupPage from './pages/ProducerSetupPage';
import LocalBusinessesPage from './pages/LocalBusinessesPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import BusinessSetupPage from './pages/BusinessSetupPage';
import DonationsPage from './pages/DonationsPage';
import DonationDetailPage from './pages/DonationDetailPage';
import CreateDonationPage from './pages/CreateDonationPage';
import DiscoverPage from './pages/DiscoverPage';
import CreateOfferPage from './pages/CreateOfferPage';
import OfferDetailPage from './pages/OfferDetailPage';
import ForumPage from './pages/ForumPage';
import VedelemPage from './pages/VedelemPage';
import PiacAIChatPage from './pages/PiacAIChatPage';

function App() {
  const router = useRouterProvider();

  function renderPage() {
    const { path } = router;

    if (path === '/') return <HomePage />;
    if (path === '/login') return <LoginPage />;
    if (path === '/register') return <RegisterPage />;
    if (path === '/create') return <CreateListingPage />;
    if (path === '/create-auction') return <CreateAuctionPage />;
    if (path === '/auctions') return <AuctionsPage />;
    if (path === '/search') return <SearchPage />;
    if (path === '/discover') return <DiscoverPage />;
    if (path === '/favorites') return <FavoritesPage />;
    if (path === '/messages') return <MessagesPage />;
    if (path.startsWith('/listing/')) return <ListingDetailPage />;
    if (path.startsWith('/auction/')) return <AuctionDetailPage />;
    if (path.startsWith('/edit-listing/')) return <EditListingPage />;
    if (path.startsWith('/checkout/')) return <CheckoutPage />;
    if (path.startsWith('/profile/')) return <ProfilePage key={router.params.id} />;
    if (path.startsWith('/chat/')) return <MessagesPage />;
    if (path === '/admin') return <AdminPage />;
    if (path === '/rules') return <RulesPage />;
    if (path === '/jobs') return <JobsPage />;
    if (path === '/shops') return <ShopsPage />;
    if (path.startsWith('/shops/')) return <ShopDetailPage />;
    if (path === '/my-shop') return <ShopDashboardPage />;
    if (path === '/producers') return <ProducersPage />;
    if (path === '/producers/apply') return <ProducerSetupPage />;
    if (path.startsWith('/producers/') && !path.endsWith('/edit')) return <ProducerProfilePage />;
    if (path.startsWith('/producers/') && path.endsWith('/edit')) return <ProducerSetupPage />;
    if (path === '/helyi-vallalkozasok') return <LocalBusinessesPage />;
    if (path === '/vallalkozas-regisztracio') return <BusinessSetupPage />;
    if (path === '/vallalkozasom') return <BusinessSetupPage />;
    if (path.startsWith('/helyi-vallalkozasok/')) return <BusinessProfilePage id={router.params.id} />;
    if (path === '/donations') return <DonationsPage />;
    if (path === '/donations/create') return <CreateDonationPage />;
    if (path.startsWith('/donations/edit/')) return <CreateDonationPage />;
    if (path.startsWith('/donations/')) return <DonationDetailPage />;
    if (path === '/offers/create') return <CreateOfferPage />;
    if (path.startsWith('/offers/')) return <OfferDetailPage />;
    if (path === '/forum') return <ForumPage />;
    if (path === '/forum/hibak') return <ForumPage />;
    if (path.startsWith('/forum/')) return <ForumPage />;
    if (path === '/vedelem') return <VedelemPage />;
    if (path === '/piac-ai') return <PiacAIChatPage />;

    return (
      <div className="text-center py-20">
        <p className="text-zinc-400 text-lg">Oldal nem található</p>
      </div>
    );
  }

  return (
    <RouterContext.Provider value={router}>
      <AuthProvider>
        <NotificationProvider>
          <Layout>{renderPage()}</Layout>
        </NotificationProvider>
      </AuthProvider>
    </RouterContext.Provider>
  );
}

export default App;
