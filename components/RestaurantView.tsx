import React, { useState, useMemo } from 'react';
import { Plus, Minus, ShoppingBag, ChevronDown, Trash2, ArrowRight, Truck } from 'lucide-react';
import { Restaurant, User, OrderItem, MenuItem } from '../types';

interface RestaurantViewProps {
  restaurant: Restaurant;
  users: User[];
  currentOrderItems: OrderItem[];
  currentDeliveryFee: number;
  onUpdateOrder: (restaurantId: string, items: OrderItem[], deliveryFee: number) => void;
  onBack: () => void;
}

const RestaurantView: React.FC<RestaurantViewProps> = ({ 
  restaurant, 
  users, 
  currentOrderItems, 
  currentDeliveryFee,
  onUpdateOrder,
  onBack
}) => {
  const [activeUserId, setActiveUserId] = useState<string>('');
  
  // Filter orders related to this restaurant only
  const myOrders = useMemo(() => currentOrderItems, [currentOrderItems]);

  const handleAddItem = (item: MenuItem) => {
    if (!activeUserId) {
      alert("الرجاء اختيار اسم الموظف أولاً");
      return;
    }
    const user = users.find(u => u.id === activeUserId);
    if (!user) return;

    const existingItemIndex = myOrders.findIndex(
      o => o.userId === activeUserId && o.itemId === item.id
    );

    let newOrders = [...myOrders];

    if (existingItemIndex > -1) {
      newOrders[existingItemIndex] = {
        ...newOrders[existingItemIndex],
        quantity: newOrders[existingItemIndex].quantity + 1
      };
    } else {
      newOrders.push({
        itemId: item.id,
        menuItem: item,
        quantity: 1,
        userId: activeUserId,
        userName: user.name
      });
    }
    onUpdateOrder(restaurant.id, newOrders, currentDeliveryFee);
  };

  const handleRemoveItem = (item: MenuItem, userId: string) => {
     const existingItemIndex = myOrders.findIndex(
      o => o.userId === userId && o.itemId === item.id
    );

    if (existingItemIndex === -1) return;

    let newOrders = [...myOrders];
    if (newOrders[existingItemIndex].quantity > 1) {
      newOrders[existingItemIndex] = {
        ...newOrders[existingItemIndex],
        quantity: newOrders[existingItemIndex].quantity - 1
      };
    } else {
      newOrders.splice(existingItemIndex, 1);
    }
    onUpdateOrder(restaurant.id, newOrders, currentDeliveryFee);
  };

  const handleDeliveryFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value) || 0;
      onUpdateOrder(restaurant.id, myOrders, val);
  };

  // Grouping for Side Panel (Per User)
  const ordersByUser = useMemo(() => {
    const grouped: Record<string, { items: OrderItem[], foodTotal: number, name: string }> = {};
    
    // 1. Calculate Food Total
    myOrders.forEach(order => {
      if (!grouped[order.userId]) {
        grouped[order.userId] = { 
          items: [], 
          foodTotal: 0, 
          name: order.userName 
        };
      }
      grouped[order.userId].items.push(order);
      grouped[order.userId].foodTotal += order.menuItem.price * order.quantity;
    });

    return grouped;
  }, [myOrders]);

  // Aggregation for Bottom Panel (Total Items)
  const aggregatedItems = useMemo(() => {
    const agg: Record<string, { name: string, count: number, price: number }> = {};
    let grandFoodTotal = 0;

    myOrders.forEach(order => {
      if (!agg[order.itemId]) {
        agg[order.itemId] = { 
          name: order.menuItem.name, 
          count: 0,
          price: order.menuItem.price
        };
      }
      agg[order.itemId].count += order.quantity;
      grandFoodTotal += order.menuItem.price * order.quantity;
    });

    return { items: Object.values(agg), grandFoodTotal };
  }, [myOrders]);

  // Calculate Delivery Split
  const distinctUsersCount = Object.keys(ordersByUser).length;
  const deliveryPerUser = distinctUsersCount > 0 ? currentDeliveryFee / distinctUsersCount : 0;

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-brand-light/20">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowRight className="text-brand-dark" />
        </button>
        <img src={restaurant.image} alt={restaurant.name} className="w-16 h-16 rounded-xl object-cover" />
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">{restaurant.name}</h2>
          <p className="text-brand-light text-sm">{restaurant.cuisine}</p>
        </div>
        
        <div className="mr-auto flex items-center gap-3 bg-brand-offwhite p-2 rounded-xl">
          <span className="text-brand-dark text-sm font-medium">الطلب باسم:</span>
          <div className="relative">
            <select 
              className="appearance-none bg-white text-brand-dark font-bold py-2 px-4 pr-8 rounded-lg border border-brand-light/30 focus:outline-none focus:ring-2 focus:ring-brand-dark cursor-pointer min-w-[200px]"
              value={activeUserId}
              onChange={(e) => setActiveUserId(e.target.value)}
            >
              <option value="" disabled>اختر موظف...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute top-3 left-3 text-brand-light pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto pb-48">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {restaurant.menu.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-transparent hover:border-brand-light/50 transition-all group flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-brand-dark">{item.name}</h3>
                    <span className="bg-brand-offwhite text-brand-dark text-xs font-bold px-2 py-1 rounded-md">
                      {item.price.toLocaleString()} ل.س
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">{item.category}</p>
                </div>
                
                <button 
                  onClick={() => handleAddItem(item)}
                  className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                    activeUserId 
                    ? 'bg-brand-dark text-white hover:bg-brand-light hover:text-brand-dark' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!activeUserId}
                >
                  <Plus size={18} />
                  <span>إضافة للطلب</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel: Individual Summaries */}
        <div className="w-full lg:w-96 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-brand-light/20 flex flex-col overflow-hidden h-[400px] lg:h-auto pb-24">
          <div className="p-4 bg-brand-dark text-white">
            <h3 className="font-bold flex items-center gap-2">
              <ShoppingBag size={20} />
              طلبات الموظفين
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {Object.keys(ordersByUser).length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                 <ShoppingBag size={48} className="mb-2 opacity-20" />
                 <p>لم يطلب أحد بعد...</p>
               </div>
            ) : (
              Object.entries(ordersByUser).map(([userId, userOrder]) => {
                  const finalUserTotal = userOrder.foodTotal + deliveryPerUser;
                  return (
                    <div key={userId} className={`bg-white rounded-xl p-3 border shadow-sm ${userId === activeUserId ? 'border-brand-light ring-1 ring-brand-light' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-2 border-b border-dashed border-gray-200 pb-2">
                        <h4 className="font-bold text-brand-dark">{userOrder.name}</h4>
                        <div className="text-left">
                            <span className="text-sm font-bold text-brand-light block">{finalUserTotal.toLocaleString()}</span>
                            {deliveryPerUser > 0 && (
                                <span className="text-[10px] text-gray-400 block">(شامل التوصيل)</span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        {userOrder.items.map((orderItem, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                            <span className="bg-brand-offwhite text-brand-dark px-2 rounded text-xs">{orderItem.quantity}x</span>
                            <span className="text-gray-700">{orderItem.menuItem.name}</span>
                            </div>
                            {activeUserId === userId && (
                                <button onClick={() => handleRemoveItem(orderItem.menuItem, userId)} className="text-red-400 hover:text-red-600">
                                    <Minus size={14} />
                                </button>
                            )}
                        </div>
                        ))}
                    </div>
                    </div>
                  );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Aggregation Summary (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-brand-dark text-white shadow-[0_-5px_20px_rgba(0,0,0,0.2)] z-50 p-4 md:mr-64 rounded-t-3xl transition-transform transform">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full overflow-x-auto">
                <div className="flex items-center gap-4 min-w-max">
                   <div className="font-bold text-brand-light border-l border-brand-light/30 pl-4 ml-2">
                        ملخص الطلب الكلي:
                   </div>
                   {aggregatedItems.items.length === 0 && <span className="text-white/50 text-sm">السلة فارغة</span>}
                   {aggregatedItems.items.map((agg, idx) => (
                       <div key={idx} className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                           <span className="font-bold text-brand-accent">{agg.count}</span>
                           <span className="text-sm text-gray-200">{agg.name}</span>
                       </div>
                   ))}
                </div>
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap items-center gap-6 border-t md:border-t-0 md:border-r border-white/20 pt-2 md:pt-0 md:pr-6 w-full md:w-auto justify-between md:justify-end">
                
                {/* Delivery Fee Input */}
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg">
                    <Truck size={18} className="text-brand-light"/>
                    <div className="flex flex-col">
                        <label className="text-[10px] text-gray-300">أجرة التوصيل</label>
                        <input 
                            type="number" 
                            className="bg-transparent border-none outline-none text-white font-bold w-20 text-sm placeholder-gray-500"
                            placeholder="0"
                            value={currentDeliveryFee > 0 ? currentDeliveryFee : ''}
                            onChange={handleDeliveryFeeChange}
                        />
                    </div>
                </div>

                <div className="text-left">
                    <p className="text-xs text-brand-light">المجموع النهائي</p>
                    <p className="text-2xl font-bold font-mono">{(aggregatedItems.grandFoodTotal + currentDeliveryFee).toLocaleString()} <span className="text-sm">ل.س</span></p>
                </div>
                <button 
                  className="bg-brand-accent text-brand-dark font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors shadow-lg"
                  onClick={() => alert("سيتم إرسال الطلب إلى المطعم (قريباً)")}
                >
                    تأكيد الطلب
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantView;