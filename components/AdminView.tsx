import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, RotateCw, Image, LogOut } from 'lucide-react';
import { Restaurant, User, MenuItem } from '../types';

interface AdminViewProps {
  restaurants: Restaurant[];
  users: User[];
  onAddRestaurant: (r: Restaurant) => void;
  onUpdateRestaurant: (r: Restaurant) => void;
  onDeleteRestaurant: (id: string) => void;
  onAddUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  onLogout: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  restaurants, users, onAddRestaurant, onUpdateRestaurant, onDeleteRestaurant, onAddUser, onDeleteUser, onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'restaurants' | 'users'>('restaurants');
  
  // Restaurant Editing State
  const [editingRestId, setEditingRestId] = useState<string | null>(null);
  const [showAddRestModal, setShowAddRestModal] = useState(false);
  
  // New Restaurant State
  const [newRestName, setNewRestName] = useState('');
  const [newRestImage, setNewRestImage] = useState('');
  const [newRestCuisine, setNewRestCuisine] = useState('');

  // Menu Item Form State
  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // User Adding State
  const [newUserName, setNewUserName] = useState('');

  const handleAddRestaurantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestName || !newRestImage) return;

    const newRestaurant: Restaurant = {
        id: `rest-${Date.now()}`,
        name: newRestName,
        image: newRestImage,
        cuisine: newRestCuisine || 'عام',
        menu: [],
        isOpen: true
    };

    onAddRestaurant(newRestaurant);
    setShowAddRestModal(false);
    setNewRestName('');
    setNewRestImage('');
    setNewRestCuisine('');
  };

  const handleSaveMenuItem = (restaurantId: string) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant || !menuName || !menuPrice) return;

    let updatedMenu = [...restaurant.menu];

    if (editingItemId) {
        // Update existing item
        updatedMenu = updatedMenu.map(item => 
            item.id === editingItemId 
            ? { ...item, name: menuName, price: Number(menuPrice) }
            : item
        );
    } else {
        // Add new item
        const newItem: MenuItem = {
            id: `m-${Date.now()}`,
            name: menuName,
            price: Number(menuPrice),
            category: 'عام'
        };
        updatedMenu.push(newItem);
    }

    const updatedRestaurant = { ...restaurant, menu: updatedMenu };
    onUpdateRestaurant(updatedRestaurant);
    
    // Reset Form
    setMenuName('');
    setMenuPrice('');
    setEditingItemId(null);
  };

  const handleEditItemClick = (item: MenuItem) => {
      setMenuName(item.name);
      setMenuPrice(item.price.toString());
      setEditingItemId(item.id);
  };

  const handleRemoveMenuItem = (restaurantId: string, itemId: string) => {
      if (!window.confirm("حذف هذا الصنف نهائياً؟")) return;
      const restaurant = restaurants.find(r => r.id === restaurantId);
      if(!restaurant) return;
      
      const updatedRestaurant = {
          ...restaurant,
          menu: restaurant.menu.filter(m => m.id !== itemId)
      };
      onUpdateRestaurant(updatedRestaurant);
  };

  const handleRestaurantNameUpdate = (restaurant: Restaurant, newName: string) => {
      const updated = { ...restaurant, name: newName };
      onUpdateRestaurant(updated);
  };

  const handleAddUser = () => {
      if(!newUserName) return;
      onAddUser({
          id: `u-${Date.now()}`,
          name: newUserName,
          role: 'employee',
          avatar: `https://picsum.photos/seed/${Date.now()}/200`
      });
      setNewUserName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-brand-light/30 pb-4">
        <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold text-brand-dark">لوحة التحكم</h2>
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button 
                onClick={() => setActiveTab('restaurants')}
                className={`px-4 py-2 rounded-md transition-all ${activeTab === 'restaurants' ? 'bg-brand-dark text-white shadow' : 'text-gray-500 hover:text-brand-dark'}`}
            >
                إدارة المطاعم
            </button>
            <button 
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-md transition-all ${activeTab === 'users' ? 'bg-brand-dark text-white shadow' : 'text-gray-500 hover:text-brand-dark'}`}
            >
                إدارة الموظفين
            </button>
            </div>
        </div>
        
        <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-bold"
        >
            <LogOut size={18} />
            <span>تسجيل خروج</span>
        </button>
      </div>

      {activeTab === 'restaurants' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {restaurants.map(rest => (
            <div key={rest.id} className="bg-white rounded-2xl shadow-sm border border-brand-light/20 overflow-hidden relative group">
              {/* Delete Restaurant Button - Always Visible */}
              <button 
                onClick={() => onDeleteRestaurant(rest.id)}
                className="absolute top-2 left-2 z-10 bg-red-500 p-2 rounded-full text-white hover:bg-red-600 transition-colors shadow-md"
                title="حذف المطعم"
              >
                  <Trash2 size={18} />
              </button>

              <div className="relative h-32 bg-gray-200">
                <img src={rest.image} alt={rest.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  {editingRestId === rest.id ? (
                      <input 
                        type="text" 
                        value={rest.name}
                        onChange={(e) => handleRestaurantNameUpdate(rest, e.target.value)}
                        className="bg-white/90 text-brand-dark font-bold px-2 py-1 rounded outline-none w-full"
                        autoFocus
                      />
                  ) : (
                      <h3 className="text-xl font-bold text-white">{rest.name}</h3>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">{rest.menu.length} أصناف</span>
                  <button 
                    onClick={() => {
                        if (editingRestId === rest.id) {
                            setEditingRestId(null);
                            setMenuName('');
                            setMenuPrice('');
                            setEditingItemId(null);
                        } else {
                            setEditingRestId(rest.id);
                        }
                    }}
                    className={`flex items-center gap-1 text-sm font-bold transition-colors ${editingRestId === rest.id ? 'text-brand-dark' : 'text-brand-light hover:text-brand-dark'}`}
                  >
                    <Edit2 size={14} /> {editingRestId === rest.id ? 'إغلاق التعديل' : 'تعديل'}
                  </button>
                </div>

                {editingRestId === rest.id && (
                  <div className="bg-brand-offwhite/50 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4">
                     {/* Add/Edit Item Form */}
                     <div className="flex gap-2 items-center">
                        <input 
                            type="text" 
                            placeholder="اسم الصنف" 
                            className="flex-1 p-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-brand-dark outline-none"
                            value={menuName}
                            onChange={(e) => setMenuName(e.target.value)}
                        />
                        <input 
                            type="number" 
                            placeholder="السعر" 
                            className="w-20 p-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-brand-dark outline-none"
                            value={menuPrice}
                            onChange={(e) => setMenuPrice(e.target.value)}
                        />
                        <button 
                            onClick={() => handleSaveMenuItem(rest.id)}
                            className={`p-2 rounded-lg text-white transition-colors ${editingItemId ? 'bg-green-600 hover:bg-green-700' : 'bg-brand-dark hover:bg-brand-light'}`}
                            title={editingItemId ? "حفظ التعديلات" : "إضافة جديد"}
                        >
                            {editingItemId ? <Save size={18} /> : <Plus size={18} />}
                        </button>
                        {editingItemId && (
                            <button 
                                onClick={() => {
                                    setEditingItemId(null);
                                    setMenuName('');
                                    setMenuPrice('');
                                }}
                                className="text-gray-500 hover:text-gray-700"
                                title="إلغاء التعديل"
                            >
                                <X size={18} />
                            </button>
                        )}
                     </div>

                     {/* List Items */}
                     <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                         {rest.menu.map(item => (
                             <li key={item.id} className={`flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border ${editingItemId === item.id ? 'border-brand-dark ring-1 ring-brand-dark' : 'border-transparent'}`}>
                                 <span className="text-sm font-medium truncate flex-1 ml-2">{item.name}</span>
                                 <div className="flex items-center gap-2 flex-shrink-0">
                                     <span className="text-xs text-gray-500 font-mono">{item.price}</span>
                                     <button onClick={() => handleEditItemClick(item)} className="text-blue-400 hover:text-blue-600 p-1">
                                         <Edit2 size={14} />
                                     </button>
                                     <button onClick={() => handleRemoveMenuItem(rest.id, item.id)} className="text-red-400 hover:text-red-600 p-1">
                                         <Trash2 size={14} />
                                     </button>
                                 </div>
                             </li>
                         ))}
                     </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Add Restaurant Button */}
          <button 
            onClick={() => setShowAddRestModal(true)}
            className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-brand-light hover:text-brand-dark transition-all h-64 bg-white/50"
          >
            <Plus size={48} className="mb-2" />
            <span className="font-bold">إضافة مطعم جديد</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-light/20 p-6">
            <div className="flex gap-4 mb-6">
                <input 
                    type="text" 
                    placeholder="اسم الموظف الجديد..." 
                    className="flex-1 p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-dark"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                />
                <button 
                    onClick={handleAddUser}
                    className="bg-brand-dark text-white px-6 rounded-xl font-bold hover:bg-brand-light transition-colors"
                >
                    إضافة
                </button>
            </div>

            <div className="space-y-2">
                {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 hover:bg-brand-offwhite rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-bold text-brand-dark">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.role === 'admin' ? 'مدير' : 'موظف'}</p>
                            </div>
                        </div>
                        {user.role !== 'admin' && (
                             <button onClick={() => onDeleteUser(user.id)} className="text-gray-400 hover:text-red-500 p-2">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Add Restaurant Modal */}
      {showAddRestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
             <div className="bg-brand-dark p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">إضافة مطعم جديد</h3>
              <button onClick={() => setShowAddRestModal(false)} className="hover:text-red-300"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddRestaurantSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">اسم المطعم</label>
                  <input 
                    type="text"
                    required
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark outline-none"
                    value={newRestName}
                    onChange={e => setNewRestName(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">نوع الطعام (مطبخ)</label>
                  <input 
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark outline-none"
                    value={newRestCuisine}
                    onChange={e => setNewRestCuisine(e.target.value)}
                    placeholder="مثال: شامي، غربي، صحي..."
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رابط الصورة (URL)</label>
                  <div className="relative">
                    <input 
                        type="url"
                        required
                        className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-dark outline-none dir-ltr text-left"
                        value={newRestImage}
                        onChange={e => setNewRestImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                    />
                    <Image size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  </div>
               </div>
               
               <button className="w-full bg-brand-dark text-white font-bold py-3 rounded-xl hover:bg-brand-light hover:text-brand-dark transition-all mt-4">
                   حفظ وإضافة
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;