import React, { useState, useMemo } from 'react';
import { Plus, Minus, ShoppingBag, ChevronDown, ArrowRight, Truck, Edit3, CheckCircle, Receipt, X, Lock, StopCircle, Trash2, Trash } from 'lucide-react';
import { Restaurant, User, OrderItem, MenuItem } from '../types';

interface RestaurantViewProps {
  restaurant: Restaurant;
  users: User[];
  currentOrderItems: OrderItem[];
  currentDeliveryFee: number;
  isOrderLocked: boolean;
  onUpdateOrder: (restaurantId: string, items: OrderItem[], deliveryFee: number) => void;
  onToggleLock: (restaurantId: string, locked: boolean) => void;
  onClearOrders: (restaurantId: string) => void;
  onBack: () => void;
}

const RestaurantView: React.FC<RestaurantViewProps> = ({ 
  restaurant, 
  users, 
  currentOrderItems, 
  currentDeliveryFee,
  isOrderLocked,
  onUpdateOrder,
  onToggleLock,
  onClearOrders,
  onBack
}) => {
  const [activeUserId, setActiveUserId] = useState<string>('');
  const [modalState, setModalState] = useState<'closed' | 'review'>('closed');
  
  // Note Editing State
  const [editingNoteFor, setEditingNoteFor] = useState<{itemId: string, userId: string} | null>(null);
  const [tempNote, setTempNote] = useState('');

  // Filter orders related to this restaurant only
  const myOrders = useMemo(() => currentOrderItems, [currentOrderItems]);

  // --- Handlers ---

  const handleAddItem = (item: MenuItem) => {
    if (isOrderLocked) return; // Prevention
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
        userName: user.name,
        notes: ''
      });
    }
    onUpdateOrder(restaurant.id, newOrders, currentDeliveryFee);
  };

  const handleRemoveItem = (item: MenuItem, userId: string) => {
     if (isOrderLocked) return; // Prevention
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

  const handleClearUserOrder = (userId: string) => {
    if (isOrderLocked) return;
    if (window.confirm("هل أنت متأكد من حذف كامل طلبك؟")) {
        // Filter out items belonging to this user
        const newOrders = myOrders.filter(o => o.userId !== userId);
        onUpdateOrder(restaurant.id, newOrders, currentDeliveryFee);
    }
  };

  const handleClearAllOrders = () => {
      const confirmMsg = isOrderLocked 
        ? "هل انتهيتم من هذا الطلب؟ سيتم حذف القائمة بالكامل وتجهيزها لطلب جديد."
        : "تحذير: سيتم حذف جميع طلبات الموظفين وتصفير القائمة. هل أنت متأكد؟";

      if (window.confirm(confirmMsg)) {
          // Use the atomic clear function passed from App.tsx
          onClearOrders(restaurant.id);
          setModalState('closed');
      }
  };

  const handleOpenNoteEditor = (orderItem: OrderItem) => {
      if (isOrderLocked) return;
      setEditingNoteFor({ itemId: orderItem.itemId, userId: orderItem.userId });
      setTempNote(orderItem.notes || '');
  };

  const handleSaveNote = () => {
      if (!editingNoteFor) return;
      
      const newOrders = myOrders.map(order => {
          if (order.userId === editingNoteFor.userId && order.itemId === editingNoteFor.itemId) {
              return { ...order, notes: tempNote };
          }
          return order;
      });
      
      onUpdateOrder(restaurant.id, newOrders, currentDeliveryFee);
      setEditingNoteFor(null);
      setTempNote('');
  };

  const handleDeliveryFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isOrderLocked) return;
      const val = parseInt(e.target.value) || 0;
      onUpdateOrder(restaurant.id, myOrders, val);
  };

  const handleStopReceivingOrders = () => {
      if (window.confirm("هل أنت متأكد من إيقاف استلام الطلبات؟ لن يتمكن أحد من التعديل بعد الآن.")) {
          onToggleLock(restaurant.id, true);
          // Keep modal open or close? Let's keep it open to show status
      }
  };

  // --- Calculations ---

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

  // Aggregation for Review Modal
  const aggregatedItems = useMemo(() => {
    const agg: Record<string, { name: string, count: number, price: number, notes: string[] }> = {};
    let grandFoodTotal = 0;

    myOrders.forEach(order => {
      if (!agg[order.itemId]) {
        agg[order.itemId] = { 
          name: order.menuItem.name, 
          count: 0,
          price: order.menuItem.price,
          notes: []
        };
      }
      agg[order.itemId].count += order.quantity;
      if (order.notes) {
          agg[order.itemId].notes.push(`${order.userName}: ${order.notes}`);
      }
      grandFoodTotal += order.menuItem.price * order.quantity;
    });

    return { items: Object.values(agg), grandFoodTotal };
  }, [myOrders]);

  const distinctUsersCount = Object.keys(ordersByUser).length;
  const deliveryPerUser = distinctUsersCount > 0 ? currentDeliveryFee / distinctUsersCount : 0;
  const grandTotal = aggregatedItems.grandFoodTotal + currentDeliveryFee;

  return (
    <div className="flex flex-col h-full gap-6 relative">
      
      {/* Locked Status Banner (For Latecomers) */}
      {isOrderLocked && (
          <div className="bg-red-500 text-white p-3 text-center font-bold text-lg shadow-md animate-in slide-in-from-top flex items-center justify-center gap-2">
              <Lock size={20} />
              <span>طلبنا ومشي الحال! (الطلب مغلق)</span>
          </div>
      )}

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
              disabled={isOrderLocked}
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
        <div className="flex-1 overflow-y-auto pb-48 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {restaurant.menu.map(item => (
              <div key={item.id} className={`bg-white rounded-2xl p-4 shadow-sm border border-transparent transition-all group flex flex-col justify-between h-full ${isOrderLocked ? 'opacity-60 grayscale-[0.5]' : 'hover:border-brand-light/50'}`}>
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
                    activeUserId && !isOrderLocked
                    ? 'bg-brand-dark text-white hover:bg-brand-light hover:text-brand-dark' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!activeUserId || isOrderLocked}
                >
                  {isOrderLocked ? <Lock size={18} /> : <Plus size={18} />}
                  <span>{isOrderLocked ? 'مغلق' : 'إضافة للطلب'}</span>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {Object.keys(ordersByUser).length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                 <ShoppingBag size={48} className="mb-2 opacity-20" />
                 <p>لم يطلب أحد بعد...</p>
               </div>
            ) : (
              Object.entries(ordersByUser).map(([userId, userOrder]) => {
                  const finalUserTotal = userOrder.foodTotal + deliveryPerUser;
                  return (
                    <div key={userId} className={`bg-white rounded-xl p-3 border shadow-sm transition-all ${userId === activeUserId ? 'border-brand-light ring-1 ring-brand-light' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-center mb-2 border-b border-dashed border-gray-200 pb-2">
                            <div className="flex flex-col">
                                <h4 className="font-bold text-brand-dark">{userOrder.name}</h4>
                                {/* Delete Personal Order Button */}
                                {!isOrderLocked && activeUserId === userId && (
                                    <button 
                                        onClick={() => handleClearUserOrder(userId)}
                                        className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1 mt-1 font-bold"
                                        title="حذف جميع طلباتي"
                                    >
                                        <Trash2 size={12} />
                                        <span>حذف طلبي</span>
                                    </button>
                                )}
                            </div>
                            <div className="text-left">
                                <span className="text-sm font-bold text-brand-light block">{finalUserTotal.toLocaleString()}</span>
                                {deliveryPerUser > 0 && (
                                    <span className="text-[10px] text-gray-400 block">(شامل التوصيل)</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-3">
                            {userOrder.items.map((orderItem, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                                <div className="flex justify-between items-start text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-brand-offwhite text-brand-dark px-2 rounded text-xs font-bold">{orderItem.quantity}x</span>
                                        <span className="text-gray-700 font-medium">{orderItem.menuItem.name}</span>
                                    </div>
                                    {!isOrderLocked && activeUserId === userId && (
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => handleOpenNoteEditor(orderItem)}
                                                className={`p-1 rounded-full transition-colors ${orderItem.notes ? 'bg-yellow-100 text-yellow-600' : 'text-gray-300 hover:bg-gray-100 hover:text-gray-600'}`}
                                                title="إضافة/تعديل ملاحظة"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button onClick={() => handleRemoveItem(orderItem.menuItem, userId)} className="text-red-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors">
                                                <Minus size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {orderItem.notes && (
                                    <p className="text-[11px] text-gray-500 mr-8 bg-gray-50 p-1 rounded border-r-2 border-brand-accent pr-2">
                                        {orderItem.notes}
                                    </p>
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

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-light/20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-40 p-4 md:mr-64 rounded-t-3xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-sm text-gray-500">المجموع الكلي (مع التوصيل)</span>
                <span className="text-3xl font-bold text-brand-dark font-mono">{grandTotal.toLocaleString()} <span className="text-base font-normal">ل.س</span></span>
            </div>
            
            <button 
                onClick={() => setModalState('review')}
                className="bg-brand-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-light hover:text-brand-dark transition-all shadow-lg flex items-center gap-2"
            >
                <Receipt size={20} />
                <span>مراجعة الطلب</span>
            </button>
        </div>
      </div>

      {/* Note Editor Modal */}
      {editingNoteFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-80 animate-in zoom-in-95 duration-200">
                  <h3 className="font-bold text-brand-dark mb-4">إضافة ملاحظة للصنف</h3>
                  <textarea 
                    autoFocus
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-dark outline-none min-h-[100px] resize-none"
                    placeholder="مثال: بدون مخلل، كتر طحينة..."
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                  />
                  <div className="flex gap-2 mt-4">
                      <button onClick={handleSaveNote} className="flex-1 bg-brand-dark text-white py-2 rounded-lg font-bold hover:bg-brand-light">حفظ</button>
                      <button onClick={() => setEditingNoteFor(null)} className="flex-1 bg-gray-100 text-gray-500 py-2 rounded-lg font-bold hover:bg-gray-200">إلغاء</button>
                  </div>
              </div>
          </div>
      )}

      {/* Review Modal */}
      {modalState === 'review' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className={`bg-brand-dark p-6 text-white flex justify-between items-center transition-colors duration-500`}>
                      <div className="flex items-center gap-3">
                          <Receipt size={32} />
                          <div>
                              <h2 className="text-2xl font-bold">ملخص الطلب النهائي</h2>
                              <p className="text-white/80 text-sm">يرجى مراجعة التفاصيل</p>
                          </div>
                      </div>
                      <button onClick={() => setModalState('closed')} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Modal Body (Scrollable) */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
                      {/* Aggregated List */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                          <table className="w-full text-right">
                              <thead className="bg-brand-offwhite text-brand-dark text-sm">
                                  <tr>
                                      <th className="p-4 font-bold">الصنف</th>
                                      <th className="p-4 font-bold text-center">الكمية</th>
                                      <th className="p-4 font-bold text-left">السعر الإفرادي</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {aggregatedItems.items.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                          <td className="p-4">
                                              <div className="font-bold text-gray-800">{item.name}</div>
                                              {/* Show Aggregated Notes */}
                                              {item.notes.length > 0 && (
                                                  <div className="mt-2 space-y-1">
                                                      {item.notes.map((note, nIdx) => (
                                                          <div key={nIdx} className="text-[11px] text-gray-500 bg-yellow-50 inline-block px-2 py-0.5 rounded mr-1 border border-yellow-100">
                                                              {note}
                                                          </div>
                                                      ))}
                                                  </div>
                                              )}
                                          </td>
                                          <td className="p-4 text-center">
                                              <span className="bg-brand-dark text-white px-3 py-1 rounded-lg font-bold text-sm">{item.count}</span>
                                          </td>
                                          <td className="p-4 text-left font-mono text-gray-600">
                                              {item.price.toLocaleString()}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>

                      {/* Delivery Fee Section */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 text-brand-dark">
                              <Truck size={24} />
                              <span className="font-bold">أجرة التوصيل</span>
                          </div>
                          {!isOrderLocked ? (
                              <input 
                                  type="number" 
                                  className="bg-gray-100 border border-gray-300 rounded-lg p-2 w-24 text-center font-bold focus:ring-2 focus:ring-brand-dark outline-none"
                                  placeholder="0"
                                  value={currentDeliveryFee > 0 ? currentDeliveryFee : ''}
                                  onChange={handleDeliveryFeeChange}
                              />
                          ) : (
                              <span className="font-bold font-mono text-xl">{currentDeliveryFee.toLocaleString()}</span>
                          )}
                      </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-white p-6 border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-end mb-6">
                          <span className="text-gray-500 font-bold">المجموع الكلي النهائي</span>
                          <span className="text-4xl font-bold text-brand-dark font-mono tracking-tight">{grandTotal.toLocaleString()} <span className="text-lg text-gray-400">ل.س</span></span>
                      </div>
                      
                      {!isOrderLocked ? (
                          <div className="space-y-3">
                            <button 
                                onClick={handleStopReceivingOrders}
                                className="w-full bg-red-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <StopCircle size={24} />
                                <span>إيقاف استلام الطلبات (قفل القائمة)</span>
                            </button>
                            <button 
                                onClick={handleClearAllOrders}
                                className="w-full bg-gray-100 text-gray-500 py-2 rounded-lg font-bold hover:bg-gray-200 transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <Trash size={16} />
                                <span>تصفير القائمة بالكامل (بدء من جديد)</span>
                            </button>
                          </div>
                      ) : (
                          <div className="space-y-3">
                             <div className="w-full bg-gray-100 text-gray-500 py-4 rounded-xl font-bold text-lg text-center flex items-center justify-center gap-2">
                                <Lock size={20} />
                                <span>الطلب مغلق حالياً</span>
                             </div>
                             <button 
                                onClick={handleClearAllOrders}
                                className="w-full border-2 border-red-100 text-red-400 py-3 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash size={18} />
                                <span>إنهاء وحذف القائمة بالكامل</span>
                            </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RestaurantView;