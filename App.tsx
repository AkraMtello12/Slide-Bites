import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import RestaurantView from './components/RestaurantView';
import VotingView from './components/VotingView';
import AdminView from './components/AdminView';
import { User, Restaurant, Poll, OrderItem, ViewState } from './types';
import { ArrowRight, Lock, Loader2, UserCircle } from 'lucide-react';
import * as api from './lib/firebase';

const App: React.FC = () => {
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [loading, setLoading] = useState(true);
  
  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Data State (from Firebase)
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  
  // Orders State: Current Active Restaurant Orders
  const [currentRestaurantOrders, setCurrentRestaurantOrders] = useState<OrderItem[]>([]);
  const [currentDeliveryFee, setCurrentDeliveryFee] = useState<number>(0);
  const [isOrderLocked, setIsOrderLocked] = useState<boolean>(false);
  
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // --- Initial Data Subscriptions ---
  useEffect(() => {
    const unsubUsers = api.subscribeToUsers((data) => {
        // Filter out any user marked as 'admin' in DB from the general list if you want strict hiding,
        // or simply rely on the UI not showing them.
        const generalUsers = data.filter(u => u.role !== 'admin');
        setUsers(generalUsers);
        
        // Auto-login first available employee
        if (!currentUser && generalUsers.length > 0) {
            setCurrentUser(generalUsers[0]);
        }
    });

    const unsubRestaurants = api.subscribeToRestaurants((data) => {
        setRestaurants(data);
    });

    const unsubPolls = api.subscribeToPolls((data) => {
        setPolls(data);
        setLoading(false);
    });

    return () => {
        unsubUsers();
        unsubRestaurants();
        unsubPolls();
    };
  }, []); 

  // --- Order Subscription (When viewing a restaurant) ---
  useEffect(() => {
    if (selectedRestaurantId) {
        const unsubOrders = api.subscribeToRestaurantOrders(selectedRestaurantId, (items, fee, locked) => {
            setCurrentRestaurantOrders(items);
            setCurrentDeliveryFee(fee);
            setIsOrderLocked(locked);
        });
        return () => unsubOrders();
    } else {
        setCurrentRestaurantOrders([]);
        setCurrentDeliveryFee(0);
        setIsOrderLocked(false);
    }
  }, [selectedRestaurantId]);


  // --- Handlers ---

  const handleUpdateOrder = (restaurantId: string, items: OrderItem[], deliveryFee: number) => {
    // We maintain the current lock state when updating items/fee
    api.updateRestaurantOrdersInDb(restaurantId, items, deliveryFee, isOrderLocked);
  };

  const handleToggleLockOrder = (restaurantId: string, locked: boolean) => {
      api.updateRestaurantOrdersInDb(restaurantId, currentRestaurantOrders, currentDeliveryFee, locked);
  };

  const handleCastVote = (pollId: string, optionId: string, userId: string) => {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    // Check if user already voted in this poll
    const existingVoteOption = poll.options.find(opt => opt.voterIds.includes(userId));

    let updatedOptions = [...poll.options];

    // If user previously voted...
    if (existingVoteOption) {
        // Remove vote from the old option
        updatedOptions = updatedOptions.map(opt => {
            if (opt.id === existingVoteOption.id) {
                return {
                    ...opt,
                    votes: Math.max(0, opt.votes - 1),
                    voterIds: opt.voterIds.filter(id => id !== userId)
                };
            }
            return opt;
        });

        // Logic: If they clicked the SAME option, we stop here (toggle off / un-vote).
        if (existingVoteOption.id === optionId) {
             api.voteOnPollInDb(pollId, updatedOptions);
             return;
        }
    }

    // Add vote to the new option (if it wasn't a toggle-off)
    updatedOptions = updatedOptions.map(opt => {
        if (opt.id === optionId) {
            return {
                ...opt,
                votes: opt.votes + 1,
                voterIds: [...opt.voterIds, userId]
            };
        }
        return opt;
    });

    api.voteOnPollInDb(pollId, updatedOptions);
  };

  const handleCreatePoll = (newPoll: Poll) => {
    api.addPollToDb(newPoll);
  };

  const handleDeletePoll = (pollId: string) => {
    if(window.confirm("هل أنت متأكد من حذف هذا التصويت؟")) {
        api.deletePollFromDb(pollId);
    }
  }

  const handleAddRestaurant = (newRest: Restaurant) => {
    api.addRestaurantToDb(newRest);
  };

  const handleUpdateRestaurant = (updatedRest: Restaurant) => {
    api.updateRestaurantInDb(updatedRest);
  };
  
  const handleDeleteRestaurant = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المطعم بالكامل؟')) {
        api.deleteRestaurantFromDb(id);
    }
  };

  const handleAddUser = (newUser: User) => {
    api.addUserToDb(newUser);
  };
  
  const handleDeleteUser = (id: string) => {
    api.deleteUserFromDb(id);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === 'akram' && adminPassword === 'akram171') {
      setIsAdminLoggedIn(true);
      setAuthError('');
    } else {
      setAuthError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleAdminLogout = () => {
      setIsAdminLoggedIn(false);
      setAdminUsername('');
      setAdminPassword('');
  };

  // --- Time Based Greeting Logic ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    // Before 1 PM (13:00) -> Morning, After -> Evening
    return hour < 13 ? 'صباح الخير' : 'مساء الخير';
  };

  // --- Render Views ---

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-brand-offwhite text-brand-dark">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="font-bold">جاري تحميل البيانات...</p>
          </div>
      );
  }

  // Fallback user if DB is empty to prevent crash
  const fallbackUser: User = { id: 'guest', name: 'زائر', role: 'employee' };
  const activeUser = currentUser || users[0] || fallbackUser;

  const renderContent = () => {
    // 1. Restaurant Detail View
    if (selectedRestaurantId && currentView === 'restaurant') {
      const restaurant = restaurants.find(r => r.id === selectedRestaurantId);
      if (!restaurant) return null;
      return (
        <RestaurantView 
          restaurant={restaurant}
          users={users}
          currentOrderItems={currentRestaurantOrders}
          currentDeliveryFee={currentDeliveryFee}
          isOrderLocked={isOrderLocked}
          onUpdateOrder={handleUpdateOrder}
          onToggleLock={handleToggleLockOrder}
          onBack={() => {
            setSelectedRestaurantId(null);
            setCurrentView('home');
          }}
        />
      );
    }

    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-8">
            <header className="flex justify-between items-end">
              <div>
                 <h1 className="text-3xl font-bold text-brand-dark mb-2">{getGreeting()}</h1>
                 <p className="text-gray-500">من وين حابين تفطروا اليوم؟</p>
              </div>
              <div className="flex gap-2">
                 {/* Quick Switch User - Excludes Admin */}
                 {users.length > 0 ? (
                    <select 
                        className="bg-white border text-sm p-2 rounded-lg cursor-pointer hover:border-brand-dark transition-colors"
                        onChange={(e) => {
                            const u = users.find(user => user.id === e.target.value);
                            if(u) setCurrentUser(u);
                        }}
                        value={activeUser.id}
                    >
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                 ) : (
                    <span className="text-xs text-red-400 bg-red-50 p-2 rounded">لا يوجد موظفين</span>
                 )}
              </div>
            </header>

            {/* Restaurants Grid */}
            {restaurants.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 mb-4">لا يوجد مطاعم مضافة حالياً</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map(rest => (
                    <div 
                    key={rest.id} 
                    onClick={() => {
                        setSelectedRestaurantId(rest.id);
                        setCurrentView('restaurant');
                    }}
                    className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-transparent hover:border-brand-light/30"
                    >
                    <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                        <img src={rest.image} alt={rest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-brand-dark">
                        {rest.isOpen ? 'مفتوح للطلب' : 'مغلق'}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-brand-dark">{rest.name}</h3>
                        <p className="text-brand-light text-sm mb-4">{rest.cuisine}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{rest.menu.length} أصناف</span>
                            <span className="flex items-center gap-1 text-brand-dark font-medium group-hover:gap-2 transition-all">
                                اطلب الآن <ArrowRight size={14}/>
                            </span>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
            
            {/* Active Poll Teaser */}
            <div className="bg-gradient-to-r from-brand-dark to-[#2d4d85] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">تصويتات نشطة</h3>
                        <p className="text-brand-light mb-4">شارك برأيك في {polls.filter(p => p.isActive).length} تصويتات مفتوحة للفطور القادم.</p>
                        <button 
                          onClick={() => setCurrentView('voting')}
                          className="bg-white text-brand-dark px-6 py-2 rounded-xl font-bold hover:bg-brand-light transition-colors"
                        >
                            استعراض التصويتات
                        </button>
                    </div>
                </div>
                {/* Decoration Circles */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 right-10 w-60 h-60 bg-brand-accent/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        );

      case 'voting':
        return (
          <VotingView 
            polls={polls} 
            currentUser={activeUser} 
            onVote={handleCastVote}
            onCreatePoll={handleCreatePoll}
            onDeletePoll={handleDeletePoll}
          />
        );

      case 'admin':
        if (!isAdminLoggedIn) {
          return (
            <div className="flex items-center justify-center h-full">
               <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-brand-light/20">
                  <div className="flex flex-col items-center mb-6">
                     <div className="w-16 h-16 bg-brand-offwhite rounded-full flex items-center justify-center text-brand-dark mb-4">
                        <Lock size={32} />
                     </div>
                     <h2 className="text-2xl font-bold text-brand-dark">دخول المدير</h2>
                     <p className="text-gray-500 text-sm">منطقة محظورة للموظفين</p>
                  </div>
                  
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">اسم المستخدم</label>
                        <input 
                           type="text" 
                           className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark outline-none dir-ltr"
                           value={adminUsername}
                           onChange={e => setAdminUsername(e.target.value)}
                           dir="ltr"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور</label>
                        <input 
                           type="password" 
                           className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark outline-none dir-ltr"
                           value={adminPassword}
                           onChange={e => setAdminPassword(e.target.value)}
                           dir="ltr"
                        />
                     </div>
                     
                     {authError && <p className="text-red-500 text-sm font-bold text-center">{authError}</p>}

                     <button className="w-full bg-brand-dark text-white font-bold py-3 rounded-xl hover:bg-brand-light hover:text-brand-dark transition-all shadow-lg">
                        دخول
                     </button>
                  </form>
               </div>
            </div>
          );
        }
        return (
          <AdminView 
             restaurants={restaurants}
             users={users} 
             onAddRestaurant={handleAddRestaurant} 
             onUpdateRestaurant={handleUpdateRestaurant}
             onDeleteRestaurant={handleDeleteRestaurant}
             onAddUser={handleAddUser}
             onDeleteUser={handleDeleteUser}
             onLogout={handleAdminLogout}
          />
        );
        
      default:
        return <div>Not found</div>;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      setCurrentView={(view) => {
        setCurrentView(view);
        setSelectedRestaurantId(null);
      }}
      currentUser={activeUser}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;